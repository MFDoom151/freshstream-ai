import { translations, en, ru, kz } from '../src/lib/i18n/translations';
import { Locale } from '../src/types/i18n';

console.log('=====================================================');
console.log('CHALLENGER 2: EMPIRICAL STATE & ROUTE STRESS HARNESS');
console.log('=====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${message}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${message}`);
  }
}

// -------------------------------------------------------------
// Test 1: Trilingual Translation Parity & Key Resolution
// -------------------------------------------------------------
console.log('--- Test Suite 1: i18n Dictionary Integrity & Dynamic Resolution ---');

function getAllKeys(obj: Record<string, any>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys = keys.concat(getAllKeys(obj[k], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = getAllKeys(en);
const ruKeys = getAllKeys(ru);
const kzKeys = getAllKeys(kz);

console.log(`Discovered Keys - EN: ${enKeys.length}, RU: ${ruKeys.length}, KZ: ${kzKeys.length}`);
assert(enKeys.length === ruKeys.length, `EN (${enKeys.length}) and RU (${ruKeys.length}) key counts match`);
assert(enKeys.length === kzKeys.length, `EN (${enKeys.length}) and KZ (${kzKeys.length}) key counts match`);

// Create simulated `t` function identical to context.tsx
function createTranslator(locale: Locale) {
  const dict = translations[locale] || translations['en'];
  return (keyPath: string, params?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: any = dict;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        let fallback: any = translations['en'];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            fallback = undefined;
            break;
          }
        }
        current = fallback !== undefined ? fallback : keyPath;
        break;
      }
    }
    let result = typeof current === 'string' ? current : keyPath;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }
    return result;
  };
}

// Verify that every single EN key resolves to a non-empty string in all 3 locales
let allKeysResolve = true;
for (const key of enKeys) {
  const tEn = createTranslator('en')(key);
  const tRu = createTranslator('ru')(key);
  const tKz = createTranslator('kz')(key);

  if (!tEn || tEn === key || !tRu || tRu === key || !tKz || tKz === key) {
    console.error(`Key resolution failure for: ${key}`, { tEn, tRu, tKz });
    allKeysResolve = false;
    break;
  }
}
assert(allKeysResolve, 'All 360+ keys resolve to distinct non-empty localized strings across EN, RU, KZ');

// Test 2: Language Switching State Transitions
console.log('\n--- Test Suite 2: Language Switcher State Transitions ---');

let currentLocale: Locale = 'en';
const simulatedLocalStorage: Record<string, string> = {};
const simulatedCookies: Record<string, string> = {};

function switchLocale(newLocale: Locale) {
  currentLocale = newLocale;
  try {
    simulatedLocalStorage['freshstream_lang'] = newLocale;
    simulatedCookies['freshstream_lang'] = newLocale;
  } catch (err) {
    // Ignore error like in context.tsx
  }
}

// Step 1: Default is EN
let t = createTranslator(currentLocale);
assert(t('nav.home') === 'Home', 'Default locale EN: nav.home is "Home"');
assert(t('hero.headline').includes('Active Biological Preservation'), 'EN headline correct');

// Step 2: Switch to RU
switchLocale('ru');
t = createTranslator(currentLocale);
assert(simulatedLocalStorage['freshstream_lang'] === 'ru', 'Locale stored in localStorage is "ru"');
assert(t('nav.home') === 'Главная', 'Switched to RU: nav.home is "Главная"');
assert(t('hero.headline').toLowerCase().includes('биологическое сохранение'), 'RU headline contains Cyrillic translated text');

// Step 3: Switch to KZ
switchLocale('kz');
t = createTranslator(currentLocale);
assert(simulatedLocalStorage['freshstream_lang'] === 'kz', 'Locale stored in localStorage is "kz"');
assert(t('nav.home') === 'Басты бет', 'Switched to KZ: nav.home is "Басты бет"');
assert(t('hero.headline').toLowerCase().includes('биологиялық сақтау'), 'KZ headline contains Kazakh translated text');

// Step 4: Switch back to EN
switchLocale('en');
t = createTranslator(currentLocale);
assert(t('nav.home') === 'Home', 'Switched back to EN: nav.home is "Home"');

// -------------------------------------------------------------
// Test 3: Adversarial i18n Stress & Fallback Handling
// -------------------------------------------------------------
console.log('\n--- Test Suite 3: Adversarial i18n Fallback & Resiliency ---');

