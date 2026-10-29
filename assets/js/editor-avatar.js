/* ==========================================================================
   Editor de avatar (mago de RPG em pixel art)
   - Categorias em abas; cada peça é uma miniatura SEM texto descritivo (o nome vai no title/aria-label).
   - Estados de cada peça: equipada · disponível · comprada · bloqueada (paga e ainda não comprada).
   - As compras acontecem ao salvar (B.avatares.salvarPersonalizado): confere saldo, desconta uma única vez e registra
     as peças compradas em avatarPecas; o avatar equipado fica em avatarCfg. Nada é cobrado de novo por peça já comprada.
   ========================================================================== */
(function () {
  'use strict';
  const B = window.Briif;
  const A = window.BriifAvatar;
  const { $, $$, esc, ICONS } = B;
  B.iniciar('perfil');

  const host = $('#editor');
  const qs = new URLSearchParams(location.search);
  const onb = qs.get('onb') === '1';                   // primeiro acesso: vem do onboarding e segue para as trilhas
  const nx = qs.get('next');
  const proximo = nx && /^[a-z0-9_\-]+\.html(\?.*)?$/i.test(nx) ? nx : 'trilhas.html';
  let p = B.progresso.ler();
  let salvo = A.limpar(p.avatarCfg || A.padrao());     // o que está gravado na conta
  let cfg = Object.assign({}, salvo);                   // o que está sendo montado
  let aba = A.DATA.abas[0].id;
  let sub = null;
  let zoom = 'corpo';
  let msg = null;
  let ocupado = false;

  const tem = (cat, it) => it.preco === 0 || (p.avatarPecas || []).indexOf(cat + ':' + it.id) !== -1;
  const igual = (a, b) => A.DATA.cats.every((c) => a[c.id] === b[c.id]);
  const moeda = (n) => `<span class="av-moeda">${ICONS.coin}${n}</span>`;
  const NOMES_ABA = { foto: 'FOTO DE PERFIL', corpo: 'ROSTO', cabelo: 'CABELO', barba: 'BARBA', manto: 'MANTO', cabeca: 'CHAPÉUS', acessorios: 'ACESSÓRIOS', cajado: 'CAJADO', pet: 'COMPANHEIROS' };
  const PADRAO_VAZIO = { nenhum: 1, nenhuma: 1 };

  function estado(cat, it) {
    const equipado = cfg[cat.id] === it.id;
    const dono = tem(cat.id, it);
    if (equipado) return dono ? 'equipado' : 'equipado-a-comprar';
    if (it.preco === 0) return 'disponivel';
    return dono ? 'comprado' : 'bloqueado';
  }
  const ROTULO_ESTADO = { 'equipado': 'Equipado', 'equipado-a-comprar': 'Equipado, será comprado ao salvar', 'disponivel': 'Disponível', 'comprado': 'Comprado', 'bloqueado': 'Bloqueado' };

  function arte(cat, it) {
    if (cat.tipo === 'cor') {
      const ex = it.extra ? `<i style="background:${it.extra.O}"></i>` : '';
      return `<span class="px-cor ${ex ? 'duo' : ''}" style="background:${it.cor}">${ex}</span>`;
    }
    const prev = Object.assign({}, cfg); prev[cat.id] = it.id;
    return `<span class="px-mini">${A.svg(prev, { crop: cat.crop, semFundo: true })}</span>`;
  }

  function opcao(cat, it) {
    const st = estado(cat, it);
    const faltam = it.preco > p.moedas ? it.preco - p.moedas : 0;
    let selo = '';
    if (st === 'equipado' || st === 'equipado-a-comprar') selo = `<i class="px-sel" aria-hidden="true">${ICONS.check}</i>`;
    else if (st === 'comprado') selo = '<i class="px-own" aria-hidden="true">SEU</i>';
    else if (st === 'bloqueado') selo = `<i class="px-lock ${faltam ? 'sem' : 'ok'}" aria-hidden="true">${ICONS.lock}<b>${it.preco}</b></i>`;
    if (st === 'equipado-a-comprar') selo += `<i class="px-lock ${faltam ? 'sem' : 'ok'} px-lock-b" aria-hidden="true">${ICONS.coin}<b>${it.preco}</b></i>`;
    const dica = `${it.nome} — ${ROTULO_ESTADO[st]}${it.preco > 0 && st !== 'comprado' && st !== 'equipado' ? `, ${it.preco} Moedas${faltam ? ` (faltam ${faltam})` : ''}` : ''}`;
    return `<button type="button" class="px-op ${cat.tipo === 'cor' ? 'cor' : ''} est-${st}" data-cat="${cat.id}" data-id="${it.id}" aria-pressed="${cfg[cat.id] === it.id}" aria-label="${esc(dica)}" title="${esc(it.nome)}">${arte(cat, it)}${selo}</button>`;
  }

  function thumbAba(a) {
    const crop = { corpo: [4, 0, 28, 24], cabelo: [4, 0, 28, 24], barba: [4, 8, 28, 32], manto: [2, 20, 30, 48], cabeca: [2, 0, 30, 20], acessorios: [4, 8, 28, 26], cajado: [18, 0, 32, 36], pet: [0, 34, 12, 49] }[a.id] || A.cat(a.cats[0]).crop;
    const amostra = a.id === 'pet' ? Object.assign({}, cfg, { pet: 'gato' }) : (a.id === 'cabeca' && cfg.chapeu === 'nenhum' ? Object.assign({}, cfg, { chapeu: 'aprendiz' }) : cfg);
    return `<span class="px-aba-ic">${A.svg(amostra, { crop, semFundo: true })}</span>`;
  }

  function equipados() {
    const lista = ['manto', 'chapeu', 'cajado', 'pet', 'oculos', 'joia', 'cintura', 'peito', 'estampa'].map((id) => {
      const c = A.cat(id), it = A.item(id, cfg[id]);
      if (!it || PADRAO_VAZIO[it.id] || (id === 'manto' && it.id === 'aprendiz' && false)) return '';
      const paga = it.preco > 0 && !tem(id, it);
      return `<li class="${paga ? 'a-comprar' : ''}" title="${esc(it.nome)}${paga ? ', ' + it.preco + ' Moedas' : ''}"><span class="px-mini">${A.svg(cfg, { crop: c.crop, semFundo: true })}</span>${paga ? `<em>${it.preco}</em>` : ''}</li>`;
    }).join('');
    return lista;
  }

  function render() {
    const f = A.faltando(cfg, p.avatarPecas);
    const mudou = !igual(cfg, salvo);
    const semSaldo = f.total > p.moedas;
    const emFoto = aba === 'foto';
    const abaAtual = A.DATA.abas.find((a) => a.id === aba) || A.DATA.abas[0];
    if (!sub || abaAtual.cats.indexOf(sub) === -1) sub = abaAtual.cats[0];
    const cat = A.cat(sub);
    const rotuloSalvar = f.total > 0 ? `Comprar e salvar · ${f.total}` : 'Salvar avatar';
    const crop = zoom === 'rosto' ? [3, 0, 29, 26] : [0, 0, A.DATA.w, A.DATA.h];
    const eq = equipados();
    const compras = f.lista.map((x) => `<li><span>${esc(x.nome)}</span>${moeda(x.preco)}</li>`).join('');

    host.innerHTML = `
      <div class="pxe">
        <div class="pxe-topo"><h1>${onb ? 'Crie seu mago' : 'Meu avatar'}</h1><div class="pxe-saldo" title="Suas Moedas">${ICONS.coin}<b>${p.moedas}</b><span>Moedas</span></div></div>
        ${onb ? '<p class="pxe-onb">Monte o mago que vai te acompanhar nas fases, nas batalhas e no ranking. Peças com cadeado custam Moedas, que você ganha estudando. Dá para mudar depois no perfil.</p>' : ''}
        <div class="pxe-corpo">
          <section class="pxe-palco" aria-label="Pré-visualização do avatar">
            <div class="pxe-tela ${zoom}">${A.svg(cfg, { crop, corpo: true })}</div>
            <div class="pxe-ctrl">
              <button type="button" class="pxe-bt" id="av-zoom">${zoom === 'corpo' ? 'Ver rosto' : 'Ver corpo'}</button>
              <button type="button" class="pxe-bt" id="av-sortear">Aleatório</button>
              <button type="button" class="pxe-bt" id="av-desfazer" ${mudou ? '' : 'disabled'}>Desfazer</button>
            </div>
            ${eq ? `<div class="pxe-eq"><h2>Equipado</h2><ul class="pxe-eqlista">${eq}</ul></div>` : ''}
            <div class="pxe-resumo">
              ${compras ? `<h2>A comprar</h2><ul class="pxe-compras">${compras}</ul>` : ''}
              <div class="pxe-total"><span>Total</span><b>${ICONS.coin}${f.total}</b></div>
              ${semSaldo ? `<p class="pxe-aviso" role="alert">Faltam ${f.total - p.moedas} Moedas. Conclua fases para ganhar mais ou troque as peças pagas.</p>` : ''}
              ${msg ? `<p class="pxe-aviso ${msg.ok ? 'ok' : ''}" role="status">${esc(msg.texto)}</p>` : ''}
              <button class="pxe-salvar" id="av-salvar" type="button" ${((!mudou && p.avatarAtivo === 'custom') || semSaldo || ocupado) ? 'disabled' : ''}>${esc(rotuloSalvar)}</button>
            </div>
          </section>
          <section class="pxe-catalogo">
            <nav class="pxe-nav" role="tablist" aria-label="Partes do avatar">
              ${A.DATA.abas.map((a) => `<button type="button" role="tab" class="pxe-aba" data-aba="${a.id}" aria-selected="${a.id === aba}" title="${esc(a.nome)}">${thumbAba(a)}<span>${NOMES_ABA[a.id] || esc(a.nome)}</span></button>`).join('')}
              <button type="button" role="tab" class="pxe-aba" data-aba="foto" aria-selected="${emFoto}" title="Foto de perfil"><span class="px-aba-ic">${p.avatarCfg ? A.svg(p.avatarCfg, { crop: A.DATA.busto, semFundo: true }) : ''}</span><span>${NOMES_ABA.foto}</span></button>
            </nav>
            ${emFoto ? painelFoto() : ''}
            ${emFoto ? '' : abaAtual.cats.length > 1 ? `<div class="pxe-sub" role="tablist">${abaAtual.cats.map((id) => `<button type="button" class="pxe-subb" data-sub="${id}" aria-selected="${id === sub}">${esc(A.cat(id).nome)}</button>`).join('')}</div>` : `<h2 class="pxe-cat">${esc(cat.nome)}</h2>`}
            ${emFoto ? '' : `<div class="pxe-grade ${cat.tipo === 'cor' ? 'cores' : ''}" role="group" aria-label="${esc(cat.nome)}">${cat.itens.map((it) => opcao(cat, it)).join('')}</div>`}
            <p class="pxe-legenda" ${emFoto ? 'hidden' : ''}><span class="l-eq">${ICONS.check}</span> equipado <span class="l-own">SEU</span> comprado <span class="l-lock">${ICONS.lock}</span> bloqueado: custa Moedas</p>
          </section>
        </div>
        ${onb ? `<div class="pxe-onb-nav"><a class="pxe-bt pxe-continuar" id="av-continuar" href="${esc(proximo)}">${mudou ? 'Continuar sem salvar' : (p.avatarAtivo === 'custom' ? 'Continuar para as trilhas' : 'Continuar com o avatar padrão')}</a></div>` : ''}
      </div>`;
    ligar();
  }

  /* Foto de perfil: escolhe o que aparece no cabeçalho, no ranking e ao lado do nome: o avatar (busto) ou uma foto da loja que a pessoa já tem. */
  function painelFoto() {
    const donas = B.avatares.lista.filter((av) => (p.avatares || []).indexOf(av.id) !== -1);
    const card = (id, conteudo, rotulo, desabilitado) => `<button type="button" class="px-op px-foto ${p.avatarAtivo === id || (id === 'inicial' && !p.avatarAtivo) ? 'est-equipado' : ''}" data-foto="${id}" aria-pressed="${p.avatarAtivo === id || (id === 'inicial' && !p.avatarAtivo)}" aria-label="${esc(rotulo)}" title="${esc(rotulo)}" ${desabilitado ? 'disabled' : ''}>${conteudo}${(p.avatarAtivo === id || (id === 'inicial' && !p.avatarAtivo)) ? `<i class="px-sel" aria-hidden="true">${ICONS.check}</i>` : ''}</button>`;
    const inicial = (B.auth.sessao() && B.auth.sessao().nome || '?').trim().charAt(0).toUpperCase() || '?';
    const lista = [
      card('custom', `<span class="px-mini">${p.avatarCfg ? A.svg(p.avatarCfg, { crop: A.DATA.busto }) : ''}</span>`, p.avatarCfg ? 'Foto do meu avatar' : 'Salve o avatar primeiro', !p.avatarCfg),
      ...donas.map((av) => card(av.id, `<span class="px-mini">${B.avatares.svgDe(av)}</span>`, 'Foto da loja')),
      card('inicial', `<span class="px-mini px-inicial">${esc(inicial)}</span>`, 'Inicial do nome')
    ].join('');
    return `<h2 class="pxe-cat">Foto de perfil</h2>
      <p class="pxe-foto-dica">Escolha o que aparece no cabeçalho, no ranking e ao lado do seu nome: a foto do seu avatar ou uma das fotos que você já tem.${donas.length ? '' : ' Você ainda não tem fotos da loja.'} <a href="loja.html">Ver fotos na loja</a></p>
      <div class="pxe-grade pxe-fotos" role="group" aria-label="Foto de perfil">${lista}</div>
      ${msg ? `<p class="pxe-aviso ${msg.ok ? 'ok' : ''}" role="status">${esc(msg.texto)}</p>` : ''}`;
  }

  function manterRolagem(fn) {
    const y = window.scrollY, g = $('.pxe-grade'), gy = g ? g.scrollTop : 0;
    fn();
    window.scrollTo(0, y);
    const g2 = $('.pxe-grade'); if (g2) g2.scrollTop = gy;
  }

  function ligar() {
    $$('[data-aba]', host).forEach((b) => b.addEventListener('click', () => { aba = b.dataset.aba; sub = null; msg = null; render(); }));
    $$('[data-foto]', host).forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.foto === 'inicial' ? null : b.dataset.foto;
      const r = B.avatares.selecionar(id);
      p = B.progresso.ler();
      msg = r.ok ? { ok: true, texto: 'Foto de perfil atualizada.' } : { ok: false, texto: 'Você ainda não tem essa foto.' };
      B.atualizarHeader(); render();
      const novo = $(`.px-foto[data-foto="${b.dataset.foto}"]`); if (novo) novo.focus({ preventScroll: true });
    }));
    $$('[data-sub]', host).forEach((b) => b.addEventListener('click', () => { sub = b.dataset.sub; render(); }));
    $('#av-zoom').addEventListener('click', () => { zoom = zoom === 'corpo' ? 'rosto' : 'corpo'; render(); });
    $$('.px-op', host).forEach((b) => b.addEventListener('click', () => {
      cfg[b.dataset.cat] = b.dataset.id; msg = null;
      if (window.BriifSom) window.BriifSom.tocar('toque');
      manterRolagem(render);
      const novo = $(`.px-op[data-cat="${b.dataset.cat}"][data-id="${b.dataset.id}"]`); if (novo) novo.focus({ preventScroll: true });
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
      if (ocupado) return;
      ocupado = true;                                    // um clique, uma cobrança
      const r = B.avatares.salvarPersonalizado(cfg);
      p = B.progresso.ler();
      if (r.ok) {
        salvo = A.limpar(p.avatarCfg); cfg = Object.assign({}, salvo);
        msg = { ok: true, texto: r.gasto ? `Avatar salvo! Você gastou ${r.gasto} Moedas.` : 'Avatar salvo! Ele já aparece no seu perfil e no ranking.' };
        if (window.BriifSom) window.BriifSom.tocar('acerto');
      } else {
        msg = { ok: false, texto: `Faltam ${r.falta} Moedas para essas peças.` };
      }
      ocupado = false;
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
