// Testes do motor puro da Peluqueria: node --test peluqueria/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../jogo.js');

const LUG = { cabeca: { x: 0.5, y: 0.22, tam: 0.4, rot: 0 }, olhos: { x: 0.5, y: 0.36, tam: 0.34, rot: 0 }, nariz: { x: 0.5, y: 0.47, tam: 0.1, rot: 0 }, boca: { x: 0.5, y: 0.56, tam: 0.26, rot: 0 } };
const cen = id => ({ id, nome: id, arquivo: id + '.svg', largura: 1000, altura: 1000, lugares: LUG });
const ite = (id, lugar) => ({ id, nome: id, arquivo: id + '.svg', lugar: lugar || 'cabeca', encaixe: { x: 0.5, y: 0.85 } });
const CENS = Array.from({ length: 12 }, (_, i) => cen('c' + i));
const ITENS = Array.from({ length: 12 }, (_, i) => ite('i' + i));

function rodada(nivel, extra) { return P.criarRodada(Object.assign({ nivel, cenarios: CENS, itens: ITENS, semente: 7 }, extra || {})); }
function ateAlvo(e) { const q = e.quedas[e.i]; const n = P.NIVEIS[e.nivel]; return (q.cenario.lugares[q.lugar].y - P.TOPO) / (n.vel * (1 + 0.05 * e.i)); }
function perfeitoCrianca(e) { P.avancar(e, ateAlvo(e)); return P.parar(e); }
function longe(e) { P.avancar(e, 100); }

test('limites das categorias', () => {
  assert.equal(P.pontuar(0.03, 0, 'normal'), 'PERFEITO');
  assert.equal(P.pontuar(0.0301, 0, 'normal'), 'BOM');
  assert.equal(P.pontuar(0.08, 0, 'normal'), 'BOM');
  assert.equal(P.pontuar(0.0801, 0, 'normal'), 'QUASE');
  assert.equal(P.pontuar(0.15, 0, 'normal'), 'QUASE');
  assert.equal(P.pontuar(0.1501, 0, 'normal'), 'LONGE');
  assert.equal(P.pontuar(0.045, 0, 'crianca'), 'PERFEITO');
  assert.equal(P.pontuar(0.025, 0, 'maluco'), 'BOM');
});

test('giro derruba um degrau no Maluco', () => {
  assert.equal(P.pontuar(0, 26, 'maluco'), 'BOM');
  assert.equal(P.pontuar(0, 25, 'maluco'), 'PERFEITO');
  assert.equal(P.pontuar(0.1, 30, 'maluco'), 'LONGE');
  assert.equal(P.pontuar(0, 90, 'normal'), 'PERFEITO');
});

test('Criança parada na hora certa dá PERFEITO', () => {
  const e = rodada('crianca');
  const r = perfeitoCrianca(e);
  assert.equal(r.categoria, 'PERFEITO');
  assert.equal(r.pontos, 100);
  assert.ok(r.distancia < 1e-9);
});

test('multiplicador sobe até ×3 e zera', () => {
  const e = rodada('crianca');
  const vistos = [];
  for (let k = 0; k < 6; k++) { vistos.push(perfeitoCrianca(e).pontos); P.proxima(e); }
  assert.deepEqual(vistos, [100, 150, 200, 250, 300, 300]);
  longe(e);
  assert.equal(e.resultados[6].categoria, 'LONGE');
  assert.equal(e.mult, 1);
  P.proxima(e);
  assert.equal(perfeitoCrianca(e).pontos, 100);
  assert.equal(e.pontos, 100 + 150 + 200 + 250 + 300 + 300 + 100);
});

test('velocidade +5 % por queda', () => {
  const e = rodada('crianca');
  const y = P.posicao(e.quedas[0], 'crianca', 9, 1).y;
  assert.ok(Math.abs((y - P.TOPO) - 0.22 * 1.45) < 1e-9);
});

test('item que sai sem toque é LONGE', () => {
  const e = rodada('normal');
  longe(e);
  assert.equal(e.resultados[0].categoria, 'LONGE');
  assert.equal(e.resultados[0].pontos, 0);
  assert.equal(e.fase, 'parado');
  assert.equal(P.parar(e), null);
});

test('avancar não anda fora da fase caindo', () => {
  const e = rodada('crianca');
  P.parar(e); const t = e.t;
  P.avancar(e, 5);
  assert.equal(e.t, t);
});

test('rodada tem 10 quedas e termina', () => {
  const e = rodada('normal');
  assert.equal(e.quedas.length, P.QUEDAS);
  for (let k = 0; k < 10; k++) { assert.equal(e.fase, 'caindo'); P.parar(e); P.proxima(e); }
  assert.equal(e.fase, 'fim');
  assert.equal(e.resultados.length, 10);
});

test('sorteio sem repetir seguidos e repetível', () => {
  const a = P.sortear(CENS, ITENS, 10, P.aleatorio(7));
  const b = P.sortear(CENS, ITENS, 10, P.aleatorio(7));
  assert.deepEqual(a.map(q => q.cenario.id + q.item.id), b.map(q => q.cenario.id + q.item.id));
  for (let k = 1; k < a.length; k++) {
    assert.notEqual(a[k].cenario.id, a[k - 1].cenario.id);
    assert.notEqual(a[k].item.id, a[k - 1].item.id);
  }
});

