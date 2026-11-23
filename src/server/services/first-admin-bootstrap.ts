import { firstAdminBootstrapSchema } from "@/domain/schemas";

const PUBLIC_ORGANIZATION_SLUG = "wasteops-demo";
const ADVISORY_LOCK_NAMESPACE = 1_579_415_635;
const ADVISORY_LOCK_ID = 1;

export class FirstAdminBootstrapConflictError extends Error {
  constructor() {
    super("First-admin bootstrap is not available.");
    this.name = "FirstAdminBootstrapConflictError";
  }
}

export interface FirstAdminBootstrapTransaction {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  organization: {
    findMany(args: { select: { id: true; slug: true } }): Promise<Array<{ id: string; slug: string }>>;
    create(args: { data: { name: string; slug: string } }): Promise<{ id: string; slug: string }>;
  };
  user: {
    count(): Promise<number>;
    create(args: {
      data: {
        organizationId: string;
        email: string;
        fullName: string;
        passwordHash: string;
        role: "ADMIN";
      };
    }): Promise<{ id: string }>;
  };
  auditLog: {
    create(args: {
      data: {
        organizationId: string;
        actorId: null;
        action: string;
        entityType: string;
        entityId: string;
        metadata: { role: "ADMIN" };
      };
    }): Promise<unknown>;
  };
}

export interface FirstAdminBootstrapDatabase {
  $transaction<T>(
    operation: (tx: FirstAdminBootstrapTransaction) => Promise<T>,
    options: { isolationLevel: "ReadCommitted" },
  ): Promise<T>;
}

type FirstAdminBootstrapDependencies = {
  database: FirstAdminBootstrapDatabase;
  hashPassword: (password: string) => Promise<string>;
};

export async function bootstrapFirstAdmin(
  rawInput: unknown,
  dependencies: FirstAdminBootstrapDependencies,
): Promise<{ userId: string }> {
  const input = firstAdminBootstrapSchema.parse(rawInput);
  const passwordHash = await dependencies.hashPassword(input.password);

  return dependencies.database.$transaction(
    async (tx) => {
      await tx.$queryRaw<Array<{ acquired: number }>>`
        SELECT 1 AS acquired FROM pg_advisory_xact_lock(${ADVISORY_LOCK_NAMESPACE}, ${ADVISORY_LOCK_ID})
      `;

      // The lock serializes callers; READ COMMITTED gives the next statement a fresh snapshot
      // so a waiter sees an administrator committed by the prior lock holder.
      if ((await tx.user.count()) !== 0) throw new FirstAdminBootstrapConflictError();

      const organizations = await tx.organization.findMany({ select: { id: true, slug: true } });
      if (organizations.length > 1 || organizations.some(({ slug }) => slug !== PUBLIC_ORGANIZATION_SLUG))
        throw new FirstAdminBootstrapConflictError();

      const organization = organizations[0]
        ? organizations[0]
        : await tx.organization.create({
            data: { name: input.organizationName, slug: PUBLIC_ORGANIZATION_SLUG },
          });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          email: input.email,
          fullName: input.fullName,
          passwordHash,
          role: "ADMIN",
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          actorId: null,
          action: "bootstrap.initial_admin",
          entityType: "User",
          entityId: user.id,
          metadata: { role: "ADMIN" },
        },
      });

      return { userId: user.id };
    },
    { isolationLevel: "ReadCommitted" },
  );
}
