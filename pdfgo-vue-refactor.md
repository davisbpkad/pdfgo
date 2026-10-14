# Plan: Refaktor PDFGO → Vue 3 + Vite + Tailwind + UI Brutalist

Repo: `~/Documents/PDFGO`. Status: rencana, belum dieksekusi.

## Fakta repo (terverifikasi)

| Hal | Nilai |
| :-- | :-- |
| Entry | `src/main.js` (612 baris: shell + router + queue UI + batch engine) |
| Modul | 13 file di `src/modules/*.js`, campur logika murni + string HTML + `bindDomEvents()` + `style="..."` inline |
| File terbesar | `ocr.js` 802, `i18n.js` 645, `sign.js` 638, `redact.js` 514, `merge.js` 492 |
| CSS | satu file `src/styles/main.css`, 1524 baris |
| Core bagus (jangan diubah kontraknya) | `pdf.js`, `queue.js` (class DocumentQueue, event-driven), `workers.js` (worker via Blob URL), `zip.js`, `download.js`, `assets.js`, `theme.js` (set `data-theme` di `<html>`) |
| i18n | ID + EN, ~100 kunci, interpolasi `{count}` |
| Build | `build.mjs` esbuild → IIFE, embed font base64 + PDF.js worker + Tesseract worker/WASM + model OCR, inject meta CSP, `verifyZeroNetwork()` |
| Varian | `full`, `lite` → `dist/index.html`, `dist/PDF To Go.html`, `dist/PDF Toolkit.html`, + 2 varian Lite |
| Test | `node --test tests/unit/*.test.mjs`, impor langsung fungsi logika murni |

## Keputusan yang sudah diambil

1. Framework: **Vue 3 + Vite**, SFC precompile (runtime-only) karena CSP tanpa `unsafe-eval`.
2. Styling: **Tailwind CSS** (v4 + `@tailwindcss/vite`), token brutalist lewat `@theme`.
3. Tanpa Pinia/Vuex/vue-router. Queue dipakai ulang sebagai provider Vue. Router hash manual.
4. `build.mjs` tetap jadi packager; hanya langkah esbuild diganti API `vite.build()`.
5. Struktur atomik: 1 file = 1 tanggung jawab, ≤120 baris, template/CSS/logika terpisah, dilarang logika 2 alat sefile.

## Risiko yang harus dijaga

- Output tetap **satu file HTML** yang jalan dari `file://` → wajib IIFE inline, tanpa dynamic import/chunk.
- Dilarang `template:` string runtime (butuh eval).
- Tailwind: dilarang nama kelas dinamis hasil string-concat (`bg-${x}`) — purge akan membuangnya. Pakai map kelas statis.
- Tailwind `dark:` butuh custom variant karena tema diset lewat `data-theme`, bukan `class`/`prefers-color-scheme`.
- Ukuran bundle tidak boleh naik >15% tanpa penjelasan.

---

## PROMPT (copy-paste ke agent implementasi)

````text
# PERAN
Kamu Senior Frontend Engineer spesialis Vue 3 + Vite + Tailwind dan aplikasi dokumen 100% client-side. Kamu menulis kode kecil, atomik, mudah diperbaiki, dan menghormati batasan keamanan yang sudah ada.

# MISI
Refaktor aplikasi PDFGO (repo: ~/Documents/PDFGO) dari vanilla JS menjadi **Vue 3 + Vite + Tailwind CSS**, dengan dua tujuan sekaligus:
1. **Struktur atomik** — satu tanggung jawab per file; template, style, dan logika wajib terpisah; dilarang menaruh fungsi merge dan split (atau alat apa pun) di file yang sama.
2. **UI/UX brutalist** — tampilan mengikuti referensi https://brutalism.tailwinddashboard.com/ (border hitam tebal, hard offset shadow, sudut siku, warna kontras tinggi, tipografi tebal). Tombol harus dipahami pengguna awam tanpa dokumentasi.

