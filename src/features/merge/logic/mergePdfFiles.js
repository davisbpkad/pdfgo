import { t } from '../../../core/i18n.js';
import { PDFDocument } from 'pdf-lib';

/**
 * Merge an array of PDF buffers into a single PDF
 * @param {Array<{ buffer: ArrayBuffer|Uint8Array, file?: File, name?: string, password?: string }>} entries
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function mergePdfFiles(entries, onProgress = null) {
  if (!entries || entries.length < 2) {
    throw new Error(t('tools.merge.minFiles'));
  }

  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let srcDoc;
    try {
      let rawBuf = entry.buffer;

      // If buffer is missing or detached (byteLength === 0), recover fresh buffer from file
      if ((!rawBuf || rawBuf.byteLength === 0) && entry.file && typeof entry.file.arrayBuffer === 'function') {
        rawBuf = await entry.file.arrayBuffer();
      }

      if (!rawBuf || rawBuf.byteLength === 0) {
        throw new Error(`Buffer berkas "${entry.name || 'PDF'}" kosong atau telah terlepas (detached ArrayBuffer).`);
      }

      let buf;
      if (rawBuf instanceof Uint8Array) {
        buf = new Uint8Array(rawBuf.buffer.slice(rawBuf.byteOffset, rawBuf.byteOffset + rawBuf.byteLength));
      } else if (rawBuf instanceof ArrayBuffer) {
        buf = new Uint8Array(rawBuf.slice(0));
      } else {
        buf = rawBuf;
      }

      srcDoc = await PDFDocument.load(buf, {
        password: entry.password || undefined,
        ignoreEncryption: false
      });
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypt')) {
        throw new Error(`File "${entry.name || 'PDF'}" dilindungi password. Silakan masukkan password yang benar.`);
      }
      throw new Error(`Gagal membaca "${entry.name || 'PDF'}": ${msg}`);
    }

    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / entries.length) * 100));
    }
  }

  return await mergedDoc.save();
}
