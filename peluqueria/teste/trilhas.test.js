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

test('notas da melodia, do arpejo e do baixo ficam na escala (do tom do trecho)', () => {
  for (const f of M.FAIXAS) {
    const esc = M.escala(f);
    for (let c = 0; c < M.compassos(); c++) { const p = M.partitura(f, c); for (const e of p.eventos) {
      if (e.tipo === 'lead' || e.tipo === 'baixo' || e.tipo === 'arpejo') {
        assert.ok(esc.includes(((e.nota - p.tom) % 12 + 12) % 12), f.id + ' c' + c + ' ' + e.tipo + ' fora da escala: ' + e.nota);
        assert.ok(e.t >= 0 && e.t < 16 && e.dur > 0);
      }
    } }
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

/* pedido do dono (0.2.0, nota 4): "parece uma repetição sem fim de 4 notas" */
const leadDe = (f, c) => M.partitura(f, c).eventos.filter(e => e.tipo === 'lead').map(e => e.t + ':' + e.nota).join(',');
test('refrão de 8 compassos não é um laço de 4: a segunda metade é diferente da primeira', () => {
  for (const f of M.FAIXAS) {
    const r = compassoDa('refrao');
    const a = [0, 1, 2, 3].map(k => leadDe(f, r + k)).join('|'), b = [4, 5, 6, 7].map(k => leadDe(f, r + k)).join('|');
    assert.notEqual(a, b, f.id);
  }
});
test('melodia do refrão usa pelo menos 6 notas diferentes', () => {
  for (const f of M.FAIXAS) {
    const r = compassoDa('refrao'), notas = new Set();
    for (let k = 0; k < 8; k++) M.partitura(f, r + k).eventos.filter(e => e.tipo === 'lead').forEach(e => notas.add(e.nota));
    assert.ok(notas.size >= 6, f.id + ': ' + notas.size);
  }
});
test('verso e refrão têm acordes diferentes', () => {
  const raizes = (f, c0) => [0, 1, 2, 3].map(k => M.partitura(f, c0 + k).eventos.find(e => e.tipo === 'acorde' && e.estilo === 'tapete').notas[0]).join(',');
  for (const f of M.FAIXAS) assert.notEqual(raizes(f, compassoDa('verso')), raizes(f, compassoDa('refrao')), f.id);
});
test('verso tem melodia própria (não só duas notas por compasso)', () => {
  for (const f of M.FAIXAS) {
    const v = compassoDa('verso'); let n = 0;
    for (let k = 0; k < 4; k++) n += M.partitura(f, v + k).eventos.filter(e => e.tipo === 'lead').length;
    assert.ok(n >= 12, f.id + ': ' + n + ' notas em 4 compassos');
  }
});
test('arpejo dá movimento no verso e no refrão; acordes têm 4 notas', () => {
  for (const f of M.FAIXAS) for (const sec of ['verso', 'refrao']) {
    const ev = M.partitura(f, compassoDa(sec)).eventos;
    assert.ok(ev.filter(e => e.tipo === 'arpejo').length >= 8, f.id + ' ' + sec);
    assert.equal(ev.find(e => e.tipo === 'acorde' && e.estilo === 'tapete').notas.length, 4);
  }
});
test('virada a cada 4 compassos e subida de tom no último refrão', () => {
  for (const f of M.FAIXAS) {
    const r = compassoDa('refrao');
    assert.ok(M.partitura(f, r + 3).eventos.some(e => e.tipo === 'caixa'), f.id + ' sem virada');
    const r2 = compassoDa('refrao2');
    assert.equal(M.partitura(f, r2).tom, f.tom + 2, f.id + ' sem subida de tom');
    assert.equal(M.partitura(f, r).tom, f.tom);
  }
});

/* abertura especial (pedido do dono, 0.2.1): rock elétrico rápido, guitarra de semicolcheias com nota pedal */
const A = M.ABERTURA;
const abSecao = nome => { let n = 0; for (const [s, q] of M.ESTRUTURA_ABERTURA) { if (s === nome) return n; n += q; } };
test('abertura: rápida, com riff de guitarra em todas as semicolcheias', () => {
  assert.ok(A && A.bpm >= 132, 'bpm');
  const g = M.abertura(abSecao('riff')).eventos.filter(e => e.tipo === 'guitarra');
  assert.equal(new Set(g.map(e => e.t)).size, 16);
});
test('abertura: riff com várias notas diferentes e na escala', () => {
  const notas = new Set(), esc = M.escala(A);
  for (let c = 0; c < M.compassosAbertura(); c++) { const p = M.abertura(c); for (const e of p.eventos) if (e.tipo === 'guitarra' || e.tipo === 'lead') { assert.ok(esc.includes(((e.nota - p.tom) % 12 + 12) % 12), 'fora da escala ' + e.nota); notas.add(e.nota); } }
  assert.ok(notas.size >= 10, 'só ' + notas.size + ' notas');
  const r = abSecao('riff'), barras = [0, 1, 2, 3].map(k => M.abertura(r + k).eventos.filter(e => e.tipo === 'guitarra').map(e => e.nota).join(','));
  assert.equal(new Set(barras).size, 4, 'os 4 compassos do riff são iguais');
});
test('abertura: começa só com a guitarra e explode com bateria de rock, acordes e melodia', () => {
  const t0 = new Set(M.abertura(abSecao('riff')).eventos.map(e => e.tipo));
  assert.ok(!t0.has('bumbo') && t0.has('riser'));
  const tudo = new Set(M.abertura(abSecao('tudo')).eventos.map(e => e.tipo));
  for (const k of ['bumbo', 'caixa', 'crash', 'guitarra', 'power', 'lead', 'baixo']) assert.ok(tudo.has(k), 'tudo sem ' + k);
  assert.ok(M.abertura(abSecao('entrada') + 3).eventos.some(e => e.tipo === 'tom'), 'sem virada de tons');
});
test('abertura toca em laço', () => {
  assert.equal(M.proximaAbertura(M.compassosAbertura() - 1), 0);
  assert.equal(M.proximaAbertura(0), 1);
});
