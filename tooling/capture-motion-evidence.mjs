import { createRequire } from 'node:module';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const version = process.argv[2] ?? 'v9';
const baseUrl = process.argv[3] ?? 'http://127.0.0.1:5177';
const evidenceDir = path.resolve('reviews/evidence');
const tempDir = path.join(evidenceDir, `.${version}-motion-frames`);
await rm(tempDir, { recursive: true, force: true });
await mkdir(tempDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const issues = [];
page.on('console', (message) => {
  if (message.type() === 'warning' || message.type() === 'error') issues.push(`${message.type()}: ${message.text()}`);
});
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
await page.goto(`${baseUrl}/?scenario=elite&form=nightbound&god=1&quality=high`, { waitUntil: 'networkidle' });
await page.locator('canvas').click({ position: { x: 640, y: 360 } });
await page.waitForTimeout(4500);
await page.keyboard.down('KeyA');
await page.keyboard.down('KeyS');
await page.waitForTimeout(700);
await page.keyboard.up('KeyA');
await page.keyboard.up('KeyS');
await page.mouse.move(760, 315);
let frameIndex = 0;
const captureFor = async (duration) => {
  const frames = Math.max(1, Math.ceil(duration / 120));
  for (let index = 0; index < frames; index++) {
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(tempDir, `${String(frameIndex++).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 72 });
  }
};

const beat = async (formKey, actions) => {
  await page.keyboard.press(formKey);
  await captureFor(520);
  for (const [action, delay] of actions) {
    if (action === 'click') await page.mouse.click(760, 315);
    else await page.keyboard.press(action);
    await captureFor(delay);
  }
};

await beat('Digit1', [['click', 520], ['KeyQ', 900], ['Space', 700]]);
await beat('Digit2', [['click', 450], ['KeyQ', 900], ['Space', 700]]);
await beat('Digit3', [['Space', 650], ['click', 400], ['KeyQ', 950]]);
await beat('Digit4', [['Space', 700], ['KeyQ', 950], ['click', 650], ['KeyR', 1200]]);

await page.close();
await context.close();
await browser.close();
console.log(JSON.stringify({ version, baseUrl, framesDir: tempDir, frameCount: frameIndex, consoleIssues: issues }, null, 2));
