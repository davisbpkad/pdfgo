import { t } from './i18n.js';
/**
 * wasmCheck.js - WebAssembly capability preflight and diagnosis
 * OCR runs WASM inside a Blob worker. A stale local server or an old deploy can keep sending an
 * outdated CSP header, which blocks WASM even when the HTML file itself allows it.
 */

const MINIMAL_WASM = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
const POLICY_ALLOWS_WASM = /script-src[^;]*'wasm-unsafe-eval'/i;

/**
 * Classify a WASM failure into a stable reason code.
 * @param {unknown} err
 * @returns {'csp'|'compile'|'worker'|'timeout'|'unknown'}
 */
export function classifyWasmError(err) {
  const msg = String((err && err.message) || err || '');
  if (/Content Security Policy|unsafe-eval|wasm-unsafe-eval/i.test(msg)) return 'csp';
  if (/WebAssembly|CompileError|instantiat|Module compile/i.test(msg)) return 'compile';
  return 'unknown';
}

/**
 * Decide why WASM is unavailable, based on the document check, the worker check, and the file's own CSP.
 * @param {{ documentOk: boolean, workerOk: boolean, metaAllowsWasm: boolean }} input
 * @returns {'ok'|'host-csp'|'stale-file'|'worker-csp'}
 */
export function classifyWasmBlock({ documentOk, workerOk, metaAllowsWasm }) {
  if (documentOk && workerOk) return 'ok';
  if (!documentOk) return metaAllowsWasm ? 'host-csp' : 'stale-file';
  return 'worker-csp';
}

/**
 * Read the enforced directive out of a browser CSP violation message.
 * @param {string} message
 * @returns {string}
 */
export function extractEnforcedPolicy(message) {
  const match = String(message || '').match(/Policy directive:\s*"([^"]+)"/i);
  return match ? match[1] : '';
}

/** The CSP declared inside this HTML file (meta tag), if any. */
export function getMetaPolicy() {
  if (typeof document === 'undefined') return '';
  const el = document.querySelector('meta[http-equiv="Content-Security-Policy" i]');
  return el ? el.getAttribute('content') || '' : '';
}

/** Where this file is being served from. */
export function getServedFrom() {
  if (typeof window === 'undefined' || !window.location) return 'unknown';
  const { protocol, host } = window.location;
  return host ? `${protocol}//${host}` : protocol;
}

/**
 * Compile WebAssembly in the document context.
 * @returns {Promise<{ ok: boolean, reason: string, message: string }>}
 */
export async function checkWasmSupport() {
  if (typeof WebAssembly === 'undefined') {
    return { ok: false, reason: 'unsupported', message: t('common.wasmUnavailable') };
  }
  try {
    await WebAssembly.compile(MINIMAL_WASM);
    return { ok: true, reason: 'ok', message: '' };
  } catch (err) {
    return { ok: false, reason: classifyWasmError(err), message: String((err && err.message) || err) };
  }
}

const WORKER_PROBE_CODE = `
self.onmessage = async () => {
  try {
    await WebAssembly.compile(new Uint8Array([0,97,115,109,1,0,0,0]));
    self.postMessage({ ok: true });
  } catch (e) {
    self.postMessage({ ok: false, reason: String((e && e.message) || e) });
  }
};
`;

/**
 * Compile WebAssembly inside a Blob worker, the environment OCR actually uses.
 * @param {number} [timeoutMs=4000]
 * @returns {Promise<{ ok: boolean, reason: string, message: string }>}
 */
export function checkWorkerWasmSupport(timeoutMs = 4000) {
  if (typeof Worker === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    return Promise.resolve({ ok: false, reason: 'unsupported', message: t('common.workerUnavailable') });
  }

  return new Promise((resolve) => {
    let settled = false;
    let worker = null;
    let url = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      try { worker && worker.terminate(); } catch (_) {}
      try { url && URL.revokeObjectURL(url); } catch (_) {}
      resolve(result);
    };

    const timer = setTimeout(
      () => finish({ ok: false, reason: 'timeout', message: 'Pemeriksaan WebAssembly melebihi batas waktu.' }),
      timeoutMs
    );

    try {
      url = URL.createObjectURL(new Blob([WORKER_PROBE_CODE], { type: 'application/javascript' }));
      worker = new Worker(url);
      worker.onmessage = (e) => {
        clearTimeout(timer);
        const data = e.data || {};
        const reason = data.ok ? 'ok' : classifyWasmError(data.reason);
        finish({ ok: !!data.ok, reason, message: String(data.reason || '') });
      };
      worker.onerror = (e) => {
        clearTimeout(timer);
        const message = String((e && e.message) || t('common.workerFailed'));
        finish({ ok: false, reason: classifyWasmError(message) === 'unknown' ? 'worker' : classifyWasmError(message), message });
      };
      worker.postMessage('probe');
    } catch (err) {
      clearTimeout(timer);
      finish({ ok: false, reason: 'worker', message: String((err && err.message) || err) });
    }
  });
}

/**
 * Full preflight used by the OCR tool: document check, worker check, and the reason behind a block.
 * @returns {Promise<{ ok: boolean, reason: string, message: string, metaAllowsWasm: boolean, enforcedPolicy: string, servedFrom: string }>}
 */
export async function diagnoseWasm() {
  const metaPolicy = getMetaPolicy();
  const metaAllowsWasm = POLICY_ALLOWS_WASM.test(metaPolicy);
  const servedFrom = getServedFrom();

  const documentResult = await checkWasmSupport();
  const workerResult = documentResult.ok
    ? await checkWorkerWasmSupport()
    : { ok: false, message: documentResult.message };

  const reason = classifyWasmBlock({
    documentOk: documentResult.ok,
    workerOk: workerResult.ok,
    metaAllowsWasm
  });

  const message = documentResult.ok ? workerResult.message : documentResult.message;

  return {
    ok: reason === 'ok',
    reason,
    message,
    metaAllowsWasm,
    enforcedPolicy: extractEnforcedPolicy(message),
    servedFrom
  };
}

/** Build stamp embedded by build.mjs, used to spot stale HTML files. */
export function getBuildStamp() {
  if (typeof window === 'undefined') return 'unknown';
  return window.__PDFGO_BUILD__ || 'unknown';
}
