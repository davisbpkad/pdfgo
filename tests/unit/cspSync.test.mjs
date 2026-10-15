/**
 * tests/unit/cspSync.test.mjs - Guards that every CSP source stays in sync and allows WebAssembly.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_SECURITY_POLICY, allowsWebAssembly } from '../../scripts/csp.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');

test('csp: shared policy allows WebAssembly (required by OCR)', () => {
  assert.equal(allowsWebAssembly(CONTENT_SECURITY_POLICY), true);
  assert.match(CONTENT_SECURITY_POLICY, /script-src[^;]*'unsafe-eval'/);
  assert.match(CONTENT_SECURITY_POLICY, /worker-src blob:/);
});

test('csp: build.mjs and serve.mjs use the shared policy', () => {
  const build = fs.readFileSync(path.join(ROOT, 'build.mjs'), 'utf8');
  const serve = fs.readFileSync(path.join(ROOT, 'scripts/serve.mjs'), 'utf8');

  for (const [name, source] of [['build.mjs', build], ['serve.mjs', serve]]) {
    assert.match(source, /from '(\.\/csp\.mjs|\.\.\/scripts\/csp\.mjs|\.\/scripts\/csp\.mjs)'/, `${name} must import scripts/csp.mjs`);
    assert.match(source, /CONTENT_SECURITY_POLICY/, `${name} must use the shared CSP constant`);
    assert.doesNotMatch(source, /script-src 'self' 'unsafe-inline' blob:/, `${name} still hardcodes an old CSP`);
  }
});

test('csp: netlify.toml header matches the shared policy', () => {
  const toml = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
  const match = toml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/);

  assert.ok(match, 'netlify.toml must declare a Content-Security-Policy header');
  assert.equal(match[1], CONTENT_SECURITY_POLICY);
  assert.equal(allowsWebAssembly(match[1]), true);
});

test('csp: built HTML carries the shared policy when dist exists', () => {
  const target = path.join(ROOT, 'dist', 'PDF To Go.html');
  if (!fs.existsSync(target)) return; // build not run yet

  const html = fs.readFileSync(target, 'utf8');
  const meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);

  assert.ok(meta, 'built HTML must contain a CSP meta tag');
  assert.equal(meta[1], CONTENT_SECURITY_POLICY);
});

test('csp: dist/_headers matches the shared policy when dist exists', () => {
  const target = path.join(ROOT, 'dist', '_headers');
  if (!fs.existsSync(target)) return;

  const content = fs.readFileSync(target, 'utf8');
  assert.ok(content.includes(CONTENT_SECURITY_POLICY), 'dist/_headers must include shared CSP');
  assert.equal(allowsWebAssembly(CONTENT_SECURITY_POLICY), true);
});

