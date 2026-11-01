// Testes do volante no ar (mãos na câmera): node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const Ma = require('../maos.js');

function ler(c, maos, n = 10, t0 = 0) { for (let i = 0; i < n; i++) c.ler(maos, t0 + i * 50); }

test('volante: mão direita mais baixa vira para a direita; mais alta, para a esquerda; retas, reto', () => {
  let c = Ma.criar(); ler(c, [{ x: 0.3, y: 0.4 }, { x: 0.7, y: 0.6 }]); assert.ok(c.direcao() > 0.6, 'direita ' + c.direcao());
  c = Ma.criar(); ler(c, [{ x: 0.3, y: 0.6 }, { x: 0.7, y: 0.4 }]); assert.ok(c.direcao() < -0.6, 'esquerda ' + c.direcao());
  c = Ma.criar(); ler(c, [{ x: 0.3, y: 0.5 }, { x: 0.7, y: 0.51 }]); assert.equal(c.direcao(), 0, 'quase reto não vira');
});

test('a ordem das mãos na lista não importa', () => {
  const c = Ma.criar(); ler(c, [{ x: 0.7, y: 0.6 }, { x: 0.3, y: 0.4 }]); assert.ok(c.direcao() > 0.6);
});

test('as duas mãos subindo rápido pulam, uma vez só; devagar não pula', () => {
  const c = Ma.criar();
  ler(c, [{ x: 0.3, y: 0.6 }, { x: 0.7, y: 0.6 }], 5, 0);
  c.ler([{ x: 0.3, y: 0.52 }, { x: 0.7, y: 0.52 }], 300);
  c.ler([{ x: 0.3, y: 0.42 }, { x: 0.7, y: 0.42 }], 350);
  assert.equal(c.pulou(), true); assert.equal(c.pulou(), false);
  const d = Ma.criar();
  for (let i = 0; i < 40; i++) d.ler([{ x: 0.3, y: 0.6 - i * 0.005 }, { x: 0.7, y: 0.6 - i * 0.005 }], i * 100);
  assert.equal(d.pulou(), false, 'subindo devagar não pula');
});

test('as duas mãos lá embaixo freiam', () => {
  const c = Ma.criar(); ler(c, [{ x: 0.3, y: 0.9 }, { x: 0.7, y: 0.88 }]); assert.equal(c.freio(), true);
  ler(c, [{ x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 }]); assert.equal(c.freio(), false);
});

test('uma mão só: a posição para os lados vira', () => {
  const c = Ma.criar(); ler(c, [{ x: 0.85, y: 0.5 }]); assert.ok(c.direcao() > 0.8);
  const d = Ma.criar(); ler(d, []); assert.equal(d.direcao(), 0);
});

test('2 jogadores: cada um com as mãos na sua metade', () => {
  const [a, b] = Ma.separar([{ x: 0.1, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.9, y: 0.5 }], 2);
  assert.equal(a.length, 2); assert.equal(b.length, 2);
  assert.ok(a[0].x >= 0 && a[1].x <= 1 && b[0].x >= 0 && b[1].x <= 1);
});

test('palma: média do pulso e da base dos dedos, espelhada', () => {
  const pts = Array.from({ length: 21 }, () => ({ x: 0.2, y: 0.3 }));
  const p = Ma.palma(pts);
  assert.ok(Math.abs(p.x - 0.8) < 1e-9 && Math.abs(p.y - 0.3) < 1e-9);
});
