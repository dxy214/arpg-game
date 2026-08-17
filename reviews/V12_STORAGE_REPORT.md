# Veilfall Version 12 storage and bundle report

## Verdict

All measured Version 12 storage and bundle budgets pass on the final locked build. The optional Quaternius knight is deployed for the explicit `?character=v12` evaluation path; normal play continues to select the V11 Nightbound.

| Budget | Version 12 | Limit | Result |
| --- | ---: | ---: | --- |
| Deployable `dist` disk footprint | 15.85 MiB (16,232 KiB allocated) | 100 MiB | PASS (15.9%) |
| Deployable `dist` logical bytes | 16,587,639 bytes (15.82 MiB) | 100 MiB | PASS |
| Main entry raw | 749,944 bytes | 750,000 bytes regression ceiling | PASS by 56 bytes |
| Main entry deterministic gzip | 199,092 bytes (194.43 KiB) | 250 KiB | PASS (77.8%) |
| Project excluding `node_modules` | 338.48 MiB (346,604 KiB allocated) | 1.8 GiB | PASS (18.4%) |
| FBX/Blend/archive/Python/cache artifacts in `dist` | 0 | 0 | PASS |

Disk-footprint values use macOS `du -sk` allocation. Individual build files and deterministic gzip values use logical bytes from `npm run test:dist` and `reviews/performance/bundle-metrics.json`.

## Exact locked build

Full `npm test` passed after one real regression-gate failure was fixed. The first exclusive attempt produced a 750,009-byte main chunk, exceeding the 750,000-byte ceiling by 9 bytes. A semantics-neutral diagnostic trim was applied and the complete sequence was rerun; typecheck, all 9/9 source contracts, production build, and both 2/2 static-distribution tests then passed.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `dist/assets/index-CIumqGUk.js` | 749,944 | `ddab6e7741be70ec47d8c564599adb9b9e6a6092e7e8bab564d4d900fde97d9f` |
| `dist/assets/CharacterAssetRuntime-DPtFPyOC.js` | 51,885 | `dd866d0c7ad6c4ec41d438ce8007bda40ea22b594d9e0bc2b66c4f38a706111f` |
| `dist/assets/quaternius-knight-DBTCfe9f.glb` | 361,240 | `afc6a309f497c87e503f8a1fa591d84b0b636d998a2fb55e2f8e16ad9ff144a1` |

The deployed candidate GLB exactly matches the source GLB hash. The retained source FBX is 2,092,236 bytes with SHA-256 `41f2616fb4a42f9d35e242bbed1450ededc7537def4bf38cbb11b4e54ff2bf21`; it remains outside `dist`.

## Version 11 comparison

| Measure | V11 | V12 | Delta |
| --- | ---: | ---: | ---: |
| `dist` allocated | 15.50 MiB | 15.85 MiB | +0.35 MiB |
| Main entry raw | 748,217 B | 749,944 B | +1,727 B (+0.23%) |
| Main entry deterministic gzip | 198,468 B | 199,092 B | +624 B (+0.31%) |
| Lazy character runtime raw | 51,589 B | 51,885 B | +296 B (+0.57%) |
| Lazy character runtime gzip | 15,330 B | 15,399 B | +69 B (+0.45%) |
| Project excluding `node_modules` | 334.14 MiB | 338.48 MiB | +4.34 MiB |

The deployable increase is dominated by the 361,240-byte optional candidate GLB. Repository growth is larger because the original FBX, deterministic conversion/validation tooling, provenance, and review evidence are retained outside the shipped build.

## Project footprint

| Path | Allocated size |
| --- | ---: |
| Entire project | 428.79 MiB |
| `node_modules` | 90.31 MiB |
| Project excluding `node_modules` | **338.48 MiB** |
| `dist` | **15.85 MiB** |
| `src` | 24.84 MiB |
| `src/assets` | 24.44 MiB |
| `art_source` | 30.28 MiB |
| `reviews` | 265.22 MiB |
| `reviews/evidence` | 257.79 MiB |
| `tooling` | 0.14 MiB |

Review evidence remains the dominant non-dependency category and is not shipped.

## Deployable contents and hygiene

The final logical deployment totals 16,587,639 bytes. It contains HTML, CSS, JavaScript and source maps, three JPG materials, the three V11 authored GLBs, and the optional 361,240-byte V12 GLB. No `.fbx`, `.blend`, `.blend1`, archive, `.py`, `.pyc`, `__pycache__`, or `.cache` artifact was found in `dist`. Static-build tests also verified that runtime references are local and resolvable from a plain static host.

## Interpretation

The candidate's package cost is small and safely within all budgets, but package efficiency does not establish visible quality. The root gameplay review found the CC0 low-poly candidate materially worse than the V11 authored Nightbound, so V12 keeps it behind the explicit evaluation query rather than making it the default.
