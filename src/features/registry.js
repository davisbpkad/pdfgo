/**
 * Tool registry: the single source of truth for the sidebar.
 * Every tool's metadata (id, titleKey, descKey, icon) and component live in
 * its own feature folder, so this file only lists them in menu order.
 */
import * as merge from './merge/index.js';
import * as split from './split/index.js';
import * as organize from './organize/index.js';
import * as sign from './sign/index.js';
import * as form from './form/index.js';
import * as redact from './redact/index.js';
import * as compress from './compress/index.js';
import * as ocr from './ocr/index.js';
import * as extractText from './extract-text/index.js';
import * as watermark from './watermark/index.js';
import * as pageNumbers from './page-numbers/index.js';
import * as pdfToImage from './pdf-to-image/index.js';
import * as imageToPdf from './image-to-pdf/index.js';
import * as unlock from './unlock/index.js';
import * as protect from './protect/index.js';
import * as pdfToMarkdown from './pdf-to-markdown/index.js';
import * as scanToPdf from './scan-to-pdf/index.js';
import * as htmlToPdf from './html-to-pdf/index.js';
import * as pdfToWord from './pdf-to-word/index.js';
import * as pdfToPowerpoint from './pdf-to-powerpoint/index.js';
import * as excelToPdf from './excel-to-pdf/index.js';
import * as wordToPdf from './word-to-pdf/index.js';
import * as editPdf from './edit-pdf/index.js';
import * as powerpointToPdf from './powerpoint-to-pdf/index.js';
import * as pdfToExcel from './pdf-to-excel/index.js';
import * as aiSummary from './ai-summary/index.js';

export const allModules = [
  merge, split, organize, sign, form, redact, compress, ocr, extractText,
  watermark, pageNumbers, pdfToImage, imageToPdf, unlock, protect,
  pdfToMarkdown, scanToPdf, htmlToPdf, pdfToWord, pdfToPowerpoint, excelToPdf,
  wordToPdf, editPdf, powerpointToPdf, pdfToExcel, aiSummary
];

export const moduleMap = new Map(allModules.map((m) => [m.id, m]));
