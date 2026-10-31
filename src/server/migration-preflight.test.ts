import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("initial migration URL preflight", () => {
  it("rejects a pasted environment assignment before connecting and does not echo credentials", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(process.cwd(), "scripts/run-initial-migrations.mjs")],
      {
        cwd: process.cwd(),
        env: {
          PATH: process.env.PATH ?? "",
          HOME: process.env.HOME ?? "",
          NODE_ENV: "production",
          WASTEOPS_RUN_INITIAL_MIGRATIONS: "true",
          POSTGRES_DATABASE_URL:
            "postgresql://wasteops_runtime:runtime-token-test-only@127.0.0.1:1/wasteops?schema=public",
          POSTGRES_MIGRATION_DATABASE_URL:
            "POSTGRES_MIGRATION_DATABASE_URL=postgresql://wasteops_migrator:migration-token-test-only@127.0.0.1:1/wasteops?schema=public",
        },
        encoding: "utf8",
        timeout: 10_000,
      },
    );

    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(output).toContain("POSTGRES_MIGRATION_DATABASE_URL must be a direct PostgreSQL URL");
    expect(output).not.toContain("runtime-token-test-only");
    expect(output).not.toContain("migration-token-test-only");
    expect(output).not.toContain("Unable to connect to the configured PostgreSQL database");
    expect(output).not.toContain("Applying the exact approved initial migration bundle");
  });
});
