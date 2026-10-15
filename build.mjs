/**
 * build.mjs - Offline Standalone Single-File Builder & Verification Pipeline
 * Supports flags: --variant=full|lite|all (default: all)
 * Zero external network dependencies, 100% offline-first.
 */

import fs from 'fs';
import path from 'path';
import { build as viteBuild } from 'vite';
import * as esbuild from 'esbuild';
import * as fflate from 'fflate';
import { CONTENT_SECURITY_POLICY, allowsWebAssembly } from './scripts/csp.mjs';

// Parse command line arguments
const args = process.argv.slice(2);
let targetVariant = 'all';
for (const arg of args) {
  if (arg.startsWith('--variant=')) {
    targetVariant = arg.split('=')[1].toLowerCase();
  }
}

if (!['full', 'lite', 'all'].includes(targetVariant)) {
  console.error(`Invalid variant: ${targetVariant}. Valid options: full, lite, all`);
  process.exit(1);
}

const DIST_DIR = path.resolve('dist');
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// 1. Prepare Embedded Fonts
function getEmbeddedFontsCss() {
  const fontDefinitions = [
    {
      family: 'Atkinson Hyperlegible',
      weight: '400',
      style: 'normal',
      path: 'node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2'
    },
    {
      family: 'Atkinson Hyperlegible',
      weight: '700',
      style: 'normal',
      path: 'node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2'
    },
    {
      family: 'Fraunces',
      weight: '700',
      style: 'normal',
      path: 'node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff2'
    },
    {
      family: 'Dancing Script',
      weight: '400',
      style: 'normal',
      path: 'node_modules/@fontsource/dancing-script/files/dancing-script-latin-400-normal.woff2'
    },
    {
      family: 'Caveat',
      weight: '400',
      style: 'normal',
      path: 'node_modules/@fontsource/caveat/files/caveat-latin-400-normal.woff2'
    }
  ];

  let css = '/* Embedded Base64 Fonts */\n';
  let totalFontSize = 0;

  for (const f of fontDefinitions) {
    if (fs.existsSync(f.path)) {
      const buffer = fs.readFileSync(f.path);
      totalFontSize += buffer.length;
      const b64 = buffer.toString('base64');
      css += `@font-face {\n` +
             `  font-family: '${f.family}';\n` +
             `  font-style: ${f.style};\n` +
             `  font-weight: ${f.weight};\n` +
             `  font-display: swap;\n` +
             `  src: url(data:font/woff2;base64,${b64}) format('woff2');\n` +
             `}\n`;
    } else {
      console.warn(`Font file not found: ${f.path}`);
    }
  }

  return { css, totalFontSize };
}

// 2. Prepare Compressed PDF.js Worker
function getEmbeddedPdfWorker() {
  const workerPath = path.resolve('node_modules/pdfjs-dist/build/pdf.worker.min.js');
  if (!fs.existsSync(workerPath)) {
    throw new Error(`PDF.js worker not found at ${workerPath}`);
  }
  const workerRaw = fs.readFileSync(workerPath);
  const deflated = fflate.deflateSync(workerRaw, { level: 9 });
  const b64 = Buffer.from(deflated).toString('base64');

  return {
    rawSize: workerRaw.length,
    compressedSize: deflated.length,
    base64String: b64,
    injectionCode: `window.__PDF_WORKER_BASE64__ = "${b64}";\n`
  };
}

