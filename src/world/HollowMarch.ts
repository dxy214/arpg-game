import * as THREE from 'three';
import groundAlbedoUrl from '../assets/hollow-march-ground-v2.jpg';
import gothicStoneUrl from '../assets/environment/gothic-stone-v1.jpg';
import gnarledBarkUrl from '../assets/environment/gnarled-bark-v1.jpg';
import bellSanctumFloorUrl from '../assets/environment/bell-sanctum-floor-v1.jpg';
import bellSanctumWallUrl from '../assets/environment/bell-sanctum-wall-v1.jpg';
import bellSanctumRunnerUrl from '../assets/environment/bell-sanctum-runner-v1.jpg';
import type { CollisionBox, CollisionCircle } from '../physics/CollisionWorld';

export const LANDMARKS = {
  spawn: new THREE.Vector3(0, 0, 26),
  chapel: new THREE.Vector3(-12, 0, 3),
  elite: new THREE.Vector3(8, 0, -10),
  bossGate: new THREE.Vector3(0, 0, -31),
  bossArena: new THREE.Vector3(0, 0, -43),
} as const;

const PALETTE = {
  peat: 0x171d1b,
  soil: 0x1d2624,
  moss: 0x20382f,
  mossLight: 0x29443a,
  stone: 0x2b3438,
  stoneEdge: 0x4d5d61,
  water: 0x071b21,
  ember: 0xff8a4c,
  witchlight: 0x75e3d5,
  moon: 0xbad7ff,
  bark: 0x2b2422,
  barkEdge: 0x403530,
  fern: 0x28473a,
  deadLeaf: 0x5b4837,
  lichen: 0x60776a,
};

type Random = () => number;

function seeded(seed = 0x8f31a9): Random {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0xffffffff;
  };
}

function standard(color: number, roughness = 0.84, metalness = 0.03) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

type SharedMaterialTexture = {
  map?: THREE.Texture;
  bump?: THREE.Texture;
  readonly materials: Set<THREE.MeshStandardMaterial>;
};

const sharedMaterialTextures = new Map<string, SharedMaterialTexture>();

function applyTiledPbr(
  material: THREE.MeshStandardMaterial,
  url: string,
  repeatX: number,
  repeatY: number,
  bumpScale: number,
) {
  const key = `${url}|${repeatX}|${repeatY}`;
  let shared = sharedMaterialTextures.get(key);
  if (!shared) {
    shared = { materials: new Set() };
    sharedMaterialTextures.set(key, shared);
    new THREE.TextureLoader().load(url, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      const bump = texture.clone();
      bump.colorSpace = THREE.NoColorSpace;
      bump.needsUpdate = true;
      shared!.map = texture;
      shared!.bump = bump;
      for (const target of shared!.materials) {
        target.map = texture;
        if (target.userData.albedoEmissive) target.emissiveMap = texture;
        target.bumpMap = bump;
        target.bumpScale = bumpScale;
        target.needsUpdate = true;
      }
    });
  }
  shared.materials.add(material);
  if (shared.map && shared.bump) {
    material.map = shared.map;
    if (material.userData.albedoEmissive) material.emissiveMap = shared.map;
    material.bumpMap = shared.bump;
    material.bumpScale = bumpScale;
    material.needsUpdate = true;
  }
  return material;
}

function stoneMaterial(color: number, roughness = 0.88, repeat = 1.6) {
  // Albedo maps already carry dark mortar and crevice values. A near-white
  // cool tint prevents multiplying those values into crushed black while still
  // letting each authored material family retain a distinct hue.
  const tint = new THREE.Color(color).lerp(new THREE.Color(0xe4e9e6), 0.72);
  return applyTiledPbr(
    new THREE.MeshStandardMaterial({ color: tint, roughness, metalness: 0.025 }),
    gothicStoneUrl,
    repeat,
    repeat,
    0.075,
  );
}

function sanctumWallMaterial(repeat = 1.18) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xd1d7d6,
    roughness: 0.88,
    metalness: 0.025,
    emissive: 0x809398,
    emissiveIntensity: 0.34,
  });
  material.userData.albedoEmissive = true;
  return applyTiledPbr(
    material,
    bellSanctumWallUrl,
    repeat,
    repeat,
    0.105,
  );
}

function barkMaterial(color: number, repeatY = 2.8) {
  const tint = new THREE.Color(color).lerp(new THREE.Color(0xa99b8d), 0.62);
  return applyTiledPbr(
    new THREE.MeshStandardMaterial({ color: tint, roughness: 0.96, metalness: 0 }),
    gnarledBarkUrl,
    1.1,
    repeatY,
    0.095,
  );
}

function enableShadows(object: THREE.Object3D, receive = true) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = receive;
    }
  });
  return object;
}

function proceduralGroundTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  const image = context.createImageData(size, size);
  const rng = seeded(0x77ed11);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const broad = Math.sin(x * 0.075) * 4 + Math.sin(y * 0.093 + x * 0.02) * 5;
      const grain = (rng() - 0.5) * 17;
      const vein = Math.sin((x + y) * 0.22 + Math.sin(y * 0.06) * 5) > 0.94 ? 7 : 0;
      const index = (x + y * size) * 4;
      image.data[index] = 22 + broad + grain;
      image.data[index + 1] = 31 + broad * 1.45 + grain + vein;
      image.data[index + 2] = 32 + broad * 1.25 + grain * 0.75 + vein;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5.6, 7.4);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function radialTexture(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.22, color.replace('1)', '0.72)'));
  gradient.addColorStop(0.62, color.replace('1)', '0.18)'));
  gradient.addColorStop(1, color.replace('1)', '0)'));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function organicShape(rng: Random, radiusX: number, radiusZ: number, steps = 22) {
  const shape = new THREE.Shape();
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const wobble = 0.86 + rng() * 0.2 + Math.sin(angle * 3 + radiusX) * 0.06;
    const x = Math.cos(angle) * radiusX * wobble;
    const y = Math.sin(angle) * radiusZ * wobble;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function makeFernClusterGeometry() {
  const positions: number[] = [];
  const bladeCount = 9;
  for (let i = 0; i < bladeCount; i++) {
    const angle = (i / bladeCount) * Math.PI * 2;
    const height = 0.58 + (i % 4) * 0.12;
    const reach = 0.28 + (i % 3) * 0.08;
    const width = 0.075 + (i % 2) * 0.02;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const px = -dz * width;
    const pz = dx * width;
    const tipX = dx * reach;
    const tipZ = dz * reach;
    positions.push(
      px, 0, pz,
      tipX, height, tipZ,
      -px, 0, -pz,
      -px, 0, -pz,
      tipX, height, tipZ,
      dx * reach * 0.55, height * 0.42, dz * reach * 0.55,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeLeafLitterGeometry() {
  const positions: number[] = [];
  for (let i = 0; i < 11; i++) {
    const angle = i * 2.399;
    const radius = 0.11 + (i % 4) * 0.095;
    const cx = Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius;
    const size = 0.055 + (i % 3) * 0.018;
    positions.push(
      cx - size, 0, cz,
      cx + size, 0, cz - size * 0.34,
      cx, 0, cz + size * 1.5,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** A bent, elliptical, ring-built silhouette; deliberately not a cylinder. */
function makeGnarledWoodGeometry(
  seed: number,
  height: number,
  baseRadius: number,
  tipRadius: number,
  rings = 8,
  segments = 9,
) {
  const rng = seeded(seed);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const ringOffsets: Array<[number, number]> = [];
  for (let ring = 0; ring < rings; ring++) {
    const t = ring / (rings - 1);
    const sway = Math.sin(t * Math.PI * 1.18) * (0.13 + rng() * 0.08);
    ringOffsets.push([
      sway + Math.sin(t * 7.1 + seed) * 0.055,
      Math.cos(t * 5.3 + seed * 0.37) * 0.065 * t,
    ]);
    const taper = THREE.MathUtils.lerp(baseRadius, tipRadius, Math.pow(t, 0.72));
    const knot = ring === 1 ? 1.15 : ring === rings - 2 ? 0.84 : 1;
    for (let segment = 0; segment < segments; segment++) {
      const angle = segment / segments * Math.PI * 2;
      const facet = 0.82 + 0.15 * Math.sin(segment * 2.17 + seed) + rng() * 0.08;
      const ellipse = segment % 2 === 0 ? 1.08 : 0.91;
      positions.push(
        ringOffsets[ring][0] + Math.cos(angle) * taper * facet * ellipse * knot,
        t * height,
        ringOffsets[ring][1] + Math.sin(angle) * taper * facet / ellipse * knot,
      );
      uvs.push(segment / segments, t);
    }
  }
  for (let ring = 0; ring < rings - 1; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const next = (segment + 1) % segments;
      const a = ring * segments + segment;
      const b = ring * segments + next;
      const c = (ring + 1) * segments + next;
      const d = (ring + 1) * segments + segment;
      indices.push(a, b, d, b, c, d);
    }
  }
  const bottom = positions.length / 3;
  positions.push(ringOffsets[0][0], 0, ringOffsets[0][1]);
  uvs.push(0.5, 0.5);
  const top = positions.length / 3;
  positions.push(ringOffsets.at(-1)?.[0] ?? 0, height, ringOffsets.at(-1)?.[1] ?? 0);
  uvs.push(0.5, 0.5);
  for (let segment = 0; segment < segments; segment++) {
    const next = (segment + 1) % segments;
    indices.push(bottom, next, segment);
    indices.push(top, (rings - 1) * segments + segment, (rings - 1) * segments + next);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeHangingVineGeometry(seed = 0x5517) {
  const rng = seeded(seed);
  const points = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08 + rng() * 0.08, -0.72, 0.03),
    new THREE.Vector3(-0.12 - rng() * 0.08, -1.42, 0.06),
    new THREE.Vector3(0.1 + rng() * 0.12, -2.18, 0.02),
    new THREE.Vector3(-0.05, -2.82, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 10, 0.035, 5, false);
  geometry.computeVertexNormals();
  return geometry;
}

function makeIrregularRockGeometry(seed = 0x71a3) {
  const geometry = new THREE.IcosahedronGeometry(0.58, 1);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const erosion = 0.82
      + Math.sin(x * 12.7 + z * 7.1 + seed) * 0.11
      + Math.cos(y * 10.3 - x * 4.6) * 0.07;
    position.setXYZ(i, x * erosion, y * erosion, z * erosion);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function makeGothicGraveGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.34, 0);
  shape.lineTo(0.34, 0);
  shape.lineTo(0.34, 0.82);
  shape.lineTo(0.29, 0.9);
  shape.lineTo(0.31, 1.03);
  shape.lineTo(0.18, 1.18);
  shape.lineTo(0, 1.42);
  shape.lineTo(-0.18, 1.18);
  shape.lineTo(-0.31, 1.03);
  shape.lineTo(-0.27, 0.91);
  shape.lineTo(-0.34, 0.8);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 3,
  });
  geometry.translate(0, 0, -0.11);
  geometry.computeVertexNormals();
  return geometry;
}

function makeRuinPierGeometry() {
  const profile = [
    new THREE.Vector2(0.58, 0),
    new THREE.Vector2(0.58, 0.16),
    new THREE.Vector2(0.43, 0.28),
    new THREE.Vector2(0.34, 0.42),
    new THREE.Vector2(0.29, 3.45),
    new THREE.Vector2(0.38, 3.58),
    new THREE.Vector2(0.48, 3.7),
    new THREE.Vector2(0.48, 3.88),
  ];
  const geometry = new THREE.LatheGeometry(profile, 8);
  geometry.rotateY(Math.PI / 8);
  geometry.computeVertexNormals();
  return geometry;
}

function makeBrokenApseGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-3.6, 0);
  shape.lineTo(3.6, 0);
  shape.lineTo(3.6, 3.45);
  shape.lineTo(3.1, 3.7);
  shape.lineTo(2.45, 3.55);
  shape.lineTo(1.7, 3.92);
  shape.lineTo(0.85, 3.74);
  shape.lineTo(0.12, 4.08);
  shape.lineTo(-0.62, 3.78);
  shape.lineTo(-1.55, 3.98);
  shape.lineTo(-2.42, 3.62);
  shape.lineTo(-3.08, 3.82);
  shape.lineTo(-3.6, 3.46);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.64,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.06,
    bevelThickness: 0.055,
  });
  geometry.translate(0, 0, -0.32);
  return geometry;
}

function makeAqueductSpanGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.82, 0);
  shape.lineTo(1.82, 0);
  shape.lineTo(1.82, 4.35);
  shape.lineTo(-1.82, 4.35);
  shape.closePath();
  const opening = new THREE.Path();
  opening.moveTo(-1.05, 0);
  opening.lineTo(-1.05, 2.18);
  opening.absarc(0, 2.18, 1.05, Math.PI, 0, true);
  opening.lineTo(1.05, 0);
  opening.closePath();
  shape.holes.push(opening);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.12,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.055,
    bevelThickness: 0.045,
    curveSegments: 9,
  });
  geometry.translate(0, 0, -0.56);
  return geometry;
}

function makeObeliskGeometry() {
  const positions: number[] = [];
  const indices: number[] = [];
  const segments = 8;
  const levels = [
    { y: 0, radius: 0.58 },
    { y: 0.18, radius: 0.68 },
    { y: 0.34, radius: 0.48 },
    { y: 0.82, radius: 0.4 },
    { y: 1, radius: 0.08 },
  ];
  for (const [levelIndex, level] of levels.entries()) {
    for (let i = 0; i < segments; i++) {
      const angle = i / segments * Math.PI * 2 + Math.PI / 8;
      const chip = levelIndex === levels.length - 1 && i % 3 === 0 ? 0.72 : 1;
      positions.push(Math.cos(angle) * level.radius * chip, level.y, Math.sin(angle) * level.radius * chip);
    }
  }
  for (let level = 0; level < levels.length - 1; level++) {
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = level * segments + i;
      const b = level * segments + next;
      const c = (level + 1) * segments + next;
      const d = (level + 1) * segments + i;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeChippedPlatformGeometry(radiusX: number, radiusZ: number, height: number, seed: number) {
  const rng = seeded(seed);
  const shape = new THREE.Shape();
  const steps = 18;
  for (let i = 0; i < steps; i++) {
    const angle = i / steps * Math.PI * 2;
    const chipped = i % 5 === 0 ? 0.84 + rng() * 0.06 : 0.94 + rng() * 0.09;
    const x = Math.cos(angle) * radiusX * chipped;
    const z = Math.sin(angle) * radiusZ * chipped;
    if (i === 0) shape.moveTo(x, z);
    else shape.lineTo(x, z);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: Math.min(0.12, height * 0.28),
    bevelThickness: Math.min(0.08, height * 0.2),
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function makeChippedStepGeometry(width: number, depth: number, height: number, seed: number) {
  const rng = seeded(seed);
  const shape = new THREE.Shape();
  const points: Array<[number, number]> = [
    [-width * 0.5, -depth * 0.5 + rng() * 0.08],
    [-width * 0.22, -depth * 0.5 - rng() * 0.04],
    [width * 0.16, -depth * 0.5 + rng() * 0.05],
    [width * 0.5, -depth * 0.42],
    [width * 0.47, depth * 0.13],
    [width * 0.39, depth * 0.5],
    [width * 0.05, depth * 0.46],
    [-width * 0.3, depth * 0.5 + rng() * 0.04],
    [-width * 0.5, depth * 0.38],
  ];
  for (const [index, point] of points.entries()) {
    if (index === 0) shape.moveTo(point[0], point[1]);
    else shape.lineTo(point[0], point[1]);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.045,
    bevelThickness: 0.035,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height, 0);
  return geometry;
}

function makeGraveReliefGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.035, -0.36);
  shape.lineTo(0.035, -0.36);
  shape.lineTo(0.035, -0.08);
  shape.lineTo(0.18, -0.08);
  shape.lineTo(0.18, 0.01);
  shape.lineTo(0.035, 0.01);
  shape.lineTo(0.035, 0.3);
  shape.lineTo(-0.035, 0.3);
  shape.lineTo(-0.035, 0.01);
  shape.lineTo(-0.18, 0.01);
  shape.lineTo(-0.18, -0.08);
  shape.lineTo(-0.035, -0.08);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function makeLeafCrownGeometry(seed = 0xa931) {
  const rng = seeded(seed);
  const positions: number[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 0.18 + rng() * 0.82;
    const cx = Math.cos(angle) * radius;
    const cy = (rng() - 0.5) * 0.9;
    const cz = Math.sin(angle) * radius * 0.72;
    const width = 0.11 + rng() * 0.12;
    const height = 0.22 + rng() * 0.25;
    const tangentX = -Math.sin(angle) * width;
    const tangentZ = Math.cos(angle) * width;
    positions.push(
      cx - tangentX, cy, cz - tangentZ,
      cx, cy + height, cz,
      cx + tangentX, cy, cz + tangentZ,
      cx - tangentX, cy, cz - tangentZ,
      cx + tangentX, cy, cz + tangentZ,
      cx, cy - height * 0.72, cz,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeGothicGate() {
  const group = new THREE.Group();
  group.name = 'Gate of the Last Voice';
  const stone = stoneMaterial(PALETTE.stone, 0.86, 1.35);
  const trim = stoneMaterial(PALETTE.stoneEdge, 0.78, 1.15);
  const iron = standard(0x171d20, 0.48, 0.68);

  for (const side of [-1, 1]) {
    const pier = new THREE.Mesh(makeRuinPierGeometry(), stone);
    pier.position.set(side * 2.35, 0, 0);
    pier.scale.set(1.14, 1.48, 1.28);
    pier.rotation.z = side * -0.025;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 1.9), trim);
    foot.position.set(side * 2.35, 0.27, 0);
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 1.7), trim);
    shoulder.position.set(side * 2.35, 5.65, 0);
    const finial = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.25, 4), stone);
    finial.position.set(side * 2.35, 7, 0);
    finial.rotation.y = Math.PI / 4;
    group.add(pier, foot, shoulder, finial);
  }

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.8, 1.5), stone);
  lintel.position.y = 5.25;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(2.15, 2.5, 4), stone);
  crown.position.y = 6.55;
  crown.rotation.y = Math.PI / 4;
  crown.scale.z = 0.45;
  group.add(lintel, crown);

  for (const side of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.85, 4.4, 0.15), iron);
    door.position.set(side * 0.96, 2.25, 0.2);
    door.rotation.y = side * 0.16;
    group.add(door);
  }

  const runeMat = new THREE.MeshBasicMaterial({ color: PALETTE.witchlight, transparent: true, opacity: 0.72, toneMapped: false });
  const rune = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.055, 6, 36), runeMat);
  rune.position.set(0, 6.02, 0.8);
  group.add(rune);
  for (let i = 0; i < 4; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.42, 3), runeMat);
    const angle = i * Math.PI * 0.5;
    tooth.position.set(Math.cos(angle) * 0.7, 6.02 + Math.sin(angle) * 0.7, 0.82);
    tooth.rotation.z = angle - Math.PI / 2;
    group.add(tooth);
  }
  const glow = new THREE.PointLight(PALETTE.witchlight, 5.5, 16, 2);
  glow.position.set(0, 5.8, 1.2);
  group.add(glow);
  return enableShadows(group);
}

function makeBellShrine() {
  const group = new THREE.Group();
  const stone = stoneMaterial(0x303a3d, 0.9, 1.35);
  const bronze = standard(0x705346, 0.42, 0.66);
  const base = new THREE.Mesh(makeChippedPlatformGeometry(2.55, 2.25, 0.42, 0xb311), stone);
  base.position.y = 0;
  group.add(base);
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(makeRuinPierGeometry(), stone);
    pillar.position.set(side * 1.45, 0.35, 0);
    pillar.scale.set(0.65, 1.06, 0.65);
    group.add(pillar);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.35, 0.45), stone);
  beam.position.y = 4.45;
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.68, 1.15, 12), bronze);
  bell.position.set(0, 3.75, 0);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), bronze);
  clapper.position.set(0, 3.06, 0);
  group.add(beam, bell, clapper);
  return enableShadows(group);
}

function makePointedWindowGeometry(width: number, height: number) {
  const shape = new THREE.Shape();
  const halfWidth = width * 0.5;
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(halfWidth, 0);
  shape.lineTo(halfWidth, height * 0.62);
  shape.quadraticCurveTo(halfWidth * 0.72, height * 0.84, 0, height);
  shape.quadraticCurveTo(-halfWidth * 0.72, height * 0.84, -halfWidth, height * 0.62);
  shape.closePath();
  return new THREE.ShapeGeometry(shape, 8);
}

