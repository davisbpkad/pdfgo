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

export { coreQueue as queue };
