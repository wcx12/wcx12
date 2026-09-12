import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { profileData } from '../profile-data.js';
import { localRepos, staticPublications } from '../site-data.js';
import { loadPosts, slugify } from './blog-content.mjs';
import { deriveBlogDiscovery, postTranslationKey, selectLanguagePosts } from './blog-discovery.mjs';
import { classifyResearchTopic, publicationStatusLabel } from './portfolio-ranking.js';
import {
  blogArchiveBody,
  blogIndexBody,
  createMarkdownRenderer,
  evidenceForTopic,
  evidenceHtml,
  evidenceSections,
  hydrateResumeSource,
  personEntity,
  publicationCountSummary,
  publicationDatesHtml,
  publicationHighwireMeta,
  publicationResearchNotesHtml,
  publicationSchema,
  researchTopicBody,
  selectedProjectEvidence,
  variantCardsHtml
} from './build-blog.mjs';

// Importing the generator exposes pure renderers; these tests never build or write pages.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { posts } = await loadPosts(root, { today: '2026-09-12' });
const config = JSON.parse(await fs.readFile(path.join(root, 'research-config.json'), 'utf8'));
const children = config.interests.flatMap((interest) => interest.children);
const ctx = { link: (target) => `/${target.replace(/index\.html$/, '')}` };
const runtime = await fs.readFile(path.join(root, 'blog-src/assets/blog.js'), 'utf8');

function elements(html) {
  return [...html.matchAll(/<(?:a|li)\b[^>]*\bdata-post-group="([^"]+)"[^>]*>/g)].map(([tag, group]) => ({
    tag, group, lang: tag.match(/data-post-lang="([^"]+)"/)?.[1], hidden: /\shidden(?:\s|>)/.test(tag)
  }));
}

