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
  if (B.auth.sessao()) { location.replace(destino); return; }

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

  // Conta nova? Mostra o tutorial + quiz de boas-vindas antes do destino de sempre.
  function concluir(contaNova) {
    location.href = contaNova ? ('onboarding.html?next=' + encodeURIComponent(destino)) : destino;
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
      concluir(novo);
      return;
    }
    if (!email || !senha) { mostrarErro('Preencha e-mail e senha.'); return; }
    if (modo === 'criar' && !nome) { mostrarErro('Digite seu nome para criar a conta.'); return; }
    ocupado(btnSubmit, true);
    try {
      const novo = modo === 'criar' ? await B.auth.criarConta(nome, email, senha) : await B.auth.entrarEmail(email, senha);
      concluir(novo);
    } catch (e) {
      mostrarErro(B.auth.erroAmigavel(e));
      ocupado(btnSubmit, false, modo === 'criar' ? 'Criar conta' : 'Entrar');
    }
  });

  btnGoogle.addEventListener('click', async () => {
    mostrarErro('');
    if (!real) { mostrarErro('O login com Google será ativado quando o Firebase for configurado. Por enquanto, use o formulário ou entre como convidado.'); return; }
    ocupado(btnGoogle, true);
    try { const novo = await B.auth.google(); concluir(novo); }
    catch (e) { mostrarErro(B.auth.erroAmigavel(e)); ocupado(btnGoogle, false, rotulos.google); }
  });

  btnGuest.addEventListener('click', async () => {
    mostrarErro('');
    ocupado(btnGuest, true);
    try { const novo = await B.auth.convidado(); concluir(novo); }
    catch (e) { mostrarErro(B.auth.erroAmigavel(e)); ocupado(btnGuest, false, rotulos.guest); }
  });
})();
