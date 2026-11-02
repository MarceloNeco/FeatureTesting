// Modo 🧸 Bagunça (casa.js) no Node: node --test baguncolandia/teste/casa.test.js
const test = require('node:test');
const assert = require('node:assert');
const Casa = require('../casa.js');
const Bagunca = require('../jogo.js');

function partida(cena) { const p = Casa.criar({ cenaCasa: cena, jogadores: 1, duracao: 60, aleatorio: (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })() }); p.comecar(); return p; }
function correr(p, ms) { for (let t = 0; t < ms; t += 16) p.avancar(16); }
function passar(p, de, ate, t0) { let t = t0; for (let k = 0; k <= 10; k++) { const x = de[0] + (ate[0] - de[0]) * k / 10, y = de[1] + (ate[1] - de[1]) * k / 10; p.movimento(0, [[x / 1280, y / 720, 100]], t); p.avancar(20); t += 20; } return t; }

test('os três lugares começam arrumados, cheios de coisas, e nada mexe sozinho', () => {
  for (const cena of Casa.CENAS) {
    const p = partida(cena); correr(p, 5000);
    const e = p.estado();
    assert.ok(e.casa.obs.length >= 20, cena + ': poucas coisas (' + e.casa.obs.length + ')');
    assert.strictEqual(e.casa.obs.filter((o) => !o.dorme).length, 0, cena + ': algo se mexeu sozinho');
    assert.strictEqual(e.bagunca, 0, cena + ': começou bagunçado');
    assert.strictEqual(e.modo, 'bagunca');
  }
});

test('passar o dedo na estante derruba livros, que abrem no chão, e o Bagunçômetro sobe', () => {
  const p = partida('sala');
  let t = passar(p, [880, 180], [1200, 200], 1000);
  t = passar(p, [880, 310], [1200, 330], t + 500);
  correr(p, 3000);
  const e = p.estado();
  assert.ok(e.casa.obs.some((o) => o.tipo === 'livro' && o.aberto), 'nenhum livro abriu');
  assert.ok(e.bagunca > 0.15, 'bagunçou pouco: ' + e.bagunca);
  assert.ok(e.jogadores[0].pontos > 0);
});

test('a torre de blocos desaba inteira quando o bloco de baixo leva um tapa', () => {
  const p = partida('sala');
  passar(p, [340, 630], [460, 630], 1000);
  correr(p, 3000);
  const blocos = p.estado().casa.obs.filter((o) => o.tipo === 'bloco');
  assert.ok(blocos.filter((b) => Math.hypot(b.x - b.x0, b.y - b.y0) > 30).length >= 4, 'a torre não caiu');
});

test('interruptor apaga e acende, janela abre devagar e fecha, cachorro late, lustre muda a cor', () => {
  const p = partida('sala'), M = p.estado().casa;
  p.movimento(0, [[336 / 1280, 345 / 720, 100]], 1000); correr(p, 100);
  assert.strictEqual(M.luz, false, 'não apagou');
  correr(p, 700); p.movimento(0, [[336 / 1280, 345 / 720, 100]], 5000); correr(p, 100);
  assert.strictEqual(M.luz, true, 'não acendeu');
  p.movimento(0, [[185 / 1280, 235 / 720, 100]], 9000); correr(p, 200);
  assert.ok(M.janela.abre > 0.05 && M.janela.abre < 0.9, 'a janela não abriu devagar: ' + M.janela.abre);
  correr(p, 2000); assert.ok(M.janela.abre > 0.9, 'a janela não terminou de abrir');
  p.movimento(0, [[M.cachorro.x / 1280, (M.chao - 50) / 720, 100]], 15000); correr(p, 50);
  assert.ok(M.cachorro.late > 0, 'o cachorro não latiu');
  const cor = M.corLuz, lx = M.lustre.x;
  p.movimento(0, [[lx / 1280, 180 / 720, 100]], 20000); correr(p, 50);
  assert.notStrictEqual(M.corLuz, cor, 'o lustre não mudou a cor da luz');
  assert.ok(Math.abs(M.lustre.va) > 0, 'o lustre não balançou');
  const sons = p.eventos().map((e) => e.som);
  ['interruptor', 'janela', 'latido', 'lustre'].forEach((s) => assert.ok(sons.includes(s), 'faltou o som ' + s));
});

test('jardim: a árvore solta folhas e os passarinhos voam', () => {
  const p = partida('jardim');
  passar(p, [950, 200], [1150, 280], 1000); correr(p, 4000);
  const M = p.estado().casa;
  assert.ok(M.folhasChao.length + M.folhas.length >= 10, 'poucas folhas');
  assert.ok(M.passaros.some((b) => b.voando > 0 || b.volta > 0 || b.x !== b.x0), 'os passarinhos não voaram');
});

test('o jogo aceita o modo bagunca pela mensagem do celular', () => {
  const v = Bagunca.validar({ t: 'cmd', id: 'abc12345', acao: 'config', modo: 'bagunca' });
  assert.ok(v && v.modo === 'bagunca');
});
