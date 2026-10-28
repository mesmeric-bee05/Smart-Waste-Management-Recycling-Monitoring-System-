import { describe, expect, it } from "vitest";
import { parseScheduleDateAtNoonUtc } from "@/domain/dates";

describe("schedule calendar dates", () => {
  it("preserves a valid leap day at UTC noon", () => {
    expect(parseScheduleDateAtNoonUtc("2024-02-29")?.toISOString()).toBe("2024-02-29T12:00:00.000Z");
  });

  it("rejects impossible dates that JavaScript would otherwise normalize", () => {
    expect(parseScheduleDateAtNoonUtc("2026-02-31")).toBeNull();
    expect(parseScheduleDateAtNoonUtc("2026-02-29")).toBeNull();
  });

  it("rejects values outside the exact calendar-date format", () => {
    expect(parseScheduleDateAtNoonUtc("2026-2-03")).toBeNull();
    expect(parseScheduleDateAtNoonUtc("tomorrow")).toBeNull();
  });
});