# KONDISI REPO SAAT INI (baca dulu, jangan berasumsi)
- Entry: `src/main.js` (612 baris, shell + router + queue UI + batch engine sekaligus).
- 13 modul di `src/modules/*.js`. Tiap file mencampur: fungsi logika murni, `render()` yang mengembalikan string HTML, `bindDomEvents()`, dan `style="..."` inline (ocr.js 802 baris, sign.js 638, merge.js 492).
- CSS: satu file `src/styles/main.css` (1524 baris).
- i18n: `src/core/i18n.js` (645 baris, ID + EN, ~100 kunci, interpolasi `{count}`).
- Core yang sudah bagus dan **jangan diubah strukturnya**: `core/pdf.js`, `core/queue.js` (class DocumentQueue, event-driven), `core/workers.js` (worker via Blob URL), `core/zip.js`, `core/download.js`, `core/assets.js`, `core/theme.js` (set atribut `data-theme="light|dark"` pada `<html>`).
- Build: `build.mjs` (esbuild → IIFE + CSS, embed font base64, PDF.js worker, Tesseract worker+WASM, model OCR `eng`/`ind` base64, inject meta CSP, lalu `verifyZeroNetwork()` menolak URL eksternal & `<script src>`/`<link href>`). Dua varian: `full` dan `lite`. Output `dist/index.html`, `dist/PDF To Go.html`, `dist/PDF Toolkit.html`, plus varian Lite.
- Test: `node --test tests/unit/*.test.mjs` mengimpor **langsung** fungsi logika murni (`mergePdfFiles`, `loadPdfJsDocument`, dll).

# BATASAN NON-NEGOTIABLE (langgar = gagal)
1. **Zero network.** Dilarang `fetch`/XHR ke luar, CDN, font eksternal, telemetry. Semua aset di-inline saat build.
2. **Jalan dari `file://`** (klik dua kali) dan dari server statis, tanpa internet. Worker & WASM tetap dibuat dari **Blob URL**.
3. **CSP ketat tetap utuh**: `default-src 'none'; script-src 'self' 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src blob: data:;`
   Karena **tidak ada `unsafe-eval`**: wajib build Vue **runtime-only + SFC precompile**. Dilarang `template: '<div>...'` string, dilarang `new Function`, dilarang dynamic import / code splitting / chunk.
4. **Output build tetap satu file HTML mandiri**, dua varian `full` dan `lite`, dengan nama file yang sama, dan tetap lolos `verifyZeroNetwork()`.
5. **Dependensi yang boleh ditambah hanya**: `vue`, `vite`, `@vitejs/plugin-vue`, `tailwindcss`, `@tailwindcss/vite`. Dilarang: Pinia, Vuex, vue-router, UI kit, lodash, axios, jQuery, atau CSS framework lain.
6. **Tidak ada fitur baru, tidak ada perubahan perilaku fungsional.** Format output, alur, dan 13 alat tetap identik. Ini murni refaktor + ganti tampilan.
7. **Test lama tetap hijau.** Kalau jalur import berubah, perbarui import di test — boleh. Jangan ubah/hapus asersinya.
8. Jangan `git commit` folder `dist/`, `graphify-out/`, atau `node_modules/`.

