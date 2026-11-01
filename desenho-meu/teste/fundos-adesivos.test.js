// Fundos e adesivos do Desenho Meu: node --test desenho-meu/teste/fundos-adesivos.test.js (da raiz do repositório)
// Confere o catálogo e que todo desenho roda num "contexto de mentira" sem erro, sem NaN e com save/restore em par.
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../fundos.js');
const A = require('../adesivos.js');

const METODOS = ['save', 'restore', 'scale', 'rotate', 'translate', 'transform', 'setTransform', 'resetTransform', 'getTransform',
  'createLinearGradient', 'createRadialGradient', 'createConicGradient', 'createPattern', 'clearRect', 'fillRect', 'strokeRect',
  'beginPath', 'closePath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'arcTo', 'rect', 'roundRect', 'arc', 'ellipse',
  'fill', 'stroke', 'clip', 'isPointInPath', 'isPointInStroke', 'fillText', 'strokeText', 'measureText', 'drawImage',
  'createImageData', 'getImageData', 'putImageData', 'setLineDash', 'getLineDash', 'drawFocusIfNeeded', 'reset', 'isContextLost'];
// métodos de caminho/forma: todo número que recebem tem de ser finito
const NUMERICOS = new Set(['scale', 'rotate', 'translate', 'moveTo', 'lineTo', 'quadraticCurveTo', 'bezierCurveTo', 'arcTo', 'rect', 'arc',
  'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'createLinearGradient', 'createRadialGradient']);

function ctxFalso() {
  const c = { nivel: 0, erros: [], chamadas: 0 };
  for (const m of METODOS) c[m] = function () {};
  c.createLinearGradient = c.createRadialGradient = c.createConicGradient = function () { conferir(arguments, 'gradiente'); return { addColorStop() {} }; };
  c.measureText = () => ({ width: 10 });
  c.save = () => { c.nivel++; };
  c.restore = () => { c.nivel--; if (c.nivel < 0) c.erros.push('restore sem save'); };
  function conferir(args, nome) {
    for (const a of args) if (typeof a === 'number' && !Number.isFinite(a)) c.erros.push(nome + ' recebeu ' + a);
  }
  for (const m of NUMERICOS) if (m !== 'createLinearGradient' && m !== 'createRadialGradient') c[m] = function () { c.chamadas++; conferir(arguments, m); };
  return c;
}
const ID = /^[a-z0-9-]+$/;
const TEMPOS = [0, 0.016, 0.5, 1.5, 3.2, 7.1, 9.6, 61.3, 1000.25];

function textos(item) {
  for (const k of ['pt', 'en', 'ico']) assert.ok(typeof item[k] === 'string' && item[k].trim(), item.id + ' sem ' + k);
}
function unicos(lista, nome) {
  const ids = lista.map(i => i.id);
  assert.equal(new Set(ids).size, ids.length, nome + ': id repetido');
  for (const id of ids) assert.match(id, ID, nome + ': id fora do formato ' + id);
}

test('fundos: pelo menos 12, ids únicos a-z0-9-, textos PT/EN e ícone', () => {
  assert.ok(F.LISTA.length >= 12, 'só ' + F.LISTA.length + ' fundos');
  unicos(F.LISTA, 'fundos');
  for (const f of F.LISTA) { textos(f); assert.equal(typeof f.vivo, 'boolean', f.id + ': vivo tem de ser true/false'); }
  for (const id of ['praia', 'campo', 'fundo-do-mar', 'espaco', 'cidade-noite', 'floresta', 'neve', 'castelo', 'ceu-arco-iris', 'fazenda', 'doces', 'dinossauros'])
    assert.ok(F.LISTA.some(f => f.id === id), 'falta o fundo ' + id);
});

test('fundos: parado e vivo desenham sem erro, sem NaN, com save/restore em par (vários tamanhos e instantes)', () => {
  for (const f of F.LISTA) {
    for (const [W, H] of [[2048, 2048], [1024, 1024], [900, 1950]]) {
      const c = ctxFalso();
      F.parado(c, f.id, W, H);
      assert.equal(c.nivel, 0, f.id + ': save/restore desequilibrado no parado'); assert.deepEqual(c.erros, [], f.id);
      assert.ok(c.chamadas > 50, f.id + ': parado quase não desenhou');
      for (const t of TEMPOS) { F.vivo(c, f.id, W, H, t); assert.equal(c.nivel, 0, f.id + ' vivo t=' + t); }
      assert.deepEqual(c.erros, [], f.id + ' (vivo)');
    }
  }
});

test('fundos: id que não existe não quebra', () => {
  const c = ctxFalso();
  F.parado(c, 'nao-existe', 2048, 2048); F.vivo(c, 'nao-existe', 2048, 2048, 1);
  assert.equal(c.nivel, 0);
});

test('adesivos: grupos de emoji, vivos e movimentos', () => {
  assert.ok(A.GRUPOS.length >= 6, 'só ' + A.GRUPOS.length + ' grupos');
  unicos(A.GRUPOS, 'grupos');
  for (const g of A.GRUPOS) {
    textos(g);
    assert.ok(g.itens.length >= 12, g.id + ' com só ' + g.itens.length + ' emojis');
    assert.equal(new Set(g.itens).size, g.itens.length, g.id + ': emoji repetido');
    for (const e of g.itens) assert.ok(typeof e === 'string' && e.length > 0);
  }
  assert.ok(A.VIVOS.length >= 14, 'só ' + A.VIVOS.length + ' adesivos vivos');
  unicos(A.VIVOS, 'vivos');
  for (const v of A.VIVOS) textos(v);
  assert.deepEqual(A.MOVIMENTOS.map(m => m.id), ['parado', 'pula', 'balanca', 'gira', 'pulsa', 'flutua']);
  for (const m of A.MOVIMENTOS) textos(m);
});

test('adesivos: todo vivo e emoji desenha com todo movimento, sem erro e sem NaN', () => {
  const emojis = A.GRUPOS.flatMap(g => g.itens);
  for (const m of A.MOVIMENTOS) {
    for (const v of A.VIVOS) for (const t of TEMPOS) {
      const c = ctxFalso();
      A.desenhar(c, { tipo: 'vivo', v: v.id, x: 300, y: 400, s: 120, mov: m.id, fase: 0.37 }, t);
      assert.equal(c.nivel, 0, v.id + '/' + m.id + ' t=' + t); assert.deepEqual(c.erros, [], v.id + '/' + m.id + ' t=' + t);
      assert.ok(c.chamadas > 5, v.id + ' quase não desenhou');
    }
    for (const e of emojis) {
      const c = ctxFalso();
      A.desenhar(c, { tipo: 'emoji', v: e, x: 10, y: 20, s: 64, mov: m.id, fase: 0.9 }, 2.5);
      assert.equal(c.nivel, 0, e); assert.deepEqual(c.erros, [], e);
    }
  }
});

test('adesivos: sem document (Node) o emoji sai com fillText; dados estranhos não quebram', () => {
  const c = ctxFalso(); let texto = null;
  c.fillText = (s) => { texto = s; };
  A.desenhar(c, { tipo: 'emoji', v: '🐶', x: 0, y: 0, s: 50, mov: 'parado' }, 0);
  assert.equal(texto, '🐶');
  for (const a of [null, undefined, {}, { tipo: 'vivo', v: 'nao-existe' }, { tipo: 'emoji' }, { tipo: 'vivo', v: 'sol', s: 0, mov: 'dança' }]) {
    const d = ctxFalso(); A.desenhar(d, a, 1); assert.equal(d.nivel, 0); assert.deepEqual(d.erros, []);
  }
});

test('sintaxe antiga: sem let/const, arrow function, template string nem class nos arquivos do navegador', () => {
  const fs = require('fs'), path = require('path');
  for (const f of ['fundos.js', 'adesivos.js']) {
    const s = fs.readFileSync(path.join(__dirname, '..', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'(?:\\.|[^'\\])*'/g, "''");
    assert.ok(!/\b(let|const|class)\s/.test(s), f + ': let/const/class');
    assert.ok(!/=>/.test(s), f + ': arrow function');
    assert.ok(!/`/.test(s), f + ': template string');
  }
});
