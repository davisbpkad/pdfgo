/**
 * Compute page pagination slices for a tall continuous canvas based on A4 aspect ratio
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {number} [aspectRatio=0.707] Width to height ratio (default A4 = 595/842 ≈ 0.707)
 * @returns {Array<{ pageNum: number, sy: number, sHeight: number, width: number, pageHeight: number, totalPages: number }>}
 */
export function calculateCanvasPagination(canvasWidth, canvasHeight, aspectRatio = 0.707) {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return [];
  }

  const pageHeightPx = Math.max(1, Math.round(canvasWidth / aspectRatio));
  const totalPages = Math.max(1, Math.ceil(canvasHeight / pageHeightPx));
  const slices = [];

  for (let i = 0; i < totalPages; i++) {
    const sy = i * pageHeightPx;
    const sHeight = Math.min(pageHeightPx, canvasHeight - sy);
    slices.push({
      pageNum: i + 1,
      sy,
      sHeight,
      width: canvasWidth,
      pageHeight: pageHeightPx,
      totalPages
    });
  }

  return slices;
}

/**
 * Slice a source canvas into multiple page canvases according to pagination descriptors
 * @param {HTMLCanvasElement} sourceCanvas
 * @param {Array<object>} slices
 * @returns {Array<HTMLCanvasElement>}
 */
export function sliceCanvasPages(sourceCanvas, slices) {
  if (!sourceCanvas || !Array.isArray(slices)) return [];

  return slices.map((slice) => {
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = slice.width;
    pageCanvas.height = slice.pageHeight;
    const ctx = pageCanvas.getContext('2d');

    // Fill white background for printable page
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.pageHeight);

    // Draw sliced portion
    ctx.drawImage(
      sourceCanvas,
      0,
      slice.sy,
      slice.width,
      slice.sHeight,
      0,
      0,
      slice.width,
      slice.sHeight
    );

    return pageCanvas;
  });
}
