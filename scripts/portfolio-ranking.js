export const REPOSITORY_STAGE_PRIORITY = Object.freeze({
  research_repository: 0,
  working_prototype: 1,
  interactive_demo: 2,
  teaching_materials: 3,
  deployed_website: 4,
  public_repository: 5,
  coursework: 6,
  planning: 7,
  archived_repository: 8,
  upstream_fork: 9,
  unknown: 10
});

export const REPOSITORY_STAGE_LABELS = Object.freeze({
  research_repository: Object.freeze({ en: 'Research repository', zh: '研究仓库' }),
  working_prototype: Object.freeze({ en: 'Working prototype', zh: '可运行原型' }),
  interactive_demo: Object.freeze({ en: 'Interactive demo', zh: '交互演示' }),
  teaching_materials: Object.freeze({ en: 'Teaching materials', zh: '教学资料' }),
  deployed_website: Object.freeze({ en: 'Deployed website', zh: '已部署网站' }),
  public_repository: Object.freeze({ en: 'Public repository', zh: '公开仓库' }),
  coursework: Object.freeze({ en: 'Coursework', zh: '课程作业' }),
  planning: Object.freeze({ en: 'Planning', zh: '规划阶段' }),
  archived_repository: Object.freeze({ en: 'Archived repository', zh: '已归档仓库' }),
  upstream_fork: Object.freeze({ en: 'Upstream fork', zh: '上游分叉' }),
  unknown: Object.freeze({ en: 'Unknown stage', zh: '未知阶段' })
});

export const PUBLICATION_STATUS_LABELS = Object.freeze({
  published: Object.freeze({ en: 'Published', zh: '已发表' }),
  in_press: Object.freeze({ en: 'In press', zh: '录用待刊' }),
  unknown: Object.freeze({ en: 'Unknown status', zh: '未知状态' })
});

const LEGACY_STAGE_KEYS = Object.freeze({
  'Research repository': 'research_repository',
  'Working prototype': 'working_prototype',
  'Interactive demo': 'interactive_demo',
  'Teaching materials': 'teaching_materials',
  'Deployed website': 'deployed_website',
  'Public repository': 'public_repository',
  Coursework: 'coursework',
  Planning: 'planning',
  'Archived repository': 'archived_repository',
  'Upstream fork': 'upstream_fork'
});

const LEGACY_PUBLICATION_STATUS_KEYS = Object.freeze({
  Published: 'published',
  'In press': 'in_press'
});

export const RESEARCH_EVIDENCE_KINDS = Object.freeze([
  'research_artifact',
  'experiment_record',
  'experiment_results'
]);

const RESEARCH_ARTIFACT_KINDS = new Set(RESEARCH_EVIDENCE_KINDS);

function validHttpUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

export function repositoryStageKey(repo = {}) {
  if (repo.archived) return 'archived_repository';
  if (repo.fork) return 'upstream_fork';
  const explicitKey = typeof repo.stage_key === 'string' ? repo.stage_key.trim() : '';
  if (explicitKey && Object.hasOwn(REPOSITORY_STAGE_PRIORITY, explicitKey)) return explicitKey;
  return LEGACY_STAGE_KEYS[repo.stage?.en] || 'unknown';
}

export function publicationStatusKey(publication = {}) {
  const explicitKey = typeof publication.status_key === 'string' ? publication.status_key.trim() : '';
  if (explicitKey && Object.hasOwn(PUBLICATION_STATUS_LABELS, explicitKey)) return explicitKey;
  return LEGACY_PUBLICATION_STATUS_KEYS[publication.status] || 'unknown';
}

export function repositoryStageLabel(repo = {}, language = 'en') {
  const normalizedLanguage = language === 'zh' ? 'zh' : 'en';
  return REPOSITORY_STAGE_LABELS[repositoryStageKey(repo)]?.[normalizedLanguage]
    || REPOSITORY_STAGE_LABELS.unknown[normalizedLanguage];
}

