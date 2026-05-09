#!/usr/bin/env node
/**
 * Verify that design tokens shared between `src/styles/globals.css` (canonical)
 * and `design-system/colors_and_type.css` (mirror / documentation) have not
 * drifted.
 *
 * Only intersecting keys are compared. Tokens added exclusively to globals.css
 * will NOT cause a failure — update colors_and_type.css manually to keep the
 * mirror complete. (The design-system file is a documentation snapshot, not
 * a build dependency, so partial mirroring is acceptable.)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANONICAL = resolve(repoRoot, 'src/styles/globals.css');
const MIRROR = resolve(repoRoot, 'design-system/colors_and_type.css');

// Extract the body of the first `:root { … }` block by counting brace depth,
// so nested rules (e.g. an `@media` block inside `:root`) don't truncate the
// capture the way a non-greedy regex would.
function extractRootBlock(css) {
  const start = css.indexOf(':root');
  if (start === -1) throw new Error('no :root block found');
  const open = css.indexOf('{', start);
  if (open === -1) throw new Error(':root block has no opening brace');
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  throw new Error(':root block not closed');
}

function extractRootTokens(css) {
  const tokens = new Map();
  // Per-line match: only single-line `--name: value;` declarations are
  // captured. Values that span multiple lines would be skipped — current
  // tokens are all single-line, so this is acceptable.
  for (const line of extractRootBlock(css).split('\n')) {
    const m = line.match(/^\s*(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/);
    if (m) tokens.set(m[1], normalize(m[2]));
  }
  return tokens;
}

// Normalize cosmetic differences: drop inline comments, collapse whitespace,
// strip trailing decimal zeros (0.10 → 0.1, 1.250 → 1.25), and drop a bare
// trailing decimal point (1. → 1).
function normalize(value) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/(\d+\.\d*?)0+(?=\D|$)/g, '$1') // strip trailing decimal zeros
    .replace(/(\d+)\.(?=\D|$)/g, '$1')
    .trim();
}

const canonical = extractRootTokens(readFileSync(CANONICAL, 'utf8'));
const mirror = extractRootTokens(readFileSync(MIRROR, 'utf8'));

const mismatches = [];
for (const [key, value] of mirror) {
  if (!canonical.has(key)) continue;
  if (canonical.get(key) !== value) {
    mismatches.push({ key, canonical: canonical.get(key), mirror: value });
  }
}

if (mismatches.length === 0) {
  const shared = [...mirror.keys()].filter((k) => canonical.has(k)).length;
  const unmirrored = [...canonical.keys()].filter((k) => !mirror.has(k));
  console.log(`design tokens in sync (${shared} shared keys)`);
  if (unmirrored.length > 0) {
    console.log(
      `  note: ${unmirrored.length} token(s) in globals.css are not yet in the mirror —`,
    );
    console.log(
      `        update design-system/colors_and_type.css to keep documentation complete.`,
    );
    console.log(`        missing: ${unmirrored.join(', ')}`);
  }
  process.exit(0);
}

console.error('Design token drift detected:\n');
for (const { key, canonical: c, mirror: m } of mismatches) {
  console.error(`  ${key}`);
  console.error(`    src/styles/globals.css       : ${c}`);
  console.error(`    design-system/colors_and_type.css: ${m}\n`);
}
console.error(
  'globals.css is the source of truth — update design-system/colors_and_type.css to match.',
);
process.exit(1);
