# PDF to Word: positioned offline layout

## Scope

Preserve report page geometry, cover images, table borders, charts, and editable PDF text without a backend. Derived from the user's seven-page BPKAD HaDE report. Source documents remain outside the repository.

Text uses fixed Word paragraph frames, not reflowing paragraphs or native Word tables. Graphics render separately with PDF text-painting operators filtered out, preventing a second raster copy of editable text. Each PDF page becomes a Word section with its own dimensions.

## RED / GREEN evidence

- RED: `node --test tests/unit/pdf-to-word.test.mjs` initially failed both new layout and bold-text tests. The old converter emitted default A4 dimensions and merged headings, body text, cells, and footer into one paragraph.
- GREEN: the same target passes after replacing the conversion path. Eight tests now cover layout, typography, font families, text readability, graphics, encoding failure, progress, and canvas cleanup.
- No checkpoint commits were created; changes remain available for user review.

| Guarantee | Test | Result |
| --- | --- | --- |
| PDF dimensions, including mixed page sizes, survive conversion | `pdf-to-word.test.mjs`: preserves page sizes | PASS |
| Heading, body, cell, and footer positions remain distinct | Same test, checks nine frames and no guessed tables | PASS |
| Font metadata identifies bold text rather than opaque font IDs | `pdf-to-word.test.mjs`: positioned text retains font style | PASS |
| Graphics remain visible without raster text duplication | Unit canvas-path test and browser layout test | PASS |
| Image encoding failure rejects instead of silently losing content | Unit canvas-encoding failure test | PASS |
| Browser defaults to preserving graphics and uses no external HTTP requests | `workflows-convert.spec.mjs`: offline conversion keeps cover | PASS |

## Verification

- `npm run build`: both standalone variants built; existing PDF.js bundling warnings remain. Build's zero-network checks passed.
- `npm test`: 142 tests passed, including the font-family and canvas regressions.
- `npx playwright test tests/e2e/workflows-convert.spec.mjs --grep 'pdf to word'`: 2 tests passed.
- `node --test --experimental-test-coverage --test-coverage-include='src/features/pdf-to-word/logic/convertPdfToWord.js' tests/unit/pdf-to-word.test.mjs`: 8 tests passed; converter line coverage 100%, function coverage 100%, branch coverage 80.95%.
- Actual report conversion in Chromium: seven sections, 480 editable text frames, six unique embedded PNGs after package deduplication, no page errors, no external HTTP requests.
- Opened the generated DOCX in installed Microsoft Word and exported it to a temporary PDF. Word reports seven pages. Inspected rendered pages 1, 2, 3, 5, and 7: cover, separate headings, three-column matrix, survey table, chart, footer, and signature visual are present.
- `git diff --check`: passed.

## Limits

Longer edits can overflow frames; text does not automatically flow between frames. Table borders and chart shapes are raster graphics, not native Word objects. Scanned text remains an image without OCR. Fonts can be substituted. General rotated/vertical text, special text colors, and text clipping are not validated by this report fixture. The Word export does not retain the PDF's cryptographic signature.
