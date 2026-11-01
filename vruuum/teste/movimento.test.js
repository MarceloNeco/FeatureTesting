// Testes do celular como volante (acelerômetro): node --test vruuum/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const Mv = require('../movimento.js');
const G = 9.81, rad = d => d * Math.PI / 180;

// vetor "para cima" medido pelo aparelho (convenção da W3C: deitado na mesa dá z = +9,8)
// segurando em pé (retrato) e girando como volante θ graus para a direita
function emPe(theta) { return { x: -G * Math.sin(rad(theta)), y: G * Math.cos(rad(theta)), z: 0 }; }
// deitado (paisagem, topo do celular para a esquerda = ângulo 90), girando como volante
function deitado90(theta) { return { x: G * Math.cos(rad(theta)), y: G * Math.sin(rad(theta)), z: 0 }; }
// no colo, quase deitado, inclinando o lado direito para baixo
function noColo(theta) { return { x: -G * Math.sin(rad(theta)), y: G * 0.5, z: G * 0.85 }; }

function rodar(mv, f, ang, graus, t0 = 0) {
  mv.calibrar(); for (let i = 0; i < 30; i++) mv.ler(f(0), null, ang, t0 + i * 16); mv.fimCalibrar();
  for (let i = 0; i < 30; i++) mv.ler(f(graus), { x: 0, y: 0, z: 0 }, ang, t0 + 1000 + i * 16);
  return mv.direcao();
}

test('inclinar para a direita vira para a direita; para a esquerda, esquerda (em pé, deitado e no colo)', () => {
  for (const [f, ang] of [[emPe, 0], [deitado90, 90], [noColo, 0]]) {
    assert.ok(rodar(Mv.criar(), f, ang, 25) > 0.9, f.name + ' direita');
    assert.ok(rodar(Mv.criar(), f, ang, -25) < -0.9, f.name + ' esquerda');
    assert.equal(rodar(Mv.criar(), f, ang, 2), 0, f.name + ' tremidinha não vira');
  }
});

test('deitado com o topo para a direita (ângulo 270) também acerta o lado', () => {
  const f = t => { const v = deitado90(t); return { x: -v.x, y: -v.y, z: v.z }; };
  assert.ok(rodar(Mv.criar(), f, 270, 25) > 0.9);
  assert.ok(rodar(Mv.criar(), f, 270, -25) < -0.9);
});

test('aparelho com o vetor ao contrário (iPhone antigo): a calibração acerta o sinal', () => {
  const inv = t => { const v = emPe(t); return { x: -v.x, y: -v.y, z: -v.z }; };
  assert.ok(rodar(Mv.criar(), inv, 0, 25) > 0.9);
});

test('celular retinho não puxa para lado nenhum, mesmo se estava torto no 3-2-1 (bug da 0.3.0)', () => {
  for (const [f, ang] of [[emPe, 0], [deitado90, 90], [noColo, 0]]) {
    const mv = Mv.criar();
    mv.calibrar(); for (let i = 0; i < 30; i++) mv.ler(f(12), null, ang, i * 16); mv.fimCalibrar();   // ainda ajeitando nas mãos
    for (let i = 0; i < 30; i++) mv.ler(f(0), null, ang, 1000 + i * 16);                              // agora retinho
    assert.equal(mv.direcao(), 0, f.name);
  }
});

test('deitado na mesa, tela para cima, retinho: não vira', () => {
  const mv = Mv.criar();
  mv.calibrar(); for (let i = 0; i < 10; i++) mv.ler({ x: 0.3, y: 0.2, z: G }, null, 90, i * 16); mv.fimCalibrar();
  for (let i = 0; i < 30; i++) mv.ler({ x: 0.4, y: -0.3, z: G }, null, 90, 500 + i * 16);
  assert.equal(mv.direcao(), 0);
});

test('toquinho para cima pula; mexer devagar não; espera entre dois pulos', () => {
  const mv = Mv.criar();
  mv.calibrar(); mv.ler(emPe(0), null, 0, 0); mv.fimCalibrar();
  mv.ler(emPe(0), { x: 0.5, y: 3, z: 0.5 }, 0, 100);
  assert.equal(mv.pulou(), false);
  mv.ler(emPe(0), { x: 0, y: 14, z: 0 }, 0, 200);
  assert.equal(mv.pulou(), true);
  assert.equal(mv.pulou(), false, 'consome o pulo uma vez');
  mv.ler(emPe(0), { x: 0, y: -14, z: 0 }, 0, 300);
  assert.equal(mv.pulou(), false, 'o tranco de volta não pula de novo');
  mv.ler(emPe(0), { x: 0, y: 14, z: 0 }, 0, 1000);
  assert.equal(mv.pulou(), true);
});

test('sem a aceleração sem gravidade, o filtro ainda acha o tranco', () => {
  const mv = Mv.criar();
  mv.calibrar(); for (let i = 0; i < 20; i++) mv.ler(emPe(0), null, 0, i * 16); mv.fimCalibrar();
  for (let i = 0; i < 20; i++) mv.ler(emPe(0), null, 0, 400 + i * 16);
  assert.equal(mv.pulou(), false);
  mv.ler({ x: 0, y: G + 16, z: 0 }, null, 0, 900);
  assert.equal(mv.pulou(), true);
});
