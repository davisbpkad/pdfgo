<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { convertImageToPngBuffer } from '../logic/convertImageToPngBuffer.js';
import { buildPdfFromImages } from '../logic/buildPdfFromImages.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import ImageOptionsBar from './ImageOptionsBar.vue';
import ImageCard from './ImageCard.vue';

const imageList = ref([]);
const pageSize = ref('A4');
const orientation = ref('auto');
const margin = ref(20);
const fitMode = ref('contain');

const isConverting = ref(false);
const progressValue = ref(0);
let draggedIdx = null;

onMounted(() => {
  if (queueState.value?.items?.length) {
    const images = queueState.value.items
      .filter(i => /\.(png|jpe?g|webp)$/i.test(i.name))
      .map(i => i.file);
    if (images.length > 0) handleIncomingFiles(images);
  }
});

async function handleIncomingFiles(files) {
  const validFiles = Array.from(files).filter(f => /\.(png|jpe?g|webp)$/i.test(f.name));
  if (validFiles.length === 0) return;

  for (const file of validFiles) {
    const item = {
      id: `img_${Math.random().toString(36).substring(2, 8)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'image/png',
      buffer: null,
      thumbUrl: URL.createObjectURL(file)
    };

    imageList.value.push(item);

    try {
      if (file.type.includes('webp') || file.name.toLowerCase().endsWith('.webp')) {
        item.buffer = await convertImageToPngBuffer(file);
        item.type = 'image/png';
      } else {
        item.buffer = await file.arrayBuffer();
      }
    } catch (e) {
      // Buffer load error
    }
  }
}

function removeImage(idx) {
  const [removed] = imageList.value.splice(idx, 1);
  if (removed?.thumbUrl) URL.revokeObjectURL(removed.thumbUrl);
}

function clearAll() {
  imageList.value.forEach(img => {
    if (img.thumbUrl) URL.revokeObjectURL(img.thumbUrl);
  });
  imageList.value = [];
}

// Leaving the tool must not keep every image blob alive for the rest of the session.
onUnmounted(() => {
  imageList.value.forEach(img => {
    if (img.thumbUrl) URL.revokeObjectURL(img.thumbUrl);
  });
});

function onDragStart(idx) {
  draggedIdx = idx;
}

function onDrop(targetIdx) {
  if (draggedIdx === null || draggedIdx === targetIdx) return;
  const [moved] = imageList.value.splice(draggedIdx, 1);
  imageList.value.splice(targetIdx, 0, moved);
  draggedIdx = null;
}

async function handleGenerate() {
  if (imageList.value.length === 0) return;
  isConverting.value = true;
  progressValue.value = 10;

  try {
    const items = imageList.value.map(item => ({
      buffer: item.buffer,
      type: item.type
    }));

    const pdfBytes = await buildPdfFromImages(items, {
      pageSize: pageSize.value,
      orientation: orientation.value,
      margin: margin.value,
      fitMode: fitMode.value
    }, (pct) => {
      progressValue.value = pct;
    });

    const filename = `PDFToolkit_Images_${Date.now()}.pdf`;
    downloadFile(pdfBytes, filename);
    showToast('Dokumen PDF dari gambar berhasil dibuat!', 'success');
  } catch (err) {
    showToast(err.message || 'Gagal membuat PDF', 'error');
  } finally {
    isConverting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Gambar ke PDF
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Ubah koleksi foto, tangkapan layar, atau scan gambar menjadi dokumen PDF terstruktur rapi.
      </p>
    </div>

    <DropZone
      accept="image/png,image/jpeg,image/webp"
      label="Tarik & lepas file gambar (PNG, JPG, WebP) ke sini"
      @files="handleIncomingFiles"
    />

    <div v-if="imageList.length > 0" class="space-y-4">
      <ImageOptionsBar
        v-model:page-size="pageSize"
        v-model:orientation="orientation"
        v-model:margin="margin"
        v-model:fit-mode="fitMode"
      />

      <div class="flex items-center justify-between">
        <span class="font-bold text-sm text-ink uppercase tracking-wider">
          Urutan Gambar ({{ imageList.length }} Berkas)
        </span>
        <button
          type="button"
          class="text-xs font-bold text-danger hover:underline cursor-pointer"
          @click="clearAll"
        >
          Kosongkan Semua
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <ImageCard
          v-for="(img, idx) in imageList"
          :key="img.id"
          :image="img"
          :index="idx"
          @remove="removeImage"
          @drag-start="onDragStart"
          @drop-image="onDrop"
        />
      </div>

      <BaseProgressBar v-if="isConverting" :progress="progressValue" label="Mengonversi gambar ke PDF..." />

      <div class="flex justify-end pt-2">
        <BaseButton
          variant="primary"
          class="text-base py-3 px-8 w-full sm:w-auto"
          :disabled="isConverting || imageList.length === 0"
          :loading="isConverting"
          @click="handleGenerate"
        >
          {{ `Buat PDF (${imageList.length} Gambar)` }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
