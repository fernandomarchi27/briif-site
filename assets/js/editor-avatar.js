(function () {
  'use strict';
  const B = window.Briif;
  const A = window.BriifAvatar;
  const { $, $$, esc, ICONS } = B;
  B.iniciar('perfil');

  const host = $('#editor');
  // modo "primeiro acesso": vem do onboarding (depois do quiz) e segue para as trilhas
  const qs = new URLSearchParams(location.search);
  const onb = qs.get('onb') === '1';
  const nx = qs.get('next');
  const proximo = nx && /^[a-z0-9_\-]+\.html(\?.*)?$/i.test(nx) ? nx : 'trilhas.html';
  let p = B.progresso.ler();
  let salvo = A.limpar(p.avatarCfg || A.padrao());   // o que está gravado na conta
  let cfg = Object.assign({}, salvo);                 // o que está sendo montado
  let aba = A.DATA.abas[0].id;
  let msg = null;                                     // { ok, texto }

  const tem = (cat, it) => it.preco === 0 || (p.avatarPecas || []).indexOf(cat + ':' + it.id) !== -1;
  const igual = (a, b) => A.DATA.cats.every((c) => a[c.id] === b[c.id]);
  const moeda = (n) => `<span class="av-moeda">${ICONS.coin}${n}</span>`;

  let sub = null;       // categoria aberta dentro da aba (ex.: Estilo / Cor do cabelo)
  let zoom = 'corpo';   // corpo | rosto
  const ROTULO = { pele: 'PELE', cabelo: 'CABELO', rosto: 'ROSTO', barba: 'BARBA', roupa: 'ROUPA', calca: 'CALÇA', sapato: 'SAPATOS', extras: 'EXTRAS', fundo: 'CENÁRIO' };

  function arte(cat, it) {
    if (cat.tipo === 'cor') return `<span class="px-cor" style="background:${it.cor}"></span>`;
    const prev = Object.assign({}, cfg); prev[cat.id] = it.id;
    return `<span class="px-mini">${A.svg(prev, { crop: cat.crop, semFundo: cat.id !== 'fundo' })}</span>`;
  }

  function opcao(cat, it) {
    const sel = cfg[cat.id] === it.id;
    const dono = tem(cat.id, it);
    const paga = it.preco > 0 && !dono;
    const tag = paga ? `<span class="px-preco">${ICONS.coin}${it.preco}</span>` : (it.preco > 0 ? '<span class="px-meu">SEU</span>' : '<span class="px-free">GRÁTIS</span>');
    return `<button type="button" class="px-op ${cat.tipo === 'cor' ? 'cor' : ''} ${sel ? 'sel' : ''} ${paga ? 'pago' : ''}" data-cat="${cat.id}" data-id="${it.id}" aria-pressed="${sel}" aria-label="${esc(it.nome)}${paga ? ', ' + it.preco + ' MathCoins' : ''}" title="${esc(it.nome)}">${arte(cat, it)}<span class="px-nome">${esc(it.nome)}</span>${cat.tipo === 'cor' ? '' : tag}${sel ? '<i class="px-ok">✓</i>' : ''}</button>`;
  }

  function thumbAba(a) {
    const c = A.cat(a.cats[0]);
    if (c.tipo === 'cor') return `<span class="px-aba-ic"><i style="background:${A.item(c.id, cfg[c.id]).cor}"></i></span>`;
    return `<span class="px-aba-ic">${A.svg(cfg, { crop: c.crop, semFundo: true })}</span>`;
  }

  function render() {
    const f = A.faltando(cfg, p.avatarPecas);
    const mudou = !igual(cfg, salvo);
    const semSaldo = f.total > p.moedas;
    const abaAtual = A.DATA.abas.find((a) => a.id === aba);
    if (!sub || abaAtual.cats.indexOf(sub) === -1) sub = abaAtual.cats[0];
    const cat = A.cat(sub);
    const rotuloSalvar = f.total > 0 ? `COMPRAR E SALVAR · ${f.total}` : 'SALVAR AVATAR';
    const resumo = A.DATA.cats.filter((c) => c.tipo === 'forma' || c.id === 'pele').map((c) => {
      const it = A.item(c.id, cfg[c.id]);
      const paga = it.preco > 0 && !tem(c.id, it);
      return `<li><span>${esc(c.nome)}</span><b>${esc(it.nome)}</b>${paga ? `<em>${ICONS.coin}${it.preco}</em>` : ''}</li>`;
    }).join('');
    const crop = zoom === 'rosto' ? [4, 2, 28, 26] : [0, 0, A.DATA.w, A.DATA.h];

    host.innerHTML = `
      <div class="pxe">
        <div class="pxe-topo"><h1>${onb ? 'CRIE SEU AVATAR' : 'MEU AVATAR'}</h1><div class="pxe-saldo" title="Seus MathCoins">${ICONS.coin}<b>${p.moedas}</b></div></div>
        ${onb ? '<p class="pxe-onb">Escolha o visual do seu personagem: pele, cabelo, roupa e mais. Ele vai te acompanhar nas fases, nas batalhas e no ranking. Quando terminar, salve e continue. Dá para mudar depois no Perfil.</p>' : ''}
        <div class="pxe-corpo">
          <nav class="pxe-nav" role="tablist" aria-label="Partes do avatar">
            ${A.DATA.abas.map((a) => `<button type="button" role="tab" class="pxe-aba" data-aba="${a.id}" aria-selected="${a.id === aba}">${thumbAba(a)}<span>${ROTULO[a.id] || esc(a.nome)}</span></button>`).join('')}
          </nav>
          <section class="pxe-palco" aria-label="Pré-visualização">
            <div class="pxe-tela ${zoom}">${A.svg(cfg, { crop, corpo: true })}</div>
            <div class="pxe-ctrl">
              <button type="button" class="pxe-bt" id="av-zoom">${zoom === 'corpo' ? 'VER ROSTO' : 'VER CORPO'}</button>
              <button type="button" class="pxe-bt" id="av-sortear">ALEATÓRIO</button>
              <button type="button" class="pxe-bt" id="av-desfazer" ${mudou ? '' : 'disabled'}>DESFAZER</button>
            </div>
          </section>
          <section class="pxe-opcoes">
            <div class="pxe-sub" role="tablist">${abaAtual.cats.length > 1 ? abaAtual.cats.map((id) => `<button type="button" class="pxe-subb" data-sub="${id}" aria-selected="${id === sub}">${esc(A.cat(id).nome.toUpperCase())}</button>`).join('') : `<span class="pxe-titulo">${esc(cat.nome.toUpperCase())}</span>`}</div>
            <div class="pxe-grade ${cat.tipo === 'cor' ? 'cores' : ''}" role="group" aria-label="${esc(cat.nome)}">${cat.itens.map((it) => opcao(cat, it)).join('')}</div>
          </section>
          <aside class="pxe-resumo">
            <h2>RESUMO</h2>
            <ul class="pxe-lista">${resumo}</ul>
            <div class="pxe-total"><span>Total a pagar</span><b>${ICONS.coin}${f.total}</b></div>
            ${semSaldo ? `<p class="pxe-aviso" role="alert">Faltam ${f.total - p.moedas} MathCoins. Conclua fases para ganhar mais, ou troque as peças pagas.</p>` : ''}
            ${msg ? `<p class="pxe-aviso ${msg.ok ? 'ok' : ''}" role="status">${esc(msg.texto)}</p>` : ''}
            <button class="pxe-salvar" id="av-salvar" type="button" ${(!mudou && p.avatarAtivo === 'custom') || semSaldo ? 'disabled' : ''}>${esc(rotuloSalvar)}</button>
          </aside>
        </div>
        ${onb ? `<div class="pxe-onb-nav"><a class="pxe-bt pxe-continuar" id="av-continuar" href="${esc(proximo)}">${mudou ? 'CONTINUAR SEM SALVAR' : (p.avatarAtivo === 'custom' ? 'CONTINUAR PARA AS TRILHAS' : 'FAZER DEPOIS')} →</a></div>` : ''}
      </div>`;
    ligar();
  }

  function ligar() {
    $$('[data-aba]', host).forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; sub = null; msg = null; render(); }));
    $$('[data-sub]', host).forEach((b) => b.addEventListener('click', () => { sub = b.dataset.sub; render(); }));
    $('#av-zoom').addEventListener('click', () => { zoom = zoom === 'corpo' ? 'rosto' : 'corpo'; render(); });
    $$('.px-op', host).forEach((b) => b.addEventListener('click', () => {
      cfg[b.dataset.cat] = b.dataset.id; msg = null;
      if (window.BriifSom) window.BriifSom.tocar('toque');
      const y = window.scrollY; const g = $('.pxe-grade'); const gy = g ? g.scrollTop : 0; render(); window.scrollTo(0, y); const g2 = $('.pxe-grade'); if (g2) g2.scrollTop = gy;
    }));
    $('#av-desfazer').addEventListener('click', () => { cfg = Object.assign({}, salvo); msg = null; render(); });
    $('#av-sortear').addEventListener('click', () => {
      // só sorteia peças grátis ou que você já tem
      A.DATA.cats.forEach((c) => {
        const ok = c.itens.filter((it) => tem(c.id, it));
        cfg[c.id] = ok[Math.floor(Math.random() * ok.length)].id;
      });
      msg = null; render();
    });
    $('#av-salvar').addEventListener('click', () => {
      const r = B.avatares.salvarPersonalizado(cfg);
      p = B.progresso.ler();
      if (r.ok) {
        salvo = A.limpar(p.avatarCfg); cfg = Object.assign({}, salvo);
        msg = { ok: true, texto: r.gasto ? `Avatar salvo! Você gastou ${r.gasto} MathCoins.` : 'Avatar salvo! Ele já aparece no seu perfil e no ranking.' };
        if (window.BriifSom) window.BriifSom.tocar('acerto');
      } else {
        msg = { ok: false, texto: `Faltam ${r.falta} MathCoins para essas peças.` };
      }
      B.atualizarHeader();
      render();
    });
  }

  render();
  // a nuvem pode trazer um avatar/moedas mais novos
  B.aguardarSync().then((mudou) => {
    if (!mudou) return;
    const novo = B.progresso.ler();
    const editou = !igual(cfg, salvo);
    p = novo;
    if (!editou) { salvo = A.limpar(p.avatarCfg || A.padrao()); cfg = Object.assign({}, salvo); }
    render();
  });
})();
