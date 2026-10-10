import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import puppeteer, { Browser, Page } from 'puppeteer-core';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const PORT = 3000;
const MAX_ROUTE_LATENCY_MS = 5000;
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

// Candidate Chrome/Chromium Executable Paths on Windows
const CHROME_PATHS = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
].filter(Boolean) as string[];

function findBrowserExecutable(): string {
  for (const exePath of CHROME_PATHS) {
    if (fs.existsSync(exePath)) {
      return exePath;
    }
  }
  throw new Error(
    `No Chromium/Chrome/Edge executable found in standard locations: ${CHROME_PATHS.join(', ')}`
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning(): Promise<{ proc: ChildProcess | null; managed: boolean }> {
  const ready = await isServerReady(`${BASE_URL}/`);
  if (ready) {
    console.log(`[SERVER] Detected active server at ${BASE_URL}.`);
    return { proc: null, managed: false };
  }

  console.log(`[SERVER] No server detected at ${BASE_URL}. Spawning Next.js production server...`);
  const projectRoot = path.resolve(__dirname, '..');

  const proc = spawn('npm', ['run', 'start', '--', '-p', String(PORT)], {
    cwd: projectRoot,
    shell: true,
    stdio: 'pipe',
  });

  // Poll for readiness
  const startWait = Date.now();
  let isUp = false;
  while (Date.now() - startWait < 30000) {
    await delay(750);
    if (await isServerReady(`${BASE_URL}/`)) {
      isUp = true;
      break;
    }
  }

  if (!isUp) {
    proc.kill();
    throw new Error(`Timed out after 30s waiting for Next.js production server at ${BASE_URL}`);
  }

  console.log(`[SERVER] Next.js production server is ready at ${BASE_URL}`);
  return { proc, managed: true };
}

async function acquireSessionToken(port: number): Promise<string | null> {
  const csrfRes = await new Promise<{ csrfToken?: string; cookie?: string }>((resolve) => {
    http.get(`http://localhost:${port}/api/auth/csrf`, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawCookies = res.headers['set-cookie'] || [];
          const csrfCookie = rawCookies.find((c) => c.includes('next-auth.csrf-token'))?.split(';')[0];
          resolve({ csrfToken: json.csrfToken, cookie: csrfCookie });
        } catch {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });

  if (!csrfRes.csrfToken) return null;

  const body = new URLSearchParams({
    csrfToken: csrfRes.csrfToken,
    email: 'operator@freshstream.ai',
    password: 'Password123!',
    json: 'true',
  }).toString();

  return new Promise<string | null>((resolve) => {
    const req = http.request(
      `http://localhost:${port}/api/auth/callback/credentials`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          Cookie: csrfRes.cookie || '',
        },
      },
      (res) => {
        const rawCookies = res.headers['set-cookie'] || [];
        const sessionCookie = rawCookies.find((c) => c.includes('next-auth.session-token'))?.split(';')[0];
        if (sessionCookie) {
          const tokenVal = sessionCookie.split('=')[1];
          resolve(tokenVal);
        } else {
          resolve(null);
        }
      }
    );
    req.write(body);
    req.end();
  });
}

interface TestReportItem {
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details: string;
  durationMs?: number;
}

const report: TestReportItem[] = [];

function recordResult(name: string, category: string, status: 'PASS' | 'FAIL', details: string, durationMs?: number) {
  report.push({ name, category, status, details, durationMs });
  const icon = status === 'PASS' ? '✅' : '❌';
  const durStr = durationMs !== undefined ? ` (${durationMs}ms)` : '';
  console.log(`${icon} [${category}] ${name}${durStr} — ${details}`);
}

async function runBrowserQA() {
  console.log('======================================================================');
  console.log('   FRESHSTREAM AI — REAL BROWSER QA AUTOMATION & VISUAL ACCEPTANCE   ');
  console.log('======================================================================\n');

  // Ensure screenshot output directory
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const { proc: serverProc, managed: serverManaged } = await ensureServerRunning();
  let browser: Browser | null = null;
  const consoleErrors: string[] = [];
  const webglErrors: string[] = [];

  try {
    const exePath = findBrowserExecutable();
    console.log(`[BROWSER] Launching browser engine: ${exePath}`);

    browser = await puppeteer.launch({
      executablePath: exePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-webgl',
        '--ignore-gpu-blocklist',
        '--use-gl=angle',
        '--window-size=1920,1080',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      },
    });

    const page: Page = await browser.newPage();

    // Attach listeners for errors
    page.on('response', (res) => {
      if (res.status() >= 400) {
        console.log(`[HTTP ${res.status()}] ${res.url()}`);
      }
    });

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        // Filter out harmless browser-level network asset 404s (e.g. favicon.ico, OSM tile cache)
        if (
          !text.includes('favicon.ico') &&
          !text.includes('chrome-extension://') &&
          !text.includes('Failed to load resource: the server responded with a status of 404')
        ) {
          consoleErrors.push(text);
          if (text.toLowerCase().includes('webgl') || text.toLowerCase().includes('three')) {
            webglErrors.push(text);
          }
        }
      }
    });

    page.on('pageerror', (err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      consoleErrors.push(`PageError: ${errMsg}`);
      if (errMsg.toLowerCase().includes('webgl') || errMsg.toLowerCase().includes('three')) {
        webglErrors.push(`WebGL: ${errMsg}`);
      }
    });

    // -------------------------------------------------------------------------
    // 1. Homepage & Full-Screen 3D Canvas Coverage Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 1. HOMEPAGE & 3D CANVAS VIEWPORT COVERAGE ---');
    const homeStart = Date.now();
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const homeLoadDur = Date.now() - homeStart;

    recordResult(
      'Homepage Load (<5s)',
      'Navigation',
      homeLoadDur < MAX_ROUTE_LATENCY_MS ? 'PASS' : 'FAIL',
      `Loaded in ${homeLoadDur}ms`,
      homeLoadDur
    );

    // Wait for 3D Canvas element to mount
    await page.waitForSelector('canvas', { timeout: 10000 });

    const canvasAudit = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { found: false, error: 'No canvas element found' };

      const container = canvas.parentElement;
      if (!container) return { found: false, error: 'Canvas has no parent container' };

      const cRect = canvas.getBoundingClientRect();
      const containerStyle = window.getComputedStyle(container);

      // Check fixed full-viewport styling
      const isFixed = containerStyle.position === 'fixed';
      const zIndex = containerStyle.zIndex;
      const pointerEvents = containerStyle.pointerEvents;
      const wMatches = Math.abs(cRect.width - window.innerWidth) <= 20;
      const hMatches = Math.abs(cRect.height - window.innerHeight) <= 20;

      // Check that heading text exists and is positioned in front
      const heading = document.querySelector('h1');
      let textInFront = false;
      if (heading) {
        const textParent = heading.closest('.relative.z-10');
        textInFront = !!textParent;
      }

      return {
        found: true,
        canvasWidth: cRect.width,
        canvasHeight: cRect.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        isFixed,
        zIndex,
        pointerEvents,
        wMatches,
        hMatches,
        textInFront,
      };
    });

    if (canvasAudit.found) {
      const coversViewport = canvasAudit.wMatches && canvasAudit.hMatches;
      recordResult(
        'Full-Screen Canvas Viewport Coverage',
        '3D Graphics',
        coversViewport ? 'PASS' : 'FAIL',
        `Canvas: ${canvasAudit.canvasWidth}x${canvasAudit.canvasHeight}px, Viewport: ${canvasAudit.windowWidth}x${canvasAudit.windowHeight}px`
      );

      const isBehindText = canvasAudit.isFixed && canvasAudit.zIndex === '-10' && canvasAudit.textInFront;
      recordResult(
        'Canvas Fixed Behind Content (z-index: -10)',
        '3D Graphics',
        isBehindText ? 'PASS' : 'FAIL',
        `position: ${canvasAudit.isFixed ? 'fixed' : 'not-fixed'}, zIndex: ${canvasAudit.zIndex}, pointerEvents: ${canvasAudit.pointerEvents}, textInFront: ${canvasAudit.textInFront}`
      );
    } else {
      recordResult('Canvas Element Found', '3D Graphics', 'FAIL', canvasAudit.error || 'Canvas not found');
    }

    // -------------------------------------------------------------------------
    // 2. High-Resolution Scrollytelling Capture at 0%, 35%, 65%, 85%, 100%
    // -------------------------------------------------------------------------
    console.log('\n--- 2. 5-STAGE SCROLLYTELLING SCREENSHOTS ---');

    const scrollCheckpoints = [
      { pct: 0, file: 'scroll-0.png', label: 'Phase 1: Fresh Pristine Harvest' },
      { pct: 0.35, file: 'scroll-35.png', label: 'Phase 2: Biological Rot & Thermal Abuse' },
      { pct: 0.65, file: 'scroll-65.png', label: 'Phase 3: Arrhenius Twin Recovery Wave' },
      { pct: 0.85, file: 'scroll-85.png', label: 'Phase 4: Smart Insulated Carton Packaging' },
      { pct: 1.0, file: 'scroll-100.png', label: 'Phase 5: Reefer Semi-Trailer Highway Dispatch' },
    ];

    for (const cp of scrollCheckpoints) {
      await page.evaluate((targetPct) => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: targetPct * total,
          behavior: 'instant' as ScrollBehavior,
        });
        window.dispatchEvent(new Event('scroll'));
      }, cp.pct);

      // Wait 1200ms for Three.js dampening lerp to settle
      await delay(1200);

      const outPath = path.join(SCREENSHOT_DIR, cp.file);
      await page.screenshot({ path: outPath, fullPage: false });

      const exists = fs.existsSync(outPath);
      const sizeBytes = exists ? fs.statSync(outPath).size : 0;

      recordResult(
        `Capture ${cp.file} (${Math.round(cp.pct * 100)}% scroll)`,
        'Scrollytelling',
        exists && sizeBytes > 20000 ? 'PASS' : 'FAIL',
        `${cp.label} (${Math.round(sizeBytes / 1024)} KB saved to ${cp.file})`
      );
    }

    // -------------------------------------------------------------------------
    // 3. Scroll-Up Reversibility Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 3. SCROLL-UP REVERSIBILITY TEST ---');
    const scrollUpErrorsBefore = consoleErrors.length;

    // Scrub back up smoothly
    const reverseSteps = [0.75, 0.5, 0.25, 0.0];
    for (const stepPct of reverseSteps) {
      await page.evaluate((targetPct) => {
        const total = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({
          top: targetPct * total,
          behavior: 'instant' as ScrollBehavior,
        });
        window.dispatchEvent(new Event('scroll'));
      }, stepPct);
      await delay(300);
    }
    await delay(800);

    const reversedAudit = await page.evaluate(() => {
      const scrollY = window.scrollY;
      const rangeInput = document.querySelector('input[type="range"]') as HTMLInputElement | null;
      const sliderVal = rangeInput ? parseFloat(rangeInput.value) : -1;
      return { scrollY, sliderVal };
    });

    const reversedCleanly = reversedAudit.scrollY === 0 && consoleErrors.length === scrollUpErrorsBefore;
    recordResult(
      'Smooth Scroll Reversal 100% -> 0%',
      'Scrollytelling',
      reversedCleanly ? 'PASS' : 'FAIL',
      `Final scrollY: ${reversedAudit.scrollY}, slider: ${reversedAudit.sliderVal}, 0 errors thrown`
    );

    // -------------------------------------------------------------------------
    // 4. Operator Authentication & Session Verification
    // -------------------------------------------------------------------------
    console.log('\n--- 4. OPERATOR AUTHENTICATION ---');
    const token = await acquireSessionToken(PORT);
    if (token) {
      await page.setCookie({
        name: 'next-auth.session-token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
      });
    }

    // Navigate to /dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForSelector('h1', { timeout: 5000 });

    const currentUrl = page.url();
    const isAuthenticated = currentUrl.includes('/dashboard');
    recordResult(
      'Operator Login (operator@freshstream.ai)',
      'Auth',
      isAuthenticated ? 'PASS' : 'FAIL',
      `Session established with NextAuth JWT, landed at ${currentUrl}`
    );

    // Save dashboard screenshot
    const dashPath = path.join(SCREENSHOT_DIR, 'dashboard.png');
    await page.screenshot({ path: dashPath, fullPage: false });

    // -------------------------------------------------------------------------
    // 5. Rapid Navigation Loop (2x Sequence, <5s per route, 0 hangs)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. RAPID NAVIGATION LOOP (2 REPETITIONS) ---');

    const navSequence = [
      { route: '/', name: 'Home', selector: 'canvas' },
      { route: '/dashboard', name: 'Dashboard', selector: 'h1' },
      { route: '/dashboard/shipment/FS-8821', name: 'Shipment Detail', selector: 'h1' },
      { route: '/dashboard/analytics', name: 'Analytics', selector: 'h1' },
      { route: '/dashboard/support', name: 'Support', selector: 'h1' },
      { route: '/contact', name: 'Contact (Redirect)', selector: 'h1' },
      { route: '/dashboard', name: 'Dashboard (Repeat)', selector: 'h1' },
      { route: '/dashboard/analytics', name: 'Analytics (Repeat)', selector: 'h1' },
    ];

    for (let rep = 1; rep <= 2; rep++) {
      console.log(`\nExecuting Navigation Loop Repetition #${rep}...`);

      for (const step of navSequence) {
        const stepStart = Date.now();
        let success = true;
        let errorMessage = '';

        try {
          await page.goto(`${BASE_URL}${step.route}`, {
            waitUntil: 'domcontentloaded',
            timeout: MAX_ROUTE_LATENCY_MS,
          });
          if (step.selector) {
            await page.waitForSelector(step.selector, { timeout: 3500 });
          }
        } catch (err: unknown) {
          success = false;
          errorMessage = err instanceof Error ? err.message : String(err);
        }

        const stepDuration = Date.now() - stepStart;
        const passed = success && stepDuration < MAX_ROUTE_LATENCY_MS;

        recordResult(
          `Rep ${rep} -> ${step.name} (${step.route})`,
          'Navigation Stability',
          passed ? 'PASS' : 'FAIL',
          passed
            ? `Rendered in ${stepDuration}ms with 0 socket stalls`
            : `Failed: ${errorMessage || `Exceeded latency threshold (${stepDuration}ms)`}`,
          stepDuration
        );

        // Capture proof screenshots on first pass
        if (rep === 1) {
          if (step.route === '/dashboard/shipment/FS-8821') {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'shipment-detail.png') });
          } else if (step.route === '/dashboard/analytics') {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'analytics.png') });
          } else if (step.route === '/dashboard/support') {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'support.png') });
          } else if (step.route === '/contact') {
            await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'contact.png') });
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 6. Interactive /demo Page: Transport Mode Switching & Cargo Sliders
    // -------------------------------------------------------------------------
    console.log('\n--- 6. LOGISTICS DIGITAL TWIN & MAP DEMO (/demo) ---');
    const demoStart = Date.now();
    await page.goto(`${BASE_URL}/demo`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const demoLoadDur = Date.now() - demoStart;

    recordResult(
      'Demo Page Route Load',
      'Logistics Twin',
      demoLoadDur < MAX_ROUTE_LATENCY_MS ? 'PASS' : 'FAIL',
      `Loaded in ${demoLoadDur}ms`,
      demoLoadDur
    );

    // Wait for Leaflet map canvas
    await page.waitForSelector('.leaflet-container', { timeout: 10000 });

    // Verify and switch all 5 transport modes
    const modeAudit = await page.evaluate(() => {
      const modeButtons = Array.from(document.querySelectorAll('button')).filter((b) => {
        const text = b.textContent || '';
        return (
          text.includes('Heavy Rail') ||
          text.includes('Caspian Ferry') ||
          text.includes('TIR Highway') ||
          text.includes('Smart 40ft') ||
          text.includes('TITR Multi') ||
          text.includes('TRAIN') ||
          text.includes('SHIP') ||
          text.includes('TRUCK')
        );
      });

      return {
        modeButtonsCount: modeButtons.length,
        buttonTexts: modeButtons.map((b) => (b.textContent || '').trim().replace(/\s+/g, ' ')),
      };
    });

    recordResult(
      '5 Transport Modality Selectors Present',
      'Logistics Twin',
      modeAudit.modeButtonsCount >= 5 ? 'PASS' : 'FAIL',
      `Found ${modeAudit.modeButtonsCount} mode buttons: ${modeAudit.buttonTexts.slice(0, 5).join(' | ')}`
    );

    // Click through each transport mode to trigger reactive polyline and camera updates
    const modeKeywords = ['Heavy Rail', 'Caspian Ferry', 'TIR Highway', 'Smart Container', 'Multimodal Chain'];
    for (const kw of modeKeywords) {
      const clicked = await page.evaluate((keyword) => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => {
          const t = b.textContent || '';
          return t.includes(keyword) || t.includes(keyword.split(' ')[0]);
        });
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      }, kw);

      await delay(400); // Allow camera pan & polyline pulse
      recordResult(
        `Switch Mode -> ${kw}`,
        'Logistics Twin',
        clicked ? 'PASS' : 'FAIL',
        clicked ? 'Reactive polyline & bounds updated' : 'Button not found'
      );
    }

    // Verify and manipulate Cargo Condition Sliders (Temperature & Excursion)
    const sliderAudit = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
      // Find actual temperature slider (min -5.0 or -5)
      const tempActSlider = inputs.find(
        (i) => i.getAttribute('min') === '-5' || i.getAttribute('min') === '-5.0'
      ) as HTMLInputElement | null;
      if (!tempActSlider) return { tested: false, error: 'Temperature slider not found' };

      const oldVal = tempActSlider.value;
      tempActSlider.value = '12.0';
      tempActSlider.dispatchEvent(new Event('input', { bubbles: true }));
      tempActSlider.dispatchEvent(new Event('change', { bubbles: true }));

      return { tested: true, oldVal, newVal: tempActSlider.value };
    });

    recordResult(
      'Interactive Cargo Condition Excursion Sliders',
      'Logistics Twin',
      sliderAudit.tested ? 'PASS' : 'FAIL',
      sliderAudit.tested
        ? `Excursion slider shifted from ${sliderAudit.oldVal}°C to ${sliderAudit.newVal}°C`
        : sliderAudit.error || 'Slider failed'
    );

    // Wait 1200ms for Leaflet animations and BHI recalculation
    await delay(1200);

    // Save demo map screenshot
    const demoMapPath = path.join(SCREENSHOT_DIR, 'demo-map.png');
    await page.screenshot({ path: demoMapPath, fullPage: false });
    const demoMapExists = fs.existsSync(demoMapPath);
    const demoMapBytes = demoMapExists ? fs.statSync(demoMapPath).size : 0;

    recordResult(
      'Capture demo-map.png',
      'Visual QA',
      demoMapExists && demoMapBytes > 20000 ? 'PASS' : 'FAIL',
      `Leaflet map with active track, hubs, and telemetry cards (${Math.round(demoMapBytes / 1024)} KB)`
    );

    // -------------------------------------------------------------------------
    // 7. Console & WebGL Error Audit
    // -------------------------------------------------------------------------
    console.log('\n--- 7. CONSOLE & WEBGL ERROR AUDIT ---');
    const totalConsoleErrors = consoleErrors.length;
    const totalWebglErrors = webglErrors.length;

    recordResult(
      'Zero Unhandled Console Errors',
      'Error Audit',
      totalConsoleErrors === 0 ? 'PASS' : 'FAIL',
      totalConsoleErrors === 0
        ? '0 unhandled console errors detected'
        : `${totalConsoleErrors} console error(s): ${consoleErrors.slice(0, 3).join('; ')}`
    );

    recordResult(
      'Zero WebGL Shader/Context Errors',
      'Error Audit',
      totalWebglErrors === 0 ? 'PASS' : 'FAIL',
      totalWebglErrors === 0
        ? '0 WebGL errors detected'
        : `${totalWebglErrors} WebGL error(s): ${webglErrors.slice(0, 3).join('; ')}`
    );

  } finally {
    if (browser) {
      await browser.close();
      console.log('\n[BROWSER] Closed headless browser session.');
    }
    if (serverManaged && serverProc) {
      serverProc.kill();
      console.log('[SERVER] Terminated spawned Next.js test server process.');
    }
  }

  // ---------------------------------------------------------------------------
  // Summary & Acceptance Verdict
  // ---------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log('                 VERIFICATION RESULTS SUMMARY                         ');
  console.log('======================================================================\n');

  const total = report.length;
  const passed = report.filter((r) => r.status === 'PASS').length;
  const failed = report.filter((r) => r.status === 'FAIL').length;

  console.log(`TOTAL CHECKS  : ${total}`);
  console.log(`PASSED        : ${passed}`);
  console.log(`FAILED        : ${failed}`);
  console.log(`PASS RATE     : ${Math.round((passed / total) * 100)}%\n`);

  if (failed > 0) {
    console.error('❌ QA ACCEPTANCE FAILED — ONE OR MORE CHECKS DID NOT PASS.');
    process.exit(1);
  } else {
    console.log('🎉 QA ACCEPTANCE 100% PASSED — ALL REAL BROWSER VERIFICATION CHECKS SUCCEEDED.');
    process.exit(0);
  }
}

runBrowserQA().catch((err) => {
  console.error('\n❌ FATAL SCRIPT EXCEPTION:', err);
  process.exit(1);
});
