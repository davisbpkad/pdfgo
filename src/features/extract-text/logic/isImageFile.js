/**
 * Image-file detection shared by the extract-text tool.
 * A File whose browser-reported type is an image, or whose name has an image
 * extension, can be sent straight to OCR instead of the PDF loader.
 */

const IMAGE_EXTENSION = /\.(png|jpe?g|webp|bmp)$/i;

/** @param {string} name */
export function isImageName(name) {
  return IMAGE_EXTENSION.test(String(name || '').toLowerCase());
}

/** @param {File} file */
export function isImageFile(file) {
  if (!file) return false;
  return String(file.type || '').startsWith('image/') || isImageName(file.name);
}
