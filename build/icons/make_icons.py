"""Gera os ícones otimizados (assets/img/ico/) a partir dos PNGs originais da pasta icones-menu/ (que não são alterados).
Uso: python3 build/icons/make_icons.py <pasta icones-menu> [<pasta com sol e lua>] """
import sys, os
from math import gcd
from functools import reduce
from PIL import Image
import numpy as np

SRC = sys.argv[1] if len(sys.argv) > 1 else 'icones-menu'
SRC2 = sys.argv[2] if len(sys.argv) > 2 else SRC          # pasta do sol e da lua (icones/)
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'img', 'ico')
K = 4                                           # cada "pixel de arte" vira 4×4 px na versão otimizada


def limpa(img):
    """pixels meio-transparentes (sombras/brilhos suaves do arquivo) viram transparentes: o ícone é pixel art de cores chapadas."""
    a = np.array(img.convert('RGBA')); a[a[:, :, 3] < 200] = 0; a[:, :, 3] = np.where(a[:, :, 3] > 0, 255, 0)
    return Image.fromarray(a)


def unidade(a):
    """tamanho do pixel de arte: mdc dos comprimentos de corrida de COR (opaca ou transparente) em linhas e colunas.
    (medir só a silhueta errava: a moeda tem detalhes internos de metade do tamanho e virava uma grade 7x7 torta)"""
    runs = []
    for arr in list(a[::5]) + list(np.transpose(a, (1, 0, 2))[::5]):
        d = np.any(arr[1:] != arr[:-1], axis=1)
        idx = np.concatenate(([0], np.where(d)[0] + 1, [len(arr)]))
        runs += [int(r) for r in np.diff(idx)]
    return reduce(gcd, runs)


def grade(img, quadrado=True, n=None):
    img = limpa(img)
    a = np.array(img)
    u = unidade(a) if n is None else None
    ys, xs = np.where(a[:, :, 3] > 0)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rec = img.convert('RGBA').crop((x0, y0, x1, y1))
    w, h = ((x1 - x0) // u, (y1 - y0) // u) if n is None else (n, n)   # n = grade fixa (o sol novo tem 20×20, com unidade 102,4 px, não inteira)
    pq = rec.resize((w, h), Image.NEAREST)           # 1 pixel de arte = 1 pixel
    if quadrado:
        s = max(w, h); c = Image.new('RGBA', (s, s), (0, 0, 0, 0)); c.alpha_composite(pq, ((s - w) // 2, (s - h) // 2)); pq = c
    return pq, u


def salvar(pq, nome):
    g = pq.resize((pq.width * K, pq.height * K), Image.NEAREST)
    g.save(os.path.join(OUT, nome), optimize=True)
    print(nome, 'grade', pq.size, '->', g.size)


os.makedirs(OUT, exist_ok=True)
for nome, pasta, f in (('moeda', SRC, 'moeda-icone.png'), ('carvao', SRC, 'carvao-icone.png'), ('sol', SRC2, 'sol-icone.png'), ('lua', SRC2, 'lua-icone.png')):
    pq, u = grade(Image.open(os.path.join(pasta, f)), n=20 if nome == 'sol' else None)
    print(nome, 'unidade', u)
    salvar(pq, nome + '.png')

# fogo: 3 quadros 1300×1300; recorta a área comum, centraliza num quadrado e junta numa faixa horizontal
fogo = Image.open(os.path.join(SRC, 'fogo-icone.png')).convert('RGBA')
quadros = [fogo.crop((i * 1300, 0, (i + 1) * 1300, 1300)) for i in range(3)]
u = unidade(np.array(fogo.crop((0, 0, 1300, 1300))))
caixas = [np.where(np.array(q)[:, :, 3] > 0) for q in quadros]
x0 = min(c[1].min() for c in caixas); x1 = max(c[1].max() for c in caixas) + 1
y0 = min(c[0].min() for c in caixas); y1 = max(c[0].max() for c in caixas) + 1
w, h = (x1 - x0) // u, (y1 - y0) // u
lado = max(w, h)
print('fogo unidade', u, 'área comum (grade)', w, 'x', h, '-> célula', lado)
cel = []
for q in quadros:
    pq = q.crop((x0, y0, x1, y1)).resize((w, h), Image.NEAREST)
    c = Image.new('RGBA', (lado, lado), (0, 0, 0, 0)); c.alpha_composite(pq, ((lado - w) // 2, lado - h)); cel.append(c)   # base alinhada embaixo: a chama não "pula"
faixa = Image.new('RGBA', (lado * 3, lado), (0, 0, 0, 0))
for i, c in enumerate(cel): faixa.paste(c, (i * lado, 0))
faixa.resize((faixa.width * K, faixa.height * K), Image.NEAREST).save(os.path.join(OUT, 'fogo.png'), optimize=True)
# estado apagado: o mesmo desenho em cinza escuro (quadro 0), sem animação
ap = cel[0].copy(); px = ap.load()
for y in range(ap.height):
    for x in range(ap.width):
        r, g, b, a = px[x, y]
        if a: v = int(0.3 * r + 0.59 * g + 0.11 * b); v = int(v * 0.55 + 40); px[x, y] = (v, v, min(255, v + 12), a)
ap.resize((ap.width * K, ap.height * K), Image.NEAREST).save(os.path.join(OUT, 'fogo-apagado.png'), optimize=True)
print('ok')
