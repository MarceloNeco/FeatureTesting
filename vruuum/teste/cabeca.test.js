// Testes do piloto animado: node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../cabeca.js');
const V = require('../veiculos.js');

test('o piloto fica quase sempre de costas e vira por 2 s a cada período', () => {
  let frente = 0, total = 0;
  for (let t = 0; t < 70; t += 0.05) { total++; if (C.estado(t, 0, 7).frente) frente++; }
  const parte = frente / total;
  assert.ok(parte > 0.08 && parte < 0.22, 'de frente ' + (parte * 100).toFixed(0) + '% do tempo');
  assert.equal(C.estado(5, 0, 7).frente, false);
  assert.equal(C.estado(1, 0, 7).frente, true);
  assert.ok(C.estado(1, 0, 7).sorriso > 0, 'sorri quando olha para trás');
});

test('o giro encolhe e abre (sem pular de costas para frente de uma vez)', () => {
  const sx = [0.05, 0.25, 0.45, 0.55, 1.55, 1.75, 1.95].map(t => C.estado(t, 0, 7).sx);
  assert.ok(sx[1] < 0.6, 'quase de lado no meio do giro');
  for (const v of sx) assert.ok(v >= 0 && v <= 1);
});

test('todo bichinho tem jeito de ser visto de costas', () => {
  for (const e of ['🐱', '🐶', '🦄', '🐼', '🐸', '🐰', '🦊', '🐯']) assert.ok(C.PERFIS[e], e);
});

test('todo veículo diz onde fica a cabeça e a janela que recorta o piloto', () => {
  for (const v of V.LISTA) {
    assert.ok(v.cab && v.cab.length === 3, v.id);
    assert.ok(v.janela && (v.janela.poli || v.janela.elipse), v.id);
    assert.ok(v.cab[0] > 0 && v.cab[0] < 1 && v.cab[1] > 0 && v.cab[1] < 1, v.id);
  }
});
