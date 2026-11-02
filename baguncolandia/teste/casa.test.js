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

test('seis lugares, cada um com os seus bichos', () => {
  assert.deepStrictEqual(Casa.CENAS, ['sala', 'quarto', 'jardim', 'cozinha', 'banheiro', 'parquinho']);
  const bichos = (c) => { const M = partida(c).estado().casa; return ['cachorro', 'gato', 'papagaio', 'tartaruga', 'passaros'].filter((k) => M[k]); };
  assert.deepStrictEqual(bichos('sala'), ['cachorro', 'gato', 'papagaio', 'tartaruga']);
  assert.deepStrictEqual(bichos('cozinha'), ['cachorro', 'gato', 'papagaio']);
  assert.ok(bichos('parquinho').includes('tartaruga') && bichos('parquinho').includes('passaros'));
  for (const c of Casa.CENAS) assert.ok(partida(c).estado().casa.obs.length >= 20, c + ' com poucas coisas');
});

test('cozinha: geladeira abre, torneira liga; banheiro: bolhas e papel desenrolando; parquinho: castelo desmorona', () => {
  let p = partida('cozinha'), M = p.estado().casa;
  p.movimento(0, [[(M.geladeira.x + 90) / 1280, (M.geladeira.y + 300) / 720, 100]], 1000); correr(p, 1500);
  assert.ok(M.geladeira.abre > 0.9, 'a geladeira não abriu');
  p.movimento(0, [[M.torneira.x / 1280, M.torneira.y / 720, 100]], 5000); correr(p, 50);
  assert.strictEqual(M.torneira.ligada, true, 'a torneira não ligou');
  p = partida('banheiro'); M = p.estado().casa;
  p.movimento(0, [[300 / 1280, 480 / 720, 100]], 1000); correr(p, 300);
  assert.ok(M.banheira.bolhas.length >= 5, 'sem bolhas');
  passar(p, [1120, 400], [1240, 380], 3000); correr(p, 3000);
  assert.ok(M.papel.pts.length >= 5, 'o papel não desenrolou');
  p = partida('parquinho'); M = p.estado().casa;
  p.movimento(0, [[M.castelo.x / 1280, (M.castelo.y - 50) / 720, 100]], 1000); correr(p, 50);
  assert.strictEqual(M.castelo.inteiro, false, 'o castelo não desmoronou');
});

test('gato mia e pula; papagaio fala e voa; tartaruga se esconde', () => {
  const p = partida('sala'), M = p.estado().casa;
  p.movimento(0, [[M.gato.x / 1280, (M.gato.y - 25) / 720, 100]], 1000); correr(p, 100);
  assert.ok(M.gato.salto || M.gato.miau > 0, 'o gato não reagiu');
  p.movimento(0, [[M.papagaio.x / 1280, M.papagaio.y / 720, 100]], 3000); correr(p, 100);
  assert.ok(M.papagaio.voa > 0 && M.papagaio.fala > 0, 'o papagaio não voou nem falou');
  p.movimento(0, [[M.tartaruga.x / 1280, (M.chao - 20) / 720, 100]], 6000); correr(p, 50);
  assert.ok(M.tartaruga.esconde > 0, 'a tartaruga não se escondeu');
  assert.ok(p.eventos().some((e) => e.fala), 'o papagaio não disse nada');
});

test('nos últimos segundos a mamãe chega e, no fim, vê a bagunça', () => {
  const p = Casa.criar({ cenaCasa: 'quarto', duracao: 10 }); p.comecar();
  correr(p, 5000); assert.ok(p.estado().casa.mae, 'a mamãe não apareceu');
  correr(p, 6000); const M = p.estado().casa;
  assert.ok(M.mae.viu, 'a mamãe não viu a bagunça');
  assert.ok(p.eventos().some((e) => e.som === 'mamae'));
});

test('setinhas: vai ao cômodo vizinho e, na volta, a bagunça está lá', () => {
  const p = partida('sala');
  passar(p, [880, 180], [1200, 200], 1000); correr(p, 2000);
  const antes = p.estado().bagunca;
  assert.deepStrictEqual(p.vizinhos(), { ant: 'parquinho', prox: 'quarto' });
  p.irPara(1); assert.strictEqual(p.cena, 'quarto'); assert.strictEqual(p.estado().casa.cena, 'quarto');
  p.irPara(-1); assert.strictEqual(p.cena, 'sala');
  assert.ok(p.estado().bagunca >= antes - 0.01 && antes > 0, 'a bagunça da sala sumiu');
  assert.ok(p.eventos().some((e) => e.som === 'porta' && e.troca === 'quarto'));
});

