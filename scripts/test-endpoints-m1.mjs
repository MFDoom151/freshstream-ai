async function testEndpoints() {
  console.log('Testing HTTP Endpoints on http://localhost:3000...\n');

  // Wait a moment for server to be fully ready
  await new Promise(r => setTimeout(r, 2000));

  let allPassed = true;

  // 1. Test /dashboard redirect to /login
  try {
    const res = await fetch('http://localhost:3000/dashboard', {
      redirect: 'manual'
    });
    console.log(`[TEST 1] GET /dashboard status: ${res.status}`);
    const location = res.headers.get('location');
    console.log(`         Redirect location: ${location}`);
    if ((res.status === 307 || res.status === 302) && location && location.includes('/login')) {
      console.log('         ✓ PASS: Unauthenticated access to /dashboard properly redirected to /login');
    } else {
      console.error('         ✗ FAIL: Expected redirect to /login');
      allPassed = false;
    }
  } catch (err) {
    console.error('         ✗ FAIL to connect:', err.message);
    allPassed = false;
  }

  // 2. Test /login returns 200
  try {
    const res = await fetch('http://localhost:3000/login');
    console.log(`\n[TEST 2] GET /login status: ${res.status}`);
    if (res.status === 200) {
      console.log('         ✓ PASS: /login page rendered 200 OK');
    } else {
      console.error(`         ✗ FAIL: Expected 200 OK, got ${res.status}`);
      allPassed = false;
    }
  } catch (err) {
    console.error('         ✗ FAIL to connect:', err.message);
    allPassed = false;
  }

  // 3. Test /api/shipments
  try {
    const res = await fetch('http://localhost:3000/api/shipments');
    const data = await res.json();
    console.log(`\n[TEST 3] GET /api/shipments status: ${res.status}`);
    console.log(`         Shipments count: ${data.count}, Source: ${data.source}`);
    if (res.status === 200 && data.count === 6 && data.source === 'database') {
      console.log('         ✓ PASS: /api/shipments returned 6 shipments from database');
    } else {
      console.error('         ✗ FAIL:', data);
      allPassed = false;
    }
  } catch (err) {
    console.error('         ✗ FAIL to connect:', err.message);
    allPassed = false;
  }

  // 4. Test /api/shipments/FS-8821
  try {
    const res = await fetch('http://localhost:3000/api/shipments/FS-8821');
    const data = await res.json();
    console.log(`\n[TEST 4] GET /api/shipments/FS-8821 status: ${res.status}`);
    console.log(`         Shipment: ${data.shipment?.cargoNameEn}, Telemetry logs count: ${data.telemetryLogs?.length}`);
    if (res.status === 200 && data.shipment?.id === 'FS-8821' && data.telemetryLogs?.length >= 3) {
      console.log('         ✓ PASS: /api/shipments/FS-8821 returned shipment with telemetry logs');
    } else {
      console.error('         ✗ FAIL:', data);
      allPassed = false;
    }
  } catch (err) {
    console.error('         ✗ FAIL to connect:', err.message);
    allPassed = false;
  }

  // 5. Test /api/predict (ONNX inference preservation)
  try {
    const res = await fetch('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature: 8, humidity: 75, gas: 12 }),
    });
    const data = await res.json();
    console.log(`\n[TEST 5] POST /api/predict status: ${res.status}`);
    console.log(`         Prediction: RUL = ${data.rul_hours ?? data.predicted_rul_hours}, Health = ${data.health_index ?? data.bhi}`);
    if (res.status === 200 && (data.rul_hours !== undefined || data.predicted_rul_hours !== undefined)) {
      console.log('         ✓ PASS: ONNX ML model inference succeeded');
    } else {
      console.error('         ✗ FAIL:', data);
      allPassed = false;
    }
  } catch (err) {
    console.error('         ✗ FAIL to connect:', err.message);
    allPassed = false;
  }

  // 6. Test NextAuth CSRF and Credentials sign in
  try {
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    console.log(`\n[TEST 6] GET /api/auth/csrf token: ${csrfData.csrfToken ? '✓ Generated' : '✗ Missing'}`);
    
    // Attempt credentials callback
    const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken: csrfData.csrfToken,
        email: 'operator@freshstream.ai',
        password: 'Password123!',
        json: 'true',
      }).toString(),
      redirect: 'manual',
    });
    console.log(`         Credentials Auth Callback status: ${loginRes.status}`);
    const setCookie = loginRes.headers.get('set-cookie');
    console.log(`         Session cookie issued: ${setCookie && setCookie.includes('next-auth') ? '✓ YES' : '✗ NO'}`);
    if (setCookie && setCookie.includes('next-auth')) {
      console.log('         ✓ PASS: NextAuth credentials authenticated and issued session cookie');
    } else {
      console.error('         ✗ FAIL: Cookie not issued:', setCookie);
      allPassed = false;
    }
  } catch (err) {
    console.error('         ✗ FAIL auth test:', err.message);
    allPassed = false;
  }

  if (allPassed) {
    console.log('\n========================================');
    console.log('>>> ALL ENDPOINT TESTS PASSED (6/6) <<<');
    console.log('========================================\n');
  } else {
    console.error('\n>>> SOME ENDPOINT TESTS FAILED <<<\n');
    process.exit(1);
  }
}

testEndpoints();
