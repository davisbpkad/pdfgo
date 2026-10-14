/**
 * Parse a human-friendly page range string (e.g. "1-3, 5, 8-10")
 * @param {string} rangeStr
 * @param {number} totalPages
 * @returns {number[]} Array of 1-indexed page numbers
 */
export function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || typeof rangeStr !== 'string') return [];
  const parts = rangeStr.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const pagesSet = new Set();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pagesSet.add(page);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}
