# Topic experiences redesign

## Scope and baseline

Repository: `wcx12/wcx12`, branch `codex/topic-experiences-20260926`,
base `499d8f466c196fd73538b07df9f2e7afc7c7f476`.
The existing point-cloud registration interaction is retained. Publications,
research assignments, articles, profile facts and public routes are unchanged.

Actual pre-change Chromium screenshots are in
`output/playwright/topics/before/` (1440 CSS px, reduced motion, mono theme).
An initial capture ran before lazy initialization completed; those captures
were replaced only after waiting for the enabled registration action.

| ID | Finding | Kind | Decision / acceptance |
| --- | --- | --- | --- |
| T1 | VPR was a route with symbolic thumbnails and an illustrative score. The place itself could not be inspected. | Usability / visual | Recognizable views, a same-place decision, observable correspondence; no fabricated confidence. |
| T2 | Agent depicted a person and robot while the actual task lived in a separate text scroller. | Usability / visual | Work directly on a calendar artifact; proposals require approval before application. |
| T3 | Education used a robot and small blackboard above multiple-choice controls. | Usability / visual | Manipulate a mathematical object; feedback derives from its current state. |
| T4 | Medical images were very small scan symbols. Selecting and annotating mostly changed text. | Usability / visual | Inspect a sample, spend a limited annotation budget and see what is actually revealed. |
| T5 | Unrelated subjects shared an animation loop and large canvas implementation. | Maintenance / performance | Retain the registration renderer; lazy-load event-driven topic modules. |

These are task-oriented design judgments, not findings from external user testing.

## Design decisions

Two approaches were considered: a consistent illustrated gallery, or different
direct-manipulation surfaces for each research question. The latter was selected:
a gallery would still make interaction secondary to an illustration.

- VPR: distinguish place identity from changed appearance.
- Active learning: distinguish selecting an unlabeled sample from receiving a label.
- Agent: distinguish a proposed plan from permission to apply it.
- Education: connect a learner's operation to a mathematical consequence.
- Generative retrieval retains its reading-note presentation rather than inventing a demonstration of an unimplemented system.

Existing color themes, typography, tokens, bilingual routes, static evidence
links and bounded workbench are retained. Local examples are explicitly
illustrative, not research results, clinical inference or live model calls.

## Engineering and verification

`research-canvas.js` now owns registration only. `topic-experiences.js` handles
versioned lazy loading, failures/retry and topic-state retention. Domain-specific
modules own their DOM and styles. Their assets are in the existing fingerprint,
preview-copy and explicit Pages allowlists.

Tests that asserted the retired robot scenes and canned task stages are replaced
with registration regression coverage and new domain behavior checks, not kept
as tests of unreachable code. Browser coverage must verify visible outcomes,
keyboard operation, topic switching, themes, reflow and module failures.

### Review findings and resolution

T1-T5 are P2 improvements implemented in this branch. T1 and T4 map to
`topic-perception.js/css`; T2 and T3 to `topic-workbench.js/css`; T5 to
`research-canvas.js`, `topic-experiences.js` and the build/package allowlists.
Their visible outcomes are covered by `scripts/e2e/topics.spec.mjs`, alongside
the unchanged registration path in `scripts/e2e/site.spec.mjs`.

Prototype review also found and corrected:

- A hidden live region escaped the bounded scroller and increased document
  height on topic changes. Its containing block is now positioned; an E2E
  assertion checks both workbench and document heights.
- Medical sample inspection followed the entire sample pool on mobile. The
  inspection surface now comes first in both DOM and visual reading order;
  selecting a sample scrolls only the internal surface if necessary.
- Mobile VPR candidates occupied three full rows. A scrollable candidate strip
  preserves the reference image and makes comparison less fragmented.
- Mock model disagreement was previously easy to confuse with image ambiguity.
  Fixed committee votes now select the next unlabeled sample independently of
  image appearance. Acquiring a label spends budget; querying does not. This
  illustration does not retrain a model or claim an accuracy improvement.
- Calendar constraints overwhelmed the initial view. Optional settings are
  collapsed; the request, proposed changes and approval stay primary.

### Reproducible checks

Environment: Windows, Node 24.14.0, Playwright 1.63.0, axe-core 4.13.0.
CI uses the repository's Node 22.23.1 pin. No dependencies were added or updated.
The local Pages artifact is served with the `/wcx12/` prefix, not from repository
source. Current public asset fingerprint: `5a006de2d42b`.

| Check | Result / evidence |
| --- | --- |
| `npm run validate` | Exit 0: content 46 pass / 2 Windows symlink permission skips; homepage 48 pass; site 130 pass. `output/site-quality-20260926/commands/topics-release-validate.*` |
| `npm run build:pages` | Exit 0; 15 artifact checks pass. Five public language files; no draft or scheduled article included. `output/site-quality-20260926/commands/topics-final-build.*` |
| `npm run test:links` | Exit 0; 39 HTML files, 1 SVG, 1591 hrefs, 269 anchors, 10 dynamic routes. `output/site-quality-20260926/fragment-check.json` |
| `npm audit --registry=https://registry.npmjs.org` | Exit 0, zero reported vulnerabilities. The configured mirror did not support the audit endpoint (404), so the official registry was used. |
| `node scripts/qa/topic-audit.mjs http://127.0.0.1:4286/wcx12/ release-review` | 48 combinations: English/Chinese, three themes, 390/1440 px, four new topics. Zero scoped axe violations, document/scene horizontal overflows, page errors or failed requests. 56 screenshots including outcomes in `output/playwright/topics/release-review/`. |
| `npx playwright test` | Exit 0: 67 pass, 2 existing non-Chromium clipboard skips, zero failures/retries across Chromium, Firefox and WebKit. Report: `output/playwright/topics/release-e2e/e2e-results.json`. |
| `git diff --check` | Exit 0. Generated page diffs update resource fingerprints only. Article text, profile data, research mappings and routes unchanged. |

The first full browser run had 64 passes, two existing non-Chromium clipboard
skips and three failures from the same outdated reset test: it tried to click
inside a closed settings disclosure. The test now opens the disclosure through
the visible summary. No force clicks, relaxed timeouts or removed assertions
were used. The education test also exercises actual pointer dragging, in
addition to keyboard control and state-derived measurements.

Visual inspection covered desktop and mobile initial and outcome screenshots,
including the retained registration baseline and black-and-white theme.
Layout assertions additionally cover 320, 768 and 1440 px in all three engines.
These are browser simulations and scoped automated accessibility checks, not
real-device, assistive-technology or external user testing.

New interactions have no autonomous animation loop, remote API, persistent
visitor data or model dependency. They redraw only on state/theme changes.
The registration module shrank from approximately 83.7 KB to 22 KB; this is a
module-size comparison, not a claim that total site bytes or real-user INP
improved. Full Lighthouse before/after results remain subject to the existing
PR performance workflow; no previous release score is reused for this change.

## Release

Use the existing PR quality and Pages workflows without changing permissions or
approval rules. Publishing this iteration requires the user's release decision.
Revert the eventual merge with a normal revert commit, rebuild and run the gates;
do not rewrite history. The known-good predecessor is the base SHA above.
