/* ==========================================================================
   Briiff — Rascunho (quadro para fazer as contas, estilo "paint")
   - Pincel, borracha e TEXTO (teclado do computador ou teclado na tela do celular)
   - 6 cores + seletor de cor livre, espessura / tamanho da letra ajustável
   - Desfazer e limpar (o "limpar" também pode ser desfeito)
   - Tela cheia com o enunciado sempre visível ao lado (ou acima, no celular)
   - Funciona com mouse, dedo e caneta (Pointer Events)
   - A cor "Tinta" acompanha o tema (preta no claro, branca no noturno)
   - Cada exercício guarda o próprio desenho enquanto a página estiver aberta
   ========================================================================== */
(function () {
  'use strict';

  // 'auto' = cor da tinta do tema atual
  const CORES = ['auto', '#4C3CAD', '#FF6B4A', '#0F6E56', '#D4537E', '#B8860B'];
  const NOMES_CORES = ['Tinta', 'Índigo', 'Coral', 'Verde', 'Rosa', 'Dourado'];
  const LH = 1.3; // altura da linha do texto

  // ferramenta, cor e tamanhos valem para todos os exercícios
  const estado = { ferramenta: 'pincel', cor: 'auto', tamanho: { pincel: 4, borracha: 26, texto: 22 } };
  const LIMITES = { pincel: [1, 48], borracha: [4, 80], texto: [12, 72] };
  // desenho de cada exercício: chave -> lista de traços
  const desenhos = new Map();

  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONES = {
    pincel: ic('<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z"/><path d="M14 7l3 3"/>'),
    borracha: ic('<path d="M7 20h12"/><path d="M5.2 15.2 14.6 5.8a2 2 0 0 1 2.8 0l1.8 1.8a2 2 0 0 1 0 2.8L10.8 18.8a2 2 0 0 1-1.4.6H8a2 2 0 0 1-1.4-.6L5.2 17.4a2 2 0 0 1 0-2.2z"/><path d="m9 11.5 5 5"/>'),
    texto: ic('<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>'),
    desfazer: ic('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    limpar: ic('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>'),
    cheia: ic('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    sair: ic('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>')
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const meio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const cor = (c) => (c === 'auto'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#14151A')
    : c);
  const familia = () => getComputedStyle(document.body).fontFamily;
  const fonte = (tam) => `600 ${tam}px ${familia()}`;
  const hex = (c) => (c === 'auto' ? '#4C3CAD' : c);

  /**
   * Cria o rascunho dentro de `host`.
   * info = { contador: 'Pergunta 1 de 3', pergunta: '...', opcoes: ['..', '..'] }
   */
  function montar(host, chave, info) {
    if (!desenhos.has(chave)) desenhos.set(chave, []);
    const lista = desenhos.get(chave);

    const raiz = document.createElement('section');
    raiz.className = 'rasc';
    raiz.setAttribute('aria-label', 'Rascunho para fazer as contas');
    raiz.innerHTML = `
      <div class="rasc-head">
        <b>Rascunho</b><span>Faça as contas aqui</span>
        <button type="button" class="btn btn-ink btn-sm" data-cheia>${ICONES.cheia}<span>Tela cheia</span></button>
      </div>
      <div class="rasc-tools" role="toolbar" aria-label="Ferramentas do rascunho">
        <div class="rasc-group">
          <button type="button" class="rasc-btn" data-ferr="pincel" title="Pincel" aria-label="Pincel">${ICONES.pincel}</button>
          <button type="button" class="rasc-btn" data-ferr="borracha" title="Borracha" aria-label="Borracha">${ICONES.borracha}</button>
          <button type="button" class="rasc-btn rasc-txt" data-ferr="texto" title="Escrever texto" aria-label="Escrever texto">${ICONES.texto}<span>Texto</span></button>
        </div>
        <div class="rasc-group" role="group" aria-label="Cores">
          ${CORES.map((c, i) => `<button type="button" class="rasc-sw" data-cor="${c}" style="--c:${c === 'auto' ? 'var(--ink)' : c}" title="${NOMES_CORES[i]}" aria-label="${NOMES_CORES[i]}"></button>`).join('')}
          <label class="rasc-sw rasc-livre" title="Escolher outra cor"><input type="color" value="${hex(estado.cor)}" aria-label="Escolher outra cor"></label>
        </div>
        <div class="rasc-group rasc-size">
          <label for="tam-${esc(chave)}" data-rotulo>Espessura</label>
          <input id="tam-${esc(chave)}" type="range" step="1">
        </div>
        <div class="rasc-group">
          <button type="button" class="rasc-btn" data-desfazer title="Desfazer" aria-label="Desfazer">${ICONES.desfazer}</button>
          <button type="button" class="rasc-btn" data-limpar title="Limpar tudo" aria-label="Limpar tudo">${ICONES.limpar}</button>
        </div>
      </div>
      <div class="rasc-stage">
        <canvas aria-label="Área de desenho"></canvas>
        <div class="rasc-anel" aria-hidden="true"></div>
      </div>`;
    host.innerHTML = '';
    host.appendChild(raiz);

    const tools = raiz.querySelector('.rasc-tools');
    const stage = raiz.querySelector('.rasc-stage');
    const cv = stage.querySelector('canvas');
    const anel = stage.querySelector('.rasc-anel');
    const ctx = cv.getContext('2d');
    const range = tools.querySelector('input[type=range]');
    const inputCor = tools.querySelector('input[type=color]');
    const btnDesfazer = tools.querySelector('[data-desfazer]');
    const btnLimpar = tools.querySelector('[data-limpar]');
    const btnCheia = raiz.querySelector('[data-cheia]');

    let dpr = 1, cw = 0, ch = 0, atual = null;
    let edit = null;          // caixa de texto aberta: { ta, ok, x, y, cor, tam }
    let tocouFerr = false;    // true quando o foco saiu do texto por causa de cor/tamanho

    /* ---------- desenho ---------- */
    function estilo(t) {
      const px = document.documentElement.hasAttribute('data-pixel');
      ctx.lineCap = px ? 'square' : 'round';
      ctx.lineJoin = px ? 'miter' : 'round';
      ctx.lineWidth = t.tam;
      if (t.ferr === 'borracha') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = '#000'; ctx.fillStyle = '#000';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        const c = cor(t.cor);
        ctx.strokeStyle = c; ctx.fillStyle = c;
      }
    }
    // modo pixel art: o traço vira blocos alinhados a uma grade de 4px
    const G = 4;
    const modoPixel = () => document.documentElement.hasAttribute('data-pixel');
    function carimbar(t, x, y) {
      const S = Math.max(G, Math.round(t.tam / G) * G);
      ctx.fillRect(Math.round((x - S / 2) / G) * G, Math.round((y - S / 2) / G) * G, S, S);
    }
    function linhaPixel(t, a, b) {
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (G / 2)));
      for (let i = 0; i <= n; i++) carimbar(t, a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n);
    }
    function ponto(t) {
      const p = t.pts[0];
      estilo(t);
      if (modoPixel()) { carimbar(t, p[0], p[1]); return; }
      ctx.beginPath();
      ctx.arc(p[0], p[1], t.tam / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    function desenharTexto(t) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cor(t.cor);
      ctx.font = fonte(t.tam);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      t.texto.split('\n').forEach((linha, i) => ctx.fillText(linha, t.x, t.y + (i + 0.5) * t.tam * LH));
    }
    function tracoCompleto(t) {
      if (t.ferr === 'limpar') {
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore();
        return;
      }
      if (t.ferr === 'texto') { desenharTexto(t); return; }
      const p = t.pts;
      if (!p.length) return;
      if (p.length === 1) { ponto(t); return; }
      estilo(t);
      if (modoPixel()) { for (let i = 1; i < p.length; i++) linhaPixel(t, p[i - 1], p[i]); return; }
      ctx.beginPath();
      ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) {
        const m = meio(p[i], p[i + 1]);
        ctx.quadraticCurveTo(p[i][0], p[i][1], m[0], m[1]);
      }
      const u = p[p.length - 1];
      ctx.lineTo(u[0], u[1]);
      ctx.stroke();
    }
    function redesenhar() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      lista.forEach(tracoCompleto);
    }
    // desenha só o último pedaço enquanto o dedo/mouse se move (rápido)
    function segmento(t) {
      const p = t.pts, n = p.length;
      if (modoPixel()) { if (n >= 2) { estilo(t); linhaPixel(t, p[n - 2], p[n - 1]); } return; }
      if (n < 3) return;
      estilo(t);
      ctx.beginPath();
      if (n === 3) ctx.moveTo(p[0][0], p[0][1]);
      else { const i = meio(p[n - 3], p[n - 2]); ctx.moveTo(i[0], i[1]); }
      const m = meio(p[n - 2], p[n - 1]);
      ctx.quadraticCurveTo(p[n - 2][0], p[n - 2][1], m[0], m[1]);
      ctx.stroke();
    }
    function fecharTraco(t) {
      const p = t.pts, n = p.length;
      if (n < 2 || modoPixel()) return;
      estilo(t);
      ctx.beginPath();
      if (n === 2) ctx.moveTo(p[0][0], p[0][1]);
      else { const i = meio(p[n - 2], p[n - 1]); ctx.moveTo(i[0], i[1]); }
      ctx.lineTo(p[n - 1][0], p[n - 1][1]);
      ctx.stroke();
    }

    function ajustar() {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = window.devicePixelRatio || 1;
      cw = r.width; ch = r.height;
      cv.width = Math.round(cw * dpr);
      cv.height = Math.round(ch * dpr);
      redesenhar();
    }
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(cv);
    else window.addEventListener('resize', ajustar);

    // ao trocar de tema, redesenha (a cor "Tinta" muda) e atualiza o texto em edição
    function aoMudarTema() {
      if (!raiz.isConnected) { window.removeEventListener('briif:tema', aoMudarTema); return; }
      redesenhar();
      if (edit) estiloTexto();
    }
    window.addEventListener('briif:tema', aoMudarTema);

    /* ---------- texto ---------- */
    function estiloTexto() {
      const { ta } = edit;
      ta.style.left = edit.x + 'px';
      ta.style.top = edit.y + 'px';
      ta.style.fontSize = edit.tam + 'px';
      ta.style.lineHeight = String(LH);
      ta.style.fontFamily = familia();
      ta.style.color = cor(edit.cor);
      ajustarTexto();
    }
    function ajustarTexto() {
      if (!edit) return;
      const { ta, x, y, tam } = edit;
      const linhas = (ta.value || '').split('\n');
      ctx.save();
      ctx.font = fonte(tam);
      let larg = 0;
      linhas.forEach((l) => { larg = Math.max(larg, ctx.measureText(l).width); });
      ctx.restore();
      const w = Math.min(Math.max(larg + 14, 150), Math.max(cw - x - 4, 80));
      const h = linhas.length * tam * LH;
      ta.style.width = w + 'px';
      ta.style.height = h + 'px';
      edit.ok.style.left = x + 'px';
      edit.ok.style.top = (y + h + 10) + 'px';
    }
    function abrirTexto(x, y) {
      commitTexto();
      const tam = estado.tamanho.texto;
      x = Math.max(6, Math.min(x, Math.max(cw - 90, 6)));
      y = Math.max(6, Math.min(y, Math.max(ch - tam * LH - 50, 6)));

      const ta = document.createElement('textarea');
      ta.className = 'rasc-texto';
      ta.rows = 1;
      ta.wrap = 'off';
      ta.spellcheck = false;
      ta.placeholder = 'Digite aqui';
      ta.setAttribute('autocomplete', 'off');
      ta.setAttribute('autocapitalize', 'sentences');
      ta.setAttribute('aria-label', 'Texto do rascunho');
      const ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'rasc-pronto';
      ok.textContent = 'Pronto';
      stage.appendChild(ta);
      stage.appendChild(ok);
      edit = { ta, ok, x, y, cor: estado.cor, tam };
      estiloTexto();

      ta.addEventListener('input', ajustarTexto);
      ta.addEventListener('blur', () => { if (!tocouFerr) commitTexto(); });
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); commitTexto(); }
      });
      ok.addEventListener('pointerdown', (e) => e.preventDefault()); // mantém o teclado aberto até o clique
      ok.addEventListener('click', commitTexto);
      // o foco acontece dentro do clique do usuário, então o teclado do celular aparece
      ta.focus();
    }
    function commitTexto() {
      if (!edit) return;
      const { ta, ok, x, y, cor: c, tam } = edit;
      edit = null; tocouFerr = false;
      const texto = ta.value.replace(/\s+$/, '');
      ta.remove(); ok.remove();
      if (!texto.trim()) return;
      const t = { ferr: 'texto', cor: c, tam, x, y, texto, pts: [] };
      lista.push(t);
      tracoCompleto(t);
      atualizarBotoes();
    }
    // posição inicial da caixa criada pelo botão "Texto": empilha abaixo dos textos existentes
    function posicaoInicial() {
      const tam = estado.tamanho.texto;
      const n = lista.filter((t) => t.ferr === 'texto').length;
      const passo = tam * LH * 2 + 14;
      let y = 18 + n * passo;
      if (y > ch - tam * LH - 60) y = 18;
      return [22, y];
    }

    /* ---------- ponteiro ---------- */
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    function moverAnel(e) {
      if (e.pointerType === 'touch' || estado.ferramenta === 'texto') { anel.style.display = 'none'; return; }
      const [x, y] = pos(e);
      const d = Math.max(estado.tamanho[estado.ferramenta], 6);
      anel.style.cssText = `display:block;left:${x}px;top:${y}px;width:${d}px;height:${d}px;`;
    }

    cv.addEventListener('pointerdown', (e) => {
      if (estado.ferramenta === 'texto') return;      // no modo texto, quem age é o "click"
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      commitTexto();
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      atual = { ferr: estado.ferramenta, cor: estado.cor, tam: estado.tamanho[estado.ferramenta], pts: [pos(e)] };
      lista.push(atual);
      ponto(atual);
      atualizarBotoes();
      moverAnel(e);
    });
    cv.addEventListener('pointermove', (e) => {
      moverAnel(e);
      if (!atual) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      (evs.length ? evs : [e]).forEach((ev) => {
        const p = pos(ev);
        const u = atual.pts[atual.pts.length - 1];
        if (Math.abs(p[0] - u[0]) + Math.abs(p[1] - u[1]) < 1.2) return;
        atual.pts.push(p);
        segmento(atual);
      });
    });
    const soltar = () => { if (atual) { fecharTraco(atual); atual = null; } };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);
    cv.addEventListener('pointerleave', () => { anel.style.display = 'none'; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    // toque/clique no quadro com a ferramenta Texto: abre uma caixa ali
    cv.addEventListener('click', (e) => {
      if (estado.ferramenta !== 'texto') return;
      const [x, y] = pos(e);
      abrirTexto(x, y - estado.tamanho.texto * LH / 2);
    });

    /* ---------- barra de ferramentas ---------- */
    function atualizarBotoes() {
      const f = estado.ferramenta;
      tools.querySelectorAll('[data-ferr]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ferr === f)));
      const usaCor = f !== 'borracha';
      tools.querySelectorAll('[data-cor]').forEach((b) => b.setAttribute('aria-pressed', String(usaCor && b.dataset.cor.toLowerCase() === estado.cor.toLowerCase())));
      tools.querySelector('.rasc-livre').setAttribute('aria-pressed', String(usaCor && !CORES.some((c) => c.toLowerCase() === estado.cor.toLowerCase())));
      const [mn, mx] = LIMITES[f];
      range.min = mn; range.max = mx;
      range.value = estado.tamanho[f];
      tools.querySelector('[data-rotulo]').textContent = f === 'texto' ? 'Tamanho da letra' : f === 'borracha' ? 'Tamanho' : 'Espessura';
      btnDesfazer.disabled = lista.length === 0;
      btnLimpar.disabled = lista.length === 0 || lista[lista.length - 1].ferr === 'limpar';
      stage.classList.toggle('borracha', f === 'borracha');
      stage.classList.toggle('texto', f === 'texto');
    }

    // se o foco sair do texto por causa de cor/tamanho, a caixa continua aberta
    tools.addEventListener('pointerdown', (e) => {
      if (edit && e.target.closest('[data-cor], .rasc-livre, input[type=range]')) tocouFerr = true;
    });
    const voltarAoTexto = () => { tocouFerr = false; if (edit) edit.ta.focus(); };

    tools.querySelectorAll('[data-ferr]').forEach((b) => b.addEventListener('click', () => {
      const nova = b.dataset.ferr;
      commitTexto();
      estado.ferramenta = nova;
      atualizarBotoes();
      if (nova === 'texto') { const [x, y] = posicaoInicial(); abrirTexto(x, y); }
    }));
    tools.querySelectorAll('[data-cor]').forEach((b) => b.addEventListener('click', () => {
      estado.cor = b.dataset.cor;
      if (estado.ferramenta === 'borracha') estado.ferramenta = 'pincel';
      inputCor.value = hex(estado.cor);
      if (edit) { edit.cor = estado.cor; estiloTexto(); voltarAoTexto(); }
      atualizarBotoes();
    }));
    inputCor.addEventListener('input', () => {
      estado.cor = inputCor.value;
      if (estado.ferramenta === 'borracha') estado.ferramenta = 'pincel';
      if (edit) { edit.cor = estado.cor; estiloTexto(); }
      atualizarBotoes();
    });
    inputCor.addEventListener('change', voltarAoTexto);
    range.addEventListener('input', () => {
      const f = estado.ferramenta;
      estado.tamanho[f] = Number(range.value);
      if (edit && f === 'texto') { edit.tam = estado.tamanho.texto; estiloTexto(); }
    });
    range.addEventListener('change', voltarAoTexto);
    btnDesfazer.addEventListener('click', () => { commitTexto(); lista.pop(); redesenhar(); atualizarBotoes(); });
    btnLimpar.addEventListener('click', () => { commitTexto(); lista.push({ ferr: 'limpar', pts: [] }); redesenhar(); atualizarBotoes(); });

    /* ---------- tela cheia (o enunciado continua visível) ---------- */
    let overlay = null, aoTeclar = null, aoRedimensionar = null, moveu = [];

    function abrirCheia() {
      if (overlay) return;
      commitTexto();
      const letras = ['A', 'B', 'C', 'D', 'E'];
      // respondida: índice já escolhido (ou null/undefined se ainda não respondeu)
      const respondidaAtual = (info.respondida === undefined || info.respondida === null) ? null : info.respondida;
      const podeResponder = respondidaAtual === null && typeof info.aoResponder === 'function';
      overlay = document.createElement('div');
      overlay.className = 'rasc-full';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Rascunho em tela cheia');
      overlay.innerHTML = `
        <div class="rasc-topo">
        <aside class="rasc-enun">
          <div class="rasc-enun-top">
            <span class="rasc-cont">${esc(info.contador || '')}</span>
            <button type="button" class="btn btn-ink btn-sm" data-sair>${ICONES.sair}<span>Sair da tela cheia</span></button>
          </div>
          <h2>${esc(info.pergunta || '')}</h2>
          <ol class="rasc-opts">${(info.opcoes || []).map((o, i) => {
            let cls = '';
            if (respondidaAtual !== null) { if (i === info.correta) cls = 'right'; else if (i === respondidaAtual) cls = 'wrong'; }
            return `<li><button type="button" class="rasc-opt ${cls}" data-k="${i}" ${respondidaAtual !== null ? 'disabled' : ''}><b>${letras[i]}</b><span>${esc(o)}</span></button></li>`;
          }).join('')}</ol>
        </aside>
        <div class="rasc-bossbar" hidden></div>
        </div>
        <div class="rasc-work"></div>`;
      document.body.appendChild(overlay);
      document.body.classList.add('rasc-lock');
      const work = overlay.querySelector('.rasc-work');
      overlay.querySelector('.rasc-topo').appendChild(tools);
      work.appendChild(stage);
      // elementos "ao vivo" da página (ex.: o boss e o cronômetro da batalha) sobem junto para o topo
      moveu = [];
      if (typeof info.alvosTopo === 'function') {
        const barra = overlay.querySelector('.rasc-bossbar');
        (info.alvosTopo() || []).forEach((el) => {
          if (!el || !el.parentNode) return;
          const marca = document.createComment('rasc');
          el.parentNode.replaceChild(marca, el);
          barra.appendChild(el);
          moveu.push({ el, marca });
        });
        barra.hidden = !moveu.length;
      }
      raiz.classList.add('rasc-aberto');
      overlay.querySelector('[data-sair]').addEventListener('click', fecharCheia);
      if (podeResponder) {
        overlay.querySelectorAll('.rasc-opt').forEach((btn) => {
          btn.addEventListener('click', () => {
            const k = Number(btn.dataset.k);
            fecharCheia();
            info.aoResponder(k);
          });
        });
      }
      aoTeclar = (e) => { if (e.key === 'Escape') fecharCheia(); };
      document.addEventListener('keydown', aoTeclar);

      // quando o teclado do celular abre, a tela cheia encolhe junto e o texto não fica escondido
      const vv = window.visualViewport;
      if (vv) {
        aoRedimensionar = () => {
          overlay.style.top = vv.offsetTop + 'px';
          overlay.style.height = vv.height + 'px';
          overlay.style.bottom = 'auto';
        };
        vv.addEventListener('resize', aoRedimensionar);
        vv.addEventListener('scroll', aoRedimensionar);
        aoRedimensionar();
      }
      overlay.querySelector('[data-sair]').focus();
    }
    function fecharCheia() {
      if (!overlay) return;
      commitTexto();
      moveu.forEach((m) => { if (m.marca.parentNode) m.marca.parentNode.replaceChild(m.el, m.marca); });
      moveu = [];
      raiz.appendChild(tools);
      raiz.appendChild(stage);
      raiz.classList.remove('rasc-aberto');
      overlay.remove(); overlay = null;
      document.body.classList.remove('rasc-lock');
      document.removeEventListener('keydown', aoTeclar);
      const vv = window.visualViewport;
      if (vv && aoRedimensionar) { vv.removeEventListener('resize', aoRedimensionar); vv.removeEventListener('scroll', aoRedimensionar); }
      btnCheia.focus();
    }
    btnCheia.addEventListener('click', abrirCheia);

    atualizarBotoes();
    ajustar();
    return { abrirCheia, fecharCheia };
  }

  window.BriifRascunho = { montar };
})();
