import { describe, expect, it, vi } from "vitest";
import {
  bootstrapFirstAdmin,
  FirstAdminBootstrapConflictError,
  type FirstAdminBootstrapDatabase,
  type FirstAdminBootstrapTransaction,
} from "@/server/services/first-admin-bootstrap";

const validInput = {
  organizationName: "WasteOps Customer",
  fullName: "Initial Administrator",
  email: "Admin@customer.example.org",
  password: "a-unique-production-passphrase-2026",
};

function createFixture({
  users = 0,
  organizations = [] as Array<{ id: string; slug: string }>,
}: {
  users?: number;
  organizations?: Array<{ id: string; slug: string }>;
} = {}) {
  const tx = {
    $queryRaw: vi.fn(async () => []),
    organization: {
      findMany: vi.fn(async () => organizations),
      create: vi.fn(async () => ({ id: "organization-1", slug: "wasteops-demo" })),
    },
    user: {
      count: vi.fn(async () => users),
      create: vi.fn(async () => ({ id: "user-1" })),
    },
    auditLog: { create: vi.fn(async () => ({ id: "audit-1" })) },
  } as unknown as FirstAdminBootstrapTransaction;
  const database = {
    $transaction: vi.fn(async (operation: (inner: FirstAdminBootstrapTransaction) => Promise<unknown>) =>
      operation(tx),
    ),
  } as unknown as FirstAdminBootstrapDatabase;
  const hashPassword = vi.fn(async (password: string) => `argon2id:${password.length}`);
  return { tx, database, hashPassword };
}

describe("first administrator bootstrap", () => {
  it("creates only an administrator and one public-request organization in a locked transaction", async () => {
    const fixture = createFixture();
    const result = await bootstrapFirstAdmin(validInput, fixture);

    expect(result).toEqual({ userId: "user-1" });
    expect(fixture.database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "ReadCommitted",
    });
    expect(fixture.tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(fixture.tx.organization.create).toHaveBeenCalledWith({
      data: { name: "WasteOps Customer", slug: "wasteops-demo" },
    });
    expect(fixture.tx.user.create).toHaveBeenCalledWith({
      data: {
        organizationId: "organization-1",
        email: "admin@customer.example.org",
        fullName: "Initial Administrator",
        passwordHash: "argon2id:35",
        role: "ADMIN",
      },
    });
    expect(fixture.tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        organizationId: "organization-1",
        actorId: null,
        action: "bootstrap.initial_admin",
        entityType: "User",
        entityId: "user-1",
        metadata: { role: "ADMIN" },
      },
    });
    expect(fixture.hashPassword).toHaveBeenCalledWith(validInput.password);
  });

  it("reuses the existing fixed organization if the database has no users", async () => {
    const fixture = createFixture({ organizations: [{ id: "existing-org", slug: "wasteops-demo" }] });
    await bootstrapFirstAdmin(validInput, fixture);
    expect(fixture.tx.organization.create).not.toHaveBeenCalled();
    expect(fixture.tx.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: "existing-org" }),
    });
  });

  it("refuses to create an additional administrator when any user already exists", async () => {
    const fixture = createFixture({ users: 1 });
    await expect(bootstrapFirstAdmin(validInput, fixture)).rejects.toBeInstanceOf(
      FirstAdminBootstrapConflictError,
    );
    expect(fixture.tx.organization.create).not.toHaveBeenCalled();
    expect(fixture.tx.user.create).not.toHaveBeenCalled();
    expect(fixture.tx.auditLog.create).not.toHaveBeenCalled();
  });

  it("refuses to attach the first administrator to an unexpected or ambiguous tenant", async () => {
    for (const organizations of [
      [{ id: "other-org", slug: "other-tenant" }],
      [
        { id: "one", slug: "wasteops-demo" },
        { id: "two", slug: "wasteops-demo" },
      ],
    ]) {
      const fixture = createFixture({ organizations });
      await expect(bootstrapFirstAdmin(validInput, fixture)).rejects.toBeInstanceOf(
        FirstAdminBootstrapConflictError,
      );
      expect(fixture.tx.user.create).not.toHaveBeenCalled();
    }
  });

  it("rejects invalid and demo-only identity inputs before touching the database", async () => {
    const fixture = createFixture();
    await expect(
      bootstrapFirstAdmin({ ...validInput, email: "admin@example.test" }, fixture),
    ).rejects.toThrow();
    await expect(bootstrapFirstAdmin({ ...validInput, password: "too-short" }, fixture)).rejects.toThrow();
    expect(fixture.database.$transaction).not.toHaveBeenCalled();
  });
});
