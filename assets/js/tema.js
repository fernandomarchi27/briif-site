/* ==========================================================================
   Briiff — tema (claro / noturno) e cores personalizadas
   Este arquivo é carregado no <head> de todas as páginas para o tema e as
   cores serem aplicados ANTES da página aparecer (sem piscar).

   Cores: o site usa duas cores de marca, "principal" (azul no padrão) e
   "destaque" (também azul, com branco, no padrão). Na opção personalizada elas são trocadas
   pelas escolhidas pela pessoa, com ajuste automático de contraste para
   continuarem legíveis no tema claro e no noturno.
   ========================================================================== */
(function () {
  'use strict';
  var CHAVE = 'briif:tema';
  var CHAVE_COR = 'briif:cores';
  var CHAVE_PIXEL = 'briif:pixel';
  var raiz = document.documentElement;

  var PADRAO = { principal: '#4C3CAD', destaque: '#FFFFFF' }; // azul oficial da marca + branco (ícone π / tela de abertura)
  var INICIAL = { principal: '#0F6E56', destaque: '#D4537E' }; // sugestão quando abre "Personalizada" pela 1ª vez
  var PROPS = ['--indigo', '--coral', '--on-indigo', '--on-coral'];

  var hexOk = function (h) { return typeof h === 'string' && /^#[0-9a-f]{6}$/i.test(h); };

  /* ---------------- tema claro / noturno ---------------- */
  function lerTema() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }

  function atual() { return raiz.getAttribute('data-tema') === 'noturno' ? 'noturno' : 'claro'; }

  function aplicarTema(tema) {
    // no modo pixel art só existe a versão noturna: o claro fica guardado
    // (pra voltar sozinho quando o pixel art for desligado), mas não é aplicado.
    var efetivo = pixel() ? 'noturno' : tema;
    if (efetivo === 'noturno') raiz.setAttribute('data-tema', 'noturno');
    else raiz.removeAttribute('data-tema');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', efetivo === 'noturno' ? '#0F1014' : '#FBFAF7');
    aplicarCores();
  }

  /* ---------------- cores ---------------- */
  function cores() {
    var c = null;
    try { c = JSON.parse(localStorage.getItem(CHAVE_COR)); } catch (e) { c = null; }
    c = c || {};
    return {
      modo: c.modo === 'custom' ? 'custom' : 'padrao',
      principal: hexOk(c.principal) ? c.principal.toUpperCase() : INICIAL.principal,
      destaque: hexOk(c.destaque) ? c.destaque.toUpperCase() : INICIAL.destaque
    };
  }

  function rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function hex(r) {
    return '#' + r.map(function (v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('').toUpperCase();
  }
  function lum(h) {
    var c = rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contraste(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function misturar(h, alvo, t) {
    var a = rgb(h), b = rgb(alvo);
    return hex(a.map(function (v, i) { return v + (b[i] - v) * t; }));
  }
  /** Clareia (noturno) ou escurece (claro) só o necessário para a cor aparecer bem sobre o fundo. */
  function ajustar(h, noturno) {
    var fundo = noturno ? '#0F1014' : '#FBFAF7';
    var alvo = noturno ? '#FFFFFF' : '#000000';
    var minimo = noturno ? 4.5 : 2.6;
    var i = 0;
    while (contraste(h, fundo) < minimo && i < 25) { h = misturar(h, alvo, 0.08); i++; }
    return h;
  }
  /** Cor do texto (branco ou quase preto) que fica melhor sobre um fundo colorido. */
  function textoSobre(h) {
    return contraste(h, '#FFFFFF') >= contraste(h, '#14151A') ? '#FFFFFF' : '#14151A';
  }

  function aplicarCores() {
    var c = cores(), st = raiz.style;
    // no modo pixel art as cores personalizadas ficam desativadas (a escolha
    // continua guardada, só não é aplicada enquanto o pixel art estiver ligado)
    if (c.modo !== 'custom' || pixel()) {
      PROPS.forEach(function (p) { st.removeProperty(p); });   // volta ao padrão definido no CSS
      return;
    }
    var n = atual() === 'noturno';
    var p = ajustar(c.principal, n), d = ajustar(c.destaque, n);
    st.setProperty('--indigo', p);
    st.setProperty('--coral', d);
    st.setProperty('--on-indigo', textoSobre(p));
    st.setProperty('--on-coral', textoSobre(d));
  }

  function avisar() { window.dispatchEvent(new CustomEvent('briif:tema', { detail: atual() })); }

  /* ---------------- modo pixel art ---------------- */
  // Só a Pixelify Sans: é uma fonte pixel com letras cheias, bem mais fácil de ler
  // que fontes ponto-a-ponto (tipo Silkscreen) em textos de botão e rótulo.
  var FONTES_PIXEL = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap';
  var FAVICON_PIXEL = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="3 3 14 14" shape-rendering="crispEdges">' +
    '<rect x="3" y="3" width="14" height="14" fill="#4C3CAD"/>' +
    '<g fill="#fff"><rect x="6" y="6" width="8" height="1"/><rect x="14" y="5" width="1" height="1"/><rect x="5" y="7" width="1" height="1"/>' +
    '<rect x="7" y="8" width="2" height="6"/><rect x="11" y="8" width="2" height="6"/></g></svg>');
  var faviconOriginal = null;

  function lerPixel() { try { return localStorage.getItem(CHAVE_PIXEL) === '1'; } catch (e) { return false; } }
  function pixel() { return raiz.hasAttribute('data-pixel'); }

  function aplicarPixel(ligado) {
    if (ligado) {
      raiz.setAttribute('data-pixel', 'on');
      // as fontes pixel só são baixadas quando o modo é usado
      if (!document.getElementById('briif-fontes-pixel')) {
        var l = document.createElement('link');
        l.id = 'briif-fontes-pixel'; l.rel = 'stylesheet'; l.href = FONTES_PIXEL;
        (document.head || raiz).appendChild(l);
      }
    } else {
      raiz.removeAttribute('data-pixel');
    }
    var ic = document.querySelector('link[rel~="icon"]');
    if (ic) {
      if (faviconOriginal === null) faviconOriginal = ic.getAttribute('href');
      ic.setAttribute('href', ligado ? FAVICON_PIXEL : faviconOriginal);
      ic.setAttribute('type', 'image/svg+xml');
    }
    // reaplica o tema: liga o pixel art força o modo claro; desliga volta pro tema salvo
    aplicarTema(lerTema());
  }

  /* ---------------- API pública ---------------- */
  function alternar() {
    var novo = atual() === 'noturno' ? 'claro' : 'noturno';
    try { localStorage.setItem(CHAVE, novo); } catch (e) { /* segue sem salvar */ }
    aplicarTema(novo);
    avisar();
    return novo;
  }

  /** definirCores({ modo: 'padrao' | 'custom', principal: '#RRGGBB', destaque: '#RRGGBB' }) */
  function definirCores(novo) {
    var c = cores();
    if (novo.modo) c.modo = novo.modo === 'custom' ? 'custom' : 'padrao';
    if (hexOk(novo.principal)) c.principal = novo.principal.toUpperCase();
    if (hexOk(novo.destaque)) c.destaque = novo.destaque.toUpperCase();
    try { localStorage.setItem(CHAVE_COR, JSON.stringify(c)); } catch (e) { /* segue sem salvar */ }
    aplicarCores();
    avisar();
    return c;
  }

  function alternarPixel() {
    var novo = !pixel();
    try { localStorage.setItem(CHAVE_PIXEL, novo ? '1' : '0'); } catch (e) { /* segue sem salvar */ }
    aplicarPixel(novo);
    avisar();
    return novo;
  }

  aplicarTema(lerTema());
  aplicarPixel(lerPixel());
  document.addEventListener('DOMContentLoaded', function () { aplicarTema(lerTema()); aplicarPixel(lerPixel()); });
  // se algo mudar em outra aba, acompanha
  window.addEventListener('storage', function (e) {
    if (e.key === CHAVE) { aplicarTema(e.newValue); avisar(); }
    if (e.key === CHAVE_COR) { aplicarCores(); avisar(); }
    if (e.key === CHAVE_PIXEL) { aplicarPixel(e.newValue === '1'); avisar(); }
  });

  window.BriifTema = { pixel: pixel, alternarPixel: alternarPixel, atual: atual, alternar: alternar, cores: cores, definirCores: definirCores, PADRAO: PADRAO };
})();
