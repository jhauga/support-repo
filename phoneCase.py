# -*- coding: utf-8 -*-
# =========================================================================
# phoneCase.py - FreeCAD Macro
# 3D Printable iPhone Case / Cradle with Half-Ellipsoid Dome Base
# =========================================================================
#
# HOW-TO DIRECTIONS:
#
# 1. Open FreeCAD (version 0.19 or later recommended, 0.21+/1.0+ ideal).
# 2. Go to Macro > Macros... > browse to this file and click "Execute",
#    or open the Python console (View > Panels > Python console) and run:
#        exec(open("/path/to/phoneCase.py").read())
# 3. The script will:
#    a) Create a half-ellipsoid dome (the "O cut in half") as the base
#    b) Orient the dome so its apex rests on the ground plane
#    c) Add a flat base plate on the dome's flat face
#    d) Add four L-shaped corner brackets to hold the phone
#    e) Fuse all parts into a single solid
#    f) Export the result as "phoneCase.stl" next to this script
# 4. Import the STL into your slicer (Cura, PrusaSlicer, etc.)
# 5. Recommended print settings:
#    - Layer height: 0.2 mm
#    - Infill: 15-20%
#    - Supports: None required (dome apex prints on build plate)
#    - Material: PLA or PETG
#    - Orientation: Print as-is (apex down on build plate)
# 6. To adjust for a different phone model, change the phone_length,
#    phone_width, and phone_thickness parameters in make_phone_case().
#
# =========================================================================

import FreeCAD
import Part
import Mesh
import MeshPart
import math
import os


