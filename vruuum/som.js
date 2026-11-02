/* Vruuum! — sons feitos na hora pelo navegador (WebAudio): ronco do motor, música de corrida (rock.js),
   estrela, batida, lama, turbo, pulo, buzina, 3-2-1 e festa da chegada. Nenhum arquivo de áudio.
   O navegador só deixa tocar depois de um toque: iniciar() é chamado no primeiro botão. */
(function (raiz) {
  'use strict';
  var ac = null, mestre = null, musGanho = null, motores = [], ligado = true, musicaLigada = false;
  // a música (banda de rock) mora em rock.js; aqui ficam o motor do carro e os efeitos
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function iniciar() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    var AC = raiz.AudioContext || raiz.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    mestre = ac.createGain(); mestre.gain.value = ligado ? 0.8 : 0; mestre.connect(ac.destination);
    musGanho = ac.createGain(); musGanho.gain.value = 0.55; musGanho.connect(mestre);
    if (raiz.VruuumRock) raiz.VruuumRock.preparar(ac, musGanho);
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

  // ---------- música: a "rádio" do jogo ----------
  /* Toca as 36 músicas gravadas (musicas/*.mp3: Kevin MacLeod e Anthem of Rain, CC BY 4.0, SuperTuxKart, CC BY-SA,
     e HoliznaCC0, CC0; créditos em musicas/LICENCAS.md) e, de vez em quando, uma das de rock feitas pelo rock.js. Tocam sem parar, uma depois da outra.
     Sem a gravada (sem internet e ainda não guardada, ou no arquivo baixado), pula para a próxima.
     Um único <audio> para tudo (o iPhone só deixa tocar o elemento que já tocou depois de um toque). */
  var GRAVADAS = [
    { url: 'musicas/volatile-reaction.mp3', nome: 'Volatile Reaction', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/kart-grand-prix.mp3', nome: 'Kart Grand Prix', autor: 'Weirwood', licenca: 'CC BY-SA 3.0' },
    { url: 'musicas/heroic-age.mp3', nome: 'Heroic Age', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/lava.mp3', nome: 'Lava', autor: 'Kalsan', licenca: 'CC BY-SA 3.0' },
    { url: 'musicas/unholy-knight.mp3', nome: 'Unholy Knight', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/las-dunas-champions.mp3', nome: 'Las Dunas Champions', autor: 'ALBatross', licenca: 'CC BY-SA 4.0' },
    // 1.3.0: mais 20 rocks gravados de verdade (bateria, baixo e guitarra): 15 do Kevin MacLeod (CC BY 4.0) e
    // 5 do HoliznaCC0 (álbum "Rock Montage", CC0, domínio público)
    { url: 'musicas/metalmania.mp3', nome: 'Metalmania', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/ready-aim-fire.mp3', nome: 'Ready Aim Fire', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/summon-the-rawk.mp3', nome: 'Summon the Rawk', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/noise-attack.mp3', nome: 'Noise Attack', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/retrofuture-nasty.mp3', nome: 'RetroFuture Nasty', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/hotrock.mp3', nome: 'Hotrock', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/neolith.mp3', nome: 'Neolith', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/iron-bacon.mp3', nome: 'Iron Bacon', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/take-the-lead.mp3', nome: 'Take the Lead', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/exhilarate.mp3', nome: 'Exhilarate', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/cool-hard-facts.mp3', nome: 'Cool Hard Facts', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/bet-you-can.mp3', nome: 'Bet You Can', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/pump.mp3', nome: 'Pump', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/breakdown.mp3', nome: 'Breakdown', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/what-you-want.mp3', nome: 'What You Want', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/holizna-jams.mp3', nome: 'Rock Montage: Jams', autor: 'HoliznaCC0', licenca: 'CC0' },
    { url: 'musicas/holizna-punk.mp3', nome: 'Rock Montage: Punk', autor: 'HoliznaCC0', licenca: 'CC0' },
    { url: 'musicas/holizna-americana.mp3', nome: 'Rock Montage: Americana', autor: 'HoliznaCC0', licenca: 'CC0' },
    { url: 'musicas/holizna-grunge.mp3', nome: 'Rock Montage: Grunge', autor: 'HoliznaCC0', licenca: 'CC0' },
    { url: 'musicas/holizna-classic.mp3', nome: 'Rock Montage: Classic', autor: 'HoliznaCC0', licenca: 'CC0' },
    // 1.4.0: mais 10 rocks animados: 4 da banda Anthem of Rain (instrumentais, CC BY 4.0), 1 do HoliznaCC0 (CC0) e 5 do Kevin MacLeod
    { url: 'musicas/anthem-rock-this-house.mp3', nome: 'Rock This House', autor: 'Anthem of Rain', licenca: 'CC BY 4.0' },
    { url: 'musicas/anthem-bad-nostalgia.mp3', nome: 'Bad Nostalgia', autor: 'Anthem of Rain', licenca: 'CC BY 4.0' },
    { url: 'musicas/anthem-so-my-love.mp3', nome: 'So My Love', autor: 'Anthem of Rain', licenca: 'CC BY 4.0' },
    { url: 'musicas/anthem-leave-the-country.mp3', nome: 'Leave the Country', autor: 'Anthem of Rain', licenca: 'CC BY 4.0' },
    { url: 'musicas/holizna-way-of-the-samurai.mp3', nome: 'Way of the Samurai', autor: 'HoliznaCC0', licenca: 'CC0' },
    { url: 'musicas/retrofuture-clean.mp3', nome: 'RetroFuture Clean', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/zap-beat.mp3', nome: 'Zap Beat', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/el-magicia.mp3', nome: 'El Magicia', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/gearhead.mp3', nome: 'Gearhead', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' },
    { url: 'musicas/bet-you-can-2.mp3', nome: 'Bet You Can (ver 2)', autor: 'Kevin MacLeod (incompetech.com)', licenca: 'CC BY 4.0' }
  ];
  var lista = [], atual = -1, audio = null, aoTrocar = null, falhas = 0;
  // as gravadas em ordem sorteada (cada vez que abre o jogo começa por uma diferente) e, de 8 em 8 gravadas,
  // uma das 3 feitas pelo jogo (sem gravadas, como no arquivo baixado: só as do jogo)
  function montarLista() {
    var semGravadas = !!raiz.JOGO_EM_ARQUIVO || !raiz.Audio;
    var sint = raiz.VruuumRock ? raiz.VruuumRock.MUSICAS.map(function (m, k) { return { s: k, nome: m.nome, autor: 'Vruuum!', licenca: '' }; }) : [];
    var grav = semGravadas ? [] : GRAVADAS.map(function (g) { return { g: g }; });
    for (var k = grav.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)), tmp = grav[k]; grav[k] = grav[r]; grav[r] = tmp; }
    lista = [];
    while (grav.length || sint.length) {
      for (var q = 0; q < 8 && grav.length; q++) lista.push(grav.shift());
      if (sint.length) lista.push(sint.shift());
    }
  }
  function info(item) { return item.g ? { nome: item.g.nome, autor: item.g.autor, licenca: item.g.licenca } : { nome: item.nome, autor: item.autor, licenca: item.licenca }; }
  function pararTudo() { if (raiz.VruuumRock) raiz.VruuumRock.desligar(); if (audio) audio.pause(); }
  function tocarItem(k) {
    if (!lista.length) montarLista();
    if (!lista.length) return;
    atual = ((k % lista.length) + lista.length) % lista.length;
    var it = lista[atual];
    pararTudo();
    if (aoTrocar) aoTrocar(info(it));
    if (!musicaLigada) return;
    if (it.s != null) { raiz.VruuumRock.aoFim = avancar; raiz.VruuumRock.comecar(it.s); falhas = 0; return; }
    if (!audio) {
      audio = new raiz.Audio(); audio.preload = 'auto';
      audio.addEventListener('ended', avancar);   // se o arquivo não carregar, o play() falha e pula (abaixo)
    }
    audio.src = it.g.url; audio.volume = 0.8; audio.muted = !ligado;
    var p = audio.play();
    if (p && p.catch) p.then(function () { falhas = 0; }).catch(function () { if (musicaLigada && ++falhas < lista.length) avancar(); });
  }
  function avancar() { tocarItem(atual + 1); }
  function musica(liga) {
    if (!ac) return;
    if (liga && !musicaLigada) {
      musicaLigada = true;
      if (atual < 0) { tocarItem(0); return; }
      var it = lista[atual];
      if (it.s != null) raiz.VruuumRock.ligar();
      else if (audio) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
    } else if (!liga && musicaLigada) { musicaLigada = false; pararTudo(); }
  }
  // corrida nova: começa a próxima música do início
  function proxima() { tocarItem(atual + 1); }
  // app escondido (outra aba, tela apagada): silencia; ao voltar, continua
  function dormir(sim) {
    if (!ac) return;
    if (sim) { ac.suspend(); if (audio) audio.pause(); }
    else { ac.resume(); if (musicaLigada && atual >= 0 && lista[atual].g && audio) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } }
  }

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
  function alternar() { ligado = !ligado; if (mestre) mestre.gain.setTargetAtTime(ligado ? 0.8 : 0, ac.currentTime, 0.05); if (audio) audio.muted = !ligado; return ligado; }
  function parar() { musica(false); motor([]); }

  raiz.VruuumSom = { iniciar: iniciar, tocar: tocar, motor: motor, musica: musica, proxima: proxima, aoTrocarMusica: function (fn) { aoTrocar = fn; if (atual >= 0 && lista[atual]) fn(info(lista[atual])); }, GRAVADAS: GRAVADAS, dormir: dormir, alternar: alternar, parar: parar, ligado: function () { return ligado; } };
})(this);
