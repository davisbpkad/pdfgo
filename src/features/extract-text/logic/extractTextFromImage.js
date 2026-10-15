import { getOcrWorker } from '../../ocr/logic/ocrWorkerManager.js';

export { extractTextFromScannedPdf } from './extractTextFromScannedPdf.js';

/**
 * Convert an Image File/Blob to an HTMLCanvasElement
 * @param {Blob | File} fileOrBlob
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function imageFileToCanvas(fileOrBlob) {
  if (typeof document === 'undefined') {
    throw new Error('Canvas rendering is not supported in this environment.');
  }

  // Fast path: createImageBitmap
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(fileOrBlob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      return canvas;
    } catch (_) {
      // Fallback below
    }
  }

  // Fallback: HTMLImageElement via Object URL
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gagal memuat file gambar. Format tidak didukung atau file rusak.'));
    };
    img.src = url;
  });
}

/**
 * Extract text from an image (File, Blob, or Canvas) using local OCR
 * @param {File | Blob | HTMLCanvasElement} imageSource
 * @param {object} [options]
 * @param {string} [options.lang='ind']
 * @param {Function} [options.onProgress]
 * @param {{ value: boolean }} [options.cancelRef]
 * @returns {Promise<{ text: string, words: any[], confidence: number }>}
 */
export async function extractTextFromImage(imageSource, options = {}) {
  const { lang = 'ind', onProgress = null, cancelRef = null } = options;

  if (cancelRef?.value) {
    throw new Error('Ekstraksi teks dibatalkan.');
  }

  let canvas = null;
  let isCanvasCreated = false;

  if (typeof HTMLCanvasElement !== 'undefined' && imageSource instanceof HTMLCanvasElement) {
    canvas = imageSource;
  } else {
    canvas = await imageFileToCanvas(imageSource);
    isCanvasCreated = true;
  }

  try {
    const worker = await getOcrWorker(lang, (m) => {
      if (onProgress && m && typeof m.progress === 'number') {
        onProgress(Math.round(m.progress * 100));
      }
    });

    if (cancelRef?.value) {
      throw new Error('Ekstraksi teks dibatalkan.');
    }

    const ocrRes = await worker.recognize(canvas);

    if (cancelRef?.value) {
      throw new Error('Ekstraksi teks dibatalkan.');
    }

    return {
      text: ocrRes.data?.text || '',
      words: ocrRes.data?.words || [],
      confidence: Math.round(ocrRes.data?.confidence || 0)
    };
  } finally {
    if (isCanvasCreated && canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
