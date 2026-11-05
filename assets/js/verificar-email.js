(function () {
  'use strict';
  const B = window.Briif, $ = s => document.querySelector(s);
  B.iniciar('');
  const next = new URLSearchParams(location.search).get('next');
  const destino = next && /^[a-z0-9_-]+\.html(\?.*)?$/i.test(next) && !/^(verificar-email|login)\.html/.test(next) ? next : 'trilhas.html';
  let user, checking = false, lastCheck = 0, resendUntil = 0;
  const status = text => { $('#verify-status').textContent = text; };
  async function conferir(manual = true) {
    if (!user || checking || (!manual && Date.now() - lastCheck < 5000)) return;
    checking = true; lastCheck = Date.now(); $('#verify-check').disabled = true;
    try {
      await user.reload();
      await user.getIdToken(true);
      if (user.emailVerified) { location.replace(destino); return; }
      status('Seu e-mail ainda não foi confirmado. Abra o link que enviamos antes de continuar.');
    } catch (e) { status('Não foi possível conferir agora. Tente novamente.'); }
    finally { checking = false; $('#verify-check').disabled = false; }
  }
  $('#verify-check').onclick = () => conferir();
  $('#verify-resend').onclick = async () => {
    if (!user || Date.now() < resendUntil) return;
    $('#verify-resend').disabled = true;
    resendUntil = Date.now() + 60000;
    try {
      await user.sendEmailVerification();
      resendUntil = Date.now() + 60000;
      status('E-mail de confirmação reenviado. Confira sua caixa de entrada e o spam.');
    } catch (e) { status(e.code === 'auth/too-many-requests' ? 'Aguarde um pouco antes de reenviar o e-mail.' : 'Não foi possível reenviar. Tente novamente mais tarde.'); }
    finally { $('#verify-resend').disabled = false; }
  };
  setInterval(() => {
    const remaining = Math.ceil((resendUntil - Date.now()) / 1000);
    $('#verify-resend').disabled = remaining > 0 || !user;
    $('#verify-resend').textContent = remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar e-mail de confirmação';
  }, 1000);
  $('#verify-exit').onclick = async () => { await B.auth.sair(); location.replace('login.html?next=' + encodeURIComponent(destino)); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) conferir(false); });
  (async () => {
    try {
      user = await B.auth.usuario();
      if (!user || user.isAnonymous) { location.replace('login.html?next=' + encodeURIComponent(destino)); return; }
      $('#verify-address').textContent = user.email || '';
      await conferir();
    } catch (e) { status('Entre na sua conta para confirmar seu e-mail.'); }
  })();
})();
