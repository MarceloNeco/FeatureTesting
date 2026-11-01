/* Vruuum! — personagens de DOMÍNIO PÚBLICO, desenhados aqui (nada copiado de filme, série ou desenho
   animado): podem ser pilotos escolhidos na garagem e rivais na corrida.
   Personagens de empresas (Mario, Sonic, Disney, DreamWorks, filmes) NÃO podem entrar: têm dono.
   Origem de cada um no campo "origem" e no CREDITOS.md. Cada personagem tem frente (virou para olhar)
   e costas (olhando a estrada), desenhados num círculo de raio r em volta de (x, y). */
(function (raiz) {
  'use strict';
  function circ(c, x, y, r, cor) { c.fillStyle = cor; c.beginPath(); c.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2); c.fill(); }
  function elipse(c, x, y, rx, ry, cor, rot) { c.fillStyle = cor; c.beginPath(); if (c.ellipse) c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot || 0, 0, Math.PI * 2); else c.arc(x, y, rx, 0, Math.PI * 2); c.fill(); }
  function poli(c, pts, cor) { c.fillStyle = cor; c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
  function rosto(c, x, y, r, pele, op) {   // rosto simples e simpático: olhos, bochechas, sorriso
    op = op || {};
    circ(c, x, y, r, pele);
    circ(c, x - r * 0.35, y - r * 0.08, r * 0.11, '#1b1b22'); circ(c, x + r * 0.35, y - r * 0.08, r * 0.11, '#1b1b22');
    circ(c, x - r * 0.32, y - r * 0.12, r * 0.04, '#fff'); circ(c, x + r * 0.38, y - r * 0.12, r * 0.04, '#fff');
    if (!op.semBochecha) { circ(c, x - r * 0.55, y + r * 0.22, r * 0.14, 'rgba(255,90,120,.35)'); circ(c, x + r * 0.55, y + r * 0.22, r * 0.14, 'rgba(255,90,120,.35)'); }
    c.strokeStyle = op.boca || '#7a2a2a'; c.lineWidth = Math.max(1, r * 0.08); c.lineCap = 'round';
    c.beginPath(); c.arc(x, y + r * 0.18, r * 0.32, 0.25 * Math.PI, 0.75 * Math.PI); c.stroke();
  }
  var PELE = '#f2c9a0', MORENA = '#8a5a3c';

  var LISTA = [
    { id: 'emilia', nome: ['Emília', 'Emília'], origem: 'Monteiro Lobato, Sítio do Picapau Amarelo (domínio público no Brasil desde 2019)', cor: '#ff4f81',
      frente: function (c, x, y, r) { circ(c, x, y - r * 0.1, r * 1.05, '#1b1b22'); [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.95, y + r * 0.45, r * 0.22, r * 0.5, '#1b1b22'); circ(c, x + l * r * 0.95, y + r * 0.95, r * 0.18, '#e63946'); }); rosto(c, x, y + r * 0.08, r * 0.82, '#ffd9c2'); circ(c, x + r * 0.55, y - r * 0.85, r * 0.22, '#e63946'); circ(c, x + r * 0.85, y - r * 0.75, r * 0.2, '#e63946'); },
      costas: function (c, x, y, r) { [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.95, y + r * 0.45, r * 0.22, r * 0.5, '#1b1b22'); circ(c, x + l * r * 0.95, y + r * 0.95, r * 0.18, '#e63946'); }); circ(c, x, y, r, '#1b1b22'); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = r * 0.08; for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * r * 0.25, y - r * 0.9); c.lineTo(x + k * r * 0.3, y + r * 0.8); c.stroke(); } circ(c, x + r * 0.55, y - r * 0.85, r * 0.22, '#e63946'); circ(c, x + r * 0.85, y - r * 0.75, r * 0.2, '#e63946'); } },
    { id: 'visconde', nome: ['Visconde', 'Viscount'], origem: 'Monteiro Lobato, Sítio do Picapau Amarelo (domínio público no Brasil desde 2019)', cor: '#ffd166',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.1, r * 0.78, r * 0.95, '#f2c94c'); c.fillStyle = 'rgba(180,130,20,.5)'; for (var i = -2; i <= 2; i++) for (var k = -2; k <= 3; k++) circ(c, x + i * r * 0.28, y + k * r * 0.3, r * 0.08, 'rgba(180,130,20,.45)'); rosto(c, x, y + r * 0.1, r * 0.55, 'rgba(0,0,0,0)', { semBochecha: true }); c.fillStyle = '#1b1b22'; c.fillRect(x - r * 0.8, y - r * 0.82, r * 1.6, r * 0.14); c.fillRect(x - r * 0.5, y - r * 1.5, r * 1.0, r * 0.72); c.fillStyle = '#e63946'; c.fillRect(x - r * 0.5, y - r * 0.98, r * 1.0, r * 0.12); },
      costas: function (c, x, y, r) { elipse(c, x, y + r * 0.1, r * 0.78, r * 0.95, '#e8bc3c'); for (var i = -2; i <= 2; i++) for (var k = -2; k <= 3; k++) circ(c, x + i * r * 0.28, y + k * r * 0.3, r * 0.08, 'rgba(180,130,20,.45)'); c.fillStyle = '#1b1b22'; c.fillRect(x - r * 0.8, y - r * 0.82, r * 1.6, r * 0.14); c.fillRect(x - r * 0.5, y - r * 1.5, r * 1.0, r * 0.72); } },
    { id: 'saci', nome: ['Saci', 'Saci'], origem: 'folclore brasileiro', cor: '#e63946',
      frente: function (c, x, y, r) { rosto(c, x, y, r * 0.9, MORENA, { boca: '#fff' }); poli(c, [x - r * 0.95, y - r * 0.35, x + r * 0.95, y - r * 0.35, x + r * 0.2, y - r * 1.6], '#e63946'); circ(c, x + r * 0.2, y - r * 1.6, r * 0.12, '#e63946'); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.9, '#1b1b22'); poli(c, [x - r * 0.95, y - r * 0.35, x + r * 0.95, y - r * 0.35, x + r * 0.2, y - r * 1.6], '#e63946'); circ(c, x + r * 0.2, y - r * 1.6, r * 0.12, '#e63946'); } },
    { id: 'cuca', nome: ['Cuca', 'Cuca'], origem: 'folclore brasileiro (e Monteiro Lobato)', cor: '#4cc35a',
      frente: function (c, x, y, r) { circ(c, x, y - r * 0.2, r * 1.0, '#ffd166'); elipse(c, x, y + r * 0.35, r * 0.75, r * 0.55, '#4cc35a'); elipse(c, x, y - r * 0.05, r * 0.7, r * 0.6, '#5bd36a'); circ(c, x - r * 0.3, y - r * 0.25, r * 0.15, '#fff'); circ(c, x + r * 0.3, y - r * 0.25, r * 0.15, '#fff'); circ(c, x - r * 0.3, y - r * 0.25, r * 0.07, '#1b1b22'); circ(c, x + r * 0.3, y - r * 0.25, r * 0.07, '#1b1b22'); c.strokeStyle = '#2e7d32'; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(x - r * 0.5, y + r * 0.45); c.quadraticCurveTo(x, y + r * 0.65, x + r * 0.5, y + r * 0.45); c.stroke(); [-0.3, 0, 0.3].forEach(function (d) { poli(c, [x + d * r - r * 0.06, y + r * 0.5, x + d * r + r * 0.06, y + r * 0.5, x + d * r, y + r * 0.62], '#fff'); }); },
      costas: function (c, x, y, r) { circ(c, x, y, r, '#ffd166'); c.strokeStyle = '#e8b33f'; c.lineWidth = r * 0.08; for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * r * 0.25, y - r * 0.9); c.quadraticCurveTo(x + k * r * 0.35, y, x + k * r * 0.2, y + r * 0.9); c.stroke(); } } },
    { id: 'curupira', nome: ['Curupira', 'Curupira'], origem: 'folclore brasileiro', cor: '#ff7b00',
      frente: function (c, x, y, r) { [-0.7, -0.35, 0, 0.35, 0.7].forEach(function (d, k) { poli(c, [x + d * r - r * 0.25, y - r * 0.4, x + d * r + r * 0.25, y - r * 0.4, x + d * r + (k % 2 ? 0.1 : -0.1) * r, y - r * (1.45 + (k % 2) * 0.25)], k % 2 ? '#ffb703' : '#ff5a1f'); }); rosto(c, x, y + r * 0.05, r * 0.85, '#c98a5a'); },
      costas: function (c, x, y, r) { [-0.7, -0.35, 0, 0.35, 0.7].forEach(function (d, k) { poli(c, [x + d * r - r * 0.25, y - r * 0.4, x + d * r + r * 0.25, y - r * 0.4, x + d * r + (k % 2 ? 0.1 : -0.1) * r, y - r * (1.45 + (k % 2) * 0.25)], k % 2 ? '#ffb703' : '#ff5a1f'); }); circ(c, x, y + r * 0.05, r * 0.88, '#ff5a1f'); } },
    { id: 'iara', nome: ['Iara', 'Iara'], origem: 'folclore brasileiro', cor: '#2ec4b6',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.4, r * 1.1, r * 1.3, '#1b8a7a'); rosto(c, x, y, r * 0.78, '#e8b48a'); circ(c, x - r * 0.75, y - r * 0.6, r * 0.2, '#ffc6e6'); },
      costas: function (c, x, y, r) { elipse(c, x, y + r * 0.4, r * 1.1, r * 1.3, '#1b8a7a'); c.strokeStyle = 'rgba(160,255,240,.25)'; c.lineWidth = r * 0.08; for (var k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * r * 0.2, y - r * 0.8); c.quadraticCurveTo(x + k * r * 0.4, y + r * 0.4, x + k * r * 0.25, y + r * 1.6); c.stroke(); } circ(c, x - r * 0.75, y - r * 0.6, r * 0.2, '#ffc6e6'); } },
    { id: 'chapeuzinho', nome: ['Chapeuzinho', 'Little Red'], origem: 'conto popular (Perrault, irmãos Grimm)', cor: '#d62828',
      frente: function (c, x, y, r) { circ(c, x, y, r * 1.12, '#d62828'); circ(c, x, y + r * 0.08, r * 0.82, '#8a1c1c'); rosto(c, x, y + r * 0.12, r * 0.72, PELE); c.fillStyle = '#7a4b1e'; c.beginPath(); c.arc(x, y - r * 0.15, r * 0.72, Math.PI * 1.05, Math.PI * 1.95); c.fill(); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 1.12, '#d62828'); poli(c, [x - r * 0.3, y + r * 0.6, x + r * 0.3, y + r * 0.6, x, y + r * 1.4], '#b71c1c'); } },
    { id: 'pinoquio', nome: ['Pinóquio', 'Pinocchio'], origem: 'Carlo Collodi, As Aventuras de Pinóquio (1883)', cor: '#c98a50',
      frente: function (c, x, y, r) { rosto(c, x, y, r * 0.85, '#e8b47a', { semBochecha: false }); poli(c, [x, y - r * 0.02, x + r * 1.15, y + r * 0.08, x, y + r * 0.16], '#d99a5a'); poli(c, [x - r * 0.8, y - r * 0.55, x + r * 0.8, y - r * 0.55, x + r * 0.1, y - r * 1.7], '#ffffff'); c.fillStyle = '#5a3a1e'; c.fillRect(x - r * 0.85, y - r * 0.6, r * 1.7, r * 0.12); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.88, '#5a3a1e'); poli(c, [x - r * 0.8, y - r * 0.55, x + r * 0.8, y - r * 0.55, x + r * 0.1, y - r * 1.7], '#ffffff'); } },
    { id: 'alice', nome: ['Alice', 'Alice'], origem: 'Lewis Carroll, Alice no País das Maravilhas (1865)', cor: '#4ea8de',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.3, r * 1.08, r * 1.2, '#f6d365'); rosto(c, x, y + r * 0.05, r * 0.78, PELE); c.strokeStyle = '#1b1b22'; c.lineWidth = r * 0.14; c.beginPath(); c.arc(x, y + r * 0.05, r * 0.86, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); },
      costas: function (c, x, y, r) { elipse(c, x, y + r * 0.3, r * 1.08, r * 1.2, '#f6d365'); c.strokeStyle = '#1b1b22'; c.lineWidth = r * 0.14; c.beginPath(); c.arc(x, y + r * 0.05, r * 0.86, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = r * 0.06; for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * r * 0.25, y - r * 0.5); c.lineTo(x + k * r * 0.35, y + r * 1.3); c.stroke(); } } },
    { id: 'robin', nome: ['Robin Hood', 'Robin Hood'], origem: 'lenda inglesa', cor: '#2d6a4f',
      frente: function (c, x, y, r) { rosto(c, x, y + r * 0.08, r * 0.85, PELE); poli(c, [x - r * 1.0, y - r * 0.35, x + r * 1.05, y - r * 0.5, x + r * 0.2, y - r * 1.25], '#2d6a4f'); poli(c, [x + r * 0.5, y - r * 0.7, x + r * 1.3, y - r * 1.5, x + r * 0.7, y - r * 0.6], '#e63946'); },
      costas: function (c, x, y, r) { circ(c, x, y + r * 0.08, r * 0.86, '#7a4b1e'); poli(c, [x - r * 1.0, y - r * 0.35, x + r * 1.05, y - r * 0.5, x + r * 0.2, y - r * 1.25], '#2d6a4f'); poli(c, [x + r * 0.5, y - r * 0.7, x + r * 1.3, y - r * 1.5, x + r * 0.7, y - r * 0.6], '#e63946'); } },
    { id: 'sherlock', nome: ['Sherlock', 'Sherlock'], origem: 'Arthur Conan Doyle (domínio público)', cor: '#8d6e63',
      frente: function (c, x, y, r) { rosto(c, x, y + r * 0.1, r * 0.85, PELE); elipse(c, x, y - r * 0.5, r * 0.95, r * 0.55, '#8d6e63'); c.strokeStyle = 'rgba(60,40,30,.4)'; c.lineWidth = r * 0.05; for (var k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * r * 0.25, y - r * 1.0); c.lineTo(x + k * r * 0.25, y - r * 0.05); c.stroke(); } elipse(c, x, y - r * 0.25, r * 1.1, r * 0.14, '#6d4c41'); },
      costas: function (c, x, y, r) { circ(c, x, y + r * 0.1, r * 0.86, '#4e342e'); elipse(c, x, y - r * 0.4, r * 0.98, r * 0.62, '#8d6e63'); c.strokeStyle = 'rgba(60,40,30,.4)'; c.lineWidth = r * 0.05; for (var k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * r * 0.25, y - r * 1.0); c.lineTo(x + k * r * 0.25, y + r * 0.1); c.stroke(); } elipse(c, x, y + r * 0.25, r * 0.5, r * 0.18, '#6d4c41'); } },
    { id: 'noel', nome: ['Papai Noel', 'Santa'], origem: 'tradição popular', cor: '#e63946',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.45, r * 0.95, r * 0.75, '#ffffff'); rosto(c, x, y - r * 0.05, r * 0.7, PELE); elipse(c, x, y + r * 0.25, r * 0.5, r * 0.16, '#ffffff'); poli(c, [x - r * 0.85, y - r * 0.5, x + r * 0.85, y - r * 0.5, x + r * 0.7, y - r * 1.5], '#e63946'); elipse(c, x, y - r * 0.5, r * 0.95, r * 0.18, '#ffffff'); circ(c, x + r * 0.75, y - r * 1.5, r * 0.18, '#ffffff'); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.88, '#eeeeee'); poli(c, [x - r * 0.85, y - r * 0.5, x + r * 0.85, y - r * 0.5, x + r * 0.7, y - r * 1.5], '#e63946'); elipse(c, x, y - r * 0.5, r * 0.95, r * 0.18, '#ffffff'); circ(c, x + r * 0.75, y - r * 1.5, r * 0.18, '#ffffff'); } }
  ];
  function achar(id) { for (var k = 0; k < LISTA.length; k++) if (LISTA[k].id === id) return LISTA[k]; return null; }
  // sorteia n personagens diferentes, fora os já escolhidos pelos jogadores
  function sortear(n, fora, aleatorio) {
    var r = aleatorio || Math.random, livres = LISTA.filter(function (p) { return (fora || []).indexOf(p.id) < 0; }).slice();
    for (var i = livres.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = livres[i]; livres[i] = livres[j]; livres[j] = t; }
    return livres.slice(0, n);
  }

  var VruuumPersonagens = { LISTA: LISTA, achar: achar, sortear: sortear };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumPersonagens;
  else raiz.VruuumPersonagens = VruuumPersonagens;
})(this);
