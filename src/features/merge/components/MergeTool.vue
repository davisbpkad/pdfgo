<script setup>
import { ref } from 'vue';
import { mergePdfFiles } from '../logic/mergePdfFiles.js';
import { loadPdfJsDocument, generateThumbnail } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import DropZone from '../../../ui/DropZone.vue';
import MergeCard from './MergeCard.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import BaseCard from '../../../ui/BaseCard.vue';

const fileList = ref([]);
const isProcessing = ref(false);
const progressValue = ref(0);
const mergedResult = ref(null);

async function handleIncomingFiles(files) {
  const newPdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
  if (newPdfFiles.length === 0) return;

  for (const file of newPdfFiles) {
    const item = {
      id: 'merge_' + Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      pageCount: '...',
      thumbnail: '',
      isEncrypted: false,
      password: '',
      error: null
    };

    fileList.value.push(item);

    try {
      const buffer = await file.arrayBuffer();
      try {
        const docProxy = await loadPdfJsDocument(buffer);
        item.pageCount = docProxy.numPages;
        item.thumbnail = await generateThumbnail(docProxy, 120);
      } catch (err) {
        if (err.name === 'PasswordException' || (err.message && err.message.includes('password'))) {
          item.isEncrypted = true;
          item.pageCount = '?';
        } else {
          item.error = err.message || 'File PDF tidak valid';
        }
      }
    } catch (e) {
      item.error = 'Gagal membaca berkas';
    }
  }
}

async function unlockFile({ index, password }) {
  const item = fileList.value[index];
  if (!item || !item.isEncrypted) return;

  try {
    const buffer = await item.file.arrayBuffer();
    const docProxy = await loadPdfJsDocument(buffer, password);
    item.pageCount = docProxy.numPages;
    item.thumbnail = await generateThumbnail(docProxy, 120);
    item.password = password;
    item.isEncrypted = false;
    item.error = null;
    showToast('Password cocok! Dokumen terbuka.', 'success');
  } catch (err) {
    showToast('Password salah. Silakan coba lagi.', 'error');
  }
}

function removeFile(index) {
  fileList.value.splice(index, 1);
  if (fileList.value.length === 0) mergedResult.value = null;
}

function moveFile(fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= fileList.value.length || toIndex < 0 || toIndex >= fileList.value.length) return;
  const [moved] = fileList.value.splice(fromIndex, 1);
  fileList.value.splice(toIndex, 0, moved);
}

function clearAll() {
  fileList.value = [];
  mergedResult.value = null;
}

async function handleMerge() {
  if (fileList.value.length < 2) {
    showToast('Pilih minimal 2 file PDF untuk digabungkan.', 'error');
    return;
  }

  const lockedItem = fileList.value.find(f => f.isEncrypted);
  if (lockedItem) {
    showToast(`Berkas "${lockedItem.name}" masih terkunci password. Buka terlebih dahulu.`, 'error');
    return;
  }

  isProcessing.value = true;
  progressValue.value = 5;

  try {
    const entries = await Promise.all(fileList.value.map(async (item) => ({
      buffer: await item.file.arrayBuffer(),
      file: item.file,
      name: item.name,
      password: item.password
    })));

    const mergedBytes = await mergePdfFiles(entries, (pct) => {
      progressValue.value = pct;
    });

    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const verifyDoc = await loadPdfJsDocument(mergedBytes);

    mergedResult.value = {
      blob,
      pageCount: verifyDoc.numPages,
      size: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
    };

    isProcessing.value = false;
    downloadFile(blob, `PDFToolkit_Merged_${Date.now()}.pdf`);
    showToast('Dokumen berhasil digabungkan!', 'success');
  } catch (err) {
    isProcessing.value = false;
    showToast(err.message || 'Gagal menggabungkan PDF', 'error');
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Tool -->
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        {{ t('tools.merge.title') || 'Gabung PDF' }}
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        {{ t('tools.merge.desc') || 'Gabungkan beberapa file PDF menjadi satu dokumen utuh dengan urutan yang fleksibel.' }}
      </p>
    </div>

    <!-- Dropzone Input -->
    <DropZone @files="handleIncomingFiles" />

    <!-- File List Cards -->
    <div v-if="fileList.length > 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-bold text-sm text-ink uppercase tracking-wider">
          Urutan Dokumen ({{ fileList.length }} File)
        </span>
        <button
          type="button"
          class="text-xs font-bold text-danger hover:underline cursor-pointer"
          @click="clearAll"
        >
          Kosongkan Semua
        </button>
      </div>

      <div class="space-y-2">
        <MergeCard
          v-for="(item, idx) in fileList"
          :key="item.id"
          :item="item"
          :index="idx"
          :is-first="idx === 0"
          :is-last="idx === fileList.length - 1"
          @move-up="moveFile(idx, idx - 1)"
          @move-down="moveFile(idx, idx + 1)"
          @remove="removeFile(idx)"
          @unlock="unlockFile"
        />
      </div>

      <!-- Processing Progress -->
      <BaseProgressBar
        v-if="isProcessing"
        :progress="progressValue"
        label="Menggabungkan file PDF..."
      />

      <!-- Action Button -->
      <div class="pt-2 flex flex-col sm:flex-row gap-3">
        <BaseButton
          variant="primary"
          class="w-full sm:w-auto text-base py-3 px-6"
          :disabled="fileList.length < 2 || isProcessing || fileList.some(f => f.isEncrypted)"
          :loading="isProcessing"
          @click="handleMerge"
        >
          {{ `Gabungkan ${fileList.length} file jadi 1 PDF` }}
        </BaseButton>

        <span
          v-if="fileList.length < 2"
          class="text-xs text-ink/70 flex items-center font-bold"
        >
          Tambahkan minimal 2 file PDF untuk mulai menggabungkan.
        </span>
      </div>
    </div>

    <!-- Success Result Banner -->
    <BaseCard v-if="mergedResult" class="bg-accent-2/30 border-3 border-ink space-y-3">
      <div class="flex items-center gap-2 font-display font-black text-lg text-ink uppercase">
        <span>✓</span>
        <span>Penggabungan Berhasil!</span>
      </div>
      <p class="text-sm font-medium text-ink">
        File siap diunduh ({{ mergedResult.pageCount }} halaman • {{ mergedResult.size }}).
      </p>
      <div class="flex gap-2">
        <BaseButton
          variant="primary"
          @click="downloadFile(mergedResult.blob, `PDFToolkit_Merged_${Date.now()}.pdf`)"
        >
          Unduh Lagi
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
