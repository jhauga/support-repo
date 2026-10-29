// Checks the split catalog grid on the six filter-rail pages and saves
// screenshots. Serve website/dist first, then:
//   node .support/resize-col-harness/verify.mjs [baseUrl]   (D1=full for the full-width option)
// Rows stay beside the filters while they start above the filter list's end;
// 6 per page never splits. A short last wide row is centered, except on the last page.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const website = fileURLToPath(new URL("../../website/", import.meta.url));
const { chromium } = createRequire(`${website}package.json`)("playwright");
const base = process.argv[2] ?? "http://127.0.0.1:4400";
const fullWidth = process.env.D1 === "full";
const shots = fileURLToPath(new URL("./", import.meta.url));
const total = (type) =>
  JSON.parse(readFileSync(`${website}public/data/${type}.json`, "utf8")).items.length;
const PAGES = [
  ["/agents/", "Agents", "agent", total("agents")],
  ["/extensions/", "Extensions", "extension", total("extensions")],
  ["/instructions/", "Instructions", "instruction", total("instructions")],
  ["/plugins/", "Plugins", "plugin", total("plugins")],
  ["/skills/", "Skills", "skill", total("skills")],
  ["/learning-hub/", "Articles", "learning-hub", null],
];

let pass = 0;
const centered = new Set();
const failures = [];
const check = (ok, label) => (ok ? pass++ : failures.push(label));

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1848, height: 898 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.emulateMedia({ colorScheme: "dark" });

const state = (kind) =>
  page.evaluate((kind) => {
    const rect = (el) => el.getBoundingClientRect();
    const aside = document.querySelector("#catalog aside");
    const catalog = aside.parentElement;
    const side = document.querySelector('[class*="_threeUp_"]');
    const wide = document.querySelector('[class*="_wideGrid_"]');
    const frame = wide?.parentElement;
    const list = aside.lastElementChild.lastElementChild ?? aside;
    const navEnd = rect(list).bottom + parseFloat(getComputedStyle(aside).paddingBlockEnd);
    const sideCells = [...side.children].map(rect);
    const wideCells = wide ? [...wide.children].map(rect) : [];
    const lastTop = Math.max(...wideCells.map((r) => r.top));
    const lastRow = wideCells.filter((r) => r.top === lastTop);
    const pages = [...document.querySelectorAll('[aria-label="Pagination"] a')]
      .map((a) => Number(a.textContent)).filter(Number.isFinite);
    const current = Number(document.querySelector('[aria-label="Pagination"] [aria-current="page"]')?.textContent ?? 1);
    const hrefs = [...document.querySelectorAll('[class*="_threeUp_"] a[href], [class*="_wideGrid_"] a[href]')]
      .map((a) => new URL(a.href).pathname)
      .filter((p, i, all) => p.includes(`/${kind}`) && all.indexOf(p) === i);
    return {
      side: sideCells.length,
      wide: wideCells.length,
      sideTopsOk: sideCells.every((r) => r.top < navEnd + 0.5),
      lastSideBottom: sideCells.at(-1)?.bottom ?? null,
      navEnd,
      lastRow: lastRow.length,
      lastRowGaps: wide && lastRow.length ? [lastRow[0].left - rect(wide).left, rect(wide).right - lastRow.at(-1).right] : null,
      lastPage: current >= Math.max(1, ...pages),
      stacked: rect(aside).right > rect(side).left + 1,
      wideCols: wideCells.filter((r) => r.top === wideCells[0].top).length,
      frameEdges: frame ? [Math.round(rect(frame).left), Math.round(rect(frame).right)] : null,
      catalogEdges: [Math.round(rect(catalog).left), Math.round(rect(catalog).right)],
      frameTopGap: frame ? rect(frame).top - rect(catalog).bottom : null,
      frameTopBorder: frame ? getComputedStyle(frame).borderTopWidth : null,
      sideBottomBorder: getComputedStyle(side).borderBottomWidth,
      clientWidth: document.documentElement.clientWidth,
      overflowX: document.documentElement.scrollWidth - innerWidth,
      hrefs,
    };
  }, kind);

const invariants = async (label, kind, expected, size) => {
  const s = await state(kind);
  check(s.side + s.wide === expected, `${label}: ${s.side}+${s.wide} cards, expected ${expected}`);
  if (size === 6) check(s.wide === 0, `${label}: 6 per page split ${s.side}+${s.wide}`);
  check(size === 6 || s.stacked || s.sideTopsOk, `${label}: a side row starts below the filters' end`);
  check(!s.stacked || s.wide === 0, `${label}: stacked layout still split`);
  if (s.wide > 0) {
    check(s.lastSideBottom >= s.navEnd - 0.5, `${label}: side grid ends above the filters' end with cards left over`);
    if (s.lastRow < s.wideCols) {
      const [left, right] = s.lastRowGaps;
      const ok = s.lastPage ? Math.abs(left) <= 1 : Math.abs(left - right) <= 1;
      check(ok, `${label}: short last row (${s.lastRow} of ${s.wideCols}) gaps ${Math.round(left)}/${Math.round(right)}, ${s.lastPage ? "last page, expected left-aligned" : "expected centered"}`);
      if (!s.lastPage) centered.add(`${s.lastRow}/${s.wideCols}`);
    }
    check(Math.abs(s.frameTopGap) < 1, `${label}: wide frame starts ${s.frameTopGap}px from the catalog`);
    check(s.frameTopBorder === "1px" && s.sideBottomBorder === "0px", `${label}: junction borders ${s.sideBottomBorder}/${s.frameTopBorder}`);
    const left = Math.round(Math.max(24, (s.clientWidth - 1920) / 2));
    const edges = fullWidth ? [left, s.clientWidth - left] : s.catalogEdges;
    check(s.frameEdges.every((v, i) => Math.abs(v - edges[i]) <= 1), `${label}: wide frame ${s.frameEdges}, expected ${edges}`);
  }
  check(s.overflowX <= 0, `${label}: horizontal overflow ${s.overflowX}px`);
  return s;
};

