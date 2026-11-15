import { describe, expect, it } from "vitest";
import { hasValidFirstAdminBootstrapToken } from "@/server/bootstrap-token";

const token = "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0011223344556677";

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
