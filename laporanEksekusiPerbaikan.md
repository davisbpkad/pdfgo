# Laporan Eksekusi Perbaikan (perbaikanHasilAudit.md)

Tanggal: 16 Oktober 2026
Basis: commit `1950f93` (sebelum perbaikan)
Hasil: 8 commit, 139 tes lulus (sebelumnya 113), `npm run build` sukses.

## 1. Commit per fase

| Fase | Commit | Isi |
|------|--------|-----|
| 1 (1a+1b) | `eb21dd9` | `fix(html-to-pdf): replace regex denylist with allowlist sanitizer and sandbox the print iframe` |
| 1 (tambahan) | `b199ec3` | `fix(html-to-pdf): keep harmless presentational attributes in the allowlist` |
| 2 | `75692dd` | `fix(pdf-writers): sanitize text before drawing so non-ASCII input cannot abort a conversion` |
| 3 | `aa576bc` | `fix(ranges,edit-pdf): stop failing silently on empty ranges and destructive text edits` |
| 4 | `6ae4531` | `fix(memory,ai-summary): release blob URLs and PDF.js documents, ignore stale extractions` |
| 5 | `61e05f0` | `test: replace tests that asserted nothing with tests against the shipped code` |
| 6 (6a+6c) | `6706e81` | `refactor: drop the duplicated src/modules layer, keep feature folders as the only source` |

Fase 1 dan 6 masing-masing dapat satu commit tambahan karena satu commit = satu alasan:
`b199ec3` mengembalikan atribut presentasional yang tidak berbahaya (agar tabel hasil tempel
tidak berubah tampilan), dan commit 6 tidak mencampur penghapusan modul dengan hal lain.

## 2. Jumlah tes

| | Sebelum | Sesudah |
|---|---|---|
| Total | 113 | 139 |
| Gagal | 0 | 0 |

Tes baru: `html-to-pdf.test.mjs` (+3), `unicodeText.test.mjs` (+7), `safeRanges.test.mjs` (+8),
`aiSummaryLoadOrder.test.mjs` (+2), `hexColor.test.mjs` (+2), `registry.test.mjs` (+3),
`stage5.test.mjs` (3 tes palsu ditulis ulang menjadi 4 tes nyata).

Setiap tes baru sudah dibuktikan **gagal dulu** terhadap kode lama (lewat `git stash`), kecuali
yang memang mengunci perilaku lama (2 dari 8 tes di `safeRanges`). Tes redaksi dibuktikan
dengan regresi sengaja: teks ditutup kotak hitam alih-alih diraster → tes 1 dan 3 gagal.

## 3. Yang berhasil diperbaiki

- **1a** `sanitizeHtml` sekarang allowlist (tag + atribut). Semua payload dari audit ditolak:
  `<script>` tanpa penutup, `href=javascript:` tanpa kutip, `javascript&colon;`,
  `<meta http-equiv=refresh>`, `<link rel=stylesheet>` eksternal, `data:text/html`.
- **1b** iframe cetak diberi `sandbox="allow-same-origin allow-modals"` (tanpa `allow-scripts`).
- **2** 7 penulis PDF menyaring teks sebelum `widthOfTextAtSize`/`drawText`. Satu panah,
  emoji, atau huruf CJK tidak lagi menggagalkan konversi Excel, PowerPoint, watermark,
  page-number, ringkasan AI, dan overlay edit-pdf.
- **3a** edit-pdf: penggantian teks yang tidak bisa dikodekan font tidak lagi menghapus teks asli
  secara diam-diam (`skippedCount` + peringatan di UI); kotak yang memang dikosongkan pengguna
  tetap menutup teks lama (`clearedCount`).
- **3b** watermark: rentang custom kosong → error, bukan "sukses tanpa watermark".
- **3c** pdf-to-excel: rentang tidak valid → error (rentang kosong tetap = semua halaman).
- **3d** satu parser `parsePageRange` dengan opsi `{ zeroBased, emptyMeansAll }`; OCR tanpa
  rentang tetap memproses semua halaman.
- **4a** blob URL scan-to-pdf/image-to-pdf dilepas saat unmount; `PDFDocumentProxy` merge
  dihancurkan setelah dipakai.
- **4b** ai-summary: ekstraksi lama tidak lagi menimpa dokumen yang dimuat belakangan.
- **5** 8 tes palsu diganti tes nyata; ditambah tes keamanan "teks hasil redaksi tidak bisa
  diekstrak lagi".
- **6a** `src/modules/` (27 file, ~4.800 baris) dan `scripts/generate_modules.mjs` dihapus;
  sidebar memakai `src/features/registry.js`.
