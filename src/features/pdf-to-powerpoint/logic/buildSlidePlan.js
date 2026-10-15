/**
 * Build structured slide conversion plan from page selection and quality settings
 * @param {number} totalPages
 * @param {Object} [options]
 * @param {string | Array<number>} [options.pageSelection='all']
 * @param {'draft' | 'normal' | 'high'} [options.quality='normal']
 * @returns {{ selectedPages: Array<number>, scale: number, totalSlides: number, quality: string }}
 */
export function buildSlidePlan(totalPages, options = {}) {
  const { pageSelection = 'all', quality = 'normal' } = options;

  if (typeof totalPages !== 'number' || totalPages <= 0) {
    throw new Error('Jumlah halaman dokumen tidak valid.');
  }

  // Quality to scale mapping
  const scaleMap = {
    draft: 1.0,
    normal: 1.5,
    high: 2.0
  };
  const scale = scaleMap[quality] || 1.5;

  let pages = [];

  if (Array.isArray(pageSelection)) {
    pages = pageSelection
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= totalPages);
  } else if (typeof pageSelection === 'string' && pageSelection.trim().toLowerCase() !== 'all') {
    const parts = pageSelection.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let p = from; p <= to; p++) {
            pages.push(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          pages.push(p);
        }
      }
    }
  }

  // Deduplicate preserving order
  pages = Array.from(new Set(pages));

  // Default to all pages if no valid selection was specified
  if (pages.length === 0) {
    for (let p = 1; p <= totalPages; p++) {
      pages.push(p);
    }
  }

  return {
    selectedPages: pages,
    scale,
    totalSlides: pages.length,
    quality: scaleMap[quality] ? quality : 'normal'
  };
}
