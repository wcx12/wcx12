# Site maintenance

This repository publishes the interactive portfolio, research index, profile,
and technical notes from one set of source files.

## Write a post

```bash
npm run new:post "Post Title"
npm run build:site
npm run validate
```

Posts live in `content/posts/`. Keep `draft: true` until a post is ready. Set
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

Publication state is determined in `Asia/Shanghai`: `draft: true` stays private;
a non-draft post with a future `date` is scheduled; an eligible non-draft post
is published. The scheduled GitHub workflow rebuilds shortly after local
midnight. Drafts and scheduled posts remain excluded from pages, search, RSS,
the sitemap, and research evidence.

Preview unpublished writing locally:

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

The self-hosted fonts in `assets/fonts/` retain their SIL Open Font License
files and must not be replaced without updating the accompanying provenance.
