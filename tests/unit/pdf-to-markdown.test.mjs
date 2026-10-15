/**
 * pdf-to-markdown.test.mjs - Unit tests for PDF to Markdown converter
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractLayoutItems } from '../../src/features/pdf-to-markdown/logic/extractLayoutItems.js';
import { groupLines } from '../../src/features/pdf-to-markdown/logic/groupLines.js';
import { detectHeading, calculateBaseFontSize } from '../../src/features/pdf-to-markdown/logic/detectHeading.js';
import { isTableLine, formatTableMarkdown } from '../../src/features/pdf-to-markdown/logic/tableFormatter.js';
import { linesToMarkdown } from '../../src/features/pdf-to-markdown/logic/toMarkdown.js';

test('pdf-to-markdown: extractLayoutItems maps and sorts items correctly', () => {
  const mockItems = [
    { str: 'Bottom Text', transform: [12, 0, 0, 12, 50, 100], width: 60, height: 12 },
    { str: 'Title Text', transform: [24, 0, 0, 24, 50, 700], width: 100, height: 24, fontName: 'Helvetica-Bold' }
  ];

  const extracted = extractLayoutItems(mockItems);
  assert.equal(extracted.length, 2);
  assert.equal(extracted[0].str, 'Title Text');
  assert.equal(extracted[0].fontSize, 24);
  assert.equal(extracted[0].isBold, true);
  assert.equal(extracted[1].str, 'Bottom Text');
});

test('pdf-to-markdown: groupLines combines items on same Y baseline with spacing', () => {
  const items = [
    { str: 'Hello', x: 50, y: 500, width: 30, height: 12, fontSize: 12, isBold: false },
    { str: 'World', x: 90, y: 501, width: 30, height: 12, fontSize: 12, isBold: false },
    { str: 'Second Line', x: 50, y: 450, width: 60, height: 12, fontSize: 12, isBold: false }
  ];

  const lines = groupLines(items);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].text, 'Hello World');
  assert.equal(lines[1].text, 'Second Line');
});

test('pdf-to-markdown: detectHeading accurately identifies H1, H2, H3 and body text', () => {
  const bodyLine = { text: 'Normal text line', fontSize: 12, isBold: false };
  const h1Line = { text: 'Big Title', fontSize: 24, isBold: true };
  const h2Line = { text: 'Sub Heading', fontSize: 16, isBold: false };
  const h3Line = { text: 'Small Section', fontSize: 14, isBold: true };

  const allLines = [bodyLine, bodyLine, bodyLine, h1Line, h2Line, h3Line];
  const baseSize = calculateBaseFontSize(allLines);
  assert.equal(baseSize, 12);

  assert.deepEqual(detectHeading(h1Line, baseSize), { level: 1, isHeading: true });
  assert.deepEqual(detectHeading(h2Line, baseSize), { level: 2, isHeading: true });
  assert.deepEqual(detectHeading(h3Line, baseSize), { level: 3, isHeading: true });
  assert.deepEqual(detectHeading(bodyLine, baseSize), { level: 0, isHeading: false });
});

test('pdf-to-markdown: formatTableMarkdown converts multi-column rows into Markdown table', () => {
  const row1 = {
    items: [
      { str: 'Name', x: 50, width: 40 },
      { str: 'Score', x: 150, width: 30 }
    ]
  };
  const row2 = {
    items: [
      { str: 'Alice', x: 50, width: 40 },
      { str: '95', x: 150, width: 20 }
    ]
  };

  assert.equal(isTableLine(row1), true);
  assert.equal(isTableLine(row2), true);

  const tableMd = formatTableMarkdown([row1, row2]);
  assert.ok(tableMd.includes('| Name | Score |'));
  assert.ok(tableMd.includes('| --- | --- |'));
  assert.ok(tableMd.includes('| Alice | 95 |'));
});

test('pdf-to-markdown: linesToMarkdown formats headings, bullets, tables and paragraphs', () => {
  const lines = [
    { text: 'Main Document Title', fontSize: 24, isBold: true },
    { text: '• First bullet item', fontSize: 12, isBold: false },
    { text: '• Second bullet item', fontSize: 12, isBold: false },
    {
      text: 'ColA ColB',
      fontSize: 12,
      isBold: false,
      items: [
        { str: 'ColA', x: 50, width: 30 },
        { str: 'ColB', x: 150, width: 30 }
      ]
    },
    {
      text: 'Val1 Val2',
      fontSize: 12,
      isBold: false,
      items: [
        { str: 'Val1', x: 50, width: 30 },
        { str: 'Val2', x: 150, width: 30 }
      ]
    },
    { text: 'This is a regular paragraph of descriptive text.', fontSize: 12, isBold: false }
  ];

  const md = linesToMarkdown(lines);
  assert.ok(md.includes('# Main Document Title'));
  assert.ok(md.includes('- First bullet item'));
  assert.ok(md.includes('- Second bullet item'));
  assert.ok(md.includes('| ColA | ColB |'));
  assert.ok(md.includes('This is a regular paragraph of descriptive text.'));
});
