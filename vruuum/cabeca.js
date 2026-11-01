/* Vruuum! — o piloto dentro do veículo. Fica de COSTAS (nuca, orelhas, pelo ou cabelo), olhando a
   estrada; de vez em quando vira para trás, olha para quem está jogando e sorri, e volta.
   O piloto é um bichinho (emoji) ou o rosto da criança (selfie recortada, só no aparelho: ver
   selfie.js). De costas, a selfie vira um cabelo da cor tirada da própria foto.
   É desenhado por cima do veículo, recortado pela janela (ou dentro do capacete, no kart e na moto). */
(function (raiz) {
  'use strict';
  var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  // como cada bichinho é visto de trás
  var PERFIS = {
    '🐱': { pelo: '#f4a340', orelha: 'ponta', escuro: '#d9822b', listras: true },
    '🐶': { pelo: '#c98a50', orelha: 'caida', escuro: '#8a5a2e' },
    '🦄': { pelo: '#fbf7ff', orelha: 'ponta', escuro: '#e6dcf5', chifre: true, crina: ['#ff7ac6', '#9b5de5', '#3ee8ff'] },
    '🐼': { pelo: '#ffffff', orelha: 'redonda', escuro: '#222222' },
    '🐸': { pelo: '#6cc04a', orelha: 'olhos', escuro: '#4e9a33' },
    '🐰': { pelo: '#f4f4f4', orelha: 'longa', escuro: '#e2d8dc' },
    '🦊': { pelo: '#f0832a', orelha: 'ponta', escuro: '#3a2a20' },
    '🐯': { pelo: '#f5a623', orelha: 'redonda', escuro: '#222222', listras: true }
  };

  function circ(c, x, y, r, cor) { c.fillStyle = cor; c.beginPath(); c.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); c.fill(); }
  function elipse(c, x, y, rx, ry, rot, cor) { c.fillStyle = cor; c.beginPath(); if (c.ellipse) c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot || 0, 0, Math.PI * 2); else c.arc(x, y, rx, 0, Math.PI * 2); c.fill(); }
  function bola(c, x, y, r, cor, escuro) {   // esfera com luz de cima
    var g = c.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r);
    g.addColorStop(0, cor); g.addColorStop(1, escuro || cor);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  }

  // ---------- de costas ----------
  function costas(c, x, y, s, piloto, foto, camisa, pers) {
    var r = s / 2;
    if (pers) { pers.costas(c, x, y, r); return; }   // personagem de domínio público (personagens.js)
    if (foto) {   // a criança de costas: cabelo da cor da foto e orelhinhas da cor da pele
      elipse(c, x - r * 0.97, y + r * 0.08, r * 0.2, r * 0.28, 0, foto.pele);
      elipse(c, x + r * 0.97, y + r * 0.08, r * 0.2, r * 0.28, 0, foto.pele);
      bola(c, x, y - r * 0.04, r * 1.02, foto.cabelo, foto.cabeloEscuro || foto.cabelo);
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = Math.max(1, r * 0.06);
      for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * r * 0.22, y - r * 0.9); c.quadraticCurveTo(x + k * r * 0.3, y, x + k * r * 0.18, y + r * 0.8); c.stroke(); }
      return;
    }
    var p = PERFIS[piloto] || PERFIS['🐱'];
    if (p.orelha === 'ponta') [-1, 1].forEach(function (l) { c.fillStyle = p.pelo; c.beginPath(); c.moveTo(x + l * r * 0.25, y - r * 0.8); c.lineTo(x + l * r * 0.85, y - r * 1.35); c.lineTo(x + l * r * 0.95, y - r * 0.3); c.fill(); c.fillStyle = p.escuro; c.beginPath(); c.moveTo(x + l * r * 0.75, y - r * 1.2); c.lineTo(x + l * r * 0.85, y - r * 1.35); c.lineTo(x + l * r * 0.88, y - r * 1.05); c.fill(); });
    if (p.orelha === 'redonda') [-1, 1].forEach(function (l) { circ(c, x + l * r * 0.72, y - r * 0.72, r * 0.36, p.escuro); });
    if (p.orelha === 'olhos') [-1, 1].forEach(function (l) { bola(c, x + l * r * 0.45, y - r * 0.78, r * 0.38, p.pelo, p.escuro); });
    if (p.orelha === 'longa') [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.36, y - r * 1.35, r * 0.24, r * 0.78, l * 0.12, p.pelo); elipse(c, x + l * r * 0.36, y - r * 1.35, r * 0.24, r * 0.78, l * 0.12, 'rgba(0,0,0,.05)'); });
    if (p.chifre) { c.fillStyle = '#ffd166'; c.beginPath(); c.moveTo(x - r * 0.12, y - r * 0.85); c.lineTo(x, y - r * 1.5); c.lineTo(x + r * 0.12, y - r * 0.85); c.fill(); }
    bola(c, x, y, r, p.pelo, p.escuro === '#222222' ? '#d9d9d9' : p.escuro);
    if (p.orelha === 'caida') [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.92, y + r * 0.05, r * 0.3, r * 0.62, l * -0.25, p.escuro); });
    if (p.listras) { c.strokeStyle = p.escuro; c.lineWidth = Math.max(1, r * 0.12); c.lineCap = 'round'; [-0.35, 0, 0.35].forEach(function (d) { c.beginPath(); c.moveTo(x + d * r, y - r * 0.85); c.lineTo(x + d * r * 1.1, y - r * 0.35); c.stroke(); }); }
    if (p.crina) p.crina.forEach(function (cor, k) { c.strokeStyle = cor; c.lineWidth = Math.max(1.5, r * 0.2); c.lineCap = 'round'; c.beginPath(); c.moveTo(x + (k - 1) * r * 0.2, y - r * 0.8); c.quadraticCurveTo(x + (k - 1) * r * 0.45, y, x + (k - 1) * r * 0.25, y + r * 1.0); c.stroke(); });
  }

  // ---------- de frente (virou para olhar e sorrir) ----------
  function frente(c, x, y, s, piloto, foto, pers) {
    var r = s / 2;
    if (pers) pers.frente(c, x, y, r);
    else if (foto && foto.img) {
      c.save(); c.beginPath(); c.arc(x, y, r * 1.02, 0, Math.PI * 2); c.clip();
      c.drawImage(foto.img, x - r * 1.02, y - r * 1.02, r * 2.04, r * 2.04); c.restore();   // sem aro: no giro ele virava uma risca
    } else {
      c.font = Math.round(s * 1.08) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(piloto, x, y + s * 0.04);
    }
  }
  function brilhinho(c, x, y, r, sorriso) {   // brilho do sorriso
    c.globalAlpha = Math.min(1, sorriso);
    var bx = x + r * 1.05, by = y - r * 0.85, br = r * 0.32 * (0.8 + Math.sin(sorriso * 9) * 0.2);
    c.fillStyle = '#fff3a0'; c.beginPath(); c.moveTo(bx, by - br); c.lineTo(bx + br * 0.3, by - br * 0.3); c.lineTo(bx + br, by); c.lineTo(bx + br * 0.3, by + br * 0.3); c.lineTo(bx, by + br); c.lineTo(bx - br * 0.3, by + br * 0.3); c.lineTo(bx - br, by); c.lineTo(bx - br * 0.3, by - br * 0.3); c.closePath(); c.fill();
    c.globalAlpha = 1;
  }

  // de tempos em tempos (periodo, em s) vira para trás por 2 s: a cabeça GIRA (em 3D) até ficar de frente,
  // sorri e gira de volta. giro: 0 = de costas; vai até ±GIRO_MAX (uns 130°): olha POR CIMA DO OMBRO, mostrando
  // o rosto de três quartos, como uma pessoa de verdade (180° com o corpo de costas fica esquisito, "de coruja").
  // Uma vez vira por um lado, na outra pelo outro.
  var GIRO_MAX = Math.PI * 0.72;
  function suave(x) { return x * x * (3 - 2 * x); }
  function estado(t, semente, periodo) {
    var dur = 2, tt = t + semente, local = (tt % periodo + periodo) % periodo, lado = Math.abs(Math.floor(tt / periodo)) % 2 ? -1 : 1;
    if (local > dur) return { giro: 0, frente: false, sorriso: 0 };
    var p = local / dur, a = p < 0.25 ? suave(p / 0.25) : p < 0.75 ? 1 : 1 - suave((p - 0.75) / 0.25);
    return { giro: lado * a * GIRO_MAX, frente: a > 0.5, sorriso: p >= 0.25 && p < 0.75 ? (p - 0.25) / 0.5 * 2 : 0 };
  }

  function caminho(c, jan, x0, y0, W, H) {
    c.beginPath();
    if (jan.elipse) { var e = jan.elipse; if (c.ellipse) c.ellipse(x0 + e[0] * W, y0 + e[1] * H, e[2] * W, e[3] * H, 0, 0, Math.PI * 2); else c.arc(x0 + e[0] * W, y0 + e[1] * H, e[2] * W, 0, Math.PI * 2); return; }
    var p = jan.poli; c.moveTo(x0 + p[0] * W, y0 + p[1] * H);
    for (var k = 2; k < p.length; k += 2) c.lineTo(x0 + p[k] * W, y0 + p[k + 1] * H);
    c.closePath();
  }

  // ---------- a cabeça em 3D ----------
  /* Cada lado da cabeça (costas e frente) é desenhado uma vez numa "pele" (textura) e guardado. Na hora do
     giro, a pele é colada numa esfera, ponto a ponto: cada ponto vai para onde estaria numa bola girando
     (o rosto entra pelo lado, encolhendo perto da borda; o que passa para trás some).
     O contorno continua redondo o tempo todo — nada de "folha de papel virando". Orelhas, chapéus e
     tranças (o que fica fora da bola) trocam suavemente de um lado para o outro. Luz e sombra ficam
     paradas por cima, como numa bola de verdade. */
  var TS = 192, R0 = TS / 2 / 1.9;
  var peles = {}, nPeles = 0, nFoto = 0, rascunho = null;
  function tela(w, h) { var cv = raiz.document.createElement('canvas'); cv.width = w; cv.height = h; return cv; }
  function idPiloto(info) {
    if (info.personagem) return 'p:' + info.personagem.id;
    if (info.foto) { if (!info.foto._vr) info.foto._vr = ++nFoto; return 'f:' + info.foto._vr; }
    return 'e:' + info.emoji;
  }
  function capaceteCostas(c, r, cor) {
    circ(c, 0, 0, r, cor);
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#ffffff'; c.fillRect(-r * 0.2, -r, r * 0.4, r * 2);
    c.restore();
    circ(c, -r * 0.35, -r * 0.45, r * 0.18, 'rgba(255,255,255,.5)');
  }
  function capaceteFrente(c, r, cor, rosto) {
    circ(c, 0, 0, r, cor);
    c.save(); c.beginPath(); if (c.ellipse) c.ellipse(0, r * 0.1, r * 0.78, r * 0.66, 0, 0, Math.PI * 2); else c.arc(0, r * 0.1, r * 0.72, 0, Math.PI * 2);
    c.fillStyle = '#14141e'; c.fill(); c.clip();
    c.drawImage(rosto, -TS * 0.4, -TS * 0.4 + r * 0.14, TS * 0.8, TS * 0.8);   // o rosto lá dentro, um pouco menor
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(-r * 0.7, -r * 0.3); c.lineTo(-r * 0.2, -r * 0.5); c.lineTo(-r * 0.5, r * 0.5); c.closePath(); c.fill();
    c.restore();
  }
  // pele de um lado ('costas' ou 'frente'); com capacete (cor), a pele é o capacete. null se a foto ainda não carregou
  function pele(info, lado, capCor) {
    var k = lado + '|' + idPiloto(info) + '|' + (capCor || '');
    if (peles[k]) return peles[k];
    if (info.foto && lado === 'frente' && !capCor && !(info.foto.img && info.foto.img.complete && info.foto.img.naturalWidth)) return null;
    var tudo = tela(TS, TS), c = tudo.getContext('2d');
    c.translate(TS / 2, TS / 2);
    if (capCor && lado === 'costas') capaceteCostas(c, R0, capCor);
    else if (capCor) { var rosto = pele(info, 'frente'); if (!rosto) return null; capaceteFrente(c, R0, capCor, rosto.tudo); }
    else if (lado === 'costas') costas(c, 0, 0, R0 * 2, info.emoji, info.foto, null, info.personagem);
    else frente(c, 0, 0, R0 * 2, info.emoji, info.foto, info.personagem);
    var dentro = tela(TS, TS), d = dentro.getContext('2d');   // só a bola
    d.beginPath(); d.arc(TS / 2, TS / 2, R0, 0, Math.PI * 2); d.clip(); d.drawImage(tudo, 0, 0);
    var fora = tela(TS, TS), f = fora.getContext('2d');   // só o que sai da bola (orelhas, chapéu...)
    f.drawImage(tudo, 0, 0); f.globalCompositeOperation = 'destination-out'; f.beginPath(); f.arc(TS / 2, TS / 2, R0 * 0.99, 0, Math.PI * 2); f.fill();
    if (++nPeles > 80) { peles = {}; nPeles = 1; }
    peles[k] = { tudo: tudo, dentro: dentro, fora: fora, dados: d.getImageData(0, 0, TS, TS).data };
    return peles[k];
  }
  // cola as duas peles numa esfera de raio r, girada de "giro", ponto a ponto (sem emendas): para cada
  // ponto da bola na tela, acha de que lugar da pele (costas ou frente) ele vem
  var bolaCv = null, bolaDados = null;
  function amostra(src, sx, sy, out, i, cob) {   // cor da pele em (sx, sy), misturando os 4 vizinhos
    var x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
    if (x0 < 0) { x0 = 0; fx = 0; } if (y0 < 0) { y0 = 0; fy = 0; } if (x0 > TS - 2) { x0 = TS - 2; fx = 1; } if (y0 > TS - 2) { y0 = TS - 2; fy = 1; }
    var a = (y0 * TS + x0) * 4, b = a + 4, c2 = a + TS * 4, d = c2 + 4;
    var wa = (1 - fx) * (1 - fy), wb = fx * (1 - fy), wc = (1 - fx) * fy, wd = fx * fy;
    var al = src[a + 3] * wa + src[b + 3] * wb + src[c2 + 3] * wc + src[d + 3] * wd;
    if (al < 0.5) return;
    for (var k = 0; k < 3; k++) out[i + k] = (src[a + k] * src[a + 3] * wa + src[b + k] * src[b + 3] * wb + src[c2 + k] * src[c2 + 3] * wc + src[d + k] * src[d + 3] * wd) / al;
    out[i + 3] = al * cob;
  }
  function bolaGirada(pc, pf, giro, r) {
    var N = Math.max(4, Math.ceil(r * 2) + 2), o = N / 2, PI = Math.PI;
    if (!bolaCv || bolaCv.width < N) { bolaCv = tela(Math.max(N, 48), Math.max(N, 48)); bolaDados = null; }
    var e = bolaCv.getContext('2d');
    if (!bolaDados || bolaDados.width !== N) bolaDados = e.createImageData(N, N);
    var out = bolaDados.data, dc = pc.dados, df = pf.dados, giroF = giro - (giro >= 0 ? PI : -PI);
    for (var q = 0; q < out.length; q++) out[q] = 0;
    for (var py = 0; py < N; py++) {
      var v = (py + 0.5 - o) / r; if (v <= -1 || v >= 1) continue;
      var cf = Math.sqrt(1 - v * v), sy = TS / 2 + v * R0 - 0.5;
      for (var px = 0; px < N; px++) {
        var x = (px + 0.5 - o) / r, dist = Math.sqrt(x * x + v * v), cob = Math.max(0, Math.min(1, (1 - dist) * r + 0.5));
        if (cob <= 0) continue;
        var lam = Math.asin(Math.max(-1, Math.min(1, x / cf))), l0 = lam - giro, src = dc;
        if (l0 > PI) l0 -= 2 * PI; else if (l0 < -PI) l0 += 2 * PI;
        if (l0 > PI / 2 || l0 < -PI / 2) { src = df; l0 = lam - giroF; if (l0 > PI) l0 -= 2 * PI; else if (l0 < -PI) l0 += 2 * PI; }
        amostra(src, TS / 2 + cf * Math.sin(l0) * R0 - 0.5, sy, out, (py * N + px) * 4, cob);
      }
    }
    e.putImageData(bolaDados, 0, 0);
    return N;
  }
  // desenha a cabeça inteira em (cx, cy), raio r, no giro dado
  function cabeca3d(c, cx, cy, r, pc, pf, giro, inclina, ombro) {
    var esc = r / R0, M = Math.ceil(TS * esc) + 4;
    if (!rascunho || rascunho.width < M) rascunho = tela(Math.max(M, 64), Math.max(M, 64));
    var s = rascunho.getContext('2d'), o = M / 2;
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1; s.clearRect(0, 0, M + 2, M + 2);
    var cg = Math.cos(giro), wc = Math.max(0, Math.min(1, (cg + 0.25) / 0.5)), lado = TS * esc;
    if (wc > 0) { s.globalAlpha = wc; s.drawImage(pc.fora, o - lado / 2, o - lado / 2, lado, lado); }
    if (wc < 1) { s.globalAlpha = 1 - wc; s.drawImage(pf.fora, o - lado / 2, o - lado / 2, lado, lado); }
    s.globalAlpha = 1;
    if (Math.abs(Math.sin(giro)) < 1e-3) { var pl = cg > 0 ? pc : pf; s.drawImage(pl.dentro, o - lado / 2, o - lado / 2, lado, lado); }   // parado: a pele direto
    else { var N = bolaGirada(pc, pf, giro, r); s.drawImage(bolaCv, 0, 0, N, N, o - N / 2, o - N / 2, N, N); }
    // luz parada (de cima, à esquerda) e sombra na borda: é isso que faz parecer uma bola girando
    s.globalCompositeOperation = 'source-atop';
    var g = s.createRadialGradient(o - r * 0.38, o - r * 0.45, r * 0.05, o, o, r * 1.02);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(0.8, 'rgba(0,0,0,.06)'); g.addColorStop(1, 'rgba(0,0,0,.32)');
    s.fillStyle = g; s.beginPath(); s.arc(o, o, r * 1.01, 0, Math.PI * 2); s.fill();
    s.globalCompositeOperation = 'source-over';
    var f = giro / GIRO_MAX;   // a cabeça vai um pouco para o lado do ombro e desce, como quem olha para trás
    c.save(); c.translate(cx + f * r * ombro, cy + Math.abs(f) * r * 0.06); c.rotate(f * 0.1 + (inclina || 0));
    c.drawImage(rascunho, 0, 0, M, M, -o, -o, M, M);
    c.restore();
  }

  /* desenha o piloto do veículo v num retângulo (x0, y0, W, H) já na tela.
     info: { emoji, foto, personagem, cor, camisa }; t: tempo em s; semente: desencontra os jogadores;
     periodo: de quanto em quanto tempo vira. Veículo com capacete (kart, moto): de costas o capacete do
     desenho já é a nuca; quando vira, o capacete inteiro gira e aparece o rosto pela viseira.
     Veículo "aberto" (skate): a cabeça fica no alto do corpo, sem janela, sem ombros, sem vidro. */
  function desenhar(c, v, x0, y0, W, H, info, t, semente, periodo) {
    if (!v || !v.cab || !v.janela || W < 6 || !raiz.document) return;
    var e = estado(t, semente || 0, periodo || 7), cx = x0 + v.cab[0] * W, cy = y0 + v.cab[1] * H, r = v.cab[2] * H / 2;
    if (v.capacete && !e.giro) return;   // de costas, o capacete do desenho já é a nuca
    var capCor = null;
    if (v.capacete) { var je = v.janela.elipse; cx = x0 + je[0] * W; cy = y0 + je[1] * H; r = je[2] * W; capCor = info.cor || '#ff7b00'; }
    var pc = pele(info, 'costas', capCor), pf = pele(info, 'frente', capCor) || pc;
    if (!pc) return;
    var inclina = e.sorriso > 0 ? Math.sin(e.sorriso * Math.PI) * 0.12 * (e.giro > 0 ? 1 : -1) : 0;   // inclina a cabeça ao sorrir
    c.save();
    if (!v.aberto) { caminho(c, v.janela, x0, y0, W, H); c.clip(); }
    if (!v.capacete && !v.aberto) {   // ombros: o corpo acompanha um pouco o giro
      var tw = 1 - 0.14 * Math.abs(Math.sin(e.giro));
      elipse(c, cx + Math.sin(e.giro) * r * 0.12, cy + r * 1.55, r * 1.5 * tw, r * 0.85, 0, info.camisa || '#3a2f73');
    }
    cabeca3d(c, cx, cy, r, pc, pf, e.giro, inclina, v.aberto ? 0.32 : v.capacete ? 0 : 0.14);
    c.restore();
    if (e.sorriso > 0) brilhinho(c, cx, cy, r, e.sorriso);
    if (!v.capacete && !v.aberto) {   // reflexo do vidro por cima
      c.save(); caminho(c, v.janela, x0, y0, W, H); c.clip();
      c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(x0 + W * 0.3, y0); c.lineTo(x0 + W * 0.42, y0); c.lineTo(x0 + W * 0.3, y0 + H * 0.6); c.lineTo(x0 + W * 0.2, y0 + H * 0.6); c.fill();
      c.restore();
    }
  }

  var VruuumCabeca = { desenhar: desenhar, estado: estado, PERFIS: PERFIS, GIRO_MAX: GIRO_MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumCabeca;
  else raiz.VruuumCabeca = VruuumCabeca;
})(this);
