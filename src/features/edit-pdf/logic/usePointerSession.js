/**
 * Pointer session for the edit canvas: draw mode point collection + object move/resize.
 * Keeps EditCanvas.vue focused on rendering.
 */
import { moveObject, resizeObject } from './objectInteractions.js';

/**
 * @param {import('vue').Ref<HTMLElement|null>} wrapperRef
 * @param {{ onUpdate: (obj: object) => void, onDraw: (points: Array<{x:number,y:number}>) => void }} handlers
 */
export function usePointerSession(wrapperRef, handlers) {
  let active = null;

  function normalize(e) {
    const rect = wrapperRef.value.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function beginDraw(e) {
    active = { mode: 'draw', points: [normalize(e)] };
    wrapperRef.value?.setPointerCapture(e.pointerId);
  }

  function beginTransform(e, obj, mode) {
    const rect = wrapperRef.value.getBoundingClientRect();
    active = {
      mode,
      initObj: { ...obj },
      startX: e.clientX,
      startY: e.clientY,
      rectW: rect.width,
      rectH: rect.height
    };
    wrapperRef.value?.setPointerCapture(e.pointerId);
  }

  function move(e) {
    if (!active) return;
    if (active.mode === 'draw') {
      active.points.push(normalize(e));
      return;
    }
    const dx = (e.clientX - active.startX) / active.rectW;
    const dy = (e.clientY - active.startY) / active.rectH;
    handlers.onUpdate(active.mode === 'move' ? moveObject(active.initObj, dx, dy) : resizeObject(active.initObj, dx, dy));
  }

  function end() {
    if (active?.mode === 'draw' && active.points.length > 1) {
      handlers.onDraw([...active.points]);
    }
    active = null;
  }

  return { beginDraw, beginTransform, move, end, isActive: () => Boolean(active) };
}
