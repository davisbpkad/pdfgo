# Prompt: Perbaikan Hasil Review Edit-PDF & I18n

Repo: `~/Documents/PDFGO` (Vue 3 + Vite/esbuild, tanpa backend, 100% offline).
Aturan: JANGAN merusak fitur yang sudah berjalan. Jangan mengubah
`tests/unit/registry.test.mjs` untuk memaksa lulus. `dist/` di-commit dan harus
di-build ulang. Kecuali edit yang disebut di bawah, jangan menyentuh file lain.

## Dasar

- `npm test` = `node --test tests/unit/*.test.mjs` → harus tetap 129 pass.
- `npm run build` = `node build.mjs` → harus sukses + 5 output lulus cek
  Zero-Network.
- Mulai dari state: working tree bersih, `npm test` 129/129.

## Commit 1 — `fix(edit-pdf): rename save button label after overlay removal`

Overlay objects sudah dihapus, tapi label tombol simpan masih "Ratakan &
Simpan PDF". Tidak ada lagi yang diratakan dari sudut pandang pengguna.

Di `src/core/i18n.js`:

1. Blok `id` → `editPdf.saveBtn`: `'Ratakan & Simpan PDF'` → `'Simpan PDF'`.
2. Blok `en` → `editPdf.saveBtn`: `'Flatten & Save PDF'` → `'Save PDF'`.

Verifikasi: `grep -rn "Ratakan\|Flatten" src` harus 0 hasil. Ket: teks
"ditutupi dan ditulis ulang" di `desc`/`textHint` TIDAK diubah — itu memang
cara kerja fiturnya.

## Commit 2 — `fix(edit-pdf): move skipped-edits toast to i18n`

`src/features/edit-pdf/components/EditPdfTool.vue` (di `handleSave`) punya
string hardcode berbahasa Indonesia yang tidak pernah diterjemahkan:

```js
showToast(`${textResult.skippedCount} edit dilewati: teks mengandung karakter yang tidak didukung font PDF.`, 'error');
```

Langkah:

1. Di `src/core/i18n.js`, tambahkan kunci baru di blok `tools.editPdf`
   (id DAN en, taruh setelah `failed`):
   - id: `skippedToast: '{count} edit dilewati: teks mengandung karakter yang tidak didukung font PDF.',`
   - en: `skippedToast: '{count} edits were skipped: the text contains characters the built-in PDF font does not support.',`
2. Di `EditPdfTool.vue`, ganti baris hardcode tadi menjadi:
   `showToast(t('tools.editPdf.skippedToast', { count: textResult.skippedCount }), 'error');`
3. Pastikan kedua bahasa punya kunci yang sama persis (guard lain: tes
   i18n-style manual — `t('tools.editPdf.skippedToast', {count: 2})` tidak
   boleh mengembalikan path-nya sendiri).

## Commit 3 — `refactor(edit-pdf): drop unused rendered emit on EditCanvas`

`EditCanvas.vue` mendeklarasikan dan memancarkan event `rendered`, tapi tidak
ada parent yang mendengarkannya.

Di `src/features/edit-pdf/components/EditCanvas.vue`:

1. `defineEmits(['update-text', 'start-edit', 'rendered'])` →
   `defineEmits(['update-text', 'start-edit'])`.
2. Hapus baris `emit('rendered', { width: canvas.width, height: canvas.height });`
   beserta blank line-nya.

Verifikasi sebelum commit: `grep -rn "rendered" src/features/edit-pdf` harus
0 hasil (EditTextLayer/EditTextEditor tidak memakainya).

## Commit 4 — `fix(i18n): add the missing OCR page separator and queue toast keys`

Tiga kunci i18n dipakai di `src/` tapi tidak ada di id maupun en (pre-ada,
bukan salah fase sebelumnya). Keputusan user: **Opsi B** — kunci halaman
dipindah ke blok pemiliknya, bukan ditambahkan ke blok `split`.

Fakta yang sudah diverifikasi: `tools.split.summaryPage` tidak pernah ada di
blok `split`; satu-satunya pemakai adalah `formatOcrText.js` (fitur OCR).

Langkah:

1. `src/core/i18n.js`, blok `id` + `en`, di dalam `tools.ocr` (dekat
   `pageLabel`): tambah `pageSeparator`.
   - id: `pageSeparator: 'Halaman {n}',`
   - en: `pageSeparator: 'Page {n}',`
2. `src/core/i18n.js`, blok `id` + `en`, di dalam `queue` (dekat
   `downloadSingle`): tambah `noResults` dan `zipDownloaded`.
   - id: `noResults: 'Tidak ada berkas yang selesai diproses.',`
     `zipDownloaded: 'ZIP antrean berhasil diunduh.',`
   - en: `noResults: 'No finished files to download yet.',`
     `zipDownloaded: 'Queue ZIP downloaded.',`
3. `src/features/ocr/logic/formatOcrText.js`: ganti
   `t('tools.split.summaryPage', { n: pageNum })` →
   `t('tools.ocr.pageSeparator', { n: pageNum })`.
4. `src/ui/QueueDrawer.vue`: buang fallback `|| '...'` yang mati di kedua
   `showToast` (baris 12 dan 19). `t()` mengembalikan path kunci saat kunci
   hilang, dan string itu truthy → fallback tidak pernah jalan.

Verifikasi khusus fase ini:

- Keluaran OCR 2 halaman: id `--- Halaman 1 ---`, en `--- Page 1 ---`
  (bukan lagi `--- tools.split.summaryPage ---`).
- Scan semua kunci yang dipakai di `src/` terhadap `translations.id` dan
  `translations.en`: harus **0 hilang** (sebelumnya 6).
- `stage6.test.mjs` hanya cek `includes('---')` → tetap lulus.

Catatan: `grep -rn "Ratakan\|Flatten" src` untuk Commit 1 TIDAK boleh
diharapkan 0 hasil. Fitur form punya `flattenLabel` dan `shouldFlatten` yang
memang benar (meratakan formulir). Cek yang benar: hanya blok
`tools.editPdf` yang tidak lagi memakai kata itu.

## Verifikasi akhir (semua fase)

1. `npm test` → 129 pass, 0 fail.
2. `npm run build` → sukses; kelima output `[Zero-Network Pass]`.
3. `git status` bersih setelah commit terakhir (dist ikut ter-commit).
4. Kasus khusus Commit 2: pastikan toast skipped tetap muncul hanya saat
   `skippedCount > 0` — tidak ada perubahan logika, hanya sumber teks.
5. Tidak boleh ada perubahan pada: `registry.test.mjs`, fitur selain
   edit-pdf/ocr/queue (kecuali kunci i18n di Commit 4).
