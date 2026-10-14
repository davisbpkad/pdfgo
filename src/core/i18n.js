/**
 * i18n.js - Multilingual Dictionary & Localization Engine
 * Supports ID (Bahasa Indonesia) and EN (English).
 * Pure, isolated, zero external network dependency.
 */

const STORAGE_KEY = 'pdfgo_lang';

const translations = {
  id: {
    app: {
      name: 'PDF To Go',
      tagline: 'Manipulasi PDF 100% Offline & Privat',
      badge: 'Offline Total',
      offlineBanner: '100% Offline • File tidak pernah meninggalkan perangkat Anda'
    },
    nav: {
      categoryAll: 'Alat Dokumen',
      categoryAggregator: 'Kombinasi & Konversi',
      categorySecurity: 'Keamanan & Anotasi'
    },
    tools: {
      merge: {
        title: 'Gabung PDF',
        desc: 'Gabungkan beberapa file PDF menjadi satu dokumen utuh dengan urutan yang fleksibel.',
        addFiles: 'Tambah PDF',
        clearAll: 'Kosongkan',
        actionButton: 'Gabung {count} File PDF',
        stats: '{fileCount} file • {pageCount} halaman',
        pagesLabel: '{count} hal',
        encryptedWarning: 'Terkunci password. Masukkan password:',
        unlockBtn: 'Buka',
        merging: 'Menggabungkan dokumen...',
        successTitle: 'Penggabungan Berhasil!',
        successDesc: 'Dokumen berhasil digabung menjadi {pageCount} halaman ({fileSize}).',
        emptyPrompt: 'Pilih atau tarik beberapa file PDF ke area dropzone di atas untuk mulai menggabungkan.',
        needMinFiles: 'Pilih minimal 2 file PDF untuk digabungkan.'
      },
      split: {
        title: 'Pisah PDF',
        desc: 'Ekstrak rentang halaman tertentu atau pisah dokumen menjadi file terpisah.',
        modeRange: 'Ekstrak Rentang Halaman',
        modeEveryN: 'Pisah Tiap N Halaman',
        rangeLabel: 'Rentang Halaman (misal: 1-3, 5, 8-10):',
        nPagesLabel: 'Jumlah halaman per file:',
        actionExtract: 'Ekstrak Halaman',
        actionSplit: 'Pisah Dokumen (ZIP)',
        invalidRange: 'Format rentang halaman tidak valid',
        successZip: 'Berhasil memisahkan dokumen menjadi {count} berkas.',
        successPdf: 'Halaman terpilih berhasil diekstrak.',
        emptyPrompt: 'Pilih atau letakkan satu file PDF di area dropzone untuk mulai memisahkan.'
      },
      organize: {
        title: 'Atur Halaman',
        desc: 'Susun ulang, putar orientasi (90°, 180°, 270°), atau hapus halaman yang tidak diinginkan.',
        rotateAll: 'Putar Semua (+90°)',
        rotatePage: 'Putar 90°',
        deletePage: 'Hapus Halaman',
        undo: 'Urungkan',
        redo: 'Ulangi',
        reset: 'Kembalikan Asli',
        saveOrganized: 'Simpan Dokumen PDF ({count} Hal)',
        pageCardLabel: 'Hal {num}',
        successSaved: 'Perubahan halaman berhasil disimpan.',
        emptyPrompt: 'Pilih file PDF untuk melihat grid visual dan mengatur urutan halamannya.',
        selectAll: 'Pilih Semua',
        deselectAll: 'Batalkan Pilihan',
        deleteSelected: 'Hapus Terpilih',
        changeFile: 'Ganti File',
        minPagesError: 'Dokumen harus memiliki minimal 1 halaman tersisa. Tidak bisa menghapus semua halaman.'
      },
      sign: {
        title: 'Tanda Tangan Digital',
        desc: 'Buat tanda tangan langsung di layar, ketik nama dengan gaya elegan, atau unggah paraf.',
        tabDraw: 'Gambar Langsung',
        tabType: 'Ketik Nama',
        tabUpload: 'Unggah Gambar',
        colorLabel: 'Warna Tinta:',
        widthLabel: 'Ketebalan:',
        fontLabel: 'Pilihan Gaya Font:',
        typePlaceholder: 'Ketik nama tanda tangan di sini...',
        uploadPrompt: 'Unggah paraf/stempel (PNG, JPG)',
        removeBg: 'Hapus latar putih menjadi transparan',
        clearCanvas: 'Bersihkan Coretan',
        useSignature: 'Gunakan Tanda Tangan Ini',
        placementHint: 'Geser tanda tangan ke posisi yang diinginkan di atas halaman PDF. Tarik ujung untuk mengubah ukuran.',
        pageApplyLabel: 'Terapkan pada:',
        applyCurrent: 'Halaman Saat Ini',
        applyAll: 'Semua Halaman',
        saveSigned: 'Simpan Dokumen Bertanda Tangan',
        emptyPrompt: 'Pilih file PDF yang ingin Anda bubuhi tanda tangan digital.'
      },
      form: {
        title: 'Isi Formulir',
        desc: 'Isi formulir PDF interaktif secara langsung dan ratakan (flatten) dokumen.',
        noFieldsTitle: 'Tidak Ada Formulir Interaktif',
        noFieldsDesc: 'Dokumen ini tidak memiliki field AcroForm interaktif. Anda dapat menggunakan modul Tanda Tangan untuk mengisi teks atau paraf secara visual.',
        openSign: 'Buka Modul Tanda Tangan',
        fieldsFound: 'Ditemukan {count} field formulir yang dapat diisi:',
        flattenLabel: 'Ratakan Formulir (Flatten) agar tidak dapat diedit lagi',
        saveForm: 'Simpan & Isi Dokumen PDF',
        emptyPrompt: 'Pilih file PDF yang berisi formulir interaktif (AcroForm) untuk mulai mengisi.'
      },
      redact: {
        title: 'Sensor Dokumen',
        desc: 'Hapus data sensitif secara permanen dengan rasterisasi canvas anti-bocor.',
        drawHint: 'Tarik mouse / pointer di atas pratinjau halaman untuk menggambar kotak sensor hitam solid.',
        searchLabel: 'Cari Teks & Sensor Otomatis:',
        searchPlaceholder: 'Ketik kata kunci untuk disensor (misal: NIK, Password)...',
        searchBtn: 'Sensor Kata Kunci',
        foundCount: 'Ditemukan dan disensor {count} kemunculan.',
        clearBoxes: 'Hapus Semua Kotak Sensor',
        sanitizeMetadata: 'Bersihkan juga seluruh metadata dokumen (Title, Author, Producer)',
        actionApply: 'Terapkan Sensor Permanen',
        warningPermanent: '⚠️ PERHATIAN: Sensor ini bersifat permanen. Halaman yang disensor akan diganti dengan raster gambar beresolusi tinggi (teks dan vektor di baliknya hilang total).',
        emptyPrompt: 'Pilih file PDF yang memiliki data sensitif untuk disensor secara permanen.'
      },
      compress: {
        title: 'Kompres PDF',
        desc: 'Kecilkan ukuran file PDF dengan menjaga keseimbangan kualitas visual.',
        presetLow: 'Ringan',
        presetLowDesc: 'Kualitas visual maksimal (~150 DPI), sedikit kompresi.',
        presetBalanced: 'Seimbang (Direkomendasikan)',
        presetBalancedDesc: 'Keseimbangan ideal antara ukuran berkas dan ketajaman teks.',
        presetHigh: 'Maksimal',
        presetHighDesc: 'Kompresi agresif (72 DPI), ukuran file paling kecil.',
        actionCompress: 'Kompres PDF Sekarang',
        compressing: 'Mengompresi dokumen PDF...',
        originalSize: 'Ukuran Asli',
        compressedSize: 'Ukuran Hasil',
        reductionRate: 'Penghematan',
        warnLarger: 'Ukuran hasil kompresi tidak lebih kecil dari aslinya karena dokumen asli sudah sangat terkompresi.',
        emptyPrompt: 'Pilih file PDF yang ingin Anda perkecil ukuran filenya.'
      },
      ocr: {
        title: 'Pengenalan Teks (OCR)',
        desc: 'Ubah PDF hasil scan menjadi dokumen yang teksnya bisa dicari dan disalin.',
        langLabel: 'Pilihan Bahasa OCR:',
        langInd: 'Bahasa Indonesia (ind)',
        langEng: 'English (eng)',
        langBoth: 'Keduanya (Indonesia + English)',
        pageLabel: 'Halaman yang Dikenali:',
        pagesAll: 'Semua Halaman',
        pagesRange: 'Rentang Halaman Tertentu',
        rangePlaceholder: 'Contoh: 1-3, 5',
        dpiLabel: 'Resolusi Pemindaian:',
        dpi150: '150 DPI (Cepat)',
        dpi300: '300 DPI (Presisi Tinggi - Rekomendasi)',
        actionStart: 'Mulai Pengenalan Teks (OCR)',
        processing: 'Mengenali teks halaman {current} dari {total}... ({pct}%)',
        completed: 'OCR Berhasil Diselesaikan!',
        downloadSearchablePdf: 'Unduh PDF (Dapat Dicari)',
        downloadTxt: 'Unduh Berkas Teks (.txt)',
        copyText: 'Salin Teks',
        copied: 'Teks disalin ke clipboard!',
        recognizedStats: '{words} kata • {chars} karakter • Rata-rata akurasi: {acc}%',
        modelStatusReady: 'Model Bahasa Siap ({langs})',
        modelStatusMissing: 'Model OCR Belum Dimuat',
        modelImportPrompt: 'Varian ini memerlukan file model OCR (.traineddata). Impor file model lokal dari komputer Anda tanpa koneksi internet:',
        importBtn: 'Impor Model .traineddata',
        importSuccess: 'Model bahasa {lang} berhasil disimpan ke penyimpanan lokal perangkat!',
        deleteModel: 'Hapus Model',
        emptyPrompt: 'Pilih file PDF atau hasil scan untuk mengenali dan mengekstrak teksnya.',
        cancel: 'Batal',
        notLoadedWarning: 'Silakan impor model bahasa OCR terlebih dahulu sebelum memulai proses.',
        noTextFound: 'Tidak ada teks yang dapat dikenali pada halaman ini.'
      },
      extractText: {
        title: 'Ekstrak Teks',
        desc: 'Ambil seluruh isi teks dari dokumen PDF ke dalam berkas teks (.txt).',
        includeSeparators: 'Sertakan pembatas per halaman (--- Halaman X ---)',
        copyText: 'Salin Teks',
        copied: 'Teks disalin ke clipboard!',
        downloadTxt: 'Unduh Berkas .txt',
        stats: '{words} kata • {chars} karakter • {pages} halaman',
        scannedWarning: 'Teks tidak terdeteksi (dokumen hasil scan/gambar). Gunakan modul OCR untuk mengekstrak teks gambar.',
        openOcr: 'Buka Modul OCR',
        emptyPrompt: 'Pilih file PDF untuk mengekstrak seluruh isi teksnya secara instan.'
      },
      watermark: {
        title: 'Watermark',
        desc: 'Tambahkan cap teks kustom, diagonal, atau berulang dengan transparansi terkontrol.',
        textLabel: 'Teks Watermark:',
        presetConfidential: 'RAHASIA',
        presetDraft: 'DRAFT',
        presetSample: 'CONTOH',
        sizeLabel: 'Ukuran Teks:',
        opacityLabel: 'Transparansi ({pct}%):',
        rotationLabel: 'Sudut Rotasi:',
        posLabel: 'Tata Letak / Posisi:',
        posDiagonal: 'Diagonal Tengah (45°)',
        posCenter: 'Tengah Horizontal (0°)',
        posTiled: 'Pola Berulang (Tiled Pattern)',
        pagesLabel: 'Target Halaman:',
        pagesAll: 'Semua Halaman',
        pagesOdd: 'Halaman Ganjil Saja',
        pagesEven: 'Halaman Genap Saja',
        actionApply: 'Terapkan Watermark ke PDF',
        emptyPrompt: 'Pilih file PDF untuk membubuhi watermark teks kustom.'
      },
      pageNumbers: {
        title: 'Nomor Halaman',
        desc: 'Bubuhi nomor halaman otomatis dengan beragam format token dan penempatan.',
        formatLabel: 'Format Penomoran:',
        posLabel: 'Posisikan pada Halaman (Pilih Titik):',
        startNumberLabel: 'Nomor Awal:',
        marginLabel: 'Jarak Margin dari Tepi:',
        skipFirstLabel: 'Lewati Halaman Pertama (Halaman Sampul / Cover)',
        actionApply: 'Terapkan Nomor Halaman ke PDF',
        emptyPrompt: 'Pilih file PDF untuk menambahkan nomor halaman otomatis.'
      },
      pdfToImage: {
        title: 'PDF ke Gambar',
        desc: 'Konversi setiap halaman PDF menjadi format gambar berkualitas PNG atau JPEG.',
        formatLabel: 'Format Gambar:',
        qualityLabel: 'Kualitas JPEG:',
        dpiLabel: 'Resolusi (DPI):',
        dpiStandard: 'Standar (72 DPI - Cepat)',
        dpiMedium: 'Sedang (150 DPI - Seimbang)',
        dpiHigh: 'Tinggi (300 DPI - Tajam)',
        pagesLabel: 'Pilihan Halaman:',
        pagesAll: 'Semua Halaman',
        actionConvert: 'Konversi ke Gambar (ZIP)',
        converting: 'Mengonversi halaman {current} dari {total}...',
        emptyPrompt: 'Pilih file PDF untuk mengonversi halaman-halamannya menjadi format gambar.'
      },
      imageToPdf: {
        title: 'Gambar ke PDF',
        desc: 'Ubah koleksi foto PNG, JPG, dan WebP menjadi satu dokumen PDF rapi.',
        pageSizeLabel: 'Ukuran Kertas:',
        pageFit: 'Sesuai Ukuran Gambar',
        orientationLabel: 'Orientasi:',
        orientAuto: 'Otomatis',
        orientPortrait: 'Tegak (Portrait)',
        orientLandscape: 'Mendatar (Landscape)',
        marginLabel: 'Margin:',
        marginNone: 'Tanpa Margin (0)',
        marginSmall: 'Kecil (15pt)',
        marginNormal: 'Standar (30pt)',
        fitModeLabel: 'Mode Pas:',
        fitContain: 'Contain (Muat Utuh)',
        fitCover: 'Cover (Penuhi Halaman)',
        actionCreate: 'Buat Dokumen PDF ({count} Gambar)',
        emptyPrompt: 'Pilih atau tarik beberapa berkas gambar (PNG, JPG, WebP) ke sini untuk dijadikan PDF.'
      }
    },
    dropzone: {
      title: 'Tarik & lepas file di sini',
      subtitle: 'atau klik untuk memilih file dari komputer Anda',
      button: 'Pilih File',
      hint: 'Mendukung pemrosesan batch banyak file sekaligus'
    },
    queue: {
      title: 'Antrean Dokumen',
      empty: 'Belum ada file dalam antrean',
      totalFiles: '{count} file',
      clearAll: 'Kosongkan',
      downloadAll: 'Unduh Semua (ZIP)',
      downloadSingle: 'Unduh',
      statusIdle: 'Menunggu',
      statusProcessing: 'Memproses...',
      statusDone: 'Selesai',
      statusError: 'Gagal',
      processBatch: 'Proses Antrean dengan {tool}',
      batchCompleted: 'Proses batch selesai: {success} berhasil, {failed} gagal.',
      notPerDoc: 'Alat aktif ({tool}) adalah alat agregator. Masukkan file langsung ke alat tersebut.',
      processingBatch: 'Memproses berkas {current} dari {total}...'
    },
    common: {
      themeAuto: 'Tema: Otomatis',
      themeLight: 'Tema: Terang',
      themeDark: 'Tema: Gelap',
      langId: 'Bahasa: ID',
      langEn: 'Language: EN',
      download: 'Unduh Hasil',
      cancel: 'Batal',
      remove: 'Hapus',
      retry: 'Coba Lagi',
      reset: 'Mulai Ulang',
      process: 'Proses Dokumen',
      processing: 'Sedang Memproses...',
      close: 'Tutup',
      preview: 'Pratinjau',
      readyPlaceholder: 'Modul ini siap digunakan. Unggah file di atas untuk memulai.'
    }
  },
  en: {
    app: {
      name: 'PDF To Go',
      tagline: '100% Offline & Private PDF Manipulation',
      badge: 'Full Offline',
      offlineBanner: '100% Offline • Your files never leave your device'
    },
    nav: {
      categoryAll: 'Document Tools',
      categoryAggregator: 'Combine & Convert',
      categorySecurity: 'Security & Annotation'
    },
    tools: {
      merge: {
        title: 'Merge PDF',
        desc: 'Combine multiple PDF files into a single unified document with custom ordering.',
        addFiles: 'Add PDFs',
        clearAll: 'Clear All',
        actionButton: 'Merge {count} PDF Files',
        stats: '{fileCount} files • {pageCount} pages',
        pagesLabel: '{count} pgs',
        encryptedWarning: 'Password protected. Enter password:',
        unlockBtn: 'Unlock',
        merging: 'Merging documents...',
        successTitle: 'Merge Successful!',
        successDesc: 'Document merged successfully into {pageCount} pages ({fileSize}).',
        emptyPrompt: 'Select or drop multiple PDF files into the dropzone above to begin merging.',
        needMinFiles: 'Please select at least 2 PDF files to merge.'
      },
      split: {
        title: 'Split PDF',
        desc: 'Extract specific page ranges or split document into separate individual files.',
        modeRange: 'Extract Page Range',
        modeEveryN: 'Split Every N Pages',
        rangeLabel: 'Page Range (e.g. 1-3, 5, 8-10):',
        nPagesLabel: 'Number of pages per file:',
        actionExtract: 'Extract Pages',
        actionSplit: 'Split Document (ZIP)',
        invalidRange: 'Invalid page range format',
        successZip: 'Document successfully split into {count} files.',
        successPdf: 'Selected pages extracted successfully.',
        emptyPrompt: 'Select or drop a single PDF file into the dropzone to begin splitting.'
      },
      organize: {
        title: 'Organize Pages',
        desc: 'Rearrange page order, rotate orientations (90°, 180°, 270°), or delete unwanted pages.',
        rotateAll: 'Rotate All (+90°)',
        rotatePage: 'Rotate 90°',
        deletePage: 'Delete Page',
        undo: 'Undo',
        redo: 'Redo',
        reset: 'Reset to Original',
        saveOrganized: 'Save Organized PDF ({count} Pages)',
        pageCardLabel: 'Page {num}',
        successSaved: 'Page changes saved successfully.',
        emptyPrompt: 'Select a PDF file to view the visual thumbnail grid and organize its pages.',
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        deleteSelected: 'Delete Selected',
        changeFile: 'Change File',
        minPagesError: 'Document must have at least 1 page remaining. Cannot delete all pages.'
      },
      sign: {
        title: 'Digital Signature',
        desc: 'Draw signatures on canvas, type with stylish script fonts, or upload signature images.',
        tabDraw: 'Draw Signature',
        tabType: 'Type Name',
        tabUpload: 'Upload Image',
        colorLabel: 'Ink Color:',
        widthLabel: 'Width:',
        fontLabel: 'Font Style:',
        typePlaceholder: 'Type your signature here...',
        uploadPrompt: 'Upload signature/stamp (PNG, JPG)',
        removeBg: 'Remove white background (transparent)',
        clearCanvas: 'Clear',
        useSignature: 'Use This Signature',
        placementHint: 'Drag signature to target position on the PDF page. Drag corner handle to resize.',
        pageApplyLabel: 'Apply to:',
        applyCurrent: 'Current Page',
        applyAll: 'All Pages',
        saveSigned: 'Save Signed PDF',
        emptyPrompt: 'Select a PDF file that you would like to sign digitally.'
      },
      form: {
        title: 'Fill Form',
        desc: 'Fill interactive AcroForm fields directly and optionally flatten the document.',
        noFieldsTitle: 'No Interactive Form Fields',
        noFieldsDesc: 'This document does not contain interactive AcroForm fields. You can use the Digital Signature tool to add text or signatures visually.',
        openSign: 'Open Signature Module',
        fieldsFound: 'Found {count} interactive form fields:',
        flattenLabel: 'Flatten form (make read-only and uneditable)',
        saveForm: 'Save & Fill PDF Document',
        emptyPrompt: 'Select a PDF document containing interactive AcroForms to begin filling.'
      },
      redact: {
        title: 'Redact Document',
        desc: 'Permanently remove sensitive information via leak-proof canvas rasterization.',
        drawHint: 'Drag mouse / pointer across page preview to draw solid black redaction boxes.',
        searchLabel: 'Search Text & Auto-Redact:',
        searchPlaceholder: 'Type keyword to redact (e.g. Password, SSN)...',
        searchBtn: 'Redact Keyword',
        foundCount: 'Found and redacted {count} occurrences.',
        clearBoxes: 'Clear All Redaction Boxes',
        sanitizeMetadata: 'Sanitize document metadata (Title, Author, Producer)',
        actionApply: 'Apply Permanent Redaction',
        warningPermanent: '⚠️ ATTENTION: Redaction is permanent. Redacted pages will be rasterized to high-res images (underlying text is completely removed).',
        emptyPrompt: 'Select a PDF document containing sensitive information to redact permanently.'
      },
      compress: {
        title: 'Compress PDF',
        desc: 'Reduce PDF file size while maintaining balanced visual clarity.',
        presetLow: 'Light',
        presetLowDesc: 'Maximum visual clarity (~150 DPI), light compression.',
        presetBalanced: 'Balanced (Recommended)',
        presetBalancedDesc: 'Ideal balance between file size and text sharpness.',
        presetHigh: 'Maximum',
        presetHighDesc: 'Aggressive compression (72 DPI), smallest file size.',
        actionCompress: 'Compress PDF Now',
        compressing: 'Compressing PDF document...',
        originalSize: 'Original Size',
        compressedSize: 'Compressed Size',
        reductionRate: 'Reduction',
        warnLarger: 'Compressed result is not smaller because the original is already heavily compressed.',
        emptyPrompt: 'Select a PDF file that you would like to compress.'
      },
      ocr: {
        title: 'Text Recognition (OCR)',
        desc: 'Transform scanned PDFs and images into searchable and selectable documents.',
        langLabel: 'OCR Language Selection:',
        langInd: 'Indonesian (ind)',
        langEng: 'English (eng)',
        langBoth: 'Both (Indonesian + English)',
        pageLabel: 'Pages to Recognize:',
        pagesAll: 'All Pages',
        pagesRange: 'Specific Page Range',
        rangePlaceholder: 'e.g. 1-3, 5',
        dpiLabel: 'Scan Resolution:',
        dpi150: '150 DPI (Fast)',
        dpi300: '300 DPI (High Precision - Recommended)',
        actionStart: 'Start Text Recognition (OCR)',
        processing: 'Recognizing text on page {current} of {total}... ({pct}%)',
        completed: 'OCR Completed Successfully!',
        downloadSearchablePdf: 'Download Searchable PDF',
        downloadTxt: 'Download Text File (.txt)',
        copyText: 'Copy Text',
        copied: 'Text copied to clipboard!',
        recognizedStats: '{words} words • {chars} characters • Avg Accuracy: {acc}%',
        modelStatusReady: 'Language Models Ready ({langs})',
        modelStatusMissing: 'OCR Language Model Not Loaded',
        modelImportPrompt: 'This variant requires local OCR model files (.traineddata). Import model files from your computer completely offline:',
        importBtn: 'Import .traineddata Model',
        importSuccess: 'Language model {lang} successfully saved to local device storage!',
        deleteModel: 'Delete Model',
        emptyPrompt: 'Select a scanned PDF or document to recognize and extract its text.',
        cancel: 'Cancel',
        notLoadedWarning: 'Please import an OCR language model before starting recognition.',
        noTextFound: 'No readable text could be recognized on this page.'
      },
      extractText: {
        title: 'Extract Text',
        desc: 'Extract all readable text from your PDF into a clean plain text (.txt) file.',
        includeSeparators: 'Include page separators (--- Page X ---)',
        copyText: 'Copy Text',
        copied: 'Text copied to clipboard!',
        downloadTxt: 'Download .txt File',
        stats: '{words} words • {chars} characters • {pages} pages',
        scannedWarning: 'No text detected (scanned document or image). Use the OCR module to recognize text.',
        openOcr: 'Open OCR Module',
        emptyPrompt: 'Select a PDF file to extract all its readable text content instantly.'
      },
      watermark: {
        title: 'Watermark',
        desc: 'Add custom text stamps, diagonal banners, or tiled patterns with adjustable opacity.',
        textLabel: 'Watermark Text:',
        presetConfidential: 'CONFIDENTIAL',
        presetDraft: 'DRAFT',
        presetSample: 'SAMPLE',
        sizeLabel: 'Font Size:',
        opacityLabel: 'Opacity ({pct}%):',
        rotationLabel: 'Rotation Angle:',
        posLabel: 'Position Layout:',
        posDiagonal: 'Centered Diagonal (45°)',
        posCenter: 'Centered Horizontal (0°)',
        posTiled: 'Tiled Repeating Pattern',
        pagesLabel: 'Target Pages:',
        pagesAll: 'All Pages',
        pagesOdd: 'Odd Pages Only',
        pagesEven: 'Even Pages Only',
        actionApply: 'Apply Watermark to PDF',
        emptyPrompt: 'Select a PDF file to apply a custom text watermark.'
      },
      pageNumbers: {
        title: 'Page Numbers',
        desc: 'Stamp automatic page numbers with flexible formatting tokens and alignments.',
        formatLabel: 'Numbering Format:',
        posLabel: 'Position on Page (Choose Point):',
        startNumberLabel: 'Start Number:',
        marginLabel: 'Margin Distance:',
        skipFirstLabel: 'Skip First Page (Cover Page)',
        actionApply: 'Apply Page Numbers to PDF',
        emptyPrompt: 'Select a PDF file to add automatic page numbers.'
      },
      pdfToImage: {
        title: 'PDF to Image',
        desc: 'Convert every PDF page into high-quality standalone PNG or JPEG images.',
        formatLabel: 'Image Format:',
        qualityLabel: 'JPEG Quality:',
        dpiLabel: 'Resolution (DPI):',
        dpiStandard: 'Standard (72 DPI - Fast)',
        dpiMedium: 'Medium (150 DPI - Balanced)',
        dpiHigh: 'High (300 DPI - Crisp)',
        pagesLabel: 'Page Selection:',
        pagesAll: 'All Pages',
        actionConvert: 'Convert to Images (ZIP)',
        converting: 'Converting page {current} of {total}...',
        emptyPrompt: 'Select a PDF file to convert its pages into standalone image files.'
      },
      imageToPdf: {
        title: 'Image to PDF',
        desc: 'Turn a collection of PNG, JPG, and WebP images into a single organized PDF.',
        pageSizeLabel: 'Page Size:',
        pageFit: 'Fit to Image Size',
        orientationLabel: 'Orientation:',
        orientAuto: 'Auto',
        orientPortrait: 'Portrait',
        orientLandscape: 'Landscape',
        marginLabel: 'Margin:',
        marginNone: 'No Margin (0)',
        marginSmall: 'Small (15pt)',
        marginNormal: 'Standard (30pt)',
        fitModeLabel: 'Fit Mode:',
        fitContain: 'Contain (Full Image)',
        fitCover: 'Cover (Fill Page)',
        actionCreate: 'Create PDF Document ({count} Images)',
        emptyPrompt: 'Select or drop image files (PNG, JPG, WebP) here to convert them into a single PDF.'
      }
    },
    dropzone: {
      title: 'Drag & drop files here',
      subtitle: 'or click to browse files from your computer',
      button: 'Choose Files',
      hint: 'Supports multi-file batch processing'
    },
    queue: {
      title: 'Document Queue',
      empty: 'No files in queue',
      totalFiles: '{count} files',
      clearAll: 'Clear All',
      downloadAll: 'Download All (ZIP)',
      downloadSingle: 'Download',
      statusIdle: 'Queued',
      statusProcessing: 'Processing...',
      statusDone: 'Completed',
      statusError: 'Failed',
      processBatch: 'Process Queue with {tool}',
      batchCompleted: 'Batch processing complete: {success} succeeded, {failed} failed.',
      notPerDoc: 'Active tool ({tool}) is an aggregator. Please load files directly into the module.',
      processingBatch: 'Processing file {current} of {total}...'
    },
    common: {
      themeAuto: 'Theme: Auto',
      themeLight: 'Theme: Light',
      themeDark: 'Theme: Dark',
      langId: 'Bahasa: ID',
      langEn: 'Language: EN',
      download: 'Download Result',
      cancel: 'Cancel',
      remove: 'Remove',
      retry: 'Retry',
      reset: 'Reset',
      process: 'Process Documents',
      processing: 'Processing...',
      close: 'Close',
      preview: 'Preview',
      readyPlaceholder: 'This module is ready. Upload files above to begin.'
    }
  }
};