# LANGKAH 1 — STRATEGI BUILD (kerjakan dan jelaskan sebelum menulis komponen)
1. Tambah dependency `vue`; devDependencies `vite`, `@vitejs/plugin-vue`, `tailwindcss`, `@tailwindcss/vite`. Hapus `esbuild` setelah Vite terbukti.
2. Buat `vite.config.mjs`: plugin `vue()` + `tailwindcss()`; `resolve.alias` runtime-only Vue; `define` matikan flag dev (`__VUE_OPTIONS_API__: false`, `__VUE_PROD_DEVTOOLS__: false`); `build.lib = { entry: 'src/main.js', formats: ['iife'], name: 'PDFGoApp', fileName: 'app' }`, `cssCodeSplit: false`, `write: false`.
3. Ubah `build.mjs` **hanya pada langkah esbuild**: ganti dua panggilan `esbuild.build(...)` dengan satu panggilan API `import { build as viteBuild } from 'vite'`, ambil `output` → pisahkan chunk `.js` dan `.css` (Tailwind ada di dalam CSS itu). Semua logika lain di `build.mjs` (font, worker, tesseract, model OCR, CSP, `verifyZeroNetwork`, laporan ukuran, dua varian) **tetap apa adanya**.
4. Pastikan `npm run build`, `npm run build:lite`, `npm test` semua hijau, lalu buka `dist/PDF To Go.html` via `file://` dan buktikan 3 alat berjalan (merge, split, compress).
5. Ganti `npm run serve` (esbuild watch) dengan `vite` dev server untuk pengembangan, tapi **dev server bukan jalur rilis** — jalur rilis selalu `build.mjs`.

# LANGKAH 2 — STRUKTUR FILE ATOMIK (aturan keras)
```
src/main.js                 # hanya: import App + mount
src/App.vue                 # hanya: shell + outlet alat aktif
src/app/providers/          # queue.js i18n.js theme.js toast.js  (masing-masing 1 file, 1 export)
src/app/router.js
src/core/                   # tetap seperti sekarang
src/ui/                     # komponen base & kerangka (lihat daftar)
src/features/<tool>/logic/  # fungsi murni, tanpa import Vue & tanpa DOM
src/features/<tool>/composables/
src/features/<tool>/components/
src/features/<tool>/i18n/   # id.js + en.js per alat + index.js penggabung
src/features/<tool>/index.js# manifest: { id, titleKey, descKey, icon, component }
src/styles/tailwind.css     # @import "tailwindcss" + @theme + @layer base/components
```
Aturan yang wajib dipatuhi:
- **1 file = 1 tanggung jawab & 1 export utama.** Maksimal 120 baris per file, 40 baris per fungsi. Kalau lewat, pecah.
- **merge dan split tidak boleh sefile**, dan tidak ada alat lain yang berbagi file logika. Fungsi bersama hanya boleh naik ke `core/` atau `ui/` setelah dipakai ≥2 alat.
- **Template, style, dan script terpisah.** Setiap komponen = satu file `.vue` dengan blok `<template>`, `<script setup>`, dan CSS-nya. Logika non-UI wajib keluar dari `.vue` ke `logic/`.
- **Dilarang import antar-`features/*`.** Komunikasi lewat `core/`, `ui/`, atau provider global.
- **Nol atribut `style="..."` statis** di template. Hanya `:style` untuk nilai dinamis (lebar progress, warna terpilih).
- **Tailwind: nol kelas dinamis hasil string-concat** (`bg-${warna}` dilarang). Pakai map objek kelas statis, mis. `{ red: 'bg-brutal-danger', lime: 'bg-brutal-accent-2' }`.
- Nama file: fungsi murni pakai kata kerja (`mergePdfFiles.js`), komponen PascalCase (`MergeFileCard.vue`), composable `useXxx.js`.
- Setiap fungsi murni baru yang punya cabang/loop diberi 1 test kecil di `tests/unit/`.
- Kalau kamu mengambil jalan pintas dengan batas umur (misalnya CSS komponen belum dipindah), tandai `// ponytail: <batas> — <kapan diperbaiki>`.

