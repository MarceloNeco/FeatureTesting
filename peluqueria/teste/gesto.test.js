// Detector de movimento brusco (puro): node --test peluqueria/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../gesto.js');

// esqueleto de 13 pontos: nariz, ombros, cotovelos, pulsos, quadris, joelhos, tornozelos; pessoa em pé
function corpo(esc, cx, extra) {
  const s = esc, p = [[cx, 0.2], [cx - s / 2, 0.32], [cx + s / 2, 0.32], [cx - s / 2 - 0.03, 0.45], [cx + s / 2 + 0.03, 0.45], [cx - s / 2 - 0.04, 0.56], [cx + s / 2 + 0.04, 0.56],
    [cx - s / 3, 0.6], [cx + s / 3, 0.6], [cx - s / 3, 0.75], [cx + s / 3, 0.75], [cx - s / 3, 0.9], [cx + s / 3, 0.9]];
  const k = s / 0.2;   // quem está longe da câmera fica menor por inteiro (largura e altura)
  for (const q of p) q[1] = 0.5 + (q[1] - 0.5) * k;
  if (extra) extra(p);
  return p;
}
let semente = 1; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
const treme = (p, a) => p.map(([x, y]) => [x + (rnd() - 0.5) * 2 * a, y + (rnd() - 0.5) * 2 * a]);
function rodar(g, quadros) { let n = 0; for (const [t, p] of quadros) if (g.ver(p, t)) n++; return n; }
const FPS = 1000 / 15;

test('criança parada tremendo não dispara', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 60; k++) q.push([k * FPS, treme(corpo(0.2, 0.5), 0.012)]);
  assert.equal(rodar(g, q), 0);
});
test('balanço lento do braço não dispara', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 30; k++) q.push([k * FPS, corpo(0.2, 0.5, p => { p[6] = [p[6][0], 0.56 - 0.06 * k / 30]; })]);   // 0,3 ombro em 2 s
  assert.equal(rodar(g, q), 0);
});
test('levantar o braço rápido dispara uma vez', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 10; k++) q.push([k * FPS, corpo(0.2, 0.5)]);
  for (let k = 1; k <= 3; k++) q.push([(9 + k) * FPS, corpo(0.2, 0.5, p => { p[5] = [p[5][0], 0.56 - 0.05 * k]; })]);   // pulso sobe 0,15 (0,75 ombro) em 0,2 s
  for (let k = 13; k < 20; k++) q.push([k * FPS, corpo(0.2, 0.5, p => { p[5] = [p[5][0], 0.41]; })]);
  assert.equal(rodar(g, q), 1);
});
test('chute dispara', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 8; k++) q.push([k * FPS, corpo(0.2, 0.5)]);
  for (let k = 1; k <= 2; k++) q.push([(7 + k) * FPS, corpo(0.2, 0.5, p => { p[12] = [p[12][0] + 0.06 * k, 0.9 - 0.03 * k]; })]);
  assert.equal(rodar(g, q), 1);
});
test('espera 0,7 s entre gatilhos', () => {
  const g = G.criar();
  const rapido = (t0, y0, dy) => [[t0, corpo(0.2, 0.5, p => { p[6] = [p[6][0], y0]; })], [t0 + 2 * FPS, corpo(0.2, 0.5, p => { p[6] = [p[6][0], y0 + dy]; })]];
  let n = rodar(g, rapido(0, 0.56, -0.15));
  n += rodar(g, rapido(4 * FPS, 0.41, 0.15));     // volta rápido logo em seguida: ignorado
  n += rodar(g, rapido(20 * FPS, 0.56, -0.15));   // 1,3 s depois: vale
  assert.equal(n, 2);
});
test('pessoa longe da câmera (pequena) também dispara; mesmo deslocamento numa pessoa grande não', () => {
  const peq = G.criar(), q = [];
  for (let k = 0; k < 6; k++) q.push([k * FPS, corpo(0.08, 0.5)]);
  q.push([6 * FPS, corpo(0.08, 0.5, p => { p[5] = [p[5][0], p[5][1] - 0.06]; })]);       // 0,06 = 0,75 ombro pequeno
  assert.equal(rodar(peq, q), 1);
  const gra = G.criar(), q2 = [];
  for (let k = 0; k < 6; k++) q2.push([k * FPS, corpo(0.3, 0.5)]);
  q2.push([6 * FPS, corpo(0.3, 0.5, p => { p[5] = [p[5][0], p[5][1] - 0.06]; })]);       // 0,06 = 0,2 ombro grande
  assert.equal(rodar(gra, q2), 0);
});
test('pessoa de lado (ombros juntos) usa a altura do tronco', () => {
  const g = G.criar(), q = [];
  const lado = ex => corpo(0.2, 0.5, p => { p[1] = [0.5, 0.32]; p[2] = [0.505, 0.32]; if (ex) ex(p); });
  for (let k = 0; k < 6; k++) q.push([k * FPS, treme(lado(), 0.008)]);
  q.push([6 * FPS, lado(p => { p[6] = [p[6][0], 0.38]; })]);
  assert.equal(rodar(g, q), 1);
});
test('pontos inválidos não quebram', () => {
  const g = G.criar();
  assert.equal(g.ver(null, 0), false);
  assert.equal(g.ver([[NaN, 1]], 10), false);
  assert.equal(g.ver(corpo(0.2, 0.5), 20), false);
});

