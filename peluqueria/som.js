/* Peluqueria — música e efeitos sintetizados no WebAudio (nenhum arquivo, nada com direito autoral).
   Uma trilha animada por nível (Criança 120, Normal 132, Maluco 150 BPM), +2 BPM a cada queda.
   Se musicas/musicas.json listar MP3s do dono, toca um deles sorteado, em laço, no lugar da trilha.
   Sem WebAudio, tudo vira silêncio (sem erro). O som só começa depois do primeiro toque (ligar()). */
(function (root) {
  'use strict';
  var TESTE = /[?&]teste\b/.test((root.location && root.location.search) || '');
  var BPM = { crianca: 120, normal: 132, maluco: 150 };
  var ARQ = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,60}\.mp3$/;
  var Ctx = root.AudioContext || root.webkitAudioContext;
  var ctx = null, mestre = null, ruido = null, mudo = false;
  var nivel = 'normal', bpm = 132, passo = 0, proximo = 0, relogio = 0, tocando = false;
  var minhas = [], audio = null, fonte = '';   // fonte: '' | 'minhas' | 'jogo'
  var registro = TESTE ? [] : null;

  // progressão alegre I–V–vi–IV; notas em semitons acima da tônica de cada nível
  var TONICA = { crianca: 60, normal: 62, maluco: 64 };   // dó, ré, mi (MIDI)
  var ACORDES = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]];
  var MELODIA = {
    crianca: [0, -1, 1, -1, 2, -1, 1, -1, 0, -1, 2, -1, 1, 2, 1, -1],
    normal: [0, 1, 2, 1, 2, -1, 1, 0, 2, 1, 0, 1, 2, -1, 2, 1],
    maluco: [0, 2, 1, 2, 0, 2, 1, 2, 2, 1, 2, 0, 2, 1, 0, 2]
  };
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ligar() {
    if (!Ctx) return;
    try {
      if (!ctx) {
        ctx = new Ctx(); mestre = ctx.createGain(); mestre.gain.value = mudo ? 0 : 0.8; mestre.connect(ctx.destination);
        var n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0);
        for (var k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
        ruido = b;
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  }

  function env(no, t, ataque, dur, pico) {
    no.gain.setValueAtTime(0.0001, t);
    no.gain.exponentialRampToValueAtTime(pico, t + ataque);
    no.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function nota(t, freq, dur, tipo, vol, corte) {
    var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = tipo; o.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass'; f.frequency.value = corte || 3000;
    env(g, t, 0.01, dur, vol);
    o.connect(f); f.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function bumbo(t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    env(g, t, 0.005, 0.25, 0.9); o.connect(g); g.connect(mestre); o.start(t); o.stop(t + 0.3);
  }
  function chiado(t, corte, dur, vol) {
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = 'highpass'; f.frequency.value = corte;
    env(g, t, 0.003, dur, vol); s.connect(f); f.connect(g); g.connect(mestre); s.start(t); s.stop(t + dur + 0.02);
  }

  function agendarPasso(t, p) {
    var s = p % 16, compasso = Math.floor(p / 16) % 4, ac = ACORDES[compasso], ton = TONICA[nivel];
    if (s % 4 === 0) bumbo(t);
    if (nivel === 'maluco' && s % 8 === 6) bumbo(t);
    if (s === 4 || s === 12) chiado(t, 1200, 0.16, 0.35);
    if (s % 2 === 0 || nivel === 'maluco') chiado(t, 7000, 0.04, s % 4 === 2 ? 0.18 : 0.08);
    if (s % 2 === 0) nota(t, hz(ton - 24 + ac[0] + (s % 8 === 6 ? 12 : 0)), 0.18, 'sawtooth', 0.22, 700);
    var m = MELODIA[nivel][s];
    if (m >= 0) nota(t, hz(ton + 12 + ac[m]), 0.14, 'square', 0.06, 2600);
    if (s === 0) ac.forEach(function (x) { nota(t, hz(ton + x), 0.9, 'triangle', 0.05, 1800); });
  }
  function agendar() {
    if (!ctx || !tocando) return;
    var dur = 60 / bpm / 4;
    if (proximo < ctx.currentTime) proximo = ctx.currentTime + 0.02;   // atrasou (app em segundo plano): pula, sem rajada
    while (proximo < ctx.currentTime + 0.1) { agendarPasso(proximo, passo); passo++; proximo += dur; }
  }

  function sintetizada() {
    if (!ctx) return;
    fonte = 'jogo'; tocando = true; passo = 0; proximo = ctx.currentTime + 0.05;
    clearInterval(relogio); relogio = setInterval(agendar, 25); agendar();
  }
  function musica(n) {
    if (n) nivel = n;
    parar();
    if (!minhas.length) return sintetizada();
    // MP3 do dono; se não tocar (arquivo quebrado, sem internet e fora do cache), volta para a trilha do jogo
    var falhou = function () { if (fonte === 'minhas') { if (audio) try { audio.pause(); } catch (e) {} sintetizada(); } };
    try {
      if (!audio) { audio = new Audio(); audio.loop = true; }
      fonte = 'minhas';
      audio.onerror = falhou;
      audio.src = 'musicas/' + minhas[Math.floor(Math.random() * minhas.length)].arquivo;
      audio.muted = mudo; var pr = audio.play(); if (pr && pr.catch) pr.catch(falhou);
    } catch (e) { falhou(); }
  }
  function andamento(i) { bpm = BPM[nivel] + 2 * (i || 0); }
  function parar() {
    tocando = false; fonte = ''; clearInterval(relogio);
    if (audio) try { audio.pause(); } catch (e) {}
  }

  var EFEITOS = {
    toque: function (t) { nota(t, 880, 0.08, 'square', 0.12); },
    conta: function (t) { nota(t, 660, 0.15, 'square', 0.15); },
    PERFEITO: function (t) { [72, 76, 79, 84].forEach(function (m, k) { nota(t + k * 0.08, hz(m), 0.3, 'square', 0.18); }); chiado(t + 0.3, 5000, 0.4, 0.2); },
    BOM: function (t) { nota(t, hz(72), 0.15, 'square', 0.16); nota(t + 0.1, hz(79), 0.25, 'square', 0.16); },
    QUASE: function (t) { nota(t, hz(67), 0.25, 'triangle', 0.2); },
    LONGE: function (t) {   // "fom-fom"
      [0, 0.25].forEach(function (d) {
        var o = nota(t + d, 220, 0.22, 'sawtooth', 0.2, 900);
        o.frequency.exponentialRampToValueAtTime(120, t + d + 0.2);
      });
    },
    fim: function (t) { [60, 64, 67, 72, 76, 79].forEach(function (m, k) { nota(t + k * 0.1, hz(m), 0.35, 'triangle', 0.18); }); }
  };
  function efeito(nome) {
    if (registro) registro.push(nome);
    if (!ctx || mudo || !EFEITOS[nome]) return;
    try { EFEITOS[nome](ctx.currentTime + 0.01); } catch (e) {}
  }
  function definirMudo(b) {
    mudo = !!b;
    if (mestre) mestre.gain.value = mudo ? 0 : 0.8;
    if (audio) audio.muted = mudo;
  }

  /* MP3s do dono (musicas/musicas.json): [{ "nome": "...", "arquivo": "festa.mp3" }] */
  if (root.fetch) {
    root.fetch('musicas/musicas.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (v) {
      if (Array.isArray(v)) minhas = v.filter(function (o) { return o && typeof o.arquivo === 'string' && ARQ.test(o.arquivo) && o.arquivo.indexOf('..') < 0; }).slice(0, 50);
    }).catch(function () {});
  }

  root.PeluqueriaSom = { ligar: ligar, musica: musica, andamento: andamento, parar: parar, efeito: efeito, mudo: definirMudo, registro: registro, minhas: function () { return minhas.slice(); }, fonte: function () { return fonte; }, _ctx: function () { return ctx; } };
})(typeof self !== 'undefined' ? self : this);
