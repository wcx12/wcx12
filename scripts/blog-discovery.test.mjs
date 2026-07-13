import assert from 'node:assert/strict';
import test from 'node:test';
import { blogTopicCounts, deriveBlogDiscovery } from './blog-discovery.mjs';

function posts(count, options = {}) {
  return Array.from({ length: count }, (_, index) => ({
    slug: `post-${index + 1}`,
    date: `${options.years?.[index] || 2026}-07-${String(index + 1).padStart(2, '0')}`,
    category: index % 2 ? 'Research' : 'Engineering',
    tags: options.tags?.[index] || ['shared', `tag-${index + 1}`],
    featured: options.featured?.includes(index) || false
  }));
}

test('blog discovery models empty and single-post states without thin navigation', () => {
  const empty = deriveBlogDiscovery([]);
  assert.equal(empty.state, 'empty');
  assert.deepEqual(empty.recent, []);
  assert.equal(empty.showSearch, false);
  assert.equal(empty.archive.discoverable, false);

  const single = deriveBlogDiscovery(posts(1));
  assert.equal(single.state, 'single');
  assert.equal(single.recent.length, 1);
  assert.equal(single.featured.length, 0);
  assert.equal(single.activeTags.size, 0);
  assert.equal(single.archive.indexable, false);
});

test('shared tags become browseable while single-use tags stay inert', () => {
  const discovery = deriveBlogDiscovery(posts(2));
  assert.deepEqual(discovery.activeTagEntries, [['shared', 2]]);
  assert.equal(discovery.activeTags.has('shared'), true);
  assert.equal(discovery.activeTags.has('tag-1'), false);
  assert.deepEqual(blogTopicCounts(posts(2), 'category'), [['Engineering', 1], ['Research', 1]]);
});

test('small collections show every post once and only promote a cross-year archive', () => {
  for (const count of [2, 3, 6]) {
    const discovery = deriveBlogDiscovery(posts(count, { featured: [0, 1] }));
    assert.equal(discovery.state, 'small');
    assert.equal(discovery.featured.length, 0);
    assert.equal(discovery.recent.length, count);
    assert.equal(new Set(discovery.recent.map((post) => post.slug)).size, count);
    assert.equal(discovery.showSearch, false);
    assert.equal(discovery.archive.discoverable, false);
  }

  const crossYear = deriveBlogDiscovery(posts(2, { years: [2025, 2026] }));
  assert.equal(crossYear.archive.discoverable, true);
  assert.equal(crossYear.archive.indexable, true);
});

test('catalog collections keep featured and recent writing mutually exclusive', () => {
  const discovery = deriveBlogDiscovery(posts(7, { featured: [0, 2, 6] }));
  const featured = new Set(discovery.featured.map((post) => post.slug));
  const recent = new Set(discovery.recent.map((post) => post.slug));
  assert.equal(discovery.state, 'catalog');
  assert.equal(discovery.showSearch, true);
  assert.equal(discovery.archive.discoverable, true);
  assert.equal(discovery.featured.length, 3);
  assert.equal(discovery.recent.length, 4);
  assert.deepEqual([...featured].filter((slug) => recent.has(slug)), []);
});
