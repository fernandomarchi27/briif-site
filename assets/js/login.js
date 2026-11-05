(function () {
  'use strict';
  const B = window.Briif;
  const { $, ICONS } = B;
  B.iniciar('');

  B.simbolos($('#auth'), [
    ['π', 44, { top: '40px', left: '4%' }, true],
    ['∞', 36, { top: '90px', right: '6%' }, false],
    ['∑', 28, { top: '38%', right: '10%' }, false],
    ['√x', 24, { top: '48%', left: '5%' }, true],
    ['x²', 30, { bottom: '90px', left: '10%' }, false],
    ['∞', 22, { bottom: '70px', right: '12%' }, true]
  ]);

  // Já está logado? Vai direto para as trilhas.
  const next = new URLSearchParams(location.search).get('next');
  const destino = next && /^[a-z0-9_\-]+\.html(\?.*)?$/i.test(next) ? next : 'trilhas.html';
  const existente = B.auth.sessao();
  if (existente && existente.modo !== 'firebase') { location.replace(destino); return; }
  if (existente && B.auth.firebaseAtivo) {
    B.auth.usuario().then(u => {
      if (u && !B.auth.exigirVerificacao(u, destino)) location.replace(destino);
    }).catch(() => {});
  }

  const real = B.auth.firebaseAtivo;
  let modo = 'entrar'; // entrar | criar

  const btnGoogle = $('#google'), btnGuest = $('#guest'), btnSubmit = $('#submit');
  const rotulos = {
    google: `${ICONS.google}<span>Entrar com Google</span>`,
    guest: `${ICONS.user}<span>Testar como convidado</span>`
  };
  btnGoogle.innerHTML = rotulos.google;
  btnGuest.innerHTML = rotulos.guest;

  function mostrarErro(msg) {
    const e = $('#err');
    if (!msg) { e.hidden = true; return; }
    e.textContent = msg; e.hidden = false;
  }
  function ocupado(btn, on, rotulo) {
    btn.disabled = on;
    btn.innerHTML = on ? '<span class="spinner" aria-label="Carregando"></span>' : rotulo;
  }

  function aplicarModo() {
    const criar = modo === 'criar';
    $('#tab-in').setAttribute('aria-selected', String(!criar));
    $('#tab-up').setAttribute('aria-selected', String(criar));
    btnSubmit.textContent = real ? (criar ? 'Criar conta' : 'Entrar') : 'Entrar em modo demonstração';
    $('#f-nome').hidden = real ? !criar : false;
    $('#f-senha').hidden = !real;
    $('#senha').autocomplete = criar ? 'new-password' : 'current-password';
    mostrarErro('');
  }

  if (real) {
    $('#tabs').hidden = false;
    $('#tab-in').addEventListener('click', () => { modo = 'entrar'; aplicarModo(); });
    $('#tab-up').addEventListener('click', () => { modo = 'criar'; aplicarModo(); });
  } else {
    const d = $('#demo-box');
    d.hidden = false;
    d.innerHTML = '<b>Modo demonstração.</b> O login funciona só neste navegador. Para ligar o login real (Google e e-mail com senha), preencha o arquivo <code>assets/js/firebase-config.js</code>.';
  }
  aplicarModo();
  $('#recuperar').hidden = !real;
  $('#recuperar').addEventListener('click', async () => {
    const email = $('#email').value.trim();
    if (!email) return mostrarErro('Digite seu e-mail para receber a recuperação de senha.');
    try {
      await B.auth.recuperarSenha(email);
      mostrarErro('Se houver uma conta habilitada, você receberá um e-mail de recuperação.');
    } catch (e) { mostrarErro(B.auth.erroAmigavel(e)); }
  });

  // Conta nova? Mostra o tutorial + quiz de boas-vindas antes do destino de sempre.
  async function concluir(contaNova) {
    const proxima = contaNova ? ('onboarding.html?next=' + encodeURIComponent(destino)) : destino;
    if (real) {
      const user = await B.auth.usuario();
      if (B.auth.exigirVerificacao(user, proxima)) return;
    }
    location.href = proxima;
  }

  $('#form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    mostrarErro('');
    const nome = $('#nome').value.trim();
    const email = $('#email').value.trim();
    const senha = $('#senha').value;

    if (!real) {
      if (!nome) { mostrarErro('Digite seu nome para continuar.'); return; }
      const novo = B.auth.demo(nome, email);
      await concluir(novo);
      return;
    }
    if (!email || !senha) { mostrarErro('Preencha e-mail e senha.'); return; }
    if (modo === 'criar' && !nome) { mostrarErro('Digite seu nome para criar a conta.'); return; }
    ocupado(btnSubmit, true);
    try {
      const novo = modo === 'criar' ? await B.auth.criarConta(nome, email, senha) : await B.auth.entrarEmail(email, senha);
      await concluir(novo);
    } catch (e) {
      mostrarErro(B.auth.erroAmigavel(e));
      ocupado(btnSubmit, false, modo === 'criar' ? 'Criar conta' : 'Entrar');
    }
  });

  btnGoogle.addEventListener('click', async () => {
    mostrarErro('');
    if (!real) { mostrarErro('O login com Google será ativado quando o Firebase for configurado. Por enquanto, use o formulário ou entre como convidado.'); return; }
    ocupado(btnGoogle, true);
    try { const novo = await B.auth.google(); await concluir(novo); }
    catch (e) { mostrarErro(B.auth.erroAmigavel(e)); ocupado(btnGoogle, false, rotulos.google); }
  });

  btnGuest.addEventListener('click', async () => {
    mostrarErro('');
    ocupado(btnGuest, true);
    try { const novo = await B.auth.convidado(); await concluir(novo); }
    catch (e) { mostrarErro(B.auth.erroAmigavel(e)); ocupado(btnGuest, false, rotulos.guest); }
  });

  // modo desenvolvedor: o botão só existe quando o ambiente permite (localhost ou flag em ambiente.js)
  if (B.dev && B.dev.permitido()) {
    const btnDev = document.createElement('button');   // criado só quando permitido: em produção nem existe no HTML
    btnDev.type = 'button'; btnDev.id = 'dev-entrar'; btnDev.className = 'dev-link'; btnDev.textContent = 'Entrar como desenvolvedor';
    btnGuest.insertAdjacentElement('afterend', btnDev);
    btnDev.addEventListener('click', async () => {
      mostrarErro('');
      btnDev.disabled = true;
      try { await B.auth.desenvolvedor(); location.href = 'index.html'; }
      catch (e) { btnDev.disabled = false; mostrarErro('O modo desenvolvedor não está disponível neste ambiente.'); }
    });
  }
})();
