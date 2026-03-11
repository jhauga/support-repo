/* docs.js — Tab switching, copy-to-clipboard, smooth scroll */

(function () {
  'use strict';

  /* ── Tab switching ─────────────────────────────── */
  document.querySelectorAll('.tabs').forEach(function (tabsEl) {
    var buttons = tabsEl.querySelectorAll('.tab-bar button');
    var panels  = tabsEl.querySelectorAll('.tab-panel');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');

        buttons.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });

        btn.classList.add('active');
        tabsEl.querySelector('.tab-panel[data-tab="' + target + '"]').classList.add('active');
      });
    });
  });

  /* ── Copy to clipboard ─────────────────────────── */
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var codeEl = btn.closest('pre').querySelector('code');
      var text = codeEl.textContent;

      navigator.clipboard.writeText(text).then(function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 1500);
      });
    });
  });

  /* ── Smooth scroll for anchor links ────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
