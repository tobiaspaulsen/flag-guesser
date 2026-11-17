import io
import json
import sys
from pathlib import Path

from cairosvg import svg2png
from PIL import Image

INPUT_FOLDER = Path("static/countries/svg")
OUTPUT_FOLDER = Path("static/countries/png")
COUNTRIES_FILE = Path("static/countries/countries.json")
DEFAULT_HEIGHT = 512
# The game compares flags pixel by pixel, so every PNG must be the same size.
CANVAS_RATIO = 4 / 3
# Edge rows/columns are sampled this far in, to skip anti-aliasing at the border.
EDGE_INSET = 2
# An edge counts as one plain colour if no channel varies more than this along it.
PLAIN_EDGE_TOLERANCE = 12


def render(svg_path: Path, **size: int) -> Image.Image:
    return Image.open(io.BytesIO(svg2png(url=str(svg_path), **size))).convert("RGBA")


def is_plain(strip: Image.Image) -> bool:
    extrema = strip.convert("RGB").getextrema()
    return all(high - low <= PLAIN_EDGE_TOLERANCE for low, high in extrema)


def extend_to_canvas(flag: Image.Image, width: int, height: int) -> Image.Image:
    """Fill the canvas by repeating the flag's edge rows/columns outward, so
    stripes and plain fields get longer while emblems keep their proportions.

    Only plain-coloured edges are extended: repeating an edge that crosses a
    diagonal or a Union Jack canton would smear it. If one side is plain, it
    takes all the extra space."""
    vertical = flag.height < height
    if vertical:
        length, gap = flag.width, height - flag.height
        first = flag.crop((0, EDGE_INSET, length, EDGE_INSET + 1))
        last = flag.crop((0, flag.height - EDGE_INSET - 1, length, flag.height - EDGE_INSET))
    else:
        length, gap = flag.height, width - flag.width
        first = flag.crop((EDGE_INSET, 0, EDGE_INSET + 1, length))
        last = flag.crop((flag.width - EDGE_INSET - 1, 0, flag.width - EDGE_INSET, length))

    first_plain, last_plain = is_plain(first), is_plain(last)
    if first_plain == last_plain:
        before = gap // 2
    else:
        before = gap if first_plain else 0
    after = gap - before

    # Extensions are drawn over the flag's outermost EDGE_INSET rows: at a
    # fractional size those rows are a half-transparent blend of every stacked
    # layer and would show as a dark seam.
    canvas = Image.new("RGBA", (width, height))
    if vertical:
        canvas.alpha_composite(flag, (0, before))
        if before:
            canvas.paste(first.resize((width, before + EDGE_INSET)), (0, 0))
        if after:
            canvas.paste(
                last.resize((width, after + EDGE_INSET)),
                (0, before + flag.height - EDGE_INSET),
            )
    else:
        canvas.alpha_composite(flag, (before, 0))
        if before:
            canvas.paste(first.resize((before + EDGE_INSET, height)), (0, 0))
        if after:
            canvas.paste(
                last.resize((after + EDGE_INSET, height)),
                (before + flag.width - EDGE_INSET, 0),
            )
    return canvas


def render_flag(svg_path: Path, width: int, height: int) -> Image.Image:
    flag = render(svg_path, output_height=height)
    if abs(flag.width - width) <= 1:
        return flag.resize((width, height))
    if flag.width > width:
        flag = render(svg_path, output_width=width)
    return extend_to_canvas(flag, width, height)


def main() -> None:
    height = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_HEIGHT
    width = round(height * CANVAS_RATIO)
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    codes = [c["code"].lower() for c in json.loads(COUNTRIES_FILE.read_text())]
    print(f"Generating {len(codes)} PNGs at {width}x{height}...")

    failed = []
    for code in codes:
        try:
            render_flag(INPUT_FOLDER / f"{code}.svg", width, height).save(
                OUTPUT_FOLDER / f"{code}.png", optimize=True
            )
        except Exception as e:
            failed.append(code)
            print(f"Failed to generate PNG for {code}: {e}")

    print(f"Done! {len(codes) - len(failed)} generated, {len(failed)} failed.")


if __name__ == "__main__":
    main()
