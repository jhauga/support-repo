// Browser checks for the catalog page size menu (add-page-size-control plan, phase 4).
//
// Usage, after `npm run --prefix website build`:
//   node .support/page-size-harness/verify.mjs
// It serves website/dist itself, because `astro preview` backgrounds itself in agent
// sessions. Set PAGE_SIZE_BASE_URL to test a server that is already running instead.
// Exits 0 only when every check passes. Screenshots land next to this file.
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..");
const websiteDir = path.join(repoRoot, "website");
const distDir = path.join(websiteDir, "dist");
const require = createRequire(path.join(websiteDir, "package.json"));
const { chromium } = require("playwright");

const CATALOGS = [
  { route: "/agents/", type: "Agents", segment: "agent", data: "agents" },
  { route: "/extensions/", type: "Extensions", segment: "extension", data: "extensions" },
  { route: "/instructions/", type: "Instructions", segment: "instruction", data: "instructions" },
  { route: "/plugins/", type: "Plugins", segment: "plugin", data: "plugins" },
  { route: "/skills/", type: "Skills", segment: "skill", data: "skills" },
  // The Learning Hub groups its menus inside the "Articles" header instead of a
  // toolbar. Its articles are not in public/data, so the total comes from the page.
  // Header numbers were measured on the build before this change.
  {
    route: "/learning-hub/",
    type: "Articles",
    segment: "learning-hub",
    data: null,
    sortOption: "Oldest",
    header: { height: 119, right: 1172 },
  },
];
const SIZES = ["6", "20", "50", "100"];
const DESKTOP = { width: 1349, height: 887 };
const PHONE = { width: 390, height: 844 };
const DIVIDER_COLOR = { dark: "rgb(164, 174, 166)", light: "rgb(88, 99, 91)" };

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".wasm": "application/wasm",
};

const results = [];

function check(label, ok, detail = "") {
  results.push({ label, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

const near = (value, low, high) => typeof value === "number" && value >= low && value <= high;

async function waitFor(read, predicate, timeout = 5000) {
  const start = Date.now();
  let value = await read();
  while (!predicate(value) && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    value = await read();
  }
  return value;
}

function serveDist() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://localhost");
      let file = path.join(distDir, decodeURIComponent(url.pathname));
      if (!file.startsWith(distDir)) {
        res.writeHead(403).end();
        return;
      }
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        file = path.join(file, "index.html");
      }
      fs.readFile(file, (error, body) => {
        if (error) {
          res.writeHead(404).end("Not found");
          return;
        }
        const type = CONTENT_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
        res.writeHead(200, { "content-type": type }).end(body);
      });
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function totalOf(browser, baseUrl, catalog) {
  if (catalog.data) {
    const file = path.join(websiteDir, "public", "data", `${catalog.data}.json`);
    return JSON.parse(fs.readFileSync(file, "utf8")).items.length;
  }
  // No data file: show 100 per page and count, which needs everything on one page.
  const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await openCatalog(page, baseUrl, catalog.route, "dark");
    const state = await chooseSize(page, catalog, "100");
    if (state.maxPage !== 1) throw new Error(`${catalog.type}: more than 100 items, add a data source`);
    return state.cards;
  } finally {
    await context.close();
  }
}

async function openCatalog(page, baseUrl, route, colorScheme) {
  await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
  const response = await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "load",
    timeout: 45_000,
  });
  if (!response?.ok()) throw new Error(`${route} returned HTTP ${response?.status()}`);
  await page.waitForFunction(
    (theme) => document.documentElement.getAttribute("data-color-mode") === theme,
    colorScheme,
  );
  // The catalog is a client:load island; Astro drops its ssr attribute once hydrated.
  await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"), null, {
    timeout: 15_000,
  });
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation:none!important;}",
  });
}

