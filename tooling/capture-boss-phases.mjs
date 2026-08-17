import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const version = process.argv[2] ?? 'v9';
const baseUrl = process.argv[3] ?? 'http://127.0.0.1:5177';
const quality = process.argv[4] ?? 'high';
const evidenceDir = path.resolve('reviews/evidence');
await mkdir(evidenceDir, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const issues = [];
page.on('console', (message) => {
  if (message.type() === 'warning' || message.type() === 'error') issues.push(`${message.type()}: ${message.text()}`);
});
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
await page.goto(`${baseUrl}/?scenario=boss&form=dreadwolf&god=1&capture=1&quality=${encodeURIComponent(quality)}`, { waitUntil: 'networkidle' });
await page.locator('canvas').click({ position: { x: 640, y: 360 } });
await page.waitForTimeout(5200);
await page.mouse.move(770, 175);
await page.screenshot({ path: path.join(evidenceDir, `${version}-boss-phase1.png`) });
for (let index = 0; index < 6; index++) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(evidenceDir, `${version}-boss-phase1-active-${index + 1}.png`) });
}

let phase = 1;
await page.keyboard.press('KeyQ');
await page.waitForTimeout(520);
for (let attempt = 0; attempt < 100 && phase === 1; attempt++) {
  await page.mouse.click(770, 175);
  await page.waitForTimeout(260);
  const text = await page.locator('body').innerText();
  if (text.includes('PHASE II')) phase = 2;
}
if (phase !== 2) throw new Error('Failed to reach Phase II.');
await page.waitForTimeout(950);
await page.keyboard.press('Digit2');
await page.waitForTimeout(650);
await page.screenshot({ path: path.join(evidenceDir, `${version}-boss-phase2.png`) });

// Preserve honest Wraith Phase-II evidence, then use the close-range form to
// advance the same live boss without relying on projectile screen-coordinate drift.
await page.keyboard.press('Digit3');
await page.waitForTimeout(650);
await page.mouse.move(770, 175);
for (let attempt = 0; attempt < 120 && phase === 2; attempt++) {
  await page.mouse.click(770, 175);
  if (attempt === 0 || attempt === 35 || attempt === 70) await page.keyboard.press('KeyQ');
  await page.waitForTimeout(240);
  const text = await page.locator('body').innerText();
  if (text.includes('PHASE III')) phase = 3;
}
if (phase !== 3) throw new Error('Failed to reach Phase III.');
await page.waitForTimeout(900);
await page.keyboard.press('Digit4');
await page.waitForTimeout(650);
await page.mouse.move(770, 175);
await page.keyboard.press('KeyQ');
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(evidenceDir, `${version}-boss-phase3.png`) });
for (let index = 0; index < 8; index++) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(evidenceDir, `${version}-boss-phase3-active-${index + 1}.png`) });
}

console.log(JSON.stringify({ version, baseUrl, quality, phases: [1, 2, 3], consoleIssues: issues }, null, 2));
await browser.close();
