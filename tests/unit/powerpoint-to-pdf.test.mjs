/**
 * powerpoint-to-pdf.test.mjs - Unit tests for PowerPoint (PPTX) to PDF conversion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import pptxgen from 'pptxgenjs';
import { PDFDocument } from 'pdf-lib';
import { emuToPt, ptToEmu, EMU_PER_PT } from '../../src/features/powerpoint-to-pdf/logic/emuToPt.js';
import {
  parsePresentationDimensions,
  parseSlideElements,
  parseSlideRels
} from '../../src/features/powerpoint-to-pdf/logic/parseSlideXml.js';
import { convertPptxToPdf } from '../../src/features/powerpoint-to-pdf/logic/convertPptxToPdf.js';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../src/core/pdf.js';

test('powerpoint-to-pdf: emuToPt converts EMUs to PDF points correctly', () => {
  assert.equal(EMU_PER_PT, 12700);
  assert.equal(emuToPt(12700), 1);
  assert.equal(emuToPt(914400), 72);
  assert.equal(ptToEmu(72), 914400);

  // 16:9 widescreen dimensions
  assert.equal(emuToPt(9144000), 720);
  assert.equal(emuToPt(5143500), 405);

  assert.equal(emuToPt(0), 0);
  assert.equal(emuToPt('invalid'), 0);
  assert.equal(emuToPt(NaN), 0);
});

test('powerpoint-to-pdf: parseSlideXml parses dimensions, rels, and shapes from sample XML', () => {
  // Test dimensions parsing
  const presXml = '<p:presentation><p:sldSz cx="9144000" cy="5143500"/></p:presentation>';
  const dims = parsePresentationDimensions(presXml);
  assert.equal(dims.widthPt, 720);
  assert.equal(dims.heightPt, 405);

  // Test rels parsing
  const relsXml = '<Relationships><Relationship Id="rId1" Target="../media/image1.png"/></Relationships>';
  const rels = parseSlideRels(relsXml);
  assert.equal(rels['rId1'], 'ppt/media/image1.png');

  // Test slide element parsing with sample XML
  const sampleSlideXml = `
    <p:sld>
      <p:cSld>
        <p:spTree>
          <p:sp>
            <p:spPr>
              <a:xfrm><a:off x="914400" y="914400"/><a:ext cx="4572000" cy="914400"/></a:xfrm>
            </p:spPr>
            <p:txBody>
              <a:p>
                <a:r>
                  <a:rPr sz="2400" b="1">
                    <a:solidFill><a:srgbClr val="0000FF"/></a:solidFill>
                  </a:rPr>
                  <a:t>Pengantar Presentasi</a:t>
                </a:r>
              </a:p>
            </p:txBody>
          </p:sp>
          <p:pic>
            <p:spPr>
              <a:xfrm><a:off x="914400" y="2743200"/><a:ext cx="1828800" cy="1828800"/></a:xfrm>
            </p:spPr>
            <p:blipFill><a:blip r:embed="rId1"/></p:blipFill>
          </p:pic>
        </p:spTree>
      </p:cSld>
    </p:sld>
  `;

  const elements = parseSlideElements(sampleSlideXml);
  assert.equal(elements.length, 2);

  const textEl = elements[0];
  assert.equal(textEl.type, 'text');
  assert.equal(textEl.xPt, 72);
  assert.equal(textEl.yPt, 72);
  assert.equal(textEl.widthPt, 360);
  assert.equal(textEl.heightPt, 72);
  assert.equal(textEl.textRuns[0].text, 'Pengantar Presentasi');
  assert.equal(textEl.textRuns[0].fontSize, 24);
  assert.equal(textEl.textRuns[0].isBold, true);
  assert.equal(textEl.textRuns[0].color, '#0000FF');

  const picEl = elements[1];
  assert.equal(picEl.type, 'picture');
  assert.equal(picEl.relId, 'rId1');
});

test('powerpoint-to-pdf: integration test - converts PPTX into readable PDF', async () => {
  const PptxGen = pptxgen.default || pptxgen;
  const pres = new PptxGen();
  const slide = pres.addSlide();
  slide.addText('Slide Uji Konversi', { x: 1, y: 1, w: 6, h: 1, fontSize: 20 });
  const pptxBuffer = await pres.write({ outputType: 'uint8array' });

  const { pdfBytes, slideCount } = await convertPptxToPdf(pptxBuffer);
  assert.equal(slideCount, 1);
  assert.ok(pdfBytes instanceof Uint8Array);

  // Load with pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);
  assert.equal(pdfDoc.getPageCount(), 1);

  // Verify text content with PDF.js
  const rawDoc = await loadPdfJsDocument(pdfBytes);
  const doc = unwrapPdfProxy(rawDoc);
  const p1 = await doc.getPage(1);
  const textContent = await p1.getTextContent();
  const allText = textContent.items.map((i) => i.str).join(' ');
  assert.ok(allText.includes('Slide Uji Konversi'));
});
