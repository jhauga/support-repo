// Acme Sting build script (ExtendScript, ES3).
// Job: var stingJob = { preset, overrides, render, projectFile, outputFile, resultFile };
// The last expression returns the JSON result text, and the same text is written to resultFile.

var ACME_REVEAL = 1.0;
var ACME_SCALE_TIME = 0.9;
var ACME_SPIN_TIME = 1.0;
var ACME_TRIM_START = 0.1;
var ACME_TYPE_START = 0.9;
var ACME_TAGLINE_START = 1.7;
var ACME_TAGLINE_TIME = 0.5;

var ACME_DEFAULTS = {
    preset: 'Classic',
    duration: 6,
    word: 'ACME',
    tagline: 'Quality you can count on',
    endCard: 'example.com',
    colors: {
        mark: '#D7261E',
        letter: '#FFFFFF',
        word: '#FFFFFF',
        tagline: '#D0D0D0',
        background: '#0A0A1A',
        backgroundAlt: '#3A0A10'
    },
    effects: {
        scale: { on: true, overshoot: 10 },
        fade: { on: true, duration: 0.5 },
        spin: { on: false, degrees: 540 },
        trim: { on: true, duration: 1.0 },
        sweep: { on: true, duration: 1.0 },
        glow: { on: true, intensity: 1.2 },
        shadow: { on: true, opacity: 60, distance: 12 },
        type: { on: true, duration: 0.7 },
        tagline: { on: true, distance: 60 },
        flare: { on: true, style: 'flare' },
        drift: { on: true, speed: 0.25 },
        endCard: { on: true }
    }
};

var ACME_PRESETS = {
    Classic: {},
    Shine: {
        effects: {
            spin: { on: true, degrees: 360 },
            glow: { intensity: 2.0 },
            shadow: { opacity: 45, distance: 8 },
            sweep: { duration: 1.2 },
            flare: { style: 'flare' }
        }
    },
    Bounce: {
        effects: {
            scale: { overshoot: 25 },
            trim: { on: false },
            glow: { on: false },
            sweep: { on: false },
            flare: { style: 'burst' },
            tagline: { distance: 120 },
            drift: { on: false }
        }
    }
};

function acmeClone(v) {
    var i, o, k;
    if (v instanceof Array) {
        o = [];
        for (i = 0; i < v.length; i++) o.push(acmeClone(v[i]));
        return o;
    }
    if (v && typeof v === 'object') {
        o = {};
        for (k in v) if (v.hasOwnProperty(k)) o[k] = acmeClone(v[k]);
        return o;
    }
    return v;
}

function acmeMerge(base, extra) {
    for (var k in extra) {
        if (!extra.hasOwnProperty(k)) continue;
        var e = extra[k];
        if (e && typeof e === 'object' && !(e instanceof Array) && base[k] && typeof base[k] === 'object') {
            acmeMerge(base[k], e);
        } else {
            base[k] = acmeClone(e);
        }
    }
    return base;
}

function acmeSettings(job) {
    var s = acmeClone(ACME_DEFAULTS);
    var name = job.preset || 'Classic';
    if (!ACME_PRESETS.hasOwnProperty(name)) throw new Error('Unknown preset: ' + name);
    acmeMerge(s, ACME_PRESETS[name]);
    acmeMerge(s, job.overrides || {});
    s.preset = name;
    for (var k in s.effects) {
        if (s.effects.hasOwnProperty(k) && !ACME_DEFAULTS.effects.hasOwnProperty(k)) {
            throw new Error('Unknown effect setting: ' + k);
        }
    }
    return s;
}

function acmeEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

function acmeToJson(v) {
    var i, parts, k;
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'number') return isFinite(v) ? String(v) : 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'string') return '"' + acmeEscape(v) + '"';
    if (v instanceof Array) {
        parts = [];
        for (i = 0; i < v.length; i++) parts.push(acmeToJson(v[i]));
        return '[' + parts.join(',') + ']';
    }
    parts = [];
    for (k in v) if (v.hasOwnProperty(k)) parts.push('"' + acmeEscape(k) + '":' + acmeToJson(v[k]));
    return '{' + parts.join(',') + '}';
}

function acmeWriteText(path, text) {
    var f = new File(path);
    var dir = new Folder(f.parent.fsName);
    if (!dir.exists) dir.create();
    f.encoding = 'UTF-8';
    f.open('w');
    f.write(text);
    f.close();
}

function acmeRgb(hex) {
    var h = String(hex).replace('#', '');
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
}

function acmeRgbA(hex) {
    var c = acmeRgb(hex);
    return [c[0], c[1], c[2], 1];
}

