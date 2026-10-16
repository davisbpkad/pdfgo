import { rgb } from 'pdf-lib';

/**
 * Convert hex color string (#rrggbb or #rgb) to pdf-lib rgb color
 * @param {string} hex
 * @returns {any}
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return rgb(0, 0, 0);
  const clean = hex.replace('#', '').trim();
  const parse = (pair) => parseInt(pair, 16);
  let r;
  let g;
  let b;
  if (clean.length === 3) {
    r = parse(clean[0] + clean[0]);
    g = parse(clean[1] + clean[1]);
    b = parse(clean[2] + clean[2]);
  } else if (clean.length >= 6) {
    r = parse(clean.slice(0, 2));
    g = parse(clean.slice(2, 4));
    b = parse(clean.slice(4, 6));
  } else {
    return rgb(0, 0, 0);
  }
  if ([r, g, b].some(Number.isNaN)) return rgb(0, 0, 0);
  return rgb(r / 255, g / 255, b / 255);
}
