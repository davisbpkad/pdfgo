import { ref } from 'vue';
import { queue as coreQueue } from '../../core/queue.js';

export const queueState = ref(coreQueue.getState());
export const queueDrawerOpen = ref(false);

coreQueue.subscribe((state) => {
  queueState.value = state;
});

export function toggleQueueDrawer() {
  queueDrawerOpen.value = !queueDrawerOpen.value;
}

export function openQueueDrawer() {
  queueDrawerOpen.value = true;
}

export function closeQueueDrawer() {
  queueDrawerOpen.value = false;
}

/**
 * Attach a tool's output to the queued file it came from, so the queue drawer
 * can offer the per-file and batch (ZIP) downloads.
 * @param {File} file source file that was loaded from the queue
 * @param {Uint8Array|Blob} result processed output
 * @param {string} [mime]
 */
export function publishQueueResult(file, result, mime = 'application/pdf') {
  if (!file || !result) return;
  const item = coreQueue.getItems().find(
    (i) => i.file === file || (i.name === file.name && i.size === file.size)
  );
  if (!item) return;
  const blob = result instanceof Blob ? result : new Blob([result], { type: mime });
  coreQueue.updateItem(item.id, { status: 'done', progress: 100, result: blob });
}

export { coreQueue as queue };
