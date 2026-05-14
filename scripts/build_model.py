"""
build_model.py - 3D-printable model build script for Rhino 8.

Reproduces the JSON model spec:
  - Units: inches.
  - Base cylinder: 1.0" OD ring, 0.625" ID (offset -0.1 in Y), 0.125" thick,
    sitting at the origin extruded +Z.
  - Bottom cylinder: 0.625" ID tube extending from z=0 to z=6 with the
    same eccentric bore. A 0.625" x 0.625" rectangular slot, centered at
    (0.3125, 0, 5.9) and extruded -5.8 in Z, halves the tube along the
    +X side leaving 0.1" of intact wall at top and bottom.
  - Final: BooleanUnion(Base, Bottom).

Run from Rhino:
    _-RunPythonScript "build_model.py"
or open in _ScriptEditor and press Run.
"""

import Rhino
import scriptcontext as sc
from Rhino.Geometry import (
    Circle,
    Extrusion,
    Plane,
    Point3d,
    Rectangle3d,
    Vector3d,
)


def circle_curve(cx, cy, cz, diameter, offset_y=0.0):
    """Return a closed NURBS circle in an XY plane at z=cz."""
    center = Point3d(cx, cy + offset_y, cz)
    plane = Plane(center, Vector3d.ZAxis)
    return Circle(plane, diameter / 2.0).ToNurbsCurve()


def rectangle_curve(cx, cy, cz, width, height):
    """Return a closed rectangle centered at (cx, cy, cz) in the XY plane."""
    corner = Point3d(cx - width / 2.0, cy - height / 2.0, cz)
    plane = Plane(corner, Vector3d.ZAxis)
    rect = Rectangle3d(plane, width, height)
    return rect.ToNurbsCurve()


def extrude(curve, height):
    """Extrude a closed planar curve along its plane normal; cap both ends."""
    extrusion = Extrusion.Create(curve, height, True)
    if extrusion is None:
        raise RuntimeError("Extrusion.Create returned None")
    return extrusion.ToBrep()


def boolean_difference(keep, subtract):
    tol = sc.doc.ModelAbsoluteTolerance
    result = Rhino.Geometry.Brep.CreateBooleanDifference([keep], [subtract], tol)
    if not result:
        raise RuntimeError("BooleanDifference failed")
    return result[0]


def boolean_union(breps):
    tol = sc.doc.ModelAbsoluteTolerance
    result = Rhino.Geometry.Brep.CreateBooleanUnion(breps, tol)
    if not result:
        raise RuntimeError("BooleanUnion failed")
    return result[0]


def build_base_cylinder():
    """Washer: 1.0" OD x 0.625" ID (eccentric -0.1 Y), 0.125" thick."""
    outer = circle_curve(0, 0, 0, diameter=1.0)
    outer_solid = extrude(outer, 0.125)

    # Inner bore extends 0.15 so it cuts cleanly through the 0.125 plate.
    inner = circle_curve(0, 0, 0, diameter=0.625, offset_y=-0.1)
    inner_solid = extrude(inner, 0.15)

    return boolean_difference(outer_solid, inner_solid)


def build_bottom_cylinder():
    """Slotted tube: 0.625" ID x 6" long, slot halves +X side."""
    cap = circle_curve(0, 0, 6, diameter=0.625, offset_y=-0.1)
    tube = extrude(cap, -6.0)  # spans z = 0 .. 6

    slot = rectangle_curve(0.3125, 0, 5.9, width=0.625, height=0.625)
    slot_solid = extrude(slot, -5.8)  # spans z = 0.1 .. 5.9

    return boolean_difference(tube, slot_solid)


def main():
    doc = sc.doc
    if doc is None:
        print("No active document.")
        return

    # Ensure inches.
    if doc.ModelUnitSystem != Rhino.UnitSystem.Inches:
        doc.AdjustModelUnitSystem(Rhino.UnitSystem.Inches, True)

    undo = doc.BeginUndoRecord("Build 3D-print model")
    try:
        base = build_base_cylinder()
        bottom = build_bottom_cylinder()
        merged = boolean_union([base, bottom])

        obj_id = doc.Objects.AddBrep(merged)
        if obj_id == Rhino.DocObjects.RhinoMath.UnsetGuid:
            print("Failed to add merged Brep to document.")
            return

        doc.Views.Redraw()
        print("Model built. Object id: {0}".format(obj_id))
    finally:
        doc.EndUndoRecord(undo)


if __name__ == "__main__":
    main()
