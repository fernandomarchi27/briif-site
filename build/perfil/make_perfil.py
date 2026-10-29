"""Otimiza as fotos de perfil (profile-pics/*.png, 1020–2100 px) para assets/img/perfil/<id>.png.
Cada imagem é pixel art: mede o "pixel de arte" (mdc dos comprimentos de corrida de cor), reduz para a grade real e amplia com
vizinho mais próximo para ~200–250 px. Os originais não são alterados. Uso: python3 build/perfil/make_perfil.py <pasta profile-pics>"""
import sys, os
from math import gcd
from functools import reduce
from PIL import Image
import numpy as np
SRC = sys.argv[1]; OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'img', 'perfil')
os.makedirs(OUT, exist_ok=True)
for n in ('boss', 'bubu', 'fefe', 'fogo', 'iaia', 'mago', 'mao', 'moeda', 'pi', 'riri'):
    im = Image.open(os.path.join(SRC, n + '.png')).convert('RGBA'); a = np.array(im)
    runs = []
    for arr in list(a[::7]) + list(np.transpose(a, (1, 0, 2))[::7]):
        d = np.any(arr[1:] != arr[:-1], axis=1); idx = np.concatenate(([0], np.where(d)[0] + 1, [len(arr)])); runs += list(np.diff(idx))
    u = reduce(gcd, [int(r) for r in runs])
    g = max(1, im.width // u)
    pq = im.resize((g, g), Image.NEAREST)
    k = max(1, round(220 / g)); out = pq.resize((g * k, g * k), Image.NEAREST)
    out.save(os.path.join(OUT, 'foto-' + n + '.png'), optimize=True)
    print(n, 'pixel de arte', u, 'grade', g, '->', out.size, os.path.getsize(os.path.join(OUT, 'foto-' + n + '.png')) // 1024, 'KB')
