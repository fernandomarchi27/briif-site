/* Shared chat entry point. Normal link works with keyboard and without a session. */
(function () {
  'use strict';
  const page = location.pathname.split('/').pop();
  if (page === 'ai.html' || page === 'verificar-email.html' || document.getElementById('ai-launcher')) return;
  const link = document.createElement('a');
  link.id = 'ai-launcher';
  link.className = 'ai-launcher';
  link.href = 'ai.html';
  link.setAttribute('aria-label', 'Abrir BRIIFF AI, assistente de matemática');
  link.title = 'BRIIFF AI';
  link.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H6l-4 3v-11a9 9 0 0 1 18 0Z"/><path d="M6.5 9h9M9 9v6m4-6v6"/></svg>';
  document.body.append(link);
})();
