import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const version = process.argv[2] ?? 'v7';
const baseUrl = process.argv[3] ?? 'http://127.0.0.1:5177';
const quality = process.argv[4] ?? 'low';
if (!['low', 'high'].includes(quality)) throw new Error(`Unsupported quality tier: ${quality}`);
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const issues = [];
page.on('console', (message) => {
  if (message.type() === 'warning' || message.type() === 'error') issues.push(`${message.type()}: ${message.text()}`);
});
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));

await page.goto(`${baseUrl}/?scenario=boss&form=dreadwolf&god=1&capture=1&perf=1&quality=${quality}`, { waitUntil: 'networkidle' });
await page.locator('canvas').click({ position: { x: 640, y: 360 } });
await page.waitForTimeout(5200);
await page.mouse.move(770, 175);

// Use the same deterministic, already-proven progression as the homologous
// boss evidence capture. Repeated form switching used to reset attack cadence
// and made this performance run fail before reaching Phase III.
let phase = 1;
await page.keyboard.press('KeyQ');
await page.waitForTimeout(520);
for (let attempt = 0; attempt < 100 && phase === 1; attempt++) {
  await page.mouse.click(770, 175);
  await page.waitForTimeout(260);
  const body = await page.locator('body').innerText();
  if (body.includes('PHASE II')) phase = 2;
}
if (phase !== 2) throw new Error('Failed to reach Phase II with controlled inputs.');

await page.waitForTimeout(950);
await page.mouse.move(770, 175);
for (let attempt = 0; attempt < 120 && phase === 2; attempt++) {
  await page.mouse.click(770, 175);
  if (attempt === 0 || attempt === 35 || attempt === 70) await page.keyboard.press('KeyQ');
  await page.waitForTimeout(240);
  const body = await page.locator('body').innerText();
  if (body.includes('PHASE III')) phase = 3;
}
if (phase !== 3) throw new Error('Failed to reach Phase III with controlled inputs.');

await page.waitForTimeout(900);
await page.keyboard.press('Digit4');
await page.waitForTimeout(650);
await page.mouse.move(770, 175);

const stateText = await page.locator('body').innerText();
if (!stateText.includes('PHASE III')) throw new Error('Failed to reach Phase III with controlled inputs.');
await page.waitForTimeout(12000);
await page.keyboard.press('KeyP');
await page.waitForTimeout(31500);

const probe = page.locator('#qa-performance');
const result = await probe.getAttribute('data-result');
if (!result) throw new Error('Performance probe did not publish data-result.');
const parsed = JSON.parse(result);
const evidenceDir = path.resolve('reviews/evidence');
const performanceDir = path.resolve('reviews/performance');
await mkdir(evidenceDir, { recursive: true });
await mkdir(performanceDir, { recursive: true });
await page.screenshot({ path: path.join(evidenceDir, `${version}-performance-${quality}.png`) });
const payload = {
  ...parsed,
  consoleIssues: issues,
  capture: {
    version,
    baseUrl,
    query: `?scenario=boss&form=dreadwolf&god=1&capture=1&perf=1&quality=${quality}`,
    warmupSeconds: 12,
    viewport: '1280x720',
  },
};
await writeFile(path.join(performanceDir, `${version}-phase3-${quality}.json`), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload, null, 2));
await browser.close();
