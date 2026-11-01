/* Vruuum! — a garagem: 10 veículos, todos desenhados aqui em código, vistos de trás (como na corrida).
   Terra: Clássico, GT (traseira redonda), Superesportivo (largo, aerofólio grande), Kart, Monstrão,
   Moto, Skate (animado: a perna empurra o chão, em quadros). Céu: Aviãozinho, Jato, Helicóptero — esses voam (desenho.js troca a estrada por uma rota no
   ar e os obstáculos por pássaros, nuvens de tempestade, anéis e correntes de ar).
   Estilos inspirados em carros esportivos famosos, mas sem marca, logotipo ou nome de fabricante.
   vel e curva: pequenas diferenças (até ~10%) para cada um ter seu jeito sem desequilibrar a corrida. */
(function (raiz) {
  'use strict';
  var S = raiz.VruuumSprites || { util: {} }, U = S.util, EMOJI = S.EMOJI, FONTE = S.FONTE;   // no Node (testes) só a lista importa
  var circ = U.circ, oval = U.oval, caixa = U.caixa, poli = U.poli, linha = U.linha, sombra = U.sombra, brilho = U.brilho;

  function tom(cor, f) {   // f > 0 clareia, f < 0 escurece
    var n = parseInt(cor.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function m(v) { return Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)); }
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function grad(c, y0, y1, a, b) { var g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function pneu(c, x, y, w, h) {
    caixa(c, x, y, w, h, Math.min(w, h) * 0.3, '#15151b');
    c.fillStyle = 'rgba(255,255,255,.08)'; for (var k = 1; k < 4; k++) c.fillRect(x + w * 0.1, y + h * k / 4, w * 0.8, h * 0.04);
  }
  function piloto(c, emoji, x, y, tam, clipFn) {
    if (!emoji) return;   // na corrida o piloto é desenhado por cima, animado (cabeca.js)
    c.save(); if (clipFn) { c.beginPath(); clipFn(); c.clip(); }
    c.font = Math.round(tam) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emoji, x, y);
    c.restore();
  }
  function lanterna(c, x, y, w, h, r) { brilho(c, '#ff2a2a', w * 0.6); caixa(c, x, y, w, h, r, '#ff2a2a'); c.shadowBlur = 0; caixa(c, x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.25, r * 0.5, 'rgba(255,220,220,.7)'); }
  function lanternaRedonda(c, x, y, r) { brilho(c, '#ff2a2a', r * 1.2); circ(c, x, y, r, '#ff2a2a'); c.shadowBlur = 0; circ(c, x - r * 0.25, y - r * 0.25, r * 0.35, 'rgba(255,230,230,.8)'); }
  function placa(c, x, y, w, h, txt) {
    caixa(c, x, y, w, h, h * 0.2, '#fff'); c.fillStyle = '#1a1446'; c.font = '700 ' + Math.round(h * 0.7) + 'px ' + FONTE;
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x + w / 2, y + h * 0.55);
  }
  function escape(c, x, y, r) { circ(c, x, y, r, '#9aa0a6'); circ(c, x, y, r * 0.6, '#2a2a30'); }

  // ---------- terra ----------
  function gt(c, W, H, cor, emoji) {   // traseira redonda e baixa, lanterna em faixa, rabinho de pato
    sombra(c, W, H, 0.48);
    pneu(c, W * 0.03, H * 0.68, W * 0.2, H * 0.32); pneu(c, W * 0.77, H * 0.68, W * 0.2, H * 0.32);
    c.fillStyle = grad(c, H * 0.1, H * 0.85, tom(cor, 0.25), tom(cor, -0.25));
    c.beginPath(); c.moveTo(W * 0.04, H * 0.8); c.bezierCurveTo(W * 0.0, H * 0.45, W * 0.15, H * 0.42, W * 0.28, H * 0.4);
    c.bezierCurveTo(W * 0.33, H * 0.1, W * 0.67, H * 0.1, W * 0.72, H * 0.4); c.bezierCurveTo(W * 0.85, H * 0.42, W * 1.0, H * 0.45, W * 0.96, H * 0.8); c.closePath(); c.fill();
    // vidro traseiro estreito e inclinado
    c.save(); c.beginPath(); c.moveTo(W * 0.34, H * 0.4); c.bezierCurveTo(W * 0.37, H * 0.17, W * 0.63, H * 0.17, W * 0.66, H * 0.4); c.closePath();
    c.fillStyle = grad(c, H * 0.17, H * 0.4, '#bfe6ff', '#4a7fa8'); c.fill(); c.clip();
    piloto(c, emoji, W * 0.5, H * 0.33, H * 0.26); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(W * 0.34, H * 0.17, W * 0.08, H * 0.23); c.restore();
    caixa(c, W * 0.22, H * 0.4, W * 0.56, H * 0.035, H * 0.017, tom(cor, -0.4));   // rabinho de pato
    // faixa de luz de ponta a ponta
    brilho(c, '#ff2a2a', W * 0.04); caixa(c, W * 0.08, H * 0.5, W * 0.84, H * 0.05, H * 0.025, '#d81b1b'); c.shadowBlur = 0;
    lanternaRedonda(c, W * 0.14, H * 0.525, H * 0.05); lanternaRedonda(c, W * 0.86, H * 0.525, H * 0.05);
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 ' + Math.round(H * 0.06) + 'px ' + FONTE; c.textAlign = 'center'; c.fillText('G T', W * 0.5, H * 0.63);
    placa(c, W * 0.38, H * 0.67, W * 0.24, H * 0.08, 'VRUUM');
    caixa(c, W * 0.06, H * 0.78, W * 0.88, H * 0.06, H * 0.03, '#222');
    escape(c, W * 0.44, H * 0.82, H * 0.03); escape(c, W * 0.56, H * 0.82, H * 0.03);
  }
  function superesportivo(c, W, H, cor, emoji) {   // largo e baixo, aerofólio, 4 lanternas redondas
    sombra(c, W, H, 0.5);
    pneu(c, W * 0.02, H * 0.66, W * 0.2, H * 0.34); pneu(c, W * 0.78, H * 0.66, W * 0.2, H * 0.34);
    c.fillStyle = grad(c, H * 0.25, H * 0.85, tom(cor, 0.3), tom(cor, -0.3));
    c.beginPath(); c.moveTo(W * 0.03, H * 0.82); c.lineTo(W * 0.04, H * 0.5); c.quadraticCurveTo(W * 0.1, H * 0.4, W * 0.3, H * 0.38);
    c.lineTo(W * 0.36, H * 0.22); c.lineTo(W * 0.64, H * 0.22); c.lineTo(W * 0.7, H * 0.38); c.quadraticCurveTo(W * 0.9, H * 0.4, W * 0.96, H * 0.5); c.lineTo(W * 0.97, H * 0.82); c.closePath(); c.fill();
    c.save(); c.beginPath(); c.moveTo(W * 0.38, H * 0.37); c.lineTo(W * 0.41, H * 0.25); c.lineTo(W * 0.59, H * 0.25); c.lineTo(W * 0.62, H * 0.37); c.closePath();
    c.fillStyle = grad(c, H * 0.25, H * 0.37, '#a9dcff', '#2c5b80'); c.fill(); c.clip(); piloto(c, emoji, W * 0.5, H * 0.33, H * 0.2); c.restore();
    // entradas de ar laterais
    poli(c, [W * 0.08, H * 0.48, W * 0.26, H * 0.44, W * 0.24, H * 0.5, W * 0.1, H * 0.53], '#1b1b22'); poli(c, [W * 0.92, H * 0.48, W * 0.74, H * 0.44, W * 0.76, H * 0.5, W * 0.9, H * 0.53], '#1b1b22');
    // aerofólio grande em dois pés
    c.fillStyle = '#1b1b22'; c.fillRect(W * 0.25, H * 0.12, W * 0.025, H * 0.28); c.fillRect(W * 0.725, H * 0.12, W * 0.025, H * 0.28);
    caixa(c, W * 0.12, H * 0.06, W * 0.76, H * 0.08, H * 0.03, tom(cor, -0.35)); caixa(c, W * 0.12, H * 0.06, W * 0.76, H * 0.025, H * 0.012, tom(cor, 0.3));
    // grade de colmeia no meio
    caixa(c, W * 0.3, H * 0.55, W * 0.4, H * 0.13, H * 0.03, '#141418');
    c.strokeStyle = '#33333c'; c.lineWidth = H * 0.008; for (var k = 0; k < 9; k++) { c.beginPath(); c.moveTo(W * (0.32 + k * 0.045), H * 0.56); c.lineTo(W * (0.32 + k * 0.045), H * 0.67); c.stroke(); }
    lanternaRedonda(c, W * 0.12, H * 0.6, H * 0.045); lanternaRedonda(c, W * 0.21, H * 0.6, H * 0.045);
    lanternaRedonda(c, W * 0.79, H * 0.6, H * 0.045); lanternaRedonda(c, W * 0.88, H * 0.6, H * 0.045);
    // difusor com aletas e 4 escapes
    caixa(c, W * 0.1, H * 0.74, W * 0.8, H * 0.1, H * 0.03, '#1b1b22');
    c.fillStyle = '#2f2f38'; for (k = 0; k < 6; k++) c.fillRect(W * (0.3 + k * 0.08), H * 0.74, W * 0.012, H * 0.1);
    escape(c, W * 0.18, H * 0.79, H * 0.035); escape(c, W * 0.26, H * 0.79, H * 0.035); escape(c, W * 0.74, H * 0.79, H * 0.035); escape(c, W * 0.82, H * 0.79, H * 0.035);
  }
  function kart(c, W, H, cor, emoji) {
    sombra(c, W, H, 0.5);
    pneu(c, W * 0.0, H * 0.58, W * 0.24, H * 0.42); pneu(c, W * 0.76, H * 0.58, W * 0.24, H * 0.42);
    caixa(c, W * 0.2, H * 0.78, W * 0.6, H * 0.06, H * 0.03, '#9aa0a6');   // eixo
    // piloto de capacete grande
    caixa(c, W * 0.3, H * 0.34, W * 0.4, H * 0.36, W * 0.08, tom(cor, -0.2));   // macacão
    circ(c, W * 0.5, H * 0.24, W * 0.2, '#f5f5f5'); circ(c, W * 0.5, H * 0.24, W * 0.2 * 0.92, cor);
    caixa(c, W * 0.47, H * 0.04, W * 0.06, H * 0.4, W * 0.03, '#ffffff'); circ(c, W * 0.44, H * 0.17, W * 0.03, 'rgba(255,255,255,.5)');   // listra do capacete (nuca)
    piloto(c, emoji, W * 0.5, H * 0.26, H * 0.26);
    caixa(c, W * 0.18, H * 0.6, W * 0.64, H * 0.18, H * 0.05, cor);    // banco/carenagem
    caixa(c, W * 0.18, H * 0.6, W * 0.64, H * 0.05, H * 0.025, tom(cor, 0.35));
    caixa(c, W * 0.34, H * 0.66, W * 0.32, H * 0.1, H * 0.02, '#fff');
    c.fillStyle = '#1a1446'; c.font = '700 ' + Math.round(H * 0.09) + 'px ' + FONTE; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', W * 0.5, H * 0.715);
    caixa(c, W * 0.6, H * 0.5, W * 0.14, H * 0.14, H * 0.02, '#3a3a44'); escape(c, W * 0.7, H * 0.52, H * 0.025);   // motorzinho
    lanterna(c, W * 0.22, H * 0.62, W * 0.08, H * 0.04, H * 0.01);
  }
  function monstrao(c, W, H, cor, emoji) {
    sombra(c, W, H, 0.5);
    pneu(c, W * 0.0, H * 0.48, W * 0.3, H * 0.52); pneu(c, W * 0.7, H * 0.48, W * 0.3, H * 0.52);
    // molas da suspensão
    c.strokeStyle = '#ffd166'; c.lineWidth = W * 0.015;
    [0.33, 0.62].forEach(function (x) { c.beginPath(); for (var k = 0; k <= 8; k++) c.lineTo(W * (x + (k % 2 ? 0.05 : 0)), H * (0.42 + k * 0.03)); c.stroke(); });
    caixa(c, W * 0.18, H * 0.66, W * 0.64, H * 0.05, H * 0.02, '#555');
    // caçamba e cabine bem altas
    c.fillStyle = grad(c, H * 0.08, H * 0.45, tom(cor, 0.25), tom(cor, -0.25));
    caixa(c, W * 0.12, H * 0.25, W * 0.76, H * 0.22, H * 0.04, c.fillStyle);
    caixa(c, W * 0.24, H * 0.04, W * 0.52, H * 0.24, H * 0.05, tom(cor, -0.1));
    caixa(c, W * 0.29, H * 0.07, W * 0.42, H * 0.15, H * 0.03, '#9fdcff'); piloto(c, emoji, W * 0.5, H * 0.15, H * 0.15, function () { c.rect(W * 0.29, H * 0.07, W * 0.42, H * 0.15); });
    // chamas pintadas
    [['#ffd166', 0], ['#ff7b00', 0.03]].forEach(function (p) { c.fillStyle = p[0]; c.beginPath(); c.moveTo(W * 0.14, H * (0.45 - p[1])); for (var k = 0; k < 6; k++) { c.lineTo(W * (0.2 + k * 0.11), H * (0.3 + p[1])); c.lineTo(W * (0.25 + k * 0.11), H * (0.42 - p[1])); } c.lineTo(W * 0.86, H * 0.45); c.closePath(); c.fill(); });
    lanterna(c, W * 0.14, H * 0.28, W * 0.08, H * 0.05, H * 0.01); lanterna(c, W * 0.78, H * 0.28, W * 0.08, H * 0.05, H * 0.01);
    placa(c, W * 0.4, H * 0.48, W * 0.2, H * 0.07, 'MONSTRO');
    caixa(c, W * 0.26, H * 0.0, W * 0.48, H * 0.03, H * 0.01, '#1b1b22'); [0.32, 0.44, 0.56, 0.68].forEach(function (x) { brilho(c, '#fff3a0', W * 0.03); circ(c, W * x, H * 0.015, H * 0.014, '#fff3a0'); }); c.shadowBlur = 0;
  }
  function moto(c, W, H, cor, emoji) {
    sombra(c, W, H, 0.3);
    pneu(c, W * 0.38, H * 0.62, W * 0.24, H * 0.38);
    caixa(c, W * 0.34, H * 0.56, W * 0.32, H * 0.1, H * 0.03, tom(cor, -0.3));   // para-lama
    // piloto: jaqueta, braços no guidão, capacete
    c.fillStyle = grad(c, H * 0.2, H * 0.6, tom(cor, 0.15), tom(cor, -0.3));
    c.beginPath(); c.moveTo(W * 0.34, H * 0.6); c.quadraticCurveTo(W * 0.26, H * 0.32, W * 0.38, H * 0.25); c.lineTo(W * 0.62, H * 0.25); c.quadraticCurveTo(W * 0.74, H * 0.32, W * 0.66, H * 0.6); c.closePath(); c.fill();
    linha(c, [W * 0.3, H * 0.34, W * 0.06, H * 0.42], tom(cor, -0.2), W * 0.08); linha(c, [W * 0.7, H * 0.34, W * 0.94, H * 0.42], tom(cor, -0.2), W * 0.08);
    circ(c, W * 0.05, H * 0.43, W * 0.05, '#222'); circ(c, W * 0.95, H * 0.43, W * 0.05, '#222');   // luvas
    linha(c, [W * 0.02, H * 0.44, W * 0.98, H * 0.44], '#3a3a44', W * 0.025);   // guidão
    circ(c, W * 0.5, H * 0.14, W * 0.2, '#f5f5f5'); circ(c, W * 0.5, H * 0.14, W * 0.18, cor);
    caixa(c, W * 0.46, H * 0.01, W * 0.08, H * 0.26, W * 0.04, '#ffffff'); circ(c, W * 0.43, H * 0.09, W * 0.035, 'rgba(255,255,255,.5)');
    piloto(c, emoji, W * 0.5, H * 0.16, H * 0.17);
    caixa(c, W * 0.4, H * 0.5, W * 0.2, H * 0.03, H * 0.01, '#fff');   // listra da jaqueta
    lanterna(c, W * 0.42, H * 0.58, W * 0.16, H * 0.04, H * 0.015);
    placa(c, W * 0.4, H * 0.65, W * 0.2, H * 0.06, '7');
    escape(c, W * 0.72, H * 0.7, W * 0.05); linha(c, [W * 0.66, H * 0.66, W * 0.72, H * 0.7], '#9aa0a6', W * 0.04);
  }

  /* menino de skate visto de trás, como num jogo de skate: o pé da frente em cima do shape e o de trás
     empurrando o chão. fase (0 a 1) é um ciclo da remada: 0–0.45 o pé de trás empurra a rua (vai para
     trás, mais perto de quem olha), 0.45–0.65 levanta (aparece a sola) e volta, 0.65–1 descansa no
     tail (deslizando). Desenhado em vários quadros (quadros: 12) que a corrida troca conforme a velocidade.
     A cabeça é desenhada viva por cima (cabeca.js): aqui fica só uma cabeça neutra para quando está longe. */
  var PELE = '#f2c9a0', PELE_SOMBRA = '#d9a57a', SHORT = '#2a2d3a';
  function mistura(a, b, f) { return a + (b - a) * f; }
  function suave(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  // perna em dois pedaços (coxa e canela) com o joelho dobrando para fora (lado = -1 esquerda, 1 direita)
  function joelho(hx, hy, fx, fy, comp, lado) {
    var dx = fx - hx, dy = fy - hy, d = Math.sqrt(dx * dx + dy * dy) || 1, meio = Math.max(comp, d) / 2;
    var alt = Math.sqrt(Math.max(0, meio * meio - (d / 2) * (d / 2)));
    return [hx + dx / 2 - dy / d * alt * -lado, hy + dy / 2 + dx / d * alt * -lado];
  }
  function membro(c, a, b, l1, l2, cor, sombraCor) {   // pedaço de braço ou perna afinando, com sombra de um lado
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d;
    poli(c, [a[0] + nx * l1, a[1] + ny * l1, b[0] + nx * l2, b[1] + ny * l2, b[0] - nx * l2, b[1] - ny * l2, a[0] - nx * l1, a[1] - ny * l1], cor);
    circ(c, a[0], a[1], l1, cor); circ(c, b[0], b[1], l2, cor);
    if (sombraCor) poli(c, [a[0] + nx * l1 * 0.3, a[1] + ny * l1 * 0.3, b[0] + nx * l2 * 0.3, b[1] + ny * l2 * 0.3, b[0] + nx * l2 * 0.95, b[1] + ny * l2 * 0.95, a[0] + nx * l1 * 0.95, a[1] + ny * l1 * 0.95], sombraCor);
  }
  function tenis(c, x, y, w, sola, cor) {   // tênis visto de trás (calcanhar); sola > 0 = pé levantado mostrando a sola
    var h = w * 0.62;
    if (sola > 0) {
      c.save(); c.translate(x, y); c.rotate(-0.25 * sola);
      oval(c, 0, -h * 0.1, w * 0.52, h * (0.55 + sola * 0.6), '#e9e4ee');
      oval(c, 0, -h * 0.1, w * 0.4, h * (0.42 + sola * 0.5), '#c95d7a');
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, w * 0.04);
      for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-w * 0.3, -h * 0.1 + k * h * 0.18 * (0.6 + sola)); c.lineTo(w * 0.3, -h * 0.1 + k * h * 0.18 * (0.6 + sola)); c.stroke(); }
      c.restore(); return;
    }
    caixa(c, x - w / 2, y - h, w, h, w * 0.3, '#f6f6f8');
    caixa(c, x - w / 2, y - h * 0.22, w, h * 0.22, w * 0.1, '#d8d8de');   // sola
    caixa(c, x - w * 0.14, y - h * 0.95, w * 0.28, h * 0.6, w * 0.08, cor);   // reforço do calcanhar
  }
  function shape(c, W, H, cor) {
    // sombra no chão, rodinhas da frente (lá adiante), o shape indo para longe em perspectiva e o tail perto da gente
    oval(c, W * 0.47, H * 0.905, W * 0.21, H * 0.02, 'rgba(0,0,0,.3)');
    [0.415, 0.525].forEach(function (x) { caixa(c, W * (x - 0.022), H * 0.728, W * 0.044, H * 0.028, W * 0.01, '#e8e2d0'); });
    linha(c, [W * 0.415, H * 0.742, W * 0.525, H * 0.742], '#9aa0a6', H * 0.007);
    function deck(dy) {
      c.beginPath(); c.moveTo(W * 0.415, H * (0.708 + dy)); c.quadraticCurveTo(W * 0.47, H * (0.69 + dy), W * 0.525, H * (0.708 + dy));
      c.lineTo(W * 0.585, H * (0.848 + dy)); c.quadraticCurveTo(W * 0.47, H * (0.876 + dy), W * 0.355, H * (0.848 + dy)); c.closePath();
    }
    deck(0.016); c.fillStyle = cor; c.fill();   // a borda do shape (madeira pintada)
    deck(0.009); c.fillStyle = '#e9c48a'; c.fill();
    deck(0); c.fillStyle = grad(c, H * 0.69, H * 0.87, '#2a2a33', '#3b3b46'); c.fill();   // lixa
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = Math.max(1, H * 0.003); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.07)'; for (var k = 0; k < 22; k++) c.fillRect(W * (0.39 + (k * 37 % 17) / 100), H * (0.72 + (k * 13 % 12) / 100), 2, 2);
    linha(c, [W * 0.385, H * 0.885, W * 0.555, H * 0.885], '#9aa0a6', H * 0.011);   // truck de trás
    [0.37, 0.57].forEach(function (x) { caixa(c, W * (x - 0.038), H * 0.868, W * 0.076, H * 0.038, W * 0.02, '#f1ead6'); caixa(c, W * (x - 0.038), H * 0.868, W * 0.076, H * 0.011, W * 0.01, 'rgba(255,255,255,.75)'); });
  }
  function skatista(c, W, H, cor, emoji, fase) {
    fase = ((fase || 0) % 1 + 1) % 1;
    var camisa = cor, escura = tom(cor, -0.35), clara = tom(cor, 0.2);
    // pé de trás: onde está em cada momento da remada
    var px, py, sola = 0, noChao = false, perto = 1;
    if (fase < 0.45) { var a = suave(fase / 0.45); px = mistura(0.63, 0.7, a); py = mistura(0.84, 0.975, a); noChao = true; perto = mistura(1, 1.18, a); }
    else if (fase < 0.65) { var b = (fase - 0.45) / 0.2; px = mistura(0.7, 0.57, suave(b)); py = mistura(0.975, 0.82, suave(b)) - Math.sin(Math.PI * b) * 0.07; sola = Math.sin(Math.PI * Math.min(1, b * 1.3)); perto = mistura(1.18, 1, b); }
    else { var d = suave((fase - 0.65) / 0.08); px = mistura(0.57, 0.545, d); py = mistura(0.82, 0.835, d); }
    var balanco = Math.sin(fase * Math.PI * 2);   // braços balançam ao contrário da perna
    shape(c, W, H, tom(cor, 0.1));
    if (noChao) oval(c, W * px, H * (py + 0.005), W * 0.06 * perto, H * 0.012, 'rgba(0,0,0,.3)');
    // perna de trás (direita): quadril -> joelho -> pé
    var qd = [W * 0.555, H * 0.55], pd = [W * px, H * (py - 0.045 * perto)], jd = joelho(qd[0], qd[1], pd[0], pd[1], H * 0.27, 1);
    membro(c, qd, jd, W * 0.062, W * 0.05, PELE, PELE_SOMBRA); membro(c, jd, pd, W * 0.05, W * 0.036 * perto, PELE, PELE_SOMBRA);
    caixa(c, pd[0] - W * 0.038 * perto, pd[1] - H * 0.012, W * 0.076 * perto, H * 0.022, W * 0.01, '#fdfdfd');   // meia
    tenis(c, W * px, H * py, W * 0.11 * perto, sola, tom(cor, -0.2));
    // perna da frente (esquerda): pé em cima do shape, joelho um pouco dobrado
    var qe = [W * 0.445, H * 0.55], pe = [W * 0.45, H * 0.765], je = joelho(qe[0], qe[1], pe[0], pe[1], H * 0.222, -1);
    membro(c, qe, je, W * 0.062, W * 0.05, PELE, PELE_SOMBRA); membro(c, je, pe, W * 0.05, W * 0.036, PELE, PELE_SOMBRA);
    caixa(c, pe[0] - W * 0.038, pe[1] - H * 0.012, W * 0.076, H * 0.022, W * 0.01, '#fdfdfd');
    tenis(c, W * 0.45, H * 0.8, W * 0.11, 0, tom(cor, -0.2));
    // bermuda
    c.fillStyle = SHORT; c.beginPath();
    c.moveTo(W * 0.36, H * 0.47); c.lineTo(W * 0.64, H * 0.47); c.lineTo(W * 0.635, H * 0.585);
    c.lineTo(W * 0.505, H * 0.6); c.lineTo(W * 0.5, H * 0.545); c.lineTo(W * 0.495, H * 0.6); c.lineTo(W * 0.365, H * 0.585); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(W * 0.38, H * 0.48, W * 0.24, H * 0.015);
    // braços: ombro -> cotovelo -> mão, meio dobrados, balançando
    [[-1, -balanco], [1, balanco]].forEach(function (l) {
      var s = l[0], bb = l[1], om = [W * (0.5 + s * 0.15), H * 0.255], co = [W * (0.5 + s * (0.235 + bb * 0.015)), H * (0.375 - bb * 0.01)], mao = [W * (0.5 + s * (0.25 + bb * 0.03)), H * (0.475 - bb * 0.03)];
      membro(c, om, co, W * 0.048, W * 0.04, PELE, PELE_SOMBRA); membro(c, co, mao, W * 0.04, W * 0.032, PELE, PELE_SOMBRA);
      circ(c, mao[0], mao[1], W * 0.04, PELE);
    });
    // camiseta larga, com mangas curtas e dobras
    c.fillStyle = grad(c, H * 0.22, H * 0.52, clara, escura); c.beginPath();
    c.moveTo(W * 0.37, H * 0.505); c.quadraticCurveTo(W * 0.34, H * 0.38, W * 0.355, H * 0.3);
    c.lineTo(W * 0.29, H * 0.335); c.lineTo(W * 0.255, H * 0.285); c.quadraticCurveTo(W * 0.3, H * 0.225, W * 0.41, H * 0.215);
    c.quadraticCurveTo(W * 0.5, H * 0.235, W * 0.59, H * 0.215); c.quadraticCurveTo(W * 0.7, H * 0.225, W * 0.745, H * 0.285);
    c.lineTo(W * 0.71, H * 0.335); c.lineTo(W * 0.645, H * 0.3); c.quadraticCurveTo(W * 0.66, H * 0.38, W * 0.63, H * 0.505);
    c.quadraticCurveTo(W * 0.5, H * 0.52, W * 0.37, H * 0.505); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = Math.max(1, W * 0.008); c.lineCap = 'round';
    [[0.44, 0.3, 0.42, 0.46], [0.56, 0.32, 0.585, 0.47], [0.5, 0.38, 0.49, 0.5]].forEach(function (q) { c.beginPath(); c.moveTo(W * q[0], H * q[1]); c.quadraticCurveTo(W * (q[0] + 0.02), H * (q[1] + q[3]) / 2, W * q[2], H * q[3]); c.stroke(); });
    c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '800 ' + Math.round(H * 0.045) + 'px ' + FONTE; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', W * 0.5, H * 0.33);
    // pescoço e cabeça neutra (cabelo), coberta pelo piloto vivo
    caixa(c, W * 0.455, H * 0.17, W * 0.09, H * 0.06, W * 0.03, PELE_SOMBRA);
    circ(c, W * 0.5, H * 0.115, H * 0.086, '#3a2a20');
    piloto(c, emoji, W * 0.5, H * 0.12, H * 0.17);
  }

  // ---------- céu ----------
  function aviao(c, W, H, cor, emoji) {   // aviãozinho de hélice, visto de trás
    linha(c, [W * 0.3, H * 0.66, W * 0.3, H * 0.86], '#333', W * 0.012); linha(c, [W * 0.7, H * 0.66, W * 0.7, H * 0.86], '#333', W * 0.012);
    circ(c, W * 0.3, H * 0.88, H * 0.05, '#15151b'); circ(c, W * 0.7, H * 0.88, H * 0.05, '#15151b');
    // asas
    c.fillStyle = grad(c, H * 0.5, H * 0.66, tom(cor, 0.3), tom(cor, -0.2));
    c.beginPath(); c.moveTo(W * 0.02, H * 0.56); c.lineTo(W * 0.4, H * 0.54); c.lineTo(W * 0.6, H * 0.54); c.lineTo(W * 0.98, H * 0.56); c.lineTo(W * 0.98, H * 0.62); c.lineTo(W * 0.02, H * 0.62); c.closePath(); c.fill();
    caixa(c, W * 0.0, H * 0.55, W * 0.06, H * 0.08, H * 0.02, '#fff'); caixa(c, W * 0.94, H * 0.55, W * 0.06, H * 0.08, H * 0.02, '#fff');
    brilho(c, '#ff3b3b', W * 0.02); circ(c, W * 0.01, H * 0.59, H * 0.02, '#ff3b3b'); brilho(c, '#4cd964', W * 0.02); circ(c, W * 0.99, H * 0.59, H * 0.02, '#4cd964'); c.shadowBlur = 0;
    // corpo, cauda vertical e estabilizador
    oval(c, W * 0.5, H * 0.56, W * 0.12, H * 0.16, tom(cor, -0.1));
    poli(c, [W * 0.47, H * 0.5, W * 0.5, H * 0.06, W * 0.53, H * 0.06, W * 0.54, H * 0.5], cor);
    poli(c, [W * 0.47, H * 0.5, W * 0.5, H * 0.06, W * 0.505, H * 0.06, W * 0.5, H * 0.5], tom(cor, 0.35));
    caixa(c, W * 0.3, H * 0.36, W * 0.4, H * 0.035, H * 0.015, tom(cor, -0.25));
    // cabine com o piloto
    c.save(); c.beginPath(); c.ellipse ? c.ellipse(W * 0.5, H * 0.44, W * 0.075, H * 0.1, 0, 0, Math.PI * 2) : c.arc(W * 0.5, H * 0.44, W * 0.075, 0, Math.PI * 2);
    c.fillStyle = '#a9dcff'; c.fill(); c.clip(); piloto(c, emoji, W * 0.5, H * 0.46, H * 0.16); c.restore();
    circ(c, W * 0.5, H * 0.67, W * 0.025, '#2a2a30');
  }
  function jato(c, W, H, cor, emoji) {
    // asas em flecha
    c.fillStyle = grad(c, H * 0.45, H * 0.7, tom(cor, 0.2), tom(cor, -0.35));
    c.beginPath(); c.moveTo(W * 0.5, H * 0.46); c.lineTo(W * 0.98, H * 0.66); c.lineTo(W * 0.96, H * 0.7); c.lineTo(W * 0.5, H * 0.62); c.lineTo(W * 0.04, H * 0.7); c.lineTo(W * 0.02, H * 0.66); c.closePath(); c.fill();
    // duas caudas inclinadas
    poli(c, [W * 0.4, H * 0.5, W * 0.33, H * 0.1, W * 0.37, H * 0.1, W * 0.45, H * 0.5], tom(cor, -0.15));
    poli(c, [W * 0.6, H * 0.5, W * 0.67, H * 0.1, W * 0.63, H * 0.1, W * 0.55, H * 0.5], tom(cor, -0.15));
    oval(c, W * 0.5, H * 0.56, W * 0.13, H * 0.15, cor);
    c.save(); c.beginPath(); c.ellipse ? c.ellipse(W * 0.5, H * 0.43, W * 0.06, H * 0.09, 0, 0, Math.PI * 2) : c.arc(W * 0.5, H * 0.43, W * 0.06, 0, Math.PI * 2);
    c.fillStyle = '#ffd98a'; c.fill(); c.clip(); piloto(c, emoji, W * 0.5, H * 0.45, H * 0.14); c.restore();
    circ(c, W * 0.5, H * 0.62, W * 0.065, '#3a3a44'); circ(c, W * 0.5, H * 0.62, W * 0.045, '#15151b');   // bocal do motor
    brilho(c, '#ff2a2a', W * 0.02); circ(c, W * 0.04, H * 0.68, H * 0.02, '#ff3b3b'); circ(c, W * 0.96, H * 0.68, H * 0.02, '#4cd964'); c.shadowBlur = 0;
    c.fillStyle = '#fff'; c.font = '700 ' + Math.round(H * 0.06) + 'px ' + FONTE; c.textAlign = 'center'; c.fillText('★', W * 0.25, H * 0.64); c.fillText('★', W * 0.75, H * 0.64);
  }
  function helicoptero(c, W, H, cor, emoji) {
    // esquis
    linha(c, [W * 0.18, H * 0.95, W * 0.42, H * 0.95], '#333', H * 0.025); linha(c, [W * 0.58, H * 0.95, W * 0.82, H * 0.95], '#333', H * 0.025);
    linha(c, [W * 0.32, H * 0.78, W * 0.28, H * 0.95], '#333', H * 0.02); linha(c, [W * 0.68, H * 0.78, W * 0.72, H * 0.95], '#333', H * 0.02);
    // cabine-bolha
    c.fillStyle = grad(c, H * 0.2, H * 0.85, tom(cor, 0.3), tom(cor, -0.3));
    c.beginPath(); c.ellipse ? c.ellipse(W * 0.5, H * 0.55, W * 0.24, H * 0.27, 0, 0, Math.PI * 2) : c.arc(W * 0.5, H * 0.55, W * 0.24, 0, Math.PI * 2); c.fill();
    c.save(); c.beginPath(); c.ellipse ? c.ellipse(W * 0.5, H * 0.48, W * 0.16, H * 0.15, 0, 0, Math.PI * 2) : c.arc(W * 0.5, H * 0.48, W * 0.16, 0, Math.PI * 2);
    c.fillStyle = '#a9dcff'; c.fill(); c.clip(); piloto(c, emoji, W * 0.5, H * 0.5, H * 0.18); c.restore();
    // cauda vindo para a frente (vista de trás) e rotor de cauda
    circ(c, W * 0.5, H * 0.7, W * 0.06, tom(cor, -0.35)); circ(c, W * 0.5, H * 0.7, W * 0.035, tom(cor, -0.15));
    poli(c, [W * 0.5, H * 0.64, W * 0.56, H * 0.6, W * 0.57, H * 0.8, W * 0.5, H * 0.76], tom(cor, -0.3));   // aleta da cauda
    c.globalAlpha = 0.5; oval(c, W * 0.6, H * 0.7, W * 0.02, H * 0.11, '#e0e0e8'); c.globalAlpha = 1;   // rotor de cauda girando
    // mastro do rotor principal (as pás são desenhadas girando na corrida)
    caixa(c, W * 0.46, H * 0.22, W * 0.08, H * 0.08, H * 0.02, '#3a3a44'); caixa(c, W * 0.49, H * 0.12, W * 0.02, H * 0.12, H * 0.01, '#3a3a44');
    brilho(c, '#ff2a2a', W * 0.03); circ(c, W * 0.5, H * 0.84, H * 0.02, '#ff3b3b'); c.shadowBlur = 0;
  }

  var LISTA = [
    { id: 'classico', janela: { poli: [0.24, 0.43, 0.31, 0.16, 0.69, 0.16, 0.76, 0.43] }, cab: [0.5, 0.37, 0.3], grupo: 'terra', nome: ['Clássico', 'Classic'], w: 800, h: 640, vel: 1, curva: 1, desenhar: function (c, W, H, cor, e) { S.carroTras(c, W, H, cor, e, true); } },
    { id: 'gt', janela: { poli: [0.34, 0.4, 0.37, 0.25, 0.44, 0.19, 0.56, 0.19, 0.63, 0.25, 0.66, 0.4] }, cab: [0.5, 0.36, 0.23], grupo: 'terra', nome: ['GT Redondo', 'Round GT'], w: 820, h: 600, vel: 1.04, curva: 1.03, desenhar: gt },
    { id: 'super', janela: { poli: [0.38, 0.37, 0.41, 0.25, 0.59, 0.25, 0.62, 0.37] }, cab: [0.5, 0.35, 0.18], grupo: 'terra', nome: ['Superesportivo', 'Supercar'], w: 920, h: 560, vel: 1.08, curva: 0.95, desenhar: superesportivo },
    { id: 'kart', janela: { elipse: [0.5, 0.24, 0.184, 0.221] }, cab: [0.5, 0.25, 0.34], capacete: true, grupo: 'terra', nome: ['Kart', 'Kart'], w: 720, h: 600, vel: 0.96, curva: 1.12, desenhar: kart },
    { id: 'monstrao', janela: { poli: [0.29, 0.07, 0.71, 0.07, 0.71, 0.22, 0.29, 0.22] }, cab: [0.5, 0.17, 0.14], grupo: 'terra', nome: ['Monstrão', 'Monster Truck'], w: 960, h: 920, vel: 0.95, curva: 0.98, desenhar: monstrao },
    { id: 'moto', janela: { elipse: [0.5, 0.14, 0.18, 0.123] }, cab: [0.5, 0.15, 0.22], capacete: true, grupo: 'moto', nome: ['Moto', 'Motorbike'], w: 520, h: 760, vel: 1.03, curva: 1.1, desenhar: moto },
    { id: 'skate', janela: { elipse: [0.5, 0.115, 0.3, 0.2] }, cab: [0.5, 0.115, 0.172], aberto: true, quadros: 12, grupo: 'moto', nome: ['Skate', 'Skateboard'], w: 560, h: 780, vel: 0.94, curva: 1.15, desenhar: skatista },
    { id: 'aviao', janela: { elipse: [0.5, 0.44, 0.075, 0.1] }, cab: [0.5, 0.47, 0.16], grupo: 'ar', nome: ['Aviãozinho', 'Little Plane'], w: 1500, h: 760, vel: 1, curva: 1.05, desenhar: aviao, helice: true },
    { id: 'jato', janela: { elipse: [0.5, 0.43, 0.06, 0.09] }, cab: [0.5, 0.46, 0.14], grupo: 'ar', nome: ['Jato', 'Jet'], w: 1300, h: 700, vel: 1.1, curva: 0.92, desenhar: jato, fogo: true },
    { id: 'heli', janela: { elipse: [0.5, 0.48, 0.16, 0.15] }, cab: [0.5, 0.52, 0.21], grupo: 'ar', nome: ['Helicóptero', 'Helicopter'], w: 1100, h: 900, vel: 0.95, curva: 1.12, desenhar: helicoptero, rotor: true }
  ];
  var GRUPOS = [
    { id: 'terra', nome: ['🚗 Carros', '🚗 Cars'] },
    { id: 'moto', nome: ['🏍️ Moto e skate', '🏍️ Bike and skateboard'] },
    { id: 'ar', nome: ['✈️ No céu (voa!)', '✈️ In the sky (flies!)'] }
  ];
  function achar(id) { for (var k = 0; k < LISTA.length; k++) if (LISTA[k].id === id) return LISTA[k]; return null; }
  function voa(id) { var v = achar(id); return !!(v && v.grupo === 'ar'); }

  var VruuumVeiculos = { LISTA: LISTA, GRUPOS: GRUPOS, achar: achar, voa: voa, tom: tom };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumVeiculos;
  else raiz.VruuumVeiculos = VruuumVeiculos;
})(this);
