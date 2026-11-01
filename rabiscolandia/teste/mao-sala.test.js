// Regra da mão e validação da sala: node --test rabiscolandia/teste/mao-sala.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../mao.js');
const S = require('../sala.js');

// mão de mentira: pulso embaixo, dedos para cima; "dobrar" traz a ponta de volta para perto da palma
function mao(dobrados, dx = 0) {
  const p = [];
  for (let i = 0; i < 21; i++) p.push({ x: 0.5 + dx, y: 0.8 });
  p[0] = { x: 0.5 + dx, y: 0.8 };
  [1, 2, 3, 4].forEach((k, i) => { p[k] = { x: 0.42 + dx - i * 0.02, y: 0.72 - i * 0.03 }; });
  const xs = [0.44, 0.5, 0.56, 0.62];
  [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]].forEach((dedo, f) => {
    const x = xs[f] + dx;
    p[dedo[0]] = { x, y: 0.62 };
    p[dedo[1]] = { x, y: 0.54 };
    if (dobrados.includes(f)) { p[dedo[2]] = { x, y: 0.58 }; p[dedo[3]] = { x, y: 0.64 }; }
    else { p[dedo[2]] = { x, y: 0.49 }; p[dedo[3]] = { x, y: 0.44 }; }
  });
  return p;
}

test('mão aberta, fechada e no meio do caminho', () => {
  assert.equal(M.classificar(mao([])), 'aberta');
  assert.equal(M.classificar(mao([0, 1, 2, 3])), 'fechada');
  assert.equal(M.classificar(mao([1, 2, 3])), 'fechada');           // só o indicador: ainda conta como fechada
  assert.equal(M.classificar(mao([2, 3]), 'fechada'), 'fechada');   // 2 dedos: continua como estava
  assert.equal(M.classificar(mao([2, 3]), 'aberta'), 'aberta');
  assert.equal(M.classificar(null), 'nenhuma');
});

test('rastreador: espelha, troca de estado só depois de 2 quadros e some sem mão', () => {
  const r = M.Rastreador();
  let s = r.prox(mao([], -0.2));                // mão à esquerda da imagem = direita da tela (espelho)
  assert.equal(s.estado, 'aberta'); assert.ok(s.x > 0.5);
  s = r.prox(mao([0, 1, 2, 3], -0.2)); assert.equal(s.estado, 'aberta');
  s = r.prox(mao([0, 1, 2, 3], -0.2)); assert.equal(s.estado, 'fechada');
  for (let i = 0; i < 4; i++) s = r.prox(null);
  assert.equal(s.estado, 'nenhuma');
});

test('sala: só passa mensagem conhecida, com números entre 0 e 1', () => {
  assert.equal(S.validar({ t: 'hack' }), null);
  assert.equal(S.validar({ t: 'mira', id: 'a', x: 'x', y: 0 }), null);
  assert.deepEqual(S.validar({ t: 'mira', id: 'ab12', x: 3, y: -1, d: 1, m: 'giro' }), { t: 'mira', id: 'ab12', x: 1, y: 0, d: 1, m: 'giro' });
  assert.equal(S.validar({ t: 'cmd', id: 'a', acao: 'rm -rf' }), null);
  const c = S.validar({ t: 'cmd', id: 'a', acao: 'carimbo', v: '<img onerror=x>', tipo: 'vivo' });
  assert.ok(!/[<>]/.test(c.v));
  const f = S.validar({ t: 'ferramenta', id: 'a', cor: 'red;x', pincel: 'neon', tam: 9999 });
  assert.equal(f.cor, undefined); assert.equal(f.pincel, 'neon'); assert.equal(f.tam, 200);
  assert.equal(S.validar({ t: 'oi', id: 'a', nome: '<b>Ana</b>' }).nome, 'bAna/b');
  assert.match(S.codigoNovo(), /^[A-Z]{4}$/);
});
