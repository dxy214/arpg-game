# Version 16 storage and release report

- Final `npm test`: PASS — TypeScript, 14/14 contract/collision tests,
  production build, and 2/2 static tests.
- Deployable `dist`: 63,196 KiB allocated (about 61.7 MiB), below the 100 MiB gate.
- Application entry `index-Ducm0u7O.js`: 178,033 bytes / 54,667 bytes
  deterministic gzip; SHA-256
  `0a39c3ec9a10aa5f35e58a1e38c49b44828a18c7145bf2f2de6f26bcd5b0e46d`.
- Mixamo Warrok: 12,223,196 bytes; SHA-256
  `ade9085af25e373a16e141c5ab2588603bc84e6de2d624f21045f6dc03c1caaf`.
- Mixamo Skeletonzombie: 17,955,676 bytes; SHA-256
  `d2c320507b2c055df323aecba97c7ec9d911e52e3384a7e77b89ebe7a26b30c0`.
- Project excluding `node_modules`: approximately 480 MiB; below the 1.8 GiB gate.

The two new GLBs contain about 28.1 MB of embedded 2048×2048 PNG textures. This
is acceptable for the current static budget but should be transcoded to KTX2 or
WebP before a public deployment.
