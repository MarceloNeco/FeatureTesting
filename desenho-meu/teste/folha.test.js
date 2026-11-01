// Folha esperta do Desenho Meu: node --test desenho-meu/teste/folha.test.js (da raiz do repositório)
const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../folha.js');

const perto = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, a + ' ≠ ' + b);
const naTela = (v, c, larg, alt) => {
  const a = F.aTela(v, c.x, c.y), b = F.aTela(v, c.x + c.w, c.y + c.h);
  return a.x >= -0.5 && a.y >= -0.5 && b.x <= larg + 0.5 && b.y <= alt + 0.5;
};

test('vista inicial: o lado menor mostra 900 unidades, centrada no mundo', () => {
  const v = F.inicial(390, 844, null);
  perto(v.s, 390 / 900);
  const c = F.aMundo(v, 195, 422); perto(c.x, F.W / 2); perto(c.y, F.H / 2);
});

test('tela ↔ mundo ida e volta', () => {
  const v = { s: 0.7, ox: -100, oy: 33 };
  const p = F.aMundo(v, 200, 300), q = F.aTela(v, p.x, p.y);
  perto(q.x, 200); perto(q.y, 300);
});

test('girar sem nada desenhado: mesmo tamanho e mesmo centro', () => {
  const v0 = F.inicial(390, 844, null), v = F.aoGirar(v0, 390, 844, 844, 390, null);
  perto(v.s, v0.s);
  const c = F.aMundo(v, 422, 195); perto(c.x, F.W / 2, 1e-3); perto(c.y, F.H / 2, 1e-3);
});

test('desenhou só em cima (cabe deitado): continua do mesmo tamanho e aparece inteiro', () => {
  const v0 = F.inicial(390, 844, null);
  // desenho numa faixa larga e baixa no alto da tela em pé
  const a = F.aMundo(v0, 40, 80), b = F.aMundo(v0, 350, 300);
  const caixa = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  const v = F.aoGirar(v0, 390, 844, 844, 390, caixa);
  perto(v.s, v0.s);
  assert.ok(naTela(v, caixa, 844, 390), 'desenho inteiro à vista');
});

test('desenhou em cima e embaixo (não cabe deitado): encolhe para caber inteiro e a folha cresce', () => {
  const v0 = F.inicial(390, 844, null);
  const a = F.aMundo(v0, 40, 60), b = F.aMundo(v0, 350, 800);
  const caixa = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  const v = F.aoGirar(v0, 390, 844, 844, 390, caixa);
  assert.ok(v.s < v0.s, 'ficou menor');
  assert.ok(naTela(v, caixa, 844, 390), 'desenho inteiro à vista');
  // a tela toda é papel: o mundo mostrado é mais largo que o desenho
  const e = F.aMundo(v, 0, 0), d = F.aMundo(v, 844, 390);
  assert.ok(d.x - e.x > caixa.w * 1.5, 'folha cresceu para os lados');
  // e voltando a ficar em pé, o desenho continua inteiro
  const v2 = F.aoGirar(v, 844, 390, 390, 844, caixa);
  assert.ok(naTela(v2, caixa, 390, 844));
});

test('zoom e pinça respeitam os limites e mantêm o ponto sob os dedos', () => {
  const v0 = F.inicial(800, 600, null), l = F.limites(800, 600);
  let v = v0; for (let i = 0; i < 50; i++) v = F.zoom(v, 1.5, 400, 300, 800, 600);
  perto(v.s, l.max);
  v = v0; for (let i = 0; i < 50; i++) v = F.zoom(v, 0.5, 400, 300, 800, 600);
  perto(v.s, l.min);
  const p = F.pinca(v0, { x: 300, y: 300 }, { x: 500, y: 300 }, { x: 250, y: 300 }, { x: 550, y: 300 }, 800, 600);
  perto(p.s, v0.s * 1.5);
  const antes = F.aMundo(v0, 400, 300), depois = F.aMundo(p, 400, 300);
  perto(antes.x, depois.x, 1e-6); perto(antes.y, depois.y, 1e-6);
});

test('a vista nunca perde o mundo de vista', () => {
  const v = F.arrastar(F.inicial(800, 600, null), 100000, 100000, 800, 600);
  const c = F.aMundo(v, 400, 300);
  assert.ok(c.x >= 0 && c.x <= F.W && c.y >= 0 && c.y <= F.H);
});

test('página de colorir começa inteira na tela', () => {
  const v = F.inicial(390, 844, F.PAGINA);
  assert.ok(naTela(v, F.PAGINA, 390, 844));
});

test('barra no mesmo lugar físico do celular', () => {
  assert.equal(F.ladoDaBarra('celular', 390, 844, 0), 'baixo');
  assert.equal(F.ladoDaBarra('celular', 844, 390, 90), 'direita');
  assert.equal(F.ladoDaBarra('celular', 844, 390, -90), 'esquerda');
  assert.equal(F.ladoDaBarra('celular', 844, 390, 270), 'esquerda');
  assert.equal(F.ladoDaBarra('tablet', 1366, 1024, 90), 'baixo');
  assert.equal(F.ladoDaBarra('tv', 1920, 1080, 0), 'esquerda');
});

test('caixas', () => {
  assert.deepEqual(F.caixaDePontos([10, 20, 30, 5], 2), { x: 8, y: 3, w: 24, h: 19 });
  assert.deepEqual(F.unir({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: -5, w: 10, h: 10 }), { x: 0, y: -5, w: 15, h: 15 });
  assert.equal(F.dentroDoMundo({ x: -50, y: -50, w: 20, h: 20 }), null);
});
