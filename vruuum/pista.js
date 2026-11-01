/* Vruuum! — a pista: monta a estrada (retas, curvas, morros e 4 mundos) e espalha estrelas,
   obstáculos, turbos, rampas e enfeites. Puro (sem tela): roda no navegador e no Node (testes).
   Mesma semente = mesma pista, então os dois jogadores correm exatamente na mesma estrada. */
(function (raiz) {
  'use strict';

  var SEG = 200;          // comprimento de um pedaço da estrada, em unidades do mundo
  var LARGURA = 2000;     // meia largura da estrada (a estrada vai de -1 a +1 em "x")
  var FAIXAS = [-2 / 3, 0, 2 / 3];
  var LISTRA = 3;         // pedaços por listra (zebra da borda e faixa do meio)
  var SOBRA = 400;        // pedaços depois da chegada, para o carro ir parando
  var ALT_CHAO = 300;     // estrela flutuando um pouco acima do asfalto
  var ALT_AR = 1500;      // estrela no ar (só pega quem pulou da rampa)

  var MUNDOS = ['praia', 'floresta', 'doces', 'neve', 'neon'];
  var ENFEITES = {
    praia: ['coqueiro', 'guardasol', 'coqueiro', 'castelo'],
    floresta: ['pinheiro', 'arvore', 'cogumelo', 'flor', 'arvore'],
    doces: ['pirulito', 'bengala', 'cupcake', 'algodao'],
    neve: ['pinheiroNeve', 'boneco', 'pinheiroNeve', 'presente'],
    neon: ['poste', 'predio', 'palmeiraNeon', 'poste']
  };

  // pedacos: tamanho da corrida (~100 s em velocidade cheia); obst: quanto obstáculo (0 a 1)
  var NIVEIS = {
    crianca: { pedacos: 3600, velMax: 7200, obst: 0.35, carros: 6, tuneis: 2, velCarro: [0.25, 0.4], perdeCarro: 1, perdeCone: 0, curva: 0.6, morro: 0.5, centrifuga: 0.12, limiteX: 1.3, ajuda: true },
    normal: { pedacos: 4800, velMax: 9600, obst: 0.7, carros: 14, tuneis: 3, velCarro: [0.3, 0.55], perdeCarro: 3, perdeCone: 1, curva: 1, morro: 1, centrifuga: 0.25, limiteX: 1.5, ajuda: false },
    turbo: { pedacos: 6000, velMax: 12000, obst: 1, carros: 24, tuneis: 4, velCarro: [0.32, 0.65], perdeCarro: 5, perdeCone: 2, curva: 1.3, morro: 1.2, centrifuga: 0.32, limiteX: 1.6, ajuda: false }
  };

  // sorteio com semente (mulberry32): mesma semente, mesma sequência
  function sorteio(semente) {
    var a = semente >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function suave(a, b, p) { return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5); }
  function entra(a, b, p) { return a + (b - a) * Math.pow(p, 2); }

  function montar(nivel, semente) {
    var cfg = NIVEIS[nivel] || NIVEIS.normal;
    var r = sorteio(semente || 1);
    var segs = [];
    function entre(a, b) { return a + r() * (b - a); }
    function inteiro(a, b) { return Math.floor(entre(a, b + 1)); }
    function ultimoY() { return segs.length ? segs[segs.length - 1].p2.y : 0; }
    function add(curva, y) {
      var n = segs.length;
      segs.push({ i: n, p1: { y: ultimoY(), z: n * SEG }, p2: { y: y, z: (n + 1) * SEG }, curva: curva, enfeites: [], coisas: [], mundo: 0, listra: Math.floor(n / LISTRA) % 2, xadrez: false });
    }
    function trecho(nEntra, nFica, nSai, curva, altura) {
      var y0 = ultimoY(), y1 = y0 + altura * SEG, total = nEntra + nFica + nSai, n;
      for (n = 0; n < nEntra; n++) add(entra(0, curva, n / nEntra), suave(y0, y1, n / total));
      for (n = 0; n < nFica; n++) add(curva, suave(y0, y1, (nEntra + n) / total));
      for (n = 0; n < nSai; n++) add(suave(curva, 0, n / nSai), suave(y0, y1, (nEntra + nFica + n) / total));
    }
    function morro() { return (r() < 0.5 ? -1 : 1) * entre(0, 40) * cfg.morro; }

    // largada: uma reta para o 3-2-1
    trecho(10, 90, 10, 0, 0);
    while (segs.length < cfg.pedacos - 160) {
      var p = r(), lado = r() < 0.5 ? -1 : 1, forca = entre(2, 6) * cfg.curva;
      if (p < 0.25) trecho(20, inteiro(20, 60), 20, 0, morro());                          // reta
      else if (p < 0.6) trecho(25, inteiro(25, 70), 25, lado * forca, morro());           // curva
      else if (p < 0.8) { trecho(25, inteiro(20, 40), 25, lado * forca, morro()); trecho(25, inteiro(20, 40), 25, -lado * forca, morro()); } // S
      else { var k; for (k = 0; k < 3; k++) trecho(15, 10, 15, 0, (k % 2 ? -1 : 1) * entre(10, 25) * cfg.morro); } // morrinhos
    }
    // reta final e chegada, depois a sobra para ir parando
    trecho(20, 120, 20, 0, -ultimoY() / SEG * 0.5);
    var chegada = segs.length;
    trecho(10, SOBRA - 20, 10, 0, 0);

    // mundos: 4 dos 5, em ordem sorteada, cada um com 1/4 do caminho até a chegada
    var ordem = MUNDOS.slice();
    for (var i = ordem.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), tmp = ordem[i]; ordem[i] = ordem[j]; ordem[j] = tmp; }
    ordem = ordem.slice(0, 4);
    var quarto = chegada / 4;
    segs.forEach(function (s) { s.mundo = Math.min(3, Math.floor(s.i / quarto)); });
    for (i = chegada; i < chegada + 4; i++) segs[i].xadrez = true;

    // enfeites dos dois lados (não batem: são só paisagem)
    for (i = 4; i < segs.length; i += inteiro(2, 4)) {
      var lista = ENFEITES[ordem[segs[i].mundo]];
      segs[i].enfeites.push({ tipo: lista[inteiro(0, lista.length - 1)], x: -(1.5 + r() * 1.5) });
      if (r() < 0.8) segs[i].enfeites.push({ tipo: lista[inteiro(0, lista.length - 1)], x: 1.5 + r() * 1.5 });
    }
    segs[12].enfeites.push({ tipo: 'largada', x: 0 });
    for (i = 1; i < 4; i++) segs[Math.round(quarto * i)].enfeites.push({ tipo: 'portal', x: 0, mundo: i });
    segs[chegada].enfeites.push({ tipo: 'chegada', x: 0 });

    // coisas na pista: grupos com espaço entre eles; nunca as 3 faixas fechadas
    function coisa(idx, tipo, x, alt) { if (idx < chegada - 20) segs[idx].coisas.push({ tipo: tipo, x: x, alt: alt || 0, pego: [false, false] }); }
    function faixa() { return FAIXAS[inteiro(0, 2)]; }
    function filaEstrelas(idx, x, n, passo) { for (var k = 0; k < n; k++) coisa(idx + k * passo, 'estrela', x, ALT_CHAO); return idx + n * passo; }
    var idx = 130, folga = Math.round(34 - 18 * cfg.obst);
    while (idx < chegada - 40) {
      var q = r(), x = faixa(), fim = idx;
      if (q < 0.22) fim = filaEstrelas(idx, x, 6, 4);
      else if (q < 0.36) { // zigue-zague de estrelas
        for (var k = 0; k < 9; k++) coisa(idx + k * 4, 'estrela', Math.sin(k / 8 * Math.PI * 2) * 0.66, ALT_CHAO);
        fim = idx + 36;
      } else if (q < 0.36 + 0.3 * cfg.obst) { // cones em 1 ou 2 faixas, estrelas na faixa livre
        var livre = inteiro(0, 2), dois = cfg.obst >= 0.5 && r() < 0.6;
        coisa(idx, 'cone', FAIXAS[(livre + 1) % 3]);
        if (dois) coisa(idx, 'cone', FAIXAS[(livre + 2) % 3]);
        fim = filaEstrelas(idx - 8, FAIXAS[livre], 4, 4);
      } else if (q < 0.5 + 0.25 * cfg.obst) { coisa(idx, 'lama', x); fim = filaEstrelas(idx + 10, FAIXAS[(FAIXAS.indexOf(x) + 1) % 3], 4, 4); }
      else if (q < 0.85) { coisa(idx, 'turbo', x); fim = filaEstrelas(idx + 6, x, 5, 5); }
      else { // rampa: um arco de estrelas no ar logo depois
        coisa(idx, 'rampa', x);
        for (k = 0; k < 5; k++) coisa(idx + 6 + k * 4, 'estrela', x, ALT_AR);
        fim = idx + 28;
      }
      idx = fim + folga + inteiro(0, 12);
    }

    // carrinhos do trânsito (andam devagar na sua faixa; os jogadores passam por eles)
    var carros = [];
    for (i = 0; i < cfg.carros; i++) {
      carros.push({ z: (inteiro(260, chegada - 60)) * SEG, x: faixa(), vel: entre(cfg.velCarro[0], cfg.velCarro[1]) * cfg.velMax, tipo: r() < 0.18 ? 'onibus' : 'carro' + inteiro(0, 4) });
    }

    // túneis: trechos cobertos (no céu, um tubo de anéis de luz), longe dos portais, da largada e da chegada
    var tuneis = [], tentativas = 0;
    while (tuneis.length < cfg.tuneis && tentativas++ < 80) {
      var tIni = inteiro(260, chegada - 280), tFim = tIni + inteiro(70, 130), ok = true;
      tuneis.forEach(function (t) { if (tFim > t[0] - 80 && tIni < t[1] + 80) ok = false; });
      for (var q = 1; q < 4; q++) { var pq = Math.round(quarto * q); if (pq > tIni - 40 && pq < tFim + 40) ok = false; }
      if (ok) tuneis.push([tIni, tFim]);
    }
    tuneis.sort(function (a, b) { return a[0] - b[0]; });
    tuneis.forEach(function (t, k) {
      for (var i2 = t[0]; i2 < t[1]; i2++) { segs[i2].tunel = k + 1; segs[i2].enfeites = []; }
      segs[t[0]].entrada = true;
    });

    return { segs: segs, chegada: chegada, tuneis: tuneis, zChegada: chegada * SEG, comprimento: segs.length * SEG, nivel: NIVEIS[nivel] ? nivel : 'normal', cfg: cfg, mundos: ordem, carros: carros, semente: semente };
  }

  function achar(pista, z) {
    var i = Math.floor(z / SEG);
    if (i < 0) i = 0;
    if (i >= pista.segs.length) i = pista.segs.length - 1;
    return pista.segs[i];
  }

  var VruuumPista = { SEG: SEG, LARGURA: LARGURA, FAIXAS: FAIXAS, ALT_CHAO: ALT_CHAO, ALT_AR: ALT_AR, MUNDOS: MUNDOS, ENFEITES: ENFEITES, NIVEIS: NIVEIS, sorteio: sorteio, montar: montar, achar: achar };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumPista;
  else raiz.VruuumPista = VruuumPista;
})(this);
