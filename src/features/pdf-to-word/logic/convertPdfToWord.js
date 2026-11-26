import { t } from '../../../core/i18n.js';
import {
  Document, Packer, Paragraph, TextRun, ImageRun, FrameAnchorType, FrameWrap,
  HeightRule, LineRuleType, SectionType, HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom, TextWrappingType
} from 'docx';
import { OPS, Util } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { renderScale } from '../../../core/coordinates.js';

const textOperators = new Set([
  OPS.showText, OPS.showSpacedText, OPS.nextLineShowText, OPS.nextLineSetSpacingShowText
]);
const twips = (points) => Math.round(points * 20);

async function renderGraphics(page) {
  const original = page.getViewport({ scale: 1 });
  const { scale } = renderScale(1.5, 1, original.width, original.height);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  try {
    await page.render({
      canvasContext: canvas.getContext('2d'), viewport,
      operationsFilter: (index, list) => !textOperators.has(list.fnArray[index])
    }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error(t('tools.pdfToWord.imageFailed'));
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

function buildPositionedText(textContent, viewport, page, context) {
  const paragraphs = [];
  for (const item of textContent.items) {
    if (!item.str?.trim()) continue;
    const transform = Util.transform(viewport.transform, item.transform);
    const size = Math.hypot(transform[2], transform[3]);
    if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(item.width)) continue;
    const style = textContent.styles[item.fontName] || {};
    const sourceFont = page.commonObjs.get(item.fontName);
    const fontName = sourceFont.name || sourceFont.systemFontInfo?.baseFontName || '';
    const font = /courier|mono/i.test(fontName + style.fontFamily) ? 'Courier New'
      : /times|cambria|georgia/i.test(fontName) ? 'Times New Roman'
      : /(^|[^-])serif/i.test(style.fontFamily) ? 'Times New Roman' : 'Arial';
    const bold = Boolean(sourceFont.bold || /bold|black|heavy/i.test(fontName));
    const italics = Boolean(sourceFont.italic || /italic|oblique/i.test(fontName));
    let scale = 100;
    if (context) {
      context.font = `${italics ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px "${font}"`;
      const measured = context.measureText(item.str).width;
      if (measured > 0) scale = Math.max(1, Math.min(600, Math.round(item.width / measured * 100)));
    }
    const x = transform[4];
    const y = transform[5] - size * 0.9;
    if (![x, y].every(Number.isFinite)) continue;
    // ponytail: fixed PDF text spans preserve layout; edits do not reflow across frames.
    paragraphs.push(new Paragraph({
      frame: {
        type: 'absolute', position: { x: twips(x), y: twips(y) },
        width: twips(Math.max(item.width + 3, size)), height: twips(size * 1.3),
        anchor: { horizontal: FrameAnchorType.PAGE, vertical: FrameAnchorType.PAGE },
        wrap: FrameWrap.NONE, rule: HeightRule.EXACT
      },
      spacing: { before: 0, after: 0, line: twips(size), lineRule: LineRuleType.EXACT },
      snapToGrid: false,
      children: [new TextRun({ text: item.str, font, size: size * 2, bold, italics, scale })]
    }));
  }
  return paragraphs;
}

/**
 * Preserve PDF page geometry using editable text frames over a graphics-only background.
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {{includeImages?: boolean, onProgress?: (pct: number) => void}} options
 */
export async function convertPdfToWord(pdfBuffer, options = {}) {
  const { includeImages = true, onProgress = null } = options;
  if (!pdfBuffer || pdfBuffer.byteLength === 0) throw new Error(t('tools.pdfToWord.invalidPdf'));

  const doc = await loadPdfJsDocument(pdfBuffer, '', { fontExtraProperties: true });
  try {
    const sections = [];
    const context = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      await page.getOperatorList();
      const textContent = await page.getTextContent();
      const children = [];
      const images = [];
      if (includeImages && typeof document !== 'undefined') {
        const data = await renderGraphics(page);
        images.push(new ImageRun({
          type: 'png', data,
          transformation: { width: viewport.width * 4 / 3, height: viewport.height * 4 / 3 },
          floating: {
            horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
            verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
            behindDocument: true, allowOverlap: true,
            wrap: { type: TextWrappingType.NONE }
          }
        }));
      }
      children.push(new Paragraph({
        children: images, spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT }
      }));
      children.push(...buildPositionedText(textContent, viewport, page, context));
      sections.push({
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: twips(viewport.width), height: twips(viewport.height) },
            margin: { top: 0, bottom: 0, left: 0, right: 0, header: 0, footer: 0 }
          }
        },
        children
      });
      page.cleanup();
      onProgress?.(Math.round(p / doc.numPages * 90));
    }
    const wordDoc = new Document({ sections });
    const docxBytes = new Uint8Array(await Packer.toArrayBuffer(wordDoc));
    onProgress?.(100);
    return { docxBytes, pageCount: doc.numPages };
  } finally {
    await doc.destroy();
  }
}
