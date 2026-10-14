# PDF To Go (PDFGO) - 100% Client-Side & Offline PDF Suite

A high-performance, private, and 100% offline-first PDF manipulation suite. Built with clean code, standard web APIs, zero backend servers, zero telemetry, and zero remote dependencies. Your documents never leave your local device.

---

## 🌟 Key Highlights

- **100% Client-Side & Offline:** Works natively over `file://` protocol or any static file server.
- **Strict Content Security Policy (CSP):** Hardware-enforced isolation (`default-src 'none'; script-src 'self' 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src blob: data:;`).
- **All-in-One Standalone Single File:** Fonts, WebAssembly engines, PDF.js & Tesseract workers are compressed and embedded into a single portable `.html` file.
- **Multi-File Batch Queue:** Process multiple files sequentially with isolated error boundaries. Download processed files individually or package them all into a single ZIP archive.
- **Bilingual Interface:** Seamless real-time switching between **Bahasa Indonesia (ID)** and **English (EN)**.
- **Adaptive Theme:** Smooth transitions between Dark, Light, and System OS preference modes (`prefers-color-scheme`).
- **WCAG AA Accessibility:** Full keyboard navigation (`Tab`, `Escape` to dismiss drawers and modals), high-contrast `:focus-visible` outlines, and `prefers-reduced-motion` compliance.

---

## 🛠️ Complete Tool Suite (13 Core Modules)

1. **Gabung PDF (Merge):** Combine multiple PDF documents into a unified file with drag-and-drop reordering.
2. **Pisah PDF (Split):** Extract arbitrary page ranges (e.g. `1-3, 5, 8-10`) or break documents into N-page batches directly or as a ZIP.
3. **Atur Halaman (Organize):** Visual thumbnail grid with drag-and-drop reordering, 90°/180°/270° rotation, and page deletion.
4. **Tanda Tangan Digital (Sign):** Draw freehand signatures, upload stamp/signature images with automatic background transparency removal, or type cursive signatures (*Dancing Script* & *Caveat*).
5. **Isi Formulir (Fill Form):** Automatically detect AcroForm fields (text boxes, checkboxes, dropdowns) with optional form flattening.
6. **Sensor Dokumen (Redact):** True permanent raster sanitization — redacted canvas areas are permanently cleared and restamped into the underlying PDF stream; all document metadata (Title, Author, Producer) is stripped.
7. **Kompres PDF (Compress):** Multi-level canvas compression with live reduction metrics (file size, percentage saved).
8. **Pengenalan Karakter OCR (Text Recognition):** Extract printed text and generate searchable PDFs with an invisible text layer (`opacity: 0`) using local Tesseract WASM with Indonesian and English language models.
9. **Ekstrak Teks (Extract Text):** Extract readable text with page headers and line preservation.
10. **Watermark:** Customizable diagonal, centered, or repeated text watermarks with adjustable angle, opacity, and font styling.
11. **Nomor Halaman (Page Numbers):** Stamp flexible numbering (`Halaman {n} dari {total}`) across 9 position alignments with custom margins.
12. **PDF ke Gambar (PDF to Image):** Render pages to high-resolution PNG or JPEG images packaged into a ZIP archive.
13. **Gambar ke PDF (Image to PDF):** Convert images (PNG, JPG, WebP) to PDF with configurable page size (A4, Letter, Auto), margins, and orientation.

---

## 📦 Build Variants (Full vs. Lite)

PDF Toolkit is distributed in two editions to accommodate different storage and deployment requirements:

| Feature | Full Edition (`PDF Toolkit.html`) | Lite Edition (`PDF Toolkit Lite.html`) |
| :--- | :--- | :--- |
| **File Size** | **~6.78 MB** | **~3.48 MB** |
| **12 Core PDF Tools** | ✅ Pre-loaded & Ready | ✅ Pre-loaded & Ready |
| **Tesseract WASM Engine** | ✅ Embedded | ✅ Embedded |
| **OCR Bahasa Indonesia (`ind`)** | ✅ Embedded out-of-the-box | 📥 Import local `.traineddata` |
| **OCR English (`eng`)** | ✅ Embedded out-of-the-box | 📥 Import local `.traineddata` |
| **Ideal For** | Complete offline use with zero setup | Ultra-lightweight distribution & low bandwidth |

### How to Import OCR Models in Lite Edition
1. Open `dist/PDF Toolkit Lite.html` in your browser.
2. Select **Pengenalan Teks (OCR)** in the navigation sidebar.
3. Under the language model selector, click **"Impor Berkas Model (.traineddata)"**.
4. Choose your local `ind.traineddata` or `eng.traineddata` file (uncompressed or `.gz`).
5. The model is validated and cached securely in your browser's private **IndexedDB**. Future OCR operations will recognize and use the imported model immediately without asking again.

---

## 🚀 Quick Start & Usage

### Running Directly (No Installation Required)
Simply double-click or open either HTML file directly:
```bash
# Full Edition
open "dist/PDF Toolkit.html"

# Lite Edition
open "dist/PDF Toolkit Lite.html"
```

### Development & Build Commands

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run test suite (26 pure unit tests):**
   ```bash
   npm test
   ```

3. **Build standalone distribution files:**
   ```bash
   # Build all variants (Full and Lite)
   npm run build

   # Build Full edition only
   npm run build:full

   # Build Lite edition only
   npm run build:lite
   ```

4. **Run automated release pipeline:**
   ```bash
   npm run release
   ```
   *Runs tests, builds all variants, verifies zero-network leaks, captures automated promotional screenshots via headless Chrome, and packages `dist/release/PDF-Toolkit-v1.0.0.zip`.*

5. **Start conflict-free local development server:**
   ```bash
   npm run serve
   ```
   *Automatically scans from port 3000 to 3050 to avoid any local port collisions.*

---

## 🔒 Security & Privacy Architecture

- **No Remote Calls:** External `<script src>` and `<link href>` tags are prohibited. The build system fails immediately if any unauthorized external URLs are detected.
- **Worker & WASM Isolation:** Web Workers and WebAssembly binaries are decoded from compressed byte arrays in memory and instantiated via dynamic `Blob` URLs (`blob:`), complying with strict CSP policies without touching disk or network.
- **Memory Management:** Every canvas, object URL (`URL.revokeObjectURL`), and intermediate ArrayBuffer is explicitly reclaimed after processing to prevent browser tab crashes during long sessions.

---

## 📄 License
ISC License. 100% Free and Open Source.
