// Testes do desenho: o SVG sai bem formado, com ids únicos por prefixo, para qualquer visual.
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pecas.js');
const V = require('../visual.js');
const B = require('../boneca.js');

// confere que as tags abrem e fecham direito (sem precisar de navegador)
function bemFormado(s) {
  const pilha = [], re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g; let m;
  while ((m = re.exec(s))) {
    if (m[1]) { const t = pilha.pop(); if (t !== m[2]) return 'fechou ' + m[2] + ' esperando ' + t; }
    else if (!m[4]) pilha.push(m[2]);
  }
  return pilha.length ? 'ficou aberto: ' + pilha.join(',') : '';
}

test('todas as opções de todas as categorias desenham', () => {
  for (const c of P.CATEGORIAS) for (const o of (c.opcoes || [{ id: null }])) {
    const e = o.id ? V.aplicar(V.novo(), c.id, o.id) : V.novo();
    const s = B.svg(e, { id: 't' });
    assert.equal(bemFormado(s), '', c.id + '/' + o.id);
    assert.ok(!/NaN|undefined/.test(s), c.id + '/' + o.id + ' com NaN ou undefined');
  }
});

test('surpresas desenham sem erro, com e sem animação', () => {
  for (let i = 1; i <= 120; i++) {
    const s = B.svg(V.surpresa(V.novo(), V.semente(i)), { id: 's' + i, anim: i % 2 === 0 });
    assert.equal(bemFormado(s), '', 'sorteio ' + i); assert.ok(!/NaN|undefined/.test(s), 'sorteio ' + i);
  }
});

test('ids com prefixo: dois desenhos na mesma página não se misturam', () => {
  const a = B.svg(V.novo(), { id: 'aa' }), b = B.svg(V.novo(), { id: 'bb' });
  const ids = s => [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids(a).every(i => i.startsWith('aa-')));
  assert.ok(ids(a).every(i => !ids(b).includes(i)));
});

test('miniatura (área), só cenário e foto (tamanho)', () => {
  assert.match(B.svg(V.novo(), { id: 'm', area: [96, 100, 208, 208] }), /viewBox="96 100 208 208"/);
  assert.match(B.svg(V.novo(), { id: 'f', largura: 800, altura: 1440 }), /width="800" height="1440"/);
  for (const o of P.categoria('cenario').opcoes) assert.equal(bemFormado(B.svg(V.aplicar(V.novo(), 'cenario', o.id), { id: 'c', soFundo: true })), '');
});

test('espelhar troca só o x', () => {
  assert.equal(B.espelhar('M100,50 L150,60 Q120,70 130,80Z'), 'M300,50 L250,60 Q280,70 270,80Z');
});

