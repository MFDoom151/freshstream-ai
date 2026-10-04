import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

let passCount = 0;
let failCount = 0;
const results = [];

function recordResult(testName, passed, details) {
  if (passed) {
    passCount++;
    console.log(`[PASS] ${testName}`);
    results.push({ testName, passed: true, details });
  } else {
    failCount++;
    console.error(`[FAIL] ${testName}: ${details}`);
    results.push({ testName, passed: false, details });
  }
}

async function runDatabaseStressTests() {
  console.log('====================================================');
  console.log('>>> RUNNING CHALLENGER DATABASE ADVERSARIAL TESTS <<<');
  console.log('====================================================\n');

  // Test 1: Unique constraint on Company code
  try {
    await prisma.company.create({
      data: {
        name: 'Duplicate Company Test',
        code: 'KAZ-AGRO-01', // Existing seeded code
        country: 'Kazakhstan',
      },
    });
    recordResult('Company code unique constraint', false, 'Allowed duplicate company code KAZ-AGRO-01');
  } catch (err) {
    const isP2002 = err.code === 'P2002';
    recordResult(
      'Company code unique constraint',
      isP2002,
      isP2002 ? 'Prisma correctly threw P2002 Unique constraint violation' : `Unexpected error: ${err.message}`
    );
  }

  // Test 2: Unique constraint on User email
  try {
    await prisma.user.create({
      data: {
        email: 'admin@freshstream.ai', // Existing seeded user
        name: 'Attacker Admin',
        password: 'HackedPassword',
        role: 'ADMIN',
      },
    });
    recordResult('User email unique constraint', false, 'Allowed duplicate user email admin@freshstream.ai');
  } catch (err) {
    const isP2002 = err.code === 'P2002';
    recordResult(
      'User email unique constraint',
      isP2002,
      isP2002 ? 'Prisma correctly threw P2002 Unique constraint violation' : `Unexpected error: ${err.message}`
    );
  }

  // Test 3: Unique constraint on Shipment ID
  try {
    await prisma.shipment.create({
      data: {
        id: 'FS-8821', // Existing seeded shipment
        cargo: 'beef',
        cargoNameEn: 'Duplicate KazBeef',
        exporter: 'Fake Exporter',
        carrier: 'Fake Carrier',
        origin: 'Astana',
        destination: 'Dubai',
        currentWaypoint: 'kuryk',
        waypointName: 'Port Kuryk',
        assetValueUsd: 10000,
        departureDate: '2026-09-24',
        eta: '2026-10-06',
        bhi: 90,
        predictedRulHours: 400,
        status: 'OPTIMAL',
      },
    });
    recordResult('Shipment ID unique constraint', false, 'Allowed duplicate shipment id FS-8821');
  } catch (err) {
    const isP2002 = err.code === 'P2002';
    recordResult(
      'Shipment ID unique constraint',
      isP2002,
      isP2002 ? 'Prisma correctly threw P2002 Unique constraint violation' : `Unexpected error: ${err.message}`
    );
  }

  // Test 4: Null constraint on required fields in User
  try {
    // @ts-expect-error Intentionally invalid data
    await prisma.user.create({
      data: {
        email: 'incomplete@freshstream.ai',
        // password omitted
      },
    });
    recordResult('User null constraint on password', false, 'Allowed User creation without password');
  } catch (err) {
    recordResult('User null constraint on password', true, `Correctly rejected: ${err.message?.split('\n')[0]}`);
  }

  // Test 5: Null constraint on required fields in Shipment
  try {
    // @ts-expect-error Intentionally invalid data
    await prisma.shipment.create({
      data: {
        id: 'FS-INCOMPLETE-1',
        cargo: 'beef',
        // missing cargoNameEn, exporter, bhi, etc.
      },
    });
    recordResult('Shipment null constraint on required fields', false, 'Allowed Shipment creation with missing required fields');
  } catch (err) {
    recordResult('Shipment null constraint on required fields', true, `Correctly rejected: ${err.message?.split('\n')[0]}`);
  }

  // Test 6: Cascade Delete on Shipment -> TelemetryLog
  try {
    // Create temporary shipment
    const tempShipmentId = 'FS-TEMP-CASCADE-TEST';
    await prisma.shipment.create({
      data: {
        id: tempShipmentId,
        cargo: 'dairy',
        cargoNameEn: 'Cascade Test Dairy',
        exporter: 'Test Exporter',
        carrier: 'Test Carrier',
        origin: 'Almaty',
        destination: 'Baku',
        currentWaypoint: 'kuryk',
        waypointName: 'Port Kuryk',
        assetValueUsd: 50000,
        departureDate: '2026-09-29',
        eta: '2026-10-05',
        bhi: 85,
        predictedRulHours: 120,
        status: 'OPTIMAL',
      },
    });

    // Create 3 telemetry logs linked to this shipment
    await prisma.telemetryLog.createMany({
      data: [
        {
          shipmentId: tempShipmentId,
          timestamp: new Date(Date.now() - 60000),
          temperature: 4.0,
          humidity: 80.0,
          ethanol: 2.0,
          vibration: 0.1,
          bhi: 85,
          predictedRulHours: 120,
          status: 'OPTIMAL',
        },
        {
          shipmentId: tempShipmentId,
          timestamp: new Date(Date.now() - 30000),
          temperature: 4.2,
          humidity: 81.0,
          ethanol: 2.1,
          vibration: 0.1,
          bhi: 85,
          predictedRulHours: 120,
          status: 'OPTIMAL',
        },
        {
          shipmentId: tempShipmentId,
          timestamp: new Date(),
          temperature: 4.5,
          humidity: 82.0,
          ethanol: 2.2,
          vibration: 0.2,
          bhi: 84,
          predictedRulHours: 118,
          status: 'OPTIMAL',
        },
      ],
    });

    const logsBefore = await prisma.telemetryLog.count({
      where: { shipmentId: tempShipmentId },
    });
    if (logsBefore !== 3) {
      throw new Error(`Expected 3 logs created, got ${logsBefore}`);
    }

    // Now delete the shipment
    await prisma.shipment.delete({
      where: { id: tempShipmentId },
    });

    // Check if telemetry logs were cascaded or orphaned
    const logsAfter = await prisma.telemetryLog.count({
      where: { shipmentId: tempShipmentId },
    });

    recordResult(
      'Cascade Delete (Shipment -> TelemetryLog)',
      logsAfter === 0,
      logsAfter === 0
        ? 'Deleting Shipment cleanly deleted all associated TelemetryLogs (0 orphaned)'
        : `Orphaned ${logsAfter} TelemetryLogs after Shipment deletion!`
    );
  } catch (err) {
    recordResult('Cascade Delete (Shipment -> TelemetryLog)', false, `Cascade delete failed with error: ${err.message}`);
  }

  // Test 7: SetNull Relation on Company Deletion
  try {
    const tempCompany = await prisma.company.create({
      data: {
        name: 'Temp Company for SetNull Test',
        code: 'TEMP-SETNULL-01',
        country: 'Kazakhstan',
      },
    });

    const tempUser = await prisma.user.create({
      data: {
        email: 'setnull-test-user@freshstream.ai',
        password: 'Password123!',
        companyId: tempCompany.id,
      },
    });

    const tempShipment = await prisma.shipment.create({
      data: {
        id: 'FS-TEMP-SETNULL',
        cargo: 'beef',
        cargoNameEn: 'SetNull Test Beef',
        exporter: 'Test',
        carrier: 'Test',
        origin: 'Astana',
        destination: 'Baku',
        currentWaypoint: 'kuryk',
        waypointName: 'Port Kuryk',
        assetValueUsd: 10000,
        departureDate: '2026-09-29',
        eta: '2026-10-05',
        bhi: 90,
        predictedRulHours: 200,
        status: 'OPTIMAL',
        companyId: tempCompany.id,
      },
    });

    // Delete Company
    await prisma.company.delete({
      where: { id: tempCompany.id },
    });

    // Inspect tempUser and tempShipment
    const userAfter = await prisma.user.findUnique({ where: { id: tempUser.id } });
    const shipmentAfter = await prisma.shipment.findUnique({ where: { id: tempShipment.id } });

    const isUserNull = userAfter?.companyId === null;
    const isShipmentNull = shipmentAfter?.companyId === null;

    recordResult(
      'SetNull onDelete for Company -> User and Shipment',
      isUserNull && isShipmentNull,
      `User companyId: ${userAfter?.companyId} (expected null), Shipment companyId: ${shipmentAfter?.companyId} (expected null)`
    );

    // Clean up
    await prisma.user.delete({ where: { id: tempUser.id } });
    await prisma.shipment.delete({ where: { id: tempShipment.id } });
  } catch (err) {
    recordResult('SetNull onDelete for Company -> User and Shipment', false, err.message);
  }

  // Test 8: Seed Idempotency Test (Multiple consecutive runs)
  console.log('\n--- Testing Seed Idempotency ---');
  try {
    // Run seed run 1
    console.log('Executing seed run 1...');
    execSync('npx prisma db seed', { stdio: 'pipe' });

    const companies1 = await prisma.company.count();
    const users1 = await prisma.user.count();
    const shipments1 = await prisma.shipment.count();
    const logs1 = await prisma.telemetryLog.count();

    console.log(`State after seed run 1: Companies=${companies1}, Users=${users1}, Shipments=${shipments1}, Logs=${logs1}`);

    // Run seed run 2 immediately
    console.log('Executing seed run 2 (idempotency check)...');
    execSync('npx prisma db seed', { stdio: 'pipe' });

    const companies2 = await prisma.company.count();
    const users2 = await prisma.user.count();
    const shipments2 = await prisma.shipment.count();
    const logs2 = await prisma.telemetryLog.count();

    console.log(`State after seed run 2: Companies=${companies2}, Users=${users2}, Shipments=${shipments2}, Logs=${logs2}`);

    // Run seed run 3 immediately
    console.log('Executing seed run 3 (stability check)...');
    execSync('npx prisma db seed', { stdio: 'pipe' });

    const companies3 = await prisma.company.count();
    const users3 = await prisma.user.count();
    const shipments3 = await prisma.shipment.count();
    const logs3 = await prisma.telemetryLog.count();

    console.log(`State after seed run 3: Companies=${companies3}, Users=${users3}, Shipments=${shipments3}, Logs=${logs3}`);

    const isIdempotent =
      companies1 === 1 && companies2 === 1 && companies3 === 1 &&
      users1 === 2 && users2 === 2 && users3 === 2 &&
      shipments1 === 6 && shipments2 === 6 && shipments3 === 6 &&
      logs1 === 18 && logs2 === 18 && logs3 === 18;

    recordResult(
      'Seed Idempotency (3 consecutive seed executions)',
      isIdempotent,
      isIdempotent
        ? `Database counts perfectly stable across 3 seed runs: 1 Company, 2 Users, 6 Shipments, 18 Logs`
        : `Idempotency failure! Counts varied: Companies [${companies1}, ${companies2}, ${companies3}], Logs [${logs1}, ${logs2}, ${logs3}]`
    );
  } catch (err) {
    recordResult('Seed Idempotency', false, `Seed execution crashed: ${err.message}`);
  }

  await prisma.$disconnect();

  console.log('\n====================================================');
  console.log(`DATABASE STRESS TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runDatabaseStressTests().catch((e) => {
  console.error('Fatal stress test runner failure:', e);
  process.exit(1);
});
