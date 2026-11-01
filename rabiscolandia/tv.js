/* Rabiscolândia — TV com o celular de controle.
   TV: "📺 Esta é a TV" (ou o endereço com ?tv=auto) abre a folha e mostra um código de 4 letras. Até 4 celulares
   entram com o código; cada um ganha uma mira de uma cor e desenha ao mesmo tempo que os outros.
   Celular: "🎮 Controlar a TV" → código e nome → escolhe como mirar:
     👆 Dedo: a área branca do celular é a TV em miniatura; encostar o dedo desenha.
     📱 Mexer o celular: aponte o celular para a TV como um controle de videogame (giroscópio); segure ✏️ para desenhar.
     🖐 Mão na câmera: o celular fica parado perto da TV, com a câmera da frente para a criança; mão fechada desenha.
   Pela sala (sala.js) passam só pontos (x, y de 0 a 1), "apertado" e comandos — nunca imagem da câmera. */
(function () {
  'use strict';
  var A = window.DesenhoApp, S = window.DesenhoSala;
  if (!A || !S) return;
  var $ = function (id) { return document.getElementById(id); };
  var t = A.t;
  var CORES_MIRA = ['#3ee8ff', '#ff4fa3', '#c6ff3d', '#ffd166'];
  var CARIMBOS = ['fogos', 'estrela', 'coracao', 'sorriso', 'borboleta', 'arco-iris', 'confete', 'bolhas'];

  // ======================= TV =======================
  var tv = null;            // { codigo, sala, jogadores: { id: {...} } }
  function virarTV() {
    if (tv) { A.abrirLivre(); return; }
    var codigo = S.codigoNovo();
    tv = { codigo: codigo, sala: null, jogadores: {} };
    A.abrirLivre();
    mostrarChip(t('Conectando…', 'Connecting…'));
    S.abrir(codigo, aoReceberTV).then(function (sala) {
      tv.sala = sala; mostrarChip();
      sala.mandar({ t: 'tv', id: 'tv' });
    }).catch(function () {
      tv = null; mostrarChip(null);
      A.abrirJanela({ titulo: t('📺 Sem conexão', '📺 No connection'), texto: t('A TV precisa de internet para o celular controlar. Dá para desenhar aqui mesmo com o controle (o ponteiro) ou espelhar o celular.', 'The TV needs internet for the phone to control it. You can still draw here with the remote pointer, or mirror the phone.'), botoes: [{ t: 'OK' }] });
    });
    requestAnimationFrame(passoTV);
  }
  function mostrarChip(txt) {
    var c = $('tvChip');
    if (txt === null) { c.hidden = true; return; }
    c.hidden = false; c.innerHTML = '';
    if (txt) { c.textContent = txt; return; }
    var n = Object.keys(tv.jogadores).length;
    c.appendChild(document.createTextNode(t('📱 No celular: Rabiscolândia → 📺 Na TV → 🎮 Controlar · código ', '📱 On the phone: Rabiscolândia → 📺 On the TV → 🎮 Control · code ')));
    var b = document.createElement('b'); b.textContent = tv.codigo; c.appendChild(b);
    if (n) c.appendChild(document.createTextNode(' · ' + Object.keys(tv.jogadores).map(function (k) { return tv.jogadores[k].nome || '🙂'; }).join(', ')));
  }
  function jogador(m) {
    var j = tv.jogadores[m.id];
    if (!j) {
      var usadas = Object.keys(tv.jogadores).map(function (k) { return tv.jogadores[k].cor; });
      if (Object.keys(tv.jogadores).length >= 4) return null;
      j = tv.jogadores[m.id] = { id: m.id, nome: '', cor: CORES_MIRA.filter(function (c) { return usadas.indexOf(c) < 0; })[0] || '#fff', x: 0.5, y: 0.5, sx: 0.5, sy: 0.5, d: 0, visto: Date.now() };
      A.som.efeito('adesivo');
    }
    if (m.nome) j.nome = m.nome;
    j.visto = Date.now();
    return j;
  }
  function aoReceberTV(m) {
    if (!tv || m.id === 'tv') return;
    var motor = A.motor(), fonte = 'tv' + m.id;
    if (m.t === 'tchau') { sairJogador(m.id); return; }
    var j = jogador(m); if (!j) return;
    if (m.t === 'oi') { tv.sala.mandar({ t: 'tv', id: 'tv', cor: j.cor }); mostrarChip(); A.aviso('📱 ' + (j.nome || t('Celular', 'Phone')) + t(' entrou!', ' joined!')); return; }
    if (m.t === 'mira') { j.x = m.x; j.y = m.y; j.d = m.d; return; }
    if (m.t === 'ferramenta') { var f = {}; if (m.pincel && A.PINCEIS_LIVRES.concat(['balde', 'borracha']).indexOf(m.pincel) >= 0) f.pincel = m.pincel; if (m.cor) f.cor = m.cor; if (m.tam) f.tam = m.tam; motor.ferramentaDe(fonte, f); return; }
    if (m.t === 'cmd') {
      var tam = motor.tamanhoTela();
      if (m.acao === 'desfazer') motor.desfazer();
      else if (m.acao === 'limpar') motor.limpar();
      else if (m.acao === 'zoommais') motor.zoom(1.4);
      else if (m.acao === 'zoommenos') motor.zoom(1 / 1.4);
      else if (m.acao === 'ajustar') motor.ajustar();
      else if (m.acao === 'musica') { A.pref.musica = !A.pref.musica; A.salvarPref(); A.aplicarSom(); }
      else if (m.acao === 'carimbo' && m.v) {
        var antes = motor.ferramentaDe(fonte).pincel;
        motor.ferramentaDe(fonte, { pincel: 'adesivo', adesivo: { tipo: m.tipo || 'vivo', v: m.v, mov: m.mov || 'flutua' } });
        motor.apontar(fonte + 'c', j.sx * tam.larg, j.sy * tam.alt, true); motor.apontar(fonte + 'c', j.sx * tam.larg, j.sy * tam.alt, false);
        motor.ferramentaDe(fonte, { pincel: antes });
      }
    }
  }
  function sairJogador(id) {
    if (!tv || !tv.jogadores[id]) return;
    var motor = A.motor(); motor.apontar('tv' + id, 0, 0, false); motor.cursor('tv' + id, null); motor.ferramentaDe('tv' + id, null);
    delete tv.jogadores[id]; mostrarChip();
  }
  // a cada quadro: a mira anda suave até onde o celular mandou, e desenha se estiver "apertado"
  function passoTV() {
    if (!tv) return;
    requestAnimationFrame(passoTV);
    if (A.atual() !== 'pintar') return;
    var motor = A.motor(), tam = motor.tamanhoTela(), agora = Date.now();
    Object.keys(tv.jogadores).forEach(function (id) {
      var j = tv.jogadores[id];
      if (agora - j.visto > 12000) { sairJogador(id); return; }
      if (j.d && !j.dAnt) { j.sx = j.x; j.sy = j.y; }            // começou a desenhar: a mira pula para o dedo (sem risco do meio da tela)
      j.dAnt = j.d;
      j.sx += (j.x - j.sx) * 0.45; j.sy += (j.y - j.sy) * 0.45;
      var x = j.sx * tam.larg, y = j.sy * tam.alt;
      motor.apontar('tv' + id, x, y, !!j.d);
      motor.cursor('tv' + id, { x: x, y: y, apertado: !!j.d, cor: j.cor, nome: j.nome });
    });
  }
  // o chip do código e a mira são da tela de pintar
  function aoMostrar(id) { if (tv && id === 'pintar') mostrarChip(); }

  // ======================= CELULAR-CONTROLE =======================
  var ctrl = null;          // { sala, id, modo, ultimoEnvio, x, y, d }
  $('btSouTV').addEventListener('click', function () { virarTV(); });
  $('btSouControle').addEventListener('click', function () { A.ir('controle'); var nome = A.pref.nome || ''; $('ctrlNome').value = nome; setTimeout(function () { $('ctrlCodigo').focus(); }, 50); });
  $('ctrlCodigo').addEventListener('input', function () { this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
  $('ctrlEntrar').addEventListener('submit', function (e) {
    e.preventDefault();
    var codigo = $('ctrlCodigo').value.trim(), nome = $('ctrlNome').value.trim().slice(0, 16);
    if (codigo.length !== 4) { $('ctrlMsg').textContent = t('O código tem 4 letras (está na TV).', 'The code has 4 letters (it is on the TV).'); return; }
    A.pref.nome = nome; A.salvarPref();
    $('ctrlMsg').textContent = t('Conectando…', 'Connecting…');
    var id = S.idNovo();
    S.abrir(codigo, aoReceberCtrl).then(function (sala) {
      ctrl = { sala: sala, id: id, nome: nome, modo: 'toque', ultimoEnvio: 0, x: 0.5, y: 0.5, d: 0, oi: null, ok: false };
      sala.mandar({ t: 'oi', id: id, nome: nome });
      ctrl.oi = setInterval(function () { if (ctrl) ctrl.sala.mandar({ t: 'oi', id: ctrl.id, nome: ctrl.nome }); }, 5000);
      setTimeout(function () { if (ctrl && !ctrl.ok) $('ctrlMsg').textContent = t('Não achei a TV com esse código. Confira as letras na TV.', 'Could not find the TV with that code. Check the letters on the TV.'); }, 4000);
    }).catch(function () { $('ctrlMsg').textContent = t('Sem internet: o celular precisa de internet para controlar a TV.', 'No internet: the phone needs internet to control the TV.'); });
  });
  function aoReceberCtrl(m) {
    if (!ctrl || m.t !== 'tv') return;
    if (!ctrl.ok) {
      ctrl.ok = true; $('ctrlEntrar').hidden = true; $('ctrlPainel').hidden = false;
      montarControles(); escolherModo('toque');
    }
    if (m.cor) $('ctrlArea').style.borderColor = m.cor;
  }
  function mandarMira(forcar) {
    if (!ctrl) return;
    var agora = Date.now();
    if (!forcar && agora - ctrl.ultimoEnvio < 40) return;     // ~25 por segundo é liso e não entope a sala
    ctrl.ultimoEnvio = agora;
    ctrl.sala.mandar({ t: 'mira', id: ctrl.id, x: +ctrl.x.toFixed(4), y: +ctrl.y.toFixed(4), d: ctrl.d, m: ctrl.modo });
  }
  function cmd(acao, extra) { if (!ctrl) return; var m = { t: 'cmd', id: ctrl.id, acao: acao }; if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; }); ctrl.sala.mandar(m); }
  function montarControles() {
    var cores = $('ctrlCores'); cores.innerHTML = '';
    A.CORES.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cor'; b.style.background = c; b.setAttribute('aria-label', c); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { Array.prototype.forEach.call(cores.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); ctrl.sala.mandar({ t: 'ferramenta', id: ctrl.id, cor: c }); });
      cores.appendChild(b);
    });
    var pinc = $('ctrlPinceis'); pinc.innerHTML = '';
    A.PINCEIS_LIVRES.concat(['balde', 'borracha']).forEach(function (id, i) {
      var info = window.DesenhoPintura.PINCEIS.filter(function (p) { return p.id === id; })[0];
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ferramenta'; b.textContent = info.ico; b.setAttribute('aria-label', A.N(info)); b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { Array.prototype.forEach.call(pinc.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); ctrl.sala.mandar({ t: 'ferramenta', id: ctrl.id, pincel: id }); });
      pinc.appendChild(b);
    });
  }
  var nCarimbo = 0;
  $('ctrlDesfazer').addEventListener('click', function () { cmd('desfazer'); });
  $('ctrlMais').addEventListener('click', function () { cmd('zoommais'); });
  $('ctrlMenos').addEventListener('click', function () { cmd('zoommenos'); });
  $('ctrlAjustar').addEventListener('click', function () { cmd('ajustar'); });
  $('ctrlMusica').addEventListener('click', function () { cmd('musica'); });
  $('ctrlCarimbo').addEventListener('click', function () { cmd('carimbo', { tipo: 'vivo', v: CARIMBOS[nCarimbo++ % CARIMBOS.length], mov: 'flutua' }); });
  Array.prototype.forEach.call(document.querySelectorAll('.ctrl-modo'), function (b) { b.addEventListener('click', function () { escolherModo(b.getAttribute('data-modo')); }); });

  function escolherModo(modo) {
    if (!ctrl) return;
    pararGiro(); if (window.DesenhoMao) DesenhoMao.desligar();
    ctrl.modo = modo; ctrl.d = 0; mandarMira(true);
    Array.prototype.forEach.call(document.querySelectorAll('.ctrl-modo'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-modo') === modo ? 'true' : 'false'); });
    $('ctrlSegurar').hidden = modo !== 'giro'; $('ctrlCentro').hidden = modo !== 'giro';
    $('ctrlVideo').hidden = modo !== 'mao'; $('ctrlPontos').hidden = modo !== 'mao';
    var dica = { toque: t('Deslize o dedo aqui: é a TV em miniatura. Encostou, desenhou! ✏️', 'Slide your finger here: it is a mini TV. Touch to draw! ✏️'),
      giro: t('Aponte o celular para a TV e mexa devagar. Segure ✏️ para desenhar. 🎯 Centraliza a mira.', 'Point the phone at the TV and move it gently. Hold ✏️ to draw. 🎯 centers the pointer.'),
      mao: t('Deixe o celular parado perto da TV, com a câmera da frente para você. ✋ aberta mira, ✊ fechada desenha.', 'Leave the phone still near the TV, front camera facing you. ✋ open aims, ✊ closed draws.') }[modo];
    $('ctrlDica').textContent = dica;
    if (modo === 'giro') ligarGiro();
    if (modo === 'mao') ligarMaoCtrl();
  }
  // 👆 dedo: a área é a TV em miniatura
  var area = $('ctrlArea'), dedo = null;
  function posArea(e) { var r = area.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }; }
  area.addEventListener('pointerdown', function (e) { if (!ctrl || ctrl.modo !== 'toque') return; dedo = e.pointerId; try { area.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } var p = posArea(e); ctrl.x = p.x; ctrl.y = p.y; ctrl.d = 1; mandarMira(true); });
  area.addEventListener('pointermove', function (e) { if (!ctrl || ctrl.modo !== 'toque' || e.pointerId !== dedo) return; var p = posArea(e); ctrl.x = p.x; ctrl.y = p.y; mandarMira(false); });
  function soltarDedo(e) { if (!ctrl || ctrl.modo !== 'toque' || e.pointerId !== dedo) return; dedo = null; ctrl.d = 0; mandarMira(true); }
  area.addEventListener('pointerup', soltarDedo); area.addEventListener('pointercancel', soltarDedo);

  // 📱 mexer o celular: o quanto girou para os lados e para cima desde o 🎯 vira a posição da mira
  var giro = { ref: null, ultimo: null, ligado: false };
  function difAngulo(a, b) { var d = a - b; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }
  function aoGirar(e) {
    if (!ctrl || ctrl.modo !== 'giro' || e.alpha == null) return;
    if (!giro.ref) giro.ref = { a: e.alpha, b: e.beta };
    var dx = -difAngulo(e.alpha, giro.ref.a) / 50, dy = -(e.beta - giro.ref.b) / 34;   // ±25° para os lados e ±17° para cima = a TV inteira
    var x = 0.5 + dx, y = 0.5 + dy;
    // passou da borda: a referência acompanha (a mira não fica "presa" fora da tela)
    if (x < 0) { giro.ref.a = e.alpha - 25; x = 0; } else if (x > 1) { giro.ref.a = e.alpha + 25; x = 1; }
    if (y < 0) { giro.ref.b = e.beta - 17; y = 0; } else if (y > 1) { giro.ref.b = e.beta + 17; y = 1; }
    ctrl.x += (x - ctrl.x) * 0.5; ctrl.y += (y - ctrl.y) * 0.5;
    mandarMira(false);
  }
  function ligarGiro() {
    giro.ref = null;
    function ouvir() { if (!giro.ligado) { window.addEventListener('deviceorientation', aoGirar); giro.ligado = true; } }
    var DO = window.DeviceOrientationEvent;
    if (DO && typeof DO.requestPermission === 'function') {
      // iPhone/iPad: precisa pedir com um toque — este é o toque no botão "📱 Mexer o celular"
      DO.requestPermission().then(function (r) { if (r === 'granted') ouvir(); else $('ctrlDica').textContent = t('Sem permissão do movimento. No iPhone: Ajustes → Safari → Movimento e Orientação.', 'Motion permission denied. On iPhone: Settings → Safari → Motion & Orientation.'); }).catch(function () { ouvir(); });
    } else if (DO) ouvir();
    else $('ctrlDica').textContent = t('Este celular não informa o movimento. Use 👆 Dedo.', 'This phone does not report motion. Use 👆 Finger.');
  }
  function pararGiro() { if (giro.ligado) { window.removeEventListener('deviceorientation', aoGirar); giro.ligado = false; } }
  $('ctrlCentro').addEventListener('click', function () { giro.ref = null; if (ctrl) { ctrl.x = 0.5; ctrl.y = 0.5; mandarMira(true); } });
  var seg = $('ctrlSegurar');
  seg.addEventListener('pointerdown', function (e) { e.preventDefault(); if (!ctrl) return; seg.classList.add('apertado'); ctrl.d = 1; mandarMira(true); A.som.efeito('pegar'); });
  function soltarSeg() { if (!ctrl || !ctrl.d) return; seg.classList.remove('apertado'); ctrl.d = 0; mandarMira(true); }
  seg.addEventListener('pointerup', soltarSeg); seg.addEventListener('pointercancel', soltarSeg); seg.addEventListener('pointerleave', soltarSeg);
  seg.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // 🖐 mão na câmera do celular
  function ligarMaoCtrl() {
    if (!window.DesenhoMao) return;
    var cv = $('ctrlPontos');
    DesenhoMao.ligar($('ctrlVideo'), function (m) {
      DesenhoMao.desenharPontos(cv.getContext('2d'), m.pontos, cv.width, cv.height, m.estado);
      if (!ctrl || ctrl.modo !== 'mao') return;
      if (m.estado === 'nenhuma') { if (ctrl.d) { ctrl.d = 0; mandarMira(true); } return; }
      ctrl.x = m.x; ctrl.y = m.y;
      var d = m.estado === 'fechada' ? 1 : 0, mudou = d !== ctrl.d; ctrl.d = d;
      if (mudou) A.som.efeito(d ? 'pegar' : 'soltar');
      mandarMira(mudou);
    }, function (p) { $('ctrlDica').textContent = t('Preparando a mão… ', 'Getting the hand ready… ') + Math.round(p * 100) + '%'; }).then(function () {
      $('ctrlDica').textContent = '';
    }).catch(function () { $('ctrlDica').textContent = t('Não consegui ligar a câmera. Permita a câmera no cadeado 🔒 ou use 👆 Dedo.', 'Could not start the camera. Allow the camera in the lock 🔒 or use 👆 Finger.'); });
  }

  // sair da tela do controle desliga tudo e avisa a TV
  function aoMostrarTudo(id, saiu) {
    aoMostrar(id);
    if (saiu === 'controle' && id !== 'controle' && ctrl) {
      pararGiro(); if (window.DesenhoMao) DesenhoMao.desligar();
      ctrl.sala.mandar({ t: 'tchau', id: ctrl.id }); clearInterval(ctrl.oi); ctrl.sala.fechar(); ctrl = null;
      $('ctrlEntrar').hidden = false; $('ctrlPainel').hidden = true; $('ctrlMsg').textContent = '';
    }
  }
  window.addEventListener('pagehide', function () { if (ctrl) ctrl.sala.mandar({ t: 'tchau', id: ctrl.id }); });

  window.DesenhoTV = { virarTV: virarTV, aoMostrar: aoMostrarTudo, ehTV: function () { return !!tv; } };
})();
