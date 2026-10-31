const test = require('node:test');
const assert = require('node:assert/strict');
const Fig = require('../figuras.js');

test('catálogo tem todos os papéis, ids únicos e SVG fechado', () => {
  const todas = Fig.lista();
  const papeis = new Set(todas.map(f => f.papel));
  ['fruta', 'doce', 'bola', 'heroi', 'vilao', 'poder'].forEach(p => assert.ok(papeis.has(p), p));
  const ids = todas.map(f => f.id);
  assert.equal(new Set(ids).size, ids.length);
  todas.forEach(f => {
    assert.ok(f.svg.startsWith('<svg') && f.svg.endsWith('</svg>'), f.id);
    assert.ok(f.nome.pt && f.nome.en, f.id);
    assert.ok(f.raio >= 30 && f.raio <= 70, f.id);
    assert.ok(!/<script/i.test(f.svg), f.id);
  });
  assert.ok(todas.some(f => f.mascote), 'tem mascote');
  assert.equal(Fig.lista({ publica: false }).filter(f => f.turma === 'publica').length, 0);
  assert.ok(Fig.lista({ propria: true, publica: true }).some(f => f.turma === 'publica'));
});
