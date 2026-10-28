import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, WasteCategory, CollectionStatus } from "@/generated/prisma/client";
import * as argon2 from "argon2";

const connectionString = process.env.POSTGRES_DATABASE_URL;
if (!connectionString) throw new Error("POSTGRES_DATABASE_URL is required to seed the local database.");
const adapter = new PrismaPg({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
});
const prisma = new PrismaClient({ adapter });
const categories: WasteCategory[] = ["PLASTIC", "PAPER", "GLASS", "METAL", "ORGANIC", "RESIDUAL"];
const recyclable = new Set<WasteCategory>(["PLASTIC", "PAPER", "GLASS", "METAL"]);
const zones = ["North sector", "Market sector", "Riverside sector", "Civic sector"];

async function main() {
  const required = [
    "INITIAL_ADMIN_EMAIL",
    "INITIAL_ADMIN_PASSWORD",
    "INITIAL_SUPERVISOR_PASSWORD",
    "INITIAL_COLLECTOR_PASSWORD",
  ] as const;
  for (const key of required)
    if (!process.env[key])
      throw new Error(`${key} is required for demo seeding; set a unique password in the local environment.`);
  for (const key of [
    "INITIAL_ADMIN_PASSWORD",
    "INITIAL_SUPERVISOR_PASSWORD",
    "INITIAL_COLLECTOR_PASSWORD",
  ] as const)
    if ((process.env[key] ?? "").length < 12) throw new Error(`${key} must be at least 12 characters.`);
  const organization = await prisma.organization.upsert({
    where: { slug: "wasteops-demo" },
    update: {},
    create: { name: "WasteOps Demo Organization", slug: "wasteops-demo" },
  });
  const people = [
    {
      email: process.env.INITIAL_ADMIN_EMAIL!.toLowerCase(),
      fullName: process.env.INITIAL_ADMIN_NAME ?? "WasteOps Administrator",
      role: Role.ADMIN,
      password: process.env.INITIAL_ADMIN_PASSWORD!,
    },
    {
      email: process.env.INITIAL_SUPERVISOR_EMAIL?.toLowerCase() ?? "supervisor@example.test",
      fullName: "Demo Operations Supervisor",
      role: Role.SUPERVISOR,
      password: process.env.INITIAL_SUPERVISOR_PASSWORD!,
    },
    {
      email: process.env.INITIAL_COLLECTOR_EMAIL?.toLowerCase() ?? "collector@example.test",
      fullName: "Demo Collection Operator",
      role: Role.COLLECTOR,
      password: process.env.INITIAL_COLLECTOR_PASSWORD!,
    },
  ];
  const users = [];
  for (const person of people) {
    const passwordHash = await argon2.hash(person.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    users.push(
      await prisma.user.upsert({
        where: { email: person.email },
        update: { fullName: person.fullName, role: person.role, organizationId: organization.id },
        create: {
          organizationId: organization.id,
          email: person.email,
          fullName: person.fullName,
          role: person.role,
          passwordHash,
        },
      }),
    );
  }
  const collectors = users.filter((user) => user.role === Role.COLLECTOR);
  const points = [];
  for (let i = 0; i < 50; i++) {
    const code = `DEMO-${String(i + 1).padStart(3, "0")}`;
    const point = await prisma.collectionPoint.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { locationSource: "SIMULATED" },
      create: {
        organizationId: organization.id,
        code,
        name: `Sample Collection Point ${String(i + 1).padStart(2, "0")}`,
        address: `Fictional demo address ${i + 1}`,
        zone: zones[i % zones.length]!,
        latitude: -1.28 + (i % 10) * 0.008,
        longitude: 36.79 + Math.floor(i / 10) * 0.012,
        capacityLiters: [120, 240, 360, 660][i % 4]!,
        wasteCategories: categories.slice(0, 3 + (i % 4)),
        createdById: users[0]!.id,
      },
    });
    points.push(point);
  }
  const existingCount = await prisma.collection.count({ where: { organizationId: organization.id } });
  if (existingCount < 250) {
    for (let i = existingCount; i < 250; i++) {
      const point = points[i % points.length]!;
      const completedAt = new Date(Date.now() - (i % 35) * 86400000 - (i % 24) * 3600000);
      const completed = i % 5 !== 0;
      const status = completed
        ? CollectionStatus.COMPLETED
        : i % 2
          ? CollectionStatus.SCHEDULED
          : CollectionStatus.IN_PROGRESS;
      const materials = [
        { category: categories[i % categories.length]!, weightKg: 12 + (i % 71) },
        { category: categories[(i + 2) % categories.length]!, weightKg: 4 + (i % 29) },
      ];
      const estimatedCo2eKg = completed
        ? Number(
            (
              materials.reduce(
                (sum, material) => sum + (recyclable.has(material.category) ? material.weightKg : 0),
                0,
              ) * 2.5
            ).toFixed(2),
          )
        : 0;
      await prisma.collection.create({
        data: {
          organizationId: organization.id,
          pointId: point.id,
          createdById: users[0]!.id,
          assignedCollectorId: collectors[0]?.id ?? null,
          status,
          scheduledAt: new Date(completedAt.getTime() - 3600000),
          startedAt: completed ? new Date(completedAt.getTime() - 1800000) : null,
          completedAt: completed ? completedAt : null,
          source: "SIMULATED",
          isSimulated: true,
          estimatedCo2eKg,
          notes: "Fictional seeded demonstration record.",
          materials: completed ? { create: materials } : undefined,
        },
      });
    }
  }
  for (const point of points)
    for (let day = 0; day < 7; day++)
      for (const half of [0, 1]) {
        const slot = day * 2 + half;
        const recordedAt = new Date(Date.now() - slot * 12 * 60 * 60 * 1000);
        await prisma.binReading.upsert({
          where: { idempotencyKey: `seed:${point.id}:${slot}` },
          update: {},
          create: {
            pointId: point.id,
            fillPct: (point.code.charCodeAt(point.code.length - 1) * 7 + slot * 13) % 100,
            weightKg: 24 + ((slot * 3) % 72),
            temperatureC: 19 + (slot % 8),
            batteryPct: 72 + (slot % 28),
            source: "SIMULATED",
            isSimulated: true,
            recordedAt,
            idempotencyKey: `seed:${point.id}:${slot}`,
          },
        });
      }
  for (let i = 0; i < 2; i++) {
    const vehicle = await prisma.vehicle.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: `DEMO-TRUCK-${i + 1}` } },
      update: {},
      create: {
        organizationId: organization.id,
        code: `DEMO-TRUCK-${i + 1}`,
        label: `Demo vehicle ${i + 1}`,
      },
    });
    for (let ping = 0; ping < 12; ping++) {
      const point = points[(i * 17 + ping * 3) % points.length]!;
      const recordedAt = new Date(Date.now() - ping * 5 * 60 * 1000);
      const idempotencyKey = `seed:${vehicle.id}:${ping}`;
      await prisma.vehiclePing.upsert({
        where: { idempotencyKey },
        update: {},
        create: {
          vehicleId: vehicle.id,
          latitude: point.latitude,
          longitude: point.longitude,
          recordedAt,
          source: "SIMULATED",
          isSimulated: true,
          idempotencyKey,
        },
      });
    }
  }
  const requestCount = await prisma.collectionRequest.count({ where: { organizationId: organization.id } });
  if (!requestCount)
    await prisma.collectionRequest.createMany({
      data: points.slice(0, 4).map((point, index) => ({
        organizationId: organization.id,
        pointId: point.id,
        requesterName: `Demo resident ${index + 1}`,
        message:
          index % 2
            ? "Collection is needed for this sample point."
            : "Please review this fictional overflow report.",
        status: index === 0 ? "OPEN" : "ACKNOWLEDGED",
      })),
    });
  console.log(
    "Seed complete: fictional organization, 3 Argon2id-backed demo accounts, 50 collection points, 250 collection records, 7 days of simulated readings, 2 simulated vehicles, and sample requests.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
