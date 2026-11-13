import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { evidenceForTopic } from './build-blog.mjs';
import { loadPosts, SITE } from './blog-content.mjs';
import { repositoryStageKey } from './portfolio-ranking.js';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const config = JSON.parse(await fs.readFile(new URL('research-config.json', root), 'utf8'));
const children = config.interests.flatMap((interest) => interest.children);
const agent = children.find((child) => child.id === 'agent');
const { posts } = await loadPosts(fileURLToPath(root));

test('Agent explicitly opts into indexing with public prototype evidence', () => {
  assert.equal(agent.indexable, true);
  for (const language of ['en', 'zh']) {
    const evidence = evidenceForTopic('agent', posts, language);
    const prototype = evidence.find((item) => item.key === 'repo:major-intel');
    assert.ok(prototype, `${language}: public Agent prototype must remain mapped`);
    assert.equal(repositoryStageKey(prototype.value), 'working_prototype');
  }
});

for (const language of ['en', 'zh']) {
  const prefix = language === 'zh' ? 'zh/' : '';
  test(`${language}: generated Agent page is indexable and appears once in sitemap`, async () => {
    const route = `${prefix}research/agent/`;
    const html = await fs.readFile(new URL(`${route}index.html`, root), 'utf8');
    assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large"/);
    const sitemap = await fs.readFile(new URL('sitemap.xml', root), 'utf8');
    assert.equal(sitemap.split(`<loc>${SITE.url}/${route}</loc>`).length - 1, 1);
  });

  test(`${language}: explicitly excluded topics remain noindex and outside sitemap`, async () => {
    const sitemap = await fs.readFile(new URL('sitemap.xml', root), 'utf8');
    for (const child of children.filter((item) => item.indexable === false)) {
      const route = `${prefix}research/${child.id}/`;
      const html = await fs.readFile(new URL(`${route}index.html`, root), 'utf8');
      assert.match(html, /<meta name="robots" content="noindex,follow"/);
      assert.ok(!sitemap.includes(`<loc>${SITE.url}/${route}</loc>`));
    }
  });
}
