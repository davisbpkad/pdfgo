# Security hardening after the Netlify audit

## Scope and changes

- Inline application scripts now use build-generated SHA-256 CSP hashes. Removed
  `unsafe-inline`, `self`, and `data:` from `script-src`. Retained `blob:` and
  `wasm-unsafe-eval` for PDF/OCR workers and embedded WASM compatibility.
- Added `base-uri 'none'`, `form-action 'none'`, and HTTP-only
  `frame-ancestors 'none'`. Existing styles still require `unsafe-inline`.
- Removed the duplicate static CSP from `netlify.toml`. `dist/_headers` contains
  generated script hashes for the published variants. Each standalone HTML also
  carries its own hash in its meta policy. Local preview sends matching headers.
- Same-origin script tags, including the observed Netlify HUD loader, are no
  longer authorized by CSP. The Netlify dashboard setting itself was not changed.
- Shared `renderPageToCanvas` now uses the existing 4096-pixel/16-megapixel scale
  limiter and rejects invalid page dimensions or scales. Existing direct canvas
  renderers are not changed by this shared helper fix.
- PPTX conversion rejects inputs above 50 MiB, over 2000 archive entries, entries
  above 32 MiB expanded, total declared expansion above 100 MiB, and over 500 slides.
  Limits run in the unzip filter before allocation for each entry.
- Playwright now requires a fresh preview server. `PDFGO_TEST_PORT` permits an
  isolated test port without stopping another developer's server.

## TDD and execution evidence

Journeys: normal PDF/PPTX/OCR workflows continue working; injected scripts fail;
oversized documents fail with a readable error rather than unbounded allocation.

- RED: `node --test tests/unit/cspSync.test.mjs`: 3 failures against the old CSP.
- RED: `node --test tests/unit/securityLimits.test.mjs`: 2 failures against the
  old archive and canvas handling.
- `npm run build`: passed for full and lite.
- `node --test --experimental-test-coverage tests/unit/*.test.mjs`: **133 passed,
  0 failed**. Aggregate coverage: **87.81% lines, 72.89% branches, 83.56% functions**.
  Branch coverage is below 80%; no claim of universal 80% coverage.
- Initial browser run: 128 passed, 1 failed because an existing preview server
  returned the old permissive CSP. This result is not accepted as clean evidence.
- `PDFGO_TEST_PORT=4187 npx playwright test tests/e2e/security.spec.mjs`: passed.
  Covers application boot, inline/same-origin script blocking, and both standalone
  variants booting with their own hashes.
- Full isolated browser suite: **129 passed, 0 failed** (1.7 minutes), including
  OCR, PDF workflows, and conversion/print regressions. The later standalone
  variant boot regression also passed in the 2-case focused security run.
- Logs: `hardening-build.log`, `hardening-coverage.log`,
  `hardening-clean-e2e.log`, `hardening-security.log` under
  `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/`.

## Remaining boundaries

No deployment, commit, push, dependency upload, or Netlify account change was
performed. Recheck actual response CSP and HUD behavior after deployment. Disable
HUD injection in Netlify settings if it remains enabled; CSP blocking alone is
not proof that platform rewriting cannot alter the deployed policy.

PPTX decompression remains synchronous, trusts ZIP metadata for declared output
sizes, and has no cancellation or execution deadline. These limits reduce resource
risk; they do not prove all malformed archives are harmless. DOCX/XLSX extraction
and other direct canvas renderers remain separate follow-up surfaces. Large PPTX
files above the new limits are intentionally refused. PDF exports using the shared
renderer can have lower raster resolution on unusually large pages.

Dependency advisory review, deliberate DoS, Firefox/Safari, actual OS print
dialogs, and post-deploy verification were not performed.

## Self-review

| Axis | Score | Evidence / gap |
| --- | --- | --- |
| Accuracy | 4/5 | Hashes and browser blocking tested; deployed headers not yet updated. |
| Completeness | 3/5 | Audit fixes applied locally; account settings and other parsers remain. |
| Clarity | 4/5 | Confirmed tests and boundaries separated; archive limits affect large files. |
| Actionability | 4/5 | Build emits deployable headers; live verification still required. |
| Conciseness | 4/5 | Existing limiter reused; no dependencies or new worker subsystem. |

Overall 3.8/5. Next improvements: verify deployed CSP, disable Netlify HUD in account
settings, then extend bounded parsing/rendering to other trust boundaries. This
assessment should match the user's expectation only for local hardening, not a
claim that the deployed site has already been secured.