# LANGKAH 3 — TAILWIND + DESIGN SYSTEM BRUTALIST
Semua gaya lewat Tailwind; hindari CSS global besar. Buat `src/styles/tailwind.css`:
```
@import "tailwindcss";

/* tema diset lewat data-theme, bukan class */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  --color-ink: #0A0A0A;
  --color-paper: #FFFDF5;
  --color-accent: #FFD500;      /* kuning utama */
  --color-accent-2: #B8FF3C;    /* lime */
  --color-accent-3: #7DF9FF;    /* cyan */
  --color-danger: #FF5C5C;
  --shadow-hard: 6px 6px 0 #0A0A0A;
  --shadow-hard-sm: 3px 3px 0 #0A0A0A;
  --font-display: "Fraunces", Georgia, serif;
  --font-ui: "Atkinson Hyperlegible", ui-monospace, monospace;
}

@layer base {
  /* body, heading uppercase/berat, :focus-visible outline 3px ink offset 2px,
     prefers-reduced-motion: reduce → matikan translasi/shadow animasi,
     token gelap untuk [data-theme="dark"] (paper jadi hampir hitam, ink jadi terang) */
}

@layer components {
  .brutal-card  { /* bg paper, border-3 ink, shadow-hard, sudut 0 */ }
  .brutal-panel { /* varian panel besar untuk sidebar/workspace */ }
  .brutal-divider { /* garis pemisah 3px ink */ }
}
```
Aturan tampilan:
- Semua kartu/panel/tombol: `border` 3px ink, `shadow-hard`, sudut 0. Tombol primer = blok `bg-accent` + teks ink + border ink.
- Hover: `-translate-x-0.5 -translate-y-0.5` dan shadow membesar. `:active`: shadow 0 dan `translate-x-0.5 translate-y-0.5`. Tidak ada transisi halus berlebihan.
- Heading alat: uppercase, berat, `font-display`. Badge/status: blok warna dengan border.
- Tema gelap/terang tetap didukung (`core/theme.js` jangan diubah kontraknya); semua warna wajib punya pasangan `dark:`.
- Kontras teks ≥4.5:1, target sentuh ≥44px, layout rapi di 360px.
- Komponen base di `src/ui/`: `BaseButton.vue` (varian primary/secondary/danger + `loading` + `disabled`), `BaseCard.vue`, `BaseInput.vue`, `BaseSelect.vue`, `BaseCheckbox.vue`, `BaseProgressBar.vue`, `BaseModal.vue`, `BaseBadge.vue`, `BaseIconButton.vue`, `ToastHost.vue`, `AppShell.vue`, `AppHeader.vue`, `AppSidebar.vue`, `ToolHeader.vue`, `QueueDrawer.vue`, `DropZone.vue`.
- Preflight Tailwind boleh aktif, tapi reset manual di `main.css` lama tidak boleh dipindah bulat-bulat.
- Semua ikon: SVG inline, `currentColor`, prop `size`. Jangan pakai ikon tanpa label untuk aksi utama.

# LANGKAH 4 — UX UNTUK PENGGUNA AWAM
- Setiap alat: **satu aksi utama** yang mencolok + maksimal 2 aksi sekunder. Judul alat, satu kalimat penjelas, lalu langkah bernomor 1-2-3.
- Label tombol = kata kerja + objek + hasil, maksimal 4 kata, bahasa Indonesia awam, tanpa jargon:
  - Merge: `Gabungkan 2 file jadi 1 PDF` (jumlah file ikut berubah), sekunder `Kosongkan daftar`, `Unduh lagi`.
  - Split: pilihan mode pakai kata awam `Ambil halaman tertentu` / `Pecah jadi beberapa file`, tombol `Pisahkan sekarang`.
  - Hindari: "Eksekusi", "Proses", "Validasi", "Submit", "Merge", "Render".
- Tombol yang tidak bisa dipakai: nonaktifkan **dan** tampilkan alasan singkat di dekatnya (misal `Tambahkan minimal 2 file PDF`).
- Aksi merusak (hapus halaman, kosongkan semua, sensor permanen) wajib `BaseModal` konfirmasi dengan kalimat biasa + tombol `Ya, hapus` / `Batal`.
- Proses panjang: progress + persen + teks apa yang sedang terjadi + tombol `Batalkan`.
- Selesai: banner hasil berisi nama file, ukuran, jumlah halaman, tombol `Unduh hasil` (auto-download tetap dipertahankan) dan `Kerjakan file lain`.
- Error: kalimat sebab + langkah berikutnya, bukan stack trace. Kalau bisa ditolong (mis. PDF terkunci password), tampilkan inputnya langsung.
- Jaminan privasi tetap terlihat: badge `100% Offline • File tidak pernah dikirim ke mana pun`.
- Semua teks baru wajib ada versi ID dan EN di `src/features/<tool>/i18n/`. Tidak ada string keras di template. Pertahankan kunci lama bila memungkinkan supaya diff i18n kecil.
- Aksesibilitas: `aria-label` pada ikon, `role="status"`/`aria-live` untuk toast dan progress, `Escape` menutup modal/drawer, urutan `Tab` logis, sidebar pakai `aria-current`.