test('aparelhos: TV liga, piano toca nota, torradeira solta torradas, sapo coaxa', () => {
  const toca = (p, x, y, t) => { p.movimento(0, [[x / 1280, y / 720, 100]], t); p.avancar(16); };
  let p = partida('sala'), M = p.estado().casa, tv = M.aparelhos.find((a) => a.tipo === 'tv'), pi = M.aparelhos.find((a) => a.tipo === 'piano');
  toca(p, tv.x + 50, tv.y + 50, 1000); assert.strictEqual(tv.on, true, 'a TV não ligou');
  toca(p, pi.x + 5, pi.y + 30, 2000); assert.ok(p.eventos().some((e) => /^nota\d$/.test(e.som)), 'o piano não tocou');
  p = partida('cozinha'); M = p.estado().casa; const to = M.aparelhos.find((a) => a.tipo === 'torradeira'), n0 = M.obs.length;
  toca(p, to.x + 30, to.y + 20, 1000); assert.strictEqual(M.obs.length, n0 + 2, 'as torradas não pularam');
  p = partida('jardim'); M = p.estado().casa; const sp = M.aparelhos.find((a) => a.tipo === 'sapo');
  toca(p, sp.x, sp.y - 20, 1000); assert.ok(sp.croac > 0 && sp.pulo, 'o sapo não pulou');
});

test('🧹 arrumação: começa bagunçado, arrasta e encaixa, livro fecha, cesto, e festa quando tudo volta ao lugar', () => {
  const p = Casa.criar({ cenaCasa: 'sala', modo: 'arrumar', aleatorio: (() => { let s = 3; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })() }); p.comecar(); p.avancar(16);
  let e = p.estado(); const M = e.casa;
  assert.strictEqual(e.modo, 'arrumar'); assert.strictEqual(e.restante, null, 'arrumação não tem relógio');
  assert.ok(e.bagunca > 0.3, 'devia começar bagunçado');
  const fora = M.obs.find((o) => Math.hypot(o.x - o.x0, o.y - o.y0) > 60);
  assert.ok(p.pegar('a', 0, fora.x / 1280, fora.y / 720), 'não pegou');
  p.mover('a', (fora.x0 + 200) / 1280, (fora.y0 - 100) / 720); p.largar('a'); p.avancar(16);
  assert.ok(Math.hypot(fora.x - fora.x0, fora.y - fora.y0) > 30, 'longe do lugar não devia encaixar');
  for (let r = 0; r < 4; r++) { M.obs.slice().sort((a, b) => b.y0 - a.y0).forEach((o, i) => { if (o.dorme && Math.hypot(o.x - o.x0, o.y - o.y0) < 1 && !o.aberto) return; if (p.pegar('k' + i, 0, o.x / 1280, o.y / 720)) { p.mover('k' + i, o.x0 / 1280, o.y0 / 720); p.largar('k' + i); } }); correr(p, 1500); }
  assert.ok(!M.obs.some((o) => o.aberto), 'algum livro ficou aberto');
  const toca = (x, y) => { p.pegar('t', 0, x / 1280, y / 720); p.largar('t'); p.avancar(16); };
  if (Math.abs(M.quadro.repouso) > 0.12) toca(M.quadro.x + 60, M.quadro.y + 50);
  if (!M.luz) toca(M.interruptor.x + 18, M.interruptor.y + 27);
  correr(p, 300);
  assert.ok(M.tudoArrumado, 'não terminou: ' + p.estado().bagunca);
  assert.ok(p.eventos().some((x) => x.t === 'arrumado'), 'sem festa');
  correr(p, 4000); assert.strictEqual(p.estado().fase, 'fim');
});

test('🧹 depois do 🧸: a mesma bagunça vira arrumação, e o que a torradeira soltou vai para o cesto', () => {
  const p = partida('cozinha'), M = p.estado().casa, to = M.aparelhos.find((a) => a.tipo === 'torradeira');
  p.movimento(0, [[(to.x + 30) / 1280, (to.y + 20) / 720, 100]], 1000); correr(p, 2000);
  passar(p, [60, 220], [400, 220], 4000); correr(p, 2000);
  const antes = p.estado().bagunca; p.terminar(); p.arrumar();
  const e = p.estado(); assert.strictEqual(e.modo, 'arrumar'); assert.strictEqual(e.fase, 'jogando'); assert.ok(Math.abs(e.bagunca - antes) < 0.2);
  const torrada = M.obs.find((o) => o.tipo === 'torrada');
  assert.ok(p.pegar('c', 0, torrada.x / 1280, torrada.y / 720)); p.mover('c', (M.cesto.x + 50) / 1280, (M.cesto.y + 40) / 720); p.largar('c');
  assert.ok(!M.obs.includes(torrada), 'a torrada não foi para o cesto');
  p.dica(); assert.ok(M.dica, 'a dica não apontou nada');
});
