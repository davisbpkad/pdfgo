/**
 * pdf.js - Unified PDF.js and pdf-lib Core Engine
 * Coordinates loading, rendering, thumbnail generation, and coordinate transforms.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { initPdfJsWorker } from './workers.js';

// Ensure worker is configured before any PDF.js operation
initPdfJsWorker();

/**
 * Load a PDF file or buffer with PDF.js
 * @param {ArrayBuffer | Uint8Array} data
 * @param {string} [password]
 * @returns {Promise<pdfjsLib.PDFDocumentProxy>}
 */
export async function loadPdfJsDocument(data, password = '') {
  initPdfJsWorker();
  const getDocument = pdfjsLib.getDocument || pdfjsLib.default?.getDocument;

  // Defensive clone: PDF.js transfers buffers to worker, detaching the caller's ArrayBuffer.
  // Slicing here ensures caller's buffer stays intact and reusable.
  let safeData;
  if (data instanceof Uint8Array) {
    safeData = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  } else if (data instanceof ArrayBuffer) {
    safeData = new Uint8Array(data.slice(0));
  } else if (ArrayBuffer.isView(data)) {
    safeData = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  } else {
    safeData = data;
  }

  const loadingTask = getDocument({
    data: safeData,
    password,
    cMapUrl: undefined,
    cMapPacked: true,
    standardFontDataUrl: undefined,
    // Mitigasi CVE-2024-4367: IKP disisipkan lewat glyph font compiler berbasis
    // eval. false = pakai interpreter glyph non-eval (juga menghapus kebutuhan
    // 'unsafe-eval' di CSP).
    isEvalSupported: false
  });
  return loadingTask.promise;
}

/**
 * Load a PDF with pdf-lib
 * @param {ArrayBuffer | Uint8Array} data
 * @param {string} [password]
 * @returns {Promise<PDFDocument>}
 */
export async function loadPdfLibDocument(data, password = '') {
  return PDFDocument.load(data, {
    ignoreEncryption: false,
    updateMetadata: false
  });
}

/**
 * Safely unwrap a Vue Reactive Proxy around a PDFDocumentProxy
 * (Prevents "Cannot read private member #r" when calling methods with private identifiers)
 * @param {any} doc
 * @returns {any}
 */
export function unwrapPdfProxy(doc) {
  if (!doc) return doc;
  return (typeof doc === 'object' && doc.__v_raw) ? doc.__v_raw : doc;
}

/**
 * Render a single page to an HTMLCanvasElement
 * @param {pdfjsLib.PDFDocumentProxy} pdfDoc
 * @param {number} pageNum (1-indexed)
 * @param {number} [scale=1.5]
 * @returns {Promise<{ canvas: HTMLCanvasElement, width: number, height: number }>}
 */
export async function renderPageToCanvas(pdfDoc, pageNum = 1, scale = 1.5) {
  const rawDoc = unwrapPdfProxy(pdfDoc);
  const page = await rawDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };

  await page.render(renderContext).promise;
  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    viewport
  };
}

/**
 * Generate a thumbnail Data URL for page 1
 * @param {pdfjsLib.PDFDocumentProxy | ArrayBuffer | Uint8Array} docOrData
 * @param {number} [targetWidth=180]
 * @returns {Promise<string>} Data URL
 */
export async function generateThumbnail(docOrData, targetWidth = 180) {
  try {
    const rawDoc = unwrapPdfProxy(docOrData);
    const doc = (rawDoc && typeof rawDoc.getPage === 'function')
      ? rawDoc
      : await loadPdfJsDocument(rawDoc);
    const page = await doc.getPage(1);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;
    const thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
    // Cleanup canvas
    canvas.width = 0;
    canvas.height = 0;
    return thumbUrl;
  } catch (err) {
    console.warn('Could not generate thumbnail:', err);
    return '';
  }
}

/**
 * Convert DOM coordinates (origin top-left) to PDF coordinates (origin bottom-left).
 * Handles page dimensions and rotational offsets.
 * @param {number} uiX
 * @param {number} uiY
 * @param {number} elementWidth
 * @param {number} elementHeight
 * @param {number} pageWidth
 * @param {number} pageHeight
 * @param {number} rotation (0, 90, 180, 270)
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function convertUiCoordsToPdfCoords(
  uiX,
  uiY,
  elementWidth,
  elementHeight,
  pageWidth,
  pageHeight,
  rotation = 0
) {
  // Normalize rotation to 0..360
  const rot = ((rotation % 360) + 360) % 360;

  let x = uiX;
  let y = pageHeight - uiY - elementHeight;
  let w = elementWidth;
  let h = elementHeight;

  if (rot === 90) {
    x = uiY;
    y = uiX;
  } else if (rot === 180) {
    x = pageWidth - uiX - elementWidth;
    y = uiY;
  } else if (rot === 270) {
    x = pageHeight - uiY - elementHeight;
    y = pageWidth - uiX - elementWidth;
  }

  return { x, y, width: w, height: h };
}
