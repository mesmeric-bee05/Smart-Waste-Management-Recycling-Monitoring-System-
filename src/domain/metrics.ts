export type MaterialRow = { category: string; weightKg: number };

export function totalWeightKg(rows: ReadonlyArray<MaterialRow>): number {
  return Number(rows.reduce((sum, row) => sum + row.weightKg, 0).toFixed(2));
}

export function recycledWeightKg(rows: ReadonlyArray<MaterialRow>): number {
  const recyclable = new Set(["PLASTIC", "PAPER", "GLASS", "METAL"]);
  return totalWeightKg(rows.filter((row) => recyclable.has(row.category)));
}

export function diversionRatePct(divertedKg: number, totalKg: number): number | null {
  if (!Number.isFinite(divertedKg) || !Number.isFinite(totalKg) || totalKg <= 0) return null;
  return Math.min(100, Math.max(0, Number(((divertedKg / totalKg) * 100).toFixed(1))));
}

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
