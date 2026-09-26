# Site Quality Review - 2026-09-26

## Identity and release boundary

- Requested directory `D:/HuaweiMoveData/Users/Cory/Desktop/temp` was empty, not a repository.
- Verified checkout: `personal-site-fixes`, origin `https://github.com/wcx12/wcx12.git`, public repository, default branch `main`.
- Initial checkout `35e38e14eec22949fbb3e81e73cd3c94283a0013`; fetched default branch `01c1f6bf54f89a3d7431b9b01c939392fe16a6d5` only added the automated metrics SVG.
- Work branch: `codex/site-quality-20260926`, based on `01c1f6b`. Initial source worktree clean; pre-existing untracked `.playwright-cli/` preserved.
- Verified Pages workflow deployment: run [36217735883](https://github.com/wcx12/wcx12/actions/runs/36217735883), `35e38e1`, completed 2026-09-26 04:25:12 UTC. Live homepage at 09:05:13 UTC matched local baseline bytes, asset version `8ee70a2f8f9c`, SHA256 `ea89f2aece2b8604ba3ed4c0c860384dce891bd60b29677d92d3a70ea5e24a20`.
- Repository write access and production authorization checked separately. Owner explicitly authorized deployment after gates and ordinary rollback commits. Existing Pages workflow/environment rules remain unchanged.
- No private note content or credentials used. Only anonymous editor shell and synthetic authorization/session fixtures are tested.

## Positioning and design decision

Retain the existing research portfolio position: verified research, inspectable engineering artifacts, and technical writing. Preserve the self-hosted fonts/licenses, dark themes, useful concept demos, explicit evidence boundaries, citation exports, stable static routes, bilingual variants, and authenticated owner workflows.

Two directions considered:

1. **Research-first editorial (selected):** paper before prototype, useful evidence/entry points close to work, quieter surfaces and stronger reading contrast, compact identity, distinct names for homepage tools. Mobile prioritizes text and actions. Shared tokens reduce drift with modest implementation cost.
2. **Interactive laboratory:** keep the large concept preview and duplicate panel navigation as the primary organizing device. More animation/context labeling and responsive complexity; less direct for researchers seeking evidence. Not implemented as a second site.

Tokens live in `site-tokens.css`: neutral surfaces, three accent families, UI/reading/code fonts, fixed type levels, line heights, reading/page widths, spacing, radii, borders, shadow, focus, timing, breakpoints and layer values. CSS media-query breakpoints remain literals because CSS variables are not valid there. No framework, backend, analytics or paid service added.

Homepage and the complex TIGER article were built and visually inspected at 1440 and 390 px before wider regression. Screenshots: `output/site-quality-20260926/sample/`. No paper conclusions or article body text changed for styling.

## Evidence index

All intermediate data is under ignored `output/site-quality-20260926/`, excluded from the explicit Pages allowlist.

- `baseline/inventory.json`: 39 HTML routes, 5 public article language variants (3 groups), 2 papers, repository snapshot, canonical URLs, sitemap, hashes and deployment metadata.
- `baseline/artifact/`: immutable copy of pre-change public artifact.
- `baseline/01-home-desktop.png`, `02-paper-desktop.png`: actual **live** Chromium screenshots; homepage paper navigation clicked.
- `baseline/browser/`: **local artifact** screenshots and automated observations for all principal templates, 320/360/390/768/1024/1440/1920 width sampling, themes, no-JS and other engines. No screenshot is a text scrape.
- `commands/`: actual command, exit code, dates, runtime and full logs. Baseline `npm ci --ignore-scripts`, `npm run validate`, `npm run build:pages`, `npm audit` all exit 0. Two Windows symlink tests skipped with EPERM, not passed.
- `content-audit.md`: independent primary-source content review by Euclid; source-only status mismatch reproduced, no browser claims.
- `engineering-audit.md`: independent security/degradation review by Erdos; simulated failures precisely identified; 160 selected existing tests passed. Agents did not modify shared files concurrently.
- `baseline/performance/`: exploratory uncompressed local runs. **Do not use the desktop-labeled runs as desktop results:** an API configuration mistake kept mobile emulation; fixed with the explicit Lighthouse desktop config and a form-factor assertion. Initial Windows temporary-profile cleanup failure is retained in logs. Fresh owned profiles now prevent that cleanup race.
- `baseline-controlled/performance/`: replacement controlled baseline, fresh profiles, gzip local artifact server, explicit desktop/mobile config, three navigations per page/device. Compare only with the same final configuration. Raw reports retain actual CPU/network/cache settings.
- `final/browser/report.json`: 45 Chromium page/theme/width/no-JS states and six Firefox/WebKit template checks. No page exceptions, failed requests, document overflow or reported WCAG-tagged axe violations. These scans captured page exceptions and request failures, not all console messages; final release smoke also records console errors.
- `final/reading/report.json`: 15 root-font-200%, 320px reflow and landscape cases; computed solid-background text contrast for three themes; optional Canvas import failure/retry and deep-anchor clearance. No failures in the completed run. A first recovery-check attempt raced a repeated failed request; the corrected test waits for network idle before removing its synthetic route failure.
- `fragment-check.json`: 39 HTML pages, one SVG, 1,591 hrefs, 269 fragment references and ten explicitly handled dynamic routes. No missing internal targets, changed canonicals or removed routes. Source and rendered article body hashes remain unchanged for all five language variants.
- `final/reading/resume-final-page-1.png`: actual A4 PDF rasterization, not just print-media CSS in a viewport. One page, readable email and complete skill entries; the redundant statistics strip is omitted in print only, with education/experience/publications retained.

Visual review included homepage/paper desktop and mobile, mono homepage/paper, warm article first screen, article middle/bottom and figure anchor, VPR topic, mobile project list/profile, enlarged article text and each printed page. Local browser automation is a simulated visitor walkthrough, not a user study.

## Issue register

Confidence is high unless marked as a judgment/risk. P1 means an important task barrier, not a claim that the whole site is inaccessible. Passed means the listed acceptance checks passed, not that every possible device/state was tested.

| ID | Page / visitor task | Evidence and reproduction | Root cause / impact / priority | Bounded change | Acceptance and regression risk | Status |
|---|---|---|---|---|---|---|
| Q01 | Article: read wide formulas and experimental results with keyboard | `baseline/browser/report.json`, TIGER 320/360/390, `scrollable-region-focusable` violations; focus/scroll regression added | Overflow regions contain no keyboard target; P1 keyboard reading barrier | Static renderer adds focusability without changing math or tables | Tab/focus then ArrowRight changes region scroll; no-JS retains target; watch excess tab stops | Passed, three-engine E2E and final axe scan |
| Q02 | Home: recover when enhancement fails | Engineering audit finding 2; reject entry import | Error marker has no consumer; live-looking dead controls, P2 | Default inert/hidden enhancement, visible loading/failure routes, reload; enable only after successful init | Abort each dependency; static paper/contact navigation works; watch CLS and no-JS fallback | Passed, five failed-dependency cases per engine |
| Q03 | Command search: accept Chinese input | Engineering audit finding 3, synthetic composing Enter executes command | Missing IME guard, P2 | Ignore composing Enter/arrows including legacy 229 | Browser event simulation must not navigate; ordinary Enter still works; native OS IME untested | Passed, simulated composition in three engines |
| Q04 | Command search: keyboard selection visible | Engineering audit finding 4; 11 arrows in constrained list | Active descendant changes without scroll, P2 | Nearest-edge scroll confined to list | Last/first option visible, input focused, document stationary | Passed, three-engine E2E |
| Q05 | Private notes: unattended failed connection locks | Engineering audit finding 1; catalog request rejects after authentication | Lock timer armed after throwing await, P2 session cleanup | Arm timer before catalog loading, preserve stale-session checks | Synthetic list/get failure + expiry disposes session; never use real notes/tokens | Passed, seven new session tests |
| Q06 | Publications: consistent status and date provenance | Content audit F2/F3; shared formatter vs raw homepage status | Card bypass and ambiguously named cover date, P2/P3 | One status formatter; verified issue date retained, unknown online date not invented | Card/detail/CV/citations consistent in both languages | Passed, metadata regression and browser path |
| Q07 | Profile: credible identity across GitHub/site | Content audit F1: README current student vs canonical study interval | Independently maintained README, P2 | Neutral past study interval, no inferred degree or role | Canonical facts match; current applications remain unconfirmed | Passed, canonical metadata checks |
| Q08 | Home: find representative evidence before exploring | Live screenshot, same labels navigate either pages or panels; project precedes paper | P2 usability/design judgment, not a broken-navigation claim | Paper first, explicit prototype, distinct tool labels; replace unverified graduation label with confirmed location | Click paper/code/contact paths; mobile first screen and overflow check | Passed, task simulation and screenshot review; no real user study |
| Q09 | Whole site: coherent reading and theme styles | Duplicate theme/font declarations, heavily saturated backgrounds in baseline | P2 design/maintenance judgment | Shared source tokens, neutral surfaces, fixed type scale, preserve 3 themes | Shared tokens loaded everywhere, actual contrast/layout tests, no theme flash | Passed within sampled coverage below |
| Q10 | Paper: reach implementation | Live TF-VPR detail screenshot; code only after bibliographic section | P2 discoverability judgment | Promote existing verified official-code link beside DOI | Link destination and owner attribution unchanged, mobile actions wrap | Passed, three-engine paper/code/citation path |
| Q11 | Global navigation: voice-control label matches brand | Exploratory LH `label-content-name-mismatch`: visible wcx12 vs accessible Home | P2 naming mismatch | Include wcx12 in accessible name | Accessible name includes visible text in both languages | Passed, final axe and Lighthouse scans |
| Q12 | Article: switch to the same article's translation | Browser navigation only changed interface strings | Translation URLs not wired into the global language control, P2 | Fixed-language article routes with actual alternate URL; original-language badge when no translation exists | Navigate Chinese/English writing-system variants, reload and back; preserve translation grouping | Passed in Chromium, Firefox and WebKit |
| Q13 | Mobile navigation after changing theme | Baseline WebKit reproduction stayed on homepage after clicking Research | Null `focusout.relatedTarget` closed the menu before click, P1 navigation barrier | Close on a known outside focus target; retain outside pointer/Esc closing | Theme selection then Research then language navigation in three engines | Passed |
| Q14 | Return from dialogs | Baseline WebKit reproduction returned to BODY after pointer-opened command dialog | WebKit pointer-clicked buttons do not receive focus automatically, P2 | Normalize button focus before click handlers capture the return target | Command, paper and README Esc returns focus to opener; keyboard shortcuts unchanged | Passed |
| Q15 | Search projects while deferred initialization finishes | WebKit test retained query but repopulated all 10 repositories | Redundant snapshot reset overwrote current filtered results, P2 | Keep seeded snapshot and search state; refresh initialized views only | Real search/empty/README flow plus state-preservation regression | Passed |
| Q16 | Command search after tool labels change | Independent integration review and bilingual browser regression | New labels lost Blog/Resume aliases; mouseenter on replaced rows could move the keyboard cursor without pointer movement, P2 | Index current navigation aliases and view IDs; use real pointer movement for hover selection | Search Blog/Resume/publications and Chinese equivalents, assert actual destination, not just closed dialog | Passed |

Already working / not repeated as missing: Selected work, research evidence/exploration distinction, scoped TF-VPR ablation evidence, medical-imaging topic assignment, fork/prototype/coursework provenance, DOI/BibTeX/RIS, shared navigation template, private repository authorization, public artifact allowlist, translation grouping, static core pages, reduced-motion support.

Visual follow-ups discovered during verification:

| ID | Evidence / cause / impact | Change and acceptance | Status |
|---|---|---|---|
| Q17 | Mono mobile Selected work links inherited the browser's visited purple, P2 regression | Explicit shared accent color; viewed `final/reading/home-mono-390.png` | Passed |
| Q18 | Actual A4 PDF: email hidden with actions, then overridden by the more-specific screen button color; skills heading split from body, P2 | Print-only contact styling, repeated page margins and keep skill entries together; browser assertions plus rendered PDF inspection | Passed, three-engine print assertions and final one-page PDF |

## Content and source boundaries

- Canonical identity: `profile-data.js`; research facts/repositories: `site-data.js`; taxonomy: `research-config.json`; CV sources use placeholders; posts: `content/posts/`.
- TF-VPR bibliography and code source corroborated via [Crossref](https://api.crossref.org/works/10.1016/j.neucom.2026.133399) and [publisher](https://www.sciencedirect.com/science/article/pii/S0925231226007964). June 7 is the publisher cover date, not an established first-online date.
- Active-learning paper verified via [Crossref](https://api.crossref.org/works/10.1016/j.neucom.2026.134314) and [publisher](https://www.sciencedirect.com/science/article/pii/S0925231226017121). Volume 699 / article 134314 / October 28 issue date does not establish when first online. Full publisher access restrictions are not broken DOI evidence.
- Unknown: degree award, present applications/availability, individual CRediT contributions, exact online dates, independently reproduced research results. Do not infer any from elapsed dates or author order.
- Publicly committed history is public even after withdrawal. Hidden controls, noindex and owner URL parameters are not authentication. Real private save/publish is not exercised in this audit.

## Release gate (updated on completion)

Not passed yet. Pending final build/content/behavior/browser/visual/performance/allowlist checks, commit identity and production verification. Do not treat exploratory scores, source-only checks or CI success as a deployed result.

### Completed verification

- Clean lockfile installation: `commands/final-ci.json`, `npm ci --ignore-scripts`, exit 0. Only development QA dependencies were added; no new browser runtime dependency.
- CI-compatible Node 22.23.1: `commands/final-node22-tests.json`, 322 passed, 2 Windows EPERM symlink skips. Includes private-session failure/expiry and ten withdrawal scenarios. `commands/final-node22-build.json`: build and 15 artifact checks passed.
- Latest `npm run validate`: `commands/final-validate.json`, exit 0; includes the additional repository-search preservation regression. `commands/final-audit.json`: npm audit reports 0 vulnerabilities, not a security certification.
- `commands/final-e2e.json`: 46 passed, 2 explicitly skipped. Chromium 153, Firefox 155 and Playwright WebKit 26.6 are engine automation, not real Safari or physical phone coverage. Clipboard permission automation only ran in Chromium. Source-preserving renderer changes retained README heading nesting, so the test asserts the visible heading rather than incorrectly requiring H1 inside a dialog.
- Browser tests are mandatory before upload in the existing Pages workflow (Chromium) and in pull-request Quality (Chromium, Firefox and WebKit). Approval/environment/permission policies are unchanged.
- Pull request [19](https://github.com/wcx12/wcx12/pull/19), source `ad064aa` plus CI hardening `4821185`: [Quality 36236213787](https://github.com/wcx12/wcx12/actions/runs/36236213787) passed on Ubuntu/Node 22.23.1, including all three engines (46 passed, two clipboard skips), internal links, artifact tests and reproducible generated output. Both symlink cases ran on Linux without skips.
- A later local `release-e2e` run recorded 45 passes, two skips and one Firefox article-flow 45-second timeout during high host load. Preserve this failure rather than relabeling it as passed. The same assertions passed in the earlier full local run and in isolated three-engine CI. No timeout or assertion was relaxed.
- Earlier failed runs are retained: they found existing WebKit issues, the renamed-command regression and the incorrect README test assumption. No test threshold was lowered; existing JavaScript byte budgets remain enforced.
- Final print follow-up: `release-final-build` passed all 15 artifact tests; `release-print-e2e` passed in three engines. `release-smoke-local` verified six page bodies plus nine resources against artifact hashes, mobile theme/navigation/language/reload and 404 recovery, with no unexpected console errors. This is local, not online evidence.
- The first `release-final-validate` exposed the old zero-`@page`/shell-padding contract. Assertions now require the intentional repeated 8mm/12mm page margin, zero shell padding and visible email. This matches the reviewed PDF instead of removing print coverage.

### Performance evidence

Lighthouse 13.5.0 / bundled Chromium 153, Windows, i7-1160G7, 8 logical CPUs, 15.8 GiB RAM; fresh profile/cache for each navigation; same gzip loopback server and explicit Lighthouse mobile/desktop simulation. External public endpoints and host background load are not controlled. Raw settings and reports are retained, not just scores.

`release-paired/performance/` ran 24 interleaved navigations from 10:39:07 to 10:50:04 UTC: three per revision/page/device. Before fingerprint `8ee70a2f8f9c`, after `e98d93156d42` (source `4821185`). The later public CSS change is print-only; screen styles/JS did not change. Median [min, max]:

| Page / device | Before Performance | After Performance | Before / after median LCP | Before / after median TBT |
|---|---:|---:|---:|---:|
| Home / mobile | 75 [75, 88] | 75 [73, 96] | 2.59 / 2.36 s | 369 / 610 ms |
| Home / desktop | 83 [74, 83] | 98 [89, 98] | 0.75 / 0.62 s | 342 / 78 ms |
| TIGER / mobile | 38 [31, 60] | 46 [42, 49] | 6.83 / 6.10 s | 893 / 660 ms |
| TIGER / desktop | 55 [45, 82] | 74 [37, 86] | 1.98 / 1.31 s | 514 / 363 ms |

All these navigations reported automated Accessibility/Best Practices/SEO 100. CLS medians: home mobile 0/0, desktop 0/0.0018; article mobile 0/0, desktop about 0.0006/0.0006. Do not equate category scores with manual compliance or infer statistical significance from three highly variable samples.

The earlier sequential controlled run (`final-controlled`) was much slower than the earlier baseline (`baseline-controlled`): home mobile 88 vs 98, desktop 67 vs 97, article mobile 33 vs 69, desktop 63 vs 84. Diagnostics also showed host benchmark indices falling from roughly 647 to 270 and broad parsing/layout delays, so those sequential scores cannot establish a code regression. Interleaving reduced the time-order bias, but did not eliminate host noise. Home mobile TBT still needs its focused confirmation rather than being described as improved: after range 54-1154 ms versus before 121-503 ms. The main long task is attributed to homepage script evaluation in both versions.

Focused `homepage-confirmation` used the final screen artifact (fingerprint `b509011ca304`) for another three paired mobile runs: before Performance 79 [68, 92], after 80 [71, 88]; TBT 353 [190, 764] versus 421 [257, 800] ms. The mobile performance target is not met in this host environment. An isolated pull-request runner comparison is required before the production decision; its full 24 JSON/HTML reports are retained as the `performance-review` CI artifact, excluding Chrome profiles. Final gate decisions and online version verification are recorded on [PR 19](https://github.com/wcx12/wcx12/pull/19), so this audit does not claim a release merely from a source commit.

Long-article DOM size remains about 8,000 nodes. A representative earlier controlled article transfer changed from 200,467 to 200,910 bytes (about +0.22%); no new public runtime library was added. Preserve existing tested JS byte budgets; do not invent a one-size-fits-all budget for the mathematical article. Offscreen layout containment was considered but not introduced without anchor/find/reading validation; it would be a separate measured optimization, not a score-only patch.

### Limits and remaining work

- No physical iOS/Android device, real Safari, screen reader, native IME, OS text scaling or physical 400% browser zoom test. Root-font 200% and 320 CSS-pixel reflow are explicit approximations, not those tests.
- Axe reported incomplete math/contrast checks and two arrow-span naming checks in the large diagram. Sampled computed text contrast passed on solid backgrounds, but image backgrounds, every interactive state and all non-text contrast combinations were not exhaustively measured. This is not a WCAG 2.2 AA certification.
- No real private-repository read/write/publish transaction, token creation or historical secret scan against external repositories. Synthetic session, authorization, sanitizer, withdrawal and deployment-boundary tests passed. Public source history is not private storage.
- No field CrUX or sufficient real-user data; no measured field p75 LCP/INP/CLS and no claim that lab TBT is INP. The long TIGER article still has about 8,000 DOM nodes. Retain its actual evidence and diagrams instead of deleting content to improve a score.
- Exact first-online dates, degree award, individual paper contributions and present applications/availability remain unconfirmed. No new claims added.

Rollback: use ordinary revert commit(s) for this branch's source changes, regenerate with pinned Node/npm dependencies, run gates, and deploy via the unchanged Pages workflow. Last verified production source is `35e38e1` (base `01c1f6b` has identical site assets). Do not reset/force-push or delete public history.
