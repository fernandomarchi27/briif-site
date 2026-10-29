/* ==========================================================================
   Briiff — arena da batalha final (canvas, pixel art)
   Motor visual da batalha: mago, chefe, projétil, dano, explosão e placa de vitória.
   NÃO tem regra de jogo (vidas, golpes, recompensas): quem decide isso é boss.js,
   que só chama os métodos abaixo. Assets carregados sob demanda (assets/boss/).

   BriifArena.criar(canvas, { golpes, vidas, nome }) -> {
     golpe(aoImpacto)   mago ataca; aoImpacto() roda quando a bola atinge o chefe
     dano()             mago pisca em branco (perdeu um coração)
     vida(n) / chefe(n) atualizam corações / golpes restantes do chefe
     derrota(aoFim)     animação de morte do mago (uma vez)
     vitoria(aoFim)     explosão + carne + transição + placa (uma vez)
     destruir()
   }
   ========================================================================== */
(function () {
  'use strict';
  var VW = 840, VH = 728;                                    // coordenadas virtuais (arena = parte escura do cenário)
  var BOSS = { cx: 705, cy: 263, size: 290 }, MAGE = { cx: 100, cy: 575, size: 170 };
  var ORB = { x: 0.834, y: 0.254 };                          // ponta do cajado (fração do frame, ataque)
  var BASE = 'assets/boss/';
  var reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cache = null;

  function carregar() {
    if (cache) return cache;
    var nomes = { cen: 'cenario', chefe: 'chefe', atk: 'mago-ataque', die: 'mago-derrota', bola: 'bola' };
    cache = Promise.all(Object.keys(nomes).map(function (k) {
      return new Promise(function (ok, erro) { var i = new Image(); i.onload = function () { ok([k, i]); }; i.onerror = erro; i.src = BASE + nomes[k] + '.png'; });
    })).then(function (l) { var o = {}; l.forEach(function (p) { o[p[0]] = p[1]; }); return o; });
    cache.catch(function () { cache = null; });
    return cache;
  }

  function mk(rows, pal) {
    var c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
    var g = c.getContext('2d');
    rows.forEach(function (r, y) { r.split('').forEach(function (ch, x) { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }); });
    return c;
  }
  var HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
  var CORACAO = { on: mk(HEART, { 1: '#e0242e' }), off: mk(HEART, { 1: '#000000' }), borda: mk(HEART, { 1: '#000000' }) };
  var CARNE = [
    mk(['01110', '11111', '11211', '11111', '01110'], { 1: '#b3202a', 2: '#ffb3b3' }),
    mk(['0110', '1111', '1221', '0110'], { 1: '#8c1522', 2: '#e8636d' }),
    mk(['10001', '11111', '01110', '01110', '11011'], { 1: '#e9dcc6', 2: '#b3202a' }),
    mk(['011', '111', '110'], { 1: '#5d0f1c' })
  ];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };

  function criar(cv, opc) {
    opc = opc || {};
    var ctx = cv.getContext('2d'), IM = null, S = 1, T = 0, last = 0, raf = 0, vivo = true;
    var golpesMax = opc.golpes || 6, vidasMax = opc.vidas || 3, nome = opc.nome || 'Os Desenvolvedores';
    var hearts = vidasMax, hp = golpesMax, hpShown = golpesMax;
    var mage = { type: 'idle', t0: 0 }, flashM = 0, flashB = 0, ball = null, brk = null, bossVivo = true;
    var parts = [], boom = null, cells = [], placa = false, placaT0 = 0, sched = [];
    var tmp = document.createElement('canvas'), tctx = tmp.getContext('2d');

    function ajustar() {
      var w = cv.clientWidth || VW, d = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(w * d); cv.height = Math.round(w * VH / VW * d); S = w * d / VW;
    }
    ajustar();
    var ro = window.ResizeObserver ? new ResizeObserver(ajustar) : null; if (ro) ro.observe(cv); else window.addEventListener('resize', ajustar);

    function later(ms, fn) { sched.push({ t: T + ms, fn: fn }); }
    function frame(img, i, x, y, w, h, flash) {
      var f = img.height;
      if (flash) {
        tmp.width = f; tmp.height = f; tctx.clearRect(0, 0, f, f); tctx.drawImage(img, i * f, 0, f, f, 0, 0, f, f);
        tctx.globalCompositeOperation = 'source-atop'; tctx.fillStyle = '#fff'; tctx.fillRect(0, 0, f, f); tctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tmp, 0, 0, f, f, x, y, w, h);
      } else ctx.drawImage(img, i * f, 0, f, f, x, y, w, h);
    }
    function bolaPos(t) {
      var e = t * t * 0.4 + t * 0.6, x0 = MAGE.cx - MAGE.size / 2 + ORB.x * MAGE.size, y0 = MAGE.cy - MAGE.size / 2 + ORB.y * MAGE.size;
      return { x: x0 + (BOSS.cx - BOSS.size * 0.3 - x0) * e, y: y0 + (BOSS.cy + BOSS.size * 0.05 - y0) * e, s: 18 + 34 * t };
    }

    function atualizar(dt) {
      T += dt * 1000;
      for (var i = 0; i < sched.length;) { var s = sched[i]; if (s.t <= T) { sched.splice(i, 1); s.fn(); } else i++; }
      if (ball && T - ball.t0 >= 750) {
        var p = bolaPos(1); brk = { t0: T, x: p.x, y: p.y, s: p.s }; var cb = ball.cb; ball = null; flashB = T + 280; if (cb) cb();
      }
      if (mage.type === 'attack' && T - mage.t0 > 600) mage = { type: 'idle', t0: T };
      hpShown += (hp - hpShown) * Math.min(1, dt * 9);
      var gr = boom && T - boom.t0 > 1500;
      for (var j = 0; j < parts.length; j++) {
        var q = parts[j];
        if (!gr) { q.vx *= 1 - 2.4 * dt; q.vy *= 1 - 2.4 * dt; } else q.vy += 2600 * dt;
        q.x += q.vx * dt; q.y += q.vy * dt; q.r += q.vr * dt;
      }
    }

    function nomeChefe() {
      ctx.textBaseline = 'top'; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      ctx.font = "700 34px 'Pixelify Sans','Press Start 2P',monospace";
      ctx.fillStyle = '#12060d'; ctx.fillText(nome, VW / 2 + 4, 22);
      ctx.lineWidth = 9; ctx.strokeStyle = '#12060d'; ctx.strokeText(nome, VW / 2, 18);
      ctx.fillStyle = '#e0242e'; ctx.fillText(nome, VW / 2, 18); ctx.textAlign = 'left';
    }
    function hud() {
      nomeChefe();
      ctx.fillStyle = '#12060d'; ctx.fillRect(26, 66, 788, 38);
      ctx.fillStyle = '#2a0f1c'; ctx.fillRect(31, 71, 778, 28);
      var w = 778 * Math.max(0, hpShown) / golpesMax;
      ctx.fillStyle = '#d6262d'; ctx.fillRect(31, 71, w, 28);
      ctx.fillStyle = 'rgba(255,255,255,.26)'; ctx.fillRect(31, 71, w, 6);
      for (var i = 0; i < vidasMax; i++) {
        var x = 30 + i * 58, y = 118, s = 6;
        ctx.drawImage(CORACAO.borda, x - 3, y - 3, 7 * s + 6, 6 * s + 6);
        ctx.drawImage(i < hearts ? CORACAO.on : CORACAO.off, x, y, 7 * s, 6 * s);
      }
    }
    /* Tijolinho de vitória: um bloco de pedra roxa (mesma linguagem dos tijolos do fundo do site), em pixel art,
       que cai do alto e assenta com um quique curto. O texto fica entalhado nele. */
    function tijolo(seg) {
      var u = 10, w = 560, h = 230, x = (VW - w) / 2, y0 = 250;
      var e = Math.min(1, seg / 0.7), q;                       // queda com quique (easeOutBounce)
      if (e < 1 / 2.75) q = 7.5625 * e * e; else if (e < 2 / 2.75) { e -= 1.5 / 2.75; q = 7.5625 * e * e + 0.75; } else if (e < 2.5 / 2.75) { e -= 2.25 / 2.75; q = 7.5625 * e * e + 0.9375; } else { e -= 2.625 / 2.75; q = 7.5625 * e * e + 0.984375; }
      if (reduzir || seg >= 0.7) q = 1;
      var y = y0 - (1 - q) * 380;
      function R(a, b, c, d, col) { ctx.fillStyle = col; ctx.fillRect(x + a * u, y + b * u, c * u, d * u); }
      var cols = w / u, rows = h / u;                          // 56 x 23 "pixels" de pedra
      R(1, 0, cols - 2, rows, '#14101F'); R(0, 1, cols, rows - 2, '#14101F');             // contorno / argamassa (canto quebrado)
      R(2, 1, cols - 4, rows - 2, '#3B3162'); R(1, 2, cols - 2, rows - 4, '#3B3162');     // corpo da pedra
      R(2, 1, cols - 4, 1, '#6B5BC4'); R(1, 2, 1, rows - 4, '#5B4BA8');                   // luz em cima e à esquerda
      R(2, rows - 3, cols - 4, 2, '#231C3F'); R(cols - 3, 2, 2, rows - 4, '#2B2350');     // sombra embaixo e à direita
      for (var i = 0; i < 70; i++) {                                                      // textura de granito (fixa)
        var sx = 3 + (i * 37) % (cols - 7), sy = 3 + (i * 17) % (rows - 7);
        R(sx, sy, 1 + i % 2, 1, i % 3 ? '#463B78' : '#2E2552');
      }
      R(9, 17, 3, 1, '#231C3F'); R(11, 18, 2, 1, '#231C3F'); R(40, 4, 1, 3, '#231C3F'); R(41, 6, 2, 1, '#231C3F');   // rachaduras
      var t = 'VITÓRIA!', fs = 88; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      do { ctx.font = '700 ' + fs + "px 'Pixelify Sans','Press Start 2P',monospace"; fs -= 4; } while (ctx.measureText(t).width > w - 10 * u && fs > 36);
      var cx = x + w / 2, cy = y + h / 2 - 2;
      ctx.fillStyle = '#14101F'; ctx.fillText(t, cx, cy + 8);                              // entalhe (sombra)
      ctx.fillStyle = '#E8E0FF'; ctx.fillText(t, cx, cy);                                  // letras claras
      ctx.fillStyle = 'rgba(197,184,255,.55)'; ctx.fillText(t, cx, cy - 2);
      ctx.fillStyle = '#E8E0FF'; ctx.fillText(t, cx, cy);
      ctx.textAlign = 'left';
    }

    function desenhar() {
      ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, VW, VH);
      if (!IM) return;
      ctx.drawImage(IM.cen, (reduzir ? 0 : Math.floor(T / 160) % 3) * VW, 0, VW, VH, 0, 0, VW, VH);
      if (bossVivo) frame(IM.chefe, reduzir ? 0 : Math.floor(T / 110) % 12, BOSS.cx - BOSS.size / 2, BOSS.cy - BOSS.size / 2, BOSS.size, BOSS.size, T < flashB && Math.floor(T / 70) % 2 === 0);
      var mx = MAGE.cx - MAGE.size / 2, my = MAGE.cy - MAGE.size / 2, fm = T < flashM && Math.floor(T / 70) % 2 === 0;
      if (mage.type === 'death') frame(IM.die, Math.min(2, Math.floor((T - mage.t0) / 450)), mx, my, MAGE.size, MAGE.size, false);
      else frame(IM.atk, mage.type === 'attack' && T - mage.t0 >= 150 ? 1 : 0, mx, my, MAGE.size, MAGE.size, fm);
      if (ball) { var p = bolaPos(Math.min((T - ball.t0) / 750, 1)); frame(IM.bola, Math.floor(T / 90) % 2, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s, false); }
      if (brk) { var n = Math.floor((T - brk.t0) / 110); if (n < 2) frame(IM.bola, 2 + n, brk.x - brk.s * 0.6, brk.y - brk.s * 0.6, brk.s * 1.2, brk.s * 1.2, false); else brk = null; }
      hud();
      if (boom) {
        var t = (T - boom.t0) / 1000;
        if (t < 0.9) {
          ctx.fillStyle = 'rgba(255,' + (200 - t * 200 | 0) + ',60,' + Math.max(0, 1 - t * 1.1) + ')';
          for (var i = 0; i < 14; i++) { var a = i / 14 * 6.283, rr = t * 900 * (0.5 + 0.5 * ((i * 7) % 3) / 2), s = 60 * (1 - t); ctx.fillRect(BOSS.cx + Math.cos(a) * rr - s / 2, BOSS.cy + Math.sin(a) * rr - s / 2, s, s); }
          if (t < 0.15) { ctx.fillStyle = 'rgba(255,255,255,' + (1 - t / 0.15) + ')'; ctx.fillRect(0, 0, VW, VH); }
        }
        if (t < 2.4) { ctx.fillStyle = 'rgba(90,10,25,' + Math.min(0.55, t * 1.2) * (t > 1.6 ? (2.4 - t) / 0.8 : 1) + ')'; ctx.fillRect(0, 0, VW, VH); }
        for (var j = 0; j < parts.length; j++) {
          var q = parts[j]; if (q.y > VH + 90) continue; var c = CARNE[q.k];
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.drawImage(c, -q.s / 2, -q.s / 2, q.s, q.s * c.height / c.width); ctx.restore();
        }
        var pr = (t - 2.6) / 1.2;                          // transição: blocos roxos cobrem o cenário
        if (pr > 0) { ctx.fillStyle = '#171329'; for (var k = 0; k < cells.length; k++) if (pr > cells[k]) ctx.fillRect(k % 12 * 70, Math.floor(k / 12) * 70, 71, 71); }
      }
      if (placa) { ctx.fillStyle = '#171329'; ctx.fillRect(0, 0, VW, VH); tijolo((T - placaT0) / 1000); }
    }

    function laco(ts) {
      if (!vivo) return;
      var dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
      if (!document.hidden) { atualizar(dt); desenhar(); }
      raf = requestAnimationFrame(laco);
    }

    var pronta = carregar().then(function (im) {
      return (document.fonts && document.fonts.load ? document.fonts.load("700 34px 'Pixelify Sans'").catch(function () {}) : Promise.resolve()).then(function () {
        IM = im; if (vivo) raf = requestAnimationFrame(laco);
      });
    });

    return {
      pronta: pronta,
      golpe: function (aoImpacto) {
        if (mage.type === 'death') return;
        mage = { type: 'attack', t0: T };
        later(150, function () { ball = { t0: T, cb: aoImpacto }; });
      },
      dano: function () { flashM = T + 450; },
      vida: function (n) { hearts = Math.max(0, n); },
      chefe: function (restantes) { hp = Math.max(0, restantes); },
      derrota: function (aoFim) {
        flashM = T + 450;
        later(500, function () { mage = { type: 'death', t0: T }; });
        later(2700, function () { if (aoFim) aoFim(); });
      },
      vitoria: function (aoFim) {
        if (boom) return;
        bossVivo = false; boom = { t0: T };
        var qtd = reduzir ? 140 : 420;
        for (var i = 0; i < qtd; i++) { var an = rnd(0, 6.283), v = rnd(500, 3600); parts.push({ x: BOSS.cx, y: BOSS.cy, vx: Math.cos(an) * v, vy: Math.sin(an) * v, r: rnd(0, 6.28), vr: rnd(-9, 9), s: rnd(22, 64), k: Math.random() * 4 | 0 }); }
        cells = []; for (var c = 0; c < 12 * 11; c++) cells.push(Math.random());
        later(4300, function () { placa = true; placaT0 = T; parts = []; });
        later(5900, function () { if (aoFim) aoFim(); });
      },
      destruir: function () { vivo = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); else window.removeEventListener('resize', ajustar); }
    };
  }

  window.BriifArena = { criar: criar, precarregar: carregar };
})();
