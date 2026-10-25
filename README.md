# PDF To Go (PDFGO) - 100% Client-Side & Offline PDF Suite

A high-performance, private, and 100% offline-first PDF manipulation suite with a modern Neo-Brutalist aesthetic. Built with Vue 3, clean code architecture, standard web APIs, zero backend servers, zero telemetry, and zero remote dependencies. Your documents never leave your local device.

---

## 🌟 Key Highlights

- **100% Client-Side & Offline:** Works natively over `file://` protocol or any static file server without network connectivity.
- **Neo-Brutalist Design System:** Striking visual hierarchy featuring high-contrast hard borders (`border-2 border-ink`), tactile hard drop shadows (`shadow-hard`), vivid accents, physical button press micro-interactions, and independent isolated scrolling (`overscroll-contain`) between sidebar and workspace.
- **Strict Content Security Policy (CSP):** Hardware-enforced isolation (`default-src 'none'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src blob: data:;`).
- **All-in-One Standalone Single File:** Fonts, WebAssembly engines, PDF.js & Tesseract workers, and conversion parsers are compressed and embedded into a single portable `.html` file.
- **26 Complete Offline Tools:** From document manipulation, digital signatures, AcroForms, OCR, and document redaction, to full multi-format Office conversions (Word, Excel, PowerPoint, Markdown, HTML, Scans) and zero-network AI preparation.
- **Direct Image & Scanned PDF OCR:** Extract text directly from image files (`PNG`, `JPG`, `JPEG`, `WebP`, `BMP`) and scanned documents without leaving the interface.
- **Multi-File Batch Queue:** Process multiple files sequentially with isolated error boundaries. Download processed files individually or package them all into a single ZIP archive.
- **Bilingual Interface:** Seamless real-time switching between **Bahasa Indonesia (ID)** and **English (EN)**.
- **Adaptive Theme:** Smooth transitions between Dark, Light, and System OS preference modes (`prefers-color-scheme`).
- **WCAG AA Accessibility:** Full keyboard navigation (`Tab`, `Escape` to dismiss drawers and modals), high-contrast `:focus-visible` outlines, and `prefers-reduced-motion` compliance.

---

## 🛠️ Complete Tool Suite (26 Modules)

### 1. Tata Letak Dokumen (Document Layout & Editing)
1. **Gabung PDF (Merge):** Combine multiple PDF documents into a unified file with drag-and-drop reordering and memory recovery.
2. **Pisah PDF (Split):** Extract arbitrary page ranges (e.g. `1-3, 5, 8-10`) or break documents into N-page batches directly or as a ZIP.
3. **Atur Halaman (Organize):** Visual thumbnail grid with drag-and-drop reordering, 90°/180°/270° rotation, and page deletion.
4. **Edit Tulisan PDF (Edit PDF):** Click existing text on any page and retype or delete it. The old text is covered with a white box and retyped using a built-in font, so letter shapes may differ slightly from the original.
5. **Nomor Halaman (Page Numbers):** Stamp flexible numbering (`Halaman {n} dari {total}`) across 9 position alignments with custom margins.
6. **Watermark:** Customizable diagonal, centered, or repeated text watermarks with adjustable angle, opacity, and font styling.

### 2. Konversi Dokumen & Media (Conversion & Formats)
7. **PDF ke Word (PDF to Word):** Convert PDF layouts into formatted Microsoft Word `.docx` documents preserving paragraphs, headings, tables, and page snapshots.
8. **Word ke PDF (Word to PDF):** Convert Word `.docx` files to print-ready PDF with clean HTML layout rendering.
9. **PDF ke Excel (PDF to Excel):** Extract structured tables or raw coordinate layouts from PDF into editable Microsoft Excel `.xlsx` spreadsheets.
10. **Excel ke PDF (Excel to PDF):** Render Excel `.xlsx` workbooks and `.csv` files into paginated vector PDF tables with auto column sizing.
11. **PDF ke PowerPoint (PDF to PowerPoint):** Convert PDF pages into Microsoft PowerPoint `.pptx` presentations with custom slide dimension mapping.
12. **PowerPoint ke PDF (PowerPoint to PDF):** Extract OpenXML slide structures, shapes, text, and embedded media into vector PDF presentations.
13. **PDF ke Markdown (PDF to Markdown):** Extract semantic Markdown with automatic heading detection, table structures, and page image extraction.
14. **HTML ke PDF (HTML to PDF):** Convert HTML files or raw markup into PDF with offline-safe sanitization and multi-page canvas slicing.
15. **Pindai jadi PDF (Scan to PDF):** Camera/file scanner with 4-corner document cropping, rotation, and document filters (*Asli*, *Abu-abu*, *Hitam-Putih Dokumen*, *Perjelas Teks*).
16. **PDF ke Gambar (PDF to Image):** Render pages to high-resolution PNG or JPEG images packaged into a ZIP archive.
17. **Gambar ke PDF (Image to PDF):** Convert images (PNG, JPG, WebP) to PDF with configurable page size (A4, Letter, Auto), margins, and orientation.

