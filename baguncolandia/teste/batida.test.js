const test = require('node:test');
const assert = require('node:assert/strict');
const Batida = require('../batida.js');

test('estimarBpm: ataques a cada 500 ms = 120 bpm', () => {
  const a = []; for (let i = 0; i < 12; i++) a.push(1000 + i * 500);
  assert.equal(Batida.estimarBpm(a), 120);
});
test('estimarBpm: ataques só a cada 2 batidas (1 s) também dão 120 (dobra para a faixa 80..180)', () => {
  const a = []; for (let i = 0; i < 10; i++) a.push(i * 1000);
  assert.equal(Batida.estimarBpm(a), 120);
});
test('estimarBpm: poucos ataques ou intervalos bagunçados = 0', () => {
  assert.equal(Batida.estimarBpm([0, 500, 1000]), 0);
  assert.equal(Batida.estimarBpm([0, 310, 900, 1150, 1900, 2050, 2900, 3400, 3450]), 0);
});