const pickSize = async (type, size) => {
  await page.locator(`summary[aria-label$="(${type} per page)"]`).click();
  await page
    .locator(`details:has(summary[aria-label$="(${type} per page)"]) [role="menuitemradio"]`, { hasText: new RegExp(`^${size}$`) })
    .click();
  await page.waitForTimeout(250);
};

const resize = async (width, height = 898) => {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(350);
};

const open = async (route) => {
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector("astro-island[ssr]"));
  await page.waitForTimeout(300);
};

const summary = [];
for (const [route, type, kind, count] of PAGES) {
  await resize(1848);
  await open(route);
  let all = count;
  if (all === null) {
    await pickSize(type, 100);
    all = (await state(kind)).hrefs.length;
    await pickSize(type, 6);
  }
  const at6 = await invariants(`${route} 6`, kind, Math.min(6, all), 6);
  await pickSize(type, 50);
  const expected = Math.min(50, all);
  const at50 = await invariants(`${route} 50 @1848`, kind, expected, 50);
  const cols = {};
  for (const w of [2560, 1919, 1440, 1280, 1100, 1024, 1000, 1848]) {
    await resize(w);
    const s = await invariants(`${route} 50 @${w}`, kind, expected, 50);
    cols[w] = s.wide ? s.wideCols : 0;
    if (w === 1000) {
      check(s.stacked, `${route}: rail not stacked at 1000px`);
      check(JSON.stringify(s.hrefs) === JSON.stringify(at50.hrefs), `${route}: card order differs between split and stacked`);
    }
  }
  const more = page.locator("#catalog aside button", { hasText: /^Show \d+ more$/ }).first();
  if (await more.count()) {
    await more.click();
    await page.waitForTimeout(250);
    const s = await invariants(`${route} show more`, kind, expected, 50);
    check(s.side >= at50.side, `${route}: show more moved cards out of the side grid`);
    await page.locator("#catalog aside button", { hasText: /^Show less$/ }).first().click();
    await page.waitForTimeout(250);
    const back = await invariants(`${route} show less`, kind, expected, 50);
    check(back.side === at50.side, `${route}: show less gave ${back.side}, expected ${at50.side}`);
  }
  await page.locator("#catalog aside label").first().click();
  await page.waitForTimeout(250);
  const filtered = await state(kind);
  await invariants(`${route} filtered`, kind, filtered.side + filtered.wide, 50);
  await page.locator("#catalog aside button", { hasText: /^Clear all/ }).click();
  await page.waitForTimeout(250);
  await invariants(`${route} cleared`, kind, expected, 50);
  const page2 = page.getByRole("link", { name: "Page 2" });
  if (all > 50 && (await page2.count())) {
    await page2.click();
    await page.waitForTimeout(400);
    await invariants(`${route} page 2`, kind, Math.min(50, all - 50), 50);
  }
  const bySize = {};
  for (const size of [20, 100]) {
    await pickSize(type, size);
    const s = await invariants(`${route} ${size}`, kind, Math.min(size, all), size);
    bySize[size] = `${s.side}+${s.wide}`;
  }
  summary.push(`${route} ${all} items: at 6 ${at6.side}+${at6.wide}, at 20 ${bySize[20]}, at 50 ${at50.side}+${at50.wide}, at 100 ${bySize[100]}, wide frame ${JSON.stringify(at50.frameEdges)}, columns ${JSON.stringify(cols)}`);
}

// Screenshots to compare by eye with the goal GIF.
const shoot = async (name, y) => {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${shots}${name}.png` });
};
const edges = () =>
  page.evaluate(() => ({
    catalog: document.getElementById("catalog").getBoundingClientRect().top + scrollY,
    junction: document.querySelector("#catalog aside").parentElement.getBoundingClientRect().bottom + scrollY,
    pagination: document.querySelector('[class*="_paginationRow_"]').getBoundingClientRect().top + scrollY,
  }));
for (const scheme of ["dark", "light"]) {
  await page.emulateMedia({ colorScheme: scheme });
  await resize(1848);
  await open("/instructions/");
  await pickSize("Instructions", 50);
  const y = await edges();
  const suffix = scheme === "light" ? "-light" : "";
  await shoot(`shot-instructions-junction${suffix}`, y.junction - 600);
  if (scheme === "dark") await shoot("shot-instructions-end", y.pagination - 600);
}
await page.emulateMedia({ colorScheme: "dark" });
for (const [route, type, name] of [["/plugins/", "Plugins", "shot-plugins-end"], ["/agents/", "Agents", "shot-agents-end"]]) {
  await resize(1848);
  await open(route);
  await pickSize(type, 50);
  await shoot(name, (await edges()).pagination - 600);
}
await open("/skills/");
await shoot("shot-skills-6", (await edges()).junction - 600);
await resize(390, 844);
await open("/instructions/");
await pickSize("Instructions", 20);
const phone = await state("instruction");
check(phone.stacked && phone.wide === 0 && phone.side === 20, `phone: ${phone.side}+${phone.wide} cards, stacked ${phone.stacked}`);
await shoot("shot-instructions-phone", (await edges()).catalog);

check(errors.length === 0, `console errors: ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
console.log(summary.join("\n"));
console.log(`centered short rows seen: ${[...centered].sort().join(", ") || "none"}`);
console.log(`${pass} passed, ${failures.length} failed`);
for (const f of failures) console.log("FAIL", f);
process.exit(failures.length ? 1 : 0);