let currentLang = 'id';
const listeners = new Set();

// Safely initialize language from URL search/hash or localStorage
try {
  const params = new URLSearchParams(window.location.search || (window.location.hash ? window.location.hash.substring(1) : ''));
  const urlLang = params.get('lang');
  if (urlLang && (urlLang === 'id' || urlLang === 'en')) {
    currentLang = urlLang;
  } else {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'id' || saved === 'en')) {
      currentLang = saved;
    }
  }
} catch (e) {
  // LocalStorage not available, default to 'id'
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== 'id' && lang !== 'en') return;
  currentLang = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {}

  listeners.forEach((callback) => {
    try {
      callback(currentLang);
    } catch (err) {
      console.error('Error in i18n listener:', err);
    }
  });
}

export function subscribeLang(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Translate a key string (e.g. 'app.name' or 'tools.merge.title')
 * @param {string} path Dot-separated path
 * @param {Record<string, string|number>} [params] Interpolation variables
 * @returns {string}
 */
export function t(path, params = {}) {
  const dict = translations[currentLang] || translations.id;
  const segments = path.split('.');
  let val = dict;

  for (const seg of segments) {
    if (val && typeof val === 'object' && seg in val) {
      val = val[seg];
    } else {
      // Fallback to Indonesian if missing
      let fallback = translations.id;
      for (const fSeg of segments) {
        if (fallback && typeof fallback === 'object' && fSeg in fallback) {
          fallback = fallback[fSeg];
        } else {
          return path;
        }
      }
      val = fallback;
      break;
    }
  }

  if (typeof val !== 'string') return path;

  // Interpolate {key}
  return val.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}