test('item só vai para cenário com o lugar dele', () => {
  const soCabeca = Object.assign(cen('sc'), { lugares: { cabeca: LUG.cabeca } });
  const comNariz = Object.assign(cen('cn'), { lugares: { nariz: LUG.nariz } });
  const q = P.sortear([soCabeca, comNariz], [ite('nz', 'nariz'), ite('nz2', 'nariz')], 10, P.aleatorio(3));
  assert.equal(q.length, 10);
  for (const x of q) { assert.equal(x.cenario.id, 'cn'); assert.equal(x.lugar, 'nariz'); }
});

test('estrelas nos limites', () => {
  const com = n => ({ resultados: Array.from({ length: 10 }, (_, i) => ({ categoria: i < n ? (i % 2 ? 'BOM' : 'PERFEITO') : 'QUASE' })) });
  assert.equal(P.estrelas(com(7)), 3);
  assert.equal(P.estrelas(com(6)), 2);
  assert.equal(P.estrelas(com(4)), 2);
  assert.equal(P.estrelas(com(3)), 1);
  assert.equal(P.estrelas(com(1)), 1);
  assert.equal(P.estrelas(com(0)), 0);
});

test('Normal balança de lado e Maluco gira', () => {
  const e = rodada('normal');
  const xs = [0, 0.3, 0.6, 0.9, 1.2].map(t => P.posicao(e.quedas[0], 'normal', 0, t).x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 0.05);
  assert.ok(Math.max(...xs) <= 0.5 + 0.08 + 1e-9 && Math.min(...xs) >= 0.5 - 0.08 - 1e-9);
  const m = rodada('maluco');
  const rs = [0, 0.2, 0.4, 0.6].map(t => P.posicao(m.quedas[0], 'maluco', 0, t).rot);
  assert.ok(Math.max(...rs) - Math.min(...rs) > 20);
  assert.ok(rs.every(r => Math.abs(r) <= 40 + 1e-9));
  assert.equal(P.posicao(rodada('crianca').quedas[0], 'crianca', 0, 3).x, 0.5);
});

test('distância usa o lado menor da imagem', () => {
  const c = Object.assign(cen('larga'), { largura: 2000, altura: 1000 });
  const d = P.distancia({ x: 0.55, y: 0.5 }, { x: 0.5, y: 0.5 }, c);
  assert.ok(Math.abs(d - 0.1) < 1e-9);
});

test('validação rejeita entradas ruins', () => {
  const bom = cen('cachorro');
  const limpo = P.validarCenario(bom);
  assert.deepEqual(limpo, bom);
  const ruins = [
    { arquivo: '../x.png' }, { arquivo: 'a/b.png' }, { arquivo: 'x.exe' }, { arquivo: 'x..png' },
    { lugares: { cabeca: Object.assign({}, LUG.cabeca, { x: 1.2 }) } },
    { lugares: { cabeca: Object.assign({}, LUG.cabeca, { tam: 0 }) } },
    { lugares: { cabeca: Object.assign({}, LUG.cabeca, { rot: 60 }) } },
    { lugares: { pe: LUG.cabeca } }, { lugares: {} },
    { nome: 'x'.repeat(31) }, { id: 'A B' }, { largura: 0 }, { altura: 9000 }
  ];
  for (const r of ruins) assert.equal(P.validarCenario(Object.assign(cen('c'), r)), null, JSON.stringify(r));
  assert.equal(P.validarCenario(null), null);
  assert.equal(P.validarCenario('x'), null);
  assert.ok(P.validarCenario(Object.assign(cen('c'), { nome: { pt: 'Cão', en: 'Dog' } })));
  assert.deepEqual(P.validarItem(ite('coroa')), ite('coroa'));
  assert.equal(P.validarItem(ite('coroa', 'pe')), null);
  assert.equal(P.validarItem(Object.assign(ite('coroa'), { encaixe: { x: 2, y: 0 } })), null);
  assert.equal(P.validarItem(Object.assign(ite('coroa'), { arquivo: '../coroa.svg' })), null);
});

test('item aceita escala opcional entre 0,3 e 3', () => {
  assert.equal(P.validarItem(Object.assign(ite('peruca'), { escala: 1.7 })).escala, 1.7);
  assert.equal(P.validarItem(Object.assign(ite('peruca'), { escala: 5 })), null);
  assert.equal(P.validarItem(Object.assign(ite('peruca'), { escala: 0.1 })), null);
  assert.equal(P.validarItem(ite('peruca')).escala, undefined);
});

test('zigue-zague sincronizado: na altura certa o item está no meio do alvo e reto', () => {
  for (const nivel of ['normal', 'maluco']) {
    const e = rodada(nivel);
    for (let i = 0; i < 10; i++) {
      const q = e.quedas[i], L = q.cenario.lugares[q.lugar], n = P.NIVEIS[nivel];
      const tAlvo = (L.y - P.TOPO) / (n.vel * (1 + 0.05 * i));
      const p = P.posicao(q, nivel, i, tAlvo);
      assert.ok(Math.abs(p.x - L.x) < 1e-9, nivel + ' queda ' + i + ': x=' + p.x + ' alvo=' + L.x);
      assert.ok(Math.abs(p.rot - (L.rot || 0)) < 1e-9, nivel + ' queda ' + i + ': rot=' + p.rot);
      assert.ok(Math.abs(p.y - L.y) < 1e-9);
    }
  }
});

test('parar na hora certa dá PERFEITO também no Normal e no Maluco', () => {
  for (const nivel of ['normal', 'maluco']) {
    const e = rodada(nivel);
    P.avancar(e, ateAlvo(e));
    assert.equal(P.parar(e).categoria, 'PERFEITO', nivel);
  }
});
