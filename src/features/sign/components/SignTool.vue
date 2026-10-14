<script setup>
import { ref, onMounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { applySignatures } from '../logic/applySignatures.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import SignDrawPad from './SignDrawPad.vue';
import SignTypePad from './SignTypePad.vue';
import SignUploadPad from './SignUploadPad.vue';
import SignPlacementCanvas from './SignPlacementCanvas.vue';

const activeFile = ref(null);
let activeBuffer = null;
const pdfDocProxy = ref(null);
const totalPages = ref(0);
const currentPage = ref(1);

const activeTab = ref('draw');
const signatureUrl = ref(null);
const applyTarget = ref('current');
const isSaving = ref(false);

const placement = ref({ x: 50, y: 50, width: 140, height: 70 });
const canvasDims = ref({ width: 600, height: 800 });

onMounted(() => {
  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => i.name?.toLowerCase().endsWith('.pdf'));
    if (candidate?.file) loadDocument(candidate.file);
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
  } catch (err) {
    showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
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
  showToast('Tanda tangan siap ditempatkan pada dokumen.', 'info');
}

function onCanvasRendered(dims) {
  canvasDims.value = dims;
}

async function handleSave() {
  if (!activeBuffer || !signatureUrl.value) {
    showToast('Pilih tanda tangan terlebih dahulu.', 'error');
    return;
  }

  isSaving.value = true;
  try {
    const resp = await fetch(signatureUrl.value);
    const signBuffer = await resp.arrayBuffer();

    const pageProxy = await pdfDocProxy.value.getPage(currentPage.value);
    const unscaledViewport = pageProxy.getViewport({ scale: 1.0 });
    const pdfW = unscaledViewport.width;
    const pdfH = unscaledViewport.height;

    const scaleX = pdfW / (canvasDims.value.width || pdfW);
    const scaleY = pdfH / (canvasDims.value.height || pdfH);

    const pdfX = placement.value.x * scaleX;
    const pdfY = pdfH - (placement.value.y + placement.value.height) * scaleY;
    const boxW = placement.value.width * scaleX;
    const boxH = placement.value.height * scaleY;

    const placements = [];
    if (applyTarget.value === 'all') {
      for (let i = 0; i < totalPages.value; i++) {
        placements.push({ pageIndex: i, x: pdfX, y: pdfY, width: boxW, height: boxH });
      }
    } else {
      placements.push({ pageIndex: currentPage.value - 1, x: pdfX, y: pdfY, width: boxW, height: boxH });
    }

    const safeBytes = new Uint8Array(activeBuffer.slice(0));
    const resultBytes = await applySignatures(safeBytes, signBuffer, placements);
    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(resultBytes, `${safeName}_signed.pdf`);
    showToast('Dokumen berhasil ditandatangani!', 'success');
  } catch (err) {
    showToast('Gagal menandatangani PDF: ' + (err.message || ''), 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Tanda Tangan Digital
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Tambahkan tanda tangan gambar tangan, ketikan kursif, atau unggahan berkas ke halaman PDF secara presisi.
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

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Panel: Signature Creator -->
        <div class="lg:col-span-5 space-y-4">
          <div class="flex border-2 border-ink bg-paper shadow-hard-sm">
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold border-r-2 border-ink transition-colors cursor-pointer"
              :class="activeTab === 'draw' ? 'bg-accent text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
              @click="activeTab = 'draw'"
            >
              ✏️ Gambar
            </button>
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold border-r-2 border-ink transition-colors cursor-pointer"
              :class="activeTab === 'type' ? 'bg-accent text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
              @click="activeTab = 'type'"
            >
              ⌨️ Ketik
            </button>
            <button
              type="button"
              class="flex-1 py-2 text-xs font-bold transition-colors cursor-pointer"
              :class="activeTab === 'upload' ? 'bg-accent text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
              @click="activeTab = 'upload'"
            >
              📁 Unggah
            </button>
          </div>

          <SignDrawPad v-if="activeTab === 'draw'" @use-signature="onSignatureSelected" />
          <SignTypePad v-else-if="activeTab === 'type'" @use-signature="onSignatureSelected" />
          <SignUploadPad v-else-if="activeTab === 'upload'" @use-signature="onSignatureSelected" />

          <div class="border-t-2 border-ink pt-4 space-y-3">
            <div class="space-y-1">
              <label class="text-xs font-bold text-ink uppercase tracking-wider block">Terapkan Ke Halaman:</label>
              <select
                v-model="applyTarget"
                class="w-full text-xs font-bold p-2 border-2 border-ink bg-paper shadow-hard-sm cursor-pointer focus:outline-none"
              >
                <option value="current">Halaman Ini Saja (Hal {{ currentPage }})</option>
                <option value="all">Semua Halaman ({{ totalPages }} Halaman)</option>
              </select>
            </div>

            <BaseButton
              variant="primary"
              class="w-full py-2.5 text-xs tracking-wider"
              :disabled="!signatureUrl || isSaving"
              @click="handleSave"
            >
              {{ isSaving ? 'Menyimpan PDF...' : '💾 Simpan PDF Bertanda Tangan' }}
            </BaseButton>
          </div>
        </div>

        <!-- Right Panel: Page Placement Preview -->
        <div class="lg:col-span-7 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-ink">
              Pratinjau & Penempatan (Hal {{ currentPage }} dari {{ totalPages }})
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

          <div class="flex justify-center p-4 border-2 border-ink bg-paper-dark overflow-auto max-h-[640px]">
            <SignPlacementCanvas
              :pdf-doc-proxy="pdfDocProxy"
              :current-page="currentPage"
              :signature-url="signatureUrl"
              :placement="placement"
              @update:placement="val => placement = val"
              @rendered="onCanvasRendered"
            />
          </div>

          <p class="text-xs text-ink/70 text-center font-medium">
            💡 Seret kotak tanda tangan untuk memindahkan posisinya, dan gunakan kotak sudut kanan bawah untuk mengubah ukuran.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
