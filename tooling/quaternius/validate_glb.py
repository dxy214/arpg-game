#!/usr/bin/env python3
"""Dependency-free structural validation for quaternius-knight.glb."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
from pathlib import Path


EXPECTED_CLIPS = {"idle", "move", "attack", "hurt", "death", "transform"}


def fail(message: str) -> None:
    raise SystemExit(f"GLB validation failed: {message}")


def load_glb(path: Path) -> tuple[dict, bytes]:
    payload = path.read_bytes()
    if len(payload) < 20:
        fail("file is too short")
    magic, version, declared_length = struct.unpack_from("<4sII", payload, 0)
    if magic != b"glTF":
        fail("bad GLB magic")
    if version != 2:
        fail(f"expected GLB 2, got {version}")
    if declared_length != len(payload):
        fail(f"header length {declared_length} != actual {len(payload)}")

    cursor = 12
    json_doc = None
    binary_chunk = b""
    while cursor < len(payload):
        if cursor + 8 > len(payload):
            fail("truncated chunk header")
        chunk_length, chunk_type = struct.unpack_from("<II", payload, cursor)
        cursor += 8
        chunk = payload[cursor : cursor + chunk_length]
        if len(chunk) != chunk_length:
            fail("truncated chunk")
        cursor += chunk_length
        if chunk_type == 0x4E4F534A:
            json_doc = json.loads(chunk.decode("utf-8"))
        elif chunk_type == 0x004E4942:
            if binary_chunk:
                fail("multiple BIN chunks are unsupported")
            binary_chunk = chunk
    if json_doc is None:
        fail("missing JSON chunk")
    return json_doc, binary_chunk


def accessor(doc: dict, index: int) -> dict:
    try:
        return doc["accessors"][index]
    except (KeyError, IndexError, TypeError):
        fail(f"invalid accessor index {index}")


def accessor_values(doc: dict, binary: bytes, index: int) -> list[tuple[float, ...]]:
    item = accessor(doc, index)
    if item.get("sparse"):
        fail(f"sparse accessor {index} is unsupported by numeric validation")
    formats = {
        5120: ("b", 1),
        5121: ("B", 1),
        5122: ("h", 2),
        5123: ("H", 2),
        5125: ("I", 4),
        5126: ("f", 4),
    }
    component_counts = {
        "SCALAR": 1,
        "VEC2": 2,
        "VEC3": 3,
        "VEC4": 4,
        "MAT4": 16,
    }
    try:
        code, component_size = formats[item["componentType"]]
        component_count = component_counts[item["type"]]
        view = doc["bufferViews"][item["bufferView"]]
    except (KeyError, IndexError, TypeError):
        fail(f"accessor {index} has unsupported layout")
    packed_size = component_size * component_count
    stride = int(view.get("byteStride", packed_size))
    start = int(view.get("byteOffset", 0)) + int(item.get("byteOffset", 0))
    values = []
    for row in range(int(item["count"])):
        offset = start + row * stride
        if offset + packed_size > len(binary):
            fail(f"accessor {index} exceeds BIN chunk")
        values.append(struct.unpack_from("<" + code * component_count, binary, offset))
    return values


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "glb",
        nargs="?",
        type=Path,
        default=Path("src/assets/models/quaternius-knight.glb"),
    )
    args = parser.parse_args()
    path = args.glb.resolve()
    if not path.is_file():
        fail(f"missing file: {path}")

    doc, binary = load_glb(path)
    if str(doc.get("asset", {}).get("version")) != "2.0":
        fail("asset.version is not 2.0")

    animations = doc.get("animations", [])
    clip_names = {animation.get("name") for animation in animations}
    if clip_names != EXPECTED_CLIPS:
        fail(f"clips {sorted(clip_names)} != expected {sorted(EXPECTED_CLIPS)}")
    durations: dict[str, float] = {}
    for animation in animations:
        if not animation.get("channels") or not animation.get("samplers"):
            fail(f"animation {animation.get('name')!r} is empty")
        times = []
        for sampler in animation["samplers"]:
            item = accessor(doc, sampler["input"])
            if "min" in item and "max" in item:
                times.extend([float(item["min"][0]), float(item["max"][0])])
        if not times or max(times) <= min(times):
            fail(f"animation {animation['name']!r} has no positive duration")
        durations[animation["name"]] = max(times) - min(times)

    skins = doc.get("skins", [])
    if len(skins) != 1:
        fail(f"expected one skin, got {len(skins)}")
    joint_count = len(skins[0].get("joints", []))
    if joint_count < 30:
        fail(f"expected at least 30 skin joints, got {joint_count}")

    meshes = doc.get("meshes", [])
    if len(meshes) != 1:
        fail(f"expected one mesh, got {len(meshes)}")
    primitive_vertices = 0
    triangles = 0
    position_bounds = []
    for primitive in meshes[0].get("primitives", []):
        attributes = primitive.get("attributes", {})
        required = {"POSITION", "NORMAL", "JOINTS_0", "WEIGHTS_0"}
        missing = required - set(attributes)
        if missing:
            fail(f"primitive missing attributes: {sorted(missing)}")
        position = accessor(doc, attributes["POSITION"])
        primitive_vertices += int(position["count"])
        if "min" in position and "max" in position:
            position_bounds.append((position["min"], position["max"]))
        if "indices" in primitive:
            triangles += int(accessor(doc, primitive["indices"])["count"]) // 3
        for semantic in required:
            values = accessor_values(doc, binary, attributes[semantic])
            if any(not math.isfinite(float(value)) for row in values for value in row):
                fail(f"{semantic} contains a non-finite value")
        for weights in accessor_values(doc, binary, attributes["WEIGHTS_0"]):
            if not 0.999 <= sum(float(value) for value in weights) <= 1.001:
                fail("WEIGHTS_0 contains a row that is not normalized")
    if not position_bounds:
        fail("POSITION accessors have no bounds")

    local_bounds_min = [min(bounds[0][axis] for bounds in position_bounds) for axis in range(3)]
    local_bounds_max = [max(bounds[1][axis] for bounds in position_bounds) for axis in range(3)]

    nodes = doc.get("nodes", [])
    root_matches = [node for node in nodes if node.get("name") == "NightboundKnight"]
    if len(root_matches) != 1:
        fail(f"expected one NightboundKnight root, got {len(root_matches)}")
    root_index = next(index for index, node in enumerate(nodes) if node.get("name") == "NightboundKnight")
    root_scale = root_matches[0].get("scale", [1.0, 1.0, 1.0])
    if any(abs(float(value) - 1.0) > 1e-6 for value in root_scale):
        fail(f"NightboundKnight static scale is not unit: {root_scale}")
    for animation in animations:
        root_scale_channels = [
            channel
            for channel in animation.get("channels", [])
            if channel.get("target", {}).get("node") == root_index
            and channel.get("target", {}).get("path") == "scale"
        ]
        if root_scale_channels:
            fail(f"animation {animation['name']!r} targets NightboundKnight.scale")
    mesh_nodes = [(index, node) for index, node in enumerate(nodes) if node.get("mesh") == 0]
    if len(mesh_nodes) != 1:
        fail(f"expected one node instancing mesh 0, got {len(mesh_nodes)}")
    parent_of = {
        child: parent_index
        for parent_index, node in enumerate(nodes)
        for child in node.get("children", [])
    }

    # The FBX importer expresses importer-level unit conversion on the armature
    # root. Evaluate the bind POSITION bounds through the mesh-node ancestor TRS.
    # This asset has no ancestor rotation; rejecting one keeps this check honest.
    y_min, y_max = local_bounds_min[1], local_bounds_max[1]
    node_index = mesh_nodes[0][0]
    visited = set()
    while node_index is not None:
        if node_index in visited:
            fail("node hierarchy contains a cycle")
        visited.add(node_index)
        node = nodes[node_index]
        if "matrix" in node or "rotation" in node:
            fail("mesh ancestor rotation/matrix is unsupported by bind-height check")
        scale_y = float(node.get("scale", [1.0, 1.0, 1.0])[1])
        translation_y = float(node.get("translation", [0.0, 0.0, 0.0])[1])
        transformed = [y_min * scale_y + translation_y, y_max * scale_y + translation_y]
        y_min, y_max = min(transformed), max(transformed)
        node_index = parent_of.get(node_index)

    bounds_min = list(local_bounds_min)
    bounds_max = list(local_bounds_max)
    bounds_min[1], bounds_max[1] = y_min, y_max
    # Blender Z becomes glTF Y. The evaluated bind mesh should be grounded and 1.8 m tall.
    height = y_max - y_min
    if not 1.79 <= height <= 1.81:
        fail(f"expected ~1.8 m bind height, got {height:.6f}")
    if abs(bounds_min[1]) > 0.01:
        fail(f"expected ground near Y=0, got {bounds_min[1]:.6f}")

    materials = doc.get("materials", [])
    material_count = len(materials)
    if material_count != 3:
        fail(f"expected 3 materials, got {material_count}")
    for material in materials:
        alpha_mode = material.get("alphaMode", "OPAQUE")
        if alpha_mode != "OPAQUE":
            fail(f"material {material.get('name')!r} alphaMode is {alpha_mode}, not OPAQUE")
        base_color = material.get("pbrMetallicRoughness", {}).get(
            "baseColorFactor", [1.0, 1.0, 1.0, 1.0]
        )
        if len(base_color) != 4 or not math.isfinite(float(base_color[3])):
            fail(f"material {material.get('name')!r} has invalid base color alpha")
        if abs(float(base_color[3]) - 1.0) > 1e-6:
            fail(f"material {material.get('name')!r} base color alpha is {base_color[3]}, not 1")
    if doc.get("images"):
        fail("expected no texture images")

    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    summary = {
        "path": str(path),
        "sha256": digest,
        "bytes": path.stat().st_size,
        "binary_chunk_bytes": len(binary),
        "meshes": len(meshes),
        "primitives": len(meshes[0].get("primitives", [])),
        "primitive_vertex_total": primitive_vertices,
        "triangles": triangles,
        "skins": len(skins),
        "joints": joint_count,
        "materials": material_count,
        "images": len(doc.get("images", [])),
        "bind_bounds_gltf_xyz": {"min": bounds_min, "max": bounds_max},
        "bind_height_meters": height,
        "clips_seconds": dict(sorted(durations.items())),
    }
    print(json.dumps(summary, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
