/**
 * download.js - Client-Side File Saver with Memory Hygiene
 * Revokes Blob URLs after trigger to prevent memory leaks in long sessions.
 */

/**
 * Trigger download of a Blob or Uint8Array
 * @param {Blob | Uint8Array} data
 * @param {string} filename
 * @param {string} [mimeType='application/pdf']
 */
export function downloadFile(data, filename, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup after browser processes download
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 2000);
}
