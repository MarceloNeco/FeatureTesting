/* Purpurina — regras do visual (sem tela, testadas no Node):
   - estado = um objeto simples { pele, cabelo, cabeloCor, …, cenario } (ver PADRAO em pecas.js);
   - aplicar() troca uma peça ou uma cor e mantém a roupa coerente (vestido tira blusa, saia e calça
     da frente; nunca fica sem roupa);
   - surpresa() sorteia um visual que combina; avaliar() confere as dicas de um desafio;
   - limpar() conserta um look guardado antigo (peça que não existe mais volta para o padrão).
   Nada aqui guarda no aparelho: isso é do app.js. */
(function (raiz) {
  'use strict';
  var P = raiz.PurpurinaPecas || (typeof require === 'function' ? require('./pecas.js') : null);
  var ROUPAS = ['vestido', 'blusa', 'saia', 'calca'];

  function copiar(e) { var n = {}; for (var k in e) if (Object.prototype.hasOwnProperty.call(e, k)) n[k] = e[k]; return n; }
  function novo() { return copiar(P.PADRAO); }
  function temOpcao(cat, v) { return !!(cat.opcoes && cat.opcoes.some(function (x) { return x.id === v; })); }
  function temCor(cat, v) { return !!(cat.cores && P.CORES[cat.cores].some(function (x) { return x.id === v; })); }
  function chaveCor(cat) { return cat.opcoes ? cat.id + 'Cor' : cat.id; }

  // roupa sempre coerente: com vestido, o resto fica guardado mas escondido; sem vestido, tem blusa e
  // alguma parte de baixo. Legging pode ir junto com saia; as outras calças não.
  function arrumar(e, mudou) {
    if (e.vestido !== 'nenhum') return e;
    if (mudou === 'saia' && e.saia !== 'nenhum' && e.calca !== 'legging') e.calca = 'nenhum';
    if (mudou === 'calca' && e.calca !== 'nenhum' && e.calca !== 'legging') e.saia = 'nenhum';
    if (e.saia === 'nenhum' && e.calca === 'nenhum') { if (mudou === 'calca') e.saia = 'curta'; else e.calca = 'shorts'; }
    if (e.saia !== 'nenhum' && e.calca !== 'nenhum' && e.calca !== 'legging') e.calca = 'nenhum';
    return e;
  }

  /* aplicar(estado, 'batom', 'gloss') troca o estilo; aplicar(estado, 'batom', 'vermelho', true) troca a cor.
     Escolher cor numa peça que está em "nenhum" já coloca o primeiro estilo (a criança vê a cor na hora). */
  function aplicar(e0, catId, valor, ehCor) {
    var cat = P.categoria(catId), e = copiar(e0);
    if (!cat) return e;
    if (ehCor) {
      if (!temCor(cat, valor)) return e;
      e[chaveCor(cat)] = valor;
      if (cat.opcoes && e[cat.id] === 'nenhum') e[cat.id] = cat.opcoes[1] ? cat.opcoes[1].id : cat.opcoes[0].id;
    } else {
      if (!temOpcao(cat, valor)) return e;
      e[cat.id] = valor;
    }
    // mexer em blusa, saia ou calça tira o vestido; a estampa vai para a peça que está aparecendo
    if (catId === 'blusa' || catId === 'saia' || catId === 'calca') e.vestido = 'nenhum';
    return arrumar(e, catId);
  }

  // a categoria aparece no desenho?
  function visivel(e, catId) {
    if (e[catId] === 'nenhum') return false;
    if ((catId === 'blusa' || catId === 'saia' || catId === 'calca') && e.vestido !== 'nenhum') return false;
    return true;
  }

  // conserta qualquer coisa vinda de fora (look guardado de versão antiga, arquivo mexido)
  function limpar(x) {
    var e = novo();
    if (!x || typeof x !== 'object') return e;
    P.CATEGORIAS.forEach(function (cat) {
      if (cat.opcoes && temOpcao(cat, x[cat.id])) e[cat.id] = x[cat.id];
      if (cat.cores && temCor(cat, x[chaveCor(cat)])) e[chaveCor(cat)] = x[chaveCor(cat)];
    });
    if (e.vestido === 'nenhum') { if (e.saia === 'nenhum' && e.calca === 'nenhum') e.calca = 'shorts'; arrumar(e, 'saia'); }
    return e;
  }

  // ---------- sorteio ----------
  function semente(n) { var s = (n >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function um(l, r) { return l[Math.floor(r() * l.length)]; }
  function ids(cat, semNenhum) { return cat.opcoes.map(function (x) { return x.id; }).filter(function (id) { return !semNenhum || id !== 'nenhum'; }); }
  function cores(cat) { return P.CORES[cat.cores].map(function (x) { return x.id; }); }

  /* Surpresa: sorteia tudo, mas com bom senso — pele, cabelo e olhos ficam (é a personagem dela),
     roupa e maquiagem combinando, acessório às vezes sim, às vezes não. Cenário fica. */
  function surpresa(e0, r) {
    r = r || Math.random;
    var e = copiar(e0);
    var paleta = cores(P.categoria('vestido'));
    // escolhe 2 ou 3 cores do dia, para a roupa combinar
    var doDia = [um(paleta, r), um(paleta, r), um(paleta, r)];
    function corDoDia() { return r() < 0.8 ? um(doDia, r) : um(paleta, r); }
    var vest = P.categoria('vestido');
    if (r() < 0.45) { e.vestido = um(ids(vest, true), r); e.vestidoCor = corDoDia(); }
    else {
      e.vestido = 'nenhum';
      e.blusa = um(ids(P.categoria('blusa'), true), r); e.blusaCor = corDoDia();
      if (r() < 0.5) { e.saia = um(ids(P.categoria('saia'), true), r); e.calca = r() < 0.3 ? 'legging' : 'nenhum'; }
      else { e.saia = 'nenhum'; e.calca = um(ids(P.categoria('calca'), true), r); }
      e.saiaCor = corDoDia(); e.calcaCor = corDoDia();
    }
    e.estampa = r() < 0.5 ? 'liso' : um(ids(P.categoria('estampa'), true), r); e.estampaCor = corDoDia();
    e.sapatos = um(ids(P.categoria('sapatos'), true), r); e.sapatosCor = corDoDia();
    ['blush', 'sombra', 'delineado', 'batom', 'cilios'].forEach(function (id) {
      var cat = P.categoria(id); e[id] = r() < 0.8 ? um(ids(cat, true), r) : (temOpcao(cat, 'nenhum') ? 'nenhum' : cat.opcoes[0].id); e[id + 'Cor'] = um(cores(cat), r);
    });
    e.base = r() < 0.6 ? um(ids(P.categoria('base'), true), r) : 'nenhum';
    e.glitter = r() < 0.45 ? um(ids(P.categoria('glitter'), true), r) : 'nenhum'; e.glitterCor = um(cores(P.categoria('glitter')), r);
    e.adesivo = r() < 0.4 ? um(ids(P.categoria('adesivo'), true), r) : 'nenhum';
    ['cabeca', 'laco', 'brincos', 'colar', 'oculos', 'bolsa'].forEach(function (id) {
      var cat = P.categoria(id); e[id] = r() < 0.45 ? um(ids(cat, true), r) : 'nenhum'; e[id + 'Cor'] = r() < 0.5 ? um(['dourado', 'prata'], r) : corDoDia();
    });
    if (e.cabeca === 'chapeu' || e.cabeca === 'gorro') e.laco = 'nenhum';
    return arrumar(e, 'saia');
  }

  // ---------- desafios ----------
  function tags(e, catId) { var op = P.opcao(catId, e[catId]); return op ? op.tags : []; }
  function cumpre(e, t) {
    if (t.qualquer) return t.qualquer.some(function (x) { return cumpre(e, x); });
    if (t.todos) return t.todos.every(function (x) { return cumpre(e, x); });
    if (t.roupa) {
      return ROUPAS.some(function (id) {
        if (!visivel(e, id)) return false;
        if (t.tag) return tags(e, id).indexOf(t.tag) >= 0;
        if (t.fam) { var c = P.cor('roupa', e[id + 'Cor']); return !!c && c.fam.some(function (f) { return t.fam.indexOf(f) >= 0; }); }
        return true;
      });
    }
    if (t.c) {
      if (!visivel(e, t.c) && t.c !== 'cilios' && t.c !== 'estampa') return false;
      if (t.v) return t.v.indexOf(e[t.c]) >= 0;
      if (t.tag) return tags(e, t.c).indexOf(t.tag) >= 0;
      if (t.algum) return e[t.c] !== 'nenhum';
    }
    return false;
  }
  function desafio(id) { for (var i = 0; i < P.DESAFIOS.length; i++) if (P.DESAFIOS[i].id === id) return P.DESAFIOS[i]; return null; }
  // ninguém perde: sempre pelo menos 1 estrela
  function avaliar(e, d) {
    if (typeof d === 'string') d = desafio(d);
    var ok = d.dicas.map(function (x) { return cumpre(e, x.t); });
    var n = ok.filter(Boolean).length;
    return { dicas: ok, cumpridas: n, estrelas: Math.max(1, n) };
  }

  // ---------- desfazer ----------
  function Historico(max) { this.max = max || 60; this.pilha = []; }
  Historico.prototype.guardar = function (e) { this.pilha.push(copiar(e)); if (this.pilha.length > this.max) this.pilha.shift(); };
  Historico.prototype.voltar = function () { return this.pilha.length ? this.pilha.pop() : null; };
  Historico.prototype.tem = function () { return this.pilha.length > 0; };
  Historico.prototype.limpar = function () { this.pilha = []; };

  // diferenças entre dois estados (para dizer em voz o que mudou e para testes)
  function iguais(a, b) { for (var k in P.PADRAO) if (a[k] !== b[k]) return false; return true; }

  // frase curta do visual, para leitor de tela (aria-label do desenho)
  function resumo(e, lingua) {
    var L = lingua === 'en' ? 'en' : 'pt', partes = [];
    ['vestido', 'blusa', 'saia', 'calca', 'sapatos', 'cabeca', 'laco', 'oculos', 'colar', 'brincos', 'bolsa', 'batom', 'sombra', 'glitter', 'adesivo'].forEach(function (id) {
      if (!visivel(e, id)) return;
      var op = P.opcao(id, e[id]), cat = P.categoria(id), c = cat.cores ? P.cor(cat.cores, e[id + 'Cor']) : null;
      if (op) partes.push((op[L] + (c && id !== 'glitter' ? ' ' + c[L].toLowerCase() : '')).toLowerCase());
    });
    var cen = P.opcao('cenario', e.cenario);
    return (L === 'en' ? 'Your look: ' : 'Seu visual: ') + partes.join(', ') + (cen ? (L === 'en' ? '. Scene: ' : '. Cenário: ') + cen[L].toLowerCase() : '') + '.';
  }

  var API = { novo: novo, aplicar: aplicar, visivel: visivel, limpar: limpar, surpresa: surpresa, semente: semente,
    cumpre: cumpre, avaliar: avaliar, desafio: desafio, Historico: Historico, iguais: iguais, resumo: resumo, copiar: copiar };
  raiz.PurpurinaVisual = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
