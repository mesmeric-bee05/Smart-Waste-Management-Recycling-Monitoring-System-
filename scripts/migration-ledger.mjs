export class MigrationGateError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "MigrationGateError";
    this.safeCode = code;
  }
}

export function summarizeLedger(rows, approvedMigrations) {
  if (rows.length === 0) return new Set();

  if (rows.length !== approvedMigrations.length) {
    throw new MigrationGateError(
      "The database contains incomplete approved migration history; manual review is required",
    );
  }

  const approvedByName = new Map(approvedMigrations.map((migration) => [migration.name, migration]));
  const applied = new Set();
  for (const row of rows) {
    const migration = approvedByName.get(row.migration_name);
    if (!migration) {
      throw new MigrationGateError(
        "The database contains an unapproved migration history; no changes were made",
      );
    }
    if (row.checksum !== migration.sha256) {
      throw new MigrationGateError(
        "The database migration ledger checksum does not match the approved SQL; manual review is required",
      );
    }
    if (row.finished_at === null || row.rolled_back_at !== null) {
      throw new MigrationGateError(
        "The database contains an incomplete or rolled-back migration record; manual review is required",
      );
    }
    if (applied.has(row.migration_name)) {
      throw new MigrationGateError(
        "The database contains a duplicate approved migration record; manual review is required",
      );
    }
    applied.add(row.migration_name);
  }

  return applied;
}

export function baselineIsComplete(applied, approvedMigrations) {
  return approvedMigrations.every((migration) => applied.has(migration.name));
}
