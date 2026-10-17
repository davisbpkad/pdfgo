# Laporan Uji Fungsional dengan Playwright

Tanggal: 17 Oktober 2026
Ruang lingkup: seluruh 25 alat PDFGO diuji dari browser (Chromium) dengan alur kerja
ujung-ke-ujung: unggah berkas, atur opsi, jalankan, unduh hasil, lalu hasilnya dibaca
kembali dan diperiksa isinya.

## Cara menjalankan

```bash
npm test        # 129 unit test
npm run test:e2e # build ulang + 53 tes browser
```

`npm run test:e2e` membangun ulang `dist/` lebih dulu supaya yang diuji bukan hasil
build lama.

## Hasil

| Berkas | Jumlah tes | Cakupan |
|---|---|---|
| `tests/e2e/app-shell.spec.mjs` | 6 | kerangka aplikasi, daftar 25 alat, rute tidak dikenal |
| `tests/e2e/edit-pdf.spec.mjs` | 7 | Edit Tulisan PDF |
| `tests/e2e/i18n.spec.mjs` | 5 | 25 rute × id/en, tidak ada kunci i18n bocor, tidak ada teks Indonesia di mode Inggris |
| `tests/e2e/workflows-layout.spec.mjs` | 10 | Gabung, Pisah, Atur Halaman, Nomor Halaman, Watermark, Kompres, Ekstrak Teks, Isi Formulir |
| `tests/e2e/workflows-convert.spec.mjs` | 11 | Gambar→PDF, PDF→Gambar, PDF→Markdown, PDF→Word, PDF→PowerPoint, PDF→Excel, Excel→PDF, PowerPoint→PDF, Pindai→PDF |
| `tests/e2e/workflows-print.spec.mjs` | 3 | HTML→PDF, Word→PDF (alur dialog cetak) |
| `tests/e2e/workflows-security.spec.mjs` | 7 | Tanda Tangan, Sensor, Buka Kunci, Kunci PDF |
| `tests/e2e/ocr.spec.mjs` | 3 | OCR, termasuk serah-terima Ekstrak Teks → OCR lewat Antrean |

Status akhir: **129/129 unit test lulus, 53/53 tes browser lulus** (≈49 detik).

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

## Temuan lanjutan dan perbaikannya

Empat temuan berikut ditemukan pada putaran uji kedua. Semuanya sudah dinilai terhadap
tujuan alat, dan yang tidak sesuai sudah diperbaiki.

### A. Unduh massal dari Antrean tidak pernah bisa aktif — diperbaiki

`src/ui/QueueDrawer.vue`, `src/app/providers/queue.js`

Tombol "Unduh Semua ZIP" aktif hanya jika ada item antrean yang punya `result`. Field
`result` selalu `null` karena tidak ada satu pun komponen yang mengisinya; method
`updateItem()` juga tidak pernah dipanggil. Tombolnya selamanya nonaktif.

Satu-satunya alur antrean yang nyata di aplikasi adalah serah-terima **Ekstrak Teks →
OCR**: berkas pindaian yang tidak punya lapisan teks ditawarkan ke modul OCR lewat
antrean. Jadi antrean memang alat yang dipakai, hanya bagian unduhannya yang belum
tersambung.

Perbaikan: ditambahkan `publishQueueResult(file, result, mime)` di provider antrean, dan
OCR memanggilnya setelah proses berhasil. Hasil OCR kini masuk ke antrean dan bisa
diunduh (ZIP maupun per item). Tes baru membuktikannya: berkas pindaian diserahkan dari
Ekstrak Teks, diproses OCR, lalu entri `scan.pdf` benar-benar ada di dalam ZIP.

### B. Kompres menghilangkan lapisan teks — perilaku sudah benar, kalimat diperbaiki

Kompresi meraster tiap halaman menjadi gambar (memakai pdf-lib). Teks tetap terbaca
secara visual, tetapi tidak lagi bisa dipilih atau dicari. Itu perilaku yang wajar untuk
kompresi berbasis raster, jadi kodenya tidak diubah.

Yang keliru hanya kalimat deskripsi alat ("tanpa mengorbankan keterbacaan teks") dan
pesan ketika hasil kompresi tidak mengecil (`reductionRate` negatif). Keduanya sekarang
memakai kunci terjemahan yang jujur: "menjaga keseimbangan kualitas visual" dan pesan
"berkas sudah optimal" saat ukuran tidak turun.

### C. Race di Gambar ke PDF — diperbaiki

`src/features/image-to-pdf/components/ImageToPdfTool.vue`

Item gambar dimasukkan ke daftar sebelum isi berkasnya selesai dibaca, sehingga klik
yang sangat cepat bisa memproses gambar yang belum siap.

Perbaikan: ditambahkan penanda `isReading` dan janji `pendingRead`. Tombol "Buat PDF"
menunggu pembacaan selesai; kalau buffer benar-benar masih kosong, muncul peringatan
yang jelas, bukan kegagalan tanpa pesan. Tes baru sengaja memperlambat pembacaan berkas
(400 ms) dan membuktikan perbaikan ini: sebelum diperbaiki tes gagal, sesudahnya lulus.

