# Cuts the title face down to the characters the page's titles use.
# Usage (from tools/): node display-chars.mjs | uv run --no-project --python 3.12 --with fonttools --with brotli python -I subset-display.py <NotoSerifSC[wght].ttf>
# Source font: github.com/google/fonts/tree/main/ofl/notoserifsc (OFL). Writes ../assets/fonts/display-serif-900.woff2 and display.chars.
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

chars = sys.stdin.read()
out = Path(__file__).resolve().parent.parent / 'assets' / 'fonts'
font = instantiateVariableFont(TTFont(sys.argv[1]), {'wght': 900})
missing = [c for c in chars if ord(c) not in font.getBestCmap()]
if missing: sys.exit(f'font lacks: {"".join(missing)}')
opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['kern', 'palt', 'vert']; opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
sub = subset.Subsetter(opts); sub.populate(text=chars); sub.subset(font)
font.flavor = 'woff2'; font.save(out / 'display-serif-900.woff2')
(out / 'display.chars').write_text(chars, encoding='utf-8')
print(len(chars), 'chars', (out / 'display-serif-900.woff2').stat().st_size, 'bytes')
