/* Peluqueria — o aplicativo: telas, toques e teclado, ligando o motor (jogo.js) ao desenho, ao som e à voz.
   Um relógio só (tick) move contagem, queda e resultado; com ?teste quem anda o relógio é o teste
   (PeluqueriaDebug.passo). Nada de innerHTML com dado de fora; textos por textContent. */
(function () {
  'use strict';
  var APP_VERSION = '0.6.1', APP_UPDATED = '01/11/2026';
  var $ = function (id) { return document.getElementById(id); };
  var P = window.Peluqueria;
  var TESTE = /[?&]teste\b/.test(location.search);
  var TV = /[?&]tv=auto\b/.test(location.search), DEBUG = /[?&]debug\b/.test(location.search);
  if (TV) document.documentElement.classList.add('tv');
  var CHAVE_PREF = 'peluqueria-pref', CHAVE_RECORDE = 'peluqueria-recorde';
  var CONTAGEM = 0.7, ESPERA = 2, GUARDA = 0.4;
  var ROTULO = { PERFEITO: ['PERFEITO!', 'PERFECT!'], BOM: ['BOM!', 'GOOD!'], QUASE: ['QUASE!', 'ALMOST!'], LONGE: ['LONGE!', 'MISS!'] };

  function ler(k, padrao) { try { var v = JSON.parse(localStorage.getItem(k)); return v && typeof v === 'object' ? v : padrao; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var pref = Object.assign({ nivel: 'normal', lingua: /^en/i.test(navigator.language || '') ? 'en' : 'pt', som: true, minhas: false }, ler(CHAVE_PREF, {}));
  if (!P.NIVEIS[pref.nivel]) pref.nivel = 'normal';
  if (pref.lingua !== 'en') pref.lingua = 'pt';

  function T(pt, en) { return pref.lingua === 'en' ? en : pt; }
  function traduzir() {
    document.documentElement.lang = pref.lingua === 'en' ? 'en' : 'pt-BR';
    document.querySelectorAll('[data-t]').forEach(function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = T(p[0], p[1] || p[0]); });
    $('btLingua').textContent = pref.lingua === 'en' ? 'PT' : 'EN';
  }
  function tela(id) { document.querySelectorAll('.tela').forEach(function (s) { s.classList.toggle('ativa', s.id === id); }); }

  var app = { modo: 'inicio', rodada: null, pausado: false, resto: 0, espera: 0, resultado: null, trava: null };
  window.PeluqueriaApp = { tela: tela, T: T, aoTocar: function (el, fn) { aoTocar(el, fn); }, get lingua() { return pref.lingua; }, estado: function () { return app.rodada; },
    /* para tv.js e controle.js (v0.4.0) */
    catalogo: function () { var u = pref.minhas && temMinhas(); return { cenarios: catalogo.cenarios.jogo.concat(u ? catalogo.cenarios.meus : []), itens: catalogo.itens.jogo.concat(u ? catalogo.itens.meus : []) }; },
    pref: function () { return pref; }, gravarPref: function () { gravar(CHAVE_PREF, pref); },
    definirModo: function (m) { app.modo = m; }, modo: function () { return app.modo; },
    efeito: function (n) { efeito(n); }, falar: function (pt, en) { falar(pt, en); },
    voltarInicio: function () { app.modo = 'tv-saindo'; irInicio(); }, TV: TV, TESTE: TESTE };
  if (window.SolverRecursos && !SolverRecursos.ligado('peluqueria', true)) { tela('desligado'); traduzir(); return; }
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js'); } catch (e) {}

  var som = window.PeluqueriaSom || null, voz = window.PeluqueriaVoz || null;
  function efeito(n) { if (som) som.efeito(n); }
  /* a música começa no primeiro toque (regra dos navegadores) e segue desde a tela de início */
  var musicaLigada = false;
  function ligarMusica() {
    if (!som || musicaLigada) return;
    musicaLigada = true; som.ligar(); som.musica('inicio');
  }
  /* toque que vale em qualquer aparelho (v0.6.1): iPad/iPhone antigo (iOS < 13) não tem pointer events, então
     em tela de toque escuta o próprio toque; o pointerdown fica só para mouse e caneta (sem contar duas vezes). */
  function aoTocar(el, fn, captura) {
    var toque = 'ontouchstart' in window;
    if (toque) el.addEventListener('touchstart', fn, { passive: false, capture: !!captura });
    if (window.PointerEvent) el.addEventListener('pointerdown', function (ev) { if (!(toque && ev.pointerType === 'touch')) fn(ev); }, !!captura);
    else el.addEventListener('mousedown', fn, !!captura);
  }
  aoTocar(document, ligarMusica, true);
  document.addEventListener('keydown', ligarMusica, true);
  function falar(pt, en) { if (voz) voz.falar(pt, en); }

  var desenho = PeluqueriaDesenho.criar($('palco'), { leve: TV });
  var catalogo = { cenarios: { jogo: [], meus: [] }, itens: { jogo: [], meus: [] } };
  // app.modo: inicio | contagem | jogo | fim

  /* ---------- Início ---------- */
  function marcarNivel() {
    ['crianca', 'normal', 'maluco'].forEach(function (n) { var b = document.querySelector('[data-nivel="' + n + '"]'); b.classList.toggle('marcado', n === pref.nivel); b.setAttribute('aria-pressed', String(n === pref.nivel)); });
  }
  document.querySelectorAll('[data-nivel]').forEach(function (b) {
    b.addEventListener('click', function () { pref.nivel = b.getAttribute('data-nivel'); gravar(CHAVE_PREF, pref); marcarNivel(); });
  });
  $('btLingua').addEventListener('click', function () { pref.lingua = pref.lingua === 'en' ? 'pt' : 'en'; gravar(CHAVE_PREF, pref); traduzir(); });
  function marcarSom() { $('btSom').textContent = pref.som ? '🔊' : '🔇'; if (som) som.mudo(!pref.som); }
  $('btSom').addEventListener('click', function () { pref.som = !pref.som; gravar(CHAVE_PREF, pref); marcarSom(); });
  $('btAjuda').addEventListener('click', function () { $('ajuda').hidden = !$('ajuda').hidden; });
  $('ajuda').addEventListener('click', function () { $('ajuda').hidden = true; });
  function marcarMinhas() { $('btMinhas').setAttribute('aria-pressed', String(!!pref.minhas)); }
  $('btMinhas').addEventListener('click', function () { pref.minhas = !pref.minhas; gravar(CHAVE_PREF, pref); marcarMinhas(); });
  $('btJogar').addEventListener('click', jogar);
  $('btDeNovo').addEventListener('click', jogar);
  /* menu (🏠, "Início" e o botão Voltar do celular): a rodada ganha uma entrada no histórico, assim o Voltar
     volta para o menu em vez de sair do jogo; no menu, o Voltar sai normalmente */
  function irInicio() {
    if (app.modo === 'inicio' || app.modo === 'tv' || app.modo === 'controle') return;   // TV e controle cuidam do próprio Voltar
    app.modo = 'inicio'; app.pausado = false; $('btSeguir').hidden = true; manterAcesa(false);
    tela('inicio'); $('btJogar').focus();
    if (som && musicaLigada) { som.ligar(); som.musica('inicio'); }
  }
  function voltarAoMenu() {
    irInicio();
    if (history.state && history.state.peluqueria) history.back();
  }
  window.addEventListener('popstate', function () { irInicio(); });
  $('btInicio').addEventListener('click', voltarAoMenu);
  $('btCasa').addEventListener('click', voltarAoMenu);

  function temMinhas() { return catalogo.cenarios.meus.length + catalogo.itens.meus.length > 0; }

  function jogar() {
    if (som) { musicaLigada = true; som.ligar(); }
    var usar = pref.minhas && temMinhas();
    var cen = catalogo.cenarios.jogo.concat(usar ? catalogo.cenarios.meus : []);
    var its = catalogo.itens.jogo.concat(usar ? catalogo.itens.meus : []);
    app.rodada = P.criarRodada({ nivel: pref.nivel, cenarios: cen, itens: its, semente: TESTE ? 7 : Date.now() });
    if (app.rodada.fase === 'fim') return;
    if (!(history.state && history.state.peluqueria)) { try { history.pushState({ peluqueria: 1 }, ''); } catch (e) {} }
    app.modo = 'contagem'; app.resto = 3 * CONTAGEM; app.pausado = false; app.resultado = null;
    $('numero').textContent = '3'; tela('contagem');
    falar('Três, dois, um, já!', 'Three, two, one, go!');
    efeito('conta');
    if (som) som.rodada(pref.nivel);   // cada rodada, uma música diferente
  }

  /* ---------- rodada ---------- */
  function placar() {
    var r = app.rodada;
    $('pontos').textContent = String(r.pontos);
    $('mult').hidden = r.mult <= 1; $('mult').textContent = '×' + r.mult;
    $('queda').textContent = Math.min(r.i + 1, r.quedas.length) + '/' + r.quedas.length;
  }
  function comecarRodada() {
    app.modo = 'jogo'; tela('rodada'); desenho.redimensionar(); placar(); manterAcesa(true);
  }
  function aoResultado(res) {
    app.resultado = res; app.espera = 0;
    var rot = ROTULO[res.categoria];
    $('aviso').textContent = T(rot[0], rot[1]) + ' +' + res.pontos;
    efeito(res.categoria);
    if (res.categoria === 'PERFEITO') efeito('uhul');   // "u-huuu!" gravado de verdade (v0.6.0)
    placar();
  }
  function parar() {
    var r = app.rodada;
    if (app.modo !== 'jogo' || app.pausado) return;
    if (r.fase === 'caindo') { var res = P.parar(r); if (res) aoResultado(res); }
    else if (r.fase === 'parado' && app.espera >= GUARDA) seguir();
  }
  function seguir() {
    var r = app.rodada;
    P.proxima(r); app.resultado = null;
    if (r.fase === 'fim') return fim();
    if (som) som.andamento(r.i);
    placar();
  }
  function pausar() {
    if (app.modo !== 'jogo' || app.pausado) return;
    app.pausado = true; $('btSeguir').hidden = false; manterAcesa(false);
    if (som) som.parar();
    $('btSeguir').focus();
  }
  function continuar() {
    if (!app.pausado) return;
    app.pausado = false; $('btSeguir').hidden = true; manterAcesa(true);
    if (som) { som.ligar(); som.musica(pref.nivel); }   // ligar(): o iPhone deixa o áudio suspenso depois de sair do app
  }
  $('btPausa').addEventListener('click', pausar);
  $('btSeguir').addEventListener('click', continuar);
  aoTocar($('palco'), function (ev) { ev.preventDefault(); parar(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { pausar(); if (som) som.parar(); }
    else if (som && musicaLigada && app.modo !== 'jogo') { som.ligar(); som.musica(app.modo === 'contagem' ? pref.nivel : app.modo === 'fim' ? 'fim' : 'inicio'); }
  });

  /* setas andam entre os botões visíveis (controle da TV, teclado) */
  function mover(passo) {
    var bts = Array.prototype.filter.call(document.querySelectorAll('.tela.ativa button, .tela.ativa .faixa button'), function (b) { return !b.disabled && b.offsetParent !== null; });
    bts = bts.filter(function (b, k) { return bts.indexOf(b) === k; });
    if (!bts.length) return;
    var k = bts.indexOf(document.activeElement);
    bts[(k < 0 ? 0 : k + passo + bts.length) % bts.length].focus();
  }
  document.addEventListener('keydown', function (ev) {
    if (app.modo === 'tv' || app.modo === 'controle') return;   // tv.js / controle.js cuidam das teclas
    if (app.modo !== 'jogo') {
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') { ev.preventDefault(); mover(-1); }
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') { ev.preventDefault(); mover(1); }
      return;
    }
    var k = ev.key;
    if (ev.repeat) { if (k === ' ' || k === 'Enter') ev.preventDefault(); return; }   // OK/Enter segurado não para a próxima queda
    if (k === 'Escape' || k === 'p' || k === 'P') { ev.preventDefault(); if (app.pausado) continuar(); else pausar(); return; }
    if (k === ' ' || k === 'Enter') {
      ev.preventDefault();
      if (app.pausado) continuar(); else parar();
    }
  }, true);

  function fim() {
    app.modo = 'fim'; manterAcesa(false);
    if (som) { som.musica('fim'); som.efeito('fim'); }   // a música da rodada continua na tela de fim
    var r = app.rodada, n = P.estrelas(r);
    $('estrelas').textContent = '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
    $('total').textContent = String(r.pontos);
    $('perfeitos').textContent = String(r.resultados.filter(function (x) { return x.categoria === 'PERFEITO'; }).length);
    var rec = ler(CHAVE_RECORDE, {}), antes = typeof rec[r.nivel] === 'number' ? rec[r.nivel] : 0;
    var novo = r.pontos > antes;
    if (novo) { rec[r.nivel] = r.pontos; gravar(CHAVE_RECORDE, rec); }
    $('recorde').textContent = String(Math.max(antes, r.pontos));
    $('novoRecorde').hidden = !novo;
    tela('fim'); $('btDeNovo').focus();
    falar(novo ? 'Novo recorde!' : 'Fim da rodada!', novo ? 'New record!' : 'Round over!');
  }

  /* ---------- relógio ---------- */
  function tick(dt) {
    if (app.pausado) return;
    if (app.modo === 'contagem') {
      app.resto -= dt;
      var n = Math.ceil(app.resto / CONTAGEM);
      if (n >= 1 && $('numero').textContent !== String(n)) { $('numero').textContent = String(n); efeito('conta'); }
      if (app.resto <= 0) comecarRodada();
      return;
    }
    if (app.modo !== 'jogo') return;
    var r = app.rodada;
    if (r.fase === 'caindo') {
      P.avancar(r, dt);
      if (r.fase === 'parado') aoResultado(r.resultados[r.resultados.length - 1]);
    } else if (r.fase === 'parado') {
      app.espera += dt;
      if (app.espera >= ESPERA) seguir();
    }
  }
  function pintar(dt) {
    if (app.modo !== 'jogo' || !app.rodada || app.rodada.fase === 'fim') return;
    var r = app.rodada, q = r.quedas[r.i];
    var pos = r.fase === 'caindo' || r.fase === 'parado' ? P.posicao(q, r.nivel, r.i, r.t) : null;
    var res = r.fase === 'parado' ? app.resultado : null, rot = res ? ROTULO[res.categoria] : null;
    desenho.pintar(r, { pos: pos, resultado: res, rotulo: rot ? T(rot[0], rot[1]) : '', uhul: res && res.categoria === 'PERFEITO' ? T('UHUL!', 'WOOHOO!') : '', pausado: app.pausado, dt: app.pausado ? 0 : dt });
  }
  var ultimo = 0, errosQuadro = [];
  function quadro(ts) {
    requestAnimationFrame(quadro);   // primeiro agenda o próximo: um erro neste quadro nunca congela o jogo
    var dt = ultimo ? Math.min(0.1, (ts - ultimo) / 1000) : 0; ultimo = ts;
    try { tick(dt); } catch (e) { errosQuadro.push('tick: ' + e.message); }
    try { pintar(dt); } catch (e) { errosQuadro.push('desenho: ' + e.message); }
    if (errosQuadro.length > 5) errosQuadro.splice(0, errosQuadro.length - 5);
  }
  function redimensionar() { if (app.modo === 'jogo') { desenho.redimensionar(); pintar(0); } }
  window.addEventListener('resize', redimensionar);
  window.addEventListener('orientationchange', redimensionar);

  /* ---------- tela acesa durante a rodada ---------- */
  function manterAcesa(sim) {
    try {
      if (sim && !app.trava && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (t) { app.trava = t; }).catch(function () {});
      if (!sim && app.trava) { app.trava.release().catch(function () {}); app.trava = null; }
    } catch (e) {}
  }

  /* ---------- abertura com movimento: itens flutuando e o nome pulsando na batida ---------- */
  function flutuantes(itens) {
    var caixa = $('flutuantes'); if (!caixa || caixa.childElementCount) return;
    itens.slice(0, 10).forEach(function (it, k) {
      var im = document.createElement('img'); im.src = it.src; im.alt = '';
      im.style.setProperty('--x', (4 + (k * 37) % 88) + '%');
      im.style.setProperty('--w', (54 + (k * 13) % 40) + 'px');
      im.style.setProperty('--d', (9 + (k * 7) % 8) + 's');
      im.style.setProperty('--atraso', (-(k * 1.7)) + 's');
      im.style.setProperty('--giro', ((k % 2 ? -1 : 1) * (180 + (k * 50) % 180)) + 'deg');
      caixa.appendChild(im);
    });
  }
  /* crédito da música que está tocando (a licença CC BY pede o nome do autor) */
  if (som && som.aoTrocar) som.aoTrocar(function (m) {
    if (!m) return;
    $('tocando').textContent = '🎵 ' + m.titulo + (m.autor ? ' — ' + m.autor : '') + (m.fonte ? ' (' + m.fonte + ')' : '') + (m.licenca ? ' · ' + m.licenca : '');
  });
  if (som && som.aoBater) som.aoBater(function () {
    if (app.modo !== 'inicio' && app.modo !== 'fim') return;
    var l = document.querySelector('.tela.ativa .logo') || document.querySelector('#inicio .logo');
    l.classList.add('bate'); setTimeout(function () { l.classList.remove('bate'); }, 130);
  });

  /* ---------- começo ---------- */
  $('ver').textContent = 'v' + APP_VERSION + ' · ' + APP_UPDATED;
  traduzir(); marcarNivel(); marcarSom(); marcarMinhas();
  $('btJogar').disabled = true; $('btTV').disabled = true; $('btControle').disabled = true;
  /* entrada: o navegador só deixa tocar som depois de um toque; este toque já solta a música de abertura */
  $('btEntrar').addEventListener('click', function () { ligarMusica(); tela('inicio'); $('btJogar').focus(); });
  $('btTV').addEventListener('click', function () { if (window.PeluqueriaTV) PeluqueriaTV.abrir(); });
  $('btControle').addEventListener('click', function () { if (window.PeluqueriaControle) PeluqueriaControle.abrir(); });
  Promise.all([PeluqueriaCenarios.carregar(), PeluqueriaItens.carregar()]).then(function (v) {
    catalogo.cenarios = v[0]; catalogo.itens = v[1];
    $('btMinhas').hidden = !temMinhas();
    flutuantes(catalogo.itens.jogo);
    $('btJogar').disabled = false;
    if (app.modo === 'inicio') ($('entrada').classList.contains('ativa') ? $('btEntrar') : $('btJogar')).focus();
    $('btTV').disabled = false; $('btControle').disabled = false;
    if (TV && window.PeluqueriaTV) PeluqueriaTV.abrir();   // ?tv=auto (/kids, /tv/peluqueria, app da LG): abre a TV
    if (TESTE) window.PeluqueriaDebug.pronto = true;
  });

  /* ---------- ?debug: versão, fps, erros e avisos dos catálogos ---------- */
  if (DEBUG) {
    var errosVistos = [], qAnt = desenho.quadros(), tAnt = Date.now();
    var guardar = function (m) { errosVistos.push(String(m).slice(0, 160)); if (errosVistos.length > 5) errosVistos.shift(); };
    window.addEventListener('error', function (e) { guardar(e.message); });
    window.addEventListener('unhandledrejection', function (e) { guardar(e.reason && e.reason.message || e.reason); });
    var caixa = $('debug'); caixa.hidden = false;
    var atualizar = function () {
      var agora = Date.now(), q = desenho.quadros(), fps = Math.round((q - qAnt) * 1000 / Math.max(1, agora - tAnt));
      qAnt = q; tAnt = agora;
      var av = PeluqueriaCenarios.avisos.concat(PeluqueriaItens.avisos);
      caixa.textContent = 'v' + APP_VERSION + (TV ? ' · TV leve' : '') + ' · fps ' + fps + '\n' +
        (errosVistos.concat(errosQuadro).length ? 'erros: ' + errosVistos.concat(errosQuadro).join(' | ') : 'sem erros') + (av.length ? '\navisos: ' + av.join(' | ') : '');
    };
    atualizar(); setInterval(atualizar, 1000);
  }

  if (TESTE) {
    window.PeluqueriaDebug = {
      pronto: false,
      leve: desenho.leve,
      estado: function () { return app.rodada; },
      get pausado() { return app.pausado; },
      passo: function (ms) { var s = ms / 1000; while (s > 1e-9) { var d = Math.min(0.05, s); tick(d); pintar(d); s -= d; } },
      tempoAteAlvo: function () {
        var r = app.rodada, q = r.quedas[r.i], n = P.NIVEIS[r.nivel];
        return ((q.cenario.lugares[q.lugar].y - P.TOPO) / (n.vel * (1 + 0.05 * r.i)) - r.t) * 1000;
      },
      novaRodada: function (nivel) { pref.nivel = nivel; jogar(); this.passo(3 * CONTAGEM * 1000 + 50); }
    };
  } else requestAnimationFrame(quadro);
})();
