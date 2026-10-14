/**
 * Convert WebP or uncompressed image data to PNG ArrayBuffer via Canvas
 * @param {Blob|File} imageBlob
 * @returns {Promise<ArrayBuffer>}
 */
export async function convertImageToPngBuffer(imageBlob) {
  if (typeof document === 'undefined') {
    return await imageBlob.arrayBuffer();
  }

  const bitmap = await createImageBitmap(imageBlob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);

  const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  canvas.width = 0;
  canvas.height = 0;
  return await pngBlob.arrayBuffer();
}
