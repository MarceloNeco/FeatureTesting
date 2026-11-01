/* Desenho Meu — o MOTOR de desenho (navegador). Recebe o <canvas> da tela e cuida de tudo que aparece nele:
   camadas, pincéis, balde de tinta, pintar por números, adesivos, fundos, desfazer, zoom e foto.

   Camadas, de baixo para cima:
     1. fundo (papel, cor, paisagem de fundos.js ou foto da galeria)
     2. números (no modo "pintar por números": as áreas já pintadas e a área da cor escolhida em cinza)
     3. pintura (quadradinhos de 512 × 512 criados só onde se pinta — a folha não tem fim: ao deitar o aparelho
        ela cresce para os lados e dá para desenhar lá também. Pincéis "parados" e balde ficam gravados aqui)
     4. pincéis vivos (arco-íris, neon, purpurina, minhoca: guardados como pontos e desenhados a cada quadro)
     5. contorno do desenho de colorir (sempre por cima, nítido em qualquer zoom)
     6. adesivos (emojis e adesivos animados)
     7. números das áreas, festa (fogos) e as miras da mão / do celular.

   Desfazer: antes de um quadradinho da pintura mudar pela 1ª vez num gesto,
   guardamos como ele era. Desfazer = devolver os quadradinhos. Assim dá para desenhar direto (sem atraso) e o
   desfazer gasta memória só do que mudou.

   Quem chama (app.js / tv.js) fala com o motor por M.apontar(fonte, x, y, apertado): o dedo, o mouse, a mão na
   câmera e o celular de controle são só "fontes" diferentes — por isso a TV aceita vários desenhando juntos. */
