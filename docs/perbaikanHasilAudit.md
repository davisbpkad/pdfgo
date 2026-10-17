# Tugas: Perbaiki temuan audit PDFGO

Repo: `/Users/davistanjung/Documents/PDFGO`
Aturan: **jangan merusak fitur yang sudah berjalan.** Setiap fase = 1 commit terpisah.

Sumber temuan: audit kualitas (`ponytail-audit`) + graphify. Temuan lengkap ada di riwayat sesi audit; dokumen ini hanya berisi perintah perbaikan.

## Aturan keras (berlaku semua fase)

1. Baseline dulu: `npm test` harus `113 pass, 0 fail`. Catat jumlah ini. Setiap fase, jumlah tes lama tidak boleh turun; tes baru boleh nambah.
2. `npm run build` harus sukses sebelum dan sesudah setiap fase.
3. **Jangan** tambah dependensi baru. **Jangan** ubah nama file publik, nama export, atau tanda tangan fungsi yang sudah dipakai komponen/tests.
4. **Jangan** ubah `dist/` (artefak hasil build). Biarkan `npm run build` yang menulisnya.
5. Kontrak perilaku yang TIDAK boleh berubah (dijaga `tests/unit/html-to-pdf.test.mjs`):
   - `sanitizeHtml` membuang `<script>`, `<iframe>`, dan kata `alert` dari contoh uji.
   - `<a href="javascript:...">` menjadi `href="#"`.
   - `<img src="https://...">` menjadi `src=""`.
   - Tag aman (`h1`, `p`, `table`, `div`, `img`, `a`) dan teksnya tetap ada.
   - `buildPrintableHtml` tetap memuat `<!DOCTYPE html>` dan `@page { size: A4; margin: 15mm; }`.
6. Setiap perbaikan bug wajib disertai 1 tes regresi yang **gagal sebelum perbaikan** dan **lolos sesudahnya**. Tulis tesnya, jalankan, buktikan gagal dulu (atau jelaskan di pesan commit kalau memang tidak bisa digagalkan).
7. Kalau satu perbaikan ternyata mengubah perilaku tool lain, hentikan fase itu dan laporkan, jangan paksa.

---

## Fase 1 — Keamanan HTML (temuan 1, 11)

### 1a. Ganti `sanitizeHtml` dengan daftar-izin berbasis DOMParser

File: `src/features/html-to-pdf/logic/sanitizeHtml.js` (fungsi `sanitizeHtml`, baris 7-25).

Masalah: regex daftar-blokir. Yang lolos (sudah dibuktikan dengan menjalankan fungsi aslinya):
- `<script>alert(1)` tanpa tag penutup
- `<a href=javascript:alert(1)>` tanpa kutip
- `<a href="javascript&colon;alert(1)">` (entitas)
- `<meta http-equiv=refresh content="0;url=https://evil.com">`
- `<link rel=stylesheet href="https://evil.com/x.css">`
- `<img src="data:text/html;base64,...">`

Cara perbaiki:
- Parse pakai `DOMParser` (`text/html`).
- Buang seluruh elemen di luar daftar-izin: `div, span, p, br, hr, h1..h6, ul, ol, li, table, thead, tbody, tr, th, td, a, img, strong, em, b, i, u, s, blockquote, pre, code, figure, figcaption, style` (tanpa `script`, `iframe`, `object`, `embed`, `applet`, `meta`, `link`, `form`, `input`, `button`, `svg`, `math`, `base`, `noscript`).
- Buang SEMUA atribut kecuali: `style`, `colspan`, `rowspan`, `alt`, `width`, `height`, dan `src`/`href` setelah divalidasi.
- `src`/`href`: izinkan hanya `data:` (dan `#` untuk href). Set ke `""` / `"#"` kalau selain itu — **jangan** pakai regex, cek nilai atribut setelah di-parse supaya entitas seperti `javascript&colon;` sudah ternormalisasi.
- Buang semua atribut yang namanya mulai `on`.
- Buang `style` yang memuat `url(` non-`data:`.
- Pertahankan serialisasi yang membuat 3 tes lama tetap lulus: `href="#"` dan `src=""` harus tetap muncul sebagai string di output.

