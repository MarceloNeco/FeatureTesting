// Testes das músicas de rock (só a partitura; o som é testado no navegador): node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { VruuumRock: R } = require('../rock.js');

test('3 músicas, cada uma com introdução, refrão, solo e final', () => {
  assert.equal(R.MUSICAS.length, 3);
  for (const m of R.MUSICAS) {
    assert.ok(m.bpm >= 120 && m.bpm <= 180, m.nome);
    assert.equal(m.forma[0], 'intro'); assert.equal(m.forma[m.forma.length - 1], 'fim');
    for (const n of ['refrao', 'solo']) assert.ok(m.forma.includes(n), m.nome + ' sem ' + n);
    for (const n of m.forma) assert.ok(m.secoes[n], m.nome + ' sem a seção ' + n);
  }
});

test('riff de 16 semicolcheias e melodias dentro de 2 compassos', () => {
  for (const m of R.MUSICAS) {
    assert.equal(m.riff.length, 16, m.nome);
    for (const f of m.melodias) for (const [passo, , dur] of f) { assert.ok(passo >= 0 && passo < 32); assert.ok(passo + dur <= 32, m.nome + ' nota passa do fim da frase'); }
  }
});

test('cada música dura entre 1 e 3 minutos', () => {
  for (const m of R.MUSICAS) {
    const s = R.expandir(m).length * 4 * 60 / m.bpm;
    assert.ok(s > 60 && s < 180, m.nome + ' ' + Math.round(s) + ' s');
  }
});
