import { t } from '../../../core/i18n.js';
import { Document, Packer, Paragraph, PageBreak, ImageRun } from 'docx';
import { loadPdfJsDocument, renderPageToCanvas, unwrapPdfProxy } from '../../../core/pdf.js';
import { extractLayoutItems } from '../../pdf-to-markdown/logic/extractLayoutItems.js';
import { groupLines } from '../../pdf-to-markdown/logic/groupLines.js';
import { buildParagraphs } from './buildParagraphs.js';

/**
 * Convert PDF document buffer into a DOCX Word document buffer
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {Object} [options]
 * @param {boolean} [options.includeImages=false]
 * @param {(pct: number) => void} [options.onProgress]
 * @returns {Promise<{ docxBytes: Uint8Array, pageCount: number }>}
 */
export async function convertPdfToWord(pdfBuffer, options = {}) {
  const { includeImages = false, onProgress = null } = options;
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error(t('tools.pdfToWord.invalidPdf'));
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const rawDoc = await loadPdfJsDocument(safeBytes);
  const doc = unwrapPdfProxy(rawDoc);
  const pageCount = doc.numPages;

  const docChildren = [];

  for (let p = 1; p <= pageCount; p++) {
    const page = await doc.getPage(p);
    const textContent = await page.getTextContent();
    const items = extractLayoutItems(textContent.items || []);
    const lines = groupLines(items);
    const pageElements = buildParagraphs(lines);

    docChildren.push(...pageElements);

    // Optional visual page snapshot embedding
    if (includeImages && typeof document !== 'undefined') {
      try {
        const { canvas, width, height } = await renderPageToCanvas(doc, p, 1.2);
        const imgBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
        canvas.width = 0;
        canvas.height = 0;
        if (imgBlob) {
          const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
          const targetW = Math.min(500, width);
          const targetH = Math.round((height / width) * targetW);
          docChildren.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: { width: targetW, height: targetH }
                })
              ],
              spacing: { before: 120, after: 120 }
            })
          );
        }
      } catch (err) {
        console.warn(`Gagal render gambar visual halaman ${p}:`, err);
      }
    }

    if (p < pageCount) {
      docChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    if (onProgress) onProgress(Math.round((p / pageCount) * 85));
  }

  const wordDoc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: docChildren
      }
    ]
  });

  const arrayBuffer = await Packer.toArrayBuffer(wordDoc);
  const docxBytes = new Uint8Array(arrayBuffer);

  if (onProgress) onProgress(100);

  return {
    docxBytes,
    pageCount
  };
}
