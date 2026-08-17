import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const files = {
  html: await read('index.html'),
  main: await read('src/main.ts'),
  renderer: await read('src/core/RendererHost.ts'),
  runtime: await read('src/core/GameRuntime.ts'),
  integration: await read('src/integration/VerticalSliceModule.ts'),
  characterRuntime: await read('src/assets3d/CharacterAssetRuntime.ts'),
  v12Characters: await read('src/assets3d/v12CharacterManifests.ts'),
  v14Characters: await read('src/assets3d/v14CharacterManifests.ts'),
  forms: await read('src/gameplay/formData.ts'),
  gameplayTypes: await read('src/gameplay/types.ts'),
  player: await read('src/gameplay/PlayerController.ts'),
  enemies: await read('src/enemies/EnemySystem.ts'),
  boss: await read('src/boss/BellSaintBoss.ts'),
  effects: await read('src/effects/EffectDirector.ts'),
  hud: await read('src/ui/GameHud.ts'),
  qa: await read('src/testing/qaScenarios.ts'),
  probe: await read('src/testing/PerformanceProbe.ts'),
  collision: await read('src/physics/CollisionWorld.ts'),
  vite: await read('vite.config.ts'),
};

function blockFor(source, key) {
  const start = source.indexOf(`${key}: {`);
  assert.notEqual(start, -1, `missing definition for ${key}`);
  const end = source.indexOf('\n  },', start);
  assert.notEqual(end, -1, `unterminated definition for ${key}`);
  return source.slice(start, end);
}

