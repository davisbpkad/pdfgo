import ExcelJS from 'exceljs';

/**
 * Parse plain CSV text into 2D array of string cells
 * @param {string} text
 * @returns {Array<Array<string>>}
 */
export function parseCsvText(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentVal += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some((c) => c !== '')) rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== '')) rows.push(currentRow);
  }

  return rows;
}

/**
 * Extract sheets and tabular rows from an XLSX or CSV buffer
 * @param {ArrayBuffer | Uint8Array} buffer
 * @param {string} [fileName='']
 * @returns {Promise<Array<{ name: string, rows: Array<Array<string>> }>>}
 */
export async function readWorkbook(buffer, fileName = '') {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Berkas spreadsheet kosong atau tidak valid.');
  }

  const isCsv = fileName.toLowerCase().endsWith('.csv');
  if (isCsv) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    const rows = parseCsvText(text);
    return [{ name: 'Sheet1', rows }];
  }

  const Pkg = ExcelJS.default || ExcelJS;
  const workbook = new Pkg.Workbook();
  const safeBytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const arrayBuf = safeBytes.buffer.slice(safeBytes.byteOffset, safeBytes.byteOffset + safeBytes.byteLength);
  await workbook.xlsx.load(arrayBuf);

  const sheets = [];
  workbook.eachSheet((worksheet) => {
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowValues = [];
      const maxCol = row.cellCount || worksheet.columnCount || 1;
      for (let c = 1; c <= maxCol; c++) {
        const cell = row.getCell(c);
        let val = '';
        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object') {
            if (cell.value.text) val = String(cell.value.text);
            else if (cell.value.result !== undefined) val = String(cell.value.result);
            else if (cell.value.richText) val = cell.value.richText.map((t) => t.text).join('');
            else if (cell.value instanceof Date) val = cell.value.toLocaleDateString();
            else val = String(cell.text || '');
          } else {
            val = String(cell.value);
          }
        }
        rowValues.push(val);
      }
      if (rowValues.some((v) => v !== '')) {
        rows.push(rowValues);
      }
    });

    if (rows.length > 0) {
      sheets.push({
        name: worksheet.name || `Sheet${sheets.length + 1}`,
        rows
      });
    }
  });

  if (sheets.length === 0) {
    throw new Error('Tidak ada data baris yang ditemukan dalam berkas Excel.');
  }

  return sheets;
}
