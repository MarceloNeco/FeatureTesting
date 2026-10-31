/* Bagunçolândia — catálogo de figuras (SVG desenhado aqui, sem arte de terceiros).
   Cada figura: id, papel (fruta | doce | bola | heroi | vilao | poder), nome PT/EN, turma
   (propria | publica | minhas), raio no palco (px, em 1280×720), cor do "suco" ao cortar e o svg
   (viewBox 0 0 100 100). As suas imagens vêm de meus/personagens.json (ver LEIA-ME.md).
   Também roda no Node (só o catálogo); rasterizar() precisa de navegador. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Figuras = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- peças reutilizáveis ---------- */
  var defs = {};
  function grad(id, c1, c2, radial) {
    if (!defs[id]) defs[id] = radial
      ? '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>'
      : '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
    return 'url(#' + id + ')';
  }
  function svg(corpo, ids) {
    var d = (ids || []).map(function (k) { return defs[k]; }).join('');
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>' + d + '</defs>' + corpo + '</svg>';
  }
  var BRILHO = '<ellipse cx="36" cy="28" rx="11" ry="6" fill="#fff" opacity=".35" transform="rotate(-25 36 28)"/>';
  /* carinha simpática: olhos grandes com brilho e sorriso; humor: feliz | bravo | surpreso | ninja */
  function cara(x, y, esc, humor, corBoca) {
    esc = esc || 1; corBoca = corBoca || '#3a1d2b';
    var o = '', dx = 11 * esc, ry = 7 * esc, rx = 5.5 * esc;
    if (humor === 'ninja') return '<g transform="translate(' + x + ' ' + y + ')"><rect x="-22" y="-9" width="44" height="14" rx="4" fill="#1f1b3a"/><ellipse cx="-9" cy="-2" rx="4.5" ry="3" fill="#fff"/><ellipse cx="9" cy="-2" rx="4.5" ry="3" fill="#fff"/><circle cx="-8" cy="-2" r="2" fill="#1f1b3a"/><circle cx="10" cy="-2" r="2" fill="#1f1b3a"/><path d="M-22 -4 l-12 -8 M-22 -2 l-13 2" stroke="#1f1b3a" stroke-width="3" stroke-linecap="round"/></g>';
    o += '<g transform="translate(' + x + ' ' + y + ')">';
    o += '<ellipse cx="' + (-dx) + '" cy="0" rx="' + rx + '" ry="' + ry + '" fill="#fff"/><ellipse cx="' + dx + '" cy="0" rx="' + rx + '" ry="' + ry + '" fill="#fff"/>';
    var py = humor === 'surpreso' ? 1 : 1.5, pr = 3 * esc;
    o += '<circle cx="' + (-dx + 1.5) + '" cy="' + py + '" r="' + pr + '" fill="#1f1b3a"/><circle cx="' + (dx + 1.5) + '" cy="' + py + '" r="' + pr + '" fill="#1f1b3a"/>';
    o += '<circle cx="' + (-dx + 2.6) + '" cy="' + (py - 1.2) + '" r="1.1" fill="#fff"/><circle cx="' + (dx + 2.6) + '" cy="' + (py - 1.2) + '" r="1.1" fill="#fff"/>';
    if (humor === 'bravo') o += '<path d="M' + (-dx - 6) + ' -10 l12 4 M' + (dx + 6) + ' -10 l-12 4" stroke="#1f1b3a" stroke-width="3" stroke-linecap="round"/><path d="M-9 14 q9 -7 18 0" stroke="' + corBoca + '" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
    else if (humor === 'surpreso') o += '<ellipse cx="0" cy="14" rx="4.5" ry="5.5" fill="' + corBoca + '"/>';
    else o += '<path d="M-10 10 q10 12 20 0" stroke="' + corBoca + '" stroke-width="3.2" fill="none" stroke-linecap="round"/><ellipse cx="' + (-dx - 7) + '" cy="9" rx="4" ry="2.5" fill="#ff7aa8" opacity=".55"/><ellipse cx="' + (dx + 7) + '" cy="9" rx="4" ry="2.5" fill="#ff7aa8" opacity=".55"/>';
    o += '</g>';
    return o;
  }

  var F = [];
  function add(f) { F.push(f); return f; }

  /* ================= FRUTAS (cortar) ================= */
  grad('melG', '#ff6b7f', '#d8213f', true); grad('melCasca', '#9be15d', '#2e8b2e');
  add({ id: 'melancia', papel: 'fruta', turma: 'propria', raio: 50, suco: '#ff3c5f', nome: { pt: 'Fatia de melancia', en: 'Watermelon slice' },
    svg: svg('<path d="M8 36 A42 42 0 0 0 92 36 Z" fill="' + grad('melCasca') + '"/><path d="M15 36 A35 35 0 0 0 85 36 Z" fill="#eafbe0"/><path d="M19 36 A31 31 0 0 0 81 36 Z" fill="' + grad('melG') + '"/><rect x="8" y="34" width="84" height="4" fill="#2e8b2e"/>' +
      '<g fill="#1f1b3a"><ellipse cx="42" cy="55" rx="2.2" ry="3.4" transform="rotate(-20 42 55)"/><ellipse cx="58" cy="55" rx="2.2" ry="3.4" transform="rotate(20 58 55)"/><ellipse cx="50" cy="66" rx="2.2" ry="3.4"/><ellipse cx="36" cy="46" rx="2" ry="3" transform="rotate(-35 36 46)"/><ellipse cx="64" cy="46" rx="2" ry="3" transform="rotate(35 64 46)"/></g>', ['melG', 'melCasca']) });
  grad('larG', '#ffb347', '#ff7a00', true);
  add({ id: 'laranja', papel: 'fruta', turma: 'propria', raio: 44, suco: '#ff9f1c', nome: { pt: 'Laranja', en: 'Orange' },
    svg: svg('<circle cx="50" cy="52" r="42" fill="' + grad('larG') + '"/><circle cx="50" cy="52" r="42" fill="none" stroke="#c75a00" stroke-width="2" opacity=".5"/><path d="M50 10 q6 -8 14 -4 q-5 8 -14 4" fill="#4caf50"/><circle cx="50" cy="12" r="3" fill="#8d5524"/>' + BRILHO + '<g fill="#fff" opacity=".18"><circle cx="40" cy="60" r="2"/><circle cx="62" cy="48" r="2"/><circle cx="55" cy="70" r="2"/><circle cx="33" cy="45" r="2"/></g>', ['larG']) });
  grad('morG', '#ff6b8b', '#d1163c', true);
  add({ id: 'morango', papel: 'fruta', turma: 'propria', raio: 42, suco: '#ff3366', nome: { pt: 'Morango', en: 'Strawberry' },
    svg: svg('<path d="M50 94 C20 80 12 56 16 36 C20 22 34 20 50 24 C66 20 80 22 84 36 C88 56 80 80 50 94Z" fill="' + grad('morG') + '"/><path d="M50 26 l-6 -14 l10 8 l4 -14 l4 14 l10 -8 l-6 14 l12 -3 l-10 8 l12 4 l-14 0 q-6 4 -12 0 l-14 0 l12 -4 l-10 -8 z" fill="#3fbf4a"/>' +
      '<g fill="#ffe8a3"><ellipse cx="36" cy="50" rx="2.4" ry="3.4"/><ellipse cx="50" cy="44" rx="2.4" ry="3.4"/><ellipse cx="64" cy="50" rx="2.4" ry="3.4"/><ellipse cx="42" cy="66" rx="2.4" ry="3.4"/><ellipse cx="58" cy="66" rx="2.4" ry="3.4"/><ellipse cx="50" cy="80" rx="2.4" ry="3.4"/></g>' + BRILHO, ['morG']) });
  grad('banG', '#fff176', '#f9a825');
  add({ id: 'banana', papel: 'fruta', turma: 'propria', raio: 46, suco: '#ffe066', nome: { pt: 'Banana', en: 'Banana' },
    svg: svg('<path d="M18 30 C10 60 30 86 66 86 C80 86 88 78 86 70 C60 76 38 62 30 30 Z" fill="' + grad('banG') + '" stroke="#c98a00" stroke-width="2.5" stroke-linejoin="round"/><path d="M18 30 l-4 -8 l12 2 l4 8z" fill="#6d4c1e"/><path d="M86 70 l6 2 l-4 6z" fill="#6d4c1e"/><path d="M34 40 C40 60 54 74 76 76" stroke="#fff" stroke-width="3" opacity=".45" fill="none" stroke-linecap="round"/>', ['banG']) });
  grad('kiwiG', '#c6ff3d', '#5aa31e', true);
  add({ id: 'kiwi', papel: 'fruta', turma: 'propria', raio: 42, suco: '#9be15d', nome: { pt: 'Kiwi', en: 'Kiwi' },
    svg: svg('<circle cx="50" cy="50" r="44" fill="#8d6e3f"/><circle cx="50" cy="50" r="38" fill="' + grad('kiwiG') + '"/><circle cx="50" cy="50" r="10" fill="#eef7d2"/><g fill="#1f1b3a">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<ellipse cx="50" cy="30" rx="2" ry="3.5" transform="rotate(' + a + ' 50 50)"/>'; }).join('') + '</g>', ['kiwiG']) });
  grad('uvaG', '#b388ff', '#5e35b1', true);
  add({ id: 'uva', papel: 'fruta', turma: 'propria', raio: 44, suco: '#8e5bff', nome: { pt: 'Cacho de uva', en: 'Grapes' },
    svg: svg('<path d="M50 6 q8 2 10 14" stroke="#6d4c1e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50 14 q-14 -6 -22 6 q14 2 22 -6z" fill="#4caf50"/>' + [[36, 32], [52, 30], [66, 34], [30, 48], [46, 46], [62, 48], [76, 50], [38, 62], [54, 62], [70, 64], [46, 78], [62, 78], [54, 92]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="' + grad('uvaG') + '"/><ellipse cx="' + (p[0] - 3) + '" cy="' + (p[1] - 3) + '" rx="3" ry="1.8" fill="#fff" opacity=".4"/>'; }).join(''), ['uvaG']) });
  grad('abaG', '#ffd54f', '#f57f17', true);
  add({ id: 'abacaxi', papel: 'fruta', turma: 'propria', raio: 48, suco: '#ffd166', nome: { pt: 'Abacaxi', en: 'Pineapple' },
    svg: svg('<g fill="#43a047"><path d="M50 38 l-8 -34 l14 22 l6 -26 l4 26 l12 -20 l-6 32z"/><path d="M50 38 l-22 -22 l16 8 l-24 0 l24 10z"/><path d="M50 38 l22 -22 l-16 8 l24 0 l-24 10z"/></g><ellipse cx="50" cy="66" rx="28" ry="32" fill="' + grad('abaG') + '"/><g stroke="#c77800" stroke-width="1.6" opacity=".7" fill="none"><path d="M22 60 l56 24 M22 72 l48 22 M28 46 l50 22 M36 38 l40 18 M78 60 l-56 24 M78 72 l-48 22 M72 46 l-50 22 M64 38 l-40 18"/></g>' + BRILHO, ['abaG']) });
  grad('macaG', '#ff7b7b', '#c62828', true);
  add({ id: 'maca', papel: 'fruta', turma: 'propria', raio: 42, suco: '#ff5252', nome: { pt: 'Maçã', en: 'Apple' },
    svg: svg('<path d="M50 30 C30 14 8 30 12 56 C16 80 34 94 50 88 C66 94 84 80 88 56 C92 30 70 14 50 30Z" fill="' + grad('macaG') + '"/><path d="M50 30 q-2 -14 4 -22" stroke="#6d4c1e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M54 18 q14 -8 20 4 q-12 6 -20 -4z" fill="#43a047"/>' + BRILHO, ['macaG']) });

  /* ================= DOCES (cortar) ================= */
  grad('donG', '#ffb3c6', '#ff4fa3', true); grad('massaG', '#f4c27a', '#c98a3c');
  add({ id: 'donut', papel: 'doce', turma: 'propria', raio: 44, suco: '#ff7ab8', nome: { pt: 'Rosquinha', en: 'Donut' },
    svg: svg('<circle cx="50" cy="52" r="42" fill="' + grad('massaG') + '"/><path d="M50 10 a42 42 0 1 1 -0.1 0z M50 36 a16 16 0 1 0 0.1 0z" fill="' + grad('donG') + '" fill-rule="evenodd"/><circle cx="50" cy="52" r="15" fill="#1a1446" opacity=".12"/>' +
      '<g stroke-width="3" stroke-linecap="round"><path d="M30 30 l6 4" stroke="#c6ff3d"/><path d="M66 26 l6 2" stroke="#3ee8ff"/><path d="M76 56 l2 6" stroke="#fff176"/><path d="M26 62 l5 -4" stroke="#fff"/><path d="M58 80 l6 -3" stroke="#c6ff3d"/><path d="M40 78 l-2 6" stroke="#3ee8ff"/></g>', ['donG', 'massaG']) });
  grad('pirG', '#ff8a80', '#d50000', true);
  add({ id: 'pirulito', papel: 'doce', turma: 'propria', raio: 40, suco: '#ff6f91', nome: { pt: 'Pirulito', en: 'Lollipop' },
    svg: svg('<rect x="47" y="56" width="6" height="40" rx="3" fill="#f5f5f5"/><circle cx="50" cy="38" r="30" fill="' + grad('pirG') + '"/><path d="M50 38 m-24 0 a24 24 0 0 1 48 0 a18 18 0 0 1 -36 0 a12 12 0 0 1 24 0 a6 6 0 0 1 -12 0" fill="none" stroke="#fff" stroke-width="5" opacity=".85" stroke-linecap="round"/>' + BRILHO, ['pirG']) });
  grad('cupG', '#ffe0f0', '#ff80ab');
  add({ id: 'cupcake', papel: 'doce', turma: 'propria', raio: 44, suco: '#ffb3d9', nome: { pt: 'Cupcake', en: 'Cupcake' },
    svg: svg('<path d="M26 56 l6 38 h36 l6 -38z" fill="#8d5524"/><g stroke="#5d3a16" stroke-width="2"><path d="M36 58 l3 34 M50 58 v34 M64 58 l-3 34"/></g><path d="M22 56 C20 30 36 22 50 30 C64 22 80 30 78 56 Z" fill="' + grad('cupG') + '"/><path d="M28 50 q10 -14 22 -6 q12 -8 22 6" fill="none" stroke="#fff" stroke-width="4" opacity=".6" stroke-linecap="round"/><circle cx="50" cy="22" r="7" fill="#e53935"/><circle cx="48" cy="20" r="2" fill="#fff" opacity=".6"/>' +
      '<g fill="#c6ff3d"><circle cx="36" cy="44" r="2"/><circle cx="64" cy="46" r="2"/></g><g fill="#3ee8ff"><circle cx="46" cy="38" r="2"/><circle cx="58" cy="52" r="2"/></g>', ['cupG']) });
  grad('sorvG', '#ffd6e8', '#ff6fa8', true);
  add({ id: 'sorvete', papel: 'doce', turma: 'propria', raio: 44, suco: '#ffa6c9', nome: { pt: 'Sorvete', en: 'Ice cream' },
    svg: svg('<path d="M30 50 l20 46 l20 -46z" fill="#e0a458"/><g stroke="#b87a2e" stroke-width="1.5" fill="none"><path d="M34 58 l32 0 M38 68 l24 0 M42 78 l16 0 M40 52 l12 42 M60 52 l-12 42"/></g><circle cx="50" cy="40" r="24" fill="' + grad('sorvG') + '"/><circle cx="38" cy="30" r="12" fill="#fff5f8"/><circle cx="62" cy="30" r="12" fill="#ffd6e8"/><path d="M50 16 l6 -12" stroke="#d32f2f" stroke-width="3"/><circle cx="48" cy="18" r="5" fill="#e53935"/>' + BRILHO, ['sorvG']) });

  /* ================= BOLAS (chutar) ================= */
  grad('bolaG', '#ffffff', '#cfd8dc', true);
  add({ id: 'bola', papel: 'bola', turma: 'propria', raio: 40, suco: '#ffffff', nome: { pt: 'Bola de futebol', en: 'Soccer ball' },
    svg: svg('<circle cx="50" cy="50" r="44" fill="' + grad('bolaG') + '" stroke="#37474f" stroke-width="2"/><g fill="#1f2a30"><path d="M50 30 l12 9 l-5 14 h-14 l-5 -14z"/><path d="M50 8 l8 8 l-8 14 l-8 -14z"/><path d="M14 40 l12 -2 l6 12 l-8 10 l-12 -6z"/><path d="M86 40 l-12 -2 l-6 12 l8 10 l12 -6z"/><path d="M34 84 l6 -12 h20 l6 12 l-16 8z"/></g>', ['bolaG']) });
  grad('praiaG', '#ffffff', '#e0e0e0', true);
  add({ id: 'bolaPraia', papel: 'bola', turma: 'propria', raio: 40, suco: '#ffffff', nome: { pt: 'Bola de praia', en: 'Beach ball' },
    svg: svg('<circle cx="50" cy="50" r="44" fill="' + grad('praiaG') + '"/><g><path d="M50 6 C30 30 30 70 50 94 C40 70 40 30 50 6z" fill="#ff4fa3"/><path d="M50 6 C70 30 70 70 50 94 C60 70 60 30 50 6z" fill="#3ee8ff"/><path d="M50 6 C14 20 14 80 50 94 C26 70 26 30 50 6z" fill="#c6ff3d" opacity=".9"/><path d="M50 6 C86 20 86 80 50 94 C74 70 74 30 50 6z" fill="#ffd166" opacity=".9"/></g><circle cx="50" cy="50" r="44" fill="none" stroke="#37474f" stroke-width="2"/>' + BRILHO, ['praiaG']) });
  grad('bskG', '#ffb74d', '#e65100', true);
  add({ id: 'bolaBasquete', papel: 'bola', turma: 'propria', raio: 40, suco: '#ff9800', nome: { pt: 'Bola de basquete', en: 'Basketball' },
    svg: svg('<circle cx="50" cy="50" r="44" fill="' + grad('bskG') + '"/><g stroke="#3e2723" stroke-width="3" fill="none"><path d="M50 6 v88 M6 50 h88 M18 18 q32 32 64 64 M82 18 q-32 32 -64 64"/></g><circle cx="50" cy="50" r="44" fill="none" stroke="#3e2723" stroke-width="2"/>' + BRILHO, ['bskG']) });

  /* ================= VILÕES ================= */
  grad('pimG', '#ff5252', '#b71c1c', true);
  add({ id: 'pimentao', papel: 'vilao', turma: 'propria', raio: 44, suco: '#ff1744', nome: { pt: 'Pimentão Bravo', en: 'Angry Pepper' },
    svg: svg('<path d="M30 24 C10 40 14 86 44 94 C70 100 92 70 84 38 C80 22 60 16 50 26 C42 18 34 20 30 24Z" fill="' + grad('pimG') + '"/><path d="M50 26 q0 -16 10 -22" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/>' + cara(52, 56, 1.1, 'bravo') + '<g fill="#ffb300"><path d="M10 50 l-8 -4 l6 8z"/><path d="M90 46 l8 -6 l-4 10z"/><path d="M60 10 l4 -8 l2 8z"/></g>' + BRILHO, ['pimG']) });
  grad('bombG', '#616161', '#111', true);
  add({ id: 'bombeta', papel: 'vilao', turma: 'propria', raio: 42, suco: '#9e9e9e', nome: { pt: 'Bombeta', en: 'Bombette' },
    svg: svg('<circle cx="48" cy="58" r="36" fill="' + grad('bombG') + '"/><rect x="40" y="16" width="16" height="12" rx="3" fill="#455a64"/><path d="M48 16 q4 -12 16 -8" stroke="#8d6e63" stroke-width="3" fill="none" stroke-linecap="round"/><g><circle cx="66" cy="8" r="5" fill="#ffd166"/><circle cx="66" cy="8" r="2.5" fill="#fff"/><path d="M60 2 l-3 -2 M72 2 l3 -2 M66 -1 v-2" stroke="#ff7a00" stroke-width="2"/></g>' + cara(48, 58, 1, 'bravo', '#fff') + '<ellipse cx="34" cy="38" rx="9" ry="5" fill="#fff" opacity=".25" transform="rotate(-25 34 38)"/>', ['bombG']) });
  grad('nuvG', '#b0bec5', '#546e7a', true);
  add({ id: 'chuvisco', papel: 'vilao', turma: 'propria', raio: 46, suco: '#64b5f6', nome: { pt: 'Chuvisco', en: 'Drizzle' },
    svg: svg('<path d="M24 66 a16 16 0 0 1 4 -31 a20 20 0 0 1 38 -8 a16 16 0 0 1 14 28 a12 12 0 0 1 -6 11z" fill="' + grad('nuvG') + '"/>' + cara(52, 46, 0.9, 'bravo', '#263238') + '<g fill="#4fc3f7"><path d="M30 72 q-4 8 0 10 q4 -2 0 -10z"/><path d="M48 76 q-4 8 0 10 q4 -2 0 -10z"/><path d="M66 72 q-4 8 0 10 q4 -2 0 -10z"/><path d="M39 86 q-4 8 0 10 q4 -2 0 -10z"/><path d="M57 86 q-4 8 0 10 q4 -2 0 -10z"/></g>', ['nuvG']) });

  /* ================= TURMA PRÓPRIA — heróis ================= */
  grad('melcG', '#ff6b7f', '#d8213f', true);
  add({ id: 'melancino', papel: 'heroi', turma: 'propria', raio: 48, suco: '#ff3c5f', nome: { pt: 'Melancino', en: 'Melonino' },
    svg: svg('<path d="M20 46 q-8 30 10 44 l30 -6z" fill="#c6ff3d"/><circle cx="50" cy="50" r="38" fill="#2e8b2e"/><circle cx="50" cy="50" r="33" fill="#eafbe0"/><circle cx="50" cy="50" r="29" fill="' + grad('melcG') + '"/>' + cara(50, 50, 1, 'feliz') + '<g fill="#1f1b3a"><ellipse cx="32" cy="34" rx="2" ry="3"/><ellipse cx="68" cy="34" rx="2" ry="3"/><ellipse cx="50" cy="26" rx="2" ry="3"/></g><path d="M38 24 l6 -8 l6 8 l6 -8 l6 8" stroke="#ffd166" stroke-width="3" fill="none" stroke-linejoin="round"/>' + BRILHO, ['melcG']) });
  add({ id: 'donatella', papel: 'heroi', turma: 'propria', raio: 44, suco: '#ff7ab8', nome: { pt: 'Donatella', en: 'Donatella' },
    svg: svg('<circle cx="50" cy="52" r="40" fill="' + grad('massaG') + '"/><path d="M50 12 a40 40 0 1 1 -0.1 0z M50 40 a12 12 0 1 0 0.1 0z" fill="' + grad('donG') + '" fill-rule="evenodd"/>' + cara(50, 30, 0.85, 'feliz') + '<path d="M22 20 q6 -14 16 -8 q-10 2 -16 8z M78 20 q-6 -14 -16 -8 q10 2 16 8z" fill="#ff4fa3"/><circle cx="24" cy="20" r="5" fill="#ffd166"/><circle cx="76" cy="20" r="5" fill="#ffd166"/><g stroke-width="3" stroke-linecap="round"><path d="M28 60 l6 4" stroke="#c6ff3d"/><path d="M70 58 l6 2" stroke="#3ee8ff"/><path d="M40 84 l6 -3" stroke="#fff"/><path d="M60 82 l-2 6" stroke="#3ee8ff"/></g>', ['massaG', 'donG']) });
  add({ id: 'morangao', papel: 'heroi', turma: 'propria', raio: 44, suco: '#ff3366', nome: { pt: 'Morangão', en: 'Big Berry' },
    svg: svg('<path d="M50 96 C18 82 10 56 16 34 C22 20 38 20 50 26 C62 20 78 20 84 34 C90 56 82 82 50 96Z" fill="' + grad('morG') + '"/><path d="M50 26 l-8 -16 l12 10 l4 -16 l4 16 l12 -10 l-8 16 l14 -2 l-12 8z" fill="#3fbf4a"/>' + cara(50, 56, 1.05, 'feliz') + '<g fill="#ffe8a3"><ellipse cx="30" cy="48" rx="2.2" ry="3.2"/><ellipse cx="70" cy="48" rx="2.2" ry="3.2"/><ellipse cx="36" cy="76" rx="2.2" ry="3.2"/><ellipse cx="64" cy="76" rx="2.2" ry="3.2"/></g><path d="M14 56 q-8 4 -6 14 M86 56 q8 4 6 14" stroke="#d1163c" stroke-width="7" stroke-linecap="round" fill="none"/>', ['morG']) });
  add({ id: 'bananito', papel: 'heroi', turma: 'propria', raio: 46, suco: '#ffe066', nome: { pt: 'Bananito', en: 'Bananito' },
    svg: svg('<path d="M16 26 C8 60 30 90 68 90 C84 90 92 80 90 70 C62 78 36 60 30 26 Z" fill="' + grad('banG') + '" stroke="#c98a00" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 26 l-4 -8 l12 2 l4 8z" fill="#6d4c1e"/>' + cara(58, 68, 0.9, 'feliz') + '<path d="M44 40 l-8 -14 l12 6 l0 -14 l6 12 l10 -8 l-4 14" stroke="#6d4c1e" stroke-width="2.5" fill="none" stroke-linejoin="round"/><rect x="40" y="46" width="34" height="8" rx="4" fill="#1f1b3a" opacity=".85"/>', ['banG']) });
  add({ id: 'kiwiNinja', papel: 'heroi', turma: 'propria', raio: 42, suco: '#9be15d', nome: { pt: 'Kiwi Ninja', en: 'Kiwi Ninja' },
    svg: svg('<circle cx="50" cy="50" r="44" fill="#8d6e3f"/><circle cx="50" cy="50" r="38" fill="' + grad('kiwiG') + '"/>' + cara(50, 46, 1, 'ninja') + '<path d="M30 66 q20 14 40 0" stroke="#1f1b3a" stroke-width="3" fill="none" stroke-linecap="round"/><g fill="#1f1b3a">' + [200, 240, 280, 320].map(function (a) { return '<ellipse cx="50" cy="28" rx="2" ry="3.5" transform="rotate(' + a + ' 50 50)"/>'; }).join('') + '</g><path d="M84 30 l10 -10 M86 40 l12 -2" stroke="#cfd8dc" stroke-width="3" stroke-linecap="round"/>', ['kiwiG']) });
  grad('pipG', '#fffde7', '#ffe082', true);
  add({ id: 'pipoquinha', papel: 'heroi', turma: 'propria', raio: 40, suco: '#fff8e1', nome: { pt: 'Pipoquinha', en: 'Popcornie' },
    svg: svg('<g fill="' + grad('pipG') + '" stroke="#e0b24a" stroke-width="2"><circle cx="34" cy="40" r="16"/><circle cx="66" cy="40" r="16"/><circle cx="50" cy="26" r="16"/><circle cx="36" cy="64" r="16"/><circle cx="64" cy="64" r="16"/><circle cx="50" cy="52" r="20"/></g>' + cara(50, 54, 0.9, 'surpreso') + '<path d="M44 10 l4 -8 l4 8" stroke="#ffd166" stroke-width="3" fill="none"/>', ['pipG']) });
  add({ id: 'sorvetao', papel: 'heroi', turma: 'propria', raio: 46, suco: '#ffa6c9', nome: { pt: 'Sorvetão', en: 'Big Scoop' },
    svg: svg('<path d="M28 52 l22 46 l22 -46z" fill="#e0a458"/><g stroke="#b87a2e" stroke-width="1.5" fill="none"><path d="M32 60 l36 0 M36 70 l28 0 M40 80 l20 0"/></g><circle cx="50" cy="38" r="28" fill="' + grad('sorvG') + '"/>' + cara(50, 40, 1, 'feliz') + '<path d="M26 22 q4 -16 18 -14 M74 22 q-4 -16 -18 -14" stroke="#fff5f8" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="50" cy="8" r="6" fill="#e53935"/><g fill="#3ee8ff"><circle cx="30" cy="40" r="2"/><circle cx="72" cy="36" r="2"/></g><g fill="#c6ff3d"><circle cx="36" cy="56" r="2"/><circle cx="66" cy="54" r="2"/></g>', ['sorvG']) });
  grad('bolG', '#ffe082', '#d4891f', true);
  add({ id: 'bolinhoDeChuva', papel: 'heroi', mascote: true, turma: 'propria', raio: 48, suco: '#ffd166', nome: { pt: 'Bolinho de Chuva', en: 'Rain Dumpling' },
    svg: svg('<path d="M50 4 q-26 2 -32 24 h64 q-6 -22 -32 -24z" fill="#3ee8ff"/><path d="M18 28 q8 -6 16 0 q8 -6 16 0 q8 -6 16 0 q8 -6 16 0" stroke="#1a9fc0" stroke-width="2.5" fill="none"/><rect x="48.5" y="28" width="3" height="18" fill="#1f1b3a"/><path d="M28 46 C20 60 24 88 50 92 C76 88 80 60 72 46 C66 36 34 36 28 46Z" fill="' + grad('bolG') + '"/><path d="M34 44 q16 -10 32 0" stroke="#fff" stroke-width="4" opacity=".5" fill="none" stroke-linecap="round"/>' + cara(50, 64, 1, 'feliz') + '<g fill="#fff" opacity=".9"><circle cx="34" cy="56" r="1.6"/><circle cx="66" cy="58" r="1.6"/><circle cx="42" cy="82" r="1.6"/><circle cx="60" cy="84" r="1.6"/><circle cx="50" cy="48" r="1.6"/><circle cx="30" cy="70" r="1.6"/><circle cx="70" cy="72" r="1.6"/></g><g fill="#c6ff3d"><circle cx="22" cy="56" r="3"/><circle cx="78" cy="56" r="3"/></g>', ['bolG']) });
  add({ id: 'capitaoChute', papel: 'heroi', turma: 'propria', raio: 44, suco: '#ffffff', nome: { pt: 'Capitão Chute', en: 'Captain Kick' },
    svg: svg('<circle cx="50" cy="54" r="40" fill="' + grad('bolaG') + '" stroke="#37474f" stroke-width="2"/><g fill="#1f2a30"><path d="M22 66 l10 -4 l6 10 l-6 10 l-12 -6z"/><path d="M78 66 l-10 -4 l-6 10 l6 10 l12 -6z"/><path d="M38 90 l6 -8 h12 l6 8z"/></g>' + cara(50, 52, 1, 'feliz') + '<path d="M22 30 q28 -22 56 0 l-4 6 q-24 -16 -48 0z" fill="#1a1446"/><rect x="18" y="30" width="64" height="7" rx="3" fill="#1a1446"/><path d="M50 14 l3 6 l6 1 l-4.5 4 l1 6 l-5.5 -3 l-5.5 3 l1 -6 l-4.5 -4 l6 -1z" fill="#ffd166"/>', ['bolaG']) });

  /* ================= PODERES ================= */
  grad('estG', '#fff9c4', '#ffb300', true);
  add({ id: 'estrelinha', papel: 'poder', poder: 'x2', turma: 'propria', raio: 40, suco: '#ffd166', nome: { pt: 'Estrelinha ✖2', en: 'Little Star ✖2' },
    svg: svg('<path d="M50 4 l13 28 l31 3 l-23 21 l7 30 l-28 -16 l-28 16 l7 -30 l-23 -21 l31 -3z" fill="' + grad('estG') + '" stroke="#e59d00" stroke-width="2" stroke-linejoin="round"/>' + cara(50, 50, 0.85, 'feliz') + '<text x="50" y="86" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="16" fill="#1a1446">×2</text>', ['estG']) });
  grad('carG', '#a5d6a7', '#2e7d32', true);
  add({ id: 'caracol', papel: 'poder', poder: 'lento', turma: 'propria', raio: 40, suco: '#9be15d', nome: { pt: 'Caracol (tempo lento)', en: 'Snail (slow time)' },
    svg: svg('<path d="M14 80 q10 -20 40 -18 l0 20z" fill="#c5a26a"/><circle cx="62" cy="54" r="28" fill="' + grad('carG') + '"/><path d="M62 54 m-18 0 a18 18 0 0 1 36 0 a12 12 0 0 1 -24 0 a6 6 0 0 1 12 0" fill="none" stroke="#1b5e20" stroke-width="4" stroke-linecap="round"/><path d="M22 66 q-10 -14 -4 -30 M30 64 q-2 -16 8 -28" stroke="#c5a26a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="18" cy="34" r="4" fill="#fff"/><circle cx="38" cy="34" r="4" fill="#fff"/><circle cx="18" cy="34" r="2" fill="#1f1b3a"/><circle cx="38" cy="34" r="2" fill="#1f1b3a"/>', ['carG']) });
  add({ id: 'nuvemDeFrutas', papel: 'poder', poder: 'chuva', turma: 'propria', raio: 44, suco: '#ff9f1c', nome: { pt: 'Nuvem de frutas', en: 'Fruit cloud' },
    svg: svg('<path d="M24 60 a16 16 0 0 1 4 -31 a20 20 0 0 1 38 -8 a16 16 0 0 1 14 28 a12 12 0 0 1 -6 11z" fill="#fff" opacity=".95"/>' + cara(52, 42, 0.8, 'feliz') + '<circle cx="30" cy="76" r="6" fill="#ff7a00"/><circle cx="48" cy="84" r="6" fill="#d1163c"/><circle cx="66" cy="76" r="6" fill="#9be15d"/><circle cx="56" cy="94" r="5" fill="#8e5bff"/><circle cx="38" cy="94" r="5" fill="#ffd166"/>', []) });

  /* ================= DOMÍNIO PÚBLICO (desenhos originais inspirados nas obras livres) ================= */
  add({ id: 'willie', papel: 'heroi', turma: 'publica', raio: 46, suco: '#eceff1', nome: { pt: 'Camundongo do barco (1928)', en: 'Steamboat mouse (1928)' },
    svg: svg('<circle cx="22" cy="24" r="16" fill="#111"/><circle cx="78" cy="24" r="16" fill="#111"/><circle cx="50" cy="52" r="34" fill="#111"/><path d="M50 36 C34 36 22 50 24 66 C28 80 40 84 50 84 C60 84 72 80 76 66 C78 50 66 36 50 36Z" fill="#f5f5f5"/><ellipse cx="40" cy="54" rx="4" ry="8" fill="#111"/><ellipse cx="60" cy="54" rx="4" ry="8" fill="#111"/><path d="M36 48 l8 -2 M56 46 l8 2" stroke="#111" stroke-width="2"/><ellipse cx="50" cy="66" rx="5" ry="4" fill="#111"/><path d="M36 70 q14 14 28 0" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M70 80 q20 4 18 18" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="50" cy="52" r="34" fill="none" stroke="#111" stroke-width="2"/>', []) });
  add({ id: 'marinheiro', papel: 'heroi', turma: 'publica', raio: 46, suco: '#90caf9', nome: { pt: 'Marinheiro Popeye (1929)', en: 'Sailor Popeye (1929)' },
    svg: svg('<rect x="30" y="58" width="40" height="34" rx="8" fill="#1565c0"/><ellipse cx="18" cy="80" rx="14" ry="10" fill="#ffcc80"/><ellipse cx="82" cy="80" rx="14" ry="10" fill="#ffcc80"/><circle cx="50" cy="36" r="24" fill="#ffcc80"/><path d="M26 22 h48 q0 -12 -24 -12 q-24 0 -24 12z" fill="#f5f5f5"/><rect x="24" y="20" width="52" height="5" fill="#111"/><circle cx="42" cy="34" r="3" fill="#111"/><path d="M58 30 q4 4 0 8" stroke="#111" stroke-width="2.5" fill="none"/><path d="M62 46 q6 12 18 8" stroke="#5d4037" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="82" cy="52" r="4" fill="#5d4037"/><path d="M30 50 q20 10 32 -2" fill="#ffb74d"/><path d="M36 10 q14 -8 28 0" stroke="#111" stroke-width="3" fill="none"/>', []) });
  add({ id: 'alice', papel: 'heroi', turma: 'publica', raio: 46, suco: '#b39ddb', nome: { pt: 'Alice (do livro, 1865)', en: 'Alice (from the book, 1865)' },
    svg: svg('<path d="M30 56 l-8 38 h56 l-8 -38z" fill="#9575cd"/><path d="M34 60 l-6 30 h44 l-6 -30z" fill="#ede7f6"/><g fill="#1a1446"><rect x="32" y="86" width="8" height="8"/><rect x="60" y="86" width="8" height="8"/></g><circle cx="50" cy="34" r="22" fill="#ffe0b2"/><path d="M28 36 q0 -28 22 -26 q22 -2 22 26 q-6 -14 -22 -14 q-16 0 -22 14z" fill="#fdd835"/><path d="M26 40 q-2 28 10 34 M74 40 q2 28 -10 34" stroke="#fdd835" stroke-width="8" stroke-linecap="round" fill="none"/><rect x="28" y="14" width="44" height="5" rx="2" fill="#1a1446"/>' + cara(50, 36, 0.8, 'feliz') + '', []) });
  add({ id: 'pinoquio', papel: 'heroi', turma: 'publica', raio: 46, suco: '#d7ccc8', nome: { pt: 'Pinóquio (do livro, 1883)', en: 'Pinocchio (from the book, 1883)' },
    svg: svg('<rect x="34" y="60" width="32" height="32" rx="6" fill="#ef5350"/><rect x="26" y="64" width="8" height="26" rx="4" fill="#d7b98e"/><rect x="66" y="64" width="8" height="26" rx="4" fill="#d7b98e"/><rect x="30" y="20" width="40" height="42" rx="10" fill="#d7b98e"/><path d="M30 20 l20 -16 l20 16z" fill="#fff" stroke="#9e9e9e" stroke-width="2"/><path d="M34 30 q-4 10 0 20 M66 30 q4 10 0 20" stroke="#a1887f" stroke-width="2" fill="none"/>' + cara(50, 36, 0.8, 'surpreso') + '<path d="M50 42 l26 2 l-26 2z" fill="#c9a06c" stroke="#8d6e3f" stroke-width="1.5"/><circle cx="50" cy="62" r="3" fill="#a1887f"/><circle cx="50" cy="70" r="3" fill="#a1887f"/>', []) });
  add({ id: 'quixote', papel: 'heroi', turma: 'publica', raio: 46, suco: '#cfd8dc', nome: { pt: 'Dom Quixote (1605)', en: 'Don Quixote (1605)' },
    svg: svg('<rect x="36" y="56" width="28" height="36" rx="6" fill="#90a4ae"/><path d="M36 60 h28 l-4 6 h-20z" fill="#546e7a"/><rect x="18" y="56" width="10" height="34" rx="5" fill="#cfd8dc"/><rect x="74" y="20" width="5" height="76" rx="2" fill="#8d6e63"/><path d="M76 20 l-6 -14 l12 0z" fill="#cfd8dc"/><circle cx="50" cy="38" r="18" fill="#ffe0b2"/><path d="M28 30 q22 -18 44 0 l0 6 h-44z" fill="#b0bec5"/><path d="M34 28 h32 q-2 -10 -16 -10 q-14 0 -16 10z" fill="#90a4ae"/><path d="M40 48 q10 8 20 0" stroke="#5d4037" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M42 42 l-4 -2 M58 42 l4 -2" stroke="#5d4037" stroke-width="2.5"/><circle cx="44" cy="36" r="2.5" fill="#1f1b3a"/><circle cx="56" cy="36" r="2.5" fill="#1f1b3a"/><path d="M40 56 q10 10 20 0" stroke="#5d4037" stroke-width="3" fill="none"/>', []) });

  /* ---------- API ---------- */
  var minhas = [];
  function lista(turmas) {
    turmas = turmas || { propria: true, publica: true, minhas: true };
    return F.concat(minhas).filter(function (f) { return turmas[f.turma] !== false; });
  }
  function porId(id) { return F.concat(minhas).filter(function (f) { return f.id === id; })[0] || null; }

  /* As suas imagens: meus/personagens.json → [{ nome:{pt,en} | "texto", arquivo, papel, raio? }].
     Papéis aceitos: heroi, vilao, fruta, doce, bola, poder. Nada é executado: só imagem. */
  function carregarMeus(url) {
    if (typeof fetch !== 'function') return Promise.resolve([]);
    url = url || 'meus/personagens.json';
    var base = url.replace(/[^/]*$/, '');
    return fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }).then(function (lista) {
      if (!Array.isArray(lista)) return [];
      minhas = lista.slice(0, 40).map(function (x, i) {
        if (!x || typeof x !== 'object' || typeof x.arquivo !== 'string' || !/^[\w.-]+\.(png|svg|webp|jpg|jpeg)$/i.test(x.arquivo)) return null;
        var papel = ['heroi', 'vilao', 'fruta', 'doce', 'bola', 'poder'].indexOf(x.papel) >= 0 ? x.papel : 'heroi';
        var nome = typeof x.nome === 'string' ? { pt: x.nome, en: x.nome } : (x.nome && typeof x.nome === 'object') ? { pt: String(x.nome.pt || x.arquivo), en: String(x.nome.en || x.nome.pt || x.arquivo) } : { pt: x.arquivo, en: x.arquivo };
        return { id: 'meu' + i, papel: papel, turma: 'minhas', raio: Math.max(30, Math.min(70, +x.raio || 46)), suco: '#fff', nome: { pt: nome.pt.slice(0, 40), en: nome.en.slice(0, 40) }, img: base + x.arquivo, mascote: !!x.mascote, poder: x.poder === 'lento' || x.poder === 'chuva' ? x.poder : 'x2' };
      }).filter(Boolean);
      return minhas;
    });
  }

  /* Rasteriza uma figura num canvas quadrado (px) para desenhar rápido no palco. Cache por id+px. */
  var cache = {};
  function rasterizar(fig, px) {
    var k = fig.id + '@' + px;
    if (cache[k]) return cache[k];
    cache[k] = new Promise(function (ok) {
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = c.height = px;
        var ctx = c.getContext('2d');
        // imagens de fora (meus/) podem não ser quadradas: encaixa dentro do quadrado mantendo a proporção
        var w = img.naturalWidth || px, h = img.naturalHeight || px, esc = Math.min(px / w, px / h);
        ctx.drawImage(img, (px - w * esc) / 2, (px - h * esc) / 2, w * esc, h * esc);
        ok(c);
      };
      img.onerror = function () { var c = document.createElement('canvas'); c.width = c.height = px; var ctx = c.getContext('2d'); ctx.fillStyle = '#888'; ctx.beginPath(); ctx.arc(px / 2, px / 2, px / 2 - 2, 0, 6.3); ctx.fill(); ok(c); };
      if (fig.img) img.src = fig.img;
      else img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fig.svg);
    });
    return cache[k];
  }

  return { lista: lista, porId: porId, carregarMeus: carregarMeus, rasterizar: rasterizar, todas: F };
});
