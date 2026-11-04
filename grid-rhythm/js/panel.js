(function () {
  var cs = new CSInterface();
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PREVIEW_ROWS = 4;
  var PREVIEW_W = 120;
  var PREVIEW_H = 80;
  var STEP_NAMES = ['Size', 'Pattern', 'Design'];
  var extPath = cs.getSystemPath(SystemPath.EXTENSION);
  var assetPath = extPath + '/assets/accent.ai';

  function el(id) { return document.getElementById(id); }

  function showStep(n) {
    for (var i = 1; i <= 3; i++) { el('step-' + i).hidden = (i !== n); }
    el('stepLabel').textContent = 'Step ' + n + ' of 3: ' + STEP_NAMES[n - 1];
    if (n === 3) { renderPreview(); }
  }

  function checkedValues(name) {
    var out = [];
    var nodes = document.querySelectorAll('input[name="' + name + '"]');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].checked) { out.push(nodes[i].value); }
    }
    return out;
  }

  function readSettings() {
    return {
      rows: el('rows').value,
      cols: el('cols').value,
      patternMode: checkedValues('pattern')[0],
      shapes: checkedValues('shape'),
      fillMode: el('fillMode').value,
      rotateStep: el('rotateStep').value,
      strokeWeight: el('strokeWeight').value,
      dashAlternate: el('dashAlternate').checked,
      assetPath: assetPath
    };
  }

  function setText(id, text, isError) {
    var node = el(id);
    node.textContent = text;
    node.className = isError ? 'status is-error' : 'status';
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) { node.setAttribute(key, attrs[key]); }
    }
    return node;
  }

  function renderPreview() {
    var svg = el('preview');
    while (svg.firstChild) { svg.removeChild(svg.firstChild); }
    var s = readSettings();
    if (GridRhythm.validateSize(s.rows, s.cols)) { return; }
    if (s.shapes.length === 0) {
      el('designError').textContent = 'Choose at least one shape.';
      return;
    }
    el('designError').textContent = '';

    var rows = GridRhythm.toInt(s.rows);
    var cols = GridRhythm.toInt(s.cols);
    var shown = Math.min(PREVIEW_ROWS, rows);
    var cells = GridRhythm.plan({
      rows: shown, cols: cols, patternMode: s.patternMode, shapes: s.shapes,
      fillMode: s.fillMode, rotateStep: s.rotateStep, strokeWeight: s.strokeWeight,
      dashAlternate: s.dashAlternate
    });
    var lay = GridRhythm.layout(shown, cols, [0, PREVIEW_H, PREVIEW_W, 0]);

    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var center = GridRhythm.cellCenter(lay, cell.row, cell.col);
      var box = GridRhythm.shapeBox(lay, cell.shape);
      var cx = center[0];
      var cy = PREVIEW_H - center[1];
      var fill = GridRhythm.PALETTE[cell.colorIndex];
      var stroke = GridRhythm.PALETTE[(cell.colorIndex + 1) % GridRhythm.PALETTE.length];
      var sw = cell.strokeWeight * 0.25;
      var transform = 'rotate(' + (-cell.rotation) + ' ' + cx + ' ' + cy + ')';
      var node;

      if (cell.shape === 'asset') {
        node = svgEl('image', {
          href: 'assets/accent.svg',
          x: cx - box.w / 2, y: cy - box.h / 2, width: box.w, height: box.h,
          transform: transform
        });
      } else if (cell.shape === 'square' || cell.shape === 'rectangle') {
        node = svgEl('rect', {
          x: cx - box.w / 2, y: cy - box.h / 2, width: box.w, height: box.h
        });
      } else {
        node = svgEl('ellipse', { cx: cx, cy: cy, rx: box.w / 2, ry: box.h / 2 });
      }

      if (cell.shape !== 'asset') {
        node.setAttribute('fill', 'rgb(' + fill.join(',') + ')');
        node.setAttribute('transform', transform);
        if (cell.strokeWeight > 0) {
          node.setAttribute('stroke', 'rgb(' + stroke.join(',') + ')');
          node.setAttribute('stroke-width', sw);
          if (cell.dashed) { node.setAttribute('stroke-dasharray', (sw * 2) + ' ' + (sw * 2)); }
        }
      }
      svg.appendChild(node);
    }
  }

  function validateSizeStep() {
    var s = readSettings();
    var problem = GridRhythm.validateSize(s.rows, s.cols);
    el('sizeError').textContent = problem || '';
    if (!problem) { showStep(2); }
  }

  function drawGrid() {
    var s = readSettings();
    var problem = GridRhythm.validate(s);
    el('designError').textContent = problem || '';
    if (problem) { return; }

    setText('status', 'Drawing...', false);
    el('draw').disabled = true;
    var json = JSON.stringify(s).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    var script = 'gridRhythmHost.draw(' + json + ', ' + JSON.stringify(extPath) + ')';

    cs.evalScript(script, function (raw) {
      el('draw').disabled = false;
      var res = null;
      try { res = JSON.parse(raw); } catch (e) { res = null; }
      if (res && res.ok) {
        setText('status', res.message, false);
      } else {
        setText('status', res ? res.message : 'Host error: ' + raw, true);
      }
    });
  }

  el('nextSize').addEventListener('click', validateSizeStep);
  el('nextPattern').addEventListener('click', function () { showStep(3); });
  el('draw').addEventListener('click', drawGrid);

  var backButtons = document.querySelectorAll('[data-back]');
  for (var b = 0; b < backButtons.length; b++) {
    backButtons[b].addEventListener('click', function (evt) {
      showStep(Number(evt.currentTarget.getAttribute('data-back')));
    });
  }

  var step3 = el('step-3');
  step3.addEventListener('input', renderPreview);
  step3.addEventListener('change', renderPreview);

  showStep(1);
}());
