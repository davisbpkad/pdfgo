/**
 * Pure helper functions for manipulating normalized overlay objects on PDF pages
 */

export const MIN_OBJECT_FRACTION = 0.005; // 0.5% min fraction
export const DEFAULT_NUDGE_STEP = 0.002;  // ~1pt on 500pt page
export const SHIFT_NUDGE_STEP = 0.02;     // ~10pt on 500pt page

const r6 = (n) => Math.round(n * 1e6) / 1e6;

export function clampNormalized(box) {
  const x = Math.max(0, Math.min(1, box.x));
  const y = Math.max(0, Math.min(1, box.y));
  const width = Math.max(MIN_OBJECT_FRACTION, Math.min(1 - x, box.width));
  const height = Math.max(MIN_OBJECT_FRACTION, Math.min(1 - y, box.height));
  return { ...box, x: r6(x), y: r6(y), width: r6(width), height: r6(height) };
}

export function nudgeObject(obj, direction, isShift = false) {
  const step = isShift ? SHIFT_NUDGE_STEP : DEFAULT_NUDGE_STEP;
  let { x, y, width, height } = obj;

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

  return { ...obj, x: r6(x), y: r6(y), width: r6(width), height: r6(height) };
}

export function moveObject(initialObj, dxNorm, dyNorm) {
  const x = Math.max(0, Math.min(1 - initialObj.width, initialObj.x + dxNorm));
  const y = Math.max(0, Math.min(1 - initialObj.height, initialObj.y + dyNorm));
  return { ...initialObj, x: r6(x), y: r6(y) };
}

export function resizeObject(initialObj, dwNorm, dhNorm) {
  const width = Math.max(MIN_OBJECT_FRACTION, Math.min(1 - initialObj.x, initialObj.width + dwNorm));
  const height = Math.max(MIN_OBJECT_FRACTION, Math.min(1 - initialObj.y, initialObj.height + dhNorm));
  return { ...initialObj, width: r6(width), height: r6(height) };
}

export function createDefaultObject(type, options = {}) {
  const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const base = {
    id,
    type,
    x: 0.1,
    y: 0.1,
    width: 0.25,
    height: 0.08,
    color: '#000000',
    fontSize: 14,
    text: 'Teks Baru',
    strokeWidth: 2,
    fillColor: '#ffffff',
    borderColor: '#000000',
    points: []
  };

  if (type === 'text') {
    return { ...base, width: 0.3, height: 0.05, text: options.text || 'Teks Baru', ...options };
  }
  if (type === 'whiteout') {
    return { ...base, width: 0.25, height: 0.04, fillColor: '#ffffff', borderColor: '#ffffff', ...options };
  }
  if (type === 'rect') {
    return { ...base, width: 0.25, height: 0.15, fillColor: '', borderColor: '#000000', strokeWidth: 2, ...options };
  }
  if (type === 'ellipse') {
    return { ...base, width: 0.2, height: 0.15, fillColor: '', borderColor: '#000000', strokeWidth: 2, ...options };
  }
  if (type === 'line' || type === 'arrow') {
    return { ...base, width: 0.25, height: 0.04, color: '#000000', strokeWidth: 2, ...options };
  }
  if (type === 'draw') {
    return { ...base, color: '#000000', strokeWidth: 2, points: options.points || [], ...options };
  }
  if (type === 'image') {
    return { ...base, width: 0.3, height: 0.2, dataUrl: options.dataUrl || '', ...options };
  }
  return { ...base, ...options };
}
