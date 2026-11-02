/* Bagunçolândia — sons sintetizados no WebAudio (nenhum arquivo de áudio, nada com direito autoral).
   Som.iniciar() num toque (o navegador exige gesto); Som.tocar(nome); Som.musica(true/false, faixa) toca em laço
   uma das FAIXAS (0 = carregamento/lobby; as outras, uma por rodada), também sintetizadas.
   Som.mudo(v) cala tudo (efeitos e música); Som.semMusica(v) liga/desliga só a música; Som.abaixar(v) baixa a
   música enquanto a voz explica (calibração).
   Música de verdade: as faixas de TRILHA (pasta musicas/, domínio público CC0 do FreePD, ver CREDITOS.md) tocam
   por um <audio> ligado ao mesmo volume geral. Sem internet, com "economia de dados" ou se o arquivo falhar, toca
   a versão sintetizada (FAIXAS) no lugar: nunca fica em silêncio. */
(function (root) {
  'use strict';
  var AC = root.AudioContext || root.webkitAudioContext, ctx = null, master = null, mudo = false, loop = null, semMusica = false, desejada = null, baixo = false;
  function iniciar() {
    if (!AC) return false;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = mudo ? 0 : 0.5; master.connect(ctx.destination); }
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
  function varre(f0, f1, t0, dur, tipo, vol) { var o = nota(f0, t0, dur, tipo, vol); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur); return o; }
  var SONS = {
    /* 🧸 Bagunça: um som para cada coisa da casa */
    boing: function (t) { varre(180, 620, t, 0.18, 'sine', 0.35); varre(360, 1240, t, 0.12, 'triangle', 0.08); },
    bloco: function (t) { [0, 0.05].forEach(function (d, i) { nota(i ? 520 : 760, t + d, 0.07, 'square', 0.07); ruido(t + d, 0.04, 0.25, 1800); }); },
    tum: function (t) { varre(140, 60, t, 0.16, 'sine', 0.45); ruido(t, 0.08, 0.2, 500); },
    fofo: function (t) { ruido(t, 0.18, 0.22, 700); varre(220, 110, t, 0.14, 'sine', 0.18); },
    livro: function (t) { varre(140, 60, t, 0.14, 'sine', 0.4); ruido(t + 0.08, 0.25, 0.22, 4200); ruido(t + 0.2, 0.18, 0.15, 5200); },   // tum + páginas folheando
    pato: function (t) { varre(900, 1500, t, 0.09, 'square', 0.1); varre(1500, 1100, t + 0.09, 0.1, 'square', 0.09); },
    vrum: function (t) { varre(90, 260, t, 0.35, 'sawtooth', 0.12); varre(95, 270, t, 0.35, 'square', 0.05); },
    piao: function (t) { for (var i = 0; i < 6; i++) nota(1200 + (i % 2) * 120, t + i * 0.05, 0.06, 'triangle', 0.08); },
    robo: function (t) { [440, 660, 330, 880].forEach(function (f, i) { nota(f, t + i * 0.06, 0.07, 'square', 0.07); }); },
    latido: function (t) { [0, 0.22].forEach(function (d) { varre(420, 190, t + d, 0.14, 'sawtooth', 0.22); varre(840, 380, t + d, 0.12, 'square', 0.05); ruido(t + d, 0.06, 0.2, 1100); }); },
    interruptor: function (t) { ruido(t, 0.02, 0.5, 3000); nota(2400, t, 0.025, 'square', 0.08); },
    janela: function (t) { varre(300, 520, t, 0.5, 'sawtooth', 0.04); ruido(t, 0.55, 0.12, 900); },   // rangido + vento
    lustre: function (t) { [1568, 2093, 2637, 3136].forEach(function (f, i) { nota(f, t + i * 0.04, 0.6, 'sine', 0.07); }); },
    quadro: function (t) { nota(300, t, 0.08, 'triangle', 0.25); varre(500, 420, t + 0.06, 0.2, 'sine', 0.08); },
    folhas: function (t) { ruido(t, 0.6, 0.18, 5500); ruido(t + 0.1, 0.5, 0.12, 3500); },
    passaro: function (t) { [0, 0.12, 0.2].forEach(function (d) { varre(2200, 3400, t + d, 0.07, 'sine', 0.12); }); },
    balanco: function (t) { varre(600, 500, t, 0.3, 'triangle', 0.06); varre(500, 620, t + 0.3, 0.3, 'triangle', 0.05); },
    flor: function (t) { nota(1760, t, 0.12, 'sine', 0.08); nota(2217, t + 0.05, 0.12, 'sine', 0.06); },
    miau: function (t) { varre(520, 900, t, 0.18, 'sawtooth', 0.08); varre(900, 420, t + 0.18, 0.3, 'sawtooth', 0.08); varre(1040, 1800, t, 0.18, 'sine', 0.06); },
    papagaio: function (t) { [0, 0.16].forEach(function (d) { varre(1400, 2600, t + d, 0.08, 'square', 0.07); varre(2600, 1200, t + d + 0.08, 0.06, 'square', 0.06); ruido(t + d, 0.1, 0.12, 3000); }); },
    casco: function (t) { nota(240, t, 0.06, 'square', 0.12); varre(300, 120, t + 0.05, 0.2, 'sine', 0.25); },
    panela: function (t) { [523, 1047, 1568, 2349].forEach(function (f, i) { nota(f * (1 + i * 0.013), t, 0.9 - i * 0.15, 'sine', 0.09); }); ruido(t, 0.05, 0.3, 4000); },
    pote: function (t) { nota(680, t, 0.08, 'triangle', 0.18); nota(440, t + 0.04, 0.08, 'triangle', 0.12); },
    geladeira: function (t) { ruido(t, 0.25, 0.2, 600); varre(110, 90, t + 0.1, 0.6, 'sawtooth', 0.04); nota(1200, t + 0.05, 0.05, 'square', 0.05); },
    agua: function (t) { for (var i = 0; i < 6; i++) ruido(t + i * 0.08, 0.12, 0.15, 2000 + (i % 3) * 900); varre(800, 300, t, 0.15, 'sine', 0.08); },
    bolhas: function (t) { for (var i = 0; i < 5; i++) varre(400 + i * 120, 1200 + i * 200, t + i * 0.06, 0.07, 'sine', 0.1); },
    pop: function (t) { varre(1800, 600, t, 0.05, 'sine', 0.2); ruido(t, 0.02, 0.2, 5000); },
    papel: function (t) { for (var i = 0; i < 6; i++) ruido(t + i * 0.05, 0.05, 0.18, 6000); },
    passos: function (t) { for (var i = 0; i < 4; i++) { varre(120, 70, t + i * 0.32, 0.1, 'sine', 0.35); ruido(t + i * 0.32, 0.05, 0.15, 400); } },
    mamae: function (t) { varre(300, 700, t, 0.25, 'triangle', 0.18); varre(700, 260, t + 0.25, 0.4, 'triangle', 0.16); },
    gangorra: function (t) { varre(300, 380, t, 0.18, 'sawtooth', 0.04); nota(200, t + 0.2, 0.1, 'square', 0.08); },
    areia: function (t) { ruido(t, 0.5, 0.2, 1500); ruido(t + 0.15, 0.4, 0.15, 900); },
    tv: function (t) { ruido(t, 0.15, 0.2, 5000); [523, 659, 784, 1047].forEach(function (f, i) { nota(f, t + 0.15 + i * 0.08, 0.15, 'square', 0.06); }); },
    cuco: function (t) { [0, 0.45].forEach(function (d) { nota(784, t + d, 0.18, 'sine', 0.3); nota(622, t + d + 0.2, 0.25, 'sine', 0.3); }); },
    tambor: function (t) { varre(160, 60, t, 0.25, 'sine', 0.6); ruido(t, 0.1, 0.25, 300); },
    torradeira: function (t) { nota(1500, t, 0.04, 'square', 0.1); varre(300, 900, t + 0.04, 0.15, 'sine', 0.2); },
    liquidificador: function (t) { varre(180, 420, t, 1.2, 'sawtooth', 0.06); varre(190, 430, t, 1.2, 'square', 0.03); },
    microondas: function (t) { nota(1760, t, 0.12, 'sine', 0.2); nota(1760, t + 0.18, 0.12, 'sine', 0.2); },
    descarga: function (t) { ruido(t, 1.2, 0.3, 700); ruido(t + 0.2, 1, 0.2, 1500); varre(400, 150, t, 1.2, 'sine', 0.06); },
    espelho: function (t) { [1568, 2093, 2637].forEach(function (f, i) { nota(f, t + i * 0.06, 0.3, 'sine', 0.06); }); },
    sapo: function (t) { [0, 0.2].forEach(function (d) { varre(140, 90, t + d, 0.15, 'square', 0.12); ruido(t + d, 0.12, 0.12, 400); }); },
    correio: function (t) { nota(1319, t, 0.5, 'sine', 0.2); nota(1047, t + 0.15, 0.6, 'sine', 0.18); },
    porta: function (t) { varre(300, 500, t, 0.25, 'sawtooth', 0.03); nota(220, t + 0.25, 0.1, 'square', 0.08); },
    arrumou: function (t) { [784, 1047, 1319].forEach(function (f, i) { nota(f, t + i * 0.06, 0.25, 'triangle', 0.22); }); },
    guardou: function (t) { varre(900, 300, t, 0.2, 'sine', 0.15); nota(1319, t + 0.18, 0.3, 'triangle', 0.2); },
    tchau: function (t) { varre(1200, 200, t, 0.6, 'sine', 0.2); [784, 988, 1175].forEach(function (f, i) { nota(f, t + 0.1 + i * 0.08, 0.2, 'triangle', 0.12); }); },
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
  [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5].forEach(function (f, i) { SONS['nota' + i] = function (t) { nota(f, t, 0.45, 'triangle', 0.28); nota(f * 2, t, 0.2, 'sine', 0.05); }; });   // pianinho: dó a dó
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
  /* As faixas são a mesma música-base com outro andamento, outro tom, outra ordem de acordes, outra batida e outro
     timbre e desenho de melodia: soam como músicas diferentes sem nenhum arquivo. */
  var FAIXAS = [
    { bpm: 124, tom: 0, ordem: [0, 1, 2, 3], batida: 'reta', lead: 'triangle', desloc: 0 },     // 0: carregamento e "Quem vai jogar"
    { bpm: 132, tom: 2, ordem: [2, 3, 0, 1], batida: 'reta', lead: 'square', desloc: 1 },
    { bpm: 104, tom: -3, ordem: [0, 3, 1, 2], batida: 'balanco', lead: 'triangle', desloc: -1 },
    { bpm: 140, tom: 5, ordem: [3, 0, 1, 2], batida: 'galope', lead: 'sawtooth', desloc: 0 },
    { bpm: 116, tom: -5, ordem: [0, 2, 3, 1], batida: 'balanco', lead: 'square', desloc: 2 },
    { bpm: 128, tom: 3, ordem: [2, 1, 3, 0], batida: 'galope', lead: 'triangle', desloc: -2 },
    { bpm: 120, tom: 7, ordem: [0, 1, 3, 2], batida: 'reta', lead: 'sine', desloc: 1 }
  ];
  // 0 = tela "Quem vai jogar" (um laço curto); as outras se revezam nas rodadas
  var TRILHA = ['comic-game-loop-mischief', 'funshine', 'happy-whistling-ukulele', 'ukulele-song', 'going-bananas', 'llama-in-pajama',
    'my-giant-bunny-friend', 'spring-chicken', 'wakka-wakka', 'hippety-hop', 'silly-boy', 'city-sunshine', 'bit-bit-loop'];
  function volMusica() { return loop && loop.audio ? (baixo ? 0.18 : 0.6) : (baixo ? 0.14 : 0.42); }
  function parar() {
    if (!loop) return;
    var velho = loop; loop = null; clearInterval(velho.timer);
    try { velho.g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4); } catch (e) {}
    setTimeout(function () { if (velho.audio) { try { velho.audio.pause(); velho.audio.removeAttribute('src'); velho.audio.load(); } catch (e) {} } try { velho.g.disconnect(); } catch (e) {} }, 1500);
  }
  function musica(ligar, faixa) {
    if (!ctx) return;
    if (!ligar) { desejada = null; parar(); return; }
    desejada = (faixa >= 0 && faixa < TRILHA.length) ? faixa : 0;
    if (semMusica) return;
    if (loop && loop.faixa === desejada) return;
    parar(); tocarArquivo(desejada);
  }
  function sintetica(fx) { return fx === 0 ? 0 : 1 + (fx - 1) % (FAIXAS.length - 1); }
  function tocarArquivo(fx) {
    var con = root.navigator && root.navigator.connection;
    if (!root.Audio || (root.navigator && root.navigator.onLine === false) || (con && con.saveData)) { tocarFaixa(sintetica(fx), fx); return; }
    var a, item;
    try {
      a = new root.Audio(); a.loop = true; a.preload = 'auto'; a.src = 'musicas/' + TRILHA[fx] + '.mp3';
      var g = ctx.createGain(); g.gain.value = 0.0001; ctx.createMediaElementSource(a).connect(g); g.connect(master);
      item = { g: g, faixa: fx, audio: a, timer: 0 }; loop = item;
      g.gain.setTargetAtTime(volMusica(), ctx.currentTime, 0.6);
    } catch (e) { loop = null; tocarFaixa(sintetica(fx), fx); return; }
    function falhou() {   // sem internet ou arquivo com problema: a sintetizada entra no lugar, na mesma vez
      if (loop !== item) return;
      loop = null; try { a.pause(); a.removeAttribute('src'); item.g.disconnect(); } catch (e) {}
      tocarFaixa(sintetica(fx), fx);
    }
    a.addEventListener('error', falhou);
    var p = a.play(); if (p && p.catch) p.catch(falhou);
  }
  function tocarFaixa(fx, rotulo) {
    var F = FAIXAS[fx], k = Math.pow(2, F.tom / 12);
    var g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master); g.gain.setTargetAtTime(volMusica(), ctx.currentTime, 0.8);
    if (!reverb) { reverb = ctx.createConvolver(); reverb.buffer = impulso(); }
    var rev = ctx.createGain(); rev.gain.value = 0.22; reverb.connect(rev); rev.connect(g);
    var delay = ctx.createDelay(1); delay.delayTime.value = 60 / F.bpm * 0.75; var fb = ctx.createGain(); fb.gain.value = 0.3; var dg = ctx.createGain(); dg.gain.value = 0.25;
    delay.connect(fb); fb.connect(delay); delay.connect(dg); dg.connect(g);
    var padF = ctx.createBiquadFilter(); padF.type = 'lowpass'; padF.frequency.value = 1400; padF.Q.value = 0.7; var padG = ctx.createGain(); padG.gain.value = 0.16; padF.connect(padG); padG.connect(g); padG.connect(reverb);
    var bassF = ctx.createBiquadFilter(); bassF.type = 'lowpass'; bassF.frequency.value = 520; var bassG = ctx.createGain(); bassG.gain.value = 0.3; bassF.connect(bassG); bassG.connect(g);
    var leadG = ctx.createGain(); leadG.gain.value = 0.16; leadG.connect(g); leadG.connect(delay); leadG.connect(reverb);
    var bpm = F.bpm, semi = 60 / bpm / 4, t = ctx.currentTime + 0.1, passo = 0, melI = 0, melAte = 0;
    function osc(tipo, f, t0, dur, dest, vol, detune, ataque) {
      var o = ctx.createOscillator(), e = ctx.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t0); if (detune) o.detune.value = detune;
      e.gain.setValueAtTime(0.0001, t0); e.gain.exponentialRampToValueAtTime(vol, t0 + (ataque || 0.01)); e.gain.setValueAtTime(vol, t0 + dur * 0.7); e.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(e); e.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function bumbo(t0) { var o = ctx.createOscillator(), e = ctx.createGain(); o.frequency.setValueAtTime(160, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 0.18); e.gain.setValueAtTime(0.9, t0); e.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3); o.connect(e); e.connect(g); o.start(t0); o.stop(t0 + 0.32); }
    function palma(t0) { for (var k = 0; k < 3; k++) ruidoEm(t0 + k * 0.012, 0.09, 0.28, 1900, g); ruidoEm(t0 + 0.03, 0.3, 0.12, 1500, reverb); }
    function chimbal(t0, forte) { ruidoEm(t0, forte ? 0.08 : 0.035, forte ? 0.12 : 0.07, 8000, g); }
    function ruidoEm(t0, dur, vol, f, dest) { var n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); var s = ctx.createBufferSource(), e = ctx.createGain(), fl = ctx.createBiquadFilter(); s.buffer = b; fl.type = f > 5000 ? 'highpass' : 'bandpass'; fl.frequency.value = f; fl.Q.value = 0.9; e.gain.value = vol; s.connect(fl); fl.connect(e); e.connect(dest); s.start(t0); }
    loop = { g: g, faixa: rotulo != null ? rotulo : fx, timer: setInterval(function () {
      while (t < ctx.currentTime + 0.5) {
        var compasso = Math.floor(passo / 16) % 8, grau = F.ordem[compasso % 4], acorde = ACORDES[grau], semic = passo % 16, tempo = Math.floor(semic / 4), sub = semic % 4;
        // bateria
        if (F.batida === 'reta' ? sub === 0 : F.batida === 'balanco' ? (semic === 0 || semic === 6 || semic === 8 || semic === 14) : (sub === 0 || semic === 3 || semic === 11)) bumbo(t);
        if (F.batida === 'balanco' ? (semic === 4 || semic === 12) : (sub === 0 && (tempo === 1 || tempo === 3))) palma(t);
        if (sub === 0 || sub === 2) chimbal(t, sub === 2);
        if (compasso === 7 && semic >= 12) ruidoEm(t, 0.08, 0.2, 2600, g);   // viradinha no fim da volta
        // baixo em colcheias, oitava acima nas colcheias fracas
        if (sub === 0 || sub === 2) osc('sawtooth', BAIXO[grau] * k * (sub === 2 ? 2 : 1), t, semi * 1.8, bassF, 0.5, 0, 0.005);
        // pad: no início de cada tempo, pulsando (como um sidechain)
        if (sub === 0) { var durP = semi * 3.6; acorde.forEach(function (f, i) { f *= k; osc('sawtooth', f, t + 0.02, durP, padF, 0.08, -7, 0.03); osc('sawtooth', f, t + 0.02, durP, padF, 0.08, 7, 0.03); if (i === 0) osc('square', f / 2, t + 0.02, durP, padF, 0.05, 0, 0.03); }); }
        // melodia-gancho (começa na 2ª volta, para a introdução respirar)
        if (passo >= 128 && t >= melAte) { var n = GANCHO[melI % GANCHO.length]; melI++; var durN = (n[0] === 0 && n.length === 3 ? n[2] : n[1]) * semi; if (n[0] !== 0) { var fm = PENTA[Math.max(0, Math.min(PENTA.length - 1, n[0] - 1 + F.desloc))] * k; osc(F.lead, fm, t, durN * 0.95, leadG, F.lead === 'triangle' || F.lead === 'sine' ? 0.9 : 0.35, 0, 0.01); osc('square', fm * 2, t, durN * 0.6, leadG, 0.18, 5, 0.01); } melAte = t + durN; }
        t += semi; passo++;
      }
    }, 120) };
  }
  function fixarMudo(v) { mudo = !!v; if (master) master.gain.setTargetAtTime(mudo ? 0 : 0.5, ctx.currentTime, 0.05); }
  function fixarSemMusica(v) { semMusica = !!v; if (!ctx) return; if (semMusica) parar(); else if (desejada != null) { var d = desejada; desejada = null; musica(true, d); } }
  function abaixar(v) { baixo = !!v; if (loop) loop.g.gain.setTargetAtTime(volMusica(), ctx.currentTime, 0.3); }
  root.Som = { iniciar: iniciar, tocar: tocar, musica: musica, FAIXAS: TRILHA.length, abaixar: abaixar,
    tocandoArquivo: function () { return !!(loop && loop.audio && !loop.audio.paused); }, tocando: function () { return !!loop; },
    mudo: function (v) { if (v != null) fixarMudo(v); return mudo; },
    semMusica: function (v) { if (v != null) fixarSemMusica(v); return semMusica; },
    pronto: function () { return !!ctx; } };
})(typeof self !== 'undefined' ? self : this);
