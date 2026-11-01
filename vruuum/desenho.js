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
  // visual NEON (padrão): os mesmos mundos à noite, estrada escura com bordas de neon
  var NEON = {
    praia: { ceu: ['#040714', '#1b1150'], grama: ['#0b1626', '#091321'], pista: ['#15161f', '#121319'], borda: ['#00e5ff', '#ff3df0'], faixa: '#00e5ff' },
    floresta: { ceu: ['#020a08', '#0e2a22'], grama: ['#07140e', '#06110c'], pista: ['#131614', '#101311'], borda: ['#39ff88', '#ffd166'], faixa: '#39ff88' },
    doces: { ceu: ['#0f0316', '#3a0d3f'], grama: ['#170819', '#140716'], pista: ['#1a1219', '#161015'], borda: ['#ff4fd8', '#7cf9ff'], faixa: '#ff4fd8' },
    neve: { ceu: ['#030714', '#142650'], grama: ['#141b2b', '#121827'], pista: ['#151a24', '#12161f'], borda: ['#7cc8ff', '#ffffff'], faixa: '#7cc8ff' },
    neon: { ceu: ['#05010f', '#2a0b55'], grama: ['#0c0620', '#0a051b'], pista: ['#120d24', '#0f0b1f'], borda: ['#ff2bd6', '#2bf4ff'], faixa: '#2bf4ff' }
  };
  Object.keys(NEON).forEach(function (k) { var a = NEON[k], b = TEMAS[k]; a.nome = b.nome; a.emoji = b.emoji; a.cor = b.cor; a.noite = true; a.sol = null; });
  // visual: 'neon' (noite), 'colorido' (dia) ou 'misto' (alterna dia e noite a cada BLOCO pedaços da pista)
  var ESTILO = 'misto', BLOCO = 260, TRANSICAO = 40;
  function ehNeon(i) { return ESTILO === 'neon' || (ESTILO === 'misto' && Math.floor(i / BLOCO) % 2 === 1); }
  // quanto de noite no pedaço i (0 a 1), com o céu escurecendo/clareando aos poucos na troca
  function noiteEm(i) {
    if (ESTILO !== 'misto') return ESTILO === 'neon' ? 1 : 0;
    var p = i % BLOCO, f = Math.min(1, p / TRANSICAO), noiteBloco = Math.floor(i / BLOCO) % 2 === 1;
    return noiteBloco ? f : 1 - f;
  }
  function tema(nome, i) { return (i == null ? ESTILO !== 'colorido' : ehNeon(i)) ? NEON[nome] : TEMAS[nome]; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function luz(c, x, y, r, hex, a) {   // brilho redondo somando luz (fica bonito no escuro)
    if (r < 0.8) return;
    var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(hex, a)); g.addColorStop(0.35, rgba(hex, a * 0.45)); g.addColorStop(1, rgba(hex, 0));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }
  var fundosNoite = {};
  function fundoNoite(nome) {
    if (fundosNoite[nome]) return fundosNoite[nome];
    var o = base.fundos[nome], cv = document.createElement('canvas'); cv.width = o.width; cv.height = o.height;
    var c = cv.getContext('2d'); c.drawImage(o, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = nome === 'neon' ? 'rgba(6,4,24,.35)' : 'rgba(6,6,24,.72)'; c.fillRect(0, 0, cv.width, cv.height);
    // janelinhas acesas nos morros/cidade
    c.globalCompositeOperation = 'source-atop'; var s0 = 11;
    for (var k = 0; k < 70; k++) { s0 = (s0 * 9301 + 49297) % 233280; var x = s0 / 233280 * cv.width; s0 = (s0 * 9301 + 49297) % 233280; var y = cv.height * (0.55 + s0 / 233280 * 0.45); c.fillStyle = k % 3 ? 'rgba(255,209,102,.8)' : 'rgba(43,244,255,.7)'; c.fillRect(x, y, 2, 2); }
    fundosNoite[nome] = cv; return cv;
  }
  var NAO_ESCURECE = { poste: 1, predio: 1, palmeiraNeon: 1 };
  function enfeiteSpr(tipo, nS) { var b = base[tipo]; if (!b || !nS || NAO_ESCURECE[tipo]) return b; return S.escurecido(tipo, b, 0.6); }
  var ITEM_NEON = { estrela: 'estrelaNeon', turbo: 'turboNeon', lama: 'oleo' };

  var CORES = ['#ff3b5c', '#ffb703', '#3a86ff', '#2ec4b6', '#9b5de5', '#ff7ac6'];
  var PILOTOS = ['🐱', '🐶', '🦄', '🐼', '🐸', '🐰', '🦊', '🐯'];

  var lingua = 'pt', base = null, carrosJog = [], portais = [], largada = null, chegada = null;
  var ALT_VOO = 6500;               // altura do voo acima da estrada (quem vai de avião, jato ou helicóptero)
  var VOA = [], VEIC = [], INFO = [], RIV = [], porSegR = {};   // RIV: desenho, ficha e piloto de cada rival   // por jogador: voa?, a ficha do veículo e o piloto (bichinho ou selfie)
  var Cab = function () { return raiz.VruuumCabeca; };
  function infoPiloto(cor, piloto, foto, pers) {
    var P2 = raiz.VruuumPersonagens, p = pers && P2 ? P2.achar(pers) : null;
    return { emoji: piloto, foto: p ? null : (foto || null), personagem: p, cor: cor, camisa: V() ? V().tom(cor, -0.4) : '#3a2f73' };
  }
  // o piloto vivo: de costas, e de vez em quando vira, olha e sorri
  function pilotoVivo(c, vv, x0, y0, cw, ch, info, semente, periodo) { if (Cab()) Cab().desenhar(c, vv, x0, y0, cw, ch, info, Date.now() / 1000, semente, periodo); }
  var V = function () { return raiz.VruuumVeiculos; };
  // o que aparece no lugar de cada coisa quando se está voando
  var NO_CEU = { cone: 'passaro', lama: 'nuvemRaio', turbo: 'anel', rampa: 'corrente', onibus: 'balao' };
  function sprCeu(tipo) { if (NO_CEU[tipo]) return NO_CEU[tipo]; if (tipo.indexOf('carro') === 0) return 'aviaoTrafego' + tipo.slice(5); return tipo; }
  function hash(i) { return ((i * 9301 + 49297) % 233280) / 233280; }
  var VS = [];   // estado de cada vista (fundo andando, inclinação, partículas, faixas de texto)
  var porSeg = {};

  function ordinalEn(n) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'; }
  function milhar(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lingua === 'en' ? ',' : '.'); }
  function t(pt, en) { return lingua === 'en' ? en : pt; }
  function misturar(a, b, f) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    var r = Math.round(((x >> 16) & 255) * (1 - f) + ((y >> 16) & 255) * f), g = Math.round(((x >> 8) & 255) * (1 - f) + ((y >> 8) & 255) * f), bl = Math.round((x & 255) * (1 - f) + (y & 255) * f);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function preparar(estado, jogadores, lang, visual) {
    lingua = lang || 'pt';
    ESTILO = visual === 'colorido' || visual === 'neon' ? visual : 'misto';
    base = S.basicos();
    carrosJog = jogadores.map(function (j) { return S.carroJogador(j.cor, null, j.veic); });
    INFO = jogadores.map(function (j) { return infoPiloto(j.cor, j.piloto, j.foto, j.personagem); });
    VEIC = jogadores.map(function (j) { return V() ? V().achar(j.veic) : null; });
    VOA = jogadores.map(function (j) { return !!(V() && V().voa(j.veic)); });
    RIV = (estado.rivais || []).map(function (r) { return { spr: S.carroJogador(r.cor, null, r.veic), veic: V() ? V().achar(r.veic) : null, voa: !!(V() && V().voa(r.veic)), info: infoPiloto(r.cor, '', null, r.id) }; });
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
  // horizonte a ~30% da altura e o veículo com a base a 90%: a tela fica cheia, em pé ou deitado.
  // K: escala de tamanho e largura; KY: escala da altura (em pé, a estrada se estica para cima, como uma câmera mais alta)
  function geom(v) {
    var empe = v.h > v.w, cy = v.h * (empe ? 0.28 : 0.3), KY = v.h * 0.9 - cy;
    var K = Math.min(empe ? v.w * 0.62 : v.w * 0.5, KY * 1.1);
    return { K: K, KY: KY, cx: v.w / 2, cy: cy };
  }
  function texto(vs, txt, cor, tam) { vs.parts.push({ tipo: 'txt', txt: txt, cor: cor, tam: tam || 1, x: 0, y: 0, vx: 0, vy: -1.2, vida: 1.1, max: 1.1 }); }
  function confete(vs, n, lugar) {
    for (var k = 0; k < n; k++) vs.parts.push({ tipo: 'conf', cor: S.ARCO[k % 7], x: (Math.random() - 0.5) * 0.3, y: lugar === 'cima' ? -1.6 : -0.3, vx: (Math.random() - 0.5) * 2.2, vy: lugar === 'cima' ? Math.random() * 0.5 : -1.5 - Math.random() * 1.5, vida: 2 + Math.random(), max: 3, giro: Math.random() * 6 });
  }
  function evento(ev, estado) {
    var vs = VS[ev.j];
    if (ev.tipo === 'vai') { var tm0 = TEMAS[estado.pista.mundos[0]]; VS.forEach(function (v) { v.faixa = { txt: tm0.emoji + ' ' + t(tm0.nome[0], tm0.nome[1]), ate: 2.6, cor: tm0.cor }; }); return; }
    if (ev.tipo === 'mundo') { VS.forEach(function (v, k) { if (k === ev.j && !(v.faixa && v.faixaCheck > 0)) { var tm = TEMAS[ev.nome]; v.faixa = { txt: tm.emoji + ' ' + t(tm.nome[0], tm.nome[1]) + '!', ate: 2.6, cor: tm.cor }; } }); return; }
    if (!vs) return;
    if (ev.tipo === 'lugar') { texto(vs, (ev.subiu ? '⬆ ' : '⬇ ') + ev.lugar + (lingua === 'en' ? ordinalEn(ev.lugar) : 'º'), ev.subiu ? '#c6ff3d' : '#ff9f1c', 1.2); return; }
    if (ev.tipo === 'pontos') { if (ev.motivo !== 'checkpoint' && ev.motivo !== 'chegada') texto(vs, (ev.p > 0 ? '+' : '') + ev.p, ev.p > 0 ? '#ffd93d' : '#ff6b6b', ev.p >= 200 ? 1.3 : 1); return; }
    if (ev.tipo === 'checkpoint') { var tmC = TEMAS[estado.pista.mundos[ev.numero]]; vs.faixa = { txt: 'CHECKPOINT +' + milhar(500 + ev.bonus) + ' · ' + tmC.emoji + ' ' + t(tmC.nome[0], tmC.nome[1]), ate: 2.8, cor: '#c6ff3d' }; confete(vs, 30, 'cima'); vs.faixaCheck = 2.6; return; }
    if (ev.tipo === 'estrela') { if (ev.ar) confete(vs, 8); }
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
    var w = v.w, h = v.h, g = geom(v), K = g.K, KY = g.KY, cx = g.cx, cy = g.cy;
    c.save(); c.beginPath(); c.rect(v.x, v.y, w, h); c.clip(); c.translate(v.x, v.y);
    if (j.tremor > 0 || j.rodando > 0) c.translate((Math.random() - 0.5) * K * 0.025, (Math.random() - 0.5) * K * 0.025);

    var camZ = Math.max(0, j.z - JOG_Z);
    var baseI = Math.floor(camZ / SEG), basePct = (camZ % SEG) / SEG;
    var jSeg = P.achar(pista, j.z), jPct = (j.z % SEG) / SEG;
    var jY = jSeg.p1.y + (jSeg.p2.y - jSeg.p1.y) * jPct;
    var voa = !!VOA[ji], camY = jY + ALTURA_CAM + (voa ? ALT_VOO : 0), camX = j.x * LARG;

    // céu e fundo: misturam com o mundo anterior logo depois do portal
    var neon = ehNeon(jSeg.i), noiteAqui = noiteEm(jSeg.i);
    var m = jSeg.mundo, tm = tema(pista.mundos[m], jSeg.i), antes = m > 0 ? tema(pista.mundos[m - 1], jSeg.i) : tm;
    var f = m > 0 ? Math.min(1, (jSeg.i - Math.round(pista.chegada / 4 * m)) / 90) : 1;
    // céu: dia e noite misturados conforme noiteAqui (no Misto, escurece e clareia aos poucos)
    var desenhaCeu = function (T, A) {
      var cg = c.createLinearGradient(0, 0, 0, cy), tA = T[pista.mundos[m]], tB = m > 0 ? T[pista.mundos[m - 1]] : tA;
      cg.addColorStop(0, misturar(tB.ceu[0], tA.ceu[0], f)); cg.addColorStop(1, misturar(tB.ceu[1], tA.ceu[1], f));
      c.globalAlpha = A; c.fillStyle = cg; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    };
    if (noiteAqui < 1) desenhaCeu(TEMAS, 1);
    if (noiteAqui > 0) desenhaCeu(NEON, noiteAqui);
    var diaN = (TEMAS[pista.mundos[m]].noite ? 1 : 0), noite = Math.max(noiteAqui, diaN);
    if (noite > 0) camada(c, base.estrelasCeu, w, cy, cy, vs.nuvemX * 0.5, noite);
    var solCor = TEMAS[pista.mundos[m]].sol;
    if (solCor && noite < 1) { c.globalAlpha = 1 - noite; c.shadowColor = solCor; c.shadowBlur = K * 0.2; c.fillStyle = solCor; c.beginPath(); c.arc(w * 0.78, cy * 0.35, K * 0.1, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0; c.globalAlpha = 1; }
    if (noite < 1) camada(c, base.nuvens, w, cy * 0.75, cy * 0.5, vs.nuvemX, 1 - noite);
    if (noiteAqui > 0) {   // lua com halo
      c.globalAlpha = noiteAqui;
      luz(c, w * 0.8, cy * 0.3, K * 0.32, '#bfd4ff', 0.35);
      c.fillStyle = '#eef3ff'; c.beginPath(); c.arc(w * 0.8, cy * 0.3, K * 0.055, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(180,195,230,.5)'; c.beginPath(); c.arc(w * 0.8 + K * 0.015, cy * 0.3 - K * 0.01, K * 0.014, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    var altF = Math.min(K * (noiteAqui > 0.5 ? 0.85 : 0.6), cy * (noiteAqui > 0.5 ? 1.0 : 0.9));
    var camadaFundo = function (nome, alfa) {
      if (noiteAqui < 1) camada(c, base.fundos[nome], w, cy + 2, altF, vs.fundoX, alfa * (1 - noiteAqui));
      if (noiteAqui > 0) camada(c, fundoNoite(nome), w, cy + 2, altF, vs.fundoX, alfa * noiteAqui);
    };
    if (f < 1) camadaFundo(pista.mundos[m - 1], 1);
    camadaFundo(pista.mundos[m], f);

    // estrada, do perto para o longe
    var maxy = h, x = 0, dx = -(segs[baseI].curva * basePct), n, cnt = op.dist, s;
    // neon: grade no chão dos dois lados da estrada (linhas que correm para o horizonte + linhas atravessadas)
    var GRADE = [1.8, 2.7, 3.9, 5.6, 8], grade = ESTILO !== 'colorido' ? GRADE.map(function () { return [[], []]; }) : null, corGrade = null;
    for (n = 0; n < op.dist; n++) {
      var i = baseI + n;
      if (i >= segs.length) { cnt = n; break; }
      s = segs[i];
      var z1 = s.p1.z - camZ, z2 = s.p2.z - camZ;
      var sc1 = PROF / z1, sc2 = PROF / z2;
      var X1 = cx + sc1 * (x - camX) * K, Y1 = cy - sc1 * (s.p1.y - camY) * KY, W1 = sc1 * LARG * K;
      var X2 = cx + sc2 * (x + dx - camX) * K, Y2 = cy - sc2 * (s.p2.y - camY) * KY, W2 = sc2 * LARG * K;
      aX[n] = X1; aY[n] = Y1; aS[n] = sc1; aClip[n] = maxy; aZ[n] = z1;
      x += dx; dx += s.curva;
      if (z1 <= PROF || Y2 >= Y1 || Y2 >= maxy) continue;
      var nS = ehNeon(s.i), ts = tema(pista.mundos[s.mundo], s.i), par = s.listra;
      c.fillStyle = ts.grama[par]; c.fillRect(0, Y2, w, Y1 - Y2 + 1);
      var r1 = W1 / 7, r2 = W2 / 7;
      Y1 += 1;   // 1 pixel de sobra: sem risquinhos entre um pedaço e outro
      if (nS) {
        // asfalto escuro e bordas de neon: um brilho largo e fraco e um fio forte por cima
        poligono(c, X1 - W1 * 1.06, Y1, X1 + W1 * 1.06, Y1, X2 + W2 * 1.06, Y2, X2 - W2 * 1.06, Y2, ts.pista[par]);
        var e1 = W1 * 0.025, e2 = W2 * 0.025, cor0 = ts.borda[0];
        c.globalAlpha = 0.22;
        poligono(c, X1 - W1 - e1 * 4, Y1, X1 - W1 + e1 * 4, Y1, X2 - W2 + e2 * 4, Y2, X2 - W2 - e2 * 4, Y2, cor0);
        poligono(c, X1 + W1 - e1 * 4, Y1, X1 + W1 + e1 * 4, Y1, X2 + W2 + e2 * 4, Y2, X2 + W2 - e2 * 4, Y2, cor0);
        c.globalAlpha = 1;
        poligono(c, X1 - W1 - e1, Y1, X1 - W1 + e1, Y1, X2 - W2 + e2, Y2, X2 - W2 - e2, Y2, cor0);
        poligono(c, X1 + W1 - e1, Y1, X1 + W1 + e1, Y1, X2 + W2 + e2, Y2, X2 + W2 - e2, Y2, cor0);
      } else {
        poligono(c, X1 - W1 - r1, Y1, X1 - W1, Y1, X2 - W2, Y2, X2 - W2 - r2, Y2, ts.borda[par]);
        poligono(c, X1 + W1 + r1, Y1, X1 + W1, Y1, X2 + W2, Y2, X2 + W2 + r2, Y2, ts.borda[par]);
        poligono(c, X1 - W1, Y1, X1 + W1, Y1, X2 + W2, Y2, X2 - W2, Y2, ts.pista[par]);
      }
      if (s.xadrez) {
        for (var q = 0; q < 8; q++) {
          var a = -1 + q / 4, b = a + 0.25;
          poligono(c, X1 + W1 * a, Y1, X1 + W1 * b, Y1, X2 + W2 * b, Y2, X2 + W2 * a, Y2, (q + s.i) % 2 ? '#111' : '#fff');
        }
      } else if (!par) {
        var l1 = W1 / 32, l2 = W2 / 32;
        if (nS) c.globalAlpha = 0.85;
        for (var fx = -1 / 3; fx < 0.5; fx += 2 / 3) poligono(c, X1 + W1 * fx - l1, Y1, X1 + W1 * fx + l1, Y1, X2 + W2 * fx + l2, Y2, X2 + W2 * fx - l2, Y2, ts.faixa);
        c.globalAlpha = 1;
      }
      if (grade && nS && !s.tunel) {
        corGrade = corGrade || ts.borda[0];
        if (s.i % 2 === 0) { c.fillStyle = rgba(ts.borda[0], 0.2); c.fillRect(0, Y1 - 1, Math.max(0, X1 - W1 * 1.12), 1.2); c.fillRect(X1 + W1 * 1.12, Y1 - 1, Math.max(0, w - X1 - W1 * 1.12), 1.2); }
        for (var gk = 0; gk < GRADE.length; gk++) { grade[gk][0].push(X1 - W1 * GRADE[gk], Y1); grade[gk][1].push(X1 + W1 * GRADE[gk], Y1); }
      }
      maxy = Y2;
    }
    if (grade) {
      c.strokeStyle = rgba(corGrade || '#2bf4ff', 0.28); c.lineWidth = 1.2;
      grade.forEach(function (par2) { par2.forEach(function (pts) { if (pts.length < 4) return; c.beginPath(); c.moveTo(pts[0], pts[1]); for (var q = 2; q < pts.length; q += 2) c.lineTo(pts[q], pts[q + 1]); c.stroke(); }); });
    }

    // quem voa: névoa sobre o chão lá embaixo (dá a sensação de altura) e a rota no ar, um caminho de luz
    if (voa) {
      var hz0 = Math.max(0, Math.min(h, cy)), nev = c.createLinearGradient(0, hz0, 0, h);
      if (neon) { nev.addColorStop(0, 'rgba(24,16,70,.55)'); nev.addColorStop(1, 'rgba(10,8,36,.12)'); }   // à noite, névoa escura
      else { nev.addColorStop(0, 'rgba(255,255,255,.55)'); nev.addColorStop(1, 'rgba(220,240,255,.22)'); }
      c.fillStyle = nev; c.fillRect(0, hz0, w, h - hz0);
      var trilhos = [[], []];
      for (n = cnt - 2; n >= 0; n--) {
        if (aZ[n] <= PROF) continue;
        var la = aS[n] * ALT_VOO * KY, lb = aS[n + 1] * ALT_VOO * KY, LY1 = aY[n] - la, LY2 = aY[n + 1] - lb;
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
      var esc = aS[n] * K, escY = aS[n] * KY, sx = aX[n], sy = aY[n], clip = aClip[n], k2;
      var syAr = sy - escY * ALT_VOO;   // a altura do voo neste pedaço
      var nS2 = ehNeon(idx), tsN = tema(pista.mundos[s.mundo], idx);
      if (s.tunel) tunel(c, s, idx, sx, sy, syAr, esc, w, h, voa, tsN, escY);
      if (nS2 && !s.tunel && n > 2 && idx % 8 === 0) postesNeon(c, idx, sx, sy, esc, clip, tsN, w, escY);
      if (nS2 && !s.tunel && n > 3 && idx % 48 === 24) portico(c, idx, sx, voa ? syAr : sy, esc, voa ? 0 : clip, tsN, w, escY, voa);
      for (k2 = 0; n > 3 && k2 < s.enfeites.length; k2++) {   // enfeite colado na câmera taparia a tela
        var en = s.enfeites[k2], arco = en.tipo === 'portal' || en.tipo === 'chegada' || en.tipo === 'largada', spr = en.tipo === 'portal' ? portais[en.mundo] : en.tipo === 'chegada' ? chegada : en.tipo === 'largada' ? largada : enfeiteSpr(en.tipo, nS2);
        if (!spr) continue;
        if (voa && arco) sprite(c, spr, esc, sx + esc * en.x * LARG, syAr + escY * 1900, 0, w);   // no céu, o portal fica na altura do voo
        else sprite(c, spr, esc, sx + esc * en.x * LARG, sy, clip, w);
      }
      if (voa && n > 3 && idx % 6 === 0) {   // nuvens dos lados, em alturas diferentes
        var hz = hash(idx), lado = hz < 0.5 ? -1 : 1, tm2 = tema(pista.mundos[s.mundo], idx);
        sprite(c, base[tm2.noite || nS2 ? 'nuvemNoite' : 'nuvemFofa'], esc, sx + esc * lado * (2.2 + hash(idx + 7) * 1.6) * LARG, syAr + escY * (hash(idx + 3) - 0.35) * 2600, 0, w);
      }
      for (k2 = 0; k2 < s.coisas.length; k2++) {
        var co = s.coisas[k2];
        if (co.pego[ji]) continue;
        var alt = co.alt;
        if (co.tipo === 'estrela') alt += Math.sin(e.t * 5 + idx) * 80;
        if (voa) sprite(c, base[nS2 && co.tipo === 'estrela' ? 'estrelaNeon' : sprCeu(co.tipo)], esc, sx + esc * co.x * LARG, syAr - escY * (alt + (co.tipo === 'anel' || co.tipo === 'turbo' ? -150 : 0)), 0, w);
        else sprite(c, base[nS2 && ITEM_NEON[co.tipo] ? ITEM_NEON[co.tipo] : co.tipo], esc, sx + esc * co.x * LARG, sy - escY * alt, clip, w);
      }
      var cs = porSeg[idx];
      if (cs) for (k2 = 0; k2 < cs.length; k2++) {
        var tx = sx + esc * cs[k2].x * LARG;
        if (voa) { sprite(c, base[sprCeu(cs[k2].tipo)], esc, tx, syAr - escY * 200, 0, w); if (nS2 || s.tunel) luzesAviao(c, tx, syAr - escY * 200, esc, idx); }
        else { sprite(c, base[cs[k2].tipo], esc, tx, sy, clip, w); if ((nS2 || s.tunel) && sy <= clip + 2) lanternasTransito(c, cs[k2].tipo, tx, sy, esc); }
      }
      var rs = porSegR[idx];   // rivais neste pedaço (no céu se forem de avião)
      if (rs) for (k2 = 0; k2 < rs.length; k2++) {
        var rv = e.rivais[rs[k2]], rd = RIV[rs[k2]]; if (!rd || rv.z < j.z - JOG_Z * 0.6) continue;
        var rX = sx + esc * rv.x * LARG, rY = rd.voa ? syAr : sy, rW = rd.spr.w * esc, rH = rd.spr.h * esc;
        sprite(c, rd.spr, esc, rX, rY, rd.voa || voa ? 0 : clip, w);
        if (rW > 24 && (rd.voa || voa || rY <= clip)) pilotoVivo(c, rd.veic, rX - rW / 2, rY - rH, rW, rH, rd.info, 10 + rs[k2] * 2.1, 6);
        if (!rd.voa && (nS2 || s.tunel) && rY <= clip + 2) { c.save(); c.globalCompositeOperation = 'lighter'; luz(c, rX - rW * 0.36, rY - rH * 0.4, rW * 0.25, '#ff2a2a', 0.7); luz(c, rX + rW * 0.36, rY - rH * 0.4, rW * 0.25, '#ff2a2a', 0.7); c.restore(); }
      }
      if (idx === oSeg && outro.z > j.z - JOG_Z * 0.6) {
        var lift = outro.pulo > 0 ? Math.sin(Math.PI * (1 - outro.pulo / (outro.puloMax || raiz.VruuumMotor.PULO))) * 1400 * (outro.puloMax || 1.1) / 1.1 : 0;
        var oVoa = !!VOA[outro.n];   // o outro pode estar voando enquanto eu vou de carro (e vice-versa)
        var oSpr = carrosJog[outro.n], oX = sx + esc * outro.x * LARG, oY = (oVoa ? syAr : sy) - escY * lift;
        sprite(c, oSpr, esc, oX, oY, oVoa || voa ? 0 : clip, w);
        if (oSpr.w * esc > 24 && (oVoa || voa || oY <= clip)) pilotoVivo(c, VEIC[outro.n], oX - oSpr.w * esc / 2, oY - oSpr.h * esc, oSpr.w * esc, oSpr.h * esc, INFO[outro.n], outro.n * 3.3, 7);
      }
    }

    desenharCarro(c, j, vs, g, h, w, e);
    desenharEfeitos(c, vs, g, w, h);
    desenharPlacar(c, e, j, ji, w, h, K, op, v);
    c.restore();
  }

  // ---------- túnel ----------
  // no chão: molduras encaixadas uma na frente da outra (cada pedaço pinta tudo FORA da sua abertura),
  // com faixas de luz correndo; na entrada, uma parede grande em volta da boca. No céu: anéis de luz.
  function tunel(c, s, idx, sx, sy, syAr, esc, w, h, voa, ts, escY) {
    var meia = esc * LARG * 1.32, x1 = sx - meia, x2 = sx + meia, neon = ehNeon(idx), tt = Date.now() / 1000;
    var aceso = ((idx - tt * 26) % 18 + 18) % 18 < 3;   // luz que corre pelo túnel
    var corA = neon ? ts.borda[(Math.floor(idx / 3)) % 2] : '#ffd166';
    c.save(); c.globalCompositeOperation = 'source-over';
    if (voa) {   // tubo de anéis de luz em volta da rota no céu
      if (idx % 3 === 0) {
        var yT = syAr - escY * 2400, yB = syAr + escY * 900, lw = Math.max(1.2, esc * 60);
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = rgba(corA, aceso ? 0.35 : 0.14); c.lineWidth = lw * 4; c.strokeRect(x1, yT, x2 - x1, yB - yT);
        c.strokeStyle = rgba(corA, aceso ? 1 : 0.55); c.lineWidth = lw; c.strokeRect(x1, yT, x2 - x1, yB - yT);
      }
      c.restore(); return;
    }
    var alto = escY * 2700, yT2 = sy - alto, yB2 = sy + 1;
    var parede = neon ? (idx % 2 ? '#0b0a19' : '#0e0c20') : (idx % 2 ? '#4a4f5c' : '#454a57');
    var fx1 = -10, fx2 = w + 10, fy = -10;
    if (s.entrada) { fx1 = sx - meia * 3.4; fx2 = sx + meia * 3.4; fy = sy - escY * 7000; parede = neon ? '#14112a' : '#6b7080'; }
    c.fillStyle = parede; c.beginPath(); c.rect(fx1, fy, fx2 - fx1, yB2 - fy); c.rect(x1, yT2, x2 - x1, yB2 - yT2);
    try { c.fill('evenodd'); } catch (e) { c.fill(); }
    if (s.entrada) {   // contorno de luz na boca do túnel
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(neon ? ts.borda[0] : '#ffd166', 0.9); c.lineWidth = Math.max(1.5, esc * 90);
      c.beginPath(); c.moveTo(x1, yB2); c.lineTo(x1, yT2); c.lineTo(x2, yT2); c.lineTo(x2, yB2); c.stroke();
    } else if (idx % 3 === 0) {   // faixas de luz nas paredes e no teto
      c.globalCompositeOperation = 'lighter';
      var lw2 = Math.max(1, esc * 45);
      c.strokeStyle = rgba(corA, aceso ? 0.3 : 0.1); c.lineWidth = lw2 * 4;
      c.beginPath(); c.moveTo(x1, yB2); c.lineTo(x1, yT2); c.lineTo(x2, yT2); c.lineTo(x2, yB2); c.stroke();
      c.strokeStyle = rgba(corA, aceso ? 1 : 0.45); c.lineWidth = lw2;
      c.beginPath(); c.moveTo(x1, yB2); c.lineTo(x1, yT2); c.lineTo(x2, yT2); c.lineTo(x2, yB2); c.stroke();
      if (!neon) { c.fillStyle = 'rgba(255,240,180,.9)'; c.fillRect(sx - meia * 0.12, yT2, meia * 0.24, Math.max(1, esc * 60)); }
    }
    c.restore();
  }
  // postes de neon dos dois lados da estrada, piscando devagar
  function postesNeon(c, idx, sx, sy, esc, clip, ts, w, escY) {
    var tt = Date.now() / 1000;
    [-1, 1].forEach(function (lado, k) {
      var px = sx + esc * lado * 1.28 * LARG, topo = sy - escY * 2600;
      if (px < -50 || px > w + 50 || sy > clip + 4) return;
      var cor = ts.borda[(idx / 8 + k) % 2], pisca = 0.55 + 0.45 * Math.sin(tt * 3 + idx * 0.7 + k);
      c.fillStyle = '#1b1830'; c.fillRect(px - Math.max(0.6, esc * 20), topo, Math.max(1.2, esc * 40), sy - topo);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(cor, pisca); c.fillRect(px - Math.max(0.5, esc * 14), topo + escY * 150, Math.max(1, esc * 28), escY * 1500);
      luz(c, px, topo + escY * 800, esc * 1100, cor, 0.35 * pisca);
      c.fillStyle = '#1b1830'; c.fillRect(px - lado * esc * 420, topo, esc * 420, Math.max(1, escY * 50));   // braço por cima da estrada
      luz(c, px - lado * esc * 400, topo + escY * 40, esc * 380, '#fff2cc', 0.5 * pisca);
      luz(c, px, sy, esc * 700, cor, 0.18 * pisca);   // reflexo no chão
      c.restore();
    });
  }
  // pórtico de neon atravessando a estrada (no céu, um aro de luz na rota) — enche a parte de cima da tela
  function portico(c, idx, sx, base0, esc, clip, ts, w, escY, voa) {
    var meia = esc * LARG * 1.4, x1 = sx - meia, x2 = sx + meia, tt = Date.now() / 1000;
    var topo = voa ? base0 - escY * 3000 : base0 - escY * 3400, fundo = voa ? base0 + escY * 1000 : base0;
    if (x2 < -20 || x1 > w + 20 || (!voa && base0 > clip + 4)) return;
    var cor = ts.borda[(idx / 48 | 0) % 2], outra = ts.borda[((idx / 48 | 0) + 1) % 2], pul = 0.6 + 0.4 * Math.sin(tt * 4 + idx);
    var lw = Math.max(1.2, esc * 70);
    c.save();
    if (!voa) { c.fillStyle = '#17142c'; c.fillRect(x1 - lw, topo, lw * 2, fundo - topo); c.fillRect(x2 - lw, topo, lw * 2, fundo - topo); c.fillRect(x1, topo, x2 - x1, Math.max(2, escY * 260)); }
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(cor, 0.25 * pul); c.lineWidth = lw * 5;
    c.beginPath(); c.moveTo(x1, fundo); c.lineTo(x1, topo); c.lineTo(x2, topo); c.lineTo(x2, fundo); if (voa) c.closePath(); c.stroke();
    c.strokeStyle = rgba(cor, 0.95 * pul); c.lineWidth = lw;
    c.beginPath(); c.moveTo(x1, fundo); c.lineTo(x1, topo); c.lineTo(x2, topo); c.lineTo(x2, fundo); if (voa) c.closePath(); c.stroke();
    // luzinhas correndo na barra de cima
    for (var k = 0; k < 9; k++) { var acesa = ((k + Math.floor(tt * 8)) % 3) === 0; luz(c, x1 + (x2 - x1) * (k + 0.5) / 9, topo + escY * 130, esc * 160, acesa ? outra : cor, acesa ? 0.9 : 0.3); }
    c.restore();
  }

  // lanternas vermelhas acesas nos carrinhos do trânsito (e luzes piscando nos aviões)
  function lanternasTransito(c, tipo, x, y, esc) {
    var spr = base[tipo]; if (!spr) return;
    var dw = spr.w * esc, dh = spr.h * esc, yl = y - dh * (tipo === 'onibus' ? 0.38 : 0.43), dx = dw * (tipo === 'onibus' ? 0.36 : 0.34);
    c.save(); c.globalCompositeOperation = 'lighter';
    luz(c, x - dx, yl, dw * 0.28, '#ff2a2a', 0.8); luz(c, x + dx, yl, dw * 0.28, '#ff2a2a', 0.8);
    c.restore();
  }
  function luzesAviao(c, x, y, esc, idx) {
    var liga = Math.sin(Date.now() / 160 + idx) > 0.3, dw = 1300 * esc;
    c.save(); c.globalCompositeOperation = 'lighter';
    luz(c, x - dw * 0.47, y - dw * 0.18, dw * 0.12, '#ff3b3b', liga ? 0.9 : 0.25); luz(c, x + dw * 0.47, y - dw * 0.18, dw * 0.12, '#4cd964', liga ? 0.9 : 0.25);
    c.restore();
  }

  function desenharCarro(c, j, vs, g, h, w, e) {
    var K = g.K, esc = K / ALTURA_CAM, spr = carrosJog[j.n], cw = spr.w * esc, ch = spr.h * esc;
    var chao = g.cy + g.KY, lift = j.pulo > 0 ? Math.sin(Math.PI * (1 - j.pulo / (j.puloMax || raiz.VruuumMotor.PULO))) * K * 0.42 * (j.puloMax || 1.1) / 1.1 : 0;
    if (j.fora && j.vel > 100) lift += Math.random() * K * 0.012;
    if (j.turbo > 0) {
      var tr = Math.min(1, j.turbo), lw = cw * 0.8 / 7;
      for (var k = 0; k < 7; k++) {
        var gr = c.createLinearGradient(0, chao - lift, 0, h); gr.addColorStop(0, ESTILO !== 'colorido' ? (k % 2 ? '#ff2bd6' : '#2bf4ff') : S.ARCO[k]); gr.addColorStop(1, 'rgba(255,255,255,0)');
        c.globalAlpha = 0.75 * tr; c.fillStyle = gr; c.fillRect(g.cx - cw * 0.4 + k * lw, chao - lift - ch * 0.15, lw + 1, h);
      }
      c.globalAlpha = 0.5 * tr; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, K * 0.006);
      for (k = 0; k < 14; k++) { var a = Math.random() * Math.PI * 2, r0 = K * (0.7 + Math.random() * 0.3); c.beginPath(); c.moveTo(g.cx + Math.cos(a) * r0, g.cy + Math.sin(a) * r0 * 0.6); c.lineTo(g.cx + Math.cos(a) * r0 * 1.6, g.cy + Math.sin(a) * r0 * 0.96); c.stroke(); }
      c.globalAlpha = 1;
    }
    var vv = VEIC[j.n], voa = !!VOA[j.n], tt = Date.now() / 1000;
    if (voa) lift += Math.sin(tt * 2.2) * K * 0.012;   // flutuando no ar
    if (lift > 0 && !voa) { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse ? c.ellipse(g.cx, chao, cw * 0.45 * (1 - lift / K), ch * 0.06, 0, 0, Math.PI * 2) : c.arc(g.cx, chao, cw * 0.4, 0, Math.PI * 2); c.fill(); }
    var segAqui = P.achar(e.pista, j.z), acesas = ehNeon(segAqui.i) || !!segAqui.tunel;
    if (acesas) {
      c.save(); c.globalCompositeOperation = 'lighter';
      // faróis iluminando a estrada à frente
      var yF = chao - lift - ch * 0.25, yL = g.cy + g.KY * 0.3;
      [-1, 1].forEach(function (l) {
        var gr2 = c.createLinearGradient(0, yF, 0, yL); gr2.addColorStop(0, 'rgba(255,244,214,.32)'); gr2.addColorStop(1, 'rgba(255,244,214,0)');
        c.fillStyle = gr2; c.beginPath(); c.moveTo(g.cx + l * cw * 0.18, yF); c.lineTo(g.cx + l * cw * 0.34, yF); c.lineTo(g.cx + l * cw * 0.7 + vs.lado * K * 0.2, yL); c.lineTo(g.cx + l * cw * 0.05 + vs.lado * K * 0.2, yL); c.fill();
      });
      if (!voa) {   // luz neon por baixo do veículo, na cor dele
        var corV = (INFO[j.n] && INFO[j.n].cor) || '#2bf4ff', pul = 0.75 + Math.sin(tt * 4) * 0.15;
        c.save(); c.translate(g.cx, chao - lift); c.scale(1, 0.22); luz(c, 0, 0, cw * 0.75, corV, 0.75 * pul); c.restore();
      }
      // rastro de luz das lanternas quando está rápido
      var rap = Math.min(1, j.vel / e.pista.cfg.velMax);
      if (!voa && rap > 0.5) [-1, 1].forEach(function (l) {
        var gr3 = c.createLinearGradient(0, chao - lift - ch * 0.4, 0, h); gr3.addColorStop(0, 'rgba(255,40,40,' + (0.5 * rap) + ')'); gr3.addColorStop(1, 'rgba(255,40,40,0)');
        c.fillStyle = gr3; c.fillRect(g.cx + l * cw * 0.36 - cw * 0.03, chao - lift - ch * 0.4, cw * 0.06, h);
      });
      c.restore();
    }
    c.save();
    c.translate(g.cx, chao - lift);
    // avião inclina bem nas curvas; moto deita um pouco; carro quase nada
    var inclina = voa ? 0.3 : (vv && (vv.id === 'moto' || vv.id === 'skate') ? 0.22 : 0.07);
    c.rotate(vs.lado * inclina + (j.rodando > 0 ? Math.sin(j.rodando * 22) * 0.25 : 0));
    if (j.rodando > 0) c.scale(Math.max(0.25, Math.abs(Math.cos(j.rodando * 9))) * (Math.cos(j.rodando * 9) < 0 ? -1 : 1), 1);
    extrasAntes(c, vv, cw, ch, tt);
    c.drawImage(spr.img, -cw / 2, -ch, cw, ch);
    pilotoVivo(c, vv, -cw / 2, -ch, cw, ch, INFO[j.n], j.n * 3.3, 7);
    extrasDepois(c, vv, cw, ch, tt, j.turbo > 0);
    if (acesas && !voa) {   // lanternas brilhando
      c.globalCompositeOperation = 'lighter';
      luz(c, -cw * 0.36, -ch * 0.4, cw * 0.22, '#ff2a2a', 0.75); luz(c, cw * 0.36, -ch * 0.4, cw * 0.22, '#ff2a2a', 0.75);
      c.globalCompositeOperation = 'source-over';
    }
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
    var K = g.K, ox = g.cx, oy = g.cy + g.KY * 0.72;
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
    var fimPilula = u * 0.5 + ml.l + pilula(c, u * 0.5 + ml.l, topo, (e.jogadores.length === 2 ? piloto + ' ' : '') + '⭐ ' + j.estrelas + '  ' + milhar(j.pontos || 0) + ' pts', u * 1.0, '#ffd93d');
    var bx = Math.max(w * 0.3, fimPilula + u * 1.2), bw = Math.min(w * 0.4, w - ml.r - bx - u * 4.2), by = topo + u * 0.55, bh = u * 0.45;
    c.fillStyle = 'rgba(26,20,70,.6)'; c.fillRect(bx, by, bw, bh);
    for (var mm = 0; mm < 4; mm++) { c.fillStyle = TEMAS[pista.mundos[mm]].cor; c.fillRect(bx + bw * mm / 4, by, bw / 4 - 1, bh); }
    c.font = Math.round(u * 0.9) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏁', bx + bw + u * 0.6, by + bh / 2);
    e.jogadores.forEach(function (o) {
      var p = Math.min(1, o.z / pista.zChegada), px = bx + bw * p;
      c.beginPath(); c.arc(px, by + bh / 2, u * 0.55, 0, Math.PI * 2); c.fillStyle = op.jogadores[o.n].cor; c.fill(); c.lineWidth = o.n === ji ? u * 0.14 : u * 0.06; c.strokeStyle = '#fff'; c.stroke();
      c.font = Math.round(u * 0.62) + 'px ' + EMOJI; c.fillStyle = '#000'; c.fillText(op.jogadores[o.n].piloto, px, by + bh / 2 + u * 0.03);
    });
    (e.rivais || []).forEach(function (rv, k) {   // rivais na barra do caminho
      var pr = Math.min(1, rv.z / pista.zChegada), rx = bx + bw * pr;
      c.beginPath(); c.arc(rx, by + bh / 2, u * 0.28, 0, Math.PI * 2); c.fillStyle = rv.cor || '#fff'; c.fill(); c.lineWidth = u * 0.05; c.strokeStyle = 'rgba(0,0,0,.6)'; c.stroke();
    });
    if (e.total > 1 && j.lugar) pilula(c, u * 0.5 + ml.l, topo + u * 1.9, '🏁 ' + j.lugar + (lingua === 'en' ? ordinalEn(j.lugar) : 'º') + ' / ' + e.total, u * 0.95, j.lugar === 1 ? '#c6ff3d' : '#ffffff');
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
      var tx = (e.total || 1) < 2 ? t('🏁 Chegou!', '🏁 Finished!') : vs.lugar === 1 ? t('🥇 1º lugar!', '🥇 1st place!') : vs.lugar === 2 ? t('🥈 2º lugar!', '🥈 2nd place!') : vs.lugar === 3 ? t('🥉 3º lugar!', '🥉 3rd place!') : t('🏁 Chegou em ', '🏁 Finished ') + vs.lugar + (lingua === 'en' ? ordinalEn(vs.lugar) : 'º') + '!';
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
    porSeg = {}; porSegR = {};
    (estado.rivais || []).forEach(function (r, k) { var i = Math.floor(r.z / SEG); (porSegR[i] || (porSegR[i] = [])).push(k); });
    estado.carros.forEach(function (car) { var i = Math.floor(car.z / SEG); (porSeg[i] || (porSeg[i] = [])).push(car); });
    var vv = vistas(W, H, estado.jogadores.length);
    c.fillStyle = '#0b0a1f'; c.fillRect(0, 0, W, H);
    op.dist = op.dist || (vv.length > 1 ? 110 : 160); op.W = W; op.H = H;
    vv.forEach(function (v, k) { desenharVista(c, v, estado, k, op); });
    return vv;
  }

  // prévia da garagem: o veículo grande, animado (hélice, rotor, fogo), na estrada ou no céu
  var cachePrevia = {};
  function spritePrevia(cor, veic) {
    var k = cor + '|' + veic;
    if (!cachePrevia[k]) cachePrevia[k] = S.carroJogador(cor, null, veic, 360);
    return cachePrevia[k];
  }
  function previa(cv, cor, piloto, veic, foto, pers) {
    var c = cv.getContext('2d'), W = cv.width, H = cv.height, vv = V() ? V().achar(veic) : null, voa = !!(V() && V().voa(veic)), tt = Date.now() / 1000;
    var spr = spritePrevia(cor, veic);
    var g = c.createLinearGradient(0, 0, 0, H), neon = ESTILO !== 'colorido';
    if (neon) { g.addColorStop(0, '#05030f'); g.addColorStop(1, voa ? '#1d1450' : '#160f35'); }
    else if (voa) { g.addColorStop(0, '#38b6ff'); g.addColorStop(1, '#c9f0ff'); } else { g.addColorStop(0, '#2a2160'); g.addColorStop(1, '#3a2f73'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (neon) {   // garagem à noite: estrelas, estrada escura com bordas de neon e luz por baixo do veículo
      base = base || S.basicos();
      c.globalAlpha = 0.8; c.drawImage(base.estrelasCeu, 0, 0, W, H * 0.6); c.globalAlpha = 1;
      if (!voa) {
        c.fillStyle = '#121320'; c.beginPath(); c.moveTo(W * 0.4, H * 0.32); c.lineTo(W * 0.6, H * 0.32); c.lineTo(W * 1.05, H); c.lineTo(-W * 0.05, H); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 3;
        c.strokeStyle = 'rgba(43,244,255,.9)'; c.beginPath(); c.moveTo(W * 0.4, H * 0.32); c.lineTo(-W * 0.05, H); c.stroke();
        c.strokeStyle = 'rgba(255,43,214,.9)'; c.beginPath(); c.moveTo(W * 0.6, H * 0.32); c.lineTo(W * 1.05, H); c.stroke();
        for (var q = 0; q < 5; q++) { var pq = ((tt * 1.5 + q / 5) % 1), yq = H * 0.32 + (H * 0.68) * pq * pq; c.fillStyle = 'rgba(43,244,255,.8)'; c.fillRect(W / 2 - 1.5 - pq * 4, yq, 3 + pq * 8, 4 + pq * 14); }
        c.translate(W / 2, H * 0.94); c.scale(1, 0.2); luz(c, 0, 0, W * 0.35, cor, 0.7);
        c.restore();
      }
    } else if (voa) {
      base = base || S.basicos();
      var nx = ((tt * 40) % (W * 1.6)) - W * 0.3;
      c.drawImage(base.nuvemFofa.img, W - nx, H * 0.08, W * 0.5, W * 0.23); c.drawImage(base.nuvemFofa.img, W * 1.5 - nx * 0.6, H * 0.45, W * 0.4, W * 0.19);
    }
    if (!neon && !voa) {
      c.fillStyle = '#6e737b'; c.beginPath(); c.moveTo(W * 0.4, H * 0.32); c.lineTo(W * 0.6, H * 0.32); c.lineTo(W * 1.05, H); c.lineTo(-W * 0.05, H); c.fill();
      c.fillStyle = '#ffffff'; for (var k = 0; k < 5; k++) { var p = ((tt * 1.5 + k / 5) % 1), y = H * 0.32 + (H * 0.68) * p * p; c.fillRect(W / 2 - 1.5 - p * 4, y, 3 + p * 8, 4 + p * 14); }
    }
    var esc = Math.min(W * 0.78 / spr.w, H * 0.8 / spr.h), cw = spr.w * esc, ch = spr.h * esc;
    c.save(); c.translate(W / 2, H * 0.94 + (voa ? Math.sin(tt * 2.2) * H * 0.02 - H * 0.06 : Math.sin(tt * 9) * 1.2));
    if (voa) c.rotate(Math.sin(tt * 0.9) * 0.08);
    extrasAntes(c, vv, cw, ch, tt); c.drawImage(spr.img, -cw / 2, -ch, cw, ch);
    pilotoVivo(c, vv, -cw / 2, -ch, cw, ch, infoPiloto(cor, piloto, foto, pers), 1.2, 4.5);   // na garagem vira mais vezes
    extrasDepois(c, vv, cw, ch, tt, false);
    c.restore();
  }
  // miniatura parada (cartões da garagem)
  function miniatura(cv, cor, piloto, veic, foto, pers) {
    var c = cv.getContext('2d'), spr = spritePrevia(cor, veic), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    var esc = Math.min(W * 0.9 / spr.w, H * 0.9 / spr.h), cw = spr.w * esc, ch = spr.h * esc;
    c.drawImage(spr.img, (W - cw) / 2, H * 0.95 - ch, cw, ch);
    if (Cab()) Cab().desenhar(c, V().achar(veic), (W - cw) / 2, H * 0.95 - ch, cw, ch, infoPiloto(cor, piloto, foto, pers), 50, 0, 1000);   // parado, de costas
  }

  function definirEstilo(v) { ESTILO = v === 'colorido' || v === 'neon' ? v : 'misto'; }
  raiz.VruuumDesenho = { definirEstilo: definirEstilo, preparar: preparar, desenhar: desenhar, passo: passo, evento: evento, vistas: vistas, margemLocal: margemLocal, botaoPulo: botaoPulo, previa: previa, miniatura: miniatura, milhar: milhar, ALT_VOO: ALT_VOO, TEMAS: TEMAS, CORES: CORES, PILOTOS: PILOTOS };
})(this);
