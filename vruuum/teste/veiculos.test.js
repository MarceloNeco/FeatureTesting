// Testes da garagem (a lista; os desenhos são conferidos no navegador): node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../veiculos.js');

test('10 veículos, ids únicos, nome em PT e EN, grupo que existe', () => {
  assert.equal(V.LISTA.length, 10);
  assert.equal(new Set(V.LISTA.map(v => v.id)).size, 10);
  const grupos = V.GRUPOS.map(g => g.id);
  for (const v of V.LISTA) {
    assert.ok(grupos.includes(v.grupo), v.id);
    assert.equal(v.nome.length, 2, v.id);
    assert.equal(typeof v.desenhar, 'function', v.id);
    assert.ok(v.w > 0 && v.h > 0, v.id);
  }
});

test('avião, jato e helicóptero voam; os outros andam no chão', () => {
  assert.deepEqual(V.LISTA.filter(v => V.voa(v.id)).map(v => v.id).sort(), ['aviao', 'heli', 'jato']);
  assert.equal(V.voa('classico'), false);
  assert.equal(V.achar('nao-existe'), null);
});

test('diferenças pequenas de velocidade e curva (corrida equilibrada)', () => {
  for (const v of V.LISTA) {
    assert.ok(v.vel >= 0.9 && v.vel <= 1.12, v.id + ' vel ' + v.vel);
    assert.ok(v.curva >= 0.9 && v.curva <= 1.15, v.id + ' curva ' + v.curva);
  }
});

test('nenhum nome de marca nos veículos', () => {
  const nomes = V.LISTA.map(v => v.nome.join(' ')).join(' ').toLowerCase();
  for (const marca of ['porsche', 'ferrari', 'lamborghini', 'boeing', 'airbus', 'honda', 'yamaha']) assert.ok(!nomes.includes(marca), marca);
});

test('o skate é animado: vários quadros da perna empurrando o chão, cabeça aberta (sem capacete)', () => {
  const sk = V.achar('skate');
  assert.ok(sk.quadros >= 8, 'quadros ' + sk.quadros);
  assert.equal(sk.aberto, true);
  assert.ok(!sk.capacete);
});

