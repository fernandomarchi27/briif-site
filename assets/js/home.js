(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc } = B;
  B.iniciar('inicio');

  // símbolos de fundo (como no login do app)
  B.simbolos($('#hero'), [
    ['π', 44, { top: '40px', left: '2%' }, true],
    ['∞', 36, { top: '70px', right: '4%' }, false],
    ['∑', 30, { top: '46%', right: '46%' }, false],
    ['√x', 26, { bottom: '60px', left: '3%' }, true],
    ['x²', 32, { bottom: '40px', right: '40%' }, false]
  ]);
  B.simbolos($('#cta'), [
    ['∑', 120, { top: '-20px', right: '40px' }, true],
    ['π', 70, { bottom: '20px', right: '220px' }, true]
  ]);

  // ----- trilhas ----- (a trilha Personalizada é montada por cada aluno, então não entra na vitrine)
  const FIXAS = B.TRILHAS.filter((t) => t.id !== 'personalizada');
  $('#tracks').innerHTML = FIXAS.map((t) => `
    <a class="track-card" style="--c:${t.cor}" href="trilhas.html?t=${encodeURIComponent(t.id)}">
      <div class="ic">${B.trilhaIcon(t)}</div>
      <h3>${esc(t.nome)}</h3>
      <ul>${t.fases.map((f) => `<li>${esc(f.titulo)}</li>`).join('')}</ul>
      <span class="go">Abrir trilha</span>
    </a>`).join('');

  const nFases = FIXAS.reduce((a, t) => a + t.fases.length, 0);
  const nEx = FIXAS.reduce((a, t) => a + t.fases.reduce((b, f) => b + f.exercicios.length, 0), 0);
  const nExemplos = FIXAS.reduce((a, t) => a + t.fases.reduce((b, f) => b + (B.AULAS[f.id] ? B.AULAS[f.id].exemplos.length : 0), 0), 0);
  $('#stats').innerHTML =
    `<div><b>${FIXAS.length}</b>trilhas</div>` +
    `<div><b>${nFases}</b>fases</div>` +
    `<div><b>${nExemplos}</b>exemplos resolvidos</div>` +
    `<div><b>${nEx}</b>exercícios</div>`;

  // ----- exercício interativo -----
  const passos = [
    { eq: '2x + 6 = 14', q: 'Qual operação isola o termo com x?', opts: [
      ['Subtrair 6 dos dois lados', true, '2x = 8'],
      ['Somar 6 dos dois lados', false, 'Somar 6 deixa 2x + 12 = 20 e o +6 continua lá. Para cancelar um +6, faça o contrário: subtraia.'],
      ['Multiplicar os dois lados por 6', false, 'Multiplicar só deixa os números maiores e o +6 continua no caminho.']
    ] },
    { eq: '2x = 8', q: 'Agora, o que fazer para achar o x?', opts: [
      ['Dividir os dois lados por 2', true, 'x = 4'],
      ['Multiplicar os dois lados por 2', false, 'Isso daria 4x = 16 e o x ficaria ainda mais preso. O 2 multiplica o x, então desfaça com divisão.'],
      ['Subtrair 2 dos dois lados', false, 'Subtrair 2 não isola o x. O 2 está multiplicando, então a operação contrária é a divisão.']
    ] }
  ];
  let i = 0;
  const hist = $('#eq-history'), disp = $('#eq-display'), stepEl = $('#eq-step');

  function desenhar() {
    if (i >= passos.length) {
      stepEl.innerHTML = `
        <div class="eq-done">
          <span class="xp-pop">Isso! +20 XP</span>
          <span style="color:var(--muted);font-size:14px">Conferindo: 2·4 + 6 = 14 ✓</span>
        </div>
        <div class="eq-done">
          <a class="btn btn-coral btn-sm" href="licao.html?f=algebra_1">Fazer a fase completa</a>
          <button class="linkbtn" id="eq-reset" type="button">Refazer</button>
        </div>`;
      $('#eq-reset').addEventListener('click', () => { i = 0; hist.innerHTML = ''; disp.textContent = passos[0].eq; desenhar(); });
      return;
    }
    const p = passos[i];
    stepEl.innerHTML = `
      <div class="eq-question">${esc(p.q)}</div>
      <div class="eq-options">${p.opts.map((o, k) => `<button type="button" class="opt" data-k="${k}">${esc(o[0])}</button>`).join('')}</div>
      <p class="hint" id="eq-hint" style="min-height:1.4em"></p>`;
    stepEl.querySelectorAll('.opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const o = p.opts[Number(btn.dataset.k)];
        if (o[1]) {
          btn.classList.add('right');
          stepEl.querySelectorAll('.opt').forEach((b) => (b.disabled = true));
          setTimeout(() => {
            hist.insertAdjacentHTML('beforeend', `<div>${esc(p.eq)}</div>`);
            disp.textContent = o[2];
            i += 1;
            desenhar();
          }, 550);
        } else {
          btn.classList.remove('wrong'); void btn.offsetWidth; btn.classList.add('wrong');
          $('#eq-hint').textContent = o[2];
        }
      });
    });
  }
  desenhar();
})();
