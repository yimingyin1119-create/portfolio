#!/bin/sh
# Builds the offline demo of 饭搭子 into ../kitchen from the committed HEAD of the pixel-kitchen repo.
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
SRC=${PK_REPO:-$HOME/Developer/pixel-kitchen}
OUT="$HERE/../kitchen"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git -C "$SRC" archive HEAD | tar -x -C "$TMP"
ln -s "$SRC/web/node_modules" "$TMP/web/node_modules"
mkdir -p "$TMP/web/src/demo"
cp "$HERE/api.demo.js" "$HERE/main.demo.jsx" "$TMP/web/src/demo/"
cp "$HERE/vite.demo.config.js" "$TMP/web/"
sed -i '' -e 's#/src/main.jsx#/src/demo/main.demo.jsx#' -e 's#<title>\(.*\)</title>#<title>\1 · 演示版</title>#' "$TMP/web/index.html"
(cd "$TMP/web" && ./node_modules/.bin/vite build --config vite.demo.config.js --base ./ --outDir "$OUT" --emptyOutDir)
# the real build serves fonts from /pixel-kitchen/; here they sit next to the assets folder
sed -i '' 's#/pixel-kitchen/fonts/#../fonts/#g' "$OUT"/assets/*.css
echo "built from $(git -C "$SRC" rev-parse --short HEAD) into $OUT"
