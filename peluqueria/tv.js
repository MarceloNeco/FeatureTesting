/* Peluqueria — modo TV (v0.4.0): a TV mostra um código; até 2 celulares entram como controle (tocar em PARAR
   ou um movimento brusco do corpo, detectado no próprio celular). Com 2 jogadores a tela divide ao meio.
   Sem celular, o controle remoto da TV joga sozinho: OK começa e OK para. Só mensagens pequenas pelo canal
   (sala.js); o atraso da internet é compensado pelo instante do gesto (Peluqueria.parar com atraso).
   Nomes sempre por textContent. Com ?teste, o relógio é do teste (PeluqueriaTVDebug.passo). */
(function () {
  'use strict';
  var A = window.PeluqueriaApp, P = window.Peluqueria, $ = function (id) { return document.getElementById(id); };
  var T = A.T, TESTE = A.TESTE, CONTAGEM = 2.1;
  var SUMIU = TESTE ? 2000 : 10000, ESTADO = TESTE ? 800 : 3000;   // celular sem sinal há tanto tempo sai do lobby
  var NIVEIS = ['crianca', 'normal', 'maluco'], NOME_NIVEL = { crianca: ['Criança', 'Kids'], normal: ['Normal', 'Normal'], maluco: ['Maluco', 'Crazy'] };
  var ROTULO = { PERFEITO: ['PERFEITO!', 'PERFECT!'], BOM: ['BOM!', 'GOOD!'], QUASE: ['QUASE!', 'ALMOST!'], LONGE: ['LONGE!', 'MISS!'] };
  var tv = { aberta: false, codigo: '', canal: null, jogadores: [], nivel: 'normal', fase: 'lobby', partida: null, desenhos: [], resto: 0 };
  var som = window.PeluqueriaSom;

  function agora() { return performance.now(); }
  function mandar(m) { if (tv.canal) tv.canal.mandar(m); }
  function nomeDe(j) {
    for (var k = 0; k < tv.jogadores.length; k++) if (tv.jogadores[k].js.indexOf(j) >= 0) return tv.jogadores[k].nome + (tv.jogadores[k].js.length > 1 ? ' ' + (j + 1) : '');
    return T('Jogador', 'Player') + (j ? ' 2' : '');
  }
  function usados() { var u = []; tv.jogadores.forEach(function (x) { u = u.concat(x.js); }); return u; }

  /* ---------- mensagens ---------- */
  function estado() {
    if (!tv.canal) return;
    var n = tv.partida ? tv.partida.rodadas.length : Math.max(1, usados().length), lista = [];
    for (var j = 0; j < n; j++) {
      var dono = tv.jogadores.filter(function (x) { return x.js.indexOf(j) >= 0; })[0];
      lista.push({ id: dono ? dono.id : '', nome: nomeDe(j), pontos: tv.partida ? tv.partida.rodadas[j].pontos : 0, j: j });
    }
    var m = { t: 'estado', fase: tv.fase, nivel: tv.nivel, jogadores: lista };
    if (tv.fase === 'fim') m.vencedor = tv.partida.vencedor();
    mandar(m);
  }
  function receber(m) {
    var jog = tv.jogadores.filter(function (x) { return x.id === m.id; })[0];
    if (jog && m.k !== jog.k) return;              // sem a senha deste celular: ninguém se passa por ele
    if (jog) jog.visto = agora();
    if (m.t === 'join') {
      var quer = m.dois ? 2 : 1;
      if (jog) {
        jog.nome = m.nome;
        if (tv.fase === 'lobby' && jog.js.length !== quer) {             // mudou para (ou de) 2 pessoas neste celular
          var outros = usados().filter(function (j) { return jog.js.indexOf(j) < 0; }), livres2 = [0, 1].filter(function (j) { return outros.indexOf(j) < 0; });
          if (livres2.length >= quer) jog.js = livres2.slice(0, quer); else mandar({ t: 'cheia', to: m.id });
        }
        desenharLobby(); estado(); return;
      }
      if (tv.fase !== 'lobby') return;                                   // durante a rodada ninguém novo entra
      var livres = [0, 1].filter(function (j) { return usados().indexOf(j) < 0; });
      if (livres.length < quer) { mandar({ t: 'cheia', to: m.id }); return; }
      tv.jogadores.push({ id: m.id, k: m.k, nome: m.nome, js: livres.slice(0, quer), visto: agora() });
      A.efeito('BOM'); desenharLobby(); estado(); return;
    }
    if (!jog) return;
    if (m.t === 'sair') { tv.jogadores = tv.jogadores.filter(function (x) { return x !== jog; }); desenharLobby(); estado(); return; }
    if (m.t === 'ping') { mandar({ t: 'pong', to: m.id, a: m.a, b: agora() }); return; }
    if (m.t !== 'cmd') return;
    if (m.acao === 'parar') { var j = jog.js.length > 1 && m.j != null ? m.j : jog.js[0]; parar(j, m.q != null ? (agora() - m.q) / 1000 : 0); }
    else if (m.acao === 'comecar' || m.acao === 'deNovo') { if (tv.fase === 'lobby' || tv.fase === 'fim') comecar(); }
    else if (m.acao === 'nivel') { if (tv.fase === 'lobby' || tv.fase === 'fim') { tv.nivel = m.nivel; desenharLobby(); estado(); } }
    else if (m.acao === 'menu') lobby();
  }

  /* ---------- telas ---------- */
  function desenharLobby() {
    var box = $('tvJogadores'); box.textContent = '';
    tv.jogadores.forEach(function (x) { var s = document.createElement('span'); s.textContent = '📱 ' + x.nome + (x.js.length > 1 ? ' 👯' : ''); box.appendChild(s); });
    if (!tv.jogadores.length) { var s = document.createElement('span'); s.textContent = T('Esperando os celulares… (ou aperte OK)', 'Waiting for phones… (or press OK)'); box.appendChild(s); }
    $('tvNivel').textContent = T(NOME_NIVEL[tv.nivel][0], NOME_NIVEL[tv.nivel][1]);
  }
  function lobby() {
    tv.fase = 'lobby'; tv.partida = null;
    A.tela('tvLobby'); desenharLobby(); $('tvComecar').focus();
    if (som && som.fonte()) som.musica('inicio');
    estado();
  }
  function comecar() {
    var cat = A.catalogo(), n = Math.max(1, usados().length);
    tv.partida = PeluqueriaPartida.criar({ nivel: tv.nivel, cenarios: cat.cenarios, itens: cat.itens, semente: TESTE ? 7 : Date.now(), jogadores: n });
    if (tv.partida.fase === 'fim') return;
    if (!(history.state && history.state.peluqueriaTV)) { try { history.pushState({ peluqueriaTV: 1 }, ''); } catch (e) {} }
    $('tvLado1').hidden = n < 2;
    A.tela('tvJogo');
    for (var j = 0; j < n; j++) {
      if (!tv.desenhos[j]) tv.desenhos[j] = PeluqueriaDesenho.criar($('tvPalco' + j), { leve: true });
      tv.desenhos[j].redimensionar();
      $('tvNome' + j).textContent = nomeDe(j);
    }
    tv.fase = 'contagem'; tv.resto = CONTAGEM; placar();
    if (som) { som.ligar(); som.rodada(tv.nivel); }
    A.efeito('conta'); A.falar('Três, dois, um, já!', 'Three, two, one, go!');
    estado();
  }
  function placar() {
    var p = tv.partida; if (!p) return;
    p.rodadas.forEach(function (r, j) { $('tvPontos' + j).textContent = String(r.pontos); $('tvMult' + j).textContent = r.mult > 1 ? '×' + r.mult : ''; });
    $('tvQueda').textContent = tv.fase === 'contagem' ? String(Math.max(1, Math.ceil(tv.resto / 0.7))) : Math.min(p.rodadas[0].i + 1, 10) + '/10';
  }
  function fim() {
    tv.fase = 'fim';
    var p = tv.partida, v = p.vencedor(), box = $('tvPodio'); box.textContent = '';
    p.rodadas.forEach(function (r, j) {
      var d = document.createElement('div'); if (p.rodadas.length > 1 && v === j) d.className = 'vence';
      var nome = document.createElement('span'); nome.textContent = (p.rodadas.length > 1 && v === j ? '🏆 ' : '') + nomeDe(j);
      var pts = document.createElement('b'); pts.textContent = String(r.pontos);
      var est = document.createElement('span'); var e = P.estrelas(r); est.textContent = '★★★'.slice(0, e) + '☆☆☆'.slice(0, 3 - e);
      d.appendChild(nome); d.appendChild(pts); d.appendChild(est); box.appendChild(d);
    });
    if (p.rodadas.length > 1) { var f = document.createElement('p'); f.textContent = v < 0 ? T('Empate!', 'Tie!') : T(nomeDe(v) + ' venceu!', nomeDe(v) + ' wins!'); box.appendChild(f); }
    A.tela('tvFim');
    if (som) { som.musica('fim'); }
    A.efeito('fim'); A.falar(p.rodadas.length > 1 && v >= 0 ? nomeDe(v) + ' venceu!' : 'Fim da rodada!', p.rodadas.length > 1 && v >= 0 ? nomeDe(v) + ' wins!' : 'Round over!');
    estado();
  }

  /* ---------- jogo ---------- */
  function parar(j, atraso) {
    if (tv.fase !== 'jogo' || !tv.partida) return;
    tv.ultimoAtraso = atraso;
    tv.partida.parar(j, atraso);
    processar();
  }
  function processar() {
    var p = tv.partida; if (!p) return;
    p.eventos().forEach(function (ev) {
      A.efeito(ev.res.categoria); if (ev.res.categoria === 'PERFEITO') A.efeito('uhul');
      var r = ROTULO[ev.res.categoria]; $('aviso').textContent = nomeDe(ev.j) + ': ' + T(r[0], r[1]) + ' +' + ev.res.pontos;
    });
    placar();
  }
  function tick(dt) {
    if (tv.fase === 'contagem') { tv.resto -= dt; placar(); if (tv.resto <= 0) { tv.fase = 'jogo'; placar(); estado(); } return; }
    if (tv.fase !== 'jogo') return;
    var i0 = tv.partida.rodadas[0].i;
    tv.partida.avancar(dt); processar();
    if (tv.partida.fase === 'fim') return fim();
    if (tv.partida.rodadas[0].i !== i0) { if (som) som.andamento(tv.partida.rodadas[0].i); estado(); }
  }
  function pintar(dt) {
    if ((tv.fase !== 'jogo' && tv.fase !== 'contagem') || !tv.partida) return;
    tv.partida.rodadas.forEach(function (r, j) {
      if (r.fase === 'fim') return;
      var q = r.quedas[r.i], res = r.fase === 'parado' ? r.resultados[r.resultados.length - 1] : null, rot = res ? ROTULO[res.categoria] : null;
      tv.desenhos[j].pintar(r, { pos: P.posicao(q, r.nivel, r.i, r.t), resultado: res, rotulo: rot ? T(rot[0], rot[1]) : '', uhul: res && res.categoria === 'PERFEITO' ? T('UHUL!', 'WOOHOO!') : '', pausado: false, dt: dt });
    });
  }
  var ultimo = 0;
  function quadro(ts) {
    requestAnimationFrame(quadro);
    var dt = ultimo ? Math.min(0.1, (ts - ultimo) / 1000) : 0; ultimo = ts;
    try { tick(dt); } catch (e) { if (window.console) console.warn(e); }
    try { pintar(dt); } catch (e) { if (window.console) console.warn(e); }
  }

  /* ---------- controle remoto da TV ---------- */
  /* TV de toque, tablet como TV ou controle com ponteiro (Magic Remote da LG): tocar na tela da rodada para o item
     do jogador daquele lado (v0.6.3) */
  A.aoTocar($('tvJogo'), function (ev) {
    if (tv.fase !== 'jogo' || A.emBotao(ev.target)) return;
    ev.preventDefault(); parar(ev.target && ev.target.id === 'tvPalco1' ? 1 : 0, 0);
  });
  document.addEventListener('keydown', function (ev) {
    if (!tv.aberta || A.modo() !== 'tv') return;
    var k = ev.key, ok = k === 'Enter' || k === ' ' || k === 'Select' || ev.keyCode === 13 || ev.keyCode === 23, voltar = k === 'Escape' || k === 'Backspace' || ev.keyCode === 461;
    if (ok || voltar || k === 'ArrowLeft' || k === 'ArrowRight') ev.preventDefault();
    if (ev.repeat && ok) return;
    if (tv.fase === 'lobby') {
      if (ok) comecar();
      else if (k === 'ArrowLeft' || k === 'ArrowRight') { var i = NIVEIS.indexOf(tv.nivel); tv.nivel = NIVEIS[(i + (k === 'ArrowRight' ? 1 : 2)) % 3]; desenharLobby(); estado(); }
    } else if (tv.fase === 'jogo') { if (ok) parar(0, 0); else if (voltar) lobby(); }
    else if (tv.fase === 'fim') { if (ok) comecar(); else if (voltar) lobby(); }
    else if (voltar) lobby();
  }, true);
  window.addEventListener('popstate', function () { if (tv.aberta && tv.fase !== 'lobby') lobby(); });
  window.addEventListener('resize', function () { tv.desenhos.forEach(function (d) { d.redimensionar(); }); });
  $('tvComecar').addEventListener('click', function () { if (tv.fase === 'lobby') comecar(); });

  function limparSumidos() {
    if (tv.fase !== 'lobby' && tv.fase !== 'fim') return;
    var antes = tv.jogadores.length, t = agora();
    tv.jogadores = tv.jogadores.filter(function (x) { return t - x.visto < SUMIU; });
    if (tv.jogadores.length !== antes) { desenharLobby(); estado(); }
  }
  function sair() {   // 🏠 no lobby (navegador do celular/computador): volta ao início
    tv.aberta = false; (tv.timers || []).forEach(clearInterval);
    if (tv.canal) tv.canal.fechar(); tv.canal = null; tv.jogadores = []; tv.partida = null;
    if (!A.TV) document.documentElement.classList.remove('tv');
    A.voltarInicio();
  }
  $('tvSair').addEventListener('click', sair);

  /* ---------- abrir ---------- */
  function abrir() {
    if (tv.aberta) return;
    tv.aberta = true; A.definirModo('tv'); document.documentElement.classList.add('tv');
    tv.nivel = A.pref().nivel || 'normal';
    tv.codigo = PeluqueriaSala.codigoNovo(); $('codigo').textContent = tv.codigo;
    lobby();
    PeluqueriaSala.abrir(tv.codigo, receber).then(function (c) { tv.canal = c; mandar({ t: 'tv' }); estado(); })
      .catch(function () { $('tvAviso').textContent = T('Sem conexão com os celulares agora. Dá para jogar com o controle da TV (OK).', 'No connection to phones right now. You can play with the TV remote (OK).'); });
    tv.timers = [setInterval(estado, ESTADO), setInterval(limparSumidos, 1000)];
    if (!TESTE) requestAnimationFrame(quadro);
    if (TESTE) window.PeluqueriaTVDebug.pronto = true;
  }

  if (TESTE) {
    window.PeluqueriaTVDebug = {
      pronto: false, leve: true,
      passo: function (ms) { var s = ms / 1000; while (s > 1e-9) { var d = Math.min(0.05, s); tick(d); pintar(d); s -= d; } },
      tempoAteAlvo: function (j) { var r = tv.partida.rodadas[j], q = r.quedas[r.i], n = P.NIVEIS[r.nivel]; return ((q.cenario.lugares[q.lugar].y - P.TOPO) / (n.vel * (1 + 0.05 * r.i)) - r.t) * 1000; },
      ultimo: function (j) { var r = tv.partida && tv.partida.rodadas[j]; return r && r.resultados.length ? r.resultados[r.resultados.length - 1].categoria : null; },
      resultados: function (j) { var r = tv.partida && tv.partida.rodadas[j]; return r ? r.resultados.length : 0; },
      jogadores: function () { return tv.partida ? tv.partida.rodadas.length : 0; },
      nivel: function () { return tv.nivel; }, fase: function () { return tv.fase; }, atraso: function () { return tv.ultimoAtraso; }
    };
  }
  window.PeluqueriaTV = { abrir: abrir };
})();
