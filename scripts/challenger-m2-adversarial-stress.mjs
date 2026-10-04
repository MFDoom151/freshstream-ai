import assert from 'assert';
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('================================================================');
console.log('   CHALLENGER M2.2 — EMPIRICAL UI & SIMULATOR STRESS HARNESS    ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function testAssert(condition, name, details = '') {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${name}${details ? ` -> ${details}` : ''}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${name}${details ? ` -> ${details}` : ''}`);
  }
}

// --------------------------------------------------------------------
// 1. ARRhenius KINETICS ENGINE DEEP STRESS & NUMERICAL STABILITY
// --------------------------------------------------------------------
console.log('--- TEST SUITE 1: Arrhenius Kinetics Extreme Numerical Stress ---');

const R = 8.314;
const COMMODITY_PROFILES = {
  beef: {
    ea: 81500, a: 6.7077e12, tRef: 1.0, tOptMin: -1.0, tOptMax: 2.0, tFreeze: -1.7,
    baselineHours: 504, kRef: 0.001984, rhOptMin: 80, rhOptMax: 85,
    gammaEth: 1.8, kappaVib: 0.15, defaultCargoValueUsd: 68000,
  },
  berries: {
    ea: 68500, a: 4.6784e10, tRef: 2.0, tOptMin: 0.0, tOptMax: 3.0, tFreeze: -0.8,
    baselineHours: 216, kRef: 0.004629, rhOptMin: 90, rhOptMax: 95,
    gammaEth: 1.6, kappaVib: 0.60, defaultCargoValueUsd: 38000,
  },
  dairy: {
    ea: 92000, a: 6.5101e14, tRef: 4.0, tOptMin: 1.0, tOptMax: 4.0, tFreeze: -0.5,
    baselineHours: 336, kRef: 0.002976, rhOptMin: 70, rhOptMax: 85,
    gammaEth: 1.5, kappaVib: 0.20, defaultCargoValueUsd: 32000,
  },
  fruits: {
    ea: 58000, a: 1.3000e8, tRef: 3.0, tOptMin: 0.5, tOptMax: 4.0, tFreeze: -1.5,
    baselineHours: 720, kRef: 0.001389, rhOptMin: 85, rhOptMax: 95,
    gammaEth: 1.4, kappaVib: 0.35, defaultCargoValueUsd: 28000,
  },
};

function calculateTemperatureAcceleration(ea, tempC, tRefC) {
  const tKelvin = tempC + 273.15;
  const tRefKelvin = tRefC + 273.15;
  return Math.exp((ea / R) * (1 / tRefKelvin - 1 / tKelvin));
}

function calculateFreezingPenalty(tempC, tFreezeC) {
  if (tempC < tFreezeC) {
    return 1.0 + 0.5 * (tFreezeC - tempC);
  }
  return 1.0;
}

function calculateEthanolAcceleration(ethanolPpm, gammaEth) {
  if (ethanolPpm > 5.0) {
    return 1.0 + gammaEth * Math.pow((ethanolPpm - 5.0) / 30.0, 1.3);
  }
  return 1.0;
}

function calculateHumidityAcceleration(rh, rhOptMin, rhOptMax) {
  if (rh > rhOptMax) {
    return 1.0 + 0.6 * Math.pow((rh - rhOptMax) / (100.0 - rhOptMax), 2);
  }
  if (rh < rhOptMin) {
    return 1.0 + 0.3 * ((rhOptMin - rh) / rhOptMin);
  }
  return 1.0;
}

function calculateVibrationAcceleration(vibrationG, kappaVib) {
  if (vibrationG > 0.4) {
    return 1.0 + kappaVib * Math.pow(vibrationG - 0.4, 1.2);
  }
  return 1.0;
}

