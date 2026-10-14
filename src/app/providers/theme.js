import { ref } from 'vue';
import { getTheme, setTheme as setCoreTheme, subscribeTheme } from '../../core/theme.js';

export const theme = ref(getTheme());

subscribeTheme((newTheme) => {
  theme.value = newTheme;
});

export function setTheme(newTheme) {
  setCoreTheme(newTheme);
  theme.value = newTheme;
}

export function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark';
  setTheme(next);
}
