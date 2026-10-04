import { en, ru, kz } from '../src/lib/i18n/translations';

function getDeepKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getDeepKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = new Set(getDeepKeys(en as unknown as Record<string, unknown>));
const ruKeys = new Set(getDeepKeys(ru as unknown as Record<string, unknown>));
const kzKeys = new Set(getDeepKeys(kz as unknown as Record<string, unknown>));

console.log(`[i18n-parity] Total EN keys: ${enKeys.size}`);
console.log(`[i18n-parity] Total RU keys: ${ruKeys.size}`);
console.log(`[i18n-parity] Total KZ keys: ${kzKeys.size}`);

let errors = 0;

for (const key of enKeys) {
  if (!ruKeys.has(key)) {
    console.error(`Missing RU key: ${key}`);
    errors++;
  }
  if (!kzKeys.has(key)) {
    console.error(`Missing KZ key: ${key}`);
    errors++;
  }
}

for (const key of ruKeys) {
  if (!enKeys.has(key)) {
    console.error(`Extra RU key not in EN: ${key}`);
    errors++;
  }
}

for (const key of kzKeys) {
  if (!enKeys.has(key)) {
    console.error(`Extra KZ key not in EN: ${key}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`FAIL: ${errors} i18n parity errors detected!`);
  process.exit(1);
} else {
  console.log('SUCCESS: 100% translation key parity verified across EN, RU, and KZ!');
}
