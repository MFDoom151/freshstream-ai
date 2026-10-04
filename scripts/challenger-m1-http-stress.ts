/**
 * FreshStream AI - Challenger M1 Live HTTP Concurrency & Boundary Stress Test
 * 
 * Target: http://localhost:3010
 */

const BASE_URL = 'http://localhost:3010';

async function runHttpStress() {
  console.log('======================================================================');
  console.log(' FRESHSTREAM AI — LIVE HTTP CONCURRENCY & ADVERSARIAL STRESS SUITE   ');
  console.log(' Target:', BASE_URL);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string, detail = '') {
    if (condition) {
      passed++;
      console.log(`  [PASS] ${desc}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${desc} ${detail ? `(${detail})` : ''}`);
    }
  }

  // -------------------------------------------------------------------------
  // 1. ROUTE PROTECTION & MIDDLEWARE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('--- Phase 1: Edge Route Protection & Middleware Redirects ---');

  const protectedRoutes = [
    '/dashboard',
    '/dashboard/shipment/FS-8821',
    '/dashboard/analytics',
    '/dashboard/support',
  ];

  for (const route of protectedRoutes) {
    const res = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' });
    const location = res.headers.get('location') || '';
    const isRedirect = (res.status === 307 || res.status === 302) && location.includes('/login');
    assert(
      isRedirect,
      `Unauthenticated access to "${route}" redirected to /login (Status: ${res.status}, Location: ${location})`
    );
  }

  // Public routes should be accessible
  const publicRoutes = ['/', '/login', '/demo', '/contact'];
  for (const route of publicRoutes) {
    const res = await fetch(`${BASE_URL}${route}`);
    assert(res.status === 200, `Public route "${route}" accessible (Status: 200)`);
  }

  // -------------------------------------------------------------------------
  // 2. CONCURRENT HTTP BLAST ON /api/shipments (100 concurrent requests)
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 2: High Concurrency Blast on /api/shipments (100 requests) ---');

  const blast1Start = Date.now();
  const blast1Promises = Array.from({ length: 100 }, () =>
    fetch(`${BASE_URL}/api/shipments`).then(async (r) => ({
      status: r.status,
      data: await r.json(),
    }))
  );

  const blast1Results = await Promise.all(blast1Promises);
  const blast1Duration = Date.now() - blast1Start;
  const all200Blast1 = blast1Results.every((r) => r.status === 200 && r.data.success && r.data.count === 6);
  const dbSourceCount = blast1Results.filter((r) => r.data.source === 'database').length;

  assert(
    all200Blast1,
    `100 concurrent requests to /api/shipments all returned HTTP 200 in ${blast1Duration}ms (avg: ${(blast1Duration / 100).toFixed(1)}ms)`
  );
  assert(
    dbSourceCount === 100,
    `All 100 requests served from database persistence (${dbSourceCount}/100)`
  );

  // -------------------------------------------------------------------------
  // 3. CONCURRENT HTTP BLAST ON /api/shipments/[id] (120 requests across 6 shipments)
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 3: High Concurrency Blast on /api/shipments/[id] (120 requests) ---');

  const testIds = ['FS-8821', 'FS-9042', 'FS-4103', 'FS-6218', 'FS-3319', 'FS-7750'];
  const blast2Start = Date.now();
  const blast2Promises = Array.from({ length: 120 }, (_, i) => {
    const id = testIds[i % testIds.length];
    return fetch(`${BASE_URL}/api/shipments/${id}`).then(async (r) => ({
      requestedId: id,
      status: r.status,
      data: await r.json(),
    }));
  });

  const blast2Results = await Promise.all(blast2Promises);
  const blast2Duration = Date.now() - blast2Start;
  const all200Blast2 = blast2Results.every(
    (r) => r.status === 200 && r.data.success && r.data.shipment?.id === r.requestedId
  );
  const withLogs = blast2Results.every((r) => Array.isArray(r.data.telemetryLogs) && r.data.telemetryLogs.length > 0);

  assert(
    all200Blast2,
    `120 concurrent /api/shipments/[id] requests returned HTTP 200 in ${blast2Duration}ms`
  );
  assert(
    withLogs,
    `All detail responses include telemetryLogs relation from SQLite`
  );

  // -------------------------------------------------------------------------
  // 4. BOUNDARY & ADVERSARIAL CASES ON /api/shipments/[id]
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 4: Boundary & Adversarial Cases on /api/shipments/[id] ---');

  // Case-insensitivity check (lowercase id)
  const lowerRes = await fetch(`${BASE_URL}/api/shipments/fs-8821`);
  const lowerData = await lowerRes.json();
  assert(
    lowerRes.status === 200 && lowerData.shipment?.id === 'FS-8821',
    `Case-insensitive lookup /api/shipments/fs-8821 resolved to FS-8821`
  );

  // Non-existent shipment ID -> should return 404
  const notFoundRes = await fetch(`${BASE_URL}/api/shipments/FS-9999`);
  const notFoundData = await notFoundRes.json();
  assert(
    notFoundRes.status === 404 && notFoundData.success === false,
    `Non-existent ID /api/shipments/FS-9999 returned HTTP 404 correctly`
  );

  // Malformed XSS payload in URL parameter
  const xssRes = await fetch(`${BASE_URL}/api/shipments/%3Cscript%3Ealert(1)%3C%2Fscript%3E`);
  const xssData = await xssRes.json();
  assert(
    xssRes.status === 404 && xssData.success === false,
    `XSS in URL parameter returned 404 without internal server error or reflection`
  );

  // SQL Injection pattern in URL parameter
  const sqliRes = await fetch(`${BASE_URL}/api/shipments/FS-8821'%20OR%20'1'='1`);
  const sqliData = await sqliRes.json();
  assert(
    sqliRes.status === 404,
    `SQL injection pattern in shipment ID returned 404 safely via Prisma parameterized query`
  );

  // -------------------------------------------------------------------------
  // 5. ML INFERENCE /api/predict CONCURRENCY & VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 5: ML Inference /api/predict Concurrency & Regressions ---');

  // GET /api/predict metadata endpoint
  const metaRes = await fetch(`${BASE_URL}/api/predict`);
  const metaData = await metaRes.json();
  assert(
    metaRes.status === 200 && metaData.status === 'ok' && metaData.model?.status === 'LOADED_AND_READY',
    `GET /api/predict reports model status "LOADED_AND_READY"`
  );

  // Single standard prediction
  const singlePredRes = await fetch(`${BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature: 8.0, humidity: 75.0, gas: 12.0, ethanol: 5.0, cargo: 'beef' }),
  });
  const singlePredData = await singlePredRes.json();
  assert(
    singlePredRes.status === 200 && singlePredData.success && typeof singlePredData.rul_hours === 'number',
    `POST /api/predict succeeded: RUL=${singlePredData.rul_hours}h, BHI=${singlePredData.health_index}%, Status=${singlePredData.status}`
  );

  // Critical anomaly prediction (Ethanol > 35 ppm)
  const critPredRes = await fetch(`${BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature: 28.0, humidity: 90.0, ethanol: 42.0, gas: 18.0 }),
  });
  const critPredData = await critPredRes.json();
  assert(
    critPredRes.status === 200 && critPredData.status === 'CRITICAL',
    `POST /api/predict correctly flagged CRITICAL for acute ethanol spike (42 ppm)`
  );

  // Concurrent burst on /api/predict (50 concurrent POST requests)
  console.log('Executing 50 concurrent HTTP POST requests to /api/predict...');
  const predBurstStart = Date.now();
  const predBurstPromises = Array.from({ length: 50 }, (_, i) =>
    fetch(`${BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temperature: 4.0 + (i % 15) * 0.8,
        humidity: 70.0 + (i % 20),
        gas: 5.0 + (i % 10),
        ethanol: 3.0 + (i % 25),
      }),
    }).then(async (r) => ({ status: r.status, data: await r.json() }))
  );

  const predBurstResults = await Promise.all(predBurstPromises);
  const predBurstDuration = Date.now() - predBurstStart;
  const all200Pred = predBurstResults.every((r) => r.status === 200 && r.data.success);

  assert(
    all200Pred,
    `50 concurrent ONNX inference HTTP requests returned 200 OK in ${predBurstDuration}ms (avg: ${(predBurstDuration / 50).toFixed(1)}ms)`
  );

  // Malformed JSON body handling
  const badJsonRes = await fetch(`${BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ malformed json... }',
  });
  assert(badJsonRes.status === 400, `POST /api/predict rejected malformed JSON with HTTP 400`);

  // -------------------------------------------------------------------------
  // 6. NEXTAUTH END-TO-END AUTHENTICATION FLOW
  // -------------------------------------------------------------------------
  console.log('\n--- Phase 6: NextAuth Authentication Flow & Session Protection ---');

  // Fetch CSRF token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfCookieHeader = csrfRes.headers.get('set-cookie') || '';
  assert(Boolean(csrfData.csrfToken), `NextAuth CSRF token generated successfully`);

  // Sign in with valid operator credentials
  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookieHeader,
    },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: 'operator@freshstream.ai',
      password: 'Password123!',
      json: 'true',
    }).toString(),
    redirect: 'manual',
  });

  const setCookie = loginRes.headers.get('set-cookie');
  const hasSessionCookie = Boolean(setCookie && setCookie.includes('next-auth.session-token'));
  assert(
    hasSessionCookie,
    `Credentials sign in issued session cookie (Status: ${loginRes.status})`
  );

  // Extract session cookie
  let sessionCookie = '';
  if (setCookie) {
    const match = setCookie.match(/next-auth\.session-token=[^;]+/);
    if (match) sessionCookie = match[0];
  }

  // Access /dashboard WITH session cookie -> should return 200 (not redirect!)
  if (sessionCookie) {
    const authedDashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: sessionCookie },
      redirect: 'manual',
    });
    assert(
      authedDashRes.status === 200,
      `Authenticated request to /dashboard succeeded with HTTP 200 (no redirect)`
    );
  }

  // Sign in with invalid password -> should fail
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: 'operator@freshstream.ai',
      password: 'WrongPassword!',
      json: 'true',
    }).toString(),
    redirect: 'manual',
  });
  const badSetCookie = badLoginRes.headers.get('set-cookie');
  const badLoginData = await badLoginRes.json().catch(() => ({}));
  assert(
    !badSetCookie?.includes('next-auth.session-token') || badLoginData.url?.includes('error'),
    `Invalid credentials rejected without issuing authenticated session`
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`HTTP STRESS RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runHttpStress().catch((err) => {
  console.error('Fatal HTTP stress error:', err);
  process.exit(1);
});
