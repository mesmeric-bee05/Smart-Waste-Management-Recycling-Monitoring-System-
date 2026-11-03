import type { Prisma } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";
import { updateCollectionPointLastEmptiedAt } from "@/server/tenant-integrity";

function transactionWith(updateMany: ReturnType<typeof vi.fn>) {
  return { collectionPoint: { updateMany } } as unknown as Prisma.TransactionClient;
}

describe("tenant-scoped collection-point writes", () => {
  it("limits the side-effect update to the actor's organization", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const recordedAt = new Date("2026-11-01T12:00:00.000Z");

    await updateCollectionPointLastEmptiedAt(transactionWith(updateMany), "point-a", "org-a", recordedAt);

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "point-a", organizationId: "org-a" },
      data: { lastEmptiedAt: recordedAt },
    });
  });

  it("fails closed when the related point is outside the actor's organization", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      updateCollectionPointLastEmptiedAt(
        transactionWith(updateMany),
        "point-from-another-org",
        "org-a",
        new Date("2026-11-01T12:00:00.000Z"),
      ),
    ).rejects.toThrow("Collection point does not belong to this organization.");
  });
});
