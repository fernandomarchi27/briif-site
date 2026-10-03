/* ==========================================================================
   Briiff — núcleo compartilhado (todas as páginas carregam este arquivo)
   - Ícones SVG
   - Sessão / login (Firebase quando configurado, modo demonstração caso contrário)
   - Progresso do aluno (XP, nível, moedas, ofensiva) — mesma regra do app Flutter
   - Header e footer
   ========================================================================== */
(function () {
  'use strict';

  const DATA = window.BRIIF_DATA;
  const TRILHAS = DATA.trilhas;
  const AULAS = DATA.aulas;

  // As trilhas azul e laranja do app usam as cores de marca; assim elas mudam junto com o tema de cores.
  // t.on = cor do texto que fica sobre o fundo da trilha.
  (function () {
    const MARCA = { '#4a3ae3': ['var(--indigo)', 'var(--on-indigo)'], '#ff6b4a': ['var(--coral)', 'var(--on-coral)'] };
    TRILHAS.forEach((t) => {
      const m = MARCA[String(t.cor).toLowerCase()];
      t.on = m ? m[1] : '#fff';
      if (m) t.cor = m[0];
    });
  })();


  /* ---------------------------- Ícones ---------------------------- */
  const svg = (inner, extra = '') =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${inner}</svg>`;

  const ICONS = {
    flame: svg('<path fill="currentColor" d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14.37c.38 5.6 5.11 7.32 6.81 7.54 2.43.31 5.06-.14 6.95-1.87 2.08-1.93 2.84-5.01 1.72-7.69z"/>'),
    coin: svg('<circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M12 6.2v11.6M9.2 9.6c0-1.2 1.2-2 2.8-2s2.8.8 2.8 2-1.2 1.9-2.8 2.4-2.8 1.2-2.8 2.4 1.2 2 2.8 2 2.8-.8 2.8-2" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/>'),
    check: svg('<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    user: svg('<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
    sun: svg('<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    paleta: svg('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.9-.9 1.6-1.9-.3-1 .3-2.1 1.4-2.1H17a4 4 0 0 0 4-4c0-5-4-10-9-10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.6" cy="11.6" r="1.3" fill="currentColor"/><circle cx="10.6" cy="7.6" r="1.3" fill="currentColor"/><circle cx="15.2" cy="8" r="1.3" fill="currentColor"/>'),
    volume: svg('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    mudo: svg('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
    menu: svg('<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>', 'width="22" height="22"'),
    google: `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`,
    algebra: svg('<path fill="currentColor" d="M18 4H6v2l6.5 6L6 18v2h12v-3h-7l5-5-5-5h7z"/>'),
    geometria: svg('<path d="M12 3.5 2.8 20h18.4z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>'),
    funcoes: svg('<path d="M3 20V4M3 20h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 16c3 0 3-9 6-9s3 9 6 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'),
    enem: svg('<path d="M12 4 2 9l10 5 10-5-10-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6 11.5V16c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5M22 9v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
    mix: svg('<path d="M3 6h4l9 12h5M3 18h4l2.2-3M15 6h6M18 3l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
    estatistica: svg('<rect x="4" y="12" width="4" height="8" rx="1" fill="currentColor"/><rect x="10" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="16" y="9" width="4" height="11" rx="1" fill="currentColor"/>'),
    config: svg('<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 13.5a7.97 7.97 0 0 0 0-3l2-1.4-2-3.4-2.3.9a8 8 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.6a8 8 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.4a7.97 7.97 0 0 0 0 3l-2 1.4 2 3.4 2.3-.9a8 8 0 0 0 2.6 1.5l.5 2.6h4l.5-2.6a8 8 0 0 0 2.6-1.5l2.3.9 2-3.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>')
  };

  /* ---- Avatares da loja: ilustrações simples em estilo flat, cada um com sua cor de fundo ---- */
  const AVATARES = [
    {
      id: 'mago-roxo', nome: 'Mago Roxo', preco: 100, cor: '#2A1F5C',
      svg: '<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
        + '<rect width="64" height="64" fill="#2A1F5C"/>'
        + '<path d="M32 6 20 30h24z" fill="#4C3CAD"/>'
        + '<path d="M14 58c2-16 8-24 18-24s16 8 18 24z" fill="#3B2E8F"/>'
        + '<circle cx="26" cy="35" r="2.6" fill="#fff"/><circle cx="38" cy="35" r="2.6" fill="#fff"/>'
        + '<circle cx="32" cy="50" r="5.5" fill="#CFC5FF" opacity=".9"/>'
        + '</svg>'
    },
    {
      id: 'bubu', nome: 'Bubu', preco: 100, cor: '#13294B',
      svg: '<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
        + '<rect width="64" height="64" fill="#13294B"/>'
        + '<path d="M10 60c2-14 10-20 22-20s20 6 22 20z" fill="#14151A"/>'
        + '<ellipse cx="32" cy="28" rx="13" ry="14" fill="#E8B894"/>'
        + '<path d="M19 23c0-9 6-14 13-14s13 5 13 14c-4-3-9-4-13-4s-9 1-13 4z" fill="#3B2A20"/>'
        + '<rect x="19" y="26" width="10" height="7" rx="2" fill="none" stroke="#14151A" stroke-width="2.2"/>'
        + '<rect x="35" y="26" width="10" height="7" rx="2" fill="none" stroke="#14151A" stroke-width="2.2"/>'
        + '<line x1="29" y1="29" x2="35" y2="29" stroke="#14151A" stroke-width="2.2"/>'
        + '</svg>'
    },
    {
      id: 'riri', nome: 'Riri', preco: 100, cor: '#1C2E52',
      svg: '<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
        + '<rect width="64" height="64" fill="#1C2E52"/>'
        + '<path d="M10 60c2-13 10-19 22-19s20 6 22 19z" fill="#F4F4F2"/>'
        + '<path d="M25 44c2.5 3 11.5 3 14 0l-2 11H27z" fill="#14151A"/>'
        + '<ellipse cx="32" cy="27" rx="13" ry="14" fill="#EAC09A"/>'
        + '<path d="M18 22c1-10 7-15 14-15s13 5 14 15c-3-4-9-6-14-6s-11 2-14 6z" fill="#3B2A20"/>'
        + '</svg>'
    },
    {
      id: 'fefe', nome: 'Fefe', preco: 100, cor: '#2E1F57',
      svg: '<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
        + '<rect width="64" height="64" fill="#2E1F57"/>'
        + '<path d="M10 60c2-13 10-19 22-19s20 6 22 19z" fill="#F4F4F2"/>'
        + '<ellipse cx="32" cy="27" rx="13" ry="14" fill="#E3AE86"/>'
        + '<path d="M17 21c1-11 7-16 15-16s14 5 15 16c-4-4-10-6-15-6s-11 2-15 6z" fill="#171018"/>'
        + '<rect x="17" y="24" width="30" height="8" rx="4" fill="#14151A"/>'
        + '</svg>'
    }
  ];
  const AVATARES_POR_ID = {};
  AVATARES.forEach((a) => { AVATARES_POR_ID[a.id] = a; });
  /* ---- Versões pixel art dos ícones (aparecem só no modo pixel) ---- */
  // '#' = cor do ícone, 'o' = brilho
  const pxArt = (rows) => {
    const h = rows.length, w = rows[0].length;
    let r = '';
    rows.forEach((row, y) => {
      let x = 0;
      while (x < w) {
        const c = row[x];
        if (c === '.') { x++; continue; }
        let e = x;
        while (e < w && row[e] === c) e++;
        r += `<rect x="${x}" y="${y}" width="${e - x}" height="1" ${c === 'o' ? 'fill="#fff" fill-opacity=".6"' : 'fill="currentColor"'}/>`;
        x = e;
      }
    });
    return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  };
  const dual = (suave, pix, cls = '') => `<span class="ic-s">${suave}</span><span class="ic-p ${cls}">${pix}</span>`;
  // ícones de marca (arte nova): moeda, fogo e cadeado; no modo pixel usa a versão pixel art tingida
  const img = (nome) => `<img class="ico-img" src="assets/img/${nome}.svg" alt="" width="64" height="64" decoding="async" draggable="false">`;

  const PX = {
    flame: pxArt([
      '....##....', '...###....', '...####..#', '..#####.##', '..########', '.#########',
      '.####o####', '.###ooo###', '.###ooo###', '..###o###.', '..#######.', '...#####..']),
    coin: pxArt([
      '...######...', '..########..', '.##oo######.', '.#o########.', '############', '############',
      '############', '############', '.##########.', '.##########.', '..########..', '...######...']),
    check: pxArt([
      '..........##', '.........###', '........###.', '##.....###..', '###...###...', '.###.###....',
      '..#####.....', '...###......', '....#.......']),
    lock: pxArt([
      '...####...', '..##..##..', '..##..##..', '..##..##..', '.########.', '.########.',
      '.###..###.', '.###..###.', '.########.', '.########.']),
    moon: pxArt([
      '...####...', '..###.....', '.###......', '.###......', '.###......', '.###......',
      '.####....#', '..#####.##', '...#######', '....#####.']),
    sun: pxArt([
      '....#....', '.#.....#.', '..#####..', '..#####..', '#.#####.#', '..#####..',
      '..#####..', '.#.....#.', '....#....']),
    paleta: pxArt([
      '.........##', '........###', '.......###.', '......###..', '.....###...', '...#####...',
      '..#######..', '.#########.', '.#########.', '..#######..']),
    volume: pxArt([
      '.....#......', '....##...#..', '###.##....#.', '###.##.#..#.', '###.##.#..#.', '###.##....#.', '....##...#..', '.....#......']),
    mudo: pxArt([
      '.....#......', '....##......', '###.##.#...#', '###.##..#.#.', '###.##...#..', '###.##..#.#.', '....##.#...#', '.....#......']),
    gamepad: pxArt([
      '..#########..', '.###########.', '####.#####.##', '###...###.###', '####.####.#.#',
      '.###########.', '.####...####.', '..###.....##.'])
  };
  ICONS.flame = dual(img('fogo'), PX.flame, 'px-fogo');
  ICONS.coin = dual(img('moeda'), PX.coin, 'px-moeda');
  ICONS.bloqueio = dual(img('bloqueio'), PX.lock, 'px-bloqueio');   // bloqueio de ofensiva (o cadeado simples segue nas fases bloqueadas)
  ICONS.check = dual(ICONS.check, PX.check);
  ICONS.lock = dual(ICONS.lock, PX.lock);
  ICONS.moon = dual(ICONS.moon, PX.moon);
  ICONS.sun = dual(ICONS.sun, PX.sun);
  ICONS.paleta = dual(ICONS.paleta, PX.paleta);
  ICONS.gamepad = PX.gamepad;
  ICONS.volume = dual(ICONS.volume, PX.volume);
  ICONS.mudo = dual(ICONS.mudo, PX.mudo);

  /* ---- Logo pixel art: π (imagem oficial) e palavra BRIIF (glifos do spritesheet) ---- */
  // π na grade 20×20 da imagem: [x, y, largura, altura]
  const PI_RECTS = [[6, 6, 8, 1], [14, 5, 1, 1], [5, 7, 1, 1], [7, 8, 2, 6], [11, 8, 2, 6]];
  // letras 3×5 (I = 2×5), extraídas da animação de entrada
  const GLIFOS = {
    B: ['###', '#.#', '##.', '#.#', '###'],
    R: ['###', '#.#', '##.', '#.#', '#.#'],
    I: ['##', '##', '##', '##', '##'],
    F: ['###', '#..', '###', '#..', '#..']
  };
  const glifoRects = (g, ox, oy, cls) => {
    let r = '';
    GLIFOS[g].forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        if (row[x] !== '#') { x++; continue; }
        let e = x;
        while (e < row.length && row[e] === '#') e++;
        r += `<rect x="${ox + x}" y="${oy + y}" width="${e - x}" height="1"/>`;
        x = e;
      }
    });
    return `<g class="${cls}">${r}</g>`;
  };
  const iconePi = () =>
    `<svg class="pxicon" viewBox="3 3 14 14" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="3" width="14" height="14" fill="var(--indigo)"/><g fill="#fff">${PI_RECTS.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g></svg>`;
  const palavraSvg = () =>
    `<svg class="pxword" viewBox="0 0 21 5" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${glifoRects('B', 0, 0, 'w-b')}${glifoRects('R', 4, 0, 'w-r')}${glifoRects('I', 8, 0, 'w-i1')}${glifoRects('I', 11, 0, 'w-i2')}${glifoRects('F', 14, 0, 'w-f')}${glifoRects('F', 18, 0, 'w-f2')}</svg>`;
  // animação de entrada: π → BRIIF (as pernas do π viram os dois "I")
  const introSvg = () => {
    const bar = [7, 8, 9, 10, 11, 12, 13, 14].map((x, i) => `<rect class="p-bar" style="--i:${i}" x="${x}" y="1" width="1" height="1"/>`).join('');
    return `<svg viewBox="0 0 23 9" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">
      <g class="p-pi">${bar}<rect class="p-dot" style="--i:9" x="15" y="0" width="1" height="1"/><rect class="p-dot" style="--i:-1" x="6" y="2" width="1" height="1"/>
      <rect class="p-leg" x="8" y="3" width="2" height="6"/><rect class="p-leg" x="12" y="3" width="2" height="6"/></g>
      ${glifoRects('B', 1, 4, 'w-b')}${glifoRects('R', 5, 4, 'w-r')}${glifoRects('I', 9, 4, 'w-i1')}${glifoRects('I', 12, 4, 'w-i2')}${glifoRects('F', 15, 4, 'w-f')}${glifoRects('F', 19, 4, 'w-f2')}
    </svg>`;
  };
  const logoPixel = (grande) => grande
    ? `<span class="pxintro" aria-hidden="true">${introSvg()}</span>`
    : `<span class="pxlogo" aria-hidden="true">${iconePi()}${palavraSvg()}</span>`;
  /** Garante o logo pixel em todos os .wordmark, inclusive os escritos direto no HTML. */
  function melhorarLogos() {
    document.querySelectorAll('.wordmark').forEach((a) => {
      if (a.querySelector('.pxlogo, .pxintro')) return;
      a.insertAdjacentHTML('beforeend', logoPixel(a.classList.contains('lg')));
    });
  }

  const TRILHA_ICON = { algebra: 'algebra', geometria: 'geometria', funcoes: 'funcoes', estatistica: 'estatistica' };
  // ids do app: algebra, geometria?, funcoes?, estatistica? — cobrimos variações
  function trilhaIcon(t) {
    const id = (t.id || '').toLowerCase();
    if (id.startsWith('alg')) return ICONS.algebra;
    if (id.startsWith('geo')) return ICONS.geometria;
    if (id.startsWith('fun')) return ICONS.funcoes;
    if (id.startsWith('enem')) return ICONS.enem;
    if (id.startsWith('personalizada')) return ICONS.mix;
    return ICONS.estatistica;
  }

  /* ---------------------------- Utilidades ---------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmt(n, casas = 4) {
    if (!isFinite(n)) return String(n);
    const r = Math.round(n * Math.pow(10, casas)) / Math.pow(10, casas);
    return String(r).replace('.', ',').replace('-', '−');
  }

  /** Converte o texto das lições do app (quebras de linha, "•", "1.") em HTML. */
  function rich(text) {
    const lines = String(text || '').split('\n');
    let html = '';
    let list = null; // 'ul' | 'ol'
    let para = [];
    const flushPara = () => { if (para.length) { html += '<p>' + para.join('<br>') + '</p>'; para = []; } };
    const flushList = () => { if (list) { html += `</${list}>`; list = null; } };
    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) { flushPara(); flushList(); return; }
      let m;
      if (line.startsWith('• ')) {
        flushPara();
        if (list !== 'ul') { flushList(); html += '<ul>'; list = 'ul'; }
        html += '<li>' + esc(line.slice(2)) + '</li>';
      } else if ((m = line.match(/^(\d+)\.\s+(.*)$/))) {
        flushPara();
        if (list !== 'ol') { flushList(); html += '<ol>'; list = 'ol'; }
        html += '<li>' + esc(m[2]) + '</li>';
      } else {
        flushList();
        para.push(esc(line));
      }
    });
    flushPara(); flushList();
    return html;
  }

  /* ---------------------------- Datas ---------------------------- */
  const pad = (n) => String(n).padStart(2, '0');
  function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function diffDias(a, b) { // b - a em dias
    const [ya, ma, da] = a.split('-').map(Number);
    const [yb, mb, db] = b.split('-').map(Number);
    return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
  }
  function diaSeguinte(a) { // devolve a data do dia seguinte a "a" (AAAA-MM-DD)
    const [ya, ma, da] = a.split('-').map(Number);
    const d = new Date(Date.UTC(ya, ma - 1, da + 1));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }

  /* ---------------------------- Sessão ---------------------------- */
  const SESSION_KEY = 'briif:session';
  const cfg = window.BRIIF_FIREBASE_CONFIG;
  const firebaseAtivo = !!(cfg && cfg.apiKey && cfg.apiKey.indexOf('COLE_') !== 0);

  function lerSessao() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }
  function salvarSessao(s) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) { /* ignora */ }
  }
  function limparSessao() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignora */ }
  }

  let fbPromise = null;
  function carregarScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('Falha ao carregar ' + src));
      document.head.appendChild(s);
    });
  }
  function carregarFirebase() {
    if (!firebaseAtivo) return Promise.reject(new Error('firebase-desativado'));
    if (!fbPromise) {
      const v = '10.14.1';
      fbPromise = carregarScript(`https://www.gstatic.com/firebasejs/${v}/firebase-app-compat.js`)
        .then(() => carregarScript(`https://www.gstatic.com/firebasejs/${v}/firebase-auth-compat.js`))
        .then(() => carregarScript(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore-compat.js`))
        .then(() => {
          if (!window.firebase.apps.length) window.firebase.initializeApp(cfg);
          return window.firebase;
        });
    }
    return fbPromise;
  }

  function sessaoDe(user, extra = {}) {
    return {
      uid: user.uid,
      nome: user.displayName || extra.nome || (user.isAnonymous ? 'Convidado' : (user.email || 'Aluno').split('@')[0]),
      email: user.email || '',
      foto: user.photoURL || '',
      tipo: user.isAnonymous ? 'anonimo' : (extra.tipo || 'email'),
      modo: 'firebase'
    };
  }

  const MENSAGENS = {
    'auth/invalid-email': 'Esse e-mail não parece válido.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail. Crie uma conta na aba ao lado.',
    'auth/email-already-in-use': 'Esse e-mail já tem conta. Use a aba Entrar.',
    'auth/weak-password': 'Use uma senha com pelo menos 6 caracteres.',
    'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de terminar.',
    'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de terminar.',
    'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups para este site.',
    'auth/unauthorized-domain': 'Este domínio ainda não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).',
    'auth/operation-not-allowed': 'Esse método de login ainda não foi ativado no console do Firebase.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
    'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente de novo.'
  };
  function erroAmigavel(e) {
    return MENSAGENS[e && e.code] || 'Não foi possível entrar agora. Tente novamente.';
  }

  const auth = {
    firebaseAtivo,
    sessao: lerSessao,

    /** Cada método devolve se a conta é NOVA (serve pra decidir se mostra o onboarding). */
    async google() {
      const fb = await carregarFirebase();
      const provedor = new fb.auth.GoogleAuthProvider();
      provedor.setCustomParameters({ prompt: 'select_account' });
      const r = await fb.auth().signInWithPopup(provedor);
      salvarSessao(sessaoDe(r.user, { tipo: 'google' }));
      const novo = !!(r.additionalUserInfo && r.additionalUserInfo.isNewUser) && concederBoasVindas();
      await sincronizar().catch(avisoSync);
      return novo;
    },
    async convidado() {
      if (firebaseAtivo) {
        const fb = await carregarFirebase();
        const r = await fb.auth().signInAnonymously();
        salvarSessao(sessaoDe(r.user));
        const novo = !!(r.additionalUserInfo && r.additionalUserInfo.isNewUser) && concederBoasVindas();
        await sincronizar().catch(avisoSync);
        return novo;
      }
      salvarSessao({ uid: 'convidado-local', nome: 'Convidado', email: '', tipo: 'anonimo', modo: 'demo' });
      return concederBoasVindas();
    },
    async entrarEmail(email, senha) {
      const fb = await carregarFirebase();
      const r = await fb.auth().signInWithEmailAndPassword(email, senha);
      salvarSessao(sessaoDe(r.user));
      await sincronizar().catch(avisoSync);
      return false;
    },
    async criarConta(nome, email, senha) {
      const fb = await carregarFirebase();
      const r = await fb.auth().createUserWithEmailAndPassword(email, senha);
      if (nome) { await r.user.updateProfile({ displayName: nome }); }
      salvarSessao(sessaoDe(r.user, { nome }));
      const novo = concederBoasVindas();
      await sincronizar().catch(avisoSync);
      return novo;
    },
    demo(nome, email) {
      const id = 'demo-' + (email || nome).toLowerCase().replace(/[^a-z0-9]/g, '');
      salvarSessao({ uid: id, nome: nome || 'Aluno', email: email || '', tipo: 'demo', modo: 'demo' });
      return concederBoasVindas();
    },
    async sair() {
      limparSessao();
      if (firebaseAtivo) {
        try { const fb = await carregarFirebase(); await fb.auth().signOut(); } catch (e) { /* segue */ }
      }
    },
    erroAmigavel
  };

  /* ---------------------------- Trilha Personalizada ----------------------------
     O aluno escolhe pelo menos 2 matérias (entre as trilhas reais) e o site
     monta 5 fases misturando as questões dessas matérias. Fica guardada por
     pessoa (mesma chave de uid do progresso), então cada um tem a sua. */
  const MATERIAS_PERSONALIZAVEIS = TRILHAS.map((t) => ({ id: t.id, nome: t.nome, cor: t.cor }));
  const MIN_MATERIAS = 2;
  const personalizadaEntry = { id: 'personalizada', nome: 'Personalizada', cor: '#7C3AED', on: '#fff', fases: [], materias: [] };
  TRILHAS.push(personalizadaEntry);

  function chavePersonalizada() {
    const s = lerSessao();
    return 'briif:personalizada:' + (s ? s.uid : 'visitante');
  }
  function lerSelecaoPersonalizada() {
    let v;
    try { v = JSON.parse(localStorage.getItem(chavePersonalizada())); } catch (e) { v = null; }
    const materias = v && Array.isArray(v.materias) ? v.materias : [];
    return materias.filter((id) => MATERIAS_PERSONALIZAVEIS.some((m) => m.id === id));
  }
  function salvarSelecaoPersonalizada(materias) {
    try { localStorage.setItem(chavePersonalizada(), JSON.stringify({ materias })); } catch (e) { /* ignora */ }
  }

  /** Junta as questões das matérias escolhidas, intercaladas, e corta em 5 fases de 3. */
  function construirFasesPersonalizadas(materias) {
    const pools = materias.map((id) => {
      const t = TRILHAS.find((x) => x.id === id);
      const lista = [];
      if (t) t.fases.forEach((f) => f.exercicios.forEach((e) => lista.push(Object.assign({}, e, { materia: t.nome, materiaCor: t.cor }))));
      return lista;
    });
    const TOTAL = 30; // até 10 fases × 3 questões, misturando as matérias escolhidas
    const misturado = [];
    let avancou = true;
    while (misturado.length < TOTAL && avancou) {
      avancou = false;
      for (const pool of pools) {
        if (pool.length) { misturado.push(pool.shift()); avancou = true; }
        if (misturado.length >= TOTAL) break;
      }
    }
    const fases = [];
    for (let k = 0; k < 10 && misturado.length; k++) {
      const trio = misturado.splice(0, 3);
      if (!trio.length) break;
      const nomes = Array.from(new Set(trio.map((e) => e.materia)));
      fases.push({
        id: `personalizada_${k + 1}`, numero: k + 1,
        titulo: `Revisão ${k + 1}`, licaoTitulo: 'Mistura de questões',
        licao: `Esta fase mistura ${trio.length} questões de: ${nomes.join(', ')}.\n\nComo são matérias diferentes, aqui não tem uma explicação nova: é a hora de repassar o que você já viu em cada uma. Preste atenção no assunto de cada questão antes de resolver.`,
        xp: 20, exercicios: trio, materiasNomes: nomes
      });
    }
    return fases;
  }
  /** "Aula" genérica de uma fase mista: sem exemplos novos, só orientação. */
  function construirAulaPersonalizada(fase) {
    const nomes = fase.materiasNomes || [];
    return {
      passos: [
        `Esta fase mistura questões de mais de uma matéria: ${nomes.join(', ')}.`,
        'Por isso não há uma explicação nova aqui — é hora de praticar o que você já estudou em cada uma.',
        'Reconhecer qual matéria a questão pede, antes mesmo de resolver, também é treino: no ENEM as questões não vêm separadas por assunto.'
      ],
      exemplos: [],
      erro: 'Cada matéria tem os próprios erros comuns. Se travar numa questão, volte para a trilha dela e revise a fase correspondente.',
      enem: 'Misturar matérias treina o que a prova cobra de verdade: primeiro identificar do que se trata, depois aplicar o método certo.'
    };
  }
  function montarFasesEAulas(materias) {
    if (materias.length < MIN_MATERIAS) return [];
    const fases = construirFasesPersonalizadas(materias);
    fases.forEach((f) => { AULAS[f.id] = construirAulaPersonalizada(f); });
    return fases;
  }
  // aplica a seleção salva assim que a página carrega, sem mexer no progresso
  personalizadaEntry.materias = lerSelecaoPersonalizada();
  personalizadaEntry.fases = montarFasesEAulas(personalizadaEntry.materias);

  /** Chamado pela tela de Trilhas quando a pessoa salva as matérias escolhidas.
   *  Devolve true se a seleção mudou (e por isso o progresso da trilha foi zerado). */
  function salvarNovaSelecaoPersonalizada(materias) {
    materias = (materias || []).filter((id) => MATERIAS_PERSONALIZAVEIS.some((m) => m.id === id));
    const antiga = personalizadaEntry.materias || [];
    const mudou = antiga.length !== materias.length || materias.some((id) => antiga.indexOf(id) === -1);
    if (mudou) resetarProgressoPersonalizada();
    personalizadaEntry.fases = montarFasesEAulas(materias);
    personalizadaEntry.materias = materias;
    salvarSelecaoPersonalizada(materias);
    return mudou;
  }

  /* ---------------------------- Progresso ---------------------------- */
  const REWARD = { moedasPorLicao: 10, crescimentoXpPorNivel: 1.25, xpBaseNivel1: 100 };
  /* Loja: por enquanto só o bloqueio de ofensiva. */
  const LOJA = {
    custoBloqueio: 50, bloqueiosPorNivel: 1, bloqueiosBoasVindas: 2,
    // código promocional de moedas grátis (configurações da loja) — por enquanto sem limite de usos
    codigoMoedas: '#fefe10', limiteCodigoMoedas: 10000
  };

  function chaveProgresso() {
    const s = lerSessao();
    return 'briif:progress:' + (s ? s.uid : 'visitante');
  }

  function progressoVazio() {
    return { xp: 0, nivel: 1, xpProx: REWARD.xpBaseNivel1, moedas: 0, bloqueios: 0, fases: [], streak: 0, recorde: 0, ultimoDia: null, dias: [], porTrilha: {}, ultimo: null, boasVindasDadas: false, avatares: [], avatarAtivo: null, avatarAtivoTs: 0 };
  }

  function lerProgresso() {
    let p;
    try { p = JSON.parse(localStorage.getItem(chaveProgresso())); } catch (e) { p = null; }
    p = Object.assign(progressoVazio(), p || {});
    // Ofensiva: se pulou dia(s), usa bloqueios de ofensiva guardados pra cobrir
    // automaticamente, um bloqueio por dia perdido. Só quebra se não tiver o suficiente.
    if (p.streak > 0 && p.ultimoDia) {
      let mudou = false;
      while (diffDias(p.ultimoDia, hoje()) > 1 && p.bloqueios > 0) {
        p.bloqueios -= 1;
        p.ultimoDia = diaSeguinte(p.ultimoDia);
        mudou = true;
      }
      if (diffDias(p.ultimoDia, hoje()) > 1) { p.streak = 0; mudou = true; }
      if (mudou) { salvarProgresso(p); agendarEnvio(); }
    }
    return p;
  }

  /** Dá o bônus de boas-vindas (2 bloqueios de ofensiva) uma única vez por conta.
   *  Devolve true só da primeira vez — serve também pra saber se a conta é nova. */
  function concederBoasVindas() {
    const p = lerProgresso();
    if (p.boasVindasDadas) return false;
    p.bloqueios = (p.bloqueios || 0) + LOJA.bloqueiosBoasVindas;
    p.boasVindasDadas = true;
    salvarProgresso(p);
    agendarEnvio();
    return true;
  }

  /** Compra um bloqueio de ofensiva com MathCoins. Devolve { ok, motivo, progresso }. */
  function comprarBloqueio() {
    const p = lerProgresso();
    if (p.moedas < LOJA.custoBloqueio) return { ok: false, motivo: 'moedas', progresso: p };
    p.moedas -= LOJA.custoBloqueio;
    p.bloqueios = (p.bloqueios || 0) + 1;
    salvarProgresso(p);
    agendarEnvio();
    return { ok: true, progresso: p };
  }

  /** Compra um avatar da loja com MathCoins. Devolve { ok, motivo, progresso }. */
  function comprarAvatar(id) {
    const av = AVATARES_POR_ID[id];
    const p = lerProgresso();
    if (!av) return { ok: false, motivo: 'invalido', progresso: p };
    if ((p.avatares || []).indexOf(id) !== -1) return { ok: false, motivo: 'ja_tem', progresso: p };
    if (p.moedas < av.preco) return { ok: false, motivo: 'moedas', progresso: p };
    p.moedas -= av.preco;
    p.avatares = (p.avatares || []).concat([id]);
    salvarProgresso(p);
    agendarEnvio();
    return { ok: true, progresso: p };
  }

  /** Define o avatar ativo (precisa já ter comprado) ou null pra voltar à foto/inicial padrão. */
  function selecionarAvatar(id) {
    const p = lerProgresso();
    if (id !== null && (p.avatares || []).indexOf(id) === -1) return { ok: false, motivo: 'nao_possui', progresso: p };
    p.avatarAtivo = id;
    p.avatarAtivoTs = Date.now();
    salvarProgresso(p);
    agendarEnvio();
    return { ok: true, progresso: p };
  }

  /** Confere se o código promocional de moedas digitado é válido. */
  function validarCodigoMoedas(codigo) {
    return String(codigo || '').trim().toLowerCase() === LOJA.codigoMoedas.toLowerCase();
  }

  /** Resgata o código e credita a quantidade escolhida de MathCoins (até o limite). */
  function resgatarCodigoMoedas(codigo, quantidade) {
    if (!validarCodigoMoedas(codigo)) return { ok: false, motivo: 'codigo' };
    const qtd = Math.round(Number(quantidade));
    if (!qtd || qtd < 1) return { ok: false, motivo: 'quantidade' };
    if (qtd > LOJA.limiteCodigoMoedas) return { ok: false, motivo: 'limite' };
    const p = lerProgresso();
    p.moedas = (p.moedas || 0) + qtd;
    salvarProgresso(p);
    agendarEnvio();
    return { ok: true, quantidade: qtd, progresso: p };
  }
  function salvarProgresso(p) {
    try { localStorage.setItem(chaveProgresso(), JSON.stringify(p)); } catch (e) { /* ignora */ }
  }

  const ofensivaFeitaHoje = (p) => p.ultimoDia === hoje();
  const faseCompleta = (p, id) => p.fases.indexOf(id) !== -1;

  /** Registra a conclusão de uma fase. Devolve o resumo para a tela de resultado. */
  function completarFase(faseId, trilhaId, xpGanho, acertos, total) {
    const p = lerProgresso();
    const jaTinha = faseCompleta(p, faseId);
    const resumo = { primeiraVez: !jaTinha, xp: 0, moedas: 0, subiu: false, nivelAntes: p.nivel, streakAumentou: false };

    if (!jaTinha) {
      resumo.xp = xpGanho;
      resumo.moedas = REWARD.moedasPorLicao;
      p.fases.push(faseId);
      p.xp += xpGanho;
      p.moedas += resumo.moedas;
      while (p.xp >= p.xpProx) {
        p.xp -= p.xpProx;
        p.nivel += 1;
        p.xpProx = Math.round(p.xpProx * REWARD.crescimentoXpPorNivel);
        p.bloqueios = (p.bloqueios || 0) + LOJA.bloqueiosPorNivel;
        resumo.subiu = true;
        resumo.bloqueioGanho = (resumo.bloqueioGanho || 0) + LOJA.bloqueiosPorNivel;
      }
    }

    // ofensiva: conta um dia quando conclui pelo menos uma atividade
    const h = hoje();
    if (!p.ultimoDia) { p.streak = 1; resumo.streakAumentou = true; }
    else {
      const d = diffDias(p.ultimoDia, h);
      if (d === 1) { p.streak += 1; resumo.streakAumentou = true; }
      else if (d > 1) { p.streak = 1; resumo.streakAumentou = true; }
    }
    if (p.streak > p.recorde) p.recorde = p.streak;
    p.ultimoDia = h;
    if (p.dias.indexOf(h) === -1) p.dias.push(h);

    const pt = p.porTrilha[trilhaId] || { acertos: 0, total: 0, atual: faseId };
    pt.acertos += acertos; pt.total += total; pt.atual = faseId;
    p.porTrilha[trilhaId] = pt;

    resumo.streak = p.streak;
    p.ultimo = { faseId, acertos, total, ts: Date.now() };
    salvarProgresso(p);
    agendarEnvio();
    return resumo;
  }

  /** Refaz XP e nível a partir das fases concluídas (usa o xp de cada fase hoje, via acharFase). */
  function recalcularNivel(p) {
    let total = 0;
    p.fases.forEach((id) => { const a = acharFase(id); if (a) total += a.fase.xp; });
    p.xp = total; p.nivel = 1; p.xpProx = REWARD.xpBaseNivel1;
    while (p.xp >= p.xpProx) { p.xp -= p.xpProx; p.nivel += 1; p.xpProx = Math.round(p.xpProx * REWARD.crescimentoXpPorNivel); }
  }
  /** Limpa o progresso só da trilha Personalizada (chamado quando as matérias mudam). */
  function resetarProgressoPersonalizada() {
    const p = lerProgresso();
    const restantes = p.fases.filter((id) => id.indexOf('personalizada_') !== 0);
    if (restantes.length === p.fases.length) return; // nada para limpar
    p.fases = restantes;
    delete p.porTrilha.personalizada;
    if (p.ultimo && p.ultimo.faseId && p.ultimo.faseId.indexOf('personalizada_') === 0) p.ultimo = null;
    recalcularNivel(p);
    salvarProgresso(p);
    agendarEnvio();
  }

  /* ---------------------------- Banco de dados (Firestore) ----------------------------
     Guarda o perfil e o progresso em  usuarios/{uid}.
     Usa o projeto Firebase do SITE (independente do app). */
  function avisoSync(e) {
    console.warn('[Briif] Não foi possível sincronizar com o Firestore:', e && (e.code || e.message));
  }

  /** Junta o progresso do navegador com o da nuvem sem perder nada. */
  function mesclar(local, remoto) {
    const l = Object.assign(progressoVazio(), local || {});
    const r = Object.assign(progressoVazio(), remoto || {});
    const m = progressoVazio();

    m.fases = Array.from(new Set([].concat(l.fases || [], r.fases || [])));
    // XP e nível são recalculados a partir das fases concluídas
    let total = 0;
    m.fases.forEach((id) => { const a = acharFase(id); if (a) total += a.fase.xp; });
    m.xp = total;
    while (m.xp >= m.xpProx) {
      m.xp -= m.xpProx;
      m.nivel += 1;
      m.xpProx = Math.round(m.xpProx * REWARD.crescimentoXpPorNivel);
    }
    m.moedas = Math.max(l.moedas || 0, r.moedas || 0);
    m.bloqueios = Math.max(l.bloqueios || 0, r.bloqueios || 0);
    m.boasVindasDadas = !!(l.boasVindasDadas || r.boasVindasDadas);
    m.avatares = Array.from(new Set([].concat(l.avatares || [], r.avatares || [])));
    m.avatarAtivoTs = Math.max(l.avatarAtivoTs || 0, r.avatarAtivoTs || 0);
    m.avatarAtivo = (l.avatarAtivoTs || 0) >= (r.avatarAtivoTs || 0) ? (l.avatarAtivo || null) : (r.avatarAtivo || null);

    // ofensiva: vale a do dia de estudo mais recente
    const base = (l.ultimoDia || '') > (r.ultimoDia || '') ? l
      : (r.ultimoDia || '') > (l.ultimoDia || '') ? r
        : ((l.streak || 0) >= (r.streak || 0) ? l : r);
    m.streak = base.streak || 0;
    m.ultimoDia = base.ultimoDia || null;
    m.recorde = Math.max(l.recorde || 0, r.recorde || 0, m.streak);
    m.dias = Array.from(new Set([].concat(l.dias || [], r.dias || []))).sort();

    const chaves = Array.from(new Set(Object.keys(l.porTrilha || {}).concat(Object.keys(r.porTrilha || {}))));
    chaves.forEach((k) => {
      const a = (l.porTrilha || {})[k], b = (r.porTrilha || {})[k];
      m.porTrilha[k] = !a ? b : !b ? a : (b.total > a.total ? b : a);
    });
    m.ultimo = ((l.ultimo && l.ultimo.ts) || 0) >= ((r.ultimo && r.ultimo.ts) || 0) ? (l.ultimo || null) : (r.ultimo || null);
    return m;
  }

  let fila = Promise.resolve();
  let temporizadorEnvio = null;

  /* ---------------------------- Ranking (coleção ranking/{uid}) ----------------------------
     Guarda só o que é público: nome abreviado, avatar, XP, acertos e ofensiva.
     E-mail e foto do Google NUNCA vão para o ranking. */
  const xpTotalDe = (p) => {
    let t = 0;
    (p.fases || []).forEach((id) => { const a = acharFase(id); if (a) t += a.fase.xp; });
    return t;
  };
  /** "Maria da Silva Souza" -> "Maria S." */
  function nomePublico(nome, anonimo) {
    if (anonimo) return 'Convidado';
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'Aluno';
    const prim = partes[0].slice(0, 20);
    const ult = partes.length > 1 ? partes[partes.length - 1] : '';
    return ult ? `${prim} ${ult.charAt(0).toUpperCase()}.` : prim;
  }
  const chaveOculto = (uid) => 'briif:rankoculto:' + uid;
  const rankingOculto = (uid) => { try { return localStorage.getItem(chaveOculto(uid)) === '1'; } catch (e) { return false; } };
  function definirRankingOculto(uid, v) {
    try { if (v) localStorage.setItem(chaveOculto(uid), '1'); else localStorage.removeItem(chaveOculto(uid)); } catch (e) { /* ignora */ }
  }
  /** Sai/volta ao ranking: grava a escolha na nuvem e republica (ou apaga) o documento público. */
  async function alterarRankingOculto(v) {
    const s = lerSessao();
    if (!firebaseAtivo || !s || s.modo !== 'firebase') return;
    definirRankingOculto(s.uid, v);
    const fb = await carregarFirebase();
    await fb.firestore().collection('usuarios').doc(s.uid).set({ rankingOculto: v }, { merge: true });
    await sincronizar();
  }
  /** Grava (ou apaga, se a pessoa saiu do ranking) o documento público. Convidados não entram. */
  async function publicarRanking(fb, s, m) {
    if (s.tipo === 'anonimo') return;
    const ref = fb.firestore().collection('ranking').doc(s.uid);
    if (rankingOculto(s.uid)) { await ref.delete(); return; }
    let acertos = 0, total = 0;
    Object.keys(m.porTrilha || {}).forEach((k) => { acertos += m.porTrilha[k].acertos || 0; total += m.porTrilha[k].total || 0; });
    await ref.set({
      nome: nomePublico(s.nome, false),
      avatarId: m.avatarAtivo || null,
      nivel: m.nivel,
      xpTotal: xpTotalDe(m),
      acertos: Math.min(acertos, total), total,
      recorde: m.recorde || 0,
      streak: m.streak || 0,
      atualizadoEm: fb.firestore.FieldValue.serverTimestamp()
    });
  }
  /** Busca o ranking inteiro (até 500 contas); a ordenação por categoria é feita na tela. */
  async function buscarRanking() {
    const fb = await carregarFirebase();
    // espera o Firebase restaurar o login antes de consultar (as regras exigem estar logado)
    const user = await new Promise((res) => { const off = fb.auth().onAuthStateChanged((u) => { off(); res(u); }); });
    if (!user) throw new Error('sem-login');
    const snap = await fb.firestore().collection('ranking').limit(500).get();
    return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
  }
  /** Bolinha de outra pessoa: avatar comprado ou inicial (sem foto, por privacidade). */
  function avatarRanking(d, extra = '') {
    const av = d.avatarId && AVATARES_POR_ID[d.avatarId];
    if (av) return `<span class="avatar avatar-custom ${extra}" title="${esc(av.nome)}">${av.svg}</span>`;
    return `<span class="avatar ${extra}">${esc((d.nome || '?').trim().charAt(0).toUpperCase() || '?')}</span>`;
  }

  /** Lê o progresso da nuvem, mescla com o local e grava o resultado nos dois lugares. */
  function sincronizar() {
    fila = fila.catch(() => { /* erro anterior já foi avisado */ }).then(async () => {
      const s = lerSessao();
      if (!firebaseAtivo || !s || s.modo !== 'firebase') return false;
      const fb = await carregarFirebase();
      const ref = fb.firestore().collection('usuarios').doc(s.uid);
      const snap = await ref.get();
      const dados = snap.exists ? snap.data() : {};
      // a escolha de sair do ranking vale em todos os aparelhos (a nuvem manda)
      if (typeof dados.rankingOculto === 'boolean') definirRankingOculto(s.uid, dados.rankingOculto);
      const local = lerProgresso();
      const m = mesclar(local, dados.progresso);
      const mudou = m.fases.length !== local.fases.length || m.moedas !== local.moedas || m.streak !== local.streak || m.bloqueios !== local.bloqueios;
      salvarProgresso(m);

      const doc = {
        nome: s.nome || '',
        email: s.email || '',
        foto: s.foto || '',
        tipo: s.tipo || '',
        rankingOculto: rankingOculto(s.uid),
        ultimoAcesso: fb.firestore.FieldValue.serverTimestamp(),
        progresso: JSON.parse(JSON.stringify(m))
      };
      if (!snap.exists) doc.criadoEm = fb.firestore.FieldValue.serverTimestamp();
      await ref.set(doc, { merge: true });
      try { await publicarRanking(fb, s, m); } catch (e) { avisoSync(e); }   // ranking nunca derruba a sincronização
      return mudou;
    });
    return fila;
  }
  function agendarEnvio() {
    clearTimeout(temporizadorEnvio);
    temporizadorEnvio = setTimeout(() => { sincronizar().catch(avisoSync); }, 400);
  }

  /* ---------------------------- Consultas no conteúdo ---------------------------- */
  function acharFase(faseId) {
    for (let ti = 0; ti < TRILHAS.length; ti++) {
      const t = TRILHAS[ti];
      for (let fi = 0; fi < t.fases.length; fi++) {
        if (t.fases[fi].id === faseId) return { trilha: t, fase: t.fases[fi], ti, fi };
      }
    }
    return null;
  }
  function faseDisponivel(p, t, fi) {
    return fi === 0 || faseCompleta(p, t.fases[fi - 1].id);
  }
  function proximaFase(ti, fi) {
    const t = TRILHAS[ti];
    if (fi + 1 < t.fases.length) return { trilha: t, fase: t.fases[fi + 1] };
    return null;
  }
  /** "Continue de onde parou": primeira fase disponível ainda não concluída. */
  function proximaAtividade(p) {
    // prioriza a trilha da última fase concluída
    const ordem = TRILHAS.slice();
    if (p.ultimo) {
      const a = acharFase(p.ultimo.faseId);
      if (a) { ordem.splice(a.ti, 1); ordem.unshift(a.trilha); }
    }
    for (const t of ordem) {
      for (let fi = 0; fi < t.fases.length; fi++) {
        const f = t.fases[fi];
        if (!faseCompleta(p, f.id) && faseDisponivel(p, t, fi)) {
          const feitas = t.fases.filter((x) => faseCompleta(p, x.id)).length;
          return { trilha: t, fase: f, feitas, total: t.fases.length };
        }
      }
    }
    return null;
  }

  /* ---------------------------- Header / Footer ---------------------------- */
  function wordmark(cls = 'sm', href = 'index.html') {
    return `<a class="wordmark ${cls}" href="${href}" aria-label="Briiff, página inicial"><span class="root" aria-hidden="true">√</span><span class="name">Briiff</span>${logoPixel(/\blg\b/.test(cls))}</a>`;
  }

  const NAV = [
    ['index.html', 'Início', 'inicio'],
    ['trilhas.html', 'Trilhas', 'trilhas'],
    ['laboratorio.html', 'Laboratório', 'laboratorio'],
    ['ranking.html', 'Ranking', 'ranking'],
    ['loja.html', 'Loja', 'loja'],
    ['index.html#sobre', 'Sobre', 'sobre']
  ];

  /* ---------------------------- Painel de cores do site ---------------------------- */
  const SUGESTOES = [
    ['Verde e rosa', '#0F6E56', '#D4537E'],
    ['Roxo e amarelo', '#7B2CBF', '#F5B700'],
    ['Vermelho e azul-marinho', '#D62828', '#1D3557'],
    ['Verde e terracota', '#2D6A4F', '#E76F51'],
    ['Grafite e turquesa', '#2B2D42', '#06B6A4']
  ];

  function montarPainelCores() {
    const btn = $('#cores-btn'), pop = $('#cores-pop');
    if (!btn || !pop) return;
    const T = window.BriifTema;

    pop.innerHTML = `
      <b>Cores do site</b>
      <p>Escolha o visual que combina com você. Vale para o tema claro e o noturno.</p>
      <button type="button" class="cores-op" data-modo="padrao" aria-pressed="false">
        <span class="topo">
          <span class="cores-prev"><i style="background:${T.PADRAO.principal}"></i><i style="background:${T.PADRAO.destaque}"></i></span>
          <span><strong>Padrão</strong><small>Azul e branco do Briiff</small></span>
        </span>
      </button>
      <div class="cores-op cores-custom" data-modo="custom" aria-pressed="false">
        <div class="topo" data-abrir tabindex="0" role="button">
          <span class="cores-prev"><i data-prev="p"></i><i data-prev="d"></i></span>
          <span><strong>Personalizada</strong><small>Escolha as suas duas cores</small></span>
        </div>
        <div class="cores-campos">
          <label>Cor principal<span class="cor-in"><input type="color" id="cor-p" aria-label="Cor principal"><span data-hex="p"></span></span></label>
          <label>Cor de destaque<span class="cor-in"><input type="color" id="cor-d" aria-label="Cor de destaque"><span data-hex="d"></span></span></label>
        </div>
        <div class="cores-sug"><span>Sugestões</span>
          ${SUGESTOES.map(([nome, a, b]) => `<button type="button" style="--a:${a};--b:${b}" data-a="${a}" data-b="${b}" title="${nome}" aria-label="${nome}"></button>`).join('')}
        </div>
      </div>`;

    const inP = $('#cor-p', pop), inD = $('#cor-d', pop);
    const opPadrao = $('[data-modo=padrao]', pop), opCustom = $('[data-modo=custom]', pop);

    function pintar() {
      const c = T.cores();
      inP.value = c.principal; inD.value = c.destaque;
      $('[data-prev=p]', pop).style.background = c.principal;
      $('[data-prev=d]', pop).style.background = c.destaque;
      $('[data-hex=p]', pop).textContent = c.principal;
      $('[data-hex=d]', pop).textContent = c.destaque;
      opPadrao.setAttribute('aria-pressed', String(c.modo === 'padrao'));
      opCustom.setAttribute('aria-pressed', String(c.modo === 'custom'));
    }
    pintar();

    opPadrao.addEventListener('click', () => { T.definirCores({ modo: 'padrao' }); pintar(); });
    const usarCustom = () => { T.definirCores({ modo: 'custom' }); pintar(); };
    $('[data-abrir]', pop).addEventListener('click', usarCustom);
    $('[data-abrir]', pop).addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); usarCustom(); } });
    inP.addEventListener('input', () => { T.definirCores({ modo: 'custom', principal: inP.value }); pintar(); });
    inD.addEventListener('input', () => { T.definirCores({ modo: 'custom', destaque: inD.value }); pintar(); });
    $$('.cores-sug button', pop).forEach((b) => b.addEventListener('click', () => {
      T.definirCores({ modo: 'custom', principal: b.dataset.a, destaque: b.dataset.b }); pintar();
    }));

    const fechar = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const abrir = pop.hidden;
      const up = $('#user-pop'); if (up) up.classList.remove('open');
      pop.hidden = !abrir;
      btn.setAttribute('aria-expanded', String(abrir));
    });
    pop.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', fechar);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { fechar(); btn.focus(); } });
    window.addEventListener('briif:tema', pintar);   // mudou em outra aba
  }

  /** Bolinha do usuário: foto do Google se existir, senão a inicial do nome. */
  function avatarHtml(s, extra = '') {
    const nome = s && s.nome ? s.nome : '?';
    const inicial = esc(nome.trim().charAt(0).toUpperCase() || '?');
    // avatar comprado na loja tem prioridade sobre a foto do Google e a inicial
    const p = lerProgresso();
    const av = p && p.avatarAtivo && AVATARES_POR_ID[p.avatarAtivo];
    if (av) return `<span class="avatar avatar-custom ${extra}" title="${esc(av.nome)}">${av.svg}</span>`;
    // a inicial fica por baixo da foto; se a foto falhar, ela aparece
    const foto = s && s.foto ? `<img src="${esc(s.foto)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    return `<span class="avatar ${extra}">${inicial}${foto}</span>`;
  }

  function renderHeader(ativo) {
    const el = document.getElementById('site-header');
    if (!el) return;
    const s = lerSessao();
    const p = lerProgresso();
    const nome = s ? s.nome.split(' ')[0] : '';

    const nav = NAV.map(([href, label, key]) =>
      `<a href="${href}" ${key === ativo ? 'aria-current="page"' : ''}>${label}</a>`).join('');

    const noturno = window.BriifTema && window.BriifTema.atual() === 'noturno';
    const temaBtn = window.BriifTema
      ? `<button type="button" class="theme-btn" id="theme-btn" aria-pressed="${noturno}" aria-label="${noturno ? 'Ativar modo claro' : 'Ativar modo noturno'}" title="${noturno ? 'Modo claro' : 'Modo noturno'}">${noturno ? ICONS.sun : ICONS.moon}</button>`
      : '';

    const pixelLigado = window.BriifTema && window.BriifTema.pixel();
    const pixelBtn = window.BriifTema
      ? `<button type="button" class="theme-btn" id="pixel-btn" aria-pressed="${pixelLigado}" aria-label="Modo pixel art" title="Modo pixel art">${ICONS.gamepad}</button>`
      : '';

    const somLigado = !window.BriifSom || window.BriifSom.ligado();
    const somBtn = window.BriifSom
      ? `<button type="button" class="theme-btn som-btn" id="som-btn" aria-pressed="${somLigado}" aria-label="${somLigado ? 'Desligar sons' : 'Ligar sons'}" title="${somLigado ? 'Sons ligados' : 'Sons desligados'}">${somLigado ? ICONS.volume : ICONS.mudo}</button>`
      : '';

    const coresBtn = window.BriifTema
      ? `<div class="cores-menu">
          <button type="button" class="theme-btn" id="cores-btn" aria-haspopup="dialog" aria-expanded="false" aria-controls="cores-pop" aria-label="Cores do site" title="Cores do site">${ICONS.paleta}</button>
          <div class="cores-pop" id="cores-pop" role="dialog" aria-label="Cores do site" hidden></div>
        </div>`
      : '';

    let right;
    if (s) {
      right = `
        ${coresBtn}${temaBtn}${pixelBtn}${somBtn}
        <span class="chip fire ${ofensivaFeitaHoje(p) ? 'on' : ''}" title="Ofensiva: dias seguidos estudando">${ICONS.flame}${p.streak}</span>
        <span class="chip lock" title="Bloqueios de ofensiva: protegem sua ofensiva se você faltar um dia">${ICONS.bloqueio}${p.bloqueios || 0}</span>
        <a class="chip coin" href="loja.html" title="MathCoins — abrir a loja">${ICONS.coin}${p.moedas}</a>
        <a class="user-btn" id="user-btn" href="perfil.html" aria-label="Ver meu perfil e estatísticas">
          ${avatarHtml(s)}<span class="nm">${esc(nome)}</span>
        </a>`;
    } else {
      right = `${coresBtn}${temaBtn}${pixelBtn}${somBtn}<a class="btn btn-coral btn-sm" href="login.html">Entrar</a>`;
    }

    el.innerHTML = `
      <div class="wrap">
        ${wordmark('sm')}
        <nav class="nav" id="nav" aria-label="Principal">${nav}</nav>
        <div class="header-right">${right}</div>
        <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menu" aria-expanded="false">${ICONS.menu}</button>
      </div>`;

    const tb = $('#theme-btn');
    if (tb) {
      const pintar = () => {
        const n = window.BriifTema.atual() === 'noturno';
        tb.innerHTML = n ? ICONS.sun : ICONS.moon;
        tb.setAttribute('aria-pressed', String(n));
        tb.setAttribute('aria-label', n ? 'Ativar modo claro' : 'Ativar modo noturno');
        tb.title = n ? 'Modo claro' : 'Modo noturno';
      };
      tb.addEventListener('click', () => { window.BriifTema.alternar(); pintar(); if (window.BriifSom) window.BriifSom.tocar('tema'); });
      window.addEventListener('briif:tema', pintar);
    }

    const sb = $('#som-btn');
    if (sb) {
      const pintarSom = () => {
        const on = window.BriifSom.ligado();
        sb.innerHTML = on ? ICONS.volume : ICONS.mudo;
        sb.setAttribute('aria-pressed', String(on));
        sb.setAttribute('aria-label', on ? 'Desligar sons' : 'Ligar sons');
        sb.title = on ? 'Sons ligados' : 'Sons desligados';
      };
      sb.addEventListener('click', () => { window.BriifSom.alternar(); pintarSom(); });
      window.addEventListener('briif:som', pintarSom);
    }

    montarPainelCores();

    const pb = $('#pixel-btn');
    if (pb) {
      pb.addEventListener('click', () => {
        const ligado = window.BriifTema.alternarPixel();
        if (window.BriifSom) window.BriifSom.tocar('tema');
        pb.setAttribute('aria-pressed', String(ligado));
      });
      window.addEventListener('briif:tema', () => pb.setAttribute('aria-pressed', String(window.BriifTema.pixel())));
    }

    const toggle = $('#menu-toggle');
    toggle.addEventListener('click', () => {
      const open = $('#nav').classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

  }

  function renderFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <div class="wrap">
        ${wordmark('sm')}
        <nav aria-label="Rodapé">
          <a href="trilhas.html">Trilhas</a>
          <a href="laboratorio.html">Laboratório</a>
          <a href="index.html#sobre">Sobre</a>
          <a href="login.html">Entrar</a>
        </nav>
        <p>Projeto de TCC feito por estudantes. © ${new Date().getFullYear()} Briiff.</p>
      </div>`;
  }

  /** Símbolos matemáticos decorativos de fundo, como no login do app. */
  function simbolos(container, lista) {
    lista.forEach(([txt, size, pos, coral]) => {
      const s = document.createElement('span');
      s.className = 'sym' + (coral ? ' c' : '');
      s.textContent = txt;
      s.setAttribute('aria-hidden', 'true');
      s.style.fontSize = size + 'px';
      Object.keys(pos).forEach((k) => { s.style[k] = pos[k]; });
      container.appendChild(s);
    });
  }

  /* Reconcilia sessão com o Firebase (se o usuário foi deslogado em outro lugar). */
  function reconciliar() {
    const s = lerSessao();
    if (!firebaseAtivo || !s || s.modo !== 'firebase') return;
    carregarFirebase().then((fb) => {
      fb.auth().onAuthStateChanged((u) => {
        if (!u && lerSessao()) { limparSessao(); location.reload(); }
      });
    }).catch(() => { /* offline: mantém sessão local */ });
  }

  let ativoAtual = '';
  function atualizarHeader() { renderHeader(ativoAtual); }

  let syncInicial = Promise.resolve(false);

  function iniciar(ativo) {
    ativoAtual = ativo;
    renderHeader(ativo);
    renderFooter();
    melhorarLogos();
    reconciliar();
    const s = lerSessao();
    if (firebaseAtivo && s && s.modo === 'firebase') {
      syncInicial = sincronizar().then((mudou) => {
        if (mudou) {
          atualizarHeader();
          window.dispatchEvent(new CustomEvent('briif:progresso'));
        }
        return mudou;
      }).catch((e) => { avisoSync(e); return false; });
    }
  }
  /** Espera a primeira sincronização (no máximo 4 s). */
  function aguardarSync() {
    return Promise.race([syncInicial, new Promise((res) => setTimeout(() => res(false), 4000))]);
  }

  window.Briif = {
    TRILHAS, AULAS, ICONS, $, $$, esc, fmt, rich,
    auth, wordmark, iniciar, atualizarHeader, aguardarSync, avatarHtml, simbolos, trilhaIcon,
    progresso: { mesclar, ler: lerProgresso, completarFase, faseCompleta, faseDisponivel, proximaAtividade, ofensivaFeitaHoje },
    loja: { custoBloqueio: LOJA.custoBloqueio, comprarBloqueio, limiteCodigoMoedas: LOJA.limiteCodigoMoedas, validarCodigoMoedas, resgatarCodigoMoedas },
    avatares: { lista: AVATARES, comprar: comprarAvatar, selecionar: selecionarAvatar },
    ranking: { buscar: buscarRanking, avatar: avatarRanking, oculto: rankingOculto, alterarOculto: alterarRankingOculto },
    acharFase, proximaFase,
    personalizada: { opcoes: MATERIAS_PERSONALIZAVEIS, minimo: MIN_MATERIAS, materiasAtuais: () => personalizadaEntry.materias || [], salvar: salvarNovaSelecaoPersonalizada }
  };
})();
