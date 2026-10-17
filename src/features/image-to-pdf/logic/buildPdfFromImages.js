import { t } from '../../../core/i18n.js';
import { PDFDocument, PageSizes } from 'pdf-lib';

/**
 * Generate a PDF document from an array of images
 * @param {Array<{ buffer: ArrayBuffer, type: string, rotation?: number }>} imageItems
 * @param {{ pageSize: 'A4'|'LETTER'|'FIT', orientation: 'auto'|'portrait'|'landscape', margin: number, fitMode: 'contain'|'cover' }} options
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function buildPdfFromImages(imageItems, options, onProgress = null) {
  if (!imageItems || imageItems.length === 0) {
    throw new Error(t('tools.imageToPdf.needImage'));
  }

  const { pageSize = 'A4', orientation = 'auto', margin = 20, fitMode = 'contain' } = options || {};
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imageItems.length; i++) {
    const item = imageItems[i];
    let embeddedImg;

    if (item.type.includes('jpeg') || item.type.includes('jpg')) {
      embeddedImg = await pdfDoc.embedJpg(item.buffer);
    } else {
      embeddedImg = await pdfDoc.embedPng(item.buffer);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let pWidth, pHeight;
    if (pageSize === 'FIT') {
      pWidth = imgWidth + margin * 2;
      pHeight = imgHeight + margin * 2;
    } else {
      const standard = pageSize === 'LETTER' ? PageSizes.Letter : PageSizes.A4;
      let isLandscape = false;
      if (orientation === 'landscape') isLandscape = true;
      else if (orientation === 'portrait') isLandscape = false;
      else isLandscape = imgWidth > imgHeight;

      pWidth = isLandscape ? standard[1] : standard[0];
      pHeight = isLandscape ? standard[0] : standard[1];
    }

    const page = pdfDoc.addPage([pWidth, pHeight]);

    const availWidth = Math.max(1, pWidth - margin * 2);
    const availHeight = Math.max(1, pHeight - margin * 2);

    let scale = 1;
    if (fitMode === 'cover') {
      scale = Math.max(availWidth / imgWidth, availHeight / imgHeight);
    } else {
      scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
    }

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const drawX = margin + (availWidth - drawWidth) / 2;
    const drawY = margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImg, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / imageItems.length) * 100));
    }
  }

  return await pdfDoc.save();
}
