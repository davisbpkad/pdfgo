import { detectHeading, calculateBaseFontSize } from './detectHeading.js';
import { isTableLine, formatTableMarkdown } from './tableFormatter.js';

/**
 * Convert lines of layout items into structured Markdown
 * @param {Array<object>} lines
 * @returns {string}
 */
export function linesToMarkdown(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return '';
  const baseFontSize = calculateBaseFontSize(lines);
  const outputBlocks = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Table check: if this line and the next line look like table rows
    if (isTableLine(line) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
      const tableLines = [line];
      i++;
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      outputBlocks.push(formatTableMarkdown(tableLines));
      continue;
    }

    // 2. Heading check
    const heading = detectHeading(line, baseFontSize);
    if (heading.isHeading) {
      const hashes = '#'.repeat(heading.level);
      outputBlocks.push(`${hashes} ${line.text}`);
      i++;
      continue;
    }

    // 3. Bullet list check
    const trimmed = line.text.trim();
    if (/^[•\-\*]\s+/.test(trimmed)) {
      outputBlocks.push(trimmed.replace(/^[•]\s+/, '- '));
      i++;
      continue;
    }
    if (/^\d+[\.\)]\s+/.test(trimmed)) {
      outputBlocks.push(trimmed.replace(/^(\d+)[\)]\s+/, '$1. '));
      i++;
      continue;
    }

    // 4. Standard paragraph
    let para = line.text;
    i++;
    while (i < lines.length) {
      const nextLine = lines[i];
      if (
        detectHeading(nextLine, baseFontSize).isHeading ||
        isTableLine(nextLine) ||
        /^[•\-\*]\s+/.test(nextLine.text.trim()) ||
        /^\d+[\.\)]\s+/.test(nextLine.text.trim()) ||
        Math.abs(nextLine.fontSize - line.fontSize) > 2
      ) {
        break;
      }
      para += ' ' + nextLine.text;
      i++;
    }
    outputBlocks.push(para.trim());
  }

  return outputBlocks.join('\n\n');
}