function clientFunction(name, context = {}) {
  const start = runtime.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing browser function ${name}`);
  const end = runtime.indexOf('\nfunction ', start + 1);
  return runInNewContext(`${runtime.slice(start, end)}\n${name};`, context);
}

test('blog and archive show exactly one English-first fallback per translation group without JS', () => {
  const expected = selectLanguagePosts(posts, 'en');
  assert.equal(expected.length, 3, 'fixture contains three unique articles');
  for (const html of [blogIndexBody(posts, ctx), blogArchiveBody(posts, ctx)]) {
    const visible = elements(html).filter((item) => !item.hidden);
    assert.equal(visible.length, 3);
    assert.equal(new Set(visible.map((item) => item.group)).size, 3);
    for (const post of expected) {
      assert.equal(visible.find((item) => item.group === postTranslationKey(post))?.lang, post.lang);
    }
    assert.match(html, /Chinese original/);
  }
});

test('fallback visibility is group-based and independent of source ordering', () => {
  const make = (slug, lang, translationKey) => ({ ...posts[0], slug, lang, translationKey, featured: false });
  const variants = [make('pair-zh', 'zh', 'pair'), make('only-zh', 'zh', 'only'), make('pair-en', 'en', 'pair')];
  for (const post of selectLanguagePosts(variants, 'en')) {
    const visible = elements(variantCardsHtml(ctx, variants, post)).filter((item) => !item.hidden);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].lang, post.lang);
  }
});

test('browser language selection keeps a single variant, including the Chinese-only article', () => {
  for (const currentLang of ['en', 'zh']) {
    const nodes = elements(blogIndexBody(posts, ctx)).map((item) => ({
      dataset: { postGroup: item.group, postLang: item.lang }, hidden: item.hidden
    }));
    const sync = clientFunction('syncPostLanguageVisibility', {
      currentLang, document: { querySelectorAll: () => nodes }
    });
    sync();
    const visible = nodes.filter((node) => !node.hidden);
    assert.equal(visible.length, 3);
    assert.equal(new Set(visible.map((node) => node.dataset.postGroup)).size, 3);
    for (const post of selectLanguagePosts(posts, currentLang)) {
      assert.equal(visible.find((node) => node.dataset.postGroup === postTranslationKey(post)).dataset.postLang, post.lang);
    }
  }
  const normalize = clientFunction('normalizeLang', { languages: ['en', 'zh'] });
  assert.equal(normalize('zh-CN'), 'zh');
  assert.equal(normalize('ZH-tw'), 'zh');
  assert.equal(normalize('en-US'), 'en');
  assert.match(runtime, /navigator\.languages\?\.\[0\] \|\| navigator\.language/);
  assert.match(runtime, /fixedLanguage \|\| readStorage\(LANG_KEY\) \|\| systemLanguage/);
  assert.match(runtime, /original_zh: 'Chinese original'/);
});

test('tag statistic equals the available tag links, without counting translation duplicates', () => {
  const display = selectLanguagePosts(posts, 'en');
  const discovery = deriveBlogDiscovery(display);
  const html = blogIndexBody(posts, ctx);
  const links = [...html.matchAll(/href="\/blog\/tags\/([^"]+)\/"/g)];
  assert.equal(links.length, discovery.activeTagEntries.length);
  assert.match(html, new RegExp(`<strong>${links.length}</strong> <span data-blog-i18n="stat_topics">`));
  for (const [tag, count] of discovery.activeTagEntries) {
    assert.ok(count >= 2);
    assert.ok(links.some(([, slug]) => slug === slugify(tag)));
  }
});

test('latest writing stays chronological and featured is a badge rather than a duplicate section', () => {
  const html = blogIndexBody(posts, ctx);
  const visible = elements(html).filter((item) => !item.hidden);
  const ordered = selectLanguagePosts(posts, 'en').sort((a, b) => b.date.localeCompare(a.date));
  assert.deepEqual(visible.map((item) => item.group), ordered.map(postTranslationKey));
  assert.match(html, /class="blog-featured-label"/);
  assert.doesNotMatch(html, /<h2[^>]*data-blog-i18n="section_featured_title"/);
  assert.doesNotMatch(html, /blog-stat-grid/);
  for (const region of ['hero', 'recent', 'topics']) assert.ok(html.includes(`data-blog-i18n="hint_${region}"`));
});

test('Chinese writing-system Markdown links directly to its own source', () => {
  const post = posts.find((item) => item.slug === 'building-a-research-writing-system-zh');
  const oldHref = 'https://github.com/wcx12/wcx12/blob/main/content/posts/2026-07-10-building-a-research-writing-system/index.md';
  const newHref = oldHref.replace('/2026-07-10-building-a-research-writing-system/', '/2026-07-10-building-a-research-writing-system-zh/');
  assert.ok(post.content.includes(newHref));
  assert.ok(!post.content.includes(oldHref));
  const rendered = createMarkdownRenderer().render(post.content, post).html;
  assert.ok(rendered.includes(`href="${newHref}"`));
  assert.ok(!rendered.includes(`href="${oldHref}"`));
});

test('TIGER variants map to one reading topic with no canvas or demo route', () => {
  const topic = children.find((child) => child.id === 'generative-retrieval');
  assert.equal(topic?.animation, 'none');
  const tiger = posts.filter((post) => post.translationKey === 'tiger-semantic-id-codebook-capacity');
  assert.equal(tiger.length, 2);
  assert.ok(tiger.every((post) => post.research.includes(topic.id)));
  const reading = posts.find((post) => post.slug === 'tiger-generative-retrieval-reading');
  assert.ok(reading.research.includes(topic.id));
  for (const language of ['en', 'zh']) {
    const html = researchTopicBody(posts, topic, language, ctx);
    assert.match(html, /data-topic-tier="exploring"/);
    assert.match(html, /href="#evidence-BlogPosting"/);
    assert.doesNotMatch(html, /<canvas|research-demo-link|\/demo/);
    const writing = evidenceForTopic(topic.id, posts, language).filter((item) => item.type === 'BlogPosting');
    assert.equal(writing.length, 2);
    if (language === 'en') assert.match(html, /Chinese original/);
    assert.equal(new Set(writing.map((item) => postTranslationKey(item.value))).size, writing.length);
    assert.equal(writing.find((item) => item.value.translationKey === tiger[0].translationKey).value.lang, language);
  }
});

test('teaching repositories stay Exploring and are not labelled AI research results', () => {
  const topic = children.find((child) => child.id === 'ai4edu');
  const evidence = evidenceForTopic(topic.id, posts);
  const teaching = evidence.filter((item) => item.type === 'SoftwareSourceCode');
  for (const name of ['shuxuepeiyou', 'hlpp-crossword', 'tetrahedron-visualizer']) {
    assert.ok(teaching.some((item) => item.value.name === name));
  }
  assert.equal(classifyResearchTopic(topic, teaching).tier, 'exploring');
  const html = evidenceSections(ctx, teaching, 'en');
  assert.match(html, /Related teaching practice/);
  assert.match(html, /not AI education research results or validated learning outcomes/);
  assert.doesNotMatch(html, /id="evidence-SoftwareSourceCode"/);
});

test('representative projects have real artifacts, stable anchors, setup links, and folded provenance', () => {
  const evidence = localRepos.map((value) => ({ type: 'SoftwareSourceCode', key: `repo:${value.name}`, value }));
  const selected = selectedProjectEvidence(evidence);
  assert.deepEqual(selected.map((item) => item.value.name), ['FusionTrack', 'major-intel', 'shuxuepeiyou']);
  for (const item of selected) {
    const html = evidenceHtml(ctx, item, 'en');
    assert.ok(html.includes(`id="project-${item.value.name}"`));
    assert.ok(html.includes(`${item.value.html_url}#readme`));
    assert.match(html, /class="project-artifact"/);
    assert.match(html, /<details class="project-provenance">/);
    assert.doesNotMatch(html, /<details class="project-provenance" open|<dt>Public evidence<\/dt>|<dt>Stage<\/dt>/);
    if (item.value.demo_url) assert.ok(html.includes(item.value.demo_url));
  }
  const fork = evidence.find((item) => item.value.fork);
  if (fork) assert.ok(evidenceHtml(ctx, fork, 'en').includes(fork.value.source.html_url));
});

