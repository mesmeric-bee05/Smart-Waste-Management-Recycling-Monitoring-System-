-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "WasteCategory" AS ENUM ('PLASTIC', 'PAPER', 'GLASS', 'METAL', 'ORGANIC', 'HAZARDOUS', 'RESIDUAL', 'EWASTE');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('SIMULATED', 'MANUAL', 'IMPORTED', 'DEVICE');

-- CreateEnum
CREATE TYPE "DataQuality" AS ENUM ('VALID', 'SUSPECT', 'STALE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLLECTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionPoint" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capacityLiters" INTEGER NOT NULL DEFAULT 240,
    "wasteCategories" "WasteCategory"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastEmptiedAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "pointId" UUID NOT NULL,
    "assignedCollectorId" UUID,
    "createdById" UUID NOT NULL,
    "status" "CollectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "isSimulated" BOOLEAN NOT NULL DEFAULT false,
    "estimatedCo2eKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelUsedLiters" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionMaterial" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "category" "WasteCategory" NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CollectionMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinReading" (
    "id" UUID NOT NULL,
    "pointId" UUID NOT NULL,
    "fillPct" INTEGER NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "temperatureC" DOUBLE PRECISION,
    "batteryPct" DOUBLE PRECISION,
    "source" "DataSource" NOT NULL DEFAULT 'SIMULATED',
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityStatus" "DataQuality" NOT NULL DEFAULT 'VALID',
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "BinReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePing" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "source" "DataSource" NOT NULL DEFAULT 'SIMULATED',
    "isSimulated" BOOLEAN NOT NULL DEFAULT true,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "VehiclePing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionRequest" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "pointId" UUID,
    "requesterName" TEXT,
    "contactEmail" TEXT,
    "message" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "handledById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CollectionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_role_isActive_idx" ON "User"("organizationId", "role", "isActive");

-- CreateIndex
CREATE INDEX "CollectionPoint_organizationId_zone_isActive_idx" ON "CollectionPoint"("organizationId", "zone", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionPoint_organizationId_code_key" ON "CollectionPoint"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Collection_organizationId_status_scheduledAt_idx" ON "Collection"("organizationId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Collection_organizationId_assignedCollectorId_scheduledAt_idx" ON "Collection"("organizationId", "assignedCollectorId", "scheduledAt");

-- CreateIndex
CREATE INDEX "CollectionMaterial_category_idx" ON "CollectionMaterial"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionMaterial_collectionId_category_key" ON "CollectionMaterial"("collectionId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "BinReading_idempotencyKey_key" ON "BinReading"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BinReading_pointId_recordedAt_idx" ON "BinReading"("pointId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "BinReading_source_recordedAt_idx" ON "BinReading"("source", "recordedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_organizationId_code_key" ON "Vehicle"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "VehiclePing_idempotencyKey_key" ON "VehiclePing"("idempotencyKey");

-- CreateIndex
CREATE INDEX "VehiclePing_vehicleId_recordedAt_idx" ON "VehiclePing"("vehicleId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "CollectionRequest_organizationId_status_createdAt_idx" ON "CollectionRequest"("organizationId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionPoint" ADD CONSTRAINT "CollectionPoint_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionPoint" ADD CONSTRAINT "CollectionPoint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "CollectionPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_assignedCollectorId_fkey" FOREIGN KEY ("assignedCollectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionMaterial" ADD CONSTRAINT "CollectionMaterial_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinReading" ADD CONSTRAINT "BinReading_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "CollectionPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePing" ADD CONSTRAINT "VehiclePing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRequest" ADD CONSTRAINT "CollectionRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRequest" ADD CONSTRAINT "CollectionRequest_pointId_fkey" FOREIGN KEY ("pointId") REFERENCES "CollectionPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRequest" ADD CONSTRAINT "CollectionRequest_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
