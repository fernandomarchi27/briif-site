/* ==========================================================================
   Briiff — menu lateral com ícones pixelados (vazados → preenchidos)
   - Inativo: ícone vazado. Hover/foco/ativo: preenchido; o nome aparece como etiqueta
     FLUTUANTE (position:absolute), então nada se desloca.
   - Celular: vira barra inferior com o nome sempre visível (não depende de hover).
   - O botão Grimório abre o livro (grimorio.js), carregado só quando é usado.
   ========================================================================== */
(function () {
  'use strict';
  var pagina = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (pagina === 'login.html' || pagina === 'onboarding.html' || pagina === 'verificar-email.html') return;
  if (document.getElementById('rail')) return;

  /* ícones 12x12: '#' = pixel cheio. O vazado é calculado: só o contorno de cada forma. */
  var ICONES = {
    inicio: ['.....##.....', '....####....', '...######...', '..########..', '.##########.', '############', '.##########.', '.####..####.', '.####..####.', '.####..####.', '.####..####.', '.##########.'],
    trilhas: ['.#..........', '.#####......', '.#######....', '.#########..', '.#######....', '.#####......', '.#..........', '.#..........', '.#..........', '.#..........', '.#..........', '###.........'],
    lab: ['...######...', '....####....', '....####....', '....####....', '...######...', '..########..', '.##########.', '.##########.', '.##########.', '.##########.', '..########..', '...######...'],
    ranking: ['.##########.', '.##########.', '###.####.###', '###.####.###', '.##########.', '..########..', '....####....', '.....##.....', '.....##.....', '....####....', '...######...', '...######...'],
    loja: ['....####....', '...#....#...', '..########..', '.##########.', '############', '############', '############', '############', '############', '############', '.##########.', '..########..'],
    grimorio: ['.##########.', '############', '############', '##........##', '############', '####.##.####', '####.##.####', '####.##.####', '####.##.####', '############', '.##########.', '..########..']
  };
  function contorno(rows) {
    var h = rows.length, w = rows[0].length;
    return rows.map(function (r, y) {
      return r.split('').map(function (c, x) {
        if (c !== '#') return '.';
        var vazio = function (xx, yy) { return xx < 0 || yy < 0 || xx >= w || yy >= h || rows[yy][xx] !== '#'; };
        return (vazio(x - 1, y) || vazio(x + 1, y) || vazio(x, y - 1) || vazio(x, y + 1)) ? '#' : '.';
      }).join('');
    });
  }
  function svg(rows) {
    var r = '';
    rows.forEach(function (row, y) {
      var x = 0;
      while (x < row.length) {
        if (row[x] === '#') { var s = x; while (x < row.length && row[x] === '#') x++; r += '<rect x="' + s + '" y="' + y + '" width="' + (x - s) + '" height="1"/>'; } else x++;
      }
    });
    return '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true" fill="currentColor">' + r + '</svg>';
  }

  var ITENS = [
    ['index.html', 'Início', 'inicio', ['index.html']],
    ['trilhas.html', 'Trilhas', 'trilhas', ['trilhas.html', 'licao.html', 'boss.html']],
    ['laboratorio.html', 'Laboratório', 'lab', ['laboratorio.html']],
    ['ranking.html', 'Ranking', 'ranking', ['ranking.html']],
    ['loja.html', 'Loja', 'loja', ['loja.html', 'avatar.html']],
    [null, 'Grimório', 'grimorio', []]
  ];
  var nav = document.createElement('nav');
  nav.id = 'rail'; nav.className = 'rail'; nav.setAttribute('aria-label', 'Menu principal');
  nav.innerHTML = ITENS.map(function (it) {
    var ativo = it[3].indexOf(pagina) !== -1;
    var ic = '<span class="rail-ic"><span class="o">' + svg(contorno(ICONES[it[2]])) + '</span><span class="f">' + svg(ICONES[it[2]]) + '</span></span>';
    var nome = '<span class="rail-nome">' + it[1] + '</span>';
    return it[0]
      ? '<a href="' + it[0] + '" data-nome="' + it[1] + '" aria-label="' + it[1] + '"' + (ativo ? ' aria-current="page"' : '') + '>' + ic + nome + '</a>'
      : '<button type="button" data-nome="' + it[1] + '" aria-label="' + it[1] + ' (livro de estudos)" aria-haspopup="dialog" id="rail-grimorio">' + ic + nome + '</button>';
  }).join('');

  function montar() {
    document.body.appendChild(nav);
    document.body.classList.add('has-rail');
    var hd = document.getElementById('site-header');
    var ajustar = function () { document.documentElement.style.setProperty('--hdr', (hd ? hd.offsetHeight : 68) + 'px'); };
    ajustar(); window.addEventListener('resize', ajustar); setTimeout(ajustar, 600);
    document.getElementById('rail-grimorio').addEventListener('click', function () {
      if (window.BriifGrimorio) return window.BriifGrimorio.abrir();
      var s = document.createElement('script'); s.src = 'assets/js/grimorio.js';
      s.onload = function () { window.BriifGrimorio.abrir(); };
      document.head.appendChild(s);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
