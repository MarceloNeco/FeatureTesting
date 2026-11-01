/* Peluqueria — celular como controle da TV (v0.4.0). Digita o código e o nome; depois:
   - PARAR (tocar na tela) ou 📷 Usar o corpo: a câmera do celular + esqueleto por IA (no próprio celular; o
     vídeo nunca sai daqui) + gesto.js: só movimento brusco de braço ou perna para o item;
   - 👯 2 pessoas neste celular: a pessoa da esquerda é o jogador 1, a da direita o jogador 2;
   - acerta o relógio com a TV (ping/pong) e manda o INSTANTE do gesto, para a TV compensar o atraso.
   Nomes e textos por textContent. Com ?teste, PeluqueriaControleDebug injeta um esqueleto falso. */
(function () {
  'use strict';
  var A = window.PeluqueriaApp, $ = function (id) { return document.getElementById(id); };
  var T = A.T, TESTE = A.TESTE, G = window.PeluqueriaGesto;
  var PING = TESTE ? 700 : 2000, SUMIU = TESTE ? 2000 : 10000;   // sem notícia da TV há tanto tempo: avisa
  var ct = { aberto: false, canal: null, id: '', nome: '', codigo: '', conectado: false, offset: null, amostras: [], fase: '', dois: false, corpo: false,
    gestos: [G.criar(), G.criar()], pares: null, stream: null, timers: [], ultimoQuadro: 0, k: '', recusado: false, ultimaTV: 0, trava: null, ligando: 0 };

  function agora() { return performance.now(); }
  function mandar(m) { if (ct.canal) ct.canal.mandar(m); }
  function status(txt) { $('ctStatus').textContent = txt; }
  function idProprio() {
    try { var g = sessionStorage.getItem('peluqueria-id'); if (g && /^[a-z0-9]{6,12}$/.test(g)) return g; } catch (e) {}
    var n = PeluqueriaSala.idNovo(); try { sessionStorage.setItem('peluqueria-id', n); } catch (e) {} return n;
  }
  function senha() {   // senha deste celular: vai só para a TV, que nunca a repete; ninguém se passa por ele
    try { var g = sessionStorage.getItem('peluqueria-k'); if (g && /^[a-z0-9]{12,24}$/.test(g)) return g; } catch (e) {}
    var n = (PeluqueriaSala.idNovo() + PeluqueriaSala.idNovo()).slice(0, 16); try { sessionStorage.setItem('peluqueria-k', n); } catch (e) {} return n;
  }
  function join() { if (ct.recusado) return; var m = { t: 'join', id: ct.id, k: ct.k, nome: ct.nome }; if (ct.dois) m.dois = true; mandar(m); }
  function manterAcesa() { try { if (navigator.wakeLock && !ct.trava) navigator.wakeLock.request('screen').then(function (w) { ct.trava = w; w.addEventListener && w.addEventListener('release', function () { ct.trava = null; }); }).catch(function () {}); } catch (e) {} }

  /* ---------- relógio da TV: guarda as 5 últimas medidas e usa a de menor ida e volta ---------- */
  function pong(m) {
    var rtt = agora() - m.a; if (rtt < 0 || rtt > 5000) return;
    ct.amostras.push({ rtt: rtt, off: m.b - (m.a + rtt / 2) }); if (ct.amostras.length > 5) ct.amostras.shift();
    ct.offset = ct.amostras.slice().sort(function (a, b) { return a.rtt - b.rtt; })[0].off;
  }

  function receber(m) {
    if (m.t === 'tv') { join(); return; }
    if (m.t === 'pong' && m.to === ct.id) { pong(m); return; }
    if (m.t === 'cheia' && m.to === ct.id) { ct.recusado = true; status(T('Esta TV já tem 2 jogadores.', 'This TV already has 2 players.')); return; }
    if (m.t === 'estado') { ct.ultimaTV = agora(); atualizar(m); }
  }
  function atualizar(m) {
    var meus = m.jogadores.filter(function (j) { return j.id === ct.id; });
    if (ct.recusado) {
      if (meus.length || (m.fase === 'lobby' && m.jogadores.filter(function (j) { return j.id; }).length < 2)) ct.recusado = false;   // abriu vaga
      else return;
    }
    if (!meus.length && m.fase === 'lobby') { join(); }
    ct.conectado = meus.length > 0 || ct.conectado; ct.fase = m.fase;
    var jogando = m.fase === 'jogo' || m.fase === 'contagem';
    $('ctNiveis').hidden = jogando; $('ctComecar').hidden = jogando; $('ctParar').hidden = !jogando;
    document.querySelectorAll('[data-nivel-tv]').forEach(function (b) { b.classList.toggle('marcado', b.getAttribute('data-nivel-tv') === m.nivel); });
    $('ctComecar').textContent = m.fase === 'fim' ? T('Jogar de novo', 'Play again') : T('Começar', 'Start');
    var nomes = m.jogadores.map(function (j) { return j.nome; }).join(' · ');
    if (!meus.length && m.fase !== 'lobby') { status(T('A TV está numa rodada. Espere acabar para entrar.', 'The TV is in a round. Wait for it to end to join.')); return; }
    if (m.fase === 'lobby') status(T('Conectado! ', 'Connected! ') + nomes + T(' — escolha o nível e comece.', ' — pick the level and start.'));
    else if (jogando) status(T('Valendo! ', 'Go! ') + meus.map(function (j) { return j.nome + ': ' + j.pontos; }).join(' · '));
    else if (m.fase === 'fim') {
      var v = m.vencedor, placar = m.jogadores.map(function (j) { return j.nome + ' ' + j.pontos; }).join(' × ');
      status((m.jogadores.length > 1 ? (v < 0 ? T('Empate! ', 'Tie! ') : T(m.jogadores[v].nome + ' venceu! ', m.jogadores[v].nome + ' wins! ')) : T('Fim! ', 'Done! ')) + placar);
    }
  }

  /* ---------- parar ---------- */
  function parar(j, antesMs) {   // antesMs: o gesto começou um pouco antes de ser reconhecido
    var m = { t: 'cmd', id: ct.id, k: ct.k, acao: 'parar' };
    if (ct.offset != null) { var q = agora() - (antesMs || 0) + ct.offset; if (q >= 0) m.q = q; }
    if (ct.dois) m.j = j === 1 ? 1 : 0;
    mandar(m);
    var b = $('ctParar'); b.classList.add('disparou'); setTimeout(function () { b.classList.remove('disparou'); }, 250);
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}
  }

  /* ---------- corpo: câmera + esqueleto + gesto brusco ---------- */
  function processarPoses(poses, t) {
    if (!Array.isArray(poses)) return;
    ct.pares = G.parear(ct.pares, poses);   // cada pessoa no seu lugar, mesmo se o detector trocar a ordem
    var n = ct.dois ? 2 : 1, vistos = [];
    for (var i = 0; i < n; i++) {
      var p = ct.pares.poses[i]; if (!p) continue; vistos.push(p);
      if (ct.gestos[i].ver(p, t)) parar(i, Math.max(0, t - ct.gestos[i].inicio()));
    }
    desenharEsqueleto(vistos);
  }
  function desenharEsqueleto(poses) {
    var cv = $('ctEsq'); if (!cv || cv.offsetParent === null) return;
    var w = cv.width = cv.clientWidth, h = cv.height = cv.clientHeight, g = cv.getContext('2d');
    g.clearRect(0, 0, w, h);
    poses.forEach(function (pts, i) {
      g.fillStyle = i ? '#ff4fa3' : '#c6ff3d';
      pts.forEach(function (p) { g.beginPath(); g.arc(p[0] * w, p[1] * h, 6, 0, Math.PI * 2); g.fill(); });
    });
  }
  function laco() {
    if (!ct.corpo) return;
    requestAnimationFrame(laco);
    var t = agora(); if (t - ct.ultimoQuadro < 66) return; ct.ultimoQuadro = t;
    var poses = PeluqueriaEsqueleto.detectar($('ctVideo'), t);
    if (poses) processarPoses(poses, t);
  }
  function ligarCorpo() {
    if (ct.ligando) return;
    var vez = ct.ligando = Date.now();
    var valendo = function () { return ct.ligando === vez && ct.aberto; };
    status(T('Ligando a câmera e a inteligência do corpo (na primeira vez baixa ~20 MB)…', 'Starting the camera and body AI (first time downloads ~20 MB)…'));
    $('ctCamera').hidden = false; $('ctDicaCorpo').hidden = false; $('ctDois').hidden = false;
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }).then(function (s) {
      if (!valendo()) { s.getTracks().forEach(function (t) { t.stop(); }); throw new Error('cancelado'); }
      ct.stream = s; var v = $('ctVideo'); v.srcObject = s; v.play().catch(function () {});
      return PeluqueriaEsqueleto.carregar();
    }).then(function () {
      if (!valendo()) throw new Error('cancelado');
      ct.ligando = 0; ct.corpo = true; $('ctCorpo').setAttribute('aria-pressed', 'true'); manterAcesa();
      status(T('Pronto! Levante um braço ou chute de repente para parar.', 'Ready! Raise an arm or kick suddenly to stop.'));
      laco();
    }).catch(function (e) {
      if (e && e.message === 'cancelado') return;
      desligarCorpo();
      status(T('Não deu para ligar a câmera. Use o botão PARAR.', "Couldn't start the camera. Use the STOP button."));
    });
  }
  function desligarCorpo() {
    ct.corpo = false; ct.ligando = 0; ct.pares = null; ct.gestos.forEach(function (g) { g.zerar(); }); $('ctCorpo').setAttribute('aria-pressed', 'false');
    if (ct.stream) ct.stream.getTracks().forEach(function (t) { t.stop(); });
    ct.stream = null; $('ctCamera').hidden = true; $('ctDicaCorpo').hidden = true; $('ctDois').hidden = true;
  }

  /* ---------- entrar e sair ---------- */
  function entrar() {
    var codigo = $('ctCodigo').value.trim().toUpperCase(), nome = $('ctNome').value.replace(/\s+/g, ' ').trim();
    if (!/^[A-Z]{4}$/.test(codigo)) { $('ctCodigo').focus(); return; }
    if (!nome || nome.length > 14) { $('ctNome').focus(); return; }
    ct.codigo = codigo; ct.nome = nome; ct.id = idProprio(); ct.k = senha(); ct.recusado = false; ct.ultimaTV = agora();
    var pref = A.pref(); pref.nome = nome; A.gravarPref();
    $('ctEntrada').hidden = true; $('ctPainel').hidden = false; $('ctParar').hidden = true;
    status(T('Procurando a TV…', 'Looking for the TV…'));
    PeluqueriaSala.abrir(codigo, receber).then(function (c) {
      ct.canal = c; join();
      ct.timers.push(setInterval(function () { if (!ct.conectado) join(); }, 2000));
      ct.timers.push(setInterval(function () { mandar({ t: 'ping', id: ct.id, k: ct.k, a: agora() }); }, PING));
      ct.timers.push(setInterval(function () {
        if (ct.conectado && agora() - ct.ultimaTV > SUMIU) { ct.conectado = false; status(T('TV não encontrada. Ela fechou ou mudou de código? Confira e entre de novo.', 'TV not found. Was it closed or did the code change? Check and join again.')); }
      }, 1000));
      mandar({ t: 'ping', id: ct.id, k: ct.k, a: agora() });
      setTimeout(function () { if (!ct.conectado) status(T('TV não encontrada. Confira o código e se a TV está na tela do código.', 'TV not found. Check the code and that the TV shows it.')); }, 8000);
    }).catch(function () { status(T('Sem internet para falar com a TV.', 'No internet to reach the TV.')); });
    manterAcesa();
  }
  function sair() {
    mandar({ t: 'sair', id: ct.id, k: ct.k });
    try { if (ct.trava) ct.trava.release(); } catch (e) {} ct.trava = null;
    ct.timers.forEach(clearInterval); ct.timers = [];
    if (ct.canal) ct.canal.fechar(); ct.canal = null; ct.conectado = false; ct.offset = null; ct.amostras = [];
    desligarCorpo(); ct.aberto = false;
    $('ctEntrada').hidden = false; $('ctPainel').hidden = true;
    A.voltarInicio();
  }

  function abrir() {
    if (ct.aberto) return;
    ct.aberto = true; A.definirModo('controle'); A.tela('controle');
    var pref = A.pref(); if (pref.nome && !$('ctNome').value) $('ctNome').value = pref.nome;
    $('ctCodigo').focus();
  }

  $('ctEntrar').addEventListener('click', entrar);
  $('ctCodigo').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('ctNome').focus(); });
  $('ctNome').addEventListener('keydown', function (e) { if (e.key === 'Enter') entrar(); });
  $('ctSair').addEventListener('click', sair);
  A.aoTocar($('ctParar'), function (e) { e.preventDefault(); parar(0); });   // também no iPad antigo
  $('ctComecar').addEventListener('click', function () { mandar({ t: 'cmd', id: ct.id, k: ct.k, acao: ct.fase === 'fim' ? 'deNovo' : 'comecar' }); });
  document.querySelectorAll('[data-nivel-tv]').forEach(function (b) { b.addEventListener('click', function () { mandar({ t: 'cmd', id: ct.id, k: ct.k, acao: 'nivel', nivel: b.getAttribute('data-nivel-tv') }); }); });
  $('ctCorpo').addEventListener('click', function () { if (ct.corpo) desligarCorpo(); else ligarCorpo(); });
  $('ctDois').addEventListener('click', function () {
    ct.dois = !ct.dois; $('ctDois').setAttribute('aria-pressed', String(ct.dois));
    join();   // a TV, no lobby, reserva 1 ou 2 jogadores para este celular
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || !ct.canal) return;
    ct.amostras = []; ct.offset = null;   // depois de dormir, o relógio do celular pode ter parado: mede de novo
    mandar({ t: 'ping', id: ct.id, k: ct.k, a: agora() }); join(); manterAcesa();
  });
  window.addEventListener('pagehide', function () { if (ct.canal) mandar({ t: 'sair', id: ct.id, k: ct.k }); });   // fechou a aba: libera a vaga

  if (TESTE) {
    var tSim = 0;
    var corpoFalso = function (dy) {
      return [[0.5, 0.2], [0.4, 0.32], [0.6, 0.32], [0.37, 0.45], [0.63, 0.45], [0.36, 0.56 + dy], [0.64, 0.56], [0.43, 0.6], [0.57, 0.6], [0.43, 0.75], [0.57, 0.75], [0.43, 0.9], [0.57, 0.9]];
    };
    window.PeluqueriaControleDebug = {
      poses: function (lista) { lista.forEach(function (p) { tSim += 66; processarPoses(p, tSim + 100000); }); },
      tremer: function (ms) { for (var t = 0; t < ms; t += 66) { tSim += 66; processarPoses([corpoFalso((Math.random() - 0.5) * 0.02)], tSim + 100000); } },
      levantarBraco: function () { var dys = [0, 0, 0, -0.06, -0.12, -0.16, -0.16]; dys.forEach(function (d) { tSim += 66; processarPoses([corpoFalso(d)], tSim + 100000); }); },
      reentrar: function () { join(); }
    };
  }
  window.PeluqueriaControle = { abrir: abrir };
})();
