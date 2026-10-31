/* Peluqueria — carrega e valida os cenários: cenarios/cenarios.json (do jogo) e meus/cenarios.json (do dono).
   Também traz o carregador comum usado por itens.js. Lista quebrada, arquivo que não existe ou entrada
   inválida nunca derrubam o jogo: ficam de fora e o motivo vai para "avisos" (aparece no ?debug). */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica(require('./jogo.js'));
  else root.PeluqueriaCenarios = fabrica(root.Peluqueria);
})(typeof self !== 'undefined' ? self : this, function (P) {
  'use strict';
  var MAX_MEUS = 60;

  function imagem(src) {
    return new Promise(function (ok) {
      var im = new Image();
      im.onload = function () { ok(im); };
      im.onerror = function () { ok(null); };
      im.src = src;
    });
  }

  function lista(url, avisos) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      var v = JSON.parse(t);
      if (!Array.isArray(v)) throw new Error('não é uma lista');
      return v;
    }).catch(function (e) { avisos.push(url + ': ' + (e && e.message || e)); return []; });
  }

  /* Lê <pasta>/<arquivo> e meus/<arquivo>, valida cada entrada e carrega a imagem.
     Devolve { jogo: [...], meus: [...] }; cada entrada ganha src e img. */
  function carregarCatalogo(pasta, arquivo, validar, avisos) {
    function origem(dir, max) {
      return lista(dir + '/' + arquivo, avisos).then(function (v) {
        if (v.length > max) { avisos.push(dir + '/' + arquivo + ': só as primeiras ' + max); v = v.slice(0, max); }
        return Promise.all(v.map(function (o, k) {
          var limpo = validar(o);
          if (!limpo) { avisos.push(dir + '/' + arquivo + ': entrada ' + (k + 1) + ' inválida'); return null; }
          limpo.src = dir + '/' + limpo.arquivo;
          return imagem(limpo.src).then(function (im) {
            if (!im) { avisos.push(limpo.src + ': imagem não carregou'); return null; }
            limpo.img = im; return limpo;
          });
        }));
      }).then(function (v) { return v.filter(Boolean); });
    }
    return Promise.all([origem(pasta, Infinity), origem('meus', MAX_MEUS)]).then(function (r) { return { jogo: r[0], meus: r[1] }; });
  }

  var avisos = [];
  return {
    avisos: avisos,
    carregar: function () { return carregarCatalogo('cenarios', 'cenarios.json', P.validarCenario, avisos); },
    carregarCatalogo: carregarCatalogo
  };
});
