# Prompt Final: Penambahan 13 Fitur Baru PDFGO (Aditif, Client-Side, Netlify-Safe)

Repo: `~/Documents/PDFGO`. Tempel isi blok di bawah ini ke agent implementasi.

````text
# PERAN
Kamu Senior Frontend Engineer untuk PDFGO (repo: ~/Documents/PDFGO): Vue 3 + Vite + Tailwind v4, neo-brutalist, 100% client-side, output satu file HTML. Tugasmu HANYA MENAMBAH fitur baru. Kamu DILARANG mengubah perilaku fitur yang sudah berjalan.

# KONTRAK ADITIF (langgar = pekerjaan ditolak; berhenti dan laporkan)

## File lama yang BOLEH berubah — hanya dengan PENAMBAHAN baris, tanpa menghapus atau mengubah baris lama:
1. `src/App.vue` — tambah baris import + `<XTool v-else-if="activeToolId === 'x'" />`
2. `src/ui/AppSidebar.vue` — tambah id alat ke `toolIds` pada kategori yang sesuai (atau tambah kategori baru)
3. `src/modules/index.js` — tambah import + entri di `allModules`
4. `src/core/i18n.js` — HANYA menambah kunci baru di `id` dan `en`; tidak ada kunci lama diubah/dihapus
5. `package.json` — HANYA menambah entri di `dependencies`
6. `package-lock.json` — ikut diperbarui otomatis setelah menambah dependensi (wajib di-commit)
7. `build.mjs` — HANYA menambah entri ke `allowedPatterns` di `verifyZeroNetwork()`. Tidak ada perubahan lain
8. `vite.config.mjs` — HANYA menambah entri `alias`/`optimizeDeps` bila dependensi baru memerlukannya

## DILARANG:
- Mengubah, memindahkan, mengganti nama, atau menghapus file di `src/core/*` (`pdf.js`, `coordinates.js`, `queue.js`, `zip.js`, `download.js`, `assets.js`, `workers.js`, `theme.js`, `i18n.js` — kecuali penambahan kunci i18n)
- Mengubah komponen di `src/ui/*` (termasuk `PreviewViewport.vue`, `BaseButton.vue`, `BaseCard.vue`, `BaseInput.vue`, `BaseProgressBar.vue`, `DropZone.vue`, `ToastHost.vue`, `QueueDrawer.vue`, `AppHeader.vue`)
- Mengubah 13 fitur lama di `src/features/*` dan facade `src/modules/*.js`
- Mengubah test lama di `tests/unit/*`
- Mengganti atau menaikkan versi `pdf-lib`, `pdfjs-dist`, `tesseract.js`, `fflate`, `vue`, `vite`, `tailwindcss`, `@tailwindcss/vite`, `@vitejs/plugin-vue`
- Mengubah nama alat, id, kunci i18n lama, kelas CSS lama, atau nilai default yang sudah ada
- Mengubah `netlify.toml`, CSP di `build.mjs`, atau nilai CSP mana pun
- Mengubah `README.md`, `docs/ARCHITECTURE.md`, `PlanPDF.md`, `scripts/*`, `netlify.toml`, `release.mjs` (laporkan saja bila perlu perubahan)

## CARA MEMBUKTIKAN TIDAK ADA YANG RUSAK (sebelum mulai)
Jalankan dan laporkan angkanya:
```
npm test > /tmp/pdfgo-test-before.txt 2>&1; tail -5 /tmp/pdfgo-test-before.txt
npm run build > /tmp/pdfgo-build-before.txt 2>&1; tail -8 /tmp/pdfgo-build-before.txt
shasum -a 256 $(git ls-files 'src/core/*' 'src/ui/*' 'src/features/*' 'src/app/*') > /tmp/pdfgo-baseline.sha
ls -l "dist/PDF To Go.html"
```