test('optional paper notes are escaped, localized, and absent when missing', () => {
  assert.equal(publicationResearchNotesHtml({}, 'en'), '');
  assert.equal(publicationResearchNotesHtml({ research_notes: { result: { en: {} } } }, 'en'), '');
  const notes = { research_notes: { method: { en: 'Method <script>' }, result: { en: 'A & B', zh: 'result-zh' }, scope: { en: 'Limited to this experiment.' } } };
  const html = publicationResearchNotesHtml(notes, 'zh');
  assert.match(html, /result-zh/);
  assert.match(html, /Method &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(publicationResearchNotesHtml(notes, 'en', { compact: true }), /Method &lt;/);
  for (const publication of staticPublications) {
    const rendered = evidenceHtml(ctx, { type: 'ScholarlyArticle', value: publication }, 'en');
    assert.match(rendered, /class="publication-summary"/);
    assert.match(rendered, /Official implementation hosted by ddfs430/);
    assert.doesNotMatch(rendered, /Hosting note|not claimed as this profile/);
  }
});

test('online and issue dates are independent; legacy publication dates never imply online dates', () => {
  const paper = { ...staticPublications[0], title: 'Example', published_date: '2026-06-22', issue_date: '2026-10-28', issueLabel: { en: '28 October 2026' } };
  const html = publicationDatesHtml(paper, 'en');
  assert.match(html, /Issue date/);
  assert.match(html, /datetime="2026-10-28"/);
  assert.doesNotMatch(html, /Online publication|2026-06-22/);
  assert.doesNotMatch(publicationHighwireMeta(paper, '/paper/'), /citation_online_date/);
  assert.match(publicationDatesHtml({ ...paper, online_date: '2026-07-01' }, 'en'), /Online publication/);
  assert.match(publicationHighwireMeta({ ...paper, online_date: '2026-07-01' }, '/paper/'), /citation_online_date" content="2026\/07\/01"/);
  const scheduled = staticPublications.find((item) => item.slug === 'synergistic-learning-active-learning');
  assert.equal(scheduled.issue_date, '2026-10-28');
  const schema = publicationSchema(scheduled);
  assert.equal(schema.datePublished, scheduled.year);
  assert.notEqual(schema.datePublished, `${scheduled.year}-01-01`);
  assert.equal(schema.isPartOf.datePublished, scheduled.issue_date);
  assert.doesNotMatch(publicationHighwireMeta(scheduled, '/paper/'), /citation_online_date/);
  assert.equal(publicationStatusLabel(scheduled, 'en'), 'Issue scheduled');
  assert.match(publicationCountSummary(staticPublications, 'en'), /Issue scheduled/);
  assert.doesNotMatch(publicationCountSummary(staticPublications, 'en'), /In press|in press/);
});

test('resume source hydrates confirmed major, organization, role, and month-level dates', async () => {
  for (const language of ['en', 'zh']) {
    const source = await fs.readFile(path.join(root, language === 'zh' ? 'resume.zh.md' : 'resume.md'), 'utf8');
    const hydrated = hydrateResumeSource(source, language);
    assert.ok(hydrated.includes(profileData.education.major[language]));
    assert.ok(hydrated.includes(profileData.education.period[language]));
    assert.ok(hydrated.includes(profileData.experience.period[language]));
    assert.ok(hydrated.includes(profileData.experience.role[language]));
    assert.match(hydrated, /\{\{PUBLICATIONS\}\}/);
    assert.doesNotMatch(hydrated, /\{\{(?:EDUCATION|EXPERIENCE)_/);
  }
  const person = personEntity();
  assert.equal(person.homeLocation.name, profileData.location.en);
  assert.equal(person.alumniOf.name, profileData.education.institution.en);
  assert.equal(person.worksFor.name, profileData.experience.organization.en);
  assert.equal(person.jobTitle, undefined);
});

test('layout explicitly hides unselected variants and compacts the blog first screen', async () => {
  const css = await fs.readFile(path.join(root, 'blog-src/assets/blog.css'), 'utf8');
  assert.match(css, /\[data-post-group\]\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.blog-hero\.blog-index-hero\s*\{[^}]*padding:\s*24px 0/s);
  assert.match(css, /\.publication-research-notes > div\s*\{[^}]*minmax\(0, 1fr\)/s);
});

test('shared identity and demo modules are fingerprinted and copied into draft previews', async () => {
  const source = await fs.readFile(path.join(root, 'scripts/build-blog.mjs'), 'utf8');
  const fingerprint = source.slice(source.indexOf('async function computeAssetVersion('), source.indexOf('async function stampHomepageAssets('));
  const scaffold = source.slice(source.indexOf('const scaffold = ['), source.indexOf('for (const relativePath of scaffold)'));
  for (const filename of ['profile-data.js', 'research-demo-content.js']) {
    assert.ok(fingerprint.includes(`'${filename}'`));
    assert.ok(scaffold.includes(`'${filename}'`));
  }
  const shell = source.slice(source.indexOf('const shellText ='), source.indexOf('function hintHtml('));
  assert.match(shell, /nav_blog: 'Blog'/);
  assert.match(shell, /nav_profile: 'Resume'/);
  assert.doesNotMatch(shell, /nav_blog: 'Writing'|nav_profile: 'Profile'/);
});
