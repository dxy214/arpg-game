#!/usr/bin/env python3
"""Convert Quaternius' Animated Knight FBX into a small WebGL-ready GLB.

Run with Blender, not the system Python:

    blender --background --factory-startup \
      --python tooling/quaternius/convert_knight.py -- \
      --input incoming/quaternius/KnightCharacter.fbx \
      --output src/assets/models/quaternius-knight.glb

The conversion is deterministic for a fixed Blender version and source FBX.  It
does not download anything and deliberately keeps only the one character mesh.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import bpy


TARGET_HEIGHT_METERS = 1.8
ACTION_MAP = {
    "idle": "Idle",
    "move": "Run",
    "attack": "swordAttackJump",
    # The source has no hurt/transform clips. These non-terminal source motions
    # are explicit compatibility placeholders; see ASSET_PROVENANCE.md.
    "hurt": "Roll",
    "death": "Death",
    "transform": "Jump",
}

MATERIALS = {
    # Subdued Nightbound palette; no texture images are introduced.
    "Armor": ((0.035, 0.045, 0.065, 1.0), 0.28, 0.62),
    "Boots": ((0.050, 0.012, 0.014, 1.0), 0.02, 0.86),
    "Skin": ((0.46, 0.255, 0.145, 1.0), 0.00, 0.80),
}


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--target-height", type=float, default=TARGET_HEIGHT_METERS)
    return parser.parse_args(argv)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def reset() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_fbx(path: Path, global_scale: float) -> None:
    result = bpy.ops.import_scene.fbx(
        filepath=str(path),
        global_scale=global_scale,
        use_anim=True,
        automatic_bone_orientation=False,
        use_custom_normals=True,
    )
    if "FINISHED" not in result:
        raise RuntimeError(f"FBX import failed: {result}")


def character_parts() -> tuple[bpy.types.Object, list[bpy.types.Object]]:
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError(f"Expected one armature, found {len(armatures)}")
    armature = armatures[0]
    meshes = [
        obj
        for obj in bpy.context.scene.objects
        if obj.type == "MESH"
        and (
            obj.parent == armature
            or any(mod.type == "ARMATURE" and mod.object == armature for mod in obj.modifiers)
        )
    ]
    if not meshes:
        raise RuntimeError("No skinned mesh belongs to the imported armature")
    return armature, meshes


def bind_bounds(meshes: list[bpy.types.Object]) -> tuple[list[float], list[float]]:
    points = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
    minimum = [min(point[axis] for point in points) for axis in range(3)]
    maximum = [max(point[axis] for point in points) for axis in range(3)]
    return minimum, maximum


def keep_character_only(armature: bpy.types.Object, meshes: list[bpy.types.Object]) -> None:
    keep = {armature, *meshes}
    for obj in list(bpy.context.scene.objects):
        if obj not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)


def configure_materials() -> None:
    for name, (color, metallic, roughness) in MATERIALS.items():
        material = bpy.data.materials.get(name)
        if material is None:
            continue
        material.diffuse_color = color
        material.use_nodes = True
        principled = next(
            (node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED"),
            None,
        )
        if principled is None:
            raise RuntimeError(f"Material {name!r} has no Principled BSDF node")
        principled.inputs["Base Color"].default_value = color
        # The source FBX imports these three materials with Principled Alpha=0,
        # a 0.5 alpha threshold and a transparency render mode. Setting only the
        # RGB(A) Base Color is insufficient: Blender's glTF exporter then emits
        # alphaMode=MASK with baseColorFactor alpha=0, so every fragment fails
        # the cutoff in Three.js. Make all three independent opacity controls
        # explicit before export.
        principled.inputs["Alpha"].default_value = 1.0
        material.alpha_threshold = 0.0
        material.surface_render_method = "DITHERED"
        material.use_transparency_overlap = False
        principled.inputs["Metallic"].default_value = metallic
        principled.inputs["Roughness"].default_value = roughness


def configure_actions(
    armature: bpy.types.Object,
) -> tuple[dict[str, dict[str, object]], int]:
    by_tail = {action.name.rsplit("|", 1)[-1]: action for action in bpy.data.actions}
    missing = [source for source in ACTION_MAP.values() if source not in by_tail]
    if missing:
        raise RuntimeError(f"Missing expected source actions: {missing}")

    selected = {by_tail[source] for source in ACTION_MAP.values()}
    if armature.animation_data:
        armature.animation_data.action = None

    for action in selected:
        action.name = "__nightbound__" + action.name.rsplit("|", 1)[-1]
        action.use_fake_user = True
    for action in list(bpy.data.actions):
        if action not in selected:
            bpy.data.actions.remove(action)

    result: dict[str, dict[str, object]] = {}
    removed_root_scale_curves = 0
    for target, source in ACTION_MAP.items():
        action = by_tail[source]
        action.name = target
        # FBX importer-level scale is also authored as three constant object
        # scale curves in every action. We have already applied that scale to
        # the skeleton and mesh. Keeping these curves would make AnimationMixer
        # force NightboundKnight back to ~0.3215 on the first update, shrinking
        # a 1.8 m character to ~0.579 m. Bone scale curves are intentionally kept.
        for fcurve in list(action.fcurves):
            if fcurve.data_path == "scale":
                action.fcurves.remove(fcurve)
                removed_root_scale_curves += 1
        result[target] = {
            "source": source,
            "frames": [float(action.frame_range[0]), float(action.frame_range[1])],
        }

    armature.animation_data_create()
    armature.animation_data.action = bpy.data.actions["idle"]
    return result, removed_root_scale_curves


def main() -> None:
    args = parse_args()
    source = args.input.resolve()
    output = args.output.resolve()
    if not source.is_file():
        raise FileNotFoundError(source)
    if args.target_height <= 0:
        raise ValueError("--target-height must be positive")

    # First import measures the actual bind mesh rather than trusting FBX units.
    reset()
    import_fbx(source, 1.0)
    _, measurement_meshes = character_parts()
    source_min, source_max = bind_bounds(measurement_meshes)
    source_height = source_max[2] - source_min[2]
    if source_height <= 0:
        raise RuntimeError("Imported mesh has zero height")
    scale = args.target_height / source_height

    # Re-import with importer-level scaling so geometry, bones and animated
    # translation channels all use the same scale.
    reset()
    import_fbx(source, scale)
    armature, meshes = character_parts()
    keep_character_only(armature, meshes)

    # Blender's FBX importer stores global_scale on the armature object. The
    # glTF exporter also bakes that parent scale into skinned POSITION data while
    # retaining the root-node scale, which would make the WebGL result scale
    # twice. Apply armature scale first (it propagates to child mesh objects),
    # then apply the resulting mesh scales. This leaves unit node scales while
    # preserving evaluated mesh bounds and animation.
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.select_all(action="DESELECT")
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    armature.name = "NightboundKnight"
    if len(meshes) == 1:
        meshes[0].name = "Knight"
        meshes[0].data.name = "KnightMesh"

    scaled_min, _ = bind_bounds(meshes)
    armature.location.z -= scaled_min[2]
    bpy.context.view_layer.update()

    configure_materials()
    actions, removed_root_scale_curves = configure_actions(armature)

    bpy.context.scene.render.fps = 30
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.frame_start = 0
    bpy.context.scene.frame_set(0)

    # ACTIONS mode exports the compatible datablock actions. Leaving one action
    # assigned here makes Blender 4.5 treat it as the current scene animation
    # instead of an additional action, so clear the assignment before export.
    armature.animation_data.action = None

    final_min, final_max = bind_bounds(meshes)
    armature["assetSource"] = "Quaternius Animated Knight Pack"
    armature["license"] = "CC0-1.0"
    armature["targetHeightMeters"] = float(args.target_height)
    armature["forwardAxis"] = "-Z (glTF; +Y before Blender glTF axis conversion)"
    armature["containsAccessories"] = False
    armature["placeholderActions"] = "hurt<-Roll; transform<-Jump"

    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    armature.select_set(True)
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = armature

    output.parent.mkdir(parents=True, exist_ok=True)
    result = bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
        export_materials="EXPORT",
        export_normals=True,
        export_tangents=False,
        export_texcoords=True,
        export_skins=True,
        export_all_influences=False,
        export_influence_nb=4,
        export_def_bones=True,
        export_leaf_bone=False,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_anim_single_armature=True,
        export_force_sampling=True,
        export_bake_animation=True,
        export_anim_slide_to_zero=True,
        export_optimize_animation_size=True,
        export_yup=True,
        export_draco_mesh_compression_enable=False,
        check_existing=False,
    )
    if "FINISHED" not in result:
        raise RuntimeError(f"glTF export failed: {result}")

    summary = {
        "source": str(source),
        "source_sha256": sha256(source),
        "output": str(output),
        "output_sha256": sha256(output),
        "output_bytes": output.stat().st_size,
        "blender": bpy.app.version_string,
        "scale_factor": scale,
        "bind_bounds_meters_blender_xyz": {"min": final_min, "max": final_max},
        "source_meshes": len(meshes),
        "vertices": sum(len(mesh.data.vertices) for mesh in meshes),
        "polygons": sum(len(mesh.data.polygons) for mesh in meshes),
        "bones": len(armature.data.bones),
        "materials": sorted({mat.name for mesh in meshes for mat in mesh.data.materials if mat}),
        "actions": actions,
        "removed_root_scale_curves": removed_root_scale_curves,
    }
    print("CONVERSION_SUMMARY_BEGIN")
    print(json.dumps(summary, indent=2, sort_keys=True))
    print("CONVERSION_SUMMARY_END")


if __name__ == "__main__":
    main()
