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

export const moduleMap = new Map(allModules.map((m) => [m.id, m]));
