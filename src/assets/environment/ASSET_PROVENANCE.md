# V15 environment texture provenance

Both V15 environment textures are original images generated for this project
with OpenAI's built-in image-generation tool on 2026-08-12. They do not reuse
game art, photographs, marketplace textures, or V Rising assets.

## Gothic stone

- Project asset: `gothic-stone-v1.jpg`
- Generated source: `/Users/dxy/.codex/generated_images/019fda20-ad26-7c03-aaa9-66dbc66023a5/exec-9e4341f3-dc24-4f94-b77f-86b90990c178.png`
- Prompt: `Seamless square PBR-style albedo texture for ancient damp blue-gray Gothic ruin stone. Irregular hand-cut stone blocks, chipped edges, shallow mortar seams, subtle moss and lichen stains, restrained cool charcoal/teal palette, fine mineral grain, evenly lit neutral albedo, tileable on every edge. No directional lighting, no cast shadows, no perspective, no objects, no text, no symbols, no border. Original dark-fantasy environment material, detailed but not visually noisy.`

## Gnarled bark

- Project asset: `gnarled-bark-v1.jpg`
- Generated source: `/Users/dxy/.codex/generated_images/019fda20-ad26-7c03-aaa9-66dbc66023a5/exec-b6ca846f-cec3-4f4c-82dc-44130ac6d8c9.png`
- Prompt: `Seamless square PBR-style albedo texture for ancient gnarled dead-tree bark in a dark fantasy marsh. Deep vertical fissures, twisted layered bark plates, subtle grey-green lichen and damp brown-black wood, restrained cool neutral palette, fine believable surface grain, evenly lit neutral albedo, tileable on every edge. No directional lighting, no cast shadows, no perspective, no objects, no text, no border. Original material, highly detailed without excessive contrast.`

The generated PNGs were resized to 1024×1024 and exported as quality-86 JPEGs
with macOS `sips`. Runtime materials share one albedo texture per tiling family
and reuse a no-color-space clone as a subtle bump source.
