"""Fonte pixel própria só para NÚMEROS e símbolos matemáticos (assets/fonts/briiff-numeros.woff2).
Grade 5×7, cada pixel é um quadrado (nada arredondado, como o logo). O site usa com unicode-range: as letras continuam na fonte normal.
Uso: python3 build/fonte/make_fonte.py"""
import os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

CEL = 100                                  # 1 pixel de arte = 100 unidades; altura 700; avanço 600
G = {
 '0': ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
 '1': ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
 '2': ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
 '3': ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
 '4': ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
 '5': ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
 '6': ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
 '7': ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
 '8': ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
 '9': ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
 '.': ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
 ',': ["00000", "00000", "00000", "00000", "00000", "01100", "01100", "00100", "01000"],
 ':': ["00000", "01100", "01100", "00000", "00000", "01100", "01100"],
 '%': ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
 '+': ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
 '-': ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
 '\u2212': ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
 '\u00d7': ["00000", "10001", "01010", "00100", "01010", "10001", "00000"],
 '\u00f7': ["00000", "00100", "00000", "11111", "00000", "00100", "00000"],
 '/': ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
 '=': ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
}
NOMES = {'.': 'period', ',': 'comma', ':': 'colon', '%': 'percent', '+': 'plus', '-': 'hyphen', '\u2212': 'minus', '\u00d7': 'multiply', '\u00f7': 'divide', '/': 'slash', '=': 'equal'}
nome = lambda c: ('uni%04X' % ord(c)) if not c.isdigit() else {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'}[c]

ordem = ['.notdef', 'space'] + [nome(c) for c in G]
fb = FontBuilder(1000, isTTF=True)
fb.setupGlyphOrder(ordem)
fb.setupCharacterMap({32: 'space', **{ord(c): nome(c) for c in G}})
glifos, metricas = {}, {}
pen = TTGlyphPen(None); glifos['.notdef'] = pen.glyph(); metricas['.notdef'] = (600, 0)
pen = TTGlyphPen(None); glifos['space'] = pen.glyph(); metricas['space'] = (600, 0)
for c, linhas in G.items():
    pen = TTGlyphPen(None)
    for j, ln in enumerate(linhas):
        for i, v in enumerate(ln):
            if v != '1': continue
            x0, x1 = i * CEL, (i + 1) * CEL
            y1 = (7 - j) * CEL; y0 = y1 - CEL            # linha 0 = topo (y=700); linhas além da 7ª descem abaixo da linha de base
            pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
    glifos[nome(c)] = pen.glyph(); metricas[nome(c)] = (600, 0)
fb.setupGlyf(glifos)
fb.setupHorizontalMetrics(metricas)
fb.setupHorizontalHeader(ascent=800, descent=-200)
fb.setupNameTable({'familyName': 'Briiff Numeros', 'styleName': 'Regular'})
fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, usWinAscent=900, usWinDescent=250)
fb.setupPost()
saida = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'fonts')
fb.save(os.path.join(saida, 'briiff-numeros.ttf'))
from fontTools.ttLib import TTFont
f = TTFont(os.path.join(saida, 'briiff-numeros.ttf'))
try:
    f.flavor = 'woff2'; f.save(os.path.join(saida, 'briiff-numeros.woff2')); print('woff2 ok')
except Exception as e:
    f.flavor = 'woff'; f.save(os.path.join(saida, 'briiff-numeros.woff')); print('woff (sem brotli):', e)
os.remove(os.path.join(saida, 'briiff-numeros.ttf'))
