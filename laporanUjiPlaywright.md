# Laporan Uji Fungsional dengan Playwright

Tanggal: 17 Oktober 2026
Ruang lingkup: seluruh 25 alat PDFGO diuji dari browser (Chromium) dengan alur kerja
ujung-ke-ujung: unggah berkas, atur opsi, jalankan, unduh hasil, lalu hasilnya dibaca
kembali dan diperiksa isinya.

## Cara menjalankan

```bash
npm test        # 129 unit test
npm run test:e2e # build ulang + 49 tes browser
```

`npm run test:e2e` membangun ulang `dist/` lebih dulu supaya yang diuji bukan hasil
build lama.

## Hasil

| Berkas | Jumlah tes | Cakupan |
|---|---|---|
| `tests/e2e/app-shell.spec.mjs` | 6 | kerangka aplikasi, daftar 25 alat, rute tidak dikenal |
| `tests/e2e/edit-pdf.spec.mjs` | 7 | Edit Tulisan PDF |
| `tests/e2e/i18n.spec.mjs` | 4 | 25 rute × id/en, tidak ada kunci i18n bocor |
| `tests/e2e/workflows-layout.spec.mjs` | 10 | Gabung, Pisah, Atur Halaman, Nomor Halaman, Watermark, Kompres, Ekstrak Teks, Isi Formulir |
| `tests/e2e/workflows-convert.spec.mjs` | 10 | Gambar→PDF, PDF→Gambar, PDF→Markdown, PDF→Word, PDF→PowerPoint, PDF→Excel, Excel→PDF, PowerPoint→PDF, Pindai→PDF |
| `tests/e2e/workflows-print.spec.mjs` | 3 | HTML→PDF, Word→PDF (alur dialog cetak) |
| `tests/e2e/workflows-security.spec.mjs` | 7 | Tanda Tangan, Sensor, Buka Kunci, Kunci PDF |
| `tests/e2e/ocr.spec.mjs` | 2 | OCR |

Status akhir: **129/129 unit test lulus, 49/49 tes browser lulus** (≈41 detik).

Tes tidak hanya memeriksa "ada berkas terunduh". Hasilnya dibaca kembali dan diperiksa:

- PDF: jumlah halaman, sudut rotasi halaman, dan teks yang benar-benar bisa diekstrak.
- ZIP: daftar entri di dalamnya, dan header PNG tiap gambar.
- XLSX: isi sel dibaca dengan ExcelJS.
- DOCX: teks dibaca dengan mammoth.
- PPTX: jumlah slide di dalam paket.
- PDF terisi: nilai kolom dibaca kembali dengan pdf-lib.
- PDF terkunci: pdf.js harus **menolak** membukanya (bukti enkripsi nyata).
- PDF terkunci yang dibuka: pdf.js harus bisa membukanya tanpa sandi.

Setiap tes juga gagal otomatis kalau halaman melempar error JavaScript yang tidak
tertangkap. Ini yang memunculkan bug pertama (unggah berkas bukan PDF di Edit PDF).

## Bug yang ditemukan dan diperbaiki

### 1. Word ke PDF rusak total di browser (berat)

`src/features/word-to-pdf/logic/docxToHtml.js`

Fungsi ini memanggil mammoth dengan `{ buffer }`. Build mammoth untuk Node menerima
`buffer`, tetapi build untuk browser hanya menerima `arrayBuffer`. Akibatnya setiap
berkas .docx gagal di browser dengan pesan "Could not find file in options", dan
pratinjau tidak pernah muncul. Unit test tidak menangkap ini karena unit test berjalan
di Node, tempat `buffer` memang benar.

Perbaikan: kirim kedua kunci (`{ buffer, arrayBuffer }`) supaya satu jalur kode bekerja
di browser dan di test.

### 2. Tombol aksi bisa diklik sebelum dokumen siap, lalu diam saja (sedang)

Alat: Kompres, OCR, Nomor Halaman, PDF→Gambar, Watermark, dan Pisah.

Pola lama: `activeFile` diisi **sebelum** dokumen selesai dibuka, sementara tombol aksi
hanya dinonaktifkan saat proses berjalan. Kalau pengguna menekan tombol tepat setelah
memilih berkas, penangan klik langsung `return` tanpa pesan apa pun — tidak ada hasil,
tidak ada peringatan. Ini benar-benar terjadi pada tes browser dan membuat tes gagal.

