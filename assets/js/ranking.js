(function () {
  'use strict';
  const B = window.Briif;
  const { $, $$, esc, ICONS } = B;
  B.iniciar('ranking');

  const host = $('#ranking');
  const sessao = B.auth.sessao();
  const MIN_QUESTOES = 10;   // mínimo de questões respondidas para entrar no ranking de acertos
  const TOP = 50;

  // Cada categoria é só um jeito de ORDENAR a mesma lista; todas as estatísticas aparecem em toda linha.
  const pct = (d) => ((d.total || 0) > 0 ? (d.acertos || 0) / d.total : 0);
  const CATEGORIAS = {
    xp: {
      nome: 'XP', titulo: 'Ordenado por XP',
      ok: () => true,
      valor: (d) => d.xpTotal || 0,
      desempate: (d) => d.nivel || 1
    },
    acertos: {
      nome: '% de acertos', titulo: 'Ordenado por % de acertos',
      // quem respondeu menos que o mínimo vai para o fim da lista (um acerto isolado não vale 100%)
      ok: () => true,
      valor: (d) => ((d.total || 0) >= MIN_QUESTOES ? 1 + pct(d) : 0),
      desempate: (d) => d.total || 0
    },
    ofensiva: {
      nome: 'Ofensiva', titulo: 'Ordenado por recorde de ofensiva',
      ok: () => true,
      valor: (d) => d.recorde || 0,
      desempate: (d) => d.streak || 0
    }
  };

  let cat = 'xp';
  let dados = null;         // lista bruta do Firestore
  let erro = null;          // 'sem-login' | 'falha' | 'desativado'
  let carregando = true;

  const meuId = sessao && sessao.modo === 'firebase' ? sessao.uid : null;
  const convidado = !!(sessao && sessao.tipo === 'anonimo');

  function ordenar(c) {
    const C = CATEGORIAS[c];
    return (dados || []).filter((d) => !d.oculto && C.ok(d)).sort((a, b) =>
      (C.valor(b) - C.valor(a)) || (C.desempate(b) - C.desempate(a)) || String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
  }
  const posicao = (lista, uid) => { const i = lista.findIndex((d) => d.uid === uid); return i < 0 ? null : i + 1; };

  /* ---------- peças de tela ---------- */
  const num = (n) => (n || 0).toLocaleString('pt-BR');
  const diasTxt = (n) => `${n || 0} ${(n || 0) === 1 ? 'dia' : 'dias'}`;

  function linha(d, pos) {
    const eu = d.uid === meuId;
    const total = d.total || 0;
    const qualifica = total >= MIN_QUESTOES;
    const p = Math.round(pct(d) * 100);
    const streak = d.streak || 0;
    return `
      <li class="rk-row ${eu ? 'eu' : ''}">
        <a class="rk-link" href="perfil.html${eu ? '' : '?u=' + encodeURIComponent(d.uid)}" aria-label="Ver o perfil de ${esc(d.nome)}"></a>
        <span class="rk-pos ${pos <= 3 ? 'top' + pos : ''}">${pos}</span>
        ${B.ranking.avatar(d)}
        <div class="rk-nome"><b>${esc(d.nome)}${eu ? ' <em>você</em>' : ''}</b><span>Nível ${d.nivel || 1}</span></div>
        <dl class="rk-stats">
          <div class="rk-st ${cat === 'xp' ? 'ord' : ''}"><dt>XP</dt><dd>${num(d.xpTotal)}</dd></div>
          <div class="rk-st rk-acerto ${cat === 'acertos' ? 'ord' : ''}"><dt>Acertos</dt>
            <dd>${total ? p + '%' : '—'}</dd>
            <span class="rk-barra" aria-hidden="true"><i style="width:${total ? p : 0}%"></i></span>
            <small>${total ? `${num(d.acertos)} de ${num(total)}${qualifica ? '' : ' · poucas'}` : 'sem questões'}</small></div>
          <div class="rk-st ${streak ? 'quente' : ''}"><dt>Ofensiva</dt><dd><span class="rk-chama" aria-hidden="true">${ICONS.flame}</span>${diasTxt(streak)}</dd></div>
          <div class="rk-st ${cat === 'ofensiva' ? 'ord' : ''}"><dt>Recorde</dt><dd>${diasTxt(d.recorde)}</dd></div>
        </dl>
      </li>`;
  }

  function meusLugares() {
    if (!meuId || !dados) return '';
    const euDoc = dados.find((d) => d.uid === meuId);
    const cards = Object.keys(CATEGORIAS).map((k) => {
      const C = CATEGORIAS[k];
      const lista = ordenar(k);
      const pos = posicao(lista, meuId);
      let sub;
      if (pos && k === 'acertos' && euDoc && (euDoc.total || 0) < MIN_QUESTOES) sub = `Responda mais ${MIN_QUESTOES - (euDoc.total || 0)} questões para valer`;
      else if (pos) sub = `de ${lista.length} ${lista.length === 1 ? 'aluno' : 'alunos'}`;
      else sub = 'Ainda fora do ranking';
      return `<button type="button" class="rk-meu ${cat === k ? 'ativo' : ''}" data-cat="${k}">
        <span>${C.nome}</span><b>${pos ? '#' + pos : '—'}</b><small>${sub}</small></button>`;
    }).join('');
    return `<div class="rk-meus" aria-label="Sua posição">${cards}</div>`;
  }

  function corpo() {
    if (carregando) return `<div class="block rk-msg"><p>Carregando o ranking…</p></div>`;
    if (erro === 'desativado') return `<div class="block rk-msg"><h2>Ranking indisponível neste modo</h2><p>O ranking compara contas de verdade e precisa do banco de dados online (Firebase). Quando ele estiver configurado, todas as contas do Briiff aparecem aqui.</p></div>`;
    if (erro === 'sem-login') return `<div class="block rk-msg"><h2>Entre para ver o ranking</h2><p>Faça login (ou entre como convidado) para ver quem está no topo e a sua posição.</p><a class="btn btn-coral btn-sm" href="login.html">Entrar</a></div>`;
    if (erro) return `<div class="block rk-msg"><h2>Não deu para carregar o ranking</h2><p>Verifique sua conexão e as regras do Firestore (arquivo <code>firestore.rules</code> publicado). Tente de novo em instantes.</p><button class="btn btn-ink btn-sm" id="rk-tentar" type="button">Tentar de novo</button></div>`;

    const C = CATEGORIAS[cat];
    const lista = ordenar(cat);
    if (!lista.length) {
      return `<div class="block rk-msg"><h2>Ninguém no ranking ainda</h2><p>Conclua uma fase para aparecer aqui.</p></div>`;
    }
    const top = lista.slice(0, TOP);
    const minha = meuId ? posicao(lista, meuId) : null;
    const fora = minha && minha > TOP ? lista[minha - 1] : null;
    return `
      <h2 class="rk-sub">${C.titulo}</h2>
      <p class="rk-nota">${cat === 'acertos' ? `Quem respondeu menos de ${MIN_QUESTOES} questões fica no fim da lista, para um acerto isolado não valer 100%. ` : ''}${lista.length} ${lista.length === 1 ? 'aluno' : 'alunos'} no ranking.</p>
      <ol class="rk-lista">${top.map((d, i) => linha(d, i + 1)).join('')}</ol>
      ${fora ? `<div class="rk-reticencias">⋯</div><ol class="rk-lista" start="${minha}">${linha(fora, minha)}</ol>` : ''}`;
  }

  function privacidade() {
    if (!sessao) return '';
    if (convidado) return `<p class="rk-priv">Convidados não aparecem no ranking. <a href="login.html">Crie uma conta</a> para competir.</p>`;
    if (!meuId) return '';
    const oculto = B.ranking.oculto(meuId);
    return `<p class="rk-priv">${oculto ? 'Você está <b>fora</b> do ranking.' : 'Seu nome aparece abreviado (ex.: “Maria S.”), sem e-mail nem foto.'}
      <button class="linkbtn" id="rk-oculto" type="button">${oculto ? 'Voltar para o ranking' : 'Sair do ranking'}</button></p>`;
  }

  function render() {
    host.innerHTML = `
      <div class="page-top rk-top">
        <h1>Ranking</h1>
        <p class="rk-intro">Veja quem mais estuda no Briiff: XP, % de acerto e ofensiva (atual e recorde) de cada aluno.</p>
      </div>
      ${meusLugares()}
      <div class="pills rk-tabs" role="tablist" aria-label="Ordenar o ranking por">
        ${Object.keys(CATEGORIAS).map((k) => `<button type="button" class="pill" role="tab" data-cat="${k}" aria-selected="${cat === k}">${CATEGORIAS[k].nome}</button>`).join('')}
      </div>
      <div class="rk-corpo" aria-live="polite">${corpo()}</div>
      ${privacidade()}`;

    $$('[data-cat]', host).forEach((b) => b.addEventListener('click', () => {
      if (cat === b.dataset.cat) return;
      cat = b.dataset.cat;
      if (window.BriifSom) window.BriifSom.tocar('toque');
      render();
    }));
    const t = $('#rk-tentar'); if (t) t.addEventListener('click', carregar);
    const o = $('#rk-oculto');
    if (o) o.addEventListener('click', async () => {
      o.disabled = true;
      try { await B.ranking.alterarOculto(!B.ranking.oculto(meuId)); } catch (e) { console.warn('[Briif] ranking:', e && (e.code || e.message)); }
      carregar();
    });
  }

  async function carregar() {
    carregando = true; erro = null; render();
    try {
      await B.aguardarSync();   // garante que o seu último progresso já foi publicado
      dados = await B.ranking.buscar();
    } catch (e) {
      erro = e && e.message === 'firebase-desativado' ? 'desativado' : e && e.message === 'sem-login' ? 'sem-login' : 'falha';
      console.warn('[Briif] ranking:', e && (e.code || e.message));
    }
    carregando = false; render();
  }

  carregar();
})();
