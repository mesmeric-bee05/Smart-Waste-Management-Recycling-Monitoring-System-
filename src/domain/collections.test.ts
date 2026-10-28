import { describe, expect, it } from "vitest";
import { canTransition, estimatedCo2eKg } from "@/domain/collections";

describe("collection lifecycle", () => {
  it("allows scheduled work to start and blocks direct completion", () => {
    expect(canTransition("SCHEDULED", "IN_PROGRESS")).toBe(true);
    expect(canTransition("SCHEDULED", "COMPLETED")).toBe(false);
  });
  it("does not reopen terminal collection records", () => {
    expect(canTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("CANCELLED", "IN_PROGRESS")).toBe(false);
  });
  it("computes the blueprint's provisional estimate only for recyclable categories", () => {
    expect(
      estimatedCo2eKg([
        { category: "PLASTIC", weightKg: 2 },
        { category: "ORGANIC", weightKg: 4 },
      ]),
    ).toBe(5);
  });
});