Verifikasi 1a:
- Tambah tes di `tests/unit/html-to-pdf.test.mjs`: 6 payload di atas → hasil tidak memuat `javascript:`, tidak memuat `<script`, tidak memuat `<meta`, tidak memuat `evil.com`, tidak memuat `data:text/html`.
- Pastikan 5 tes lama di file itu tetap lulus tanpa diubah.

### 1b. Sandbox iframe cetak

File: `src/features/html-to-pdf/logic/printHtmlDocument.js:58`.

Tambah setelah `document.createElement('iframe')`:

```js
iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
```

`allow-same-origin` tetap perlu supaya `iframe.contentWindow.print()` jalan dari parent. `allow-scripts` **tidak** dipasang, jadi skrip di dalam iframe diblokir walau sanitizer gagal.
Jangan ubah logika `doc.write` / `print()` / `setTimeout` yang ada.

Verifikasi 1b (manual, browser): buka tool HTML→PDF, isi HTML normal (tabel + heading), tekan tombol Print → dialog print muncul dan isi benar. Lalu coba `<script>alert(1)` → tidak ada alert.

### 1c. Buang `'unsafe-eval'` dari CSP

File: `scripts/csp.mjs:8`. Hapus `'unsafe-eval'`, pertahankan `'wasm-unsafe-eval'` (dibutuhkan OCR).
`netlify.toml:16` tidak perlu diubah kalau ia mengambil konstanta yang sama — cek `tests/unit/cspSync.test.mjs` membandingkan keduanya.
Verifikasi: OCR (Indonesia + Inggris) masih jalan di browser. Kalau OCR pecah, kembalikan `'unsafe-eval'` dan laporkan (jangan diam-diam).

---

## Fase 2 — Karakter non-ASCII membatalkan konversi (temuan 2)

Masalah terbukti: `page.drawText('Total: 1.234 → ok')` melempar `WinAnsi cannot encode "→" (0x2192)`. Satu emoji/CJK/`→` di input = konversi gagal total.

Fungsi yang sudah ada: `src/features/ocr/logic/sanitizeTextForPdf.js` (`export function sanitizeTextForPdf`). **Pakai ini, jangan bikin yang baru.**

Bungkus setiap string yang masuk `drawText` (dan `widthOfTextAtSize`/`fitText` — harus disanitasi **sebelum** diukur) di file:

| File | Bagian |
|---|---|
| `src/features/excel-to-pdf/logic/renderGridToPdf.js:43` | judul sheet |
| `src/features/excel-to-pdf/logic/renderGridToPdf.js:65-66` | teks header kolom |
| `src/features/excel-to-pdf/logic/renderGridToPdf.js:94-95` | teks sel |
| `src/features/powerpoint-to-pdf/logic/convertPptxToPdf.js:83` | `run.text` |
| `src/features/watermark/logic/applyWatermark.js` | teks watermark (sebelum `widthOfTextAtSize`) |
| `src/features/page-numbers/logic/applyPageNumbers.js` | teks nomor halaman + prefix custom |
| `src/features/ai-summary/logic/exportAiResult.js` | semua teks hasil AI |
| `src/features/edit-pdf/logic/renderOverlayToPdf.js` | teks objek overlay user |

Aturan: kalau setelah sanitasi hasilnya string kosong, **jangan** gambar apa pun untuk baris itu (bukan menggambar spasi) — supaya tidak ada teks rusak.

Verifikasi: tambah 1 tes per file yang menyentuh `drawText` (atau minimal 1 tes gabungan) yang memakai input mengandung `→`, emoji, dan `中文`, lalu pastikan tidak melempar dan output tetap PDF valid.
Manual: konversi `.xlsx` yang salah satu selnya berisi `→` dan `中文` → PDF jadi, karakter diganti spasi, tidak ada error.

---

## Fase 3 — Kehilangan data & gagal senyap (temuan 3, 4, 5, 10)

### 3a. Edit teks jangan menghapus teks asli lalu menggambar kosong

File: `src/features/edit-pdf/logic/renderTextEditsToPdf.js:44-56`.

Perilaku sekarang: kotak putih digambar, lalu kalau semua baris hasil sanitasi kosong → `continue` (teks lama hilang, pengganti kosong, tanpa pesan).

