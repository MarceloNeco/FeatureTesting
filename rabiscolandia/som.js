/* Rabiscolândia — música e sons feitos na hora pelo navegador (WebAudio). Nenhum arquivo de áudio.
   Mesmo motor da Purpurina (som.js de lá), com músicas e timbres próprios para DESENHAR: alegres mas
   tranquilas, porque criança desenha por muito tempo. Quatro músicas compostas aqui (nenhuma copiada):
   caixinha de música, marimba, ukulele com assobio e um lo-fi fofo com sininhos.
   O navegador só deixa tocar depois de um toque: iniciar() é chamado no 1º toque.
   Música e efeitos têm volumes e botões separados; a música fica sempre mais baixinha que os efeitos.
   Carrega no Node sem quebrar (para os testes): nada de "document" no carregamento, e sem AudioContext
   tudo vira silêncio, sem erro. */
(function (raiz, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else raiz.DesenhoSom = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var ac = null, mestre = null, efGanho = null, musGanho = null, macio = null;
  var querMusica = false, efLigados = true, timer = null, prox = 0, passo = 0, faixa = 0, volta = 0;
  var escondida = false, vigiando = false;
  var VOL_MUSICA = 0.24, VOL_EFEITOS = 0.7;   // música sempre mais baixa que os efeitos

  /* As músicas. Cada uma tem estrofe (A) e refrão (B) de 8 compassos, com um acorde por compasso
     (o número é o grau da escala: 0 = dó, 3 = fá, 4 = sol, 5 = lá... no tom da música) e a melodia
     escrita compasso a compasso: "grau:duração", duração em colcheias (meio tempo); "r" é pausa.
     Graus: 0 a 6 é a escala, 7 é a mesma nota uma oitava acima, números negativos descem.
     A forma é sempre: introdução, A, B, A, B, ponte, B e um compasso final (respiro antes da próxima) — e cada volta muda alguma coisa
     (enfeites, segunda voz, acompanhamento mais cheio), para não cansar. */
  var MUSICAS = [
    { nome: 'Caixinha de Lápis', clima: 'valsinha de caixinha de música (celesta), bem calminha',
      bpm: 96, tempos: 3, tom: 65, balanco: 0, timbre: 'caixinha',
      A: { acordes: [0, 0, 5, 5, 3, 4, 0, 4],
        mel: ['4:2 2:1 4:1 7:2', '5:2 4:4', '5:2 7:1 5:1 4:2', '2:6', '3:2 5:1 7:1 9:2', '8:2 6:2 4:2', '7:3 4:1 2:2', '1:2 4:4'] },
      B: { acordes: [3, 4, 2, 5, 1, 4, 0, 0],
        mel: ['7:2 9:2 7:1 5:1', '8:4 r:2', '6:2 8:2 6:1 4:1', '7:6', '5:2 3:1 5:1 8:2', '8:2 7:2 6:2', '7:2 4:2 9:2', '7:6'] },
      ponte: [5, 3, 0, 4] },
    { nome: 'Marimba Saltitante', clima: 'marimba pulando, alegre e leve, com bloquinho de madeira',
      bpm: 112, tempos: 4, tom: 67, balanco: 0, timbre: 'marimba',
      A: { acordes: [0, 3, 0, 4, 0, 3, 4, 0],
        mel: ['0:1 2:1 4:1 2:1 4:2 7:2', '5:1 7:1 5:1 3:1 5:4', '4:1 2:1 4:1 7:1 9:2 7:2', '8:2 6:2 4:4',
          '0:1 2:1 4:1 2:1 4:2 7:2', '9:1 7:1 5:1 7:1 9:4', '8:1 6:1 4:1 6:1 8:2 6:2', '7:4 r:4'] },
      B: { acordes: [5, 3, 0, 4, 5, 3, 1, 4],
        mel: ['9:2 7:1 9:1 12:4', '10:2 9:1 7:1 5:4', '7:1 9:1 11:2 9:2 7:2', '8:2 11:2 8:4',
          '9:2 7:1 9:1 12:4', '10:1 9:1 10:1 12:1 10:4', '8:2 5:2 3:2 8:2', '6:2 8:2 11:4'] },
      ponte: [5, 3, 1, 4] },
    { nome: 'Ukulele no Quintal', clima: 'ukulele e assobio, com palminhas leves, de passeio',
      bpm: 104, tempos: 4, tom: 60, balanco: 0.1, timbre: 'uke',
      A: { acordes: [0, 4, 5, 3, 0, 4, 3, 0],
        mel: ['4:3 2:1 4:2 7:2', '6:3 4:1 1:4', '2:2 5:2 7:2 5:2', '3:6 r:2',
          '4:3 2:1 4:2 9:2', '8:3 6:1 4:4', '5:2 3:2 5:1 7:3', '7:6 r:2'] },
      B: { acordes: [3, 0, 4, 5, 3, 0, 1, 4],
        mel: ['7:2 7:1 9:1 7:2 5:2', '4:4 r:2 4:1 7:1', '8:2 8:1 9:1 8:2 6:2', '7:6 r:2',
          '7:2 7:1 9:1 10:2 9:2', '7:2 4:2 2:2 4:2', '3:2 5:2 8:4', '6:4 r:4'] },
      ponte: [5, 3, 0, 4] },
    { nome: 'Nuvem de Giz', clima: 'lo-fi fofo com sininhos e pianinho, bem relaxado',
      bpm: 90, tempos: 4, tom: 62, balanco: 0.2, timbre: 'lofi',
      A: { acordes: [1, 4, 0, 5, 1, 4, 0, 5],
        mel: ['5:3 3:1 r:2 7:2', '6:4 4:2 r:2', '4:2 6:2 9:4', '7:6 r:2',
          '5:3 3:1 5:2 8:2', '10:3 8:1 6:4', '6:2 4:2 2:2 4:2', '2:8'] },
      B: { acordes: [3, 2, 1, 0, 3, 2, 1, 4],
        mel: ['9:2 7:2 5:2 9:2', '8:4 6:2 r:2', '7:2 5:2 3:2 5:2', '4:6 r:2',
          '9:2 10:2 12:4', '11:3 9:1 8:4', '7:2 8:2 7:2 5:2', '6:4 r:4'] },
      ponte: [3, 2, 1, 4] }
  ];
  var FORMA = [['I', 2], ['A', 8], ['B', 8], ['A', 8], ['B', 8], ['P', 4], ['B', 8], ['F', 1]];
  var TRANSPOE = [0, 2, -2];   // a cada volta inteira pelas músicas, o tom muda um pouquinho
  var ESCALA = [0, 2, 4, 5, 7, 9, 11];

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function semitom(g) { var o = Math.floor(g / 7); return 12 * o + ESCALA[g - o * 7]; }

  // "4:2 2:1 r:3" → uma casa por colcheia, com a nota que começa ali (ou null)
  function lerMelodia(txt, casas) {
    var notas = [], ocupado = [], pos = 0, i;
    for (i = 0; i < casas; i++) { notas.push(null); ocupado.push(false); }
    txt.split(' ').forEach(function (pedaco) {
      var p = pedaco.split(':'), d = +p[1];
      if (p[0] !== 'r' && pos < casas) {
        notas[pos] = { g: +p[0], d: d };
        for (i = pos; i < Math.min(pos + Math.min(d, 2), casas); i++) ocupado[i] = true;
      }
      pos += d;
    });
    return { notas: notas, ocupado: ocupado };
  }
  // a música inteira, compasso por compasso (feita uma vez só e guardada)
  var roteiros = [];
  function roteiro(i) {
    if (roteiros[i]) return roteiros[i];
    var mu = MUSICAS[i], casas = mu.tempos * 2, vezes = {}, r = [];
    FORMA.forEach(function (f) {
      var sec = f[0];
      vezes[sec] = (vezes[sec] || 0) + 1;
      for (var k = 0; k < f[1]; k++) {
        var acorde = sec === 'A' || sec === 'B' ? mu[sec].acordes[k] : sec === 'P' ? mu.ponte[k] : sec === 'I' ? [0, 4][k] : 0;
        var mel = sec === 'A' || sec === 'B' ? mu[sec].mel[k] : sec === 'F' && k === 0 ? '7:' + casas : 'r:' + casas;
        r.push({ sec: sec, vez: vezes[sec], i: k, acorde: acorde, mel: lerMelodia(mel, casas) });
      }
    });
    roteiros[i] = r;
    return r;
  }

  // ---------- o aparelho de som ----------
  function retomar() { if (ac && ac.resume && ac.state !== 'running') { var p = ac.resume(); if (p && p.catch) p.catch(function () {}); } }
  function suspender() { if (ac && ac.suspend && ac.state === 'running') { var p = ac.suspend(); if (p && p.catch) p.catch(function () {}); } }
  function iniciar() {
    if (ac) { if (!escondida) retomar(); return; }
    var AC = typeof AudioContext !== 'undefined' ? AudioContext : typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    // compressor bem manso no fim: nada de susto no ouvido
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.25;
    comp.connect(ac.destination);
    mestre = ac.createGain(); mestre.gain.value = 0.9; mestre.connect(comp);
    efGanho = ac.createGain(); efGanho.gain.value = efLigados ? VOL_EFEITOS : 0; efGanho.connect(mestre);
    vigiarTela();
    if (querMusica) comecar();
  }
  function tom(tipo, f, ini, dur, vol, destino, fFim, ataque) {
    if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain(), a = Math.min(ataque || 0.006, dur / 2);
    o.type = tipo; o.frequency.setValueAtTime(f, ini);
    if (fFim) o.frequency.exponentialRampToValueAtTime(fFim, ini + dur);
    g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(vol, ini + a); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    o.connect(g); g.connect(destino || efGanho); o.start(ini); o.stop(ini + dur + 0.05);
  }
  var ruidoBuf = null;
  function ruido(ini, dur, vol, filtro, freq, destino, fFim) {
    if (!ac) return;
    if (!ruidoBuf) { ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = ruidoBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruidoBuf; f.type = filtro; f.frequency.setValueAtTime(freq, ini);
    if (fFim) f.frequency.exponentialRampToValueAtTime(fFim, ini + dur);
    g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(vol, ini + Math.min(0.004, dur / 2)); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    s.connect(f); f.connect(g); g.connect(destino || efGanho); s.start(ini, Math.random() * 0.5); s.stop(ini + dur + 0.05);
  }

  // ---------- os instrumentos ----------
  // sininho: seno + uma pitada de harmônico
  function sino(f, ini, dur, vol, destino) { tom('sine', f, ini, dur, vol, destino); tom('sine', f * 2.01, ini, dur * 0.5, vol * 0.3, destino); }
  // caixinha de música / celesta: soa comprido e tem um "tlim" agudinho no começo
  function caixinha(f, ini, vol) { tom('sine', f, ini, 1.5, vol, musGanho, 0, 0.003); tom('sine', f * 2, ini, 0.45, vol * 0.22, musGanho, 0, 0.003); tom('sine', f * 3, ini, 0.12, vol * 0.1, musGanho, 0, 0.002); }
  // marimba: madeira macia, curtinha, com o harmônico alto típico
  function marimba(f, ini, vol) { tom('sine', f, ini, 0.5, vol, musGanho, 0, 0.003); tom('sine', f * 3.93, ini, 0.07, vol * 0.22, musGanho, 0, 0.002); tom('triangle', f, ini, 0.1, vol * 0.25, musGanho, 0, 0.002); }
  // corda beliscada (ukulele): o lado "brilhante" passa pelo filtro macio
  function corda(f, ini, vol) { tom('triangle', f, ini, 0.8, vol, musGanho, 0, 0.004); tom('sawtooth', f, ini, 0.35, vol * 0.4, macio, 0, 0.004); }
  // pianinho elétrico abafado (lo-fi)
  function pianinho(f, ini, dur, vol) { tom('sine', f, ini, dur, vol, macio, 0, 0.012); tom('sine', f * 2, ini, dur * 0.35, vol * 0.18, macio, 0, 0.01); }
  // assobio: seno com vibrato, entra e sai devagar
  function assobio(f, ini, dur, vol) {
    if (!ac) return;
    var o = ac.createOscillator(), lfo = ac.createOscillator(), prof = ac.createGain(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, ini);
    lfo.frequency.value = 5.2; prof.gain.value = f * 0.007; lfo.connect(prof); prof.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, ini); g.gain.linearRampToValueAtTime(vol, ini + 0.05);
    g.gain.linearRampToValueAtTime(vol * 0.7, ini + dur * 0.75); g.gain.linearRampToValueAtTime(0.0001, ini + dur);
    o.connect(g); g.connect(musGanho); o.start(ini); lfo.start(ini); o.stop(ini + dur + 0.05); lfo.stop(ini + dur + 0.05);
  }
  function baixo(f, ini, dur, vol) { tom('sine', f, ini, dur, vol, musGanho, 0, 0.01); tom('triangle', f, ini, dur * 0.5, vol * 0.25, musGanho, 0, 0.01); }
  // percussão bem leve
  function bumbo(ini, vol) { tom('sine', 115, ini, 0.22, vol, musGanho, 45, 0.004); }
  function caixaMacia(ini, vol) { ruido(ini, 0.13, vol, 'bandpass', 1700, musGanho); tom('triangle', 190, ini, 0.06, vol * 0.5, musGanho, 0, 0.002); }
  function chimbal(ini, vol) { ruido(ini, 0.03, vol, 'highpass', 8000, musGanho); }
  function chocalho(ini, vol) { ruido(ini, 0.06, vol, 'bandpass', 5500, musGanho); }
  function bloquinho(ini, vol) { tom('sine', 1150, ini, 0.06, vol, musGanho, 0, 0.002); tom('sine', 1720, ini, 0.03, vol * 0.4, musGanho, 0, 0.002); }
  function palminha(ini, vol) { ruido(ini, 0.07, vol, 'bandpass', 1400, musGanho); ruido(ini + 0.012, 0.06, vol * 0.7, 'bandpass', 2100, musGanho); }
  function chiado(ini) { if (Math.random() < 0.45) ruido(ini + Math.random() * 0.1, 0.006, 0.02 + Math.random() * 0.03, 'highpass', 2500, musGanho); }

  // ---------- os arranjos (o acompanhamento de cada música, colcheia por colcheia) ----------
  // c = { pos, t, e (duração da colcheia), b (o compasso), nt(grau) → Hz, a (notas do acorde), cheio }
  var ARRANJOS = {
    caixinha: function (c) {   // valsa: "um-dois-três" (baixo e dois toquinhos), arpejo de caixinha no refrão
      var p = c.pos, a = c.a, sec = c.b.sec;
      if (p === 0) baixo(c.nt(a[0] - 14), c.t, c.e * 3, 0.22);
      if ((p === 2 || p === 4) && sec !== 'P') { caixinha(c.nt(a[1] - 7), c.t, 0.035); caixinha(c.nt(a[2] - 7), c.t, 0.03); }
      if (c.cheio && p % 2 === 1) caixinha(c.nt(a[(p >> 1) % 3] + 14), c.t, 0.022);
      if (sec === 'I' || sec === 'P') caixinha(c.nt(a[p % 3] + (p >= 3 ? 14 : 7)), c.t, 0.04);
      if (sec === 'B' && p === 0) sino(4186, c.t, 0.5, 0.006, musGanho);
    },
    marimba: function (c) {   // baixo pulando, bloquinho no 2 e no 4, chocalho e bumbo no refrão
      var p = c.pos, a = c.a, sec = c.b.sec, refrao = sec === 'B';
      if (p === 0 || p === 3) baixo(c.nt(a[0] - 14), c.t, c.e * 1.4, 0.24);
      if (p === 4) baixo(c.nt(a[2] - 14), c.t, c.e * 1.4, 0.2);
      if (p === 6 && c.cheio) baixo(c.nt(a[0] - 7), c.t, c.e, 0.12);
      if ((p === 2 || p === 6) && sec !== 'P') bloquinho(c.t, 0.045);
      if (c.cheio) chocalho(c.t, p % 2 ? 0.025 : 0.035);
      if (refrao && (p === 0 || p === 4)) bumbo(c.t, 0.17);
      if ((p === 1 || p === 5) && sec !== 'P') { marimba(c.nt(a[1] - 7), c.t, 0.045); marimba(c.nt(a[2] - 7), c.t, 0.04); }
      if (sec === 'I' || sec === 'P') marimba(c.nt(a[p % 3] + (p >= 4 ? 7 : 0)), c.t, 0.06);
    },
    uke: function (c) {   // batida de ukulele (baixo-baixo-cima-cima-baixo-cima), palminhas no 2 e no 4
      var p = c.pos, a = c.a, sec = c.b.sec, refrao = sec === 'B';
      var batida = c.cheio ? [0, 2, 3, 5, 6, 7] : sec === 'P' ? [0] : [0, 3, 4, 6];
      if (batida.indexOf(p) >= 0) {
        var pra = p === 0 || p === 2 || p === 6 || (!c.cheio && p === 4);   // para baixo (grave → agudo) ou para cima
        var cordas = [a[0], a[1], a[2], a[0] + 7], vol = pra ? 0.05 : 0.032;
        if (!pra) cordas = [a[0] + 7, a[2], a[1]];
        cordas.forEach(function (g, k) { corda(c.nt(g), c.t + k * 0.013, vol); });
      }
      if (p === 0) baixo(c.nt(a[0] - 14), c.t, c.e * 3, 0.2);
      if (p === 4 && sec !== 'P') baixo(c.nt(a[2] - 14), c.t, c.e * 3, 0.16);
      if (c.cheio && (p === 2 || p === 6)) palminha(c.t, 0.07);
      if (refrao) { chocalho(c.t, p % 2 ? 0.02 : 0.03); if (p === 0 || p === 4) bumbo(c.t, 0.15); }
      if (sec === 'P' && p % 2 === 0) sino(c.nt(a[(p >> 1) % 3] + 14), c.t, 0.8, 0.03, musGanho);
    },
    lofi: function (c) {   // pianinho com sétima, baixo redondo, bateria "boom-bap" de travesseiro e chiado de disco
      var p = c.pos, a = c.a, sec = c.b.sec, calmo = sec === 'I' || sec === 'P';
      if (p === 0) a.forEach(function (g, k) { pianinho(c.nt(g - 7), c.t + k * 0.018, c.e * 7, 0.045); });
      if (p === 5 && c.cheio) { pianinho(c.nt(a[1] - 7), c.t, c.e * 3, 0.03); pianinho(c.nt(a[3] - 7), c.t, c.e * 3, 0.03); }
      if (p === 0) baixo(c.nt(a[0] - 14), c.t, c.e * 3, 0.26);
      if (p === 3) baixo(c.nt(a[2] - 14), c.t, c.e * 1.5, 0.18);
      if (!calmo) {
        if (p === 0) bumbo(c.t, 0.2);
        if (p === 3) bumbo(c.t, 0.13);
        if (p === 2 || p === 6) caixaMacia(c.t, 0.09);
        chimbal(c.t, p % 2 ? 0.016 : 0.026);
      } else if (p % 2 === 0) chimbal(c.t, 0.014);
      chiado(c.t);
      if (sec === 'B' && p === 7) sino(c.nt(a[3] + 14), c.t, 0.9, 0.022, musGanho);
      if (calmo && p % 2 === 0) sino(c.nt(a[(p >> 1) % 4] + 7), c.t, 1.1, 0.05, musGanho);
    }
  };
  // a voz da melodia de cada música
  var VOZES = {
    caixinha: function (f, t, dur, vol) { caixinha(f, t, vol * 0.75); },
    marimba: function (f, t, dur, vol, e) {   // nota comprida na marimba vira "rufo" de toquinhos
      marimba(f, t, vol);
      for (var k = 1; dur > e * 2.5 && k < Math.round(dur / e); k++) marimba(f, t + k * e, vol * 0.45);
    },
    uke: function (f, t, dur, vol) { assobio(f, t, Math.max(dur * 0.95, 0.15), vol * 0.55); },
    lofi: function (f, t, dur, vol) { sino(f, t, Math.min(dur * 1.6, 1.8), vol * 0.45, musGanho); pianinho(f, t, dur, vol * 0.25); }
  };

  function tocarColcheia(mu, b, pos, t, e) {
    var base = mu.tom + TRANSPOE[volta % TRANSPOE.length], r = b.acorde;
    var c = { pos: pos, t: t, e: e, b: b, cheio: b.sec === 'B' || (b.sec === 'A' && b.vez > 1),
      a: mu.timbre === 'lofi' ? [r, r + 2, r + 4, r + 6] : [r, r + 2, r + 4],
      nt: function (g) { return hz(base + semitom(g)); } };
    if (b.sec === 'F') {   // final: acorde da casa, nota longa e um respiro antes da próxima música
      if (b.i === 0 && pos === 0) {
        baixo(c.nt(-14), t, e * 6, 0.22);
        [0, 2, 4, 7].forEach(function (g, k) { sino(c.nt(g + 7), t + k * 0.09, 1.4, 0.03, musGanho); });
      }
    } else ARRANJOS[mu.timbre](c);
    var m = b.mel.notas[pos], vol = 0.2;
    if (m) {
      VOZES[mu.timbre](c.nt(m.g), t, m.d * e, vol, e);
      if (b.sec === 'B' && b.vez > 1) VOZES[mu.timbre](c.nt(m.g - 2), t, m.d * e, vol * 0.45, e);        // segunda voz
      if (b.sec === 'B' && b.vez > 2) sino(c.nt(m.g + 7), t, Math.min(m.d * e * 1.5, 1.2), 0.02, musGanho); // brilho
    } else if (b.sec === 'A' && b.vez > 1 && !b.mel.ocupado[pos]) {
      sino(c.nt(c.a[pos % 3] + 7), t, 0.6, 0.025, musGanho);   // na volta da estrofe, sininhos respondem
    }
  }

  // ---------- o relógio da música (agenda as notas um pouquinho antes, sem travar a tela) ----------
  function novaCorrente() {   // cada vez que a música começa, um "cano" novo (o velho some suave)
    musGanho = ac.createGain(); musGanho.gain.value = VOL_MUSICA; musGanho.connect(mestre);
    macio = ac.createBiquadFilter(); macio.type = 'lowpass'; macio.frequency.value = 2200; macio.Q.value = 0.5; macio.connect(musGanho);
  }
  function calar() {
    if (!musGanho) return;
    var g = musGanho, f = macio;
    musGanho = null; macio = null;
    g.gain.setTargetAtTime(0, ac.currentTime, 0.06);
    setTimeout(function () { try { f.disconnect(); g.disconnect(); } catch (e) {} }, 800);
  }
  function agendar() {
    if (!ac || !musGanho) return;
    if (prox < ac.currentTime - 0.1) prox = ac.currentTime + 0.05;   // ficou muito para trás (celular lento): pula, sem rajada
    while (prox < ac.currentTime + 0.15) {
      var mu = MUSICAS[faixa], r = roteiro(faixa), casas = mu.tempos * 2, e = 30 / mu.bpm, pos = passo % casas;
      tocarColcheia(mu, r[Math.floor(passo / casas)], pos, prox + (pos % 2 ? mu.balanco * e : 0), e);
      passo++; prox += e;
      if (passo >= r.length * casas) { passo = 0; faixa = (faixa + 1) % MUSICAS.length; if (faixa === 0) volta++; }
    }
  }
  function comecar() {
    if (!ac || timer || escondida) return;
    if (!musGanho) novaCorrente();
    retomar();
    prox = Math.max(prox, ac.currentTime + 0.06);
    timer = setInterval(agendar, 25);
    agendar();
  }
  function parar() { if (timer) { clearInterval(timer); timer = null; } }

  function musica(ligar) {
    ligar = !!ligar;
    if (ligar === querMusica) return;
    querMusica = ligar;
    if (ligar) { passo = 0; comecar(); } else { parar(); if (ac) calar(); }
  }
  function proxima() {
    faixa = (faixa + 1) % MUSICAS.length; passo = 0;
    if (ac && querMusica && !escondida) { parar(); calar(); prox = ac.currentTime + 0.12; comecar(); }
  }
  function nomeAtual() { return querMusica && ac ? MUSICAS[faixa].nome : ''; }

  // página escondida (outra aba, tela apagada): silencia tudo; ao voltar, a música continua de onde parou
  function vigiarTela() {
    if (vigiando || typeof document === 'undefined' || !document.addEventListener) return;
    vigiando = true;
    escondida = !!document.hidden;
    document.addEventListener('visibilitychange', function () {
      escondida = !!document.hidden;
      if (!ac) return;
      if (escondida) { parar(); suspender(); }
      else { retomar(); if (querMusica) comecar(); }
    });
  }

  // ---------- efeitos (curtinhos, fofos e baixinhos) ----------
  var PENTA = [0, 2, 4, 7, 9];
  var EFEITOS = {
    toque: function (t) { tom('sine', 880, t, 0.08, 0.14, 0, 990); sino(1760, t + 0.01, 0.1, 0.03); },
    pincel: function (t) { ruido(t, 0.22, 0.14, 'bandpass', 1800, 0, 4200); tom('sine', 620, t, 0.12, 0.05, 0, 880); },
    cor: function (t, n) {   // cada cor uma notinha (n = número da cor, se o app mandar)
      var k = typeof n === 'number' && isFinite(n) ? Math.abs(Math.floor(n)) : 2;
      var f = hz(72 + PENTA[k % 5] + 12 * (Math.floor(k / 5) % 2));
      sino(f, t, 0.3, 0.12); tom('triangle', f / 2, t, 0.12, 0.05);
    },
    balde: function (t) {   // "bloop": bolha que sobe
      tom('sine', 210, t, 0.16, 0.26, 0, 640, 0.01); tom('sine', 330, t + 0.12, 0.14, 0.14, 0, 820, 0.01);
    },
    adesivo: function (t) { tom('sine', 420, t, 0.07, 0.28, 0, 1250, 0.003); ruido(t, 0.03, 0.08, 'bandpass', 3000); sino(1568, t + 0.05, 0.15, 0.04); },
    desfazer: function (t) { tom('triangle', 700, t, 0.14, 0.13, 0, 420); tom('triangle', 520, t + 0.08, 0.14, 0.09, 0, 330); },
    acerto: function (t) { sino(1568, t, 0.35, 0.11); sino(2093, t + 0.07, 0.45, 0.1); },
    erro: function (t) {   // "bonk" redondinho, sem susto
      tom('sine', 230, t, 0.2, 0.22, 0, 150, 0.004); tom('triangle', 175, t + 0.01, 0.12, 0.06, 0, 140, 0.004);
    },
    festa: function (t) {   // fanfarra curtinha + fogos
      [523, 659, 784, 1047].forEach(function (f, k) {
        tom('triangle', f, t + k * 0.11, k === 3 ? 0.65 : 0.14, 0.12, 0, 0, 0.01);
        tom('square', f, t + k * 0.11, k === 3 ? 0.4 : 0.1, 0.018, 0, 0, 0.01);
        sino(f * 2, t + k * 0.11, 0.35, 0.03);
      });
      for (var k = 0; k < 3; k++) {
        var t0 = t + 0.5 + k * 0.32;
        tom('sine', 520 + k * 90, t0, 0.32, 0.035, 0, 1500 + k * 200, 0.05);   // "fiuuu" subindo
        ruido(t0 + 0.32, 0.35, 0.12, 'lowpass', 700);                          // "bum" macio
        for (var j = 0; j < 5; j++) ruido(t0 + 0.36 + j * 0.05 + Math.random() * 0.03, 0.03, 0.04, 'highpass', 5000);
        [1319, 1568, 1976].forEach(function (f, i) { sino(f * (1 + k * 0.12), t0 + 0.36 + i * 0.07, 0.3, 0.025); });
      }
    },
    foto: function (t) { ruido(t, 0.05, 0.22, 'bandpass', 2600); ruido(t + 0.07, 0.04, 0.16, 'bandpass', 2000); tom('sine', 1400, t, 0.04, 0.03); },
    pegar: function (t) { ruido(t, 0.04, 0.16, 'bandpass', 2200); tom('sine', 320, t, 0.05, 0.12, 0, 260, 0.002); },
    soltar: function (t) { tom('sine', 300, t, 0.07, 0.1, 0, 520, 0.004); ruido(t + 0.02, 0.03, 0.06, 'bandpass', 3200); },
    apagar: function (t) { ruido(t, 0.3, 0.12, 'bandpass', 3200, 0, 700); }   // "fuuu" de vento
  };
  function efeito(nome, n) {
    if (!ac || !efLigados || !Object.prototype.hasOwnProperty.call(EFEITOS, nome)) return;
    if (!escondida) retomar();
    EFEITOS[nome](ac.currentTime + 0.01, n);
  }
  function efeitos(ligar) {
    efLigados = !!ligar;
    if (efGanho) efGanho.gain.setTargetAtTime(efLigados ? VOL_EFEITOS : 0, ac.currentTime, 0.04);
  }

  return {
    iniciar: iniciar,
    musica: musica,
    musicaLigada: function () { return querMusica; },
    proxima: proxima,
    nomeAtual: nomeAtual,
    efeitos: efeitos,
    efeitosLigados: function () { return efLigados; },
    efeito: efeito,
    MUSICAS: MUSICAS,
    EFEITOS: Object.keys(EFEITOS)
  };
});
