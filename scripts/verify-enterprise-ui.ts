import fs from 'fs';
import path from 'path';
import { en, ru, kz } from '../src/lib/i18n/translations';

interface VerificationResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

function record(suite: string, name: string, passed: boolean, details?: string) {
  results.push({ suite, name, passed, details });
  if (passed) {
    console.log(`  ✓ [${suite}] ${name}`);
  } else {
    console.error(`  ✗ [${suite}] ${name}: ${details || 'Failed'}`);
  }
}

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

console.log('====================================================');
console.log('   FreshStream AI — Milestone 3 Enterprise UI Audit  ');
console.log('====================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Neon / Radioactive Artifact Elimination
// --------------------------------------------------------------------------
console.log('▶ Suite 1: Eliminating Neon & Vomit Artifacts');

// 1.1 Layout.tsx ambient blur orbs check
const layoutPath = path.join(SRC_DIR, 'app', 'layout.tsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');
const layoutHasOrbs = /blur-\[120px\]|blur-\[130px\]|blur-\[140px\]|Ambient Background Glow Meshes/i.test(layoutContent);
record(
  'Neon Elimination',
  'Ambient background blur meshes removed from layout.tsx',
  !layoutHasOrbs,
  layoutHasOrbs ? 'Found ambient blur mesh orbs in layout.tsx' : undefined
);

// 1.2 Button.tsx 25px radioactive shadows check
const buttonPath = path.join(SRC_DIR, 'components', 'ui', 'Button.tsx');
const buttonContent = fs.readFileSync(buttonPath, 'utf8');
const buttonHasRadioactiveShadows = /shadow-\[0_0_25px|shadow-\[0_0_15px_rgba\(16,185,129|rgba\(16,185,129,0\.45\)|rgba\(139,92,246,0\.45\)/.test(buttonContent);
record(
  'Neon Elimination',
  'Radioactive 25px box shadows removed from Button.tsx',
  !buttonHasRadioactiveShadows,
  buttonHasRadioactiveShadows ? 'Found radioactive shadows in Button.tsx' : undefined
);

// 1.3 Badge.tsx outer glow shadows check
const badgePath = path.join(SRC_DIR, 'components', 'ui', 'Badge.tsx');
const badgeContent = fs.readFileSync(badgePath, 'utf8');
const badgeHasGlow = /shadow-\[0_0_10px/.test(badgeContent);
record(
  'Neon Elimination',
  'Outer glow drop shadows removed from Badge.tsx',
  !badgeHasGlow,
  badgeHasGlow ? 'Found outer glow drop shadows in Badge.tsx' : undefined
);

// 1.4 GlassCard.tsx border glow variants check
const glassCardPath = path.join(SRC_DIR, 'components', 'ui', 'GlassCard.tsx');
const glassCardContent = fs.readFileSync(glassCardPath, 'utf8');
const glassCardHasTackyGlows = /border-emerald-500\/70|border-indigo-500\/70/.test(glassCardContent);
record(
  'Neon Elimination',
  'Restrained enterprise borders in GlassCard.tsx (no neon hover borders)',
  !glassCardHasTackyGlows,
  glassCardHasTackyGlows ? 'Found neon border glows in GlassCard.tsx' : undefined
);

// 1.5 Login page gradient blur halo check
const loginPath = path.join(SRC_DIR, 'app', 'login', 'page.tsx');
const loginContent = fs.readFileSync(loginPath, 'utf8');
const loginHasGradientHalo = /bg-gradient-to-r.*blur-xl|shadow-\[0_0_20px_rgba\(16,185,129/.test(loginContent);
record(
  'Neon Elimination',
  'Gradient blur halo and icon glow removed from login/page.tsx',
  !loginHasGradientHalo,
  loginHasGradientHalo ? 'Found gradient blur halo or icon glow in login/page.tsx' : undefined
);

// 1.6 Tailwind config glow tokens check
const tailwindConfigPath = path.join(ROOT_DIR, 'tailwind.config.ts');
const tailwindConfigContent = fs.readFileSync(tailwindConfigPath, 'utf8');
const tailwindHasGlowTokens = /mint-glow|cyber-glow|danger-glow|borderGlow|purpleGlow/.test(tailwindConfigContent);
record(
  'Neon Elimination',
  'Glow color and box-shadow tokens purged from tailwind.config.ts',
  !tailwindHasGlowTokens,
  tailwindHasGlowTokens ? 'Found residual glow tokens in tailwind.config.ts' : undefined
);

// --------------------------------------------------------------------------
// SUITE 2: Light-Mode Contrast Hardening
// --------------------------------------------------------------------------
console.log('\n▶ Suite 2: Light-Mode Contrast Hardening (WCAG Compliance)');

// Check owned files for unprotected hardcoded text-white on text elements
const ownedFilesToCheckContrast = [
  path.join(SRC_DIR, 'app', 'login', 'page.tsx'),
  path.join(SRC_DIR, 'app', 'dashboard', 'support', 'page.tsx'),
  path.join(SRC_DIR, 'components', 'layout', 'Header.tsx'),
  path.join(SRC_DIR, 'components', 'ui', 'Badge.tsx'),
  path.join(SRC_DIR, 'components', 'ui', 'GlassCard.tsx'),
];

let unhedgedTextWhiteViolations = 0;
for (const filePath of ownedFilesToCheckContrast) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Flag <h1-6>, <p>, <span>, <label> with text-white unless accompanied by dark:text-white or light:
    if (/(<(?:h[1-6]|p|span|label)[^>]*\btext-white\b)/.test(line)) {
      if (!line.includes('dark:text-white') && !line.includes('dark:') && !line.includes('bg-emerald') && !line.includes('bg-purple')) {
        console.warn(`    Warning: Unscoped text-white at ${path.basename(filePath)}:${idx + 1}: ${line.trim()}`);
        unhedgedTextWhiteViolations++;
      }
    }
  });
}

record(
  'Contrast Hardening',
  'Typography elements across owned files use theme-aware classes (text-slate-900 dark:text-white)',
  unhedgedTextWhiteViolations === 0,
  unhedgedTextWhiteViolations > 0 ? `${unhedgedTextWhiteViolations} unscoped text-white occurrences found` : undefined
);

// Verify Badge light mode contrast (text classes have dark: counterparts)
const badgeThemeAware = badgeContent.includes('dark:text-emerald-400') &&
                        badgeContent.includes('dark:text-indigo-400') &&
                        badgeContent.includes('dark:text-amber-400') &&
                        badgeContent.includes('dark:text-red-400');
record(
  'Contrast Hardening',
  'Badge component includes high-contrast light mode text colors',
  badgeThemeAware,
  badgeThemeAware ? undefined : 'Badge component missing theme-aware text colors'
);

// --------------------------------------------------------------------------
// SUITE 3: Academic Purge & B2B Enterprise Copy (R5)
// --------------------------------------------------------------------------
console.log('\n▶ Suite 3: Independence & B2B Enterprise Copy');

// 3.1 Support page copy
const supportPath = path.join(SRC_DIR, 'app', 'dashboard', 'support', 'page.tsx');
const supportContent = fs.readFileSync(supportPath, 'utf8');
const supportHasAcademicPhrase = /Academic & Logistics Partnership/i.test(supportContent);
const supportHasEnterpriseCopy = supportContent.includes('Enterprise Logistics Network Integration');

record(
  'B2B Copywriting',
  'support/page.tsx replaced academic partnership with Enterprise Logistics Network Integration',
  !supportHasAcademicPhrase && supportHasEnterpriseCopy,
  supportHasAcademicPhrase ? 'Found "Academic & Logistics Partnership" in support/page.tsx' : undefined
);

// 3.2 Header comment check
const headerPath = path.join(SRC_DIR, 'components', 'layout', 'Header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');
const headerHasAcademicComment = /Academic Badge/i.test(headerContent);
record(
  'B2B Copywriting',
  'Header.tsx clean of academic badge references and comments',
  !headerHasAcademicComment,
  headerHasAcademicComment ? 'Found academic badge comment in Header.tsx' : undefined
);

// 3.3 Forbidden university terms across all files in src/
const forbiddenRegex = /satbayev|сатпаев|gwu|george washington|\bGW\b/i;
function scanForbiddenInDir(dir: string): string[] {
  let matches: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        matches = matches.concat(scanForbiddenInDir(fullPath));
      }
    } else if (/\.(tsx?|jsx?|json|css|md)$/.test(entry.name)) {
      const text = fs.readFileSync(fullPath, 'utf8');
      if (forbiddenRegex.test(text)) {
        matches.push(fullPath);
      }
    }
  }
  return matches;
}

const forbiddenHits = scanForbiddenInDir(SRC_DIR);
record(
  'Independence (R5)',
  'Zero occurrences of forbidden terms (satbayev/сатпаев/gwu/george washington/GW) in src/',
  forbiddenHits.length === 0,
  forbiddenHits.length > 0 ? `Hits in: ${forbiddenHits.join(', ')}` : undefined
);

// 3.4 partner_title in translations.ts
const partnerTitleEN = en.hero.partner_title;
const partnerTitleRU = ru.hero.partner_title;
const partnerTitleKZ = kz.hero.partner_title;

const partnerIsEnterprise = !partnerTitleEN.toLowerCase().includes('academic') &&
                            !partnerTitleRU.toLowerCase().includes('академическ') &&
                            !partnerTitleKZ.toLowerCase().includes('академиялық');

record(
  'B2B Copywriting',
  'hero.partner_title in translations.ts uses enterprise B2B copy across EN, RU, and KZ',
  partnerIsEnterprise,
  partnerIsEnterprise ? undefined : `Residual academic phrase found in partner_title: EN="${partnerTitleEN}", RU="${partnerTitleRU}", KZ="${partnerTitleKZ}"`
);

// --------------------------------------------------------------------------
// SUITE 4: Trilingual i18n Key Parity & Polish (R4)
// --------------------------------------------------------------------------
console.log('\n▶ Suite 4: Trilingual i18n Parity (EN / RU / KZ)');

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

let parityMismatch = 0;
for (const key of enKeys) {
  if (!ruKeys.has(key)) parityMismatch++;
  if (!kzKeys.has(key)) parityMismatch++;
}
for (const key of ruKeys) {
  if (!enKeys.has(key)) parityMismatch++;
}
for (const key of kzKeys) {
  if (!enKeys.has(key)) parityMismatch++;
}

record(
  'i18n Parity',
  `100% key parity across EN (${enKeys.size}), RU (${ruKeys.size}), and KZ (${kzKeys.size}) keys`,
  parityMismatch === 0 && enKeys.size >= 457,
  parityMismatch > 0 ? `${parityMismatch} key mismatches found` : undefined
);

// Check for lorem ipsum or unfinished placeholders in translation dictionaries
function checkNoLoremOrEmpty(dict: Record<string, unknown>, lang: string): number {
  let issues = 0;
  for (const [k, v] of Object.entries(dict)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      issues += checkNoLoremOrEmpty(v as Record<string, unknown>, lang);
    } else if (typeof v === 'string') {
      if (/lorem\s+ipsum/i.test(v)) {
        console.error(`    Found lorem ipsum in ${lang}.${k}: "${v}"`);
        issues++;
      }
      if (v.trim().length === 0) {
        console.error(`    Found empty translation string in ${lang}.${k}`);
        issues++;
      }
    }
  }
  return issues;
}

const loremIssues = checkNoLoremOrEmpty(en as unknown as Record<string, unknown>, 'en') +
                    checkNoLoremOrEmpty(ru as unknown as Record<string, unknown>, 'ru') +
                    checkNoLoremOrEmpty(kz as unknown as Record<string, unknown>, 'kz');

record(
  'i18n Polish',
  'Zero occurrences of lorem ipsum or empty strings in translation dictionaries',
  loremIssues === 0,
  loremIssues > 0 ? `${loremIssues} placeholder issues found` : undefined
);

// --------------------------------------------------------------------------
// SUMMARY & EXIT
// --------------------------------------------------------------------------
console.log('\n====================================================');
const failedCount = results.filter((r) => !r.passed).length;
const passedCount = results.filter((r) => r.passed).length;

if (failedCount > 0) {
  console.error(`❌ VERIFICATION FAILED: ${failedCount} of ${results.length} checks failed.`);
  process.exit(1);
} else {
  console.log(`✅ VERIFICATION PASSED: All ${passedCount} enterprise UI checks passed successfully!`);
  process.exit(0);
}
