/**
 * Unit conversion between English Metric Units (EMU) and PDF Points (pt)
 * OpenXML specification: 1 inch = 72 pt = 914,400 EMUs (1 pt = 12,700 EMUs)
 */
export const EMU_PER_PT = 12700;

/**
 * Convert English Metric Units (EMU) to PDF points
 * @param {number} emu
 * @returns {number}
 */
export function emuToPt(emu) {
  if (typeof emu !== 'number' || isNaN(emu)) return 0;
  return Math.round((emu / EMU_PER_PT) * 100) / 100;
}

/**
 * Convert PDF points to English Metric Units (EMU)
 * @param {number} pt
 * @returns {number}
 */
export function ptToEmu(pt) {
  if (typeof pt !== 'number' || isNaN(pt)) return 0;
  return Math.round(pt * EMU_PER_PT);
}
