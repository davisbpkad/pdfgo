/**
 * build.mjs - Offline Standalone Single-File Builder & Verification Pipeline
 * Supports flags: --variant=full|lite|all (default: all)
 * Zero external network dependencies, 100% offline-first.
 */

import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';
import * as fflate from 'fflate';

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

// 3. Anti-Network Leak Verification
function verifyZeroNetwork(htmlContent, filePath) {
  // Allow safe non-network XML / SVG namespaces, URL parser template tokens, and upstream library doc references
  const allowedPatterns = [
    /https?:\/\/www\.w3\.org\/[^\s"'`<>]+/gi,
    /https?:\/\/ns\.adobe\.com\/[^\s"'`<>]+/gi,
    /http:\/\/\$\{[a-z0-9_]+\}/gi,
    /https?:\/\/github\.com\/Hopding\/pdf-lib[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/foliojs\/pdfkit[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/devongovett\/pdfkit[^\s"'`<>)]*/gi,
    /https?:\/\/github\.com\/[^\s"'`<>)]*/gi,
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
    /https?:\/\/www\.adobe\.com\/[^\s"'`<>)]*/gi
  ];

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

  // Build CSS
  const cssResult = await esbuild.build({
    entryPoints: ['src/styles/main.css'],
    bundle: true,
    write: false,
    legalComments: 'none',
    minify: true
  });
  const minifiedCss = cssResult.outputFiles[0].text;

  // Build JS
  const jsResult = await esbuild.build({
    entryPoints: ['src/main.js'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'PDFGoApp',
    target: 'es2022',
    legalComments: 'none',
    minify: true
  });
  const minifiedJs = jsResult.outputFiles[0].text;

  // Process Assets
  const { css: fontCss, totalFontSize } = getEmbeddedFontsCss();
  const workerData = getEmbeddedPdfWorker();

  // Single File HTML Assembly
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src blob: data:;">
  <title>PDF Toolkit - 100% Offline</title>
  <style>
${fontCss}
${minifiedCss}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
${workerData.injectionCode}
${minifiedJs}
  </script>
</body>
</html>`;

  const filesToWrite = [];
  if (isFull) {
    filesToWrite.push(
      path.join(DIST_DIR, 'index.html'),
      path.join(DIST_DIR, 'PDF Toolkit.html')
    );
  } else {
    filesToWrite.push(
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
    workerRawSize: workerData.rawSize
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
      'PDF.js Worker': `${(r.workerCompressedSize / 1024).toFixed(1)} KB (compressed)`
    }))
  );

  console.log(`Build completed successfully at: ${new Date().toLocaleTimeString()}\n`);
}

run().catch((err) => {
  console.error('Build failed with error:', err);
  process.exit(1);
});
