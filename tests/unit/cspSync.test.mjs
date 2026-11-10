import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { CONTENT_SECURITY_POLICY, allowsWebAssembly, rejectsEval } from '../../scripts/csp.mjs';

test('csp: denies inline and network scripts while keeping WASM workers', () => {
  const script = CONTENT_SECURITY_POLICY.match(/script-src ([^;]+)/)[1];
  assert.doesNotMatch(script, /'unsafe-inline'|'self'|data:/);
  assert.match(CONTENT_SECURITY_POLICY, /base-uri 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /form-action 'none'/);
  assert.equal(allowsWebAssembly(), true);
  assert.equal(rejectsEval(), true);
});

test('csp: Netlify uses build-generated hashes, not a static permissive policy', () => {
  const toml = fs.readFileSync('netlify.toml', 'utf8');
  assert.doesNotMatch(toml, /Content-Security-Policy\s*=/);
});

test('csp: every built variant authorizes its exact inline scripts', () => {
  const headers = fs.readFileSync('dist/_headers', 'utf8');
  assert.match(headers, /frame-ancestors 'none'/);
  for (const file of ['index.html', 'PDF To Go.html', 'PDF To Go Lite.html']) {
    const html = fs.readFileSync(`dist/${file}`, 'utf8');
    const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
    assert.doesNotMatch(policy.match(/script-src ([^;]+)/)[1], /'unsafe-inline'|'self'|data:/);
    for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      const hash = createHash('sha256').update(match[1]).digest('base64');
      assert.ok(policy.includes(`'sha256-${hash}'`), `${file}: script hash mismatch`);
      assert.ok(headers.includes(`'sha256-${hash}'`), `${file}: header hash missing`);
    }
  }
});
