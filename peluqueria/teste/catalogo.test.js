// Catálogo de cenários e itens da Peluqueria: node --test peluqueria/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const P = require('../jogo.js');
const pasta = path.resolve(__dirname, '..');
const json = f => JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8'));
const CENARIOS = ['cachorro', 'gato', 'tubarao', 'bebe', 'vovo', 'coruja', 'leao', 'robo', 'sapo', 'cavalo', 'pinguim', 'boneco-de-neve'];
const ITENS = { 'peruca-oculos': 'olhos', 'boca-tubarao': 'boca', coroa: 'cabeca', cartola: 'cabeca', bigode: 'boca', 'nariz-palhaco': 'nariz', 'oculos-escuros': 'olhos', fone: 'cabeca', laco: 'cabeca', bone: 'cabeca', 'chapeu-pirata': 'cabeca', 'capacete-viking': 'cabeca' };

test('12 cenários, todos válidos e com os 4 lugares', () => {
  const lista = json('cenarios/cenarios.json');
  assert.deepEqual(lista.map(c => c.id).sort(), CENARIOS.slice().sort());
  for (const c of lista) {
    assert.ok(P.validarCenario(c), 'inválido: ' + c.id);
    for (const l of P.LUGARES) assert.ok(c.lugares[l], c.id + ' sem ' + l);
    assert.ok(fs.existsSync(path.join(pasta, 'cenarios', c.arquivo)), 'falta ' + c.arquivo);
  }
});

test('12 itens, todos válidos e no lugar certo', () => {
  const lista = json('itens/itens.json');
  assert.deepEqual(lista.map(i => i.id).sort(), Object.keys(ITENS).sort());
  for (const i of lista) {
    assert.ok(P.validarItem(i), 'inválido: ' + i.id);
    assert.equal(i.lugar, ITENS[i.id], i.id);
    assert.ok(fs.existsSync(path.join(pasta, 'itens', i.arquivo)), 'falta ' + i.arquivo);
  }
});

test('lugares fazem sentido (cabeça acima dos olhos, nariz, boca)', () => {
  for (const c of json('cenarios/cenarios.json')) {
    const L = c.lugares;
    assert.ok(L.cabeca.y < L.olhos.y && L.olhos.y < L.nariz.y && L.nariz.y < L.boca.y, c.id);
  }
});

test('SVGs sem script nem link de fora', () => {
  for (const d of ['cenarios', 'itens']) for (const f of fs.readdirSync(path.join(pasta, d)).filter(f => f.endsWith('.svg'))) {
    const s = fs.readFileSync(path.join(pasta, d, f), 'utf8');
    assert.ok(!/<script/i.test(s) && !/\son[a-z]+=/i.test(s) && !/href="http/i.test(s), d + '/' + f);
  }
});

test('carregar ignora meus/ quebrado', async () => {
  global.self = global;
  global.Peluqueria = P;
  global.Image = class { set src(v) { this._s = v; setTimeout(() => (/faltando/.test(v) ? this.onerror && this.onerror() : this.onload && this.onload()), 0); } get src() { return this._s; } };
  const falsos = {
    'meus/cenarios.json': '{{{',
    'meus/itens.json': JSON.stringify([{ id: 'mal', nome: 'Mal', arquivo: '../x.png', lugar: 'cabeca', encaixe: { x: 0.5, y: 0.5 } }, { id: 'sumiu', nome: 'Sumiu', arquivo: 'faltando.png', lugar: 'cabeca', encaixe: { x: 0.5, y: 0.5 } }])
  };
  global.fetch = async (url) => {
    const u = url.replace(/\?.*$/, '');
    const corpo = u in falsos ? falsos[u] : fs.readFileSync(path.join(pasta, u), 'utf8');
    return { ok: true, text: async () => corpo };
  };
  delete require.cache[require.resolve('../cenarios.js')]; delete require.cache[require.resolve('../itens.js')];
  const C = require('../cenarios.js'), I = require('../itens.js');
  const c = await C.carregar(), i = await I.carregar();
  assert.equal(c.jogo.length, 12); assert.equal(i.jogo.length, 12);
  assert.deepEqual(c.meus, []); assert.deepEqual(i.meus, []);
  assert.ok(C.avisos.length >= 1 && I.avisos.length >= 2, JSON.stringify([C.avisos, I.avisos]));
  assert.ok(c.jogo[0].img && c.jogo[0].src.startsWith('cenarios/'));
});
