// Shared by the panel (js/panel.js, loaded with a script tag) and the host
// (jsx/host.jsx, loaded with $.evalFile). Keep this file ES3-compatible:
// no let/const, arrow functions, template literals, or Array.prototype.indexOf.
var GridRhythm = (function () {
  var SHAPES = ["square", "circle", "rectangle", "ellipse", "asset"];
  var PATTERN_MODES = ["row", "alternating"];
  var FILL_MODES = ["step", "mirror"];
  var ROTATE_STEPS = [0, 15, 30, 45, 90];
  var PALETTE = [[227, 74, 51], [246, 170, 54], [46, 134, 171], [27, 39, 64]];
  var MARGIN_RATIO = 0.06;
  var GUTTER_RATIO = 0.02;
  var CELL_FILL = 0.9;

  function contains(list, value) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] === value) { return true; }
    }
    return false;
  }

  function toInt(value) {
    var n;
    if (typeof value === "number") {
      n = value;
    } else if (typeof value === "string" && /^\s*-?\d+\s*$/.test(value)) {
      n = parseInt(value, 10);
    } else {
      return null;
    }
    return Math.floor(n) === n ? n : null;
  }

  function toNumber(value) {
    var n = NaN;
    if (typeof value === "number") {
      n = value;
    } else if (typeof value === "string" && /^\s*\d+(\.\d+)?\s*$/.test(value)) {
      n = parseFloat(value);
    }
    return isNaN(n) ? null : n;
  }

  function validateSize(rows, cols) {
    var r = toInt(rows);
    var c = toInt(cols);
    if (r === null || r < 1 || r > 20) { return "Rows must be a whole number from 1 to 20."; }
    if (c === null || c < 1 || c > 10) { return "Columns must be a whole number from 1 to 10."; }
    return null;
  }

  function validate(s) {
    if (!s) { return "No settings received."; }
    var sizeError = validateSize(s.rows, s.cols);
    if (sizeError) { return sizeError; }
    if (!contains(PATTERN_MODES, s.patternMode)) { return "Pattern mode must be row or alternating."; }
    if (!s.shapes || s.shapes.length < 1) { return "Choose at least one shape."; }
    for (var i = 0; i < s.shapes.length; i++) {
      if (!contains(SHAPES, s.shapes[i])) { return "Unknown shape: " + s.shapes[i] + "."; }
    }
    if (contains(s.shapes, "asset") && !s.assetPath) { return "The linked asset has no file path."; }
    if (!contains(FILL_MODES, s.fillMode)) { return "Fill mode must be step or mirror."; }
    if (!contains(ROTATE_STEPS, toInt(s.rotateStep))) { return "Rotation must be 0, 15, 30, 45, or 90 degrees."; }
    var weight = toNumber(s.strokeWeight);
    if (weight === null || weight < 0 || weight > 12) { return "Stroke weight must be between 0 and 12 pt."; }
    return null;
  }

  // Shape order follows SHAPES; alternating rows read the same list backwards.
  function sequence(shapes, reverse) {
    var out = [];
    for (var i = 0; i < SHAPES.length; i++) {
      if (contains(shapes, SHAPES[i])) { out.push(SHAPES[i]); }
    }
    if (reverse) { out.reverse(); }
    return out;
  }

  function plan(s) {
    var rows = toInt(s.rows);
    var cols = toInt(s.cols);
    var forward = sequence(s.shapes, false);
    var backward = sequence(s.shapes, true);
    var weight = toNumber(s.strokeWeight);
    var rotateStep = toInt(s.rotateStep);
    var cells = [];

    for (var r = 0; r < rows; r++) {
      var seq = (s.patternMode === "alternating" && r % 2 === 1) ? backward : forward;
      for (var c = 0; c < cols; c++) {
        var serial = r * cols + c;
        var colorIndex = (s.fillMode === "mirror")
          ? (Math.min(c, cols - 1 - c) + r) % PALETTE.length
          : serial % PALETTE.length;
        var cellWeight = weight > 0 ? weight * (1 + (r % 3)) : 0;
        cells.push({
          row: r,
          col: c,
          shape: seq[c % seq.length],
          colorIndex: colorIndex,
          rotation: (serial * rotateStep) % 360,
          strokeWeight: cellWeight,
          dashed: cellWeight > 0 && !!s.dashAlternate && r % 2 === 1
        });
      }
    }
    return cells;
  }

  // rect is [left, top, right, bottom] in Illustrator's y-up coordinates.
  // Gutters are the same horizontally and vertically.
  function layout(rows, cols, rect) {
    var width = rect[2] - rect[0];
    var height = rect[1] - rect[3];
    var unit = Math.min(width, height);
    var margin = unit * MARGIN_RATIO;
    var gutter = unit * GUTTER_RATIO;
    var cellW = (width - 2 * margin - (cols - 1) * gutter) / cols;
    var cellH = (height - 2 * margin - (rows - 1) * gutter) / rows;
    return {
      cellW: cellW,
      cellH: cellH,
      gutter: gutter,
      left: rect[0] + margin,
      top: rect[1] - margin,
      size: Math.min(cellW, cellH) * CELL_FILL
    };
  }

  function cellCenter(lay, row, col) {
    return [
      lay.left + col * (lay.cellW + lay.gutter) + lay.cellW / 2,
      lay.top - row * (lay.cellH + lay.gutter) - lay.cellH / 2
    ];
  }

  // Rectangles and ellipses are 60% as tall as they are wide; the rest are square.
  function shapeBox(lay, shape) {
    var wide = (shape === "rectangle" || shape === "ellipse");
    return { w: lay.size, h: wide ? lay.size * 0.6 : lay.size };
  }

  return {
    SHAPES: SHAPES,
    PATTERN_MODES: PATTERN_MODES,
    FILL_MODES: FILL_MODES,
    ROTATE_STEPS: ROTATE_STEPS,
    PALETTE: PALETTE,
    toInt: toInt,
    validateSize: validateSize,
    validate: validate,
    plan: plan,
    layout: layout,
    cellCenter: cellCenter,
    shapeBox: shapeBox
  };
}());

// Final expression: the host reads this file and uses eval() to get the object.
GridRhythm;
