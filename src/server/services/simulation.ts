import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { requireActor } from "@/server/authorization";
import { allowRequest } from "@/server/rate-limit";
import { writeAudit } from "@/server/audit";

export async function advanceSimulation() {
  const actor = await requireActor(["ADMIN", "SUPERVISOR"]);
  const forwardedHeaders = await headers();
  const request = new Request("http://wasteops.local/simulation", { headers: forwardedHeaders });
  if (!allowRequest(request, "simulation-tick", 6, 60_000))
    throw new Error("Simulation updates are limited to six per minute. Please wait and try again.");
  const now = new Date();
  const points = await prisma.collectionPoint.findMany({
    where: { organizationId: actor.organizationId, isActive: true },
    select: { id: true },
    take: 50,
    orderBy: { code: "asc" },
  });
  if (!points.length) throw new Error("Add a collection point before advancing the simulation.");
  const vehicles = await prisma.vehicle.findMany({
    where: { organizationId: actor.organizationId, isActive: true },
    select: { id: true },
    take: 2,
    orderBy: { code: "asc" },
  });
  const uniqueTick = now.getTime();
  const results = await prisma.$transaction(async (tx) => {
    let readingCount = 0;
    for (const [index, point] of points.entries()) {
      if ((index + uniqueTick) % 3 !== 0) continue;
      const previous = await tx.binReading.findFirst({
        where: { pointId: point.id },
        orderBy: { recordedAt: "desc" },
        select: { fillPct: true },
      });
      const fillPct =
        previous && previous.fillPct >= 95
          ? 8
          : Math.min(100, (previous?.fillPct ?? 15) + 4 + ((index * 7 + uniqueTick) % 10));
      await tx.binReading.create({
        data: {
          pointId: point.id,
          fillPct,
          weightKg: Number((fillPct * 1.8).toFixed(1)),
          source: "SIMULATED",
          isSimulated: true,
          recordedAt: now,
          idempotencyKey: `simulation:${point.id}:${uniqueTick}`,
        },
      });
      readingCount += 1;
    }
    for (const [index, vehicle] of vehicles.entries()) {
      const point = points[(uniqueTick + index * 5) % points.length];
      if (!point) continue;
      const reference = await tx.collectionPoint.findUnique({
        where: { id: point.id },
        select: { latitude: true, longitude: true },
      });
      if (!reference) continue;
      await tx.vehiclePing.create({
        data: {
          vehicleId: vehicle.id,
          latitude: reference.latitude + ((uniqueTick % 11) - 5) * 0.0008,
          longitude: reference.longitude + ((uniqueTick % 13) - 6) * 0.0007,
          recordedAt: now,
          source: "SIMULATED",
          isSimulated: true,
          idempotencyKey: `simulation:${vehicle.id}:${uniqueTick}`,
        },
      });
    }
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "simulation.tick",
      entityType: "Simulation",
      metadata: { readingCount, vehicleCount: vehicles.length, source: "SIMULATED" },
    });
    return { readingCount, vehicleCount: vehicles.length, recordedAt: now.toISOString() };
  });
  return results;
}
