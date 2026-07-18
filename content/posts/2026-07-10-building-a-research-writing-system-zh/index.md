---
title: "为我的主页搭建研究写作系统"
slug: "building-a-research-writing-system-zh"
translationKey: "building-a-research-writing-system"
translations:
  en: "building-a-research-writing-system"
date: "2026-07-10"
updated: "2026-07-18"
description: "这个主页如何把带版本管理的 Markdown、经过校验的媒体文件和研究元数据，变成一个可维护的静态写作系统。"
category: "Engineering"
tags: ["personal-site", "static-site", "research-workflow"]
research: []
featured: false
draft: false
math: false
toc: true
lang: "zh"
socialImage: "media/social-card.png"
socialImageAlt: "介绍经过校验的 Markdown 发布流程的 Research Fieldnotes 文章"
---

> English version: [Building a Research Writing System for My Homepage](../building-a-research-writing-system/)

这个写作空间放在互动主页旁边，而不是替代主页本身。主页仍然专注于研究方向、项目、论文和快速探索；更长的技术笔记则放在这里，用稳定的 URL、更适合阅读的排版，以及指向源材料的明确链接来承载。

![Markdown 和媒体文件会经过校验与确定性的构建流程，然后生成公开页面、搜索数据、RSS 和研究证据。](media/publishing-flow.png)

## 写作模型

创建一篇文章会生成一个自包含的文章目录：

```powershell title="Create a new post"
npm run new:post "Visual Place Recognition Notes"
```

```text title="Article bundle"
content/posts/2026-07-11-visual-place-recognition-notes/
  index.md
  media/
    retrieval-results.webp
```

Markdown 的 front matter 控制文章发现、研究映射、数学公式渲染、导航和发布状态。

```yaml title="Post metadata"
title: "Visual Place Recognition Notes"
slug: "visual-place-recognition-notes"
date: "2026-07-11"
updated: "2026-07-11"
category: "Computer Vision"
tags: ["vpr", "retrieval", "benchmark"]
research: ["vpr"]
draft: false
math: true
toc: true
```

本地文章图片使用可移植的 `media/...` 链接。构建流程会验证每个引用文件都真实存在、大小写完全匹配、位于当前文章目录内部、不是符号链接、符合允许的栅格图片格式签名，并且不超过发布体积限制。公开文章里的图片还必须提供有意义的替代文本。其他可下载材料则放在仓库或 release 中，而不是共享文章页面的同一来源。

## 发布状态

仓库里有三种明确状态：

- `draft: true` 会让文章保持私有，不受日期影响。
- 非草稿文章如果日期在未来，会进入定时发布状态。
- 非草稿文章如果日期已经到达站点时区，就会公开发布。

定时 workflow 会在 Asia/Shanghai 时区的午夜后不久重新构建站点。因为所有公开集合都来自同一份过滤后的文章列表，所以草稿或未来文章不会泄漏到搜索、标签、RSS、站点地图或研究证据中。

## 生成的证据

事实来源仍然是 GitHub 中的纯 Markdown 和带版本管理的媒体文件。构建流程会生成：

- 稳定的文章和归档 URL；
- 带语法高亮的代码块，以及可选的 KaTeX 数学公式；
- 标签页、搜索元数据、RSS 和 sitemap 条目；
- 当文章显式配置研究映射时，生成从相关研究方向到文章的链接；
- 内容指纹，避免浏览器在不同部署之间混用资源。

这第一篇笔记刻意保持简短，但它走过了以后用于更长实验日志、论文笔记、教程和工程复盘的同一条路径。

## 检查实现

上面的说明可以从公开实现中核验：

- [主页源码仓库](https://github.com/wcx12/wcx12)；
- [这篇文章的版本化 Markdown 源文件](https://github.com/wcx12/wcx12/blob/main/content/posts/2026-07-10-building-a-research-writing-system/index.md)；
- [内容校验与媒体策略](https://github.com/wcx12/wcx12/blob/main/scripts/blog-content.mjs)；
- [确定性的站点生成器](https://github.com/wcx12/wcx12/blob/main/scripts/build-blog.mjs)；
- [定时构建 workflow](https://github.com/wcx12/wcx12/blob/main/.github/workflows/blog-build.yml)。

[公开研究索引](https://wcx12.github.io/wcx12/research/) 仍然和这篇工程案例分开，所以站点基础设施不会被包装成研究证据。
