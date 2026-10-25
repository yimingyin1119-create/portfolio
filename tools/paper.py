# Generates the seamless paper tiles in assets/tex/: kraft (page) and parchment (cards).
# usage (from tools/): uv run --no-project --python 3.12 --with numpy --with pillow python -I paper.py
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'tex'
N = 512
rng = np.random.default_rng(7)

def periodic_noise(scale):
    """Smooth noise that tiles: random spectrum limited to low frequencies, back through an inverse FFT."""
    f = np.fft.fftfreq(N)
    r = np.sqrt(f[:, None] ** 2 + f[None, :] ** 2)
    spec = (rng.normal(size=(N, N)) + 1j * rng.normal(size=(N, N))) * np.exp(-(r * scale) ** 2)
    n = np.real(np.fft.ifft2(spec))
    return (n - n.mean()) / (n.std() + 1e-9)

def fibres(count, length, width, alpha):
    """Short pale and dark strands, drawn wrapped so the tile stays seamless."""
    layer = Image.new('LA', (N, N), (0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        x, y = rng.uniform(0, N, 2)
        ang = rng.normal(0, .5)
        L = rng.uniform(*length)
        dx, dy = np.cos(ang) * L, np.sin(ang) * L
        tone = 255 if rng.random() < .55 else 0
        a = int(rng.uniform(*alpha))
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                d.line([(x + ox, y + oy), (x + dx + ox, y + dy + oy)], fill=(tone, a), width=width)
    return layer

def paper(base, mottle, grain, fib, name, q):
    m = periodic_noise(5) * mottle + periodic_noise(18) * mottle * .45
    g = np.array(Image.fromarray(np.clip(rng.normal(128, grain * 8, (N, N)), 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6)), float) / 8 - 16
    img = np.clip(np.array(base, float)[None, None, :] * (1 + (m + g)[..., None] / 100), 0, 255).astype(np.uint8)
    im = Image.fromarray(img, 'RGB')
    for count, length, width, alpha in fib:
        lay = fibres(count, length, width, alpha).filter(ImageFilter.GaussianBlur(.4))
        tone = Image.new('RGB', (N, N))
        l, a = lay.split()
        tone.paste(Image.merge('RGB', (l, l, l)))
        mix = Image.blend(im, Image.merge('RGB', [Image.eval(c, lambda v: v) for c in tone.split()]), 1)
        im = Image.composite(mix, im, a)
    im.save(OUT / name, 'WEBP', quality=q, method=6)
    print(name, (OUT / name).stat().st_size // 1024, 'KB')

paper((190, 152, 106), 5.5, .7, [(1100, (12, 40), 1, (12, 30)), (220, (30, 80), 1, (10, 22))], 'kraft.webp', 84)
paper((241, 227, 196), 3, .5, [(500, (12, 36), 1, (6, 16))], 'parchment.webp', 84)
