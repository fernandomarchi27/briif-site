(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc } = B;
  B.iniciar('perfil');

  const host = $('#desempenho');
  const MIN_QUESTOES = 3;   // abaixo disso o assunto ainda tem pouco dado para ser chamado de "ponto fraco"
  const LIMITE_FORTE = 80, LIMITE_BOM = 60;

  const taxa = (a, t) => (t ? Math.round((a / t) * 100) : null);
  const nivel = (pct) => (pct === null ? 'vazio' : pct >= LIMITE_FORTE ? 'forte' : pct >= LIMITE_BOM ? 'bom' : 'atencao');
  const ROTULO = { forte: 'Forte', bom: 'Bom', atencao: 'Atenção', vazio: 'Sem dados' };

  function linha({ nome, sub, pct, a, t, cor, destaque, tag }) {
    const n = nivel(pct);
    if (!t && !destaque) {
      return `<li class="dsp-linha vazia"><span class="dsp-nome">${cor ? `<i class="dsp-ponto" style="background:${cor}"></i>` : ''}${esc(nome)}</span><small>sem questões ainda</small></li>`;
    }
    return `
      <li class="dsp-linha ${destaque ? 'fraco' : ''}">
        <div class="dsp-topo">
          <span class="dsp-nome">${cor ? `<i class="dsp-ponto" style="background:${cor}"></i>` : ''}${esc(nome)}${tag ? `<em class="dsp-tag">${esc(tag)}</em>` : ''}</span>
          <span class="dsp-valor"><b>${pct === null ? '—' : pct + '%'}</b><small>${t ? `${a} de ${t}` : 'ainda sem questões'}</small></span>
        </div>
        ${sub ? `<div class="dsp-sub">${esc(sub)}</div>` : ''}
        <div class="dsp-barra ${n}" role="progressbar" aria-label="${esc(nome)}" aria-valuenow="${pct === null ? 0 : pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct === null ? 0 : pct}%"></i></div>
      </li>`;
  }

  function render() {
    const p = B.progresso.ler();
    const pa = p.porAssunto || {};
    const trilhas = B.TRILHAS.filter((t) => t.id !== 'personalizada' && t.fases.length > 0);

    // por assunto (cada fase é um assunto; conta as questões respondidas, inclusive nas tentativas que não passaram)
    const assuntos = [];
    trilhas.forEach((t) => t.fases.forEach((f) => {
      const x = pa[f.id];
      assuntos.push({ t, f, a: x ? x.a : 0, tot: x ? x.t : 0 });
    }));
    // por matéria: soma dos assuntos; se o contador antigo da trilha (só fases concluídas) tiver mais dados, usa ele
    const mats = trilhas.map((t) => {
      const itens = assuntos.filter((x) => x.t.id === t.id);
      let a = itens.reduce((s2, x) => s2 + x.a, 0), tot = itens.reduce((s2, x) => s2 + x.tot, 0);
      const antigo = (p.porTrilha || {})[t.id];
      if (antigo && antigo.total > tot) { a = antigo.acertos; tot = antigo.total; }
      return { t, a, tot };
    });

    const totA = mats.reduce((s, m) => s + m.a, 0), totT = mats.reduce((s, m) => s + m.tot, 0);
    const totAssuntos = assuntos.reduce((s, x) => s + x.tot, 0);

    // ponto fraco: o assunto com menor acerto entre os que já têm questões suficientes (e abaixo de 80%)
    const candidatos = assuntos.filter((x) => x.tot >= MIN_QUESTOES)
      .map((x) => Object.assign({ pct: (x.a / x.tot) * 100 }, x))
      .sort((m, n) => m.pct - n.pct || n.tot - m.tot);
    const fraco = candidatos.length && candidatos[0].pct < LIMITE_FORTE ? candidatos[0] : null;

    if (totT === 0 && totAssuntos === 0) {
      host.innerHTML = `
        <div class="dsp-cab"><h1>Meu desempenho</h1><a class="btn btn-ink btn-sm" href="perfil.html">Voltar ao perfil</a></div>
        <div class="dsp-vazio">
          <b>Ainda não tem dados por aqui</b>
          <p>Faça algumas fases e volte: aqui você vê seu acerto em cada matéria e em cada assunto, e descobre qual é o seu ponto fraco.</p>
          <a class="btn btn-coral" href="trilhas.html">Ir para as trilhas</a>
        </div>`;
      return;
    }

    const cartaoFraco = fraco ? `
      <section class="dsp-fraco" aria-labelledby="dsp-fraco-t">
        <span class="dsp-rotulo">Seu ponto fraco</span>
        <h2 id="dsp-fraco-t">${esc(fraco.f.titulo)}</h2>
        <p>${esc(fraco.t.nome)} · você acertou <b>${Math.round(fraco.pct)}%</b> (${fraco.a} de ${fraco.tot} questões). É aqui que um pouco mais de treino rende mais.</p>
        <a class="btn btn-coral btn-sm" href="licao.html?f=${encodeURIComponent(fraco.f.id)}">Praticar este assunto</a>
      </section>` : (candidatos.length ? `
      <section class="dsp-fraco ok">
        <span class="dsp-rotulo">Seu ponto fraco</span>
        <h2>Nenhum por enquanto 🎉</h2>
        <p>Todos os assuntos com questões suficientes estão com ${LIMITE_FORTE}% de acerto ou mais. Continue assim!</p>
      </section>` : `
      <section class="dsp-fraco neutro">
        <span class="dsp-rotulo">Seu ponto fraco</span>
        <h2>Ainda estou descobrindo</h2>
        <p>Preciso de pelo menos ${MIN_QUESTOES} questões respondidas em um assunto para apontar onde você mais erra. Faça mais algumas fases!</p>
      </section>`);

    const blocoMaterias = mats.map((m) => linha({ nome: m.t.nome, pct: taxa(m.a, m.tot), a: m.a, t: m.tot, cor: m.t.cor })).join('');

    const blocoAssuntos = trilhas.map((t) => {
      const itens = assuntos.filter((x) => x.t.id === t.id);
      const comDados = itens.filter((x) => x.tot > 0).length;
      const temFraco = !!fraco && fraco.t.id === t.id;
      return `
        <details class="dsp-grupo" ${comDados || temFraco ? 'open' : ''}>
          <summary><span><i class="dsp-ponto" style="background:${t.cor}"></i>${esc(t.nome)}</span><small>${comDados} de ${itens.length} assuntos com dados</small></summary>
          <ul class="dsp-lista">${itens.map((x) => linha({
            nome: x.f.titulo, pct: taxa(x.a, x.tot), a: x.a, t: x.tot,
            destaque: !!fraco && fraco.f.id === x.f.id, tag: fraco && fraco.f.id === x.f.id ? 'ponto fraco' : ''
          })).join('')}</ul>
        </details>`;
    }).join('');

    host.innerHTML = `
      <div class="dsp-cab">
        <div>
          <h1>Meu desempenho</h1>
          <p class="dsp-resumo">${totT ? `Você acertou <b>${taxa(totA, totT)}%</b> das questões (${totA} de ${totT}).` : 'Seu acerto geral aparece aqui.'}</p>
        </div>
        <a class="btn btn-ink btn-sm" href="perfil.html">Voltar ao perfil</a>
      </div>

      ${cartaoFraco}

      <section class="dsp-bloco" aria-labelledby="dsp-mat-t">
        <h2 id="dsp-mat-t">Acerto por matéria</h2>
        <ul class="dsp-lista">${blocoMaterias}</ul>
        <div class="dsp-legenda"><span class="forte">Forte: ${LIMITE_FORTE}% ou mais</span><span class="bom">Bom: ${LIMITE_BOM}–${LIMITE_FORTE - 1}%</span><span class="atencao">Atenção: abaixo de ${LIMITE_BOM}%</span></div>
      </section>

      <section class="dsp-bloco" aria-labelledby="dsp-ass-t">
        <h2 id="dsp-ass-t">Acerto por assunto</h2>
        ${totAssuntos < totT ? '<p class="dsp-nota">Este gráfico conta as questões respondidas a partir de agora; as fases antigas vão aparecendo conforme você pratica de novo.</p>' : ''}
        ${blocoAssuntos}
      </section>`;
  }

  render();
  B.aguardarSync().then((mudou) => { if (mudou) render(); });
})();
