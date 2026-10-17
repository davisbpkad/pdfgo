<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queue, queueState } from '../../../app/providers/queue.js';
import { activeToolId } from '../../../app/router.js';
import { ensureBuiltinModelsLoaded, getAvailableOcrLangs } from '../../../core/assets.js';
import { terminateOcrWorker } from '../../ocr/logic/ocrWorkerManager.js';
import { extractTextContent } from '../logic/extractTextContent.js';
import { extractTextFromImage, extractTextFromScannedPdf } from '../logic/extractTextFromImage.js';
import { isImageFile, isImageName } from '../logic/isImageFile.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import ExtractStatsBar from './ExtractStatsBar.vue';
import ExtractScannedBanner from './ExtractScannedBanner.vue';

const activeFile = ref(null);
const isImage = ref(false);
const imagePreviewUrl = ref('');
let pdfDocProxy = null;
const totalPages = ref(0);

const extractedData = ref(null);
const editableText = ref('');
const includeSeparators = ref(true);

const isExtracting = ref(false);
const progressValue = ref(0);
const progressLabel = ref(t('tools.extractText.extracting'));
const cancelRef = ref({ value: false });

const availableLangs = ref(['ind']);
const selectedLang = ref('ind');

onMounted(async () => {
  await ensureBuiltinModelsLoaded();
  await refreshAvailableLangs();

  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => {
      const name = i.name?.toLowerCase() || '';
      return name.endsWith('.pdf') || isImageName(name) || i.file?.type?.startsWith('image/');
    });
    if (candidate?.file) loadDocument(candidate.file);
  }
});

onUnmounted(() => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
});

async function refreshAvailableLangs() {
  const langs = await getAvailableOcrLangs();
  if (langs && langs.length > 0) {
    availableLangs.value = langs;
    if (langs.includes('ind')) selectedLang.value = 'ind';
    else selectedLang.value = langs[0];
  }
}

async function handleIncomingFiles(files) {
  const file = Array.from(files).find(f => {
    const name = f.name.toLowerCase();
    return name.endsWith('.pdf') || isImageName(name) || f.type.startsWith('image/');
  });
  if (file) await loadDocument(file);
}

async function loadDocument(file) {
  resetFile();
  activeFile.value = file;
  isExtracting.value = true;
  progressValue.value = 10;
  cancelRef.value.value = false;

  const imgCheck = isImageFile(file);
  isImage.value = imgCheck;

  if (imgCheck) {
    // Process image file directly via OCR
    totalPages.value = 1;
    imagePreviewUrl.value = URL.createObjectURL(file);
    progressLabel.value = t('tools.extractText.recognizingImage');

    try {
      await ensureBuiltinModelsLoaded();
      await refreshAvailableLangs();

      if (availableLangs.value.length === 0) {
        showToast(t('tools.extractText.modelNotLoaded'), 'warning');
        isExtracting.value = false;
        return;
      }

      const ocrResult = await extractTextFromImage(file, {
        lang: selectedLang.value,
        onProgress: (pct) => {
          progressValue.value = Math.max(10, Math.min(95, pct));
        },
        cancelRef: cancelRef.value
      });

      const fullText = (ocrResult.text || '').trim();
      const cleanWords = fullText.split(/\s+/).filter(Boolean);

      extractedData.value = {
        fullText,
        pageTexts: [fullText],
        wordCount: cleanWords.length,
        charCount: fullText.length,
        isScanned: false
      };
      editableText.value = fullText;
      progressValue.value = 100;

      if (!fullText) {
        showToast(t('tools.extractText.noTextInImage'), 'info');
      } else {
        showToast(t('tools.extractText.imageExtractSuccess'), 'success');
      }
    } catch (err) {
      if (!cancelRef.value.value) {
        showToast(t('tools.extractText.imageExtractFailed') + (err.message || ''), 'error');
      }
    } finally {
      isExtracting.value = false;
    }
  } else {
    // Process PDF document
    progressLabel.value = t('tools.extractText.extractingPdf');
    try {
      const buffer = await file.arrayBuffer();
      pdfDocProxy = await loadPdfJsDocument(buffer);
      totalPages.value = pdfDocProxy.numPages;

      const data = await extractTextContent(pdfDocProxy, includeSeparators.value, (pct) => {
        progressValue.value = pct;
      });

      extractedData.value = data;
      editableText.value = data.fullText;
      progressValue.value = 100;

      if (data.isScanned) {
        showToast(t('tools.extractText.scannedWarning'), 'info');
      }
    } catch (err) {
      showToast(t('tools.extractText.pdfExtractFailed') + (err.message || ''), 'error');
      resetFile();
    } finally {
      isExtracting.value = false;
    }
  }
}

