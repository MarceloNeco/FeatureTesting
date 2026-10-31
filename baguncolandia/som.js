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

  /* música em laço: 4 compassos em Dó maior, 128 bpm; agendada com antecedência de 0,4 s */
  var ACORDES = [[261.6, 329.6, 392.0], [220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [196.0, 246.9, 293.7]];
  function musica(ligar) {
    if (!ctx) return;
    if (!ligar) { if (loop) { clearInterval(loop.timer); try { loop.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3); } catch (e) {} loop = null; } return; }
    if (loop) return;
    var g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master); g.gain.setTargetAtTime(0.35, ctx.currentTime, 0.5);
    var bpm = 128, passo = 60 / bpm / 2, t = ctx.currentTime + 0.1, i = 0;
    loop = { g: g, timer: setInterval(function () {
      while (t < ctx.currentTime + 0.4) {
        var compasso = Math.floor(i / 8) % 4, ac = ACORDES[compasso], n = i % 8;
        nota(ac[n % 3] * (n >= 4 ? 2 : 1), t, passo * 0.9, 'square', 0.06, g);                 // arpejo
        if (n % 4 === 0) nota(ac[0] / 2, t, passo * 1.8, 'triangle', 0.18, g);                  // baixo
        if (n % 4 === 0) nota(90, t, 0.1, 'sine', 0.3, g);                                        // bumbo
        if (n % 4 === 2) { try { var nn = ctx.createOscillator(), gg = ctx.createGain(); nn.type = 'square'; nn.frequency.value = 6000; gg.gain.setValueAtTime(0.03, t); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05); nn.connect(gg); gg.connect(g); nn.start(t); nn.stop(t + 0.06); } catch (e) {} }   // chimbal
        t += passo; i++;
      }
    }, 150) };
  }
  root.Som = { iniciar: iniciar, tocar: tocar, musica: musica, mudo: function (v) { if (v != null) mudo = !!v; return mudo; }, pronto: function () { return !!ctx; } };
})(typeof self !== 'undefined' ? self : this);
