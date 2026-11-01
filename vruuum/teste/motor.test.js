// Testes do motor do Vruuum!: node --test vruuum/teste/
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pista.js');
const M = require('../motor.js');

function correr(e, entradas, segundos, dt = 1 / 60) {
  const eventos = [];
  for (let t = 0; t < segundos && e.fase !== 'fim'; t += dt) { M.atualizar(e, entradas, dt); eventos.push(...e.eventos); }
  return eventos;
}

test('mesma semente, mesma pista; semente diferente, pista diferente', () => {
  const a = P.montar('normal', 42), b = P.montar('normal', 42), c = P.montar('normal', 7);
  assert.equal(a.segs.length, b.segs.length);
  assert.deepEqual(a.mundos, b.mundos);
  assert.equal(JSON.stringify(a.segs.slice(0, 600).map(s => [s.curva, s.p2.y])), JSON.stringify(b.segs.slice(0, 600).map(s => [s.curva, s.p2.y])));
  assert.notEqual(JSON.stringify(a.segs.slice(0, 600).map(s => s.curva)), JSON.stringify(c.segs.slice(0, 600).map(s => s.curva)));
});

test('pista: 4 mundos diferentes, chegada antes do fim, pedaços encaixados', () => {
  for (const nivel of ['crianca', 'normal', 'turbo']) {
    const p = P.montar(nivel, 123);
    assert.equal(p.mundos.length, 4);
    assert.equal(new Set(p.mundos).size, 4);
    assert.ok(p.chegada > P.NIVEIS[nivel].pedacos - 200 && p.chegada < p.segs.length - 300, nivel);
    for (let i = 1; i < p.segs.length; i++) assert.equal(p.segs[i].p1.y, p.segs[i - 1].p2.y);
    assert.ok(p.segs[p.chegada].enfeites.some(e => e.tipo === 'chegada'));
    assert.ok(p.segs.some(s => s.coisas.some(c => c.tipo === 'estrela')));
  }
});

test('nenhuma fileira fecha as 3 faixas', () => {
  for (let semente = 1; semente < 30; semente++) {
    const p = P.montar('turbo', semente);
    for (const s of p.segs) {
      const bloqueio = s.coisas.filter(c => c.tipo === 'cone' || c.tipo === 'lama');
      assert.ok(new Set(bloqueio.map(c => c.x)).size < 3, 'semente ' + semente + ' pedaço ' + s.i);
    }
  }
});

test('contagem 3-2-1 e depois o carro acelera sozinho', () => {
  const e = M.novaCorrida('crianca', 5, 1);
  const ev = correr(e, [{}], 3.05);
  assert.deepEqual(ev.filter(x => x.tipo === 'bip').map(x => x.n), [2, 1]);
  assert.ok(ev.some(x => x.tipo === 'vai'));
  assert.ok(e.jogadores[0].vel < 300);
  correr(e, [{}], 3);
  assert.ok(e.jogadores[0].vel > e.pista.cfg.velMax * 0.9);
});

test('pega a estrela que está na sua faixa e só uma vez', () => {
  const e = M.novaCorrida('crianca', 5, 1);
  e.fase = 'corrida';
  const j = e.jogadores[0];
  const s = e.pista.segs[40];
  s.coisas.push({ tipo: 'estrela', x: 0, alt: P.ALT_CHAO, pego: [false, false] });
  j.z = 39 * P.SEG; j.vel = 5000;
  correr(e, [{}], 0.5);
  assert.equal(j.estrelas, 1);
  j.z = 39 * P.SEG;
  correr(e, [{}], 0.5);
  assert.equal(j.estrelas, 1);
});

test('estrela do ar só vem com o pulo da rampa', () => {
  const e = M.novaCorrida('normal', 5, 1);
  e.fase = 'corrida';
  const j = e.jogadores[0];
  e.pista.segs[40].coisas.push({ tipo: 'rampa', x: 0, alt: 0, pego: [false, false] });
  e.pista.segs[44].coisas.push({ tipo: 'estrela', x: 0, alt: P.ALT_AR, pego: [false, false] });
  e.pista.segs[130].coisas.push({ tipo: 'estrela', x: 0, alt: P.ALT_AR, pego: [false, false] });
  j.z = 39 * P.SEG; j.vel = 6000;
  const ev = correr(e, [{}], 1.5);
  assert.ok(ev.some(x => x.tipo === 'pulo'));
  assert.equal(j.estrelas, 1, 'pega a do pedaço 44 no ar, não a do 130 (já no chão)');
});

test('bater num carro: fica lento, rodopia, perde estrelas; Criança perde no máximo 1', () => {
  for (const [nivel, perde] of [['crianca', 1], ['normal', 3]]) {
    const e = M.novaCorrida(nivel, 5, 1);
    e.fase = 'corrida';
    const j = e.jogadores[0];
    j.estrelas = 10; j.z = 50 * P.SEG; j.vel = e.pista.cfg.velMax;
    e.carros = [{ z: 52 * P.SEG, x: 0, vel: 2000, tipo: 'carro0' }];
    const ev = correr(e, [{}], 0.4);
    assert.ok(ev.some(x => x.tipo === 'batida'), nivel);
    assert.equal(j.estrelas, 10 - perde, nivel);
    assert.ok(j.rodando > 0);
  }
});

