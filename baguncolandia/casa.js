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
  var CENAS = ['sala', 'quarto', 'jardim'];
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
      c.x0 = c.x; c.y0 = c.y; c.ang0 = c.ang; M.obs.push(c); return c;
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
      M.lustre = { x: 660, L: 168, ang: 0, va: 0, ate: 0 };
      M.sofa = { x1: 450, x2: 800, assento: 545 };
      var ps = plat(462, 788, 545);
      [520, 625, 730].forEach(function (x, i) { ob('almofada', x, 545, { w: 92, h: 58, cor: ['#ff4fa3', '#ffd166', '#3ee8ff'][i], apoio: { p: ps }, quica: 0.2 }); });
      M.estante = { x1: 900, x2: 1200, topo: 104, tabuas: [232, 362, 492] };
      var p1 = plat(905, 1195, 232), p2 = plat(905, 1195, 362), p3 = plat(905, 1195, 492), pt = plat(905, 1195, 104);
      livros(912, 1190, 232, p1); livros(912, 1190, 362, p2); livros(912, 1120, 492, p3);
      bola(1160, 492, 22, 2, { p: p3 });
      ob('pato', 960, 104, { w: 52, h: 46, apoio: { p: pt }, quica: 0.45 });
      ob('piao', 1060, 104, { w: 44, h: 50, apoio: { p: pt }, quica: 0.3, cor: '#ff5252', cor2: '#ffd166' });
      ob('robo', 1140, 104, { w: 46, h: 64, apoio: { p: pt }, quica: 0.25, cor: '#90caf9' });
      ob('piao', 150, C, { w: 44, h: 50, quica: 0.3, cor: '#8e5bff', cor2: '#3ee8ff' });
      bola(232, C, 30, 0);
      ob('vaso', 318, C, { w: 56, h: 92, quica: 0.15, cor: '#e07a3f' });
      torre(398, 6);
      ob('carrinho', 560, C, { w: 92, h: 48, r: 26, quica: 0.3, cor: '#ff5252' });
      ob('ursinho', 700, C, { w: 72, h: 82, quica: 0.25, cor: '#b07a4a' });
      bola(850, C, 26, 1);
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
    } else {   // jardim
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
    }
    M.cachorro = { x: cena === 'jardim' ? 420 : 620, dir: 1, vel: 70, passo: 0, late: 0, vy: 0, y: 0, troca: 2500, cor: cena === 'quarto' ? '#f2f2f2' : '#c58b52', mancha: '#6d4c41' };
    M.total = M.obs.length + (M.quadro ? 1 : 0) + (M.arvore ? 1 : 0);
    return M;
  }

  /* ================= a partida ================= */
  function criar(cfg) {
    cfg = cfg || {};
    var rnd = cfg.aleatorio || Math.random;
    var nJog = cfg.jogadores === 2 ? 2 : 1;
    var duracao = typeof cfg.duracao === 'number' ? cfg.duracao : 60;
    var cena = CENAS.indexOf(cfg.cenaCasa) >= 0 ? cfg.cenaCasa : CENAS[Math.floor(rnd() * 3) % 3];
    var M = montar(cena, rnd);
    var eventos = [], fase = 'pronto', tempo = 0, chegou100 = false, ultimaPct = 0;
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
    function bagunca() {
      var n = 0; M.obs.forEach(function (o) { if (baguncado(o)) n++; });
      if (M.quadro && Math.abs(M.quadro.repouso) > 0.12) n++;
      if (M.arvore && M.folhasChao.length >= 12) n++;
      return Math.min(1, n / M.total);
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
        if (o.dorme || o.fora) { if (o.gira > 0) o.gira = Math.max(0, o.gira - dt); return; }
        var antY = o.y + meiaAltura(o);
        o.vy += G * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.ang += o.va * dt;
        if (o.gira > 0) o.gira = Math.max(0, o.gira - dt);
        var mh = meiaAltura(o), mw = meiaLargura(o), baixo = o.y + mh, pousou = false;
        // saída pela janela aberta (sala/quarto) ou por cima da cerca (jardim)
        var jan = M.janela, spd = Math.hypot(o.vx, o.vy);
        if (jan && jan.abre > 0.55 && (o.tipo === 'bola' || o.tipo === 'pato' || o.tipo === 'maca') && spd > 350 && dentro(o, { x: jan.x + 20, y: jan.y + 20, w: jan.w - 40, h: jan.h - 40 })) { o.fora = 0.001; o.saida = { x: jan.x + jan.w / 2, y: jan.y + jan.h / 2 }; ponto(o.ult || 0, 20, 'tchau', o.x, o.y, { texto: '👋 Tchau, ' + nome(o) + '! +20', festa: true }); return; }
        if (M.jardim && (o.x < -o.r || o.x > W + o.r) && o.y < 420) { o.fora = 0.001; o.saida = { x: o.x < 0 ? -200 : W + 200, y: o.y - 80 }; ponto(o.ult || 0, 20, 'tchau', clamp(o.x, 80, W - 80), o.y, { texto: '🚀 Lá se foi! +20', festa: true }); return; }
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
          o.vx *= o.tipo === 'carrinho' ? 0.995 : o.tipo === 'bola' ? 0.985 : 0.82; o.va *= 0.8;
          if (o.tipo === 'bola' || o.tipo === 'maca' || (o.tipo === 'carrinho')) o.va = o.vx / Math.max(10, o.r);   // rola
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
          var B = obs[b]; if (B.fora || (A.dorme && B.dorme)) continue;
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
      cachorro(dt);
    }
    function nome(o) { return { bola: 'bola', pato: 'patinho', maca: 'maçã' }[o.tipo] || 'brinquedo'; }

    /* ---- o cachorrinho anda, late e corre atrás da bola ---- */
    function cachorro(dt) {
      var c = M.cachorro; if (!c) return;
      c.troca -= dt * 1000; c.late = Math.max(0, c.late - dt);
      if (c.y < 0 || c.vy < 0) { c.vy += G * dt; c.y = Math.min(0, c.y + c.vy * dt); if (c.y === 0) c.vy = 0; }
      // procura uma bola no chão por perto
      var alvo = null, melhor = 520;
      M.obs.forEach(function (o) { if (o.tipo !== 'bola' || o.fora || o.ult == null || o.y < M.chao - 60) return; var d = Math.abs(o.x - c.x); if (d < melhor) { melhor = d; alvo = o; } });   // só brinca com a bola que a criança já mexeu
      var vel = c.late > 0 ? 0 : alvo ? 190 : 70;
      if (alvo) {
        c.dir = alvo.x > c.x ? 1 : -1;
        if (Math.abs(alvo.x - c.x) < 70 && Math.abs(alvo.vx) < 80) {   // alcançou a bola parada (ou quase): dá um focinhaço
          acordar(alvo); alvo.vx = c.dir * (380 + rnd() * 260); alvo.vy = -380 - rnd() * 200; alvo.ult = alvo.ult || 0;
          if (c.troca < 0) { c.late = 0.5; c.troca = 1500; emitir({ t: 'casa', j: alvo.ult, som: 'latido', x: c.x, y: M.chao - 90, pontos: 0, texto: 'AU AU! 🐶' }); }
        }
      } else if (c.troca < 0) { c.dir = rnd() < 0.5 ? -1 : 1; c.troca = 2500 + rnd() * 3500; }
      c.x += c.dir * vel * dt; c.passo += vel * dt * 0.08;
      if (c.x < 70) { c.x = 70; c.dir = 1; } if (c.x > W - 70) { c.x = W - 70; c.dir = -1; }
    }
    function sacudirArvore(j, x, y, pelaMao) {
      var A = M.arvore; if (!A || A.treme > 0.25) return;
      A.treme = 0.6;
      for (var k = 0; k < 10; k++) M.folhas.push({ x: A.copa.x + (rnd() - 0.5) * A.copa.r * 1.6, y: A.copa.y + (rnd() - 0.3) * A.copa.r, vy: 70 + rnd() * 70, vx: (rnd() - 0.5) * 40, t: 0, fase: rnd() * 6, rot: rnd() * 6, cor: ['#7cb342', '#9ccc65', '#fdd835', '#ff8f00'][Math.floor(rnd() * 4)], cam: rnd() * 8 });
      M.passaros.forEach(function (p) { if (p.voando === 0 && p.volta === 0) { p.voando = 0.001; p.vx = (p.x > A.copa.x ? 1 : -1) * (180 + rnd() * 120); p.vy = -150 - rnd() * 100; } });
      ponto(j, pelaMao ? 6 : 10, 'folhas', x, y, { texto: '🍃 +' + (pelaMao ? 6 : 10) });
    }

    /* ---- o toque/movimento da criança ---- */
    function movimento(j, pontos, ts) {
      if (fase !== 'jogando' || !jogadores[j]) return;
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
      jg.rastro = recentes.slice(-24);
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
      var C = M.cachorro; if (C && C.late <= 0 && Math.abs(b.x - C.x) < 75 && b.y > M.chao - 130 + C.y) { C.late = 0.8; C.vy = -520; C.y = -1; C.dir = b.x < C.x ? 1 : -1; ponto(j, 3, 'latido', C.x, M.chao - 110, { texto: 'AU AU! 🐶', festa: true }); }
      // jardim
      if (M.arvore && Math.hypot(b.x - M.arvore.copa.x, b.y - M.arvore.copa.y) < M.arvore.copa.r) sacudirArvore(j, b.x, b.y, true);
      var Bl = M.balanco; if (Bl) { var sx = Bl.x + Math.sin(Bl.ang) * Bl.L, sy = Bl.topo + Math.cos(Bl.ang) * Bl.L; if (seg({ x: sx, y: sy }, 55) && tempo >= (Bl.ate || 0)) { Bl.ate = tempo + 300; Bl.va += clamp((vx || (b.x < sx ? 300 : -300)) * 0.003, -2.4, 2.4); ponto(j, 4, 'balanco', sx, sy, { texto: '🎠 +4' }); } }
      if (M.flores) M.flores.forEach(function (f) { var fx = f.x, fy = M.chao - f.h; if (seg({ x: fx, y: fy }, 34) && tempo >= (f.ate || 0)) { f.ate = tempo + 400; f.va += (vx >= 0 ? 1 : -1) * 6; for (var k = 0; k < 4; k++) M.petalas.push({ x: fx, y: fy, vx: (rnd() - 0.5) * 240, vy: -120 - rnd() * 160, t: 0, cor: f.cor }); ponto(j, 2, 'flor', fx, fy, {}); } });
      if (M.borboletas) M.borboletas.forEach(function (bb) { if (Math.hypot(bb.x - b.x, bb.y - b.y) < 120) { var d = Math.hypot(bb.x - b.x, bb.y - b.y) || 1; bb.vx = (bb.x - b.x) / d * 380; bb.vy = (bb.y - b.y) / d * 380; bb.foge = 0.8; } });
      if (M.passaros) M.passaros.forEach(function (p) { if (p.voando === 0 && p.volta === 0 && Math.hypot(p.x - b.x, p.y - b.y) < 60) { p.voando = 0.001; p.vx = (p.x > b.x ? 1 : -1) * 220; p.vy = -180; ponto(j, 4, 'passaro', p.x, p.y, { texto: '🐦 +4' }); } });
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
        var som = { bola: 'boing', pato: 'pato', carrinho: 'vrum', bloco: 'bloco', livro: 'tum', almofada: 'fofo', ursinho: 'fofo', piao: 'piao', robo: 'robo', vaso: 'tum', maca: 'boing', balde: 'tum', regador: 'tum', gnomo: 'tum' }[o.tipo] || 'tum';
        ponto(j, 2, som, o.x, o.y, { festa: true, silencioso: false });
        if (!antes) { jogadores[j].pontos += 8; emitir({ t: 'casa', j: j, som: '', x: o.x, y: o.y - 40, pontos: 8, texto: '+10' }); }
      });
    }

    function avancar(dtMs) {
      if (fase !== 'jogando') return;
      var dt = Math.min(dtMs, 50) / 1000; tempo += dtMs;
      // dois passos por quadro: a física fica estável mesmo no celular lento
      passo(dt / 2); passo(dt / 2);
      var pct = bagunca();
      if (pct >= 1 && !chegou100) { chegou100 = true; jogadores.forEach(function (jg) { jg.pontos += 100; }); emitir({ t: 'bagunca100' }); }
      ultimaPct = pct;
      if (duracao && tempo >= duracao * 1000) terminar();
    }
    function comecar() { fase = 'jogando'; tempo = 0; }
    function pausar() { if (fase === 'jogando') fase = 'pausa'; }
    function continuar() { if (fase === 'pausa') fase = 'jogando'; }
    function terminar() {
      if (fase === 'fim') return; fase = 'fim';
      var ordem = jogadores.map(function (jg, i) { return { j: i, pontos: Math.round(jg.pontos) }; }).sort(function (a, b) { return b.pontos - a.pontos; });
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
        fase: fase, modo: 'bagunca', modoBase: 'bagunca', tempo: tempo, restante: duracao ? Math.max(0, Math.ceil((duracao * 1000 - tempo) / 1000)) : null,
        jogadores: jogadores.map(function (jg, j) { return { pontos: Math.round(jg.pontos), vidas: jg.vidas, combo: 0, poder: null, poderAte: 0, lento: false, raia: raia(j), zonaChute: 0.6, rastro: jg.rastro.slice(-8), corpo: jg.corpo, invencivel: false, esqueleto: null }; }),
        coisas: [], trave: null, bpm: 0, casa: M, bagunca: ultimaPct
      };
    }
    return {
      comecar: comecar, pausar: pausar, continuar: continuar, terminar: terminar, avancar: avancar, movimento: movimento, esqueleto: esqueleto, corpo: corpo, calibrar: calibrar, estado: estado,
      batida: function () {}, zonaChute: function () {}, lancar: function () { return null; }, obstaculo: function () { return null; },
      eventos: function () { var e = eventos; eventos = []; return e; },
      cena: cena, W: W, H: H
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
    if (M.jardim) {
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
      // porta (de onde a bola volta) só como enfeite na sala
      if (M.cena === 'sala') { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(1218, 300, 44, 256); }
    }
    fundos[M.cena] = cv; return cv;
  }
  function desenhar(ctx, M, ts, leve) {
    var f = fundo(M); if (f) ctx.drawImage(f, 0, 0, W, H);
    if (M.janela) janela(ctx, M, ts);
    if (M.quadro) quadro(ctx, M.quadro);
    if (M.interruptor) interruptor(ctx, M.interruptor, M.luz);
    if (M.arvore) arvore(ctx, M, ts);
    if (M.balanco) balanco(ctx, M.balanco);
    if (M.flores) M.flores.forEach(function (fl) { flor(ctx, fl, M.chao); });
    M.folhasChao.forEach(function (fo) { folha(ctx, fo.x, fo.y, fo.rot, fo.cor); });
    M.obs.forEach(function (o) { if (o.fora === 1) return; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.ang); if (o.fora) { var e = 1 - o.fora; ctx.scale(e, e); } coisa(ctx, o, ts); ctx.restore(); });
    if (M.cachorro) cachorro(ctx, M, ts);
    M.folhas.forEach(function (fo) { folha(ctx, fo.x, fo.y, fo.rot, fo.cor); });
    M.petalas.forEach(function (p) { ctx.fillStyle = p.cor; ctx.globalAlpha = Math.max(0, 1 - p.t / 1.4); ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 4, p.t * 4, 0, PI2); ctx.fill(); ctx.globalAlpha = 1; });
    if (M.passaros) M.passaros.forEach(function (p) { passaro(ctx, p, ts); });
    if (M.borboletas) M.borboletas.forEach(function (b) { borboleta(ctx, b, ts); });
    if (M.lustre) lustre(ctx, M, ts, leve);
  }
  /* escuro do quarto apagado (a janela e o lustre aceso ficam claros); por cima de tudo, menos do placar */
  function luz(ctx, M, ts) {
    if (M.jardim) return;
    var cor = CORES_LUZ[M.corLuz];
    if (!M.luz) {
      ctx.save(); ctx.fillStyle = 'rgba(8,10,40,.62)'; ctx.fillRect(0, 0, W, H);
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
  function cachorro(ctx, M, ts) {
    var c = M.cachorro, y = M.chao + c.y, anda = c.late > 0 ? 0 : 1, p = c.passo;
    ctx.save(); ctx.translate(c.x, y); ctx.scale(c.dir, 1);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 2 - c.y, 60, 9, 0, 0, PI2); ctx.fill();
    // patas
    ctx.strokeStyle = escurecer(c.cor, 0.8); ctx.lineWidth = 11; ctx.lineCap = 'round';
    [[-30, 1], [-16, -1], [24, -1], [36, 1]].forEach(function (pp) { var sw = Math.sin(p + (pp[1] > 0 ? 0 : 3.14)) * 12 * anda; ctx.beginPath(); ctx.moveTo(pp[0], -40); ctx.lineTo(pp[0] + sw, -4); ctx.stroke(); });
    // rabo abanando
    ctx.strokeStyle = c.cor; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-44, -54); ctx.quadraticCurveTo(-64, -70 + Math.sin(ts / 70) * 14, -66, -92 + Math.sin(ts / 70) * 18); ctx.stroke();
    // corpo
    ctx.fillStyle = c.cor; ctx.beginPath(); ctx.ellipse(0, -52, 50, 26, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = c.mancha; ctx.beginPath(); ctx.ellipse(-10, -60, 16, 11, 0.2, 0, PI2); ctx.fill();
    // cabeça
    var cab = c.late > 0 ? -6 : Math.sin(ts / 300) * 2;
    ctx.save(); ctx.translate(46, -84 + cab);
    ctx.fillStyle = c.cor; ctx.beginPath(); ctx.arc(0, 0, 28, 0, PI2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24, 8, 20, 14, 0, 0, PI2); ctx.fill();
    ctx.fillStyle = c.mancha; ctx.beginPath(); ctx.ellipse(-14, -4, 12, 26, 0.35 + Math.sin(ts / 90) * (c.late > 0 ? 0.4 : 0.05), 0, PI2); ctx.fill();   // orelha
    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(40, 4, 6, 0, PI2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -6, 4.5, 0, PI2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11.5, -7.5, 1.6, 0, PI2); ctx.fill();
    if (c.late > 0) { ctx.fillStyle = '#7a1f2e'; ctx.beginPath(); ctx.ellipse(28, 20, 12, 8, 0, 0, PI2); ctx.fill(); ctx.fillStyle = '#ff7a8f'; ctx.beginPath(); ctx.ellipse(28, 24, 6, 4, 0, 0, PI2); ctx.fill(); }
    else { ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(22, 18); ctx.quadraticCurveTo(30, 24, 38, 18); ctx.stroke(); ctx.fillStyle = '#ff7a8f'; ctx.beginPath(); ctx.ellipse(31, 25, 5, 7, 0, 0, PI2); ctx.fill(); }   // linguinha
    ctx.restore();
    ctx.fillStyle = '#e53935'; ctx.fillRect(30, -78, 8, 22);   // coleira
    ctx.restore();
    if (c.late > 0) { ctx.save(); ctx.font = '700 30px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 5; var tx = c.x + c.dir * 70, ty = y - 150 + Math.sin(ts / 40) * 3; ctx.strokeText('AU AU!', tx, ty); ctx.fillText('AU AU!', tx, ty); ctx.restore(); }
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
      default:
        ctx.fillStyle = o.cor || '#ccc'; arred(ctx, -w / 2, -h / 2, w, h, 6); ctx.fill();
    }
  }
  function medidor(ctx, pct, ts) {
    var w = 360, x = W / 2 - w / 2, y = 110;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; arred(ctx, x - 10, y - 6, w + 20, 40, 18); ctx.fill();
    var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#c6ff3d'); g.addColorStop(0.5, '#ffd166'); g.addColorStop(1, '#ff4fa3');
    ctx.fillStyle = 'rgba(255,255,255,.15)'; arred(ctx, x, y + 4, w, 20, 10); ctx.fill();
    ctx.fillStyle = g; arred(ctx, x, y + 4, Math.max(20, w * pct), 20, 10); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 18px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧸 ' + Math.round(pct * 100) + '%', W / 2, y + 14 + (pct >= 1 ? Math.sin(ts / 80) * 2 : 0));
    ctx.restore();
  }
  return { criar: criar, desenhar: desenhar, luz: luz, medidor: medidor, CENAS: CENAS, W: W, H: H };
});
