# Isolated motion assets

These assets were extracted from the final PDF-compatible Illustrator artwork. Foreground PNGs are RGBA with tight alpha bounds: they contain no paper-background rectangle and no neighboring crop pixels. Coordinates are in `manifest.json` / `manifest.csv` on the 1920 × 1068 source artboard.

Primary character and sketch targets also have true SVG files (`character-tiger`, `character-rabbit-and-ladder`, `sketch-gold`, `sketch-wind-and-lake`, `sketch-green-tree-left`, `milk-carton-extra`). The main page uses the same vector-derived artwork as tightly cropped alpha PNGs for predictable browser compositing.

The production static page currently uses the equivalent set in `../elements-transparent/`, whose assembled output was visually compared against `../hoban-final-approved.jpg`.
