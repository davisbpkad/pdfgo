import { unwrapPdfProxy } from '../../../core/pdf.js';

/**
 * Render selected PDF pages to image blobs
 * @param {object} pdfDocProxy
 * @param {{ format: 'png'|'jpeg', scale: number, quality: number, pageNumbers: number[], baseName: string }} options
 * @param {Function} [onProgress]
 * @returns {Promise<Array<{ name: string, data: Blob }>>}
 */
export async function convertPdfToImages(pdfDocProxy, options, onProgress = null) {
  const rawDoc = unwrapPdfProxy(pdfDocProxy);
  const {
    format = 'png',
    scale = 2.0,
    quality = 0.85,
    pageNumbers = [],
    baseName = 'halaman'
  } = options || {};

  const numPages = rawDoc.numPages;
  const targets = (pageNumbers.length > 0 ? pageNumbers : Array.from({ length: numPages }, (_, i) => i + 1))
    .filter(p => p >= 1 && p <= numPages);

  const images = [];
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';

  for (let idx = 0; idx < targets.length; idx++) {
    const pageNum = targets[idx];
    const page = await rawDoc.getPage(pageNum);

    let currentScale = scale;
    let viewport = page.getViewport({ scale: currentScale });

    const maxPixels = 16000000;
    if (viewport.width * viewport.height > maxPixels) {
      const downscaleFactor = Math.sqrt(maxPixels / (viewport.width * viewport.height));
      currentScale *= downscaleFactor;
      viewport = page.getViewport({ scale: currentScale });
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));

    canvas.width = 0;
    canvas.height = 0;

    const formattedIndex = String(pageNum).padStart(3, '0');
    images.push({
      name: `${baseName}-${formattedIndex}.${ext}`,
      data: blob
    });

    if (onProgress) {
      onProgress(Math.round(((idx + 1) / targets.length) * 100), idx + 1, targets.length);
    }
  }

  return images;
}
