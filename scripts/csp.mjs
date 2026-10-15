/**
 * csp.mjs - Single source of truth for the Content Security Policy.
 * Used by build.mjs (meta tag) and scripts/serve.mjs (HTTP header) so the two can never drift.
 */

export const CONTENT_SECURITY_POLICY =
  "default-src 'none'; " +
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval' blob: data:; " +
  "worker-src blob: data: 'self'; " +
  "child-src blob: 'self'; " +
  "style-src 'unsafe-inline'; " +
  "img-src data: blob:; " +
  "font-src data:; " +
  "connect-src blob: data:;";

/** True when the policy lets WebAssembly run (needed by OCR). */
export function allowsWebAssembly(policy = CONTENT_SECURITY_POLICY) {
  return /script-src[^;]*'wasm-unsafe-eval'/.test(policy);
}
