import { t } from '../../../core/i18n.js';
import * as fflate from 'fflate';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { parsePresentationDimensions, parseSlideElements, parseSlideRels } from './parseSlideXml.js';
import { hexToRgb } from '../../edit-pdf/logic/hexColor.js';
import { sanitizeTextForPdf } from '../../ocr/logic/sanitizeTextForPdf.js';

export async function convertPptxToPdf(pptxBuffer, options = {}) {
  const { onProgress = null } = options;
  if (!pptxBuffer || pptxBuffer.byteLength === 0) {
    throw new Error(t('tools.powerpointToPdf.invalidPptx'));
  }

  const safeBytes = new Uint8Array(
    pptxBuffer instanceof Uint8Array
      ? pptxBuffer.buffer.slice(pptxBuffer.byteOffset, pptxBuffer.byteOffset + pptxBuffer.byteLength)
      : pptxBuffer.slice(0)
  );

  const unzipped = fflate.unzipSync(safeBytes);
  const textDecoder = new TextDecoder('utf-8');

  const presXml = unzipped['ppt/presentation.xml'] ? textDecoder.decode(unzipped['ppt/presentation.xml']) : '';
  const { widthPt, heightPt } = parsePresentationDimensions(presXml);

  const slideKeys = Object.keys(unzipped)
    .filter((k) => /^ppt\/slides\/slide\d+\.xml$/i.test(k))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)[1], 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)[1], 10);
      return numA - numB;
    });

  if (slideKeys.length === 0) {
    throw new Error(t('tools.powerpointToPdf.noSlides'));
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const total = slideKeys.length;
  for (let i = 0; i < total; i++) {
    const slideKey = slideKeys[i];
    const slideXml = textDecoder.decode(unzipped[slideKey]);
    const relsKey = slideKey.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsXml = unzipped[relsKey] ? textDecoder.decode(unzipped[relsKey]) : '';
    const rels = parseSlideRels(relsXml);

    const elements = parseSlideElements(slideXml);
    const page = pdfDoc.addPage([widthPt, heightPt]);

    for (const el of elements) {
      if (el.type === 'shape' || el.fillColor) {
        page.drawRectangle({
          x: el.xPt,
          y: Math.max(0, heightPt - (el.yPt + el.heightPt)),
          width: el.widthPt,
          height: el.heightPt,
          color: el.fillColor ? hexToRgb(el.fillColor) : undefined
        });
      }

      if (el.type === 'picture' && el.relId && rels[el.relId] && unzipped[rels[el.relId]]) {
        try {
          const imgBytes = unzipped[rels[el.relId]];
          const isPng = rels[el.relId].toLowerCase().endsWith('.png');
          const img = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
          page.drawImage(img, {
            x: el.xPt,
            y: Math.max(0, heightPt - (el.yPt + el.heightPt)),
            width: el.widthPt,
            height: el.heightPt
          });
        } catch (err) {
          console.warn('Gagal menempelkan gambar slide:', err);
        }
      }

      if (el.type === 'text' && Array.isArray(el.textRuns)) {
        let currentYOffset = 0;
        for (const run of el.textRuns) {
          const size = Math.max(8, run.fontSize || 14);
          const yPos = Math.max(0, heightPt - (el.yPt + currentYOffset + size));
          page.drawText(sanitizeTextForPdf(run.text), {
            x: el.xPt,
            y: yPos,
            size,
            font: run.isBold ? fontBold : fontRegular,
            color: hexToRgb(run.color)
          });
          currentYOffset += size + 4;
        }
      }
    }

    if (onProgress) onProgress(Math.round(((i + 1) / total) * 90));
  }

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);

  return { pdfBytes, slideCount: total };
}
