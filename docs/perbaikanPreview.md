# Promp Perbaikan: Pratinjau Dokumen (Presisi & Legibilitas)

Target repo: `~/Documents/PDFGO`. Tempel isi di bawah ini ke agent implementasi.

---

# PERAN
Kamu Senior Frontend Engineer + UX engineer untuk aplikasi dokumen offline-first (Vue 3 + Vite + Tailwind, brutalist, 100% client-side). Kamu teliti soal presisi koordinat, karena salah sedikit = teks sensitif tidak tersensor atau tanda tangan salah tempat.

# MASALAH
Pengguna mengeluh pratinjau dokumen tidak jelas dan terlalu kecil, terutama saat:
1. menggeser/mengubah ukuran tanda tangan digital,
2. menggambar kotak sensor,
3. menempatkan nomor halaman (dan watermark).
Akibatnya pengguna tidak bisa menempatkan objek dengan tepat.

# AKAR MASALAH (sudah saya telusuri — verifikasi ulang sebelum mengubah)
A. KEKACAUAN SISTEM KOORDINAT (bug kebenaran + risiko privasi)
   - `src/features/sign/components/SignPlacementCanvas.vue:98` canvas memakai `class="block max-w-full h-auto"` sehingga ukuran CSS-nya bisa lebih kecil dari ukuran piksel canvas. Kotak tanda tangan di baris 103-108 diposisikan dengan `left/top/width/height` dalam PIKEL CANVAS, sedangkan drag (baris 60-64) dan resize (baris 81-88) menambahkan delta `e.clientX/clientY` dalam PIKEL CSS. Saat canvas ter-shrink, objek bergeser dari posisi visual dan melompat saat digeser.
   - `src/features/redact/components/RedactCanvas.vue:41-45` menghitung koordinat kotak dari `getBoundingClientRect()` (PIKEL CSS) lalu menyimpannya apa adanya, padahal kotak itu dipakai sebagai PIKEL CANVAS skala 0.8 di `src/features/redact/logic/executeTrueRedaction.js:40-50` (`scaleFactor = highResScale / previewScale`).
   - `src/features/redact/logic/findTextRedactionBoxes.js` menghasilkan kotak dalam PIKEL CANVAS, sedangkan kotak gambar tangan dalam PIKEL CSS, lalu keduanya digabung di array yang sama (`RedactTool.vue:118-123`). Dua satuan berbeda dalam satu daftar.
   - `src/features/sign/components/SignTool.vue:86-96` memetakan `placement` ke koordinat PDF dengan `pdfW / canvasDims.width`, mengasumsikan `placement` dalam piksel canvas.
   Konsekuensi terburuk: area yang tampak tertutup hitam di pratinjau TIDAK sepenuhnya tertutup di PDF hasil. Ini kebocoran data, bukan sekadar tampilan.
B. PRATINJAU TERLALU KECIL & BURAM
   - Skala mati: `RedactTool.vue:27` (`previewScale = 0.8`), `PageNumbersPreview.vue:51` (0.65), `WatermarkPreview.vue:38` (0.65). Tidak ada zoom sama sekali di repo.
   - Wadah pratinjau hanya `min-h-[280px]` (`WatermarkPreview.vue:94`, `PageNumbersPreview.vue:123`) dan kolom pratinjau hanya `lg:col-span-7` (`RedactTool.vue:206`, `SignTool.vue:207`).
   - Render tidak memperhitungkan `devicePixelRatio`, jadi teks kecil di layar Retina tampak kabur.
   - Pratinjau nomor halaman & watermark terkunci di halaman 1, tidak bisa melihat halaman lain.
C. INTERAKSI KURANG PRESISI
   - Tidak ada kontrol keyboard; menggeser objek hanya bisa dengan mouse (tidak bisa akurat).
   - Pegangan resize hanya `w-4 h-4` (`SignPlacementCanvas.vue:115`) — terlalu kecil untuk jari/mouse.
   - Tidak ada indikator persentase zoom, tidak ada "sesuaikan lebar", tidak ada pan saat memperbesar.

# TUJUAN
1. **Benarkan dulu koordinatnya** (A) sebelum menyentuh tampilan.
2. Buat pratinjau **terbaca dan presisi**: pengguna bisa memperbesar sampai teks terbaca, dan objek yang digambar persis sama dengan yang dihasilkan di PDF.
3. Tambahkan kontrol yang mudah dimengerti pengguna awam, tanpa menambah dependensi baru.

