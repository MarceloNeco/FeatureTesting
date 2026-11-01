// Testes de arquivos da Rabiscolândia: node --test rabiscolandia/teste/*.test.js (rodar da raiz do repositório)
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
  assert.ok(!/<script(?![^>]*src)[^>]*>/.test(html), 'script inline');
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) assert.ok(fs.existsSync(path.join(pasta, m[1])), m[1]);
  assert.match(html, /data-recurso="rabiscolandia"/);
  for (const m of html.matchAll(/data-t="([^"]*)"/g)) assert.equal(m[1].split('|').length, 2, 'texto sem as duas línguas: ' + m[1]);
});

test('ids usados no app.js e no tv.js existem no index.html', () => {
  const html = ler('index.html');
  for (const f of ['app.js', 'tv.js']) for (const m of ler(f).matchAll(/\$\('([A-Za-z0-9]+)'\)/g)) assert.ok(html.includes('id="' + m[1] + '"'), f + ': falta id ' + m[1]);
});

test('textos t(pt, en) do app e da TV sempre nas duas línguas', () => {
  for (const f of ['app.js', 'tv.js']) {
    const js = ler(f);
    for (const m of js.matchAll(/\bt\('((?:[^'\\]|\\.)*)'\s*\)/g)) assert.fail(f + ': t() só com uma língua: ' + m[1]);
  }
});

test('interruptor rabiscolandia no recursos-do-app.json do Feature Tester', () => {
  const r = JSON.parse(fs.readFileSync(path.join(pasta, '..', 'recursos-do-app.json'), 'utf8'));
  assert.ok(r.recursos.some(x => x.id === 'rabiscolandia' && x.pagina === 'rabiscolandia/'));
});

test('modelo da mão existe na pasta compartilhada da Bagunçolândia', () => {
  const base = path.join(pasta, '..', 'baguncolandia', 'libs', 'mediapipe');
  for (const f of ['hand_landmarker.task', 'vision_bundle.mjs', 'vision_wasm_internal.wasm', 'vision_wasm_internal.js']) assert.ok(fs.existsSync(path.join(base, f)), 'falta ' + f);
  assert.match(ler('mao.js'), /hand_landmarker\.task/);
});

test('nenhum segredo: só a chave publishable do Supabase', () => {
  for (const f of fs.readdirSync(pasta).filter(f => f.endsWith('.js'))) {
    const js = ler(f);
    assert.ok(!/service_role|sb_secret_|sk-[A-Za-z0-9]{20}|AIza[0-9A-Za-z_-]{30}/.test(js), f + ' parece ter segredo');
  }
});
