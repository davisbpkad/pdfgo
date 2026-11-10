# Upload and feature regression audit

Date: 2026-11-10.

## Execution

```sh
npm run build
npm test
npx playwright test --reporter=list
```

Tests use Chromium and generated fixtures under `tests/e2e/.fixtures/`.
`helpers.mjs` now clicks the visible upload control and waits for a real
`filechooser` event before supplying files. It no longer bypasses the upload
control with `setInputFiles` for feature workflows.

## Cases applied to all 25 tools

- Positive: a visible upload control opens exactly one file chooser.
- Negative/recovery: cancel selection, then open the chooser again successfully.
- Negative: an empty session does not download a result when available output
  actions are clicked. If output actions are absent, this checks only that no
  result is available; it does not exercise a processing rejection branch.
- Feature workflows check successful processing and inspect output documents,
  except HTML/Word print workflows, which check previews and intercept `print()`.

## Feature matrix

| Feature | Positive workflow assertion | Additional negative coverage |
| --- | --- | --- |
| Merge | Two documents retain all pages | Cancel/retry; empty session |
| Split | Selected range yields one page | Invalid range |
| Organize | Rotation persists in output | Delete every page |
| Page numbers | Output contains page stamp | Cancel/retry; empty session |
| Watermark | Text appears on every page | Invalid ranges and Unicode covered by unit tests |
| Compress | Valid PDF output | Cancel/retry; empty session |
| OCR | Searchable PDF and text; queue handoff | Text PDF is not a scan |
| Extract text | Download contains source text | Cancel/retry; empty session |
| Fill form | Saved field contains supplied value | Cancel/retry; empty session |
| Image to PDF | Image yields one-page PDF | Wrong file type; early processing click |
| PDF to image | ZIP holds two valid PNG images | Cancel/retry; empty session |
| PDF to Markdown | Download contains source text | Cancel/retry; empty session |
| Scan to PDF | Image yields valid PDF | Cancel/retry; empty session |
| HTML to PDF | Imported source and print invocation | Empty source disables print |
| PDF to Word | DOCX opens and contains text | Cancel/retry; empty session |
| PDF to PowerPoint | One slide per PDF page | Cancel/retry; empty session |
| Excel to PDF | Output contains spreadsheet values | Unicode unit coverage |
| Word to PDF | Converted preview and print invocation | Cancel/retry; empty session |
| PowerPoint to PDF | Output contains slide text | Unicode unit coverage |
| PDF to Excel | Workbook opens and contains text | Invalid ranges covered by unit tests |
| Sign | Drawn signature produces PDF | Empty signature refused |
| Redact | Drawn box yields PDF | Unit tests check removed text and metadata |
| Unlock | Correct password produces readable PDF | Wrong password refused |
| Protect | Output is encrypted | Password mismatch refused |
| Edit PDF | Saved text changes; reset and page bounds | Wrong file type; empty session; unchanged save |

## Observed browser state

The interactive browser had accumulated many pending file choosers from an
older page instance. Both stale PDFGO tabs were closed. A fresh tab at
`http://localhost:3105/` opened one chooser and accepted `text.pdf` successfully.
Screenshot: `.playwright-mcp/upload-selected-proof.png`.

## Results

- Unit tests: 130 passed, 0 failed.
- Final browser run: **105 passed, 0 failed**, completed in 1.4 minutes.
  Log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/pdfgo-final-e2e.log`.
- Separate upload audit: **50 passed**, completed in 33.1 seconds.
  Interactive HTML report: `playwright-report/index.html`.
- An intermediate run failed because the new test helper used a wrongly scoped
  descendant locator, then hit its command timeout. The locator was fixed;
  the final 105-test run above uses the corrected helper. No app check was
  removed or changed into a skip to obtain that result.

## Limits

This is not exhaustive testing of every option or malformed document. Real OS
file dialog appearance, hardware camera capture, Safari/Firefox, large files,
memory limits, and actual OS print-to-PDF output are not verified. Existing
PDF.js standard-font warnings remain visible in test output.

## Review of coverage

| Criterion | Score | Evidence and remaining gap |
| --- | --- | --- |
| Accuracy | 4/5 | Real chooser events and parsed outputs replace bypassed inputs; OS dialogs are not visually inspected. |
| Completeness | 3/5 | All 25 tools have positive and negative cases, but malformed inputs and every option are not exhaustively covered. |
| Clarity | 4/5 | Cases and limits are explicit; per-test execution details remain in the run log. |
| Actionability | 4/5 | Commands and screenshot paths are supplied; final user-browser confirmation remains necessary. |
| Conciseness | 4/5 | One shared helper covers workflow upload; route inventory is duplicated in existing suites. |

Overall: 3.8/5. Highest-impact follow-ups are malformed-file cases per parser,
cross-browser execution, and real OS print/camera checks. These scores describe
coverage, not a claim that every app feature is defect-free.
