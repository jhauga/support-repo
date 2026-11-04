# Grid Rhythm

A CEP panel for Adobe Illustrator 2026 (host ILST) that draws a rows-by-columns grid of shapes with a design rhythm. The docs site lives in `docs/` (GitHub Pages: set the source to the `/docs` folder).

## Layout

- `CSXS/manifest.xml`: bundle `com.example.gridrhythm`, panel menu "Grid Rhythm"
- `index.html`, `css/panel.css`, `js/panel.js`: the panel UI
- `js/CSInterface.js`: Adobe's CSInterface library, unmodified
- `js/rhythm-plan.js`: shared validation, plan, and layout (ES3, used by the panel and the host)
- `jsx/host.jsx`: ExtendScript host (`gridRhythmHost.draw`)
- `assets/accent.svg`: source artwork; `assets/accent.ai`: the linked copy used for placement
- `.debug`: debug port for the panel (remove before packaging)

## Development install

1. Enable PlayerDebugMode.
   - Windows: `New-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.12" -Name PlayerDebugMode -Value "1" -PropertyType String -Force`
   - macOS: `defaults write com.adobe.CSXS.12 PlayerDebugMode 1`
2. Copy the folder to the CEP extensions directory, named after the bundle ID.
   - Windows: `%APPDATA%\Adobe\CEP\extensions\com.example.gridrhythm`
   - macOS: `~/Library/Application Support/Adobe/CEP/extensions/com.example.gridrhythm`
3. Restart Illustrator and choose Window > Extensions > Grid Rhythm.

Re-copy after each edit to `js/`, `jsx/`, or `css/`.

## Packaging a signed ZXP later

1. Delete `.debug` from the package copy.
2. Create or obtain a signing certificate, then run `ZXPSignCmd -sign <folder> <out>.zxp <cert.p12> <password>`.
3. Verify with `ZXPSignCmd -verify <out>.zxp`.

Keep certificates and passwords out of the repository.

## Notes

- The linked asset is `assets/accent.ai`, not the SVG. Illustrator's `PlacedItem.file` rejects SVG.
- The host script is ES3 and loads the shared plan with `eval` because `$.evalFile` scopes `var` declarations to the calling function.
- Whenever you change `rhythm-plan.js`, keep its final `GridRhythm;` expression. The host relies on it.
