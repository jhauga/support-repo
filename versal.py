from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


RAW_PATTERNS: dict[str, tuple[str, ...]] = {
    "A": (
        " ### ",
        "#   #",
        "#   #",
        "#####",
        "#   #",
        "#   #",
        "#   #",
    ),
    "B": (
        "#### ",
        "#   #",
        "#   #",
        "#### ",
        "#   #",
        "#   #",
        "#### ",
    ),
    "C": (
        " ####",
        "#    ",
        "#    ",
        "#    ",
        "#    ",
        "#    ",
        " ####",
    ),
    "D": (
        "#### ",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        "#### ",
    ),
    "E": (
        "#####",
        "#    ",
        "#    ",
        "#### ",
        "#    ",
        "#    ",
        "#####",
    ),
    "F": (
        "#####",
        "#    ",
        "#    ",
        "#### ",
        "#    ",
        "#    ",
        "#    ",
    ),
    "G": (
        " ####",
        "#    ",
        "#    ",
        "# ###",
        "#   #",
        "#   #",
        " ####",
    ),
    "H": (
        "#   #",
        "#   #",
        "#   #",
        "#####",
        "#   #",
        "#   #",
        "#   #",
    ),
    "I": (
        "#####",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
        "#####",
    ),
    "J": (
        "#####",
        "    #",
        "    #",
        "    #",
        "#   #",
        "#   #",
        " ### ",
    ),
    "K": (
        "#   #",
        "#  # ",
        "# #  ",
        "##   ",
        "# #  ",
        "#  # ",
        "#   #",
    ),
    "L": (
        "#    ",
        "#    ",
        "#    ",
        "#    ",
        "#    ",
        "#    ",
        "#####",
    ),
    "M": (
        "#   #",
        "## ##",
        "# # #",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
    ),
    "N": (
        "#   #",
        "##  #",
        "# # #",
        "#  ##",
        "#   #",
        "#   #",
        "#   #",
    ),
    "O": (
        " ### ",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        " ### ",
    ),
    "P": (
        "#### ",
        "#   #",
        "#   #",
        "#### ",
        "#    ",
        "#    ",
        "#    ",
    ),
    "Q": (
        " ### ",
        "#   #",
        "#   #",
        "#   #",
        "# # #",
        "#  # ",
        " ## #",
    ),
    "R": (
        "#### ",
        "#   #",
        "#   #",
        "#### ",
        "# #  ",
        "#  # ",
        "#   #",
    ),
    "S": (
        " ####",
        "#    ",
        "#    ",
        " ### ",
        "    #",
        "    #",
        "#### ",
    ),
    "T": (
        "#####",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
    ),
    "U": (
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        " ### ",
    ),
    "V": (
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        "#   #",
        " # # ",
        "  #  ",
    ),
    "W": (
        "#   #",
        "#   #",
        "#   #",
        "# # #",
        "# # #",
        "## ##",
        "#   #",
    ),
    "X": (
        "#   #",
        "#   #",
        " # # ",
        "  #  ",
        " # # ",
        "#   #",
        "#   #",
    ),
    "Y": (
        "#   #",
        "#   #",
        " # # ",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
    ),
    "Z": (
        "#####",
        "    #",
        "   # ",
        "  #  ",
        " #   ",
        "#    ",
        "#####",
    ),
    "0": (
        " ### ",
        "#  ##",
        "# # #",
        "# # #",
        "##  #",
        "#   #",
        " ### ",
    ),
    "1": (
        "  #  ",
        " ##  ",
        "  #  ",
        "  #  ",
        "  #  ",
        "  #  ",
        "#####",
    ),
    "2": (
        " ### ",
        "#   #",
        "    #",
        "   # ",
        "  #  ",
        " #   ",
        "#####",
    ),
    "3": (
        "#### ",
        "    #",
        "    #",
        " ### ",
        "    #",
        "    #",
        "#### ",
    ),
    "4": (
        "#   #",
        "#   #",
        "#   #",
        "#####",
        "    #",
        "    #",
        "    #",
    ),
    "5": (
        "#####",
        "#    ",
        "#    ",
        "#### ",
        "    #",
        "    #",
        "#### ",
    ),
    "6": (
        " ####",
        "#    ",
        "#    ",
        "#### ",
        "#   #",
        "#   #",
        " ### ",
    ),
    "7": (
        "#####",
        "    #",
        "   # ",
        "  #  ",
        " #   ",
        " #   ",
        " #   ",
    ),
    "8": (
        " ### ",
        "#   #",
        "#   #",
        " ### ",
        "#   #",
        "#   #",
        " ### ",
    ),
    "9": (
        " ### ",
        "#   #",
        "#   #",
        " ####",
        "    #",
        "    #",
        "#### ",
    ),
}


@dataclass(frozen=True)
class FrameStyle:
    top_left: str
    top_right: str
    bottom_left: str
    bottom_right: str
    side: str
    horizontal: str


FRAME_STYLES: dict[str, FrameStyle] = {
    "classic": FrameStyle("|\\", "/|", "|/", "\\|", "||", "="),
    "angled": FrameStyle("/<", "\\>", "\\<", "/>", "||", "-"),
    "heavy": FrameStyle("##", "##", "##", "##", "##", "#"),
}


