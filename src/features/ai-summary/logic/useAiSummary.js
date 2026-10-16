import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { downloadFile } from '../../../core/download.js';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { extractTextContent } from '../../extract-text/logic/extractTextContent.js';
import { createMarkdownExport, createTextExport, createPdfExport } from './exportAiResult.js';

/** Read a PDF and return its extractable text. Injectable so the load order is testable. */
async function defaultLoadText(file, onProgress) {
  const buffer = await file.arrayBuffer();
  const doc = await loadPdfJsDocument(new Uint8Array(buffer));
  try {
    return await extractTextContent(doc, true, onProgress);
  } finally {
    await doc.destroy();
  }
}

export function useAiSummary({ loadText = defaultLoadText } = {}) {
  const activeFile = ref(null);
  const isExtracting = ref(false);
  const progressVal = ref(0);
  const extractedText = ref('');
  const selectedTask = ref('summarize');
  const targetLanguage = ref('Bahasa Indonesia');
  const customInstruction = ref('');
  const pastedAiResult = ref('');
  const isExporting = ref(false);
  let loadToken = 0;

  async function loadDocument(file) {
    resetState();
    activeFile.value = file;
    isExtracting.value = true;
    progressVal.value = 20;
    const token = ++loadToken;

    try {
      const res = await loadText(file, (pct) => {
        if (token !== loadToken) return;
        progressVal.value = 20 + Math.round(pct * 0.8);
      });
      if (token !== loadToken) return; // a newer document was loaded meanwhile
      extractedText.value = res.fullText || '';
      if (!extractedText.value) {
        showToast(t('tools.aiSummary.noTextWarning'), 'warning');
      }
    } catch (err) {
      if (token !== loadToken) return;
      showToast(err.message || 'Gagal mengekstrak teks PDF.', 'error');
    } finally {
      if (token === loadToken) isExtracting.value = false;
    }
  }

  async function handleCopyPrompt(promptText) {
    try {
      await navigator.clipboard.writeText(promptText);
      showToast(t('tools.aiSummary.copiedToast'), 'success');
    } catch (err) {
      showToast('Gagal menyalin otomatis. Silakan salin secara manual.', 'warning');
    }
  }

  async function handleExportFormat(format) {
    if (!pastedAiResult.value.trim() || !activeFile.value) return;
    isExporting.value = true;
    try {
      let out;
      if (format === 'md') out = createMarkdownExport(pastedAiResult.value, activeFile.value.name);
      else if (format === 'txt') out = createTextExport(pastedAiResult.value, activeFile.value.name);
      else if (format === 'pdf') out = await createPdfExport(pastedAiResult.value, activeFile.value.name);
      if (out) downloadFile(out.content, out.fileName, out.mime);
    } catch (err) {
      showToast(err.message || 'Gagal mengekspor hasil.', 'error');
    } finally {
      isExporting.value = false;
    }
  }

  function resetState() {
    activeFile.value = null;
    extractedText.value = '';
    pastedAiResult.value = '';
    isExtracting.value = false;
    progressVal.value = 0;
  }

  return {
    activeFile, isExtracting, progressVal, extractedText,
    selectedTask, targetLanguage, customInstruction, pastedAiResult, isExporting,
    loadDocument, handleCopyPrompt, handleExportFormat, resetState
  };
}
