# Arsitektur PDFGO (Vue 3 + Tailwind CSS v4 + Neo-Brutalist)

## 1. Prinsip Utama (Core Principles)

1. **100% Offline-First & Zero Network Leaks**:
   - Seluruh pemrosesan dokumen PDF, OCR, kompresi, sensor, tanda tangan, dan penggabungan berjalan secara lokal di sisi klien (in-browser memory).
   - Kebijakan Keamanan Konten (CSP) yang ketat melarang koneksi eksternal (`default-src 'none'`).
   - Mendukung eksekusi langsung dari protokol `file://` (klik dua kali berkas HTML tunggal mandiri).

2. **Desain Neo-Brutalist**:
   - Kontras tinggi, batas tebal (`border-2` / `border-3` warna tinta `ink`), bayangan tegas tanpa blur (`shadow-hard`), sudut tajam, tipografi lugas (`Fraunces` + `Atkinson Hyperlegible`).
   - Desain responsif hingga lebar layar terkecil 360px.
   - Dukungan tema gelap & terang (`data-theme="dark"`).

3. **Prinsip File Atomik (≤120 Baris)**:
   - Setiap file memiliki **satu tanggung jawab tunggal**.
   - Logika murni PDF (pdf-lib / PDF.js) dipisahkan secara ketat dari komponen antarmuka Vue (`logic/` vs `components/`).

---

## 2. Peta Direktori (Directory Map)

```
PDFGO/
├── build.mjs                 # Pipeline kompilasi HTML mandiri (Vite -> IIFE -> Inliner)
├── vite.config.mjs           # Konfigurasi Vite + Vue 3 + Tailwind v4
├── docs/
│   └── ARCHITECTURE.md       # Dokumentasi arsitektur sistem
├── src/
│   ├── App.vue               # Root orchestrator & tool routing
│   ├── main.js               # Entry point Vue 3
│   ├── style.css             # Tailwind CSS v4 & Neo-Brutalist design tokens
│   ├── app/                  # Application state & router
│   │   ├── router.js         # Reactive activeToolId routing (hash-based)
│   │   └── providers/        # Reactive queue & toast providers
│   ├── core/                 # Shared core engines
│   │   ├── pdf.js            # Unified PDF.js & pdf-lib adapter
│   │   ├── download.js       # Client-side file downloader
│   │   ├── i18n.js           # Multi-language dictionary (ID / EN)
│   │   ├── workers.js        # Web Worker blob generation
│   │   └── assets.js         # IndexedDB asset & Tesseract model caching
│   ├── ui/                   # Komponen Base Neo-Brutalist Reusable
│   │   ├── BaseButton.vue    # Tombol brutalist (primary, secondary, danger)
│   │   ├── BaseCard.vue      # Kartu kontainer berbatas tebal & bayangan keras
│   │   ├── BaseProgressBar.vue # Indikator proses beranimasi
│   │   ├── DropZone.vue      # Area drag-and-drop file
│   │   ├── AppHeader.vue     # Header navigasi utama & status offline
│   │   ├── AppSidebar.vue    # Sidebar daftar alat
│   │   └── ToastHost.vue     # Host notifikasi toast
│   ├── features/             # 13 Alat PDF Modular & Atomik
│   │   ├── merge/            # Gabung PDF
│   │   ├── split/            # Pisah PDF
│   │   ├── organize/         # Atur Halaman
│   │   ├── watermark/        # Cap Air (Watermark)
│   │   ├── page-numbers/     # Nomor Halaman
│   │   ├── compress/         # Kompres PDF
│   │   ├── image-to-pdf/     # Gambar ke PDF
│   │   ├── pdf-to-image/     # PDF ke Gambar
│   │   ├── extract-text/     # Ekstrak Teks
│   │   ├── sign/             # Tanda Tangan Digital (Draw, Type, Upload)
│   │   ├── form/             # Isi Formulir AcroForm
│   │   ├── redact/           # Sensor Dokumen Permanen (True Redaction)
│   │   └── ocr/              # Pengenalan Teks OCR (Searchable PDF)
│   └── modules/              # Facade re-exports (memastikan kompatibilitas unit test)
└── tests/
    └── unit/                 # 28 Unit tests (Node.js test runner)
```

---

## 3. Struktur Fitur Atomik (`src/features/<tool>/`)

Setiap fitur memiliki struktur folder standar:
```
src/features/<tool>/
├── logic/                    # Fungsi murni (pure functions) bebas dependensi DOM
│   ├── executeAction.js      # Logika pdf-lib / pemrosesan data (cloning buffer aman)
│   └── helperUtil.js
├── components/               # Komponen antarmuka Vue 3
│   ├── ToolSubCard.vue       # Sub-komponen modular (≤120 baris)
│   └── ToolName.vue          # Orchestrator alat
└── index.js                  # Metadata alat (id, titleKey, descKey, icon, component)
```

### Aturan Buffer Safety
Ketika menerima `ArrayBuffer` atau `Uint8Array`, fungsi logika wajib menduplikasi buffer secara defensif sebelum memanggil `PDFDocument.load()` atau `pdfjsLib.getDocument()`:
```js
const safeBytes = new Uint8Array(srcBuffer.slice(0));
```
Hal ini mencegah galat browser *"Cannot perform Construct on a detached ArrayBuffer"* saat file digunakan berulang kali atau dalam antrean batch.

---

## 4. Cara Menambah Alat Baru

1. **Buat Folder Fitur**:
   Buat `src/features/<nama-alat>/logic/` dan `src/features/<nama-alat>/components/`.

2. **Tulis Logika Murni**:
   Buat file JavaScript di folder `logic/` yang hanya menerima buffer/parameter dan mengembalikan `Uint8Array` atau objek data.

3. **Buat Komponen Vue**:
   - Buat sub-komponen jika UI memiliki beberapa panel (misal pengaturan, kanvas pratinjau, hasil).
   - Buat `<NamaAlat>Tool.vue` yang memanfaatkan `DropZone`, `BaseCard`, `BaseButton`, dan logic engine.

4. **Daftarkan di `src/features/<nama-alat>/index.js`**:
   Ekspor `id`, `titleKey`, `descKey`, `icon`, dan `component`.

5. **Daftarkan di `src/App.vue` & `src/ui/AppSidebar.vue`**:
   Tambahkan import dan kondisi `<NamaAlatTool v-else-if="activeToolId === '<nama-alat>'" />`.

6. **Tulis Unit Test**:
   Tambahkan test case di `tests/unit/<nama-alat>.test.mjs` dan jalankan `npm test`.

---

## 5. Cara Build & Packaging

| Perintah | Deskripsi |
| :--- | :--- |
| `npm test` | Menjalankan seluruh 28 unit test secara lokal |
| `npm run build` | Menghasilkan varian LITE dan FULL di direktori `dist/` |
| `npm run build:lite` | Menghasilkan `PDF To Go Lite.html` (3.8 MB, tanpa model OCR bawaan) |
| `npm run build:full` | Menghasilkan `PDF To Go.html` dan `index.html` (7.1 MB, model OCR tersemat) |

Proses build diverifikasi secara otomatis oleh fungsi `verifyZeroNetwork()` untuk memastikan tidak ada URL eksternal, skrip tidak aman, atau kebocoran jaringan.
