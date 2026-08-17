"""Build the three original V11 skinned character assets.

The script is intentionally deterministic and uses only Blender primitives and
authored profiles.  No external meshes, textures, or proprietary data enter the
pipeline.  Run with Blender 4.5 LTS in background mode.
"""

from __future__ import annotations

import json
import math
import os
import struct
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "src" / "assets" / "models"
SOURCE_DIR = ROOT / "art_source" / "characters"
PREVIEW_DIR = ROOT / "art_source" / "previews"
MANIFEST_PATH = MODEL_DIR / "v11-character-manifest.json"

for directory in (MODEL_DIR, SOURCE_DIR, PREVIEW_DIR):
    directory.mkdir(parents=True, exist_ok=True)


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures,
                       bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)
    # Actions are not scene objects, so deleting scene contents does not remove
    # them.  Keeping them would make later exports acquire .001 duplicate clips.
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.render.resolution_x = 720
    bpy.context.scene.render.resolution_y = 720
    bpy.context.scene.render.resolution_percentage = 100
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.fps = 30
    bpy.context.scene.world.color = (0.006, 0.008, 0.012)


def mat(name, color, metallic=0.0, roughness=0.6, emission=None, emission_strength=0.0, albedo_path=None, albedo_value=1.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1.0)
    material.use_nodes = True
    bsdf = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if albedo_path:
        image = bpy.data.images.load(str(albedo_path), check_existing=True)
        image.colorspace_settings.name = "sRGB"
        image.pack()
        texture = material.node_tree.nodes.new("ShaderNodeTexImage")
        texture.name = "Original authored albedo"
        texture.image = image
        texture.interpolation = "Linear"
        texture.extension = "REPEAT"
        grade = material.node_tree.nodes.new("ShaderNodeHueSaturation")
        grade.name = "Gameplay-distance albedo grade"
        grade.inputs["Saturation"].default_value = 0.88
        grade.inputs["Value"].default_value = albedo_value
        material.node_tree.links.new(texture.outputs["Color"], grade.inputs["Color"])
        material.node_tree.links.new(grade.outputs["Color"], bsdf.inputs["Base Color"])
        material["source_albedo"] = str(Path(albedo_path).relative_to(ROOT))
    return material


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for modifier in list(obj.modifiers):
        if modifier.type != "ARMATURE":
            try:
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            except RuntimeError:
                pass
    obj.select_set(False)