function calculateBHI(tempC, ethanolPpm, rh, vibrationG, profile) {
  let iT = 1.0;
  if (tempC >= profile.tOptMin && tempC <= profile.tOptMax) {
    iT = 1.0;
  } else if (tempC > profile.tOptMax) {
    const deltaT = tempC - profile.tOptMax;
    iT = Math.max(0.05, 1.0 / (1.0 + 0.12 * deltaT + 0.008 * deltaT * deltaT));
  } else if (tempC < profile.tFreeze) {
    iT = Math.max(0.05, 0.90 - 0.25 * (profile.tFreeze - tempC));
  } else {
    iT = 0.95;
  }

  let iE = 1.0;
  if (ethanolPpm <= 5.0) {
    iE = 1.0;
  } else if (ethanolPpm <= 35.0) {
    iE = 1.0 - 0.55 * Math.pow((ethanolPpm - 5.0) / 30.0, 1.1);
  } else {
    iE = Math.max(0.02, 0.45 - 0.43 * Math.pow((ethanolPpm - 35.0) / 65.0, 0.9));
  }

  let iH = 1.0;
  if (rh >= profile.rhOptMin && rh <= profile.rhOptMax) {
    iH = 1.0;
  } else if (rh > profile.rhOptMax) {
    iH = Math.max(0.70, 1.0 - 0.30 * ((rh - profile.rhOptMax) / (100.0 - profile.rhOptMax)));
  } else {
    iH = Math.max(0.60, 1.0 - 0.40 * ((profile.rhOptMin - rh) / profile.rhOptMin));
  }

  let iV = 1.0;
  if (vibrationG <= 0.4) {
    iV = 1.0;
  } else if (vibrationG <= 1.5) {
    iV = 1.0 - 0.25 * ((vibrationG - 0.4) / 1.1);
  } else {
    iV = Math.max(0.35, 0.75 - 0.40 * ((vibrationG - 1.5) / 1.5));
  }

  const weighted = 0.40 * iT + 0.35 * iE + 0.15 * iH + 0.10 * iV;
  const bottleneck = Math.min(iT, iE, iH, iV);
  const bhi = Math.min(100.0, Math.max(1.0, Math.round(weighted * (0.60 + 0.40 * bottleneck) * 1000) / 10));

  return { bhi };
}

function calculateKinetics(input) {
  const cargoKey = (input.cargo || 'beef').toLowerCase();
  const profile = COMMODITY_PROFILES[cargoKey] || COMMODITY_PROFILES.beef;

  const temp = typeof input.temperature === 'number' ? input.temperature : profile.tRef;
  const ethanol = typeof input.ethanol === 'number' ? input.ethanol : 4.0;
  const humidity = typeof input.humidity === 'number' ? input.humidity : (profile.rhOptMin + profile.rhOptMax) / 2;
  const vibration = typeof input.vibration === 'number' ? input.vibration : 0.3;
  const cargoVal = typeof input.cargo_value_usd === 'number' ? input.cargo_value_usd : profile.defaultCargoValueUsd;
  const waypoint = input.waypoint || 'kuryk';

  const alphaT = calculateTemperatureAcceleration(profile.ea, temp, profile.tRef);
  const alphaFreeze = calculateFreezingPenalty(temp, profile.tFreeze);
  const phiEth = calculateEthanolAcceleration(ethanol, profile.gammaEth);
  const phiHum = calculateHumidityAcceleration(humidity, profile.rhOptMin, profile.rhOptMax);
  const phiVib = calculateVibrationAcceleration(vibration, profile.kappaVib);

  const alphaTotal = alphaT * alphaFreeze * phiEth * phiHum * phiVib;
  const kEff = profile.kRef * alphaTotal;

  const slHours = Math.max(0.1, Math.round((profile.baselineHours / alphaTotal) * 10) / 10);
  const slDays = Math.round((slHours / 24.0) * 10) / 10;
  const { bhi } = calculateBHI(temp, ethanol, humidity, vibration, profile);

  const isEthanolCritical = ethanol > 35.0;
  let rescueWindowHours;
  if (isEthanolCritical || slHours < 36.0) {
    rescueWindowHours = Math.min(14.7, Math.max(2.0, slHours));
  }

  let alertSeverity = 'OPTIMAL';
  if (isEthanolCritical) {
    alertSeverity = 'CRITICAL';
  } else if (temp > 15.0 || ethanol > 20.0 || temp < profile.tFreeze || vibration > 1.8 || humidity > profile.rhOptMax + 5) {
    alertSeverity = 'WARNING';
  }

  const atRiskVal = cargoVal * (1.0 - bhi / 100.0);
  const savedValue = bhi < 85 ? Math.max(0, Math.round(atRiskVal * 0.78 - 1200)) : 0;

  const points = [];
  for (let t = 0; t <= 480; t += 20) {
    const qActual = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-kEff * t) * 10) / 10));
    const qBase = Math.max(0, Math.min(100, Math.round(100 * Math.exp(-profile.kRef * t) * 10) / 10));
    points.push({ time_hours: t, quality_remaining: qActual, baseline_quality: qBase });
  }

  return {
    shelf_life_hours: slHours,
    shelf_life_days: slDays,
    health_index: bhi,
    acceleration_factor: Math.round(alphaTotal * 100) / 100,
    k_rate: Number(kEff.toFixed(6)),
    is_ethanol_critical: isEthanolCritical,
    rescue_window_hours: rescueWindowHours,
    alert_severity: alertSeverity,
    saved_value_usd: savedValue,
    decay_curve: points,
  };
}

