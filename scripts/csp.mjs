/**
 * csp.mjs - Single source of truth for the Content Security Policy.
 * Used by build.mjs (meta tag) and scripts/serve.mjs (HTTP header) so the two can never drift.
 */

export const CONTENT_SECURITY_POLICY =
  "default-src 'none'; " +
  "script-src 'wasm-unsafe-eval' blob:; " +
  "worker-src blob: data: 'self'; " +
  "child-src blob: 'self'; " +
  "style-src 'unsafe-inline'; " +
  "img-src data: blob:; " +
  "font-src data:; " +
  "connect-src blob: data:; " +
  "base-uri 'none'; form-action 'none';";

/** Authorize only the built inline scripts; framing restrictions belong in HTTP headers. */
export function buildContentSecurityPolicy(hashes = [], httpHeader = false) {
  return CONTENT_SECURITY_POLICY.replace('script-src ', `script-src ${hashes.map(hash => `'sha256-${hash}'`).join(' ')} `) +
    (httpHeader ? " frame-ancestors 'none';" : '');
}

/** True when the policy lets WebAssembly run (needed by OCR). */
export function allowsWebAssembly(policy = CONTENT_SECURITY_POLICY) {
  return /script-src[^;]*'wasm-unsafe-eval'/.test(policy);
}

/** True when stand-alone 'unsafe-eval' is gone but 'wasm-unsafe-eval' stays. */
export function rejectsEval(policy = CONTENT_SECURITY_POLICY) {
  return allowsWebAssembly(policy) && !/(^|[^-+-])'unsafe-eval'/.test(policy.replaceAll('wasm-unsafe-eval', 'WASM_EVAL'));
}
