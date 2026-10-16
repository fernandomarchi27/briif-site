(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc, ICONS } = B;
  B.iniciar('perfil');

  const host = $('#perfil');
  const sessao = B.auth.sessao();
  const uidPublico = new URLSearchParams(location.search).get('u');
  const meuUid = sessao && sessao.modo === 'firebase' ? sessao.uid : null;
  const modoPublico = !!uidPublico && uidPublico !== meuUid;

  const pad = (n) => String(n).padStart(2, '0');
  const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth(); // 0-11

  function render() {
    const p = B.progresso.ler();
    const nome = sessao ? sessao.nome : 'Visitante';
    const pct = Math.min(100, Math.round((p.xp / p.xpProx) * 100));
    const diasSet = new Set(p.dias || []);
    const trilhasComConteudo = B.TRILHAS.filter((t) => t.fases.length > 0);
    const xpTotal = trilhasComConteudo.reduce((soma, t) => soma + t.fases.reduce((s, f) => s + (B.progresso.faseCompleta(p, f.id) ? f.xp : 0), 0), 0);

    const subjHtml = trilhasComConteudo.map((t) => {
      const feitas = t.fases.filter((f) => B.progresso.faseCompleta(p, f.id)).length;
      const pt = p.porTrilha[t.id];
      const acc = pt && pt.total ? Math.round((pt.acertos / pt.total) * 100) : null;
      const pctT = Math.round((feitas / t.fases.length) * 100);
      return `
        <div class="subj-card" style="--c:${t.cor}">
          <div class="subj-top">${B.trilhaIcon(t)}<b>${esc(t.nome)}</b></div>
          <div class="bar" role="progressbar" aria-valuenow="${pctT}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pctT}%"></i></div>
          <div class="subj-info"><span>${feitas} de ${t.fases.length} fases</span>${acc !== null ? `<span>${acc}% de acerto</span>` : '<span>Ainda não praticou</span>'}</div>
        </div>`;
    }).join('');

    host.innerHTML = `
      <div class="profile-head">
        ${B.avatarHtml(sessao || { nome })}
        <div class="info">
          <h1>${esc(nome)}</h1>
          <a class="btn btn-ink btn-sm" href="avatar.html" style="margin-top:10px">Editar meu avatar</a>
          <p>${esc(sessao ? (sessao.email || (sessao.tipo === 'anonimo' ? 'Conta de convidado' : '')) : 'Progresso salvo apenas neste navegador')}</p>
        </div>
        ${sessao ? `<button class="btn btn-ink btn-sm" id="logout-btn" type="button">Sair</button>` : ''}
        <div class="profile-stats">
          <div class="pstat"><b>${p.nivel}</b><span>Nível</span></div>
          <div class="pstat"><b>${p.moedas}</b><span>MathCoins</span></div>
          <div class="pstat"><b>${p.streak}</b><span>Ofensiva</span></div>
          <div class="pstat"><b>${p.recorde}</b><span>Recorde</span></div>
          <div class="pstat"><b>${p.bloqueios || 0}</b><span>Bloqueios</span></div>
        </div>
      </div>

      ${!sessao ? `<div class="notice" style="margin-bottom:24px">Você está vendo o progresso deste navegador sem conta. <a href="login.html">Entre</a> para não perder o progresso.</div>` : ''}

      <div class="block" style="margin-bottom:28px">
        <div class="bar-label"><span>Nível ${p.nivel}</span><span>${p.xp} de ${p.xpProx} XP para o nível ${p.nivel + 1}</span></div>
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
      </div>

      <h2 style="font-size:1.4rem;margin-bottom:14px">Seu desempenho por trilha</h2>
      <div class="subj-grid">${subjHtml || '<p style="color:var(--muted)">Você ainda não começou nenhuma trilha. <a href="trilhas.html">Comece agora</a>.</p>'}</div>

      <h2 style="font-size:1.4rem;margin:36px 0 14px">Calendário de ofensivas</h2>
      <div class="block cal-card">
        <div class="cal-stats">
          <span>${p.dias.length} ${p.dias.length === 1 ? 'dia estudado' : 'dias estudados'} ao todo</span>
          <span>${xpTotal} XP conquistados</span>
        </div>
        <div id="cal"></div>
      </div>`;

    desenharCalendario(diasSet);

    const sair = $('#logout-btn');
    if (sair) sair.addEventListener('click', async () => { await B.auth.sair(); location.href = 'index.html'; });
  }

  function desenharCalendario(diasSet) {
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const offset = new Date(ano, mes, 1).getDay();
    const hojeStr = hojeISO();
    const naoPodeAvancar = ano === hoje.getFullYear() && mes === hoje.getMonth();

    let celulas = '';
    for (let i = 0; i < offset; i++) celulas += '<span class="cal-cell vazio"></span>';
    for (let d = 1; d <= diasNoMes; d++) {
      const iso = `${ano}-${pad(mes + 1)}-${pad(d)}`;
      const feito = diasSet.has(iso);
      const ehHoje = iso === hojeStr;
      celulas += `<span class="cal-cell${feito ? ' feito' : ''}${ehHoje ? ' hoje' : ''}"><b>${d}</b>${feito ? ICONS.flame : ''}</span>`;
    }

    $('#cal').innerHTML = `
      <div class="cal-head">
        <button type="button" id="cal-prev" aria-label="Mês anterior">‹</button>
        <b>${MESES[mes]} de ${ano}</b>
        <button type="button" id="cal-next" aria-label="Próximo mês" ${naoPodeAvancar ? 'disabled' : ''}>›</button>
      </div>
      <div class="cal-dow"><span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span></div>
      <div class="cal-grid">${celulas}</div>`;

    $('#cal-prev').addEventListener('click', () => { mes -= 1; if (mes < 0) { mes = 11; ano -= 1; } desenharCalendario(diasSet); });
    const prox = $('#cal-next');
    prox.addEventListener('click', () => { if (naoPodeAvancar) return; mes += 1; if (mes > 11) { mes = 0; ano += 1; } desenharCalendario(diasSet); });
  }

  /* ---------- perfil de outra pessoa (vem do ranking: só dados públicos) ---------- */
  const num = (n) => (n || 0).toLocaleString('pt-BR');
  const dias = (n) => `${n || 0} ${(n || 0) === 1 ? 'dia' : 'dias'}`;
  function renderPublico(d) {
    const total = d.total || 0;
    const pct = total ? Math.round(((d.acertos || 0) / total) * 100) : null;
    host.innerHTML = `
      <a class="pub-voltar" href="ranking.html">← Voltar ao ranking</a>
      <div class="pub-head">
        ${B.ranking.avatar(d)}
        <div><h1>${esc(d.nome)}</h1><p>Nível ${d.nivel || 1} · aluno do Briiff</p></div>
      </div>
      <div class="pub-grid">
        <div class="pub-card"><span>Nível</span><b>${d.nivel || 1}</b></div>
        <div class="pub-card"><span>XP total</span><b>${num(d.xpTotal)}</b></div>
        <div class="pub-card"><span>Acertos</span><b>${pct === null ? '—' : pct + '%'}</b><small>${total ? `${num(d.acertos)} de ${num(total)} questões` : 'ainda sem questões'}</small></div>
        <div class="pub-card ${d.streak ? 'quente' : ''}"><span>Ofensiva atual</span><b>${dias(d.streak)}</b></div>
        <div class="pub-card"><span>Recorde de ofensiva</span><b>${dias(d.recorde)}</b></div>
      </div>
      <p style="color:var(--muted);font-size:13.5px">Só aparecem informações públicas do ranking. E-mail, foto e progresso detalhado não são compartilhados.</p>`;
  }
  async function carregarPublico() {
    host.innerHTML = '<div class="block rk-msg" style="margin-top:40px"><p>Carregando o perfil…</p></div>';
    try {
      await B.aguardarSync();
      const d = await B.ranking.perfil(uidPublico);
      if (!d) { host.innerHTML = '<a class="pub-voltar" href="ranking.html">← Voltar ao ranking</a><div class="block rk-msg" style="margin-top:20px"><h2>Perfil indisponível</h2><p>Essa pessoa não está no ranking (ou saiu dele), então não há perfil público para mostrar.</p></div>'; return; }
      renderPublico(d);
    } catch (e) {
      const semLogin = e && e.message === 'sem-login';
      host.innerHTML = `<a class="pub-voltar" href="ranking.html">← Voltar ao ranking</a><div class="block rk-msg" style="margin-top:20px"><h2>${semLogin ? 'Entre para ver perfis' : 'Não deu para carregar o perfil'}</h2><p>${semLogin ? 'Faça login para ver o perfil de outros alunos.' : 'Verifique sua conexão e tente de novo.'}</p>${semLogin ? '<a class="btn btn-coral btn-sm" href="login.html">Entrar</a>' : ''}</div>`;
    }
  }

  if (modoPublico) carregarPublico();
  else {
    render();
    B.aguardarSync().then((mudou) => { if (mudou) render(); });
  }
})();
