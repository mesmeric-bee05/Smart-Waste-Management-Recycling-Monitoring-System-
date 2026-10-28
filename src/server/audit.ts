import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";

export type AuditClient = typeof prisma | Prisma.TransactionClient;

export async function writeAudit(
  client: AuditClient,
  event: {
    organizationId: string;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonObject;
  },
) {
  return client.auditLog.create({
    data: {
      organizationId: event.organizationId,
      actorId: event.actorId ?? null,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      metadata: event.metadata ?? {},
    },
  });
}
