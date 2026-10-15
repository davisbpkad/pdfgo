import { PDFDocument } from '@cantoo/pdf-lib';

/**
 * Check whether a PDF buffer is encrypted
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @returns {Promise<boolean>}
 */
export async function isPdfEncrypted(pdfBuffer) {
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error('Berkas PDF kosong atau tidak valid.');
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  try {
    const doc = await PDFDocument.load(safeBytes);
    return Boolean(doc.isEncrypted);
  } catch (err) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('encrypted')) {
      return true;
    }
    throw err;
  }
}

/**
 * Remove password protection from an encrypted PDF document
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {string} [password='']
 * @returns {Promise<{ unlockedBytes: Uint8Array, pageCount: number, wasEncrypted: boolean }>}
 */
export async function removePassword(pdfBuffer, password = '') {
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error('Berkas PDF kosong atau tidak valid.');
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const wasEncrypted = await isPdfEncrypted(safeBytes);

  let doc;
  try {
    doc = await PDFDocument.load(safeBytes, { password: password || '' });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.toLowerCase().includes('password incorrect') || msg.toLowerCase().includes('password')) {
      const error = new Error('Password salah. Silakan coba lagi.');
      error.code = 'WRONG_PASSWORD';
      throw error;
    }
    throw new Error(`Gagal membaca berkas PDF: ${msg}`);
  }

  const unlockedBytes = await doc.save();
  const pageCount = doc.getPageCount();

  return {
    unlockedBytes,
    pageCount,
    wasEncrypted
  };
}
