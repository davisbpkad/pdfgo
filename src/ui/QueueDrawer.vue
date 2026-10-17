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
    showToast(t('queue.noResults'), 'warning');
    return;
  }

  try {
    const zipBlob = await createZipArchive(items.map(i => ({ name: i.name, data: i.result })));
    downloadFile(zipBlob, `PDFToolkit_Batch_${Date.now()}.zip`, 'application/zip');
    showToast(t('queue.zipDownloaded'), 'success');
  } catch (err) {
    showToast(err.message || t('queue.zipFailed'), 'error');
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
      class="fixed bottom-0 right-0 z-50 w-full sm:max-w-md bg-paper border-t-2 sm:border-l-2 sm:border-t-2 border-ink rounded-t-md sm:rounded-tl-md shadow-hard-lg transition-transform duration-200 flex flex-col max-h-[85vh] select-none"
      :class="queueDrawerOpen ? 'translate-y-0' : 'translate-y-full'"
    >
      <!-- Header -->
      <div class="p-4 border-b-2 border-ink flex items-center justify-between bg-accent/30">
        <div class="flex items-center gap-2">
          <span class="font-display font-extrabold text-base text-ink uppercase tracking-tight">
            {{ t('queue.title') || 'Antrean Berkas' }}
          </span>
          <span class="bg-ink text-accent px-2 py-0.5 text-xs font-black rounded-sm border border-ink shadow-[1px_1px_0_0_#000000]">
            {{ queueState.count }}
          </span>
        </div>
        <button
          class="w-8 h-8 border-2 border-ink bg-paper rounded-sm flex items-center justify-center font-black text-lg leading-none shadow-hard-sm hover:bg-accent active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          @click="closeQueueDrawer"
          :aria-label="t('queue.closeAria')"
        >
          &times;
        </button>
      </div>

      <!-- Item List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div v-if="queueState.count === 0" class="text-center py-8 text-ink/60 font-bold text-sm">
          {{ t('queue.empty') || 'Antrean masih kosong. Tambahkan file PDF.' }}
        </div>

        <div
          v-for="item in queueState.items"
          :key="item.id"
          class="p-3 border-2 border-ink bg-paper rounded-sm flex items-center justify-between gap-3 shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all duration-150"
        >
          <div class="min-w-0 flex-1">
            <div class="font-bold text-sm text-ink truncate" :title="item.name">
              {{ item.name }}
            </div>
            <div class="text-xs text-ink/70">
              {{ (item.size / 1024 / 1024).toFixed(2) }} MB •
              <span class="font-black uppercase" :class="item.status === 'done' ? 'text-accent-strong' : ''">
                {{ item.status }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              v-if="item.result"
              class="w-7 h-7 border-2 border-ink rounded-sm text-xs font-bold bg-accent hover:bg-accent-strong text-black flex items-center justify-center shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              @click="downloadSingle(item.id)"
              :title="t('queue.downloadItem')"
            >
              ↓
            </button>
            <button
              class="w-7 h-7 border-2 border-ink rounded-sm text-xs font-bold text-black bg-danger hover:opacity-90 flex items-center justify-center shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              @click="queue.removeItem(item.id)"
              :title="t('queue.removeItem')"
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 border-t-2 border-ink flex gap-2 bg-paper">
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
