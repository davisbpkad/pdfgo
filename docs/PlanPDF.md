# PERAN
Kamu adalah Senior Frontend Engineer yang ahli dalam pemrosesan dokumen di browser (PDF.js, pdf-lib, WebAssembly, Web Workers) dan membangun aplikasi offline-first yang aman.

# TUJUAN
Bangun **PDF Toolkit**: aplikasi web manipulasi dan pengelolaan PDF yang **100% client-side dan offline**. Tidak ada satu byte pun dokumen pengguna yang boleh dikirim ke server mana pun. Hasil akhirnya adalah file HTML mandiri (`dist/index.html` dan `dist/PDF Toolkit.html`, plus varian Lite, lihat Build Pipeline) yang berjalan identik saat:
1. dibuka langsung lewat klik ganda (protokol `file://`) tanpa internet, dan
2. dihosting di server statis biasa (HTTPS).

# BATASAN WAJIB (NON-NEGOTIABLE)
1. **Zero network.** Dilarang memakai `fetch`/XHR ke domain luar, CDN, analytics, telemetry, atau font eksternal. Semua library, worker, WASM, model bahasa, dan font harus di-inline ke dalam bundel.
2. **Kompatibel `file://`.** Tidak boleh bergantung pada `fetch()` file lokal atau `new Worker('file://...')` (diblokir CORS). Semua worker dan modul WASM diinisialisasi dari **Blob URL**:
   `URL.createObjectURL(new Blob([code], { type: 'application/javascript' }))`
3. **Tanpa backend.** Tidak ada server, API, atau database. Jika perlu persistensi (tema, bahasa), gunakan `localStorage` dengan `try/catch`.
4. **Tidak ada kebocoran privasi.** Tambahkan `Content-Security-Policy` meta tag yang memblokir koneksi keluar (`default-src 'none'; script-src 'self' 'unsafe-inline' blob:; worker-src blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src blob: data:`), sesuaikan seperlunya agar WASM dan worker tetap berjalan.
5. **Pemrosesan berat di Web Worker** agar UI tidak membeku. Beri progress bar dan tombol batal untuk operasi panjang.
6. **Bersihkan memori:** panggil `URL.revokeObjectURL`, lepaskan canvas dan `ArrayBuffer` yang tidak dipakai setelah selesai.
7. **Ukuran bundel harus dikelola secara sadar.** Meng-inline WASM, model bahasa, dan font membuat file akhir besar (bisa puluhan MB). Terapkan strategi berikut:
   - Sediakan dua varian build: **Full** (model OCR `ind` + `eng` sudah ter-inline, siap pakai offline total) dan **Lite** (tanpa model OCR; modul OCR bersifat opsional).
   - Pada varian Lite, modul OCR tetap tampil di navbar dengan status "Model OCR belum dimuat". Pengguna mengimpor file `traineddata` lokal lewat file picker (`<input type="file">`), yang disimpan di IndexedDB agar tidak perlu diimpor ulang. Impor ini membaca file dari disk pengguna dan **tidak boleh** memanggil jaringan.
   - Kurangi ukuran dengan: memakai model `traineddata_fast` (bukan `best`) kecuali ada alasan kuat, subset font (hanya glyph Latin + tanda baca Indonesia), dan opsi mengompresi aset Base64 (gzip/deflate) lalu mendekompresinya saat runtime dengan `DecompressionStream` atau `fflate`.
   - Dekompresi dan inisialisasi aset berat (WASM, model OCR) dilakukan **lazy**, hanya saat modul terkait pertama kali dibuka, supaya waktu muat awal tetap cepat.

