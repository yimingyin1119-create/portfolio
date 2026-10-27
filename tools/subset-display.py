# Cuts a title face down to the characters the page's titles use.
# Usage (from tools/): node display-chars.mjs | uv run --no-project --python 3.12 --with fonttools --with brotli python -I subset-display.py <font> <name> [wght]
#   serif fallback: <NotoSerifSC[wght].ttf> display-serif-900 900   (github.com/google/fonts ofl/notoserifsc, OFL)
#   brush titles:   <ZiKuXingQiuFeiYangTi-2.ttf> display-hand        (字库星球飞扬体; glyphs it lacks fall back to the serif)
#   text faces:    node page-chars.mjs | … subset-display.py <SourceHanSerifCN-Medium.otf> text-500   (and -Bold → text-700, 江城斜宋体 900W → display-song)
# The subset is renamed after <name>: the OFL reserves the source's own name for unmodified copies.
# Writes ../assets/fonts/<name>.woff2 and <name>.chars; characters the font lacks go to <name>.missing.
import sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

chars = sys.stdin.read()
src, name = sys.argv[1], sys.argv[2]
out = Path(__file__).resolve().parent.parent / 'assets' / 'fonts'
font = TTFont(src)
if 'fvar' in font: font = instantiateVariableFont(font, {'wght': float(sys.argv[3]) if len(sys.argv) > 3 else 400})
cmap = font.getBestCmap()
have = ''.join(c for c in chars if ord(c) in cmap)
missing = ''.join(c for c in chars if ord(c) not in cmap)
opts = subset.Options(); opts.flavor = 'woff2'; opts.hinting = False; opts.desubroutinize = True; opts.layout_features = ['kern', 'palt', 'vert']; opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
sub = subset.Subsetter(opts); sub.populate(text=have); sub.subset(font)
for rec in font['name'].names:
    if rec.nameID in (1, 3, 4, 6, 16, 17):
        rec.string = f'EO {name}' if rec.nameID != 6 else f'EO-{name}'
font.flavor = 'woff2'; font.save(out / f'{name}.woff2')
(out / f'{name}.chars').write_text(have, encoding='utf-8')
(out / f'{name}.missing').write_text(missing, encoding='utf-8')
print(name, len(have), 'chars', (out / f'{name}.woff2').stat().st_size // 1024, 'KB', f'(missing {missing!r})' if missing else '')
