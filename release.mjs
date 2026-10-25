/**
 * release.mjs - Automated Offline Release Pipeline & Verification
 * 1. Runs unit test suite
 * 2. Builds all standalone variants (Full & Lite)
 * 3. Captures automated high-resolution screenshots via headless Chrome
 * 4. Packages final distribution ZIP archive with README and documentation
 * 5. Verifies archive integrity and calculates SHA-256 checksums
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import * as fflate from 'fflate';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.resolve('dist');
const RELEASE_DIR = path.join(DIST_DIR, 'release');
const SCREENSHOTS_DIR = path.join(DIST_DIR, 'screenshots');
const VERSION = '1.0.0';
const RELEASE_ZIP_NAME = `PDF-Toolkit-v${VERSION}.zip`;

console.log(`\n========================================================`);
console.log(`   PDF TOOLKIT (PDFGO) - AUTOMATED RELEASE PIPELINE    `);
console.log(`   Version: v${VERSION}                                `);
console.log(`========================================================\n`);

// Step 1: Run unit tests
console.log(`[Step 1/5] Running automated unit test suite...`);
try {
  const testOutput = execSync('npm test', { stdio: 'pipe', encoding: 'utf8' });
  console.log(`✔ All unit tests passed successfully.`);
} catch (err) {
  console.error(`✖ Unit tests failed! Release aborted.`);
  console.error(err.stdout || err.stderr || err.message);
  process.exit(1);
}

// Step 2: Build all variants
console.log(`\n[Step 2/5] Building all standalone variants (Full & Lite)...`);
try {
  execSync('node build.mjs --variant=all', { stdio: 'inherit' });
  console.log(`✔ Build finished and zero-network check passed.`);
} catch (err) {
  console.error(`✖ Build failed! Release aborted.`);
  process.exit(1);
}

// Step 3: Capture automated screenshots via Headless Chrome
console.log(`\n[Step 3/5] Capturing automated UI screenshots...`);
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function findChromeBinary() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const defaultMacPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (fs.existsSync(defaultMacPath)) {
    return defaultMacPath;
  }
  // Try locating google-chrome or chromium in PATH
  try {
    const whichChrome = execSync('which google-chrome || which chromium', { encoding: 'utf8' }).trim();
    if (whichChrome && fs.existsSync(whichChrome)) return whichChrome;
  } catch (e) {}
  return null;
}

const chromeBinary = findChromeBinary();

const screenshotsToCapture = [
  {
    name: 'screenshot-light-id.png',
    file: 'dist/PDF Toolkit.html',
    params: '?theme=light&lang=id',
    label: 'Full Edition - Mode Terang (ID)'
  },
  {
    name: 'screenshot-dark-id.png',
    file: 'dist/PDF Toolkit.html',
    params: '?theme=dark&lang=id',
    label: 'Full Edition - Mode Gelap (ID)'
  },
  {
    name: 'screenshot-light-en.png',
    file: 'dist/PDF Toolkit.html',
    params: '?theme=light&lang=en',
    label: 'Full Edition - Light Mode (EN)'
  },
  {
    name: 'screenshot-lite-id.png',
    file: 'dist/PDF Toolkit Lite.html',
    params: '?theme=light&lang=id',
    windowSize: '1280,800',
    label: 'Lite Edition - Mode Terang (ID)'
  },
  {
    name: 'screenshot-mobile-id.png',
    file: 'dist/PDF Toolkit.html',
    params: '?theme=light&lang=id',
    windowSize: '500,800',
    label: 'Mobile Edition - Mode Terang (ID)'
  }
];

if (chromeBinary) {
  for (const s of screenshotsToCapture) {
    const outPath = path.join(SCREENSHOTS_DIR, s.name);
    const targetUrl = `file://${path.resolve(s.file)}${s.params}`;
    const winSize = s.windowSize || '1280,800';
    console.log(`  📸 Capturing: ${s.label} -> dist/screenshots/${s.name}`);
    try {
      execSync(`"${chromeBinary}" --headless=new --screenshot="${outPath}" --window-size=${winSize} --hide-scrollbars "${targetUrl}"`, {
        stdio: ['ignore', 'ignore', 'ignore']
      });
      const stat = fs.statSync(outPath);
      console.log(`     ✔ Saved ${(stat.size / 1024).toFixed(1)} KB`);
    } catch (err) {
      console.warn(`     ⚠ Could not capture ${s.name}: ${err.message}`);
    }
  }
} else {
  console.warn(`⚠ Google Chrome not found. Skipping automated screenshot capture.`);
}

// Step 4: Package final release ZIP
console.log(`\n[Step 4/5] Packaging final distribution ZIP archive...`);
if (!fs.existsSync(RELEASE_DIR)) {
  fs.mkdirSync(RELEASE_DIR, { recursive: true });
}

const zipPayload = {};

// 4a. Standalone HTML files
const fullHtmlPath = path.join(DIST_DIR, 'PDF Toolkit.html');
const liteHtmlPath = path.join(DIST_DIR, 'PDF Toolkit Lite.html');
const readmePath = path.resolve('README.md');

if (!fs.existsSync(fullHtmlPath) || !fs.existsSync(liteHtmlPath)) {
  console.error(`✖ Standalone HTML files missing in dist!`);
  process.exit(1);
}

zipPayload['PDF Toolkit.html'] = new Uint8Array(fs.readFileSync(fullHtmlPath));
zipPayload['PDF Toolkit Lite.html'] = new Uint8Array(fs.readFileSync(liteHtmlPath));

if (fs.existsSync(readmePath)) {
  zipPayload['README.md'] = new Uint8Array(fs.readFileSync(readmePath));
}

// 4b. Documentation Screenshots
for (const s of screenshotsToCapture) {
  const scPath = path.join(SCREENSHOTS_DIR, s.name);
  if (fs.existsSync(scPath)) {
    zipPayload[`screenshots/${s.name}`] = new Uint8Array(fs.readFileSync(scPath));
  }
}

// 4c. Compress using fflate
const zipBytes = fflate.zipSync(zipPayload, { level: 6 });
const releaseZipPath = path.join(RELEASE_DIR, RELEASE_ZIP_NAME);
fs.writeFileSync(releaseZipPath, zipBytes);

// Step 5: Verification & Integrity Check
console.log(`\n[Step 5/5] Verifying archive integrity and calculating checksums...`);
const unzippedCheck = fflate.unzipSync(zipBytes);
const archivedFiles = Object.keys(unzippedCheck);

const hash = crypto.createHash('sha256').update(zipBytes).digest('hex');
const zipStat = fs.statSync(releaseZipPath);

console.log(`\n======================================================`);
console.log(`             RELEASE COMPLETED SUCCESSFULLY            `);
console.log(`======================================================`);
console.log(`Archive:       dist/release/${RELEASE_ZIP_NAME}`);
console.log(`Archive Size:  ${(zipStat.size / 1024 / 1024).toFixed(2)} MB (${(zipStat.size / 1024).toFixed(0)} KB)`);
console.log(`SHA-256:       ${hash}`);
console.log(`\nPackaged Files (${archivedFiles.length}):`);
for (const f of archivedFiles) {
  const size = unzippedCheck[f].length;
  console.log(`  - ${f.padEnd(35)} ${(size / 1024).toFixed(1)} KB`);
}

console.log(`\nRelease is 100% offline-ready for direct user deployment!\n`);
console.log(`Distribusi: upload ZIP ke GitHub Releases (repo tidak menyimpan dist/), contoh:`);
console.log(`  gh release create v${VERSION} "dist/release/${RELEASE_ZIP_NAME}#PDF Toolkit v${VERSION} (Full & Lite)" --title "PDF Toolkit v${VERSION}"\n`);
