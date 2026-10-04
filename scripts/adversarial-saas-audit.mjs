import http from 'http';

const PORT = parseInt(process.env.TEST_PORT || '3000', 10);
const HOST = 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;

console.log(`\n===============================================================`);
console.log(`CHALLENGER 2: ADVERSARIAL SAAS ROUTE & ENDPOINT STRESS AUDIT`);
console.log(`Targeting: ${BASE_URL}`);
console.log(`===============================================================\n`);

let passedTests = 0;
let failedTests = 0;

function assert(condition, message, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message} ${details ? '--> ' + details : ''}`);
  }
}

function request(path, options = {}) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const reqOptions = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        const duration = Math.round(performance.now() - startTime);
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {}

        resolve({
          path,
          statusCode: res.statusCode,
          headers: res.headers,
          duration,
          body,
          json,
          isHtml: (res.headers['content-type'] || '').includes('text/html'),
          location: res.headers['location'],
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        error: err.message,
        statusCode: null,
      });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function requestFollowRedirects(path, maxRedirects = 5) {
  let currentPath = path;
  let redirectCount = 0;
  let history = [path];

  while (redirectCount < maxRedirects) {
    const res = await request(currentPath);
    if ([301, 302, 307, 308].includes(res.statusCode) && res.location) {
      redirectCount++;
      currentPath = res.location;
      history.push(currentPath);
    } else {
      return { ...res, history, redirectCount };
    }
  }

  return { error: 'Too many redirects', history, redirectCount };
}

async function runAudit() {
  // -------------------------------------------------------------------------
  // 1. Core SaaS Routes
  // -------------------------------------------------------------------------
  console.log('--- 1. Primary SaaS Application Routes ---');
  
  const landingRes = await request('/');
  assert(landingRes.statusCode === 200, 'GET / returns HTTP 200');
  assert(landingRes.isHtml, 'GET / returns HTML Content-Type');
  assert(landingRes.body.includes('FreshStream') && landingRes.body.includes('/dashboard'), 'GET / contains FreshStream branding and /dashboard links');

  const dashRes = await request('/dashboard');
  assert(dashRes.statusCode === 200, 'GET /dashboard returns HTTP 200');
  assert(dashRes.isHtml, 'GET /dashboard returns HTML Content-Type');
  assert(dashRes.body.includes('Live Fleet Telematics') || dashRes.body.includes('TMTM') || dashRes.body.includes('dashboard'), 'GET /dashboard renders fleet dashboard components');

  const analyticsRes = await request('/dashboard/analytics');
  assert(analyticsRes.statusCode === 200, 'GET /dashboard/analytics returns HTTP 200');
  assert(analyticsRes.isHtml, 'GET /dashboard/analytics returns HTML Content-Type');

  const supportRes = await request('/dashboard/support');
  assert(supportRes.statusCode === 200, 'GET /dashboard/support returns HTTP 200');
  assert(supportRes.isHtml, 'GET /dashboard/support returns HTML Content-Type');

  // -------------------------------------------------------------------------
  // 2. Dynamic Shipment Routes & Resiliency
  // -------------------------------------------------------------------------
  console.log('\n--- 2. Dynamic Shipment Route Parameter & Boundary Testing ---');

  const validShipmentRes = await request('/dashboard/shipment/KZ-ALM-702');
  assert(validShipmentRes.statusCode === 200, 'GET /dashboard/shipment/KZ-ALM-702 returns HTTP 200');
  assert(validShipmentRes.body.includes('KZ-ALM-702') || validShipmentRes.body.includes('Almaty'), 'Shipment KZ-ALM-702 details loaded');

  const validShipment2Res = await request('/dashboard/shipment/FS-8821');
  assert(validShipment2Res.statusCode === 200, 'GET /dashboard/shipment/FS-8821 returns HTTP 200');

  // Adversarial / Non-existent ID: Must NOT 500 crash
  const invalidShipmentRes = await request('/dashboard/shipment/INVALID-NONEXISTENT-999');
  assert(invalidShipmentRes.statusCode === 200 || invalidShipmentRes.statusCode === 404, 
    'GET /dashboard/shipment/INVALID-NONEXISTENT-999 handled cleanly without crash (code: ' + invalidShipmentRes.statusCode + ')');

  // URL encoded / special characters
  const hostileShipmentRes = await request('/dashboard/shipment/%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  assert(hostileShipmentRes.statusCode === 200 || hostileShipmentRes.statusCode === 400 || hostileShipmentRes.statusCode === 404,
    'GET /dashboard/shipment/<script> handled safely without 500 crash (code: ' + hostileShipmentRes.statusCode + ')');

  // -------------------------------------------------------------------------
  // 3. Marketing Route Redirection & Removal
  // -------------------------------------------------------------------------
  console.log('\n--- 3. Deleted Marketing Routes Redirection Verification ---');

  const marketingRoutes = [
    { from: '/problem-solution', expectedDest: '/dashboard' },
    { from: '/roi-calculator', expectedDest: '/dashboard' },
    { from: '/market', expectedDest: '/dashboard' },
    { from: '/technology', expectedDest: '/dashboard' },
    { from: '/demo', expectedDest: '/dashboard/shipment/FS-8821' },
    { from: '/contact', expectedDest: '/dashboard/support' },
  ];

  for (const item of marketingRoutes) {
    const rawRes = await request(item.from);
    assert(
      [301, 302, 307, 308].includes(rawRes.statusCode),
      `Route "${item.from}" returns HTTP redirect (got ${rawRes.statusCode})`
    );
    assert(
      rawRes.location === item.expectedDest,
      `Route "${item.from}" redirects to "${item.expectedDest}" (got "${rawRes.location}")`
    );

    const followed = await requestFollowRedirects(item.from);
    assert(
      followed.statusCode === 200,
      `Following redirect from "${item.from}" resolves to HTTP 200 at ${followed.history.join(' -> ')}`
    );
  }

  // -------------------------------------------------------------------------
  // 4. ML Inference API Endpoint (/api/predict)
  // -------------------------------------------------------------------------
  console.log('\n--- 4. ML Inference API Endpoint (/api/predict) ---');

  // 4.1 GET metadata
  const apiGetRes = await request('/api/predict');
  assert(apiGetRes.statusCode === 200, 'GET /api/predict returns HTTP 200');
  assert(apiGetRes.json && apiGetRes.json.status === 'ok', 'GET /api/predict JSON status is "ok"');
  assert(apiGetRes.json?.model?.status === 'LOADED_AND_READY', 'GET /api/predict reports model LOADED_AND_READY');

  // 4.2 POST valid baseline reading
  const postBaseline = await request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { temperature: 8.0, humidity: 75.0, gas: 12.0, ethanol: 5.0, cargo: 'beef' }
  });
  assert(postBaseline.statusCode === 200, 'POST /api/predict (baseline) returns HTTP 200');
  assert(postBaseline.json?.success === true, 'POST /api/predict success is true');
  assert(typeof postBaseline.json?.rul_hours === 'number', `Predicted RUL is a number (${postBaseline.json?.rul_hours}h)`);
  assert(typeof postBaseline.json?.health_index === 'number', `Health Index is a number (${postBaseline.json?.health_index}%)`);

  // 4.3 POST acute fermentation spike (adversarial stress)
  const postCritical = await request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { temperature: 28.0, humidity: 90.0, gas: 18.0, ethanol: 42.0, cargo: 'beef' }
  });
  assert(postCritical.statusCode === 200, 'POST /api/predict (critical fermentation) returns HTTP 200');
  assert(postCritical.json?.status === 'CRITICAL', `High ethanol triggers CRITICAL status (got: ${postCritical.json?.status})`);
  const hasFermentAlert = postCritical.json?.alerts?.some((a) => a.type === 'FERMENTATION_ALERT');
  assert(hasFermentAlert, 'Critical ethanol trigger generated FERMENTATION_ALERT in alerts list');

  // 4.4 POST sequence readings
  const postSeq = await request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      sequence: [
        { temperature: 4.0, humidity: 82.0, ethanol: 2.0, gas: 3.0 },
        { temperature: 4.5, humidity: 81.0, ethanol: 2.5, gas: 3.5 },
        { temperature: 5.0, humidity: 80.0, ethanol: 3.0, gas: 4.0 },
      ]
    }
  });
  assert(postSeq.statusCode === 200, 'POST /api/predict (sequence input) returns HTTP 200');
  assert(postSeq.json?.success === true, 'Sequence prediction successfully executed');

  // 4.5 POST empty JSON object (fallback handling)
  const postEmpty = await request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {}
  });
  assert(postEmpty.statusCode === 200, 'POST /api/predict with empty object {} handles fallback gracefully (HTTP 200)');

  // 4.6 POST malformed JSON syntax
  const postMalformed = await request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ temperature: 8, invalid_json '
  });
  assert(postMalformed.statusCode === 400, 'POST /api/predict with malformed JSON returns HTTP 400 (Bad Request)');

  // 4.7 POST non-object primitive
  const postPrimitive = await request('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '12345'
  });
  assert(postPrimitive.statusCode === 400, 'POST /api/predict with scalar primitive returns HTTP 400');

  // -------------------------------------------------------------------------
  // 5. Arrhenius API Backward Compatibility (/api/arrhenius)
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Arrhenius Fallback Route (/api/arrhenius) ---');
  const arrheniusRes = await request('/api/arrhenius');
  assert(arrheniusRes.statusCode === 200, 'GET /api/arrhenius returns HTTP 200');

  const arrheniusPost = await request('/api/arrhenius', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { cargo: 'beef', temperature: 10, ethanol: 20, humidity: 80, vibration: 0.5 }
  });
  assert(arrheniusPost.statusCode === 200, 'POST /api/arrhenius returns HTTP 200');
  assert(typeof arrheniusPost.json?.shelf_life_hours === 'number', 'Arrhenius returns shelf_life_hours');

  // -------------------------------------------------------------------------
  // 6. Concurrency Blast (40 concurrent requests)
  // -------------------------------------------------------------------------
  console.log('\n--- 6. High Concurrency Blast (40 simultaneous requests) ---');
  const targetRoutes = [
    '/',
    '/dashboard',
    '/dashboard/shipment/KZ-ALM-702',
    '/dashboard/analytics',
    '/dashboard/support',
    '/api/predict'
  ];

  const burstPromises = [];
  for (let i = 0; i < 40; i++) {
    const route = targetRoutes[i % targetRoutes.length];
    burstPromises.push(request(route));
  }

  const burstResults = await Promise.all(burstPromises);
  const burstSuccess = burstResults.every((r) => r.statusCode === 200);
  const avgDuration = Math.round(
    burstResults.reduce((acc, r) => acc + (r.duration || 0), 0) / burstResults.length
  );
  assert(burstSuccess, `All 40 burst requests succeeded with HTTP 200 (avg latency: ${avgDuration}ms)`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`AUDIT RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
