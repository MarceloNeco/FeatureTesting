/* Bagunçolândia — cenários desenhados (SVG vetorial, leve) para o ambiente "Paisagem + boneco".
   Cada cena: id, nome PT/EN, chão (y do chão em 0..1 do palco), céu (cor para o fundo do canvas) e o svg
   (viewBox 0 0 1280 720), rasterizado uma vez pelo desenho.js. Sem imagens de fora. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Cenas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var CHAO = 0.86;
  function svg(defs, corpo) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs>' + defs + '</defs>' + corpo + '</svg>'; }
  function nuvem(x, y, s, cor) { cor = cor || '#fff'; return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" fill="' + cor + '" opacity=".95"><ellipse cx="0" cy="0" rx="60" ry="28"/><ellipse cx="-40" cy="8" rx="40" ry="22"/><ellipse cx="45" cy="6" rx="45" ry="24"/><ellipse cx="5" cy="-18" rx="38" ry="24"/></g>'; }
  function arvore(x, y, s, copa, tronco) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-14" y="-10" width="28" height="90" rx="8" fill="' + (tronco || '#8d5524') + '"/><circle cx="0" cy="-60" r="70" fill="' + copa + '"/><circle cx="-50" cy="-30" r="48" fill="' + copa + '"/><circle cx="50" cy="-30" r="48" fill="' + copa + '"/><circle cx="-20" cy="-90" r="40" fill="' + copa + '" opacity=".9"/><circle cx="25" cy="-85" r="36" fill="#fff" opacity=".12"/></g>'; }
  function flor(x, y, cor) { return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-2" y="0" width="4" height="26" fill="#4caf50"/><circle cx="0" cy="-6" r="7" fill="' + cor + '"/><circle cx="-8" cy="0" r="7" fill="' + cor + '"/><circle cx="8" cy="0" r="7" fill="' + cor + '"/><circle cx="-5" cy="8" r="7" fill="' + cor + '"/><circle cx="5" cy="8" r="7" fill="' + cor + '"/><circle cx="0" cy="2" r="5" fill="#ffd166"/></g>'; }

  var C = [];
  C.push({ id: 'praia', nome: { pt: 'Praia', en: 'Beach' }, chao: CHAO, ceu: '#8fd7ff',
    svg: svg('<linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fb3ff"/><stop offset="1" stop-color="#bdeaff"/></linearGradient><linearGradient id="mar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fa2d6"/><stop offset="1" stop-color="#0d6fa8"/></linearGradient><linearGradient id="areia" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe8a8"/><stop offset="1" stop-color="#f0c674"/></linearGradient>',
      '<rect width="1280" height="720" fill="url(#ceu)"/><circle cx="1080" cy="120" r="70" fill="#fff176"/><circle cx="1080" cy="120" r="95" fill="#fff176" opacity=".25"/>' + nuvem(220, 110, 1.2) + nuvem(620, 70, 0.8) + nuvem(900, 170, 1) +
      '<rect y="420" width="1280" height="220" fill="url(#mar)"/><g fill="#fff" opacity=".5"><path d="M0 450 q40 -12 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 v6 h-1280z"/><path d="M0 520 q50 -14 100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 t100 0 v5 h-1280z" opacity=".6"/></g>' +
      '<path d="M0 560 Q320 530 640 575 T1280 560 V720 H0z" fill="url(#areia)"/><path d="M0 600 Q400 585 800 610 T1280 600 V720 H0z" fill="#ffd98c" opacity=".7"/>' +
      '<g transform="translate(180 600)"><path d="M0 0 q-10 -90 30 -160" stroke="#a0683d" stroke-width="16" fill="none" stroke-linecap="round"/><g fill="#3fbf4a"><path d="M30 -160 q-70 -40 -120 10 q60 -10 120 -10z"/><path d="M30 -160 q70 -40 120 10 q-60 -10 -120 -10z"/><path d="M30 -160 q-40 -70 -20 -120 q30 60 20 120z"/><path d="M30 -160 q40 -70 20 -120 q-30 60 -20 120z"/></g><circle cx="22" cy="-150" r="8" fill="#8d5524"/><circle cx="40" cy="-146" r="8" fill="#8d5524"/></g>' +
      '<g transform="translate(1060 600)"><rect x="-4" y="-150" width="8" height="150" fill="#f3f3f3"/><path d="M-110 -140 a110 60 0 0 1 220 0z" fill="#ff4fa3"/><path d="M-110 -140 a110 60 0 0 1 220 0z" fill="#fff" opacity=".0"/><g fill="#fff"><path d="M-110 -140 a110 60 0 0 1 55 -52 q-15 26 -15 52z"/><path d="M0 -200 a110 60 0 0 1 55 8 q-30 20 -40 52 l-15 0 q0 -34 0 -60z"/></g></g>' +
      '<g fill="#fff" opacity=".9"><ellipse cx="420" cy="640" rx="18" ry="8"/><ellipse cx="760" cy="660" rx="14" ry="6"/></g><circle cx="640" cy="650" r="22" fill="#ff7a00"/><path d="M640 650 m-22 0 a22 22 0 0 1 44 0" fill="#fff" opacity=".35"/>') });

  C.push({ id: 'floresta', nome: { pt: 'Floresta', en: 'Forest' }, chao: CHAO, ceu: '#bfe9ff',
    svg: svg('<linearGradient id="ceu2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ccfff"/><stop offset="1" stop-color="#d6f3ff"/></linearGradient><linearGradient id="grama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8bd450"/><stop offset="1" stop-color="#4f9d2f"/></linearGradient>',
      '<rect width="1280" height="720" fill="url(#ceu2)"/><circle cx="200" cy="130" r="60" fill="#fff59d"/>' + nuvem(500, 120, 1) + nuvem(1000, 90, 1.3) +
      '<ellipse cx="300" cy="600" rx="500" ry="180" fill="#7bc67a"/><ellipse cx="1000" cy="620" rx="520" ry="200" fill="#6ab868"/>' +
      arvore(120, 560, 1.1, '#3f9b3f') + arvore(1150, 540, 1.3, '#2e8b57') + arvore(380, 520, 0.7, '#4caf50') + arvore(900, 530, 0.8, '#43a047') +
      '<path d="M0 600 Q320 570 640 605 T1280 598 V720 H0z" fill="url(#grama)"/>' +
      '<g fill="#5aa832"><path d="M80 610 l6 -22 l6 22z M96 612 l5 -16 l5 16z M560 618 l6 -22 l6 22z M580 620 l5 -16 l5 16z M1010 614 l6 -22 l6 22z"/></g>' +
      flor(240, 630, '#ff4fa3') + flor(700, 650, '#ffd166') + flor(1180, 640, '#ff6f91') + flor(470, 660, '#b388ff') +
      '<g transform="translate(820 640)"><rect x="-8" y="-20" width="16" height="30" rx="6" fill="#fff8e1"/><path d="M-30 -20 a30 22 0 0 1 60 0z" fill="#e53935"/><circle cx="-12" cy="-30" r="4" fill="#fff"/><circle cx="10" cy="-26" r="3" fill="#fff"/></g>') });

  C.push({ id: 'espaco', nome: { pt: 'Espaço', en: 'Space' }, chao: CHAO, ceu: '#0b0a1f',
    svg: svg('<radialGradient id="lua" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#e0e0e0"/><stop offset="1" stop-color="#8d8d9a"/></radialGradient><radialGradient id="pl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffb74d"/><stop offset="1" stop-color="#c2410c"/></radialGradient>',
      '<rect width="1280" height="720" fill="#0b0a1f"/><g fill="#fff">' + [[60, 80, 2], [200, 200, 1.5], [330, 60, 2.5], [480, 160, 1.5], [700, 40, 2], [820, 220, 1.5], [980, 90, 2.5], [1150, 180, 1.5], [1240, 40, 2], [560, 300, 1.2], [1050, 320, 1.6], [150, 340, 1.4], [900, 380, 1.3]].map(function (s) { return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '"/>'; }).join('') + '</g>' +
      '<circle cx="1040" cy="150" r="80" fill="url(#pl)"/><ellipse cx="1040" cy="150" rx="130" ry="26" fill="none" stroke="#ffd166" stroke-width="10" opacity=".8" transform="rotate(-18 1040 150)"/>' +
      '<circle cx="260" cy="170" r="48" fill="#3ee8ff" opacity=".85"/><circle cx="245" cy="155" r="10" fill="#fff" opacity=".4"/>' +
      '<g transform="translate(600 150) rotate(30)"><path d="M0 -60 q30 0 30 60 v40 h-60 v-40 q0 -60 30 -60z" fill="#eceff1"/><circle cx="0" cy="-10" r="12" fill="#3ee8ff"/><path d="M-30 20 l-20 30 h20z M30 20 l20 30 h-20z" fill="#ff4fa3"/><path d="M-12 40 h24 l-12 40z" fill="#ff7a00"/><path d="M-6 40 h12 l-6 24z" fill="#fff176"/></g>' +
      '<ellipse cx="640" cy="760" rx="900" ry="180" fill="url(#lua)"/><g fill="#6f6f80" opacity=".8"><ellipse cx="300" cy="650" rx="50" ry="18"/><ellipse cx="900" cy="670" rx="70" ry="22"/><ellipse cx="620" cy="690" rx="40" ry="14"/></g><g fill="#fff" opacity=".2"><ellipse cx="290" cy="645" rx="30" ry="9"/><ellipse cx="885" cy="663" rx="40" ry="11"/></g>') });

  C.push({ id: 'cidade', nome: { pt: 'Cidade', en: 'City' }, chao: CHAO, ceu: '#ffb37a',
    svg: svg('<linearGradient id="ceu4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3fa0"/><stop offset=".55" stop-color="#ff7eb3"/><stop offset="1" stop-color="#ffcf7a"/></linearGradient><linearGradient id="rua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a5e"/><stop offset="1" stop-color="#2b2b3a"/></linearGradient>',
      '<rect width="1280" height="720" fill="url(#ceu4)"/><circle cx="640" cy="440" r="110" fill="#ffd166" opacity=".9"/>' + nuvem(260, 150, 1, '#ffd6ea') + nuvem(1000, 110, 1.2, '#ffe3f0') +
      '<g fill="#3b2a6e">' + [[0, 300, 120], [130, 220, 100], [240, 340, 80], [330, 180, 140], [480, 280, 110], [600, 360, 90], [700, 240, 120], [830, 320, 100], [940, 160, 150], [1100, 300, 90], [1200, 230, 80]].map(function (b) { return '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + (620 - b[1]) + '"/>'; }).join('') + '</g>' +
      '<g fill="#ffd166" opacity=".85">' + (function () { var o = ''; [[0, 300, 120], [130, 220, 100], [330, 180, 140], [480, 280, 110], [700, 240, 120], [830, 320, 100], [940, 160, 150], [1100, 300, 90], [1200, 230, 80]].forEach(function (b) { for (var y = b[1] + 20; y < 580; y += 36) for (var x = b[0] + 14; x < b[0] + b[2] - 14; x += 30) if ((x * 7 + y * 3) % 5 !== 0) o += '<rect x="' + x + '" y="' + y + '" width="12" height="16" rx="2"/>'; }); return o; })() + '</g>' +
      '<rect y="600" width="1280" height="120" fill="url(#rua)"/><g stroke="#fff" stroke-width="6" stroke-dasharray="40 30" opacity=".8"><path d="M0 660 H1280"/></g>' +
      '<g transform="translate(200 600)"><rect x="-4" y="-170" width="8" height="170" fill="#263238"/><circle cx="0" cy="-178" r="14" fill="#fff59d"/><circle cx="0" cy="-178" r="30" fill="#fff59d" opacity=".25"/></g><g transform="translate(1080 600)"><rect x="-4" y="-170" width="8" height="170" fill="#263238"/><circle cx="0" cy="-178" r="14" fill="#fff59d"/><circle cx="0" cy="-178" r="30" fill="#fff59d" opacity=".25"/></g>') });

  var cache = {};
  function lista() { return C; }
  function porId(id) { return C.filter(function (c) { return c.id === id; })[0] || null; }
  function sortear(exceto) { var l = C.filter(function (c) { return c.id !== exceto; }); return l[Math.floor(Math.random() * l.length)]; }
  function rasterizar(cena, w, h) {
    var k = cena.id + '@' + w; if (cache[k]) return cache[k];
    cache[k] = new Promise(function (ok) {
      var img = new Image();
      img.onload = function () { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); ok(c); };
      img.onerror = function () { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.fillStyle = cena.ceu; x.fillRect(0, 0, w, h); ok(c); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cena.svg);
    });
    return cache[k];
  }
  return { lista: lista, porId: porId, sortear: sortear, rasterizar: rasterizar, CHAO: CHAO };
});
