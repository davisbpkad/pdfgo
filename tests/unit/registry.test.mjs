/**
 * registry.test.mjs - The sidebar resolves every menu entry through the feature
 * registry. If a tool is added to the menu without registering it, the sidebar
 * renders an empty icon and an untranslated label instead of failing loudly.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

/** Feature folders imported by the registry. */
function registeredFeatures() {
  const registry = read('src/features/registry.js');
  return [...registry.matchAll(/import \* as \w+ from '\.\/([\w-]+)\/index\.js';/g)].map((m) => m[1]);
}

/** Tool ids the sidebar menu shows. */
function menuToolIds() {
  const sidebar = read('src/ui/AppSidebar.vue');
  const ids = new Set();
  for (const m of sidebar.matchAll(/toolIds:\s*\[([^\]]*)\]/g)) {
    for (const id of m[1].matchAll(/'([^']+)'/g)) ids.add(id[1]);
  }
  for (const m of sidebar.matchAll(/toolIds\.push\('([^']+)'\)/g)) ids.add(m[1]);
  return ids;
}

test('registry: every sidebar entry resolves to a registered feature', () => {
  const registered = new Set(registeredFeatures());
  const missing = [...menuToolIds()].filter((id) => !registered.has(id));
  assert.deepEqual(missing, [], `menu ids without a registered feature: ${missing.join(', ')}`);
});

test('registry: every registered feature exports the metadata the sidebar reads', () => {
  const broken = [];
  for (const feature of registeredFeatures()) {
    const source = read(`src/features/${feature}/index.js`);
    for (const key of ['id', 'titleKey', 'descKey', 'icon']) {
      if (!new RegExp(`export[^\\n]*\\b${key}\\b`).test(source)) {
        broken.push(`${feature} -> ${key}`);
      }
    }
  }
  assert.deepEqual(broken, [], `features missing metadata: ${broken.join(', ')}`);
});

test('registry: no feature folder is left out of the registry', () => {
  const registered = new Set(registeredFeatures());
  const folders = fs.readdirSync(path.join(ROOT, 'src/features'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(ROOT, 'src/features', entry.name, 'index.js')))
    .map((entry) => entry.name);
  const orphans = folders.filter((name) => !registered.has(name));
  assert.deepEqual(orphans, [], `feature folders not in the registry: ${orphans.join(', ')}`);
});

test('registry: every feature has a unique monochrome stroke SVG icon', () => {
  const seen = new Map();
  const duplicates = [];
  const invalid = [];
  for (const feature of registeredFeatures()) {
    const source = read(`src/features/${feature}/index.js`);
    const match = source.match(/export const icon = `([^`]+)`;/);
    if (!match) {
      invalid.push(`${feature}: missing icon export`);
      continue;
    }
    const svg = match[1];
    if (!svg.includes('stroke="currentColor"') || !svg.includes('stroke-linecap="round"') || !svg.includes('stroke-linejoin="round"')) {
      invalid.push(`${feature}: missing stroke attributes`);
    }
    if (seen.has(svg)) {
      duplicates.push(`${seen.get(svg)} === ${feature}`);
    } else {
      seen.set(svg, feature);
    }
  }
  assert.deepEqual(invalid, [], `invalid icons: ${invalid.join(', ')}`);
  assert.deepEqual(duplicates, [], `duplicate sidebar icons: ${duplicates.join(', ')}`);
});

test('ui: Vue templates and i18n do not render colorful emoji icons', () => {
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}]/u;
  const i18nSource = read('src/core/i18n.js');
  assert.equal(emojiRegex.test(i18nSource), false, 'i18n.js should not contain colorful emoji icons');

  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : (entry.name.endsWith('.vue') ? [full] : []);
  });
  const violations = [];
  for (const file of walk(path.join(ROOT, 'src'))) {
    const stripped = fs.readFileSync(file, 'utf8').replace(/aria-label="🗑"/g, '');
    if (emojiRegex.test(stripped)) {
      violations.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(violations, [], `Vue files with colorful emojis: ${violations.join(', ')}`);
});

