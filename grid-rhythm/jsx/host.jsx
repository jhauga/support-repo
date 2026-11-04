// ES3 only. Loaded by CEP through ScriptPath in CSXS/manifest.xml.
// Every public function returns a JSON string so the panel can parse it.
var gridRhythmHost = (function () {
  // $.evalFile would scope the shared file's var to this function, so read and eval it instead.
  var GridRhythm = null;

  function loadShared(extPath) {
    var f = new File(extPath + '/js/rhythm-plan.js');
    if (!f.open('r')) { throw new Error('Cannot open ' + f.fsName); }
    var src = f.read();
    f.close();
    return eval(src);
  }

  function quote(value) {
    return '"' + String(value).replace(/[\\"\u0000-\u001f]/g, function (ch) {
      if (ch === '\\' || ch === '"') { return '\\' + ch; }
      return '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4);
    }) + '"';
  }

  function result(ok, message) {
    return '{"ok":' + (ok ? 'true' : 'false') + ',"message":' + quote(message) + '}';
  }

  function rgb(channels) {
    var color = new RGBColor();
    color.red = channels[0];
    color.green = channels[1];
    color.blue = channels[2];
    return color;
  }

  function getDocument() {
    if (app.documents.length > 0) { return app.activeDocument; }
    return app.documents.add(DocumentColorSpace.RGB, 960, 720);
  }

  function artboardRect(doc) {
    return doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
  }

  function drawRectangleOrEllipse(layer, cell, center, box) {
    var top = center[1] + box.h / 2;
    var left = center[0] - box.w / 2;
    var item = (cell.shape === 'square' || cell.shape === 'rectangle')
      ? layer.pathItems.rectangle(top, left, box.w, box.h)
      : layer.pathItems.ellipse(top, left, box.w, box.h);

    item.filled = true;
    item.fillColor = rgb(GridRhythm.PALETTE[cell.colorIndex]);
    item.stroked = cell.strokeWeight > 0;
    if (item.stroked) {
      item.strokeWidth = cell.strokeWeight;
      item.strokeColor = rgb(GridRhythm.PALETTE[(cell.colorIndex + 1) % GridRhythm.PALETTE.length]);
      item.strokeDashes = cell.dashed ? [cell.strokeWeight * 2, cell.strokeWeight * 2] : [];
    }
    return item;
  }

  function placeLinkedAsset(layer, lay, center, box, assetFile) {
    var item = layer.placedItems.add();
    item.file = assetFile;
    var b = item.geometricBounds;
    var scale = Math.min(box.w / (b[2] - b[0]), box.h / (b[1] - b[3])) * 100;
    item.resize(scale, scale);
    b = item.geometricBounds;
    item.position = [center[0] - (b[2] - b[0]) / 2, center[1] + (b[1] - b[3]) / 2];
    return item;
  }

  function draw(settings, extPath) {
    var layer = null;
    try {
      GridRhythm = loadShared(extPath);

      var problem = GridRhythm.validate(settings);
      if (problem) { return result(false, problem); }

      var assetFile = null;
      var needsAsset = false;
      for (var a = 0; a < settings.shapes.length; a++) {
        if (settings.shapes[a] === 'asset') { needsAsset = true; }
      }
      if (needsAsset) {
        assetFile = new File(settings.assetPath);
        if (!assetFile.exists) { return result(false, 'Linked asset not found at ' + settings.assetPath + '.'); }
      }

      var doc = getDocument();
      var lay = GridRhythm.layout(GridRhythm.toInt(settings.rows), GridRhythm.toInt(settings.cols), artboardRect(doc));
      if (lay.cellW <= 0 || lay.cellH <= 0) {
        return result(false, 'The artboard is too small for that many rows and columns.');
      }

      layer = doc.layers.add();
      layer.name = 'Grid Rhythm';
      doc.activeLayer = layer;

      var cells = GridRhythm.plan(settings);
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        var center = GridRhythm.cellCenter(lay, cell.row, cell.col);
        var box = GridRhythm.shapeBox(lay, cell.shape);
        var item;

        if (cell.shape === 'asset') {
          item = placeLinkedAsset(layer, lay, center, { w: lay.size, h: lay.size }, assetFile);
        } else {
          item = drawRectangleOrEllipse(layer, cell, center, box);
        }
        if (cell.rotation) { item.rotate(cell.rotation); }
      }

      app.redraw();
      return result(true, 'Drew ' + settings.rows + ' x ' + settings.cols + ' (' + cells.length + ' cells) on layer Grid Rhythm.');
    } catch (e) {
      if (layer) { try { layer.remove(); } catch (ignore) {} }
      return result(false, 'Line ' + e.line + ': ' + e.message);
    }
  }

  return { draw: draw };
}());