(function (raiz) {
  'use strict';
  var F = raiz.DesenhoFolha;
  var W = F.W, H = F.H, PAG = F.PAGINA, ESC = PAG.w / 1000;      // caixa 1000 do desenho de colorir → 1400 no mundo
  var TS = 512, NTX = Math.ceil(W / TS), NTY = Math.ceil(H / TS);
  var DESENHO = { x: W / 2 - 1024, y: H / 2 - 1024, w: 2048, h: 2048 };   // onde a paisagem (feita em 2048) fica no mundo
  var LIMITE_BYTES = 110 * 1024 * 1024, MAX_OPS = 60;
  var CONTORNO = 7;                                                // espessura do contorno (caixa 1000)

  var PINCEIS = [
    { id: 'canetinha', ico: '🖊️', pt: 'Canetinha', en: 'Marker' },
    { id: 'lapis', ico: '✏️', pt: 'Lápis', en: 'Pencil' },
    { id: 'giz', ico: '🖍️', pt: 'Giz de cera', en: 'Crayon' },
    { id: 'pincel', ico: '🖌️', pt: 'Pincel macio', en: 'Soft brush' },
    { id: 'spray', ico: '💨', pt: 'Spray', en: 'Spray' },
    { id: 'arcoiris', ico: '🌈', pt: 'Arco-íris vivo', en: 'Live rainbow', vivo: true },
    { id: 'neon', ico: '💡', pt: 'Neon que pisca', en: 'Glowing neon', vivo: true },
    { id: 'purpurina', ico: '✨', pt: 'Purpurina', en: 'Glitter', vivo: true },
    { id: 'minhoca', ico: '🐛', pt: 'Minhoca dançante', en: 'Dancing worm', vivo: true },
    { id: 'balde', ico: '🪣', pt: 'Balde de tinta', en: 'Paint bucket' },
    { id: 'borracha', ico: '🧽', pt: 'Borracha', en: 'Eraser' },
    { id: 'adesivo', ico: '⭐', pt: 'Adesivo', en: 'Sticker' },
    { id: 'mover', ico: '✋', pt: 'Mover adesivo', en: 'Move sticker' }
  ];
  var VIVO = {}; PINCEIS.forEach(function (p) { if (p.vivo) VIVO[p.id] = 1; });

  function agora() { return (raiz.performance ? performance.now() : Date.now()) / 1000; }
  function hexRgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function clarear(h, k) { var c = hexRgb(h); return 'rgb(' + c.map(function (v) { return Math.round(v + (255 - v) * k); }).join(',') + ')'; }
  function aleat(semente) { var s = semente >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; }; }

  /* ---------- desenho de colorir: caminhos, contorno, colinha (usado também nas miniaturas) ---------- */
  var cachePaths = {};
  function pathsDe(pag) {
    if (cachePaths[pag.id]) return cachePaths[pag.id];
    var formas = pag.formas.map(function (f) { return new Path2D(f.d); });
    var linhas = new Path2D();
    pag.formas.forEach(function (f) { linhas.addPath(new Path2D(f.d)); });
    (pag.linhas || []).forEach(function (l) { linhas.addPath(new Path2D(l)); });
    return (cachePaths[pag.id] = { formas: formas, contorno: linhas });
  }
  /* desenha a página na caixa 0..1000 do contexto atual: cores = paleta (colinha) ou null (só contorno) */
  function desenharPagina(ctx, pag, cores, comContorno) {
    var p = pathsDe(pag);
    if (cores) pag.formas.forEach(function (f, i) { ctx.fillStyle = cores[f.n - 1]; ctx.fill(p.formas[i]); });
    if (comContorno !== false) { ctx.lineWidth = CONTORNO; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#2b2b2b'; ctx.stroke(p.contorno); }
  }
  function miniaturaPagina(pag, px, cores) {
    var c = document.createElement('canvas'); c.width = c.height = px;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, px, px); x.scale(px / 1000, px / 1000);
    desenharPagina(x, pag, cores, true);
    return c;
  }
  /* onde escrever o número de cada área: o ponto mais "no meio" da parte visível dela.
     Pinta cada área com um código de cor num quadro de 500 px, acha a distância até a borda (chanfro) e pega o
     ponto mais longe da borda. r = raio livre em volta (caixa 1000). */
  var cacheRotulos = {};
  function rotulosDe(pag) {
    if (cacheRotulos[pag.id]) return cacheRotulos[pag.id];
    var N = 500, k = N / 1000, c = document.createElement('canvas'); c.width = c.height = N;
    var x = c.getContext('2d', { willReadFrequently: true }), p = pathsDe(pag);
    x.scale(k, k);
    pag.formas.forEach(function (f, i) { var v = i + 1; x.fillStyle = 'rgb(' + (v & 255) + ',' + ((v >> 8) & 255) + ',0)'; x.fill(p.formas[i]); });
    var d = x.getImageData(0, 0, N, N).data, id = new Int32Array(N * N), dist = new Float32Array(N * N), i, j;
    for (i = 0; i < N * N; i++) id[i] = d[i * 4] + (d[i * 4 + 1] << 8);
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      var q = j * N + i, borda = i === 0 || j === 0 || i === N - 1 || j === N - 1 || id[q - 1] !== id[q] || id[q + 1] !== id[q] || id[q - N] !== id[q] || id[q + N] !== id[q];
      dist[q] = borda ? 0 : 1e9;
    }
    // duas passadas de chanfro (3-4): distância aproximada até a borda mais perto
    for (j = 1; j < N - 1; j++) for (i = 1; i < N - 1; i++) { var a = j * N + i; dist[a] = Math.min(dist[a], dist[a - 1] + 3, dist[a - N] + 3, dist[a - N - 1] + 4, dist[a - N + 1] + 4); }
    for (j = N - 2; j > 0; j--) for (i = N - 2; i > 0; i--) { var b = j * N + i; dist[b] = Math.min(dist[b], dist[b + 1] + 3, dist[b + N] + 3, dist[b + N + 1] + 4, dist[b + N - 1] + 4); }
    var r = pag.formas.map(function () { return { x: -1, y: -1, r: 0 }; });
    for (i = 0; i < N * N; i++) { var v2 = id[i] - 1; if (v2 >= 0 && v2 < r.length && dist[i] / 3 > r[v2].r) { r[v2].r = dist[i] / 3; r[v2].x = (i % N + 0.5) / k; r[v2].y = (Math.floor(i / N) + 0.5) / k; } }
    r.forEach(function (o) { o.r = o.r / k; });
    return (cacheRotulos[pag.id] = r);
  }

  /* ---------- pincéis vivos (desenhados a cada quadro) ---------- */
  function caminho(ctx, pts, ini, fim) {
    ctx.beginPath(); ctx.moveTo(pts[ini], pts[ini + 1]);
    if (fim - ini < 4) { ctx.lineTo(pts[ini] + 0.1, pts[ini + 1]); return; }
    for (var i = ini + 2; i < fim; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  }
  function desenharVivo(ctx, v, t) {
    var p = v.pts, n = p.length; if (n < 2) return;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (v.p === 'arcoiris') {
      var passo = 6;      // de 3 em 3 pontos, cada pedaço com uma cor; as cores "correm" pelo traço
      for (var i = 0; i < n - 2; i += passo) {
        ctx.strokeStyle = 'hsl(' + Math.round((i * 2.2 - t * 160) % 360 + 360) % 360 + ',95%,58%)';
        ctx.lineWidth = v.tam; caminho(ctx, p, i, Math.min(n, i + passo + 2)); ctx.stroke();
      }
    } else if (v.p === 'neon') {
      var pul = 0.75 + 0.25 * Math.sin(t * 4 + v.fase * 6);
      caminho(ctx, p, 0, n);
      ctx.globalAlpha = 0.22 * pul; ctx.strokeStyle = v.cor; ctx.lineWidth = v.tam * 2.6; ctx.stroke();
      ctx.globalAlpha = 0.45 * pul; ctx.lineWidth = v.tam * 1.5; ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = clarear(v.cor, 0.7); ctx.lineWidth = Math.max(2, v.tam * 0.45); ctx.stroke();
    } else if (v.p === 'purpurina') {
      caminho(ctx, p, 0, n); ctx.strokeStyle = v.cor; ctx.lineWidth = v.tam * 0.8; ctx.stroke();
      ctx.strokeStyle = clarear(v.cor, 0.45); ctx.lineWidth = v.tam * 0.3; ctx.stroke();
      if (!v.brilhos) { var r = aleat(Math.round(v.fase * 1e6)); v.brilhos = []; for (var k = 0; k < n; k += 2) if (r() < 0.35) v.brilhos.push(k, (r() - 0.5) * v.tam, (r() - 0.5) * v.tam, r() * 6.28); }
      for (var b = 0; b < v.brilhos.length; b += 4) {
        var q = v.brilhos[b]; if (q >= n) continue;
        var tam = v.tam * 0.35 * Math.max(0, Math.sin(t * 5 + v.brilhos[b + 3]));
        if (tam < 1) continue;
        var x = p[q] + v.brilhos[b + 1], y = p[q + 1] + v.brilhos[b + 2];
        ctx.fillStyle = (b / 4) % 3 === 0 ? '#fff6c2' : '#ffffff';
        ctx.beginPath(); ctx.moveTo(x, y - tam); ctx.lineTo(x + tam * 0.25, y - tam * 0.25); ctx.lineTo(x + tam, y); ctx.lineTo(x + tam * 0.25, y + tam * 0.25); ctx.lineTo(x, y + tam); ctx.lineTo(x - tam * 0.25, y + tam * 0.25); ctx.lineTo(x - tam, y); ctx.lineTo(x - tam * 0.25, y - tam * 0.25); ctx.fill();
      }
    } else if (v.p === 'minhoca') {
      // o traço ondula como uma minhoca e ganha carinha na ponta
      var w = [], comp = 0;
      for (var m = 0; m < n; m += 2) {
        var ax = p[Math.max(0, m - 2)], ay = p[Math.max(1, m - 1)], bx = p[Math.min(n - 2, m + 2)], by = p[Math.min(n - 1, m + 3)];
        var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
        if (m) comp += Math.hypot(p[m] - p[m - 2], p[m + 1] - p[m - 1]);
        var o = Math.sin(comp * 0.035 - t * 6 + v.fase * 6) * v.tam * 0.45;
        w.push(p[m] - dy / L * o, p[m + 1] + dx / L * o);
      }
      caminho(ctx, w, 0, w.length); ctx.strokeStyle = v.cor; ctx.lineWidth = v.tam; ctx.stroke();
      ctx.strokeStyle = clarear(v.cor, 0.35); ctx.lineWidth = v.tam * 0.35; ctx.setLineDash([v.tam * 0.2, v.tam * 0.6]); ctx.stroke(); ctx.setLineDash([]);
      var hx = w[w.length - 2], hy = w[w.length - 1], rr = v.tam * 0.75;
      ctx.fillStyle = v.cor; ctx.beginPath(); ctx.arc(hx, hy, rr, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx - rr * 0.35, hy - rr * 0.2, rr * 0.3, 0, 6.3); ctx.arc(hx + rr * 0.35, hy - rr * 0.2, rr * 0.3, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(hx - rr * 0.32, hy - rr * 0.15, rr * 0.14, 0, 6.3); ctx.arc(hx + rr * 0.38, hy - rr * 0.15, rr * 0.14, 0, 6.3); ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, rr * 0.12); ctx.beginPath(); ctx.arc(hx, hy + rr * 0.1, rr * 0.4, 0.3, 2.84); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ================================================================================================= */
  function criar(tela, opcoes) {
    var op = opcoes || {};
    var ctx = tela.getContext('2d');
    var dpr = 1, larg = 1, alt = 1, vista = null, retrato = null;
    var quadros = {};                                  // k → canvas 512 × 512 (só onde já se pintou)
    function quadro_(k, criar) {
      if (quadros[k] || !criar) return quadros[k];
      var c = document.createElement('canvas'); c.width = c.height = TS; return (quadros[k] = c);
    }
    function temPintura() { for (var k in quadros) return true; return false; }
    /* desenha uma coisa (fn recebe o contexto em coordenadas do mundo) em todos os quadradinhos da caixa */
    function emQuadros(x0, y0, x1, y1, fn) {
      var a = Math.max(0, Math.floor(x0 / TS)), b = Math.min(NTX - 1, Math.floor(x1 / TS)), c = Math.max(0, Math.floor(y0 / TS)), d = Math.min(NTY - 1, Math.floor(y1 / TS));
      for (var ty = c; ty <= d; ty++) for (var tx = a; tx <= b; tx++) {
        var q = quadro_(ty * NTX + tx, true), x = q.getContext('2d');
        x.save(); x.translate(-tx * TS, -ty * TS); fn(x); x.restore();
      }
    }
    var ops = [], bytes = 0;
    var vivos = [], adesivos = [];
    var fundo = { tipo: 'papel', v: '#ffffff' }, fundoCache = null, fundoImg = null;
    var pag = null, modo = 'livre', varIdx = -1, cores = null, feitos = {}, quandoFeito = {}, selNum = 1, mascara = null;
    var hit = document.createElement('canvas').getContext('2d');
    var ferr = { pincel: 'canetinha', cor: '#ff4f6d', tam: 24, adesivo: { tipo: 'emoji', v: '🐶', mov: 'pula' }, tamAdesivo: 170 };
    var ferrDe = {};                                   // ferramenta própria de cada celular na TV
    var fontes = {}, cursores = {}, festa = null;
    var calmo = !!op.calmo, sujo = true, rodando = false, ultimoQuadro = 0;

    function avisar() { sujo = true; if (op.aoMudar) op.aoMudar(); }

    /* ---------- tamanho da tela e girar ---------- */
    function redimensionar() {
      var r = tela.getBoundingClientRect(), nl = Math.max(1, Math.round(r.width)), na = Math.max(1, Math.round(r.height));
      dpr = Math.min(raiz.devicePixelRatio || 1, 3);
      tela.width = Math.round(nl * dpr); tela.height = Math.round(na * dpr);
      if (!vista) vista = F.inicial(nl, na, pag ? PAG : null);
      else {
        var girou = retrato !== null && (nl < na) !== retrato;
        vista = girou ? F.aoGirar(vista, larg, alt, nl, na, conteudo()) : F.prender(F.aoGirar(vista, larg, alt, nl, na, null), nl, na);
      }
      larg = nl; alt = na; retrato = nl < na; sujo = true;
    }
    function conteudo() {
      var c = pag ? { x: PAG.x, y: PAG.y, w: PAG.w, h: PAG.h } : null;
      vivos.forEach(function (v) { c = F.unir(c, F.caixaDePontos(v.pts, v.tam)); });
      adesivos.forEach(function (a) { c = F.unir(c, { x: a.x - a.s / 2, y: a.y - a.s / 2, w: a.s, h: a.s }); });
      if (caixaTinta) c = F.unir(c, caixaTinta);
      return F.dentroDoMundo(c);
    }
    var caixaTinta = null;     // onde já passou pincel (o balde não conta: ele pode encher a folha toda)

    /* ---------- desfazer por quadradinhos ---------- */
    function guardarQuadros(o, x0, y0, x1, y1) {
      var a = Math.max(0, Math.floor(x0 / TS)), b = Math.min(NTX - 1, Math.floor(x1 / TS));
      var c = Math.max(0, Math.floor(y0 / TS)), d = Math.min(NTY - 1, Math.floor(y1 / TS));
      for (var ty = c; ty <= d; ty++) for (var tx = a; tx <= b; tx++) {
        var k = ty * NTX + tx;
        if (o.q[k] !== undefined) continue;
        if (!quadros[k]) o.q[k] = 0;                                // estava vazio: desfazer = jogar o quadradinho fora
        else { o.q[k] = quadros[k].getContext('2d').getImageData(0, 0, TS, TS); o.b += TS * TS * 4; bytes += TS * TS * 4; }
      }
    }
    function devolverQuadros(o) {
      Object.keys(o.q).forEach(function (k) {
        var v = o.q[k];
        if (v === 0) delete quadros[k]; else quadro_(+k, true).getContext('2d').putImageData(v, 0, 0);
      });
      bytes -= o.b || 0;
    }
    function empilhar(o) {
      ops.push(o);
      while (ops.length > MAX_OPS || (bytes > LIMITE_BYTES && ops.length > 1)) { var velho = ops.shift(); bytes -= velho.b || 0; }
      avisar();
    }
    function desfazer() {
      var o = ops.pop(); if (!o) return false;
      if (o.q) devolverQuadros(o);
      if (o.t === 'vivo') tirar(vivos, o.obj);
      if (o.t === 'adesivo') tirar(adesivos, o.obj);
      if (o.t === 'mover') { o.obj.x = o.de.x; o.obj.y = o.de.y; }
      if (o.t === 'num') { delete feitos[o.i]; delete quandoFeito[o.i]; }
      if (o.t === 'fundo') { definirFundo(o.de, true); }
      if (o.vivos) o.vivos.forEach(function (x) { vivos.splice(Math.min(x.i, vivos.length), 0, x.obj); });
      if (o.adesivos) o.adesivos.forEach(function (x) { adesivos.splice(Math.min(x.i, adesivos.length), 0, x.obj); });
      if (o.feitos) { feitos = o.feitos; quandoFeito = {}; }
      if (o.caixa !== undefined) caixaTinta = o.caixa;
      avisar(); return true;
    }
    function tirar(lista, obj) { var i = lista.indexOf(obj); if (i >= 0) lista.splice(i, 1); }

    /* ---------- pincéis "parados": gravam na pintura ---------- */
    var carimboMacio = {};
    function macio(cor) {
      if (carimboMacio[cor]) return carimboMacio[cor];
      var c = document.createElement('canvas'); c.width = c.height = 64; var x = c.getContext('2d'), rgb = hexRgb(cor).join(',');
      var g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(0.5, 'rgba(' + rgb + ',0.6)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return (carimboMacio[cor] = c);
    }
    function segmento(tr, x0, y0, x1, y1, pressao) {
      var f = tr.f, tam = f.tam * (pressao ? 0.45 + pressao * 1.1 : 1), r = tam * (f.pincel === 'spray' ? 1.1 : f.pincel === 'borracha' ? 0.8 : 0.6) + 4;
      guardarQuadros(tr.o, Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r);
      tr.caixa = F.unir(tr.caixa, { x: Math.min(x0, x1) - r, y: Math.min(y0, y1) - r, w: Math.abs(x1 - x0) + 2 * r, h: Math.abs(y1 - y0) + 2 * r });
      var d = Math.hypot(x1 - x0, y1 - y0), semente = Math.floor(Math.random() * 1e9);
      emQuadros(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, function (c) {
      // o mesmo sorteio em cada quadradinho: os pontinhos do giz e do spray batem na emenda
      var rnd = aleat(semente), passos, i, t;
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (f.pincel === 'borracha') {
        c.globalCompositeOperation = 'destination-out'; c.lineWidth = tam * 1.6; c.strokeStyle = '#000';
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + 0.01, y1); c.stroke();
      } else if (f.pincel === 'canetinha') {
        c.strokeStyle = f.cor; c.lineWidth = tam; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + 0.01, y1); c.stroke();
      } else if (f.pincel === 'lapis') {
        c.strokeStyle = f.cor; c.globalAlpha = 0.85; c.lineWidth = Math.max(2, tam * 0.35); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + 0.01, y1); c.stroke();
        c.globalAlpha = 0.35; c.lineWidth = Math.max(1, tam * 0.15); c.beginPath(); c.moveTo(x0 + tam * 0.12, y0 + tam * 0.08); c.lineTo(x1 + tam * 0.12, y1 + tam * 0.08); c.stroke();
      } else if (f.pincel === 'giz') {
        // giz de cera: muitos pontinhos com falhas, como cera no papel
        c.fillStyle = f.cor; passos = Math.max(1, Math.ceil(d / (tam * 0.18)));
        for (i = 0; i < passos; i++) {
          t = i / passos; var cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
          for (var k = 0; k < 9; k++) { var a = rnd() * 6.28, rr = Math.sqrt(rnd()) * tam / 2, s = 1 + rnd() * tam * 0.12; c.globalAlpha = 0.45 + rnd() * 0.5; c.fillRect(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, s, s); }
        }
      } else if (f.pincel === 'pincel') {
        var m = macio(f.cor); c.globalAlpha = 0.22; passos = Math.max(1, Math.ceil(d / (tam * 0.12)));
        for (i = 0; i < passos; i++) { t = i / passos; c.drawImage(m, x0 + (x1 - x0) * t - tam, y0 + (y1 - y0) * t - tam, tam * 2, tam * 2); }
      } else if (f.pincel === 'spray') {
        c.fillStyle = f.cor; var n = Math.round(10 + tam * 0.6);
        for (i = 0; i < n; i++) { var a2 = rnd() * 6.28, r2 = Math.sqrt(rnd()) * tam; c.globalAlpha = 0.5 + rnd() * 0.5; c.fillRect(x1 + Math.cos(a2) * r2, y1 + Math.sin(a2) * r2, 2, 2); }
      }
      });
      sujo = true;
    }
    /* a borracha também tira pincéis vivos e adesivos que ela tocar */
    function borrachaObjetos(tr, x, y) {
      var r = tr.f.tam * 0.8 + 6;
      for (var i = vivos.length - 1; i >= 0; i--) {
        var p = vivos[i].pts, toca = false;
        for (var k = 0; k < p.length; k += 2) if (Math.hypot(p[k] - x, p[k + 1] - y) < r + vivos[i].tam / 2) { toca = true; break; }
        if (toca) { tr.o.vivos = tr.o.vivos || []; tr.o.vivos.unshift({ i: i, obj: vivos[i] }); vivos.splice(i, 1); }
      }
      for (var j = adesivos.length - 1; j >= 0; j--) {
        var a = adesivos[j];
        if (Math.hypot(a.x - x, a.y - y) < r + a.s * 0.35) { tr.o.adesivos = tr.o.adesivos || []; tr.o.adesivos.unshift({ i: j, obj: a }); adesivos.splice(j, 1); }
      }
    }

    /* ---------- balde de tinta (respeita o contorno do desenho) ----------
       Como a folha não tem fim, o balde enche dentro de uma "região": o desenho de colorir inteiro (quando há um)
       ou o pedaço da folha que está na tela. A máscara do contorno tem o tamanho do desenho de colorir. */
    function mascaraContorno() {
      if (!pag) return null;
      if (mascara && mascara.id === pag.id) return mascara.m;
      var c = document.createElement('canvas'); c.width = PAG.w; c.height = PAG.h;
      var x = c.getContext('2d', { willReadFrequently: true });
      x.scale(ESC, ESC);
      x.lineWidth = CONTORNO * 0.8; x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = '#000'; x.stroke(pathsDe(pag).contorno);
      var d = x.getImageData(0, 0, PAG.w, PAG.h).data, m = new Uint8Array(PAG.w * PAG.h);
      for (var i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 90 ? 1 : 0;
      mascara = { id: pag.id, m: m };
      return m;
    }
    function regiaoDoBalde(x, y) {
      if (pag) return (x >= PAG.x && y >= PAG.y && x < PAG.x + PAG.w && y < PAG.y + PAG.h) ? { x: PAG.x, y: PAG.y, w: PAG.w, h: PAG.h } : null;
      var a = F.aMundo(vista, 0, 0), b = F.aMundo(vista, larg, alt), MAX = 4096;
      var x0 = Math.max(0, Math.floor(a.x)), y0 = Math.max(0, Math.floor(a.y)), x1 = Math.min(W, Math.ceil(b.x)), y1 = Math.min(H, Math.ceil(b.y));
      if (x1 - x0 > MAX) { x0 = Math.max(0, Math.round(x - MAX / 2)); x1 = Math.min(W, x0 + MAX); }
      if (y1 - y0 > MAX) { y0 = Math.max(0, Math.round(y - MAX / 2)); y1 = Math.min(H, y0 + MAX); }
      return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
    }
    function balde(wx, wy, cor) {
      var R = regiaoDoBalde(wx, wy); if (!R) return;
      var RW = R.w, RH = R.h, x = Math.round(wx - R.x), y = Math.round(wy - R.y);
      if (x < 0 || y < 0 || x >= RW || y >= RH) return;
      var m = mascaraContorno();
      if (m && m[y * RW + x]) {                                    // tocou bem na linha: procura um vizinho fora dela
        var achou = false;
        for (var r = 1; r <= 8 && !achou; r++) for (var a = 0; a < 8 && !achou; a++) { var nx = Math.round(x + Math.cos(a * 0.785) * r), ny = Math.round(y + Math.sin(a * 0.785) * r); if (nx >= 0 && ny >= 0 && nx < RW && ny < RH && !m[ny * RW + nx]) { x = nx; y = ny; achou = true; } }
        if (!achou) return;
      }
      // junta os quadradinhos da região num canvas só, para ler e escrever de uma vez
      var tmp = document.createElement('canvas'); tmp.width = RW; tmp.height = RH;
      var tc = tmp.getContext('2d', { willReadFrequently: true });
      Object.keys(quadros).forEach(function (k) { var n = +k, qx = (n % NTX) * TS, qy = Math.floor(n / NTX) * TS; if (qx < R.x + RW && qx + TS > R.x && qy < R.y + RH && qy + TS > R.y) tc.drawImage(quadros[k], qx - R.x, qy - R.y); });
      var img = tc.getImageData(0, 0, RW, RH), d = img.data, alvo = (y * RW + x) * 4;
      var r0 = d[alvo], g0 = d[alvo + 1], b0 = d[alvo + 2], a0 = d[alvo + 3], rgb = hexRgb(cor);
      if (a0 > 250 && Math.abs(r0 - rgb[0]) + Math.abs(g0 - rgb[1]) + Math.abs(b0 - rgb[2]) < 6) return;   // já é dessa cor
      var cheio = new Uint8Array(RW * RH), pilha = [x, y], x0 = x, x1 = x, y0 = y, y1 = y;
      function igual(p) {
        if (cheio[p] || (m && m[p])) return false;
        var i = p * 4, al = d[i + 3];
        if (a0 < 40) return al < 40;                               // papel vazio enche o papel vazio
        return al > 40 && Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) + Math.abs(al - a0) < 80;
      }
      while (pilha.length) {
        var py = pilha.pop(), px = pilha.pop(), l = px, rr = px;
        while (l > 0 && igual(py * RW + l - 1)) l--;
        while (rr < RW - 1 && igual(py * RW + rr + 1)) rr++;
        var acima = false, abaixo = false;
        for (var i = l; i <= rr; i++) {
          cheio[py * RW + i] = 1;
          if (py > 0) { var u = igual((py - 1) * RW + i); if (u && !acima) { pilha.push(i, py - 1); } acima = u; }
          if (py < RH - 1) { var b = igual((py + 1) * RW + i); if (b && !abaixo) { pilha.push(i, py + 1); } abaixo = b; }
        }
        if (l < x0) x0 = l; if (rr > x1) x1 = rr; if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
      // papel vazio que vaza até a borda (não é uma forma fechada) na folha livre: pinta o FUNDO todo, não um retângulo
      if (!pag && a0 < 40 && (x0 === 0 || y0 === 0 || x1 === RW - 1 || y1 === RH - 1)) { definirFundo({ tipo: 'cor', v: cor }); return; }
      // engorda 2 px para cobrir a franjinha clara junto do contorno
      x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(RW - 1, x1 + 2); y1 = Math.min(RH - 1, y1 + 2);
      for (var yy = y0; yy <= y1; yy++) for (var xx = x0; xx <= x1; xx++) {
        var p = yy * RW + xx;
        if (!cheio[p]) {
          // fora da área: só engorda por baixo do contorno ou na beirada clarinha de um traço, a até 2 px da área
          if (!((m && m[p]) || d[p * 4 + 3] < 200)) continue;
          var viz = (xx > x0 && cheio[p - 1]) || (xx < x1 && cheio[p + 1]) || (yy > y0 && cheio[p - RW]) || (yy < y1 && cheio[p + RW]) || (xx > x0 + 1 && cheio[p - 2]) || (xx < x1 - 1 && cheio[p + 2]) || (yy > y0 + 1 && cheio[p - 2 * RW]) || (yy < y1 - 1 && cheio[p + 2 * RW]);
          if (!viz) continue;
        }
        var q = p * 4; d[q] = rgb[0]; d[q + 1] = rgb[1]; d[q + 2] = rgb[2]; d[q + 3] = 255;
      }
      tc.putImageData(img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
      var bx = R.x + x0, by = R.y + y0, bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      var o = { t: 'balde', q: {}, b: 0 }; guardarQuadros(o, bx, by, bx + bw, by + bh);
      emQuadros(bx, by, bx + bw, by + bh, function (c) { c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.clearRect(bx, by, bw, bh); c.drawImage(tmp, R.x, R.y); });
      sujo = true; empilhar(o);
    }

    /* ---------- pintar por números ---------- */
    function areaEm(x, y) {
      if (!pag) return -1;
      var px = (x - PAG.x) / ESC, py = (y - PAG.y) / ESC, p = pathsDe(pag).formas;
      if (px < 0 || py < 0 || px > 1000 || py > 1000) return -1;
      for (var i = p.length - 1; i >= 0; i--) if (hit.isPointInPath(p[i], px, py)) return i;
      return -1;
    }
    function tocarNumero(x, y) {
      var i = areaEm(x, y); if (i < 0) return;
      if (feitos[i]) return;
      var n = pag.formas[i].n;
      if (n !== selNum) { if (op.aoNumero) op.aoNumero(false, n); return; }
      feitos[i] = 1; quandoFeito[i] = { t: agora(), x: (x - PAG.x) / ESC, y: (y - PAG.y) / ESC };
      empilhar({ t: 'num', i: i });
      var prog = progresso(), terminouCor = prog[n - 1].feitos === prog[n - 1].total;
      if (op.aoNumero) op.aoNumero(true, n, terminouCor);
      if (completo()) { festejar(); if (op.aoTerminar) op.aoTerminar(); }
    }
    function progresso() {
      if (!pag) return [];
      var r = cores.map(function () { return { total: 0, feitos: 0 }; });
      pag.formas.forEach(function (f, i) { r[f.n - 1].total++; if (feitos[i]) r[f.n - 1].feitos++; });
      return r;
    }
    function completo() { return !!pag && pag.formas.every(function (f, i) { return feitos[i]; }); }
    /* 🪄 dica: chega perto de uma área que falta pintar com o número escolhido */
    function dica() {
      if (!pag) return false;
      var rot = rotulosDe(pag), melhor = -1;
      pag.formas.forEach(function (f, i) { if (!feitos[i] && f.n === selNum && (melhor < 0 || rot[i].r < rot[melhor].r)) melhor = i; });
      if (melhor < 0) return false;
      var R = rot[melhor], cx = PAG.x + R.x * ESC, cy = PAG.y + R.y * ESC, s = Math.min(F.limites(larg, alt).max, Math.max(vista.s, 26 / Math.max(4, R.r * ESC)));
      animarVista({ s: s, ox: larg / 2 - cx * s, oy: alt / 2 - cy * s });
      pisca = { i: melhor, t: agora() };
      return true;
    }
    var pisca = null, animVista = null;
    function animarVista(alvo) { animVista = { de: vista, para: F.prender(alvo, larg, alt), t: agora() }; sujo = true; }

    /* ---------- adesivos ---------- */
    function adesivoEm(x, y) {
      for (var i = adesivos.length - 1; i >= 0; i--) { var a = adesivos[i]; if (Math.abs(a.x - x) < a.s * 0.5 && Math.abs(a.y - y) < a.s * 0.5) return a; }
      return null;
    }

    /* ---------- fontes: dedo, mouse, mão, celular ---------- */
    function ferramentaDe(fonte) { return ferrDe[fonte] || ferr; }
    function comecar(fonte, x, y, pressao) {
      var f = ferramentaDe(fonte), tr = { f: { pincel: f.pincel, cor: f.cor, tam: f.tam }, x: x, y: y, ini: agora(), n: 0 };
      if (modo === 'numeros') { tr.tipo = 'numero'; return tr; }
      if (f.pincel === 'balde') { balde(x, y, f.cor); if (op.aoBalde) op.aoBalde(); tr.tipo = 'feito'; return tr; }
      if (f.pincel === 'adesivo') {
        var a = { tipo: f.adesivo.tipo, v: f.adesivo.v, mov: f.adesivo.mov, x: x, y: y, s: f.tamAdesivo || 170, fase: Math.random() };
        adesivos.push(a); empilhar({ t: 'adesivo', obj: a }); if (op.aoAdesivo) op.aoAdesivo(); tr.tipo = 'feito'; return tr;
      }
      if (f.pincel === 'mover') {
        var alvo = adesivoEm(x, y);
        if (alvo) { tr.tipo = 'mover'; tr.obj = alvo; tr.de = { x: alvo.x, y: alvo.y }; tr.dx = alvo.x - x; tr.dy = alvo.y - y; adesivos.splice(adesivos.indexOf(alvo), 1); adesivos.push(alvo); }
        else tr.tipo = 'nada';
        return tr;
      }
      if (VIVO[f.pincel]) { tr.tipo = 'vivo'; tr.obj = { p: f.pincel, cor: f.cor, tam: f.tam, pts: [x, y], fase: Math.random() }; vivos.push(tr.obj); sujo = true; return tr; }
      tr.tipo = 'parado'; tr.o = { t: 'traco', q: {}, b: 0 }; tr.caixa = null;
      if (f.pincel === 'borracha') borrachaObjetos(tr, x, y);
      segmento(tr, x, y, x, y, pressao);
      return tr;
    }
    function continuar(tr, x, y, pressao) {
      if (Math.hypot(x - tr.x, y - tr.y) < 1.5) return;
      tr.n++;
      if (tr.tipo === 'parado') { if (tr.f.pincel === 'borracha') borrachaObjetos(tr, x, y); segmento(tr, tr.x, tr.y, x, y, pressao); }
      else if (tr.tipo === 'vivo') { tr.obj.pts.push(x, y); sujo = true; }
      else if (tr.tipo === 'mover') { tr.obj.x = x + tr.dx; tr.obj.y = y + tr.dy; sujo = true; }
      tr.x = x; tr.y = y;
    }
    function terminar(tr) {
      if (tr.tipo === 'parado') { tr.o.caixa = caixaTinta; if (tr.f.pincel !== 'borracha') caixaTinta = F.unir(caixaTinta, tr.caixa); empilhar(tr.o); }
      else if (tr.tipo === 'vivo') empilhar({ t: 'vivo', obj: tr.obj });
      else if (tr.tipo === 'mover' && (tr.obj.x !== tr.de.x || tr.obj.y !== tr.de.y)) empilhar({ t: 'mover', obj: tr.obj, de: tr.de });
      else if (tr.tipo === 'numero') tocarNumero(tr.x, tr.y);
    }
    function cancelar(tr) {
      if (tr.tipo === 'parado') { devolverQuadros(tr.o); if (tr.o.vivos) tr.o.vivos.forEach(function (x) { vivos.splice(Math.min(x.i, vivos.length), 0, x.obj); }); if (tr.o.adesivos) tr.o.adesivos.forEach(function (x) { adesivos.splice(Math.min(x.i, adesivos.length), 0, x.obj); }); }
      else if (tr.tipo === 'vivo') tirar(vivos, tr.obj);
      else if (tr.tipo === 'mover') { tr.obj.x = tr.de.x; tr.obj.y = tr.de.y; }
      sujo = true;
    }
    /* x, y em pixels da tela (dentro do canvas); apertado = dedo encostado / mão fechada / botão segurado */
    function apontar(fonte, xt, yt, apertado, pressao) {
      var m = F.aMundo(vista, xt, yt), s = fontes[fonte];
      if (apertado && !s) fontes[fonte] = comecar(fonte, m.x, m.y, pressao);
      else if (apertado && s) continuar(s, m.x, m.y, pressao);
      else if (!apertado && s) { continuar(s, m.x, m.y, pressao); terminar(s); delete fontes[fonte]; }
    }
    function cancelarFonte(fonte) { var s = fontes[fonte]; if (s) { cancelar(s); delete fontes[fonte]; } }

    /* ---------- dedos e mouse no próprio canvas ---------- */
    var dedos = {}, pincaIni = null, esperarSoltarTudo = false, arrasto = null;
    function pos(e) { var r = tela.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function qtdDedos() { return Object.keys(dedos).length; }
    tela.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      try { tela.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      dedos[e.pointerId] = pos(e);
      if (op.aoTocar) op.aoTocar();
      if (qtdDedos() === 1 && !esperarSoltarTudo) {
        var p = dedos[e.pointerId];
        if (modo === 'numeros' || (ferr.pincel === 'mover' && !adesivoEm(F.aMundo(vista, p.x, p.y).x, F.aMundo(vista, p.x, p.y).y))) arrasto = { id: e.pointerId, ini: p, v0: vista, moveu: false };
        else apontar('p' + e.pointerId, p.x, p.y, true, e.pointerType === 'pen' ? e.pressure : 0);
      } else if (qtdDedos() === 2) {
        // dois dedos: zoom/arrastar. O traço do primeiro dedo, se era curtinho, é desfeito.
        Object.keys(fontes).forEach(function (k) { if (k.charAt(0) === 'p') { var tr = fontes[k]; if (agora() - tr.ini < 0.35 || tr.n < 8) cancelarFonte(k); else { terminar(tr); delete fontes[k]; } } });
        arrasto = null;
        var ids = Object.keys(dedos); pincaIni = { a: ids[0], b: ids[1], pa: dedos[ids[0]], pb: dedos[ids[1]], v0: vista };
        esperarSoltarTudo = true;
      }
    });
    tela.addEventListener('pointermove', function (e) {
      if (!dedos[e.pointerId]) return;
      var lista = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!lista.length) lista = [e];
      if (pincaIni) {
        dedos[e.pointerId] = pos(e);
        if (dedos[pincaIni.a] && dedos[pincaIni.b]) { vista = F.pinca(pincaIni.v0, pincaIni.pa, pincaIni.pb, dedos[pincaIni.a], dedos[pincaIni.b], larg, alt); animVista = null; sujo = true; }
        return;
      }
      if (arrasto && arrasto.id === e.pointerId) {
        var p = pos(e), dx = p.x - arrasto.ini.x, dy = p.y - arrasto.ini.y;
        if (Math.hypot(dx, dy) > 8) arrasto.moveu = true;
        if (arrasto.moveu) { vista = F.arrastar(arrasto.v0, dx, dy, larg, alt); animVista = null; sujo = true; }
        dedos[e.pointerId] = p; return;
      }
      lista.forEach(function (ev) { var q = pos(ev); apontar('p' + e.pointerId, q.x, q.y, true, e.pointerType === 'pen' ? ev.pressure : 0); });
      dedos[e.pointerId] = pos(e);
    });
    function soltar(e) {
      if (!dedos[e.pointerId]) return;
      var p = pos(e);
      if (arrasto && arrasto.id === e.pointerId) {
        if (!arrasto.moveu && modo === 'numeros') { var m = F.aMundo(vista, p.x, p.y); tocarNumero(m.x, m.y); }
        arrasto = null;
      } else if (fontes['p' + e.pointerId]) {
        if (e.type === 'pointercancel') cancelarFonte('p' + e.pointerId); else apontar('p' + e.pointerId, p.x, p.y, false);
      }
      delete dedos[e.pointerId];
      if (pincaIni && (e.pointerId + '' === pincaIni.a || e.pointerId + '' === pincaIni.b)) pincaIni = null;
      if (!qtdDedos()) esperarSoltarTudo = false;
    }
    tela.addEventListener('pointerup', soltar); tela.addEventListener('pointercancel', soltar);
    tela.addEventListener('wheel', function (e) { e.preventDefault(); var p = pos(e); vista = F.zoom(vista, e.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y, larg, alt); animVista = null; sujo = true; }, { passive: false });

    /* ---------- fundo ---------- */
    function definirFundo(f, semDesfazer) {
      var de = fundo; fundo = f || { tipo: 'papel', v: '#ffffff' }; fundoCache = null; fundoImg = null;
      if (fundo.tipo === 'foto' && fundo.v) { var img = new Image(); img.onload = function () { fundoImg = img; sujo = true; }; img.src = fundo.v; }
      if (!semDesfazer) empilhar({ t: 'fundo', de: de });
      sujo = true;
    }
    function cacheParado() {
      if (fundoCache && fundoCache.id === fundo.v) return fundoCache.c;
      var c = document.createElement('canvas'); c.width = c.height = 1024; var x = c.getContext('2d'); x.scale(0.5, 0.5);
      try { raiz.DesenhoFundos.parado(x, fundo.v, 2048, 2048); } catch (e) { x.fillStyle = '#fff'; x.fillRect(0, 0, 2048, 2048); }
      fundoCache = { id: fundo.v, c: c }; return c;
    }
    function fundoVivo() { if (fundo.tipo !== 'paisagem' || !raiz.DesenhoFundos) return false; var f = raiz.DesenhoFundos.LISTA.filter(function (x) { return x.id === fundo.v; })[0]; return !!(f && f.vivo); }
    /* a paisagem é feita em 2048 × 2048 no meio do mundo; para a folha sem fim, ela se repete espelhada para os
       lados (a emenda some) e a primeira/última linha se esticam para cima (céu) e para baixo (chão). */
    function desenharFundo(c, t, area) {
      var D = DESENHO;
      if (fundo.tipo === 'paisagem' && raiz.DesenhoFundos) {
        var img = cacheParado(), k0 = Math.floor((area.x - D.x) / D.w), k1 = Math.floor((area.x + area.w - D.x) / D.w);
        for (var k = Math.max(k0, -4); k <= Math.min(k1, 4); k++) {
          var x = D.x + k * D.w;
          c.save();
          if (k % 2) { c.translate(x + D.w, 0); c.scale(-1, 1); x = 0; }
          c.drawImage(img, x, D.y, D.w, D.h);
          if (area.y < D.y) c.drawImage(img, 0, 0, img.width, 1, x, area.y, D.w, D.y - area.y + 1);
          if (area.y + area.h > D.y + D.h) c.drawImage(img, 0, img.height - 1, img.width, 1, x, D.y + D.h - 1, D.w, area.y + area.h - D.y - D.h + 1);
          c.restore();
        }
        if (!calmo && fundoVivo()) { c.save(); c.translate(D.x, D.y); try { raiz.DesenhoFundos.vivo(c, fundo.v, D.w, D.h, t); } catch (e) { /* segue sem a parte viva */ } c.restore(); }
      } else if (fundo.tipo === 'foto' && fundoImg) {
        c.fillStyle = '#fff'; c.fillRect(area.x, area.y, area.w, area.h);
        var q = Math.max(D.w / fundoImg.width, D.h / fundoImg.height); c.drawImage(fundoImg, D.x + (D.w - fundoImg.width * q) / 2, D.y + (D.h - fundoImg.height * q) / 2, fundoImg.width * q, fundoImg.height * q);
      } else { c.fillStyle = fundo.tipo === 'cor' ? fundo.v : '#ffffff'; c.fillRect(area.x, area.y, area.w, area.h); }
    }

    /* ---------- desenhar a cena ---------- */
    function cena(c, t, paraFoto, area) {
      desenharFundo(c, t, area);
      var p = pag ? pathsDe(pag) : null;
      if (pag && modo === 'numeros') {
        c.save(); c.translate(PAG.x, PAG.y); c.scale(ESC, ESC);
        pag.formas.forEach(function (f, i) {
          if (feitos[i]) {
            c.fillStyle = cores[f.n - 1];
            var qf = quandoFeito[i], dur = 0.45;
            if (qf && !calmo && t - qf.t < dur) {
              c.fillStyle = '#ffffff'; c.fill(p.formas[i]);
              c.save(); c.clip(p.formas[i]); c.fillStyle = cores[f.n - 1]; c.beginPath(); c.arc(qf.x, qf.y, 20 + 900 * (t - qf.t) / dur, 0, 6.3); c.fill(); c.restore();
            } else c.fill(p.formas[i]);
          } else {
            c.fillStyle = (!paraFoto && f.n === selNum) ? '#cfd6e4' : '#ffffff';
            if (pisca && pisca.i === i && t - pisca.t < 1.6 && Math.floor((t - pisca.t) * 5) % 2 === 0) c.fillStyle = '#ffe066';
            c.fill(p.formas[i]);
          }
        });
        c.restore();
      }
      Object.keys(quadros).forEach(function (k) { var n = +k; c.drawImage(quadros[k], (n % NTX) * TS, Math.floor(n / NTX) * TS); });
      var tv = calmo ? 0 : t;
      vivos.forEach(function (v) { c.save(); desenharVivo(c, v, tv); c.restore(); });
      if (p) { c.save(); c.translate(PAG.x, PAG.y); c.scale(ESC, ESC); c.lineWidth = CONTORNO; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#2b2b2b'; c.stroke(p.contorno); c.restore(); }
      if (raiz.DesenhoAdesivos) adesivos.forEach(function (a) { try { raiz.DesenhoAdesivos.desenhar(c, calmo ? { tipo: a.tipo, v: a.v, x: a.x, y: a.y, s: a.s, mov: 'parado', fase: a.fase } : a, tv); } catch (e) { /* adesivo desconhecido */ } });
    }
    function numerosNaTela(c) {
      if (!pag || modo !== 'numeros') return;
      var rot = rotulosDe(pag), k = vista.s * ESC, mostrou = 0;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      pag.formas.forEach(function (f, i) {
        if (feitos[i]) return;
        var R = rot[i]; if (R.r <= 0) return;
        var px = Math.min(R.r * 1.15, 34) * k;                 // tamanho do número na tela
        if (px < 9) return;
        var x = vista.ox + (PAG.x + R.x * ESC) * vista.s, y = vista.oy + (PAG.y + R.y * ESC) * vista.s;
        if (x < -20 || y < -20 || x > larg + 20 || y > alt + 20) return;
        c.font = '600 ' + Math.round(px) + 'px Fredoka, system-ui, sans-serif';
        c.fillStyle = f.n === selNum ? '#1d2b53' : '#8a93a6';
        c.fillText(String(f.n), x, y); mostrou++;
      });
      perto = mostrou;
    }
    var perto = 0;
    function cursoresNaTela(c, t) {
      Object.keys(cursores).forEach(function (k) {
        var u = cursores[k]; if (!u) return;
        var r = u.estado === 'fechada' || u.apertado ? 12 : 20;
        c.save();
        c.lineWidth = 4; c.strokeStyle = '#fff'; c.beginPath(); c.arc(u.x, u.y, r + 3, 0, 6.3); c.stroke();
        c.lineWidth = 3; c.strokeStyle = u.cor || '#3ee8ff'; c.beginPath(); c.arc(u.x, u.y, r, 0, 6.3); c.stroke();
        if (u.estado === 'fechada' || u.apertado) { c.fillStyle = u.cor || '#ff4fa3'; c.beginPath(); c.arc(u.x, u.y, 6, 0, 6.3); c.fill(); }
        if (u.prog > 0) { c.lineWidth = 6; c.strokeStyle = '#ffd166'; c.beginPath(); c.arc(u.x, u.y, r + 9, -1.57, -1.57 + 6.283 * u.prog); c.stroke(); }
        if (u.nome) { c.font = '600 15px Fredoka, system-ui, sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(u.nome, u.x, u.y - r - 12); c.fillStyle = '#fff'; c.fillText(u.nome, u.x, u.y - r - 12); }
        c.restore();
      });
    }

    /* ---------- festa (fogos de artifício ao terminar) ---------- */
    function festejar() {
      if (calmo) return;
      var r = aleat(Math.floor(Math.random() * 1e6)), estouros = [];
      for (var i = 0; i < 7; i++) estouros.push({ x: 0.15 + r() * 0.7, y: 0.15 + r() * 0.45, t: i * 0.45 + r() * 0.2, h: Math.floor(r() * 360), n: 26 + Math.floor(r() * 14) });
      festa = { t: agora(), estouros: estouros }; sujo = true;
    }
    function festaNaTela(c, t) {
      if (!festa) return;
      var dt = t - festa.t; if (dt > 4.5) { festa = null; return; }
      festa.estouros.forEach(function (e) {
        var u = dt - e.t; if (u < 0 || u > 1.4) return;
        var cx = e.x * larg, cy = e.y * alt, R = Math.min(larg, alt) * 0.28 * Math.sqrt(u / 1.4), al = 1 - u / 1.4;
        for (var k = 0; k < e.n; k++) {
          var a = k / e.n * 6.283, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R + u * u * 60;
          c.fillStyle = 'hsla(' + (e.h + k * 7) % 360 + ',100%,62%,' + al.toFixed(2) + ')';
          c.beginPath(); c.arc(x, y, 4 + 3 * al, 0, 6.3); c.fill();
        }
      });
    }

    function precisaAnimar(t) {
      return vivos.length > 0 || adesivos.length > 0 || fundoVivo() || festa || animVista || (pisca && t - pisca.t < 1.7) || Object.keys(quandoFeito).some(function (k) { return t - quandoFeito[k].t < 0.5; });
    }
    function quadro() {
      if (!rodando) return;
      raiz.requestAnimationFrame(quadro);
      var t = agora();
      if (animVista) {
        var u = Math.min(1, (t - animVista.t) / 0.45), e = 1 - Math.pow(1 - u, 3), a = animVista.de, b = animVista.para;
        vista = { s: a.s + (b.s - a.s) * e, ox: a.ox + (b.ox - a.ox) * e, oy: a.oy + (b.oy - a.oy) * e };
        if (u >= 1) animVista = null;
      }
      var anima = !calmo && precisaAnimar(t);
      if (!sujo && !anima) return;
      if (!sujo && t - ultimoQuadro < 0.032) return;          // só animação: ~30 quadros por segundo poupa bateria
      ultimoQuadro = t; sujo = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#d9d4ef'; ctx.fillRect(0, 0, tela.width, tela.height);   // "mesa" em volta do mundo
      ctx.setTransform(dpr * vista.s, 0, 0, dpr * vista.s, dpr * vista.ox, dpr * vista.oy);
      var a0 = F.aMundo(vista, 0, 0), a1 = F.aMundo(vista, larg, alt);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); cena(ctx, t, false, { x: a0.x, y: a0.y, w: a1.x - a0.x, h: a1.y - a0.y }); ctx.restore();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      numerosNaTela(ctx); festaNaTela(ctx, t); cursoresNaTela(ctx, t);
    }
    function iniciar() { if (!rodando) { rodando = true; raiz.requestAnimationFrame(quadro); } }
    function parar() { rodando = false; }

    /* ---------- abrir desenho, modos, cores ---------- */
    function limparTudo() {
      quadros = {}; ops = []; bytes = 0; vivos = []; adesivos = []; feitos = {}; quandoFeito = {}; caixaTinta = null; fontes = {};
    }
    function abrirPagina(p, m, vi) {
      limparTudo(); pag = p; modo = p ? (m === 'numeros' ? 'numeros' : 'colorir') : 'livre'; varIdx = vi == null ? -1 : vi;
      cores = p ? (varIdx >= 0 && p.variacoes && p.variacoes[varIdx] ? p.variacoes[varIdx].cores : p.cores) : null;
      selNum = 1; if (p && modo === 'numeros') { fundo = { tipo: 'papel', v: '#ffffff' }; rotulosDe(p); }
      vista = null; redimensionar(); avisar();
    }
    function livre() { abrirPagina(null, 'livre'); fundo = { tipo: 'papel', v: '#ffffff' }; fundoCache = null; }
    function trocarVariacao(vi) {
      if (!pag) return;
      varIdx = vi; cores = vi >= 0 && pag.variacoes[vi] ? pag.variacoes[vi].cores : pag.cores; avisar();
    }
    function limpar() {
      var o = { t: 'limpar', q: {}, b: 0, vivos: vivos.map(function (v, i) { return { i: i, obj: v }; }), adesivos: adesivos.map(function (a, i) { return { i: i, obj: a }; }), feitos: feitos, caixa: caixaTinta };
      guardarQuadros(o, 0, 0, W - 1, H - 1); quadros = {};
      vivos = []; adesivos = []; feitos = {}; quandoFeito = {}; caixaTinta = null;
      empilhar(o);
    }

    /* ---------- foto (PNG) e miniatura ---------- */
    function areaFoto() {
      if (pag) return { x: PAG.x - 20, y: PAG.y - 20, w: PAG.w + 40, h: PAG.h + 40 };
      var c = conteudo();
      if (!c || c.w < 80 || c.h < 80) { var a = F.aMundo(vista, 0, 0), b = F.aMundo(vista, larg, alt); c = F.dentroDoMundo({ x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }); }
      else { var m = Math.max(c.w, c.h) * 0.06; c = F.dentroDoMundo({ x: c.x - m, y: c.y - m, w: c.w + 2 * m, h: c.h + 2 * m }); }
      return c || { x: 0, y: 0, w: W, h: H };
    }
    function renderizar(maxPx, area) {
      var a = area || areaFoto(), k = Math.min(maxPx / a.w, maxPx / a.h, 2);
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(a.w * k)); c.height = Math.max(1, Math.round(a.h * k));
      var x = c.getContext('2d'); x.setTransform(k, 0, 0, k, -a.x * k, -a.y * k); cena(x, agora(), true, a);
      return c;
    }
    function foto(maxPx) { var c = renderizar(maxPx || 2048); return new Promise(function (ok) { c.toBlob(function (b) { ok(b); }, 'image/png'); }); }
    function miniatura(px) { return renderizar(px || 320).toDataURL('image/jpeg', 0.82); }

    /* ---------- guardar e abrir de novo (Meus desenhos) ---------- */
    function estado() {
      return { v: 1, modo: modo, pagina: pag ? pag.id : null, varIdx: varIdx, fundo: fundo, feitos: Object.keys(feitos).map(Number), selNum: selNum,
        vivos: vivos.map(function (v) { return { p: v.p, cor: v.cor, tam: v.tam, fase: v.fase, pts: v.pts.map(function (n) { return Math.round(n * 10) / 10; }) }; }),
        adesivos: adesivos.map(function (a) { return { tipo: a.tipo, v: a.v, mov: a.mov, x: Math.round(a.x), y: Math.round(a.y), s: Math.round(a.s), fase: a.fase }; }),
        caixa: caixaTinta, temPintura: temPintura() };
    }
    /* a pintura vai para o banco como uma lista de quadradinhos em PNG (só os que têm tinta) */
    function pinturaBlob() {
      return Promise.all(Object.keys(quadros).map(function (k) { return new Promise(function (ok) { quadros[k].toBlob(function (b) { ok(b ? { k: +k, b: b } : null); }, 'image/png'); }); }))
        .then(function (l) { l = l.filter(Boolean); return l.length ? l : null; });
    }
    function carregar(e, blob, paginaObj) {
      abrirPagina(paginaObj || null, e.modo, e.varIdx);
      if (!paginaObj) modo = 'livre';
      definirFundo(e.fundo, true);
      (e.feitos || []).forEach(function (i) { feitos[i] = 1; });
      selNum = e.selNum || 1;
      vivos = (e.vivos || []).filter(function (v) { return VIVO[v.p] && Array.isArray(v.pts); });
      adesivos = (e.adesivos || []).filter(function (a) { return a && typeof a.x === 'number'; });
      caixaTinta = e.caixa || null;
      vista = null; redimensionar();
      if (Array.isArray(blob) && raiz.createImageBitmap) return Promise.all(blob.map(function (q) { return createImageBitmap(q.b).then(function (bm) { quadro_(q.k, true).getContext('2d').drawImage(bm, 0, 0); }).catch(function () { /* quadradinho estragado: segue */ }); })).then(function () { sujo = true; });
      return Promise.resolve();
    }

    redimensionar(); iniciar();
    return {
      redimensionar: redimensionar, iniciar: iniciar, parar: parar,
      apontar: apontar, cancelarFonte: cancelarFonte,
      cursor: function (fonte, u) { if (u) cursores[fonte] = u; else delete cursores[fonte]; sujo = true; },
      ferramenta: function (f) { if (f) { Object.keys(f).forEach(function (k) { ferr[k] = f[k]; }); } return ferr; },
      ferramentaDe: function (fonte, f) { if (f === null) { delete ferrDe[fonte]; return null; } ferrDe[fonte] = ferrDe[fonte] || JSON.parse(JSON.stringify(ferr)); if (f) Object.keys(f).forEach(function (k) { ferrDe[fonte][k] = f[k]; }); return ferrDe[fonte]; },
      desfazer: desfazer, podeDesfazer: function () { return ops.length > 0; },
      limpar: limpar, vazio: function () { return !ops.length && !vivos.length && !adesivos.length && !temPintura() && !Object.keys(feitos).length; },
      zoom: function (fator) { animarVista(F.zoom(vista, fator, larg / 2, alt / 2, larg, alt)); },
      ajustar: function () { animarVista(F.ajustar(larg, alt, conteudo())); },
      abrirPagina: abrirPagina, livre: livre, variacao: trocarVariacao, cores: function () { return cores; },
      modo: function () { return modo; }, pagina: function () { return pag; }, varIdx: function () { return varIdx; },
      numero: function (n) { if (n) { selNum = n; sujo = true; } return selNum; }, progresso: progresso, completo: completo, dica: dica,
      numerosVisiveis: function () { return perto; },
      fundo: function (f) { if (f) definirFundo(f); return fundo; },
      estado: estado, pinturaBlob: pinturaBlob, carregar: carregar, foto: foto, miniatura: miniatura, festejar: festejar,
      tamanhoTela: function () { return { larg: larg, alt: alt }; }, calmo: function (v) { calmo = !!v; sujo = true; }
    };
  }

  raiz.DesenhoPintura = { criar: criar, PINCEIS: PINCEIS, desenharPagina: desenharPagina, miniaturaPagina: miniaturaPagina, rotulosDe: rotulosDe };
})(window);
