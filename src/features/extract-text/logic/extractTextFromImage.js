import { getOcrWorker } from '../../ocr/logic/ocrWorkerManager.js';
import { unwrapPdfProxy } from '../../../core/pdf.js';

/**
 * Convert an Image File/Blob to an HTMLCanvasElement
 * @param {Blob | File} fileOrBlob
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function imageFileToCanvas(fileOrBlob) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering is not supported in this environment.');
  }

  // Fast path: createImageBitmap
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(fileOrBlob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return canvas;
    } catch (_) {
      // Fallback below
    }
  }

  // Fallback: HTMLImageElement via Object URL
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat file gambar. Format tidak didukung atau file rusak.'));
    };
    img.src = url;
  });
}

/**
 * Extract text from an image (File, Blob, or Canvas) using local OCR
 * @param {File | Blob | HTMLCanvasElement} imageSource
 * @param {object} [options]
 * @param {string} [options.lang='ind']
 * @param {Function} [options.onProgress]
 * @param {{ value: boolean }} [options.cancelRef]
 * @returns {Promise<{ text: string, words: any[], confidence: number }>}
 */
export async function extractTextFromImage(imageSource, options = {}) {
  const { lang = 'ind', onProgress = null, cancelRef = null } = options;

  if (cancelRef?.value) {
    throw new Error('Ekstraksi teks dibatalkan.');
  }

  let canvas = null;
  let isCanvasCreated = false;

  if (typeof HTMLCanvasElement !== 'undefined' && imageSource instanceof HTMLCanvasElement) {
    canvas = imageSource;
  } else {
    canvas = await imageFileToCanvas(imageSource);
    isCanvasCreated = true;
  }

  try {
    const worker = await getOcrWorker(lang, (m) => {
      if (onProgress && m && typeof m.progress === 'number') {
        onProgress(Math.round(m.progress * 100));
      }
    });

    if (cancelRef?.value) {
      throw new Error('Ekstraksi teks dibatalkan.');
    }

    const ocrRes = await worker.recognize(canvas);

    if (cancelRef?.value) {
      throw new Error('Ekstraksi teks dibatalkan.');
    }

    return {
      text: ocrRes.data?.text || '',
      words: ocrRes.data?.words || [],
      confidence: Math.round(ocrRes.data?.confidence || 0)
    };
  } finally {
    if (isCanvasCreated && canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

/**
 * Extract text from scanned/image pages of a PDF using local OCR
 * @param {object} pdfDocProxy PDF.js DocumentProxy
 * @param {object} [options]
 * @param {string} [options.lang='ind']
 * @param {number} [options.targetDpi=200]
 * @param {number[]} [options.pages=null] 0-indexed page list; defaults to all pages
 * @param {boolean} [options.includeSeparators=true]
 * @param {Function} [options.onProgress] (current, total, pct)
 * @param {{ value: boolean }} [options.cancelRef]
 * @returns {Promise<{ fullText: string, pageTexts: string[], wordCount: number, charCount: number, isScanned: boolean }>}
 */
export async function extractTextFromScannedPdf(pdfDocProxy, options = {}) {
  const {
    lang = 'ind',
    targetDpi = 200,
    pages = null,
    includeSeparators = true,
    onProgress = null,
    cancelRef = null
  } = options;

  const rawDoc = unwrapPdfProxy(pdfDocProxy);
  const totalPages = rawDoc.numPages;
  const targetIndices = Array.isArray(pages) && pages.length > 0
    ? pages
    : Array.from({ length: totalPages }, (_, i) => i);

  const worker = await getOcrWorker(lang);
  const scale = targetDpi === 300 ? 4.16 : 2.08;
  const pageTexts = [];

  for (let idx = 0; idx < targetIndices.length; idx++) {
    if (cancelRef?.value) {
      throw new Error('Ekstraksi teks dibatalkan.');
    }

    const pageIndex = targetIndices[idx];
    if (onProgress) {
      onProgress(idx + 1, targetIndices.length, Math.round((idx / targetIndices.length) * 100));
    }

    const page = await rawDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    await page.render({ canvasContext: ctx, viewport }).promise;

    const ocrRes = await worker.recognize(canvas);

    canvas.width = 0;
    canvas.height = 0;

    const pageStr = (ocrRes.data?.text || '').trim();
    pageTexts.push(pageStr);

    if (onProgress) {
      onProgress(idx + 1, targetIndices.length, Math.round(((idx + 1) / targetIndices.length) * 100));
    }
  }

  if (cancelRef?.value) {
    throw new Error('Ekstraksi teks dibatalkan.');
  }

  let fullText = '';
  if (includeSeparators) {
    fullText = pageTexts
      .map((txt, i) => `--- Halaman ${targetIndices[i] + 1} ---\n${txt}`)
      .join('\n\n');
  } else {
    fullText = pageTexts.join('\n\n');
  }

  const cleanWords = fullText.trim().split(/\s+/).filter(Boolean);

  return {
    fullText,
    pageTexts,
    wordCount: cleanWords.length,
    charCount: fullText.length,
    isScanned: false
  };
}
