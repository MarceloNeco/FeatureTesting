/* Vruuum! — service worker: guarda a pasta no aparelho para abrir sem internet.
   Código (html, js, css, json): rede primeiro com 4 s de espera, senão a cópia; fonte e imagens:
   cópia primeiro. Músicas gravadas (MP3, ~10 MB): baixadas em segundo plano depois de instalar e na
   primeira vez que tocam; sempre servidas inteiras da cópia (o <audio> pede pedaços, o cache não). Cache com o nome do app: só apaga caches "vruuum-" (nunca os dos outros apps
   da mesma origem). Subir VERSAO a cada release (igual a APP_VERSION em app.js e a versoes.json). */
var VERSAO = '1.0.0';
var CACHE = 'vruuum-v' + VERSAO;
var ARQUIVOS = ['./', 'index.html', 'estilo.css', 'pista.js', 'motor.js', 'sprites.js', 'veiculos.js', 'cabeca.js', 'desenho.js', 'rock.js', 'som.js', 'movimento.js', 'maos.js', 'selfie.js', 'app.js', 'baixar.js', 'rosto.tflite', 'fontes/fredoka.woff2', 'icone-192.png', 'icone-512.png', 'manifest.webmanifest', 'versoes.json', '../recursos.js'];
var CACHE_MUSICAS = 'vruuum-musicas-v1';   // não muda a cada versão: as músicas não baixam de novo
var MUSICAS = ['musicas/volatile-reaction.mp3', 'musicas/kart-grand-prix.mp3', 'musicas/heroic-age.mp3', 'musicas/lava.mp3', 'musicas/unholy-knight.mp3', 'musicas/las-dunas-champions.mp3'];
function guardarMusicas() {
  return caches.open(CACHE_MUSICAS).then(function (c) {
    return Promise.all(MUSICAS.map(function (m) {
      var url = new URL(m, self.registration.scope).href;
      return c.match(url).then(function (r) { return r || fetch(url).then(function (resp) { if (resp.status === 200) return c.put(url, resp); }); }).catch(function () {});
    }));
  });
}
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ARQUIVOS.map(function (a) { return c.add(a).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('vruuum-') === 0 && k !== CACHE && k !== CACHE_MUSICAS; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }).then(function () { return guardarMusicas(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.mp3$/i.test(url.pathname)) {
    e.respondWith(caches.match(url.href).then(function (r) {
      return r || fetch(new Request(url.href)).then(function (resp) {
        if (resp.status === 200) { var c2 = resp.clone(); caches.open(CACHE_MUSICAS).then(function (c) { return c.put(url.href, c2); }).catch(function () {}); }
        return resp;
      });
    }));
    return;
  }
  if (/\.(woff2|png|wasm|tflite|task|mjs)$/i.test(url.pathname)) {   // fonte, imagens e o reconhecedor de rosto: cópia primeiro
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