export function publicationStatusLabel(publication = {}, language = 'en') {
  const normalizedLanguage = language === 'zh' ? 'zh' : 'en';
  return PUBLICATION_STATUS_LABELS[publicationStatusKey(publication)]?.[normalizedLanguage]
    || PUBLICATION_STATUS_LABELS.unknown[normalizedLanguage];
}

export function assignedResearchIds(repo = {}, repoAssignments = {}, validTopicIds = []) {
  const validIds = new Set(validTopicIds);
  const ids = [...new Set([
    ...(Array.isArray(repo.interests) ? repo.interests : []),
    ...(Array.isArray(repoAssignments[repo.name]) ? repoAssignments[repo.name] : [])
  ].filter((id) => typeof id === 'string' && id))];
  return validIds.size ? ids.filter((id) => validIds.has(id)) : ids;
}

export function repositoryEvidenceRefs(repo = {}) {
  return (Array.isArray(repo.evidence_refs) ? repo.evidence_refs : [])
    .map((reference) => ({
      kind: String(reference?.kind || '').trim(),
      url: validHttpUrl(reference?.url)
    }))
    .filter((reference) => RESEARCH_ARTIFACT_KINDS.has(reference.kind) && reference.url);
}

export function compareRepositoriesByRelevance(left, right, options = {}) {
  const repoAssignments = options.repoAssignments || {};
  const validTopicIds = options.validTopicIds || [];
  const leftMapped = assignedResearchIds(left, repoAssignments, validTopicIds).length > 0;
  const rightMapped = assignedResearchIds(right, repoAssignments, validTopicIds).length > 0;
  if (leftMapped !== rightMapped) return leftMapped ? -1 : 1;

  const leftOriginalActive = !left.fork && !left.archived;
  const rightOriginalActive = !right.fork && !right.archived;
  if (leftOriginalActive !== rightOriginalActive) return leftOriginalActive ? -1 : 1;

  const stageOrder = (REPOSITORY_STAGE_PRIORITY[repositoryStageKey(left)] ?? REPOSITORY_STAGE_PRIORITY.unknown)
    - (REPOSITORY_STAGE_PRIORITY[repositoryStageKey(right)] ?? REPOSITORY_STAGE_PRIORITY.unknown);
  if (stageOrder) return stageOrder;

  const updatedOrder = String(right.updated_at || '').localeCompare(String(left.updated_at || ''));
  return updatedOrder || String(left.name || '').localeCompare(String(right.name || ''));
}

function validProfilePublication(publication, profileAuthor) {
  const doi = String(publication?.doi || '').trim();
  const authors = Array.isArray(publication?.authors)
    ? publication.authors.join('; ')
    : String(publication?.authors || '');
  return /^10\.\d{4,9}\/\S+$/i.test(doi)
    && authors.toLowerCase().includes(String(profileAuthor || '').toLowerCase());
}

function evidenceRank(item, profileAuthor) {
  if (item.type === 'ScholarlyArticle' && validProfilePublication(item.value, profileAuthor)) {
    const status = publicationStatusKey(item.value);
    if (status === 'published') return { tier: 'evidence', rank: 0, kind: 'published_paper' };
    if (status === 'in_press') return { tier: 'evidence', rank: 1, kind: 'in_press_paper' };
  }
  if (item.type === 'SoftwareSourceCode') {
    const repo = item.value || {};
    const hasResearchArtifact = repositoryEvidenceRefs(repo)
      .some((reference) => RESEARCH_ARTIFACT_KINDS.has(reference.kind));
    if (!repo.fork && !repo.archived && repositoryStageKey(repo) === 'research_repository' && hasResearchArtifact) {
      return { tier: 'evidence', rank: 2, kind: 'research_repository' };
    }
    if (!repo.fork && !repo.archived && repositoryStageKey(repo) === 'working_prototype') {
      return { tier: 'exploring', rank: 3, kind: 'working_prototype' };
    }
    if (!repo.fork && !repo.archived && repositoryStageKey(repo) === 'interactive_demo') {
      return { tier: 'exploring', rank: 4, kind: 'interactive_demo' };
    }
    return { tier: 'exploring', rank: 6, kind: 'public_project' };
  }
  if (item.type === 'BlogPosting') return { tier: 'exploring', rank: 5, kind: 'research_note' };
  return { tier: 'exploring', rank: 7, kind: 'concept' };
}

