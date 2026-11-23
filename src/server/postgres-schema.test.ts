import { describe, expect, it } from "vitest";
import { getPostgresSchema } from "@/server/postgres-schema";

describe("PostgreSQL schema selection", () => {
  it("uses the schema parameter from the connection URL", () => {
    expect(getPostgresSchema("postgresql://app@127.0.0.1:5432/wasteops?schema=wasteops_bootstrap_ci")).toBe(
      "wasteops_bootstrap_ci",
    );
  });

  it("defaults to public when the connection URL omits a schema", () => {
    expect(getPostgresSchema("postgresql://app@127.0.0.1:5432/wasteops")).toBe("public");
  });
});
