/* ==========================================================================
   Briiff — celebração da ofensiva (tela cheia, estilo Duolingo)
   Aparece quando a pessoa conclui a primeira fase do dia e a ofensiva
   começa ou aumenta. Dura ~3 s até liberar o botão "Continuar".

   Uso: BriifCelebracao.ofensiva({ streak, anterior, dias, aoFechar })
        BriifCelebracao.bloqueio({ usados, streak, restantes, dias, protegidos, aoFechar })
        BriifCelebracao.boasVindas({ nome, streak, feitaHoje, bloqueios, moedas, aoFechar })
   ========================================================================== */
(function () {
  'use strict';
  var B = window.Briif;
  var esc = B.esc;

  var FOGO = 'M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-1.81-1.37-2-3.34-1.84-4.75.06-.52-.62-.77-.91-.34C4.69 10.16 4 11.84 4 14.37c.38 5.6 5.11 7.32 6.81 7.54 2.43.31 5.06-.14 6.95-1.87 2.08-1.93 2.84-5.01 1.72-7.69z';

  function chamaSvg() {
    // a arte nova da chama: uma cópia borrada por trás (brilho) e a imagem tremendo por cima
    return '<span class=\"cel-fogo-brilho ic-img ic-fogo\" aria-hidden=\"true\"></span>' +
      '<span class=\"cel-fogo ic-img ic-fogo\" aria-hidden=\"true\"></span>';
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
        '<b>' + (feito ? '<span class=\"ic-img ic-fogo\" aria-hidden=\"true\"></span>' : '') + '</b></div>';
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

  /* ------------------------------------------------------------------
     Semana com marcação dos dias protegidos por bloqueio (cadeado azul).
     ------------------------------------------------------------------ */
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function semanaComBloqueio(dias, protegidos) {
    var feitos = {}, prot = {};
    (dias || []).forEach(function (d) { feitos[d] = true; });
    (protegidos || []).forEach(function (d) { prot[d] = true; });
    var hoje = new Date();
    var ini = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay());
    var h = '';
    for (var i = 0; i < 7; i++) {
      var d = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + i);
      var k = iso(d), eh = k === iso(hoje);
      var icone = prot[k] ? '<span class=\"ic-img ic-carvao\" aria-hidden=\"true\"></span>'
        : (feitos[k] ? '<span class=\"ic-img ic-fogo\" aria-hidden=\"true\"></span>' : '');
      h += '<div class="cel-dia ' + (feitos[k] ? 'feito ' : '') + (prot[k] ? 'protegido ' : '') + (eh ? 'hoje' : '') + '">' +
        '<span>' + SEMANA[i] + '</span><b>' + icone + '</b></div>';
    }
    return h;
  }
  function faiscasAzuis(n) {
    return faiscas(n).replace(/<i /g, '<i class="azul" ');
  }
  function plural(n, um, varios) { return n === 1 ? um : varios; }
  /** Recoloca o foco/semântica e fecha com Enter, Espaço ou Esc (usado pelas duas animações novas). */
  function fecharDepois(el, opt, botao, chipSel) {
    var fechado = false, timers = [];
    function fechar() {
      if (fechado) return; fechado = true;
      timers.forEach(clearTimeout);
      el.classList.add('saindo');
      setTimeout(function () {
        el.remove();
        document.body.classList.remove('cel-aberta');
        document.removeEventListener('keydown', tecla);
        var chip = chipSel && document.querySelector(chipSel);
        if (chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
        if (typeof opt.aoFechar === 'function') opt.aoFechar();
      }, 260);
    }
    function tecla(e) {
      if (botao && botao.hidden) return;
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fechar(); }
    }
    document.addEventListener('keydown', tecla);
    return { fechar: fechar, apos: function (ms, fn) { timers.push(setTimeout(fn, ms)); } };
  }

  /* ------------------------------------------------------------------
     BLOQUEIO USADO: a pessoa não estudou num dia e um combustível
     salvou a sequência. A chama esfria, o cadeado cai sobre ela, onda de
     choque azul e a chama volta a brilhar.
     Uso: BriifCelebracao.bloqueio({ usados, streak, restantes, dias, protegidos, aoFechar })
     ------------------------------------------------------------------ */
  function bloqueio(opt) {
    var usados = Math.max(1, opt.usados || 1), streak = opt.streak || 0, restam = Math.max(0, opt.restantes || 0);
    var Som = window.BriifSom;
    var el = document.createElement('div');
    el.className = 'cel cel-bloq';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Seu combustível foi usado');
    var texto = streak > 0
      ? 'Você ficou ' + usados + ' ' + plural(usados, 'dia', 'dias') + ' sem estudar, mas ' + plural(usados, 'o combustível protegeu', 'o combustível protegeu') + ' sua ofensiva de ' + streak + ' ' + plural(streak, 'dia', 'dias') + '.'
      : 'Você ficou ' + usados + ' ' + plural(usados, 'dia', 'dias') + ' sem estudar e o combustível foi usado.';
    var restamTxt = restam > 0
      ? 'Ainda ' + plural(restam, 'resta', 'restam') + ' <b>' + restam + '</b> ' + 'de combustível.'
      : 'Esse era seu <b>último combustível</b>. Estude hoje para manter a chama!';
    el.innerHTML =
      '<div class="cel-brilho"></div>' +
      '<div class="cel-faiscas" aria-hidden="true">' + faiscasAzuis(22) + '</div>' +
      '<div class="cel-conteudo">' +
        '<div class="bq-cena" aria-hidden="true">' +
          '<span class="bq-onda"></span><span class="bq-onda dois"></span>' +
          '<div class="bq-chama"><span class=\"cel-fogo-brilho ic-img ic-fogo\" aria-hidden=\"true\"></span><span class=\"cel-fogo ic-img ic-fogo\" aria-hidden=\"true\"></span></div>' +
          '<span class=\"bq-cadeado ic-img ic-carvao\" aria-hidden=\"true\"></span>' +
        '</div>' +
        '<h2 class="bq-titulo">Combustível usado!</h2>' +
        '<p class="cel-sub bq-sub">' + texto + '</p>' +
        '<p class="bq-restam">' + restamTxt + '</p>' +
        '<div class="cel-semana bq-semana" aria-label="Dias desta semana">' + semanaComBloqueio(opt.dias, opt.protegidos) + '</div>' +
        '<button type="button" class="cel-btn" id="bq-ok" hidden>Continuar</button>' +
      '</div>';
    document.body.appendChild(el);
    document.body.classList.add('cel-aberta');
    var ok = el.querySelector('#bq-ok');
    var c = fecharDepois(el, opt, ok, '.chip.lock');
    if (Som) Som.tocar('bloqueio');
    c.apos(950, function () { el.classList.add('flash'); });          // impacto do cadeado
    c.apos(2900, function () { ok.hidden = false; ok.classList.add('entra'); ok.focus({ preventScroll: true }); });
    ok.addEventListener('click', c.fechar);
    return { fechar: c.fechar };
  }

  /* ------------------------------------------------------------------
     BOAS-VINDAS: 1ª abertura do dia. Dura ~3 s e fecha sozinha; um toque
     ou tecla fecha antes.
     Uso: BriifCelebracao.boasVindas({ nome, streak, feitaHoje, bloqueios, moedas, aoFechar })
     ------------------------------------------------------------------ */
  var MARCA = '<i class="pi-logo"></i>';
  function boasVindas(opt) {
    var h = new Date().getHours();
    var saudacao = h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    var streak = opt.streak || 0;
    var sub = streak > 0
      ? (opt.feitaHoje ? 'Sua ofensiva de ' + streak + ' ' + plural(streak, 'dia', 'dias') + ' já está garantida hoje.'
        : 'Você está com ' + streak + ' ' + plural(streak, 'dia', 'dias') + ' de ofensiva. Estude hoje para mantê-la!')
      : 'Que tal começar uma ofensiva hoje?';
    var I = B.ICONS || {};
    var el = document.createElement('div');
    el.className = 'cel cel-bv';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="cel-brilho"></div>' +
      '<div class="cel-conteudo">' +
        '<div class="bv-marca" aria-hidden="true"><span class="bv-aro"></span>' + MARCA + '</div>' +
        '<h2 class="bv-titulo">' + saudacao + (opt.nome ? ', ' + esc(opt.nome) : '') + '!</h2>' +
        '<p class="cel-sub bv-sub">' + sub + '</p>' +
        '<div class="bv-chips">' +
          '<span class="bv-chip fogo">' + (I.flame || '') + '<b>' + streak + '</b><small>ofensiva</small></span>' +
          '<span class="bv-chip lock">' + (I.bloqueio || '') + '<b>' + (opt.bloqueios || 0) + '</b><small>' + 'combustível' + '</small></span>' +
          '<span class="bv-chip moeda">' + (I.coin || '') + '<b>' + (opt.moedas || 0) + '</b><small>Moedas</small></span>' +
        '</div>' +
        '<div class="bv-barra" aria-hidden="true"><i></i></div>' +
        '<p class="bv-dica">Toque para continuar</p>' +
      '</div>';
    document.body.appendChild(el);
    document.body.classList.add('cel-aberta');
    var c = fecharDepois(el, opt, null, '.chip.fire');
    if (window.BriifSom) window.BriifSom.tocar('abrir');
    c.apos(3200, c.fechar);
    el.addEventListener('click', c.fechar);
    return { fechar: c.fechar };
  }

  window.BriifCelebracao = { ofensiva: ofensiva, bloqueio: bloqueio, boasVindas: boasVindas };
})();
