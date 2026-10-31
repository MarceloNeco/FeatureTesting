// Validação das mensagens TV ↔ celular (segurança: nada de fora entra sem passar aqui)
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../jogo.js');
const V = P.validarMensagem;

test('aceita as mensagens do jogo, limpas', () => {
  assert.deepEqual(V({ t: 'join', id: 'abc12345', k: 'segredo123456', nome: '  Ana   Lu ' }), { t: 'join', id: 'abc12345', k: 'segredo123456', nome: 'Ana Lu' });
  assert.deepEqual(V({ t: 'cmd', id: 'abc12345', k: 'segredo123456', acao: 'parar', q: 1234.5, j: 1, lixo: 'x' }), { t: 'cmd', id: 'abc12345', k: 'segredo123456', acao: 'parar', q: 1234.5, j: 1 });
  assert.deepEqual(V({ t: 'cmd', id: 'abc12345', k: 'segredo123456', acao: 'nivel', nivel: 'maluco' }), { t: 'cmd', id: 'abc12345', k: 'segredo123456', acao: 'nivel', nivel: 'maluco' });
  assert.deepEqual(V({ t: 'ping', id: 'abc12345', k: 'segredo123456', a: 99 }), { t: 'ping', id: 'abc12345', k: 'segredo123456', a: 99 });
  assert.deepEqual(V({ t: 'pong', to: 'abc12345', a: 99, b: 120 }), { t: 'pong', to: 'abc12345', a: 99, b: 120 });
  assert.deepEqual(V({ t: 'tv' }), { t: 'tv' });
  const e = V({ t: 'estado', fase: 'jogo', nivel: 'normal', jogadores: [{ id: 'abc12345', nome: 'Ana', pontos: 300, j: 0 }], vencedor: 0 });
  assert.equal(e.jogadores[0].nome, 'Ana'); assert.equal(e.fase, 'jogo'); assert.equal(e.vencedor, 0);
});
test('recusa o que não é do jogo', () => {
  const ruins = [null, 'x', [], { t: 'xss' }, { t: 'join', id: 'A B', nome: 'Ana' }, { t: 'join', id: 'abc12345', nome: 'x'.repeat(15) }, { t: 'join', id: 'abc12345', nome: '   ' },
    { t: 'cmd', id: 'abc12345', acao: 'apagar' }, { t: 'cmd', id: 'abc12345', acao: 'nivel', nivel: 'impossivel' }, { t: 'cmd', acao: 'parar' },
    { t: 'ping', id: 'abc12345', a: 'x' }, { t: 'estado', fase: 'hackeado' }, { t: 'pong', to: 'abc12345', a: 1, b: Infinity }];
  for (const r of ruins) assert.equal(V(r), null, JSON.stringify(r));
});
test('estado: no máximo 2 jogadores, nomes curtos, pontos limitados', () => {
  const e = V({ t: 'estado', fase: 'fim', nivel: 'normal', jogadores: [1, 2, 3].map(k => ({ id: 'abc1234' + k, nome: 'N' + k, pontos: 1e12, j: k })) });
  assert.equal(e.jogadores.length, 2);
  assert.ok(e.jogadores.every(j => j.pontos <= 999999 && (j.j === 0 || j.j === 1)));
});
test('join pode pedir 2 pessoas no mesmo celular', () => {
  assert.deepEqual(V({ t: 'join', id: 'abc12345', k: 'segredo123456', nome: 'Ana', dois: true }), { t: 'join', id: 'abc12345', k: 'segredo123456', nome: 'Ana', dois: true });
  assert.deepEqual(V({ t: 'join', id: 'abc12345', k: 'segredo123456', nome: 'Ana', dois: 'sim' }), { t: 'join', id: 'abc12345', k: 'segredo123456', nome: 'Ana' });
});

/* revisão 0.4.0 */
test('nível só da lista (nada de chaves do protótipo)', () => {
  for (const n of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
    assert.equal(V({ t: 'cmd', id: 'abc12345', k: 'segredo123456', acao: 'nivel', nivel: n }), null, n);
    assert.equal(V({ t: 'estado', fase: 'lobby', nivel: n, jogadores: [] }).nivel, 'normal', n);
  }
});
test('join, cmd, sair e ping levam a senha do celular (k); estado nunca leva', () => {
  assert.equal(V({ t: 'join', id: 'abc12345', nome: 'Ana' }), null, 'join sem senha');
  assert.equal(V({ t: 'cmd', id: 'abc12345', acao: 'parar' }), null, 'cmd sem senha');
  assert.equal(V({ t: 'join', id: 'abc12345', nome: 'Ana', k: 'curta' }), null, 'senha curta');
  assert.equal(V({ t: 'join', id: 'abc12345', nome: 'Ana', k: 'segredo123456' }).k, 'segredo123456');
  assert.equal(V({ t: 'sair', id: 'abc12345', k: 'segredo123456' }).k, 'segredo123456');
  assert.equal(V({ t: 'ping', id: 'abc12345', k: 'segredo123456', a: 1 }).k, 'segredo123456');
  const e = V({ t: 'estado', fase: 'lobby', nivel: 'normal', jogadores: [{ id: 'abc12345', k: 'segredo123456', nome: 'Ana', pontos: 0, j: 0 }] });
  assert.equal(e.jogadores[0].k, undefined);
});
