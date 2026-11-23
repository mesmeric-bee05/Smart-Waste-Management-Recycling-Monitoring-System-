import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { hasValidFirstAdminBootstrapToken } from "@/server/bootstrap-token";

const token = randomBytes(32).toString("hex");

describe("first-admin bootstrap bearer token", () => {
  it("is disabled without a configured token", () => {
    expect(hasValidFirstAdminBootstrapToken(`Bearer ${token}`, undefined)).toBe(false);
  });

  it("rejects configured tokens shorter than 256 bits", () => {
    expect(hasValidFirstAdminBootstrapToken("Bearer short", "short")).toBe(false);
  });

  it("requires the exact Bearer scheme and token", () => {
    expect(hasValidFirstAdminBootstrapToken(token, token)).toBe(false);
    expect(hasValidFirstAdminBootstrapToken(`Basic ${token}`, token)).toBe(false);
    expect(hasValidFirstAdminBootstrapToken(`Bearer ${"0".repeat(token.length)}`, token)).toBe(false);
  });

  it("accepts a matching high-entropy Bearer token", () => {
    expect(hasValidFirstAdminBootstrapToken(`Bearer ${token}`, token)).toBe(true);
  });
});
