import { DataQuality, Prisma, WasteCategory } from "@/generated/prisma/client";
import { requirePageActor } from "@/server/authorization";
import { prisma } from "@/server/db";

export const wasteCategories = [
  "PLASTIC",
  "PAPER",
  "GLASS",
  "METAL",
  "ORGANIC",
  "HAZARDOUS",
  "RESIDUAL",
  "EWASTE",
] as const;
export type WasteCategoryFilter = (typeof wasteCategories)[number];
export type DashboardFilters = { from?: string; to?: string; zone?: string; category?: string };
const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

function isoDay(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

function windowFrom(filters: DashboardFilters) {
  const now = new Date();
  const defaultEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const defaultStart = new Date(defaultEnd.valueOf() - 30 * 86400000);
  let start = isoDay(filters.from) ?? defaultStart;
  let end = isoDay(filters.to);
  if (end) end = new Date(end.valueOf() + 86400000);
  if (!end) end = defaultEnd;
  if (end <= start || end.valueOf() - start.valueOf() > 366 * 86400000) {
    start = defaultStart;
    end = defaultEnd;
  }
  const category = wasteCategories.includes(filters.category as WasteCategoryFilter)
    ? (filters.category as WasteCategoryFilter)
    : undefined;
  const zone = filters.zone?.trim().slice(0, 60) || undefined;
  return {
    start,
    end,
    from: start.toISOString().slice(0, 10),
    to: new Date(end.valueOf() - 86400000).toISOString().slice(0, 10),
    zone,
    category,
  };
}

export async function getDashboardData(filters: DashboardFilters = {}) {
  const actor = await requirePageActor();
  const window = windowFrom(filters);
  const pointWhere: Prisma.CollectionPointWhereInput = {
    organizationId: actor.organizationId,
    isActive: true,
    ...(window.zone ? { zone: window.zone } : {}),
    ...(window.category ? { wasteCategories: { has: window.category as WasteCategory } } : {}),
  };
  const collectionBase: Prisma.CollectionWhereInput = {
    organizationId: actor.organizationId,
    status: "COMPLETED",
    completedAt: { gte: window.start, lt: window.end },
    ...(window.zone ? { point: { zone: window.zone } } : {}),
    ...(window.category ? { materials: { some: { category: window.category as WasteCategory } } } : {}),
  };
  const scheduledWhere: Prisma.CollectionWhereInput = {
    organizationId: actor.organizationId,
    status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    scheduledAt: { gte: window.start, lt: window.end },
    ...(window.zone ? { point: { zone: window.zone } } : {}),
  };
  const requestWhere: Prisma.CollectionRequestWhereInput = {
    organizationId: actor.organizationId,
    status: { in: ["OPEN", "ACKNOWLEDGED"] },
    ...(window.zone ? { point: { is: { zone: window.zone } } } : {}),
  };
  const auditRead =
    actor.role === "ADMIN"
      ? prisma.auditLog.findMany({
          where: { organizationId: actor.organizationId },
          include: { actor: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 6,
        })
      : Promise.resolve([]);
  const [points, scheduled, completed, requestsOpen, collections, recentReadings, recentAudit] =
    await Promise.all([
      prisma.collectionPoint.count({ where: pointWhere }),
      prisma.collection.count({ where: scheduledWhere }),
      prisma.collection.count({ where: collectionBase }),
      prisma.collectionRequest.count({ where: requestWhere }),
      prisma.collection.findMany({
        where: collectionBase,
        select: {
          id: true,
          completedAt: true,
          isSimulated: true,
          source: true,
          materials: {
            where: window.category ? { category: window.category as WasteCategory } : undefined,
            select: { category: true, weightKg: true },
          },
          point: { select: { zone: true } },
        },
        orderBy: { completedAt: "asc" },
        take: 10001,
      }),
      prisma.binReading.findMany({
        where: { point: pointWhere, recordedAt: { gte: new Date(Date.now() - STALE_AFTER_MS) } },
        distinct: ["pointId"],
        orderBy: [{ pointId: "asc" }, { recordedAt: "desc" }],
        select: {
          id: true,
          pointId: true,
          fillPct: true,
          source: true,
          isSimulated: true,
          recordedAt: true,
          point: { select: { code: true, name: true, zone: true } },
        },
        take: 50,
      }),
      auditRead,
    ]);
  const isTruncated = collections.length > 10000;
  const categoryTotals = new Map<string, number>();
  const dailyTotals = new Map<string, number>();
  let totalKg = 0;
  let recycledKg = 0;
  let simulated = false;
  for (const collection of collections.slice(0, 10000)) {
    simulated ||= collection.isSimulated || collection.source === "SIMULATED";
    const day = collection.completedAt?.toISOString().slice(0, 10) ?? "Unknown";
    for (const material of collection.materials) {
      totalKg += material.weightKg;
      categoryTotals.set(material.category, (categoryTotals.get(material.category) ?? 0) + material.weightKg);
      dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + material.weightKg);
      if (["PLASTIC", "PAPER", "GLASS", "METAL"].includes(material.category)) recycledKg += material.weightKg;
    }
  }
  const categoryData = [...categoryTotals].map(([name, value]) => ({
    name: name.replaceAll("_", " "),
    value: Number(value.toFixed(1)),
  }));
  const trendData = [...dailyTotals]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, kg]) => ({ date: date.slice(5), kg: Number(kg.toFixed(1)) }));
  const highFill = recentReadings.filter((reading) => reading.fillPct >= 80).slice(0, 6);
  return {
    actor,
    filters: { from: window.from, to: window.to, zone: window.zone ?? "", category: window.category ?? "" },
    kpis: {
      points,
      scheduled,
      completed,
      requestsOpen,
      totalKg: Number(totalKg.toFixed(1)),
      recycledKg: Number(recycledKg.toFixed(1)),
      diversionRate: totalKg ? Number(((recycledKg / totalKg) * 100).toFixed(1)) : null,
    },
    categoryData,
    trendData,
    highFill,
    recentAudit,
    isTruncated,
    simulated: simulated || recentReadings.some((reading) => reading.isSimulated),
    asOf: new Date().toISOString(),
  };
}