# LANGKAH 5 — URUTAN MIGRASI (jangan lompat)
- **Fase 0** Catat baseline: hasil `npm test`, ukuran `npm run build`, screenshot tiap alat. Jadikan pembanding.
- **Fase 1** Vite + Vue + Tailwind jalan, shell + sidebar + dropzone + queue drawer jadi Vue. Port **hanya merge** sebagai contoh pola. Buktikan `file://`, offline, CSP, `verifyZeroNetwork`, ukuran tidak naik >15%.
- **Fase 2** Design system brutalist + komponen base selesai; terapkan pada merge.
- **Fase 3** Port 12 alat lain, **satu alat per commit**, urut: split, organize, watermark, page-numbers, compress, image-to-pdf, pdf-to-image, extract-text, sign, form, redact, ocr (ocr paling akhir karena paling berat).
- **Fase 4** Pecah i18n per alat; bersihkan `style="`.
- **Fase 5** Hapus `src/main.js` lama, `src/styles/main.css`, `esbuild`, `scripts/generate_modules.mjs` bila sudah tidak dipakai; rapikan `package.json`.
- **Fase 6** Verifikasi akhir dan tulis `docs/ARCHITECTURE.md` singkat: peta folder, aturan atomik, cara menambah alat baru, cara build.

Gate tiap fase: `npm test` hijau, `npm run build` lolos, tidak ada URL eksternal baru, tidak ada penurunan fungsi (uji manual alat yang baru diport), ukuran bundle tidak membengkak tanpa alasan yang kamu jelaskan.

# DEFINISI SELESAI
1. `npm test` hijau, tanpa test yang dihapus.
2. `npm run build`, `npm run build:full`, `npm run build:lite` sukses; `dist/` memuat `index.html`, `PDF To Go.html`, `PDF Toolkit.html`, `PDF To Go Lite.html`, `PDF Toolkit Lite.html`.
3. Dibuka via `file://` tanpa internet: 13 alat berjalan, ID/EN jalan, tema gelap/terang jalan, drag-and-drop urutan jalan, batch queue + ZIP jalan, OCR (varian full) jalan, impor `.traineddata` (varian lite) jalan.
4. Tidak ada `<script src>`, `<link href>`, `fetch(`, `XMLHttpRequest`, atau URL http(s) baru di output.
5. Tidak ada file >120 baris di `src/` kecuali file data murni (kamus i18n boleh, tapi dipecah per alat) — dan tidak ada satu file pun yang memuat logika dua alat berbeda.
6. Tampilan brutalist konsisten di semua 13 alat dan di mobile 360px, baik tema terang maupun gelap.
7. Tidak ada tombol berjargon; setiap aksi utama punya label kata kerja + objek.

# CARA KERJA
- Mulai dengan membaca `PlanPDF.md`, `build.mjs`, `src/main.js`, dan satu modul (`merge.js`) lalu laporkan rencana ringkas + daftar file yang akan dibuat sebelum menulis kode.
- Kerjakan bertahap; setelah setiap fase, tampilkan ringkas: file ditambah/dihapus, hasil `npm test`, ukuran build.
- Kalau menemukan keputusan yang bisa mengubah perilaku atau jaminan keamanan, tanya dulu, jangan tebak.
- Di akhir setiap fase, jelaskan 1 baris: apa yang di-skip dan risiko yang tersisa.
````
