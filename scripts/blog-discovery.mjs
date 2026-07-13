export function blogTopicCounts(posts, key) {
  const counts = new Map();
  posts.forEach((post) => {
    const values = key === 'tags' ? post.tags : [post.category];
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

export function deriveBlogDiscovery(posts) {
  const state = posts.length === 0
    ? 'empty'
    : posts.length === 1
      ? 'single'
      : posts.length <= 6
        ? 'small'
        : 'catalog';
  const activeTagEntries = blogTopicCounts(posts, 'tags').filter(([, count]) => count >= 2);
  const activeTags = new Set(activeTagEntries.map(([tag]) => tag));
  const featured = state === 'catalog' ? posts.filter((post) => post.featured).slice(0, 3) : [];
  const featuredSlugs = new Set(featured.map((post) => post.slug));
  const recent = posts.filter((post) => !featuredSlugs.has(post.slug)).slice(0, 6);
  const years = new Set(posts.map((post) => post.date.slice(0, 4)));
  const archiveDiscoverable = posts.length > 6 || years.size > 1;

  return {
    state,
    recent,
    featured,
    activeTagEntries,
    activeTags,
    showSearch: state === 'catalog',
    showStats: posts.length >= 3,
    archive: {
      render: true,
      discoverable: archiveDiscoverable,
      indexable: archiveDiscoverable
    }
  };
}
