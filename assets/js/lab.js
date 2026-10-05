(function () {
  'use strict';
  const B = window.Briif;
  const { $, esc, fmt } = B;
  B.iniciar('laboratorio');

  const num = (id) => parseFloat(String($(id).value).trim().replace(',', '.'));
  const sinal = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));
  const termo = (n, v) => { // "+ 3x" / "− 2x"
    const abs = Math.abs(n);
    return `${n < 0 ? '−' : '+'} ${abs === 1 && v ? '' : fmt(abs)}${v}`;
  };
  const lista = (passos) => `<ol class="ex-steps">${passos.map((p) => `<li>${p}</li>`).join('')}</ol>`;
  const resp = (t) => `<div class="ex-answer"><small>Resposta</small>${t}</div>`;
  const erro = (t) => `<p class="err">${esc(t)}</p>`;

  /* ---------- 1º grau: ax + b = cx + d ---------- */
  $('#e-go').addEventListener('click', () => {
    const a = num('#e-a'), b = num('#e-b'), c = num('#e-c'), d = num('#e-d');
    const out = $('#e-out');
    if ([a, b, c, d].some(isNaN)) { out.innerHTML = erro('Preencha os quatro campos com números.'); return; }
    const A = a - c, D = d - b;
    const passos = [
      `Equação: ${fmt(a)}x ${termo(b, '')} = ${fmt(c)}x ${termo(d, '')}`,
      `Leve os termos com x para a esquerda e os números para a direita, trocando o sinal de quem muda de lado: ${fmt(a)}x − ${sinal(c)}x = ${fmt(d)} − ${sinal(b)}`,
      `Reduza: ${fmt(A)}x = ${fmt(D)}`
    ];
    if (A === 0) {
      out.innerHTML = lista(passos) + resp(D === 0 ? 'Infinitas soluções (qualquer x serve, pois 0 = 0).' : 'Sem solução (chegamos em algo impossível, 0 = ' + fmt(D) + ').');
      return;
    }
    const x = D / A;
    passos.push(`Divida os dois lados por ${fmt(A)}: x = ${fmt(D)} ÷ ${sinal(A)}`);
    passos.push(`Conferindo: ${fmt(a)}·${sinal(x)} + ${sinal(b)} = ${fmt(a * x + b)} e ${fmt(c)}·${sinal(x)} + ${sinal(d)} = ${fmt(c * x + d)}`);
    out.innerHTML = lista(passos) + resp('x = ' + fmt(x));
  });

  /* ---------- Bhaskara ---------- */
  $('#b-go').addEventListener('click', () => {
    const a = num('#b-a'), b = num('#b-b'), c = num('#b-c');
    const out = $('#b-out');
    if ([a, b, c].some(isNaN)) { out.innerHTML = erro('Preencha a, b e c com números.'); return; }
    if (a === 0) { out.innerHTML = erro('Com a = 0 a equação deixa de ser do 2º grau. Use a calculadora do 1º grau.'); return; }
    const delta = b * b - 4 * a * c;
    const passos = [
      `Identifique: a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}`,
      `Δ = b² − 4ac = ${sinal(b)}² − 4·${sinal(a)}·${sinal(c)} = ${fmt(b * b)} − ${sinal(4 * a * c)} = ${fmt(delta)}`
    ];
    const xv = -b / (2 * a), yv = -delta / (4 * a);
    let r;
    if (delta < 0) {
      passos.push('Como Δ < 0, não existe raiz quadrada real. A equação não tem raízes reais.');
      r = 'Sem raízes reais';
    } else if (delta === 0) {
      const x = -b / (2 * a);
      passos.push('Como Δ = 0, há uma única raiz (raiz dupla).');
      passos.push(`x = −b ÷ 2a = ${sinal(-b)} ÷ ${fmt(2 * a)} = ${fmt(x)}`);
      r = 'x = ' + fmt(x);
    } else {
      const s = Math.sqrt(delta);
      const x1 = (-b + s) / (2 * a), x2 = (-b - s) / (2 * a);
      passos.push(`Como Δ > 0, há duas raízes reais. √Δ = ${fmt(s)}`);
      passos.push(`x = (−b ± √Δ) ÷ 2a = (${fmt(-b)} ± ${fmt(s)}) ÷ ${fmt(2 * a)}`);
      passos.push(`x′ = (${fmt(-b)} + ${fmt(s)}) ÷ ${fmt(2 * a)} = ${fmt(x1)}`);
      passos.push(`x″ = (${fmt(-b)} − ${fmt(s)}) ÷ ${fmt(2 * a)} = ${fmt(x2)}`);
      r = `x′ = ${fmt(x1)} e x″ = ${fmt(x2)}`;
    }
    passos.push(`Vértice da parábola: xv = −b ÷ 2a = ${fmt(xv)} e yv = −Δ ÷ 4a = ${fmt(yv)}. A parábola abre para ${a > 0 ? 'cima' : 'baixo'}.`);
    out.innerHTML = lista(passos) + resp(r);
  });

  /* ---------- Pitágoras ---------- */
  $('#p-modo').addEventListener('change', () => {
    const hip = $('#p-modo').value === 'hip';
    $('#p-l1').textContent = hip ? 'Cateto b' : 'Hipotenusa a';
    $('#p-l2').textContent = hip ? 'Cateto c' : 'Cateto b';
    $('#p-x').value = hip ? '6' : '13';
    $('#p-y').value = hip ? '8' : '5';
  });
  $('#p-go').addEventListener('click', () => {
    const hip = $('#p-modo').value === 'hip';
    const x = num('#p-x'), y = num('#p-y');
    const out = $('#p-out');
    if (isNaN(x) || isNaN(y) || x <= 0 || y <= 0) { out.innerHTML = erro('Digite dois números positivos.'); return; }
    if (hip) {
      const q = x * x + y * y;
      out.innerHTML = lista([
        `a² = b² + c² = ${fmt(x)}² + ${fmt(y)}² = ${fmt(x * x)} + ${fmt(y * y)} = ${fmt(q)}`,
        `a = √${fmt(q)}`
      ]) + resp('a = ' + fmt(Math.sqrt(q), 4));
    } else {
      if (y >= x) { out.innerHTML = erro('A hipotenusa é sempre o maior lado. Ela precisa ser maior que o cateto.'); return; }
      const q = x * x - y * y;
      out.innerHTML = lista([
        `c² = a² − b² = ${fmt(x)}² − ${fmt(y)}² = ${fmt(x * x)} − ${fmt(y * y)} = ${fmt(q)}`,
        `c = √${fmt(q)}`
      ]) + resp('c = ' + fmt(Math.sqrt(q), 4));
    }
  });

  /* ---------- Estatística ---------- */
  $('#s-go').addEventListener('click', () => {
    const out = $('#s-out');
    const bruto = $('#s-lista').value.split(/[\s;]+/).filter(Boolean);
    const v = bruto.map((t) => parseFloat(t.replace(',', '.')));
    if (v.length < 2 || v.some(isNaN)) { out.innerHTML = erro('Digite pelo menos dois números válidos, separados por espaço ou ponto e vírgula.'); return; }
    const n = v.length;
    const ord = v.slice().sort((a, b) => a - b);
    const soma = v.reduce((a, b) => a + b, 0);
    const media = soma / n;

    const cont = {};
    v.forEach((x) => { cont[x] = (cont[x] || 0) + 1; });
    const maxF = Math.max(...Object.values(cont));
    const modas = maxF === 1 ? [] : Object.keys(cont).filter((k) => cont[k] === maxF).map(Number).sort((a, b) => a - b);

    let med, medTxt;
    if (n % 2) { med = ord[(n - 1) / 2]; medTxt = `Com ${n} valores (ímpar), a mediana é o do meio: ${fmt(med)}`; }
    else { const p = ord[n / 2 - 1], q = ord[n / 2]; med = (p + q) / 2; medTxt = `Com ${n} valores (par), a mediana é a média dos dois do meio: (${fmt(p)} + ${fmt(q)}) ÷ 2 = ${fmt(med)}`; }

    const desv = v.map((x) => x - media);
    const quad = desv.map((d) => d * d);
    const somaQ = quad.reduce((a, b) => a + b, 0);
    const variancia = somaQ / n;
    const dp = Math.sqrt(variancia);

    out.innerHTML = lista([
      `Em ordem crescente: ${ord.map((x) => fmt(x)).join(', ')}`,
      `Média = soma ÷ quantidade = ${fmt(soma)} ÷ ${n} = ${fmt(media)}`,
      modas.length ? `Moda = valor que mais se repete (${maxF} vezes): ${modas.map((x) => fmt(x)).join(' e ')}` : 'Moda: nenhum valor se repete, então não há moda.',
      medTxt,
      `Desvios (valor − média): ${desv.map((d) => fmt(d, 2)).join(', ')}`,
      `Quadrados dos desvios: ${quad.map((d) => fmt(d, 2)).join(', ')}, com soma ${fmt(somaQ, 3)}`,
      `Variância = ${fmt(somaQ, 3)} ÷ ${n} = ${fmt(variancia, 3)}`,
      `Desvio padrão = √${fmt(variancia, 3)} = ${fmt(dp, 3)}`,
      `Amplitude = maior − menor = ${fmt(ord[n - 1])} − ${fmt(ord[0])} = ${fmt(ord[n - 1] - ord[0])}`
    ]) + resp(`Média ${fmt(media, 3)} · Mediana ${fmt(med, 3)} · Desvio padrão ${fmt(dp, 3)}`);
  });

  ['#e-go', '#b-go', '#p-go', '#s-go'].forEach((s) => $(s).click());

  /* som ao calcular */
  ['#e-go', '#b-go', '#p-go', '#s-go'].forEach((id) => {
    const b = $(id);
    if (b) b.addEventListener('click', () => { if (window.BriifSom) window.BriifSom.tocar('calcular'); });
  });
})();
