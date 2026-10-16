/**
 * Parse a human-friendly page range string (e.g. "1-3, 5, 8-10").
 * @param {string} rangeStr
 * @param {number} totalPages
 * @param {object} [options]
 * @param {boolean} [options.zeroBased=false] return 0-based indices instead of 1-based page numbers
 * @param {boolean} [options.emptyMeansAll=false] treat a missing/blank range as "every page"
 * @returns {number[]} sorted page numbers, or indices when zeroBased is set
 */
export function parsePageRange(rangeStr, totalPages, { zeroBased = false, emptyMeansAll = false } = {}) {
  if (!rangeStr || typeof rangeStr !== 'string' || !rangeStr.trim()) {
    if (!emptyMeansAll) return [];
    return Array.from({ length: Math.max(0, totalPages) }, (_, i) => (zeroBased ? i : i + 1));
  }

  const parts = rangeStr.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const pagesSet = new Set();
  const offset = zeroBased ? -1 : 0;

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pagesSet.add(p + offset);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pagesSet.add(page + offset);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}
