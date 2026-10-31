/* Peluqueria — motor do jogo (puro: sem DOM, sem canvas; roda no navegador e nos testes do Node).
   Coordenadas em fração da imagem do cenário (0..1 na largura e na altura); a distância é medida em
   fração do LADO MENOR da imagem. O tempo é passado por quem chama (avancar(estado, dt em segundos)).
   Uma rodada tem 10 quedas; cada queda é um par (cenário, item) e o item tem de parar no lugar do
   seu tipo (cabeca | olhos | nariz | boca) naquele cenário. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Peluqueria = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var NIVEIS = {
    crianca: { vel: 0.22, amp: 0, per: 0, desloc: 0, giro: false, tol: 1.5 },
    normal: { vel: 0.32, amp: 0.08, per: 2.2, desloc: 0, giro: false, tol: 1.0 },
    maluco: { vel: 0.42, amp: 0.15, per: 1.6, desloc: 0, giro: true, tol: 0.8 }
  };
  var GIRO = { amp: 40, per: 4 / 3 };          // ≈ 120 °/s em média
  var LIMITES = { PERFEITO: 0.03, BOM: 0.08, QUASE: 0.15 };
  var BASE = { PERFEITO: 100, BOM: 60, QUASE: 30, LONGE: 0 };
  var ORDEM = ['PERFEITO', 'BOM', 'QUASE', 'LONGE'];
  var MULTS = [1, 1.5, 2, 2.5, 3];
  var QUEDAS = 10, TOPO = -0.25, FUNDO = 1.25, ACELERA = 0.05, GIRO_LIMITE = 25;
  var LUGARES = ['cabeca', 'olhos', 'nariz', 'boca'];

  /* mulberry32: sorteio repetível pela semente */
  function aleatorio(semente) {
    var a = (semente >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sortear(cenarios, itens, n, rnd) {
    var pares = [];
    cenarios.forEach(function (c) { itens.forEach(function (it) { if (c.lugares && c.lugares[it.lugar]) pares.push({ cenario: c, item: it, lugar: it.lugar }); }); });
    if (!pares.length) return [];
    var lista = [], ant = null;
    for (var k = 0; k < n; k++) {
      var cand = pares;
      if (ant) {
        // prefere mudar cenário E item; se não der, ao menos o item; depois ao menos o cenário
        var filtros = [
          function (p) { return p.cenario !== ant.cenario && p.item !== ant.item; },
          function (p) { return p.item !== ant.item; },
          function (p) { return p.cenario !== ant.cenario; }
        ];
        for (var f = 0; f < filtros.length; f++) { var c2 = pares.filter(filtros[f]); if (c2.length) { cand = c2; break; } }
      }
      ant = cand[Math.floor(rnd() * cand.length) % cand.length];
      lista.push({ cenario: ant.cenario, item: ant.item, lugar: ant.lugar });
    }
    return lista;
  }

  /* O balanço e o giro são SINCRONIZADOS com a queda: no instante em que o item chega na altura do lugar
     certo (tAlvo), ele passa exatamente pelo meio do alvo e reto. Acertar depende só de tocar na hora certa;
     o zigue-zague é enfeite e desafio de leitura. O lado para onde ele balança é sorteado (queda.d). */
  function posicao(queda, nivel, i, t) {
    var n = NIVEIS[nivel], L = queda.cenario.lugares[queda.lugar];
    var vel = n.vel * (1 + ACELERA * i), y = TOPO + vel * t, tAlvo = (L.y - TOPO) / vel;
    var lado = (queda.d || 0) < 0 ? -1 : 1, x = L.x;
    if (n.amp) x = L.x + lado * n.amp * Math.sin(2 * Math.PI * (t - tAlvo) / n.per);
    var rot = (L.rot || 0) + (n.giro ? lado * GIRO.amp * Math.sin(2 * Math.PI * (t - tAlvo) / GIRO.per) : 0);
    return { x: x, y: y, rot: rot };
  }

  function distancia(pos, lugar, cenario) {
    var w = cenario.largura, h = cenario.altura;
    return Math.hypot((pos.x - lugar.x) * w, (pos.y - lugar.y) * h) / Math.min(w, h);
  }

  function pontuar(d, rotErro, nivel) {
    var n = NIVEIS[nivel], r = d / n.tol, k;
    if (r <= LIMITES.PERFEITO) k = 0; else if (r <= LIMITES.BOM) k = 1; else if (r <= LIMITES.QUASE) k = 2; else k = 3;
    if (n.giro && Math.abs(rotErro) > GIRO_LIMITE) k = Math.min(3, k + 1);
    return ORDEM[k];
  }

  function criarRodada(op) {
    var rnd = aleatorio(op.semente == null ? Date.now() : op.semente);
    var quedas = sortear(op.cenarios, op.itens, QUEDAS, rnd).map(function (q) {
      q.fase = rnd() * 2 * Math.PI; q.d = rnd() * 2 - 1; return q;
    });
    return { nivel: op.nivel, quedas: quedas, i: 0, t: 0, fase: quedas.length ? 'caindo' : 'fim', pontos: 0, combo: 0, mult: 1, resultados: [] };
  }

  function registrar(e, categoria, d) {
    if (categoria === 'PERFEITO' || categoria === 'BOM') { e.combo++; e.mult = MULTS[Math.min(e.combo - 1, MULTS.length - 1)]; }
    else { e.combo = 0; e.mult = 1; }
    var r = { categoria: categoria, pontos: Math.round(BASE[categoria] * e.mult), distancia: d, mult: e.mult };
    e.pontos += r.pontos; e.resultados.push(r); e.fase = 'parado';
    return r;
  }

  function atual(e) { return posicao(e.quedas[e.i], e.nivel, e.i, e.t); }

  function avancar(e, dt) {
    if (e.fase !== 'caindo') return;
    e.t += dt;
    if (atual(e).y > FUNDO) registrar(e, 'LONGE', Infinity);
  }

  function parar(e) {
    if (e.fase !== 'caindo') return null;
    var q = e.quedas[e.i], L = q.cenario.lugares[q.lugar], pos = atual(e);
    var d = distancia(pos, L, q.cenario);
    return registrar(e, pontuar(d, pos.rot - (L.rot || 0), e.nivel), d);
  }

  function proxima(e) {
    if (e.fase === 'fim') return;
    e.i++; e.t = 0;
    e.fase = e.i >= e.quedas.length ? 'fim' : 'caindo';
  }

  function estrelas(e) {
    var bons = e.resultados.filter(function (r) { return r.categoria === 'PERFEITO' || r.categoria === 'BOM'; }).length;
    return bons >= 7 ? 3 : bons >= 4 ? 2 : bons >= 1 ? 1 : 0;
  }

  /* ---------- validação dos catálogos (segurança: nada de fora entra sem passar aqui) ---------- */
  var ID = /^[a-z0-9-]{1,30}$/;
  var ARQ = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,60}\.(svg|png|jpe?g|webp)$/;
  function num(v, a, b) { return typeof v === 'number' && isFinite(v) && v >= a && v <= b; }
  function texto(v) { return typeof v === 'string' && v.length > 0 && v.length <= 30; }
  function nomeOk(n) {
    if (texto(n)) return n;
    if (n && typeof n === 'object' && texto(n.pt) && texto(n.en)) return { pt: n.pt, en: n.en };
    return null;
  }
  function base(o) {
    if (!o || typeof o !== 'object') return null;
    if (typeof o.id !== 'string' || !ID.test(o.id)) return null;
    if (typeof o.arquivo !== 'string' || !ARQ.test(o.arquivo) || o.arquivo.indexOf('..') >= 0) return null;
    var nome = nomeOk(o.nome); if (!nome) return null;
    return { id: o.id, nome: nome, arquivo: o.arquivo };
  }
  function validarCenario(o) {
    var c = base(o); if (!c) return null;
    if (!num(o.largura, 1, 8000) || !num(o.altura, 1, 8000)) return null;
    if (!o.lugares || typeof o.lugares !== 'object') return null;
    var lug = {}, chaves = Object.keys(o.lugares);
    if (!chaves.length) return null;
    for (var k = 0; k < chaves.length; k++) {
      var nomeL = chaves[k], L = o.lugares[nomeL];
      if (LUGARES.indexOf(nomeL) < 0 || !L || typeof L !== 'object') return null;
      var rot = L.rot == null ? 0 : L.rot;
      if (!num(L.x, 0, 1) || !num(L.y, 0, 1) || !num(L.tam, 0.03, 1) || !num(rot, -45, 45)) return null;
      lug[nomeL] = { x: L.x, y: L.y, tam: L.tam, rot: rot };
    }
    c.largura = o.largura; c.altura = o.altura; c.lugares = lug;
    return c;
  }
  function validarItem(o) {
    var it = base(o); if (!it) return null;
    if (LUGARES.indexOf(o.lugar) < 0) return null;
    if (!o.encaixe || !num(o.encaixe.x, 0, 1) || !num(o.encaixe.y, 0, 1)) return null;
    it.lugar = o.lugar; it.encaixe = { x: o.encaixe.x, y: o.encaixe.y };
    if (o.escala != null) { if (!num(o.escala, 0.3, 3)) return null; it.escala = o.escala; }   // largura = tam do lugar × escala
    return it;
  }

  return {
    NIVEIS: NIVEIS, GIRO: GIRO, LIMITES: LIMITES, BASE: BASE, MULTS: MULTS, QUEDAS: QUEDAS, TOPO: TOPO, FUNDO: FUNDO, LUGARES: LUGARES,
    aleatorio: aleatorio, sortear: sortear, posicao: posicao, distancia: distancia, pontuar: pontuar,
    criarRodada: criarRodada, avancar: avancar, parar: parar, proxima: proxima, estrelas: estrelas,
    validarCenario: validarCenario, validarItem: validarItem
  };
});
