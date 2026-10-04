-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Kazakhstan',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cargo" TEXT NOT NULL,
    "cargoNameEn" TEXT NOT NULL,
    "exporter" TEXT NOT NULL,
    "carrier" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "currentWaypoint" TEXT NOT NULL,
    "waypointName" TEXT NOT NULL,
    "assetValueUsd" REAL NOT NULL,
    "departureDate" TEXT NOT NULL,
    "eta" TEXT NOT NULL,
    "bhi" REAL NOT NULL,
    "predictedRulHours" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "temperature" REAL DEFAULT 4.0,
    "humidity" REAL DEFAULT 85.0,
    "ethanol" REAL DEFAULT 5.0,
    "vibration" REAL DEFAULT 0.2,
    "alertSeverity" TEXT,
    "alertMessage" TEXT,
    "alertTimestamp" TEXT,
    "alertAction" TEXT,
    "alertLocation" TEXT,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shipment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelemetryLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shipmentId" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" REAL NOT NULL,
    "humidity" REAL NOT NULL,
    "ethanol" REAL NOT NULL,
    "vibration" REAL NOT NULL,
    "bhi" REAL,
    "predictedRulHours" REAL,
    "status" TEXT,
    "source" TEXT DEFAULT 'EMULATOR',
    CONSTRAINT "TelemetryLog_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TelemetryLog_shipmentId_timestamp_idx" ON "TelemetryLog"("shipmentId", "timestamp");
