(function () {
  'use strict';
  const B = window.Briif;
  const { $, $$, esc, ICONS } = B;
  B.iniciar('trilhas');

  const params = new URLSearchParams(location.search);
  let atual = Math.max(0, B.TRILHAS.findIndex((t) => t.id === params.get('t')));

  let p = B.progresso.ler();
  const sessao = B.auth.sessao();

  /* ---------- painel lateral ---------- */
  function painel() {
    const nome = sessao ? sessao.nome.split(' ')[0] : 'Visitante';
    const pct = Math.min(100, Math.round((p.xp / p.xpProx) * 100));
    const ativ = B.progresso.proximaAtividade(p);

    let html = `
      <div class="panel">
        <div class="row">
          ${B.avatarHtml(sessao || { nome }, 'lg')}
          <div>
            <div class="hello">Olá, ${esc(nome)}!</div>
            <div class="lvl">Nível ${p.nivel}</div>
          </div>
          <div class="counters">
            <span class="chip fire ${B.progresso.ofensivaFeitaHoje(p) ? 'on' : ''}" title="Ofensiva">${ICONS.flame}${p.streak}</span>
            <a class="chip coin" href="loja.html" title="MathCoins — abrir a loja">${ICONS.coin}${p.moedas}</a>
          </div>
        </div>
        <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="XP do nível"><i style="width:${pct}%"></i></div>
        <div class="bar-label"><span>${p.xp} XP</span><span>${p.xpProx} XP para o nível ${p.nivel + 1}</span></div>
      </div>`;

    if (ativ) {
      html += `
        <a class="continue" style="--c:${ativ.trilha.cor};--on-c:${ativ.trilha.on}" href="licao.html?f=${encodeURIComponent(ativ.fase.id)}">
          <small>Continue de onde parou · ${esc(ativ.trilha.nome)}</small>
          <h3>Fase ${ativ.fase.numero}: ${esc(ativ.fase.titulo)}</h3>
          <div class="mini-bar"><i style="width:${Math.round((ativ.feitas / ativ.total) * 100)}%"></i></div>
          <span class="go">${ativ.feitas} de ${ativ.total} fases &nbsp;→</span>
        </a>`;
    } else {
      html += `<div class="panel row"><span style="color:var(--indigo);width:28px">${ICONS.check}</span><b style="font-size:14px">Você concluiu todo o conteúdo disponível até aqui!</b></div>`;
    }

    if (!sessao) {
      html += `<div class="notice">Você está estudando sem conta. <a href="login.html">Entre</a> para não perder o progresso ao trocar de navegador.</div>`;
    }
    html += `<a class="ver-perfil" href="perfil.html">Ver estatísticas completas →</a>`;
    $('#side').innerHTML = html;
  }

  /* ---------- seletor de matérias ---------- */
  function pills() {
    $('#pills').innerHTML = B.TRILHAS.map((t, i) => `
      <button class="pill" role="tab" style="--c:${t.cor};--on-c:${t.on}" aria-selected="${i === atual}" data-i="${i}">
        ${B.trilhaIcon(t)}${esc(t.nome)}
      </button>`).join('');
    $$('#pills .pill').forEach((b) => b.addEventListener('click', () => {
      atual = Number(b.dataset.i);
      editandoPersonalizada = false;
      const url = new URL(location.href); url.searchParams.set('t', B.TRILHAS[atual].id);
      history.replaceState(null, '', url);
      pills(); trilha();
    }));
  }

  /* ---------- trilha em zigue-zague ---------- */
  const POS = ['l', 'c', 'r', 'c'];         // esquerda, centro, direita, centro
  const CX = { l: 75, c: 150, r: 225 };      // centro de cada nó (largura 300)

  function conector(de, para, ativo, cor) {
    const x1 = CX[de], x2 = CX[para];
    const d = `M ${x1} 0 C ${x1} 17, ${x2} 17, ${x2} 34`;
    return `<svg class="connector" viewBox="0 0 300 34" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}" fill="none" style="stroke:${ativo ? cor : 'var(--line-strong)'}" stroke-width="4" stroke-linecap="round" ${ativo ? '' : 'stroke-dasharray="2 9"'} vector-effect="non-scaling-stroke"/></svg>`;
  }

  /** Monta o caminho em zigue-zague de uma trilha (comum às fixas e à Personalizada). */
  function caminhoHtml(t) {
    let html = '';
    t.fases.forEach((f, i) => {
      const completa = B.progresso.faseCompleta(p, f.id);
      const anterior = i === 0 || B.progresso.faseCompleta(p, t.fases[i - 1].id);
      const disponivel = anterior && !completa;
      const bloqueada = !anterior && !completa;
      const pos = POS[i % POS.length];

      if (i > 0) html += conector(POS[(i - 1) % POS.length], pos, anterior, t.cor);

      const estado = completa ? 'completa' : disponivel ? 'available' : 'locked';
      const conteudo = completa ? ICONS.check : bloqueada ? ICONS.lock : String(f.numero);
      const rotulo = completa ? 'concluída' : disponivel ? 'disponível' : 'bloqueada';
      const tag = bloqueada ? 'div' : 'a';
      const href = bloqueada ? '' : `href="licao.html?f=${encodeURIComponent(f.id)}"`;
      // na Personalizada, o rótulo mostra quais matérias essa fase mistura
      const rotuloTitulo = f.materiasNomes ? f.materiasNomes.join(' + ') : f.titulo;

      html += `
        <div class="path-row ${pos}">
          <${tag} class="node-wrap" ${href} ${bloqueada ? 'aria-disabled="true"' : ''} aria-label="Fase ${f.numero}: ${esc(rotuloTitulo)} (${rotulo})">
            <span class="node-btn ${estado}" style="--c:${t.cor};--on-c:${t.on}">${conteudo}</span>
            <span class="node-label">${esc(rotuloTitulo)}<small>${bloqueada ? 'Conclua a anterior' : completa ? 'Revisar' : 'Começar'}</small></span>
          </${tag}>
        </div>`;
    });
    // batalha final: depois da última fase de toda trilha
    if (t.fases.length) {
      const ult = t.fases[t.fases.length - 1];
      const liberado = B.boss.disponivel(p, t);
      const vencido = B.boss.derrotado(p, t.id);
      const posB = POS[t.fases.length % POS.length];
      html += conector(POS[(t.fases.length - 1) % POS.length], posB, B.progresso.faseCompleta(p, ult.id), t.cor);
      const estadoB = vencido ? 'derrotado' : liberado ? 'available' : 'locked';
      const rotB = vencido ? 'derrotado' : liberado ? 'disponível' : 'bloqueado';
      const tagB = liberado ? 'a' : 'div';
      const hrefB = liberado ? `href="boss.html?t=${encodeURIComponent(t.id)}"` : '';
      html += `
        <div class="path-row ${posB}">
          <${tagB} class="node-wrap boss-wrap" ${hrefB} ${liberado ? '' : 'aria-disabled="true"'} aria-label="Batalha final contra o Mago Roxo (${rotB})">
            <span class="node-btn boss-node ${estadoB}" style="--c:${t.cor};--on-c:${t.on}">${B.avatares.lista[0].svg}${vencido ? `<i class="boss-check">${ICONS.check}</i>` : liberado ? '' : `<i class="boss-lock">${ICONS.lock}</i>`}</span>
            <span class="node-label">Batalha final<small>${vencido ? 'Lutar de novo' : liberado ? 'Enfrentar o Mago Roxo' : 'Conclua todas as fases'}</small></span>
          </${tagB}>
        </div>`;
    }
    return html;
  }

  /* ---------- trilha Personalizada: escolher matérias ---------- */
  let editandoPersonalizada = false;
  let selecaoTemp = [];

  function painelConfigPersonalizada() {
    const min = B.personalizada.minimo;
    const opts = B.personalizada.opcoes.map((m) => `
      <label class="pers-op" style="--c:${m.cor}">
        <input type="checkbox" value="${m.id}" ${selecaoTemp.indexOf(m.id) !== -1 ? 'checked' : ''}>
        <span class="dot"></span> ${esc(m.nome)}
      </label>`).join('');
    return `
      <div class="panel pers-config">
        <b>Monte a sua trilha</b>
        <p>Escolha pelo menos ${min} matérias. As questões de cada fase vêm misturadas entre elas.</p>
        <div class="pers-opts">${opts}</div>
        <p class="pers-aviso" id="pers-aviso" hidden>Escolha pelo menos ${min} matérias.</p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn btn-coral btn-sm" id="pers-salvar" type="button">Salvar e montar trilha</button>
          ${editandoPersonalizada && B.personalizada.materiasAtuais().length >= min ? '<button class="btn btn-ink btn-sm" id="pers-cancelar" type="button">Cancelar</button>' : ''}
        </div>
      </div>`;
  }
  function ligarConfigPersonalizada() {
    $$('.pers-op input').forEach((cb) => cb.addEventListener('change', () => {
      selecaoTemp = $$('.pers-op input:checked').map((c) => c.value);
      $('#pers-aviso').hidden = true;
    }));
    $('#pers-salvar').addEventListener('click', () => {
      if (selecaoTemp.length < B.personalizada.minimo) { $('#pers-aviso').hidden = false; return; }
      const mudou = B.personalizada.salvar(selecaoTemp);
      if (mudou) p = B.progresso.ler();
      editandoPersonalizada = false;
      painel(); trilha();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const cancelar = $('#pers-cancelar');
    if (cancelar) cancelar.addEventListener('click', () => { editandoPersonalizada = false; trilha(); });
  }

  function trilhaPersonalizada(t) {
    const configurada = t.materias.length >= B.personalizada.minimo;
    selecaoTemp = t.materias.slice();

    $('#trail-title').textContent = 'Personalizada';
    $('#trail-title').style.setProperty('--c', t.cor);

    if (configurada) {
      const nomes = t.materias.map((id) => B.personalizada.opcoes.find((o) => o.id === id).nome).join(', ');
      const feitas = t.fases.filter((f) => B.progresso.faseCompleta(p, f.id)).length;
      $('#trail-sub').textContent = `Misturando ${nomes} · ${feitas} de ${t.fases.length} fases concluídas`;
    } else {
      $('#trail-sub').textContent = 'Escolha as matérias para montar a sua trilha.';
    }

    let painelHtml = '';
    if (configurada && !editandoPersonalizada) {
      painelHtml += `<button class="btn btn-ink btn-sm" id="pers-editar" type="button" style="margin-bottom:22px">Editar matérias</button>`;
    }
    if (!configurada || editandoPersonalizada) painelHtml += painelConfigPersonalizada();
    $('#pers-panel').innerHTML = painelHtml;
    $('#path').innerHTML = (configurada && !editandoPersonalizada) ? caminhoHtml(t) : '';

    const editar = $('#pers-editar');
    if (editar) editar.addEventListener('click', () => { editandoPersonalizada = true; trilha(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    if (!configurada || editandoPersonalizada) ligarConfigPersonalizada();
  }

  function trilha() {
    const t = B.TRILHAS[atual];
    if (t.id === 'personalizada') { trilhaPersonalizada(t); return; }

    const feitas = t.fases.filter((f) => B.progresso.faseCompleta(p, f.id)).length;
    $('#trail-title').textContent = t.nome;
    $('#trail-title').style.setProperty('--c', t.cor);
    $('#trail-sub').textContent = `${feitas} de ${t.fases.length} fases concluídas`;
    $('#pers-panel').innerHTML = '';
    $('#path').innerHTML = caminhoHtml(t);
  }

  painel(); pills(); trilha();

  // quando a sincronização com a nuvem traz progresso novo, redesenha
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('.node-wrap[aria-disabled="true"]') && window.BriifSom) window.BriifSom.tocar('negado');
  });
  window.addEventListener('briif:progresso', () => { p = B.progresso.ler(); painel(); trilha(); });
})();
