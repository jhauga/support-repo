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

On the Agents, Extensions, Instructions, Plugins, and Skills catalogs and the Learning Hub's Articles list, pages of 20, 50, or 100 no longer stay in two columns all the way down. Rows that start beside the filter sidebar keep their two columns. Once a row would start below the end of the filter list, the rest continue in a grid that spans the whole catalog frame, rail included: three columns in the 1280px frame, and two below a 1408px window. So a page whose filter list is short widens sooner. The default 6 per page is unchanged.

If that wide grid's last row is short on any page but the last, it is centered: one card sits under the middle column, and two cards shift half a column, so the middle card's sides above meet the middle of their top edges. The last page keeps its last row at the left, to mark the end of the list. The order stays A-Z across each row. Phones and tablets are unchanged, because the sidebar stacks above the cards there.

- A new `useCatalogSplit` hook measures where the filter list ends and splits the page's cards into those beside it and those below. It measures in a layout effect after every render (page, page size, sort, filter, and Show more changes) and on a `ResizeObserver` for the side grid and the filter groups, grows or cuts one whole row at a time, and keeps the split steady when a change would only undo the previous one (the vertical scrollbar can otherwise flip it back and forth). A card that changes grids remounts, so when a resize or zoom moves a focused card, the hook puts focus back on the same control.
- Each page's card markup moves, unchanged, into a local render function that both grids use, so `git diff -w --color-moved` shows it as a move.
- The wide grid renders inside `<section id="catalog">`, after the filters and the side grid, so pagination focus and the Section's 1280px cap cover it. It reuses `.gridFrame` for its top gridline and the dark-mode Install menu hook, takes `.catalog`'s gutter inset below 120rem, and draws its right edge beside a last row that is not full.
- The centering is CSS only: `:nth-child` selectors pick out a short last row, a container query on the wide frame tells three columns from two, and relative positioning shifts the cards (a transform would make each shifted card a stacking context around its Install menu).
- `page-width-regression.mjs` now lists the wide frame in its frame selector and also loads the six catalogs at 50 per page (6 per page never splits), so the 1280px frame rule and its overflow check cover the wide grid.

### Testing

- `npm run --prefix website build` passes (1,572 pages).
- `npm run --prefix website a11y`: 24 routes, dark and light, 0 violations (at the default page size, which does not split).
- The website regression scripts in `website/scripts` pass: `page-width` (now also at 50 per page, where it checks the wide frame), `plugin-install`, `reading-catalog`, `resource-card-layout`, and `site-refinement`.
- Playwright checks on all six pages (766 of 766): no split at 6 per page; at 20, 50, and 100 per page every side row starts above the end of the filter list and the side grid reaches it; a short last wide row is centered on pages before the last (one and two cards both seen) and left-aligned on the last page; frame edges from 1000 to 2560px; the wide frame starting on the catalog's bottom edge with one gridline there; no horizontal overflow; the stacked layout at 1000px with the same card order; Show more and Show less, a filter and Clear all, page 2; focus kept on the same link or button when a resize moves its card to the other grid, in both directions; and no console errors.
- `tsc --noEmit` shows no new errors (the same 30 as `main`).
