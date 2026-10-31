/* Peluqueria — o aplicativo: telas, toques e teclado, ligando o motor (jogo.js) ao desenho, ao som e à voz.
   Nada de innerHTML com dado de fora; textos por textContent. */
(function () {
  'use strict';
  var APP_VERSION = '0.1.0', APP_UPDATED = '31/10/2026';
  var $ = function (id) { return document.getElementById(id); };
  var lingua = /^en/i.test(navigator.language || '') ? 'en' : 'pt';
  function T(pt, en) { return lingua === 'en' ? en : pt; }
  function traduzir() {
    document.documentElement.lang = lingua === 'en' ? 'en' : 'pt-BR';
    document.querySelectorAll('[data-t]').forEach(function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = T(p[0], p[1] || p[0]); });
    $('btLingua').textContent = lingua === 'en' ? 'PT' : 'EN';
  }
  function tela(id) { document.querySelectorAll('.tela').forEach(function (s) { s.classList.toggle('ativa', s.id === id); }); }

  window.PeluqueriaApp = { tela: tela, T: T, get lingua() { return lingua; } };
  if (window.SolverRecursos && !SolverRecursos.ligado('peluqueria', true)) { tela('desligado'); traduzir(); return; }
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js'); } catch (e) {}

  $('ver').textContent = 'v' + APP_VERSION + ' · ' + APP_UPDATED;
  $('btLingua').addEventListener('click', function () { lingua = lingua === 'en' ? 'pt' : 'en'; traduzir(); });
  traduzir();
})();
