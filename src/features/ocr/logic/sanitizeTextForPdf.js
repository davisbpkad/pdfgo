/**
 * Filter text to ensure WinAnsi compatibility with StandardFonts.Helvetica in pdf-lib
 * @param {string} text
 * @returns {string}
 */
export function sanitizeTextForPdf(text) {
  if (!text) return '';
  // Keep standard ASCII and Latin-1 supplement characters, replace others with space
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ').trim();
}
