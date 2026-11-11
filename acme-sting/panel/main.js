(function () {
    'use strict';

    var statusBox = document.getElementById('status');
    var presetSelect = document.getElementById('preset');
    var presets = {};

    function setStatus(text) {
        statusBox.textContent = text;
    }

    function scriptPath() {
        var uri = window.__adobe_cep__.getSystemPath('extension');
        return decodeURI(uri).replace(/^file:\/\/\//, '').replace(/\\/g, '/') + '/../jsx/acme-sting.jsx';
    }

    function runJob(job, done) {
        var script = 'var stingJob = ' + JSON.stringify(job) + '; $.evalFile("' + scriptPath() + '");';
        window.__adobe_cep__.evalScript(script, function (text) {
            if (text === 'EvalScript error.') {
                setStatus('After Effects could not run the script.');
                return;
            }
            done(JSON.parse(text));
        });
    }

    function fillForm(s) {
        document.getElementById('word').value = s.word;
        document.getElementById('tagline').value = s.tagline;
        document.getElementById('endCard').value = s.endCard;
        for (var key in s.colors) {
            if (s.colors.hasOwnProperty(key)) {
                document.getElementById('c-' + key).value = s.colors[key];
            }
        }
        var blocks = document.querySelectorAll('.fx');
        for (var i = 0; i < blocks.length; i++) {
            var name = blocks[i].getAttribute('data-fx');
            var fx = s.effects[name];
            blocks[i].querySelector('input[type="checkbox"]').checked = !!fx.on;
            var fields = blocks[i].querySelectorAll('[data-key]');
            for (var j = 0; j < fields.length; j++) {
                fields[j].value = fx[fields[j].getAttribute('data-key')];
            }
        }
    }

    function readForm() {
        var colors = {}, effects = {}, blocks = document.querySelectorAll('.fx');
        var inputs = document.querySelectorAll('input[id^="c-"]');
        for (var i = 0; i < inputs.length; i++) {
            colors[inputs[i].id.slice(2)] = inputs[i].value;
        }
        for (i = 0; i < blocks.length; i++) {
            var fx = { on: blocks[i].querySelector('input[type="checkbox"]').checked };
            var fields = blocks[i].querySelectorAll('[data-key]');
            for (var j = 0; j < fields.length; j++) {
                var key = fields[j].getAttribute('data-key');
                fx[key] = fields[j].tagName === 'SELECT' ? fields[j].value : parseFloat(fields[j].value);
            }
            effects[blocks[i].getAttribute('data-fx')] = fx;
        }
        return {
            word: document.getElementById('word').value,
            tagline: document.getElementById('tagline').value,
            endCard: document.getElementById('endCard').value,
            colors: colors,
            effects: effects
        };
    }

    function submit(render) {
        var buttons = document.querySelectorAll('button');
        for (var i = 0; i < buttons.length; i++) buttons[i].disabled = true;
        setStatus(render ? 'Building and rendering...' : 'Building...');
        var job = {
            preset: presetSelect.value,
            overrides: readForm(),
            render: render
        };
        runJob(job, function (result) {
            for (var k = 0; k < buttons.length; k++) buttons[k].disabled = false;
            if (!result.ok) {
                setStatus('Error: ' + result.error + (result.line ? ' (line ' + result.line + ')' : ''));
                return;
            }
            var lines = ['Built ' + result.composition.name + ' (' + result.preset + ').'];
            if (result.render) lines.push('Rendered: ' + result.render.file);
            if (result.skippedEffects && result.skippedEffects.length) {
                lines.push('Skipped (not installed): ' + result.skippedEffects.join(', '));
            }
            setStatus(lines.join('\n'));
        });
    }

    presetSelect.addEventListener('change', function () {
        var s = presets[presetSelect.value];
        if (s) fillForm(s);
    });
    document.getElementById('build').addEventListener('click', function () { submit(false); });
    document.getElementById('renderBtn').addEventListener('click', function () { submit(true); });

    runJob({ describe: true }, function (data) {
        presets = data.presets;
        fillForm(presets[presetSelect.value]);
        setStatus('Ready. Presets loaded from acme-sting.jsx.');
    });
})();
