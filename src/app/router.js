import { ref } from 'vue';

function getHashToolId() {
  if (typeof window === 'undefined') return 'merge';
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  return hash || 'merge';
}

export const activeToolId = ref(getHashToolId());

export function navigateTo(toolId) {
  if (!toolId) return;
  activeToolId.value = toolId;
  if (typeof window !== 'undefined') {
    window.location.hash = `#${toolId}`;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    activeToolId.value = getHashToolId();
  });
}
