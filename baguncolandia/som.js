/* Bagunçolândia — sons sintetizados no WebAudio (nenhum arquivo de áudio, nada com direito autoral).
   Som.iniciar() num toque (o navegador exige gesto); Som.tocar(nome); Som.musica(true/false) é a
   música de carregamento/lobby em laço (arpejo alegre + baixo + batida), também sintetizada. */
(function (root) {
  'use strict';
  var AC = root.AudioContext || root.webkitAudioContext, ctx = null, master = null, mudo = false, loop = null;
  function iniciar() {
    if (!AC) return false;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); }
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    return true;
  }
  function nota(freq, t0, dur, tipo, vol, destino) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(destino || master); o.start(t0); o.stop(t0 + dur + 0.05);
    return o;
  }
  function ruido(t0, dur, vol, filtro) {
    var n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = filtro || 2500; f.Q.value = 0.8;
    g.gain.value = vol || 0.3; s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  var SONS = {
    corte: function (t) { ruido(t, 0.12, 0.35, 3200); nota(880, t, 0.08, 'square', 0.08); nota(1320, t + 0.03, 0.1, 'triangle', 0.12); },
    pegou: function (t) { [523, 659, 784].forEach(function (f, i) { nota(f, t + i * 0.06, 0.18, 'triangle', 0.25); }); },
    mascote: function (t) { [523, 659, 784, 1047, 1319].forEach(function (f, i) { nota(f, t + i * 0.07, 0.25, 'triangle', 0.25); }); },
    chute: function (t) { ruido(t, 0.08, 0.4, 900); nota(160, t, 0.12, 'sine', 0.4); },
    gol: function (t) { [392, 523, 659, 784, 1047].forEach(function (f, i) { nota(f, t + i * 0.09, 0.35, 'square', 0.12); nota(f * 2, t + i * 0.09, 0.3, 'triangle', 0.15); }); ruido(t + 0.4, 0.4, 0.2, 4000); },
    vilao: function (t) { nota(220, t, 0.25, 'sawtooth', 0.2); nota(185, t + 0.12, 0.35, 'sawtooth', 0.2); ruido(t, 0.25, 0.25, 600); },
    bomba: function (t) { ruido(t, 0.6, 0.6, 300); nota(60, t, 0.5, 'sine', 0.6); },
    combo: function (t) { [659, 784, 988, 1319].forEach(function (f, i) { nota(f, t + i * 0.05, 0.2, 'square', 0.1); }); },
    poder: function (t) { for (var i = 0; i < 8; i++) nota(440 * Math.pow(2, i / 8), t + i * 0.04, 0.15, 'triangle', 0.18); },
    tic: function (t) { nota(880, t, 0.1, 'square', 0.12); },
    vai: function (t) { nota(1760, t, 0.4, 'square', 0.15); nota(1320, t, 0.4, 'triangle', 0.15); },
    ok: function (t) { nota(660, t, 0.1, 'triangle', 0.2); nota(990, t + 0.1, 0.18, 'triangle', 0.2); },
    erro: function (t) { nota(300, t, 0.2, 'square', 0.12); nota(240, t + 0.15, 0.25, 'square', 0.12); },
    fim: function (t) { [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { nota(f, t + i * 0.12, 0.3, 'triangle', 0.22); }); },
    perdeu: function (t) { nota(300, t, 0.15, 'sine', 0.12); }
  };
  function tocar(nome) { if (!ctx || mudo || !SONS[nome]) return; try { SONS[nome](ctx.currentTime); } catch (e) {} }

  /* ---------- música em laço: pop dançante sintetizado (sem amostras, sem plágio) ----------
     124 bpm, Fá maior, progressão I–V–vi–IV (F · C · Dm · Bb), 8 compassos que repetem:
     bumbo em todos os tempos, palma nos tempos 2 e 4, chimbal em colcheias, baixo em colcheias com
     oitava, "pad" de acordes com duas serras desafinadas + filtro, pulsando como se tivesse sidechain,
     e uma melodia-gancho em pentatônica com delay. Tudo agendado com 0,5 s de antecedência. ---------- */
  var ACORDES = [[174.61, 220.0, 261.63, 349.23], [130.81, 164.81, 196.0, 261.63], [146.83, 174.61, 220.0, 293.66], [116.54, 146.83, 174.61, 233.08]];   // F, C, Dm, Bb (fundamental, 3ª, 5ª, oitava)
  var BAIXO = [87.31, 65.41, 73.42, 58.27];
  // melodia: [grau da pentatônica de Fá (0..), duração em semicolcheias]; 0 = pausa; 8 compassos
  var PENTA = [349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99, 880.0];
  var GANCHO = [[3, 2], [3, 2], [4, 2], [5, 4], [4, 2], [3, 2], [2, 2], [0, 0, 4], [3, 2], [3, 2], [4, 2], [5, 4], [6, 2], [5, 2], [4, 2], [0, 0, 4],
    [5, 2], [5, 2], [6, 2], [7, 4], [6, 2], [5, 2], [4, 2], [0, 0, 4], [4, 2], [4, 2], [5, 2], [4, 2], [3, 2], [2, 2], [3, 6], [0, 0, 2],
    [0, 0, 16], [0, 0, 16], [3, 1], [4, 1], [5, 2], [7, 4], [6, 2], [5, 2], [4, 2], [0, 0, 2], [3, 1], [2, 1], [3, 2], [4, 2], [3, 8], [0, 0, 2]];
  var reverb = null;
  function impulso() {   // reverberação curta gerada na hora (ruído que decai)
    var n = Math.floor(ctx.sampleRate * 1.6), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  function musica(ligar) {
    if (!ctx) return;
    if (!ligar) { if (loop) { clearInterval(loop.timer); try { loop.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4); } catch (e) {} var velho = loop; setTimeout(function () { try { velho.g.disconnect(); } catch (e) {} }, 1500); loop = null; } return; }
    if (loop) return;
    var g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master); g.gain.setTargetAtTime(0.42, ctx.currentTime, 0.8);
    if (!reverb) { reverb = ctx.createConvolver(); reverb.buffer = impulso(); }
    var rev = ctx.createGain(); rev.gain.value = 0.22; reverb.connect(rev); rev.connect(g);
    var delay = ctx.createDelay(1); delay.delayTime.value = 60 / 124 * 0.75; var fb = ctx.createGain(); fb.gain.value = 0.3; var dg = ctx.createGain(); dg.gain.value = 0.25;
    delay.connect(fb); fb.connect(delay); delay.connect(dg); dg.connect(g);
    var padF = ctx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 1400; padF.Q.value = 0.7; var padG = ctx.createGain(); padG.gain.value = 0.16; padF.connect(padG); padG.connect(g); padG.connect(reverb);
    var bassF = ctx.createBiquadFilter(); bassF.type = 'lowpass'; bassF.frequency.value = 520; var bassG = ctx.createGain(); bassG.gain.value = 0.3; bassF.connect(bassG); bassG.connect(g);
    var leadG = ctx.createGain(); leadG.gain.value = 0.16; leadG.connect(g); leadG.connect(delay); leadG.connect(reverb);
    var bpm = 124, semi = 60 / bpm / 4, t = ctx.currentTime + 0.1, passo = 0, melI = 0, melAte = 0;
    function osc(tipo, f, t0, dur, dest, vol, detune, ataque) {
      var o = ctx.createOscillator(), e = ctx.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t0); if (detune) o.detune.value = detune;
      e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(vol, t0 + (ataque || 0.01)); e.gain.setValueAtTime(vol, t0 + dur * 0.7); e.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(e); e.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function bumbo(t0) { var o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.setValueAtTime(160, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 0.18); e.gain.setValueAtTime(0.9, t0); e.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3); o.connect(e); e.connect(g); o.start(t0); o.stop(t0 + 0.32); }
    function palma(t0) { for (var k = 0; k < 3; k++) ruidoEm(t0 + k * 0.012, 0.09, 0.28, 1900, g); ruidoEm(t0 + 0.03, 0.3, 0.12, 1500, reverb); }
    function chimbal(t0, forte) { ruidoEm(t0, forte ? 0.08 : 0.035, forte ? 0.12 : 0.07, 8000, g); }
    function ruidoEm(t0, dur, vol, f, dest) { var n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); var s = ctx.createBufferSource(), e = ctx.createGain(), fl = ctx.createBiquadFilter(); s.buffer = b; fl.type = f > 5000 ? 'highpass' : 'bandpass'; fl.frequency.value = f; fl.Q.value = 0.9; e.gain.value = vol; s.connect(fl); fl.connect(e); e.connect(dest); s.start(t0); }
    loop = { g: g, timer: setInterval(function () {
      while (t < ctx.currentTime + 0.5) {
        var compasso = Math.floor(passo / 16) % 8, acorde = ACORDES[compasso % 4], semic = passo % 16, tempo = Math.floor(semic / 4), sub = semic % 4;
        // bateria
        if (sub === 0) bumbo(t);
        if (sub === 0 && (tempo === 1 || tempo === 3)) palma(t);
        if (sub === 0 || sub === 2) chimbal(t, sub === 2);
        if (compasso === 7 && semic >= 12) ruidoEm(t, 0.08, 0.2, 2600, g);   // viradinha no fim da volta
        // baixo em colcheias, oitava acima nas colcheias fracas
        if (sub === 0 || sub === 2) osc('sawtooth', BAIXO[compasso % 4] * (sub === 2 ? 2 : 1), t, semi * 1.8, bassF, 0.5, 0, 0.005);
        // pad: no início de cada tempo, pulsando (como um sidechain)
        if (sub === 0) { var durP = semi * 3.6; acorde.forEach(function (f, k) { osc('sawtooth', f, t + 0.02, durP, padF, 0.08, -7, 0.03); osc('sawtooth', f, t + 0.02, durP, padF, 0.08, 7, 0.03); if (k === 0) osc('square', f / 2, t + 0.02, durP, padF, 0.05, 0, 0.03); }); }
        // melodia-gancho (começa na 2ª volta, para a introdução respirar)
        if (passo >= 128 && t >= melAte) { var n = GANCHO[melI % GANCHO.length]; melI++; var durN = (n[0] === 0 && n.length === 3 ? n[2] : n[1]) * semi; if (n[0] !== 0) { osc('triangle', PENTA[n[0] - 1], t, durN * 0.95, leadG, 0.9, 0, 0.01); osc('square', PENTA[n[0] - 1] * 2, t, durN * 0.6, leadG, 0.18, 5, 0.01); } melAte = t + durN; }
        t += semi; passo++;
      }
    }, 120) };
  }
  root.Som = { iniciar: iniciar, tocar: tocar, musica: musica, mudo: function (v) { if (v != null) mudo = !!v; return mudo; }, pronto: function () { return !!ctx; } };
})(typeof self !== 'undefined' ? self : this);
