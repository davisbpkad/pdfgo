# Uploaded signature background regression

## Root causes and fix

The old filter removed only pixels with all RGB channels above 230. Light gray
and cream paper stayed opaque. The upload component also reprocessed its result
when the checkbox changed, so disabling removal could not restore the original.

The filter now removes light, low-saturation paper and fades its transition to
preserve dark/colored ink. Uploads retain their original image for each toggle.
A checkerboard makes transparency visible in the preview. No dependencies added.

## Evidence

- RED: `tests/e2e/sign-upload.spec.mjs` observed background alpha **255**, expected
  **0**, using generated cream paper RGB `(210, 205, 190)` with blue ink.
- GREEN: same test passed. Background alpha becomes 0, blue ink remains
  `(15, 30, 90, 255)`, disabling removal restores alpha 255, enabling restores 0.
- Export: parsed PDF contains an image soft mask with transparent and opaque pixels.
- `npm run build`: passed; existing PDF.js/import.meta warnings remain.
- `npm test`: 130 passed, 0 failed.
- Full Playwright regression: **123 passed, 0 failed** (1.6 minutes).
- Full log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/sign-upload-full.log`.
- Screenshot: `test-results/sign-upload-transparent.png`.
- RED log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/sign-upload-red.log`.
- GREEN log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/sign-upload-proof.log`.

## Limits and review

This is a light-paper filter, not arbitrary-background segmentation. Dark paper,
strong shadows, and saturated backgrounds need a different method. Pale ink can
fade. The user's actual signature file was not supplied; its result is unverified.
Generated-image testing ran in Chromium, not Safari/Firefox. No commit or push.

| Self-review axis | Score | Evidence / remaining gap |
| --- | --- | --- |
| Accuracy | 4/5 | Pixel alpha and PDF soft mask verified; actual user file unavailable. |
| Completeness | 4/5 | Removal, reversible toggle, and export covered; uneven shadows remain limited. |
| Clarity | 4/5 | Checkerboard exposes alpha; checkbox still describes white paper only. |
| Actionability | 4/5 | Runnable regression and screenshot supplied; actual user image needs confirmation. |
| Conciseness | 4/5 | Existing filter and upload component reused; no new library. |

Overall: 4.0/5. Next improvement: verify the supplied user image before tuning
thresholds further. User agreement depends on the actual paper/ink colors.
