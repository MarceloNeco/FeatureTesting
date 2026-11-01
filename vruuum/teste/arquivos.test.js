// Testes de arquivos do Vruuum!: node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const pasta = path.resolve(__dirname, '..');
const ler = f => fs.readFileSync(path.join(pasta, f), 'utf8');

test('versão igual nos três lugares', () => {
  const a = ler('app.js').match(/APP_VERSION = '([\d.]+)'/)[1];
  const s = ler('sw.js').match(/VERSAO = '([\d.]+)'/)[1];
  const v = JSON.parse(ler('versoes.json')).versoes[0];
  assert.equal(a, s); assert.equal(v.versao, a);
  for (const k of ['data', 'hora', 'pt', 'en']) assert.ok(v[k], 'versoes.json sem ' + k);
  assert.equal(v.pt.length, v.en.length, 'PT e EN com o mesmo número de itens');
});

test('sw.js guarda todos os arquivos publicados', () => {
  const lista = JSON.parse(ler('sw.js').match(/var ARQUIVOS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const a of lista) if (a !== './' && a !== '../recursos.js') assert.ok(fs.existsSync(path.join(pasta, a)), 'falta no disco: ' + a);
  const publicados = fs.readdirSync(pasta).filter(f => /\.(js|css|html|json|png|webmanifest)$/.test(f) && f !== 'sw.js');
  publicados.push('fontes/fredoka.woff2');
  for (const f of publicados) assert.ok(lista.includes(f), 'sw.js não guarda: ' + f);
});

test('index.html: CSP sem script inline, scripts existem, interruptor e textos PT|EN', () => {
  const html = ler('index.html');
  assert.match(html, /Content-Security-Policy/);
  assert.ok(!/<script>(?!\s*<\/script>)/.test(html) && !/<script(?![^>]*src)[^>]*>/.test(html), 'script inline');
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) if (!m[1].startsWith('../')) assert.ok(fs.existsSync(path.join(pasta, m[1])), m[1]);
  assert.match(html, /data-recurso="vruuum"/);
  for (const m of html.matchAll(/data-t="([^"]*)"/g)) assert.equal(m[1].split('|').length, 2, 'texto sem as duas línguas: ' + m[1]);
});

test('ids usados no app.js existem no index.html', () => {
  const html = ler('index.html'), js = ler('app.js');
  for (const m of js.matchAll(/\$\('([A-Za-z0-9]+)'\)/g)) assert.ok(html.includes('id="' + m[1] + '"'), 'falta id ' + m[1]);
});

test('interruptor vruuum no recursos-do-app.json do Feature Tester', () => {
  const r = JSON.parse(fs.readFileSync(path.join(pasta, '..', 'recursos-do-app.json'), 'utf8'));
  assert.ok(r.recursos.some(x => x.id === 'vruuum' && x.pagina === 'vruuum/'));
});

test('baixar: baixar.js na página e interruptores fora do arquivo', () => {
  const html = ler('index.html');
  assert.match(html, /<script src="baixar.js"><\/script>/);
  assert.match(html, /recursos\.js"[^>]*data-fora-do-arquivo/);
  assert.match(html, /id="btGuardar"/);
  assert.ok(!/id="btBaixar"|id="btInstalar"/.test(html), 'um botão só para guardar no celular');
});
