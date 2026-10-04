import http from 'http';

const BASE_URL = 'http://localhost:3005';

const coreRoutes = [
  '/',
  '/problem-solution',
  '/demo',
  '/roi-calculator',
  '/technology',
  '/market',
  '/contact'
];

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  return new Promise((resolve) => {
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const startTime = Date.now();
    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          headers: res.headers,
          duration: Date.now() - startTime,
          bodyLength: body.length,
          bodySnippet: body.slice(0, 200),
          isHtml: (res.headers['content-type'] || '').includes('text/html'),
          hasDocType: body.includes('<!DOCTYPE html>')
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        error: err.message,
        duration: Date.now() - startTime
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runAdversarialStress() {
  console.log('========================================================');
  console.log('CHALLENGER 2: ADVERSARIAL HTTP ROUTE STRESS & RESILIENCY');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function check(cond, desc) {
    if (cond) {
      passed++;
      console.log(`  [PASS] ${desc}`);
    } else {
      failed++;
      console.error(`  [FAIL] ${desc}`);
    }
  }

  // 1. Verify 7 core routes status 200, valid HTML, and headers
  console.log('--- Phase 1: 7 Core Routes Verification ---');
  for (const r of coreRoutes) {
    const res = await request(r);
    check(res.status === 200, `Route "${r}" returned HTTP 200 (took ${res.duration}ms, ${res.bodyLength} bytes)`);
    check(res.isHtml, `Route "${r}" Content-Type is text/html`);
    check(res.hasDocType, `Route "${r}" renders valid HTML with <!DOCTYPE html>`);
  }

  // 2. Trailing slashes
  console.log('\n--- Phase 2: Trailing Slashes & URL Variations ---');
  for (const r of ['/demo/', '/technology/', '/problem-solution/']) {
    const res = await request(r);
    check(res.status === 200 || res.status === 308 || res.status === 307, `Trailing slash "${r}" handled cleanly (status ${res.status})`);
  }

  // 3. Query string resilience (XSS, SQLi, encoding, strange keys)
  console.log('\n--- Phase 3: Malformed & Hostile Query Strings ---');
  const adversarialQueries = [
    '/?lang=ru',
    '/?lang=kz',
    '/?lang=<script>alert("xss")</script>',
    '/demo?cargo=beef&temp=9999&vibe=9999',
    '/roi-calculator?fleet=-50&cargo=-1000',
    '/problem-solution?query=%00%FF%FE',
    '/?__proto__[polluted]=true',
    '/technology?tab=999999',
    '/contact?type=invalid_type_here'
  ];

  for (const q of adversarialQueries) {
    const res = await request(q);
    check(res.status === 200, `Hostile query "${q}" handled safely without 500 crash (status ${res.status})`);
  }

  // 4. Non-existent route 404 test
  console.log('\n--- Phase 4: Route Boundary & 404 Handling ---');
  const nonExistent = ['/does-not-exist', '/unknown/route/path', '/api/non-existent-api'];
  for (const r of nonExistent) {
    const res = await request(r);
    check(res.status === 404, `Boundary route "${r}" properly returned HTTP 404 (status ${res.status})`);
  }

  // 5. Concurrent request burst (50 concurrent requests)
  console.log('\n--- Phase 5: High Concurrency Blast (50 concurrent requests) ---');
  const burstRequests = [];
  for (let i = 0; i < 50; i++) {
    const targetRoute = coreRoutes[i % coreRoutes.length];
    burstRequests.push(request(targetRoute));
  }
  const burstResults = await Promise.all(burstRequests);
  const burstAll200 = burstResults.every(r => r.status === 200);
  const avgDuration = Math.round(burstResults.reduce((acc, r) => acc + r.duration, 0) / burstResults.length);
  check(burstAll200, `All 50 burst requests returned HTTP 200 (avg duration: ${avgDuration}ms)`);

  // 6. HTTP HEAD method verification
  console.log('\n--- Phase 6: HTTP HEAD Method Verification ---');
  for (const r of ['/', '/demo', '/market']) {
    const res = await request(r, { method: 'HEAD' });
    check(res.status === 200, `HEAD request to "${r}" returned HTTP 200`);
    check(res.bodyLength === 0, `HEAD request to "${r}" has empty body (${res.bodyLength} bytes)`);
  }

  console.log('\n========================================================');
  console.log(`TOTAL PASSED: ${passed} | TOTAL FAILED: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialStress();
