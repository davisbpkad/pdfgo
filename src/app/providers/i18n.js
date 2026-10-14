import { ref } from 'vue';
import { getLang as getCoreLang, setLang as setCoreLang, subscribeLang, t as coreT } from '../../core/i18n.js';

export const currentLang = ref(getCoreLang());

subscribeLang((newLang) => {
  currentLang.value = newLang;
});

export function getLang() {
  return currentLang.value;
}

export function setLang(lang) {
  setCoreLang(lang);
  currentLang.value = lang;
}

export function toggleLang() {
  const next = currentLang.value === 'id' ? 'en' : 'id';
  setLang(next);
}

export function t(key, params = {}) {
  // Reading currentLang.value creates reactivity dependency in Vue templates
  const _ = currentLang.value;
  return coreT(key, params);
}
