import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';

const phase = process.argv[2] || 'baseline';
const base = process.argv[3] || 'http://127.0.0.1:4282/wcx12/';
const targets = process.argv[4] ? [['before', process.argv[4]], ['after', base]] : [['current', base]];
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Invalid phase');
const output = path.resolve('output/site-quality-20260926', phase, 'performance');
await fs.mkdir(output, { recursive: true });
const report = { started: new Date().toISOString(), phase, base, environment: { node: process.version, platform: os.platform(), cpu: os.cpus()[0].model, logicalCpus: os.cpus().length, memoryGB: os.totalmem() / 2 ** 30, cache: 'fresh Chrome profile for each navigation, Lighthouse storage reset enabled', externalNetwork: 'uncontrolled public endpoints; local artifact origin' }, runs: [] };
report.versions = [];
for (const [version, url] of targets) {
  const html = await (await fetch(url)).text();
  report.versions.push({ version, url, hash: createHash('sha256').update(html).digest('hex'), fingerprint: html.match(/[?&]v=([a-f0-9]+)/)?.[1] });
}
for (const [name, route] of [['home', ''], ['article', 'blog/posts/tiger-generative-retrieval-reading/']]) {
  for (const device of ['mobile', 'desktop']) {
    for (let run = 1; run <= 3; run++) {
      for (const [version, url] of (run % 2 ? targets : [...targets].reverse())) {
      const stem = `${version}-${name}-${device}-${run}`;
      const userDataDir = path.join(output, 'profiles', `${stem}-${Date.now()}`);
      await fs.mkdir(userDataDir, { recursive: true });
      const chrome = await launch({ userDataDir, chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--disable-extensions', '--no-first-run'] });
      try {
        const result = await lighthouse(new URL(route, url).href, { port: chrome.port, output: ['json', 'html'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] }, device === 'desktop' ? desktopConfig : undefined);
        await fs.writeFile(path.join(output, `${stem}.json`), result.report[0]);
        await fs.writeFile(path.join(output, `${stem}.html`), result.report[1]);
        const lhr = result.lhr;
        if (lhr.configSettings.formFactor !== device) throw new Error(`Wrong device configuration: ${device}`);
        const row = { version, name, device, run, lighthouse: lhr.lighthouseVersion, userAgent: lhr.userAgent, benchmarkIndex: lhr.environment.benchmarkIndex, settings: lhr.configSettings,
          scores: Object.fromEntries(Object.entries(lhr.categories).map(([id, category]) => [id, category.score * 100])),
          metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(id => [id, lhr.audits[id].numericValue])), errors: lhr.runtimeError || null, warnings: lhr.runWarnings };
        report.runs.push(row);
        console.log(stem, row.scores, row.metrics);
        await fs.writeFile(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
      } finally { await chrome.kill(); }
      }
    }
  }
}
report.groups = [];
for (const [version] of targets) for (const name of ['home', 'article']) for (const device of ['mobile', 'desktop']) {
  const rows = report.runs.filter(row => row.version === version && row.name === name && row.device === device);
  const range = values => { values.sort((a, b) => a - b); return { min: values[0], median: values[1], max: values[2] }; };
  report.groups.push({ version, name, device, scores: Object.fromEntries(Object.keys(rows[0].scores).map(key => [key, range(rows.map(row => row.scores[key]))])), metrics: Object.fromEntries(Object.keys(rows[0].metrics).map(key => [key, range(rows.map(row => row.metrics[key]))])) });
}
for (const { url, hash } of report.versions) {
  const current = createHash('sha256').update(await (await fetch(url)).text()).digest('hex');
  if (current !== hash) throw new Error(`Artifact changed during measurement: ${url}`);
}
report.finished = new Date().toISOString();
await fs.writeFile(path.join(output, 'summary.json'), JSON.stringify(report, null, 2));
