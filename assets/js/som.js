/* ==========================================================================
   Briiff — sistema de som
   Todos os sons são sintetizados na hora com a Web Audio API (nenhum arquivo
   de áudio para baixar). A escolha de ligar/desligar fica em localStorage.

   Uso:   BriifSom.tocar('acerto')
   Sons:  acerto, erro, toque, avancar, passo, concluir, perfeito, nivel,
          moeda, compra, negado, ofensivaInicio, ofensivaAtualiza,
          ligar, tema, calcular
   ========================================================================== */
(function () {
  'use strict';
  var CHAVE = 'briif:som';
  var ctx = null, master = null, ruidoBuf = null;

  function ligado() {
    try { return localStorage.getItem(CHAVE) !== 'off'; } catch (e) { return true; }
  }

  function garantir() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }

  // navegadores só liberam áudio depois de um toque/clique da pessoa
  function destravar() {
    var c = garantir();
    if (c && c.state === 'suspended') c.resume();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, destravar, { passive: true });
  });

  /* ---------- blocos de construção ---------- */
  // uma nota: freq (Hz), início (s, relativo a agora), duração, forma de onda, volume, glissando opcional
  function nota(freq, t0, dur, tipo, vol, ate) {
    var c = ctx, t = c.currentTime + t0;
    var o = c.createOscillator(), g = c.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function ruido() {
    if (ruidoBuf) return ruidoBuf;
    var n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    ruidoBuf = b; return b;
  }
  // rajada de ruído filtrada (vento / fogo): f0→f1 em Hz
  function sopro(t0, dur, f0, f1, vol, q) {
    var c = ctx, t = c.currentTime + t0;
    var s = c.createBufferSource(); s.buffer = ruido();
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 0.8;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  // estalinhos de fogo
  function estalos(t0, dur, qtd, vol) {
    for (var i = 0; i < qtd; i++) {
      var t = t0 + Math.random() * dur;
      sopro(t, 0.04 + Math.random() * 0.05, 2500 + Math.random() * 3000, 1200, vol * (0.4 + Math.random() * 0.6), 2);
    }
  }

  // notas (Hz)
  var N = { C4: 261.63, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, C7: 2093 };

  /* ---------- os sons ---------- */
  var SONS = {
    // acerto: dois "dings" subindo
    acerto: function () {
      nota(N.E5, 0, 0.18, 'triangle', 0.32);
      nota(N.A5, 0.09, 0.30, 'triangle', 0.32);
      nota(N.E6, 0.09, 0.30, 'sine', 0.10);
    },
    // erro: "bzzt" grave descendo
    erro: function () {
      nota(220, 0, 0.28, 'sawtooth', 0.16, 110);
      nota(207, 0, 0.28, 'square', 0.08, 98);
      nota(130, 0.12, 0.22, 'triangle', 0.18, 82);
    },
    // clicar numa alternativa / botão importante
    toque: function () { nota(660, 0, 0.06, 'sine', 0.16); },
    // próxima pergunta
    avancar: function () { nota(440, 0, 0.07, 'triangle', 0.16); nota(587, 0.05, 0.1, 'triangle', 0.16); },
    // abrir passo de um exemplo
    passo: function () { nota(520, 0, 0.09, 'sine', 0.14, 700); },
    // fase concluída: arpejo + acorde
    concluir: function () {
      [N.C5, N.E5, N.G5].forEach(function (f, i) { nota(f, i * 0.11, 0.28, 'triangle', 0.28); });
      [N.C5, N.E5, N.G5, N.C6].forEach(function (f) { nota(f, 0.36, 0.7, 'triangle', 0.18); });
      nota(N.G6, 0.38, 0.6, 'sine', 0.08);
    },
    // gabaritou: fanfarra maior
    perfeito: function () {
      [N.C5, N.E5, N.G5, N.C6, N.E6].forEach(function (f, i) { nota(f, i * 0.09, 0.3, 'triangle', 0.27); });
      [N.G5, N.C6, N.E6, N.G6].forEach(function (f) { nota(f, 0.5, 0.95, 'triangle', 0.17); });
      nota(N.C7, 0.55, 0.8, 'sine', 0.07);
      for (var i = 0; i < 5; i++) nota(N.C7 * (1 + i * 0.12), 0.6 + i * 0.07, 0.12, 'sine', 0.05);
    },
    // subiu de nível: escala brilhante
    nivel: function () {
      [N.C5, N.D5, N.E5, N.G5, N.A5, N.C6, N.E6].forEach(function (f, i) { nota(f, i * 0.075, 0.22, 'square', 0.1); nota(f, i * 0.075, 0.25, 'triangle', 0.2); });
      [N.C6, N.E6, N.G6].forEach(function (f) { nota(f, 0.6, 0.9, 'triangle', 0.16); });
    },
    // moedas: "ka-ching"
    moeda: function () {
      nota(N.B5, 0, 0.07, 'square', 0.1); nota(N.E6, 0.07, 0.4, 'square', 0.1);
      nota(N.B5, 0, 0.07, 'triangle', 0.18); nota(N.E6, 0.07, 0.45, 'triangle', 0.2);
    },
    // compra na loja: moedas caindo + ka-ching
    compra: function () {
      for (var i = 0; i < 4; i++) nota(N.E6 + i * 90, i * 0.05, 0.06, 'square', 0.07);
      nota(N.B5, 0.24, 0.08, 'triangle', 0.2); nota(N.E6, 0.31, 0.5, 'triangle', 0.22);
    },
    // sem saldo / bloqueado
    negado: function () { nota(180, 0, 0.1, 'square', 0.12); nota(140, 0.11, 0.16, 'square', 0.12); },
    // ofensiva começou: faísca + chama acendendo
    ofensivaInicio: function () {
      sopro(0, 0.7, 300, 2200, 0.35, 0.7);
      estalos(0.1, 0.9, 10, 0.18);
      nota(N.C5, 0.55, 0.25, 'triangle', 0.25);
      nota(N.G5, 0.7, 0.25, 'triangle', 0.25);
      nota(N.C6, 0.85, 0.9, 'triangle', 0.26);
      nota(N.E6, 0.88, 0.9, 'sine', 0.09);
    },
    // ofensiva aumentou: chama + número "batendo" + vitória
    ofensivaAtualiza: function () {
      sopro(0, 0.75, 250, 2400, 0.38, 0.7);
      estalos(0.1, 1.0, 12, 0.18);
      nota(110, 0.95, 0.25, 'sine', 0.55, 55);              // "bum" quando o número troca
      [N.E5, N.G5, N.C6].forEach(function (f, i) { nota(f, 1.0 + i * 0.1, 0.25, 'triangle', 0.24); });
      [N.C6, N.E6, N.G6].forEach(function (f) { nota(f, 1.32, 1.0, 'triangle', 0.18); });
      for (var i = 0; i < 6; i++) nota(N.C7 * (0.8 + i * 0.1), 1.4 + i * 0.08, 0.1, 'sine', 0.05);
    },
    // ligar o som (confirma que está funcionando)
    ligar: function () { nota(N.E5, 0, 0.1, 'triangle', 0.22); nota(N.A5, 0.08, 0.16, 'triangle', 0.22); },
    // trocar tema / paleta
    tema: function () { nota(500, 0, 0.07, 'sine', 0.13, 650); },
    // calculadoras do laboratório
    calcular: function () { nota(N.G5, 0, 0.08, 'triangle', 0.16); nota(N.C6, 0.07, 0.16, 'triangle', 0.16); }
  };

  function tocar(nome) {
    if (!ligado()) return;
    var f = SONS[nome]; if (!f) return;
    var c = garantir(); if (!c) return;
    try {
      if (c.state === 'suspended') { c.resume().then(function () { f(); }); return; }
      f();
    } catch (e) { /* som nunca pode quebrar a página */ }
  }

  function definir(on) {
    try { localStorage.setItem(CHAVE, on ? 'on' : 'off'); } catch (e) { /* ignora */ }
    window.dispatchEvent(new CustomEvent('briif:som'));
    if (on) { destravar(); tocar('ligar'); }
  }

  window.BriifSom = {
    tocar: tocar,
    ligado: ligado,
    alternar: function () { var novo = !ligado(); definir(novo); return novo; },
    // para a animação de ofensiva sincronizar com o som
    nomes: Object.keys(SONS)
  };
})();