function acmeEffectMap() {
    var map = {};
    var list = app.effects;
    for (var i = 0; i < list.length; i++) map[list[i].matchName] = true;
    return map;
}

function acmeAddEffect(layer, matchName, map, result) {
    if (!map[matchName]) {
        result.skippedEffects.push(matchName);
        return null;
    }
    result.effectsApplied.push(matchName);
    return layer.property('ADBE Effect Parade').addProperty(matchName);
}

function acmeFindProp(group, re) {
    for (var i = 1; i <= group.numProperties; i++) {
        var p = group.property(i);
        if (p.name && re.test(p.name)) return p;
    }
    return null;
}

function acmeStyleText(layer, size, hex, font, justify) {
    var src = layer.sourceText;
    var td = src.value;
    td.font = font;
    td.fontSize = size;
    td.fillColor = acmeRgb(hex);
    td.justification = justify;
    td.applyFill = true;
    td.applyStroke = false;
    src.setValue(td);
}

function acmeEllipse(contents, name, size, fill, stroke, strokeWidth) {
    var g = contents.addProperty('ADBE Vector Group');
    g.name = name;
    var gc = g.property('ADBE Vectors Group');
    gc.addProperty('ADBE Vector Shape - Ellipse').property('ADBE Vector Ellipse Size').setValue([size, size]);
    if (fill) gc.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(fill);
    if (stroke) {
        var st = gc.addProperty('ADBE Vector Graphic - Stroke');
        st.property('ADBE Vector Stroke Color').setValue(stroke);
        st.property('ADBE Vector Stroke Width').setValue(strokeWidth);
    }
    return g;
}

function acmeBuildLogo(s) {
    var E = s.effects;
    var c = s.colors;
    var D = s.duration;
    var comp = app.project.items.addComp('Acme Logo', 1200, 600, 1, D, 30);

    var mark = comp.layers.addShape();
    mark.name = 'Mark';
    mark.position.setValue([300, 300]);
    var contents = mark.property('ADBE Root Vectors Group');
    var ring = acmeEllipse(contents, 'Outline', 330, null, acmeRgb(c.word), 14);
    if (E.trim.on) {
        var trim = ring.property('ADBE Vectors Group').addProperty('ADBE Vector Filter - Trim');
        trim.property('ADBE Vector Trim End').expression = 'ease(time,' + ACME_TRIM_START + ',' + (ACME_TRIM_START + E.trim.duration) + ',0,100)';
    }

    var ag = contents.addProperty('ADBE Vector Group');
    ag.name = 'Letter A';
    var agc = ag.property('ADBE Vectors Group');
    var legs = new Shape();
    legs.vertices = [[-70, 90], [0, -95], [70, 90]];
    legs.inTangents = [[0, 0], [0, 0], [0, 0]];
    legs.outTangents = [[0, 0], [0, 0], [0, 0]];
    legs.closed = false;
    agc.addProperty('ADBE Vector Shape - Group').property('ADBE Vector Shape').setValue(legs);
    var bar = new Shape();
    bar.vertices = [[-42, 25], [42, 25]];
    bar.inTangents = [[0, 0], [0, 0]];
    bar.outTangents = [[0, 0], [0, 0]];
    bar.closed = false;
    agc.addProperty('ADBE Vector Shape - Group').property('ADBE Vector Shape').setValue(bar);
    var ast = agc.addProperty('ADBE Vector Graphic - Stroke');
    ast.property('ADBE Vector Stroke Color').setValue(acmeRgb(c.letter));
    ast.property('ADBE Vector Stroke Width').setValue(26);
    acmeEllipse(contents, 'Disc', 300, acmeRgb(c.mark), null, 0);

    if (E.spin.on) {
        mark.rotation.expression = 'ease(time,0,' + ACME_SPIN_TIME + ',' + (-E.spin.degrees) + ',0)';
    }

    var word = comp.layers.addText(s.word);
    word.name = 'Word';
    acmeStyleText(word, 170, c.word, 'Arial-BoldMT', ParagraphJustification.LEFT_JUSTIFY);
    word.position.setValue([520, 380]);
    if (E.type.on) {
        word.sourceText.expression = 'var full = "' + acmeEscape(s.word) + '"; ' +
            'full.substr(0, Math.round(ease(time,' + ACME_TYPE_START + ',' + (ACME_TYPE_START + E.type.duration) + ',0,full.length)))';
    }

    var tag = comp.layers.addText(s.tagline);
    tag.name = 'Tagline';
    acmeStyleText(tag, 48, c.tagline, 'ArialMT', ParagraphJustification.LEFT_JUSTIFY);
    tag.position.setValue([520, 470]);
    if (E.tagline.on) {
        var ts = ACME_TAGLINE_START;
        var te = ts + ACME_TAGLINE_TIME;
        var dist = E.tagline.distance;
        tag.position.expression = 'var p = value; [p[0], ease(time,' + ts + ',' + te + ',p[1]+' + dist + ',p[1])]';
        tag.opacity.expression = 'ease(time,' + ts + ',' + te + ',0,100)';
    }
    return comp;
}

