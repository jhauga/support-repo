(function () {
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();
  var scriptSrc = currentScript.getAttribute("src") || "";
  var basePath = scriptSrc.replace("script.js", "");

  // Create toggle controls container
  var container = document.createElement("div");
  container.id = "toggle-controls";

  // 1. CSS Toggle Button — swaps new-curl.css <-> old-curl.css
  var cssBtn = document.createElement("button");
  cssBtn.id = "css-toggle";
  cssBtn.className = "toggle-btn css-toggle-btn";
  cssBtn.textContent = "Toggle to Old CSS";
  cssBtn.addEventListener("click", function () {
    var link = document.querySelector('link[href*="curl.css"]');
    if (!link) return;
    var href = link.getAttribute("href");
    if (href.indexOf("new-curl.css") !== -1) {
      link.setAttribute("href", href.replace("new-curl.css", "old-curl.css"));
      cssBtn.textContent = "Toggle to New CSS";
    } else {
      link.setAttribute("href", href.replace("old-curl.css", "new-curl.css"));
      cssBtn.textContent = "Toggle to Old CSS";
    }
    // Re-hijack dark rules from the newly loaded stylesheet
    if (isDark) {
      disableDarkMode();
      setTimeout(function () {
        extractedDarkRules = hijackDarkRules();
        enableDarkMode();
      }, 150);
    } else {
      setTimeout(function () {
        extractedDarkRules = hijackDarkRules();
      }, 150);
    }
  });

  // 2. Dark Mode Toggle Button
  // Takes full control of dark mode by:
  //  a) Disabling all @media (prefers-color-scheme: dark) rules in stylesheets
  //     (changes their media query to "not all" so they never match natively)
  //  b) Extracting those rules and injecting them as regular CSS when dark is on
  //  c) Setting color-scheme on <html> so browser UI also switches
  // This works regardless of whether the browser/OS is in light or dark mode.
  var darkSheet = null;
  var isDark = false;
  var browserPrefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Scans all stylesheets, extracts inner rules from dark media queries,
  // and neuters those media queries so the browser can't activate them.
  function hijackDarkRules() {
    var rules = [];
    var sheets = document.styleSheets;
    for (var s = 0; s < sheets.length; s++) {
      try {
        var cssRules = sheets[s].cssRules || sheets[s].rules;
      } catch (e) {
        continue; // skip cross-origin sheets
      }
      if (!cssRules) continue;
      for (var r = 0; r < cssRules.length; r++) {
        var rule = cssRules[r];
        if (rule.type === CSSRule.MEDIA_RULE &&
            rule.media.mediaText.indexOf("prefers-color-scheme: dark") !== -1) {
          // Extract inner rules before disabling
          for (var inner = 0; inner < rule.cssRules.length; inner++) {
            rules.push(rule.cssRules[inner].cssText);
          }
          // Neuter the media query so it never matches natively
          rule.media.mediaText = "not all";
        }
      }
    }
    return rules;
  }

  // Run immediately — take control away from native dark media queries
  var extractedDarkRules = hijackDarkRules();

  function enableDarkMode() {
    // Re-extract in case stylesheet changed (CSS toggle)
    if (extractedDarkRules.length === 0) {
      extractedDarkRules = hijackDarkRules();
    }
    if (extractedDarkRules.length > 0 && !darkSheet) {
      darkSheet = document.createElement("style");
      darkSheet.id = "injected-dark-mode";
      darkSheet.textContent = extractedDarkRules.join("\n");
      document.head.appendChild(darkSheet);
    }
    document.documentElement.style.colorScheme = "dark";
    isDark = true;
    darkBtn.textContent = "Toggle Light Mode";
  }

  function disableDarkMode() {
    if (darkSheet && darkSheet.parentNode) {
      darkSheet.parentNode.removeChild(darkSheet);
      darkSheet = null;
    }
    document.documentElement.style.colorScheme = "light";
    isDark = false;
    darkBtn.textContent = "Toggle Dark Mode";
  }

  var darkBtn = document.createElement("button");
  darkBtn.id = "dark-toggle";
  darkBtn.className = "toggle-btn dark-toggle-btn";

  // If browser is in dark mode, immediately re-apply dark via our controlled path
  if (browserPrefersDark) {
    isDark = true;
    darkBtn.textContent = "Toggle Light Mode";
    // Inject extracted dark rules right away so there's no flash
    if (extractedDarkRules.length > 0) {
      darkSheet = document.createElement("style");
      darkSheet.id = "injected-dark-mode";
      darkSheet.textContent = extractedDarkRules.join("\n");
      document.head.appendChild(darkSheet);
    }
    document.documentElement.style.colorScheme = "dark";
  } else {
    darkBtn.textContent = "Toggle Dark Mode";
    document.documentElement.style.colorScheme = "light";
  }

  darkBtn.addEventListener("click", function () {
    if (isDark) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  });

  // 3. Back to Launch Page link
  var backLink = document.createElement("a");
  backLink.id = "back-to-launch";
  backLink.className = "toggle-btn back-btn";
  backLink.href = basePath + "index.html";
  backLink.textContent = "Back to Launch Page";

  container.appendChild(cssBtn);
  container.appendChild(darkBtn);
  container.appendChild(backLink);

  // 4. Page navigation list (mirrors the launch page)
  var nav = document.createElement("div");
  nav.id = "toggle-nav";

  var pages = {
    "curl Command-line Tool": [
      "home.html",
      "dev/code-style.html",
      "dev/contribute.html",
      "dev/release-procedure.html",
      "dev/runtests.html",
      "dev/source.html",
      "dev/testcurl.html",
      "dev/test-fileformat.html",
      "dev/tests-overview.html",
      "docs/install.html",
      "docs/tutorial.html",
      "docs/manpage.html",
      "docs/faq.html",
      "docs/todo.html",
      "docs/knownbugs.html",
      "docs/websocket.html",
      "docs/url-syntax.html"
    ],
    "libcurl Pages": [
      "libcurl/libcurl-tutorial.html",
      "libcurl/10-at-a-time.html",
      "libcurl/curl_easy_perform.html"
    ]
  };

  var sections = Object.keys(pages);
  for (var s = 0; s < sections.length; s++) {
    var heading = document.createElement("div");
    heading.className = "toggle-nav-heading";
    heading.textContent = sections[s];
    nav.appendChild(heading);

    var list = pages[sections[s]];
    for (var p = 0; p < list.length; p++) {
      var link = document.createElement("a");
      link.className = "toggle-nav-link";
      link.href = basePath + list[p];
      link.textContent = "\u2192 " + list[p];
      nav.appendChild(link);
    }
  }

  container.appendChild(nav);
  document.body.appendChild(container);

  // Disable all links except toggle controls (this is a CSS demo, not a functional site)
  var allLinks = document.querySelectorAll("a[href]");
  for (var i = 0; i < allLinks.length; i++) {
    if (allLinks[i].id !== "back-to-launch" &&
        !allLinks[i].classList.contains("toggle-nav-link")) {
      allLinks[i].addEventListener("click", function (e) {
        e.preventDefault();
      });
      allLinks[i].removeAttribute("href");
    }
  }
})();
