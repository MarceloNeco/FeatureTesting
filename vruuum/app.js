/* Vruuum! — telas, menu, controles (toque, teclado, controle da TV, videogame, acelerômetro do celular)
   e o laço da corrida. As regras ficam em motor.js; o desenho em desenho.js; o som em som.js. */
(function () {
  'use strict';
  var APP_VERSION = '1.1.0';
  var $ = function (id) { return document.getElementById(id); };
  var M = window.VruuumMotor, D = window.VruuumDesenho, Som = window.VruuumSom;
  var TV = /[?&]tv=auto\b/.test(location.search);
  if (TV) document.documentElement.classList.add('tv');
  var TOQUE = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  var NIVEIS = ['crianca', 'normal', 'turbo'];

  function ler(k, padrao) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* aparelho sem espaço ou modo privado: segue sem gravar */ } }
  var pref = ler('vruuum.pref', null) || {};
  if (pref.jogadores !== 2) pref.jogadores = 1;
  if (NIVEIS.indexOf(pref.nivel) < 0) pref.nivel = 'crianca';
  if (pref.controle !== 'maos') pref.controle = 'toque';
  if (pref.rivais !== 'sem') pref.rivais = 'com';
  var PE = window.VruuumPersonagens;
  if (['neon', 'colorido', 'misto'].indexOf(pref.visual) < 0 || !pref.visualV2) { pref.visual = 'misto'; pref.visualV2 = true; }   // misto: alterna dia e noite (padrão desde a 1.0)
  D.definirEstilo(pref.visual);
  if (pref.lingua !== 'en' && pref.lingua !== 'pt') pref.lingua = (navigator.language || 'pt').slice(0, 2) === 'pt' ? 'pt' : 'en';
  if (!pref.carros || pref.carros.length !== 2) pref.carros = [{ cor: 0, piloto: 0 }, { cor: 2, piloto: 1 }];
  var VE = window.VruuumVeiculos, SE = window.VruuumSelfie;
  // a selfie do jogador k, se ele escolheu usar a foto (fica só neste aparelho: selfie.js)
  function fotoDe(k) { return k >= 0 && pref.carros[k] && pref.carros[k].foto && SE ? SE.carregar(k) : null; }
  pref.carros.forEach(function (c, k) { if (!VE.achar(c.veic)) c.veic = k ? 'gt' : 'classico'; });
  function salvar() { gravar('vruuum.pref', pref); }

  // ---------- idioma ----------
  function t(pt, en) { return pref.lingua === 'en' ? en : pt; }
  function traduzir() {
    document.documentElement.lang = pref.lingua === 'en' ? 'en' : 'pt-BR';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = pref.lingua === 'en' ? p[1] : p[0]; });
    $('btLingua').textContent = pref.lingua === 'en' ? 'PT' : 'EN';
  }

  function tela(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.tela'), function (s) { s.classList.toggle('ativa', s.id === id); });
    estadoTela = id;
  }
  var estadoTela = 'entrada';

  if (window.SolverRecursos && !SolverRecursos.ligado('vruuum', true)) { tela('desligado'); traduzir(); return; }

  // ---------- entrada ----------
  function entrar() {
    if (estadoTela !== 'entrada') return;
    Som.iniciar(); Som.tocar('clique'); Som.musica(true);
    tela('menu'); montarMenu(); focarPrimeiro();
  }
  $('btEntrar').addEventListener('click', entrar);

  // ---------- menu e garagem ----------
  var montado = false, editando = 0, animPrevia = 0;
  function botao(classe, rotulo, fn) { var b = document.createElement('button'); b.type = 'button'; b.className = classe; b.setAttribute('aria-label', rotulo); b.addEventListener('click', fn); return b; }
  function montarMenu() {
    if (!montado) {
      montado = true;
      // todos os veículos à mostra, por grupo, cada um com miniatura e nome
      var caixa = $('veiculos');
      VE.GRUPOS.forEach(function (gr) {
        var g = document.createElement('div'); g.className = 'grupo-veic';
        var h3 = document.createElement('h3'); h3.setAttribute('data-t', gr.nome.join('|')); g.appendChild(h3);
        var lista = document.createElement('div'); lista.className = 'cartoes'; g.appendChild(lista);
        VE.LISTA.filter(function (v) { return v.grupo === gr.id; }).forEach(function (v) {
          var b = botao('cartao-veic' + (v.grupo === 'ar' ? ' ar' : ''), v.nome[0] + ' / ' + v.nome[1], function () { pref.carros[editando].veic = v.id; salvar(); Som.tocar('buzina', editando); marcar(); });
          b.setAttribute('data-veic', v.id);
          var cv = document.createElement('canvas'); cv.width = 192; cv.height = 128; b.appendChild(cv);
          var sp = document.createElement('span'); sp.setAttribute('data-t', v.nome.join('|')); b.appendChild(sp);
          lista.appendChild(b);
        });
        caixa.appendChild(g);
      });
      D.CORES.forEach(function (cor, k) {
        var b = botao('cor', t('Cor ', 'Color ') + (k + 1), function () { pref.carros[editando].cor = k; salvar(); Som.tocar('clique'); marcar(); });
        b.style.background = cor; b.setAttribute('data-cor', k); $('cores').appendChild(b);
      });
      D.PILOTOS.forEach(function (emo, k) {
        var b = botao('bicho', emo, function () { pref.carros[editando].piloto = k; pref.carros[editando].foto = false; pref.carros[editando].personagem = null; salvar(); Som.tocar('buzina', editando); marcar(); });
        b.textContent = emo; b.setAttribute('data-piloto', k); $('bichos').appendChild(b);
      });
      if (SE) {
        // a própria foto (aparece depois de tirar) e o botão de tirar/trocar a selfie
        var bf = botao('bicho foto', t('Minha foto', 'My photo'), function () { pref.carros[editando].foto = true; pref.carros[editando].personagem = null; salvar(); Som.tocar('buzina', editando); marcar(); });
        bf.id = 'btFoto'; var cvf = document.createElement('canvas'); cvf.width = cvf.height = 76; bf.appendChild(cvf); $('bichos').appendChild(bf);
        var bc = botao('bicho camera', t('Tirar selfie', 'Take a selfie'), abrirSelfie); bc.textContent = '📸'; $('bichos').appendChild(bc);
      }
      if (PE) PE.LISTA.forEach(function (p) {   // personagens de domínio público como piloto
        var b = botao('bicho pers', p.nome[0], function () { pref.carros[editando].personagem = p.id; pref.carros[editando].foto = false; salvar(); Som.tocar('buzina', editando); marcar(); });
        b.setAttribute('data-personagem', p.id); b.title = p.nome[0];
        var cv = document.createElement('canvas'); cv.width = cv.height = 80; p.frente(cv.getContext('2d'), 40, 46, 26); b.appendChild(cv);
        $('personagens').appendChild(b);
      });
      Array.prototype.forEach.call(document.querySelectorAll('[data-aba]'), function (b) {
        b.addEventListener('click', function () { editando = +b.getAttribute('data-aba'); Som.tocar('clique'); marcar(); });
      });
      traduzir();
    }
    marcar();
    animarPrevia();
  }
  // a prévia fica sempre animada enquanto o menu está aberto (hélice, rotor, fogo, estrada andando)
  function animarPrevia() {
    if (animPrevia) return;
    var passo = function () {
      if (estadoTela !== 'menu') { animPrevia = 0; return; }
      var c = pref.carros[editando];
      D.previa($('previa'), D.CORES[c.cor], D.PILOTOS[c.piloto], c.veic, fotoDe(editando), c.personagem);
      animPrevia = requestAnimationFrame(passo);
    };
    animPrevia = requestAnimationFrame(passo);
  }
  // ---------- selfie: tirar, achar o rosto (sem internet), ajustar o círculo, recortar ----------
  var ed = { img: null, url: null, esc: 1, roda: null, arrasta: null };
  function abrirSelfie() {
    $('selfie').hidden = false; $('selfieEditor').hidden = true; $('selfieAviso').textContent = '';
    $('selfieApagar').hidden = !SE.tem(editando);
    SE.prepararDetector();   // já vai carregando o reconhecedor de rosto (só na primeira vez precisa de internet)
    try { $('selfieCamera').parentNode.querySelector('input').focus(); } catch (e) { /* ok */ }
  }
  function fecharSelfie() {
    $('selfie').hidden = true;
    if (ed.url) { URL.revokeObjectURL(ed.url); ed.url = null; }
    ed.img = null; $('selfieCamera').value = ''; $('selfieGaleria').value = '';
    marcar();
  }
  function desenharEditor() {
    var cv = $('selfieTela'), c = cv.getContext('2d'), r = ed.roda, k = ed.esc;
    if (!ed.img || !r) return;
    c.drawImage(ed.img, 0, 0, cv.width, cv.height);
    c.fillStyle = 'rgba(11,10,31,.62)'; c.beginPath(); c.rect(0, 0, cv.width, cv.height); c.arc(r.x * k, r.y * k, r.r * k, 0, Math.PI * 2, true); c.fill();
    c.strokeStyle = '#ffd166'; c.lineWidth = 3; if (c.setLineDash) c.setLineDash([10, 7]);
    c.beginPath(); c.arc(r.x * k, r.y * k, r.r * k, 0, Math.PI * 2); c.stroke(); if (c.setLineDash) c.setLineDash([]);
  }
  function abrirFoto(arquivo) {
    if (!arquivo) return;
    if (ed.url) URL.revokeObjectURL(ed.url);
    ed.url = URL.createObjectURL(arquivo);
    var img = new Image();
    img.onload = function () {
      ed.img = img;
      var cv = $('selfieTela'), deitado = window.innerWidth > window.innerHeight;
      var maxW = Math.min(window.innerWidth - 60, deitado ? 520 : 480), maxH = window.innerHeight * (deitado ? 0.62 : 0.5);
      ed.esc = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
      cv.width = Math.round(img.naturalWidth * ed.esc); cv.height = Math.round(img.naturalHeight * ed.esc);
      var menor = Math.min(img.naturalWidth, img.naturalHeight);
      ed.roda = { x: img.naturalWidth / 2, y: img.naturalHeight * 0.42, r: menor * 0.3 };
      $('selfieTam').value = 30; $('selfieEditor').hidden = false;
      $('selfieAviso').textContent = t('🔎 Procurando o rosto…', '🔎 Looking for the face…');
      desenharEditor();
      SE.acharRosto(img).then(function (achou) {
        if (ed.img !== img) return;
        if (achou) { ed.roda = achou; $('selfieTam').value = Math.round(achou.r / menor * 100); $('selfieAviso').textContent = t('✅ Achei o rosto! Se precisar, arraste o círculo ou mude o tamanho.', '✅ Found the face! Drag the circle or change its size if needed.'); }
        else $('selfieAviso').textContent = t('🙂 Não achei o rosto sozinho. Arraste o círculo até ele.', "🙂 Couldn't find the face by myself. Drag the circle onto it.");
        desenharEditor();
      });
    };
    img.src = ed.url;
  }
  if (SE) {
    $('selfieCamera').addEventListener('change', function (e) { abrirFoto(e.target.files && e.target.files[0]); });
    $('selfieGaleria').addEventListener('change', function (e) { abrirFoto(e.target.files && e.target.files[0]); });
    $('selfieTam').addEventListener('input', function () { if (!ed.img) return; ed.roda.r = +$('selfieTam').value / 100 * Math.min(ed.img.naturalWidth, ed.img.naturalHeight); desenharEditor(); });
    var telaSelfie = $('selfieTela');
    var ponto = function (e) { var b = telaSelfie.getBoundingClientRect(); return { x: (e.clientX - b.left) * telaSelfie.width / b.width / ed.esc, y: (e.clientY - b.top) * telaSelfie.height / b.height / ed.esc }; };
    telaSelfie.addEventListener('pointerdown', function (e) { if (!ed.img) return; e.preventDefault(); try { telaSelfie.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } var p = ponto(e); ed.arrasta = { dx: ed.roda.x - p.x, dy: ed.roda.y - p.y }; });
    telaSelfie.addEventListener('pointermove', function (e) {
      if (!ed.arrasta) return; e.preventDefault();
      var p = ponto(e), W = ed.img.naturalWidth, H = ed.img.naturalHeight;
      ed.roda.x = Math.max(0, Math.min(W, p.x + ed.arrasta.dx)); ed.roda.y = Math.max(0, Math.min(H, p.y + ed.arrasta.dy)); desenharEditor();
    });
    ['pointerup', 'pointercancel'].forEach(function (n) { telaSelfie.addEventListener(n, function () { ed.arrasta = null; }); });
    $('selfieUsar').addEventListener('click', function () {
      if (!ed.img) return;
      if (SE.salvar(editando, SE.recortar(ed.img, ed.roda))) { pref.carros[editando].foto = true; salvar(); Som.tocar('chegou'); fecharSelfie(); }
      else $('selfieAviso').textContent = t('Não deu para guardar a foto neste aparelho.', "Couldn't save the photo on this device.");
    });
    $('selfieApagar').addEventListener('click', function () { SE.apagar(editando); pref.carros[editando].foto = false; salvar(); fecharSelfie(); });
    $('selfieFechar').addEventListener('click', fecharSelfie);
  }

  function nomePiloto(k) {
    var c = pref.carros[k], p = c.personagem && PE ? PE.achar(c.personagem) : null;
    return p ? t(p.nome[0], p.nome[1]) : (c.foto && fotoDe(k) ? '📸' : D.PILOTOS[c.piloto]);
  }
  function barra(v) { return Math.max(25, Math.min(100, 30 + (v - 0.92) / 0.2 * 70)) + '%'; }
  function marcar() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-jogadores]'), function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-jogadores') === pref.jogadores)); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-nivel]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-nivel') === pref.nivel)); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-rivais]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-rivais') === pref.rivais)); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-controle]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-controle') === pref.controle)); });
    $('dicaMaos').hidden = pref.controle !== 'maos';
    Array.prototype.forEach.call(document.querySelectorAll('[data-visual]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-visual') === pref.visual)); });
    if (editando >= pref.jogadores) editando = 0;
    var c = pref.carros[editando], v = VE.achar(c.veic);
    $('abas').hidden = pref.jogadores < 2;
    Array.prototype.forEach.call(document.querySelectorAll('[data-aba]'), function (b) {
      var k = +b.getAttribute('data-aba'); b.setAttribute('aria-selected', String(k === editando));
      b.textContent = nomePiloto(k) + ' · ' + t('Jogador ', 'Player ') + (k + 1);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-veic]'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-veic') === c.veic));
      D.miniatura(b.querySelector('canvas'), D.CORES[c.cor], D.PILOTOS[c.piloto], b.getAttribute('data-veic'), fotoDe(editando), c.personagem);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-cor]'), function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-cor') === c.cor)); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-piloto]'), function (b) { b.setAttribute('aria-pressed', String(!c.foto && !c.personagem && +b.getAttribute('data-piloto') === c.piloto)); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-personagem]'), function (b) { b.setAttribute('aria-pressed', String(c.personagem === b.getAttribute('data-personagem'))); });
    var bf = $('btFoto'), fot = SE && SE.carregar(editando);
    if (bf) {
      bf.hidden = !fot; bf.setAttribute('aria-pressed', String(!!c.foto && !!fot));
      if (fot) { var desenhaFoto = function () { var x = bf.querySelector('canvas').getContext('2d'); x.clearRect(0, 0, 76, 76); x.save(); x.beginPath(); x.arc(38, 38, 37, 0, Math.PI * 2); x.clip(); x.drawImage(fot.img, 0, 0, 76, 76); x.restore(); }; if (fot.img.complete) desenhaFoto(); else fot.img.onload = function () { desenhaFoto(); marcar(); }; }
    }
    if (c.foto && !fot) c.foto = false;
    $('nomeVeic').textContent = (pref.jogadores === 2 || c.personagem ? nomePiloto(editando) + ' · ' : '') + t(v.nome[0], v.nome[1]) + (VE.voa(v.id) ? t(' · voa no céu ✈️', ' · flies in the sky ✈️') : '');
    $('barraVel').style.width = barra(v.vel); $('barraCurva').style.width = barra(v.curva);
    var dica = $('dicaTecla'); dica.hidden = TOQUE || pref.jogadores < 2;
    dica.textContent = editando ? t('Teclado: setas e ⬆', 'Keyboard: arrows and ⬆') : t('Teclado: A, D e W', 'Keyboard: A, D and W');
    $('recordeMenu').textContent = D.milhar(ler('vruuum.recordePts.' + pref.nivel, 0));
  }
  function opcao(atributo, fn) {
    Array.prototype.forEach.call(document.querySelectorAll('[' + atributo + ']'), function (b) {
      b.addEventListener('click', function () { fn(b.getAttribute(atributo)); salvar(); Som.tocar('clique'); marcar(); });
    });
  }
  opcao('data-jogadores', function (v) { pref.jogadores = +v; });
  opcao('data-nivel', function (v) { pref.nivel = v; });
  opcao('data-controle', function (v) { pref.controle = v; });
  opcao('data-rivais', function (v) { pref.rivais = v; });
  opcao('data-visual', function (v) { pref.visual = v; D.definirEstilo(v); });
  $('btLingua').addEventListener('click', function () { pref.lingua = pref.lingua === 'en' ? 'pt' : 'en'; salvar(); traduzir(); marcar(); });
  $('btSom').addEventListener('click', function () { Som.iniciar(); var lig = Som.alternar(); $('btSom').textContent = lig ? '🔊' : '🔇'; });
  $('btAjuda').addEventListener('click', function () { var a = $('ajuda'); a.hidden = !a.hidden; $('btAjuda').setAttribute('aria-expanded', String(!a.hidden)); });
  $('btCorrer').addEventListener('click', function () { iniciarCorrida(); });

  // setas andam entre os botões visíveis (controle da TV e teclado)
  function botoesVisiveis() {
    var raiz = estadoTela === 'jogo' ? $('pausa') : $(estadoTela);
    if (!raiz) return [];
    return Array.prototype.filter.call(raiz.querySelectorAll('button, a[href]'), function (b) { return b.offsetParent !== null && !b.disabled; });
  }
  function focarPrimeiro() { var l = botoesVisiveis(), alvo = estadoTela === 'menu' ? $('btCorrer') : l[0]; if (alvo) try { alvo.focus({ preventScroll: false }); } catch (e) { alvo.focus(); } }
  function moverFoco(d) {
    var l = botoesVisiveis(); if (!l.length) return;
    var i = l.indexOf(document.activeElement), n = i < 0 ? 0 : (i + d + l.length) % l.length;
    l[n].focus(); if (l[n].scrollIntoView) l[n].scrollIntoView({ block: 'nearest' });
  }

  // ---------- corrida ----------
  var cv = $('tela'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
  var estado = null, jogs = [], rodando = false, pausado = false, ultimo = 0, trava = null;
  function redimensionar() {
    dpr = Math.min(window.devicePixelRatio || 1, TV ? 1 : 1.5);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', function () { if (rodando) redimensionar(); });

  function iniciarCorrida() {
    Som.iniciar();
    if (TOQUE && pref.jogadores === 1 && pref.controle !== 'maos') ligarMovimento();   // com as mãos na câmera, o celular fica parado (sem inclinar)
    mov.zerar(); mov.calibrar();
    jogs = pref.carros.slice(0, pref.jogadores).map(function (c) { return { cor: D.CORES[c.cor], piloto: D.PILOTOS[c.piloto], veic: c.veic, foto: fotoDe(pref.carros.indexOf(c)), personagem: c.personagem || null }; });
    // rivais: personagens sorteados (fora os escolhidos), no chão ou no céu como o jogador 1
    var configs = [];
    if (pref.rivais === 'com' && PE) {
      var voa1 = VE.voa(jogs[0].veic), opcoes = VE.LISTA.filter(function (v) { return VE.voa(v.id) === voa1; });
      PE.sortear(pref.jogadores === 1 ? 3 : 2, jogs.map(function (j) { return j.personagem; })).forEach(function (p, k) {
        var v = opcoes[Math.floor(Math.random() * opcoes.length)];
        configs.push({ id: p.id, veic: v.id, cor: p.cor || D.CORES[(k + 3) % D.CORES.length], mod: { vel: v.vel, curva: v.curva } });
      });
    }
    estado = M.novaCorrida(pref.nivel, (Date.now() % 1000000007) | 0, pref.jogadores, configs);
    estado.jogadores.forEach(function (j, k) { var v = VE.achar(jogs[k].veic); j.mod = { vel: v.vel, curva: v.curva }; });
    D.preparar(estado, jogs, pref.lingua, pref.visual);
    tela('jogo'); redimensionar();
    $('pausa').hidden = true; pausado = false; ponteiros = {}; pularPend = [false, false];
    lerBordas(); telaCheia(true);
    ligarMaos();
    Som.proxima(); Som.musica(true);
    if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function (l) { trava = l; }).catch(function () { /* sem trava de tela: segue normal */ });
    if (!rodando) { rodando = true; ultimo = performance.now(); requestAnimationFrame(quadro); }
  }
  // ---------- volante no ar (mãos na câmera) ----------
  var MA = window.VruuumMaos, ctrlMaos = [], maosLigadas = false;
  function ligarMaos() {
    if (pref.controle !== 'maos' || !MA) { pararMaos(); return; }
    ctrlMaos = [MA.criar(), MA.criar()];
    $('camMaos').hidden = false; $('maosAviso').textContent = t('Ligando a câmera…', 'Starting the camera…');
    if (maosLigadas) return;
    MA.iniciar($('videoMaos'), function (maos, agora) {
      var partes = MA.separar(maos, estado ? estado.jogadores.length : 1);
      partes.forEach(function (m, k) { if (ctrlMaos[k]) ctrlMaos[k].ler(m, agora); });
      desenharCamMaos(maos);
    }).then(function () { maosLigadas = true; $('maosAviso').textContent = ''; })
      .catch(function () { $('maosAviso').textContent = t('Sem câmera: use a tela ou o celular.', 'No camera: use the screen or the phone.'); setTimeout(function () { $('camMaos').hidden = true; }, 4000); });
  }
  function pararMaos() { if (MA) MA.parar(); maosLigadas = false; $('camMaos').hidden = true; }
  // janelinha: a imagem espelhada, as mãos marcadas e o volante girando
  function desenharCamMaos(maos) {
    var cv = $('maosTela'), c = cv.getContext('2d'), v = $('videoMaos'), W = cv.width, H = cv.height;
    c.save(); c.translate(W, 0); c.scale(-1, 1); try { c.drawImage(v, 0, 0, W, H); } catch (e) { /* sem quadro ainda */ } c.restore();
    c.fillStyle = 'rgba(5,3,20,.35)'; c.fillRect(0, 0, W, H);
    if (estado && estado.jogadores.length === 2) { c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(W / 2 - 1, 0, 2, H); }
    maos.forEach(function (m) { c.fillStyle = '#c6ff3d'; c.beginPath(); c.arc(m.x * W, m.y * H, 9, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#1a1446'; c.lineWidth = 2; c.stroke(); });
    (estado ? estado.jogadores : []).forEach(function (j, k) {
      var cm = ctrlMaos[k]; if (!cm) return;
      var cx = estado.jogadores.length === 2 ? (k ? W * 0.75 : W * 0.25) : W / 2, cy = H - 26, r = 20;
      c.save(); c.translate(cx, cy); c.rotate(cm.direcao() * 0.9);
      c.strokeStyle = '#2bf4ff'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(-r, 0); c.lineTo(r, 0); c.moveTo(0, 0); c.lineTo(0, r); c.stroke(); c.restore();
      if (cm.maos() === 0) { c.fillStyle = '#fff'; c.font = '700 13px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText(t('mostre as mãos 🙌', 'show your hands 🙌'), cx, 22); }
    });
  }

  function soltarTrava() { if (trava) { trava.release().catch(function () {}); trava = null; } }

  function quadro(agora) {
    if (!rodando) return;
    var dt = Math.min(0.05, Math.max(0, (agora - ultimo) / 1000)); ultimo = agora;
    if (!pausado) {
      var ent = lerEntradas();
      M.atualizar(estado, ent, dt);
      for (var i = 0; i < estado.eventos.length; i++) tratar(estado.eventos[i]);
      D.passo(dt, estado, ent);
      var max = estado.pista.cfg.velMax;
      Som.motor(estado.jogadores.map(function (j) { return estado.fase === 'contagem' ? 0.05 : Math.min(1.5, j.vel / max); }));
    }
    D.desenhar(ctx, W, H, estado, { toque: TOQUE, jogadores: jogs, margem: bordas });
    if (estado.fase === 'fim') { acabar(); return; }
    requestAnimationFrame(quadro);
  }

  var SONS = { estrela: 1, cone: 1, batida: 1, lama: 1, turbo: 1, pulo: 1, perdeu: 1, tum: 1, bip: 1, vai: 1, mundo: 1, chegou: 1 };
  function tratar(ev) {
    if (ev.tipo === 'vai') mov.fimCalibrar();   // no 3-2-1 só descobre o sinal do sensor; o meio é o reto de verdade
    if (ev.tipo === 'estrela' && ev.ar) Som.tocar('estrelaAr');
    else if (SONS[ev.tipo]) Som.tocar(ev.tipo);
    if (ev.tipo === 'batida' && navigator.vibrate) try { navigator.vibrate(90); } catch (e) { /* sem vibrar */ }
    D.evento(ev, estado);
  }
  function buzinar(j) {
    if (!estado || pausado || estadoTela !== 'jogo' || j >= estado.jogadores.length) return;
    Som.tocar('buzina', j); D.evento({ tipo: 'buzina', j: j }, estado);
  }

  function pausar() {
    if (!rodando || pausado || !estado || estado.fase === 'fim') return;
    pausado = true; $('pausa').hidden = false; Som.motor([]); soltarTrava();
    try { $('btContinuar').focus(); } catch (e) { /* foco opcional */ }
  }
  function continuar() {
    if (!pausado) return;
    pausado = false; $('pausa').hidden = true; ultimo = performance.now(); ponteiros = {};
    if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function (l) { trava = l; }).catch(function () {});
  }
  function irMenu() {
    rodando = false; pausado = false; Som.motor([]); Som.musica(true); soltarTrava(); telaCheia(false); pararMaos();
    tela('menu'); montarMenu(); focarPrimeiro();
  }
  $('btPausa').addEventListener('click', pausar);
  $('btContinuar').addEventListener('click', continuar);
  $('btRecomecar').addEventListener('click', function () { rodando = false; iniciarCorrida(); });
  $('btSair').addEventListener('click', irMenu);
  $('btMenu').addEventListener('click', irMenu);
  $('btDeNovo').addEventListener('click', function () { iniciarCorrida(); });
  // a música toca o tempo todo; só silencia quando o app fica escondido (outra aba, tela apagada)
  document.addEventListener('visibilitychange', function () { if (document.hidden) pausar(); Som.dormir(document.hidden); });

  // tela cheia no celular: a barra do navegador não tampa o jogo (deitado ou em pé)
  function telaCheia(liga) {
    if (!TOQUE) return;
    var d = document, el = d.documentElement;
    try {
      if (liga && !(d.fullscreenElement || d.webkitFullscreenElement)) {
        var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen && el.webkitRequestFullscreen());
        if (p && p.then) p.then(travarTela).catch(function () {}); else travarTela();
      } else if (liga) travarTela();
      else if (!liga) {
        destravarTela();
        if (d.fullscreenElement || d.webkitFullscreenElement) { var q = d.exitFullscreen ? d.exitFullscreen() : (d.webkitExitFullscreen && d.webkitExitFullscreen()); if (q && q.catch) q.catch(function () {}); }
      }
    } catch (e) { /* navegador sem tela cheia (iPhone): segue normal */ }
  }
  // durante a corrida a tela não gira: inclinar o celular para virar o carro não pode trocar deitado/em pé
  function travarTela() {
    try {
      var o = screen.orientation;
      if (o && o.lock && o.type) { var t2 = o.lock(o.type); if (t2 && t2.catch) t2.catch(function () {}); }
    } catch (e) { /* o navegador não deixa travar: segue normal */ }
  }
  function destravarTela() { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* ok */ } }
  // bordas seguras: recorte da câmera e cantos (principalmente com o celular deitado)
  var bordas = { t: 0, r: 0, b: 0, l: 0 };
  function lerBordas() {
    var s = getComputedStyle($('sondaBorda'));
    bordas = { t: parseFloat(s.paddingTop) || 0, r: parseFloat(s.paddingRight) || 0, b: parseFloat(s.paddingBottom) || 0, l: parseFloat(s.paddingLeft) || 0 };
  }
  window.addEventListener('resize', lerBordas);
  window.addEventListener('orientationchange', function () { setTimeout(function () { lerBordas(); if (rodando) redimensionar(); }, 300); });

  function tempoTxt(s) { var m = Math.floor(s / 60), r = Math.floor(s % 60); return m + ':' + (r < 10 ? '0' : '') + r; }
  function acabar() {
    rodando = false; Som.motor([]); soltarTrava(); destravarTela(); pararMaos();
    var total = 0;
    estado.pista.segs.forEach(function (s) { s.coisas.forEach(function (c) { if (c.tipo === 'estrela') total++; }); });
    var js = estado.jogadores, melhor = Math.max.apply(null, js.map(function (j) { return j.pontos || 0; }));
    var empate = js.length === 2 && js[0].pontos === js[1].pontos;
    var caixa = $('resultado'); caixa.innerHTML = '';
    js.forEach(function (j) {
      var p = total ? j.estrelas / total : 0;
      var medalha = p >= 0.4 ? t('🥇 Ouro', '🥇 Gold') : p >= 0.2 ? t('🥈 Prata', '🥈 Silver') : t('🥉 Bronze', '🥉 Bronze');
      var div = document.createElement('div'); div.className = 'cartao' + (js.length === 2 && j.pontos === melhor ? ' vencedor' : '');
      var linhas = [
        ['quem', jogs[j.n].piloto + (js.length === 2 ? ' ' + t('Jogador ', 'Player ') + (j.n + 1) : '')],
        ['estrelas', D.milhar(j.pontos || 0) + ' ' + t('pontos', 'points')],
        ['tempo', '⭐ ' + j.estrelas + ' · ' + t('batidas ', 'crashes ') + j.batidas],
        ['medalha', medalha],
        ['tempo', '⏱ ' + tempoTxt(j.tempo)]
      ];
      if (js.length === 2) linhas.push(['medalha', empate ? t('🤝 Empate!', '🤝 Tie!') : j.pontos === melhor ? t('🏆 Mais pontos!', '🏆 Most points!') : t('👏 Muito bem!', '👏 Well done!')]);
      linhas.forEach(function (l) { var el = document.createElement('div'); el.className = l[0]; el.textContent = l[1]; div.appendChild(el); });
      caixa.appendChild(div);
    });
    if (estado.rivais.length) {   // classificação com os rivais
      var todos = js.map(function (j) { return { nome: (jogs[j.n].personagem && PE ? t(PE.achar(jogs[j.n].personagem).nome[0], PE.achar(jogs[j.n].personagem).nome[1]) : jogs[j.n].piloto) + (js.length === 2 ? ' (' + t('Jogador ', 'Player ') + (j.n + 1) + ')' : ' (' + t('você', 'you') + ')'), fim: j.chegou ? j.tempo : Infinity, z: j.z, eu: true }; })
        .concat(estado.rivais.map(function (r) { var p = PE.achar(r.id); return { nome: t(p.nome[0], p.nome[1]), fim: r.chegou ? r.tempo : Infinity, z: r.z, eu: false }; }));
      todos.sort(function (a, b) { return a.fim !== b.fim ? a.fim - b.fim : b.z - a.z; });
      var ol = document.createElement('ol'); ol.className = 'classificacao';
      todos.forEach(function (o, k) { var li = document.createElement('li'); if (o.eu) li.className = 'eu'; li.textContent = ['🥇', '🥈', '🥉'][k] || ((k + 1) + 'º'); var sp = document.createElement('span'); sp.textContent = o.nome; li.appendChild(sp); ol.appendChild(li); });
      caixa.appendChild(ol);
    }
    var chave = 'vruuum.recordePts.' + estado.pista.nivel, antes = ler(chave, 0);
    $('novoRecorde').hidden = !(melhor > antes);
    if (melhor > antes) gravar(chave, melhor);
    $('recordeFim').textContent = D.milhar(Math.max(antes, melhor));
    Som.musica(true);
    tela('fim'); traduzir(); focarPrimeiro();
  }

  // ---------- controles ----------
  var pularPend = [false, false];
  function pular(j) { if (estado && j < estado.jogadores.length && !pausado) pularPend[j] = true; }
  var teclas = {}, ponteiros = {}, botoesAntes = [{}, {}];
  function nomeTecla(e) {
    var k = e.key || '', c = e.keyCode || e.which || 0;
    if (k === 'ArrowLeft' || k === 'Left' || c === 37) return 'esq';
    if (k === 'ArrowRight' || k === 'Right' || c === 39) return 'dir';
    if (k === 'ArrowUp' || k === 'Up' || c === 38) return 'cima';
    if (k === 'ArrowDown' || k === 'Down' || c === 40) return 'baixo';
    if (k === 'Enter' || k === 'OK' || c === 13) return 'ok';
    if (k === ' ' || c === 32) return 'espaco';
    if (k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || c === 27 || c === 461 || c === 10009) return 'voltar';
    var l = k.toLowerCase();
    if (l === 'a' || l === 'd' || l === 'w' || l === 's' || l === 'p' || l === 'h') return l;
    return '';
  }
  document.addEventListener('keydown', function (e) {
    var n = nomeTecla(e);
    if (!$('selfie').hidden) { if (n === 'voltar') { e.preventDefault(); fecharSelfie(); } return; }
    if (estadoTela === 'entrada') { if (n === 'ok' || n === 'espaco') { e.preventDefault(); entrar(); } return; }
    if (estadoTela !== 'jogo' || pausado) {
      if (n === 'esq' || n === 'cima') { e.preventDefault(); moverFoco(-1); }
      else if (n === 'dir' || n === 'baixo') { e.preventDefault(); moverFoco(1); }
      else if (n === 'voltar' && pausado) { e.preventDefault(); continuar(); }
      else if (n === 'voltar' && estadoTela === 'fim') { e.preventDefault(); irMenu(); }
      return;
    }
    if (!n) return;
    e.preventDefault();
    if (n === 'voltar' || n === 'p') { pausar(); return; }
    if (e.repeat) return;
    teclas[n] = true;
    var dois = estado && estado.jogadores.length === 2;
    if (n === 'cima' || n === 'ok' || n === 'espaco') pular(dois ? 1 : 0);
    if (n === 'w') pular(0);
    if (n === 'h') buzinar(0);
  });
  document.addEventListener('keyup', function (e) { var n = nomeTecla(e); if (n) teclas[n] = false; });
  window.addEventListener('blur', function () { teclas = {}; });

  // toque: segurar a metade esquerda ou direita do seu pedaço da tela
  function ondeToque(x, y) {
    if (!estado) return null;
    var vv = D.vistas(W, H, estado.jogadores.length);
    for (var k = 0; k < vv.length; k++) { var v = vv[k]; if (x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h) return { j: k, dir: x < v.x + v.w / 2 ? -1 : 1 }; }
    return null;
  }
  // botão ⬆ PULAR de cada vista
  function noBotaoPulo(x, y) {
    if (!estado) return -1;
    var vv = D.vistas(W, H, estado.jogadores.length);
    for (var k = 0; k < vv.length; k++) { var b = D.botaoPulo(vv[k], D.margemLocal(vv[k], W, H, bordas)); if (Math.pow(x - b.x, 2) + Math.pow(y - b.y, 2) <= Math.pow(b.r * 1.25, 2)) return k; }
    return -1;
  }
  var inicioToque = {};
  function tocou(e) {
    if (estadoTela !== 'jogo' || pausado) return;
    e.preventDefault();
    var p = ponteiros[e.pointerId];
    if (p && p.pulo) return;
    // deslizar o dedo para cima também pula
    var ini = inicioToque[e.pointerId];
    if (ini && !ini.pulou && ini.y - e.clientY > Math.min(W, H) * 0.09 && Date.now() - ini.t < 500) { ini.pulou = true; var rr = ondeToque(ini.x, ini.y); if (rr) pular(rr.j); }
    var r = ondeToque(e.clientX, e.clientY); if (r) ponteiros[e.pointerId] = r; else delete ponteiros[e.pointerId];
  }
  function soltou(e) { delete ponteiros[e.pointerId]; delete inicioToque[e.pointerId]; }
  if (window.PointerEvent) {
    cv.addEventListener('pointerdown', function (e) {
      try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
      if (estadoTela !== 'jogo' || pausado) return;
      var bj = noBotaoPulo(e.clientX, e.clientY);
      if (bj >= 0) { e.preventDefault(); pular(bj); ponteiros[e.pointerId] = { j: bj, dir: 0, pulo: true }; return; }
      inicioToque[e.pointerId] = { x: e.clientX, y: e.clientY, t: Date.now() };
      tocou(e);
    });
    cv.addEventListener('pointermove', function (e) { if (ponteiros[e.pointerId] || inicioToque[e.pointerId]) tocou(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { cv.addEventListener(t, soltou); });
  } else {
    var porToque = function (e) {
      e.preventDefault();
      if (e.type === 'touchstart') Array.prototype.forEach.call(e.changedTouches, function (tq) { var bj = noBotaoPulo(tq.clientX, tq.clientY); if (bj >= 0) pular(bj); });
      ponteiros = {}; Array.prototype.forEach.call(e.touches, function (tq) { if (noBotaoPulo(tq.clientX, tq.clientY) >= 0) return; var r = ondeToque(tq.clientX, tq.clientY); if (r) ponteiros[tq.identifier] = r; });
    };
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(function (t) { cv.addEventListener(t, porToque, { passive: false }); });
  }
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  // acelerômetro: inclinar o celular vira, toquinho para cima pula (1 jogador, celular/tablet)
  var mov = window.VruuumMovimento.criar(), movLigado = false;
  function aoMover(e) {
    var ang = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
    mov.ler(e.accelerationIncludingGravity, e.acceleration, ang, Date.now());
  }
  function ligarMovimento() {
    if (movLigado || !('DeviceMotionEvent' in window)) return;
    // escuta sempre; sem permissão os eventos só não chegam (e o toque continua valendo)
    movLigado = true; window.addEventListener('devicemotion', aoMover);
    // iPhone e Chrome novo pedem permissão (precisa vir do toque em "Correr")
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try { var p = DeviceMotionEvent.requestPermission(); if (p && p.catch) p.catch(function () { /* sem permissão: fica no toque */ }); } catch (e) { /* idem */ }
    }
  }

  function lerEntradas() {
    var n = estado.jogadores.length, ent = [], k;
    for (k = 0; k < n; k++) ent.push({ dir: 0, freio: false });
    if (n === 1) {
      ent[0].dir = (teclas.esq || teclas.a ? -1 : 0) + (teclas.dir || teclas.d ? 1 : 0);
      ent[0].freio = !!(teclas.baixo || teclas.s);
    } else {
      ent[0].dir = (teclas.a ? -1 : 0) + (teclas.d ? 1 : 0); ent[0].freio = !!teclas.s;
      ent[1].dir = (teclas.esq ? -1 : 0) + (teclas.dir ? 1 : 0); ent[1].freio = !!teclas.baixo;
    }
    for (var id in ponteiros) { var p = ponteiros[id]; if (p.j < n) ent[p.j].dir += p.dir; }
    var usaMov = movLigado && n === 1 && estado.fase === 'corrida' && pref.controle !== 'maos';
    if (usaMov) ent[0].dir += mov.direcao();
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (k = 0; k < Math.min(2, pads.length); k++) {
      var gp = pads[k]; if (!gp) continue;
      var alvo = n === 1 ? 0 : k, b = gp.buttons || [], eixo = gp.axes && gp.axes[0] || 0;
      if (Math.abs(eixo) > 0.2) ent[alvo].dir += eixo;
      if (b[14] && b[14].pressed) ent[alvo].dir -= 1;
      if (b[15] && b[15].pressed) ent[alvo].dir += 1;
      if ((b[13] && b[13].pressed) || (b[1] && b[1].pressed)) ent[alvo].freio = true;
      var pul = !!(b[0] && b[0].pressed), buz = !!(b[2] && b[2].pressed), pausa = !!(b[9] && b[9].pressed);
      if (pul && !botoesAntes[k].pul) pular(alvo);
      if (buz && !botoesAntes[k].buz) buzinar(alvo);
      if (pausa && !botoesAntes[k].pausa) setTimeout(pausar, 0);
      botoesAntes[k] = { pul: pul, buz: buz, pausa: pausa };
    }
    for (k = 0; k < n; k++) { ent[k].dir = Math.max(-1, Math.min(1, ent[k].dir)); ent[k].pular = pularPend[k]; pularPend[k] = false; }
    if (usaMov && mov.pulou()) ent[0].pular = true;
    if (maosLigadas && estado.fase === 'corrida') for (k = 0; k < n; k++) {
      var cm = ctrlMaos[k]; if (!cm) continue;
      ent[k].dir = Math.max(-1, Math.min(1, ent[k].dir + cm.direcao()));
      if (cm.freio()) ent[k].freio = true;
      if (cm.pulou()) ent[k].pular = true;
    }
    return ent;
  }

  // ---------- guardar no celular: UM botão só ----------
  // Se o navegador deixa instalar, instala (vira ícone na tela, abre sem internet). Senão, baixa o
  // arquivo vruuum.html com o jogo inteiro dentro (abre direto do celular, sem internet).
  var pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedidoInstalar = e; });
  var EM_ARQUIVO = !!window.JOGO_EM_ARQUIVO || location.protocol === 'file:' || location.protocol === 'content:';
  var INSTALADO = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (EM_ARQUIVO || INSTALADO || !window.BaixarJogo) $('guardar').hidden = true;
  window.addEventListener('appinstalled', function () { $('guardar').hidden = true; });
  $('btGuardar').addEventListener('click', function () {
    var aviso = $('guardarAviso');
    if (pedidoInstalar) {
      var p = pedidoInstalar; pedidoInstalar = null;
      p.prompt();
      p.userChoice.then(function (r) {
        aviso.textContent = r && r.outcome === 'accepted' ? t('Pronto! O Vruuum! ficou na tela do celular, com ícone. Abre até sem internet.', 'Done! Vruuum! is on your home screen. It opens even offline.') : t('Tudo bem. Se mudar de ideia, toque de novo: aí baixa o arquivo do jogo.', 'No problem. Tap again to download the game file instead.');
      }).catch(function () {});
      return;
    }
    aviso.textContent = t('Preparando o arquivo…', 'Preparing the file…');
    BaixarJogo.baixar('vruuum.html').then(function () {
      aviso.textContent = t('Pronto! O arquivo vruuum.html foi para os Downloads. Toque nele para jogar, mesmo sem internet.', 'Done! vruuum.html went to Downloads. Tap it to play, even offline.');
    }).catch(function () {
      aviso.textContent = t('Não deu agora. Abra o jogo com internet e tente de novo.', "Couldn't do it now. Open the game online and try again.");
    });
  });

  // ---------- começo ----------
  $('ver').textContent = 'v' + APP_VERSION;
  // nome da música tocando, com autor e licença (as gravadas são CC BY-SA: o crédito aparece aqui)
  Som.aoTrocarMusica(function (i) { $('tocando').textContent = '🎵 ' + i.nome + ' — ' + i.autor + (i.licenca ? ' (' + i.licenca + ')' : ''); });
  lerBordas();
  $('btSom').textContent = Som.ligado() ? '🔊' : '🔇';
  traduzir();
  if (TV) setTimeout(function () { try { $('btEntrar').focus(); } catch (e) { /* ok */ } }, 200);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () { /* sem modo offline */ });
})();