export function classifyResearchTopic(topic, evidence = [], options = {}) {
  const profileAuthor = options.profileAuthor || 'Chenxu Wang';
  const ranked = evidence.map((item) => evidenceRank(item, profileAuthor));
  const strongest = ranked.sort((left, right) => {
    if (left.tier !== right.tier) return left.tier === 'evidence' ? -1 : 1;
    return left.rank - right.rank;
  })[0];
  return strongest || { tier: 'exploring', rank: 7, kind: 'concept' };
}

export function compareResearchTopics(left, right) {
  const leftClassification = left.classification || classifyResearchTopic(left.child, left.evidence);
  const rightClassification = right.classification || classifyResearchTopic(right.child, right.evidence);
  if (leftClassification.tier !== rightClassification.tier) return leftClassification.tier === 'evidence' ? -1 : 1;
  return leftClassification.rank - rightClassification.rank
    || (left.configIndex ?? 0) - (right.configIndex ?? 0);
}

function countLabel(count, language, singular, plural = `${singular}s`) {
  return language === 'zh'
    ? `${count} ${singular}`
    : `${count} ${count === 1 ? singular : plural}`;
}

export function summarizeTopicEvidence(evidence = [], language = 'en') {
  const counts = {
    published: 0,
    inPress: 0,
    researchRepository: 0,
    workingPrototype: 0,
    interactiveDemo: 0,
    researchNote: 0,
    publicProject: 0
  };
  for (const item of evidence) {
    if (item.type === 'ScholarlyArticle') {
      const status = publicationStatusKey(item.value);
      if (status === 'published') counts.published += 1;
      else if (status === 'in_press') counts.inPress += 1;
      continue;
    }
    if (item.type === 'BlogPosting') {
      counts.researchNote += 1;
      continue;
    }
    if (item.type !== 'SoftwareSourceCode' || item.value?.configured_only) continue;
    const stage = repositoryStageKey(item.value);
    if (stage === 'research_repository') counts.researchRepository += 1;
    else if (stage === 'working_prototype') counts.workingPrototype += 1;
    else if (stage === 'interactive_demo') counts.interactiveDemo += 1;
    else counts.publicProject += 1;
  }
  const labels = language === 'zh'
    ? [
        counts.published && countLabel(counts.published, language, '篇已发表论文'),
        counts.inPress && countLabel(counts.inPress, language, '篇录用待刊论文'),
        counts.researchRepository && countLabel(counts.researchRepository, language, '个研究仓库'),
        counts.workingPrototype && countLabel(counts.workingPrototype, language, '个可运行原型'),
        counts.interactiveDemo && countLabel(counts.interactiveDemo, language, '个交互演示'),
        counts.researchNote && countLabel(counts.researchNote, language, '篇研究文章'),
        counts.publicProject && countLabel(counts.publicProject, language, '个公开项目')
      ]
    : [
        counts.published && countLabel(counts.published, language, 'published paper'),
        counts.inPress && countLabel(counts.inPress, language, 'in-press paper'),
        counts.researchRepository && countLabel(counts.researchRepository, language, 'research repository', 'research repositories'),
        counts.workingPrototype && countLabel(counts.workingPrototype, language, 'working prototype'),
        counts.interactiveDemo && countLabel(counts.interactiveDemo, language, 'interactive demo'),
        counts.researchNote && countLabel(counts.researchNote, language, 'research note'),
        counts.publicProject && countLabel(counts.publicProject, language, 'public project')
      ];
  return labels.filter(Boolean).join(' · ') || (language === 'zh' ? '暂无公开证据' : 'No public evidence yet');
}
