# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull/feature request PR_NUMBER](https://github.com/github/awesome-copilot/pull/PR_NUMBER)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/website-resize-col-width/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!--
IMPORTANT - mind description, and change first line for 1 to sentence description.
## Description
-->
## Widen catalog grids below the filter sidebar

On the Agents, Extensions, Instructions, Plugins, and Skills catalogs and the Learning Hub's Articles list, larger pages no longer stay in two columns all the way down. At 20 and 50 per page the first four rows (8 cards) keep their two columns beside the filter sidebar, and at 100 per page the first five rows (10 cards) do. The rest continue in a grid that spans the whole catalog frame, rail included: three columns in the 1280px frame, and two below a 1408px window. Full pages leave 12, 42, or 90 cards below, which fill every wide row in either column count. A shorter last page or filtered list moves the cut by at most one row to keep the wide rows full, and stays in two columns when it is within a row of the cut. The default 6 per page is unchanged. The order stays A-Z across each row. Phones and tablets are unchanged, because the sidebar stacks above the cards there.

- A new `useCatalogSplit` hook works out the split from the page size, the number of cards, and a `matchMedia` check for the stacked layout (the stylesheets' own `63.25rem` query). It needs no layout measuring, and the server render, with every card beside the filters, matches the default page.
- Each page's card markup moves, unchanged, into a local render function that both grids use, so `git diff -w --color-moved` shows it as a move.
- The wide grid renders inside `<section id="catalog">`, after the filters and the side grid, so pagination focus and the Section's 1280px cap cover it. It reuses `.gridFrame` for its top gridline and the dark-mode Install menu hook, takes `.catalog`'s gutter inset below 120rem, and draws its right edge beside a last row that is not full.
- `page-width-regression.mjs` now lists the wide frame in its frame selector, so the 1280px frame rule covers it.

### Testing

- `npm run --prefix website build` passes (1,572 pages).
- `npm run --prefix website a11y`: 24 routes, dark and light, 0 violations.
- The website regression scripts in `website/scripts` pass: `page-width` (now including the wide frame), `plugin-install`, `reading-catalog`, `resource-card-layout`, and `site-refinement`.
- Playwright checks on all six pages (596 of 596, on the build, on the demo served locally, on a rehearsal of its Pages build, and on the live demo): no split at 6 per page, the 8-card split at 20 and 50 and the 10-card split at 100, after a filter and Clear all, and on page 2, full wide rows whenever the count allows, frame edges from 1000 to 2560px, the wide frame starting on the catalog's bottom edge with one gridline there, no horizontal overflow, the stacked layout at 1000px with the same card order, Show more and Show less, and no console errors.
- A second pass at 20 and 100 per page on all six pages, at 1280, 1472, and 1848px: every wide grid ends on a full row, except the Learning Hub's 31 articles at 100 per page in two columns, because 21 is an odd count (in three columns they fill 7 rows).
- `tsc --noEmit` shows no new errors (the same 30 as `main`).
