import { t } from '../../../core/i18n.js';
/**
 * Apply scanning enhancement filters to an ImageData buffer
 * @param {{ data: Uint8ClampedArray | Uint8Array, width: number, height: number }} imageData
 * @param {'original' | 'grayscale' | 'bw' | 'enhance'} [filterType='original']
 * @returns {{ data: Uint8ClampedArray | Uint8Array, width: number, height: number }}
 */
export function applyScanFilter(imageData, filterType = 'original') {
  if (!imageData || !imageData.data) {
    throw new Error(t('tools.scanToPdf.invalidImageData'));
  }

  if (filterType === 'original') {
    return imageData;
  }

  const { data } = imageData;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Standard ITU-R BT.601 luminance
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

    if (filterType === 'grayscale') {
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
    } else if (filterType === 'bw') {
      // Document high-contrast binarization
      const val = lum > 128 ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    } else if (filterType === 'enhance') {
      // Crisp text scan enhancement: white background, dark ink
      let val;
      if (lum > 175) {
        val = 255;
      } else if (lum < 85) {
        val = Math.max(0, Math.round(lum * 0.7));
      } else {
        val = Math.round(((lum - 85) / 90) * 255);
      }
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  }

  return imageData;
}
