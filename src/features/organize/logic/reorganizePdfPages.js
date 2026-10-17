import { t } from '../../../core/i18n.js';
import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Assemble a new PDF from a list of page operations
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {Array<{ originalIndex: number, rotation: number }>} pageConfigs
 * @param {string} [password]
 * @returns {Promise<Uint8Array>}
 */
export async function reorganizePdfPages(srcBuffer, pageConfigs, password = '') {
  if (!pageConfigs || pageConfigs.length === 0) {
    throw new Error(t('tools.organize.needPage'));
  }

  let safeBuf;
  if (srcBuffer instanceof Uint8Array) {
    safeBuf = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safeBuf = new Uint8Array(srcBuffer.slice(0));
  } else {
    safeBuf = srcBuffer;
  }

  const srcDoc = await PDFDocument.load(safeBuf, {
    password: password || undefined,
    ignoreEncryption: false
  });

  const newDoc = await PDFDocument.create();

  for (const config of pageConfigs) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [config.originalIndex]);
    const currentRot = copiedPage.getRotation().angle;
    const finalRot = (currentRot + config.rotation) % 360;
    copiedPage.setRotation(degrees(finalRot));
    newDoc.addPage(copiedPage);
  }

  return await newDoc.save();
}
