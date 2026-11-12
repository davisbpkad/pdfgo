<script setup>
import { ref, shallowRef, watch, onMounted } from 'vue';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { t } from '../../../app/providers/i18n.js';
import { queueState } from '../../../app/providers/queue.js';
import { toPdfRect } from '../../../core/coordinates.js';
import { applySignatures } from '../logic/applySignatures.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import SignDrawPad from './SignDrawPad.vue';
import SignTypePad from './SignTypePad.vue';
import SignUploadPad from './SignUploadPad.vue';
import SignPlacementCanvas from './SignPlacementCanvas.vue';
import SignPrecisionBar from './SignPrecisionBar.vue';
import PreviewViewport from '../../../ui/PreviewViewport.vue';

const activeFile = ref(null);
let activeBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);
const currentPage = ref(1);

const activeTab = ref('draw');
const signatureUrl = ref(null);
const applyTarget = ref('current');
const isSaving = ref(false);

const placement = ref({ x: 0.1, y: 0.1, width: 0.25, height: 0.12 });
const pageDimensionsPt = ref({ width: 595.28, height: 841.89 });

onMounted(() => {
  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => i.name?.toLowerCase().endsWith('.pdf'));
    if (candidate?.file) loadDocument(candidate.file);
  }
});

watch(() => [pdfDocProxy.value, currentPage.value], async () => {
  if (pdfDocProxy.value) {
    try {
      const rawDoc = unwrapPdfProxy(pdfDocProxy.value);
      const page = await rawDoc.getPage(currentPage.value);
      const vp = page.getViewport({ scale: 1.0 });
      pageDimensionsPt.value = { width: vp.width, height: vp.height };
    } catch (_) {}
  }
});

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) await loadDocument(pdf);
}

async function loadDocument(file) {
  activeFile.value = file;
  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    const doc = await loadPdfJsDocument(buffer);
    pdfDocProxy.value = doc;
    totalPages.value = doc.numPages;
    currentPage.value = 1;
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 1.0 });
    pageDimensionsPt.value = { width: vp.width, height: vp.height };
  } catch (err) {
    showToast(t('common.loadFailed') + (err.message || ''), 'error');
    resetFile();
  }
}

function resetFile() {
  activeFile.value = null;
  activeBuffer = null;
  pdfDocProxy.value = null;
  totalPages.value = 0;
  currentPage.value = 1;
  signatureUrl.value = null;
}

function onSignatureSelected(dataUrl) {
  signatureUrl.value = dataUrl;
  showToast(t('tools.sign.signatureReady'), 'info');
}

async function handleSave() {
  if (!activeBuffer || !signatureUrl.value) {
    showToast(t('tools.sign.selectSignatureFirst'), 'error');
    return;
  }

  isSaving.value = true;
  try {
    const resp = await fetch(signatureUrl.value);
    const signBuffer = await resp.arrayBuffer();

    const rawDoc = unwrapPdfProxy(pdfDocProxy.value);
    const placements = [];
    if (applyTarget.value === 'all') {
      for (let i = 0; i < totalPages.value; i++) {
        const pProxy = await rawDoc.getPage(i + 1);
        const vp = pProxy.getViewport({ scale: 1.0 });
        const pRect = toPdfRect(placement.value, vp.width, vp.height);
        placements.push({ pageIndex: i, x: pRect.x, y: pRect.y, width: pRect.width, height: pRect.height });
      }
    } else {
      const pageProxy = await rawDoc.getPage(currentPage.value);
      const vp = pageProxy.getViewport({ scale: 1.0 });
      const pRect = toPdfRect(placement.value, vp.width, vp.height);
      placements.push({ pageIndex: currentPage.value - 1, x: pRect.x, y: pRect.y, width: pRect.width, height: pRect.height });
    }

    const safeBytes = new Uint8Array(activeBuffer.slice(0));
    const resultBytes = await applySignatures(safeBytes, signBuffer, placements);
    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(resultBytes, `${safeName}_signed.pdf`);
    showToast(t('tools.sign.saveSuccess'), 'success');
  } catch (err) {
    showToast(t('tools.sign.saveFailed') + (err.message || ''), 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        {{ t('tools.sign.title') }}
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        {{ t('tools.sign.desc') }}
      </p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-3 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ t('common.pagesCount', { count: totalPages }) }} • {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB</p>
        </div>
        <button
          type="button"
          class="text-xs font-bold px-3 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
          @click="resetFile"
        >
          {{ t('common.changeFile') }}
        </button>
      </BaseCard>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Panel: Signature Creator -->
        <div class="lg:col-span-5 space-y-4">
          <div class="flex border-2 border-ink bg-paper shadow-hard-sm">
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold border-r-2 border-ink transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              :class="activeTab === 'draw' ? 'bg-accent text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
              @click="activeTab = 'draw'"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              {{ t('tools.sign.tabDraw') }}
            </button>
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold border-r-2 border-ink transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              :class="activeTab === 'type' ? 'bg-accent text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
              @click="activeTab = 'type'"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>
              {{ t('tools.sign.tabType') }}
            </button>
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              :class="activeTab === 'upload' ? 'bg-accent text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
              @click="activeTab = 'upload'"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {{ t('tools.sign.tabUpload') }}
            </button>
          </div>

          <SignDrawPad v-if="activeTab === 'draw'" @use-signature="onSignatureSelected" />
          <SignTypePad v-else-if="activeTab === 'type'" @use-signature="onSignatureSelected" />
          <SignUploadPad v-else-if="activeTab === 'upload'" @use-signature="onSignatureSelected" />

          <div class="border-t-2 border-ink pt-4 space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-ink uppercase tracking-wider block">{{ t('tools.sign.pageApplyLabel') }}</label>
              <select
                v-model="applyTarget"
                class="w-full text-xs font-bold p-2 border-2 border-ink bg-paper shadow-hard-sm cursor-pointer focus:outline-none"
              >
                <option value="current">{{ t('tools.sign.applyCurrent') }} (Hal {{ currentPage }})</option>
                <option value="all">{{ t('tools.sign.applyAll') }} ({{ totalPages }} {{ t('common.pages') }})</option>
              </select>
            </div>

            <BaseButton
              variant="primary"
              class="w-full py-2.5 text-xs tracking-wider"
              :disabled="!signatureUrl || isSaving"
              @click="handleSave"
            >
              <svg v-if="!isSaving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ isSaving ? t('tools.sign.saving') : t('tools.sign.saveSigned') }}
            </BaseButton>
          </div>
        </div>

        <!-- Right Panel: Page Placement Preview -->
        <div class="lg:col-span-7 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-ink">
              {{ t('tools.sign.previewPlacement', { current: currentPage, total: totalPages }) }}
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

          <PreviewViewport
            :page-width-pt="pageDimensionsPt.width"
            :page-height-pt="pageDimensionsPt.height"
            v-slot="{ effectiveScale }"
          >
            <SignPlacementCanvas
              :pdf-doc-proxy="pdfDocProxy"
              :current-page="currentPage"
              :signature-url="signatureUrl"
              :placement="placement"
              :scale="effectiveScale"
              @update:placement="val => placement = val"
            />
          </PreviewViewport>

          <!-- Precision Placement & Dimensions Bar -->
          <SignPrecisionBar
            :placement="placement"
            :page-dimensions-pt="pageDimensionsPt"
            :signature-url="signatureUrl"
            @update:placement="val => placement = val"
          />

          <p class="text-xs text-ink/70 text-center font-medium inline-flex items-center justify-center gap-1.5 w-full">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>{{ t('tools.sign.placementHint') }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>