# Readable edit preview

## Fix

The editable text layer previously painted every extracted string over the PDF
canvas, even before any edits. Font metrics differed, producing doubled text.
Unchanged text fields now have transparent text: the original PDF alone remains
visible. Focused and changed fields use opaque white backgrounds and black text,
masking the original underneath. Changed fields keep a blue outline after blur.
Content-sized changed fields avoid clipping longer replacements. The malformed
`::aria-label` binding was also corrected to `:aria-label`.

## Evidence

- RED: new browser regression failed against the prior text styling.
- Build: passed.
- Edit and zoom browser tests: 25 passed.
- Unit tests: 130 passed.
- Full browser run: **126 passed, 1 failed**. The failure was the image-to-PDF
  early-click download test, not edit PDF. An isolated rerun of that case passed.
  This does not establish that the full suite is green; the intermittent image
  loading/download failure remains uninvestigated.
- Screenshot: `test-results/edit-preview-readable.png`.
- Logs: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/edit-preview-green.log`
  and `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/edit-preview-full.log`.

Tests assert invisible duplicate text before editing, opaque masking while focused
and after blur, complete editor height for a longer replacement, accessible labels,
reset behavior, page navigation, zoom, and saved replacement text.

## Limits / self-review

The user's original PDF was not supplied. Chromium fixtures verify the fix, not
that exact document. White masking still assumes white paper. Long replacements
can overlap adjacent text; PDF output uses existing font/layout logic and is not
a pixel-identical preview. Safari/Firefox content-sizing support is not verified.

| Axis | Score | Evidence / gap |
| --- | --- | --- |
| Accuracy | 4/5 | CSS states, screenshot and saved text checked; real PDF unavailable. |
| Completeness | 4/5 | Duplicate text and clipping fixed; non-white paper remains limited. |
| Clarity | 4/5 | Blue outline marks edits; exact exported font metrics differ. |
| Actionability | 4/5 | Runnable regression and screenshot; actual document needs confirmation. |
| Conciseness | 4/5 | One production component changed; renderer/export logic unchanged. |

Overall 4.0/5. Highest-impact next check: the user's actual PDF, then colored paper
and long replacements near neighboring text. No dependencies, commit, or push.
