#!/usr/bin/env python3
"""Merge a Mixamo character and selected motions into one WebGL GLB."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

import bpy


def args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, type=Path)
    parser.add_argument("--idle", required=True, type=Path)
    parser.add_argument("--run", required=True, type=Path)
    parser.add_argument("--attack", required=True, type=Path)
    parser.add_argument("--hurt", required=True, type=Path)
    parser.add_argument("--death", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--target-height", type=float, default=2.02)
    parser.add_argument("--root-name", default="MixamoVampireRig")
    parser.add_argument("--asset-source", default="Adobe Mixamo — Vampire A Lusth")
    return parser.parse_args(argv)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def reset() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1
    bpy.context.scene.render.fps = 30


def import_fbx(path: Path, global_scale: float) -> None:
    result = bpy.ops.import_scene.fbx(
        filepath=str(path.resolve()),
        global_scale=global_scale,
        use_anim=True,
        automatic_bone_orientation=False,
        use_custom_normals=True,
    )
    if "FINISHED" not in result:
        raise RuntimeError(f"FBX import failed for {path}: {result}")


def armatures() -> list[bpy.types.Object]:
    return [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]


def bound_meshes(armature: bpy.types.Object) -> list[bpy.types.Object]:
    return [
        obj for obj in bpy.context.scene.objects
        if obj.type == "MESH" and (
            obj.parent == armature
            or any(mod.type == "ARMATURE" and mod.object == armature for mod in obj.modifiers)
        )
    ]


def bounds(meshes: list[bpy.types.Object]) -> tuple[list[float], list[float]]:
    points = [obj.matrix_world @ vertex.co for obj in meshes for vertex in obj.data.vertices]
    return (
        [min(point[axis] for point in points) for axis in range(3)],
        [max(point[axis] for point in points) for axis in range(3)],
    )


def apply_scale(armature: bpy.types.Object, meshes: list[bpy.types.Object]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    armature.select_set(True)
    bpy.context.view_layer.objects.active = armature
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.select_all(action="DESELECT")
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def remove_objects(objects: set[bpy.types.Object]) -> None:
    for obj in objects:
        if obj.name in bpy.context.scene.objects:
            bpy.data.objects.remove(obj, do_unlink=True)


def import_action(path: Path, scale: float, name: str, base_bones: set[str]) -> dict[str, object]:
    before_objects = set(bpy.context.scene.objects)
    before_actions = set(bpy.data.actions)
    import_fbx(path, scale)
    imported_objects = set(bpy.context.scene.objects) - before_objects
    imported_armatures = [obj for obj in imported_objects if obj.type == "ARMATURE"]
    if len(imported_armatures) != 1:
        raise RuntimeError(f"{path.name}: expected one animation armature, got {len(imported_armatures)}")
    imported = imported_armatures[0]
    imported_bones = {bone.name for bone in imported.data.bones}
    missing_bones = base_bones - imported_bones
    common_bones = base_bones & imported_bones
    if 'mixamorig:Hips' not in common_bones or len(common_bones) < 60:
        raise RuntimeError(
            f"{path.name}: incompatible skeleton ({len(common_bones)} shared of "
            f"{len(base_bones)} base bones)"
        )
    candidates = list(set(bpy.data.actions) - before_actions)
    assigned = imported.animation_data.action if imported.animation_data else None
    action = assigned if assigned in candidates else max(candidates, key=lambda item: item.frame_range[1] - item.frame_range[0])
    removed_object_curves = 0
    removed_foreign_bone_curves = 0
    for curve in list(action.fcurves):
        # Object translation/scale is redundant with gameplay motion and is the
        # most common source of shrink, drift and teleport regressions.
        if not curve.data_path.startswith('pose.bones['):
            action.fcurves.remove(curve)
            removed_object_curves += 1
            continue
        match = re.match(r'pose\.bones\["(.+?)"\]', curve.data_path)
        if match and match.group(1) not in base_bones:
            action.fcurves.remove(curve)
            removed_foreign_bone_curves += 1
    # Mixamo motion FBXs retain the character's source-scene Hips offset even
    # when "In Place" is enabled. Applying that absolute offset after the GLB
    # is parented to the gameplay actor displaces the visible skin by metres.
    # Rebase each clip at its own first frame while preserving all relative
    # locomotion, anticipation, recoil and collapse authored after that frame.
    rebased_hips_axes: list[float] = []
    for curve in action.fcurves:
        if curve.data_path != 'pose.bones["mixamorig:Hips"].location':
            continue
        baseline = float(curve.evaluate(action.frame_range[0]))
        rebased_hips_axes.append(baseline)
        for key in curve.keyframe_points:
            # Gameplay owns all root displacement, including knockback, vertical
            # grounding and the death position. Mixamo's source-scene Hips
            # translation reaches tens of metres in several downloaded clips;
            # retaining any axis would detach the visible skin from its collider.
            key.co[1] = 0
            key.handle_left[1] = 0
            key.handle_right[1] = 0
    action.name = name
    action.use_fake_user = True
    frame_range = [float(action.frame_range[0]), float(action.frame_range[1])]
    for unused in candidates:
        if unused != action:
            bpy.data.actions.remove(unused)
    remove_objects(imported_objects)
    return {
        "source": path.name,
        "sha256": sha256(path),
        "frames": frame_range,
        "removed_object_curves": removed_object_curves,
        "removed_foreign_bone_curves": removed_foreign_bone_curves,
        "unanimated_base_bones": sorted(missing_bones),
        "rebased_hips_location": rebased_hips_axes,
    }


def main() -> None:
    config = args()
    source_paths = [config.base, config.idle, config.run, config.attack, config.hurt, config.death]
    for path in source_paths:
        if not path.is_file():
            raise FileNotFoundError(path)

    reset()
    import_fbx(config.base, 1)
    measured_armatures = armatures()
    if len(measured_armatures) != 1:
        raise RuntimeError(f"Base expected one armature, got {len(measured_armatures)}")
    measured_meshes = bound_meshes(measured_armatures[0])
    source_min, source_max = bounds(measured_meshes)
    source_height = source_max[2] - source_min[2]
    if source_height <= 0:
        raise RuntimeError("Base character has zero source height")
    scale = config.target_height / source_height

    reset()
    import_fbx(config.base, scale)
    base_armatures = armatures()
    if len(base_armatures) != 1:
        raise RuntimeError(f"Base expected one armature, got {len(base_armatures)}")
    rig = base_armatures[0]
    meshes = bound_meshes(rig)
    if not meshes:
        raise RuntimeError("Base character has no skinned meshes")
    keep = {rig, *meshes}
    remove_objects(set(bpy.context.scene.objects) - keep)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)

    apply_scale(rig, meshes)
    rig.name = config.root_name
    rig.data.name = f"{config.root_name}Armature"
    for index, mesh in enumerate(meshes):
        mesh.name = f"{config.root_name}Mesh{index + 1}"
        mesh.data.name = f"{config.root_name}Geometry{index + 1}"
    grounded_min, _ = bounds(meshes)
    rig.location.z -= grounded_min[2]
    bpy.context.view_layer.update()

    base_bones = {bone.name for bone in rig.data.bones}
    actions = {
        "idle": import_action(config.idle, scale, "idle", base_bones),
        "move": import_action(config.run, scale, "move", base_bones),
        "attack": import_action(config.attack, scale, "attack", base_bones),
        "hurt": import_action(config.hurt, scale, "hurt", base_bones),
        "death": import_action(config.death, scale, "death", base_bones),
    }
    rig.animation_data_create()
    rig.animation_data.action = None
    rig["assetSource"] = config.asset_source
    rig["license"] = "Mixamo Terms; embedded game use, no raw redistribution"
    rig["targetHeightMeters"] = float(config.target_height)
    rig["sourceSha256"] = sha256(config.base)

    bpy.ops.object.select_all(action="DESELECT")
    rig.select_set(True)
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    config.output.parent.mkdir(parents=True, exist_ok=True)
    result = bpy.ops.export_scene.gltf(
        filepath=str(config.output.resolve()),
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

    final_min, final_max = bounds(meshes)
    report = {
        "source": config.base.name,
        "source_sha256": sha256(config.base),
        "output": str(config.output),
        "output_sha256": sha256(config.output),
        "output_bytes": config.output.stat().st_size,
        "blender": bpy.app.version_string,
        "scale_factor": scale,
        "bind_bounds_blender_xyz": {"min": final_min, "max": final_max},
        "meshes": len(meshes),
        "vertices": sum(len(mesh.data.vertices) for mesh in meshes),
        "triangles": sum(len(mesh.data.loop_triangles) for mesh in meshes),
        "bones": len(rig.data.bones),
        "materials": sorted({mat.name for mesh in meshes for mat in mesh.data.materials if mat}),
        "actions": actions,
    }
    config.report.parent.mkdir(parents=True, exist_ok=True)
    config.report.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print("MIXAMO_CONVERSION_SUMMARY_BEGIN")
    print(json.dumps(report, indent=2, sort_keys=True))
    print("MIXAMO_CONVERSION_SUMMARY_END")


if __name__ == "__main__":
    main()