async function handleExtractScannedWithOcr() {
  if (!pdfDocProxy) return;

  isExtracting.value = true;
  progressValue.value = 5;
  progressLabel.value = t('tools.extractText.recognizingPagesOcr');
  cancelRef.value.value = false;

  try {
    await ensureBuiltinModelsLoaded();
    await refreshAvailableLangs();

    if (availableLangs.value.length === 0) {
      showToast(t('tools.extractText.modelNotLoadedOcr'), 'warning');
      return;
    }

    const ocrData = await extractTextFromScannedPdf(pdfDocProxy, {
      lang: selectedLang.value,
      includeSeparators: includeSeparators.value,
      onProgress: (current, total, pct) => {
        progressValue.value = pct;
        progressLabel.value = t('tools.extractText.recognizingPageProgress', { current, total, pct });
      },
      cancelRef: cancelRef.value
    });

    extractedData.value = ocrData;
    editableText.value = ocrData.fullText;
    showToast(t('tools.extractText.docExtractSuccess'), 'success');
  } catch (err) {
    if (!cancelRef.value.value) {
      showToast(t('tools.extractText.ocrFailed') + (err.message || ''), 'error');
    }
  } finally {
    isExtracting.value = false;
  }
}

async function rescanImage() {
  if (!activeFile.value || !isImage.value) return;
  await loadDocument(activeFile.value);
}

function cancelExtraction() {
  cancelRef.value.value = true;
  isExtracting.value = false;
  terminateOcrWorker();
  showToast(t('tools.extractText.cancelled'), 'info');
}

async function onSeparatorsChange(val) {
  includeSeparators.value = val;
  if (pdfDocProxy && !isImage.value) {
    isExtracting.value = true;
    const data = await extractTextContent(pdfDocProxy, val);
    extractedData.value = data;
    editableText.value = data.fullText;
    isExtracting.value = false;
  }
}

function resetFile() {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value);
    imagePreviewUrl.value = '';
  }
  activeFile.value = null;
  isImage.value = false;
  pdfDocProxy = null;
  totalPages.value = 0;
  extractedData.value = null;
  editableText.value = '';
}

function handleCopy() {
  if (!editableText.value) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(editableText.value).then(() => {
      showToast(t('tools.extractText.copied'), 'success');
    });
  }
}

function handleDownloadTxt() {
  if (!editableText.value || !activeFile.value) return;
  const blob = new Blob([editableText.value], { type: 'text/plain;charset=utf-8' });
  const safeName = activeFile.value.name.replace(/\.[^.]+$/i, '');
  downloadFile(blob, `${safeName}_teks.txt`, 'text/plain');
  showToast(t('tools.extractText.downloadSuccess'), 'success');
}

