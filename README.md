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

On the Agents, Extensions, Instructions, Plugins, and Skills catalogs and the Learning Hub's Articles list, cards no longer stay in two columns all the way down the page. Rows that start beside the filter sidebar keep their two columns. Once a row would start below the end of the filter list, the remaining cards continue in a grid that spans the whole catalog frame, rail included: three columns in the 1280px frame, and two below a 1408px window. The order stays A-Z across each row. Phones and tablets are unchanged, because the sidebar stacks above the cards there.

- A new `useCatalogSplit` hook measures where the filter list ends and splits the page's cards into those beside it and those below. It measures in a layout effect after every render (page, page size, sort, filter, and Show more changes) and on a `ResizeObserver` for viewport and font changes, so the split settles before paint.
- Each page's card markup moves, unchanged, into a local render function that both grids use, so `git diff -w --color-moved` shows it as a move.
- The wide grid reuses `.gridFrame`, so its top gridline and the dark-mode Install menu fix carry over, and it lines up with the header, hero, and CTA at every width. Its cells draw the lines between columns and rows, and its frame draws the right edge beside a last row that is not full.
- `page-width-regression.mjs` now lists the wide frame in its frame selector, so the 1280px frame rule covers it.
- At the default 6 per page, Extensions and Skills already split, because their filter lists are shorter than three rows of cards. The server renders all six beside the filters, and two move down right after hydration.

### Testing

- `npm run --prefix website build` passes (1,564 pages).
- `npm run --prefix website a11y`: 24 routes, dark and light, 0 violations.
- The website regression scripts in `website/scripts` pass: `page-width` (now including the wide frame), `plugin-install`, `reading-catalog`, `resource-card-layout`, and `site-refinement`.
- Playwright checks on all six pages (614 of 614, on the build, on the demo served locally, on a rehearsal of its Pages build, and on the live demo): cards beside and below the filters at 6 and 50 per page, column counts and frame edges from 1000 to 2560px, the wide frame starting on the catalog's bottom edge with one gridline there, no horizontal overflow, the stacked layout at 1000px with the same card order, Show more and Show less, a filter and Clear all, page 2, and no console errors.
- `tsc --noEmit` shows no new errors (the same 30 as `main`).
- Page heights at 50 per page at 1848px, before and after: Agents 9,646 to 7,807px, Extensions 17,665 to 13,251px, Instructions 9,437 to 7,362px, Plugins 10,719 to 9,066px, Skills 9,551 to 7,446px, and Learning Hub 6,719 to 5,631px.
