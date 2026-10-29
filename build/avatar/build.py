"""Gera assets/js/avatar.js (catálogo + renderizador). Uso: python3 build/avatar/build.py"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import pecas

DATA = json.dumps(pecas.montar(), ensure_ascii=False, separators=(',', ':'))
JS = r'''/* ==========================================================================
   Avatar PIXEL ART do Briiff — magos de RPG (gerado por build/avatar/build.py; não edite o DATA à mão).
   Personagem de corpo inteiro numa grade de 32×50 pixels, montado em camadas de texto (cenário, sombra, cajado,
   cabelo, manto, mãos, rosto, barba, óculos, chapéu, companheiro…). O contorno escuro é desenhado em volta da silhueta.
   Categorias de COR (tipo "cor") pintam as letras da sua `chave` (maiúscula = cor, minúscula = sombra); itens podem
   trazer `extra` (ex.: ornamento do manto). Estampas usam `clip: "manto"` e só pintam onde há manto.
   O catálogo tem no máximo 20 categorias (limite das regras do Firestore para avatarCfg).
   ========================================================================== */
(function () {
  'use strict';
  const DATA = __DATA__;
  const W = DATA.w, H = DATA.h;
  const POR_CAT = {};
  DATA.cats.forEach((c) => { c.por = {}; c.itens.forEach((i) => { c.por[i.id] = i; }); POR_CAT[c.id] = c; });

  const padrao = () => Object.assign({}, DATA.padrao);
  function item(cat, id) {
    const c = POR_CAT[cat];
    return (c && (c.por[id] || c.por[DATA.padrao[cat]])) || null;
  }
  function limpar(cfg) {
    const o = {};
    DATA.cats.forEach((c) => { o[c.id] = c.por[cfg && cfg[c.id]] ? cfg[c.id] : DATA.padrao[c.id]; });
    return o;
  }
  function sprite(nome, cfg) {
    if (DATA.base[nome]) return DATA.base[nome];
    const cat = nome.split('.')[0];
    const it = item(cat, cfg[cat]);
    return it && it.l ? it.l[nome] || null : null;
  }

  /** Junta as camadas e devolve { fundo, sombra, corpo }: listas de W*H posições (cor em #hex ou null). */
  function pixels(cfg) {
    cfg = limpar(cfg || padrao());
    const mapa = {};
    DATA.cats.forEach((c) => {
      if (c.tipo !== 'cor') return;
      const it = item(c.id, cfg[c.id]);
      mapa[c.chave] = it.cor;
      if (it.cor2) mapa[c.chave.toLowerCase()] = it.cor2;
      if (it.extra) Object.assign(mapa, it.extra);
    });
    const fundo = new Array(W * H).fill(null), sombra = new Array(W * H).fill(false), corpo = new Array(W * H).fill(null);
    const mascaras = {};
    DATA.ordem.forEach((nome) => {
      const sp = sprite(nome, cfg);
      if (!sp) return;
      const loc = sp.pal || {};
      const marca = nome.indexOf('.') > 0 ? null : null;
      const guarda = nome === 'manto.frente' ? (mascaras.manto = new Set()) : null;
      sp.r.forEach((linha, j) => {
        const y = sp.y + j;
        if (y < 0 || y >= H) return;
        for (let i = 0; i < linha.length; i++) {
          const ch = linha[i];
          if (ch === ' ') continue;
          const x = sp.x + i;
          if (x < 0 || x >= W) continue;
          if (sp.clip && !(mascaras[sp.clip] && mascaras[sp.clip].has(y * W + x))) continue;
          if (ch === 'Z') { sombra[y * W + x] = true; continue; }
          const cor = loc[ch] || mapa[ch] || DATA.fixos[ch];
          if (!cor) continue;
          (nome === 'fundo' ? fundo : corpo)[y * W + x] = cor;
          if (guarda) guarda.add(y * W + x);
        }
      });
    });
    // contorno escuro em volta da silhueta
    const K = DATA.fixos.K, extra = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (corpo[y * W + x]) continue;
      if ((x > 0 && corpo[y * W + x - 1]) || (x < W - 1 && corpo[y * W + x + 1]) || (y > 0 && corpo[(y - 1) * W + x]) || (y < H - 1 && corpo[(y + 1) * W + x])) extra.push(y * W + x);
    }
    extra.forEach((i) => { corpo[i] = K; });
    return { fundo, sombra, corpo };
  }

  const cache = new Map();
  /** SVG do personagem. opts.crop = [x0,y0,x1,y1] (padrão: busto, bom para círculos); opts.corpo = corpo inteiro; opts.semFundo. */
  function svg(cfg, opts) {
    opts = opts || {};
    const crop = opts.crop || (opts.corpo ? [0, 0, W, H] : DATA.busto);
    const chave = JSON.stringify([limpar(cfg || padrao()), crop, !!opts.semFundo]);
    if (cache.has(chave)) return cache.get(chave);
    const px = pixels(cfg);
    const [x0, y0, x1, y1] = crop;
    const grupos = new Map();
    const add = (cor, x, y, w) => { const d = grupos.get(cor) || []; d.push('M' + (x - x0) + ' ' + (y - y0) + 'h' + w + 'v1h-' + w + 'z'); grupos.set(cor, d); };
    const varre = (lista, fn) => {
      for (let y = y0; y < y1; y++) {
        let x = x0;
        while (x < x1) {
          const c = fn(lista[y * W + x]);
          if (!c) { x++; continue; }
          let n = 1;
          while (x + n < x1 && fn(lista[y * W + x + n]) === c) n++;
          add(c, x, y, n);
          x += n;
        }
      }
    };
    let saida = '';
    const emite = (extra) => { grupos.forEach((d, cor) => { saida += '<path fill="' + cor + '"' + (extra || '') + ' d="' + d.join('') + '"/>'; }); grupos.clear(); };
    if (!opts.semFundo) { varre(px.fundo, (c) => c); emite(); }
    varre(px.sombra, (c) => (c ? '#000000' : null)); emite(' fill-opacity=".28"');
    varre(px.corpo, (c) => c); emite();
    const s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + (x1 - x0) + ' ' + (y1 - y0) + '" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">' + saida + '</svg>';
    if (cache.size > 500) cache.clear();
    cache.set(chave, s);
    return s;
  }

  function faltando(cfg, possuidas) {
    cfg = limpar(cfg);
    const tem = new Set(possuidas || []);
    const lista = [];
    DATA.cats.forEach((c) => {
      const it = c.por[cfg[c.id]];
      if (it && it.preco > 0 && !tem.has(c.id + ':' + it.id)) lista.push({ cat: c.id, id: it.id, nome: it.nome, preco: it.preco });
    });
    return { lista, total: lista.reduce((s, x) => s + x.preco, 0) };
  }

  window.BriifAvatar = { DATA, padrao, item, limpar, svg, pixels, faltando, cat: (id) => POR_CAT[id] };
})();
'''
out = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'js', 'avatar.js')
open(out, 'w', encoding='utf-8').write(JS.replace('__DATA__', DATA))
print('avatar.js', len(JS) + len(DATA), 'bytes')