# MODEL KOORDINAT WAJIB (spec, jangan improvisasi)
Buat `src/core/coordinates.js` — fungsi murni, tanpa DOM, boleh dipakai tes:
- `renderScale(zoom, dpr)` → skala render PDF.js = `zoom * dpr`, dibatasi agar sisi terpanjang canvas ≤ 4096 px dan luas ≤ 16 juta piksel; kalau kena batas, turunkan dan kembalikan `clamped: true`.
- `toNormalized(boxPx, canvasPx)` → `{ x, y, width, height }` dalam fraksi 0..1 relatif halaman. `y` dihitung dari ATAS halaman (konsisten untuk UI).
- `toCanvasPx(normalizedBox, canvasPx)` → kebalikannya, untuk menggambar ulang di zoom berapa pun.
- `toPdfRect(normalizedBox, pageWidthPt, pageHeightPt)` → koordinat PDF (origin kiri-bawah), membalik sumbu Y.
- `toDisplayBox(normalizedBox, viewPx)` → posisi overlay dalam piksel tampilan.
Aturan:
- **Semua** posisi/ukuran yang disimpan (kotak sensor, penempatan tanda tangan) disimpan dalam bentuk **ternormalisasi 0..1 relatif halaman**. Piksel canvas hanya untuk render sesaat.
- Semua overlay di DOM diposisikan dalam **persen** (`left: x*100%`) atau dikonversi ke piksel tampilan lewat satu fungsi, bukan campur satuan.
- Semua konversi delta pointer: `deltaHalaman = deltaCS / (zoom * dpr)` — satu tempat saja.
- Ukuran minimum kotak (8 px sekarang di `RedactCanvas.vue:68`) harus dinyatakan dalam fraksi halaman, bukan piksel tampilan, supaya perilakunya sama di semua zoom.
- Tambahkan margin pengaman kecil pada kotak sensor saat dirender ke output (mis. 1 pt) supaya ketidaktepatan pembulatan tidak menyisakan piksel teks. Tulis komentar `// ponytail: margin pengaman 1pt` jika dianggap sementara.

# ZOOM & LEGIBILITAS (UX)
Buat satu komponen bersama `src/ui/PreviewViewport.vue` (dipakai sign, redact, page-numbers, watermark — jadi tidak melanggar aturan atomik) yang membungkus: canvas + overlay + kontrol zoom + scroll/pan.
- Kontrol zoom: tombol `Perkecil`, `Perbesar`, `Sesuaikan lebar`, `100%`, dan label persen yang bisa diklik untuk memilih preset (50/75/100/150/200/400). Rentang 25%-400%.
- Default **Sesuaikan lebar** kolom (bukan skala mati), dan otomatis hitung ulang saat ukuran jendela berubah (ResizeObserver, debounce ±150 ms).
- Zoom juga lewat `Ctrl`/`⌘` + scroll di area pratinjau, tombol `+`/`-` saat pratinjau fokus, dan pinch dua jari di perangkat sentuh.
- Saat zoom > 100%: area bisa di-pan dengan drag ruang kosong atau scroll, dan ada tombol `Kembalikan ke tengah`.
- Render ulang canvas pada skala baru, sertakan `devicePixelRatio` agar tajam. Tampilkan indikator kecil `Mempertajam…` selama render ulang.
- Tinggi minimum area pratinjau 480 px di desktop, dan 60vh di mobile. Di layar <1024px, pratinjau diletakkan di atas atau jadi panel yang bisa dibuka penuh (`Perbesar pratinjau`), bukan tersembunyi di bawah.
- Ukuran baca minimum yang harus dicapai: teks 10 pt di PDF minimal 12 px CSS saat **Sesuaikan lebar** pada jendela 1280 px. Kalau tidak tercapai, perbesar lebar minimum kolom pratinjau.

# PRESISI INTERAKSI
Tanda tangan (`SignPlacementCanvas.vue`):
- Drag/resize memakai model koordinat baru; pergerakan objek harus sama persis dengan gerakan pointer pada zoom mana pun (uji di 25% dan 400%).
- Pindahkan objek dengan tombol panah (`1 px` halaman), `Shift`+panah (`10 px`), `Escape` membatalkan drag dan mengembalikan posisi sebelumnya.
- Pegangan resize: visual tetap kecil (brutalist), tetapi area sentuh ≥ 24 px dengan pseudo-element.
- Tampilkan ukuran objek dalam mm dan posisi dalam mm dari sudut kiri-atas halaman, di bawah pratinjau. Nilai bisa diketik langsung (input angka) sebagai cara presisi.
- Tombol: `Pusatkan`, `Set ukuran asli`, dan indikator halaman (`Hal 3 dari 12`) + `Sebelumnya`/`Berikutnya`.

Sensor (`RedactCanvas.vue`, `RedactTool.vue`):
- Gambar kotak, lalu tampilkan overlay hitam opak dengan tepi putih 1-2 px (seperti sekarang) TAPI dengan posisi yang benar di zoom mana pun.
- Setelah menggambar, kotak bisa dipilih, lalu digeser dengan panah, diubah ukurannya dari pegangan, dan dihapus dengan `Delete`. Tambahkan `Urungkan`/`Batalkan urungan` (`Ctrl+Z` / `Ctrl+Shift+Z`) minimal 20 langkah.
- Tampilkan daftar kotak per halaman (halaman, posisi, ukuran) + tombol `Hapus kotak ini`.
- Tambahkan tombol `Periksa hasil sensor` yang menampilkan raster pratinjau beresolusi tinggi dengan semua kotak hitam sudah diterapkan, supaya pengguna bisa memastikan tidak ada teks yang lolos sebelum menekan sensor permanen.
- Peringatan di `RedactWarningBanner.vue` ditambah satu kalimat: pastikan Anda sudah memeriksa pratinjau sebelum menyensor permanen.

