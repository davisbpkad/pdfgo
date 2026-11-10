# Feature-specific output filenames

Generic product prefixes were removed from generated download names:

| Output | Suggested name |
| --- | --- |
| Merge, including repeated download | `gabung-pdf.pdf` |
| Image to PDF | `gambar-ke-pdf.pdf` |
| HTML print title | `html-ke-pdf` |
| Word print title | `word-ke-pdf` |
| Queue ZIP | `hasil-antrean.zip` |
| OCR queue result and ZIP member | Original basename plus `_searchable.pdf` |

Other tools retain existing source-based, feature-specific names and extensions.
Queue downloads now retain the filename published by the producing tool rather
than adding a product prefix. Print titles are HTML-escaped.

## Evidence

- RED: merge filename assertion failed with the old product-prefixed name.
- Build passed.
- Unit tests: 131 passed.
- Targeted browser run: 29 passed, one queue filename assertion still expected
  the old name. That assertion and ZIP-member expectation were updated to the
  requested names, not removed.
- Full browser regression: **127 passed, 0 failed** (1.7 minutes).
- Corrected targeted reruns: print/OCR tests passed (7 cases), and
  conversion/layout tests passed (23 cases).
- Logs: `filename-build.log`, `filename-unit.log`, `filename-full.log` under
  `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/`.

## Limits and review

Native print Save As is controlled by the browser/OS. Tests verify the iframe
document title passed to print, not the actual OS dialog's proposed filename.
The app supplies download names; browsers may append counters for duplicates.
No dependencies, commit, or push.

| Axis | Score | Evidence / gap |
| --- | --- | --- |
| Accuracy | 4/5 | Actual download names and print titles asserted; native dialog unverified. |
| Completeness | 4/5 | Generic prefixes removed across source; existing feature/source names retained. |
| Clarity | 4/5 | Names map directly to features; OCR suffix remains English for compatibility. |
| Actionability | 4/5 | Build and runnable tests provided; OS print check remains manual. |
| Conciseness | 4/5 | Existing download calls retained; queue carries one filename field. |

Overall: 4.0/5. Next check: browser-native HTML/Word Save As names on the user's OS.
