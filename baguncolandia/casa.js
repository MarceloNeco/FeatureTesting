/* Bagunçolândia — modo 🧸 Bagunça: uma sala, um quarto ou um jardim cheios de coisas arrumadas; a criança bate
   nelas (com o dedo ou com o corpo) e tudo vai ficando bagunçado — nada quebra, tudo mexe:
   livro cai e abre, torre de blocos desaba, bola quica e pode sair pela janela aberta, o lustre balança e a luz
   muda de cor, o interruptor acende e apaga, a janela abre e fecha devagar, o quadro fica torto, o cachorrinho
   anda, late e corre atrás da bola; no jardim, a árvore solta folhas, os passarinhos voam, o balanço balança.

   Casa.criar(cfg) devolve uma "partida" com a mesma cara da do jogo.js (comecar, avancar, movimento, estado,
   eventos…), então o app e o desenho não precisam saber que é outro motor. Casa.desenhar(ctx, casa, ts) pinta o
   lugar e as coisas; Casa.luz(ctx, casa, ts) pinta o escuro e as luzes por cima de tudo (menos do placar).
   Palco lógico de 1280×720, igual ao resto. Eventos: { t: 'casa', som, x, y, j, pontos, texto?, festa? } e
   { t: 'bagunca100' } quando o Bagunçômetro chega a 100 %. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Casa = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 1280, H = 720, G = 1500, PI2 = 6.2832;
  var CENAS = ['sala', 'quarto', 'jardim', 'cozinha', 'banheiro', 'parquinho'];
  var ROLA = ['bola', 'maca', 'carrinho', 'tampa', 'laranja', 'bambole', 'rolo'], DESLIZA = ['carrinho', 'sabonete', 'bambole', 'tampa'];
  var CORES_LUZ = ['#fff1c1', '#ffc4ec', '#bfefff', '#d6ffbf', '#ffd59e', '#e0c8ff'];
  var LIVROS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1', '#6d4c41', '#ec407a'];
  var BOLAS = [['#ff5252', '#fff'], ['#3ee8ff', '#ffd166'], ['#c6ff3d', '#8e5bff'], ['#ffd166', '#ff4fa3']];
  var BLOCOS = ['#ff5252', '#ffd166', '#43a047', '#1e88e5', '#ff4fa3', '#8e5bff'];
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function distSeg(a, b, p) { var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy, t = l2 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1) : 0; return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y); }
  function dentro(p, r, pad) { pad = pad || 0; return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad; }

  /* ================= montagem dos lugares ================= */
  function montar(cena, rnd) {
    var M = { cena: cena, obs: [], plats: [], chao: cena === 'jardim' ? 652 : 655, luz: true, corLuz: 0, folhasChao: [], folhas: [], petalas: [], seq: 0 };
    function ob(tipo, x, yBase, o) {   // yBase = onde a coisa se apoia (topo da prateleira, chão…)
      o = o || {}; var w = o.w || 40, h = o.h || 40;
      var c = { id: ++M.seq, tipo: tipo, x: x, y: yBase - h / 2, w: w, h: h, r: o.r || Math.min(w, h) / 2, vx: 0, vy: 0, ang: o.ang || 0, va: 0, dorme: true, apoio: o.apoio || null, quica: o.quica != null ? o.quica : 0.35, cor: o.cor, cor2: o.cor2, letra: o.letra, aberto: false, fora: 0, gira: 0, toque: {}, parado: 0 };
      c.x0 = c.x; c.y0 = c.y; c.ang0 = c.ang; c.w0 = w; c.h0 = h; c.r0 = c.r; c.apoio0 = c.apoio ? { p: c.apoio.p, o: c.apoio.o } : null;   // o lugar certo (para a arrumação)
      M.obs.push(c); return c;
    }
    function plat(x1, x2, y) { M.plats.push({ x1: x1, x2: x2, y: y }); return M.plats.length - 1; }
    function livros(x1, x2, y, p) { var x = x1; var i = 0; while (true) { var w = 22 + Math.floor(rnd() * 10), h = 62 + Math.floor(rnd() * 26); if (x + w > x2) break; ob('livro', x + w / 2, y, { w: w, h: h, cor: LIVROS[(i++ + Math.floor(rnd() * 3)) % LIVROS.length], apoio: { p: p }, quica: 0.25 }); x += w + 3; } }
    function torre(x, n) { var ant = null; for (var k = 0; k < n; k++) { var b = ob('bloco', x + (rnd() - 0.5) * 4, M.chao - k * 44, { w: 44, h: 44, cor: BLOCOS[k % BLOCOS.length], letra: 'ABCDEFG'[k], apoio: ant ? { o: ant.id } : { p: -1 }, quica: 0.2 }); ant = b; } }
    function bola(x, yBase, r, k, apoio) { return ob('bola', x, yBase, { w: r * 2, h: r * 2, r: r, cor: BOLAS[k % BOLAS.length][0], cor2: BOLAS[k % BOLAS.length][1], quica: 0.72, apoio: apoio || { p: -1 } }); }
    var C = M.chao;
    if (cena === 'sala') {
      M.parede = '#f6d9b8'; M.parede2 = '#efc79f'; M.piso = '#b9774a'; M.rodape = '#8d5634';
      M.janela = { x: 70, y: 120, w: 230, h: 230, abre: 0, alvo: 0, ate: 0 };
      M.interruptor = { x: 318, y: 320, w: 36, h: 54, ate: 0 };
      M.quadro = { x: 470, y: 240, w: 128, h: 96, ang: 0, va: 0, repouso: 0, desenho: 'barco' };   // abaixo do Bagunçômetro
      M.lustre = { x: 540, L: 168, ang: 0, va: 0, ate: 0 };   // ao lado da TV
      M.sofa = { x1: 450, x2: 800, assento: 545 };
      var ps = plat(462, 788, 545);
      [520, 625, 730].forEach(function (x, i) { ob('almofada', x, 545, { w: 92, h: 58, cor: ['#ff4fa3', '#ffd166', '#3ee8ff'][i], apoio: { p: ps }, quica: 0.2 }); });
      M.estante = { x1: 900, x2: 1200, topo: 104, tabuas: [232, 362, 492] };
      var p1 = plat(905, 1195, 232), p2 = plat(905, 1195, 362), p3 = plat(905, 1195, 492), pt = plat(905, 1195, 104);
      livros(912, 1190, 232, p1); livros(912, 1190, 362, p2); livros(912, 1120, 492, p3);
      bola(1160, 492, 22, 2, { p: p3 });
      ob('pato', 960, 104, { w: 52, h: 46, apoio: { p: pt }, quica: 0.45 });
      ob('piao', 1060, 104, { w: 44, h: 50, apoio: { p: pt }, quica: 0.3, cor: '#ff5252', cor2: '#ffd166' });
      ob('piao', 150, C, { w: 44, h: 50, quica: 0.3, cor: '#8e5bff', cor2: '#3ee8ff' });
      bola(232, C, 30, 0);
      ob('vaso', 318, C, { w: 56, h: 92, quica: 0.15, cor: '#e07a3f' });
      torre(398, 6);
      ob('carrinho', 560, C, { w: 92, h: 48, r: 26, quica: 0.3, cor: '#ff5252' });
      ob('ursinho', 700, C, { w: 72, h: 82, quica: 0.25, cor: '#b07a4a' });
      bola(890, C, 26, 1);
    } else if (cena === 'quarto') {
      M.parede = '#cfe7ff'; M.parede2 = '#b8dbff'; M.piso = '#d9b38c'; M.rodape = '#a77b55';
      M.janela = { x: 905, y: 110, w: 220, h: 220, abre: 0, alvo: 0, ate: 0 };
      M.interruptor = { x: 1170, y: 330, w: 36, h: 54, ate: 0 };
      M.quadro = { x: 225, y: 200, w: 110, h: 120, ang: 0, va: 0, repouso: 0, desenho: 'foguete' };   // em cima da cama
      M.lustre = { x: 470, L: 150, ang: 0, va: 0, ate: 0 };
      M.cama = { x1: 50, x2: 470, topo: 470 };
      var pc = plat(60, 462, 470);
      ob('almofada', 115, 470, { w: 96, h: 54, cor: '#ffe082', apoio: { p: pc }, quica: 0.2 });
      ob('almofada', 215, 470, { w: 96, h: 54, cor: '#ffd1e8', apoio: { p: pc }, quica: 0.2 });
      ob('ursinho', 310, 470, { w: 66, h: 76, cor: '#c98b5a', apoio: { p: pc }, quica: 0.25 });
      ob('ursinho', 400, 470, { w: 60, h: 70, cor: '#ffb74d', apoio: { p: pc }, quica: 0.25 });
      M.prateleira = { x1: 555, x2: 845, tabuas: [262, 392] };
      var q1 = plat(560, 840, 262), q2 = plat(560, 840, 392);
      ob('robo', 590, 262, { w: 46, h: 64, apoio: { p: q1 }, quica: 0.25, cor: '#a5d6a7' });
      livros(625, 735, 262, q1);
      ob('pato', 790, 262, { w: 52, h: 46, apoio: { p: q1 }, quica: 0.45 });
      bola(590, 392, 24, 3, { p: q2 });
      ob('piao', 650, 392, { w: 44, h: 50, apoio: { p: q2 }, quica: 0.3, cor: '#43a047', cor2: '#fff' });
      livros(690, 835, 392, q2);
      M.bau = { x1: 1000, x2: 1190, topo: 560 };
      var pb = plat(1004, 1186, 560);
      bola(1040, 560, 26, 0, { p: pb }); bola(1095, 560, 24, 1, { p: pb }); bola(1150, 560, 26, 2, { p: pb });
      torre(520, 5);
      ob('robo', 585, C, { w: 46, h: 64, quica: 0.25, cor: '#ffcc80' });
      ob('carrinho', 670, C, { w: 92, h: 48, r: 26, quica: 0.3, cor: '#1e88e5' });
      ob('piao', 760, C, { w: 44, h: 50, quica: 0.3, cor: '#ff4fa3', cor2: '#ffd166' });
      bola(840, C, 30, 3);
      torre(930, 4);
      ob('pato', 1010, C, { w: 52, h: 46, quica: 0.45 });
      ob('vaso', 1230, C, { w: 50, h: 84, quica: 0.15, cor: '#4fc3f7' });
    } else if (cena === 'jardim') {
      M.luz = true; M.jardim = true;
      M.arvore = { x: 1060, copa: { x: 1060, y: 250, r: 175 }, treme: 0 };
      M.passaros = [{ x: 990, y: 140 }, { x: 1085, y: 108 }, { x: 1150, y: 196 }].map(function (p, i) { return { x: p.x, y: p.y, x0: p.x, y0: p.y, voando: 0, volta: 0, cor: ['#ff7043', '#42a5f5', '#ffee58'][i], fase: rnd() * 6 }; });
      M.balanco = { x: 320, topo: 170, L: 290, ang: 0, va: 0 };
      M.flores = []; for (var f = 0; f < 9; f++) M.flores.push({ x: 470 + f * 52 + rnd() * 14, h: 70 + rnd() * 40, ang: 0, va: 0, cor: ['#ff4fa3', '#ffd166', '#8e5bff', '#ff5252', '#ffffff'][f % 5] });
      M.borboletas = []; for (var b = 0; b < 4; b++) M.borboletas.push({ x: 200 + rnd() * 900, y: 220 + rnd() * 250, vx: 0, vy: 0, fase: rnd() * 6, cor: ['#ffd166', '#3ee8ff', '#ff4fa3', '#c6ff3d'][b], foge: 0 });
      bola(560, C, 30, 0); bola(700, C, 26, 1); bola(880, C, 32, 2); bola(330, C, 24, 3); bola(1120, C, 22, 1);
      torre(480, 5);
      ob('balde', 925, C, { w: 54, h: 56, quica: 0.25, cor: '#1e88e5' });
      ob('carrinho', 990, C, { w: 92, h: 48, r: 26, quica: 0.3, cor: '#ffb300' });
      ob('pato', 250, C, { w: 52, h: 46, quica: 0.45 });
      ob('piao', 620, C, { w: 44, h: 50, quica: 0.3, cor: '#1e88e5', cor2: '#ffd166' });
      ob('vaso', 40, C, { w: 46, h: 76, quica: 0.15, cor: '#8d6e63' });
      ob('regador', 160, C, { w: 80, h: 60, r: 28, quica: 0.25, cor: '#43a047' });
      ob('gnomo', 80, C, { w: 48, h: 84, quica: 0.2, cor: '#e53935' });
      var pm = plat(760, 860, C - 6);   // toalha de piquenique: as maçãs ficam empilhadas
      var m1 = ob('maca', 785, C - 6, { w: 30, h: 30, apoio: { p: pm }, quica: 0.4 }), m2 = ob('maca', 815, C - 6, { w: 30, h: 30, apoio: { p: pm }, quica: 0.4 }), m3 = ob('maca', 845, C - 6, { w: 30, h: 30, apoio: { p: pm }, quica: 0.4 });
      ob('maca', 800, C - 36, { w: 30, h: 30, apoio: { o: m1.id }, quica: 0.4 }); ob('maca', 830, C - 36, { w: 30, h: 30, apoio: { o: m2.id }, quica: 0.4 });
      ob('ursinho', 650, C, { w: 66, h: 76, cor: '#b07a4a', quica: 0.25 });
      void m3;   // a 3ª maçã de baixo também segura as de cima pelo vizinho
    } else if (cena === 'cozinha') {
      M.parede = '#fff3e0'; M.parede2 = '#ffe8c4'; M.piso = '#e0e0e0'; M.rodape = '#bcaaa4'; M.xadrez = true;
      M.janela = { x: 470, y: 100, w: 210, h: 190, abre: 0, alvo: 0, ate: 0 };
      M.interruptor = { x: 1000, y: 300, w: 36, h: 54, ate: 0 };
      M.lustre = { x: 800, L: 140, ang: 0, va: 0, ate: 0 };
      M.geladeira = { x: 1060, y: 160, w: 175, h: 495, abre: 0, alvo: 0, ate: 0 };
      M.torneira = { x: 760, y: 420, ligada: false, ate: 0 };
      M.bancada = { x1: 420, x2: 990, topo: 470 }; M.armario = { x1: 50, x2: 400, tabuas: [210, 330] };
      var a1 = plat(55, 395, 210), a2 = plat(55, 395, 330), pbk = plat(425, 985, 470); plat(1062, 1233, 160);
      ob('panela', 100, 210, { w: 76, h: 46, cor: '#b0bec5', apoio: { p: a1 }, quica: 0.35 }); ob('panela', 188, 210, { w: 64, h: 40, cor: '#ef5350', apoio: { p: a1 }, quica: 0.35 });
      ob('pote', 255, 210, { w: 44, h: 40, cor: '#4fc3f7', apoio: { p: a1 } }); ob('pote', 305, 210, { w: 40, h: 52, cor: '#c6ff3d', apoio: { p: a1 } }); ob('caneca', 360, 210, { w: 34, h: 38, cor: '#ff4fa3', apoio: { p: a1 } });
      ob('tampa', 90, 330, { w: 54, h: 54, r: 26, cor: '#90a4ae', apoio: { p: a2 }, quica: 0.55 }); ob('tampa', 150, 330, { w: 48, h: 48, r: 23, cor: '#e57373', apoio: { p: a2 }, quica: 0.55 });
      ob('pote', 212, 330, { w: 46, h: 36, cor: '#ffd166', apoio: { p: a2 } }); ob('caneca', 262, 330, { w: 34, h: 38, cor: '#8e5bff', apoio: { p: a2 } }); ob('caneca', 306, 330, { w: 34, h: 38, cor: '#3ee8ff', apoio: { p: a2 } }); ob('pote', 358, 330, { w: 40, h: 44, cor: '#ff8a65', apoio: { p: a2 } });
      ob('maca', 455, 470, { w: 30, h: 30, apoio: { p: pbk }, quica: 0.4 }); ob('laranja', 492, 470, { w: 34, h: 34, apoio: { p: pbk }, quica: 0.45 }); ob('banana', 545, 470, { w: 58, h: 22, apoio: { p: pbk }, quica: 0.2 });
      ob('laranja', 595, 470, { w: 34, h: 34, apoio: { p: pbk }, quica: 0.45 }); ob('maca', 632, 470, { w: 30, h: 30, apoio: { p: pbk }, quica: 0.4 }); ob('colher', 670, 470, { w: 66, h: 14, apoio: { p: pbk }, quica: 0.3 });
      bola(150, C, 28, 0); torre(230, 4); ob('tigela', 320, C, { w: 62, h: 24, cor: '#ff4fa3', quica: 0.3 });
      ob('tampa', 600, C, { w: 50, h: 50, r: 24, cor: '#b0bec5', quica: 0.55 }); ob('carrinho', 760, C, { w: 92, h: 48, r: 26, quica: 0.3, cor: '#43a047' }); bola(900, C, 24, 2); ob('panela', 990, C, { w: 66, h: 42, cor: '#90a4ae', quica: 0.35 });
    } else if (cena === 'banheiro') {
      M.parede = '#e0f7fa'; M.parede2 = '#c9f0f5'; M.piso = '#dfe6ea'; M.rodape = '#90a4ae'; M.azulejo = true;
      M.interruptor = { x: 590, y: 300, w: 36, h: 54, ate: 0 };
      M.lustre = { x: 640, L: 110, ang: 0, va: 0, ate: 0 };
      M.banheira = { x1: 50, x2: 520, topo: 470, bolhas: [], ate: 0 };
      M.torneira = { x: 760, y: 412, ligada: false, ate: 0 };
      M.espelho = { x: 680, y: 140, w: 160, h: 200 };
      var pbn = plat(70, 500, 470), ppi = plat(690, 830, 470), pto = plat(900, 1110, 420), prl = plat(1172, 1222, 400), pce = plat(875, 955, 580);
      for (var pk = 0; pk < 5; pk++) ob('pato', 110 + pk * 88, 470, { w: 52, h: 46, apoio: { p: pbn }, quica: 0.45 });
      ob('frasco', 706, 470, { w: 30, h: 64, cor: '#ff4fa3', apoio: { p: ppi }, quica: 0.3 }); ob('escova', 732, 470, { w: 12, h: 58, cor: '#3ee8ff', apoio: { p: ppi }, quica: 0.3 });
      ob('copo', 798, 470, { w: 30, h: 40, cor: '#c6ff3d', apoio: { p: ppi }, quica: 0.3 }); ob('sabonete', 820, 470, { w: 30, h: 16, cor: '#ffd166', apoio: { p: ppi }, quica: 0.2 });
      ob('toalha', 945, 420, { w: 72, h: 120, cor: '#ff8a80', apoio: { p: pto }, quica: 0.15 }); ob('toalha', 1035, 420, { w: 72, h: 120, cor: '#80d8ff', apoio: { p: pto }, quica: 0.15 });
      ob('rolo', 1197, 400, { w: 44, h: 44, r: 22, apoio: { p: prl }, quica: 0.3 }); M.papel = { x: 1197, y: 380, pts: [] };
      ob('meia', 895, 580, { w: 40, h: 22, cor: '#ff4fa3', apoio: { p: pce }, quica: 0.2 }); ob('meia', 935, 580, { w: 40, h: 22, cor: '#3ee8ff', apoio: { p: pce }, quica: 0.2 });
      ob('sabonete', 570, C, { w: 34, h: 18, cor: '#ff4fa3', quica: 0.2 }); ob('pato', 640, C, { w: 52, h: 46, quica: 0.45 }); ob('frasco', 1010, C, { w: 32, h: 66, cor: '#8e5bff', quica: 0.3 });
      ob('pato', 700, C, { w: 46, h: 40, quica: 0.45 }); ob('pato', 760, C, { w: 46, h: 40, quica: 0.45 }); ob('escova', 830, C, { w: 12, h: 58, cor: '#ff8a65', quica: 0.3 });
      var pvs = plat(1140, 1232, 520);   // tampa da caixa da descarga
      ob('frasco', 1158, 520, { w: 28, h: 52, cor: '#43a047', apoio: { p: pvs }, quica: 0.3 }); ob('copo', 1192, 520, { w: 26, h: 34, cor: '#3ee8ff', apoio: { p: pvs }, quica: 0.3 }); bola(1220, 520, 12, 3, { p: pvs });
      ob('meia', 990, C, { w: 38, h: 20, cor: '#c6ff3d', quica: 0.2 });
    } else {   // parquinho
      M.jardim = true; M.parque = true;
      M.escorregador = { x1: 190, x2: 262, topo: 330, base: { x: 545, y: 640 } };
      M.rampas = [{ x1: 262, y1: 330, x2: 545, y2: 636 }];
      var ptop = plat(190, 262, 330);
      bola(226, 330, 22, 0, { p: ptop });
      M.gangorra = { x: 720, y: 598, L: 170, ang: -0.26, va: 0, ate: 0 };
      M.castelo = { x: 1015, y: 650, inteiro: true, ate: 0 };
      M.areia = { x1: 880, x2: 1250 };
      M.passaros = [{ x: 226, y: 268 }, { x: 610, y: 420 }, { x: 1180, y: 420 }].map(function (p, i) { return { x: p.x, y: p.y, x0: p.x, y0: p.y, voando: 0, volta: 0, cor: ['#ff7043', '#42a5f5', '#ffee58'][i], fase: rnd() * 6 }; });
      M.borboletas = []; for (var bb2 = 0; bb2 < 3; bb2++) M.borboletas.push({ x: 300 + rnd() * 800, y: 220 + rnd() * 200, vx: 0, vy: 0, fase: rnd() * 6, cor: ['#ffd166', '#ff4fa3', '#c6ff3d'][bb2], foge: 0 });
      torre(100, 5); bola(600, C, 28, 1); bola(850, C, 30, 2);
      ob('cone', 590 + 40, C, { w: 40, h: 50, quica: 0.25 }); ob('balde', 925, C, { w: 54, h: 56, quica: 0.25, cor: '#ff4fa3' }); ob('pa', 975, C, { w: 70, h: 16, quica: 0.25, cor: '#1e88e5' });
      ob('balde', 1110, C, { w: 50, h: 52, quica: 0.25, cor: '#ffd166' }); ob('bambole', 1200, C, { w: 80, h: 80, r: 38, quica: 0.5, cor: '#8e5bff' }); ob('pato', 400, C, { w: 52, h: 46, quica: 0.45 });
      bola(330, C, 22, 3); bola(470, C, 26, 0); ob('cone', 680, C, { w: 40, h: 50, quica: 0.25 }); ob('cone', 790, C, { w: 40, h: 50, quica: 0.25 });
      ob('bambole', 1240, C, { w: 70, h: 70, r: 33, quica: 0.5, cor: '#ff4fa3' }); ob('pa', 1060, C, { w: 66, h: 16, quica: 0.25, cor: '#43a047' }); ob('ursinho', 160, C, { w: 60, h: 70, cor: '#b07a4a', quica: 0.25 });
    }
    // o Picolé (cavachon branquinho da família) está em todo lugar
    M.cachorro = { x: cena === 'jardim' ? 420 : cena === 'parquinho' ? 700 : 620, dir: 1, vel: 70, passo: 0, late: 0, vy: 0, y: 0, troca: 2500 };
    // gato: dorme num lugar alto, mia, pula de prateleira em prateleira e derruba coisas (como todo gato)
    var casaGato = { sala: 0, quarto: 0, cozinha: 3 }[cena];
    if (casaGato != null) { var pg = M.plats[casaGato]; M.gato = { x: (pg.x1 + pg.x2) / 2 + 40, y: pg.y, plat: casaGato, dir: -1, dorme: true, t: 9 + rnd() * 5, salto: null, miau: 0, passo: 0, ops: 0 }; }
    // papagaio: fala e sai voando
    var pp = { sala: [845, 300], cozinha: [880, 240], quarto: null }[cena];
    if (pp) M.papagaio = { px: pp[0], py: pp[1], x: pp[0], y: pp[1] - 30, voa: 0, fala: 0, txt: '', prox: 10 + rnd() * 6, fase: rnd() * 6 };
    // tartaruga (jabuti): anda devagarinho e se esconde no casco
    if (cena === 'jardim' || cena === 'parquinho' || cena === 'sala') M.tartaruga = { x: cena === 'sala' ? 1000 : 300, dir: 1, esconde: 0, passo: 0, ate: 0 };
    // coisas que funcionam ao toque (tabela APAR, mais abaixo): mais diversão em cada lugar
    M.aparelhos = ({
      sala: [{ tipo: 'tv', x: 620, y: 168, w: 160, h: 100 }, { tipo: 'piano', x: 740, y: C - 58, w: 108, h: 58 }, { tipo: 'aquario', x: 1105, y: 34, w: 90, h: 70 }],
      quarto: [{ tipo: 'mobile', x: 300, y: 0 }, { tipo: 'surpresa', x: 402, y: C - 56, w: 56, h: 56 }, { tipo: 'tambor', x: 1085, y: C - 52, w: 70, h: 52 }, { tipo: 'cuco', x: 852, y: 112, w: 50, h: 88 }],
      cozinha: [{ tipo: 'torradeira', x: 846, y: 470 - 46, w: 68, h: 46 }, { tipo: 'liquidificador', x: 930, y: 470 - 92, w: 46, h: 92 }, { tipo: 'microondas', x: 860, y: 336, w: 128, h: 78 }],
      banheiro: [{ tipo: 'chuveiro', x: 96, y: 350 }, { tipo: 'vaso', x: 1112, y: 520, w: 126, h: 135 }, { tipo: 'espelho', x: 680, y: 140, w: 160, h: 200 }],
      jardim: [{ tipo: 'sapo', x: 600, y: C }, { tipo: 'irrigador', x: 640, y: C }, { tipo: 'varal', x1: 470, y1: 236, x2: 870, y2: 262 }, { tipo: 'correio', x: 122, y: 440, w: 56, h: 44 }],
      parquinho: [{ tipo: 'pipa', ax: 1210, ay: 600, x: 1010, y: 190 }, { tipo: 'sapo', x: 850, y: C }]
    })[cena] || [];
    M.aparelhos.forEach(function (a) { a.t = 0; a.ate = 0; a.on = false; if (APAR[a.tipo].nasce) APAR[a.tipo].nasce(a, rnd); });
    if (cena === 'quarto') M.estrelas = true;
    M.total = M.obs.length + (M.quadro ? 1 : 0) + (M.arvore ? 1 : 0) + (M.geladeira ? 1 : 0) + (M.torneira ? 1 : 0) + (M.papel ? 1 : 0) + (M.castelo ? 1 : 0);
    return M;
  }

  var CASA = ['sala', 'quarto', 'banheiro', 'cozinha', 'jardim', 'parquinho'];   // a ordem das setinhas
  var NOMES = { sala: ['🛋️ Sala', '🛋️ Living room'], quarto: ['🛏️ Quarto', '🛏️ Bedroom'], banheiro: ['🛁 Banheiro', '🛁 Bathroom'], cozinha: ['🍳 Cozinha', '🍳 Kitchen'], jardim: ['🌳 Jardim', '🌳 Garden'], parquinho: ['🛝 Parquinho', '🛝 Playground'] };
  function rect(a, b, pad) { return dentro(b, a, pad || 0); }
  function perto(x, y, r) { return function (a, b) { return Math.hypot(b.x - x(a), b.y - y(a)) < r; }; }
  /* cada aparelho: acerta (onde o toque pega), toque (o que acontece), passo (anima), desenho */
  var APAR = {
    tv: { acerta: function (a, b) { return rect(a, b, 6); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 600; a.on = !a.on; A.ponto(j, 4, 'tv', a.x + a.w / 2, a.y + 10, { texto: a.on ? '📺 Ligou!' : '📺 Desligou', textoEn: a.on ? '📺 On!' : '📺 Off', festa: true }); },
      desenho: function (ctx, a, ts) {
        ctx.fillStyle = '#212121'; arred(ctx, a.x - 6, a.y - 6, a.w + 12, a.h + 12, 8); ctx.fill();
        if (!a.on) { ctx.fillStyle = '#37474f'; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(a.x + 10, a.y + a.h); ctx.lineTo(a.x + 60, a.y); ctx.lineTo(a.x + 90, a.y); ctx.lineTo(a.x + 40, a.y + a.h); ctx.fill(); return; }
        ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
        var g = ctx.createLinearGradient(0, a.y, 0, a.y + a.h); g.addColorStop(0, '#4fc3f7'); g.addColorStop(1, '#b3e5fc'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, a.w, a.h);
        ctx.fillStyle = '#7cb342'; ctx.fillRect(a.x, a.y + a.h * 0.75, a.w, a.h * 0.25);
        ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(a.x + a.w - 24, a.y + 22, 13, 0, PI2); ctx.fill(); ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(a.x + a.w - 28, a.y + 20, 2, 0, PI2); ctx.arc(a.x + a.w - 20, a.y + 20, 2, 0, PI2); ctx.fill();
        var bx = a.x + ((ts / 6) % (a.w + 40)) - 20, by = a.y + a.h * 0.75 - 12 - Math.abs(Math.sin(ts / 180)) * 40;   // bolinha quicando no desenho animado
        ctx.fillStyle = '#ff4fa3'; ctx.beginPath(); ctx.arc(bx, by, 11, 0, PI2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 14px system-ui'; ctx.fillText('♪', a.x + 8 + Math.sin(ts / 300) * 4, a.y + 18);
        ctx.restore(); ctx.fillStyle = '#c6ff3d'; ctx.beginPath(); ctx.arc(a.x + a.w - 6, a.y + a.h + 2, 2.5, 0, PI2); ctx.fill();
      } },
    piano: { acerta: function (a, b) { return rect(a, b, 4); },
      toque: function (a, j, b, A) { var k = clamp(Math.floor((b.x - a.x) / a.w * 8), 0, 7); if (k === a.tecla && A.tempo < a.ateTecla) return; a.tecla = k; a.ateTecla = A.tempo + 140; A.emitir({ t: 'casa', j: j, som: 'nota' + k, x: a.x + (k + 0.5) * a.w / 8, y: a.y - 20, pontos: 1, texto: ['♪', '♫', '♬'][k % 3] }); A.M.notas = (A.M.notas || 0) + 1; },
      desenho: function (ctx, a, ts) {
        ctx.fillStyle = '#e53935'; arred(ctx, a.x, a.y, a.w, a.h, 8); ctx.fill(); ctx.fillStyle = '#b71c1c'; ctx.fillRect(a.x + 6, a.y + a.h - 8, 10, 10); ctx.fillRect(a.x + a.w - 16, a.y + a.h - 8, 10, 10);
        for (var k = 0; k < 8; k++) { var kx = a.x + 4 + k * (a.w - 8) / 8, kw = (a.w - 8) / 8 - 2, aperta = a.tecla === k && a.ateTecla > (a.agora || 0); ctx.fillStyle = aperta ? '#ffd166' : '#fff'; arred(ctx, kx, a.y + 14, kw, a.h - 22, 3); ctx.fill(); }
        ctx.fillStyle = '#212121'; [0, 1, 3, 4, 5].forEach(function (k) { ctx.fillRect(a.x + 4 + (k + 1) * (a.w - 8) / 8 - 4, a.y + 14, 7, (a.h - 22) * 0.55); });
      }, passo: function (a, dt, A) { a.agora = A.tempo; } },
    aquario: { nasce: function (a, rnd) { a.peixes = [0, 1, 2].map(function (i) { return { x: a.x + 15 + rnd() * (a.w - 30), y: a.y + 18 + i * 16, vx: (rnd() < 0.5 ? -1 : 1) * (20 + rnd() * 20), cor: ['#ff7043', '#ffd166', '#4fc3f7'][i] }; }); a.bolhas = []; },
      acerta: function (a, b) { return rect(a, b, 10); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 500; a.peixes.forEach(function (f) { f.vx = (f.x < b.x ? -1 : 1) * 160; }); for (var i = 0; i < 6; i++) a.bolhas.push({ x: a.x + 10 + A.rnd() * (a.w - 20), y: a.y + a.h - 8, t: 0 }); A.ponto(j, 3, 'bolhas', a.x + a.w / 2, a.y + 10, { texto: '🐟 +3' }); },
      passo: function (a, dt) { a.peixes.forEach(function (f) { f.x += f.vx * dt; if (f.x < a.x + 12) { f.x = a.x + 12; f.vx = Math.abs(f.vx); } if (f.x > a.x + a.w - 12) { f.x = a.x + a.w - 12; f.vx = -Math.abs(f.vx); } f.vx += (Math.sign(f.vx) * 25 - f.vx) * dt; }); a.bolhas.forEach(function (bo) { bo.t += dt; bo.y -= 40 * dt; }); a.bolhas = a.bolhas.filter(function (bo) { return bo.y > a.y + 4; }); },
      desenho: function (ctx, a, ts) {
        ctx.fillStyle = 'rgba(100,200,255,.55)'; ctx.fillRect(a.x, a.y + 8, a.w, a.h - 8); ctx.fillStyle = '#f0d290'; ctx.fillRect(a.x, a.y + a.h - 10, a.w, 10);
        ctx.strokeStyle = '#43a047'; ctx.lineWidth = 4; [a.x + 14, a.x + a.w - 18].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, a.y + a.h - 8); ctx.quadraticCurveTo(x + Math.sin(ts / 400) * 6, a.y + a.h - 30, x, a.y + a.h - 46); ctx.stroke(); });
        a.peixes.forEach(function (f) { var s = f.vx >= 0 ? 1 : -1; ctx.fillStyle = f.cor; ctx.beginPath(); ctx.ellipse(f.x, f.y, 9, 6, 0, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.moveTo(f.x - s * 7, f.y); ctx.lineTo(f.x - s * 15, f.y - 6); ctx.lineTo(f.x - s * 15, f.y + 6); ctx.fill(); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(f.x + s * 4, f.y - 1, 1.5, 0, PI2); ctx.fill(); });
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; a.bolhas.forEach(function (bo) { ctx.beginPath(); ctx.arc(bo.x + Math.sin(bo.t * 6) * 3, bo.y, 3, 0, PI2); ctx.stroke(); });
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.strokeRect(a.x, a.y, a.w, a.h);
      } },
    mobile: { nasce: function (a) { a.ang = 0; a.va = 0.4; },
      acerta: function (a, b) { return Math.hypot(b.x - a.x, b.y - 120) < 90; },
      toque: function (a, j, b, A) { a.ate = A.tempo + 400; a.va += 5; A.ponto(j, 3, 'lustre', a.x, 140, { texto: '⭐ +3', festa: true }); },
      passo: function (a, dt) { a.ang += a.va * dt; a.va += (0.4 - a.va) * dt * 0.6; },
      desenho: function (ctx, a, ts) {
        ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, 10); ctx.lineTo(a.x, 70); ctx.stroke();
        var pecas = [['⭐', '#ffd166'], ['🌙', '#fff59d'], ['☁️', '#fff'], ['❤️', '#ff4fa3']];
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x - Math.cos(a.ang) * 70, 70); ctx.lineTo(a.x + Math.cos(a.ang) * 70, 70); ctx.stroke();
        pecas.forEach(function (pc, i) { var an = a.ang + i * Math.PI / 2, dx = Math.cos(an) * 70, prof = Math.sin(an); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x + dx, 70); ctx.lineTo(a.x + dx, 112 + i * 6); ctx.stroke(); ctx.font = (24 + prof * 6) + 'px system-ui'; ctx.textAlign = 'center'; ctx.fillText(pc[0], a.x + dx, 132 + i * 6); });
      } },
    surpresa: { acerta: function (a, b) { return rect(a, b, 14); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 2200; a.mola = 2; A.ponto(j, 5, 'boing', a.x + a.w / 2, a.y - 60, { texto: '🤡 BUU!', festa: true }); },
      passo: function (a, dt) { a.mola = Math.max(0, (a.mola || 0) - dt); },
      desenho: function (ctx, a, ts) {
        var m = a.mola || 0;
        if (m > 0) { var alt = Math.min(1, (2 - m) * 6) * 70 + Math.sin(ts / 60) * 6 * m; ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = 4; ctx.beginPath(); for (var i = 0; i <= 8; i++) ctx.lineTo(a.x + a.w / 2 + (i % 2 ? 10 : -10), a.y - i * alt / 8); ctx.stroke();
          var cy = a.y - alt - 18; ctx.fillStyle = '#ffe0b2'; ctx.beginPath(); ctx.arc(a.x + a.w / 2, cy, 18, 0, PI2); ctx.fill(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(a.x + a.w / 2, cy + 3, 5, 0, PI2); ctx.fill(); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(a.x + a.w / 2 - 6, cy - 5, 2.5, 0, PI2); ctx.arc(a.x + a.w / 2 + 6, cy - 5, 2.5, 0, PI2); ctx.fill();
          ctx.fillStyle = '#8e5bff'; ctx.beginPath(); ctx.moveTo(a.x + a.w / 2 - 16, cy - 12); ctx.lineTo(a.x + a.w / 2, cy - 40); ctx.lineTo(a.x + a.w / 2 + 16, cy - 12); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(a.x + a.w / 2, cy - 40, 5, 0, PI2); ctx.fill(); }
        ctx.fillStyle = '#1e88e5'; ctx.fillRect(a.x, a.y, a.w, a.h); ctx.fillStyle = '#ffd166'; ctx.font = '700 32px system-ui'; ctx.textAlign = 'center'; ctx.fillText('?', a.x + a.w / 2, a.y + a.h / 2 + 11);
        ctx.fillStyle = '#ff4fa3'; ctx.fillRect(a.x + a.w, a.y + a.h / 2 - 3, 12, 6); ctx.beginPath(); ctx.arc(a.x + a.w + 14, a.y + a.h / 2 + Math.sin(ts / 200) * 6, 5, 0, PI2); ctx.fill();
      } },
    tambor: { acerta: function (a, b) { return rect(a, b, 12); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 160; a.bate = 0.25; A.emitir({ t: 'casa', j: j, som: 'tambor', x: a.x + a.w / 2, y: a.y - 20, pontos: 1, texto: '🥁', festa: true }); },
      passo: function (a, dt) { a.bate = Math.max(0, (a.bate || 0) - dt); },
      desenho: function (ctx, a) { var b2 = a.bate || 0; ctx.fillStyle = '#e53935'; ctx.fillRect(a.x, a.y + 8, a.w, a.h - 8); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(a.x + i * a.w / 4, a.y + 10); ctx.lineTo(a.x + (i + 1) * a.w / 4, a.y + a.h); ctx.stroke(); } ctx.fillStyle = b2 > 0 ? '#fffde7' : '#f5f5f5'; ctx.beginPath(); ctx.ellipse(a.x + a.w / 2, a.y + 8, a.w / 2, 9 - b2 * 12, 0, 0, PI2); ctx.fill(); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a.x + a.w + 6, a.y - 30 + b2 * 60); ctx.lineTo(a.x + a.w / 2 + 10, a.y + 2); ctx.stroke(); } },
    cuco: { acerta: function (a, b) { return rect(a, b, 10); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 1500; a.sai = 1.4; A.ponto(j, 4, 'cuco', a.x + a.w / 2, a.y - 10, { texto: '🐦 CUCO! CUCO!', festa: true }); },
      passo: function (a, dt, A) { a.sai = Math.max(0, (a.sai || 0) - dt); a.t += dt; if (a.t > 22) { a.t = 0; a.sai = 1.4; A.emitir({ t: 'casa', j: 0, som: 'cuco', x: a.x + a.w / 2, y: a.y - 10, pontos: 0 }); } },
      desenho: function (ctx, a, ts) {
        var cx = a.x + a.w / 2; ctx.fillStyle = '#8d5634'; ctx.fillRect(a.x, a.y + 16, a.w, a.h - 30); ctx.fillStyle = '#5d3a1f'; ctx.beginPath(); ctx.moveTo(a.x - 8, a.y + 20); ctx.lineTo(cx, a.y - 6); ctx.lineTo(a.x + a.w + 8, a.y + 20); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, a.y + 46, 15, 0, PI2); ctx.fill(); ctx.strokeStyle = '#212121'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, a.y + 46); ctx.lineTo(cx + Math.cos(ts / 1000) * 10, a.y + 46 + Math.sin(ts / 1000) * 10); ctx.moveTo(cx, a.y + 46); ctx.lineTo(cx + Math.cos(ts / 12000) * 7, a.y + 46 + Math.sin(ts / 12000) * 7); ctx.stroke();
        ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 2; var pe = Math.sin(ts / 400) * 0.4; ctx.beginPath(); ctx.moveTo(cx, a.y + a.h - 14); ctx.lineTo(cx + Math.sin(pe) * 30, a.y + a.h - 14 + Math.cos(pe) * 30); ctx.stroke(); ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.arc(cx + Math.sin(pe) * 30, a.y + a.h - 14 + Math.cos(pe) * 30, 5, 0, PI2); ctx.fill();
        ctx.fillStyle = '#3e2723'; ctx.fillRect(cx - 8, a.y + 18, 16, 12);
        if (a.sai > 0) { var o = Math.min(1, (1.4 - a.sai) * 5) * Math.min(1, a.sai * 5); ctx.fillStyle = '#ffee58'; ctx.beginPath(); ctx.arc(cx, a.y + 22 - o * 16, 9, 0, PI2); ctx.fill(); ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(cx + 7, a.y + 20 - o * 16); ctx.lineTo(cx + 16, a.y + 24 - o * 16); ctx.lineTo(cx + 7, a.y + 26 - o * 16); ctx.fill(); }
      } },
    torradeira: { acerta: function (a, b) { return rect(a, b, 12); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 900; a.pula = 0.3; [-14, 14].forEach(function (d) { A.soltar('torrada', a.x + a.w / 2 + d, a.y - 20, d * 8 + (A.rnd() - 0.5) * 200, -900 - A.rnd() * 300, { w: 40, h: 40, quica: 0.3 }); }); A.ponto(j, 6, 'torradeira', a.x + a.w / 2, a.y - 40, { texto: '🍞 Torrada voando!', textoEn: '🍞 Flying toast!', festa: true }); },
      passo: function (a, dt) { a.pula = Math.max(0, (a.pula || 0) - dt); },
      desenho: function (ctx, a) { ctx.fillStyle = '#cfd8dc'; arred(ctx, a.x, a.y, a.w, a.h, 12); ctx.fill(); ctx.fillStyle = '#90a4ae'; ctx.fillRect(a.x + 12, a.y + 4, a.w - 24, 5); ctx.fillRect(a.x + 12, a.y + 12, a.w - 24, 5); ctx.fillStyle = '#37474f'; ctx.fillRect(a.x + a.w - 4, a.y + ((a.pula || 0) > 0 ? 10 : 24), 8, 8); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(a.x + 6, a.y + 22, 6, a.h - 28); } },
    liquidificador: { acerta: function (a, b) { return rect(a, b, 12); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 2600; a.liga = 2.5; A.ponto(j, 5, 'liquidificador', a.x + a.w / 2, a.y - 20, { texto: '🌀 Vrrrrr!', festa: true }); },
      passo: function (a, dt) { a.liga = Math.max(0, (a.liga || 0) - dt); },
      desenho: function (ctx, a, ts) { var l = a.liga || 0, tr = l > 0 ? Math.sin(ts / 25) * 2 : 0; ctx.save(); ctx.translate(tr, 0); ctx.fillStyle = '#e53935'; arred(ctx, a.x - 4, a.y + a.h - 26, a.w + 8, 26, 6); ctx.fill(); ctx.fillStyle = 'rgba(200,235,255,.6)'; ctx.beginPath(); ctx.moveTo(a.x, a.y + 10); ctx.lineTo(a.x + a.w, a.y + 10); ctx.lineTo(a.x + a.w - 6, a.y + a.h - 26); ctx.lineTo(a.x + 6, a.y + a.h - 26); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ff7043'; var nivel = l > 0 ? 20 + Math.sin(ts / 40) * 4 : 30; ctx.fillRect(a.x + 6, a.y + a.h - 26 - nivel, a.w - 12, nivel); if (l > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a.x + a.w / 2, a.y + a.h - 40, 8, ts / 40, ts / 40 + 4); ctx.stroke(); } ctx.fillStyle = '#424242'; ctx.fillRect(a.x - 2, a.y + 4, a.w + 4, 8); ctx.restore(); } },
    microondas: { nasce: function (a) { a.abre = 0; a.alvo = 0; },
      acerta: function (a, b) { return rect(a, b, 6); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 700; a.alvo = a.alvo > 0.5 ? 0 : 1; A.ponto(j, 4, 'microondas', a.x + a.w / 2, a.y - 10, { texto: a.alvo ? '🔆 Abriu!' : '🔔 PIM!', festa: true }); },
      passo: function (a, dt) { a.abre += (a.alvo - a.abre) * Math.min(1, dt * 4); },
      desenho: function (ctx, a, ts) { ctx.fillStyle = '#eceff1'; arred(ctx, a.x, a.y, a.w, a.h, 8); ctx.fill(); ctx.fillStyle = a.abre > 0.1 ? '#fff8e1' : '#263238'; ctx.fillRect(a.x + 8, a.y + 8, a.w - 40, a.h - 16); if (a.abre > 0.1) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(a.x + 8 + (a.w - 40) / 2, a.y + a.h - 18, 22, 6, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.arc(a.x + 8 + (a.w - 40) / 2 + Math.cos(ts / 300) * 6, a.y + a.h - 24, 7, 0, PI2); ctx.fill(); }
        var lw = (a.w - 40) * Math.max(0.1, Math.cos(a.abre * 1.3)); ctx.fillStyle = 'rgba(30,40,50,.75)'; ctx.fillRect(a.x + 8, a.y + 8, lw, a.h - 16); ctx.fillStyle = '#90a4ae'; ctx.fillRect(a.x + a.w - 28, a.y + 12, 18, 10); ctx.fillStyle = '#4caf50'; ctx.font = '700 10px monospace'; ctx.fillText('12:00', a.x + a.w - 30, a.y + 36); [0, 1, 2].forEach(function (i) { ctx.fillStyle = '#b0bec5'; ctx.fillRect(a.x + a.w - 28, a.y + 44 + i * 9, 18, 6); }); } },
    chuveiro: { acerta: function (a, b) { return Math.hypot(b.x - a.x, b.y - a.y) < 55; },
      toque: function (a, j, b, A) { a.ate = A.tempo + 700; a.on = !a.on; A.ponto(j, 4, 'agua', a.x, a.y - 20, { texto: a.on ? '🚿 Chuveiro!' : '🚿 Fechou!', textoEn: a.on ? '🚿 Shower!' : '🚿 Off!' }); },
      passo: function (a, dt, A) { if (!a.on || !A.M.banheira) return; a.t += dt; if (a.t > 0.35) { a.t = 0; var Bn = A.M.banheira; Bn.bolhas.push({ x: a.x + (A.rnd() - 0.5) * 60, y: Bn.topo, r: 8 + A.rnd() * 12, vy: 40 + A.rnd() * 50, t: 0, vida: 3, f: A.rnd() * 6 }); } },
      desenho: function (ctx, a, ts) { if (!a.on) return; ctx.strokeStyle = 'rgba(120,200,255,.7)'; ctx.lineWidth = 3; for (var i = -3; i <= 3; i++) { var x = a.x + i * 6; ctx.beginPath(); ctx.moveTo(x, a.y + 4); ctx.lineTo(x + i * 6, 470); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.85)'; for (var k = 0; k < 10; k++) { var yy = a.y + 10 + ((ts / 4 + k * 37) % 110); ctx.fillRect(a.x - 20 + (k * 13) % 40, yy, 2, 7); } } },
    vaso: { acerta: function (a, b) { return rect(a, b, 6) && b.y > a.y + 30; },
      toque: function (a, j, b, A) { a.ate = A.tempo + 1800; a.gira = 1.6; A.ponto(j, 5, 'descarga', a.x + a.w / 2, a.y + 20, { texto: '🚽 Descarga!', textoEn: '🚽 Flush!', festa: true }); },
      passo: function (a, dt) { a.gira = Math.max(0, (a.gira || 0) - dt); },
      desenho: function (ctx, a, ts) { var cx = a.x + a.w / 2; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; arred(ctx, a.x + 22, a.y - 60, a.w - 36, 64, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b0bec5'; ctx.fillRect(a.x + 30, a.y - 44, 18, 6);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(a.x, a.y + 40); ctx.lineTo(a.x + a.w, a.y + 40); ctx.quadraticCurveTo(a.x + a.w - 10, a.y + 100, cx + 18, a.y + 110); ctx.lineTo(cx + 22, a.y + a.h); ctx.lineTo(cx - 22, a.y + a.h); ctx.lineTo(cx - 18, a.y + 110); ctx.quadraticCurveTo(a.x + 10, a.y + 100, a.x, a.y + 40); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e1f5fe'; arred(ctx, a.x - 4, a.y + 30, a.w + 8, 14, 7); ctx.fill(); ctx.stroke();
        if (a.gira > 0) { ctx.strokeStyle = 'rgba(66,165,245,.9)'; ctx.lineWidth = 3; for (var i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx, a.y + 37, 40 - i * 12, 5, 0, ts / 60 + i, ts / 60 + i + 4); ctx.stroke(); } } } },
    espelho: { acerta: function (a, b) { return rect(a, b, 0); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 900; a.emb = 3.5; A.ponto(j, 3, 'espelho', a.x + a.w / 2, a.y + 20, { texto: '😄', festa: true }); },
      passo: function (a, dt) { a.emb = Math.max(0, (a.emb || 0) - dt); },
      desenho: function (ctx, a) { var e = Math.min(1, (a.emb || 0) / 1.5); if (e <= 0) return; ctx.save(); ctx.globalAlpha = e; ctx.fillStyle = 'rgba(255,255,255,.65)'; arred(ctx, a.x, a.y, a.w, a.h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(80,120,160,.8)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; var cx = a.x + a.w / 2, cy = a.y + a.h / 2; ctx.beginPath(); ctx.arc(cx, cy, 50, 0, PI2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx - 18, cy - 12, 4, 0, PI2); ctx.arc(cx + 18, cy - 12, 4, 0, PI2); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy + 4, 26, 0.3, 2.8); ctx.stroke(); ctx.restore(); } },
    sapo: { frente: true, nasce: function (a) { a.x0 = a.x; a.dir = 1; a.pulo = null; a.t = 2; a.croac = 0; },
      acerta: function (a, b, A) { return Math.hypot(b.x - a.x, b.y - (a.y - 20)) < 55; },
      toque: function (a, j, b, A) { a.ate = A.tempo + 900; a.croac = 1; a.dir = b.x < a.x ? 1 : -1; a.pulo = { t: 0, dur: 0.6, x0: a.x, x1: clamp(a.x + a.dir * 220, 60, W - 60), alt: 180 }; A.ponto(j, 4, 'sapo', a.x, a.y - 70, { texto: '🐸 CROAC!', festa: true }); },
      passo: function (a, dt, A) { a.croac = Math.max(0, a.croac - dt); if (a.pulo) { var P = a.pulo; P.t += dt; var k = Math.min(1, P.t / P.dur); a.x = P.x0 + (P.x1 - P.x0) * k; a.h2 = P.alt * 4 * k * (1 - k); if (k >= 1) { a.pulo = null; a.h2 = 0; a.t = 2 + A.rnd() * 3; } return; } a.t -= dt; if (a.t < 0) { if (a.x < 120) a.dir = 1; else if (a.x > W - 120) a.dir = -1; else if (A.rnd() < 0.3) a.dir = -a.dir; a.pulo = { t: 0, dur: 0.45, x0: a.x, x1: clamp(a.x + a.dir * 90, 60, W - 60), alt: 60 }; } },
      desenho: function (ctx, a) { var y = a.y - (a.h2 || 0); ctx.save(); ctx.translate(a.x, y); ctx.scale(a.dir, 1); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, (a.h2 || 0), 26, 5, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.ellipse(0, -16, 26, 17, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.ellipse(-16, -4, 14, 7, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#a5d6a7'; ctx.beginPath(); ctx.ellipse(6, -8, 14, 8, 0, 0, PI2); ctx.fill(); [-2, 14].forEach(function (x) { ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(x, -32, 9, 0, PI2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, -33, 6, 0, PI2); ctx.fill(); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(x + 1.5, -33, 3, 0, PI2); ctx.fill(); }); ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(10, -16, 10, 0.2, 2.6); ctx.stroke(); if (a.croac > 0) { ctx.fillStyle = '#c8e6c9'; ctx.beginPath(); ctx.arc(14, -8, 8 + Math.sin(a.croac * 30) * 3, 0, PI2); ctx.fill(); } ctx.restore(); } },
    irrigador: { nasce: function (a) { a.gotas = []; a.ang = 0; },
      acerta: function (a, b) { return Math.hypot(b.x - a.x, b.y - (a.y - 20)) < 50; },
      toque: function (a, j, b, A) { a.ate = A.tempo + 700; a.on = !a.on; A.ponto(j, 4, 'agua', a.x, a.y - 60, { texto: a.on ? '💦 Água!' : '💦 Parou!', textoEn: a.on ? '💦 Water!' : '💦 Stopped!' }); },
      passo: function (a, dt, A) { if (a.on) { a.ang += dt * 3; for (var i = 0; i < 3; i++) a.gotas.push({ x: a.x, y: a.y - 34, vx: Math.cos(a.ang + i * 2.1) * 260, vy: -320 - A.rnd() * 80, t: 0 }); } a.gotas.forEach(function (g) { g.t += dt; g.vy += 900 * dt; g.x += g.vx * dt; g.y += g.vy * dt; }); a.gotas = a.gotas.filter(function (g) { return g.y < a.y + 4 && g.t < 2; }).slice(-160); },
      desenho: function (ctx, a) { ctx.fillStyle = '#1e88e5'; arred(ctx, a.x - 18, a.y - 14, 36, 14, 6); ctx.fill(); ctx.fillRect(a.x - 3, a.y - 34, 6, 22); ctx.save(); ctx.translate(a.x, a.y - 36); ctx.rotate(a.ang); ctx.fillStyle = '#ffd166'; ctx.fillRect(-16, -3, 32, 6); ctx.restore(); ctx.fillStyle = 'rgba(100,190,255,.8)'; a.gotas.forEach(function (g) { ctx.beginPath(); ctx.arc(g.x, g.y, 3, 0, PI2); ctx.fill(); }); } },
    varal: { nasce: function (a) { a.roupas = [0, 1, 2, 3].map(function (i) { return { k: 0.15 + i * 0.23, cor: ['#ff4fa3', '#3ee8ff', '#ffd166', '#c6ff3d'][i], tipo: i % 2 ? 'meia' : 'roupa', presa: true }; }); },
      acerta: function (a, b) { return b.x > a.x1 && b.x < a.x2 && b.y > a.y1 - 20 && b.y < a.y2 + 90; },
      toque: function (a, j, b, A) { var melhor = null, dm = 70; a.roupas.forEach(function (r) { if (!r.presa) return; var rx = a.x1 + (a.x2 - a.x1) * r.k, d = Math.abs(rx - b.x); if (d < dm) { dm = d; melhor = r; } }); if (!melhor) return; melhor.presa = false; var rx = a.x1 + (a.x2 - a.x1) * melhor.k, ry = a.y1 + (a.y2 - a.y1) * melhor.k + 40; A.soltar(melhor.tipo, rx, ry, (A.rnd() - 0.5) * 500, -300, { w: melhor.tipo === 'meia' ? 40 : 56, h: melhor.tipo === 'meia' ? 22 : 54, cor: melhor.cor, quica: 0.15 }); A.ponto(j, 5, 'janela', rx, ry - 30, { texto: '👕 Voou!', textoEn: '👕 Flew off!', festa: true }); },
      desenho: function (ctx, a) { ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 6; [a.x1, a.x2].forEach(function (x, i) { ctx.beginPath(); ctx.moveTo(x, i ? a.y2 : a.y1); ctx.lineTo(x, 650); ctx.stroke(); }); ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.quadraticCurveTo((a.x1 + a.x2) / 2, (a.y1 + a.y2) / 2 + 22, a.x2, a.y2); ctx.stroke();
        a.roupas.forEach(function (r) { if (!r.presa) return; var x = a.x1 + (a.x2 - a.x1) * r.k, y = a.y1 + (a.y2 - a.y1) * r.k + 22 * 4 * r.k * (1 - r.k); ctx.fillStyle = r.cor; if (r.tipo === 'meia') { ctx.fillRect(x - 8, y, 16, 34); ctx.fillRect(x - 8, y + 26, 26, 12); } else { ctx.beginPath(); ctx.moveTo(x - 26, y + 4); ctx.lineTo(x + 26, y + 4); ctx.lineTo(x + 20, y + 22); ctx.lineTo(x + 14, y + 18); ctx.lineTo(x + 14, y + 54); ctx.lineTo(x - 14, y + 54); ctx.lineTo(x - 14, y + 18); ctx.lineTo(x - 20, y + 22); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#8d6e63'; ctx.fillRect(x - 3, y - 4, 6, 10); }); } },
    correio: { acerta: function (a, b) { return rect(a, b, 18); },
      toque: function (a, j, b, A) { a.ate = A.tempo + 1500; a.bandeira = 1; for (var i = 0; i < 3; i++) A.soltar('carta', a.x + a.w / 2, a.y + 10, (A.rnd() - 0.3) * 400, -500 - A.rnd() * 200, { w: 40, h: 26, quica: 0.1 }); A.ponto(j, 5, 'correio', a.x + a.w / 2, a.y - 20, { texto: '✉️ Cartas!', textoEn: '✉️ Letters!', festa: true }); },
      passo: function (a, dt) { a.bandeira = Math.max(0, (a.bandeira || 0) - dt * 0.2); },
      desenho: function (ctx, a) { ctx.fillStyle = '#6d4c41'; ctx.fillRect(a.x + a.w / 2 - 4, a.y + a.h, 8, 650 - a.y - a.h); ctx.fillStyle = '#1e88e5'; arred(ctx, a.x, a.y, a.w, a.h, 14); ctx.fill(); ctx.fillStyle = '#0d47a1'; ctx.fillRect(a.x + 6, a.y + a.h / 2 - 3, a.w - 12, 6); ctx.save(); ctx.translate(a.x + a.w + 2, a.y + a.h / 2); ctx.rotate((a.bandeira > 0 ? -1.5 : 0)); ctx.fillStyle = '#e53935'; ctx.fillRect(0, -2, 6, 26); ctx.fillRect(0, 18, 18, 10); ctx.restore(); } },
    pipa: { nasce: function (a) { a.x0 = a.x; a.y0 = a.y; a.loop = 0; a.fase = 0; },
      acerta: function (a, b) { return Math.hypot(b.x - a.x, b.y - a.y) < 70; },
      toque: function (a, j, b, A) { a.ate = A.tempo + 1600; a.loop = 1.5; A.ponto(j, 5, 'tchau', a.x, a.y + 40, { texto: '🪁 Uhuuu!', festa: true }); },
      passo: function (a, dt) { a.fase += dt; if (a.loop > 0) { a.loop = Math.max(0, a.loop - dt); var an = (1.5 - a.loop) / 1.5 * PI2; a.x = a.x0 + Math.sin(an) * 90; a.y = a.y0 + 90 - Math.cos(an) * 90; } else { a.x = a.x0 + Math.sin(a.fase * 0.8) * 50; a.y = a.y0 + Math.sin(a.fase * 1.3) * 18; } },
      desenho: function (ctx, a, ts) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.ax, a.ay); ctx.quadraticCurveTo((a.ax + a.x) / 2 + 40, (a.ay + a.y) / 2 + 60, a.x, a.y + 30); ctx.stroke(); ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.sin(ts / 400) * 0.15 + (a.loop > 0 ? (1.5 - a.loop) / 1.5 * PI2 : 0)); ctx.fillStyle = '#ff4fa3'; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(26, 0); ctx.lineTo(0, 34); ctx.lineTo(-26, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(26, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(-26, 0); ctx.lineTo(0, 0); ctx.fill(); ctx.strokeStyle = '#8e5bff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 34); for (var i = 1; i < 6; i++) ctx.lineTo(Math.sin(ts / 200 + i) * 8, 34 + i * 14); ctx.stroke(); ctx.restore(); } }
  };

  /* ================= a partida ================= */
  function criar(cfg) {
    cfg = cfg || {};
    var rnd = cfg.aleatorio || Math.random;
    var nJog = cfg.jogadores === 2 ? 2 : 1;
    var duracao = typeof cfg.duracao === 'number' ? cfg.duracao : 60;
    var arrumando = cfg.modo === 'arrumar', segurando = {}, semArrumar = 0, dicasOn = cfg.dicas !== false;   // 🧹 arrumação: sem relógio, termina quando tudo volta ao lugar
    if (arrumando) duracao = 0;
    var cena = CENAS.indexOf(cfg.cenaCasa) >= 0 ? cfg.cenaCasa : CENAS[Math.floor(rnd() * CENAS.length) % CENAS.length];
    var M = montar(cena, rnd), visitados = {};
    var eventos = [], fase = 'pronto', tempo = 0, ultimaPct = 0;
    /* setinhas ◀ ▶: a casa é um caminho (um cômodo leva ao vizinho); cada cômodo guarda a bagunça deixada nele */
    function vizinhos() { var i = CASA.indexOf(M.cena); return { ant: CASA[(i + CASA.length - 1) % CASA.length], prox: CASA[(i + 1) % CASA.length] }; }
    function irPara(dir) {
      var v = vizinhos(), nova = dir < 0 ? v.ant : v.prox, mae = M.mae;
      visitados[M.cena] = M; var novo = !visitados[nova]; M = visitados[nova] || montar(nova, rnd); cena = nova;
      if (novo && cfg.modo === 'arrumar') { M.baguncou = true; baguncarSozinho(); }   // 🧹 direto: cada cômodo novo já chega bagunçado
      if (mae) M.mae = mae;
      M.trocou = dir < 0 ? -1 : 1; if (M.cachorro) { M.cachorro.x = dir < 0 ? W - 140 : 140; M.cachorro.dir = dir < 0 ? -1 : 1; }
      var n = NOMES[nova]; emitir({ t: 'casa', j: 0, som: 'porta', x: W / 2, y: 320, pontos: 0, texto: n[0], textoEn: n[1], troca: nova });
    }
    var jogadores = [];
    for (var j = 0; j < nJog; j++) jogadores.push({ pontos: 0, vidas: 3, combo: 0, rastro: [], corpo: { x: 0.5, topo: 0.1, altura: 0.8, pulando: false, abaixado: false, ts: 0 }, ref: null, esqAnt: null });
    function raia(j) { return nJog === 1 ? { x: 0, y: 0, w: W, h: H } : { x: j * W / 2, y: 0, w: W / 2, h: H }; }
    function emitir(e) { eventos.push(e); }
    function ponto(j, n, som, x, y, extra) { jogadores[j].pontos += n; var e = { t: 'casa', j: j, som: som, x: x, y: y, pontos: n }; for (var k in extra) e[k] = extra[k]; emitir(e); }

    /* ---- física ---- */
    function meiaAltura(o) { return Math.abs(Math.cos(o.ang)) * o.h / 2 + Math.abs(Math.sin(o.ang)) * o.w / 2; }
    function meiaLargura(o) { return Math.abs(Math.cos(o.ang)) * o.w / 2 + Math.abs(Math.sin(o.ang)) * o.h / 2; }
    function porId(id) { for (var i = 0; i < M.obs.length; i++) if (M.obs[i].id === id) return M.obs[i]; return null; }
    function acordar(o) { if (o.dorme) { o.dorme = false; o.apoio = null; o.parado = 0; } }
    function baguncado(o) { return o.fora || o.aberto || Math.hypot(o.x - o.x0, o.y - o.y0) > 30 || Math.abs(Math.atan2(Math.sin(o.ang - o.ang0), Math.cos(o.ang - o.ang0))) > 0.5; }
    function bagunca(R) {
      R = R || M;
      var n = 0, extras = 0; R.obs.forEach(function (o) { if (o.extra) { if (arrumando && !o.fora) extras++; return; } if (baguncado(o) || o.segurado) n++; });   // o que um aparelho soltou não conta na bagunça, mas tem de ir para o cesto na arrumação
      if (R.quadro && Math.abs(R.quadro.repouso) > 0.12) n++;
      if (R.arvore && (arrumando ? R.folhasChao.length > 0 : R.folhasChao.length >= 12)) n++;
      if (R.geladeira && R.geladeira.alvo > 0.5) n++;
      if (R.torneira && R.torneira.ligada) n++;
      if (R.papel && R.papel.pts.length >= (arrumando ? 1 : 10)) n++;
      if (R.castelo && !R.castelo.inteiro) n++;
      return Math.min(1, (n + extras) / (R.total + extras));
    }
    function passo(dt) {
      var obs = M.obs;
      // quem dorme apoiado em outra coisa acorda se o apoio sair do lugar (a torre desaba, o livro de cima cai)
      obs.forEach(function (o) {
        if (!o.dorme || !o.apoio || o.apoio.o == null) return;
        var a = porId(o.apoio.o);
        if (!a || !a.dorme || a.fora || Math.abs(a.x - o.x) > a.w * 0.6 + 4 || a.y - meiaAltura(a) - (o.y + meiaAltura(o)) > 8) acordar(o);
      });
      obs.forEach(function (o) {
        if (o.dorme || o.fora || o.segurado) { if (o.gira > 0) o.gira = Math.max(0, o.gira - dt); return; }
        var antY = o.y + meiaAltura(o);
        o.vy += G * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.ang += o.va * dt;
        if (o.gira > 0) o.gira = Math.max(0, o.gira - dt);
        var mh = meiaAltura(o), mw = meiaLargura(o), baixo = o.y + mh, pousou = false;
        // saída pela janela aberta (sala/quarto) ou por cima da cerca (jardim)
        var jan = M.janela, spd = Math.hypot(o.vx, o.vy);
        if (jan && jan.abre > 0.55 && ['bola', 'pato', 'maca', 'laranja', 'tampa'].indexOf(o.tipo) >= 0 && spd > 350 && dentro(o, { x: jan.x + 20, y: jan.y + 20, w: jan.w - 40, h: jan.h - 40 })) { o.fora = 0.001; o.saida = { x: jan.x + jan.w / 2, y: jan.y + jan.h / 2 }; ponto(o.ult || 0, 20, 'tchau', o.x, o.y, { texto: '👋 Tchau, ' + nome(o) + '! +20', festa: true }); return; }
        if (M.jardim && (o.x < -o.r || o.x > W + o.r) && o.y < 420) { o.fora = 0.001; o.saida = { x: o.x < 0 ? -200 : W + 200, y: o.y - 80 }; ponto(o.ult || 0, 20, 'tchau', clamp(o.x, 80, W - 80), o.y, { texto: '🚀 Lá se foi! +20', festa: true }); return; }
        // escorregador: quem cai na rampa desce escorregando
        var naRampa = false;
        if (M.rampas) M.rampas.forEach(function (R) { if (o.x < R.x1 || o.x > R.x2) return; var sy = R.y1 + (o.x - R.x1) * (R.y2 - R.y1) / (R.x2 - R.x1); if (o.y + o.r > sy && o.y - o.r < sy + 40) { o.y = sy - o.r; var an = Math.atan2(R.y2 - R.y1, R.x2 - R.x1), ca = Math.cos(an), sa = Math.sin(an), v = Math.max(0, o.vx * ca + o.vy * sa) + G * sa * dt; o.vx = v * ca; o.vy = v * sa; o.va = v / Math.max(10, o.r); o.parado = 0; naRampa = true; } });
        if (naRampa) return;
        // rolo de papel: desenrola uma fita pelo caminho
        if (o.tipo === 'rolo' && M.papel) { var P = M.papel, ul = P.pts[P.pts.length - 1] || { x: P.x, y: P.y }; if (Math.hypot(o.x - ul.x, o.y - ul.y) > 14 && P.pts.length < 220) { if (!P.pts.length) ponto(o.ult || 0, 10, 'papel', o.x, o.y, { texto: '🧻 Desenrolou! +10', textoEn: '🧻 Unrolled! +10', festa: true }); P.pts.push({ x: o.x, y: o.y + o.r * 0.7 }); } }
        // prateleiras, sofá, cama, baú (só pousa quem vem de cima)
        for (var i = 0; i < M.plats.length && !pousou; i++) {
          var p = M.plats[i];
          if (o.vy > 0 && antY <= p.y + 3 && baixo >= p.y && o.x > p.x1 - mw * 0.3 && o.x < p.x2 + mw * 0.3) { o.y = p.y - mh; pousou = { p: i }; }
        }
        if (!pousou && baixo >= M.chao) { o.y = M.chao - mh; pousou = { p: -1 }; }
        if (pousou) {
          var forte = o.vy > 260;
          if (o.tipo === 'livro' && pousou.p === -1 && !o.aberto && (forte || Math.abs(o.va) > 2)) { o.aberto = true; o.tAberto = tempo; o.ang = 0; o.va = 0; o.w = 92; o.h = 18; o.y = M.chao - 9; o.r = 26; emitir({ t: 'casa', j: o.ult || 0, som: 'livro', x: o.x, y: o.y, pontos: 0 }); }
          else if (forte) emitir({ t: 'casa', j: o.ult || 0, som: o.tipo === 'bola' ? 'boing' : o.tipo === 'bloco' ? 'bloco' : o.tipo === 'almofada' || o.tipo === 'ursinho' ? 'fofo' : 'tum', x: o.x, y: o.y, pontos: 0, silencioso: true });
          o.vy = Math.abs(o.vy) > 120 ? -o.vy * o.quica : 0;
          o.vx *= DESLIZA.indexOf(o.tipo) >= 0 ? 0.995 : ROLA.indexOf(o.tipo) >= 0 ? 0.985 : 0.82; o.va *= 0.8;
          if (ROLA.indexOf(o.tipo) >= 0) o.va = o.vx / Math.max(10, o.r);   // rola
          else if (o.vy === 0) {   // assenta: deita no lado mais próximo
            var q = Math.round(o.ang / (Math.PI / 2)) * (Math.PI / 2); o.ang += (q - o.ang) * Math.min(1, dt * 10);
          }
          if (o.vy === 0 && Math.abs(o.vx) < 14) { o.parado += dt; if (o.parado > 0.35) { o.dorme = true; o.vx = 0; o.va = 0; o.apoio = pousou.p === -1 ? { p: -1 } : pousou; } } else o.parado = 0;
        }
        // paredes
        var esq = 18, dir = W - 18;
        if (!M.jardim) {
          if (o.x - mw < esq) { o.x = esq + mw; o.vx = Math.abs(o.vx) * 0.6; o.va *= -0.5; }
          if (o.x + mw > dir) { o.x = dir - mw; o.vx = -Math.abs(o.vx) * 0.6; o.va *= -0.5; }
          if (o.y - mh < 0) { o.y = mh; o.vy = Math.abs(o.vy) * 0.4; }
        } else if (o.y > 420) {   // no jardim a cerca segura quem está baixo
          if (o.x - mw < 6) { o.x = 6 + mw; o.vx = Math.abs(o.vx) * 0.6; }
          if (o.x + mw > W - 6) { o.x = W - 6 - mw; o.vx = -Math.abs(o.vx) * 0.6; }
        }
        // bateu no lustre: ele balança e a luz muda de cor
        var L = M.lustre; if (L) { var lx = L.x + Math.sin(L.ang) * L.L, ly = Math.cos(L.ang) * L.L + 10; if (Math.hypot(o.x - lx, o.y - ly) < o.r + 34 && tempo >= L.ate) { L.va += clamp(o.vx * 0.004, -3, 3) || 1.5; L.ate = tempo + 400; o.vy = Math.abs(o.vy) * 0.5; o.vx *= -0.5; M.corLuz = (M.corLuz + 1) % CORES_LUZ.length; ponto(o.ult || 0, 8, 'lustre', lx, ly, { texto: '💡 +8' }); } }
        // copa da árvore: a bola faz cair folhas
        if (M.arvore && Math.hypot(o.x - M.arvore.copa.x, o.y - M.arvore.copa.y) < M.arvore.copa.r && spd > 300) sacudirArvore(o.ult || 0, o.x, o.y, false);
      });
      // coisas que saíram voando: encolhem até sumir
      obs.forEach(function (o) { if (o.fora && o.fora < 1) { o.fora = Math.min(1, o.fora + dt * 1.6); o.x += (o.saida.x - o.x) * dt * 3; o.y += (o.saida.y - o.y) * dt * 3; o.ang += dt * 8; } });
      // empurrões entre coisas acordadas (e acordam quem leva um tranco)
      for (var a = 0; a < obs.length; a++) {
        var A = obs[a]; if (A.fora) continue;
        for (var b = a + 1; b < obs.length; b++) {
          var B = obs[b]; if (B.fora || (A.dorme && B.dorme) || A.segurado || B.segurado || A.guardado || B.guardado) continue;
          var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), min = A.r + B.r;
          if (d >= min || d === 0) continue;
          var nx = dx / d, ny = dy / d, rel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny, sobra = min - d;
          if (A.dorme) { B.x += nx * sobra; B.y += ny * sobra; } else if (B.dorme) { A.x -= nx * sobra; A.y -= ny * sobra; } else { A.x -= nx * sobra / 2; A.y -= ny * sobra / 2; B.x += nx * sobra / 2; B.y += ny * sobra / 2; }
          if (rel > 0) {
            var imp = rel * 0.75;
            if (A.dorme && imp > 90) { acordar(A); A.ult = B.ult; } if (B.dorme && imp > 90) { acordar(B); B.ult = A.ult; }
            if (!A.dorme) { A.vx -= imp * nx; A.vy -= imp * ny; } if (!B.dorme) { B.vx += imp * nx; B.vy += imp * ny; B.va += (rnd() - 0.5) * 4; }
            if (imp > 300) emitir({ t: 'casa', j: A.ult || B.ult || 0, som: A.tipo === 'bloco' || B.tipo === 'bloco' ? 'bloco' : 'tum', x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, pontos: 0, silencioso: true });
          }
        }
      }
      // a bola que saiu volta depois de um tempo, rolando pela porta (para a brincadeira não acabar)
      obs.forEach(function (o) { if (o.fora === 1 && o.tipo === 'bola') { o.volta = (o.volta || 0) + dt; if (o.volta > 4) { o.fora = 0; o.volta = 0; o.saida = null; o.x = rnd() < 0.5 ? 60 : W - 60; o.y = 300; o.vx = o.x < W / 2 ? 420 : -420; o.vy = -200; o.ang = 0; o.dorme = false; } } });
      // especiais
      var L2 = M.lustre; if (L2) { L2.va += (-9 * Math.sin(L2.ang) - 0.5 * L2.va) * dt; L2.ang += L2.va * dt; }
      var Q = M.quadro; if (Q) { Q.va += (-40 * (Q.ang - Q.repouso) - 2.2 * Q.va) * dt; Q.ang += Q.va * dt; }
      var J = M.janela; if (J) J.abre += (J.alvo - J.abre) * Math.min(1, dt * 2.6);
      var Bl = M.balanco; if (Bl) { Bl.va += (-6 * Math.sin(Bl.ang) - 0.25 * Bl.va) * dt; Bl.ang += Bl.va * dt; }
      if (M.flores) M.flores.forEach(function (f) { f.va += (-60 * f.ang - 3 * f.va) * dt; f.ang += f.va * dt; });
      if (M.arvore && M.arvore.treme > 0) M.arvore.treme = Math.max(0, M.arvore.treme - dt);
      if (M.passaros) M.passaros.forEach(function (p) {
        if (p.voando > 0) { p.voando += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 30 * dt; if (p.voando > 7) { p.voando = 0; p.volta = 1; p.x = p.x0 + (p.vx > 0 ? 500 : -500); p.y = p.y0 - 200; } }
        else if (p.volta > 0) { p.x += (p.x0 - p.x) * dt * 1.5; p.y += (p.y0 - p.y) * dt * 1.5; if (Math.hypot(p.x - p.x0, p.y - p.y0) < 3) { p.volta = 0; p.x = p.x0; p.y = p.y0; } }
      });
      if (M.borboletas) M.borboletas.forEach(function (b) {
        b.fase += dt; var alvoVx = Math.sin(b.fase * 0.7) * 90, alvoVy = Math.cos(b.fase * 1.1) * 60;
        if (b.foge > 0) { b.foge -= dt; } else { b.vx += (alvoVx - b.vx) * dt; b.vy += (alvoVy - b.vy) * dt; }
        b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < 40) b.vx = Math.abs(b.vx); if (b.x > W - 40) b.vx = -Math.abs(b.vx); if (b.y < 140) b.vy = Math.abs(b.vy); if (b.y > 560) b.vy = -Math.abs(b.vy);
      });
      M.folhas.forEach(function (f) { f.t += dt; f.y += f.vy * dt; f.x += Math.sin(f.t * 3 + f.fase) * 40 * dt + f.vx * dt; f.rot += dt * 2; });
      for (var fi = M.folhas.length - 1; fi >= 0; fi--) { var fo = M.folhas[fi]; if (fo.y >= M.chao + 4 - fo.cam) { M.folhasChao.push({ x: fo.x, y: M.chao + 4 - fo.cam, rot: fo.rot, cor: fo.cor }); M.folhas.splice(fi, 1); } }
      if (M.folhasChao.length > 140) M.folhasChao.splice(0, M.folhasChao.length - 140);
      M.petalas.forEach(function (p) { p.t += dt; p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); M.petalas = M.petalas.filter(function (p) { return p.t < 1.4; });
      cachorro(dt); gato(dt); papagaio(dt); tartaruga(dt);
      M.aparelhos.forEach(function (a) { if (APAR[a.tipo].passo) APAR[a.tipo].passo(a, dt, api); });
      var Gd = M.geladeira; if (Gd) Gd.abre += (Gd.alvo - Gd.abre) * Math.min(1, dt * 3);
      var Bn = M.banheira; if (Bn) { Bn.bolhas.forEach(function (b) { b.t += dt; b.y -= b.vy * dt; b.x += Math.sin(b.t * 3 + b.f) * 20 * dt; }); Bn.bolhas = Bn.bolhas.filter(function (b) { return b.t < b.vida && b.y > 60; }); }
      var Gg = M.gangorra; if (Gg) { Gg.va += ((Gg.ang >= 0 ? 2.2 : -2.2) - 1.4 * Gg.va) * dt; Gg.ang += Gg.va * dt; if (Gg.ang > 0.26) { Gg.ang = 0.26; Gg.va = -Math.abs(Gg.va) * 0.35; } if (Gg.ang < -0.26) { Gg.ang = -0.26; Gg.va = Math.abs(Gg.va) * 0.35; } }
    }
    var FRASES = [['Currupaco!', 'Squawk!'], ['Que bagunça!', 'What a mess!'], ['Oi, Picolé!', 'Hi, Picolé!'], ['Arruma isso!', 'Clean this up!'], ['Bagunça! Bagunça!', 'Mess! Mess!'], ['Cadê o biscoito?', 'Where is my cookie?'], ['A mamãe vem aí!', 'Mom is coming!'], ['Olá, olá!', 'Hello, hello!'], ['Mais! Mais!', 'More! More!']];
    function falar(j, x, y) { var P = M.papagaio, f = FRASES[Math.floor(rnd() * FRASES.length) % FRASES.length]; P.fala = 2.2; P.txt = f[0]; P.txtEn = f[1]; emitir({ t: 'casa', j: j, som: 'papagaio', x: x, y: y, pontos: 0, fala: f }); }
    function papagaio(dt) {
      var P = M.papagaio; if (!P) return;
      P.fala = Math.max(0, P.fala - dt); P.fase += dt; P.prox -= dt;
      if (P.voa > 0) {
        P.voa += dt;
        if (P.voa < 4.5) { P.x = clamp(P.px + Math.sin(P.voa * 1.3) * 420, 80, W - 80); P.y = clamp(P.py - 140 + Math.sin(P.voa * 2.6) * 90, 70, 420); }
        else { P.x += (P.px - P.x) * dt * 2.5; P.y += (P.py - 30 - P.y) * dt * 2.5; if (Math.hypot(P.x - P.px, P.y - P.py + 30) < 4) { P.voa = 0; P.x = P.px; P.y = P.py - 30; } }
      }
      if (P.prox < 0 && fase === 'jogando') { P.prox = 12 + rnd() * 8; falar(0, P.x, P.y - 40); }
    }
    function platsGato() { var l = M.plats.map(function (p, i) { return { i: i, x1: p.x1, x2: p.x2, y: p.y }; }).filter(function (p) { return p.x2 - p.x1 >= 70 && p.y >= 100; }); l.push({ i: -1, x1: 60, x2: W - 60, y: M.chao }); return l; }
    function pularGato(alto) {
      var g = M.gato, ops = platsGato().filter(function (p) { return p.i !== g.plat; });
      if (alto) ops = ops.filter(function (p) { return p.i >= 0; });
      if (!ops.length) return;
      var d = ops[Math.floor(rnd() * ops.length) % ops.length], x1 = clamp(d.x1 + 30 + rnd() * (d.x2 - d.x1 - 60), d.x1 + 20, d.x2 - 20);
      g.salto = { t: 0, dur: 0.75, x0: g.x, y0: g.y, x1: x1, y1: d.y, plat: d.i }; g.dorme = false; g.dir = x1 > g.x ? 1 : -1;
    }
    function gato(dt) {
      var g = M.gato; if (!g) return;
      g.miau = Math.max(0, g.miau - dt); g.ops = Math.max(0, g.ops - dt);
      if (g.salto) { var S = g.salto; S.t += dt; var k = Math.min(1, S.t / S.dur); g.x = S.x0 + (S.x1 - S.x0) * k; g.y = S.y0 + (S.y1 - S.y0) * k - 220 * 4 * k * (1 - k); if (k >= 1) { g.salto = null; g.plat = S.plat; g.y = S.y1; g.t = 3 + rnd() * 4; } return; }
      g.t -= dt;
      if (g.dorme) { if (g.t < 0) { g.dorme = false; g.t = 4 + rnd() * 4; } return; }
      var p = g.plat >= 0 ? M.plats[g.plat] : { x1: 60, x2: W - 60, y: M.chao };
      g.x += g.dir * 55 * dt; g.passo += dt * 9;
      if (g.x < p.x1 + 20) { g.x = p.x1 + 20; g.dir = 1; } if (g.x > p.x2 - 20) { g.x = p.x2 - 20; g.dir = -1; }
      // derruba o que estiver no caminho
      if (g.ops <= 0 && !arrumando) M.obs.forEach(function (o) { if (g.ops > 0 || !o.dorme || o.fora) return; var mesma = g.plat >= 0 ? (o.apoio && o.apoio.p === g.plat) : (Math.abs(o.y + meiaAltura(o) - M.chao) < 4); if (!mesma || Math.abs(o.x - g.x) > o.w / 2 + 16 || (o.x - g.x) * g.dir < 0) return; acordar(o); o.vx = g.dir * (240 + rnd() * 120); o.vy = -160; o.va = g.dir * 4; o.ult = 0; g.ops = 4; emitir({ t: 'casa', j: 0, som: 'miau', x: g.x, y: g.y - 70, pontos: 0, texto: '😼 Ops!', textoEn: '😼 Oops!' }); });   // um empurrão de cada vez: a bagunça maior é da criança
      // fugindo do Picolé
      var c = M.cachorro; if (c && g.plat === -1 && Math.abs(c.x - g.x) < 120) { g.miau = 0.9; emitir({ t: 'casa', j: 0, som: 'miau', x: g.x, y: g.y - 80, pontos: 0, texto: '🙀 FFFF!', textoEn: '🙀 HISS!' }); pularGato(true); return; }
      if (g.t < 0) { if (rnd() < 0.35) { g.dorme = true; g.t = 5 + rnd() * 4; } else pularGato(false); }
    }
    function tartaruga(dt) {
      var t = M.tartaruga; if (!t) return;
      if (t.esconde > 0) { t.esconde -= dt; return; }
      t.x += t.dir * 16 * dt; t.passo += dt * 4; if (t.x < 60) t.dir = 1; if (t.x > W - 60) t.dir = -1;
      // bola que vem rolando faz ela se esconder
      M.obs.forEach(function (o) { if (!o.dorme && !o.fora && Math.abs(o.x - t.x) < o.r + 40 && o.y > M.chao - 90 && Math.hypot(o.vx, o.vy) > 220) { t.esconde = 2.5; } });
    }
    // o que os aparelhos podem fazer no mundo
    function soltar(tipo, x, y, vx, vy, o) { o = o || {}; var w = o.w || 40, h = o.h || 40; var c = { id: ++M.seq, tipo: tipo, x: x, y: y, w: w, h: h, r: o.r || Math.min(w, h) / 2, vx: vx, vy: vy, ang: 0, va: (rnd() - 0.5) * 8, dorme: false, apoio: null, quica: o.quica != null ? o.quica : 0.3, cor: o.cor, toque: {}, parado: 0, fora: 0, aberto: false, gira: 0, extra: true }; c.x0 = x; c.y0 = y; c.ang0 = 0; M.obs.push(c); return c; }
    var api = { ponto: function () { ponto.apply(null, arguments); }, emitir: emitir, soltar: soltar, rnd: rnd, get M() { return M; }, get tempo() { return tempo; } };
    function nome(o) { return { bola: 'bola', pato: 'patinho', maca: 'maçã', laranja: 'laranja', tampa: 'tampa', bambole: 'bambolê' }[o.tipo] || 'brinquedo'; }

    /* ---- o cachorrinho anda, late e corre atrás da bola ---- */
    function cachorro(dt) {
      var c = M.cachorro; if (!c) return;
      c.troca -= dt * 1000; c.late = Math.max(0, c.late - dt);
      if (c.y < 0 || c.vy < 0) { c.vy += G * dt; c.y = Math.min(0, c.y + c.vy * dt); if (c.y === 0) c.vy = 0; }
      // procura uma bola no chão por perto
      var alvo = null, melhor = 520;
      if (!arrumando) M.obs.forEach(function (o) { if (o.tipo !== 'bola' || o.fora || o.ult == null || o.y < M.chao - 60) return; var d = Math.abs(o.x - c.x); if (d < melhor) { melhor = d; alvo = o; } });   // só brinca com a bola que a criança já mexeu
      var vel = c.late > 0 ? 0 : alvo ? 190 : 70;
      if (alvo) {
        c.dir = alvo.x > c.x ? 1 : -1;
        if (Math.abs(alvo.x - c.x) < 70 && Math.abs(alvo.vx) < 80) {   // alcançou a bola parada (ou quase): dá um focinhaço
          acordar(alvo); alvo.vx = c.dir * (380 + rnd() * 260); alvo.vy = -380 - rnd() * 200; alvo.ult = alvo.ult || 0;
          if (c.troca < 0) { c.late = 0.5; c.troca = 1500; emitir({ t: 'casa', j: alvo.ult, som: 'latido', x: c.x, y: M.chao - 90, pontos: 0 }); }   // latido sozinho: só o balão em cima dele (sem texto voando)
        }
      } else if (c.troca < 0) { c.dir = rnd() < 0.5 ? -1 : 1; c.troca = 2500 + rnd() * 3500; }
      c.x += c.dir * vel * dt; c.passo += vel * dt * 0.08;
      if (c.x < 70) { c.x = 70; c.dir = 1; } if (c.x > W - 70) { c.x = W - 70; c.dir = -1; }
      if (arrumando) { if (c.x < W - 360) c.dir = 1; else if (c.x > W - 100) c.dir = -1; }   // 🧹 arrumando: o Picolé fica no canto, longe das caixas
    }
    function sacudirArvore(j, x, y, pelaMao) {
      var A = M.arvore; if (!A || A.treme > 0.25) return;
      A.treme = 0.6;
      for (var k = 0; k < 10; k++) M.folhas.push({ x: A.copa.x + (rnd() - 0.5) * A.copa.r * 1.6, y: A.copa.y + (rnd() - 0.3) * A.copa.r, vy: 70 + rnd() * 70, vx: (rnd() - 0.5) * 40, t: 0, fase: rnd() * 6, rot: rnd() * 6, cor: ['#7cb342', '#9ccc65', '#fdd835', '#ff8f00'][Math.floor(rnd() * 4)], cam: rnd() * 8 });
      M.passaros.forEach(function (p) { if (p.voando === 0 && p.volta === 0) { p.voando = 0.001; p.vx = (p.x > A.copa.x ? 1 : -1) * (180 + rnd() * 120); p.vy = -150 - rnd() * 100; } });
      ponto(j, pelaMao ? 6 : 10, 'folhas', x, y, { texto: '🍃 +' + (pelaMao ? 6 : 10) });
    }

    /* ---- o toque/movimento da criança ---- */
    /* ======== 🧹 arrumação: arrastar cada coisa para o lugar dela ======== */
    var CESTO = { x: 22, y: 560, w: 110, h: 90 };   // as coisas soltas (torrada, carta, roupa) vão para o cesto
    function noLugar(o) { return o.dorme && !o.segurado && !baguncado(o); }
    /* arrumar não é só devolver ao chão: o que morava no chão vai para caixas transparentes, uma por tipo
       (bolas, blocos, brinquedos, cozinha, banho, parquinho). As meias vão para o cesto. O que mora na
       prateleira volta para a prateleira; vaso, gnomo e regador continuam no chão (é o lugar deles). */
    var GUARDA = { bola: ['bolas', '⚽'], bambole: ['bolas', '⚽'], bloco: ['blocos', '🧱'], carrinho: ['brinq', '🧸'], piao: ['brinq', '🧸'], ursinho: ['brinq', '🧸'], pato: ['brinq', '🦆'], robo: ['brinq', '🧸'],
      cone: ['parque', '🪣'], balde: ['parque', '🪣'], pa: ['parque', '🪣'], tigela: ['cozinha', '🍳'], tampa: ['cozinha', '🍳'], panela: ['cozinha', '🍳'], caneca: ['cozinha', '🍳'], pote: ['cozinha', '🍳'], colher: ['cozinha', '🍳'],
      sabonete: ['banho', '🧴'], frasco: ['banho', '🧴'], escova: ['banho', '🧴'], copo: ['banho', '🧴'] };
    function noChao(o, n) {
      if (n > 10) return false;
      var mh = Math.abs(Math.cos(o.ang0 || 0)) * o.h0 / 2 + Math.abs(Math.sin(o.ang0 || 0)) * o.w0 / 2;
      if (Math.abs(o.y0 + mh - M.chao) < 8) return true;
      var a = o.apoio0 && o.apoio0.o != null ? porId(o.apoio0.o) : null;   // em cima de outra coisa do chão (a torre de blocos)
      return !!a && noChao(a, n + 1);
    }
    function organizar() {
      M.organizado = true; M.caixas = [];
      jogadores.forEach(function (jg) { jg.corpo.x = 0.78; });   // o boneco espera no canto direito: o chão do meio é das caixas
      var grupos = {}, ordem = [], ocupado = [[0, 150], [W - 400, W]];   // cantos: ◀ e o cesto; ▶ e o botão 💡
      M.obs.forEach(function (o) {
        if (o.extra || !noChao(o, 0)) return;
        if (o.tipo === 'meia' || o.tipo === 'toalha') { o.extra = true; return; }   // roupa no chão: cesto
        var g = GUARDA[o.tipo];
        if (!g) { ocupado.push([o.x0 - o.w0 / 2 - 10, o.x0 + o.w0 / 2 + 10]); return; }   // fica no chão: a caixa não vai em cima
        if (!grupos[g[0]]) { grupos[g[0]] = { id: g[0], icone: g[1], itens: [] }; ordem.push(grupos[g[0]]); }
        grupos[g[0]].itens.push(o);
      });
      var x = 150;
      ordem.forEach(function (g) {
        var n = g.itens.length, linhas = n > 3 ? 2 : 1, cols = Math.ceil(n / linhas);
        g.itens.forEach(function (o) { o.s = Math.min(1, 44 / Math.max(o.w0, o.h0)); });
        var slot = Math.max.apply(null, g.itens.map(function (o) { return o.w0 * o.s; })) + 6, bw = Math.max(90, cols * slot + 20), bh = linhas === 2 ? 92 : 72;
        var livre = function (x0) { return !ocupado.some(function (iv) { return x0 < iv[1] && x0 + bw > iv[0]; }); }, t = x;
        while (t + bw < W - 400 && !livre(t)) t += 8;
        if (t + bw >= W - 400) { t = 150; while (t + bw < W - 400 && !livre(t)) t += 8; if (t + bw >= W - 400) t = Math.min(x, W - 160 - bw); }   // sem vaga: fica onde der
        var C = { id: g.id, icone: g.icone, x: t, y: M.chao + 6 - bh, w: bw, h: bh }; M.caixas.push(C); ocupado.push([t - 8, t + bw + 8]); x = t + bw + 12;
        g.itens.forEach(function (o, i) {
          var tras = linhas === 2 && i >= cols, col = tras ? i - cols : i, nl = tras ? n - cols : cols, base = M.chao + 2 - (tras ? 24 : 0);   // a fileira de trás fica um pouco mais alta
          o.x0 = C.x + C.w / 2 + (col - (nl - 1) / 2) * slot; o.y0 = base - (o.tipo === 'bola' || o.tipo === 'bambole' ? o.r0 : o.h0 / 2) * o.s; o.ang0 = 0; o.apoio0 = null; o.caixa = C.id; o.tras = tras;
        });
      });
      // quem estava guardado e não foi mexido continua bagunçado (está no chão, não na caixa)
    }
    function pegar(k, j, nx, ny) {
      if (fase !== 'jogando' || !arrumando) return false;
      var x = nx * W, y = ny * H, melhor = null, dm = 1e9;
      M.obs.forEach(function (o) { if (o.fora || o.segurado) return; var d = Math.hypot(o.x - x, o.y - y), alcance = Math.max(o.r, Math.min(o.w, o.h) / 2) + 28; if (d > alcance) return; var nota = d + (noLugar(o) ? 60 : 0); if (nota < dm) { dm = nota; melhor = o; } });   // prefere o que está fora do lugar
      if (!melhor) { arrumarAoTocar(j, x, y); segurando[k] = { j: j, varre: true }; return false; }
      var o = melhor; o.segurado = 1; o.dorme = false; o.apoio = null; o.vx = o.vy = o.va = 0; o.guardado = false;
      if (o.aberto) { o.aberto = false; o.w = o.w0; o.h = o.h0; o.r = o.r0; }   // pegou o livro: ele fecha
      segurando[k] = { j: j, o: o, dx: o.x - x, dy: o.y - y, ux: x, uy: y, ut: tempo, vx: 0, vy: 0 };
      M.dica = null; return true;
    }
    function mover(k, nx, ny) {
      var S = segurando[k]; if (!S) return;
      var x = nx * W, y = ny * H;
      if (S.varre) { varrer(S.j, x, y); return; }
      var o = S.o, dtS = Math.max(0.016, (tempo - S.ut) / 1000);
      S.vx = (x - S.ux) / dtS; S.vy = (y - S.uy) / dtS; S.ux = x; S.uy = y; S.ut = tempo;
      o.x = clamp(x + S.dx, 20, W - 20); o.y = clamp(y + S.dy, 20, M.chao - 10); o.ang += (o.ang0 - o.ang) * 0.25;   // vai se endireitando na mão
    }
    function largar(k) {
      var S = segurando[k]; delete segurando[k]; if (!S || !S.o) return;
      var o = S.o; o.segurado = 0;
      if (o.extra) {
        if (dentro(o, CESTO, 30)) { o.fora = 1; M.obs.splice(M.obs.indexOf(o), 1); acertou(S.j, 5, 'guardou', CESTO.x + CESTO.w / 2, CESTO.y, '🧺 Guardou! +5', '🧺 Put away! +5'); return; }
      } else if (Math.hypot(o.x - o.x0, o.y - o.y0) < Math.max(48, o.r * 1.5)) {   // perto do lugar dele: encaixa
        o.x = o.x0; o.y = o.y0; o.ang = o.ang0; o.vx = o.vy = o.va = 0; o.dorme = true; o.parado = 0; o.apoio = o.apoio0 ? { p: o.apoio0.p, o: o.apoio0.o } : { p: -1 }; o.guardado = !!o.caixa;
        if (o.aberto) { o.aberto = false; o.w = o.w0; o.h = o.h0; o.r = o.r0; }
        if (o.tipo === 'rolo' && M.papel) M.papel.pts = [];   // o rolo voltou para o suporte: o papel enrola de novo
        var em = o.apoio0 && o.apoio0.o != null ? porId(o.apoio0.o) : null;
        if (em && !noLugar(em)) emitir({ t: 'casa', j: S.j, som: 'tum', x: o.x, y: o.y - 50, pontos: 0, texto: '⬇️ Comece pelo de baixo!', textoEn: '⬇️ Start from the bottom!' });
        if (o.caixa) acertou(S.j, 10, 'guardou', o.x, o.y - 40, '📦 Guardou! +10', '📦 Put away! +10'); else acertou(S.j, 10, 'arrumou', o.x, o.y, '✓ +10', '✓ +10');
        if (M.dica && M.dica.id === o.id) M.dica = null; return;
      }
      o.vx = clamp(S.vx * 0.3, -600, 600); o.vy = clamp(S.vy * 0.3, -600, 600); o.va = 0;   // longe do lugar: cai onde soltou
    }
    function acertou(j, n, som, x, y, txt, txtEn) { semArrumar = 0; ponto(j, n, som, x, y, { texto: txt, textoEn: txtEn, festa: true }); }
    function varrer(j, x, y) { var antes = M.folhasChao.length; M.folhasChao = M.folhasChao.filter(function (f) { return Math.hypot(f.x - x, f.y - y) > 70; }); var n = antes - M.folhasChao.length; if (n) { semArrumar = 0; ponto(j, n, 'folhas', x, y - 30, n > 2 ? { texto: '🍃 +' + n } : {}); } }
    function arrumarAoTocar(j, x, y) {
      var b = { x: x, y: y };
      var Q = M.quadro; if (Q && Math.abs(Q.repouso) > 0.12 && dentro(b, Q, 20)) { Q.repouso = 0; Q.va = 2; acertou(j, 5, 'quadro', Q.x + Q.w / 2, Q.y + 40, '🖼️ Endireitou! +5', '🖼️ Straight! +5'); return; }
      var Gd = M.geladeira; if (Gd && Gd.alvo > 0.5 && dentro(b, Gd, 0)) { Gd.alvo = 0; acertou(j, 5, 'geladeira', Gd.x + Gd.w / 2, Gd.y + 120, '🧊 Fechou! +5', '🧊 Closed! +5'); return; }
      var To = M.torneira; if (To && To.ligada && Math.hypot(x - To.x, y - To.y) < 55) { To.ligada = false; acertou(j, 5, 'agua', To.x, To.y - 20, '🚰 Fechou! +5', '🚰 Off! +5'); return; }
      var I = M.interruptor; if (I && !M.luz && dentro(b, I, 22)) { M.luz = true; acertou(j, 5, 'interruptor', I.x, I.y, '💡 Acendeu! +5', '💡 Lights on! +5'); return; }
      var Ca = M.castelo; if (Ca && !Ca.inteiro && Math.hypot(x - Ca.x, y - (Ca.y - 50)) < 90) { Ca.inteiro = true; acertou(j, 10, 'areia', Ca.x, Ca.y - 90, '🏰 Reconstruiu! +10', '🏰 Rebuilt! +10'); return; }
      varrer(j, x, y);
    }
    function dica() {
      var fora = M.obs.filter(function (o) { return !o.fora && !o.segurado && (o.extra || baguncado(o)); });
      if (!fora.length) { M.dica = null; return; }
      fora.sort(function (a, b) { return (b.y0 || 0) - (a.y0 || 0); });   // de baixo para cima: a torre se monta pelo pé
      var o = fora[0]; M.dica = { id: o.id, ate: tempo + 6000 };
      emitir({ t: 'casa', j: 0, som: 'espelho', x: o.x, y: o.y - 60, pontos: 0, texto: '💡', festa: false });
    }
    function dicas(v) { dicasOn = !!v; if (dicasOn) dica(); else M.dica = null; }
    function arrumar() {   // depois do 🧸 Bagunça: a mesma bagunça vira arrumação (em todos os cômodos visitados)
      arrumando = true; duracao = 0; fase = 'jogando'; semArrumar = 0; M.tudoArrumado = false; M.fimEm = 0; M.chegou100 = true;
      Object.keys(visitados).forEach(function (k) { visitados[k].tudoArrumado = false; });
      emitir({ t: 'casa', j: 0, som: 'passos', x: W / 2, y: 300, pontos: 0, texto: '🧹 Hora de arrumar!', textoEn: '🧹 Tidy-up time!', fala: ['Hora de arrumar! Arraste cada coisa para o lugar dela.', 'Tidy-up time! Drag each thing back to its place.'] });
    }
    function baguncarSozinho() {   // modo 🧹 direto: a casa já começa bagunçada (sorteio)
      var ev0 = eventos.slice(), pts0 = jogadores.map(function (jg) { return jg.pontos; });
      M.obs.forEach(function (o) { if (rnd() < 0.7) { acordar(o); o.vx = (rnd() - 0.5) * 1000; o.vy = -250 - rnd() * 550; o.va = (rnd() - 0.5) * 10; } });
      if (M.geladeira && rnd() < 0.6) M.geladeira.alvo = 1; if (M.torneira && rnd() < 0.6) M.torneira.ligada = true;
      if (M.quadro) M.quadro.repouso = (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.25); if (M.castelo) M.castelo.inteiro = false; if (M.interruptor && rnd() < 0.4) M.luz = false;
      if (M.arvore) { M.arvore.treme = 0; sacudirArvore(0, M.arvore.copa.x, M.arvore.copa.y, true); }
      for (var i = 0; i < 300; i++) passo(1 / 60);
      M.folhas.forEach(function (f) { M.folhasChao.push({ x: f.x, y: M.chao + 4 - f.cam, rot: f.rot, cor: f.cor }); }); M.folhas = [];
      eventos = ev0; jogadores.forEach(function (jg, i) { jg.pontos = pts0[i]; });   // o sorteio não conta pontos nem faz barulho
    }
    function movimento(j, pontos, ts) {
      if (fase !== 'jogando' || !jogadores[j] || arrumando) return;
      var jg = jogadores[j], r = raia(j);
      var novos = (pontos || []).filter(function (p) { return p[2] >= 35; }).map(function (p) { return { x: r.x + p[0] * r.w, y: r.y + p[1] * r.h, f: p[2], ts: ts, lid: p[4] }; });
      var recentes = jg.rastro.filter(function (p) { return ts - p.ts < 350; });
      novos.forEach(function (p) {
        var ant = null;
        for (var i = recentes.length - 1; i >= 0; i--) { var q = recentes[i]; if (ts - q.ts < 200 && ts > q.ts && (p.lid == null || q.lid === p.lid) && Math.hypot(q.x - p.x, q.y - p.y) < 600) { ant = q; break; } }
        var vx = ant ? (p.x - ant.x) / ((ts - ant.ts) / 1000) : 0, vy = ant ? (p.y - ant.y) / ((ts - ant.ts) / 1000) : 0;
        tocar(j, ant || p, p, vx, vy, ts);
        recentes.push(p);
      });
      jg.rastro = recentes.slice(-24); jg.rastroEm = tempo;
    }
    function tocar(j, a, b, vx, vy, ts) {
      var vel = Math.hypot(vx, vy), forte = vel > 250, pad = 16, seg = function (o, extra) { return distSeg(a, b, o) <= extra; };
      // interruptor: acende e apaga
      var I = M.interruptor; if (I && tempo >= I.ate && (dentro(b, I, 22) || dentro(a, I, 22))) { I.ate = tempo + 600; M.luz = !M.luz; ponto(j, 5, 'interruptor', I.x + I.w / 2, I.y, { texto: M.luz ? '💡 Acendeu!' : '🌙 Apagou!' }); }
      // janela: abre e fecha devagar
      var J = M.janela; if (J && tempo >= J.ate && (dentro(b, J, 0) && (!forte || dentro(a, J, 0)))) { J.ate = tempo + 900; J.alvo = J.alvo > 0.5 ? 0 : 1; ponto(j, 5, 'janela', J.x + J.w / 2, J.y + 20, { texto: J.alvo ? '🪟 Abriu!' : '🪟 Fechou!' }); }
      // lustre
      var L = M.lustre; if (L) { var lx = L.x + Math.sin(L.ang) * L.L, ly = Math.cos(L.ang) * L.L + 10; if (seg({ x: lx, y: ly }, 60) && tempo >= L.ate) { L.ate = tempo + 350; L.va += clamp((vx || (b.x < lx ? 400 : -400)) * 0.0035, -3, 3); M.corLuz = (M.corLuz + 1) % CORES_LUZ.length; ponto(j, 6, 'lustre', lx, ly, { texto: '💡 +6', festa: true }); } }
      // quadro torto
      var Q = M.quadro; if (Q && tempo >= (Q.ate || 0) && dentro(b, Q, 10)) { Q.ate = tempo + 500; Q.va += (vx >= 0 ? 1 : -1) * (3 + Math.min(4, vel / 400)); Q.repouso = clamp(Q.repouso + (vx >= 0 ? 1 : -1) * (0.15 + rnd() * 0.2), -0.6, 0.6); ponto(j, 5, 'quadro', Q.x + Q.w / 2, Q.y + Q.h / 2, { texto: '🖼️ Ficou torto! +5', festa: true }); }
      // cachorro: late e pula
      var C = M.cachorro; if (C && C.late <= 0 && Math.abs(b.x - C.x) < 75 && b.y > M.chao - 130 + C.y) { C.late = 0.8; C.vy = -520; C.y = -1; C.dir = b.x < C.x ? 1 : -1; ponto(j, 3, 'latido', C.x, M.chao - 110, { texto: '🐶 Picolé: AU AU!', textoEn: '🐶 Picolé: WOOF!', festa: true }); }
      // jardim
      if (M.arvore && Math.hypot(b.x - M.arvore.copa.x, b.y - M.arvore.copa.y) < M.arvore.copa.r) sacudirArvore(j, b.x, b.y, true);
      var Bl = M.balanco; if (Bl) { var sx = Bl.x + Math.sin(Bl.ang) * Bl.L, sy = Bl.topo + Math.cos(Bl.ang) * Bl.L; if (seg({ x: sx, y: sy }, 55) && tempo >= (Bl.ate || 0)) { Bl.ate = tempo + 300; Bl.va += clamp((vx || (b.x < sx ? 300 : -300)) * 0.003, -2.4, 2.4); ponto(j, 4, 'balanco', sx, sy, { texto: '🎠 +4' }); } }
      if (M.flores) M.flores.forEach(function (f) { var fx = f.x, fy = M.chao - f.h; if (seg({ x: fx, y: fy }, 34) && tempo >= (f.ate || 0)) { f.ate = tempo + 400; f.va += (vx >= 0 ? 1 : -1) * 6; for (var k = 0; k < 4; k++) M.petalas.push({ x: fx, y: fy, vx: (rnd() - 0.5) * 240, vy: -120 - rnd() * 160, t: 0, cor: f.cor }); ponto(j, 2, 'flor', fx, fy, {}); } });
      if (M.borboletas) M.borboletas.forEach(function (bb) { if (Math.hypot(bb.x - b.x, bb.y - b.y) < 120) { var d = Math.hypot(bb.x - b.x, bb.y - b.y) || 1; bb.vx = (bb.x - b.x) / d * 380; bb.vy = (bb.y - b.y) / d * 380; bb.foge = 0.8; } });
      if (M.passaros) M.passaros.forEach(function (p) { if (p.voando === 0 && p.volta === 0 && Math.hypot(p.x - b.x, p.y - b.y) < 60) { p.voando = 0.001; p.vx = (p.x > b.x ? 1 : -1) * 220; p.vy = -180; ponto(j, 4, 'passaro', p.x, p.y, { texto: '🐦 +4' }); } });
      // aparelhos (TV, piano, torradeira, sapo…)
      M.aparelhos.forEach(function (ap) { var T2 = APAR[ap.tipo]; if (T2.toque && tempo >= ap.ate && T2.acerta(ap, b, a)) T2.toque(ap, j, b, api); });
      // geladeira, torneira, bolhas, gangorra, castelo de areia
      var Gd = M.geladeira; if (Gd && tempo >= Gd.ate && dentro(b, Gd, 0)) { Gd.ate = tempo + 800; Gd.alvo = Gd.alvo > 0.5 ? 0 : 1; ponto(j, 5, 'geladeira', Gd.x + Gd.w / 2, Gd.y + 120, { texto: Gd.alvo ? '🧊 Abriu a geladeira!' : '🧊 Fechou!', textoEn: Gd.alvo ? '🧊 Fridge open!' : '🧊 Closed!', festa: true }); }
      var To = M.torneira; if (To && tempo >= To.ate && Math.hypot(b.x - To.x, b.y - To.y) < 50) { To.ate = tempo + 700; To.ligada = !To.ligada; ponto(j, 5, 'agua', To.x, To.y - 20, { texto: To.ligada ? '🚰 Água!' : '🚰 Fechou!', textoEn: To.ligada ? '🚰 Water!' : '🚰 Off!' }); }
      var Bn = M.banheira; if (Bn) {
        Bn.bolhas.forEach(function (bo) { if (!bo.estourou && Math.hypot(bo.x - b.x, bo.y - b.y) < bo.r + 14) { bo.estourou = true; bo.vida = 0; ponto(j, 1, 'pop', bo.x, bo.y, {}); } });
        if (tempo >= Bn.ate && b.x > Bn.x1 && b.x < Bn.x2 && b.y > Bn.topo - 40 && b.y < Bn.topo + 120) { Bn.ate = tempo + 300; for (var nb = 0; nb < 6; nb++) Bn.bolhas.push({ x: clamp(b.x + (rnd() - 0.5) * 120, Bn.x1 + 30, Bn.x2 - 30), y: Bn.topo, r: 12 + rnd() * 18, vy: 50 + rnd() * 70, t: 0, vida: 4 + rnd() * 3, f: rnd() * 6 }); ponto(j, 3, 'bolhas', b.x, Bn.topo - 30, { texto: '🫧 +3' }); }
      }
      var Gg = M.gangorra; if (Gg && tempo >= Gg.ate) { var ex = Math.cos(Gg.ang) * Gg.L; if (Math.abs(b.y - (Gg.y - 30)) < 90 && Math.abs(b.x - Gg.x) < Gg.L + 30 && Math.abs(b.x - Gg.x) > 40) { Gg.ate = tempo + 350; Gg.va += b.x > Gg.x ? 4 : -4; ponto(j, 4, 'gangorra', b.x, Gg.y - 60, { texto: '⚖️ +4' }); } void ex; }
      var Ca = M.castelo; if (Ca && Ca.inteiro && Math.hypot(b.x - Ca.x, b.y - (Ca.y - 50)) < 80) { Ca.inteiro = false; for (var na = 0; na < 16; na++) M.petalas.push({ x: Ca.x + (rnd() - 0.5) * 90, y: Ca.y - 40 - rnd() * 50, vx: (rnd() - 0.5) * 300, vy: -100 - rnd() * 250, t: 0, cor: rnd() < 0.5 ? '#e6c27a' : '#d4a85a' }); ponto(j, 10, 'areia', Ca.x, Ca.y - 90, { texto: '🏰 Desmoronou! +10', textoEn: '🏰 Crumbled! +10', festa: true }); }
      // gato, papagaio e tartaruga
      var Gt = M.gato; if (Gt && Gt.miau <= 0 && !Gt.salto && Math.hypot(b.x - Gt.x, b.y - (Gt.y - 25)) < 60) { Gt.miau = 0.9; ponto(j, 4, 'miau', Gt.x, Gt.y - 70, { texto: '🐱 MIAU!', textoEn: '🐱 MEOW!', festa: true }); pularGato(false); }
      var Pa = M.papagaio; if (Pa && Pa.voa === 0 && Math.hypot(b.x - Pa.x, b.y - Pa.y) < 60) { Pa.voa = 0.001; ponto(j, 4, 'papagaio', Pa.x, Pa.y - 50, { festa: true }); falar(j, Pa.x, Pa.y - 50); }
      var Tt = M.tartaruga; if (Tt && Tt.esconde <= 0 && tempo >= Tt.ate && Math.abs(b.x - Tt.x) < 55 && b.y > M.chao - 70) { Tt.esconde = 3; Tt.ate = tempo + 3500; ponto(j, 3, 'casco', Tt.x, M.chao - 60, { texto: '🐢 Escondeu!', textoEn: '🐢 Hid!', festa: true }); }
      // as coisas
      M.obs.forEach(function (o) {
        if (o.fora) return;
        var hit = seg(o, o.r + pad); if (!hit) return;
        if (ts - (o.toque[j] || 0) < 220) return;
        o.toque[j] = ts; o.ult = j;
        var antes = baguncado(o);
        acordar(o);
        if (forte) { o.vx += clamp(vx * 0.55, -1500, 1500); o.vy += clamp(vy * 0.55, -1500, 1500) - 220; o.va += (vx >= 0 ? 1 : -1) * (4 + rnd() * 6); }
        else { o.vy = -360 - rnd() * 240; o.vx += (o.x - b.x) * 5 + (rnd() - 0.5) * 120; o.va += (rnd() - 0.5) * 8; }
        if (o.tipo === 'piao') o.gira = 4;
        if (o.aberto) { o.vy = -260; }   // livro aberto: pula e folheia
        var som = { bola: 'boing', pato: 'pato', carrinho: 'vrum', bloco: 'bloco', livro: 'tum', almofada: 'fofo', ursinho: 'fofo', piao: 'piao', robo: 'robo', vaso: 'tum', maca: 'boing', balde: 'tum', regador: 'tum', gnomo: 'tum', panela: 'panela', tampa: 'panela', pote: 'pote', caneca: 'pote', laranja: 'boing', banana: 'fofo', colher: 'pote', tigela: 'pote', frasco: 'pote', escova: 'pote', copo: 'pote', sabonete: 'fofo', toalha: 'fofo', rolo: 'papel', meia: 'fofo', pa: 'pote', cone: 'pote', bambole: 'boing' }[o.tipo] || 'tum';
        ponto(j, 2, som, o.x, o.y, { festa: true, silencioso: false });
        if (!antes) { jogadores[j].pontos += 8; emitir({ t: 'casa', j: j, som: '', x: o.x, y: o.y - 40, pontos: 8, texto: '+10' }); }
      });
    }

    function avancar(dtMs) {
      if (fase !== 'jogando') return;
      var dt = Math.min(dtMs, 50) / 1000; tempo += dtMs;
      // dois passos por quadro: a física fica estável mesmo no celular lento
      if (arrumando && !M.organizado) organizar();   // primeira vez neste cômodo arrumando: monta as caixas
      passo(dt / 2); passo(dt / 2);
      var pct = bagunca();
      if (arrumando) {
        semArrumar += dtMs; if (dicasOn && semArrumar > 5000) { semArrumar = 0; dica(); }   // dicas ligadas: muito tempo sem acertar, a dica aparece sozinha
        if (pct <= 0 && !M.tudoArrumado) {
          M.tudoArrumado = true; jogadores.forEach(function (jg) { jg.pontos += 50; });
          var falta = Object.keys(visitados).filter(function (k) { return visitados[k] !== M && bagunca(visitados[k]) > 0; });
          if (falta.length) { var n = NOMES[falta[0]]; emitir({ t: 'casa', j: 0, som: 'fim', x: W / 2, y: 300, pontos: 50, texto: '✨ Cômodo arrumado! Agora: ' + n[0], textoEn: '✨ Room done! Next: ' + n[1], festa: true, fala: ['Muito bem! Agora falta ' + n[0].replace(/^\S+ /, ''), 'Well done! Now the ' + n[1].replace(/^\S+ /, '')] }); }
          else { emitir({ t: 'arrumado' }); M.fimEm = tempo + 3500; }
        }
        if (M.fimEm && tempo >= M.fimEm) terminar();
      }
      if (!arrumando && pct >= 1 && !M.chegou100) { M.chegou100 = true; jogadores.forEach(function (jg) { jg.pontos += 100; }); emitir({ t: 'bagunca100' }); }
      ultimaPct = pct;
      if (duracao && !arrumando && !M.mae && duracao * 1000 - tempo <= 6000) { M.mae = { desde: tempo }; emitir({ t: 'casa', j: 0, som: 'passos', x: W - 260, y: 260, pontos: 0, texto: '🚶‍♀️ A mamãe está chegando! Rápido!', textoEn: '🚶‍♀️ Mom is coming! Hurry!', fala: ['A mamãe está chegando! Rápido!', 'Mom is coming! Hurry!'] }); }
      if (M.mae) M.mae.k = Math.min(1, (tempo - M.mae.desde) / 5000);
      if (duracao && tempo >= duracao * 1000) terminar();
    }
    function comecar() { fase = 'jogando'; tempo = 0; if (arrumando && !M.baguncou) { M.baguncou = true; baguncarSozinho(); } }
    function pausar() { if (fase === 'jogando') fase = 'pausa'; }
    function continuar() { if (fase === 'pausa') fase = 'jogando'; }
    function terminar() {
      if (fase === 'fim') return; fase = 'fim';
      var ordem = jogadores.map(function (jg, i) { return { j: i, pontos: Math.round(jg.pontos) }; }).sort(function (a, b) { return b.pontos - a.pontos; });
      if (M.mae) { M.mae.k = 1; M.mae.viu = true; emitir({ t: 'casa', j: 0, som: 'mamae', x: W - 260, y: 240, pontos: 0, texto: '😱 Que bagunça é essa?!', textoEn: '😱 What is this mess?!', fala: ['Que bagunça é essa?!', 'What is this mess?!'] }); }
      emitir({ t: 'fim', ordem: ordem });
    }
    /* corpo (câmera) e dedo: só para o boneco andar; esqueleto: pulsos e tornozelos viram toques */
    function corpo(j, caixa, ts) { var jg = jogadores[j]; if (!jg || !caixa || !caixa.w) return; var ref = jg.ref || caixa, c = jg.corpo; c.x = clamp(caixa.x + caixa.w / 2, 0, 1); c.topo = caixa.y; c.altura = caixa.h; c.ts = ts || 0; c.pulando = caixa.y < ref.y - ref.h * 0.12 && caixa.h > ref.h * 0.6; c.abaixado = !c.pulando && caixa.h < ref.h * 0.7; }
    function calibrar(j, caixa) { if (jogadores[j] && caixa) { jogadores[j].ref = caixa; jogadores[j].corpo.x = caixa.x + caixa.w / 2; } }
    function esqueleto(j, k, ts) {
      var jg = jogadores[j]; if (!jg || !k || k.length !== 13) return;
      var ant = jg.esqAnt, pts = [];
      if (ant && ts - ant.ts > 0 && ts - ant.ts < 400) [5, 6, 11, 12].forEach(function (i) { var a = ant.k[i], b = k[i]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.012) pts.push([clamp(b[0], 0, 1), clamp(b[1], 0, 1), 100, i >= 11 ? 1 : 0, i]); });
      jg.esqAnt = { k: k, ts: ts };
      if (pts.length) movimento(j, pts, ts);
      var xs = k.map(function (q) { return q[0]; }), topo = k[0][1] - 0.08, base = Math.max(k[11][1], k[12][1]) + 0.04;
      corpo(j, { x: Math.min.apply(null, xs), y: topo, w: Math.max.apply(null, xs) - Math.min.apply(null, xs), h: base - topo }, ts);
    }
    function estado() {
      return {
        fase: fase, modo: arrumando ? 'arrumar' : 'bagunca', modoBase: arrumando ? 'arrumar' : 'bagunca', arrumando: arrumando, tempo: tempo, restante: duracao ? Math.max(0, Math.ceil((duracao * 1000 - tempo) / 1000)) : null,
        jogadores: jogadores.map(function (jg, j) { return { pontos: Math.round(jg.pontos), vidas: jg.vidas, combo: 0, poder: null, poderAte: 0, lento: false, raia: raia(j), zonaChute: 0.6, rastro: tempo - (jg.rastroEm || 0) < 400 ? jg.rastro.slice(-8) : [], corpo: jg.corpo, invencivel: false, esqueleto: null }; }),
        coisas: [], trave: null, bpm: 0, casa: (M.arrumando = arrumando, M.cesto = arrumando ? CESTO : null, M.tempo = tempo, M.dicas = dicasOn, M), bagunca: ultimaPct
      };
    }
    return {
      comecar: comecar, pausar: pausar, continuar: continuar, terminar: terminar, avancar: avancar, movimento: movimento, esqueleto: esqueleto, corpo: corpo, calibrar: calibrar, estado: estado,
      batida: function () {}, zonaChute: function () {}, lancar: function () { return null; }, obstaculo: function () { return null; },
      eventos: function () { var e = eventos; eventos = []; return e; },
      irPara: irPara, vizinhos: vizinhos, pegar: pegar, mover: mover, largar: largar, dica: dica, dicas: dicas, arrumar: arrumar, get cena() { return cena; }, W: W, H: H
    };
  }

  /* ================= desenho ================= */
  var fundos = {};   // o cenário parado (paredes, móveis) é pintado uma vez por lugar e reaproveitado
  function arred(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function escurecer(hex, f) { var m = /^#([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex; var n = parseInt(m[1], 16); return 'rgb(' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return Math.round(v * f); }).join(',') + ')'; }
  function fundo(M) {
    if (fundos[M.cena]) return fundos[M.cena];
    if (typeof document === 'undefined') return null;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var ctx = cv.getContext('2d');
    if (M.parque) {
      var gq = ctx.createLinearGradient(0, 0, 0, 520); gq.addColorStop(0, '#81d4fa'); gq.addColorStop(1, '#e1f5fe'); ctx.fillStyle = gq; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(1120, 90, 50, 0, PI2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; [[380, 80], [760, 120]].forEach(function (n) { [0, 40, 80].forEach(function (dx, i) { ctx.beginPath(); ctx.arc(n[0] + dx, n[1] - (i === 1 ? 15 : 0), 32, 0, PI2); ctx.fill(); }); });
      ctx.fillStyle = '#81c784'; [[80, 470, 90], [520, 480, 110], [880, 470, 100], [1230, 480, 90]].forEach(function (a) { ctx.beginPath(); ctx.arc(a[0], a[1], a[2], 0, PI2); ctx.fill(); });   // arbustos lá atrás
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 4; for (var cx = 0; cx < W; cx += 24) { ctx.beginPath(); ctx.moveTo(cx, 560); ctx.lineTo(cx, 470); ctx.stroke(); } ctx.fillStyle = '#8d6e63'; ctx.fillRect(0, 480, W, 6); ctx.fillRect(0, 520, W, 6);   // grade
      var gg2 = ctx.createLinearGradient(0, 540, 0, H); gg2.addColorStop(0, '#8bd36a'); gg2.addColorStop(1, '#55a63c'); ctx.fillStyle = gg2; ctx.fillRect(0, 540, W, H - 540);
      // caixa de areia
      ctx.fillStyle = '#f0d290'; ctx.fillRect(880, 600, 370, 70); ctx.fillStyle = '#a1662f'; ctx.fillRect(872, 590, 386, 14); ctx.fillRect(872, 666, 386, 14);
      ctx.fillStyle = 'rgba(160,110,40,.25)'; for (var sa = 0; sa < 40; sa++) { ctx.beginPath(); ctx.arc(890 + (sa * 61) % 350, 612 + (sa * 37) % 50, 2, 0, PI2); ctx.fill(); }
      // escorregador: escada, plataforma com telhadinho e a rampa
      var E = M.escorregador; ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(E.x1, 652); ctx.lineTo(E.x1, E.topo - 70); ctx.moveTo(E.x2, 652); ctx.lineTo(E.x2, E.topo - 70); ctx.stroke();
      ctx.lineWidth = 5; for (var de = E.topo + 40; de < 650; de += 44) { ctx.beginPath(); ctx.moveTo(E.x1, de); ctx.lineTo(E.x1 + 30, de); ctx.stroke(); }
      ctx.fillStyle = '#ffd166'; ctx.fillRect(E.x1 - 8, E.topo, E.x2 - E.x1 + 16, 12);
      ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.moveTo(E.x1 - 22, E.topo - 70); ctx.lineTo((E.x1 + E.x2) / 2, E.topo - 120); ctx.lineTo(E.x2 + 22, E.topo - 70); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(E.x2, E.topo + 6); ctx.lineTo(E.base.x, E.base.y + 4); ctx.stroke();
      ctx.strokeStyle = '#ffcc80'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(E.x2, E.topo - 6); ctx.lineTo(E.base.x, E.base.y - 8); ctx.stroke();
      ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(E.base.x - 10, E.base.y); ctx.lineTo(E.base.x - 10, 652); ctx.stroke();
      // apoio da gangorra
      var Gg = M.gangorra; ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.moveTo(Gg.x - 30, 652); ctx.lineTo(Gg.x, Gg.y); ctx.lineTo(Gg.x + 30, 652); ctx.closePath(); ctx.fill();
    } else if (M.jardim) {
      var g = ctx.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, '#6ec6ff'); g.addColorStop(1, '#d4f1ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff59d'; ctx.beginPath(); ctx.arc(150, 95, 55, 0, PI2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; [[420, 90], [700, 60], [560, 140]].forEach(function (n) { [0, 40, 80].forEach(function (dx, i) { ctx.beginPath(); ctx.arc(n[0] + dx, n[1] - (i === 1 ? 15 : 0), 34, 0, PI2); ctx.fill(); }); });
      // cerca
      ctx.fillStyle = '#fff8e1'; ctx.strokeStyle = '#d7ccc8'; ctx.lineWidth = 2;
      for (var x = 0; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x + 4, 560); ctx.lineTo(x + 4, 450); ctx.lineTo(x + 20, 432); ctx.lineTo(x + 36, 450); ctx.lineTo(x + 36, 560); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillRect(0, 470, W, 14); ctx.fillRect(0, 525, W, 14);
      var gg = ctx.createLinearGradient(0, 540, 0, H); gg.addColorStop(0, '#7cc954'); gg.addColorStop(1, '#4e9a36'); ctx.fillStyle = gg; ctx.fillRect(0, 540, W, H - 540);
      ctx.strokeStyle = 'rgba(40,110,30,.5)'; ctx.lineWidth = 2; for (var t = 0; t < 140; t++) { var tx = (t * 97) % W, ty = 560 + (t * 53) % 150; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 4, ty - 10); ctx.stroke(); }
      // toalha de piquenique
      ctx.fillStyle = '#ffffff'; arred(ctx, 740, 640, 140, 22, 6); ctx.fill(); ctx.fillStyle = '#ef5350'; for (var q = 0; q < 7; q++) { ctx.fillRect(744 + q * 20, 642, 10, 18); }
      // casinha do cachorro
      ctx.fillStyle = '#ef6c00'; ctx.fillRect(1150, 560, 110, 90); ctx.fillStyle = '#bf360c'; ctx.beginPath(); ctx.moveTo(1140, 565); ctx.lineTo(1205, 505); ctx.lineTo(1270, 565); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3e2723'; arred(ctx, 1180, 592, 50, 58, 22); ctx.fill();
      // tronco da árvore e o balanço (estrutura)
      ctx.fillStyle = '#795548'; ctx.beginPath(); ctx.moveTo(1030, 652); ctx.lineTo(1040, 330); ctx.lineTo(1080, 330); ctx.lineTo(1094, 652); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(190, 652); ctx.lineTo(240, 170); ctx.lineTo(400, 170); ctx.lineTo(450, 652); ctx.stroke();
    } else {
      ctx.fillStyle = M.parede; ctx.fillRect(0, 0, W, 570);
      ctx.fillStyle = M.parede2; for (var lx = 0; lx < W; lx += 64) ctx.fillRect(lx, 0, 22, 570);   // listras do papel de parede
      var gp = ctx.createLinearGradient(0, 570, 0, H); gp.addColorStop(0, M.piso); gp.addColorStop(1, escurecer(M.piso, 0.7)); ctx.fillStyle = gp; ctx.fillRect(0, 570, W, H - 570);
      if (M.xadrez) { ctx.fillStyle = 'rgba(183,28,28,.55)'; for (var xr = 0; xr < 4; xr++) for (var xc = 0; xc < 26; xc++) if ((xr + xc) % 2) ctx.fillRect(xc * 50 - 10 + xr * 6, 572 + xr * 37, 50, 37); }
      if (M.azulejo) { ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; for (var az = 0; az < W; az += 60) { ctx.beginPath(); ctx.moveTo(az, 0); ctx.lineTo(az, 556); ctx.stroke(); } for (var ay = 0; ay < 556; ay += 60) { ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.stroke(); } }
      ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2; for (var k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(k * 140 - 40, H); ctx.lineTo(k * 140 + 60, 570); ctx.stroke(); }
      ctx.fillStyle = M.rodape; ctx.fillRect(0, 556, W, 16);
      // tapete
      ctx.fillStyle = M.cena === 'sala' ? 'rgba(142,91,255,.55)' : 'rgba(255,79,163,.45)'; ctx.beginPath(); ctx.ellipse(M.cena === 'sala' ? 640 : 760, 668, 300, 40, 0, 0, PI2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(M.cena === 'sala' ? 640 : 760, 668, 270, 30, 0, 0, PI2); ctx.stroke();
      // fio do lustre e o forro
      ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(0, 0, W, 12);
      if (M.sofa) {
        var s = M.sofa; ctx.fillStyle = '#5c6bc0'; arred(ctx, s.x1, 420, s.x2 - s.x1, 140, 26); ctx.fill();
        ctx.fillStyle = '#7986cb'; arred(ctx, s.x1 + 10, s.assento - 4, s.x2 - s.x1 - 20, 60, 16); ctx.fill();
        ctx.fillStyle = '#3f51b5'; arred(ctx, s.x1 - 20, 470, 46, 110, 18); ctx.fill(); arred(ctx, s.x2 - 26, 470, 46, 110, 18); ctx.fill();
        ctx.fillStyle = '#3e2723'; ctx.fillRect(s.x1 + 20, 600, 14, 30); ctx.fillRect(s.x2 - 34, 600, 14, 30);
      }
      if (M.estante) {
        var e = M.estante; ctx.fillStyle = '#8d5634'; ctx.fillRect(e.x1 - 8, e.topo, e.x2 - e.x1 + 16, 570 - e.topo); ctx.fillStyle = '#5d3a1f'; ctx.fillRect(e.x1, e.topo + 12, e.x2 - e.x1, 570 - e.topo - 24);
        ctx.fillStyle = '#a66b40'; e.tabuas.forEach(function (y) { ctx.fillRect(e.x1 - 8, y, e.x2 - e.x1 + 16, 12); }); ctx.fillRect(e.x1 - 12, e.topo - 6, e.x2 - e.x1 + 24, 14);
      }
      if (M.cama) {
        var c = M.cama; ctx.fillStyle = '#8d6e63'; arred(ctx, c.x1 - 10, 300, 40, 300, 12); ctx.fill();   // cabeceira
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(c.x1, 520, c.x2 - c.x1, 80); ctx.fillStyle = '#fff'; arred(ctx, c.x1 + 6, c.topo, c.x2 - c.x1 - 12, 56, 14); ctx.fill();
        ctx.fillStyle = '#90caf9'; arred(ctx, c.x1 + 150, c.topo + 6, c.x2 - c.x1 - 160, 70, 14); ctx.fill(); ctx.fillStyle = '#64b5f6'; for (var d = 0; d < 6; d++) { ctx.beginPath(); ctx.arc(c.x1 + 180 + d * 45, c.topo + 40, 8, 0, PI2); ctx.fill(); }
      }
      if (M.prateleira) { var p = M.prateleira; ctx.fillStyle = '#a66b40'; p.tabuas.forEach(function (y) { ctx.fillRect(p.x1 - 6, y, p.x2 - p.x1 + 12, 12); ctx.fillStyle = '#6d4c41'; ctx.fillRect(p.x1 + 10, y + 12, 8, 20); ctx.fillRect(p.x2 - 18, y + 12, 8, 20); ctx.fillStyle = '#a66b40'; }); }
      if (M.bau) { var b = M.bau; ctx.fillStyle = '#ffb74d'; arred(ctx, b.x1, b.topo, b.x2 - b.x1, H - 60 - b.topo, 10); ctx.fill(); ctx.fillStyle = '#ff9800'; ctx.fillRect(b.x1, b.topo + 30, b.x2 - b.x1, 14); ctx.fillStyle = '#fff'; ctx.font = '700 30px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🧸', (b.x1 + b.x2) / 2, b.topo + 80); }
      if (M.bancada) {   // cozinha: azulejos atrás da pia, bancada com armários e a cuba
        var bk = M.bancada; ctx.fillStyle = '#ffffff'; ctx.fillRect(bk.x1, 330, bk.x2 - bk.x1, 140); ctx.strokeStyle = 'rgba(0,150,200,.25)'; ctx.lineWidth = 2; for (var tx2 = bk.x1; tx2 < bk.x2; tx2 += 30) { ctx.beginPath(); ctx.moveTo(tx2, 330); ctx.lineTo(tx2, 470); ctx.stroke(); } for (var ty2 = 330; ty2 < 470; ty2 += 30) { ctx.beginPath(); ctx.moveTo(bk.x1, ty2); ctx.lineTo(bk.x2, ty2); ctx.stroke(); }
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(bk.x1 - 6, bk.topo, bk.x2 - bk.x1 + 12, 16); ctx.fillStyle = '#ffcc80'; ctx.fillRect(bk.x1, bk.topo + 16, bk.x2 - bk.x1, 640 - bk.topo - 16);
        ctx.strokeStyle = '#e0a060'; ctx.lineWidth = 3; for (var pd = bk.x1 + 10; pd < bk.x2 - 60; pd += 96) { ctx.strokeRect(pd, bk.topo + 30, 86, 150); ctx.fillStyle = '#6d4c41'; ctx.fillRect(pd + 70, bk.topo + 90, 6, 26); }
        ctx.fillStyle = '#90a4ae'; arred(ctx, 700, bk.topo + 2, 120, 14, 6); ctx.fill();   // cuba
        var am = M.armario; ctx.fillStyle = '#a66b40'; am.tabuas.forEach(function (y) { ctx.fillRect(am.x1 - 6, y, am.x2 - am.x1 + 12, 12); ctx.fillStyle = '#6d4c41'; ctx.fillRect(am.x1 + 14, y + 12, 8, 20); ctx.fillRect(am.x2 - 22, y + 12, 8, 20); ctx.fillStyle = '#a66b40'; });
      }
      if (M.banheira) {   // banheiro: banheira, pia com espelho, toalheiro, papel, cesto e tapete
        var bn = M.banheira; ctx.fillStyle = '#ffffff'; arred(ctx, bn.x1, bn.topo - 6, bn.x2 - bn.x1, 168, 40); ctx.fill(); ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#ffd166'; [bn.x1 + 40, bn.x2 - 60].forEach(function (x) { ctx.beginPath(); ctx.ellipse(x, 652, 14, 10, 0, 0, PI2); ctx.fill(); });
        ctx.fillStyle = '#b0bec5'; ctx.fillRect(bn.x1 + 20, bn.topo - 120, 10, 115); ctx.beginPath(); ctx.arc(bn.x1 + 46, bn.topo - 120, 20, Math.PI, 0); ctx.fill();   // chuveirinho
        var es = M.espelho; ctx.fillStyle = '#90a4ae'; arred(ctx, es.x - 8, es.y - 8, es.w + 16, es.h + 16, 18); ctx.fill(); var ge = ctx.createLinearGradient(es.x, es.y, es.x + es.w, es.y + es.h); ge.addColorStop(0, '#e1f5fe'); ge.addColorStop(1, '#b3e5fc'); ctx.fillStyle = ge; arred(ctx, es.x, es.y, es.w, es.h, 12); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(es.x + 30, es.y + 40); ctx.lineTo(es.x + 70, es.y + 10); ctx.moveTo(es.x + 30, es.y + 80); ctx.lineTo(es.x + 100, es.y + 20); ctx.stroke();
        ctx.fillStyle = '#ffffff'; arred(ctx, 680, 466, 160, 30, 10); ctx.fill(); ctx.fillRect(735, 496, 50, 150); ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.strokeRect(735, 496, 50, 150);
        ctx.fillStyle = '#9e9e9e'; ctx.fillRect(890, 296, 230, 8); ctx.fillRect(1165, 376, 60, 6);   // toalheiro e suporte do papel
        ctx.fillStyle = '#d7a86e'; arred(ctx, 870, 580, 90, 72, 8); ctx.fill(); ctx.strokeStyle = '#a1742f'; for (var cs = 0; cs < 4; cs++) { ctx.beginPath(); ctx.moveTo(870, 592 + cs * 16); ctx.lineTo(960, 592 + cs * 16); ctx.stroke(); }
        ctx.fillStyle = 'rgba(128,216,255,.6)'; arred(ctx, 560, 640, 260, 28, 14); ctx.fill();
      }
      // porta (de onde a bola volta) só como enfeite na sala
      if (M.cena === 'sala') { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(1218, 300, 44, 256); }
    }
    fundos[M.cena] = cv; return cv;
  }
  function desenhar(ctx, M, ts, leve) {
    if (M.trocou) { M.trocouTs = ts; M.dirTroca = M.trocou; M.trocou = 0; }
    var f = fundo(M); if (f) ctx.drawImage(f, 0, 0, W, H);
    if (M.janela) janela(ctx, M, ts);
    if (M.quadro) quadro(ctx, M.quadro);
    if (M.interruptor) interruptor(ctx, M.interruptor, M.luz);
    M.aparelhos.forEach(function (a) { if (!APAR[a.tipo].frente) APAR[a.tipo].desenho(ctx, a, ts, M); });
    if (M.arvore) arvore(ctx, M, ts);
    if (M.balanco) balanco(ctx, M.balanco);
    if (M.flores) M.flores.forEach(function (fl) { flor(ctx, fl, M.chao); });
    M.folhasChao.forEach(function (fo) { folha(ctx, fo.x, fo.y, fo.rot, fo.cor); });
    if (M.caixas) M.caixas.forEach(function (C) { caixa(ctx, C, false); });
    M.obs.forEach(function (o) { if (o.fora === 1 || o.segurado) return; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.ang); if (o.fora) { var e = 1 - o.fora; ctx.scale(e, e); } if (o.guardado && o.s) ctx.scale(o.s, o.s); coisa(ctx, o, ts); ctx.restore(); });
    if (M.caixas) M.caixas.forEach(function (C) { caixa(ctx, C, true); });
    if (M.geladeira) geladeira(ctx, M.geladeira, ts);
    if (M.torneira) torneira(ctx, M.torneira, ts);
    if (M.banheira) agua(ctx, M.banheira, ts);
    if (M.papel && M.papel.pts.length) papel(ctx, M.papel);
    if (M.gangorra) gangorra(ctx, M.gangorra);
    if (M.castelo) castelo(ctx, M.castelo);
    M.aparelhos.forEach(function (a) { if (APAR[a.tipo].frente) APAR[a.tipo].desenho(ctx, a, ts, M); });
    if (M.tartaruga) tartaruga(ctx, M.tartaruga, M.chao, ts);
    if (M.gato) gato(ctx, M.gato, ts);
    if (M.cachorro) cachorro(ctx, M, ts);
    if (M.papagaio) papagaio(ctx, M.papagaio, ts, M.jardim);
    if (M.mae) mae(ctx, M, ts);
    M.folhas.forEach(function (fo) { folha(ctx, fo.x, fo.y, fo.rot, fo.cor); });
    M.petalas.forEach(function (p) { ctx.fillStyle = p.cor; ctx.globalAlpha = Math.max(0, 1 - p.t / 1.4); ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 4, p.t * 4, 0, PI2); ctx.fill(); ctx.globalAlpha = 1; });
    if (M.passaros) M.passaros.forEach(function (p) { passaro(ctx, p, ts); });
    if (M.borboletas) M.borboletas.forEach(function (b) { borboleta(ctx, b, ts); });
    if (M.lustre) lustre(ctx, M, ts, leve);
    var kt = M.trocouTs ? (ts - M.trocouTs) / 380 : 1; if (kt < 1) { ctx.save(); ctx.fillStyle = 'rgba(11,10,31,' + (1 - kt) + ')'; var lx2 = M.dirTroca > 0 ? -W * kt : W * kt; ctx.fillRect(lx2, 0, W, H); ctx.restore(); }   // passou pela porta
  }
  /* escuro do quarto apagado (a janela e o lustre aceso ficam claros); por cima de tudo, menos do placar */
  function luz(ctx, M, ts) {
    if (M.jardim) return;
    var cor = CORES_LUZ[M.corLuz];
    if (!M.luz) {
      ctx.save(); ctx.fillStyle = 'rgba(8,10,40,.62)'; ctx.fillRect(0, 0, W, H);
      if (M.estrelas) { var mb = M.aparelhos.filter(function (a) { return a.tipo === 'mobile'; })[0], gi = mb ? mb.ang * 20 : 0; ctx.fillStyle = 'rgba(255,241,118,.85)'; for (var se = 0; se < 26; se++) { var sx = ((se * 197 + gi) % W + W) % W, sy = 40 + (se * 89) % 480; ctx.beginPath(); for (var pk = 0; pk < 10; pk++) { var ag = -Math.PI / 2 + pk * Math.PI / 5, rr = pk % 2 ? 3 : 8; ctx.lineTo(sx + Math.cos(ag) * rr, sy + Math.sin(ag) * rr); } ctx.fill(); } }   // luminária do móbile: estrelas na parede no escuro
      if (M.janela) { var J = M.janela, g = ctx.createRadialGradient(J.x + J.w / 2, J.y + J.h / 2, 20, J.x + J.w / 2, J.y + J.h, 420); g.addColorStop(0, 'rgba(180,200,255,.25)'); g.addColorStop(1, 'rgba(180,200,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      ctx.restore(); return;
    }
    // luz acesa: o lustre ilumina (e muda de cor quando leva uma bolada); o cone balança junto
    var L = M.lustre; if (!L) return;
    var lx = L.x + Math.sin(L.ang) * L.L, ly = Math.cos(L.ang) * L.L + 20;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var gr = ctx.createRadialGradient(lx, ly, 10, lx + Math.sin(L.ang) * 200, H, 620); gr.addColorStop(0, hexA(cor, 0.16)); gr.addColorStop(1, hexA(cor, 0)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    if (M.corLuz) { ctx.save(); ctx.fillStyle = hexA(cor, 0.12); ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
  function hexA(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  function janela(ctx, M, ts) {
    var J = M.janela, noite = !M.luz;
    ctx.save();
    // lá fora: céu, sol ou lua, árvore
    var g = ctx.createLinearGradient(0, J.y, 0, J.y + J.h); g.addColorStop(0, noite ? '#1a237e' : '#64b5f6'); g.addColorStop(1, noite ? '#3949ab' : '#c8e6ff'); ctx.fillStyle = g; ctx.fillRect(J.x, J.y, J.w, J.h);
    ctx.fillStyle = noite ? '#fffde7' : '#fff59d'; ctx.beginPath(); ctx.arc(J.x + J.w * 0.72, J.y + J.h * 0.28, 24, 0, PI2); ctx.fill();
    ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(J.x + J.w * 0.25, J.y + J.h * 0.8, 60, 0, PI2); ctx.fill(); ctx.fillStyle = '#8bc34a'; ctx.fillRect(J.x, J.y + J.h * 0.85, J.w, J.h * 0.15);
    // as duas folhas da janela abrindo para fora (encolhem como se girassem nas dobradiças)
    var a = J.abre, meio = J.w / 2, larg = meio * Math.max(0.08, Math.cos(a * 1.35));
    [[J.x, 1], [J.x + J.w, -1]].forEach(function (lado) {
      var x0 = lado[0], s = lado[1];
      ctx.fillStyle = 'rgba(200,235,255,' + (0.35 - a * 0.15) + ')'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(x0, J.y); ctx.lineTo(x0 + s * larg, J.y - a * 10); ctx.lineTo(x0 + s * larg, J.y + J.h + a * 10); ctx.lineTo(x0, J.y + J.h); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 + s * larg / 2, J.y - a * 5); ctx.lineTo(x0 + s * larg / 2, J.y + J.h + a * 5); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + s * larg * 0.2, J.y + 20); ctx.lineTo(x0 + s * larg * 0.45, J.y + 50); ctx.stroke();
    });
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 10; ctx.strokeRect(J.x - 5, J.y - 5, J.w + 10, J.h + 10);
    // cortinas (balançam com o vento quando a janela está aberta)
    var vento = a * Math.sin(ts / 260) * 14;
    ctx.fillStyle = M.cena === 'sala' ? '#ef5350' : '#ab47bc';
    [[J.x - 34, -1], [J.x + J.w + 34, 1]].forEach(function (c) { ctx.beginPath(); ctx.moveTo(c[0] - 26, J.y - 22); ctx.lineTo(c[0] + 26, J.y - 22); ctx.quadraticCurveTo(c[0] + 18 + vento, J.y + J.h * 0.6, c[0] + 30 + vento * 1.6, J.y + J.h + 40); ctx.lineTo(c[0] - 30 + vento * 1.6, J.y + J.h + 40); ctx.quadraticCurveTo(c[0] - 18 + vento, J.y + J.h * 0.6, c[0] - 26, J.y - 22); ctx.fill(); });
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(J.x - 70, J.y - 30, J.w + 140, 10);
    ctx.restore();
  }
  function quadro(ctx, Q) {
    ctx.save(); ctx.translate(Q.x + Q.w / 2, Q.y); ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, PI2); ctx.fill();
    ctx.rotate(Q.ang); ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-Q.w * 0.35, 22); ctx.lineTo(0, 0); ctx.lineTo(Q.w * 0.35, 22); ctx.stroke();
    ctx.fillStyle = '#ffca28'; ctx.fillRect(-Q.w / 2, 20, Q.w, Q.h); ctx.fillStyle = '#e3f2fd'; ctx.fillRect(-Q.w / 2 + 9, 29, Q.w - 18, Q.h - 18);
    if (Q.desenho === 'barco') { ctx.fillStyle = '#4fc3f7'; ctx.fillRect(-Q.w / 2 + 9, 20 + Q.h * 0.62, Q.w - 18, Q.h * 0.28); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(-26, 20 + Q.h * 0.62); ctx.lineTo(26, 20 + Q.h * 0.62); ctx.lineTo(16, 20 + Q.h * 0.74); ctx.lineTo(-16, 20 + Q.h * 0.74); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, 20 + Q.h * 0.6); ctx.lineTo(0, 40); ctx.lineTo(22, 20 + Q.h * 0.58); ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = '#1a237e'; ctx.fillRect(-Q.w / 2 + 9, 29, Q.w - 18, Q.h - 18); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 20 + Q.h * 0.45, 12, 30, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#ff7043'; ctx.beginPath(); ctx.moveTo(-8, 20 + Q.h * 0.72); ctx.lineTo(8, 20 + Q.h * 0.72); ctx.lineTo(0, 20 + Q.h * 0.9); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function interruptor(ctx, I, aceso) {
    ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 2; arred(ctx, I.x, I.y, I.w, I.h, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = aceso ? '#c6ff3d' : '#9e9e9e'; arred(ctx, I.x + 11, I.y + (aceso ? 10 : 26), I.w - 22, 18, 4); ctx.fill(); ctx.restore();
  }
  function lustre(ctx, M, ts, leve) {
    var L = M.lustre, lx = L.x + Math.sin(L.ang) * L.L, ly = Math.cos(L.ang) * L.L, cor = CORES_LUZ[M.corLuz];
    ctx.save(); ctx.strokeStyle = '#424242'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L.x, 8); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.translate(lx, ly); ctx.rotate(-L.ang);
    if (M.luz && !leve) { ctx.shadowColor = cor; ctx.shadowBlur = 40; }
    ctx.fillStyle = M.luz ? cor : '#9e9e9e'; ctx.beginPath(); ctx.arc(0, 26, 20, 0, PI2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.moveTo(-46, 22); ctx.quadraticCurveTo(0, -18, 46, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8f00'; ctx.fillRect(-46, 18, 92, 6);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 18, 34 + Math.abs(i) * 2 + Math.sin(ts / 200 + i) * 2, 4, 0, PI2); ctx.fill(); }   // pinguentes
    ctx.restore();
  }
  function arvore(ctx, M, ts) {
    var A = M.arvore, t = A.treme > 0 ? Math.sin(ts / 30) * 8 * A.treme : 0;
    ctx.save(); ctx.translate(t, 0);
    [['#43a047', 0, 0, 1], ['#66bb6a', -90, 30, 0.7], ['#66bb6a', 95, 40, 0.7], ['#2e7d32', 0, -80, 0.65], ['#81c784', 40, 60, 0.5]].forEach(function (b) { ctx.fillStyle = b[0]; ctx.beginPath(); ctx.arc(A.copa.x + b[1], A.copa.y + b[2], A.copa.r * b[3] * 0.75, 0, PI2); ctx.fill(); });
    ctx.fillStyle = '#e53935'; [[-60, 20], [50, -30], [20, 70], [-100, 60], [110, 10]].forEach(function (p) { ctx.beginPath(); ctx.arc(A.copa.x + p[0], A.copa.y + p[1], 10, 0, PI2); ctx.fill(); });
    ctx.restore();
  }
  function balanco(ctx, B) {
    var sx = B.x + Math.sin(B.ang) * B.L, sy = B.topo + Math.cos(B.ang) * B.L;
    ctx.save(); ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(B.x - 40, B.topo); ctx.lineTo(sx - 40, sy); ctx.moveTo(B.x + 40, B.topo); ctx.lineTo(sx + 40, sy); ctx.stroke();
    ctx.translate(sx, sy); ctx.rotate(-B.ang * 0.5); ctx.fillStyle = '#ff7043'; arred(ctx, -52, -6, 104, 16, 6); ctx.fill(); ctx.restore();
  }
  function flor(ctx, f, chao) {
    ctx.save(); ctx.translate(f.x, chao); ctx.rotate(f.ang); ctx.strokeStyle = '#388e3c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -f.h / 2, 0, -f.h); ctx.stroke();
    ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.ellipse(8, -f.h * 0.4, 12, 6, -0.5, 0, PI2); ctx.fill();
    ctx.fillStyle = f.cor; for (var i = 0; i < 6; i++) { var a = i * 1.047; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 12, -f.h + Math.sin(a) * 12, 10, 7, a, 0, PI2); ctx.fill(); }
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(0, -f.h, 8, 0, PI2); ctx.fill(); ctx.restore();
  }
  function folha(ctx, x, y, rot, cor) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, PI2); ctx.fill(); ctx.restore(); }
  function passaro(ctx, p, ts) {
    var bate = p.voando || p.volta ? Math.sin(ts / 50) : Math.sin(ts / 600 + p.fase) * 0.2;
    ctx.save(); ctx.translate(p.x, p.y); if (p.vx < 0) ctx.scale(-1, 1);
    ctx.fillStyle = p.cor; ctx.beginPath(); ctx.ellipse(0, 0, 18, 13, 0, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.arc(14, -8, 9, 0, PI2); ctx.fill();
    ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.moveTo(22, -9); ctx.lineTo(30, -6); ctx.lineTo(22, -4); ctx.fill();
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(16, -10, 2.2, 0, PI2); ctx.fill();
    ctx.fillStyle = escurecer(p.cor, 0.75); ctx.beginPath(); ctx.ellipse(-2, -4 - bate * 10, 13, 6, -0.4 - bate * 0.6, 0, PI2); ctx.fill();
    ctx.restore();
  }
  function borboleta(ctx, b, ts) {
    var a = Math.abs(Math.sin(ts / 70 + b.fase)); ctx.save(); ctx.translate(b.x, b.y); ctx.fillStyle = b.cor;
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s * 9 * a, -4, 10 * a + 2, 12, s * 0.3, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * 7 * a, 8, 7 * a + 2, 8, -s * 0.3, 0, PI2); ctx.fill(); });
    ctx.fillStyle = '#212121'; ctx.fillRect(-2, -10, 4, 22); ctx.restore();
  }
  /* Picolé, o cavachon da família: branquinho, de cachinhos, orelhas compridas e peludas com a pontinha creme,
     olhos escuros e focinho preto (desenho em código, inspirado na foto; a foto não vai para o repositório) */
  function cachorro(ctx, M, ts) {
    var c = M.cachorro, y = M.chao + c.y, anda = c.late > 0 ? 0 : 1, p = c.passo, B = '#fbf8f2', S = '#e2d7c6', T = '#f0dcc0';
    ctx.save(); ctx.translate(c.x, y); ctx.scale(c.dir, 1);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 2 - c.y, 56, 9, 0, 0, PI2); ctx.fill();
    function cachos(x, yy, rx, ry, n, r) { for (var i = 0; i < n; i++) { var a = i / n * PI2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * rx, yy + Math.sin(a) * ry, r, 0, PI2); ctx.fill(); ctx.stroke(); } }
    ctx.fillStyle = B; ctx.strokeStyle = S; ctx.lineWidth = 1.5;
    // perninhas fofas
    [[-28, 0], [-14, 3.14], [20, 3.14], [32, 0]].forEach(function (pp) { var sw = Math.sin(p + pp[1]) * 10 * anda; arred(ctx, pp[0] - 9 + sw * 0.4, -44, 18, 44, 9); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(pp[0] + sw * 0.4, -4, 10, 0, PI2); ctx.fill(); ctx.stroke(); });
    // rabinho de pluma, abanando
    var ab = Math.sin(ts / 70) * 0.5; ctx.save(); ctx.translate(-40, -62); ctx.rotate(-0.6 + ab); for (var k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-k * 4, -k * 9, 11 - k, 0, PI2); ctx.fill(); ctx.stroke(); } ctx.restore();
    // corpo: nuvem de cachinhos
    cachos(0, -58, 36, 18, 12, 13); ctx.beginPath(); ctx.ellipse(0, -58, 42, 24, 0, 0, PI2); ctx.fill();
    ctx.strokeStyle = S; for (var q = 0; q < 7; q++) { ctx.beginPath(); ctx.arc(-26 + q * 9, -60 + (q % 2) * 8, 4, 0.3, 2.8); ctx.stroke(); }
    // cabeça
    var cab = c.late > 0 ? -6 : Math.sin(ts / 300) * 2;
    ctx.save(); ctx.translate(40, -92 + cab);
    ctx.fillStyle = B; ctx.strokeStyle = S; cachos(0, -4, 22, 20, 10, 11); ctx.beginPath(); ctx.arc(0, 0, 26, 0, PI2); ctx.fill();
    cachos(-2, -26, 12, 6, 6, 9);   // topete
    // orelha comprida e peluda, pontinha creme
    var ore = 0.25 + Math.sin(ts / 90) * (c.late > 0 ? 0.35 : 0.05); ctx.save(); ctx.translate(-14, -6); ctx.rotate(ore); ctx.fillStyle = B; for (var e = 0; e < 5; e++) { ctx.beginPath(); ctx.arc((e % 2) * 6 - 3, e * 9, 11, 0, PI2); ctx.fill(); ctx.stroke(); } ctx.fillStyle = T; ctx.beginPath(); ctx.arc(0, 42, 10, 0, PI2); ctx.fill(); ctx.restore();
    // focinho com barbinha, nariz preto, olho escuro
    ctx.fillStyle = B; ctx.beginPath(); ctx.ellipse(22, 10, 17, 14, 0, 0, PI2); ctx.fill(); cachos(22, 18, 10, 4, 5, 6);
    ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(36, 6, 7.5, 6.5, 0, 0, PI2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(34, 4, 2, 0, PI2); ctx.fill();
    ctx.fillStyle = 'rgba(190,150,110,.35)'; ctx.beginPath(); ctx.ellipse(10, 6, 5, 8, 0.2, 0, PI2); ctx.fill();
    ctx.fillStyle = '#2b1a12'; ctx.beginPath(); ctx.arc(10, -4, 6.5, 0, PI2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(12, -6.5, 2.2, 0, PI2); ctx.fill();
    if (c.late > 0) { ctx.fillStyle = '#7a1f2e'; ctx.beginPath(); ctx.ellipse(26, 22, 10, 7, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#ff8fa3'; ctx.beginPath(); ctx.ellipse(26, 26, 5, 4, 0, 0, PI2); ctx.fill(); }
    else { ctx.fillStyle = '#ff8fa3'; ctx.beginPath(); ctx.ellipse(28, 24, 4, 6, 0, 0, PI2); ctx.fill(); }   // linguinha de fora
    ctx.restore();
    // coleira vermelha com plaquinha
    ctx.fillStyle = '#e53935'; arred(ctx, 24, -78, 12, 22, 4); ctx.fill(); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(32, -54, 6, 0, PI2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.font = '700 16px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 3; ctx.strokeText('Picolé', c.x, y - 132 + c.y * 0); ctx.fillText('Picolé', c.x, y - 132); ctx.restore();
    if (c.late > 0) balao(ctx, c.x + c.dir * 70, y - 168 + Math.sin(ts / 40) * 3, 'AU AU!');
  }
  function balao(ctx, x, y, txt) {
    ctx.save(); ctx.font = '700 26px system-ui'; var w = ctx.measureText(txt).width + 28; x = clamp(x, w / 2 + 6, W - w / 2 - 6);
    ctx.fillStyle = '#fff'; arred(ctx, x - w / 2, y - 24, w, 44, 18); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 8, y + 18); ctx.lineTo(x, y + 32); ctx.lineTo(x + 8, y + 18); ctx.fill();
    ctx.fillStyle = '#3e2723'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y - 1); ctx.restore();
  }
  function gato(ctx, g, ts) {
    var cor = '#ffa726', esc = '#e65100';
    ctx.save(); ctx.translate(g.x, g.y); ctx.scale(g.dir, 1);
    if (g.dorme && !g.salto) {   // enroladinho, dormindo
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 6, 0, 0, PI2); ctx.fill();
      ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(0, -18, 36, 18, 0, 0, PI2); ctx.fill();
      ctx.strokeStyle = esc; ctx.lineWidth = 4; [-14, 0, 14].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, -34); ctx.lineTo(x - 4, -22); ctx.stroke(); });
      ctx.strokeStyle = cor; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -10, 34, 0.2, 2.2); ctx.stroke();
      ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(26, -22, 15, 0, PI2); ctx.fill(); [[18, -34], [32, -34]].forEach(function (o) { ctx.beginPath(); ctx.moveTo(o[0] - 6, o[1] + 4); ctx.lineTo(o[0], o[1] - 10); ctx.lineTo(o[0] + 6, o[1] + 4); ctx.fill(); });
      ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2; [20, 31].forEach(function (x) { ctx.beginPath(); ctx.arc(x, -22, 3.5, 0.2, 2.9); ctx.stroke(); });
      ctx.restore(); ctx.save(); ctx.font = '700 ' + (16 + Math.sin(ts / 400) * 3) + 'px system-ui'; ctx.fillStyle = '#5c6bc0'; ctx.fillText('z z Z', g.x + 10, g.y - 52 - (ts / 30) % 10); ctx.restore(); return;
    }
    var ps = g.salto ? 0 : Math.sin(g.passo) * 8;
    ctx.strokeStyle = cor; ctx.lineWidth = 8; ctx.lineCap = 'round';
    [[-18, 1], [-8, -1], [14, -1], [22, 1]].forEach(function (l) { ctx.beginPath(); ctx.moveTo(l[0], -28); ctx.lineTo(l[0] + ps * l[1], g.salto ? -12 : -2); ctx.stroke(); });
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-26, -36); ctx.quadraticCurveTo(-46, -50, -40 + Math.sin(ts / 200) * 6, -80); ctx.stroke();
    ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(0, -36, 30, 15, 0, 0, PI2); ctx.fill();
    ctx.strokeStyle = esc; ctx.lineWidth = 4; [-12, 0, 12].forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, -50); ctx.lineTo(x - 3, -38); ctx.stroke(); });
    ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(30, -52, 16, 0, PI2); ctx.fill(); [[21, -64], [37, -64]].forEach(function (o) { ctx.beginPath(); ctx.moveTo(o[0] - 7, o[1] + 4); ctx.lineTo(o[0], o[1] - 12); ctx.lineTo(o[0] + 7, o[1] + 4); ctx.fill(); });
    ctx.fillStyle = '#c6ff3d'; [24, 36].forEach(function (x) { ctx.beginPath(); ctx.ellipse(x, -55, 3.5, 5, 0, 0, PI2); ctx.fill(); }); ctx.fillStyle = '#212121'; [24, 36].forEach(function (x) { ctx.fillRect(x - 1, -59, 2, 8); });
    ctx.fillStyle = '#ff8fa3'; ctx.beginPath(); ctx.arc(42, -48, 2.5, 0, PI2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; [-3, 0, 3].forEach(function (d) { ctx.beginPath(); ctx.moveTo(42, -47 + d); ctx.lineTo(56, -49 + d * 2); ctx.stroke(); });
    if (g.miau > 0) { ctx.fillStyle = '#7a1f2e'; ctx.beginPath(); ctx.ellipse(38, -42, 4, 4, 0, 0, PI2); ctx.fill(); }
    ctx.restore();
    if (g.miau > 0) balao(ctx, g.x + g.dir * 40, g.y - 110, 'MIAU!');
  }
  function papagaio(ctx, P, ts, fora) {
    // poleiro pendurado no teto (ou num poste, lá fora)
    ctx.save(); ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
    if (!fora) { ctx.beginPath(); ctx.moveTo(P.px - 34, 8); ctx.lineTo(P.px - 34, P.py); ctx.moveTo(P.px + 34, 8); ctx.lineTo(P.px + 34, P.py); ctx.stroke(); }
    ctx.fillStyle = '#6d4c41'; arred(ctx, P.px - 44, P.py - 4, 88, 9, 4); ctx.fill(); ctx.restore();
    var voando = P.voa > 0, bate = voando ? Math.sin(ts / 45) : 0, olha = voando ? (Math.cos(P.voa * 1.3) >= 0 ? 1 : -1) : 1;
    ctx.save(); ctx.translate(P.x, P.y + (voando ? 0 : Math.sin(ts / 500 + P.fase) * 2)); ctx.scale(olha, 1);
    ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.moveTo(-6, 18); ctx.lineTo(-18, 58); ctx.lineTo(4, 22); ctx.fill();   // rabo
    ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.ellipse(0, 0, 17, 26, 0.15, 0, PI2); ctx.fill();
    ctx.fillStyle = '#2e7d32'; ctx.save(); ctx.translate(-4, -2); ctx.rotate(voando ? -0.9 - bate * 0.8 : 0.2); ctx.beginPath(); ctx.ellipse(0, 10, 10, 22, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.ellipse(0, -6, 6, 6, 0, 0, PI2); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(6, -26, 14, 0, PI2); ctx.fill();
    ctx.fillStyle = '#29b6f6'; ctx.beginPath(); ctx.arc(6, -36, 8, Math.PI, 0); ctx.fill();   // testa azul
    ctx.fillStyle = '#fdd835'; ctx.beginPath(); ctx.ellipse(10, -24, 8, 9, 0, 0, PI2); ctx.fill();   // carinha amarela
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(12, -28, 5, 0, PI2); ctx.fill(); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(13, -28, 2.6, 0, PI2); ctx.fill();
    ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.moveTo(18, -26); ctx.quadraticCurveTo(30, -26, 24, -14); ctx.lineTo(18, -18); ctx.closePath(); ctx.fill();   // bico curvo
    if (!voando) { ctx.strokeStyle = '#757575'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 24); ctx.lineTo(-4, 30); ctx.moveTo(6, 24); ctx.lineTo(6, 30); ctx.stroke(); }
    ctx.restore();
    if (P.fala > 0) balao(ctx, P.x + 20, P.y - 70, '🦜 ' + P.txt);
  }
  function tartaruga(ctx, t, chao, ts) {
    var esc = t.esconde > 0, ps = esc ? 0 : Math.sin(t.passo) * 3;
    ctx.save(); ctx.translate(t.x, chao); ctx.scale(t.dir, 1);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 7, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = '#9ccc65';
    if (!esc) { [[-22, ps], [-8, -ps], [12, ps], [24, -ps]].forEach(function (l) { ctx.beginPath(); ctx.ellipse(l[0] + l[1], -6, 7, 9, 0, 0, PI2); ctx.fill(); }); ctx.beginPath(); ctx.ellipse(40, -16, 13, 11, 0.2, 0, PI2); ctx.fill(); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(45, -19, 2.4, 0, PI2); ctx.fill(); ctx.strokeStyle = '#33691e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(46, -13, 4, 0.2, 1.6); ctx.stroke(); }
    else { ctx.fillStyle = '#558b2f'; ctx.beginPath(); ctx.arc(34, -10, 5, 0, PI2); ctx.fill(); }
    ctx.fillStyle = '#6d8f3a'; ctx.beginPath(); ctx.ellipse(0, -14, 36, 26, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c5a35a'; ctx.fillRect(-36, -14, 72, 6);
    ctx.strokeStyle = '#3e5a1c'; ctx.lineWidth = 2.5; [[-16, -26], [6, -30], [22, -20], [-26, -16]].forEach(function (h) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var a = i * 1.047; ctx.lineTo(h[0] + Math.cos(a) * 8, h[1] + Math.sin(a) * 7); } ctx.closePath(); ctx.stroke(); });
    ctx.restore();
  }
  /* a mamãe: adulta (maior que a criança), vem andando e falando; no fim balança a cabeça e sacode o dedo */
  var FALAS_MAE = [['Crianças?', 'Kids?'], ['Que barulho é esse?', 'What is that noise?'], ['Já vou aí!', 'Coming!'], ['O que está acontecendo?', 'What is going on?']];
  var FALAS_BRAVA = [['Que bagunça é essa?!', 'What is this mess?!'], ['Vamos arrumar!', 'Let\'s tidy up!']];
  function mae(ctx, M, ts) {
    var m = M.mae, k = m.k || 0, x = W + 120 - k * 320, y = M.chao + 4, viu = !!m.viu, fala = Math.floor(ts / 420) % 2 === 0;   // boca abre e fecha falando
    var passo = viu ? 0 : Math.sin(ts / 120) * 12, bob = viu ? 0 : Math.abs(Math.sin(ts / 120)) * 5, pe = viu ? Math.max(0, Math.sin(ts / 110)) * 8 : 0;   // andando / batendo o pé
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(1.12, 1.12);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(0, bob / 1.12, 46, 9, 0, 0, PI2); ctx.fill();
    ctx.strokeStyle = '#ffd9b3'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -70); ctx.lineTo(-12 + passo, -6); ctx.moveTo(10, -70); ctx.lineTo(12 - passo, -6 - pe); ctx.stroke();
    ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.ellipse(-12 + passo, -3, 13, 6, 0, 0, PI2); ctx.ellipse(12 - passo + 4, -3 - pe, 13, 6, 0, 0, PI2); ctx.fill();   // sapatos
    ctx.fillStyle = '#5e35b1'; ctx.beginPath(); ctx.moveTo(-26, -170); ctx.lineTo(26, -170); ctx.lineTo(48, -64); ctx.lineTo(-48, -64); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd9b3'; ctx.lineWidth = 11;
    if (viu) {
      var dedo = Math.sin(ts / 90) * 0.35;
      ctx.beginPath(); ctx.moveTo(-24, -160); ctx.lineTo(-52, -126); ctx.lineTo(-30, -100); ctx.stroke();   // uma mão na cintura
      ctx.save(); ctx.translate(24, -160); ctx.rotate(-2.2 + dedo); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.stroke(); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(0, 64); ctx.stroke(); ctx.restore();   // a outra sacudindo o dedo
    } else { ctx.beginPath(); ctx.moveTo(-24, -160); ctx.lineTo(-34 - passo, -100); ctx.moveTo(24, -160); ctx.lineTo(34 + passo, -100); ctx.stroke(); }
    ctx.save(); ctx.translate(0, -198); ctx.rotate(viu ? Math.sin(ts / 140) * 0.14 : Math.sin(ts / 240) * 0.05);   // balança a cabeça
    ctx.fillStyle = '#ffd9b3'; ctx.beginPath(); ctx.arc(0, 0, 28, 0, PI2); ctx.fill();
    ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.arc(0, -8, 29, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.arc(0, -40, 14, 0, PI2); ctx.fill();   // cabelo com coque
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(-10, 0, viu ? 4.5 : 3, 0, PI2); ctx.arc(10, 0, viu ? 4.5 : 3, 0, PI2); ctx.fill();
    if (viu) { ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(-5, -8); ctx.moveTo(16, -12); ctx.lineTo(5, -8); ctx.stroke(); }   // sobrancelhas bravas
    ctx.fillStyle = '#7a1f2e'; ctx.beginPath(); ctx.ellipse(0, 14, 7, fala ? 8 : 2.5, 0, 0, PI2); ctx.fill();
    ctx.restore(); ctx.restore();
    // balão de fala
    var lista = viu ? FALAS_BRAVA : FALAS_MAE, f = lista[Math.floor(ts / 1800) % lista.length], txt = /^en/i.test((typeof navigator !== 'undefined' && navigator.language) || '') ? f[1] : f[0];
    ctx.save(); ctx.font = '700 24px system-ui'; var tw = ctx.measureText(txt).width + 30, bx = Math.min(W - tw - 10, x - tw + 30), by = y - 340;
    ctx.fillStyle = 'rgba(255,255,255,.96)'; arred(ctx, bx, by, tw, 46, 20); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 30, by + 44); ctx.lineTo(x - 6, by + 70); ctx.lineTo(x - 2, by + 44); ctx.fill();
    ctx.fillStyle = viu ? '#c62828' : '#311b92'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, bx + 15, by + 24); ctx.restore();
  }
  function geladeira(ctx, G, ts) {
    var a = G.abre; ctx.save();
    ctx.fillStyle = '#eceff1'; arred(ctx, G.x, G.y, G.w, G.h, 16); ctx.fill(); ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 3; ctx.stroke();
    var porta = G.y + 150;
    if (a > 0.02) {   // por dentro: luz amarelinha e as coisas nas prateleiras
      ctx.fillStyle = '#fffde7'; ctx.fillRect(G.x + 8, porta + 8, G.w - 16, G.h - 160); ctx.fillStyle = 'rgba(255,241,118,' + (0.35 * a) + ')'; ctx.fillRect(G.x + 8, porta + 8, G.w - 16, G.h - 160);
      ctx.fillStyle = '#b0bec5'; [porta + 110, porta + 210].forEach(function (y) { ctx.fillRect(G.x + 8, y, G.w - 16, 5); });
      ctx.fillStyle = '#ffffff'; ctx.fillRect(G.x + 24, porta + 40, 30, 70); ctx.fillStyle = '#42a5f5'; ctx.fillRect(G.x + 24, porta + 60, 30, 18);   // leite
      ctx.fillStyle = '#ffca28'; ctx.beginPath(); ctx.moveTo(G.x + 70, porta + 108); ctx.lineTo(G.x + 120, porta + 108); ctx.lineTo(G.x + 70, porta + 78); ctx.fill();   // queijo
      ctx.fillStyle = '#ff7043'; ctx.fillRect(G.x + 130, porta + 52, 26, 56); ctx.fillStyle = '#e53935'; [0, 1, 2].forEach(function (i) { ctx.beginPath(); ctx.arc(G.x + 40 + i * 34, porta + 196, 14, 0, PI2); ctx.fill(); });   // suco e maçãs
      ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.ellipse(G.x + 120, porta + 290, 40, 18, 0, 0, PI2); ctx.fill();
    }
    var lw = (G.w - 4) * Math.max(0.08, Math.cos(a * 1.4));
    ctx.fillStyle = '#f5f5f5'; arred(ctx, G.x + 2, porta, lw, G.h - 152, 12); ctx.fill(); ctx.strokeStyle = '#b0bec5'; ctx.stroke();
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(G.x + lw - 22, porta + 40, 8, 90); ctx.fillRect(G.x + G.w - 30, G.y + 40, 8, 70);
    if (lw > 60) { ctx.font = '700 26px system-ui'; ctx.fillText('🍓', G.x + 20, porta + 60); ctx.fillText('⭐', G.x + 60, porta + 120); ctx.fillText('🐶', G.x + 26, porta + 190); }   // ímãs
    ctx.strokeStyle = '#b0bec5'; ctx.beginPath(); ctx.moveTo(G.x, porta); ctx.lineTo(G.x + G.w, porta); ctx.stroke();
    ctx.restore();
  }
  function torneira(ctx, To, ts) {
    ctx.save(); ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(To.x - 40, To.y + 50); ctx.lineTo(To.x - 40, To.y); ctx.quadraticCurveTo(To.x - 40, To.y - 24, To.x - 10, To.y - 24); ctx.lineTo(To.x, To.y - 24); ctx.lineTo(To.x, To.y - 12); ctx.stroke();
    ctx.fillStyle = To.ligada ? '#42a5f5' : '#e53935'; ctx.beginPath(); ctx.arc(To.x - 40, To.y + 12, 8, 0, PI2); ctx.fill();
    if (To.ligada) { ctx.fillStyle = 'rgba(100,190,255,.75)'; ctx.fillRect(To.x - 5, To.y - 10, 10, 66); ctx.fillStyle = 'rgba(255,255,255,.8)'; for (var i = 0; i < 4; i++) { var yy = To.y - 10 + ((ts / 6 + i * 16) % 64); ctx.fillRect(To.x - 2, yy, 4, 6); } ctx.fillStyle = 'rgba(100,190,255,.5)'; [-14, 0, 14].forEach(function (d) { ctx.beginPath(); ctx.arc(To.x + d, To.y + 58 - Math.abs(Math.sin(ts / 90 + d)) * 8, 4, 0, PI2); ctx.fill(); }); }
    ctx.restore();
  }
  function agua(ctx, Bn, ts) {
    ctx.save(); ctx.fillStyle = 'rgba(100,200,255,.55)'; ctx.beginPath(); ctx.moveTo(Bn.x1 + 18, Bn.topo + 2);
    for (var x = Bn.x1 + 18; x <= Bn.x2 - 18; x += 20) ctx.lineTo(x, Bn.topo + 2 + Math.sin(x / 30 + ts / 300) * 4);
    ctx.lineTo(Bn.x2 - 18, Bn.topo + 40); ctx.lineTo(Bn.x1 + 18, Bn.topo + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; for (var e = 0; e < 14; e++) { ctx.beginPath(); ctx.arc(Bn.x1 + 40 + e * 32, Bn.topo + 2 + Math.sin(e * 2 + ts / 400) * 3, 10 + (e % 3) * 4, 0, PI2); ctx.fill(); }   // espuma
    Bn.bolhas.forEach(function (b) { ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2; ctx.fillStyle = 'hsla(' + ((b.f * 60 + ts / 20) % 360) + ',90%,80%,.35)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, PI2); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.22, 0, PI2); ctx.fill(); });
    ctx.restore();
  }
  function papel(ctx, P) {
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 14; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(P.x, P.y); P.pts.forEach(function (q) { ctx.lineTo(q.x, q.y); }); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(180,180,180,.6)'; ctx.lineWidth = 1; ctx.setLineDash([3, 9]); ctx.stroke(); ctx.restore();
  }
  function gangorra(ctx, Gg) {
    ctx.save(); ctx.translate(Gg.x, Gg.y); ctx.rotate(Gg.ang);
    ctx.fillStyle = '#ff7043'; arred(ctx, -Gg.L, -10, Gg.L * 2, 18, 8); ctx.fill();
    ctx.fillStyle = '#1e88e5'; [-1, 1].forEach(function (s) { arred(ctx, s * (Gg.L - 40) - 22, -24, 44, 16, 6); ctx.fill(); ctx.fillRect(s * (Gg.L - 70) - 4, -54, 8, 44); ctx.fillRect(s * (Gg.L - 70) - 14, -58, 28, 8); });
    ctx.restore(); ctx.fillStyle = '#4e342e'; ctx.beginPath(); ctx.arc(Gg.x, Gg.y, 9, 0, PI2); ctx.fill();
  }
  function castelo(ctx, Ca) {
    ctx.save(); ctx.translate(Ca.x, Ca.y);
    if (Ca.inteiro) {
      ctx.fillStyle = '#e6c27a'; ctx.fillRect(-50, -60, 100, 60); [-40, 40].forEach(function (x) { ctx.fillRect(x - 16, -100, 32, 100); for (var a = 0; a < 3; a++) ctx.fillRect(x - 16 + a * 12, -110, 8, 10); });
      ctx.fillRect(-16, -90, 32, 30); ctx.fillStyle = '#c9a25a'; arred(ctx, -10, -36, 20, 36, 10); ctx.fill();
      ctx.strokeStyle = '#6d4c41'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(0, -128); ctx.stroke(); ctx.fillStyle = '#ff4fa3'; ctx.beginPath(); ctx.moveTo(0, -128); ctx.lineTo(24, -120); ctx.lineTo(0, -112); ctx.fill();
    } else { ctx.fillStyle = '#e6c27a'; ctx.beginPath(); ctx.ellipse(0, -6, 74, 24, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#d4a85a'; [[-30, -16], [10, -22], [40, -12]].forEach(function (b) { ctx.beginPath(); ctx.arc(b[0], b[1], 10, 0, PI2); ctx.fill(); }); }
    ctx.restore();
  }
  function coisa(ctx, o, ts) {
    var w = o.w, h = o.h;
    switch (o.tipo) {
      case 'livro':
        if (o.aberto) {   // aberto no chão, folheando um pouco depois de cair
          ctx.fillStyle = o.cor; arred(ctx, -48, -6, 96, 14, 3); ctx.fill();
          ctx.fillStyle = '#fffdf5'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-24, -14, -44, -6); ctx.lineTo(-44, 4); ctx.quadraticCurveTo(-24, -4, 0, 4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(24, -14, 44, -6); ctx.lineTo(44, 4); ctx.quadraticCurveTo(24, -4, 0, 4); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 1; for (var l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(-38, -4 + l * 3); ctx.lineTo(-8, -6 + l * 3); ctx.moveTo(8, -6 + l * 3); ctx.lineTo(38, -4 + l * 3); ctx.stroke(); }
          var vira = Math.sin(ts / 160 + o.id) * 0.5 + 0.5; ctx.fillStyle = 'rgba(255,253,245,.95)'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.quadraticCurveTo(-10 + vira * 20, -30 - vira * 6, -30 + vira * 60, -10); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
        } else {
          ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2, w, h, 3); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 10, w - 8, 5); ctx.fillRect(-w / 2 + 4, h / 2 - 15, w - 8, 5);
          ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(w / 2 - 4, -h / 2, 4, h);
        }
        break;
      case 'bola':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, PI2); ctx.fill();
        ctx.fillStyle = o.cor2; ctx.beginPath(); ctx.arc(0, 0, o.r, -0.6, 0.6); ctx.arc(0, 0, o.r * 0.35, 0.6, -0.6, true); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, o.r, 2.54, 3.74); ctx.arc(0, 0, o.r * 0.35, 3.74, 2.54, true); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(-o.r * 0.35, -o.r * 0.35, o.r * 0.25, 0, PI2); ctx.fill();
        break;
      case 'bloco':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2, w, h, 5); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = '700 26px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.letra || 'A', 0, 2);
        break;
      case 'almofada':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.quadraticCurveTo(0, -h / 2 + 10, w / 2, -h / 2); ctx.quadraticCurveTo(w / 2 - 10, 0, w / 2, h / 2); ctx.quadraticCurveTo(0, h / 2 - 10, -w / 2, h / 2); ctx.quadraticCurveTo(-w / 2 + 10, 0, -w / 2, -h / 2); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, PI2); ctx.fill();
        break;
      case 'ursinho':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.ellipse(0, h * 0.16, w * 0.4, h * 0.34, 0, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.arc(0, -h * 0.26, w * 0.32, 0, PI2); ctx.fill();
        [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * w * 0.26, -h * 0.46, w * 0.12, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * w * 0.38, h * 0.08, w * 0.12, h * 0.1, s * 0.6, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * w * 0.22, h * 0.44, w * 0.14, h * 0.08, 0, 0, PI2); ctx.fill(); });
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(0, -h * 0.19, w * 0.14, h * 0.08, 0, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, h * 0.18, w * 0.22, h * 0.2, 0, 0, PI2); ctx.fill();
        ctx.fillStyle = '#3e2723'; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * w * 0.11, -h * 0.3, 3.5, 0, PI2); ctx.fill(); }); ctx.beginPath(); ctx.arc(0, -h * 0.21, 4, 0, PI2); ctx.fill();
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(-10, -h * 0.06); ctx.lineTo(0, -h * 0.02); ctx.lineTo(10, -h * 0.06); ctx.lineTo(10, h * 0.02); ctx.lineTo(0, -h * 0.02); ctx.lineTo(-10, h * 0.02); ctx.closePath(); ctx.fill();   // lacinho
        break;
      case 'carrinho':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2 + 6, w, h * 0.55, 8); ctx.fill(); arred(ctx, -w * 0.28, -h / 2 - 8, w * 0.5, h * 0.42, 8); ctx.fill();
        ctx.fillStyle = '#b3e5fc'; arred(ctx, -w * 0.22, -h / 2 - 3, w * 0.18, h * 0.26, 3); ctx.fill(); arred(ctx, 0, -h / 2 - 3, w * 0.16, h * 0.26, 3); ctx.fill();
        [-1, 1].forEach(function (s) { ctx.save(); ctx.translate(s * w * 0.3, h / 2 - 8); ctx.rotate(o.va * ts / 1000); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, PI2); ctx.fill(); ctx.fillStyle = '#bdbdbd'; ctx.fillRect(-2, -8, 4, 16); ctx.restore(); });
        break;
      case 'pato':
        ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.ellipse(-2, 8, w * 0.48, h * 0.32, 0, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -10, h * 0.3, 0, PI2); ctx.fill();
        ctx.fillStyle = '#ff9800'; ctx.beginPath(); ctx.ellipse(26, -6, 10, 5, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(14, -14, 3, 0, PI2); ctx.fill();
        ctx.fillStyle = '#fbc02d'; ctx.beginPath(); ctx.ellipse(-8, 6, 12, 7, -0.3, 0, PI2); ctx.fill();
        break;
      case 'piao':
        var g = o.gira > 0 ? ts / 40 : 0; ctx.save(); if (o.gira > 0) ctx.rotate(Math.sin(ts / 90) * 0.12);
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.15); ctx.quadraticCurveTo(0, -h * 0.55, w / 2, -h * 0.15); ctx.lineTo(0, h / 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = o.cor2; for (var i = 0; i < 3; i++) { var x = ((i * 16 + g * 6) % 48) - 24; ctx.fillRect(x, -h * 0.22, 6, h * 0.2); }
        ctx.fillStyle = '#5d4037'; ctx.fillRect(-3, -h * 0.55, 6, h * 0.16); ctx.restore();
        break;
      case 'robo':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h * 0.05, w, h * 0.5, 6); ctx.fill(); arred(ctx, -w * 0.4, -h / 2, w * 0.8, h * 0.4, 6); ctx.fill();
        ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(-8, -h * 0.3, 4, 0, PI2); ctx.arc(8, -h * 0.3, 4, 0, PI2); ctx.fill();
        ctx.strokeStyle = '#616161'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, -h / 2 - 10); ctx.stroke(); ctx.fillStyle = '#ff5252'; ctx.beginPath(); ctx.arc(0, -h / 2 - 12, 4, 0, PI2); ctx.fill();
        ctx.fillStyle = '#ffd166'; ctx.fillRect(-10, h * 0.08, 20, 8);
        break;
      case 'vaso':
        ctx.fillStyle = '#43a047'; [[-14, -h * 0.55, -0.4], [0, -h * 0.65, 0], [14, -h * 0.55, 0.4]].forEach(function (f) { ctx.beginPath(); ctx.ellipse(f[0], f[1], 10, 26, f[2], 0, PI2); ctx.fill(); });
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.1); ctx.lineTo(w / 2, -h * 0.1); ctx.lineTo(w * 0.36, h / 2); ctx.lineTo(-w * 0.36, h / 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(-w / 2, -h * 0.1, w, 8);
        break;
      case 'maca':
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(0, 2, o.r, 0, PI2); ctx.fill(); ctx.fillStyle = '#5d4037'; ctx.fillRect(-1.5, -o.r - 4, 3, 8); ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.ellipse(6, -o.r - 2, 6, 3, -0.5, 0, PI2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(-5, -3, 4, 0, PI2); ctx.fill();
        break;
      case 'balde':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w * 0.38, h / 2); ctx.lineTo(-w * 0.38, h / 2); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -h / 2, w * 0.45, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#ffd166'; ctx.fillRect(-w / 2, -h / 2, w, 6);
        break;
      case 'regador':
        ctx.fillStyle = o.cor; arred(ctx, -w * 0.3, -h / 2, w * 0.55, h, 10); ctx.fill(); ctx.strokeStyle = o.cor; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.1); ctx.lineTo(w / 2, -h * 0.35); ctx.stroke(); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(-w * 0.3, -h * 0.05, h * 0.3, 1.6, 4.7); ctx.stroke();
        ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.ellipse(w / 2 + 2, -h * 0.38, 7, 10, -0.6, 0, PI2); ctx.fill();
        break;
      case 'gnomo':
        ctx.fillStyle = '#1e88e5'; arred(ctx, -w / 2, 0, w, h / 2, 10); ctx.fill(); ctx.fillStyle = '#ffd9b3'; ctx.beginPath(); ctx.arc(0, -h * 0.08, w * 0.32, 0, PI2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-w * 0.32, -h * 0.02); ctx.quadraticCurveTo(0, h * 0.35, w * 0.32, -h * 0.02); ctx.closePath(); ctx.fill();
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w * 0.4, -h * 0.18); ctx.lineTo(w * 0.4, -h * 0.18); ctx.lineTo(4, -h / 2 - 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(-6, -h * 0.1, 2.5, 0, PI2); ctx.arc(6, -h * 0.1, 2.5, 0, PI2); ctx.fill();
        break;
      case 'torrada':
        ctx.fillStyle = '#d7a05b'; arred(ctx, -w / 2, -h / 2, w, h, 10); ctx.fill(); ctx.fillStyle = '#f3d29b'; arred(ctx, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 8); ctx.fill();
        break;
      case 'carta':
        ctx.fillStyle = '#fffde7'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, 2); ctx.lineTo(w / 2, -h / 2); ctx.stroke(); ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(0, 2, 4, 0, PI2); ctx.fill();
        break;
      case 'roupa':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 4); ctx.lineTo(w / 2, -h / 2 + 4); ctx.lineTo(w / 2 - 6, -h / 2 + 22); ctx.lineTo(w * 0.25, -h / 2 + 18); ctx.lineTo(w * 0.25, h / 2); ctx.lineTo(-w * 0.25, h / 2); ctx.lineTo(-w * 0.25, -h / 2 + 18); ctx.lineTo(-w / 2 + 6, -h / 2 + 22); ctx.closePath(); ctx.fill();
        break;
      case 'panela':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2 + 6, w, h - 6, 8); ctx.fill(); ctx.fillStyle = escurecer(o.cor, 0.8); ctx.fillRect(-w / 2 - 2, -h / 2 + 4, w + 4, 6);
        ctx.fillStyle = '#37474f'; arred(ctx, w / 2 - 2, -h / 2 + 10, 28, 8, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-w / 2 + 8, -h / 2 + 14, 8, h - 22);
        break;
      case 'tampa':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, PI2); ctx.fill(); ctx.strokeStyle = escurecer(o.cor, 0.75); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.7, 0, PI2); ctx.stroke();
        ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.22, 0, PI2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(-o.r * 0.4, -o.r * 0.4, o.r * 0.18, 0, PI2); ctx.fill();
        break;
      case 'pote': case 'copo':
        ctx.fillStyle = o.cor; ctx.globalAlpha = o.tipo === 'copo' ? 0.85 : 1; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + 6); ctx.lineTo(w / 2, -h / 2 + 6); ctx.lineTo(w * 0.4, h / 2); ctx.lineTo(-w * 0.4, h / 2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
        if (o.tipo === 'pote') { ctx.fillStyle = escurecer(o.cor, 0.75); arred(ctx, -w / 2 - 2, -h / 2, w + 4, 9, 4); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 12, 5, h - 18);
        break;
      case 'caneca':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2, w, h, 6); ctx.fill(); ctx.strokeStyle = o.cor; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(w / 2, 0, 9, -1.4, 1.4); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '16px system-ui'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, 6);
        break;
      case 'laranja':
        ctx.fillStyle = '#fb8c00'; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, PI2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(-5, -5, 5, 0, PI2); ctx.fill(); ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.ellipse(4, -o.r, 6, 3, -0.4, 0, PI2); ctx.fill();
        break;
      case 'banana':
        ctx.fillStyle = '#fdd835'; ctx.beginPath(); ctx.moveTo(-w / 2, -2); ctx.quadraticCurveTo(0, h, w / 2, -2); ctx.quadraticCurveTo(0, h * 0.2, -w / 2, -2); ctx.fill(); ctx.fillStyle = '#6d4c41'; ctx.fillRect(w / 2 - 4, -6, 6, 6); ctx.fillRect(-w / 2 - 2, -6, 5, 5);
        break;
      case 'colher':
        ctx.fillStyle = '#c68a4e'; arred(ctx, -w / 2, -3, w * 0.7, 6, 3); ctx.fill(); ctx.beginPath(); ctx.ellipse(w * 0.32, 0, w * 0.18, h * 0.55, 0, 0, PI2); ctx.fill();
        break;
      case 'tigela':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w * 0.38, h / 2); ctx.lineTo(-w * 0.38, h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('PICOLÉ', 0, 5);
        break;
      case 'frasco':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2 + 14, w, h - 14, 8); ctx.fill(); ctx.fillStyle = '#eceff1'; ctx.fillRect(-w * 0.25, -h / 2, w * 0.5, 16); ctx.fillStyle = 'rgba(255,255,255,.75)'; arred(ctx, -w / 2 + 5, -h / 2 + 26, w - 10, h * 0.32, 4); ctx.fill();
        break;
      case 'escova':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2 + 12, w, h - 12, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2 - 2, -h / 2, w + 4, 14); ctx.fillStyle = '#4fc3f7'; ctx.fillRect(-w / 2 - 2, -h / 2 + 6, w + 4, 3);
        break;
      case 'sabonete':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-w * 0.15, -h * 0.15, w * 0.25, h * 0.2, 0, 0, PI2); ctx.fill();
        break;
      case 'toalha':
        ctx.fillStyle = o.cor; arred(ctx, -w / 2, -h / 2, w, h, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-w / 2, h / 2 - 22, w, 6); ctx.fillRect(-w / 2, h / 2 - 12, w, 3);
        ctx.fillStyle = escurecer(o.cor, 0.85); ctx.fillRect(-w / 2, -h / 2, w, 14);
        break;
      case 'rolo':
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, PI2); ctx.fill(); ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.75, 0, PI2); ctx.stroke(); ctx.fillStyle = '#bcaaa4'; ctx.beginPath(); ctx.arc(0, 0, o.r * 0.35, 0, PI2); ctx.fill();
        break;
      case 'meia':
        ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w * 0.1, -h / 2); ctx.lineTo(w * 0.1, 0); ctx.quadraticCurveTo(w / 2 + 4, 0, w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2, -h / 2, w * 0.6, 5);
        break;
      case 'pa':
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(-w / 2, -3, w * 0.6, 6); ctx.fillStyle = o.cor; ctx.beginPath(); ctx.moveTo(w * 0.08, -h / 2 - 4); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w * 0.08, h / 2 + 4); ctx.closePath(); ctx.fill();
        break;
      case 'cone':
        ctx.fillStyle = '#ff6d00'; ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(0, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(-w * 0.28, 0, w * 0.56, 7); ctx.fillStyle = '#e65100'; ctx.fillRect(-w / 2 - 4, h / 2 - 6, w + 8, 6);
        break;
      case 'bambole':
        ctx.strokeStyle = o.cor; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, o.r - 4, 0, PI2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([10, 14]); ctx.beginPath(); ctx.arc(0, 0, o.r - 4, 0, PI2); ctx.stroke(); ctx.setLineDash([]);
        break;
      default:
        ctx.fillStyle = o.cor || '#ccc'; arred(ctx, -w / 2, -h / 2, w, h, 6); ctx.fill();
    }
  }
  /* arrumação: o cesto, a sombra do lugar certo de quem está na mão e a seta da dica */
  function guias(ctx, M, ts) {
    var pisca = 0.55 + 0.35 * Math.sin(ts / 160);
    if (M.cesto && M.obs.some(function (o) { return o.extra && !o.fora; })) { var C = M.cesto; ctx.save(); ctx.fillStyle = '#d7a86e'; arred(ctx, C.x, C.y, C.w, C.h, 12); ctx.fill(); ctx.strokeStyle = '#a1742f'; ctx.lineWidth = 3; for (var i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(C.x, C.y + i * C.h / 4); ctx.lineTo(C.x + C.w, C.y + i * C.h / 4); ctx.stroke(); } ctx.font = '700 30px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🧺', C.x + C.w / 2, C.y - 8); ctx.restore(); }
    function sombra(o) { ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * pisca; ctx.translate(o.x0, o.y0); ctx.rotate(o.ang0); if (o.caixa) ctx.scale(o.s, o.s); var c = {}; for (var k in o) c[k] = o[k]; c.w = o.w0; c.h = o.h0; c.r = o.r0; c.aberto = false; c.gira = 0; coisa(ctx, c, ts); ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgba(198,255,61,' + pisca + ')'; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(o.x0, o.y0, Math.max(o.w0, o.h0) / 2 * (o.caixa ? o.s : 1) + 12, 0, PI2); ctx.stroke(); ctx.restore(); }
    if (M.dicas) M.obs.forEach(function (o) {   // dicas ligadas: um tracejado em cada lugar vazio
      if (o.extra || o.fora || o.segurado || (o.dorme && Math.hypot(o.x - o.x0, o.y - o.y0) < 30)) return;
      var rr = Math.max(o.w0, o.h0) / 2 * (o.caixa ? o.s : 1) + 6; ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(o.x0, o.y0, rr, 0, PI2); ctx.stroke(); ctx.restore();
    });
    M.obs.forEach(function (o) { if (o.segurado && !o.extra) sombra(o); if (o.segurado && o.extra && M.cesto) { ctx.save(); ctx.strokeStyle = 'rgba(198,255,61,' + pisca + ')'; ctx.lineWidth = 5; arred(ctx, M.cesto.x - 6, M.cesto.y - 6, M.cesto.w + 12, M.cesto.h + 12, 16); ctx.stroke(); ctx.restore(); } });
    var D = M.dica; if (D && M.tempo < D.ate) { var o = M.obs.filter(function (x) { return x.id === D.id; })[0]; if (o && !o.segurado) {
      var tx = o.extra ? M.cesto.x + M.cesto.w / 2 : o.x0, ty = o.extra ? M.cesto.y : o.y0; if (!o.extra) sombra(o);
      ctx.save(); ctx.strokeStyle = '#ffd166'; ctx.fillStyle = '#ffd166'; ctx.lineWidth = 6; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -ts / 30; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.quadraticCurveTo((o.x + tx) / 2, Math.min(o.y, ty) - 120, tx, ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(o.x, o.y, Math.max(o.w, o.h) / 2 + 14 + pisca * 6, 0, PI2); ctx.stroke(); ctx.font = '700 34px system-ui'; ctx.textAlign = 'center'; ctx.fillText('👆', o.x, o.y - Math.max(o.w, o.h) / 2 - 22 - pisca * 8); ctx.restore(); } }
    M.obs.forEach(function (o) { if (!o.segurado) return; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.ang); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8; coisa(ctx, o, ts); ctx.restore(); });   // na mão: por cima de tudo
  }
  /* caixa organizadora transparente: o fundo vai antes das coisas, a frente (plástico) depois */
  function caixa(ctx, C, frente) {
    ctx.save();
    if (!frente) {
      ctx.fillStyle = 'rgba(210,235,255,.35)'; arred(ctx, C.x + 6, C.y - 8, C.w - 12, C.h, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(120,170,220,.7)'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(200,232,255,.30)'; arred(ctx, C.x, C.y + C.h * 0.3, C.w, C.h * 0.7, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(90,150,210,.95)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(C.x + 4, C.y + C.h * 0.3); ctx.lineTo(C.x + C.w - 4, C.y + C.h * 0.3); ctx.stroke();   // a borda de cima
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(C.x + 14, C.y + C.h - 8); ctx.lineTo(C.x + 34, C.y + C.h * 0.36); ctx.stroke();   // brilho do plástico
      var ex = C.x + 6, ey = C.y + C.h * 0.3; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(ex, ey, 15, 0, PI2); ctx.fill(); ctx.strokeStyle = 'rgba(90,150,210,.95)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '17px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(C.icone, ex, ey + 1);   // etiqueta no canto
    }
    ctx.restore();
  }
  function medidor(ctx, pct, ts, arrumando) {
    if (arrumando) pct = 1 - pct;
    var w = 360, x = W / 2 - w / 2, y = 110;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; arred(ctx, x - 10, y - 6, w + 20, 40, 18); ctx.fill();
    var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#c6ff3d'); g.addColorStop(0.5, '#ffd166'); g.addColorStop(1, '#ff4fa3');
    ctx.fillStyle = 'rgba(255,255,255,.15)'; arred(ctx, x, y + 4, w, 20, 10); ctx.fill();
    ctx.fillStyle = g; arred(ctx, x, y + 4, Math.max(20, w * pct), 20, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((arrumando ? '🧹 ' : '🧸 ') + Math.round(pct * 100) + '%', W / 2, y + 14 + (pct >= 1 ? Math.sin(ts / 80) * 2 : 0));
    ctx.restore();
  }
  return { criar: criar, desenhar: desenhar, guias: guias, luz: luz, medidor: medidor, CENAS: CENAS, CASA: CASA, NOMES: NOMES, W: W, H: H };
});