Setelah SETIAP alat selesai, jalankan dan laporkan:
```
npm test                                                       # jumlah test lulus TIDAK boleh berkurang
shasum -a 256 -c /tmp/pdfgo-baseline.sha | grep -v ': OK'       # harus KOSONG
git diff --stat                                                # hanya file di daftar BOLEH berubah
git diff -U0 -- src tests | grep '^-' | grep -v '^---'          # harus KOSONG
npm run build                                                   # wajib lolos verifyZeroNetwork()
ls -l "dist/PDF To Go.html"                                     # laporkan ukuran sebelum vs sesudah
```
Kecuali `src/core/i18n.js` (penambahan kunci) dan `package.json`/`package-lock.json` (penambahan dependensi), hasil `git diff` untuk file lama harus MURNI PENAMBAHAN. Kalau ada baris lama terhapus, kembalikan dulu dan ulangi.

# KONDISI REPO (pakai apa adanya, jangan diubah)
- Struktur fitur: `src/features/<id>/` berisi `logic/` (fungsi murni, tanpa DOM, tanpa Vue), `components/` (Vue, ≤120 baris per file), `index.js` (manifest: `id`, `titleKey`, `descKey`, `icon`, `component`).
- Facade: `src/modules/<id>.js` (re-export logika murni + manifest). Dipakai oleh `src/modules/index.js` → `moduleMap` → `src/ui/AppSidebar.vue`.
- Routing: `src/app/router.js` (berbasis hash) + rangkaian `v-else-if` di `src/App.vue`.
- Provider: `src/app/providers/toast.js` (`showToast(msg, type)`), `src/app/providers/queue.js` (`queueState`, `queue`, `toggleQueueDrawer`), `src/app/providers/i18n.js` (`t`, `getLang`, `setLang`), `src/app/providers/theme.js`.
- Komponen UI siap pakai: `BaseButton.vue` (variant `primary|secondary|danger|ghost`, prop `loading`, `disabled`), `BaseCard.vue` (prop `elevated`, `padding`), `BaseInput.vue` (v-model, `type`, `placeholder`), `BaseProgressBar.vue`, `DropZone.vue`, `PreviewViewport.vue` (zoom/pan pratinjau), `ToastHost.vue`, `QueueDrawer.vue`, `AppHeader.vue`, `AppSidebar.vue`.
- Core yang WAJIB dipakai ulang, bukan ditiru ulang: `core/pdf.js` (`loadPdfJsDocument`, `renderPageToCanvas`, `generateThumbnail`, `convertUiCoordsToPdfCoords`, `unwrapPdfProxy`), `core/coordinates.js` (`toNormalized`, `toCanvasPx`, `toPdfRect`, `toDisplayBox`, `renderScale`), `core/zip.js` (`createZipArchive`), `core/download.js` (`downloadFile`), `core/assets.js` (cache IndexedDB), `core/queue.js`, `core/workers.js`.
- Token Tailwind yang ada dan boleh dipakai: `bg-paper`, `bg-paper-dark`, `text-ink`, `border-ink`, `border-2`, `border-3`, `bg-accent`, `bg-accent-2`, `bg-accent-3`, `bg-danger`, `shadow-hard`, `shadow-hard-sm`, `shadow-hard-lg`, `font-display`, `font-ui`, `rounded-sm`. Jangan mengarang nama token baru.
- `pdf-lib@1.17.1` TETAP dipakai untuk semua alat lama dan untuk alat baru yang hanya butuh baca/tulis biasa. `PDFDocument.load(buf, { password })` lalu `save()` sudah cukup untuk membuka PDF terkunci — tanpa lib baru.

