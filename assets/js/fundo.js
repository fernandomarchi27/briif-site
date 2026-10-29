/* ==========================================================================
   Briiff — fórmulas e símbolos flutuando no fundo (energia arcana na masmorra)
   Leve: poucos elementos, só transform/opacity (GPU), sem JS por frame.
   Respeita "reduzir movimento" (fica parado) e pausa quando a aba está oculta.
   Não captura cliques (pointer-events: none) e fica atrás do conteúdo.
   ========================================================================== */
(function () {
  'use strict';
  if (document.getElementById('fundo-formulas')) return;
  var TEXTOS = ['π', '∑', '√', '∞', 'x²', 'a² + b²', 'Δ = b² − 4ac', '½', '¾', '2x + 3 = 7', 'f(x) = ax + b', 'sen²θ + cos²θ = 1',
    '∫ x dx', '3 × 4 = 12', 'x = −b ± √Δ', '⅔', 'log₂ 8 = 3', 'n!', '≈', '÷', '±', '%', '(a + b)²', 'tan θ', '7 × 8', 'e^x', 'm = Δy/Δx', 'A = πr²'];
  var reduzir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fraco = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
  var larg = Math.max(320, window.innerWidth || 1024);
  var n = Math.max(6, Math.min(16, Math.round(larg / 110)));
  if (fraco) n = Math.min(n, 6);
  if (reduzir) n = Math.min(n, 8);

  var box = document.createElement('div');
  box.id = 'fundo-formulas'; box.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < n; i++) {
    var s = document.createElement('span');
    s.textContent = TEXTOS[(i * 7 + Math.floor(Math.random() * TEXTOS.length)) % TEXTOS.length];
    var tam = 16 + Math.random() * 30;
    s.style.left = (Math.random() * 94) + '%';
    s.style.top = (Math.random() * 92) + '%';
    s.style.fontSize = tam.toFixed(0) + 'px';
    s.style.setProperty('--o', (0.07 + Math.random() * 0.12).toFixed(2));
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
    s.style.setProperty('--dy', (-40 - Math.random() * 90).toFixed(0) + 'px');
    s.style.animationDuration = (45 + Math.random() * 60).toFixed(0) + 's';
    s.style.animationDelay = (-Math.random() * 60).toFixed(0) + 's';
    box.appendChild(s);
  }
  if (reduzir) box.classList.add('parado');
  document.body.insertBefore(box, document.body.firstChild);
  document.addEventListener('visibilitychange', function () { box.classList.toggle('pausa', document.hidden); });
})();
