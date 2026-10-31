// Testes do motor puro do Bagunçolândia: node --test baguncolandia/teste/
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../jogo.js');

const FIGS = [
  { id: 'melancia', papel: 'fruta', raio: 48 },
  { id: 'donut', papel: 'doce', raio: 40 },
  { id: 'pimentao', papel: 'vilao', raio: 44 },
  { id: 'bolinho', papel: 'heroi', raio: 46, mascote: true },
  { id: 'estrela', papel: 'poder', raio: 36, poder: 'x2' },
  { id: 'bola', papel: 'bola', raio: 34 }
];
function sorteioFixo(seq) { let i = 0; return () => seq[i++ % seq.length]; }
function partida(extra) {
  return B.criarPartida(Object.assign({ modo: 'corta', jogadores: 1, duracao: 60, dificuldade: 'normal', figuras: FIGS, aleatorio: sorteioFixo([0.5]) }, extra || {}));
}
function drenar(p) { return p.eventos(); }

test('rodada começa com placar zero, 3 vidas e tempo cheio', () => {
  const p = partida(); p.comecar();
  const e = p.estado();
  assert.equal(e.jogadores[0].pontos, 0);
  assert.equal(e.jogadores[0].vidas, 3);
  assert.equal(e.restante, 60);
  assert.equal(e.fase, 'jogando');
});

test('corta-corta lança frutas que sobem e caem (gravidade)', () => {
  const p = partida(); p.comecar();
  p.avancar(1200);                       // intervalo normal é 1 s: já lançou pelo menos uma
  const e = p.estado();
  assert.ok(e.coisas.length >= 1, 'lançou');
  const c = e.coisas[0]; const y0 = c.y, vy0 = c.vy;
  assert.ok(vy0 < 0, 'sobe (vy negativo)');
  p.avancar(500);
  const c2 = p.estado().coisas.find(x => x.id === c.id);
  assert.ok(c2 && c2.vy > vy0, 'gravidade freia a subida');
});

test('passar a mão por cima de uma fruta corta e dá pontos', () => {
  const p = partida(); p.comecar();
  p.lancar({ fig: 'melancia', x: 640, y: 360, vx: 0, vy: 0 }, 0);
  const fruta = p.estado().coisas[0];
  assert.equal(fruta.papel, 'fruta');
  // dois pontos de movimento seguidos cruzando a fruta (x,y normalizados do palco do jogador)
  p.movimento(0, [[0.40, 0.5, 90]], 1000);
  p.movimento(0, [[0.60, 0.5, 90]], 1100);
  const ev = drenar(p);
  assert.ok(ev.some(x => x.t === 'corte' && x.fig === 'melancia'), JSON.stringify(ev));
  assert.equal(p.estado().jogadores[0].pontos, 10);
  assert.equal(p.estado().coisas.filter(c => !c.morta).length, 0);
});

test('movimento fraco não corta', () => {
  const p = partida(); p.comecar();
  p.lancar({ fig: 'melancia', x: 640, y: 360, vx: 0, vy: 0 }, 0);
  p.movimento(0, [[0.40, 0.5, 10]], 1000);
  p.movimento(0, [[0.60, 0.5, 10]], 1100);
  assert.equal(p.estado().jogadores[0].pontos, 0);
});

test('cortar um vilão tira uma vida', () => {
  const p = partida(); p.comecar();
  p.lancar({ fig: 'pimentao', x: 640, y: 360, vx: 0, vy: 0 }, 0);
  p.movimento(0, [[0.40, 0.5, 90]], 1000);
  p.movimento(0, [[0.60, 0.5, 90]], 1100);
  assert.equal(p.estado().jogadores[0].vidas, 2);
  assert.ok(drenar(p).some(x => x.t === 'vilao'));
});

test('três frutas numa passada viram combo com bônus', () => {
  const p = partida(); p.comecar();
  [500, 640, 780].forEach((x, i) => p.lancar({ fig: 'melancia', x, y: 360, vx: 0, vy: 0 }, i));
  p.movimento(0, [[0.30, 0.5, 95]], 1000);
  p.movimento(0, [[0.70, 0.5, 95]], 1100);
  const ev = drenar(p);
  const combo = ev.find(x => x.t === 'combo');
  assert.ok(combo && combo.n === 3, JSON.stringify(ev));
  assert.equal(p.estado().jogadores[0].pontos, 30 + 15);   // 3×10 + bônus 3×5
});

test('a rodada acaba quando o tempo zera', () => {
  const p = partida({ duracao: 5 }); p.comecar();
  p.avancar(5200);
  assert.equal(p.estado().fase, 'fim');
  assert.ok(drenar(p).some(x => x.t === 'fim'));
});

