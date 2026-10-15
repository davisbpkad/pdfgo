import { Paragraph, TextRun, HeadingLevel } from 'docx';
import { detectHeading, calculateBaseFontSize } from '../../pdf-to-markdown/logic/detectHeading.js';
import { isTableLine } from '../../pdf-to-markdown/logic/tableFormatter.js';
import { buildDocxTable } from './buildDocxTable.js';

/**
 * Build docx Paragraph and Table objects from grouped layout lines
 * @param {Array<object>} lines
 * @returns {Array<object>}
 */
export function buildParagraphs(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return [];

  const baseFontSize = calculateBaseFontSize(lines);
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Table detection (two or more consecutive multi-column lines)
    if (isTableLine(line) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
      const tableLines = [line];
      i++;
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(buildDocxTable(tableLines));
      continue;
    }

    // 2. Heading detection
    const heading = detectHeading(line, baseFontSize);
    if (heading.isHeading) {
      const levelMap = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3
      };
      elements.push(
        new Paragraph({
          text: line.text,
          heading: levelMap[heading.level] || HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 100 }
        })
      );
      i++;
      continue;
    }

    // 3. Bullet list detection
    const trimmed = line.text.trim();
    if (/^[•\-\*]\s+/.test(trimmed)) {
      elements.push(
        new Paragraph({
          text: trimmed.replace(/^[•\-\*]\s+/, ''),
          bullet: { level: 0 },
          spacing: { after: 60 }
        })
      );
      i++;
      continue;
    }

    // 4. Regular paragraph (joins wrapped lines)
    let paraText = line.text;
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (
        detectHeading(next, baseFontSize).isHeading ||
        isTableLine(next) ||
        /^[•\-\*]\s+/.test(next.text.trim()) ||
        Math.abs(next.fontSize - line.fontSize) > 2
      ) {
        break;
      }
      paraText += ' ' + next.text;
      i++;
    }

    elements.push(
      new Paragraph({
        children: [new TextRun({ text: paraText.trim(), bold: Boolean(line.isBold) })],
        spacing: { after: 120 }
      })
    );
  }

  return elements;
}
