---
title: "Building a Research Writing System for My Homepage"
slug: "building-a-research-writing-system"
date: "2026-07-10"
updated: "2026-07-10"
description: "A short note on turning this personal homepage into a maintainable research and technical writing space."
category: "Engineering"
tags: ["personal-site", "static-site", "research-workflow"]
research: ["agent", "ai4edu"]
series: "Homepage Lab"
featured: true
draft: false
math: false
toc: true
lang: "en"
---

This writing space is designed to sit beside the interactive profile page rather than replace it. The homepage stays focused on research, projects, publications, and quick exploration. Longer technical notes live here with stable URLs, cleaner typography, and better support for code, equations, tags, and search.

The workflow should stay simple:

```powershell title="Create a new post"
npm run new:post "Visual Place Recognition Notes"
```

Each post is a Markdown file with front matter. The metadata controls where the post appears, which research lanes it is connected to, whether math is enabled, and whether the article is still a draft.

```yaml title="Post metadata"
title: "Visual Place Recognition Notes"
slug: "visual-place-recognition-notes"
date: "2026-07-10"
updated: "2026-07-10"
category: "Computer Vision"
tags: ["vpr", "retrieval", "benchmark"]
research: ["vpr"]
draft: false
math: true
toc: true
```

The important part is that the writing system remains repository-native. The source of truth is still plain Markdown in GitHub, while the public site receives generated static pages that are fast, searchable, and easy to share.

## What this enables

- Research notes can be connected to point cloud registration, VPR, medical image analysis, agents, or AI for education.
- Code-heavy posts can use syntax highlighting and copy buttons.
- Longer posts can expose a table of contents without making short notes feel heavy.
- Sitemap output makes the writing section easier to index.

This first note is intentionally small. It exists as a working example of the content model and will be replaced naturally as more technical posts are added.
