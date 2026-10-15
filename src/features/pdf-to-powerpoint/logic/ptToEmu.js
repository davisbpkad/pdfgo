/**
 * Constants and unit conversion functions between PDF Points, EMUs, and Inches
 * OpenXML / PowerPoint specification: 1 inch = 72 pt = 914,400 EMUs (1 pt = 12,700 EMUs)
 */
export const EMU_PER_PT = 12700;
export const PT_PER_INCH = 72;

/**
 * Convert PDF user points to English Metric Units (EMU)
 * @param {number} pt
 * @returns {number}
 */
export function ptToEmu(pt) {
  if (typeof pt !== 'number' || isNaN(pt)) return 0;
  return Math.round(pt * EMU_PER_PT);
}

/**
 * Convert English Metric Units (EMU) to PDF user points
 * @param {number} emu
 * @returns {number}
 */
export function emuToPt(emu) {
  if (typeof emu !== 'number' || isNaN(emu)) return 0;
  return emu / EMU_PER_PT;
}

/**
 * Convert PDF user points to inches
 * @param {number} pt
 * @returns {number}
 */
export function ptToInches(pt) {
  if (typeof pt !== 'number' || isNaN(pt)) return 0;
  return pt / PT_PER_INCH;
}

/**
 * Convert inches to PDF user points
 * @param {number} inches
 * @returns {number}
 */
export function inchesToPt(inches) {
  if (typeof inches !== 'number' || isNaN(inches)) return 0;
  return inches * PT_PER_INCH;
}
