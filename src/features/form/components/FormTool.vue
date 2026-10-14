<script setup>
import { ref, shallowRef, onMounted, watch } from 'vue';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { inspectAcroForm } from '../logic/inspectAcroForm.js';
import { fillAcroForm } from '../logic/fillAcroForm.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import FormFieldItem from './FormFieldItem.vue';
import FormEmptyBanner from './FormEmptyBanner.vue';

const activeFile = ref(null);
let activeBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);
const currentPage = ref(1);
const canvasRef = ref(null);

const detectedFields = ref([]);
const fieldValues = ref({});
const shouldFlatten = ref(false);
const isProcessing = ref(false);
const searchQuery = ref('');

onMounted(() => {
  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => i.name?.toLowerCase().endsWith('.pdf'));
    if (candidate?.file) loadDocument(candidate.file);
  }
});

watch(() => [pdfDocProxy.value, currentPage.value], () => renderPagePreview());

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) await loadDocument(pdf);
}

async function loadDocument(file) {
  activeFile.value = file;
  isProcessing.value = true;
  detectedFields.value = [];
  fieldValues.value = {};

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    const doc = await loadPdfJsDocument(buffer);
    pdfDocProxy.value = doc;
    totalPages.value = doc.numPages;
    currentPage.value = 1;

    const fields = await inspectAcroForm(buffer);
    detectedFields.value = fields;
    const values = {};
    for (const f of fields) {
      values[f.name] = f.value;
    }
    fieldValues.value = values;
  } catch (err) {
    showToast('Gagal memuat formulir: ' + (err.message || ''), 'error');
    resetFile();
  } finally {
    isProcessing.value = false;
  }
}

async function renderPagePreview() {
  if (!pdfDocProxy.value || !canvasRef.value) return;
  try {
    const rawDoc = unwrapPdfProxy(pdfDocProxy.value);
    const page = await rawDoc.getPage(currentPage.value);
    const viewport = page.getViewport({ scale: 0.8 });
    const canvas = canvasRef.value;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
  } catch (err) {
    console.warn('Gagal render preview:', err);
  }
}

function resetFile() {
  activeFile.value = null;
  activeBuffer = null;
  pdfDocProxy.value = null;
  totalPages.value = 0;
  currentPage.value = 1;
  detectedFields.value = [];
  fieldValues.value = {};
}

function filteredFields() {
  if (!searchQuery.value.trim()) return detectedFields.value;
  const q = searchQuery.value.toLowerCase();
  return detectedFields.value.filter(f => f.name.toLowerCase().includes(q));
}

async function handleSave() {
  if (!activeBuffer || !activeFile.value) return;
  isProcessing.value = true;

  try {
    const safeBuffer = new Uint8Array(activeBuffer.slice(0));
    const resultBytes = await fillAcroForm(safeBuffer, fieldValues.value, shouldFlatten.value);
    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(resultBytes, `${safeName}_filled.pdf`);
    showToast('Formulir berhasil disimpan!', 'success');
  } catch (err) {
    showToast('Gagal menyimpan formulir: ' + (err.message || ''), 'error');
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Isi Formulir
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Deteksi dan isi bidang formulir AcroForm interaktif (teks, centang, pilihan) dengan opsi mengunci data (flattening).
      </p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-3 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ totalPages }} halaman • {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB</p>
        </div>
        <button
          type="button"
          class="text-xs font-bold px-3 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
          @click="resetFile"
        >
          Ganti File
        </button>
      </BaseCard>

      <!-- If no fields detected -->
      <FormEmptyBanner v-if="!isProcessing && detectedFields.length === 0" />

      <!-- If fields detected -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Form Inputs -->
        <div class="lg:col-span-7 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold uppercase tracking-wider text-ink">
              {{ detectedFields.length }} Field Formulir Terdeteksi
            </span>
            <input
              v-if="detectedFields.length > 4"
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama field..."
              class="text-xs font-medium px-2 py-1 border-2 border-ink bg-paper shadow-hard-sm w-44 focus:outline-none"
            />
          </div>

          <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            <FormFieldItem
              v-for="f in filteredFields()"
              :key="f.name"
              :field="f"
              :model-value="fieldValues[f.name]"
              @update:model-value="val => fieldValues[f.name] = val"
            />
          </div>

          <div class="border-t-2 border-ink pt-4 space-y-3">
            <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
              <input
                v-model="shouldFlatten"
                type="checkbox"
                class="w-4 h-4 border-2 border-ink rounded accent-accent cursor-pointer"
              />
              <span>Ratakan formulir (Flatten: kunci isian agar tidak dapat diedit lagi)</span>
            </label>

            <BaseButton
              variant="primary"
              class="w-full py-2.5 text-xs tracking-wider"
              :disabled="isProcessing"
              @click="handleSave"
            >
              {{ isProcessing ? 'Menyimpan Formulir...' : '💾 Simpan PDF Terisi' }}
            </BaseButton>
          </div>
        </div>

        <!-- Right Column: Page Preview -->
        <div class="lg:col-span-5 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-ink">
              Pratinjau Dokumen (Hal {{ currentPage }} dari {{ totalPages }})
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                :disabled="currentPage <= 1"
                class="px-2 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
                @click="currentPage--"
              >
                ◀
              </button>
              <button
                type="button"
                :disabled="currentPage >= totalPages"
                class="px-2 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
                @click="currentPage++"
              >
                ▶
              </button>
            </div>
          </div>

          <div class="flex justify-center p-3 border-2 border-ink bg-paper-dark overflow-auto max-h-[520px]">
            <canvas ref="canvasRef" class="border-2 border-ink bg-white shadow-hard max-w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