def make_phone_case():
    """Build a 3D-printable phone case and export as STL."""

    doc = FreeCAD.newDocument("PhoneCase")

    # =====================================================================
    # Parameters — adjust for your phone model
    # =====================================================================
    phone_length = 147.6       # mm  (iPhone 15 length)
    phone_width = 71.6         # mm  (iPhone 15 width)
    phone_thickness = 8.0      # mm  (iPhone 15 thickness)
    clearance = 0.5            # mm  (play around phone in pocket)

    # Structural parameters
    wall = 2.5                 # mm  (general wall thickness)
    base_thick = 3.0           # mm  (base plate thickness)

    # Dome parameters
    dome_height = 22.0         # mm  (half-ellipsoid height)

    # L-bracket parameters
    bracket_arm = 20.0         # mm  (length of each arm of the L)
    bracket_thick = 2.5        # mm  (wall thickness of brackets)
    bracket_height = phone_thickness + 4.0   # mm  (bracket wall height)
    lip_depth = 2.0            # mm  (overhang to retain phone)
    lip_height = 1.5           # mm  (thickness of overhang lip)

    # Derived dimensions
    pocket_L = phone_length + clearance
    pocket_W = phone_width + clearance
    half_L = pocket_L / 2.0
    half_W = pocket_W / 2.0

    # Ellipsoid semi-axes (sized to match base plate footprint)
    semi_a = phone_length / 2.0 + wall + 4.0   # X half-extent
    semi_b = phone_width / 2.0 + wall + 4.0    # Y half-extent
    semi_c = dome_height                         # Z half-extent

    # =================================================================
    # Step 1 — "O cut in half": create a half-ellipsoid dome
    # =================================================================
    FreeCAD.Console.PrintMessage("Step 1: Creating half-ellipsoid dome...\n")

    # Lower hemisphere of a unit sphere (latitude -90° to 0°)
    lower_hemisphere = Part.makeSphere(
        1.0,                           # unit radius
        FreeCAD.Vector(0, 0, 0),       # center
        FreeCAD.Vector(0, 0, 1),       # direction
        -90, 0, 360                    # lat_min, lat_max, lon_sweep
    )
    # apex at (0, 0, -1), flat equatorial face at z = 0

    # Scale to ellipsoid proportions
    scale_mat = FreeCAD.Matrix()
    scale_mat.A11 = semi_a
    scale_mat.A22 = semi_b
    scale_mat.A33 = semi_c
    dome = lower_hemisphere.transformGeometry(scale_mat)
    # apex at (0, 0, -semi_c), flat face at z = 0

    # =================================================================
    # Step 2 — "Rotate where apex is on ground plane"
    # Translate upward so the apex sits at z = 0
    # =================================================================
    FreeCAD.Console.PrintMessage("Step 2: Positioning dome (apex on ground)...\n")

    dome.translate(FreeCAD.Vector(0, 0, semi_c))
    # apex at z = 0 (ground), flat face at z = semi_c

    # =================================================================
    # Step 3 — "Add a base"
    # A flat rectangular plate on the dome's flat face
    # =================================================================
    FreeCAD.Console.PrintMessage("Step 3: Adding base plate...\n")

    base_L = semi_a * 2.0
    base_W = semi_b * 2.0
    base = Part.makeBox(
        base_L, base_W, base_thick,
        FreeCAD.Vector(-base_L / 2.0, -base_W / 2.0, semi_c)
    )

    top_z = semi_c + base_thick   # top surface of base plate

    # =================================================================
    # Step 4 — "Add four L corners that will hold the phone"
    # Each L-bracket: two arms + corner block + retaining lip
    # =================================================================
    FreeCAD.Console.PrintMessage("Step 4: Adding L-corner brackets...\n")

    t = bracket_thick
    arm = bracket_arm
    h = bracket_height
    ld = lip_depth
    lh = lip_height
    lip_z = top_z + h - lh   # z-position of lip tops

    brackets = []

    # --- Bottom-Left corner (-half_L, -half_W) ---
    bl_parts = [
        # X-arm (runs +X along bottom edge, outside in -Y)
        Part.makeBox(arm, t, h, FreeCAD.Vector(-half_L, -half_W - t, top_z)),
        # Y-arm (runs +Y along left edge, outside in -X)
        Part.makeBox(t, arm, h, FreeCAD.Vector(-half_L - t, -half_W, top_z)),
        # Corner block
        Part.makeBox(t, t, h, FreeCAD.Vector(-half_L - t, -half_W - t, top_z)),
        # Lip on X-arm (overhangs inward in +Y)
        Part.makeBox(arm, ld, lh, FreeCAD.Vector(-half_L, -half_W, lip_z)),
        # Lip on Y-arm (overhangs inward in +X)
        Part.makeBox(ld, arm, lh, FreeCAD.Vector(-half_L, -half_W, lip_z)),
    ]
    bl = bl_parts[0]
    for p in bl_parts[1:]:
        bl = bl.fuse(p)
    brackets.append(bl)

    # --- Bottom-Right corner (+half_L, -half_W) ---
    br_parts = [
        # X-arm (runs -X along bottom edge, outside in -Y)
        Part.makeBox(arm, t, h, FreeCAD.Vector(half_L - arm, -half_W - t, top_z)),
        # Y-arm (runs +Y along right edge, outside in +X)
        Part.makeBox(t, arm, h, FreeCAD.Vector(half_L, -half_W, top_z)),
        # Corner block
        Part.makeBox(t, t, h, FreeCAD.Vector(half_L, -half_W - t, top_z)),
        # Lip on X-arm (overhangs inward in +Y)
        Part.makeBox(arm, ld, lh, FreeCAD.Vector(half_L - arm, -half_W, lip_z)),
        # Lip on Y-arm (overhangs inward in -X)
        Part.makeBox(ld, arm, lh, FreeCAD.Vector(half_L - ld, -half_W, lip_z)),
    ]
    br = br_parts[0]
    for p in br_parts[1:]:
        br = br.fuse(p)
    brackets.append(br)

    # --- Top-Left corner (-half_L, +half_W) ---
    tl_parts = [
        # X-arm (runs +X along top edge, outside in +Y)
        Part.makeBox(arm, t, h, FreeCAD.Vector(-half_L, half_W, top_z)),
        # Y-arm (runs -Y along left edge, outside in -X)
        Part.makeBox(t, arm, h, FreeCAD.Vector(-half_L - t, half_W - arm, top_z)),
        # Corner block
        Part.makeBox(t, t, h, FreeCAD.Vector(-half_L - t, half_W, top_z)),
        # Lip on X-arm (overhangs inward in -Y)
        Part.makeBox(arm, ld, lh, FreeCAD.Vector(-half_L, half_W - ld, lip_z)),
        # Lip on Y-arm (overhangs inward in +X)
        Part.makeBox(ld, arm, lh, FreeCAD.Vector(-half_L, half_W - arm, lip_z)),
    ]
    tl = tl_parts[0]
    for p in tl_parts[1:]:
        tl = tl.fuse(p)
    brackets.append(tl)

    # --- Top-Right corner (+half_L, +half_W) ---
    tr_parts = [
        # X-arm (runs -X along top edge, outside in +Y)
        Part.makeBox(arm, t, h, FreeCAD.Vector(half_L - arm, half_W, top_z)),
        # Y-arm (runs -Y along right edge, outside in +X)
        Part.makeBox(t, arm, h, FreeCAD.Vector(half_L, half_W - arm, top_z)),
        # Corner block
        Part.makeBox(t, t, h, FreeCAD.Vector(half_L, half_W, top_z)),
        # Lip on X-arm (overhangs inward in -Y)
        Part.makeBox(arm, ld, lh, FreeCAD.Vector(half_L - arm, half_W - ld, lip_z)),
        # Lip on Y-arm (overhangs inward in -X)
        Part.makeBox(ld, arm, lh, FreeCAD.Vector(half_L - ld, half_W - arm, lip_z)),
    ]
    tr = tr_parts[0]
    for p in tr_parts[1:]:
        tr = tr.fuse(p)
    brackets.append(tr)

    # =================================================================
    # Combine all parts into a single solid
    # =================================================================
    FreeCAD.Console.PrintMessage("Fusing all parts...\n")

    case = dome.fuse(base)
    for bracket in brackets:
        case = case.fuse(bracket)
    case = case.removeSplitter()

    # Add to document
    obj = doc.addObject("Part::Feature", "PhoneCase")
    obj.Shape = case
    doc.recompute()

    # =================================================================
    # Export as STL
    # =================================================================
    try:
        script_dir = os.path.dirname(os.path.realpath(__file__))
    except NameError:
        script_dir = os.path.expanduser("~")

    stl_path = os.path.join(script_dir, "phoneCase.stl")

    FreeCAD.Console.PrintMessage("Exporting STL to: {}\n".format(stl_path))

    mesh = MeshPart.meshFromShape(
        Shape=case,
        LinearDeflection=0.1,
        AngularDeflection=0.5,
    )
    mesh_obj = doc.addObject("Mesh::Feature", "PhoneCaseMesh")
    mesh_obj.Mesh = mesh
    Mesh.export([mesh_obj], stl_path)

    FreeCAD.Console.PrintMessage("phoneCase.stl exported successfully!\n")

    return doc


if __name__ == "__main__":
    make_phone_case()
