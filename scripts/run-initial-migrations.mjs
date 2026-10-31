import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";

const { Client } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDirectory = path.join(projectRoot, "prisma", "migrations");
const migrationGateName = "WASTEOPS_RUN_INITIAL_MIGRATIONS";
const approvedMigrations = [
  {
    name: "20261028200524_init",
    sha256: "c9b8df6a14795c5a12eb16c7e195bfbb429b7689457b5f31c2f13b7286c6012c",
  },
  {
    name: "20261028232800_collection_point_location_source",
    sha256: "fa2a6433f0055fd5872ab943b9e82842de2e708546b5ff8cac87bd4fe440bde7",
  },
  {
    name: "20261028234000_audit_log_append_only",
    sha256: "a09ddca90325365f303adfaa7cfc5f665150a0c776459eb9164d8ee95336b0bf",
  },
];
const approvedNames = new Set(approvedMigrations.map((migration) => migration.name));

class MigrationGateError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "MigrationGateError";
    this.safeCode = code;
  }
}

function errorCode(error) {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && /^[A-Z0-9_]{1,32}$/.test(code) ? code : undefined;
}

function parseDatabaseTarget(connectionString, variableName) {
  const directUrlHelp = `${variableName} must be a direct PostgreSQL URL using postgres:// or postgresql:// with a host and database; omit key= prefixes, shell commands, quotes, and whitespace`;
  if (
    typeof connectionString !== "string" ||
    !connectionString ||
    connectionString.trim() !== connectionString ||
    /\s/.test(connectionString)
  ) {
    throw new MigrationGateError(directUrlHelp);
  }

  let parsed;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new MigrationGateError(directUrlHelp);
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new MigrationGateError(directUrlHelp);
  }
  if (!parsed.hostname) {
    throw new MigrationGateError(`${variableName} must include a PostgreSQL host`);
  }

  let database;
  try {
    database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    throw new MigrationGateError(`${variableName} has an invalid database name`);
  }
  if (!database) throw new MigrationGateError(`${variableName} must include a database name`);

  const schema = parsed.searchParams.get("schema") ?? "public";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new MigrationGateError("The configured PostgreSQL schema name is unsupported");
  }

  let username;
  try {
    username = decodeURIComponent(parsed.username);
  } catch {
    throw new MigrationGateError(`${variableName} has an invalid role name`);
  }

  return {
    host: parsed.hostname.toLowerCase(),
    port: parsed.port || "5432",
    database,
    schema,
    username,
  };
}

function assertSameDatabaseTarget(runtimeConnectionString, migrationConnectionString) {
  const runtimeTarget = parseDatabaseTarget(runtimeConnectionString, "POSTGRES_DATABASE_URL");
  const migrationTarget = parseDatabaseTarget(migrationConnectionString, "POSTGRES_MIGRATION_DATABASE_URL");
  if (
    runtimeTarget.host !== migrationTarget.host ||
    runtimeTarget.port !== migrationTarget.port ||
    runtimeTarget.database !== migrationTarget.database ||
    runtimeTarget.schema !== migrationTarget.schema
  ) {
    throw new MigrationGateError(
      "POSTGRES_DATABASE_URL and POSTGRES_MIGRATION_DATABASE_URL must target the same host, port, database, and schema",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    (!runtimeTarget.username ||
      !migrationTarget.username ||
      runtimeTarget.username === migrationTarget.username)
  ) {
    throw new MigrationGateError(
      "Production runtime and migration PostgreSQL URLs must name distinct database roles",
    );
  }
}

function parseSchema(connectionString) {
  return parseDatabaseTarget(connectionString, "POSTGRES_MIGRATION_DATABASE_URL").schema;
}

function migrationTable(schema) {
  return `"${schema}"."_prisma_migrations"`;
}

async function readMigrationLedger(connectionString) {
  const schema = parseSchema(connectionString);
  const client = new Client({
    connectionString,
    application_name: "WasteOpsInitialMigrationGate",
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
  });
  let connected = false;

  try {
    await client.connect();
    connected = true;
    try {
      const result = await client.query(
        `SELECT migration_name, finished_at, rolled_back_at FROM ${migrationTable(schema)} ORDER BY migration_name`,
      );
      return result.rows;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "42P01") return [];
      throw new MigrationGateError("Unable to read the PostgreSQL migration ledger", errorCode(error));
    }
  } catch (error) {
    if (error instanceof MigrationGateError) throw error;
    throw new MigrationGateError("Unable to connect to the configured PostgreSQL database", errorCode(error));
  } finally {
    if (connected) await client.end().catch(() => undefined);
  }
}

async function assertEmptyTargetSchema(connectionString) {
  const schema = parseSchema(connectionString);
  const client = new Client({
    connectionString,
    application_name: "WasteOpsInitialMigrationGate",
    connectionTimeoutMillis: 5_000,
    query_timeout: 5_000,
  });
  let connected = false;

  try {
    await client.connect();
    connected = true;
    const result = await client.query(
      `SELECT c.relname
       FROM pg_catalog.pg_class AS c
       JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
       WHERE n.nspname = $1
         AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
         AND c.relname <> '_prisma_migrations'
       LIMIT 1`,
      [schema],
    );
    if (result.rows.length > 0) {
      throw new MigrationGateError(
        "The target schema contains objects without an approved migration history; no changes were made",
      );
    }
  } catch (error) {
    if (error instanceof MigrationGateError) throw error;
    throw new MigrationGateError("Unable to verify that the new target schema is empty", errorCode(error));
  } finally {
    if (connected) await client.end().catch(() => undefined);
  }
}

