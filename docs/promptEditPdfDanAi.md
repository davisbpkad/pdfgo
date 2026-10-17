# Prompt: Edit PDF text-only + hapus tool "Siapkan untuk AI"

Basis: commit `e321767` (139 tes lulus).
Keputusan yang sudah dikunci: Opsi A (hanya edit tulisan, semua objek overlay dihapus), bug Simpan diperbaiki, fallback hash ditambah, mode teks selalu aktif.

---

## Konteks

Repo `~/Documents/PDFGO`. Vue 3 + Vite + esbuild, tanpa backend, 100% offline.
Tes: `npm test` (`node --test tests/unit/*.test.mjs`). Build: `npm run build`.
Baseline: 139 tes lulus, commit `e321767`.

## Aturan keras

1. Jangan merusak fitur lain. Jangan ubah `src/features/edit-pdf/logic/hexColor.js`, `src/core/coordinates.js`, `extractEditableText.js`, `textEditInteractions.js`, `renderTextEditsToPdf.js`.
2. Jangan tambah library, jangan tambah abstraksi.
3. Jangan sentuh `perbaikanHasilAudit.md`, `laporanEksekusiPerbaikan.md`, `graphify-out/`.
4. Satu commit = satu alasan. Urutan di bawah. Setelah tiap commit, `npm test` harus lulus.
5. Jangan ubah UI/teks i18n di luar kunci yang disebut.

## Commit 1 — `fix(edit-pdf): pass editsByPage to renderTextEditsToPdf`

File: `src/features/edit-pdf/components/EditPdfTool.vue`.

Masalah: `handleSave` memanggil `renderTextEditsToPdf(rawBuffer, editsByPage.value)`, tetapi `editsByPage` tidak ada di scope (destructure `useTextEdits` di baris 33-35 hanya mengambil `currentEdits, changedCount, setText, snapshot, reset, clear`). Akibatnya setiap Simpan melempar `ReferenceError` dan pengguna selalu melihat toast "Gagal menyimpan PDF".

Perbaikan: tambahkan `editsByPage` ke destructure itu. Tidak ada perubahan lain di commit ini.

Verifikasi: tidak bisa diuji tanpa browser. Catat sebagai langkah smoke manual.

## Commit 2 — `feat(edit-pdf): keep only document text editing`

Tujuan: buang semua objek overlay (tambah teks, tutup teks, kotak, lingkaran, garis, coretan, gambar). Yang tersisa hanya mode mengedit tulisan yang sudah ada di halaman. Mode teks jadi selalu aktif.

Hapus file:

- `src/features/edit-pdf/logic/renderOverlayToPdf.js`
- `src/features/edit-pdf/logic/objectInteractions.js`
- `src/features/edit-pdf/logic/useOverlayObjects.js`
- `src/features/edit-pdf/logic/usePointerSession.js`
- `src/features/edit-pdf/components/EditObjectList.vue`
- `src/features/edit-pdf/components/EditOverlayItem.vue`

Ubah `src/features/edit-pdf/index.js`: hapus re-export `renderOverlayToPdf` dan blok re-export helper `objectInteractions`. Sisakan `id`, `titleKey`, `descKey`, `icon`, `component`.

Ubah `components/EditPdfTool.vue`:

- hapus import dan pemakaian `useOverlayObjects`, `renderOverlayToPdf`, `EditObjectList`;
- hapus state `isDrawMode` dan `isTextMode`;
- hapus panel kanan dan grid `lg:grid-cols-4`, jadi satu kolom;
- `handleSave` hanya memanggil `renderTextEditsToPdf` lalu `downloadFile`; pertahankan toast `skippedCount` yang sudah ada.

Ubah `components/EditCanvas.vue`:

- props tinggal `pdfDocProxy`, `currentPage`, `textEdits`, `scale`;
- emit tinggal `update-text`, `start-edit`, `rendered`;
- hapus `usePointerSession`, `onKeyDown` (Delete/arrow), `EditOverlayItem`, semua handler pointer, dan import `nudgeObject`;
- layer teks selalu dirender (buang syarat `v-if="isTextMode && !isDrawMode"`).

