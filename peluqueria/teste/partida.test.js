// Partida na TV (1 ou 2 jogadores, mesma sequência de quedas): node --test peluqueria/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../jogo.js');
const Pt = require('../partida.js');

const LUG = { cabeca: { x: 0.5, y: 0.22, tam: 0.4, rot: 0 }, boca: { x: 0.5, y: 0.56, tam: 0.26, rot: 0 } };
const CENS = Array.from({ length: 6 }, (_, i) => ({ id: 'c' + i, nome: 'c', arquivo: 'c.svg', largura: 1000, altura: 1000, lugares: LUG }));
const ITENS = Array.from({ length: 6 }, (_, i) => ({ id: 'i' + i, nome: 'i', arquivo: 'i.svg', lugar: i % 2 ? 'boca' : 'cabeca', encaixe: { x: 0.5, y: 0.5 } }));
const nova = n => Pt.criar({ nivel: 'crianca', cenarios: CENS, itens: ITENS, semente: 3, jogadores: n });
const ateAlvo = r => { const q = r.quedas[r.i]; return (q.cenario.lugares[q.lugar].y - P.TOPO) / (P.NIVEIS[r.nivel].vel * (1 + 0.05 * r.i)) - r.t; };

test('os dois jogadores recebem a mesma sequência de quedas', () => {
  const p = nova(2);
  assert.deepEqual(p.rodadas[0].quedas.map(q => q.cenario.id + q.item.id), p.rodadas[1].quedas.map(q => q.cenario.id + q.item.id));
});
test('a próxima queda só vem quando os dois pararam, 2 s depois', () => {
  const p = nova(2);
  p.avancar(ateAlvo(p.rodadas[0]));
  assert.equal(p.parar(0).categoria, 'PERFEITO');
  p.avancar(3);
  assert.equal(p.rodadas[0].i, 0, 'não pode seguir com o outro ainda caindo');
  assert.equal(p.parar(1).categoria === undefined, false);
  p.avancar(1.9); assert.equal(p.rodadas[0].i, 0);
  p.avancar(0.2); assert.equal(p.rodadas[0].i, 1); assert.equal(p.rodadas[1].i, 1);
  assert.equal(p.rodadas[0].fase, 'caindo');
});
test('item que passou sem toque conta como LONGE e libera a próxima', () => {
  const p = nova(2);
  p.avancar(ateAlvo(p.rodadas[0])); p.parar(0);
  p.avancar(30);   // o do jogador 2 passou
  const ev = p.eventos();
  assert.ok(ev.some(e => e.j === 1 && e.res.categoria === 'LONGE'));
  assert.ok(ev.some(e => e.j === 0 && e.res.categoria === 'PERFEITO'));
  p.avancar(2.1); assert.equal(p.rodadas[0].i, 1);
});
test('parar quem já parou não faz nada; atraso é repassado', () => {
  const p = nova(1);
  p.avancar(ateAlvo(p.rodadas[0]) + 0.2);
  assert.equal(p.parar(0, 0.2).categoria, 'PERFEITO');
  assert.equal(p.parar(0), null);
  assert.equal(p.parar(5), null);
});
test('10 quedas e fim com vencedor (ou empate)', () => {
  const p = nova(2);
  for (let k = 0; k < 10; k++) { p.avancar(ateAlvo(p.rodadas[0])); p.parar(0); p.avancar(0.5); p.parar(1); p.avancar(2.1); }
  assert.equal(p.fase, 'fim');
  assert.equal(p.vencedor(), 0);
  const e = nova(2); for (let k = 0; k < 10; k++) { e.avancar(30); e.avancar(2.1); }
  assert.equal(e.fase, 'fim'); assert.equal(e.vencedor(), -1);
});
test('pausada não anda', () => {
  const p = nova(1); p.pausar(true); p.avancar(30);
  assert.equal(p.rodadas[0].fase, 'caindo'); assert.equal(p.rodadas[0].t, 0);
});
