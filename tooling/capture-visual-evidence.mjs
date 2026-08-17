import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const version = process.argv[2] ?? 'v6';
const baseUrl = process.argv[3] ?? 'http://127.0.0.1:5176';
const evidenceDir = path.resolve('reviews/evidence');
await mkdir(evidenceDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  colorScheme: 'dark',
});

const consoleIssues = [];
const prepare = async (query) => {
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`));
  await page.goto(`${baseUrl}/${query}`, { waitUntil: 'networkidle' });
  await page.locator('canvas').click({ position: { x: 640, y: 360 } });
  await page.waitForTimeout(6500);
  return page;
};

const snap = (page, name) => page.screenshot({
  path: path.join(evidenceDir, `${version}-${name}.png`),
  animations: 'allow',
});

const roam = await prepare('?quality=high');
await snap(roam, 'compare-world');
await roam.keyboard.press('Digit3');
await roam.waitForTimeout(110);
await snap(roam, 'compare-transformation');
await roam.waitForTimeout(900);
await roam.keyboard.down('KeyW');
await roam.keyboard.down('KeyD');
await roam.waitForTimeout(750);
await roam.keyboard.up('KeyW');
await roam.keyboard.up('KeyD');
await snap(roam, 'compare-character');
await roam.close();

const combat = await prepare('?scenario=elite&form=nightbound&god=1&quality=high');
// Create readable player/target separation before the peak-impact frame instead
// of accepting the scenario's initial body pile as evidence.
await combat.keyboard.down('KeyA');
await combat.keyboard.down('KeyS');
await combat.waitForTimeout(820);
await combat.keyboard.up('KeyA');
await combat.keyboard.up('KeyS');
await combat.mouse.move(760, 315);
await combat.keyboard.press('KeyQ');
await combat.waitForTimeout(420);
await snap(combat, 'compare-vfx');
await combat.waitForTimeout(780);
await combat.mouse.down();
await combat.waitForTimeout(170);
await combat.mouse.up();
await combat.waitForTimeout(150);
await snap(combat, 'compare-enemies');
await combat.close();

const boss = await prepare('?scenario=boss&form=stonewrought&god=1&capture=1&quality=high');
await boss.mouse.move(925, 210);
await boss.keyboard.press('KeyQ');
await boss.waitForTimeout(190);
await snap(boss, 'compare-boss');
await boss.close();

await browser.close();

console.log(JSON.stringify({
  version,
  baseUrl,
  viewport: '1280x720',
  quality: 'high',
  consoleIssues,
}, null, 2));
