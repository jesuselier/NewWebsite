# Cut a full-page screenshot into viewport-sized tiles for review.
# usage: python3 -I tiles.py <full.png> <outPrefix> [tileHeight=900] [scale=1.0]
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
th = int(sys.argv[3]) if len(sys.argv) > 3 else 900
sc = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
im = Image.open(src); w, h = im.size; n = 0
for y in range(0, h, th):
    t = im.crop((0, y, w, min(h, y + th)))
    if sc != 1.0: t = t.resize((int(t.size[0] * sc), int(t.size[1] * sc)))
    t.save(f"{out}-{n:02d}.png"); n += 1
print(f"{n} tiles of {th}px from {w}x{h}")
