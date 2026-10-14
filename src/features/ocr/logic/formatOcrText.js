import { t } from '../../../core/i18n.js';

/**
 * Format recognized OCR page results into full text and statistics
 * @param {Array<{ pageIndex: number, text: string, words: Array<{ text: string, confidence: number }> }>} pageResults
 * @param {{ includeSeparators?: boolean }} [options]
 * @returns {{ fullText: string, totalWords: number, totalChars: number, avgConfidence: number }}
 */
export function formatOcrText(pageResults, { includeSeparators = true } = {}) {
  let fullText = '';
  let totalWords = 0;
  let totalChars = 0;
  let confidenceSum = 0;
  let wordCountWithConfidence = 0;

  for (let i = 0; i < pageResults.length; i++) {
    const item = pageResults[i];
    const pageNum = item.pageIndex + 1;
    const cleanText = (item.text || '').trim();

    if (includeSeparators && pageResults.length > 1) {
      if (fullText) fullText += '\n\n';
      fullText += `--- ${t('tools.split.summaryPage', { n: pageNum })} ---\n`;
    } else if (fullText && cleanText) {
      fullText += '\n\n';
    }

    fullText += cleanText;

    if (item.words && Array.isArray(item.words)) {
      for (const w of item.words) {
        if (!w.text || !w.text.trim()) continue;
        totalWords++;
        totalChars += w.text.trim().length;
        if (typeof w.confidence === 'number' && w.confidence > 0) {
          confidenceSum += w.confidence;
          wordCountWithConfidence++;
        }
      }
    } else if (cleanText) {
      const words = cleanText.split(/\s+/).filter(Boolean);
      totalWords += words.length;
      totalChars += cleanText.length;
    }
  }

  const avgConfidence = wordCountWithConfidence > 0
    ? Math.round(confidenceSum / wordCountWithConfidence)
    : 90;

  return {
    fullText,
    totalWords,
    totalChars,
    avgConfidence
  };
}
