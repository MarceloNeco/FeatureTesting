/* Desenho Meu — paisagens (fundos) desenhadas em código, para a criança pintar por cima.
   Duas funções:
     parado(ctx, id, W, H)     a parte que NÃO mexe; o app desenha UMA vez e guarda numa imagem
     vivo(ctx, id, W, H, t)    SÓ o que se mexe (ondas, bolhas, neve…), por cima, a cada quadro; t em segundos
   Tudo é desenhado num "mundo" de 2048 × 2048 e esticado para W × H (ctx.scale), então serve para qualquer
   tamanho de imagem. Horizonte perto de 58–62% da altura: o celular em pé vê só a faixa do meio, deitado vê a
   largura toda; por isso as coisas bonitas ficam espalhadas e também perto do centro.
   Cores vivas mas suaves e sem contorno preto, para o desenho da criança aparecer por cima.
   Regras do "vivo" (roda 60 vezes por segundo): poucos desenhos, nada de sombra borrada, gradientes guardados,
   e sorteios com semente (sempre os mesmos números) para nada "pular" de um quadro para o outro.
   Quem pediu menos movimento: o app não chama vivo(). Se quiser a cena completa congelada (pás do moinho,
   algas), basta chamar vivo(ctx, id, W, H, 0) uma vez por cima do parado. */