# TECH STACK
- Bahasa: JavaScript ES2022 modular (vanilla JS atau framework ringan; hindari dependensi yang tidak perlu).
- Manipulasi PDF: `pdf-lib` (+ `@pdf-lib/fontkit` untuk font Unicode).
- Render dan ekstraksi teks: `pdfjs-dist` (worker via Blob URL).
- OCR: `tesseract.js` + Tesseract Core WASM + `traineddata` untuk `ind` dan `eng`, semuanya lokal.
- ZIP: `jszip` (atau `fflate`).
- Drag & drop urutan halaman: Pointer Events / HTML5 DnD native atau `SortableJS` (di-bundle).
- Build: `esbuild` (`target: es2022`, `format: iife`, `minify: true`).
- Font (open-source, di-embed Base64 Data URL): **Fraunces** (judul), **Atkinson Hyperlegible** (UI/body), **Dancing Script** dan **Caveat** (gaya tanda tangan ketik).

# FITUR (SATU MODUL PER ALAT, DIAKSES DARI NAVBAR)

1. **Gabung PDF (Merge)**
   Terima banyak PDF sekaligus, tampilkan daftar dengan thumbnail halaman pertama, jumlah halaman, dan ukuran file. Urutan bisa diubah dengan drag & drop, tiap file bisa dihapus. Hasilkan satu PDF berurutan. Tangani PDF terenkripsi dengan meminta password lokal, atau tampilkan pesan error yang jelas.

2. **Pisah PDF (Split)**
   Dua mode: (a) ekstrak rentang halaman, misalnya `1-3, 5, 8-10`, dengan validasi input dan pratinjau; (b) pisah menjadi satu file per halaman, atau per N halaman. Keluaran multi-file dikemas otomatis ke ZIP.

3. **Atur Halaman (Organize)**
   Grid thumbnail visual untuk semua halaman. Fitur: drag & drop susun ulang, rotasi per halaman (90°, 180°, 270°), hapus halaman, pilih beberapa halaman sekaligus, dan undo/redo. Thumbnail dirender malas (lazy) dengan PDF.js agar ringan untuk dokumen ratusan halaman.

4. **Tanda Tangan Digital (Sign)**
   Tiga cara membuat tanda tangan: (a) gambar langsung di canvas (mouse/touch/stylus, dengan smoothing garis dan pilihan warna/ketebalan), (b) ketik nama dengan font Dancing Script/Caveat, (c) unggah gambar paraf/stempel (PNG/JPG, dengan opsi hapus latar putih menjadi transparan). Tanda tangan bisa ditempatkan, digeser, diubah ukuran, dan diputar di posisi mana pun di atas halaman mana pun, serta ditempel di banyak halaman. Tanda tangan yang tersimpan hanya disimpan di memori/`localStorage` lokal. Embed sebagai gambar PNG transparan lewat pdf-lib. Pastikan koordinat UI dikonversi dengan benar ke sistem koordinat PDF (origin kiri-bawah, memperhitungkan rotasi halaman dan CropBox).

5. **Isi Formulir (Fill Form)**
   Deteksi field AcroForm interaktif (teks, checkbox, radio, dropdown, list box) dan tampilkan sebagai input yang sesuai di atas pratinjau halaman. Isi nilai, lalu simpan. Sediakan opsi "flatten" (ratakan formulir) agar tidak bisa diedit lagi. Jika tidak ada field, tampilkan informasi dan sarankan alat Tanda Tangan/Teks.

6. **Sensor Dokumen (Redact)**
   Pengguna menggambar kotak di area sensitif. **Sensor harus permanen dan benar-benar menghapus data**, bukan sekadar menimpa kotak hitam di atas teks. Implementasi: render halaman yang disensor ke canvas beresolusi tinggi, gambar kotak hitam solid, lalu ganti halaman tersebut dengan gambar hasil raster (teks dan vektor di bawahnya hilang total). Halaman yang tidak disensor dibiarkan utuh. Hapus juga metadata dokumen (Title, Author, dll.) dengan opsi. Beri peringatan jelas bahwa halaman tersensor menjadi gambar. Tambahkan fitur cari teks lalu sensor otomatis semua kemunculannya (via PDF.js text layer).

