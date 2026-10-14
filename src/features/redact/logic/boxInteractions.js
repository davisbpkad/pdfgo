/**
 * boxInteractions.js - Pure helper functions for manipulating normalized redaction boxes.
 */

export const MIN_BOX_FRACTION = 0.008; // ~0.8% minimum page fraction
export const DEFAULT_NUDGE_STEP = 0.002; // ~1pt on 500pt page
export const SHIFT_NUDGE_STEP = 0.02; // ~10pt on 500pt page

const r6 = n => Math.round(n * 1e6) / 1e6;

/**
 * Nudge a normalized box in a given direction.
 * @param {{ x: number, y: number, width: number, height: number }} box
 * @param {'left'|'right'|'up'|'down'} direction
 * @param {boolean} [isShift=false]
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function nudgeBox(box, direction, isShift = false) {
  const step = isShift ? SHIFT_NUDGE_STEP : DEFAULT_NUDGE_STEP;
  let { x, y, width, height } = box;

  switch (direction) {
    case 'left':
      x = Math.max(0, x - step);
      break;
    case 'right':
      x = Math.min(1 - width, x + step);
      break;
    case 'up':
      y = Math.max(0, y - step);
      break;
    case 'down':
      y = Math.min(1 - height, y + step);
      break;
  }

  return { x: r6(x), y: r6(y), width: r6(width), height: r6(height) };
}

/**
 * Move a normalized box by normalized delta.
 * @param {{ x: number, y: number, width: number, height: number }} initialBox
 * @param {number} dxNorm Normalized delta X
 * @param {number} dyNorm Normalized delta Y
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function moveBox(initialBox, dxNorm, dyNorm) {
  const x = Math.max(0, Math.min(1 - initialBox.width, initialBox.x + dxNorm));
  const y = Math.max(0, Math.min(1 - initialBox.height, initialBox.y + dyNorm));
  return { ...initialBox, x: r6(x), y: r6(y) };
}

/**
 * Resize a normalized box from its bottom-right handle.
 * @param {{ x: number, y: number, width: number, height: number }} initialBox
 * @param {number} dwNorm Normalized delta width
 * @param {number} dhNorm Normalized delta height
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function resizeBox(initialBox, dwNorm, dhNorm) {
  const width = Math.max(MIN_BOX_FRACTION, Math.min(1 - initialBox.x, initialBox.width + dwNorm));
  const height = Math.max(MIN_BOX_FRACTION, Math.min(1 - initialBox.y, initialBox.height + dhNorm));
  return { ...initialBox, width: r6(width), height: r6(height) };
}
