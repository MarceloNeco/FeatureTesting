/* sw.js do The Useless Man — guarda o guia no aparelho para abrir sem internet.
   Código (página, .js, .css, .json): rede primeiro (4 s), senão a cópia guardada.
   Ícones: cópia primeiro. O cache tem o nome do app e só apaga caches com esse prefixo
   (os apps da SolverONE dividem o mesmo endereço; apagar o dos outros tiraria o modo sem internet deles). */
var VERSAO = '0.1.0';
var PREFIXO = 'dgo-useless-man-';
var CACHE = PREFIXO + 'v' + VERSAO;
var ARQUIVOS = ['./', 'index.html', 'estilo.css', 'app.js', 'guia.js', 'versoes.json', 'manifest.webmanifest',
  'icone.svg', 'icone-180.png', 'icone-192.png', 'icone-512.png', '../recursos.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ARQUIVOS.map(function (a) {
      return fetch(new Request(a, { cache: 'no-cache' })).then(function (r) { if (r.ok) return c.put(a, r); }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PREFIXO) === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function comPrazo(p, ms) {
  return new Promise(function (ok, erro) { var t = setTimeout(function () { erro(new Error('prazo')); }, ms); p.then(function (r) { clearTimeout(t); ok(r); }, function (x) { clearTimeout(t); erro(x); }); });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Só o que é do app (e o recursos.js do laboratório). O resto segue direto para a rede.
  var doApp = url.pathname.indexOf(new URL('./', self.registration.scope).pathname) === 0 || /\/recursos\.js$/.test(url.pathname);
  if (!doApp) return;
  var pagina = req.mode === 'navigate';
  var chave = pagina ? './' : req;

  if (/\.(png|svg)$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(function (c) {
      var rede = fetch(req).then(function (r) { if (r.ok) caches.open(CACHE).then(function (k) { k.put(req, r.clone()); }); return r; });
      return c || rede;
    }));
    return;
  }
  e.respondWith(comPrazo(fetch(req, { cache: 'no-cache' }), 4000).then(function (r) {
    if (r.ok) { var copia = r.clone(); caches.open(CACHE).then(function (k) { k.put(chave, copia); }); }
    return r;
  }).catch(function () {
    return caches.match(chave, { ignoreSearch: true }).then(function (c) { return c || caches.match('index.html') || Response.error(); });
  }));
});
