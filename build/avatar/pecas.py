"""Gerador das peças de avatar (magos de RPG em pixel art, grade 32x50).
Cada peça é um sprite de texto (x, y, linhas). Letras: S/s pele, H/h cabelo, B/b barba, R/r manto, O/o ornamento,
E olhos, K contorno, W branco, M/L boca, G/g ouro, V/v prata, N/n madeira, C/c/q cristal, P roxo arcano.
O eixo de simetria do rosto fica entre as colunas 15 e 16 (x -> 31 - x)."""
W, H = 32, 50
AX = 31


class Grade:
    def __init__(self):
        self.g = [[' '] * W for _ in range(H)]

    def p(self, x, y, ch):
        if 0 <= x < W and 0 <= y < H:
            self.g[y][x] = ch

    def r(self, x, y, w, h, ch):
        for j in range(h):
            for i in range(w):
                self.p(x + i, y + j, ch)

    def lin(self, y, x0, x1, ch):
        for x in range(x0, x1 + 1):
            self.p(x, y, ch)

    def sim(self, x, y, ch):             # ponto espelhado
        self.p(x, y, ch); self.p(AX - x, y, ch)

    def simlin(self, y, x0, x1, ch):     # faixa espelhada
        self.lin(y, x0, x1, ch); self.lin(y, AX - x1, AX - x0, ch)

    def tab(self, linhas, x, y, mapa=None, sim=False):   # desenha texto; ' ' e '.' = vazio
        for j, ln in enumerate(linhas):
            for i, c in enumerate(ln):
                if c in ' .':
                    continue
                c = (mapa or {}).get(c, c)
                self.p(x + i, y + j, c)
                if sim:
                    self.p(AX - (x + i), y + j, c)

    def tem(self, x, y):
        return 0 <= x < W and 0 <= y < H and self.g[y][x] != ' '

    def sombra_auto(self, claro, escuro, dir_dir=True):
        """pixels da cor `claro` ganham a tom `escuro` quando não há nada embaixo (borda inferior) ou à direita (metade direita)."""
        novo = [l[:] for l in self.g]
        for y in range(H):
            for x in range(W):
                if self.g[y][x] != claro:
                    continue
                abaixo = y + 1 >= H or self.g[y + 1][x] != claro
                direita = dir_dir and x >= 16 and (x + 1 >= W or self.g[y][x + 1] != claro)
                if abaixo or direita:
                    novo[y][x] = escuro
        self.g = novo

    def sprite(self):
        ys = [y for y in range(H) if any(c != ' ' for c in self.g[y])]
        if not ys:
            return None
        xs = [x for x in range(W) if any(self.g[y][x] != ' ' for y in range(H))]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        return {"x": x0, "y": y0, "r": [''.join(self.g[y][x0:x1 + 1]) for y in range(y0, y1 + 1)]}

    def mascara(self):
        return {(x, y) for y in range(H) for x in range(W) if self.g[y][x] != ' '}


def escurece(hexcor, f=0.72):
    h = hexcor.lstrip('#'); r, g, b = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02X%02X%02X' % (int(r * f), int(g * f), int(b * f))


