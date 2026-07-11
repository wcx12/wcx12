# Site maintenance

This repository publishes the interactive portfolio, research index, profile,
and technical notes from one set of source files.

## Write a post

```bash
npm run new:post "Post Title"
npm run validate
npm run build:site
```

Posts live in `content/posts/`. Keep `draft: true` until a post is ready. Set
`math: true` whenever prose contains KaTeX formulas. Research mappings must use
an ID from `research-config.json` and should only be added when the article
actually concerns that research area.

## Update research evidence

- Add or update repository and publication records in `site-data.js`.
- Map records to research topics in `research-config.json`.
- Keep profile facts that are not generated from canonical data in `resume.md`.
- Leave the `{{PUBLICATIONS}}` marker in `resume.md`; the build replaces it with
  every canonical publication.

The owner mapping interface can update `research-config.json`, but canonical
repository and publication metadata still belongs in `site-data.js`.

## Generated output

`npm run build:site` writes `blog/`, `research/`, `publications/`, `zh/`,
`resume/`, `publications.md`, `rss.xml`, and `sitemap.xml`. Commit source and
generated changes together so pull-request quality checks can verify that the
public output is current.

## Verification

```bash
npm run validate
npm audit
```

The self-hosted fonts in `assets/fonts/` retain their SIL Open Font License
files and must not be replaced without updating the accompanying provenance.