Pada Pisah ada tambahan: rentang halaman yang sudah diketik pengguna ditimpa kembali ke
nilai default saat dokumen selesai dimuat.

Perbaikan: `activeFile` baru diisi setelah dokumen berhasil dibuka (pola yang sudah
dipakai Edit Tulisan PDF). Setelah perbaikan, tombol aksi baru muncul saat alat benar-
benar siap.

### 3. Nama berkas hasil OCR bertumpuk ekstensi (ringan)

`src/features/ocr/components/OcrTool.vue`

OCR menerima gambar, tetapi hanya ekstensi `.pdf` yang dipotong dari nama berkas.
Hasilnya `gambar.png_searchable.pdf`. Sekarang ekstensi gambar juga dipotong.

## Temuan yang belum diperbaiki (perlu keputusan Anda)

### A. Unduh massal dari Antrean tidak pernah bisa aktif

`src/ui/QueueDrawer.vue`, `src/core/queue.js`

Tombol "Unduh Semua ZIP" aktif hanya jika ada item antrean yang punya `result`. Field
`result` selalu `null` karena tidak ada satu pun komponen yang mengisinya; method
`updateItem()` juga tidak pernah dipanggil. Jadi tombolnya selamanya nonaktif dan
tombol unduh per item tidak pernah muncul.

Antrean sendiri tetap berguna: "Ekstrak Teks" memakai `queue.addFiles()` untuk
menyerahkan berkas ke OCR. Yang belum jadi hanya bagian unduhannya.

Pilihan: (a) sambungkan `result` saat alat selesai memproses, atau (b) hapus tombol dan
kode unduhan yang tidak terpakai. Ini keputusan produk, jadi saya tidak mengubahnya.

### B. Kompres menghilangkan lapisan teks

Kompresi meraster tiap halaman menjadi gambar. Teks tetap terbaca secara visual, tetapi
tidak lagi bisa dipilih, dicari, atau disalin. Deskripsi alat saat ini berbunyi
"tanpa mengorbankan keterbacaan teks", yang bisa menyesatkan. Ini perilaku yang wajar
untuk kompresi berbasis raster, hanya kalimatnya yang perlu diperjelas.

### C. Race kecil di Gambar ke PDF

`src/features/image-to-pdf/components/ImageToPdfTool.vue`

Item gambar dimasukkan ke daftar sebelum isi berkasnya selesai dibaca. Tombol "Buat PDF"
aktif begitu daftar berisi, jadi klik yang sangat cepat bisa memproses gambar yang belum
siap. Bedanya dengan bug nomor 2: di sini muncul pesan error, bukan diam. Perbaikannya
adalah menonaktifkan tombol sampai semua buffer selesai dibaca.

### D. Beberapa alat belum memakai i18n

Gabung, Kompres, Watermark, Tanda Tangan, Sensor, Atur Halaman, Nomor Halaman,
Gambar ke PDF, Ekstrak Teks, dan PDF ke Gambar masih memakai teks Indonesia langsung di
dalam komponen. Alat-alat ini tidak ikut berubah saat bahasa diganti ke Inggris.
Tes i18n yang ada tidak menangkapnya karena hanya memeriksa kunci i18n yang bocor,
bukan teks yang belum diterjemahkan.

## Yang belum diuji lewat browser

- Alur unduh massal Antrean (lihat temuan A — memang tidak bisa dijalankan).
- Tema terang/gelap dan ukuran tata letak hanya diperiksa di `app-shell`.
- Pemulihan dari berkas rusak yang berat (PDF rusak, DOCX rusak) baru sebagian.
- Interaksi kamera pada Pindai jadi PDF (butuh perangkat kamera).

## Catatan teknis

- Fixture dibuat saat tes berjalan ke `tests/e2e/.fixtures` (diabaikan git), termasuk
  PDF berpassword, PDF berformulir, DOCX, PPTX, XLSX, HTML, dan PNG. Tidak ada berkas
  biner yang disimpan di repo.
- Peringatan `fetchStandardFontData: ... LiberationSans-Regular.ttf` berasal dari pdf.js
  yang berjalan di Node saat membaca hasil tes, bukan dari aplikasi.
- `page.getByRole('button', { name })` mencocokkan sebagian teks dan tidak case-sensitive,
  jadi bisa mengenai tombol sidebar. Semua pencarian tombol di tes kini dibatasi ke
  elemen `main`.
