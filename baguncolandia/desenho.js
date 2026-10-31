/* Bagunçolândia — desenha o jogo no canvas da TV (1280×720 lógico, esticado para a tela).
   Entrada: o estado do motor (jogo.js) e os eventos drenados naquele quadro. Por baixo do canvas
   fica a câmera da pessoa (vídeo no DOM); por isso o fundo aqui é semitransparente com vinheta.
   Regras: nada de innerHTML; respeita prefers-reduced-motion (menos partículas, sem piscar). */
(function (root) {
  'use strict';
  var W = 1280, H = 720;
  var CORES = { j: ['#c6ff3d', '#ff4fa3'], ouro: '#ffd166', ciano: '#3ee8ff', fundo1: '#0b0a1f', fundo2: '#1a1446', texto: '#fff' };
  var D = { ctx: null, canvas: null, parts: [], textos: [], metades: [], estrelas: [], ultimo: 0, menos: false, figs: {}, legenda: null, contagem: null, pops: {}, flash: 0, chuva: 0, nomes: ['', ''], modoAviso: null, fonte: 'Fredoka, system-ui, sans-serif', ambiente: 'camera', cena: null, cenaImg: null, av: [{}, {}], avatares: [{}, {}], aviso: null };
  var PELE = '#ffd9b3', SAPATO = '#2b2250';
  var EN = /^en/i.test((root.navigator && root.navigator.language) || '');
  function T(pt, en) { return EN ? en : pt; }

  function iniciar(canvas, opts) {
    D.canvas = canvas; canvas.width = W; canvas.height = H; D.ctx = canvas.getContext('2d');
    D.menos = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    D.parts = []; D.textos = []; D.metades = []; D.pops = {};
    for (var i = 0; i < (D.menos ? 20 : 60); i++) D.estrelas.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.8, v: 4 + Math.random() * 10, a: Math.random() * 6.28 });
    if (opts && opts.nomes) D.nomes = opts.nomes;
    if (root.document && root.document.fonts && root.document.fonts.load) root.document.fonts.load('700 40px Fredoka').catch(function () {});
  }
  function nomes(n) { D.nomes = n; }
  /* ambiente: 'camera' (vídeo atrás, fundo translúcido) ou 'paisagem' (cena desenhada + boneco) */
  function ambiente(amb, cenaId) {
    D.ambiente = amb === 'paisagem' ? 'paisagem' : 'camera';
    if (D.ambiente === 'paisagem' && root.Cenas) {
      var cena = (cenaId && cenaId !== 'aleatoria' && root.Cenas.porId(cenaId)) || root.Cenas.sortear(D.cena && D.cena.id);
      D.cena = cena; D.cenaImg = null;
      root.Cenas.rasterizar(cena, W, H).then(function (c) { if (D.cena === cena) D.cenaImg = c; });
    }
    D.av = [{}, {}];
  }
  function avatares(lista) { if (lista && lista.length) D.avatares = lista; }

  /* figura rasterizada (cache); enquanto não pronta, bolinha da cor do suco */
  function imagem(fig, raio) {
    var px = Math.min(256, Math.round(raio * 2.3)), k = fig.id + '@' + px;
    if (D.figs[k]) return D.figs[k].pronta ? D.figs[k].c : null;
    D.figs[k] = { pronta: false, c: null };
    root.Figuras.rasterizar(fig, px).then(function (c) { D.figs[k] = { pronta: true, c: c }; });
    return null;
  }

  function desenharFigura(ctx, c, fig, alpha) {
    var img = imagem(fig, c.raio), s = c.raio * 2.3;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot || 0); ctx.globalAlpha = alpha == null ? 1 : alpha;
    // sombra macia
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s);
    else { ctx.fillStyle = fig.suco || '#fff'; ctx.beginPath(); ctx.arc(0, 0, c.raio, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }
  function balao(ctx, c) {   // balão + fio por cima da figura que desce
    ctx.save(); ctx.translate(c.x, c.y - c.raio - 6);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
    var g = ctx.createRadialGradient(-8, -62, 4, 0, -56, 30); g.addColorStop(0, '#fff'); g.addColorStop(0.3, c.cor || CORES.ciano); g.addColorStop(1, '#2a1a5e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -58, 24, 28, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = c.cor || CORES.ciano; ctx.beginPath(); ctx.moveTo(-5, -32); ctx.lineTo(5, -32); ctx.lineTo(0, -26); ctx.fill();
    ctx.restore();
  }
  function asas(ctx, c, ts) {   // voando: duas asinhas batendo
    var b = Math.sin(ts / 60) * 0.5;
    ctx.save(); ctx.translate(c.x, c.y); ctx.fillStyle = 'rgba(255,255,255,.75)';
    [-1, 1].forEach(function (s) { ctx.save(); ctx.scale(s, 1); ctx.rotate(-0.4 + b); ctx.beginPath(); ctx.ellipse(-c.raio - 10, -8, 22, 10, 0.3, 0, 6.2832); ctx.fill(); ctx.restore(); });
    ctx.restore();
  }

  /* eventos → partículas, textos, metades, pops */
  function reagir(ev, estado) {
    var cor = CORES.j[ev.j] || CORES.ouro, fig = ev.fig && root.Figuras.porId(ev.fig);
    if (ev.t === 'corte') {
      var coisa = estado.coisas.filter(function (c) { return c.id === ev.id; })[0], raio = coisa ? coisa.raio : 44, suco = (fig && fig.suco) || '#fff';
      var ang = Math.random() * Math.PI;
      D.metades.push({ fig: fig, x: ev.x, y: ev.y, raio: raio, rot: coisa ? coisa.rot : 0, ang: ang, vida: 900, vx: -Math.sin(ang) * 140, vy: -200, lado: -1 });
      D.metades.push({ fig: fig, x: ev.x, y: ev.y, raio: raio, rot: coisa ? coisa.rot : 0, ang: ang, vida: 900, vx: Math.sin(ang) * 140, vy: -200, lado: 1 });
      splash(ev.x, ev.y, suco, D.menos ? 8 : 26);
      rastroCorte(ev.x, ev.y, ang, raio);
      texto('+' + ev.pontos, ev.x, ev.y - raio, cor, 34);
      pop(ev.j);
    } else if (ev.t === 'pegou') { estrelas(ev.x, ev.y, ev.mascote ? CORES.ouro : cor, ev.mascote ? 30 : 14); texto((ev.mascote ? '★ ' : '') + '+' + ev.pontos, ev.x, ev.y - 50, ev.mascote ? CORES.ouro : cor, ev.mascote ? 44 : 34); pop(ev.j); }
    else if (ev.t === 'chutou') { estrelas(ev.x, ev.y, '#fff', 10); texto(T('Chutou! +', 'Kick! +') + ev.pontos, ev.x, ev.y - 60, cor, 32); pop(ev.j); }
    else if (ev.t === 'gol') { D.flash = 0.6; estrelas(ev.x, ev.y, CORES.ouro, 40); texto(T('GOOOL! +', 'GOAL! +') + ev.pontos, W / 2, 300, CORES.ouro, 72); pop(ev.j); }
    else if (ev.t === 'vilao') { fumaca(ev.x, ev.y); texto(ev.vida ? T('Ai! −1 vida', 'Ouch! −1 life') : (ev.pontos + ''), ev.x, ev.y - 50, '#ff5252', 36); if (ev.fig === 'chuvisco') D.chuva = 2500; if (ev.vida) D.flash = 0.35; }
    else if (ev.t === 'combo') { texto((EN ? 'COMBO ×' : 'COMBO ×') + ev.n + '  +' + ev.pontos, ev.x || W / 2, (ev.y || 300) - 110, CORES.ouro, 48, true); }
    else if (ev.t === 'poder') { if (ev.poder) texto({ x2: '✖2!', lento: T('🐌 Lento!', '🐌 Slow!'), chuva: T('🌧 Chuva de frutas!', '🌧 Fruit rain!') }[ev.poder] || '', ev.x || W / 2, (ev.y || 200) - 60, CORES.ciano, 44, true); estrelas(ev.x || W / 2, ev.y || 200, CORES.ciano, 24); }
    else if (ev.t === 'troca') { D.modoAviso = { modo: ev.modo, ate: D.ultimo + 2200 }; }
    else if (ev.t === 'tocou') { estrelas(ev.x, ev.y, cor, 8); texto('+' + ev.pontos, ev.x, ev.y - 40, cor, 28); pop(ev.j); }
    else if (ev.t === 'desviou') { texto('+' + ev.pontos + (ev.tipo === 'baixo' ? ' 🦘' : ' 🙇'), ev.x, ev.y - 60, cor, 34); estrelas(ev.x, ev.y, cor, 10); pop(ev.j); }
    else if (ev.t === 'bateu') { fumaca(ev.x, ev.y); D.flash = 0.3; texto(T('Ai! −1 vida', 'Ouch! −1 life'), ev.x, ev.y - 60, '#ff5252', 36); }
    else if (ev.t === 'aviso') { D.aviso = { tipo: ev.tipo, j: ev.j, ate: D.ultimo + 1000 }; }
    else if (ev.t === 'fim') { confete(); }
  }
  function pop(j) { D.pops[j] = D.ultimo; }
  function texto(t, x, y, cor, tam, grande) { D.textos.push({ t: t, x: x, y: y, cor: cor, tam: tam, vida: grande ? 1600 : 1000, grande: grande }); }
  function splash(x, y, cor, n) {
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.2832, v = 120 + Math.random() * 380; D.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 900, r: 3 + Math.random() * 7, cor: cor, vida: 600 + Math.random() * 500, tipo: 'gota' }); }
  }
  function estrelas(x, y, cor, n) {
    for (var i = 0; i < (D.menos ? n / 2 : n); i++) { var a = Math.random() * 6.2832, v = 80 + Math.random() * 300; D.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 300, r: 4 + Math.random() * 6, cor: cor, vida: 700 + Math.random() * 500, tipo: 'estrela', rot: Math.random() * 6 }); }
  }
  function fumaca(x, y) {
    for (var i = 0; i < (D.menos ? 6 : 16); i++) { var a = Math.random() * 6.2832, v = 30 + Math.random() * 90; D.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: -40, r: 14 + Math.random() * 20, cor: 'rgba(90,90,110,.6)', vida: 900 + Math.random() * 400, tipo: 'fumo' }); }
  }
  function rastroCorte(x, y, ang, raio) { D.parts.push({ x: x, y: y, ang: ang, len: raio * 2.6, vida: 220, tipo: 'corte' }); }
  function confete() { for (var i = 0; i < (D.menos ? 60 : 220); i++) D.parts.push({ x: Math.random() * W, y: -20 - Math.random() * 400, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 160, g: 20, r: 5 + Math.random() * 6, cor: 'hsl(' + Math.random() * 360 + ',100%,60%)', vida: 5000, tipo: 'confete', rot: Math.random() * 6 }); }
  function pulso() { D.pulsoAte = D.ultimo + 160; }
  function mostrarBoneco(v) { D.mostrarBoneco = v !== false; }
  /* começo de rodada: tira textos, partículas, legenda e avisos da rodada anterior */
  function limpar() { D.parts = []; D.textos = []; D.metades = []; D.legenda = null; D.aviso = null; D.modoAviso = null; D.flash = 0; D.chuva = 0; D.pops = {}; D.av = [{}, {}]; }
  function legenda(txt, cor, pisca) { D.legenda = txt ? { t: txt, cor: cor || '#fff', pisca: !!pisca, desde: D.ultimo } : null; }
  function contagem(n) { D.contagem = n == null ? null : { n: n, desde: D.ultimo }; }

  function quadro(estado, eventos, ts) {
    var ctx = D.ctx; if (!ctx) return;
    var dtMs = Math.min(100, ts - (D.ultimo || ts)); D.ultimo = ts; var dt = dtMs / 1000;
    (eventos || []).forEach(function (e) { reagir(e, estado); });
    ctx.clearRect(0, 0, W, H);
    var paisagem = D.ambiente === 'paisagem';
    if (paisagem) {
      // cena desenhada (opaca); enquanto a imagem não está pronta, só a cor do céu
      if (D.cenaImg) ctx.drawImage(D.cenaImg, 0, 0, W, H); else { ctx.fillStyle = (D.cena && D.cena.ceu) || CORES.fundo2; ctx.fillRect(0, 0, W, H); }
    } else {
      // fundo: gradiente noturno semitransparente + vinheta (a câmera aparece por trás)
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(11,10,31,.62)'); g.addColorStop(1, 'rgba(26,20,70,.62)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    }
    if (!paisagem || (D.cena && D.cena.id === 'espaco')) {
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      D.estrelas.forEach(function (s) { s.y -= s.v * dt; s.a += dt; if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; } ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(s.a)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    if (!estado) { camadaTexto(ctx, ts, dtMs); return; }
    var jogs = estado.jogadores, dois = jogs.length === 2, modo = estado.modo;
    // raias dos jogadores: borda neon na cor de cada um e divisória luminosa
    jogs.forEach(function (jg, j) {
      var r = jg.raia, pulsando = D.pulsoAte && ts < D.pulsoAte; ctx.save(); ctx.strokeStyle = pulsando ? '#fff' : CORES.j[j]; ctx.lineWidth = (paisagem ? 4 : 6) + (pulsando ? 6 : 0); ctx.shadowColor = CORES.j[j]; ctx.shadowBlur = pulsando ? 40 : 24; ctx.globalAlpha = paisagem ? 0.6 : 0.9;
      ctx.strokeRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.restore();
    });
    // zona de chute
    if (modo === 'chuta') {
      jogs.forEach(function (jg) { var r = jg.raia, y = r.y + r.h * jg.zonaChute; var zg = ctx.createLinearGradient(0, y, 0, r.y + r.h); zg.addColorStop(0, 'rgba(62,232,255,.0)'); zg.addColorStop(1, 'rgba(62,232,255,.28)'); ctx.fillStyle = zg; ctx.fillRect(r.x, y, r.w, r.h - (y - r.y)); ctx.setLineDash([14, 10]); ctx.strokeStyle = 'rgba(62,232,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(r.x, y); ctx.lineTo(r.x + r.w, y); ctx.stroke(); ctx.setLineDash([]); });
      trave(ctx, estado.trave, ts);
    }
    // rastro de luz onde a pessoa se mexe
    jogs.forEach(function (jg, j) {
      var pts = jg.rastro; if (!pts || pts.length < 1) return;
      ctx.save(); ctx.strokeStyle = CORES.j[j]; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = CORES.j[j]; ctx.shadowBlur = 22;
      for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i]; if (b.ts - a.ts > 350 || Math.hypot(b.x - a.x, b.y - a.y) > 560) continue; ctx.globalAlpha = 0.25 + 0.7 * (i / pts.length); ctx.lineWidth = 6 + b.f / 8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      var u = pts[pts.length - 1]; ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(u.x, u.y, 6 + u.f / 10, 0, 6.2832); ctx.fill();
      ctx.restore();
    });
    // boneco de cada jogador (ambiente paisagem)
    if (paisagem && (D.mostrarBoneco !== false || estado.modo === 'pula')) jogs.forEach(function (jg, j) { boneco(ctx, jg, j, ts, dt); });   // no modo do dedo a pessoa pode esconder o boneco (menos no Pula e abaixa)
    // as coisas
    estado.coisas.forEach(function (c) {
      if (c.morta) return;
      if (c.papel === 'obstaculo') { obstaculo(ctx, c, ts); return; }
      var fig = root.Figuras.porId(c.fig); if (!fig) return;
      if (c.estilo === 'quica') { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(c.x, jg0chao(jg0(c, jogs)), c.raio * 0.9, c.raio * 0.3, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
      c.cor = CORES.j[c.j];
      if (c.estilo === 'balao') balao(ctx, c);
      if (c.estilo === 'voa') asas(ctx, c, ts);
      if (c.papel === 'vilao') { ctx.save(); ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 30; ctx.fillStyle = 'rgba(255,23,68,.18)'; ctx.beginPath(); ctx.arc(c.x, c.y, c.raio * 1.15, 0, 6.2832); ctx.fill(); ctx.restore(); }
      if (c.papel === 'poder' || (fig.mascote)) { ctx.save(); ctx.shadowColor = fig.mascote ? CORES.ouro : CORES.ciano; ctx.shadowBlur = 36 + 10 * Math.sin(ts / 150); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(c.x, c.y, c.raio * 1.2, 0, 6.2832); ctx.fill(); ctx.restore(); }
      desenharFigura(ctx, c, fig);
    });
    // metades cortadas caindo
    for (var m = D.metades.length - 1; m >= 0; m--) {
      var h = D.metades[m]; h.vida -= dtMs; if (h.vida <= 0) { D.metades.splice(m, 1); continue; }
      h.vy += 900 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.lado * 3 * dt;
      var img = h.fig && imagem(h.fig, h.raio), s = h.raio * 2.3;
      ctx.save(); ctx.globalAlpha = Math.min(1, h.vida / 400); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
      ctx.beginPath(); var ca = Math.cos(h.ang), sa = Math.sin(h.ang), L = s;   // meia-lua: metade do quadrado de um lado da linha de corte
      ctx.moveTo(-ca * L - sa * L * h.lado, -sa * L + ca * L * h.lado); ctx.lineTo(ca * L - sa * L * h.lado, sa * L + ca * L * h.lado); ctx.lineTo(ca * L, sa * L); ctx.lineTo(-ca * L, -sa * L); ctx.closePath(); ctx.clip();
      var off = 6 * h.lado; ctx.translate(-sa * off, ca * off);
      if (img) ctx.drawImage(img, -s / 2, -s / 2, s, s); else { ctx.fillStyle = (h.fig && h.fig.suco) || '#fff'; ctx.beginPath(); ctx.arc(0, 0, h.raio, 0, 6.2832); ctx.fill(); }
      ctx.restore();
    }
    particulas(ctx, dt, dtMs);
    // clarão
    if (D.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, D.flash) + ')'; ctx.fillRect(0, 0, W, H); D.flash -= dt * 1.5; }
    // chuva do Chuvisco: a tela molha
    if (D.chuva > 0) { D.chuva -= dtMs; ctx.fillStyle = 'rgba(79,195,247,' + Math.min(0.35, D.chuva / 4000) + ')'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(200,235,255,.7)'; for (var q = 0; q < (D.menos ? 10 : 40); q++) { var rx = (q * 173 + ts / 3) % W, ry = (q * 97 + ts / 1.5) % H; ctx.fillRect(rx, ry, 2, 14); } }
    hud(ctx, estado, ts);
    camadaTexto(ctx, ts, dtMs);
  }

  function jg0(c, jogs) { return jogs[c.j] || jogs[0]; }
  function jg0chao(jg) { return jg.raia.y + jg.raia.h - 10; }

  /* ---------- boneco personalizável: o desenho mora em boneco.js; aqui só a animação e a posição ---------- */
  function avatarCfg(j) { return root.Boneco.normalizar(D.avatares[j] || D.avatares[0] || {}, j); }
  function boneco(ctx, jg, j, ts, dt) {
    if (jg.esqueleto) { marionete(ctx, jg, j, ts); return; }
    var r = jg.raia, A = r.h * (jg.raia.w < W ? 0.36 : 0.42), chao = r.y + r.h * (root.Cenas ? root.Cenas.CHAO : 0.86), cfg = avatarCfg(j), cor = cfg.cor, corpo = jg.corpo || { x: 0.5 }, av = D.av[j] || (D.av[j] = {});
    var x = r.x + corpo.x * r.w;
    if (av.x == null) av.x = x; av.vx = (x - av.x) / Math.max(dt, 0.001); av.x = x;
    var alvoY = corpo.pulando ? -A * 0.5 : 0; av.y = av.y == null ? 0 : av.y + (alvoY - av.y) * Math.min(1, dt * 12);
    var alvoAg = corpo.abaixado ? 0.6 : 1; av.ag = av.ag == null ? 1 : av.ag + (alvoAg - av.ag) * Math.min(1, dt * 10);
    av.passo = (av.passo || 0) + Math.min(14, Math.abs(av.vx) / 40) * dt * 8;
    var andando = Math.abs(av.vx) > 30, balanco = andando ? Math.sin(av.passo) : 0;
    var bracoE = false, bracoD = false, ombroY = chao + av.y - A * 0.62 * av.ag;
    (jg.rastro || []).slice(-4).forEach(function (p) { if (ts - p.ts > 400) return; if (p.y < ombroY + A * 0.1) { if (p.x < x - A * 0.05) bracoE = true; else if (p.x > x + A * 0.05) bracoD = true; } });
    av.bE = av.bE == null ? 0 : av.bE + ((bracoE ? 1 : 0) - av.bE) * Math.min(1, dt * 10);
    av.bD = av.bD == null ? 0 : av.bD + ((bracoD ? 1 : 0) - av.bD) * Math.min(1, dt * 10);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, chao + 4, A * 0.22 * (1 - av.y / A * 0.6), A * 0.06, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(x, chao + av.y); ctx.scale(1 + (1 - av.ag) * 0.35, av.ag);
    if (jg.invencivel && Math.floor(ts / 90) % 2) ctx.globalAlpha = 0.45;
    root.Boneco.corpoEmPe(ctx, cfg, A, { balanco: balanco, andando: andando, bE: av.bE, bD: av.bD, pulando: corpo.pulando, ts: ts });
    ctx.restore();
    ctx.save(); ctx.font = '600 22px ' + D.fonte; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = cor; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 6;
    ctx.fillText(D.nomes[j] || '', x, chao + av.y - A * 1.02 * av.ag - 6); ctx.restore();
  }
  /* prévia no celular: um boneco parado, acenando, num canvas pequeno */
  function previa(canvas, cfg, ts) {
    var ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save(); ctx.translate(w / 2, h * 0.94);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 4, w * 0.2, 8, 0, 0, 6.2832); ctx.fill();
    root.Boneco.corpoEmPe(ctx, cfg, h * 0.82, { balanco: 0, andando: false, bE: 0, bD: 0.5 + 0.5 * Math.sin((ts || 0) / 300), pulando: false, ts: ts || 0 });
    ctx.restore();
  }
  function previaCabeca(canvas, cfg) {
    var ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.translate(w / 2, h * 0.56); root.Boneco.cabeca(ctx, cfg, w * 0.62, 0); ctx.restore();
  }
  function marionete(ctx, jg, j, ts) {
    var r = jg.raia, k = jg.esqueleto, cfg = avatarCfg(j);
    var P = k.map(function (q) { return { x: r.x + q[0] * r.w, y: r.y + q[1] * r.h }; });
    ctx.save(); if (jg.invencivel && Math.floor(ts / 90) % 2) ctx.globalAlpha = 0.45;
    root.Boneco.marionete(ctx, cfg, P, ts); ctx.restore();
    var hs = Math.max(70, Math.min(230, Math.hypot(P[2].x - P[1].x, P[2].y - P[1].y) * 1.4));
    ctx.save(); ctx.font = '600 22px ' + D.fonte; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = cfg.cor; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 6;
    ctx.fillText(D.nomes[j] || '', P[0].x, P[0].y - hs * 0.7); ctx.restore();
  }

  /* ---------- obstáculos do Pula e abaixa: tronco (chão) e galho (alto) ---------- */
  function obstaculo(ctx, c, ts) {
    var jg = null; // o chão é o da cena
    var chao = H * (root.Cenas ? root.Cenas.CHAO : 0.86);
    ctx.save();
    if (c.tipo === 'baixo') {
      ctx.translate(c.x, chao - c.h / 2 + 6); ctx.rotate(c.rot * 0.15);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, c.h / 2 + 2, c.w * 0.6, 10, 0, 0, 6.2832); ctx.fill();
      var g = ctx.createLinearGradient(0, -c.h / 2, 0, c.h / 2); g.addColorStop(0, '#a0683d'); g.addColorStop(1, '#5d3a16');
      ctx.fillStyle = g; arred(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3; arred(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 18); ctx.stroke();
      ctx.fillStyle = '#e0b48a'; ctx.beginPath(); ctx.ellipse(c.w / 2 - 4, 0, 12, c.h / 2 - 6, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = '#a0683d'; ctx.lineWidth = 2; for (var i = 1; i < 4; i++) { ctx.beginPath(); ctx.ellipse(c.w / 2 - 4, 0, 12 * i / 4, (c.h / 2 - 6) * i / 4, 0, 0, 6.2832); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-c.w / 2 + 14, -8); ctx.lineTo(c.w / 2 - 20, -8); ctx.moveTo(-c.w / 2 + 20, 10); ctx.lineTo(c.w / 2 - 26, 10); ctx.stroke();
    } else {
      // galho pendurado do alto: a parte baixa fica na altura da cabeça do boneco em pé
      var baixo = chao - H * 0.42 * 0.62, topo = 0;
      ctx.translate(c.x, 0);
      ctx.strokeStyle = '#6d4c1e'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, topo); ctx.quadraticCurveTo(14 + Math.sin(ts / 300) * 8, baixo * 0.5, 0, baixo - 10); ctx.stroke();
      ctx.strokeStyle = '#8d5524'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, baixo * 0.35); ctx.lineTo(-50, baixo * 0.55); ctx.moveTo(0, baixo * 0.6); ctx.lineTo(48, baixo * 0.78); ctx.stroke();
      ctx.fillStyle = '#3f9b3f';
      [[-56, baixo * 0.55], [48, baixo * 0.78], [0, baixo - 4], [-20, baixo * 0.8], [26, baixo * 0.5]].forEach(function (f, i) { ctx.save(); ctx.translate(f[0], f[1]); ctx.rotate(Math.sin(ts / 400 + i) * 0.2); ctx.beginPath(); ctx.ellipse(0, 0, 34, 18, 0.4, 0, 6.2832); ctx.fill(); ctx.restore(); });
      ctx.fillStyle = '#c6ff3d'; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(-50, baixo * 0.53, 14, 7, 0.4, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function trave(ctx, t, ts) {
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.shadowColor = CORES.ouro; ctx.shadowBlur = 20 + 8 * Math.sin(ts / 200); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(t.x, t.y + t.h); ctx.lineTo(t.x, t.y); ctx.lineTo(t.x + t.w, t.y); ctx.lineTo(t.x + t.w, t.y + t.h); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
    for (var i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(t.x + t.w * i / 8, t.y); ctx.lineTo(t.x + t.w * i / 8, t.y + t.h); ctx.stroke(); }
    for (var k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(t.x, t.y + t.h * k / 5); ctx.lineTo(t.x + t.w, t.y + t.h * k / 5); ctx.stroke(); }
    ctx.restore();
  }

  function particulas(ctx, dt, dtMs) {
    for (var i = D.parts.length - 1; i >= 0; i--) {
      var p = D.parts[i]; p.vida -= dtMs; if (p.vida <= 0) { D.parts.splice(i, 1); continue; }
      if (p.tipo === 'corte') { ctx.save(); ctx.globalAlpha = p.vida / 220; ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(p.ang) * p.len, p.y - Math.sin(p.ang) * p.len); ctx.lineTo(p.x + Math.cos(p.ang) * p.len, p.y + Math.sin(p.ang) * p.len); ctx.stroke(); ctx.restore(); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.rot != null) p.rot += dt * 4;
      ctx.globalAlpha = Math.min(1, p.vida / 400); ctx.fillStyle = p.cor;
      if (p.tipo === 'estrela') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); for (var k = 0; k < 10; k++) { var rr = k % 2 ? p.r * 0.45 : p.r, a = k * Math.PI / 5; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); }
      else if (p.tipo === 'confete') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  function hud(ctx, estado, ts) {
    var jogs = estado.jogadores, dois = jogs.length === 2;
    ctx.save(); ctx.textBaseline = 'top';
    jogs.forEach(function (jg, j) {
      // jogador 1 encostado à esquerda; jogador 2 encostado à direita (o relógio fica no meio, livre)
      var r = jg.raia, dir = j === 1, x = dir ? r.x + r.w - 26 : r.x + 26, y = 18, cor = CORES.j[j], s = dir ? -1 : 1;
      var pop = D.pops[j] ? Math.max(0, 1 - (ts - D.pops[j]) / 300) : 0, esc = 1 + pop * 0.35;
      ctx.textAlign = dir ? 'right' : 'left';
      // nome
      ctx.font = '600 26px ' + D.fonte; ctx.fillStyle = cor; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8;
      ctx.fillText(D.nomes[j] || (T('Jogador ', 'Player ') + (j + 1)), x, y);
      // pontos
      ctx.save(); ctx.translate(x, y + 30); ctx.scale(esc, esc); ctx.font = '700 64px ' + D.fonte; ctx.fillStyle = CORES.ouro; ctx.fillText(String(jg.pontos), 0, 0); ctx.restore();
      // vidas
      ctx.font = '28px system-ui'; var vs = ''; for (var i = 0; i < 3; i++) vs += i < jg.vidas ? '❤️' : '🖤'; ctx.fillText(vs, x, y + 104);
      // poder / lento
      if (jg.poder === 'x2') { ctx.font = '700 30px ' + D.fonte; ctx.fillStyle = CORES.ciano; ctx.fillText('✖2 ' + Math.max(0, Math.ceil((jg.poderAte - estado.tempo) / 1000)) + 's', x + s * 120, y + 104); }
      if (jg.lento) { ctx.font = '30px system-ui'; ctx.fillText('🐌', x + s * 220, y + 104); }
      // combo
      if (jg.combo >= 2) { ctx.textAlign = 'center'; ctx.font = '700 40px ' + D.fonte; ctx.fillStyle = CORES.ouro; ctx.fillText('COMBO ×' + jg.combo, r.x + r.w / 2, 150); }
    });
    // tempo (no meio do topo)
    if (estado.restante != null) {
      ctx.textAlign = 'center'; ctx.font = '700 54px ' + D.fonte; ctx.fillStyle = estado.restante <= 10 && estado.fase === 'jogando' ? '#ff5252' : '#fff';
      var s = estado.restante, mm = Math.floor(s / 60), ss = s % 60; ctx.fillText(mm + ':' + (ss < 10 ? '0' : '') + ss, W / 2, 16);
    }
    // modo atual (pequeno)
    var nomeModo = { corta: T('🍉 Corta-corta', '🍉 Slice'), pega: T('🎈 Pega-pega', '🎈 Catch'), chuta: T('⚽ Chuta-chuta', '⚽ Kick'), pula: T('🪵 Pula e abaixa', '🪵 Jump and duck'), bolas: T('🎳 Bagunça de bolas', '🎳 Ball mayhem') }[estado.modo] || '';
    ctx.textAlign = 'center'; ctx.font = '600 24px ' + D.fonte; ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillText(nomeModo, W / 2, 76);
    if (D.modoAviso && ts < D.modoAviso.ate) { var a = Math.min(1, (D.modoAviso.ate - ts) / 500); ctx.globalAlpha = a; ctx.font = '700 80px ' + D.fonte; ctx.fillStyle = CORES.ciano; ctx.shadowBlur = 30; ctx.shadowColor = CORES.ciano; ctx.fillText({ corta: T('🍉 Corta!', '🍉 Slice!'), pega: T('🎈 Pega!', '🎈 Catch!'), chuta: T('⚽ Chuta!', '⚽ Kick!'), pula: T('🪵 Pula e abaixa!', '🪵 Jump and duck!'), bolas: T('🎳 Bagunça de bolas!', '🎳 Ball mayhem!') }[D.modoAviso.modo], W / 2, 280); ctx.globalAlpha = 1; }
    if (D.aviso && ts < D.aviso.ate) { var rj = jogs[D.aviso.j] ? jogs[D.aviso.j].raia : jogs[0].raia, pisc = Math.floor(ts / 120) % 2 === 0 || D.menos; ctx.textAlign = 'center'; ctx.font = '700 96px ' + D.fonte; ctx.fillStyle = pisc ? (D.aviso.tipo === 'baixo' ? CORES.ouro : CORES.ciano) : '#fff'; ctx.shadowBlur = 30; ctx.shadowColor = ctx.fillStyle; ctx.fillText(D.aviso.tipo === 'baixo' ? T('⬆ PULA!', '⬆ JUMP!') : T('⬇ ABAIXA!', '⬇ DUCK!'), rj.x + rj.w / 2, 230); ctx.shadowBlur = 0; }
    if (estado.fase === 'pausa') { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H); ctx.font = '700 90px ' + D.fonte; ctx.fillStyle = '#fff'; ctx.fillText(T('⏸ Pausa', '⏸ Paused'), W / 2, 300); }
    ctx.restore();
  }

  function camadaTexto(ctx, ts, dtMs) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = D.textos.length - 1; i >= 0; i--) {
      var t = D.textos[i]; t.vida -= dtMs; if (t.vida <= 0) { D.textos.splice(i, 1); continue; }
      t.y -= (t.grande ? 20 : 60) * dtMs / 1000;
      ctx.globalAlpha = Math.min(1, t.vida / 300); ctx.font = '700 ' + t.tam + 'px ' + D.fonte; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.fillStyle = t.cor;
      ctx.strokeText(t.t, t.x, t.y); ctx.fillText(t.t, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    if (D.legenda) {
      var L = D.legenda, vis = !L.pisca || D.menos || Math.floor((ts - L.desde) / 450) % 2 === 0;
      ctx.font = '700 46px ' + D.fonte; var w = Math.min(W - 60, ctx.measureText(L.t).width + 70);
      ctx.fillStyle = 'rgba(0,0,0,.72)'; arred(ctx, W / 2 - w / 2, H - 150, w, 90, 24); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = vis ? L.cor : 'rgba(255,255,255,.25)'; ctx.shadowColor = L.cor; ctx.shadowBlur = vis ? 24 : 0; arred(ctx, W / 2 - w / 2, H - 150, w, 90, 24); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = vis ? L.cor : 'rgba(255,255,255,.6)'; ctx.fillText(L.t, W / 2, H - 105, W - 100);
    }
    if (D.contagem) { var c = D.contagem, e = (ts - c.desde) / 1000, esc2 = 1.6 - Math.min(0.6, e); ctx.globalAlpha = Math.max(0, 1 - e); ctx.font = '700 ' + Math.round(220 * esc2) + 'px ' + D.fonte; ctx.fillStyle = CORES.ouro; ctx.shadowColor = CORES.ouro; ctx.shadowBlur = 40; ctx.fillText(String(c.n), W / 2, H / 2); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  function arred(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* pódio no fim: desenha sobre o palco escurecido */
  function podio(ctx, ordem, nomesJ, ts) {
    ctx = ctx || D.ctx; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 96px ' + D.fonte; ctx.fillStyle = CORES.ouro; ctx.shadowColor = CORES.ouro; ctx.shadowBlur = 40; ctx.fillText('🏆', W / 2, 150);
    ctx.shadowBlur = 0; var med = ['🥇', '🥈'];
    ordem.forEach(function (o, i) { ctx.font = '700 ' + (i ? 48 : 64) + 'px ' + D.fonte; ctx.fillStyle = i ? '#fff' : CORES.ouro; ctx.fillText((ordem.length > 1 ? med[i] + ' ' : '') + (nomesJ[o.j] || (T('Jogador ', 'Player ') + (o.j + 1))) + '  ' + o.pontos, W / 2, 290 + i * 90); });
    ctx.font = '600 32px ' + D.fonte; ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillText(T('Jogar de novo: toque em ▶ no celular (ou OK no controle)', 'Play again: tap ▶ on the phone (or OK on the remote)'), W / 2, 560, W - 80);
    ctx.restore();
  }

  root.Desenho = { iniciar: iniciar, quadro: quadro, legenda: legenda, contagem: contagem, confete: confete, podio: podio, nomes: nomes, texto: texto, ambiente: ambiente, avatares: avatares, previa: previa, previaCabeca: previaCabeca, imagem: imagem, pulso: pulso, mostrarBoneco: mostrarBoneco, limpar: limpar, CORES: CORES, W: W, H: H };
})(typeof self !== 'undefined' ? self : this);
