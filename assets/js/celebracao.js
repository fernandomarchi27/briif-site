/* ==========================================================================
   Briiff — celebração da ofensiva (tela cheia, estilo Duolingo)
   Aparece quando a pessoa conclui a primeira fase do dia e a ofensiva
   começa ou aumenta. Dura ~3 s até liberar o botão "Continuar".

   Uso: BriifCelebracao.ofensiva({ streak, anterior, dias, aoFechar })
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Briif;
  var esc = B.esc;

  var FOGO = 'M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14.37c.38 5.6 5.11 7.32 6.81 7.54 2.43.31 5.06-.14 6.95-1.87 2.08-1.93 2.84-5.01 1.72-7.69z';

  function chamaSvg() {
    // a arte nova da chama: uma cópia borrada por trás (brilho) e a imagem tremendo por cima
    return '<img class="cel-fogo-brilho" src="assets/img/fogo.svg" alt="" aria-hidden="true">' +
      '<img class="cel-fogo" src="assets/img/fogo.svg" alt="" aria-hidden="true">';
  }

  function faiscas(n) {
    var h = '';
    for (var i = 0; i < n; i++) {
      var x = (Math.random() * 2 - 1) * 90;               // deriva horizontal (px)
      var y = 140 + Math.random() * 190;                  // altura que sobe (px)
      var d = 1.4 + Math.random() * 1.6;                  // duração (s)
      var dl = 0.15 + Math.random() * 2.2;                // atraso (s)
      var s = 3 + Math.random() * 6;                      // tamanho (px)
      var l = 38 + Math.random() * 24;                    // posição horizontal (%)
      h += '<i style="--x:' + x.toFixed(0) + 'px;--y:-' + y.toFixed(0) + 'px;--d:' + d.toFixed(2) + 's;--dl:' + dl.toFixed(2) +
        's;--s:' + s.toFixed(1) + 'px;left:' + l.toFixed(0) + '%"></i>';
    }
    return h;
  }

  var SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  function semana(dias) {
    var set = {}; (dias || []).forEach(function (d) { set[d] = true; });
    var hoje = new Date();
    var ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay());
    var h = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
      var iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var eh = d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
      var feito = !!set[iso];
      h += '<div class="cel-dia ' + (feito ? 'feito ' : '') + (eh ? 'hoje' : '') + '">' +
        '<span>' + SEMANA[i] + '</span>' +
        '<b>' + (feito ? '<img src="assets/img/fogo.svg" alt="" aria-hidden="true">' : '') + '</b></div>';
    }
    return h;
  }

  function ofensiva(opt) {
    var streak = opt.streak, anterior = Math.max(0, opt.anterior == null ? streak - 1 : opt.anterior);
    var inicio = anterior === 0;
    var Som = window.BriifSom;

    var el = document.createElement('div');
    el.className = 'cel';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', inicio ? 'Você começou uma ofensiva' : 'Sua ofensiva aumentou');
    el.innerHTML =
      '<div class="cel-brilho"></div>' +
      '<div class="cel-faiscas" aria-hidden="true">' + faiscas(28) + '</div>' +
      '<div class="cel-conteudo">' +
        '<div class="cel-chama">' + chamaSvg() + '</div>' +
        '<div class="cel-num" aria-live="polite"><span id="cel-n">' + anterior + '</span></div>' +
        '<h2 class="cel-titulo">' + (inicio ? 'Ofensiva começada!' : (streak === 1 ? 'dia de ofensiva!' : 'dias de ofensiva!')) + '</h2>' +
        '<p class="cel-sub">' + (inicio ? 'Volte amanhã para manter a chama acesa.' : 'Continue assim — não deixe a chama apagar!') + '</p>' +
        '<div class="cel-semana" aria-label="Dias desta semana">' + semana(opt.dias) + '</div>' +
        '<button type="button" class="cel-btn" id="cel-ok" hidden>Continuar</button>' +
      '</div>';
    document.body.appendChild(el);
    document.body.classList.add('cel-aberta');

    var timers = [];
    var apos = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
    var n = el.querySelector('#cel-n');
    var ok = el.querySelector('#cel-ok');
    var fechado = false;

    if (Som) Som.tocar(inicio ? 'ofensivaInicio' : 'ofensivaAtualiza');

    // o número "bate" quando a chama termina de crescer, em sincronia com o som
    apos(inicio ? 900 : 1000, function () {
      n.textContent = String(streak);
      n.parentNode.classList.add('bate');
      el.classList.add('flash');
    });
    apos(2700, function () {
      ok.hidden = false; ok.classList.add('entra'); ok.focus({ preventScroll: true });
    });

    function fechar() {
      if (fechado) return;
      fechado = true;
      timers.forEach(clearTimeout);
      el.classList.add('saindo');
      setTimeout(function () {
        el.remove();
        document.body.classList.remove('cel-aberta');
        document.removeEventListener('keydown', tecla);
        var chip = document.querySelector('.chip.fire');
        if (chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
        if (typeof opt.aoFechar === 'function') opt.aoFechar();
      }, 260);
    }
    function tecla(e) {
      if (ok.hidden) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fechar(); }
    }
    ok.addEventListener('click', fechar);
    document.addEventListener('keydown', tecla);
    return { fechar: fechar };
  }

  window.BriifCelebracao = { ofensiva: ofensiva };
})();