function makeTatteredBannerGeometry(width: number, height: number, seed: number) {
  const rng = seeded(seed);
  const columns = 4;
  const rows = 7;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= rows; y++) {
    const v = y / rows;
    for (let x = 0; x <= columns; x++) {
      const u = x / columns;
      const edgeTaper = 1 - Math.max(0, v - 0.72) * (0.2 + (x % 2) * 0.18);
      const px = (u - 0.5) * width * edgeTaper;
      const py = -v * height + (y === rows ? (x % 2) * 0.18 + rng() * 0.14 : 0);
      const pz = Math.sin(u * Math.PI * 3 + v * 2.2) * 0.075 + (rng() - 0.5) * 0.018;
      positions.push(px, py, pz);
      uvs.push(u, 1 - v);
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const a = y * (columns + 1) + x;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Rear-only architecture gives the arena a room silhouette without occluding play. */
function makeBellSanctumApse() {
  const group = new THREE.Group();
  group.name = 'Ruined Bell Sanctum Apse';
  const wall = sanctumWallMaterial();
  const edge = stoneMaterial(0x59696b, 0.82, 1.2);
  const bronze = standard(0x6e5143, 0.48, 0.62);
  const darkIron = standard(0x171d22, 0.54, 0.68);

  const apse = new THREE.Mesh(makeBrokenApseGeometry(), wall);
  apse.scale.set(1.05, 1.55, 1.15);
  apse.position.y = 0.18;
  group.add(apse);

  for (const [index, x] of [-5.25, 0, 5.25].entries()) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(5.35, index === 1 ? 5.75 : 5.15, 0.52), wall);
    panel.position.set(x, index === 1 ? 2.72 : 2.42, -0.22);
    panel.rotation.z = (index - 1) * 0.012;
    group.add(panel);
  }
  const carvedCrown = new THREE.Mesh(new THREE.BoxGeometry(16.25, 0.7, 0.82), edge);
  carvedCrown.position.set(0, 5.42, -0.12);
  group.add(carvedCrown);

  const apseRibs = new THREE.InstancedMesh(makeRuinPierGeometry(), edge, 7);
  const ribTransform = new THREE.Object3D();
  for (let i = 0; i < 7; i++) {
    ribTransform.position.set(-7.65 + i * 2.55, 0.04, 0.48);
    ribTransform.rotation.set(0, 0, (i - 3) * 0.0035);
    ribTransform.scale.set(i % 3 === 0 ? 0.44 : 0.32, i % 3 === 0 ? 1.42 : 1.26, 0.5);
    ribTransform.updateMatrix();
    apseRibs.setMatrixAt(i, ribTransform.matrix);
  }
  apseRibs.instanceMatrix.needsUpdate = true;
  group.add(apseRibs);

  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(makeAqueductSpanGeometry(), wall);
    wing.position.set(side * 4.65, 0.12, 0.12);
    wing.rotation.y = side * -0.12;
    wing.scale.set(1.08, 1.3, 1.12);
    group.add(wing);

    const buttress = new THREE.Mesh(makeRuinPierGeometry(), edge);
    buttress.position.set(side * 7.15, 0.1, 0.18);
    buttress.scale.set(1.05, 1.65, 1.35);
    buttress.rotation.z = side * -0.035;
    group.add(buttress);

    const banner = new THREE.Mesh(
      makeTatteredBannerGeometry(1.45, 3.65, 0x8811 + side),
      new THREE.MeshStandardMaterial({
        color: side < 0 ? 0x491f2f : 0x293f47,
        roughness: 0.93,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    );
    banner.position.set(side * 4.6, 4.62, 0.78);
    banner.rotation.y = side * -0.1;
    group.add(banner);
  }

  const glassMaterial = new THREE.MeshBasicMaterial({
    color: 0x76c7c1,
    transparent: true,
    opacity: 0.58,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  for (const x of [-4.65, 0, 4.65]) {
    const paneWidth = x === 0 ? 1.38 : 1.08;
    const paneHeight = x === 0 ? 3.2 : 2.62;
    const paneY = x === 0 ? 2.28 : 1.9;
    const pane = new THREE.Mesh(makePointedWindowGeometry(paneWidth, paneHeight), glassMaterial);
    pane.position.set(x, paneY, 0.76);
    group.add(pane);
    const frame = new THREE.Group();
    const uprightHeight = paneHeight * 0.62;
    const uprightGeometry = new THREE.BoxGeometry(0.095, uprightHeight, 0.16);
    for (const side of [-1, 1]) {
      const upright = new THREE.Mesh(uprightGeometry, darkIron);
      upright.position.set(side * paneWidth * 0.5, uprightHeight * 0.5, 0);
      const roofDx = paneWidth * 0.5;
      const roofDy = paneHeight * 0.38;
      const roofLength = Math.hypot(roofDx, roofDy);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(0.1, roofLength, 0.16), darkIron);
      roof.position.set(side * paneWidth * 0.25, uprightHeight + roofDy * 0.5, 0);
      roof.rotation.z = side * Math.atan2(roofDx, roofDy);
      frame.add(upright, roof);
    }
    frame.position.set(x, paneY, 0.85);
    group.add(frame);
  }

  const apseIvy = new THREE.InstancedMesh(
    makeLeafCrownGeometry(0x18273),
    new THREE.MeshStandardMaterial({ color: 0x32483b, roughness: 1, side: THREE.DoubleSide }),
    18,
  );
  for (let i = 0; i < 18; i++) {
    const side = i % 2 ? 1 : -1;
    const x = side * (2.1 + (i % 5) * 1.18);
    ribTransform.position.set(x, 0.38 + (i % 4) * 0.62, 0.92);
    ribTransform.rotation.set(-0.18, i * 1.37, side * 0.08);
    ribTransform.scale.set(0.28 + (i % 3) * 0.12, 0.22 + (i % 4) * 0.09, 0.3 + (i % 2) * 0.1);
    ribTransform.updateMatrix();
    apseIvy.setMatrixAt(i, ribTransform.matrix);
  }
  apseIvy.instanceMatrix.needsUpdate = true;
  group.add(apseIvy);

  const altar = new THREE.Mesh(makeChippedPlatformGeometry(2.55, 1.55, 0.48, 0x81818), edge);
  altar.position.set(0, 0.02, 1.05);
  group.add(altar);
  const bellProfile = [
    new THREE.Vector2(0.2, 0),
    new THREE.Vector2(0.52, 0.16),
    new THREE.Vector2(0.76, 0.36),
    new THREE.Vector2(0.63, 0.98),
    new THREE.Vector2(0.38, 1.48),
    new THREE.Vector2(0.23, 1.62),
  ];
  const bell = new THREE.Mesh(new THREE.LatheGeometry(bellProfile, 20), bronze);
  bell.position.set(0, 3.45, 0.92);
  bell.rotation.z = 0.055;
  group.add(bell);
  const bellHalo = new THREE.PointLight(0x6eb7b2, 4.2, 16, 2);
  bellHalo.position.set(0, 4.15, 1.45);
  group.add(bellHalo);

  return enableShadows(group);
}

function makeBrazier() {
  const group = new THREE.Group();
  const metal = standard(0x392d2b, 0.48, 0.52);
  const stem = new THREE.Mesh(makeGnarledWoodGeometry(0xb221, 0.72, 0.13, 0.075, 5, 7), metal);
  stem.position.y = 0.04;
  const bowlProfile = [
    new THREE.Vector2(0.2, 0),
    new THREE.Vector2(0.42, 0.12),
    new THREE.Vector2(0.54, 0.3),
    new THREE.Vector2(0.5, 0.4),
    new THREE.Vector2(0.35, 0.32),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 14), metal);
  bowl.position.y = 0.72;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.035, 5, 20), metal);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 1.1;
  const legs = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const angle = i / 3 * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.48, 0.07), metal);
    leg.position.set(Math.cos(angle) * 0.24, 0.3, Math.sin(angle) * 0.24);
    leg.rotation.z = Math.cos(angle) * 0.24;
    leg.rotation.x = Math.sin(angle) * 0.24;
    legs.add(leg);
  }
  const flame = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.34, 1),
    new THREE.MeshBasicMaterial({ color: PALETTE.ember, transparent: true, opacity: 0.94, toneMapped: false }),
  );
  flame.position.y = 1.27;
  flame.scale.set(0.68, 1.3, 0.68);
  flame.userData.flame = true;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture('rgba(255,114,60,1)'),
    color: 0xff7847,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  halo.position.y = 1.25;
  halo.scale.set(3.1, 3.1, 1);
  const light = new THREE.PointLight(PALETTE.ember, 4.8, 12, 2);
  light.position.y = 1.8;
  group.add(legs, stem, bowl, rim, flame, halo, light);
  return enableShadows(group, false);
}

export class HollowMarch {
  readonly group = new THREE.Group();
  readonly blockers: THREE.Box3[] = [];
  readonly collisionCircles: CollisionCircle[] = [];
  readonly collisionBoxes: CollisionBox[] = [];
  private readonly motes: THREE.Points;
  private readonly rain: THREE.LineSegments;
  private readonly waterMaterials: THREE.MeshPhysicalMaterial[] = [];
  private readonly mist: THREE.Sprite[] = [];
  private readonly flames: THREE.Object3D[] = [];
  private readonly runeRings: THREE.Mesh[] = [];
  private readonly arenaOrnaments: THREE.Object3D[] = [];
  private readonly bossCulled = new Set<THREE.Object3D>();
  private bossGate?: THREE.Object3D;
  private bossArenaActive = false;
  private bossGateOpacity = 1;
  private quality: 'low' | 'medium' | 'high' | 'ultra' = 'ultra';
  private time = 0;

