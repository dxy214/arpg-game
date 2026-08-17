# Version 15 storage and release report

- Final `npm test`: PASS — TypeScript, 14/14 contract/collision tests,
  production build, and 2/2 static-distribution tests.
- Deployable `dist`: approximately 33 MiB; below the 100 MiB gate.
- Application entry `index-WveMky4Q.js`: 175,638 bytes / 54,103 bytes
  deterministic gzip;
  SHA-256 `e73e8133c463a8e90144f23f382633b1f44fcde72c48c10dc33082299920b451`.
- Original V15 stone texture: 478,672 bytes; SHA-256
  `48dc28757d39ab86216b087f5de6ec15d88dedd81a854daf98460e308fc96d04`.
- Original V15 bark texture: 512,058 bytes; SHA-256
  `362b47217c7059a4f467ec43b6e72aa327e6e3cee7bc43c84d6646c2932e397c`.
- Project excluding `node_modules`: approximately 394 MiB; below the 1.8 GiB
  gate. `node_modules` is approximately 90 MiB.
- `dist` contains no `.blend`, `.fbx`, `.py`, or cache files.

The two new 1024×1024 JPEGs add about 0.99 MB to the static build. They are
shared across instanced material families; no per-prop duplicate image files are
emitted.
