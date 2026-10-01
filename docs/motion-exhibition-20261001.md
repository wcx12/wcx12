# Motion exhibition, 2026-10-01

## Scope and provenance

User-requested motion pass, preserving the research-first information hierarchy,
registered URLs, bilingual content, three themes and existing topic interactions.
Work branch: `codex/motion-exhibition-20261001`.
Verified origin: `https://github.com/wcx12/wcx12.git`.
Base: `ed3bdd289aceb9d4e13fb738c06312d5d7d56387`.
The initial worktree was clean except pre-existing untracked `.playwright-cli/`.

Live homepage checked at 2026-10-01T14:45:13.174Z: fingerprint `cfaf93e5e3c3`.
The same fingerprint is present in the frozen base artifact. Latest successful
Pages run observed then: [36628704895](https://github.com/wcx12/wcx12/actions/runs/36628704895),
workflow head `8f89a4e3b516a1f8b191e5a4bac338c7ff92641c`.
Scheduled generation can commit after building; these observations do not prove
that the live artifact was built from the later repository HEAD.

## Design decisions

Considered an ambient full-page animation treatment versus a content-led
interactive exhibition. Chose the latter: the name, evidence links and writing
stay stable, while finite motion reveals relationships and responds to input.
No new research claims, fake model outputs, analytics, login or external runtime
service. The approved registration interaction is retained unchanged.

21st.dev references inspected on this date:
- [Slide Tabs](https://21st.dev/@minhxthanh/components/slide-tabs): continuous active-marker movement; actual preview screenshot retained.
- [Animated Hero](https://21st.dev/@tommyjepsen/components/animated-hero): staged entrance rhythm.
- [Hover Image List](https://21st.dev/@educalvolpz/components/hover-image-list): an informative preview that responds to hover/focus.

These are interaction references, not copied React components or layouts.
Implementation uses native CSS/WAAPI/View Transitions and a lazy, self-hosted
Three.js bundle. Lucide and Three.js licenses are retained in `assets/vendor/`.

- Unframed 3D point sculptures with topic morphing, rotation, pointer response and static fallback.
- Bounded representative-work covers; the major-intel cover uses public interface names, explicitly not a live execution trace.
- VPR observation wipes and landmark feedback, specimen magnification/annotation transfer, calendar proposal/approval movement and exact geometry assembly.
- Shared navigation markers, contextual pointer, theme reveal, scroll entrance, timeline and article TOC state.
- Statically reserved blog cover geometry; accessible figure enlargement; opt-in TIGER steps; no animated prose or automatic article playback.
- Footer motion preference, OS reduced-motion priority, offscreen/background cancellation and finite settling.

## Issues and acceptance

| ID | Kind / priority | Evidence, cause and change | Acceptance / status |
| --- | --- | --- | --- |
| M01 | Design / P2 | Static equal-weight selected work; added topical previews without replacing evidence links. | Inspect desktop/mobile, replay, keyboard and unchanged destination; verification pending final matrix. |
| M02 | Interaction / P2 | Topic state changed with little continuity; added finite causal transitions to existing state machines. | Rapid input, undo, rejection, approval and motion-off must preserve exact outcomes. |
| M03 | Regression / P1 | Native transition opt-in arrived after first render on cold navigation, and duplicate work names could survive Back. | Put opt-in in critical head CSS, install early lifecycle handlers, skip reduced/off transitions, clear shared names on restoration; repeated navigation regression. |
| M04 | Regression / P1 | New figure dialog let Tab escape at focus boundaries. | Explicit forward/reverse focus wrapping, Esc, inert restoration and scroll restoration. |
| M05 | Regression / P2 | New controller exceeded existing homepage byte budget. | Move visual lifecycle/card feedback to enhancement modules, remove superseded theme overlay logic and unused hero pills; retain budget unchanged. |
| M06 | Security / P2 | Existing markdown-it advisory GHSA-253c-mchw-3w2r, linkify parsing resource consumption. | Same-major patched dependency; official registry audit has zero known advisories. Rendering/security tests pending final run. |
| M07 | Layout risk / P2 | JS-inserted covers could shift article/list content. | Server-rendered slots have identical bounds before/after hydration; browser assertions pass in initial Chromium run. |
| M08 | Test mismatch / P2 | TOC test compared encoded fragment to literal Unicode attribute. | Compare decoded destination, preserving the existing URL and actual active-heading assertion. |
| M09 | Visual inconsistency / P2 | Warm-theme screenshot retained cyan tool-tab backgrounds. | Use shared surface/border/accent tokens; final theme screenshots and contrast scan. |
| M10 | Layout / P2 | English topic descriptions changed homepage height by 22px at 1024px. | Reserve responsive metadata space; all topics in both languages stay within 1px at 390/1024/1440px in all three engines. |
| M11 | Interaction / P2 | Article playback remained disabled after reenabling motion. | Recompute control state on preference/media/visibility changes; exercise off/on/play progression. |
| M12 | Accessibility / P2 | Saved motion-off did not override explicit smooth scrolling. | Central scroll behavior checks the shared preference; assert actual scrollIntoView options. |
| M13 | Consistency / P2 | Article footer matched before the global footer, misplacing the motion setting. | Explicit global-footer selection, verified by a visible article-footer control assertion. |
| M14 | Test reliability / P2 | One Windows WebKit run exhausted the 45-second budget for 48 successive layout combinations; it reported no failed layout predicate. | Parameterize by theme, retaining all widths, pixel and error assertions and the unchanged per-test timeout. All nine engine/theme cases passed. |
| M15 | Performance regression / P1 | Local paired measurements exposed long initial WebGL tasks (first mobile sample 2,277ms), plus synchronous indicator layout. Desktop cold-start samples also regressed despite staged compilation. | Initial visits retain the lightweight preview. Desktop 3D starts on 350ms mouse dwell or button activation; narrow/coarse-pointer visits require the button. Split renderer initialization, await shader compilation, avoid redundant buffer resets, defer decorative layout until after paint. Mobile activation, actual pixels, keyboard focus and network-failure retry are tested. Final paired measurements required. |
| M16 | Keyboard defect / P2; CI failure link unconfirmed | Topic rail resize recentered the selected interest even when a visitor focused a different interest. A new deterministic regression fails before the fix (scrollLeft 521 instead of 802). CI run 36895085395 separately had one WebKit Agent-selection failure; its exact cause could not be established without a retained trace. | Preserve the focused interest during resize; add actual browser resize/Enter coverage and retain failed CI browser evidence. Repeat the original Agent path without lowering assertions or adding retries. |
| M17 | Keyboard defect / P1 | The next CI trace (36896967137) showed focus lost during initial data arrival. Research refresh unconditionally replaced every topic link; resize-only protection could not preserve a removed DOM node. | Skip unchanged rail markup and restore focus by topic key on necessary updates. A delayed ORCID response regression checks the original DOM node remains connected, focused and operable. |

All new visual changes are reversible. Main regression risks are lifecycle
cancellation, nested-page asset paths, keyboard focus, pointer/scroll interaction,
and increased optional GPU/download cost. Tests must check behavior, not just
class names or source strings.

## Evidence and verification

Local environment: Windows, Node v24.14.0 (repository range permits it; CI uses
`.nvmrc` 22.23.1), pinned Playwright 1.63.0. Dependencies installed with
`npm ci --ignore-scripts`. No sensitive user notes or real tokens used in tests.

Evidence is ignored and outside the deployment allowlist:
- `output/motion-20261001/baseline-source/`: immutable Git-archive base and packaged artifact.
- `output/motion-20261001/before-home-1440.png`, `before-article-1440.png`.
- `output/motion-20261001/reference-slide-tabs.png`.
- `output/motion-20261001/regression/`: cross-engine interaction reports/screenshots.
- `output/site-quality-20260926/commands/motion-*.json` and `.log`: actual exit codes and timestamps.
- `output/site-quality-20260926/motion-final/browser/`: 45 Chromium route/viewport/theme/no-JS checks plus six Firefox/WebKit checks, all passed; actual screenshots reviewed.
- `output/motion-20261001/final-navigation/`: six repeated Chromium theme/Back checks passed after the critical-head fix.
- Paired performance reports: pending CI completion.
- Final topic audit: 48 combinations passed. Reading: 15 layout checks and 174
  sampled text contrast checks passed; optional-module retry, anchors and print
  reviewed. Real pointer drag changed the 3D rendering and emulated touch pan
  scrolled the page. Settled screenshots: `output/motion-20261001/final-visual/`.

Baseline `npm run validate`: 224 passed, two Windows symlink tests skipped (EPERM).
First focused integration: 22/31 passed; seven transition errors, one dialog
focus failure and one fragment-encoding assertion identified and addressed.
The earlier interrupted `motion-baseline-browser` run targeted a mutable artifact
by mistake and is explicitly excluded from baseline/final evidence.

Current final build: 15 Pages tests passed. Content/site validation: 234 passed,
two Windows symlink tests skipped. Private-notes suite: 78 passed.
Link audit: 39 HTML pages, 1 SVG,
1,633 hrefs, 269 fragments, 10 dynamic routes; no broken internal destinations.
Official `npm audit --registry=https://registry.npmjs.org --json`: zero advisories.
Initial full browser regression: 156 passed, four explicitly skipped WebGL cases,
two Firefox failures in the cover test's artificial request gate (it prevented
document load and font readiness). Replaced that test setup with an empty script
response followed by explicit hydration; all six geometry cases now pass across
Chromium, Firefox and WebKit. Final full CI regression and paired performance:
in progress; early failed runs are retained, not counted as release passes.
The later full local run had 169 passes, four scoped skips and one cumulative
WebKit timeout (M14); its nine replacement cases passed. CI run 36891627904
passed the unsplit full browser suite and generated-file checks before the
final test-only refinement. The final candidate must still pass CI as a whole.

Content preservation check: all 39 routes/canonicals and all five rendered article
bodies/metadata match the frozen base. Its strict source-byte check exits 1 for
the Chinese writing-system source only: Git archive/worktree differ by one CR in
a line ending; LF-normalized sources are identical. `git diff --exit-code --
content/posts site-data.js profile-data.js research-config.json resume.md
resume.zh.md` passes. No source content was rewritten to satisfy that check.
The raw failure is retained in `output/motion-20261001/content-preservation.json`.

Measured build sizes (gzip, bytes): shared motion 3,982; homepage enhancement
controller/posters 1,719; optional hero renderer 7,344; optional Three.js 134,179.
Main application gzip is 37,794 versus base 37,914. Blog runtime is 15,934 versus
8,328, and CSS 22,148 versus 20,809. These size changes are not latency claims.
Existing application/bootstrap/translation budgets remain unchanged.
`git diff --check` flags upstream whitespace inside generated Three.js shader
strings only; those vendor strings are retained verbatim by the bundler, not
manually reformatted. Authored source has no whitespace errors.

Performance gate will use the repository's paired 24-navigation CI comparison
(base/current, homepage/article, desktop/mobile, three samples each), avoiding
concurrent local browser load. Raw reports, median/range and environment must be
reviewed before production approval; no previous release score substitutes for it.

The first local mobile comparison (`motion-local-home`) did NOT pass: baseline
Performance median 86 (63-97), candidate 58 (57-65), TBT medians 339/3,041ms.
That candidate was not released. Its CI run 36892954937 passed functional tests
but still showed mobile article Performance 89 (88-90), versus base 97, so CI
green alone was not treated as release approval. The M15 follow-up retains these
reports and adds `motion-local-home-optimized`: home Performance medians 93/89
(base range 79-93, candidate 70-91), TBT 179/205ms. Windows timings have substantial
variation; the final controlled CI comparison will be reported separately.
The subsequent full Windows comparison (`motion-final-paired`, source 367570e)
also remained unacceptable: desktop home Performance median 69 versus base 97.
It is superseded, not release evidence. The final candidate uses intent-driven
3D on desktop too, settles the 2D fallback after 24 frames, and establishes motion
attributes in the head before article layout. All 24 raw reports from that
rejected candidate are retained, including the highly variable article results.
Eleven focused Chromium cases pass after these changes, including desktop hover,
mobile activation, nonblank/changed pixels, static fallback settling, keyboard
focus, actual failed-download retry, and topic-rail focus during resize.

## Release and limits

Production publishing and an ordinary rollback commit were explicitly authorized
by the user, conditional on gates. No approval or branch/environment protection
is changed. Release is not yet claimed in this record.
The runner's Azure HTTP Ubuntu mirror repeatedly stalled on browser dependency
downloads. CI now uses the official Ubuntu HTTPS mirror with the same signing
keys/verification and a bounded install timeout; no test or approval is skipped.
The first source-file replacement did not cover the runner's `mirror+file`
indirection. Cancelled-run logs identified `/etc/apt/apt-mirrors.txt`; the final
setup covers both the source declaration and this mirror list.
Release-specific final results are retained in
[PR 21](https://github.com/wcx12/wcx12/pull/21) and the ignored
`output/motion-20261001/release-record.md`.

After validation, merge through the existing repository policy and Pages workflow.
Verify live fingerprint and homepage, Chinese route, research, publication,
article and 404. Roll back by reverting the integration commit, rebuilding,
validating and redeploying normally; never reset shared history or force-push.

Browser automation is simulated task testing, not user research. Headless engines
are not physical devices or a real Safari audit. Lighthouse is lab data, not
field INP; no real-user p75 data is available. Native page/theme transitions
degrade to ordinary navigation on unsupported browsers. Public draft source is
not confidential; the separate authenticated Private Notes boundary is unchanged.