Nomor halaman & watermark (`PageNumbersPreview.vue`, `WatermarkPreview.vue`):
- Pakai `PreviewViewport.vue` (zoom + pan) dan hapus skala mati 0.65.
- Bisa pindah halaman pratinjau (`Sebelumnya`/`Berikutnya` + input nomor halaman), bukan hanya halaman 1.
- Teks watermark/pratinjau nomor halaman dirender pada kanvas skala tinggi supaya terbaca.

# WAJIB DIPERTAHANKAN (jangan rusak)
- 100% offline, tanpa jaringan, tanpa CDN, tanpa font eksternal. Semua aset tetap inline.
- Tetap jalan dari `file://`; worker lewat Blob URL; CSP tidak berubah (tidak ada `unsafe-eval`).
- Output build tetap satu file HTML via `build.mjs` (`npm run build`, `npm run build:lite`, `npm run build:full`), nama file `dist/` tidak berubah.
- Dilarang menambah dependensi apa pun. Tailwind + komponen internal saja.
- Dilarang kelas Tailwind dinamis hasil string-concat; pakai map kelas statis.
- Gaya brutalist: border 3 px, hard shadow, sudut 0, fokus ring hitam 3 px, target sentuh ≥44 px untuk tombol.
- Semua teks baru wajib ada di ID dan EN pada `src/features/<tool>/i18n/id.js` dan `en.js`.
- Aksesibilitas: `aria-label` pada tombol zoom, `Escape` menutup/membatalkan, navigasi `Tab` logis, `prefers-reduced-motion` dihormati.
- Aturan atomik repo tetap: 1 file = 1 tanggung jawab, ≤120 baris, template/script/helper terpisah.
- Jangan mengubah perilaku modul lain. Kalau `core/pdf.js` perlu parameter baru (mis. dpr), buat opsional dan jangan ubah pemanggil yang ada tanpa alasan.

# URUTAN KERJA
1. Tulis `src/core/coordinates.js` + `tests/unit/coordinates.test.mjs` (tes: putaran normalisasi → piksel → normalisasi kembali stabil; `toPdfRect` membalik sumbu Y dengan benar; `renderScale` menghormati batas 4096 px / 16 juta piksel). Jalankan `npm test`.
2. **Sensor dulu** (paling berisiko): pindahkan `RedactCanvas`, `RedactTool`, `findTextRedactionBoxes`, `executeTrueRedaction` ke koordinat ternormalisasi. Tambah tes regresi: render PDF hasil pada skala 2.5 dan pastikan setiap piksel di dalam kotak yang diminta berwarna hitam, serta tidak ada kotak yang lebih kecil dari yang diminta. Buktikan secara manual di zoom 25% dan 400% bahwa hasil sama.
3. Tanda tangan: `SignPlacementCanvas`, `SignTool` ke koordinat ternormalisasi + keyboard nudge + input angka.
4. `PreviewViewport.vue` + terapkan ke 4 fitur (sign, redact, page-numbers, watermark).
5. Rapikan i18n, uji mobile 360 px, uji tema gelap, uji `file://` tanpa internet.
6. Jalankan `npm test` dan `npm run build`, lalu laporkan perbandingan ukuran bundle sebelum/sesudah (kode UI boleh naik, jangan sampai >15%).

# DEFINISI SELESAI
1. `npm test` hijau, termasuk tes koordinat dan tes regresi sensor.
2. Di zoom 25%, 100%, dan 400%: objek yang digambar di layar menempati area yang sama di PDF hasil (verifikasi manual + tes regresi).
3. Kotak sensor di PDF hasil selalu menutup area yang ditandai pengguna, dengan margin pengaman; tidak ada teks tersisa di dalamnya.
4. Teks 10 pt PDF terbaca jelas (≥12 px CSS) pada "Sesuaikan lebar" di jendela 1280 px.
5. Zoom 25%-400% berfungsi di 4 fitur, dengan `Sesuaikan lebar` sebagai default, dan label persen terlihat.
6. Objek bisa dipindah dan diubah ukurannya dengan keyboard, dan nilai posisi/ukuran bisa diketik.
7. Nomor halaman & watermark bisa menampilkan halaman selain halaman 1.
8. `npm run build` dan `npm run build:lite` sukses, `verifyZeroNetwork()` lolos, `dist/PDF To Go.html` jalan dari `file://` tanpa internet.
9. Semua label tersedia dalam ID dan EN.

# CARA KERJA
- Baca dulu: `src/core/pdf.js`, kedua komponen kanvas, `executeTrueRedaction.js`, `findTextRedactionBoxes.js`, `SignTool.vue`, `RedactTool.vue`, dan `docs/ARCHITECTURE.md`.
- Mulai dari langkah 1 dan tunjukkan hasil `npm test` sebelum lanjut.
- Kalau ada keputusan yang bisa mengubah area tersensor atau posisi tanda tangan di dokumen pengguna, tanya dulu. Jangan menebak.
- Di akhir tiap langkah, sebutkan 1 baris: apa yang di-skip dan risiko yang tersisa.
