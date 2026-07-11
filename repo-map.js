let repoMapInstance = null;

export function createRepoMap(options) {
  if (repoMapInstance) return repoMapInstance;

  const { getContext, getInterestEntries, openRepo, openResearch, requestMotionFrame = () => {} } = options;
  const repoMap = document.getElementById('repoMap');
  const repoMapCtx = repoMap?.getContext('2d');
  const repoMapHint = document.getElementById('repoMapHint');
  const compactRepoMapMotionQuery = window.matchMedia('(max-width: 720px), (hover: none), (pointer: coarse)');
  const themeColorCache = new Map();
  const MAX_CANVAS_DPR = 2;
  const REPO_MAP_DESKTOP_FRAME_MS = 96;
  const REPO_MAP_MOBILE_IDLE_FRAME_MS = 200;
  let currentLang = 'en';
  let currentTheme = 'neon';
  let i18n = {};
  let filteredRepos = [];
  let highlightedRepo = null;
  let repoNodes = [];
  let repoMapFieldNodes = [];
  let hoveredRepo = null;
  let hoveredMapField = null;
  let repoMapTick = 0;
  let lastRepoMapFrame = 0;
  let repoMapVisible = !('IntersectionObserver' in window);
  let repoMapSize = { width: 0, height: 0, scale: 1 };

  function syncContext() {
    const context = getContext();
    currentLang = context.lang;
    currentTheme = context.theme;
    i18n = context.i18n;
    filteredRepos = context.repos;
    highlightedRepo = context.highlightedRepo;
  }

  function sortedRepos(repos) {
    return getContext().sortedRepos(repos);
  }

  function allInterestChildren() {
    return getContext().interests.flatMap((domain) => domain.children.map((child) => ({ domain, child })));
  }

  function assignedInterestIds(repo) {
    return getInterestEntries(repo).map((entry) => entry.child.id);
  }

  function textFor(value) {
    if (typeof value === 'string') return value;
    return value?.[currentLang] || value?.en || '';
  }

  function repoInterestEntries(repo) {
    return getInterestEntries(repo);
  }

  function repoMappingLabel(repo) {
    return repoInterestEntries(repo).map((entry) => textFor(entry.child.title)).join(' + ');
  }

  function openRepoDetail(repoName) {
    openRepo(repoName);
  }

  function jumpToResearchInterest(interestId) {
    openResearch(interestId);
  }

  function isProjectsViewActive() {
    return document.getElementById('projects')?.classList.contains('active');
  }

  function updateRepoMapSize(width, height) {
    if (!repoMap || !repoMapCtx) return false;
    const scale = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);
    const cssWidth = Math.max(0, width);
    const cssHeight = Math.max(0, height);
    const pixelWidth = Math.max(1, Math.floor(cssWidth * scale));
    const pixelHeight = Math.max(1, Math.floor(cssHeight * scale));
    const changed = repoMap.width !== pixelWidth
      || repoMap.height !== pixelHeight
      || repoMapSize.width !== cssWidth
      || repoMapSize.height !== cssHeight
      || repoMapSize.scale !== scale;
    if (repoMap.width !== pixelWidth) repoMap.width = pixelWidth;
    if (repoMap.height !== pixelHeight) repoMap.height = pixelHeight;
    repoMapCtx.setTransform(scale, 0, 0, scale, 0, 0);
    repoMapSize = { width: cssWidth, height: cssHeight, scale };
    return changed;
  }

  function measureRepoMapSize() {
    if (!repoMap) return false;
    const rect = repoMap.getBoundingClientRect();
    return updateRepoMapSize(rect.width, rect.height);
  }

  function colorWithAlpha(color, alpha) {
    const value = String(color || '').trim();
    let hex = value;
    if (/^#[0-9a-f]{3}$/i.test(hex)) hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      const number = Number.parseInt(hex.slice(1), 16);
      return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
    }
    if (value.startsWith('rgb(')) return value.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    return `rgba(255, 255, 255, ${alpha})`;
  }

  function hashString(value) {
    return String(value).split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  }

  function fillTruncatedText(ctx, text, x, y, maxWidth) {
    let value = String(text || '');
    if (ctx.measureText(value).width <= maxWidth) {
      ctx.fillText(value, x, y);
      return;
    }
    while (value.length > 1 && ctx.measureText(`${value}...`).width > maxWidth) value = value.slice(0, -1);
    ctx.fillText(`${value}...`, x, y);
  }

  function themeColor(name) {
    if (themeColorCache.has(name)) return themeColorCache.get(name);
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    themeColorCache.set(name, value);
    return value;
  }

