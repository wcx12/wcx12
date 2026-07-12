import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeGitHubRepos, renderSiteData } from './sync-github-repos.mjs';

const curated = [{
  name: 'Existing',
  description: 'Curated description.',
  descriptionZh: '人工整理的项目简介。',
  language: 'JavaScript',
  stargazers_count: 1,
  updated_at: '2026-01-01T00:00:00Z',
  default_branch: 'main',
  html_url: 'https://github.com/wcx12/Existing',
  demo_url: 'https://example.com/existing/',
  readme_url: 'https://raw.githubusercontent.com/wcx12/Existing/main/README.md',
  stage_key: 'working_prototype',
  stage: { en: 'Working prototype', zh: '可运行原型' },
  evidence: { en: 'Curated evidence.', zh: '人工证据。' },
  evidence_refs: [{ kind: 'experiment_record', url: 'https://github.com/wcx12/Existing/blob/main/RESULTS.md' }],
  interests: ['agent']
}];

test('refreshes API-owned fields without overwriting curated evidence', () => {
  const [repo] = mergeGitHubRepos([{
    name: 'Existing',
    description: 'Remote marketing claim.',
    language: 'TypeScript',
    stargazers_count: 7,
    updated_at: '2026-07-12T00:00:00Z',
    default_branch: 'trunk',
    html_url: 'https://github.com/wcx12/Existing',
    has_pages: false,
    license: { spdx_id: 'MIT' },
    fork: false,
    archived: false
  }], curated, { owner: 'wcx12' });

  assert.equal(repo.description, 'Curated description.');
  assert.equal(repo.descriptionZh, '人工整理的项目简介。');
  assert.equal(repo.language, 'TypeScript');
  assert.equal(repo.stargazers_count, 7);
  assert.equal(repo.updated_at, '2026-07-12T00:00:00Z');
  assert.equal(repo.default_branch, 'trunk');
  assert.equal(repo.demo_url, 'https://example.com/existing/');
  assert.equal(repo.readme_url, 'https://raw.githubusercontent.com/wcx12/Existing/trunk/README.md');
  assert.equal(repo.license_spdx, 'MIT');
  assert.equal(repo.stage_key, 'working_prototype');
  assert.deepEqual(repo.stage, curated[0].stage);
  assert.deepEqual(repo.evidence, curated[0].evidence);
  assert.deepEqual(repo.evidence_refs, curated[0].evidence_refs);
  assert.deepEqual(repo.interests, ['agent']);

  const [withoutDemo] = mergeGitHubRepos([{
    name: 'Existing',
    language: 'TypeScript',
    stargazers_count: 7,
    updated_at: '2026-07-12T00:00:00Z',
    default_branch: 'trunk',
    html_url: 'https://github.com/wcx12/Existing',
    has_pages: true,
    license: null,
    fork: false,
    archived: false
  }], [{ ...curated[0], demo_url: undefined }], { owner: 'wcx12' });
  assert.equal(withoutDemo.demo_url, undefined, 'sync must not infer a demo for an already curated repository');
  assert.equal(withoutDemo.license_spdx, null);

  const [archived] = mergeGitHubRepos([{
    name: 'Existing',
    updated_at: '2026-07-13T00:00:00Z',
    default_branch: 'main',
    html_url: 'https://github.com/wcx12/Existing',
    fork: false,
    archived: true
  }], curated, { owner: 'wcx12' });
  assert.equal(archived.stage_key, 'archived_repository');
  assert.equal(archived.stage.en, 'Archived repository');
});

test('adds honest unclassified records and attributes new forks', () => {
  const repos = mergeGitHubRepos([
    {
      name: 'NewProject',
      description: 'A new public repository.',
      language: 'Python',
      stargazers_count: 0,
      updated_at: '2026-07-12T01:00:00Z',
      default_branch: 'main',
      html_url: 'https://github.com/wcx12/NewProject',
      homepage: '',
      has_pages: true,
      license: null,
      fork: false,
      archived: false
    },
    {
      name: 'NewFork',
      description: '',
      language: null,
      stargazers_count: 0,
      updated_at: '2026-07-12T00:30:00Z',
      default_branch: 'main',
      html_url: 'https://github.com/wcx12/NewFork',
      has_pages: false,
      license: { spdx_id: 'GPL-3.0' },
      fork: true,
      archived: false
    }
  ], curated, {
    owner: 'wcx12',
    forkSources: {
      NewFork: { full_name: 'upstream/NewFork', html_url: 'https://github.com/upstream/NewFork' }
    }
  });

  assert.deepEqual(repos.map((repo) => repo.name), ['NewProject', 'NewFork']);
  assert.equal(repos[0].demo_url, 'https://wcx12.github.io/NewProject/');
  assert.match(repos[0].descriptionZh, /GitHub.*README/);
  assert.deepEqual(repos[0].interests, []);
  assert.equal(repos[0].stage_key, 'public_repository');
  assert.equal(repos[0].stage.en, 'Public repository');
  assert.equal(repos[0].license_spdx, null);
  assert.match(repos[0].evidence.en, /not yet been curated/);
  assert.equal(repos[1].fork, true);
  assert.equal(repos[1].stage_key, 'upstream_fork');
  assert.equal(repos[1].source.full_name, 'upstream/NewFork');
  assert.equal(repos[1].license_spdx, 'GPL-3.0');
  assert.match(repos[1].descriptionZh, /分叉仓库/);
  assert.match(repos[1].evidence.en, /not claimed as original work/);
});

test('rejects conflicting stage metadata and malformed research evidence references', () => {
  const remote = [{
    name: 'Existing',
    updated_at: '2026-07-12T00:00:00Z',
    default_branch: 'main',
    html_url: 'https://github.com/wcx12/Existing',
    fork: false,
    archived: false
  }];
  assert.throws(
    () => mergeGitHubRepos(remote, [{ ...curated[0], stage_key: 'planning' }]),
    /Conflicting stage_key and stage label/
  );
  assert.throws(
    () => mergeGitHubRepos(remote, [{ ...curated[0], stage_key: 'not_a_stage', stage: undefined }]),
    /Unsupported stage_key/
  );
  assert.throws(
    () => mergeGitHubRepos(remote, [{
      ...curated[0],
      evidence_refs: [{ kind: 'experiment_result', url: 'https://example.com/results' }]
    }]),
    /kind is unsupported/
  );
  assert.throws(
    () => mergeGitHubRepos(remote, [{
      ...curated[0],
      evidence_refs: [{ kind: 'experiment_results', url: 'javascript:alert(1)' }]
    }]),
    /must be an absolute HTTP\(S\) URL/
  );
});

test('renders deterministic executable site data', async () => {
  const source = renderSiteData({
    orcidId: '0000-0000-0000-0000',
    repos: curated,
    publications: [{ title: 'Fixture paper' }]
  });
  const encoded = Buffer.from(source).toString('base64');
  const module = await import(`data:text/javascript;base64,${encoded}`);

  assert.equal(module.ORCID_ID, '0000-0000-0000-0000');
  assert.deepEqual(module.localRepos, curated);
  assert.deepEqual(module.staticPublications, [{ title: 'Fixture paper' }]);
  assert.equal(source, renderSiteData({
    orcidId: '0000-0000-0000-0000',
    repos: curated,
    publications: [{ title: 'Fixture paper' }]
  }));
});
