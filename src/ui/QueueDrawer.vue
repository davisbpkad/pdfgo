<script setup>
import { queue, queueState, queueDrawerOpen, closeQueueDrawer } from '../app/providers/queue.js';
import { t } from '../app/providers/i18n.js';
import { showToast } from '../app/providers/toast.js';
import { createZipArchive } from '../core/zip.js';
import { downloadFile } from '../core/download.js';
import BaseButton from './BaseButton.vue';

async function downloadBatchZip() {
  const items = queue.getItems().filter(i => i.result);
  if (items.length === 0) {
    showToast(t('queue.noResults') || 'Tidak ada berkas yang selesai diproses.', 'warning');
    return;
  }

  try {
    const zipBlob = await createZipArchive(items.map(i => ({ name: i.name, data: i.result })));
    downloadFile(zipBlob, `PDFToolkit_Batch_${Date.now()}.zip`, 'application/zip');
    showToast(t('queue.zipDownloaded') || 'ZIP antrean berhasil diunduh.', 'success');
  } catch (err) {
    showToast(err.message || 'Gagal membuat ZIP', 'error');
  }
}

function downloadSingle(id) {
  const item = queue.getItems().find(i => i.id === id);
  if (item && item.result) {
    downloadFile(item.result, `PDFGO_${item.name}`);
  }
}

function clearAll() {
  queue.clear();
}
</script>

<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="queueDrawerOpen"
      class="fixed inset-0 bg-black/50 z-40"
      @click="closeQueueDrawer"
    />

    <!-- Drawer Panel -->
    <div
      class="fixed bottom-0 right-0 z-50 w-full sm:max-w-md bg-paper border-t-3 sm:border-l-3 sm:border-t-3 border-ink shadow-hard transition-transform duration-200 flex flex-col max-h-[85vh]"
      :class="queueDrawerOpen ? 'translate-y-0' : 'translate-y-full'"
    >
      <!-- Header -->
      <div class="p-4 border-b-3 border-ink flex items-center justify-between bg-accent/20">
        <div class="flex items-center gap-2">
          <span class="font-display font-black text-lg text-ink uppercase">
            {{ t('queue.title') || 'Antrean Berkas' }}
          </span>
          <span class="bg-ink text-paper px-2 py-0.5 text-xs font-black">
            {{ queueState.count }}
          </span>
        </div>
        <button
          class="border-2 border-ink p-1 font-black leading-none hover:bg-accent cursor-pointer"
          @click="closeQueueDrawer"
          aria-label="Tutup antrean"
        >
          &times;
        </button>
      </div>

      <!-- Item List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <div v-if="queueState.count === 0" class="text-center py-8 text-ink/60 font-bold text-sm">
          {{ t('queue.empty') || 'Antrean masih kosong. Tambahkan file PDF.' }}
        </div>

        <div
          v-for="item in queueState.items"
          :key="item.id"
          class="p-3 border-2 border-ink bg-paper flex items-center justify-between gap-3 shadow-hard-sm"
        >
          <div class="min-w-0 flex-1">
            <div class="font-bold text-sm text-ink truncate" :title="item.name">
              {{ item.name }}
            </div>
            <div class="text-xs text-ink/70">
              {{ (item.size / 1024 / 1024).toFixed(2) }} MB •
              <span class="font-black uppercase" :class="item.status === 'done' ? 'text-accent-2' : ''">
                {{ item.status }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <button
              v-if="item.result"
              class="border-2 border-ink p-1 text-xs font-bold bg-accent hover:opacity-80 cursor-pointer"
              @click="downloadSingle(item.id)"
              title="Unduh berkas ini"
            >
              ↓
            </button>
            <button
              class="border-2 border-ink p-1 text-xs font-bold text-danger hover:bg-danger hover:text-paper cursor-pointer"
              @click="queue.removeItem(item.id)"
              title="Hapus dari antrean"
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 border-t-3 border-ink flex gap-2 bg-paper">
        <BaseButton
          variant="secondary"
          class="flex-1 text-xs"
          :disabled="queueState.count === 0"
          @click="clearAll"
        >
          {{ t('queue.clearAll') || 'Kosongkan' }}
        </BaseButton>
        <BaseButton
          variant="primary"
          class="flex-2 text-xs"
          :disabled="!queueState.items.some(i => i.result)"
          @click="downloadBatchZip"
        >
          {{ t('queue.downloadAll') || 'Unduh Semua ZIP' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
