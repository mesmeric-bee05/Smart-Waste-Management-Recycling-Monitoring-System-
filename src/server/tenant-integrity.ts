import type { Prisma } from "@/generated/prisma/client";

export async function updateCollectionPointLastEmptiedAt(
  tx: Prisma.TransactionClient,
  pointId: string,
  organizationId: string,
  recordedAt: Date,
): Promise<void> {
  const result = await tx.collectionPoint.updateMany({
    where: { id: pointId, organizationId },
    data: { lastEmptiedAt: recordedAt },
  });
  if (result.count !== 1) throw new Error("Collection point does not belong to this organization.");
}
