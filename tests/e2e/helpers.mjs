/**
 * helpers.mjs - Shared browser-test helpers.
 *
 * The exported `test` wraps the built-in one so every test fails if the page
 * throws an uncaught error, which is how the edit-pdf load bug surfaced.
 */
import fs from 'node:fs';
import { test as base, expect } from '@playwright/test';
import { unzipSync } from 'fflate';
import ExcelJS from 'exceljs';
import mammoth from 'mammoth';
import { PDFDocument, PDFName } from 'pdf-lib';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../src/core/pdf.js';

export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await use(page);
    expect(errors, 'the page threw an uncaught error').toEqual([]);
  }
});

export { expect };

/** Open a tool route on a clean document. */
export async function openTool(page, route) {
  await page.goto(`/#${route}`);
  await page.reload();
  await expect(page.locator('main h1')).toHaveCount(1);
}

/** Upload files through the tool's own file input (matched by accept). */
export async function upload(page, files, accept = '.pdf') {
  const input = page.locator(`main input[type=file][accept*="${accept}"]`).first();
  await expect(input, `no file input accepting ${accept}`).toHaveCount(1);
  await input.setInputFiles(files);
}

/** A button inside the tool area (not the sidebar or the header). */
export function mainButton(page, name) {
  return page.locator('main').getByRole('button', { name }).first();
}

/** Click a button and return the download it triggers. */
export async function clickAndDownload(page, name) {
  const [download] = await Promise.all([
    // Shorter than the test timeout so a missing download reports itself clearly.
    page.waitForEvent('download', { timeout: 25000 }),
    mainButton(page, name).click()
  ]);
  return download;
}

/** Click a button that starts a step without downloading anything yet. */
export async function clickButton(page, name) {
  await mainButton(page, name).click();
}

export async function downloadBytes(download) {
  return new Uint8Array(fs.readFileSync(await download.path()));
}

/** Page count plus extracted text of a PDF. */
export async function pdfInfo(bytes) {
  const doc = unwrapPdfProxy(await loadPdfJsDocument(bytes));
  let text = '';
  const rotations = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    rotations.push(page.rotate);
    const content = await page.getTextContent();
    text += content.items.map((i) => i.str).join(' ') + '\n';
  }
  return { pages: doc.numPages, text, rotations };
}

export function zipEntries(bytes) {
  return Object.keys(unzipSync(bytes));
}

/** How many image XObjects the PDF embeds (compressed pages become images). */
export async function countImageXObjects(bytes) {
  const doc = await PDFDocument.load(bytes);
  let images = 0;
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    const subtype = obj?.dict?.get?.(PDFName.of('Subtype'));
    if (subtype && subtype.toString() === '/Image') images++;
  }
  return images;
}

/** Current value of a named AcroForm text field. */
export async function pdfTextFieldValue(bytes, name) {
  const doc = await PDFDocument.load(bytes);
  return doc.getForm().getTextField(name).getText();
}

/** Wait until a tool has finished loading its file (its action button appears). */
export async function waitLoaded(page, actionName) {
  await expect(mainButton(page, actionName)).toBeEnabled({ timeout: 60000 });
}

/** Width and height from a PNG's IHDR chunk. */
export function pngSize(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

export async function xlsxSheetText(bytes) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes);
  const out = [];
  wb.eachSheet((sheet) => {
    sheet.eachRow((row) => out.push(row.values.filter(Boolean).join(' | ')));
  });
  return out.join('\n');
}

export async function docxText(bytes) {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return result.value;
}

/** Count the slides inside a PPTX package. */
export function pptxSlideCount(bytes) {
  return zipEntries(bytes).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length;
}
