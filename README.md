# PDFGO - 100% Client-Side & Offline PDF Toolkit

A powerful, private, and fully offline PDF manipulation web application. Zero network requests, zero telemetry, and zero document leakage. Your documents never leave your browser.

## 🌟 Highlights

- **100% Client-Side & Offline:** Works directly over the `file://` protocol or any static host.
- **Strict Content Security Policy (CSP):** Prohibits external network calls (`connect-src blob: data:`, `default-src 'none'`).
- **All-in-One Standalone HTML:** All fonts, WebAssembly modules, workers, and styles are embedded inside a single HTML file.
- **Bilingual Support:** Full Indonesian (`Bahasa Indonesia`) and English UI translations with instant toggle.
- **Theme Modes:** Light, Dark, and System preference synchronization.

---

## 🛠️ Included Tools (13 Core Modules)

1. **Gabung PDF (Merge):** Combine multiple PDF documents into a single sequential file with visual drag-and-drop reordering.
2. **Pisah PDF (Split):** Extract page ranges (e.g. `1-3, 5, 8-10`) or split by page chunks directly into individual files or ZIP archive.
3. **Atur Halaman (Organize):** Visual grid preview, reorder pages with drag & drop, rotate individual pages (90°/180°/270°), and delete unwanted pages.
4. **Tanda Tangan Digital (Sign):** Draw signatures directly, type signatures with cursive fonts (*Dancing Script* & *Caveat*), or upload stamp/signature images with background removal.
5. **Isi Formulir (Fill Form):** Interactive AcroForm field detection and fill-in with optional form flattening.
6. **Sensor Dokumen (Redact):** True permanent raster sanitization (redacted areas are fully destroyed from the underlying PDF stream) plus metadata removal (Title, Author, Producer).
7. **Kompres PDF (Compress):** Multi-level adaptive canvas compression with live size reduction statistics.
8. **OCR (Pengenalan Karakter):** Extract text and generate searchable PDFs using local Tesseract WASM with Indonesian and English language models.
9. **Ekstrak Teks (Extract Text):** Extract all readable text content preserving page sequence and line breaks.
10. **Watermark:** Customizable text stamp with angle, opacity, color, and tiling support.
11. **Nomor Halaman (Page Numbers):** Flexible page numbering formats (`Halaman {n} dari {total}`) across 9 alignments.
12. **PDF ke Gambar (PDF to Image):** Export pages to high-resolution PNG or JPEG packed into ZIP files.
13. **Gambar ke PDF (Image to PDF):** Convert images (PNG, JPG, WebP) to PDF with configurable page size, margins, and orientation.

---

## 🚀 Quick Start

### Direct Execution
Open the pre-built single HTML file in `dist/` directly in any modern browser:
```bash
open "dist/PDF Toolkit.html"
# or
open dist/index.html
```

### Development
1. Clone the repository:
   ```bash
   git clone https://github.com/davisbpkad/pdfgo.git
   cd pdfgo
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run test suite:
   ```bash
   npm test
   ```
4. Build standalone offline bundles:
   ```bash
   npm run build
   ```
5. Serve locally for testing:
   ```bash
   npm run serve
   ```

---

## 📦 Build Variants

- **Full:** `dist/index.html` & `dist/PDF Toolkit.html` — Includes all features and embedded fonts/workers.
- **Lite:** `dist/PDF Toolkit Lite.html` — Lightweight edition without embedded OCR models (allows local `.traineddata` file import via IndexedDB).

---

## 🔒 Security & Privacy Guarantee

- **No Server:** There is no backend, analytics, or external API.
- **Offline CSP:** External `<script src>` and `<link href>` tags are blocked by design and verified during the build pipeline.

---

## 📄 License
ISC License
