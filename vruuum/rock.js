/* Vruuum! — banda de rock feita na hora pelo navegador (WebAudio): guitarra base distorcida dobrada
   (esquerda e direita), guitarra solo com eco, baixo com drive, bateria completa (bumbo, caixa,
   chimbal, prato, tons e viradas) e coro de "Ei!". Nenhum arquivo de áudio.
   Três músicas de hard rock compostas aqui (riffs e melodias próprios, nenhum copiado), cada uma com
   introdução de riff que vai crescendo, estrofe, refrão, solo e final; tocam sem parar, uma depois
   da outra. Escala pentatônica sobre acordes de quinta ("power chords"): sempre combina.
   Uso (pelo som.js): VruuumRock.preparar(audioContext, destino); .ligar(); .desligar(); .proxima(). */
(function (raiz) {
  'use strict';
  var ac = null, saida = null, base1, base2, solo, baixo, bateria, ruidoBuf = null;
  var faixa = 0, lista = [], barra = 0, passo = 0, prox = 0, timer = null;
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------- as músicas ----------
  // acordes: fundamental de cada compasso, em semitons acima do tom. bat/gtr/bx/lead: o que cada um toca.
  // riff: 16 semicolcheias (semitons acima do acorde; null = pausa). melodias: frases de 2 compassos
  // [passo, semitons acima do tom do solo, duração em passos].
  var MUSICAS = [
    { nome: 'Trovão na Pista', bpm: 138, tom: 40,
      riff: [12, 0, 7, 0, 10, 0, 7, 0, 12, 0, 14, 0, 15, 0, 14, 0],
      melodias: [
        [[0, 12, 4], [4, 10, 2], [6, 12, 2], [8, 15, 6], [14, 12, 2], [16, 7, 6], [22, 10, 2], [24, 12, 8]],
        [[0, 10, 4], [4, 12, 2], [6, 10, 2], [8, 7, 6], [14, 5, 2], [16, 7, 4], [20, 3, 2], [22, 5, 2], [24, 0, 8]]
      ],
      secoes: {
        intro: { acordes: [0, 0, 0, 0], bat: 'nada', gtr: 'nada', bx: 'nada', lead: 'riff', viradaFinal: true },
        intro2: { acordes: [0, 0, -4, -2], bat: 'bumbo', gtr: 'nada', bx: 'pedal', lead: 'riff' },
        verso: { acordes: [0, 0, -2, -2, -4, -4, -2, -2], bat: 'rock', gtr: 'chug', bx: 'pedal', lead: 'riff', leadVol: 0.6 },
        refrao: { acordes: [5, 0, -2, 0, 5, 0, -2, -2], bat: 'dobro', gtr: 'aberto', bx: 'pedal', lead: 'melodia', ei: true },
        solo: { acordes: [-4, -2, 0, 0, -4, -2, 0, 0], bat: 'galope', gtr: 'galope', bx: 'galope', lead: 'solo' },
        fim: { acordes: [0, 0], bat: 'final', gtr: 'final', bx: 'final', lead: 'nada' }
      },
      forma: ['intro', 'intro2', 'verso', 'refrao', 'verso', 'refrao', 'solo', 'refrao', 'fim'] },
    { nome: 'Pedal no Fundo', bpm: 152, tom: 45,
      riff: [0, 3, 5, 6, 7, null, 10, 12, 10, 7, 5, 3, 0, null, 0, null],
      melodias: [
        [[0, 5, 6], [6, 7, 2], [8, 10, 6], [14, 7, 2], [16, 5, 4], [20, 3, 2], [22, 5, 2], [24, 0, 8]],
        [[0, 12, 4], [4, 10, 2], [6, 12, 2], [8, 15, 6], [14, 12, 2], [16, 10, 6], [22, 7, 2], [24, 0, 8]]
      ],
      secoes: {
        intro: { acordes: [0, 0], bat: 'nada', gtr: 'boogie', bx: 'nada', lead: 'nada', viradaFinal: true },
        intro2: { acordes: [0, 0], bat: 'bumbo', gtr: 'boogie', bx: 'boogie', lead: 'nada' },
        verso: { acordes: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7], bat: 'rock', gtr: 'boogie', bx: 'boogie', lead: 'riff', leadCada: 4 },
        refrao: { acordes: [5, 5, 0, 0, 7, 5, 0, 0], bat: 'dobro', gtr: 'aberto', bx: 'pedal', lead: 'melodia', ei: true },
        solo: { acordes: [0, 0, 5, 5, 0, 0, 7, 7], bat: 'rock', gtr: 'boogie', bx: 'boogie', lead: 'solo' },
        fim: { acordes: [0, 0], bat: 'final', gtr: 'final', bx: 'final', lead: 'nada' }
      },
      forma: ['intro', 'intro2', 'verso', 'refrao', 'solo', 'verso', 'refrao', 'fim'] },
    { nome: 'Motor de Fogo', bpm: 168, tom: 38,
      riff: [12, 0, 0, 10, 0, 0, 12, 0, 15, 0, 0, 14, 12, 0, 10, 7],
      melodias: [
        [[0, 3, 4], [4, 5, 2], [6, 7, 2], [8, 10, 4], [12, 7, 4], [16, 12, 6], [22, 10, 2], [24, 7, 8]],
        [[0, 12, 4], [4, 10, 2], [6, 12, 2], [8, 15, 6], [14, 12, 2], [16, 10, 4], [20, 7, 4], [24, 0, 8]]
      ],
      secoes: {
        intro: { acordes: [0, 0, 0, 0], bat: 'nada', gtr: 'galope', bx: 'nada', lead: 'nada', viradaFinal: true },
        intro2: { acordes: [0, 0, -2, -4], bat: 'galope', gtr: 'galope', bx: 'galope', lead: 'riff' },
        verso: { acordes: [0, 0, -2, -2, -4, -4, -5, -5], bat: 'galope', gtr: 'galope', bx: 'galope', lead: 'riff', leadVol: 0.6 },
        refrao: { acordes: [-4, -2, 0, 0, -4, -2, -5, -5], bat: 'dobro', gtr: 'aberto', bx: 'pedal', lead: 'melodia', harmonia: 7, ei: true },
        solo: { acordes: [0, -2, -4, -5, 0, -2, -4, -5], bat: 'galope', gtr: 'galope', bx: 'galope', lead: 'solo' },
        fim: { acordes: [0, 0], bat: 'final', gtr: 'final', bx: 'final', lead: 'nada' }
      },
      forma: ['intro', 'intro2', 'verso', 'refrao', 'verso', 'refrao', 'solo', 'refrao', 'fim'] }
  ];

  function expandir(m) {
    var l = [];
    m.forma.forEach(function (nome) {
      var s = m.secoes[nome];
      s.acordes.forEach(function (a, i) { l.push({ s: s, acorde: a, i: i, primeira: i === 0, ultima: i === s.acordes.length - 1 }); });
    });
    return l;
  }

  // ---------- os instrumentos ----------
  function curva(k) { var n = 2048, c = new Float32Array(n); for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; }
  function pan(no, v) { if (!ac.createStereoPanner) return no; var p = ac.createStereoPanner(); p.pan.value = v; no.connect(p); return p; }
  // amplificador de guitarra: drive → distorção → corta graves e agudos (caixa do amp) → realce de médios
  function amp(drive, k, corte, lado, eco, vol) {
    var ent = ac.createGain(); ent.gain.value = drive;
    var ws = ac.createWaveShaper(); ws.curve = curva(k); ws.oversample = '2x';
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 110;
    var med = ac.createBiquadFilter(); med.type = 'peaking'; med.frequency.value = 1500; med.Q.value = 0.8; med.gain.value = 5;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = corte; lp.Q.value = 0.9;
    var g = ac.createGain(); g.gain.value = vol;
    ent.connect(ws); ws.connect(hp); hp.connect(med); med.connect(lp); lp.connect(g);
    var fim = pan(g, lado); fim.connect(saida);
    if (eco) {
      var d = ac.createDelay(1), fb = ac.createGain(), mol = ac.createGain();
      d.delayTime.value = eco; fb.gain.value = 0.3; mol.gain.value = 0.28;
      fim.connect(d); d.connect(fb); fb.connect(d); d.connect(mol); mol.connect(saida);
    }
    return ent;
  }
  function preparar(contexto, destino) {
    if (ac) return;
    ac = contexto;
    // compressor de "estúdio": cola a banda e segura os picos (os efeitos do jogo tocam por cima)
    saida = ac.createDynamicsCompressor();
    saida.threshold.value = -16; saida.knee.value = 8; saida.ratio.value = 4; saida.attack.value = 0.006; saida.release.value = 0.18;
    var depois = ac.createGain(); depois.gain.value = 1.15; saida.connect(depois); depois.connect(destino);
    base1 = amp(9, 70, 4300, -0.55, 0, 0.16);
    base2 = amp(9, 70, 4000, 0.55, 0, 0.16);
    solo = amp(5, 30, 5600, 0.12, 0.3, 0.13);
    var be = ac.createGain(); be.gain.value = 2.2;
    var bws = ac.createWaveShaper(); bws.curve = curva(4);
    var blp = ac.createBiquadFilter(); blp.type = 'lowpass'; blp.frequency.value = 950;
    var bg = ac.createGain(); bg.gain.value = 0.42;
    be.connect(bws); bws.connect(blp); blp.connect(bg); bg.connect(saida); baixo = be;
    bateria = ac.createGain(); bateria.gain.value = 0.95; bateria.connect(saida);
    ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    var d = ruidoBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function nota(dest, midi, ini, dur, vol, tipo, desafino, abafado) {
    var o = ac.createOscillator(), g = ac.createGain(), no = o;
    o.type = tipo || 'sawtooth'; o.frequency.value = hz(midi); if (desafino) o.detune.value = desafino;
    if (abafado) { var f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 650; o.connect(f); no = f; }
    g.gain.setValueAtTime(0.0001, ini); g.gain.linearRampToValueAtTime(vol, ini + 0.004);
    g.gain.setTargetAtTime(vol * (abafado ? 0.25 : 0.7), ini + 0.01, abafado ? 0.03 : 0.25);
    g.gain.setTargetAtTime(0.0001, ini + dur, 0.025);
    no.connect(g); g.connect(dest); o.start(ini); o.stop(ini + dur + 0.15);
    return o;
  }
  // acorde de quinta, dobrado (uma guitarra de cada lado, levemente desafinadas e fora de tempo)
  function quinta(midi, ini, dur, vol, abafado) {
    var ivs = abafado ? [0, 7] : [0, 7, 12];
    ivs.forEach(function (iv) { nota(base1, midi + iv, ini, dur, vol, 'sawtooth', -7, abafado); nota(base2, midi + iv, ini + 0.009, dur, vol, 'sawtooth', 7, abafado); });
  }
  function guitarraSolo(midi, ini, dur, vol) {
    var o = nota(solo, midi, ini, dur, vol, 'sawtooth', 0, false);
    nota(solo, midi + 12, ini, dur, vol * 0.25, 'square', 4, false);
    if (dur > 0.35) {   // vibrato nas notas longas
      var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 0;
      lg.gain.setValueAtTime(0, ini + 0.15); lg.gain.linearRampToValueAtTime(18, ini + dur);
      lfo.connect(lg); lg.connect(o.detune); lfo.start(ini); lfo.stop(ini + dur + 0.1);
    }
  }
  function graveNota(midi, ini, dur, vol) { nota(baixo, midi, ini, dur, vol, 'sawtooth', 0, false); nota(baixo, midi, ini, dur, vol * 0.8, 'sine', 0, false); }

  function ruido(ini, dur, vol, tipo, freq, q, dest) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruidoBuf; f.type = tipo; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, ini); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    s.connect(f); f.connect(g); g.connect(dest || bateria); s.start(ini, Math.random() * 0.5); s.stop(ini + dur + 0.05);
  }
  function tom(tipo, f0, f1, ini, dur, vol) {
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f0, ini); o.frequency.exponentialRampToValueAtTime(f1, ini + dur);
    g.gain.setValueAtTime(vol, ini); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    o.connect(g); g.connect(bateria); o.start(ini); o.stop(ini + dur + 0.05);
  }
  function bumbo(t, v) { tom('sine', 150, 42, t, 0.22, 0.95 * (v || 1)); ruido(t, 0.012, 0.25, 'highpass', 2500); }
  function caixa(t, v) { v = v || 1; ruido(t, 0.2, 0.55 * v, 'bandpass', 1900, 0.6); tom('triangle', 210, 160, t, 0.1, 0.35 * v); }
  function chimbal(t, aberto, v) { ruido(t, aberto ? 0.28 : 0.045, (aberto ? 0.18 : 0.12) * (v || 1), 'highpass', 7500); }
  function prato(t) { ruido(t, 1.8, 0.28, 'highpass', 4800); ruido(t, 1.2, 0.12, 'bandpass', 9000, 0.5); }
  function tomTom(t, f) { tom('sine', f, f * 0.55, t, 0.28, 0.6); }
  // coro de "Ei!": várias vozes com formante de "é", bem curtinho
  function ei(t) {
    var f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 820; f.Q.value = 2.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    f.connect(g); g.connect(saida);
    [196, 207, 247, 262, 294].forEach(function (fr, k) { var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(fr * 1.06, t); o.frequency.exponentialRampToValueAtTime(fr, t + 0.2); o.detune.value = (k - 2) * 9; o.connect(f); o.start(t); o.stop(t + 0.25); });
    ruido(t, 0.1, 0.22, 'bandpass', 1600, 1.2, saida);
  }

  // ---------- um passo (semicolcheia) ----------
  function tocar(m, b, p, t) {
    var s = b.s, dur = 60 / m.bpm / 4, fund = m.tom + b.acorde, virada = b.ultima && p >= 8 && s.bat !== 'final';
    // bateria
    if (b.primeira && p === 0 && s.bat !== 'nada') prato(t);
    if (s.bat === 'nada' && s.viradaFinal && b.ultima) {
      if (p >= 8) caixa(t, 0.4 + (p - 8) * 0.08);
      if (p === 12 || p === 14) tomTom(t, p === 12 ? 160 : 110);
    } else if (virada && s.bat !== 'bumbo') {
      if (p % 2 === 0 || p >= 12) caixa(t, 0.6 + (p - 8) * 0.05);
      if (p === 10) tomTom(t, 190); if (p === 13) tomTom(t, 140); if (p === 15) tomTom(t, 100);
      if (p % 4 === 0) bumbo(t);
    } else if (s.bat === 'bumbo') { if (p % 4 === 0) bumbo(t); if (p % 2 === 0) chimbal(t, false, 0.8); }
    else if (s.bat === 'rock') {
      if (p === 0 || p === 8 || p === 10 || (p === 6 && b.i % 2)) bumbo(t);
      if (p === 4 || p === 12) caixa(t);
      if (p % 2 === 0) chimbal(t, p === 14, p % 4 ? 0.7 : 1);
    } else if (s.bat === 'dobro') {
      if (p % 4 === 0 || p === 10) bumbo(t);
      if (p === 4 || p === 12) caixa(t, 1.1);
      if (p % 4 === 2) chimbal(t, true);
      if (p === 0 && b.i % 2 === 0) prato(t);
    } else if (s.bat === 'galope') {
      if (p % 4 === 0 || p % 4 === 2 || p % 4 === 3) bumbo(t, p % 4 ? 0.75 : 1);
      if (p === 4 || p === 12) caixa(t);
      if (p % 2 === 0) chimbal(t, false, 0.8);
    } else if (s.bat === 'final') {
      if (p === 0) { bumbo(t); prato(t); caixa(t, 1.2); }
      if (b.ultima && p === 0) { tomTom(t, 120); }
    }

    // guitarra base
    if (s.gtr === 'chug') {
      if (p === 0) quinta(fund + 12, t, dur * 2, 0.5, false);
      else if (p % 2 === 0) quinta(fund + 12, t, dur * 0.9, 0.5, true);
      if (b.i % 2 === 1 && p === 14) quinta(fund + 12, t, dur * 2, 0.5, false);
    } else if (s.gtr === 'aberto') {
      if (p === 0) quinta(fund + 12, t, dur * 5.5, 0.5, false);
      if (p === 6) quinta(fund + 12, t, dur * 1.8, 0.45, false);
      if (p === 8) quinta(fund + 12, t, dur * 5.5, 0.5, false);
      if (p === 14) quinta(fund + 12, t, dur * 1.8, 0.45, false);
    } else if (s.gtr === 'boogie') {
      if (p % 2 === 0) {
        var alto = [7, 9, 10, 9][(p / 2) % 4];
        if (b.i % 2 === 0) alto = p % 4 === 0 ? 7 : 9;
        nota(base1, fund + 12, t, dur * 1.7, 0.5, 'sawtooth', -7, true); nota(base1, fund + 12 + alto, t, dur * 1.7, 0.5, 'sawtooth', -7, true);
        nota(base2, fund + 12, t + 0.009, dur * 1.7, 0.5, 'sawtooth', 7, true); nota(base2, fund + 12 + alto, t + 0.009, dur * 1.7, 0.5, 'sawtooth', 7, true);
      }
    } else if (s.gtr === 'galope') {
      if (p % 4 === 0) quinta(fund + 12, t, dur * 1.8, 0.5, p !== 0);
      else if (p % 4 === 2 || p % 4 === 3) quinta(fund + 12, t, dur * 0.9, 0.48, true);
    } else if (s.gtr === 'final') {
      if (p === 0) quinta(fund + 12, t, dur * (b.ultima ? 16 : 14), 0.55, false);
    }

    // baixo
    if (s.bx === 'pedal' && p % 2 === 0) graveNota(fund, t, dur * 1.8, 0.55);
    else if (s.bx === 'boogie' && p % 2 === 0) graveNota(fund + [0, 0, 7, 9, 12, 9, 7, 4][(p / 2) % 8] * (b.i % 2 ? 1 : 0), t, dur * 1.8, 0.55);
    else if (s.bx === 'galope' && (p % 4 === 0 || p % 4 === 2 || p % 4 === 3)) graveNota(fund, t, dur * 0.9, 0.55);
    else if (s.bx === 'final' && p === 0) graveNota(fund, t, dur * 14, 0.6);

    // guitarra solo
    var vol = 0.5 * (s.leadVol || 1);
    if (s.lead === 'riff' && (!s.leadCada || b.i % s.leadCada === s.leadCada - 1)) {
      var r = m.riff[p];
      if (r !== null) guitarraSolo(fund + 24 + r, t, dur * 0.95, vol);
    } else if (s.lead === 'melodia') {
      var frase = m.melodias[Math.floor(b.i / 2) % m.melodias.length], pos = (b.i % 2) * 16 + p;
      frase.forEach(function (n) {
        if (n[0] !== pos) return;
        guitarraSolo(m.tom + 24 + n[1], t, dur * n[2] * 0.95, vol);
        if (s.harmonia) guitarraSolo(m.tom + 24 + n[1] + s.harmonia, t, dur * n[2] * 0.95, vol * 0.55);
      });
    } else if (s.lead === 'solo') {
      var ESC = [0, 3, 5, 7, 10], k = (b.i % 4) * 4 + Math.floor(p / 4), forma = [0, 1, 2, 1][p % 4] + k, nn = m.tom + 24 + ESC[forma % 5] + 12 * Math.floor(forma / 5);
      if (b.ultima && p >= 8) { if (p === 8) guitarraSolo(m.tom + 36, t, dur * 8, vol); }
      else guitarraSolo(nn, t, dur * 0.95, vol * 0.85);
    }
    if (s.ei && b.i % 2 === 1 && (p === 4 || p === 12)) ei(t);
  }

  function agendar() {
    if (!ac) return;
    while (prox < ac.currentTime + 0.15) {
      var m = MUSICAS[faixa];
      tocar(m, lista[barra], passo, prox);
      prox += 60 / m.bpm / 4;
      if (++passo >= 16) {
        passo = 0;
        if (++barra >= lista.length) { faixa = (faixa + 1) % MUSICAS.length; lista = expandir(MUSICAS[faixa]); barra = 0; }
      }
    }
  }
  function ligar() {
    if (!ac || timer) return;
    if (!lista.length) lista = expandir(MUSICAS[faixa]);
    prox = ac.currentTime + 0.06; timer = setInterval(agendar, 25);
  }
  function desligar() { if (timer) { clearInterval(timer); timer = null; } }
  function proxima() {
    faixa = (faixa + 1) % MUSICAS.length; lista = expandir(MUSICAS[faixa]); barra = 0; passo = 0;
    if (ac) prox = Math.max(prox, ac.currentTime + 0.06);
  }

  raiz.VruuumRock = { preparar: preparar, ligar: ligar, desligar: desligar, proxima: proxima, MUSICAS: MUSICAS, expandir: expandir, _tocar: function (m, b, p, t) { tocar(m, b, p, t); } };
})(this);
