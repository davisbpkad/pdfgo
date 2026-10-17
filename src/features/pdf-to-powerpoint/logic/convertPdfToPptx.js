import { t } from '../../../core/i18n.js';
import pptxgen from 'pptxgenjs';
import { loadPdfJsDocument, renderPageToCanvas, unwrapPdfProxy } from '../../../core/pdf.js';
import { ptToInches } from './ptToEmu.js';
import { buildSlidePlan } from './buildSlidePlan.js';

/**
 * Convert PDF pages to PowerPoint (PPTX) presentation slides
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {Object} [options]
 * @param {string | Array<number>} [options.pageSelection='all']
 * @param {'draft' | 'normal' | 'high'} [options.quality='normal']
 * @param {(pct: number) => void} [options.onProgress]
 * @returns {Promise<{ pptxBytes: Uint8Array, slideCount: number }>}
 */
export async function convertPdfToPptx(pdfBuffer, options = {}) {
  const { pageSelection = 'all', quality = 'normal', onProgress = null } = options;
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error(t('tools.pdfToPowerpoint.invalidPdf'));
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const rawDoc = await loadPdfJsDocument(safeBytes);
  const doc = unwrapPdfProxy(rawDoc);
  const totalPages = doc.numPages;

  const plan = buildSlidePlan(totalPages, { pageSelection, quality });
  const { selectedPages, scale } = plan;

  const PptxGen = pptxgen.default || pptxgen;
  const pres = new PptxGen();

  // Determine slide layout dimensions in inches from first selected page
  const firstPage = await doc.getPage(selectedPages[0]);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  const layoutW = ptToInches(firstViewport.width);
  const layoutH = ptToInches(firstViewport.height);

  pres.defineLayout({
    name: 'PDF_PAGE_LAYOUT',
    width: Math.max(1, layoutW),
    height: Math.max(1, layoutH)
  });
  pres.layout = 'PDF_PAGE_LAYOUT';

  const total = selectedPages.length;
  for (let i = 0; i < total; i++) {
    const pageNum = selectedPages[i];
    const { canvas, width, height } = await renderPageToCanvas(doc, pageNum, scale);
    const dataUrl = canvas.toDataURL('image/png');

    canvas.width = 0;
    canvas.height = 0;

    const slide = pres.addSlide();
    const pageRatio = width / height;
    const slideRatio = layoutW / layoutH;

    let imgW, imgH, imgX, imgY;
    if (Math.abs(pageRatio - slideRatio) < 0.02) {
      imgX = 0;
      imgY = 0;
      imgW = layoutW;
      imgH = layoutH;
    } else if (pageRatio > slideRatio) {
      imgW = layoutW;
      imgH = layoutW / pageRatio;
      imgX = 0;
      imgY = (layoutH - imgH) / 2;
    } else {
      imgH = layoutH;
      imgW = layoutH * pageRatio;
      imgX = (layoutW - imgW) / 2;
      imgY = 0;
    }

    slide.addImage({
      data: dataUrl,
      x: imgX,
      y: imgY,
      w: imgW,
      h: imgH
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 90));
    }
  }

  const output = await pres.write({ outputType: 'uint8array' });
  const pptxBytes = output instanceof Uint8Array ? output : new Uint8Array(output);

  if (onProgress) {
    onProgress(100);
  }

  return {
    pptxBytes,
    slideCount: total
  };
}
