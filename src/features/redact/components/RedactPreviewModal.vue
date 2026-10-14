<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { renderPageToCanvas } from '../../../core/pdf.js';
import { renderRedactionBoxes } from '../logic/renderRedactionBoxes.js';

const props = defineProps({
  show: { type: Boolean, default: false },
  pdfDocProxy: { type: Object, default: null },
  boxesByPage: { type: Object, default: () => ({}) },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 }
});

const emit = defineEmits(['close', 'update:currentPage']);

const previewCanvasRef = ref(null);
const isLoading = ref(false);

watch(() => [props.show, props.currentPage, props.boxesByPage], () => {
  if (props.show) renderHighResPreview();
});

onMounted(() => {
  window.addEventListener('keydown', handleKey);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey);
});

function handleKey(e) {
  if (!props.show) return;
  if (e.key === 'Escape') {
    emit('close');
  }
}

async function renderHighResPreview() {
  if (!props.pdfDocProxy || !previewCanvasRef.value) return;
  isLoading.value = true;
  try {
    const scale = 2.0;
    const pageBoxes = props.boxesByPage[props.currentPage - 1] || [];
    const { canvas: tempCanvas } = await renderPageToCanvas(props.pdfDocProxy, props.currentPage, scale);
    const targetCanvas = previewCanvasRef.value;
    targetCanvas.width = tempCanvas.width;
    targetCanvas.height = tempCanvas.height;

    const ctx = targetCanvas.getContext('2d');
    ctx.drawImage(tempCanvas, 0, 0);

    // Apply solid black rasterized redaction boxes
    renderRedactionBoxes(ctx, pageBoxes, targetCanvas.width, targetCanvas.height, scale);

    tempCanvas.width = 0;
    tempCanvas.height = 0;
  } catch (err) {
    console.warn('Gagal merender pratinjau resolusi tinggi:', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="border-2 border-ink bg-paper rounded-sm shadow-hard-lg max-w-4xl w-full p-4 space-y-4 max-h-[90vh] flex flex-col select-none">
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b-2 border-ink pb-3">
        <div>
          <h2 class="font-display font-extrabold text-lg md:text-xl uppercase tracking-tight text-ink flex items-center gap-2">
            <span>🛡️</span>
            <span>Periksa Hasil Sensor (Resolusi Tinggi)</span>
          </h2>
          <p class="text-xs text-ink/80 font-medium">
            Pratinjau raster murni. Pastikan seluruh teks dan data sensitif tertutup sempurna sebelum menerapkan sensor permanen.
          </p>
        </div>
        <button
          type="button"
          class="px-3.5 py-1.5 text-xs font-bold border-2 border-ink bg-paper hover:bg-neutral-100 dark:hover:bg-neutral-700 text-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150"
          @click="$emit('close')"
        >
          ✕ Tutup
        </button>
      </div>

      <!-- Navigation & Page Status -->
      <div class="flex items-center justify-between text-xs font-bold bg-paper-dark p-2 border border-ink rounded-sm shadow-[1px_1px_0_0_#000000]">
        <span>Halaman {{ currentPage }} dari {{ totalPages }}</span>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="currentPage <= 1 || isLoading"
            class="px-2.5 py-1 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer transition-all duration-150"
            @click="$emit('update:currentPage', currentPage - 1)"
          >
            ◀ Sebelumnya
          </button>
          <button
            type="button"
            :disabled="currentPage >= totalPages || isLoading"
            class="px-2.5 py-1 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer transition-all duration-150"
            @click="$emit('update:currentPage', currentPage + 1)"
          >
            Berikutnya ▶
          </button>
        </div>
      </div>

      <!-- High-res Canvas Area -->
      <div class="flex-1 overflow-auto border-2 border-ink bg-paper-dark rounded-sm p-4 flex items-center justify-center min-h-[300px]">
        <div v-if="isLoading" class="text-sm font-bold text-ink">
          Mempertajam pratinjau resolusi tinggi...
        </div>
        <canvas
          v-show="!isLoading"
          ref="previewCanvasRef"
          class="border border-ink shadow-hard rounded-xs max-w-full h-auto bg-white"
        />
      </div>

      <!-- Footer Buttons -->
      <div class="flex justify-end gap-2 pt-2 border-t border-ink">
        <button
          type="button"
          class="px-4 py-2 text-xs font-bold border-2 border-ink bg-accent text-black hover:bg-accent-strong rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150"
          @click="$emit('close')"
        >
          ✓ Selesai Memeriksa
        </button>
      </div>
    </div>
  </div>
</template>
