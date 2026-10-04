/**
 * FreshStream AI - Empirical Adversarial Test: Database Fallback when Prisma Throws
 * 
 * Tests whether /api/shipments and /api/shipments/[id] properly fall back to static data
 * when the database query throws an error (e.g., database locked, disconnected, or corrupted).
 */

import { NextRequest } from 'next/server';
import { GET as getShipments } from '../src/app/api/shipments/route';
import { GET as getShipmentByIdRoute } from '../src/app/api/shipments/[id]/route';
import prisma from '../src/lib/prisma';

async function testDatabaseFailureFallback() {
  console.log('======================================================================');
  console.log(' ADVERSARIAL TEST: DATABASE QUERY FAILURE FALLBACK VERIFICATION');
  console.log('======================================================================\n');

  // Normal database operation
  console.log('1. Normal Database Query:');
  const normalRes = await getShipments();
  const normalData = await normalRes.json();
  console.log(`   /api/shipments status: ${normalRes.status}, source: ${normalData.source}`);

  const normalDetailRes = await getShipmentByIdRoute(
    new NextRequest('http://localhost:3000/api/shipments/FS-8821'),
    { params: Promise.resolve({ id: 'FS-8821' }) }
  );
  const normalDetailData = await normalDetailRes.json();
  console.log(`   /api/shipments/FS-8821 status: ${normalDetailRes.status}, source: ${normalDetailData.source}`);

  // Now, simulate a database failure by monkeypatching prisma.shipment.findMany and findUnique to throw
  console.log('\n2. Simulated Database Failure (DB locked / query throws):');
  const originalFindMany = prisma.shipment.findMany;
  const originalFindUnique = prisma.shipment.findUnique;

  (prisma.shipment as any).findMany = async () => {
    throw new Error('PrismaClientKnownRequestError: Timed out fetching a new connection from the pool. (SQLITE_BUSY: database is locked)');
  };

  (prisma.shipment as any).findUnique = async () => {
    throw new Error('PrismaClientKnownRequestError: Timed out fetching a new connection from the pool. (SQLITE_BUSY: database is locked)');
  };

  try {
    // Test /api/shipments when DB query throws
    const failedDbRes = await getShipments();
    const failedDbData = await failedDbRes.json();
    console.log(`   /api/shipments under DB lock:`);
    console.log(`     Status: ${failedDbRes.status}`);
    console.log(`     Success: ${failedDbData.success}`);
    console.log(`     Source: ${failedDbData.source}`);
    console.log(`     Count: ${failedDbData.count}`);

    if (failedDbRes.status === 200 && failedDbData.source === 'fallback_error') {
      console.log('     ✓ PASS: /api/shipments successfully fell back to static dataset with source="fallback_error"');
    } else {
      console.error('     ✗ FAIL: /api/shipments did not fall back gracefully');
    }

    // Test /api/shipments/[id] when DB query throws
    const failedDetailRes = await getShipmentByIdRoute(
      new NextRequest('http://localhost:3000/api/shipments/FS-8821'),
      { params: Promise.resolve({ id: 'FS-8821' }) }
    );
    const failedDetailData = await failedDetailRes.json();
    console.log(`\n   /api/shipments/FS-8821 under DB lock:`);
    console.log(`     Status: ${failedDetailRes.status}`);
    console.log(`     Success: ${failedDetailData.success}`);
    console.log(`     Data:`, JSON.stringify(failedDetailData));

    if (failedDetailRes.status === 200 && (failedDetailData.source === 'fallback' || failedDetailData.source === 'fallback_error')) {
      console.log('     ✓ PASS: /api/shipments/FS-8821 successfully fell back to static shipment');
    } else {
      console.error(`     ✗ VULNERABILITY FOUND: When database query fails/locks, /api/shipments/[id] returns HTTP ${failedDetailRes.status} (${failedDetailData.error}) instead of falling back to static shipment!`);
    }

  } finally {
    // Restore originals
    (prisma.shipment as any).findMany = originalFindMany;
    (prisma.shipment as any).findUnique = originalFindUnique;
  }
}

testDatabaseFailureFallback().catch(console.error);
