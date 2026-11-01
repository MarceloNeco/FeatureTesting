// Testes do desenho: o SVG sai bem formado, com ids únicos por prefixo, para qualquer visual.
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pecas.js');
const V = require('../visual.js');
const B = require('../boneca.js');

// confere que as tags abrem e fecham direito (sem precisar de navegador)
function bemFormado(s) {
  const pilha = [], re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g; let m;
  while ((m = re.exec(s))) {
    if (m[1]) { const t = pilha.pop(); if (t !== m[2]) return 'fechou ' + m[2] + ' esperando ' + t; }
    else if (!m[4]) pilha.push(m[2]);
  }
  return pilha.length ? 'ficou aberto: ' + pilha.join(',') : '';
}

test('todas as opções de todas as categorias desenham', () => {
  for (const c of P.CATEGORIAS) for (const o of (c.opcoes || [{ id: null }])) {
    const e = o.id ? V.aplicar(V.novo(), c.id, o.id) : V.novo();
    const s = B.svg(e, { id: 't' });
    assert.equal(bemFormado(s), '', c.id + '/' + o.id);
    assert.ok(!/NaN|undefined/.test(s), c.id + '/' + o.id + ' com NaN ou undefined');
  }
});

test('surpresas desenham sem erro, com e sem animação', () => {
  for (let i = 1; i <= 120; i++) {
    const s = B.svg(V.surpresa(V.novo(), V.semente(i)), { id: 's' + i, anim: i % 2 === 0 });
    assert.equal(bemFormado(s), '', 'sorteio ' + i); assert.ok(!/NaN|undefined/.test(s), 'sorteio ' + i);
  }
});

test('ids com prefixo: dois desenhos na mesma página não se misturam', () => {
  const a = B.svg(V.novo(), { id: 'aa' }), b = B.svg(V.novo(), { id: 'bb' });
  const ids = s => [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids(a).every(i => i.startsWith('aa-')));
  assert.ok(ids(a).every(i => !ids(b).includes(i)));
});

test('miniatura (área), só cenário e foto (tamanho)', () => {
  assert.match(B.svg(V.novo(), { id: 'm', area: [96, 100, 208, 208] }), /viewBox="96 100 208 208"/);
  assert.match(B.svg(V.novo(), { id: 'f', largura: 800, altura: 1440 }), /width="800" height="1440"/);
  for (const o of P.categoria('cenario').opcoes) assert.equal(bemFormado(B.svg(V.aplicar(V.novo(), 'cenario', o.id), { id: 'c', soFundo: true })), '');
});

test('espelhar troca só o x', () => {
  assert.equal(B.espelhar('M100,50 L150,60 Q120,70 130,80Z'), 'M300,50 L250,60 Q280,70 270,80Z');
});