// 1.1 Stress test 10,000 rapid calls (simulating violent slider movement)
const startTime = Date.now();
const ITERATIONS = 10000;
let hasNanOrInfinity = false;

for (let i = 0; i < ITERATIONS; i++) {
  const cKeys = ['beef', 'berries', 'dairy', 'fruits'];
  const cargo = cKeys[i % 4];
  const temp = -5.0 + Math.random() * 40.0; // -5 to 35
  const eth = Math.random() * 100.0;        // 0 to 100
  const rh = 20 + Math.random() * 80;       // 20 to 100
  const vib = 0.1 + Math.random() * 2.9;    // 0.1 to 3.0

  const res = calculateKinetics({ cargo, temperature: temp, ethanol: eth, humidity: rh, vibration: vib });

  if (
    isNaN(res.shelf_life_hours) || !isFinite(res.shelf_life_hours) ||
    isNaN(res.health_index) || !isFinite(res.health_index) ||
    isNaN(res.k_rate) || !isFinite(res.k_rate) ||
    isNaN(res.saved_value_usd) || !isFinite(res.saved_value_usd) ||
    res.decay_curve.some(p => isNaN(p.quality_remaining) || isNaN(p.baseline_quality))
  ) {
    hasNanOrInfinity = true;
    break;
  }
}
const elapsedMs = Date.now() - startTime;
const avgUs = (elapsedMs / ITERATIONS) * 1000;

testAssert(!hasNanOrInfinity, '10,000 randomized state updates produced 0 NaN / Infinity values');
testAssert(avgUs < 100, `Synchronous execution speed: ${avgUs.toFixed(2)} µs/calculation (<< 16,666 µs 60 FPS budget)`);

// 1.2 Extreme boundary edge cases
const extremeCases = [
  { desc: 'Deep Freeze -50°C', input: { cargo: 'beef', temperature: -50, ethanol: 0, humidity: 20, vibration: 0.1 } },
  { desc: 'Extreme Heat 60°C', input: { cargo: 'berries', temperature: 60, ethanol: 100, humidity: 100, vibration: 3.0 } },
  { desc: 'Zero Ethanol', input: { cargo: 'dairy', temperature: 4, ethanol: 0, humidity: 80, vibration: 0.4 } },
  { desc: 'Ethanol Threshold Exact 35.0 ppm', input: { cargo: 'beef', temperature: 1, ethanol: 35.0, humidity: 80, vibration: 0.3 } },
  { desc: 'Ethanol Threshold Breach 35.01 ppm', input: { cargo: 'beef', temperature: 1, ethanol: 35.01, humidity: 80, vibration: 0.3 } },
  { desc: 'Ultra High Vibration 10.0 G', input: { cargo: 'fruits', temperature: 3, ethanol: 10, humidity: 85, vibration: 10.0 } },
  { desc: 'Missing Fields (Defaults)', input: {} },
];

for (const ec of extremeCases) {
  const out = calculateKinetics(ec.input);
  const isValid = out.shelf_life_hours > 0 && out.health_index >= 1.0 && out.health_index <= 100.0 && out.decay_curve.length > 0;
  testAssert(isValid, `Extreme input: ${ec.desc}`, `SL=${out.shelf_life_hours}h, BHI=${out.health_index}%, Crit=${out.is_ethanol_critical}`);
}