Ubah jadi: hitung dulu `lines` hasil sanitasi. Kalau semua kosong → **jangan gambar kotak putih**, jangan tulis apa pun untuk edit itu, tambah counter baru `skippedCount` (jangan pakai `clearedCount`; `clearedCount` sekarang dipakai untuk kasus lain).
Nilai balik: `{ pdfBytes, editCount, clearedCount, skippedCount }` — **tambah** field, jangan hapus/ubah nama yang lama.
Di `src/features/edit-pdf/components/EditPdfTool.vue` (sekitar baris 57): kalau `skippedCount > 0`, tampilkan toast peringatan, mis. `"${skippedCount} edit dilewati: teks mengandung karakter yang tidak didukung font PDF"`. Kalau `0`, perilaku sukses seperti sekarang.

Verifikasi: tes — PDF berisi teks "ASLI", edit teksnya `"你好"` → teks "ASLI" masih bisa diekstrak dari output dan `skippedCount === 1`.
Manual: edit satu kata dengan teks normal → masih bekerja seperti sebelumnya.

### 3b. Watermark rentang custom kosong harus gagal, bukan pura-pura sukses

File: `src/features/watermark/logic/applyWatermark.js:45-58`.

Setelah `customPages = parsePageRange(customRange, totalPages)`, tambah:

```js
if (pageFilter === 'custom' && customPages.length === 0) {
  throw new Error('Rentang halaman kosong atau tidak valid.');
}
```

`WatermarkTool.vue:82-85` sudah punya `try/catch` + toast error, jadi tidak perlu diubah.

Verifikasi: tes — `applyWatermark(bytes, { pageFilter: 'custom', customRange: '' })` menolak. Tes kedua: `customRange: '2-3'` tetap jalan dan hanya 2 halaman yang dicap.

### 3c. PDF→Excel: bedakan "kosong" vs "salah"

File: `src/features/pdf-to-excel/logic/convertPdfToExcel.js:37`.

Aturan: `pageRange` string kosong / undefined → semua halaman (perilaku lama, jangan diubah). `pageRange` tidak kosong tapi hasil parse `[]` → lempar error.

Verifikasi: tes — `'abc'` menolak; `''` menghasilkan semua halaman.

### 3d. Satukan `parsePageRange` (temuan 10) — HATI-HATI

File: `src/features/split/logic/parsePageRange.js:7` (1-based, split `/[,;\s]+/`, kosong → `[]`) vs `src/features/ocr/logic/parsePageRange.js:7` (0-based, split `,`, kosong → **semua** halaman).

Ubah versi split jadi `parsePageRange(rangeStr, totalPages, { zeroBased = false, emptyMeansAll = false } = {})`, dengan perilaku default **persis seperti sekarang**.
Lalu `src/features/ocr/logic/parsePageRange.js` menjadi re-export tipis yang memanggil dengan `{ zeroBased: true, emptyMeansAll: true }` — supaya perilaku OCR (kosong = semua halaman) tidak berubah.

Verifikasi: tes yang mengunci keempat kombinasi (split kosong = `[]`, OCR kosong = semua indeks, `'1 3'` di OCR sekarang terbaca `[0,2]`, `'1-3'` di split = `[1,2,3]`).
Manual: OCR tanpa mengisi rentang tetap memproses semua halaman.

---

## Fase 4 — Memori & balapan (temuan 8, 9)

### 4a. Bersihkan object URL saat keluar tool

- `src/features/scan-to-pdf/components/ScanToPdfTool.vue`: tambah `onUnmounted(() => pages.value.forEach(p => URL.revokeObjectURL(p.url)))`. Ingat ada dua tempat revoke lama (`:50`, `:78`) — jangan dobel-revoke (revoke dua kali aman, tapi jaga kebersihan).
- `src/features/image-to-pdf/components/ImageToPdfTool.vue`: sama, revoke semua `thumbUrl` di `onUnmounted`.
- `src/features/merge/components/MergeTool.vue:41` dan `:120`: simpan hasil `loadPdfJsDocument` ke variabel, panggil `.destroy()` di `finally` setelah `generateThumbnail` / setelah membaca `numPages`. Hati-hati: jangan destroy proxy yang masih dipakai render thumbnail (destroy setelah thumbnail selesai dibuat).

