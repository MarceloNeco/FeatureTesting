/* Peluqueria — as 10 músicas do jogo: partitura PURA (sem áudio; testada no Node). Pop dançante de pista
   (118–132 BPM): bumbo em todas as batidas, palmas no 2 e 4, chimbal aberto no contratempo, baixo pulsando,
   acordes de sintetizador e um refrão com melodia própria. Cada música tem intro, verso, subida (chiado
   subindo + virada de caixa), refrão, pausa e refrão final, e depois a lista segue para a próxima.
   Nenhuma melodia copiada: os ganchos são gerados aqui, por ritmo + sorteio com semente, sobre os acordes.
   som.js só toca o que partitura(faixa, compasso) devolve. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.PeluqueriaTrilhas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var ESCALAS = { maior: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10] };
  var ESTRUTURA = [['intro', 4], ['verso', 8], ['subida', 4], ['refrao', 8], ['pausa', 4], ['refrao2', 8]];
  var AJUSTE = { inicio: 0, crianca: -6, normal: 0, maluco: 6 };

  // tom = nota MIDI da tônica na região dos acordes; acordes = graus da escala (0 = tônica)
  var FAIXAS = [
    { id: 'pista-brilhante', nome: { pt: 'Pista Brilhante', en: 'Glitter Floor' }, bpm: 126, tom: 57, modo: 'menor', acordes: [0, 5, 2, 6], baixo: 'oitava', bateria: 'disco', lead: 'saw', ritmo: 0, semente: 11 },
    { id: 'neon-no-ceu', nome: { pt: 'Neon no Céu', en: 'Neon Sky' }, bpm: 122, tom: 59, modo: 'menor', acordes: [0, 3, 6, 5], baixo: 'sincopa', bateria: 'house', lead: 'pluck', ritmo: 1, semente: 23 },
    { id: 'purpurina', nome: { pt: 'Purpurina', en: 'Glitter Rain' }, bpm: 128, tom: 55, modo: 'maior', acordes: [5, 3, 0, 4], baixo: 'reto', bateria: 'electro', lead: 'square', ritmo: 2, semente: 37 },
    { id: 'coracao-disco', nome: { pt: 'Coração Disco', en: 'Disco Heart' }, bpm: 124, tom: 54, modo: 'menor', acordes: [0, 6, 5, 6], baixo: 'galope', bateria: 'disco', lead: 'sino', ritmo: 3, semente: 41 },
    { id: 'noite-de-festa', nome: { pt: 'Noite de Festa', en: 'Party Night' }, bpm: 130, tom: 52, modo: 'maior', acordes: [0, 4, 5, 3], baixo: 'oitava', bateria: 'electro', lead: 'saw', ritmo: 4, semente: 53 },
    { id: 'pulo-alto', nome: { pt: 'Pulo Alto', en: 'Jump High' }, bpm: 120, tom: 56, modo: 'maior', acordes: [3, 4, 2, 5], baixo: 'sincopa', bateria: 'funk', lead: 'pluck', ritmo: 5, semente: 67 },
    { id: 'bola-espelhada', nome: { pt: 'Bola Espelhada', en: 'Mirrorball' }, bpm: 127, tom: 50, modo: 'menor', acordes: [0, 6, 5, 4], baixo: 'reto', bateria: 'house', lead: 'square', ritmo: 2, semente: 79 },
    { id: 'verao-eletrico', nome: { pt: 'Verão Elétrico', en: 'Electric Summer' }, bpm: 125, tom: 53, modo: 'maior', acordes: [0, 5, 3, 4], baixo: 'galope', bateria: 'disco', lead: 'saw', ritmo: 0, semente: 83 },
    { id: 'luzes-da-cidade', nome: { pt: 'Luzes da Cidade', en: 'City Lights' }, bpm: 129, tom: 58, modo: 'maior', acordes: [5, 4, 3, 4], baixo: 'oitava', bateria: 'funk', lead: 'sino', ritmo: 3, semente: 97 },
    { id: 'ate-o-sol-nascer', nome: { pt: 'Até o Sol Nascer', en: 'Till Sunrise' }, bpm: 123, tom: 55, modo: 'menor', acordes: [0, 2, 6, 3], baixo: 'sincopa', bateria: 'electro', lead: 'saw', ritmo: 1, semente: 101 }
  ];

  /* ritmos do gancho (2 compassos = 32 semicolcheias): [início, duração] */
  var RITMOS = [
    [[0, 2], [3, 1], [4, 2], [6, 2], [8, 3], [11, 1], [12, 2], [14, 2], [16, 2], [18, 2], [20, 4], [26, 2], [28, 4]],
    [[0, 1], [2, 1], [4, 1], [6, 2], [10, 2], [12, 1], [14, 2], [16, 3], [19, 1], [20, 2], [22, 2], [24, 6]],
    [[2, 2], [4, 2], [6, 2], [8, 2], [11, 2], [14, 2], [18, 2], [20, 2], [22, 2], [24, 3], [27, 1], [28, 4]],
    [[0, 3], [3, 3], [6, 2], [8, 4], [12, 2], [14, 2], [16, 3], [19, 3], [22, 2], [24, 8]],
    [[0, 1], [1, 1], [2, 2], [4, 1], [5, 1], [6, 2], [8, 2], [12, 2], [14, 1], [15, 1], [16, 2], [18, 2], [20, 2], [22, 2], [24, 4], [28, 2]],
    [[1, 1], [3, 1], [5, 1], [7, 3], [10, 2], [12, 4], [17, 1], [19, 1], [21, 1], [23, 3], [26, 2], [28, 4]]
  ];

  var BATERIAS = {
    house: { bumbo: [0, 4, 8, 12], palma: [4, 12], aberto: [2, 6, 10, 14], chimbal: [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15], vChim: 0.18 },
    disco: { bumbo: [0, 4, 8, 12], palma: [4, 12], aberto: [2, 6, 10, 14], chimbal: [0, 1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15], vChim: 0.3 },
    electro: { bumbo: [0, 4, 8, 12], palma: [4, 12], aberto: [2, 10], chimbal: [0, 2, 3, 4, 6, 7, 8, 11, 12, 14, 15], vChim: 0.28 },
    funk: { bumbo: [0, 4, 7, 8, 12], palma: [4, 12], aberto: [6, 14], chimbal: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15], vChim: 0.22 }
  };
  /* baixo: [passo, oitava (0/1) ou 'q' (quinta), duração] */
  var BAIXOS = {
    oitava: [[0, 0, 2], [2, 1, 2], [4, 0, 2], [6, 1, 2], [8, 0, 2], [10, 1, 2], [12, 0, 2], [14, 1, 2]],
    galope: [[0, 0, 3], [3, 0, 1], [4, 0, 2], [6, 1, 2], [8, 0, 3], [11, 0, 1], [12, 0, 2], [14, 1, 2]],
    reto: [[0, 0, 1], [2, 0, 2], [6, 0, 2], [8, 0, 1], [10, 0, 2], [14, 1, 2]],
    sincopa: [[0, 0, 2], [3, 0, 1], [4, 1, 1], [6, 'q', 2], [8, 0, 2], [10, 0, 1], [11, 1, 1], [14, 'q', 2]]
  };

  function aleatorio(semente) {
    var a = semente >>> 0 || 1;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function escala(f) { return ESCALAS[f.modo]; }
  /* nota MIDI do grau d (pode passar de 6: sobe de oitava) */
  function grau(f, d) { var e = ESCALAS[f.modo], o = Math.floor(d / 7); return f.tom + 12 * o + e[((d % 7) + 7) % 7]; }
  function triade(f, d) { return [grau(f, d), grau(f, d + 2), grau(f, d + 4)]; }

  /* gancho do refrão: 4 compassos (ritmo de 2 compassos repetido sobre os acordes 1-2 e 3-4), em graus */
  var cacheGancho = {};
  function gancho(f) {
    if (cacheGancho[f.id]) return cacheGancho[f.id];
    var rnd = aleatorio(f.semente), ritmo = RITMOS[f.ritmo], notas = [], ant = 9 + Math.floor(rnd() * 3);
    for (var metade = 0; metade < 2; metade++) {
      ritmo.forEach(function (r, k) {
        var s = r[0], ac = f.acordes[metade * 2 + Math.floor(s / 16)], d;
        var ultima = metade === 1 && k === ritmo.length - 1;
        if (ultima) d = 7 + f.acordes[0];                       // termina na tônica do primeiro acorde
        else if (s % 4 === 0) {                                  // tempo forte: nota do acorde mais perto
          var op = [ac, ac + 2, ac + 4, ac + 7, ac + 9, ac + 11].filter(function (x) { return x >= 7 && x <= 15; });
          op.sort(function (a, b) { return Math.abs(a - ant) - Math.abs(b - ant) || rnd() - 0.5; });
          d = op[rnd() < 0.7 ? 0 : Math.min(1, op.length - 1)];
        } else {                                                 // passagem: anda 1 ou 2 graus
          var passo = [1, 1, 2, -1, -1, -2, 0][Math.floor(rnd() * 7)];
          d = Math.max(7, Math.min(15, ant + passo));
        }
        notas.push({ s: s + metade * 32, d: d, dur: r[1] });
        ant = d;
      });
    }
    cacheGancho[f.id] = notas;
    return notas;
  }

  function secaoDo(c) {
    var n = 0;
    for (var k = 0; k < ESTRUTURA.length; k++) { if (c < n + ESTRUTURA[k][1]) return { nome: ESTRUTURA[k][0], i: c - n, len: ESTRUTURA[k][1] }; n += ESTRUTURA[k][1]; }
    return { nome: 'refrao2', i: 0, len: 8 };
  }
  function compassos() { return ESTRUTURA.reduce(function (a, s) { return a + s[1]; }, 0); }

  function partitura(f, c) {
    var sec = secaoDo(c), ev = [], b = BATERIAS[f.bateria], ac = f.acordes[c % 4], nome = sec.nome;
    var cheio = nome === 'refrao' || nome === 'refrao2';
    var add = function (o) { ev.push(o); };
    var ritmoBumbo = b.bumbo.slice();
    if (f.bateria === 'electro' && c % 2 === 1) ritmoBumbo.push(14);

    // bateria
    if (nome !== 'pausa') {
      if (nome === 'subida' && sec.i === 3) { /* último compasso da subida: só a virada */ }
      else if (nome === 'subida' && sec.i === 2) [0, 2, 4, 6, 8, 10, 12, 14].forEach(function (t) { add({ t: t, tipo: 'bumbo', dur: 1, vol: 0.85 }); });
      else ritmoBumbo.forEach(function (t) { add({ t: t, tipo: 'bumbo', dur: 1, vol: 1 }); });
    }
    if (nome !== 'intro' && nome !== 'pausa') b.palma.forEach(function (t) { add({ t: t, tipo: 'palma', dur: 1, vol: cheio ? 0.9 : 0.6 }); });
    if (cheio || nome === 'verso') {
      b.aberto.forEach(function (t) { add({ t: t, tipo: 'aberto', dur: 2, vol: cheio ? 0.5 : 0.3 }); });
      b.chimbal.forEach(function (t) { add({ t: t, tipo: 'chimbal', dur: 1, vol: b.vChim * (t % 4 === 2 ? 1.4 : 1) }); });
    } else if (nome === 'intro' && sec.i >= 2) b.chimbal.forEach(function (t) { add({ t: t, tipo: 'chimbal', dur: 1, vol: b.vChim * 0.8 }); });
    if ((nome === 'subida' || nome === 'pausa') && sec.i === sec.len - 1)
      for (var t = 0; t < 16; t++) add({ t: t, tipo: 'caixa', dur: 1, vol: 0.2 + 0.7 * t / 15 });
    if (nome === 'subida' && sec.i === 0) add({ t: 0, tipo: 'riser', dur: 64, vol: 0.5 });
    if (cheio && sec.i === 0) add({ t: 0, tipo: 'crash', dur: 8, vol: 0.6 });

    // acordes: tapete o compasso inteiro (filtro abre na subida) + "stabs" no contratempo no verso e refrão
    var filtro = nome === 'intro' ? 0.25 + 0.1 * sec.i : nome === 'subida' ? 0.35 + 0.65 * (sec.i + 1) / 4 : nome === 'pausa' ? 0.45 : 1;
    add({ t: 0, tipo: 'acorde', notas: triade(f, ac), dur: 16, vol: cheio ? 0.55 : 0.45, filtro: filtro, estilo: 'tapete' });
    if (cheio || nome === 'verso') [2, 6, 10, 14].forEach(function (t2) { add({ t: t2, tipo: 'acorde', notas: triade(f, ac + 7), dur: 1, vol: cheio ? 0.45 : 0.3, filtro: 1, estilo: 'stab' }); });

    // baixo
    if (cheio || nome === 'verso' || (nome === 'subida' && sec.i < 3)) {
      BAIXOS[f.baixo].forEach(function (p) {
        if (nome === 'subida' && p[0] % 4) return;   // na subida o baixo só marca o tempo
        var d = ac + (p[1] === 'q' ? 4 : 0), nota = grau(f, d) - 24 + (p[1] === 1 ? 12 : 0);
        add({ t: p[0], tipo: 'baixo', nota: nota, dur: p[2], vol: 0.9 });
      });
    }

    // melodia
    var g = gancho(f), base = (c % 4) * 16;
    if (cheio || nome === 'pausa') {
      g.forEach(function (n) {   // o gancho tem 4 compassos (64 passos); este compasso pega a sua fatia
        if (n.s >= base && n.s < base + 16) {
          add({ t: n.s - base, tipo: 'lead', nota: grau(f, n.d), dur: n.dur, vol: nome === 'pausa' ? 0.45 : 0.8 });
          if (nome === 'refrao2') add({ t: n.s - base, tipo: 'lead', nota: grau(f, n.d) + 12, dur: n.dur, vol: 0.35 });
        }
      });
    } else if (nome === 'verso') {   // contracanto curto: nota do acorde nos tempos 1 e 3
      [0, 8].forEach(function (t3, k) { add({ t: t3 + (k ? 2 : 0), tipo: 'lead', nota: grau(f, ac + 7 + (k ? 2 : 4)), dur: 4, vol: 0.4 }); });
    }
    return { secao: nome, eventos: ev };
  }

  function proxima(faixa, compasso) {
    if (compasso < compassos()) return { faixa: faixa, compasso: compasso };
    return { faixa: (faixa + 1) % FAIXAS.length, compasso: 0 };
  }
  function andamento(f, nivel, i) { return f.bpm + (AJUSTE[nivel] || 0) + (i || 0); }

  return { FAIXAS: FAIXAS, ESTRUTURA: ESTRUTURA, escala: escala, grau: grau, partitura: partitura, compassos: compassos, proxima: proxima, andamento: andamento };
});
