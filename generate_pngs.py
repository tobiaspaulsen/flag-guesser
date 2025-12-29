import sys
from pathlib import Path
from cairosvg import svg2png

INPUT_FOLDER = "static/countries/svg"
OUTPUT_FOLDER = "static/countries/png"
DEFAULT_HEIGHT = 512

Path(OUTPUT_FOLDER).mkdir(parents=True, exist_ok=True)

arguments = sys.argv[1:]
if len(arguments) >= 1:
    height = int(arguments[0])
else:
    height = DEFAULT_HEIGHT

print(f"Generating PNGs with height {height}...")

for country_svg in Path(INPUT_FOLDER).glob("*.svg"):
    country_code = country_svg.stem
    print(country_svg)
    print(f"Generating PNG for {country_code}...")
    try:
        svg2png(
            url=str(country_svg),
            write_to=f"{OUTPUT_FOLDER}/{country_code}.png",
            output_height=height,
        )
    except Exception as e:
        print(f"Failed to generate PNG for {country_code}: {e}")


print("Done!")