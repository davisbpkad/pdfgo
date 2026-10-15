import { PDFDocument } from '@cantoo/pdf-lib';

/**
 * Encrypt a PDF document with AES-256 password protection and permissions
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {Object} options
 * @param {string} options.userPassword
 * @param {string} [options.ownerPassword]
 * @param {Object} [options.permissions]
 * @param {boolean} [options.permissions.printing=true]
 * @param {boolean} [options.permissions.copying=false]
 * @param {boolean} [options.permissions.modifying=false]
 * @param {boolean} [options.permissions.annotating=false]
 * @param {boolean} [options.permissions.fillingForms=false]
 * @returns {Promise<{ encryptedBytes: Uint8Array, pageCount: number }>}
 */
export async function encryptPdf(pdfBuffer, options = {}) {
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error('Berkas PDF kosong atau tidak valid.');
  }

  const userPassword = String(options.userPassword || '').trim();
  if (!userPassword) {
    throw new Error('Password tidak boleh kosong.');
  }

  const ownerPassword = String(options.ownerPassword || '').trim() || userPassword;
  const permissions = options.permissions || {};

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  let doc;
  try {
    doc = await PDFDocument.load(safeBytes);
  } catch (err) {
    throw new Error(`Gagal membaca berkas PDF: ${err.message || 'Format tidak valid'}`);
  }

  const pageCount = doc.getPageCount();

  try {
    doc.encrypt({
      userPassword,
      ownerPassword,
      permissions: {
        printing: permissions.printing ? 'highResolution' : 'none',
        copying: Boolean(permissions.copying),
        modifying: Boolean(permissions.modifying),
        annotating: Boolean(permissions.annotating),
        fillingForms: Boolean(permissions.fillingForms)
      },
      algorithm: 'AES-256'
    });

    const encryptedBytes = await doc.save();

    return {
      encryptedBytes,
      pageCount
    };
  } catch (err) {
    throw new Error(`Gagal mengenkripsi berkas PDF: ${err.message || 'Terjadi kesalahan sistem'}`);
  }
}
