/**
 * coordinates.js - Pure Mathematical Coordinate Transformation Engine
 * Unifies normalized (0..1), display CSS, canvas pixel, and PDF point coordinates.
 */

const MAX_CANVAS_DIM = 4096;
const MAX_CANVAS_AREA = 16777216; // 16 Megapixels

/**
 * Calculate bounded rendering scale taking into account zoom, devicePixelRatio, and memory limits.
 * @param {number} zoom E.g. 1.0 for 100%, 2.0 for 200%
 * @param {number} [dpr=1] Window devicePixelRatio
 * @param {number} [pageWidthPt=595] Page width in PDF points
 * @param {number} [pageHeightPt=842] Page height in PDF points
 * @returns {{ scale: number, clamped: boolean }}
 */
export function renderScale(zoom = 1, dpr = 1, pageWidthPt = 595, pageHeightPt = 842) {
  const targetScale = Math.max(0.1, zoom * (dpr || 1));
  const maxDim = Math.max(pageWidthPt, pageHeightPt);
  const area = pageWidthPt * pageHeightPt;

  const maxScaleDim = MAX_CANVAS_DIM / maxDim;
  const maxScaleArea = Math.sqrt(MAX_CANVAS_AREA / area);
  const maxAllowed = Math.min(maxScaleDim, maxScaleArea);

  if (targetScale > maxAllowed) {
    return { scale: maxAllowed, clamped: true };
  }
  return { scale: targetScale, clamped: false };
}

/**
 * Convert pixel bounding box to normalized fraction (0..1) relative to page dimensions.
 * Note: y is measured from the TOP of the page.
 * @param {{ x: number, y: number, width: number, height: number }} boxPx
 * @param {{ width: number, height: number }} containerPx
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function toNormalized(boxPx, containerPx) {
  const cW = Math.max(1, containerPx.width);
  const cH = Math.max(1, containerPx.height);

  const rawX = boxPx.x / cW;
  const rawY = boxPx.y / cH;
  const rawW = boxPx.width / cW;
  const rawH = boxPx.height / cH;

  const x = Math.max(0, Math.min(1, rawX));
  const y = Math.max(0, Math.min(1, rawY));
  const width = Math.max(0, Math.min(1 - x, rawW));
  const height = Math.max(0, Math.min(1 - y, rawH));

  return { x, y, width, height };
}

/**
 * Convert normalized fraction (0..1) to concrete canvas/pixel coordinates.
 * @param {{ x: number, y: number, width: number, height: number }} normalizedBox
 * @param {{ width: number, height: number }} containerPx
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function toCanvasPx(normalizedBox, containerPx) {
  return {
    x: normalizedBox.x * containerPx.width,
    y: normalizedBox.y * containerPx.height,
    width: normalizedBox.width * containerPx.width,
    height: normalizedBox.height * containerPx.height
  };
}

/**
 * Convert normalized box (0..1, y from top) to PDF user coordinates (points, y from bottom-left).
 * @param {{ x: number, y: number, width: number, height: number }} normalizedBox
 * @param {number} pageWidthPt Width of PDF page in points
 * @param {number} pageHeightPt Height of PDF page in points
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function toPdfRect(normalizedBox, pageWidthPt, pageHeightPt) {
  const x = normalizedBox.x * pageWidthPt;
  const width = normalizedBox.width * pageWidthPt;
  const height = normalizedBox.height * pageHeightPt;
  const y = pageHeightPt - (normalizedBox.y * pageHeightPt + height);

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    width: Math.max(0, width),
    height: Math.max(0, height)
  };
}

/**
 * Convert normalized box to CSS display pixel rectangle for overlay DOM rendering.
 * @param {{ x: number, y: number, width: number, height: number }} normalizedBox
 * @param {{ width: number, height: number }} viewPx
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function toDisplayBox(normalizedBox, viewPx) {
  return toCanvasPx(normalizedBox, viewPx);
}
