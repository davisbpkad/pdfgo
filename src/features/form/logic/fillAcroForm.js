import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } from 'pdf-lib';

/**
 * Fill AcroForm fields and optionally flatten the document
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {Record<string, any>} fieldValues
 * @param {boolean} [flatten=false]
 * @returns {Promise<Uint8Array>}
 */
export async function fillAcroForm(srcBuffer, fieldValues, flatten = false) {
  let safeBuffer;
  if (srcBuffer instanceof Uint8Array) {
    safeBuffer = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safeBuffer = new Uint8Array(srcBuffer.slice(0));
  } else {
    safeBuffer = srcBuffer;
  }

  const pdfDoc = await PDFDocument.load(safeBuffer);
  const form = pdfDoc.getForm();

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField) {
        field.setText(String(val ?? ''));
      } else if (field instanceof PDFCheckBox) {
        if (val) field.check();
        else field.uncheck();
      } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup || field instanceof PDFOptionList) {
        if (val) field.select(String(val));
      }
    } catch (err) {
      console.warn(`Could not set field "${name}":`, err);
    }
  }

  if (flatten) {
    form.flatten();
  }

  return await pdfDoc.save();
}
