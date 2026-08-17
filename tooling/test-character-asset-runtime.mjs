import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/dxy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5181';

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const page = await browser.newPage();
const issues = [];
page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') issues.push(`console: ${message.text()}`);
});
await page.goto(`${baseUrl}/?baseline=1`, { waitUntil: 'networkidle' });

const result = await page.evaluate(async () => {
  const runtime = await import('/src/assets3d/CharacterAssetRuntime.ts');
  const v11 = await import('/src/assets3d/v11CharacterManifests.ts');
  const makeGltfUrl = (rootName) => {
    const gltf = {
      asset: { version: '2.0', generator: 'Veilfall runtime self-test' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: rootName }],
    };
    return `data:model/gltf+json,${encodeURIComponent(JSON.stringify(gltf))}`;
  };

  const library = new runtime.CharacterAssetLibrary([{
    id: 'self-test-rig',
    url: makeGltfUrl('AuthoredRoot'),
    authoredRootName: 'AuthoredRoot',
    animationAliases: { idle: ['Idle', 'idle'] },
  }]);
  const preload = await library.preload('self-test-rig');
  const first = await library.instantiate('self-test-rig');
  const second = await library.instantiate('self-test-rig', { name: 'second-rig' });
  if (!first.ok || !second.ok) throw new Error('Expected both character instances to load.');
  if (first.instance.authoredRoot === second.instance.authoredRoot) throw new Error('Skeleton roots were not cloned.');

  const Parent = first.instance.object.constructor;
  const parent = new Parent();
  const fallback = new Parent();
  parent.add(fallback);
  const slot = new runtime.CharacterVisualSlot(parent, fallback);
  if (!slot.attach(first.instance) || fallback.visible) throw new Error('Atomic fallback swap failed.');
  slot.setVisible(false);
  if (first.instance.object.visible) throw new Error('Authored visibility was not delegated.');
  slot.setVisible(true);
  slot.update(1 / 60);

  library.dispose();
  const whileReferenced = library.getStatus('self-test-rig').state;
  slot.dispose();
  const afterFirstRelease = library.getStatus('self-test-rig').state;
  second.instance.dispose();
  const afterFinalRelease = library.getStatus('self-test-rig').state;

  const invalid = new runtime.CharacterAssetLibrary([{
    id: 'bad-root',
    url: makeGltfUrl('DifferentRoot'),
    authoredRootName: 'RequiredRoot',
  }]);
  const invalidPreload = await invalid.preload('bad-root');
  const invalidState = invalid.getStatus('bad-root').state;
  invalid.dispose();

  const authoredLibrary = new runtime.CharacterAssetLibrary(v11.V11_CHARACTER_MANIFESTS);
  const authoredPreload = Object.fromEntries(await authoredLibrary.preloadAll());
  const authoredInstances = [];
  const authored = {};
  for (const id of Object.values(v11.V11_CHARACTER_ASSET_IDS)) {
    const loaded = await authoredLibrary.instantiate(id);
    if (!loaded.ok) throw loaded.error;
    authoredInstances.push(loaded.instance);
    let skinnedMeshes = 0;
    loaded.instance.authoredRoot.traverse((node) => {
      if (node.type === 'SkinnedMesh') skinnedMeshes += 1;
    });
    authored[id] = {
      hasSkinnedMeshes: skinnedMeshes > 0,
      hasIdle: loaded.instance.hasAnimation('idle'),
      hasMove: loaded.instance.hasAnimation('move'),
      hasAttack: loaded.instance.hasAnimation('attackPrimary'),
      hasHit: loaded.instance.hasAnimation('hit'),
      hasDeath: loaded.instance.hasAnimation('death'),
      hasTransform: loaded.instance.hasAnimation('transform'),
      hasPhase: loaded.instance.hasAnimation('phaseTransition'),
    };
  }
  for (const instance of authoredInstances) instance.dispose();
  authoredLibrary.dispose();

  return {
    preload,
    whileReferenced,
    afterFirstRelease,
    afterFinalRelease,
    invalidPreload,
    invalidState,
    authoredPreload,
    authored,
  };
});

await browser.close();
const expected = {
  preload: true,
  whileReferenced: 'ready',
  afterFirstRelease: 'ready',
  afterFinalRelease: 'unloaded',
  invalidPreload: false,
  invalidState: 'failed',
  authoredPreload: {
    'v11-nightbound': true,
    'v11-husk-mourner': true,
    'v11-bell-saint': true,
  },
  authored: {
    'v11-nightbound': { hasSkinnedMeshes: true, hasIdle: true, hasMove: true, hasAttack: true, hasHit: true, hasDeath: true, hasTransform: true, hasPhase: false },
    'v11-husk-mourner': { hasSkinnedMeshes: true, hasIdle: true, hasMove: true, hasAttack: true, hasHit: true, hasDeath: true, hasTransform: false, hasPhase: false },
    'v11-bell-saint': { hasSkinnedMeshes: true, hasIdle: true, hasMove: true, hasAttack: true, hasHit: true, hasDeath: true, hasTransform: false, hasPhase: true },
  },
};
if (issues.length || JSON.stringify(result) !== JSON.stringify(expected)) {
  console.error(JSON.stringify({ result, expected, issues }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ result, issues }, null, 2));
}