function readState(page, catalog) {
  return page.evaluate(({ type, segment }) => {
    const trigger = document.querySelector(`summary[aria-label$="(${type} per page)"]`);
    if (!trigger) return null;
    const details = trigger.closest("details");
    const control = details.parentElement;
    const divider = control.previousElementSibling;
    const sort = divider?.previousElementSibling ?? null;
    const toolbar = control.parentElement;
    const options = [...details.querySelectorAll('[role="menuitemradio"]')];
    const overlay = details.querySelector('[role="menu"]');

    const cards = new Set();
    for (const link of document.querySelectorAll("#catalog a[href]")) {
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname.includes(`/${segment}/`)) {
        cards.add(url.pathname);
      }
    }

    const pager = document.querySelector('[aria-label="Pagination"]');
    const pages = pager
      ? [...pager.querySelectorAll('[aria-label^="Page "]')]
          .map((el) => Number.parseInt(el.getAttribute("aria-label").slice(5), 10))
          .filter(Number.isFinite)
      : [];

    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const dividerStyle = divider ? getComputedStyle(divider) : null;

    return {
      triggerText: trigger.textContent.trim(),
      triggerName: trigger.getAttribute("aria-label"),
      open: details.open,
      optionTexts: options.map((option) => option.textContent.trim()),
      checked: options
        .filter((option) => option.getAttribute("aria-checked") === "true")
        .map((option) => option.textContent.trim()),
      cards: cards.size,
      maxPage: pages.length ? Math.max(...pages) : 0,
      // Primer labels a page next to a break "Page N...", so keep only the number.
      currentPage:
        Number.parseInt(
          pager?.querySelector('[aria-current="page"]')?.getAttribute("aria-label")?.slice(5) ?? "",
          10,
        ) || null,
      toolbar: rect(toolbar),
      toolbarDisplay: getComputedStyle(toolbar).display,
      header: rect(toolbar.parentElement),
      filterToggleDisplay: (() => {
        const toggle = [...document.querySelectorAll("#catalog button")].find((button) =>
          button.textContent.trim().startsWith("Filters"),
        );
        return toggle ? getComputedStyle(toggle).display : null;
      })(),
      sort: rect(sort),
      control: rect(control),
      overlay: details.open ? rect(overlay) : null,
      divider: rect(divider),
      dividerTag: divider?.tagName ?? null,
      dividerHidden: divider?.getAttribute("aria-hidden") ?? null,
      dividerDisplay: dividerStyle?.display ?? null,
      dividerColor: dividerStyle?.backgroundColor ?? null,
    };
  }, { type: catalog.type, segment: catalog.segment });
}

const sizeTrigger = (page, catalog) =>
  page.locator(`summary[aria-label$="(${catalog.type} per page)"]`);

// The trigger's accessible name, e.g. "Resource page size: 6 (Skills per page)".
const triggerName = (catalog, size) => `Resource page size: ${size} (${catalog.type} per page)`;

async function chooseSize(page, catalog, size) {
  const trigger = sizeTrigger(page, catalog);
  await trigger.click();
  await page
    .locator("details")
    .filter({ has: trigger })
    .locator('[role="menuitemradio"]')
    .filter({ hasText: new RegExp(`^${size}$`) })
    .click();
  return waitFor(() => readState(page, catalog), (state) => state?.triggerText === size);
}

async function chooseSort(page, catalog, label) {
  // The Learning Hub's sort trigger has no aria-label, so find its menu by option.
  const menu = catalog.sortOption
    ? page.locator("details").filter({
        has: page.locator('[role="menuitemradio"]', { hasText: catalog.sortOption }),
      })
    : page.locator("details").filter({
        has: page.locator(`summary[aria-label="Sort ${catalog.type.toLowerCase()}"]`),
      });
  await menu.locator("summary").click();
  await menu.locator('[role="menuitemradio"]').filter({ hasText: label }).click();
}

async function goToPage(page, number) {
  await page
    .locator(
      `[aria-label="Pagination"] [aria-label="Page ${number}"], [aria-label="Pagination"] [aria-label="Page ${number}..."]`,
    )
    .first()
    .click();
}