function openOcr() {
  if (activeFile.value) {
    queue.addFiles([activeFile.value]);
  }
  activeToolId.value = 'ocr';
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        {{ t('tools.extractText.title') }}
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        {{ t('tools.extractText.desc') }}
      </p>
    </div>

    <DropZone
      v-if="!activeFile"
      accept=".pdf,image/png,image/jpeg,image/webp,image/bmp,.jpg,.jpeg,.png,.webp,.bmp"
      @files="handleIncomingFiles"
    >
      <div class="space-y-1">
        <span class="font-bold text-base md:text-lg text-ink">
          {{ t('dropzone.pdfOrImage') }}
        </span>
        <p class="text-xs text-ink/70 font-medium">{{ t('dropzone.subtitle') }}</p>
      </div>
    </DropZone>

    <div v-else class="space-y-4">
      <BaseCard class="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <!-- Thumbnail preview for image or icon for PDF -->
          <div
            v-if="isImage && imagePreviewUrl"
            class="w-12 h-12 shrink-0 border-2 border-ink bg-paper-dark rounded-xs overflow-hidden shadow-hard-sm"
          >
            <img :src="imagePreviewUrl" alt="Thumbnail" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-12 h-12 shrink-0 border-2 border-ink bg-accent text-black font-display font-black text-xs flex items-center justify-center rounded-xs shadow-hard-sm"
          >
            PDF
          </div>

          <div class="min-w-0">
            <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
            <p class="text-xs text-ink/70">
              <span v-if="isImage" class="inline-flex items-center gap-1 font-bold text-accent-2 bg-black px-1.5 py-0.2 rounded-xs">{{ t('tools.extractText.imageBadge') }}</span>
              <span v-else>{{ t('common.pagesCount', { count: totalPages }) }}</span>
              • {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-center">
          <!-- Re-scan button for images with language toggle -->
          <div v-if="isImage" class="inline-flex border-2 border-ink bg-paper divide-x-2 divide-ink shadow-hard-sm">
            <button
              type="button"
              class="px-2 py-1 text-xs font-bold transition-colors cursor-pointer"
              :class="selectedLang === 'ind' ? 'bg-accent text-black' : 'bg-paper text-ink hover:bg-paper-dark'"
              @click="selectedLang = 'ind'; rescanImage();"
            >
              🇮🇩 ID
            </button>
            <button
              type="button"
              class="px-2 py-1 text-xs font-bold transition-colors cursor-pointer"
              :class="selectedLang === 'eng' ? 'bg-accent text-black' : 'bg-paper text-ink hover:bg-paper-dark'"
              @click="selectedLang = 'eng'; rescanImage();"
            >
              🇬🇧 EN
            </button>
            <button
              v-if="availableLangs.includes('ind') && availableLangs.includes('eng')"
              type="button"
              class="px-2 py-1 text-xs font-bold transition-colors cursor-pointer"
              :class="selectedLang === 'ind+eng' ? 'bg-accent text-black' : 'bg-paper text-ink hover:bg-paper-dark'"
              @click="selectedLang = 'ind+eng'; rescanImage();"
            >
              ID+EN
            </button>
          </div>

          <button
            type="button"
            class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            @click="resetFile"
          >
            {{ t('common.changeFile') }}
          </button>
        </div>
      </BaseCard>

      <!-- Progress Bar -->
      <div v-if="isExtracting" class="space-y-2">
        <BaseProgressBar :progress="progressValue" :label="progressLabel" />
        <div class="flex justify-end">
          <button
            type="button"
            class="text-xs font-bold px-3 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
            @click="cancelExtraction"
          >{{ t('common.cancel') }}</button>
        </div>
      </div>

      <template v-if="extractedData && !isExtracting">
        <!-- Scanned PDF Alert Banner with Direct OCR Extraction -->
        <ExtractScannedBanner
          v-if="!isImage"
          :is-scanned="extractedData.isScanned"
          :is-extracting="isExtracting"
          :selected-lang="selectedLang"
          :available-langs="availableLangs"
          @update:selected-lang="selectedLang = $event"
          @start-ocr="handleExtractScannedWithOcr"
          @open-ocr="openOcr"
        />

        <ExtractStatsBar
          :word-count="extractedData.wordCount"
          :char-count="extractedData.charCount"
          :page-count="extractedData.pageTexts.length"
          :include-separators="includeSeparators"
          @update:include-separators="onSeparatorsChange"
        />

        <textarea
          v-model="editableText"
          rows="14"
          spellcheck="false"
          class="w-full p-4 border-3 border-ink bg-paper text-ink font-mono text-xs leading-relaxed focus:outline-none shadow-hard-sm"
          :placeholder="t('tools.extractText.editorPlaceholder')"
        />

        <div class="flex justify-end gap-3 pt-1">
          <BaseButton variant="secondary" class="text-xs py-2 px-4 shadow-hard-sm" @click="handleCopy">
            📋 {{ t('tools.extractText.copyText') }}
          </BaseButton>

          <BaseButton variant="primary" class="text-xs py-2 px-6 shadow-hard-sm" @click="handleDownloadTxt">
            💾 {{ t('tools.extractText.downloadTxt') }}
          </BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>
