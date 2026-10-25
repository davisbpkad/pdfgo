/**
 * workers.js - Worker Factory via Blob URLs
 * Compliant with strict file:// origin rules and CSP policies.
 * Zero external script loading.
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { decompressBase64 } from './assets.js';

let pdfWorkerBlobUrl = null;

/**
 * Instantiate a Web Worker directly from a JS code string via Blob URL
 * @param {string} codeString
 * @returns {Worker}
 */
export function createBlobWorker(codeString) {
  const blob = new Blob([codeString], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);

  // Store url on worker instance for cleanup
  worker.__blobUrl = url;
  return worker;
}

/**
 * Terminate a Blob-backed worker and revoke its Blob URL
 * @param {Worker} worker
 */
export function terminateBlobWorker(worker) {
  if (!worker) return;
  worker.terminate();
  if (worker.__blobUrl) {
    URL.revokeObjectURL(worker.__blobUrl);
    worker.__blobUrl = null;
  }
}

/**
 * Initialize PDF.js worker from embedded Base64 data
 */
export function initPdfJsWorker() {
  if (pdfWorkerBlobUrl) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerBlobUrl;
    return pdfWorkerBlobUrl;
  }

  if (typeof window !== 'undefined' && window.__PDF_WORKER_BASE64__) {
    try {
      const decompressedBytes = decompressBase64(window.__PDF_WORKER_BASE64__);
      const blob = new Blob([decompressedBytes], { type: 'application/javascript' });
      pdfWorkerBlobUrl = URL.createObjectURL(blob);
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerBlobUrl;
    } catch (e) {
      console.error('Failed to initialize embedded PDF.js worker:', e);
    }
  }

  return pdfWorkerBlobUrl;
}

let tesseractWorkerBlobUrl = null;

/**
 * Initialize or get Tesseract.js Worker Blob URL from embedded Base64 data
 * @returns {string | null}
 */
export function getTesseractWorkerBlobUrl() {
  if (tesseractWorkerBlobUrl) {
    return tesseractWorkerBlobUrl;
  }

  if (typeof window !== 'undefined' && window.__TESSERACT_WORKER_BASE64__) {
    try {
      const decompressedBytes = decompressBase64(window.__TESSERACT_WORKER_BASE64__);
      const blob = new Blob([decompressedBytes], { type: 'application/javascript' });
      tesseractWorkerBlobUrl = URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed to initialize embedded Tesseract worker:', e);
    }
  }

  return tesseractWorkerBlobUrl;
}

/**
 * Revoke and clean up Tesseract worker blob URL
 */
export function revokeTesseractWorkerBlobUrl() {
  if (tesseractWorkerBlobUrl) {
    URL.revokeObjectURL(tesseractWorkerBlobUrl);
    tesseractWorkerBlobUrl = null;
  }
}