def mistura(a, b, t):
    a = a.lstrip('#'); b = b.lstrip('#')
    ca = [int(a[i:i + 2], 16) for i in (0, 2, 4)]; cb = [int(b[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02X%02X%02X' % tuple(int(ca[i] * (1 - t) + cb[i] * t) for i in range(3))


# ------------------------------------------------------------------ paletas
PELES = [  # id, nome, cor, sombra
    ('p1', 'Muito clara', '#FBE3D3', '#D9B8A4'), ('p2', 'Clara', '#F5D0B5', '#D2A98F'), ('p3', 'Rosada', '#EEB89A', '#C9917A'),
    ('p4', 'Média clara', '#E3A67F', '#BD7F5C'), ('p5', 'Oliva', '#CE9B6B', '#A87749'), ('p6', 'Morena', '#B87F52', '#936036'),
    ('p7', 'Parda', '#9C6A43', '#7A4F2D'), ('p8', 'Negra clara', '#7D5232', '#5F3A20'), ('p9', 'Negra', '#5E3B22', '#452716'),
    ('p10', 'Negra escura', '#432919', '#2E1B0F'), ('p11', 'Albina', '#FFE8E3', '#E5BFC0'), ('p12', 'Azulada', '#8FB8E8', '#6A91C2'),
    ('p13', 'Esverdeada', '#9BCF8F', '#76A86C'), ('p14', 'Acinzentada', '#B3B3BF', '#8B8B99'), ('p15', 'Arroxeada', '#B79AE0', '#9376BE'),
    ('p16', 'Avermelhada', '#D96B6B', '#B04A4A')]
CABELOS = [
    ('c1', 'Preto', '#1E1A22'), ('c2', 'Castanho escuro', '#3B2A20'), ('c3', 'Castanho', '#5A3B25'), ('c4', 'Castanho claro', '#7A5230'),
    ('c5', 'Ruivo', '#A8481F'), ('c6', 'Ruivo claro', '#D0702E'), ('c7', 'Loiro escuro', '#A98748'), ('c8', 'Loiro', '#D8B863'),
    ('c9', 'Platinado', '#EBDDA8'), ('c10', 'Branco', '#F0F0F4'), ('c11', 'Cinza', '#A2A2AE'), ('c12', 'Grafite', '#5E5E6C'),
    ('c13', 'Azul', '#3E6FD6'), ('c14', 'Azul claro', '#62B0F0'), ('c15', 'Verde', '#3FA362'), ('c16', 'Menta', '#7BD6A4'),
    ('c17', 'Roxo', '#7B4FD0'), ('c18', 'Lilás', '#B79AE8'), ('c19', 'Rosa', '#E468A8'), ('c20', 'Rosa claro', '#F3A6C8'),
    ('c21', 'Vermelho', '#C73333'), ('c22', 'Laranja', '#E78A2E'), ('c23', 'Turquesa', '#2EC4B6'), ('c24', 'Dourado', '#E0B84A')]
OLHOS = [('e1', 'Castanho', '#5A3B25'), ('e2', 'Preto', '#1E1A22'), ('e3', 'Azul', '#3E6FD6'), ('e4', 'Verde', '#3FA362'),
         ('e5', 'Cinza', '#8A8A9A'), ('e6', 'Âmbar', '#D08A2E'), ('e7', 'Violeta', '#8E5BE0'), ('e8', 'Brilho arcano', '#5CD3FF')]
MANTOS = [  # id, nome, principal, ornamento
    ('m1', 'Roxo e ouro', '#4C3CAD', '#E0B84A'), ('m2', 'Roxo e prata', '#5B4BC4', '#C9CDD8'), ('m3', 'Preto e prata', '#26222F', '#C9CDD8'),
    ('m4', 'Preto e lilás', '#2A2338', '#B79AE8'), ('m5', 'Azul e ouro', '#2F5FC4', '#E0B84A'), ('m6', 'Marinho e prata', '#1D2F63', '#C9CDD8'),
    ('m7', 'Verde e ouro', '#2E8B57', '#E0B84A'), ('m8', 'Floresta e marfim', '#1F5A3A', '#EFE6C8'), ('m9', 'Vermelho e ouro', '#B3262E', '#E0B84A'),
    ('m10', 'Vinho e prata', '#6E1F3A', '#C9CDD8'), ('m11', 'Branco e dourado', '#EDEAF4', '#C99A2E'), ('m12', 'Marfim e roxo', '#E8DFC2', '#6B4FD0'),
    ('m13', 'Cinza e azul', '#6B6F80', '#7FC8F0'), ('m14', 'Laranja e preto', '#D2691E', '#26222F'), ('m15', 'Turquesa e prata', '#1FA39A', '#C9CDD8'),
    ('m16', 'Rosa e branco', '#C75A93', '#F5F1FF'), ('m17', 'Marrom e ouro', '#6B4226', '#E0B84A'), ('m18', 'Prata e roxo', '#AEB3C4', '#5B4BC4'),
    ('m19', 'Lilás e branco', '#8E7BE8', '#F5F1FF'), ('m20', 'Ônix e vermelho', '#1B1822', '#D6262D')]


# ------------------------------------------------------------------ base (sempre presente)
def base():
    b = {}
    g = Grade()                                                  # cabeça quadrada
    g.lin(8, 10, 21, 'S')
    for y in range(9, 21):
        g.lin(y, 9, 22, 'S')
    g.lin(21, 10, 21, 'S')
    for y in range(10, 21):
        g.p(22, y, 's')
    g.lin(21, 10, 21, 's')
    g.p(15, 17, 's'); g.p(16, 17, 's'); g.p(16, 16, 's')        # nariz
    b['cabeca'] = g.sprite()
    g = Grade()
    for y in (14, 15, 16):
        g.p(8, y, 'S'); g.p(23, y, 's')
    b['orelhas'] = g.sprite()
    g = Grade(); g.r(14, 22, 4, 3, 'S'); g.r(17, 22, 1, 3, 's'); b['pescoco'] = g.sprite()
    g = Grade()                                                  # mãos
    g.r(5, 36, 3, 3, 'S'); g.lin(38, 5, 7, 's'); g.p(7, 36, 's'); g.p(7, 37, 's')
    g.r(24, 32, 5, 4, 'S'); g.lin(35, 24, 28, 's'); g.p(28, 33, 's'); g.p(28, 34, 's')
    for x in (25, 26, 27): g.p(x, 33, 's')                       # dedos
    b['maos'] = g.sprite()
    g = Grade()
    for x in range(7, 25): g.p(x, 48, 'Z')
    for x in range(5, 27): g.p(x, 47, 'Z') if 6 <= x <= 25 else None
    b['sombra'] = g.sprite()
    # fundo fixo: parede de masmorra
    g = Grade()
    for y in range(H):
        for x in range(W):
            g.p(x, y, 'a')
    for y in range(0, H, 5):
        for x in range(W): g.p(x, y, 'k')
        off = 4 if (y // 5) % 2 else 0
        for x in range(off, W, 8):
            for j in range(1, 5): g.p(x, y + j, 'k')
    for y in range(H):
        for x in range(W):
            if (x * 7 + y * 13) % 29 == 0 and g.g[y][x] == 'a': g.p(x, y, 'j')
    b['fundo'] = g.sprite()
    return b


# ------------------------------------------------------------------ cabelo
def cabelo_item(nome):
    """devolve {'cabelo.tras': sprite, 'cabelo.frente': sprite}"""
    f, t = Grade(), Grade()

    def topo(g, y0=6, larg=8):                                   # calota básica
        g.simlin(y0, 11, 15, 'H')
        g.simlin(y0 + 1, 9, 15, 'H')
        for y in range(y0 + 2, 11):
            g.simlin(y, larg, 15, 'H')

    def costelas(g, a=11, b=13):
        for y in range(a, b + 1): g.simlin(y, 8, 9, 'H')

    if nome == 'raspado':
        for x in range(10, 22): f.p(x, 8, 's') if x % 3 == 0 else None
    elif nome == 'curto':
        topo(f); costelas(f)
    elif nome == 'lateral':
        topo(f); costelas(f); f.lin(11, 9, 17, 'H'); f.lin(12, 9, 12, 'H')
    elif nome == 'espetado':
        topo(f, 7); costelas(f)
        for x in (10, 13, 16, 19): f.p(x, 5, 'H'); f.p(x, 4, 'H') if x in (13, 19) else None; f.p(x + 1, 6, 'H')
    elif nome == 'bagunçado':
        topo(f, 6); costelas(f, 11, 14)
        for (x, y) in [(9, 5), (12, 4), (15, 5), (18, 4), (21, 5), (8, 7), (23, 7), (14, 3), (19, 6)]: f.p(x, y, 'H')
        f.lin(11, 10, 12, 'H'); f.lin(11, 18, 21, 'H'); f.p(15, 11, 'H')
    elif nome == 'topete':
        topo(f, 5); costelas(f)
        f.simlin(3, 12, 15, 'H'); f.simlin(4, 10, 15, 'H')
    elif nome == 'franja':
        topo(f); costelas(f)
        f.simlin(11, 9, 15, 'H'); f.simlin(12, 9, 13, 'H'); f.p(10, 13, 'H'); f.p(21, 13, 'H')
    elif nome == 'medio':
        topo(f); costelas(f, 11, 21)
        for y in range(11, 22): f.p(7, y, 'H'); f.p(24, y, 'H')
        f.simlin(11, 9, 12, 'H')
    elif nome == 'ondulado':
        topo(f); costelas(f, 11, 18)
        for y in range(11, 26):
            o = 1 if (y // 3) % 2 else 0
            f.p(7 - o, y, 'H'); f.p(8 - o, y, 'H') if y > 18 else None; f.p(24 + o, y, 'H'); f.p(23 + o, y, 'H') if y > 18 else None
        f.simlin(11, 9, 12, 'H')
        for y in range(10, 27): t.simlin(y, 7, 9, 'H')
    elif nome == 'longo':
        topo(f); costelas(f, 11, 22)
        f.simlin(11, 9, 12, 'H')
        for y in range(11, 31): f.simlin(y, 6, 8, 'H') if y > 22 else f.simlin(y, 7, 8, 'H')
        for y in range(10, 36): t.simlin(y, 6, 15, 'H')
    elif nome == 'longo_ondulado':
        topo(f); costelas(f, 11, 22)
        f.simlin(11, 9, 12, 'H')
        for y in range(11, 33):
            o = 1 if (y // 3) % 2 else 0
            f.simlin(y, 6 - o, 8 - o, 'H') if y > 22 else f.simlin(y, 7, 8, 'H')
        for y in range(10, 38):
            o = 1 if (y // 3) % 2 else 0
            t.simlin(y, 5 - o, 15, 'H')
    elif nome == 'cacheado':
        for y in range(3, 17):
            ex = {3: 11, 4: 8, 5: 7, 6: 6, 7: 5}.get(y, 5 if y < 15 else 6)
            f.simlin(y, ex, 15, 'H')
        for y in range(11, 17): f.simlin(y, 5, 9, 'H')
        f.simlin(11, 9, 12, 'H') ; f.simlin(12, 10, 11, 'H')
        for (x, y) in [(10, 3), (14, 2), (18, 3), (7, 4)]: f.p(x, y, 'H'); f.p(AX - x, y, 'H')
    elif nome == 'cacheado_longo':
        for y in range(3, 30):
            ex = {3: 11, 4: 8, 5: 7, 6: 6, 7: 5}.get(y, 5 if y < 15 else (4 if y < 22 else 6))
            f.simlin(y, ex, 15, 'H')
        for y in range(11, 30): f.simlin(y, 4 if y < 22 else 6, 9, 'H')
        f.simlin(11, 9, 12, 'H'); f.simlin(12, 10, 11, 'H')
        for y in range(10, 34): t.simlin(y, 4, 15, 'H')
    elif nome == 'trança':
        topo(f); costelas(f)
        f.simlin(11, 9, 12, 'H')
        for y in range(14, 38):
            f.p(23, y, 'H'); f.p(24, y, 'H'); f.p(25, y, 'H') if y % 3 else f.p(25, y, 'h')
        f.p(24, 38, 'H')
    elif nome == 'rabo':
        topo(f); costelas(f); f.simlin(11, 9, 12, 'H')
        for y in range(8, 26): t.lin(y, 4 if y > 12 else 6, 8, 'H')
    elif nome == 'coque':
        topo(f); costelas(f); f.simlin(11, 9, 12, 'H')
        f.tab([" HHHH ", "HHHHHH", "HHHHHH", "HHHHHH", " HHHH "], 13, 1, sim=False)
    elif nome == 'moicano':
        for y in range(1, 10): f.lin(y, 14, 17, 'H')
        for y in range(8, 11): f.lin(y, 13, 18, 'H')
        f.sim(9, 9, 'h')
    elif nome == 'chanel':
        topo(f); costelas(f, 11, 21)
        for y in range(11, 22): f.p(7, y, 'H'); f.p(24, y, 'H')
        f.simlin(11, 9, 14, 'H'); f.simlin(12, 9, 11, 'H')
        for y in range(10, 22): t.simlin(y, 7, 15, 'H')
    elif nome == 'tranças_duplas':
        topo(f); costelas(f); f.simlin(11, 9, 12, 'H')
        for y in range(14, 34):
            for x in (6, 7): f.p(x, y, 'H' if y % 3 else 'h')
            for x in (24, 25): f.p(x, y, 'H' if y % 3 else 'h')
    f.sombra_auto('H', 'h'); t.sombra_auto('H', 'h')
    return {'cabelo.frente': f.sprite(), 'cabelo.tras': t.sprite()}


CABELO_ITENS = [  # id, nome, preço
    ('raspado', 'Raspado', 0), ('curto', 'Curto', 0), ('lateral', 'Repartido', 0), ('espetado', 'Espetado', 0), ('bagunçado', 'Bagunçado', 0),
    ('franja', 'Franja', 0), ('medio', 'Médio liso', 0), ('ondulado', 'Médio ondulado', 0), ('longo', 'Longo liso', 0),
    ('cacheado', 'Cacheado', 0), ('rabo', 'Rabo de cavalo', 0), ('coque', 'Coque', 30), ('topete', 'Topete', 30),
    ('chanel', 'Chanel', 0), ('longo_ondulado', 'Longo ondulado', 30), ('cacheado_longo', 'Cacheado longo', 40),
    ('trança', 'Trança', 40), ('tranças_duplas', 'Tranças duplas', 50), ('moicano', 'Moicano', 40)]


# ------------------------------------------------------------------ barba
def barba_item(nome):
    g = Grade()
    if nome == 'curta':
        g.simlin(17, 9, 10, 'B'); g.simlin(18, 9, 11, 'B')
        for y in (19, 20, 21): g.simlin(y, 9 if y < 21 else 10, 15, 'B')
        g.simlin(22, 11, 15, 'B')
    elif nome == 'cheia':
        g.simlin(16, 9, 10, 'B'); g.simlin(17, 9, 11, 'B'); g.simlin(18, 9, 12, 'B')
        for y in (19, 20, 21): g.simlin(y, 9 if y < 21 else 10, 15, 'B')
        for y in (22, 23): g.simlin(y, 10, 15, 'B')
        g.simlin(24, 12, 15, 'B')
    elif nome == 'longa':
        g.simlin(16, 9, 10, 'B'); g.simlin(17, 9, 11, 'B'); g.simlin(18, 9, 12, 'B')
        for y in (19, 20, 21): g.simlin(y, 9 if y < 21 else 10, 15, 'B')
        for y in range(22, 36):
            g.simlin(y, 10 + (y - 22) // 5, 15, 'B') if y < 31 else g.simlin(y, 13, 15, 'B')
        g.sim(15, 36, 'B')
    elif nome == 'bigode':
        g.simlin(18, 11, 15, 'B'); g.simlin(17, 12, 15, 'B'); g.sim(10, 19, 'B'); g.sim(11, 19, 'B')
    elif nome == 'bigode_fino':
        g.simlin(18, 12, 15, 'B'); g.sim(11, 19, 'B')
    elif nome == 'cavanhaque':
        g.simlin(20, 14, 15, 'B'); g.simlin(21, 14, 15, 'B'); g.simlin(22, 14, 15, 'B'); g.simlin(23, 15, 15, 'B')
        g.simlin(18, 13, 15, 'B')
    elif nome == 'bifurcada':
        g.simlin(16, 9, 10, 'B'); g.simlin(17, 9, 11, 'B'); g.simlin(18, 9, 12, 'B')
        for y in (19, 20, 21): g.simlin(y, 9 if y < 21 else 10, 15, 'B')
        for y in range(22, 33):
            g.simlin(y, 10 + (y - 22) // 2, 13 - (y - 22) // 5, 'B') if y < 30 else g.simlin(y, 13, 14, 'B')
        g.sim(14, 33, 'B'); g.sim(14, 34, 'B')
    elif nome == 'costeletas':
        for y in range(12, 20): g.simlin(y, 8, 9 if y < 18 else 10, 'B')
    elif nome == 'guidao':
        g.simlin(18, 11, 15, 'B'); g.simlin(17, 12, 15, 'B'); g.simlin(19, 8, 12, 'B'); g.sim(8, 18, 'B'); g.sim(8, 17, 'B'); g.sim(9, 16, 'B')
    elif nome == 'rala':
        for (x, y) in [(10, 17), (12, 19), (14, 20), (10, 20), (13, 22), (11, 21), (15, 19), (9, 18), (12, 17), (14, 21)]:
            g.sim(x, y, 'B')
    elif nome == 'trancada':
        g.simlin(16, 9, 10, 'B'); g.simlin(17, 9, 11, 'B'); g.simlin(18, 9, 12, 'B')
        for y in (19, 20, 21): g.simlin(y, 9 if y < 21 else 10, 15, 'B')
        for y in range(22, 34):
            g.simlin(y, 13, 15, 'B') if y % 3 else g.simlin(y, 13, 15, 'b')
        g.simlin(34, 14, 15, 'B')
    elif nome == 'suiça':
        for y in range(14, 22): g.simlin(y, 8, 10 if y > 17 else 9, 'B')
        g.simlin(18, 11, 15, 'B'); g.simlin(17, 12, 15, 'B')
    g.sombra_auto('B', 'b')
    return {'barba': g.sprite()}


BARBA_ITENS = [('nenhuma', 'Sem barba', 0), ('rala', 'Rala', 0), ('bigode_fino', 'Bigode fino', 0), ('bigode', 'Bigode', 0), ('costeletas', 'Costeletas', 0),
               ('curta', 'Curta', 0), ('cavanhaque', 'Cavanhaque', 0), ('cheia', 'Cheia', 0), ('suiça', 'Suíça', 20), ('guidao', 'Bigode guidão', 30),
               ('longa', 'Longa de arquimago', 50), ('bifurcada', 'Bifurcada', 60), ('trancada', 'Trançada', 70)]


# ------------------------------------------------------------------ rosto
def olhos_item(nome):
    g = Grade()
    P = {'serio': (["KKK", "WEE"], 14), 'firme': (["KKK", "EEE"], 14), 'estreito': ([" KK", "WEE"], 15), 'cansado': (["WEE", "KKK"], 14),
         'arregalado': (["WWW", "WEE", "WEE"], 13), 'arcano': (["EEE", "EWE"], 14), 'fechado': (["KKK"], 15), 'sombrio': (["KKK", "EEK"], 14)}
    linhas, y = P[nome]
    for j, ln in enumerate(linhas):
        for i, c in enumerate(ln):
            if c == ' ': continue
            g.p(12 + i, y + j, c); g.p(AX - (12 + i), y + j, {'W': 'W'}.get(c, c))
    return {'olhos': g.sprite()}


OLHOS_ITENS = [('serio', 'Sérios', 0), ('firme', 'Firmes', 0), ('estreito', 'Estreitos', 0), ('cansado', 'Cansados', 0), ('sombrio', 'Sombrios', 0),
               ('arregalado', 'Atentos', 0), ('fechado', 'Fechados', 0), ('arcano', 'Arcanos', 0)]


def sobr_item(nome):
    g = Grade()
    if nome == 'reta': g.simlin(12, 11, 14, 'h')
    elif nome == 'grossa': g.simlin(12, 11, 14, 'h'); g.simlin(11, 11, 14, 'h')
    elif nome == 'arqueada': g.simlin(12, 11, 11, 'h'); g.simlin(11, 12, 13, 'h'); g.simlin(12, 14, 14, 'h')
    elif nome == 'franzida': g.sim(11, 11, 'h'); g.sim(12, 11, 'h'); g.sim(13, 12, 'h'); g.sim(14, 12, 'h'); g.sim(14, 13, 'h')
    elif nome == 'alta': g.simlin(11, 11, 14, 'h')
    elif nome == 'fina': g.simlin(12, 12, 14, 'h')
    elif nome == 'unida': g.simlin(12, 11, 15, 'h'); g.simlin(11, 12, 14, 'h')
    elif nome == 'assimetrica': g.simlin(12, 11, 14, 'h'); g.p(AX - 14, 11, 'h'); g.p(AX - 14, 12, ' ') ; g.p(AX - 13, 11, 'h'); g.p(AX - 12, 11, 'h'); g.p(AX - 11, 12, 'h')
    return {'sobrancelha': g.sprite()}


SOBR_ITENS = [('reta', 'Retas', 0), ('grossa', 'Grossas', 0), ('arqueada', 'Arqueadas', 0), ('franzida', 'Franzidas', 0), ('alta', 'Altas', 0),
              ('fina', 'Finas', 0), ('unida', 'Unidas', 0), ('assimetrica', 'Assimétricas', 0)]


def boca_item(nome):
    g = Grade()
    if nome == 'reta': g.lin(19, 14, 17, 'M')
    elif nome == 'comprimida': g.lin(19, 13, 18, 'M'); g.lin(20, 14, 17, 's')
    elif nome == 'sorrisinho': g.p(13, 19, 'M'); g.lin(20, 14, 17, 'M'); g.p(18, 19, 'M')
    elif nome == 'canto_baixo': g.lin(19, 14, 17, 'M'); g.p(13, 20, 'M'); g.p(18, 20, 'M')
    elif nome == 'torta': g.lin(19, 13, 15, 'M'); g.lin(20, 16, 18, 'M')
    elif nome == 'aberta': g.lin(19, 14, 17, 'M'); g.lin(20, 14, 17, 'L')
    return {'boca': g.sprite()}


BOCA_ITENS = [('reta', 'Reta', 0), ('comprimida', 'Comprimida', 0), ('canto_baixo', 'Séria', 0), ('sorrisinho', 'Sorrisinho', 0), ('torta', 'Torta', 0), ('aberta', 'Falando', 0)]


def rosto_item(nome):
    g = Grade()
    if nome == 'sardas':
        for (x, y) in [(11, 17), (13, 18), (12, 16), (18, 18), (20, 17), (19, 16), (14, 17), (17, 17)]: g.p(x, y, 's')
    elif nome == 'pinta': g.p(19, 18, 'M')
    elif nome == 'olheiras': g.simlin(16, 12, 14, 's')
    elif nome == 'cicatriz':
        for i, (x, y) in enumerate([(11, 11), (12, 12), (12, 13), (13, 14), (13, 15), (14, 16), (14, 17)]): g.p(x, y, 'M')
        g.p(10, 11, 'L')
    elif nome == 'runa':
        g.tab([" P ", "PPP", " P "], 15, 9); g.p(15, 9, ' '); g.p(16, 9, 'P'); g.p(15, 10, 'P'); g.p(16, 10, 'P')
        g.p(14, 10, 'P') if False else None
    elif nome == 'tatuagem':
        for (x, y) in [(10, 14), (10, 15), (11, 16), (11, 17), (10, 18), (21, 14), (21, 15), (20, 16), (20, 17), (21, 18)]: g.p(x, y, 'T')
    elif nome == 'bochechas':
        g.simlin(17, 10, 11, 'L'); g.simlin(18, 10, 11, 'L')
    return {'detalhe': g.sprite()}


ROSTO_ITENS = [('nenhum', 'Nenhum', 0), ('sardas', 'Sardas', 0), ('pinta', 'Pinta', 0), ('olheiras', 'Olheiras', 0), ('bochechas', 'Bochechas', 0),
               ('cicatriz', 'Cicatriz', 25), ('tatuagem', 'Tatuagem', 50), ('runa', 'Runa arcana', 60)]


# ------------------------------------------------------------------ manto (peça principal)
XL = {23: 11, 24: 9, 25: 7}
for _y in range(26, 31): XL[_y] = 6
for _y in range(31, 36): XL[_y] = 5
for _y in range(36, 41): XL[_y] = 4
for _y in range(41, 47): XL[_y] = 3


def corpo_manto(g, xl=None, gola_v=True, hem=46):
    xl = xl or XL
    for y, x0 in xl.items():
        if y > hem: continue
        g.lin(y, x0, AX - x0, 'R')
    if gola_v:                                                   # decote em V (a pele do pescoço aparece)
        for y, (a, b) in {23: (13, 18), 24: (13, 18), 25: (14, 17), 26: (15, 16)}.items():
            g.lin(y, a, b, ' ')
    for y in range(27, 36): g.p(9, y, 'r'); g.p(22, y, 'r')     # costura das mangas
    for y in range(31, hem + 1):                                 # dobras do tecido
        for x in (12, 19): g.p(x, y, 'r') if y % 7 else None
    return g


def manto_item(nome):
    f, t = Grade(), Grade()
    corpo_manto(f)
    if nome == 'aprendiz':
        f.lin(46, 3, 28, 'r')
    elif nome == 'academico':
        f.simlin(23, 11, 13, 'O'); f.simlin(24, 9, 12, 'O')
        for y in range(25, 46): f.simlin(y, 15, 15, 'O')
        f.lin(45, 3, 28, 'O'); f.lin(46, 3, 28, 'o')
        for y in (35,): f.simlin(y, 5, 8, 'O')
    elif nome == 'arquimago':
        for y in range(24, 28): f.simlin(y, 4 if y > 24 else 6, 9, 'R')
        f.simlin(24, 4, 9, 'O'); f.simlin(25, 3, 6, 'O'); f.simlin(27, 4, 9, 'o')
        f.tab([" O ", "OOO", " O "], 14, 29, sim=False); f.tab(["  OO  ", " OOOO ", "OOOOOO"], 13, 29)
        f.lin(44, 3, 28, 'O'); f.lin(45, 3, 28, 'o'); f.lin(46, 3, 28, 'O')
        for y in range(26, 47): t.simlin(y, 1, 5, 'R') if y > 30 else None
        for y in range(31, 47): t.simlin(y, 1 + (y - 31) // 8, 5, 'R')
    elif nome == 'sombrio':
        for y in range(19, 24): f.simlin(y, 8 + (23 - y), 10 + (23 - y), 'R')
        f.simlin(18, 8, 8, 'R'); f.simlin(19, 8, 9, 'R')
        for x in range(3, 29):                                   # barra rasgada
            if x % 3 == 0: f.p(x, 46, ' ')
            if x % 4 == 0: f.p(x, 45, ' ')
        f.simlin(30, 15, 15, 'O'); f.simlin(31, 14, 15, 'O'); f.simlin(32, 15, 15, 'O')
        for y in range(34, 44): f.p(10 + (y % 2), y, 'o') if y % 3 == 0 else None
    elif nome == 'elemental':
        for i in range(26):                                      # faixa diagonal
            x = 8 + i * 12 // 12 + i // 2
            for k in range(3): f.p(x + k, 26 + i * 18 // 26, 'O')
        for x in range(3, 29):
            if x % 2 == 0: f.p(x, 46, 'O'); f.p(x, 45, 'O') if x % 4 == 0 else None
    elif nome == 'cerimonial':
        for y in range(23, 47): f.simlin(y, 12, 14, 'O')
        for y in range(24, 46): f.simlin(y, 12, 12, 'o')
        for y in range(32, 40): f.simlin(y, 1, 5, 'R') if y > 32 else f.simlin(y, 3, 5, 'R')
        f.simlin(39, 1, 5, 'O')
        f.lin(46, 3, 28, 'O')
        f.tab(["O O O"], 13, 47) if False else None
        for x in (13, 15, 16, 18): f.p(x, 47, 'O')
    elif nome == 'capuz':
        for y in range(5, 25):                                   # capuz atrás da cabeça
            if y < 8: t.lin(y, 11 - (y - 5) * 0, 20, 'R') if False else t.lin(y, 11, 20, 'R')
            else: t.lin(y, 6, 25, 'R')
        for y in range(5, 8): t.lin(y, 10 - (y - 5), 21 + (y - 5), 'R')
        for y in range(23, 27): f.simlin(y, 8 - (y - 23), 12, 'R')
        f.simlin(23, 8, 13, 'r'); f.lin(36, 5, 26, 'O'); f.lin(37, 5, 26, 'o')
        for y in (38, 39, 40): f.p(15, y, 'O')
    elif nome == 'gola':
        for y in range(22, 29): f.simlin(y, 6 + (y - 22), 12, 'O') if y < 27 else None
        for y in range(22, 27): f.simlin(y, 7 + (y - 22), 11, 'O')
        f.simlin(27, 9, 11, 'o'); f.simlin(22, 7, 12, 'o')
    elif nome == 'mangas':
        for y in range(32, 44):
            e = (y - 32) // 3
            f.simlin(y, 1 - 0, 5 + e, 'R') if False else f.simlin(y, max(0, 3 - e), 6, 'R')
        f.simlin(43, 0, 4, 'O'); f.simlin(36, 6, 8, 'O')
        f.lin(46, 3, 28, 'O')
    elif nome == 'bordado':
        for x in range(4, 28, 4):
            for y, ln in enumerate(["O.O", ".O.", "O.O"]):
                for i, c in enumerate(ln):
                    if c == 'O': f.p(x + i, 43 + y, 'O')
        f.simlin(30, 12, 12, 'O'); f.simlin(31, 13, 14, 'O'); f.simlin(32, 12, 12, 'O')
        for y in range(25, 30): f.simlin(y, 12, 12, 'o') if y % 2 else None
        f.simlin(35, 5, 8, 'O')
    f.sombra_auto('R', 'r') if nome in ('x',) else None
    # sombra do lado direito do manto (metade direita um tom mais escura)
    for y in range(H):
        for x in range(21, W):
            if f.g[y][x] == 'R' and x >= 24: f.g[y][x] = 'r'
    return {'manto.frente': f.sprite(), 'manto.tras': t.sprite()}


MANTO_ITENS = [('aprendiz', 'Aprendiz', 0), ('academico', 'Acadêmico', 70), ('gola', 'Golas grandes', 90), ('mangas', 'Mangas largas', 100),
               ('capuz', 'Com capuz', 120), ('bordado', 'Bordado arcano', 150), ('elemental', 'Elemental', 180), ('sombrio', 'Sombrio', 200),
               ('cerimonial', 'Cerimonial', 240), ('arquimago', 'Arquimago', 320)]


def estampa_item(nome):
    g = Grade()
    if nome == 'listras':
        for x in range(7, 26, 4):
            for y in range(31, 46): g.p(x, y, 'o')
    elif nome == 'estrelas':
        for (x, y) in [(9, 34), (20, 32), (14, 38), (7, 42), (24, 40), (17, 44), (11, 30)]:
            g.p(x, y, 'O'); g.p(x - 1, y, 'o'); g.p(x + 1, y, 'o'); g.p(x, y - 1, 'o'); g.p(x, y + 1, 'o')
    elif nome == 'runas':
        for (x, y) in [(8, 33), (19, 34), (12, 40), (21, 42), (6, 44)]:
            for (i, j) in [(0, 0), (0, 1), (0, 2), (1, 1), (2, 0), (2, 2)]: g.p(x + i, y + j, 'o')
    elif nome == 'xadrez':
        for y in range(31, 46):
            for x in range(5, 27):
                if ((x // 2) + (y // 2)) % 2: g.p(x, y, 'o')
    elif nome == 'ondas':
        for y in range(33, 46, 4):
            for x in range(4, 28): g.p(x, y + (1 if (x // 2) % 2 else 0), 'o')
    elif nome == 'losangos':
        for cx in range(8, 26, 6):
            for cy in (35, 42):
                for (i, j) in [(0, -1), (-1, 0), (1, 0), (0, 1)]: g.p(cx + i, cy + j, 'o')
                g.p(cx, cy, 'O')
    s = g.sprite()
    return {'estampa': s}


ESTAMPA_ITENS = [('nenhuma', 'Lisa', 0), ('listras', 'Listras', 30), ('ondas', 'Ondas', 40), ('xadrez', 'Xadrez', 40), ('losangos', 'Losangos', 50), ('estrelas', 'Estrelas', 60), ('runas', 'Runas', 70)]


# ------------------------------------------------------------------ chapéus
def chapeu_item(nome):
    g = Grade()
    if nome == 'aprendiz':
        for y in range(0, 8):
            g.simlin(y + 0, 14 - y // 2 - 1 if False else 13 - y // 2, 15, 'R') if y < 7 else None
        g.tab(["    RRRR    ", "   RRRRRR   ", "  RRRRRRRR  ", " RRRRRRRRRR ", "RRRRRRRRRRRR"], 10, 1)
        g.tab(["  RR  ", "  RR  "], 15, -1) if False else None
        g.lin(6, 8, 23, 'O'); g.lin(7, 7, 24, 'R'); g.lin(8, 7, 24, 'r')
    elif nome == 'largo':
        g.tab(["    RRRR    ", "   RRRRRR   ", "  RRRRRRRR  "], 10, 3)
        g.lin(6, 9, 22, 'O'); g.lin(7, 3, 28, 'R'); g.lin(8, 2, 29, 'R'); g.lin(9, 3, 28, 'r')
    elif nome == 'torto':
        g.tab(["      RR    ", "     RRR    ", "    RRRR    ", "   RRRRRR   ", "  RRRRRRRR  "], 10, 0)
        g.tab(["  RR", " RR "], 22, -1) if False else None
        g.p(8, 0, 'R'); g.p(9, 0, 'R'); g.p(7, 1, 'R'); g.p(8, 1, 'R')
        g.lin(6, 9, 22, 'O'); g.lin(7, 7, 24, 'R'); g.lin(8, 6, 25, 'r')
    elif nome == 'arquimago':
        for y in range(0, 9):
            g.lin(y, 12 - y // 3, 19 + y // 3, 'R')
        g.lin(6, 9, 22, 'R'); g.lin(7, 8, 23, 'O'); g.lin(8, 8, 23, 'R'); g.lin(9, 8, 23, 'r')
        g.p(14, 3, 'O'); g.p(17, 5, 'O'); g.p(15, 1, 'O')
    elif nome == 'gorro':
        g.tab(["   RRRR   ", "  RRRRRR  ", " RRRRRRRR ", "RRRRRRRRRR"], 11, 3)
        g.tab(["RR", "RRR", " RR"], 20, 2) if False else None
        for (x, y) in [(22, 3), (23, 4), (24, 6), (24, 7)]: g.p(x, y, 'R')
        g.p(24, 8, 'O'); g.p(25, 8, 'O'); g.lin(9, 8, 23, 'O'); g.lin(8, 8, 23, 'R')
    elif nome == 'capuz':
        for y in range(4, 22):
            if y < 8: g.lin(y, 10 - (y - 4), 21 + (y - 4), 'R')
            else: g.lin(y, 6, 25, 'R')
        for y in range(10, 22):
            g.lin(y, 10, 21, ' ')
        g.lin(10, 8, 23, 'r'); g.lin(9, 7, 24, 'R')
    elif nome == 'louros':
        for x in range(8, 24):
            g.p(x, 7 + (1 if x % 4 < 2 else 0), 'e'); g.p(x, 8, 'e') if x % 4 == 0 else None
        g.p(8, 9, 'e'); g.p(23, 9, 'e')
    elif nome == 'tiara':
        g.lin(8, 9, 22, 'V'); g.lin(9, 9, 10, 'v'); g.lin(9, 21, 22, 'v')
        g.tab([" c ", "ccc", " c "], 14, 5); g.p(15, 6, 'q')
        g.p(11, 7, 'V'); g.p(20, 7, 'V')
    elif nome == 'turbante':
        g.tab(["  RRRRRRRR  ", " RRRRRRRRRR ", "RRrRRrRRrRRR", "RRRRRRRRRRRR"], 10, 4)
        g.lin(8, 8, 23, 'O'); g.lin(9, 8, 23, 'R'); g.p(15, 6, 'O'); g.p(16, 6, 'O')
    elif nome == 'cartola':
        g.tab(["RRRRRRRR", "RRRRRRRR", "RRRRRRRR", "RRRRRRRR", "RRRRRRRR"], 12, 1)
        g.lin(5, 12, 19, 'O'); g.lin(6, 12, 19, 'O'); g.lin(7, 7, 24, 'R'); g.lin(8, 7, 24, 'r')
        g.p(15, 3, 'O'); g.p(16, 2, 'O')
    g.sombra_auto('R', 'r', False) if False else None
    return {'chapeu': g.sprite()}


CHAPEU_ITENS = [('nenhum', 'Sem chapéu', 0), ('louros', 'Coroa de louros', 60), ('gorro', 'Gorro estrelado', 70), ('aprendiz', 'Chapéu de aprendiz', 90), ('torto', 'Chapéu torto', 100),
                ('capuz', 'Capuz', 110), ('turbante', 'Turbante', 120), ('largo', 'Chapéu largo', 150), ('tiara', 'Tiara arcana', 200), ('cartola', 'Cartola mística', 220),
                ('arquimago', 'Chapéu de arquimago', 260)]


# ------------------------------------------------------------------ cintura / peito
def cintura_item(nome):
    g = Grade()
    if nome == 'corda':
        g.lin(36, 4, 27, 'n'); g.lin(37, 4, 27, 'N'); g.p(14, 38, 'N'); g.p(15, 39, 'N'); g.p(17, 38, 'N'); g.p(18, 39, 'N')
    elif nome == 'couro':
        g.lin(36, 4, 27, 'N'); g.lin(37, 4, 27, 'n'); g.r(14, 35, 4, 4, 'G'); g.r(15, 36, 2, 2, 'n')
    elif nome == 'faixa':
        g.r(4, 35, 24, 3, 'O'); g.lin(38, 4, 27, 'o'); g.p(15, 39, 'O'); g.p(16, 40, 'O')
    elif nome == 'bolsa':
        g.lin(36, 4, 27, 'N'); g.lin(37, 4, 27, 'n'); g.r(14, 35, 4, 4, 'G'); g.r(15, 36, 2, 2, 'n')
        g.tab(["NNNNN", "NNNNN", "NnnnN", "NNNNN", " NNN "], 5, 38); g.lin(38, 5, 9, 'n')
    elif nome == 'pocoes':
        g.lin(36, 4, 27, 'N'); g.lin(37, 4, 27, 'n'); g.r(14, 35, 4, 4, 'G'); g.r(15, 36, 2, 2, 'n')
        g.tab([" N ", "e e", "eee", "eee"], 6, 38, {'e': 'e'}); g.tab([" N ", "rrr", "RRR", "RRR"], 20, 38, {'r': 'D', 'R': 'D'})
        g.p(7, 38, 'N')
    elif nome == 'livro':
        g.lin(36, 4, 27, 'N'); g.lin(37, 4, 27, 'n'); g.r(14, 35, 4, 4, 'G'); g.r(15, 36, 2, 2, 'n')
        g.tab(["PPPPP", "PGGGP", "PGPGP", "PGGGP", "PPPPP"], 5, 38)
    elif nome == 'chaves':
        g.lin(36, 4, 27, 'N'); g.lin(37, 4, 27, 'n'); g.r(14, 35, 4, 4, 'G'); g.r(15, 36, 2, 2, 'n')
        for (x, y) in [(6, 38), (8, 38), (21, 38)]:
            g.p(x, y, 'G'); g.p(x, y + 1, 'G'); g.p(x, y + 2, 'G'); g.p(x + 1, y + 2, 'G')
    return {'cintura': g.sprite()}


CINTURA_ITENS = [('nenhum', 'Sem cinto', 0), ('corda', 'Corda', 40), ('couro', 'Couro e fivela', 60), ('faixa', 'Faixa larga', 70), ('bolsa', 'Bolsa', 90),
                 ('chaves', 'Chaveiro', 100), ('livro', 'Grimório de cinto', 130), ('pocoes', 'Bolsa de poções', 150)]


def peito_item(nome):
    g = Grade()
    if nome == 'estrela': g.tab([" G ", "GGG", "G G"], 19, 28); g.p(20, 29, 'g')
    elif nome == 'lua': g.tab(["VVV", "V  ", "VVV"], 19, 28); g.p(21, 29, 'v')
    elif nome == 'gema': g.tab([" D ", "DDD", " D "], 19, 28); g.p(19, 29, 'G') if False else None; g.p(20, 28, 'W')
    elif nome == 'pi':
        g.tab(["GGGG", " G G", " G G"], 18, 28)
    elif nome == 'corrente':
        for i in range(8): g.p(12 + i // 2 + 0, 26 + i, 'G') if False else None
        for (x, y) in [(13, 24), (13, 25), (14, 26), (14, 27), (15, 28), (16, 28), (17, 27), (17, 26), (18, 25), (18, 24)]: g.p(x, y, 'G')
    elif nome == 'medalhao':
        for (x, y) in [(13, 24), (13, 25), (14, 26), (14, 27), (17, 27), (17, 26), (18, 25), (18, 24)]: g.p(x, y, 'G')
        g.tab(["GGGG", "GggG", "GggG", "GGGG"], 14, 28)
    elif nome == 'amuleto':
        for (x, y) in [(13, 24), (13, 25), (14, 26), (14, 27), (17, 27), (17, 26), (18, 25), (18, 24)]: g.p(x, y, 'V')
        g.tab([" c ", "cqc", "ccc", " c "], 14, 28)
    elif nome == 'faixa':
        for i in range(17):
            x = 9 + i; y = 26 + int(i * 0.88)
            g.p(x, y, 'O'); g.p(x + 1, y, 'O'); g.p(x, y + 1, 'o')
    elif nome == 'lenco':
        g.lin(23, 11, 20, 'O'); g.lin(24, 10, 21, 'O'); g.lin(25, 11, 14, 'o'); g.lin(25, 17, 20, 'o'); g.tab(["OO", "OO", "oo"], 17, 26)
    return {'peito': g.sprite()}


PEITO_ITENS = [('nenhum', 'Nada', 0), ('estrela', 'Broche estrela', 40), ('lua', 'Broche lua', 40), ('pi', 'Broche π', 60), ('corrente', 'Corrente dourada', 60),
               ('lenco', 'Lenço', 70), ('gema', 'Broche de gema', 90), ('faixa', 'Faixa diagonal', 100), ('medalhao', 'Medalhão', 110), ('amuleto', 'Amuleto de cristal', 150)]


# ------------------------------------------------------------------ óculos / joias
def oculos_item(nome):
    g = Grade()
    def par(c, w=3):
        pass
    if nome == 'redondo':
        for x0 in (11, 17):
            g.tab([" GG ", "G  G", "G  G", " GG "], x0, 13)
        g.lin(14, 15, 16, 'G')
    elif nome == 'quadrado':
        for x0 in (11, 17):
            g.tab(["KKKK", "K  K", "K  K", "KKKK"], x0, 13)
        g.lin(14, 15, 16, 'K')
    elif nome == 'meia_lua':
        for x0 in (11, 17):
            g.tab(["VVVV", "V  V", " VV "], x0, 14)
        g.lin(14, 15, 16, 'V')
    elif nome == 'fino':
        for x0 in (11, 17):
            g.tab(["VVVV", "V  V", "VVVV"], x0, 13)
        g.lin(14, 15, 16, 'V'); g.p(10, 14, 'V'); g.p(21, 14, 'V')
    elif nome == 'grande':
        for x0 in (10, 17):
            g.tab(["NNNNN", "N   N", "N   N", "N   N", "NNNNN"], x0, 12)
        g.lin(14, 15, 16, 'N')
    elif nome == 'monoculo':
        g.tab([" GG ", "G  G", "G  G", " GG "], 17, 13)
        for (x, y) in [(21, 17), (22, 18), (22, 19), (23, 20), (23, 21), (23, 22)]: g.p(x, y, 'g')
    elif nome == 'escuros':
        for x0 in (11, 17):
            g.tab(["KKKK", "KKKK", "KKKK"], x0, 13)
        g.lin(14, 15, 16, 'K'); g.p(12, 13, 'q') ; g.p(18, 13, 'q')
    elif nome == 'arcano':
        for x0 in (11, 17):
            g.tab(["VVVV", "VccV", "VccV", "VVVV"], x0, 13)
        g.lin(14, 15, 16, 'V'); g.p(12, 14, 'q'); g.p(18, 14, 'q')
    return {'oculos': g.sprite()}


OCULOS_ITENS = [('nenhum', 'Sem óculos', 0), ('redondo', 'Redondos', 0), ('quadrado', 'Quadrados', 0), ('fino', 'Finos', 0), ('meia_lua', 'Meia-lua', 0),
                ('grande', 'Grandes', 40), ('monoculo', 'Monóculo', 60), ('escuros', 'Escuros', 70), ('arcano', 'Lentes arcanas', 110)]


def joia_item(nome):
    g = Grade()
    if nome == 'pino': g.p(8, 17, 'G'); g.p(23, 17, 'G')
    elif nome == 'argola':
        for (x, y) in [(8, 17), (7, 18), (7, 19), (8, 20)]: g.p(x, y, 'G'); g.p(AX - x, y, 'G')
    elif nome == 'nariz': g.p(17, 17, 'G')
    elif nome == 'pena':
        for y in range(17, 22): g.p(8, y, 'c') if False else None
        g.p(7, 17, 'G'); g.tab(["c", "C", "C", "c"], 7, 18); g.p(24, 17, 'G'); g.tab(["c", "C", "C", "c"], 24, 18)
    elif nome == 'cristal':
        g.p(8, 17, 'V'); g.p(8, 18, 'q'); g.p(8, 19, 'C'); g.p(23, 17, 'V'); g.p(23, 18, 'q'); g.p(23, 19, 'C')
    elif nome == 'lua':
        g.tab(["VV", "V ", "VV"], 6, 17); g.tab(["VV", " V", "VV"], 24, 17)
    elif nome == 'sobrancelha': g.p(19, 11, 'V'); g.p(19, 13, 'V'); g.p(21, 12, 'v') if False else None
    elif nome == 'labio': g.p(14, 21, 'V')
    elif nome == 'multi': g.p(8, 15, 'G'); g.p(8, 17, 'G'); g.p(7, 16, 'G'); g.p(23, 15, 'V'); g.p(23, 17, 'V'); g.p(24, 16, 'V')
    elif nome == 'nariz_argola': g.p(17, 17, 'G'); g.p(17, 18, 'G'); g.p(16, 18, 'G')
    elif nome == 'tapa':
        g.tab(["KKKK", "KKKK", "KKKK"], 11, 13); g.tab(["K", "K", "K"], 10, 12); g.p(10, 11, 'K'); g.lin(12, 11, 22, 'k') if False else None
        for x in range(10, 22): g.p(x, 12 - (x - 10) // 3, 'K') if x > 14 else None
    return {'joia': g.sprite()}


JOIA_ITENS = [('nenhuma', 'Sem joias', 0), ('pino', 'Brincos de pino', 0), ('argola', 'Argolas', 0), ('nariz', 'Piercing no nariz', 0),
              ('lua', 'Brincos de lua', 40), ('pena', 'Brincos de pena', 50), ('labio', 'Piercing no lábio', 40), ('nariz_argola', 'Argola no nariz', 50),
              ('sobrancelha', 'Piercing na sobrancelha', 50), ('multi', 'Orelhas cravejadas', 70), ('cristal', 'Brincos de cristal', 90)]


# ------------------------------------------------------------------ cajado (o básico é o do mago da batalha)
def cajado_item(nome):
    g = Grade()
    pal = {}
    def haste(y0, y1=47):
        for y in range(y0, y1 + 1): g.p(26, y, 'N'); g.p(27, y, 'n')
    if nome == 'basico':
        g.tab([" qC ", "CqCc", "CCcc", " cc "], 25, 4); haste(8)
    elif nome == 'nodoso':
        g.tab(["  NN", " NNn", "NN n", "N   "], 24, 3); haste(7)
        for (x, y) in [(26, 20), (27, 26)]: g.p(x, y, 'e')
        g.p(25, 14, 'N'); g.p(28, 22, 'n')
    elif nome == 'cristal_roxo':
        g.tab(["  C   ", " CqC  ", "CCqcC ", " CcCc ", "  Cc  "], 24, 2); haste(7)
        pal = {'C': '#9B6BFF', 'c': '#5E3DB5', 'q': '#E4D6FF'}
    elif nome == 'cristal_verde':
        g.tab([" CCC ", "CqCCC", "CCCcC", " Ccc "], 24, 3); haste(7)
        g.p(25, 8, 'e'); g.p(28, 9, 'e')
        pal = {'C': '#5CE08A', 'c': '#2E9B57', 'q': '#D2FFE0'}
    elif nome == 'cristal_vermelho':
        g.tab(["  C ", " CqC", "CCCc", "CCcc", " Cc "], 25, 1); haste(7)
        pal = {'C': '#FF6B6B', 'c': '#B3262E', 'q': '#FFD6D6'}
    elif nome == 'runico':
        g.tab([" SSSS ", "S    S", "S PP S", "S PP S", "S    S", " SSSS "], 24, 2); haste(8)
        pal = {'S': '#8F95A8', 'P': '#8E7BE8'}
    elif nome == 'ornamentado':
        g.tab(["G  qC  G", " G CC G ", "  GccG  ", "   GG   "], 23, 4); haste(8)
        for y in (20, 30, 40): g.p(25, y, 'G'); g.p(28, y, 'G')
    elif nome == 'sombrio':
        g.tab([" WWWW ", "WWWWWW", "WDWWDW", " WWWW ", " W  W "], 24, 2)
        g.p(23, 3, 'K'); g.p(30, 3, 'K'); haste(8)
        for y in (14, 24, 34): g.p(25, y, 'n'); g.p(28, y, 'n')
        pal = {'N': '#2B2733', 'n': '#14101F'}
    elif nome == 'cerimonial':
        g.tab(["  G  ", " GGG ", "GGGGG", " GGG ", "  G  "], 24, 1)
        g.tab(["G  G"], 25, 8) if False else None
        for y in range(6, 48): g.p(26, y, 'G'); g.p(27, y, 'g')
        g.tab(["DD", "DD", "DD", " D"], 28, 9)
    elif nome == 'raro':
        g.tab(["  q  ", " CqC ", "CCqCc", " CcC ", "  c  "], 24, 2); haste(8)
        for (x, y, c) in [(22, 3, 'P'), (30, 5, 'G'), (23, 8, 'C'), (29, 1, 'q'), (21, 6, 'G')]: g.p(x, y, c)
        pal = {'C': '#5CD3FF', 'c': '#8E7BE8', 'q': '#FFFFFF'}
    elif nome == 'sol':
        g.tab(["G G G", " GGG ", "GGgGG", " GGG ", "G G G"], 24, 1); haste(7)
        g.p(26, 3, 'q'); pal = {'q': '#FFF1C2'}
        for y in range(7, 48): g.p(26, y, 'G'); g.p(27, y, 'g')
    sp = g.sprite()
    if pal: sp['pal'] = pal
    return {'cajado': sp}


CAJADO_ITENS = [('basico', 'Cajado de aprendiz', 0), ('nodoso', 'Cajado nodoso', 60), ('cristal_roxo', 'Cristal roxo', 90), ('cristal_verde', 'Cristal verde', 110),
                ('cristal_vermelho', 'Cristal rubro', 130), ('runico', 'Anel rúnico', 160), ('ornamentado', 'Ornamentado', 200), ('sombrio', 'Sombrio', 240),
                ('cerimonial', 'Cerimonial', 280), ('sol', 'Cajado solar', 320), ('raro', 'Cajado de aurora', 400)]


# ------------------------------------------------------------------ companheiros
PETS = {  # nome: (x, y, linhas, paleta)
    'corvo': (1, 19, ["..bbb....", ".bbwbyy..", "bbbbbby..", ".bbbbbb..", "..bffb...", "...y.y..."], {'b': '#2B2733', 'f': '#4A4458', 'w': '#FFFFFF', 'y': '#E0B84A'}),
    'gato': (0, 41, ["b...b...", "bb.bb...", "bbbbb...", "bebeb...", ".bbbb.bb", ".bbbbbbb", "bbbbbb.b", "bb.bb..."], {'b': '#2B2733', 'e': '#8EE06B'}),
    'morcego': (0, 10, ["b.b..b.b", "bbb..bbb", "bbbbbbbb", ".bwbbwb.", "..bbbb..", "..b..b.."], {'b': '#4A3B6B', 'w': '#FFD66B'}),
    'coruja': (0, 41, ["bb...bb.", "bbbbbbb.", "bYWbWYb.", "bbbybbb.", "bffbffb.", ".bbbbb..", ".y...y.."], {'b': '#7A5230', 'f': '#A98748', 'Y': '#E0B84A', 'W': '#FFFFFF', 'y': '#E0B84A'}),
    'sapo': (0, 43, [".gwg.gwg", "gggggggg", "gggggggg", "gffffffg", "gg.gg.gg"], {'g': '#3FA362', 'f': '#7BD6A4', 'w': '#FFFFFF'}),
    'slime': (0, 43, ["..cccc..", ".cqccccc", "cqcccccc", "cwcwcccc", "cccccccc"], {'c': '#5CD3FF', 'q': '#CFEFFA', 'w': '#1B1626'}),
    'dragao': (0, 40, ["r.....rr..", "rr...rrrr.", "rrrrrrrr..", "rwrrrro...", "rrrrrrrro.", ".rrrrrrr..", ".rr.rr.rr.", "ro...ro..."], {'r': '#C73333', 'o': '#E78A2E', 'w': '#FFD66B'}),
    'fantasma': (0, 14, ["..WWWW..", ".WWWWWW.", ".WKWWKW.", ".WWWWWW.", ".WWWWWW.", ".W.WW.W."], {'W': '#E8E0FF', 'K': '#2B2347'}),
    'orbe': (0, 12, ["..CC..", ".CqCC.", "CqCCcC", "CCCccC", ".CccC.", "..cc.."], {'C': '#5CD3FF', 'c': '#3697BA', 'q': '#FFFFFF'}),
    'livro': (0, 12, ["PPPP.PPPP", "PWWP.PWWP", "PWWPPPWWP", "PWWP.PWWP", ".PPP.PPP."], {'P': '#8E7BE8', 'W': '#F5F1FF'}),
}


def pet_item(nome):
    x, y, linhas, pal = PETS[nome]
    g = Grade(); g.tab(linhas, x, y)
    sp = g.sprite(); sp['pal'] = pal
    return {'pet': sp}


PET_ITENS = [('nenhum', 'Sem companheiro', 0), ('slime', 'Gosma arcana', 150), ('sapo', 'Sapo', 160), ('gato', 'Gato preto', 200), ('corvo', 'Corvo', 220),
             ('coruja', 'Coruja', 240), ('morcego', 'Morcego', 240), ('orbe', 'Orbe flutuante', 260), ('livro', 'Grimório flutuante', 300),
             ('fantasma', 'Fantasminha', 320), ('dragao', 'Dragãozinho', 400)]


# ------------------------------------------------------------------ montagem do catálogo
def montar():
    cats = []
    def forma(id, nome, itens, fabrica, crop, layers_ok=True):
        its = []
        for (iid, inome, preco) in itens:
            l = {}
            if fabrica and iid not in ('nenhum', 'nenhuma', 'raspado'):
                for k, v in fabrica(iid).items():
                    if v: l[k] = v
            elif fabrica and iid == 'raspado':
                l = {k: v for k, v in fabrica(iid).items() if v}
            it = {'id': iid, 'nome': inome, 'preco': preco}
            if l: it['l'] = l
            its.append(it)
        cats.append({'id': id, 'nome': nome, 'tipo': 'forma', 'crop': crop, 'itens': its})
    def cor(id, nome, itens, chave, extra=None, crop=None):
        cats.append({'id': id, 'nome': nome, 'tipo': 'cor', 'chave': chave, 'itens': itens})
    cor('pele', 'Pele', [{'id': i, 'nome': n, 'preco': 0, 'cor': c, 'cor2': s} for i, n, c, s in PELES], 'S')
    forma('cabelo', 'Cabelo', CABELO_ITENS, cabelo_item, [4, 0, 28, 30])
    cor('corCabelo', 'Cor do cabelo', [{'id': i, 'nome': n, 'preco': 0, 'cor': c, 'cor2': escurece(c)} for i, n, c in CABELOS], 'H')
    forma('olhos', 'Olhos', OLHOS_ITENS, olhos_item, [8, 9, 24, 21])
    cor('corOlhos', 'Cor dos olhos', [{'id': i, 'nome': n, 'preco': 0, 'cor': c} for i, n, c in OLHOS], 'E')
    forma('sobrancelha', 'Sobrancelhas', SOBR_ITENS, sobr_item, [8, 8, 24, 18])
    forma('boca', 'Boca', BOCA_ITENS, boca_item, [8, 14, 24, 24])
    forma('detalhe', 'Marcas do rosto', ROSTO_ITENS, rosto_item, [6, 6, 26, 24])
    forma('barba', 'Barba', BARBA_ITENS, barba_item, [4, 8, 28, 30])
    cor('corBarba', 'Cor da barba', [{'id': i, 'nome': n, 'preco': 0, 'cor': c, 'cor2': escurece(c)} for i, n, c in CABELOS], 'B')
    forma('oculos', 'Óculos', OCULOS_ITENS, oculos_item, [6, 8, 26, 22])
    forma('joia', 'Brincos e piercings', JOIA_ITENS, joia_item, [4, 8, 28, 24])
    forma('manto', 'Manto', MANTO_ITENS, manto_item, [0, 18, 32, 49])
    cor('corManto', 'Cor do manto', [{'id': i, 'nome': n, 'preco': 0, 'cor': c, 'cor2': escurece(c, 0.7), 'extra': {'O': o, 'o': escurece(o, 0.72)}} for i, n, c, o in MANTOS], 'R')
    forma('estampa', 'Estampas do manto', ESTAMPA_ITENS, estampa_item, [0, 26, 32, 49])
    forma('chapeu', 'Chapéus e capuzes', CHAPEU_ITENS, chapeu_item, [2, 0, 30, 14])
    forma('cintura', 'Cintos e bolsas', CINTURA_ITENS, cintura_item, [0, 30, 32, 49])
    forma('peito', 'Broches e correntes', PEITO_ITENS, peito_item, [4, 20, 28, 40])
    forma('cajado', 'Cajado', CAJADO_ITENS, cajado_item, [18, 0, 32, 49])
    forma('pet', 'Companheiros', PET_ITENS, pet_item, [0, 8, 14, 49])
    for c in cats:
        if c['id'] == 'estampa':
            for it in c['itens']:
                if 'l' in it: it['l']['estampa']['clip'] = 'manto'
    padrao = {'pele': 'p3', 'cabelo': 'curto', 'corCabelo': 'c2', 'olhos': 'serio', 'corOlhos': 'e1', 'sobrancelha': 'reta', 'boca': 'canto_baixo', 'detalhe': 'nenhum',
              'barba': 'nenhuma', 'corBarba': 'c2', 'oculos': 'nenhum', 'joia': 'nenhuma', 'manto': 'aprendiz', 'corManto': 'm1', 'estampa': 'nenhuma',
              'chapeu': 'nenhum', 'cintura': 'nenhum', 'peito': 'nenhum', 'cajado': 'basico', 'pet': 'nenhum'}
    abas = [
        {'id': 'corpo', 'nome': 'Rosto', 'cats': ['pele', 'olhos', 'corOlhos', 'sobrancelha', 'boca', 'detalhe']},
        {'id': 'cabelo', 'nome': 'Cabelo', 'cats': ['cabelo', 'corCabelo']},
        {'id': 'barba', 'nome': 'Barba', 'cats': ['barba', 'corBarba']},
        {'id': 'manto', 'nome': 'Manto', 'cats': ['manto', 'corManto', 'estampa']},
        {'id': 'cabeca', 'nome': 'Chapéus', 'cats': ['chapeu']},
        {'id': 'acessorios', 'nome': 'Acessórios', 'cats': ['oculos', 'joia', 'cintura', 'peito']},
        {'id': 'cajado', 'nome': 'Cajado', 'cats': ['cajado']},
        {'id': 'pet', 'nome': 'Companheiros', 'cats': ['pet']}]
    ordem = ['fundo', 'sombra', 'cajado.tras', 'cabelo.tras', 'manto.tras', 'pescoco', 'manto.frente', 'estampa', 'cintura', 'peito', 'maos', 'orelhas', 'cabeca',
             'detalhe', 'barba', 'boca', 'olhos', 'sobrancelha', 'joia', 'cabelo.frente', 'oculos', 'chapeu', 'cajado', 'pet']
    fixos = {'K': '#1B1626', 'W': '#FFFFFF', 'M': '#7A2E2E', 'L': '#E8788A', 'G': '#E0B84A', 'g': '#A67C1E', 'V': '#C9CDD8', 'v': '#8F95A8', 'N': '#6B4226', 'n': '#3A2314',
             'C': '#5CD3FF', 'c': '#3697BA', 'q': '#CFEFFA', 'P': '#8E7BE8', 'D': '#D6262D', 'e': '#3FA362', 'T': '#2F4F9A', 'a': '#2A2342', 'k': '#352C54', 'j': '#322A4D'}
    return {'w': W, 'h': H, 'fixos': fixos, 'cats': cats, 'abas': abas, 'padrao': padrao, 'base': base(), 'ordem': ordem, 'busto': [2, 0, 30, 28]}