DEFAULT_EMPTY_CHAR = " "
PARAGRAPH_BREAK_RE = re.compile(r"(\r?\n(?:[ \t]*\r?\n)+)")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="versal",
        description="Render the first character of each paragraph as an ASCII versal.",
    )
    parser.add_argument("path", help="Path to the input text file, or '-' for stdin.")
    parser.add_argument(
        "--style",
        choices=sorted(FRAME_STYLES),
        default="classic",
        help="Decorative frame style to use when borders are enabled.",
    )
    parser.add_argument(
        "--fill-char",
        default="#",
        help="Single character used to draw the versal strokes.",
    )
    parser.add_argument(
        "--empty-char",
        default=DEFAULT_EMPTY_CHAR,
        help="Single character used for empty space inside the versal.",
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=1,
        help="Interior spacing between the frame and the versal glyph.",
    )
    parser.add_argument(
        "--scale",
        type=int,
        default=1,
        help="Scale factor applied to both glyph width and height.",
    )
    parser.add_argument(
        "--no-border",
        action="store_true",
        help="Render only the versal glyph without the decorative frame.",
    )
    parser.add_argument(
        "--first-only",
        action="store_true",
        help="Style only the first paragraph instead of every paragraph block.",
    )
    parser.add_argument(
        "--encoding",
        default="utf-8",
        help="Text encoding used when reading the input file.",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="versal 1.0.0",
    )
    return parser.parse_args()


def validate_char_option(name: str, value: str) -> str:
    if len(value) != 1:
        raise ValueError(f"{name} must be exactly one character.")
    return value


def read_input(path: str, encoding: str) -> str:
    if path == "-":
        return sys.stdin.read()
    return Path(path).read_text(encoding=encoding)


def scale_pattern(pattern: tuple[str, ...], scale: int, fill_char: str, empty_char: str) -> list[str]:
    scaled_rows: list[str] = []
    for raw_row in pattern:
        expanded = "".join((fill_char if cell != " " else empty_char) * scale for cell in raw_row)
        scaled_rows.extend(expanded for _ in range(scale))
    return scaled_rows


def frame_rows(rows: list[str], style: FrameStyle, padding: int, empty_char: str) -> list[str]:
    if not rows:
        return rows
    inner_width = len(rows[0]) + (padding * 2)
    padded_rows = [
        f"{style.side}{empty_char * padding}{row}{empty_char * padding}{style.side}"
        for row in rows
    ]
    top = f"{style.top_left}{style.horizontal * inner_width}{style.top_right}"
    bottom = f"{style.bottom_left}{style.horizontal * inner_width}{style.bottom_right}"
    return [top, *padded_rows[:-1], f"{style.bottom_left}{style.horizontal * padding}{rows[-1]}{empty_char * padding}{style.bottom_right}"]


def render_versal(character: str, *, style: str, fill_char: str, empty_char: str, padding: int, scale: int, border: bool) -> list[str]:
    pattern = RAW_PATTERNS.get(character.upper())
    if pattern is None:
        return []
    rows = scale_pattern(pattern, scale, fill_char, empty_char)
    if not border:
        return rows
    return frame_rows(rows, FRAME_STYLES[style], padding, empty_char)


def transform_paragraph(paragraph: str, args: argparse.Namespace, paragraph_index: int) -> str:
    if args.first_only and paragraph_index > 0:
        return paragraph

    lines = paragraph.splitlines()
    for line_index, line in enumerate(lines):
        stripped = line.lstrip()
        if not stripped:
            continue

        leading_width = len(line) - len(stripped)
        first_character = stripped[0]
        glyph_lines = render_versal(
            first_character,
            style=args.style,
            fill_char=args.fill_char,
            empty_char=args.empty_char,
            padding=args.padding,
            scale=args.scale,
            border=not args.no_border,
        )
        if not glyph_lines:
            return paragraph

        prefix = line[:leading_width]
        remainder = stripped[1:]
        output_lines = lines[:line_index]
        output_lines.extend(prefix + glyph for glyph in glyph_lines[:-1])
        output_lines.append(prefix + glyph_lines[-1] + remainder)
        output_lines.extend(lines[line_index + 1 :])
        return "\n".join(output_lines)

    return paragraph


def render_text(text: str, args: argparse.Namespace) -> str:
    pieces = PARAGRAPH_BREAK_RE.split(text)
    rendered: list[str] = []
    paragraph_index = 0
    for piece in pieces:
        if not piece:
            continue
        if PARAGRAPH_BREAK_RE.fullmatch(piece):
            rendered.append(piece)
            continue
        if not piece.strip():
            rendered.append(piece)
            continue
        rendered.append(transform_paragraph(piece, args, paragraph_index))
        paragraph_index += 1
    return "".join(rendered)


def main() -> int:
    args = parse_args()
    try:
        args.fill_char = validate_char_option("--fill-char", args.fill_char)
        args.empty_char = validate_char_option("--empty-char", args.empty_char)
        if args.padding < 0:
            raise ValueError("--padding must be zero or greater.")
        if args.scale < 1:
            raise ValueError("--scale must be one or greater.")
        text = read_input(args.path, args.encoding)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"versal: {error}", file=sys.stderr)
        return 1

    sys.stdout.write(render_text(text, args))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())