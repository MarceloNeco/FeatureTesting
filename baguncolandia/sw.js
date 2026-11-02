/* Bagunçolândia mudou para /kids/baguncolandia/. Este service worker substitui o antigo e se desliga:
   apaga só as cópias guardadas do endereço ANTIGO (/FeatureTesting/baguncolandia/ — as do novo, /kids/baguncolandia/, ficam),
   tira o próprio registro e recarrega as abas abertas, que então vão para o endereço novo. */
var ANTIGO = '/FeatureTesting/baguncolandia/';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.map(function (n) {
      return caches.open(n).then(function (c) {
        return c.keys().then(function (reqs) {
          return Promise.all(reqs.filter(function (r) { return new URL(r.url).pathname.indexOf(ANTIGO) === 0; })
            .map(function (r) { return c.delete(r); }));
        });
      });
    }));
  }).then(function () { return self.registration.unregister(); })
    .then(function () { return self.clients.matchAll({ type: 'window' }); })
    .then(function (abas) { abas.forEach(function (a) { try { a.navigate(a.url); } catch (er) {} }); }));
});
