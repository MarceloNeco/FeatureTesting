// Testes dos personagens (domínio público): node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../personagens.js');

test('12 personagens, ids únicos, nome PT/EN, origem e desenhos de frente e costas', () => {
  assert.equal(P.LISTA.length, 12);
  assert.equal(new Set(P.LISTA.map(p => p.id)).size, 12);
  for (const p of P.LISTA) {
    assert.equal(p.nome.length, 2, p.id); assert.ok(p.origem, p.id);
    assert.equal(typeof p.frente, 'function'); assert.equal(typeof p.costas, 'function');
  }
});

test('nenhum personagem de empresa (têm dono e não podem entrar)', () => {
  const tudo = P.LISTA.map(p => (p.id + ' ' + p.nome.join(' ')).toLowerCase()).join(' ');
  for (const proibido of ['mario', 'sonic', 'mickey', 'shrek', 'rambo', 'exterminador', 'terminator', 'kevin', 'ralph', 'elsa', 'pikachu', 'batman', 'homem-aranha', 'spider'])
    assert.ok(!tudo.includes(proibido), proibido);
});

test('sortear: sem repetir e sem os já escolhidos pelos jogadores', () => {
  const s = P.sortear(3, ['emilia', 'saci']);
  assert.equal(s.length, 3);
  assert.equal(new Set(s.map(p => p.id)).size, 3);
  assert.ok(s.every(p => p.id !== 'emilia' && p.id !== 'saci'));
});