async function checkCatalog(browser, baseUrl, catalog) {
  const name = catalog.type;
  let total;
  try {
    total = await totalOf(browser, baseUrl, catalog);
  } catch (error) {
    check(`${name}: item total found`, false, error.message.split("\n")[0]);
    return;
  }
  const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await openCatalog(page, baseUrl, catalog.route, "dark");
    const start = await readState(page, catalog);
    if (!start) {
      check(`${name}: page size trigger exists`, false);
      return;
    }

    check(`${name}: trigger reads 6 on load`, start.triggerText === "6", start.triggerText);
    check(
      `${name}: trigger is named "${triggerName(catalog, 6)}"`,
      start.triggerName === triggerName(catalog, 6),
      start.triggerName,
    );
    check(
      `${name}: options read 6, 20, 50, 100`,
      start.optionTexts.join(",") === SIZES.join(","),
      start.optionTexts.join(","),
    );
    check(`${name}: only 6 is checked`, start.checked.join(",") === "6", start.checked.join(","));
    check(
      `${name}: shows min(6, ${total}) cards`,
      start.cards === Math.min(6, total),
      `${start.cards}`,
    );
    check(
      `${name}: highest page at 6 is ceil(${total} / 6)`,
      start.maxPage === Math.ceil(total / 6),
      `${start.maxPage}`,
    );

    const gapBefore = start.divider && start.sort ? start.divider.left - start.sort.right : null;
    const gapAfter = start.divider ? start.control.left - start.divider.right : null;
    if (catalog.header) {
      check(
        `${name}: header keeps its ${catalog.header.height}px height`,
        near(start.header.height, catalog.header.height - 0.5, catalog.header.height + 0.5),
        `${start.header.height}`,
      );
      check(
        `${name}: menus stay right-aligned where Sort by ended (x ${catalog.header.right})`,
        near(start.control.right, catalog.header.right - 1, catalog.header.right + 1),
        `${start.control.right}`,
      );
    } else {
      check(`${name}: toolbar is 90px tall`, near(start.toolbar.height, 89.5, 90.5), `${start.toolbar.height}`);
    }
    check(
      `${name}: rule is a visible, aria-hidden div`,
      start.dividerTag === "DIV" && start.dividerHidden === "true" && start.dividerDisplay !== "none",
      `${start.dividerTag} aria-hidden=${start.dividerHidden} display=${start.dividerDisplay}`,
    );
    check(
      `${name}: rule is 1px by 48px to 52px`,
      near(start.divider?.width, 0.5, 1.5) && near(start.divider?.height, 48, 52),
      `${start.divider?.width}x${start.divider?.height}`,
    );
    check(
      `${name}: 26px to 30px between the rule and each menu`,
      near(gapBefore, 26, 30) && near(gapAfter, 26, 30),
      `${gapBefore} / ${gapAfter}`,
    );
    check(
      `${name}: rule color is text-muted in dark mode`,
      start.dividerColor === DIVIDER_COLOR.dark,
      start.dividerColor,
    );

    const at20 = await chooseSize(page, catalog, "20");
    check(`${name}: choosing 20 closes the menu`, at20.open === false);
    check(`${name}: trigger reads 20`, at20.triggerText === "20", at20.triggerText);
    check(
      `${name}: name updates to "${triggerName(catalog, 20)}"`,
      at20.triggerName === triggerName(catalog, 20),
      at20.triggerName,
    );
    check(`${name}: only 20 is checked`, at20.checked.join(",") === "20", at20.checked.join(","));
    check(`${name}: shows min(20, ${total}) cards`, at20.cards === Math.min(20, total), `${at20.cards}`);
    check(
      `${name}: highest page at 20 is ceil(${total} / 20)`,
      at20.maxPage === Math.ceil(total / 20),
      `${at20.maxPage}`,
    );

    if (at20.maxPage >= 2) {
      await goToPage(page, 2);
      const onPage2 = await waitFor(() => readState(page, catalog), (state) => state.currentPage === 2);
      check(`${name}: page 2 opens at size 20`, onPage2.currentPage === 2, `page ${onPage2.currentPage}`);
    } else {
      check(`${name}: page 2 exists at size 20`, false, `only ${at20.maxPage} page(s)`);
    }

    const at50 = await chooseSize(page, catalog, "50");
    const settled50 = await waitFor(() => readState(page, catalog), (state) => state.currentPage === 1);
    check(
      `${name}: choosing 50 returns to page 1`,
      settled50.currentPage === 1,
      `page ${settled50.currentPage}`,
    );
    check(`${name}: shows min(50, ${total}) cards`, settled50.cards === Math.min(50, total), `${at50.cards}`);

    const at100 = await chooseSize(page, catalog, "100");
    check(`${name}: shows min(100, ${total}) cards`, at100.cards === Math.min(100, total), `${at100.cards}`);

    const sortLabel = catalog.sortOption ?? "Recently updated";
    await chooseSort(page, catalog, sortLabel);
    const sorted = await readState(page, catalog);
    check(
      `${name}: ${sortLabel} keeps size 100`,
      sorted.triggerText === "100" && sorted.cards === Math.min(100, total),
      `${sorted.triggerText}, ${sorted.cards} cards`,
    );

    // Skip the "(none)" model option: on main it matches no agents (see the phase 4 report).
    const filterLabel = page.locator("aside label").filter({ hasNotText: "(none)" }).first();
    const filterText = (await filterLabel.textContent())?.trim();
    await filterLabel.click();
    const ticked = await waitFor(
      () => page.locator('aside input[type="checkbox"]:checked').count(),
      (count) => count === 1,
    );
    await page.waitForTimeout(300);
    const filtered = await readState(page, catalog);
    check(
      `${name}: a filter keeps size 100 and at most 100 cards`,
      ticked === 1 && filtered.triggerText === "100" && near(filtered.cards, 1, 100),
      `"${filterText}": ${filtered.triggerText}, ${filtered.cards} cards, page ${filtered.currentPage}`,
    );
  } catch (error) {
    check(`${name}: flow finished without errors`, false, error.message.split("\n")[0]);
  } finally {
    await context.close();
  }
}

