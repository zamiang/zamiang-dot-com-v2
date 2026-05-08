#!/usr/bin/env node
/**
 * Verify that design tokens shared between `src/styles/globals.css` (canonical)
 * and `design-system/colors_and_type.css` (mirror / documentation) have not
 * drifted. Tokens defined in only one file are ignored — only intersecting
 * keys are compared.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANONICAL = resolve(repoRoot, 'src/styles/globals.css');
const MIRROR = resolve(repoRoot, 'design-system/colors_and_type.css');

function extractRootTokens(css) {
  const match = css.match(/:root\s*{([\s\S]*?)}/);
  if (!match) throw new Error('no :root block found');
  const body = match[1];
  const tokens = new Map();
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/);
    if (m) tokens.set(m[1], normalize(m[2]));
  }
  return tokens;
}

// Normalize cosmetic differences: collapse whitespace, strip trailing zeros
// from decimals (0.10 → 0.1, 1.250 → 1.25, 1.00 → 1), drop inline comments.
function normalize(value) {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/(\d+\.\d*?)0+(?=\D|$)/g, '$1')
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
  console.log(
    `design tokens in sync (${[...mirror.keys()].filter((k) => canonical.has(k)).length} shared keys)`,
  );
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
