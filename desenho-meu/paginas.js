/* Desenho Meu — desenhos do livro de colorir (e do pintar por números).
   Só dados (nada de tela), para dar para testar no Node e para acrescentar desenhos sem mexer no resto.
   Cada desenho vive numa caixa de 1000 × 1000 e tem:
   - "formas": as áreas que se pintam, na ordem de pintura (a primeira é o fundo da página inteira e as de cima
     vêm por último). O app passa o contorno preto por cima de todas elas, então a forma já é o desenho.
   - "n": o número da cor da área (a cor nº 1 é cores[0]) — é o que aparece no "pintar por números".
   - "linhas": detalhes que só têm contorno (boca, bigode, costura, dobras); não se pintam.
   - "variacoes": outras paletas com o mesmo tamanho (mesmas áreas, outro clima: noite, doce, outono…).
   Regra de ouro: toda área precisa ter um pedaço à vista onde caiba uma bolinha de raio 16 (é onde o número
   aparece e onde a criança toca). Detalhe fininho vai em "linhas".
   Todos os desenhos são originais, feitos aqui em código. */
(function (raiz) {
  'use strict';

  // ---------- ajudantes de caminho (devolvem texto de caminho SVG) ----------
  // números com uma casa só, para o arquivo não ficar enorme
  function q(v) { return Math.round(v * 10) / 10; }
  function pt(x, y) { return q(x) + ' ' + q(y); }
  function ang360(a) { return ((a % 360) + 360) % 360; }
  function hyp(a, b) { return Math.sqrt(a * a + b * b); }

  // elipse girada: rx vai na direção do ângulo "ang" (em graus; 0 = deitada)
  function elipR(cx, cy, rx, ry, ang) {
    var a = ang * Math.PI / 180, dx = Math.cos(a) * rx, dy = Math.sin(a) * rx, g = q(ang360(ang));
    var arco = ' A ' + q(rx) + ' ' + q(ry) + ' ' + g + ' 1 0 ';
    return 'M ' + pt(cx - dx, cy - dy) + arco + pt(cx + dx, cy + dy) + arco + pt(cx - dx, cy - dy) + ' Z';
  }
  function elip(cx, cy, rx, ry) { return elipR(cx, cy, rx, ry, 0); }
  function circ(cx, cy, r) { return elipR(cx, cy, r, r, 0); }

  // retângulo; r (opcional) arredonda os cantos
  function ret(x, y, w, h, r) {
    if (!r) return 'M ' + pt(x, y) + ' L ' + pt(x + w, y) + ' L ' + pt(x + w, y + h) + ' L ' + pt(x, y + h) + ' Z';
    r = Math.min(r, w / 2, h / 2);
    var a = ' A ' + q(r) + ' ' + q(r) + ' 0 0 1 ';
    return 'M ' + pt(x + r, y) + ' L ' + pt(x + w - r, y) + a + pt(x + w, y + r) + ' L ' + pt(x + w, y + h - r) + a +
      pt(x + w - r, y + h) + ' L ' + pt(x + r, y + h) + a + pt(x, y + h - r) + ' L ' + pt(x, y + r) + a + pt(x + r, y) + ' Z';
  }

  // polígono de pontas arredondadas (contorno fofo). Cada ponto pode trazer o próprio raio: [x, y, r]
  function poliR(pts, r) {
    var s = '', k = pts.length, i;
    for (i = 0; i < k; i++) {
      var p = pts[i], a = pts[(i - 1 + k) % k], b = pts[(i + 1) % k], rr = p.length > 2 ? p[2] : r;
      var da = hyp(a[0] - p[0], a[1] - p[1]), db = hyp(b[0] - p[0], b[1] - p[1]);
      var ra = Math.min(rr, da / 2), rb = Math.min(rr, db / 2);
      var p1 = [p[0] + (a[0] - p[0]) * ra / da, p[1] + (a[1] - p[1]) * ra / da];
      var p2 = [p[0] + (b[0] - p[0]) * rb / db, p[1] + (b[1] - p[1]) * rb / db];
      s += (i === 0 ? 'M ' : ' L ') + pt(p1[0], p1[1]) + ' Q ' + pt(p[0], p[1]) + ' ' + pt(p2[0], p2[1]);
    }
    return s + ' Z';
  }

  // curva suave fechada passando por todos os pontos (bichos, nuvens, moitas, morros)
  function suave(pts) {
    var k = pts.length, s = 'M ' + pt(pts[0][0], pts[0][1]), i;
    for (i = 0; i < k; i++) {
      var p0 = pts[(i - 1 + k) % k], p1 = pts[i], p2 = pts[(i + 1) % k], p3 = pts[(i + 2) % k];
      s += ' C ' + pt(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        pt(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + ' ' + pt(p2[0], p2[1]);
    }
    return s + ' Z';
  }
  // pedaço de curva suave aberta (sem o "M"), usada por curva() e chao()
  function trecho(pts) {
    var k = pts.length, s = '', i;
    for (i = 0; i < k - 1; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, k - 1)];
      s += ' C ' + pt(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        pt(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + ' ' + pt(p2[0], p2[1]);
    }
    return s;
  }
  // curva suave aberta (para "linhas")
  function curva(pts) { return 'M ' + pt(pts[0][0], pts[0][1]) + trecho(pts); }
  // linha reta por vários pontos (para "linhas")
  function reta(pts) { return 'M ' + pts.map(function (p) { return pt(p[0], p[1]); }).join(' L '); }
  // chão ou morro: curva suave de um lado ao outro e fecha por baixo (y = base)
  function chao(pts, base) {
    base = base === undefined ? 1000 : base;
    var a = pts[0], z = pts[pts.length - 1];
    return 'M ' + pt(a[0], base) + ' L ' + pt(a[0], a[1]) + trecho(pts) + ' L ' + pt(z[0], base) + ' Z';
  }
  // polígono de pontas retas
  function poli(pts) { return 'M ' + pts.map(function (p) { return pt(p[0], p[1]); }).join(' L ') + ' Z'; }
  // salsicha (braço, perna, cabo): de (x1,y1) até (x2,y2) com raio r
  function pilula(x1, y1, x2, y2, r) {
    var d = hyp(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / d * r, ny = (x2 - x1) / d * r, a = ' A ' + q(r) + ' ' + q(r) + ' 0 0 0 ';
    return 'M ' + pt(x1 + nx, y1 + ny) + ' L ' + pt(x2 + nx, y2 + ny) + a + pt(x2 - nx, y2 - ny) + ' L ' + pt(x1 - nx, y1 - ny) + a + pt(x1 + nx, y1 + ny) + ' Z';
  }
  // arco aberto (para "linhas"), ângulos em graus, 0 = direita, 90 = embaixo
  function arco(cx, cy, r, a0, a1) {
    var g0 = a0 * Math.PI / 180, g1 = a1 * Math.PI / 180;
    return 'M ' + pt(cx + Math.cos(g0) * r, cy + Math.sin(g0) * r) + ' A ' + q(r) + ' ' + q(r) + ' 0 ' + (Math.abs(a1 - a0) > 180 ? 1 : 0) + ' ' + (a1 > a0 ? 1 : 0) + ' ' +
      pt(cx + Math.cos(g1) * r, cy + Math.sin(g1) * r);
  }
  // faixa curva grossa (alça de cesta, arco-íris): pedaço de anel entre r1 e r2, de a0 até a1 graus
  function faixa(cx, cy, r1, r2, a0, a1) {
    var g0 = a0 * Math.PI / 180, g1 = a1 * Math.PI / 180, big = Math.abs(a1 - a0) > 180 ? 1 : 0;
    return 'M ' + pt(cx + Math.cos(g0) * r2, cy + Math.sin(g0) * r2) + ' A ' + q(r2) + ' ' + q(r2) + ' 0 ' + big + ' 1 ' + pt(cx + Math.cos(g1) * r2, cy + Math.sin(g1) * r2) +
      ' L ' + pt(cx + Math.cos(g1) * r1, cy + Math.sin(g1) * r1) + ' A ' + q(r1) + ' ' + q(r1) + ' 0 ' + big + ' 0 ' + pt(cx + Math.cos(g0) * r1, cy + Math.sin(g0) * r1) + ' Z';
  }
  // estrela de pontas fofas
  function estrela(cx, cy, R, r, giro) {
    var p = [], i, g = (giro || 0) - 90;
    for (i = 0; i < 10; i++) { var a = (g + i * 36) * Math.PI / 180, rr = i % 2 ? r : R; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return poliR(p, R * 0.12);
  }
  function coracao(cx, cy, s) {
    return 'M ' + pt(cx, cy + s * 0.9) + ' C ' + pt(cx - s * 1.25, cy + s * 0.05) + ' ' + pt(cx - s * 0.75, cy - s * 0.95) + ' ' + pt(cx, cy - s * 0.38) +
      ' C ' + pt(cx + s * 0.75, cy - s * 0.95) + ' ' + pt(cx + s * 1.25, cy + s * 0.05) + ' ' + pt(cx, cy + s * 0.9) + ' Z';
  }
  // nuvem fofa: base reta-curvinha e calombos em cima
  function nuvem(cx, cy, w) {
    var h = w * 0.5, xs = [cx - w / 2, cx - w * 0.22, cx + w * 0.12, cx + w / 2], ys = [cy + h * 0.32, cy - h * 0.22, cy - h * 0.3, cy + h * 0.32], s = 'M ' + pt(xs[0], ys[0]), i;
    for (i = 1; i < 4; i++) {
      var r = hyp(xs[i] - xs[i - 1], ys[i] - ys[i - 1]) * 0.56;
      s += ' A ' + q(r) + ' ' + q(r) + ' 0 0 1 ' + pt(xs[i], ys[i]);
    }
    return s + ' Q ' + pt(cx, cy + h * 0.5) + ' ' + pt(xs[0], ys[0]) + ' Z';
  }
  // gota de chuva (ponta para cima)
  function gota(cx, cy, s) {
    return 'M ' + pt(cx, cy - 1.5 * s) + ' C ' + pt(cx + 0.3 * s, cy - 0.9 * s) + ' ' + pt(cx + s, cy - 0.3 * s) + ' ' + pt(cx + s, cy + 0.25 * s) +
      ' A ' + q(s) + ' ' + q(s) + ' 0 0 1 ' + pt(cx - s, cy + 0.25 * s) + ' C ' + pt(cx - s, cy - 0.3 * s) + ' ' + pt(cx - 0.3 * s, cy - 0.9 * s) + ' ' + pt(cx, cy - 1.5 * s) + ' Z';
  }
  // faixa grossa que segue uma curva (rabo, cauda de sereia, alga, cachecol). pts = [[x, y, raio], …]
  function cobra(pts) {
    var k = pts.length, esq = [], dir = [], i;
    function tang(i) {
      var a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, k - 1)], d = hyp(b[0] - a[0], b[1] - a[1]) || 1;
      return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
    }
    for (i = 0; i < k; i++) {
      var t = tang(i), r = pts[i][2];
      esq.push([pts[i][0] - t[1] * r, pts[i][1] + t[0] * r]);
      dir.push([pts[i][0] + t[1] * r, pts[i][1] - t[0] * r]);
    }
    var tf = tang(k - 1), ti = tang(0), pf = pts[k - 1], p0 = pts[0];
    return suave(esq.concat([[pf[0] + tf[0] * pf[2], pf[1] + tf[1] * pf[2]]], dir.reverse(), [[p0[0] - ti[0] * p0[2], p0[1] - ti[1] * p0[2]]]));
  }
  // lua minguante: círculo menos outro círculo deslocado d para a direita
  function lua(cx, cy, r, d) {
    var ix = cx + d / 2, h = Math.sqrt(r * r - d * d / 4);
    return 'M ' + pt(ix, cy - h) + ' A ' + q(r) + ' ' + q(r) + ' 0 1 0 ' + pt(ix, cy + h) + ' A ' + q(r) + ' ' + q(r) + ' 0 0 1 ' + pt(ix, cy - h) + ' Z';
  }
  // florzinha: pétalas numa forma só (o miolo é outra forma, por cima)
  function flor(cx, cy, r) {
    var p = [], i;
    for (i = 0; i < 10; i++) { var a = (i * 36 - 90) * Math.PI / 180, rr = i % 2 ? r * 0.68 : r; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return suave(p);
  }
  // pinheiro de três andares numa forma só
  function pinheiro(x, base, w, h) {
    var t = base - h;
    return poliR([[x, t], [x + 0.28 * w, t + 0.34 * h], [x + 0.16 * w, t + 0.34 * h], [x + 0.4 * w, t + 0.68 * h], [x + 0.26 * w, t + 0.68 * h], [x + 0.5 * w, base],
      [x - 0.5 * w, base], [x - 0.26 * w, t + 0.68 * h], [x - 0.4 * w, t + 0.68 * h], [x - 0.16 * w, t + 0.34 * h], [x - 0.28 * w, t + 0.34 * h]], 12);
  }
  /* guarda-chuva (ou guarda-sol) em gomos: ponta em (ax, ay), boca de x0 a x1 na altura by.
     Devolve as formas dos gomos, alternando as cores c1 e c2. */
  function guardaChuva(ax, ay, x0, x1, by, n, c1, c2) {
    var xs = [], i, out = [], passo = (x1 - x0) / n;
    for (i = 0; i <= n; i++) xs.push(x0 + i * passo);
    function desce(i) { // da ponta até a boca no gomo i
      var x = xs[i];
      if (i === 0 || i === n) return ' C ' + pt(ax + (x - ax) * 0.55, ay) + ' ' + pt(x, ay + (by - ay) * 0.4) + ' ' + pt(x, by);
      return ' Q ' + pt(ax + (x - ax) * 0.72, ay + (by - ay) * 0.3) + ' ' + pt(x, by);
    }
    function sobe(i) { // da boca até a ponta
      var x = xs[i];
      if (i === 0 || i === n) return ' C ' + pt(x, ay + (by - ay) * 0.4) + ' ' + pt(ax + (x - ax) * 0.55, ay) + ' ' + pt(ax, ay);
      return ' Q ' + pt(ax + (x - ax) * 0.72, ay + (by - ay) * 0.3) + ' ' + pt(ax, ay);
    }
    for (i = 0; i < n; i++) {
      out.push({ d: 'M ' + pt(ax, ay) + desce(i + 1) + ' A ' + q(passo / 2) + ' ' + q(Math.min(34, passo / 3)) + ' 0 0 1 ' + pt(xs[i], by) + sobe(i) + ' Z', n: i % 2 ? c2 : c1 });
    }
    return out;
  }

  /* bolinha preta cheia (olho, nariz) feita só de contorno: anéis um dentro do outro.
     O contorno tem 7 de espessura, então anéis de 6 em 6 fecham a bolinha toda. */
  function ponto(cx, cy, rx, ry) {
    ry = ry || rx;
    var out = [], k = 0;
    while (true) {
      var a = rx - 3.5 - 6 * k, b = ry - 3.5 - 6 * k;
      if (a < 1 && b < 1) break;
      out.push(elip(cx, cy, Math.max(a, 0.6), Math.max(b, 0.6)));
      k++;
    }
    if (!out.length) out.push(elip(cx, cy, 0.6, 0.6));
    return out;
  }
  function brilhinho(cx, cy, r) { return [reta([[cx - r, cy], [cx + r, cy]]), reta([[cx, cy - r], [cx, cy + r]])]; }

  /* ---------- bichinhos fofos ----------
     tipo: 'urso', 'coelho', 'gato', 'cachorro' ou 'pato'. (x, y) = centro da cabeça; R = raio da cabeça.
     c: números das cores { pelo, claro (focinho), bochecha, orelha, roupa, braco, pe, bico }.
     o: { corpo: false (só a cabeça), sentado, barriga: nº, maos: [[x,y] ou null, [x,y] ou null],
          segura: [formas entre o corpo e os braços], olhos: 'feliz' | 'dormindo' } */
  function bicho(tipo, x, y, R, c, o) {
    o = o || {};
    var F = [], L = [], i, s;
    function f(d, n) { F.push({ d: d, n: n }); }
    function l(v) { if (typeof v === 'string') L.push(v); else L.push.apply(L, v); }
    var pelo = c.pelo, roupa = c.roupa || pelo;
    if (o.corpo !== false) {
      // corpo de pera: a cabeça cobre o pescoço
      f(suave([[x, y + 0.55 * R], [x + 0.5 * R, y + 0.75 * R], [x + 0.8 * R, y + 1.45 * R], [x + 0.68 * R, y + 2.0 * R], [x, y + 2.12 * R],
        [x - 0.68 * R, y + 2.0 * R], [x - 0.8 * R, y + 1.45 * R], [x - 0.5 * R, y + 0.75 * R]]), roupa);
      if (o.barriga) f(elip(x, y + 1.5 * R, 0.42 * R, 0.4 * R), o.barriga);
      var pe = c.pe || pelo;
      if (o.pes === false) {
        // pés escondidos (atrás do balcão, dentro da banheira…)
      } else if (o.sentado) {
        f(elip(x - 0.46 * R, y + 2.02 * R, 0.3 * R, Math.max(25, 0.22 * R)), pe);
        f(elip(x + 0.46 * R, y + 2.02 * R, 0.3 * R, Math.max(25, 0.22 * R)), pe);
      } else {
        f(elip(x - 0.34 * R, y + 2.12 * R, 0.3 * R, Math.max(23, 0.17 * R)), pe);
        f(elip(x + 0.34 * R, y + 2.12 * R, 0.3 * R, Math.max(23, 0.17 * R)), pe);
      }
    }
    (o.segura || []).forEach(function (e) { F.push(e); });
    if (o.corpo !== false) {
      var maos = o.maos || [[x - 0.88 * R, y + 1.5 * R], [x + 0.88 * R, y + 1.5 * R]];
      var rb = Math.max(26, 0.21 * R), ombro = [[x - 0.5 * R, y + 0.95 * R], [x + 0.5 * R, y + 0.95 * R]];
      for (i = 0; i < 2; i++) if (maos[i]) {
        if (tipo === 'pato') {
          // pato tem asinha em vez de braço
          var mx = (ombro[i][0] + maos[i][0]) / 2, my = (ombro[i][1] + maos[i][1]) / 2, cmp = hyp(maos[i][0] - ombro[i][0], maos[i][1] - ombro[i][1]);
          f(elipR(mx, my, cmp / 2 + rb * 0.6, Math.max(30, 0.24 * R), Math.atan2(maos[i][1] - ombro[i][1], maos[i][0] - ombro[i][0]) * 180 / Math.PI), c.braco || pelo);
        } else f(pilula(ombro[i][0], ombro[i][1], maos[i][0], maos[i][1], rb), c.braco || pelo);
      }
    }
    // orelhas que ficam atrás da cabeça
    for (s = -1; s <= 1; s += 2) {
      if (tipo === 'urso') {
        // a parte de dentro da orelha é só um risco (como pintura, ficaria fininha demais)
        f(circ(x + s * 0.72 * R, y - 0.8 * R, 0.34 * R), pelo);
        l(arco(x + s * 0.75 * R, y - 0.86 * R, 0.17 * R, 175, 365));
      } else if (tipo === 'coelho') {
        // orelha comprida; a parte rosa fica mais para baixo, para sobrar a pontinha para pintar
        var ga = (90 + s * 10) * Math.PI / 180;
        f(elipR(x + s * 0.36 * R, y - 1.3 * R, 0.64 * R, 0.32 * R, 90 + s * 10), pelo);
        f(elipR(x + s * 0.36 * R + Math.cos(ga) * 0.16 * R, y - 1.3 * R + Math.sin(ga) * 0.16 * R, 0.36 * R, Math.max(22, 0.15 * R), 90 + s * 10), c.orelha || c.bochecha);
      } else if (tipo === 'gato') {
        f(poliR([[x + s * 1.0 * R, y - 0.2 * R], [x + s * 0.86 * R, y - 1.18 * R], [x + s * 0.2 * R, y - 0.86 * R]], 0.14 * R), pelo);
        l(reta([[x + s * 0.78 * R, y - 0.6 * R], [x + s * 0.8 * R, y - 0.98 * R], [x + s * 0.5 * R, y - 0.84 * R]]));
      }
    }
    f(elip(x, y, 1.06 * R, 0.94 * R), pelo);
    if (tipo === 'cachorro') {
      // orelhas caídas por cima da cabeça
      for (s = -1; s <= 1; s += 2) {
        f(suave([[x + s * 0.7 * R, y - 0.74 * R], [x + s * 1.12 * R, y - 0.5 * R], [x + s * 1.16 * R, y + 0.1 * R], [x + s * 0.96 * R, y + 0.44 * R],
          [x + s * 0.78 * R, y + 0.12 * R], [x + s * 0.68 * R, y - 0.36 * R]]), c.orelha || c.claro);
      }
    }
    // rosto
    var ex = 0.36 * R, ey = y + 0.02 * R, re = Math.max(10, 0.095 * R);
    for (s = -1; s <= 1; s += 2) {
      var ox = x + s * ex;
      if (o.olhos === 'feliz') l('M ' + pt(ox - re, ey + re * 0.5) + ' Q ' + pt(ox, ey - re * 1.5) + ' ' + pt(ox + re, ey + re * 0.5));
      else if (o.olhos === 'dormindo') l('M ' + pt(ox - re, ey) + ' Q ' + pt(ox, ey + re * 1.4) + ' ' + pt(ox + re, ey));
      else l(ponto(ox, ey, re));
    }
    var bx = tipo === 'cachorro' ? 0.56 : 0.64;
    if (tipo === 'urso' || tipo === 'cachorro') {
      f(elip(x, y + 0.38 * R, 0.34 * R, 0.25 * R), c.claro);
      l(ponto(x, y + 0.28 * R, 0.11 * R, 0.075 * R));
      l(reta([[x, y + 0.33 * R], [x, y + 0.42 * R]]));
      l('M ' + pt(x - 0.13 * R, y + 0.4 * R) + ' Q ' + pt(x - 0.065 * R, y + 0.5 * R) + ' ' + pt(x, y + 0.42 * R) + ' Q ' + pt(x + 0.065 * R, y + 0.5 * R) + ' ' + pt(x + 0.13 * R, y + 0.4 * R));
    } else if (tipo === 'pato') {
      f(elip(x, y + 0.34 * R, 0.36 * R, Math.max(23, 0.18 * R)), c.bico);
      l('M ' + pt(x - 0.3 * R, y + 0.34 * R) + ' Q ' + pt(x, y + 0.4 * R) + ' ' + pt(x + 0.3 * R, y + 0.34 * R));
      l('M ' + pt(x - 0.02 * R, y - 0.93 * R) + ' Q ' + pt(x - 0.12 * R, y - 1.22 * R) + ' ' + pt(x + 0.1 * R, y - 1.2 * R));
      l('M ' + pt(x + 0.02 * R, y - 0.93 * R) + ' Q ' + pt(x + 0.22 * R, y - 1.1 * R) + ' ' + pt(x + 0.26 * R, y - 0.98 * R));
    } else {
      l(ponto(x, y + 0.24 * R, 0.075 * R, 0.055 * R));
      l(reta([[x, y + 0.27 * R], [x, y + 0.33 * R]]));
      l('M ' + pt(x - 0.15 * R, y + 0.32 * R) + ' Q ' + pt(x - 0.075 * R, y + 0.42 * R) + ' ' + pt(x, y + 0.33 * R) + ' Q ' + pt(x + 0.075 * R, y + 0.42 * R) + ' ' + pt(x + 0.15 * R, y + 0.32 * R));
      if (tipo === 'gato') for (s = -1; s <= 1; s += 2) {
        l(reta([[x + s * 0.84 * R, y + 0.22 * R], [x + s * 1.2 * R, y + 0.14 * R]]));
        l(reta([[x + s * 0.84 * R, y + 0.34 * R], [x + s * 1.2 * R, y + 0.38 * R]]));
      }
    }
    if (c.bochecha) for (s = -1; s <= 1; s += 2) f(elip(x + s * bx * R, y + 0.3 * R, Math.max(27, 0.19 * R), Math.max(22, 0.13 * R)), c.bochecha);
    return { f: F, l: L };
  }

  // ---------- montagem de cada página ----------
  var LISTA = [];
  function pagina(id, pt_, en, cat, cores, variacoes, desenha) {
    var formas = [], linhas = [];
    function f(d, n) { formas.push({ d: d, n: n }); }
    function l(v) { if (typeof v === 'string') linhas.push(v); else linhas.push.apply(linhas, v); }
    function poe(b) { formas.push.apply(formas, b.f); linhas.push.apply(linhas, b.l); }
    desenha(f, l, poe);
    LISTA.push({ id: id, pt: pt_, en: en, cat: cat, cores: cores, formas: formas, linhas: linhas, variacoes: variacoes });
  }
  function v(pt_, en, cores) { return { pt: pt_, en: en, cores: cores }; }

  // ===== Ursinho na padaria =====
  pagina('urso-padaria', 'Ursinho na padaria', 'Bear at the bakery', 'passeio',
    ['#ffeccf', '#d99a62', '#b98058', '#f7dcbc', '#ff9fae', '#ffffff', '#f2b45a', '#f47c7c', '#bfe6f5', '#f9b7d3'],
    [v('Doce', 'Sweet', ['#ffe3ef', '#f4a7c4', '#f2c7a0', '#fff1e3', '#ff8fb1', '#ffffff', '#ffd59a', '#c99bf0', '#d7f3ff', '#a8e6cf']),
      v('Fim de tarde', 'Sunset', ['#ffd9b8', '#a8693c', '#8c5a3a', '#e8c39e', '#ff8a8a', '#fff6e8', '#e89a3c', '#3fa7a0', '#ffc38a', '#ffe08a'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      // toldo listrado com bainha de ondinhas
      for (var i = 0; i < 5; i++) f('M ' + pt(i * 200, 0) + ' L ' + pt(i * 200 + 200, 0) + ' L ' + pt(i * 200 + 200, 110) + ' A 100 42 0 0 1 ' + pt(i * 200, 110) + ' Z', i % 2 ? 6 : 8);
      // janela com vidro
      f(ret(50, 230, 240, 230, 24), 2);
      f(ret(90, 270, 160, 150, 12), 9);
      l(reta([[170, 270], [170, 420]])); l(reta([[90, 345], [250, 345]]));
      l(reta([[108, 312], [138, 290]])); l(reta([[188, 316], [222, 292]]));
      // prateleira com pães
      f(ret(700, 400, 270, 42, 14), 2);
      f(elip(770, 362, 62, 40), 7); l(reta([[742, 345], [756, 378]])); l(reta([[770, 340], [784, 382]])); l(reta([[798, 345], [810, 376]]));
      f(elipR(890, 364, 70, 34, 350), 7); l(reta([[865, 352], [870, 378]])); l(reta([[895, 348], [900, 376]]));
      f(ret(700, 545, 270, 42, 14), 2);
      f(circ(760, 494, 46), 7); l('M 732 486 Q 760 470 788 486'); l('M 736 506 Q 760 492 784 506');
      f(ret(830, 455, 76, 92, 20), 9); f(ret(836, 418, 64, 50, 14), 8);
      // ursinho de touca de padeiro (sem braços: eles vêm depois, por cima do balcão)
      poe(bicho('urso', 500, 450, 120, { pelo: 3, claro: 4, bochecha: 5, roupa: 6 }, { maos: [null, null], pes: false }));
      f(suave([[420, 300], [400, 240], [440, 190], [500, 175], [560, 190], [600, 240], [580, 300]]), 6);
      f(ret(425, 290, 150, 56, 18), 6);
      l('M 470 215 Q 480 250 470 285'); l('M 530 215 Q 520 250 530 285');
      // balcão
      f(ret(30, 655, 940, 345, 0), 2);
      f(ret(20, 625, 960, 58, 29), 4);
      f(ret(90, 730, 380, 220, 26), 4);
      f(ret(530, 730, 380, 220, 26), 4);
      f(coracao(280, 840, 60), 10);
      f(coracao(720, 840, 60), 10);
      // patinhas no balcão
      f(pilula(440, 560, 400, 640, 30), 3);
      f(pilula(560, 560, 600, 640, 30), 3);
      // cupcakes e pão redondo em cima do balcão
      f(poliR([[110, 560], [210, 560], [195, 640], [125, 640]], 10), 8);
      f(suave([[100, 565], [118, 520], [160, 500], [202, 520], [220, 565]]), 10);
      f(circ(160, 490, 24), 8);
      l(reta([[143, 568], [148, 636]])); l(reta([[160, 568], [160, 636]])); l(reta([[177, 568], [172, 636]]));
      f(elip(830, 590, 110, 60), 7);
      l('M 770 570 Q 790 600 780 625'); l('M 820 548 Q 840 590 830 640'); l('M 870 555 Q 890 590 882 630');
    });

  // ===== Piquenique do coelho =====
  pagina('coelho-piquenique', 'Piquenique do coelhinho', 'Bunny picnic', 'passeio',
    ['#bfe7ff', '#9bd77a', '#5fb865', '#b07a4f', '#ff8f8f', '#ffffff', '#ffb3c7', '#e9b872', '#ffd84d', '#ffe9a8', '#ef5b5b'],
    [v('Pôr do sol', 'Sunset', ['#ffc9a3', '#c9d86f', '#7aa65a', '#8c5a3a', '#7fb6ff', '#fff4e6', '#ff9ec0', '#d9a25a', '#ff8c42', '#fff1b8', '#c94a6a']),
      v('Outono', 'Autumn', ['#d9ecf2', '#d8c27a', '#e08a3c', '#8a5a3a', '#7cc8a8', '#f4e1c6', '#f5a3a3', '#c9894a', '#ffcf5c', '#ffe6b0', '#b5452f'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(circ(860, 140, 70), 9);
      for (var i = 0; i < 8; i++) { var a = i * 45 * Math.PI / 180; l(reta([[860 + Math.cos(a) * 92, 140 + Math.sin(a) * 92], [860 + Math.cos(a) * 125, 140 + Math.sin(a) * 125]])); }
      f(nuvem(560, 130, 190), 6);
      f(nuvem(330, 210, 140), 6);
      f(chao([[0, 520], [300, 470], [650, 500], [1000, 450]]), 3);
      f(chao([[0, 610], [350, 570], [700, 590], [1000, 560]]), 2);
      // árvore
      f(poliR([[110, 620], [140, 380], [190, 380], [220, 620]], 12), 4);
      f(suave([[50, 330], [60, 230], [140, 170], [240, 190], [290, 270], [270, 370], [170, 410], [80, 400]]), 3);
      f(circ(110, 280, 24), 11); f(circ(230, 300, 24), 11); f(circ(170, 220, 24), 11);
      // toalha xadrez: a toalha inteira e, por cima, os quadradinhos claros (3 fileiras × 5 colunas)
      function canto(u, w) { return [(330 + 570 * u) * (1 - w) + (250 + 740 * u) * w, 690 + 260 * w]; }
      f(poli([canto(0, 0), canto(1, 0), canto(1, 1), canto(0, 1)]), 5);
      for (var lin = 0; lin < 3; lin++) for (var col = 0; col < 5; col++) {
        if ((lin + col) % 2) f(poli([canto(col / 5, lin / 3), canto((col + 1) / 5, lin / 3), canto((col + 1) / 5, (lin + 1) / 3), canto(col / 5, (lin + 1) / 3)]), 6);
      }
      // coelhinho sentado acenando
      poe(bicho('coelho', 600, 495, 112, { pelo: 6, bochecha: 7, orelha: 7, roupa: 9 }, { sentado: true, maos: [[480, 680], [800, 520]] }));
      // cesta na grama
      f(faixa(170, 720, 72, 110, 180, 360), 8);
      f(poliR([[40, 712], [300, 712], [270, 860], [70, 860]], 16), 8);
      l(reta([[52, 760], [288, 760]])); l(reta([[62, 810], [278, 810]]));
      // sanduíche e maçã
      f(poliR([[330, 905], [480, 905], [405, 790]], 14), 10);
      l('M 362 875 Q 384 860 405 875 Q 426 890 448 875');
      f(circ(830, 860, 48), 11);
      f(elipR(854, 800, 38, 25, 330), 3);
      l(reta([[830, 815], [828, 795]]));
    });

  // ===== Gatinho na chuva =====
  pagina('gato-chuva', 'Gatinho na chuva', 'Kitty in the rain', 'natureza',
    ['#d6e8f5', '#eef3f8', '#ff7aa8', '#ffd166', '#f4b183', '#ff9fb0', '#ffe066', '#6ec1e4', '#9ccff0', '#a9d98b', '#7fc4ff'],
    [v('Arco-íris', 'Rainbow', ['#e6dcff', '#ffffff', '#7ad3a8', '#ffb3d1', '#c9c9d6', '#ff9fb0', '#9fd8ff', '#ff8f6b', '#c9b8ff', '#bfe8a0', '#b19cff']),
      v('Noite', 'Night', ['#2f3f6b', '#56658f', '#ff5c8a', '#ffd166', '#e9e2d0', '#ff9fb0', '#ff9a3d', '#2a9d8f', '#4a6fa5', '#3c6e57', '#8fb8ff'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(nuvem(170, 120, 250), 2);
      f(nuvem(880, 170, 220), 2);
      f(chao([[0, 790], [300, 760], [700, 780], [1000, 750]]), 10);
      f(elip(520, 905, 330, 62), 9);
      l(elip(520, 905, 230, 34)); l(curva([[320, 905], [360, 925], [400, 912]]));
      // gotas grandes e risquinhos de chuva
      [[90, 380], [180, 560], [880, 420], [930, 620], [110, 760], [800, 560]].forEach(function (g) { f(gota(g[0], g[1], 24), 11); });
      [[60, 250], [260, 300], [300, 470], [720, 280], [760, 430], [950, 320], [40, 520], [870, 760], [260, 650]].forEach(function (g) { l(reta([[g[0], g[1]], [g[0] - 12, g[1] + 36]])); });
      // gatinho de capa de chuva e botas
      poe(bicho('gato', 450, 560, 108, { pelo: 5, bochecha: 6, roupa: 7, braco: 7, pe: 8 }, { maos: [[330, 700], [610, 600]] }));
      // guarda-chuva: 4 gomos
      var ax = 610, ay = 150, bs = [340, 475, 610, 745, 880], by = 380;
      f('M ' + pt(bs[0], by) + ' C ' + pt(bs[0], 250) + ' ' + pt(470, ay) + ' ' + pt(ax, ay) + ' Q 520 230 ' + pt(bs[1], by) + ' A 67.5 34 0 0 1 ' + pt(bs[0], by) + ' Z', 3);
      f('M ' + pt(ax, ay) + ' L ' + pt(bs[2], by) + ' A 67.5 34 0 0 1 ' + pt(bs[1], by) + ' Q 520 230 ' + pt(ax, ay) + ' Z', 4);
      f('M ' + pt(ax, ay) + ' Q 700 230 ' + pt(bs[3], by) + ' A 67.5 34 0 0 1 ' + pt(bs[2], by) + ' L ' + pt(ax, ay) + ' Z', 3);
      f('M ' + pt(bs[4], by) + ' A 67.5 34 0 0 1 ' + pt(bs[3], by) + ' Q 700 230 ' + pt(ax, ay) + ' C ' + pt(750, ay) + ' ' + pt(bs[4], 250) + ' ' + pt(bs[4], by) + ' Z', 4);
      f(circ(ax, ay - 18, 22), 3);
      l(reta([[ax, by + 30], [ax, 560]]));
      l('M 610 640 L 610 680 Q 610 715 640 715 Q 665 715 665 690');
    });

  // ===== Banho de espuma =====
  pagina('pato-banho', 'Banho de espuma', 'Bubble bath', 'casa',
    ['#cdeefa', '#f7d6e0', '#ffffff', '#ffcf5c', '#ffe55c', '#ff9e3d', '#e2f3ff', '#ffa3b5', '#a8dd8a', '#ff8fc8'],
    [v('Doce', 'Sweet', ['#ffe0ef', '#d9c9ff', '#ffffff', '#b8f0d9', '#fff2a8', '#ffb07a', '#fff6fb', '#ff9fc0', '#9fd8ff', '#c9a3ff']),
      v('Mar', 'Sea', ['#a8e6e1', '#ffe6b3', '#f2fbff', '#3fb8af', '#ffd23f', '#ff7f50', '#d4f3ff', '#ff9f9f', '#ff8fa3', '#5aa9e6'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(ret(0, 600, 1000, 180), 7);
      f(ret(0, 780, 1000, 220), 2);
      // prateleira com xampu e toalha
      f(ret(70, 270, 90, 150, 28), 10); f(ret(92, 228, 46, 46, 10), 4);
      f(ret(180, 300, 70, 120, 24), 9); f(ret(196, 266, 38, 38, 10), 4);
      f(ret(40, 420, 240, 40, 16), 4);
      f(ret(770, 160, 200, 42, 20), 4);
      f(ret(790, 190, 160, 300, 24), 9); l(reta([[790, 420], [950, 420]])); l(reta([[790, 450], [950, 450]]));
      // patinho com touca de banho
      poe(bicho('pato', 500, 390, 122, { pelo: 5, bico: 6, bochecha: 8 }, { maos: [[310, 430], [690, 430]], olhos: 'feliz', pes: false }));
      f('M 372 330 A 128 112 0 0 1 628 330 Q 500 362 372 330 Z', 10);
      [[440, 290], [520, 270], [580, 310], [470, 240]].forEach(function (p) { l(circ(p[0], p[1], 9)); });
      // banheira
      f('M 120 580 L 880 580 Q 880 860 700 870 L 300 870 Q 120 860 120 580 Z', 3);
      f(poliR([[230, 860], [300, 860], [290, 930], [240, 930]], 10), 4);
      f(poliR([[700, 860], [770, 860], [760, 930], [710, 930]], 10), 4);
      f(ret(95, 555, 810, 52, 26), 3);
      // espuma por cima da borda e bolhas soltas
      [[170, 545, 58], [270, 520, 66], [380, 545, 52], [630, 535, 60], [740, 515, 70], [845, 545, 54]].forEach(function (b) { f(circ(b[0], b[1], b[2]), 7); });
      [[300, 300, 40], [700, 250, 34], [640, 140, 28], [350, 160, 30], [180, 120, 44], [880, 80, 28]].forEach(function (b) { f(circ(b[0], b[1], b[2]), 7); l(arco(b[0], b[1], b[2] * 0.62, 200, 250)); });
      // patinho de borracha na borda
      f(elip(880, 690, 62, 40), 5); f(circ(860, 630, 36), 5); f(elip(818, 642, 34, 24), 6);
      l(ponto(855, 620, 8));
    });

  // ===== Hora de dormir =====
  pagina('urso-quarto', 'Hora de dormir', 'Bedtime', 'casa',
    ['#cdd8ff', '#e8c39e', '#34407a', '#ffe27a', '#c98b5a', '#ff9ec7', '#ffffff', '#c99266', '#ff8fa3', '#9fe3c4', '#b8a1ff'],
    [v('Manhã', 'Morning', ['#fff1c9', '#d9b38c', '#9fdcff', '#ffffff', '#e0a875', '#8fd3ff', '#fffaf0', '#e8b07f', '#ff9eaa', '#ffb3c6', '#a8e6cf']),
      v('Doce', 'Sweet', ['#ffe0ef', '#f3c9a8', '#6a5acd', '#fff3b0', '#f4a7c4', '#c9a7ff', '#ffffff', '#f2c7a0', '#ff8fb1', '#ffe08a', '#9fe3c4'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(ret(0, 770, 1000, 230), 2);
      f(elip(580, 890, 380, 78), 11);
      // janela de noite com lua e cortinas
      f(ret(70, 110, 300, 290, 30), 5);
      f(ret(110, 150, 220, 210, 16), 3);
      f(lua(180, 245, 56, 46), 4);
      l(brilhinho(282, 200, 14)); l(brilhinho(292, 310, 11)); l(brilhinho(160, 330, 9));
      f(suave([[40, 100], [130, 100], [118, 250], [150, 430], [60, 440], [36, 260]]), 11);
      f(suave([[310, 100], [400, 100], [404, 260], [380, 440], [290, 430], [322, 250]]), 11);
      f(ret(25, 70, 390, 44, 22), 5);
      // estrelinhas na parede
      f(estrela(650, 170, 56, 28, 0), 4); f(estrela(870, 120, 50, 25, 15), 4); f(estrela(900, 330, 46, 23, 350), 4);
      // criado-mudo com abajur
      f(ret(60, 560, 230, 210, 20), 5);
      l(reta([[60, 650], [290, 650]]));
      f(circ(175, 610, 22), 4); f(circ(175, 710, 22), 4);
      f(poliR([[140, 562], [210, 562], [195, 495], [155, 495]], 10), 4);
      f(poliR([[100, 500], [250, 500], [215, 400], [135, 400]], 16), 10);
      // cama
      f(ret(370, 380, 90, 400, 40), 5);
      f(ret(895, 520, 75, 260, 34), 5);
      f(elip(530, 560, 108, 54), 7);
      poe(bicho('urso', 555, 482, 100, { pelo: 8, claro: 2, bochecha: 9 }, { corpo: false, olhos: 'dormindo' }));
      f(poliR([[440, 588], [600, 566], [760, 560], [930, 566], [935, 750], [430, 750]], 30), 6);
      f(poliR([[440, 588], [600, 566], [760, 560], [930, 566], [932, 616], [760, 610], [600, 616], [438, 640]], 24), 7);
      f(coracao(650, 690, 46), 11); f(coracao(820, 690, 46), 11);
      f(circ(520, 612, 34), 8); f(circ(600, 604, 34), 8);
      f(ret(380, 740, 590, 52, 22), 5);
      f(ret(400, 790, 46, 56, 12), 5); f(ret(905, 790, 46, 56, 12), 5);
      // zzz
      l(reta([[680, 370], [712, 370], [680, 402], [712, 402]]));
      l(reta([[735, 310], [760, 310], [735, 335], [760, 335]]));
      l(reta([[780, 262], [800, 262], [780, 282], [800, 282]]));
    });

  // ===== Coelhinho cozinheiro =====
  pagina('coelho-cozinha', 'Coelhinho cozinheiro', 'Little bunny chef', 'casa',
    ['#fff3d6', '#bfe8e0', '#8fcfc0', '#f4ede4', '#f0dcc8', '#ff9aa2', '#7aa6e0', '#d6d6e0', '#ffb347', '#ffb3c1', '#d9a066', '#6cc070'],
    [v('Limão', 'Lemon', ['#fbffd6', '#ffe08a', '#ffd166', '#fffaf0', '#ffffff', '#7ad3a8', '#ff8a8a', '#c9e4ff', '#ff9f43', '#ffb3c6', '#c08552', '#4fae5a']),
      v('Lavanda', 'Lavender', ['#efe6ff', '#ffd6e8', '#b9a3f0', '#fff8f0', '#d9c2a8', '#8fd3ff', '#ff7aa8', '#e3e3ec', '#ffb347', '#ff9fb0', '#e0a875', '#7cc68a'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(ret(0, 470, 1000, 190), 2);
      // armários de cima e relógio
      f(ret(30, 60, 260, 230, 24), 3); f(circ(255, 250, 22), 11);
      f(ret(710, 60, 260, 230, 24), 3); f(circ(745, 250, 22), 11);
      l(reta([[160, 60], [160, 290]])); l(reta([[840, 60], [840, 290]]));
      f(circ(570, 150, 72), 8);
      l(reta([[570, 150], [570, 105]])); l(reta([[570, 150], [600, 165]]));
      // coelhinha de avental mexendo a panela
      var cozinha = [
        { d: poliR([[345, 528], [415, 528], [425, 640], [335, 640]], 16), n: 6 },
        { d: ret(0, 630, 1000, 50), n: 4 },
        { d: ret(0, 680, 1000, 320), n: 3 },
        { d: ret(45, 720, 280, 240, 24), n: 2 }, { d: ret(360, 720, 280, 240, 24), n: 2 }, { d: ret(675, 720, 280, 240, 24), n: 2 },
        { d: circ(290, 840, 22), n: 11 }, { d: circ(395, 840, 22), n: 11 }, { d: circ(710, 840, 22), n: 11 },
        { d: ret(518, 525, 60, 44, 18), n: 7 }, { d: ret(822, 525, 60, 44, 18), n: 7 },
        { d: pilula(690, 520, 455, 425, 21), n: 11 },
        { d: ret(560, 495, 280, 140, 40), n: 7 },
        { d: ret(545, 478, 310, 42, 21), n: 7 },
        // tábua com cenoura
        { d: ret(60, 588, 210, 46, 18), n: 11 },
        { d: poliR([[100, 548], [100, 606], [250, 577]], 12), n: 9 },
        { d: elipR(72, 556, 34, 24, 335), n: 12 }, { d: elipR(72, 600, 34, 24, 25), n: 12 }
      ];
      poe(bicho('coelho', 380, 405, 105, { pelo: 5, bochecha: 10, orelha: 10, roupa: 5 }, { pes: false, segura: cozinha, maos: [[300, 610], [526, 453]] }));
      l(curva([[630, 455], [610, 420], [635, 385], [615, 350]])); l(curva([[700, 450], [680, 415], [705, 380], [685, 345]])); l(curva([[770, 455], [750, 420], [775, 385], [755, 350]]));
      l(reta([[150, 560], [158, 594]])); l(reta([[190, 568], [196, 588]]));
    });

  // ===== Sorveteria do gatinho =====
  pagina('gato-sorvete', 'Sorvete do gatinho', 'Kitty ice cream', 'passeio',
    ['#cdefff', '#ffe7b0', '#ff9fc4', '#ffffff', '#8fd3ff', '#c9c3dc', '#ffa3b1', '#e8b06a', '#ffd1dc', '#b5ead7', '#8b5a3c', '#ffe066'],
    [v('Tutti-frutti', 'Tutti frutti', ['#fff0c9', '#d6f5e3', '#7ad3a8', '#fffaf0', '#ffb3c6', '#f5c48a', '#ff8fa3', '#d9a066', '#ffe08a', '#c9a7ff', '#ff7a7a', '#8fd3ff']),
      v('Noite de verão', 'Summer night', ['#3b3f7a', '#c9b38a', '#ffd166', '#f6f1ff', '#ff8fb1', '#a8a3c7', '#ff9fb0', '#d9a066', '#ffb3c6', '#9fe3c4', '#6b4430', '#fff3a3'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(circ(120, 120, 60), 12);
      for (var i = 0; i < 8; i++) { var a = i * 45 * Math.PI / 180; l(reta([[120 + Math.cos(a) * 80, 120 + Math.sin(a) * 80], [120 + Math.cos(a) * 110, 120 + Math.sin(a) * 110]])); }
      f(nuvem(380, 110, 170), 4);
      f(ret(0, 790, 1000, 210), 2);
      // carrinho de sorvete com guarda-sol
      f(ret(746, 230, 40, 300, 14), 4);
      guardaChuva(766, 100, 560, 972, 280, 4, 3, 4).forEach(function (g) { f(g.d, g.n); });
      f(circ(766, 88, 24), 3);
      f(elip(645, 505, 50, 42), 9); f(elip(766, 500, 50, 42), 10); f(elip(887, 505, 50, 42), 11);
      f(ret(580, 520, 370, 230, 30), 5);
      f(ret(560, 498, 410, 44, 22), 4);
      f(coracao(765, 640, 62), 3);
      f(circ(650, 790, 56), 12); f(circ(880, 790, 56), 12);
      l(ponto(650, 790, 10)); l(ponto(880, 790, 10));
      // gatinho com casquinha de três bolas
      f(cobra([[175, 720, 24], [110, 680, 24], [92, 610, 24], [120, 556, 24]]), 6);
      var casquinha = [
        { d: poliR([[392, 640], [488, 640], [440, 775]], 12), n: 8 },
        { d: circ(440, 608, 50), n: 9 }, { d: circ(440, 540, 44), n: 10 }, { d: circ(440, 480, 38), n: 11 }, { d: circ(440, 428, 24), n: 3 }
      ];
      poe(bicho('gato', 265, 548, 108, { pelo: 6, bochecha: 7, roupa: 6 }, { segura: casquinha, maos: [[170, 700], [418, 676]] }));
      l(reta([[424, 722], [452, 752]])); l(reta([[456, 718], [432, 748]]));
    });

  // ===== Cachorrinho na praia =====
  pagina('cachorro-praia', 'Cachorrinho na praia', 'Puppy at the beach', 'passeio',
    ['#bfeaff', '#5cc6e8', '#ffe2a6', '#ffd23f', '#f2d2a9', '#b07a4f', '#ff9fb0', '#ff6b6b', '#ffffff', '#7bdcb5', '#ffb38a'],
    [v('Pôr do sol', 'Sunset', ['#ffcf9e', '#4f9fd8', '#f5d08a', '#ff7b54', '#ffe3c2', '#8c5a3a', '#ff8fa3', '#7a5af5', '#fff4e0', '#ffd166', '#ff9fd1']),
      v('Ilha', 'Island', ['#c9f7ef', '#2ab7ca', '#fff1c1', '#ffcd3c', '#d9b08c', '#6b4430', '#ff9fb0', '#ff8fc8', '#fefefe', '#b8f28b', '#ff8a5c'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(circ(130, 130, 64), 4);
      for (var i = 0; i < 8; i++) { var a = (i * 45 + 22) * Math.PI / 180; l(reta([[130 + Math.cos(a) * 86, 130 + Math.sin(a) * 86], [130 + Math.cos(a) * 116, 130 + Math.sin(a) * 116]])); }
      f(nuvem(470, 120, 180), 9);
      f(chao([[0, 470], [200, 455], [400, 470], [600, 455], [800, 470], [1000, 455]], 680), 2);
      l('M 60 540 Q 90 520 120 540'); l('M 250 575 Q 280 555 310 575'); l('M 520 525 Q 550 505 580 525');
      f(chao([[0, 640], [350, 615], [700, 640], [1000, 610]]), 3);
      // guarda-sol
      f(pilula(800, 330, 780, 800, 21), 6);
      guardaChuva(800, 200, 600, 1000, 380, 4, 8, 9).forEach(function (g) { f(g.d, g.n); });
      f(circ(800, 188, 24), 8);
      // cachorrinho sentado acenando
      poe(bicho('cachorro', 420, 520, 108, { pelo: 5, claro: 9, orelha: 6, bochecha: 7 }, { sentado: true, maos: [[320, 690], [575, 560]] }));
      // castelo de areia
      f(poliR([[640, 690, 4], [668, 690, 4], [668, 712, 4], [698, 712, 4], [698, 690, 4], [730, 690, 4], [730, 780, 4], [640, 780, 4]], 4), 3);
      f(poliR([[840, 690, 4], [868, 690, 4], [868, 712, 4], [898, 712, 4], [898, 690, 4], [930, 690, 4], [930, 780, 4], [840, 780, 4]], 4), 3);
      l(reta([[785, 650], [785, 560]]));
      f(poliR([[785, 560], [868, 590], [785, 622]], 8), 8);
      f(poliR([[720, 650, 4], [750, 650, 4], [750, 672, 4], [820, 672, 4], [820, 650, 4], [850, 650, 4], [850, 780, 4], [720, 780, 4]], 4), 3);
      f(ret(620, 770, 330, 130, 18), 3);
      f('M 750 900 L 750 845 A 35 35 0 0 1 820 845 L 820 900 Z', 6);
      // baldinho, conchinha e estrela-do-mar
      l('M 100 805 Q 160 720 220 805');
      f(poliR([[90, 800], [230, 800], [210, 930], [110, 930]], 14), 10);
      f(ret(78, 782, 164, 42, 21), 8);
      f(estrela(510, 880, 62, 30, 10), 11);
      f('M 330 940 A 55 55 0 0 1 440 940 Z', 9);
      l(reta([[385, 940], [385, 892]])); l(reta([[385, 940], [355, 900]])); l(reta([[385, 940], [415, 900]]));
    });

  // ===== Aniversário do ursinho =====
  pagina('urso-aniversario', 'Aniversário do ursinho', "Bear's birthday", 'festa',
    ['#fff0f5', '#ff8fab', '#8fd3ff', '#ffe066', '#c8956a', '#f5dcc0', '#ff9e9e', '#ffffff', '#f7c59f', '#b8e0d2', '#c3a6ff', '#ffb347'],
    [v('Chocolate', 'Chocolate', ['#fff6e0', '#ff7aa8', '#7ad3a8', '#ffd166', '#e3b07c', '#fff0dc', '#ff8fa3', '#fff8f0', '#8b5a3c', '#ffd6e0', '#8fd3ff', '#ff9f43']),
      v('Festa à noite', 'Night party', ['#33306b', '#ff5c8a', '#4cc9f0', '#ffd23f', '#d9a578', '#f7e0c4', '#ff9fb0', '#fff3fb', '#c9a7ff', '#7a6ad8', '#ff9fd6', '#ffb347'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      // bandeirinhas
      function yb(x) { var t = x / 1000; return 50 + 200 * t * (1 - t); }
      for (var i = 0; i < 9; i++) {
        var x = 60 + i * 110;
        f(poliR([[x - 46, yb(x - 46)], [x + 46, yb(x + 46)], [x, yb(x) + 96]], 10), [2, 3, 4][i % 3]);
      }
      l('M 0 50 Q 500 150 1000 50');
      // balões
      f(elip(110, 210, 62, 76), 4); l(curva([[110, 286], [126, 310], [146, 330]]));
      f(elip(880, 330, 66, 80), 11); l(curva([[880, 410], [895, 480], [878, 560], [892, 650]]));
      // ursinho de chapéu de festa
      poe(bicho('urso', 300, 425, 112, { pelo: 5, claro: 6, bochecha: 7 }, { pes: false, maos: [[160, 345], [470, 640]] }));
      f(poliR([[248, 335], [352, 335], [300, 190]], 12), 3);
      l(reta([[268, 290], [318, 272]])); l(reta([[284, 245], [310, 236]]));
      f(circ(300, 190, 26), 4);
      // bolo de dois andares
      f(ret(490, 540, 320, 130, 30), 9);
      f('M 490 566 Q 490 540 516 540 L 784 540 Q 810 540 810 566 L 810 584 Q 770 650 730 584 Q 690 630 650 584 Q 610 650 570 584 Q 530 630 490 584 Z', 8);
      f(ret(545, 450, 210, 100, 26), 9);
      f('M 545 472 Q 545 450 567 450 L 733 450 Q 755 450 755 472 L 755 488 Q 720 540 685 488 Q 650 530 615 488 Q 580 540 545 488 Z', 8);
      [[595, 3], [650, 2], [705, 4]].forEach(function (c) { f(ret(c[0] - 20, 372, 40, 82, 10), c[1]); f(gota(c[0], 348, 22), 12); });
      l(reta([[530, 640], [545, 650]])); l(reta([[610, 630], [626, 640]])); l(reta([[700, 640], [716, 630]])); l(reta([[770, 625], [784, 638]]));
      // toalha da mesa com babadinho
      f(ret(40, 650, 920, 350, 30), 10);
      for (i = 0; i < 9; i++) f('M ' + pt(50 + i * 100, 740) + ' A 50 44 0 0 0 ' + pt(150 + i * 100, 740) + ' Z', i % 2 ? 3 : 2);
      // a patinha em cima da mesa vem por último
      f(pilula(412, 530, 470, 640, 27), 5);
    });

  // ===== Coelhinho na feira =====
  pagina('coelho-feira', 'Coelhinho na feira', 'Bunny at the market', 'passeio',
    ['#d8f3ff', '#8fd694', '#ffffff', '#d9a066', '#e8d5c4', '#ffb3c6', '#ff5c5c', '#ffa94d', '#5cb85c', '#f2cf6b', '#e6d3b3', '#ff9fb0'],
    [v('Outono', 'Autumn', ['#ffe8cc', '#e07a5f', '#fff8ec', '#a8693c', '#f4e1c6', '#7ad3a8', '#c94a4a', '#ffb347', '#8a9a3a', '#e3a857', '#d8c3a5', '#ff9fb0']),
      v('Doce', 'Sweet', ['#ffe6f2', '#c9a7ff', '#fffafd', '#f4a7c4', '#ffffff', '#8fd3ff', '#ff6f91', '#ffc75f', '#7cd992', '#ffe08a', '#f7e6ff', '#ff9fb0'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(nuvem(840, 110, 180), 3);
      f(ret(0, 820, 1000, 180), 11);
      // barraca
      f(ret(90, 240, 44, 580, 14), 4); f(ret(586, 240, 44, 580, 14), 4);
      for (var i = 0; i < 6; i++) f('M ' + pt(60 + i * 100, 120) + ' L ' + pt(160 + i * 100, 120) + ' L ' + pt(160 + i * 100, 230) + ' A 50 34 0 0 1 ' + pt(60 + i * 100, 230) + ' Z', i % 2 ? 3 : 2);
      f(ret(45, 84, 630, 48, 22), 4);
      // maçãs, laranjas e cesta de cenouras no balcão
      [[140, 524], [212, 524], [176, 466]].forEach(function (p) { f(circ(p[0], p[1], 37), 7); l(reta([[p[0], p[1] - 37], [p[0] + 6, p[1] - 52]])); });
      [[318, 524], [390, 524], [354, 466]].forEach(function (p) { f(circ(p[0], p[1], 37), 8); });
      // alfaces na cestinha
      f(circ(490, 488, 42), 9); f(circ(565, 488, 42), 9);
      l(curva([[470, 470], [490, 490], [480, 512]])); l(curva([[545, 470], [565, 490], [555, 512]]));
      f(poliR([[440, 512], [612, 512], [597, 562], [455, 562]], 14), 10);
      f(ret(60, 556, 600, 50, 20), 4);
      f(ret(80, 606, 250, 200, 16), 4); f(ret(390, 606, 250, 200, 16), 4);
      l(reta([[80, 670], [330, 670]])); l(reta([[80, 740], [330, 740]])); l(reta([[390, 670], [640, 670]])); l(reta([[390, 740], [640, 740]]));
      // coelhinha com cesta de compras
      var cesta = [
        { d: faixa(665, 772, 48, 88, 180, 360), n: 10 },
        { d: circ(628, 738, 34), n: 7 }, { d: circ(703, 740, 34), n: 8 },
        { d: poliR([[585, 762], [745, 762], [725, 870], [605, 870]], 14), n: 10 }
      ];
      poe(bicho('coelho', 800, 598, 100, { pelo: 5, bochecha: 12, orelha: 12, roupa: 6 }, { segura: cesta, maos: [[720, 760], [930, 560]] }));
      l(reta([[600, 805], [730, 805]]));
    });

  // ===== Passeio de bicicleta =====
  pagina('cachorro-bicicleta', 'Passeio de bicicleta', 'Bike ride', 'veiculos',
    ['#c6ecff', '#a5dc86', '#ece4d4', '#ff6b6b', '#5b5f73', '#fff6d6', '#f7e1c3', '#c98f5a', '#7cc6ff', '#ff9fb0', '#e9b872', '#ff9fd1'],
    [v('Outono', 'Autumn', ['#ffe9c7', '#e0a458', '#d8cbb3', '#2a9d8f', '#4a4e69', '#fff3d6', '#f2d0a4', '#8c5a3a', '#ffb347', '#ff9fb0', '#c9894a', '#e76f51']),
      v('Doce', 'Sweet', ['#ffe3f1', '#bfe8c9', '#f6effa', '#b28dff', '#6d6875', '#fffafd', '#ffffff', '#ffc4a3', '#ff8fb1', '#ff9fb0', '#ffd6a5', '#8fd3ff'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(nuvem(200, 120, 190), 6); f(nuvem(760, 90, 150), 6);
      f(chao([[0, 560], [250, 500], [550, 560], [800, 500], [1000, 540]], 830), 2);
      f(ret(0, 820, 1000, 180), 3);
      for (var i = 0; i < 5; i++) l(reta([[40 + i * 200, 925], [140 + i * 200, 925]]));
      l(curva([[60, 460], [120, 450], [170, 462]])); l(curva([[30, 520], [100, 510], [150, 522]]));
      // rodas
      [[270, 720], [720, 720]].forEach(function (c) { f(circ(c[0], c[1], 110), 5); f(circ(c[0], c[1], 72), 6); });
      // quadro (os canos) e guidão
      [[[270, 720], [450, 730]], [[270, 720], [400, 560]], [[400, 560], [450, 730]], [[450, 730], [640, 560]], [[400, 560], [640, 560]], [[640, 560], [720, 720]], [[640, 560], [620, 470]]].forEach(function (c) {
        f(pilula(c[0][0], c[0][1], c[1][0], c[1][1], 20), 4);
      });
      f(circ(270, 720, 23), 4); f(circ(720, 720, 23), 4);
      // cestinha com flor
      f(flor(730, 440, 62), 12); f(circ(730, 440, 23), 6);
      f(ret(655, 480, 150, 100, 18), 11);
      l(reta([[655, 520], [805, 520]])); l(reta([[700, 480], [700, 580]])); l(reta([[760, 480], [760, 580]]));
      f(pilula(590, 470, 660, 470, 21), 5);
      // cachorrinho de capacete pedalando
      var perna = [{ d: pilula(470, 500, 482, 690, 27), n: 7 }, { d: elip(498, 708, 40, 26), n: 7 }];
      poe(bicho('cachorro', 430, 330, 100, { pelo: 7, claro: 6, orelha: 8, bochecha: 10 }, { sentado: true, pes: false, segura: perna, maos: [null, [612, 468]] }));
      f('M 318 312 A 112 110 0 0 1 542 312 Z', 9);
      l(curva([[350, 300], [400, 248], [470, 232]]));
    });

  // ===== Lendo na janela =====
  pagina('gato-janela', 'Lendo na janela', 'Reading by the window', 'casa',
    ['#ffe8d6', '#a9d6ff', '#ffffff', '#c3aed6', '#ffd166', '#f6b26b', '#ff9fb0', '#ef6f6c', '#c9875f', '#7ccf8a', '#5aa469', '#9ad1d4'],
    [v('Noite', 'Night', ['#3d3a6b', '#1f2a5a', '#fff6e0', '#7a6ad8', '#ffb347', '#e8e1d5', '#ff9fb0', '#4cc9f0', '#8c5a3a', '#6fcf97', '#2f5d50', '#ff8fb1']),
      v('Primavera', 'Spring', ['#e9fbe9', '#ffd6e8', '#fffdf5', '#ff9fc4', '#b8e6ff', '#c9c3dc', '#ff9fb0', '#ffd166', '#e0a875', '#9be37b', '#ff8fb1', '#ffb3c6'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      // janela com uma nuvem e uma árvore lá fora
      f(ret(150, 90, 700, 520, 30), 3);
      f(ret(190, 130, 620, 440, 18), 2);
      f(nuvem(320, 230, 170), 3);
      f(circ(720, 470, 92), 11);
      f(ret(480, 130, 40, 440), 3);
      f(suave([[110, 70], [230, 70], [215, 300], [250, 620], [120, 640], [100, 300]]), 4);
      f(suave([[770, 70], [890, 70], [900, 300], [880, 640], [750, 620], [785, 300]]), 4);
      f(ret(70, 46, 860, 44, 22), 9);
      // banco da janela
      f(ret(70, 690, 860, 310), 9);
      f(ret(120, 740, 340, 200, 24), 3); f(ret(540, 740, 340, 200, 24), 3);
      f(circ(290, 840, 24), 9); f(circ(710, 840, 24), 9);
      f(ret(90, 606, 820, 96, 44), 5);
      // vasinho e caneca
      f(elipR(780, 470, 52, 28, 300), 10); f(elipR(840, 470, 52, 28, 240), 10); f(elipR(810, 450, 54, 28, 270), 10);
      f(poliR([[760, 520], [860, 520], [845, 612], [775, 612]], 14), 9);
      l(arco(165, 572, 26, 90, 270));
      f(ret(165, 532, 85, 80, 18), 12);
      l(curva([[195, 515], [185, 495], [200, 475]])); l(curva([[222, 515], [212, 495], [227, 475]]));
      // gatinho lendo
      f(cobra([[580, 640, 22], [660, 645, 22], [705, 610, 22], [700, 560, 22]]), 6);
      var livro = [
        { d: poliR([[372, 515], [628, 515], [618, 655], [382, 655]], 16), n: 8 },
        { d: poliR([[394, 530], [500, 548], [500, 640], [394, 628]], 6), n: 3 },
        { d: poliR([[500, 548], [606, 530], [606, 628], [500, 640]], 6), n: 3 }
      ];
      poe(bicho('gato', 500, 360, 108, { pelo: 6, bochecha: 7 }, { sentado: true, segura: livro, maos: [[396, 590], [604, 590]] }));
      l(reta([[430, 566], [480, 572]])); l(reta([[430, 590], [480, 596]])); l(reta([[520, 572], [570, 566]])); l(reta([[520, 596], [570, 590]]));
    });

  // ===== Acampamento à noite =====
  pagina('urso-acampamento', 'Acampamento à noite', 'Camping at night', 'natureza',
    ['#2e3a6b', '#ffe28a', '#2f6b5a', '#5b8c5a', '#ff9f68', '#6b3f33', '#b07d56', '#f1d1b0', '#ff6b3d', '#ffd23f', '#8a5a3c', '#ffffff'],
    [v('Fim de tarde', 'Dusk', ['#ffb38a', '#fff3c4', '#3f7f5f', '#8fbf6a', '#5aa9e6', '#2f3e5c', '#c48a5c', '#f6dcc0', '#ff5d5d', '#ffd166', '#7a4a2c', '#fff6fb']),
      v('Lua cheia', 'Full moon', ['#1b1f3b', '#f1f1ff', '#3a5a7a', '#4a6a5a', '#c9a7ff', '#3d2c5a', '#d9b48c', '#f7e4cc', '#ff8fa3', '#ffe08a', '#6b4a3a', '#ffe6f2'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(lua(830, 140, 66, 52), 2);
      f(estrela(140, 110, 46, 22, 0), 2); f(estrela(430, 80, 42, 20, 20), 2); f(estrela(620, 220, 40, 19, 345), 2);
      l(brilhinho(280, 200, 14)); l(brilhinho(720, 90, 12)); l(brilhinho(940, 300, 12)); l(brilhinho(520, 330, 10));
      f(pinheiro(110, 660, 190, 400), 3); f(pinheiro(930, 650, 150, 330), 3); f(pinheiro(820, 640, 120, 250), 3);
      f(chao([[0, 620], [400, 600], [1000, 630]]), 4);
      // barraca
      f(poliR([[330, 300], [590, 790], [70, 790]], 18), 5);
      f(poliR([[330, 470], [415, 790], [245, 790]], 10), 6);
      l(reta([[330, 310], [330, 470]]));
      // fogueira
      f(pilula(470, 905, 650, 860, 22), 11); f(pilula(470, 860, 650, 905, 22), 11);
      f(suave([[560, 690], [602, 755], [622, 820], [592, 865], [528, 865], [498, 820], [518, 755]]), 9);
      f(suave([[560, 770], [588, 815], [578, 852], [542, 852], [532, 815]]), 10);
      // ursinho no tronco assando marshmallow
      f(pilula(680, 815, 930, 815, 40), 11);
      poe(bicho('urso', 790, 570, 100, { pelo: 7, claro: 8, bochecha: 9 }, { sentado: true, maos: [[680, 650], [890, 720]] }));
      l(reta([[665, 655], [592, 640]]));
      f(ret(530, 610, 66, 56, 16), 12);
    });

  // ===== Casinha na árvore =====
  pagina('casa-arvore', 'Casinha na árvore', 'Treehouse', 'natureza',
    ['#bde7ff', '#93d36b', '#a0714f', '#5fbf5f', '#ffd59e', '#ff7b7b', '#fff3b0', '#d9a066', '#ffffff', '#ff9fc4', '#ffd23f'],
    [v('Outono', 'Autumn', ['#ffe3c2', '#d8c27a', '#7a4a2c', '#f08a3c', '#fff1d6', '#7a5af5', '#ffe08a', '#b07a4f', '#fff8ec', '#ff8fa3', '#ffd23f']),
      v('Algodão-doce', 'Cotton candy', ['#ffe3f1', '#bfe8c9', '#b58463', '#9fd8ff', '#fff6fb', '#c9a7ff', '#ffe08a', '#f4a7c4', '#ffffff', '#ff9fb0', '#ffd166'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(nuvem(150, 110, 180), 9); f(nuvem(870, 90, 150), 9);
      f(suave([[100, 420], [90, 280], [180, 175], [320, 120], [500, 100], [680, 120], [820, 175], [910, 290], [900, 430], [780, 520], [500, 545], [220, 520]]), 4);
      [[190, 300], [830, 310], [250, 460], [880, 430], [700, 190]].forEach(function (p) { f(circ(p[0], p[1], 26), 6); });
      f(chao([[0, 820], [500, 800], [1000, 820]]), 2);
      f(poliR([[420, 1000], [600, 1000], [575, 560], [445, 560]], 16), 3);
      f(cobra([[580, 650, 24], [660, 620, 24], [720, 570, 24]]), 3);
      // plataforma e casinha
      f(ret(240, 560, 540, 46, 18), 8);
      f(ret(450, 360, 290, 200), 5);
      f(poliR([[418, 374], [772, 374], [595, 220]], 14), 6);
      f(circ(530, 445, 42), 7);
      l(reta([[530, 403], [530, 487]])); l(reta([[488, 445], [572, 445]]));
      f('M 615 560 L 615 470 A 40 40 0 0 1 695 470 L 695 560 Z', 8);
      l(ponto(675, 515, 8));
      // balanço e escada de cordas
      l(reta([[700, 606], [690, 760]])); l(reta([[770, 606], [780, 760]]));
      f(ret(668, 756, 130, 42, 16), 6);
      l(reta([[300, 606], [290, 900]])); l(reta([[380, 606], [390, 900]]));
      for (var i = 0; i < 5; i++) l(reta([[298 - i * 2, 660 + i * 55], [382 + i * 2, 660 + i * 55]]));
      // coelhinho acenando lá em cima
      poe(bicho('coelho', 330, 372, 88, { pelo: 9, bochecha: 10, orelha: 10, roupa: 7 }, { maos: [[245, 470], [225, 300]] }));
      // flores no chão
      [[110, 900], [830, 910], [930, 850]].forEach(function (p) { f(flor(p[0], p[1], 54), 10); f(circ(p[0], p[1], 23), 11); });
    });

  // ===== Natal =====
  pagina('natal', 'Natal com presentes', 'Christmas presents', 'festa',
    ['#dbeeff', '#e3b98f', '#3fae6a', '#ffd23f', '#ff5c5c', '#5ab0ff', '#ff8fc8', '#9be37b', '#fff3b0', '#c58d63', '#ffffff', '#ff9fb0'],
    [v('Dourado', 'Golden', ['#fff4dc', '#c9a27a', '#2f8f5b', '#ffcf40', '#c0392b', '#e8b04a', '#a3d9ff', '#ff9f9f', '#fffaf0', '#d9a578', '#fffdf8', '#ff9fb0']),
      v('Doce', 'Sweet', ['#ffe6f2', '#f3d1b8', '#7fd6b0', '#fff08a', '#ff7aa8', '#b28dff', '#8fd3ff', '#ffd166', '#ffffff', '#e8c2a0', '#fffafd', '#ff9fb0'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      f(ret(0, 780, 1000, 220), 2);
      // janela com neve
      f(ret(640, 90, 300, 260, 28), 11);
      f(ret(678, 128, 224, 184, 14), 6);
      [[720, 170], [800, 230], [860, 160], [740, 270], [870, 280]].forEach(function (p) { l(reta([[p[0] - 10, p[1] - 10], [p[0] + 10, p[1] + 10]])); l(reta([[p[0] - 10, p[1] + 10], [p[0] + 10, p[1] - 10]])); });
      // árvore de Natal
      f(poliR([[205, 700], [335, 700], [318, 800], [222, 800]], 14), 5);
      f(poliR([[270, 420], [500, 720], [40, 720]], 22), 3);
      f(poliR([[270, 290], [450, 540], [90, 540]], 20), 3);
      f(poliR([[270, 170], [395, 370], [145, 370]], 18), 3);
      [[150, 670, 5], [290, 680, 6], [410, 665, 4], [200, 490, 6], [345, 485, 5], [235, 335, 4], [300, 330, 5]].forEach(function (b) { f(circ(b[0], b[1], 25), b[2]); });
      l(curva([[110, 600], [250, 625], [420, 595]])); l(curva([[160, 430], [270, 450], [380, 425]]));
      f(estrela(270, 158, 64, 30, 0), 4);
      // presentes
      f(ret(50, 700, 140, 100, 10), 8); f(ret(50, 732, 140, 40), 9);
      f(ret(360, 690, 170, 110, 10), 7); f(ret(425, 690, 40, 110), 9);
      f(elipR(420, 676, 36, 24, 330), 9); f(elipR(470, 676, 36, 24, 30), 9);
      // ursinho de gorro com um presente
      var presente = [{ d: ret(680, 680, 130, 96, 12), n: 8 }];
      poe(bicho('urso', 745, 562, 108, { pelo: 10, claro: 11, bochecha: 12 }, { sentado: true, segura: presente, maos: [[688, 712], [802, 712]] }));
      l(reta([[745, 680], [745, 776]]));
      f(suave([[652, 462], [700, 380], [780, 340], [860, 352], [890, 405], [835, 462]]), 5);
      f(circ(893, 410, 30), 11);
      f(ret(636, 442, 220, 46, 23), 11);
    });

  // ===== Unicórnio no arco-íris =====
  pagina('unicornio', 'Unicórnio no arco-íris', 'Rainbow unicorn', 'fantasia',
    ['#e7dcff', '#ff8a8a', '#ffc078', '#ffe680', '#a8e6a1', '#8fd3ff', '#ffffff', '#ff9fd6', '#c9a7ff', '#ffd36e', '#ffb3c6', '#bdeaa6'],
    [v('Noite mágica', 'Magic night', ['#2b2d63', '#ff7aa8', '#ffb347', '#fff07a', '#7ad3a8', '#6fb8ff', '#f4f0ff', '#8fd3ff', '#ff9fd6', '#ffe08a', '#c9a7ff', '#4a5a8a']),
      v('Pastel', 'Pastel', ['#fff6e5', '#ffc4d6', '#ffe0b5', '#fff6b0', '#d4f5d0', '#cfe8ff', '#ffffff', '#b8f0e0', '#ffd6a5', '#ffd166', '#ff9fb0', '#d9f2c4'])],
    function (f, l, poe) {
      f(ret(0, 0, 1000, 1000), 1);
      [[420, 2], [380, 3], [340, 4], [300, 5], [260, 6]].forEach(function (b) { f(faixa(500, 640, b[0], b[0] + 40, 180, 360), b[1]); });
      f(nuvem(120, 630, 230), 7); f(nuvem(880, 630, 230), 7);
      f(estrela(110, 210, 48, 23, 0), 4); f(estrela(890, 210, 48, 23, 15), 4); f(estrela(500, 90, 44, 21, 350), 4);
      f(chao([[0, 800], [500, 770], [1000, 800]]), 12);
      // unicórnio: rabo e pernas atrás do corpo
      f(suave([[330, 640], [250, 590], [190, 630], [200, 715], [250, 760], [310, 725]]), 8);
      f(suave([[315, 700], [255, 730], [240, 800], [300, 812], [340, 760]]), 9);
      [360, 430, 545, 615].forEach(function (x) { f(pilula(x, 720, x, 860, 30), 7); });
      f(elip(480, 680, 175, 108), 7);
      [360, 430, 545, 615].forEach(function (x) { f(ret(x - 32, 838, 64, 42, 14), 11); });
      f(suave([[530, 650], [585, 540], [660, 480], [700, 560], [645, 690]]), 7);
      f(poliR([[588, 372], [652, 346], [598, 255]], 10), 7);
      f(circ(665, 445, 102), 7);
      f(elip(752, 495, 80, 60), 7);
      l(ponto(800, 486, 7)); l('M 760 528 Q 785 545 812 525');
      // crina e topete
      f(circ(585, 330, 44), 8); f(circ(556, 405, 46), 9); f(circ(552, 488, 44), 8); f(circ(572, 565, 42), 9);
      f(circ(640, 345, 40), 9);
      f(poliR([[648, 342], [712, 346], [700, 190]], 10), 10);
      l(reta([[660, 315], [702, 300]])); l(reta([[668, 270], [700, 258]])); l(reta([[678, 228], [698, 220]]));
      // olhinho fechado com cílios e bochecha
      l('M 655 438 Q 680 462 705 438'); l(reta([[662, 448], [652, 462]])); l(reta([[680, 452], [680, 468]])); l(reta([[698, 448], [708, 462]]));
      f(elip(690, 500, 30, 22), 11);
    });

  // ---------- categorias (só as usadas) ----------
  var CATEGORIAS = [
    { id: 'bichos', pt: 'Bichinhos', en: 'Animals', ico: '🐻' },
    { id: 'casa', pt: 'Em casa', en: 'At home', ico: '🏠' },
    { id: 'passeio', pt: 'Passeios', en: 'Outings', ico: '🧺' },
    { id: 'festa', pt: 'Festas', en: 'Parties', ico: '🎂' },
    { id: 'fantasia', pt: 'Fantasia', en: 'Fantasy', ico: '🦄' },
    { id: 'natureza', pt: 'Natureza', en: 'Nature', ico: '🌷' },
    { id: 'veiculos', pt: 'Veículos', en: 'Vehicles', ico: '🚗' }
  ].filter(function (c) { return LISTA.some(function (p) { return p.cat === c.id; }); });

  var API = { LISTA: LISTA, CATEGORIAS: CATEGORIAS };
  raiz.DesenhoPaginas = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
