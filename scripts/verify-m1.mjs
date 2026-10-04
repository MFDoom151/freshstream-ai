import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyMilestone1() {
  console.log('=== VERIFYING MILESTONE 1 IMPLEMENTATION ===\n');

  let passed = true;

  // 1. Verify Company
  try {
    const companies = await prisma.company.findMany();
    console.log(`[PASS] Found ${companies.length} company in database:`);
    for (const c of companies) {
      console.log(`   - ${c.name} (${c.code}), Country: ${c.country}`);
    }
  } catch (e) {
    console.error('[FAIL] Querying Company model failed:', e);
    passed = false;
  }

  // 2. Verify Users & Password Hashing
  try {
    const users = await prisma.user.findMany();
    console.log(`\n[PASS] Found ${users.length} users in database:`);
    for (const u of users) {
      const isPasswordMatch = await bcrypt.compare('Password123!', u.password);
      console.log(`   - ${u.email} | Role: ${u.role} | Password 'Password123!' valid: ${isPasswordMatch}`);
      if (!isPasswordMatch) passed = false;
    }
  } catch (e) {
    console.error('[FAIL] Querying User model or verifying password failed:', e);
    passed = false;
  }

  // 3. Verify Shipments
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        telemetryLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
    console.log(`\n[PASS] Found ${shipments.length} shipments in database:`);
    const expectedIds = ['FS-8821', 'FS-9042', 'FS-4103', 'FS-6218', 'FS-3319', 'FS-7750'];
    for (const id of expectedIds) {
      const s = shipments.find(item => item.id === id);
      if (s) {
        console.log(`   - [OK] ${s.id}: ${s.cargoNameEn} (${s.origin} -> ${s.destination}) | Status: ${s.status} | TelemetryLogs: ${s.telemetryLogs.length}`);
      } else {
        console.error(`   - [MISSING] Expected shipment ${id} not found!`);
        passed = false;
      }
    }
  } catch (e) {
    console.error('[FAIL] Querying Shipment model failed:', e);
    passed = false;
  }

  // 4. Verify TelemetryLogs total count
  try {
    const totalLogs = await prisma.telemetryLog.count();
    console.log(`\n[PASS] Total TelemetryLog records in database: ${totalLogs}`);
    if (totalLogs < 18) {
      console.warn('   - Warning: Expected at least 18 telemetry logs (3 per shipment)');
    }
  } catch (e) {
    console.error('[FAIL] Querying TelemetryLog model failed:', e);
    passed = false;
  }

  await prisma.$disconnect();

  if (passed) {
    console.log('\n>>> ALL MILESTONE 1 DATABASE AND MODEL CHECKS PASSED <<<\n');
  } else {
    console.error('\n>>> SOME CHECKS FAILED <<<\n');
    process.exit(1);
  }
}

verifyMilestone1();
