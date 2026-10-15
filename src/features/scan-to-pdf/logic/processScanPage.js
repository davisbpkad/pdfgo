import { toCanvasPx } from '../../../core/coordinates.js';
import { applyScanFilter } from './applyScanFilter.js';

/**
 * Process a single scanned page: crops, rotates, filters, and renders to JPEG buffer
 * @param {HTMLImageElement | ImageBitmap} img
 * @param {Object} options
 * @param {{ x: number, y: number, width: number, height: number }} [options.cropBox]
 * @param {number} [options.rotation=0]
 * @param {'original' | 'grayscale' | 'bw' | 'enhance'} [options.filter='original']
 * @returns {Promise<{ buffer: ArrayBuffer, type: string, width: number, height: number }>}
 */
export async function processScanPage(img, options = {}) {
  const {
    cropBox = { x: 0, y: 0, width: 1, height: 1 },
    rotation = 0,
    filter = 'original'
  } = options;

  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  const cropPx = toCanvasPx(cropBox, { width: imgW, height: imgH });
  const cX = Math.max(0, Math.round(cropPx.x));
  const cY = Math.max(0, Math.round(cropPx.y));
  const cW = Math.max(1, Math.min(imgW - cX, Math.round(cropPx.width)));
  const cH = Math.max(1, Math.min(imgH - cY, Math.round(cropPx.height)));

  const isSideways = (rotation % 180) !== 0;
  const outW = isSideways ? cH : cW;
  const outH = isSideways ? cW : cH;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, cX, cY, cW, cH, -cW / 2, -cH / 2, cW, cH);
  ctx.resetTransform();

  if (filter !== 'original') {
    const imgData = ctx.getImageData(0, 0, outW, outH);
    applyScanFilter(imgData, filter);
    ctx.putImageData(imgData, 0, 0);
  }

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
  const buffer = await blob.arrayBuffer();

  canvas.width = 0;
  canvas.height = 0;

  return {
    buffer,
    type: 'image/jpeg',
    width: outW,
    height: outH
  };
}
