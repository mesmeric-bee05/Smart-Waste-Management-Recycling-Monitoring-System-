import { CollectionStatus } from "@/generated/prisma/client";
import { canTransition, estimatedCo2eKg } from "@/domain/collections";
import { collectionCompletionSchema, scheduleSchema, statusSchema } from "@/domain/schemas";
import { prisma } from "@/server/db";
import { requireActor } from "@/server/authorization";
import { writeAudit } from "@/server/audit";

export async function scheduleCollection(raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR"]);
  const input = scheduleSchema.parse(raw);
  const collectorId = input.assignedCollectorId || null;
  return prisma.$transaction(async (tx) => {
    const point = await tx.collectionPoint.findFirst({
      where: { id: input.pointId, organizationId: actor.organizationId, isActive: true },
      select: { id: true },
    });
    if (!point) throw new Error("Choose an active collection point in your organization.");
    if (collectorId) {
      const collector = await tx.user.findFirst({
        where: { id: collectorId, organizationId: actor.organizationId, role: "COLLECTOR", isActive: true },
        select: { id: true },
      });
      if (!collector) throw new Error("The selected collector is not active in your organization.");
    }
    const collection = await tx.collection.create({
      data: {
        organizationId: actor.organizationId,
        pointId: input.pointId,
        assignedCollectorId: collectorId,
        createdById: actor.id,
        scheduledAt: new Date(input.scheduledAt),
        notes: input.notes || null,
      },
    });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "collection.schedule",
      entityType: "Collection",
      entityId: collection.id,
      metadata: { pointId: input.pointId, status: collection.status },
    });
    return collection;
  });
}

export async function startCollection(raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR", "COLLECTOR"]);
  const details = typeof raw === "object" && raw !== null ? raw : {};
  const input = statusSchema.parse({ ...details, nextStatus: "IN_PROGRESS" });
  return transition(actor, input.collectionId, "IN_PROGRESS");
}

export async function markCollectionException(raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR", "COLLECTOR"]);
  const parsed = statusSchema.parse(raw);
  if (parsed.nextStatus === "IN_PROGRESS") throw new Error("Choose a valid exception status.");
  if (actor.role === "COLLECTOR" && parsed.nextStatus !== "MISSED")
    throw new Error("Collectors may mark only their own assigned collections as missed.");
  return transition(actor, parsed.collectionId, parsed.nextStatus);
}

async function transition(
  actor: { id: string; organizationId: string; role: string },
  id: string,
  next: CollectionStatus,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.collection.findFirst({ where: { id, organizationId: actor.organizationId } });
    if (!current) throw new Error("Collection not found.");
    if (actor.role === "COLLECTOR" && current.assignedCollectorId !== actor.id)
      throw new Error("Collectors can update only their own assigned collections.");
    if (!canTransition(current.status, next))
      throw new Error(`This collection cannot move from ${current.status} to ${next}.`);
    const now = new Date();
    const updated = await tx.collection.update({
      where: { id: current.id, organizationId: actor.organizationId, status: current.status },
      data: { status: next, startedAt: next === "IN_PROGRESS" ? now : current.startedAt },
    });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: `collection.${next.toLowerCase()}`,
      entityType: "Collection",
      entityId: id,
      metadata: { from: current.status, to: next },
    });
    return updated;
  });
}

export async function completeCollection(raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR", "COLLECTOR"]);
  const input = collectionCompletionSchema.parse(raw);
  const normalized = new Map<string, number>();
  for (const item of input.materials)
    normalized.set(item.category, (normalized.get(item.category) ?? 0) + item.weightKg);
  const materials = [...normalized.entries()].map(([category, weightKg]) => ({
    category: category as (typeof input.materials)[number]["category"],
    weightKg,
  }));
  return prisma.$transaction(async (tx) => {
    const current = await tx.collection.findFirst({
      where: { id: input.collectionId, organizationId: actor.organizationId },
    });
    if (!current) throw new Error("Collection not found.");
    if (actor.role === "COLLECTOR" && current.assignedCollectorId !== actor.id)
      throw new Error("Collectors can complete only their own assigned collections.");
    if (current.status !== "IN_PROGRESS") throw new Error("Start the collection before completing it.");
    const estimate = estimatedCo2eKg(materials);
    const updated = await tx.collection.update({
      where: { id: current.id, organizationId: actor.organizationId, status: "IN_PROGRESS" },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        notes: input.notes || current.notes,
        estimatedCo2eKg: estimate,
        materials: { deleteMany: {}, create: materials },
      },
    });
    await tx.collectionPoint.update({ where: { id: current.pointId }, data: { lastEmptiedAt: new Date() } });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: "collection.complete",
      entityType: "Collection",
      entityId: current.id,
      metadata: { materialCount: materials.length, estimateFactor: 2.5 },
    });
    return updated;
  });
}