## Dependensi baru yang boleh ditambahkan
Semua dipakai HANYA dari dalam folder fitur baru; tidak boleh diimpor oleh file lama:
- `@cantoo/pdf-lib@2.11.1` — HANYA di `src/features/protect/logic/`
- `docx@9.11.0` — HANYA di `src/features/pdf-to-word/logic/`
- `mammoth@1.13.0` — HANYA di `src/features/word-to-pdf/logic/`
- `pptxgenjs@4.0.1` — HANYA di `src/features/pdf-to-powerpoint/logic/`
- `exceljs@4.4.0` — HANYA di `src/features/excel-to-pdf/logic/` dan `src/features/pdf-to-excel/logic/`
- `html2canvas-pro@2.5.2` — HANYA di `src/features/html-to-pdf/logic/`
- `@huggingface/transformers@4.3.1` — HANYA bila memakai jalur varian AI terpisah

# KOMPATIBILITAS NETLIFY (wajib dipatuhi)
1. Aplikasi tetap 100% client-side. Netlify hanya menyajikan `dist/` sebagai aset statis. DILARANG menambah Netlify Functions, Edge Functions, redirect ke API, atau layanan pihak ketiga.
2. `netlify.toml` memasang `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
   - Fitur Pindai jadi PDF v1 HANYA memakai `<input type="file" accept="image/*" capture="environment" multiple>`. JANGAN memakai `getUserMedia`.
   - Jangan membuat tombol "Kamera langsung" pada rilis ini.
3. Ada dua lapis CSP (header Netlify + meta di `build.mjs`) dan keduanya berlaku.
   - JANGAN mengubah nilai CSP di `netlify.toml` maupun di `build.mjs`.
   - iframe `srcdoc` mewarisi CSP induk: pada HTML ke PDF, gambar/font/URL eksternal otomatis diblokir. Beri tahu pengguna di UI: "Gambar dan font eksternal tidak dimuat agar dokumen tetap offline."
   - Sanitasi HTML tetap wajib; jangan mengandalkan CSP sebagai pengganti sanitasi.
4. Setelah menambah dependensi apa pun, commit `package-lock.json`. Netlify memakai `npm ci`; lockfile yang tidak sinkron akan menggagalkan build.
5. Uji seperti lingkungan Netlify sebelum menganggap selesai:
   ```
   rm -rf node_modules && npm ci && npm run build
   ```
   Wajib sukses tanpa error, termasuk `verifyZeroNetwork()`.
6. JANGAN mengubah `netlify.toml`. Kalau sebuah fitur benar-benar membutuhkan perubahan (mis. `camera=(self)`, header COOP/COEP untuk WASM threads), laporkan dan tunggu keputusan.
7. Jangan menaruh model AI di `dist/`. Model diimpor pengguna dari disk lewat `<input type="file">` dan disimpan di IndexedDB. Jangan memakai SharedArrayBuffer/WASM threads (butuh header COOP/COEP). Pakai jalur single-thread.
8. Ukuran total `dist/PDF To Go.html` dilaporkan setiap selesai satu alat. Kalau melewati 10 MB, laporkan dan usulkan pemisahan berkas — jangan ubah `build.mjs` sendiri.

# ALUR LOGIKA YANG WAJIB DIIKUTI (sama seperti 13 alat yang ada)
1. Masukan berkas lewat `DropZone` (atau `<input type="file">` tersembunyi bila alat butuh atribut `capture`/format khusus). Alat yang menerima PDF wajib juga menerima berkas dari antrean global seperti alat lama (baca `queueState`/`queue.getItems()`); jangan membuat antrean sendiri.
2. State lokal alat disimpan di `ref()` di komponen tool. Tidak menaruh state di provider global.
3. Logika berat di `logic/` sebagai fungsi murni: menerima `Uint8Array`/data, mengembalikan `Uint8Array`/objek data, menerima `onProgress` opsional, dan selalu menduplikasi buffer secara defensif: `new Uint8Array(src.slice(0))`.
4. Komponen tidak memanggil `pdf-lib`/`pdfjs`/`tesseract` langsung; semua lewat `logic/` atau `core/`.
5. Pratinjau memakai `PreviewViewport.vue` + `core/coordinates.js`. Tidak membuat kanvas atau sistem koordinat baru.
6. Tombol aksi utama memakai `BaseButton` variant `primary` dengan prop `loading`; dinonaktifkan saat belum siap, dan alasannya ditulis di dekat tombol.
7. Progress memakai `BaseProgressBar.vue` + label persen; operasi panjang punya tombol `Batalkan`.
8. Hasil: kartu ringkasan (nama berkas, ukuran, detail) + tombol `Unduh Hasil` + tombol `Kerjakan File Lain` yang mereset state lokal.
9. Semua status memakai `showToast(...)` dari provider toast. Error: kalimat sebab + langkah berikutnya, tanpa stack trace.
10. Bersihkan `URL.revokeObjectURL` dan set `canvas.width/height = 0` setelah selesai (ikuti pola alat lama).
11. Setiap string lewat `t('...')`, tersedia dalam ID dan EN. Tidak ada string keras di template.

# DESAIN (brutalist, konsisten dengan yang sudah ada)
- Kartu/panel: `border-2 border-ink bg-paper rounded-sm shadow-hard`, teks `text-ink`.
- Tombol: selalu `BaseButton`. Jangan membuat tombol dengan gaya berbeda.
- Judul alat: `font-display font-black uppercase`.
- Label tombol = kata kerja + objek, maksimal 4 kata, bahasa awam: `Buka kunci PDF`, `Kunci dengan password`, `Simpan sebagai Word`, `Pindai jadi PDF`, `Periksa hasil sensor`. Hindari "Eksekusi", "Proses", "Render", "Convert".
- Tailwind: dilarang kelas dinamis hasil string-concat; pakai map kelas statis.
- Target sentuh ≥44 px, kontras ≥4.5:1, rapi pada 360 px, `prefers-reduced-motion` dihormati.

# TITIK REGISTRASI (6, jangan ada yang kelewat)
1. `src/features/<id>/index.js`
2. `src/modules/<id>.js` (facade)
3. `src/modules/index.js` (import + entri `allModules`)
4. `src/ui/AppSidebar.vue` (masuk `toolIds` kategori)
5. `src/App.vue` (import + `v-else-if`)
6. Kunci i18n `tools.<nama>.title` dan `tools.<nama>.desc` di `id` dan `en`

Kategori sidebar: pakai kategori lama (`tools.section.layout`, `tools.section.optimize`, `tools.section.conversion`, `tools.section.security`) untuk alat yang cocok. Untuk alat baru yang tidak cocok, tambah kategori baru beserta kuncinya.

CATATAN: kunci `tools.section.*` saat ini BELUM ADA di `src/core/i18n.js`, sehingga sidebar menampilkan teks mentah seperti `tools.section.layout` (terbukti ada di `dist/PDF To Go.html`). Tambahkan kunci `tools.section.layout/optimize/conversion/security` beserta kunci kategori baru, di `id` dan `en`. Ini penambahan murni yang juga memperbaiki tampilan lama tanpa mengubah fungsi.

# FITUR YANG DITAMBAHKAN
Kerjakan berurutan, SATU ALAT PER GILIRAN. Langkah baku tiap alat: tulis `logic/` + test → tunjukkan `npm test` → tulis komponen → daftarkan di 6 titik → tambah kunci i18n ID+EN → `npm run build` → uji manual dari `file://` tanpa internet → tunjukkan bukti aditif.

