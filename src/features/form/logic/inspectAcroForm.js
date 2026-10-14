import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } from 'pdf-lib';

/**
 * Inspect a PDF for AcroForm fields
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @returns {Promise<Array<{ name: string, type: string, value: any, options?: string[] }>>}
 */
export async function inspectAcroForm(srcBuffer) {
  let safeBuffer;
  if (srcBuffer instanceof Uint8Array) {
    safeBuffer = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safeBuffer = new Uint8Array(srcBuffer.slice(0));
  } else {
    safeBuffer = srcBuffer;
  }

  const pdfDoc = await PDFDocument.load(safeBuffer, { ignoreEncryption: true });
  let form;
  try {
    form = pdfDoc.getForm();
  } catch (_) {
    return [];
  }

  const fields = form.getFields();
  const result = [];

  for (const field of fields) {
    const name = field.getName();
    let type = 'text';
    let value = '';
    let options = [];

    if (field instanceof PDFTextField) {
      type = 'text';
      try { value = field.getText() || ''; } catch (_) {}
    } else if (field instanceof PDFCheckBox) {
      type = 'checkbox';
      try { value = field.isChecked(); } catch (_) {}
    } else if (field instanceof PDFDropdown) {
      type = 'select';
      try {
        options = field.getOptions();
        value = field.getSelected()[0] || '';
      } catch (_) {}
    } else if (field instanceof PDFRadioGroup) {
      type = 'radio';
      try {
        options = field.getOptions();
        value = field.getSelected() || '';
      } catch (_) {}
    } else if (field instanceof PDFOptionList) {
      type = 'select';
      try {
        options = field.getOptions();
        value = field.getSelected()[0] || '';
      } catch (_) {}
    }

    result.push({ name, type, value, options });
  }

  return result;
}