7. **Kompres PDF**
   Tiga level (Ringan / Seimbang / Maksimal) dan opsi lanjutan (DPI target, kualitas JPEG). Strategi adaptif: render halaman ke canvas lalu encode JPEG dengan kualitas sesuai level, atau rekompres gambar yang tertanam. Tampilkan ukuran sebelum dan sesudah beserta persentase penghematan. Jika hasil lebih besar dari aslinya, beri tahu pengguna dan tawarkan file asli. Jelaskan trade-off: kompresi berbasis raster menghilangkan teks yang bisa dipilih, jadi sediakan opsi menjalankan OCR setelahnya.

8. **OCR**
   Gunakan Tesseract.js dengan WASM dan model `ind` + `eng` yang sepenuhnya lokal (pilihan bahasa: Indonesia, Inggris, atau keduanya). Render halaman ke canvas (≈300 DPI), jalankan OCR di worker dengan progress per halaman. Keluaran: (a) **PDF yang bisa dicari** dengan lapisan teks tak terlihat di atas gambar asli, dan (b) berkas `.txt`. Karena `file://` memblokir pemuatan model dan worker, solusinya: inisialisasi worker dan core dari Blob URL, dan sediakan `traineddata` dari data Base64 yang di-inline (misalnya dengan cache IndexedDB yang diisi lebih dulu atau shim loader), tanpa pernah memanggil jaringan. Pada varian Lite, model dimuat lewat impor file lokal (lihat Batasan Wajib poin 7).

9. **Ekstrak Teks**
   Ekstrak seluruh teks lewat PDF.js (`getTextContent`) dengan pemeliharaan urutan baca dan jeda baris/paragraf yang wajar, dengan pemisah per halaman opsional. Unduh sebagai `.txt` (UTF-8). Jika teks kosong (dokumen hasil scan), tawarkan beralih ke modul OCR.

10. **Watermark**
    Teks kustom, ukuran, warna (color picker), transparansi (opacity), sudut rotasi, dan posisi (tengah, diagonal, atau pola berulang/tiled). Pilihan halaman: semua, rentang, atau ganjil/genap. Dukung karakter Unicode/Bahasa Indonesia lewat font yang di-embed. Sertakan pratinjau langsung (live preview).

11. **Nomor Halaman**
    Format fleksibel dengan token, misalnya `Halaman {n} dari {total}`, `{n}/{total}`, `- {n} -`. Pilihan angka awal, rentang halaman, 9 posisi (kiri/tengah/kanan × atas/tengah/bawah), margin, font, ukuran, dan warna. Pratinjau langsung.

12. **PDF ke Gambar**
    Konversi tiap halaman (atau halaman terpilih) ke PNG atau JPEG. Pilihan skala/DPI (72–300+) dan kualitas JPEG. Hasil dikemas otomatis ke ZIP dengan penamaan berurut (`nama-001.png`). Peringatkan jika memori diperkirakan tidak cukup (dimensi canvas terlalu besar) dan turunkan skala secara otomatis.

13. **Gambar ke PDF**
    Terima banyak PNG, JPG, dan WebP. Urutan bisa diatur dengan drag & drop, dengan rotasi per gambar. Opsi ukuran halaman (A4, Letter, ukuran asli gambar), orientasi, margin, dan mode fit (contain/cover). Konversi WebP ke PNG/JPEG via canvas sebelum di-embed. Hormati orientasi EXIF.

14. **Multi-File Batch Processing**
    - Pengguna bisa memilih banyak file atau drag-and-drop batch, baik di halaman utama maupun dalam tiap modul.
    - `main.js` membaca seluruh `FileList`, menormalkannya (validasi tipe/ukuran, deduplikasi), dan memasukkannya ke state antrean dokumen.
    - **Alat agregator (Merge, Gambar ke PDF):** semua file digabung ke satu daftar urutan kerja.
    - **Alat per-dokumen (Kompres, Watermark, OCR, Nomor Halaman, Ekstrak Teks):** diproses satu per satu secara berurutan dengan progress bar per file dan total, status (menunggu/berjalan/selesai/gagal), dan error yang terisolasi (satu file gagal tidak menghentikan antrean). Hasil bisa diunduh individual atau sekaligus dalam satu ZIP.

