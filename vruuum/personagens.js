/* Vruuum! — personagens de DOMÍNIO PÚBLICO ou de LICENÇA LIVRE (com crédito), desenhados aqui (nada copiado de filme, série ou desenho
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
  // enfeites usados por vários personagens
  function coroa(c, x, y, l, cor) { poli(c, [x - l, y + l * 0.3, x - l, y - l * 0.25, x - l * 0.5, y + l * 0.05, x, y - l * 0.45, x + l * 0.5, y + l * 0.05, x + l, y - l * 0.25, x + l, y + l * 0.3], cor); }
  function fios(c, x, y, r, cor) { c.strokeStyle = cor; c.lineWidth = r * 0.07; c.lineCap = 'round'; for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * r * 0.22, y - r * 0.85); c.quadraticCurveTo(x + k * r * 0.32, y, x + k * r * 0.2, y + r * 0.85); c.stroke(); } }
  function ondas(c, x, y, r, cor) { c.strokeStyle = cor; c.lineWidth = r * 0.07; c.lineCap = 'round'; for (var k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * r * 0.2, y - r * 0.8); c.bezierCurveTo(x + k * r * 0.2 + r * 0.15, y - r * 0.2, x + k * r * 0.2 - r * 0.15, y + r * 0.5, x + k * r * 0.25, y + r * 1.4); c.stroke(); } }
  function tranca(c, x, y, r, cor) { for (var k = 0; k < 6; k++) elipse(c, x + (k % 2 ? -1 : 1) * r * 0.06, y + k * r * 0.3, r * 0.2, r * 0.2, k % 2 ? cor : '#e8b53a'); circ(c, x, y + r * 1.85, r * 0.1, '#ff8fab'); }
  function florzinha(c, x, y, rr, cor) { for (var k = 0; k < 5; k++) circ(c, x + Math.cos(k * 1.257) * rr * 0.7, y + Math.sin(k * 1.257) * rr * 0.7, rr * 0.55, cor); circ(c, x, y, rr * 0.45, '#ffd166'); }
  function concha(c, x, y, l) { elipse(c, x, y, l, l * 0.62, '#ff8fab'); c.strokeStyle = '#d64f7a'; c.lineWidth = l * 0.1; for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x, y + l * 0.55); c.lineTo(x + k * l * 0.4, y - l * 0.5); c.stroke(); } }
  function gorro(c, x, y, r) { poli(c, [x - r * 0.98, y - r * 0.32, x + r * 0.98, y - r * 0.46, x + r * 0.35, y - r * 1.4], '#2a9d3a'); poli(c, [x + r * 0.45, y - r * 0.8, x + r * 1.3, y - r * 1.45, x + r * 0.62, y - r * 0.68], '#e63946'); }
  function turbante(c, x, y, r) { elipse(c, x, y - r * 0.52, r * 1.0, r * 0.55, '#fdfdfd'); elipse(c, x, y - r * 0.7, r * 0.85, r * 0.14, '#e4e4ee', -0.08); elipse(c, x, y - r * 0.42, r * 0.92, r * 0.13, '#e4e4ee', 0.06); circ(c, x, y - r * 0.6, r * 0.14, '#e63946'); poli(c, [x - r * 0.06, y - r * 0.68, x + r * 0.06, y - r * 0.68, x + r * 0.25, y - r * 1.35], '#7b2cbf'); }
  function palha(c, x, y, r) { c.strokeStyle = '#f2c94c'; c.lineWidth = r * 0.07; c.lineCap = 'round'; for (var k = 0; k < 9; k++) { var a = Math.PI * (0.15 + k * 0.09); c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); c.lineTo(x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 1.15); c.stroke(); } }
  function chapeuPalha(c, x, y, r) { elipse(c, x, y - r * 0.6, r * 1.2, r * 0.22, '#7a5230'); poli(c, [x - r * 0.55, y - r * 0.62, x + r * 0.55, y - r * 0.62, x + r * 0.4, y - r * 1.25, x - r * 0.45, y - r * 1.2], '#8b5e34'); }
  function orelhas(c, x, y, r) { [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.4, y - r * 1.15, r * 0.24, r * 0.72, '#d9d9e2', l * 0.12); elipse(c, x + l * r * 0.4, y - r * 1.12, r * 0.12, r * 0.55, '#ffc2d4', l * 0.12); }); }
  function chapeuBruxa(c, x, y, r) { poli(c, [x - r * 0.62, y - r * 0.6, x + r * 0.62, y - r * 0.6, x + r * 0.55, y - r * 1.75], '#3b1f4f'); elipse(c, x, y - r * 0.58, r * 1.28, r * 0.24, '#3b1f4f'); elipse(c, x, y - r * 0.62, r * 0.6, r * 0.08, '#e9c46a'); }


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
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.88, '#eeeeee'); poli(c, [x - r * 0.85, y - r * 0.5, x + r * 0.85, y - r * 0.5, x + r * 0.7, y - r * 1.5], '#e63946'); elipse(c, x, y - r * 0.5, r * 0.95, r * 0.18, '#ffffff'); circ(c, x + r * 0.75, y - r * 1.5, r * 0.18, '#ffffff'); } },
    // ---- 1.6.0: mais famosos que podem entrar. Contos de fadas (domínio público; desenhos próprios, sem copiar
    // filme nenhum), O Mágico de Oz (1900, domínio público) e mascotes/desenhos de licença livre (com crédito) ----
    { id: 'branca', nome: ['Branca de Neve', 'Snow White'], origem: 'conto popular (irmãos Grimm, 1812); desenho próprio', cor: '#e63946',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.3, r * 1.05, r * 1.25, '#15131a'); rosto(c, x, y + r * 0.1, r * 0.76, '#ffe9e0', { boca: '#d62828' }); coroa(c, x, y - r * 0.72, r * 0.5, '#ffd166'); circ(c, x + r * 0.78, y - r * 0.42, r * 0.2, '#e63946'); elipse(c, x + r * 0.86, y - r * 0.64, r * 0.08, r * 0.04, '#2a9d3a', 0.5); },
      costas: function (c, x, y, r) { elipse(c, x, y + r * 0.3, r * 1.05, r * 1.25, '#15131a'); fios(c, x, y, r, 'rgba(255,255,255,.12)'); coroa(c, x, y - r * 0.72, r * 0.5, '#ffd166'); circ(c, x + r * 0.78, y - r * 0.42, r * 0.2, '#e63946'); } },
    { id: 'cinderela', nome: ['Cinderela', 'Cinderella'], origem: 'conto popular (Perrault, 1697); desenho próprio', cor: '#8ecae6',
      frente: function (c, x, y, r) { circ(c, x, y - r * 0.92, r * 0.42, '#f4d35e'); circ(c, x, y, r * 0.96, '#f4d35e'); rosto(c, x, y + r * 0.14, r * 0.74, PELE); coroa(c, x, y - r * 0.7, r * 0.55, '#dfe7f2'); circ(c, x, y - r * 0.86, r * 0.09, '#4ea8de'); },
      costas: function (c, x, y, r) { circ(c, x, y - r * 0.92, r * 0.42, '#f4d35e'); circ(c, x, y, r * 0.96, '#f4d35e'); fios(c, x, y, r, 'rgba(160,110,20,.35)'); coroa(c, x, y - r * 0.7, r * 0.55, '#dfe7f2'); } },
    { id: 'rapunzel', nome: ['Rapunzel', 'Rapunzel'], origem: 'conto popular (irmãos Grimm, 1812); desenho próprio', cor: '#b388eb',
      frente: function (c, x, y, r) { tranca(c, x + r * 0.78, y + r * 0.25, r, '#f6c445'); circ(c, x, y, r * 0.96, '#f6c445'); rosto(c, x, y + r * 0.12, r * 0.76, PELE); florzinha(c, x - r * 0.62, y - r * 0.62, r * 0.16, '#ff8fab'); florzinha(c, x + r * 0.5, y - r * 0.78, r * 0.13, '#b388eb'); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.96, '#f6c445'); fios(c, x, y, r, 'rgba(170,110,0,.35)'); tranca(c, x, y + r * 0.5, r, '#f6c445'); florzinha(c, x - r * 0.4, y - r * 0.55, r * 0.16, '#ff8fab'); florzinha(c, x + r * 0.35, y - r * 0.2, r * 0.13, '#b388eb'); } },
    { id: 'sereia', nome: ['Pequena Sereia', 'Little Mermaid'], origem: 'Hans Christian Andersen (1837); desenho próprio', cor: '#1fb5a6',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.35, r * 1.12, r * 1.3, '#1fb5a6'); rosto(c, x, y + r * 0.1, r * 0.75, PELE); concha(c, x, y - r * 0.86, r * 0.32); },
      costas: function (c, x, y, r) { elipse(c, x, y + r * 0.35, r * 1.12, r * 1.3, '#1fb5a6'); ondas(c, x, y, r, 'rgba(180,255,245,.3)'); concha(c, x, y - r * 0.86, r * 0.32); } },
    { id: 'peterpan', nome: ['Peter Pan', 'Peter Pan'], origem: 'J. M. Barrie (1904/1911), domínio público no Brasil; desenho próprio', cor: '#2a9d3a',
      frente: function (c, x, y, r) { circ(c, x, y, r * 0.93, '#c1440e'); rosto(c, x, y + r * 0.1, r * 0.8, PELE); gorro(c, x, y, r); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.93, '#c1440e'); fios(c, x, y, r, 'rgba(0,0,0,.18)'); gorro(c, x, y, r); } },
    { id: 'aladim', nome: ['Aladim', 'Aladdin'], origem: 'As Mil e Uma Noites (conto popular); desenho próprio', cor: '#7b2cbf',
      frente: function (c, x, y, r) { circ(c, x, y + r * 0.05, r * 0.9, '#15131a'); rosto(c, x, y + r * 0.14, r * 0.78, '#c68a5a'); turbante(c, x, y, r); },
      costas: function (c, x, y, r) { circ(c, x, y + r * 0.05, r * 0.9, '#15131a'); turbante(c, x, y, r); } },
    { id: 'dorothy', nome: ['Dorothy', 'Dorothy'], origem: 'L. Frank Baum, O Mágico de Oz (1900); desenho próprio', cor: '#3a86ff',
      frente: function (c, x, y, r) { [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.92, y + r * 0.62, r * 0.2, r * 0.55, '#6b3e26'); circ(c, x + l * r * 0.92, y + r * 1.15, r * 0.16, '#3a86ff'); }); circ(c, x, y, r * 0.93, '#6b3e26'); rosto(c, x, y + r * 0.12, r * 0.76, PELE); },
      costas: function (c, x, y, r) { [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.92, y + r * 0.62, r * 0.2, r * 0.55, '#6b3e26'); circ(c, x + l * r * 0.92, y + r * 1.15, r * 0.16, '#3a86ff'); }); circ(c, x, y, r * 0.93, '#6b3e26'); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(x, y - r * 0.9); c.lineTo(x, y + r * 0.6); c.stroke(); } },
    { id: 'espantalho', nome: ['Espantalho', 'Scarecrow'], origem: 'L. Frank Baum, O Mágico de Oz (1900); desenho próprio', cor: '#e9c46a',
      frente: function (c, x, y, r) { palha(c, x, y, r); circ(c, x, y + r * 0.05, r * 0.88, '#d9b77a'); circ(c, x - r * 0.32, y - r * 0.05, r * 0.11, '#1b1b22'); circ(c, x + r * 0.32, y - r * 0.05, r * 0.11, '#1b1b22'); c.strokeStyle = '#5a3d1e'; c.lineWidth = r * 0.06; c.setLineDash && c.setLineDash([r * 0.1, r * 0.07]); c.beginPath(); c.arc(x, y + r * 0.15, r * 0.4, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke(); c.setLineDash && c.setLineDash([]); chapeuPalha(c, x, y, r); },
      costas: function (c, x, y, r) { palha(c, x, y, r); circ(c, x, y + r * 0.05, r * 0.88, '#cfa96a'); chapeuPalha(c, x, y, r); } },
    { id: 'tux', nome: ['Tux', 'Tux'], origem: 'mascote do Linux, de Larry Ewing (feito com o GIMP): uso livre com crédito; desenho próprio', cor: '#ffb703',
      frente: function (c, x, y, r) { circ(c, x, y, r * 0.95, '#16161c'); elipse(c, x, y + r * 0.22, r * 0.64, r * 0.62, '#ffffff'); [-1, 1].forEach(function (l) { elipse(c, x + l * r * 0.24, y - r * 0.22, r * 0.17, r * 0.22, '#ffffff'); circ(c, x + l * r * 0.2, y - r * 0.2, r * 0.08, '#16161c'); }); elipse(c, x, y + r * 0.12, r * 0.34, r * 0.15, '#f4a300'); elipse(c, x, y + r * 0.2, r * 0.26, r * 0.08, '#e08a00'); },
      costas: function (c, x, y, r) { circ(c, x, y, r * 0.95, '#16161c'); elipse(c, x - r * 0.3, y - r * 0.4, r * 0.25, r * 0.15, 'rgba(255,255,255,.12)', -0.5); } },
    { id: 'bunny', nome: ['Big Buck Bunny', 'Big Buck Bunny'], origem: 'Big Buck Bunny, Blender Foundation (2008), CC BY 3.0, www.bigbuckbunny.org; desenho próprio', cor: '#a8dadc',
      frente: function (c, x, y, r) { orelhas(c, x, y, r); circ(c, x, y + r * 0.05, r * 0.98, '#e4e4ec'); elipse(c, x, y + r * 0.42, r * 0.62, r * 0.42, '#ffffff'); [-1, 1].forEach(function (l) { circ(c, x + l * r * 0.34, y - r * 0.12, r * 0.13, '#1b1b22'); circ(c, x + l * r * 0.3, y - r * 0.16, r * 0.04, '#fff'); }); elipse(c, x, y + r * 0.2, r * 0.13, r * 0.09, '#ff8fab'); c.fillStyle = '#ffffff'; c.fillRect(x - r * 0.1, y + r * 0.42, r * 0.2, r * 0.18); c.strokeStyle = '#ccc'; c.lineWidth = r * 0.02; c.strokeRect(x - r * 0.1, y + r * 0.42, r * 0.2, r * 0.18); },
      costas: function (c, x, y, r) { orelhas(c, x, y, r); circ(c, x, y + r * 0.05, r * 0.98, '#d6d6e0'); } },
    { id: 'pepper', nome: ['Pepper', 'Pepper'], origem: 'Pepper&Carrot, de David Revoy, CC BY 4.0, www.peppercarrot.com; desenho próprio', cor: '#d9480f',
      frente: function (c, x, y, r) { elipse(c, x, y + r * 0.2, r * 1.0, r * 1.05, '#d9480f'); rosto(c, x, y + r * 0.14, r * 0.74, PELE); chapeuBruxa(c, x, y, r); },
      costas: function (c, x, y, r) { elipse(c, x + r * 0.15, y + r * 0.95, r * 0.3, r * 0.5, '#c43d0a', 0.3); elipse(c, x, y + r * 0.2, r * 1.0, r * 1.05, '#d9480f'); fios(c, x, y, r, 'rgba(0,0,0,.15)'); chapeuBruxa(c, x, y, r); } }

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
