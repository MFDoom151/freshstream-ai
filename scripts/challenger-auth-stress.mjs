// Adversarial Auth, Middleware, and Route Tampering Stress Test Suite
const BASE_URL = 'http://localhost:3000';

let passCount = 0;
let failCount = 0;
const results = [];

function recordResult(testName, passed, details) {
  if (passed) {
    passCount++;
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       ↳ ${details}`);
    results.push({ testName, passed: true, details });
  } else {
    failCount++;
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       ↳ ${details}`);
    results.push({ testName, passed: false, details });
  }
}

function extractCookie(res, cookieName) {
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie') || ''];
  for (const cookieStr of setCookies) {
    if (cookieStr.includes(cookieName)) {
      const match = cookieStr.match(new RegExp(`${cookieName}=([^;]+)`));
      if (match) return match[1];
    }
  }
  return null;
}

async function getCsrfTokenAndCookie() {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  const data = await res.json();
  const csrfCookie = extractCookie(res, 'next-auth.csrf-token');
  return {
    csrfToken: data.csrfToken,
    csrfCookie,
  };
}

async function attemptLogin(email, password, csrfInfo, extraParams = {}) {
  const params = new URLSearchParams({
    csrfToken: csrfInfo.csrfToken,
    json: 'true',
    ...extraParams,
  });
  if (email !== undefined) params.append('email', email);
  if (password !== undefined) params.append('password', password);

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (csrfInfo.csrfCookie) {
    headers['Cookie'] = `next-auth.csrf-token=${csrfInfo.csrfCookie}`;
  }

  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers,
    body: params.toString(),
    redirect: 'manual',
  });

  const sessionToken = extractCookie(res, 'next-auth.session-token');
  let data = null;
  try {
    data = await res.json();
  } catch {
    // not JSON
  }

  return {
    status: res.status,
    sessionToken,
    data,
    location: res.headers.get('location'),
  };
}

