import { describe, expect, it } from "vitest";
import { greedyPreview, haversineKm } from "@/domain/routing";

const points = [
  { id: "a", code: "A", name: "A", latitude: 0, longitude: 0 },
  { id: "b", code: "B", name: "B", latitude: 0, longitude: 1 },
  { id: "c", code: "C", name: "C", latitude: 1, longitude: 1 },
];

describe("human-reviewed route preview", () => {
  it("uses great-circle distances with kilometers", () =>
    expect(haversineKm(points[0]!, points[1]!)).toBeCloseTo(111.2, 0));
  it("starts at the selected point and visits each unique point once", () => {
    const result = greedyPreview(points, "c");
    expect(result[0]?.id).toBe("c");
    expect(new Set(result.map((point) => point.id)).size).toBe(3);
    expect(result[0]?.legKm).toBe(0);
  });
  it("returns an empty route for no scheduled stops", () => expect(greedyPreview([])).toEqual([]));
});