test('turbo deixa o carro mais rápido que o normal', () => {
  const e = M.novaCorrida('normal', 5, 1);
  e.fase = 'corrida';
  const j = e.jogadores[0];
  e.carros = [];
  j.z = 39 * P.SEG; j.vel = e.pista.cfg.velMax;
  e.pista.segs[41].coisas.push({ tipo: 'turbo', x: 0, alt: 0, pego: [false, false] });
  correr(e, [{}], 1.2);
  assert.ok(j.vel > e.pista.cfg.velMax * 1.2);
});

test('fora da estrada o carro fica mais lento', () => {
  const e = M.novaCorrida('normal', 5, 1);
  e.fase = 'corrida'; e.carros = [];
  const j = e.jogadores[0];
  j.vel = e.pista.cfg.velMax; j.x = 1.5;
  correr(e, [{ dir: 1 }], 1);
  assert.ok(j.vel < e.pista.cfg.velMax * 0.6);
});

test('dois jogadores: cada um pega a própria estrela', () => {
  const e = M.novaCorrida('crianca', 5, 2);
  e.fase = 'corrida'; e.carros = [];
  const [a, b] = e.jogadores;
  const est = { tipo: 'estrela', x: 0, alt: P.ALT_CHAO, pego: [false, false] };
  e.pista.segs[60].coisas.push(est);
  a.z = 59 * P.SEG; a.x = 0; a.vel = 5000;
  b.z = 45 * P.SEG; b.x = 0; b.vel = 5000;
  correr(e, [{}, {}], 1.2);
  assert.equal(a.estrelas, 1);
  assert.equal(b.estrelas, 1);
});

test('corrida inteira termina: todos chegam e vem a tela do fim', () => {
  const e = M.novaCorrida('crianca', 9, 2);
  const ev = correr(e, [{}, { freio: false }], 400, 1 / 30);
  assert.equal(e.fase, 'fim');
  const chegadas = ev.filter(x => x.tipo === 'chegou');
  assert.equal(chegadas.length, 2);
  assert.deepEqual(chegadas.map(c => c.lugar).sort(), [1, 2]);
  assert.ok(e.jogadores.every(j => j.tempo > 60 && j.tempo < 200), 'tempo ' + e.jogadores.map(j => j.tempo));
});

test('botão PULAR: pula por cima do cone, e só pula de novo depois da recarga', () => {
  const e = M.novaCorrida('normal', 5, 1);
  e.fase = 'corrida'; e.carros = [];
  const j = e.jogadores[0];
  j.estrelas = 5; j.z = 39 * P.SEG; j.vel = 6000;
  e.pista.segs[45].coisas.push({ tipo: 'cone', x: 0, alt: 0, pego: [false, false] });
  M.atualizar(e, [{ pular: true }], 1 / 60);
  assert.ok(e.eventos.some(x => x.tipo === 'pulo' && x.manual));
  assert.ok(j.pulo > 0);
  M.atualizar(e, [{ pular: true }], 1 / 60);
  assert.ok(!e.eventos.some(x => x.tipo === 'pulo'), 'não pula de novo no ar');
  const ev = correr(e, [{}], 0.5);
  assert.ok(!ev.some(x => x.tipo === 'cone'), 'passou por cima do cone');
  correr(e, [{}], 1);
  M.atualizar(e, [{ pular: true }], 1 / 60);
  assert.ok(e.eventos.some(x => x.tipo === 'pulo'), 'depois da recarga pula de novo');
});

test('jeito do veículo: mais rápido corre mais, curva melhor vira mais (na reta da largada)', () => {
  function rodar(mod, ent, seg) {
    const e = M.novaCorrida('normal', 5, 1);
    e.fase = 'corrida'; e.carros = []; e.jogadores[0].mod = mod;
    for (let k = 0; k < seg * 60; k++) M.atualizar(e, [ent], 1 / 60);
    return e.jogadores[0];
  }
  assert.ok(rodar({ vel: 1.1, curva: 1 }, {}, 3).vel > rodar({ vel: 1, curva: 1 }, {}, 3).vel);
  assert.ok(rodar({ vel: 1, curva: 1.12 }, { dir: 1 }, 0.3).x > rodar({ vel: 1, curva: 1 }, { dir: 1 }, 0.3).x);
});

