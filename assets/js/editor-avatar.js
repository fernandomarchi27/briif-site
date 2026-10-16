(function () {
  'use strict';
  const B = window.Briif;
  const A = window.BriifAvatar;
  const { $, $$, esc, ICONS } = B;
  B.iniciar('perfil');

  const host = $('#editor');
  let p = B.progresso.ler();
  let salvo = A.limpar(p.avatarCfg || A.padrao());   // o que está gravado na conta
  let cfg = Object.assign({}, salvo);                 // o que está sendo montado
  let aba = A.DATA.abas[0].id;
  let msg = null;                                     // { ok, texto }

  const tem = (cat, it) => it.preco === 0 || (p.avatarPecas || []).indexOf(cat + ':' + it.id) !== -1;
  const igual = (a, b) => A.DATA.cats.every((c) => a[c.id] === b[c.id]);
  const moeda = (n) => `<span class="av-moeda">${ICONS.coin}${n}</span>`;

  function opcao(cat, it) {
    const sel = cfg[cat.id] === it.id;
    const dono = tem(cat.id, it);
    const preco = it.preco > 0 && !dono ? moeda(it.preco) : '';
    const meu = it.preco > 0 && dono ? '<span class="av-meu" title="Você já tem">✓</span>' : '';
    let arte;
    if (cat.tipo === 'cor') arte = `<span class="av-cor" style="background:${it.cor}"></span>`;
    else {
      const prev = Object.assign({}, cfg); prev[cat.id] = it.id;
      arte = `<span class="av-mini">${A.svg(prev, { vb: cat.vb })}</span>`;
    }
    return `<button type="button" class="av-op ${sel ? 'sel' : ''} ${it.preco > 0 && !dono ? 'pago' : ''}" data-cat="${cat.id}" data-id="${it.id}" aria-pressed="${sel}" aria-label="${esc(it.nome)}${it.preco > 0 && !dono ? ', ' + it.preco + ' MathCoins' : ''}" title="${esc(it.nome)}">${arte}${preco}${meu}</button>`;
  }

  function secao(cat) {
    const atual = A.item(cat.id, cfg[cat.id]);
    return `
      <section class="av-sec">
        <h3>${esc(cat.nome)} <small>${esc(atual ? atual.nome : '')}</small></h3>
        <div class="av-grade ${cat.tipo === 'cor' ? 'cores' : ''}" role="group" aria-label="${esc(cat.nome)}">${cat.itens.map((it) => opcao(cat, it)).join('')}</div>
      </section>`;
  }

  function render() {
    const f = A.faltando(cfg, p.avatarPecas);
    const mudou = !igual(cfg, salvo);
    const semSaldo = f.total > p.moedas;
    const abaAtual = A.DATA.abas.find((a) => a.id === aba);
    const rotuloSalvar = f.total > 0 ? `Comprar ${f.lista.length} ${f.lista.length === 1 ? 'peça' : 'peças'} e salvar` : 'Salvar avatar';

    host.innerHTML = `
      <div class="page-top"><h1>Meu avatar</h1>
        <p class="rk-intro">Monte o seu personagem. As peças com moeda são pagas com MathCoins; o resto é de graça.</p></div>
      <div class="av-ed">
        <aside class="av-lado">
          <div class="av-palco"><span class="av-grande">${A.svg(cfg)}</span></div>
          <div class="av-saldo">Você tem <b>${moeda(p.moedas)}</b></div>
          ${f.lista.length ? `<ul class="av-conta" aria-label="Peças a comprar">${f.lista.map((x) => `<li><span>${esc(x.nome)}</span>${moeda(x.preco)}</li>`).join('')}<li class="tot"><span>Total</span>${moeda(f.total)}</li></ul>` : ''}
          ${semSaldo ? `<p class="av-aviso" role="alert">Faltam ${f.total - p.moedas} MathCoins. Conclua fases para ganhar mais, ou troque as peças pagas por outras.</p>` : ''}
          ${msg ? `<p class="av-aviso ${msg.ok ? 'ok' : ''}" role="status">${esc(msg.texto)}</p>` : ''}
          <div class="av-acoes">
            <button class="btn btn-coral" id="av-salvar" type="button" ${(!mudou && p.avatarAtivo === 'custom') || semSaldo ? 'disabled' : ''}>${esc(rotuloSalvar)}</button>
            <button class="btn btn-ink btn-sm" id="av-sortear" type="button">Aleatório</button>
            <button class="btn btn-ink btn-sm" id="av-desfazer" type="button" ${mudou ? '' : 'disabled'}>Desfazer</button>
          </div>
        </aside>
        <div class="av-painel">
          <div class="pills av-abas" role="tablist" aria-label="Partes do avatar">
            ${A.DATA.abas.map((a) => `<button type="button" class="pill" role="tab" data-aba="${a.id}" aria-selected="${a.id === aba}">${esc(a.nome)}</button>`).join('')}
          </div>
          ${abaAtual.cats.map((id) => secao(A.cat(id))).join('')}
        </div>
      </div>`;
    ligar();
  }

  function ligar() {
    $$('[data-aba]', host).forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; msg = null; render(); }));
    $$('.av-op', host).forEach((b) => b.addEventListener('click', () => {
      cfg[b.dataset.cat] = b.dataset.id; msg = null;
      if (window.BriifSom) window.BriifSom.tocar('toque');
      const y = window.scrollY; render(); window.scrollTo(0, y);
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
