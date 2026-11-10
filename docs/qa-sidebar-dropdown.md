# Sidebar dropdown regression

## Change

All four sidebar categories now expand/collapse with native buttons, chevrons,
`aria-expanded`, and `aria-controls`. Child items have an indented vertical guide.
Categories start collapsed, including direct links. Opening/closing animates
height and opacity over 300ms, respecting reduced-motion preferences. Collapsed
children are inert and hidden from accessibility navigation. Route changes reopen the
category containing the active tool. Collapsing a category does not navigate.

Conversion order:

1. Image, scan, HTML, Word, Excel, PowerPoint to PDF.
2. PDF to image, Word, Excel, PowerPoint, Markdown.

No routes, conversion implementations, or registry exports changed. The shell
test counts tool buttons explicitly, excluding new category toggle buttons.

## Verification

- RED: sidebar test failed before implementation because no conversion toggle existed.
- Build: passed.
- Dedicated desktop/mobile tests: 2 passed.
- Collapsed-default update: build passed; 11 sidebar/shell/layout tests passed,
  including direct-link initial state and reduced-motion behavior. Previous full
  regression below predates this small update.
- Dedicated shell/layout/language/sidebar rerun: 15 passed.
- Unit tests: 130 passed, 0 failed.
- Full browser regression: **125 passed, 0 failed** (1.7 minutes).
- Screenshot: `test-results/sidebar-dropdown.png`.
- Dedicated log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/sidebar-proof.log`.
- Full log: `/private/var/folders/kc/wst0d_1s3vj9vbb048tl6ww00000gn/T/opencode/sidebar-full.log`.

The mobile test checks collapsing keeps the sidebar open, selecting a child
navigates and closes it. Desktop checks exact conversion order, no navigation
on collapse, Enter activation, and reopening on route change.

## Limits and self-review

Chromium only. Expanded state intentionally does not persist after reload.
Reference URL opened, but design matching used the supplied screenshot; no
pixel-diff comparison with the reference application was performed.
No commit or push.

| Axis | Score | Evidence / remaining gap |
| --- | --- | --- |
| Accuracy | 4/5 | Exact route ordering and toggle behavior asserted; no visual pixel comparison. |
| Completeness | 4/5 | Four categories share dropdown behavior; automated interaction focuses on conversion. |
| Clarity | 4/5 | Indentation, active category, and chevrons show hierarchy; no separate conversion subgroup labels. |
| Actionability | 4/5 | Tests and screenshot supplied; cross-browser behavior not checked. |
| Conciseness | 4/5 | Single component change replaces repeated array pushes; no dependencies added. |

Overall: 4.0/5. Highest-impact follow-up is cross-browser verification. The user
can compare the screenshot against the supplied reference without interpreting
this score as a claim of pixel-identical styling.
