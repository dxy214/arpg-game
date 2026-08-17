import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5181';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});

const inspect = async (query, expected, screenshot, expectV12Diagnostics = false) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const issues = [];
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      issues.push(`${message.type()}: ${message.text()}`);
    }
  });
  await page.goto(`${baseUrl}/${query}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const status = document.querySelector('#game-ui')?.dataset.characterAssets;
    return status && status !== 'loading';
  }, undefined, { timeout: 20_000 });
  const status = await page.locator('#game-ui').getAttribute('data-character-assets');
  if (expectV12Diagnostics) {
    await page.waitForFunction(() => document.querySelector('#game-ui')?.dataset.v12Diagnostics);
    const diagnostics = JSON.parse(await page.locator('#game-ui').getAttribute('data-v12-diagnostics'));
    if (!diagnostics.authoredCandidate
      || diagnostics.centerDistanceToActor >= 1
      || !diagnostics.boundsInFrustum
      || diagnostics.meshCount !== 3
      || diagnostics.materials.some((material) => !material.visible || material.opacity !== 1)) {
      throw new Error(JSON.stringify({ diagnostics }, null, 2));
    }
  }
  await page.waitForTimeout(700);
  await page.screenshot({ path: screenshot });
  await page.close();
  if (status !== expected || issues.length) throw new Error(JSON.stringify({ status, expected, issues }, null, 2));
  return { status, issues };
};

const normal = await inspect(
  '?scenario=elite&god=1&quality=high',
  'ready:v11',
  'reviews/evidence/v11-asset-pipeline-normal.png',
);
const fallback = await inspect(
  '?scenario=elite&god=1&quality=high&character=v12&assetFail=1',
  'fallback:v11',
  'reviews/evidence/v11-asset-pipeline-fallback.png',
);
const candidate = await inspect(
  '?scenario=elite&god=1&quality=high&character=v12&inspect=1',
  'ready:v12',
  'reviews/evidence/v12-asset-pipeline-candidate.png',
  true,
);
const boss = await inspect(
  '?scenario=boss&god=1&quality=high',
  'ready:v11',
  'reviews/evidence/v11-asset-pipeline-boss.png',
);
await browser.close();
console.log(JSON.stringify({ normal, candidate, fallback, boss }, null, 2));
