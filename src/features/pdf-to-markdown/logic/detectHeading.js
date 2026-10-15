/**
 * Calculate the dominant/body font size across lines
 * @param {Array<object>} lines
 * @returns {number}
 */
export function calculateBaseFontSize(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return 12;
  const sizes = lines.map(l => Math.round(l.fontSize)).filter(s => s > 0);
  if (sizes.length === 0) return 12;

  const freq = {};
  for (const s of sizes) {
    freq[s] = (freq[s] || 0) + 1;
  }

  let maxCount = 0;
  let dominant = 12;
  for (const [s, count] of Object.entries(freq)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = Number(s);
    }
  }

  return dominant;
}

/**
 * Detect whether a line represents a Markdown heading
 * @param {object} line
 * @param {number} [baseFontSize=12]
 * @returns {{ level: number, isHeading: boolean }}
 */
export function detectHeading(line, baseFontSize = 12) {
  if (!line || !line.text) {
    return { level: 0, isHeading: false };
  }

  const text = line.text.trim();
  if (text.length === 0 || text.length > 120) {
    return { level: 0, isHeading: false };
  }

  const fs = line.fontSize || baseFontSize;

  if (fs >= baseFontSize * 1.5) {
    return { level: 1, isHeading: true };
  }
  if (fs >= baseFontSize * 1.25) {
    return { level: 2, isHeading: true };
  }
  if (fs >= baseFontSize * 1.12 && (line.isBold || text.length < 60)) {
    return { level: 3, isHeading: true };
  }

  return { level: 0, isHeading: false };
}
