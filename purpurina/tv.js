/* Purpurina — TV e celular-controle, e a tela 🎵 Música.
   TV (?tv=auto, o cartão do Kids ou solverone.com.br/tv/purpurina): mostra um código de 4 letras; cada celular que
   conecta vira uma personagem grande na TV (até 4, lado a lado). Tudo o que a criança faz no celular aparece na
   hora na TV (maquiagem, roupa, giro, desfile), e a música (da Purpurina, do YouTube ou do Spotify) toca na TV,
   comandada pelo celular. Sem celular, dá para brincar na TV com o controle remoto.
   Celular: 📺 Conectar na TV (código + nome). Conectado, a música do celular fica muda e quem toca é a TV.
   Mensagens pequenas pela sala (sala.js); nada de vídeo nem dado pessoal (só o nome que a criança digitar). */
(function () {
  'use strict';
  var A = window.PurpurinaApp, S = window.PurpurinaSala, M = window.PurpurinaMusica, B = window.PurpurinaBoneca, V = window.PurpurinaVisual, Som = window.PurpurinaSom;
  if (!A || !S || !M) return;
  var $ = function (id) { return document.getElementById(id); };
  var t = A.t;

  // ===================================================================== celular
  var cel = { sala: null, codigo: '', id: S.idNovo(), nome: '', ultimoGiro: 0, tvMusica: null, vivo: 0 };
  var local = M.tocador($('miniTocador'), function (e) { mostrarMusica(e, false); });
  function conectado() { return !!cel.sala; }
  function mandar(tipo, extra) {
    if (!cel.sala) return;
    var m = { t: tipo, id: cel.id, nome: cel.nome };
    if (tipo === 'visual' || tipo === 'oi') { m.e = A.estado(); m.ang = A.angulo(); }
    if (tipo === 'giro') {
      // no máximo ~11 por segundo; o último ângulo sempre chega (senão a TV ficaria virada)
      var agora = Date.now(); clearTimeout(cel.giroDepois);
      if (agora - cel.ultimoGiro < 90) { cel.giroDepois = setTimeout(function () { mandar('giro'); }, 100); return; }
      cel.ultimoGiro = agora; m.ang = A.angulo();
    }
    if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; });
    cel.sala.mandar(m);
  }
  function conectar(codigo, nome) {
    codigo = String(codigo || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); nome = String(nome || '').trim().slice(0, 16) || t('Jogadora', 'Player');
    if (codigo.length !== 4) { $('conectarAviso').textContent = t('O código tem 4 letras. Ele aparece na TV.', 'The code has 4 letters. It shows on the TV.'); return; }
    $('conectarAviso').textContent = t('Conectando…', 'Connecting…');
    desconectar(true);
    S.abrir(codigo, receberNoCelular).then(function (sala) {
      cel.sala = sala; cel.codigo = codigo; cel.nome = nome;
      try { localStorage.setItem('purpurina.tv', JSON.stringify({ codigo: codigo, nome: nome })); } catch (e) { /* ok */ }
      local.parar(); if (Som) Som.musica(false);
      mandar('oi');
      clearInterval(cel.vivo); cel.vivo = setInterval(function () { mandar('oi'); }, 12000);
      atualizarSelos();
      $('conectarAviso').textContent = t('Conectado! Olhe a TV: sua personagem está lá. ✨', 'Connected! Look at the TV: your character is there. ✨');
      A.recado(t('📺 Conectado na TV!', '📺 Connected to the TV!')); Som.tocar('tada');
      setTimeout(function () { A.irEstudio(); }, 900);
    }).catch(function () {
      $('conectarAviso').textContent = t('Não deu para conectar. Confira a internet e o código e tente de novo.', "Couldn't connect. Check the internet and the code and try again.");
    });
  }
  function desconectar(silencioso) {
    if (!cel.sala) return;
    mandar('tchau'); try { cel.sala.fechar(); } catch (e) { /* ok */ }
    cel.sala = null; clearInterval(cel.vivo); cel.tvMusica = null; atualizarSelos();
    if (!silencioso) { A.recado(t('Desconectado da TV.', 'Disconnected from the TV.')); if (Som) Som.musica(true); }
  }
  function receberNoCelular(m) {
    if (m.t === 'tv') { cel.tvMusica = { fonte: m.fonte, titulo: m.titulo, tocando: m.tocando }; mostrarMusica(cel.tvMusica, true); }
  }
  function atualizarSelos() {
    var c = conectado();
    $('seloTV').hidden = !c; if (c) $('seloTV').textContent = '📺 ' + cel.codigo;
    $('btDesconectar').hidden = !c; $('formConectar').hidden = c;
    $('ondeToca').textContent = c ? t('📺 A música toca na TV.', '📺 Music plays on the TV.') : t('📱 A música toca neste celular.', '📱 Music plays on this phone.');
  }
  $('btConectar').addEventListener('click', function () { Som.tocar('clique'); conectar($('codigoTV').value, $('nomeTV').value); });
  $('codigoTV').addEventListener('input', function () { this.value = this.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4); });
  $('btDesconectar').addEventListener('click', function () { desconectar(false); });
  $('seloTV').addEventListener('click', function () { A.ir('conectar'); });
  try { var salvo = JSON.parse(localStorage.getItem('purpurina.tv') || 'null'); if (salvo) { $('codigoTV').value = salvo.codigo || ''; $('nomeTV').value = salvo.nome || ''; } } catch (e) { /* ok */ }

  // ---------- 🎵 Música (no celular ou na TV) ----------
  var fonteEscolhida = 'purpurina';
  function escolherFonte(f) {
    fonteEscolhida = f; $('musicaAviso').textContent = '';
    Array.prototype.forEach.call(document.querySelectorAll('[data-fonte-bt]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-fonte-bt') === f)); });
    $('linkMusica').hidden = f === 'purpurina';
    $('ajudaYT').hidden = f !== 'youtube'; $('ajudaSP').hidden = f !== 'spotify';
    $('linkMusicaCampo').placeholder = f === 'youtube' ? t('Cole aqui o link do YouTube (vídeo ou playlist)', 'Paste the YouTube link here (video or playlist)') : t('Cole aqui o link do Spotify (música, álbum ou playlist)', 'Paste the Spotify link here (song, album or playlist)');
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-fonte-bt]'), function (b) {
    b.addEventListener('click', function () { Som.tocar('clique'); escolherFonte(b.getAttribute('data-fonte-bt')); if (b.getAttribute('data-fonte-bt') === 'purpurina') tocar('purpurina', ''); });
  });
  function tocar(fonte, ref) {
    if (conectado()) { mandar('musica', { fonte: fonte, ref: ref }); A.recado(t('🎵 Mandei para a TV!', '🎵 Sent to the TV!')); return; }
    local.tocar(fonte, ref).then(function (ok) { if (!ok) A.recado(t('Não deu para tocar. Confira o link e a internet.', "Couldn't play. Check the link and the internet.")); });
  }
  $('btTocarLink').addEventListener('click', function () {
    // aceita link do YouTube ou do Spotify, não importa qual botão estava escolhido
    var r = M.ler($('linkMusicaCampo').value);
    if (!r) { $('musicaAviso').textContent = t('Não entendi esse link. No app do YouTube ou do Spotify, toque em Compartilhar → Copiar link e cole aqui.', "I didn't understand this link. In the YouTube or Spotify app, tap Share → Copy link and paste it here."); return; }
    escolherFonte(r.fonte); $('musicaAviso').textContent = ''; Som.tocar('clique'); tocar(r.fonte, r.ref);
  });
  function comando(acao) {
    Som.tocar('clique');
    if (conectado()) { mandar('som', { acao: acao }); return; }
    if (acao === 'tocar') local.continuar(); else if (acao === 'pausar') local.pausar(); else if (acao === 'prox') local.proxima(); else if (acao === 'ant') local.anterior(); else if (acao === 'parar') local.parar();
  }
  $('btMusAnt').addEventListener('click', function () { comando('ant'); });
  $('btMusProx').addEventListener('click', function () { comando('prox'); });
  $('btMusParar').addEventListener('click', function () { comando('parar'); });
  $('btMusTocar').addEventListener('click', function () {
    var e = conectado() ? (cel.tvMusica || {}) : local.estado();
    comando(e.tocando ? 'pausar' : 'tocar');
  });
  $('btFecharMini').addEventListener('click', function () { local.parar(); });
  function mostrarMusica(e, daTV) {
    if (!e) return;
    if (daTV !== conectado()) return;
    var nome = e.fonte === 'youtube' ? '▶ YouTube' : e.fonte === 'spotify' ? '🟢 Spotify' : '✨ Purpurina';
    $('musicaAgora').textContent = (e.tocando ? '🎶 ' : '⏸ ') + nome + (e.titulo && e.titulo !== 'YouTube' && e.titulo !== 'Spotify' ? ' · ' + e.titulo : '');
    $('btMusTocar').textContent = e.tocando ? '⏸' : '▶';
    $('btMusTocar').setAttribute('aria-label', e.tocando ? t('Pausar', 'Pause') : t('Tocar', 'Play'));
    if (e.erro === 'bloqueado') $('musicaAviso').textContent = t('O dono desse vídeo não deixa tocar fora do YouTube. Escolha outro.', "This video's owner doesn't allow playing outside YouTube. Pick another one.");
    else if (e.erro === 'invalido') $('musicaAviso').textContent = t('Esse vídeo não abriu (privado ou apagado). Escolha outro.', "This video didn't open (private or deleted). Pick another one.");
    else if (e.erro === 'sem-internet') $('musicaAviso').textContent = t('Precisa de internet para o YouTube e o Spotify.', 'YouTube and Spotify need internet.');
  }
  escolherFonte('purpurina'); atualizarSelos();

  // ===================================================================== TV
  var tv = { sala: null, codigo: '', jog: {}, som: false, tocador: null, ultimaMsg: 0 };
  function iniciarTV() {
    tv.codigo = S.codigoNovo();
    A.mostrar('tv');
    $('tvCodigo').textContent = tv.codigo; $('tvCodigoCanto').textContent = t('Código: ', 'Code: ') + tv.codigo;
    // endereço curto para digitar no celular (lá, o cartão 💄 Purpurina leva ao jogo)
    $('tvEndereco').textContent = /solverone\.com\.br$/.test(location.host) ? 'solverone.com.br/bolinho-de-chuva' : location.host + location.pathname.replace(/index\.html$/, '');
    tv.tocador = M.tocador($('tvMusica'), function (e) { mandarTV(e); mostrarTituloTV(e); });
    S.abrir(tv.codigo, receberNaTV).then(function (sala) { tv.sala = sala; setInterval(function () { mandarTV(tv.tocador.estado()); limparSumidos(); }, 3000); })
      .catch(function () { $('tvEspera').querySelector('.tv-passos').textContent = t('Sem conexão com a internet. Confira o Wi-Fi da TV e recarregue a página.', 'No internet connection. Check the TV Wi-Fi and reload the page.'); });
    setTimeout(function () { try { $('btLigarSom').focus(); } catch (e) { /* ok */ } }, 200);
    desenharTV();
  }
  function mandarTV(e) { if (tv.sala && e) tv.sala.mandar({ t: 'tv', id: 'tv', fonte: e.fonte, titulo: e.titulo || '', tocando: !!e.tocando }); }
  function mostrarTituloTV(e) { var el = $('tvTitulo'); el.hidden = !(e && e.tocando); if (e && e.tocando) el.textContent = '🎶 ' + (e.titulo || (e.fonte === 'purpurina' ? 'Purpurina' : '')); }
  function ligarSom() {
    tv.som = true; Som.iniciar(); $('btLigarSom').hidden = true;
    if (!tv.tocador.estado().ref && tv.tocador.estado().fonte === 'purpurina') tv.tocador.tocar('purpurina', '');
    Som.tocar('brilho');
  }
  $('btLigarSom').addEventListener('click', ligarSom);
  $('btTvControle').addEventListener('click', function () { ligarSom(); A.mostrar('menu'); });
  // qualquer tecla do controle da TV também libera o som (o navegador só deixa tocar depois de um toque/tecla)
  document.addEventListener('keydown', function () { if (A.telaAtual() === 'tv' && !tv.som) ligarSom(); });

  function receberNaTV(m) {
    var j = tv.jog[m.id];
    if (m.t === 'tchau') { delete tv.jog[m.id]; desenharTV(); return; }
    if (m.t === 'oi' || m.t === 'visual') {
      var novo = !j;
      j = tv.jog[m.id] = j || { id: m.id, nome: m.nome || '?', e: V.novo(), ang: 0 };
      if (Object.keys(tv.jog).length > 4 && novo) { delete tv.jog[m.id]; return; }
      j.nome = m.nome || j.nome; if (m.e) j.e = V.limpar(m.e); if (typeof m.ang === 'number') j.ang = m.ang; j.visto = Date.now();
      if (novo) { desenharTV(); if (tv.som) Som.tocar('tada'); } else desenharJogador(j);
      return;
    }
    if (!j) return;
    j.visto = Date.now();
    if (m.t === 'giro') {
      j.ang = m.ang || 0; desenharJogador(j, null, true);
      clearTimeout(j.parou); j.parou = setTimeout(function () { desenharJogador(j); }, 400);   // parou de girar: volta o realce
      return;
    }
    if (m.t === 'volta') { volta(j); return; }
    if (m.t === 'desfile') { desfileTV(j, m.d, m.est); return; }
    if (m.t === 'musica' && m.fonte) { if (!tv.som) ligarSom(); tv.tocador.tocar(m.fonte, m.ref || ''); return; }
    if (m.t === 'som') {
      var tc = tv.tocador;
      if (m.acao === 'tocar') tc.continuar(); else if (m.acao === 'pausar') tc.pausar(); else if (m.acao === 'prox') tc.proxima(); else if (m.acao === 'ant') tc.anterior(); else if (m.acao === 'parar') tc.parar();
    }
  }
  function limparSumidos() { var mudou = false; Object.keys(tv.jog).forEach(function (k) { if (Date.now() - (tv.jog[k].visto || 0) > 45000) { delete tv.jog[k]; mudou = true; } }); if (mudou) desenharTV(); }
  function desenharTV() {
    var ids = Object.keys(tv.jog), caixa = $('tvPalcos');
    $('tvEspera').hidden = ids.length > 0; $('tvCanto').hidden = ids.length === 0;
    caixa.innerHTML = ''; caixa.setAttribute('data-n', String(ids.length));
    ids.forEach(function (k) {
      var j = tv.jog[k], d = document.createElement('div'); d.className = 'tv-palco'; d.id = 'tvp-' + k;
      var b = document.createElement('div'); b.className = 'tv-boneca'; var nome = document.createElement('p'); nome.className = 'tv-nome'; nome.textContent = j.nome;
      d.appendChild(b); d.appendChild(nome); caixa.appendChild(d); desenharJogador(j);
    });
  }
  function desenharJogador(j, ang, girando) {
    var el = document.querySelector('#tvp-' + j.id + ' .tv-boneca'); if (!el) return;
    var a = ang != null ? ang : j.ang;
    el.innerHTML = B.svg(j.e, { id: 'tv' + j.id, angulo: a, anim: !a, realce: !girando });
  }
  function volta(j) {
    var ini = performance.now(), dur = 1700;
    if (tv.som) Som.tocar('surpresa');
    (function passo(agora) {
      var k = Math.min(1, (agora - ini) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      desenharJogador(j, k >= 1 ? j.ang : e * 360, k < 1);
      if (k < 1) requestAnimationFrame(passo);
    })(ini);
  }
  var JURADOS = ['🐱', '🦄', '🐰'];
  function desfileTV(j, d, est) {
    var des = d ? V.desafio(d) : null, box = $('tvDesfile');
    $('tvDesfileTxt').textContent = '✨ ' + j.nome + (des ? ' · ' + des.ico + ' ' + A.N(des) : t(' no desfile!', ' on the runway!'));
    $('tvDesfileEst').textContent = des ? '⭐'.repeat(Math.max(1, est || 1)) + '☆'.repeat(3 - Math.max(1, est || 1)) : '💖💖💖';
    $('tvJurados').textContent = JURADOS.join('  ');
    box.hidden = false;
    var palco = document.getElementById('tvp-' + j.id); if (palco) palco.classList.add('holofote');
    if (tv.som) { Som.tocar('tada'); setTimeout(function () { Som.tocar('aplausos'); }, 500); }
    A.confete(); volta(j);
    clearTimeout(desfileTV.t); desfileTV.t = setTimeout(function () { box.hidden = true; if (palco) palco.classList.remove('holofote'); }, 6000);
  }

  // ===================================================================== ligações com o app
  function aoMostrar(id) { if (id === 'musica') { atualizarSelos(); mostrarMusica(conectado() ? (cel.tvMusica || { fonte: 'purpurina', tocando: false }) : local.estado(), conectado()); } }
  window.PurpurinaTV = { conectado: conectado, mandar: mandar, iniciarTV: iniciarTV, desconectar: desconectar, aoMostrar: aoMostrar };
  if (A.TV) iniciarTV();
})();
