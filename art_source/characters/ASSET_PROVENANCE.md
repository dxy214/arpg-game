# Version 11 character asset provenance

The three character assets in this directory are original project work. They
were built deterministically with Blender 4.5.12 LTS by
`tooling/blender/build_v11_assets.py`. No third-party or proprietary model,
rig, animation, UV, or texture asset was imported.

## Source and runtime outputs

| Asset | Blender source | Runtime GLB | Authored scene root |
|---|---|---|---|
| Nightbound | `nightbound.blend` | `src/assets/models/nightbound.glb` | `NightboundRig` |
| Husk Mourner | `husk-mourner.blend` | `src/assets/models/husk-mourner.glb` | `HuskMournerRig` |
| Bell-Saint | `bell-saint.blend` | `src/assets/models/bell-saint.glb` | `BellSaintRig` |

The materials use three original project-generated albedos:

- `src/assets/materials/v11-nightbound-cloth-albedo.png`
- `src/assets/materials/v11-mourner-linen-albedo.png`
- `src/assets/materials/v11-bellsaint-vestment-albedo.png`

Their generation prompts and project-level provenance are recorded in
`reviews/assets/V11_IMAGEGEN_MATERIALS.md`. The source PNGs are preserved and
embedded without external runtime dependencies in their corresponding GLBs.

## Rebuild

```bash
/Applications/Blender.app/Contents/MacOS/Blender \
  --background \
  --python tooling/blender/build_v11_assets.py
```

The machine-readable validation result is written to
`src/assets/models/v11-character-manifest.json`. Every output is validated for
its sole authored scene root, skin, unique clip names, material groups,
triangle count, bone count, and byte size.

## Runtime conventions

- Meters, scale `1.0`
- Runtime Y-up, intended +Z forward
- Root at ground origin
- Runtime `rotationY = 0`
- Exact common clips: `idle`, `move`, `attack`, `hurt`, `death`
- Nightbound additionally exports `transform` without root translation
- Bell-Saint additionally exports `phase_pose`

This is a Version 11 vertical-slice pipeline proof, not a claim that these
assets alone equal the fidelity or animation breadth of a shipped commercial
character library.