function summarizeLedger(rows) {
  if (rows.length === 0) return new Set();

  if (rows.length !== approvedMigrations.length) {
    throw new MigrationGateError(
      "The database contains incomplete approved migration history; manual review is required",
    );
  }

  const applied = new Set();
  for (const row of rows) {
    if (!approvedNames.has(row.migration_name)) {
      throw new MigrationGateError(
        "The database contains an unapproved migration history; no changes were made",
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

function baselineIsComplete(applied) {
  return approvedMigrations.every((migration) => applied.has(migration.name));
}

async function verifyApprovedMigrationBundle() {
  let directories;
  try {
    directories = (await readdir(migrationsDirectory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    throw new MigrationGateError("The approved migration bundle is unavailable; refusing to run migrations");
  }

  const expectedDirectories = approvedMigrations.map((migration) => migration.name).sort();
  if (JSON.stringify(directories) !== JSON.stringify(expectedDirectories)) {
    throw new MigrationGateError(
      "The migration directory differs from the approved baseline; refusing to run migrations",
    );
  }

  for (const migration of approvedMigrations) {
    let sql;
    try {
      sql = await readFile(path.join(migrationsDirectory, migration.name, "migration.sql"));
    } catch {
      throw new MigrationGateError("An approved migration file is unavailable; refusing to run migrations");
    }
    const digest = createHash("sha256").update(sql).digest("hex");
    if (digest !== migration.sha256) {
      throw new MigrationGateError("An approved migration file has changed; refusing to run migrations");
    }
  }

  let lockFile;
  try {
    lockFile = await readFile(path.join(migrationsDirectory, "migration_lock.toml"), "utf8");
  } catch {
    throw new MigrationGateError(
      "The PostgreSQL migration lock file is unavailable; refusing to run migrations",
    );
  }
  if (!/^provider\s*=\s*"postgresql"\s*$/m.test(lockFile)) {
    throw new MigrationGateError("The migration provider is not PostgreSQL; refusing to run migrations");
  }
}

function prismaFailureCode(result) {
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = text.match(/\b(?:P\d{4}|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EACCES|42501)\b/);
  return match?.[0];
}

function runPrismaDeploy(migrationConnectionString) {
  const prismaCli = path.join(projectRoot, "node_modules", ".bin", "prisma");
  const prismaEnv = {
    ...process.env,
    POSTGRES_DATABASE_URL: migrationConnectionString,
  };
  delete prismaEnv.POSTGRES_MIGRATION_DATABASE_URL;
  delete prismaEnv.DATABASE_URL;
  delete prismaEnv.DRIZZLE_DATABASE_URL;
  delete prismaEnv.AUTH_SECRET;
  delete prismaEnv.WASTEOPS_RUN_INITIAL_MIGRATIONS;
  const result = spawnSync(
    process.execPath,
    [prismaCli, "migrate", "deploy", "--config", path.join(projectRoot, "prisma.config.ts")],
    {
      cwd: projectRoot,
      env: prismaEnv,
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 256 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.error || result.status !== 0) {
    throw new MigrationGateError(
      "Prisma migrate deploy failed; the application will not start",
      errorCode(result.error) ?? prismaFailureCode(result),
    );
  }
}

async function verifyLedger(connectionString) {
  const applied = summarizeLedger(await readMigrationLedger(connectionString));
  if (!baselineIsComplete(applied)) {
    throw new MigrationGateError("The approved migration baseline is incomplete");
  }
  console.log("[wasteops-db] Verified the three approved initial migrations.");
}

async function runStartupGate() {
  const gate = process.env[migrationGateName];
  if (gate === undefined || gate === "" || gate === "false") {
    console.log("[wasteops-db] Initial migration gate is off; no database migration was attempted.");
    return;
  }
  if (gate !== "true") {
    throw new MigrationGateError(`${migrationGateName} must be exactly true or false`);
  }

  const runtimeConnectionString = process.env.POSTGRES_DATABASE_URL;
  if (!runtimeConnectionString) {
    throw new MigrationGateError(
      "POSTGRES_DATABASE_URL is required when the initial migration gate is enabled",
    );
  }
  const migrationConnectionString = process.env.POSTGRES_MIGRATION_DATABASE_URL;
  if (!migrationConnectionString) {
    throw new MigrationGateError(
      "POSTGRES_MIGRATION_DATABASE_URL is required when the initial migration gate is enabled",
    );
  }

  assertSameDatabaseTarget(runtimeConnectionString, migrationConnectionString);
  await verifyApprovedMigrationBundle();
  const applied = summarizeLedger(await readMigrationLedger(migrationConnectionString));
  if (baselineIsComplete(applied)) {
    console.log("[wasteops-db] Approved initial baseline is already recorded; skipping migrations.");
    return;
  }
  if (applied.size === 0) await assertEmptyTargetSchema(migrationConnectionString);

  console.log("[wasteops-db] Applying the exact approved initial migration bundle.");
  runPrismaDeploy(migrationConnectionString);
  await verifyLedger(migrationConnectionString);
}

async function main() {
  const mode = process.argv[2] ?? "--startup";
  if (mode === "--verify") {
    const connectionString = process.env.POSTGRES_MIGRATION_DATABASE_URL;
    if (!connectionString)
      throw new MigrationGateError("POSTGRES_MIGRATION_DATABASE_URL is required for ledger verification");
    await verifyLedger(connectionString);
    return;
  }
  if (mode !== "--startup") throw new MigrationGateError("Unsupported migration runner mode");
  await runStartupGate();
}

main().catch((error) => {
  const message =
    error instanceof MigrationGateError ? error.message : "Initial migration gate failed closed";
  const code = error instanceof MigrationGateError ? error.safeCode : errorCode(error);
  console.error(`[wasteops-db] ${message}${code ? ` (${code})` : ""}.`);
  process.exitCode = 1;
});