### D. Sebagian besar antarmuka tidak memakai i18n — diperbaiki

Aplikasi punya tombol bahasa ID/EN, tetapi banyak teks masih ditulis langsung dalam
bahasa Indonesia, sehingga mode Inggris tetap menampilkan bahasa Indonesia. Temuan ini
jauh lebih luas dari perkiraan awal: bukan 10 alat, tetapi hampir semua alat.

Perbaikan yang dikerjakan:

- Semua label, tombol, judul panel, placeholder, tooltip, dan label proses pada 25 rute
  kini memakai kunci terjemahan (id + en).
- Semua pesan hasil di antarmuka (notifikasi berhasil/gagal) kini memakai kunci.
- Pesan kesalahan di lapisan logika (`src/features/*/logic/*.js`) juga memakai kunci;
  nilai bahasa Indonesianya dibuat identik dengan teks sebelumnya supaya seluruh unit
  test lama tetap lulus.
- Format bawaan nomor halaman mengikuti bahasa aktif.
- Ditambahkan tes penjaga baru: mode Inggris tidak boleh menampilkan satu pun kata
  Indonesia di 25 rute. Tes ini yang menjadi ukuran diterimanya perbaikan ini.

Temuan lanjutan saat peninjauan ulang: tiga notifikasi (kompres selesai, berkas terkunci
pada Gabung, dan hasil Konversi ke Gambar) sempat menampilkan **teks mentah**
`t('...')` di layar. Penyebabnya penggantian otomatis pada commit sebelumnya mengubah
string biasa/template menjadi template literal yang membungkus panggilan `t()`.
Ketiganya sudah diperbaiki, dan dua tes browser sekarang memastikan notifikasi
menampilkan pesan asli, bukan panggilan `t(...)` mentah. Dua notifikasi lain (impor
model OCR dan kata kunci tidak ditemukan pada Sensor) memang belum pernah
diterjemahkan; keduanya kini memakai kunci terjemahan juga.

Contoh dokumen pada HTML→PDF (tombol "Contoh") kini juga mengikuti bahasa aktif:
isinya disimpan sebagai kunci `tools.htmlToPdf.sampleDoc` (id + en), dan ada tes baru
yang menekan tombol itu dalam mode Inggris lalu memastikan isi editor berbahasa Inggris.

Yang **tidak** diterjemahkan: 12 pesan `console.warn` di dalam kanvas editor dan
pratinjau (hanya untuk pengembang, tidak pernah terlihat pengguna; sebagian memang sudah
berbahasa Inggris). Menggantinya tidak mengubah perilaku aplikasi sama sekali, jadi
sengaja dibiarkan agar tidak menambah riak perubahan.

Terjemahan Inggris lapisan logika sudah diperiksa: 678 kunci ada di kedua bahasa, tidak
ada placeholder (`{count}`, `{pages}`, `{size}`, ...) yang hilang di versi Inggris, dan
tidak ada kunci yang tidak ditemukan. Hanya 5 nilai yang memang identik di kedua bahasa
(nama bahasa, "Watermark", "Margin:").

## Yang belum diuji lewat browser

- Tema terang/gelap dan ukuran tata letak hanya diperiksa di `app-shell`.
- Pemulihan dari berkas rusak yang berat (PDF rusak, DOCX rusak) baru sebagian.
- Interaksi kamera pada Pindai jadi PDF (butuh perangkat kamera).
- Kualitas hasil OCR hanya diperiksa pada satu berkas pindaian sederhana.

## Catatan teknis

- Fixture dibuat saat tes berjalan ke `tests/e2e/.fixtures` (diabaikan git), termasuk
  PDF berpassword, PDF berformulir, PDF hasil pindai (untuk OCR), DOCX, PPTX, XLSX,
  HTML, dan PNG. Tidak ada berkas biner yang disimpan di repo.
- Peringatan `fetchStandardFontData: ... LiberationSans-Regular.ttf` berasal dari pdf.js
  yang berjalan di Node saat membaca hasil tes, bukan dari aplikasi.
- `page.getByRole('button', { name })` mencocokkan sebagian teks dan tidak case-sensitive,
  jadi bisa mengenai tombol sidebar. Semua pencarian tombol di tes kini dibatasi ke
  elemen `main`.
- Playwright diberi `actionTimeout: 20000`. Tanpa batas ini, selector yang tidak
  menemukan apa pun akan menunggu selamanya, sehingga tes menggantung tanpa laporan
  gagal. Dengan batas ini, selector yang salah gagal dengan pesan yang jelas.
- Tes memakai kata Indonesia sebagai penanda: kalau mode Inggris masih menampilkan kata
  dari daftar itu, tes gagal. Daftar kata ini sengaja diisi kata yang tidak mungkin
  muncul dalam kalimat Inggris biasa.
- `src/core/i18n.js` kini memuat 680 kunci per bahasa. Sekitar 56 kunci tidak lagi
  dirujuk kode mana pun (sisa refactor lama, mis. `nav.category*`, `queue.status*`,
  `tools.ocr.lang*`). Nilainya tidak berbahaya, hanya menambah berat berkas; bisa
  dibersihkan kapan saja dengan hati-hati karena sebagian kunci dirujuk secara dinamis.
