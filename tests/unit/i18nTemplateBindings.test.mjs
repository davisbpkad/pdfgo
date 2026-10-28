/**
 * i18nTemplateBindings.test.mjs - A component that calls t('...') in its template
 * but never imports t() renders as a blank element, because the compiler resolves
 * the name to _ctx.t (undefined). That is how the signature placement overlay went
 * blank white the moment a signature was chosen.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(import.meta.dirname, '../../src');

function vueFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return vueFiles(full);
    return entry.name.endsWith('.vue') ? [full] : [];
  });
}

test('i18n: every component that calls t() in its template imports t', () => {
  const offenders = vueFiles(SRC).filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    const template = source.slice(source.indexOf('<template>'));
    const usesT = /\bt\(\s*'[a-z]+\./.test(template);
    return usesT && !/import\s*\{[^}]*\bt\b[^}]*\}\s*from/.test(source);
  }).map((file) => path.relative(SRC, file));

  assert.deepEqual(offenders, [], `Missing t() import in: ${offenders.join(', ')}`);
});
