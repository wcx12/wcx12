import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { profileData } from '../profile-data.js';
import { staticPublications } from '../site-data.js';

const tfVpr = staticPublications.find((paper) => paper.slug === 'tf-vpr');
const synergistic = staticPublications.find((paper) => paper.slug === 'synergistic-learning-active-learning');

test('TF-VPR exposes the verified cover date as an issue date with a legacy alias', () => {
  assert.ok(tfVpr);
  assert.equal(tfVpr.issue_date, '2026-06-07');
  assert.equal(tfVpr.published_date, tfVpr.issue_date);
  assert.equal(tfVpr.issueLabel.en, 'Volume date: 7 June 2026');
  assert.equal(tfVpr.issueLabel.zh, '\u5377\u671f\u65e5\u671f\uff1a2026 \u5e74 6 \u6708 7 \u65e5');
  assert.deepEqual(tfVpr.publishedLabel, { en: tfVpr.status, zh: tfVpr.statusZh });
});

test('cover dates do not invent unknown online publication dates', () => {
  for (const paper of [tfVpr, synergistic]) {
    assert.ok(paper);
    assert.equal(paper.online_date, undefined, `${paper.slug}: online date remains unverified`);
    assert.equal(paper.onlineLabel, undefined, `${paper.slug}: no unsupported online-date label`);
  }
  assert.equal(synergistic.issue_date, '2026-10-28');
  assert.equal(synergistic.published_date, undefined);
});

// Bibliographic fields verified against publisher-deposited Crossref records.
test('publication date clarification preserves scholarly identities and raw statuses', () => {
  const fields = ['slug', 'title', 'authors', 'doi', 'link', 'venue', 'year', 'volume',
    'article_number', 'citation_month', 'citation_date', 'status', 'status_key', 'code_url'];
  const expected = [
    {
      slug: 'tf-vpr',
      title: 'TF-VPR: A novel benchmark for training-free visual place recognition',
      authors: 'Chenxu Wang; Qingtong Meng; Bonan Zhang; Fusen Guo',
      doi: '10.1016/j.neucom.2026.133399',
      link: 'https://doi.org/10.1016/j.neucom.2026.133399',
      venue: 'Neurocomputing',
      year: '2026',
      volume: '681',
      article_number: '133399',
      citation_month: 'jun',
      citation_date: '2026/06',
      status: 'Published',
      status_key: 'published',
      code_url: 'https://github.com/ddfs430/TF-VPR'
    },
    {
      slug: 'synergistic-learning-active-learning',
      title: 'Synergistic learning for active learning: A unified training objective for sample-efficient medical image classification',
      authors: 'Chenxu Wang; QingTong Meng; Qianxun Lin; Bonan Zhang; Fusen Guo',
      doi: '10.1016/j.neucom.2026.134314',
      link: 'https://doi.org/10.1016/j.neucom.2026.134314',
      venue: 'Neurocomputing',
      year: '2026',
      volume: '699',
      article_number: '134314',
      citation_month: 'oct',
      citation_date: '2026/10',
      status: 'In press',
      status_key: 'in_press',
      code_url: 'https://github.com/ddfs430/Synergistic-Learning'
    }
  ];
  const actual = [tfVpr, synergistic].map((paper) =>
    Object.fromEntries(fields.map((field) => [field, paper[field]])));
  assert.deepEqual(actual, expected);
});

test('README describes the canonical study period without claiming current enrollment or graduation', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const period = profileData.education.period.en.replace('\u2013', ' to ');
  assert.ok(readme.includes(`alt="Study period: ${period}"`));
  assert.ok(readme.includes(`BIT (${period})`));
  assert.ok(readme.includes(`I studied at **${profileData.education.institution.en}** from **${period}**.`));
  assert.doesNotMatch(readme, /BIT Student|I am studying|Expected graduation|badge\/Graduation-/);
});

test('README distinguishes the scheduled volume from an unverified online publication date', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  const record = readme.split(/\r?\n/).find((line) => line.includes(synergistic.doi));
  assert.ok(record);
  assert.ok(record.includes(`${synergistic.venue} ${synergistic.volume} (${synergistic.year}), ${synergistic.article_number}`));
  assert.ok(record.includes(`issue scheduled for ${synergistic.issueLabel.en.replace('Volume date: ', '')}`));
  assert.doesNotMatch(record, /in press|published online/i);
});