test('giro: frente, lado e costas desenham; de costas não tem rosto', () => {
  const e = Object.assign(V.novo(), { brincos: 'coracao', anel: 'pedra', pulseira: 'micangas', oculos: 'sol', vestido: 'fada' });
  for (let a = 0; a < 360; a += 15) {
    const s = B.svg(e, { id: 'g', angulo: a });
    assert.equal(bemFormado(s), '', 'ângulo ' + a); assert.ok(!/NaN|undefined/.test(s), 'ângulo ' + a);
  }
  const frente = B.svg(e, { id: 'f', angulo: 0 }), costas = B.svg(e, { id: 'c', angulo: 180 });
  assert.match(frente, /olhoE/); assert.ok(!/clip-path="url\(#c-olho/.test(costas), 'de costas sem olhos');
  assert.ok(!/translate\(200 0\) scale\(/.test(B.svg(e, { id: 'l', angulo: 90 })), 'de lado é o corpo de perfil, não o de frente apertado');
});

test('anel e pulseira: só a parte da frente (arco aberto, sem círculo inteiro)', () => {
  const e = Object.assign(V.novo(), { anel: 'simples', pulseira: 'simples' });
  const s = B.svg(e, { id: 'j' });
  assert.match(s, /A13\.5,4\.8 0 0 0/, 'pulseira em meio arco');
  assert.ok(!/<ellipse cx="120\.5" cy="487"/.test(s), 'pulseira sem elipse inteira');
});

test('perfil: de lado a cabeça vira de verdade (contorno do perfil) para os dois lados', () => {
  const e = Object.assign(V.novo(), { oculos: 'sol', brincos: 'perola', batom: 'gloss', cilios: 'arco' });
  for (const a of [70, 90, 95, 265, 270, 290]) { const s = B.svg(e, { id: 'p', angulo: a }); assert.equal(bemFormado(s), ''); assert.match(s, /p-rostoV/, 'cabeça girada em ' + a); }
  assert.match(B.svg(e, { id: 'p', angulo: 110 }), /p-rostoV/, 'passando de 100° a cabeça continua girando (sem pular para as costas)');
  assert.ok(!/p-rostoV/.test(B.svg(e, { id: 'p', angulo: 0 })), 'de frente é o desenho de frente');
});

test('giro contínuo: cada grau desenha diferente e com 0° fica igual ao de frente', () => {
  const e = Object.assign(V.novo(), { cabelo: 'ondasLongas', brincos: 'argola' });
  assert.notEqual(B.svg(e, { id: 'g', angulo: 10 }), B.svg(e, { id: 'g', angulo: 12 }), 'sem pular de 22,5 em 22,5');
  assert.equal(B.svg(e, { id: 'g', angulo: 360 }), B.svg(e, { id: 'g', angulo: 0 }));
  // olhos: os dois de frente; de lado, só o do lado de cá
  const olhos = (a) => (B.svg(e, { id: 'o', angulo: a, fundo: false }).match(/clip-path="url\(#o-olho[ED]\)"/g) || []).length;
  assert.equal(olhos(30), 2); assert.equal(olhos(90), 1); assert.equal(olhos(270), 1);
});

test('unhas pintadas nas mãos e nos pés descalços', () => {
  const e = Object.assign(V.novo(), { unhas: 'liso', unhasCor: 'vermelho', sapatos: 'nenhum' });
  const s = B.svg(e, { id: 'u' }), cor = P.cor('roupa', 'vermelho').hex;
  assert.ok(s.split('fill="' + cor + '"').length - 1 >= 20, 'esperava 10 unhas das mãos + 10 dos pés');
});

test('realce: palco com fundo desfocado e sombra; miniaturas e camadas da foto sem filtro', () => {
  const e = V.novo();
  const palco = B.svg(e, { id: 'p' });
  assert.match(palco, /filter="url\(#p-desf\)"/); assert.match(palco, /filter="url\(#p-somb\)"/);
  assert.ok(!/filter="url/.test(B.svg(e, { id: 'm', fundo: false, area: [86, 96, 228, 228] })), 'miniatura sem filtro');
  assert.ok(!/filter="url/.test(B.svg(e, { id: 'g', realce: false })), 'girando sem filtro');
});

test('olhos piscam no palco (anim) e não na foto', () => {
  const e = V.novo();
  assert.match(B.svg(e, { id: 'p', anim: true }), /<animate attributeName="opacity" values="0;0;1;1;0;0"/);
  assert.ok(!/values="0;0;1;1;0;0"/.test(B.svg(e, { id: 'p', anim: false })), 'foto com olhos abertos');
});

test('sem "barba": nada de sombra escura na parte de baixo do rosto', () => {
  for (const a of [0, 40, 80]) {
    const s = B.svg(V.novo(), { id: 'b', fundo: false, angulo: a });
    assert.ok(!/<ellipse cx="200" cy="2(8[0-9]|9[0-9])"[^>]*fill="#000"/.test(s), 'queixo sem sombra preta em ' + a);
    assert.ok(!/stop-color="#7a3040"/.test(s), 'sem sombra marrom no rosto girado');
  }
});

test('todos os formatos de rosto e nariz, menino e penteados novos desenham de frente e girando', () => {
  for (const rosto of ['oval', 'redondo', 'coracao', 'fininho', 'bochechudo']) for (const nariz of ['botao', 'arrebitado', 'fininho', 'redondinho', 'pequenino']) for (const a of [0, 60, 300]) {
    const s = B.svg(Object.assign(V.novo(), { rosto, nariz }), { id: 'f', angulo: a }); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s), rosto + nariz + a);
  }
  const m = V.aplicar(V.novo(), 'personagem', 'menino');
  for (const c of ['curtinho', 'topete', 'lisoPontas', 'lisoRepartido', 'chanelPontas', 'pontasFora', 'cachinhos', 'encaracolado', 'rabinhoCachos']) for (const a of [0, 45, 90, 180]) {
    const s = B.svg(Object.assign({}, m, { cabelo: c }), { id: 'c', angulo: a, anim: true }); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s), c + a);
  }
});

