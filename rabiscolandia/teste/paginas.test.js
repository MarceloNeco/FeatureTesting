// Testes dos desenhos de colorir: node --test rabiscolandia/teste/paginas.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../paginas.js');

const catIds = new Set(P.CATEGORIAS.map(c => c.id));

test('categorias: id, nome em PT e EN e ícone', () => {
  assert.ok(P.CATEGORIAS.length > 0);
  for (const c of P.CATEGORIAS) assert.ok(c.id && c.pt && c.en && c.ico, 'categoria incompleta ' + c.id);
});

test('lista: pelo menos 18 desenhos de pelo menos 4 categorias', () => {
  assert.ok(P.LISTA.length >= 18, 'só ' + P.LISTA.length + ' desenhos');
  assert.ok(new Set(P.LISTA.map(p => p.cat)).size >= 4, 'poucas categorias');
});

test('cada desenho: id, nomes, categoria e paleta', () => {
  const ids = new Set();
  for (const p of P.LISTA) {
    assert.match(p.id, /^[a-z0-9-]+$/, 'id fora do formato: ' + p.id);
    assert.ok(!ids.has(p.id), 'id repetido ' + p.id); ids.add(p.id);
    assert.ok(typeof p.pt === 'string' && p.pt.trim() && typeof p.en === 'string' && p.en.trim(), p.id + ' sem nome');
    assert.ok(catIds.has(p.cat), p.id + ': categoria desconhecida ' + p.cat);
    assert.ok(Array.isArray(p.cores) && p.cores.length >= 5 && p.cores.length <= 12, p.id + ': paleta com ' + (p.cores || []).length + ' cores');
    for (const c of p.cores) assert.match(c, /^#[0-9a-f]{6}$/i, p.id + ': cor ' + c);
  }
});

test('cada desenho: formas fechadas com número de cor válido, e toda cor usada', () => {
  for (const p of P.LISTA) {
    assert.ok(p.formas.length >= 12 && p.formas.length <= 60, p.id + ': ' + p.formas.length + ' formas');
    const usadas = new Set();
    p.formas.forEach((f, i) => {
      assert.equal(typeof f.d, 'string', p.id + ' forma ' + i);
      assert.match(f.d.trim(), /^M/, p.id + ' forma ' + i + ' não começa com M');
      assert.match(f.d.trim(), /[Zz]$/, p.id + ' forma ' + i + ' não fecha com Z');
      assert.ok(Number.isInteger(f.n) && f.n >= 1 && f.n <= p.cores.length, p.id + ' forma ' + i + ': n = ' + f.n);
      usadas.add(f.n);
    });
    for (let n = 1; n <= p.cores.length; n++) assert.ok(usadas.has(n), p.id + ': cor nº ' + n + ' não pinta nada');
  }
});

test('cada desenho: linhas de detalhe', () => {
  for (const p of P.LISTA) {
    assert.ok(Array.isArray(p.linhas), p.id + ' sem linhas');
    p.linhas.forEach((l, i) => { assert.equal(typeof l, 'string'); assert.match(l.trim(), /^M/, p.id + ' linha ' + i); });
  }
});

test('cada desenho: 2 ou 3 variações do mesmo tamanho da paleta', () => {
  for (const p of P.LISTA) {
    assert.ok(Array.isArray(p.variacoes) && p.variacoes.length >= 2 && p.variacoes.length <= 3, p.id + ': variações');
    for (const v of p.variacoes) {
      assert.ok(v.pt && v.en, p.id + ': variação sem nome');
      assert.equal(v.cores.length, p.cores.length, p.id + '/' + v.pt + ': tamanho da paleta');
      for (const c of v.cores) assert.match(c, /^#[0-9a-f]{6}$/i, p.id + '/' + v.pt + ': cor ' + c);
    }
  }
});

test('coordenadas dentro da caixa (−5 a 1005) e só comandos M L C Q A Z', () => {
  for (const p of P.LISTA) {
    const caminhos = p.formas.map(f => f.d).concat(p.linhas);
    caminhos.forEach((d, i) => {
      assert.match(d, /^[MLCQAZ0-9.\s-]+$/, p.id + ' caminho ' + i + ' com comando estranho');
      const nums = d.match(/-?\d+(\.\d+)?/g) || [];
      for (const s of nums) {
        const v = Number(s);
        assert.ok(Number.isFinite(v) && v >= -5 && v <= 1005, p.id + ' caminho ' + i + ': número ' + s);
      }
    });
  }
});
