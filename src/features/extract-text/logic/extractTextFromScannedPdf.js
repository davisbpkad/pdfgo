import { getOcrWorker } from '../../ocr/logic/ocrWorkerManager.js';
import { unwrapPdfProxy } from '../../../core/pdf.js';

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
