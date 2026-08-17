# Version 14 storage and release report

- Final `npm test`: PASS — TypeScript, 14/14 contract/collision tests, production build, and 2/2 static-distribution tests.
- Deployable `dist`: 33,440,856 logical bytes (31.89 MiB); still below the established 100 MiB gate.
- Application entry `index-NRlxGeqV.js`: 168,452 bytes / 51,725 deterministic gzip.
- Lazy character runtime `CharacterAssetRuntime-BOwAg7FX.js`: 51,924 bytes / 15,414 gzip.
- Mixamo candidate `mixamo-vampire-NEC355Zp.glb`: 16,832,820 bytes / 16,179,557 gzip; SHA-256 `33e51c4c3b4e650883cc2e666b56cd928c1706f1748f671c24447e7c1c6169f9`.
- Project excluding `node_modules`: about 391.0 MiB logical (within the 1.8 GiB gate).
- Raw FBX sources, conversion script, checksums and provenance remain under `art_source/mixamo` and `tooling/mixamo`; they are absent from `dist`.

The candidate is texture-heavy: five embedded PNGs consume about 15.66 MB, including four 2048×2048 maps. A future accepted release should transcode those maps to KTX2/WebP or downsample selectively. V14 deliberately preserves the source texture quality for an honest first visual trial.
