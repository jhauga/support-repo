# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull/feature request 5111](https://github.com/github/awesome-copilot/pull/5111)
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/website-add-page-size/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!--
IMPORTANT - mind description, and change first line for 1 to sentence description.
## Description
-->
## Add a page size menu to the catalog pages and the Learning Hub

Adds a "Resource page size" menu next to "Sort by" on the Agents, Extensions, Instructions, Plugins, and Skills catalogs and on the Learning Hub's Articles list. Readers can show 6 (the default and the previous fixed size), 25, 50, or 100 items per page. Changing the size returns to page 1, the same as changing the sort order or a filter.

- New `CatalogResourceSizeControl` reuses the sort menu's markup and classes, so the two menus match on every page. A 1px rule separates them and is hidden below 48rem.
- The trigger's accessible name includes the current size (for example "Skills per page: 6").
- The fixed page sizes in the six components are replaced by state.
- On the Learning Hub, the sort and page size menus are grouped in the Articles header. On phones that page keeps its existing design, where the Filters button replaces the menus.

### Testing

- `npm run --prefix website build` passes (1,248 pages).
- `npm run --prefix website a11y`: 24 routes, dark and light, 0 violations.
- Playwright checks on all six pages (150 of 150): default size, card and page counts for each size, return to page 1, size kept across sort and filter changes, unchanged toolbar and header heights, and phone layouts.
- `tsc --noEmit` shows no new errors (the 26 existing ones are unchanged).
