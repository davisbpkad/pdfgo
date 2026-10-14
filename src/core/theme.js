/**
 * theme.js - Client-Side Theme Engine (Light / Dark / Auto)
 * Adheres to prefers-color-scheme and persists user preference in localStorage.
 */

const STORAGE_KEY = 'pdfgo_theme';
let currentTheme = 'auto'; // 'auto' | 'light' | 'dark'
const listeners = new Set();

try {
  const params = new URLSearchParams(window.location.search || (window.location.hash ? window.location.hash.substring(1) : ''));
  const urlTheme = params.get('theme');
  if (urlTheme && ['auto', 'light', 'dark'].includes(urlTheme)) {
    currentTheme = urlTheme;
  } else {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'auto' || saved === 'light' || saved === 'dark')) {
      currentTheme = saved;
    }
  }
} catch (e) {}

const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function applyTheme() {
  const root = document.documentElement;
  let effective = currentTheme;
  if (currentTheme === 'auto') {
    effective = (mediaQuery && mediaQuery.matches) ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', effective);

  listeners.forEach((cb) => {
    try {
      cb(currentTheme, effective);
    } catch (err) {
      console.error('Error in theme listener:', err);
    }
  });
}

if (mediaQuery) {
  mediaQuery.addEventListener('change', () => {
    if (currentTheme === 'auto') {
      applyTheme();
    }
  });
}

export function initTheme() {
  applyTheme();
}

export function getTheme() {
  return currentTheme;
}

export function setTheme(theme) {
  if (theme !== 'auto' && theme !== 'light' && theme !== 'dark') return;
  currentTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {}
  applyTheme();
}

export function cycleTheme() {
  if (currentTheme === 'auto') setTheme('light');
  else if (currentTheme === 'light') setTheme('dark');
  else setTheme('auto');
  return currentTheme;
}

export function subscribeTheme(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
