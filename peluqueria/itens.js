/* Peluqueria — carrega e valida os itens: itens/itens.json (do jogo) e meus/itens.json (do dono).
   Usa o carregador comum de cenarios.js. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica(require('./jogo.js'), require('./cenarios.js'));
  else root.PeluqueriaItens = fabrica(root.Peluqueria, root.PeluqueriaCenarios);
})(typeof self !== 'undefined' ? self : this, function (P, C) {
  'use strict';
  var avisos = [];
  return {
    avisos: avisos,
    carregar: function () { return C.carregarCatalogo('itens', 'itens.json', P.validarItem, avisos); }
  };
});
