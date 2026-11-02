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
    praia: { ceu: ['#040714', '#1b1150'], grama: ['#0f1e36', '#182b4d'], pista: ['#15161f', '#121319'], borda: ['#00e5ff', '#ff3df0'], faixa: '#00e5ff' },
    floresta: { ceu: ['#020a08', '#0e2a22'], grama: ['#0b1d14', '#132b1f'], pista: ['#131614', '#101311'], borda: ['#39ff88', '#ffd166'], faixa: '#39ff88' },
    doces: { ceu: ['#0f0316', '#3a0d3f'], grama: ['#1f0b23', '#2d1133'], pista: ['#1a1219', '#161015'], borda: ['#ff4fd8', '#7cf9ff'], faixa: '#ff4fd8' },
    neve: { ceu: ['#030714', '#142650'], grama: ['#18213a', '#232f4f'], pista: ['#151a24', '#12161f'], borda: ['#7cc8ff', '#ffffff'], faixa: '#7cc8ff' },
    neon: { ceu: ['#05010f', '#2a0b55'], grama: ['#130a30', '#1e1146'], pista: ['#120d24', '#0f0b1f'], borda: ['#ff2bd6', '#2bf4ff'], faixa: '#2bf4ff' }
  };
  Object.keys(NEON).forEach(function (k) { var a = NEON[k], b = TEMAS[k]; a.nome = b.nome; a.emoji = b.emoji; a.cor = b.cor; a.noite = true; a.sol = null; });
  // visual: 'neon' (noite), 'colorido' (dia) ou 'misto' (alterna dia e noite a cada BLOCO pedaços da pista)
  var ESTILO = 'misto', BLOCO = 260, TRANSICAO = 150;   // a troca dia/noite dura 150 pedaços: 75 antes e 75 depois da virada
  function ehNeon(i) { return ESTILO === 'neon' || (ESTILO === 'misto' && Math.floor(i / BLOCO) % 2 === 1); }
  // quanto de noite no pedaço i (0 a 1), com o céu escurecendo/clareando aos poucos na troca
  function noiteEm(i) {
    if (ESTILO !== 'misto') return ESTILO === 'neon' ? 1 : 0;
    var b = Math.floor(i / BLOCO), p = i - b * BLOCO, meio = TRANSICAO / 2, v = b % 2 === 1 ? 1 : 0;
    function sv(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
    if (p < meio && b > 0) return (1 - v) + (v - (1 - v)) * sv(0.5 + p / TRANSICAO);              // começo do bloco: ainda vindo do anterior
    if (BLOCO - p < meio) return v + ((1 - v) - v) * sv(0.5 - (BLOCO - p) / TRANSICAO);          // fim do bloco: já indo para o próximo
    return v;
  }
  function tema(nome, i) { return (i == null ? ESTILO !== 'colorido' : ehNeon(i)) ? NEON[nome] : TEMAS[nome]; }
  // ---------- cores da pista misturadas aos poucos ----------
  /* A cor do chão, da pista, das bordas e das faixas de cada pedaço vem da mistura de 4 paletas: o mundo de antes e o
     de agora (troca devagar, 85 pedaços antes e depois do portal) e o dia e a noite (TRANSICAO pedaços em volta da
     virada). Cada pedaço tem a sua mistura: andando para a frente, o piso vai mudando de cor aos poucos.
     Assim a estrada não muda de marrom para cinza (ou de clara para neon) de uma vez. */
  var cachePal = [], inicioMundo = [], mundosPal = [];
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mixRgb(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function css(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
  function suaveT(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function paleta(t) { return { grama: t.grama.map(hexRgb), pista: t.pista.map(hexRgb), borda: t.borda.map(hexRgb), faixa: hexRgb(t.faixa) }; }
  function mixPal(a, b, f) {
    if (f <= 0) return a; if (f >= 1) return b;
    return { grama: [0, 1].map(function (k) { return mixRgb(a.grama[k], b.grama[k], f); }), pista: [0, 1].map(function (k) { return mixRgb(a.pista[k], b.pista[k], f); }),
      borda: [0, 1].map(function (k) { return mixRgb(a.borda[k], b.borda[k], f); }), faixa: mixRgb(a.faixa, b.faixa, f) };
  }
  function prepararPaletas(pista) {
    cachePal = []; inicioMundo = [0]; mundosPal = pista.mundos.map(function (m) { return { dia: paleta(TEMAS[m]), noite: paleta(NEON[m]) }; });
    for (var i = 1; i < pista.segs.length; i++) if (pista.segs[i].mundo !== pista.segs[i - 1].mundo) inicioMundo[pista.segs[i].mundo] = i;
  }
  // paleta do pedaço i: { grama, pista, borda, faixa (já em texto css), noite: 0 a 1 }
  function corPedaco(pista, s) {
    var i = s.i, c = cachePal[i];
    if (c && c.estilo === ESTILO) return c;
    var noite = noiteEm(i), m = s.mundo, MEIO = 85;
    function doMundo(k) { var p = mundosPal[k] || mundosPal[0]; return mixPal(p.dia, p.noite, noite); }
    var pal = doMundo(m);
    // perto de um portal: mistura com o mundo vizinho
    if (m > 0 && i - inicioMundo[m] < MEIO) pal = mixPal(doMundo(m - 1), pal, suaveT((i - inicioMundo[m] + MEIO) / (2 * MEIO)));
    else if (inicioMundo[m + 1] && inicioMundo[m + 1] - i <= MEIO) pal = mixPal(pal, doMundo(m + 1), suaveT((i - inicioMundo[m + 1] + MEIO) / (2 * MEIO)));
    c = { estilo: ESTILO, noite: noite, num: pal, grama: pal.grama.map(css), pista: pal.pista.map(css), borda: pal.borda.map(css), faixa: css(pal.faixa),
      bordaNoite: css(mixRgb(pal.borda[0], [255, 255, 255], 0.05)) };
    cachePal[i] = c;
    return c;
  }
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
    prepararPaletas(estado.pista);
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
  // sombra no chão debaixo de quem anda (e, à noite, um brilho fraco): sem ela, no neon, carro e rival pareciam flutuar
  function sombraChao(c, x, y, dw, noite, cor) {
    if (dw < 3) return;
    c.fillStyle = 'rgba(0,0,0,' + (0.28 + 0.2 * noite).toFixed(2) + ')';
    c.beginPath(); if (c.ellipse) c.ellipse(x, y, dw * 0.46, Math.max(1, dw * 0.075), 0, 0, Math.PI * 2); else c.arc(x, y, dw * 0.4, 0, Math.PI * 2); c.fill();
    if (noite > 0.3 && cor) { c.save(); c.globalCompositeOperation = 'lighter'; c.translate(x, y); c.scale(1, 0.22); luz(c, 0, 0, dw * 0.6, cor, 0.45 * noite); c.restore(); }
  }
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
    // névoa da distância: o chão lá longe vai virando a cor do pé do céu (assim o trecho de noite que vem lá na
    // frente não aparece como uma faixa escura embaixo de um céu ainda claro)
    var corCeuDia = mixRgb(hexRgb(TEMAS[pista.mundos[m > 0 ? m - 1 : m]].ceu[1]), hexRgb(TEMAS[pista.mundos[m]].ceu[1]), f);
    var corCeuNoite = mixRgb(hexRgb(NEON[pista.mundos[m > 0 ? m - 1 : m]].ceu[1]), hexRgb(NEON[pista.mundos[m]].ceu[1]), f);
    var nevoa = mixRgb(corCeuDia, corCeuNoite, noiteAqui);
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
      var nS = ehNeon(s.i), ts = tema(pista.mundos[s.mundo], s.i), par = s.listra, pc = corPedaco(pista, s), nt = pc.noite;
      var fn = Math.max(0, (n - cnt * 0.4) / (cnt * 0.6)), fog = Math.min(0.8, Math.pow(fn, 1.4) * 0.8);
      if (fog > 0.01) {   // longe: mistura com a névoa
        var pn = pc.num;
        pc = { noite: nt * (1 - fog), num: pn, grama: [css(mixRgb(pn.grama[0], nevoa, fog)), css(mixRgb(pn.grama[1], nevoa, fog))], pista: [css(mixRgb(pn.pista[0], nevoa, fog)), css(mixRgb(pn.pista[1], nevoa, fog))],
          borda: [css(mixRgb(pn.borda[0], nevoa, fog)), css(mixRgb(pn.borda[1], nevoa, fog))], faixa: css(mixRgb(pn.faixa, nevoa, fog)), bordaNoite: pc.bordaNoite };
        nt = pc.noite;
      }
      c.fillStyle = pc.grama[par]; c.fillRect(0, Y2, w, Y1 - Y2 + 1);
      var r1 = W1 / 7, r2 = W2 / 7;
      Y1 += 1;   // 1 pixel de sobra: sem risquinhos entre um pedaço e outro
      // de dia: zebra nas bordas; de noite: a zebra some no asfalto escuro e acende o fio de neon (troca aos poucos)
      if (nt < 1) {
        c.globalAlpha = 1 - nt;
        poligono(c, X1 - W1 - r1, Y1, X1 - W1, Y1, X2 - W2, Y2, X2 - W2 - r2, Y2, pc.borda[par]);
        poligono(c, X1 + W1 + r1, Y1, X1 + W1, Y1, X2 + W2, Y2, X2 + W2 + r2, Y2, pc.borda[par]);
        c.globalAlpha = 1;
      }
      var lp = 1 + 0.06 * nt;
      poligono(c, X1 - W1 * lp, Y1, X1 + W1 * lp, Y1, X2 + W2 * lp, Y2, X2 - W2 * lp, Y2, pc.pista[par]);
      if (nt > 0) {
        var e1 = W1 * 0.025, e2 = W2 * 0.025, cor0 = pc.bordaNoite;
        c.globalAlpha = 0.22 * nt;
        poligono(c, X1 - W1 - e1 * 4, Y1, X1 - W1 + e1 * 4, Y1, X2 - W2 + e2 * 4, Y2, X2 - W2 - e2 * 4, Y2, cor0);
        poligono(c, X1 + W1 - e1 * 4, Y1, X1 + W1 + e1 * 4, Y1, X2 + W2 + e2 * 4, Y2, X2 + W2 - e2 * 4, Y2, cor0);
        c.globalAlpha = nt;
        poligono(c, X1 - W1 - e1, Y1, X1 - W1 + e1, Y1, X2 - W2 + e2, Y2, X2 - W2 - e2, Y2, cor0);
        poligono(c, X1 + W1 - e1, Y1, X1 + W1 + e1, Y1, X2 + W2 + e2, Y2, X2 + W2 - e2, Y2, cor0);
        c.globalAlpha = 1;
      }
      if (s.xadrez) {
        for (var q = 0; q < 8; q++) {
          var a = -1 + q / 4, b = a + 0.25;
          poligono(c, X1 + W1 * a, Y1, X1 + W1 * b, Y1, X2 + W2 * b, Y2, X2 + W2 * a, Y2, (q + s.i) % 2 ? '#111' : '#fff');
        }
      } else if (!par) {
        var l1 = W1 / 32, l2 = W2 / 32;
        c.globalAlpha = 1 - 0.15 * nt;
        for (var fx = -1 / 3; fx < 0.5; fx += 2 / 3) poligono(c, X1 + W1 * fx - l1, Y1, X1 + W1 * fx + l1, Y1, X2 + W2 * fx + l2, Y2, X2 + W2 * fx - l2, Y2, pc.faixa);
        c.globalAlpha = 1;
      }
      if (grade && nt > 0.02 && !s.tunel) {   // a grade do chão acende aos poucos, junto com a noite
        corGrade = corGrade || ts.borda[0];
        if (s.i % 2 === 0) { c.fillStyle = rgba(NEON[pista.mundos[s.mundo]].borda[0], 0.2 * nt); c.fillRect(0, Y1 - 1, Math.max(0, X1 - W1 * 1.12), 1.2); c.fillRect(X1 + W1 * 1.12, Y1 - 1, Math.max(0, w - X1 - W1 * 1.12), 1.2); }
        for (var gk = 0; gk < GRADE.length; gk++) { grade[gk][0].push([X1 - W1 * GRADE[gk], Y1, nt]); grade[gk][1].push([X1 + W1 * GRADE[gk], Y1, nt]); }
      } else if (grade) for (var gq = 0; gq < GRADE.length; gq++) { grade[gq][0].push(null); grade[gq][1].push(null); }   // sem grade aqui: corta a linha
      maxy = Y2;
    }
    if (grade) {   // linhas da grade em 4 níveis de brilho (mais apagadas onde ainda é dia)
      c.lineWidth = 1.2;
      for (var nv = 1; nv <= 4; nv++) {
        c.strokeStyle = rgba(corGrade || '#2bf4ff', 0.28 * nv / 4); c.beginPath(); var tem = false;
        grade.forEach(function (par2) { par2.forEach(function (pts) {
          for (var q = 1; q < pts.length; q++) { var a = pts[q - 1], b2 = pts[q]; if (!a || !b2) continue;
            if (Math.max(1, Math.ceil(Math.min(a[2], b2[2]) * 4 - 0.001)) !== nv) continue;
            c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); tem = true; }
        }); });
        if (tem) c.stroke();
      }
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

    // quem anda (trânsito, rivais, o outro jogador) fica no ponto exato dentro do pedaço da estrada, e não
    // grudado no começo do pedaço: senão pula de um pedaço para o outro e parece tremer
    function noPonto(n, z) {
      var f = n + 1 < cnt && aZ[n + 1] > PROF ? Math.max(0, Math.min(1, z / SEG - (baseI + n))) : 0;
      var sc = aS[n] + (aS[n + 1] - aS[n]) * f;
      return { x: aX[n] + (aX[n + 1] - aX[n]) * f, y: aY[n] + (aY[n + 1] - aY[n]) * f, esc: sc * K, escY: sc * KY };
    }
    // enfeites, coisas, trânsito e o outro jogador, do longe para o perto
    var outro = e.jogadores.length === 2 ? e.jogadores[1 - ji] : null, oSeg = outro ? Math.floor(outro.z / SEG) : -1;
    var primeiro = 0; while (primeiro < cnt && aZ[primeiro] <= PROF) primeiro++;
    var dentroTunel = !!segs[baseI].tunel;
    for (n = cnt - 1; n >= 0; n--) {
      if (aZ[n] <= PROF) continue;
      var idx = baseI + n; s = segs[idx];
      var esc = aS[n] * K, escY = aS[n] * KY, sx = aX[n], sy = aY[n], clip = aClip[n], k2;
      var syAr = sy - escY * ALT_VOO;   // a altura do voo neste pedaço
      var nS2 = ehNeon(idx), tsN = tema(pista.mundos[s.mundo], idx), ntS = noiteEm(idx);   // ntS: quanto de noite aqui (0 a 1)
      if (s.tunel) {
        var temB = n + 1 < cnt && aZ[n + 1] > PROF && segs[idx + 1] && segs[idx + 1].tunel === s.tunel;
        tunel(c, s, idx, { x: sx, y: sy, e: esc, eY: escY }, temB ? { x: aX[n + 1], y: aY[n + 1], e: aS[n + 1] * K, eY: aS[n + 1] * KY } : (segs[idx + 1] && !segs[idx + 1].tunel && n + 1 < cnt ? { x: aX[n + 1], y: aY[n + 1], e: aS[n + 1] * K, eY: aS[n + 1] * KY } : null), w, h, voa, NEON[pista.mundos[s.mundo]], pista, nevoa, n === primeiro && dentroTunel);
      }
      // postes e pórticos de neon acendem aos poucos com a noite (e somem aos poucos de dia)
      if (ntS > 0.02 && !s.tunel && n > 2 && idx % 8 === 0) { c.globalAlpha = ntS; postesNeon(c, idx, sx, sy, esc, clip, NEON[pista.mundos[s.mundo]], w, escY); c.globalAlpha = 1; }
      if (ntS > 0.02 && !s.tunel && n > 3 && idx % 48 === 24) { c.globalAlpha = ntS; portico(c, idx, sx, voa ? syAr : sy, esc, voa ? 0 : clip, NEON[pista.mundos[s.mundo]], w, escY, voa); c.globalAlpha = 1; }
      for (k2 = 0; n > 3 && k2 < s.enfeites.length; k2++) {   // enfeite colado na câmera taparia a tela
        var en = s.enfeites[k2], arco = en.tipo === 'portal' || en.tipo === 'chegada' || en.tipo === 'largada', spr = en.tipo === 'portal' ? portais[en.mundo] : en.tipo === 'chegada' ? chegada : en.tipo === 'largada' ? largada : enfeiteSpr(en.tipo, ntS >= 0.5);
        if (!spr) continue;
        if (voa && arco) sprite(c, spr, esc, sx + esc * en.x * LARG, syAr + escY * 1900, 0, w);   // no céu, o portal fica na altura do voo
        else if (!arco && ntS > 0.02 && ntS < 0.98) {   // na troca dia/noite: o enfeite claro e o escurecido se misturam
          var claro = enfeiteSpr(en.tipo, false), escuro = enfeiteSpr(en.tipo, true);
          c.globalAlpha = 1 - ntS; sprite(c, claro, esc, sx + esc * en.x * LARG, sy, clip, w);
          c.globalAlpha = ntS; sprite(c, escuro, esc, sx + esc * en.x * LARG, sy, clip, w); c.globalAlpha = 1;
        }
        else sprite(c, spr, esc, sx + esc * en.x * LARG, sy, clip, w);
      }
      if (voa && n > 3 && idx % 6 === 0) {   // nuvens dos lados, em alturas diferentes
        var hz = hash(idx), lado = hz < 0.5 ? -1 : 1, tm2 = tema(pista.mundos[s.mundo], idx);
        var nN = tm2.noite ? 1 : ntS, nxC = sx + esc * lado * (2.2 + hash(idx + 7) * 1.6) * LARG, nyC = syAr + escY * (hash(idx + 3) - 0.35) * 2600;
        if (nN < 0.98) { c.globalAlpha = 1 - nN; sprite(c, base.nuvemFofa, esc, nxC, nyC, 0, w); }
        if (nN > 0.02) { c.globalAlpha = nN; sprite(c, base.nuvemNoite, esc, nxC, nyC, 0, w); }
        c.globalAlpha = 1;
      }
      for (k2 = 0; k2 < s.coisas.length; k2++) {
        var co = s.coisas[k2];
        if (co.pego[ji]) continue;
        var alt = co.alt;
        if (co.tipo === 'estrela') alt += Math.sin(e.t * 5 + idx) * 80;
        // itens com versão de neon (estrela, turbo, lama...): misturam as duas versões na troca dia/noite
        var nomeDia = voa ? sprCeu(co.tipo) : co.tipo, nomeNoite = voa ? (co.tipo === 'estrela' ? 'estrelaNeon' : nomeDia) : (ITEM_NEON[co.tipo] || co.tipo);
        var ix = sx + esc * co.x * LARG, iy = voa ? syAr - escY * (alt + (co.tipo === 'anel' || co.tipo === 'turbo' ? -150 : 0)) : sy - escY * alt, icl = voa ? 0 : clip;
        if (nomeNoite === nomeDia || ntS <= 0.02) sprite(c, base[ntS >= 0.98 ? nomeNoite : nomeDia], esc, ix, iy, icl, w);
        else if (ntS >= 0.98) sprite(c, base[nomeNoite], esc, ix, iy, icl, w);
        else { c.globalAlpha = 1 - ntS; sprite(c, base[nomeDia], esc, ix, iy, icl, w); c.globalAlpha = ntS; sprite(c, base[nomeNoite], esc, ix, iy, icl, w); c.globalAlpha = 1; }
      }
      var cs = porSeg[idx];
      if (cs) for (k2 = 0; k2 < cs.length; k2++) {
        var pc = noPonto(n, cs[k2].z), tx = pc.x + pc.esc * cs[k2].x * LARG, tyA = pc.y - pc.escY * (ALT_VOO + 200);
        var luzT = s.tunel ? 1 : ntS;   // lanternas acesas: à noite e no túnel (acendendo aos poucos)
        if (voa) { sprite(c, base[sprCeu(cs[k2].tipo)], pc.esc, tx, tyA, 0, w); if (luzT > 0.02) { c.globalAlpha = luzT; luzesAviao(c, tx, tyA, pc.esc, idx); c.globalAlpha = 1; } }
        else {
          if (pc.y <= clip + 2) sombraChao(c, tx, pc.y, base[cs[k2].tipo].w * pc.esc, corPedaco(pista, s).noite, '#ff3b6b');
          sprite(c, base[cs[k2].tipo], pc.esc, tx, pc.y, clip, w); if (luzT > 0.02 && pc.y <= clip + 2) { c.globalAlpha = luzT; lanternasTransito(c, cs[k2].tipo, tx, pc.y, pc.esc); c.globalAlpha = 1; }
        }
      }
      var rs = porSegR[idx];   // rivais neste pedaço (no céu se forem de avião)
      if (rs) for (k2 = 0; k2 < rs.length; k2++) {
        var rv = e.rivais[rs[k2]], rd = RIV[rs[k2]]; if (!rd || rv.z < j.z - JOG_Z * 0.6) continue;
        var pr = noPonto(n, rv.z), rX = pr.x + pr.esc * rv.x * LARG, rY = rd.voa ? pr.y - pr.escY * ALT_VOO : pr.y, rW = rd.spr.w * pr.esc, rH = rd.spr.h * pr.esc;
        var faseR = rd.spr.quadros ? faseSkate(rd, rv, e) : 0, vivo = rW > 24 && (rd.voa || voa || rY <= clip);
        rd.lado = (rd.lado || 0) + (Math.max(-1, Math.min(1, (rv.faixa - rv.x) * 4)) - (rd.lado || 0)) * 0.15;   // vira para onde está indo
        if (!rd.voa && !voa && rY <= clip + 2) sombraChao(c, rX, rY, rW, corPedaco(pista, s).noite, rd.info.cor);
        if (vivo) bracos(c, rd.veic, rX - rW / 2, rY - rH, rW, rH, rd.info.cor, faseR, rd.lado, 'longe');
        sprite(c, S.quadro(rd.spr, faseR), pr.esc, rX, rY, rd.voa || voa ? 0 : clip, w);
        if (vivo) { bracos(c, rd.veic, rX - rW / 2, rY - rH, rW, rH, rd.info.cor, faseR, rd.lado, 'perto'); pilotoVivo(c, rd.veic, rX - rW / 2, rY - rH, rW, rH, rd.info, 10 + rs[k2] * 2.1, 6); }
        var luzR = s.tunel ? 1 : ntS;
        if (!rd.voa && luzR > 0.02 && rY <= clip + 2) { c.save(); c.globalCompositeOperation = 'lighter'; luz(c, rX - rW * 0.36, rY - rH * 0.4, rW * 0.25, '#ff2a2a', 0.7 * luzR); luz(c, rX + rW * 0.36, rY - rH * 0.4, rW * 0.25, '#ff2a2a', 0.7 * luzR); c.restore(); }
      }
      if (idx === oSeg && outro.z > j.z - JOG_Z * 0.6) {
        var lift = outro.pulo > 0 ? Math.sin(Math.PI * (1 - outro.pulo / (outro.puloMax || raiz.VruuumMotor.PULO))) * 1400 * (outro.puloMax || 1.1) / 1.1 : 0;
        var oVoa = !!VOA[outro.n];   // o outro pode estar voando enquanto eu vou de carro (e vice-versa)
        var po = noPonto(n, outro.z), oSpr = carrosJog[outro.n], oX = po.x + po.esc * outro.x * LARG, oY = (oVoa ? po.y - po.escY * ALT_VOO : po.y) - po.escY * lift;
        var faseO = VS[outro.n] && VS[outro.n].fPe != null ? VS[outro.n].fPe : 0.8, ladoO = VS[outro.n] ? VS[outro.n].lado : 0, oW = oSpr.w * po.esc, oH = oSpr.h * po.esc, oVivo = oW > 24 && (oVoa || voa || oY <= clip);
        if (!oVoa && !voa && po.y <= clip + 2) sombraChao(c, oX, po.y, oW, corPedaco(pista, s).noite, INFO[outro.n].cor);
        if (oVivo) bracos(c, VEIC[outro.n], oX - oW / 2, oY - oH, oW, oH, INFO[outro.n].cor, faseO, ladoO, 'longe');
        sprite(c, S.quadro(oSpr, faseO), po.esc, oX, oY, oVoa || voa ? 0 : clip, w);
        if (oVivo) { bracos(c, VEIC[outro.n], oX - oW / 2, oY - oH, oW, oH, INFO[outro.n].cor, faseO, ladoO, 'perto'); pilotoVivo(c, VEIC[outro.n], oX - oW / 2, oY - oH, oW, oH, INFO[outro.n], outro.n * 3.3, 7); }
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
  // ---------- túnel ----------
  /* No chão o túnel é um corredor em 3D: paredes e teto ligando um pedaço ao seguinte (como a pista), uma boca em
     forma de arco na entrada (rocha, areia, doce, gelo ou prédio, conforme o mundo) e luz de fora clareando as
     paredes perto da entrada e da saída. As cores misturam dia e noite aos poucos, como o resto. No céu, um tubo de
     anéis de luz em volta da rota. A: este pedaço (perto); B: o seguinte (longe), ou null. */
  // boca do túnel por mundo: [cor de dia, cor de noite, cobertura no topo (dia), cobertura (noite)]
  var BOCA = { praia: ['#b98a52', '#2a2238', '#e9cf94', '#3a2f4a'], floresta: ['#6e6a5e', '#1a2420', '#4cc35a', '#163a24'], doces: ['#7a4a33', '#2a1426', '#ffb6e1', '#5a2050'], neve: ['#7d8aa3', '#1e2638', '#f4f8ff', '#3a4a6a'], neon: ['#2c2752', '#15122e', '#ff2bd6', '#ff2bd6'] };
  function tunel(c, s, idx, A, B, w, h, voa, ts, pista, nevoa, cobrirTela) {
    var nt = noiteEm(idx), tt = Date.now() / 1000, sx = A.x, sy = A.y, esc = A.e, escY = A.eY;
    var meia = esc * LARG * 1.32, x1 = sx - meia, x2 = sx + meia;
    var aceso = ((idx - tt * 26) % 18 + 18) % 18 < 3;   // luz que corre pelo túnel
    var corLuzNoite = hexRgb(ts.borda[(Math.floor(idx / 3)) % 2] || '#2bf4ff'), corLuz = css(mixRgb([255, 209, 102], corLuzNoite, nt));
    c.save();
    if (voa) {
      if (idx % 3 === 0) {
        var yT = A.y - escY * ALT_VOO - escY * 2400, yB = A.y - escY * ALT_VOO + escY * 900, lw = Math.max(1.2, esc * 60);
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(255,255,255,0)';
        c.globalAlpha = aceso ? 0.35 : 0.14; c.strokeStyle = corLuz; c.lineWidth = lw * 4; c.strokeRect(x1, yT, x2 - x1, yB - yT);
        c.globalAlpha = aceso ? 1 : 0.55; c.lineWidth = lw; c.strokeRect(x1, yT, x2 - x1, yB - yT);
      }
      c.restore(); return;
    }
    var t = pista.tuneis[s.tunel - 1] || [idx, idx + 1], ini = t[0], fim = t[1] - 1;
    // cor das paredes: dia (cinza) / noite (quase preto), mais clara perto das bocas (luz de fora entrando)
    var par = idx % 2, base0 = mixRgb(par ? [74, 79, 92] : [69, 74, 87], par ? [14, 12, 32] : [11, 10, 25], nt);
    var luzFora = Math.max(suaveT(1 - (fim - idx) / 16), suaveT(1 - (idx - ini) / 10)) * (0.6 - 0.35 * nt);
    var parede = mixRgb(base0, nevoa, luzFora), teto = mixRgb(parede, [255, 255, 255], 0.07), lado2 = mixRgb(parede, [0, 0, 0], 0.12);
    var alto = escY * 2700, yC = sy - alto, yF = sy + 1;
    if (B) {
      var meiaB = B.e * LARG * 1.32, xL2 = B.x - meiaB, xR2 = B.x + meiaB, yC2 = B.y - B.eY * 2700, yF2 = B.y + 1;
      poligono(c, x1, yF, x1, yC, xL2, yC2, xL2, yF2, css(parede));       // parede esquerda
      poligono(c, x2, yF, x2, yC, xR2, yC2, xR2, yF2, css(lado2));        // parede direita (um pouco mais escura)
      poligono(c, x1, yC, x2, yC, xR2, yC2, xL2, yC2, css(teto));         // teto
      if (idx % 3 === 0) {   // lâmpada no teto e filetes de luz nos cantos
        c.globalCompositeOperation = 'lighter';
        poligono(c, sx - meia * 0.14, yC, sx + meia * 0.14, yC, B.x + meiaB * 0.14, yC2, B.x - meiaB * 0.14, yC2, corLuz);
        c.globalAlpha = aceso ? 0.9 : 0.35; c.strokeStyle = corLuz; c.lineWidth = Math.max(1, esc * 40);
        c.beginPath(); c.moveTo(x1, yC); c.lineTo(xL2, yC2); c.moveTo(x2, yC); c.lineTo(xR2, yC2); c.stroke();
        c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      }
    }
    if (cobrirTela) {   // dentro do túnel: o pedaço mais perto cobre o resto da tela com parede e teto
      c.fillStyle = css(parede); c.beginPath(); c.rect(-10, -10, w + 20, yF + 10); c.rect(x1, yC, x2 - x1, yF - yC);
      try { c.fill('evenodd'); } catch (e2) { c.fill(); }
    }
    if (idx === fim && B) {   // saída: a luz lá de fora espalha um pouco em volta da boca
      c.globalCompositeOperation = 'lighter';
      var gl = c.createRadialGradient(B.x, (yC2 + yF2) / 2, meiaB * 0.6, B.x, (yC2 + yF2) / 2, meiaB * 2.2);
      gl.addColorStop(0, 'rgba(255,255,255,' + (0.28 * (1 - 0.6 * nt)).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(B.x - meiaB * 2.3, yC2 - meiaB * 1.5, meiaB * 4.6, (yF2 - yC2) + meiaB * 3);
      c.globalCompositeOperation = 'source-over';
    }
    if (idx === ini) {   // boca do túnel: um morro (ou prédio) com abertura em arco
      var bc = BOCA[pista.mundos[s.mundo]] || BOCA.floresta, cor = mixRgb(hexRgb(bc[0]), hexRgb(bc[1]), nt);
      var L = meia * 4.2, topo = sy - escY * 6200, r = meia;
      c.fillStyle = css(cor); c.beginPath();
      c.moveTo(sx - L, yF); c.lineTo(sx - L, topo + escY * 1800); c.quadraticCurveTo(sx - L * 0.7, topo, sx, topo); c.quadraticCurveTo(sx + L * 0.7, topo, sx + L, topo + escY * 1800); c.lineTo(sx + L, yF); c.closePath();
      c.moveTo(x1, yF); c.lineTo(x1, yC + r * 0.55); c.quadraticCurveTo(x1, yC - r * 0.15, sx, yC - r * 0.15); c.quadraticCurveTo(x2, yC - r * 0.15, x2, yC + r * 0.55); c.lineTo(x2, yF); c.closePath();
      try { c.fill('evenodd'); } catch (e3) { c.fill(); }
      // cobertura no alto do morro (neve, grama, areia clara, glacê de doce; no neon, um fio de luz)
      c.save(); c.beginPath(); c.moveTo(sx - L, topo + escY * 1800); c.quadraticCurveTo(sx - L * 0.7, topo, sx, topo); c.quadraticCurveTo(sx + L * 0.7, topo, sx + L, topo + escY * 1800);
      c.lineTo(sx + L, topo + escY * 2500); c.quadraticCurveTo(sx + L * 0.7, topo + escY * 700, sx, topo + escY * 700); c.quadraticCurveTo(sx - L * 0.7, topo + escY * 700, sx - L, topo + escY * 2500); c.closePath();
      c.fillStyle = css(mixRgb(hexRgb(bc[2]), hexRgb(bc[3]), nt)); c.fill(); c.restore();
      // sombra por dentro da boca e contorno de luz (amarelo de dia, neon à noite)
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = Math.max(1, esc * 160);
      c.beginPath(); c.moveTo(x1, yF); c.lineTo(x1, yC + r * 0.55); c.quadraticCurveTo(x1, yC - r * 0.15, sx, yC - r * 0.15); c.quadraticCurveTo(x2, yC - r * 0.15, x2, yC + r * 0.55); c.lineTo(x2, yF); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.35 * nt; c.strokeStyle = corLuz; c.lineWidth = Math.max(1.5, esc * 70); c.stroke();
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
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

  // braços do skatista (desenhados ao vivo, seguem a curva): o de trás antes do boneco, o da frente depois
  function bracos(c, vv, x0, y0, w, h, cor, fase, lado, qual) { if (vv && vv.bracos && V()) V().bracosSkate(c, x0, y0, w, h, cor || '#7b2cbf', fase, lado, qual); }
  // em que momento da remada está o skatista (obj guarda o ritmo): mais rápido, rema mais depressa;
  // pulando ou parado, os dois pés ficam no shape
  function faseSkate(obj, cor, e) {
    var tt = Date.now() / 1000, dt = obj.tPe ? Math.min(0.1, Math.max(0, tt - obj.tPe)) : 0, rap = Math.min(1, (cor.vel || 0) / e.pista.cfg.velMax);
    obj.tPe = tt;
    if (cor.pulo > 0 || rap < 0.03) { obj.fPe = 0.8; return 0.8; }
    obj.fPe = ((obj.fPe == null ? 0.8 : obj.fPe) + dt * (0.6 + 0.5 * rap)) % 1;
    return obj.fPe;
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
    var segAqui = P.achar(e.pista, j.z), forcaLuz = segAqui.tunel ? 1 : noiteEm(segAqui.i), acesas = forcaLuz > 0.02;   // faróis acendem aos poucos ao anoitecer
    if (acesas) {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = forcaLuz;
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
    var faseQ = spr.quadros ? faseSkate(vs, j, e) : 0, corJ = INFO[j.n] && INFO[j.n].cor;
    bracos(c, vv, -cw / 2, -ch, cw, ch, corJ, faseQ, vs.lado, 'longe');
    c.drawImage((spr.quadros ? S.quadro(spr, faseQ) : spr).img, -cw / 2, -ch, cw, ch);
    bracos(c, vv, -cw / 2, -ch, cw, ch, corJ, faseQ, vs.lado, 'perto');
    pilotoVivo(c, vv, -cw / 2, -ch, cw, ch, INFO[j.n], j.n * 3.3, 7);
    extrasDepois(c, vv, cw, ch, tt, j.turbo > 0);
    if (acesas && !voa) {   // lanternas brilhando
      c.globalCompositeOperation = 'lighter';
      luz(c, -cw * 0.36, -ch * 0.4, cw * 0.22, '#ff2a2a', 0.75 * forcaLuz); luz(c, cw * 0.36, -ch * 0.4, cw * 0.22, '#ff2a2a', 0.75 * forcaLuz);
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
    var faseP = tt * 0.8, ladoP = vv && vv.bracos ? Math.sin(tt * 0.9) * 0.9 : 0;   // na garagem o skatista faz curvas para os dois lados
    if (ladoP) c.rotate(ladoP * 0.12);
    extrasAntes(c, vv, cw, ch, tt);
    bracos(c, vv, -cw / 2, -ch, cw, ch, cor, faseP, ladoP, 'longe');
    c.drawImage(S.quadro(spr, faseP).img, -cw / 2, -ch, cw, ch);
    bracos(c, vv, -cw / 2, -ch, cw, ch, cor, faseP, ladoP, 'perto');
    pilotoVivo(c, vv, -cw / 2, -ch, cw, ch, infoPiloto(cor, piloto, foto, pers), 1.2, 4.5);   // na garagem vira mais vezes
    extrasDepois(c, vv, cw, ch, tt, false);
    c.restore();
  }
  // miniatura parada (cartões da garagem)
  function miniatura(cv, cor, piloto, veic, foto, pers) {
    var c = cv.getContext('2d'), spr = spritePrevia(cor, veic), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    var esc = Math.min(W * 0.9 / spr.w, H * 0.9 / spr.h), cw = spr.w * esc, ch = spr.h * esc;
    var vvM = V() ? V().achar(veic) : null;
    bracos(c, vvM, (W - cw) / 2, H * 0.95 - ch, cw, ch, cor, 0.3, 0, 'longe');
    c.drawImage(S.quadro(spr, 0.3).img, (W - cw) / 2, H * 0.95 - ch, cw, ch);   // o skate aparece empurrando
    bracos(c, vvM, (W - cw) / 2, H * 0.95 - ch, cw, ch, cor, 0.3, 0, 'perto');
    if (Cab()) Cab().desenhar(c, V().achar(veic), (W - cw) / 2, H * 0.95 - ch, cw, ch, infoPiloto(cor, piloto, foto, pers), 50, 0, 1000);   // parado, de costas
  }

  function definirEstilo(v) { ESTILO = v === 'colorido' || v === 'neon' ? v : 'misto'; cachePal = []; }
  raiz.VruuumDesenho = { definirEstilo: definirEstilo, preparar: preparar, desenhar: desenhar, passo: passo, evento: evento, vistas: vistas, margemLocal: margemLocal, botaoPulo: botaoPulo, previa: previa, miniatura: miniatura, milhar: milhar, ALT_VOO: ALT_VOO, TEMAS: TEMAS, CORES: CORES, PILOTOS: PILOTOS };
})(this);
