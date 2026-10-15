/**
 * Module registry exporting all 13 tools
 */
import * as merge from './merge.js';
import * as split from './split.js';
import * as organize from './organize.js';
import * as sign from './sign.js';
import * as form from './form.js';
import * as redact from './redact.js';
import * as compress from './compress.js';
import * as ocr from './ocr.js';
import * as extractText from './extract-text.js';
import * as watermark from './watermark.js';
import * as pageNumbers from './page-numbers.js';
import * as pdfToImage from './pdf-to-image.js';
import * as imageToPdf from './image-to-pdf.js';
import * as unlock from './unlock.js';
import * as protect from './protect.js';
import * as pdfToMarkdown from './pdf-to-markdown.js';
import * as scanToPdf from './scan-to-pdf.js';
import * as htmlToPdf from './html-to-pdf.js';
import * as pdfToWord from './pdf-to-word.js';
import * as pdfToPowerpoint from './pdf-to-powerpoint.js';
import * as excelToPdf from './excel-to-pdf.js';
import * as wordToPdf from './word-to-pdf.js';
import * as editPdf from './edit-pdf.js';
import * as powerpointToPdf from './powerpoint-to-pdf.js';
import * as pdfToExcel from './pdf-to-excel.js';

export const allModules = [
  merge,
  split,
  organize,
  sign,
  form,
  redact,
  compress,
  ocr,
  extractText,
  watermark,
  pageNumbers,
  pdfToImage,
  imageToPdf
];
allModules.push(unlock);
allModules.push(protect);
allModules.push(pdfToMarkdown);
allModules.push(scanToPdf);
allModules.push(htmlToPdf);
allModules.push(pdfToWord);
allModules.push(pdfToPowerpoint);
allModules.push(excelToPdf);
allModules.push(wordToPdf);
allModules.push(editPdf);
allModules.push(powerpointToPdf);
allModules.push(pdfToExcel);

export const moduleMap = new Map(allModules.map((m) => [m.id, m]));
