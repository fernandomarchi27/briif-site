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
  const ehExtra = !!achou.extra;
  const aula = B.AULAS[ehExtra ? achou.origem : fase.id];
  document.title = `${fase.titulo} — Briiff`;

  let prog = B.progresso.ler();
  if (ehExtra && !B.progresso.faseDisponivel(prog, trilha, fi) && !B.progresso.faseCompleta(prog, fase.id)) {
    root.innerHTML = `<div class="block"><h2>Fase extra bloqueada</h2><p>As fases extras difíceis liberam depois que você vence a <b>Batalha final</b> de ${esc(trilha.nome)}.</p>
      <a class="btn btn-coral btn-sm" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Voltar à trilha</a></div>`;
    B.aguardarSync().then((mudou) => { if (mudou) location.reload(); });
    return;
  }
  if (!ehExtra && !B.progresso.faseDisponivel(prog, trilha, fi) && !B.progresso.faseCompleta(prog, fase.id)) {
    const ant = trilha.fases[fi - 1];
    root.innerHTML = `<div class="block"><h2>Essa fase ainda está bloqueada</h2><p>Conclua antes a fase <b>${esc(ant.titulo)}</b> para liberar esta.</p>
      <a class="btn btn-coral btn-sm" href="licao.html?f=${encodeURIComponent(ant.id)}">Ir para a fase anterior</a></div>`;
    // se o progresso veio da nuvem (outro aparelho), libera a fase quando a sincronização terminar
    B.aguardarSync().then((mudou) => { if (mudou) location.reload(); });
    return;
  }

  root.style.setProperty('--c', trilha.cor);
  root.style.setProperty('--on-c', trilha.on);

  let view = ehExtra ? 'praticar' : 'aprender';     // aprender | praticar | resultado
  let q = 0, acertos = 0, respondida = null, resumo = null, finalizada = false;
  // combo = maior sequência de acertos seguidos; tempo = do início da prática até o fim
  let combo = 0, melhorCombo = 0, inicioMs = Date.now(), duracaoMs = 0, animarPendente = false;
  // regra de aprovação: pelo menos 3 acertos (ou todos, se a fase tiver menos de 3 perguntas)
  const MIN_ACERTOS = ehExtra ? 1 : Math.min(3, fase.exercicios.length);   // extras difíceis (2 questões): basta 1 acerto
  // erros da rodada (índices dos exercícios) e estado da revisão opcional
  let respostas = [], respostasRegistradas = false;   // para o painel de desempenho (acerto por assunto)
  let quieto = false, erros = [], reprovado = false, rev = { i: 0, resp: null, certas: 0 }, revNota = null;
  let dicas = {}; // id do exercício -> 'aberta' | 'fechada' (dica de uso único)
  function reiniciarPratica() { respostas = []; respostasRegistradas = false; dicas = {}; q = 0; acertos = 0; respondida = null; finalizada = false; combo = 0; melhorCombo = 0; inicioMs = Date.now(); erros = []; reprovado = false; revNota = null; quieto = false; }

  const DIFF = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' };

  /* ---------- estrutura comum ---------- */
  function topo() {
    return `
      <div class="crumbs"><a href="trilhas.html?t=${encodeURIComponent(trilha.id)}">${esc(trilha.nome)}</a> / ${ehExtra ? 'Extra difícil' : 'Fase ' + fase.numero}</div>
      <span class="badge" style="--c:${trilha.cor}">${esc(trilha.nome)} · ${ehExtra ? 'Extra difícil' : 'Fase ' + fase.numero}</span>
      <h1>${esc(fase.titulo)}</h1>
      <div class="steps-nav" role="tablist">
        <button role="tab" data-v="aprender" aria-selected="${view === 'aprender'}">1. Aprender</button>
        <button role="tab" data-v="praticar" aria-selected="${view === 'praticar'}">2. Praticar</button>
        <button role="tab" data-v="resultado" aria-selected="${view === 'resultado'}" ${(finalizada || reprovado) ? '' : 'disabled'}>3. Resultado</button>
      </div>${avisoPersonalizada()}`;
  }
  /** Na trilha Personalizada o aluno pode começar sem ter visto o conteúdo: avisa o que é recomendado. */
  function avisoPersonalizada() {
    if (trilha.id !== 'personalizada' || !fase.materiasNomes || !fase.materiasNomes.length) return '';
    if (view === 'resultado' || view === 'revisao') return '';
    const n = fase.materiasNomes;
    const lista = n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0];
    return `<div class="pers-recomenda" role="note"><strong class="t">Antes de começar</strong><p>É recomendado que você já tenha feito as fases de <strong>${esc(lista)}</strong>, os conteúdos que esta fase mistura. Se ainda não fez, sem problema: você pode tentar, mas pode ser que algumas questões sejam novas para você.</p></div>`;
  }
  function ligarNav() {
    $$('.steps-nav button').forEach((b) => b.addEventListener('click', () => {
      if (b.disabled) return;
      if (b.dataset.v === 'praticar' && view !== 'praticar') { reiniciarPratica(); }
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
    $('#go-praticar').addEventListener('click', () => { view = 'praticar'; reiniciarPratica(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
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
        ${dicaHtml(ex)}
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
  function dicaHtml(ex) {
    if (!ex.dica) return '';
    const st = dicas[ex.id];
    if (st === 'aberta') return `<div class="dica-box" role="note"><small>Dica · só dá para ver uma vez</small><p>${esc(ex.dica)}</p><button class="btn btn-ink btn-sm" id="dica-fechar" type="button">Fechar dica</button></div>`;
    if (st === 'fechada') return `<div class="dica-bar"><span class="dica-usada">Dica já usada</span></div>`;
    if (respondida !== null) return '';
    return `<div class="dica-bar"><button class="dica-btn" id="dica-abrir" type="button">Pedir dica (1 uso)</button></div>`;
  }
  function ligarPraticar() {
    const ex = fase.exercicios[q];
    const ab = $('#dica-abrir'); if (ab) ab.addEventListener('click', () => { dicas[ex.id] = 'aberta'; render(); });
    const fe = $('#dica-fechar'); if (fe) fe.addEventListener('click', () => { dicas[ex.id] = 'fechada'; render(); });
    const responder = (k) => {
      if (respondida !== null) return;
      if (dicas[ex.id] === 'aberta') dicas[ex.id] = 'fechada';
      respondida = k;
      respostas.push({ id: ex.id, certa: k === ex.correta });
      if (respondida === ex.correta) { acertos++; combo++; if (combo > melhorCombo) melhorCombo = combo; } else { combo = 0; erros.push(q); }
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
    if (!respostasRegistradas) { respostasRegistradas = true; B.progresso.registrarRespostas(respostas); }
    // menos de 3 acertos: a fase NÃO é concluída, não dá XP e não conta a ofensiva do dia
    if (acertos < MIN_ACERTOS) {
      reprovado = true;
      finalizada = false;
      duracaoMs = Date.now() - inicioMs;
      animarPendente = true;
      view = 'resultado'; render(); window.scrollTo({ top: 0, behavior: 'smooth' });
      animarResultado();
      som('derrota');
      return;
    }
    if (!finalizada) {
      resumo = B.progresso.completarFase(fase.id, trilha.id, fase.xp, acertos, fase.exercicios.length);
      resumo.acertos = acertos;
      finalizada = true;
      duracaoMs = Date.now() - inicioMs;
      animarPendente = true;
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
    animarResultado();
    som(resumo.acertos === fase.exercicios.length ? 'perfeito' : 'concluir');
    if (resumo.moedas) setTimeout(() => som('moeda'), 900);
    if (resumo.subiu) setTimeout(() => som('nivel'), 1500);
  }

  /* ---------- 3. Resultado ---------- */
  const SVG_RAIO = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 2 4.5 13.5H11L9.8 22l9.7-12H13z"/></svg>';
  const SVG_ALVO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>';
  const SVG_TEMPO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13.5" r="8"/><path d="M12 9.5v4.2l2.6 1.6M9.5 2.5h5"/></svg>';

  function fmtStat(tipo, n) {
    n = Math.round(n);
    if (tipo === 'x') return 'x' + n;
    if (tipo === 'acertos') return n + '/' + fase.exercicios.length;
    if (tipo === 'tempo') return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
    return String(n);
  }

  function resultado() {
    const total = fase.exercicios.length;
    const perfeito = resumo.acertos === total;
    const prox = B.proximaFase(ti, fi);
    const titulo = perfeito ? 'Perfeito!' : (melhorCombo >= 5 ? 'Olha só esse combo!' : 'Fase concluída!');
    const seg = Math.round(duracaoMs / 1000);
    const pre = animarPendente;
    const stats = [
      { rot: 'Total de XP', ico: SVG_RAIO, n: resumo.xp, tipo: 'int', k: '#FFC800', kt: '#4A3600', kv: '#9A6B00' },
      { rot: 'Combo', ico: SVG_ALVO, n: melhorCombo, tipo: 'x', k: '#1CB0F6', kt: '#FFFFFF', kv: '#0A7FB8' },
      { rot: 'Tempo', ico: SVG_TEMPO, n: seg, tipo: 'tempo', k: '#14B8A6', kt: '#FFFFFF', kv: '#0F766E' }
    ];
    return `
      <div class="rs ${pre ? 'rs-pre' : ''} ${quieto ? 'rs-quieto' : ''}">
        <div class="rs-confete" aria-hidden="true"></div>
        <div class="rs-mago"><img src="assets/img/mago-feliz.svg" alt="Mago Roxo comemorando" width="250" height="292"></div>
        <h1>${titulo}</h1>
        <p class="sub">${perfeito ? `Você gabaritou “${esc(fase.titulo)}”: ${resumo.acertos} de ${total}!` : `Você acertou ${resumo.acertos} de ${total} em “${esc(fase.titulo)}”.`}</p>
        <div class="rs-cards">
          ${stats.map((s, i) => `
            <div class="rs-card" style="--i:${i};--k:${s.k};--kt:${s.kt};--kv:${s.kv}">
              <small>${s.rot}</small>
              <div class="rs-v">${s.ico}<b data-count="${s.n}" data-fmt="${s.tipo}">${fmtStat(s.tipo, pre ? 0 : s.n)}</b></div>
            </div>`).join('')}
        </div>
        <div class="rs-extras">
          ${resumo.primeiraVez && resumo.moedas ? `<span class="rs-pilula"><img src="assets/img/moeda.svg" alt="">+${resumo.moedas}</span>` : ''}
          ${resumo.streakAumentou ? `<span class="rs-pilula"><img src="assets/img/fogo.svg" alt="">Ofensiva de ${resumo.streak} ${resumo.streak === 1 ? 'dia' : 'dias'}</span>` : ''}
          ${resumo.subiu ? `<span class="rs-pilula nivel">Nível ${resumo.nivelAntes + 1}!${resumo.bloqueioGanho > 0 ? ` +${resumo.bloqueioGanho} ${resumo.bloqueioGanho > 1 ? 'bloqueios' : 'bloqueio'}` : ' (limite de bloqueios)'}</span>` : ''}
          ${resumo.primeiraVez ? '' : '<span class="rs-nota">Fase já concluída antes: XP e MathCoins só valem na primeira vez.</span>'}
          ${notaRevisao()}
        </div>
        <div class="actions">
          ${prox ? `<a class="btn btn-coral" href="licao.html?f=${encodeURIComponent(prox.fase.id)}">Próxima fase: ${esc(prox.fase.titulo)}</a>` : ''}
          <a class="btn btn-ink" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Voltar à trilha</a>
          <button class="btn btn-ink" id="refazer" type="button">Praticar de novo</button>
        </div>
        ${botaoRevisao()}
      </div>`;
  }
  function ligarResultado() {
    $('#refazer').addEventListener('click', () => { reiniciarPratica(); view = 'praticar'; render(); window.scrollTo({ top: 0 }); });
    ligarRevisaoBtn();
    const rever = $('#rever');
    if (rever) rever.addEventListener('click', () => { view = 'aprender'; render(); window.scrollTo({ top: 0 }); });
  }

  /* ---------- 3b. Não passou (menos de 3 acertos) ---------- */
  function reprovadoTela() {
    const total = fase.exercicios.length;
    const seg = Math.round(duracaoMs / 1000);
    const pre = animarPendente;
    const falta = MIN_ACERTOS - acertos;
    const titulo = falta === 1 ? 'Quase lá!' : 'Vamos tentar de novo!';
    const stats = [
      { rot: 'Acertos', ico: SVG_ALVO, n: acertos, tipo: 'acertos', k: '#FF4B4B', kt: '#FFFFFF', kv: '#C23030' },
      { rot: 'Combo', ico: SVG_ALVO, n: melhorCombo, tipo: 'x', k: '#1CB0F6', kt: '#FFFFFF', kv: '#0A7FB8' },
      { rot: 'Tempo', ico: SVG_TEMPO, n: seg, tipo: 'tempo', k: '#14B8A6', kt: '#FFFFFF', kv: '#0F766E' }
    ];
    return `
      <div class="rs rs-falha ${pre ? 'rs-pre' : ''} ${quieto ? 'rs-quieto' : ''}">
        <div class="rs-mago triste"><img src="assets/img/mago-triste.svg" alt="Mago Roxo desanimado" width="250" height="292"></div>
        <h1>${titulo}</h1>
        <p class="sub">Você acertou ${acertos} de ${total} em “${esc(fase.titulo)}”.</p>
        <p class="rs-regra">Para concluir a fase e contar a ofensiva de hoje, é preciso acertar <b>pelo menos ${MIN_ACERTOS}</b>. ${falta === 1 ? 'Faltou só 1 acerto!' : `Faltaram ${falta} acertos.`}</p>
        <div class="rs-cards">
          ${stats.map((s, i) => `
            <div class="rs-card" style="--i:${i};--k:${s.k};--kt:${s.kt};--kv:${s.kv}">
              <small>${s.rot}</small>
              <div class="rs-v">${s.ico}<b data-count="${s.n}" data-fmt="${s.tipo}">${fmtStat(s.tipo, pre ? 0 : s.n)}</b></div>
            </div>`).join('')}
        </div>
        <div class="rs-extras">
          <span class="rs-aviso"><img src="assets/img/fogo.svg" alt="" style="filter:grayscale(1)">A ofensiva de hoje só conta quando você passa na fase.</span>
          ${notaRevisao()}
        </div>
        <div class="actions">
          <button class="btn btn-coral" id="refazer" type="button">Tentar de novo</button>
          <button class="btn btn-ink" id="rever" type="button">Rever a explicação</button>
          <a class="btn btn-ink" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Voltar à trilha</a>
        </div>
        ${botaoRevisao()}
      </div>`;
  }

  /* ---------- 4. Revisão dos erros (opcional) ---------- */
  function botaoRevisao() {
    if (!erros.length) return '';
    const n = erros.length;
    return `<div class="rv-oferta">
      <button class="rv-btn" id="revisar" type="button">
        <b>Revisar ${n === 1 ? 'o exercício que errei' : 'os ' + n + ' exercícios que errei'}</b>
        <span>Opcional · refaça com uma explicação mais detalhada</span>
      </button>
    </div>`;
  }
  function notaRevisao() {
    return revNota ? `<span class="rs-nota">Revisão feita: você acertou ${revNota.certas} de ${revNota.total} dos exercícios que tinha errado.</span>` : '';
  }
  function ligarRevisaoBtn() {
    const b = $('#revisar');
    if (b) b.addEventListener('click', () => { rev = { i: 0, resp: null, certas: 0 }; view = 'revisao'; render(); window.scrollTo({ top: 0 }); });
  }
  /** Texto com quebras de linha vira parágrafos; a linha "Cuidado:" ganha destaque. */
  function detalheHtml(txt) {
    return String(txt || '').split('\n').filter(Boolean).map((l) => /^Cuidado:/.test(l)
      ? `<p class="rv-cuidado"><b>Cuidado</b>${esc(l.replace(/^Cuidado:\s*/, ''))}</p>`
      : `<p>${esc(l)}</p>`).join('');
  }
  function revisao() {
    const total = erros.length;
    const ex = fase.exercicios[erros[rev.i]];
    const letras = ['A', 'B', 'C', 'D', 'E'];
    const pct = Math.round((rev.i / total) * 100);
    let fb = '';
    if (rev.resp !== null) {
      const ok = rev.resp === ex.correta;
      fb = `<div class="feedback ${ok ? 'ok' : 'no'}" role="status">
          <b>${ok ? 'Agora sim!' : 'Ainda não. A resposta certa é ' + esc(ex.opcoes[ex.correta]) + '.'}</b>
          <div class="rv-detalhe"><small>Explicação detalhada</small>${detalheHtml(ex.detalhe || ex.explicacao)}</div>
          <details class="rv-metodo"><summary>Rever o método desta fase</summary>
            <ol>${aula.passos.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
            <p class="rv-cuidado"><b>Erro comum</b>${esc(aula.erro)}</p>
          </details>
        </div>
        <div class="q-actions"><button class="btn btn-coral btn-sm" id="rv-prox" type="button">${rev.i + 1 < total ? 'Próximo erro' : 'Concluir revisão'} ${ICONS.arrow}</button></div>`;
    }
    return `
      <div class="crumbs"><a href="trilhas.html?t=${encodeURIComponent(trilha.id)}">${esc(trilha.nome)}</a> / Fase ${fase.numero}</div>
      <span class="badge" style="--c:${trilha.cor}">Revisão dos erros</span>
      <h1>${esc(fase.titulo)}</h1>
      <p class="rv-intro">Sem pressa e sem valer nada: esta revisão não muda seu XP nem sua ofensiva. É só para entender cada erro.</p>
      <div class="quiz-top">
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
        <span class="count">Erro ${rev.i + 1} de ${total}</span>
      </div>
      <div class="q-card">
        <div class="diff">Dificuldade: ${DIFF[ex.dificuldade] || 'Média'}</div>
        <h2>${esc(ex.pergunta)}</h2>
        <div class="q-options">
          ${ex.opcoes.map((o, k) => {
            let cls = '';
            if (rev.resp !== null) { if (k === ex.correta) cls = 'right'; else if (k === rev.resp) cls = 'wrong'; }
            return `<button class="opt ${cls}" data-k="${k}" type="button" ${rev.resp !== null ? 'disabled' : ''}><b style="color:var(--faint);margin-right:10px">${letras[k]}</b>${esc(o)}</button>`;
          }).join('')}
        </div>
        ${fb}
      </div>
      <div class="actions" style="margin-top:18px"><button class="linkbtn" id="rv-sair" type="button">Sair da revisão</button></div>`;
  }
  function ligarRevisao() {
    const ex = fase.exercicios[erros[rev.i]];
    $$('.q-options .opt').forEach((b) => b.addEventListener('click', () => {
      if (rev.resp !== null) return;
      rev.resp = Number(b.dataset.k);
      if (rev.resp === ex.correta) rev.certas++;
      som(rev.resp === ex.correta ? 'acerto' : 'erro');
      render();
      const f = $('.feedback'); if (f) f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }));
    const voltar = () => { view = 'resultado'; animarPendente = false; quieto = true; render(); window.scrollTo({ top: 0 }); };
    const prox = $('#rv-prox');
    if (prox) prox.addEventListener('click', () => {
      if (rev.i + 1 < erros.length) { som('avancar'); rev.i++; rev.resp = null; render(); window.scrollTo({ top: 0 }); }
      else { revNota = { certas: rev.certas, total: erros.length }; som('concluir'); voltar(); }
    });
    $('#rv-sair').addEventListener('click', voltar);
  }

  /** Dispara as animações da tela de resultado: números subindo e confete. */
  function animarResultado() {
    if (!animarPendente) return;
    animarPendente = false;
    const el = $('.rs');
    if (!el) return;
    el.classList.remove('rs-pre');
    const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$('[data-count]', el).forEach((b, i) => {
      const alvo = Number(b.dataset.count), tipo = b.dataset.fmt;
      if (reduzido) { b.textContent = fmtStat(tipo, alvo); return; }
      const ini = performance.now() + 650 + i * 160, dur = 1000;
      const passo = (agora) => {
        const t = Math.min(1, Math.max(0, (agora - ini) / dur));
        b.textContent = fmtStat(tipo, alvo * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
    if (!reduzido && !reprovado) confete($('.rs-confete', el), resumo.acertos === fase.exercicios.length ? 80 : 52);
  }

  function confete(host, n) {
    if (!host) return;
    const cores = [trilha.cor, '#FFD66B', '#FFFFFF', '#B9A8FF', '#FF9600'];
    let html = '';
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI * (0.05 + Math.random() * 0.9);
      const dist = 180 + Math.random() * 330;
      const x = Math.cos(ang) * dist, y = Math.sin(ang) * dist + 260;
      html += `<i style="--w:${6 + Math.random() * 7}px;--cc:${cores[i % cores.length]};--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--rot:${Math.round((Math.random() - .5) * 1400)}deg;--d:${(Math.random() * .35).toFixed(2)}s;${Math.random() < .25 ? '--rd:50%;' : ''}"></i>`;
    }
    host.innerHTML = html;
  }

  /* ---------- render ---------- */
  function render() {
    if (view === 'aprender') { root.innerHTML = aprender(); ligarNav(); ligarAprender(); }
    else if (view === 'praticar') { root.innerHTML = praticar(); ligarNav(); ligarPraticar(); }
    else if (view === 'revisao') { root.innerHTML = revisao(); ligarRevisao(); }
    else { root.innerHTML = reprovado ? reprovadoTela() : resultado(); ligarResultado(); }
  }
  render();
})();
