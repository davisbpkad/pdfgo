/**
 * form.js - Isi Formulir Module (AcroForm Interactive Field Filler & Flattener)
 * Detects AcroForm fields (text, checkbox, dropdown, radio), maps them to reactive inputs,
 * and allows saving with optional form flattening.
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'form';
export const titleKey = 'tools.form.title';
export const descKey = 'tools.form.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`;

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Inspect a PDF for AcroForm fields
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @returns {Promise<Array<{ name: string, type: string, value: any, options?: string[] }>>}
 */
export async function inspectAcroForm(srcBuffer) {
  const pdfDoc = await PDFDocument.load(srcBuffer, { ignoreEncryption: true });
  let form;
  try {
    form = pdfDoc.getForm();
  } catch (e) {
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

/**
 * Fill AcroForm fields and optionally flatten the document
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {Record<string, any>} fieldValues
 * @param {boolean} [flatten=false]
 * @returns {Promise<Uint8Array>}
 */
export async function fillAcroForm(srcBuffer, fieldValues, flatten = false) {
  const pdfDoc = await PDFDocument.load(srcBuffer);
  const form = pdfDoc.getForm();

  for (const [name, val] of Object.entries(fieldValues)) {
    try {
      const field = form.getField(name);
      if (field instanceof PDFTextField) {
        field.setText(String(val || ''));
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

// ============================================================================
// UI Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let activeBuffer = null;
let pdfDocProxy = null;
let detectedFields = [];
let fieldValues = {};
let shouldFlatten = false;
let isProcessing = false;

export function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;

  if (ctx && ctx.queue && !activeFile) {
    const queuePdf = ctx.queue.getItems().find(i => i.name.toLowerCase().endsWith('.pdf'));
    if (queuePdf) {
      loadDocument(queuePdf.file);
    }
  }

  render();
}

export function onFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) {
    loadDocument(pdf);
  }
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
  activeFile = null;
  activeBuffer = null;
  pdfDocProxy = null;
  detectedFields = [];
  fieldValues = {};
  isProcessing = false;
}

async function loadDocument(file) {
  activeFile = file;
  isProcessing = true;
  render();

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    pdfDocProxy = await loadPdfJsDocument(buffer);

    detectedFields = await inspectAcroForm(buffer);
    fieldValues = {};
    for (const f of detectedFields) {
      fieldValues[f.name] = f.value;
    }
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal membaca formulir: ' + (err.message || ''), 'error');
  } finally {
    isProcessing = false;
    render();
    renderPagePreview();
  }
}

async function renderPagePreview() {
  if (!pdfDocProxy) return;
  const previewBox = document.getElementById('form-page-preview-box');
  if (!previewBox) return;

  try {
    const { canvas } = await renderPageToCanvas(pdfDocProxy, 1, 0.7);
    previewBox.innerHTML = '';
    previewBox.appendChild(canvas);
  } catch (e) {
    console.warn('Preview error:', e);
  }
}

async function handleSaveForm() {
  if (!activeBuffer || !activeFile) return;

  isProcessing = true;
  render();

  try {
    const resultBytes = await fillAcroForm(activeBuffer, fieldValues, shouldFlatten);
    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_filled.pdf`;
    downloadFile(resultBytes, filename);

    if (activeCtx) activeCtx.showToast('Formulir berhasil disimpan!', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal menyimpan formulir', 'error');
  } finally {
    isProcessing = false;
    render();
    renderPagePreview();
  }
}

function render() {
  if (!activeContainer) return;

  if (!activeFile && !isProcessing) {
    activeContainer.innerHTML = `
      <div class="tool-workspace">
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; margin: 0 auto 1rem; color: var(--accent-primary); background: var(--accent-primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${icon}
          </div>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${t('tools.form.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.form.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  if (isProcessing) {
    activeContainer.innerHTML = `
      <div class="tool-workspace" style="text-align: center; padding: 3rem 1rem;">
        <p style="font-weight: 600;">Memeriksa field formulir interaktif...</p>
      </div>
    `;
    return;
  }

  // If NO fields detected
  if (detectedFields.length === 0) {
    activeContainer.innerHTML = `
      <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="background-color: var(--bg-subtle); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1.5rem; text-align: center;">
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${t('tools.form.noFieldsTitle')}
          </h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto 1.25rem;">
            ${t('tools.form.noFieldsDesc')}
          </p>
          <button class="btn-upload" onclick="window.location.hash='sign'">
            ${t('tools.form.openSign')}
          </button>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <!-- Left Column: Form Fields Inputs -->
        <div style="flex: 1.2; min-width: 320px; display: flex; flex-direction: column; gap: 1rem;">
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">
            ${t('tools.form.fieldsFound', { count: detectedFields.length })}
          </div>

          <div class="form-fields-grid" id="form-inputs-container">
            ${detectedFields.map((field, idx) => `
              <div class="form-field-card">
                <label class="form-label" for="field-input-${idx}">${field.name}</label>
                ${field.type === 'checkbox' ? `
                  <label style="display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="checkbox" id="field-input-${idx}" data-name="${field.name}" ${fieldValues[field.name] ? 'checked' : ''} />
                    <span>Centang</span>
                  </label>
                ` : field.type === 'select' || field.type === 'radio' ? `
                  <select id="field-input-${idx}" data-name="${field.name}" class="form-select">
                    ${field.options.map(opt => `
                      <option value="${opt}" ${fieldValues[field.name] === opt ? 'selected' : ''}>${opt}</option>
                    `).join('')}
                  </select>
                ` : `
                  <input type="text" id="field-input-${idx}" data-name="${field.name}" class="form-control" value="${fieldValues[field.name] || ''}" />
                `}
              </div>
            `).join('')}
          </div>

          <!-- Flatten Option -->
          <div style="padding-top: 0.5rem; border-top: 1px solid var(--border-light);">
            <label style="display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; cursor: pointer;">
              <input type="checkbox" id="chk-form-flatten" ${shouldFlatten ? 'checked' : ''} />
              <span>${t('tools.form.flattenLabel')}</span>
            </label>
          </div>

          <button class="btn-upload" id="btn-save-acroform" style="width: 100%; justify-content: center; margin-top: 0.5rem;" ${isProcessing ? 'disabled' : ''}>
            ${t('tools.form.saveForm')}
          </button>
        </div>

        <!-- Right Column: Page Preview -->
        <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column;">
          <label class="form-label" style="margin-bottom: 0.4rem;">Pratinjau Halaman:</label>
          <div class="preview-canvas-container" id="form-page-preview-box">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Memuat pratinjau...</span>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  const inputs = activeContainer.querySelectorAll('#form-inputs-container input, #form-inputs-container select');
  inputs.forEach(input => {
    const name = input.getAttribute('data-name');
    input.addEventListener('input', (e) => {
      if (input.type === 'checkbox') {
        fieldValues[name] = input.checked;
      } else {
        fieldValues[name] = input.value;
      }
    });
  });

  document.getElementById('chk-form-flatten')?.addEventListener('change', (e) => {
    shouldFlatten = e.target.checked;
  });

  document.getElementById('btn-save-acroform')?.addEventListener('click', handleSaveForm);
}