/* revisão 0.4.0: câmera de verdade */
const mover = (p, dx, dy) => p.map(q => [q[0] + dx, q[1] + dy].concat(q.length > 2 ? [q[2]] : []));
test('o corpo inteiro pulando ou andando não dispara (conta o braço em relação ao tronco)', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 6; k++) q.push([k * FPS, corpo(0.2, 0.4)]);
  for (let k = 1; k <= 3; k++) q.push([(5 + k) * FPS, mover(corpo(0.2, 0.4), 0.06 * k, -0.04 * k)]);
  assert.equal(rodar(g, q), 0);
});
test('pé fora do quadro (visibilidade baixa) tremendo muito não dispara; chute com pé visível dispara', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 40; k++) q.push([k * FPS, corpo(0.2, 0.5, p => { p[11] = [0.43 + (k % 2 ? 0.12 : -0.12), 1.1, 0.2]; p[12] = [0.57, 1.05 + (k % 3) * 0.1, 0.1]; })]);
  assert.equal(rodar(g, q), 0);
  const g2 = G.criar(), q2 = [];
  for (let k = 0; k < 6; k++) q2.push([k * FPS, corpo(0.2, 0.5, p => { p[12] = [0.57, 0.9, 0.95]; })]);
  q2.push([6 * FPS, corpo(0.2, 0.5, p => { p[12] = [0.69, 0.84, 0.95]; })]);
  assert.equal(rodar(g2, q2), 1);
});
test('pessoa sumiu por um instante e voltou com o braço em outro lugar: não dispara', () => {
  const g = G.criar(), q = [];
  for (let k = 0; k < 6; k++) q.push([k * FPS, corpo(0.2, 0.5)]);
  q.push([12 * FPS, corpo(0.2, 0.5, p => { p[5] = [p[5][0], 0.36]; })]);   // 400 ms sem ver a pessoa
  assert.equal(rodar(g, q), 0);
});
test('instante do gesto = começo do movimento (para não chegar sempre atrasado)', () => {
  const g = G.criar(); let disparou = null;
  const q = [];
  for (let k = 0; k < 6; k++) q.push([k * FPS, corpo(0.2, 0.5)]);
  for (let k = 1; k <= 3; k++) q.push([(5 + k) * FPS, corpo(0.2, 0.5, p => { p[5] = [p[5][0], 0.56 - 0.05 * k]; })]);
  for (const [t, p] of q) if (g.ver(p, t) && disparou === null) disparou = t;
  assert.ok(disparou !== null);
  assert.ok(g.inicio() >= 5 * FPS - 1 && g.inicio() <= 6 * FPS + 1, 'início ' + g.inicio());   // o braço sai do lugar entre o quadro 5 e o 6
});
test('parear: cada pessoa continua no seu lugar mesmo quando a câmera perde uma ou troca a ordem', () => {
  const esq = corpo(0.15, 0.3), dir = corpo(0.15, 0.7);
  let pr = G.parear(null, [esq, dir]);
  assert.equal(pr.poses[0], esq); assert.equal(pr.poses[1], dir);
  pr = G.parear(pr, [dir]);                 // a da esquerda sumiu: a da direita NÃO vira a 1
  assert.equal(pr.poses[0], null); assert.equal(pr.poses[1], dir);
  pr = G.parear(pr, [dir, esq]);            // voltou, em outra ordem
  assert.equal(pr.poses[0], esq); assert.equal(pr.poses[1], dir);
  // e o gesto da pessoa 1 não dispara por causa da troca
  const g = G.criar(); let n = 0, cs = null;
  for (let k = 0; k < 12; k++) { const lista = k === 8 ? [dir] : (k % 2 ? [dir, esq] : [esq, dir]); const r = G.parear(cs, lista); cs = r; if (r.poses[0] && g.ver(r.poses[0], k * FPS)) n++; }
  assert.equal(n, 0);
});
