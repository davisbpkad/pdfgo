import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export function createMarkdownExport(text, originalFileName = 'dokumen') {
  const safeName = originalFileName.replace(/\.[^/.]+$/, '');
  const encoder = new TextEncoder();
  const header = `# Ringkasan AI: ${safeName}\n\n`;
  return {
    content: encoder.encode(header + (text || '')),
    fileName: `${safeName}-ringkasan-ai.md`,
    mime: 'text/markdown;charset=utf-8'
  };
}

export function createTextExport(text, originalFileName = 'dokumen') {
  const safeName = originalFileName.replace(/\.[^/.]+$/, '');
  const encoder = new TextEncoder();
  return {
    content: encoder.encode(text || ''),
    fileName: `${safeName}-ringkasan-ai.txt`,
    mime: 'text/plain;charset=utf-8'
  };
}

export async function createPdfExport(text, originalFileName = 'dokumen') {
  const safeName = originalFileName.replace(/\.[^/.]+$/, '');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  const fontSize = 10;
  const lineHeight = 14;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Title
  page.drawText(`Ringkasan AI: ${safeName}`, {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0)
  });
  y -= lineHeight * 2;

  const rawLines = (text || '').split('\n');
  for (const rawLine of rawLines) {
    const words = rawLine.split(/\s+/);
    let currentLine = '';

    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        if (y < margin + lineHeight) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (y < margin + lineHeight) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    if (currentLine) {
      page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    } else {
      y -= lineHeight * 0.5;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return {
    content: pdfBytes,
    fileName: `${safeName}-ringkasan-ai.pdf`,
    mime: 'application/pdf'
  };
}
