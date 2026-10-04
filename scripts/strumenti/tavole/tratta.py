import sys
from PIL import Image, ImageOps, ImageFilter
import numpy as np

def hexrgb(h): return np.array([int(h[i:i+2],16) for i in (1,3,5)],dtype=float)

def corsa(v, soglia):
    """La sequenza contigua più lunga di valori sopra soglia (tollera buchi brevi)."""
    ok = v > soglia; best = (0, len(v)); i = 0; n = len(v); gap = max(3, n // 100)
    while i < n:
        if not ok[i]: i += 1; continue
        j = i; buco = 0
        while j < n and buco <= gap:
            buco = 0 if ok[j] else buco + 1; j += 1
        j -= buco
        if j - i > best[1] - best[0] or best == (0, n): best = (i, j)
        i = j + 1
    return best

def ritaglia(im, w, h, cy=0.5, extra=0.02, box=None):
    """Taglia la lastra (senza margine di carta né didascalia) al formato w:h, centrata.
    box: riquadro della lastra in frazioni (x0, y0, x1, y1), quando il riconoscimento automatico sbaglia."""
    if box:
        W, H = im.size; im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H))); extra = 0
    else:
        g = np.asarray(im.convert('L'), dtype=float)
        carta = np.median(np.concatenate([g[:20].ravel(), g[-20:].ravel(), g[:, :20].ravel(), g[:, -20:].ravel()]))
        inchiostro = g < carta - 60
        r0, r1 = corsa(inchiostro.mean(1), 0.12)
        c0, c1 = corsa(inchiostro[r0:r1].mean(0), 0.12)
        im = im.crop((c0, r0, c1, r1))
    W, H = im.size; m = int(min(W, H) * extra); im = im.crop((m, m, W - m, H - m)); W, H = im.size
    if W / H > w / h: nw = int(H * w / h); x = (W - nw) // 2; im = im.crop((x, 0, x + nw, H))
    else: nh = int(W * h / w); y = int((H - nh) * cy); im = im.crop((0, y, W, y + nh))
    return im.resize((w, h), Image.LANCZOS)

def gradiente(g, stops):
    """g in 0..1 -> colore interpolato fra gli stop [(pos, '#hex')]."""
    out = np.zeros(g.shape + (3,))
    pos = [p for p, _ in stops]; cols = [hexrgb(c) for _, c in stops]
    for k in range(3): out[..., k] = np.interp(g, pos, [c[k] for c in cols])
    return out

def tratta(src, dst, w, h, variante, box=None, cy=0.5):
    im = Image.open(src).convert('L')
    im = ritaglia(im, w, h, cy=cy, box=box)
    im = ImageOps.autocontrast(im, cutoff=1)
    g = np.asarray(im, dtype=float) / 255
    if variante == 'notte':   # lastra rovesciata: inchiostro chiaro su fondo scuro, come una tavola del Codex di notte
        g = 1 - g
        c = gradiente(g, [(0, '#0b1216'), (0.35, '#16262d'), (0.7, '#8a7a5c'), (1, '#efe3c8')])
    else:                     # seppia: carta brunita, inchiostro blu-nero
        c = gradiente(g, [(0, '#0d1418'), (0.45, '#3a3328'), (0.8, '#b59f78'), (1, '#e3d3b0')])
    # vignetta
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    v = np.clip(1 - 0.45 * np.clip(d - 0.55, 0, 1) ** 1.4, 0, 1)
    c = c * v[..., None] + hexrgb('#0d1418') * (1 - v[..., None])
    Image.fromarray(np.clip(c, 0, 255).astype('uint8')).save(dst, quality=72 if w < 500 else 70)

if __name__ == '__main__':
    tratta(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5])

def ritratto(src, dst, w, h, box, cx=0.5, cy=0.5):
    """Una figura in un riquadro 3:4 al centro della tavola w:h, che nel gioco si ritaglia a 3:4 (ritratti) o 16:9;
    ai lati la carta della stampa, che sfuma nel fondo."""
    im = Image.open(src).convert('L')
    W, H = im.size; im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    W, H = im.size; a = 3 / 4
    if W / H > a: nw = int(H * a); x = int(min(max(cx * W - nw / 2, 0), W - nw)); im = im.crop((x, 0, x + nw, H))
    else: nh = int(W / a); y = int(min(max(cy * H - nh / 2, 0), H - nh)); im = im.crop((0, y, W, y + nh))
    fw = int(h * a); im = ImageOps.autocontrast(im.resize((fw, h), Image.LANCZOS), cutoff=1)
    g = np.asarray(im, dtype=float) / 255
    carta = np.median(np.concatenate([g[:, :8].ravel(), g[:, -8:].ravel()]))
    tela = np.full((h, w), carta); x0 = (w - fw) // 2
    # sfumatura fra la figura e la carta, per non vedere il bordo del riquadro
    m = np.ones(fw); f = fw // 10; m[:f] = np.linspace(0, 1, f); m[-f:] = np.linspace(1, 0, f)
    tela[:, x0:x0 + fw] = g * m + carta * (1 - m)
    c = gradiente(tela, [(0, '#0d1418'), (0.45, '#3a3328'), (0.8, '#b59f78'), (1, '#e3d3b0')])
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    v = np.clip(1 - 0.55 * np.clip(d - 0.45, 0, 1) ** 1.2, 0, 1)
    c = c * v[..., None] + hexrgb('#0d1418') * (1 - v[..., None])
    Image.fromarray(np.clip(c, 0, 255).astype('uint8')).save(dst, quality=72 if w < 500 else 70)
