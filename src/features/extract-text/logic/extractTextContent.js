/**
 * Extract clean text preserving layout and natural reading order
 * @param {object} pdfDocProxy PDF.js DocumentProxy
 * @param {boolean} [includeSeparators=true]
 * @param {Function} [onProgress]
 * @returns {Promise<{ fullText: string, pageTexts: string[], wordCount: number, charCount: number, isScanned: boolean }>}
 */
export async function extractTextContent(pdfDocProxy, includeSeparators = true, onProgress = null) {
  const numPages = pdfDocProxy.numPages;
  const pageTexts = [];
  let totalChars = 0;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocProxy.getPage(i);
    const content = await page.getTextContent();
    const items = content.items || [];

    if (items.length === 0) {
      pageTexts.push('');
      continue;
    }

    const sorted = [...items].sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      const yDiff = Math.abs(yA - yB);
      if (yDiff > 4) {
        return yB - yA;
      }
      return a.transform[4] - b.transform[4];
    });

    const lines = [];
    let currentLine = [];
    let lastY = null;

    for (const item of sorted) {
      const y = item.transform[5];
      if (lastY === null || Math.abs(y - lastY) > 4) {
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        currentLine = [item.str];
        lastY = y;
      } else {
        currentLine.push(item.str);
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    const pageStr = lines.join('\n').trim();
    totalChars += pageStr.length;
    pageTexts.push(pageStr);

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100));
    }
  }

  let fullText = '';
  if (includeSeparators) {
    fullText = pageTexts.map((txt, idx) => `--- Halaman ${idx + 1} ---\n${txt}`).join('\n\n');
  } else {
    fullText = pageTexts.join('\n\n');
  }

  const cleanWords = fullText.trim().split(/\s+/).filter(Boolean);
  const wordCount = cleanWords.length;
  const charCount = fullText.length;
  const isScanned = totalChars < 30 && numPages >= 1;

  return {
    fullText,
    pageTexts,
    wordCount,
    charCount,
    isScanned
  };
}
