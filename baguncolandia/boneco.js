/* Bagunçolândia — o boneco (avatar) desenhado no canvas, estilo boneco de pano de jogo de plataforma:
   cabeça grande, corpo pequeno, mãozinhas de luva, costuras e botão. Tudo vetorial, com as cores que a
   pessoa escolheu. Usado pelo desenho.js (jogo e marionete) e pela prévia no celular.

   cfg = { cabeca, cabelo, corCabelo, pele, cor (roupa), roupa, acessorio, sapato }
   cabeca: 'menino' | 'menina' | 'pano' | 'elfo' | 'hobbit' | 'mago' | 'cavaleiro' | 'robo' | id de figura da turma
   cabelo: 'curto' | 'espetado' | 'franja' | 'longo' | 'cacheado' | 'trancas' | 'coque' | 'maria' | 'careca'
   roupa: 'camiseta' | 'vestido' | 'macacao' | 'capa' | 'armadura' | 'tunica'
   acessorio: 'nenhum' | 'laco' | 'coroa' | 'oculos' | 'chapeu' | 'asas' | 'flor' | 'bone' | 'tiara' */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Boneco = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var CABECAS = ['menino', 'menina', 'pano', 'elfo', 'hobbit', 'mago', 'cavaleiro', 'robo'];
  var CABELOS = ['curto', 'espetado', 'franja', 'longo', 'cacheado', 'trancas', 'coque', 'maria', 'careca'];
  var ROUPAS = ['camiseta', 'vestido', 'macacao', 'capa', 'armadura', 'tunica'];
  var ACESSORIOS = ['nenhum', 'laco', 'coroa', 'oculos', 'chapeu', 'asas', 'flor', 'bone', 'tiara'];
  var PADRAO = { cabeca: 'menino', cabelo: 'curto', corCabelo: '#4a2c17', pele: '#ffd9b3', cor: '#c6ff3d', roupa: 'camiseta', acessorio: 'nenhum', sapato: '#2b2250' };
  var OURO = '#ffd166', CIANO = '#3ee8ff', ROSA = '#ff4fa3', ESCURO = '#1f1b3a';

  function normalizar(a, j) {
    a = a || {}; if (typeof a === 'string') a = { cabeca: a };
    var c = {};
    Object.keys(PADRAO).forEach(function (k) { c[k] = a[k] || PADRAO[k]; });
    if (j === 1 && !a.cabeca) { c.cabeca = 'menina'; c.cabelo = a.cabelo || 'longo'; c.cor = a.cor || ROSA; c.roupa = a.roupa || 'vestido'; }
    if (ROUPAS.indexOf(c.roupa) < 0) c.roupa = 'camiseta';
    if (ACESSORIOS.indexOf(c.acessorio) < 0) c.acessorio = 'nenhum';
    if (CABELOS.indexOf(c.cabelo) < 0) c.cabelo = 'curto';
    return c;
  }
  function hex(h) { var m = /^#([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [128, 128, 128]; var n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function tom(h, f) { var c = hex(h); return 'rgb(' + c.map(function (v) { return Math.round(Math.max(0, Math.min(255, v * f))); }).join(',') + ')'; }
  function claro(h, f) { var c = hex(h); return 'rgb(' + c.map(function (v) { return Math.round(v + (255 - v) * f); }).join(',') + ')'; }
  function arred(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function costura(ctx, x1, y1, x2, y2, cor) { ctx.save(); ctx.strokeStyle = cor; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }

  /* ================= CORPO EM PÉ =================
     origem no meio dos pés; A = altura total; o = { balanco, andando, bE, bD, pulando, ts }
     Proporções de criança: cabeça 0.40A, tronco 0.27A, pernas 0.22A, pescoço curto. */
  function corpoEmPe(ctx, cfg, A, o) {
    cfg = normalizar(cfg); o = o || {};
    var bal = o.balanco || 0, cor = cfg.cor, escuro = tom(cor, 0.72), ts = o.ts || 0;
    var hs = A * 0.40, pernaA = A * 0.22, tw = A * 0.24, th = A * 0.27, ty = -pernaA - th, L = A * 0.055;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (cfg.acessorio === 'asas') asas(ctx, A, ty + th * 0.3, ts);
    if (cfg.roupa === 'capa') capa(ctx, A, ty, cor, bal);
    // pernas: calça escura (ou a roupa no macacão), joelho dobrando ao andar; sapatos arredondados com sola
    var corPerna = cfg.roupa === 'macacao' ? cor : (cfg.roupa === 'vestido' ? cfg.pele : '#2e2a5a');
    [[-1, bal], [1, -bal]].forEach(function (pp) {
      var s = pp[0], px = s * tw * 0.22, kx = px + pp[1] * A * 0.05, ky = -pernaA * 0.5, fx = px + pp[1] * A * 0.1, fy = o.pulando ? -pernaA * 0.35 : 0;
      ctx.strokeStyle = corPerna; ctx.lineWidth = L * 1.5; ctx.beginPath(); ctx.moveTo(px, -pernaA); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy - L * 0.5); ctx.stroke();
      // sapato
      ctx.fillStyle = cfg.sapato; ctx.beginPath(); ctx.ellipse(fx + s * L * 0.5, fy - L * 0.45, L * 1.35, L * 0.8, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(fx + s * L * 0.5, fy - L * 0.1, L * 1.3, L * 0.35, 0, 0, 6.2832); ctx.fill();
    });
    tronco(ctx, cfg, A, tw, th, ty, escuro);
    // braços: manga curta na cor da roupa, antebraço em pele, mãozinha de luva
    [[-1, o.bE || 0], [1, o.bD || 0]].forEach(function (bb) {
      var s = bb[0], up = bb[1], ox = s * tw * 0.52, oy = ty + th * 0.18;
      var ang = (0.25 + up * 1.55) + (o.andando ? bal * s * 0.4 * (1 - up) : 0);   // ângulo a partir de "para baixo": levantado = para fora e para cima
      var ex = ox + s * Math.sin(ang) * A * 0.11, ey = oy + Math.cos(ang) * A * 0.11;
      var hx = ex + s * Math.sin(ang + up * 0.95) * A * 0.1, hy = ey + Math.cos(ang + up * 0.95) * A * 0.1;
      ctx.strokeStyle = cfg.roupa === 'armadura' ? '#b0bec5' : cor; ctx.lineWidth = L * 1.4; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = cfg.pele; ctx.lineWidth = L; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = cfg.pele; ctx.beginPath(); ctx.arc(hx, hy, L * 0.95, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = tom(cfg.pele, 0.8); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx, hy, L * 0.95, 0, 6.2832); ctx.stroke();
    });
    // pescoço + cabeça (balança de leve ao andar)
    ctx.fillStyle = cfg.pele; ctx.fillRect(-L * 0.6, ty - L * 0.6, L * 1.2, L * 1.2);
    ctx.save(); ctx.translate(0, ty - hs * 0.46 + Math.abs(bal) * 2); ctx.rotate(bal * 0.06);
    cabeca(ctx, cfg, hs, ts); ctx.restore();
    ctx.restore();
  }

  function asas(ctx, A, y, ts) {
    var b = Math.sin(ts / 110) * 0.3;
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.strokeStyle = 'rgba(62,232,255,.6)'; ctx.lineWidth = 2;
    [-1, 1].forEach(function (s) { ctx.save(); ctx.translate(s * A * 0.08, y); ctx.scale(s, 1); ctx.rotate(-0.6 + b); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(A * 0.22, -A * 0.16, A * 0.3, -A * 0.02); ctx.quadraticCurveTo(A * 0.2, A * 0.02, A * 0.16, A * 0.08); ctx.quadraticCurveTo(A * 0.08, A * 0.04, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore(); });
    ctx.restore();
  }
  function capa(ctx, A, ty, cor, bal) {
    ctx.save(); ctx.fillStyle = tom(cor, 0.7); ctx.strokeStyle = tom(cor, 0.5); ctx.lineWidth = 2;
    var w = A * 0.17, h = A * 0.42, ond = bal * A * 0.05;
    ctx.beginPath(); ctx.moveTo(-w * 0.8, ty + 4); ctx.lineTo(w * 0.8, ty + 4); ctx.quadraticCurveTo(w * 1.3 + ond, ty + h * 0.6, w * 1.1 + ond * 2, ty + h);
    ctx.quadraticCurveTo(0, ty + h - A * 0.03, -w * 1.1 + ond * 2, ty + h); ctx.quadraticCurveTo(-w * 1.3 + ond, ty + h * 0.6, -w * 0.8, ty + 4); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function tronco(ctx, cfg, A, tw, th, ty, escuro) {
    var cor = cfg.cor, r = cfg.roupa;
    ctx.fillStyle = cor; ctx.strokeStyle = escuro; ctx.lineWidth = 2;
    if (r === 'vestido') {
      ctx.beginPath(); ctx.moveTo(-tw * 0.45, ty); ctx.lineTo(tw * 0.45, ty); ctx.lineTo(tw * 0.9, ty + th * 1.25); ctx.quadraticCurveTo(0, ty + th * 1.35, -tw * 0.9, ty + th * 1.25); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-tw * 0.8, ty + th * 1.1); ctx.quadraticCurveTo(0, ty + th * 1.2, tw * 0.8, ty + th * 1.1); ctx.stroke();   // barra
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(0, ty + th * 0.08, tw * 0.1, 0, 6.2832); ctx.fill();   // golinha
      ctx.fillStyle = tom(cor, 0.85); ctx.beginPath(); ctx.ellipse(0, ty + th * 0.45, tw * 0.07, tw * 0.1, 0, 0, 6.2832); ctx.fill();
      return;
    }
    if (r === 'tunica') {
      ctx.beginPath(); ctx.moveTo(-tw * 0.5, ty); ctx.lineTo(tw * 0.5, ty); ctx.lineTo(tw * 0.65, ty + th * 1.15); ctx.lineTo(-tw * 0.65, ty + th * 1.15); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = OURO; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-tw * 0.55, ty + th * 0.72); ctx.lineTo(tw * 0.55, ty + th * 0.72); ctx.stroke();   // cinto
      ctx.fillStyle = OURO; arred(ctx, -tw * 0.08, ty + th * 0.64, tw * 0.16, th * 0.16, 3); ctx.fill();
      ctx.strokeStyle = tom(cor, 0.8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, ty + 2); ctx.lineTo(0, ty + th * 0.6); ctx.stroke();
      return;
    }
    if (r === 'armadura') {
      var g = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0); g.addColorStop(0, '#90a4ae'); g.addColorStop(0.5, '#eceff1'); g.addColorStop(1, '#90a4ae');
      ctx.fillStyle = g; ctx.strokeStyle = '#546e7a'; arred(ctx, -tw * 0.55, ty, tw * 1.1, th, tw * 0.25); ctx.fill(); ctx.stroke();
      ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(0, ty + th * 0.2); ctx.lineTo(tw * 0.22, ty + th * 0.35); ctx.lineTo(0, ty + th * 0.8); ctx.lineTo(-tw * 0.22, ty + th * 0.35); ctx.closePath(); ctx.fill();   // brasão
      ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-tw * 0.55, ty + th * 0.5); ctx.lineTo(tw * 0.55, ty + th * 0.5); ctx.stroke();
      return;
    }
    // camiseta / macacão / capa: tronco arredondado com manguinhas
    arred(ctx, -tw * 0.55, ty, tw * 1.1, th, tw * 0.28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tom(cor, 0.9); arred(ctx, -tw * 0.72, ty + th * 0.05, tw * 0.3, th * 0.35, tw * 0.1); ctx.fill(); arred(ctx, tw * 0.42, ty + th * 0.05, tw * 0.3, th * 0.35, tw * 0.1); ctx.fill();   // mangas
    costura(ctx, 0, ty + th * 0.12, 0, ty + th * 0.9, tom(cor, 0.6));
    if (r === 'macacao') {
      ctx.fillStyle = escuro; arred(ctx, -tw * 0.32, ty - 3, tw * 0.14, th * 0.45, 3); ctx.fill(); arred(ctx, tw * 0.18, ty - 3, tw * 0.14, th * 0.45, 3); ctx.fill();   // alças
      ctx.fillStyle = claro(cor, 0.35); arred(ctx, -tw * 0.2, ty + th * 0.4, tw * 0.4, th * 0.32, 4); ctx.fill();   // bolso
      costura(ctx, -tw * 0.2, ty + th * 0.42, tw * 0.2, ty + th * 0.42, tom(cor, 0.6));
      ctx.fillStyle = OURO; ctx.beginPath(); ctx.arc(-tw * 0.25, ty + th * 0.12, 3, 0, 6.2832); ctx.arc(tw * 0.25, ty + th * 0.12, 3, 0, 6.2832); ctx.fill();   // botões das alças
    } else {
      ctx.fillStyle = 'rgba(255,255,255,.28)'; arred(ctx, -tw * 0.4, ty + th * 0.1, tw * 0.3, th * 0.45, 6); ctx.fill();   // brilho
      ctx.fillStyle = escuro; ctx.beginPath(); ctx.arc(0, ty + th * 0.55, A * 0.012, 0, 6.2832); ctx.fill();   // botão
    }
    if (r === 'capa') { ctx.fillStyle = tom(cor, 0.55); ctx.beginPath(); ctx.moveTo(-tw * 0.5, ty); ctx.lineTo(0, ty + th * 0.22); ctx.lineTo(tw * 0.5, ty); ctx.lineTo(tw * 0.4, ty - 4); ctx.lineTo(-tw * 0.4, ty - 4); ctx.closePath(); ctx.fill(); }   // gola da capa
  }

  /* ================= CABEÇA (origem no centro; hs = diâmetro) ================= */
  function cabeca(ctx, cfg, hs, ts) {
    cfg = normalizar(cfg);
    var tipo = cfg.cabeca, R = hs / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = hs * 0.12; ctx.shadowOffsetY = hs * 0.05;
    if (tipo === 'robo') { robo(ctx, cfg, R); ctx.restore(); acessorio(ctx, cfg, hs); return; }
    if (tipo === 'pano') { pano(ctx, cfg, R, ts); ctx.restore(); acessorio(ctx, cfg, hs); return; }
    if (CABECAS.indexOf(tipo) < 0 && root.Figuras) { figura(ctx, cfg, hs); ctx.restore(); acessorio(ctx, cfg, hs); return; }
    // cabelo de trás (longo, cacheado, tranças) fica atrás do rosto
    cabeloTras(ctx, cfg, R);
    // orelhas
    var orelha = tipo === 'elfo' || tipo === 'hobbit';
    ctx.fillStyle = cfg.pele; ctx.strokeStyle = tom(cfg.pele, 0.8); ctx.lineWidth = 1.5;
    [-1, 1].forEach(function (s) { if (orelha) { ctx.beginPath(); ctx.moveTo(s * R * 0.85, R * 0.1); ctx.lineTo(s * R * (tipo === 'elfo' ? 1.5 : 1.25), -R * (tipo === 'elfo' ? 0.35 : 0.1)); ctx.lineTo(s * R * 0.9, -R * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke(); } else { ctx.beginPath(); ctx.ellipse(s * R * 0.95, R * 0.05, R * 0.14, R * 0.2, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); } });
    // rosto: redondo, um pouco mais largo embaixo (bochechas)
    ctx.fillStyle = cfg.pele; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.95, R, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = tom(cfg.pele, 0.82); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // bochechas
    ctx.fillStyle = 'rgba(255,110,150,.35)'; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s * R * 0.5, R * 0.3, R * 0.2, R * 0.13, 0, 0, 6.2832); ctx.fill(); });
    // olhos grandes, com brilho (menina/elfo com cílios)
    var menina = tipo === 'menina' || cfg.cabelo === 'longo' && tipo !== 'mago';
    [-1, 1].forEach(function (s) {
      var ex = s * R * 0.36, ey = R * 0.02;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ex, ey, R * 0.2, R * 0.24, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#3b2a1a'; ctx.beginPath(); ctx.ellipse(ex + s * R * 0.03, ey + R * 0.04, R * 0.12, R * 0.15, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = ESCURO; ctx.beginPath(); ctx.arc(ex + s * R * 0.03, ey + R * 0.05, R * 0.07, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - s * R * 0.03, ey - R * 0.05, R * 0.05, 0, 6.2832); ctx.fill();
      if (menina || tipo === 'elfo') { ctx.strokeStyle = ESCURO; ctx.lineWidth = R * 0.03; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ex + s * R * 0.16, ey - R * 0.18); ctx.lineTo(ex + s * R * 0.26, ey - R * 0.26); ctx.moveTo(ex + s * R * 0.06, ey - R * 0.22); ctx.lineTo(ex + s * R * 0.1, ey - R * 0.32); ctx.stroke(); }
    });
    // sobrancelhas
    ctx.strokeStyle = tom(cfg.corCabelo, 0.85); ctx.lineWidth = R * 0.05; ctx.lineCap = 'round';
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s * R * 0.2, -R * 0.3); ctx.quadraticCurveTo(s * R * 0.38, -R * 0.38, s * R * 0.52, -R * 0.3); ctx.stroke(); });
    // nariz e boca
    ctx.strokeStyle = tom(cfg.pele, 0.7); ctx.lineWidth = R * 0.04; ctx.beginPath(); ctx.moveTo(0, R * 0.2); ctx.quadraticCurveTo(R * 0.06, R * 0.3, -R * 0.02, R * 0.32); ctx.stroke();
    ctx.strokeStyle = '#8b3a4a'; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.moveTo(-R * 0.22, R * 0.52); ctx.quadraticCurveTo(0, R * 0.72, R * 0.22, R * 0.52); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-R * 0.14, R * 0.56); ctx.quadraticCurveTo(0, R * 0.66, R * 0.14, R * 0.56); ctx.closePath(); ctx.fill();
    // sardas no hobbit, barba no mago
    if (tipo === 'hobbit') { ctx.fillStyle = tom(cfg.pele, 0.75); [[-0.55, 0.32], [-0.45, 0.4], [-0.62, 0.42], [0.55, 0.32], [0.45, 0.4], [0.62, 0.42]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0] * R, p[1] * R, R * 0.025, 0, 6.2832); ctx.fill(); }); }
    if (tipo === 'mago') { ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(-R * 0.6, R * 0.35); ctx.quadraticCurveTo(-R * 0.5, R * 1.3, 0, R * 1.55); ctx.quadraticCurveTo(R * 0.5, R * 1.3, R * 0.6, R * 0.35); ctx.quadraticCurveTo(0, R * 0.75, -R * 0.6, R * 0.35); ctx.fill(); ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.ellipse(0, R * 0.46, R * 0.3, R * 0.1, 0, 0, 6.2832); ctx.fill(); }
    cabeloFrente(ctx, cfg, R);
    if (tipo === 'cavaleiro') elmo(ctx, R);
    if (tipo === 'mago') chapeuMago(ctx, R, cfg.cor);
    ctx.restore();
    acessorio(ctx, cfg, hs);
  }
  function cabeloTras(ctx, cfg, R) {
    var c = cfg.corCabelo, e = cfg.cabelo; if (e === 'careca' || cfg.cabeca === 'cavaleiro') return;
    ctx.fillStyle = c;
    if (e === 'longo') { ctx.beginPath(); ctx.moveTo(-R * 0.98, -R * 0.2); ctx.quadraticCurveTo(-R * 1.1, R * 1.1, -R * 0.7, R * 1.25); ctx.lineTo(R * 0.7, R * 1.25); ctx.quadraticCurveTo(R * 1.1, R * 1.1, R * 0.98, -R * 0.2); ctx.closePath(); ctx.fill(); }
    else if (e === 'cacheado') { for (var i = 0; i < 12; i++) { var a = Math.PI * 0.1 + i / 11 * Math.PI * 0.8; ctx.beginPath(); ctx.arc(Math.cos(a + Math.PI) * R * 1.0, Math.sin(a + Math.PI) * R * 0.95 + R * 0.1, R * 0.3, 0, 6.2832); ctx.fill(); } for (var k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-R * 1.05 + k * R * 0.42, R * 0.9, R * 0.28, 0, 6.2832); ctx.fill(); } }
    else if (e === 'trancas') { [-1, 1].forEach(function (s) { ctx.strokeStyle = c; ctx.lineWidth = R * 0.26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s * R * 0.85, R * 0.1); ctx.quadraticCurveTo(s * R * 1.15, R * 0.7, s * R * 0.95, R * 1.25); ctx.stroke(); ctx.strokeStyle = tom(c, 0.75); ctx.lineWidth = R * 0.04; for (var t = 0; t < 4; t++) { var yy = R * 0.35 + t * R * 0.24; ctx.beginPath(); ctx.moveTo(s * R * (1.0 - t * 0.03) - R * 0.1, yy); ctx.lineTo(s * R * (1.0 - t * 0.03) + R * 0.1, yy + R * 0.08); ctx.stroke(); } ctx.fillStyle = ROSA; ctx.beginPath(); ctx.arc(s * R * 0.95, R * 1.22, R * 0.1, 0, 6.2832); ctx.fill(); }); }
    else if (e === 'maria') { [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s * R * 1.05, R * 0.35, R * 0.22, R * 0.5, s * 0.3, 0, 6.2832); ctx.fill(); ctx.fillStyle = ROSA; ctx.beginPath(); ctx.arc(s * R * 0.95, -R * 0.05, R * 0.1, 0, 6.2832); ctx.fill(); ctx.fillStyle = c; }); }
    else if (e === 'coque') { ctx.beginPath(); ctx.arc(0, -R * 1.05, R * 0.32, 0, 6.2832); ctx.fill(); }
  }
  function cabeloFrente(ctx, cfg, R) {
    var c = cfg.corCabelo, e = cfg.cabelo; if (e === 'careca' || cfg.cabeca === 'cavaleiro') return;
    ctx.fillStyle = c; ctx.strokeStyle = tom(c, 0.8); ctx.lineWidth = 1;
    if (e === 'espetado') { ctx.beginPath(); ctx.moveTo(-R * 0.95, -R * 0.25); for (var i = 0; i < 7; i++) { var x = -R * 0.9 + i * R * 0.3; ctx.lineTo(x + R * 0.15, -R * 1.25 - (i % 2) * R * 0.15); ctx.lineTo(x + R * 0.3, -R * 0.6); } ctx.lineTo(R * 0.95, -R * 0.25); ctx.quadraticCurveTo(0, -R * 0.55, -R * 0.95, -R * 0.25); ctx.fill(); return; }
    // calota básica (curto, franja, longo, cacheado, trancas, coque, maria)
    ctx.beginPath(); ctx.moveTo(-R * 0.97, -R * 0.15); ctx.quadraticCurveTo(-R * 1.0, -R * 1.1, 0, -R * 1.08); ctx.quadraticCurveTo(R * 1.0, -R * 1.1, R * 0.97, -R * 0.15);
    if (e === 'franja') { ctx.lineTo(R * 0.8, -R * 0.4); for (var k = 0; k < 5; k++) ctx.lineTo(R * 0.6 - k * R * 0.3, (k % 2 ? -R * 0.45 : -R * 0.3)); ctx.lineTo(-R * 0.8, -R * 0.4); }
    else if (e === 'curto') { ctx.quadraticCurveTo(R * 0.5, -R * 0.55, 0, -R * 0.5); ctx.quadraticCurveTo(-R * 0.5, -R * 0.55, -R * 0.97, -R * 0.15); }
    else { ctx.quadraticCurveTo(R * 0.3, -R * 0.45, -R * 0.2, -R * 0.5); ctx.quadraticCurveTo(-R * 0.7, -R * 0.45, -R * 0.97, -R * 0.15); }   // mecha de lado
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-R * 0.35, -R * 0.75, R * 0.3, R * 0.12, -0.3, 0, 6.2832); ctx.fill();
  }
  function elmo(ctx, R) {
    ctx.fillStyle = '#cfd8dc'; ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-R * 1.02, R * 0.1); ctx.quadraticCurveTo(-R * 1.05, -R * 1.15, 0, -R * 1.15); ctx.quadraticCurveTo(R * 1.05, -R * 1.15, R * 1.02, R * 0.1); ctx.lineTo(R * 0.85, R * 0.1); ctx.quadraticCurveTo(R * 0.85, -R * 0.75, 0, -R * 0.8); ctx.quadraticCurveTo(-R * 0.85, -R * 0.75, -R * 0.85, R * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#90a4ae'; ctx.fillRect(-R * 0.08, -R * 1.1, R * 0.16, R * 0.5);
    ctx.fillStyle = ROSA; ctx.beginPath(); ctx.moveTo(-R * 0.1, -R * 1.1); ctx.quadraticCurveTo(0, -R * 1.6, R * 0.5, -R * 1.3); ctx.quadraticCurveTo(R * 0.2, -R * 1.25, R * 0.1, -R * 1.1); ctx.fill();
  }
  function chapeuMago(ctx, R, cor) {
    ctx.fillStyle = cor; ctx.strokeStyle = tom(cor, 0.6); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -R * 0.75, R * 1.35, R * 0.28, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-R * 0.8, -R * 0.78); ctx.quadraticCurveTo(-R * 0.2, -R * 1.7, R * 0.35, -R * 2.1); ctx.quadraticCurveTo(R * 0.3, -R * 1.5, R * 0.8, -R * 0.78); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = OURO; [[-0.3, -1.2], [0.15, -1.55], [0.3, -1.0]].forEach(function (p) { ctx.beginPath(); ctx.arc(p[0] * R, p[1] * R, R * 0.07, 0, 6.2832); ctx.fill(); });
  }
  function robo(ctx, cfg, R) {
    var g = ctx.createLinearGradient(-R, -R, R, R); g.addColorStop(0, '#eceff1'); g.addColorStop(1, '#90a4ae');
    ctx.fillStyle = g; ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 2; arred(ctx, -R * 0.95, -R * 0.9, R * 1.9, R * 1.8, R * 0.3); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#263238'; arred(ctx, -R * 0.7, -R * 0.45, R * 1.4, R * 0.75, R * 0.15); ctx.fill();
    ctx.fillStyle = cfg.cor; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * R * 0.35, -R * 0.08, R * 0.18, 0, 6.2832); ctx.fill(); }); ctx.fillStyle = '#fff'; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * R * 0.35 - R * 0.05, -R * 0.14, R * 0.06, 0, 6.2832); ctx.fill(); });
    ctx.strokeStyle = cfg.cor; ctx.lineWidth = R * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.35, R * 0.5); ctx.lineTo(R * 0.35, R * 0.5); ctx.stroke();
    ctx.strokeStyle = '#546e7a'; ctx.lineWidth = R * 0.08; ctx.beginPath(); ctx.moveTo(0, -R * 0.9); ctx.lineTo(0, -R * 1.25); ctx.stroke(); ctx.fillStyle = ROSA; ctx.beginPath(); ctx.arc(0, -R * 1.32, R * 0.12, 0, 6.2832); ctx.fill();
    [-1, 1].forEach(function (s) { ctx.fillStyle = '#90a4ae'; arred(ctx, s * R * 1.0 - R * 0.12, -R * 0.3, R * 0.24, R * 0.5, R * 0.08); ctx.fill(); });
  }
  /* boneco de pano: cabeça de juta com costura, olhos de botão e zíper sorridente */
  function pano(ctx, cfg, R, ts) {
    ctx.fillStyle = '#c9a26b'; ctx.strokeStyle = '#8d6e3f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, R * 0.98, R * 1.02, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; for (var i = -8; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-R, i * R * 0.13); ctx.lineTo(R, i * R * 0.13); ctx.moveTo(i * R * 0.13, -R); ctx.lineTo(i * R * 0.13, R); ctx.stroke(); } ctx.restore();
    costura(ctx, 0, -R * 1.0, 0, -R * 0.35, '#5d4037');
    [-1, 1].forEach(function (s) { ctx.fillStyle = ESCURO; ctx.beginPath(); ctx.arc(s * R * 0.38, -R * 0.05, R * 0.2, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * R * 0.32, -R * 0.12, R * 0.07, 0, 6.2832); ctx.fill(); ctx.strokeStyle = '#8d6e3f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s * R * 0.38, -R * 0.05, R * 0.23, 0, 6.2832); ctx.stroke(); });
    ctx.strokeStyle = '#263238'; ctx.lineWidth = R * 0.09; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-R * 0.4, R * 0.42); ctx.quadraticCurveTo(0, R * 0.75, R * 0.4, R * 0.42); ctx.stroke();
    ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = R * 0.05; ctx.setLineDash([R * 0.05, R * 0.06]); ctx.beginPath(); ctx.moveTo(-R * 0.38, R * 0.43); ctx.quadraticCurveTo(0, R * 0.74, R * 0.38, R * 0.43); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.arc(R * 0.42, R * 0.4, R * 0.07, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgba(255,110,150,.3)'; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s * R * 0.55, R * 0.3, R * 0.18, R * 0.12, 0, 0, 6.2832); ctx.fill(); });
  }
  function figura(ctx, cfg, hs) {
    var fig = root.Figuras.porId(cfg.cabeca) || root.Figuras.lista()[0], img = root.Desenho && root.Desenho.imagem ? root.Desenho.imagem(fig, hs / 2.3) : null;
    if (img) ctx.drawImage(img, -hs / 2, -hs / 2, hs, hs); else { ctx.fillStyle = fig.suco || '#fff'; ctx.beginPath(); ctx.arc(0, 0, hs / 2.3, 0, 6.2832); ctx.fill(); }
  }
  function acessorio(ctx, cfg, hs) {
    var a = cfg.acessorio, R = hs / 2; if (!a || a === 'nenhum' || a === 'asas') return;
    ctx.save();
    if (a === 'laco') { ctx.translate(-R * 0.55, -R * 0.75); ctx.fillStyle = ROSA; ctx.strokeStyle = tom(ROSA, 0.7); ctx.lineWidth = 1.5; [[-1, -0.5], [1, 0.5]].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s[0] * R * 0.2, 0, R * 0.22, R * 0.13, s[1], 0, 6.2832); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = tom(ROSA, 0.8); ctx.beginPath(); ctx.arc(0, 0, R * 0.08, 0, 6.2832); ctx.fill(); }
    else if (a === 'coroa') { ctx.translate(0, -R * 0.95); ctx.fillStyle = OURO; ctx.strokeStyle = '#c98a00'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-R * 0.5, R * 0.15); ctx.lineTo(-R * 0.5, -R * 0.3); ctx.lineTo(-R * 0.25, -R * 0.05); ctx.lineTo(0, -R * 0.4); ctx.lineTo(R * 0.25, -R * 0.05); ctx.lineTo(R * 0.5, -R * 0.3); ctx.lineTo(R * 0.5, R * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = ROSA; ctx.beginPath(); ctx.arc(0, -R * 0.05, R * 0.07, 0, 6.2832); ctx.fill(); ctx.fillStyle = CIANO; ctx.beginPath(); ctx.arc(-R * 0.3, R * 0.02, R * 0.05, 0, 6.2832); ctx.arc(R * 0.3, R * 0.02, R * 0.05, 0, 6.2832); ctx.fill(); }
    else if (a === 'tiara') { ctx.strokeStyle = OURO; ctx.lineWidth = R * 0.06; ctx.beginPath(); ctx.arc(0, -R * 0.05, R * 0.98, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.fillStyle = CIANO; ctx.beginPath(); ctx.arc(0, -R * 1.0, R * 0.1, 0, 6.2832); ctx.fill(); }
    else if (a === 'oculos') { ctx.strokeStyle = ESCURO; ctx.lineWidth = Math.max(2, R * 0.06); ctx.fillStyle = 'rgba(62,232,255,.3)'; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * R * 0.36, R * 0.02, R * 0.3, 0, 6.2832); ctx.fill(); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(-R * 0.06, R * 0.02); ctx.lineTo(R * 0.06, R * 0.02); ctx.moveTo(-R * 0.66, 0); ctx.lineTo(-R * 0.95, -R * 0.1); ctx.moveTo(R * 0.66, 0); ctx.lineTo(R * 0.95, -R * 0.1); ctx.stroke(); }
    else if (a === 'chapeu') { ctx.translate(0, -R * 0.9); ctx.fillStyle = '#8e5bff'; ctx.beginPath(); ctx.moveTo(-R * 0.45, R * 0.1); ctx.lineTo(0, -R * 0.9); ctx.lineTo(R * 0.45, R * 0.1); ctx.closePath(); ctx.fill(); ctx.fillStyle = OURO; ctx.beginPath(); ctx.arc(0, -R * 0.9, R * 0.12, 0, 6.2832); ctx.fill(); ctx.fillStyle = '#fff'; [[-0.2, -0.2], [0.1, -0.45], [0.15, -0.05]].forEach(function (q) { ctx.beginPath(); ctx.arc(q[0] * R, q[1] * R, R * 0.05, 0, 6.2832); ctx.fill(); }); }
    else if (a === 'bone') { ctx.translate(0, -R * 0.62); ctx.fillStyle = cfg.cor; ctx.strokeStyle = tom(cfg.cor, 0.6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, R * 0.95, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(R * 0.75, R * 0.02, R * 0.6, R * 0.14, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -R * 0.95, R * 0.08, 0, 6.2832); ctx.fill(); }
    else if (a === 'flor') { ctx.translate(R * 0.72, -R * 0.7); ctx.fillStyle = '#ff6f91'; for (var k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k * 1.2566) * R * 0.16, Math.sin(k * 1.2566) * R * 0.16, R * 0.13, R * 0.09, k * 1.2566, 0, 6.2832); ctx.fill(); } ctx.fillStyle = OURO; ctx.beginPath(); ctx.arc(0, 0, R * 0.09, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }

  /* ================= MARIONETE (esqueleto por IA: 13 pontos no palco) ================= */
  function marionete(ctx, cfg, P, ts) {
    cfg = normalizar(cfg);
    var cor = cfg.cor, escuro = tom(cor, 0.72);
    var L = Math.max(8, Math.min(34, Math.hypot(P[1].x - P[7].x, P[1].y - P[7].y) * 0.16));
    var hs = Math.max(70, Math.min(230, Math.hypot(P[2].x - P[1].x, P[2].y - P[1].y) * 1.4));
    var cx = (P[1].x + P[2].x) / 2, cy = (P[1].y + P[2].y) / 2, A = hs * 2.5;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (cfg.acessorio === 'asas') { ctx.save(); ctx.translate(cx, cy); asas(ctx, A, 0, ts); ctx.restore(); }
    if (cfg.roupa === 'capa') { ctx.save(); ctx.translate(cx, cy); capa(ctx, A, -4, cor, 0); ctx.restore(); }
    var corPerna = cfg.roupa === 'macacao' ? cor : (cfg.roupa === 'vestido' ? cfg.pele : '#2e2a5a');
    [[7, 9, 11], [8, 10, 12]].forEach(function (seg) { ctx.strokeStyle = corPerna; ctx.lineWidth = L * 1.5; ctx.beginPath(); ctx.moveTo(P[seg[0]].x, P[seg[0]].y); ctx.lineTo(P[seg[1]].x, P[seg[1]].y); ctx.lineTo(P[seg[2]].x, P[seg[2]].y); ctx.stroke(); ctx.fillStyle = cfg.sapato; ctx.beginPath(); ctx.ellipse(P[seg[2]].x, P[seg[2]].y + L * 0.4, L * 1.3, L * 0.75, 0, 0, 6.2832); ctx.fill(); });
    // tronco entre ombros e quadris (vestido alarga embaixo)
    var ex = cfg.roupa === 'vestido' ? L * 1.8 : L * 0.5, ey = cfg.roupa === 'vestido' ? L * 1.6 : L * 0.2;
    ctx.fillStyle = cfg.roupa === 'armadura' ? '#cfd8dc' : cor; ctx.strokeStyle = cfg.roupa === 'armadura' ? '#546e7a' : escuro; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(P[1].x - L * 0.4, P[1].y - L * 0.2); ctx.lineTo(P[2].x + L * 0.4, P[2].y - L * 0.2); ctx.lineTo(P[8].x + ex, P[8].y + ey); ctx.lineTo(P[7].x - ex, P[7].y + ey); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (cfg.roupa === 'macacao') { ctx.fillStyle = escuro; [1, 2].forEach(function (i) { ctx.beginPath(); ctx.arc(P[i].x, P[i].y + L * 0.5, L * 0.35, 0, 6.2832); ctx.fill(); }); }
    if (cfg.roupa === 'tunica') { ctx.strokeStyle = OURO; ctx.lineWidth = 3; var hy = (P[7].y + P[8].y) / 2 - L * 0.6; ctx.beginPath(); ctx.moveTo(P[7].x - L * 0.6, hy); ctx.lineTo(P[8].x + L * 0.6, hy); ctx.stroke(); }
    costura(ctx, cx, cy + L, (P[7].x + P[8].x) / 2, (P[7].y + P[8].y) / 2, escuro);
    [[1, 3, 5], [2, 4, 6]].forEach(function (seg) {
      ctx.strokeStyle = cfg.roupa === 'armadura' ? '#b0bec5' : cor; ctx.lineWidth = L * 1.4; ctx.beginPath(); ctx.moveTo(P[seg[0]].x, P[seg[0]].y); ctx.lineTo(P[seg[1]].x, P[seg[1]].y); ctx.stroke();
      ctx.strokeStyle = cfg.pele; ctx.lineWidth = L; ctx.beginPath(); ctx.moveTo(P[seg[1]].x, P[seg[1]].y); ctx.lineTo(P[seg[2]].x, P[seg[2]].y); ctx.stroke();
      ctx.fillStyle = cfg.pele; ctx.beginPath(); ctx.arc(P[seg[2]].x, P[seg[2]].y, L * 0.95, 0, 6.2832); ctx.fill();
    });
    var ang = Math.atan2(P[2].y - P[1].y, P[2].x - P[1].x);
    ctx.save(); ctx.translate(P[0].x, P[0].y - hs * 0.08); ctx.rotate(ang * 0.5); cabeca(ctx, cfg, hs, ts); ctx.restore();
    ctx.restore();
  }

  return { corpoEmPe: corpoEmPe, cabeca: cabeca, marionete: marionete, normalizar: normalizar, CABECAS: CABECAS, CABELOS: CABELOS, ROUPAS: ROUPAS, ACESSORIOS: ACESSORIOS, PADRAO: PADRAO };
});
