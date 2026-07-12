import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PUBLICATION_STATUS_LABELS,
  REPOSITORY_STAGE_LABELS,
  assignedResearchIds,
  classifyResearchTopic,
  compareRepositoriesByRelevance,
  compareResearchTopics,
  publicationStatusLabel,
  repositoryStageLabel,
  repositoryStageKey,
  summarizeTopicEvidence
} from './portfolio-ranking.js';

const paper = (statusKey = 'published') => ({
  type: 'ScholarlyArticle',
  value: {
    doi: `10.1000/${statusKey}`,
    authors: 'Chenxu Wang; Research Collaborator',
    status_key: statusKey
  }
});

const repo = (name, stageKey, extra = {}) => ({
  type: 'SoftwareSourceCode',
  value: { name, stage_key: stageKey, ...extra }
});

test('research maturity ignores SEO flags and only promotes inspectable scholarly evidence', () => {
  assert.deepEqual(classifyResearchTopic({ indexable: false }, [paper('published')]), {
    tier: 'evidence', rank: 0, kind: 'published_paper'
  });
  assert.deepEqual(classifyResearchTopic({ indexable: true }, []), {
    tier: 'exploring', rank: 7, kind: 'concept'
  });
  assert.equal(classifyResearchTopic({}, [
    { type: 'BlogPosting', value: { title: 'A note' } },
    { type: 'BlogPosting', value: { title: 'Another note' } }
  ]).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [repo('Plan', 'planning')]).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [paper('published')], { profileAuthor: 'Someone Else' }).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [{
    type: 'ScholarlyArticle',
    value: { doi: 'not-a-doi', authors: 'Chenxu Wang', status_key: 'published' }
  }]).tier, 'exploring');
});

test('only original research repositories with inspectable artifact references qualify', () => {
  const evidenceRefs = [{
    kind: 'experiment_record',
    url: 'https://github.com/wcx12/FusionTrack/blob/main/code/registration/EXPERIMENT_RECORD.md'
  }];
  assert.deepEqual(classifyResearchTopic({}, [repo('FusionTrack', 'research_repository', { evidence_refs: evidenceRefs })]), {
    tier: 'evidence', rank: 2, kind: 'research_repository'
  });
  assert.equal(classifyResearchTopic({}, [repo('Fork', 'research_repository', { fork: true, evidence_refs: evidenceRefs })]).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [repo('Archived', 'research_repository', { archived: true, evidence_refs: evidenceRefs })]).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [repo('README-only', 'research_repository')]).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [repo('Typo', 'research_repository', {
    evidence_refs: [{ kind: 'experiment_result', url: 'https://example.com/results' }]
  })]).tier, 'exploring');
  assert.equal(classifyResearchTopic({}, [repo('Pending sync', 'research_repository', {
    configured_only: true,
    evidence_refs: []
  })]).tier, 'exploring');
});

test('research topics sort by evidence kind and preserve configuration order for ties', () => {
  const entries = [
    { child: { id: 'concept' }, evidence: [], configIndex: 4 },
    { child: { id: 'repository' }, evidence: [repo('Research', 'research_repository', {
      evidence_refs: [{ kind: 'research_artifact', url: 'https://example.com/results' }]
    })], configIndex: 0 },
    { child: { id: 'prototype' }, evidence: [repo('Prototype', 'working_prototype')], configIndex: 3 },
    { child: { id: 'in-press' }, evidence: [paper('in_press')], configIndex: 2 },
    { child: { id: 'published' }, evidence: [paper('published')], configIndex: 1 }
  ];
  const original = entries.map((entry) => entry.child.id);
  const ordered = [...entries].sort(compareResearchTopics).map((entry) => entry.child.id);
  assert.deepEqual(ordered, ['published', 'in-press', 'repository', 'prototype', 'concept']);
  assert.deepEqual(entries.map((entry) => entry.child.id), original, 'ranking must not mutate its input');
});

test('repository relevance uses mappings, ownership state, machine stage, recency, then name', () => {
  const repositories = [
    { name: 'Fork', stage_key: 'upstream_fork', fork: true, updated_at: '2030-01-01', stargazers_count: 100 },
    { name: 'New public repo', stage_key: 'public_repository', updated_at: '2026-07-13' },
    { name: 'Prototype', stage_key: 'working_prototype', updated_at: '2026-07-12' },
    { name: 'Mapped prototype', stage_key: 'working_prototype', updated_at: '2020-01-01', stargazers_count: 0 },
    { name: 'Mapped research', stage_key: 'research_repository', updated_at: '2019-01-01', stargazers_count: 0 },
    { name: 'Archived', stage_key: 'archived_repository', archived: true, updated_at: '2031-01-01' }
  ];
  const options = {
    repoAssignments: {
      'Mapped prototype': ['agent'],
      'Mapped research': ['registration']
    },
    validTopicIds: ['agent', 'registration']
  };
  const original = repositories.map((item) => item.name);
  const ordered = [...repositories]
    .sort((left, right) => compareRepositoriesByRelevance(left, right, options))
    .map((item) => item.name);
  assert.deepEqual(ordered, [
    'Mapped research',
    'Mapped prototype',
    'Prototype',
    'New public repo',
    'Archived',
    'Fork'
  ]);
  assert.deepEqual(repositories.map((item) => item.name), original, 'ranking must not mutate its input');
  assert.equal(repositoryStageKey({ stage: { en: 'Public repository' } }), 'public_repository');
  assert.equal(repositoryStageKey({ stage_key: 'working_prototype', archived: true }), 'archived_repository');
  assert.equal(repositoryStageKey({ stage_key: 'research_repository', fork: true }), 'upstream_fork');
  assert.equal(repositoryStageLabel({ stage_key: 'planning' }, 'zh'), REPOSITORY_STAGE_LABELS.planning.zh);
  assert.equal(publicationStatusLabel({ status_key: 'in_press' }, 'en'), PUBLICATION_STATUS_LABELS.in_press.en);
});

test('repository assignments union curated data and configuration safely', () => {
  const ids = assignedResearchIds(
    { name: 'FusionTrack', interests: ['registration', 'unknown'] },
    { FusionTrack: ['registration', 'agent'] },
    ['registration', 'agent']
  );
  assert.deepEqual(ids, ['registration', 'agent']);
});

test('visible evidence summaries state the evidence kind in both languages', () => {
  const evidence = [
    paper('published'),
    paper('in_press'),
    repo('Research', 'research_repository'),
    repo('Prototype', 'working_prototype')
  ];
  assert.equal(
    summarizeTopicEvidence(evidence, 'en'),
    '1 published paper · 1 in-press paper · 1 research repository · 1 working prototype'
  );
  assert.equal(
    summarizeTopicEvidence(evidence, 'zh'),
    '1 篇已发表论文 · 1 篇录用待刊论文 · 1 个研究仓库 · 1 个可运行原型'
  );
  assert.equal(summarizeTopicEvidence([], 'en'), 'No public evidence yet');
  assert.equal(summarizeTopicEvidence([
    repo('Pending sync', 'research_repository', { configured_only: true })
  ], 'zh'), '暂无公开证据');
});
