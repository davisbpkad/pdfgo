import { sanitizeHtml } from './sanitizeHtml.js';

/**
 * Wrap sanitized HTML in a printable document with standard typography and A4 print styles
 * @param {string} rawHtml
 * @returns {string}
 */
export function buildPrintableHtml(rawHtml) {
  const cleanBody = sanitizeHtml(rawHtml);
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Dokumen PDF</title>
  <style>
    @page { size: A4; margin: 15mm; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #111111;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 { color: #000; page-break-after: avoid; }
    h1 { font-size: 20pt; margin-top: 0; }
    h2 { font-size: 15pt; }
    h3 { font-size: 12pt; }
    p { margin: 0 0 1em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1em 0; }
    tr { page-break-inside: avoid; }
    th, td { border: 1px solid #444; padding: 6px 10px; text-align: left; }
    th { background: #f0f0f0; }
    pre, code { font-family: monospace; font-size: 9.5pt; background: #f5f5f5; }
    pre { padding: 8px; border: 1px solid #ccc; overflow-x: auto; }
    img { max-width: 100%; height: auto; page-break-inside: avoid; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
${cleanBody}
</body>
</html>`;
}

/**
 * Render HTML in a hidden iframe and trigger native browser print dialog
 * @param {string} htmlContent
 */
export function printHtmlViaIframe(htmlContent) {
  if (typeof document === 'undefined') return;

  const printableHtml = buildPrintableHtml(htmlContent);
  const iframe = document.createElement('iframe');
  // No 'allow-scripts': any markup that survives sanitizing still cannot execute.
  // 'allow-same-origin' is required so the parent can call contentWindow.print().
  iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(printableHtml);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 250);
}
