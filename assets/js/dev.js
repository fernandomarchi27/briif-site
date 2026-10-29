/* ==========================================================================
   Painel do modo desenvolvedor (só teste local; carregado por tema.js quando a sessão é "dev").
   Mexe apenas no progresso LOCAL da sessão "dev-local" (nada vai ao Firebase, nada aparece no ranking).
   Serve para criar os estados que normalmente levariam horas: saldo, combustível, ofensiva, XP, fases e chefes.
   ========================================================================== */
(function () {
  'use strict';
  const iniciar = () => {
    const B = window.Briif;
    if (!B || !B.dev || !B.dev.ativo() || !B.dev.permitido()) return;
    if (document.getElementById('dev-painel')) return;
    const chave = 'briif:progress:' + B.dev.uid;
    const ler = () => B.progresso.ler();
    const gravar = (p) => { try { localStorage.setItem(chave, JSON.stringify(p)); } catch (e) { /* ignora */ } };
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const diasAtras = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
    const esc = B.esc;

    const acoes = {
      'moedas+100': (p) => { p.moedas += 100; p.moedasGanhas += 100; },
      'moedas+500': (p) => { p.moedas += 500; p.moedasGanhas += 500; },
      'moedas=50': (p) => { p.moedasGastas = Math.max(0, p.moedasGanhas - 50); p.moedas = 50; },      // saldo insuficiente
      'moedas=0': (p) => { p.moedasGastas = p.moedasGanhas; p.moedas = 0; },
      'comb+1': (p) => { if ((p.bloqueios || 0) < B.loja.maxBloqueios) { p.bloqueios += 1; p.bloqueiosGanhos += 1; } },
      'comb=0': (p) => { p.bloqueiosUsados = p.bloqueiosGanhos; p.bloqueios = 0; },
      'streak-on': (p) => { p.streak = Math.max(p.streak, 5); p.recorde = Math.max(p.recorde, p.streak); p.ultimoDia = diasAtras(0); p.dias = (p.dias || []).filter((d) => d !== diasAtras(0)).concat(diasAtras(0)); },
      'streak-off': (p) => { p.streak = 0; p.ultimoDia = null; p.dias = []; },
      'perde1': (p) => { p.ultimoDia = diasAtras(2); },      // 1 dia sem estudar: gasta 1 combustível (se tiver)
      'perde3': (p) => { p.ultimoDia = diasAtras(4); },      // 3 dias sem estudar
      'xp+100': (p) => { p.xp += 100; },
      'fases-zerar': (p) => { p.fases = []; p.bosses = []; },
      'avatar-zerar': (p) => { p.avatarPecas = []; p.avatares = []; p.avatarAtivo = null; p.avatarCfg = null; }
    };
    const aplicar = (id, extra) => {
      let p = ler();
      if (id === 'resetar') p = B.dev.semear();
      else if (id === 'trilha-concluir') { const t = B.TRILHAS.find((x) => x.id === extra); if (t) p.fases = Array.from(new Set((p.fases || []).concat(t.fases.map((f) => f.id)))); }
      else if (id === 'boss-vencido') p.bosses = Array.from(new Set((p.bosses || []).concat(extra)));
      else if (id === 'boss-pendente') p.bosses = (p.bosses || []).filter((x) => x !== extra);
      else if (acoes[id]) acoes[id](p);
      if (id !== 'resetar') gravar(p);
      location.reload();
    };

    const trilhasOpt = B.TRILHAS.filter((t) => t.fases && t.fases.length).map((t) => `<option value="${esc(t.id)}">${esc(t.nome)}</option>`).join('');
    const btn = (id, rotulo) => `<button type="button" class="dev-b" data-a="${id}">${rotulo}</button>`;
    const box = document.createElement('div');
    box.id = 'dev-painel';
    box.innerHTML = `
      <button type="button" class="dev-fab" id="dev-abrir" aria-expanded="false" aria-controls="dev-corpo">DEV</button>
      <div class="dev-corpo" id="dev-corpo" role="dialog" aria-label="Ferramentas do modo desenvolvedor" hidden>
        <p class="dev-aviso"><b>Modo desenvolvedor</b>: dados só neste navegador, fora do ranking e do banco. Trilhas, fases e batalhas já estão liberadas.</p>
        <h3>Moedas</h3><div class="dev-g">${btn('moedas+100', '+100')}${btn('moedas+500', '+500')}${btn('moedas=50', 'Ficar com 50')}${btn('moedas=0', 'Zerar')}</div>
        <h3>Combustível</h3><div class="dev-g">${btn('comb+1', '+1')}${btn('comb=0', 'Zerar')}</div>
        <h3>Ofensiva</h3><div class="dev-g">${btn('streak-on', 'Ativa (hoje)')}${btn('streak-off', 'Inativa')}${btn('perde1', 'Perder 1 dia')}${btn('perde3', 'Perder 3 dias')}</div>
        <h3>XP e progresso</h3><div class="dev-g">${btn('xp+100', '+100 XP')}${btn('fases-zerar', 'Zerar fases e chefes')}${btn('avatar-zerar', 'Zerar compras de avatar')}</div>
        <h3>Trilha</h3>
        <div class="dev-g"><select id="dev-trilha" aria-label="Trilha">${trilhasOpt}</select></div>
        <div class="dev-g">${btn('trilha-concluir', 'Concluir fases')}${btn('boss-vencido', 'Chefe vencido')}${btn('boss-pendente', 'Chefe pendente')}</div>
        <div class="dev-g dev-fim">${btn('resetar', 'Recomeçar estado de teste')}<button type="button" class="dev-b dev-sair" id="dev-sair">Sair do modo</button></div>
      </div>`;
    document.body.appendChild(box);
    const abrir = $ => { const c = document.getElementById('dev-corpo'), a = document.getElementById('dev-abrir'); const v = c.hidden; c.hidden = !v; a.setAttribute('aria-expanded', String(v)); };
    document.getElementById('dev-abrir').addEventListener('click', abrir);
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const sel = document.getElementById('dev-trilha');
      aplicar(b.dataset.a, sel ? sel.value : null);
    });
    document.getElementById('dev-sair').addEventListener('click', async () => { await B.auth.sair(); location.href = 'login.html'; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !document.getElementById('dev-corpo').hidden) abrir(); });
  };
  if (window.Briif) iniciar(); else window.addEventListener('load', iniciar);
})();
