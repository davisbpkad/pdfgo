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
import LegacyToolWrapper from './ui/LegacyToolWrapper.vue';

const isSidebarOpen = ref(false);

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar() {
  isSidebarOpen.value = false;
}
</script>

<template>
  <div class="min-h-screen bg-paper text-ink flex flex-col font-ui antialiased">
    <!-- Header -->
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <!-- Main Workspace (Sidebar + Outlet) -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Sidebar Navigation -->
      <AppSidebar :is-open="isSidebarOpen" @close="closeSidebar" />

      <!-- Tool Workspace Outlet -->
      <main class="flex-1 overflow-y-auto p-4 md:p-8 max-w-5xl mx-auto w-full">
        <!-- Native Vue 3 Tools -->
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

        <!-- Other Tools (via Coexistence Wrapper until ported) -->
        <LegacyToolWrapper v-else :tool-id="activeToolId" />
      </main>
    </div>

    <!-- Drawers & Overlays -->
    <QueueDrawer />
    <ToastHost />
  </div>
</template>
