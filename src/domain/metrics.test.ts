import { describe, expect, it } from "vitest";
import {
  csvCell,
  eligibleCategorySharePct,
  eligibleCategoryWeightKg,
  sourceProvenanceLabel,
  totalWeightKg,
} from "@/domain/metrics";

const materials = [
  { category: "PLASTIC", weightKg: 12.5 },
  { category: "PAPER", weightKg: 4 },
  { category: "ORGANIC", weightKg: 8 },
];

describe("waste metrics", () => {
  it("totals weights without unit ambiguity", () => expect(totalWeightKg(materials)).toBe(24.5));
  it("counts only categories that may be recyclable", () =>
    expect(eligibleCategoryWeightKg(materials)).toBe(16.5));
  it("returns null when the denominator is unavailable", () =>
    expect(eligibleCategorySharePct(1, 0)).toBeNull());
  it("calculates a bounded category share, not verified diversion", () =>
    expect(eligibleCategorySharePct(25, 100)).toBe(25));
  it("preserves the source enum while keeping synthetic records unmistakably simulated", () => {
    expect(sourceProvenanceLabel("SIMULATED", true)).toBe("SIMULATED");
    expect(sourceProvenanceLabel("MANUAL", false)).toBe("MANUAL");
    expect(sourceProvenanceLabel("IMPORTED", true)).toBe("IMPORTED · SIMULATED");
    expect(sourceProvenanceLabel("DEVICE", false)).toBe("DEVICE");
    expect(sourceProvenanceLabel("untrusted", false)).toBe("UNKNOWN");
  });
  it("protects exported cells against formula injection", () => {
    expect(csvCell('=HYPERLINK("https://bad.example")')).toContain("'=HYPERLINK");
    expect(csvCell("North sector")).toBe('"North sector"');
  });
});