export async function getReportOptions() {
  const actor = await requirePageActor(["ADMIN", "SUPERVISOR"]);
  const zones = await prisma.collectionPoint.findMany({
    where: { organizationId: actor.organizationId, isActive: true },
    distinct: ["zone"],
    select: { zone: true },
    orderBy: { zone: "asc" },
  });
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29))
    .toISOString()
    .slice(0, 10);
  return { zones: zones.map((item) => item.zone), categories: wasteCategories, today, defaultFrom };
}

export async function getCollectionPoints() {
  const actor = await requirePageActor();
  const now = Date.now();
  const points = await prisma.collectionPoint.findMany({
    where: { organizationId: actor.organizationId, isActive: true },
    include: {
      readings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
        select: { fillPct: true, isSimulated: true, source: true, qualityStatus: true, recordedAt: true },
      },
    },
    orderBy: [{ zone: "asc" }, { code: "asc" }],
  });
  return points.map((point) => ({
    ...point,
    readings: point.readings.map((reading) => ({
      ...reading,
      qualityStatus:
        now - reading.recordedAt.getTime() > STALE_AFTER_MS ? DataQuality.STALE : reading.qualityStatus,
    })),
  }));
}

export async function getCollections() {
  const actor = await requirePageActor();
  const where: Prisma.CollectionWhereInput =
    actor.role === "COLLECTOR"
      ? { organizationId: actor.organizationId, assignedCollectorId: actor.id }
      : { organizationId: actor.organizationId };
  return prisma.collection.findMany({
    where,
    include: {
      point: { select: { id: true, code: true, name: true, zone: true, latitude: true, longitude: true } },
      assignedCollector: { select: { id: true, fullName: true } },
      materials: true,
    },
    orderBy: [{ scheduledAt: "desc" }],
    take: 200,
  });
}

export async function getActiveCollectors() {
  const actor = await requirePageActor(["ADMIN", "SUPERVISOR"]);
  return prisma.user.findMany({
    where: { organizationId: actor.organizationId, role: "COLLECTOR", isActive: true },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });
}

export async function getRequests() {
  const actor = await requirePageActor(["ADMIN", "SUPERVISOR"]);
  return prisma.collectionRequest.findMany({
    where: { organizationId: actor.organizationId },
    include: { point: { select: { code: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getAuditEvents() {
  const actor = await requirePageActor(["ADMIN"]);
  return prisma.auditLog.findMany({
    where: { organizationId: actor.organizationId },
    include: { actor: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
}

export async function getUsers() {
  const actor = await requirePageActor(["ADMIN"]);
  return prisma.user.findMany({
    where: { organizationId: actor.organizationId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { fullName: "asc" },
  });
}

export async function getTelemetry() {
  const actor = await requirePageActor(["ADMIN", "SUPERVISOR"]);
  const [rawPoints, rawVehicles] = await Promise.all([
    prisma.collectionPoint.findMany({
      where: { organizationId: actor.organizationId, isActive: true },
      include: { readings: { orderBy: { recordedAt: "desc" }, take: 1 } },
      orderBy: { code: "asc" },
      take: 50,
    }),
    prisma.vehicle.findMany({
      where: { organizationId: actor.organizationId, isActive: true },
      include: { pings: { orderBy: { recordedAt: "desc" }, take: 1 } },
      orderBy: { code: "asc" },
      take: 20,
    }),
  ]);
  const now = Date.now();
  const points = rawPoints.map((point) => ({
    ...point,
    readings: point.readings.map((reading) => ({
      ...reading,
      qualityStatus:
        now - reading.recordedAt.getTime() > STALE_AFTER_MS ? DataQuality.STALE : reading.qualityStatus,
    })),
  }));
  const vehicles = rawVehicles.map((vehicle) => ({
    ...vehicle,
    pings: vehicle.pings.map((ping) => ({
      ...ping,
      qualityStatus: now - ping.recordedAt.getTime() > STALE_AFTER_MS ? DataQuality.STALE : DataQuality.VALID,
    })),
  }));
  return { points, vehicles, simulated: true, asOf: new Date(now).toISOString() };
}