function acmeBuildSting(s, logo, map, result) {
    var E = s.effects;
    var c = s.colors;
    var D = s.duration;
    var comp = app.project.items.addComp('Acme Sting', 1920, 1080, 1, D, 30);

    var bg = comp.layers.addSolid(acmeRgb(c.background), 'Background', 1920, 1080, 1);
    var ramp = acmeAddEffect(bg, 'ADBE Ramp', map, result);
    if (ramp) {
        ramp.property(1).setValue([960, 0]);
        ramp.property(2).setValue(acmeRgbA(c.background));
        ramp.property(3).setValue([960, 1080]);
        ramp.property(4).setValue(acmeRgbA(c.backgroundAlt));
        if (E.drift.on) {
            var k = 'Math.sin(time*' + E.drift.speed + '*2*Math.PI)';
            ramp.property(1).expression = '[960 + 500*' + k + ', 0]';
            ramp.property(3).expression = '[960 - 500*' + k + ', 1080]';
        }
    }

    var L = comp.layers.add(logo);
    L.name = 'Acme Logo';
    L.position.setValue([960, 540]);
    if (E.scale.on) {
        var c1 = E.scale.overshoot / 10 * 1.70158;
        L.scale.expression = 'var c1 = ' + c1 + '; var c3 = c1 + 1; ' +
            'var q = Math.min(Math.max(time/' + ACME_SCALE_TIME + ', 0), 1); ' +
            'var v = 1 + c3*Math.pow(q - 1, 3) + c1*Math.pow(q - 1, 2); [100*v, 100*v]';
    }
    if (E.fade.on) {
        L.opacity.expression = 'ease(time,0,' + E.fade.duration + ',0,100)';
    }
    if (E.shadow.on) {
        var sh = acmeAddEffect(L, 'ADBE Drop Shadow', map, result);
        if (sh) {
            acmeFindProp(sh, /^Opacity$/).setValue(E.shadow.opacity);
            acmeFindProp(sh, /^Distance$/).setValue(E.shadow.distance);
        }
    }
    if (E.glow.on) {
        var gl = acmeAddEffect(L, 'ADBE Glo2', map, result);
        if (gl) acmeFindProp(gl, /Intensity/).setValue(E.glow.intensity);
    }
    if (E.sweep.on) {
        var sw = acmeAddEffect(L, 'CC Light Sweep', map, result);
        if (sw) {
            var cp = acmeFindProp(sw, /^Center$/);
            if (cp) {
                cp.setValueAtTime(ACME_REVEAL, [-100, 300]);
                cp.setValueAtTime(ACME_REVEAL + E.sweep.duration, [1300, 300]);
            }
        }
    }

    if (E.endCard.on) {
        var ec = comp.layers.addText(s.endCard);
        ec.name = 'End Card';
        acmeStyleText(ec, 64, c.word, 'Arial-BoldMT', ParagraphJustification.CENTER_JUSTIFY);
        ec.position.setValue([960, 900]);
        ec.opacity.expression = 'ease(time,' + (D - 1) + ',' + (D - 0.6) + ',0,100)';
    }

    if (E.flare.on && E.flare.style === 'burst') {
        acmeBurst(comp, s);
    } else if (E.flare.on) {
        var fl = comp.layers.addSolid([0, 0, 0], 'Lens Flare', 1920, 1080, 1);
        fl.blendingMode = BlendingMode.ADD;
        var lf = acmeAddEffect(fl, 'ADBE Lens Flare', map, result);
        if (lf) {
            var br = acmeFindProp(lf, /Brightness/);
            if (br) br.expression = 'var t = time - ' + ACME_REVEAL + '; t < 0.4 ? ease(t,0,0.4,0,180) : ease(t,0.4,1.6,180,0)';
        }
    }
    return comp;
}

