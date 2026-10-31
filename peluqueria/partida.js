/* Peluqueria — partida na TV (puro; testado no Node): 1 ou 2 jogadores com a MESMA sequência de quedas
   (mesma semente). Cada jogador para o seu item; a próxima queda vem 2 s depois que todos pararam (ou que o
   item passou sem toque = LONGE). eventos() devolve os resultados novos para a tela desenhar. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica(require('./jogo.js'));
  else root.PeluqueriaPartida = fabrica(root.Peluqueria);
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';
  var ESPERA = 2;

  function criar(op) {
    var n = op.jogadores === 2 ? 2 : 1, rodadas = [], fila = [], espera = 0, pausada = false;
    for (var k = 0; k < n; k++) rodadas.push(P.criarRodada({ nivel: op.nivel, cenarios: op.cenarios, itens: op.itens, semente: op.semente }));
    var p = {
      rodadas: rodadas, fase: rodadas[0].fase === 'fim' ? 'fim' : 'jogo', nivel: op.nivel,
      espera: function () { return espera; },
      pausar: function (sim) { pausada = !!sim; },
      pausada: function () { return pausada; },
      avancar: function (dt) {
        if (pausada || p.fase !== 'jogo') return;
        rodadas.forEach(function (r, j) {
          if (r.fase !== 'caindo') return;
          P.avancar(r, dt);
          if (r.fase === 'parado') fila.push({ j: j, res: r.resultados[r.resultados.length - 1] });   // passou sem toque
        });
        if (rodadas.every(function (r) { return r.fase === 'parado'; })) {
          espera += dt;
          if (espera >= ESPERA) {
            espera = 0;
            rodadas.forEach(function (r) { P.proxima(r); });
            if (rodadas[0].fase === 'fim') p.fase = 'fim';
          }
        } else espera = 0;
      },
      parar: function (j, atraso) {
        var r = rodadas[j];
        if (!r || pausada || p.fase !== 'jogo') return null;
        var res = P.parar(r, atraso);
        if (res) fila.push({ j: j, res: res });
        return res;
      },
      eventos: function () { var f = fila; fila = []; return f; },
      vencedor: function () {
        if (n < 2) return 0;
        var a = rodadas[0].pontos, b = rodadas[1].pontos;
        return a === b ? -1 : a > b ? 0 : 1;
      }
    };
    return p;
  }
  return { criar: criar, ESPERA: ESPERA };
});
