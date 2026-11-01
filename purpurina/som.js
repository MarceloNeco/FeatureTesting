/* Purpurina — música e sons feitos na hora pelo navegador (WebAudio). Nenhum arquivo de áudio.
   Mesmo motor do Vruuum! (som.js de lá), com músicas e timbres próprios: sininhos, palmas e
   baixo dançante. O navegador só deixa tocar depois de um toque: iniciar() é chamado no 1º botão. */
(function (raiz) {
  'use strict';
  var ac = null, mestre = null, musGanho = null, ligado = true, musicaLigada = false, timer = null, prox = 0, passo = 0, faixa = 0;
  /* Três músicas bem animadas, compostas aqui (nenhuma copiada). 16 compassos cada: 8 de estrofe e 8 de
     refrão (mais cheio, melodia uma oitava acima), virada de bateria e prato na volta. A melodia nasce das
     notas do acorde de cada compasso, com ritmo próprio por parte, então sempre combina. */
  var MUSICAS = [
    { nome: 'Brilho de Purpurina', bpm: 128, tom: 64, acordes: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],
      ritmoA: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0], ritmoB: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
      subidaA: [0, 1, 2, 1, 0, 2, 3, 2], subidaB: [3, 4, 3, 2, 3, 4, 5, 3], baixo: 'disco' },
    { nome: 'Passarela Rosa', bpm: 136, tom: 62, acordes: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [5, 9, 12]],
      ritmoA: [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0], ritmoB: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1],
      subidaA: [2, 1, 0, 1, 2, 3, 2, 1], subidaB: [4, 3, 4, 5, 4, 3, 2, 3], baixo: 'pulo' },
    { nome: 'Laço de Estrela', bpm: 142, tom: 67, acordes: [[0, 4, 7], [-5, -1, 2], [-3, 0, 4], [-7, -3, 0]],
      ritmoA: [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0], ritmoB: [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
      subidaA: [0, 2, 1, 3, 2, 1, 2, 0], subidaB: [3, 5, 4, 3, 4, 5, 4, 2], baixo: 'oitava' }
  ];
  function PASSO() { return 60 / MUSICAS[faixa].bpm / 4; }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function iniciar() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = raiz.AudioContext || raiz.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    mestre = ac.createGain(); mestre.gain.value = ligado ? 0.8 : 0; mestre.connect(ac.destination);
    musGanho = ac.createGain(); musGanho.gain.value = 0.4; musGanho.connect(mestre);
  }
  function tom(tipo, f, ini, dur, vol, fFim, destino) {
    if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, ini);
    if (fFim) o.frequency.exponentialRampToValueAtTime(fFim, ini + dur);
    g.gain.setValueAtTime(0.0001, ini); g.gain.exponentialRampToValueAtTime(vol, ini + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    o.connect(g); g.connect(destino || mestre); o.start(ini); o.stop(ini + dur + 0.05);
  }
  var ruidoBuf = null;
  function ruido(ini, dur, vol, filtro, freq, destino) {
    if (!ac) return;
    if (!ruidoBuf) { ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = ruidoBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = ruidoBuf; f.type = filtro; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, ini); g.gain.exponentialRampToValueAtTime(0.0001, ini + dur);
    s.connect(f); f.connect(g); g.connect(destino || mestre); s.start(ini); s.stop(ini + dur + 0.05);
  }
  // sininho: seno + uma pitada de harmônico (som de caixinha de música)
  function sino(f, ini, dur, vol, destino) { tom('sine', f, ini, dur, vol, 0, destino); tom('sine', f * 2.01, ini, dur * 0.5, vol * 0.3, 0, destino); }

  // ---------- música ----------
  function tocarPasso(n, ini) {
    var mu = MUSICAS[faixa], dur = PASSO(), compasso = Math.floor(n / 16) % 16, p = n % 16, refrao = compasso >= 8;
    var ac0 = mu.acordes[compasso % 4], raiz0 = mu.tom + ac0[0];
    var virada = (compasso === 7 || compasso === 15) && p >= 12;
    // bateria: bumbo em todo tempo (four on the floor), palma no 2 e 4, chimbal aberto no contratempo
    if (p % 4 === 0 && !virada) tom('sine', 150, ini, 0.22, 0.95, 40, musGanho);
    if (p === 4 || p === 12) { ruido(ini, 0.14, 0.45, 'bandpass', 1300, musGanho); ruido(ini + 0.015, 0.12, 0.35, 'bandpass', 2200, musGanho); ruido(ini + 0.03, 0.1, 0.25, 'bandpass', 1700, musGanho); }
    if (p % 4 === 2) ruido(ini, 0.14, 0.18, 'highpass', 7000, musGanho);
    else if (refrao || p % 2) ruido(ini, 0.03, 0.09, 'highpass', 9000, musGanho);
    if (virada) { ruido(ini, 0.08, 0.25 + (p - 12) * 0.08, 'bandpass', 1400 + (p - 12) * 350, musGanho); tom('sine', 300 - (p - 12) * 40, ini, 0.1, 0.3, 120, musGanho); }
    if (p === 0 && (compasso === 0 || compasso === 8)) ruido(ini, 1.5, 0.2, 'highpass', 5000, musGanho);
    // baixo
    var nb = -1;
    if (mu.baixo === 'disco') nb = p % 2 === 0 ? raiz0 - 24 + (p % 4 === 2 ? 12 : 0) : -1;
    if (mu.baixo === 'pulo' && [0, 3, 6, 8, 10, 11, 14].indexOf(p) >= 0) nb = raiz0 - 24 + (p === 6 || p === 14 ? 12 : 0);
    if (mu.baixo === 'oitava') nb = p % 4 === 0 ? raiz0 - 24 : p % 4 === 2 ? raiz0 - 12 : -1;
    if (nb > 0) { tom('triangle', hz(nb), ini, dur * 0.9, 0.4, 0, musGanho); tom('sawtooth', hz(nb), ini, dur * 0.7, 0.12, 0, musGanho); }
    // acordes em "pluck" no contratempo (mais cheios no refrão)
    if (p % 4 === 2 || (refrao && p % 8 === 7)) ac0.forEach(function (iv) { tom('triangle', hz(mu.tom + iv + 12), ini, dur * 1.6, refrao ? 0.08 : 0.055, 0, musGanho); tom('sawtooth', hz(mu.tom + iv + 12), ini, dur * 0.8, 0.025, 0, musGanho); });
    // sininhos em arpejo
    sino(hz(mu.tom + ac0[p % 3] + 24 + (refrao && p % 8 >= 4 ? 12 : 0)), ini, dur * 1.4, refrao ? 0.05 : 0.035, musGanho);
    // melodia
    var ritmo = refrao ? mu.ritmoB : mu.ritmoA, subida = refrao ? mu.subidaB : mu.subidaA;
    if (ritmo[p]) {
      var grau = subida[(Math.floor(p / 2) + compasso) % 8], oit = Math.floor(grau / 3), nota = mu.tom + ac0[grau % 3] + 12 * (oit + (refrao ? 1 : 0));
      var longa = !ritmo[(p + 1) % 16] ? 1.8 : 0.9;
      tom('square', hz(nota), ini, dur * longa, 0.06, 0, musGanho);
      tom('triangle', hz(nota), ini, dur * longa, 0.13, 0, musGanho);
      if (refrao) tom('sine', hz(nota + 12), ini, dur * longa, 0.04, 0, musGanho);
    }
  }
  function agendar() {
    if (!ac) return;
    while (prox < ac.currentTime + 0.12) {
      tocarPasso(passo, prox); passo++; prox += PASSO();
      if (passo >= 16 * 16 * 2) { passo = 0; faixa = (faixa + 1) % MUSICAS.length; }   // depois de 2 voltas, a próxima música
    }
  }
  function musica(liga) {
    if (!ac) return;
    if (liga && !musicaLigada) { musicaLigada = true; passo = 0; prox = ac.currentTime + 0.05; timer = setInterval(agendar, 25); }
    else if (!liga && musicaLigada) { musicaLigada = false; clearInterval(timer); timer = null; }
  }
  // desafio novo ou desfile: a próxima música, do começo
  function proxima() { faixa = (faixa + 1) % MUSICAS.length; passo = 0; if (ac) prox = Math.max(prox, ac.currentTime + 0.05); }
  // app escondido (outra aba, tela apagada): silencia; ao voltar, continua
  function dormir(sim) { if (!ac) return; if (sim) ac.suspend(); else ac.resume(); }

  // ---------- efeitos ----------
  var efeitos = {
    clique: function (t) { sino(1320, t, 0.12, 0.12); },
    aba: function (t) { sino(880, t, 0.1, 0.1); sino(1175, t + 0.05, 0.12, 0.1); },
    brilho: function (t) { [1568, 1976, 2349, 3136].forEach(function (f, k) { sino(f, t + k * 0.04, 0.25, 0.08); }); },
    pincel: function (t) { ruido(t, 0.25, 0.25, 'bandpass', 3000); ruido(t + 0.12, 0.2, 0.18, 'bandpass', 4200); },
    roupa: function (t) { ruido(t, 0.18, 0.2, 'highpass', 2500); tom('sine', 500, t, 0.18, 0.15, 900); },
    desfazer: function (t) { tom('triangle', 700, t, 0.15, 0.15, 350); },
    surpresa: function (t) { for (var k = 0; k < 8; k++) sino(784 * Math.pow(2, k / 6), t + k * 0.05, 0.15, 0.09); ruido(t + 0.4, 0.5, 0.12, 'highpass', 6000); },
    foto: function (t) { ruido(t, 0.06, 0.6, 'highpass', 3000); ruido(t + 0.08, 0.05, 0.4, 'highpass', 2500); },
    coracao: function (t) { tom('sine', 523, t, 0.15, 0.2); tom('sine', 784, t + 0.1, 0.25, 0.2); },
    dica: function (t) { sino(1047, t, 0.15, 0.12); sino(1568, t + 0.08, 0.3, 0.12); },
    estrela: function (t) { [1047, 1319, 1568].forEach(function (f, k) { sino(f, t + k * 0.06, 0.2, 0.12); }); },
    aplausos: function (t) { for (var k = 0; k < 26; k++) ruido(t + k * 0.06 + Math.random() * 0.04, 0.05, 0.25 + Math.random() * 0.2, 'bandpass', 1200 + Math.random() * 1500); },
    tada: function (t) { [523, 659, 784, 1047].forEach(function (f, k) { tom('square', f, t + k * 0.09, k === 3 ? 0.7 : 0.12, 0.11); sino(f * 2, t + k * 0.09, 0.4, 0.06); }); ruido(t + 0.4, 1.2, 0.14, 'highpass', 5500); }
  };
  function tocar(nome) { if (!ac || !ligado || !efeitos[nome]) return; efeitos[nome](ac.currentTime + 0.005); }
  function alternar() { ligado = !ligado; if (mestre) mestre.gain.setTargetAtTime(ligado ? 0.8 : 0, ac.currentTime, 0.05); return ligado; }

  raiz.PurpurinaSom = { iniciar: iniciar, tocar: tocar, musica: musica, proxima: proxima, dormir: dormir, alternar: alternar, ligado: function () { return ligado; }, MUSICAS: MUSICAS };
})(this);
