import type { CollectionStatus, WasteCategory } from "@/generated/prisma/client";

const transitions: Record<CollectionStatus, readonly CollectionStatus[]> = {
  SCHEDULED: ["IN_PROGRESS", "MISSED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "MISSED"],
  COMPLETED: [],
  MISSED: [],
  CANCELLED: [],
};

export function canTransition(from: CollectionStatus, to: CollectionStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}

export function estimatedCo2eKg(
  materials: ReadonlyArray<{ category: WasteCategory; weightKg: number }>,
): number {
  const recyclable = new Set<WasteCategory>(["PLASTIC", "PAPER", "GLASS", "METAL"]);
  const recoveredKg = materials.reduce(
    (sum, item) => sum + (recyclable.has(item.category) ? item.weightKg : 0),
    0,
  );
  // Project blueprint's provisional 2.5 kg CO2e/kg factor; this is an estimate, not measured impact.
  return Number((recoveredKg * 2.5).toFixed(2));
}
