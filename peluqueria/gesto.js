/* Peluqueria — detector de MOVIMENTO BRUSCO (puro: sem câmera, sem DOM; testado no Node).
   Recebe o esqueleto de 13 pontos do esqueleto.js (nariz, ombros, cotovelos, pulsos, quadris, joelhos,
   tornozelos; [x, y] normalizados) e diz quando alguém levantou um braço ou chutou DE REPENTE.
   Tremidinha e balanço lento não valem: a ponta do braço ou da perna tem de andar pelo menos 0,45
   "largura de ombros" em até 0,25 s, a pelo menos 2,2 larguras por segundo. Medir em larguras de ombros faz
   a regra valer igual para quem está perto ou longe da câmera. Depois de um gatilho, 0,7 s de espera. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.PeluqueriaGesto = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var PONTAS = [5, 6, 11, 12];               // pulsos e tornozelos
  var PADRAO = { distancia: 0.45, velocidade: 2.2, janela: 250, espera: 700, suave: 0.7 };

  function ok(p) { return Array.isArray(p) && p.length === 2 && isFinite(p[0]) && isFinite(p[1]) && p[0] > -0.5 && p[0] < 1.5 && p[1] > -0.5 && p[1] < 1.5; }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
  function meio(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }

  function criar(opcoes) {
    var c = Object.assign({}, PADRAO, opcoes || {}), hist = {}, ultimo = -Infinity;
    PONTAS.forEach(function (i) { hist[i] = []; });

    function ver(pts, t) {
      if (!Array.isArray(pts) || pts.length < 13) return false;
      for (var k = 0; k < 13; k++) if (!ok(pts[k])) return false;
      // tamanho do corpo: largura dos ombros, ou (de lado) parte da altura do tronco
      var esc = Math.max(dist(pts[1], pts[2]), 0.6 * dist(meio(pts[1], pts[2]), meio(pts[7], pts[8])), 0.03);
      PONTAS.forEach(function (i) {
        var h = hist[i], ant = h[h.length - 1], x = pts[i][0], y = pts[i][1];
        if (ant) { x = ant[1] * (1 - c.suave) + x * c.suave; y = ant[2] * (1 - c.suave) + y * c.suave; }   // tira a tremida do detector
        h.push([t, x, y]);
        while (h.length && t - h[0][0] > c.janela + 60) h.shift();
      });
      if (t - ultimo < c.espera) return false;
      for (var a = 0; a < PONTAS.length; a++) {
        var h2 = hist[PONTAS[a]], atual = h2[h2.length - 1];
        for (var b = 0; b < h2.length - 1; b++) {
          var dt = (atual[0] - h2[b][0]) / 1000;
          if (dt <= 0 || dt * 1000 > c.janela) continue;
          var d = Math.hypot(atual[1] - h2[b][1], atual[2] - h2[b][2]) / esc;
          if (d >= c.distancia && d / dt >= c.velocidade) {
            ultimo = t;
            PONTAS.forEach(function (i) { var hh = hist[i]; hist[i] = hh.length ? [hh[hh.length - 1]] : []; });
            return true;
          }
        }
      }
      return false;
    }
    return { ver: ver, zerar: function () { PONTAS.forEach(function (i) { hist[i] = []; }); ultimo = -Infinity; } };
  }

  return { criar: criar, PADRAO: PADRAO };
});