test('desfile: passarela de show, sorriso, tchau e olhar para os lados', () => {
  const pas = B.passarela('p'); assert.equal(bemFormado(pas), ''); assert.match(pas, /pas-holofote/); assert.match(pas, /pas-flash/);
  const e = Object.assign(V.novo(), { bolsa: 'mao', pulseira: 'perolas', anel: 'pedra' });
  for (const op of [{ sorriso: true }, { tchau: true, anim: true }, { olhar: -38, sorriso: true }, { olhar: 38, tchau: true }]) {
    const s = B.svg(e, Object.assign({ id: 'd', fundo: false }, op)); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s));
  }
  assert.match(B.svg(e, { id: 'd', tchau: true, anim: true }), /animateTransform/, 'a mão do tchau balança');
  const olhando = B.svg(e, { id: 'd', fundo: false, olhar: 38 });
  assert.match(olhando, /d-rostoV/, 'olhar vira a cabeça');
  assert.ok(!/translate\(200 0\) scale\(/.test(olhando), 'o corpo continua de frente');
});

test('de lado: corpo de perfil próprio (sem o corpo de frente apertado), para os dois lados e com todas as roupas', () => {
  const V0 = V.novo();
  for (const l of [{}, { vestido: 'princesa' }, { blusa: 'sueter', calca: 'shorts' }, { saia: 'longa', calca: 'nenhum' }, { sapatos: 'salto' }, { sapatos: 'botaCano' }, { sapatos: 'nenhum' }]) {
    for (const a of [60, 90, 120, 270]) {
      const s = B.svg(Object.assign({}, V0, l), { id: 'l', angulo: a }); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s), JSON.stringify(l) + a);
    }
  }
  assert.ok(!/translate\(200 0\) scale\(/.test(B.svg(V0, { id: 'l', angulo: 90 })), 'de lado não usa o corpo de frente apertado');
  assert.match(B.svg(V0, { id: 'l', angulo: 30 }), /translate\(200 0\) scale\(/, 'de três-quartos ainda é o corpo de frente');
});

test('volta completa sem pular: a cabeça é sempre a girada (de 1° a 359°) e a pele some aos poucos', () => {
  const e = Object.assign(V.novo(), { cabelo: 'ondasLongas', cabeca: 'tiara', laco: 'lado' });
  for (let a = 5; a < 360; a += 5) {
    const s = B.svg(e, { id: 'v', angulo: a }); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s), 'ângulo ' + a);
    assert.match(s, /v-peleR/, 'cabeça girada (sem trocar para outro desenho) em ' + a);
  }
  // área da pele do rosto (fórmula do laço): diminui de frente para costas, sem pular
  const larg = (a) => { const d = (B.svg(e, { id: 'w', angulo: a }).match(/id="w-peleR"><path d="([^"]+)"/) || [])[1]; const pts = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(m => [+m[1], +m[2]]); let ar = 0; pts.forEach((q, i) => { const r = pts[(i + 1) % pts.length]; ar += q[0] * r[1] - r[0] * q[1]; }); return Math.abs(ar) / 2; };
  let antes = larg(10);
  for (let a = 30; a <= 170; a += 20) { const l = larg(a); assert.ok(l <= antes + 50, 'pele não cresce de novo em ' + a); antes = l; }
  assert.ok(larg(180) < larg(10) * 0.02, 'de costas quase sem pele');
  assert.ok(!/<path d="M126,152 Q200,96 274,152"/.test(B.svg(e, { id: 't', angulo: 180 })), 'tiara não aparece de costas');
});

