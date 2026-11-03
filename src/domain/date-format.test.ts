import { describe, expect, it } from "vitest";
import { formatUtcDate, formatUtcDateTime, formatUtcTime } from "@/domain/date-format";

describe("stable UTC date formatting", () => {
  const instant = new Date("2026-11-01T14:32:45.000Z");

  it("formats dates without depending on locale or host time zone", () => {
    expect(formatUtcDate(instant)).toBe("2026-11-01 UTC");
    expect(formatUtcTime(instant)).toBe("14:32 UTC");
    expect(formatUtcDateTime(instant)).toBe("2026-11-01 14:32 UTC");
  });

  it("accepts ISO timestamps and gives safe fallbacks for invalid input", () => {
    expect(formatUtcDateTime("2026-11-01T14:32:45.000Z")).toBe("2026-11-01 14:32 UTC");
    expect(formatUtcDate("not-a-date")).toBe("Unknown date");
    expect(formatUtcTime("not-a-date")).toBe("Unknown time");
    expect(formatUtcDateTime("not-a-date")).toBe("Unknown time");
  });
});
