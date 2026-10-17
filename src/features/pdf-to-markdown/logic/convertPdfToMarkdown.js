import { t } from '../../../core/i18n.js';
import { loadPdfJsDocument, renderPageToCanvas, unwrapPdfProxy } from '../../../core/pdf.js';
import { createZipArchive } from '../../../core/zip.js';
import { extractLayoutItems } from './extractLayoutItems.js';
import { groupLines } from './groupLines.js';
import { linesToMarkdown } from './toMarkdown.js';

/**
 * Convert PDF buffer into Markdown text or a ZIP bundle with images
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {Object} [options]
 * @param {boolean} [options.separatePages=false]
 * @param {boolean} [options.includeImages=false]
 * @param {(pct: number) => void} [options.onProgress]
 * @returns {Promise<{ markdown: string, isZip: boolean, zipBlob: Blob | null, pageCount: number }>}
 */
export async function convertPdfToMarkdown(pdfBuffer, options = {}) {
  const { separatePages = false, includeImages = false, onProgress = null } = options;
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error(t('tools.pdfToMarkdown.invalidPdf'));
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const rawDoc = await loadPdfJsDocument(safeBytes);
  const doc = unwrapPdfProxy(rawDoc);
  const pageCount = doc.numPages;

  const pageMarkdowns = [];
  const imageFiles = [];

  for (let p = 1; p <= pageCount; p++) {
    const page = await doc.getPage(p);
    const textContent = await page.getTextContent();
    const items = extractLayoutItems(textContent.items || []);
    const lines = groupLines(items);
    let md = linesToMarkdown(lines);

    if (includeImages && typeof document !== 'undefined') {
      try {
        const { canvas } = await renderPageToCanvas(doc, p, 1.5);
        const imgBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
        canvas.width = 0;
        canvas.height = 0;
        if (imgBlob) {
          const imgBytes = new Uint8Array(await imgBlob.arrayBuffer());
          const imgName = `images/halaman-${p}.png`;
          imageFiles.push({ name: imgName, data: imgBytes });
          md += `\n\n![Halaman ${p}](${imgName})\n`;
        }
      } catch (err) {
        console.warn(`Gagal render gambar halaman ${p}:`, err);
      }
    }

    pageMarkdowns.push(md.trim());
    if (onProgress) onProgress(Math.round((p / pageCount) * 80));
  }

  const separator = separatePages ? '\n\n---\n\n' : '\n\n';
  const fullMarkdown = pageMarkdowns.filter(Boolean).join(separator);

  let zipBlob = null;
  if (includeImages && imageFiles.length > 0) {
    const mdBytes = new TextEncoder().encode(fullMarkdown);
    const filesToZip = [{ name: 'document.md', data: mdBytes }, ...imageFiles];
    zipBlob = await createZipArchive(filesToZip, (pct) => {
      if (onProgress) onProgress(80 + Math.round(pct * 0.2));
    });
  }

  if (onProgress) onProgress(100);

  return {
    markdown: fullMarkdown,
    isZip: Boolean(zipBlob),
    zipBlob,
    pageCount
  };
}
