(function () {
  'use strict';
  const B = window.Briif;
  const { $, $$, esc, ICONS } = B;
  B.iniciar('ranking');

  const host = $('#ranking');
  const sessao = B.auth.sessao();
  const MIN_QUESTOES = 10;   // mínimo de questões respondidas para entrar no ranking de acertos
  const TOP = 50;

  const CATEGORIAS = {
    xp: {
      nome: 'XP', titulo: 'Mais XP',
      ok: () => true,
      valor: (d) => d.xpTotal || 0,
      desempate: (d) => d.nivel || 1,
      principal: (d) => `${(d.xpTotal || 0).toLocaleString('pt-BR')} <small>XP</small>`,
      detalhe: (d) => `Nível ${d.nivel || 1}`
    },
    acertos: {
      nome: 'Acertos', titulo: 'Maior % de acertos',
      ok: (d) => (d.total || 0) >= MIN_QUESTOES,
      valor: (d) => (d.acertos || 0) / (d.total || 1),
      desempate: (d) => d.total || 0,
      principal: (d) => `${Math.round(((d.acertos || 0) / (d.total || 1)) * 100)}<small>%</small>`,
      detalhe: (d) => `${d.acertos || 0} de ${d.total || 0} questões`
    },
    ofensiva: {
      nome: 'Ofensiva', titulo: 'Maiores ofensivas',
      ok: (d) => (d.recorde || 0) > 0,
      valor: (d) => d.recorde || 0,
      desempate: (d) => d.streak || 0,
      principal: (d) => `${d.recorde || 0} <small>${(d.recorde || 0) === 1 ? 'dia' : 'dias'}</small>`,
      detalhe: (d) => (d.streak ? `Ofensiva atual: ${d.streak}` : 'Sem ofensiva agora')
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
  function linha(d, pos, C) {
    const eu = d.uid === meuId;
    return `
      <li class="rk-row ${eu ? 'eu' : ''}">
        <span class="rk-pos ${pos <= 3 ? 'top' + pos : ''}">${pos}</span>
        ${B.ranking.avatar(d)}
        <div class="rk-nome"><b>${esc(d.nome)}${eu ? ' <em>você</em>' : ''}</b><span>${C.detalhe(d)}</span></div>
        <div class="rk-val">${C.principal(d)}</div>
      </li>`;
  }

  function podio(lista, C) {
    const ordem = [1, 0, 2];   // 2º, 1º, 3º (o 1º no meio)
    return `<div class="rk-podio">${ordem.map((i) => {
      const d = lista[i];
      if (!d) return `<div class="rk-pod vazio p${i + 1}"></div>`;
      const eu = d.uid === meuId;
      return `
        <div class="rk-pod p${i + 1} ${eu ? 'eu' : ''}">
          ${i === 0 ? '<span class="rk-coroa" aria-hidden="true">' + ICONS.flame + '</span>' : ''}
          ${B.ranking.avatar(d, 'lg')}
          <b class="rk-pn">${esc(d.nome)}</b>
          <span class="rk-pv">${C.principal(d)}</span>
          <span class="rk-base"><i>${i + 1}</i></span>
        </div>`;
    }).join('')}</div>`;
  }

  function meusLugares() {
    if (!meuId || !dados) return '';
    const euDoc = dados.find((d) => d.uid === meuId);
    const cards = Object.keys(CATEGORIAS).map((k) => {
      const C = CATEGORIAS[k];
      const lista = ordenar(k);
      const pos = posicao(lista, meuId);
      let sub;
      if (pos) sub = `de ${lista.length} ${lista.length === 1 ? 'aluno' : 'alunos'}`;
      else if (k === 'acertos' && euDoc && !euDoc.oculto) sub = `Responda ${Math.max(1, MIN_QUESTOES - (euDoc.total || 0))} questões para entrar`;
      else if (k === 'ofensiva') sub = 'Conclua uma fase para começar';
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
      return `<div class="block rk-msg"><h2>Ninguém no ranking de ${C.nome.toLowerCase()} ainda</h2><p>${cat === 'acertos' ? `É preciso ter respondido pelo menos ${MIN_QUESTOES} questões.` : 'Conclua uma fase para aparecer aqui.'}</p></div>`;
    }
    const top = lista.slice(0, TOP);
    const minha = meuId ? posicao(lista, meuId) : null;
    const fora = minha && minha > TOP ? lista[minha - 1] : null;
    return `
      <h2 class="rk-sub">${C.titulo}</h2>
      ${cat === 'acertos' ? `<p class="rk-nota">Só entra quem respondeu ao menos ${MIN_QUESTOES} questões, para um acerto isolado não valer 100%.</p>` : ''}
      ${podio(top, C)}
      <ol class="rk-lista" start="${top.length > 3 ? 4 : 1}">${top.slice(3).map((d, i) => linha(d, i + 4, C)).join('')}</ol>
      ${fora ? `<div class="rk-reticencias">⋯</div><ol class="rk-lista" start="${minha}">${linha(fora, minha, C)}</ol>` : ''}`;
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
        <p class="rk-intro">Veja quem mais estuda no Briiff: XP, porcentagem de acertos e maiores ofensivas.</p>
      </div>
      ${meusLugares()}
      <div class="pills rk-tabs" role="tablist" aria-label="Categorias do ranking">
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
