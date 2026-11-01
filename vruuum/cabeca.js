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
  function ombros(c, x, y, r, camisa) { elipse(c, x, y + r * 1.55, r * 1.5, r * 0.85, 0, camisa); }

  // ---------- de costas ----------
  function costas(c, x, y, s, piloto, foto, camisa, pers) {
    var r = s / 2;
    ombros(c, x, y, r, camisa);
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
  function frente(c, x, y, s, piloto, foto, camisa, sorriso, pers) {
    var r = s / 2;
    ombros(c, x, y, r, camisa);
    if (pers) pers.frente(c, x, y, r);
    else if (foto && foto.img) {
      c.save(); c.beginPath(); c.arc(x, y, r * 1.02, 0, Math.PI * 2); c.clip();
      c.drawImage(foto.img, x - r * 1.02, y - r * 1.02, r * 2.04, r * 2.04); c.restore();
      c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(x, y, r * 1.02, 0, Math.PI * 2); c.stroke();
    } else {
      c.font = Math.round(s * 1.08) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(piloto, x, y + s * 0.04);
    }
    if (sorriso > 0) {   // brilhinho do sorriso
      c.globalAlpha = Math.min(1, sorriso);
      var bx = x + r * 1.05, by = y - r * 0.85, br = r * 0.32 * (0.8 + Math.sin(sorriso * 9) * 0.2);
      c.fillStyle = '#fff3a0'; c.beginPath(); c.moveTo(bx, by - br); c.lineTo(bx + br * 0.3, by - br * 0.3); c.lineTo(bx + br, by); c.lineTo(bx + br * 0.3, by + br * 0.3); c.lineTo(bx, by + br); c.lineTo(bx - br * 0.3, by + br * 0.3); c.lineTo(bx - br, by); c.lineTo(bx - br * 0.3, by - br * 0.3); c.closePath(); c.fill();
      c.globalAlpha = 1;
    }
  }

  // de tempos em tempos (periodo, em s) vira para trás por 2 s: gira, sorri, gira de volta
  function estado(t, semente, periodo) {
    var dur = 2, local = ((t + semente) % periodo + periodo) % periodo;
    if (local > dur) return { frente: false, sx: 1, sorriso: 0 };
    var p = local / dur;
    if (p < 0.15) return { frente: false, sx: 1 - p / 0.15, sorriso: 0 };
    if (p < 0.25) return { frente: true, sx: (p - 0.15) / 0.1, sorriso: 0 };
    if (p < 0.75) return { frente: true, sx: 1, sorriso: (p - 0.25) / 0.5 * 2 };
    if (p < 0.85) return { frente: true, sx: 1 - (p - 0.75) / 0.1, sorriso: 0 };
    return { frente: false, sx: (p - 0.85) / 0.15, sorriso: 0 };
  }

  function caminho(c, jan, x0, y0, W, H) {
    c.beginPath();
    if (jan.elipse) { var e = jan.elipse; if (c.ellipse) c.ellipse(x0 + e[0] * W, y0 + e[1] * H, e[2] * W, e[3] * H, 0, 0, Math.PI * 2); else c.arc(x0 + e[0] * W, y0 + e[1] * H, e[2] * W, 0, Math.PI * 2); return; }
    var p = jan.poli; c.moveTo(x0 + p[0] * W, y0 + p[1] * H);
    for (var k = 2; k < p.length; k += 2) c.lineTo(x0 + p[k] * W, y0 + p[k + 1] * H);
    c.closePath();
  }

  /* desenha o piloto do veículo v num retângulo (x0, y0, W, H) já na tela.
     info: { emoji, foto, cor }; t: tempo em s; semente: desencontra os jogadores; periodo: de quanto em quanto tempo vira. */
  function desenhar(c, v, x0, y0, W, H, info, t, semente, periodo) {
    if (!v || !v.cab || !v.janela || W < 6) return;
    var e = estado(t, semente || 0, periodo || 7), cx = x0 + v.cab[0] * W, cy = y0 + v.cab[1] * H, s = v.cab[2] * H;
    var camisa = info.camisa || '#3a2f73';
    c.save();
    caminho(c, v.janela, x0, y0, W, H); c.clip();
    if (v.capacete && !e.frente) { c.restore(); return; }   // de costas, o capacete (no desenho do veículo) já é a nuca
    if (v.capacete) { circ(c, cx, cy, s * 0.5, 'rgba(20,20,30,.88)'); s *= 0.8; }   // viseira aberta
    c.translate(cx, cy); c.scale(Math.max(0.04, e.sx), 1);
    if (e.frente) frente(c, 0, 0, s, info.emoji, info.foto, camisa, e.sorriso, info.personagem);
    else costas(c, 0, 0, s, info.emoji, info.foto, camisa, info.personagem);
    c.restore();
    if (!v.capacete) {   // reflexo do vidro por cima
      c.save(); caminho(c, v.janela, x0, y0, W, H); c.clip();
      c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(x0 + W * 0.3, y0); c.lineTo(x0 + W * 0.42, y0); c.lineTo(x0 + W * 0.3, y0 + H * 0.6); c.lineTo(x0 + W * 0.2, y0 + H * 0.6); c.fill();
      c.restore();
    }
  }

  var VruuumCabeca = { desenhar: desenhar, estado: estado, PERFIS: PERFIS };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumCabeca;
  else raiz.VruuumCabeca = VruuumCabeca;
})(this);
