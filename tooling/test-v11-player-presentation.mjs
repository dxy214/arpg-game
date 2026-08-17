import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5181';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const issues = [];
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') issues.push(`${message.type()}: ${message.text()}`);
});

const openReady = async () => {
  await page.goto(`${baseUrl}/?god=1&quality=high&character=v12`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('#game-ui')?.dataset.characterAssets === 'ready:v12');
  await page.locator('canvas').click({ position: { x: 640, y: 360 } });
};
const nextFrame = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
const sample = () => page.evaluate(() => {
  const runtime = window.__VEILFALL__;
  const module = runtime.modules.find((candidate) => candidate.id === 'vertical-slice');
  const player = module.player;
  const slot = player.authoredFormVisuals.get('nightbound');
  return {
    form: player.form,
    visualForm: player.visualForm,
    pendingVisualForm: player.pendingVisualForm ?? null,
    visible: slot.authored.object.visible,
    animation: slot.animationState ?? null,
    running: slot.isAnimationRunning(),
  };
});

await openReady();
await page.keyboard.press('Digit2');
const transformFrames = [];
for (let frame = 0; frame < 22; frame += 1) {
  await nextFrame();
  transformFrames.push(await sample());
}
const visibleExitFrames = transformFrames.filter((frame) =>
  frame.form === 'wraith'
  && frame.visualForm === 'nightbound'
  && frame.visible
  && frame.animation === 'transform'
  && frame.running).length;
const reachedWraithVisual = transformFrames.some((frame) => frame.visualForm === 'wraith');

await page.waitForTimeout(220);
await page.keyboard.press('Digit1');
const incomingFrames = [];
for (let frame = 0; frame < 12; frame += 1) {
  await nextFrame();
  incomingFrames.push(await sample());
}
const incomingStartsAtAuthoredFrameZero = incomingFrames[0]?.visualForm === 'nightbound'
  && incomingFrames[0]?.visible
  && incomingFrames[0]?.animation === 'transform'
  && incomingFrames[0]?.running;
const visibleEntryFrames = incomingFrames.filter((frame) =>
  frame.form === 'nightbound'
  && frame.visualForm === 'nightbound'
  && frame.visible
  && frame.animation === 'transform'
  && frame.running).length;

await openReady();
await page.mouse.move(760, 300);
await page.mouse.down();
await page.waitForTimeout(45);
await page.mouse.up();
const attackFrames = [];
for (let frame = 0; frame < 66; frame += 1) {
  await nextFrame();
  attackFrames.push(await sample());
}
const attackStart = attackFrames.findIndex((frame) => frame.animation === 'attackPrimary' && frame.running);
const attackEnd = attackFrames.findIndex((frame, index) => index > attackStart && frame.animation !== 'attackPrimary');
const attackHeldAtFrame18 = attackFrames.slice(Math.max(0, attackStart), attackStart + 18)
  .every((frame) => frame.animation === 'attackPrimary');

await browser.close();
const result = {
  visibleExitFrames,
  reachedWraithVisual,
  incomingStartsAtAuthoredFrameZero,
  visibleEntryFrames,
  attackStart,
  attackEnd,
  attackHeldAtFrame18,
  issues,
};
if (visibleExitFrames < 8 || !reachedWraithVisual || !incomingStartsAtAuthoredFrameZero || visibleEntryFrames < 8 || attackStart < 0 || attackEnd < 24 || !attackHeldAtFrame18 || issues.length) {
  console.error(JSON.stringify({ result, transformFrames, incomingFrames, attackFrames }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(result, null, 2));
}
