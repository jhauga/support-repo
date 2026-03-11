/* demo.js — Smoke-and-mirror file comparison simulation */

(function () {
  'use strict';

  /* ── DOM refs ──────────────────────────────────── */
  var form      = document.getElementById('demoForm');
  var results   = document.getElementById('results');
  var body      = document.getElementById('resultsBody');

  var nameA     = document.getElementById('nameA');
  var sizeA     = document.getElementById('sizeA');
  var createdA  = document.getElementById('createdA');
  var modifiedA = document.getElementById('modifiedA');
  var badgeA    = document.getElementById('badgeA');
  var urlFieldA = document.getElementById('urlFieldA');

  var nameB     = document.getElementById('nameB');
  var sizeB     = document.getElementById('sizeB');
  var createdB  = document.getElementById('createdB');
  var modifiedB = document.getElementById('modifiedB');
  var badgeB    = document.getElementById('badgeB');
  var urlFieldB = document.getElementById('urlFieldB');

  var optSize     = document.getElementById('optSize');
  var optCreated  = document.getElementById('optCreated');
  var optModified = document.getElementById('optModified');
  var optAll      = document.getElementById('optAll');
  var optDiff     = document.getElementById('optDiffNames');

  /* ── Seed default dates ────────────────────────── */
  var now = new Date();
  var earlier = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  function toLocalISO(d) {
    var offset = d.getTimezoneOffset();
    var local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  createdA.value  = toLocalISO(earlier);
  modifiedA.value = toLocalISO(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
  createdB.value  = toLocalISO(new Date(earlier.getTime() + 3 * 24 * 60 * 60 * 1000));
  modifiedB.value = toLocalISO(now);

  /* ── Source toggle (local/remote) ──────────────── */
  function setupSourceToggle(name, badge, urlField) {
    document.querySelectorAll('input[name="' + name + '"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var isRemote = radio.value === 'remote';
        badge.textContent = isRemote ? 'Remote' : 'Local';
        badge.className = 'source-badge ' + (isRemote ? 'remote' : 'local');
        urlField.classList.toggle('visible', isRemote);
      });
    });
  }

  setupSourceToggle('sourceA', badgeA, urlFieldA);
  setupSourceToggle('sourceB', badgeB, urlFieldB);

  /* ── "All" checkbox syncs individual checkboxes ── */
  optAll.addEventListener('change', function () {
    optSize.checked = optAll.checked;
    optCreated.checked = optAll.checked;
    optModified.checked = optAll.checked;
  });

  [optSize, optCreated, optModified].forEach(function (cb) {
    cb.addEventListener('change', function () {
      optAll.checked = optSize.checked && optCreated.checked && optModified.checked;
    });
  });

  /* ── Helpers ───────────────────────────────────── */
  function basename(path) {
    return path.replace(/\\/g, '/').split('/').pop();
  }

  function formatBytes(b) {
    if (b === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(b) / Math.log(1024));
    return (b / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  function winner(a, b) {
    if (a < b) return 'file1';
    if (a > b) return 'file2';
    return 'equal';
  }

  /* ── Compare logic ─────────────────────────────── */
  function runComparison() {
    var fnA = basename(nameA.value.trim());
    var fnB = basename(nameB.value.trim());

    // Same-name check
    if (fnA !== fnB && !optDiff.checked) {
      return {
        error: 'Files have different names. Use --different-names to compare anyway.'
      };
    }

    var result = {
      file1: nameA.value.trim(),
      file2: nameB.value.trim(),
      sameName: fnA === fnB
    };

    if (optSize.checked) {
      var sA = parseInt(sizeA.value, 10) || 0;
      var sB = parseInt(sizeB.value, 10) || 0;
      result.size = {
        file1: sA,
        file2: sB,
        diff: Math.abs(sA - sB),
        larger: winner(sB, sA) // larger = higher value wins
      };
      // Fix direction: larger means bigger number
      if (sA > sB) result.size.larger = 'file1';
      else if (sB > sA) result.size.larger = 'file2';
      else result.size.larger = 'equal';
    }

    if (optCreated.checked) {
      var cA = new Date(createdA.value).getTime();
      var cB = new Date(createdB.value).getTime();
      result.created = {
        file1: createdA.value,
        file2: createdB.value,
        newer: cA > cB ? 'file1' : cB > cA ? 'file2' : 'equal'
      };
    }

    if (optModified.checked) {
      var mA = new Date(modifiedA.value).getTime();
      var mB = new Date(modifiedB.value).getTime();
      result.modified = {
        file1: modifiedA.value,
        file2: modifiedB.value,
        newer: mA > mB ? 'file1' : mB > mA ? 'file2' : 'equal'
      };
    }

    return result;
  }

  /* ── Render — human readable ───────────────────── */
  function renderHuman(data) {
    if (data.error) {
      return '<p class="error">' + escapeHtml(data.error) + '</p>';
    }

    var html = '';

    html += row('Files', escapeHtml(data.file1) + '  vs  ' + escapeHtml(data.file2), '');
    html += row('Same Name', data.sameName ? 'Yes' : 'No (--different-names)', data.sameName ? 'tie' : 'lose');

    if (data.size) {
      var sLabel = formatBytes(data.size.file1) + '  vs  ' + formatBytes(data.size.file2) +
                   '  (diff: ' + formatBytes(data.size.diff) + ')';
      html += row('Size', sLabel, data.size.larger === 'equal' ? 'tie' : '');
      if (data.size.larger !== 'equal') {
        html += row('Larger', data.size.larger === 'file1' ? 'File A' : 'File B', 'win');
      }
    }

    if (data.created) {
      html += row('Created A', data.created.file1, '');
      html += row('Created B', data.created.file2, '');
      var cWin = data.created.newer;
      html += row('Newer (created)', cWin === 'equal' ? 'Same' : cWin === 'file1' ? 'File A' : 'File B',
        cWin === 'equal' ? 'tie' : 'win');
    }

    if (data.modified) {
      html += row('Modified A', data.modified.file1, '');
      html += row('Modified B', data.modified.file2, '');
      var mWin = data.modified.newer;
      html += row('Newer (modified)', mWin === 'equal' ? 'Same' : mWin === 'file1' ? 'File A' : 'File B',
        mWin === 'equal' ? 'tie' : 'win');
    }

    html += '<div class="verdict">' + buildVerdict(data) + '</div>';
    return html;
  }

  function row(label, value, cls) {
    return '<div class="result-row">' +
      '<span class="label">' + escapeHtml(label) + '</span>' +
      '<span class="value ' + cls + '">' + value + '</span>' +
      '</div>';
  }

  function buildVerdict(data) {
    var wins = { file1: 0, file2: 0, equal: 0 };
    if (data.size) wins[data.size.larger]++;
    if (data.created) wins[data.created.newer]++;
    if (data.modified) wins[data.modified.newer]++;

    if (wins.file1 > wins.file2) return 'Verdict: File A leads in ' + wins.file1 + ' of ' + (wins.file1 + wins.file2 + wins.equal) + ' comparisons.';
    if (wins.file2 > wins.file1) return 'Verdict: File B leads in ' + wins.file2 + ' of ' + (wins.file1 + wins.file2 + wins.equal) + ' comparisons.';
    return 'Verdict: Files are evenly matched across all comparisons.';
  }

  /* ── Render — JSON ─────────────────────────────── */
  function renderJSON(data) {
    return '<div class="result-json">' + escapeHtml(JSON.stringify(data, null, 2)) + '</div>';
  }

  /* ── Escape HTML ───────────────────────────────── */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ── Show results ──────────────────────────────── */
  function showResults(data) {
    var fmt = document.querySelector('input[name="outputFmt"]:checked').value;
    body.innerHTML = fmt === 'json' ? renderJSON(data) : renderHuman(data);
    results.classList.add('visible');
  }

  /* ── Form submit ───────────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = runComparison();
    showResults(data);
  });

  /* ── Simulate file update ──────────────────────── */
  function simulateUpdate(sizeInput, modifiedInput) {
    var current = parseInt(sizeInput.value, 10) || 0;
    var delta = Math.floor(Math.random() * 2048) - 512; // random change ±
    sizeInput.value = Math.max(0, current + delta);
    modifiedInput.value = toLocalISO(new Date());
  }

  document.getElementById('updateA').addEventListener('click', function () {
    simulateUpdate(sizeA, modifiedA);
  });

  document.getElementById('updateB').addEventListener('click', function () {
    simulateUpdate(sizeB, modifiedB);
  });

  /* ── Reset ─────────────────────────────────────── */
  document.getElementById('resetBtn').addEventListener('click', function () {
    form.reset();
    nameA.value = 'report.csv';
    nameB.value = 'report.csv';
    sizeA.value = '2048';
    sizeB.value = '3072';
    createdA.value  = toLocalISO(earlier);
    modifiedA.value = toLocalISO(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
    createdB.value  = toLocalISO(new Date(earlier.getTime() + 3 * 24 * 60 * 60 * 1000));
    modifiedB.value = toLocalISO(now);

    badgeA.textContent = 'Local';
    badgeA.className = 'source-badge local';
    badgeB.textContent = 'Local';
    badgeB.className = 'source-badge local';
    urlFieldA.classList.remove('visible');
    urlFieldB.classList.remove('visible');

    results.classList.remove('visible');
    body.innerHTML = '';
  });

})();