- **6c** `hexToRgb` satu implementasi (`edit-pdf/logic/hexColor.js`) + pengembalian hitam,
  bukan `NaN`, untuk input tidak valid.

## 4. Yang TIDAK dikerjakan (dan alasannya)

1. **Fase 1c — hapus `'unsafe-eval'` dari CSP: tidak dikerjakan.**
   Bukti: `new Function` muncul 2× di `node_modules/pdfjs-dist/build/pdf.worker.min.js` dan
   1× di `node_modules/tesseract.js/dist/worker.min.js`; keduanya di-embed ke `dist/`.
   Menghapus `'unsafe-eval'` akan mematikan render PDF dan OCR di browser — melanggar aturan
   "jangan merusak fitur". `'wasm-unsafe-eval'` tetap ada. Ini butuh verifikasi browser dulu.
2. **Fase 6b — hapus composable yang tidak dipakai (`useTextEdits`, `useOverlayObjects`,
   `usePointerSession`): tidak dikerjakan.** Masih dipakai komponen edit-pdf; penghapusan
   berisiko dan tidak bisa diverifikasi tanpa smoke test browser.
3. **Fase 6d — hapus ekspor mati di `core/` dan `features/`: tidak dikerjakan.**
   Pemindaian menemukan 23 ekspor tanpa pemakai. Daftarnya ada di bagian 6. Menghapusnya
   tidak memberi manfaat yang terlihat dan tidak bisa diverifikasi di sini.
4. **Smoke test manual di browser (Definition of done poin 3): belum dikerjakan.**
   Repo tidak punya perkakas browser otomatis (tidak ada Playwright/Puppeteer) dan aturan
   melarang menambah library. Perlu dijalankan manual, lihat bagian 5.

## 5. Smoke test manual yang masih harus dijalankan

Satu kali per tool, cek: tool terbuka, berkas termuat, hasil terunduh, konsol bersih.

- [ ] html-to-pdf (tempel HTML berisi tabel + gambar data URI)
- [ ] word-to-pdf (uji jalur sanitasi yang sama)
- [ ] excel-to-pdf (sel berisi `→`, emoji, huruf CJK)
- [ ] powerpoint-to-pdf (teks slide berisi karakter non-ASCII)
- [ ] watermark (rentang custom kosong harus memunculkan pesan error)
- [ ] page-numbers (format dengan karakter non-ASCII)
- [ ] ai-summary (muat berkas A lalu cepat muat berkas B → ringkasan harus milik B)
- [ ] edit-pdf (ganti teks dengan emoji → muncul peringatan "edit dilewati", teks asli utuh)
- [ ] pdf-to-excel (rentang "abc" → error; rentang kosong → semua halaman)
- [ ] split, ocr (OCR tanpa rentang tetap semua halaman), scan-to-pdf, image-to-pdf, merge
- [ ] **OCR dan render PDF setelah memutuskan nasib `'unsafe-eval'`** (lihat bagian 4.1)

## 6. Ekspor mati yang masih ada (opsional, tidak dihapus)

`src/core/`: `base64ToUint8Array`, `getAsset`, `saveAsset`, `getTesseractModel`,
`hasTesseractModel`, `deleteTesseractModel`, `createBlobWorker`, `terminateBlobWorker`,
`revokeTesseractWorkerBlobUrl`, `loadPdfLibDocument`, `checkWorkerWasmSupport`,
`getMetaPolicy`, `getServedFrom`, `setTheme`, `cycleTheme`, `openQueueDrawer`.
`src/features/`: `sliceCanvasPages`, `imageFileToCanvas`, `normalizeEditText`,
`MIN_FONT_SIZE_PT`, `MIN_OBJECT_FRACTION`, `DEFAULT_NUDGE_STEP`, `SHIFT_NUDGE_STEP`.

## 7. Penyimpangan dari aturan

- **`dist/` ikut berubah.** `npm run build` (wajib menurut Definition of done poin 2)
  menulis ulang berkas di `dist/`. Perubahan itu diikutkan ke commit fase 4 dan 6 agar
  artefak yang dipakai deploy berisi kode yang sudah diperbaiki. Kalau `dist/` harus
  benar-benar tidak tersentuh, jalankan `git checkout 1950f93 -- dist` — tapi `dist/` akan
  berisi sanitizer lama yang masih bisa dieksploitasi.
- Tidak ada library baru, tidak ada perubahan kontrak publik, tidak ada teks i18n yang
  diubah di luar pesan error yang diminta.
