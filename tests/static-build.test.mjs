import assert from 'node:assert/strict';
import { brotliCompressSync, constants as zlibConstants, gzipSync } from 'node:zlib';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, relative } from 'node:path';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    return entry.isDirectory() ? walk(url) : [url];
  }));
  return nested.flat();
}

test('static build is self-contained, referentially intact, and measured', async () => {
  const indexUrl = new URL('index.html', dist);
  const index = await readFile(indexUrl, 'utf8');
  assert.match(index, /<canvas id="game-canvas"/);
  assert.match(index, /<div id="game-ui"/);

  const references = [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(references.some((value) => value.endsWith('.js')), 'built HTML must reference a JavaScript entry');
  assert.ok(references.some((value) => value.endsWith('.css')), 'built HTML must reference a CSS entry');
  for (const reference of references) {
    assert.ok(!/^(?:https?:)?\/\//.test(reference), `external build reference is forbidden: ${reference}`);
    if (reference.startsWith('#') || reference.startsWith('data:')) continue;
    const target = new URL(reference, indexUrl);
    assert.ok((await stat(target)).isFile(), `missing built asset: ${reference}`);
  }

  const builtFiles = await walk(dist);
  const metrics = [];
  for (const file of builtFiles) {
    const data = await readFile(file);
    const path = relative(new URL('.', dist).pathname, file.pathname);
    metrics.push({
      path,
      type: extname(path).slice(1) || 'file',
      bytes: data.byteLength,
      gzipBytes: gzipSync(data, { level: 9 }).byteLength,
      brotliBytes: brotliCompressSync(data, { params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 6 } }).byteLength,
    });
    if (/\.(?:html|css|js|map)$/.test(path)) {
      const text = data.toString('utf8');
      assert.doesNotMatch(text, /(?:src|href|url\()\s*["']?https?:\/\//i, `remote runtime asset in ${path}`);
    }
  }
  metrics.sort((a, b) => a.path.localeCompare(b.path));
  const totals = metrics.reduce((sum, item) => ({
    bytes: sum.bytes + item.bytes,
    gzipBytes: sum.gzipBytes + item.gzipBytes,
    brotliBytes: sum.brotliBytes + item.brotliBytes,
  }), { bytes: 0, gzipBytes: 0, brotliBytes: 0 });
  const output = {
    generatedBy: 'npm run test:dist',
    deterministicInputs: true,
    compression: { gzipLevel: 9, brotliQuality: 6 },
    totals,
    files: metrics,
  };
  await mkdir(new URL('reviews/performance/', root), { recursive: true });
  await writeFile(new URL('reviews/performance/bundle-metrics.json', root), `${JSON.stringify(output, null, 2)}\n`);

  const js = metrics.filter((item) => item.type === 'js');
  assert.ok(js.length >= 1, 'expected at least one JavaScript chunk');
  assert.ok(js.every((item) => item.bytes < 750_000), 'a JavaScript chunk exceeded the 750 kB regression ceiling');
});
