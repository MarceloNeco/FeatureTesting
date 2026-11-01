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

test('a cabeça gira de verdade: de costas (0) até olhar por cima do ombro (±GIRO_MAX), sem pulos, e volta', () => {
  let antes = C.estado(0, 0, 7).giro, maiorPasso = 0, chegouNaFrente = false;
  for (let t = 0.01; t < 2.2; t += 0.01) {
    const g = C.estado(t, 0, 7).giro;
    assert.ok(Math.abs(g) <= C.GIRO_MAX + 1e-9);
    maiorPasso = Math.max(maiorPasso, Math.abs(g - antes)); antes = g;
    if (Math.abs(Math.abs(g) - C.GIRO_MAX) < 1e-6) chegouNaFrente = true;
  }
  assert.ok(chegouNaFrente, 'olha para trás');
  assert.ok(C.GIRO_MAX > Math.PI * 0.6 && C.GIRO_MAX < Math.PI * 0.85, 'de três quartos, não de coruja');
  assert.ok(maiorPasso < 0.2, 'gira aos poucos (maior passo ' + maiorPasso.toFixed(2) + ' rad em 10 ms)');
  assert.equal(C.estado(2.5, 0, 7).giro, 0, 'voltou a ficar de costas');
});

test('uma vez vira por um lado, na outra pelo outro', () => {
  assert.ok(C.estado(1, 0, 7).giro > 0);
  assert.ok(C.estado(8, 0, 7).giro < 0);
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
