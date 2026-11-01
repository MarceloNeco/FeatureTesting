/* Purpurina — desenha a personagem (e o cenário) em SVG, a partir do estado (ver visual.js).
   Tudo desenhado em código: nenhuma imagem de fora. Uma função só: PurpurinaBoneca.svg(estado, opcoes).
     opcoes.id      prefixo dos ids internos (gradientes, padrões) — cada SVG na página precisa do seu
     opcoes.area    [x, y, largura, altura] para mostrar só um pedaço (miniaturas dos botões)
     opcoes.fundo   false = sem cenário (padrão: true);  opcoes.soFundo = só o cenário
     opcoes.anim    true = glitter piscando (na tela); false = parado (foto e miniaturas)
     opcoes.largura / opcoes.altura  tamanho em pixels (foto)
   Coordenadas da personagem: 400 de largura por 720 de altura; cabeça em (200, 205). */
(function (raiz) {
  'use strict';
  var P = raiz.PurpurinaPecas || (typeof require === 'function' ? require('./pecas.js') : null);
  var V = raiz.PurpurinaVisual || (typeof require === 'function' ? require('./visual.js') : null);
  var W = 400, H = 720;
  // a cabeça é desenhada em (200, 205) e depois aumentada um pouco (jeito fofo, pescoço curto)
  var CABECA = 'translate(0 14) translate(200 297) scale(1.12) translate(-200 -297)';
  function grupo(s) { return s ? '<g transform="' + CABECA + '">' + s + '</g>' : ''; }

  // ---------- ajudantes ----------
  function n(v) { return Math.round(v * 10) / 10; }
  function rgb(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mistura(a, b, t) { var x = rgb(a), y = rgb(b); return '#' + [0, 1, 2].map(function (i) { var v = Math.round(x[i] + (y[i] - x[i]) * t); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function esc(h, t) { return mistura(h, '#000000', t); }
  function cla(h, t) { return mistura(h, '#ffffff', t); }
  function at(o) { var s = ''; for (var k in o) if (o[k] !== undefined && o[k] !== null) s += ' ' + k + '="' + o[k] + '"'; return s; }
  function p(d, o) { return '<path d="' + d + '"' + at(o || {}) + '/>'; }
  function circ(cx, cy, r, o) { return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '"' + at(o || {}) + '/>'; }
  function elip(cx, cy, rx, ry, o) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '"' + at(o || {}) + '/>'; }
  function ret(x, y, w, h, o) { return '<rect x="' + n(x) + '" y="' + n(y) + '" width="' + n(w) + '" height="' + n(h) + '"' + at(o || {}) + '/>'; }
  // espelha um caminho na vertical do meio (só M, L, Q, C e Z: todo número vem em par x,y)
  function espelhar(d) { var i = 0; return d.replace(/-?\d*\.?\d+/g, function (m) { var r = i % 2 === 0 ? String(n(W - parseFloat(m))) : m; i++; return r; }); }
  function dois(d, o) { return p(d, o) + p(espelhar(d), o); }
  function sorteio(s) { s = s >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function estrela5(x, y, R, r) { var s = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; s += (i ? 'L' : 'M') + n(x + Math.cos(a) * q) + ',' + n(y + Math.sin(a) * q); } return s + 'Z'; }
  function estrela4(x, y, r) { return 'M' + n(x) + ',' + n(y - r) + 'Q' + n(x) + ',' + n(y) + ' ' + n(x + r) + ',' + n(y) + 'Q' + n(x) + ',' + n(y) + ' ' + n(x) + ',' + n(y + r) + 'Q' + n(x) + ',' + n(y) + ' ' + n(x - r) + ',' + n(y) + 'Q' + n(x) + ',' + n(y) + ' ' + n(x) + ',' + n(y - r) + 'Z'; }
  function coracao(x, y, s) { return 'M' + n(x) + ',' + n(y + s * 0.9) + 'C' + n(x - s * 1.5) + ',' + n(y - s * 0.1) + ' ' + n(x - s * 0.6) + ',' + n(y - s * 1.15) + ' ' + n(x) + ',' + n(y - s * 0.35) + 'C' + n(x + s * 0.6) + ',' + n(y - s * 1.15) + ' ' + n(x + s * 1.5) + ',' + n(y - s * 0.1) + ' ' + n(x) + ',' + n(y + s * 0.9) + 'Z'; }
  function flor(x, y, r, cor, miolo) { var s = ''; for (var i = 0; i < 5; i++) { var a = i * Math.PI * 2 / 5 - Math.PI / 2; s += circ(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.75, { fill: cor }); } return s + circ(x, y, r * 0.55, { fill: miolo || '#ffd23f' }); }
  function laco(x, y, s, cor) {
    var c = esc(cor, 0.3), o = { fill: cor, stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round' };
    return p('M' + x + ',' + y + 'L' + n(x - s * 0.5) + ',' + n(y + s * 1.3) + 'L' + n(x - s * 0.1) + ',' + n(y + s * 1.15) + 'Z', o) +
      p('M' + x + ',' + y + 'L' + n(x + s * 0.5) + ',' + n(y + s * 1.3) + 'L' + n(x + s * 0.1) + ',' + n(y + s * 1.15) + 'Z', o) +
      p('M' + x + ',' + y + 'C' + n(x - s * 1.7) + ',' + n(y - s * 1.3) + ' ' + n(x - s * 1.7) + ',' + n(y + s * 1.1) + ' ' + x + ',' + y + 'Z', o) +
      p('M' + x + ',' + y + 'C' + n(x + s * 1.7) + ',' + n(y - s * 1.3) + ' ' + n(x + s * 1.7) + ',' + n(y + s * 1.1) + ' ' + x + ',' + y + 'Z', o) +
      p('M' + n(x - s * 1.05) + ',' + n(y - s * 0.35) + 'Q' + n(x - s * 0.6) + ',' + n(y - s * 0.55) + ' ' + n(x - s * 0.3) + ',' + n(y - s * 0.2), { fill: 'none', stroke: cla(cor, 0.6), 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.8 }) +
      circ(x, y, s * 0.32, { fill: esc(cor, 0.12), stroke: c, 'stroke-width': 2 });
  }

  // ---------- o desenho ----------
  function svg(e0, op) {
    op = op || {};
    var e = V.limpar(e0), I = (op.id || 'b') + '-', fundo = op.fundo !== false, out = [];
    var C = function (cat) { var k = P.categoria(cat); return P.cor(k.cores, e[k.opcoes ? cat + 'Cor' : cat]); };
    var pele = C('pele').hex, peleE = esc(pele, 0.3), cab = C('cabelo').hex, cabE = esc(cab, 0.3);
    var vis = function (cat) { return V.visivel(e, cat); };
    var estNa = vis('vestido') ? 'vestido' : 'blusa', comEstampa = e.estampa !== 'liso';
    var area = op.soFundo ? [0, 0, W, H] : (op.area || [0, 0, W, H]);
    var defs = defsSvg(e, I, pele, cab);

    function peca(ds, cor, catId) {
      var s = '', est = comEstampa && catId === estNa;
      (typeof ds === 'string' ? [ds] : ds).forEach(function (d) {
        s += p(d, { fill: cor.hex });
        if (est) s += p(d, { fill: 'url(#' + I + 'est)' });
        if (cor.brilho) s += p(d, { fill: 'url(#' + I + 'shine)' });
        s += p(d, { fill: 'url(#' + I + 'vol)' }) + p(d, { fill: 'url(#' + I + 'lado)' });
        s += p(d, { fill: 'none', stroke: esc(cor.hex, 0.4), 'stroke-width': 1.4, 'stroke-linejoin': 'round', opacity: 0.8 });
      });
      return s;
    }
    function linha(d, cor, larg, op2) { return p(d, { fill: 'none', stroke: cor, 'stroke-width': larg || 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op2 }); }

    if (fundo || op.soFundo) out.push(cenario(e.cenario, I));
    if (op.soFundo) return fechar();
    out.push(elip(200, 664, 96, 13, { fill: '#000', opacity: 0.16 }));

    /* ---------- giro (opcoes.angulo, em graus) ----------
       Personagem de papel que gira: o corpo afina com o cosseno do ângulo (de lado fica fininho) e, quando
       passa de 90°, aparece de costas (espelhada, sem rosto, com o cabelo por cima). De frente, olhos, boca e
       maquiagem escorregam para o lado do giro, recortados pelo contorno do rosto — parece que ela vira a cabeça. */
    /* giro em 16 posições desenhadas (de 22,5° em 22,5°), como os bonecos dos jogos: frente, três-quartos (o rosto
       desliza para o lado), perfil de verdade e costas. A cabeça nunca é espremida; o corpo só fica um pouco mais
       estreito de lado, como um corpo de verdade visto de perfil. */
    var ang = Math.round(((((op.angulo || 0) % 360) + 360) % 360) / 22.5) * 22.5 % 360, rad = ang * Math.PI / 180, cos = Math.cos(rad), sen = Math.sin(rad);
    if (Math.abs(cos) < 1e-9) cos = 0;
    var costas = cos < 0, escalaX = 0.62 + 0.38 * Math.abs(cos), desliza = costas ? 0 : sen * 44;
    // de lado (entre 60° e 120°, e entre 240° e 300°): cabeça desenhada de perfil, virada para onde ela gira
    var perfil = Math.abs(cos) < 0.5, lado = sen >= 0 ? 1 : -1;
    var iniBoneca = out.length;
    function andar(s, dx) { return dx ? '<g transform="translate(' + n(dx) + ' 0)">' + s + '</g>' : s; }

    // ---------- asas e cabelo de trás (de costas, vão por cima do corpo, lá embaixo) ----------
    var asasF = vis('vestido') && e.vestido === 'fada' ? asas(C('vestido')) : '';
    if (!costas) out.push(asasF);
    if (!costas && !perfil) out.push(grupo(cabeloTras(e, I, cab, cabE)));

    // ---------- pernas, pés e sapatos ----------
    var peleS = esc(pele, 0.12), peleL = cla(pele, 0.28);
    function membro(d, larg) {
      return p(d, { stroke: peleE, 'stroke-width': larg + 2.6, 'stroke-linecap': 'round', fill: 'none', opacity: 0.85 }) + p(d, { stroke: peleS, 'stroke-width': larg, 'stroke-linecap': 'round', fill: 'none' }) +
        p(d, { stroke: pele, 'stroke-width': larg * 0.72, 'stroke-linecap': 'round', fill: 'none' }) + '<g transform="translate(-2.5 0)">' + p(d, { stroke: peleL, 'stroke-width': larg * 0.26, 'stroke-linecap': 'round', fill: 'none', opacity: 0.55 }) + '</g>';
    }
    ['M177,455 L173,640', 'M223,455 L227,640'].forEach(function (d) { out.push(membro(d, 29)); });
    out.push(sapatos(e, C('sapatos'), pele, peleE, peca));

    // ---------- parte de baixo ----------
    if (vis('calca')) out.push(calca(e.calca, C('calca'), peca, linha, pele));
    if (vis('saia')) out.push(saia(e.saia, C('saia'), peca, linha));

    // ---------- pescoço, tronco e braços ----------
    if (!perfil) out.push(ret(186, 270, 28, 80, { fill: pele, stroke: peleE, 'stroke-width': 2 }), ret(187, 300, 26, 18, { fill: '#000', opacity: 0.08 }));
    out.push(p('M150,342 Q200,330 250,342 Q262,346 260,366 L248,458 L152,458 L140,366 Q138,346 150,342Z', { fill: pele, stroke: peleE, 'stroke-width': 1.4 }) + p('M150,342 Q200,330 250,342 Q262,346 260,366 L248,458 L152,458 L140,366 Q138,346 150,342Z', { fill: 'url(#' + I + 'lado)' }));
    var bracos = ['M150,354 Q126,420 118,498', 'M250,354 Q274,420 282,498'];
    bracos.forEach(function (d) { out.push(membro(d, 23)); });

    // ---------- vestido ou blusa ----------
    if (vis('vestido')) out.push(vestido(e.vestido, C('vestido'), peca, linha, pele, peleE));
    else out.push(blusa(e.blusa === 'nenhum' ? 'nenhum' : e.blusa, C('blusa'), peca, linha));

    // ---------- bolsa, mãos e joias do corpo ----------
    if (vis('bolsa')) out.push(bolsa(e.bolsa, C('bolsa'), peca, linha));
    var esmalte = { tipo: e.unhas, cor: C('unhas') };
    out.push(mao(118, -1, pele, peleE, esmalte), mao(282, 1, pele, peleE, esmalte));
    if (!costas && vis('colar')) out.push(colar(e.colar, C('colar'), I));
    if (!costas && vis('broche')) out.push(broche(e.broche, C('broche')));
    if (vis('pulseira')) out.push(pulseira(e.pulseira, C('pulseira')));
    if (!costas && vis('anel')) out.push(anel(e.anel, C('anel')));
    if (costas) out.push(asasF);

    // ---------- cabeça (tudo aqui dentro vai para o grupo aumentado) ----------
    var corpo = out; out = [];
    var rosto = 'M114,200 C114,140 155,113 200,113 C245,113 286,140 286,200 C286,262 250,297 200,297 C150,297 114,262 114,200Z';
    var orelhaE = costas || sen > -0.35, orelhaD = costas || sen < 0.35;
    if (orelhaE) out.push(elip(116 + desliza * 0.3, 216, 12, 17, { fill: pele, stroke: peleE, 'stroke-width': 2 }));
    if (orelhaD) out.push(elip(284 + desliza * 0.3, 216, 12, 17, { fill: pele, stroke: peleE, 'stroke-width': 2 }));
    if (perfil) {
      out = [perfilCabeca(e, I, C, pele, peleE, cab, cabE, vis, peca)];
    } else if (costas) {
      // de costas: a cabeça é só cabelo
      out.push(p(rosto, { fill: 'url(#' + I + 'cab)', stroke: cabE, 'stroke-width': 2.2 }) + p('M200,118 L200,200', { stroke: cabE, 'stroke-width': 2, opacity: 0.5 }));
      out.push(cabeloTras(e, I, cab, cabE));
      if (vis('brincos')) out.push(andar(brincos(e.brincos, C('brincos'), I), 0));
    } else {
      out.push(p(rosto, { fill: 'url(#' + I + 'pele)', stroke: peleE, 'stroke-width': 2.2 }));
      // luz e sombra suaves: sombra da franja na testa, dobra da pálpebra, brilho no nariz e no queixo
      var luz = elip(200, 150, 84, 26, { fill: '#000', opacity: 0.06 }) + elip(152, 246, 26, 16, { fill: '#ff8f7a', opacity: 0.1 }) + elip(248, 246, 26, 16, { fill: '#ff8f7a', opacity: 0.1 }) +
        p('M203,226 Q208,240 205,250', { fill: 'none', stroke: esc(pele, 0.25), 'stroke-width': 3, opacity: 0.22, 'stroke-linecap': 'round' }) + elip(200, 291, 16, 3.5, { fill: '#000', opacity: 0.07 }) + elip(200, 286, 70, 14, { fill: '#000', opacity: 0.04 }) +
        elip(128, 214, 10, 34, { fill: '#000', opacity: 0.04 }) + elip(272, 214, 10, 34, { fill: '#000', opacity: 0.04 }) + elip(200, 238, 2.6, 7, { fill: '#fff', opacity: 0.35 }) + elip(200, 284, 12, 4, { fill: '#fff', opacity: 0.18 }) +
        p('M146,201 Q164,178 182,199', { fill: 'none', stroke: esc(pele, 0.22), 'stroke-width': 1.3, opacity: 0.55 }) + p('M218,199 Q236,178 254,201', { fill: 'none', stroke: esc(pele, 0.22), 'stroke-width': 1.3, opacity: 0.55 });
      var feicoes = [luz, base(e.base, pele, rosto), blush(e, C('blush').hex, I), olho(164, -1, e, I, C), olho(236, 1, e, I, C)];
      var sob = mistura(cab, '#2a1c1a', 0.45);
      feicoes.push(linha('M144,184 Q163,172 183,181', sob, 5.5), linha('M217,181 Q237,172 256,184', sob, 5.5));
      feicoes.push(linha('M195,248 Q200,253 205,248', esc(pele, 0.25), 2.6));
      feicoes.push(boca(e, C('batom'), pele, I));
      if (vis('adesivo')) feicoes.push(adesivo(e.adesivo, 266, 250, 13));
      if (e.glitter === 'bochechas' || e.glitter === 'olhos') feicoes.push(glitter(e, C('glitter'), op.anim));
      out.push(desliza ? '<g clip-path="url(#' + I + 'rostoC)">' + andar(feicoes.join(''), desliza) + '</g>' : feicoes.join(''));
      // ---------- cabelo da frente e acessórios do rosto ----------
      out.push(andar(cabeloFrente(e, I, cab, cabE), desliza * 0.3));
      if (vis('brincos')) out.push(andar(brincos(e.brincos, C('brincos'), I, orelhaE, orelhaD), desliza * 0.3));
      if (vis('oculos')) out.push(andar(oculos(e.oculos, C('oculos')), desliza));
    }
    var enfeites = '';
    if (vis('laco') && !(e.laco === 'alto' && (e.cabeca === 'chapeu' || e.cabeca === 'gorro'))) enfeites += lacos(e.laco, C('laco'), e.cabelo);
    if (vis('cabeca')) enfeites += cabeca(e.cabeca, C('cabeca'), I, peca);
    out.push(perfil ? '<g transform="translate(200 0) scale(0.62 1) translate(-196 0)">' + enfeites + '</g>' : enfeites);
    if (e.glitter === 'cabelo' && !perfil) out.push(glitter(e, C('glitter'), op.anim));
    if (perfil) {
      // de lado: corpo afinado; cabelo de trás e cabeça de perfil desenhados à parte (sem afinar), virados para o lado do giro
      var vira = function (s) { return lado < 0 ? '<g transform="translate(400 0) scale(-1 1)">' + s + '</g>' : s; };
      var corpoLado = corpo.splice(iniBoneca).join('') + (e.glitter === 'tudo' ? glitter(e, C('glitter'), false) : '');
      corpo.push(vira(grupo('<g transform="translate(-36 0) translate(200 0) scale(0.6 1) translate(-200 0)">' + cabeloTras(e, I, cab, cabE) + '</g>')));
      corpo.push('<g transform="translate(200 0) scale(' + n((costas ? -1 : 1) * escalaX * 100) / 100 + ' 1) translate(-200 0)">' + corpoLado + '</g>');
      corpo.push(vira(grupo(out.join(''))));
      out = corpo;
      return fechar();
    }
    var cabecaPronta = grupo(out.join(''));
    out = corpo;
    if (e.glitter === 'tudo') out.push(glitter(e, C('glitter'), op.anim && !ang));
    if (ang) {
      // só o corpo afina um pouco; a cabeça fica do tamanho certo (de costas, espelhada: laço e cabelo trocam de lado)
      var boneca = out.splice(iniBoneca).join('');
      out.push('<g transform="translate(200 0) scale(' + n((costas ? -1 : 1) * escalaX * 100) / 100 + ' 1) translate(-200 0)">' + boneca + '</g>');
      out.push(costas ? '<g transform="translate(400 0) scale(-1 1)">' + cabecaPronta + '</g>' : cabecaPronta);
    } else out.push(cabecaPronta);
    if (ang) defs += '<clipPath id="' + I + 'rostoC"><path d="' + rosto + '"/></clipPath>';
    return fechar();

    function fechar() {
      var w = op.largura, h = op.altura;
      // realce (palco e TV): cenário levemente desfocado atrás e a personagem com sombra macia — tira o "papel recortado"
      var realce = op.realce !== undefined ? op.realce : (fundo && !op.soFundo);
      if (realce && out.length > 1) {
        var cen = out.shift();
        out = ['<g filter="url(#' + I + 'desf)">' + cen + '</g>' + ret(0, 0, W, H, { fill: 'url(#' + I + 'luzE)' }), '<g filter="url(#' + I + 'somb)">' + out.join('') + '</g>'];
      }
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + area.join(' ') + '"' + (w ? ' width="' + w + '" height="' + h + '"' : '') +
        ' preserveAspectRatio="xMidYMid ' + (op.cortar ? 'slice' : 'meet') + '"><defs>' + defs + '</defs>' + out.join('') + '</svg>';
    }
  }

  // ---------- gradientes e estampas ----------
  function defsSvg(e, I, pele, cab) {
    var est = P.cor('roupa', e.estampaCor).hex, padrao = '';
    var t = { patternUnits: 'userSpaceOnUse' };
    switch (e.estampa) {
      case 'bolinhas': padrao = '<pattern id="' + I + 'est" width="22" height="22"' + at(t) + '>' + circ(6, 6, 3.6, { fill: est }) + circ(17, 17, 3.6, { fill: est }) + '</pattern>'; break;
      case 'listras': padrao = '<pattern id="' + I + 'est" width="20" height="20"' + at(t) + '>' + ret(0, 0, 20, 7, { fill: est }) + '</pattern>'; break;
      case 'estrelas': padrao = '<pattern id="' + I + 'est" width="28" height="28"' + at(t) + '>' + p(estrela5(8, 9, 5, 2.2), { fill: est }) + p(estrela5(22, 22, 5, 2.2), { fill: est }) + '</pattern>'; break;
      case 'coracoes': padrao = '<pattern id="' + I + 'est" width="26" height="26"' + at(t) + '>' + p(coracao(7, 8, 4), { fill: est }) + p(coracao(20, 21, 4), { fill: est }) + '</pattern>'; break;
      case 'flores': padrao = '<pattern id="' + I + 'est" width="30" height="30"' + at(t) + '>' + flor(8, 8, 3.2, est, '#ffd23f') + flor(23, 23, 3.2, est, '#ffd23f') + '</pattern>'; break;
      case 'arcoiris': padrao = '<pattern id="' + I + 'est" width="30" height="30"' + at(t) + '>' + ['#ff5a6e', '#ffd23f', '#5cc46a', '#5ac8ff', '#b892ff'].map(function (c, k) { return ret(0, k * 6, 30, 6, { fill: c, opacity: 0.85 }); }).join('') + '</pattern>'; break;
      case 'oncinha': padrao = '<pattern id="' + I + 'est" width="30" height="30"' + at(t) + '>' + circ(7, 8, 3.6, { fill: 'none', stroke: est, 'stroke-width': 2.2 }) + circ(7, 8, 1.6, { fill: est, opacity: 0.6 }) + circ(22, 20, 4, { fill: 'none', stroke: est, 'stroke-width': 2.2 }) + circ(22, 20, 1.8, { fill: est, opacity: 0.6 }) + circ(17, 5, 1.8, { fill: est }) + circ(5, 24, 1.6, { fill: est }) + '</pattern>'; break;
      case 'xadrez': padrao = '<pattern id="' + I + 'est" width="24" height="24"' + at(t) + '>' + ret(0, 0, 9, 24, { fill: est, opacity: 0.45 }) + ret(0, 0, 24, 9, { fill: est, opacity: 0.45 }) + '</pattern>'; break;
    }
    var iris = P.cor('olhos', e.olhos).hex;
    return padrao +
      '<radialGradient id="' + I + 'pele" cx=".45" cy=".38" r=".7"><stop offset="0" stop-color="' + cla(pele, 0.16) + '"/><stop offset="1" stop-color="' + esc(pele, 0.05) + '"/></radialGradient>' +
      '<linearGradient id="' + I + 'lado" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".2"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".1"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>' +
      '<filter id="' + I + 'somb" x="-30%" y="-15%" width="160%" height="135%"><feDropShadow dx="5" dy="9" stdDeviation="8" flood-color="#2a0a3c" flood-opacity=".38"/></filter>' +
      '<filter id="' + I + 'desf" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<radialGradient id="' + I + 'luzE" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#fff8e8" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1a0630" stop-opacity=".28"/></radialGradient>' +
      '<radialGradient id="' + I + 'vol" cx=".42" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></radialGradient>' +
      '<linearGradient id="' + I + 'shine" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".6"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      gradienteCabelo(e, I, cab) +
      '<radialGradient id="' + I + 'iris" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="' + cla(iris, 0.35) + '"/><stop offset=".7" stop-color="' + iris + '"/><stop offset="1" stop-color="' + esc(iris, 0.45) + '"/></radialGradient>' +
      '<radialGradient id="' + I + 'blush"><stop offset="0" stop-color="' + P.cor('blush', e.blushCor).hex + '" stop-opacity=".8"/><stop offset="1" stop-color="' + P.cor('blush', e.blushCor).hex + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + I + 'lab" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="' + cla(P.cor('batom', e.batomCor).hex, 0.45) + '"/><stop offset="1" stop-color="' + P.cor('batom', e.batomCor).hex + '"/></radialGradient>' +
      '<clipPath id="' + I + 'olhoP"><path d="M240,209 Q252,198 264,207 Q256,219 240,209Z"/></clipPath>' +
      '<clipPath id="' + I + 'olhoE"><path d="' + formaOlho(164) + '"/></clipPath><clipPath id="' + I + 'olhoD"><path d="' + formaOlho(236) + '"/></clipPath>';
  }

  // ---------- cabelo ----------
  // mechas: "pontas" e "arco" mudam o degradê do cabelo (vale para todos os cortes); "frente" desenha faixas
  function gradienteCabelo(e, I, cab) {
    var m = P.cor('cabelo', e.mechasCor).hex, st = [[0, cla(cab, 0.12)], [0.1, cla(cab, 0.34)], [0.2, cla(cab, 0.06)], [0.55, cab], [0.85, esc(cab, 0.14)], [1, esc(cab, 0.22)]];
    if (e.mechas === 'pontas') st = [[0, cla(cab, 0.18)], [0.45, cab], [0.8, m], [1, cla(m, 0.2)]];
    if (e.mechas === 'arco') st = [[0, cla(cab, 0.18)], [0.4, cab], [0.55, '#ff7cc8'], [0.68, '#ffd76a'], [0.8, '#7ee8ff'], [0.92, '#b892ff'], [1, '#86ecc8']];
    return '<linearGradient id="' + I + 'cab" x1="0" y1="0" x2="0" y2="1">' + st.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>'; }).join('') + '</linearGradient>';
  }
  function puff(cx, cy, r, f) { var s = circ(cx, cy, r, f); for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += circ(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85, r * 0.32, f); } return s + circ(cx, cy, r * 0.8, { fill: f.fill }); }
  // mecha lisa do lado: a borda de dentro segue o contorno da bochecha e do queixo (não invade o rosto)
  var MECHA_LISA = 'M108,204 Q96,330 124,436 L146,430 Q142,350 142,300 Q134,276 122,252 Q117,236 117,222Z';
  // fios: linhas claras finas que dão textura de cabelo de verdade
  var FIOS = [[118, 1], [134, 1], [266, -1], [282, -1]].map(function (q) { return '<path d="M' + q[0] + ',236 Q' + (q[0] - q[1] * 8) + ',340 ' + (q[0] + q[1] * 4) + ',452" fill="none" stroke="#fff" stroke-width="1.4" opacity=".16"/>'; }).join('');
  var COSTAS_LONGO = 'M106,210 Q100,100 200,95 Q300,100 294,210 L306,472 Q200,494 94,472Z';
  var BRILHO_CAB = 'M146,132 Q200,110 254,132';
  function cabeloTras(e, I, cab, cabE) {
    var f = { fill: 'url(#' + I + 'cab)', stroke: cabE, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s = '';
    switch (e.cabelo) {
      case 'cortina': case 'franjinha': case 'chiquinhasBaixas': s = e.cabelo === 'chiquinhasBaixas' ? '' : p(COSTAS_LONGO, f); break;
      case 'lob': s = p('M104,210 Q98,100 200,95 Q302,100 296,210 Q312,260 298,300 Q312,330 290,346 Q200,360 110,346 Q88,330 102,300 Q88,260 104,210Z', f); break;
      case 'rabinhoAlto': s = p('M206,72 Q304,60 302,172 Q298,282 268,364 Q276,272 262,182 Q250,112 206,98Z', f) + circ(200, 92, 26, f); break;
      case 'coqueBaguncado':
        if (e.cabeca !== 'chapeu' && e.cabeca !== 'gorro') { s = circ(200, 88, 32, f) + circ(178, 80, 16, f) + circ(222, 78, 15, f) + circ(206, 64, 14, f); s += p('M226,66 Q244,52 240,40 M174,64 Q160,52 166,40', { fill: 'none', stroke: cab, 'stroke-width': 4, 'stroke-linecap': 'round' }); }
        break;
      case 'cachosCurtos': for (var cc = 0; cc <= 18; cc++) { var ac = -0.5 + cc * (Math.PI + 1) / 18; s += circ(200 + Math.cos(ac) * 104, 210 - Math.sin(ac) * 104, 25, f); } break;
      case 'ondasLongas': s = p('M100,210 Q92,96 200,90 Q308,96 300,210 Q330,270 308,330 Q332,390 310,450 Q330,500 296,526 Q200,548 104,526 Q70,500 90,450 Q68,390 92,330 Q70,270 100,210Z', f); break;
      case 'dreads':
        s = p(COSTAS_LONGO, f);
        for (var dr = 0; dr < 15; dr++) { var dxr = 102 + dr * 14; s += p('M' + dxr + ',220 L' + (dxr + 2) + ',476', { fill: 'none', stroke: cabE, 'stroke-width': 2, 'stroke-dasharray': '6 4', opacity: 0.6 }); }
        break;
      case 'ondasLado': s = p('M106,210 Q100,100 200,95 Q300,100 294,210 L300,300 Q200,290 110,260Z', f); break;
      case 'cacheadoLongo':
        s = p(COSTAS_LONGO, f);
        for (var rl = 0; rl < 10; rl++) { s += circ(96 + (rl % 2) * 6, 230 + rl * 25, 13, f) + circ(304 - (rl % 2) * 6, 230 + rl * 25, 13, f); }
        for (var rb = 0; rb < 9; rb++) s += circ(104 + rb * 24, 474 + (rb % 2) * 6, 13, f);
        break;
      case 'longo': case 'franja': case 'meio': s = p(COSTAS_LONGO, f) + FIOS;
        if (e.cabelo === 'meio' && e.cabeca !== 'chapeu' && e.cabeca !== 'gorro') s += circ(200, 98, 24, f) + linha2('M184,96 Q200,82 216,98', cabE);
        break;
      case 'afro': s = elip(200, 196, 124, 116, { fill: 'url(#' + I + 'cab)' }); for (var q = 0; q < 28; q++) { var aq = q / 28 * Math.PI * 2; s += circ(200 + Math.cos(aq) * 122, 196 + Math.sin(aq) * 112, 28, f); } s += elip(200, 196, 118, 110, { fill: 'url(#' + I + 'cab)' }); break;
      case 'puffs': s = puff(116, 118, 44, f) + puff(284, 118, 44, f); break;
      case 'pixie': s = p('M108,214 Q100,100 200,95 Q300,100 292,214 L284,246 L116,246Z', f); break;
      case 'sereia': s = p('M104,210 Q98,100 200,95 Q302,100 296,210 Q318,280 300,350 Q322,420 304,490 Q326,560 300,630 Q200,656 100,630 Q74,560 96,490 Q78,420 100,350 Q82,280 104,210Z', f); break;
      case 'coqueDuplo': if (e.cabeca !== 'chapeu' && e.cabeca !== 'gorro') s = circ(138, 104, 33, f) + circ(262, 104, 33, f) + linha2('M118,100 Q138,82 158,100', cabE) + linha2('M242,100 Q262,82 282,100', cabE); break;
      case 'box':
        s = p('M104,210 Q98,100 200,95 Q302,100 296,210 L308,482 Q200,502 92,482Z', f);
        for (var b = 0; b < 17; b++) { var bx = 100 + b * 12.5; s += p('M' + bx + ',220 Q' + (bx + 4) + ',350 ' + (bx - 2) + ',486', { fill: 'none', stroke: cabE, 'stroke-width': 1.6, 'stroke-dasharray': '4 3', opacity: 0.7 }); }
        break;
      case 'ondulado': s = p('M106,210 Q100,100 200,95 Q300,100 294,210 Q314,260 297,302 Q318,348 300,392 Q320,432 296,452 Q200,478 104,452 Q80,432 100,392 Q82,348 103,302 Q86,260 106,210Z', f); break;
      case 'chanel': s = p('M104,210 Q100,100 200,95 Q300,100 296,210 L302,312 Q250,322 200,320 Q150,322 98,312Z', f); break;
      case 'cacheado':
        var r = sorteio(7);
        s += p('M96,230 Q92,330 120,350 L280,350 Q308,330 304,230Z', f);
        for (var i = 0; i <= 24; i++) { var a = -0.75 + i * (Math.PI + 1.5) / 24; s += circ(200 + Math.cos(a) * 112, 222 - Math.sin(a) * 118, 32 + r() * 8, f); }
        break;
      case 'rabo': s = p('M248,118 Q336,104 324,226 Q318,312 290,372 Q300,300 284,226 Q276,160 250,140Z', f) + circ(262, 128, 9, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }); break;
      case 'chiquinhas': s = dois('M120,158 Q58,176 66,292 Q72,364 100,410 Q94,324 106,262 Q114,210 134,180Z', f); break;
      case 'coque': if (e.cabeca !== 'chapeu' && e.cabeca !== 'gorro') s = circ(200, 96, 40, f) + linha2('M172,90 Q200,70 228,92', cabE) + linha2('M170,104 Q200,84 230,106', cabE); break;
      case 'trancas': s = ''; break;
    }
    return s;
  }
  function linha2(d, c) { return p(d, { fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6 }); }
  function cabeloFrente(e, I, cab, cabE) {
    var f = { fill: 'url(#' + I + 'cab)', stroke: cabE, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, s = '', brilho = true;
    var franja = 'M108,222 Q104,102 200,99 Q296,102 292,222 Q284,160 258,140 Q220,170 160,150 Q128,170 118,224Z';
    var liso = 'M110,214 Q104,104 200,100 Q296,104 290,214 Q282,150 246,132 Q200,124 154,132 Q118,150 110,214Z';
    switch (e.cabelo) {
      case 'longo': s = p(franja, f) + dois(MECHA_LISA, f); break;
      case 'ondulado': s = p(franja, f) + dois('M108,206 Q94,258 112,300 Q94,342 118,386 L140,382 Q124,340 142,302 Q126,272 120,250 Q116,232 116,220Z', f); break;
      case 'chanel': s = p('M106,238 Q100,102 200,97 Q300,102 294,238 L286,166 Q200,178 114,166Z', f) + dois('M104,200 L98,302 L128,306 Q122,270 118,240 L116,206Z', f); break;
      case 'cacheado':
        var r = sorteio(3);
        for (var i = 0; i < 9; i++) { var a = Math.PI * 1.08 + i * Math.PI * 0.84 / 8; s += circ(200 + Math.cos(a) * 82, 196 + Math.sin(a) * 78, 21 + r() * 6, f); }
        brilho = false; break;
      case 'rabo': case 'coque': case 'coqueDuplo': s = p(liso, f); break;
      case 'cortina': s = p('M110,214 Q104,104 200,100 Q296,104 290,214 Q284,164 250,148 Q222,140 204,124 L196,124 Q178,140 150,148 Q116,164 110,214Z', f) + dois(MECHA_LISA, f); break;
      case 'lob': s = p(franja, f) + dois('M108,206 Q94,258 112,300 Q100,330 118,346 L136,342 Q124,320 142,302 Q126,272 120,250 Q116,232 116,220Z', f); break;
      case 'rabinhoAlto': s = p(liso, f) + circ(200, 86, 10, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }); break;
      case 'coroaTranca':
        s = p(liso, f);
        for (var ct = 0; ct <= 14; ct++) { var tt = ct / 14, cx2 = (1 - tt) * (1 - tt) * 112 + 2 * (1 - tt) * tt * 200 + tt * tt * 288, cy2 = (1 - tt) * (1 - tt) * 196 + 2 * (1 - tt) * tt * 70 + tt * tt * 196; s += elip(cx2, cy2, 12, 9, Object.assign({ transform: 'rotate(' + Math.round(-60 + tt * 120) + ' ' + n(cx2) + ' ' + n(cy2) + ')' }, f)); }
        break;
      case 'coqueBaguncado': s = p(liso, f) + p('M126,176 Q112,222 124,262', { fill: 'none', stroke: cab, 'stroke-width': 4.5, 'stroke-linecap': 'round' }) + p('M274,176 Q288,222 276,262', { fill: 'none', stroke: cab, 'stroke-width': 4.5, 'stroke-linecap': 'round' }); break;
      case 'cachosCurtos': for (var c4 = 0; c4 < 9; c4++) { var a4 = Math.PI * 1.1 + c4 * Math.PI * 0.8 / 8; s += circ(200 + Math.cos(a4) * 84, 192 + Math.sin(a4) * 76, 16, f); } brilho = false; break;
      case 'ondasLongas': s = p(franja, f) + dois('M108,206 Q92,260 112,310 Q92,360 116,410 Q96,460 120,510 L140,506 Q120,460 138,410 Q118,360 142,312 Q126,276 120,252 Q116,232 116,220Z', f); break;
      case 'franjinha': s = p('M108,236 Q100,102 200,97 Q300,102 292,236 L284,150 Q200,158 116,150Z', f) + dois(MECHA_LISA, f); break;
      case 'chiquinhasBaixas':
        s = p('M110,214 Q104,104 200,100 Q296,104 290,214 Q280,150 206,128 L200,104 L194,128 Q120,150 110,214Z', f) + dois('M116,236 Q82,282 94,362 Q102,412 124,444 Q118,382 122,322 Q126,282 136,256Z', f);
        s += circ(124, 248, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }) + circ(276, 248, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 });
        break;
      case 'dreads':
        s = p('M110,214 Q104,104 200,100 Q296,104 290,214 Q280,150 206,128 L200,104 L194,128 Q120,150 110,214Z', f);
        [-1, 1].forEach(function (ld) { for (var kd = 0; kd < 3; kd++) { var xd = 200 + ld * (98 - kd * 7); s += p('M' + xd + ',206 Q' + (xd + ld * 6) + ',320 ' + (xd - ld * 2) + ',' + (430 - kd * 10), { fill: 'none', stroke: cab, 'stroke-width': 9, 'stroke-linecap': 'round' }) + p('M' + xd + ',206 Q' + (xd + ld * 6) + ',320 ' + (xd - ld * 2) + ',' + (430 - kd * 10), { fill: 'none', stroke: cabE, 'stroke-width': 9, 'stroke-dasharray': '2 9', opacity: 0.5 }) + ret(xd - ld * 2 - 5, 380 - kd * 20, 10, 6, { fill: '#f2c14e', rx: 2 }); } });
        break;
      case 'ondasLado':
        s = p('M108,226 Q104,100 200,98 Q296,100 294,210 Q280,146 230,140 Q180,150 150,176 Q124,196 116,226Z', f) +
          p('M262,140 Q332,188 314,280 Q334,340 306,400 Q322,452 292,484 L264,474 Q288,424 272,382 Q292,322 274,272 Q290,220 252,184Z', f);
        break;
      case 'cacheadoLongo':
        s = p(franja, f);
        for (var r5 = 0; r5 < 9; r5++) { s += circ(112 - (r5 % 2) * 3, 226 + r5 * 26, 11, f) + circ(288 + (r5 % 2) * 3, 226 + r5 * 26, 11, f); }
        break;
      case 'franja': s = p('M106,238 Q100,102 200,97 Q300,102 294,238 L286,166 Q200,178 114,166Z', f) + dois(MECHA_LISA, f); break;
      case 'meio': s = p(franja, f) + dois(MECHA_LISA, f); break;
      case 'afro': s = p('M110,206 Q106,112 200,106 Q294,112 290,206 Q280,150 200,142 Q120,150 110,206Z', f); for (var h = 0; h < 7; h++) s += circ(132 + h * 22.5, 140 - Math.sin(h / 6 * Math.PI) * 18, 12, f); brilho = false; break;
      case 'puffs': s = p(liso, f) + circ(140, 132, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }) + circ(260, 132, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }); break;
      case 'lateral': s = p(liso, f) + p('M118,160 Q72,190 82,282 Q88,352 120,404 Q112,322 114,262 Q114,212 124,180Z', f) + circ(120, 168, 9, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }); break;
      case 'trancaLado':
        s = p(liso, f);
        for (var tl = 0; tl < 11; tl++) s += elip(110 + tl * 3.4 + (tl % 2 ? 4 : -4), 232 + tl * 23, 17 - tl * 0.5, 14, f);
        s += circ(146, 488, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 });
        break;
      case 'pixie': s = p('M108,224 Q104,100 200,98 Q296,100 292,224 Q290,170 268,150 Q220,182 150,156 Q124,176 116,226Z', f) + dois('M110,198 L106,252 L121,246 L118,206Z', f); break;
      case 'sereia': s = p(franja, f) + dois('M108,206 Q92,260 112,310 Q92,360 116,410 Q96,460 120,510 L140,506 Q120,460 138,410 Q118,360 142,312 Q126,276 120,252 Q116,232 116,220Z', f); break;
      case 'box':
        s = p('M110,214 Q104,104 200,100 Q296,104 290,214 Q280,150 206,128 L200,104 L194,128 Q120,150 110,214Z', f);
        [-1, 1].forEach(function (lado) { for (var k = 0; k < 4; k++) { var x0 = 200 + lado * (96 - k * 5); s += p('M' + x0 + ',214 Q' + (x0 + lado * 8) + ',330 ' + (x0 - lado * 2) + ',' + (452 - k * 8), { fill: 'none', stroke: cab, 'stroke-width': 7, 'stroke-linecap': 'round' }) + p('M' + x0 + ',214 Q' + (x0 + lado * 8) + ',330 ' + (x0 - lado * 2) + ',' + (452 - k * 8), { fill: 'none', stroke: cabE, 'stroke-width': 2, 'stroke-dasharray': '3 4' }) + circ(x0 - lado * 2, 456 - k * 8, 4, { fill: ['#ffd23f', '#ff5fb4', '#7ee8ff', '#fff'][k] }); } });
        break;
      case 'chiquinhas': s = p(franja, f) + circ(118, 168, 9, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }) + circ(282, 168, 9, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }); break;
      case 'trancas':
        s = p('M110,214 Q104,104 200,100 Q296,104 290,214 Q280,150 206,128 L200,104 L194,128 Q120,150 110,214Z', f);
        for (var k = 0; k < 10; k++) {
          var y = 236 + k * 23, dx = (k % 2 ? 4 : -4) + k * 1.6;
          s += elip(110 + dx, y, 16 - k * 0.4, 14, f) + elip(290 - dx, y, 16 - k * 0.4, 14, f);
        }
        s += circ(126, 470, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 }) + circ(274, 470, 8, { fill: '#ff4fa3', stroke: '#c22a78', 'stroke-width': 2 });
        break;
    }
    if (e.mechas === 'frente') { var mc = P.cor('cabelo', e.mechasCor).hex; s += p('M152,112 Q136,150 124,214', { fill: 'none', stroke: mc, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.9 }) + p('M246,110 Q266,148 278,210', { fill: 'none', stroke: mc, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.9 }); }
    if (brilho) s += p(BRILHO_CAB, { fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.28 });
    return s;
  }

  // ---------- cabeça de perfil (virada para a direita; o espelho vira para a esquerda) ----------
  var PERFIL = 'M196,108 C246,108 266,132 270,170 C272,186 274,196 270,210 C276,222 288,232 292,238 Q294,246 284,248 L278,250 Q280,256 284,260 Q285,265 276,267 Q284,270 282,276 Q278,282 272,284 Q276,294 266,300 C246,306 222,302 206,292 C170,296 130,280 118,236 C108,180 130,108 196,108Z';
  function perfilCabeca(e, I, C, pele, peleE, cab, cabE, vis, peca) {
    var s = '', sob = mistura(cab, '#2a1c1a', 0.45), som = C('sombra'), del = C('delineado').hex, cil = C('cilios').hex;
    function lin(d, cor, w, op2) { return p(d, { fill: 'none', stroke: cor, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: op2 }); }
    // pescoço e cabeça
    s += p('M178,272 L222,278 L226,322 L176,322Z', { fill: pele, stroke: peleE, 'stroke-width': 2 }) + p('M180,296 L222,300 L224,312 L178,310Z', { fill: '#000', opacity: 0.07 });
    s += p(PERFIL, { fill: 'url(#' + I + 'pele)', stroke: peleE, 'stroke-width': 2.2 });
    if (e.base === 'natural') s += p(PERFIL, { fill: mistura(pele, '#ffd9c7', 0.3), opacity: 0.45 });
    if (e.base === 'bronze') s += p(PERFIL, { fill: '#c8743f', opacity: 0.13 });
    if (e.base === 'iluminada') s += elip(250, 234, 14, 6, { fill: '#fff', opacity: 0.45, transform: 'rotate(-15 250 234)' }) + elip(280, 226, 3, 9, { fill: '#fff', opacity: 0.45, transform: 'rotate(-35 280 226)' });
    if (e.base === 'sardas') [[244, 238], [254, 236], [250, 246], [262, 240], [240, 248]].forEach(function (q) { s += circ(q[0], q[1], 2, { fill: esc(pele, 0.35), opacity: 0.7 }); });
    // blush
    if (e.blush === 'redondo' || e.blush === 'diagonal') s += elip(244, 250, 22, e.blush === 'diagonal' ? 10 : 20, { fill: 'url(#' + I + 'blush)' });
    if (e.blush === 'coracao') s += p(coracao(244, 250, 10), { fill: C('blush').hex, opacity: 0.75 });
    // olho de lado
    var lid = 'M239,208 Q252,197 265,206';
    if (e.sombra !== 'nenhum') {
      var cores = e.sombra === 'arco' ? ['#7cc8ff', '#ffe066', '#ff8fc8'] : [som.hex];
      cores.forEach(function (c2, k) { s += p('M237,207 Q252,' + (184 + k * 5) + ' 269,203 Q252,196 237,207Z', { fill: c2, opacity: e.sombra === 'esfumada' ? 0.5 : 0.82 }); });
      if (e.sombra === 'brilhante') s += p(estrela4(260, 194, 3.5), { fill: '#fff' });
    }
    s += p('M240,209 Q252,198 264,207 Q256,219 240,209Z', { fill: '#fff' });
    s += '<g clip-path="url(#' + I + 'olhoP)">' + circ(256, 209, 8.6, { fill: 'url(#' + I + 'iris)' }) + circ(258, 209, 4.2, { fill: '#1d1420' }) + circ(260, 205.5, 2.3, { fill: '#fff' }) + '</g>';
    s += lin(lid, '#2a1c1a', 3);
    if (e.delineado !== 'nenhum') s += lin(lid, del, e.delineado === 'grosso' ? 5.5 : 3.6) + (e.delineado === 'gatinho' ? p('M262,206 L276,197 L263,202Z', { fill: del, stroke: del, 'stroke-width': 1.5 }) : '');
    var nCil = { curtos: 3, longos: 4, boneca: 6, gatinho: 5, volume: 7, baixo: 4, arco: 6, strass: 4 }[e.cilios] || 3;
    var tam = { curtos: 7, longos: 11, boneca: 14, gatinho: 12, volume: 12, baixo: 10, arco: 12, strass: 11 }[e.cilios] || 7;
    var arco = ['#ff5a6e', '#ff9f1c', '#ffd23f', '#5cc46a', '#5ac8ff', '#7a5cff', '#d05cff'];
    for (var i = 0; i < nCil; i++) {
      var t = 0.45 + i * 0.55 / Math.max(1, nCil - 1), x = (1 - t) * (1 - t) * 239 + 2 * (1 - t) * t * 252 + t * t * 265, y = (1 - t) * (1 - t) * 208 + 2 * (1 - t) * t * 197 + t * t * 206;
      var L = tam * (0.6 + t * 0.5);
      s += lin('M' + n(x) + ',' + n(y) + ' Q' + n(x + L * 0.5) + ',' + n(y - L * 0.7) + ' ' + n(x + L * 0.95) + ',' + n(y - L * 0.55), e.cilios === 'arco' ? arco[i % arco.length] : cil, e.cilios === 'boneca' ? 2.8 : 2.2);
    }
    if (e.cilios === 'boneca' || e.cilios === 'baixo') s += lin('M252,216 L254,222 M258,215 L261,220', cil, 1.8);
    if (e.cilios === 'strass') s += circ(250, 199, 2.2, { fill: '#fff', stroke: '#ff9fd2', 'stroke-width': 1 });
    s += lin('M240,190 Q254,182 268,188', sob, 5);
    s += lin('M279,245 Q284,247 287,244', esc(pele, 0.3), 2);
    // boca de lado
    var cima = 'M274,262 Q283,258 285,263 Q281,267 272,266Z', baixo = 'M272,267 Q283,268 282,274 Q278,280 271,276Z';
    if (e.batom === 'nenhum') { var nat = mistura(pele, '#e0707a', 0.4); s += p(cima, { fill: esc(nat, 0.08) }) + p(baixo, { fill: nat }); }
    else {
      var bc = C('batom').hex; s += p(cima, { fill: esc(bc, 0.1) }) + p(baixo, { fill: e.batom === 'degrade' ? cla(bc, 0.3) : bc });
      if (e.batom === 'gloss') s += elip(278, 272, 3.5, 1.6, { fill: '#fff', opacity: 0.75 });
      if (e.batom === 'brilho') s += circ(276, 271, 1.2, { fill: '#fff' }) + circ(280, 274, 1.2, { fill: '#fff' });
    }
    s += lin('M271,266 L283,265', esc(pele, 0.45), 1.4);
    if (vis('adesivo')) s += adesivo(e.adesivo, 232, 244, 10);
    if (e.glitter === 'bochechas' || e.glitter === 'olhos') [[236, 238], [250, 256], [228, 252], [262, 196], [232, 204]].forEach(function (q, k) { s += p(estrela4(q[0], q[1], 3 + k % 2), { fill: C('glitter').id === 'arco' ? arco[k] : C('glitter').hex }); });
    // cabelo de perfil: cobre o alto e a parte de trás da cabeça; a franja fica na testa
    var f = { fill: 'url(#' + I + 'cab)', stroke: cabE, 'stroke-width': 2.2, 'stroke-linejoin': 'round' };
    var curto = ['pixie', 'chanel', 'rabo', 'coque', 'coqueDuplo', 'puffs', 'afro', 'cacheado', 'cachosCurtos', 'rabinhoAlto', 'coroaTranca', 'coqueBaguncado', 'lob'].indexOf(e.cabelo) >= 0;
    s += p('M270,180 Q274,110 198,100 Q122,100 110,168 Q102,236 ' + (curto ? '136,276 L160,280' : '124,300 L152,304') + ' Q146,250 154,222 Q168,206 182,200 Q190,174 214,160 Q246,150 270,180Z', f);
    if (['franja', 'chanel', 'franjinha', 'cortina'].indexOf(e.cabelo) >= 0) s += p('M272,184 Q276,150 254,134 L238,170 Q256,166 272,184Z', f);
    if (e.cabelo === 'cacheado' || e.cabelo === 'afro') for (var c3 = 0; c3 < 7; c3++) s += circ(130 + c3 * 20, 112 - Math.sin(c3 / 6 * Math.PI) * 10, 18, f);
    s += p('M150,124 Q196,104 246,124', { fill: 'none', stroke: '#fff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.25 });
    if (e.mechas === 'frente') s += lin('M250,124 Q262,150 266,176', P.cor('cabelo', e.mechasCor).hex, 7, 0.9);
    // orelha, brinco e óculos
    s += elip(186, 216, 11, 16, { fill: pele, stroke: peleE, 'stroke-width': 2 }) + lin('M188,206 Q180,216 188,226', esc(pele, 0.25), 1.8);
    if (vis('brincos')) s += '<g transform="translate(-98 0)">' + brincos(e.brincos, C('brincos'), I, false, true) + '</g>';
    if (vis('oculos')) {
      var oc = C('oculos').hex;
      s += lin('M256,204 L188,206', oc, 3.2) + elip(258, 212, 6, 17, { fill: e.oculos === 'sol' ? mistura(oc, '#1d1420', 0.6) : '#fff', opacity: e.oculos === 'sol' ? 0.85 : 0.2, stroke: oc, 'stroke-width': 3.5 });
    }
    return s;
  }

  // ---------- mãos: palma, 4 dedos e polegar (do lado de dentro, virado para o corpo) ----------
  // dedos vistos de fora para dentro: mindinho, anelar, médio, indicador. lado -1 = mão da esquerda da imagem.
  var DEDOS = [[-7, 10], [-2.4, 12.5], [2.4, 13], [7, 11]];
  function dedos(x, lado) { return DEDOS.map(function (d) { var dx = d[0] * -lado; return 'M' + n(x + dx) + ',506 L' + n(x + dx * 1.18) + ',' + n(506 + d[1]); }).join(' ') + ' M' + n(x - lado * 8) + ',496 L' + n(x - lado * 14) + ',508'; }
  function mao(x, lado, pele, peleE, esmalte) {
    var d = dedos(x, lado);
    var s = p(d, { fill: 'none', stroke: peleE, 'stroke-width': 7.4, 'stroke-linecap': 'round' }) + elip(x, 501, 12, 12.5, { fill: pele, stroke: peleE, 'stroke-width': 2 }) +
      p(d, { fill: 'none', stroke: pele, 'stroke-width': 5, 'stroke-linecap': 'round' }) + elip(x, 501, 10.6, 11, { fill: pele }) +
      elip(x - lado * 2, 497, 5, 3.5, { fill: '#fff', opacity: 0.18 });
    // unhas: na ponta de cada dedo e do polegar
    var pontas = DEDOS.map(function (q) { var dx = q[0] * -lado; return [x + dx * 1.18, 506 + q[1] - 1.4]; });
    pontas.push([x - lado * 14 + lado * 1.2, 506.6]);
    return s + unhas(pontas, esmalte, pele);
  }
  var ARCO_UNHA = ['#ff5a6e', '#ffd23f', '#5cc46a', '#5ac8ff', '#b892ff'];
  function unhas(pontas, esmalte, pele) {
    var s = '', tipo = esmalte ? esmalte.tipo : 'nenhum', cor = esmalte && esmalte.cor ? esmalte.cor.hex : '#ff4fa3';
    pontas.forEach(function (q, k) {
      var x = q[0], y = q[1], c = cor;
      if (tipo === 'nenhum') { s += elip(x, y, 1.8, 2.3, { fill: cla(pele, 0.45), stroke: esc(pele, 0.15), 'stroke-width': 0.4 }); return; }
      if (tipo === 'arco') c = ARCO_UNHA[k % ARCO_UNHA.length];
      if (tipo === 'degrade') c = mistura(cor, '#ffffff', k * 0.14);
      if (tipo === 'francesinha') c = '#ffd9df';
      s += elip(x, y, 2, 2.5, { fill: c, stroke: esc(c, 0.3), 'stroke-width': 0.5 });
      if (tipo === 'francesinha') s += elip(x, y + 1.2, 1.9, 1.1, { fill: '#fff' });
      if (tipo === 'glitter') s += circ(x - 0.6, y - 0.6, 0.5, { fill: '#fff' }) + circ(x + 0.7, y + 0.6, 0.4, { fill: '#fff' });
      if (tipo === 'bolinhas') s += circ(x, y, 0.65, { fill: '#fff' });
      if (tipo === 'coracao' && k === 2) s += p(coracao(x, y, 0.9), { fill: '#fff' });
      s += elip(x - 0.6, y - 0.9, 0.6, 0.9, { fill: '#fff', opacity: 0.6 });
    });
    return s;
  }
  function dedoDoAnel(x, lado) { var dx = DEDOS[1][0] * -lado; return [x + dx * 1.09, 515]; }

  // ---------- rosto ----------
  function formaOlho(cx) { var cy = 214; return 'M' + (cx - 22) + ',' + (cy - 2) + 'Q' + cx + ',' + (cy - 32) + ' ' + (cx + 22) + ',' + (cy - 2) + 'Q' + (cx + 20) + ',' + (cy + 24) + ' ' + cx + ',' + (cy + 24) + 'Q' + (cx - 20) + ',' + (cy + 24) + ' ' + (cx - 22) + ',' + (cy - 2) + 'Z'; }
  function base(tipo, pele, rosto) {
    if (tipo === 'natural') return p(rosto, { fill: mistura(pele, '#ffd9c7', 0.3), opacity: 0.45 });
    if (tipo === 'bronze') return p(rosto, { fill: '#c8743f', opacity: 0.13 }) + elip(150, 236, 22, 10, { fill: '#e0874a', opacity: 0.18 }) + elip(250, 236, 22, 10, { fill: '#e0874a', opacity: 0.18 });
    if (tipo === 'iluminada') return elip(148, 236, 17, 7, { fill: '#fff', opacity: 0.45, transform: 'rotate(-18 148 236)' }) + elip(252, 236, 17, 7, { fill: '#fff', opacity: 0.45, transform: 'rotate(18 252 236)' }) +
      elip(200, 236, 3.5, 11, { fill: '#fff', opacity: 0.5 }) + elip(200, 150, 26, 8, { fill: '#fff', opacity: 0.32 });
    if (tipo === 'sardas') { var s = '', pts = [[150, 240], [160, 246], [145, 250], [170, 240], [158, 234], [250, 240], [240, 246], [255, 250], [230, 240], [242, 234], [192, 238], [208, 238]]; pts.forEach(function (q) { s += circ(q[0], q[1], 2, { fill: esc(pele, 0.35), opacity: 0.7 }); }); return s; }
    return '';
  }
  function blush(e, cor, I) {
    if (e.blush === 'redondo') return circ(150, 252, 24, { fill: 'url(#' + I + 'blush)' }) + circ(250, 252, 24, { fill: 'url(#' + I + 'blush)' });
    if (e.blush === 'coracao') return p(coracao(150, 252, 10), { fill: cor, opacity: 0.75 }) + p(coracao(250, 252, 10), { fill: cor, opacity: 0.75 });
    if (e.blush === 'diagonal') return elip(152, 248, 24, 9, { fill: 'url(#' + I + 'blush)', transform: 'rotate(-22 152 248)' }) + elip(248, 248, 24, 9, { fill: 'url(#' + I + 'blush)', transform: 'rotate(22 248 248)' });
    return '';
  }
  function olho(cx, lado, e, I, C) {
    var cy = 214, s = '', som = C('sombra'), del = C('delineado').hex, cil = C('cilios').hex;
    function palpebra(alt, larg) { return 'M' + (cx - larg) + ',' + (cy - 2) + 'Q' + cx + ',' + (cy - alt) + ' ' + (cx + larg) + ',' + (cy - 2) + 'Q' + cx + ',' + (cy - alt * 0.55) + ' ' + (cx - larg) + ',' + (cy - 2) + 'Z'; }
    switch (e.sombra) {
      case 'simples': s += p(palpebra(40, 26), { fill: som.hex, opacity: 0.8 }); break;
      case 'esfumada': s += p(palpebra(52, 31), { fill: som.hex, opacity: 0.4 }) + p(palpebra(40, 26), { fill: esc(som.hex, 0.15), opacity: 0.75 }); break;
      case 'arco': s += p(palpebra(52, 30), { fill: '#7cc8ff', opacity: 0.8 }) + p(palpebra(45, 27), { fill: '#ffe066', opacity: 0.85 }) + p(palpebra(38, 25), { fill: '#ff8fc8', opacity: 0.9 }); break;
      case 'brilhante': s += p(palpebra(42, 27), { fill: som.hex, opacity: 0.85 }) + p(palpebra(42, 27), { fill: 'url(#' + I + 'shine)' }) + p(estrela4(cx + lado * 14, cy - 22, 4), { fill: '#fff' }) + circ(cx - lado * 6, cy - 20, 1.6, { fill: '#fff' }); break;
    }
    var forma = formaOlho(cx), clip = 'url(#' + I + (lado < 0 ? 'olhoE' : 'olhoD') + ')';
    s += p(forma, { fill: '#fff' });
    s += '<g clip-path="' + clip + '">' + circ(cx, cy + 4, 16, { fill: 'url(#' + I + 'iris)' }) + circ(cx, cy + 5, 7.5, { fill: '#1d1420' }) +
      circ(cx + 6, cy - 3, 5.2, { fill: '#fff' }) + circ(cx - 5, cy + 11, 2.6, { fill: '#fff', opacity: 0.85 }) + p('M' + (cx - 22) + ',' + (cy - 2) + 'Q' + cx + ',' + (cy - 32) + ' ' + (cx + 22) + ',' + (cy - 2) + 'L' + (cx + 22) + ',' + (cy + 2) + 'Q' + cx + ',' + (cy - 22) + ' ' + (cx - 22) + ',' + (cy + 2) + 'Z', { fill: '#000', opacity: 0.08 }) + '</g>';
    var lid = 'M' + (cx - 22) + ',' + (cy - 2) + 'Q' + cx + ',' + (cy - 32) + ' ' + (cx + 22) + ',' + (cy - 2);
    s += p(lid, { fill: 'none', stroke: '#2a1c1a', 'stroke-width': 3.2, 'stroke-linecap': 'round' });
    if (e.delineado === 'fino') s += p(lid, { fill: 'none', stroke: del, 'stroke-width': 3.6, 'stroke-linecap': 'round' });
    if (e.delineado === 'grosso') s += p(lid, { fill: 'none', stroke: del, 'stroke-width': 6.5, 'stroke-linecap': 'round' });
    if (e.delineado === 'gatinho') {
      var ox = cx + lado * 22;
      s += p(lid, { fill: 'none', stroke: del, 'stroke-width': 4.5, 'stroke-linecap': 'round' }) +
        p('M' + ox + ',' + (cy - 4) + 'L' + (cx + lado * 37) + ',' + (cy - 17) + 'L' + (cx + lado * 13) + ',' + (cy - 13) + 'Z', { fill: del, stroke: del, 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
    }
    // cílios: saem da pálpebra, mais compridos para fora
    var CIL = { curtos: [3, 8, 2.4, 0.45], longos: [5, 13, 2.4, 0.45], boneca: [7, 17, 3, 0.4], gatinho: [6, 12, 2.4, 0.35], volume: [11, 14, 2.6, 0.12], baixo: [5, 12, 2.4, 0.45], arco: [7, 14, 2.8, 0.3], strass: [5, 13, 2.4, 0.45] }[e.cilios] || [3, 8, 2.4, 0.45];
    var arco = ['#ff5a6e', '#ff9f1c', '#ffd23f', '#5cc46a', '#5ac8ff', '#7a5cff', '#d05cff'];
    function naPalpebra(t2) { return [(1 - t2) * (1 - t2) * (cx - 22) + 2 * (1 - t2) * t2 * cx + t2 * t2 * (cx + 22), (1 - t2) * (1 - t2) * (cy - 2) + 2 * (1 - t2) * t2 * (cy - 32) + t2 * t2 * (cy - 2)]; }
    for (var i = 0; i < CIL[0]; i++) {
      var t = CIL[0] === 1 ? 0.8 : CIL[3] + i * (1 - CIL[3]) / (CIL[0] - 1); if (lado < 0) t = 1 - t;
      var fora = lado > 0 ? t : 1 - t, q = naPalpebra(t), x = q[0], y = q[1];
      var ang = (t - 0.5) * 2.0 - Math.PI / 2, L = CIL[1] * (0.7 + Math.abs(t - 0.5) * 0.8);
      if (e.cilios === 'gatinho') L = CIL[1] * (0.35 + fora * fora * 1.3);
      var x2 = x + Math.cos(ang) * L, y2 = y + Math.sin(ang) * L;
      s += p('M' + n(x) + ',' + n(y) + 'Q' + n(x + Math.cos(ang) * L * 0.6) + ',' + n(y + Math.sin(ang) * L * 0.4 - 2) + ' ' + n(x2 + lado * 2) + ',' + n(y2), { fill: 'none', stroke: e.cilios === 'arco' ? arco[i % arco.length] : cil, 'stroke-width': CIL[2], 'stroke-linecap': 'round' });
    }
    if (e.cilios === 'boneca' || e.cilios === 'baixo') for (var k = 0; k < (e.cilios === 'baixo' ? 4 : 3); k++) { var bx = cx + lado * (2 + k * 6); s += p('M' + bx + ',' + (cy + 22) + 'L' + (bx + lado * 3) + ',' + (cy + 29), { stroke: cil, 'stroke-width': 2, 'stroke-linecap': 'round' }); }
    if (e.cilios === 'strass') [0.3, 0.5, 0.7].forEach(function (t3) { var g = naPalpebra(t3); s += circ(g[0], g[1] - 4, 2.4, { fill: '#fff', stroke: '#ff9fd2', 'stroke-width': 1 }); });
    return s;
  }
  function boca(e, cor, pele, I) {
    var cima = 'M182,266 Q191,259 200,264 Q209,259 218,266 Q200,272 182,266Z', baixo = 'M182,266 Q200,272 218,266 Q212,285 200,286 Q188,285 182,266Z';
    var meio = 'M182,266 Q200,273 218,266';
    if (e.batom === 'nenhum') { var nat = mistura(pele, '#e0707a', 0.4); return p(cima, { fill: esc(nat, 0.08) }) + p(baixo, { fill: nat }) + p(meio, { fill: 'none', stroke: esc(nat, 0.45), 'stroke-width': 1.8, 'stroke-linecap': 'round' }); }
    var c = cor.hex, fill = e.batom === 'degrade' ? 'url(#' + I + 'lab)' : c;
    var s = p(cima, { fill: esc(c, 0.1) }) + p(baixo, { fill: fill }) + p(cima, { fill: fill, opacity: 0.6 }) + p(meio, { fill: 'none', stroke: esc(c, 0.45), 'stroke-width': 1.8, 'stroke-linecap': 'round' }) + elip(203, 277, 5, 1.8, { fill: '#fff', opacity: 0.22 });
    if (e.batom === 'gloss') s += elip(201, 277, 8, 2.8, { fill: '#fff', opacity: 0.75 }) + elip(194, 264, 3, 1.4, { fill: '#fff', opacity: 0.6 });
    if (e.batom === 'brilho') [[190, 276], [198, 280], [207, 277], [213, 272], [186, 270], [203, 265]].forEach(function (q) { s += circ(q[0], q[1], 1.4, { fill: '#fff', opacity: 0.9 }); });
    return s;
  }
  function adesivo(tipo, x, y, s) {
    switch (tipo) {
      case 'coracao': return p(coracao(x, y, s * 0.8), { fill: '#ff4f8b', stroke: '#fff', 'stroke-width': 1.5 });
      case 'estrela': return p(estrela5(x, y, s, s * 0.45), { fill: '#ffd23f', stroke: '#e89a10', 'stroke-width': 1.3, 'stroke-linejoin': 'round' });
      case 'lua': return p('M' + (x + 3) + ',' + (y - s) + 'A' + s + ',' + s + ' 0 1 0 ' + (x + 3) + ',' + (y + s) + 'A' + (s * 0.72) + ',' + (s * 0.85) + ' 0 1 1 ' + (x + 3) + ',' + (y - s) + 'Z', { fill: '#ffe07a', stroke: '#e0a520', 'stroke-width': 1.3 });
      case 'borboleta': return elip(x - 6, y - 4, 7, 6, { fill: '#ff8fc8' }) + elip(x + 6, y - 4, 7, 6, { fill: '#ff8fc8' }) + elip(x - 5, y + 5, 5, 4, { fill: '#b892ff' }) + elip(x + 5, y + 5, 5, 4, { fill: '#b892ff' }) + p('M' + x + ',' + (y - 8) + 'L' + x + ',' + (y + 9), { stroke: '#4a2c20', 'stroke-width': 2, 'stroke-linecap': 'round' });
      case 'arco': return ['#ff5a6e', '#ffd23f', '#5ac8ff'].map(function (c, i) { var r = s - i * 3.2; return p('M' + (x - r) + ',' + (y + 4) + 'A' + r + ',' + r + ' 0 0 1 ' + (x + r) + ',' + (y + 4), { fill: 'none', stroke: c, 'stroke-width': 3.2 }); }).join('');
      case 'flor': return flor(x, y, s * 0.42, '#ff8fc8', '#ffd23f');
      case 'floco': var f = ''; for (var i = 0; i < 3; i++) { var a = i * Math.PI / 3; f += p('M' + n(x - Math.cos(a) * s) + ',' + n(y - Math.sin(a) * s) + 'L' + n(x + Math.cos(a) * s) + ',' + n(y + Math.sin(a) * s), { stroke: '#5ab4ff', 'stroke-width': 2.4, 'stroke-linecap': 'round' }); } return f + circ(x, y, 2.4, { fill: '#fff' });
      case 'concha': return p('M' + (x - s) + ',' + (y + 5) + 'Q' + (x - s * 1.1) + ',' + (y - s) + ' ' + x + ',' + (y - s) + 'Q' + (x + s * 1.1) + ',' + (y - s) + ' ' + (x + s) + ',' + (y + 5) + 'Q' + x + ',' + (y + s * 0.8) + ' ' + (x - s) + ',' + (y + 5) + 'Z', { fill: '#ffb3c8', stroke: '#e0708f', 'stroke-width': 1.4 }) +
        [-6, 0, 6].map(function (dx) { return p('M' + x + ',' + (y + 8) + 'L' + (x + dx) + ',' + (y - s + 3), { stroke: '#e0708f', 'stroke-width': 1.2 }); }).join('');
    }
    return '';
  }
  function glitter(e, cor, anim) {
    var r = sorteio({ bochechas: 11, olhos: 23, cabelo: 37, tudo: 51 }[e.glitter]), pts = [], i;
    var arco = ['#ff7cc8', '#ffd76a', '#7ee8ff', '#b892ff', '#86ecc8'];
    function em(cx, cy, rx, ry, q) { for (var k = 0; k < q; k++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()); pts.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d]); } }
    if (e.glitter === 'bochechas') { em(150, 250, 26, 18, 8); em(250, 250, 26, 18, 8); }
    if (e.glitter === 'olhos') { em(130, 200, 14, 26, 7); em(270, 200, 14, 26, 7); em(164, 178, 20, 6, 4); em(236, 178, 20, 6, 4); }
    if (e.glitter === 'cabelo') { em(200, 140, 100, 40, 22); if (['longo', 'ondulado', 'trancas', 'chiquinhas'].indexOf(e.cabelo) >= 0) { em(110, 320, 14, 100, 7); em(290, 320, 14, 100, 7); } }
    if (e.glitter === 'tudo') { for (i = 0; i < 46; i++) pts.push([70 + r() * 260, 90 + r() * 580]); }
    var s = '';
    pts.forEach(function (q, k) {
      var c = cor.id === 'arco' ? arco[k % arco.length] : cor.hex, tam = 2.5 + r() * 4.5, filho = '';
      if (anim) filho = '<animate attributeName="opacity" values="1;.2;1" dur="' + n(1 + r() * 1.4) + 's" begin="' + n(r() * 1.5) + 's" repeatCount="indefinite"/>';
      var d = k % 3 === 0 ? estrela4(q[0], q[1], tam + 2) : null;
      if (d) s += '<path d="' + d + '" fill="' + c + '" stroke="#fff" stroke-width=".6">' + filho + '</path>';
      else s += '<circle cx="' + n(q[0]) + '" cy="' + n(q[1]) + '" r="' + n(tam * 0.45) + '" fill="' + c + '">' + filho + '</circle>';
    });
    return s;
  }

  // ---------- roupas ----------
  function tronco(y2, alta) {
    return alta ? 'M140,368 Q137,346 152,341 L184,328 L216,328 L248,341 Q263,346 260,368 L251,' + y2 + ' Q200,' + (y2 + 7) + ' 149,' + y2 + 'Z'
      : 'M140,368 Q137,346 152,341 L182,336 Q200,354 218,336 L248,341 Q263,346 260,368 L251,' + y2 + ' Q200,' + (y2 + 7) + ' 149,' + y2 + 'Z';
  }
  var MANGA_CURTA = 'M152,340 Q133,344 127,368 L120,400 L150,407 L158,374Z';
  var MANGA_LONGA = 'M152,340 Q131,344 125,370 Q113,430 104,490 L132,496 Q141,432 158,378Z';
  var MANGA_BUFANTE = 'M152,338 Q124,330 120,364 Q120,390 146,392 Q160,380 158,350Z';
  function blusa(tipo, cor, peca, linha) {
    var c = esc(cor.hex, 0.3), s = '';
    switch (tipo) {
      case 'nenhum': s = peca('M162,344 L170,342 Q200,362 230,342 L238,344 Q250,354 250,376 L248,462 Q200,469 152,462 L150,376 Q150,354 162,344Z', { hex: '#fbf7ff' }, 'x'); break;
      case 'camiseta': s = peca([tronco(462), MANGA_CURTA, espelhar(MANGA_CURTA)], cor, 'blusa') + linha('M182,336 Q200,354 218,336', c, 3); break;
      case 'regata': s = peca('M157,343 L171,338 Q200,370 229,338 L243,343 Q254,352 254,372 L251,462 Q200,469 149,462 L146,372 Q146,352 157,343Z', cor, 'blusa'); break;
      case 'babados':
        s = peca([tronco(452), MANGA_BUFANTE, espelhar(MANGA_BUFANTE)], cor, 'blusa');
        var bab = 'M148,450'; for (var i = 0; i < 8; i++) bab += 'Q' + (154 + i * 13) + ',' + 476 + ' ' + (161 + i * 13) + ',' + 452;
        s += peca(bab + 'L253,452 L252,446 L148,446Z', { hex: cla(cor.hex, 0.25), brilho: cor.brilho }, 'x') + linha('M182,336 Q192,348 200,350 Q208,348 218,336', cla(cor.hex, 0.6), 5);
        break;
      case 'sueter':
        s = peca([tronco(470, true), MANGA_LONGA, espelhar(MANGA_LONGA)], cor, 'blusa') + peca('M182,320 L218,320 L218,338 Q200,344 182,338Z', { hex: esc(cor.hex, 0.08) }, 'x');
        s += linha('M150,460 L250,460', c, 2.5, 0.7) + linha('M106,482 L131,486', c, 2.5, 0.7) + linha('M294,482 L269,486', c, 2.5, 0.7);
        for (var k = 0; k < 6; k++) s += linha('M' + (176 + k * 9) + ',372 l4,6 l4,-6', cla(cor.hex, 0.5), 2, 0.8);
        break;
      case 'jaqueta':
        s = peca(tronco(462), { hex: '#fbf7ff' }, 'x') + peca(['M152,341 L184,334 L192,380 L180,465 L149,462 L140,368 Q137,346 152,341Z', espelhar('M152,341 L184,334 L192,380 L180,465 L149,462 L140,368 Q137,346 152,341Z'), MANGA_LONGA, espelhar(MANGA_LONGA)], cor, 'blusa');
        s += peca(['M184,334 L170,360 L192,380Z', espelhar('M184,334 L170,360 L192,380Z')], { hex: esc(cor.hex, 0.15) }, 'x') + circ(186, 410, 3, { fill: c }) + circ(186, 436, 3, { fill: c });
        break;
      case 'moletom':
        s = peca([tronco(472, true), MANGA_LONGA, espelhar(MANGA_LONGA)], cor, 'blusa') + peca('M156,344 Q200,312 244,344 Q232,362 200,358 Q168,362 156,344Z', { hex: esc(cor.hex, 0.12) }, 'x');
        s += peca('M170,420 L230,420 L238,458 L162,458Z', { hex: esc(cor.hex, 0.06) }, 'x') + linha('M192,354 L189,390', '#fff', 2.5) + linha('M208,354 L211,390', '#fff', 2.5) + circ(189, 392, 2.6, { fill: '#fff' }) + circ(211, 392, 2.6, { fill: '#fff' });
        break;
      case 'camisa':
        s = peca([tronco(462), MANGA_CURTA, espelhar(MANGA_CURTA)], cor, 'blusa') + linha('M200,350 L200,462', c, 1.6, 0.7);
        s += peca(['M184,334 L166,356 L198,362 L200,348Z', espelhar('M184,334 L166,356 L198,362 L200,348Z')], { hex: cla(cor.hex, 0.3) }, 'x');
        [376, 400, 424, 448].forEach(function (y) { s += circ(205, y, 2.8, { fill: '#fff', stroke: c, 'stroke-width': 1 }); });
        break;
      case 'ombro':
        s = peca(['M140,372 Q200,384 260,372 L251,462 Q200,469 149,462Z', 'M128,372 Q118,392 124,412 L150,408 Q152,388 146,374Z', espelhar('M128,372 Q118,392 124,412 L150,408 Q152,388 146,374Z')], cor, 'blusa');
        var ond = 'M130,360 Q200,374 270,360 L270,384'; for (var o2 = 0; o2 < 10; o2++) ond += 'Q' + n(263 - o2 * 14) + ',' + (398 - (o2 % 2) * 4) + ' ' + n(256 - o2 * 14) + ',384';
        s += peca(ond + 'Z', { hex: cla(cor.hex, 0.25), brilho: cor.brilho }, 'x');
        break;
      case 'laco': s = peca([tronco(462), MANGA_BUFANTE, espelhar(MANGA_BUFANTE)], cor, 'blusa') + laco(200, 348, 13, '#fbf7ff'); break;
      case 'colete':
        s = peca([tronco(462), MANGA_CURTA, espelhar(MANGA_CURTA)], { hex: '#fbf7ff' }, 'x');
        s += peca(['M150,342 L182,336 L194,392 L186,466 L149,462 L140,368 Q137,346 150,342Z', espelhar('M150,342 L182,336 L194,392 L186,466 L149,462 L140,368 Q137,346 150,342Z')], cor, 'blusa');
        s += circ(186, 410, 3, { fill: c }) + circ(186, 434, 3, { fill: c }) + circ(214, 410, 3, { fill: c }) + circ(214, 434, 3, { fill: c });
        break;
      case 'pijama':
        s = peca([tronco(468), MANGA_LONGA, espelhar(MANGA_LONGA)], cor, 'blusa') + peca(['M182,336 L166,348 L196,364Z', espelhar('M182,336 L166,348 L196,364Z')], { hex: '#fbf7ff' }, 'x');
        [380, 410, 440].forEach(function (y) { s += circ(200, y, 3.5, { fill: '#fff', stroke: c, 'stroke-width': 1.2 }); });
        s += linha('M200,360 L200,466', c, 1.6, 0.7);
        break;
    }
    return s;
  }
  function saia(tipo, cor, peca, linha) {
    var c = esc(cor.hex, 0.3), s = '';
    switch (tipo) {
      case 'curta': s = peca('M154,446 L246,446 L276,530 Q200,546 124,530Z', cor, 'saia') + linha('M180,452 L170,534', c, 1.6, 0.5) + linha('M220,452 L230,534', c, 1.6, 0.5); break;
      case 'tutu':
        [[0, 0.45, 112, 288, 516], [1, 0.2, 118, 282, 506], [2, 0, 128, 272, 494]].forEach(function (cam) {
          var d = 'M154,444 L246,444 L' + cam[3] + ',' + cam[4];
          for (var i = 0; i < 10; i++) { var x = cam[3] - (i + 0.5) * (cam[3] - cam[2]) / 10, x2 = cam[3] - (i + 1) * (cam[3] - cam[2]) / 10; d += 'L' + n(x) + ',' + (cam[4] + 12) + 'L' + n(x2) + ',' + cam[4]; }
          s += peca(d + 'Z', { hex: cla(cor.hex, cam[1]), brilho: cor.brilho }, 'x');
        });
        for (var k = 0; k < 7; k++) s += circ(140 + k * 20, 470 + (k % 2) * 14, 1.8, { fill: '#fff', opacity: 0.85 });
        break;
      case 'longa': s = peca('M154,446 L246,446 Q264,540 272,630 Q200,644 128,630 Q136,540 154,446Z', cor, 'saia') + linha('M186,456 Q180,540 172,636', c, 1.6, 0.45) + linha('M214,456 Q220,540 228,636', c, 1.6, 0.45); break;
      case 'balone': s = peca('M154,446 L246,446 Q292,488 262,530 Q200,544 138,530 Q108,488 154,446Z', cor, 'saia') + peca('M140,520 Q200,534 260,520 Q264,528 258,534 Q200,548 142,534 Q136,528 140,520Z', { hex: esc(cor.hex, 0.12), brilho: cor.brilho }, 'x'); break;
      case 'camadas':
        s = peca('M134,504 Q200,514 266,504 L280,542 Q200,556 120,542Z', { hex: cla(cor.hex, 0.32), brilho: cor.brilho }, 'x') + peca('M146,474 Q200,482 254,474 L266,508 Q200,518 134,508Z', { hex: cla(cor.hex, 0.16), brilho: cor.brilho }, 'x') + peca('M154,446 L246,446 L254,478 Q200,486 146,478Z', cor, 'saia');
        break;
      case 'jeans':
        var pesp = { fill: 'none', stroke: '#ffd166', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' };
        s = peca('M154,446 L246,446 L260,522 Q200,530 140,522Z', cor, 'saia') + p('M162,454 L150,516', pesp) + p(espelhar('M162,454 L150,516'), pesp) + p('M144,514 Q200,522 256,514', pesp) + p('M164,462 Q176,474 188,462', pesp) + circ(200, 452, 3, { fill: '#c9a352' });
        break;
      case 'pregas':
        s = peca('M154,446 L246,446 L266,526 L134,526Z', cor, 'saia');
        for (var j = 1; j < 7; j++) s += linha('M' + (154 + j * 13) + ',452 L' + (134 + j * 18.9) + ',526', c, 1.6, 0.6);
        break;
    }
    return s + peca('M152,440 L248,440 L248,453 L152,453Z', { hex: esc(cor.hex, 0.12), brilho: cor.brilho }, 'x');
  }
  function calca(tipo, cor, peca, linha, pele) {
    var c = esc(cor.hex, 0.3), s = '';
    switch (tipo) {
      case 'jeans': s = peca('M152,446 L248,446 L250,480 L244,642 L210,642 L203,494 L197,494 L190,642 L156,642 L150,480Z', cor, 'calca') + linha('M200,452 L200,494', c, 1.6) + linha('M160,462 Q172,474 184,462', c, 1.6, 0.7) + linha('M216,462 Q228,474 240,462', c, 1.6, 0.7); break;
      case 'shorts': s = peca('M152,446 L248,446 L256,514 L206,516 L200,486 L194,516 L144,514Z', cor, 'calca') + linha('M147,506 L195,508', cla(cor.hex, 0.4), 2, 0.8) + linha('M205,508 L253,506', cla(cor.hex, 0.4), 2, 0.8); break;
      case 'legging': s = peca('M154,446 L246,446 L242,642 L211,642 L202,496 L198,496 L189,642 L158,642Z', cor, 'calca'); break;
      case 'pantalona': s = peca('M152,446 L248,446 L253,500 L268,642 L208,642 L200,496 L192,642 L132,642 L147,500Z', cor, 'calca') + linha('M176,500 L164,640', c, 1.4, 0.5) + linha('M224,500 L236,640', c, 1.4, 0.5); break;
      case 'bermuda': s = peca('M152,446 L248,446 L254,560 L208,562 L201,492 L199,492 L192,562 L146,560Z', cor, 'calca') + peca(['M146,550 L192,552 L192,564 L146,562Z', 'M208,552 L254,550 L254,562 L208,564Z'], { hex: esc(cor.hex, 0.1), brilho: cor.brilho }, 'x'); break;
      case 'jogger':
        s = peca('M151,446 L249,446 L252,488 L246,624 L210,624 L202,494 L198,494 L190,624 L154,624 L148,488Z', cor, 'calca') + peca(['M156,616 L190,616 L188,642 L158,642Z', 'M210,616 L244,616 L242,642 L212,642Z'], { hex: esc(cor.hex, 0.15) }, 'x');
        s += linha('M152,470 L156,616', '#fff', 3, 0.8) + linha('M248,470 L244,616', '#fff', 3, 0.8) + linha('M194,452 L190,474', '#fff', 2) + linha('M206,452 L210,474', '#fff', 2);
        break;
      case 'rasgada':
        s = peca('M152,446 L248,446 L250,480 L244,642 L210,642 L203,494 L197,494 L190,642 L156,642 L150,480Z', cor, 'calca') + linha('M200,452 L200,494', c, 1.6);
        [[172, 560], [230, 576], [170, 602], [226, 524]].forEach(function (q) { s += elip(q[0], q[1], 8, 3.6, { fill: pele || '#f1c19c' }) + p('M' + (q[0] - 8) + ',' + (q[1] - 1) + ' L' + (q[0] + 8) + ',' + (q[1] - 1) + ' M' + (q[0] - 7) + ',' + (q[1] + 2) + ' L' + (q[0] + 7) + ',' + (q[1] + 2), { stroke: '#fff', 'stroke-width': 1.1 }); });
        break;
      case 'pijama': s = peca('M150,446 L250,446 L254,486 L252,628 L208,628 L201,494 L199,494 L192,628 L148,628 L146,486Z', cor, 'calca') + peca(['M148,616 L192,616 L192,630 L148,630Z', 'M208,616 L252,616 L252,630 L208,630Z'], { hex: '#fbf7ff' }, 'x'); break;
    }
    return s + peca('M152,440 L248,440 L248,452 L152,452Z', { hex: esc(cor.hex, 0.12), brilho: cor.brilho }, 'x');
  }
  function vestido(tipo, cor, peca, linha, pele, peleE) {
    var c = esc(cor.hex, 0.3), cl = cla(cor.hex, 0.35), s = '';
    var corpete = 'M146,366 Q140,350 154,344 L166,342 Q176,360 200,355 Q224,360 234,342 L246,344 Q260,350 254,366 L249,454 Q200,462 151,454Z';
    switch (tipo) {
      case 'princesa':
        s = peca('M151,446 Q200,458 249,446 Q292,520 320,642 Q200,676 80,642 Q108,520 151,446Z', cor, 'vestido');
        [[176, 120], [200, 200], [224, 280]].forEach(function (q) { s += linha('M' + q[0] + ',460 Q' + (q[0] + (q[1] - 200) * 0.2) + ',560 ' + q[1] + ',650', c, 1.8, 0.45); });
        var bainha = 'M84,640'; for (var i = 0; i < 12; i++) bainha += 'Q' + n(94 + i * 19.7) + ',' + (i % 2 ? 668 : 672) + ' ' + n(104 + i * 19.7) + ',' + (i === 11 ? 640 : 652);
        s += peca(bainha + 'L316,640 Q200,664 84,640Z', { hex: cl, brilho: cor.brilho }, 'x');
        s += peca(corpete, cor, 'vestido') + peca([MANGA_BUFANTE, espelhar(MANGA_BUFANTE)], { hex: cl, brilho: cor.brilho }, 'x');
        s += peca('M151,444 Q200,456 249,444 L249,456 Q200,468 151,456Z', { hex: esc(cor.hex, 0.15), brilho: cor.brilho }, 'x') + p(estrela5(200, 452, 8, 3.5), { fill: '#fff', stroke: c, 'stroke-width': 1 });
        break;
      case 'rodado':
        s = peca('M151,446 Q200,456 249,446 L288,548 Q200,570 112,548Z', cor, 'vestido') + peca([tronco(452), MANGA_BUFANTE, espelhar(MANGA_BUFANTE)], cor, 'vestido');
        s += linha('M180,456 L166,556', c, 1.6, 0.45) + linha('M220,456 L234,556', c, 1.6, 0.45) + peca('M151,442 L249,442 L249,454 L151,454Z', { hex: '#fbf7ff' }, 'x');
        break;
      case 'sereia':
        s = peca('M146,366 Q140,350 154,344 L166,342 Q200,364 234,342 L246,344 Q260,350 254,366 L248,452 Q254,520 241,586 Q264,630 300,664 Q200,680 100,664 Q136,630 159,586 Q146,520 152,452Z', cor, 'vestido');
        for (var r = 0; r < 4; r++) for (var k = 0; k < 4 + r; k++) s += p('M' + n(160 + k * (80 / (3 + r)) - r * 4) + ',' + (470 + r * 30) + 'q6,8 12,0', { fill: 'none', stroke: cl, 'stroke-width': 1.8, opacity: 0.8 });
        s += peca('M159,586 Q200,598 241,586 Q264,630 300,664 Q200,680 100,664 Q136,630 159,586Z', { hex: cla(cor.hex, 0.2), brilho: true }, 'x');
        s += circ(175, 350, 4, { fill: '#fff' }) + circ(225, 350, 4, { fill: '#fff' });
        break;
      case 'verao':
        s = peca('M160,344 L170,342 Q200,368 230,342 L240,344 Q252,356 250,380 L248,450 L282,568 Q200,584 118,568 L152,450 L150,380 Q148,356 160,344Z', cor, 'vestido');
        s += linha('M165,343 L162,330', c, 3) + linha('M235,343 L238,330', c, 3) + peca('M150,446 L250,446 L250,456 L150,456Z', { hex: '#fbf7ff' }, 'x');
        break;
      case 'festa':
        s = peca('M151,446 Q200,456 249,446 L284,540 Q200,560 116,540Z', cor, 'vestido');
        var tule = 'M151,450 L249,450 L296,548'; for (var t = 0; t < 12; t++) tule += 'L' + n(296 - (t + 0.5) * 16) + ',' + 564 + 'L' + n(296 - (t + 1) * 16) + ',548';
        s += p(tule + 'Z', { fill: cla(cor.hex, 0.55), opacity: 0.6, stroke: cla(cor.hex, 0.2), 'stroke-width': 1.5 });
        s += peca(corpete, cor, 'vestido') + laco(200, 452, 20, esc(cor.hex, 0.05));
        break;
      case 'gala':
        s = peca('M148,344 L172,336 L252,366 Q258,374 254,384 L250,452 Q262,540 272,642 Q200,660 128,642 Q138,540 150,452 L146,384 Q142,356 148,344Z', cor, 'vestido');
        s += linha('M190,462 Q184,560 176,646', c, 1.6, 0.45) + linha('M216,462 Q226,560 236,646', c, 1.6, 0.45) + p(estrela5(166, 348, 9, 4), { fill: '#fff', stroke: c, 'stroke-width': 1 });
        for (var g = 0; g < 9; g++) s += circ(142 + g * 15, 626 - (g % 2) * 10, 1.8, { fill: '#fff', opacity: 0.85 });
        break;
      case 'jardineira':
        s = peca([tronco(462), MANGA_CURTA, espelhar(MANGA_CURTA)], { hex: '#fbf7ff' }, 'x');
        s += peca('M166,372 L234,372 L238,446 L282,552 Q200,570 118,552 L162,446Z', cor, 'vestido') + peca(['M166,374 L158,342 L170,340 L178,374Z', espelhar('M166,374 L158,342 L170,340 L178,374Z')], cor, 'x');
        s += circ(172, 378, 3.2, { fill: '#ffd166', stroke: c }) + circ(228, 378, 3.2, { fill: '#ffd166', stroke: c }) + peca('M184,392 L216,392 L214,416 Q200,422 186,416Z', { hex: esc(cor.hex, 0.08) }, 'x');
        break;
      case 'macacao':
        s = peca('M157,343 L171,338 Q200,370 229,338 L243,343 Q254,352 254,372 L251,452 L253,500 L268,642 L208,642 L200,496 L192,642 L132,642 L147,500 L149,452 L146,372 Q146,352 157,343Z', cor, 'vestido');
        s += peca('M149,444 L251,444 L251,457 L149,457Z', { hex: esc(cor.hex, 0.18), brilho: cor.brilho }, 'x') + ret(192, 443, 16, 15, { fill: 'none', stroke: '#ffd166', 'stroke-width': 2.5, rx: 3 });
        break;
      case 'tomara':
        s = peca('M151,446 Q200,456 249,446 Q302,496 264,548 Q200,560 136,548 Q98,496 151,446Z', cor, 'vestido') + peca(corpete, cor, 'vestido');
        s += peca('M151,444 Q200,456 249,444 L249,456 Q200,468 151,456Z', { hex: cla(cor.hex, 0.3), brilho: cor.brilho }, 'x') + laco(200, 452, 10, cla(cor.hex, 0.35));
        break;
      case 'casaco':
        s = peca(['M140,368 Q137,346 152,341 L184,330 L216,330 L248,341 Q263,346 260,368 L270,562 Q200,574 130,562Z', MANGA_LONGA, espelhar(MANGA_LONGA)], cor, 'vestido') + linha('M200,362 L200,566', c, 1.8, 0.6);
        s += peca('M138,446 L262,446 L263,460 L137,460Z', { hex: esc(cor.hex, 0.18) }, 'x') + p('M168,334 Q200,352 232,334 Q236,348 226,362 Q200,372 174,362 Q164,348 168,334Z', { fill: '#fff6ec', stroke: '#e6d6c6', 'stroke-width': 1.5 });
        [392, 420, 486, 516].forEach(function (y) { s += circ(186, y, 3.2, { fill: c }) + circ(214, y, 3.2, { fill: c }); });
        break;
      case 'fada':
        s = peca('M151,446 Q200,456 249,446 L270,522 L252,506 L246,554 L226,522 L200,570 L174,522 L154,554 L148,506 L130,522Z', { hex: cla(cor.hex, 0.3), brilho: cor.brilho }, 'x');
        s += peca('M151,446 Q200,456 249,446 L262,506 L244,494 L234,532 L216,504 L200,540 L184,504 L166,532 L156,494 L138,506Z', cor, 'vestido') + peca(corpete, cor, 'vestido');
        for (var fz = 0; fz < 6; fz++) s += p(estrela4(150 + fz * 20, 480 + (fz % 2) * 26, 3.5), { fill: '#fff', opacity: 0.9 });
        break;
      case 'camisola':
        s = peca('M148,342 Q200,330 252,342 Q262,350 260,372 L272,602 Q200,616 128,602 L140,372 Q138,350 148,342Z', cor, 'vestido') + peca([MANGA_CURTA, espelhar(MANGA_CURTA)], cor, 'vestido');
        var renda = 'M130,598'; for (var q = 0; q < 10; q++) renda += 'Q' + n(137 + q * 14) + ',618 ' + n(144 + q * 14) + ',600';
        s += p(renda + 'L270,600 L270,594 L130,594Z', { fill: '#fff', stroke: '#e6dcf0', 'stroke-width': 1.5 }) + laco(200, 350, 9, '#ff8fc8');
        break;
    }
    return s;
  }
  function asas(cor) {
    var o = { fill: cla(cor.hex, 0.45), opacity: 0.78, stroke: '#fff', 'stroke-width': 2.5 };
    function asa(cx, cy, rx, ry, ang) { return elip(cx, cy, rx, ry, Object.assign({ transform: 'rotate(' + ang + ' ' + cx + ' ' + cy + ')' }, o)) + elip(cx, cy, rx * 0.55, ry * 0.45, { fill: '#fff', opacity: 0.35, transform: 'rotate(' + ang + ' ' + cx + ' ' + cy + ')' }); }
    return asa(92, 372, 88, 42, -30) + asa(108, 462, 60, 28, 26) + asa(308, 372, 88, 42, 30) + asa(292, 462, 60, 28, -26) +
      p(estrela4(48, 340, 7), { fill: '#fff' }) + p(estrela4(352, 340, 7), { fill: '#fff' }) + circ(84, 470, 3, { fill: '#fff' }) + circ(316, 470, 3, { fill: '#fff' });
  }
  function sapatos(e, cor, pele, peleE, peca) {
    var s = '', c = esc(cor.hex, 0.3), esmalte = { tipo: e.unhas, cor: P.cor('roupa', e.unhasCor) };
    function salto(x, alt, larg) { return p('M' + n(x - larg / 2) + ',656 L' + n(x + larg / 2) + ',656 L' + n(x + larg / 3) + ',' + (656 + alt) + ' L' + n(x - larg / 3) + ',' + (656 + alt) + 'Z', { fill: esc(cor.hex, 0.25), stroke: esc(cor.hex, 0.45), 'stroke-width': 1 }); }
    function bico(x) { return 'M' + (x - 16) + ',652 Q' + (x - 17) + ',634 ' + x + ',632 Q' + (x + 17) + ',634 ' + (x + 16) + ',652 Q' + x + ',661 ' + (x - 16) + ',652Z'; }
    function frente(x) { return 'M' + (x - 16) + ',645 Q' + x + ',639 ' + (x + 16) + ',645 L' + (x + 16) + ',652 Q' + x + ',661 ' + (x - 16) + ',652Z'; }
    function brilhos(x, q) { var t = ''; for (var k = 0; k < q; k++) t += circ(x - 12 + (k * 7) % 24, 632 + (k * 5) % 18, 1, { fill: '#fff', opacity: 0.9 }); return t; }
    [172, 228].forEach(function (x) {
      var pe = elip(x, 646, 15, 8, { fill: pele, stroke: peleE, 'stroke-width': 1.5 });
      switch (e.sapatos) {
        case 'nenhum':
          s += pe;
          var dedosPe = [-10, -5, 0, 5, 10].map(function (dx) { return [x + dx, 652 + Math.abs(dx) * 0.12]; });
          dedosPe.forEach(function (q) { s += circ(q[0], q[1], 2.8, { fill: pele, stroke: peleE, 'stroke-width': 0.9 }); });
          s += unhas(dedosPe.map(function (q) { return [q[0], q[1] - 0.2]; }), esmalte, pele);
          break;
        case 'princesa':
          s += pe + salto(x, 6, 7) + peca(frente(x), cor, 'x') + p(estrela4(x, 643, 3), { fill: '#fff' }) + laco(x, 641, 5, cla(cor.hex, 0.45)) + circ(x, 641, 1.8, { fill: '#7ee8ff', stroke: '#fff', 'stroke-width': 0.6 });
          break;
        case 'scarpin': s += pe + salto(x, 20, 4) + peca(frente(x), cor, 'x') + elip(x - 6, 648, 4, 1.4, { fill: '#fff', opacity: 0.5 }); break;
        case 'saltoMedio': s += pe + salto(x, 12, 9) + peca(frente(x), cor, 'x'); break;
        case 'saltoBaixo': s += pe + salto(x, 6, 4) + peca(frente(x), cor, 'x') + laco(x, 642, 4, esc(cor.hex, 0.1)); break;
        case 'plataforma':
          s += pe + p('M' + (x - 18) + ',650 L' + (x + 18) + ',650 L' + (x + 18) + ',668 Q' + x + ',672 ' + (x - 18) + ',668Z', { fill: cla(cor.hex, 0.35), stroke: c, 'stroke-width': 1.5 }) +
            p('M' + (x - 18) + ',660 L' + (x + 18) + ',660', { stroke: c, 'stroke-width': 1, opacity: 0.6 }) + p('M' + (x - 14) + ',641 L' + (x + 14) + ',641 M' + (x - 15) + ',648 L' + (x + 15) + ',648', { stroke: cor.hex, 'stroke-width': 4, 'stroke-linecap': 'round' });
          break;
        case 'anabela':
          s += pe + p('M' + (x - 17) + ',651 L' + (x + 17) + ',651 L' + (x + 18) + ',666 L' + (x - 18) + ',666Z', { fill: '#e8c98a', stroke: '#b8954e', 'stroke-width': 1.2 }) +
            p('M' + (x - 17) + ',656 L' + (x + 17) + ',656 M' + (x - 17) + ',661 L' + (x + 17) + ',661', { stroke: '#b8954e', 'stroke-width': 0.8, 'stroke-dasharray': '2 2' }) +
            p('M' + (x - 14) + ',642 L' + (x + 14) + ',646 M' + (x + 14) + ',642 L' + (x - 14) + ',646', { stroke: cor.hex, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
          break;
        case 'rasteirinha':
          s += pe + p('M' + (x - 17) + ',653 Q' + x + ',660 ' + (x + 17) + ',653 L' + (x + 17) + ',656 Q' + x + ',664 ' + (x - 17) + ',656Z', { fill: esc(cor.hex, 0.1) }) +
            p('M' + (x - 13) + ',640 L' + (x + 13) + ',650 M' + (x + 13) + ',640 L' + (x - 13) + ',650 M' + (x - 14) + ',628 L' + (x + 14) + ',628', { stroke: cor.hex, 'stroke-width': 2.4, 'stroke-linecap': 'round' }) + circ(x, 645, 2.4, { fill: '#fff' });
          break;
        case 'chineloFlor':
          s += pe + p('M' + (x - 17) + ',652 Q' + x + ',662 ' + (x + 17) + ',652 L' + (x + 17) + ',657 Q' + x + ',668 ' + (x - 17) + ',657Z', { fill: cor.hex, stroke: c, 'stroke-width': 1.5 }) +
            p('M' + (x - 14) + ',650 L' + x + ',640 L' + (x + 14) + ',650', { fill: 'none', stroke: esc(cor.hex, 0.15), 'stroke-width': 3.5, 'stroke-linecap': 'round' }) + flor(x, 640, 3.6, '#fff', '#ffd23f');
          break;
        case 'clog':
          s += peca('M' + (x - 20) + ',652 Q' + (x - 22) + ',628 ' + x + ',626 Q' + (x + 22) + ',628 ' + (x + 20) + ',652 Q' + x + ',662 ' + (x - 20) + ',652Z', cor, 'x');
          [[-8, 634], [0, 632], [8, 634], [-4, 640], [4, 640]].forEach(function (q) { s += circ(x + q[0], q[1], 1.8, { fill: esc(cor.hex, 0.35) }); });
          s += flor(x - 10, 645, 2.6, '#ff8fc8', '#fff3a0') + p(estrela5(x + 10, 645, 4, 1.8), { fill: '#ffd23f' });
          break;
        case 'mocassim':
          s += pe + peca('M' + (x - 17) + ',652 Q' + (x - 18) + ',634 ' + x + ',632 Q' + (x + 18) + ',634 ' + (x + 17) + ',652 Q' + x + ',661 ' + (x - 17) + ',652Z', cor, 'x') +
            p('M' + (x - 10) + ',638 Q' + x + ',634 ' + (x + 10) + ',638 L' + (x + 10) + ',642 L' + (x - 10) + ',642Z', { fill: esc(cor.hex, 0.15) }) + p('M' + (x - 4) + ',640 L' + (x + 4) + ',640', { stroke: '#2a1c1a', 'stroke-width': 1.4 });
          break;
        case 'social':
          s += peca(bico(x), cor, 'x') + p('M' + (x - 17) + ',653 Q' + x + ',661 ' + (x + 17) + ',653 L' + (x + 17) + ',656 Q' + x + ',665 ' + (x - 17) + ',656Z', { fill: esc(cor.hex, 0.5) }) +
            p('M' + (x - 5) + ',636 L' + (x + 5) + ',638 M' + (x - 5) + ',640 L' + (x + 5) + ',642 M' + (x + 5) + ',636 L' + (x - 5) + ',638', { stroke: cla(cor.hex, 0.5), 'stroke-width': 1.2 }) + elip(x + 7, 646, 4, 1.4, { fill: '#fff', opacity: 0.5 });
          break;
        case 'tenisAlto': case 'tenisLuz': case 'tenisGlitter':
          var alto = e.sapatos === 'tenisAlto';
          s += peca('M' + (x - 19) + ',652 L' + (x - 17) + ',' + (alto ? 600 : 628) + ' Q' + x + ',' + (alto ? 596 : 624) + ' ' + (x + 17) + ',' + (alto ? 600 : 628) + ' L' + (x + 19) + ',652 Q' + x + ',660 ' + (x - 19) + ',652Z', cor, 'x') +
            p('M' + (x - 20) + ',647 Q' + x + ',657 ' + (x + 20) + ',647 L' + (x + 20) + ',654 Q' + x + ',665 ' + (x - 20) + ',654Z', { fill: '#fff', stroke: '#c9c1d6', 'stroke-width': 1.5 }) +
            p('M' + (x - 7) + ',' + (alto ? 612 : 634) + ' L' + (x + 7) + ',' + (alto ? 612 : 634) + ' M' + (x - 7) + ',' + (alto ? 622 : 640) + ' L' + (x + 7) + ',' + (alto ? 622 : 640) + (alto ? ' M' + (x - 7) + ',632 L' + (x + 7) + ',632' : ''), { stroke: cor.id === 'branco' ? '#ff8fc8' : '#fff', 'stroke-width': 2, 'stroke-linecap': 'round' });
          if (alto) s += p(estrela5(x + 12, 624, 4.5, 2), { fill: '#fff' });
          if (e.sapatos === 'tenisLuz') { s += elip(x, 662, 20, 4, { fill: '#7ee8ff', opacity: 0.35 }); ARCO_UNHA.forEach(function (cc, k) { s += circ(x - 14 + k * 7, 656, 1.6, { fill: cc }); }); }
          if (e.sapatos === 'tenisGlitter') s += brilhos(x, 9);
          break;
        case 'botaCano':
          s += peca('M' + (x - 17) + ',536 L' + (x + 17) + ',536 L' + (x + 20) + ',650 Q' + x + ',663 ' + (x - 20) + ',650Z', cor, 'x') + p('M' + (x - 19) + ',532 L' + (x + 19) + ',532 L' + (x + 18) + ',546 L' + (x - 18) + ',546Z', { fill: esc(cor.hex, 0.15), stroke: c, 'stroke-width': 1 }) +
            p('M' + (x - 9) + ',556 L' + (x - 10) + ',640', { stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.35 });
          break;
        case 'botaNeve':
          s += peca('M' + (x - 19) + ',588 L' + (x + 19) + ',588 L' + (x + 22) + ',650 Q' + x + ',664 ' + (x - 22) + ',650Z', cor, 'x') + elip(x, 590, 24, 9, { fill: '#fff6ec', stroke: '#e6d6c6', 'stroke-width': 1.5 }) +
            [[-12, 588], [-4, 584], [6, 586], [14, 590]].map(function (q) { return circ(x + q[0], q[1], 5, { fill: '#fff6ec' }); }).join('') + p('M' + (x - 22) + ',652 Q' + x + ',664 ' + (x + 22) + ',652', { fill: 'none', stroke: esc(cor.hex, 0.4), 'stroke-width': 3 });
          break;
        case 'ponta':
          s += peca('M' + (x - 13) + ',652 Q' + (x - 15) + ',630 ' + x + ',628 Q' + (x + 15) + ',630 ' + (x + 13) + ',652 Q' + x + ',662 ' + (x - 13) + ',652Z', { hex: cla(cor.hex, 0.25), brilho: true }, 'x') +
            p('M' + (x - 12) + ',630 L' + (x + 13) + ',600 M' + (x + 12) + ',630 L' + (x - 13) + ',600 M' + (x - 13) + ',600 L' + (x + 13) + ',584 M' + (x + 13) + ',600 L' + (x - 13) + ',584', { stroke: cla(cor.hex, 0.1), 'stroke-width': 2.4, 'stroke-linecap': 'round' });
          break;
        case 'tenis':
          s += peca('M' + (x - 19) + ',652 Q' + (x - 21) + ',628 ' + x + ',626 Q' + (x + 21) + ',628 ' + (x + 19) + ',652 Q' + x + ',660 ' + (x - 19) + ',652Z', cor, 'x') +
            p('M' + (x - 20) + ',647 Q' + x + ',657 ' + (x + 20) + ',647 L' + (x + 20) + ',654 Q' + x + ',665 ' + (x - 20) + ',654Z', { fill: '#fff', stroke: '#c9c1d6', 'stroke-width': 1.5 }) +
            p('M' + (x - 7) + ',634 L' + (x + 7) + ',634 M' + (x - 7) + ',640 L' + (x + 7) + ',640', { stroke: cor.id === 'branco' ? '#ff8fc8' : '#fff', 'stroke-width': 2, 'stroke-linecap': 'round' });
          break;
        case 'sapatilha':
          s += pe + peca('M' + (x - 17) + ',652 Q' + (x - 19) + ',636 ' + (x - 9) + ',636 Q' + x + ',642 ' + (x + 9) + ',636 Q' + (x + 19) + ',636 ' + (x + 17) + ',652 Q' + x + ',661 ' + (x - 17) + ',652Z', cor, 'x') + laco(x, 640, 4.5, cla(cor.hex, 0.4));
          break;
        case 'sandalia':
          s += pe + p('M' + (x - 18) + ',652 Q' + x + ',660 ' + (x + 18) + ',652 L' + (x + 18) + ',657 Q' + x + ',666 ' + (x - 18) + ',657Z', { fill: esc(cor.hex, 0.1), stroke: c, 'stroke-width': 1.5 }) +
            p('M' + (x - 14) + ',642 L' + (x + 14) + ',642 M' + (x - 15) + ',650 L' + (x + 15) + ',650', { stroke: cor.hex, 'stroke-width': 4, 'stroke-linecap': 'round' }) + circ(x, 642, 3, { fill: '#fff' });
          break;
        case 'bota':
          s += peca('M' + (x - 18) + ',566 L' + (x + 18) + ',566 L' + (x + 20) + ',650 Q' + x + ',663 ' + (x - 20) + ',650Z', cor, 'x') +
            p('M' + (x - 21) + ',560 Q' + x + ',552 ' + (x + 21) + ',560 L' + (x + 21) + ',574 Q' + x + ',566 ' + (x - 21) + ',574Z', { fill: '#fff6ec', stroke: '#e6d6c6', 'stroke-width': 1.5 });
          break;
        case 'salto':
          s += pe + p('M' + (x - 16) + ',653 Q' + (x - 17) + ',634 ' + x + ',632 Q' + (x + 17) + ',634 ' + (x + 16) + ',653 Q' + x + ',662 ' + (x - 16) + ',653Z', { fill: cla(cor.hex, 0.35), opacity: 0.72, stroke: '#fff', 'stroke-width': 2 }) +
            p(estrela4(x - 6, 640, 4.5), { fill: '#fff' }) + circ(x + 7, 646, 1.6, { fill: '#fff' });
          break;
        case 'boneca':
          s += pe + peca('M' + (x - 17) + ',652 Q' + (x - 19) + ',634 ' + x + ',634 Q' + (x + 19) + ',634 ' + (x + 17) + ',652 Q' + x + ',661 ' + (x - 17) + ',652Z', cor, 'x') +
            p('M' + (x - 15) + ',640 L' + (x + 15) + ',640', { stroke: esc(cor.hex, 0.2), 'stroke-width': 3.5, 'stroke-linecap': 'round' }) + circ(x + 9, 640, 2.6, { fill: '#fff' });
          break;
        case 'patins':
          s += peca('M' + (x - 17) + ',596 L' + (x + 17) + ',596 L' + (x + 19) + ',648 Q' + x + ',656 ' + (x - 19) + ',648Z', cor, 'x') +
            p('M' + (x - 18) + ',592 L' + (x + 18) + ',592 L' + (x + 18) + ',604 L' + (x - 18) + ',604Z', { fill: '#fff', stroke: c, 'stroke-width': 1.2 }) +
            p('M' + (x - 7) + ',612 L' + (x + 7) + ',612 M' + (x - 7) + ',622 L' + (x + 7) + ',622 M' + (x - 7) + ',632 L' + (x + 7) + ',632', { stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round' }) +
            ret(x - 21, 648, 42, 6, { fill: '#9aa3b5', rx: 3 }) + circ(x - 13, 661, 6, { fill: '#ffd166', stroke: '#c9932a', 'stroke-width': 1.5 }) + circ(x + 13, 661, 6, { fill: '#ffd166', stroke: '#c9932a', 'stroke-width': 1.5 }) + circ(x - 13, 661, 2, { fill: '#fff' }) + circ(x + 13, 661, 2, { fill: '#fff' });
          break;
        case 'chinelo':
          s += pe + p('M' + (x - 17) + ',652 Q' + x + ',662 ' + (x + 17) + ',652 L' + (x + 17) + ',657 Q' + x + ',668 ' + (x - 17) + ',657Z', { fill: cor.hex, stroke: c, 'stroke-width': 1.5 }) +
            p('M' + (x - 14) + ',650 L' + x + ',640 L' + (x + 14) + ',650', { fill: 'none', stroke: esc(cor.hex, 0.15), 'stroke-width': 3.5, 'stroke-linecap': 'round' }) + circ(x, 640, 2.4, { fill: '#fff' });
          break;
        case 'galocha':
          s += peca('M' + (x - 19) + ',572 L' + (x + 19) + ',572 L' + (x + 20) + ',650 Q' + x + ',664 ' + (x - 20) + ',650Z', cor, 'x') +
            p('M' + (x - 11) + ',584 L' + (x - 12) + ',634', { stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.5 }) +
            p('M' + (x - 20) + ',646 Q' + x + ',658 ' + (x + 20) + ',646 L' + (x + 20) + ',652 Q' + x + ',666 ' + (x - 20) + ',652Z', { fill: esc(cor.hex, 0.25) });
          break;
        case 'pantufa':
          s += elip(x - 9, 628, 5, 11, { fill: cla(cor.hex, 0.2), stroke: c, 'stroke-width': 1.5 }) + elip(x + 9, 628, 5, 11, { fill: cla(cor.hex, 0.2), stroke: c, 'stroke-width': 1.5 }) +
            elip(x, 648, 25, 16, { fill: cla(cor.hex, 0.25), stroke: c, 'stroke-width': 2 }) + circ(x - 7, 644, 2.2, { fill: '#2a1c1a' }) + circ(x + 7, 644, 2.2, { fill: '#2a1c1a' }) + elip(x, 650, 3, 2, { fill: '#ff8fb1' });
          break;
      }
    });
    return s;
  }

  // ---------- acessórios ----------
  function bolsa(tipo, cor, peca, linha) {
    var c = esc(cor.hex, 0.3);
    switch (tipo) {
      case 'mao': return peca('M262,498 Q262,494 266,494 L306,494 Q310,494 310,498 L310,522 Q310,528 304,528 L268,528 Q262,528 262,522Z', cor, 'x') + p('M262,500 L286,514 L310,500', { fill: 'none', stroke: c, 'stroke-width': 2 }) + p(estrela4(286, 512, 6), { fill: '#fff', stroke: c, 'stroke-width': 0.8 });
      case 'ombro': return linha('M156,346 L280,486', esc(cor.hex, 0.2), 4) + peca('M268,480 Q268,474 274,474 L312,474 Q318,474 318,480 L318,514 Q318,520 312,520 L274,520 Q268,520 268,514Z', cor, 'x') + p('M268,478 L318,478 L314,498 Q293,506 272,498Z', { fill: esc(cor.hex, 0.12), stroke: c, 'stroke-width': 1.5 }) + circ(293, 500, 3, { fill: '#ffd23f' });
      case 'coracao': return linha('M274,504 Q290,478 306,504', c, 3.5) + peca(coracao(290, 524, 22), cor, 'x') + p(estrela4(282, 516, 5), { fill: '#fff', opacity: 0.9 });
      case 'cesta':
        var s = linha('M266,514 Q290,462 314,514', '#a86d38', 5) + p('M260,512 L320,512 L311,556 L269,556Z', { fill: '#d39a5c', stroke: '#a86d38', 'stroke-width': 2 });
        for (var i = 1; i < 4; i++) s += linha('M' + (261 + i * 0.5) + ',' + (512 + i * 11) + ' L' + (319 - i * 2.2) + ',' + (512 + i * 11), '#a86d38', 1.5, 0.8);
        for (var k = 0; k < 6; k++) s += ret(262 + k * 9.5, 504, 9.5, 9, { fill: k % 2 ? '#fff' : cor.hex });
        return s + ret(262, 504, 57, 9, { fill: 'none', stroke: c, 'stroke-width': 1.2 });
      case 'praia':
        var b = linha('M270,502 Q280,472 290,502', esc(cor.hex, 0.1), 4) + linha('M290,502 Q300,472 310,502', esc(cor.hex, 0.1), 4) + p('M262,500 L318,500 L312,550 L268,550Z', { fill: '#f0cf86', stroke: '#c9a352', 'stroke-width': 2 });
        for (var j = 0; j < 5; j++) b += linha('M' + (264 + j * 12) + ',502 L' + (270 + j * 10) + ',548', '#c9a352', 1.2, 0.7);
        return b + p('M264,516 L316,516 L315,526 L265,526Z', { fill: cor.hex, stroke: c, 'stroke-width': 1 });
    }
    return '';
  }
  function colar(tipo, cor, I) {
    var c = esc(cor.hex, 0.3), s = '', i, t;
    function no(t2) { return [(1 - t2) * (1 - t2) * 176 + 2 * (1 - t2) * t2 * 200 + t2 * t2 * 224, (1 - t2) * (1 - t2) * 334 + 2 * (1 - t2) * t2 * 368 + t2 * t2 * 334]; }
    var corrente = { fill: 'none', stroke: cor.brilho ? cor.hex : esc(cor.hex, 0.05), 'stroke-width': 1.8 };
    switch (tipo) {
      case 'perolas': for (i = 0; i <= 10; i++) { t = no(i / 10); s += circ(t[0], t[1], 4.6, { fill: cla(cor.hex, 0.55), stroke: c, 'stroke-width': 0.8 }) + circ(t[0] - 1.4, t[1] - 1.4, 1.3, { fill: '#fff' }); } break;
      case 'coracao': s = p('M176,334 Q200,368 224,334', corrente) + p(coracao(200, 360, 9), { fill: cor.hex, stroke: c, 'stroke-width': 1.5 }) + circ(197, 356, 1.8, { fill: '#fff' }); break;
      case 'gargantilha': s = p('M186,312 Q200,318 214,312 L214,322 Q200,328 186,322Z', { fill: cor.hex, stroke: c, 'stroke-width': 1.2 }) + p(estrela4(200, 326, 5), { fill: '#fff', stroke: c, 'stroke-width': 0.8 }); break;
      case 'estrela': s = p('M176,334 Q200,368 224,334', corrente) + p(estrela5(200, 362, 10, 4.5), { fill: cor.hex, stroke: c, 'stroke-width': 1.3, 'stroke-linejoin': 'round' }); break;
      case 'diamantes':
        for (i = 0; i <= 8; i++) { t = no(i / 8); s += p('M' + n(t[0]) + ',' + n(t[1] - 4.5) + 'L' + n(t[0] + 4) + ',' + n(t[1]) + 'L' + n(t[0]) + ',' + n(t[1] + 4.5) + 'L' + n(t[0] - 4) + ',' + n(t[1]) + 'Z', { fill: '#e6f6ff', stroke: cor.hex, 'stroke-width': 1.2 }); }
        s += p('M200,360 L208,368 L200,382 L192,368Z', { fill: '#e6f6ff', stroke: cor.hex, 'stroke-width': 1.6 }) + p(estrela4(206, 362, 4.5), { fill: '#fff' }) + p(estrela4(184, 352, 3), { fill: '#fff' });
        break;
      case 'medalhao': s = p('M176,334 Q200,368 224,334', corrente) + elip(200, 366, 9, 11, { fill: cor.hex, stroke: c, 'stroke-width': 1.5 }) + p(coracao(200, 366, 4), { fill: esc(cor.hex, 0.25) }) + elip(197, 361, 2, 3, { fill: '#fff', opacity: 0.7 }); break;
      case 'micangas': var cm = ['#ff5a6e', '#ffd23f', '#5cc46a', '#5ac8ff', '#b892ff', cor.hex]; for (i = 0; i <= 12; i++) { t = no(i / 12); s += circ(t[0], t[1], 3.6, { fill: cm[i % cm.length], stroke: '#fff', 'stroke-width': 0.8 }); } break;
      case 'lua': s = p('M176,334 Q200,368 224,334', corrente) + p('M204,352 C189,353 189,373 204,374 C197,368 197,358 204,352Z', { fill: cor.hex, stroke: c, 'stroke-width': 1.2 }); break;
      case 'concha': s = p('M176,334 Q200,368 224,334', corrente) + adesivo('concha', 200, 364, 10); break;
      case 'laco': s = p('M186,312 Q200,318 214,312 L214,322 Q200,328 186,322Z', { fill: cor.hex, stroke: c, 'stroke-width': 1.2 }) + laco(200, 320, 7, cor.hex); break;
      case 'duplo': s = p('M176,334 Q200,368 224,334', corrente) + p('M170,338 Q200,396 230,338', corrente) + circ(200, 351, 2.8, { fill: cor.hex }) + p(estrela5(200, 378, 7, 3), { fill: cor.hex, stroke: c, 'stroke-width': 1 }); break;
      case 'borboleta': s = p('M176,334 Q200,368 224,334', corrente) + adesivo('borboleta', 200, 364, 10); break;
      case 'flores':
        var cores = [cor.hex, '#ff8fc8', '#ffd23f', '#cfa8ff', '#86ecc8'];
        for (i = 0; i <= 9; i++) { t = i / 9; var x = (1 - t) * (1 - t) * 160 + 2 * (1 - t) * t * 200 + t * t * 240, y = (1 - t) * (1 - t) * 340 + 2 * (1 - t) * t * 396 + t * t * 340; s += flor(x, y, 5, cores[i % cores.length], '#fff3a0'); }
        break;
    }
    return s;
  }
  // pulseira no pulso esquerdo (da imagem), anel na mão esquerda (e na direita, em "nas duas mãos"), broche no peito
  function pulseira(tipo, cor) {
    var x = 120.5, y = 487, c = esc(cor.hex, 0.3), s = '', gira = 'rotate(-6 ' + x + ' ' + y + ')';
    // só a metade da frente (a de trás fica escondida atrás do pulso)
    function aro(yy, col, larg, extra) { return p('M' + (x - 13.5) + ',' + yy + ' A13.5,4.8 0 0 0 ' + (x + 13.5) + ',' + yy, Object.assign({ fill: 'none', stroke: col, 'stroke-width': larg, 'stroke-linecap': 'round', transform: gira }, extra || {})); }
    function contas(cores, r) { var t = ''; for (var k = 0; k <= 8; k++) { var a = k / 8 * Math.PI; t += circ(x + Math.cos(a) * 13.5, y + Math.sin(a) * 4.8, r, { fill: cores[k % cores.length], stroke: '#fff', 'stroke-width': 0.6 }); } return t; }
    switch (tipo) {
      case 'simples': s = aro(y, cor.hex, 4) + aro(y + 0.6, '#fff', 1, { opacity: 0.5 }); break;
      case 'berloque': s = aro(y, cor.hex, 1.8) + p(coracao(x - 7, y + 9, 3.2), { fill: '#e8384f' }) + p(estrela5(x + 1, y + 10, 3.6, 1.6), { fill: '#ffd23f' }) + circ(x + 8, y + 8, 2.6, { fill: '#7ee8ff' }); break;
      case 'perolas': s = contas(['#fffaf2'], 3.2); break;
      case 'micangas': s = contas(['#ff5a6e', '#ffd23f', '#5cc46a', '#5ac8ff', '#b892ff', cor.hex], 3); break;
      case 'relogio': s = aro(y, cor.hex, 5) + circ(x, y + 2, 7, { fill: '#fff', stroke: c, 'stroke-width': 2.5 }) + p('M' + x + ',' + (y + 2) + ' L' + x + ',' + (y - 2) + ' M' + x + ',' + (y + 2) + ' L' + (x + 3) + ',' + (y + 3), { stroke: '#2a1c1a', 'stroke-width': 1.2, 'stroke-linecap': 'round' }); break;
      case 'varias': s = aro(y - 4, cor.hex, 2.6) + aro(y, '#ff5fb4', 2.6) + aro(y + 4, '#7ee8ff', 2.6); break;
      case 'amizade': s = aro(y, cor.hex, 4) + aro(y, '#ffd23f', 4, { 'stroke-dasharray': '4 4' }); break;
    }
    return s;
  }
  function anel(tipo, cor) {
    // anel visto de frente: só a faixinha que passa na frente do dedo anelar, com o enfeite em cima
    function um(lado, topo) {
      var q = dedoDoAnel(lado < 0 ? 118 : 282, lado), x = q[0], y = q[1];
      var t = p('M' + n(x - 3.4) + ',' + n(y - 1) + ' Q' + n(x) + ',' + n(y + 2.6) + ' ' + n(x + 3.4) + ',' + n(y - 1), { fill: 'none', stroke: esc(cor.hex, 0.3), 'stroke-width': 3.6, 'stroke-linecap': 'round' }) +
        p('M' + n(x - 3.4) + ',' + n(y - 1) + ' Q' + n(x) + ',' + n(y + 2.6) + ' ' + n(x + 3.4) + ',' + n(y - 1), { fill: 'none', stroke: cor.hex, 'stroke-width': 2.4, 'stroke-linecap': 'round' });
      if (topo === 'pedra') t += circ(x, y + 0.6, 3, { fill: '#ff5fb4', stroke: '#fff', 'stroke-width': 0.9 }) + p(estrela4(x + 2.4, y - 2, 2.2), { fill: '#fff' });
      if (topo === 'coracao') t += p(coracao(x, y + 0.4, 3), { fill: '#e8384f', stroke: '#fff', 'stroke-width': 0.7 });
      if (topo === 'flor') t += flor(x, y + 0.6, 1.9, '#ff8fc8', '#ffd23f');
      if (topo === 'estrela') t += p(estrela5(x, y + 0.6, 4, 1.8), { fill: cor.hex, stroke: esc(cor.hex, 0.3), 'stroke-width': 0.7 });
      return t;
    }
    if (tipo === 'dois') return um(-1, 'pedra') + um(1, 'coracao');
    return um(-1, tipo);
  }
  function broche(tipo, cor) {
    var x = 174, y = 388, c = esc(cor.hex, 0.3);
    switch (tipo) {
      case 'estrela': return p(estrela5(x, y, 11, 5), { fill: cor.hex, stroke: c, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }) + p(estrela4(x - 3, y - 3, 3.5), { fill: '#fff' });
      case 'laco': return laco(x, y, 9, cor.hex) + circ(x, y, 3, { fill: '#fff' });
      case 'flor': return flor(x, y, 5.5, cor.hex, '#fff3a0');
      case 'coracao': return p(coracao(x, y, 9), { fill: cor.hex, stroke: c, 'stroke-width': 1.4 }) + circ(x - 3, y - 3, 2, { fill: '#fff' });
      case 'borboleta': return elip(x - 6, y - 4, 7, 6, { fill: cor.hex, stroke: c }) + elip(x + 6, y - 4, 7, 6, { fill: cor.hex, stroke: c }) + elip(x - 5, y + 5, 5, 4, { fill: cla(cor.hex, 0.4) }) + elip(x + 5, y + 5, 5, 4, { fill: cla(cor.hex, 0.4) }) + p('M' + x + ',' + (y - 8) + 'L' + x + ',' + (y + 9), { stroke: '#4a2c20', 'stroke-width': 2, 'stroke-linecap': 'round' });
      case 'joia': return circ(x, y, 10, { fill: cor.hex, stroke: c, 'stroke-width': 1.5 }) + circ(x, y, 6.5, { fill: '#ff5fb4', stroke: '#fff', 'stroke-width': 1.2 }) + p(estrela4(x + 3, y - 3, 3.5), { fill: '#fff' });
    }
    return '';
  }
  function brincos(tipo, cor, I, esq, dir) {
    var c = esc(cor.hex, 0.3), s = '';
    [esq === false ? null : 116, dir === false ? null : 284].forEach(function (x) {
      if (x === null) return;
      switch (tipo) {
        case 'bolinha': s += circ(x, 232, 5.5, { fill: cor.hex, stroke: c, 'stroke-width': 1.2 }) + circ(x - 1.6, 230.4, 1.6, { fill: '#fff' }); break;
        case 'argola': s += circ(x, 242, 11, { fill: 'none', stroke: cor.hex, 'stroke-width': 3.2 }) + circ(x, 242, 11, { fill: 'none', stroke: c, 'stroke-width': 0.8 }); break;
        case 'estrela': s += p('M' + x + ',230 L' + x + ',236', { stroke: c, 'stroke-width': 1.5 }) + p(estrela5(x, 244, 9, 4), { fill: cor.hex, stroke: c, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }); break;
        case 'coracao': s += p('M' + x + ',230 L' + x + ',236', { stroke: c, 'stroke-width': 1.5 }) + p(coracao(x, 243, 7), { fill: cor.hex, stroke: c, 'stroke-width': 1.2 }); break;
        case 'perola': s += circ(x, 227, 2.2, { fill: cor.hex }) + circ(x, 233, 6, { fill: '#fffaf2', stroke: '#d9cbb8', 'stroke-width': 1 }) + circ(x - 2, 231, 2, { fill: '#fff' }); break;
        case 'diamante': s += circ(x, 228, 2.4, { fill: cor.hex }) + p('M' + x + ',230 L' + (x + 7) + ',238 L' + x + ',250 L' + (x - 7) + ',238Z', { fill: '#e6f6ff', stroke: cor.hex, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }) + p('M' + (x - 7) + ',238 L' + (x + 7) + ',238 M' + x + ',230 L' + x + ',250', { stroke: '#a8d8f0', 'stroke-width': 0.8 }) + p(estrela4(x + 6, 231, 4), { fill: '#fff' }); break;
        case 'lua': s += p('M' + x + ',228 L' + x + ',234', { stroke: c, 'stroke-width': 1.5 }) + p('M' + (x + 3) + ',233 C' + (x - 10) + ',234 ' + (x - 10) + ',253 ' + (x + 3) + ',254 C' + (x - 3) + ',249 ' + (x - 3) + ',238 ' + (x + 3) + ',233Z', { fill: cor.hex, stroke: c, 'stroke-width': 1 }); break;
        case 'borboleta': s += p('M' + x + ',228 L' + x + ',236', { stroke: c, 'stroke-width': 1.5 }) + elip(x - 5, 240, 5, 4.5, { fill: cor.hex, stroke: c, 'stroke-width': 0.8 }) + elip(x + 5, 240, 5, 4.5, { fill: cor.hex, stroke: c, 'stroke-width': 0.8 }) + elip(x - 4, 247, 3.5, 3, { fill: cla(cor.hex, 0.4) }) + elip(x + 4, 247, 3.5, 3, { fill: cla(cor.hex, 0.4) }) + p('M' + x + ',236 L' + x + ',250', { stroke: '#4a2c20', 'stroke-width': 1.6 }); break;
        case 'flor': s += p('M' + x + ',228 L' + x + ',234', { stroke: c, 'stroke-width': 1.5 }) + flor(x, 240, 4.2, cor.hex, '#fff3a0'); break;
        case 'pingente': s += circ(x, 231, 3.2, { fill: cor.hex }) + p('M' + x + ',234 L' + x + ',256', { stroke: cor.hex, 'stroke-width': 1.5 }) + circ(x, 242, 3, { fill: '#ff7cc8', stroke: '#fff', 'stroke-width': 0.8 }) + circ(x, 250, 3, { fill: '#7ee8ff', stroke: '#fff', 'stroke-width': 0.8 }) + p('M' + x + ',254 Q' + (x + 6) + ',262 ' + x + ',270 Q' + (x - 6) + ',262 ' + x + ',254Z', { fill: cla(cor.hex, 0.25), stroke: c, 'stroke-width': 1 }); break;
        case 'cereja': s += p('M' + x + ',229 Q' + (x + 1) + ',240 ' + (x - 4) + ',247 M' + x + ',229 Q' + (x + 4) + ',238 ' + (x + 6) + ',245', { fill: 'none', stroke: '#3cae50', 'stroke-width': 1.6 }) + circ(x - 4, 250, 4.4, { fill: '#e8384f' }) + circ(x + 6, 248, 4.4, { fill: '#e8384f' }) + circ(x - 5.5, 248.5, 1.3, { fill: '#fff' }) + circ(x + 4.5, 246.5, 1.3, { fill: '#fff' }); break;
        case 'gota': s += circ(x, 232, 3.5, { fill: cor.hex, stroke: c, 'stroke-width': 1 }) + p('M' + x + ',237 Q' + (x + 9) + ',250 ' + x + ',258 Q' + (x - 9) + ',250 ' + x + ',237Z', { fill: cla(cor.hex, 0.3), stroke: c, 'stroke-width': 1.2 }) + p(estrela4(x - 2, 249, 3.5), { fill: '#fff' }); break;
      }
    });
    return s;
  }
  function oculos(tipo, cor) {
    var c = cor.hex, s = '', haste = p('M140,208 L116,204 M260,208 L284,204', { stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    var ponte = p('M188,210 Q200,203 212,210', { fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    [164, 236].forEach(function (x) {
      switch (tipo) {
        case 'sol': s += elip(x, 217, 27, 21, { fill: mistura(c, '#1d1420', 0.6), opacity: 0.88, stroke: c, 'stroke-width': 4 }) + p('M' + (x - 14) + ',206 L' + (x - 4) + ',202', { stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.7 }); break;
        case 'coracao': s += p(coracao(x, 216, 21), { fill: c, opacity: 0.4, stroke: c, 'stroke-width': 4, 'stroke-linejoin': 'round' }); break;
        case 'estrela': s += p(estrela5(x, 216, 30, 15), { fill: c, opacity: 0.35, stroke: c, 'stroke-width': 3.5, 'stroke-linejoin': 'round' }); break;
        case 'redondo': s += circ(x, 216, 23, { fill: '#fff', opacity: 0.15, stroke: c, 'stroke-width': 3.5 }); break;
      }
    });
    return haste + s + ponte;
  }
  function lacos(tipo, cor, corte) {
    switch (tipo) {
      case 'alto': return laco(200, 104, 28, cor.hex);
      case 'lado': return laco(270, 142, 21, cor.hex);
      case 'dois': return corte === 'chiquinhas' ? laco(118, 166, 15, cor.hex) + laco(282, 166, 15, cor.hex) : laco(130, 148, 15, cor.hex) + laco(270, 148, 15, cor.hex);
      case 'estrela': return p(estrela5(270, 146, 15, 7), { fill: cor.hex, stroke: esc(cor.hex, 0.3), 'stroke-width': 1.5, 'stroke-linejoin': 'round' }) + p(estrela4(266, 141, 4), { fill: '#fff' });
    }
    return '';
  }
  function cabeca(tipo, cor, I, peca) {
    var c = esc(cor.hex, 0.3), s = '';
    switch (tipo) {
      case 'tiara':
        s = p('M126,152 Q200,96 274,152', { fill: 'none', stroke: c, 'stroke-width': 9, 'stroke-linecap': 'round' }) + p('M126,152 Q200,96 274,152', { fill: 'none', stroke: cor.hex, 'stroke-width': 6, 'stroke-linecap': 'round' });
        s += p('M188,120 L200,96 L212,120 L200,128Z', { fill: '#ff7cc8', stroke: '#fff', 'stroke-width': 1.5 }) + circ(166, 128, 4, { fill: '#7ee8ff', stroke: '#fff', 'stroke-width': 1 }) + circ(234, 128, 4, { fill: '#7ee8ff', stroke: '#fff', 'stroke-width': 1 }) + p(estrela4(204, 106, 4), { fill: '#fff' });
        break;
      case 'coroa':
        s = peca('M150,130 L154,76 L177,104 L200,62 L223,104 L246,76 L250,130 Q200,140 150,130Z', cor, 'x') + p('M151,118 Q200,128 249,118 L250,130 Q200,140 150,130Z', { fill: esc(cor.hex, 0.15) });
        s += circ(154, 76, 5, { fill: '#ff7cc8', stroke: '#fff', 'stroke-width': 1.2 }) + circ(246, 76, 5, { fill: '#ff7cc8', stroke: '#fff', 'stroke-width': 1.2 }) + circ(200, 62, 6, { fill: '#7ee8ff', stroke: '#fff', 'stroke-width': 1.2 }) + elip(200, 124, 7, 5, { fill: '#e8384f', stroke: '#fff', 'stroke-width': 1.2 });
        break;
      case 'flores':
        var cores = [cor.hex, '#ff8fc8', '#ffd23f', '#cfa8ff'];
        for (var i = 0; i <= 8; i++) { var t = i / 8, x = (1 - t) * (1 - t) * 116 + 2 * (1 - t) * t * 200 + t * t * 284, y = (1 - t) * (1 - t) * 176 + 2 * (1 - t) * t * 70 + t * t * 176; if (i % 2) s += elip(x, y + 8, 6, 3.5, { fill: '#5cc46a', transform: 'rotate(30 ' + n(x) + ' ' + n(y + 8) + ')' }); s += flor(x, y, 7, cores[i % cores.length], '#fff3a0'); }
        break;
      case 'chapeu':
        s = elip(200, 134, 150, 30, { fill: '#f3d48b', stroke: '#c9a352', 'stroke-width': 2 }) + p('M140,132 Q144,62 200,60 Q256,62 260,132Z', { fill: '#f6dc9c', stroke: '#c9a352', 'stroke-width': 2 }) +
          p('M141,116 Q200,128 259,116 L260,132 Q200,142 140,132Z', { fill: cor.hex, stroke: c, 'stroke-width': 1.5 }) + flor(246, 124, 6, '#fff', cor.hex);
        break;
      case 'gorro':
        s = peca('M106,172 Q104,82 200,78 Q296,82 294,172Z', cor, 'x');
        for (var k = 0; k < 7; k++) s += p('M' + (130 + k * 23) + ',96 L' + (130 + k * 23) + ',166', { stroke: esc(cor.hex, 0.15), 'stroke-width': 2, opacity: 0.6 });
        s += p('M102,170 Q200,150 298,170 L298,196 Q200,176 102,196Z', { fill: cla(cor.hex, 0.35), stroke: c, 'stroke-width': 2 }) + circ(200, 72, 22, { fill: cla(cor.hex, 0.55), stroke: c, 'stroke-width': 2 });
        break;
      case 'diadema':
        s = p('M126,152 Q200,96 274,152', { fill: 'none', stroke: c, 'stroke-width': 10, 'stroke-linecap': 'round' }) + p('M126,152 Q200,96 274,152', { fill: 'none', stroke: cor.hex, 'stroke-width': 7, 'stroke-linecap': 'round' });
        var gemas = ['#ff5fb4', '#7ee8ff', '#ffd23f', '#86ecc8', '#b892ff'];
        for (var d = 0; d <= 8; d++) { var td = d / 8, gx = (1 - td) * (1 - td) * 126 + 2 * (1 - td) * td * 200 + td * td * 274, gy = (1 - td) * (1 - td) * 152 + 2 * (1 - td) * td * 96 + td * td * 152; s += circ(gx, gy, d === 4 ? 6.5 : 4.5, { fill: gemas[d % gemas.length], stroke: '#fff', 'stroke-width': 1.2 }); }
        s += p(estrela4(204, 118, 5), { fill: '#fff' });
        break;
      case 'orelhas':
        s = p('M118,170 Q200,92 282,170', { fill: 'none', stroke: cor.hex, 'stroke-width': 6, 'stroke-linecap': 'round' }) +
          dois('M126,142 L118,80 L168,112Z', { fill: cor.hex, stroke: c, 'stroke-width': 2, 'stroke-linejoin': 'round' }) + dois('M132,130 L127,96 L156,114Z', { fill: '#ff9ec4' });
        break;
    }
    return s;
  }

  // ---------- cenários ----------
  function cenario(id, I) {
    var s = '', r = sorteio(99), k;
    function grad(nome, a, b) { return '<defs><linearGradient id="' + I + nome + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs>'; }
    switch (id) {
      case 'quarto':
        s = ret(0, 0, W, H, { fill: '#ffd9ec' });
        for (k = 0; k < 10; k++) s += ret(k * 44, 0, 20, 600, { fill: '#ffc8e3' });
        s += ret(0, 590, W, 130, { fill: '#e7b2d4' }) + elip(200, 668, 170, 34, { fill: '#cfa8ff', opacity: 0.9 }) + elip(200, 668, 140, 24, { fill: '#e3ccff' });
        s += ret(36, 120, 104, 130, { fill: '#9ad8ff', stroke: '#fff', 'stroke-width': 8, rx: 6 }) + circ(110, 150, 14, { fill: '#fff6b0' }) + p('M30,112 Q60,190 40,262 L28,262Z M146,112 Q116,190 136,262 L148,262Z', { fill: '#ff8fc8' });
        s += p('M0,70 Q100,104 200,70 Q300,104 400,70', { fill: 'none', stroke: '#fff', 'stroke-width': 2 });
        for (k = 0; k < 9; k++) s += p(coracao(20 + k * 45, 88 + (k % 2 ? 6 : 10), 7), { fill: ['#ff4fa3', '#ffd23f', '#8fd0ff'][k % 3] });
        s += ret(312, 556, 64, 44, { fill: '#fff', rx: 6, stroke: '#e6c6dc', 'stroke-width': 3 }) + p('M344,556 L344,522', { stroke: '#c9a3ff', 'stroke-width': 4 }) + circ(344, 506, 30, { fill: '#fff3a0', opacity: 0.35 }) +
          p('M324,522 L364,522 L355,490 L333,490Z', { fill: '#ffd23f', stroke: '#e8a920', 'stroke-width': 2, 'stroke-linejoin': 'round' });
        break;
      case 'praia':
        s = grad('ceu', '#7fd3ff', '#d9f4ff') + ret(0, 0, W, H, { fill: 'url(#' + I + 'ceu)' }) + circ(330, 90, 36, { fill: '#ffe066' }) + circ(330, 90, 50, { fill: '#ffe066', opacity: 0.25 });
        s += ret(0, 420, W, 140, { fill: '#33b5e5' }) + ret(0, 420, W, 30, { fill: '#5fd0f5' });
        for (k = 0; k < 6; k++) s += p('M' + (k * 75 - 10) + ',' + (470 + (k % 2) * 30) + ' q12,-8 24,0 q12,8 24,0', { fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.8 });
        s += p('M0,540 Q200,520 400,540 L400,720 L0,720Z', { fill: '#ffe2a3' });
        for (k = 0; k < 30; k++) s += circ(r() * 400, 560 + r() * 160, 1.5, { fill: '#e8c27a' });
        s += p('M44,560 Q30,420 62,300', { fill: 'none', stroke: '#a0703c', 'stroke-width': 14, 'stroke-linecap': 'round' });
        ['M62,300 Q20,270 -6,300 Q30,286 62,300Z', 'M62,300 Q100,260 136,286 Q96,282 62,300Z', 'M62,300 Q40,240 70,224 Q60,260 62,300Z', 'M62,300 Q110,300 120,340 Q90,310 62,300Z', 'M62,300 Q14,312 6,350 Q36,316 62,300Z'].forEach(function (d) { s += p(d, { fill: '#3cc46a', stroke: '#2a9a50', 'stroke-width': 3, 'stroke-linejoin': 'round' }); });
        s += circ(340, 620, 26, { fill: '#fff' }) + p('M314,620 A26,26 0 0 1 340,594 L340,620Z', { fill: '#ff5a6e' }) + p('M340,594 A26,26 0 0 1 366,620 L340,620Z', { fill: '#ffd23f' }) + p('M340,620 L340,646 A26,26 0 0 1 314,620Z', { fill: '#5ac8ff' });
        s += p('M150,150 q10,-10 20,0 q10,-10 20,0 M230,120 q8,-8 16,0 q8,-8 16,0', { fill: 'none', stroke: '#4a6a8a', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
        break;
      case 'castelo':
        s = grad('ceu', '#2a1460', '#7a3fb0') + ret(0, 0, W, H, { fill: 'url(#' + I + 'ceu)' });
        for (k = 0; k < 30; k++) s += p(estrela4(r() * 400, r() * 300, 1.5 + r() * 3), { fill: '#fff', opacity: 0.5 + r() * 0.5 });
        s += p('M40,520 L40,300 L70,250 L100,300 L100,360 L150,360 L150,250 L200,180 L250,250 L250,360 L300,360 L300,300 L330,250 L360,300 L360,520Z', { fill: '#5b3a9a', opacity: 0.9 });
        [[70, 330], [330, 330], [200, 280], [175, 400], [225, 400]].forEach(function (q) { s += ret(q[0] - 7, q[1], 14, 22, { fill: '#ffe08a', rx: 7 }); });
        s += ret(0, 520, W, 200, { fill: '#3d2470' }) + p('M150,720 L176,520 L224,520 L250,720Z', { fill: '#d43a5a' }) + p('M160,720 L180,520 M240,720 L220,520', { stroke: '#ffd23f', 'stroke-width': 3 });
        s += ret(0, 300, 26, 420, { fill: '#e8dcff' }) + ret(374, 300, 26, 420, { fill: '#e8dcff' });
        s += p('M200,0 L200,30', { stroke: '#ffd23f', 'stroke-width': 2 }) + p('M150,40 Q200,70 250,40', { fill: 'none', stroke: '#ffd23f', 'stroke-width': 4 });
        for (k = 0; k < 5; k++) s += p('M' + (156 + k * 22) + ',' + (44 + (k === 2 ? 18 : k % 2 ? 12 : 4)) + ' l0,10', { stroke: '#ffd23f', 'stroke-width': 2 }) + circ(156 + k * 22, 60 + (k === 2 ? 18 : k % 2 ? 12 : 4), 4, { fill: '#fff6b0' });
        break;
      case 'palco':
        s = ret(0, 0, W, H, { fill: '#1d0f36' });
        for (k = 0; k < 24; k++) s += p(estrela4(60 + r() * 280, 60 + r() * 360, 2 + r() * 4), { fill: ['#ff7cc8', '#7ee8ff', '#ffd76a'][k % 3], opacity: 0.8 });
        s += p('M0,0 L80,0 Q60,300 90,720 L0,720Z', { fill: '#c8243f' }) + p('M400,0 L320,0 Q340,300 310,720 L400,720Z', { fill: '#c8243f' });
        for (k = 0; k < 3; k++) s += p('M' + (16 + k * 22) + ',0 Q' + (10 + k * 22) + ',300 ' + (24 + k * 24) + ',720', { fill: 'none', stroke: '#8f1530', 'stroke-width': 3 }) + p('M' + (384 - k * 22) + ',0 Q' + (390 - k * 22) + ',300 ' + (376 - k * 24) + ',720', { fill: 'none', stroke: '#8f1530', 'stroke-width': 3 });
        s += p('M0,0 L400,0 L400,40 Q300,70 200,40 Q100,70 0,40Z', { fill: '#a81d36' });
        s += p('M60,40 L150,680 L250,680Z', { fill: '#fff3a0', opacity: 0.16 }) + p('M340,40 L150,680 L250,680Z', { fill: '#ffb3e6', opacity: 0.16 });
        s += ret(0, 610, W, 110, { fill: '#5a3a2a' });
        for (k = 0; k < 6; k++) s += p('M0,' + (622 + k * 18) + ' L400,' + (622 + k * 18), { stroke: '#46291c', 'stroke-width': 2 });
        break;
      case 'jardim':
        s = grad('ceu', '#9fdcff', '#e6f7ff') + ret(0, 0, W, H, { fill: 'url(#' + I + 'ceu)' });
        [[80, 90], [300, 60]].forEach(function (q) { s += elip(q[0], q[1], 40, 16, { fill: '#fff' }) + elip(q[0] + 22, q[1] - 10, 26, 16, { fill: '#fff' }); });
        s += p('M0,420 Q120,360 240,420 Q330,380 400,410 L400,720 L0,720Z', { fill: '#8fdc7a' }) + p('M0,520 Q200,470 400,520 L400,720 L0,720Z', { fill: '#6cc860' });
        s += ret(312, 260, 18, 180, { fill: '#a0703c' }) + circ(320, 240, 60, { fill: '#4cbf5c' }) + circ(290, 270, 38, { fill: '#3fae50' }) + circ(352, 272, 38, { fill: '#3fae50' });
        for (k = 0; k < 7; k++) s += circ(286 + r() * 70, 200 + r() * 90, 5, { fill: '#ff5a6e' });
        for (k = 0; k < 18; k++) { var fx = r() * 400, fy = 540 + r() * 170; s += p('M' + n(fx) + ',' + n(fy) + ' l0,14', { stroke: '#3a9a4a', 'stroke-width': 2 }) + flor(fx, fy, 4.5, ['#ff8fc8', '#ffd23f', '#cfa8ff', '#fff'][k % 4], '#ffb000'); }
        s += elip(60, 200, 7, 5, { fill: '#ff8fc8' }) + elip(72, 200, 7, 5, { fill: '#ff8fc8' }) + p('M66,194 L66,206', { stroke: '#4a2c20', 'stroke-width': 2 });
        break;
      case 'neve':
        s = grad('ceu', '#bcdcff', '#f1f8ff') + ret(0, 0, W, H, { fill: 'url(#' + I + 'ceu)' });
        s += p('M-20,440 L90,260 L200,440Z', { fill: '#dce9f8' }) + p('M140,440 L270,220 L420,440Z', { fill: '#cfe0f4' }) + p('M70,292 L90,260 L112,292 L100,286 L90,296 L80,286Z M248,256 L270,220 L292,256 L280,250 L270,262 L260,250Z', { fill: '#fff' });
        s += p('M0,500 Q200,460 400,500 L400,720 L0,720Z', { fill: '#fbfdff' });
        [[40, 470], [360, 480], [90, 440]].forEach(function (q) { s += p('M' + q[0] + ',' + (q[1] - 90) + ' L' + (q[0] + 34) + ',' + q[1] + ' L' + (q[0] - 34) + ',' + q[1] + 'Z', { fill: '#2f8a64' }) + p('M' + q[0] + ',' + (q[1] - 90) + ' L' + (q[0] + 14) + ',' + (q[1] - 52) + ' L' + (q[0] - 14) + ',' + (q[1] - 52) + 'Z', { fill: '#fff' }); });
        s += circ(340, 640, 28, { fill: '#fff', stroke: '#d6e4f2', 'stroke-width': 2 }) + circ(340, 596, 20, { fill: '#fff', stroke: '#d6e4f2', 'stroke-width': 2 }) + p('M340,598 L356,602 L340,604Z', { fill: '#ff8a3d' }) + circ(334, 590, 2.2, { fill: '#2a1c1a' }) + circ(346, 590, 2.2, { fill: '#2a1c1a' });
        for (k = 0; k < 40; k++) s += circ(r() * 400, r() * 640, 1.5 + r() * 2.5, { fill: '#fff', opacity: 0.9 });
        break;
      case 'festa':
        s = ret(0, 0, W, H, { fill: '#fff0c8' });
        for (k = 0; k < 50; k++) s += circ(r() * 400, r() * 600, 3, { fill: ['#ff4fa3', '#7ee8ff', '#ffd23f', '#86ecc8', '#cfa8ff'][k % 5], opacity: 0.6 });
        s += p('M0,40 Q200,100 400,40', { fill: 'none', stroke: '#c9a352', 'stroke-width': 2 });
        for (k = 0; k < 9; k++) { var bx = 10 + k * 46, by = 40 + Math.sin(k / 8 * Math.PI) * 30; s += p('M' + n(bx) + ',' + n(by) + ' L' + n(bx + 34) + ',' + n(by + 4) + ' L' + n(bx + 17) + ',' + n(by + 40) + 'Z', { fill: ['#ff4fa3', '#ffd23f', '#5ac8ff', '#86ecc8', '#cfa8ff'][k % 5] }); }
        [[50, 220, '#ff4fa3'], [86, 270, '#5ac8ff'], [350, 230, '#ffd23f'], [318, 290, '#cfa8ff']].forEach(function (q) { s += p('M' + q[0] + ',' + (q[1] + 38) + ' Q' + (q[0] + 10) + ',' + (q[1] + 120) + ' ' + q[0] + ',' + (q[1] + 200), { fill: 'none', stroke: '#9a8a9a', 'stroke-width': 1.5 }) + elip(q[0], q[1], 30, 38, { fill: q[2] }) + elip(q[0] - 10, q[1] - 14, 6, 10, { fill: '#fff', opacity: 0.5 }); });
        s += ret(0, 600, W, 120, { fill: '#ffd59e' }) + ret(300, 560, 90, 60, { fill: '#fff', rx: 6, stroke: '#ffb3d9', 'stroke-width': 4 }) + ret(312, 530, 66, 32, { fill: '#ff8fc8', rx: 6 }) + p('M345,512 L345,530', { stroke: '#5ac8ff', 'stroke-width': 4 }) + elip(345, 506, 4, 7, { fill: '#ffb000' });
        break;
      case 'mar':
        s = grad('ceu', '#3fc2e6', '#0b4f8f') + ret(0, 0, W, H, { fill: 'url(#' + I + 'ceu)' });
        for (k = 0; k < 4; k++) s += p('M' + (40 + k * 100) + ',0 L' + (90 + k * 100) + ',0 L' + (20 + k * 100) + ',520 L' + (-10 + k * 100) + ',520Z', { fill: '#fff', opacity: 0.07 });
        s += p('M0,640 Q200,610 400,640 L400,720 L0,720Z', { fill: '#f3d6a0' });
        [[30, '#3fbf7a'], [70, '#2fa868'], [340, '#3fbf7a'], [376, '#2fa868']].forEach(function (q) { s += p('M' + q[0] + ',660 Q' + (q[0] - 20) + ',600 ' + q[0] + ',560 Q' + (q[0] + 20) + ',520 ' + q[0] + ',460', { fill: 'none', stroke: q[1], 'stroke-width': 9, 'stroke-linecap': 'round' }); });
        s += p('M300,660 L300,620 M300,630 L286,606 M300,624 L316,598', { stroke: '#ff7c9a', 'stroke-width': 8, 'stroke-linecap': 'round' });
        for (k = 0; k < 18; k++) s += circ(r() * 400, r() * 600, 3 + r() * 6, { fill: 'none', stroke: '#fff', 'stroke-width': 1.5, opacity: 0.55 });
        [[80, 180, '#ffd23f'], [320, 140, '#ff8a6b'], [330, 380, '#cfa8ff']].forEach(function (q, j) { var d = j === 0 ? 1 : -1; s += elip(q[0], q[1], 18, 11, { fill: q[2] }) + p('M' + (q[0] - d * 16) + ',' + q[1] + ' L' + (q[0] - d * 30) + ',' + (q[1] - 10) + ' L' + (q[0] - d * 30) + ',' + (q[1] + 10) + 'Z', { fill: q[2] }) + circ(q[0] + d * 9, q[1] - 3, 2.2, { fill: '#2a1c1a' }); });
        break;
    }
    return s;
  }

  var API = { svg: svg, espelhar: espelhar };
  raiz.PurpurinaBoneca = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