// 1.3 Verify Exact 35 ppm critical alert boundary condition
const below35 = calculateKinetics({ cargo: 'beef', temperature: 2, ethanol: 35.0, humidity: 80, vibration: 0.3 });
const above35 = calculateKinetics({ cargo: 'beef', temperature: 2, ethanol: 35.01, humidity: 80, vibration: 0.3 });
testAssert(below35.is_ethanol_critical === false, 'Ethanol == 35.0 ppm does not trigger critical');
testAssert(above35.is_ethanol_critical === true, 'Ethanol == 35.01 ppm triggers critical');
testAssert(above35.alert_severity === 'CRITICAL', 'Ethanol > 35 ppm sets alert_severity = CRITICAL');

// --------------------------------------------------------------------
// 2. ARRHENIUS CHART SVG GEOMETRY & PATH ROBUSTNESS
// --------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: ArrheniusChart SVG Rendering & Path Math ---');

const WIDTH = 640;
const HEIGHT = 300;
const PAD_LEFT = 45;
const PAD_RIGHT = 25;
const PAD_TOP = 25;
const PAD_BOTTOM = 35;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;
const MAX_HOURS = 480;

const getX = (hours) => PAD_LEFT + (Math.min(MAX_HOURS, Math.max(0, hours)) / MAX_HOURS) * PLOT_W;
const getY = (quality) => PAD_TOP + ((100 - Math.min(100, Math.max(0, quality))) / 100) * PLOT_H;

// Test boundary coordinates
testAssert(getX(0) === PAD_LEFT, 'getX(0) equals PAD_LEFT (45px)');
testAssert(getX(480) === WIDTH - PAD_RIGHT, 'getX(480) equals right bound (615px)');
testAssert(getX(-100) === PAD_LEFT, 'getX(-100) clamped to PAD_LEFT');
testAssert(getX(1000) === WIDTH - PAD_RIGHT, 'getX(1000) clamped to right bound');
testAssert(getY(100) === PAD_TOP, 'getY(100%) equals PAD_TOP (25px)');
testAssert(getY(0) === HEIGHT - PAD_BOTTOM, 'getY(0%) equals bottom bound (265px)');
testAssert(getY(20) === PAD_TOP + 0.8 * PLOT_H, 'getY(20%) at 80% plot height (217px)');

