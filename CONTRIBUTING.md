# Site maintenance

This repository publishes the interactive portfolio, research index, profile,
and technical notes from one set of source files.

## Write a post

### Private research notes

This repository is **public**. A draft flag, hidden link or noindex directive
does not protect source files committed here.

Use [Private Notes](https://wcx12.github.io/wcx12/blog/drafts/) for private
writing. It authenticates directly to the separate private repository
`wcx12/wcx12-private-notes`. A fine-grained token needs Contents: Read and
write for that repository. Also select `wcx12` only when public publishing or
withdrawal is needed. No Actions, Administration or account permissions are
required. Never commit or send your token in a message.

- The editor verifies the authenticated owner and repository privacy.
- Tokens and loaded notes stay in page memory, not localStorage/sessionStorage.
  Closing, reloading or locking requires reconnecting. An idle, fully saved
  workspace locks after 15 minutes; unsaved edits postpone that lock to avoid
  losing work. Save before leaving; there is no browser autosave.
- Saving writes only to the private repository. Draft/complete is independent
  of visibility. Publishing requires a separate explicit confirmation.
- Public changes are committed to this repository and trigger Pages deployment.
  Check the linked deployment status; a successful commit is not a successful
  deployment.
- Existing public articles can be imported as working copies. Private saving
  does not update or hide their public versions. Language variants are managed
  separately.
- Withdrawal saves the private copy before deleting the current public Markdown.
  It does not erase public Git history, attachments, caches, forks or downloads.
- New notes currently support text, Markdown and formulas. External images are
  not loaded automatically in the authenticated preview. New local image bundles
  are not published by this editor; existing public bundles retain their files.
- Private GitHub storage is not end-to-end encryption. Repository collaborators,
  organization administrators where applicable, and GitHub may access the data.
  Keep the private repository private and restrict its collaborators.

The public editor is an empty shell: no private titles, content, attachments or
encoded drafts are deployed. The former draft payload workflow is disabled.

### Local writing and intentional publication

```bash
npm run new:post "Post Title"
npm run build:site
npm run validate
```

The scaffold command creates an ignored local draft under
`output/private-drafts/content/posts/`, not in the public source tree.
It is not a cloud backup. Do not force-add that directory to Git.

Only intentionally public articles belong in `content/posts/`. Set
`math: true` whenever prose contains KaTeX formulas. Research mappings must use
an ID from `research-config.json` and should only be added when the article
actually concerns that research area.

New posts use a self-contained bundle:

```text
content/posts/2026-07-11-example-note/
  index.md
  media/
    result-figure.webp
```

Reference local images as `media/result-figure.webp`. Media names must be
lowercase and portable. The validator only accepts PNG, JPEG, GIF, WebP, and
AVIF files whose signatures match their extensions. It rejects active formats
such as SVG/HTML, missing files, path traversal, symbolic links, files over 10
MB, case mismatches, and published images without alternative text. Only
referenced files are copied publicly; link other attachments from a repository
or release instead of serving them from the site origin.

For a page-specific share preview, add a 1200 x 630 PNG to the article's
`media/` directory and set `socialImage: "media/social-card.png"` plus a concise
`socialImageAlt`. The social card goes through the same signature, path, size,
and symlink checks as images embedded in the article.

Publication state is determined in `Asia/Shanghai`: `draft: true` stays off the site
but is **not confidential** if its source is in this public repository;
a non-draft post with a future `date` is scheduled; an eligible non-draft post
is published. The scheduled GitHub workflow rebuilds shortly after local
midnight. Drafts and scheduled posts remain excluded from pages, search, RSS,
the sitemap, and research evidence.

For local previews of public-repository draft material:

```bash
npm run preview:blog
```

Open `http://127.0.0.1:4173/` and stop the server with `Ctrl+C`. The server only
exposes the generated `output/preview/` tree, which is ignored by Git.

## Update research evidence

- Add or update repository and publication records in `site-data.js`.
- Map records to research topics in `research-config.json`.
- Keep profile facts that are not generated from canonical data synchronized in
  `resume.md` and `resume.zh.md`.
- Leave the `{{PUBLICATIONS}}` marker in both resume source files; the build replaces it with
  every canonical publication.

The owner mapping interface prepares a token-free update payload for the
`Update research mapping` GitHub Actions workflow. Repository write access is
handled only by the authenticated GitHub workflow UI; canonical repository and
publication metadata still belongs in `site-data.js`.

Public GitHub repository metadata is synchronized shortly after midnight in
`Asia/Shanghai`, and can be refreshed locally with `npm run sync:repos`. The
sync updates API-owned fields such as repository availability, stars, language,
default branch, and update time. It preserves curated descriptions, maturity,
public-evidence notes, demos, and research mappings. New repositories are added
as unclassified public records; they are never assigned to a research area
without an explicit mapping. New forks retain upstream attribution.

## Topic interactions

`research-canvas.js` retains the point-cloud registration renderer.
`topic-experiences.js` lazy-loads the other bounded, bilingual interactions:
`topic-perception.js/css` for place recognition and annotation, and
`topic-workbench.js/css` for scheduling and geometry. Preserve each interaction's
state when switching topics; do not add a background animation loop or present
synthetic examples as measured research results. Adding an asset requires updating
both the build fingerprint/preview scaffold and the Pages allowlist.

Behavior tests are in `scripts/research-demo.test.mjs` and
`scripts/e2e/topics.spec.mjs`. `scripts/qa/topic-audit.mjs <artifact-url> <phase>`
captures bilingual, three-theme screenshots and scoped accessibility reports.
See `docs/topic-experiences-20260926.md` for the redesign decisions and evidence.

## Generated output

`npm run build:site` writes `blog/`, `research/`, `projects/`, `publications/`,
`zh/`, `resume/`, `publications.md`, `rss.xml`, and `sitemap.xml`. Commit source
and generated changes together so pull-request quality checks can verify that
the public output is current. The build fingerprints executable, stylesheet,
data, and article-media requests so one deployment cannot reuse stale browser
assets.

`npm run build:pages` additionally creates and validates `output/pages/`. GitHub
Pages deploys only this explicit artifact allowlist; source Markdown, workflows,
authoring scripts, dependencies, drafts, and scheduled posts are never uploaded
to the public site.

## Verification

```bash
npm run validate
npm run build:pages
npm audit
```

For browser changes, install the pinned test browsers and test the packaged
project-path artifact (not the repository root):

```bash
npx playwright install chromium firefox webkit
npm run build:pages
npm run test:e2e
npm run test:links
```

The suite starts and stops its own loopback-only artifact server. Browser traces
and JSON reports are written under ignored `output/site-quality-20260926/`.
`PLAYWRIGHT_BASE_URL` can target another already-running artifact server; do not
run network-abort tests against an authenticated author session. Fixtures use
synthetic private notes, never real private content or stored credentials.
`PLAYWRIGHT_OUTPUT_DIR` selects a separate ignored report directory for a new run.

Keep shared colors, type scales and font resources in `site-tokens.css`. It is
fingerprinted with the rest of the release. Do not duplicate its definitions
in the homepage and content stylesheets. Bilingual article URLs are fixed
language routes; the navigation language link opens their actual translation.
Single-language writing is explicitly marked as an original, not auto-translated.

For a controlled performance comparison, copy the pre-change public artifact
under `output/`, serve both revisions with `scripts/qa/serve.mjs`, and run
`node scripts/qa/performance.mjs <phase> <after-url> <before-url>` without concurrent
CPU-heavy jobs. This alternates revisions within each measurement pair to expose
host-load drift instead of attributing it to the code. The script records artifact
hashes and rejects an artifact changed during measurement. It runs three cold navigations for homepage/article and
mobile/desktop, retains raw Lighthouse reports/configuration and reports median
and range. Those are lab measurements, not field INP or a WCAG certification.

Release only after content/build/artifact and browser checks, visual inspection,
and no unresolved critical task failures. Record the source commit and current
successful Pages run. Use the existing Pages workflow and approvals, then check
actual hosted pages and fingerprints. A workflow success alone does not verify
the live version. Roll back with a normal revert commit, regenerate and validate,
and redeploy through the same workflow; never force-push or reset shared history.

The dated audit in `docs/site-quality-20260926.md` links the evidence, limitations
and release record for this optimization. Reports, profiles and screenshots must
remain outside the Pages allowlist.

The self-hosted fonts in `assets/fonts/` retain their SIL Open Font License
files and must not be replaced without updating the accompanying provenance.
