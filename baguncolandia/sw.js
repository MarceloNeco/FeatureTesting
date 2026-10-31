/* Bagunçolândia — service worker: guarda a pasta inteira no aparelho (TV e celular) para abrir sem
   baixar de novo. Código (html, js, css, json): rede primeiro com 4 s de espera, senão a cópia;
   fonte, imagens e biblioteca: cópia primeiro. Cache com o nome do app (nunca apaga o dos outros apps
   da mesma origem). Subir VERSAO a cada release (igual a APP_VERSION em app.js). */
var VERSAO = '0.8.5';
var CACHE = 'bagunca-v' + VERSAO;
var ARQUIVOS = ['./', 'index.html', 'estilo.css', 'app.js', 'jogo.js', 'figuras.js', 'cenas.js', 'boneco.js', 'desenho.js', 'sala.js', 'voz.js', 'som.js', 'calibrar.js', 'config.js', 'batida.js', 'spotify.js', 'esqueleto.js', 'libs/supabase.js', 'fontes/fredoka.woff2', 'icone-192.png', 'icone-512.png', 'manifest.webmanifest', 'versoes.json', '../recursos.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ARQUIVOS.map(function (a) { return c.add(a).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('bagunca-v') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;   // YouTube, Supabase, STUN: nunca passa pelo cache
  var pesado = /\.(woff2|png|webp|jpg|jpeg|svg|wasm|task|mjs)$/i.test(url.pathname) || /\/libs\//.test(url.pathname);
  if (pesado) {
    e.respondWith(caches.match(req).then(function (r) { return r || fetch(req).then(function (resp) { if (resp.ok) caches.open(CACHE).then(function (c) { c.put(req, resp.clone()); }); return resp; }); }));
    return;
  }
  var nav = req.mode === 'navigate', guardar = !/[?&]code=/.test(url.search);
  e.respondWith(new Promise(function (ok) {
    var feito = false, pedido = fetch(req, { cache: 'no-cache' });
    var t = setTimeout(function () { if (!feito) { feito = true; caches.match(req, { ignoreSearch: nav }).then(function (r) { ok(r || pedido); }); } }, 4000);
    pedido.then(function (resp) {
      if (resp.ok && guardar) caches.open(CACHE).then(function (c) { c.put(req, resp.clone()); });
      if (!feito) { feito = true; clearTimeout(t); ok(resp); }
    }).catch(function () { if (!feito) { feito = true; clearTimeout(t); caches.match(req, { ignoreSearch: nav }).then(function (r) { ok(r || Response.error()); }); } });
  }));
});
