import { createRequire } from 'node:module';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5182';
const evidenceDir = path.resolve('reviews/evidence');
const sequenceDirs = {
  hero: path.join(evidenceDir, '.v11-nightbound-motion'),
  death: path.join(evidenceDir, '.v11-nightbound-death'),
  husk: path.join(evidenceDir, '.v11-husk-motion'),
};
await mkdir(evidenceDir, { recursive: true });
for (const directory of Object.values(sequenceDirs)) {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const consoleIssues = [];
const watch = (page) => {
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') consoleIssues.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => consoleIssues.push(`pageerror: ${error.message}`));
};
const open = async (query, expected = 'ready') => {
  const page = await context.newPage();
  watch(page);
  await page.goto(`${baseUrl}/${query}`, { waitUntil: 'networkidle' });
  await page.locator('canvas').click({ position: { x: 640, y: 360 } });
  await page.waitForFunction((prefix) => {
    const state = document.querySelector('#game-ui')?.dataset.characterAssets ?? '';
    return state === prefix || state.startsWith(`${prefix}:`);
  }, expected, { timeout: 15000 });
  await page.waitForTimeout(5800);
  return page;
};
const recorder = (page, directory) => {
  let index = 0;
  return async (frames, stepMs = 100) => {
    for (let frame = 0; frame < frames; frame++) {
      await page.waitForTimeout(stepMs);
      await page.screenshot({
        path: path.join(directory, `${String(index++).padStart(4, '0')}.jpg`),
        type: 'jpeg',
        quality: 82,
      });
    }
    return index;
  };
};

// Close authored Nightbound: idle, start/travel/turn/stop, attack, transform out/in.
const hero = await open('?form=nightbound&god=1&quality=high&inspect=1');
await hero.screenshot({ path: path.join(evidenceDir, 'v11-nightbound-close.png') });
const heroFrames = recorder(hero, sequenceDirs.hero);
await heroFrames(8);
await hero.keyboard.down('KeyW');
await heroFrames(10);
await hero.keyboard.down('KeyD');
await heroFrames(6);
await hero.keyboard.up('KeyW');
await hero.keyboard.up('KeyD');
await heroFrames(6);
await hero.mouse.move(790, 290);
await hero.mouse.click(790, 290);
await heroFrames(13);
await hero.keyboard.press('Digit2');
await heroFrames(8);
await hero.keyboard.press('Digit1');
await heroFrames(14);
await hero.close();

// Four authored Mourners, frozen only for a clean homologous group frame.
const group = await open('?scenario=mourners&form=nightbound&god=1&quality=high&inspect=1&freeze=1');
await group.screenshot({ path: path.join(evidenceDir, 'v11-husk-group.png') });
await group.close();

// Live four-Husk attack/reaction/death sequence. Normal AI/damage remains live;
// god mode only keeps the camera subject alive long enough to inspect the pack.
const husk = await open('?scenario=mourners&form=nightbound&god=1&quality=high&inspect=1');
const huskFrames = recorder(husk, sequenceDirs.husk);
await huskFrames(10);
await husk.mouse.move(800, 300);
for (let strike = 0; strike < 8; strike++) {
  await husk.mouse.click(800, 300);
  if (strike === 2 || strike === 5) await husk.keyboard.press('KeyQ');
  await huskFrames(9);
}
await husk.screenshot({ path: path.join(evidenceDir, 'v11-husk-combat-result.png') });
await husk.close();

// Normal-damage authored Nightbound hurt/death. Four standard Mourners deliver
// the actual gameplay damage; capture continues through the clamped death pose.
const death = await open('?scenario=mourners&form=nightbound&quality=high&inspect=1');
const deathFrames = recorder(death, sequenceDirs.death);
for (let frame = 0; frame < 170; frame++) {
  await deathFrames(1);
  if ((await death.locator('body').innerText()).includes('YOU HAVE FALLEN')) {
    await deathFrames(14);
    break;
  }
}
await death.screenshot({ path: path.join(evidenceDir, 'v11-nightbound-death.png') });
await death.close();

// Narrow forced-failure proof: only Nightbound falls back; wait until typography
// and WebGL assets have fully settled before capturing.
const fallback = await open('?form=nightbound&god=1&quality=high&inspect=1&assetFail=1', 'fallback');
await fallback.waitForTimeout(1800);
await fallback.screenshot({ path: path.join(evidenceDir, 'v11-asset-fallback-final.png') });
await fallback.close();

await context.close();
await browser.close();
console.log(JSON.stringify({
  baseUrl,
  sequences: sequenceDirs,
  consoleIssues,
}, null, 2));
