/* Peluqueria — música e efeitos.
   MÚSICA (v0.5.0): músicas GRAVADAS, de verdade, com licença aberta — Kevin MacLeod (incompetech.com),
   CC BY 4.0 (créditos no menu e no CREDITOS.md). A lista fica em musicas/musicas.json: uma é a abertura (toca em
   laço no menu) e as outras tocam uma por rodada, embaralhadas, emendando quando uma acaba. O arquivo é tocado
   pelo navegador (<audio>) e passa pelo WebAudio só para o volume e o "mudo" (no iPhone o volume do <audio> não
   muda). Ao sair da página, a música e os efeitos param NA HORA (pausa + contexto suspenso) e voltam de onde
   pararam. Arquivo que não carrega é pulado, sem erro.
   EFEITOS: curtos e sintetizados no WebAudio (acerto, erro, contagem). O "u-huuu!" do PERFEITO (v0.6.0) é
   GRAVADO: voz de verdade + torcida (efeitos/uhul-1.mp3 e uhul-2.mp3, créditos no CREDITOS.md); se o arquivo
   não carregar, cai na torcida sintetizada.
   O som só começa depois do primeiro toque (regra dos navegadores). */
(function (root) {
  'use strict';
  var TESTE = /[?&]teste\b/.test((root.location && root.location.search) || '');
  var ARQ = /^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,80}\.mp3$/;
  var Ctx = root.AudioContext || root.webkitAudioContext;
  var ctx = null, mestre = null, ruido = null, ganhoMusica = null, mudo = false;
  var VOLUME = 0.8, VOLUME_MUSICA = 0.75;
  var abertura = null, lista = [], ordem = [], ponteiro = -1, ruins = {}, forcada = null;
  var player = null, atual = null, tipo = 'abertura', faixa = -1, tocando = false, fonte = '';
  var pulso = 0, batidas = [], trocas = [];
  var registro = TESTE ? [] : null;
  var gritos = [], ultimoGrito = -1;   // "u-huuu!" gravados, decodificados uma vez

  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function ligar() {
    if (!Ctx) return;
    try {
      if (!ctx) {
        ctx = new Ctx();
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -10; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
        comp.connect(ctx.destination);
        mestre = ctx.createGain(); mestre.gain.value = mudo ? 0 : VOLUME; mestre.connect(comp);
        var n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0);
        for (var k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
        ruido = b;
        ligarPlayer();
        carregarGritos();
      }
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') ctx.resume();
    } catch (e) { ctx = null; }
  }

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


  function crash(t, vol) { var g = ctx.createGain(); g.connect(mestre); env(g, t, 0.003, 1.4, 0.35 * vol); ruidoEm(t, 1.5, filtro('highpass', 4500), g); }

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

  function carregarGritos() {
    if (!root.fetch) return;
    ['uhul-1.mp3', 'uhul-2.mp3'].forEach(function (f) {
      root.fetch('efeitos/' + f).then(function (r) { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
        .then(function (a) { return new Promise(function (ok, nao) { var p = ctx.decodeAudioData(a, ok, nao); if (p && p.then) p.then(ok, nao); }); })
        .then(function (b) { if (b && gritos.indexOf(b) < 0) gritos.push(b); }).catch(function () {});
    });
  }
  function grito(t) {
    if (!gritos.length) { torcida(t); return; }
    ultimoGrito = (ultimoGrito + 1) % gritos.length;   // alterna as duas gravações
    var s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = 0.9;
    s.buffer = gritos[ultimoGrito]; s.connect(g); g.connect(mestre); s.start(t);
  }

  var EFEITOS = {
    uhul: function (t) { grito(t); },
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

  /* ---------- música gravada ---------- */
  function ligarPlayer() {
    if (!player) {
      player = new Audio(); player.preload = 'auto';
      player.addEventListener('ended', function () { if (tipo === 'jogo') proximaJogo(); });
      player.addEventListener('error', function () { if (atual) ruins[atual.arquivo] = true; if (tipo === 'jogo') proximaJogo(); else if (lista.length) { tipo = 'jogo'; proximaJogo(); } });
    }
    if (ctx && !ganhoMusica && ctx.createMediaElementSource) {
      try {
        var src = ctx.createMediaElementSource(player);
        ganhoMusica = ctx.createGain(); ganhoMusica.gain.value = VOLUME_MUSICA;
        src.connect(ganhoMusica); ganhoMusica.connect(mestre);
      } catch (e) { ganhoMusica = null; }
    }
    if (!ganhoMusica) player.volume = VOLUME_MUSICA;
    player.muted = mudo && !ganhoMusica;
  }
  function avisarTroca() { trocas.forEach(function (fn) { try { fn(atual); } catch (e) {} }); }
  function pulsar() {
    clearInterval(pulso);
    if (!tocando || !atual) return;
    pulso = setInterval(function () { if (tocando) batidas.forEach(function (fn) { try { fn(); } catch (e) {} }); }, 60000 / (atual.bpm || 120));
  }
  function tocar(entrada, emLaco) {
    ligarPlayer();
    atual = entrada; faixa = tipo === 'jogo' ? lista.indexOf(entrada) : -1;
    player.loop = !!emLaco;
    player.src = 'musicas/' + entrada.arquivo;
    try { player.currentTime = 0; } catch (e) {}
    retomar(); avisarTroca();
  }
  function retomar() {
    if (!player || !atual) return;
    tocando = true; fonte = 'jogo';
    try { var pr = player.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
    pulsar();
  }
  function proximaJogo() {
    if (!lista.length) return;
    var entrada = null;
    if (forcada) { entrada = forcada; forcada = null; }
    else for (var k = 0; k < lista.length && !entrada; k++) {
      ponteiro = (ponteiro + 1) % ordem.length;
      var e = lista[ordem[ponteiro]]; if (!ruins[e.arquivo] && e !== atual) entrada = e;
    }
    if (!entrada) { parar(); return; }   // nenhuma música carrega (sem internet e fora do cache): silêncio
    tocar(entrada, false);
  }
  /* n: 'inicio' (abertura em laço) | 'fim' (segue a da rodada) | 'crianca'/'normal'/'maluco' (retoma) */
  function musica(n) {
    if (n === 'inicio' && abertura && (tipo !== 'abertura' || !atual)) { tipo = 'abertura'; tocar(abertura, true); return; }
    if (!atual) { if (abertura) { tipo = 'abertura'; tocar(abertura, true); } return; }
    if (!tocando) retomar();
  }
  /* começo de rodada: a próxima música da lista, do começo (cada rodada uma diferente) */
  function rodada() { tipo = 'jogo'; proximaJogo(); }
  function andamento() {}
  function parar() {
    tocando = false; fonte = ''; clearInterval(pulso);
    if (player) try { player.pause(); } catch (e) {}
    try { if (ctx && ctx.state === 'running') ctx.suspend(); } catch (e) {}   // nada fica soando depois de sair da página
  }

  function validar(o) {
    if (!o || typeof o !== 'object' || typeof o.arquivo !== 'string' || !ARQ.test(o.arquivo) || o.arquivo.indexOf('..') >= 0) return null;
    var txt = function (v, max) { return typeof v === 'string' && v.length <= max ? v : ''; };
    var bpm = typeof o.bpm === 'number' && o.bpm >= 60 && o.bpm <= 200 ? o.bpm : 120;
    return { titulo: txt(o.titulo, 60) || o.arquivo, arquivo: o.arquivo, bpm: bpm, autor: txt(o.autor, 60), fonte: txt(o.fonte, 60), licenca: txt(o.licenca, 30), abertura: o.abertura === true };
  }
  function embaralhar(n) {
    var a = []; for (var k = 0; k < n; k++) a.push(k);
    if (!TESTE) for (var i = n - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  var carregou = false;
  function quandoPronta(fn) { if (carregou) fn(); else pronta.then(fn); }
  var pronta = root.fetch ? root.fetch('musicas/musicas.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : []; }).then(function (v) {
    var todas = (Array.isArray(v) ? v : []).slice(0, 60).map(validar).filter(Boolean);
    abertura = todas.filter(function (o) { return o.abertura; })[0] || null;
    lista = todas.filter(function (o) { return o !== abertura; });
    ordem = embaralhar(lista.length);
  }).catch(function () {}).then(function () { carregou = true; }) : Promise.resolve().then(function () { carregou = true; });

  function efeito(nome) {
    if (registro) registro.push(nome);
    if (!ctx || mudo || !EFEITOS[nome]) return;
    try { if (ctx.state !== 'running') ctx.resume(); EFEITOS[nome](ctx.currentTime + 0.01); } catch (e) {}
  }
  function definirMudo(b) {
    mudo = !!b;
    if (mestre) mestre.gain.value = mudo ? 0 : VOLUME;
    if (player && !ganhoMusica) player.muted = mudo;
  }

  root.PeluqueriaSom = {
    ligar: ligar, musica: function (n) { quandoPronta(function () { musica(n); }); }, andamento: andamento, parar: parar, efeito: efeito, mudo: definirMudo, registro: registro,
    fonte: function () { return fonte; }, tocando: function () { return !!(tocando && player && !player.paused); },
    rodada: function () { quandoPronta(rodada); },
    aoBater: function (fn) { batidas.push(fn); }, aoTrocar: function (fn) { trocas.push(fn); },
    lista: function () { return lista.slice(); },
    posicao: function () { return atual ? { faixa: tipo === 'abertura' ? 'abertura' : faixa, titulo: atual.titulo, autor: atual.autor, arquivo: atual.arquivo, nome: { pt: atual.titulo, en: atual.titulo } } : { faixa: null }; },
    _ctx: function () { return ctx; }, _gritos: function () { return gritos.length; }, _elemento: function () { return player; },
    _forcarProxima: function (arquivo) { forcada = lista.filter(function (o) { return o.arquivo === arquivo; })[0] || null; }
  };
})(typeof self !== 'undefined' ? self : this);