async function runAuthStressTests() {
  console.log('===================================================================');
  console.log('>>> RUNNING CHALLENGER AUTH & MIDDLEWARE ADVERSARIAL TEST SUITE <<<');
  console.log('===================================================================\n');

  // --- 1. Unauthenticated Route Protection ---
  console.log('--- 1. Testing Unauthenticated Route Protection ---');
  
  // 1a: Unauthenticated /dashboard
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    const loc = res.headers.get('location');
    const isRedirect = res.status === 307 || res.status === 302;
    const hasCallback = loc && loc.includes('/login') && loc.includes('callbackUrl=%2Fdashboard');
    recordResult(
      'Unauthenticated GET /dashboard redirect',
      isRedirect && hasCallback,
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Unauthenticated GET /dashboard redirect', false, err.message);
  }

  // 1b: Unauthenticated /dashboard/shipment/FS-8821
  try {
    const res = await fetch(`${BASE_URL}/dashboard/shipment/FS-8821`, { redirect: 'manual' });
    const loc = res.headers.get('location');
    const isRedirect = res.status === 307 || res.status === 302;
    const hasCallback = loc && loc.includes('callbackUrl=%2Fdashboard%2Fshipment%2FFS-8821');
    recordResult(
      'Unauthenticated GET /dashboard/shipment/FS-8821 redirect with deep callbackUrl',
      isRedirect && hasCallback,
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Unauthenticated GET /dashboard/shipment/FS-8821 redirect with deep callbackUrl', false, err.message);
  }

  // 1c: Unauthenticated /dashboard/analytics
  try {
    const res = await fetch(`${BASE_URL}/dashboard/analytics`, { redirect: 'manual' });
    const loc = res.headers.get('location');
    const isRedirect = res.status === 307 || res.status === 302;
    recordResult(
      'Unauthenticated GET /dashboard/analytics redirect',
      isRedirect && loc?.includes('/login'),
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Unauthenticated GET /dashboard/analytics redirect', false, err.message);
  }

  // 1d: Unauthenticated /dashboard/support
  try {
    const res = await fetch(`${BASE_URL}/dashboard/support`, { redirect: 'manual' });
    const loc = res.headers.get('location');
    const isRedirect = res.status === 307 || res.status === 302;
    recordResult(
      'Unauthenticated GET /dashboard/support redirect',
      isRedirect && loc?.includes('/login'),
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Unauthenticated GET /dashboard/support redirect', false, err.message);
  }

  // 1e: Public routes accessible without redirection
  try {
    const resHome = await fetch(`${BASE_URL}/`);
    const resLogin = await fetch(`${BASE_URL}/login`);
    const resPredict = await fetch(`${BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature: 5, humidity: 80, gas: 10 }),
    });
    const passed = resHome.status === 200 && resLogin.status === 200 && resPredict.status === 200;
    recordResult(
      'Public routes (/ , /login, /api/predict) accessible without authentication',
      passed,
      `Home: ${resHome.status}, Login: ${resLogin.status}, Predict: ${resPredict.status}`
    );
  } catch (err) {
    recordResult('Public routes accessible without authentication', false, err.message);
  }

  // --- 2. Middleware Tampering & Forged JWT Sessions ---
  console.log('\n--- 2. Testing Middleware Tampering & Forged Session Cookies ---');

  // 2a: Random garbage token
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: 'next-auth.session-token=malicious-attacker-arbitrary-token-xyz' },
      redirect: 'manual',
    });
    const loc = res.headers.get('location');
    recordResult(
      'Forged session cookie (random string) rejected by middleware',
      (res.status === 307 || res.status === 302) && loc?.includes('/login'),
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Forged session cookie (random string) rejected by middleware', false, err.message);
  }

  // 2b: Malformed base64 JWT header only
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: 'next-auth.session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' },
      redirect: 'manual',
    });
    const loc = res.headers.get('location');
    recordResult(
      'Malformed JWT token (truncated header) rejected by middleware',
      (res.status === 307 || res.status === 302) && loc?.includes('/login'),
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Malformed JWT token (truncated header) rejected by middleware', false, err.message);
  }

  // 2c: Alg "none" forged token
  try {
    const algNoneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTYiLCJlbWFpbCI6ImFkbWluQGZha2UuY29tIiwicm9sZSI6IkFETUlOIn0.';
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: `next-auth.session-token=${algNoneToken}` },
      redirect: 'manual',
    });
    const loc = res.headers.get('location');
    recordResult(
      'Unsigned alg:none JWT token rejected by middleware',
      (res.status === 307 || res.status === 302) && loc?.includes('/login'),
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Unsigned alg:none JWT token rejected by middleware', false, err.message);
  }

  // 2d: Forged token signed with wrong secret
  try {
    // A standard HS256 token signed with "attacker-secret-key"
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZSI6IkhhY2tlciIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTYwMDAwMDAwMH0.1D-wD2h82f_mQ1iQ2-Y6-fake-signature';
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Cookie: `next-auth.session-token=${forgedToken}` },
      redirect: 'manual',
    });
    const loc = res.headers.get('location');
    recordResult(
      'Forged JWT signed with invalid secret rejected by middleware',
      (res.status === 307 || res.status === 302) && loc?.includes('/login'),
      `Status: ${res.status}, Location: ${loc}`
    );
  } catch (err) {
    recordResult('Forged JWT signed with invalid secret rejected by middleware', false, err.message);
  }

  // --- 3. Credentials Provider Adversarial Testing ---
  console.log('\n--- 3. Testing NextAuth Credentials Provider Adversarial Cases ---');
  const csrfInfo = await getCsrfTokenAndCookie();

  // 3a: Incorrect password
  try {
    const res = await attemptLogin('operator@freshstream.ai', 'WrongPassword999!', csrfInfo);
    const noCookie = !res.sessionToken;
    const isError =
      res.status === 401 ||
      res.data?.url?.includes('error=CredentialsSignin') ||
      res.data?.error === 'CredentialsSignin' ||
      res.location?.includes('error=CredentialsSignin');
    recordResult(
      'Incorrect password rejected (status 401, no session cookie, error=CredentialsSignin)',
      noCookie && isError,
      `Status: ${res.status}, Session cookie: ${res.sessionToken || 'NONE (correct)'}, Error URL: ${res.data?.url || res.location}`
    );
  } catch (err) {
    recordResult('Incorrect password rejected', false, err.message);
  }

  // 3b: Empty password string
  try {
    const res = await attemptLogin('operator@freshstream.ai', '', csrfInfo);
    const noCookie = !res.sessionToken;
    recordResult(
      'Empty password rejected (no session cookie issued)',
      noCookie,
      `Session cookie: ${res.sessionToken || 'NONE (correct)'}`
    );
  } catch (err) {
    recordResult('Empty password rejected', false, err.message);
  }

  // 3c: Missing password parameter entirely
  try {
    const res = await attemptLogin('operator@freshstream.ai', undefined, csrfInfo);
    const noCookie = !res.sessionToken;
    recordResult(
      'Omitted password parameter rejected',
      noCookie,
      `Session cookie: ${res.sessionToken || 'NONE (correct)'}`
    );
  } catch (err) {
    recordResult('Omitted password parameter rejected', false, err.message);
  }

  // 3d: Non-existent user
  try {
    const res = await attemptLogin('nonexistent.ghost.user@freshstream.ai', 'Password123!', csrfInfo);
    const noCookie = !res.sessionToken;
    recordResult(
      'Non-existent user rejected (no session cookie issued)',
      noCookie,
      `Session cookie: ${res.sessionToken || 'NONE (correct)'}`
    );
  } catch (err) {
    recordResult('Non-existent user rejected', false, err.message);
  }

  // 3e: SQL Injection string in email
  try {
    const res = await attemptLogin("admin@freshstream.ai' OR '1'='1", 'Password123!', csrfInfo);
    const noCookie = !res.sessionToken;
    recordResult(
      'SQL injection string in email rejected safely',
      noCookie,
      `Session cookie: ${res.sessionToken || 'NONE (correct)'}`
    );
  } catch (err) {
    recordResult('SQL injection string in email rejected safely', false, err.message);
  }

  // 3f: SQL Injection string in password
  try {
    const res = await attemptLogin('admin@freshstream.ai', "' OR '1'='1' --", csrfInfo);
    const noCookie = !res.sessionToken;
    recordResult(
      'SQL injection string in password rejected safely',
      noCookie,
      `Session cookie: ${res.sessionToken || 'NONE (correct)'}`
    );
  } catch (err) {
    recordResult('SQL injection string in password rejected safely', false, err.message);
  }

  // 3g: Case-insensitivity & leading/trailing whitespace normalization
  try {
    const res = await attemptLogin('   OPERATOR@FreshStream.AI   ', 'Password123!', csrfInfo);
    const hasCookie = !!res.sessionToken;
    recordResult(
      'Case-insensitivity & whitespace trimming in email succeeds',
      hasCookie,
      `Session cookie issued: ${hasCookie}`
    );
  } catch (err) {
    recordResult('Case-insensitivity & whitespace trimming in email succeeds', false, err.message);
  }

  // 3h: Valid Operator Authentication
  let validOperatorSessionCookie = null;
  try {
    const res = await attemptLogin('operator@freshstream.ai', 'Password123!', csrfInfo);
    validOperatorSessionCookie = res.sessionToken;
    recordResult(
      'Valid Operator login succeeds with session cookie',
      !!validOperatorSessionCookie,
      `Session token length: ${validOperatorSessionCookie?.length || 0} chars`
    );
  } catch (err) {
    recordResult('Valid Operator login succeeds with session cookie', false, err.message);
  }

  // 3i: Valid Admin Authentication
  let validAdminSessionCookie = null;
  try {
    const res = await attemptLogin('admin@freshstream.ai', 'Password123!', csrfInfo);
    validAdminSessionCookie = res.sessionToken;
    recordResult(
      'Valid Admin login succeeds with session cookie',
      !!validAdminSessionCookie,
      `Session token length: ${validAdminSessionCookie?.length || 0} chars`
    );
  } catch (err) {
    recordResult('Valid Admin login succeeds with session cookie', false, err.message);
  }

  // --- 4. Authenticated Session Access & RBAC verification ---
  console.log('\n--- 4. Testing Authenticated Session Access & Role Population ---');

  if (validOperatorSessionCookie) {
    // 4a: Access /dashboard with valid cookie
    try {
      const res = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: `next-auth.session-token=${validOperatorSessionCookie}` },
        redirect: 'manual',
      });
      recordResult(
        'Authenticated GET /dashboard returns HTTP 200 OK (no redirect)',
        res.status === 200,
        `Status: ${res.status}`
      );
    } catch (err) {
      recordResult('Authenticated GET /dashboard returns HTTP 200 OK', false, err.message);
    }

    // 4b: Access /dashboard/shipment/FS-8821 with valid cookie
    try {
      const res = await fetch(`${BASE_URL}/dashboard/shipment/FS-8821`, {
        headers: { Cookie: `next-auth.session-token=${validOperatorSessionCookie}` },
        redirect: 'manual',
      });
      recordResult(
        'Authenticated GET /dashboard/shipment/FS-8821 returns HTTP 200 OK (no redirect)',
        res.status === 200,
        `Status: ${res.status}`
      );
    } catch (err) {
      recordResult('Authenticated GET /dashboard/shipment/FS-8821 returns HTTP 200 OK', false, err.message);
    }

    // 4c: Check /api/auth/session payload for operator
    try {
      const res = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: { Cookie: `next-auth.session-token=${validOperatorSessionCookie}` },
      });
      const session = await res.json();
      const isValid =
        session?.user?.email === 'operator@freshstream.ai' &&
        session?.user?.role === 'OPERATOR' &&
        !!session?.user?.id &&
        !!session?.user?.companyId;
      recordResult(
        'Session endpoint returns enriched user payload (id, email, role=OPERATOR, companyId)',
        isValid,
        JSON.stringify(session?.user)
      );
    } catch (err) {
      recordResult('Session endpoint returns enriched user payload', false, err.message);
    }
  }

  if (validAdminSessionCookie) {
    // 4d: Check /api/auth/session payload for admin
    try {
      const res = await fetch(`${BASE_URL}/api/auth/session`, {
        headers: { Cookie: `next-auth.session-token=${validAdminSessionCookie}` },
      });
      const session = await res.json();
      const isValid =
        session?.user?.email === 'admin@freshstream.ai' &&
        session?.user?.role === 'ADMIN' &&
        !!session?.user?.id;
      recordResult(
        'Admin session returns role=ADMIN correctly',
        isValid,
        JSON.stringify(session?.user)
      );
    } catch (err) {
      recordResult('Admin session returns role=ADMIN correctly', false, err.message);
    }
  }

  // --- 5. Shipments API Edge Cases ---
  console.log('\n--- 5. Testing Shipments API Edge Cases ---');

  // 5a: Standard list
  try {
    const res = await fetch(`${BASE_URL}/api/shipments`);
    const data = await res.json();
    const passed = res.status === 200 && data.success === true && data.count === 6 && data.source === 'database';
    recordResult(
      'GET /api/shipments returns 6 database shipments',
      passed,
      `Count: ${data.count}, Source: ${data.source}`
    );
  } catch (err) {
    recordResult('GET /api/shipments returns 6 database shipments', false, err.message);
  }

  // 5b: Lowercase ID normalization in single shipment route
  try {
    const res = await fetch(`${BASE_URL}/api/shipments/fs-8821`); // lowercase
    const data = await res.json();
    const passed = res.status === 200 && data.shipment?.id === 'FS-8821' && data.source === 'database';
    recordResult(
      'GET /api/shipments/fs-8821 handles case-insensitivity (converts to uppercase)',
      passed,
      `ID: ${data.shipment?.id}, Cargo: ${data.shipment?.cargoNameEn}`
    );
  } catch (err) {
    recordResult('GET /api/shipments/fs-8821 handles case-insensitivity', false, err.message);
  }

  // 5c: Non-existent shipment returns 404
  try {
    const res = await fetch(`${BASE_URL}/api/shipments/FS-NONEXISTENT-9999`);
    const data = await res.json();
    const passed = res.status === 404 && data.success === false && data.error?.includes('not found');
    recordResult(
      'GET /api/shipments/FS-NONEXISTENT-9999 returns 404 Not Found',
      passed,
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (err) {
    recordResult('GET /api/shipments/FS-NONEXISTENT-9999 returns 404 Not Found', false, err.message);
  }

  // 5d: XSS probe in shipment URL
  try {
    const res = await fetch(`${BASE_URL}/api/shipments/%3Cscript%3Ealert(1)%3C%2Fscript%3E`);
    const passed = res.status === 404;
    recordResult(
      'XSS probe in shipment ID URL properly rejected with 404 (no injection)',
      passed,
      `Status: ${res.status}`
    );
  } catch (err) {
    recordResult('XSS probe in shipment ID URL properly rejected', false, err.message);
  }

  console.log('\n===================================================================');
  console.log(`AUTH & MIDDLEWARE STRESS TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('===================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAuthStressTests().catch((e) => {
  console.error('Fatal auth stress test failure:', e);
  process.exit(1);
});
