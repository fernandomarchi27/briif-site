(function () {
  'use strict';
  const B = window.Briif, $ = s => document.querySelector(s);
  const API_BASE = (window.BRIIFF_AI_CONFIG?.apiBase || '').replace(/\/+$/, '');
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
    const response = await fetch(API_BASE + path, {...options,headers,cache:'no-store'});
    const body = await response.json();
    if (!response.ok) throw Error(body.error || 'O serviço não respondeu.');
    return body;
  }
  function showStart(item) {
    const messages = $('#messages');
    messages.scrollTop += item.getBoundingClientRect().top - messages.getBoundingClientRect().top - parseFloat(getComputedStyle(messages).paddingTop);
  }
  function append(role, text, scroll = true) {
    const item = document.createElement('article'); item.className = 'ai-message '+role;
    const label = document.createElement('strong'); label.textContent = role === 'user' ? 'Você' : 'BRIIFF AI';
    const content = document.createElement('div'); content.textContent = text;
    item.append(label,content); $('#messages').append(item);
    if (role !== 'user' && window.renderMathInElement) {
      renderMathInElement(content, {delimiters:[{left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false},{left:'$',right:'$',display:false}],throwOnError:false,trust:false,strict:'ignore',maxExpand:500,maxSize:20});
    }
    if (scroll) {
      if (role === 'user') $('#messages').scrollTop = $('#messages').scrollHeight;
      else showStart(item);
    }
    return item;
  }
  function welcome() {
    $('#messages').replaceChildren();
    append('model','Onde você travou? Peça uma dica ou mostre sua tentativa.');
    $('#suggestions').hidden = false;
  }
  async function usage() {
    quota = await api('/api/usage');
    $('#quota').textContent = quota.individual === 1 ? '1 mensagem disponível hoje' : `${quota.individual} mensagens disponíveis hoje`;
    if (quota.individual <= 0) error('Suas mensagens de hoje acabaram. Elas renovam à meia-noite de Brasília.');
    else if (Math.min(quota.global,quota.provider) <= 0) error('O assistente está indisponível no momento. Tente mais tarde.');
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
          conversation.messages.forEach(m => append(m.role,m.text,false));
          const lastAnswer = $('#messages').querySelector('.ai-message.model:last-of-type');
          if (lastAnswer) showStart(lastAnswer);
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
  function newChat() { toggleHistory(false); chatId = crypto.randomUUID(); welcome(); error(''); $('#question').value = ''; $('#characters').textContent='0 / 2.000'; $('#characters').hidden = true; }
  $('#new-chat').onclick = () => { if (!sending) {newChat(); if (user && user.emailVerified) history().catch(e=>error(e.message));} };
  $('#question').oninput = () => { $('#characters').textContent = $('#question').value.length+' / 2.000'; $('#characters').hidden = $('#question').value.length < 1800; };
  $('#suggestions').querySelectorAll('button').forEach(b=> { b.onclick = () => { $('#question').value=b.dataset.question || b.textContent; $('#question').dispatchEvent(new Event('input')); $('#question').focus(); }; });
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
      pending.remove(); append('model',response.answer); $('#question').value=''; $('#characters').textContent='0 / 2.000'; $('#characters').hidden = true;
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
  async function serverStatus() {
    const deadline = Date.now() + 95000;
    const delays = [2000, 5000, 10000, 15000, 20000, 10000];
    let lastError;
    for (let attempt = 0; attempt <= delays.length; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(30000, remaining));
      try {
        const response = await fetch(API_BASE + '/api/status', {cache:'no-store', signal:controller.signal});
        if (!response.ok) {
          const e = Error('backend-unavailable');
          e.permanent = response.status < 500;
          throw e;
        }
        return await response.json();
      } catch (e) {
        lastError = e;
        if (e.permanent || attempt === delays.length) throw e;
      } finally { clearTimeout(timer); }
      $('#ai-status').textContent = 'Conectando ao assistente… Na primeira abertura, pode levar cerca de um minuto.';
      await new Promise(resolve => setTimeout(resolve, Math.min(delays[attempt], Math.max(0, deadline-Date.now()))));
    }
    throw lastError || Error('backend-unavailable');
  }
  async function start() {
    welcome();
    try {
      const status = await serverStatus();
      if (status.projectId && status.projectId !== window.BRIIF_FIREBASE_CONFIG?.projectId) throw Error('firebase-project-mismatch');
      available = status.ready;
      $('#ai-status').textContent = status.ready ? '' : status.message;
      $('#ai-status').hidden = !!status.ready;
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
