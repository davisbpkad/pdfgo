/**
 * wasmCheck.js - WebAssembly capability preflight
 * Detects CSP / browser conditions that would block WASM (used by OCR) BEFORE a long job starts.
 */

const MINIMAL_WASM = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

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
 * Check whether the current document can compile WebAssembly.
 * @returns {Promise<{ ok: boolean, reason: string, message: string }>}
 */
export async function checkWasmSupport() {
  if (typeof WebAssembly === 'undefined') {
    return { ok: false, reason: 'unsupported', message: 'WebAssembly tidak tersedia di browser ini.' };
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
 * Check WebAssembly support INSIDE a Blob worker, which is the environment OCR actually uses.
 * @param {number} [timeoutMs=4000]
 * @returns {Promise<{ ok: boolean, reason: string, message: string }>}
 */
export function checkWorkerWasmSupport(timeoutMs = 4000) {
  if (typeof Worker === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    return Promise.resolve({ ok: false, reason: 'unsupported', message: 'Web Worker tidak tersedia di browser ini.' });
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

    const timer = setTimeout(() => finish({ ok: false, reason: 'timeout', message: 'Pemeriksaan WebAssembly melebihi batas waktu.' }), timeoutMs);

    try {
      url = URL.createObjectURL(new Blob([WORKER_PROBE_CODE], { type: 'application/javascript' }));
      worker = new Worker(url);
      worker.onmessage = (e) => {
        clearTimeout(timer);
        const ok = !!(e.data && e.data.ok);
        finish(ok ? { ok: true, reason: 'ok', message: '' } : { ok: false, reason: classifyWasmError(e.data && e.data.reason), message: String((e.data && e.data.reason) || '') });
      };
      worker.onerror = (e) => {
        clearTimeout(timer);
        finish({ ok: false, reason: classifyWasmError(e && e.message) === 'unknown' ? 'worker' : classifyWasmError(e && e.message), message: String((e && e.message) || 'Gagal menjalankan worker.') });
      };
      worker.postMessage('probe');
    } catch (err) {
      clearTimeout(timer);
      finish({ ok: false, reason: 'worker', message: String((err && err.message) || err) });
    }
  });
}

/**
 * Read the build stamp embedded by build.mjs (used to spot stale HTML files).
 * @returns {string}
 */
export function getBuildStamp() {
  if (typeof window === 'undefined') return 'unknown';
  return window.__PDFGO_BUILD__ || 'unknown';
}
