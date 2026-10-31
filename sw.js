/* sw.js do FeatureTesting — mínimo, só para o "Adicionar à tela inicial" funcionar.
   Não guarda nada: sempre busca na rede (laboratório muda toda hora). */
var VERSAO = '1.0.0';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