function acmeBurst(comp, s) {
    var bl = comp.layers.addShape();
    bl.name = 'Burst';
    bl.position.setValue([960, 540]);
    var bc = bl.property('ADBE Root Vectors Group');
    for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        var g = bc.addProperty('ADBE Vector Group');
        var gc = g.property('ADBE Vectors Group');
        gc.addProperty('ADBE Vector Shape - Ellipse').property('ADBE Vector Ellipse Size').setValue([16, 16]);
        gc.addProperty('ADBE Vector Graphic - Fill').property('ADBE Vector Fill Color').setValue(acmeRgb(s.colors.word));
        g.property('ADBE Vector Transform Group').property('ADBE Vector Position').setValue([Math.cos(a) * 160, Math.sin(a) * 160]);
    }
    var t = 'var t = time - ' + ACME_REVEAL + '; ';
    bl.scale.expression = t + 'var s = ease(t,0,1,10,260); var k = t < 0 ? 0 : 1; [s*k, s*k]';
    bl.opacity.expression = t + 'ease(t,0,1,100,0)';
}

function acmeRemoveComps(names) {
    var proj = app.project;
    for (var i = proj.numItems; i >= 1; i--) {
        var it = proj.item(i);
        if (it instanceof CompItem && (it.name === names[0] || it.name === names[1])) it.remove();
    }
}

function acmeOpenProject(target) {
    var proj = app.project;
    if (proj.file && proj.file.fsName === target.fsName) return;
    if (proj.dirty) throw new Error('Another project with unsaved changes is open. Save or close it, then run again.');
    if (target.exists) {
        app.open(target);
    } else {
        app.newProject();
        app.project.save(target);
    }
}

function acmeRender(comp, outFile, result) {
    var rq = app.project.renderQueue;
    var i, pick = null;
    for (i = rq.numItems; i >= 1; i--) {
        if (rq.item(i).status === RQItemStatus.QUEUED) rq.item(i).remove();
    }
    var item = rq.items.add(comp);
    var om = item.outputModule(1);
    var names = om.templates;
    for (i = 0; i < names.length; i++) {
        if (/H\.264/.test(names[i]) && /15 Mbps/.test(names[i])) { pick = names[i]; break; }
    }
    if (!pick) {
        for (i = 0; i < names.length; i++) {
            if (/H\.264/.test(names[i])) { pick = names[i]; break; }
        }
    }
    if (!pick) throw new Error('No H.264 output module template is installed.');
    om.applyTemplate(pick);
    om.file = new File(outFile);
    rq.render();
    result.render = {
        file: outFile,
        template: pick,
        status: item.status === RQItemStatus.DONE ? 'DONE' : String(item.status)
    };
}

function acmeRun(job) {
    if (job.describe) {
        var described = { presets: {} };
        for (var name in ACME_PRESETS) {
            if (ACME_PRESETS.hasOwnProperty(name)) described.presets[name] = acmeSettings({ preset: name });
        }
        return acmeToJson(described);
    }
    var result = { ok: false, skippedEffects: [], effectsApplied: [] };
    var undoOpen = false, suppressed = false;
    var tempDir = Folder.temp.fsName + '\\acme-sting';
    result.resultFile = job.resultFile || (tempDir + '\\result.json');
    try {
        var s = acmeSettings(job);
        result.preset = s.preset;
        var root = new File($.fileName).parent.parent.fsName;
        var projectFile = new File(job.projectFile || (root + '\\acme-sting.aep'));
        result.project = projectFile.fsName;

        app.beginSuppressDialogs();
        suppressed = true;
        acmeOpenProject(projectFile);

        app.beginUndoGroup('Acme Sting');
        undoOpen = true;
        var map = acmeEffectMap();
        acmeRemoveComps(['Acme Sting', 'Acme Logo']);
        var logo = acmeBuildLogo(s);
        var sting = acmeBuildSting(s, logo, map, result);
        app.endUndoGroup();
        undoOpen = false;

        app.project.save();
        result.composition = { name: sting.name, width: sting.width, height: sting.height, fps: sting.frameRate, duration: sting.duration };
        result.logoComposition = { name: logo.name, width: logo.width, height: logo.height };

        if (job.render) {
            var outFile = job.outputFile || (tempDir + '\\' + s.preset + '.mp4');
            acmeRender(sting, outFile, result);
            app.project.save();
        }
        result.ok = true;
    } catch (e) {
        result.ok = false;
        result.error = e.message;
        result.line = e.line;
    } finally {
        if (undoOpen) app.endUndoGroup();
        if (suppressed) app.endSuppressDialogs(false);
    }
    var text = acmeToJson(result);
    acmeWriteText(result.resultFile, text);
    return text;
}

acmeRun(typeof stingJob === 'undefined' ? {} : stingJob);
