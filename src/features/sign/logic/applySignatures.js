import { PDFDocument } from 'pdf-lib';

/**
 * Embed and stamp a signature PNG onto a PDF document
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {ArrayBuffer|Uint8Array} signaturePngBuffer
 * @param {Array<{ pageIndex: number, x: number, y: number, width: number, height: number }>} placements
 * @returns {Promise<Uint8Array>}
 */
export async function applySignatures(srcBuffer, signaturePngBuffer, placements) {
  if (!placements || placements.length === 0) {
    throw new Error('Tentukan posisi penempatan tanda tangan terlebih dahulu.');
  }

  let safePdfBuf;
  if (srcBuffer instanceof Uint8Array) {
    safePdfBuf = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safePdfBuf = new Uint8Array(srcBuffer.slice(0));
  } else {
    safePdfBuf = srcBuffer;
  }

  let safeSignBuf;
  if (signaturePngBuffer instanceof Uint8Array) {
    safeSignBuf = new Uint8Array(signaturePngBuffer.buffer.slice(signaturePngBuffer.byteOffset, signaturePngBuffer.byteOffset + signaturePngBuffer.byteLength));
  } else if (signaturePngBuffer instanceof ArrayBuffer) {
    safeSignBuf = new Uint8Array(signaturePngBuffer.slice(0));
  } else {
    safeSignBuf = signaturePngBuffer;
  }

  const pdfDoc = await PDFDocument.load(safePdfBuf);
  const signatureImg = await pdfDoc.embedPng(safeSignBuf);

  for (const p of placements) {
    const page = pdfDoc.getPage(p.pageIndex);
    page.drawImage(signatureImg, {
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height
    });
  }

  return await pdfDoc.save();
}