test('pega-pega: tocar num herói pega; vilão tira 5; mascote vale dobro', () => {
  const p = partida({ modo: 'pega' }); p.comecar();
  p.lancar({ fig: 'bolinho', x: 640, y: 360, vx: 0, vy: 0 }, 0);
  p.movimento(0, [[0.5, 0.5, 80]], 1000);
  assert.equal(p.estado().jogadores[0].pontos, 30);
  p.lancar({ fig: 'pimentao', x: 300, y: 300, vx: 0, vy: 0 }, 1);
  p.movimento(0, [[300 / 1280, 300 / 720, 80]], 1300);
  assert.equal(p.estado().jogadores[0].pontos, 25);
  assert.ok(drenar(p).some(x => x.t === 'pegou' && x.fig === 'bolinho'));
});

test('poder x2 dobra os pontos por 10 s', () => {
  const p = partida({ modo: 'pega' }); p.comecar();
  p.lancar({ fig: 'estrela', x: 640, y: 360, vx: 0, vy: 0 }, 0);
  p.movimento(0, [[0.5, 0.5, 80]], 1000);
  assert.equal(p.estado().jogadores[0].poder, 'x2');
  p.lancar({ fig: 'bolinho', x: 640, y: 360, vx: 0, vy: 0 }, 1);
  p.movimento(0, [[0.5, 0.5, 80]], 1300);
  assert.equal(p.estado().jogadores[0].pontos, 60);   // 30 × 2
  p.avancar(10500);
  assert.equal(p.estado().jogadores[0].poder, null);
});

test('chuta-chuta: só movimento na zona de chute conta, e gol vale 30', () => {
  const p = partida({ modo: 'chuta' }); p.comecar();
  p.zonaChute(0, 0.65);   // chute = abaixo de 65% da altura
  p.lancar({ fig: 'bola', x: 640, y: 600, vx: 0, vy: 0 }, 0);
  p.movimento(0, [[0.5, 600 / 720, 90]], 1000);     // ponto em cima da bola, na zona
  let ev = drenar(p);
  assert.ok(ev.some(x => x.t === 'chutou'), JSON.stringify(ev));
  assert.equal(p.estado().jogadores[0].pontos, 10);
  const bola = p.estado().coisas.find(c => c.papel === 'bola');
  assert.ok(bola.vy < 0, 'a bola voa para cima depois do chute');
  // bola fora da zona não chuta
  p.lancar({ fig: 'bola', x: 300, y: 200, vx: 0, vy: 0 }, 1);
  p.movimento(0, [[300 / 1280, 200 / 720, 90]], 1300);
  assert.ok(!drenar(p).some(x => x.t === 'chutou'));
  // gol: bola chutada que entra na trave
  const trave = p.estado().trave;
  p.lancar({ fig: 'bola', x: trave.x + trave.w / 2, y: trave.y + trave.h + 10, vx: 0, vy: -900, chutada: true }, 2);
  p.avancar(100);
  assert.ok(drenar(p).some(x => x.t === 'gol'));
  assert.equal(p.estado().jogadores[0].pontos, 40);
});

test('dois jogadores têm placar separado', () => {
  const p = partida({ jogadores: 2 }); p.comecar();
  p.lancar({ fig: 'melancia', x: 960, y: 360, vx: 0, vy: 0, j: 1 }, 0);   // raia do jogador 2 = metade direita
  p.movimento(1, [[0.4, 0.5, 90]], 1000);
  p.movimento(1, [[0.6, 0.5, 90]], 1100);
  assert.equal(p.estado().jogadores[0].pontos, 0);
  assert.equal(p.estado().jogadores[1].pontos, 10);
});

test('separar os pontos de uma câmera só entre dois jogadores (metade esquerda = 1)', () => {
  const r = B.separarJogadores([[0.2, 0.5, 80], [0.8, 0.3, 60]]);
  assert.deepEqual(r[0], [[0.4, 0.5, 80]]);
  assert.deepEqual(r[1], [[0.6, 0.3, 60]]);
});

test('validar: aceita mensagens certas e recusa lixo', () => {
  assert.ok(B.validar({ t: 'join', id: 'abc12345', nome: 'Ana' }));
  assert.equal(B.validar({ t: 'join', id: 'abc12345', nome: 'Um nome comprido demais para caber' }), null);
  assert.equal(B.validar({ t: 'hack', id: 'x' }), null);
  assert.equal(B.validar({ t: 'offer', id: 'abc12345', nome: 'Ana', sdp: 'texto' }), null);
  assert.ok(B.validar({ t: 'offer', id: 'abc12345', nome: 'Ana', sdp: { type: 'offer', sdp: 'v=0' } }));
  assert.equal(B.validar({ t: 'offer', id: 'abc12345', nome: 'Ana', sdp: { type: 'rollback', sdp: 'v=0' } }), null);
  assert.equal(B.validar({ t: 'cmd', acao: 'apagar-tudo' }), null);
  assert.ok(B.validar({ t: 'cmd', acao: 'comecar', modo: 'corta' }));
  assert.equal(B.validar('string'), null);
  assert.equal(B.validar({ t: 'join', id: '<script>', nome: 'Ana' }), null);
  const v = B.validar({ t: 'join', id: 'abc12345', nome: '  Ana <b>  ' });
  assert.equal(v.nome, 'Ana <b>');   // texto cru é guardado; quem mostra usa textContent
});
