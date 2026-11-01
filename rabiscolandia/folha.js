/* Rabiscolândia — a "folha esperta" (puro: sem DOM; testado no Node).
   O desenho mora num MUNDO de 8192 × 8192 unidades (a pintura só gasta memória onde foi pintada: pintura.js). A tela mostra um pedaço dele pela VISTA
   { s, ox, oy }: um ponto (x, y) do mundo aparece na tela em (ox + x·s, oy + y·s) — s é quantos pixels de
   tela (CSS) vale uma unidade do mundo. Como o mundo é bem maior que a tela, a folha "não acaba": em volta
   do desenho sempre tem papel.
   Regra pedida pelo dono para girar o aparelho (em pé ↔ deitado):
   - o que foi desenhado CABE na tela nova do mesmo tamanho → fica do mesmo tamanho (só desliza o mínimo
     para aparecer inteiro);
   - NÃO cabe (desenhou em cima e embaixo com o celular em pé e deitou) → o desenho inteiro continua à vista,
     a folha "cresce" para os lados e a tela toda vira papel — ninguém precisa ficar navegando.
   Zoom: pinça com dois dedos (pinca), botões 🔍+ 🔍− (zoom) e ⤢ (ajustar). */
(function (raiz, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else raiz.DesenhoFolha = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 8192, H = 8192;
  var VISTO = 900;                       // ao começar, o lado menor da tela mostra 900 unidades do mundo
  var PAGINA = { x: W / 2 - 700, y: H / 2 - 700, w: 1400, h: 1400 };   // onde fica um desenho de colorir (caixa 1000 × 1000 → 1400), no meio do mundo
  var MARGEM = 0.06;                     // folga em volta do desenho ao ajustar (6 % de cada lado)

  function aTela(v, x, y) { return { x: v.ox + x * v.s, y: v.oy + y * v.s }; }
  function aMundo(v, x, y) { return { x: (x - v.ox) / v.s, y: (y - v.oy) / v.s }; }
  function centroTela(v, larg, alt) { return aMundo(v, larg / 2, alt / 2); }

  // menor e maior zoom permitidos para uma tela: de 1/12 até 10× o zoom inicial
  function limites(larg, alt) {
    var ini = Math.min(larg, alt) / VISTO;
    return { min: Math.max(ini / 12, Math.min(larg / W, alt / H)), max: ini * 10 };
  }
  function prender(v, larg, alt) {
    var l = limites(larg, alt), s = Math.max(l.min, Math.min(l.max, v.s)), r = { s: s, ox: v.ox, oy: v.oy };
    // o mundo nunca sai inteiro da tela: o centro da tela fica sempre dentro do mundo
    var c = centroTela(r, larg, alt), cx = Math.max(0, Math.min(W, c.x)), cy = Math.max(0, Math.min(H, c.y));
    if (cx !== c.x || cy !== c.y) { r.ox = larg / 2 - cx * s; r.oy = alt / 2 - cy * s; }
    return r;
  }
  function centrar(s, cx, cy, larg, alt) { return { s: s, ox: larg / 2 - cx * s, oy: alt / 2 - cy * s }; }

  /* caixa com folga, para "caber" não encostar na borda */
  function comMargem(c) { var m = Math.max(c.w, c.h, 60) * MARGEM; return { x: c.x - m, y: c.y - m, w: c.w + 2 * m, h: c.h + 2 * m }; }
  function conter(c, larg, alt) { return Math.min(larg / c.w, alt / c.h); }

  /* vista do começo: sem caixa, o meio do mundo com o lado menor da tela mostrando VISTO unidades;
     com caixa (um desenho de colorir), a caixa inteira ajustada à tela. */
  function inicial(larg, alt, caixa) {
    if (!caixa) return prender(centrar(Math.min(larg, alt) / VISTO, W / 2, H / 2, larg, alt), larg, alt);
    var c = comMargem(caixa);
    return prender(centrar(conter(c, larg, alt), c.x + c.w / 2, c.y + c.h / 2, larg, alt), larg, alt);
  }

  /* ajustar (⤢): mostra tudo o que foi desenhado; sem nada desenhado, volta ao começo */
  function ajustar(larg, alt, caixa) { return inicial(larg, alt, caixa); }

  /* girar o aparelho (ou qualquer mudança de tamanho da tela).
     ant: vista de antes; la/aa: tela de antes; larg/alt: tela nova; caixa: o que foi desenhado (ou null). */
  function aoGirar(ant, la, aa, larg, alt, caixa) {
    var c0 = centroTela(ant, la, aa);
    var v = centrar(ant.s, c0.x, c0.y, larg, alt);           // mesmo tamanho, mesmo centro
    if (!caixa) return prender(v, larg, alt);
    var c = comMargem(caixa);
    if (c.w * ant.s <= larg && c.h * ant.s <= alt) {
      // cabe do mesmo tamanho: só desliza o mínimo para o desenho aparecer inteiro
      var dx = 0, dy = 0, esq = v.ox + c.x * v.s, dir = esq + c.w * v.s, cima = v.oy + c.y * v.s, baixo = cima + c.h * v.s;
      if (esq < 0) dx = -esq; else if (dir > larg) dx = larg - dir;
      if (cima < 0) dy = -cima; else if (baixo > alt) dy = alt - baixo;
      return prender({ s: v.s, ox: v.ox + dx, oy: v.oy + dy }, larg, alt);
    }
    // não cabe: o desenho inteiro à vista, a folha cresce em volta
    return prender(centrar(conter(c, larg, alt), c.x + c.w / 2, c.y + c.h / 2, larg, alt), larg, alt);
  }

  /* zoom em volta de um ponto da tela (botões e roda do mouse) */
  function zoom(v, fator, px, py, larg, alt) {
    var l = limites(larg, alt), s = Math.max(l.min, Math.min(l.max, v.s * fator)), m = aMundo(v, px, py);
    return prender({ s: s, ox: px - m.x * s, oy: py - m.y * s }, larg, alt);
  }

  /* pinça: vista do começo do gesto + dois dedos no começo (a1, b1) e agora (a2, b2), em pixels de tela.
     O ponto do mundo que estava no meio dos dedos continua no meio dos dedos (zoom e arrastar juntos). */
  function pinca(v0, a1, b1, a2, b2, larg, alt) {
    var d1 = Math.max(10, Math.hypot(b1.x - a1.x, b1.y - a1.y)), d2 = Math.max(10, Math.hypot(b2.x - a2.x, b2.y - a2.y));
    var l = limites(larg, alt), s = Math.max(l.min, Math.min(l.max, v0.s * d2 / d1));
    var m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 }, m2 = { x: (a2.x + b2.x) / 2, y: (a2.y + b2.y) / 2 };
    var w = aMundo(v0, m1.x, m1.y);
    return prender({ s: s, ox: m2.x - w.x * s, oy: m2.y - w.y * s }, larg, alt);
  }
  function arrastar(v, dx, dy, larg, alt) { return prender({ s: v.s, ox: v.ox + dx, oy: v.oy + dy }, larg, alt); }

  /* caixas (x, y, w, h) */
  function unir(a, b) {
    if (!a) return b ? { x: b.x, y: b.y, w: b.w, h: b.h } : null;
    if (!b) return { x: a.x, y: a.y, w: a.w, h: a.h };
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
    return { x: x, y: y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
  }
  function caixaDePontos(pts, raio) {
    if (!pts || pts.length < 2) return null;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i + 1 < pts.length; i += 2) { var x = pts[i], y = pts[i + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    var r = raio || 0;
    return { x: x0 - r, y: y0 - r, w: x1 - x0 + 2 * r, h: y1 - y0 + 2 * r };
  }
  function dentroDoMundo(c) {
    if (!c) return null;
    var x = Math.max(0, c.x), y = Math.max(0, c.y), x2 = Math.min(W, c.x + c.w), y2 = Math.min(H, c.y + c.h);
    return x2 > x && y2 > y ? { x: x, y: y, w: x2 - x, h: y2 - y } : null;
  }

  /* onde fica a barra de ferramentas: no celular, sempre na borda que é o "embaixo" do aparelho (o menu não
     muda de lugar na mão ao deitar); tablet e computador embaixo; TV à esquerda.
     angulo: screen.orientation.angle (0, 90, 180, 270) ou window.orientation (-90 vira 270). */
  function ladoDaBarra(tipo, larg, alt, angulo) {
    if (tipo === 'tv') return 'esquerda';
    if (tipo !== 'celular' || larg <= alt) return 'baixo';
    var a = ((Math.round((angulo || 0) / 90) * 90) % 360 + 360) % 360;
    if (a === 270) return 'esquerda';
    return 'direita';                     // 90 (ou ângulo desconhecido): o "embaixo" do aparelho ficou à direita
  }

  return {
    W: W, H: H, VISTO: VISTO, PAGINA: PAGINA,
    inicial: inicial, ajustar: ajustar, aoGirar: aoGirar, zoom: zoom, pinca: pinca, arrastar: arrastar, prender: prender,
    aTela: aTela, aMundo: aMundo, limites: limites, unir: unir, caixaDePontos: caixaDePontos, dentroDoMundo: dentroDoMundo,
    ladoDaBarra: ladoDaBarra
  };
});
