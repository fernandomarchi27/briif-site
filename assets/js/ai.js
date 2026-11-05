(function () {
  'use strict';
  const B = window.Briif, $ = s => document.querySelector(s);
  B.iniciar('ai');
  const toggleHistory = (open) => {
    $('.ai-workspace').classList.toggle('history-open', open);
    $('#history-toggle').setAttribute('aria-expanded', String(open));
  };
  $('#history-toggle').onclick = () => toggleHistory(!$('.ai-workspace').classList.contains('history-open'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleHistory(false); });
  let fb, user, available = false, sending = false, quota, chatId = crypto.randomUUID(), lastUser;
  function error(text) { $('#ai-error').textContent = text || ''; $('#ai-error').hidden = !text; }
  function controls() {
    $('#send').disabled = !available || !user || !user.emailVerified || sending || (quota && Math.min(quota.individual, quota.global, quota.provider) <= 0);
    $('#send').textContent = sending ? 'Pensando…' : 'Enviar ↑';
    ['#new-chat','#delete-all','#link-google'].forEach(s => { $(s).disabled = sending; });
    $('#chats').querySelectorAll('button').forEach(b => { b.disabled = sending; });
  }
  async function api(path, options = {}) {
    if (!user) throw Error('Entre na sua conta.');
    const token = await user.getIdToken();
    const headers = {'Content-Type':'application/json','Authorization':'Bearer '+token};
    if (window.BRIIFF_AI_CONFIG?.appCheckSiteKey) {
      const { token: attestation } = await fb.appCheck().getToken();
      headers['X-Firebase-AppCheck'] = attestation;
    }
    const response = await fetch(path, {...options,headers,cache:'no-store'});
    const body = await response.json();
    if (!response.ok) throw Error(body.error || 'O serviço não respondeu.');
    return body;
  }
  function append(role, text) {
    const item = document.createElement('article'); item.className = 'ai-message '+role;
    const label = document.createElement('strong'); label.textContent = role === 'user' ? 'Você' : 'BRIIFF AI';
    const content = document.createElement('div'); content.textContent = text;
    item.append(label,content); $('#messages').append(item);
    if (role !== 'user' && window.renderMathInElement) {
      renderMathInElement(content, {delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,trust:false,strict:'ignore',maxExpand:500,maxSize:20});
    }
    $('#messages').scrollTop = $('#messages').scrollHeight;
  }
  function welcome() {
    $('#messages').replaceChildren();
    append('model','Olá! Sou o BRIIFF AI. Conte onde você travou ou mostre a sua tentativa. Vamos encontrar o próximo passo juntos.');
    $('#suggestions').hidden = false;
  }
  async function usage() {
    quota = await api('/api/usage');
    $('#quota').textContent = `${quota.individual} suas · ${quota.global} da turma · ${quota.provider} do provedor restantes`;
    if (Math.min(quota.individual,quota.global,quota.provider) <= 0) error('Um dos limites diários foi atingido. Aguarde a renovação da cota correspondente.');
    controls();
  }
  async function history() {
    const list = await api('/api/conversations');
    $('#chats').replaceChildren();
    for (const chat of list) {
      const row = document.createElement('div'); row.className = 'ai-chat-row';
      const open = document.createElement('button'); open.type = 'button'; open.textContent = chat.title;
      open.className = 'ai-open-chat';
      open.title = chat.title;
      open.setAttribute('aria-current',String(chat.id === chatId));
      open.onclick = async () => {
        if (sending) return;
        try {
          const conversation = await api('/api/conversations/'+chat.id);
          chatId = chat.id; $('#messages').replaceChildren();
          conversation.messages.forEach(m => append(m.role,m.text));
          $('#suggestions').hidden = true; toggleHistory(false); error(''); await history();
        } catch (e) { error(e.message); }
      };
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'ai-delete-chat'; remove.title = 'Excluir conversa'; remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6m4-6v6"/></svg>'; remove.setAttribute('aria-label','Excluir conversa '+chat.title);
      remove.onclick = async () => {
        if (sending || !confirm('Excluir esta conversa? Esta ação não pode ser desfeita.')) return;
        try {
          await api('/api/conversations/'+chat.id,{method:'DELETE'});
          if (chatId === chat.id) newChat();
          await history();
        } catch (e) { error(e.message); }
      };
      row.append(open,remove); $('#chats').append(row);
    }
    controls();
  }
  function newChat() { toggleHistory(false); chatId = crypto.randomUUID(); welcome(); error(''); $('#question').value = ''; $('#characters').textContent='0 / 2.000'; }
  $('#new-chat').onclick = () => { if (!sending) {newChat(); if (user && user.emailVerified) history().catch(e=>error(e.message));} };
  $('#question').oninput = () => { $('#characters').textContent = $('#question').value.length+' / 2.000'; };
  $('#suggestions').querySelectorAll('button').forEach(b=> { b.onclick = () => { $('#question').value=b.textContent; $('#question').dispatchEvent(new Event('input')); $('#question').focus(); }; });
  $('#delete-all').onclick = async () => {
    if (sending || !user || !confirm('Excluir todo o seu histórico do BRIIFF AI? Os limites diários serão mantidos.')) return;
    try {
      let result;
      do { result = await api('/api/conversations',{method:'DELETE'}); } while (result.deleted === 100);
      newChat(); await history();
    } catch(e) { error(e.message); }
  };
  $('#verify').onclick = async () => {
    try { await user.sendEmailVerification(); error('Enviamos o link de verificação. Confira também o spam.'); }
    catch (e) { error(B.auth.erroAmigavel(e)); }
  };
  $('#refresh-auth').onclick = async () => {
    try { await user.reload(); await user.getIdToken(true); await authChanged(fb.auth().currentUser); }
    catch(e) { error(B.auth.erroAmigavel(e)); }
  };
  $('#link-google').onclick = async () => {
    try { await B.auth.vincularGoogle(); await authChanged(fb.auth().currentUser); error('Conta Google vinculada com segurança.'); }
    catch (e) { error(e.code === 'auth/credential-already-in-use' ? 'Essa conta Google já pertence a outra conta. Nenhum histórico foi mesclado. Entre na conta correta.' : B.auth.erroAmigavel(e)); }
  };
  $('#chat-form').onsubmit = async ev => {
    ev.preventDefault();
    if ($('#send').disabled) return;
    const text = $('#question').value.trim(); if (!text) return;
    sending = true; controls(); error(''); $('#suggestions').hidden = true;
    const pending = document.createElement('p'); pending.className='ai-small'; pending.textContent = 'BRIIFF AI está pensando…'; pending.setAttribute('role','status');
    append('user',text); $('#messages').append(pending);
    try {
      const response = await api('/api/messages',{method:'POST',body:JSON.stringify({text,conversationId:chatId,requestId:crypto.randomUUID(),level:$('#level').value})});
      append('model',response.answer); $('#question').value=''; $('#characters').textContent='0 / 2.000';
      quota = response.usage; await history();
    } catch(e) {
      error(e.message+' Envios já reservados podem consumir a cota mesmo sem resposta.');
    } finally {
      pending.remove(); sending = false;
      try { await usage(); } catch(e) { error(e.message); }
      controls();
    }
  };
  async function authChanged(next) {
    user = next;
    if (B.auth.exigirVerificacao(user, 'ai.html')) return;
    if (lastUser !== user?.uid) { newChat(); $('#chats').replaceChildren(); quota = null; }
    lastUser = user?.uid;
    const ok = user && !user.isAnonymous && user.emailVerified;
    $('#ai-access').hidden = !!ok;
    $('#verify').hidden = !user || user.isAnonymous || user.emailVerified;
    $('#refresh-auth').hidden = $('#verify').hidden;
    $('#link-google').hidden = !ok || user.providerData.some(p=>p.providerId==='google.com');
    controls();
    if (ok) {
      try { await Promise.all([history(),usage()]); } catch(e) { error(e.message); }
    }
  }
  async function start() {
    welcome();
    try {
      const response = await fetch('/api/status',{cache:'no-store'});
      if (!response.ok) throw Error('backend-unavailable');
      const status = await response.json();
      available = status.ready;
      $('#ai-status').textContent = status.ready ? 'Ambiente de testes · suas conversas ficam na sua conta.' : status.message;
      if (!status.firebase) {
        $('#ai-access').hidden = true;
        error('O ambiente de testes ainda não foi configurado. O login de demonstração das outras páginas não dá acesso à IA. Consulte docs/BRIIFF_AI.md na pasta do projeto.');
        controls(); return;
      }
      fb = await B.auth.firebase();
      const key = window.BRIIFF_AI_CONFIG.appCheckSiteKey;
      if (key) {
        await new Promise((resolve,reject)=>{ const s=document.createElement('script');s.src='assets/vendor/firebase/firebase-app-check-compat.js';s.onload=resolve;s.onerror=reject;document.head.append(s); });
        fb.appCheck().activate(key,true);
      }
      fb.auth().onAuthStateChanged(authChanged);
    } catch(e) { error('O BRIIFF AI está indisponível neste endereço no momento. Tente novamente mais tarde.'); }
    controls();
  }
  // Refresh when returning from another device/tab; no background Firestore polling.
  document.addEventListener('visibilitychange',()=> {
    if (!document.hidden && user?.emailVerified && !sending) Promise.all([history(),usage()]).catch(e=>error(e.message));
  });
  start();
})();