function repoColor(language) {
  if (currentTheme === 'mono') {
    const monoPalette = {
      JavaScript: '#f2f2f2',
      TypeScript: '#d4d4d4',
      Python: '#b6b6b6',
      TeX: '#989898',
      HTML: '#7a7a7a'
    };
    const fallback = ['#e3e3e3', '#c5c5c5', '#a7a7a7', '#898989', '#6b6b6b'];
    return monoPalette[language]
      || fallback[Math.abs(hashString(String(language || 'Mixed'))) % fallback.length];
  }
  if (currentTheme === 'warm') {
    const warmPalette = {
      JavaScript: '#f2b84b',
      TypeScript: '#df7a5e',
      Python: '#c78b52',
      TeX: '#e09f3e',
      HTML: '#b86b4b'
    };
    const fallback = ['#d9a441', '#d47d5d', '#bd8455', '#e0a03f', '#aa684e'];
    return warmPalette[language]
      || fallback[Math.abs(hashString(String(language || 'Mixed'))) % fallback.length];
  }
  const palette = {
    JavaScript: '#00f5ff',
    TypeScript: '#62a8ff',
    Python: '#ffd166',
    TeX: '#ff2e88',
    HTML: '#9b5cff'
  };
  return palette[language] || '#8ee6a8';
}

function researchMapPalette() {
  if (document.documentElement.dataset.theme === 'mono') {
    return ['#f5f5f5', '#d8d8d8', '#bdbdbd', '#9f9f9f', '#7f7f7f'];
  }
  return [
    themeColor('--cyan') || '#00f5ff',
    themeColor('--pink') || '#ff2e88',
    themeColor('--violet') || '#9b5cff',
    '#8ee6a8',
    '#ffd166'
  ];
}

function repoInterestEntries(repo) {
  const entriesById = new Map(allInterestChildren().map((entry) => [entry.child.id, entry]));
  return [...new Set(assignedInterestIds(repo, 'repo'))]
    .map((id) => entriesById.get(id))
    .filter(Boolean);
}

function repoMappingLabel(repo) {
  const entries = repoInterestEntries(repo);
  if (!entries.length) return '';
  return entries.map((entry) => textFor(entry.child.title)).join(' + ');
}

function repoMapGroupKey(entries) {
  return entries.map((entry) => entry.child.id).sort().join('+');
}

function researchMapAnchors(width, height) {
  const entries = allInterestChildren();
  const compact = width < 520;
  const colors = researchMapPalette();
  const rows = Math.ceil(entries.length / 2);
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = Math.max(82, width * 0.34);
  const radiusY = Math.max(54, height * 0.28);

  return entries.map((entry, index) => {
    let x;
    let y;
    if (compact) {
      const col = index % 2;
      const row = Math.floor(index / 2);
      x = width * (col ? 0.72 : 0.28);
      y = 62 + row * ((height - 124) / Math.max(1, rows - 1));
    } else {
      const angle = (Math.PI * 2 * index) / Math.max(1, entries.length) - Math.PI / 2;
      x = centerX + Math.cos(angle) * radiusX;
      y = centerY + Math.sin(angle) * radiusY;
    }
    return {
      ...entry,
      id: entry.child.id,
      index,
      x,
      y,
      r: compact ? 34 : 44,
      color: colors[index % colors.length],
      domainTitle: textFor(entry.domain.title),
      childTitle: textFor(entry.child.title),
      mapTitle: entry.child.id === 'ai4edu' ? (currentLang === 'zh' ? 'AI4教育' : 'AI4Edu') : textFor(entry.child.title),
      label: textFor(entry.child.label)
    };
  });
}