15. **Mode Gelap/Terang & Multibahasa (ID/EN)**
    Toggle tema (ikuti `prefers-color-scheme` secara default, simpan pilihan pengguna) dan toggle bahasa Indonesia/Inggris. Seluruh string UI dikelola lewat satu kamus i18n (tanpa string hardcoded di komponen). Antarmuka responsif dari mobile hingga desktop dan dapat diakses (kontras WCAG AA, navigasi keyboard, label ARIA, `prefers-reduced-motion`).

# ARSITEKTUR & ALUR
```
src/
  main.js            // bootstrap, router modul, state antrean file global
  core/
    queue.js         // antrean batch, progress, cancel
    workers.js       // pembuat worker via Blob URL
    pdf.js           // helper pdf-lib + PDF.js (load, render, koordinat)
    assets.js        // loader aset lazy (dekompresi, cache IndexedDB, impor model OCR lokal)
    i18n.js, theme.js, download.js, zip.js
  modules/
    merge.js split.js organize.js sign.js form.js redact.js
    compress.js ocr.js extract-text.js watermark.js page-numbers.js
    pdf-to-image.js image-to-pdf.js
  styles/            // CSS dengan variabel tema gelap/terang
  assets/            // font, worker, WASM, traineddata (sumber untuk build)
build.mjs
release.mjs
```
- Tiap modul mengekspor antarmuka seragam: `init(container, ctx)`, `onFiles(files)`, `destroy()`.
- Pisahkan logika murni (pemrosesan PDF) dari UI agar mudah diuji.

# BUILD PIPELINE
**`build.mjs`** (ES Module), menerima flag `--variant=full|lite|all` (default `all`):
1. Kompilasi JS dan CSS dengan `esbuild` (`target: es2022`, `format: iife`, `minify: true`).
2. Baca `pdfjs-dist/build/pdf.worker.mjs` serta worker dan core WASM `tesseract.js`, lalu ubah ke Base64 string (opsional dikompresi dulu) dan sisipkan ke bundel JS. Saat runtime, buat Blob URL dari string tersebut. Untuk varian **Full**, sertakan juga `ind.traineddata.gz` dan `eng.traineddata.gz`; untuk varian **Lite**, jangan sertakan model OCR.
3. Sisipkan font (Fraunces, Atkinson Hyperlegible, Dancing Script, Caveat) sebagai Data URL Base64 di `@font-face`, dengan subset glyph untuk menekan ukuran.
4. Hasilkan file tunggal tanpa referensi eksternal sama sekali:
   - Full: `dist/index.html` dan `dist/PDF Toolkit.html`
   - Lite: `dist/PDF Toolkit Lite.html`
5. **Laporan ukuran:** di akhir build, cetak tabel ukuran tiap varian dan rincian kontribusi per aset (WASM, tiap model bahasa, font, kode aplikasi). Beri peringatan jika varian Lite melebihi target (misalnya 15 MB) atau varian Full melebihi anggaran yang disepakati.
6. Tambahkan langkah verifikasi: pindai output untuk mendeteksi pola `http://`, `https://`, `<script src=`, atau `<link href=` ke luar, dan gagalkan build jika ditemukan (kecuali string non-jaringan seperti namespace XML).

**`release.mjs`:**
1. Jalankan pengujian lalu build final semua varian.
2. Ambil tangkapan layar otomatis (Playwright) untuk dokumentasi dan materi promosi (mode terang/gelap, ID/EN).
3. Kompres bundel distribusi menjadi ZIP rilis, termasuk README singkat yang menjelaskan perbedaan Full vs Lite dan cara mengimpor model OCR pada Lite.