(function (raiz) {
  'use strict';
  var S = 2048, TAU = Math.PI * 2;

  // ---------- ajudantes ----------
  function sorteio(s) { s = s >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  // número "aleatório" fixo para o par (i, j): sempre o mesmo, então nada pula entre quadros
  function hash(i, j) { var x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); }
  function mod(a, b) { return ((a % b) + b) % b; }
  function lin(ctx, x0, y0, x1, y1, p) { var g = ctx.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < p.length; i++) g.addColorStop(p[i][0], p[i][1]); return g; }
  function rad(ctx, x0, y0, r0, x1, y1, r1, p) { var g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1); for (var i = 0; i < p.length; i++) g.addColorStop(p[i][0], p[i][1]); return g; }
  // gradientes usados no "vivo" ficam guardados aqui (criar um novo a cada quadro pesa)
  var GUARDA = {};
  function guardado(chave, fazer) { return GUARDA[chave] || (GUARDA[chave] = fazer()); }

  // pedaços de caminho (só acrescentam ao caminho atual; quem chama faz o fill/stroke)
  function circ(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  // elipse com curvas (ctx.ellipse não existe em navegador antigo); "rot" gira a elipse
  function oval(ctx, x, y, rx, ry, rot) {
    var c = Math.cos(rot || 0), s = Math.sin(rot || 0), k = 0.5523;
    function px(a, b) { return x + a * c - b * s; }
    function py(a, b) { return y + a * s + b * c; }
    ctx.moveTo(px(rx, 0), py(rx, 0));
    ctx.bezierCurveTo(px(rx, ry * k), py(rx, ry * k), px(rx * k, ry), py(rx * k, ry), px(0, ry), py(0, ry));
    ctx.bezierCurveTo(px(-rx * k, ry), py(-rx * k, ry), px(-rx, ry * k), py(-rx, ry * k), px(-rx, 0), py(-rx, 0));
    ctx.bezierCurveTo(px(-rx, -ry * k), py(-rx, -ry * k), px(-rx * k, -ry), py(-rx * k, -ry), px(0, -ry), py(0, -ry));
    ctx.bezierCurveTo(px(rx * k, -ry), py(rx * k, -ry), px(rx, -ry * k), py(rx, -ry * k), px(rx, 0), py(rx, 0));
    ctx.closePath();
  }
  function retR(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // brilhinho de 4 pontas
  function brilho(ctx, x, y, r) {
    var q = r * 0.16;
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + q, y - q, x + r, y); ctx.quadraticCurveTo(x + q, y + q, x, y + r);
    ctx.quadraticCurveTo(x - q, y + q, x - r, y); ctx.quadraticCurveTo(x - q, y - q, x, y - r); ctx.closePath();
  }
  function estrelaP(ctx, x, y, R, r, n, giro) {
    for (var i = 0; i < n * 2; i++) {
      var a = (giro || 0) - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R;
      if (i) ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); else ctx.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
    }
    ctx.closePath();
  }
  // passarinho de longe (um "m" de traço); quem chama faz o stroke
  function passarinho(ctx, x, y, s, bate) {
    var b = bate * s * 0.35;
    ctx.moveTo(x - s, y - b); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.55 - b * 0.4, x, y);
    ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.55 - b * 0.4, x + s, y - b);
  }

  // desenhos completos (já pintam)
  function bola(ctx, x, y, r, cor) { ctx.fillStyle = cor; ctx.beginPath(); circ(ctx, x, y, r); ctx.fill(); }
  function elipse(ctx, x, y, rx, ry, cor, rot) { ctx.fillStyle = cor; ctx.beginPath(); oval(ctx, x, y, rx, ry, rot); ctx.fill(); }
  function caixa(ctx, x, y, w, h, r, cor) { ctx.fillStyle = cor; ctx.beginPath(); retR(ctx, x, y, w, h, r); ctx.fill(); }
  function ceu(ctx, p) { ctx.fillStyle = lin(ctx, 0, 0, 0, S, p); ctx.fillRect(0, 0, S, S); }
  function poli(ctx, pts, cor) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath(); ctx.fill();
  }

  // linha de morro: soma de duas ondas (dá um contorno natural, nada de régua)
  function ondaY(x, y, amp, ondas, fase) { return y + amp * Math.sin(x / S * ondas * TAU + fase) + amp * 0.35 * Math.sin(x / S * ondas * 2.7 * TAU + fase * 1.7); }
  function morro(ctx, y, amp, ondas, fase, cor) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(0, S);
    for (var x = 0; x <= S; x += 32) ctx.lineTo(x, ondaY(x, y, amp, ondas, fase));
    ctx.lineTo(S, S); ctx.closePath(); ctx.fill();
  }
  function morroG(ctx, y, amp, ondas, fase, c1, c2) { morro(ctx, y, amp, ondas, fase, lin(ctx, 0, y - amp, 0, y + 520, [[0, c1], [1, c2]])); }

  // nuvem fofa: bolinhas sobrepostas; a "sombra" é a mesma nuvem um pouco mais baixa e mais escura
  var FOFO = [[-0.34, 0.06, 0.19], [-0.17, -0.07, 0.25], [0.08, -0.14, 0.29], [0.3, 0.0, 0.21], [0.03, 0.07, 0.24], [-0.1, 0.09, 0.2], [0.18, 0.08, 0.19]];
  function fofo(ctx, x, y, s) { for (var i = 0; i < FOFO.length; i++) circ(ctx, x + FOFO[i][0] * s, y + FOFO[i][1] * s, FOFO[i][2] * s); }
  function nuvem(ctx, x, y, s, cor, sombra) {
    if (sombra) { ctx.fillStyle = sombra; ctx.beginPath(); fofo(ctx, x + s * 0.015, y + s * 0.055, s); ctx.fill(); }
    ctx.fillStyle = cor; ctx.beginPath(); fofo(ctx, x, y, s); ctx.fill();
  }
  // nuvem que anda: a posição dá a volta na tela
  function nuvensAndando(ctx, t, lista, cor, sombra) {
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i], x = mod(n[0] + t * n[3], S + 900) - 450;
      nuvem(ctx, x, n[1], n[2], cor, sombra);
    }
  }
  function sol(ctx, x, y, r, brilhoCor) {
    ctx.fillStyle = rad(ctx, x, y, r * 0.7, x, y, r * 3.2, [[0, brilhoCor || 'rgba(255,245,190,0.8)'], [1, 'rgba(255,245,190,0)']]);
    ctx.beginPath(); circ(ctx, x, y, r * 3.2); ctx.fill();
    ctx.fillStyle = rad(ctx, x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r, [[0, '#fffbe2'], [0.55, '#ffe46e'], [1, '#ffc94d']]);
    ctx.beginPath(); circ(ctx, x, y, r); ctx.fill();
  }
  function arvore(ctx, x, y, s, c) {   // c = [tronco, verde, verde claro]; (x, y) = pé do tronco; s = altura
    caixa(ctx, x - s * 0.055, y - s * 0.56, s * 0.11, s * 0.57, s * 0.03, c[0]);
    ctx.fillStyle = c[1]; ctx.beginPath();
    circ(ctx, x, y - s * 0.72, s * 0.26); circ(ctx, x - s * 0.21, y - s * 0.6, s * 0.19); circ(ctx, x + s * 0.21, y - s * 0.61, s * 0.2);
    circ(ctx, x - s * 0.09, y - s * 0.88, s * 0.17); circ(ctx, x + s * 0.12, y - s * 0.86, s * 0.16); ctx.fill();
    ctx.fillStyle = c[2]; ctx.beginPath();
    circ(ctx, x - s * 0.1, y - s * 0.86, s * 0.1); circ(ctx, x - s * 0.25, y - s * 0.63, s * 0.08); circ(ctx, x + s * 0.06, y - s * 0.76, s * 0.07); ctx.fill();
  }
  function pinheiro(ctx, x, y, s, c, neve) {   // c = [tronco, verde, verde escuro]
    caixa(ctx, x - s * 0.045, y - s * 0.17, s * 0.09, s * 0.18, s * 0.02, c[0]);
    for (var i = 0; i < 4; i++) {
      var topo = y - s * (0.44 + i * 0.185), base = y - s * (0.12 + i * 0.185), w = s * (0.36 - i * 0.075);
      ctx.fillStyle = c[1]; ctx.beginPath(); ctx.moveTo(x, topo); ctx.lineTo(x + w, base);
      ctx.quadraticCurveTo(x, base + s * 0.07, x - w, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c[2]; ctx.beginPath(); ctx.moveTo(x, topo); ctx.lineTo(x + w, base);
      ctx.quadraticCurveTo(x + w * 0.5, base + s * 0.055, x + w * 0.04, base + s * 0.052); ctx.closePath(); ctx.fill();
      if (neve) {
        var hh = (base - topo);
        ctx.fillStyle = neve; ctx.beginPath(); ctx.moveTo(x, topo - 2);
        ctx.lineTo(x + w * 0.42, topo + hh * 0.42);
        ctx.quadraticCurveTo(x + w * 0.3, topo + hh * 0.56, x + w * 0.16, topo + hh * 0.46);
        ctx.quadraticCurveTo(x, topo + hh * 0.6, x - w * 0.16, topo + hh * 0.47);
        ctx.quadraticCurveTo(x - w * 0.3, topo + hh * 0.56, x - w * 0.42, topo + hh * 0.42);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = neve; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(x + w * 0.95, base - 4); ctx.quadraticCurveTo(x + w * 0.5, base + s * 0.04, x + w * 0.1, base + s * 0.045); ctx.stroke();
      }
    }
  }
  function florzinha(ctx, x, y, r, cor, miolo) {
    ctx.fillStyle = cor; ctx.beginPath();
    for (var i = 0; i < 5; i++) { var a = i * TAU / 5 - Math.PI / 2; circ(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.72); }
    ctx.fill(); bola(ctx, x, y, r * 0.55, miolo || '#ffd23f');
  }
  // canteiro de florzinhas sorteadas numa faixa (maiores embaixo, como se estivessem mais perto)
  function campoFlores(ctx, semente, n, y0, y1, cores, haste) {
    var r = sorteio(semente);
    for (var i = 0; i < n; i++) {
      var x = r() * S, y = y0 + r() * (y1 - y0), k = (y - y0) / (y1 - y0), tam = 7 + k * 15;
      if (haste) { ctx.strokeStyle = haste; ctx.lineWidth = 2 + k * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 8, y + tam * 2.2); ctx.stroke(); }
      florzinha(ctx, x, y, tam, cores[Math.floor(r() * cores.length)], r() < 0.5 ? '#ffd23f' : '#fff3c4');
    }
  }
  function tufos(ctx, semente, n, y0, y1, cor) {
    var r = sorteio(semente); ctx.strokeStyle = cor; ctx.lineCap = 'round'; ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var x = r() * S, y = y0 + r() * (y1 - y0), k = 0.5 + (y - y0) / (y1 - y0), h = 18 * k + r() * 14;
      ctx.moveTo(x - 8 * k, y); ctx.quadraticCurveTo(x - 10 * k, y - h * 0.6, x - 16 * k, y - h);
      ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - h * 0.7, x + 2, y - h * 1.2);
      ctx.moveTo(x + 8 * k, y); ctx.quadraticCurveTo(x + 10 * k, y - h * 0.6, x + 17 * k, y - h * 0.9);
    }
    ctx.lineWidth = 5; ctx.stroke();
  }
  // palmeira: tronco curvo com anéis e folhas feitas de folhinhas
  function palmeira(ctx, x, y, h, curva, c) {   // c = [tronco, anel, folha, nervura, coco]
    var tx = x + curva, ty = y - h, cx = x + curva * 0.12, cy = y - h * 0.55, i, k;
    ctx.lineCap = 'round';
    ctx.strokeStyle = c[0]; ctx.lineWidth = h * 0.075; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, tx, ty); ctx.stroke();
    ctx.strokeStyle = c[1]; ctx.lineWidth = h * 0.011; ctx.beginPath();
    for (i = 1; i < 13; i++) {
      k = i / 13;
      var px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * cx + k * k * tx, py = (1 - k) * (1 - k) * y + 2 * (1 - k) * k * cy + k * k * ty, w = h * 0.034 * (1 - k * 0.25);
      ctx.moveTo(px - w, py - w * 0.1); ctx.quadraticCurveTo(px, py + w * 0.45, px + w, py - w * 0.1);
    }
    ctx.stroke();
    var angs = [-3.0, -2.55, -2.05, -1.45, -0.95, -0.45, 0.05];
    for (i = 0; i < angs.length; i++) folhaPalma(ctx, tx, ty, angs[i], h * (0.4 + 0.06 * Math.sin(i * 2.1)), h, c[2], c[3]);
    ctx.fillStyle = c[4]; ctx.beginPath(); circ(ctx, tx - h * 0.03, ty + h * 0.035, h * 0.03); circ(ctx, tx + h * 0.03, ty + h * 0.03, h * 0.028); circ(ctx, tx, ty + h * 0.06, h * 0.027); ctx.fill();
  }
  function folhaPalma(ctx, x, y, a, L, h, cor, nervura) {
    var ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L * 0.75 + L * 0.42;
    var cx = x + Math.cos(a) * L * 0.55, cy = y + Math.sin(a) * L * 0.6 - L * 0.12;
    ctx.strokeStyle = cor; ctx.lineCap = 'round'; ctx.lineWidth = h * 0.026; ctx.beginPath();
    for (var i = 1; i <= 12; i++) {
      var k = i / 13, px = (1 - k) * (1 - k) * x + 2 * (1 - k) * k * cx + k * k * ex, py = (1 - k) * (1 - k) * y + 2 * (1 - k) * k * cy + k * k * ey;
      var tx = 2 * (1 - k) * (cx - x) + 2 * k * (ex - cx), ty = 2 * (1 - k) * (cy - y) + 2 * k * (ey - cy), m = Math.sqrt(tx * tx + ty * ty) || 1;
      tx /= m; ty /= m;
      var len = L * 0.26 * (1 - k * 0.75);
      ctx.moveTo(px, py); ctx.lineTo(px - ty * len + tx * len * 0.35, py + tx * len + ty * len * 0.35 + len * 0.35);
      ctx.moveTo(px, py); ctx.lineTo(px + ty * len + tx * len * 0.35, py - tx * len + ty * len * 0.35 + len * 0.35);
    }
    ctx.stroke();
    ctx.lineWidth = h * 0.03; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    ctx.strokeStyle = nervura; ctx.lineWidth = h * 0.008; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
  }
  function borboleta(ctx, x, y, s, abre, c1, c2) {
    var f = 0.18 + 0.82 * abre;
    ctx.fillStyle = c1; ctx.beginPath();
    oval(ctx, x - s * 0.48 * f, y - s * 0.2, s * 0.5 * f, s * 0.38, 0.3); oval(ctx, x + s * 0.48 * f, y - s * 0.2, s * 0.5 * f, s * 0.38, -0.3); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath();
    oval(ctx, x - s * 0.34 * f, y + s * 0.24, s * 0.34 * f, s * 0.26, -0.3); oval(ctx, x + s * 0.34 * f, y + s * 0.24, s * 0.34 * f, s * 0.26, 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath();
    circ(ctx, x - s * 0.55 * f, y - s * 0.25, s * 0.11 * f + 1); circ(ctx, x + s * 0.55 * f, y - s * 0.25, s * 0.11 * f + 1); ctx.fill();
    elipse(ctx, x, y, s * 0.08, s * 0.4, '#5a3d6e');
    ctx.strokeStyle = '#5a3d6e'; ctx.lineWidth = s * 0.05; ctx.beginPath();
    ctx.moveTo(x, y - s * 0.35); ctx.quadraticCurveTo(x - s * 0.1, y - s * 0.6, x - s * 0.24, y - s * 0.66);
    ctx.moveTo(x, y - s * 0.35); ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.6, x + s * 0.24, y - s * 0.66); ctx.stroke();
  }
  // faíscas que acendem e apagam (posições fixas pela semente)
  function faiscas(ctx, t, semente, n, x0, y0, w, h, rmax, cor) {
    ctx.fillStyle = cor; ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var k = Math.sin(t * (1.5 + hash(i, semente) * 2.5) + i * 2.3);
      if (k > 0.1) brilho(ctx, x0 + hash(i, semente + 1) * w, y0 + hash(i, semente + 2) * h, rmax * (0.35 + 0.65 * hash(i, semente + 3)) * (k - 0.1) / 0.9);
    }
    ctx.fill();
  }
  function passaros(ctx, t, lista, cor) {   // lista: [x0, y, tamanho, velocidade]
    ctx.strokeStyle = cor; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    for (var i = 0; i < lista.length; i++) {
      var p = lista[i], x = mod(p[0] + t * p[3], S + 600) - 300;
      passarinho(ctx, x, p[1] + Math.sin(t * 1.3 + i) * 18, p[2], Math.sin(t * 7 + i * 1.9));
    }
    ctx.stroke();
  }
  function estrelinhas(ctx, semente, n, y1, rmax) {
    var r = sorteio(semente), cores = ['rgba(255,255,255,0.9)', 'rgba(255,248,214,0.7)', 'rgba(210,225,255,0.55)'];
    for (var c = 0; c < 3; c++) {
      ctx.fillStyle = cores[c]; ctx.beginPath();
      for (var i = 0; i < n / 3; i++) circ(ctx, r() * S, r() * y1, 1.5 + r() * rmax);
      ctx.fill();
    }
  }

  // ========== as cenas ==========
  var CENA = {};

  // ---------- praia ----------
  function beira(x) { return 1500 + 38 * Math.sin(x / S * TAU * 1.3 + 0.6) + 16 * Math.sin(x / S * TAU * 3.1); }
  function barco(ctx, x, y) {
    ctx.fillStyle = '#ff7b7b'; ctx.beginPath(); ctx.moveTo(x - 62, y - 8); ctx.lineTo(x + 66, y - 8); ctx.quadraticCurveTo(x + 50, y + 22, x + 30, y + 24); ctx.lineTo(x - 36, y + 24); ctx.quadraticCurveTo(x - 52, y + 18, x - 62, y - 8); ctx.fill();
    caixa(ctx, x - 64, y - 12, 132, 9, 4, '#ffffff');
    caixa(ctx, x - 3, y - 128, 6, 120, 3, '#9a6b4f');
    poli(ctx, [x + 6, y - 124, x + 6, y - 22, x + 70, y - 22], '#fffaf0');
    poli(ctx, [x - 6, y - 104, x - 6, y - 22, x - 52, y - 22], '#ffd36b');
    poli(ctx, [x + 3, y - 128, x + 30, y - 120, x + 3, y - 112], '#ff7b7b');
  }
  CENA.praia = {
    parado: function (ctx) {
      var i, r = sorteio(11), x;
      ceu(ctx, [[0, '#64bdf0'], [0.36, '#a2d9f7'], [0.585, '#ffe7cf']]);
      sol(ctx, 1580, 520, 105);
      nuvem(ctx, 430, 420, 400, '#ffffff', 'rgba(160,195,235,0.45)');
      nuvem(ctx, 1080, 290, 270, '#ffffff', 'rgba(160,195,235,0.45)');
      nuvem(ctx, 1860, 790, 220, '#ffffff', 'rgba(160,195,235,0.45)');
      // ilhazinha lá longe
      elipse(ctx, 300, 1196, 190, 34, '#7cc8a8');
      palmeira(ctx, 300, 1175, 150, 22, ['#b98a63', '#a1734f', '#5fbf86', '#4aa874', '#8a5a3a']);
      // mar
      ctx.fillStyle = lin(ctx, 0, 1185, 0, 1560, [[0, '#2fa6d6'], [0.35, '#3dbfdc'], [1, '#86e0d6']]); ctx.fillRect(0, 1185, S, S - 1185);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(0, 1183, S, 5);
      // reflexo do sol na água
      ctx.fillStyle = lin(ctx, 0, 1188, 0, 1480, [[0, 'rgba(255,248,214,0.4)'], [1, 'rgba(255,248,214,0)']]); ctx.beginPath(); ctx.moveTo(1540, 1188); ctx.lineTo(1620, 1188); ctx.lineTo(1780, 1480); ctx.lineTo(1380, 1480); ctx.closePath(); ctx.fill();
      // areia molhada e seca
      ctx.fillStyle = '#e8c38f'; ctx.beginPath(); ctx.moveTo(0, S);
      for (x = 0; x <= S; x += 32) ctx.lineTo(x, beira(x)); ctx.lineTo(S, S); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 1520, 0, S, [[0, '#ffe6b2'], [1, '#f5cc8c']]); ctx.beginPath(); ctx.moveTo(0, S);
      for (x = 0; x <= S; x += 32) ctx.lineTo(x, beira(x) + 34); ctx.lineTo(S, S); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath();
      for (x = 0; x <= S; x += 32) { if (x) ctx.lineTo(x, beira(x) + 2); else ctx.moveTo(x, beira(x) + 2); } ctx.stroke();
      // pontinhos de areia
      ctx.fillStyle = 'rgba(200,150,90,0.25)'; ctx.beginPath();
      for (i = 0; i < 260; i++) { x = r() * S; circ(ctx, x, beira(x) + 50 + r() * 520, 2 + r() * 3); } ctx.fill();
      palmeira(ctx, 330, 1780, 780, 130, ['#c7976b', '#a77a52', '#5ec27d', '#3e9f62', '#8a5a3a']);
      palmeira(ctx, 1800, 1730, 640, -120, ['#c7976b', '#a77a52', '#6dcc87', '#46a86a', '#8a5a3a']);
      // canga e guarda-sol
      ctx.save(); ctx.translate(1180, 1790); ctx.rotate(-0.08);
      caixa(ctx, -170, -40, 340, 90, 14, '#ff9ec4');
      ctx.fillStyle = '#ffffff'; for (i = 0; i < 4; i++) ctx.fillRect(-150 + i * 85, -40, 30, 90);
      ctx.restore();
      ctx.save(); ctx.translate(1300, 1450); ctx.rotate(-0.16);
      caixa(ctx, -7, -20, 14, 410, 7, '#f5f1ea');
      // cúpula: meia elipse com a borda de baixo em ondinhas; os gomos são fatias a partir do topo
      ctx.save(); ctx.beginPath(); ctx.moveTo(-260, 0); ctx.bezierCurveTo(-260, -200, 260, -200, 260, 0);
      for (i = 0; i < 8; i++) ctx.quadraticCurveTo(260 - i * 65 - 32, -26, 260 - (i + 1) * 65, 0);
      ctx.closePath(); ctx.clip();
      var cores = ['#ff6b6b', '#ffffff', '#ffc94d', '#ffffff', '#5ec0f0', '#ffffff', '#ff6b6b', '#ffffff'];
      for (i = 0; i < 8; i++) poli(ctx, [0, -170, -260 + i * 65, 10, -260 + (i + 1) * 65, 10], cores[i]);
      ctx.fillStyle = 'rgba(0,40,80,0.08)'; ctx.fillRect(0, -200, 280, 220);
      ctx.restore();
      bola(ctx, 0, -152, 13, '#f5f1ea');
      ctx.restore();
      // bola de praia
      var bx = 780, by = 1790, br = 72, bc = ['#ff6b6b', '#ffffff', '#5ec0f0', '#ffffff', '#ffc94d', '#ffffff'];
      elipse(ctx, bx + 10, by + 66, 70, 14, 'rgba(180,130,70,0.25)');
      for (i = 0; i < 6; i++) { ctx.fillStyle = bc[i]; ctx.beginPath(); ctx.moveTo(bx, by); ctx.arc(bx, by, br, i * TAU / 6 - 0.3, (i + 1) * TAU / 6 - 0.3); ctx.closePath(); ctx.fill(); }
      bola(ctx, bx, by, 14, '#ffffff'); elipse(ctx, bx - 30, by - 34, 18, 10, 'rgba(255,255,255,0.6)', -0.6);
      // castelinho de areia
      var cx = 1560, cy = 1900;
      caixa(ctx, cx - 120, cy - 90, 240, 100, 10, '#f2c27e');
      caixa(ctx, cx - 140, cy - 170, 80, 180, 10, '#eab673'); caixa(ctx, cx + 60, cy - 170, 80, 180, 10, '#eab673'); caixa(ctx, cx - 45, cy - 220, 90, 230, 10, '#f2c27e');
      ctx.fillStyle = '#eab673'; for (i = 0; i < 3; i++) { ctx.fillRect(cx - 140 + i * 30, cy - 195, 20, 30); ctx.fillRect(cx + 60 + i * 30, cy - 195, 20, 30); ctx.fillRect(cx - 45 + i * 35, cy - 245, 20, 30); }
      caixa(ctx, cx - 22, cy - 50, 44, 60, 20, '#c99456');
      caixa(ctx, cx - 2, cy - 330, 5, 90, 2, '#9a6b4f'); poli(ctx, [cx + 3, cy - 330, cx + 60, cy - 312, cx + 3, cy - 294], '#ff6b6b');
      // estrela-do-mar e conchas
      ctx.fillStyle = '#ff9a6b'; ctx.beginPath(); estrelaP(ctx, 560, 1950, 52, 22, 5, 0.2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); for (i = 0; i < 5; i++) { var a = 0.2 - Math.PI / 2 + i * TAU / 5; circ(ctx, 560 + Math.cos(a) * 28, 1950 + Math.sin(a) * 28, 5); } ctx.fill();
      concha(ctx, 1000, 1980, 34, '#ffc2d6'); concha(ctx, 1840, 1940, 28, '#fff0d6'); concha(ctx, 230, 1900, 26, '#ffd7b8');
    },
    vivo: function (ctx, t) {
      var i, x, y, f;
      // cristas de onda: tracinhos brancos que andam devagar (mais longe = menores)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineCap = 'round'; ctx.beginPath();
      for (f = 0; f < 4; f++) {
        var yy = 1218 + f * 62 + f * f * 14, amp = 4 + f * 3, comp = 190 + f * 60, vel = (f % 2 ? -1 : 1) * (18 + f * 10);
        for (x = -comp + mod(t * vel + f * 97, comp); x < S; x += comp) { ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + comp * 0.22, yy - amp * 2, x + comp * 0.45, yy); }
      }
      ctx.lineWidth = 5; ctx.stroke();
      // brilho do sol na água
      ctx.fillStyle = '#fffbe6'; ctx.beginPath();
      for (i = 0; i < 22; i++) {
        y = 1200 + hash(i, 2) * 270; x = 1580 + (hash(i, 1) - 0.5) * (100 + (y - 1190) * 1.3);
        var k = Math.sin(t * (2 + hash(i, 3) * 3) + i * 1.7);
        if (k > 0.2) brilho(ctx, x, y, 5 + 15 * (k - 0.2));
      }
      ctx.fill();
      // espuma que vai e volta na beira
      var d = 16 * Math.sin(t * 0.9) - 12;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 14; ctx.beginPath();
      for (x = 0; x <= S; x += 64) { y = beira(x) + d + 5 * Math.sin(x * 0.02 + t * 2); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 7; ctx.beginPath();
      for (x = 0; x <= S; x += 64) { y = beira(x) + d - 34 + 6 * Math.sin(x * 0.015 - t * 1.6); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
      // barquinho balançando lá longe
      ctx.save(); ctx.translate(1000 + Math.sin(t * 0.12) * 120, 1212 + Math.sin(t * 1.5) * 4); ctx.rotate(Math.sin(t * 1.2) * 0.05); ctx.scale(0.8, 0.8); barco(ctx, 0, 0); ctx.restore();
      passaros(ctx, t, [[200, 640, 34, 60], [1300, 820, 26, 48], [900, 700, 22, 52]], '#5b6f96');
    }
  };
  function concha(ctx, x, y, s, cor) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x, y + s * 0.6); ctx.arc(x, y + s * 0.6, s, Math.PI * 1.1, Math.PI * 1.9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,100,90,0.35)'; ctx.lineWidth = s * 0.08; ctx.beginPath();
    for (var i = 1; i < 5; i++) { var a = Math.PI * (1.1 + i * 0.16); ctx.moveTo(x, y + s * 0.6); ctx.lineTo(x + Math.cos(a) * s * 0.92, y + s * 0.6 + Math.sin(a) * s * 0.92); }
    ctx.stroke();
  }

  // ---------- campo ----------
  var CAMPO = { far: [1150, 45, 1.3, 0.5], mid: [1255, 65, 1.1, 2.2], near: [1420, 55, 0.8, 4.0] };
  function casinha(ctx, x, y, s, parede, telhado) {
    caixa(ctx, x - s * 0.5, y - s * 0.7, s, s * 0.72, s * 0.04, parede);
    poli(ctx, [x - s * 0.62, y - s * 0.66, x, y - s * 1.2, x + s * 0.62, y - s * 0.66], telhado);
    caixa(ctx, x - s * 0.13, y - s * 0.38, s * 0.26, s * 0.4, s * 0.04, '#b9825d');
    caixa(ctx, x + s * 0.2, y - s * 0.55, s * 0.18, s * 0.18, s * 0.03, '#9fd6ff');
    caixa(ctx, x - s * 0.38, y - s * 0.55, s * 0.18, s * 0.18, s * 0.03, '#9fd6ff');
  }
  CENA.campo = {
    parado: function (ctx) {
      var c = CAMPO;
      ceu(ctx, [[0, '#74c6f4'], [0.4, '#b6e3fa'], [0.6, '#fff3d4']]);
      sol(ctx, 1660, 430, 110);
      morroG(ctx, c.far[0], c.far[1], c.far[2], c.far[3], '#bfe6b8', '#a3d9a2');
      var hx = 1280; casinha(ctx, hx, ondaY(hx, c.far[0], c.far[1], c.far[2], c.far[3]) + 18, 90, '#fff3e0', '#ff8a7a');
      ctx.fillStyle = '#93cf92'; ctx.beginPath();
      for (var i = 0; i < 9; i++) { var tx = 120 + i * 95 + (i > 4 ? 900 : 0); circ(ctx, tx, ondaY(tx, c.far[0], c.far[1], c.far[2], c.far[3]) - 10, 34 + (i % 3) * 10); }
      ctx.fill();
      morroG(ctx, c.mid[0], c.mid[1], c.mid[2], c.mid[3], '#9ad992', '#7cc777');
      arvore(ctx, 480, ondaY(480, c.mid[0], c.mid[1], c.mid[2], c.mid[3]) + 30, 340, ['#a8714d', '#5fb760', '#86d07a']);
      arvore(ctx, 1590, ondaY(1590, c.mid[0], c.mid[1], c.mid[2], c.mid[3]) + 30, 250, ['#a8714d', '#5fb760', '#86d07a']);
      tufos(ctx, 5, 40, 1300, 1420, 'rgba(70,150,70,0.35)');
      morroG(ctx, c.near[0], c.near[1], c.near[2], c.near[3], '#86d276', '#5fb85a');
      // caminho de terra que some no morro
      ctx.fillStyle = '#f3dca2'; ctx.beginPath(); ctx.moveTo(800, S);
      ctx.bezierCurveTo(960, 1800, 1200, 1660, 1060, 1440); ctx.lineTo(1100, 1436); ctx.bezierCurveTo(1270, 1640, 1100, 1820, 1300, S); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(1050, S); ctx.bezierCurveTo(1100, 1800, 1220, 1660, 1080, 1450); ctx.stroke();
      tufos(ctx, 9, 70, 1450, 2040, 'rgba(60,140,60,0.4)');
      campoFlores(ctx, 21, 150, 1460, 2040, ['#ff7aa8', '#ffd23f', '#ffffff', '#c49bff', '#ff9a5c', '#7fc8ff'], '#4f9e4f');
    },
    vivo: function (ctx, t) {
      nuvensAndando(ctx, t, [[200, 300, 330, 14], [900, 520, 230, 20], [1500, 260, 280, 10], [2300, 700, 180, 26]], '#ffffff', 'rgba(160,195,235,0.45)');
      var cores = [['#ff8fc0', '#ffc2dc'], ['#ffd23f', '#ffa94d'], ['#9fb8ff', '#c9b5ff'], ['#7fe0c0', '#c2f5b0'], ['#ff9a6b', '#ffd0a8']];
      for (var i = 0; i < 5; i++) {
        var ph = i * 1.7, cx = 250 + i * 390, cy = 1150 + (i % 2) * 260;
        var x = cx + Math.sin(t * 0.33 * (1 + i * 0.13) + ph) * 220 + Math.sin(t * 0.9 + ph) * 50;
        var y = cy + Math.sin(t * 0.47 * (1 + i * 0.1) + ph) * 120 + Math.sin(t * 2.2 + ph) * 14;
        borboleta(ctx, x, y, 34, Math.abs(Math.sin(t * 8 + ph)), cores[i][0], cores[i][1]);
      }
    }
  };

  // ---------- fundo do mar ----------
  function coralGalho(ctx, x, y, ang, len, w, n, r) {
    var ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(ang + 0.3) * len * 0.5, y + Math.sin(ang + 0.3) * len * 0.5, ex, ey); ctx.stroke();
    if (n > 0) { coralGalho(ctx, ex, ey, ang - 0.45 - r() * 0.2, len * 0.72, w * 0.75, n - 1, r); coralGalho(ctx, ex, ey, ang + 0.4 + r() * 0.2, len * 0.7, w * 0.75, n - 1, r); }
    else bola(ctx, ex, ey, w * 0.75, ctx.strokeStyle);
  }
  function coral(ctx, x, y, s, cor, sem) { ctx.strokeStyle = cor; ctx.lineCap = 'round'; coralGalho(ctx, x, y, -Math.PI / 2, s * 0.35, s * 0.09, 3, sorteio(sem)); }
  function leque(ctx, x, y, s, cor, veia) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x, y);
    for (var i = 0; i <= 10; i++) { var a = Math.PI * (1.15 + i * 0.07); ctx.lineTo(x + Math.cos(a) * s * (0.95 + 0.06 * Math.sin(i * 2.4)), y + Math.sin(a) * s * (0.95 + 0.06 * Math.sin(i * 2.4))); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = veia; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round'; ctx.beginPath();
    for (i = 0; i <= 6; i++) { var b = Math.PI * (1.2 + i * 0.1); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(b) * s * 0.5, y + Math.sin(b) * s * 0.45, x + Math.cos(b) * s * 0.88, y + Math.sin(b) * s * 0.88); }
    ctx.stroke();
  }
  // posição do peixe i no instante t (metade vai para a direita, metade volta)
  function peixe(i, t) {
    var vai = i < 5, k = vai ? i : i - 5, d = vai ? 1 : -1, x = mod(t * (vai ? 120 : 95) + k * 75 + (k % 2) * 30 + (vai ? 0 : 1300), S + 700) - 350;
    if (!vai) x = S - x;
    return { x: x, y: (vai ? 940 : 520) + k * 42 - (k % 2) * 66 + Math.sin(t * 1.5 + i) * 14, d: d, b: Math.sin(t * 9 + i) * 5 };
  }
  CENA['fundo-do-mar'] = {
    parado: function (ctx) {
      var i, r = sorteio(33);
      ceu(ctx, [[0, '#8be6f2'], [0.25, '#4cc4e0'], [0.65, '#2a96ca'], [1, '#2171b0']]);
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      for (i = 0; i < 6; i++) { var x0 = 150 + i * 360; poli(ctx, [x0, 0, x0 + 140, 0, x0 - 140 + i * 30, 1500, x0 - 420 + i * 30, 1500], 'rgba(255,255,255,0.06)'); }
      morro(ctx, 1340, 90, 0.9, 2.5, 'rgba(90,170,210,0.5)');
      morro(ctx, 1450, 70, 1.3, 1.2, 'rgba(50,130,185,0.55)');
      morroG(ctx, 1610, 34, 1.6, 0.3, '#f6dfa4', '#e6c07c');
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      for (i = 0; i < 34; i++) { var x = r() * S, y = 1690 + r() * 340; ctx.moveTo(x - 40, y); ctx.quadraticCurveTo(x, y - 12, x + 40, y); } ctx.stroke();
      // pedras
      elipse(ctx, 360, 1660, 190, 110, '#8f86c4'); elipse(ctx, 250, 1640, 110, 90, '#a49be0'); elipse(ctx, 330, 1600, 60, 30, 'rgba(255,255,255,0.25)', -0.2);
      elipse(ctx, 1730, 1680, 170, 95, '#8f86c4'); elipse(ctx, 1840, 1650, 100, 80, '#a49be0');
      // corais
      leque(ctx, 600, 1680, 260, '#ff9f6b', 'rgba(255,220,180,0.7)');
      coral(ctx, 470, 1700, 420, '#ff7fa8', 5);
      coral(ctx, 1490, 1690, 380, '#b98cff', 9);
      leque(ctx, 1640, 1670, 220, '#ffb3d1', 'rgba(255,255,255,0.6)');
      coral(ctx, 1910, 1700, 300, '#ff9f6b', 13);
      // coral-cérebro
      elipse(ctx, 1150, 1760, 120, 70, '#ffcf6b'); ctx.strokeStyle = 'rgba(200,140,40,0.45)'; ctx.lineWidth = 6; ctx.beginPath();
      for (i = 0; i < 4; i++) { ctx.moveTo(1050 + i * 8, 1730 + i * 18); for (var k = 1; k <= 8; k++) ctx.quadraticCurveTo(1050 + i * 8 + k * 23 - 12, 1730 + i * 18 + (k % 2 ? -14 : 14), 1050 + i * 8 + k * 23, 1730 + i * 18); }
      ctx.stroke();
      // anêmona
      ctx.strokeStyle = '#ff86c8'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
      for (i = 0; i < 9; i++) { var a = Math.PI * (1.15 + i * 0.087); ctx.moveTo(860, 1800); ctx.quadraticCurveTo(860 + Math.cos(a) * 60, 1800 + Math.sin(a) * 90, 860 + Math.cos(a) * 110, 1800 + Math.sin(a) * 120); }
      ctx.stroke(); elipse(ctx, 860, 1810, 70, 30, '#e0609f');
      // concha com pérola, estrela-do-mar
      ctx.fillStyle = '#ffd6e6'; ctx.beginPath(); ctx.moveTo(1250, 1900); ctx.arc(1250, 1900, 80, Math.PI, TAU); ctx.closePath(); ctx.fill();
      bola(ctx, 1250, 1880, 26, '#fffaf2'); bola(ctx, 1242, 1872, 8, '#ffffff');
      elipse(ctx, 1250, 1912, 90, 22, '#ffc2d8');
      ctx.fillStyle = '#ffb04d'; ctx.beginPath(); estrelaP(ctx, 300, 1880, 60, 26, 5, 0.3); ctx.fill();
      ctx.fillStyle = '#ff7b7b'; ctx.beginPath(); estrelaP(ctx, 1600, 1950, 46, 20, 5, -0.2); ctx.fill();
      tufos(ctx, 77, 30, 1640, 2040, 'rgba(60,160,110,0.6)');
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); for (i = 0; i < 60; i++) circ(ctx, r() * S, 1700 + r() * 340, 3 + r() * 3); ctx.fill();
    },
    vivo: function (ctx, t) {
      var i, j, x, y;
      // raios de luz que tremem
      for (i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.05 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 2.1));
        var x0 = 400 + i * 600 + Math.sin(t * 0.2 + i) * 60;
        poli(ctx, [x0, 0, x0 + 110, 0, x0 - 160, 1600, x0 - 420, 1600], '#ffffff');
      }
      ctx.globalAlpha = 1;
      // algas balançando (fita que afina na ponta)
      var algas = [[150, 1700, 560], [700, 1720, 420], [980, 1700, 330], [1350, 1720, 480], [1610, 1700, 360], [1990, 1690, 620], [70, 1690, 380]];
      var cores = ['#3fae6e', '#6fcf86'];
      for (var c = 0; c < 2; c++) {
        ctx.fillStyle = cores[c]; ctx.beginPath();
        for (i = c; i < algas.length; i += 2) {
          var a = algas[i], L = [], R = [];
          for (j = 0; j <= 10; j++) {
            var k = j / 10, yy = a[1] - k * a[2], xx = a[0] + Math.sin(t * 1.1 + k * 3 + i * 1.3) * 55 * k + Math.sin(k * 6 + i) * 14, w = 34 * (1 - k * 0.85);
            L.push(xx - w, yy); R.push(xx + w, yy);
          }
          ctx.moveTo(L[0], L[1]);
          for (j = 2; j < L.length; j += 2) ctx.lineTo(L[j], L[j + 1]);
          for (j = R.length - 2; j >= 0; j -= 2) ctx.lineTo(R[j], R[j + 1]);
          ctx.closePath();
        }
        ctx.fill();
      }
      // dois cardumes: um vai para a direita, outro volta para a esquerda (ciclo curto: quase sempre tem peixe)
      var cores2 = ['#ffd23f', '#ff9a5c'];
      for (c = 0; c < 2; c++) {
        ctx.fillStyle = cores2[c]; ctx.beginPath();
        for (i = 0; i < 10; i++) if (peixe(i, t) && i % 2 === c) { var q = peixe(i, t); oval(ctx, q.x, q.y, 38, 22, 0); ctx.moveTo(q.x - 30 * q.d, q.y); ctx.lineTo(q.x - 62 * q.d, q.y - 22 + q.b); ctx.lineTo(q.x - 62 * q.d, q.y + 22 + q.b); ctx.closePath(); }
        ctx.fill();
      }
      ctx.fillStyle = '#3a3150'; ctx.beginPath();
      for (i = 0; i < 10; i++) { q = peixe(i, t); circ(ctx, q.x + 20 * q.d, q.y - 5, 5); }
      ctx.fill();
      // água-viva que pulsa e sobe devagar
      var ax = 1500 + Math.sin(t * 0.25) * 160, ay = 620 - mod(t * 18, 400) + 200, ap = 0.5 + 0.5 * Math.sin(t * 2.4), aw = 70 + ap * 14, ah = 56 - ap * 8;
      ctx.strokeStyle = 'rgba(255,190,230,0.8)'; ctx.lineWidth = 8; ctx.beginPath();
      for (i = 0; i < 4; i++) { var tx2 = ax - 45 + i * 30; ctx.moveTo(tx2, ay); ctx.quadraticCurveTo(tx2 + Math.sin(t * 3 + i) * 18, ay + 60, tx2 + Math.sin(t * 3 + i + 1) * 12, ay + 120 + ap * 10); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,170,220,0.85)'; ctx.beginPath(); ctx.moveTo(ax - aw, ay); ctx.bezierCurveTo(ax - aw, ay - ah * 1.6, ax + aw, ay - ah * 1.6, ax + aw, ay); ctx.quadraticCurveTo(ax, ay + 18, ax - aw, ay); ctx.fill();
      elipse(ctx, ax - aw * 0.4, ay - ah * 0.7, 16, 9, 'rgba(255,255,255,0.6)', -0.5);
      ctx.fillStyle = '#7a3f6a'; ctx.beginPath(); circ(ctx, ax - 20, ay - 22, 6); circ(ctx, ax + 20, ay - 22, 6); ctx.fill();
      // bolhas subindo
      ctx.beginPath();
      var bx = [1250, 1250, 1250, 360, 360, 1730, 600, 1490, 900, 1900];
      for (i = 0; i < 28; i++) {
        var vel = 70 + hash(i, 4) * 70, alt = 1650, p = mod(t * vel + hash(i, 5) * alt, alt);
        x = bx[i % bx.length] + (hash(i, 6) - 0.5) * 60 + Math.sin(t * 2 + i) * 12; y = 1820 - p;
        circ(ctx, x, y, 6 + hash(i, 7) * 16 * (0.6 + p / alt * 0.6));
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3.5; ctx.stroke();
    }
  };

  // ---------- espaço ----------
  var ANEL = { x: 1430, y: 640, r: 150, rx: 300, ry: 66, giro: -0.32 };
  function anelMeio(ctx, de, ate) {
    ctx.save(); ctx.translate(ANEL.x, ANEL.y); ctx.rotate(ANEL.giro); ctx.scale(1, ANEL.ry / ANEL.rx);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(255,214,160,0.9)'; ctx.lineWidth = 46; ctx.beginPath(); ctx.arc(0, 0, ANEL.rx, de, ate); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,140,0.9)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, ANEL.rx - 30, de, ate); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, ANEL.rx + 14, de, ate); ctx.stroke();
    ctx.restore();
  }
  CENA.espaco = {
    parado: function (ctx) {
      var i, r = sorteio(44);
      ceu(ctx, [[0, '#170f3e'], [0.5, '#2b1c66'], [1, '#41287f']]);
      var neb = [[480, 620, 720, 'rgba(255,120,210,0.24)'], [1560, 1240, 650, 'rgba(90,200,255,0.2)'], [1100, 260, 520, 'rgba(170,120,255,0.2)']];
      for (i = 0; i < neb.length; i++) { ctx.fillStyle = rad(ctx, neb[i][0], neb[i][1], 0, neb[i][0], neb[i][1], neb[i][2], [[0, neb[i][3]], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, S, S); }
      estrelinhas(ctx, 45, 270, S, 3);
      // planeta com anel: a metade de trás do anel, o planeta, depois a metade da frente
      anelMeio(ctx, Math.PI, TAU);
      ctx.save(); ctx.beginPath(); circ(ctx, ANEL.x, ANEL.y, ANEL.r); ctx.clip();
      ctx.fillStyle = rad(ctx, ANEL.x - 50, ANEL.y - 60, 10, ANEL.x, ANEL.y, ANEL.r, [[0, '#ffe2b0'], [0.6, '#ffaa80'], [1, '#e2718f']]); ctx.fillRect(ANEL.x - 160, ANEL.y - 160, 320, 320);
      ctx.translate(ANEL.x, ANEL.y); ctx.rotate(ANEL.giro);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-170, -70, 340, 26); ctx.fillRect(-170, 30, 340, 18);
      ctx.fillStyle = 'rgba(200,80,120,0.18)'; ctx.fillRect(-170, -20, 340, 30); ctx.fillRect(-170, 80, 340, 30);
      ctx.restore();
      anelMeio(ctx, 0, Math.PI);
      // planetinha azul com terra e nuvens
      ctx.save(); ctx.beginPath(); circ(ctx, 560, 1010, 95); ctx.clip();
      ctx.fillStyle = rad(ctx, 530, 980, 5, 560, 1010, 95, [[0, '#9fe0ff'], [1, '#3f8fe8']]); ctx.fillRect(460, 910, 200, 200);
      elipse(ctx, 520, 980, 50, 30, '#6fd08a', 0.4); elipse(ctx, 610, 1050, 44, 26, '#6fd08a', -0.3); elipse(ctx, 600, 960, 20, 12, '#6fd08a');
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(480, 1030); ctx.quadraticCurveTo(540, 1010, 590, 1030); ctx.moveTo(560, 950); ctx.quadraticCurveTo(600, 940, 640, 960); ctx.stroke();
      elipse(ctx, 600, 1060, 120, 80, 'rgba(20,20,80,0.18)');
      ctx.restore();
      ctx.strokeStyle = 'rgba(160,210,255,0.35)'; ctx.lineWidth = 10; ctx.beginPath(); circ(ctx, 560, 1010, 102); ctx.stroke();
      // lua com crateras
      bola(ctx, 1730, 1170, 60, '#ddd6f3'); bola(ctx, 1712, 1155, 14, '#c2b8e6'); bola(ctx, 1750, 1190, 10, '#c2b8e6'); bola(ctx, 1745, 1145, 7, '#c2b8e6');
      bola(ctx, 300, 380, 32, '#8ff0d0'); elipse(ctx, 300, 380, 52, 10, 'rgba(255,255,255,0.45)', -0.3);
      bola(ctx, 1000, 820, 18, '#ffb3d9');
      // planeta grandão lá embaixo
      var py = 3420, pr = 1900;
      ctx.strokeStyle = 'rgba(150,200,255,0.35)'; ctx.lineWidth = 40; ctx.beginPath(); ctx.arc(1024, py, pr + 10, 0, TAU); ctx.stroke();
      ctx.fillStyle = rad(ctx, 1024, py - pr, 50, 1024, py - pr + 300, 900, [[0, '#a07de6'], [1, '#5d40aa']]); ctx.beginPath(); ctx.arc(1024, py, pr, 0, TAU); ctx.fill();
      var cr = [[400, 1640, 90], [820, 1720, 60], [1250, 1600, 70], [1640, 1700, 110], [1060, 1880, 130], [300, 1920, 70], [1800, 1950, 80]];
      for (i = 0; i < cr.length; i++) { elipse(ctx, cr[i][0], cr[i][1], cr[i][2], cr[i][2] * 0.35, '#7b5bc7'); elipse(ctx, cr[i][0], cr[i][1] + cr[i][2] * 0.06, cr[i][2] * 0.8, cr[i][2] * 0.25, '#5d40aa'); }
    },
    vivo: function (ctx, t) {
      faiscas(ctx, t, 10, 40, 0, 0, S, 1500, 16, '#fffbe8');
      // luazinha girando em volta do planeta do anel (some quando passa atrás)
      var a = t * 0.45, mx = ANEL.x + Math.cos(a) * 270, my = ANEL.y + Math.sin(a) * 120 - Math.cos(a) * 60;
      if (!(Math.sin(a) < 0 && Math.abs(mx - ANEL.x) < ANEL.r + 10)) { bola(ctx, mx, my, 20, '#ffe9a8'); bola(ctx, mx - 6, my - 6, 6, '#fff8dc'); }
      // cometa de vez em quando (a cada 7 s, cruza o céu em 2,4 s)
      var ciclo = Math.floor(t / 7), p = (t - ciclo * 7) / 2.4;
      if (p < 1) {
        var y0 = 150 + hash(ciclo, 1) * 500, x = 2200 - p * 2600, y = y0 + p * 700, ang = Math.atan2(700, -2600);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI);
        ctx.fillStyle = guardado('cometa', function () { return lin(ctx, 0, 0, 460, 0, [[0, 'rgba(255,255,255,0.95)'], [0.3, 'rgba(180,220,255,0.5)'], [1, 'rgba(150,200,255,0)']]); });
        ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(460, 0); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill();
        bola(ctx, 0, 0, 26, 'rgba(200,230,255,0.4)'); bola(ctx, 0, 0, 14, '#ffffff');
        ctx.restore();
      }
    }
  };

  // ---------- cidade à noite ----------
  // prédios sorteados uma vez só (o "vivo" precisa saber onde estão as janelas)
  var CIDADE = null;
  function cidade() {
    if (CIDADE) return CIDADE;
    var r = sorteio(77), atras = [], frente = [], janelas = [], x = -40, w, h, i, j;
    while (x < S) { w = 120 + r() * 120; h = 300 + r() * 380; atras.push([x, 1500 - h, w, h, r()]); x += w + 6; }
    x = -20;
    while (x < S) {
      w = 170 + r() * 150; h = 220 + r() * 420 + (Math.abs(x + w / 2 - 1024) < 500 ? 120 : 0);
      var p = [x, 1525 - h, w, h, Math.floor(r() * 3), r()];
      frente.push(p);
      var cols = Math.floor((w - 40) / 46), lins = Math.floor((h - 70) / 62), mx = x + (w - cols * 46 + 16) / 2;
      for (i = 0; i < lins; i++) for (j = 0; j < cols; j++) janelas.push([mx + j * 46, 1525 - h + 40 + i * 62, 30, 40]);
      x += w + 18 + r() * 30;
    }
    CIDADE = { atras: atras, frente: frente, janelas: janelas };
    return CIDADE;
  }
  CENA['cidade-noite'] = {
    parado: function (ctx) {
      var c = cidade(), i, b;
      ceu(ctx, [[0, '#16205c'], [0.35, '#2d358a'], [0.6, '#6a50b0'], [0.74, '#c27ebe']]);
      estrelinhas(ctx, 78, 150, 1100, 2.5);
      sol(ctx, 1520, 420, 115, 'rgba(255,245,215,0.38)');
      bola(ctx, 1520, 420, 115, '#fff7dc'); bola(ctx, 1488, 392, 22, '#f2e6b8'); bola(ctx, 1550, 450, 16, '#f2e6b8'); bola(ctx, 1555, 380, 10, '#f2e6b8');
      for (i = 0; i < c.atras.length; i++) {
        b = c.atras[i]; caixa(ctx, b[0], b[1], b[2], b[3] + 40, 6, b[4] < 0.5 ? '#4b4aa2' : '#5452ad');
        ctx.fillStyle = 'rgba(255,220,140,0.45)';
        for (var y = b[1] + 30; y < 1480; y += 52) for (var x = b[0] + 18; x < b[0] + b[2] - 24; x += 40) if (hash(x, y) < 0.22) ctx.fillRect(x, y, 18, 26);
      }
      var cores = ['#2e3479', '#353c88', '#3c3f8f'];
      for (i = 0; i < c.frente.length; i++) {
        b = c.frente[i]; caixa(ctx, b[0], b[1], b[2], b[3] + 30, 8, cores[b[4]]);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(b[0], b[1] + 8, b[2] * 0.18, b[3]);
        if (b[5] < 0.3) { caixa(ctx, b[0] + b[2] / 2 - 4, b[1] - 90, 8, 92, 4, cores[b[4]]); bola(ctx, b[0] + b[2] / 2, b[1] - 92, 9, '#ff7b9c'); }
        else if (b[5] < 0.55) { caixa(ctx, b[0] + b[2] * 0.6, b[1] - 60, 60, 62, 10, cores[b[4]]); }
        else if (b[5] < 0.7) { poli(ctx, [b[0] + 10, b[1] + 2, b[0] + b[2] / 2, b[1] - 80, b[0] + b[2] - 10, b[1] + 2], cores[b[4]]); }
      }
      ctx.fillStyle = '#4a5299'; ctx.beginPath(); for (i = 0; i < c.janelas.length; i++) retR(ctx, c.janelas[i][0], c.janelas[i][1], 30, 40, 5); ctx.fill();
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); for (i = 0; i < c.janelas.length; i++) if (i % 4 === 0) retR(ctx, c.janelas[i][0], c.janelas[i][1], 30, 40, 5); ctx.fill();
      // calçada, rua, postes
      ctx.fillStyle = '#5a4f9c'; ctx.fillRect(0, 1525, S, 70);
      ctx.fillStyle = lin(ctx, 0, 1595, 0, S, [[0, '#302b5e'], [1, '#3d3670']]); ctx.fillRect(0, 1595, S, S - 1595);
      ctx.fillStyle = '#7a6fc0'; ctx.fillRect(0, 1590, S, 8);
      ctx.fillStyle = 'rgba(255,216,107,0.8)'; for (i = 0; i < 12; i++) caixa(ctx, i * 190 + 30, 1800, 110, 16, 8, 'rgba(255,216,107,0.8)');
      var postes = [260, 1024, 1790];
      for (i = 0; i < postes.length; i++) {
        var px = postes[i];
        ctx.fillStyle = rad(ctx, px, 1250, 10, px, 1300, 330, [[0, 'rgba(255,225,140,0.45)'], [1, 'rgba(255,225,140,0)']]); ctx.beginPath(); circ(ctx, px, 1300, 330); ctx.fill();
        caixa(ctx, px - 8, 1240, 16, 330, 6, '#23204d');
        ctx.strokeStyle = '#23204d'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, 1250); ctx.quadraticCurveTo(px, 1200, px + 40, 1205); ctx.stroke();
        elipse(ctx, px + 48, 1220, 32, 18, '#fff1b8');
        elipse(ctx, px + 40, 1580, 150, 18, 'rgba(255,225,140,0.25)');
      }
    },
    vivo: function (ctx, t) {
      var c = cidade(), i;
      // janelas que acendem e apagam, cada uma no seu tempo
      ctx.fillStyle = '#ffd86b'; ctx.beginPath(); var n = 0;
      for (i = 0; i < c.janelas.length && n < 70; i++) {
        if (i % 4 === 0 || hash(i, 7) > 0.3) continue;
        n++;
        var per = 2.5 + hash(i, 8) * 5;
        if (hash(i, Math.floor(t / per + hash(i, 9) * 10)) > 0.45) retR(ctx, c.janelas[i][0], c.janelas[i][1], 30, 40, 5);
      }
      ctx.fill();
      faiscas(ctx, t, 20, 16, 0, 0, S, 900, 13, '#fffbe8');
      // carrinhos passando
      for (i = 0; i < 2; i++) {
        var dir = i ? -1 : 1, x = i ? S + 300 - mod(t * 170 + 900, S + 600) : mod(t * 220, S + 600) - 300, y = i ? 1700 : 1900;
        ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
        ctx.fillStyle = guardado('farol', function () { return lin(ctx, 90, 0, 380, 0, [[0, 'rgba(255,240,170,0.55)'], [1, 'rgba(255,240,170,0)']]); });
        ctx.beginPath(); ctx.moveTo(90, -20); ctx.lineTo(380, -60); ctx.lineTo(380, 40); ctx.closePath(); ctx.fill();
        caixa(ctx, -110, -40, 210, 60, 22, i ? '#ff7b9c' : '#5ec0f0'); caixa(ctx, -60, -82, 110, 52, 22, i ? '#ff7b9c' : '#5ec0f0');
        caixa(ctx, -45, -72, 40, 34, 8, '#bfe6ff'); caixa(ctx, 2, -72, 38, 34, 8, '#bfe6ff');
        bola(ctx, -60, 20, 24, '#262344'); bola(ctx, 55, 20, 24, '#262344'); bola(ctx, -60, 20, 9, '#9f9ac8'); bola(ctx, 55, 20, 9, '#9f9ac8');
        bola(ctx, 92, -18, 9, '#fff6c8'); bola(ctx, -106, -18, 8, '#ff5a5a');
        ctx.restore();
      }
    }
  };

  // ---------- floresta ----------
  function cogumelo(ctx, x, y, s, cor) {
    caixa(ctx, x - s * 0.18, y - s * 0.55, s * 0.36, s * 0.57, s * 0.12, '#fff3e0');
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x - s * 0.55, y - s * 0.45); ctx.quadraticCurveTo(x - s * 0.55, y - s * 1.1, x, y - s * 1.1); ctx.quadraticCurveTo(x + s * 0.55, y - s * 1.1, x + s * 0.55, y - s * 0.45); ctx.quadraticCurveTo(x, y - s * 0.32, x - s * 0.55, y - s * 0.45); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); circ(ctx, x - s * 0.22, y - s * 0.78, s * 0.1); circ(ctx, x + s * 0.18, y - s * 0.88, s * 0.12); circ(ctx, x + s * 0.32, y - s * 0.6, s * 0.07); circ(ctx, x - s * 0.4, y - s * 0.56, s * 0.06); ctx.fill();
  }
  function arbusto(ctx, x, y, s, verde, fruta) {
    ctx.fillStyle = verde; ctx.beginPath(); circ(ctx, x - s * 0.35, y - s * 0.25, s * 0.3); circ(ctx, x, y - s * 0.4, s * 0.38); circ(ctx, x + s * 0.38, y - s * 0.24, s * 0.3); retR(ctx, x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.3, s * 0.1); ctx.fill();
    if (fruta) { ctx.fillStyle = fruta; ctx.beginPath(); var r = sorteio(Math.round(x)); for (var i = 0; i < 9; i++) circ(ctx, x + (r() - 0.5) * s * 1.0, y - s * 0.1 - r() * s * 0.55, s * 0.05); ctx.fill(); }
  }
  CENA.floresta = {
    parado: function (ctx) {
      var i, r = sorteio(55), x;
      ceu(ctx, [[0, '#96d6f6'], [0.42, '#d4f1ee'], [0.58, '#f4f9dd']]);
      ctx.fillStyle = '#b6e0bb'; ctx.beginPath(); for (x = 0; x < S + 80; x += 70) circ(ctx, x, 1140 + Math.sin(x * 0.03) * 20, 60 + hash(x, 1) * 50); ctx.fill(); ctx.fillStyle = '#b6e0bb'; ctx.fillRect(0, 1140, S, 300);
      for (i = 0; i < 14; i++) { x = i * 150 + r() * 60; pinheiro(ctx, x, 1290 + r() * 30, 300 + r() * 160, ['#8a6a55', '#86c99a', '#73b98a']); }
      morroG(ctx, 1330, 30, 1, 0.3, '#a3da86', '#6cbd5f');
      // caminho de terra
      ctx.fillStyle = '#ead09b'; ctx.beginPath(); ctx.moveTo(760, S); ctx.bezierCurveTo(900, 1800, 1150, 1600, 1000, 1360); ctx.lineTo(1050, 1358); ctx.bezierCurveTo(1230, 1580, 1080, 1820, 1340, S); ctx.closePath(); ctx.fill();
      arvore(ctx, 700, 1400, 560, ['#9c6a4c', '#4fae62', '#7acb7a']);
      arvore(ctx, 1420, 1420, 620, ['#9c6a4c', '#5ab868', '#86d47f']);
      // árvores grandonas nos lados
      caixa(ctx, 200, 500, 130, 1300, 40, '#8f5f43'); caixa(ctx, 220, 520, 30, 1250, 15, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = '#4aa65e'; ctx.beginPath(); circ(ctx, 260, 420, 300); circ(ctx, 40, 600, 220); circ(ctx, 470, 560, 200); circ(ctx, 300, 200, 220); ctx.fill();
      ctx.fillStyle = '#6cc276'; ctx.beginPath(); circ(ctx, 200, 320, 120); circ(ctx, 420, 480, 90); circ(ctx, 60, 520, 80); ctx.fill();
      caixa(ctx, 1730, 560, 140, 1260, 40, '#8f5f43'); caixa(ctx, 1750, 580, 30, 1200, 15, 'rgba(255,255,255,0.12)');
      ctx.fillStyle = '#4aa65e'; ctx.beginPath(); circ(ctx, 1800, 460, 300); circ(ctx, 2010, 640, 220); circ(ctx, 1580, 600, 190); circ(ctx, 1780, 230, 220); ctx.fill();
      ctx.fillStyle = '#6cc276'; ctx.beginPath(); circ(ctx, 1720, 360, 120); circ(ctx, 1620, 520, 80); circ(ctx, 1930, 560, 90); ctx.fill();
      arbusto(ctx, 520, 1640, 220, '#5ab868', '#ff6b8a'); arbusto(ctx, 1560, 1660, 240, '#5ab868', '#8f7bff');
      // tronco caído
      caixa(ctx, 1080, 1610, 260, 80, 40, '#a8724f'); elipse(ctx, 1320, 1650, 30, 40, '#d9a77a'); elipse(ctx, 1320, 1650, 15, 22, '#c08a60');
      cogumelo(ctx, 760, 1780, 120, '#ff6b6b'); cogumelo(ctx, 850, 1800, 80, '#ff8a6b'); cogumelo(ctx, 1290, 1860, 100, '#ff6b6b'); cogumelo(ctx, 1700, 1820, 90, '#c78bff');
      tufos(ctx, 56, 80, 1360, 2040, 'rgba(50,130,60,0.45)');
      campoFlores(ctx, 57, 60, 1400, 2040, ['#ffffff', '#ffd23f', '#ff9ec4', '#b9a3ff'], null);
      // samambaias nos cantos de baixo
      ctx.strokeStyle = '#3f9a58'; ctx.lineCap = 'round';
      for (i = 0; i < 4; i++) folhaPalma(ctx, i < 2 ? 80 : 1970, 2060, i < 2 ? -1.2 + i * 0.5 : -1.9 - (i - 2) * 0.5, 380, 700, '#3f9a58', '#7fcf86');
      // luz entrando pelas árvores
      ctx.fillStyle = 'rgba(255,255,220,0.13)';
      for (i = 0; i < 4; i++) poli(ctx, [1400 + i * 160, 0, 1480 + i * 160, 0, 700 + i * 200, 1700, 560 + i * 200, 1700], 'rgba(255,255,215,0.11)');
    },
    vivo: function (ctx, t) {
      var cores = ['#8fd16b', '#f7c548', '#f39a4a'], i, c;
      for (c = 0; c < 3; c++) {
        ctx.fillStyle = cores[c]; ctx.beginPath();
        for (i = c; i < 15; i += 3) {
          var v = 60 + hash(i, 1) * 50, y = mod(hash(i, 2) * 1700 + t * v, 1700) + 250, x = mod(hash(i, 3) * S + Math.sin(t * 0.9 + i) * 90 + t * 20, S);
          oval(ctx, x, y, 22, 11, t * (1 + hash(i, 4)) + i);
        }
        ctx.fill();
      }
      // pozinho de luz flutuando
      ctx.fillStyle = 'rgba(255,250,200,0.35)'; ctx.beginPath();
      for (i = 0; i < 14; i++) circ(ctx, 500 + hash(i, 5) * 1100 + Math.sin(t * 0.5 + i) * 40, 600 + hash(i, 6) * 1100 + Math.sin(t * 0.7 + i * 2) * 30, 6 + 6 * (0.5 + 0.5 * Math.sin(t * 2 + i)));
      ctx.fill();
      passaros(ctx, t, [[600, 860, 26, 70], [1500, 760, 22, 55]], '#4f6a7a');
    }
  };

  // ---------- neve ----------
  function montanhas(ctx, picos, base, cor, neve) {
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(0, base);
    for (var i = 0; i < picos.length; i++) ctx.lineTo(picos[i][0], picos[i][1]);
    ctx.lineTo(S, base); ctx.closePath(); ctx.fill();
    if (!neve) return;
    for (i = 1; i < picos.length - 1; i++) {
      var p = picos[i], a = picos[i - 1], b = picos[i + 1];
      if (p[1] > a[1] || p[1] > b[1]) continue;
      var k = 0.28, lx = p[0] + (a[0] - p[0]) * k, ly = p[1] + (a[1] - p[1]) * k, rx = p[0] + (b[0] - p[0]) * k, ry = p[1] + (b[1] - p[1]) * k;
      ctx.fillStyle = neve; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(rx, ry);
      ctx.quadraticCurveTo(rx - (rx - p[0]) * 0.3, ry + 30, p[0] + (rx - p[0]) * 0.35, ry - 10);
      ctx.quadraticCurveTo(p[0], ry + 40, p[0] - (p[0] - lx) * 0.35, ly - 5);
      ctx.quadraticCurveTo(lx + (p[0] - lx) * 0.3, ly + 30, lx, ly); ctx.closePath(); ctx.fill();
    }
  }
  var CHAMINE = [1478, 1130];
  CENA.neve = {
    parado: function (ctx) {
      var i, r = sorteio(66);
      ceu(ctx, [[0, '#8dbfee'], [0.38, '#c8dbf6'], [0.58, '#f2edfb']]);
      sol(ctx, 520, 430, 85, 'rgba(255,250,230,0.6)');
      montanhas(ctx, [[0, 1050], [260, 760], [520, 980], [880, 620], [1240, 1000], [1560, 700], [1880, 900], [S, 820]], 1300, '#b4c0ec', '#ffffff');
      montanhas(ctx, [[0, 1100], [400, 900], [700, 1100], [1100, 860], [1400, 1120], [1720, 950], [S, 1100]], 1300, '#97a8e0', '#f6f8ff');
      morro(ctx, 1210, 40, 1.4, 0.4, '#dfe8f8'); morro(ctx, 1230, 50, 1.4, 0.4, '#eef3fc');
      for (i = 0; i < 12; i++) pinheiro(ctx, 60 + i * 170 + r() * 50, 1270 + r() * 40, 180 + r() * 100, ['#7d6a65', '#5aa886', '#4a957a'], '#ffffff');
      // cabaninha
      var cx = 1400, cy = 1340;
      caixa(ctx, CHAMINE[0] - 25, CHAMINE[1], 50, 120, 6, '#b06a52'); caixa(ctx, CHAMINE[0] - 32, CHAMINE[1] - 14, 64, 26, 12, '#ffffff');
      caixa(ctx, cx - 160, cy - 170, 320, 175, 10, '#c97f58');
      ctx.strokeStyle = 'rgba(120,60,40,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); for (i = 1; i < 6; i++) { ctx.moveTo(cx - 160, cy - 170 + i * 30); ctx.lineTo(cx + 160, cy - 170 + i * 30); } ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(cx - 210, cy - 150); ctx.lineTo(cx, cy - 330); ctx.lineTo(cx + 210, cy - 150); ctx.quadraticCurveTo(cx + 215, cy - 115, cx + 170, cy - 125); ctx.quadraticCurveTo(cx, cy - 140, cx - 170, cy - 125); ctx.quadraticCurveTo(cx - 215, cy - 115, cx - 210, cy - 150); ctx.fill();
      ctx.fillStyle = '#dfe7f8'; ctx.beginPath(); ctx.moveTo(cx, cy - 330); ctx.lineTo(cx + 210, cy - 150); ctx.quadraticCurveTo(cx + 215, cy - 115, cx + 170, cy - 125); ctx.lineTo(cx, cy - 300); ctx.fill();
      ctx.fillStyle = 'rgba(255,214,107,0.35)'; ctx.beginPath(); circ(ctx, cx - 80, cy - 85, 80); ctx.fill();
      caixa(ctx, cx - 120, cy - 120, 80, 70, 8, '#ffd66b'); ctx.fillStyle = '#c97f58'; ctx.fillRect(cx - 83, cy - 120, 6, 70); ctx.fillRect(cx - 120, cy - 88, 80, 6);
      caixa(ctx, cx + 30, cy - 120, 80, 125, 10, '#8a4f3a'); bola(ctx, cx + 95, cy - 55, 7, '#ffd66b');
      morroG(ctx, 1390, 45, 0.9, 2.0, '#ffffff', '#e4ecfa');
      elipse(ctx, 500, 1560, 320, 40, 'rgba(160,180,230,0.25)'); elipse(ctx, 1500, 1640, 380, 50, 'rgba(160,180,230,0.25)'); elipse(ctx, 1000, 1900, 500, 60, 'rgba(160,180,230,0.2)');
      pinheiro(ctx, 230, 1820, 900, ['#7d6a65', '#4fa47f', '#3f8f70'], '#ffffff');
      pinheiro(ctx, 470, 1660, 520, ['#7d6a65', '#5aae88', '#4a9a7a'], '#ffffff');
      pinheiro(ctx, 1830, 1830, 950, ['#7d6a65', '#4fa47f', '#3f8f70'], '#ffffff');
      pinheiro(ctx, 1610, 1640, 480, ['#7d6a65', '#5aae88', '#4a9a7a'], '#ffffff');
      // boneco de neve
      var bx = 820, by = 1800;
      elipse(ctx, bx, by + 10, 150, 26, 'rgba(150,170,220,0.35)');
      bola(ctx, bx, by - 90, 120, '#ffffff'); bola(ctx, bx, by - 260, 88, '#ffffff'); bola(ctx, bx, by - 390, 66, '#ffffff');
      bola(ctx, bx + 30, by - 70, 100, 'rgba(180,195,235,0.3)'); bola(ctx, bx + 24, by - 248, 72, 'rgba(180,195,235,0.3)');
      caixa(ctx, bx - 75, by - 335, 150, 34, 17, '#ff6b7a'); caixa(ctx, bx + 20, by - 320, 36, 110, 16, '#ff6b7a');
      ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 80, by - 280); ctx.lineTo(bx - 200, by - 360); ctx.moveTo(bx - 170, by - 342); ctx.lineTo(bx - 190, by - 390); ctx.moveTo(bx + 80, by - 280); ctx.lineTo(bx + 200, by - 350); ctx.moveTo(bx + 172, by - 334); ctx.lineTo(bx + 205, by - 300); ctx.stroke();
      ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); ctx.moveTo(bx, by - 398); ctx.lineTo(bx + 75, by - 385); ctx.lineTo(bx, by - 376); ctx.fill();
      ctx.fillStyle = '#3f3a55'; ctx.beginPath(); circ(ctx, bx - 22, by - 412, 9); circ(ctx, bx + 22, by - 412, 9); for (i = 0; i < 5; i++) circ(ctx, bx - 30 + i * 15, by - 360 + Math.abs(i - 2) * -5 + 4, 5); circ(ctx, bx, by - 230, 9); circ(ctx, bx, by - 190, 9); ctx.fill();
      caixa(ctx, bx - 70, by - 455, 140, 18, 9, '#4a6fc4'); caixa(ctx, bx - 46, by - 540, 92, 92, 14, '#4a6fc4'); ctx.fillStyle = '#ff6b7a'; ctx.fillRect(bx - 46, by - 470, 92, 14);
      // brilhinhos na neve
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); for (i = 0; i < 40; i++) brilho(ctx, r() * S, 1420 + r() * 600, 6 + r() * 8); ctx.fill();
    },
    vivo: function (ctx, t) {
      // flocos: os maiores caem mais rápido (parecem mais perto)
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath();
      for (var i = 0; i < 64; i++) {
        var tam = 4 + hash(i, 1) * 9, v = 40 + tam * 9, y = mod(hash(i, 2) * S + t * v, S + 40) - 20, x = mod(hash(i, 3) * S + Math.sin(t * 0.8 + i) * 40 + t * 12, S);
        circ(ctx, x, y, tam);
      }
      ctx.fill();
      // fumacinha da chaminé
      for (i = 0; i < 6; i++) {
        var p = mod(t * 0.22 + i / 6, 1);
        ctx.fillStyle = 'rgba(235,235,245,' + (0.75 * (1 - p)).toFixed(3) + ')'; ctx.beginPath();
        circ(ctx, CHAMINE[0] + p * 120 + Math.sin(p * 6 + t) * 18, CHAMINE[1] - 30 - p * 380, 20 + p * 46); ctx.fill();
      }
    }
  };

  // ---------- castelo ----------
  var PONTAS = [[1024, 430], [760, 590], [1288, 590], [650, 840], [1398, 840]];
  function torre(ctx, x, w, topo, base, ponta, telhado, sombra, parede) {
    caixa(ctx, x - w / 2, topo, w, base - topo, 6, parede);
    ctx.fillStyle = 'rgba(150,110,200,0.14)'; ctx.fillRect(x + w * 0.18, topo, w * 0.32, base - topo);
    ctx.fillStyle = telhado; ctx.beginPath(); ctx.moveTo(x - w / 2 - 22, topo + 8); ctx.quadraticCurveTo(x - w * 0.2, topo - (topo - ponta) * 0.35, x, ponta); ctx.quadraticCurveTo(x + w * 0.2, topo - (topo - ponta) * 0.35, x + w / 2 + 22, topo + 8); ctx.quadraticCurveTo(x, topo + 30, x - w / 2 - 22, topo + 8); ctx.fill();
    ctx.fillStyle = sombra; ctx.beginPath(); ctx.moveTo(x, ponta); ctx.quadraticCurveTo(x + w * 0.2, topo - (topo - ponta) * 0.35, x + w / 2 + 22, topo + 8); ctx.quadraticCurveTo(x + w * 0.3, topo + 24, x + w * 0.12, topo + 20); ctx.closePath(); ctx.fill();
    caixa(ctx, x - 3, ponta - 90, 6, 92, 3, '#c9a86b');
    janelaArco(ctx, x, topo + 60, w * 0.3, w * 0.42);
  }
  function janelaArco(ctx, x, y, w, h) {
    ctx.fillStyle = '#8f7cf0'; ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + w / 2); ctx.arc(x, y + w / 2, w / 2, Math.PI, TAU); ctx.lineTo(x + w / 2, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(x - w * 0.3, y + w * 0.3, w * 0.16, h * 0.5);
  }
  CENA.castelo = {
    parado: function (ctx) {
      var i, x;
      ceu(ctx, [[0, '#a6cdf9'], [0.32, '#d8d4fb'], [0.58, '#ffdbe9']]);
      ctx.fillStyle = rad(ctx, 1024, 760, 50, 1024, 760, 800, [[0, 'rgba(255,248,252,0.75)'], [1, 'rgba(255,248,252,0)']]); ctx.fillRect(0, 0, S, S);
      nuvem(ctx, 300, 420, 340, '#ffffff', 'rgba(200,170,235,0.4)'); nuvem(ctx, 1760, 330, 300, '#ffffff', 'rgba(200,170,235,0.4)'); nuvem(ctx, 1840, 900, 180, '#ffffff', 'rgba(200,170,235,0.4)');
      morroG(ctx, 1190, 45, 1.2, 1.0, '#c4ecce', '#a8e0b8');
      morroG(ctx, 1300, 50, 0.9, 3.0, '#a8e2b5', '#8fd6a2');
      var pa = '#f1e6ff', te = '#ff8cc6', tes = '#ee6fb2', li = '#b98cff', lis = '#a171f0';
      // muralha com ameias
      caixa(ctx, 600, 1000, 848, 330, 8, pa);
      ctx.fillStyle = pa; for (x = 600; x < 1448; x += 56) ctx.fillRect(x, 960, 34, 50);
      ctx.fillStyle = 'rgba(160,120,210,0.12)'; ctx.fillRect(600, 1240, 848, 90);
      // pedrinhas
      ctx.fillStyle = 'rgba(190,160,230,0.35)'; ctx.beginPath(); var r = sorteio(91); for (i = 0; i < 26; i++) retR(ctx, 620 + r() * 800, 1030 + r() * 260, 44, 22, 10); ctx.fill();
      torre(ctx, 650, 80, 980, 1330, PONTAS[3][1], te, tes, pa);
      torre(ctx, 1398, 80, 980, 1330, PONTAS[4][1], te, tes, pa);
      torre(ctx, 760, 120, 820, 1330, PONTAS[1][1], li, lis, pa);
      torre(ctx, 1288, 120, 820, 1330, PONTAS[2][1], li, lis, pa);
      torre(ctx, 1024, 250, 760, 1330, PONTAS[0][1], te, tes, pa);
      // coração na torre do meio, porta em arco
      ctx.fillStyle = '#ff7bb5'; ctx.beginPath(); ctx.moveTo(1024, 1090); ctx.bezierCurveTo(970, 1050, 985, 1000, 1024, 1025); ctx.bezierCurveTo(1063, 1000, 1078, 1050, 1024, 1090); ctx.fill();
      ctx.fillStyle = '#b3784e'; ctx.beginPath(); ctx.moveTo(964, 1330); ctx.lineTo(964, 1220); ctx.arc(1024, 1220, 60, Math.PI, TAU); ctx.lineTo(1084, 1330); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(90,50,30,0.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1004, 1170); ctx.lineTo(1004, 1330); ctx.moveTo(1044, 1170); ctx.lineTo(1044, 1330); ctx.stroke();
      bola(ctx, 1062, 1270, 8, '#ffd66b');
      ctx.strokeStyle = '#ffd66b'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(1024, 1220, 66, Math.PI, TAU); ctx.stroke();
      // caminho até a porta
      ctx.fillStyle = '#f7e2b6'; ctx.beginPath(); ctx.moveTo(970, 1330); ctx.bezierCurveTo(940, 1600, 760, 1800, 820, S); ctx.lineTo(1260, S); ctx.bezierCurveTo(1200, 1800, 1100, 1600, 1080, 1330); ctx.closePath(); ctx.fill();
      arvore(ctx, 330, 1420, 420, ['#b07a5a', '#6cc58a', '#94dca0']); arvore(ctx, 1730, 1440, 460, ['#b07a5a', '#6cc58a', '#94dca0']);
      arbusto(ctx, 560, 1360, 140, '#7fcf95', '#ff8cc6'); arbusto(ctx, 1490, 1360, 150, '#7fcf95', '#ffd66b');
      campoFlores(ctx, 92, 90, 1380, 2040, ['#ff8cc6', '#ffffff', '#ffd66b', '#b98cff', '#8fd3ff'], '#5aae76');
    },
    vivo: function (ctx, t) {
      var cores = ['#ff6fa8', '#ffd23f', '#8fd3ff', '#ffd23f', '#ff6fa8'];
      for (var i = 0; i < PONTAS.length; i++) {
        var px = PONTAS[i][0], py = PONTAS[i][1] - 86, L = i ? 70 : 90, top = [], bot = [];
        for (var k = 0; k <= 6; k++) {
          var f = k / 6, onda = Math.sin(t * 5 - k * 0.9 + i) * 7 * f;
          top.push(px + 3 + f * L, py + onda + f * 8); bot.push(px + 3 + f * L, py + 44 - f * 30 + onda);
        }
        ctx.fillStyle = cores[i]; ctx.beginPath(); ctx.moveTo(top[0], top[1]);
        for (k = 2; k < top.length; k += 2) ctx.lineTo(top[k], top[k + 1]);
        for (k = bot.length - 2; k >= 0; k -= 2) ctx.lineTo(bot[k], bot[k + 1]);
        ctx.closePath(); ctx.fill();
      }
      faiscas(ctx, t, 30, 16, 520, 380, 1000, 900, 22, '#fffbe6');
      passaros(ctx, t, [[300, 700, 26, 50], [1400, 560, 22, 40]], '#8a7bb8');
    }
  };

  // ---------- céu de arco-íris ----------
  var ARCO = ['#ff8a8a', '#ffb36b', '#ffe07a', '#8fe08a', '#7cc8ff', '#8f9cff', '#c79bff'];
  CENA['ceu-arco-iris'] = {
    parado: function (ctx) {
      var i, r = sorteio(12);
      ceu(ctx, [[0, '#7ac7fb'], [0.45, '#bfe5ff'], [0.72, '#ffe3f2']]);
      sol(ctx, 1760, 360, 100);
      ctx.lineCap = 'butt';
      for (i = 0; i < ARCO.length; i++) { ctx.strokeStyle = ARCO[i]; ctx.lineWidth = 64; ctx.beginPath(); ctx.arc(1024, 1560, 960 - i * 62, Math.PI, TAU); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(1024, 1560, 985, Math.PI, TAU); ctx.stroke();
      nuvem(ctx, 260, 360, 260, '#ffffff', 'rgba(190,180,240,0.35)'); nuvem(ctx, 1150, 260, 200, '#ffffff', 'rgba(190,180,240,0.35)');
      // chão de nuvens (as pontas do arco-íris somem nelas)
      ctx.fillStyle = 'rgba(205,195,245,0.8)'; ctx.beginPath(); for (i = 0; i < 26; i++) circ(ctx, i * 85 - 20 + r() * 30, 1440 + r() * 110 + 30, 120 + r() * 70); ctx.rect(0, 1560, S, S - 1560); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); r = sorteio(12); for (i = 0; i < 26; i++) circ(ctx, i * 85 - 20 + r() * 30, 1440 + r() * 110, 120 + r() * 70); ctx.rect(0, 1530, S, S - 1530); ctx.fill();
      ctx.fillStyle = 'rgba(205,195,245,0.45)'; ctx.beginPath(); for (i = 0; i < 18; i++) circ(ctx, r() * S, 1750 + r() * 300, 100 + r() * 80); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); r = sorteio(13); for (i = 0; i < 18; i++) circ(ctx, r() * S, 1730 + r() * 300, 100 + r() * 80); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,170,0.9)'; ctx.beginPath(); for (i = 0; i < 14; i++) brilho(ctx, r() * S, 200 + r() * 1100, 10 + r() * 14); ctx.fill();
    },
    vivo: function (ctx, t) {
      // brilho que passa pelo arco-íris
      var a = Math.PI + mod(t * 0.3, 1.8) * Math.PI / 1.5 - 0.2;
      if (a > Math.PI && a < TAU) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 434; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.arc(1024, 1560, 774, a - 0.05, Math.min(a + 0.05, TAU)); ctx.stroke(); }
      nuvensAndando(ctx, t, [[0, 520, 240, 22], [800, 820, 200, 16], [1400, 640, 280, 12], [2100, 980, 170, 26]], '#ffffff', 'rgba(190,180,240,0.35)');
      faiscas(ctx, t, 40, 14, 0, 150, S, 1250, 22, '#fffbe2');
      passaros(ctx, t, [[300, 1100, 24, 60]], '#7a87c8');
    }
  };

  // ---------- fazenda ----------
  var MOINHO = [1560, 880];
  CENA.fazenda = {
    parado: function (ctx) {
      var i, x;
      ceu(ctx, [[0, '#7cc8f5'], [0.45, '#c3e8fb'], [0.6, '#fff2d2']]);
      sol(ctx, 380, 420, 100);
      morroG(ctx, 1150, 45, 1.3, 2.0, '#bfe4a9', '#a8da96');
      // plantação listrada
      ctx.save(); ctx.beginPath(); ctx.moveTo(0, S); for (x = 0; x <= S; x += 32) ctx.lineTo(x, ondaY(x, 1250, 30, 0.8, 1.0)); ctx.lineTo(S, S); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#a5d873'; ctx.fillRect(0, 1150, S, 900);
      ctx.fillStyle = '#c0e48d'; for (i = -10; i < 30; i++) poli(ctx, [1024 + i * 60, 1150, 1024 + i * 60 + 30, 1150, 1024 + (i + 0.5) * 260, 1600, 1024 + i * 260, 1600], '#c0e48d');
      ctx.restore();
      // celeiro
      var cx = 560, cy = 1330;
      caixa(ctx, cx - 330, cy - 330, 120, 340, 60, '#cfdcec'); ctx.fillStyle = 'rgba(120,140,170,0.25)'; for (i = 0; i < 5; i++) ctx.fillRect(cx - 330, cy - 260 + i * 55, 120, 8);
      ctx.fillStyle = '#e45a4f'; ctx.beginPath(); ctx.moveTo(cx - 200, cy); ctx.lineTo(cx - 200, cy - 230); ctx.lineTo(cx - 140, cy - 330); ctx.lineTo(cx, cy - 400); ctx.lineTo(cx + 140, cy - 330); ctx.lineTo(cx + 200, cy - 230); ctx.lineTo(cx + 200, cy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#fff7ec'; ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(cx - 215, cy - 225); ctx.lineTo(cx - 145, cy - 338); ctx.lineTo(cx, cy - 412); ctx.lineTo(cx + 145, cy - 338); ctx.lineTo(cx + 215, cy - 225); ctx.stroke();
      ctx.fillStyle = 'rgba(120,20,30,0.15)'; ctx.fillRect(cx + 60, cy - 300, 140, 300);
      ctx.strokeStyle = '#fff7ec'; ctx.lineWidth = 12; ctx.beginPath(); ctx.rect(cx - 90, cy - 190, 180, 190); ctx.moveTo(cx - 90, cy - 190); ctx.lineTo(cx + 90, cy); ctx.moveTo(cx + 90, cy - 190); ctx.lineTo(cx - 90, cy); ctx.stroke();
      caixa(ctx, cx - 45, cy - 330, 90, 80, 8, '#fff7ec'); caixa(ctx, cx - 33, cy - 318, 66, 56, 6, '#ffd36b');
      // moinho (as pás giram no vivo)
      var mx = MOINHO[0];
      ctx.fillStyle = '#f3e2c4'; ctx.beginPath(); ctx.moveTo(mx - 150, 1340); ctx.lineTo(mx - 85, MOINHO[1] + 30); ctx.lineTo(mx + 85, MOINHO[1] + 30); ctx.lineTo(mx + 150, 1340); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(160,110,70,0.15)'; ctx.beginPath(); ctx.moveTo(mx + 30, 1340); ctx.lineTo(mx + 20, MOINHO[1] + 30); ctx.lineTo(mx + 85, MOINHO[1] + 30); ctx.lineTo(mx + 150, 1340); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#b4603f'; ctx.beginPath(); ctx.moveTo(mx - 115, MOINHO[1] + 40); ctx.quadraticCurveTo(mx, MOINHO[1] - 170, mx + 115, MOINHO[1] + 40); ctx.closePath(); ctx.fill();
      caixa(ctx, mx - 40, 1240, 80, 100, 40, '#9a5a3c'); janelaArco(ctx, mx, 1040, 54, 70);
      // cerca
      morroG(ctx, 1440, 28, 1.1, 0.7, '#93d672', '#68bf55');
      ctx.fillStyle = '#fff7ec';
      for (x = 20; x < S; x += 125) { var y = ondaY(x, 1440, 28, 1.1, 0.7) + 60; caixa(ctx, x - 14, y - 150, 28, 160, 8, '#fff7ec'); poli(ctx, [x - 14, y - 146, x, y - 166, x + 14, y - 146], '#fff7ec'); }
      ctx.strokeStyle = '#fff7ec'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
      for (var k = 0; k < 2; k++) { for (x = 0; x <= S; x += 32) { y = ondaY(x, 1440, 28, 1.1, 0.7) + 60 - 110 + k * 60; if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } } ctx.stroke();
      ctx.strokeStyle = 'rgba(180,150,120,0.25)'; ctx.lineWidth = 5; ctx.stroke();
      // fardos de feno e abóboras
      var fen = [[1120, 1700, 90], [1300, 1740, 76]];
      for (i = 0; i < fen.length; i++) { bola(ctx, fen[i][0], fen[i][1], fen[i][2], '#f2c95e'); ctx.strokeStyle = '#d9a83e'; ctx.lineWidth = 6; ctx.beginPath(); for (k = 1; k < 4; k++) circ(ctx, fen[i][0], fen[i][1], fen[i][2] * k / 4); ctx.stroke(); }
      var ab = [[1760, 1820, 60], [1860, 1850, 46], [300, 1880, 54]];
      for (i = 0; i < ab.length; i++) { var a = ab[i]; ctx.fillStyle = '#ff9a3c'; ctx.beginPath(); oval(ctx, a[0] - a[2] * 0.4, a[1], a[2] * 0.6, a[2] * 0.8); oval(ctx, a[0] + a[2] * 0.4, a[1], a[2] * 0.6, a[2] * 0.8); oval(ctx, a[0], a[1], a[2] * 0.6, a[2] * 0.85); ctx.fill(); caixa(ctx, a[0] - 6, a[1] - a[2] - 18, 12, 26, 5, '#6a9a3c'); }
      tufos(ctx, 31, 70, 1500, 2040, 'rgba(60,140,50,0.4)');
      campoFlores(ctx, 32, 50, 1520, 2040, ['#ffffff', '#ffd23f', '#ff9ec4'], null);
    },
    vivo: function (ctx, t) {
      nuvensAndando(ctx, t, [[300, 320, 300, 12], [1300, 560, 220, 18], [2000, 260, 250, 9]], '#ffffff', 'rgba(160,195,235,0.45)');
      ctx.save(); ctx.translate(MOINHO[0], MOINHO[1]); ctx.rotate(t * 0.9);
      for (var i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        caixa(ctx, -8, -370, 16, 340, 6, '#8a5a3c');
        caixa(ctx, 8, -360, 70, 280, 6, '#fffaf0');
        ctx.strokeStyle = '#d8b48a'; ctx.lineWidth = 5; ctx.beginPath();
        for (var k = 1; k < 6; k++) { ctx.moveTo(8, -360 + k * 47); ctx.lineTo(78, -360 + k * 47); }
        ctx.moveTo(43, -360); ctx.lineTo(43, -80); ctx.stroke();
      }
      ctx.restore();
      bola(ctx, MOINHO[0], MOINHO[1], 26, '#8a5a3c'); bola(ctx, MOINHO[0], MOINHO[1], 11, '#d8b48a');
      passaros(ctx, t, [[0, 640, 26, 55], [700, 520, 22, 45]], '#5b6f96');
    }
  };

  // ---------- terra dos doces ----------
  function pirulito(ctx, x, y, r, base, cores, haste) {
    caixa(ctx, x - r * 0.07, y, r * 0.14, haste, r * 0.07, '#fff7ef');
    bola(ctx, x, y, r, base);
    ctx.lineCap = 'round';
    for (var c = 0; c < cores.length; c++) {
      ctx.strokeStyle = cores[c]; ctx.lineWidth = r * 0.16; ctx.beginPath();
      for (var k = 0; k <= 60; k++) { var a = k * 0.42 + c * Math.PI * 2 / cores.length, rr = r * 0.92 * k / 60; if (k) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
    elipse(ctx, x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.12, 'rgba(255,255,255,0.55)', -0.7);
  }
  function bengala(ctx, x, y, h, giro) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(giro || 0);
    ctx.lineCap = 'round'; ctx.lineWidth = h * 0.12;
    function forma() { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * 0.75); ctx.arc(h * 0.17, -h * 0.75, h * 0.17, Math.PI, TAU); ctx.lineTo(h * 0.34, -h * 0.66); }
    ctx.strokeStyle = '#fffaf5'; forma(); ctx.stroke();
    if (ctx.setLineDash) { ctx.setLineDash([h * 0.09, h * 0.09]); ctx.strokeStyle = '#ff5f7e'; ctx.lineCap = 'butt'; forma(); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  }
  function sorvete(ctx, x, y, w, h, cor) {   // morro de sorvete com a borda escorrendo
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x - w / 2, y);
    ctx.bezierCurveTo(x - w / 2, y - h * 1.3, x + w / 2, y - h * 1.3, x + w / 2, y);
    for (var i = 0; i < 6; i++) { var x1 = x + w / 2 - (i + 1) * w / 6, gota = (i % 2 ? 0.14 : 0.26) * h; ctx.bezierCurveTo(x + w / 2 - i * w / 6, y + gota * 1.4, x1, y + gota * 1.4, x1, y); }
    ctx.closePath(); ctx.fill();
    elipse(ctx, x - w * 0.18, y - h * 0.62, w * 0.12, h * 0.1, 'rgba(255,255,255,0.45)', -0.5);
  }
  CENA.doces = {
    parado: function (ctx) {
      var i, r = sorteio(88);
      ceu(ctx, [[0, '#ffb6df'], [0.4, '#ffd8ef'], [0.6, '#fff0e3']]);
      sol(ctx, 1020, 420, 90, 'rgba(255,250,200,0.65)');
      nuvem(ctx, 320, 380, 330, '#ffd0ea', 'rgba(240,150,205,0.45)'); nuvem(ctx, 1640, 300, 300, '#d6ecff', 'rgba(150,190,240,0.45)'); nuvem(ctx, 1180, 760, 180, '#eadcff', 'rgba(190,160,240,0.45)');
      sorvete(ctx, 260, 1250, 560, 320, '#bff2dc'); sorvete(ctx, 1760, 1240, 620, 360, '#ffc0d3'); sorvete(ctx, 1000, 1240, 520, 220, '#fff0c4'); sorvete(ctx, 620, 1270, 420, 250, '#e7c0a0'); sorvete(ctx, 1400, 1270, 420, 260, '#d9c8ff');
      morroG(ctx, 1290, 26, 1.2, 0.5, '#ffd0e4', '#ffb3d2');
      // granulado no chão
      var cg = ['#ff6b8a', '#ffd23f', '#6fd0ff', '#8fe08a', '#c79bff', '#ffffff'];
      ctx.lineCap = 'round'; ctx.lineWidth = 9;
      for (var c = 0; c < cg.length; c++) { ctx.strokeStyle = cg[c]; ctx.beginPath(); for (i = 0; i < 28; i++) { var x = r() * S, y = 1330 + r() * 700, a = r() * TAU; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); } ctx.stroke(); }
      pirulito(ctx, 330, 1040, 150, '#ffffff', ['#ff6fa8', '#ffb3d2'], 520);
      pirulito(ctx, 1730, 1080, 130, '#fff6c8', ['#ff8a5c', '#ffd23f', '#6fd0ff', '#8fe08a'], 470);
      pirulito(ctx, 1240, 1240, 70, '#ffffff', ['#9b7bff'], 260);
      bengala(ctx, 640, 1720, 460, -0.06); bengala(ctx, 1560, 1700, 380, 0.08);
      // cupcake
      var cx = 1010, cy = 1700;
      ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.moveTo(cx - 170, cy - 170); ctx.lineTo(cx + 170, cy - 170); ctx.lineTo(cx + 130, cy + 40); ctx.lineTo(cx - 130, cy + 40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (i = 0; i < 6; i++) poli(ctx, [cx - 150 + i * 56, cy - 170, cx - 130 + i * 56, cy - 170, cx - 108 + i * 46, cy + 40, cx - 122 + i * 46, cy + 40], 'rgba(255,255,255,0.4)');
      ctx.fillStyle = '#ffb3d9'; ctx.beginPath(); oval(ctx, cx, cy - 190, 200, 70); oval(ctx, cx, cy - 260, 150, 60); oval(ctx, cx, cy - 320, 95, 48); oval(ctx, cx, cy - 365, 50, 34); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); oval(ctx, cx - 70, cy - 210, 60, 18, -0.2); oval(ctx, cx - 50, cy - 280, 40, 14, -0.2); ctx.fill();
      bola(ctx, cx + 8, cy - 410, 34, '#ff4f6e'); bola(ctx, cx - 2, cy - 420, 9, 'rgba(255,255,255,0.7)');
      ctx.strokeStyle = '#4f9e4f'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx + 10, cy - 440); ctx.quadraticCurveTo(cx + 20, cy - 480, cx + 50, cy - 490); ctx.stroke();
      // balas de goma e rosquinha
      var gomas = [['#ff6b8a', 760, 1900], ['#ffd23f', 860, 1930], ['#6fd0ff', 1240, 1910], ['#8fe08a', 1340, 1940], ['#c79bff', 400, 1960]];
      for (i = 0; i < gomas.length; i++) { var g = gomas[i]; ctx.fillStyle = g[0]; ctx.beginPath(); ctx.moveTo(g[1] - 50, g[2]); ctx.bezierCurveTo(g[1] - 50, g[2] - 90, g[1] + 50, g[2] - 90, g[1] + 50, g[2]); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); circ(ctx, g[1] - 15, g[2] - 45, 6); circ(ctx, g[1] + 12, g[2] - 30, 5); circ(ctx, g[1] - 25, g[2] - 18, 4); ctx.fill(); }
      elipse(ctx, 1780, 1880, 150, 80, '#f2c27e'); elipse(ctx, 1780, 1870, 130, 64, '#ff8cc6'); elipse(ctx, 1780, 1870, 50, 24, '#ffb6df'); elipse(ctx, 1780, 1874, 40, 18, '#e9b06e');
      ctx.lineWidth = 7; for (c = 0; c < 4; c++) { ctx.strokeStyle = cg[c]; ctx.beginPath(); for (i = 0; i < 4; i++) { var a2 = (c * 4 + i) * 0.4, rr = 80 + (i % 2) * 22; ctx.moveTo(1780 + Math.cos(a2) * rr, 1870 + Math.sin(a2) * rr * 0.5); ctx.lineTo(1780 + Math.cos(a2) * rr + 12, 1870 + Math.sin(a2) * rr * 0.5 + 6); } ctx.stroke(); }
    },
    vivo: function (ctx, t) {
      // chuva de granulado (agrupado por cor: 6 traços por quadro)
      var cg = ['#ff6b8a', '#ffd23f', '#6fd0ff', '#8fe08a', '#c79bff', '#ffffff'];
      ctx.lineCap = 'round'; ctx.lineWidth = 10;
      for (var c = 0; c < cg.length; c++) {
        ctx.strokeStyle = cg[c]; ctx.beginPath();
        for (var i = c; i < 60; i += cg.length) {
          var v = 110 + hash(i, 1) * 80, y = mod(hash(i, 2) * S + t * v, S + 60) - 30, x = hash(i, 3) * S + Math.sin(t + i) * 20, a = t * (1 + hash(i, 4) * 2) + i;
          ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22);
        }
        ctx.stroke();
      }
      faiscas(ctx, t, 50, 10, 200, 880, 1650, 450, 24, '#ffffff');
    }
  };

  // ---------- dinossauros ----------
  var CRATERA = [1380, 790];
  function samambaia(ctx, x, y, L, giro, cor) { folhaPalma(ctx, x, y, giro, L, L * 1.6, cor, 'rgba(255,255,255,0.3)'); }
  CENA.dinossauros = {
    parado: function (ctx) {
      var i;
      ceu(ctx, [[0, '#8ad3f1'], [0.38, '#d4ecd9'], [0.6, '#ffdfae']]);
      sol(ctx, 420, 380, 95);
      montanhas(ctx, [[0, 1080], [300, 900], [560, 1040], [820, 930], [1050, 1060], [1700, 980], [1950, 880], [S, 950]], 1300, '#c3b4e2', null);
      // vulcão
      ctx.fillStyle = lin(ctx, 0, CRATERA[1], 0, 1320, [[0, '#a8705d'], [1, '#7d5048']]); ctx.beginPath();
      ctx.moveTo(1000, 1320); ctx.quadraticCurveTo(1200, 1100, 1300, CRATERA[1]); ctx.lineTo(1460, CRATERA[1]); ctx.quadraticCurveTo(1560, 1100, 1800, 1320); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(1300, CRATERA[1]); ctx.quadraticCurveTo(1200, 1100, 1000, 1320); ctx.lineTo(1150, 1320); ctx.quadraticCurveTo(1260, 1100, 1330, CRATERA[1]); ctx.fill();
      elipse(ctx, CRATERA[0], CRATERA[1], 82, 20, '#ff7a3a');
      ctx.strokeStyle = '#ff9a3c'; ctx.lineCap = 'round'; ctx.lineWidth = 26; ctx.beginPath();
      ctx.moveTo(1350, CRATERA[1] + 10); ctx.quadraticCurveTo(1320, 900, 1340, 960); ctx.moveTo(1420, CRATERA[1] + 10); ctx.quadraticCurveTo(1450, 880, 1430, 1000); ctx.quadraticCurveTo(1420, 1060, 1460, 1100); ctx.stroke();
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 9; ctx.stroke();
      morroG(ctx, 1290, 40, 1.6, 2.2, '#9fd486', '#86c470');
      // dinossauro pescoçudo, fofo, ao fundo
      var dx = 600, dy = 1235, dc = '#86d3a4', de = '#6cbf8e';
      ctx.strokeStyle = dc; ctx.lineCap = 'round'; ctx.lineWidth = 64; ctx.beginPath(); ctx.moveTo(dx + 110, dy - 40); ctx.quadraticCurveTo(dx + 230, dy - 150, dx + 230, dy - 330); ctx.stroke();
      ctx.lineWidth = 50; ctx.beginPath(); ctx.moveTo(dx - 150, dy); ctx.quadraticCurveTo(dx - 300, dy + 20, dx - 380, dy - 30); ctx.stroke();
      ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(dx - 360, dy - 20); ctx.lineTo(dx - 420, dy - 60); ctx.stroke();
      caixa(ctx, dx - 130, dy, 60, 120, 26, de); caixa(ctx, dx + 60, dy, 60, 120, 26, de);
      elipse(ctx, dx, dy, 200, 115, dc);
      caixa(ctx, dx - 90, dy + 10, 62, 130, 28, dc); caixa(ctx, dx + 100, dy + 10, 62, 130, 28, dc);
      elipse(ctx, dx + 10, dy + 50, 150, 50, 'rgba(255,255,255,0.25)');
      elipse(ctx, dx + 250, dy - 360, 74, 46, dc, -0.15);
      ctx.fillStyle = de; ctx.beginPath(); circ(ctx, dx - 60, dy - 50, 22); circ(ctx, dx + 20, dy - 70, 16); circ(ctx, dx + 60, dy - 20, 18); circ(ctx, dx - 110, dy - 5, 13); ctx.fill();
      bola(ctx, dx + 268, dy - 376, 10, '#2f3a40'); bola(ctx, dx + 271, dy - 380, 3.5, '#ffffff');
      elipse(ctx, dx + 270, dy - 346, 14, 8, 'rgba(255,140,160,0.6)');
      ctx.strokeStyle = '#2f3a40'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(dx + 290, dy - 342); ctx.quadraticCurveTo(dx + 305, dy - 335, dx + 318, dy - 348); ctx.stroke();
      palmeira(ctx, 170, 1720, 820, 140, ['#c29068', '#a37550', '#58b870', '#3f9d5c', '#8a5a3a']);
      palmeira(ctx, 1880, 1700, 700, -130, ['#c29068', '#a37550', '#62c07a', '#46a466', '#8a5a3a']);
      palmeira(ctx, 1130, 1395, 380, -30, ['#c29068', '#a37550', '#6cc884', '#4dac6c', '#8a5a3a']);
      morroG(ctx, 1400, 36, 1.0, 1.2, '#b2da82', '#86c25e');
      // pegadas
      ctx.fillStyle = 'rgba(120,150,70,0.45)'; ctx.beginPath();
      var pg = [[820, 1900], [940, 1800], [900, 1680], [1010, 1590], [960, 1500]];
      for (i = 0; i < pg.length; i++) { oval(ctx, pg[i][0], pg[i][1], 34, 26); circ(ctx, pg[i][0] - 34, pg[i][1] - 34, 12); circ(ctx, pg[i][0], pg[i][1] - 46, 12); circ(ctx, pg[i][0] + 34, pg[i][1] - 34, 12); }
      ctx.fill();
      // ninho com ovos
      var nx = 1560, ny = 1800;
      elipse(ctx, nx, ny + 20, 190, 60, '#b98a57'); ctx.strokeStyle = '#8f6440'; ctx.lineWidth = 6; ctx.beginPath(); for (i = 0; i < 7; i++) { ctx.moveTo(nx - 180 + i * 50, ny + 30); ctx.quadraticCurveTo(nx - 150 + i * 50, ny - 5, nx - 120 + i * 50, ny + 40); } ctx.stroke();
      var ov = [[nx - 70, ny - 30, '#fff3d6'], [nx + 70, ny - 25, '#e4f6ff'], [nx, ny - 55, '#ffe2ef']];
      for (i = 0; i < 3; i++) { elipse(ctx, ov[i][0], ov[i][1], 52, 70, ov[i][2]); ctx.fillStyle = 'rgba(140,190,120,0.55)'; ctx.beginPath(); circ(ctx, ov[i][0] - 14, ov[i][1] - 20, 9); circ(ctx, ov[i][0] + 16, ov[i][1] + 6, 11); circ(ctx, ov[i][0] - 6, ov[i][1] + 30, 7); ctx.fill(); }
      elipse(ctx, nx, ny + 30, 170, 34, '#c99a64');
      // pedras e samambaias
      elipse(ctx, 420, 1560, 90, 50, '#b7a99a'); elipse(ctx, 400, 1545, 40, 16, 'rgba(255,255,255,0.3)');
      elipse(ctx, 1280, 1560, 60, 34, '#b7a99a');
      for (i = 0; i < 5; i++) samambaia(ctx, 560 + i * 18, 2070, 340, -1.0 - i * 0.28, i % 2 ? '#4fa660' : '#5cb46c');
      for (i = 0; i < 5; i++) samambaia(ctx, 1400 + i * 18, 2070, 300, -1.2 - i * 0.28, i % 2 ? '#4fa660' : '#5cb46c');
      tufos(ctx, 71, 50, 1450, 2040, 'rgba(80,130,50,0.4)');
    },
    vivo: function (ctx, t) {
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(t * 2.2);
      ctx.fillStyle = guardado('lava', function () { return rad(ctx, CRATERA[0], CRATERA[1], 10, CRATERA[0], CRATERA[1], 160, [[0, 'rgba(255,200,90,0.9)'], [1, 'rgba(255,120,60,0)']]); });
      ctx.beginPath(); circ(ctx, CRATERA[0], CRATERA[1], 160); ctx.fill();
      ctx.globalAlpha = 1;
      for (var i = 0; i < 7; i++) {
        var p = mod(t * 0.16 + i / 7, 1);
        ctx.fillStyle = 'rgba(236,228,240,' + (0.8 * (1 - p) * Math.min(1, p * 6)).toFixed(3) + ')'; ctx.beginPath();
        circ(ctx, CRATERA[0] + p * 160 + Math.sin(p * 5 + i) * 30, CRATERA[1] - 30 - p * 520, 26 + p * 90); ctx.fill();
      }
      // pterossauros planando
      for (i = 0; i < 2; i++) {
        var x = mod(t * (70 + i * 25) + i * 1100, S + 600) - 300, y = 520 + i * 220 + Math.sin(t * 0.9 + i) * 30, b = Math.sin(t * 4 + i * 2);
        ctx.fillStyle = i ? '#c98fd6' : '#e0956b'; ctx.beginPath();
        ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x - 60, y - 40 - b * 40, x - 120, y - 10 - b * 50); ctx.quadraticCurveTo(x - 60, y + 6, x - 10, y + 10);
        ctx.moveTo(x + 20, y); ctx.quadraticCurveTo(x + 60, y - 40 - b * 40, x + 120, y - 10 - b * 50); ctx.quadraticCurveTo(x + 60, y + 6, x + 10, y + 10);
        oval(ctx, x, y + 4, 34, 15, 0); ctx.moveTo(x + 26, y - 6); ctx.lineTo(x + 76, y - 2); ctx.lineTo(x + 30, y + 8); ctx.closePath();
        ctx.moveTo(x + 22, y - 6); ctx.lineTo(x + 6, y - 34); ctx.lineTo(x + 34, y - 6); ctx.closePath();
        ctx.fill();
      }
    }
  };

  // ---------- jardim ----------
  function girassol(ctx, x, y, h, r) {
    ctx.strokeStyle = '#5aa94e'; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - r * 0.3, y - h * 0.5, x, y - h); ctx.stroke();
    elipse(ctx, x + r * 0.5, y - h * 0.45, r * 0.5, r * 0.2, '#6cbf5a', -0.5); elipse(ctx, x - r * 0.55, y - h * 0.3, r * 0.5, r * 0.2, '#6cbf5a', 0.5);
    ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); for (var i = 0; i < 14; i++) { var a = i * TAU / 14; oval(ctx, x + Math.cos(a) * r * 0.72, y - h + Math.sin(a) * r * 0.72, r * 0.38, r * 0.15, a); } ctx.fill();
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); for (i = 0; i < 14; i++) { a = i * TAU / 14 + 0.22; oval(ctx, x + Math.cos(a) * r * 0.6, y - h + Math.sin(a) * r * 0.6, r * 0.3, r * 0.12, a); } ctx.fill();
    bola(ctx, x, y - h, r * 0.45, '#9a5f35'); ctx.fillStyle = 'rgba(255,220,150,0.45)'; ctx.beginPath(); for (i = 0; i < 12; i++) circ(ctx, x + Math.cos(i * 2.4) * r * 0.28 * Math.sqrt(i / 12), y - h + Math.sin(i * 2.4) * r * 0.28 * Math.sqrt(i / 12), r * 0.035); ctx.fill();
  }
  function tulipa(ctx, x, y, h, cor) {
    ctx.strokeStyle = '#5aa94e'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    elipse(ctx, x + 18, y - h * 0.35, 26, 9, '#6cbf5a', -0.9);
    ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x - 32, y - h - 50); ctx.lineTo(x - 16, y - h - 28); ctx.lineTo(x, y - h - 54); ctx.lineTo(x + 16, y - h - 28); ctx.lineTo(x + 32, y - h - 50); ctx.quadraticCurveTo(x + 36, y - h + 6, x, y - h + 4); ctx.quadraticCurveTo(x - 36, y - h + 6, x - 32, y - h - 50); ctx.fill();
  }
  function abelha(ctx, x, y, s, asa, dir) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); oval(ctx, x - s * 0.15 * dir, y - s * 0.55, s * 0.28, s * (0.12 + 0.3 * asa), -0.4 * dir); oval(ctx, x + s * 0.2 * dir, y - s * 0.55, s * 0.24, s * (0.1 + 0.26 * asa), 0.4 * dir); ctx.fill();
    elipse(ctx, x, y, s * 0.55, s * 0.4, '#ffd23f');
    ctx.fillStyle = '#4a3a3a'; ctx.beginPath(); ctx.rect(x - s * 0.12, y - s * 0.38, s * 0.13, s * 0.76); ctx.rect(x + s * 0.14, y - s * 0.33, s * 0.12, s * 0.66); ctx.fill();
    bola(ctx, x + s * 0.4 * dir, y - s * 0.08, s * 0.06, '#4a3a3a');
  }
  CENA.jardim = {
    parado: function (ctx) {
      var i, x;
      ceu(ctx, [[0, '#82cdf6'], [0.45, '#cbeefc'], [0.6, '#fff6dc']]);
      sol(ctx, 1700, 380, 100);
      nuvem(ctx, 420, 360, 320, '#ffffff', 'rgba(160,195,235,0.45)'); nuvem(ctx, 1180, 560, 220, '#ffffff', 'rgba(160,195,235,0.45)');
      // cerca viva
      ctx.fillStyle = '#7cc47a'; ctx.beginPath(); for (x = 0; x < S + 60; x += 80) circ(ctx, x, 1120 + Math.sin(x * 0.02) * 12, 70 + hash(x, 2) * 20); ctx.rect(0, 1120, S, 300); ctx.fill();
      ctx.fillStyle = '#93d38f'; ctx.beginPath(); for (x = 30; x < S + 60; x += 160) circ(ctx, x, 1100 + Math.sin(x * 0.02) * 12, 34); ctx.fill();
      // casinha de passarinho
      caixa(ctx, 1384, 1060, 22, 300, 8, '#b98a63'); caixa(ctx, 1330, 920, 130, 140, 10, '#ffb36b'); poli(ctx, [1310, 930, 1395, 850, 1480, 930], '#ff6f7e'); bola(ctx, 1395, 985, 26, '#7a4a35'); caixa(ctx, 1385, 1018, 20, 30, 6, '#b98a63');
      // cerquinha branca
      for (x = 10; x < S; x += 72) { caixa(ctx, x, 1230, 46, 190, 6, '#fffaf2'); poli(ctx, [x, 1234, x + 23, 1200, x + 46, 1234], '#fffaf2'); ctx.fillStyle = 'rgba(180,170,210,0.25)'; ctx.fillRect(x + 32, 1236, 14, 184); }
      caixa(ctx, 0, 1270, S, 22, 6, '#f2ece2'); caixa(ctx, 0, 1360, S, 22, 6, '#f2ece2');
      morroG(ctx, 1410, 18, 1.4, 0.2, '#a8de7c', '#78c35e');
      girassol(ctx, 300, 1520, 640, 120); girassol(ctx, 1760, 1500, 560, 110); girassol(ctx, 1170, 1440, 470, 90);
      var tc = ['#ff6f8e', '#ffd23f', '#c79bff', '#ff9a5c', '#ff6fb8'];
      for (i = 0; i < 22; i++) { x = 30 + i * 95; tulipa(ctx, x, 1470 + (i % 2) * 20, 140 + (i % 3) * 30, tc[i % tc.length]); }
      // caminho de pedrinhas
      var pd = [[1000, 1980, 130], [1060, 1830, 110], [990, 1700, 95], [1050, 1590, 80], [1000, 1500, 66]];
      for (i = 0; i < pd.length; i++) { elipse(ctx, pd[i][0], pd[i][1] + 8, pd[i][2], pd[i][2] * 0.42, 'rgba(110,150,90,0.35)'); elipse(ctx, pd[i][0], pd[i][1], pd[i][2], pd[i][2] * 0.4, '#efe6d6'); }
      tufos(ctx, 13, 70, 1460, 2040, 'rgba(60,140,60,0.4)');
      campoFlores(ctx, 14, 80, 1560, 2040, ['#ffffff', '#ff9ec4', '#ffd23f', '#b9a3ff', '#8fd3ff'], '#4f9e4f');
      // joaninha
      elipse(ctx, 640, 1720, 34, 28, '#ff4f5e'); bola(ctx, 664, 1720, 15, '#3a3040'); ctx.fillStyle = '#3a3040'; ctx.beginPath(); circ(ctx, 630, 1708, 6); circ(ctx, 626, 1734, 6); circ(ctx, 646, 1722, 5); ctx.fill();
    },
    vivo: function (ctx, t) {
      for (var i = 0; i < 4; i++) {
        var ph = i * 1.9, x = 350 + i * 450 + Math.sin(t * 0.6 + ph) * 200, y = 1150 + Math.sin(t * 1.1 + ph) * 160 + Math.sin(t * 3 + ph) * 12;
        abelha(ctx, x, y, 44, Math.abs(Math.sin(t * 24 + ph)), Math.cos(t * 0.6 + ph) >= 0 ? 1 : -1);
      }
      borboleta(ctx, 900 + Math.sin(t * 0.4) * 380, 760 + Math.sin(t * 0.7) * 160, 38, Math.abs(Math.sin(t * 8)), '#ff9ec4', '#ffd0e4');
      borboleta(ctx, 1500 + Math.sin(t * 0.35 + 2) * 300, 1600 + Math.sin(t * 0.6 + 1) * 120, 34, Math.abs(Math.sin(t * 8 + 1)), '#9fb8ff', '#c9b5ff');
    }
  };

  // ---------- pôr do sol ----------
  CENA['por-do-sol'] = {
    parado: function (ctx) {
      var i;
      ceu(ctx, [[0, '#2f2b7c'], [0.26, '#6a3f9e'], [0.43, '#d0609a'], [0.53, '#ff906c'], [0.595, '#ffc77a']]);
      estrelinhas(ctx, 99, 60, 500, 2);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, S, 1220); ctx.clip(); sol(ctx, 1024, 1220, 240, 'rgba(255,220,150,0.6)'); ctx.restore();
      var nv = [[600, 820, 260, 26], [1450, 900, 320, 22], [900, 1020, 200, 16], [1700, 700, 180, 18], [300, 1080, 220, 18]];
      for (i = 0; i < nv.length; i++) elipse(ctx, nv[i][0], nv[i][1], nv[i][2], nv[i][3], 'rgba(255,175,190,0.6)');
      ctx.fillStyle = lin(ctx, 0, 1220, 0, S, [[0, '#d36d9c'], [0.4, '#8a4fa0'], [1, '#4d3c8c']]); ctx.fillRect(0, 1220, S, S - 1220);
      for (i = 0; i < 14; i++) { var w = 230 - i * 13; elipse(ctx, 1024, 1240 + i * 32 + i * i * 2, w, 7 + i * 0.6, 'rgba(255,214,140,' + (0.7 - i * 0.045).toFixed(3) + ')'); }
      // ilhas com coqueiros
      ctx.fillStyle = '#5a3f88'; ctx.beginPath(); oval(ctx, 230, 1290, 360, 90); ctx.fill();
      palmeira(ctx, 200, 1270, 520, 90, ['#4a3478', '#43306e', '#4a3478', '#5a4290', '#43306e']);
      palmeira(ctx, 360, 1260, 380, -60, ['#4a3478', '#43306e', '#4a3478', '#5a4290', '#43306e']);
      ctx.fillStyle = '#5a3f88'; ctx.beginPath(); oval(ctx, 1860, 1300, 300, 80); ctx.fill();
      palmeira(ctx, 1850, 1280, 460, -80, ['#4a3478', '#43306e', '#4a3478', '#5a4290', '#43306e']);
      // areia em primeiro plano
      ctx.fillStyle = lin(ctx, 0, 1700, 0, S, [[0, '#f0a98a'], [1, '#d98f86']]); ctx.beginPath(); ctx.moveTo(0, S); for (var x = 0; x <= S; x += 32) ctx.lineTo(x, 1760 + 50 * Math.sin(x / S * TAU * 0.8 + 1)); ctx.lineTo(S, S); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 8; ctx.beginPath(); for (x = 0; x <= S; x += 32) { var y = 1760 + 50 * Math.sin(x / S * TAU * 0.8 + 1); if (x) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
      concha(ctx, 700, 1940, 30, '#ffd6e6'); ctx.fillStyle = '#ff8a6b'; ctx.beginPath(); estrelaP(ctx, 1400, 1930, 44, 18, 5, 0.3); ctx.fill();
    },
    vivo: function (ctx, t) {
      ctx.fillStyle = '#ffe4a6'; ctx.beginPath();
      for (var i = 0; i < 14; i++) {
        var y = 1240 + hash(i, 1) * 420, k = Math.sin(t * (1.5 + hash(i, 2) * 2) + i), w = (40 + hash(i, 3) * 90) * (0.4 + 0.6 * Math.max(0, k));
        if (k > -0.3) retR(ctx, 1024 + (hash(i, 4) - 0.5) * (200 + (y - 1220) * 0.7) - w / 2, y, w, 7, 3);
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
      for (var f = 0; f < 3; f++) { var yy = 1330 + f * 120, comp = 260 + f * 80; for (var x = -comp + mod(t * (20 + f * 12), comp); x < S; x += comp) { ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + comp * 0.2, yy - 8 - f * 3, x + comp * 0.4, yy); } }
      ctx.stroke();
      passaros(ctx, t, [[300, 760, 30, 40], [380, 820, 22, 40], [1100, 600, 26, 34]], '#4a2f6e');
    }
  };

  // ---------- lista (a ordem é a ordem dos botões) ----------
  var LISTA = [
    { id: 'praia', pt: 'Praia', en: 'Beach', ico: '🏖️', vivo: true },
    { id: 'campo', pt: 'Campo', en: 'Meadow', ico: '🌼', vivo: true },
    { id: 'fundo-do-mar', pt: 'Fundo do mar', en: 'Under the sea', ico: '🐠', vivo: true },
    { id: 'espaco', pt: 'Espaço', en: 'Space', ico: '🪐', vivo: true },
    { id: 'cidade-noite', pt: 'Cidade à noite', en: 'City at night', ico: '🌃', vivo: true },
    { id: 'floresta', pt: 'Floresta', en: 'Forest', ico: '🌳', vivo: true },
    { id: 'neve', pt: 'Neve', en: 'Snow', ico: '⛄', vivo: true },
    { id: 'castelo', pt: 'Castelo', en: 'Castle', ico: '🏰', vivo: true },
    { id: 'ceu-arco-iris', pt: 'Céu de arco-íris', en: 'Rainbow sky', ico: '🌈', vivo: true },
    { id: 'fazenda', pt: 'Fazenda', en: 'Farm', ico: '🚜', vivo: true },
    { id: 'doces', pt: 'Terra dos doces', en: 'Candy land', ico: '🍭', vivo: true },
    { id: 'dinossauros', pt: 'Dinossauros', en: 'Dinosaurs', ico: '🦕', vivo: true },
    { id: 'jardim', pt: 'Jardim', en: 'Garden', ico: '🌻', vivo: true },
    { id: 'por-do-sol', pt: 'Pôr do sol', en: 'Sunset', ico: '🌅', vivo: true }
  ];

  function comEscala(ctx, W, H, fn) {
    ctx.save(); ctx.scale(W / S, H / S);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 1;
    try { fn(); } finally { ctx.restore(); }
  }
  function parado(ctx, id, W, H) { var c = CENA[id]; if (c) comEscala(ctx, W, H, function () { c.parado(ctx); }); }
  function vivo(ctx, id, W, H, t) { var c = CENA[id]; if (c && c.vivo) comEscala(ctx, W, H, function () { c.vivo(ctx, t || 0); }); }

  var API = { LISTA: LISTA, parado: parado, vivo: vivo };
  raiz.DesenhoFundos = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
