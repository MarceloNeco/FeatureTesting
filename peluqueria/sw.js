/* Peluqueria — service worker: guarda a pasta no aparelho para abrir sem internet.
   Código (html, js, css, json): rede primeiro com 4 s de espera, senão a cópia; fontes, imagens e MP3:
   cópia primeiro (os MP3 só entram no cache na primeira vez que tocam). Cache com o nome do app: só
   apaga caches "peluqueria-" (nunca os dos outros apps da mesma origem).
   Subir VERSAO a cada release (igual a APP_VERSION em app.js e a versoes.json). */
var VERSAO = '0.4.1';
var CACHE = 'peluqueria-v' + VERSAO;
var ARQUIVOS = ['./', 'index.html', 'estilo.css', 'app.js', 'jogo.js', 'cenarios.js', 'itens.js', 'desenho.js', 'trilhas.js', 'som.js', 'voz.js', 'gesto.js', 'partida.js', 'sala.js', 'esqueleto.js', 'tv.js', 'controle.js', '../baguncolandia/libs/supabase.js', 'musicas/musicas.json', 'marcar.html', 'marcar.js', 'fontes/fredoka.woff2', 'icone-192.png', 'icone-512.png', 'manifest.webmanifest', 'versoes.json', 'meus/cenarios.json', 'meus/itens.json', 'cenarios/cenarios.json', 'itens/itens.json', 'cenarios/bebe.svg', 'cenarios/boneco-de-neve.svg', 'cenarios/cachorro.svg', 'cenarios/cavalo.svg', 'cenarios/coruja.svg', 'cenarios/gato.svg', 'cenarios/leao.svg', 'cenarios/pinguim.svg', 'cenarios/robo.svg', 'cenarios/sapo.svg', 'cenarios/tubarao.svg', 'cenarios/vovo.svg', 'itens/balao.svg', 'itens/bigode.svg', 'itens/boca-tubarao.svg', 'itens/bone.svg', 'itens/brinco.svg', 'itens/capacete-viking.svg', 'itens/cartola.svg', 'itens/chapeu-pirata.svg', 'itens/coroa.svg', 'itens/flor.svg', 'itens/fone.svg', 'itens/gravata-borboleta.svg', 'itens/laco.svg', 'itens/medalha.svg', 'itens/microfone.svg', 'itens/nariz-palhaco.svg', 'itens/oculos-escuros.svg', 'itens/papagaio.svg', 'itens/passarinho.svg', 'itens/peruca-oculos.svg', 'itens/pirulito.svg', 'itens/sorvete.svg', '../recursos.js'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ARQUIVOS.map(function (a) { return c.add(a).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('peluqueria-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.mp3$/i.test(url.pathname)) {
    // o <audio> pede pedaços (Range → 206), que o cache não aceita: guarda uma cópia inteira (200) pela URL
    e.respondWith(caches.match(url.href).then(function (r) {
      return r || fetch(new Request(url.href)).then(function (resp) {
        if (resp.status === 200) { var c2 = resp.clone(); caches.open(CACHE).then(function (c) { return c.put(url.href, c2); }).catch(function () {}); }
        return resp;
      });
    }));
    return;
  }
  if (/\.(woff2|png|webp|jpg|jpeg|svg|mjs|wasm|task)$/i.test(url.pathname)) {
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
