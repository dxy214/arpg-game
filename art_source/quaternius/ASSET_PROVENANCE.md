# Quaternius Knight asset provenance

## Source and license

- Asset: **Animated Knight Pack** (released July 2018)
- Author: **Quaternius**
- Official pack page: https://quaternius.com/packs/knightcharacter.html
- Author's itch.io mirror: https://quaternius.itch.io/lowpoly-animated-knight
- License: **CC0 1.0 Universal**
- License text: https://creativecommons.org/publicdomain/zero/1.0/
- Quaternius licensing FAQ: https://quaternius.com/faq.html
- Local source: `incoming/quaternius/KnightCharacter.fbx`
- Source format/version: binary Kaydara FBX 7400
- Source SHA-256: `41f2616fb4a42f9d35e242bbed1450ededc7537def4bf38cbb11b4e54ff2bf21`

The official pack page identifies the asset as CC0 and permits personal and
commercial use. Attribution is not required by CC0, but is retained here for
traceability.

## Source inspection

The supplied FBX contains one skinned mesh (`Knight`), one armature
(`HumanArmature`) with 42 bones, 480 source vertices, 551 source polygons, and
three untextured materials (`Armor`, `Boots`, `Skin`). It contains 12 source
actions. It does **not** contain an accessory mesh, texture image, weapon, helmet,
light, or camera. The exported single-character validation asset therefore uses
the knight body alone; no accessory was invented or fetched from another file.

## Conversion and modifications

Generated file: `src/assets/models/quaternius-knight.glb`

Deterministic conversion script:
`tooling/quaternius/convert_knight.py`

```sh
/Applications/Blender.app/Contents/MacOS/Blender \
  --background --factory-startup \
  --python tooling/quaternius/convert_knight.py -- \
  --input incoming/quaternius/KnightCharacter.fbx \
  --output src/assets/models/quaternius-knight.glb
```

Conversion environment: Blender 4.5.12 LTS. Modifications:

1. Removed any non-character scene objects and exported only the armature plus
   its single skinned mesh.
2. Normalized bind-mesh height from 5.5988257 source units to 1.8 metres and
   placed the bind-mesh feet at ground level. Bone and mesh object scaling is
   applied before export so the glTF root has unit scale.
3. Kept the source-facing direction. Blender's +Y character front converts to
   glTF -Z when exported Y-up.
4. Replaced the three source flat colors with a dark charcoal / oxblood leather /
   muted-skin PBR palette. The FBX imports all three Principled materials with
   Alpha=0 and a masked/transparency mode, despite their diffuse colors having
   alpha 1. Conversion explicitly resets Principled Alpha, diffuse alpha, alpha
   threshold and transparency state so glTF exports them as opaque. No texture
   or image dependency was added.
5. Kept four semantic source actions and added two explicitly documented
   compatibility placeholders by selecting existing non-terminal source actions.
6. Removed 18 constant object-scale F-curves (three axes from each of six clips)
   after applying the FBX importer scale. Without this normalization, Three.js
   `AnimationMixer` would change `NightboundKnight.scale` from unit scale back to
   approximately 0.321496 and collapse the visible character to about 0.579 m.
   Bone-level scale animation is retained.
7. Exported a self-contained GLB with Y-up coordinates, four skin influences,
   no camera/light, no Draco requirement, and animation sampling at 30 fps.

### Runtime clip map

| GLB clip | Source action | Status |
| --- | --- | --- |
| `idle` | `Idle` | direct rename |
| `move` | `Run` | direct rename |
| `attack` | `swordAttackJump` | direct rename; animation works without a weapon mesh |
| `hurt` | `Roll` | compatibility placeholder; evasive/reaction motion, not authored as damage |
| `death` | `Death` | direct rename |
| `transform` | `Jump` | compatibility placeholder; lift/fall motion, not an authored transformation |

The placeholders make all six runtime clip names machine-testable, but they must
not be treated as final authored hurt/transform animation quality.

## Validation

Run the dependency-free structural validator from the project root:

```sh
python3 tooling/quaternius/validate_glb.py
```

Run the actual Three.js loader/runtime-bounds validator (uses the project's
installed `three` dependency):

```sh
node tooling/quaternius/validate_three.mjs
```

The validator checks the GLB 2.0 container, exact six-clip contract, positive
clip durations, one mesh and skin, skin attributes, joint count, 1.8 m grounded
bind bounds, material count, and absence of external texture dependencies.

The structural validator rejects both a non-unit static root scale and any clip
that targets `NightboundKnight.scale`; it also rejects any material not exported
as OPAQUE with base-color alpha 1. The Three.js validator plays every clip through
`AnimationMixer` at five points, requires unit root scale at every sample, checks
visible skinned bounds for collapse, and requires all runtime materials to have
opacity 1, `transparent=false`, `alphaTest=0`, and `visible=true`. Generated GLB
SHA-256 and measured export statistics are recorded below.

<!-- GENERATED_STATS_BEGIN -->
- Output SHA-256: `afc6a309f497c87e503f8a1fa591d84b0b636d998a2fb55e2f8e16ad9ff144a1`
- Output size: 361,240 bytes (about 353 KiB)
- Runtime root: `NightboundKnight`, unit scale, identity rotation
- Bind/runtime bounds (glTF X/Y/Z): approximately
  `[-1.0928, 0.0000, -0.2530]` to `[1.0928, 1.8000, 0.1912]`
- Mesh: 3 material primitives, 956 triangles, 2,046 exported vertex records
  (the exporter splits the 480 source vertices by primitive/normal/skin data)
- Skin: 42 joints, maximum four exported influences per vertex
- Materials: 3; all opaque with alpha 1; embedded/external image textures: 0
- Clips at 30 fps: `idle` 2.666667 s, `move` 0.666667 s,
  `attack` 0.933333 s, `hurt` 1.000000 s, `death` 1.133333 s,
  `transform` 0.966667 s
- Every clip keeps `NightboundKnight.scale == [1, 1, 1]` at all five mixer
  samples. Initial visible heights range from about 1.543 m (`move`, authored
  running crouch) to 1.800 m; `hurt` starts at about 1.614 m because its source
  `Roll` placeholder begins crouched. Across all samples, largest-axis full-body
  extent ranges from about 1.225 m (the compact middle of the jumping attack) to
  4.027 m (translated/rotated roll bounds). These pose-dependent AABBs are not
  model scale regressions; the validator requires at least 1.0 m at every sample,
  which rejects the former scale-collapse output at approximately 0.394–0.579 m.
- Determinism check: a second conversion with Blender 4.5.12 LTS was byte-for-byte
  identical and produced the same SHA-256.
<!-- GENERATED_STATS_END -->
