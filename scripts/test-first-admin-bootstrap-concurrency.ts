import * as argon2 from "argon2";
import { prisma } from "@/server/db";
import {
  bootstrapFirstAdmin,
  FirstAdminBootstrapConflictError,
  type FirstAdminBootstrapDatabase,
} from "@/server/services/first-admin-bootstrap";

const DATABASE_NAME = "wasteops";
const TEST_SCHEMA = "wasteops_bootstrap_ci";
const connectionString = process.env.POSTGRES_DATABASE_URL;
if (process.env.CI !== "true")
  throw new Error("The bootstrap concurrency check may run only in the isolated CI workflow.");
if (!connectionString)
  throw new Error("POSTGRES_DATABASE_URL is required for the isolated concurrency check.");

const target = new URL(connectionString);
if (
  !["postgres:", "postgresql:"].includes(target.protocol) ||
  target.hostname !== "127.0.0.1" ||
  target.port !== "5432" ||
  target.pathname.slice(1) !== DATABASE_NAME ||
  target.searchParams.get("schema") !== TEST_SCHEMA ||
  target.username !== "wasteops" ||
  target.password !== ""
)
  throw new Error("The bootstrap concurrency check requires its dedicated loopback CI database schema.");

const dependencies = {
  database: prisma as unknown as FirstAdminBootstrapDatabase,
  hashPassword: (password: string) =>
    argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    }),
};

const candidates = ["bootstrap-race-a@example.org", "bootstrap-race-b@example.org"].map((email) => ({
  organizationName: "WasteOps CI Bootstrap",
  fullName: "CI Initial Administrator",
  email,
  password: "ci-only-bootstrap-passphrase-2026",
}));

try {
  const results = await Promise.allSettled(
    candidates.map((candidate) => bootstrapFirstAdmin(candidate, dependencies)),
  );
  const successful = results.filter((result) => result.status === "fulfilled");
  const conflicts = results.filter(
    (result) => result.status === "rejected" && result.reason instanceof FirstAdminBootstrapConflictError,
  );
  if (successful.length !== 1 || conflicts.length !== 1) {
    throw new Error("Concurrent bootstrap did not produce exactly one administrator and one conflict.");
  }

  const [userCount, organizations, auditCount] = await Promise.all([
    prisma.user.count(),
    prisma.organization.findMany({ select: { id: true, slug: true } }),
    prisma.auditLog.count({ where: { action: "bootstrap.initial_admin" } }),
  ]);
  const onlyUser = await prisma.user.findFirst({
    select: { email: true, role: true, passwordHash: true },
  });
  if (
    userCount !== 1 ||
    organizations.length !== 1 ||
    organizations[0]?.slug !== "wasteops-demo" ||
    auditCount !== 1 ||
    onlyUser?.role !== "ADMIN" ||
    !onlyUser.passwordHash.startsWith("$argon2id$") ||
    !candidates.some(({ email }) => email === onlyUser.email)
  )
    throw new Error(
      "The isolated bootstrap schema does not contain exactly one audited hashed administrator.",
    );

  console.log("Verified concurrent first-admin bootstrap creates one Argon2id ADMIN and one audit event.");
} finally {
  await prisma.$disconnect();
}