function numeric(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*([0-9.]+)`));
  assert.ok(match, `missing numeric ${key}`);
  return Number(match[1]);
}

test('HTML and runtime expose the deterministic boot contract', () => {
  assert.match(files.html, /<canvas id="game-canvas"/);
  assert.match(files.html, /<div id="game-ui"/);
  assert.match(files.html, /<script type="module" src="\/src\/main\.ts"><\/script>/);
  assert.match(files.main, /querySelector<HTMLCanvasElement>\("#game-canvas"\)/);
  assert.match(files.main, /querySelector<HTMLElement>\("#game-ui"\)/);
  assert.match(files.main, /new GameRuntime\(\{[\s\S]*quality: forcedQuality,[\s\S]*adaptiveQuality: forcedQuality === undefined,[\s\S]*\}\)/);
  assert.match(files.main, /new VerticalSliceModule\(\)/);
  assert.match(files.main, /if \(!qaBaseline\) runtime\.addModule\(new VerticalSliceModule\(\)\)/);
  assert.match(files.main, /requestedQuality === "low" \|\| requestedQuality === "medium" \|\| requestedQuality === "high" \|\| requestedQuality === "ultra"/);
  assert.match(files.main, /Object\.defineProperty\(window, "__VEILFALL__", \{ value: runtime, writable: false \}\)/);
});

test('renderer explicitly requires WebGL2 and requests a performance context', () => {
  assert.match(files.renderer, /getContext\("webgl2"/);
  assert.match(files.renderer, /powerPreference: "high-performance"/);
  assert.match(files.renderer, /if \(!context\) throw new Error\("Veilfall requires WebGL2\."\)/);
  assert.match(files.renderer, /SRGBColorSpace/);
  assert.match(files.renderer, /ACESFilmicToneMapping/);
  assert.match(files.renderer, /Math\.min\([\s\S]*TIER_PIXEL_RATIO\[quality\]/);
  assert.match(files.runtime, /deltaSeconds = Math\.min\(this\.clock\.getDelta\(\), 0\.1\)/);
  assert.match(files.runtime, /fixedStepSeconds \?\? 1 \/ 60/);
  assert.match(files.runtime, /fixedSteps < 3/);
  assert.match(files.runtime, /this\.accumulatorSeconds %= this\.fixedStepSeconds/);
});

test('all forms are declared, bounded, and mechanically differentiated', () => {
  const names = ['nightbound', 'wraith', 'dreadwolf', 'stonewrought'];
  assert.match(files.gameplayTypes, /PlayerForm = 'nightbound' \| 'wraith' \| 'dreadwolf' \| 'stonewrought'/);
  const forms = Object.fromEntries(names.map((name) => [name, blockFor(files.forms, name)]));
  for (const name of names) {
    for (const key of ['moveSpeed', 'acceleration', 'turnSpeed', 'damageTaken', 'resourceRegen', 'dashCooldown', 'dashDistance', 'dashDuration', 'secondaryCooldown']) {
      assert.ok(numeric(forms[name], key) > 0, `${name}.${key} must be positive`);
    }
    assert.ok(numeric(forms[name], 'dashCost') <= 100, `${name} dash cost exceeds resource cap`);
    assert.ok(numeric(forms[name], 'secondaryCost') <= 100, `${name} secondary cost exceeds resource cap`);
  }
  assert.ok(numeric(forms.dreadwolf, 'moveSpeed') > numeric(forms.wraith, 'moveSpeed'), 'dreadwolf must remain the fastest form');
  assert.ok(numeric(forms.wraith, 'dashDistance') >= 7, 'wraith must retain a long phase traversal');
  assert.ok(numeric(forms.stonewrought, 'damageTaken') <= 0.6, 'stonewrought must retain major mitigation');
  assert.ok(numeric(forms.stonewrought, 'moveSpeed') < numeric(forms.nightbound, 'moveSpeed'), 'stonewrought mitigation requires a movement tradeoff');
  assert.match(files.player, /if \(this\.form === 'wraith'\)[\s\S]*spawnProjectile/);
  assert.match(files.player, /if \(this\.form === 'dreadwolf' \|\| this\.form === 'stonewrought'\)[\s\S]*targetsInRadius/);
  assert.match(files.player, /this\.invulnerable = this\.form === 'wraith' \|\| this\.form === 'nightbound'/);
  assert.match(files.player, /this\.form === 'dreadwolf'[\s\S]*'secondary', 'pounce'/);
  assert.match(files.player, /targetsInRadius\(this\.position, 4\.2[\s\S]*'secondary', 'seismic-slam'/);
});

test('QA URLs cover roaming, elite, boss, all forms, and long-form boss capture', () => {
  for (const scenario of ["'roam'", "'elite'", "'boss'"]) assert.match(files.qa, new RegExp(scenario));
  for (const form of ['nightbound', 'wraith', 'dreadwolf', 'stonewrought']) assert.match(files.qa, new RegExp(`form: '${form}'`));
  assert.match(files.qa, /\?scenario=elite&form=wraith/);
  assert.match(files.qa, /\?scenario=boss&form=stonewrought&god=1/);
  assert.match(files.qa, /\?scenario=boss&form=stonewrought&god=1&perf=1/);
  assert.match(files.qa, /\?perf=1&baseline=1/);
  assert.match(files.integration, /get\('scenario'\)/);
  assert.match(files.integration, /get\('form'\)/);
  assert.match(files.integration, /(?:this\.)?qaGodMode = new URLSearchParams\(window\.location\.search\)\.get\('god'\) === '1'/);
  assert.match(files.integration, /qaScenario === 'boss'[\s\S]*qaScenario === 'elite'/);
  assert.match(files.integration, /if \((?:this\.)?qaGodMode\) this\.player\.invulnerable = true/);
});

test('QA performance probe produces a visible 30-second runtime sample', () => {
  assert.match(files.probe, /readonly id = 'qa-performance-probe'/);
  assert.match(files.probe, /const SAMPLE_SECONDS = 30/);
  assert.match(files.probe, /const UPDATE_INTERVAL_SECONDS = 1/);
  assert.match(files.probe, /event\.code !== 'KeyP'/);
  for (const field of ['averageFps', 'onePercentLowFps', 'median', 'p95', 'p99', 'max']) {
    assert.match(files.probe, new RegExp(field));
  }
  assert.match(files.probe, /renderer\.info\.render\.calls/);
  assert.match(files.probe, /renderer\.info\.render\.triangles/);
  assert.match(files.probe, /renderer\.info\.memory\.geometries/);
  assert.match(files.probe, /renderer\.info\.memory\.textures/);
  assert.match(files.probe, /this\.context\.scene\.traverse/);
  assert.match(files.probe, /this\.renderProgress\(elapsed\)/);
  assert.match(files.probe, /WEBGL_debug_renderer_info/);
  assert.match(files.probe, /navigator\.userAgent/);
  assert.match(files.probe, /this\.element\.dataset\.result = JSON\.stringify\(result\)/);
});

test('enemy roster and reduced handcrafted pack counts remain intact', () => {
  for (const kind of ['mourner', 'binder', 'stalker', 'choir', 'elite']) {
    assert.match(files.enemies, new RegExp(`${kind}: \\{ name:`), `missing ${kind} enemy spec`);
  }
  const packs = [...files.enemies.matchAll(/this\.spawnPack\(new THREE\.Vector3\([^)]*\), \[([^\]]+)\]\);/g)];
  assert.equal(packs.length, 4, 'expected four authored enemy packs');
  const members = packs.flatMap((match) => [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]));
  assert.equal(members.length, 9, 'V16 reduced enemy population changed unexpectedly');
  assert.equal(members.filter((kind) => kind === 'elite').length, 1, 'vertical slice requires exactly one elite actor');
  assert.doesNotMatch(files.enemies, /isRanged \? 9/, 'ranged debug-like rectangular lane returned');
  assert.match(files.enemies, /new THREE\.RingGeometry\(0\.38, 0\.82, 36\)/);
  assert.match(files.enemies, /if \(shot\.age > 4/);
  assert.match(files.enemies, /this\.shots\.splice\(i, 1\)/);
  assert.match(files.enemies, /this\.particles\.splice\(i, 1\)/);
});

test('V13 collision is swept, sliding, authored, and shared by traversal and actors', () => {
  assert.match(files.collision, /Math\.ceil\(distance \/ Math\.max\(0\.22, radius \* 0\.55\)\)/);
  assert.match(files.collision, /for \(let pass = 0; pass < 3; pass\+\+\)/);
  assert.match(files.collision, /this\.projectCircle\(circle, radius\)/);
  assert.match(files.collision, /this\.projectBox\(box, radius\)/);
  assert.match(files.integration, /new CollisionWorld\(/);
  assert.match(files.integration, /this\.dynamicColliders/);
  assert.match(files.integration, /this\.collisionWorld\.resolve\(from, desired, radius/);
  assert.match(files.player, /this\.performSecondary\(context\)/);
  assert.match(files.enemies, /private readonly resolveMovement/);
  assert.match(files.qa, /'collision-gate'/);
});

test('boss phases move with collision and use grounded non-projectile attacks', () => {
  assert.match(files.boss, /BossPhase = 0 \| 1 \| 2 \| 3 \| 4/);
  assert.match(files.boss, /readonly maxHealth = 1800/);
  assert.match(files.boss, /health <= this\.maxHealth \* 0\.33 \? 3 : this\.health <= this\.maxHealth \* 0\.66 \? 2 : 1/);
  assert.match(files.boss, /this\.phase === 1 \? 3 : this\.phase === 2 \? 4 : 5/);
  assert.match(files.boss, /private updateMovement\(dt: number\): boolean/);
  assert.match(files.boss, /this\.resolveMovement\?\.\(this\.position, bossDesired, this\.radius, this\.id\)/);
  assert.match(files.integration, /new BellSaintBoss\([\s\S]*this\.collisionWorld\.resolve\(from, desired, radius, this\.dynamicColliders, id\)/);
  assert.match(files.boss, /if \(next === 2\)[\s\S]*this\.spawnRadialRifts\(4[\s\S]*this\.spawnSigilVolley\(2/);
  assert.match(files.boss, /if \(next === 3\)[\s\S]*this\.spawnRadialRifts\(6[\s\S]*this\.spawnRing\(7, 12/);
  assert.match(files.boss, /private spawnCleaveArc\(/);
  assert.match(files.boss, /private spawnRift\(/);
  assert.match(files.boss, /private spawnSigil\(/);
  assert.doesNotMatch(files.boss, /kind: 'orb'|spawnOrb|spawnRadial\(/, 'energy-ball boss attacks returned');
  assert.match(files.boss, /if \(next === 4\)[\s\S]*this\.hazards\.length = 0/);
  assert.match(files.boss, /disposeHazard\(hazard\.mesh\)/);
  assert.match(files.hud, /1: \{ label: 'PHASE I · THE TOLL', weakness: 'FRACTURE · REND' \}/);
  assert.match(files.hud, /2: \{ label: 'PHASE II · THE CHOIR BELOW', weakness: 'FRACTURE · SPECTRAL' \}/);
  assert.match(files.hud, /3: \{ label: 'PHASE III · LAST RESONANCE', weakness: 'FRACTURE · CRUSH' \}/);
});

test('combat effects use bounded pools and runtime restart/focus hooks are present', () => {
  for (const [kind, count] of [['ring', 24], ['shard', 84], ['arc', 18], ['pillar', 16]]) {
    assert.match(files.effects, new RegExp(`this\\.prewarm\\('${kind}', ${count}\\)`));
  }
  assert.match(files.effects, /if \(!mesh\) return undefined/);
  assert.match(files.effects, /this\.pools\[kind\]\.push\(mesh\)/);
  assert.match(files.integration, /event\.code === 'Enter' && this\.player\.health <= 0/);
  assert.match(files.integration, /window\.location\.reload\(\)/);
  assert.match(files.integration, /window\.removeEventListener\('keydown', this\.restartHandler\)/);
  assert.match(files.vite, /base: "\.\/"/);
});

test('V12 knight remains an explicit candidate with bounded fallback and scale defense', () => {
  assert.match(files.integration, /query\.get\('character'\) === 'v12'/);
  assert.match(files.integration, /preferV12Candidate && await tryAttach\(V12_CHARACTER_ASSET_IDS\.nightbound/);
  assert.match(files.integration, /await tryAttach\(V11_CHARACTER_ASSET_IDS\.nightbound/);
  assert.match(files.integration, /'ready:v12'/);
  assert.match(files.integration, /'ready:v11'/);
  assert.match(files.integration, /'fallback:v11'/);
  assert.match(files.integration, /'fallback:procedural:v12,v11'/);
  assert.match(files.integration, /centerDistanceToActor: center\.distanceTo\(actorPosition\)/);
  assert.match(files.integration, /boundsInFrustum: frustum\.intersectsBox\(bounds\)/);
  assert.match(files.v12Characters, /authoredRootName: 'NightboundKnight'/);
  assert.match(files.v12Characters, /lockAuthoredRootScale: true/);
  assert.match(files.characterRuntime, /this\.restoreAuthoredRootScale\(\)/);
});

test('V14 Mixamo Vampire remains explicit and falls back through V11', () => {
  assert.match(files.integration, /query\.get\('character'\) === 'v14'/);
  assert.match(files.integration, /preferV14Candidate && await tryAttach\(V14_CHARACTER_ASSET_IDS\.nightbound/);
  assert.match(files.integration, /await tryAttach\(V11_CHARACTER_ASSET_IDS\.nightbound/);
  assert.match(files.integration, /'ready:v14'/);
  assert.match(files.integration, /'fallback:procedural:v14,v11'/);
  assert.match(files.v14Characters, /authoredRootName: 'MixamoVampireRig'/);
  assert.match(files.v14Characters, /attackPrimary: 'attack'/);
  assert.match(files.v14Characters, /death: 'death'/);
});
