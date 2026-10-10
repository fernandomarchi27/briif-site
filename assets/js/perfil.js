(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc, ICONS } = B;
  B.iniciar('perfil');

  const host = $('#perfil');
  const sessao = B.auth.sessao();

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

  render();
  B.aguardarSync().then((mudou) => { if (mudou) render(); });
})();
