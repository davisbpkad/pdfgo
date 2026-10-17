import { t } from '../../../core/i18n.js';
import { buildPdfFromImages } from '../../image-to-pdf/logic/buildPdfFromImages.js';
import { processScanPage } from './processScanPage.js';

/**
 * Process all scanned page items and compile into a PDF document
 * @param {Array<object>} pages
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function buildScannedPdf(pages, onProgress = null) {
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(t('tools.scanToPdf.noPages'));
  }

  const processedItems = [];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const img = new Image();
    img.src = p.url;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const processed = await processScanPage(img, {
      cropBox: p.cropBox,
      rotation: p.rotation,
      filter: p.filter
    });
    processedItems.push(processed);

    if (onProgress) {
      onProgress(10 + Math.round(((i + 1) / pages.length) * 70));
    }
  }

  return await buildPdfFromImages(processedItems, {
    pageSize: 'A4',
    orientation: 'auto',
    margin: 15,
    fitMode: 'contain'
  });
}
