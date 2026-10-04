import http from 'http';

const routes = [
  '/',
  '/dashboard',
  '/dashboard/shipment/FS-8821',
  '/dashboard/support',
  '/dashboard/analytics',
  '/api/arrhenius',
  '/api/shelf-life',
];

async function checkRoute(port, route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:${port}${route}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ route, statusCode: res.statusCode, dataLength: data.length });
      });
    }).on('error', (err) => {
      resolve({ route, error: err.message });
    });
  });
}

async function testApiPost(port) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      cargo: 'beef',
      temperature: 14.0,
      ethanol: 42.0,
      humidity: 82.0,
      vibration: 1.2,
      cargo_value_usd: 68000
    });

    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/api/arrhenius',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', err => resolve({ error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  const port = 3009;
  console.log(`Verifying routes on port ${port}...`);

  for (const r of routes) {
    const res = await checkRoute(port, r);
    console.log(`Route ${res.route}: status ${res.statusCode} (${res.dataLength} bytes)`);
    if (res.statusCode !== 200) {
      console.error(`Route ${r} returned non-200 code:`, res);
      process.exit(1);
    }
  }

  console.log('\nTesting POST /api/arrhenius with acute reefer failure telemetry...');
  const apiRes = await testApiPost(port);
  console.log('POST status:', apiRes.status);
  console.log('Shelf-Life (Hours):', apiRes.json?.shelf_life_hours);
  console.log('Health Index:', apiRes.json?.health_index);
  console.log('Alert Severity:', apiRes.json?.alert_severity);
  console.log('Is Ethanol Critical:', apiRes.json?.is_ethanol_critical);
  console.log('Recommended Actions:', apiRes.json?.recommended_actions);

  if (apiRes.status === 200 && apiRes.json?.shelf_life_hours && apiRes.json?.is_ethanol_critical) {
    console.log('\nALL 7 ROUTES & REST API VERIFIED 100% OPERATIONAL!');
    process.exit(0);
  } else {
    console.error('API validation failed:', apiRes);
    process.exit(1);
  }
}

run();
