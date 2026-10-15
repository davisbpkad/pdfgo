/**
 * Pure helpers for the inline "edit existing document text" feature.
 */

export const TEXT_COVER_PADDING_PT = 1.5;
export const MIN_FONT_SIZE_PT = 5;

/** Normalize line endings so comparisons ignore platform differences. */
export function normalizeEditText(text) {
  return String(text ?? '').replace(/\r\n/g, '\n');
}

/** Create an editable copy of an extracted text line. */
export function createTextEdit(line) {
  const text = normalizeEditText(line.text);
  return { ...line, text, original: normalizeEditText(line.original ?? line.text) };
}

/** Replace the typed value of an edit. */
export function applyText(edit, text) {
  return { ...edit, text: normalizeEditText(text) };
}

/** True when the user typed something different from the original text. */
export function isChanged(edit) {
  return normalizeEditText(edit.text) !== normalizeEditText(edit.original);
}

/** True when the user removed all text (cover only). */
export function isCleared(edit) {
  return isChanged(edit) && normalizeEditText(edit.text).trim().length === 0;
}

/** Count changed edits across all pages. */
export function countChanged(editsByPage) {
  return Object.values(editsByPage || {}).reduce(
    (acc, list) => acc + (list || []).filter(isChanged).length,
    0
  );
}

/** Restore one edit to its original text. */
export function resetEdit(edit) {
  return { ...edit, text: edit.original };
}

/** Restore every edit on every page. */
export function resetAll(editsByPage) {
  const next = {};
  for (const [key, list] of Object.entries(editsByPage || {})) {
    next[key] = (list || []).map(resetEdit);
  }
  return next;
}

/** Split typed text into renderable lines. */
export function splitLines(text) {
  return normalizeEditText(text).split('\n');
}

/**
 * Shrink the font size until the text fits the available width.
 * @param {(text: string, size: number) => number} measure widthOfTextAtSize provider
 */
export function fitFontSize(measure, text, maxWidth, startSize, minSize = MIN_FONT_SIZE_PT) {
  const target = Math.max(minSize, Number(startSize) || 11);
  let size = target;
  while (size > minSize && measure(text, size) > maxWidth) {
    size -= 0.5;
  }
  return Math.round(size * 10) / 10;
}
