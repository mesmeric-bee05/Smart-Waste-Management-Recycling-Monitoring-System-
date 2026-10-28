import { publicRequestSchema, requestResolutionSchema } from "@/domain/schemas";
import { prisma } from "@/server/db";
import { requireActor } from "@/server/authorization";
import { writeAudit } from "@/server/audit";

const DEFAULT_ORGANIZATION_SLUG = "wasteops-demo";

export async function createPublicRequest(raw: unknown) {
  const input = publicRequestSchema.parse(raw);
  const organization = await prisma.organization.findUnique({
    where: { slug: DEFAULT_ORGANIZATION_SLUG },
    select: { id: true },
  });
  if (!organization) throw new Error("Public request intake is not configured.");
  const pointId = input.pointId || null;
  return prisma.$transaction(async (tx) => {
    if (pointId) {
      const point = await tx.collectionPoint.findFirst({
        where: { id: pointId, organizationId: organization.id, isActive: true },
        select: { id: true },
      });
      if (!point) throw new Error("Choose a valid collection point.");
    }
    const result = await tx.collectionRequest.create({
      data: {
        organizationId: organization.id,
        pointId,
        requesterName: input.requesterName || null,
        contactEmail: input.contactEmail || null,
        message: input.message,
      },
      select: { id: true, createdAt: true },
    });
    await writeAudit(tx, {
      organizationId: organization.id,
      action: "request.submit",
      entityType: "CollectionRequest",
      entityId: result.id,
      metadata: { source: "public_portal" },
    });
    return result;
  });
}

export async function updateRequest(raw: unknown) {
  const actor = await requireActor(["ADMIN", "SUPERVISOR"]);
  const input = requestResolutionSchema.parse(raw);
  return prisma.$transaction(async (tx) => {
    const current = await tx.collectionRequest.findFirst({
      where: { id: input.requestId, organizationId: actor.organizationId },
    });
    if (!current) throw new Error("Request not found.");
    const allowed: readonly string[] =
      current.status === "OPEN"
        ? ["ACKNOWLEDGED", "REJECTED"]
        : current.status === "ACKNOWLEDGED"
          ? ["RESOLVED", "REJECTED"]
          : [];
    if (!allowed.includes(input.nextStatus))
      throw new Error(`This request cannot move from ${current.status} to ${input.nextStatus}.`);
    const terminal = input.nextStatus === "RESOLVED" || input.nextStatus === "REJECTED";
    const updated = await tx.collectionRequest.update({
      where: { id: current.id },
      data: {
        status: input.nextStatus,
        handledById: actor.id,
        resolutionNote: input.resolutionNote || null,
        resolvedAt: terminal ? new Date() : null,
      },
    });
    await writeAudit(tx, {
      organizationId: actor.organizationId,
      actorId: actor.id,
      action: `request.${input.nextStatus.toLowerCase()}`,
      entityType: "CollectionRequest",
      entityId: current.id,
      metadata: { from: current.status, to: input.nextStatus },
    });
    return updated;
  });
}
