/* Peluqueria — música e efeitos sintetizados no WebAudio (nenhum arquivo, nada com direito autoral).
   Toca as 10 músicas de trilhas.js em sequência (pop dançante de pista), desde a tela de início e pelo jogo
   todo: bumbo com "respiro" nos acordes (sidechain), palmas, chimbal aberto, baixo pulsando, acordes
   cheios (vários osciladores levemente desafinados), melodia com eco, chiado subindo e virada na subida.
   O andamento segue a música, o nível (Criança mais calmo, Maluco mais rápido) e sobe 1 BPM por queda.
   Se musicas/musicas.json listar MP3s do dono, toca um deles sorteado, em laço, no lugar das músicas.
   Sem WebAudio, tudo vira silêncio (sem erro). O som só começa depois do primeiro toque (ligar()). */
(function (root) {
  'use strict';
  var TESTE = /[?&]teste\b/.test((root.location && root.location.search) || '');
  var ARQ = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,60}\.mp3$/;
  var Ctx = root.AudioContext || root.webkitAudioContext;
  var M = root.PeluqueriaTrilhas;
  var ctx = null, mestre = null, ruido = null, busAcordes = null, busLead = null, mudo = false;
  var nivel = 'inicio', queda = 0, faixa = TESTE ? 0 : Math.floor(Math.random() * M.FAIXAS.length), compasso = 0, passo = 0;
  var tipo = 'abertura', rodadas = 0, batidas = [], distorcao = null;   // tipo: 'abertura' (tela de início) | 'jogo'
  var proximo = 0, relogio = 0, tocando = false, contador = 0, eventos = [];
  var minhas = [], audio = null, fonte = '';   // fonte: '' | 'minhas' | 'jogo'
  var registro = TESTE ? [] : null;
  var VOLUME = 0.62;

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ligar() {
    if (!Ctx) return;
    try {
      if (!ctx) {
        ctx = new Ctx();
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.15;
        comp.connect(ctx.destination);
        mestre = ctx.createGain(); mestre.gain.value = mudo ? 0 : VOLUME; mestre.connect(comp);
        busAcordes = ctx.createGain(); busAcordes.gain.value = 1; busAcordes.connect(mestre);
        busLead = ctx.createGain(); busLead.gain.value = 1; busLead.connect(mestre);
        var eco = ctx.createDelay(1), volta = ctx.createGain(), molhado = ctx.createGain();
        eco.delayTime.value = 0.36; volta.gain.value = 0.32; molhado.gain.value = 0.28;
        busLead.connect(eco); eco.connect(volta); volta.connect(eco); eco.connect(molhado); molhado.connect(mestre);
        var n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0);
        for (var k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
        ruido = b;
      }
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') ctx.resume();
    } catch (e) { ctx = null; }
  }

  /* ---------- instrumentos ---------- */
  function env(g, t, ataque, dur, pico) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, pico), t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(ataque + 0.01, dur));
  }
  function osc(t, tipo, freq, detune, dur, destino) {
    var o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(freq, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    o.connect(destino); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function filtro(tipo, freq, q) { var f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; if (q) f.Q.value = q; return f; }
  function ruidoEm(t, dur, f, g) { var s = ctx.createBufferSource(); s.buffer = ruido; s.connect(f); f.connect(g); s.start(t); s.stop(t + dur + 0.02); return s; }

  function bumbo(t, vol) {
    var g = ctx.createGain(); g.connect(mestre); env(g, t, 0.003, 0.4, 1.1 * vol);
    var o = osc(t, 'sine', 160, 0, 0.45, g); o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    var c = ctx.createGain(); c.connect(mestre); env(c, t, 0.001, 0.02, 0.3 * vol); osc(t, 'square', 1200, 0, 0.03, c);
    // "respiro" dos acordes a cada bumbo (sidechain), marca do pop de pista
    busAcordes.gain.cancelScheduledValues(t); busAcordes.gain.setValueAtTime(0.25, t); busAcordes.gain.linearRampToValueAtTime(1, t + 0.2);
  }
  function palma(t, vol) {
    var g = ctx.createGain(); g.connect(mestre);
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.011, 0.022].forEach(function (d) { g.gain.setValueAtTime(0.7 * vol, t + d); g.gain.exponentialRampToValueAtTime(0.08 * vol, t + d + 0.009); });
    g.gain.setValueAtTime(0.6 * vol, t + 0.031); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    ruidoEm(t, 0.22, filtro('bandpass', 1300, 0.9), g);
  }
  function chimbal(t, vol, dur) { var g = ctx.createGain(); g.connect(mestre); env(g, t, 0.002, dur, vol); ruidoEm(t, dur, filtro('highpass', dur > 0.1 ? 7000 : 8500), g); }
  function caixa(t, vol) {
    var g = ctx.createGain(); g.connect(mestre); env(g, t, 0.002, 0.13, 0.6 * vol); ruidoEm(t, 0.14, filtro('bandpass', 1900, 0.7), g);
    var g2 = ctx.createGain(); g2.connect(mestre); env(g2, t, 0.002, 0.08, 0.4 * vol); osc(t, 'triangle', 190, 0, 0.1, g2);
  }
  function crash(t, vol) { var g = ctx.createGain(); g.connect(mestre); env(g, t, 0.003, 1.4, 0.35 * vol); ruidoEm(t, 1.5, filtro('highpass', 4500), g); }
  function riser(t, dur, vol) {
    var f = filtro('bandpass', 300, 1.5), g = ctx.createGain(); g.connect(mestre);
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * vol, t + dur); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.05);
    ruidoEm(t, dur, f, g);
  }
  function baixo(t, nota, dur, vol) {
    var f = filtro('lowpass', 1800, 4), g = ctx.createGain(); f.connect(g); g.connect(mestre);
    f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(260, t + Math.min(dur, 0.25));
    env(g, t, 0.005, dur * 0.95, 0.42 * vol);
    osc(t, 'sawtooth', hz(nota), 0, dur, f); osc(t, 'square', hz(nota - 12), 0, dur, f);
  }
  function acorde(t, notas, dur, vol, abertura, estilo) {
    var f = filtro('lowpass', estilo === 'stab' ? 3200 : 350 + 5200 * abertura * abertura, 0.8), g = ctx.createGain();
    f.connect(g); g.connect(busAcordes);
    var v = vol / notas.length;
    if (estilo === 'stab') { env(g, t, 0.004, 0.16, 0.5 * v * 3); notas.forEach(function (n) { osc(t, 'sawtooth', hz(n), -6, 0.2, f); osc(t, 'sawtooth', hz(n), 6, 0.2, f); }); }
    else {
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32 * v * 3, t + 0.06);
      g.gain.setValueAtTime(0.32 * v * 3, t + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      notas.forEach(function (n) { [-12, 0, 12].forEach(function (d) { osc(t, 'sawtooth', hz(n), d, dur, f); }); });
    }
  }
  function lead(t, nota, dur, vol, timbre) {
    var g = ctx.createGain(), f; g.connect(busLead);
    if (timbre === 'pluck') { f = filtro('lowpass', 5000, 3); f.frequency.setValueAtTime(5000, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.18); f.connect(g); env(g, t, 0.003, Math.min(dur, 0.35), 0.22 * vol); osc(t, 'sawtooth', hz(nota), 0, dur, f); osc(t, 'square', hz(nota), 7, dur, f); return; }
    if (timbre === 'sino') { env(g, t, 0.003, Math.max(0.4, dur), 0.25 * vol); osc(t, 'sine', hz(nota), 0, Math.max(0.4, dur), g); var g2 = ctx.createGain(); g2.connect(busLead); env(g2, t, 0.002, 0.25, 0.1 * vol); osc(t, 'sine', hz(nota + 12), 3, 0.3, g2); return; }
    f = filtro('lowpass', timbre === 'square' ? 2800 : 4200, 1); f.connect(g);
    env(g, t, 0.01, dur * 0.95, 0.17 * vol);
    if (timbre === 'square') { osc(t, 'square', hz(nota), 0, dur, f); osc(t, 'square', hz(nota), 9, dur, f); }
    else { osc(t, 'sawtooth', hz(nota), -9, dur, f); osc(t, 'sawtooth', hz(nota), 9, dur, f); osc(t, 'triangle', hz(nota + 12), 0, dur, f); }
  }

  function arpejo(t, nota, dur, vol) {   // notinhas rápidas e curtas, passam pelo "respiro" dos acordes
    var f = filtro('lowpass', 3400, 2), g = ctx.createGain(); f.connect(g); g.connect(busAcordes);
    env(g, t, 0.003, Math.min(0.16, dur * 0.9), 0.3 * vol);
    osc(t, 'square', hz(nota), 0, 0.18, f); osc(t, 'triangle', hz(nota + 12), 4, 0.18, f);
  }
  function curvaDistorcao() {
    if (distorcao) return distorcao;
    var n = 1024, c = new Float32Array(n);
    for (var k = 0; k < n; k++) { var x = k * 2 / n - 1; c[k] = Math.tanh(x * 6) * 0.9; }
    return (distorcao = c);
  }
  function guitarra(t, notas, dur, vol, sustenta) {   // dente de serra → distorção → filtro: guitarra elétrica
    var ws = ctx.createWaveShaper(), f = filtro('lowpass', sustenta ? 3000 : 3800, 1), g = ctx.createGain();
    ws.curve = curvaDistorcao(); ws.connect(f); f.connect(g); g.connect(mestre);
    var pre = ctx.createGain(); pre.gain.value = 0.6; pre.connect(ws);
    if (sustenta) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16 * vol, t + 0.01); g.gain.setValueAtTime(0.14 * vol, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    else env(g, t, 0.003, Math.min(dur, 0.14), 0.42 * vol);
    notas.forEach(function (n) { osc(t, 'sawtooth', hz(n), -8, dur, pre); osc(t, 'sawtooth', hz(n), 8, dur, pre); });
  }
  function tom(t, vol, altura) {
    var g = ctx.createGain(); g.connect(mestre); env(g, t, 0.003, 0.3, 0.8 * vol);
    var o = osc(t, 'sine', 90 + 160 * altura, 0, 0.32, g); o.frequency.exponentialRampToValueAtTime((90 + 160 * altura) * 0.6, t + 0.25);
  }
  function tocarEvento(e, t, s16, F) {
    var d = e.dur * s16;
    switch (e.tipo) {
      case 'bumbo': return bumbo(t, e.vol);
      case 'palma': return palma(t, e.vol);
      case 'chimbal': return chimbal(t, e.vol * 0.5, 0.04);
      case 'aberto': return chimbal(t, e.vol * 0.4, 0.18);
      case 'caixa': return caixa(t, e.vol);
      case 'crash': return crash(t, e.vol);
      case 'riser': return riser(t, d, e.vol);
      case 'baixo': return baixo(t, e.nota, d, e.vol);
      case 'acorde': return acorde(t, e.notas, d, e.vol, e.filtro, e.estilo);
      case 'lead': return lead(t, e.nota, d, e.vol, F.lead);
      case 'arpejo': return arpejo(t, e.nota, d, e.vol);
      case 'guitarra': return guitarra(t, [e.nota], d, e.vol, false);
      case 'power': return guitarra(t, e.notas, d, e.vol, true);
      case 'tom': return tom(t, e.vol, e.altura);
    }
  }

  /* ---------- sequenciador ---------- */
  function agendar() {
    if (!ctx || !tocando) return;
    if (proximo < ctx.currentTime) proximo = ctx.currentTime + 0.02;   // atrasou (app em segundo plano): pula, sem rajada
    while (proximo < ctx.currentTime + 0.12) {
      var ab = tipo === 'abertura', F = ab ? M.ABERTURA : M.FAIXAS[faixa];
      var s16 = 60 / (ab ? M.ABERTURA.bpm : M.andamento(F, nivel, queda)) / 4;
      if (passo === 0) eventos = (ab ? M.abertura(compasso) : M.partitura(F, compasso)).eventos;
      for (var k = 0; k < eventos.length; k++) if (eventos[k].t === passo) { try { tocarEvento(eventos[k], proximo, s16, F); } catch (e) {} }
      if (passo % 4 === 0 && batidas.length) avisarBatida(proximo - ctx.currentTime);
      contador++; passo++; proximo += s16;
      if (passo === 16) {
        passo = 0;
        if (ab) compasso = M.proximaAbertura(compasso);
        else { var p = M.proxima(faixa, compasso + 1); faixa = p.faixa; compasso = p.compasso; }
      }
    }
  }

  function avisarBatida(emSeg) {   // o nome do jogo pulsa junto com a música
    setTimeout(function () { batidas.forEach(function (fn) { try { fn(); } catch (e) {} }); }, Math.max(0, emSeg * 1000));
  }
  function sintetizada() {
    if (!ctx) return;
    fonte = 'jogo'; tocando = true; passo = 0; proximo = ctx.currentTime + 0.05;   // retoma no começo do compasso onde parou
    clearInterval(relogio); relogio = setInterval(agendar, 25); agendar();
  }
  /* n: 'inicio' (toca a abertura) | 'fim' (segue a música da rodada, no andamento normal) |
     'crianca' | 'normal' | 'maluco' (segue/retoma a música da rodada). */
  function musica(n) {
    if (n === 'inicio' || n === 'fim') { nivel = 'inicio'; queda = 0; } else if (n) nivel = n;
    if (n === 'inicio' && tipo !== 'abertura') { tipo = 'abertura'; compasso = 0; if (tocando) { parar(); return sintetizada(); } }
    if (tocando && fonte === 'jogo') return;
    if (fonte === 'minhas' && audio && !audio.paused) return;
    parar();
    if (!minhas.length) return sintetizada();
    // MP3 do dono; se não tocar (arquivo quebrado, sem internet e fora do cache), volta para as músicas do jogo
    var falhou = function () { if (fonte === 'minhas') { if (audio) try { audio.pause(); } catch (e) {} sintetizada(); } };
    try {
      if (!audio) { audio = new Audio(); audio.loop = true; }
      fonte = 'minhas';
      audio.onerror = falhou;
      audio.src = 'musicas/' + minhas[Math.floor(Math.random() * minhas.length)].arquivo;
      audio.muted = mudo; var pr = audio.play(); if (pr && pr.catch) pr.catch(falhou);
    } catch (e) { falhou(); }
  }
  function andamento(i) { queda = i || 0; }
  /* começo de rodada: a próxima música da lista, do começo (cada rodada uma música diferente) */
  function rodada(n) {
    nivel = n; queda = 0;
    if (rodadas++ > 0 || tipo === 'jogo') faixa = (faixa + 1) % M.FAIXAS.length;
    tipo = 'jogo'; compasso = 0;
    if (fonte === 'minhas' && audio && !audio.paused) return;
    parar(); musica(n);
  }
  function parar() {
    tocando = false; fonte = ''; clearInterval(relogio);
    if (audio) try { audio.pause(); } catch (e) {}
  }

  /* ---------- efeitos ---------- */
  function nota(t, freq, dur, tipo, vol, corte) {
    var f = filtro('lowpass', corte || 3000), g = ctx.createGain(); f.connect(g); g.connect(mestre);
    env(g, t, 0.01, dur, vol); return osc(t, tipo, freq, 0, dur, f);
  }
  /* "u-huuu!" de torcida: várias vozes sintetizadas (fonte de pulsos + filtros de vogal "u"), cada uma com
     o "u" curto, o "h" de ar e o "huuu" subindo de tom; mais barulho de plateia e um assobio. */
  function vozTorcida(t, f0, vol, forma) {
    var soma = ctx.createGain(); soma.connect(mestre);
    soma.gain.setValueAtTime(0.0001, t);
    soma.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.03);           // "u"
    soma.gain.exponentialRampToValueAtTime(0.08 * vol, t + 0.13);          // respiro do "h"
    soma.gain.exponentialRampToValueAtTime(1.0 * vol, t + 0.22);           // "HUUU"
    soma.gain.setValueAtTime(0.9 * vol, t + 0.6);
    soma.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    [[350, 6, 1], [850, 8, 0.45], [2400, 10, 0.12]].forEach(function (fm) {   // formantes da vogal "u"
      var bp = filtro('bandpass', fm[0] * forma, fm[1]), g = ctx.createGain(); g.gain.value = fm[2] * 6;
      bp.connect(g); g.connect(soma);
      var o = osc(t, 'sawtooth', f0, 0, 1.2, bp);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.setValueAtTime(f0 * 1.45, t + 0.16);
      o.frequency.linearRampToValueAtTime(f0 * 1.75, t + 0.4);
      o.frequency.linearRampToValueAtTime(f0 * 1.25, t + 1.1);
      var lfo = ctx.createOscillator(), prof = ctx.createGain(); lfo.frequency.value = 5.5 + Math.random() * 1.5; prof.gain.value = f0 * 0.03;
      lfo.connect(prof); prof.connect(o.frequency); lfo.start(t + 0.25); lfo.stop(t + 1.2);
    });
    var gh = ctx.createGain(); gh.connect(mestre); env(gh, t + 0.13, 0.01, 0.07, 0.25 * vol); ruidoEm(t + 0.13, 0.08, filtro('bandpass', 1600, 1), gh);   // "h"
  }
  function torcida(t) {
    [[175, 0, 1], [220, 0.03, 1], [280, 0.05, 1.08], [350, 0.02, 1.15], [440, 0.07, 1.22], [520, 0.04, 1.25]].forEach(function (v) {
      vozTorcida(t + v[1], v[0], 0.22, v[2]);
    });
    var gp = ctx.createGain(); gp.connect(mestre);   // plateia
    gp.gain.setValueAtTime(0.0001, t); gp.gain.exponentialRampToValueAtTime(0.3, t + 0.3); gp.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    ruidoEm(t, 1.8, filtro('bandpass', 1000, 0.5), gp);
    var ga = ctx.createGain(); ga.connect(mestre); env(ga, t + 0.25, 0.02, 0.55, 0.12);   // assobio
    var a = osc(t + 0.25, 'sine', 2300, 0, 0.6, ga);
    a.frequency.setValueAtTime(2300, t + 0.25); a.frequency.linearRampToValueAtTime(2950, t + 0.4); a.frequency.linearRampToValueAtTime(2600, t + 0.8);
  }

  var EFEITOS = {
    uhul: function (t) { torcida(t); },
    toque: function (t) { nota(t, 880, 0.08, 'square', 0.12); },
    conta: function (t) { nota(t, hz(76), 0.12, 'sawtooth', 0.18, 4000); },
    PERFEITO: function (t) {   // acorde brilhante subindo + prato
      [[72, 76, 79], [76, 79, 84]].forEach(function (ac, k) { ac.forEach(function (m) { nota(t + k * 0.12, hz(m), 0.35, 'sawtooth', 0.12, 5000); }); });
      crash(t + 0.12, 0.8);
    },
    BOM: function (t) { [72, 79].forEach(function (m, k) { nota(t + k * 0.09, hz(m), 0.22, 'sawtooth', 0.16, 4000); }); },
    QUASE: function (t) { nota(t, hz(67), 0.25, 'triangle', 0.22); },
    LONGE: function (t) {   // "fom-fom"
      [0, 0.25].forEach(function (d) { var o = nota(t + d, 220, 0.22, 'sawtooth', 0.22, 900); o.frequency.exponentialRampToValueAtTime(120, t + d + 0.2); });
    },
    fim: function (t) { [60, 64, 67, 72, 76, 79, 84].forEach(function (m, k) { nota(t + k * 0.09, hz(m), 0.4, 'sawtooth', 0.14, 4500); }); crash(t + 0.63, 1); }
  };
  function efeito(nome) {
    if (registro) registro.push(nome);
    if (!ctx || mudo || !EFEITOS[nome]) return;
    try { EFEITOS[nome](ctx.currentTime + 0.01); } catch (e) {}
  }
  function definirMudo(b) {
    mudo = !!b;
    if (mestre) mestre.gain.value = mudo ? 0 : VOLUME;
    if (audio) audio.muted = mudo;
  }

  /* MP3s do dono (musicas/musicas.json): [{ "nome": "...", "arquivo": "festa.mp3" }] */
  if (root.fetch) {
    root.fetch('musicas/musicas.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (v) {
      if (Array.isArray(v)) minhas = v.filter(function (o) { return o && typeof o.arquivo === 'string' && ARQ.test(o.arquivo) && o.arquivo.indexOf('..') < 0; }).slice(0, 50);
    }).catch(function () {});
  }

  root.PeluqueriaSom = {
    ligar: ligar, musica: musica, andamento: andamento, parar: parar, efeito: efeito, mudo: definirMudo, registro: registro,
    minhas: function () { return minhas.slice(); }, fonte: function () { return fonte; },
    rodada: rodada, aoBater: function (fn) { batidas.push(fn); },
    posicao: function () { return tipo === 'abertura' ? { faixa: 'abertura', compasso: compasso, nome: M.ABERTURA.nome } : { faixa: faixa, compasso: compasso, nome: M.FAIXAS[faixa].nome }; },
    _ctx: function () { return ctx; }, _passos: function () { return contador; }
  };
})(typeof self !== 'undefined' ? self : this);
