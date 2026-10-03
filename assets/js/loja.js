(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc, ICONS } = B;
  B.iniciar('loja');

  const host = $('#loja');
  let mensagem = null;       // { ok, texto } — feedback da última compra (bloqueio)
  let avatarMsg = null;      // { ok, texto } — feedback de compra/uso de avatar
  let configAberta = false;  // painel de configurações (engrenagem)
  let codigoDigitado = '';   // mantém o que a pessoa já tinha digitado ao reabrir
  let codigoValidado = null; // null = ainda não conferiu; true/false = resultado da última conferência
  let codigoMsg = null;      // { ok, texto } — feedback do resgate do código

  function render() {
    const p = B.progresso.ler();
    const custo = B.loja.custoBloqueio;
    const daPra = p.moedas >= custo;
    const limite = B.loja.limiteCodigoMoedas;

    const pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
    const faltam = (preco) => Math.max(0, preco - p.moedas);

    host.innerHTML = `
      <section class="shop-hero">
        <div class="shop-hero-text">
          <h1>Loja</h1>
          <p>Troque as MathCoins que você ganha completando fases por proteção e personagens.</p>
        </div>
        <div class="wallet" aria-label="Sua carteira">
          <div class="wallet-item moeda">${ICONS.coin}<div><b>${p.moedas.toLocaleString('pt-BR')}</b><span>MathCoins</span></div></div>
          <div class="wallet-item bloqueio">${ICONS.bloqueio}<div><b>${p.bloqueios || 0}</b><span>${(p.bloqueios || 0) === 1 ? 'bloqueio' : 'bloqueios'}</span></div></div>
          <button class="loja-config-btn" id="loja-config-btn" type="button" aria-expanded="${configAberta}" aria-controls="loja-config-painel" title="Código promocional" aria-label="Código promocional">${ICONS.config}</button>
        </div>
      </section>

      ${configAberta ? `
        <div class="tool loja-config-painel" id="loja-config-painel">
          <h2>Código promocional</h2>
          <div class="loja-codigo">
            <label for="loja-codigo-campo">Tem um código? Digite aqui.</label>
            <div class="loja-codigo-linha">
              <input id="loja-codigo-campo" type="text" placeholder="#000000" maxlength="7" value="${esc(codigoDigitado)}" autocomplete="off" spellcheck="false">
              <button class="btn btn-ink btn-sm" id="loja-codigo-validar" type="button">Validar</button>
            </div>
            ${codigoValidado === false ? `<p class="loja-codigo-erro">Código inválido. Confira e tente de novo.</p>` : ''}
            ${codigoValidado === true ? `
              <div class="loja-codigo-ok">
                <p>Código válido! Quantas MathCoins você quer resgatar? (até ${limite.toLocaleString('pt-BR')})</p>
                <div class="loja-codigo-linha">
                  <input id="loja-codigo-qtd" type="number" min="1" max="${limite}" step="1" value="${limite}">
                  <button class="btn btn-coral btn-sm" id="loja-codigo-resgatar" type="button">Resgatar</button>
                </div>
              </div>` : ''}
            ${codigoMsg ? `<p class="${codigoMsg.ok ? 'loja-codigo-sucesso' : 'loja-codigo-erro'}">${esc(codigoMsg.texto)}</p>` : ''}
          </div>
        </div>` : ''}

      ${mensagem ? `<div class="shop-aviso ${mensagem.ok ? 'ok' : 'no'}" role="status">${esc(mensagem.texto)}</div>` : ''}

      <div class="shop-secao-head">
        <h2>Proteção</h2>
        <p>Mantenha sua ofensiva mesmo se faltar um dia.</p>
      </div>
      <article class="shop-destaque">
        <div class="shop-art bloqueio">
          <span class="shop-selo">Mais útil</span>
          <span class="shop-art-img">${ICONS.bloqueio}</span>
        </div>
        <div class="shop-destaque-info">
          <h3>Bloqueio de ofensiva</h3>
          <p>Se um dia passar em branco, um bloqueio é usado sozinho e sua ofensiva não zera.</p>
          <ul class="shop-lista">
            <li>${ICONS.check}<span>Você ganha <b>2</b> ao criar a conta</span></li>
            <li>${ICONS.check}<span>Mais <b>1</b> toda vez que sobe de nível</span></li>
            <li>${ICONS.check}<span>Você tem <b>${pl(p.bloqueios || 0, 'bloqueio', 'bloqueios')}</b> agora</span></li>
          </ul>
          <div class="shop-compra">
            <span class="shop-preco">${ICONS.coin}<b>${custo}</b></span>
            <button class="btn btn-coral" id="comprar-bloqueio" type="button" ${daPra ? '' : 'disabled'}>${daPra ? 'Comprar bloqueio' : `Faltam ${faltam(custo)} MathCoins`}</button>
          </div>
        </div>
      </article>

      <div class="shop-secao-head">
        <h2>Avatares</h2>
        <p>Troque sua foto de perfil por um destes personagens.</p>
      </div>
      ${avatarMsg ? `<div class="shop-aviso ${avatarMsg.ok ? 'ok' : 'no'}" role="status">${esc(avatarMsg.texto)}</div>` : ''}
      <div class="shop-grid">
        ${B.avatares.lista.map((av) => {
          const tem = (p.avatares || []).indexOf(av.id) !== -1;
          const ativo = p.avatarAtivo === av.id;
          const pode = p.moedas >= av.preco;
          return `
          <article class="shop-card ${ativo ? 'em-uso' : ''} ${tem ? 'tenho' : ''}">
            <div class="shop-art avatar-fundo" style="--av:${av.cor}">
              ${ativo ? `<span class="shop-selo ok">Em uso</span>` : tem ? `<span class="shop-selo">Seu</span>` : ''}
              <span class="avatar-preview">${av.svg}</span>
            </div>
            <div class="shop-card-corpo">
              <h3>${esc(av.nome)}</h3>
              ${ativo
                ? `<button class="btn btn-ink btn-sm" type="button" disabled>${ICONS.check} Em uso</button>`
                : tem
                  ? `<button class="btn btn-ink btn-sm" data-usar="${av.id}" type="button">Usar</button>`
                  : `<div class="shop-compra pequena">
                       <span class="shop-preco">${ICONS.coin}<b>${av.preco}</b></span>
                       <button class="btn btn-coral btn-sm" data-comprar="${av.id}" type="button" ${pode ? '' : 'disabled'}>${pode ? 'Comprar' : `Faltam ${faltam(av.preco)}`}</button>
                     </div>`}
            </div>
          </article>`;
        }).join('')}
      </div>
      ${p.avatarAtivo ? `<button class="onb-skip" id="avatar-padrao" type="button" style="display:block;margin:18px auto 0">Voltar pra foto/inicial padrão</button>` : ''}

      <p class="loja-em-breve">Mais produtos chegando em breve.</p>
    `;

    $('#loja-config-btn').addEventListener('click', () => {
      configAberta = !configAberta;
      if (!configAberta) { codigoValidado = null; codigoMsg = null; }
      render();
    });

    const btnComprar = $('#comprar-bloqueio');
    if (btnComprar) {
      btnComprar.addEventListener('click', () => {
        const r = B.loja.comprarBloqueio();
        mensagem = r.ok
          ? { ok: true, texto: 'Comprado! Você já tem ' + (r.progresso.bloqueios || 0) + (r.progresso.bloqueios === 1 ? ' bloqueio de ofensiva.' : ' bloqueios de ofensiva.') }
          : { ok: false, texto: 'Você ainda não tem MathCoins suficientes. Continue completando fases para ganhar mais.' };
        if (window.BriifSom) window.BriifSom.tocar(r.ok ? 'compra' : 'negado');
        render();
        B.atualizarHeader();
      });
    }

    host.querySelectorAll('[data-comprar]').forEach((b) => {
      b.addEventListener('click', () => {
        const r = B.avatares.comprar(b.dataset.comprar);
        avatarMsg = r.ok
          ? { ok: true, texto: 'Avatar comprado! Clique em "Usar" para colocá-lo no seu perfil.' }
          : { ok: false, texto: 'Você ainda não tem MathCoins suficientes pra esse avatar.' };
        if (window.BriifSom) window.BriifSom.tocar(r.ok ? 'compra' : 'negado');
        render();
        B.atualizarHeader();
      });
    });
    host.querySelectorAll('[data-usar]').forEach((b) => {
      b.addEventListener('click', () => {
        B.avatares.selecionar(b.dataset.usar);
        avatarMsg = { ok: true, texto: 'Pronto! Esse é o seu avatar agora.' };
        render();
        B.atualizarHeader();
      });
    });
    const btnPadrao = $('#avatar-padrao');
    if (btnPadrao) {
      btnPadrao.addEventListener('click', () => {
        B.avatares.selecionar(null);
        avatarMsg = null;
        render();
        B.atualizarHeader();
      });
    }

    if (configAberta) {
      const campo = $('#loja-codigo-campo');
      campo.addEventListener('input', () => { codigoDigitado = campo.value; });
      campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#loja-codigo-validar').click(); } });
      $('#loja-codigo-validar').addEventListener('click', () => {
        codigoDigitado = campo.value;
        codigoMsg = null;
        codigoValidado = B.loja.validarCodigoMoedas(codigoDigitado);
        render();
      });
      const btnResgatar = $('#loja-codigo-resgatar');
      if (btnResgatar) {
        btnResgatar.addEventListener('click', () => {
          const qtd = Number($('#loja-codigo-qtd').value);
          const r = B.loja.resgatarCodigoMoedas(codigoDigitado, qtd);
          if (window.BriifSom) window.BriifSom.tocar(r.ok ? 'moeda' : 'negado');
          if (r.ok) {
            codigoMsg = { ok: true, texto: `Resgatado! +${r.quantidade.toLocaleString('pt-BR')} MathCoins.` };
            codigoValidado = null;
            codigoDigitado = '';
            B.atualizarHeader();
          } else if (r.motivo === 'limite') {
            codigoMsg = { ok: false, texto: `O máximo por resgate é ${limite.toLocaleString('pt-BR')} MathCoins.` };
          } else {
            codigoMsg = { ok: false, texto: 'Digite uma quantidade válida.' };
          }
          render();
        });
      }
    }
  }

  render();
  B.aguardarSync().then((mudou) => { if (mudou) render(); });
})();
