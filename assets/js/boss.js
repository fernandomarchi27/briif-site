/* ==========================================================================
   Briiff — batalha contra o Mago Roxo (boss no fim de cada trilha)
   Regras: 3 vidas · 6 acertos derrotam o boss · tempo por pergunta depende
   da dificuldade. Errar ou estourar o tempo custa uma vida.
   ========================================================================== */
(function () {
  'use strict';
  const B = window.Briif;
  const { $, $$, esc, ICONS } = B;
  const som = (n) => { if (window.BriifSom) window.BriifSom.tocar(n); };
  B.iniciar('trilhas');

  const BOSS_SVG = `<svg aria-hidden="true" viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="bsHat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B73F5"/><stop offset=".5" stop-color="#4E3BBC"/><stop offset="1" stop-color="#2A1E70"/></linearGradient>
<linearGradient id="bsRobe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E49D6"/><stop offset=".6" stop-color="#3A2A94"/><stop offset="1" stop-color="#1D1456"/></linearGradient>
<linearGradient id="bsCape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B1F78"/><stop offset="1" stop-color="#0F0A33"/></linearGradient>
<linearGradient id="bsBeard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B5ACEA"/></linearGradient>
<linearGradient id="bsFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C5648"/><stop offset=".55" stop-color="#D9A488"/><stop offset="1" stop-color="#C98D70"/></linearGradient>
<radialGradient id="bsEye"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#FFEE88"/><stop offset="1" stop-color="#FFC21A" stop-opacity="0"/></radialGradient>
<radialGradient id="bsOrb" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#D6CCFF"/><stop offset=".7" stop-color="#8C77FF"/><stop offset="1" stop-color="#4B38C8"/></radialGradient>
<radialGradient id="bsGlow"><stop offset="0" stop-color="#B9A8FF" stop-opacity=".85"/><stop offset="1" stop-color="#B9A8FF" stop-opacity="0"/></radialGradient>
<linearGradient id="bsStaff" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A06B3C"/><stop offset="1" stop-color="#5E3B1F"/></linearGradient>
</defs>
<ellipse cx="120" cy="266" rx="62" ry="8" fill="#000" opacity=".28" class="b-sombra"/>
<g class="b-corpo">
<!-- capa -->
<path d="M52 118c-18 40-26 90-30 142 30 8 66 12 98 12s68-4 98-12c-4-52-12-102-30-142l-68 10z" fill="url(#bsCape)"/>
<path d="M60 128c-10 36-16 76-18 118M180 128c10 36 16 76 18 118" stroke="#6A55E8" stroke-width="1.600" fill="none" opacity=".45" stroke-linecap="round"/>
<!-- manto -->
<path d="M70 120c-10 30-16 66-20 128 22 7 48 10 70 10s48-3 70-10c-4-62-10-98-20-128-14-8-34-12-50-12s-36 4-50 12z" fill="url(#bsRobe)"/>
<path d="M120 128v128" stroke="#1D1456" stroke-width="2" opacity=".5"/>
<path d="M92 124l28 36 28-36" fill="none" stroke="#FFD66B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M52 246c22 8 46 11 68 11s46-3 68-11" fill="none" stroke="#FFD66B" stroke-width="3.500" stroke-linecap="round"/>
<g fill="#FFE27A"><path d="M120 190l3 6.500 7 .9-5.200 4.800 1.400 7-6.200-3.500-6.200 3.500 1.400-7-5.200-4.800 7-.9z"/><circle cx="90" cy="222" r="2.500"/><circle cx="152" cy="214" r="2.500"/><circle cx="104" cy="168" r="1.800"/><circle cx="138" cy="170" r="1.800"/></g>
<!-- cinto -->
<path d="M74 176c30 8 62 8 92 0l1.500 9c-31 9-63 9-95 0z" fill="#2A1E70"/><rect x="112" y="177" width="16" height="12" rx="3" fill="#FFD66B"/><rect x="116" y="180" width="8" height="6" rx="1.500" fill="#B57F12"/>
<!-- braço direito (cajado) -->
<path d="M168 130c12 8 22 22 26 40l-14 4c-3-12-9-22-18-28z" fill="url(#bsRobe)"/>
<rect x="190" y="70" width="6.500" height="196" rx="3.200" fill="url(#bsStaff)"/>
<path d="M183 76c0-12 8-18 10.500-18s10.500 6 10.500 18c-4-3-6.500-3.500-10.500-3.500S187 73 183 76z" fill="#6A4524"/>
<circle cx="193.500" cy="52" r="34" fill="url(#bsGlow)" class="b-aura"/>
<circle cx="193.500" cy="52" r="15" fill="url(#bsOrb)" class="b-orbe"/>
<circle cx="188" cy="46" r="4.200" fill="#fff" opacity=".9"/>
<path d="M175 50a18.500 18.500 0 0 1 36 0" stroke="#fff" stroke-opacity=".45" stroke-width="1.200" fill="none"/>
<path d="M164 168c8 2 12 8 12 14-8 0-14-6-12-14z" fill="#D49C7E"/><circle cx="168" cy="172" r="5.500" fill="#D49C7E"/>
<!-- braço esquerdo (conjurando) -->
<path d="M72 130c-14 10-24 24-28 44l16 4c4-14 10-24 18-30z" fill="url(#bsRobe)"/>
<path d="M44 174c-8 2-12 8-10 14 8 1 14-5 10-14z" fill="#D49C7E"/><circle cx="40" cy="178" r="6" fill="#D49C7E"/>
<circle cx="34" cy="170" r="13" fill="url(#bsGlow)" class="b-mao"/><circle cx="34" cy="170" r="6" fill="url(#bsOrb)" class="b-mao"/>
<!-- barba -->
<path d="M84 92c-8 26-4 56 14 80 6 8 14 14 22 18 8-4 16-10 22-18 18-24 22-54 14-80-12 14-26 20-36 20s-24-6-36-20z" fill="url(#bsBeard)"/>
<path d="M104 112c-2 18 0 38 8 58M120 116v68M136 112c2 18 0 38-8 58M92 100c-3 14-2 28 4 42M148 100c3 14 2 28-4 42" stroke="#948AD4" stroke-width="1.600" fill="none" stroke-linecap="round" opacity=".7"/>
<!-- rosto -->
<path d="M88 94c0-22 14-34 32-34s32 12 32 34c0 14-10 24-32 24s-32-10-32-24z" fill="url(#bsFace)"/>
<path d="M116 100c1 8 7 8 8 0l-4-10z" fill="#BF8467"/>
<path d="M90 110c10 2 20-1 30 5-6 5-18 6-28 2zM150 110c-10 2-20-1-30 5 6 5 18 6 28 2z" fill="#fff"/>
<path d="M96 108c8 4 16 4 24 0 8 4 16 4 24 0" stroke="#E6E1FF" stroke-width="1" fill="none" opacity=".5"/>
<!-- olhos -->
<circle cx="104" cy="88" r="12" fill="url(#bsEye)" class="b-olho"/><circle cx="136" cy="88" r="12" fill="url(#bsEye)" class="b-olho"/>
<ellipse cx="104" cy="88.500" rx="5.500" ry="3.800" fill="#fff"/><ellipse cx="136" cy="88.500" rx="5.500" ry="3.800" fill="#fff"/>
<path d="M92 78c6-5 16-5 22 0M148 78c-6-5-16-5-22 0" stroke="#F3F1FF" stroke-width="3.200" fill="none" stroke-linecap="round"/>
<path d="M90 82l12 2M150 82l-12 2" stroke="#2A1E70" stroke-width="2" stroke-linecap="round" opacity=".0"/>
<!-- chapéu -->
<ellipse cx="120" cy="70" rx="72" ry="14" fill="#241A66"/>
<path d="M50 66c14-6 40-9 70-9s56 3 70 9c-14 11-40 16-70 16S64 77 50 66z" fill="url(#bsHat)"/>
<path d="M54 66c14-4 36-6 66-6" stroke="#B3A5FF" stroke-width="2" fill="none" opacity=".6"/>
<path d="M126 4c10 24 20 40 36 56 6 6 10 10 14 14-18 6-38 8-56 8s-38-2-56-8c4-4 8-8 14-14C94 44 108 28 120 4c1-2 5-3 6 0z" fill="url(#bsHat)"/>
<path d="M120 4c-8 24-22 40-34 56-6 6-12 11-16 16 8 3 16 4 24 5 6-26 14-50 26-77z" fill="#fff" opacity=".13"/>
<path d="M72 60c34 8 62 8 96 0l-4 12c-28 6-60 6-88 0z" fill="#FFD66B"/>
<path d="M72 60c34 8 62 8 96 0" stroke="#FFF1B8" stroke-width="1.400" fill="none"/>
<path d="M120 22l5 10.500 11.500 1.600-8.400 8 2 11.400L120 48l-10.100 5.500 2-11.400-8.400-8 11.500-1.600z" fill="#FFE27A" stroke="#E7B93A" stroke-width="1.200"/>
<path d="M136 54l2 4 4.500.6-3.300 3.100.8 4.500-4-2.200-4 2.200.8-4.500-3.300-3.100 4.500-.6z" fill="#fff" opacity=".0"/>
</g>
</svg>`;
  const CFG = B.boss.config;
  const root = $('#boss');
  const tid = new URLSearchParams(location.search).get('t');
  const trilha = B.TRILHAS.find((t) => t.id === tid);
  const letras = ['A', 'B', 'C', 'D', 'E'];
  const DIFF = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' };

  if (!trilha) {
    root.innerHTML = `<div class="block"><h2>Trilha não encontrada</h2><a class="btn btn-coral btn-sm" href="trilhas.html">Ver trilhas</a></div>`;
    return;
  }
  document.title = `Batalha final — ${trilha.nome} — Briiff`;
  root.style.setProperty('--c', trilha.cor);

  let prog = B.progresso.ler();
  if (!B.boss.disponivel(prog, trilha)) {
    root.innerHTML = `<div class="block"><h2>O boss ainda está dormindo</h2>
      <p>Conclua todas as fases de <b>${esc(trilha.nome)}</b> para desafiar o Mago Roxo.</p>
      <a class="btn btn-coral btn-sm" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Voltar à trilha</a></div>`;
    B.aguardarSync().then((m) => { if (m) location.reload(); });
    return;
  }

  /* ---------- estado ---------- */
  let perguntas, q, vidas, golpes, acertos, erros, respondida, restante, limite, timer, trava, resumo, venceu;
  let primeiraVitoria = !B.boss.derrotado(prog, trilha.id);
  const sessao = B.auth.sessao();

  const coracoes = () => Array.from({ length: CFG.vidas }, (_, i) =>
    `<span class="bs-heart ${i < vidas ? 'on' : 'off'}" data-i="${i}"><svg viewBox="0 0 24 24"><path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/></svg></span>`).join('');

  /* ---------- 1. introdução ---------- */
  function intro() {
    root.innerHTML = `
      <div class="bs-intro">
        <div class="crumbs"><a href="trilhas.html?t=${encodeURIComponent(trilha.id)}">${esc(trilha.nome)}</a> / Batalha final</div>
        <div class="bs-intro-art">${BOSS_SVG}</div>
        <span class="badge" style="--c:${trilha.cor}">Boss de ${esc(trilha.nome)}</span>
        <h1>O Mago Roxo te desafia!</h1>
        <p class="sub">Você terminou a trilha inteira. Agora prove o que aprendeu: as perguntas vêm de todas as fases.</p>
        <ul class="bs-rules">
          <li><b>${CFG.vidas} vidas</b><span>Errar ou deixar o tempo acabar custa uma vida.</span></li>
          <li><b>${CFG.golpes} acertos</b><span>Cada resposta certa causa dano no boss.</span></li>
          <li><b>Tempo limitado</b><span>${CFG.tempo.facil}–${CFG.tempo.dificil} s por pergunta, conforme a dificuldade.</span></li>
        </ul>
        <p class="bs-prize">${primeiraVitoria
          ? `Recompensa da 1ª vitória: <b>+${CFG.xp} XP</b> · <b>+${CFG.moedas} MathCoins</b> · <b>+${CFG.bloqueios} bloqueio de ofensiva</b>`
          : 'Você já derrotou este boss — a revanche não dá recompensa, mas conta como dia de estudo.'}</p>
        <div class="actions"><button class="btn btn-coral" id="bs-go" type="button">Começar batalha</button>
        <a class="btn btn-ink" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Ainda não</a></div>
      </div>`;
    $('#bs-go').addEventListener('click', comecar);
  }

  function comecar() {
    perguntas = B.boss.perguntas(trilha, 16);
    q = 0; vidas = CFG.vidas; golpes = 0; acertos = 0; erros = 0; respondida = null; trava = false;
    arena();
    som('bossInicio');
    pergunta();
  }

  /* ---------- 2. arena ---------- */
  function arena() {
    root.innerHTML = `
      <div class="bs-arena" id="bs-arena">
        <div class="bs-stage">
          <div class="bs-hud bs-hud-boss">
            <b>Mago Roxo</b>
            <div class="bs-hp" role="progressbar" aria-label="Vida do boss" aria-valuemin="0" aria-valuemax="${CFG.golpes}" aria-valuenow="${CFG.golpes}"><i id="bs-hp" style="width:100%"></i></div>
          </div>
          <div class="bs-boss" id="bs-boss">${BOSS_SVG}<span class="bs-dmg" id="bs-dmg" aria-hidden="true"></span><span class="bs-bolt" id="bs-bolt" aria-hidden="true"></span></div>
          <div class="bs-hud bs-hud-you">
            <span class="bs-you" id="bs-you">${B.avatarHtml(sessao || { nome: '?' }, 'sm')}</span>
            <div class="bs-hearts" id="bs-hearts" aria-label="Vidas">${coracoes()}</div>
          </div>
        </div>
        <div class="bs-qwrap" id="bs-q"></div>
        <div id="rasc-host"></div>
      </div>`;
  }

  function atualizarHud() {
    const hp = Math.max(0, 100 - (golpes / CFG.golpes) * 100);
    $('#bs-hp').style.width = hp + '%';
    $('.bs-hp').setAttribute('aria-valuenow', String(CFG.golpes - golpes));
    $('#bs-hearts').innerHTML = coracoes();
  }

  function tempoDe(ex) { return CFG.tempo[ex.dificuldade] || CFG.tempo.media; }

  let rasc = null;
  function pergunta() {
    if (rasc) { rasc.fecharCheia(); rasc = null; }
    const ex = perguntas[q];
    respondida = null; trava = false;
    limite = tempoDe(ex); restante = limite;
    $('#bs-q').innerHTML = `
      <div class="bs-timer" role="timer" aria-label="Tempo restante"><i id="bs-tbar"></i><span id="bs-tnum">${limite}</span></div>
      <div class="q-card">
        ${ex.materia ? `<span class="mat-tag" style="--c:${ex.materiaCor}">${esc(ex.materia)}</span>` : ''}
        <div class="diff">Dificuldade: ${DIFF[ex.dificuldade] || 'Média'} · Pergunta ${q + 1}</div>
        <h2>${esc(ex.pergunta)}</h2>
        <div class="q-options">
          ${ex.opcoes.map((o, k) => `<button class="opt" data-k="${k}" type="button"><b style="color:var(--faint);margin-right:10px">${letras[k]}</b>${esc(o)}</button>`).join('')}
        </div>
        <div id="bs-fb"></div>
      </div>`;
    $$('.q-options .opt').forEach((b) => b.addEventListener('click', () => responder(Number(b.dataset.k))));
    if (window.BriifRascunho) {
      rasc = window.BriifRascunho.montar($('#rasc-host'), 'boss:' + trilha.id + ':' + q, {
        alvosTopo: () => [$('.bs-stage'), $('.bs-timer')],
        contador: `Batalha — pergunta ${q + 1}`,
        pergunta: ex.pergunta, opcoes: ex.opcoes, respondida: null, correta: ex.correta,
        aoResponder: responder
      });
    }
    const t0 = Date.now(), tickado = {};
    clearInterval(timer);
    timer = setInterval(() => {
      const gasto = (Date.now() - t0) / 1000;
      restante = Math.max(0, limite - gasto);
      const bar = $('#bs-tbar'), num = $('#bs-tnum');
      if (!bar) { clearInterval(timer); return; }
      bar.style.width = (restante / limite * 100) + '%';
      num.textContent = String(Math.ceil(restante));
      const urgente = restante <= 8;
      bar.parentNode.classList.toggle('urgente', urgente);
      const seg = Math.ceil(restante);
      if (urgente && restante > 0 && !tickado[seg]) { tickado[seg] = true; som('tick'); }
      if (restante <= 0) { clearInterval(timer); responder(-1); }
    }, 100);
    $('#bs-tbar').style.width = '100%';
  }

  function responder(k) {
    if (trava) return;
    trava = true; respondida = k;
    clearInterval(timer);
    if (rasc) { rasc.fecharCheia(); }
    const ex = perguntas[q];
    const ok = k === ex.correta;
    const tempoEsgotado = k === -1;
    $$('.q-options .opt').forEach((b) => {
      b.disabled = true;
      const i = Number(b.dataset.k);
      if (i === ex.correta) b.classList.add('right'); else if (i === k) b.classList.add('wrong');
    });
    let fim = null;
    if (ok) { acertos++; golpes++; golpeNoBoss(); if (golpes >= CFG.golpes) fim = 'vitoria'; }
    else { erros++; vidas--; danoNoJogador(); if (vidas <= 0) fim = 'derrota'; }
    atualizarHud();
    const ultimo = q + 1 >= perguntas.length;
    $('#bs-fb').innerHTML = `
      <div class="feedback ${ok ? 'ok' : 'no'}" role="status">
        <b>${ok ? 'Acertou! Dano no boss!' : (tempoEsgotado ? 'O tempo acabou! A resposta certa é ' : 'Errou! A resposta certa é ') + esc(ex.opcoes[ex.correta]) + '.'}</b>
        <p>${esc(ex.explicacao || '')}</p></div>
      ${fim ? '' : `<div class="q-actions"><button class="btn btn-coral btn-sm" id="bs-prox" type="button">Próxima pergunta ${ICONS.arrow}</button></div>`}`;
    if (fim) { setTimeout(() => finalizar(fim === 'vitoria'), fim === 'vitoria' ? 1500 : 1300); return; }
    const prox = $('#bs-prox'); prox.focus({ preventScroll: true });
    prox.addEventListener('click', () => {
      som('avancar'); q++;
      if (q >= perguntas.length) { perguntas = perguntas.concat(B.boss.perguntas(trilha, 8)); }
      pergunta();
    });
  }

  /* ---------- efeitos ---------- */
  function golpeNoBoss() {
    const boss = $('#bs-boss'), dmg = $('#bs-dmg');
    const dano = Math.round(100 / CFG.golpes);
    som('golpe');
    boss.classList.remove('hit'); void boss.offsetWidth; boss.classList.add('hit');
    dmg.textContent = '-' + dano; dmg.classList.remove('sobe'); void dmg.offsetWidth; dmg.classList.add('sobe');
    if (golpes >= CFG.golpes) { setTimeout(() => { boss.classList.add('morre'); som('bossMorre'); }, 350); }
  }
  function danoNoJogador() {
    const boss = $('#bs-boss'), arena = $('#bs-arena'), bolt = $('#bs-bolt');
    som('dano');
    boss.classList.remove('ataca'); void boss.offsetWidth; boss.classList.add('ataca');
    bolt.classList.remove('voa'); void bolt.offsetWidth; bolt.classList.add('voa');
    setTimeout(() => {
      arena.classList.remove('machuca'); void arena.offsetWidth; arena.classList.add('machuca');
      const perdido = $$('.bs-heart')[vidas];
    }, 380);
  }

  /* ---------- 3. fim ---------- */
  function finalizar(ganhou) {
    clearInterval(timer);
    venceu = ganhou;
    if (!ganhou) { som('derrota'); telaFim(); return; }
    resumo = B.boss.completar(trilha.id);
    B.atualizarHeader();
    primeiraVitoria = false;
    const mostrar = () => { telaFim(); som('perfeito'); if (resumo.moedas) setTimeout(() => som('moeda'), 900); if (resumo.subiu) setTimeout(() => som('nivel'), 1500); };
    if (resumo.streakAumentou && window.BriifCelebracao) {
      telaFim();
      window.BriifCelebracao.ofensiva({ streak: resumo.streak, anterior: resumo.streak - 1, dias: B.progresso.ler().dias || [], aoFechar: mostrar });
      return;
    }
    mostrar();
  }

  function telaFim() {
    window.scrollTo({ top: 0 });
    const href = `trilhas.html?t=${encodeURIComponent(trilha.id)}`;
    if (venceu) {
      root.innerHTML = `
        <div class="result bs-fim vitoria">
          <div class="bs-fim-art">${BOSS_SVG}</div>
          <h1>Mago Roxo derrotado!</h1>
          <p class="sub">Você acertou ${acertos} e errou ${erros}, e terminou a batalha com ${vidas} ${vidas === 1 ? 'vida' : 'vidas'}.${resumo && resumo.primeiraVez ? '' : ' Como você já tinha vencido este boss, foi uma revanche sem recompensa extra.'}</p>
          ${resumo && resumo.subiu ? `<div class="levelup">Você subiu para o nível ${resumo.nivelAntes + 1}!</div>` : ''}
          <div class="rewards">
            <div class="reward"><b>+${resumo ? resumo.xp : 0}</b><span>XP</span></div>
            <div class="reward"><b>+${resumo ? resumo.moedas : 0}</b><span>MathCoins</span></div>
            <div class="reward"><b>+${resumo ? resumo.bloqueioGanho : 0}</b><span>bloqueio${resumo && resumo.bloqueioGanho > 1 ? 's' : ''}</span></div>
          </div>
          <div class="actions"><a class="btn btn-coral" href="${href}">Voltar à trilha</a>
          <button class="btn btn-ink" id="bs-again" type="button">Lutar de novo</button></div>
        </div>`;
    } else {
      root.innerHTML = `
        <div class="result bs-fim derrota">
          <div class="bs-fim-art">${BOSS_SVG}</div>
          <h1>Você foi derrotado</h1>
          <p class="sub">O Mago Roxo venceu desta vez — você causou ${golpes} de ${CFG.golpes} golpes. Revise as fases e tente de novo, sem pressa.</p>
          <div class="actions"><button class="btn btn-coral" id="bs-again" type="button">Tentar de novo</button>
          <a class="btn btn-ink" href="${href}">Revisar a trilha</a></div>
        </div>`;
    }
    const again = $('#bs-again'); if (again) again.addEventListener('click', intro);
  }

  window.addEventListener('pagehide', () => clearInterval(timer));
  intro();
})();
