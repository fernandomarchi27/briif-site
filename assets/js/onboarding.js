(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc, ICONS } = B;
  B.iniciar('');

  const host = $('#onboarding');
  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  const destino = next && /^[a-z0-9_\-]+\.html(\?.*)?$/i.test(next) ? next : 'trilhas.html';

  // Só as 4 matérias "normais" entram no diagnóstico (ENEM é revisão mista, não um ponto de partida).
  const MATERIAS = B.TRILHAS.filter((t) => ['algebra', 'geometria', 'funcoes', 'estatistica'].indexOf(t.id) !== -1);

  const TUTORIAL = [
    {
      icone: ICONS.mix,
      titulo: 'Bem-vindo ao Briiff!',
      texto: 'Você acabou de criar sua conta. Antes de começar, um tour rápido pelo que dá pra fazer por aqui.'
    },
    {
      icone: ICONS.algebra,
      titulo: 'Trilhas por matéria',
      texto: 'Cada matéria tem uma trilha com fases em sequência: você aprende, pratica com exercícios e libera a próxima fase.'
    },
    {
      icone: ICONS.flame,
      titulo: 'Ofensiva e MathCoins',
      texto: 'Complete pelo menos uma fase por dia pra manter sua ofensiva 🔥 acesa, e ganhe MathCoins a cada fase concluída.'
    },
    {
      icone: ICONS.bloqueio,
      titulo: 'Loja e bloqueios de ofensiva',
      texto: 'Troque MathCoins na Loja por bloqueios de ofensiva: se um dia passar em branco, um bloqueio é usado sozinho e sua ofensiva não zera. Você já ganhou 2 de presente!'
    },
    {
      icone: ICONS.mix,
      titulo: 'Trilha Personalizada',
      texto: 'Prefere misturar matérias? Em Trilhas → Personalizada você escolhe quais entram e monta seu próprio ritmo.'
    },
    {
      icone: ICONS.moon,
      titulo: 'Modo noturno',
      texto: 'Prefere uma tela mais escura? O botão da lua no topo do site alterna entre o modo claro e o modo noturno a qualquer momento.'
    },
    {
      icone: ICONS.gamepad,
      titulo: 'Modo game',
      texto: 'O botão do controle liga o modo game: um visual estilo pixel art, com bordas "quebradinhas" e tudo mais.'
    },
    {
      icone: ICONS.paleta,
      titulo: 'Cores personalizadas',
      texto: 'Quer deixar com a sua cara? No botão da paleta você escolhe suas próprias cores pro site, no lugar das cores padrão do Briiff.'
    }
  ];

  // ---------------------------------------------------------------- estado
  let etapa = 'tutorial'; // tutorial | oferta | quiz | resultado
  let slide = 0;
  let perguntas = [];
  let qi = 0;
  let respondida = null;
  let respostas = []; // { materiaId, certa }

  function embaralhar(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function montarPerguntas() {
    const porMateria = { algebra: 3, geometria: 3, funcoes: 2, estatistica: 2 };
    let lista = [];
    MATERIAS.forEach((t) => {
      const todas = [];
      t.fases.forEach((f) => f.exercicios.forEach((e) => {
        if (e.dificuldade !== 'dificil') todas.push(Object.assign({}, e, { materiaId: t.id, materia: t.nome, materiaCor: t.cor }));
      }));
      lista = lista.concat(embaralhar(todas).slice(0, porMateria[t.id] || 2));
    });
    return embaralhar(lista);
  }

  // ---------------------------------------------------------------- render
  function render() {
    if (etapa === 'tutorial') return renderTutorial();
    if (etapa === 'oferta') return renderOferta();
    if (etapa === 'quiz') return renderQuiz();
    return renderResultado();
  }

  function renderTutorial() {
    const s = TUTORIAL[slide];
    host.innerHTML = `
      <div class="onb-slide">
        <span class="onb-icon">${s.icone}</span>
        <h1>${esc(s.titulo)}</h1>
        <p>${esc(s.texto)}</p>
        <div class="onb-dots">${TUTORIAL.map((_, i) => `<span class="${i === slide ? 'on' : ''}"></span>`).join('')}</div>
        <div class="onb-nav">
          ${slide > 0 ? `<button class="btn btn-ink btn-sm" id="onb-voltar" type="button">Voltar</button>` : `<button class="onb-skip" id="onb-pular" type="button">Pular tudo</button>`}
          <button class="btn btn-coral" id="onb-prox" type="button">${slide + 1 < TUTORIAL.length ? 'Próximo' : 'Continuar'} ${ICONS.arrow}</button>
        </div>
      </div>`;
    const voltar = $('#onb-voltar'), pular = $('#onb-pular'), prox = $('#onb-prox');
    if (voltar) voltar.addEventListener('click', () => { slide -= 1; render(); });
    if (pular) pular.addEventListener('click', () => { etapa = 'oferta'; render(); });
    prox.addEventListener('click', () => {
      if (slide + 1 < TUTORIAL.length) { slide += 1; render(); }
      else { etapa = 'oferta'; render(); }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderOferta() {
    host.innerHTML = `
      <div class="onb-slide">
        <span class="onb-icon">${ICONS.check}</span>
        <h1>Quer saber por onde começar?</h1>
        <p>Um quiz rápido e opcional com 10 perguntas misturando Álgebra, Geometria, Funções e Estatística. No final, indicamos a matéria mais recomendada pra você começar — mas você pode pular e escolher sozinho.</p>
        <div class="onb-quiz-oferta">
          <button class="btn btn-coral" id="onb-ir-quiz" type="button">Fazer o quiz (recomendado)</button>
          <button class="onb-skip" id="onb-ir-trilhas" type="button">Pular e ver as trilhas</button>
        </div>
      </div>`;
    $('#onb-ir-quiz').addEventListener('click', () => {
      perguntas = montarPerguntas();
      qi = 0; respondida = null; respostas = [];
      etapa = 'quiz'; render();
    });
    $('#onb-ir-trilhas').addEventListener('click', () => { location.href = destino; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderQuiz() {
    const total = perguntas.length;
    const ex = perguntas[qi];
    const pct = Math.round((qi / total) * 100);
    const letras = ['A', 'B', 'C', 'D', 'E'];

    let fb = '';
    if (respondida !== null) {
      const ok = respondida === ex.correta;
      fb = `<div class="feedback ${ok ? 'ok' : 'no'}" role="status">
        <b>${ok ? 'Correto!' : 'Quase. A resposta certa é ' + esc(ex.opcoes[ex.correta]) + '.'}</b>
        <p>${esc(ex.explicacao)}</p></div>
        <div class="q-actions"><button class="btn btn-coral btn-sm" id="onb-prox-q" type="button">${qi + 1 < total ? 'Próxima pergunta' : 'Ver resultado'} ${ICONS.arrow}</button></div>`;
    }

    host.innerHTML = `
      <div class="quiz-top">
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <span class="count">${qi + 1} de ${total}</span>
      </div>
      <div class="q-card">
        <span class="mat-tag" style="--c:${ex.materiaCor}">${esc(ex.materia)}</span>
        <h2>${esc(ex.pergunta)}</h2>
        <div class="q-options">
          ${ex.opcoes.map((o, k) => {
            let cls = '';
            if (respondida !== null) { if (k === ex.correta) cls = 'right'; else if (k === respondida) cls = 'wrong'; }
            return `<button class="opt ${cls}" data-k="${k}" type="button" ${respondida !== null ? 'disabled' : ''}><b style="color:var(--faint);margin-right:10px">${letras[k]}</b>${esc(o)}</button>`;
          }).join('')}
        </div>
        ${fb}
      </div>
      <div id="rasc-host"></div>`;

    const responder = (k) => {
      if (respondida !== null) return;
      respondida = k;
      if (window.BriifSom) window.BriifSom.tocar(k === ex.correta ? 'acerto' : 'erro');
      respostas.push({ materiaId: ex.materiaId, certa: respondida === ex.correta });
      render();
    };
    if (window.BriifRascunho) {
      window.BriifRascunho.montar($('#rasc-host'), 'onboarding:' + qi, {
        contador: `Pergunta ${qi + 1} de ${total}`,
        pergunta: ex.pergunta,
        opcoes: ex.opcoes,
        respondida,
        correta: ex.correta,
        aoResponder: responder
      });
    }

    if (respondida === null) {
      host.querySelectorAll('.q-options .opt').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.k))));
    } else {
      $('#onb-prox-q').addEventListener('click', () => {
        if (qi + 1 < total) { if (window.BriifSom) window.BriifSom.tocar('avancar'); qi += 1; respondida = null; render(); }
        else { etapa = 'resultado'; render(); if (window.BriifSom) window.BriifSom.tocar(respostas.every((r) => r.certa) ? 'perfeito' : 'concluir'); }
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderResultado() {
    const porMateria = {};
    MATERIAS.forEach((t) => { porMateria[t.id] = { nome: t.nome, cor: t.cor, certas: 0, total: 0 }; });
    respostas.forEach((r) => {
      const m = porMateria[r.materiaId];
      if (!m) return;
      m.total += 1;
      if (r.certa) m.certas += 1;
    });

    let recomendada = null;
    MATERIAS.forEach((t) => {
      const m = porMateria[t.id];
      if (m.total === 0) return;
      const taxa = m.certas / m.total;
      if (!recomendada || taxa < recomendada.taxa) recomendada = { id: t.id, nome: t.nome, taxa };
    });

    const totalCertas = respostas.filter((r) => r.certa).length;

    host.innerHTML = `
      <div class="onb-slide">
        <span class="onb-icon">${ICONS.check}</span>
        <h1>Você acertou ${totalCertas} de ${respostas.length}</h1>
        <p>Veja como você se saiu em cada matéria:</p>
        <div class="onb-result-bars">
          ${MATERIAS.map((t) => {
            const m = porMateria[t.id];
            const pct = m.total ? Math.round((m.certas / m.total) * 100) : 0;
            return `<div>
              <div class="onb-bar-label"><span>${esc(t.nome)}</span><span>${m.certas}/${m.total}</span></div>
              <div class="onb-bar-track"><div class="onb-bar-fill" style="width:${pct}%;background:${t.cor}"></div></div>
            </div>`;
          }).join('')}
        </div>
        ${recomendada ? `
          <div class="onb-recomendado">
            <div class="rotulo">Recomendamos começar por</div>
            <b>${esc(recomendada.nome)}</b>
            <p>Foi onde você mais errou — reforçar essa base agora deixa o resto mais fácil depois.</p>
          </div>
          <div class="onb-nav">
            <a class="btn btn-ink btn-sm" href="trilhas.html">Ver todas as trilhas</a>
            <a class="btn btn-coral" href="trilhas.html?t=${encodeURIComponent(recomendada.id)}">Começar em ${esc(recomendada.nome)} ${ICONS.arrow}</a>
          </div>` : `
          <div class="onb-nav">
            <a class="btn btn-coral" href="${destino}">Ver as trilhas ${ICONS.arrow}</a>
          </div>`}
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render();
})();