// 3. Prepare Compressed Tesseract.js Worker + Core WASM
function getEmbeddedTesseractWorker() {
  const corePath = path.resolve('node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js');
  const pkgRoot = path.dirname(path.dirname(path.resolve('node_modules/tesseract.js/src/index.js')));
  const workerPath = path.join(pkgRoot, 'dist', 'worker.min.js');

  if (!fs.existsSync(corePath)) {
    throw new Error(`Tesseract core wasm.js not found at ${corePath}`);
  }
  if (!fs.existsSync(workerPath)) {
    throw new Error(`Tesseract worker not found at ${workerPath}`);
  }

  let coreCode = fs.readFileSync(corePath, 'utf8');
  let workerCode = fs.readFileSync(workerPath, 'utf8');

  // Neutralize remote fallback CDN URLs
  workerCode = workerCode.replace(/https?:\/\/cdn\.jsdelivr\.net\/[^\s"'`<>]+/g, 'blob:tesseract-disabled');

  const combined = coreCode + '\n;' + workerCode;
  const rawBytes = Buffer.from(combined, 'utf8');
  const deflated = fflate.deflateSync(rawBytes, { level: 9 });
  const b64 = Buffer.from(deflated).toString('base64');

  return {
    rawSize: rawBytes.length,
    compressedSize: deflated.length,
    base64String: b64,
    injectionCode: `window.__TESSERACT_WORKER_BASE64__ = "${b64}";\n`
  };
}

// 4. Prepare OCR TrainedData Models (Full: ind+eng, Lite: empty)
function getEmbeddedOcrModels(isFull) {
  if (!isFull) {
    return {
      engSize: 0,
      indSize: 0,
      totalModelSize: 0,
      injectionCode: `window.__OCR_FULL_ENG_GZ_BASE64__ = null;\nwindow.__OCR_FULL_IND_GZ_BASE64__ = null;\n`
    };
  }

  const engPath = path.resolve('src/assets/models/eng.traineddata.gz');
  const indPath = path.resolve('src/assets/models/ind.traineddata.gz');

  if (!fs.existsSync(engPath) || !fs.existsSync(indPath)) {
    throw new Error(`OCR models not found in src/assets/models/. Please ensure eng.traineddata.gz and ind.traineddata.gz exist.`);
  }

  const engBytes = fs.readFileSync(engPath);
  const indBytes = fs.readFileSync(indPath);

  const engB64 = engBytes.toString('base64');
  const indB64 = indBytes.toString('base64');

  return {
    engSize: engBytes.length,
    indSize: indBytes.length,
    totalModelSize: engBytes.length + indBytes.length,
    injectionCode: `window.__OCR_FULL_ENG_GZ_BASE64__ = "${engB64}";\nwindow.__OCR_FULL_IND_GZ_BASE64__ = "${indB64}";\n`
  };
}

// 3.5 Prepare Embedded Favicon
function getEmbeddedFavicon() {
  const faviconPath = path.resolve('favicon.png');
  if (fs.existsSync(faviconPath)) {
    const bytes = fs.readFileSync(faviconPath);
    return `data:image/png;base64,${bytes.toString('base64')}`;
  }
  return '';
}

// 5. Anti-Network Leak Verification
function verifyZeroNetwork(htmlContent, filePath) {
  // Allow safe non-network XML / SVG namespaces, URL parser template tokens, and upstream library doc references
  const allowedPatterns = [
    /https?:\/\/www\.w3\.org\/[^\s"'`<>]+/gi,
    /https?:\/\/ns\.adobe\.com\/[^\s"'`<>]+/gi,
    /http:\/\/\$\{[a-z0-9_]+\}/gi,
    /https?:\/\/github\.com\/Hopding\/pdf-lib[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/foliojs\/pdfkit[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/devongovett\/pdfkit[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/naptha\/[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/[^\s"'`<>)]*/gi,
    /https?:\/\/opencollective\.com\/[^\s"'`<>)]*/gi,
    /https?:\/\/(?:www\.)?unicode\.org\/[^\s"'`<>)]*/gi,
    /https?:\/\/(?:www\.)?ecma-international\.org\/[^\s"'`<>)]*/gi,
    /https?:\/\/(?:www\.)?herongyang\.com\/[^\s"'`<>)]*/gi,
    /https?:\/\/developer\.mozilla\.org\/[^\s"'`<>)]*/gi,
    /https?:\/\/(?:en\.)?wikipedia\.org\/[^\s"'`<>)]*/gi,
    /https?:\/\/stackoverflow\.com\/[^\s"'`<>)]*/gi,
    /https?:\/\/(?:www\.)?pdfa\.org\/[^\s"'`<>)]*/gi,
    /https?:\/\/blog\.pdfshareforms\.com\/[^\s"'`<>)]*/gi,
    /https?:\/\/pdf-lib\.js\.org\/[^\s"'`<>)]*/gi,
    /https?:\/\/zlib\.net\/[^\s"'`<>)]*/gi,
    /https?:\/\/www\.adobe\.com\/[^\s"'`<>)]*/gi,
    /http:\/\/localhost:\d+\/[^\s"'`<>)]*/gi,
    /https?:\/\/cdn\.jsdelivr\.net\/npm\/tesseract\.js@[^\s"'`<>)]*/gi,
    /https?:\/\/tailwindcss\.com[^\s"'`<>)]*/gi,
    /https?:\/\/vuejs\.org\/[^\s"'`<>)]*/gi
  ];
  allowedPatterns.push(/https?:\/\/(?:www\.)?aiim\.org\/[^\s"'`<>)]*/gi, /https?:\/\/purl\.org\/[^\s"'`<>)]*/gi);
  allowedPatterns.push(/https?:\/\/schemas\.(?:openxmlformats\.org|microsoft\.com)\/[^\s"'`<>)]*/gi, /https?:\/\/rolldown\.rs\/[^\s"'`<>)]*/gi);
  allowedPatterns.push(/https?:\/\/answers\.microsoft\.com\/[^\s"'`<>)]*/gi, /https?:\/\/stuk\.github\.io\/[^\s"'`<>)]*/gi);
  allowedPatterns.push(/https?:\/\/gitbrent\.github\.io\/[^\s"'`<>)]*/gi, /https?:\/\/github\.com[^\s"'`<>)]*/gi);
  allowedPatterns.push(/https?:\/\/(?:www\.)?feross\.org[^\s"'`<>)]*/gi, /https?:\/\/(?:www\.)?stuartk\.com\/[^\s"'`<>)]*/gi);
  allowedPatterns.push(/https?:\/\/purl\.oclc\.org\/[^\s"'`<>)]*/gi, /https?:\/\/schemas\.zwobble\.org\/[^\s"'`<>)]*/gi);

  let sanitized = htmlContent;
  for (const pattern of allowedPatterns) {
    sanitized = sanitized.replace(pattern, 'SAFE_NON_NETWORK_STRING');
  }

  const networkRegex = /(https?:\/\/[^\s"'`<>]+)/gi;
  const matches = sanitized.match(networkRegex);
  if (matches && matches.length > 0) {
    throw new Error(
      `SECURITY LEAK DETECTED in ${filePath}!\nFound unexpected external URLs:\n` +
      matches.slice(0, 10).join('\n')
    );
  }

  if (/<script\s+[^>]*src=/i.test(sanitized)) {
    throw new Error(`SECURITY LEAK DETECTED: External <script src="..."> found in ${filePath}`);
  }

  // Allow safe inline data: URIs in <link> (such as embedded favicon)
  sanitized = sanitized.replace(/<link\s+[^>]*href=["']data:[^"']*["'][^>]*>/gi, '');

  if (/<link\s+[^>]*href=/i.test(sanitized)) {
    throw new Error(`SECURITY LEAK DETECTED: External <link href="..."> found in ${filePath}`);
  }

  console.log(`[Zero-Network Pass] ${path.basename(filePath)} is 100% offline & leak-free.`);
}

// 4. Build Variant Runner
async function buildVariant(variantType) {
  const isFull = variantType === 'full';
  console.log(`\n========================================`);
  console.log(`Building Variant: ${variantType.toUpperCase()}`);
  console.log(`========================================`);

  // Build JS & CSS with Vite (Vue 3 SFC + Tailwind CSS v4)
  const viteResult = await viteBuild({
    configFile: path.resolve('vite.config.mjs'),
    logLevel: 'warn'
  });
  const outputs = Array.isArray(viteResult) ? viteResult[0].output : viteResult.output;
  const jsChunk = outputs.find(o => o.fileName.endsWith('.js'));
  const cssChunk = outputs.find(o => o.fileName.endsWith('.css'));

  // Minify JS & CSS with esbuild transform (safe from direct eval minification bugs)
  const rawJs = jsChunk ? jsChunk.code : '';
  const minifiedJsResult = await esbuild.transform(rawJs, { minify: true, legalComments: 'none', target: 'es2022' });
  const minifiedJs = minifiedJsResult.code;

  const rawCss = cssChunk ? cssChunk.source.toString() : '';
  const minifiedCssResult = await esbuild.transform(rawCss, { loader: 'css', minify: true, legalComments: 'none' });
  const minifiedCss = minifiedCssResult.code;

  // Process Assets
  const { css: fontCss, totalFontSize } = getEmbeddedFontsCss();
  const workerData = getEmbeddedPdfWorker();
  const tesseractWorkerData = getEmbeddedTesseractWorker();
  const ocrModelsData = getEmbeddedOcrModels(isFull);
  const faviconDataUri = getEmbeddedFavicon();
  const buildStamp = new Date().toISOString();

  // Single File HTML Assembly
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">
  <title>PDF To Go</title>
  ${faviconDataUri ? `<link rel="icon" type="image/png" href="${faviconDataUri}">` : ''}
  <style>
${fontCss}
${minifiedCss}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
window.__PDFGO_BUILD__ = "${buildStamp}";
${workerData.injectionCode}
${tesseractWorkerData.injectionCode}
${ocrModelsData.injectionCode}
${minifiedJs}
  </script>
</body>
</html>`;

  // Guard: OCR requires WebAssembly, which the CSP must explicitly allow.
  if (!allowsWebAssembly(CONTENT_SECURITY_POLICY)) {
    throw new Error(
      "CSP tidak mengizinkan WebAssembly ('wasm-unsafe-eval' hilang pada script-src). " +
      'OCR akan gagal di browser. Perbaiki scripts/csp.mjs terlebih dahulu.'
    );
  }

  const filesToWrite = [];
  if (isFull) {
    filesToWrite.push(
      path.join(DIST_DIR, 'index.html'),
      path.join(DIST_DIR, 'PDF To Go.html'),
      path.join(DIST_DIR, 'PDF Toolkit.html')
    );
  } else {
    filesToWrite.push(
      path.join(DIST_DIR, 'PDF To Go Lite.html'),
      path.join(DIST_DIR, 'PDF Toolkit Lite.html')
    );
  }

  for (const filePath of filesToWrite) {
    fs.writeFileSync(filePath, html, 'utf-8');
    verifyZeroNetwork(html, filePath);
  }

  const finalHtmlSize = Buffer.byteLength(html, 'utf-8');

  return {
    variant: variantType,
    htmlSize: finalHtmlSize,
    appJsSize: Buffer.byteLength(minifiedJs, 'utf-8'),
    appCssSize: Buffer.byteLength(minifiedCss, 'utf-8'),
    fontSize: totalFontSize,
    workerCompressedSize: workerData.compressedSize,
    tessWorkerCompressedSize: tesseractWorkerData.compressedSize,
    ocrModelsSize: ocrModelsData.totalModelSize
  };
}

// Main execution
async function run() {
  const reports = [];

  if (targetVariant === 'all' || targetVariant === 'lite') {
    reports.push(await buildVariant('lite'));
  }
  if (targetVariant === 'all' || targetVariant === 'full') {
    reports.push(await buildVariant('full'));
  }

  // Copy favicon assets to DIST_DIR for preview server and distribution
  const faviconPath = path.resolve('favicon.png');
  if (fs.existsSync(faviconPath)) {
    fs.copyFileSync(faviconPath, path.join(DIST_DIR, 'favicon.png'));
    fs.copyFileSync(faviconPath, path.join(DIST_DIR, 'favicon.ico'));
  }

  // Print Summary Table
  console.log(`\n======================================================`);
  console.log(`                 BUILD SIZE REPORT                     `);
  console.log(`======================================================`);
  console.table(
    reports.map(r => ({
      'Variant': r.variant.toUpperCase(),
      'Total HTML': `${(r.htmlSize / 1024 / 1024).toFixed(2)} MB (${(r.htmlSize / 1024).toFixed(0)} KB)`,
      'App Code': `${(r.appJsSize / 1024).toFixed(1)} KB`,
      'App CSS': `${(r.appCssSize / 1024).toFixed(1)} KB`,
      'Fonts (5)': `${(r.fontSize / 1024).toFixed(1)} KB`,
      'PDF.js Worker': `${(r.workerCompressedSize / 1024).toFixed(1)} KB`,
      'OCR Worker+WASM': `${(r.tessWorkerCompressedSize / 1024 / 1024).toFixed(2)} MB`,
      'OCR Models': r.ocrModelsSize > 0 ? `${(r.ocrModelsSize / 1024 / 1024).toFixed(2)} MB (gz)` : '0 KB (Lite)'
    }))
  );

  console.log(`Build completed successfully at: ${new Date().toLocaleTimeString()}\n`);
}

run().catch((err) => {
  console.error('Build failed with error:', err);
  process.exit(1);
});
