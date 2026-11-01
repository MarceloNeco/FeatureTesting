/* Vruuum! — sons feitos na hora pelo navegador (WebAudio): ronco do motor, música de corrida,
   estrela, batida, lama, turbo, pulo, buzina, 3-2-1 e festa da chegada. Nenhum arquivo de áudio.
   O navegador só deixa tocar depois de um toque: iniciar() é chamado no primeiro botão. */
(function (raiz) {
  'use strict';
  var ac = null, mestre = null, musGanho = null, motores = [], ligado = true, musicaLigada = false, timer = null, prox = 0, passo = 0, faixa = 0;
  /* Três músicas bem animadas, compostas aqui (nenhuma copiada). Cada uma tem 16 compassos:
     8 de estrofe e 8 de refrão (mais forte, melodia uma oitava acima), virada de bateria no fim de
     cada parte e prato na volta. A melodia nasce das notas do acorde de cada compasso, com um
     ritmo próprio por parte, então sempre combina. Tocam sem parar, em sequência. */
  var MUSICAS = [
    { nome: 'Turbo Arco-Íris', bpm: 150, tom: 60, acordes: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],
      ritmoA: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0], ritmoB: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1],
      subidaA: [0, 1, 2, 1, 2, 3, 2, 1], subidaB: [3, 2, 3, 4, 3, 2, 1, 2], baixo: 'oitava' },
    { nome: 'Doce Velocidade', bpm: 140, tom: 65, acordes: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]],
      ritmoA: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0], ritmoB: [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
      subidaA: [2, 1, 0, 1, 2, 2, 3, 1], subidaB: [4, 3, 2, 3, 4, 3, 2, 0], baixo: 'funk' },
    { nome: 'Pulo Neon', bpm: 160, tom: 57, acordes: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]],
      ritmoA: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0], ritmoB: [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1],
      subidaA: [0, 2, 1, 3, 2, 1, 0, 2], subidaB: [4, 3, 4, 2, 3, 4, 3, 1], baixo: 'galope' }
  ];
  function PASSO() { return 60 / MUSICAS[faixa].bpm / 4; }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function iniciar() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = raiz.AudioContext || raiz.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    mestre = ac.createGain(); mestre.gain.value = ligado ? 0.8 : 0; mestre.connect(ac.destination);
    musGanho = ac.createGain(); musGanho.gain.value = 0.42; musGanho.connect(mestre);
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

  // ---------- música ----------
  function tocarPasso(n, ini) {
    var mu = MUSICAS[faixa], dur = PASSO(), compasso = Math.floor(n / 16) % 16, p = n % 16, refrao = compasso >= 8;
    var ac0 = mu.acordes[compasso % 4], raiz0 = mu.tom + ac0[0];
    var virada = (compasso === 7 || compasso === 15) && p >= 12;
    // bateria: bumbo em todo tempo, palma no 2 e 4, chimbal aberto no contratempo
    if (p % 4 === 0 && !virada) tom('sine', 160, ini, 0.2, 0.9, 42, musGanho);
    if (p === 4 || p === 12) { ruido(ini, 0.16, 0.45, 'bandpass', 1500, musGanho); ruido(ini + 0.012, 0.1, 0.3, 'bandpass', 2400, musGanho); }
    if (p % 4 === 2) ruido(ini, 0.12, 0.2, 'highpass', 6000, musGanho);
    else if (refrao || p % 2) ruido(ini, 0.03, 0.1, 'highpass', 8000, musGanho);
    if (virada) ruido(ini, 0.09, 0.25 + (p - 12) * 0.08, 'bandpass', 1200 + (p - 12) * 300, musGanho);
    if (p === 0 && (compasso === 0 || compasso === 8)) ruido(ini, 1.4, 0.22, 'highpass', 4500, musGanho);
    // baixo
    var nb = -1;
    if (mu.baixo === 'oitava') nb = p % 4 === 0 ? raiz0 - 24 : p % 4 === 2 ? raiz0 - 12 : -1;
    if (mu.baixo === 'funk' && [0, 3, 6, 7, 10, 12, 14].indexOf(p) >= 0) nb = raiz0 - 24 + (p === 7 || p === 14 ? 12 : 0);
    if (mu.baixo === 'galope' && p % 4 !== 1) nb = raiz0 - 24 + (p % 4 === 3 ? 12 : 0);
    if (nb > 0) { tom('sawtooth', hz(nb), ini, dur * 0.9, 0.22, 0, musGanho); tom('sine', hz(nb), ini, dur * 0.9, 0.35, 0, musGanho); }
    // acordes em "stab" no contratempo (mais cheios no refrão)
    if (p % 4 === 2 || (refrao && p % 8 === 7)) ac0.forEach(function (iv) { tom('sawtooth', hz(mu.tom + iv + 12), ini, dur * 1.4, refrao ? 0.06 : 0.04, 0, musGanho); });
    // arpejo brilhante em semicolcheias
    tom('square', hz(mu.tom + ac0[p % 3] + 24), ini, dur * 0.6, refrao ? 0.035 : 0.025, 0, musGanho);
    // melodia: notas do acorde no ritmo da parte
    var ritmo = refrao ? mu.ritmoB : mu.ritmoA, subida = refrao ? mu.subidaB : mu.subidaA;
    if (ritmo[p]) {
      var grau = subida[(Math.floor(p / 2) + compasso) % 8], oit = Math.floor(grau / 3), nota = mu.tom + ac0[grau % 3] + 12 * (oit + (refrao ? 2 : 1));
      var longa = !ritmo[(p + 1) % 16] ? 1.8 : 0.9;
      tom('square', hz(nota), ini, dur * longa, 0.07, 0, musGanho);
      tom('triangle', hz(nota), ini, dur * longa, 0.12, 0, musGanho);
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
  // corrida nova: começa a próxima música do início
  function proxima() { faixa = (faixa + 1) % MUSICAS.length; passo = 0; if (ac) prox = Math.max(prox, ac.currentTime + 0.05); }
  // app escondido (outra aba, tela apagada): silencia; ao voltar, continua
  function dormir(sim) { if (!ac) return; if (sim) ac.suspend(); else ac.resume(); }

  // ---------- motor (um por jogador) ----------
  function motor(vels) {
    if (!ac) return;
    while (motores.length < vels.length) {
      var o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(mestre); o.start(); o2.start();
      motores.push({ o: o, o2: o2, g: g, f: f });
    }
    motores.forEach(function (m, k) {
      var v = vels[k], agora = ac.currentTime;
      if (v == null) { m.g.gain.setTargetAtTime(0, agora, 0.1); return; }
      var f0 = 48 + v * 95 + (k ? 6 : 0);
      m.o.frequency.setTargetAtTime(f0, agora, 0.08); m.o2.frequency.setTargetAtTime(f0 * 0.5, agora, 0.08);
      m.f.frequency.setTargetAtTime(300 + v * 700, agora, 0.1);
      m.g.gain.setTargetAtTime(0.035 + v * 0.03, agora, 0.1);
    });
  }

  // ---------- efeitos ----------
  var efeitos = {
    estrela: function (t) { tom('square', 988, t, 0.07, 0.12); tom('square', 1319, t + 0.06, 0.14, 0.12); },
    estrelaAr: function (t) { [1047, 1319, 1568, 2093].forEach(function (f, k) { tom('square', f, t + k * 0.05, 0.1, 0.1); }); },
    batida: function (t) { ruido(t, 0.35, 0.6, 'lowpass', 900); tom('sawtooth', 220, t, 0.4, 0.2, 60); tom('sine', 600, t + 0.15, 0.5, 0.1, 1200); },
    cone: function (t) { tom('triangle', 500, t, 0.12, 0.3, 250); ruido(t, 0.1, 0.3, 'bandpass', 1200); },
    lama: function (t) { ruido(t, 0.4, 0.4, 'lowpass', 500); tom('sine', 180, t, 0.3, 0.25, 70); },
    turbo: function (t) { tom('sawtooth', 200, t, 0.6, 0.15, 1200); ruido(t, 0.6, 0.25, 'highpass', 2000); },
    pulo: function (t) { tom('square', 300, t, 0.35, 0.12, 900); },
    perdeu: function (t) { [880, 740, 620].forEach(function (f, k) { tom('triangle', f, t + k * 0.06, 0.08, 0.1); }); },
    tum: function (t) { tom('sine', 160, t, 0.15, 0.4, 80); },
    buzina: function (t, k) { var f = k ? 440 : 523; [0, 0.18].forEach(function (d) { tom('square', f, t + d, 0.13, 0.12); tom('square', f * 1.25, t + d, 0.13, 0.1); }); },
    bip: function (t) { tom('square', 660, t, 0.18, 0.2); },
    vai: function (t) { tom('square', 1320, t, 0.4, 0.22); },
    mundo: function (t) { [523, 659, 784].forEach(function (f, k) { tom('triangle', f, t + k * 0.08, 0.2, 0.15); }); },
    chegou: function (t) { [523, 659, 784, 1047, 784, 1047].forEach(function (f, k) { tom('square', f, t + k * 0.11, k === 5 ? 0.6 : 0.12, 0.13); }); ruido(t + 0.7, 1.2, 0.15, 'highpass', 5000); },
    clique: function (t) { tom('triangle', 880, t, 0.06, 0.15); }
  };
  function tocar(nome, k) { if (!ac || !ligado || !efeitos[nome]) return; efeitos[nome](ac.currentTime + 0.005, k); }
  function alternar() { ligado = !ligado; if (mestre) mestre.gain.setTargetAtTime(ligado ? 0.8 : 0, ac.currentTime, 0.05); return ligado; }
  function parar() { musica(false); motor([]); }

  raiz.VruuumSom = { iniciar: iniciar, tocar: tocar, motor: motor, musica: musica, proxima: proxima, dormir: dormir, alternar: alternar, parar: parar, ligado: function () { return ligado; } };
})(this);
