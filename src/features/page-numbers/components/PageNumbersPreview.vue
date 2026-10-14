<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { renderPageToCanvas, unwrapPdfProxy } from '../../../core/pdf.js';
import PreviewViewport from '../../../ui/PreviewViewport.vue';

const props = defineProps({
  pdfDocProxy: { type: Object, default: null },
  format: { type: String, default: 'Halaman {n} dari {total}' },
  position: { type: String, default: 'bottom-center' },
  startNumber: { type: Number, default: 1 },
  margin: { type: Number, default: 25 },
  fontSize: { type: Number, default: 10 },
  colorHex: { type: String, default: '#475569' },
  skipFirstPage: { type: Boolean, default: false },
  totalPages: { type: Number, default: 1 }
});

const previewPage = ref(1);
const pageDimensionsPt = ref({ width: 595.28, height: 841.89 });
const canvasRef = ref(null);
const isRendering = ref(false);
const currentScale = ref(1.0);

const totalPagesCount = computed(() => props.totalPages || props.pdfDocProxy?.numPages || 1);

watch(() => [props.pdfDocProxy, previewPage.value], async () => {
  if (props.pdfDocProxy) {
    try {
      const rawDoc = unwrapPdfProxy(props.pdfDocProxy);
      const page = await rawDoc.getPage(previewPage.value);
      const vp = page.getViewport({ scale: 1.0 });
      pageDimensionsPt.value = { width: vp.width, height: vp.height };
    } catch (_) {}
  }
});

async function renderPreview(scale = currentScale.value) {
  if (!props.pdfDocProxy || !canvasRef.value) return;
  currentScale.value = scale;
  isRendering.value = true;

  try {
    const pageNum = Math.max(1, Math.min(totalPagesCount.value, previewPage.value));
    const { canvas: renderedPage } = await renderPageToCanvas(props.pdfDocProxy, pageNum, scale);
    const targetCanvas = canvasRef.value;
    targetCanvas.width = renderedPage.width;
    targetCanvas.height = renderedPage.height;

    const ctx = targetCanvas.getContext('2d');
    ctx.drawImage(renderedPage, 0, 0);

    // If skipFirstPage is enabled and this is page 1, don't stamp page number
    const isSkipped = props.skipFirstPage && pageNum === 1;

    if (!isSkipped) {
      const effectiveTotal = (props.skipFirstPage && totalPagesCount.value > 1)
        ? totalPagesCount.value - 1
        : totalPagesCount.value;

      const pageOffset = (props.skipFirstPage && pageNum > 1) ? pageNum - 2 : pageNum - 1;
      const currentNumber = props.startNumber + pageOffset;

      const text = props.format
        .replace(/\{n\}/g, String(currentNumber))
        .replace(/\{total\}/g, String(effectiveTotal));

      ctx.save();
      ctx.font = `${props.fontSize * scale}px Atkinson Hyperlegible, sans-serif`;
      ctx.fillStyle = props.colorHex;

      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = props.fontSize * scale;
      const scaledMargin = props.margin * scale;

      let x = scaledMargin;
      if (props.position.includes('center')) {
        x = (targetCanvas.width - textW) / 2;
      } else if (props.position.includes('right')) {
        x = targetCanvas.width - scaledMargin - textW;
      }

      let y = targetCanvas.height - scaledMargin;
      if (props.position.startsWith('top')) {
        y = scaledMargin + textH;
      } else if (props.position.startsWith('middle')) {
        y = (targetCanvas.height + textH) / 2;
      }

      ctx.fillText(text, x, y);
      ctx.restore();
    }

    renderedPage.width = 0;
    renderedPage.height = 0;
  } catch (e) {
    console.warn('Gagal merender pratinjau nomor halaman:', e);
  } finally {
    isRendering.value = false;
  }
}

watch(() => [
  props.pdfDocProxy,
  props.format,
  props.position,
  props.startNumber,
  props.margin,
  props.fontSize,
  props.colorHex,
  props.skipFirstPage,
  props.totalPages,
  previewPage.value
], () => {
  renderPreview(currentScale.value);
}, { deep: true });

onMounted(() => {
  renderPreview(1.0);
});
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-3">
    <!-- Header with Page Navigation -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2">
      <div class="text-xs font-black uppercase tracking-tight text-ink flex items-center gap-1.5">
        <span>Pratinjau Nomor Halaman</span>
        <span v-if="skipFirstPage && previewPage === 1" class="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 border border-ink">
          Cover Dilewati
        </span>
      </div>

      <!-- Page Selector -->
      <div class="flex items-center gap-1.5 text-xs font-bold">
        <button
          type="button"
          :disabled="previewPage <= 1"
          class="px-2 py-0.5 border border-ink bg-white hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
          @click="previewPage--"
        >
          ◀
        </button>
        <span class="flex items-center gap-1">
          <span>Hal</span>
          <input
            v-model.number="previewPage"
            type="number"
            min="1"
            :max="totalPagesCount"
            class="w-12 p-0.5 text-center font-mono border border-ink bg-white shadow-hard-sm focus:outline-none"
          />
          <span>dari {{ totalPagesCount }}</span>
        </span>
        <button
          type="button"
          :disabled="previewPage >= totalPagesCount"
          class="px-2 py-0.5 border border-ink bg-white hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
          @click="previewPage++"
        >
          ▶
        </button>
      </div>
    </div>

    <!-- Viewport Container with Zoom & Pan -->
    <PreviewViewport
      :page-width-pt="pageDimensionsPt.width"
      :page-height-pt="pageDimensionsPt.height"
      :is-rendering="isRendering"
      v-slot="{ effectiveScale }"
      @update:effective-scale="renderPreview"
    >
      <div class="inline-block border-2 border-ink bg-white shadow-hard-sm">
        <canvas ref="canvasRef" class="block max-w-full h-auto" />
      </div>
    </PreviewViewport>
  </div>
</template>
