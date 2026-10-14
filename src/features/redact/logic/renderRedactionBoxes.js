/**
 * renderRedactionBoxes.js - Rasterizes redaction boxes onto 2D canvas context.
 * Boxes must be normalized fractions (0..1) relative to page dimensions.
 */

/**
 * Draw solid black redaction boxes onto canvas context with safety margin.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{ x: number, y: number, width: number, height: number }>} boxes
 * @param {number} canvasWidth Canvas width in pixels
 * @param {number} canvasHeight Canvas height in pixels
 * @param {number} [scale=1] Render scale factor (for safety margin scaling)
 * @param {number} [previewScale] Legacy fallback if unnormalized pixels are provided
 * @returns {Array<{ x: number, y: number, width: number, height: number }>} Drawn pixel rectangles
 */
export function renderRedactionBoxes(ctx, boxes, canvasWidth, canvasHeight, scale = 1, previewScale = null) {
  if (!boxes?.length || !canvasWidth || !canvasHeight) return [];

  // ponytail: margin pengaman 1pt
  const safetyMargin = Math.max(1, 1 * scale);
  const drawnRects = [];

  if (ctx) {
    ctx.fillStyle = '#000000';
  }

  for (const box of boxes) {
    let bx, by, bw, bh;
    // Check if box coordinates are normalized (0..1)
    if (box.x <= 1.0 && box.y <= 1.0 && box.width <= 1.0 && box.height <= 1.0) {
      bx = box.x * canvasWidth;
      by = box.y * canvasHeight;
      bw = box.width * canvasWidth;
      bh = box.height * canvasHeight;
    } else {
      // Fallback for legacy pixel coordinates
      const factor = previewScale ? (scale / previewScale) : 1;
      bx = box.x * factor;
      by = box.y * factor;
      bw = box.width * factor;
      bh = box.height * factor;
    }

    const drawX = Math.max(0, bx - safetyMargin);
    const drawY = Math.max(0, by - safetyMargin);
    const drawW = Math.min(canvasWidth - drawX, bw + safetyMargin * 2);
    const drawH = Math.min(canvasHeight - drawY, bh + safetyMargin * 2);

    if (ctx && typeof ctx.fillRect === 'function') {
      ctx.fillRect(drawX, drawY, drawW, drawH);
    }

    drawnRects.push({
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH
    });
  }

  return drawnRects;
}