test('túneis: alguns por corrida, sem encostar em portal, largada ou chegada', () => {
  for (const [nivel, n] of [['crianca', 2], ['normal', 3], ['turbo', 4]]) {
    for (let semente = 1; semente < 8; semente++) {
      const p = P.montar(nivel, semente * 31);
      assert.ok(p.tuneis.length >= 1 && p.tuneis.length <= n, nivel + ' ' + p.tuneis.length);
      const quarto = p.chegada / 4;
      for (const [a, b] of p.tuneis) {
        assert.ok(a > 200 && b < p.chegada - 100, 'longe da largada e da chegada');
        for (let q = 1; q < 4; q++) assert.ok(Math.round(quarto * q) < a - 30 || Math.round(quarto * q) > b + 30, 'longe do portal');
        assert.ok(p.segs[a].entrada && p.segs[a].tunel && !p.segs[b].tunel);
        for (let i = a; i < b; i++) assert.equal(p.segs[i].enfeites.length, 0, 'sem árvore dentro do túnel');
      }
    }
  }
});

test('dentro do túnel o carro não atravessa a parede', () => {
  const e = M.novaCorrida('normal', 5, 1);
  e.fase = 'corrida'; e.carros = [];
  const [a] = e.pista.tuneis[0], j = e.jogadores[0];
  j.z = (a + 5) * P.SEG; j.x = 0; j.vel = 3000;
  for (let k = 0; k < 120; k++) M.atualizar(e, [{ dir: -1 }], 1 / 60);
  assert.ok(j.x >= -1.1, 'x ' + j.x);
});

test('pontos: estrela soma, batida tira (nunca abaixo de zero), checkpoint dá bônus por rapidez', () => {
  const e = M.novaCorrida('normal', 5, 1);
  e.fase = 'corrida'; e.carros = [];
  const j = e.jogadores[0];
  e.pista.segs[40].coisas.push({ tipo: 'estrela', x: 0, alt: P.ALT_CHAO, pego: [false, false] });
  j.z = 39 * P.SEG; j.vel = 5000;
  correr(e, [{}], 0.3);
  assert.equal(j.pontos, M.PONTOS.estrela);
  e.carros = [{ z: j.z + 1.5 * P.SEG, x: j.x, vel: 1000, tipo: 'carro0' }];
  j.vel = e.pista.cfg.velMax;
  correr(e, [{}], 0.3);
  assert.equal(j.pontos, 0, 'batida tira 150, mas não fica negativo');
  // checkpoint: atravessa o primeiro portal rápido e devagar
  function checkpoint(segundos) {
    const f = M.novaCorrida('normal', 5, 1); f.fase = 'corrida'; f.carros = [];
    const q = Math.round(f.pista.chegada / 4), g = f.jogadores[0];
    f.t = segundos; g.z = (q - 1) * P.SEG; g.vel = 6000;
    const ev = correr(f, [{}], 0.2);
    return ev.find(x => x.tipo === 'checkpoint');
  }
  const rapido = checkpoint(30), devagar = checkpoint(400);
  assert.ok(rapido && devagar);
  assert.ok(rapido.bonus > 0 && devagar.bonus === 0, rapido.bonus + ' / ' + devagar.bonus);
});

test('rivais: correm junto, desviam, contam na posição e na chegada', () => {
  const cfgs = [{ id: 'saci', veic: 'kart', mod: { vel: 1 } }, { id: 'emilia', veic: 'gt', mod: { vel: 1 } }, { id: 'noel', veic: 'super', mod: { vel: 1 } }];
  const e = M.novaCorrida('crianca', 9, 1, cfgs);
  assert.equal(e.rivais.length, 3);
  const ev = correr(e, [{}], 400, 1 / 30);
  assert.equal(e.fase, 'fim');
  assert.ok(e.rivais.every(r => r.z > e.pista.zChegada * 0.8), 'rivais andaram até perto do fim');
  const chegada = ev.find(x => x.tipo === 'chegou');
  assert.ok(chegada.lugar >= 1 && chegada.lugar <= 4);
  assert.equal(e.total, 4);
  assert.ok(e.jogadores[0].lugar >= 1 && e.jogadores[0].lugar <= 4);
  // ficam por perto: nenhum rival terminou mais de 40 s longe do jogador
  for (const r of e.rivais) if (r.chegou) assert.ok(Math.abs(r.tempo - e.jogadores[0].tempo) < 40, 'rival longe demais');
});

test('rival desvia do cone na faixa dele (quase sempre)', () => {
  let desviou = 0;
  for (let k = 0; k < 20; k++) {
    const e = M.novaCorrida('normal', 5, 1, [{ id: 'saci', veic: 'kart', mod: {} }]);
    e.fase = 'corrida'; e.carros = [];
    const rv = e.rivais[0]; rv.z = 30 * P.SEG; rv.x = rv.faixa = 0; rv.vel = 5000;
    e.jogadores[0].z = 30 * P.SEG;
    for (let i = 36; i < 44; i++) e.pista.segs[i].coisas = [];
    e.pista.segs[40].coisas.push({ tipo: 'cone', x: 0, alt: 0, pego: [false, false] });
    correr(e, [{}], 1.2);
    if (Math.abs(rv.x) > 0.3 || rv.lento <= 0) desviou++;
  }
  assert.ok(desviou >= 12, 'desviou ' + desviou + ' de 20');
});