test('traços novos desenham de frente, girando e de costas', () => {
  const L = [{ formaOlho: 'amendoados', distOlhos: 'afastados', formaBoca: 'sorrisinho', nariz: 'batatinha', rosto: 'largo', cabelo: 'armado', oculos: 'retangular' },
    { formaOlho: 'caidos', distOlhos: 'juntos', formaBoca: 'cheinha', nariz: 'reto', rosto: 'quadradinho', cabelo: 'armadoLongo', oculos: 'gatinho' },
    { formaOlho: 'puxadinhos', formaBoca: 'larga', nariz: 'largo', rosto: 'comprido', oculos: 'aviador' }, { formaOlho: 'pequenos', formaBoca: 'fininha', oculos: 'meioAro' },
    { formaOlho: 'grandes', formaBoca: 'pequenininha', oculos: 'redondoGrande' }, { formaOlho: 'fininhos' }, { formaOlho: 'fininhosPuxados', oculos: 'retangular' }, { formaOlho: 'sorridentes', cilios: 'arco', sombra: 'simples' }, { oculos: 'quadrado' }, { oculos: 'oval' }, { oculos: 'fininho' }];
  for (const l of L) for (const a of [0, 40, 90, 140, 200, 300]) {
    const s = B.svg(Object.assign(V.novo(), l), { id: 'n', angulo: a, anim: true }); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s), JSON.stringify(l) + a);
  }
  // olhos afastados ficam mais longe um do outro (e a lente do óculos vai junto)
  const lente = (d) => (B.svg(Object.assign(V.novo(), { distOlhos: d, oculos: 'retangular' }), { id: 'o', fundo: false }).match(/translate\((-?\d+) 0\)/) || [0, '0'])[1];
  assert.equal(lente('afastados'), '-9'); assert.equal(lente('juntos'), '7');
});

test('testa: a linha do cabelo sobe ou desce, de frente e girando, e o cacheado solto desenha', () => {
  for (const testa of ['baixa', 'normal', 'alta', 'bemAlta']) for (const cabelo of ['cachosSoltos', 'franja', 'longo', 'coqueDuplo']) for (const a of [0, 60, 180]) {
    const s = B.svg(Object.assign(V.novo(), { testa, cabelo, cabeloCor: 'loiroEscuro', olhos: 'cinza' }), { id: 't', angulo: a }); assert.equal(bemFormado(s), ''); assert.ok(!/NaN|undefined/.test(s), testa + cabelo + a);
  }
  const franja = (t) => B.svg(Object.assign(V.novo(), { cabelo: 'franja', testa: t }), { id: 'f', fundo: false });
  assert.notEqual(franja('alta'), franja('normal')); assert.notEqual(franja('baixa'), franja('normal'));
});

