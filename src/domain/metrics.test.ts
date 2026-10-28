import { describe, expect, it } from "vitest";
import { csvCell, diversionRatePct, recycledWeightKg, totalWeightKg } from "@/domain/metrics";

const materials = [
  { category: "PLASTIC", weightKg: 12.5 },
  { category: "PAPER", weightKg: 4 },
  { category: "ORGANIC", weightKg: 8 },
];

describe("waste metrics", () => {
  it("totals weights without unit ambiguity", () => expect(totalWeightKg(materials)).toBe(24.5));
  it("counts recyclable material categories only", () => expect(recycledWeightKg(materials)).toBe(16.5));
  it("returns null when the denominator is unavailable", () => expect(diversionRatePct(1, 0)).toBeNull());
  it("calculates a bounded percentage", () => expect(diversionRatePct(25, 100)).toBe(25));
  it("protects exported cells against formula injection", () => {
    expect(csvCell('=HYPERLINK("https://bad.example")')).toContain("'=HYPERLINK");
    expect(csvCell("North sector")).toBe('"North sector"');
  });
});