## 1. Buka Kunci PDF (`unlock`)
- Logic: `src/features/unlock/logic/removePassword.js` — `PDFDocument.load(buf, { password })` dari `pdf-lib` yang sudah ada → `save()`. Deteksi PDF tidak terenkripsi lewat `isEncrypted`.
- UI: DropZone PDF → input password (`BaseInput type="password"`) → tombol `Buka kunci PDF` → kartu ringkasan + `Unduh Hasil` (`<nama>-terbuka.pdf`).
- Error: password salah (boleh coba lagi), PDF rusak, PDF tidak terenkripsi (tetap lanjutkan, beri pesan info).
- Test: buat PDF terenkripsi di dalam test (memakai `@cantoo/pdf-lib`), buka dengan alat ini, lalu assert hasilnya bisa dimuat tanpa password.
- Sertakan satu baris catatan di UI: hanya untuk dokumen milik Anda atau yang Anda berhak akses.

## 2. Kunci dengan Password (`protect`)
- Logic: `src/features/protect/logic/encryptPdf.js` — SATU-SATUNYA pemakai `@cantoo/pdf-lib`:
  ```js
  const doc = await PDFDocument.load(bytes);
  doc.encrypt({
    userPassword,
    ownerPassword,
    permissions: { printing: 'highResolution', copying, modifying, annotating, fillingForms },
    algorithm: 'AES-256'
  });
  const out = await doc.save();
  ```
