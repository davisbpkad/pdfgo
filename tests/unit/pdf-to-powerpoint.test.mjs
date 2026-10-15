/**
 * pdf-to-powerpoint.test.mjs - Unit tests for PDF to PowerPoint (PPTX) conversion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import pptxgen from 'pptxgenjs';
import * as fflate from 'fflate';
import { ptToEmu, emuToPt, ptToInches, inchesToPt, EMU_PER_PT, PT_PER_INCH } from '../../src/features/pdf-to-powerpoint/logic/ptToEmu.js';
import { buildSlidePlan } from '../../src/features/pdf-to-powerpoint/logic/buildSlidePlan.js';

test('pdf-to-powerpoint: ptToEmu and unit conversion utilities', () => {
  // Constant checks
  assert.equal(EMU_PER_PT, 12700);
  assert.equal(PT_PER_INCH, 72);

  // Conversion checks
  assert.equal(ptToEmu(72), 914400);
  assert.equal(emuToPt(914400), 72);
  assert.equal(ptToInches(72), 1);
  assert.equal(inchesToPt(1), 72);

  // Fractional and zero handling
  assert.equal(ptToEmu(0), 0);
  assert.equal(ptToInches(0), 0);
  assert.equal(ptToEmu('invalid'), 0);
  assert.equal(emuToPt(NaN), 0);
  assert.equal(ptToInches(null), 0);
  assert.equal(inchesToPt(undefined), 0);
});

test('pdf-to-powerpoint: buildSlidePlan handles ranges and quality scaling', () => {
  // Default: all pages, normal quality
  const planDefault = buildSlidePlan(5);
  assert.deepEqual(planDefault.selectedPages, [1, 2, 3, 4, 5]);
  assert.equal(planDefault.scale, 1.5);
  assert.equal(planDefault.totalSlides, 5);
  assert.equal(planDefault.quality, 'normal');

  // Range string '1-3, 5'
  const planRange = buildSlidePlan(5, { pageSelection: '1-3, 5', quality: 'high' });
  assert.deepEqual(planRange.selectedPages, [1, 2, 3, 5]);
  assert.equal(planRange.scale, 2.0);
  assert.equal(planRange.totalSlides, 4);
  assert.equal(planRange.quality, 'high');

  // Array selection and draft quality
  const planArray = buildSlidePlan(10, { pageSelection: [2, 4, 6], quality: 'draft' });
  assert.deepEqual(planArray.selectedPages, [2, 4, 6]);
  assert.equal(planArray.scale, 1.0);
  assert.equal(planArray.totalSlides, 3);
  assert.equal(planArray.quality, 'draft');

  // Out of bound numbers filtered
  const planOOB = buildSlidePlan(3, { pageSelection: '0, 2, 10' });
  assert.deepEqual(planOOB.selectedPages, [2]);

  // Invalid range defaults to all pages
  const planFallback = buildSlidePlan(4, { pageSelection: 'invalid' });
  assert.deepEqual(planFallback.selectedPages, [1, 2, 3, 4]);

  // Invalid totalPages throws
  assert.throws(() => buildSlidePlan(0), /Jumlah halaman/);
});

test('pdf-to-powerpoint: generates valid PPTX package with slide layout and image', async () => {
  const PptxGen = pptxgen.default || pptxgen;
  const pres = new PptxGen();

  // Define layout matching a 4:3 slide (10 x 7.5 inches)
  pres.defineLayout({ name: 'TEST_LAYOUT', width: 10, height: 7.5 });
  pres.layout = 'TEST_LAYOUT';

  const slide = pres.addSlide();
  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  slide.addImage({
    data: dummyPng,
    x: 0,
    y: 0,
    w: 10,
    h: 7.5
  });

  const buffer = await pres.write({ outputType: 'uint8array' });
  assert.ok(buffer instanceof Uint8Array);
  assert.ok(buffer.byteLength > 1000);

  // Verify PPTX is a valid Zip package by inspecting magic bytes PK\x03\x04
  assert.equal(buffer[0], 0x50);
  assert.equal(buffer[1], 0x4b);
  assert.equal(buffer[2], 0x03);
  assert.equal(buffer[3], 0x04);

  // Decompress with fflate to assert standard PPTX structure
  const unzipped = fflate.unzipSync(buffer);
  assert.ok(unzipped['[Content_Types].xml']);
  assert.ok(unzipped['ppt/presentation.xml']);
  assert.ok(unzipped['ppt/slides/slide1.xml']);
});
