"""Recorta a animação do Briiff do spritesheet original (intro_fundo_spritesheet_high.png: 28 quadros de 840×1491).
- quadros 0–22 = animação do logo (π → BRIIFF); 23–27 repetem o logo final e acrescentam os botões de login: ficam de fora
- cada quadro é recortado só na área do logo; o fundo roxo vira transparente e o logo vira uma máscara branca,
  que o site pinta com a cor do tema (canvas, 'source-in')
Saída: assets/img/intro-briiff.png (grade 6×4 de células 760×400). O arquivo original não é alterado.
Uso: python3 build/intro/make_intro.py <caminho do intro_fundo_spritesheet_high.png>"""
import sys, os
from PIL import Image
import numpy as np

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'img', 'intro-briiff.png')
FW, FH, N = 840, 1491, 23
CROP = (40, 480, 800, 880)          # x0, y0, x1, y1 — cobre o logo em todos os quadros (bbox medido: x 56–783, y 497–860)
COLS, ROWS = 6, 4

sp = Image.open(SRC).convert('RGBA')
bg = np.array(sp)[0, 0, :3]
cw, ch = CROP[2] - CROP[0], CROP[3] - CROP[1]
sheet = Image.new('RGBA', (cw * COLS, ch * ROWS), (0, 0, 0, 0))
for i in range(N):
    q = np.array(sp.crop((i * FW, 0, (i + 1) * FW, FH)).crop(CROP))
    diff = np.abs(q[:, :, :3].astype(int) - bg.astype(int)).sum(axis=2) > 30
    out = np.zeros_like(q); out[diff] = (255, 255, 255, 255)
    sheet.paste(Image.fromarray(out), ((i % COLS) * cw, (i // COLS) * ch))
sheet.save(OUT, optimize=True)
print('quadros', N, 'célula', (cw, ch), 'folha', sheet.size, os.path.getsize(OUT) // 1024, 'KB')