Verifikasi manual di browser: DevTools → Performance/Memory, scan 5 gambar lalu pindah tool, jumlah blob turun. Tidak ada tes otomatis (tidak ada infra tes komponen) — tulis di pesan commit bahwa ini verifikasi manual.

### 4b. AI Summary: buang hasil ekstraksi yang basi

File: `src/features/ai-summary/logic/useAiSummary.js:20`.

Tambah penjaga per pemanggilan: simpan `const token = ++loadToken` di awal `loadDocument`, dan setelah `await` selesai, `if (token !== loadToken) return;` sebelum menulis `extractedText`/state lain.

Verifikasi: tes unit yang memanggil `loadDocument` dua kali dengan fungsi ekstraksi lambat disuntik (mock), lalu pastikan teks akhir milik pemanggilan kedua. Kalau `loadDocument` sulit disuntik, pisahkan penjaga token jadi helper kecil yang bisa dites berdiri sendiri.

---

## Fase 5 — Integritas tes (temuan 6, 7)

Jangan hapus tes yang benar. Perbaiki yang palsu.

1. `tests/unit/stage5.test.mjs:9-33` — palsu (mengeset metadata pakai pdf-lib langsung). Ganti: panggil `executeTrueRedaction` dengan `sanitizeMeta: true`, lalu assert `getTitle() === ''` dan `getAuthor() === ''` pada hasil.
2. Tambah tes inti redaksi (belum ada sama sekali): bikin PDF berisi teks "RAHASIA", beri kotak redaksi di atasnya, jalankan `executeTrueRedaction`, buka output pakai `pdfjs-dist` (build legacy, bisa di Node), assert `getTextContent()` tidak memuat "RAHASIA". Ini tes paling penting di repo ini.
3. `tests/unit/stage5.test.mjs:35-51` — palsu (copy page pakai pdf-lib). Ganti: redaksi halaman 1 dari 2 halaman, lalu assert teks halaman 2 masih bisa diekstrak sebagai teks (bukan raster).
4. `tests/unit/stage5.test.mjs:53-...` — palsu (menghitung sendiri). Ganti: panggil `compressPdfDocument`, assert jumlah halaman sama, output dimulai `%PDF-`, dan `reductionRate` konsisten dengan ukuran asli/kompresi.
5. `tests/unit/extractText.test.mjs:52-...` — palsu (regex lokal). Ganti: impor helper deteksi gambar dari `src/features/extract-text` dan uji `.jpg .jpeg .PNG .webp .bmp` benar serta `.pdf .txt .zip` salah.
6. `tests/unit/sign.test.mjs:27,52` — palsu (aritmetika lokal). Ganti: panggil `applySignatures` dari `src/features/sign/logic/*` dengan rect yang diketahui, reload output, assert posisi/ukuran XObject sesuai titik PDF.
7. `tests/unit/stage6.test.mjs:119` — palsu (array literal). Ganti: baca konfigurasi bahasa/model OCR yang asli, atau hapus kalau tidak ada yang bisa diuji.
8. `tests/unit/cspSync.test.mjs:39,50` — selalu hijau (return diam-diam kalau `dist/` tidak ada). Ganti `return` jadi `t.skip('dist belum dibuild')` supaya terlihat dilewati.
9. Tambah tes `hexToRgb` (Fase 6) untuk `'#ff0000'`, `'#abc'`, `'#zzzzzz'`, `null`.

Setelah fase ini: `npm test` harus lulus semua, dan jumlah tes naik (bukan turun).

---

## Fase 6 — Lean (temuan 12-15). Pisah dari fase di atas; lakukan sendiri.

**Kerjakan hanya kalau Fase 1-5 sudah commit dan hijau.**

### 6a. Hapus `src/modules/` (~4.800 baris)

Bukti: tidak ada pemanggil `.init(`, `.onFiles(`, `.destroy(` di `src`, `tests`, `scripts`, `build.mjs`. Yang hidup hanya metadata (`id/titleKey/descKey/icon`) dan baris re-export ke `features/*/logic`.