function renderRepoMap(repos = filteredRepos) {
  const { width, height } = repoMapSize;
  if (width < 2 || height < 2) return;
  repoMapCtx.clearRect(0, 0, width, height);

  const items = sortedRepos(repos).filter((repo) => repoInterestEntries(repo).length);
  repoNodes = [];
  repoMapFieldNodes = [];
  const compact = width < 520;
  const primary = themeColor('--cyan') || '#00f5ff';
  const muted = themeColor('--muted') || '#9ca9cf';
  const textColor = themeColor('--text') || '#e8f0ff';

  repoMapCtx.strokeStyle = 'rgba(0, 245, 255, 0.12)';
  repoMapCtx.lineWidth = 1;
  for (let x = 40; x < width; x += 70) {
    repoMapCtx.beginPath();
    repoMapCtx.moveTo(x, 18);
    repoMapCtx.lineTo(x, height - 18);
    repoMapCtx.stroke();
  }
  for (let y = 35; y < height; y += 56) {
    repoMapCtx.beginPath();
    repoMapCtx.moveTo(18, y);
      repoMapCtx.lineTo(width - 18, y);
      repoMapCtx.stroke();
    }

  repoMapCtx.fillStyle = muted;
  repoMapCtx.font = compact ? '8.5px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
  fillTruncatedText(
    repoMapCtx,
    compact ? 'Grouped by research mapping' : 'Projects grouped by mapped research interest · shared projects sit between fields',
    18,
    20,
    width - 36
  );

  if (!items.length) {
    repoMapCtx.fillStyle = 'rgba(232, 240, 255, 0.72)';
    repoMapCtx.font = '14px JetBrains Mono, monospace';
    repoMapCtx.fillText(i18n[currentLang].no_repos, 22, 42);
    return;
  }

  const anchors = researchMapAnchors(width, height);
  const mapAnchors = anchors;
  repoMapFieldNodes = mapAnchors;
  const anchorById = new Map(mapAnchors.map((anchor) => [anchor.id, anchor]));
  const contexts = items.map((repo, index) => {
    const entries = repoInterestEntries(repo);
    return { repo, index, entries, key: repoMapGroupKey(entries) };
  });
  const groups = new Map();
  contexts.forEach((context) => {
    if (!groups.has(context.key)) groups.set(context.key, []);
    groups.get(context.key).push(context.index);
  });

  mapAnchors.forEach((anchor) => {
    const active = hoveredMapField === anchor.id || (hoveredRepo && contexts.some((context) => (
      context.repo.name === hoveredRepo && (
        context.entries.some((entry) => entry.child.id === anchor.id)
      )
    )));
    const pulse = 2 + (Math.sin(repoMapTick * 0.035 + anchor.index) + 1) * 2;
    repoMapCtx.beginPath();
    repoMapCtx.arc(anchor.x, anchor.y, anchor.r + pulse, 0, Math.PI * 2);
    repoMapCtx.fillStyle = colorWithAlpha(anchor.color, active ? 0.16 : 0.07);
    repoMapCtx.fill();
    repoMapCtx.strokeStyle = colorWithAlpha(anchor.color, active ? 0.62 : 0.32);
    repoMapCtx.lineWidth = active ? 1.7 : 1;
    repoMapCtx.stroke();
    repoMapCtx.fillStyle = active ? textColor : anchor.color;
    repoMapCtx.font = compact ? '9px JetBrains Mono, monospace' : '10px JetBrains Mono, monospace';
    fillTruncatedText(repoMapCtx, anchor.mapTitle, anchor.x - anchor.r + 7, anchor.y - 3, anchor.r * 2 - 14);
    repoMapCtx.fillStyle = muted;
    repoMapCtx.font = compact ? '7.5px JetBrains Mono, monospace' : '8px JetBrains Mono, monospace';
    fillTruncatedText(repoMapCtx, anchor.domainTitle, anchor.x - anchor.r + 7, anchor.y + 11, anchor.r * 2 - 14);
  });

  contexts.forEach((context) => {
    const anchorRefs = context.entries.map((entry) => anchorById.get(entry.child.id)).filter(Boolean);
    const group = groups.get(context.key) || [];
    const slot = Math.max(0, group.indexOf(context.index));
    const total = Math.max(1, group.length);
    const baseX = anchorRefs.length
      ? anchorRefs.reduce((sum, anchor) => sum + anchor.x, 0) / anchorRefs.length
      : width / 2;
    const baseY = anchorRefs.length
      ? anchorRefs.reduce((sum, anchor) => sum + anchor.y, 0) / anchorRefs.length
      : height / 2;
    const hash = Math.abs(hashString(context.repo.name));
    const slotAngle = total > 1 ? (Math.PI * 2 * slot) / total : (hash % 360) * Math.PI / 180;
    const drift = Math.sin(repoMapTick * 0.018 + hash * 0.01) * 2.2;
    const spread = anchorRefs.length > 1
      ? (compact ? 12 : 18)
      : (anchorRefs[0]?.r || (compact ? 34 : 44)) + (compact ? 8 : 12);
    const x = Math.max(18, Math.min(width - 18, baseX + Math.cos(slotAngle) * spread + drift));
    const y = Math.max(32, Math.min(height - 18, baseY + Math.sin(slotAngle) * spread * 0.72));
    const size = Math.min(compact ? 10 : 13, 6 + Math.min(6, context.repo.stargazers_count * 2.4) + Math.min(3, context.repo.name.length / 12));
    repoNodes.push({
      repo: context.repo,
      x,
      y,
      r: size,
      color: repoColor(context.repo.language),
      anchors: anchorRefs,
      entries: context.entries,
      hash
    });
  });

  repoNodes.forEach((node) => {
    const active = hoveredRepo === node.repo.name || highlightedRepo === node.repo.name;
    node.anchors.forEach((anchor) => {
      repoMapCtx.beginPath();
      repoMapCtx.moveTo(anchor.x, anchor.y);
      repoMapCtx.lineTo(node.x, node.y);
      repoMapCtx.strokeStyle = colorWithAlpha(anchor.color, active ? 0.52 : 0.16);
      repoMapCtx.lineWidth = active ? 1.8 : 1;
      repoMapCtx.stroke();

      const flow = (repoMapTick * 0.008 + (node.hash % 100) / 100) % 1;
      const dotX = anchor.x + (node.x - anchor.x) * flow;
      const dotY = anchor.y + (node.y - anchor.y) * flow;
      repoMapCtx.beginPath();
      repoMapCtx.arc(dotX, dotY, active ? 2.4 : 1.5, 0, Math.PI * 2);
      repoMapCtx.fillStyle = colorWithAlpha(anchor.color, active ? 0.9 : 0.42);
      repoMapCtx.fill();
    });
  });

  repoNodes.forEach((node) => {
    const active = hoveredRepo === node.repo.name || highlightedRepo === node.repo.name;
    const multi = node.anchors.length > 1;
    repoMapCtx.beginPath();
    repoMapCtx.arc(node.x, node.y, active ? node.r + 6 : node.r + 3, 0, Math.PI * 2);
    repoMapCtx.fillStyle = active ? colorWithAlpha(node.color, 0.24) : colorWithAlpha(primary, 0.07);
    repoMapCtx.fill();

    if (multi) {
      const segment = (Math.PI * 2) / node.anchors.length;
      node.anchors.forEach((anchor, index) => {
        repoMapCtx.beginPath();
        repoMapCtx.arc(node.x, node.y, active ? node.r + 2.5 : node.r + 1.5, index * segment - Math.PI / 2, (index + 0.72) * segment - Math.PI / 2);
        repoMapCtx.strokeStyle = colorWithAlpha(anchor.color, active ? 0.95 : 0.72);
        repoMapCtx.lineWidth = active ? 2.4 : 1.7;
        repoMapCtx.stroke();
      });
    }

    repoMapCtx.beginPath();
    repoMapCtx.arc(node.x, node.y, active ? node.r : node.r * 0.72, 0, Math.PI * 2);
    repoMapCtx.fillStyle = node.color;
    repoMapCtx.fill();
    repoMapCtx.strokeStyle = active ? textColor : colorWithAlpha(textColor, 0.42);
    repoMapCtx.lineWidth = active ? 1.6 : 0.8;
    repoMapCtx.stroke();

    if (active) {
      const labelX = Math.min(Math.max(node.x + 12, 12), width - (active ? 210 : 140));
      const labelY = Math.max(node.y - 9, 35);
      repoMapCtx.fillStyle = active ? textColor : colorWithAlpha(textColor, 0.84);
      repoMapCtx.font = active ? '11px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace';
      fillTruncatedText(repoMapCtx, node.repo.name, labelX, labelY, active ? 190 : 128);
      repoMapCtx.fillStyle = muted;
      repoMapCtx.font = '8px JetBrains Mono, monospace';
      fillTruncatedText(repoMapCtx, repoMappingLabel(node.repo), labelX, labelY + 12, 190);
    }
  });
}

