/* Purpurina — service worker: guarda a pasta no aparelho para abrir sem internet.
   Código (html, js, css, json): rede primeiro com 4 s de espera, senão a cópia; fonte e imagens:
   cópia primeiro. Músicas gravadas (MP3, ~47 MB): as 3 primeiras baixadas em segundo plano depois de instalar, as outras na primeira
   vez que tocam, num cache próprio que não muda a cada versão (não baixam de novo). Cache com o nome do app: só apaga caches "purpurina-" (nunca os dos outros apps
   da mesma origem). Subir VERSAO a cada release (igual a APP_VERSION em app.js e a versoes.json). */
var VERSAO = '0.17.0';
var CACHE = 'purpurina-v' + VERSAO;
var ARQUIVOS = ['./', 'index.html', 'estilo.css', 'pecas.js', 'visual.js', 'boneca.js', 'som.js', 'app.js', 'sala.js', 'musica.js', 'tv.js', 'baixar.js', 'fontes/fredoka.woff2', 'icone-192.png', 'icone-512.png', 'manifest.webmanifest', 'versoes.json', '../recursos.js', '../atualizar.js', '../telacheia.js', '../janela.js', '../cofre.js', 'ia-foto.js'];
var CACHE_MUSICAS = 'purpurina-musicas-v1';
var MUSICAS = ['musicas/disco-medusae.mp3', 'musicas/glitter-blast.mp3', 'musicas/who-likes-to-party.mp3', 'musicas/miami-viceroy.mp3', 'musicas/boogie-party.mp3', 'musicas/raving-energy.mp3', 'musicas/airport-lounge.mp3', 'musicas/cloud-dancer.mp3', 'musicas/got-funk.mp3', 'musicas/newer-wave.mp3', 'musicas/moonlight-beach.mp3', 'musicas/your-call.mp3', 'musicas/club-seamus.mp3', 'musicas/celebration.mp3', 'musicas/funky-one.mp3', 'musicas/neon-laser-horizon.mp3', 'musicas/beauty-flow.mp3', 'musicas/voxel-revolution.mp3', 'musicas/c-funk.mp3', 'musicas/laserpack.mp3', 'musicas/shiny-tech.mp3'];
// em segundo plano só as 3 primeiras (a rádio começa por elas); as outras ficam guardadas na primeira vez que tocam.
// Música que saiu da rádio sai também do aparelho.
function guardarMusicas() {
  return caches.open(CACHE_MUSICAS).then(function (c) {
    var todas = MUSICAS.map(function (m) { return new URL(m, self.registration.scope).href; });
    c.keys().then(function (ks) { ks.forEach(function (k) { if (todas.indexOf(k.url) < 0) c.delete(k); }); });
    return Promise.all(MUSICAS.slice(0, 3).map(function (m) {
      var url = new URL(m, self.registration.scope).href;
      return c.match(url).then(function (r) { return r || fetch(url).then(function (resp) { if (resp.status === 200) return c.put(url, resp); }); }).catch(function () {});
    }));
  });
}
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ARQUIVOS.map(function (a) { return c.add(a).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('purpurina-') === 0 && k !== CACHE && k !== CACHE_MUSICAS; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }).then(function () { return guardarMusicas(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.mp3$/i.test(url.pathname)) {   // música: sempre a cópia inteira (o <audio> pede pedaços, o cache não)
    e.respondWith(caches.match(url.href).then(function (r) {
      return r || fetch(new Request(url.href)).then(function (resp) {
        if (resp.status === 200) { var c2 = resp.clone(); caches.open(CACHE_MUSICAS).then(function (c) { return c.put(url.href, c2); }).catch(function () {}); }
        return resp;
      });
    }));
    return;
  }
  if (/\.(woff2|png)$/i.test(url.pathname)) {
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req).then(function (resp) { if (resp.status === 200) { var c2 = resp.clone(); caches.open(CACHE).then(function (c) { return c.put(req, c2); }).catch(function () {}); } return resp; }); }));
    return;
  }
  var nav = req.mode === 'navigate';
  e.respondWith(new Promise(function (ok) {
    var feito = false, pedido = fetch(req, { cache: 'no-cache' });
    var t = setTimeout(function () { if (!feito) { feito = true; caches.match(req, { ignoreSearch: nav }).then(function (r) { ok(r || pedido); }); } }, 4000);
    pedido.then(function (resp) {
      if (resp.status === 200) { var c2 = resp.clone(); caches.open(CACHE).then(function (c) { return c.put(req, c2); }).catch(function () {}); }
      if (!feito) { feito = true; clearTimeout(t); ok(resp); }
    }).catch(function () { if (!feito) { feito = true; clearTimeout(t); caches.match(req, { ignoreSearch: nav }).then(function (r) { ok(r || Response.error()); }); } });
  }));
});