def finish_mesh(obj, material, bevel=0.02):
    if material:
        obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        modifier = obj.modifiers.new("Edge polish", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
        modifier.limit_method = "ANGLE"
    apply_modifiers(obj)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.select_set(False)
    obj["v11_authored"] = True
    return obj


def cube(name, location, scale, material, rotation=(0, 0, 0), bevel=0.03):
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    return finish_mesh(obj, material, bevel)


def sphere(name, location, scale, material, subdivisions=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    return finish_mesh(obj, material, 0.012)


def uv_sphere(name, location, scale, material, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    return finish_mesh(obj, material, 0.008)


def cone(name, location, radius1, radius2, depth, material, vertices=12, rotation=(0, 0, 0), scale=(1, 1, 1), bevel=0.02):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    return finish_mesh(obj, material, bevel)


def cylinder_between(name, start, end, radius, material, vertices=12, bevel=0.018):
    start_v, end_v = Vector(start), Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    obj.rotation_mode = "XYZ"
    return finish_mesh(obj, material, bevel)


def tapered_between(name, start, end, radius_start, radius_end, material, vertices=10, bevel=0.014):
    start_v, end_v = Vector(start), Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius_start,
                                    radius2=radius_end, depth=direction.length,
                                    location=midpoint)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(direction.normalized())
    obj.rotation_mode = "XYZ"
    return finish_mesh(obj, material, bevel)


def torus(name, location, major, minor, material, rotation=(math.pi / 2, 0, 0), major_segments=32, minor_segments=8):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                    major_segments=major_segments, minor_segments=minor_segments,
                                    location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, material, 0.006)


def arc_tube(name, location, radius, thickness, start, end, material, samples=30, rotation=(0, 0, 0)):
    curve = bpy.data.curves.new(name + "Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 1
    curve.bevel_depth = thickness
    curve.bevel_resolution = 2
    spline = curve.splines.new("POLY")
    spline.points.add(samples - 1)
    for i, point in enumerate(spline.points):
        angle = start + (end - start) * i / (samples - 1)
        point.co = (math.cos(angle) * radius, math.sin(angle) * radius, 0, 1)
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, material, 0.006)


def panel(name, points, depth, material, bevel=0.018):
    """Create an authored front-facing cloth/metal panel from XY points."""
    verts = [(x, y, -depth * 0.5) for x, y in points] + [(x, y, depth * 0.5) for x, y in points]
    count = len(points)
    faces = [tuple(range(count)), tuple(range(count, count * 2))]
    for i in range(count):
        j = (i + 1) % count
        faces.append((i, j, count + j, count + i))
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish_mesh(obj, material, bevel)


def lathe_y(name, profile, material, segments=18, z_scale=0.72, bevel=0.018):
    """Create a tapered authored shell around runtime Y instead of a sphere."""
    verts = []
    for radius, y in profile:
        for index in range(segments):
            angle = math.tau * index / segments
            verts.append((math.sin(angle) * radius, y, math.cos(angle) * radius * z_scale))
    faces = []
    rows = len(profile)
    for row in range(rows - 1):
        for index in range(segments):
            nxt = (index + 1) % segments
            a = row * segments + index
            b = row * segments + nxt
            c = (row + 1) * segments + nxt
            d = (row + 1) * segments + index
            faces.append((a, b, c, d))
    faces.append(tuple(range(segments - 1, -1, -1)))
    base = (rows - 1) * segments
    faces.append(tuple(base + index for index in range(segments)))
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish_mesh(obj, material, bevel)


def wedge_boot(name, side, scale, material):
    s = scale
    x = side * 0.2 * s
    verts = [
        (x-.15*s, .02*s, -.08*s), (x+.15*s, .02*s, -.08*s),
        (x+.17*s, .02*s, .34*s), (x-.17*s, .02*s, .34*s),
        (x-.13*s, .22*s, -.04*s), (x+.13*s, .22*s, -.04*s),
        (x+.14*s, .15*s, .3*s), (x-.14*s, .15*s, .3*s),
    ]
    faces = [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
    mesh=bpy.data.meshes.new(name+"Mesh"); mesh.from_pydata(verts,[],faces); mesh.update()
    obj=bpy.data.objects.new(name,mesh); bpy.context.collection.objects.link(obj)
    return finish_mesh(obj,material,.018*s)


def armature(name, bones):
    arm_data = bpy.data.armatures.new(name + "Rig")
    arm_obj = bpy.data.objects.new(name + "Rig", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    arm_obj.show_in_front = True
    bpy.context.view_layer.objects.active = arm_obj
    arm_obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    created = {}
    for bone_name, head, tail, parent in bones:
        bone = arm_data.edit_bones.new(bone_name)
        bone.head = head
        bone.tail = tail
        bone.use_deform = True
        if parent:
            bone.parent = created[parent]
        created[bone_name] = bone
    bpy.ops.object.mode_set(mode="OBJECT")
    arm_obj.select_set(False)
    arm_obj["asset_forward"] = "+Z"
    arm_obj["asset_units"] = "meters"
    return arm_obj


def rigid_skin(obj, rig, bone_name):
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    modifier = obj.modifiers.new("Armature", "ARMATURE")
    modifier.object = rig
    obj.parent = rig


def bone_parent(obj, rig, bone_name):
    """Attach rigid accessories without creating unnecessary skin vertices."""
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


def skin_nearest_y(obj, rig, ranges):
    """Smoothly weight a continuous body shell by vertex height."""
    groups = {name: obj.vertex_groups.new(name=name) for name, _, _ in ranges}
    for vertex in obj.data.vertices:
        y = vertex.co.y + obj.location.y
        weights = []
        for name, center, radius in ranges:
            weight = max(0.0, 1.0 - abs(y - center) / radius)
            if weight > 0:
                weights.append((name, weight))
        if not weights:
            nearest = min(ranges, key=lambda item: abs(y - item[1]))
            weights = [(nearest[0], 1.0)]
        total = sum(weight for _, weight in weights)
        for name, weight in weights:
            groups[name].add([vertex.index], weight / total, "REPLACE")
    modifier = obj.modifiers.new("Armature", "ARMATURE")
    modifier.object = rig
    obj.parent = rig


def key_pose(rig, action, frame, pose, location=None):
    rig.animation_data_create()
    rig.animation_data.action = action
    for bone_name, rotation in pose.items():
        bone = rig.pose.bones.get(bone_name)
        if not bone:
            continue
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = rotation
        bone.keyframe_insert(data_path="rotation_euler", frame=frame, group=bone_name)
    if location:
        root = rig.pose.bones.get("root")
        root.location = location
        root.keyframe_insert(data_path="location", frame=frame, group="root")


def make_actions(rig, boss=False, transform=False):
    clips = []
    definitions = {
        "idle": (1, 48, [
            (1, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (24, {"spine": (0.025, 0, 0), "chest": (-0.035, 0.025, 0), "head": (0.025, -0.018, 0)}),
            (48, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ]),
        "move": (1, 24, [
            (1, {"upper_leg.L": (0.58, 0, 0), "upper_leg.R": (-0.58, 0, 0), "upper_arm.L": (-0.42, 0, -0.08), "upper_arm.R": (0.42, 0, 0.08), "chest": (-0.08, 0, 0)}),
            (7, {"upper_leg.L": (0, 0, 0), "upper_leg.R": (0, 0, 0), "upper_arm.L": (0, 0, -0.08), "upper_arm.R": (0, 0, 0.08), "chest": (0.01, 0.04, 0)}),
            (13, {"upper_leg.L": (-0.58, 0, 0), "upper_leg.R": (0.58, 0, 0), "upper_arm.L": (0.42, 0, -0.08), "upper_arm.R": (-0.42, 0, 0.08), "chest": (-0.08, 0, 0)}),
            (19, {"upper_leg.L": (0, 0, 0), "upper_leg.R": (0, 0, 0), "upper_arm.L": (0, 0, -0.08), "upper_arm.R": (0, 0, 0.08), "chest": (0.01, -0.04, 0)}),
            (24, {"upper_leg.L": (0.58, 0, 0), "upper_leg.R": (-0.58, 0, 0), "upper_arm.L": (-0.42, 0, -0.08), "upper_arm.R": (0.42, 0, 0.08), "chest": (-0.08, 0, 0)}),
        ]),
        "attack": (1, 30, [
            (1, {"spine": (0, 0, 0), "chest": (0, 0, 0), "upper_arm.R": (0, 0, 0.08), "forearm.R": (0, 0, 0)}),
            (9, {"spine": (0.1, -0.28, 0), "chest": (-0.08, -0.5, 0), "upper_arm.R": (-1.0, -0.35, 0.72), "forearm.R": (-0.8, 0, 0), "upper_arm.L": (-0.35, 0.2, -0.3)}),
            (15, {"spine": (-0.16, 0.44, 0), "chest": (-0.25, 0.8, 0), "upper_arm.R": (0.7, 0.22, -1.25), "forearm.R": (-0.28, 0, 0), "upper_arm.L": (0.3, -0.15, -0.15)}),
            (23, {"spine": (-0.05, 0.18, 0), "chest": (-0.05, 0.28, 0), "upper_arm.R": (0.25, 0.08, -0.5), "forearm.R": (-0.12, 0, 0)}),
            (30, {"spine": (0, 0, 0), "chest": (0, 0, 0), "upper_arm.R": (0, 0, 0.08), "forearm.R": (0, 0, 0)}),
        ]),
        "hurt": (1, 22, [
            (1, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (6, {"spine": (0.28, 0, 0.12), "chest": (0.36, -0.15, 0.1), "head": (-0.28, 0.1, -0.08), "upper_arm.L": (0.42, 0, -0.3), "upper_arm.R": (0.42, 0, 0.3)}),
            (14, {"spine": (-0.08, 0, -0.03), "chest": (-0.1, 0.05, -0.02), "head": (0.08, -0.04, 0.02)}),
            (22, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ]),
        "death": (1, 30, [
            (1, {"pelvis": (0, 0, 0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}, (0, 0, 0)),
            (7, {"pelvis": (0.16, 0, 0.06), "spine": (0.28, 0.05, 0.08), "chest": (0.34, -0.08, 0.12), "head": (-0.18, 0.08, -0.06), "upper_arm.L": (0.42, 0, -0.5), "upper_arm.R": (0.35, 0, 0.42)}, (0, -0.06, 0)),
            (18, {"pelvis": (0.55, 0, 0.12), "spine": (0.72, 0.08, 0.12), "chest": (0.68, -0.12, 0.18), "head": (-0.34, 0.1, -0.08), "upper_leg.L": (0.72, 0, -0.08), "upper_leg.R": (0.58, 0, 0.1), "lower_leg.L": (-0.62, 0, 0), "lower_leg.R": (-0.48, 0, 0), "cape.01": (0.72, 0, 0), "cape.02": (0.48, 0, 0), "cape.03": (0.3, 0, 0), "vestment.L": (0.62, 0, -0.18), "vestment.R": (0.52, 0, 0.16)}, (0, -0.3, 0.04)),
            (30, {"pelvis": (0.82, 0, 0.14), "spine": (0.98, 0.06, 0.12), "chest": (0.86, -0.1, 0.16), "head": (-0.46, 0.08, -0.1), "upper_arm.L": (0.68, 0.1, -0.62), "upper_arm.R": (0.62, -0.08, 0.56), "upper_leg.L": (0.92, 0, -0.08), "upper_leg.R": (0.74, 0, 0.1), "lower_leg.L": (-0.86, 0, 0), "lower_leg.R": (-0.72, 0, 0), "cape.01": (1.2, 0, 0), "cape.02": (0.92, 0, 0), "cape.03": (0.66, 0, 0), "vestment.L": (1.02, 0, -0.28), "vestment.R": (0.9, 0, 0.24)}, (0, -0.58, 0.11)),
        ]),
    }
    if transform:
        # Nightbound's authored attack is intentionally front-loaded to match
        # the existing gameplay contact timing. The first twelve frames travel
        # from a readable counter-twist into a fully extended weapon silhouette;
        # the remaining frames settle without changing clip duration.
        definitions["attack"] = (1, 30, [
            (1, {"pelvis": (0, 0, 0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0), "upper_arm.R": (0, 0, 0.08), "forearm.R": (0, 0, 0), "upper_arm.L": (0, 0, -0.08)}, (0, 0, 0)),
            (5, {"pelvis": (0.08, -0.2, 0), "spine": (0.12, -0.48, 0.04), "chest": (-0.08, -0.72, 0.08), "head": (0.04, 0.28, -0.04), "upper_arm.R": (-1.2, -0.38, 0.92), "forearm.R": (-1.08, 0.12, 0.08), "upper_arm.L": (-0.48, 0.22, -0.5), "forearm.L": (-0.38, 0, 0)}, (0, 0, -0.06)),
            (9, {"pelvis": (-0.08, 0.18, 0), "spine": (-0.22, 0.52, -0.04), "chest": (-0.32, 0.78, -0.08), "head": (0.12, -0.22, 0.02), "upper_arm.R": (0.82, 0.3, -1.35), "forearm.R": (-0.26, 0.08, -0.12), "upper_arm.L": (0.44, -0.2, -0.42), "forearm.L": (-0.22, 0, 0)}, (0, 0, 0.14)),
            (12, {"pelvis": (-0.14, 0.28, 0), "spine": (-0.3, 0.64, -0.06), "chest": (-0.4, 0.86, -0.1), "head": (0.16, -0.3, 0.04), "upper_arm.R": (1.04, 0.34, -1.52), "forearm.R": (-0.1, 0.12, -0.16), "upper_arm.L": (0.58, -0.24, -0.52), "forearm.L": (-0.18, 0, 0)}, (0, 0, 0.24)),
            (18, {"pelvis": (-0.05, 0.13, 0), "spine": (-0.14, 0.3, -0.02), "chest": (-0.18, 0.42, -0.04), "head": (0.06, -0.12, 0.02), "upper_arm.R": (0.58, 0.16, -0.86), "forearm.R": (-0.2, 0.05, -0.08), "upper_arm.L": (0.25, -0.1, -0.26)}, (0, 0, 0.13)),
            (24, {"pelvis": (0.02, -0.05, 0), "spine": (0.05, -0.12, 0), "chest": (0.06, -0.16, 0), "head": (-0.02, 0.05, 0), "upper_arm.R": (0.14, 0.04, -0.18), "forearm.R": (-0.08, 0, 0), "upper_arm.L": (0.04, 0, -0.12)}, (0, 0, 0.04)),
            (30, {"pelvis": (0, 0, 0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0), "upper_arm.R": (0, 0, 0.08), "forearm.R": (0, 0, 0), "upper_arm.L": (0, 0, -0.08), "forearm.L": (0, 0, 0)}, (0, 0, 0)),
        ])
        definitions["transform"] = (1, 24, [
            (1, {"pelvis": (0, 0, 0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0), "cape.01": (0, 0, 0), "cape.02": (0, 0, 0), "cape.03": (0, 0, 0)}),
            (6, {"pelvis": (0.24, -0.18, 0), "spine": (0.38, -0.34, 0.04), "chest": (0.42, -0.66, -0.04), "head": (-0.28, 0.28, 0), "upper_arm.L": (-0.62, 0.18, -0.72), "upper_arm.R": (-0.62, -0.18, 0.72), "forearm.L": (-1.05, 0, 0), "forearm.R": (-1.05, 0, 0), "cape.01": (0.36, 0.08, 0), "cape.02": (0.48, -0.08, 0), "cape.03": (0.58, 0.12, 0)}),
            (12, {"pelvis": (0.34, 0.28, 0), "spine": (0.55, 0.52, 0.08), "chest": (0.48, 0.92, -0.08), "head": (-0.38, -0.42, 0.08), "upper_arm.L": (-0.88, 0.28, -0.92), "upper_arm.R": (-0.88, -0.28, 0.92), "forearm.L": (-1.28, 0, 0), "forearm.R": (-1.28, 0, 0), "upper_leg.L": (0.32, 0, 0), "upper_leg.R": (0.32, 0, 0), "cape.01": (0.62, -0.12, 0), "cape.02": (0.72, 0.16, 0), "cape.03": (0.82, -0.18, 0)}),
            (18, {"pelvis": (-0.12, -0.16, 0), "spine": (-0.18, -0.32, -0.04), "chest": (-0.22, -0.5, 0.04), "head": (0.16, 0.24, 0), "upper_arm.L": (-0.32, 0.08, -0.34), "upper_arm.R": (-0.32, -0.08, 0.34), "cape.01": (-0.22, 0.08, 0), "cape.02": (-0.3, -0.06, 0), "cape.03": (-0.36, 0.1, 0)}),
            (24, {"pelvis": (0, 0, 0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0), "upper_arm.L": (0, 0, 0), "upper_arm.R": (0, 0, 0), "forearm.L": (0, 0, 0), "forearm.R": (0, 0, 0), "upper_leg.L": (0, 0, 0), "upper_leg.R": (0, 0, 0), "cape.01": (0, 0, 0), "cape.02": (0, 0, 0), "cape.03": (0, 0, 0)}),
        ])
    if boss:
        definitions["phase_pose"] = (1, 42, [
            (1, {"spine": (0, 0, 0), "chest": (0, 0, 0), "upper_arm.L": (0, 0, -0.12), "upper_arm.R": (0, 0, 0.12)}),
            (18, {"spine": (-0.12, 0, 0), "chest": (-0.32, 0, 0), "upper_arm.L": (-1.15, -0.2, -0.88), "upper_arm.R": (-1.15, 0.2, 0.88), "head": (0.2, 0, 0)}),
            (30, {"spine": (-0.06, 0, 0), "chest": (-0.18, 0, 0), "upper_arm.L": (-0.9, 0, -1.18), "upper_arm.R": (-0.9, 0, 1.18), "head": (0.08, 0, 0)}),
            (42, {"spine": (0, 0, 0), "chest": (0, 0, 0), "upper_arm.L": (0, 0, -0.12), "upper_arm.R": (0, 0, 0.12)}),
        ])
    for name, (start, end, keys) in definitions.items():
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        action.frame_range = (start, end)
        for key in keys:
            frame, pose = key[0], key[1]
            location = key[2] if len(key) > 2 else None
            key_pose(rig, action, frame, pose, location)
        for fcurve in action.fcurves:
            for point in fcurve.keyframe_points:
                point.interpolation = "BEZIER" if name != "move" else "LINEAR"
        clips.append(name)
    rig.animation_data.action = None
    # Leave the authored scene in a clean reference pose. ACTIONS export reads
    # every action slot directly; live NLA strips would otherwise blend all
    # clips together in the preview and initial glTF scene.
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    return clips


def humanoid_bones(height=2.2, cape=False, boss=False):
    s = height / 2.2
    bones = [
        ("root", (0, 0, 0), (0, 0.28 * s, 0), None),
        ("pelvis", (0, 0.28 * s, 0), (0, 0.72 * s, 0), "root"),
        ("spine", (0, 0.72 * s, 0), (0, 1.18 * s, 0), "pelvis"),
        ("chest", (0, 1.18 * s, 0), (0, 1.58 * s, 0), "spine"),
        ("neck", (0, 1.58 * s, 0), (0, 1.76 * s, 0), "chest"),
        ("head", (0, 1.76 * s, 0), (0, 2.08 * s, 0), "neck"),
        ("upper_arm.L", (-0.12 * s, 1.52 * s, 0), (-0.62 * s, 1.42 * s, 0), "chest"),
        ("forearm.L", (-0.62 * s, 1.42 * s, 0), (-0.98 * s, 1.08 * s, 0), "upper_arm.L"),
        ("hand.L", (-0.98 * s, 1.08 * s, 0), (-1.08 * s, 0.94 * s, 0), "forearm.L"),
        ("upper_arm.R", (0.12 * s, 1.52 * s, 0), (0.62 * s, 1.42 * s, 0), "chest"),
        ("forearm.R", (0.62 * s, 1.42 * s, 0), (0.98 * s, 1.08 * s, 0), "upper_arm.R"),
        ("hand.R", (0.98 * s, 1.08 * s, 0), (1.08 * s, 0.94 * s, 0), "forearm.R"),
        ("upper_leg.L", (-0.2 * s, 0.65 * s, 0), (-0.22 * s, 0.33 * s, 0), "pelvis"),
        ("lower_leg.L", (-0.22 * s, 0.33 * s, 0), (-0.2 * s, 0.08 * s, 0), "upper_leg.L"),
        ("foot.L", (-0.2 * s, 0.08 * s, 0), (-0.2 * s, 0.05 * s, 0.34 * s), "lower_leg.L"),
        ("upper_leg.R", (0.2 * s, 0.65 * s, 0), (0.22 * s, 0.33 * s, 0), "pelvis"),
        ("lower_leg.R", (0.22 * s, 0.33 * s, 0), (0.2 * s, 0.08 * s, 0), "upper_leg.R"),
        ("foot.R", (0.2 * s, 0.08 * s, 0), (0.2 * s, 0.05 * s, 0.34 * s), "lower_leg.R"),
    ]
    if cape:
        bones.extend([
            ("cape.01", (0, 1.45 * s, -0.15 * s), (0, 1.0 * s, -0.22 * s), "chest"),
            ("cape.02", (0, 1.0 * s, -0.22 * s), (0, 0.52 * s, -0.32 * s), "cape.01"),
            ("cape.03", (0, 0.52 * s, -0.32 * s), (0, 0.16 * s, -0.42 * s), "cape.02"),
        ])
    if boss:
        bones.extend([
            ("vestment.L", (-0.35 * s, 0.7 * s, 0), (-0.65 * s, 0.12 * s, 0.06 * s), "pelvis"),
            ("vestment.R", (0.35 * s, 0.7 * s, 0), (0.65 * s, 0.12 * s, 0.06 * s), "pelvis"),
            ("crozier", (-1.08 * s, 0.95 * s, 0), (-1.08 * s, 2.08 * s, 0), "hand.L"),
            ("chain.01", (1.02 * s, 0.96 * s, 0), (1.02 * s, 0.72 * s, 0), "hand.R"),
            ("chain.02", (1.02 * s, 0.72 * s, 0), (1.02 * s, 0.46 * s, 0), "chain.01"),
            ("censer", (1.02 * s, 0.46 * s, 0), (1.02 * s, 0.2 * s, 0), "chain.02"),
            ("halo", (0, 1.72 * s, -0.3 * s), (0, 2.0 * s, -0.3 * s), "chest"),
        ])
    return bones


def limb_parts(rig, scale, cloth, armor, heavy=False, angular_hands=False, taper_limbs=False):
    s = scale
    radius = (0.15 if heavy else 0.115) * s
    pieces = []
    specs = [
        ("UpperArm.L", (-0.14*s,1.52*s,0),(-0.62*s,1.42*s,0),"upper_arm.L",cloth),
        ("Forearm.L",(-0.62*s,1.42*s,0),(-0.98*s,1.08*s,0),"forearm.L",armor),
        ("UpperArm.R",(0.14*s,1.52*s,0),(0.62*s,1.42*s,0),"upper_arm.R",cloth),
        ("Forearm.R",(0.62*s,1.42*s,0),(0.98*s,1.08*s,0),"forearm.R",armor),
        ("Thigh.L",(-0.2*s,0.68*s,0),(-0.22*s,0.34*s,0),"upper_leg.L",cloth),
        ("Shin.L",(-0.22*s,0.34*s,0),(-0.2*s,0.08*s,0),"lower_leg.L",armor),
        ("Thigh.R",(0.2*s,0.68*s,0),(0.22*s,0.34*s,0),"upper_leg.R",cloth),
        ("Shin.R",(0.22*s,0.34*s,0),(0.2*s,0.08*s,0),"lower_leg.R",armor),
    ]
    for name, start, end, bone, material in specs:
        part_radius = radius if "Arm" in name or "Thigh" in name else radius*0.86
        obj = (tapered_between(name, start, end, part_radius*1.08, part_radius*.72, material, 10)
               if taper_limbs else cylinder_between(name, start, end, part_radius, material, 12))
        rigid_skin(obj, rig, bone)
        pieces.append(obj)
    for side in (-1, 1):
        suffix = "L" if side < 0 else "R"
        hand = (cube("Gauntlet."+suffix, (side*1.03*s, 1.01*s, 0.03*s),
                     (0.14*s,0.13*s,0.11*s), armor,
                     rotation=(0,0,side*-0.48), bevel=0.022*s)
                if angular_hands else
                sphere("Gauntlet."+suffix, (side*1.03*s, 1.01*s, 0.03*s), (0.14*s,0.17*s,0.12*s), armor, 2))
        rigid_skin(hand, rig, "hand."+suffix)
        boot = wedge_boot("Boot."+suffix, side, s, armor)
        rigid_skin(boot, rig, "foot."+suffix)
        pieces.extend([hand, boot])
    return pieces


def setup_preview(asset_name, target_y, height, rig, motion_clips):
    floor_mat = mat("Preview floor", (0.035, 0.045, 0.05), 0.05, 0.88)
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "PreviewFloor"
    floor.data.materials.append(floor_mat)
    bpy.ops.object.light_add(type="AREA", location=(4.5, 6.5, 5.5))
    key = bpy.context.object
    key.data.energy = 1050
    key.data.shape = "DISK"
    key.data.size = 4
    key.data.color = (0.72, 0.82, 1.0)
    key.rotation_euler = (math.radians(28), 0, math.radians(142))
    bpy.ops.object.light_add(type="AREA", location=(-4, 3.5, 1.8))
    rim = bpy.context.object
    rim.data.energy = 850
    rim.data.size = 3
    rim.data.color = (0.65, 0.1, 0.22)
    rim.rotation_euler = (math.radians(76), 0, math.radians(-55))
    bpy.ops.object.light_add(type="POINT", location=(0, height*0.72, 2.5))
    bpy.context.object.data.energy = 280
    bpy.context.object.data.color = (0.7, 0.48, 1.0)
    bpy.ops.object.camera_add(location=(height*1.15, -height*1.35, height*1.32))
    camera = bpy.context.object
    direction = Vector((0, 0, target_y)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 58
    bpy.context.scene.camera = camera
    bpy.context.scene.render.filepath = str(PREVIEW_DIR / f"{asset_name}-close.png")
    bpy.context.scene.render.film_transparent = False
    bpy.ops.render.render(write_still=True)
    camera.location = (height*2.25, -height*2.65, height*2.35)
    direction = Vector((0, 0, target_y * .9)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.lens = 62
    bpy.context.scene.render.filepath = str(PREVIEW_DIR / f"{asset_name}-gameplay.png")
    bpy.ops.render.render(write_still=True)
    for motion_clip in motion_clips:
        motion = bpy.data.actions.get(motion_clip)
        if not motion:
            continue
        rig.animation_data.action = motion
        evidence_frame = 12 if motion_clip in {"transform", "attack"} else 24
        bpy.context.scene.frame_set(evidence_frame)
        bpy.context.scene.render.filepath = str(PREVIEW_DIR / f"{asset_name}-{motion_clip}.png")
        bpy.ops.render.render(write_still=True)
        if asset_name == "nightbound" and motion_clip == "attack":
            for label, frame in (("anticipation", 5), ("contact", 12), ("recovery", 18)):
                bpy.context.scene.frame_set(frame)
                bpy.context.scene.render.filepath = str(PREVIEW_DIR / f"{asset_name}-attack-{label}.png")
                bpy.ops.render.render(write_still=True)
    rig.animation_data.action = None
    bpy.context.scene.frame_set(0)
    for pose_bone in rig.pose.bones:
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = (0, 0, 0)
        pose_bone.location = (0, 0, 0)
        pose_bone.scale = (1, 1, 1)
    bpy.context.view_layer.update()
    bpy.data.objects.remove(floor, do_unlink=True)
    for obj in list(bpy.context.scene.objects):
        if obj.type in {"LIGHT", "CAMERA"}:
            bpy.data.objects.remove(obj, do_unlink=True)


def export_asset(asset_name, rig, clips):
    glb = MODEL_DIR / f"{asset_name}.glb"
    blend = SOURCE_DIR / f"{asset_name}.blend"
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    export_objects = [rig] + [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in export_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    bpy.ops.export_scene.gltf(
        filepath=str(glb), export_format="GLB", use_selection=True,
        export_animations=True, export_animation_mode="ACTIONS",
        export_skins=True, export_morph=False, export_materials="EXPORT",
        export_cameras=False, export_lights=False, export_apply=False,
    )
    return glb, blend


def build_nightbound():
    clean_scene()
    cloth = mat("Nightbound torn oxblood cloth", (0.18,0.045,0.075), 0.02, 0.8,
                albedo_path=ROOT / "src/assets/materials/v11-nightbound-cloth-albedo.png", albedo_value=1.72)
    cloth_panel = mat("Nightbound oxblood coat panels", (0.19,0.045,0.08), 0.01, 0.9)
    cloth_shadow = mat("Nightbound cape shadow folds", (0.075,0.018,0.038), 0.0, 0.94)
    cloth_edge = mat("Nightbound cape edge folds", (0.29,0.055,0.095), 0.0, 0.88)
    steel = mat("Nightbound blue-black steel", (0.13,0.15,0.2), 0.52, 0.5)
    bone = mat("Nightbound ritual mask", (0.42,0.4,0.39), 0.0, 0.82)
    crimson = mat("Nightbound blood crystal", (0.3,0.01,0.03), 0.28, 0.32, (1.0,0.018,0.055), 3.6)
    leather = mat("Nightbound aged leather", (0.13,0.065,0.045), 0.02, 0.72)
    rig = armature("Nightbound", humanoid_bones(2.2, cape=True))
    torso = lathe_y("Nightbound segmented cuirass",[(.24,.72),(.3,.84),(.27,1.03),(.33,1.27),(.41,1.47),(.29,1.61)],steel,18,.64,.022)
    skin_nearest_y(torso, rig, [("pelvis",.75,.45),("spine",1.12,.4),("chest",1.48,.42)])
    chest = panel("Nightbound ribbed gorget", [(-.42,1.3),(-.33,1.62),(0,1.7),(.37,1.57),(.43,1.28),(0,1.18)], .13, steel)
    rigid_skin(chest, rig, "chest")
    for side in (-1,1):
        plate=panel("Nightbound faceted torso plate",[(side*.03,1.5),(side*.3,1.43),(side*.31,1.12),(side*.23,.83),(side*.04,.91)],.065,steel,.012)
        plate.location.z=.31; skin_nearest_y(plate,rig,[("spine",1.08,.38),("chest",1.4,.4)])
    sternum=panel("Nightbound crimson sternum",[(-.025,1.46),(.025,1.46),(.04,.96),(0,.86),(-.04,.96)],.025,crimson,.006)
    sternum.location.z=.365; skin_nearest_y(sternum,rig,[("spine",1.1,.35),("chest",1.42,.35)])
    skirt = lathe_y("Nightbound inner battle skirt",[(.31,.8),(.36,.62),(.4,.3),(.34,.12)],cloth_panel,16,.64,.014)
    skin_nearest_y(skirt, rig, [("pelvis",.62,.45),("upper_leg.L",.42,.35),("upper_leg.R",.42,.35)])
    coat_specs = [
        ("Nightbound coat front L",[(-.31,.88),(-.035,.86),(-.07,.28),(-.17,.08),(-.32,.17),(-.38,.52)],.315,cloth_edge),
        ("Nightbound coat front R",[(.035,.86),(.31,.88),(.38,.52),(.32,.17),(.17,.08),(.07,.28)],.315,cloth_panel),
        ("Nightbound coat side L",[(-.43,1.12),(-.27,1.09),(-.3,.28),(-.46,.18),(-.5,.5)],.045,cloth_shadow),
        ("Nightbound coat side R",[(.27,1.09),(.43,1.12),(.5,.5),(.46,.18),(.3,.28)],.045,cloth_panel),
    ]
    for name,points,z,coat_material in coat_specs:
        coat=panel(name,points,.045,coat_material,.012); coat.location.z=z
        skin_nearest_y(coat,rig,[("pelvis",.72,.5),("upper_leg.L",.35,.38),("upper_leg.R",.35,.38)])
    limb_parts(rig, 1.0, cloth, steel, angular_hands=True, taper_limbs=True)
    head = lathe_y("Nightbound pointed cowl",[(.16,1.63),(.27,1.72),(.29,1.86),(.22,2.02),(.065,2.17)],cloth_panel,14,.86,.014)
    rigid_skin(head, rig, "head")
    mask_obj = panel("Nightbound narrow funerary mask", [(-.12,2.02),(.12,2.02),(.155,1.9),(.105,1.7),(0,1.62),(-.105,1.7),(-.155,1.9)], .085, bone)
    mask_obj.location.z = .305
    rigid_skin(mask_obj, rig, "head")
    for side in (-1,1):
        eye = cube("Crimson eye slit",(side*.058,1.9,.358),(.037,.012,.01),crimson,rotation=(0,0,side*.08),bevel=.005)
        rigid_skin(eye,rig,"head")
        pauldron = sphere("Asymmetric pauldron",(side*.5,1.5,0),((.26 if side<0 else .2),.15,.24),steel,1)
        rigid_skin(pauldron,rig,"chest")
    ridge=panel("Nightbound mask center ridge",[(-.018,2.0),(.018,2.0),(.026,1.69),(0,1.63),(-.026,1.69)],.025,steel,.005)
    ridge.location.z=.36; rigid_skin(ridge,rig,"head")
    cape_folds=[
        ("Nightbound cape left fold",[(-.55,1.54),(-.12,1.52),(-.16,.78),(-.31,.13),(-.54,.36)],-.25,cloth_shadow),
        ("Nightbound cape center fold",[(-.16,1.55),(.17,1.54),(.2,.82),(.09,.08),(-.1,.23)],-.29,cloth_panel),
        ("Nightbound cape right fold",[(.12,1.52),(.5,1.5),(.55,.72),(.38,.2),(.2,.42)],-.24,cloth_edge),
    ]
    for name,points,z,cape_material in cape_folds:
        cape=panel(name,points,.04,cape_material,.01); cape.location.z=z
        skin_nearest_y(cape,rig,[("cape.01",1.35,.5),("cape.02",.8,.55),("cape.03",.25,.4)])
    for side in (-1,1):
        suffix="L" if side<0 else "R"
        bracer=tapered_between("Nightbound segmented bracer",(side*.64,1.4,.01),(side*.96,1.09,.03),.155,.095,steel,8,.01)
        rigid_skin(bracer,rig,"forearm."+suffix)
        toe=panel("Nightbound boot instep",[(side*.34,.18),(side*.08,.18),(side*.08,.03),(side*.35,.03)],.04,steel,.008)
        toe.location.z=.25; rigid_skin(toe,rig,"foot."+suffix)
    # Original crescent weapon assembled from an open torus, teeth and grip.
    blade=arc_tube("Nightbound crescent glaive",(1.08,.76,.12),.39,.052,-2.2,2.2,crimson,30,(math.pi/2,.15,-.35))
    bone_parent(blade,rig,"hand.R")
    grip=cylinder_between("Nightbound weapon grip",(.96,1.05,.04),(1.17,.62,.1),.048,leather,10); rigid_skin(grip,rig,"hand.R")
    for i in range(3):
        spike=cone("Crescent blade tooth",(1.34+i*.09,.58-i*.06,.13),.05,0,.28,steel,6,rotation=(math.pi/2,0,-.55+i*.15),bevel=.009)
        rigid_skin(spike,rig,"hand.R")
    clips=make_actions(rig,transform=True)
    # Assets are authored in runtime Y-up coordinates. Rotate that local frame
    # into Blender Z-up; Blender's glTF exporter converts it back to glTF Y-up.
    rig.rotation_euler.x = math.pi / 2
    setup_preview("nightbound",1.05,2.2,rig,["attack","transform","death"])
    return export_asset("nightbound",rig,clips),clips


def build_mourner():
    clean_scene()
    cloth=mat("Mourner gray-green linen",(.15,.17,.15),0,.88,
              albedo_path=ROOT / "src/assets/materials/v11-mourner-linen-albedo.png", albedo_value=1.42)
    shroud_cloth=mat("Mourner exposed shroud",(.18,.2,.17),0,.9)
    shroud_shadow=mat("Mourner shroud shadow",(.085,.1,.09),0,.94)
    iron=mat("Mourner pitted iron",(.075,.09,.095),.52,.64)
    bone=mat("Mourner soot burial mask",(.28,.275,.25),0,.86)
    teal=mat("Mourner drowned lumen",(.02,.22,.2),.08,.24,(.05,1,.76),4.8)
    leather=mat("Mourner wet leather",(.12,.075,.045),.02,.8)
    rig=armature("HuskMourner",humanoid_bones(2.0,cape=True))
    s=2/2.2
    torso=lathe_y("Mourner hunched torso",[(.27*s,.68*s),(.32*s,.84*s),(.3*s,1.06*s),(.43*s,1.28*s),(.46*s,1.44*s),(.27*s,1.58*s)],cloth,16,.74,.018)
    skin_nearest_y(torso,rig,[("pelvis",.68*s,.42),("spine",1.05*s,.45),("chest",1.42*s,.42)])
    limb_parts(rig,s,cloth,leather,angular_hands=True,taper_limbs=True)
    hood=cone("Mourner deep hood",(-.03*s,1.78*s,-.01),.31*s,.065*s,.56*s,cloth,12,rotation=(.1,0,-.06),scale=(1,1,.86),bevel=.014)
    rigid_skin(hood,rig,"head")
    mask_obj=panel("Mourner soot-slit mask",[(-.16*s,1.92*s),(.16*s,1.92*s),(.18*s,1.78*s),(.085*s,1.59*s),(0,1.54*s),(-.085*s,1.59*s),(-.18*s,1.78*s)],.085*s,bone)
    mask_obj.location.z=.29*s; rigid_skin(mask_obj,rig,"head")
    for i in range(3):
        slit=cube("Mask drowned slit",((i-1)*.075*s,1.79*s,.355*s),(.018*s,.065*s,.012*s),teal,rotation=(0,0,(i-1)*.08),bevel=.005)
        rigid_skin(slit,rig,"head")
    for side in (-1,1):
        paul=sphere("Mourner rust pauldron",(side*.46*s,1.43*s,0),(.2*s,.13*s,.2*s),iron,1); rigid_skin(paul,rig,"chest")
    rag=panel("Mourner funeral mantle",[(-.48*s,1.48*s),(.4*s,1.44*s),(.46*s,1.0*s),(.31*s,.52*s),(.12*s,.14*s),(-.05*s,.3*s),(-.27*s,.07*s),(-.44*s,.56*s)],.045*s,shroud_cloth,.01)
    rag.location.z=-.22*s; skin_nearest_y(rag,rig,[("cape.01",1.22*s,.45),("cape.02",.7*s,.5),("cape.03",.22*s,.35)])
    # Asymmetric front shroud and narrow wrappings keep the common enemy from
    # collapsing into a round torso at the gameplay camera distance.
    shroud=panel("Mourner diagonal shroud",[(-.36*s,1.42*s),(.18*s,1.5*s),(.33*s,.72*s),(.11*s,.16*s),(-.19*s,.28*s),(-.42*s,.92*s)],.05*s,shroud_cloth,.012)
    shroud.location.z=.29*s; skin_nearest_y(shroud,rig,[("chest",1.35*s,.5),("pelvis",.7*s,.6)])
    under_shroud=panel("Mourner under-shroud layer",[(.03*s,1.37*s),(.37*s,1.3*s),(.43*s,.68*s),(.24*s,.2*s),(.08*s,.35*s)],.045*s,shroud_shadow,.01)
    under_shroud.location.z=.255*s; skin_nearest_y(under_shroud,rig,[("chest",1.3*s,.5),("pelvis",.65*s,.55)])
    harness_l=panel("Mourner leather harness L",[(-.31*s,1.43*s),(-.21*s,1.48*s),(.1*s,.7*s),(0,.65*s)],.025*s,leather,.006)
    harness_l.location.z=.34*s; skin_nearest_y(harness_l,rig,[("chest",1.35*s,.45),("spine",.95*s,.5)])
    harness_r=panel("Mourner leather harness R",[(.31*s,1.43*s),(.21*s,1.48*s),(-.1*s,.7*s),(0,.65*s)],.025*s,leather,.006)
    harness_r.location.z=.342*s; skin_nearest_y(harness_r,rig,[("chest",1.35*s,.45),("spine",.95*s,.5)])
    belt=panel("Mourner leather waist belt",[(-.35*s,.78*s),(.35*s,.78*s),(.34*s,.68*s),(-.34*s,.68*s)],.03*s,leather,.006)
    belt.location.z=.33*s; rigid_skin(belt,rig,"pelvis")
    for side in (-1,1):
        suffix="L" if side<0 else "R"
        for index in range(3):
            wrap=torus("Mourner forearm wrap",(side*(.72+.07*index)*s,(1.31-.07*index)*s,.0),.115*s,.018*s,bone,rotation=(math.pi/2,0,side*.68),major_segments=12,minor_segments=4)
            rigid_skin(wrap,rig,"forearm."+suffix)
    # Hooked cleaver: broad asymmetrical authored polygon.
    blade=panel("Mourner hooked cleaver",[(.88*s,1.0*s),(1.08*s,1.1*s),(1.42*s,.48*s),(1.35*s,.17*s),(1.14*s,.31*s),(.98*s,.72*s)],.12*s,iron,.02)
    blade.location.z=.08*s; rigid_skin(blade,rig,"hand.R")
    grip=cylinder_between("Mourner cleaver grip",(.95*s,1.05*s,.05),(1.08*s,.72*s,.07),.052*s,leather,10); rigid_skin(grip,rig,"hand.R")
    clips=make_actions(rig)
    rig.rotation_euler.x = math.pi / 2
    setup_preview("husk-mourner",.95,2.0,rig,["attack","death"])
    return export_asset("husk-mourner",rig,clips),clips


def build_bell_saint():
    clean_scene()
    cloth=mat("Bell-Saint textured violet-black vestment",(.105,.065,.14),.01,.86,
              albedo_path=ROOT / "src/assets/materials/v11-bellsaint-vestment-albedo.png", albedo_value=1.58)
    vestment_panel=mat("Bell-Saint layered violet vestment",(.12,.075,.16),.01,.9)
    steel=mat("Bell-Saint reliquary steel",(.16,.17,.22),.68,.4)
    gold=mat("Bell-Saint aged toll gold",(.29,.19,.065),.7,.4,(.45,.16,.025),.14)
    void=mat("Bell-Saint void mask",(.003,.002,.008),.12,.2,(.24,.025,.35),1.1)
    violet=mat("Bell-Saint resonance",(.14,.025,.25),.22,.19,(.72,.16,1),6.0)
    height=4.8; s=height/2.2
    rig=armature("BellSaint",humanoid_bones(height,boss=True))
    lower=lathe_y("Bell-Saint inner vestment",[(.42*s,.08*s),(.58*s,.28*s),(.55*s,.68*s),(.43*s,1.05*s),(.34*s,1.2*s)],vestment_panel,18,.66,.028)
    skin_nearest_y(lower,rig,[("pelvis",.68*s,.8),("vestment.L",.38*s,.65),("vestment.R",.38*s,.65)])
    torso=lathe_y("Bell-Saint reliquary torso",[(.3*s,.72*s),(.34*s,.94*s),(.32*s,1.16*s),(.43*s,1.42*s),(.48*s,1.56*s),(.28*s,1.68*s)],steel,18,.68,.03)
    skin_nearest_y(torso,rig,[("pelvis",.72*s,.55),("spine",1.12*s,.58),("chest",1.48*s,.6)])
    limb_parts(rig,s,cloth,steel,heavy=True)
    sternum=panel("Bell-Saint seven seal breastplate",[(-.24*s,1.48*s),(0,1.62*s),(.24*s,1.48*s),(.18*s,1.22*s),(0,1.12*s),(-.18*s,1.22*s)],.1*s,steel,.022)
    sternum.location.z=.38*s; rigid_skin(sternum,rig,"chest")
    seal=panel("Bell-Saint small toll seal",[(-.075*s,1.48*s),(0,1.55*s),(.075*s,1.48*s),(.06*s,1.32*s),(0,1.27*s),(-.06*s,1.32*s)],.035*s,gold,.012)
    seal.location.z=.45*s; rigid_skin(seal,rig,"chest")
    hood=cone("Bell-Saint cathedral hood",(0,1.84*s,-.03*s),.34*s,.07*s,.72*s,cloth,14,scale=(1,1,.84),bevel=.02)
    rigid_skin(hood,rig,"head")
    mask_obj=panel("Bell-Saint suspended mask",[(-.2*s,2.03*s),(.2*s,2.03*s),(.24*s,1.86*s),(.13*s,1.57*s),(0,1.47*s),(-.13*s,1.57*s),(-.24*s,1.86*s)],.12*s,void,.018)
    mask_obj.location.z=.47*s; rigid_skin(mask_obj,rig,"head")
    slit=cube("Bell-Saint mask resonance",(0,1.82*s,.545*s),(.026*s,.19*s,.012*s),violet,bevel=.008); rigid_skin(slit,rig,"head")
    for side in (-1,1):
        paul=sphere("Bell-Saint reliquary pauldron",(side*.49*s,1.49*s,0),(.23*s,.15*s,.22*s),steel,1); rigid_skin(paul,rig,"chest")
        fin=cone("Bell-Saint shoulder fin",(side*.66*s,1.62*s,-.02*s),.06*s,.0,.4*s,gold,7,rotation=(0,0,side*-.86),bevel=.01); rigid_skin(fin,rig,"chest")
    # Broken halo arc made from gold ribs and resonance shards.
    for i in range(11):
        angle=-1.32+i*(2.64/10)
        if i in (4,7): continue
        x=math.sin(angle)*.72*s; y=(2.02+math.cos(angle)*.58)*s
        tine=cone("Bell-Saint broken halo tine",(x,y,-.5*s),.045*s,.012*s,.34*s,gold,6,rotation=(0,0,-angle),bevel=.008); rigid_skin(tine,rig,"halo")
    halo=torus("Bell-Saint resonance halo",(0,2.02*s,-.52*s),.72*s,.032*s,violet,rotation=(0,0,0),major_segments=40,minor_segments=6); rigid_skin(halo,rig,"halo")
    # Crozier on left.
    shaft=cylinder_between("Bell-Saint crozier shaft",(-1.24*s,.25*s,.02),(-1.24*s,2.04*s,.02),.05*s,gold,12); rigid_skin(shaft,rig,"crozier")
    bell=cone("Bell-Saint crozier bell",(-1.24*s,2.12*s,.02),.17*s,.07*s,.3*s,gold,14,bevel=.016); rigid_skin(bell,rig,"crozier")
    crook=torus("Bell-Saint crozier crown",(-1.02*s,2.02*s,.02),.22*s,.04*s,gold,rotation=(math.pi/2,0,0),major_segments=26,minor_segments=6); rigid_skin(crook,rig,"crozier")
    # Chained censer on right uses real chain bones.
    for i,(y,bone) in enumerate(((.72,"chain.01"),(.49,"chain.02"),(.25,"censer"))):
        link=torus("Bell-Saint censer link",(1.2*s,y*s,.02),.065*s,.016*s,gold,rotation=(0,(i%2)*math.pi/2,0),major_segments=12,minor_segments=5); rigid_skin(link,rig,bone)
    censer=cone("Bell-Saint war censer",(1.2*s,.04*s,.02),.19*s,.085*s,.36*s,gold,14,bevel=.016); rigid_skin(censer,rig,"censer")
    core=sphere("Bell-Saint censer void",(1.2*s,.05*s,.02),(.1*s,.12*s,.1*s),violet,2); rigid_skin(core,rig,"censer")
    # Five long, separated vestment leaves form the cathedral silhouette.
    vestment_panels=[
        ("Bell-Saint rear left vestment",[(-.64*s,1.18*s),(-.18*s,1.17*s),(-.28*s,.08*s),(-.72*s,.2*s)],-.18*s,"vestment.L"),
        ("Bell-Saint rear right vestment",[(.18*s,1.17*s),(.64*s,1.18*s),(.72*s,.2*s),(.28*s,.08*s)],-.18*s,"vestment.R"),
        ("Bell-Saint front left vestment",[(-.52*s,1.22*s),(-.04*s,1.2*s),(-.12*s,.04*s),(-.58*s,.18*s)],.25*s,"vestment.L"),
        ("Bell-Saint front right vestment",[(.04*s,1.2*s),(.52*s,1.22*s),(.58*s,.18*s),(.12*s,.04*s)],.25*s,"vestment.R"),
    ]
    for name,points,z,bone_name in vestment_panels:
        leaf=panel(name,points,.055*s,vestment_panel,.014*s); leaf.location.z=z; rigid_skin(leaf,rig,bone_name)
    # Layered heraldic panels break up the skirt silhouette.
    for i in range(5):
        x=(i-2)*.25*s
        p=panel("Bell-Saint tolling panel",[(x-.085*s,1.05*s),(x+.085*s,1.05*s),(x+.13*s,.32*s),(x,.18*s),(x-.13*s,.32*s)],.06*s,steel,.014)
        p.location.z=(.38-abs(i-2)*.06)*s; rigid_skin(p,rig,("pelvis" if i==2 else ("vestment.L" if i<2 else "vestment.R")))
    clips=make_actions(rig,boss=True)
    rig.rotation_euler.x = math.pi / 2
    setup_preview("bell-saint",2.3,height,rig,["death"])
    return export_asset("bell-saint",rig,clips),clips


def glb_json(path):
    with path.open("rb") as handle:
        magic, version, length = struct.unpack("<III", handle.read(12))
        if magic != 0x46546C67 or version != 2:
            raise RuntimeError(f"Invalid GLB: {path}")
        chunk_len, chunk_type = struct.unpack("<II", handle.read(8))
        if chunk_type != 0x4E4F534A:
            raise RuntimeError(f"Missing GLB JSON chunk: {path}")
        return json.loads(handle.read(chunk_len).decode("utf-8"))


def validate(asset_name, paths, expected_clips):
    glb, blend = paths
    data = glb_json(glb)
    accessors = data.get("accessors", [])
    triangles = 0
    for mesh in data.get("meshes", []):
        for primitive in mesh.get("primitives", []):
            mode = primitive.get("mode", 4)
            if mode == 4:
                if "indices" in primitive:
                    triangles += accessors[primitive["indices"]]["count"] // 3
                else:
                    pos = primitive.get("attributes", {}).get("POSITION")
                    triangles += accessors[pos]["count"] // 3 if pos is not None else 0
    node_names = [node.get("name", "") for node in data.get("nodes", [])]
    joint_ids = set()
    for skin in data.get("skins", []):
        joint_ids.update(skin.get("joints", []))
    animation_names = sorted(animation.get("name", "") for animation in data.get("animations", []))
    authored_roots = {
        "nightbound": "NightboundRig",
        "husk-mourner": "HuskMournerRig",
        "bell-saint": "BellSaintRig",
    }
    source_albedos = {
        "nightbound": ["src/assets/materials/v11-nightbound-cloth-albedo.png"],
        "husk-mourner": ["src/assets/materials/v11-mourner-linen-albedo.png"],
        "bell-saint": ["src/assets/materials/v11-bellsaint-vestment-albedo.png"],
    }
    scene = data.get("scenes", [{}])[data.get("scene", 0)]
    scene_roots = [data["nodes"][index].get("name", "") for index in scene.get("nodes", [])]
    missing = sorted(set(expected_clips) - set(animation_names))
    record = {
        "id": f"v11-{asset_name}",
        "asset": asset_name,
        "static_url": f"src/assets/models/{asset_name}.glb",
        "authored_root_name": authored_roots[asset_name],
        "glb": str(glb.relative_to(ROOT)),
        "blend": str(blend.relative_to(ROOT)),
        "previews": ([f"art_source/previews/{asset_name}-gameplay.png", f"art_source/previews/{asset_name}-close.png"]
                     + ([f"art_source/previews/{asset_name}-attack.png", f"art_source/previews/{asset_name}-attack-anticipation.png",
                         f"art_source/previews/{asset_name}-attack-contact.png", f"art_source/previews/{asset_name}-attack-recovery.png",
                         f"art_source/previews/{asset_name}-transform.png", f"art_source/previews/{asset_name}-death.png"]
                        if asset_name == "nightbound" else
                        [f"art_source/previews/{asset_name}-attack.png", f"art_source/previews/{asset_name}-death.png"]
                        if asset_name == "husk-mourner" else [f"art_source/previews/{asset_name}-death.png"])),
        "source_albedos": source_albedos[asset_name],
        "bytes": glb.stat().st_size,
        "blend_bytes": blend.stat().st_size,
        "triangles": triangles,
        "nodes": len(node_names),
        "skins": len(data.get("skins", [])),
        "bones": len(joint_ids),
        "clips": animation_names,
        "materials": [material.get("name", "") for material in data.get("materials", [])],
        "valid": bool(data.get("skins")) and not missing and animation_names == sorted(set(animation_names)) and scene_roots == [authored_roots[asset_name]],
        "missing_clips": missing,
        "scene_roots": scene_roots,
        "runtime_transform": {"scale": 1.0, "rotation_y": 0.0},
        "conventions": {"units": "meters", "up": "+Y at runtime / Blender +Z converted by glTF", "forward": "+Z at runtime", "root_at_ground": True},
    }
    if not record["valid"]:
        raise RuntimeError(f"Validation failed for {asset_name}: {record}")
    return record


def main():
    built=[]
    for asset_name,builder in (("nightbound",build_nightbound),("husk-mourner",build_mourner),("bell-saint",build_bell_saint)):
        paths,clips=builder()
        built.append(validate(asset_name,paths,clips))
    manifest={
        "schema":1,
        "generator":"tooling/blender/build_v11_assets.py",
        "license":"Original project-authored assets; no external or proprietary source assets.",
        "blender":"4.5.12 LTS",
        "assets":built,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(manifest,indent=2))


if __name__ == "__main__":
    main()
