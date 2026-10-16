#!/usr/bin/env bash
# Capture everything a reviewer needs for one direction.
# usage: shootall.sh <slug> <outdir> [port=8820]
# Needs the lab served at http://127.0.0.1:<port>/ (cd design-lab/landing && npx http-server -p <port> -c-1 -s .)
# Writes into <outdir>:
#   settled-{desktop,phone}-{fold,full}.png   page at rest (?t=6000), plus console and overflow report in report.txt
#   t1500/t3000/t4800-{desktop,phone}-fold.png hero frames
#   reduced-{desktop,phone}-fold.png           reduced-motion still (?reduce=1)
#   d-NN.png (desktop tiles, 900px), p-NN.png (phone tiles, 1700px)
#   motion-desktop-NN.png, motion-phone-NN.png frames every 0.5s from media/hero-*.mp4 (if present)
set -u
SLUG="$1"; OUT="$2"; PORT="${3:-8820}"
TOOLS="$(cd "$(dirname "$0")" && pwd)"
LAB=/home/user/NewWebsite/design-lab/landing
URL="http://127.0.0.1:${PORT}/${SLUG}/index.html"
mkdir -p "$OUT"
if ! curl -s -o /dev/null "$URL"; then
  (cd "$LAB" && npx --yes http-server -p "$PORT" -c-1 -s . > /dev/null 2>&1 &)
  sleep 3
fi
{
  echo "== settled"; node "$TOOLS/shot.mjs" "$URL?t=6000" "$OUT/settled" 3000
  for t in 1500 3000 4800; do echo "== t$t"; node "$TOOLS/shot.mjs" "$URL?t=$t" "$OUT/t$t" 2000 --fold-only; done
  echo "== reduced"; node "$TOOLS/shot.mjs" "$URL?reduce=1" "$OUT/reduced" 2000 --fold-only --reduce
} > "$OUT/report.txt" 2>&1
python3 -I "$TOOLS/tiles.py" "$OUT/settled-desktop-full.png" "$OUT/d" 900 0.6 >> "$OUT/report.txt" 2>&1
python3 -I "$TOOLS/tiles.py" "$OUT/settled-phone-full.png" "$OUT/p" 1700 0.75 >> "$OUT/report.txt" 2>&1
for k in desktop phone; do
  f="$LAB/$SLUG/media/hero-$k.mp4"
  if [ -f "$f" ]; then
    ffmpeg -y -loglevel error -i "$f" -vf "fps=2,scale='min(960,iw)':-2" "$OUT/motion-$k-%02d.png"
  fi
done
echo "files:" >> "$OUT/report.txt"; ls "$OUT" | grep -v report.txt | tr '\n' ' ' >> "$OUT/report.txt"; echo >> "$OUT/report.txt"
cat "$OUT/report.txt" | grep -v "^done"
