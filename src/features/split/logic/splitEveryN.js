import { PDFDocument } from 'pdf-lib';

/**
 * Split a PDF into chunks of N pages
 * @param {ArrayBuffer|Uint8Array} pdfBuffer
 * @param {number} nPages
 * @param {string} [password]
 * @param {Function} [onProgress]
 * @returns {Promise<Array<{ name: string, data: Uint8Array }>>}
 */
export async function splitEveryN(pdfBuffer, nPages = 1, password = '', onProgress = null) {
  if (nPages < 1) throw new Error('N harus minimal 1');

  let safeBuf;
  if (pdfBuffer instanceof Uint8Array) {
    safeBuf = new Uint8Array(pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength));
  } else if (pdfBuffer instanceof ArrayBuffer) {
    safeBuf = new Uint8Array(pdfBuffer.slice(0));
  } else {
    safeBuf = pdfBuffer;
  }

  const srcDoc = await PDFDocument.load(safeBuf, {
    password: password || undefined,
    ignoreEncryption: false
  });

  const total = srcDoc.getPageCount();
  const chunks = [];
  const totalChunks = Math.ceil(total / nPages);

  for (let i = 0; i < total; i += nPages) {
    const chunkDoc = await PDFDocument.create();
    const end = Math.min(i + nPages, total);
    const indices = [];
    for (let p = i; p < end; p++) indices.push(p);

    const pages = await chunkDoc.copyPages(srcDoc, indices);
    for (const page of pages) chunkDoc.addPage(page);

    const chunkBytes = await chunkDoc.save();
    const chunkNum = Math.floor(i / nPages) + 1;
    const name = `bagian_${String(chunkNum).padStart(3, '0')}_hal_${i + 1}-${end}.pdf`;
    chunks.push({ name, data: chunkBytes });

    if (onProgress) {
      onProgress(Math.round((chunkNum / totalChunks) * 100));
    }
  }

  return chunks;
}
