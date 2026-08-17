import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { normalize, resolve, sep } from 'node:path';
import { test } from 'node:test';

const rootPath = new URL('../dist/', import.meta.url).pathname;

function resolveStaticUrl(input) {
  const pathname = decodeURIComponent(new URL(input, 'http://static.invalid').pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const absolutePath = resolve(rootPath, normalize(relativePath));
  assert.ok(absolutePath.startsWith(resolve(rootPath) + sep), `unsafe static path: ${input}`);
  return absolutePath;
}

test('dist resolves from a plain static host, including QA query URLs', async () => {
  for (const path of ['/', '/?scenario=elite&form=wraith', '/?scenario=boss&form=stonewrought&god=1']) {
    const target = resolveStaticUrl(path);
    assert.ok((await stat(target)).isFile());
    assert.match(await readFile(target, 'utf8'), /<title>Veilfall<\/title>/);
  }

  const index = await readFile(resolveStaticUrl('/'), 'utf8');
  for (const reference of [...index.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])) {
    if (reference.startsWith('#') || reference.startsWith('data:')) continue;
    const target = resolveStaticUrl(reference);
    assert.ok((await stat(target)).isFile(), `${reference} did not resolve from the static root`);
    assert.ok((await readFile(target)).byteLength > 0, `${reference} was empty`);
  }
});