Langkah:
1. `grep -rn "src/modules\|from '../modules\|from '../../src/modules\|modules/index.js" src tests scripts build.mjs` — daftar lengkap pemakai.
2. Buat registry baru dari `src/features/*/index.js` (sudah mengekspor `id`, `titleKey`, `descKey`, `icon`, `component`), dengan bentuk `allModules` dan `moduleMap` yang sama seperti `src/modules/index.js:1-60`.
3. Arahkan `src/ui/AppSidebar.vue:5` ke registry baru. Sidebar harus menampilkan 26 tool dengan nama dan ikon yang **sama persis** — bandingkan sebelum/sesudah di browser.
4. Arahkan 6 file tes (`merge.test.mjs:8`, `stage3.test.mjs:8-10`, `stage4.test.mjs:8-11`, `stage6.test.mjs:14`) ke `src/features/*/logic/*` / `src/features/*/index.js`.
5. Hapus `src/modules/` dan `scripts/generate_modules.mjs`.
6. `npm test` + `npm run build`.

Verifikasi manual: buka sidebar, klik 26 tool satu per satu, pastikan tidak ada layar kosong/error di console.

### 6b. Satu composable loader (opsional, ~300 baris)

Baru kerjakan kalau 6a hijau dan kamu punya waktu. Migrasi **bertahap, satu tool per commit**, mulai dari tool paling sederhana (`SplitTool`), bukan semuanya sekaligus. Bentuk: `src/features/usePdfDocument.js` dengan `{ activeFile, activeBuffer, pdfDocProxy, totalPages, loadDocument, resetFile, onFiles }`. Setelah tiap tool dimigrasi: tes + smoke tool itu.

### 6c. Dua duplikat kecil

- `hexToRgb` di `watermark/logic/applyWatermark.js:4` dan `page-numbers/logic/applyPageNumbers.js:3`: impor dari `edit-pdf/logic/hexColor.js:8`. Tambah penjaga: input tidak valid → `{ red: 0, green: 0, blue: 0 }` (sekarang `parseInt` bisa menghasilkan `NaN`).
- Hapus `@pdf-lib/fontkit` dari `package.json:19` (nol referensi di `src`, `tests`, `build.mjs`, `scripts`, `index.html`). Setelah hapus: `npm install`, `npm run build` harus tetap sukses.

### 6d. Hapus export mati

`src/core/assets.js` (`saveAsset` `:41`, `getAsset` `:62`, `openDatabase` `:14`, konstanta `:9-11`), `src/core/workers.js` (`createBlobWorker` `:17`, `terminateBlobWorker` `:31`, `revokeTesseractWorkerBlobUrl` `:90`), `src/core/queue.js` (`reorder` `:108`, `updateItem` `:122`, `cancel` `:137`, param `allowedExtensions` `:54`), `src/core/theme.js` (`cycleTheme` `:67`).

Sebelum hapus, grep dulu nama masing-masing di seluruh repo termasuk `tests`. Setelah hapus: `npm test` + `npm run build`.

---

## Definition of done (semua fase)

1. `npm test` lulus, jumlah tes ≥ 113 + tes baru; tidak ada tes yang dihapus kecuali yang terbukti palsu (dan sudah diganti).
2. `npm run build` sukses; verifikasi zero-network di `build.mjs` tidak melaporkan kebocoran baru.
3. Smoke manual di browser, minimal 1× per tool yang tersentuh: tool terbuka, file bisa dimuat, output terunduh, tidak ada error di console.
4. Daftar tool yang tersentuh: html-to-pdf, excel-to-pdf, powerpoint-to-pdf, watermark, page-numbers, ai-summary, edit-pdf, pdf-to-excel, split, ocr, scan-to-pdf, image-to-pdf, merge. Cek semuanya.
5. Laporkan di akhir: hash commit per fase, jumlah tes sebelum/sesudah, dan apa pun yang **tidak** berhasil kamu perbaiki.

## Yang TIDAK boleh dilakukan

- Jangan refactor besar sekaligus dengan perbaikan bug (satu commit = satu alasan).
- Jangan ubah UI/teks i18n di luar pesan error yang diminta.
- Jangan tambah library, framework, atau lapisan abstraksi baru.
- Jangan sentuh `dist/`, `graphify-out/`, atau file `.md` dokumentasi kecuali README salah faktanya (lalu sebutkan).
- Kalau sebuah perbaikan tidak bisa dibuat tanpa mengubah kontrak publik, **berhenti dan tanya**.

## Urutan jalan

Fase 1 → 2 → 3 → 4 → 5 → 6. Fase 1 dan 2 paling mendesak.
