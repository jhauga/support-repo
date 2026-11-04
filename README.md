# Support Repo

<!-- Constants -->
Support branch of repository for:
<!-- Link to PR -->
- [awesome-copilot pull request](https://github.com/) <!-- github.com/<owner>/<repo>/pull/<[0-9]+> -->
- `Ctrl + click` View illustration [index.html](https://jhauga.github.io/support-repo/docs/)
<!-- git commit -m "undeploy: use htmlpreview for index.html" -->
<!--
- `Ctrl + click` Navigate new pages [index.html](https://jhauga.github.io/htmlpreview.github.com/?https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/plugin-adobe-illustrator/docs/index.html)
-->

<!-- NOTE - leave formatter_1 and formatter_2 for semi-automated task -->
<!--
IMPORTANT - mind description, and change first line for 1 to sentence description.
## Description
-->
<!-- formatter_1 -->
Plugin to help update, edit, or create complex Adobe Illustrator scripts, extensions, plugins, and MCP servers, or to build automated tools that manage projects using assets created in Adobe Illustrator.

Support branch for new plugin adobe-illustrator.

## Test Conditions

Full [test results](https://github.com/jhauga/support-repo/tree/plugin-adobe-illustrator) (*ctrl + click*) at support repo.

### Evaluation Context

- **Session Target**: Copilot CLI
- **Agent**: Agent
- **Model**: Claude Haiku 5.5
  - **Thinking Effort**: Medium
- **Number of Prompts**: 1
- **Post Edits**: None
<!-- NOTE: change if updated -->
### Copilot Pro+ Plan Credit Usage

- **Start Credits**: 1%
- **End Credits**: 1%

### Prompt

```text
Use the adobe-illustrator-integrations and adobe-illustrator-scripting skills to build "Grid Rhythm", a small Adobe Illustrator extension, and a documentation site for it that GitHub Pages can serve from the root of this repository.

The extension (folder grid-rhythm/)
1. A CEP panel for Illustrator 2026 (host ILST) named Grid Rhythm, opened from Window > Extensions > Grid Rhythm.
2. Before anything is drawn, the panel asks for:
   - Rows (1 to 20) and columns (1 to 10), validated, with a Next button.
   - Then, only once rows and columns are valid, the pattern mode: one row pattern (every row repeats the same sequence) or alternating rows (odd and even rows use different sequences).
3. Design the rest of the panel so the grid has a visible design rhythm, not one shape with one fill: for example a shape sequence built from square, circle, rectangle, ellipse, and linked asset; fills that step, rotate, or mirror through a small palette; stroke weights or dashes that change with the rhythm; and a small live preview of the first rows. Choose the controls yourself and explain the choices in the docs.
4. A Draw button sends the settings to an ExtendScript host function that draws the grid on a new layer named "Grid Rhythm" in the active document (or a new document when none is open), fitted to the active artboard with even gutters. A linked asset cell places an SVG bundled with the extension as a linked file, not an embedded one.
5. Validate the settings in the panel and again in the host script. The host script returns an error message instead of throwing on bad input.
6. Include a .debug file and the steps to load the unsigned extension for development (PlayerDebugMode on Windows and macOS), and note how a signed ZXP would be packaged later.

Test it live
7. Load the extension in Illustrator 2026 and draw at least three different configurations (for example 4 x 6 with one row pattern, 20 x 10 with alternating rows, and 8 x 8 with linked assets). Export each artboard to PNG with an ExtendScript into docs/images/.
8. Take one or two screenshots of the panel in Illustrator for the install and usage pages. A PowerShell screen capture is fine.
9. Make an animated GIF, docs/images/demo.gif, that steps through the exported configurations with whichever tool is installed (Python Pillow, ImageMagick, or ffmpeg).

The documentation site
10. Write a light static site, as if for a real Illustrator extension: index.html (what it does, with the GIF), install.html (development install and ZXP install), usage.html (step by step, with the screenshots), and changelog.html. Plain HTML and CSS, relative links only, no build step, no external CDNs or fonts.
11. Use placeholder data only (Acme Corp, example.com, Jane Doe). Do not include local paths, user names, or account details.

When you finish, list what you ran, what passed, and anything you could not test.
```

### Results

The test worked in one prompt with no post edits. Copilot (Claude Haiku 5.5) used both skills to build **Grid Rhythm**, a CEP panel for Illustrator 2026, and a small docs site for it.

![Grid Rhythm demo](https://raw.githubusercontent.com/jhauga/support-repo/plugin-adobe-illustrator/docs/images/demo.gif)

- **Extension** ([grid-rhythm/](https://github.com/jhauga/support-repo/tree/plugin-adobe-illustrator/grid-rhythm)): CEP 12 manifest for `ILST` `[29.0,99.9]`, a three-step panel (size, pattern mode, design) with a live preview, and an ES3 host script that checks the settings again and returns JSON. The panel and the host share one `js/rhythm-plan.js`, so the preview and the artwork follow the same plan.
- **Live test**: installed for development (`PlayerDebugMode` on `CSXS.12`, per-user CEP folder), then drew 4 x 6 with one row pattern, 20 x 10 with alternating rows, and 8 x 8 with linked assets, and exported each artboard to PNG.
- **Docs site** ([docs/](https://github.com/jhauga/support-repo/tree/plugin-adobe-illustrator/docs)): overview with the GIF, install, usage, and changelog pages. Relative links only, no external assets.
- **Check after the test**: running the host script through COM in a new document drew 12 cells on a `Grid Rhythm` layer (9 paths and 3 linked placed items, none embedded), and bad input returned the validation message.

Found by the test:

- Illustrator's `PlacedItem.file` rejects SVG, so the panel places a linked `accent.ai` copy of the bundled `accent.svg`, and the docs say why.
- The site went into `docs/`, not the repository root, so the live link above points to `docs/`.
- `.debug` and `accent.ai` match global ignore rules (`.*` and `*.ai`), so they were force-added to match the install docs.
<!-- formatter_2 -->