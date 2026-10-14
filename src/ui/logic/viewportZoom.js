/**
 * viewportZoom.js - Pure functions for viewport zoom calculations and presets
 */

export const MIN_ZOOM = 0.25; // 25%
export const MAX_ZOOM = 4.0;  // 400%
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0];

/**
 * Clamp zoom level between MIN_ZOOM and MAX_ZOOM
 * @param {number} zoom
 * @returns {number}
 */
export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(zoom) || 1.0));
}

/**
 * Calculate zoom level to fit document width into container
 * @param {number} containerWidth
 * @param {number} pageWidthPt
 * @param {number} [padding=32]
 * @returns {number}
 */
export function calculateFitWidthZoom(containerWidth, pageWidthPt, padding = 32) {
  if (!containerWidth || !pageWidthPt) return 1.0;
  const availableWidth = Math.max(100, containerWidth - padding);
  const fitZoom = availableWidth / pageWidthPt;
  return clampZoom(Number(fitZoom.toFixed(2)));
}
