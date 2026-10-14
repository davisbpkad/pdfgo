<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { moduleMap } from '../modules/index.js';
import { queue, openQueueDrawer } from '../app/providers/queue.js';
import { t, getLang } from '../app/providers/i18n.js';
import { showToast } from '../app/providers/toast.js';

const props = defineProps({
  toolId: {
    type: String,
    required: true
  }
});

const containerRef = ref(null);
let activeMod = null;

function mountModule(id) {
  if (activeMod && typeof activeMod.destroy === 'function') {
    try { activeMod.destroy(); } catch (e) {}
  }

  activeMod = moduleMap.get(id);
  if (!activeMod || !containerRef.value) return;

  const ctx = {
    queue,
    t,
    getLang,
    showToast,
    openQueueDrawer
  };

  containerRef.value.innerHTML = '';
  activeMod.init(containerRef.value, ctx);
}

onMounted(() => {
  mountModule(props.toolId);
});

watch(() => props.toolId, (newId) => {
  mountModule(newId);
});

onUnmounted(() => {
  if (activeMod && typeof activeMod.destroy === 'function') {
    try { activeMod.destroy(); } catch (e) {}
  }
});
</script>

<template>
  <div class="space-y-4">
    <div ref="containerRef" id="module-container" class="space-y-4" />
  </div>
</template>
