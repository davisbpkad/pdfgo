/**
 * formatAiPrompt.js - Formats structured prompt for external LLMs
 */

export const TASK_TEMPLATES = {
  summarize: (fileName, text) =>
    `Berikut adalah isi dokumen yang diekstrak dari PDF "${fileName}":\n` +
    `---\n${text}\n---\n` +
    `Tolong buat ringkasan komprehensif dari dokumen di atas yang mencakup:\n` +
    `1. Ringkasan Eksekutif (1-2 paragraf)\n` +
    `2. Poin-poin Kunci & Temuan Utama\n` +
    `3. Kesimpulan & Rekomendasi`,

  translate: (fileName, text, targetLang = 'Bahasa Indonesia') =>
    `Berikut adalah isi dokumen yang diekstrak dari PDF "${fileName}":\n` +
    `---\n${text}\n---\n` +
    `Tolong terjemahkan seluruh isi dokumen di atas ke ${targetLang}.\n` +
    `Pertahankan format penomoran, struktur paragraf, dan istilah teknis penting.`,

  action_items: (fileName, text) =>
    `Berikut adalah isi dokumen yang diekstrak dari PDF "${fileName}":\n` +
    `---\n${text}\n---\n` +
    `Tolong ekstrak semua daftar tindakan (action items), tugas penting, tenggat waktu, dan penanggung jawab dari dokumen di atas dalam format tabel atau daftar berbutir.`,

  qa: (fileName, text) =>
    `Berikut adalah isi dokumen yang diekstrak dari PDF "${fileName}":\n` +
    `---\n${text}\n---\n` +
    `Berdasarkan isi dokumen di atas, tolong buat:\n` +
    `1. Inti sari pokok pembahasan utama\n` +
    `2. 5 Pertanyaan kritis beserta jawabannya yang paling relevan untuk memahami dokumen ini secara mendalam.`,

  custom: (fileName, text, _, customInstruction = '') =>
    `Berikut adalah isi dokumen yang diekstrak dari PDF "${fileName}":\n` +
    `---\n${text}\n---\n` +
    `${customInstruction || 'Analisis dokumen di atas secara mendalam.'}`
};

/**
 * Estimate approximate token count (1 token ~= 4 chars)
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Build complete AI prompt string
 * @param {object} params
 * @param {string} params.fileName
 * @param {string} params.text
 * @param {string} [params.task='summarize']
 * @param {string} [params.targetLang='Bahasa Indonesia']
 * @param {string} [params.customInstruction='']
 * @returns {string}
 */
export function buildAiPrompt({
  fileName = 'dokumen.pdf',
  text = '',
  task = 'summarize',
  targetLang = 'Bahasa Indonesia',
  customInstruction = ''
} = {}) {
  const safeText = (text || '').trim();
  const templateFn = TASK_TEMPLATES[task] || TASK_TEMPLATES.summarize;
  return templateFn(fileName, safeText, targetLang, customInstruction);
}
