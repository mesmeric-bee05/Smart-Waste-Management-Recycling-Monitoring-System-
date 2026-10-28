import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { wasteOpsPrisma?: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_DATABASE_URL;
  if (!connectionString)
    throw new Error("POSTGRES_DATABASE_URL is required to use the application database.");
  const adapter = new PrismaPg({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.wasteOpsPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.wasteOpsPrisma = prisma;

export function databaseConfigured(): boolean {
  return Boolean(process.env.POSTGRES_DATABASE_URL);
}
