// Partitura das 10 músicas da Peluqueria (pura, sem áudio): node --test peluqueria/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../trilhas.js');

test('10 músicas com nome PT/EN, andamento de pop dançante e tons diferentes', () => {
  assert.equal(M.FAIXAS.length, 10);
  const nomes = new Set(M.FAIXAS.map(f => f.nome.pt));
  assert.equal(nomes.size, 10);
  for (const f of M.FAIXAS) {
    assert.ok(f.nome.pt && f.nome.en, f.id);
    assert.ok(f.bpm >= 118 && f.bpm <= 132, f.id + ' bpm ' + f.bpm);
    assert.ok(['maior', 'menor'].includes(f.modo));
    assert.equal(f.acordes.length, 4);
  }
  assert.ok(new Set(M.FAIXAS.map(f => f.tom + f.modo)).size >= 8, 'tons parecidos demais');
});

test('cada música tem intro, verso, subida, refrão, pausa e refrão final', () => {
  const secoes = M.ESTRUTURA.map(s => s[0]);
  assert.deepEqual(secoes, ['intro', 'verso', 'subida', 'refrao', 'pausa', 'refrao2']);
  assert.equal(M.compassos(), M.ESTRUTURA.reduce((a, s) => a + s[1], 0));
});

const tipos = (f, c) => new Set(M.partitura(f, c).eventos.map(e => e.tipo));
function compassoDa(secao) { let n = 0; for (const [s, q] of M.ESTRUTURA) { if (s === secao) return n; n += q; } }

test('refrão é cheio: bumbo, palma, chimbal aberto, baixo, acordes e melodia', () => {
  for (const f of M.FAIXAS) {
    const t = tipos(f, compassoDa('refrao'));
    for (const k of ['bumbo', 'palma', 'aberto', 'baixo', 'acorde', 'lead']) assert.ok(t.has(k), f.id + ' refrão sem ' + k);
    assert.equal(M.partitura(f, compassoDa('refrao')).secao, 'refrao');
  }
});

test('pausa respira sem bumbo; subida tem o chiado subindo e virada de caixa', () => {
  for (const f of M.FAIXAS) {
    assert.ok(!tipos(f, compassoDa('pausa')).has('bumbo'), f.id);
    const s0 = compassoDa('subida');
    assert.ok(tipos(f, s0).has('riser'), f.id + ' sem riser');
    assert.ok(tipos(f, s0 + 3).has('caixa'), f.id + ' sem virada');
    assert.ok(!tipos(f, compassoDa('intro')).has('lead'), f.id + ' intro com melodia');
  }
});

test('notas da melodia e do baixo ficam na escala da música', () => {
  for (const f of M.FAIXAS) {
    const esc = M.escala(f);
    for (let c = 0; c < M.compassos(); c++) for (const e of M.partitura(f, c).eventos) {
      if (e.tipo === 'lead' || e.tipo === 'baixo') {
        assert.ok(esc.includes(((e.nota - f.tom) % 12 + 12) % 12), f.id + ' c' + c + ' ' + e.tipo + ' fora da escala: ' + e.nota);
        assert.ok(e.t >= 0 && e.t < 16 && e.dur > 0);
      }
    }
  }
});

test('as 10 melodias são diferentes entre si e repetíveis', () => {
  const assinatura = f => M.partitura(f, compassoDa('refrao')).eventos.concat(M.partitura(f, compassoDa('refrao') + 1).eventos)
    .filter(e => e.tipo === 'lead').map(e => e.t + ':' + (e.nota - f.tom)).join(',');
  const a = M.FAIXAS.map(assinatura);
  assert.equal(new Set(a).size, 10);
  assert.deepEqual(M.FAIXAS.map(assinatura), a);
  for (const s of a) assert.ok(s.split(',').length >= 6, 'melodia curta demais');
});

test('passado o último compasso, a lista segue para a próxima música', () => {
  assert.deepEqual(M.proxima(0, M.compassos() - 1), { faixa: 0, compasso: M.compassos() - 1 });
  assert.deepEqual(M.proxima(0, M.compassos()), { faixa: 1, compasso: 0 });
  assert.deepEqual(M.proxima(9, M.compassos()), { faixa: 0, compasso: 0 });
});

test('andamento: nível e quedas mudam o BPM', () => {
  const f = M.FAIXAS[0];
  assert.equal(M.andamento(f, 'inicio', 0), f.bpm);
  assert.ok(M.andamento(f, 'crianca', 0) < f.bpm);
  assert.ok(M.andamento(f, 'maluco', 0) > f.bpm);
  assert.equal(M.andamento(f, 'normal', 5), f.bpm + 5);
});
