(function () {
  'use strict';
  const B = window.Briif;
  const { $, $$, esc, rich, ICONS } = B;
  const som = (n) => { if (window.BriifSom) window.BriifSom.tocar(n); };
  B.iniciar('trilhas');

  const root = $('#lesson');
  const id = new URLSearchParams(location.search).get('f');
  const achou = B.acharFase(id);

  if (!achou) {
    root.innerHTML = `<div class="block"><h2>Fase não encontrada</h2><p>Esse endereço não corresponde a nenhuma fase.</p><a class="btn btn-coral btn-sm" href="trilhas.html">Ver trilhas</a></div>`;
    return;
  }

  const { trilha, fase, ti, fi } = achou;
  const aula = B.AULAS[fase.id];
  document.title = `${fase.titulo} — Briiff`;

  let prog = B.progresso.ler();
  if (!B.progresso.faseDisponivel(prog, trilha, fi) && !B.progresso.faseCompleta(prog, fase.id)) {
    const ant = trilha.fases[fi - 1];
    root.innerHTML = `<div class="block"><h2>Essa fase ainda está bloqueada</h2><p>Conclua antes a fase <b>${esc(ant.titulo)}</b> para liberar esta.</p>
      <a class="btn btn-coral btn-sm" href="licao.html?f=${encodeURIComponent(ant.id)}">Ir para a fase anterior</a></div>`;
    // se o progresso veio da nuvem (outro aparelho), libera a fase quando a sincronização terminar
    B.aguardarSync().then((mudou) => { if (mudou) location.reload(); });
    return;
  }

  root.style.setProperty('--c', trilha.cor);
  root.style.setProperty('--on-c', trilha.on);

  let view = 'aprender';     // aprender | praticar | resultado
  let q = 0, acertos = 0, respondida = null, resumo = null, finalizada = false;

  const DIFF = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' };

  /* ---------- estrutura comum ---------- */
  function topo() {
    return `
      <div class="crumbs"><a href="trilhas.html?t=${encodeURIComponent(trilha.id)}">${esc(trilha.nome)}</a> / Fase ${fase.numero}</div>
      <span class="badge" style="--c:${trilha.cor}">${esc(trilha.nome)} · Fase ${fase.numero}</span>
      <h1>${esc(fase.titulo)}</h1>
      <div class="steps-nav" role="tablist">
        <button role="tab" data-v="aprender" aria-selected="${view === 'aprender'}">1. Aprender</button>
        <button role="tab" data-v="praticar" aria-selected="${view === 'praticar'}">2. Praticar</button>
        <button role="tab" data-v="resultado" aria-selected="${view === 'resultado'}" ${resumo ? '' : 'disabled'}>3. Resultado</button>
      </div>`;
  }
  function ligarNav() {
    $$('.steps-nav button').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      if (b.dataset.v === 'praticar' && view !== 'praticar') { q = 0; acertos = 0; respondida = null; finalizada = false; }
      view = b.dataset.v; render();
    }));
  }

  /* ---------- 1. Aprender ---------- */
  function aprender() {
    const exemplos = aula.exemplos.map((ex, k) => `
      <article class="example" data-k="${k}" style="--c:${trilha.cor}">
        <header><small>Exemplo ${k + 1} · ${esc(ex.t)}</small><div class="q">${esc(ex.q)}</div></header>
        <div class="body">
          <ol class="ex-steps" data-steps></ol>
          <div data-answer></div>
          <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
            <button class="btn btn-ink btn-sm" data-next type="button">Mostrar o 1º passo</button>
            <button class="linkbtn" data-all type="button">Mostrar tudo</button>
          </div>
        </div>
      </article>`).join('');

    return `
      ${topo()}
      <section class="block idea">
        <h2>A ideia</h2>
        <div class="rich">${rich(fase.licao)}</div>
      </section>
      <section class="block">
        <h2>Como resolver, passo a passo</h2>
        <ol class="method">${aula.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
      </section>
      ${aula.exemplos.length ? `
      <h2 style="font-size:1.4rem;margin:30px 0 14px">Exemplos resolvidos</h2>
      <p style="color:var(--muted);margin-top:-6px">Tente resolver de cabeça antes de abrir cada passo.</p>
      ${exemplos}` : ''}
      <div class="tips">
        <div class="tip err"><b>Erro comum</b>${esc(aula.erro)}</div>
        <div class="tip enem"><b>Dica para o ENEM</b>${esc(aula.enem)}</div>
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button class="btn btn-coral" id="go-praticar" type="button">Praticar agora ${ICONS.arrow}</button>
      </div>`;
  }
  function ligarAprender() {
    $$('.example').forEach((el) => {
      const ex = aula.exemplos[Number(el.dataset.k)];
      const lista = $('[data-steps]', el), resp = $('[data-answer]', el), btn = $('[data-next]', el), all = $('[data-all]', el);
      let n = 0;
      const mostrar = () => {
        if (n < ex.passos.length) {
          lista.insertAdjacentHTML('beforeend', `<li>${esc(ex.passos[n])}</li>`);
          n++;
          som('passo');
        }
        if (n >= ex.passos.length) {
          if (!resp.innerHTML) resp.innerHTML = `<div class="ex-answer"><small>Resposta</small>${esc(ex.r)}</div>`;
          btn.remove(); all.remove();
        } else {
          btn.textContent = `Próximo passo (${n}/${ex.passos.length})`;
        }
      };
      btn.addEventListener('click', mostrar);
      all.addEventListener('click', () => { while (btn.isConnected) mostrar(); });
    });
    $('#go-praticar').addEventListener('click', () => { view = 'praticar'; q = 0; acertos = 0; respondida = null; finalizada = false; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- 2. Praticar ---------- */
  function praticar() {
    const total = fase.exercicios.length;
    const ex = fase.exercicios[q];
    const pct = Math.round((q / total) * 100);
    const letras = ['A', 'B', 'C', 'D', 'E'];

    let fb = '';
    if (respondida !== null) {
      const ok = respondida === ex.correta;
      fb = `<div class="feedback ${ok ? 'ok' : 'no'}" role="status">
        <b>${ok ? 'Correto!' : 'Quase. A resposta certa é ' + esc(ex.opcoes[ex.correta]) + '.'}</b>
        <p>${esc(ex.explicacao)}</p></div>
        <div class="q-actions"><button class="btn btn-coral btn-sm" id="prox" type="button">${q + 1 < total ? 'Próxima pergunta' : 'Ver resultado'} ${ICONS.arrow}</button></div>`;
    }

    return `
      ${topo()}
      <div class="quiz-top">
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <span class="count">${q + 1} de ${total}</span>
      </div>
      <div class="q-card">
        ${ex.materia ? `<span class="mat-tag" style="--c:${ex.materiaCor}">${esc(ex.materia)}</span>` : ''}
        <div class="diff">Dificuldade: ${DIFF[ex.dificuldade] || 'Média'}</div>
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
  }
  function ligarPraticar() {
    const ex = fase.exercicios[q];
    const responder = (k) => {
      if (respondida !== null) return;
      respondida = k;
      if (respondida === ex.correta) acertos++;
      som(respondida === ex.correta ? 'acerto' : 'erro');
      render();
      const f = $('.feedback'); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    if (window.BriifRascunho) {
      window.BriifRascunho.montar($('#rasc-host'), fase.id + ':' + (ex.id || q), {
        contador: `Pergunta ${q + 1} de ${fase.exercicios.length}`,
        pergunta: ex.pergunta,
        opcoes: ex.opcoes,
        respondida,
        correta: ex.correta,
        aoResponder: responder
      });
    }
    $$('.q-options .opt').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.k))));
    const prox = $('#prox');
    if (prox) prox.addEventListener('click', () => {
      if (q + 1 < fase.exercicios.length) { som('avancar'); q++; respondida = null; render(); }
      else { finalizar(); }
    });
  }

  function finalizar() {
    if (!finalizada) {
      resumo = B.progresso.completarFase(fase.id, trilha.id, fase.xp, acertos, fase.exercicios.length);
      resumo.acertos = acertos;
      finalizada = true;
      B.atualizarHeader();
      // primeira fase do dia: a ofensiva ganha uma tela cheia de comemoração antes do resultado
      if (resumo.streakAumentou && window.BriifCelebracao) {
        const dias = B.progresso.ler().dias || [];
        view = 'resultado'; render(); window.scrollTo({ top: 0 });
        window.BriifCelebracao.ofensiva({
          streak: resumo.streak, anterior: resumo.streak - 1, dias,
          aoFechar: () => sonsDoResultado()
        });
        return;
      }
    }
    view = 'resultado'; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
    sonsDoResultado();
  }

  /** Sons da tela de resultado: fanfarra da fase (maior se gabaritou), moedas e nível. */
  function sonsDoResultado() {
    if (!resumo) return;
    som(resumo.acertos === fase.exercicios.length ? 'perfeito' : 'concluir');
    if (resumo.moedas) setTimeout(() => som('moeda'), 900);
    if (resumo.subiu) setTimeout(() => som('nivel'), 1500);
  }

  /* ---------- 3. Resultado ---------- */
  function resultado() {
    const total = fase.exercicios.length;
    const perfeito = resumo.acertos === total;
    const prox = B.proximaFase(ti, fi);
    return `
      ${topo()}
      <div class="result">
        <div class="badge-big">${resumo.acertos}/${total}</div>
        <h1>${perfeito ? 'Perfeito!' : 'Fase concluída!'}</h1>
        <p class="sub">Você acertou ${resumo.acertos} de ${total} em “${esc(fase.titulo)}”.${resumo.primeiraVez ? '' : ' Como você já tinha concluído essa fase, foi uma revisão sem XP extra.'}</p>
        ${resumo.subiu ? `<div class="levelup">Você subiu para o nível ${resumo.nivelAntes + 1}! +${resumo.bloqueioGanho} ${resumo.bloqueioGanho > 1 ? 'bloqueios de ofensiva' : 'bloqueio de ofensiva'}</div>` : ''}
        <div class="rewards">
          <div class="reward"><b>+${resumo.xp}</b><span>XP</span></div>
          <div class="reward"><b>+${resumo.moedas}</b><span>MathCoins</span></div>
          <div class="reward ${resumo.streakAumentou ? 'fogo' : ''}"><b>${resumo.streak}</b><span>${resumo.streak === 1 ? 'dia de ofensiva' : 'dias de ofensiva'}</span></div>
        </div>
        <div class="actions">
          ${prox ? `<a class="btn btn-coral" href="licao.html?f=${encodeURIComponent(prox.fase.id)}">Próxima fase: ${esc(prox.fase.titulo)}</a>` : ''}
          <a class="btn btn-ink" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Voltar à trilha</a>
          <button class="btn btn-ink" id="refazer" type="button">Refazer exercícios</button>
        </div>
      </div>`;
  }
  function ligarResultado() {
    $('#refazer').addEventListener('click', () => { view = 'praticar'; q = 0; acertos = 0; respondida = null; finalizada = false; render(); window.scrollTo({ top: 0 }); });
  }

  /* ---------- render ---------- */
  function render() {
    if (view === 'aprender') { root.innerHTML = aprender(); ligarNav(); ligarAprender(); }
    else if (view === 'praticar') { root.innerHTML = praticar(); ligarNav(); ligarPraticar(); }
    else { root.innerHTML = resultado(); ligarNav(); ligarResultado(); }
  }
  render();
})();
