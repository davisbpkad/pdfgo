import { Table, TableRow, TableCell, Paragraph, WidthType } from 'docx';

/**
 * Build a DOCX Table from lines identified as multi-column table rows
 * @param {Array<object>} tableLines
 * @returns {Table}
 */
export function buildDocxTable(tableLines) {
  const rows = tableLines.map((line) => {
    const cells = [];
    let currentCell = [];
    let lastX = null;

    for (const item of line.items || []) {
      if (lastX !== null && item.x - lastX > 20) {
        cells.push(currentCell.map((c) => c.str).join(' ').trim());
        currentCell = [item];
      } else {
        currentCell.push(item);
      }
      lastX = item.x + item.width;
    }
    if (currentCell.length > 0) {
      cells.push(currentCell.map((c) => c.str).join(' ').trim());
    }
    return cells;
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r) =>
        new TableRow({
          children: r.map(
            (c) =>
              new TableCell({
                children: [new Paragraph({ text: c || '' })]
              })
          )
        })
    )
  });
}