function repoMapPointer(event) {
  return {
    x: Math.max(0, Math.min(repoMapSize.width, Number(event.offsetX) || 0)),
    y: Math.max(0, Math.min(repoMapSize.height, Number(event.offsetY) || 0))
  };
}

repoMap.addEventListener('mousemove', (event) => {
  const pointer = repoMapPointer(event);
  const hit = repoNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  const fieldHit = hit ? null : repoMapFieldNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  hoveredRepo = hit ? hit.repo.name : null;
  hoveredMapField = fieldHit ? fieldHit.id : null;
  repoMap.style.cursor = hit || fieldHit ? 'pointer' : 'default';
  repoMapHint.textContent = hit
    ? `${hit.repo.name} · ${repoMappingLabel(hit.repo)} · ${hit.repo.language || i18n[currentLang].mixed} · ${i18n[currentLang].star} ${hit.repo.stargazers_count}`
    : fieldHit
      ? `${fieldHit.mapTitle} · ${fieldHit.domainTitle}`
      : i18n[currentLang].repo_map_hint;
  renderRepoMap(filteredRepos);
});

repoMap.addEventListener('mouseleave', () => {
  hoveredRepo = null;
  hoveredMapField = null;
  repoMapHint.textContent = i18n[currentLang].repo_map_hint;
  renderRepoMap(filteredRepos);
});