### 3. Keamanan Dokumen (Document Security & Privacy)
18. **Buka Kunci PDF (Unlock PDF):** Remove password protection and decrypt PDF documents protected with standard PDF encryption.
19. **Kunci dengan Password (Protect PDF):** Encrypt documents with military-grade AES-256 standard and customizable permissions (printing, copying, modification, annotation).
20. **Tanda Tangan Digital (Sign PDF):** Draw freehand signatures, upload signature stamps with automatic background removal, or type cursive signatures.
21. **Sensor Dokumen (Redact PDF):** True permanent raster sanitization — redacted canvas areas are permanently cleared and restamped into the underlying PDF stream; all document metadata (Title, Author, Producer) is stripped.

### 4. Optimasi, Teks & AI (Optimization, Text & AI)
22: **Kompres PDF (Compress PDF):** Multi-level canvas compression with live reduction metrics (file size, percentage saved).
23. **Pengenalan Karakter OCR (Text Recognition):** Extract printed text and generate searchable PDFs with an invisible text layer using local Tesseract WASM with Indonesian and English language models.
24. **Ekstrak Teks (Extract Text):** Extract readable text with page headers and line preservation. Directly accepts image files (`PNG`, `JPG`, `WebP`, `BMP`) with in-place OCR.
25. **Isi Formulir (Fill Form):** Automatically detect AcroForm fields (text boxes, checkboxes, dropdowns) with optional form flattening.

---

## 📦 Build Variants (Full vs. Lite)

PDF Toolkit is distributed in two self-contained editions:

| Feature | Full Edition (`PDF To Go.html`) | Lite Edition (`PDF To Go Lite.html`) |
| :--- | :--- | :--- |
| **Total HTML Size** | **~10.0 MB** | **~6.7 MB** |
| **All 26 Tools Pre-loaded** | ✅ Ready out-of-the-box | ✅ Ready out-of-the-box |
| **Tesseract WASM Engine** | ✅ Embedded | ✅ Embedded |
| **OCR Bahasa Indonesia (`ind`)** | ✅ Embedded out-of-the-box (gzip) | 📥 Import local `.traineddata` |
| **OCR English (`eng`)** | ✅ Embedded out-of-the-box (gzip) | 📥 Import local `.traineddata` |
| **Ideal For** | Complete offline use with zero setup | Ultra-lightweight distribution & low bandwidth |

---

## 🚀 Quick Start & Development

### Running Directly (No Installation Required)
Simply double-click or open either standalone HTML file directly in any browser:
```bash
# Full Edition
open "dist/PDF To Go.html"

# Lite Edition
open "dist/PDF To Go Lite.html"
```

### Development & Build Commands

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run test suite (97 pure unit tests):**
   ```bash
   npm test
   ```

3. **Build standalone distribution files:**
   ```bash
   # Build all variants (Full and Lite) with Zero-Network leak verification
   npm run build

   # Build Full edition only
   npm run build:full

   # Build Lite edition only
   npm run build:lite
   ```

4. **Start local development server:**
   ```bash
   npm run serve
   ```
   *Scans ports 3000–3050 automatically to avoid local port collisions.*

---

## 🧠 Code Architecture & Graphify Knowledge Graph

The codebase is built on strict modular engineering principles:
- **Modular Feature Isolation:** Every tool resides in its own self-contained directory `src/features/<tool-id>/` exposing a standardized `index.js` and pure `logic/` layer.
- **$\le 120$ Lines Contract:** Every single source file in `src/features/*` strictly adheres to a maximum length of 120 lines to ensure maintainability, readability, and testability.
- **Graphify Knowledge Graph:** The repository maintains an active knowledge graph in `graphify-out/`:
  - `graphify-out/graph.html`: Interactive force-directed graph of all 1,490 nodes and 3,387 connections across 92 communities.
  - `graphify-out/PDFGO-callflow.html`: Mermaid-based interactive call-flow architecture diagram.
  - `graphify-out/GRAPH_TREE.html`: D3 collapsible-tree hierarchy.
  - `graphify-out/GRAPH_REPORT.md`: Comprehensive architectural report and community breakdown.

---

## 🔒 Security & Privacy Architecture

- **Zero Remote Calls:** External `<script src>` and `<link href>` tags are strictly prohibited. The build system automatically scans and verifies zero-network compliance on every build.
- **Worker & WASM Isolation:** Web Workers and WebAssembly binaries are decoded from compressed byte arrays in memory and instantiated via dynamic `Blob` URLs (`blob:`), complying with strict CSP policies without touching disk or network.
- **Memory Management:** Every canvas, object URL (`URL.revokeObjectURL`), and intermediate ArrayBuffer is explicitly reclaimed after processing to prevent browser tab crashes during intensive operations.

---

## 📄 License
ISC License. 100% Free and Open Source.