- UI: input password + konfirmasi (tolak bila berbeda dan sebutkan alasannya), checkbox izin (cetak, salin teks, ubah, anotasi), tombol `Kunci dengan password`.
- Error: PDF kosong, password kosong, gagal menulis.
- Test: enkripsi → `pdf-lib` load tanpa password harus gagal; dengan password harus sukses dan jumlah halaman sama.
- DILARANG mengubah import `pdf-lib` di file mana pun.

## 3. PDF ke Markdown (`pdf-to-markdown`)
- Logic murni di `logic/`: `extractLayoutItems.js` (dari PDF.js `getTextContent` → item x/y/width/height/fontSize), `groupLines.js`, `detectHeading.js`, `toMarkdown.js`.
- Gambar: `renderPageToCanvas` per halaman → PNG. Bila ada gambar, hasil di-ZIP memakai `core/zip.js`.
- UI: opsi `pisahkan per halaman`, `sertakan gambar`, pratinjau Markdown, tombol `Unduh .md` / `Unduh .zip`.
- Test: `groupLines`, `detectHeading`, `toMarkdown` (heading, bullet, tabel) dengan data sintetis.

## 4. Pindai jadi PDF (`scan-to-pdf`)
- Masukan: `<input type="file" accept="image/*" capture="environment" multiple>`. TIDAK memakai `getUserMedia`.
- Per halaman: potong (4 sudut, pakai `core/coordinates.js`), filter (`Asli`/`Abu-abu`/`Hitam-putih dokumen`/`Perjelas teks` di `logic/applyScanFilter.js`), rotasi, hapus, urutkan ulang.
- Keluaran: impor dan pakai ulang `src/features/image-to-pdf/logic/buildPdfFromImages.js` (impor saja, jangan diubah).
- Test: `applyScanFilter.js` pada matriks piksel kecil.

## 5. HTML ke PDF (`html-to-pdf`)
- Masukan: tempel kode HTML atau impor berkas `.html` lokal. TIDAK boleh memuat URL atau `<img src>` eksternal.
- `logic/sanitizeHtml.js` (buang `<script>`, event handler, `javascript:`, `src`/`href` eksternal) + test.
- Mode A (default, tanpa dependensi): render ke iframe tersembunyi → `window.print()` pada iframe → instruksi `Pilih "Simpan sebagai PDF" pada dialog cetak`.
- Mode B (opsional): `html2canvas-pro` → `logic/paginateCanvas.js` (potong setinggi A4) → `pdf-lib`. Test `paginateCanvas.js`.
- Beri catatan di UI: "Gambar dan font eksternal tidak dimuat agar dokumen tetap offline."

## 6. PDF ke Word (`pdf-to-word`)
- Impor fungsi dari `src/features/pdf-to-markdown/logic/` (boleh diimpor, tidak boleh diubah). Tulis `.docx` dengan `docx@9.11.0`.
- v1: paragraf, heading dari ukuran font, gambar halaman, tabel best-effort.
- Catatan jujur di UI: "Tata letak disusun ulang; font bisa berbeda; kolom majalah dan teks dalam bentuk grafik tidak didukung."
- Test: `buildParagraphs.js`; integrasi kecil: PDF 1 halaman → docx bisa dibaca kembali memakai `mammoth`.

