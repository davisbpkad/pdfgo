import { t } from '../../../core/i18n.js';
import { createWorker } from 'tesseract.js';
import { getTesseractWorkerBlobUrl } from '../../../core/workers.js';
import { ensureBuiltinModelsLoaded } from '../../../core/assets.js';

let activeWorker = null;
let activeWorkerLang = null;

/**
 * Get or initialize Tesseract worker for the chosen language
 * @param {string} lang
 * @param {Function} [onProgress]
 * @returns {Promise<any>}
 */
export async function getOcrWorker(lang, onProgress) {
  if (activeWorker && activeWorkerLang === lang) {
    return activeWorker;
  }

  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch (_) {}
    activeWorker = null;
    activeWorkerLang = null;
  }

  await ensureBuiltinModelsLoaded();

  const workerBlobUrl = getTesseractWorkerBlobUrl();
  const options = {
    gzip: true,
    logger: (m) => {
      if (onProgress) onProgress(m);
    }
  };

  if (workerBlobUrl) {
    options.workerPath = workerBlobUrl;
    options.workerBlobURL = false; // Directly instantiate worker from blob URL
  }

  try {
    const worker = await createWorker(lang, 1, options);
    activeWorker = worker;
    activeWorkerLang = lang;
    return worker;
  } catch (err) {
    activeWorker = null;
    activeWorkerLang = null;
    const msg = String(err?.message || err || '');
    if (msg.includes('Content Security') || msg.includes('unsafe-eval') || msg.includes('WebAssembly')) {
      throw new Error(t('tools.ocr.cspWarning'));
    }
    throw err;
  }
}

/**
 * Terminate active OCR worker
 */
export async function terminateOcrWorker() {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch (_) {}
    activeWorker = null;
    activeWorkerLang = null;
  }
}