// The size menu's menu button keyboard pattern: open on Enter or an arrow key with
// focus on the selected size, arrows/Home/End move and wrap, Enter picks, Escape
// closes back to the trigger, and Tab or a click outside closes it.
async function checkKeyboard(browser, baseUrl) {
  const skills = CATALOGS.find((catalog) => catalog.type === "Skills");
  const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const focused = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      return {
        role: el?.getAttribute("role") ?? null,
        text: el?.textContent.trim() ?? "",
        tag: el?.tagName ?? null,
        name: el?.getAttribute("aria-label") ?? null,
      };
    });
  const press = async (key) => {
    await page.keyboard.press(key);
    return focused();
  };
  const isOpen = async () => (await readState(page, skills)).open;
  try {
    await openCatalog(page, baseUrl, skills.route, "dark");
    const trigger = sizeTrigger(page, skills);
    check(
      "Skills keyboard: trigger has aria-haspopup=menu",
      (await trigger.getAttribute("aria-haspopup")) === "menu",
    );
    const menuName = await page
      .locator("details")
      .filter({ has: trigger })
      .locator('[role="menu"]')
      .getAttribute("aria-label");
    check("Skills keyboard: menu is named \"Skills per page\"", menuName === "Skills per page", menuName);

    await trigger.focus();
    await page.keyboard.press("Enter");
    let at = await waitFor(focused, (el) => el.role === "menuitemradio");
    check(
      "Skills keyboard: Enter opens the menu on the selected size",
      (await isOpen()) && at.text === "6",
      `${at.role} "${at.text}"`,
    );
    at = await press("ArrowDown");
    check("Skills keyboard: ArrowDown moves to 20", at.text === "20", at.text);
    at = await press("End");
    check("Skills keyboard: End moves to 100", at.text === "100", at.text);
    at = await press("ArrowDown");
    check("Skills keyboard: ArrowDown wraps to 6", at.text === "6", at.text);
    at = await press("ArrowUp");
    check("Skills keyboard: ArrowUp wraps to 100", at.text === "100", at.text);
    at = await press("Home");
    check("Skills keyboard: Home moves to 6", at.text === "6", at.text);

    at = await press("Escape");
    check(
      "Skills keyboard: Escape closes the menu and focuses the trigger",
      !(await isOpen()) && at.tag === "SUMMARY" && at.name === triggerName(skills, 6),
      `open=${await isOpen()}, focus ${at.tag}`,
    );

    await page.keyboard.press("ArrowDown");
    at = await waitFor(focused, (el) => el.role === "menuitemradio");
    check(
      "Skills keyboard: ArrowDown on the closed trigger opens on the selected size",
      (await isOpen()) && at.text === "6",
      `${at.role} "${at.text}"`,
    );
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    const picked = await waitFor(() => readState(page, skills), (state) => state.triggerText === "20");
    at = await focused();
    check(
      "Skills keyboard: Enter picks 20, closes, and focuses the trigger",
      picked.triggerText === "20" && !picked.open && at.tag === "SUMMARY",
      `${picked.triggerText}, open=${picked.open}, focus ${at.tag}`,
    );

    await page.keyboard.press("ArrowDown");
    await waitFor(focused, (el) => el.role === "menuitemradio");
    at = await press("Tab");
    check(
      "Skills keyboard: Tab closes the menu and moves on",
      !(await isOpen()) && at.role !== "menuitemradio",
      `open=${await isOpen()}, focus ${at.tag} ${at.role ?? ""}`.trim(),
    );

    await trigger.click();
    await waitFor(isOpen, (open) => open);
    // The static label beside the menu is outside the <details> and is not a link.
    await page.getByText("Resource page size:", { exact: true }).click();
    const closed = await waitFor(isOpen, (open) => !open);
    check("Skills keyboard: a click outside closes the menu", closed === false);
  } catch (error) {
    check("Skills keyboard: flow finished without errors", false, error.message.split("\n")[0]);
  } finally {
    await context.close();
  }
}