test('testa alta: de lado a cabeça não fica careca (a linha do cabelo sobe só na testa, não nas têmporas nem até o cocuruto)', () => {
  const pts = (testa, a) => { const d = (B.svg(Object.assign(V.novo(), { testa, cabelo: 'rabinhoCachos' }), { id: 'k', angulo: a }).match(/id="k-peleR"><path d="([^"]+)"/) || [])[1]; return [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(m => [+m[1], +m[2]]); };
  for (const testa of ['normal', 'alta', 'bemAlta']) for (const a of [80, 90, 100, -90]) {
    const q = pts(testa, a), topo = Math.min(...q.map(v => v[1]));
    assert.ok(topo >= 112, testa + ' ' + a + '°: a pele chega no alto da cabeça (y ' + topo + ')');
    // na frente da orelha (costeleta), a linha do cabelo fica quase onde fica com a testa normal
    const perto = (v) => Math.min(...v.filter(t => Math.abs(t[0] - 200) < 14 && t[1] < 230).map(t => t[1]));
    assert.ok(perto(q) >= perto(pts('normal', a)) - 6, testa + ' ' + a + '°: a pele sobe na frente da orelha até y ' + perto(q));
  }
});

test('menina: queixo pequeno e maxilar suave em todos os formatos de rosto (menino continua igual)', () => {
  const P2 = require('../pecas.js');
  // largura do contorno de lado na altura do queixo (y ≈ 285): a menina fica para trás do menino
  const frente = (e) => { const d = (B.svg(e, { id: 'q', angulo: 90 }).match(/id="q-rostoV"><path d="([^"]+)"/) || [])[1]; let mx = 0; d.replace(/M([\d.]+),([\d.]+)a([\d.]+),([\d.]+)/g, (m, x, y, rx, ry) => { const cy = +y, top = cy - +ry, bot = cy + +ry; if (top < 282 && bot > 282) { const k = (282 - cy) / +ry; mx = Math.max(mx, +x + +rx + +rx * Math.sqrt(1 - k * k)); } }); return mx; };
  for (const rosto of P2.categoria('rosto').opcoes.map(o => o.id)) {
    const menina = frente(Object.assign(V.novo(), { rosto })), menino = frente(Object.assign(V.novo(), { rosto, personagem: 'menino' }));
    assert.ok(menina < menino, 'queixo da menina mais delicado: ' + rosto + ' ' + menina + ' x ' + menino);
  }
});

test('glitter brilha de verdade: lantejoulas e faíscas animadas na tela, paradas na foto', () => {
  for (const g of ['bochechas', 'olhos', 'cabelo', 'tudo']) for (const a of [0, 60]) {
    const e = Object.assign(V.novo(), { glitter: g, glitterCor: 'arco', batom: 'brilho' });
    const tela = B.svg(e, { id: 'g', anim: true, angulo: a }), foto = B.svg(e, { id: 'g', anim: false, angulo: a });
    assert.equal(bemFormado(tela), ''); assert.ok(!/NaN|undefined/.test(tela), g + a);
    if (a === 0 || g === 'bochechas') assert.ok((tela.match(/class="pp-fa"/g) || []).length >= 3, g + ' ' + a + ': faíscas animadas');
    assert.ok(!/pp-fa|pp-pi/.test(foto), g + ': na foto fica parado');
  }
  const boca = B.svg(Object.assign(V.novo(), { batom: 'brilho' }), { id: 'b', anim: true });
  assert.match(boca, /id="b-labG"/, 'o glitter da boca fica só dentro da boca');
});

test('patins: de frente as rodas ficam de pé e estreitas; de lado, redondas', () => {
  const e = Object.assign(V.novo(), { sapatos: 'patins', calca: 'nenhum' });
  const frente = B.svg(e, { id: 'p' }), lado = B.svg(e, { id: 'p', angulo: 90 });
  const rodas = [...frente.matchAll(/<rect x="[^"]*" y="651" width="9" height="16"/g)];
  assert.equal(rodas.length, 4, 'duas rodas da frente em cada pé, em pé');
  assert.ok(!/<circle cx="[^"]*" cy="661" r="6" fill="#ffd166"/.test(frente), 'sem roda redonda de frente');
  assert.ok((lado.match(/r="6.5" fill="#ffd166"/g) || []).length >= 2, 'de lado as rodas são redondas');
});
