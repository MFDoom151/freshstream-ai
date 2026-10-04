import http from 'http';
import { spawn } from 'child_process';

const PORT = 3021;
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

    if (bodyData !== null) {
      if (!reqOptions.headers['Content-Type']) {
        reqOptions.headers['Content-Type'] = 'application/json';
      }
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

    if (bodyData !== null) {
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

const findings = [];
function record(category, testName, passed, details) {
  findings.push({ category, testName, passed, details });
  const mark = passed ? 'PASS [✓]' : 'WARN/FAIL [✗]';
  console.log(`${mark} [${category}] ${testName}: ${details}`);
}

async function run() {
  console.log('================================================================');
  console.log('   FRESHSTREAM AI — REST API FUZZING & ERROR HANDLING SUITE     ');
  console.log('================================================================\n');

  console.log(`Starting Next.js production server on port ${PORT}...`);
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
    console.error('ERROR: Server failed to start on port', PORT);
    cleanup();
    process.exit(1);
  }
  console.log('Server is ready. Commencing fuzzing barrage...\n');

  const validPayload = {
    cargo: 'beef',
    temperature: 18.0,
    ethanol: 42.0,
    humidity: 92.0,
    vibration: 1.2,
    location: 'Port Kuryk',
  };

  // Test cases: [name, endpoint, rawBody, expectedStatus, expectedErrorCode, validator]
  const fuzzTests = [
    // 1. Malformed JSON
    {
      name: 'Malformed JSON (unclosed brace)',
      body: '{"cargo": "beef", "temperature":',
      expectedStatus: 400,
      expectedErrorCode: 'INVALID_JSON_BODY',
    },
    {
      name: 'Malformed JSON (trailing comma in strict JSON)',
      body: '{"cargo": "beef", "temperature": 18,}',
      expectedStatus: 400,
      expectedErrorCode: 'INVALID_JSON_BODY',
    },
    {
      name: 'Non-object JSON: array',
      body: JSON.stringify([1, 2, 3]),
      expectedStatus: 400,
      // Array is typeof object, but let's check handling
    },
    {
      name: 'Non-object JSON: string literal',
      body: JSON.stringify("not an object"),
      expectedStatus: 400,
      expectedErrorCode: 'INVALID_PAYLOAD',
    },
    {
      name: 'Non-object JSON: number literal',
      body: JSON.stringify(12345),
      expectedStatus: 400,
      expectedErrorCode: 'INVALID_PAYLOAD',
    },

    // 2. Missing Required Fields
    {
      name: 'Missing temperature',
      body: JSON.stringify({ cargo: 'beef', ethanol: 10, humidity: 80, vibration: 0.5 }),
      expectedStatus: 400,
      fieldCheck: 'temperature',
    },
    {
      name: 'Missing ethanol',
      body: JSON.stringify({ cargo: 'beef', temperature: 1.0, humidity: 80, vibration: 0.5 }),
      expectedStatus: 400,
      fieldCheck: 'ethanol',
    },
    {
      name: 'Missing humidity',
      body: JSON.stringify({ cargo: 'beef', temperature: 1.0, ethanol: 10, vibration: 0.5 }),
      expectedStatus: 400,
      fieldCheck: 'humidity',
    },
    {
      name: 'Missing vibration',
      body: JSON.stringify({ cargo: 'beef', temperature: 1.0, ethanol: 10, humidity: 80 }),
      expectedStatus: 400,
      fieldCheck: 'vibration',
    },
    {
      name: 'Completely empty object {}',
      body: JSON.stringify({}),
      expectedStatus: 400,
      expectedErrorCode: 'INVALID_TELEMETRY_PAYLOAD',
    },

    // 3. Out of Range Values
    {
      name: 'Temperature sub-range (< -15°C): -20°C',
      body: JSON.stringify({ ...validPayload, temperature: -20.0 }),
      expectedStatus: 400,
      fieldCheck: 'temperature',
    },
    {
      name: 'Temperature above-range (> 50°C): 55°C',
      body: JSON.stringify({ ...validPayload, temperature: 55.0 }),
      expectedStatus: 400,
      fieldCheck: 'temperature',
    },
    {
      name: 'Ethanol negative (< 0 ppm): -5 ppm',
      body: JSON.stringify({ ...validPayload, ethanol: -5.0 }),
      expectedStatus: 400,
      fieldCheck: 'ethanol',
    },
    {
      name: 'Ethanol above-range (> 200 ppm): 250 ppm',
      body: JSON.stringify({ ...validPayload, ethanol: 250.0 }),
      expectedStatus: 400,
      fieldCheck: 'ethanol',
    },
    {
      name: 'Humidity sub-range (< 10%): 5%',
      body: JSON.stringify({ ...validPayload, humidity: 5.0 }),
      expectedStatus: 400,
      fieldCheck: 'humidity',
    },
    {
      name: 'Humidity above-range (> 100%): 105%',
      body: JSON.stringify({ ...validPayload, humidity: 105.0 }),
      expectedStatus: 400,
      fieldCheck: 'humidity',
    },
    {
      name: 'Vibration negative (< 0 G): -0.5 G',
      body: JSON.stringify({ ...validPayload, vibration: -0.5 }),
      expectedStatus: 400,
      fieldCheck: 'vibration',
    },
    {
      name: 'Vibration above-range (> 10 G): 12 G',
      body: JSON.stringify({ ...validPayload, vibration: 12.0 }),
      expectedStatus: 400,
      fieldCheck: 'vibration',
    },

    // 4. Invalid Types
    {
      name: 'Invalid cargo type: "grain"',
      body: JSON.stringify({ ...validPayload, cargo: 'grain' }),
      expectedStatus: 400,
      fieldCheck: 'cargo',
    },
    {
      name: 'Invalid cargo type: numeric 123',
      body: JSON.stringify({ ...validPayload, cargo: 123 }),
      expectedStatus: 400,
      fieldCheck: 'cargo',
    },
    {
      name: 'Type mismatch: temperature as string "hot"',
      body: JSON.stringify({ ...validPayload, temperature: 'hot' }),
      expectedStatus: 400,
      fieldCheck: 'temperature',
    },
    {
      name: 'Type mismatch: ethanol as null',
      body: JSON.stringify({ ...validPayload, ethanol: null }),
      expectedStatus: 400,
      fieldCheck: 'ethanol',
    },
    {
      name: 'Type mismatch: humidity as boolean true',
      body: JSON.stringify({ ...validPayload, humidity: true }),
      expectedStatus: 400,
      fieldCheck: 'humidity',
    },
    {
      name: 'Type mismatch: vibration as array [1.2]',
      body: JSON.stringify({ ...validPayload, vibration: [1.2] }),
      expectedStatus: 400,
      fieldCheck: 'vibration',
    },
  ];

  console.log('--- Phase 1: Fuzzing Primary Endpoint /api/arrhenius ---');
  let arrheniusPassed = 0;
  for (const tc of fuzzTests) {
    const res = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, tc.body);
    const statusMatch = res.status === tc.expectedStatus;
    let detail = `Status ${res.status} (expected ${tc.expectedStatus})`;
    if (res.json?.error_code) detail += `, error_code: ${res.json.error_code}`;
    if (tc.fieldCheck && res.json?.errors) {
      const fieldFound = res.json.errors.some((e) => e.field === tc.fieldCheck);
      detail += `, field '${tc.fieldCheck}' reported: ${fieldFound}`;
    }

    // Check for 500 crash
    if (res.status === 500) {
      record('/api/arrhenius', tc.name, false, `CRASH 500! Body: ${res.data}`);
    } else if (statusMatch) {
      arrheniusPassed++;
      record('/api/arrhenius', tc.name, true, detail);
    } else {
      record('/api/arrhenius', tc.name, false, detail);
    }
  }

  console.log('\n--- Phase 2: Fuzzing Alias Endpoint /api/shelf-life & Parity Comparison ---');
  let shelfLifeParityFails = 0;
  for (const tc of fuzzTests) {
    const res = await httpRequest(`${BASE}/api/shelf-life`, { method: 'POST' }, tc.body);
    const statusMatch = res.status === tc.expectedStatus;
    let detail = `Status ${res.status} (expected ${tc.expectedStatus})`;
    if (res.json?.error_code) detail += `, error_code: ${res.json.error_code}`;
    
    if (res.status === 500) {
      shelfLifeParityFails++;
      record('/api/shelf-life', tc.name, false, `CRASH 500! Body: ${res.data}`);
    } else if (statusMatch) {
      record('/api/shelf-life', tc.name, true, detail);
    } else {
      shelfLifeParityFails++;
      record('/api/shelf-life', tc.name, false, `PARITY MISMATCH: ${detail}`);
    }
  }

  console.log('\n--- Phase 3: Valid Payload Parity Check ---');
  const validBody = JSON.stringify(validPayload);
  const arrhValid = await httpRequest(`${BASE}/api/arrhenius`, { method: 'POST' }, validBody);
  const shelfValid = await httpRequest(`${BASE}/api/shelf-life`, { method: 'POST' }, validBody);

  const validStatusMatch = arrhValid.status === 200 && shelfValid.status === 200;
  const slMatch = arrhValid.json?.shelf_life_hours === shelfValid.json?.shelf_life_hours;
  const bhiMatch = arrhValid.json?.health_index === shelfValid.json?.health_index;
  const ethCritMatch = arrhValid.json?.is_ethanol_critical === shelfValid.json?.is_ethanol_critical;
  const savedValMatch = arrhValid.json?.saved_value_usd === shelfValid.json?.saved_value_usd;

  // Schema completeness check
  const arrhHasCargo = Boolean(arrhValid.json?.cargo);
  const shelfHasCargo = Boolean(shelfValid.json?.cargo);
  const arrhHasTelemetry = Boolean(arrhValid.json?.telemetry);
  const shelfHasTelemetry = Boolean(shelfValid.json?.telemetry);

  record(
    'Valid Payload Parity',
    'Core Numerical Parity',
    validStatusMatch && slMatch && bhiMatch && ethCritMatch && savedValMatch,
    `arrhenius SL=${arrhValid.json?.shelf_life_hours}h vs shelf-life SL=${shelfValid.json?.shelf_life_hours}h, BHI: ${arrhValid.json?.health_index}% vs ${shelfValid.json?.health_index}%`
  );

  record(
    'Valid Payload Parity',
    'Schema Parity (cargo & telemetry nested objects)',
    arrhHasCargo === shelfHasCargo && arrhHasTelemetry === shelfHasTelemetry,
    `/api/arrhenius has cargo:${arrhHasCargo} telemetry:${arrhHasTelemetry} | /api/shelf-life has cargo:${shelfHasCargo} telemetry:${shelfHasTelemetry}`
  );

  console.log('\n================================================================');
  console.log(`FUZZING SUMMARY:`);
  console.log(`- /api/arrhenius tests passed: ${arrheniusPassed}/${fuzzTests.length}`);
  console.log(`- /api/shelf-life parity fails: ${shelfLifeParityFails}/${fuzzTests.length}`);
  console.log('================================================================\n');

  cleanup();
  
  // Output structured findings for Challenger report
  if (shelfLifeParityFails > 0 || !shelfHasCargo) {
    console.log('CHALLENGER OBSERVATION: /api/shelf-life exhibits divergence from /api/arrhenius in input validation and response schema.');
  }
}

run().catch((e) => {
  console.error('Fatal error during fuzzing:', e);
  process.exit(1);
});