repoMap.addEventListener('click', (event) => {
  const pointer = repoMapPointer(event);
  const hit = repoNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  const fieldHit = hit ? null : repoMapFieldNodes.find((node) => Math.hypot(pointer.x - node.x, pointer.y - node.y) <= node.r + 8);
  if (hit) openRepoDetail(hit.repo.name);
  else if (fieldHit) jumpToResearchInterest(fieldHit.id);
});

  function render() {
    if (!repoMap || !repoMapCtx) return;
    if (repoMapSize.width < 2 || repoMapSize.height < 2) measureRepoMapSize();
    syncContext();
    renderRepoMap(filteredRepos);
  }

  function resize() {
    measureRepoMapSize();
    render();
  }

  function frameInterval() {
    return compactRepoMapMotionQuery.matches ? REPO_MAP_MOBILE_IDLE_FRAME_MS : REPO_MAP_DESKTOP_FRAME_MS;
  }

  function frame(timestamp = 0) {
    const context = getContext();
    if (context.reducedMotion || document.visibilityState !== 'visible' || !repoMapVisible || !isProjectsViewActive()) return false;
    if (timestamp - lastRepoMapFrame < frameInterval()) return false;
    lastRepoMapFrame = timestamp;
    repoMapTick += 1;
    render();
    return true;
  }

  function contextChanged() {
    syncContext();
    themeColorCache.clear();
    lastRepoMapFrame = 0;
    if (!hoveredRepo && repoMapHint) repoMapHint.textContent = i18n[currentLang].repo_map_hint;
    if (isProjectsViewActive() && repoMapVisible) renderRepoMap(filteredRepos);
  }

  syncContext();
  measureRepoMapSize();

  if ('ResizeObserver' in window && repoMap) {
    const resizeObserver = new ResizeObserver(([entry]) => {
      const rect = entry?.contentRect;
      if (!rect || !updateRepoMapSize(rect.width, rect.height)) return;
      if (isProjectsViewActive() && repoMapVisible) render();
      requestMotionFrame({ immediate: true });
    });
    resizeObserver.observe(repoMap);
  }

  if ('IntersectionObserver' in window && repoMap) {
    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = Boolean(entry?.isIntersecting);
      if (repoMapVisible === nextVisible) return;
      repoMapVisible = nextVisible;
      lastRepoMapFrame = 0;
      if (nextVisible && isProjectsViewActive() && document.visibilityState === 'visible') render();
      requestMotionFrame({ immediate: nextVisible });
    }, { threshold: 0.05 });
    observer.observe(repoMap);
  }

  compactRepoMapMotionQuery.addEventListener?.('change', () => {
    lastRepoMapFrame = 0;
    if (isProjectsViewActive() && repoMapVisible) requestMotionFrame({ immediate: true });
  });

  repoMapInstance = {
    cadence: frameInterval,
    contextChanged,
    frame,
    isVisible: () => repoMapVisible,
    render,
    resize,
    scrollIntoView: () => repoMap?.scrollIntoView({ behavior: context.reducedMotion ? 'auto' : 'smooth', block: 'center' })
  };
  requestMotionFrame({ immediate: true });
  return repoMapInstance;
}
