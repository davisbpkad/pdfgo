/**
 * Remove light, low-saturation paper pixels while preserving dark/colored ink.
 * @param {HTMLImageElement} img
 * @returns {string} transparent PNG data URL
 */
export function removeWhiteBackground(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lightest = Math.max(r, g, b);
    const darkest = Math.min(r, g, b);
    // ponytail: light paper only; dark or strongly colored backgrounds need segmentation.
    if (lightest - darkest <= 45) {
      const opacity = Math.max(0, Math.min(1, (190 - darkest) / 30));
      data[i + 3] = Math.round(data[i + 3] * opacity);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}