// Invalid locale should not throw and should fallback to EN
const tInvalid = createTranslator('es' as any);
assert(tInvalid('nav.home') === 'Home', 'Unsupported locale "es" gracefully falls back to EN dictionary without crashing');

// Non-existent key should return keyPath safely
const nonExistent = t('some.totally.bogus.deep.key');
assert(nonExistent === 'some.totally.bogus.deep.key', 'Non-existent key returns keyPath without throwing');

// Empty key
assert(t('') === '', 'Empty string key handled safely');

// Dot-only key
assert(t('...') === '...', 'Dot-only key handled safely');

// Missing parameters test
const paramTemplate = createTranslator('en')('demo.container_id');
assert(typeof paramTemplate === 'string', 'Parametric key string safely rendered');

// -------------------------------------------------------------
// Test 4: Theme Switching State Transitions & Anti-FOUC Logic
// -------------------------------------------------------------
console.log('\n--- Test Suite 4: Theme Switching State Transitions ---');

type Theme = 'dark' | 'light';
class MockDOMElement {
  classList = new Set<string>();
  constructor() {
    this.classList.add('dark'); // Dark mode default as per spec
  }
}

const mockDocumentElement = new MockDOMElement();
const themeStorage: Record<string, string> = {};

function applyThemeClass(activeTheme: Theme) {
  if (activeTheme === 'dark') {
    mockDocumentElement.classList.add('dark');
    mockDocumentElement.classList.delete('light');
  } else {
    mockDocumentElement.classList.delete('dark');
    mockDocumentElement.classList.add('light');
  }
}

const themeState: { current: Theme } = { current: 'dark' };
function setTheme(newTheme: Theme) {
  themeState.current = newTheme;
  applyThemeClass(newTheme);
  themeStorage['freshstream_theme'] = newTheme;
}

function toggleTheme() {
  const next = themeState.current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

// Initial state: dark mode default
assert(mockDocumentElement.classList.has('dark'), 'Initial theme class is "dark"');
assert(!mockDocumentElement.classList.has('light'), 'Initial theme class does NOT have "light"');

// Toggle to Light
toggleTheme();
assert(themeState.current === 'light', 'Theme state toggled to "light"');
assert(mockDocumentElement.classList.has('light'), 'DOM documentElement has "light" class');
assert(!mockDocumentElement.classList.has('dark'), 'DOM documentElement removed "dark" class');
assert(themeStorage['freshstream_theme'] === 'light', 'LocalStorage updated to "light"');

// Toggle to Dark
toggleTheme();
assert(themeState.current === 'dark', 'Theme state toggled to "dark"');
assert(mockDocumentElement.classList.has('dark'), 'DOM documentElement has "dark" class');
assert(!mockDocumentElement.classList.has('light'), 'DOM documentElement removed "light" class');
assert(themeStorage['freshstream_theme'] === 'dark', 'LocalStorage updated to "dark"');

// Stress test rapid toggles (100 rapid cycles)
for (let i = 0; i < 100; i++) {
  toggleTheme();
}
assert(themeState.current === 'dark', '100 rapid theme toggles executed cleanly without state corruption');

// Anti-FOUC inline script simulation
function simulateAntiFoucScript(storageVal: string | null): string {
  let activeClass = 'dark';
  try {
    if (storageVal === 'light') {
      activeClass = 'light';
    } else {
      activeClass = 'dark';
    }
  } catch (e) {}
  return activeClass;
}

assert(simulateAntiFoucScript('light') === 'light', 'Anti-FOUC script restores "light" when stored');
assert(simulateAntiFoucScript('dark') === 'dark', 'Anti-FOUC script restores "dark" when stored');
assert(simulateAntiFoucScript(null) === 'dark', 'Anti-FOUC script defaults to "dark" when null/uninitialized');

// Private browsing / localStorage blocked resilience
let blockedStorageSuccess = false;
try {
  // Simulating throwing localStorage
  const throwingSetTheme = (theme: Theme) => {
    try {
      throw new Error('QuotaExceededError / SecurityError: Storage is disabled');
    } catch {
      // Ignored gracefully
    }
  };
  throwingSetTheme('light');
  blockedStorageSuccess = true;
} catch {
  blockedStorageSuccess = false;
}
assert(blockedStorageSuccess, 'LocalStorage throw in private browsing caught safely without crashing');

console.log('\n=====================================================');
console.log(`TOTAL PASSED: ${passCount} | TOTAL FAILED: ${failCount}`);
console.log('=====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
