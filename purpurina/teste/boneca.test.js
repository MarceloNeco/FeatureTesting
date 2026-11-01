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
  assert.match(B.svg(e, { id: 'l', angulo: 90 }), /scale\(0\.62 1\)/, 'de lado o corpo só estreita um pouco');
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
  assert.ok(!/p-rostoV/.test(B.svg(e, { id: 'p', angulo: 110 })), 'passando de 100° a cabeça fica de costas');
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
