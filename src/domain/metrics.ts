export type MaterialRow = { category: string; weightKg: number };

const potentiallyRecyclableCategories = new Set(["PLASTIC", "PAPER", "GLASS", "METAL"]);
const allowedSources = new Set(["SIMULATED", "MANUAL", "IMPORTED", "DEVICE"]);

export function totalWeightKg(rows: ReadonlyArray<MaterialRow>): number {
  return Number(rows.reduce((sum, row) => sum + row.weightKg, 0).toFixed(2));
}

export function eligibleCategoryWeightKg(rows: ReadonlyArray<MaterialRow>): number {
  return totalWeightKg(rows.filter((row) => potentiallyRecyclableCategories.has(row.category)));
}

export function eligibleCategorySharePct(eligibleKg: number, totalKg: number): number | null {
  if (!Number.isFinite(eligibleKg) || !Number.isFinite(totalKg) || totalKg <= 0) return null;
  return Math.min(100, Math.max(0, Number(((eligibleKg / totalKg) * 100).toFixed(1))));
}

export function sourceProvenanceLabel(source: string, isSimulated: boolean): string {
  const normalizedSource = source.toUpperCase();
  const safeSource = allowedSources.has(normalizedSource) ? normalizedSource : "UNKNOWN";
  return isSimulated && safeSource !== "SIMULATED" ? `${safeSource} · SIMULATED` : safeSource;
}

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
