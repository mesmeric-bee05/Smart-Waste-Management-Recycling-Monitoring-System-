import { z } from "zod";
import { pointSchema } from "@/domain/schemas";
import { prisma } from "@/server/db";
import { requireActor } from "@/server/authorization";
import { writeAudit } from "@/server/audit";

export async function createPoint(raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR"]);
  const { confirmCoordinatesReviewed: _confirm, ...input } = pointSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    const point = await tx.collectionPoint.create({
      data: {
        ...input,
        locationSource: "MANUAL",
        organizationId: actor.organizationId,
        createdById: actor.id,
      },
    });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "point.create",
      entityType: "CollectionPoint",
      entityId: point.id,
      metadata: { code: point.code },
    });
    return point;
  });
}

export async function updatePoint(id: string, raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR"]);
  const pointId = z.string().uuid().parse(id);
  const { confirmCoordinatesReviewed, ...input } = pointSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    const previous = await tx.collectionPoint.findFirst({
      where: { id: pointId, organizationId: actor.organizationId, isActive: true },
      select: { code: true, locationSource: true },
    });
    if (!previous) throw new Error("Collection point not found or inactive.");
    const point = await tx.collectionPoint.update({
      where: { id: pointId },
      data: {
        ...input,
        ...(previous.locationSource === "SIMULATED" && confirmCoordinatesReviewed
          ? { locationSource: "MANUAL" as const }
          : {}),
      },
    });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "point.update",
      entityType: "CollectionPoint",
      entityId: pointId,
      metadata: { previousCode: previous.code, code: point.code },
    });
    return point;
  });
}

export async function deactivatePoint(id: string) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR"]);
  const pointId = z.string().uuid().parse(id);
  return prisma.$transaction(async (tx) => {
    const point = await tx.collectionPoint.findFirst({
      where: { id: pointId, organizationId: actor.organizationId, isActive: true },
    });
    if (!point) throw new Error("Collection point not found or inactive.");
    const updated = await tx.collectionPoint.update({ where: { id: pointId }, data: { isActive: false } });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "point.deactivate",
      entityType: "CollectionPoint",
      entityId: pointId,
      metadata: { code: point.code },
    });
    return updated;
  });
}
