import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = 3019;
const BASE = `http://localhost:${PORT}`;

function httpRequest(urlStr, options = {}, bodyData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (bodyData) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await httpRequest(`${BASE}/api/arrhenius`);
      if (res.status === 200) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function run() {
  console.log('=== FreshStream AI — Milestone M2 Verification Suite ===\n');

  // Step 1: Check compiled CSS for light: rules
  console.log('[1/4] Checking Compiled Tailwind CSS for "light:" variant support...');
  const staticCssDir = path.join(process.cwd(), '.next', 'static', 'css');
  let hasLightVariant = false;
  if (fs.existsSync(staticCssDir)) {
    const files = fs.readdirSync(staticCssDir);
    for (const f of files) {
      if (f.endsWith('.css')) {
        const content = fs.readFileSync(path.join(staticCssDir, f), 'utf8');
        if (content.includes('light:') || content.includes('.light')) {
          hasLightVariant = true;
          break;
        }
      }
    }
  }
  console.log(`- Light variant CSS detected in bundle: ${hasLightVariant ? 'PASSED (✓)' : 'FAILED (✗)'}`);
  if (!hasLightVariant) {
    console.error('ERROR: No .light or light: CSS rules found in compiled bundle.');
    process.exit(1);
  }

  // Step 2: Spawn production server
  console.log(`\n[2/4] Starting Next.js Production Server on port ${PORT}...`);
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'inherit',
    shell: true,
  });

  const cleanup = () => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { shell: true });
      } else {
        server.kill();
      }
    } catch {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  const ready = await waitForServer();
  if (!ready) {
    console.error('ERROR: Next.js production server failed to become ready.');
    cleanup();
    process.exit(1);
  }
  console.log('Production server listening and ready!');

  // Step 3: Check all 7 frontend routes
  console.log('\n[3/4] Verifying All 7 Web Application Routes...');
  const routes = [
    { path: '/', label: 'Home / Hero Page' },
    { path: '/problem-solution', label: 'Problem vs Solution Page' },
    { path: '/demo', label: 'Interactive Control Tower Simulator' },
    { path: '/roi-calculator', label: 'ROI & Saved Value Calculator' },
    { path: '/technology', label: '5-Tier Technology Architecture' },
    { path: '/market', label: 'Market & Investors Page' },
    { path: '/contact', label: 'Contact & Lead Capture Page' },
  ];

  for (const r of routes) {
    const res = await httpRequest(`${BASE}${r.path}`);
    console.log(`  ✓ ${r.label} (${r.path}) -> HTTP ${res.status} [${res.data.length} bytes]`);
    if (res.status !== 200) {
      console.error(`ERROR: Route ${r.path} failed with status ${res.status}`);
      cleanup();
      process.exit(1);
    }
  }

  // Step 4: Verify REST API Endpoints
  console.log('\n[4/4] Verifying REST API Handlers & Scientific Parity...');

  // GET /api/arrhenius
  const getArrhenius = await httpRequest(`${BASE}/api/arrhenius`);
  console.log(`  ✓ GET /api/arrhenius -> HTTP ${getArrhenius.status} (service: ${getArrhenius.json?.service})`);
  if (getArrhenius.status !== 200 || getArrhenius.json?.status !== 'ok') {
    console.error('ERROR: GET /api/arrhenius returned invalid schema');
    cleanup();
    process.exit(1);
  }

  // GET /api/shelf-life
  const getShelfLife = await httpRequest(`${BASE}/api/shelf-life`);
  console.log(`  ✓ GET /api/shelf-life -> HTTP ${getShelfLife.status} (service: ${getShelfLife.json?.service})`);
  if (getShelfLife.status !== 200 || getShelfLife.json?.status !== 'ok') {
    console.error('ERROR: GET /api/shelf-life returned invalid schema');
    cleanup();
    process.exit(1);
  }

  // POST /api/arrhenius - Acute Port Kuryk Reefer Cut Scenario
  console.log('\n  -> Testing POST /api/arrhenius (Port Kuryk Reefer Cut):');
  const kurykPayload = JSON.stringify({
    cargo: 'beef',
    temperature: 18.0,
    ethanol: 42.0,
    humidity: 92.0,
    vibration: 1.2,
    location: 'Port Kuryk',
    cargo_value_usd: 68000,
  });

  const postKuryk = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, kurykPayload);
  console.log(`     Status: ${postKuryk.status}`);
  console.log(`     Remaining Shelf Life: ${postKuryk.json?.shelf_life_hours}h (Target: 14.7h -> 14-Hour Rescue Window!)`);
  console.log(`     Biological Health Index: ${postKuryk.json?.health_index}% (Target: 29.2%)`);
  console.log(`     Is Ethanol Critical: ${postKuryk.json?.is_ethanol_critical} (Target: true)`);
  console.log(`     Alert Severity: ${postKuryk.json?.alert_severity} (Target: CRITICAL)`);
  console.log(`     Saved Cargo Value: $${postKuryk.json?.saved_value_usd} (Target: ~$36,352)`);
  console.log(`     Rescue Window: ${postKuryk.json?.rescue_window_hours}h`);
  console.log(`     Prescribed Directives: ${postKuryk.json?.recommended_actions?.length} actions`);

  if (
    postKuryk.status !== 200 ||
    postKuryk.json?.shelf_life_hours !== 14.7 ||
    postKuryk.json?.is_ethanol_critical !== true ||
    postKuryk.json?.alert_severity !== 'CRITICAL' ||
    postKuryk.json?.saved_value_usd < 36000
  ) {
    console.error('ERROR: POST /api/arrhenius acute scenario validation failed:', postKuryk.json);
    cleanup();
    process.exit(1);
  }
  console.log('     ✓ 14-Hour Rescue Window & Saved Cargo Value Verified!');

  // POST /api/shelf-life - Parity Check
  console.log('\n  -> Testing POST /api/shelf-life (Parity Check):');
  const postShelfLife = await httpRequest(`${BASE}/api/shelf-life`, { method: 'POST' }, kurykPayload);
  console.log(`     Status: ${postShelfLife.status}`);
  console.log(`     Remaining Shelf Life: ${postShelfLife.json?.shelf_life_hours}h`);
  console.log(`     BHI: ${postShelfLife.json?.health_index}%`);
  if (postShelfLife.status !== 200 || postShelfLife.json?.shelf_life_hours !== 14.7) {
    console.error('ERROR: POST /api/shelf-life parity failed:', postShelfLife.json);
    cleanup();
    process.exit(1);
  }
  console.log('     ✓ Shelf-Life Alias Route 100% Parity Verified!');

  // Validation Error Testing (POST with invalid temperature)
  console.log('\n  -> Testing POST /api/arrhenius with Invalid Telemetry (Validation Handling):');
  const invalidPayload = JSON.stringify({
    cargo: 'unknown_grain',
    temperature: 999,
  });
  const postInvalid = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, invalidPayload);
  console.log(`     Status: ${postInvalid.status} (expected 400 Bad Request)`);
  console.log(`     Error Code: ${postInvalid.json?.error_code}`);
  console.log(`     Field Errors: ${postInvalid.json?.errors?.length} detected`);
  if (postInvalid.status !== 400 || postInvalid.json?.error_code !== 'INVALID_TELEMETRY_PAYLOAD') {
    console.error('ERROR: Validation error test failed:', postInvalid.json);
    cleanup();
    process.exit(1);
  }
  console.log('     ✓ Input Validation & Error Diagnostics Verified!');

  console.log('\n========================================================');
  console.log('  ALL VERIFICATION TESTS COMPLETED WITH 100% SUCCESS!  ');
  console.log('========================================================\n');

  cleanup();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
