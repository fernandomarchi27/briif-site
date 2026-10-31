/* ==========================================================================
   Briiff — batalha final de cada trilha (boss)
   Regras (config em app.js, Briiff.boss.config): 3 vidas · 6 acertos derrotam o chefe ·
   tempo por pergunta conforme a dificuldade. Errar ou estourar o tempo custa uma vida.
   As perguntas, o rascunho, o progresso e as recompensas são os do próprio Briiff;
   a parte visual (vídeo, arena em canvas, ataque, explosão) vem de bossfight.js.
   ========================================================================== */
(function () {
  'use strict';
  const B = window.Briif;
  const { $, $$, esc, ICONS } = B;
  const som = (n) => { if (window.BriifSom) window.BriifSom.tocar(n); };
  B.iniciar('trilhas');

  const CFG = B.boss.config;
  const root = $('#boss');
  const tid = new URLSearchParams(location.search).get('t');
  const trilha = B.TRILHAS.find((t) => t.id === tid);
  const letras = ['A', 'B', 'C', 'D', 'E'];
  const DIFF = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' };
  const CHAVE_VIDEO = 'briif:boss-video';
  const sprite = '<span class="bs-sprite silhueta" role="img" aria-label="Silhueta do chefe, Os Desenvolvedores"></span>';   // introdução: só a silhueta preta

  if (!trilha) {
    root.innerHTML = `<div class="block"><h2>Trilha não encontrada</h2><a class="btn btn-coral btn-sm" href="trilhas.html">Ver trilhas</a></div>`;
    return;
  }
  document.title = `Batalha final — ${trilha.nome} — Briiff`;
  root.style.setProperty('--c', trilha.cor);

  let prog = B.progresso.ler();
  if (!B.boss.disponivel(prog, trilha)) {
    root.innerHTML = `<div class="block"><h2>O chefe ainda está dormindo</h2>
      <p>Conclua todas as fases de <b>${esc(trilha.nome)}</b> para desafiar Os Desenvolvedores.</p>
      <a class="btn btn-coral btn-sm" href="trilhas.html?t=${encodeURIComponent(trilha.id)}">Voltar à trilha</a></div>`;
    B.aguardarSync().then((m) => { if (m) location.reload(); });
    return;
  }

  /* ---------- estado ---------- */
  let perguntas, q, vidas, golpes, acertos, erros, restante, limite, timer, trava, resumo, venceu, arena, rasc = null, finalizado;
  let primeiraVitoria = !B.boss.derrotado(prog, trilha.id);
  const href = `trilhas.html?t=${encodeURIComponent(trilha.id)}`;

  /* ---------- 1. introdução (regras) ---------- */
  function intro() {
    destruirArena();
    root.innerHTML = `
      <div class="bs-intro">
        <div class="crumbs"><a href="${href}">${esc(trilha.nome)}</a> / Batalha final</div>
        <div class="bs-intro-art">${sprite}</div>
        <span class="badge" style="--c:${trilha.cor}">Chefe de ${esc(trilha.nome)}</span>
        <h1>Os Desenvolvedores te desafiam!</h1>
        <p class="sub">Você terminou a trilha inteira. Agora prove o que aprendeu: as perguntas vêm de todas as fases.</p>
        <ul class="bs-rules">
          <li><b>${CFG.vidas} corações</b><span>Errar ou deixar o tempo acabar custa um coração.</span></li>
          <li><b>${CFG.golpes} acertos</b><span>Cada resposta certa lança uma magia no chefe.</span></li>
          <li><b>Tempo limitado</b><span>${CFG.tempo.facil}–${CFG.tempo.dificil} s por pergunta, conforme a dificuldade.</span></li>
        </ul>
        <p class="bs-prize">${primeiraVitoria
          ? `Recompensa da 1ª vitória: <b>+${CFG.xp} XP</b> · <b>+${CFG.moedas} Moedas</b> · <b>+${CFG.bloqueios} combustível</b> (até o limite de ${B.loja.maxBloqueios} por conta)`
          : 'Você já derrotou este chefe — a revanche não dá recompensa, mas conta como dia de estudo.'}</p>
        <div class="actions"><button class="btn btn-coral" id="bs-go" type="button">Começar batalha</button>
        <a class="btn btn-ink" href="${href}">Ainda não</a></div>
        ${B.poderes.ativo() ? '<button type="button" class="dev-link" id="dev-pular-boss">Pular esta batalha</button>' : ''}
      </div>`;
    const pb = $('#dev-pular-boss');
    if (pb) pb.addEventListener('click', () => { B.poderes.pularBoss(trilha.id); location.href = href; });
    $('#bs-go').addEventListener('click', () => {
      let visto = false; try { visto = sessionStorage.getItem(CHAVE_VIDEO) === '1'; } catch (e) { /* segue */ }
      if (visto) comecar(); else video();     // o clique é o gesto que libera o vídeo com som
    });
  }

  /* ---------- 2. vídeo de abertura (sempre com saída: nunca trava a batalha) ---------- */
  function video() {
    if (window.BriifArena) window.BriifArena.precarregar().catch(() => {});
    root.innerHTML = `
      <div class="bs-video">
        <video id="bs-v" playsinline preload="auto" src="assets/boss/intro.mp4" aria-label="Cena de introdução da batalha"></video>
        <button class="btn btn-ink btn-sm bs-skip" id="bs-skip" type="button">Pular introdução</button>
      </div>`;
    const v = $('#bs-v'); let feito = false;
    const fim = () => { if (feito) return; feito = true; try { sessionStorage.setItem(CHAVE_VIDEO, '1'); } catch (e) { /* segue */ } v.pause(); comecar(); };
    v.addEventListener('ended', fim);
    v.addEventListener('error', fim);
    $('#bs-skip').addEventListener('click', fim);
    $('#bs-skip').focus({ preventScroll: true });
    const tocar = v.play();
    if (tocar && tocar.catch) tocar.catch(() => { v.muted = true; const t2 = v.play(); if (t2 && t2.catch) t2.catch(() => {}); });
    setTimeout(() => { if (!feito && v.readyState === 0) fim(); }, 8000);
  }

  function destruirArena() { if (arena) { arena.destruir(); arena = null; } }

  function comecar() {
    perguntas = B.boss.perguntas(trilha, 16);
    q = 0; vidas = CFG.vidas; golpes = 0; acertos = 0; erros = 0; trava = false; finalizado = false; venceu = false;
    montarArena();
    som('bossInicio');
    arena.pronta.then(pergunta, pergunta);    // se os assets falharem a batalha segue só com as perguntas
  }

  /* ---------- 3. arena ---------- */
  function montarArena() {
    root.innerHTML = `
      <div class="bs-arena" id="bs-arena">
        <div class="bs-stage"><canvas class="bs-cv" id="bs-cv" role="img" aria-label="Arena: o mago enfrenta Os Desenvolvedores"></canvas></div>
        <p class="sr-only" id="bs-live" aria-live="polite"></p>
        <div class="bs-qwrap" id="bs-q"></div>
        <div id="rasc-host"></div>
      </div>`;
    destruirArena();
    arena = window.BriifArena.criar($('#bs-cv'), { golpes: CFG.golpes, vidas: CFG.vidas, nome: 'Os Desenvolvedores' });
  }
  const reduzMov = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* no celular a arena sai da tela quando a pessoa responde lá embaixo: traz de volta para ver o ataque */
  const lado = window.matchMedia && matchMedia('(min-width: 900px)');   // em telas largas luta e questões ficam lado a lado: não precisa rolar
  const verArena = () => { if (lado && lado.matches) return; const s = $('.bs-stage'); if (s && s.scrollIntoView) s.scrollIntoView({ behavior: reduzMov ? 'auto' : 'smooth', block: 'start' }); };
  const anunciar = (t) => { const l = $('#bs-live'); if (l) l.textContent = t; };
  function tempoDe(ex) { return CFG.tempo[ex.dificuldade] || CFG.tempo.media; }

  function pergunta() {
    if (finalizado) return;
    if (rasc) { rasc.fecharCheia(); rasc = null; }
    const ex = perguntas[q];
    trava = false;
    if (q > 0) verArena();
    limite = tempoDe(ex); restante = limite;
    $('#bs-q').innerHTML = `
      <div class="bs-timer" role="timer" aria-label="Tempo restante"><i id="bs-tbar"></i><span id="bs-tnum">${limite}</span></div>
      <div class="q-card">
        ${ex.materia ? `<span class="mat-tag" style="--c:${ex.materiaCor}">${esc(ex.materia)}</span>` : ''}
        <div class="diff">Dificuldade: ${DIFF[ex.dificuldade] || 'Média'} · Pergunta ${q + 1}</div>
        <h2>${esc(ex.pergunta)}</h2>
        <div class="q-options">
          ${ex.opcoes.map((o, k) => `<button class="opt" data-k="${k}" type="button"><b class="bs-letra">${letras[k]}</b>${esc(o)}${B.poderes.ativo() && k === ex.correta ? '<i class="dev-dica">essa é a certa</i>' : ''}</button>`).join('')}
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
      restante = Math.max(0, limite - (Date.now() - t0) / 1000);
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

  /* Uma pergunta só gera UM resultado: `trava` bloqueia clique repetido, cronômetro e rascunho. */
  function responder(k) {
    if (trava || finalizado) return;
    trava = true;
    clearInterval(timer);
    if (rasc) rasc.fecharCheia();
    verArena();
    const ex = perguntas[q];
    const ok = k === ex.correta, esgotou = k === -1;
    $$('.q-options .opt').forEach((b) => {
      b.disabled = true;
      const i = Number(b.dataset.k);
      if (i === ex.correta) b.classList.add('right'); else if (i === k) b.classList.add('wrong');
    });
    $('#bs-fb').innerHTML = `
      <div class="feedback ${ok ? 'ok' : 'no'}" role="status">
        <b>${ok ? 'Acertou! Lance a magia!' : (esgotou ? 'O tempo acabou! A resposta certa é ' : 'Errou! A resposta certa é ') + esc(ex.opcoes[ex.correta]) + '.'}</b>
        <p>${esc(ex.explicacao || '')}</p></div><div id="bs-acao"></div>`;

    if (ok) {
      acertos++; som('golpe');
      arena.golpe(() => {                       // o dano só vale quando a bola atinge o chefe
        golpes++; arena.chefe(CFG.golpes - golpes);
        anunciar(`Acerto. Faltam ${CFG.golpes - golpes} golpes para derrotar o chefe.`);
        if (golpes >= CFG.golpes) { finalizado = true; som('bossMorre'); arena.vitoria(() => finalizar(true)); }
        else proxima();
      });
    } else {
      erros++; vidas--; som('dano');
      arena.dano(); arena.vida(vidas);
      anunciar(`${esgotou ? 'Tempo esgotado' : 'Resposta errada'}. Corações restantes: ${vidas}.`);
      if (vidas <= 0) { finalizado = true; arena.derrota(() => finalizar(false)); }
      else proxima();
    }
  }

  function proxima() {
    const acao = $('#bs-acao'); if (!acao) return;
    acao.innerHTML = `<div class="q-actions"><button class="btn btn-coral btn-sm" id="bs-prox" type="button">Próxima pergunta ${ICONS.arrow}</button></div>`;
    const prox = $('#bs-prox'); prox.focus({ preventScroll: true });
    prox.addEventListener('click', () => {
      som('avancar'); q++;
      if (q >= perguntas.length) perguntas = perguntas.concat(B.boss.perguntas(trilha, 8));
      pergunta();
    }, { once: true });
  }

  /* ---------- 4. fim ---------- */
  function finalizar(ganhou) {
    clearInterval(timer);
    if (venceu === true && ganhou) return;              // recompensa só uma vez por batalha
    venceu = ganhou;
    destruirArena();
    if (!ganhou) { som('derrota'); telaFim(); return; }
    resumo = B.boss.completar(trilha.id);               // app.js: só a 1ª vitória dá XP, Moedas e combustível
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
    if (venceu) {
      const c = resumo ? resumo.bloqueioGanho : 0;
      root.innerHTML = `
        <div class="result bs-fim vitoria">
          <div class="bs-fim-art">${B.mago('vitoria', 'Mago comemorando a vitória')}</div>
          <h1>Os Desenvolvedores foram derrotados!</h1>
          <p class="sub">Você acertou ${acertos} e errou ${erros}, e terminou a batalha com ${vidas} ${vidas === 1 ? 'coração' : 'corações'}.${resumo && resumo.primeiraVez ? '' : ' Como você já tinha vencido este chefe, a revanche não dá recompensa, mas contou como dia de estudo.'}</p>
          ${resumo && resumo.subiu ? `<div class="levelup">Você subiu para o nível ${resumo.nivelAntes + 1}!</div>` : ''}
          <div class="rewards">
            <div class="reward"><b>+${resumo ? resumo.xp : 0}</b><span>XP</span></div>
            <div class="reward"><b>+${resumo ? resumo.moedas : 0}</b><span>Moedas</span></div>
            <div class="reward"><b>+${c}</b><span>combustível${resumo && resumo.primeiraVez && !c ? ' (limite de ' + B.loja.maxBloqueios + ' atingido)' : ''}</span></div>
          </div>
          <div class="actions"><a class="btn btn-coral" href="${href}">Voltar à trilha</a>
          <button class="btn btn-ink" id="bs-again" type="button">Lutar de novo</button></div>
        </div>`;
    } else {
      root.innerHTML = `
        <div class="result bs-fim derrota">
          <div class="bs-fim-art">${B.mago('derrota', 'Mago derrotado')}</div>
          <h1>Você foi derrotado</h1>
          <p class="sub">Os Desenvolvedores venceram desta vez — você acertou ${acertos} de ${CFG.golpes} golpes necessários. Revise as fases e tente de novo, sem pressa.</p>
          <div class="actions"><button class="btn btn-coral" id="bs-again" type="button">Tentar de novo</button>
          <a class="btn btn-ink" href="${href}">Revisar a trilha</a></div>
        </div>`;
    }
    const again = $('#bs-again'); if (again) again.addEventListener('click', () => { venceu = false; comecar(); });
  }

  window.addEventListener('pagehide', () => { clearInterval(timer); destruirArena(); });
  intro();
})();
