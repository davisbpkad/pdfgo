/**
 * Fit text into column width with ellipsis truncation
 * @param {any} font
 * @param {string} text
 * @param {number} fontSize
 * @param {number} maxWidth
 * @returns {string}
 */
export function fitText(font, text, fontSize, maxWidth) {
  if (!text) return '';
  const clean = String(text).replace(/[\r\n\t]+/g, ' ');
  if (font.widthOfTextAtSize(clean, fontSize) <= maxWidth) return clean;
  let t = clean;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, fontSize) > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}...`;
}
