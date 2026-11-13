# Navigation and research representation review

## Scope and decisions

The site remains a research portfolio, not the fictional commercial product in
the supplied visual reference. Borrow the reversible scan/reveal interaction,
not its branding, third-party photographs, prices or invented token savings.

- Global Research / Projects / Publications / Blog / Resume routes remain the
  primary navigation, with their existing bilingual URLs and content.
- Duplicate homepage browsers now live in a native, default-collapsed Interactive
  lab. Existing hash routes open it directly. README, topic demos, mapping and
  citation workflows remain available rather than being deleted.
- The former subject/3D preview is a second opt-in disclosure inside that lab.
  It is not loaded on the initial homepage. Point-cloud registration is retained.
- Homepage custom cursor, card tracking and cover replay controls are disabled.
  Covers stay as static visual references; text and links remain actionable.
- The new full-width comparison presents three public works as readable material
  and structured records. It is deterministic, not inference or compression.
  A native range and pointer dragging reverse the reveal; an explicit play action
  performs one six-second pass. No background conveyor or autonomous counter.
- Canvas is used only for a bounded dissolve edge. One animation request chain,
  DPR capped at two, hidden/offscreen/reduced-motion cancellation. Theme tokens
  are inherited; no new fonts, libraries or remote assets.

## Agent indexing

Agent has one public repository and falls below the default indexing score of
two. Its generated page therefore had noindex and was omitted from sitemap.
Explicit `indexable: true` uses the existing evidence-required override. The
working-prototype label is preserved. Both language pages and sitemap are tested.

## Source and release

Git transport to github.com failed twice. Authenticated GitHub API comparison
against main c609a5821fd32b301c623f20f812cd18e27de283 showed only 41 modified files.
Those were synchronized before edits into an independent local branch, with
snapshot commit 42be24d. Existing untracked .playwright-cli was not touched.
Do not push this snapshot ancestry to main: publish the change tree on top of
the verified current remote parent through a normal PR, as in the prior release.

## Verification evidence

Pre-change online inventory: D:/HuaweiMoveData/Users/Cory/Desktop/temp/website-navigation-20261113/.
New screenshots: D:/HuaweiMoveData/Users/Cory/Desktop/temp/navigation-scanner-review/.
Full regression output: output/navigation-e2e.log and
D:/HuaweiMoveData/Users/Cory/Desktop/temp/navigation-scanner-full/.
Build/content/link logs: output/navigation-{build,validate,links}.log.

Existing scene tests explicitly open the new lab disclosures; their substantive
scene assertions are retained. Static cover tests now assert hidden replay and
visible content, with the scanner as the explicit motion control. New tests cover
default collapsed state, representations, range keyboard use, three themes,
language paths and legacy hashes. No production release is implied by this file;
the PR and Pages run must separately record the final gate and online results.

Rollback uses an ordinary revert PR and the existing build/deployment pipeline;
do not rewrite history. Private note content and permission settings are unchanged.
