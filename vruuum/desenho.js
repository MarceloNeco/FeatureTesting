/* Vruuum! — desenha a corrida: céu, fundo, a estrada em 3D (curvas e morros), enfeites, coisas da
   pista, trânsito, o carro de cada jogador, efeitos (confete, +1, turbo) e o placar.
   Com 2 jogadores a tela divide: lado a lado (tela deitada) ou um em cima do outro (em pé). */
(function (raiz) {
  'use strict';
  var P = raiz.VruuumPista, S = raiz.VruuumSprites;
  var SEG = P.SEG, LARG = P.LARGURA;
  var ALTURA_CAM = 1000;
  var PROF = 1 / Math.tan(50 * Math.PI / 180);   // campo de visão de 100°
  var JOG_Z = ALTURA_CAM * PROF;                 // distância da câmera até o carro
  var EMOJI = S.EMOJI, FONTE = S.FONTE;

  var TEMAS = {
    praia: { ceu: ['#38b6ff', '#c9f0ff'], grama: ['#f3d27a', '#ebc868'], borda: ['#ff4d6d', '#ffffff'], pista: ['#8d929c', '#868b95'], faixa: '#ffffff', sol: '#fff1a6', nome: ['Praia', 'Beach'], emoji: '🏖️', cor: '#1fa3e0' },
    floresta: { ceu: ['#5cc8ff', '#dcf7ff'], grama: ['#4cc35a', '#44b552'], borda: ['#ffffff', '#ff9f1c'], pista: ['#6e737b', '#686d75'], faixa: '#ffffff', sol: '#fff1a6', nome: ['Floresta', 'Forest'], emoji: '🌲', cor: '#1e9a4e' },
    doces: { ceu: ['#ff9ad5', '#ffe3f3'], grama: ['#ffb6e1', '#ffa8da'], borda: ['#ffffff', '#ff3d8b'], pista: ['#7a4a33', '#734530'], faixa: '#fff7c2', sol: '#fff7c2', nome: ['Terra dos Doces', 'Candy Land'], emoji: '🍭', cor: '#ff4fa3' },
    neve: { ceu: ['#8fb8ff', '#eef4ff'], grama: ['#f4f8ff', '#e4ecfb'], borda: ['#3a86ff', '#ffffff'], pista: ['#7d8590', '#77808a'], faixa: '#ffd166', sol: '#ffffff', nome: ['Montanha de Neve', 'Snow Mountain'], emoji: '❄️', cor: '#3a86ff' },
    neon: { ceu: ['#0d0630', '#4b1a7a'], grama: ['#1b1250', '#160f45'], borda: ['#ff2bd6', '#2bf4ff'], pista: ['#2a2550', '#25204a'], faixa: '#2bf4ff', sol: null, nome: ['Cidade Neon', 'Neon City'], emoji: '🌃', cor: '#9b5de5', noite: true }
  };
  var CORES = ['#ff3b5c', '#ffb703', '#3a86ff', '#2ec4b6', '#9b5de5', '#ff7ac6'];
  var PILOTOS = ['🐱', '🐶', '🦄', '🐼', '🐸', '🐰', '🦊', '🐯'];

  var lingua = 'pt', base = null, carrosJog = [], portais = [], largada = null, chegada = null;
  var ALT_VOO = 6500;               // altura do voo acima da estrada (quem vai de avião, jato ou helicóptero)
  var VOA = [], VEIC = [];          // por jogador: voa? e a ficha do veículo
  var V = function () { return raiz.VruuumVeiculos; };
  // o que aparece no lugar de cada coisa quando se está voando
  var NO_CEU = { cone: 'passaro', lama: 'nuvemRaio', turbo: 'anel', rampa: 'corrente', onibus: 'balao' };
  function sprCeu(tipo) { if (NO_CEU[tipo]) return NO_CEU[tipo]; if (tipo.indexOf('carro') === 0) return 'aviaoTrafego' + tipo.slice(5); return tipo; }
  function hash(i) { return ((i * 9301 + 49297) % 233280) / 233280; }
  var VS = [];   // estado de cada vista (fundo andando, inclinação, partículas, faixas de texto)
  var porSeg = {};

  function t(pt, en) { return lingua === 'en' ? en : pt; }
  function misturar(a, b, f) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round(((x >> 16) & 255) * (1 - f) + ((y >> 16) & 255) * f), g = Math.round(((x >> 8) & 255) * (1 - f) + ((y >> 8) & 255) * f), bl = Math.round((x & 255) * (1 - f) + (y & 255) * f);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function preparar(estado, jogadores, lang) {
    lingua = lang || 'pt';
    base = S.basicos();
    carrosJog = jogadores.map(function (j) { return S.carroJogador(j.cor, j.piloto, j.veic); });
    VEIC = jogadores.map(function (j) { return V() ? V().achar(j.veic) : null; });
    VOA = jogadores.map(function (j) { return !!(V() && V().voa(j.veic)); });
    portais = estado.pista.mundos.map(function (m) { var tm = TEMAS[m]; return S.arco(tm.emoji + ' ' + t(tm.nome[0], tm.nome[1]), tm.cor, '#ffffff', false); });
    largada = S.arco(t('🚦 VAI! 🚦', '🚦 GO! 🚦'), '#ff4fa3', '#ffffff', false);
    chegada = S.arco(t('🏁 CHEGADA 🏁', '🏁 FINISH 🏁'), '#1a1446', '#ffffff', true);
    VS = jogadores.map(function () { return { fundoX: 0, nuvemX: 0, lado: 0, parts: [], faixa: null, chegouT: -1 }; });
  }

  function vistas(W, H, n) {
    if (n < 2) return [{ x: 0, y: 0, w: W, h: H }];
    var g = Math.max(2, Math.round(Math.min(W, H) * 0.006));
    if (W >= H) return [{ x: 0, y: 0, w: Math.floor((W - g) / 2), h: H }, { x: Math.ceil((W + g) / 2), y: 0, w: Math.floor((W - g) / 2), h: H }];
    return [{ x: 0, y: 0, w: W, h: Math.floor((H - g) / 2) }, { x: 0, y: Math.ceil((H + g) / 2), w: W, h: Math.floor((H - g) / 2) }];
  }

  // bordas seguras (recorte da câmera, cantos arredondados, barra de gestos): só valem para a
  // vista que encosta naquela borda da tela
  function margemLocal(v, W, H, m) {
    m = m || {};
    return { t: v.y <= 0 ? (m.t || 0) : 0, r: v.x + v.w >= W - 1 ? (m.r || 0) : 0, b: v.y + v.h >= H - 1 ? (m.b || 0) : 0, l: v.x <= 0 ? (m.l || 0) : 0 };
  }
  function tamU(v) { return Math.max(12, Math.min(v.w, v.h) / 18); }
  // botão PULAR (toque): acima da seta da direita, longe do carro; coordenadas da tela inteira
  function botaoPulo(v, ml) {
    var u = tamU(v), r = u * 1.7;
    return { x: v.x + v.w - ml.r - u * 2.6, y: v.y + v.h - ml.b - u * 7.6, r: r };
  }

  // ---------- efeitos ----------
  function geom(v) { var K = Math.min(v.h > v.w ? v.w * 0.58 : v.w / 2, v.h * 0.6); return { K: K, cx: v.w / 2, cy: v.h - K - v.h * 0.05 }; }
  function texto(vs, txt, cor, tam) { vs.parts.push({ tipo: 'txt', txt: txt, cor: cor, tam: tam || 1, x: 0, y: 0, vx: 0, vy: -1.2, vida: 1.1, max: 1.1 }); }
  function confete(vs, n, lugar) {
    for (var k = 0; k < n; k++) vs.parts.push({ tipo: 'conf', cor: S.ARCO[k % 7], x: (Math.random() - 0.5) * 0.3, y: lugar === 'cima' ? -1.6 : -0.3, vx: (Math.random() - 0.5) * 2.2, vy: lugar === 'cima' ? Math.random() * 0.5 : -1.5 - Math.random() * 1.5, vida: 2 + Math.random(), max: 3, giro: Math.random() * 6 });
  }
  function evento(ev, estado) {
    var vs = VS[ev.j];
    if (ev.tipo === 'vai') { var tm0 = TEMAS[estado.pista.mundos[0]]; VS.forEach(function (v) { v.faixa = { txt: tm0.emoji + ' ' + t(tm0.nome[0], tm0.nome[1]), ate: 2.6, cor: tm0.cor }; }); return; }
    if (ev.tipo === 'mundo') { VS.forEach(function (v, k) { if (k === ev.j) { var tm = TEMAS[ev.nome]; v.faixa = { txt: tm.emoji + ' ' + t(tm.nome[0], tm.nome[1]) + '!', ate: 2.6, cor: tm.cor }; } }); return; }
    if (!vs) return;
    if (ev.tipo === 'estrela') { texto(vs, '+1', '#ffd93d', ev.ar ? 1.4 : 1); if (ev.ar) confete(vs, 8); }
    else if (ev.tipo === 'perdeu') { for (var k = 0; k < Math.min(ev.q, 6); k++) vs.parts.push({ tipo: 'est', x: 0, y: -0.2, vx: (Math.random() - 0.5) * 2.4, vy: -1.8 - Math.random(), vida: 1.2, max: 1.2 }); }
    else if (ev.tipo === 'batida') texto(vs, t('Opa!', 'Oops!'), '#ffffff', 1.4);
    else if (ev.tipo === 'cone' && VOA[ev.j]) texto(vs, t('Piu piu!', 'Tweet!'), '#ff9f1c', 1.2);
    else if (ev.tipo === 'lama' && VOA[ev.j]) texto(vs, t('Turbulência!', 'Turbulence!'), '#dfe6ff', 1.2);
    else if (ev.tipo === 'pulo' && VOA[ev.j]) texto(vs, ev.manual ? t('Subindo!', 'Climb!') : t('Corrente de ar!', 'Updraft!'), '#c6ff3d', 1.3);
    else if (ev.tipo === 'cone') texto(vs, t('Ops!', 'Oops!'), '#ff9f1c', 1.2);
    else if (ev.tipo === 'lama') { texto(vs, t('Splash!', 'Splash!'), '#c98a4b', 1.2); for (k = 0; k < 10; k++) vs.parts.push({ tipo: 'gota', cor: '#6b3e1f', x: (Math.random() - 0.5) * 0.4, y: -0.1, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random(), vida: 0.8, max: 0.8 }); }
    else if (ev.tipo === 'turbo') texto(vs, 'TURBO!', '#3ee8ff', 1.6);
    else if (ev.tipo === 'pulo') texto(vs, ev.manual ? t('Hop!', 'Hop!') : t('Uhuuu!', 'Wheee!'), '#c6ff3d', ev.manual ? 1.1 : 1.5);
    else if (ev.tipo === 'buzina') texto(vs, t('Bi-bi!', 'Beep-beep!'), '#ff7ac6', 1.1);
    else if (ev.tipo === 'chegou') { vs.chegouT = 0; vs.lugar = ev.lugar; confete(vs, 70, 'cima'); }
  }
  function passo(dt, estado, entradas) {
    estado.jogadores.forEach(function (j, k) {
      var vs = VS[k]; if (!vs) return;
      var seg = P.achar(estado.pista, j.z), pct = j.vel / estado.pista.cfg.velMax;
      vs.fundoX = (vs.fundoX + seg.curva * pct * dt * 0.015 + 10) % 1;
      vs.nuvemX = (vs.nuvemX + seg.curva * pct * dt * 0.007 + dt * 0.004 + 10) % 1;
      var alvo = (entradas && entradas[k] && entradas[k].dir) || 0;
      vs.lado += (alvo - vs.lado) * Math.min(1, dt * 8);
      if (vs.faixa) { vs.faixa.ate -= dt; if (vs.faixa.ate <= 0) vs.faixa = null; }
      if (vs.chegouT >= 0) { vs.chegouT += dt; if (vs.chegouT < 2.5 && Math.random() < dt * 6) confete(vs, 6, 'cima'); }
      vs.parts = vs.parts.filter(function (p) { p.vida -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.tipo !== 'txt') p.vy += 3 * dt; if (p.tipo === 'conf') { p.vy = Math.min(p.vy, 0.8); p.giro += dt * 8; } return p.vida > 0; });
    });
  }

  // ---------- desenho ----------
  function poligono(c, x1, y1, x2, y2, x3, y3, x4, y4, cor) { c.fillStyle = cor; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fill(); }
  function sprite(c, spr, esc, x, y, clip, w) {
    var dw = spr.w * esc, dh = spr.h * esc, dx = x - dw / 2, dy = y - dh;
    if (dw < 1 || dx > w || dx + dw < 0) return;
    var corte = clip ? Math.max(0, dy + dh - clip) : 0;
    if (corte >= dh) return;
    var ih = spr.img.height * (1 - corte / dh);
    if (ih < 1) return;
    c.drawImage(spr.img, 0, 0, spr.img.width, ih, dx, dy, dw, dh - corte);
  }
  function camada(c, img, w, yBase, alt, desloc, alfa) {
    var lw = img.width * alt / img.height, x0 = -((desloc % 1 + 1) % 1) * lw;
    c.globalAlpha = alfa;
    for (var x = x0; x < w; x += lw) c.drawImage(img, x, yBase - alt, lw + 1, alt);
    c.globalAlpha = 1;
  }

  var aX = new Float64Array(400), aY = new Float64Array(400), aS = new Float64Array(400), aClip = new Float64Array(400), aZ = new Float64Array(400);

  function desenharVista(c, v, e, ji, op) {
    var j = e.jogadores[ji], pista = e.pista, segs = pista.segs, vs = VS[ji];
    var w = v.w, h = v.h, g = geom(v), K = g.K, cx = g.cx, cy = g.cy;
    c.save(); c.beginPath(); c.rect(v.x, v.y, w, h); c.clip(); c.translate(v.x, v.y);
    if (j.tremor > 0 || j.rodando > 0) c.translate((Math.random() - 0.5) * K * 0.025, (Math.random() - 0.5) * K * 0.025);

    var camZ = Math.max(0, j.z - JOG_Z);
    var baseI = Math.floor(camZ / SEG), basePct = (camZ % SEG) / SEG;
    var jSeg = P.achar(pista, j.z), jPct = (j.z % SEG) / SEG;
    var jY = jSeg.p1.y + (jSeg.p2.y - jSeg.p1.y) * jPct;
    var voa = !!VOA[ji], camY = jY + ALTURA_CAM + (voa ? ALT_VOO : 0), camX = j.x * LARG;

    // céu e fundo: misturam com o mundo anterior logo depois do portal
    var m = jSeg.mundo, tm = TEMAS[pista.mundos[m]], antes = m > 0 ? TEMAS[pista.mundos[m - 1]] : tm;
    var f = m > 0 ? Math.min(1, (jSeg.i - Math.round(pista.chegada / 4 * m)) / 90) : 1;
    var ceu = c.createLinearGradient(0, 0, 0, cy);
    ceu.addColorStop(0, misturar(antes.ceu[0], tm.ceu[0], f)); ceu.addColorStop(1, misturar(antes.ceu[1], tm.ceu[1], f));
    c.fillStyle = ceu; c.fillRect(0, 0, w, h);
    var noite = (tm.noite ? f : 0) + (antes.noite && f < 1 ? 1 - f : 0);
    if (noite > 0) camada(c, base.estrelasCeu, w, cy, cy, vs.nuvemX * 0.5, noite);
    var solCor = tm.sol || antes.sol;
    if (solCor && noite < 1) { c.globalAlpha = 1 - noite; c.shadowColor = solCor; c.shadowBlur = K * 0.2; c.fillStyle = solCor; c.beginPath(); c.arc(w * 0.78, cy * 0.35, K * 0.1, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; c.globalAlpha = 1; }
    if (noite < 1) camada(c, base.nuvens, w, cy * 0.75, cy * 0.5, vs.nuvemX, 1 - noite);
    var altF = Math.min(K * 0.55, cy * 0.9);
    if (f < 1) camada(c, base.fundos[pista.mundos[m - 1]], w, cy + 2, altF, vs.fundoX, 1);
    camada(c, base.fundos[pista.mundos[m]], w, cy + 2, altF, vs.fundoX, f);

    // estrada, do perto para o longe
    var maxy = h, x = 0, dx = -(segs[baseI].curva * basePct), n, cnt = op.dist, s;
    for (n = 0; n < op.dist; n++) {
      var i = baseI + n;
      if (i >= segs.length) { cnt = n; break; }
      s = segs[i];
      var z1 = s.p1.z - camZ, z2 = s.p2.z - camZ;
      var sc1 = PROF / z1, sc2 = PROF / z2;
      var X1 = cx + sc1 * (x - camX) * K, Y1 = cy - sc1 * (s.p1.y - camY) * K, W1 = sc1 * LARG * K;
      var X2 = cx + sc2 * (x + dx - camX) * K, Y2 = cy - sc2 * (s.p2.y - camY) * K, W2 = sc2 * LARG * K;
      aX[n] = X1; aY[n] = Y1; aS[n] = sc1; aClip[n] = maxy; aZ[n] = z1;
      x += dx; dx += s.curva;
      if (z1 <= PROF || Y2 >= Y1 || Y2 >= maxy) continue;
      var ts = TEMAS[pista.mundos[s.mundo]], par = s.listra;
      c.fillStyle = ts.grama[par]; c.fillRect(0, Y2, w, Y1 - Y2 + 1);
      var r1 = W1 / 7, r2 = W2 / 7;
      Y1 += 1;   // 1 pixel de sobra: sem risquinhos entre um pedaço e outro
      poligono(c, X1 - W1 - r1, Y1, X1 - W1, Y1, X2 - W2, Y2, X2 - W2 - r2, Y2, ts.borda[par]);
      poligono(c, X1 + W1 + r1, Y1, X1 + W1, Y1, X2 + W2, Y2, X2 + W2 + r2, Y2, ts.borda[par]);
      poligono(c, X1 - W1, Y1, X1 + W1, Y1, X2 + W2, Y2, X2 - W2, Y2, ts.pista[par]);
      if (s.xadrez) {
        for (var q = 0; q < 8; q++) {
          var a = -1 + q / 4, b = a + 0.25;
          poligono(c, X1 + W1 * a, Y1, X1 + W1 * b, Y1, X2 + W2 * b, Y2, X2 + W2 * a, Y2, (q + s.i) % 2 ? '#111' : '#fff');
        }
      } else if (!par) {
        var l1 = W1 / 32, l2 = W2 / 32;
        for (var fx = -1 / 3; fx < 0.5; fx += 2 / 3) poligono(c, X1 + W1 * fx - l1, Y1, X1 + W1 * fx + l1, Y1, X2 + W2 * fx + l2, Y2, X2 + W2 * fx - l2, Y2, ts.faixa);
      }
      maxy = Y2;
    }

    // quem voa: névoa sobre o chão lá embaixo (dá a sensação de altura) e a rota no ar, um caminho de luz
    if (voa) {
      var hz0 = Math.max(0, Math.min(h, cy)), nev = c.createLinearGradient(0, hz0, 0, h);
      nev.addColorStop(0, 'rgba(255,255,255,.55)'); nev.addColorStop(1, 'rgba(220,240,255,.22)');
      c.fillStyle = nev; c.fillRect(0, hz0, w, h - hz0);
      var trilhos = [[], []];
      for (n = cnt - 2; n >= 0; n--) {
        if (aZ[n] <= PROF) continue;
        var la = aS[n] * ALT_VOO * K, lb = aS[n + 1] * ALT_VOO * K, LY1 = aY[n] - la, LY2 = aY[n + 1] - lb;
        var LW1 = aS[n] * LARG * K, LW2 = aS[n + 1] * LARG * K, sg = segs[baseI + n];
        if (LY2 > h + 40) continue;
        trilhos[0].push(aX[n] - LW1, LY1); trilhos[1].push(aX[n] + LW1, LY1);
        c.globalAlpha = sg.xadrez ? 0.8 : (sg.listra ? 0.2 : 0.11);
        poligono(c, aX[n] - LW1, LY1, aX[n] + LW1, LY1, aX[n + 1] + LW2, LY2, aX[n + 1] - LW2, LY2, sg.xadrez ? ((baseI + n) % 2 ? '#111' : '#fff') : '#bfe9ff');
        c.globalAlpha = 1;
        if ((baseI + n) % 4 === 0) {
          var rl = Math.max(1.5, LW1 * 0.035), corL = (baseI + n) % 8 ? '#ffd166' : '#ff4fa3';
          c.shadowColor = corL; c.shadowBlur = rl * 3; c.fillStyle = corL;
          c.beginPath(); c.arc(aX[n] - LW1, LY1, rl, 0, Math.PI * 2); c.arc(aX[n] + LW1, LY1, rl, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0;
        }
      }
      // trilhos brilhantes nas duas bordas da rota
      c.lineJoin = 'round'; c.lineCap = 'round';
      trilhos.forEach(function (tr) {
        if (tr.length < 4) return;
        c.strokeStyle = 'rgba(62,232,255,.85)'; c.lineWidth = Math.max(2, K * 0.012); c.shadowColor = '#3ee8ff'; c.shadowBlur = K * 0.03;
        c.beginPath(); c.moveTo(tr[0], tr[1]); for (var q = 2; q < tr.length; q += 2) c.lineTo(tr[q], tr[q + 1]); c.stroke(); c.shadowBlur = 0;
      });
    }

    // enfeites, coisas, trânsito e o outro jogador, do longe para o perto
    var outro = e.jogadores.length === 2 ? e.jogadores[1 - ji] : null, oSeg = outro ? Math.floor(outro.z / SEG) : -1;
    for (n = cnt - 1; n >= 0; n--) {
      if (aZ[n] <= PROF) continue;
      var idx = baseI + n; s = segs[idx];
      var esc = aS[n] * K, sx = aX[n], sy = aY[n], clip = aClip[n], k2;
      var syAr = sy - esc * ALT_VOO;   // a altura do voo neste pedaço
      for (k2 = 0; n > 3 && k2 < s.enfeites.length; k2++) {   // enfeite colado na câmera taparia a tela
        var en = s.enfeites[k2], arco = en.tipo === 'portal' || en.tipo === 'chegada' || en.tipo === 'largada', spr = en.tipo === 'portal' ? portais[en.mundo] : en.tipo === 'chegada' ? chegada : en.tipo === 'largada' ? largada : base[en.tipo];
        if (!spr) continue;
        if (voa && arco) sprite(c, spr, esc, sx + esc * en.x * LARG, syAr + esc * 1900, 0, w);   // no céu, o portal fica na altura do voo
        else sprite(c, spr, esc, sx + esc * en.x * LARG, sy, clip, w);
      }
      if (voa && n > 3 && idx % 6 === 0) {   // nuvens dos lados, em alturas diferentes
        var hz = hash(idx), lado = hz < 0.5 ? -1 : 1, tm2 = TEMAS[pista.mundos[s.mundo]];
        sprite(c, base[tm2.noite ? 'nuvemNoite' : 'nuvemFofa'], esc, sx + esc * lado * (2.2 + hash(idx + 7) * 1.6) * LARG, syAr + esc * (hash(idx + 3) - 0.35) * 2600, 0, w);
      }
      for (k2 = 0; k2 < s.coisas.length; k2++) {
        var co = s.coisas[k2];
        if (co.pego[ji]) continue;
        var alt = co.alt;
        if (co.tipo === 'estrela') alt += Math.sin(e.t * 5 + idx) * 80;
        if (voa) sprite(c, base[sprCeu(co.tipo)], esc, sx + esc * co.x * LARG, syAr - esc * (alt + (co.tipo === 'anel' || co.tipo === 'turbo' ? -150 : 0)), 0, w);
        else sprite(c, base[co.tipo], esc, sx + esc * co.x * LARG, sy - esc * alt, clip, w);
      }
      var cs = porSeg[idx];
      if (cs) for (k2 = 0; k2 < cs.length; k2++) {
        if (voa) sprite(c, base[sprCeu(cs[k2].tipo)], esc, sx + esc * cs[k2].x * LARG, syAr - esc * 200, 0, w);
        else sprite(c, base[cs[k2].tipo], esc, sx + esc * cs[k2].x * LARG, sy, clip, w);
      }
      if (idx === oSeg && outro.z > j.z - JOG_Z * 0.6) {
        var lift = outro.pulo > 0 ? Math.sin(Math.PI * (1 - outro.pulo / (outro.puloMax || raiz.VruuumMotor.PULO))) * 1400 * (outro.puloMax || 1.1) / 1.1 : 0;
        var oVoa = !!VOA[outro.n];   // o outro pode estar voando enquanto eu vou de carro (e vice-versa)
        sprite(c, carrosJog[outro.n], esc, sx + esc * outro.x * LARG, (oVoa ? syAr : sy) - esc * lift, oVoa || voa ? 0 : clip, w);
      }
    }

    desenharCarro(c, j, vs, g, h, w, e);
    desenharEfeitos(c, vs, g, w, h);
    desenharPlacar(c, e, j, ji, w, h, K, op, v);
    c.restore();
  }

  function desenharCarro(c, j, vs, g, h, w, e) {
    var K = g.K, esc = K / ALTURA_CAM, spr = carrosJog[j.n], cw = spr.w * esc, ch = spr.h * esc;
    var chao = g.cy + K, lift = j.pulo > 0 ? Math.sin(Math.PI * (1 - j.pulo / (j.puloMax || raiz.VruuumMotor.PULO))) * K * 0.42 * (j.puloMax || 1.1) / 1.1 : 0;
    if (j.fora && j.vel > 100) lift += Math.random() * K * 0.012;
    if (j.turbo > 0) {
      var tr = Math.min(1, j.turbo), lw = cw * 0.8 / 7;
      for (var k = 0; k < 7; k++) {
        var gr = c.createLinearGradient(0, chao - lift, 0, h); gr.addColorStop(0, S.ARCO[k]); gr.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = 0.75 * tr; c.fillStyle = gr; c.fillRect(g.cx - cw * 0.4 + k * lw, chao - lift - ch * 0.15, lw + 1, h);
      }
      c.globalAlpha = 0.5 * tr; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, K * 0.006);
      for (k = 0; k < 14; k++) { var a = Math.random() * Math.PI * 2, r0 = K * (0.7 + Math.random() * 0.3); c.beginPath(); c.moveTo(g.cx + Math.cos(a) * r0, g.cy + Math.sin(a) * r0 * 0.6); c.lineTo(g.cx + Math.cos(a) * r0 * 1.6, g.cy + Math.sin(a) * r0 * 0.96); c.stroke(); }
      c.globalAlpha = 1;
    }
    var vv = VEIC[j.n], voa = !!VOA[j.n], tt = Date.now() / 1000;
    if (voa) lift += Math.sin(tt * 2.2) * K * 0.012;   // flutuando no ar
    if (lift > 0 && !voa) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse ? c.ellipse(g.cx, chao, cw * 0.45 * (1 - lift / K), ch * 0.06, 0, 0, Math.PI * 2) : c.arc(g.cx, chao, cw * 0.4, 0, Math.PI * 2); c.fill(); }
    c.save();
    c.translate(g.cx, chao - lift);
    // avião inclina bem nas curvas; moto deita um pouco; carro quase nada
    var inclina = voa ? 0.3 : (vv && vv.id === 'moto' ? 0.2 : 0.07);
    c.rotate(vs.lado * inclina + (j.rodando > 0 ? Math.sin(j.rodando * 22) * 0.25 : 0));
    if (j.rodando > 0) c.scale(Math.max(0.25, Math.abs(Math.cos(j.rodando * 9))) * (Math.cos(j.rodando * 9) < 0 ? -1 : 1), 1);
    extrasAntes(c, vv, cw, ch, tt);
    c.drawImage(spr.img, -cw / 2, -ch, cw, ch);
    extrasDepois(c, vv, cw, ch, tt, j.turbo > 0);
    c.restore();
  }

  // partes que se mexem, desenhadas por cima do veículo (origem: meio da base do desenho)
  function extrasAntes(c, vv, cw, ch, tt) {
    if (!vv || !vv.helice) return;   // hélice girando na frente do avião (aparece em volta do corpo)
    var cy0 = -ch * 0.44, r = cw * 0.14;
    c.globalAlpha = 0.28; c.fillStyle = '#e8e8f0'; c.beginPath(); c.arc(0, cy0, r, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.6; c.strokeStyle = '#555'; c.lineWidth = Math.max(1, cw * 0.012);
    var a = tt * 40; c.beginPath(); c.moveTo(Math.cos(a) * r, cy0 + Math.sin(a) * r); c.lineTo(-Math.cos(a) * r, cy0 - Math.sin(a) * r); c.stroke();
    c.globalAlpha = 1;
  }
  function extrasDepois(c, vv, cw, ch, tt, turbo) {
    if (!vv) return;
    if (vv.rotor) {   // pás do helicóptero
      var ry = -ch * 0.88, rx = cw * 0.78, rr = ch * 0.07;
      c.globalAlpha = 0.25; c.fillStyle = '#dcdce6'; c.beginPath(); c.ellipse ? c.ellipse(0, ry, rx, rr, 0, 0, Math.PI * 2) : c.arc(0, ry, rx, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 0.8; c.strokeStyle = '#2a2a30'; c.lineWidth = Math.max(1.5, ch * 0.025);
      for (var k = 0; k < 2; k++) { var a = tt * 18 + k * Math.PI / 2; c.beginPath(); c.moveTo(Math.cos(a) * rx, ry + Math.sin(a) * rr); c.lineTo(-Math.cos(a) * rx, ry - Math.sin(a) * rr); c.stroke(); }
      c.globalAlpha = 1;
    }
    if (vv.fogo) {   // fogo do jato (azul e maior no turbo)
      var fy = -ch * 0.38, fr = cw * (turbo ? 0.09 : 0.055) * (0.85 + Math.random() * 0.3);
      var gr = c.createRadialGradient(0, fy, 0, 0, fy + fr * 0.6, fr * 1.8);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, turbo ? '#7fd3ff' : '#ffd166'); gr.addColorStop(0.7, turbo ? 'rgba(58,134,255,.6)' : 'rgba(255,123,0,.6)'); gr.addColorStop(1, 'rgba(255,80,0,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(0, fy + fr * 0.6, fr * 1.8, 0, Math.PI * 2); c.fill();
    }
  }

  function desenharEfeitos(c, vs, g, w, h) {
    var K = g.K, ox = g.cx, oy = g.cy + K * 0.7;
    vs.parts.forEach(function (p) {
      var px = ox + p.x * K, py = oy + p.y * K, f = Math.min(1, p.vida / (p.max * 0.4));
      c.globalAlpha = Math.max(0, f);
      if (p.tipo === 'txt') {
        c.font = '700 ' + Math.round(K * 0.16 * p.tam) + 'px ' + FONTE; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = K * 0.025; c.strokeStyle = 'rgba(26,20,70,.85)'; c.strokeText(p.txt, px, py - K * 0.35); c.fillStyle = p.cor; c.fillText(p.txt, px, py - K * 0.35);
      } else if (p.tipo === 'est') sprite(c, base.estrela, K / 1400, px, py, 0, w);
      else if (p.tipo === 'gota') { c.fillStyle = p.cor; c.beginPath(); c.arc(px, py, K * 0.025, 0, Math.PI * 2); c.fill(); }
      else { c.save(); c.translate(px, py); c.rotate(p.giro); c.fillStyle = p.cor; c.fillRect(-K * 0.02, -K * 0.01, K * 0.04, K * 0.02); c.restore(); }
    });
    c.globalAlpha = 1;
  }

  function pilula(c, x, y, txt, tam, cor, alinhar) {
    c.font = '700 ' + Math.round(tam) + 'px ' + FONTE + ',' + EMOJI; c.textBaseline = 'middle'; c.textAlign = 'left';
    var lw = c.measureText(txt).width + tam * 0.9, hh = tam * 1.5, x0 = alinhar === 'dir' ? x - lw : alinhar === 'meio' ? x - lw / 2 : x;
    c.fillStyle = 'rgba(26,20,70,.72)'; c.beginPath(); c.moveTo(x0 + hh / 2, y); c.lineTo(x0 + lw - hh / 2, y); c.arc(x0 + lw - hh / 2, y + hh / 2, hh / 2, -Math.PI / 2, Math.PI / 2); c.lineTo(x0 + hh / 2, y + hh); c.arc(x0 + hh / 2, y + hh / 2, hh / 2, Math.PI / 2, Math.PI * 1.5); c.fill();
    c.fillStyle = cor || '#fff'; c.fillText(txt, x0 + tam * 0.45, y + hh / 2 + tam * 0.04);
    return lw;
  }

  function desenharPlacar(c, e, j, ji, w, h, K, op, v) {
    var u = tamU(v), pista = e.pista, piloto = op.jogadores[ji].piloto, ml = margemLocal(v, op.W, op.H, op.margem);
    var topo = u * 0.5 + ml.t;
    // barra do caminho até a chegada, com os carrinhos
    var fimPilula = u * 0.5 + ml.l + pilula(c, u * 0.5 + ml.l, topo, (e.jogadores.length === 2 ? piloto + ' ' : '') + '⭐ ' + j.estrelas, u * 1.15, '#ffd93d');
    var bx = Math.max(w * 0.3, fimPilula + u * 1.2), bw = Math.min(w * 0.4, w - ml.r - bx - u * 4.2), by = topo + u * 0.55, bh = u * 0.45;
    c.fillStyle = 'rgba(26,20,70,.6)'; c.fillRect(bx, by, bw, bh);
    for (var mm = 0; mm < 4; mm++) { c.fillStyle = TEMAS[pista.mundos[mm]].cor; c.fillRect(bx + bw * mm / 4, by, bw / 4 - 1, bh); }
    c.font = Math.round(u * 0.9) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏁', bx + bw + u * 0.6, by + bh / 2);
    e.jogadores.forEach(function (o) {
      var p = Math.min(1, o.z / pista.zChegada), px = bx + bw * p;
      c.beginPath(); c.arc(px, by + bh / 2, u * 0.55, 0, Math.PI * 2); c.fillStyle = op.jogadores[o.n].cor; c.fill(); c.lineWidth = o.n === ji ? u * 0.14 : u * 0.06; c.strokeStyle = '#fff'; c.stroke();
      c.font = Math.round(u * 0.62) + 'px ' + EMOJI; c.fillStyle = '#000'; c.fillText(op.jogadores[o.n].piloto, px, by + bh / 2 + u * 0.03);
    });
    var kmh = Math.round(j.vel / pista.cfg.velMax * 120);
    pilula(c, u * 0.5 + ml.l, h - ml.b - u * 2.2, kmh + ' km/h', u * 0.9, j.turbo > 0 ? '#3ee8ff' : '#ffffff');

    // contagem e "VAI!"
    var grande = null;
    if (e.fase === 'contagem') grande = String(Math.ceil(e.contagem));
    else if (e.t < 0.9) grande = t('VAI!', 'GO!');
    if (grande) {
      var fr = e.fase === 'contagem' ? e.contagem % 1 : e.t / 0.9, tam = K * (0.5 + (1 - fr) * 0.25);
      c.font = '700 ' + Math.round(tam) + 'px ' + FONTE; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = tam * 0.08; c.strokeStyle = '#1a1446'; c.strokeText(grande, w / 2, h * 0.38); c.fillStyle = e.fase === 'contagem' ? '#ffd166' : '#c6ff3d'; c.fillText(grande, w / 2, h * 0.38);
    }
    var vs = VS[ji];
    if (vs.faixa) {
      c.globalAlpha = Math.min(1, vs.faixa.ate * 2);
      pilula(c, w / 2, h * 0.2, vs.faixa.txt, u * 1.3, '#ffffff', 'meio');
      c.globalAlpha = 1;
    }
    if (vs.chegouT >= 0) {
      var tc = K * 0.2 * Math.min(1, vs.chegouT * 3);
      c.font = '700 ' + Math.round(tc) + 'px ' + FONTE + ',' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle';
      var tx = e.jogadores.length === 2 ? (vs.lugar === 1 ? t('🥇 Chegou primeiro!', '🥇 First place!') : t('🏁 Chegou!', '🏁 Finished!')) : t('🏁 Chegou!', '🏁 Finished!');
      c.lineWidth = tc * 0.1; c.strokeStyle = '#1a1446'; c.strokeText(tx, w / 2, h * 0.32); c.fillStyle = '#ffd166'; c.fillText(tx, w / 2, h * 0.32);
    }
    // setas de toque
    if (op.toque && !j.chegou) {
      c.globalAlpha = 0.28; c.fillStyle = '#ffffff';
      var ay = h - ml.b - u * 3.4, as = u * 1.3, xl = ml.l + u * 1.2, xr = w - ml.r - u * 1.2;
      poligono(c, xl, ay, xl + as, ay - as, xl + as, ay + as, xl, ay, '#fff');
      poligono(c, xr, ay, xr - as, ay - as, xr - as, ay + as, xr, ay, '#fff');
      c.globalAlpha = 1;
      var bp = botaoPulo(v, ml), bx2 = bp.x - v.x, by2 = bp.y - v.y, pronto = j.recarga <= 0 && j.pulo <= 0;
      c.globalAlpha = pronto ? 0.85 : 0.45;
      c.fillStyle = 'rgba(26,20,70,.55)'; c.beginPath(); c.arc(bx2, by2, bp.r, 0, Math.PI * 2); c.fill();
      c.lineWidth = u * 0.22; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
      if (!pronto) { c.strokeStyle = '#c6ff3d'; c.beginPath(); c.arc(bx2, by2, bp.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - j.recarga / raiz.VruuumMotor.RECARGA)); c.stroke(); }
      else { c.strokeStyle = '#c6ff3d'; c.stroke(); }
      c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '700 ' + Math.round(u * 1.3) + 'px ' + FONTE; c.fillText('⬆', bx2, by2 - u * 0.25);
      c.font = '700 ' + Math.round(u * 0.55) + 'px ' + FONTE; c.fillText(t('PULAR', 'JUMP'), bx2, by2 + u * 0.8);
      c.globalAlpha = 1;
    }
  }

  function desenhar(c, W, H, estado, op) {
    porSeg = {};
    estado.carros.forEach(function (car) { var i = Math.floor(car.z / SEG); (porSeg[i] || (porSeg[i] = [])).push(car); });
    var vv = vistas(W, H, estado.jogadores.length);
    c.fillStyle = '#0b0a1f'; c.fillRect(0, 0, W, H);
    op.dist = op.dist || (vv.length > 1 ? 110 : 160); op.W = W; op.H = H;
    vv.forEach(function (v, k) { desenharVista(c, v, estado, k, op); });
    return vv;
  }

  // prévia da garagem: o veículo grande, animado (hélice, rotor, fogo), na estrada ou no céu
  var cachePrevia = {};
  function spritePrevia(cor, piloto, veic) {
    var k = cor + '|' + piloto + '|' + veic;
    if (!cachePrevia[k]) cachePrevia[k] = S.carroJogador(cor, piloto, veic, 360);
    return cachePrevia[k];
  }
  function previa(cv, cor, piloto, veic) {
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, vv = V() ? V().achar(veic) : null, voa = !!(V() && V().voa(veic)), tt = Date.now() / 1000;
    var spr = spritePrevia(cor, piloto, veic);
    var g = c.createLinearGradient(0, 0, 0, H);
    if (voa) { g.addColorStop(0, '#38b6ff'); g.addColorStop(1, '#c9f0ff'); } else { g.addColorStop(0, '#2a2160'); g.addColorStop(1, '#3a2f73'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (voa) {
      base = base || S.basicos();
      var nx = ((tt * 40) % (W * 1.6)) - W * 0.3;
      c.drawImage(base.nuvemFofa.img, W - nx, H * 0.08, W * 0.5, W * 0.23); c.drawImage(base.nuvemFofa.img, W * 1.5 - nx * 0.6, H * 0.45, W * 0.4, W * 0.19);
    } else {
      c.fillStyle = '#6e737b'; c.beginPath(); c.moveTo(W * 0.4, H * 0.32); c.lineTo(W * 0.6, H * 0.32); c.lineTo(W * 1.05, H); c.lineTo(-W * 0.05, H); c.fill();
      c.fillStyle = '#ffffff'; for (var k = 0; k < 5; k++) { var p = ((tt * 1.5 + k / 5) % 1), y = H * 0.32 + (H * 0.68) * p * p; c.fillRect(W / 2 - 1.5 - p * 4, y, 3 + p * 8, 4 + p * 14); }
    }
    var esc = Math.min(W * 0.78 / spr.w, H * 0.8 / spr.h), cw = spr.w * esc, ch = spr.h * esc;
    c.save(); c.translate(W / 2, H * 0.94 + (voa ? Math.sin(tt * 2.2) * H * 0.02 - H * 0.06 : Math.sin(tt * 9) * 1.2));
    if (voa) c.rotate(Math.sin(tt * 0.9) * 0.08);
    extrasAntes(c, vv, cw, ch, tt); c.drawImage(spr.img, -cw / 2, -ch, cw, ch); extrasDepois(c, vv, cw, ch, tt, false);
    c.restore();
  }
  // miniatura parada (cartões da garagem)
  function miniatura(cv, cor, piloto, veic) {
    var c = cv.getContext('2d'), spr = spritePrevia(cor, piloto, veic), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    var esc = Math.min(W * 0.9 / spr.w, H * 0.9 / spr.h), cw = spr.w * esc, ch = spr.h * esc;
    c.drawImage(spr.img, (W - cw) / 2, H * 0.95 - ch, cw, ch);
  }

  raiz.VruuumDesenho = { preparar: preparar, desenhar: desenhar, passo: passo, evento: evento, vistas: vistas, margemLocal: margemLocal, botaoPulo: botaoPulo, previa: previa, miniatura: miniatura, ALT_VOO: ALT_VOO, TEMAS: TEMAS, CORES: CORES, PILOTOS: PILOTOS };
})(this);