  constructor() {
    this.group.name = 'The Hollow March';
    const rng = seeded();
    // Split sky/ground bounce preserves the nocturnal palette while lifting the
    // upper planes of props out of the old crushed-black wide shot.
    this.group.add(new THREE.AmbientLight(0x8da5ac, 0.84));
    this.group.add(new THREE.HemisphereLight(0xcbdfe3, 0x445348, 1.4));
    const moonFill = new THREE.DirectionalLight(0xa9cad4, 0.64);
    moonFill.position.set(-18, 26, 12);
    moonFill.target.position.set(5, 0, -18);
    this.group.add(moonFill, moonFill.target);
    const groundRoughness = proceduralGroundTexture();
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xc2c9c1,
      roughnessMap: groundRoughness,
      bumpMap: groundRoughness,
      bumpScale: 0.12,
      roughness: 0.97,
      metalness: 0.015,
      emissive: 0x07100f,
      emissiveIntensity: 0.16,
    });
    new THREE.TextureLoader().load(groundAlbedoUrl, (texture) => {
      // The source has strong pebble-scale contrast. A restrained grade keeps
      // that detail while preventing it from competing with actors and tells.
      const source = texture.image as HTMLImageElement;
      const canvas = document.createElement('canvas');
      canvas.width = source.naturalWidth || source.width;
      canvas.height = source.naturalHeight || source.height;
      const context = canvas.getContext('2d');
      if (context) {
        context.filter = 'contrast(88%) saturate(92%) brightness(97%)';
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
      }
      const softenedTexture = context ? new THREE.CanvasTexture(canvas) : texture;
      softenedTexture.wrapS = softenedTexture.wrapT = THREE.RepeatWrapping;
      softenedTexture.repeat.set(5.6, 7.4);
      softenedTexture.center.set(0.5, 0.5);
      softenedTexture.rotation = 0.08;
      softenedTexture.colorSpace = THREE.SRGBColorSpace;
      softenedTexture.anisotropy = 8;
      groundMaterial.map = softenedTexture;
      groundMaterial.needsUpdate = true;
      if (softenedTexture !== texture) texture.dispose();
    });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(78, 104), groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.12, -10);
    ground.receiveShadow = true;
    ground.userData.bossVisible = true;
    this.group.add(ground);

    // Broad overlapping peat and moss islands break the rectangular ground read.
    const patchGeometries = [
      new THREE.ShapeGeometry(organicShape(seeded(0x991a), 1, 1, 18)),
      new THREE.ShapeGeometry(organicShape(seeded(0x991b), 1, 1, 16)),
    ];
    const mossMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x315046, roughness: 1, transparent: true, opacity: 0.34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
      new THREE.MeshStandardMaterial({ color: 0x24372f, roughness: 1, transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
      new THREE.MeshStandardMaterial({ color: 0x342e28, roughness: 1, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }),
    ];
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    const patchBatches = Array.from({ length: 6 }, (_, index) => new THREE.InstancedMesh(
      patchGeometries[Math.floor(index / 3)],
      mossMaterials[index % 3],
      6,
    ));
    const patchIndices = new Array<number>(patchBatches.length).fill(0);
    for (let i = 0; i < 34; i++) {
      const batchIndex = (i % patchGeometries.length) * mossMaterials.length + (i % mossMaterials.length);
      const patch = patchBatches[batchIndex];
      position.set((rng() - 0.5) * 69, -0.09 + i * 0.00005, 37 - rng() * 94);
      quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rng() * Math.PI));
      scale.set(1.7 + rng() * 5.2, 1.2 + rng() * 3.4, 1);
      matrix.compose(position, quaternion, scale);
      patch.setMatrixAt(patchIndices[batchIndex]++, matrix);
    }
    for (let i = 0; i < patchBatches.length; i++) {
      const patch = patchBatches[i];
      patch.count = patchIndices[i];
      patch.instanceMatrix.needsUpdate = true;
      patch.receiveShadow = true;
      this.group.add(patch);
    }

    // The graveway is a purposeful, broken ribbon rather than evenly spaced boxes.
    const roadShape = new THREE.Shape();
    roadShape.moveTo(-1.08, -0.7);
    roadShape.lineTo(-0.7, -1.09);
    roadShape.lineTo(0.12, -1.03);
    roadShape.lineTo(0.36, -0.75); // a missing corner breaks the paving-card read
    roadShape.lineTo(0.91, -0.88);
    roadShape.lineTo(1.11, -0.28);
    roadShape.lineTo(0.89, 0.24);
    roadShape.lineTo(1.02, 0.68);
    roadShape.lineTo(0.37, 1.03);
    roadShape.lineTo(-0.22, 0.89);
    roadShape.lineTo(-0.74, 1.03);
    roadShape.lineTo(-1.1, 0.43);
    roadShape.closePath();
    const roadGeometry = new THREE.ExtrudeGeometry(roadShape, { depth: 0.12, bevelEnabled: true, bevelSize: 0.085, bevelThickness: 0.055, bevelSegments: 2 });
    roadGeometry.rotateX(Math.PI / 2);
    roadGeometry.translate(0, -0.04, 0);
    const roadPositions = roadGeometry.getAttribute('position') as THREE.BufferAttribute;
    const roadColors = new Float32Array(roadPositions.count * 3);
    const cleanStone = new THREE.Color(0xffffff);
    const mossStone = new THREE.Color(0x667c6d);
    const shadedStone = new THREE.Color(0x747c78);
    const vertexColor = new THREE.Color();
    for (let i = 0; i < roadPositions.count; i++) {
      const edge = Math.max(Math.abs(roadPositions.getX(i)) / 1.12, Math.abs(roadPositions.getZ(i)) / 1.12);
      const brokenVariation = Math.sin(i * 2.17) * 0.08;
      const moss = THREE.MathUtils.clamp((edge - 0.66) * 1.75 + brokenVariation, 0, 0.58);
      vertexColor.copy(cleanStone).lerp(mossStone, moss);
      if (roadPositions.getY(i) < -0.03) vertexColor.lerp(shadedStone, 0.45);
      vertexColor.toArray(roadColors, i * 3);
    }
    roadGeometry.setAttribute('color', new THREE.BufferAttribute(roadColors, 3));
    const roadCount = 29;
    const pathBedGeometry = patchGeometries[0].clone();
    pathBedGeometry.rotateX(-Math.PI / 2);
    const pathBed = new THREE.InstancedMesh(
      pathBedGeometry,
      new THREE.MeshStandardMaterial({
        color: 0x6b5e50,
        roughness: 1,
        metalness: 0,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
      roadCount,
    );
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x606b67,
      roughnessMap: groundRoughness,
      bumpMap: groundRoughness,
      bumpScale: 0.055,
      roughness: 0.98,
      metalness: 0.025,
      vertexColors: true,
      emissive: 0x0b1110,
      emissiveIntensity: 0.06,
    });
    const road = new THREE.InstancedMesh(roadGeometry, roadMaterial, roadCount);
    let roadZ = 31;
    for (let i = 0; i < roadCount; i++) {
      const z = roadZ;
      roadZ -= 2.55 + rng() * 0.48;
      const bend = Math.sin(i * 0.42) * 1.0 + Math.sin(i * 0.13) * 0.55;
      const roadYaw = (rng() - 0.5) * 0.38 + Math.sin(i * 0.31) * 0.055 + (i % 3 - 1) * 0.045;
      const roadX = bend + (rng() - 0.5) * 0.75;
      position.set(roadX, -0.078 + rng() * 0.01, z);
      quaternion.setFromEuler(new THREE.Euler(0, roadYaw + (rng() - 0.5) * 0.08, 0));
      scale.set(2.0 + rng() * 0.5, 1, 1.72 + rng() * 0.32);
      matrix.compose(position, quaternion, scale);
      pathBed.setMatrixAt(i, matrix);
      pathBed.setColorAt(i, new THREE.Color(i % 4 === 0 ? 0x766858 : 0x62564a).multiplyScalar(0.88 + rng() * 0.18));

      position.set(roadX + (rng() - 0.5) * 0.14, -0.026 + rng() * 0.04, z + (rng() - 0.5) * 0.18);
      quaternion.setFromEuler(new THREE.Euler(0, roadYaw, 0));
      scale.set(0.56 + rng() * 0.68, 0.55 + rng() * 0.4, 0.4 + rng() * 0.38);
      matrix.compose(position, quaternion, scale);
      road.setMatrixAt(i, matrix);
      const stoneTones = [0x77827c, 0x68746f, 0x829087, 0x627068];
      const value = 0.82 + rng() * 0.18;
      road.setColorAt(i, new THREE.Color(stoneTones[i % stoneTones.length]).multiplyScalar(value));
    }
    pathBed.receiveShadow = true;
    pathBed.instanceMatrix.needsUpdate = true;
    if (pathBed.instanceColor) pathBed.instanceColor.needsUpdate = true;
    road.castShadow = true;
    road.receiveShadow = true;
    road.instanceMatrix.needsUpdate = true;
    if (road.instanceColor) road.instanceColor.needsUpdate = true;
    this.group.add(pathBed, road);

    // Two cheap authored edge bands keep the graveway legible without turning
    // it into a bright game-board lane. Broken stones lead the eye; leaves and
    // low ferns dissolve the border back into the fen.
    const vergeCount = 52;
    const vergeStones = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.26, 0),
      standard(0x3f4b48, 0.92),
      vergeCount,
    );
    const leafLitter = new THREE.InstancedMesh(
      makeLeafLitterGeometry(),
      new THREE.MeshStandardMaterial({ color: PALETTE.deadLeaf, roughness: 1, side: THREE.DoubleSide }),
      vergeCount,
    );
    const ferns = new THREE.InstancedMesh(
      makeFernClusterGeometry(),
      new THREE.MeshStandardMaterial({ color: PALETTE.fern, roughness: 0.96, side: THREE.DoubleSide }),
      84,
    );
    for (let i = 0; i < vergeCount; i++) {
      const z = 30 - i * 1.34 + (rng() - 0.5) * 0.55;
      const side = i % 2 ? 1 : -1;
      const pathIndex = Math.floor(i * 0.56);
      const bend = Math.sin(pathIndex * 0.42) * 1.0 + Math.sin(pathIndex * 0.13) * 0.55;
      position.set(bend + side * (2.05 + rng() * 0.62), 0.05, z);
      quaternion.setFromEuler(new THREE.Euler(rng() * 0.35, rng() * Math.PI, rng() * 0.28));
      const vergeScale = 0.48 + rng() * 0.9;
      scale.set(vergeScale, vergeScale * (0.35 + rng() * 0.55), vergeScale * (0.65 + rng() * 0.65));
      matrix.compose(position, quaternion, scale);
      vergeStones.setMatrixAt(i, matrix);
      vergeStones.setColorAt(i, new THREE.Color(i % 5 === 0 ? PALETTE.lichen : 0x3b4745).multiplyScalar(0.68 + rng() * 0.36));

      position.set(bend + side * (2.25 + rng() * 1.6), 0.018, z + (rng() - 0.5) * 0.8);
      quaternion.setFromEuler(new THREE.Euler(0, rng() * Math.PI * 2, 0));
      const leafScale = 0.72 + rng() * 1.45;
      scale.set(leafScale, 1, leafScale);
      matrix.compose(position, quaternion, scale);
      leafLitter.setMatrixAt(i, matrix);
      leafLitter.setColorAt(i, new THREE.Color(i % 4 === 0 ? 0x71604a : PALETTE.deadLeaf).multiplyScalar(0.62 + rng() * 0.42));
    }
    for (let i = 0; i < 84; i++) {
      const side = i % 2 ? 1 : -1;
      const z = 32 - rng() * 83;
      const distance = i < 46 ? 3.5 + rng() * 4.2 : 8 + rng() * 16;
      position.set(side * distance + Math.sin(z * 0.15) * 0.8, 0.02, z);
      quaternion.setFromEuler(new THREE.Euler(0, rng() * Math.PI * 2, (rng() - 0.5) * 0.08));
      const fernScale = 0.55 + rng() * 1.15;
      scale.set(fernScale, fernScale * (0.72 + rng() * 0.55), fernScale);
      matrix.compose(position, quaternion, scale);
      ferns.setMatrixAt(i, matrix);
      ferns.setColorAt(i, new THREE.Color(i % 6 === 0 ? 0x3b604d : PALETTE.fern).multiplyScalar(0.72 + rng() * 0.32));
    }
    vergeStones.instanceMatrix.needsUpdate = true;
    leafLitter.instanceMatrix.needsUpdate = true;
    ferns.instanceMatrix.needsUpdate = true;
    if (vergeStones.instanceColor) vergeStones.instanceColor.needsUpdate = true;
    if (leafLitter.instanceColor) leafLitter.instanceColor.needsUpdate = true;
    if (ferns.instanceColor) ferns.instanceColor.needsUpdate = true;
    vergeStones.receiveShadow = true;
    this.group.add(vergeStones, leafLitter, ferns);

    // Drowned pools with black silt lips, reflective water, pale lilies, and reed beds.
    const poolData: Array<[number, number, number, number]> = [
      [-14, 18, 8.4, 5.7], [14.5, 13, 7.5, 9.5], [-15.5, -4, 8.5, 10.8], [17, -17, 11.5, 6.6], [-14, -25, 7.2, 5.5],
    ];
    const wetlandMaterial = new THREE.MeshStandardMaterial({ color: 0x85867d, roughness: 1, metalness: 0 });
    new THREE.TextureLoader().load(groundAlbedoUrl, (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1.45, 1.45);
      texture.center.set(0.5, 0.5);
      texture.offset.set(0.17, 0.31);
      texture.rotation = 0.21;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      wetlandMaterial.map = texture;
      wetlandMaterial.needsUpdate = true;
    });
    const reedLocations: Array<{ x: number; z: number; scale: number; tilt: number }> = [];
    for (let poolIndex = 0; poolIndex < poolData.length; poolIndex++) {
      const [x, z, sx, sz] = poolData[poolIndex];
      // Two overlapping circles retain the organic pool silhouette while
      // keeping traversal out of deep water without expensive mesh collision.
      const poolRadius = Math.min(sx, sz) * 0.52;
      this.collisionCircles.push(
        { x: x - sx * 0.22, z, radius: poolRadius },
        { x: x + sx * 0.22, z, radius: poolRadius },
      );
      const poolRng = seeded(0x1122aa + poolIndex * 97);
      const poolShape = organicShape(poolRng, 1, 1, 44);
      const poolGeometry = new THREE.ShapeGeometry(poolShape);
      const bank = new THREE.Mesh(
        poolGeometry,
        wetlandMaterial,
      );
      bank.rotation.x = -Math.PI / 2;
      bank.scale.set(sx * 1.09, sz * 1.09, 1);
      bank.position.set(x, -0.045, z);
      bank.receiveShadow = true;
      this.group.add(bank);

      const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x173943,
        roughness: 0.17,
        metalness: 0.08,
        clearcoat: 0.88,
        clearcoatRoughness: 0.18,
        transparent: true,
        opacity: 0.86,
        emissive: 0x061719,
        emissiveIntensity: 0.3,
        envMapIntensity: 0.82,
      });
      const water = new THREE.Mesh(poolGeometry, waterMaterial);
      water.rotation.x = -Math.PI / 2;
      water.scale.set(sx, sz, 1);
      water.position.set(x, 0.005, z);
      water.receiveShadow = true;
      this.waterMaterials.push(waterMaterial);
      this.group.add(water);

      const shorelinePoints = poolShape.getPoints(72);
      const shoreline = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(shorelinePoints.map((point) => new THREE.Vector3(point.x, point.y, 0))),
        new THREE.LineBasicMaterial({ color: 0x35514e, transparent: true, opacity: 0.1, depthWrite: false }),
      );
      shoreline.rotation.x = -Math.PI / 2;
      shoreline.scale.set(sx, sz, 1);
      shoreline.position.set(x, 0.035, z);
      this.group.add(shoreline);

      if (poolIndex < 2) {
        const fenGlow = new THREE.PointLight(0x4b9f99, 1.25, 15, 2);
        fenGlow.position.set(x, 1.2, z);
        this.group.add(fenGlow);
      }

      for (let i = 0; i < 22; i++) {
        const angle = poolRng() * Math.PI * 2;
        const radial = 0.88 + poolRng() * 0.22;
        reedLocations.push({
          x: x + Math.cos(angle) * sx * radial,
          z: z + Math.sin(angle) * sz * radial,
          scale: 0.65 + poolRng() * 1.2,
          tilt: (poolRng() - 0.5) * 0.18,
        });
      }

      const lilyGeometry = new THREE.CircleGeometry(0.28, 7);
      const lilyMaterial = new THREE.MeshStandardMaterial({ color: 0x29463b, roughness: 0.9, side: THREE.DoubleSide });
      for (let i = 0; i < 7; i++) {
        const lily = new THREE.Mesh(lilyGeometry, lilyMaterial);
        lily.rotation.x = -Math.PI / 2;
        lily.position.set(x + (poolRng() - 0.5) * sx * 1.2, 0.045, z + (poolRng() - 0.5) * sz * 1.2);
        lily.scale.setScalar(0.55 + poolRng() * 0.9);
        this.group.add(lily);
      }
    }

    const reedGeometry = new THREE.CylinderGeometry(0.025, 0.05, 1.3, 5);
    reedGeometry.translate(0, 0.65, 0);
    const reeds = new THREE.InstancedMesh(reedGeometry, standard(0x344c3b, 0.98), reedLocations.length * 2);
    for (let i = 0; i < reedLocations.length * 2; i++) {
      const reed = reedLocations[i % reedLocations.length];
      position.set(reed.x + (rng() - 0.5) * 0.55, 0, reed.z + (rng() - 0.5) * 0.55);
      quaternion.setFromEuler(new THREE.Euler(reed.tilt, rng() * Math.PI, reed.tilt * 0.7));
      scale.set(1, reed.scale * (0.72 + rng() * 0.55), 1);
      matrix.compose(position, quaternion, scale);
      reeds.setMatrixAt(i, matrix);
    }
    reeds.castShadow = true;
    reeds.instanceMatrix.needsUpdate = true;
    this.group.add(reeds);

    const tuftCount = 96;
    const tufts = new THREE.InstancedMesh(
      makeFernClusterGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x314b3c, roughness: 1, side: THREE.DoubleSide }),
      tuftCount,
    );
    for (let i = 0; i < tuftCount; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      position.set(side * (5.7 + rng() * 26), 0.01, 34 - rng() * 91);
      quaternion.setFromEuler(new THREE.Euler((rng() - 0.5) * 0.12, rng() * Math.PI, (rng() - 0.5) * 0.18));
      const tuftScale = 0.45 + rng() * 1.05;
      scale.set(tuftScale, tuftScale * (0.65 + rng() * 0.8), tuftScale);
      matrix.compose(position, quaternion, scale);
      tufts.setMatrixAt(i, matrix);
      tufts.setColorAt(i, new THREE.Color(i % 7 === 0 ? 0x52654d : 0x314b3c).multiplyScalar(0.62 + rng() * 0.4));
    }
    tufts.instanceMatrix.needsUpdate = true;
    if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true;
    this.group.add(tufts);

    // Instanced forest: irregular trunks, branch bones, root flares and a single
    // contact-shadow batch build layered silhouettes without prop spam.
    const treeCount = 84;
    const trunks = new THREE.InstancedMesh(makeGnarledWoodGeometry(0x4311, 4.8, 0.62, 0.18, 9, 10), barkMaterial(PALETTE.bark, 3.2), treeCount);
    const branchCount = treeCount * 3;
    const branches = new THREE.InstancedMesh(makeGnarledWoodGeometry(0x9413, 2.25, 0.17, 0.035, 6, 7), barkMaterial(PALETTE.bark, 2.2), branchCount);
    const roots = new THREE.InstancedMesh(makeGnarledWoodGeometry(0x2117, 1.65, 0.19, 0.018, 5, 6), barkMaterial(PALETTE.barkEdge, 1.8), treeCount * 3);
    const leafCrowns = new THREE.InstancedMesh(
      makeLeafCrownGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x304538, roughness: 1, side: THREE.DoubleSide }),
      treeCount * 2,
    );
    const treeShadows = new THREE.InstancedMesh(
      new THREE.CircleGeometry(1, 18),
      new THREE.MeshBasicMaterial({ color: 0x071011, transparent: true, opacity: 0.2, depthWrite: false }),
      treeCount,
    );
    const up = new THREE.Vector3(0, 1, 0);
    const direction = new THREE.Vector3();
    const branchQuaternion = new THREE.Quaternion();
    for (let i = 0; i < treeCount; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      let treeX = side * (10 + rng() * 26);
      const treeZ = 36 - rng() * 95;
      // Preserve every tree while holding a continuous camera-safe corridor
      // from the graveway through the boss entry. Branch reach is accounted
      // for by moving affected instances into the outer side forest; trees
      // behind the arena remain in place as skyline framing.
      if (Math.abs(treeX) < 21.5 && treeZ > -50 && treeZ < 32) {
        treeX = side * (21.5 + rng() * 4);
      }
      const treeScale = 0.65 + rng() * 1.05;
      this.collisionCircles.push({ x: treeX, z: treeZ, radius: 0.38 + treeScale * 0.24 });
      position.set(treeX, -0.06, treeZ);
      quaternion.setFromEuler(new THREE.Euler((rng() - 0.5) * 0.08, rng() * Math.PI, (rng() - 0.5) * 0.1));
      scale.set(treeScale * (0.78 + rng() * 0.3), treeScale, treeScale * (0.78 + rng() * 0.3));
      matrix.compose(position, quaternion, scale);
      trunks.setMatrixAt(i, matrix);
      trunks.setColorAt(i, new THREE.Color(i % 6 === 0 ? PALETTE.barkEdge : PALETTE.bark).multiplyScalar(0.72 + rng() * 0.35));
      quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, rng() * Math.PI));
      position.set(treeX, -0.065, treeZ);
      scale.set(treeScale * 1.45, treeScale * (0.74 + rng() * 0.4), 1);
      matrix.compose(position, quaternion, scale);
      treeShadows.setMatrixAt(i, matrix);
      for (let b = 0; b < 3; b++) {
        const azimuth = rng() * Math.PI * 2;
        const reach = 0.7 + rng() * 0.65;
        direction.set(Math.cos(azimuth) * reach, 0.75 + rng() * 0.45, Math.sin(azimuth) * reach).normalize();
        branchQuaternion.setFromUnitVectors(up, direction);
        position.set(treeX + direction.x * 0.18 * treeScale, (2.35 + b * 0.58) * treeScale, treeZ + direction.z * 0.18 * treeScale);
        scale.set(treeScale, treeScale * (0.7 + rng() * 0.55), treeScale);
        matrix.compose(position, branchQuaternion, scale);
        branches.setMatrixAt(i * 3 + b, matrix);
        branches.setColorAt(i * 3 + b, new THREE.Color(i % 6 === 0 ? PALETTE.barkEdge : PALETTE.bark).multiplyScalar(0.7 + rng() * 0.32));

        const rootAngle = azimuth + 0.85;
        direction.set(Math.cos(rootAngle), 0.075, Math.sin(rootAngle)).normalize();
        branchQuaternion.setFromUnitVectors(up, direction);
        position.set(treeX + direction.x * 0.08 * treeScale, 0.06, treeZ + direction.z * 0.08 * treeScale);
        scale.set(treeScale * (0.65 + rng() * 0.35), treeScale, treeScale * (0.65 + rng() * 0.35));
        matrix.compose(position, branchQuaternion, scale);
        roots.setMatrixAt(i * 3 + b, matrix);
      }
      for (let crown = 0; crown < 2; crown++) {
        const crownAngle = rng() * Math.PI * 2;
        position.set(
          treeX + Math.cos(crownAngle) * treeScale * (0.36 + crown * 0.28),
          treeScale * (3.55 + crown * 0.72),
          treeZ + Math.sin(crownAngle) * treeScale * (0.36 + crown * 0.28),
        );
        quaternion.setFromEuler(new THREE.Euler((rng() - 0.5) * 0.35, rng() * Math.PI, (rng() - 0.5) * 0.28));
        scale.set(
          treeScale * (1.05 + rng() * 0.6),
          treeScale * (0.78 + rng() * 0.48),
          treeScale * (0.92 + rng() * 0.52),
        );
        matrix.compose(position, quaternion, scale);
        leafCrowns.setMatrixAt(i * 2 + crown, matrix);
        leafCrowns.setColorAt(
          i * 2 + crown,
          new THREE.Color(i % 7 === 0 ? 0x65705a : crown === 0 ? 0x304538 : 0x3c503f).multiplyScalar(0.66 + rng() * 0.34),
        );
      }
    }
    trunks.instanceMatrix.needsUpdate = true;
    branches.instanceMatrix.needsUpdate = true;
    roots.instanceMatrix.needsUpdate = true;
    leafCrowns.instanceMatrix.needsUpdate = true;
    treeShadows.instanceMatrix.needsUpdate = true;
    if (trunks.instanceColor) trunks.instanceColor.needsUpdate = true;
    if (branches.instanceColor) branches.instanceColor.needsUpdate = true;
    if (leafCrowns.instanceColor) leafCrowns.instanceColor.needsUpdate = true;
    this.group.add(treeShadows, trunks, branches, roots, leafCrowns);

    const fallenLogCount = 14;
    const fallenLogs = new THREE.InstancedMesh(
      makeGnarledWoodGeometry(0x7181, 3.4, 0.34, 0.12, 7, 9),
      barkMaterial(0x3a302b, 2.6),
      fallenLogCount,
    );
    for (let i = 0; i < fallenLogCount; i++) {
      const side = i % 2 ? 1 : -1;
      const logX = side * (8.2 + rng() * 15);
      const logZ = 28 - rng() * 72;
      const heading = rng() * Math.PI * 2;
      direction.set(Math.cos(heading), 0.08 + rng() * 0.08, Math.sin(heading)).normalize();
      branchQuaternion.setFromUnitVectors(up, direction);
      position.set(logX, 0.22, logZ);
      const logScale = 0.62 + rng() * 0.72;
      scale.set(logScale, logScale, logScale);
      matrix.compose(position, branchQuaternion, scale);
      fallenLogs.setMatrixAt(i, matrix);
      fallenLogs.setColorAt(i, new THREE.Color(i % 4 === 0 ? 0x4b4d3c : 0x3a302b).multiplyScalar(0.72 + rng() * 0.24));
      this.collisionCircles.push({ x: logX, z: logZ, radius: 0.42 + logScale * 0.38, id: `fallen-log-${i}` });
    }
    fallenLogs.instanceMatrix.needsUpdate = true;
    if (fallenLogs.instanceColor) fallenLogs.instanceColor.needsUpdate = true;
    this.group.add(fallenLogs);

    const rockCount = 88;
    const rocks = new THREE.InstancedMesh(makeIrregularRockGeometry(), standard(0x252f31, 0.94), rockCount);
    for (let i = 0; i < rockCount; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      position.set(side * (6 + rng() * 28), -0.02 + rng() * 0.12, 35 - rng() * 92);
      quaternion.setFromEuler(new THREE.Euler(rng() * 0.55, rng() * Math.PI, rng() * 0.35));
      scale.set(0.4 + rng() * 1.4, 0.28 + rng() * 0.9, 0.45 + rng() * 1.2);
      if (scale.y > 0.62) this.collisionCircles.push({ x: position.x, z: position.z, radius: Math.max(scale.x, scale.z) * 0.38 });
      matrix.compose(position, quaternion, scale);
      rocks.setMatrixAt(i, matrix);
      rocks.setColorAt(i, new THREE.Color(i % 9 === 0 ? PALETTE.lichen : 0x303a3b).multiplyScalar(0.62 + rng() * 0.42));
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    rocks.instanceMatrix.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    this.group.add(rocks);

    // Grave clusters frame combat spaces without forming an artificial picket fence.
    const graveCount = 58;
    const graveStones = new THREE.InstancedMesh(makeGothicGraveGeometry(), stoneMaterial(PALETTE.stone, 0.9, 1.25), graveCount);
    const graveReliefs = new THREE.InstancedMesh(
      makeGraveReliefGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x76877d, roughness: 0.84, metalness: 0.06, side: THREE.DoubleSide }),
      graveCount,
    );
    const graveReliefOffset = new THREE.Matrix4().makeTranslation(0, 0.76, 0.158);
    const graveReliefMatrix = new THREE.Matrix4();
    for (let i = 0; i < graveCount; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      const gx = side * (4.8 + rng() * 13.5);
      const gz = 29 - rng() * 59;
      const gs = 0.65 + rng() * 0.65;
      this.collisionCircles.push({ x: gx, z: gz, radius: 0.28 + gs * 0.18 });
      quaternion.setFromEuler(new THREE.Euler((rng() - 0.5) * 0.16, (rng() - 0.5) * 0.95, (rng() - 0.5) * 0.17));
      position.set(gx, 0.02, gz);
      scale.set(gs, gs, gs);
      matrix.compose(position, quaternion, scale);
      graveStones.setMatrixAt(i, matrix);
      graveStones.setColorAt(i, new THREE.Color(i % 7 === 0 ? PALETTE.lichen : PALETTE.stone).multiplyScalar(0.7 + rng() * 0.36));
      graveReliefMatrix.copy(matrix).multiply(graveReliefOffset);
      graveReliefs.setMatrixAt(i, graveReliefMatrix);
      graveReliefs.setColorAt(i, new THREE.Color(i % 7 === 0 ? 0x9bad91 : 0x6e7f78).multiplyScalar(0.7 + rng() * 0.26));
    }
    graveStones.castShadow = true;
    graveStones.receiveShadow = true;
    graveStones.instanceMatrix.needsUpdate = true;
    graveReliefs.instanceMatrix.needsUpdate = true;
    if (graveStones.instanceColor) graveStones.instanceColor.needsUpdate = true;
    if (graveReliefs.instanceColor) graveReliefs.instanceColor.needsUpdate = true;
    this.group.add(graveStones, graveReliefs);

    // The western bell chapel is the biome's first unmistakable landmark.
    const chapel = new THREE.Group();
    chapel.name = 'Drowned Bell Chapel';
    const ruinStone = stoneMaterial(0x485458, 0.87, 1.7);
    const oldStone = stoneMaterial(0x343e42, 0.94, 1.45);
    const dais = new THREE.Mesh(makeChippedPlatformGeometry(5.55, 5.15, 0.62, 0xc511), oldStone);
    dais.position.y = -0.12;
    chapel.add(dais);
    const chapelFloor = new THREE.InstancedMesh(new THREE.BoxGeometry(1.05, 0.12, 1.5), standard(0x3c4745, 0.91), 21);
    for (let i = 0; i < 21; i++) {
      const column = i % 3;
      const row = Math.floor(i / 3);
      position.set((column - 1) * 1.38 + (row % 2) * 0.16, 0.52 + rng() * 0.025, 3.1 - row * 1.15);
      quaternion.setFromEuler(new THREE.Euler(0, (rng() - 0.5) * 0.08, 0));
      scale.set(0.88 + rng() * 0.2, 1, 0.86 + rng() * 0.18);
      matrix.compose(position, quaternion, scale);
      chapelFloor.setMatrixAt(i, matrix);
      chapelFloor.setColorAt(i, new THREE.Color(i % 5 === 0 ? 0x53645e : 0x3c4745).multiplyScalar(0.74 + rng() * 0.25));
    }
    chapelFloor.instanceMatrix.needsUpdate = true;
    if (chapelFloor.instanceColor) chapelFloor.instanceColor.needsUpdate = true;
    chapel.add(chapelFloor);
    for (let i = 0; i < 6; i++) {
      const column = new THREE.Mesh(makeRuinPierGeometry(), ruinStone);
      const columnHeight = 3.3 + (i % 3) * 0.65;
      column.position.set((i % 2 ? 1 : -1) * 3.45, 0.48, -4 + Math.floor(i / 2) * 4);
      column.scale.y = columnHeight / 3.88;
      column.rotation.z = (i % 2 ? 1 : -1) * 0.035;
      chapel.add(column);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.3, 0.95), oldStone);
      cap.position.set(column.position.x, 0.48 + columnHeight, column.position.z);
      chapel.add(cap);
    }
    const apse = new THREE.Mesh(makeBrokenApseGeometry(), ruinStone);
    apse.position.set(0, 0.38, -4.15);
    chapel.add(apse);
    const windowShape = new THREE.Shape();
    windowShape.moveTo(-0.36, -0.92);
    windowShape.lineTo(0.36, -0.92);
    windowShape.lineTo(0.36, 0.32);
    windowShape.quadraticCurveTo(0.24, 0.76, 0, 1.13);
    windowShape.quadraticCurveTo(-0.24, 0.76, -0.36, 0.32);
    windowShape.closePath();
    const windowGeometry = new THREE.ShapeGeometry(windowShape);
    const chapelWindows = new THREE.Group();
    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0x6fb6ad,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    for (const x of [-2.25, 0, 2.25]) {
      const recess = new THREE.Mesh(windowGeometry, new THREE.MeshBasicMaterial({ color: 0x071215, side: THREE.DoubleSide }));
      recess.position.set(x, 2.2, -3.84);
      recess.scale.set(1.28, 1.18, 1);
      const glass = new THREE.Mesh(windowGeometry, glassMaterial);
      glass.position.set(x, 2.2, -3.82);
      glass.scale.set(0.91, 0.9, 1);
      chapelWindows.add(recess, glass);
    }
    chapel.add(chapelWindows);
    const jambGeometry = new THREE.BoxGeometry(0.12, 1.42, 0.14);
    const chapelJambs = new THREE.InstancedMesh(jambGeometry, standard(0x66716c, 0.82), 12);
    let jambIndex = 0;
    for (const x of [-2.25, 0, 2.25]) {
      for (const side of [-1, 1]) {
        position.set(x + side * 0.46, 1.88, -3.75);
        quaternion.identity();
        scale.set(1, 1, 1);
        matrix.compose(position, quaternion, scale);
        chapelJambs.setMatrixAt(jambIndex++, matrix);
        position.set(x + side * 0.26, 3.02, -3.75);
        quaternion.setFromEuler(new THREE.Euler(0, 0, side * -0.56));
        scale.set(1, 0.72, 1);
        matrix.compose(position, quaternion, scale);
        chapelJambs.setMatrixAt(jambIndex++, matrix);
      }
    }
    chapelJambs.instanceMatrix.needsUpdate = true;
    chapel.add(chapelJambs);

    const buttressGeometry = new THREE.BoxGeometry(0.72, 3.1, 1.05);
    const buttresses = new THREE.InstancedMesh(buttressGeometry, oldStone, 6);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      position.set(side * (3.38 + (i > 3 ? 0.22 : 0)), 1.55, -3.2 + Math.floor(i / 2) * 2.55);
      quaternion.setFromEuler(new THREE.Euler(0, 0, side * 0.065));
      scale.set(1, 0.76 + (i % 3) * 0.1, 1);
      matrix.compose(position, quaternion, scale);
      buttresses.setMatrixAt(i, matrix);
    }
    buttresses.instanceMatrix.needsUpdate = true;
    chapel.add(buttresses);

    const rubble = new THREE.InstancedMesh(makeIrregularRockGeometry(0x8177), standard(0x313b3b, 0.95), 24);
    for (let i = 0; i < 24; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 3.45 + rng() * 1.6;
      position.set(Math.cos(angle) * radius, 0.5 + rng() * 0.12, Math.sin(angle) * radius - 0.6);
      quaternion.setFromEuler(new THREE.Euler(rng(), rng() * Math.PI, rng()));
      const rubbleScale = 0.35 + rng() * 0.9;
      scale.set(rubbleScale, rubbleScale * (0.35 + rng() * 0.55), rubbleScale);
      matrix.compose(position, quaternion, scale);
      rubble.setMatrixAt(i, matrix);
      rubble.setColorAt(i, new THREE.Color(i % 5 === 0 ? PALETTE.lichen : 0x313b3b).multiplyScalar(0.68 + rng() * 0.34));
    }
    rubble.instanceMatrix.needsUpdate = true;
    if (rubble.instanceColor) rubble.instanceColor.needsUpdate = true;
    chapel.add(rubble);

    const chapelVines = new THREE.InstancedMesh(
      makeHangingVineGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x243f32, roughness: 1 }),
      12,
    );
    const chapelMoss = new THREE.InstancedMesh(
      makeLeafCrownGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x344b3a, roughness: 1, side: THREE.DoubleSide }),
      10,
    );
    for (let i = 0; i < 12; i++) {
      const side = i % 2 ? 1 : -1;
      position.set(side * (2.7 + rng() * 0.75), 3.4 + rng() * 0.9, -3.7 + Math.floor(i / 2) * 1.22);
      quaternion.setFromEuler(new THREE.Euler(0, rng() * Math.PI, side * (0.05 + rng() * 0.08)));
      scale.set(0.65 + rng() * 0.55, 0.62 + rng() * 0.74, 0.65 + rng() * 0.55);
      matrix.compose(position, quaternion, scale);
      chapelVines.setMatrixAt(i, matrix);
      if (i < 10) {
        position.y += 0.08;
        scale.set(0.38 + rng() * 0.42, 0.16 + rng() * 0.22, 0.32 + rng() * 0.35);
        quaternion.setFromEuler(new THREE.Euler(-0.28, rng() * Math.PI, 0));
        matrix.compose(position, quaternion, scale);
        chapelMoss.setMatrixAt(i, matrix);
      }
    }
    chapelVines.instanceMatrix.needsUpdate = true;
    chapelMoss.instanceMatrix.needsUpdate = true;
    chapel.add(chapelVines, chapelMoss);

    const chapelGlow = new THREE.PointLight(0x7bc4bd, 2.2, 12, 2);
    chapelGlow.position.set(0, 2.4, -3.25);
    chapel.add(chapelGlow);
    const shrine = makeBellShrine();
    shrine.position.set(0, 0.52, 0);
    shrine.scale.setScalar(0.78);
    chapel.add(shrine);
    chapel.position.copy(LANDMARKS.chapel);
    chapel.rotation.y = -0.12;
    this.group.add(enableShadows(chapel));
    this.collisionBoxes.push(
      { minX: -16.2, maxX: -7.8, minZ: -1.7, maxZ: 0.1, id: 'chapel-apse' },
      { minX: -15.9, maxX: -15.1, minZ: -0.8, maxZ: 6.8, id: 'chapel-west' },
      { minX: -8.9, maxX: -8.1, minZ: -0.8, maxZ: 6.8, id: 'chapel-east' },
    );

    // A ruined aqueduct creates a layered skyline on the eastern elite branch.
    const aqueduct = new THREE.Group();
    const aqueductGeometry = makeAqueductSpanGeometry();
    for (let i = 0; i < 4; i++) {
      const span = new THREE.Mesh(aqueductGeometry, i % 2 ? ruinStone : oldStone);
      span.position.set(i * 3.38, 0, 0);
      span.scale.y = 1 - i * 0.055;
      span.rotation.z = -0.012 * i;
      aqueduct.add(span);
    }
    const aqueductVines = new THREE.InstancedMesh(
      makeHangingVineGeometry(0x8863),
      new THREE.MeshStandardMaterial({ color: 0x284536, roughness: 1 }),
      9,
    );
    const aqueductMoss = new THREE.InstancedMesh(
      makeLeafCrownGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x384e3b, roughness: 1, side: THREE.DoubleSide }),
      8,
    );
    for (let i = 0; i < 9; i++) {
      position.set(i * 1.45 + (rng() - 0.5) * 0.42, 4.08 - Math.floor(i / 3) * 0.12, 0.62);
      quaternion.setFromEuler(new THREE.Euler(0, 0, (rng() - 0.5) * 0.15));
      scale.set(0.72 + rng() * 0.48, 0.38 + rng() * 0.76, 0.72 + rng() * 0.48);
      matrix.compose(position, quaternion, scale);
      aqueductVines.setMatrixAt(i, matrix);
      if (i < 8) {
        position.y += 0.12;
        scale.set(0.44 + rng() * 0.5, 0.17 + rng() * 0.2, 0.35 + rng() * 0.4);
        quaternion.setFromEuler(new THREE.Euler(-0.3, rng() * Math.PI, 0));
        matrix.compose(position, quaternion, scale);
        aqueductMoss.setMatrixAt(i, matrix);
      }
    }
    aqueductVines.instanceMatrix.needsUpdate = true;
    aqueductMoss.instanceMatrix.needsUpdate = true;
    aqueduct.add(aqueductVines, aqueductMoss);
    aqueduct.position.set(12, 0, -10);
    aqueduct.rotation.y = 0.24;
    this.group.add(enableShadows(aqueduct));
    for (let i = 0; i < 4; i++) this.collisionCircles.push({
      x: 12 + Math.cos(0.24) * i * 3.25,
      z: -10 - Math.sin(0.24) * i * 3.25,
      radius: 0.82,
      id: `aqueduct-${i}`,
    });

    // Processional steps pull the eye into the gate and then the ritual arena.
    const stepMaterial = standard(0x323d40, 0.86);
    for (let i = 0; i < 5; i++) {
      const stepHeight = 0.16 + i * 0.05;
      const step = new THREE.Mesh(makeChippedStepGeometry(8 - i * 0.75, 1.25, stepHeight, 0x3119 + i), stepMaterial);
      step.position.set((i % 2 ? 1 : -1) * 0.04, -0.04 + i * 0.055, -27.6 - i * 0.72);
      step.castShadow = true;
      step.receiveShadow = true;
      this.group.add(step);
    }
    const gate = makeGothicGate();
    gate.position.copy(LANDMARKS.bossGate);
    gate.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        material.transparent = true;
        material.userData.fullOpacity = material.opacity;
      }
    });
    this.bossGate = gate;
    this.group.add(gate);
    this.blockers.push(
      new THREE.Box3(new THREE.Vector3(-3.15, 0, -31.9), new THREE.Vector3(-1.55, 8, -30.05)),
      new THREE.Box3(new THREE.Vector3(1.55, 0, -31.9), new THREE.Vector3(3.15, 8, -30.05)),
    );
    this.collisionBoxes.push(
      { minX: -3.15, maxX: -1.55, minZ: -31.9, maxZ: -30.05, id: 'boss-gate-west' },
      { minX: 1.55, maxX: 3.15, minZ: -31.9, maxZ: -30.05, id: 'boss-gate-east' },
    );

    // The boss space is a ruined room, not a featureless gameplay disc. The
    // central ten metres stay visually calm for tells while the layered rim,
    // side arcades and rear apse carry material richness and architectural scale.
    const sanctum = new THREE.Group();
    sanctum.name = 'Sanctum of the Last Voice';
    sanctum.userData.bossVisible = true;
    const foundationMaterial = stoneMaterial(0x3b4649, 0.89, 1.45);
    const foundation = new THREE.Mesh(new THREE.CylinderGeometry(13.25, 14.3, 0.68, 64), foundationMaterial);
    foundation.position.set(0, 0.03, -43);
    foundation.receiveShadow = true;
    sanctum.add(foundation);

    const floorMaterial = applyTiledPbr(
      new THREE.MeshPhysicalMaterial({
        color: 0xd6dddc,
        roughness: 0.86,
        metalness: 0.025,
        clearcoat: 0.28,
        clearcoatRoughness: 0.38,
        emissive: 0x1a2529,
        emissiveIntensity: 0.34,
      }),
      bellSanctumFloorUrl,
      3.15,
      3.15,
      0.105,
    );
    const floor = new THREE.Mesh(new THREE.CircleGeometry(12.92, 96), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.385, -43);
    floor.receiveShadow = true;
    sanctum.add(floor);

    // One instanced chipped curb breaks the perfect-cylinder silhouette without
    // turning the perimeter into a forest of individual draw calls.
    const rimCount = 28;
    const rimStones = new THREE.InstancedMesh(
      makeChippedStepGeometry(2.86, 1.18, 0.3, 0x7128),
      stoneMaterial(0x596566, 0.9, 1.65),
      rimCount,
    );
    const arenaTransform = new THREE.Object3D();
    for (let i = 0; i < rimCount; i++) {
      const angle = i / rimCount * Math.PI * 2;
      const radius = 13.1 + Math.sin(i * 2.27) * 0.12;
      arenaTransform.position.set(Math.cos(angle) * radius, 0.25 + (i % 4) * 0.012, -43 + Math.sin(angle) * radius);
      arenaTransform.rotation.set((i % 3 - 1) * 0.018, -angle - Math.PI / 2 + (i % 2 ? 0.018 : -0.012), 0);
      arenaTransform.scale.set(0.94 + (i % 5) * 0.018, 0.82 + (i % 3) * 0.05, 0.9 + (i % 4) * 0.025);
      arenaTransform.updateMatrix();
      rimStones.setMatrixAt(i, arenaTransform.matrix);
      rimStones.setColorAt(i, new THREE.Color(i % 5 === 0 ? 0x6b7772 : i % 3 === 0 ? 0x505e5c : 0x5d6967));
    }
    rimStones.instanceMatrix.needsUpdate = true;
    if (rimStones.instanceColor) rimStones.instanceColor.needsUpdate = true;
    rimStones.receiveShadow = true;
    sanctum.add(rimStones);

    // Tarnished radial inlays give the room authored direction while staying
    // below the brightness of combat telegraphs.
    const inlayAngles = [0.1, 0.82, 1.57, 2.46, 3.28, 4.23, 5.18];
    const inlayCount = inlayAngles.length;
    const inlays = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.075, 0.018, 3.15),
      new THREE.MeshStandardMaterial({ color: 0x385a57, roughness: 0.82, metalness: 0.2, emissive: 0x102524, emissiveIntensity: 0.08 }),
      inlayCount,
    );
    for (let i = 0; i < inlayCount; i++) {
      const angle = inlayAngles[i];
      arenaTransform.position.set(Math.sin(angle) * 7.65, 0.405, -43 + Math.cos(angle) * 7.65);
      arenaTransform.rotation.set(0, angle, 0);
      arenaTransform.scale.set(0.75 + (i % 3) * 0.12, 1, 1);
      arenaTransform.updateMatrix();
      inlays.setMatrixAt(i, arenaTransform.matrix);
    }
    inlays.instanceMatrix.needsUpdate = true;
    sanctum.add(inlays);

    const sanctumDebris = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.24, 0),
      stoneMaterial(0x4a5655, 0.94, 1.9),
      34,
    );
    for (let i = 0; i < 34; i++) {
      const angle = i * 2.399 + 0.37;
      const radius = 9.85 + (i % 6) * 0.49;
      arenaTransform.position.set(Math.cos(angle) * radius, 0.46 + (i % 3) * 0.035, -43 + Math.sin(angle) * radius);
      arenaTransform.rotation.set(i * 0.31, angle, i * 0.17);
      const rubbleScale = 0.28 + (i % 5) * 0.105;
      arenaTransform.scale.set(rubbleScale * (1 + (i % 3) * 0.22), rubbleScale * 0.55, rubbleScale);
      arenaTransform.updateMatrix();
      sanctumDebris.setMatrixAt(i, arenaTransform.matrix);
      sanctumDebris.setColorAt(i, new THREE.Color(i % 4 === 0 ? 0x68736b : 0x485250));
    }
    sanctumDebris.instanceMatrix.needsUpdate = true;
    if (sanctumDebris.instanceColor) sanctumDebris.instanceColor.needsUpdate = true;
    sanctum.add(sanctumDebris);

    const wetPatchGeometry = patchGeometries[1].clone();
    wetPatchGeometry.rotateX(-Math.PI / 2);
    const wetPatches = new THREE.InstancedMesh(
      wetPatchGeometry,
      new THREE.MeshPhysicalMaterial({
        color: 0x17343b,
        roughness: 0.24,
        metalness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      9,
    );
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.18 + 0.65;
      const radius = 5.7 + (i % 4) * 1.45;
      arenaTransform.position.set(Math.cos(angle) * radius, 0.414, -43 + Math.sin(angle) * radius);
      arenaTransform.rotation.set(0, angle * 0.6, 0);
      arenaTransform.scale.set(0.72 + (i % 3) * 0.42, 1, 0.48 + (i % 4) * 0.2);
      arenaTransform.updateMatrix();
      wetPatches.setMatrixAt(i, arenaTransform.matrix);
    }
    wetPatches.instanceMatrix.needsUpdate = true;
    sanctum.add(wetPatches);

    const sanctumApse = makeBellSanctumApse();
    sanctumApse.position.set(0, 0.3, -53.45);
    sanctumApse.scale.set(0.84, 0.78, 0.84);
    sanctum.add(sanctumApse);

    const runnerMaterial = applyTiledPbr(
      new THREE.MeshStandardMaterial({
        color: 0xb9a7a1,
        roughness: 0.92,
        metalness: 0,
        side: THREE.DoubleSide,
        emissive: 0x261418,
        emissiveIntensity: 0.18,
      }),
      bellSanctumRunnerUrl,
      1,
      2.35,
      0.055,
    );
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(3.45, 8.4, 1, 6), runnerMaterial);
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.418, -48.25);
    runner.receiveShadow = true;
    sanctum.add(runner);

    // Continuous side bays turn the circular foundation into a genuine ruined
    // room. The entrance remains open toward +Z, and every wall sits outside
    // the boss leash so the readable central combat space is unchanged.
    const arcadeMaterial = sanctumWallMaterial(1.05);
    const sideWindowFrameMaterial = stoneMaterial(0x74817f, 0.82, 1.1);
    const sideWallCrown = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.98, 0.48, 5.15),
      stoneMaterial(0x667270, 0.84, 1.3),
      6,
    );
    const sideButtresses = new THREE.InstancedMesh(
      makeRuinPierGeometry(),
      stoneMaterial(0x5b6867, 0.88, 1.4),
      8,
    );
    let sideCrownIndex = 0;
    let buttressIndex = 0;
    for (const side of [-1, 1]) {
      for (let bay = 0; bay < 3; bay++) {
        const bayZ = -48.05 + bay * 5.25;
        const wallBay = new THREE.Mesh(new THREE.BoxGeometry(0.78, 4.72, 5.02), arcadeMaterial);
        wallBay.position.set(side * 12.55, 2.45, bayZ);
        sanctum.add(wallBay);

        const sideWindowFrame = new THREE.Mesh(
          makePointedWindowGeometry(1.26, 2.74),
          sideWindowFrameMaterial,
        );
        sideWindowFrame.position.set(side * 12.14, 1.17, bayZ);
        sideWindowFrame.rotation.y = -side * Math.PI / 2;
        sanctum.add(sideWindowFrame);

        const sidePane = new THREE.Mesh(
          makePointedWindowGeometry(0.88, 2.28),
          new THREE.MeshBasicMaterial({
            color: bay === 1 ? 0x9b5f76 : 0x68aaa9,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
          }),
        );
        sidePane.position.set(side * 12.08, 1.39, bayZ);
        sidePane.rotation.y = -side * Math.PI / 2;
        sanctum.add(sidePane);

        arenaTransform.position.set(side * 12.16, 4.88, bayZ);
        arenaTransform.rotation.set(0, 0, 0);
        arenaTransform.scale.set(1, 1, 1);
        arenaTransform.updateMatrix();
        sideWallCrown.setMatrixAt(sideCrownIndex++, arenaTransform.matrix);
      }
      for (let seam = 0; seam < 4; seam++) {
        arenaTransform.position.set(side * 12.08, 0.34, -50.7 + seam * 5.25);
        arenaTransform.rotation.set(0, 0, side * -0.018);
        arenaTransform.scale.set(0.54, 1.24 + (seam % 2) * 0.08, 0.72);
        arenaTransform.updateMatrix();
        sideButtresses.setMatrixAt(buttressIndex++, arenaTransform.matrix);
      }

      const sideBanner = new THREE.Mesh(
        makeTatteredBannerGeometry(1.3, 3.0, 0x4912 + side),
        new THREE.MeshStandardMaterial({ color: side < 0 ? 0x3c2437 : 0x213b43, roughness: 0.94, side: THREE.DoubleSide }),
      );
      sideBanner.position.set(side * 12.08, 4.32, -44.0);
      sideBanner.rotation.y = -side * Math.PI / 2;
      sanctum.add(sideBanner);

      this.collisionBoxes.push(side > 0
        ? { minX: 12.1, maxX: 13.0, minZ: -51.0, maxZ: -35.0, id: 'sanctum-east-wall' }
        : { minX: -13.0, maxX: -12.1, minZ: -51.0, maxZ: -35.0, id: 'sanctum-west-wall' });
    }
    sideWallCrown.instanceMatrix.needsUpdate = true;
    sideButtresses.instanceMatrix.needsUpdate = true;
    const sideWallIvy = new THREE.InstancedMesh(
      makeLeafCrownGeometry(0x93571),
      new THREE.MeshStandardMaterial({ color: 0x344c3d, roughness: 1, side: THREE.DoubleSide }),
      24,
    );
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1;
      arenaTransform.position.set(side * 12.0, 0.62 + (i % 4) * 0.38, -50.2 + Math.floor(i / 4) * 2.65);
      arenaTransform.rotation.set(-0.12, i * 1.43, side * 0.1);
      arenaTransform.scale.set(0.23 + (i % 3) * 0.1, 0.19 + (i % 4) * 0.07, 0.28 + (i % 2) * 0.08);
      arenaTransform.updateMatrix();
      sideWallIvy.setMatrixAt(i, arenaTransform.matrix);
    }
    sideWallIvy.instanceMatrix.needsUpdate = true;
    sanctum.add(sideWallCrown, sideButtresses, sideWallIvy);

    const coolSanctumFill = new THREE.PointLight(0x6fa9b0, 5.2, 31, 2);
    coolSanctumFill.position.set(0, 8.5, -48.5);
    sanctum.add(coolSanctumFill);
    const apseShaft = new THREE.SpotLight(0x9cced0, 34, 38, Math.PI * 0.27, 0.72, 1.35);
    apseShaft.position.set(-2.5, 11.5, -53.8);
    apseShaft.target.position.set(0, 0.35, -43.5);
    sanctum.add(apseShaft, apseShaft.target);
    const altarGlow = new THREE.PointLight(0xe08b63, 13.5, 18, 1.75);
    altarGlow.position.set(0, 4.2, -50.1);
    sanctum.add(altarGlow);
    for (const side of [-1, 1]) {
      const roomBrazier = makeBrazier();
      roomBrazier.position.set(side * 9.75, 0.4, -50.1);
      roomBrazier.scale.setScalar(0.92);
      roomBrazier.traverse((child) => {
        if (child.userData.flame) this.flames.push(child);
        if (child instanceof THREE.PointLight) child.intensity = 18;
      });
      sanctum.add(roomBrazier);
      const altarBrazier = makeBrazier();
      altarBrazier.position.set(side * 5.45, 0.42, -51.35);
      altarBrazier.scale.setScalar(0.72);
      altarBrazier.traverse((child) => {
        if (child.userData.flame) this.flames.push(child);
        if (child instanceof THREE.PointLight) child.intensity = 14;
      });
      sanctum.add(altarBrazier);
      const ember = new THREE.PointLight(0xd56c47, 12, 13, 2);
      ember.position.set(side * 9.8, 2.3, -48.8);
      sanctum.add(ember);
    }
    this.group.add(sanctum);
    for (const radius of [5.2, 9.4, 12.15]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, radius === 9.4 ? 0.08 : 0.055, 6, 96),
        new THREE.MeshBasicMaterial({ color: radius === 9.4 ? 0x456e69 : 0x314d4c, transparent: true, opacity: 0.52, toneMapped: false }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.4, -43);
      ring.userData.runeRing = true;
      ring.userData.bossVisible = true;
      this.runeRings.push(ring);
      this.group.add(ring);
    }
    const monolithMaterial = stoneMaterial(0x3b474b, 0.8, 1.35);
    const crystalMaterial = new THREE.MeshBasicMaterial({ color: PALETTE.witchlight, transparent: true, opacity: 0.7, toneMapped: false });
    const monolithCount = 8;
    const monoliths = new THREE.InstancedMesh(makeObeliskGeometry(), monolithMaterial, monolithCount);
    const crystals = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.21, 1), crystalMaterial, monolithCount);
    const transform = new THREE.Object3D();
    for (let i = 0; i < monolithCount; i++) {
      const angle = Math.PI + 0.12 + i / (monolithCount - 1) * (Math.PI - 0.24);
      const height = 2.55 + (i % 4) * 0.42;
      transform.position.set(Math.cos(angle) * 11.85, height * 0.5 + 0.39, -43 + Math.sin(angle) * 11.85);
      this.collisionCircles.push({ x: transform.position.x, z: transform.position.z, radius: 0.62, id: `arena-monolith-${i}` });
      transform.rotation.set((i % 2 ? 1 : -1) * 0.045, -angle + 0.12, (i % 3 - 1) * 0.035);
      transform.scale.set(1, height, 1);
      transform.updateMatrix();
      monoliths.setMatrixAt(i, transform.matrix);
      transform.position.y += height * 0.55 + 0.22;
      transform.rotation.set(0, angle * 0.37, 0);
      transform.scale.setScalar(1);
      transform.updateMatrix();
      crystals.setMatrixAt(i, transform.matrix);
    }
    monoliths.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    crystals.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    monoliths.userData.bossVisible = crystals.userData.bossVisible = true;
    this.arenaOrnaments.push(monoliths, crystals);
    this.group.add(monoliths, crystals);

    // Warm guide fires and spectral wisps establish a disciplined color hierarchy.
    for (const [x, z, rotation] of [[-4, 20, 0], [4.8, 1, 0.3], [-7, -21, -0.2], [7, -34, 0.2]] as Array<[number, number, number]>) {
      const brazier = makeBrazier();
      brazier.position.set(x, 0, z);
      brazier.rotation.y = rotation;
      brazier.traverse((child) => { if (child.userData.flame) this.flames.push(child); });
      this.group.add(brazier);
      this.collisionCircles.push({ x, z, radius: 0.54, id: `brazier-${x}-${z}` });
    }

    const wispTexture = radialTexture('rgba(103,232,211,1)');
    for (let i = 0; i < 17; i++) {
      const wisp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: wispTexture,
        color: i % 3 === 0 ? 0x87a8ff : PALETTE.witchlight,
        transparent: true,
        opacity: 0.32 + rng() * 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }));
      const side = rng() > 0.5 ? 1 : -1;
      wisp.position.set(side * (5 + rng() * 17), 0.7 + rng() * 2.2, 28 - rng() * 70);
      const wispSize = 0.7 + rng() * 1.25;
      wisp.scale.set(wispSize, wispSize, 1);
      wisp.userData.baseY = wisp.position.y;
      wisp.userData.phase = rng() * Math.PI * 2;
      this.mist.push(wisp);
      this.group.add(wisp);
    }

    // Low fog banks soften the forest edge and add camera parallax.
    const fogTexture = radialTexture('rgba(118,151,159,1)');
    for (let i = 0; i < 13; i++) {
      const fog = new THREE.Sprite(new THREE.SpriteMaterial({
        map: fogTexture,
        color: i % 3 === 0 ? 0x4b6871 : 0x344c52,
        transparent: true,
        opacity: 0.085,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }));
      fog.position.set((rng() - 0.5) * 51, 1.0 + rng() * 1.2, 29 - rng() * 78);
      fog.scale.set(9 + rng() * 11, 3.2 + rng() * 3.2, 1);
      fog.userData.baseX = fog.position.x;
      fog.userData.phase = rng() * Math.PI * 2;
      this.mist.push(fog);
      this.group.add(fog);
    }

    const motePositions = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i++) {
      motePositions[i * 3] = (rng() - 0.5) * 65;
      motePositions[i * 3 + 1] = 0.35 + rng() * 5;
      motePositions[i * 3 + 2] = 35 - rng() * 94;
    }
    const moteGeometry = new THREE.BufferGeometry();
    moteGeometry.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    this.motes = new THREE.Points(moteGeometry, new THREE.PointsMaterial({
      color: PALETTE.witchlight,
      size: 0.075,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.64,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this.group.add(this.motes);

    // True rain streaks remain readable in motion where point rain did not.
    const rainPositions = new Float32Array(360 * 2 * 3);
    for (let i = 0; i < 360; i++) {
      const x = (rng() - 0.5) * 67;
      const y = rng() * 17;
      const z = 36 - rng() * 96;
      rainPositions[i * 6] = x;
      rainPositions[i * 6 + 1] = y;
      rainPositions[i * 6 + 2] = z;
      rainPositions[i * 6 + 3] = x - 0.06;
      rainPositions[i * 6 + 4] = y - 0.55;
      rainPositions[i * 6 + 5] = z + 0.04;
    }
    const rainGeometry = new THREE.BufferGeometry();
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    this.rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: 0x9fc3d1, transparent: true, opacity: 0.22, depthWrite: false }));
    this.group.add(this.rain);

    // A large moon disc is a background landmark when the camera clears the tree line.
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({
      map: radialTexture('rgba(202,224,255,1)'),
      color: PALETTE.moon,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: true,
    }));
    moon.position.set(-24, 18, -63);
    moon.scale.set(12, 12, 1);
    this.group.add(moon);

    // The biome already carries its depth in authored value/material contrast.
    // Keeping hundreds of static decorative pieces in the moving moon shadow
    // pass doubled scene submission cost for negligible on-screen benefit.
    // Actors, enemies and the boss remain dynamic shadow casters onto this
    // receiving world, preserving combat grounding where it matters.
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) child.castShadow = false;
    });
  }

  addTo(scene: THREE.Scene) {
    scene.add(this.group);
  }

  setBossArenaActive(active: boolean) {
    this.bossArenaActive = active;
  }

  setQuality(quality: 'low' | 'medium' | 'high' | 'ultra') {
    if (quality === this.quality) return;
    this.quality = quality;
    const stride = quality === 'low' ? 3 : quality === 'medium' ? 2 : 1;
    for (let i = 0; i < this.mist.length; i++) this.mist[i].visible = i % stride === 0;
    for (let i = 0; i < this.arenaOrnaments.length; i++) {
      // Preserve complete monolith/crystal pairs while halving peripheral draw
      // fragmentation on the responsiveness-first tier.
      const pair = Math.floor(i / 2);
      this.arenaOrnaments[i].visible = quality !== 'low' || pair % 2 === 0;
    }
  }

  update(delta: number) {
    this.time += delta;
    // The processional gate is an important approach landmark, but from the
    // combat camera it sits between the lens and the player. Dissolve it after
    // the encounter begins so silhouettes and floor tells remain unobstructed.
    this.bossGateOpacity = THREE.MathUtils.damp(this.bossGateOpacity, this.bossArenaActive ? 0 : 1, 7.5, delta);
    if (this.bossGate) this.bossGate.visible = !this.bossArenaActive || this.bossGateOpacity > 0.015;
    this.bossGate?.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        const fullOpacity = (material.userData.fullOpacity as number | undefined) ?? 1;
        material.opacity = fullOpacity * this.bossGateOpacity;
        material.depthWrite = this.bossGateOpacity > 0.92;
      }
    });
    this.updateBossCulling();
    this.motes.rotation.y += delta * 0.01;
    const rainPositions = this.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < rainPositions.count; i += 2) {
      let headY = rainPositions.getY(i) - delta * 15;
      if (headY < 0) headY += 17;
      rainPositions.setY(i, headY);
      rainPositions.setY(i + 1, headY - 0.55);
    }
    rainPositions.needsUpdate = true;

    for (let i = 0; i < this.waterMaterials.length; i++) {
      const material = this.waterMaterials[i];
      material.opacity = 0.845 + Math.sin(this.time * 0.7 + i * 1.3) * 0.035;
      material.emissiveIntensity = 0.3 + Math.sin(this.time * 0.42 + i) * 0.045;
    }
    for (const [i, flame] of this.flames.entries()) {
      const pulse = 1 + Math.sin(this.time * (7.2 + (i % 4)) + i) * 0.13;
      flame.scale.set(pulse * 0.72, (1 + Math.sin(this.time * 11 + i) * 0.18) * 1.2, pulse * 0.72);
      flame.rotation.y += delta * 1.3;
    }
    for (let i = 0; i < this.mist.length; i++) {
      const sprite = this.mist[i];
      if (!sprite.visible) continue;
      const phase = sprite.userData.phase as number;
      if (sprite.userData.baseY !== undefined) {
        sprite.position.y = (sprite.userData.baseY as number) + Math.sin(this.time * 1.15 + phase) * 0.22;
        sprite.position.x += Math.sin(this.time * 0.5 + phase) * delta * 0.08;
      } else {
        sprite.position.x = (sprite.userData.baseX as number) + Math.sin(this.time * 0.09 + phase) * 2.4;
      }
    }
    for (let i = 0; i < this.runeRings.length; i++) {
      const ring = this.runeRings[i];
      const material = ring.material as THREE.MeshBasicMaterial;
      material.opacity = 0.38 + Math.sin(this.time * 1.15 + i * 1.7) * 0.15;
      ring.rotation.z += delta * (i % 2 ? -0.025 : 0.018);
    }
  }

  clampToWorld(position: THREE.Vector3) {
    position.x = THREE.MathUtils.clamp(position.x, -27, 27);
    position.z = THREE.MathUtils.clamp(position.z, -54, 34);
    position.y = 0;
    return position;
  }

  private updateBossCulling() {
    const cull = this.bossArenaActive && this.quality === 'low';
    if (cull) {
      for (const child of this.group.children) {
        if (child instanceof THREE.Light || child.userData.bossVisible || child === this.bossGate || !child.visible) continue;
        child.visible = false;
        this.bossCulled.add(child);
      }
      return;
    }
    for (const child of this.bossCulled) child.visible = true;
    this.bossCulled.clear();
  }
}
