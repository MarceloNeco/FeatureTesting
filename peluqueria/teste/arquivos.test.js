// Testes de arquivos da Peluqueria: node --test peluqueria/teste/
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const pasta = path.resolve(__dirname, '..');
const ler = f => fs.readFileSync(path.join(pasta, f), 'utf8');
const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob: mediastream:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'";

function arquivosSW() {
  const m = ler('sw.js').match(/var ARQUIVOS = (\[[^\]]*\])/);
  return JSON.parse(m[1].replace(/'/g, '"'));
}
function todos(dir, base = '') {
  let r = [];
  for (const n of fs.readdirSync(path.join(pasta, dir))) {
    const rel = base ? base + '/' + n : n, abs = path.join(pasta, dir, n);
    if (fs.statSync(abs).isDirectory()) { if (rel !== 'teste') r = r.concat(todos(path.join(dir, n), rel)); }
    else r.push(rel);
  }
  return r;
}

test('versão igual nos três lugares', () => {
  const a = ler('app.js').match(/APP_VERSION = '([\d.]+)'/)[1];
  const s = ler('sw.js').match(/VERSAO = '([\d.]+)'/)[1];
  const v = JSON.parse(ler('versoes.json')).versoes[0];
  assert.equal(a, '0.4.0'); assert.equal(s, '0.4.0'); assert.equal(v.versao, '0.4.0');
  for (const k of ['data', 'hora', 'pt', 'en']) assert.ok(v[k], 'versoes.json sem ' + k);
});

test('sw.js guarda todos os arquivos que existem', () => {
  const lista = arquivosSW();
  for (const a of lista) if (a !== './' && a !== '../recursos.js') assert.ok(fs.existsSync(path.join(pasta, a)), 'falta no disco: ' + a);
  const publicados = todos('.').filter(f => /\.(js|css|html|json|svg|png|woff2|webmanifest)$/.test(f))
    .filter(f => f !== 'sw.js' && !/^meus\/.*\.(png|jpe?g|webp|svg)$/.test(f));
  for (const f of publicados) assert.ok(lista.includes(f), 'sw.js não guarda: ' + f);
});

for (const pagina of ['index.html'].concat(fs.existsSync(path.join(pasta, 'marcar.html')) ? ['marcar.html'] : [])) {
  test('CSP sem inline: ' + pagina, () => {
    const h = ler(pagina);
    assert.ok(h.includes('content="' + CSP + '"'), 'CSP diferente');
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(h), 'script inline');
    assert.ok(!/\sstyle="/i.test(h), 'style inline');
    assert.ok(!/\son[a-z]+="/i.test(h), 'evento inline');
  });
}

test('Peluqueria aparece no Feature Tester e obedece o interruptor', () => {
  const rec = JSON.parse(fs.readFileSync(path.join(pasta, '..', 'recursos-do-app.json'), 'utf8'));
  const r = rec.recursos.find(x => x.id === 'peluqueria');
  assert.ok(r, 'sem entrada em recursos-do-app.json');
  assert.equal(r.pagina, 'peluqueria/');
  assert.ok(r.nome.pt && r.nome.en);
  assert.ok(fs.readFileSync(path.join(pasta, '..', 'index.html'), 'utf8').includes('url: "peluqueria/"'));
  assert.ok(ler('index.html').includes('data-recurso="peluqueria"'));
});

test('documentos da pasta existem', () => {
  for (const f of ['LEIA-ME.md', 'CREDITOS.md', 'PENDENCIAS.md', 'meus/LEIA-ME.md', 'musicas/LEIA-ME.md']) assert.ok(fs.existsSync(path.join(pasta, f)), 'falta ' + f);
});
