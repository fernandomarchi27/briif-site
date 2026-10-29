/* ==========================================================================
   Briiff — Grimório: o livro de estudos (abre por cima do site)
   O conteúdo NÃO é duplicado: cada capítulo é montado em tempo real com o que já existe em
   data.js (BRIIF_DATA): lição da fase + aula (passo a passo, exemplos resolvidos, erro comum,
   dica de ENEM). Cada capítulo tem link para praticar a fase correspondente.
   ========================================================================== */
(function () {
  'use strict';
  var CHAVE = 'briif:grimorio';
  var ov = null, aberto = false, opener = null, est = { t: 0, c: 0 }, D = null;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var rich = function (t) { return window.Briif && window.Briif.rich ? window.Briif.rich(t) : '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'; };

  function dados(cb) {
    var pronto = function () {   // só trilhas com aulas escritas (a Personalizada mistura as outras e não tem aula própria)
      var B = window.BRIIF_DATA; D = { aulas: B.aulas, trilhas: B.trilhas.filter(function (x) { return x.id !== 'personalizada' && x.fases && x.fases.length && B.aulas[x.fases[0].id]; }) };
    };
    if (window.BRIIF_DATA) { pronto(); return cb(); }
    var s = document.createElement('script'); s.src = 'assets/js/data.js';
    s.onload = function () { pronto(); cb(); };
    s.onerror = function () { cb(new Error('dados')); };
    document.head.appendChild(s);
  }

  function ler() { try { var o = JSON.parse(localStorage.getItem(CHAVE)); if (o && o.t >= 0) return o; } catch (e) { /* segue */ } return { t: 0, c: 0 }; }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(est)); } catch (e) { /* segue */ } }

  function pix(txt, curto) { return '<span class="gm-pix">' + esc(txt) + '</span>'; }
  function capitulo(t, f) {
    var a = (D.aulas && D.aulas[f.id]) || {};
    var h = '<h2 class="gm-h">Capítulo ' + esc(f.numero) + ' · ' + esc(f.titulo) + '</h2><p class="gm-trilha">' + esc(t.nome) + '</p>';
    h += '<div class="gm-txt">' + rich(f.licao || '') + '</div>';
    if (a.passos && a.passos.length) h += '<h3>Passo a passo</h3><ol class="gm-passos">' + a.passos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
    if (a.exemplos && a.exemplos.length) {
      h += '<h3>Exemplos resolvidos</h3>';
      a.exemplos.forEach(function (e) {
        var curto = String(e.q || '').length <= 34;
        h += '<div class="gm-ex"><b>' + esc(e.t) + '</b><div class="gm-q ' + (curto ? 'gm-pix' : '') + '">' + esc(e.q) + '</div>' +
          '<ol>' + (e.passos || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
          '<div class="gm-r"><span>Resposta</span> <span class="gm-pix">' + esc(e.r) + '</span></div></div>';
      });
    }
    if (a.erro) h += '<div class="gm-nota erro"><b>Erro comum</b><p>' + esc(a.erro) + '</p></div>';
    if (a.enem) h += '<div class="gm-nota"><b>Dica para o ENEM</b><p>' + esc(a.enem) + '</p></div>';
    h += '<p class="gm-praticar"><a class="btn btn-coral btn-sm" href="licao.html?f=' + encodeURIComponent(f.id) + '">Praticar este capítulo</a></p>';
    return h;
  }

  function desenhar() {
    var t = D.trilhas[est.t] || D.trilhas[0], f = t.fases[est.c] || t.fases[0];
    ov.querySelector('.gm-trilhas').innerHTML = D.trilhas.map(function (x, i) {
      return '<button type="button" class="gm-tab" data-t="' + i + '"' + (i === est.t ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(x.nome) + '</button>';
    }).join('');
    ov.querySelector('.gm-sumario').innerHTML = '<h3>Sumário · ' + esc(t.nome) + '</h3><ol>' + t.fases.map(function (x, i) {
      return '<li><button type="button" class="gm-cap" data-c="' + i + '"' + (i === est.c ? ' aria-current="true"' : '') + '><span class="gm-n">' + esc(x.numero) + '</span>' + esc(x.titulo) + '</button></li>';
    }).join('') + '</ol>';
    var pag = ov.querySelector('.gm-pagina');
    pag.innerHTML = capitulo(t, f); pag.scrollTop = 0;
    ov.querySelector('.gm-atual').textContent = 'Cap. ' + f.numero + ' · ' + f.titulo;
  }

  function montar() {
    ov = document.createElement('div');
    ov.className = 'gm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Grimório, livro de estudos');
    ov.innerHTML =
      '<div class="gm-livro">' +
        '<div class="gm-capa" aria-hidden="true"><i class="pi-logo"></i><b>Grimório</b></div>' +
        '<div class="gm-topo"><span class="gm-titulo">Grimório</span><button type="button" class="gm-toggle" aria-expanded="false">Capítulos · <span class="gm-atual"></span></button>' +
        '<button type="button" class="gm-fechar" aria-label="Fechar livro">Fechar livro ✕</button></div>' +
        '<div class="gm-corpo"><aside class="gm-indice"><div class="gm-trilhas" role="group" aria-label="Trilhas"></div><nav class="gm-sumario" aria-label="Capítulos"></nav></aside>' +
        '<article class="gm-pagina" tabindex="0" aria-live="polite"></article></div>' +
      '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return fechar();
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('gm-fechar')) return fechar();
      if (b.classList.contains('gm-toggle')) { var ab = ov.classList.toggle('indice'); b.setAttribute('aria-expanded', String(ab)); return; }
      if (b.dataset.t != null) { est.t = Number(b.dataset.t); est.c = 0; salvar(); desenhar(); return; }
      if (b.dataset.c != null) { est.c = Number(b.dataset.c); salvar(); desenhar(); ov.classList.remove('indice'); ov.querySelector('.gm-toggle').setAttribute('aria-expanded', 'false'); ov.querySelector('.gm-pagina').focus({ preventScroll: true }); }
    });
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); return fechar(); }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(ov.querySelectorAll('button, a[href], [tabindex="0"]'), function (x) { return x.offsetParent !== null && !x.disabled; });
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });
  }

  function abrir() {
    if (aberto) return;
    dados(function (erro) {
      if (erro || !D) { alert('Não foi possível abrir o Grimório agora. Tente de novo.'); return; }
      opener = document.activeElement;
      est = ler(); if (est.t >= D.trilhas.length) est = { t: 0, c: 0 };
      if (!ov) montar();
      desenhar();
      aberto = true; document.documentElement.classList.add('gm-aberto');
      ov.classList.remove('fechando'); ov.classList.add('aberto');
      ov.querySelector('.gm-fechar').focus({ preventScroll: true });
    });
  }
  function fechar() {
    if (!aberto) return;
    aberto = false; ov.classList.add('fechando'); ov.classList.remove('indice');
    var fim = function () { ov.classList.remove('aberto', 'fechando'); document.documentElement.classList.remove('gm-aberto'); if (opener && opener.focus) opener.focus(); };
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduz) fim(); else setTimeout(fim, 260);
  }
  window.BriifGrimorio = { abrir: abrir, fechar: fechar };
})();