## 7. PDF ke PowerPoint (`pdf-to-powerpoint`)
- `pptxgenjs@4.0.1`. v1: setiap halaman → PNG (`renderPageToCanvas`) → 1 slide seukuran halaman (pt → EMU ×12700 di `logic/ptToEmu.js`).
- Opsi: halaman terpilih, kualitas gambar.
- Test: `ptToEmu.js` dan `buildSlidePlan.js`.

## 8. Excel ke PDF (`excel-to-pdf`)
- Baca `.xlsx`/`.csv` dengan `exceljs@4.4.0` di `logic/readSheet.js` → model grid (`logic/sheetToGrid.js`) → gambar ke PDF memakai `pdf-lib` + `@pdf-lib/fontkit` (sudah tersedia).
- SPIKE WAJIB DULU: pastikan `exceljs` bisa di-bundle IIFE tanpa modul Node. Kalau gagal, LAPOR dan tunggu keputusan; jangan membongkar `build.mjs`.
- Test: `sheetToGrid.js` + integrasi kecil (workbook kecil → PDF jumlah halaman sesuai).

## 9. Word ke PDF (`word-to-pdf`)
- `mammoth@1.13.0` di `logic/docxToHtml.js` → sanitasi memakai `logic/sanitizeHtml.js` (impor dari `features/html-to-pdf/logic/`) → jalur HTML ke PDF dari alat 5.
- Test: docx sintetis → HTML mengandung teks yang diharapkan.

## 10. Edit PDF / Tambah Objek (`edit-pdf`)
- Overlay saja: Teks (font tersemat via `@pdf-lib/fontkit`), Gambar, Bentuk (persegi/elips/garis/panah), Coretan (polyline pointer), Kotak tutup.
- Kanvas memakai `PreviewViewport.vue` + `core/coordinates.js`. Interaksi (pindah, ubah ukuran, panah nudge, `Delete`, undo) mengikuti POLA `src/features/redact/logic/boxInteractions.js` — salin polanya ke `logic/objectInteractions.js` milik fitur baru; jangan mengubah file redact.
- Panel: daftar objek per halaman + `Hapus objek ini` + input angka posisi/ukuran.
- Simpan: `Ratakan & simpan PDF` (default) → `Unduh Hasil`.
- Catatan jujur di UI: "Alat ini menambah objek di atas halaman. Mengubah teks yang sudah ada di dalam PDF tidak didukung — tutupi teks lama lalu tulis teks baru."
- Test: `objectInteractions.js` + `renderOverlayToPdf.js` (assert objek mendarat di koordinat yang diminta dengan membaca ulang PDF hasil).

## 11. PowerPoint ke PDF (`powerpoint-to-pdf`)
- Parse `.pptx` manual dengan `fflate` yang sudah ada: `unzipSync` → `ppt/presentation.xml` (urutan slide) + `ppt/slides/slideN.xml` + `ppt/media/*`.
- Logic: `parseSlideXml.js` (ambil `a:t` + `a:off`/`a:ext`), `emuToPt.js`, lalu gambar ke PDF. Ukuran halaman = ukuran slide.
- Test: `parseSlideXml.js` dan `emuToPt.js` dengan XML contoh.

## 12. PDF ke Excel (`pdf-to-excel`)
- Pakai item layout dari alat 3. Logic: `detectColumns.js`, `detectRows.js`. Tulis `.xlsx` dengan `exceljs@4.4.0`.
- Dua mode: `Deteksi tabel otomatis` dan `Semua teks` (satu sheet per halaman berisi kolom X/Y/teks/fontSize) sebagai fallback jujur.
- Catatan di UI: "Hasil deteksi tabel perlu diperiksa."
- Test: `detectColumns.js` dan `detectRows.js`.