async function screenshots(browser, baseUrl) {
  const skills = CATALOGS.find((catalog) => catalog.type === "Skills");

  for (const theme of ["dark", "light"]) {
    const suffix = theme === "dark" ? "" : "-light";
    const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const page = await context.newPage();
    try {
      await openCatalog(page, baseUrl, skills.route, theme);
      const state = await readState(page, skills);
      check(
        `Skills: rule color is text-muted in ${theme} mode`,
        state.dividerColor === DIVIDER_COLOR[theme],
        state.dividerColor,
      );
      await page.screenshot({ path: path.join(here, `shot-skills-idle${suffix}.png`) });
      await sizeTrigger(page, skills).click();
      await page.waitForTimeout(300);
      const open = await readState(page, skills);
      check(
        `Skills: size menu opens right-aligned under its trigger (${theme})`,
        open.open && open.overlay !== null && Math.abs(open.overlay.right - open.control.right) <= 1,
        open.overlay ? `overlay right ${open.overlay.right}, control right ${open.control.right}` : "no overlay",
      );
      await page.screenshot({ path: path.join(here, `shot-skills-menu${suffix}.png`) });
    } catch (error) {
      check(`Skills: ${theme} screenshots taken`, false, error.message.split("\n")[0]);
    } finally {
      await context.close();
    }
  }

  const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await openCatalog(page, baseUrl, skills.route, "dark");
    await sizeTrigger(page, skills).scrollIntoViewIfNeeded();
    const phone = await readState(page, skills);
    check("Skills phone: rule is display none", phone.dividerDisplay === "none", phone.dividerDisplay);
    check(
      "Skills phone: both menus fit the viewport width",
      phone.sort.left >= 0 && phone.control.right <= PHONE.width,
      `sort left ${phone.sort.left}, size right ${phone.control.right}`,
    );
    await page.screenshot({ path: path.join(here, "shot-skills-phone.png") });
    await sizeTrigger(page, skills).click();
    await page.waitForTimeout(300);
    const open = await readState(page, skills);
    check(
      "Skills phone: open size menu stays on screen",
      open.overlay !== null && open.overlay.left >= 0 && open.overlay.right <= PHONE.width,
      open.overlay ? `${open.overlay.left} to ${open.overlay.right}` : "no overlay",
    );
    await page.screenshot({ path: path.join(here, "shot-skills-phone-menu.png") });
    // The menu is still open from the screenshot, so pick the option directly.
    await page
      .locator("details")
      .filter({ has: sizeTrigger(page, skills) })
      .locator('[role="menuitemradio"]')
      .filter({ hasText: /^20$/ })
      .click();
    const at20 = await waitFor(() => readState(page, skills), (state) => state.triggerText === "20");
    check("Skills phone: choosing 20 shows 20 cards", at20.cards === 20, `${at20.cards}`);
  } catch (error) {
    check("Skills phone: flow finished without errors", false, error.message.split("\n")[0]);
  } finally {
    await context.close();
  }

  const hub = CATALOGS.find((catalog) => catalog.type === "Articles");
  const hubDesktop = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
  const hubPage = await hubDesktop.newPage();
  try {
    await openCatalog(hubPage, baseUrl, hub.route, "dark");
    await sizeTrigger(hubPage, hub).scrollIntoViewIfNeeded();
    await hubPage.evaluate(() => window.scrollBy(0, -120));
    await hubPage.screenshot({ path: path.join(here, "shot-learning-hub-idle.png") });
    await sizeTrigger(hubPage, hub).click();
    await hubPage.waitForTimeout(300);
    const open = await readState(hubPage, hub);
    check(
      "Articles: size menu opens right-aligned under its trigger",
      open.open && open.overlay !== null && Math.abs(open.overlay.right - open.control.right) <= 1,
      open.overlay ? `overlay right ${open.overlay.right}, control right ${open.control.right}` : "no overlay",
    );
    await hubPage.screenshot({ path: path.join(here, "shot-learning-hub-menu.png") });
  } catch (error) {
    check("Articles: desktop screenshots taken", false, error.message.split("\n")[0]);
  } finally {
    await hubDesktop.close();
  }

  // On phones the Learning Hub swaps its menus for the Filters button, as it did for Sort by.
  const hubPhone = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 1 });
  const hubPhonePage = await hubPhone.newPage();
  try {
    await openCatalog(hubPhonePage, baseUrl, hub.route, "dark");
    const phone = await readState(hubPhonePage, hub);
    check(
      "Articles phone: menus are hidden and the Filters button shows",
      phone.toolbarDisplay === "none" && phone.filterToggleDisplay !== "none" && phone.filterToggleDisplay !== null,
      `menus ${phone.toolbarDisplay}, Filters ${phone.filterToggleDisplay}`,
    );
    check("Articles phone: shows 6 cards", phone.cards === 6, `${phone.cards}`);
    await hubPhonePage
      .locator("#catalog button", { hasText: "Filters" })
      .scrollIntoViewIfNeeded();
    await hubPhonePage.screenshot({ path: path.join(here, "shot-learning-hub-phone.png") });
  } catch (error) {
    check("Articles phone: flow finished without errors", false, error.message.split("\n")[0]);
  } finally {
    await hubPhone.close();
  }
}

async function main() {
  let server;
  let baseUrl = process.env.PAGE_SIZE_BASE_URL?.trim();
  if (!baseUrl) {
    if (!fs.existsSync(path.join(distDir, "index.html"))) {
      throw new Error("website/dist is missing; run `npm run --prefix website build` first.");
    }
    server = await serveDist();
    baseUrl = `http://127.0.0.1:${server.address().port}/`;
  }
  console.log(`Testing ${baseUrl}`);

  const browser = await chromium.launch({ channel: "msedge" });
  try {
    for (const catalog of CATALOGS) {
      await checkCatalog(browser, baseUrl, catalog);
    }
    await checkKeyboard(browser, baseUrl);
    await screenshots(browser, baseUrl);
  } finally {
    await browser.close();
    server?.close();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed.`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
