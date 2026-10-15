<script setup>
import { ref } from 'vue';
import { activeToolId } from './app/router.js';
import AppHeader from './ui/AppHeader.vue';
import AppSidebar from './ui/AppSidebar.vue';
import QueueDrawer from './ui/QueueDrawer.vue';
import ToastHost from './ui/ToastHost.vue';
import MergeTool from './features/merge/components/MergeTool.vue';
import SplitTool from './features/split/components/SplitTool.vue';
import OrganizeTool from './features/organize/components/OrganizeTool.vue';
import WatermarkTool from './features/watermark/components/WatermarkTool.vue';
import PageNumbersTool from './features/page-numbers/components/PageNumbersTool.vue';
import CompressTool from './features/compress/components/CompressTool.vue';
import ImageToPdfTool from './features/image-to-pdf/components/ImageToPdfTool.vue';
import PdfToImageTool from './features/pdf-to-image/components/PdfToImageTool.vue';
import ExtractTextTool from './features/extract-text/components/ExtractTextTool.vue';
import SignTool from './features/sign/components/SignTool.vue';
import FormTool from './features/form/components/FormTool.vue';
import RedactTool from './features/redact/components/RedactTool.vue';
import OcrTool from './features/ocr/components/OcrTool.vue';
import UnlockTool from './features/unlock/components/UnlockTool.vue';
import ProtectTool from './features/protect/components/ProtectTool.vue';
import PdfToMarkdownTool from './features/pdf-to-markdown/components/PdfToMarkdownTool.vue';
import ScanToPdfTool from './features/scan-to-pdf/components/ScanToPdfTool.vue';
import HtmlToPdfTool from './features/html-to-pdf/components/HtmlToPdfTool.vue';
import PdfToWordTool from './features/pdf-to-word/components/PdfToWordTool.vue';
import PdfToPowerpointTool from './features/pdf-to-powerpoint/components/PdfToPowerpointTool.vue';
import ExcelToPdfTool from './features/excel-to-pdf/components/ExcelToPdfTool.vue';
import WordToPdfTool from './features/word-to-pdf/components/WordToPdfTool.vue';
import EditPdfTool from './features/edit-pdf/components/EditPdfTool.vue';
import PptxToPdfTool from './features/powerpoint-to-pdf/components/PptxToPdfTool.vue';
import PdfToExcelTool from './features/pdf-to-excel/components/PdfToExcelTool.vue';
import AiSummaryTool from './features/ai-summary/components/AiSummaryTool.vue';

const isSidebarOpen = ref(false);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar() {
  isSidebarOpen.value = false;
}
</script>

<template>
  <div class="h-screen h-[100dvh] max-h-screen overflow-hidden bg-paper-dark text-ink flex flex-col font-ui antialiased selection:bg-accent selection:text-black">
    <!-- Header (fixed at top) -->
    <AppHeader class="shrink-0" @toggle-sidebar="toggleSidebar" />

    <!-- Main Workspace (Sidebar + Outlet) -->
    <div class="flex-1 flex overflow-hidden min-h-0 relative">
      <!-- Sidebar Navigation (Independent scroll) -->
      <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />

      <!-- Tool Workspace Outlet (Independent scroll with overscroll-contain) -->
      <main class="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 max-w-5xl mx-auto w-full">
        <!-- Native Vue 3 Tools (All 13 Tools Native) -->
        <MergeTool v-if="activeToolId === 'merge'" />
        <SplitTool v-else-if="activeToolId === 'split'" />
        <OrganizeTool v-else-if="activeToolId === 'organize'" />
        <WatermarkTool v-else-if="activeToolId === 'watermark'" />
        <PageNumbersTool v-else-if="activeToolId === 'page-numbers'" />
        <CompressTool v-else-if="activeToolId === 'compress'" />
        <ImageToPdfTool v-else-if="activeToolId === 'image-to-pdf'" />
        <PdfToImageTool v-else-if="activeToolId === 'pdf-to-image'" />
        <ExtractTextTool v-else-if="activeToolId === 'extract-text'" />
        <SignTool v-else-if="activeToolId === 'sign'" />
        <FormTool v-else-if="activeToolId === 'form'" />
        <RedactTool v-else-if="activeToolId === 'redact'" />
        <OcrTool v-else-if="activeToolId === 'ocr'" />
        <UnlockTool v-else-if="activeToolId === 'unlock'" />
        <ProtectTool v-else-if="activeToolId === 'protect'" />
        <PdfToMarkdownTool v-else-if="activeToolId === 'pdf-to-markdown'" />
        <ScanToPdfTool v-else-if="activeToolId === 'scan-to-pdf'" />
        <HtmlToPdfTool v-else-if="activeToolId === 'html-to-pdf'" />
        <PdfToWordTool v-else-if="activeToolId === 'pdf-to-word'" />
        <PdfToPowerpointTool v-else-if="activeToolId === 'pdf-to-powerpoint'" />
        <ExcelToPdfTool v-else-if="activeToolId === 'excel-to-pdf'" />
        <WordToPdfTool v-else-if="activeToolId === 'word-to-pdf'" />
        <EditPdfTool v-else-if="activeToolId === 'edit-pdf'" />
        <PptxToPdfTool v-else-if="activeToolId === 'powerpoint-to-pdf'" />
        <PdfToExcelTool v-else-if="activeToolId === 'pdf-to-excel'" />
        <AiSummaryTool v-else-if="activeToolId === 'ai-summary'" />

        <!-- Fallback if route invalid -->
        <div v-else class="border-2 border-ink bg-paper p-8 text-center shadow-hard rounded-sm space-y-2">
          <h2 class="font-display font-black text-xl text-ink uppercase">Alat Tidak Ditemukan</h2>
          <p class="text-xs text-ink/70">Silakan pilih salah satu alat dari menu bilah samping.</p>
        </div>
      </main>
    </div>

    <!-- Drawers & Overlays -->
    <QueueDrawer />
    <ToastHost />
  </div>
</template>
