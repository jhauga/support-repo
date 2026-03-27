# versal

`versal.py` renders the first character of each paragraph as a decorative ASCII versal and appends the rest of the paragraph text after the final glyph row.

## Install

No third-party packages are required.

```bash
python versal.py sample.txt
```

On Windows:

```powershell
py versal.py sample.txt
```

If you want a shell alias named `versal`, point it at `python versal.py` or `py versal.py` in your local environment.

## Options

```text
usage: versal [-h] [--style {angled,classic,heavy}] [--fill-char FILL_CHAR]
              [--empty-char EMPTY_CHAR] [--padding PADDING] [--scale SCALE]
              [--no-border] [--first-only] [--encoding ENCODING] [--version]
              path
```

- `path`: input text file, or `-` to read from standard input.
- `--style`: frame style for bordered output. Choices are `classic`, `angled`, or `heavy`.
- `--fill-char`: single character used for the letter strokes.
- `--empty-char`: single character used inside the glyph where no stroke is present.
- `--padding`: interior spacing between the frame and the glyph.
- `--scale`: enlarges the versal horizontally and vertically.
- `--no-border`: removes the decorative frame and prints only the versal glyph.
- `--first-only`: styles only the first paragraph block.
- `--encoding`: file encoding used when reading the input.
- `--version`: prints the tool version.

## Examples

Bordered output with the default frame:

```bash
python versal.py sample.txt
```

Render the same file without a border:

```bash
python versal.py --no-border sample.txt
```

Use a heavier frame and a different stroke character:

```bash
python versal.py --style heavy --fill-char @ sample.txt
```

Scale the versal for a more poster-like look:

```bash
python versal.py --scale 2 --padding 2 sample.txt
```

Read from standard input:

```bash
type sample.txt | python versal.py -
```

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.