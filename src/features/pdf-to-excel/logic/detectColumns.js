/**
 * Detect column alignments from PDF layout items
 * @param {Array<{ x: number, str: string }>} items
 * @param {object} [options]
 * @param {number} [options.minColGap=18] Minimum horizontal gap between columns
 * @returns {Array<{ index: number, x: number }>} Sorted columns
 */
export function detectColumns(items, { minColGap = 18 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const validItems = items.filter(
    (it) => it && typeof it.str === 'string' && it.str.trim().length > 0
  );
  if (validItems.length === 0) return [];

  // Sort distinct X coordinates
  const xCoords = validItems.map((it) => Math.round(it.x)).sort((a, b) => a - b);

  const clusters = [];
  for (const x of xCoords) {
    if (clusters.length === 0) {
      clusters.push([x]);
    } else {
      const lastCluster = clusters[clusters.length - 1];
      const clusterAvg = lastCluster.reduce((s, v) => s + v, 0) / lastCluster.length;
      if (Math.abs(x - clusterAvg) <= minColGap) {
        lastCluster.push(x);
      } else {
        clusters.push([x]);
      }
    }
  }

  return clusters.map((c, idx) => ({
    index: idx,
    x: Math.round((c.reduce((s, v) => s + v, 0) / c.length) * 10) / 10
  })).sort((a, b) => a.x - b.x);
}

/**
 * Find the closest column index for a given X coordinate
 * @param {number} x
 * @param {Array<{ index: number, x: number }>} columns
 * @returns {number}
 */
export function findColumnIndex(x, columns) {
  if (!columns || columns.length === 0) return 0;
  let bestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < columns.length; i++) {
    const diff = Math.abs(x - columns[i].x);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}
