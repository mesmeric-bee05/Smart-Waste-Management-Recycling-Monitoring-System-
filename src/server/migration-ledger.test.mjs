import { describe, expect, it } from "vitest";
import { baselineIsComplete, MigrationGateError, summarizeLedger } from "../../scripts/migration-ledger.mjs";

const approvedMigrations = [
  { name: "20261028200524_init", sha256: "a".repeat(64) },
  { name: "20261028232800_collection_point_location_source", sha256: "b".repeat(64) },
];

function ledgerRow(name, checksum, overrides = {}) {
  return {
    migration_name: name,
    checksum,
    finished_at: new Date("2026-10-28T20:10:00.000Z"),
    rolled_back_at: null,
    ...overrides,
  };
}

describe("approved PostgreSQL migration ledger", () => {
  it("allows an empty ledger as a not-yet-applied baseline", () => {
    const applied = summarizeLedger([], approvedMigrations);
    expect(applied.size).toBe(0);
    expect(baselineIsComplete(applied, approvedMigrations)).toBe(false);
  });

  it("accepts only the complete approved history with matching SQL checksums", () => {
    const applied = summarizeLedger(
      [
        ledgerRow(approvedMigrations[0].name, approvedMigrations[0].sha256),
        ledgerRow(approvedMigrations[1].name, approvedMigrations[1].sha256),
      ],
      approvedMigrations,
    );
    expect(baselineIsComplete(applied, approvedMigrations)).toBe(true);
  });

  it("fails closed when an applied migration checksum differs from the approved SQL", () => {
    expect(() =>
      summarizeLedger(
        [
          ledgerRow(approvedMigrations[0].name, "c".repeat(64)),
          ledgerRow(approvedMigrations[1].name, approvedMigrations[1].sha256),
        ],
        approvedMigrations,
      ),
    ).toThrowError(MigrationGateError, /checksum does not match the approved SQL/);
  });

  it("rejects incomplete, unknown, duplicate, unfinished and rolled-back records", () => {
    expect(() =>
      summarizeLedger(
        [ledgerRow(approvedMigrations[0].name, approvedMigrations[0].sha256)],
        approvedMigrations,
      ),
    ).toThrow(/incomplete approved migration history/);
    expect(() =>
      summarizeLedger(
        [
          ledgerRow("unapproved_migration", "d".repeat(64)),
          ledgerRow(approvedMigrations[1].name, approvedMigrations[1].sha256),
        ],
        approvedMigrations,
      ),
    ).toThrow(/unapproved migration history/);
    expect(() =>
      summarizeLedger(
        [
          ledgerRow(approvedMigrations[0].name, approvedMigrations[0].sha256),
          ledgerRow(approvedMigrations[0].name, approvedMigrations[0].sha256),
        ],
        approvedMigrations,
      ),
    ).toThrow(/duplicate approved migration record/);
    expect(() =>
      summarizeLedger(
        [
          ledgerRow(approvedMigrations[0].name, approvedMigrations[0].sha256, { finished_at: null }),
          ledgerRow(approvedMigrations[1].name, approvedMigrations[1].sha256),
        ],
        approvedMigrations,
      ),
    ).toThrow(/incomplete or rolled-back/);
    expect(() =>
      summarizeLedger(
        [
          ledgerRow(approvedMigrations[0].name, approvedMigrations[0].sha256, {
            rolled_back_at: new Date("2026-10-29T08:00:00.000Z"),
          }),
          ledgerRow(approvedMigrations[1].name, approvedMigrations[1].sha256),
        ],
        approvedMigrations,
      ),
    ).toThrow(/incomplete or rolled-back/);
  });
});