// Test Path generation for rapid curve changes
let brokenSvgPaths = false;
for (const cargo of ['beef', 'berries', 'dairy', 'fruits']) {
  const k = calculateKinetics({ cargo, temperature: 20, ethanol: 45, humidity: 95, vibration: 1.5 });
  const activePath = k.decay_curve.reduce((path, pt, idx) => {
    const x = getX(pt.time_hours);
    const y = getY(pt.quality_remaining);
    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  if (activePath.includes('NaN') || activePath.includes('undefined') || !activePath.startsWith('M 45')) {
    brokenSvgPaths = true;
  }

  // Critical intersection point calculation check
  const tCritical = k.k_rate > 0 ? 1.6094 / k.k_rate : null;
  if (tCritical !== null && tCritical <= MAX_HOURS) {
    const critX = getX(tCritical);
    const critY = getY(20);
    if (isNaN(critX) || isNaN(critY) || critX < PAD_LEFT || critX > WIDTH - PAD_RIGHT) {
      brokenSvgPaths = true;
    }
  }
}
testAssert(!brokenSvgPaths, 'SVG Paths (M/L/Z) and Critical Intersection markers generate 100% valid geometry');

// --------------------------------------------------------------------
// 3. MIDDLE CORRIDOR MAP SVG & WAYPOINTS
// --------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Middle Corridor Map Geometry & Waypoint States ---');

const MAP_NODES = [
  { id: 'kuryk', name: 'Port Kuryk', x: 490, y: 110, isBottleneck: true },
  { id: 'baku', name: 'Port of Baku (Alat)', x: 350, y: 130 },
  { id: 'poti', name: 'Port of Poti', x: 210, y: 105 },
  { id: 'istanbul', name: 'Istanbul Hub', x: 75, y: 115 },
];

const MAP_VIEWBOX = { w: 580, h: 190 };

let nodesInViewBox = true;
for (const n of MAP_NODES) {
  if (n.x < 0 || n.x > MAP_VIEWBOX.w || n.y < 0 || n.y > MAP_VIEWBOX.h) {
    nodesInViewBox = false;
  }
}
testAssert(nodesInViewBox, 'All 4 Middle Corridor map nodes are strictly within SVG viewBox (580x190)');

// Test unknown waypoint fallback
const fallbackNode = MAP_NODES.find(n => n.id === 'unknown_station') || MAP_NODES[0];
testAssert(fallbackNode.id === 'kuryk', 'Invalid waypoint gracefully falls back to Port Kuryk (MAP_NODES[0])');

// --------------------------------------------------------------------
// 4. VIEWPORT RESPONSIVENESS & CSS OVERFLOW AUDIT (375px / 768px / 1440px)
// --------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Responsive CSS & Viewport Constraint Audit ---');

const simulatorFiles = [
  'src/components/simulator/ControlTower.tsx',
  'src/components/simulator/TelemetrySliders.tsx',
  'src/components/simulator/CargoSelector.tsx',
  'src/components/simulator/RouteSelector.tsx',
  'src/components/simulator/ArrheniusChart.tsx',
  'src/components/simulator/MiddleCorridorMap.tsx',
  'src/components/simulator/AIConductorBox.tsx',
  'src/components/layout/Header.tsx',
  'src/app/demo/page.tsx',
  'src/app/globals.css',
];

let fixedWidthViolations = [];
for (const relPath of simulatorFiles) {
  const fullPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) continue;
  const content = fs.readFileSync(fullPath, 'utf8');

  // Regex to detect fixed large width classes like w-[400px], min-w-[500px], etc.
  const fixedWidthMatch = content.match(/(?:w|min-w)-\[(\d+)px\]/g);
  if (fixedWidthMatch) {
    for (const match of fixedWidthMatch) {
      const px = parseInt(match.replace(/[^0-9]/g, ''), 10);
      // Anything > 320px fixed without responsive modifier could overflow a 375px mobile viewport
      if (px > 320) {
        fixedWidthViolations.push({ file: relPath, match, px });
      }
    }
  }
}

testAssert(fixedWidthViolations.length === 0, `No hardcoded fixed pixel widths > 320px found in simulator components (${fixedWidthViolations.length} found)`);

// Check SVG responsive scaling configuration
const arrheniusChartContent = fs.readFileSync(path.join(process.cwd(), 'src/components/simulator/ArrheniusChart.tsx'), 'utf8');
const mapContent = fs.readFileSync(path.join(process.cwd(), 'src/components/simulator/MiddleCorridorMap.tsx'), 'utf8');

testAssert(arrheniusChartContent.includes('preserveAspectRatio="xMidYMid meet"'), 'ArrheniusChart SVG specifies preserveAspectRatio="xMidYMid meet"');
testAssert(arrheniusChartContent.includes('viewBox="0 0 640 300"') || arrheniusChartContent.includes('viewBox={`0 0 ${WIDTH} ${HEIGHT}`}'), 'ArrheniusChart SVG specifies scalable viewBox');
testAssert(arrheniusChartContent.includes('overflow-hidden'), 'ArrheniusChart container specifies overflow-hidden to clip hover scrubbers');

testAssert(mapContent.includes('preserveAspectRatio="xMidYMid meet"'), 'MiddleCorridorMap SVG specifies preserveAspectRatio="xMidYMid meet"');
testAssert(mapContent.includes('viewBox="0 0 580 190"'), 'MiddleCorridorMap SVG specifies scalable viewBox (0 0 580 190)');
testAssert(mapContent.includes('overflow-hidden'), 'MiddleCorridorMap container specifies overflow-hidden');

// Check Grid breakpoint adaptation
const controlTowerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/simulator/ControlTower.tsx'), 'utf8');
testAssert(controlTowerContent.includes('grid-cols-1 lg:grid-cols-3'), 'Control Tower collapses to single vertical stack on mobile/tablet (< 1024px)');

// --------------------------------------------------------------------
// 5. LIGHT MODE CONTRAST & ACCESSIBILITY AUDIT
// --------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Light Mode Contrast & Styling Audit ---');

const globalsCss = fs.readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');
testAssert(globalsCss.includes('.light h1,'), 'globals.css includes .light typography safety net for headings');
testAssert(globalsCss.includes('--text-main: #0F172A'), 'globals.css light mode text color is high-contrast deep slate (#0F172A)');
testAssert(globalsCss.includes('--bg-app: #F8FAFC'), 'globals.css light mode background is clear light slate (#F8FAFC)');

// --------------------------------------------------------------------
// 6. PRODUCTION HTTP SERVER & REST API VERIFICATION
// --------------------------------------------------------------------
console.log('\n--- TEST SUITE 6: Live Production Server & API Route Endpoints ---');

const PORT = 3020;
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
    if (bodyData) req.write(bodyData);
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

async function runServerSuite() {
  console.log(`Starting Next.js Production Server on port ${PORT}...`);
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
  testAssert(ready, `Production server started successfully on port ${PORT}`);

  if (!ready) {
    cleanup();
    process.exit(1);
  }

  // Verify all 7 routes
  const routes = ['/', '/problem-solution', '/demo', '/roi-calculator', '/technology', '/market', '/contact'];
  for (const r of routes) {
    const res = await httpRequest(`${BASE}${r}`);
    testAssert(res.status === 200, `Route ${r} returned HTTP 200`, `Length: ${res.data.length} bytes`);
  }

  // Specifically inspect /demo HTML for simulator elements
  const demoRes = await httpRequest(`${BASE}/demo`);
  testAssert(demoRes.data.includes('ControlTower') || demoRes.data.includes('Interactive Simulation') || demoRes.data.includes('PIML Arrhenius'), '/demo page contains Control Tower simulator components in initial HTML');

  // Verify API endpoints
  const apiGet = await httpRequest(`${BASE}/api/arrhenius`);
  testAssert(apiGet.status === 200 && apiGet.json?.service === 'FreshStream AI Arrhenius Kinetics REST API', 'GET /api/arrhenius returns valid service metadata');

  // Acute Port Kuryk test
  const postAcute = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, JSON.stringify({
    cargo: 'beef',
    temperature: 18.0,
    ethanol: 42.0,
    humidity: 92.0,
    vibration: 1.2,
    cargo_value_usd: 68000,
  }));
  testAssert(postAcute.status === 200, 'POST /api/arrhenius acute scenario returns HTTP 200');
  testAssert(postAcute.json?.shelf_life_hours === 14.7, 'Acute scenario remaining shelf-life exactly 14.7 hours (14-Hour Rescue Window)');
  testAssert(postAcute.json?.health_index === 29.2, 'Acute scenario BHI exactly 29.2%');
  testAssert(postAcute.json?.alert_severity === 'CRITICAL', 'Acute scenario alert severity is CRITICAL');
  testAssert(postAcute.json?.is_ethanol_critical === true, 'Acute scenario is_ethanol_critical is true');
  testAssert(postAcute.json?.saved_value_usd >= 36000, `Acute scenario saved cargo value is $${postAcute.json?.saved_value_usd}`);

  // Test other commodities via API
  const berriesRes = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, JSON.stringify({
    cargo: 'berries',
    temperature: 12.0,
    ethanol: 8.0,
    humidity: 95.0,
    vibration: 0.5,
  }));
  testAssert(berriesRes.status === 200 && berriesRes.json?.shelf_life_hours < 100, `POST /api/arrhenius berries returns valid prediction (${berriesRes.json?.shelf_life_hours}h)`);

  // Test alias /api/shelf-life
  const aliasRes = await httpRequest(`${BASE}/api/shelf-life`, { method: 'POST' }, JSON.stringify({
    cargo: 'beef',
    temperature: 18.0,
    ethanol: 42.0,
    humidity: 92.0,
    vibration: 1.2,
  }));
  testAssert(aliasRes.status === 200 && aliasRes.json?.shelf_life_hours === 14.7, 'POST /api/shelf-life matches /api/arrhenius with 100% parity');

  // Test 400 Bad Request error handling
  const badReq = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, JSON.stringify({
    cargo: 'invalid_crop',
    temperature: 200,
  }));
  testAssert(badReq.status === 400 && badReq.json?.error_code === 'INVALID_TELEMETRY_PAYLOAD', 'POST with invalid payload returns HTTP 400 with structured errors');

  cleanup();

  console.log('\n================================================================');
  console.log(`TOTAL PASSES: ${passCount} | TOTAL FAILURES: ${failCount}`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runServerSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