# PENGUJIAN & KRITERIA PENERIMAAN
- Uji unit untuk fungsi murni (parser rentang halaman, konversi koordinat, format nomor halaman, ekstraksi teks).
- Uji end-to-end (Playwright) dengan membuka `dist/PDF Toolkit.html` lewat `file://` dan **memblokir seluruh jaringan**; semua 13 alat harus tetap berfungsi. Ulangi untuk varian Lite (OCR diuji setelah mengimpor model lokal).
- Verifikasi di panel Network DevTools: **nol request keluar** saat memproses dokumen.
- Verifikasi sensor: teks di area tersensor **tidak dapat diekstrak** dari PDF hasil (cek dengan PDF.js dan `pdftotext`).
- Verifikasi OCR: PDF scan hasil OCR dapat dicari/disalin teksnya; bahasa Indonesia dan Inggris keduanya dikenali.
- Performa: dokumen 100 halaman tidak membekukan UI; memori dilepas setelah selesai; aset berat tidak diinisialisasi sebelum modulnya dibuka.
- Cek di Chrome, Edge, Firefox, Safari (versi modern), termasuk layar sentuh.
- Penanganan error ramah pengguna: file rusak, PDF terproteksi password, file terlalu besar, memori tidak cukup, model OCR belum dimuat (Lite).

# CARA KERJA PENGGUNA (UX)
1. Buka aplikasi di peramban atau jalankan file HTML secara offline.
2. Pilih modul alat PDF di bilah navigasi.
3. Unggah atau tarik & letakkan file.
4. Sesuaikan konfigurasi, lalu unduh hasilnya seketika.
Tampilkan lencana "100% Offline • File tidak pernah meninggalkan perangkat Anda" yang menonjol di antarmuka.

# CARA BEKERJA (WAJIB BERTAHAP)
Proyek ini besar. **Jangan membangun semuanya dalam satu sesi atau satu respons.** Kerjakan per tahap, dan setelah setiap tahap berhenti untuk melapor dan menunggu persetujuan saya sebelum lanjut.

Mulai dengan rencana singkat: arsitektur, daftar dependensi beserta versi, dan risiko teknis utama (terutama `file://` + Tesseract, sensor permanen, dan ukuran bundel). Tunggu persetujuan, lalu jalankan tahap berikut:

- **Tahap 1: Kerangka & build pipeline.** Struktur proyek, `build.mjs` (termasuk inline worker via Blob URL, font, CSP, pemindai anti-jaringan, laporan ukuran), router modul, state antrean, i18n, tema, dan lencana offline. Belum ada modul alat.
- **Tahap 2: Modul pertama sebagai bukti arsitektur.** Gabung PDF (Merge) sampai lolos uji `file://` dengan jaringan diblokir.
- **Tahap 3: Modul PDF dasar.** Split, Organize, Ekstrak Teks, PDF ke Gambar, Gambar ke PDF.
- **Tahap 4: Modul anotasi.** Watermark, Nomor Halaman, Tanda Tangan, Isi Formulir.
- **Tahap 5: Modul berisiko tinggi.** Sensor (Redact) dan Kompres.
- **Tahap 6: OCR.** Implementasi loader lokal, varian Full dan Lite, impor model, serta pengujian bahasa ID/EN.
- **Tahap 7: Batch processing penuh, polesan, dan rilis.** Antrean multi-file di semua modul per-dokumen, aksesibilitas, `release.mjs`, tangkapan layar, dan ZIP rilis.

Aturan di setiap tahap:
1. Di akhir tiap tahap, laporkan: apa yang selesai, hasil pengujian, ukuran bundel saat ini, masalah yang ditemukan, dan rencana tahap berikutnya.
2. Jangan melanjutkan ke tahap berikutnya sebelum kriteria penerimaan tahap saat ini terpenuhi dan saya setuju.
3. Jangan mengurangi atau menyederhanakan fitur tanpa memberi tahu saya alasannya.
4. Di akhir tahap terakhir, berikan ringkasan: struktur proyek, cara menjalankan `build` dan `release`, keterbatasan yang diketahui, dan saran pengembangan lanjutan.