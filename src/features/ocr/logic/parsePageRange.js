import { parsePageRange as parsePageRangeBase } from '../../split/logic/parsePageRange.js';

/**
 * Parse a page range string (e.g. "1-3, 5") into 0-based page indices.
 * A missing or blank range means "every page" for OCR, which is why this
 * wrapper exists instead of a second parser.
 * @param {string} rangeStr
 * @param {number} totalPages
 * @returns {number[]}
 */
export function parsePageRange(rangeStr, totalPages) {
  return parsePageRangeBase(rangeStr, totalPages, { zeroBased: true, emptyMeansAll: true });
}
