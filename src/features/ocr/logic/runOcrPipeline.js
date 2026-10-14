import { getOcrWorker } from './ocrWorkerManager.js';
import { formatOcrText } from './formatOcrText.js';
import { buildSearchablePdf } from './buildSearchablePdf.js';

/**
 * Execute OCR pipeline across targeted PDF pages
 * @param {object} pdfDocProxy
 * @param {number[]} targetPages 0-indexed
 * @param {string} selectedLang
 * @param {number} targetDpi 150 or 300
 * @param {Uint8Array} originalPdfBytes
 * @param {Function} [onProgress] (current, total, pct)
 * @param {{ value: boolean }} [cancelRef]
 * @returns {Promise<{ textReport: object, searchablePdfBytes: Uint8Array }>}
 */
export async function runOcrPipeline(pdfDocProxy, targetPages, selectedLang, targetDpi, originalPdfBytes, onProgress, cancelRef) {
  const worker = await getOcrWorker(selectedLang);
  const pageResults = [];
  const scale = targetDpi === 300 ? 4.16 : 2.08;

  for (let i = 0; i < targetPages.length; i++) {
    if (cancelRef?.value) break;

    const pageIndex = targetPages[i];
    if (onProgress) onProgress(i, targetPages.length, Math.round((i / targetPages.length) * 100));

    const page = await pdfDocProxy.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const ocrRes = await worker.recognize(canvas);

    pageResults.push({
      pageIndex,
      canvasWidth: viewport.width,
      canvasHeight: viewport.height,
      text: ocrRes.data.text || '',
      words: ocrRes.data.words || []
    });

    // Clean up canvas memory immediately
    canvas.width = 0;
    canvas.height = 0;

    if (onProgress) onProgress(i + 1, targetPages.length, Math.round(((i + 1) / targetPages.length) * 100));
  }

  if (cancelRef?.value) {
    throw new Error('OCR dibatalkan oleh pengguna.');
  }

  const textReport = formatOcrText(pageResults);
  const searchablePdfBytes = await buildSearchablePdf(originalPdfBytes, pageResults);

  return { textReport, searchablePdfBytes };
}
