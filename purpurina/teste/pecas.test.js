// Testes do catálogo e das regras da Purpurina: node --test purpurina/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../pecas.js');
const V = require('../visual.js');

test('catálogo: nomes em PT e EN, ids únicos, cores válidas', () => {
  const ids = new Set();
  for (const c of P.CATEGORIAS) {
    assert.ok(!ids.has(c.id), 'categoria repetida ' + c.id); ids.add(c.id);
    assert.ok(c.pt && c.en, 'categoria sem nome ' + c.id);
    assert.ok(P.GRUPOS.some(g => g.id === c.grupo), 'grupo desconhecido ' + c.grupo);
    assert.ok(c.opcoes || c.cores, 'categoria vazia ' + c.id);
    if (c.cores) assert.ok(P.CORES[c.cores], 'paleta desconhecida ' + c.cores);
    if (c.opcoes) {
      const ops = new Set();
      for (const o of c.opcoes) { assert.ok(o.pt && o.en, c.id + '/' + o.id + ' sem nome'); assert.ok(!ops.has(o.id), 'opção repetida ' + c.id + '/' + o.id); ops.add(o.id); }
      if (ops.has('nenhum')) assert.equal(c.opcoes[0].id, 'nenhum', '"nenhum" vem primeiro em ' + c.id);
    }
  }
  for (const k in P.CORES) for (const c of P.CORES[k]) { assert.match(c.hex, /^#[0-9a-f]{6}$/i, k + '/' + c.id); assert.ok(c.pt && c.en); }
});

test('padrão: toda categoria tem valor válido', () => {
  for (const c of P.CATEGORIAS) {
    if (c.opcoes) assert.ok(P.opcao(c.id, P.PADRAO[c.id]), 'padrão inválido ' + c.id);
    const k = c.opcoes ? c.id + 'Cor' : c.id;
    if (c.cores) assert.ok(P.CORES[c.cores].some(x => x.id === P.PADRAO[k]), 'cor padrão inválida ' + k);
  }
});

function vestida(e) { return e.vestido !== 'nenhum' || (e.blusa && (e.saia !== 'nenhum' || e.calca !== 'nenhum')); }

test('roupa sempre coerente: vestido esconde o resto, nunca sem roupa', () => {
  let e = V.novo();
  e = V.aplicar(e, 'vestido', 'princesa');
  assert.equal(V.visivel(e, 'blusa'), false); assert.equal(V.visivel(e, 'calca'), false);
  e = V.aplicar(e, 'saia', 'tutu');
  assert.equal(e.vestido, 'nenhum', 'escolher saia tira o vestido'); assert.equal(e.calca, 'nenhum', 'saia tira a calça (que não é legging)');
  e = V.aplicar(e, 'calca', 'legging'); assert.equal(e.saia, 'tutu', 'legging vai com saia');
  e = V.aplicar(e, 'calca', 'jeans'); assert.equal(e.saia, 'nenhum', 'calça tira a saia');
  e = V.aplicar(e, 'calca', 'nenhum'); assert.ok(vestida(e), 'tirar a calça sem saia põe uma saia');
  e = V.aplicar(e, 'saia', 'nenhum'); assert.ok(vestida(e), 'tirar a saia sem calça põe shorts');
});

test('cor numa peça em "nenhum" já coloca a peça; valores errados são ignorados', () => {
  let e = V.aplicar(V.novo(), 'batom', 'vermelho', true);
  assert.equal(e.batom, 'cremoso'); assert.equal(e.batomCor, 'vermelho');
  assert.deepEqual(V.aplicar(e, 'batom', 'nao-existe'), e);
  assert.deepEqual(V.aplicar(e, 'batom', 'azul-marciano', true), e);
});

test('surpresa: 500 sorteios sempre válidos e vestidos', () => {
  for (let i = 1; i <= 500; i++) {
    const e = V.surpresa(V.novo(), V.semente(i));
    assert.deepEqual(V.limpar(e), e, 'sorteio ' + i + ' com valor inválido');
    assert.ok(vestida(e), 'sorteio ' + i + ' sem roupa');
  }
});

test('limpar: look antigo ou mexido volta a ser válido', () => {
  assert.deepEqual(V.limpar(null), V.novo());
  const e = V.limpar({ batom: 'gloss', batomCor: 'xx', cabelo: 'moicano', vestido: 'nenhum', saia: 'nenhum', calca: 'nenhum' });
  assert.equal(e.batom, 'gloss'); assert.equal(e.batomCor, P.PADRAO.batomCor); assert.equal(e.cabelo, P.PADRAO.cabelo); assert.ok(vestida(e));
});

test('desfazer volta exatamente', () => {
  const h = new V.Historico(); let e = V.novo(); const antes = V.copiar(e);
  h.guardar(e); e = V.aplicar(e, 'cabelo', 'coque');
  assert.deepEqual(h.voltar(), antes); assert.equal(h.tem(), false);
});

test('desafios: 3 dicas, todas possíveis, e ninguém fica sem estrela', () => {
  for (const d of P.DESAFIOS) {
    assert.equal(d.dicas.length, 3, d.id);
    assert.ok(P.opcao('cenario', d.cenario), 'cenário do desafio ' + d.id);
    const base = V.novo();
    assert.ok(V.avaliar(base, d).estrelas >= 1, 'pelo menos 1 estrela');
    // procura, peça por peça, um visual que cumpre cada dica (prova que a dica é possível)
    d.dicas.forEach((dica, i) => {
      let achou = false;
      for (const c of P.CATEGORIAS) for (const o of (c.opcoes || [])) {
        if (achou) break;
        let e = V.aplicar(base, c.id, o.id);
        if (V.cumpre(e, dica.t)) achou = true;
        else if (c.cores) for (const cor of P.CORES[c.cores]) if (V.cumpre(V.aplicar(e, c.id, cor.id, true), dica.t)) { achou = true; break; }
      }
      if (!achou && dica.t.todos) { let e = base; for (const x of dica.t.todos) e = V.aplicar(e, x.c, P.categoria(x.c).opcoes[1].id); achou = V.cumpre(e, dica.t); }
      assert.ok(achou, d.id + ' dica ' + (i + 1) + ' impossível');
    });
  }
});

test('desafio praia completo dá 3 estrelas', () => {
  let e = V.novo();
  e = V.aplicar(e, 'vestido', 'verao'); e = V.aplicar(e, 'oculos', 'sol'); e = V.aplicar(e, 'sapatos', 'sandalia');
  assert.equal(V.avaliar(e, 'praia').estrelas, 3);
});

test('resumo para leitor de tela em PT e EN', () => {
  const e = V.aplicar(V.novo(), 'batom', 'gloss');
  assert.match(V.resumo(e, 'pt'), /^Seu visual: .*gloss/);
  assert.match(V.resumo(e, 'en'), /^Your look: /);
});

test('toda parte que dá para tirar tem a opção 🚫 (nenhum), menos as do corpo (pele, rosto, nariz, olhos, cabelo…) e cenário', () => {
  for (const c of P.CATEGORIAS) {
    if (['personagem', 'pele', 'rosto', 'nariz', 'olhos', 'cabelo', 'cenario'].includes(c.id)) continue;
    const ids = c.opcoes.map(o => o.id);
    assert.ok(ids[0] === 'nenhum' || (c.id === 'estampa' && ids[0] === 'liso'), c.id + ' sem 🚫');
  }
});

test('sem blusa e sem sapato continua válido e vestido', () => {
  let e = V.aplicar(V.novo(), 'blusa', 'nenhum'); e = V.aplicar(e, 'sapatos', 'nenhum');
  assert.deepEqual(V.limpar(e), e); assert.ok(vestida(e));
});

test('menina ou menino, rosto e nariz: escolhas novas da personagem', () => {
  const e = V.novo();
  assert.equal(e.personagem, 'menina'); assert.equal(e.rosto, 'oval'); assert.equal(e.nariz, 'botao');
  const m = V.aplicar(Object.assign(V.novo(), { vestido: 'princesa', batom: 'gloss' }), 'personagem', 'menino');
  assert.equal(m.cabelo, 'curtinho'); assert.equal(m.vestido, 'nenhum'); assert.equal(m.batom, 'nenhum'); assert.ok(m.calca !== 'nenhum', 'menino com calça');
  assert.equal(V.aplicar(m, 'personagem', 'menina').cabelo, P.PADRAO.cabelo);
  for (let i = 0; i < 20; i++) { const s = V.surpresa(m, Math.random); assert.equal(s.personagem, 'menino'); assert.equal(s.vestido, 'nenhum'); assert.equal(s.batom, 'nenhum'); }
  assert.ok(P.categoria('cabelo').opcoes.length >= 39, 'muitos penteados');
});
