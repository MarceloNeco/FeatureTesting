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
    { id: 'pista-brilhante', nome: { pt: 'Pista Brilhante', en: 'Glitter Floor' }, bpm: 126, tom: 57, modo: 'menor', acordes: [0, 5, 2, 6], verso: [0, 3, 0, 4], baixo: 'oitava', bateria: 'disco', lead: 'saw', ritmo: 0, arpejo: 'sobe', semente: 11 },
    { id: 'neon-no-ceu', nome: { pt: 'Neon no Céu', en: 'Neon Sky' }, bpm: 122, tom: 59, modo: 'menor', acordes: [0, 3, 6, 5], verso: [5, 6, 0, 0], baixo: 'sincopa', bateria: 'house', lead: 'pluck', ritmo: 1, arpejo: 'vai-volta', semente: 23 },
    { id: 'purpurina', nome: { pt: 'Purpurina', en: 'Glitter Rain' }, bpm: 128, tom: 55, modo: 'maior', acordes: [5, 3, 0, 4], verso: [0, 0, 3, 4], baixo: 'reto', bateria: 'electro', lead: 'square', ritmo: 2, arpejo: 'pula', semente: 37 },
    { id: 'coracao-disco', nome: { pt: 'Coração Disco', en: 'Disco Heart' }, bpm: 124, tom: 54, modo: 'menor', acordes: [0, 6, 5, 6], verso: [0, 2, 3, 4], baixo: 'galope', bateria: 'disco', lead: 'sino', ritmo: 3, arpejo: 'desce', semente: 41 },
    { id: 'noite-de-festa', nome: { pt: 'Noite de Festa', en: 'Party Night' }, bpm: 130, tom: 52, modo: 'maior', acordes: [0, 4, 5, 3], verso: [5, 3, 5, 4], baixo: 'oitava', bateria: 'electro', lead: 'saw', ritmo: 4, arpejo: 'sobe', semente: 53 },
    { id: 'pulo-alto', nome: { pt: 'Pulo Alto', en: 'Jump High' }, bpm: 120, tom: 56, modo: 'maior', acordes: [3, 4, 2, 5], verso: [0, 5, 1, 4], baixo: 'sincopa', bateria: 'funk', lead: 'pluck', ritmo: 5, arpejo: 'pula', semente: 67 },
    { id: 'bola-espelhada', nome: { pt: 'Bola Espelhada', en: 'Mirrorball' }, bpm: 127, tom: 50, modo: 'menor', acordes: [0, 6, 5, 4], verso: [0, 0, 5, 6], baixo: 'reto', bateria: 'house', lead: 'square', ritmo: 2, arpejo: 'vai-volta', semente: 79 },
    { id: 'verao-eletrico', nome: { pt: 'Verão Elétrico', en: 'Electric Summer' }, bpm: 125, tom: 53, modo: 'maior', acordes: [0, 5, 3, 4], verso: [3, 0, 3, 4], baixo: 'galope', bateria: 'disco', lead: 'saw', ritmo: 0, arpejo: 'desce', semente: 83 },
    { id: 'luzes-da-cidade', nome: { pt: 'Luzes da Cidade', en: 'City Lights' }, bpm: 129, tom: 58, modo: 'maior', acordes: [5, 4, 3, 4], verso: [0, 2, 3, 0], baixo: 'oitava', bateria: 'funk', lead: 'sino', ritmo: 3, arpejo: 'sobe', semente: 97 },
    { id: 'ate-o-sol-nascer', nome: { pt: 'Até o Sol Nascer', en: 'Till Sunrise' }, bpm: 123, tom: 55, modo: 'menor', acordes: [0, 2, 6, 3], verso: [5, 4, 0, 0], baixo: 'sincopa', bateria: 'electro', lead: 'saw', ritmo: 1, arpejo: 'pula', semente: 101 },
    { id: 'brisa-tropical', nome: { pt: 'Brisa Tropical', en: 'Tropical Breeze' }, bpm: 112, tom: 51, modo: 'maior', acordes: [0, 4, 5, 3], verso: [5, 3, 0, 4], baixo: 'sincopa', bateria: 'tropical', lead: 'flauta', ritmo: 5, arpejo: 'pula', semente: 113 },
    { id: 'neon-anos-80', nome: { pt: 'Neon Anos 80', en: '80s Neon' }, bpm: 118, tom: 52, modo: 'menor', acordes: [5, 6, 0, 0], verso: [0, 3, 5, 6], baixo: 'oitava', bateria: 'synthwave', lead: 'metal', ritmo: 3, arpejo: 'sobe', semente: 127 },
    { id: 'patins-de-ouro', nome: { pt: 'Patins de Ouro', en: 'Golden Skates' }, bpm: 114, tom: 58, modo: 'menor', acordes: [0, 3, 0, 4], verso: [0, 6, 5, 4], baixo: 'galope', bateria: 'funk', lead: 'metal', ritmo: 0, arpejo: 'vai-volta', swing: 0.16, semente: 131 },
    { id: 'confete-no-ar', nome: { pt: 'Confete no Ar', en: 'Confetti Air' }, bpm: 132, tom: 59, modo: 'maior', acordes: [0, 4, 5, 3], verso: [3, 4, 0, 5], baixo: 'reto', bateria: 'house', lead: 'sino', ritmo: 4, arpejo: 'desce', semente: 137 },
    { id: 'danca-no-telhado', nome: { pt: 'Dança no Telhado', en: 'Rooftop Dance' }, bpm: 120, tom: 57, modo: 'maior', acordes: [3, 0, 4, 5], verso: [0, 5, 3, 4], baixo: 'oitava', bateria: 'tropical', lead: 'pluck', ritmo: 2, arpejo: 'sobe', swing: 0.12, semente: 149 },
    { id: 'estrela-cadente', nome: { pt: 'Estrela Cadente', en: 'Shooting Star' }, bpm: 124, tom: 53, modo: 'menor', acordes: [5, 6, 0, 3], verso: [0, 2, 5, 6], baixo: 'sincopa', bateria: 'synthwave', lead: 'saw', ritmo: 1, arpejo: 'pula', swing: 0.1, semente: 151 }
  ];
  var ARPEJOS = { sobe: [0, 1, 2, 3], desce: [3, 2, 1, 0], 'vai-volta': [0, 1, 2, 3, 2, 1], pula: [0, 2, 1, 3] };

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
    funk: { bumbo: [0, 4, 7, 8, 12], palma: [4, 12], aberto: [6, 14], chimbal: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15], vChim: 0.22 },
    tropical: { bumbo: [0, 4, 8, 12], palma: [4, 12], aberto: [2, 10], chimbal: [1, 3, 5, 7, 9, 11, 13, 15], vChim: 0.24 },
    synthwave: { bumbo: [0, 8, 10], palma: [4, 12], aberto: [14], chimbal: [0, 2, 4, 6, 8, 10, 12, 14], vChim: 0.26 }
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
  function tetrade(f, d) { return [grau(f, d), grau(f, d + 2), grau(f, d + 4), grau(f, d + 6)]; }
  /* acorde "encadeado": escolhe a inversão que fica perto do meio da região, assim cada voz anda pouco de um
     acorde para o outro (como um tecladista faria), em vez de pular a mão inteira */
  function vozes(f, d) {
    var base = tetrade(f, d).map(function (n) { return n - 12 * Math.floor((n - f.tom) / 12); }), melhor = null, nota = Infinity;
    base.sort(function (a, b) { return a - b; });
    for (var inv = 0; inv < 4; inv++) for (var oit = -1; oit <= 0; oit++) {
      var v = base.map(function (n, k) { return n + (k < inv ? 12 : 0) + 12 * oit; }).sort(function (a, b) { return a - b; });
      var media = v.reduce(function (a, b) { return a + b; }, 0) / 4, sc = Math.abs(media - (f.tom + 7)) + 0.15 * (v[3] - v[0]);
      if (sc < nota) { nota = sc; melhor = v; }
    }
    return melhor;
  }

  /* frase de 2 compassos (32 passos) sobre 2 acordes, numa faixa de graus [lo, hi]; devolve a última nota */
  function frase(f, ritmo, acs, rnd, lo, hi, ant, termina, desloc, saida) {
    ritmo.forEach(function (r, k) {
      var s = r[0], ac = acs[Math.floor(s / 16)], d;
      if (termina && k === ritmo.length - 1) d = lo + ((f.acordes[0] - lo) % 7 + 7) % 7;   // fecha na tônica do refrão
      else if (s % 4 === 0) {                                  // tempo forte: nota do acorde mais perto
        var op = [ac, ac + 2, ac + 4, ac + 7, ac + 9, ac + 11, ac + 14].filter(function (x) { return x >= lo && x <= hi; });
        var dist = function (x) { return x === ant ? 3.5 : Math.abs(x - ant); };   // evita repetir a mesma nota
        op.sort(function (a, b) { return dist(a) - dist(b) || rnd() - 0.5; });
        d = op[rnd() < 0.65 ? 0 : Math.min(1, op.length - 1)];
      } else {                                                 // passagem: anda 1 ou 2 graus
        var passo = [1, 1, 2, -1, -1, -2, 3, -3][Math.floor(rnd() * 8)];
        d = ant + passo;
        if (d > hi || d < lo) d = ant - passo;                 // bateu no limite: quica de volta
        d = Math.max(lo, Math.min(hi, d));
      }
      saida.push({ s: s + desloc, d: d, dur: r[1] });
      ant = d;
    });
    return ant;
  }
  /* refrão: 8 compassos = A (frase), A' (mesmo ritmo, outros acordes), B (ritmo novo, mais agudo), A'' (fecha);
     verso: 8 compassos com ritmo e região próprios (mais grave), segunda metade variada */
  var cacheMel = {};
  function melodias(f) {
    if (cacheMel[f.id]) return cacheMel[f.id];
    var rnd = aleatorio(f.semente), A = RITMOS[f.ritmo], B = RITMOS[(f.ritmo + 3) % RITMOS.length], V = RITMOS[(f.ritmo + 1) % RITMOS.length];
    var ac = f.acordes, vs = f.verso, refrao = [], verso = [], ant = 9 + Math.floor(rnd() * 3);
    ant = frase(f, A, [ac[0], ac[1]], rnd, 7, 14, ant, false, 0, refrao);
    ant = frase(f, A, [ac[2], ac[3]], rnd, 7, 14, ant, false, 32, refrao);
    ant = frase(f, B, [ac[0], ac[1]], rnd, 9, 16, ant + 2, false, 64, refrao);
    frase(f, A, [ac[2], ac[3]], rnd, 7, 14, ant, true, 96, refrao);
    ant = 5 + Math.floor(rnd() * 3);
    ant = frase(f, V, [vs[0], vs[1]], rnd, 3, 11, ant, false, 0, verso);
    ant = frase(f, V, [vs[2], vs[3]], rnd, 3, 11, ant, false, 32, verso);
    ant = frase(f, V, [vs[0], vs[1]], rnd, 4, 12, ant, false, 64, verso);
    frase(f, V, [vs[2], vs[3]], rnd, 3, 11, ant, false, 96, verso);
    cacheMel[f.id] = { refrao: refrao, verso: verso };
    return cacheMel[f.id];
  }

  function secaoDo(c) {
    var n = 0;
    for (var k = 0; k < ESTRUTURA.length; k++) { if (c < n + ESTRUTURA[k][1]) return { nome: ESTRUTURA[k][0], i: c - n, len: ESTRUTURA[k][1] }; n += ESTRUTURA[k][1]; }
    return { nome: 'refrao2', i: 0, len: 8 };
  }
  function compassos() { return ESTRUTURA.reduce(function (a, s) { return a + s[1]; }, 0); }

  function partitura(f0, c) {
    var sec = secaoDo(c), nome = sec.nome, ev = [], b = BATERIAS[f0.bateria];
    var tom = f0.tom + (nome === 'refrao2' ? 2 : 0);                      // último refrão sobe um tom
    var f = { tom: tom, modo: f0.modo, acordes: f0.acordes, id: f0.id };
    var cheio = nome === 'refrao' || nome === 'refrao2';
    var prog = cheio ? f0.acordes : nome === 'pausa' ? [f0.acordes[3], f0.acordes[2], f0.acordes[1], f0.acordes[0]] : f0.verso;
    var ac = prog[sec.i % 4], fimDe4 = sec.i % 4 === 3;
    var add = function (o) { ev.push(o); };
    var ritmoBumbo = b.bumbo.slice();
    if (f0.bateria === 'electro' && c % 2 === 1) ritmoBumbo.push(14);

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
      if (fimDe4) [12, 13, 14, 15].forEach(function (t) { add({ t: t, tipo: 'caixa', dur: 1, vol: 0.45 + 0.1 * (t - 12) }); });   // virada
      if (cheio && !fimDe4) { var rg = aleatorio(f0.semente * 31 + c); [3, 7, 10, 11, 15].forEach(function (t) { if (t === 15 || rg() < 0.45) add({ t: t, tipo: 'caixa', dur: 1, vol: 0.14 + 0.08 * rg() }); }); }   // notas fantasmas
    } else if (nome === 'intro' && sec.i >= 2) b.chimbal.forEach(function (t) { add({ t: t, tipo: 'chimbal', dur: 1, vol: b.vChim * 0.8 }); });
    if ((nome === 'subida' || nome === 'pausa') && sec.i === sec.len - 1)
      for (var t = 0; t < 16; t++) add({ t: t, tipo: 'caixa', dur: 1, vol: 0.2 + 0.7 * t / 15 });
    if (nome === 'subida' && sec.i === 0) add({ t: 0, tipo: 'riser', dur: 64, vol: 0.5 });
    if (cheio && sec.i === 0) add({ t: 0, tipo: 'crash', dur: 8, vol: 0.6 });

    // acordes (com sétima): tapete o compasso inteiro (filtro abre na subida) + "stabs" no contratempo
    var filtro = nome === 'intro' ? 0.25 + 0.1 * sec.i : nome === 'subida' ? 0.35 + 0.65 * (sec.i + 1) / 4 : nome === 'pausa' ? 0.45 : 1;
    add({ t: 0, tipo: 'acorde', notas: vozes(f, ac), dur: 16, vol: cheio ? 0.55 : 0.45, filtro: filtro, estilo: 'tapete' });
    if (cheio || nome === 'verso') [2, 6, 10, 14].forEach(function (t2) { add({ t: t2, tipo: 'acorde', notas: tetrade(f, ac + 7).slice(0, 3), dur: 1, vol: cheio ? 0.45 : 0.3, filtro: 1, estilo: 'stab' }); });

    // arpejo: notas do acorde em sequência (colcheias no verso e na intro, semicolcheias no refrão e na subida)
    if (cheio || nome === 'verso' || nome === 'subida' || (nome === 'intro' && sec.i >= 2)) {
      var ordem = ARPEJOS[f0.arpejo], notasA = tetrade(f, ac + 7), denso = cheio || nome === 'subida';
      for (var a = 0, k2 = 0; a < 16; a += denso ? 1 : 2, k2++)
        add({ t: a, tipo: 'arpejo', nota: notasA[ordem[k2 % ordem.length]], dur: 1, vol: (cheio ? 0.3 : 0.22) * (nome === 'subida' ? 0.5 + 0.5 * sec.i / 3 : 1) });
    }

    // baixo (com caminhada no fim de cada 4 compassos)
    if (cheio || nome === 'verso' || (nome === 'subida' && sec.i < 3)) {
      BAIXOS[f0.baixo].forEach(function (p) {
        if (nome === 'subida' && p[0] % 4) return;   // na subida o baixo só marca o tempo
        if (fimDe4 && nome !== 'subida' && p[0] >= 12) return;
        var d = ac + (p[1] === 'q' ? 4 : 0), nota = grau(f, d) - 24 + (p[1] === 1 ? 12 : 0);
        add({ t: p[0], tipo: 'baixo', nota: nota, dur: p[2], vol: 0.9 });
      });
      if (fimDe4 && nome !== 'subida') [0, 1, 2, 3].forEach(function (k3) { add({ t: 12 + k3, tipo: 'baixo', nota: grau(f, ac + k3) - 24, dur: 1, vol: 0.85 }); });
    }

    // melodia: refrão (8 compassos A A' B A''), verso (8 compassos), pausa (B suave)
    var mel = melodias(f0), lista = null, base = 0, vol = 0.8;
    if (cheio) { lista = mel.refrao; base = sec.i * 16; }
    else if (nome === 'verso') { lista = mel.verso; base = sec.i * 16; vol = 0.5; }
    else if (nome === 'pausa') { lista = mel.refrao; base = 64 + (sec.i % 2) * 16; vol = 0.45; }
    if (lista) lista.forEach(function (n) {
      if (n.s >= base && n.s < base + 16) {
        add({ t: n.s - base, tipo: 'lead', nota: grau(f, n.d), dur: n.dur, vol: vol });
        if (nome === 'refrao2') {
          add({ t: n.s - base, tipo: 'lead', nota: grau(f, n.d) + 12, dur: n.dur, vol: 0.3 });
          add({ t: n.s - base, tipo: 'harmonia', nota: grau(f, n.d - 2), dur: n.dur, vol: 0.4 });   // segunda voz, uma terça abaixo
        }
      }
    });
    return { secao: nome, tom: tom, swing: f0.swing || 0, eventos: ev };
  }

  function proxima(faixa, compasso) {
    if (compasso < compassos()) return { faixa: faixa, compasso: compasso };
    return { faixa: (faixa + 1) % FAIXAS.length, compasso: 0 };
  }
  function andamento(f, nivel, i) { return f.bpm + (AJUSTE[nivel] || 0) + (i || 0); }

  /* ---------- abertura: rock elétrico rápido (tela de início) ----------
     Guitarra distorcida em semicolcheias alternando uma nota pedal (a do acorde) com notas que sobem e
     descem — técnica de riff de rock; as notas são próprias. Começa só com a guitarra, entra a bateria com
     virada de tons e explode com acordes "power", baixo e melodia de sintetizador. Toca em laço. */
  var ABERTURA = { id: 'abertura', nome: { pt: 'Abertura Peluqueria', en: 'Peluqueria Opening' }, bpm: 138, tom: 52, modo: 'menor', acordes: [0, 5, 3, 6], semente: 7 };
  var ESTRUTURA_ABERTURA = [['riff', 4], ['entrada', 4], ['tudo', 8], ['ponte', 4], ['tudo2', 8]];
  var RIFF = [[2, 3, 4, 3, 2, 3, 4, 5], [4, 5, 6, 5, 4, 5, 6, 7], [2, 3, 4, 6, 4, 3, 2, 1], [7, 6, 5, 4, 3, 4, 5, 6]];
  var melAbertura = null;
  function compassosAbertura() { return ESTRUTURA_ABERTURA.reduce(function (a, s) { return a + s[1]; }, 0); }
  function proximaAbertura(c) { return (c + 1) % compassosAbertura(); }
  function abertura(c) {
    var f = ABERTURA, n = 0, sec = null, ev = [], add = function (o) { ev.push(o); };
    for (var k = 0; k < ESTRUTURA_ABERTURA.length; k++) { var q = ESTRUTURA_ABERTURA[k]; if (c < n + q[1]) { sec = { nome: q[0], i: c - n, len: q[1] }; break; } n += q[1]; }
    if (!sec) sec = { nome: 'tudo2', i: 0, len: 8 };
    var nome = sec.nome, cheio = nome === 'tudo' || nome === 'tudo2', fimSec = sec.i === sec.len - 1;
    var ac = nome === 'riff' ? 0 : f.acordes[sec.i % 4], variante = RIFF[sec.i % 4];
    if (!melAbertura) { melAbertura = []; var rnd = aleatorio(f.semente), ant = 11; ant = frase(f, RITMOS[4], [f.acordes[0], f.acordes[1]], rnd, 9, 16, ant, false, 0, melAbertura); ant = frase(f, RITMOS[5], [f.acordes[2], f.acordes[3]], rnd, 9, 16, ant, false, 32, melAbertura); ant = frase(f, RITMOS[4], [f.acordes[0], f.acordes[1]], rnd, 10, 17, ant, false, 64, melAbertura); frase(f, RITMOS[2], [f.acordes[2], f.acordes[3]], rnd, 9, 16, ant, true, 96, melAbertura); }

    // guitarra: pedal nos passos pares, nota que anda nos ímpares (na ponte, só colcheias e mais baixa)
    for (var t = 0; t < 16; t += nome === 'ponte' ? 2 : 1) {
      var d = t % 2 === 0 ? ac : ac + variante[(t - 1) / 2 | 0];
      add({ t: t, tipo: 'guitarra', nota: grau(f, d), dur: 1, vol: nome === 'riff' ? 0.55 + 0.15 * sec.i : nome === 'ponte' ? 0.4 : 0.75 });
    }
    if (nome === 'riff' && sec.i === 0) add({ t: 0, tipo: 'riser', dur: 64, vol: 0.45 });
    if (nome === 'riff' && fimSec) for (var r = 8; r < 16; r++) add({ t: r, tipo: 'caixa', dur: 1, vol: 0.3 + 0.08 * (r - 8) });

    // bateria
    if (nome === 'entrada') {
      [0, 4, 8, 12].forEach(function (x) { add({ t: x, tipo: 'bumbo', dur: 1, vol: 1 }); });
      [0, 2, 4, 6, 8, 10, 12, 14].forEach(function (x) { add({ t: x, tipo: 'chimbal', dur: 1, vol: 0.35 }); });
      if (sec.i >= 2) [4, 12].forEach(function (x) { add({ t: x, tipo: 'caixa', dur: 1, vol: 0.8 }); });
    }
    if (cheio) {
      [0, 3, 8, 10].forEach(function (x) { add({ t: x, tipo: 'bumbo', dur: 1, vol: 1 }); });
      [4, 12].forEach(function (x) { add({ t: x, tipo: 'caixa', dur: 1, vol: 0.95 }); });
      [0, 2, 4, 6, 8, 10, 12].forEach(function (x) { add({ t: x, tipo: 'chimbal', dur: 1, vol: 0.4 }); });
      add({ t: 14, tipo: 'aberto', dur: 2, vol: 0.5 });
      if (sec.i === 0 || sec.i === 4) add({ t: 0, tipo: 'crash', dur: 8, vol: 0.8 });
    }
    if (nome === 'ponte') [0, 8].forEach(function (x) { add({ t: x, tipo: 'bumbo', dur: 1, vol: 0.9 }); });
    if (fimSec && nome !== 'riff') [8, 9, 10, 11, 12, 13, 14, 15].forEach(function (x, k2) { add({ t: x, tipo: 'tom', dur: 1, vol: 0.7 + 0.04 * k2, altura: 1 - k2 / 8 }); });   // virada de tons, do agudo ao grave

    // acordes "power" (tônica, quinta, oitava), baixo e melodia
    if (cheio || nome === 'ponte') {
      var raiz = grau(f, ac), pw = [raiz, raiz + 7, raiz + 12];
      if (nome === 'ponte') add({ t: 0, tipo: 'power', notas: pw, dur: 16, vol: 0.5 });
      else { add({ t: 0, tipo: 'power', notas: pw, dur: 6, vol: 0.55 }); add({ t: 8, tipo: 'power', notas: pw, dur: 6, vol: 0.55 }); }
    }
    if (cheio || nome === 'entrada') for (var b2 = 0; b2 < 16; b2 += 2) add({ t: b2, tipo: 'baixo', nota: grau(f, ac) - 24 + (b2 % 8 === 6 ? 12 : 0), dur: 2, vol: 0.85 });
    if (cheio) {
      var base = (sec.i % 8) * 16;
      melAbertura.forEach(function (m) { if (m.s >= base && m.s < base + 16) {
        add({ t: m.s - base, tipo: 'lead', nota: grau(f, m.d), dur: m.dur, vol: 0.75 });
        if (nome === 'tudo2') add({ t: m.s - base, tipo: 'lead', nota: grau(f, m.d) + 12, dur: m.dur, vol: 0.3 });
      } });
    }
    return { secao: nome, tom: f.tom, eventos: ev };
  }

  return { ABERTURA: ABERTURA, ESTRUTURA_ABERTURA: ESTRUTURA_ABERTURA, abertura: abertura, compassosAbertura: compassosAbertura, proximaAbertura: proximaAbertura,
    FAIXAS: FAIXAS, ESTRUTURA: ESTRUTURA, escala: escala, grau: grau, partitura: partitura, compassos: compassos, proxima: proxima, andamento: andamento };
});
