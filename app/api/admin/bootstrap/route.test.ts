import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";

const { allowRequestMock, bootstrapMock } = vi.hoisted(() => ({
  allowRequestMock: vi.fn<(request: Request, scope: string, maximum: number, windowMs: number) => boolean>(
    () => true,
  ),
  bootstrapMock: vi.fn(),
}));

vi.mock("@/server/db", () => ({ prisma: {} }));
vi.mock("@/server/rate-limit", () => ({ allowRequest: allowRequestMock }));
vi.mock("argon2", () => ({ argon2id: 2, hash: vi.fn() }));
vi.mock("@/server/services/first-admin-bootstrap", () => ({
  bootstrapFirstAdmin: bootstrapMock,
  FirstAdminBootstrapConflictError: class FirstAdminBootstrapConflictError extends Error {},
}));

import { POST } from "./route";

const token = randomBytes(32).toString("hex");
const validPayload = {
  organizationName: "WasteOps Customer",
  fullName: "Initial Administrator",
  email: "admin@customer.example.org",
  password: "a-unique-production-passphrase-2026",
};

function makeRequest({
  authorization,
  contentType = "application/json",
  body = JSON.stringify(validPayload),
  contentLength,
}: {
  authorization?: string;
  contentType?: string;
  body?: string;
  contentLength?: string;
} = {}) {
  const headers = new Headers({ "content-type": contentType });
  if (authorization) headers.set("authorization", authorization);
  if (contentLength) headers.set("content-length", contentLength);
  return new Request("https://wasteops.example/api/admin/bootstrap", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/admin/bootstrap", () => {
  const originalToken = process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "production");
    process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN = token;
    bootstrapMock.mockResolvedValue({ userId: "created-user" });
    allowRequestMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalToken === undefined) delete process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN;
    else process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN = originalToken;
  });

  it("is unavailable outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await POST(makeRequest({ authorization: `Bearer ${token}` }));

    expect(response.status).toBe(404);
    expect(allowRequestMock).not.toHaveBeenCalled();
    expect(bootstrapMock).not.toHaveBeenCalled();
  });

  it("requires the bearer token and applies an address-independent process limit", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(allowRequestMock).toHaveBeenCalledWith(expect.any(Request), "first-admin-bootstrap", 5, 60_000);
    const limiterRequest = allowRequestMock.mock.calls.at(0)?.[0];
    expect(limiterRequest?.headers.get("x-forwarded-for")).toBeNull();
    expect(bootstrapMock).not.toHaveBeenCalled();
  });

  it("rejects an over-limit body before JSON parsing", async () => {
    const response = await POST(
      makeRequest({ authorization: `Bearer ${token}`, contentLength: "12001", body: "x".repeat(12_001) }),
    );

    expect(response.status).toBe(413);
    expect(bootstrapMock).not.toHaveBeenCalled();
  });

  it("rejects non-JSON requests", async () => {
    const response = await POST(
      makeRequest({ authorization: `Bearer ${token}`, contentType: "text/plain", body: "ignored" }),
    );

    expect(response.status).toBe(415);
    expect(bootstrapMock).not.toHaveBeenCalled();
  });

  it("creates the first administrator without returning identity details and clears the in-process token", async () => {
    const response = await POST(makeRequest({ authorization: `Bearer ${token}` }));

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "created" });
    expect(process.env.WASTEOPS_FIRST_ADMIN_BOOTSTRAP_TOKEN).toBeUndefined();
    expect(bootstrapMock).toHaveBeenCalledWith(
      validPayload,
      expect.objectContaining({ database: expect.anything(), hashPassword: expect.any(Function) }),
    );
  });

  it("returns a generic conflict when another process already created the first administrator", async () => {
    const { FirstAdminBootstrapConflictError } = await import("@/server/services/first-admin-bootstrap");
    bootstrapMock.mockRejectedValueOnce(new FirstAdminBootstrapConflictError());

    const response = await POST(makeRequest({ authorization: `Bearer ${token}` }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Bootstrap is unavailable." });
  });

  it("fails closed when the rate ceiling is exceeded", async () => {
    allowRequestMock.mockReturnValueOnce(false);
    const response = await POST(makeRequest({ authorization: `Bearer ${token}` }));

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(bootstrapMock).not.toHaveBeenCalled();
  });
});
