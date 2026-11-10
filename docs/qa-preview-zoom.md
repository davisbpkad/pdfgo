# Preview zoom verification

## Scope

Zoom changes previews only. It does not change export settings or document coordinates.
Existing rendering-aware viewports remain in watermark, page numbers, edit PDF,
signature placement, and redaction editing. The shared `ZoomPreview` adds 25–400%
zoom and a 100% reset to image cards, organize cards, scan cards, crop modal,
merge/split thumbnails, extracted-image thumbnail, form preview, HTML, Word,
Markdown, uploaded signature preview, and redaction inspection.

The signature drawing pad remains an input surface, not a zoomable preview.
Tools without a visual preview do not gain an artificial preview.

## Checks

- `npm run build`: passed.
- `npm test`: 130 passed, 0 failed.
- `npx playwright test`: **122 passed, 0 failed** (1.8 minutes).
- Dedicated zoom rerun: **17 passed, 0 failed** (23.7 seconds).
- Full log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/pdfgo-zoom-final.log`.
- Zoom log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/pdfgo-zoom-dedicated-final.log`.
- `tests/e2e/zoom.spec.mjs`: actual rendered enlargement/reduction, reset,
  25%/400% limits, canvas aspect ratio, crop overlay alignment, mobile horizontal
  scrolling, and a rendered redaction-inspection canvas.
- Existing signature/redaction export tests now zoom before saving.
- Screenshots: `test-results/zoom-*.png` after a completed run.

## Defects exposed by tests

- Merge used a raw object after adding it to a reactive array. Async thumbnail
  changes did not update the UI. Using the reactive item fixes that shared path.
- Redaction inspection tried rendering before its conditional canvas mounted.
  A post-flush watcher now waits for the DOM.
- Form tests initially measured the default 300px canvas before PDF rendering.
  The test now waits for the real canvas width before measuring zoom.

## Limits

Chromium only. Real touchscreen pinch, Safari/Firefox CSS zoom, and very large
documents are not verified. Thumbnail enlargement cannot add source detail.
Export tests verify valid files/page counts, not pixel-perfect signature or
redaction coordinates. Uploaded-signature preview has no dedicated zoom test.
No new dependencies, commits, or pushes.

## Self-review

| Axis | Score | Evidence / improvement |
| --- | --- | --- |
| Accuracy | 4/5 | Browser tests measure real element sizes; pixel-perfect export placement is not compared. |
| Completeness | 4/5 | Preview inventory covered; uploaded-signature zoom lacks a dedicated browser case. |
| Clarity | 4/5 | Scope and limits explicit; old/new controls differ in reset presentation. |
| Actionability | 4/5 | Runnable test file and screenshot locations supplied; non-Chromium checks remain manual. |
| Conciseness | 4/5 | One shared wrapper; existing renderer-aware viewport retained to avoid coordinate changes. |

Overall: 4.0/5. Highest-impact follow-ups: cross-browser checks, then pixel-level
export-placement comparisons. User agreement should depend on these stated limits,
not an assertion that every device is covered.
