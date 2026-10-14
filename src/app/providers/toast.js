import { ref } from 'vue';

export const toasts = ref([]);

let toastCounter = 0;

export function showToast(message, type = 'info', duration = 3500) {
  const id = ++toastCounter;
  const item = { id, message, type };
  toasts.value.push(item);

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  return id;
}

export function removeToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id);
  if (idx !== -1) {
    toasts.value.splice(idx, 1);
  }
}