Ubah `components/EditToolbar.vue`:

- props tinggal `changedCount`; emit tinggal `reset-text`;
- sisakan badge jumlah perubahan, tombol reset, dan paragraf `textHint`;
- hapus tombol "Edit Tulisan Dokumen" (mode selalu aktif), semua tombol add-object, tombol draw, input gambar, dan `handleImageInput`.

Ubah `src/core/i18n.js` (blok `tools.editPdf`, id dan en):

- hapus `addLabel`, `btnText`, `btnWhiteout`, `btnRect`, `btnEllipse`, `btnLine`, `btnDraw`, `btnImage`, `panelTitle`, `textLabel`, `removeBtn`, `noSelection`, `textModeBtn`;
- tulis ulang `title` dan `desc`. Contoh id: `title: 'Edit Tulisan PDF'`, `desc: 'Klik tulisan yang sudah ada di halaman, lalu ketik atau hapus seperti mengetik biasa. Tulisan lama ditutupi dan ditulis ulang memakai font bawaan.'`;
- pertahankan `saveBtn`, `successTitle`, `failed`, `textChanged`, `textResetBtn`, `textHint`, `disclaimer`.

Ubah tes:

- hapus `tests/unit/edit-pdf.test.mjs` (kedua tesnya menguji objek overlay);
- di `tests/unit/unicodeText.test.mjs`, hapus tes `edit-pdf: overlay text with non-ASCII characters does not throw` dan import `renderOverlayToPdf`.

Jangan ubah `renderTextEditsToPdf.js`, `textEditInteractions.js`, `extractEditableText.js`, `hexColor.js`. Kotak putih otomatis di belakang teks yang diketik ulang tetap ada — itu cara kerja edit teks, bukan fitur "Tutup Teks".

## Commit 3 — `refactor: remove the Prepare for AI tool`

- hapus folder `src/features/ai-summary/` (3 komponen, 3 logic, index.js, 520 LOC);
- `src/features/registry.js`: hapus import `aiSummary` dan entrinya di `allModules`;
- `src/ui/AppSidebar.vue`: hapus baris `toolIds.push('ai-summary')`;
- `src/App.vue`: hapus import `AiSummaryTool` dan cabang `v-else-if="activeToolId === 'ai-summary'"`; ubah cabang pertama `MergeTool` dari `v-if` menjadi `v-else` sebagai fallback, sehingga hash tak dikenal (misalnya bookmark lama `#ai-summary`) menampilkan Merge, bukan area kosong. Pastikan hanya ada satu `v-else` dan urutannya tetap terakhir;
- `src/core/i18n.js`: hapus blok `tools.aiSummary` (id dan en) dan alias `translations.id.aiSummary` / `translations.en.aiSummary`;
- tes: hapus `tests/unit/ai-summary.test.mjs` dan `tests/unit/aiSummaryLoadOrder.test.mjs`; di `tests/unit/unicodeText.test.mjs` hapus tes `ai-summary: PDF export with non-ASCII text does not throw` dan import `createPdfExport`;
- `README.md`: hapus item 26 (Siapkan untuk AI) dan perbarui item 4 (Edit PDF) agar sesuai fitur text-only.

`tests/unit/registry.test.mjs` memeriksa kecocokan sidebar, registry, dan folder fitur. Kalau ada langkah yang tertinggal, tes ini gagal. Jangan mengubah tes itu untuk meloloskannya.

## Verifikasi akhir

- `npm test` lulus. Perkiraan 128 tes. Tidak ada tes yang dihapus selain yang menguji fitur yang memang dihapus.
- `npm run build` sukses, dan zero-network pass untuk kelima berkas HTML.
- Smoke manual: Edit PDF (muat berkas, klik tulisan, ketik, Simpan → PDF terunduh dan teks berubah, tanpa toast gagal); sidebar tidak lagi menampilkan "Siapkan untuk AI"; `#ai-summary` menampilkan Merge; watermark, page-numbers, powerpoint-to-pdf, dan sign tetap jalan (mereka masih memakai `hexColor.js`).
- Laporkan: hash commit per fase, jumlah tes sebelum/sesudah, dan apa pun yang tidak berhasil.