## 13. (Opsional, paling akhir, varian terpisah) AI Ringkas & Terjemah
- Langkah pertama WAJIB nol dependensi: `Siapkan untuk AI` — ekstrak teks → susun prompt (ringkas / terjemah / poin) → tombol `Salin prompt` → kotak `Tempel hasil dari AI` → simpan hasil sebagai `.md`/`.txt`/PDF. Tidak ada jaringan, tidak ada model.
- Model lokal (`@huggingface/transformers`) hanya bila diminta eksplisit dan hanya di varian build terpisah: `env.allowRemoteModels = false`, `env.allowLocalModels = false`, bobot model HANYA dari berkas yang diimpor pengguna, disimpan di IndexedDB lewat `core/assets.js`, single-thread, tanpa SharedArrayBuffer. Cek WebGPU/WASM SIMD sebelum memuat. JANGAN pernah memuat model dari URL.
- Jangan mengubah `build.mjs` selain menambah varian baru bila diperlukan; `--variant=all` tetap menghasilkan `full` + `lite` seperti sekarang.

# URUTAN & GATE
Kerjakan 1 → 13. Jangan memulai alat berikutnya sebelum gate lolos:
1. `npm test` hijau; jumlah test lulus tidak berkurang dibanding baseline.
2. `shasum -a 256 -c /tmp/pdfgo-baseline.sha` → semua `OK` untuk file lama, kecuali yang ada di daftar BOLEH berubah.
3. `git diff -U0 -- src tests | grep '^-' | grep -v '^---'` → KOSONG.
4. `npm run build` sukses dan `verifyZeroNetwork()` lolos.
5. Minimal 3 alat lama (mis. merge, split, compress) tetap berjalan saat diuji manual dari `file://`.
6. Ukuran `dist/PDF To Go.html` sebelum vs sesudah dilaporkan.
7. `rm -rf node_modules && npm ci && npm run build` sukses (uji setara Netlify) — lakukan minimal sekali setelah menambah dependensi baru, dan sekali lagi di akhir.

# DEFINISI SELESAI (per alat)
1. Ada di sidebar, bisa dibuka lewat `#<id>`, tidak ada error di console.
2. Semua teks tersedia dalam ID dan EN; tidak ada string keras di template.
3. `logic/` punya test; `npm test` hijau.
4. Jalan dari `file://` tanpa internet.
5. Tidak ada file >120 baris di folder fitur baru; tidak ada import antar-`features/*` kecuali fungsi murni yang sudah ada dan tidak diubah.
6. Error ditangani dengan pesan awam + langkah berikutnya.
7. Batasan fidelity ditulis jujur di UI.
8. Bukti aditif ditunjukkan (shasum OK, `git diff` baris lama kosong, hasil `npm test`, ukuran build).

# DI LUAR CAKUPAN
- Mengubah, memperbaiki, atau merefaktor 13 alat lama, `src/core/*`, `src/ui/*`, `build.mjs`, `netlify.toml`, test lama, atau dokumentasi.
- Mengganti `pdf-lib` global atau menaikkan versi dependensi lama.
- Mengedit teks yang sudah ada di dalam PDF (in-place content stream edit).
- Membaca URL, mengunduh apa pun, atau memuat model dari internet.
- Netlify Functions / Edge Functions / backend apa pun.
- `getUserMedia` dan tombol kamera langsung.
- Format lain yang tidak diminta (ODT, RTF, SVG, ePub).

# CARA KERJA
- Mulai dengan membuat baseline (test, build, shasum, ukuran HTML) dan laporkan angkanya.
- Laporkan SATU alat per giliran: daftar file baru, bukti aditif, hasil `npm test`, ukuran build, dan 1 baris catatan tentang apa yang di-skip + risiko.
- Kalau ragu apakah sebuah perubahan menyentuh kode lama, tanya dulu. Jangan menebak.
- Kalau sebuah fitur ternyata menuntut perubahan pada file di daftar DILARANG (mis. `netlify.toml` untuk kamera, atau `build.mjs` untuk varian baru), berhenti, laporkan, dan tunggu keputusan.
````
