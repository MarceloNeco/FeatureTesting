/* Bagunçolândia — o aplicativo: liga a página (TV e celular) ao motor (jogo.js), ao desenho, à sala,
   à voz, aos sons e à calibração. Nada de innerHTML com dado de fora; textos por textContent.
   Partes: comum · TVApp (também o modo "só o celular") · CelApp · botões. */
(function () {
  'use strict';
  var APP_VERSION = '0.8.1', APP_UPDATED = '31/10/2026';
  var EN = /^en/i.test(navigator.language || '');
  function T(pt, en) { return EN ? en : pt; }
  var $ = function (id) { return document.getElementById(id); };
  document.querySelectorAll('[data-t]').forEach(function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = T(p[0], p[1] || p[0]); });
  document.querySelectorAll('[data-ph]').forEach(function (el) { var p = el.getAttribute('data-ph').split('|'); el.placeholder = T(p[0], p[1] || p[0]); });
  $('ver').textContent = 'v' + APP_VERSION + ' · ' + APP_UPDATED;
  document.querySelectorAll('.ver2').forEach(function (e) { e.textContent = 'v' + APP_VERSION; });
  function tela(id) { document.querySelectorAll('.tela').forEach(function (s) { s.classList.toggle('ativa', s.id === id); }); }
  function cheia(id) { document.querySelectorAll('.cheia').forEach(function (s) { s.classList.toggle('ativa', s.id === id); }); }
  var TESTE = /[?&]teste\b/.test(location.search);   // página de teste: sem pareamento, pontos falsos pelo window.BaguncaTeste

  if (window.SolverRecursos && !SolverRecursos.ligado('baguncolandia', true)) { tela('desligado'); return; }
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js'); } catch (e) {}

  var CFG_PADRAO = { modo: 'corta', jogadores: 1, celulares: 1, duracao: 60, dificuldade: 'normal', ambiente: 'paisagem', cena: 'aleatoria', turmas: { propria: true, publica: true, minhas: true } };
  function idYouTube(s) { s = (s || '').trim(); var m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/); if (m) return m[1]; return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : ''; }
  function idPlaylist(s) { var m = (s || '').match(/[?&]list=([A-Za-z0-9_-]{10,})/); return m ? m[1] : ''; }

  /* =====================================================================
     TV — também roda no celular no modo "só o celular" (local = true)
     ===================================================================== */
  var TVApp = (function () {
    var tv = { bonecos: {}, dedoCorpo: {}, sala: null, cfg: Object.assign({}, CFG_PADRAO, { turmas: Object.assign({}, CFG_PADRAO.turmas) }), partida: null, fase: 'carregando', local: false, visaoLocal: null, jog: [], raias: {}, player: null, tocando: false, titulo: '', videoAtual: '', lista: [], indice: -1, calib: null, nomes: [], ultimoQuadro: 0, raf: 0, podio: null, pendente: null, caixas: {}, vozLiberada: false, fimMusica: false };

    var limpaLegenda = 0;
    function dizer(pt, en) {
      Desenho.legenda(T(pt, en), '#fff', false);
      clearTimeout(limpaLegenda); if (tv.fase === 'jogando') limpaLegenda = setTimeout(function () { if (tv.fase === 'jogando') Desenho.legenda(null); }, 1500);
      if (Voz.disponivel() && (tv.vozLiberada || tv.local)) { if (Voz.falar(pt, en)) return; }
      // a TV sem voz pede para o primeiro celular falar
      if (tv.sala && tv.jog[0]) tv.sala.mandarPara(tv.jog[0].id, { t: 'cmd', acao: 'fale', texto: T(pt, en) });
    }

    /* ---- carregamento 0–100 % ---- */
    function carregar() {
      cheia('tvCarregando'); tv.fase = 'carregando';
      var passos = [
        { pt: 'Preparando a fonte…', en: 'Loading the font…', f: function () { return (document.fonts && document.fonts.load) ? document.fonts.load('700 40px Fredoka') : Promise.resolve(); } },
        { pt: 'Procurando as suas imagens…', en: 'Looking for your images…', f: function () { return Figuras.carregarMeus('meus/personagens.json'); } },
        { pt: 'Desenhando frutas e doces…', en: 'Drawing fruit and sweets…', f: function () { return Promise.all(Figuras.lista().filter(function (f) { return f.papel === 'fruta' || f.papel === 'doce' || f.papel === 'bola'; }).map(function (f) { return Figuras.rasterizar(f, Math.min(256, Math.round(f.raio * 2.3))); })); } },
        { pt: 'Chamando a turma…', en: 'Calling the crew…', f: function () { return Promise.all(Figuras.lista().filter(function (f) { return f.papel === 'heroi' || f.papel === 'vilao' || f.papel === 'poder'; }).map(function (f) { return Figuras.rasterizar(f, Math.min(256, Math.round(f.raio * 2.3))); })); } },
        { pt: 'Afinando os sons…', en: 'Tuning the sounds…', f: function () { return new Promise(function (ok) { setTimeout(ok, 250); }); } },
        { pt: tv.local ? 'Ligando a câmera…' : 'Abrindo a sala…', en: tv.local ? 'Starting the camera…' : 'Opening the room…', f: function () { return tv.local ? Promise.resolve() : (TESTE ? Promise.resolve() : abrirSala()); } }
      ];
      var feito = 0, total = passos.length;
      function mostrar(p, txt) { $('pct').textContent = p; $('barra').style.width = p + '%'; $('encheRect').setAttribute('y', 100 - p); $('encheRect').setAttribute('height', p); if (txt) $('carregandoTxt').textContent = txt; }
      mostrar(0, T(passos[0].pt, passos[0].en));
      return passos.reduce(function (cadeia, p, i) {
        return cadeia.then(function () {
          mostrar(Math.round(i / total * 100), T(p.pt, p.en));
          var anim = setInterval(function () { var alvo = Math.round((i + 0.8) / total * 100), atual = +$('pct').textContent; if (atual < alvo) mostrar(atual + 1); }, 60);
          return Promise.resolve().then(p.f).catch(function (e) { console.warn('carregar', p.pt, e); }).then(function () { clearInterval(anim); feito++; mostrar(Math.round(feito / total * 100)); });
        });
      }, Promise.resolve()).then(function () { mostrar(100, T('Pronto!', 'Ready!')); return new Promise(function (ok) { setTimeout(ok, 500); }); });
    }

    function abrirSala() {
      tv.sala = Sala.tv({
        aceitaNovos: function () { return tv.fase === 'capa' || tv.fase === 'lobby' || tv.fase === 'fim'; },
        aoJogador: function (j) { tv.jog.push(j); $('tvFundo').appendChild(j.video); j.video.classList.add('off'); lobby(); },
        aoConexao: function (id, ok) { var j = porId(id); if (j) { j.video.classList.toggle('off', !ok); if (ok) Som.tocar('ok'); } lobby(); },
        aoSair: function (j) { tv.jog = tv.jog.filter(function (x) { return x.id !== j.id; }); try { j.video.remove(); } catch (e) {} lobby(); },
        aoDados: function (id, d) { dados(id, d); },
        aoComando: comando
      });
      $('tvCodigo').textContent = tv.sala.codigo; $('tvCanto').textContent = T('Código: ', 'Code: ') + tv.sala.codigo;
      return tv.sala.pronto.then(function () { setInterval(estadoParaCelulares, 1000); }).catch(function () {
        $('tvEspera').textContent = T('Sem conexão com o servidor de pareamento. Confira a internet da TV e recarregue.', 'No connection to the pairing server. Check the TV internet and reload.');
      });
    }
    function porId(id) { return tv.jog.filter(function (j) { return j.id === id; })[0]; }
    /* bonecos escolhidos nos celulares → um por raia (1 celular e 2 pessoas: os dois do mesmo celular) */
    function aplicarBonecos() {
      var lista = [];
      if (tv.local) { var b = tv.bonecos.local || {}; lista = tv.cfg.jogadores === 2 ? [b[0] || null, b[1] || null] : [b[0] || null]; }
      else if (tv.cfg.celulares === 1 && tv.cfg.jogadores === 2) { var b0 = tv.jog[0] ? (tv.bonecos[tv.jog[0].id] || {}) : {}; lista = [b0[0] || null, b0[1] || null]; }
      else lista = tv.jog.slice(0, tv.cfg.jogadores).map(function (j) { return (tv.bonecos[j.id] || {})[0] || null; });
      Desenho.avatares(lista.map(function (b, i) { return b || Boneco.normalizar({}, i); }));
    }
    /* uma câmera, duas pessoas: o esqueleto de quem está na metade esquerda vira coordenadas da raia 1 (e vice-versa) */
    function reescalar(k, j) { return k.map(function (p) { return [j === 0 ? p[0] * 2 : (p[0] - 0.5) * 2, p[1]]; }); }
    function indiceCelular(id) { return tv.jog.map(function (j) { return j.id; }).indexOf(id); }

    /* pontos de movimento que chegam: dirige para a(s) raia(s) certas */
    function dados(id, d) {
      var j = porId(id); if (!j) return;
      j.energia = d.e;
      if (d.cal) { calRecebida(id, d.cal); return; }
      if (d.bpm && tv.partida) { tv.partida.batida(d.bpm); tv.bpm = d.bpm; }
      if (d.b) Desenho.pulso();
      if (d.k && tv.partida && tv.fase === 'jogando') {
        var icK = indiceCelular(id), tsK = performance.now();
        if (tv.cfg.celulares === 1 && tv.cfg.jogadores === 2) { if (icK === 0) d.k.forEach(function (k) { var lane = k[7][0] < 0.5 ? 0 : 1; tv.partida.esqueleto(lane, reescalar(k, lane), tsK); }); }   // a raia é a metade onde está o quadril
        else if (icK < tv.cfg.jogadores && d.k[0]) tv.partida.esqueleto(icK, d.k[0], tsK);
        return;
      }
      if (!tv.partida || tv.fase !== 'jogando') return;
      var ic = indiceCelular(id), ts = performance.now();
      if (tv.cfg.celulares === 1 && tv.cfg.jogadores === 2) {
        if (ic !== 0) return;
        var s = Bagunca.separarJogadores(d.p); tv.partida.movimento(0, s[0], ts); tv.partida.movimento(1, s[1], ts);
        if (d.cs) { if (d.cs[0]) tv.partida.corpo(0, { x: d.cs[0].x * 2, y: d.cs[0].y, w: d.cs[0].w * 2, h: d.cs[0].h }, ts); if (d.cs[1]) tv.partida.corpo(1, { x: (d.cs[1].x - 0.5) * 2, y: d.cs[1].y, w: d.cs[1].w * 2, h: d.cs[1].h }, ts); }
      } else if (ic < tv.cfg.jogadores) { tv.partida.movimento(ic, d.p, ts); if (d.c) tv.partida.corpo(ic, d.c, ts); }
    }

    /* ---- capa e lobby ---- */
    function capa() {
      tv.fase = 'capa'; cheia('tvCapa');
      $('tvUrl').textContent = /solverone\.com\.br$/.test(location.host) ? 'solverone.com.br/tv/bagunca' : location.host + location.pathname.replace(/index\.html$/, '');
      if (tv.jog.length) lobby();
    }
    function lobby() {
      if (tv.fase === 'jogando' || tv.fase === 'calibrando' || tv.fase === 'contagem' || tv.fase === 'pausa') return;
      if (!tv.jog.length && !tv.local) { if (tv.fase !== 'carregando') capa(); return; }
      tv.fase = 'lobby'; cheia('tvLobby');
      var L = $('lobbyJogadores'); while (L.firstChild) L.removeChild(L.firstChild);
      var cores = Desenho.CORES.j;
      if (tv.local) { var d0 = document.createElement('div'); d0.className = 'jog'; d0.style.setProperty('--cor', cores[0]); d0.textContent = tv.nomes[0] || T('Você', 'You'); L.appendChild(d0); }
      tv.jog.forEach(function (j, i) {
        var d = document.createElement('div'); d.className = 'jog'; d.style.setProperty('--cor', cores[i] || '#fff');
        d.textContent = j.nome; var s = document.createElement('small'); s.textContent = j.ligado ? T('📱 conectado', '📱 connected') : T('⏳ conectando…', '⏳ connecting…'); d.appendChild(s); L.appendChild(d);
      });
      if (!tv.local && tv.cfg.celulares === 2 && tv.jog.length < 2) { var v = document.createElement('div'); v.className = 'vazio'; v.textContent = T('Esperando o 2º celular (mesmo código)…', 'Waiting for the 2nd phone (same code)…'); L.appendChild(v); }
      resumo();
      Som.musica(true);
    }
    function resumo() {
      var c = tv.cfg, m = { corta: T('🍉 Corta-corta', '🍉 Slice'), pega: T('🎈 Pega-pega', '🎈 Catch'), chuta: T('⚽ Chuta-chuta', '⚽ Kick'), mistura: T('🎪 Bagunça total', '🎪 Total mayhem') }[c.modo];
      var d = c.duracao ? (c.duracao >= 120 ? '2 min' : c.duracao + ' s') : T('🎵 a música inteira', '🎵 the whole song');
      var n = { crianca: T('Criança', 'Kids'), normal: 'Normal', maluco: T('Maluco', 'Crazy') }[c.dificuldade];
      var amb = c.ambiente === 'paisagem' ? T('🏞️ paisagem', '🏞️ landscape') : T('📷 câmera', '📷 camera');
      $('lobbyResumo').textContent = m + ' · ' + amb + ' · ' + c.jogadores + (c.jogadores > 1 ? T(' pessoas', ' people') : T(' pessoa', ' person')) + (tv.local ? '' : ' · ' + c.celulares + (c.celulares > 1 ? T(' celulares', ' phones') : T(' celular', ' phone'))) + ' · ' + d + ' · ' + n;
    }
    var estadoBroadcastEm = 0;
    function estadoParaCelulares() {
      if (!tv.sala) return;
      var e = tv.partida && tv.partida.estado(), umCel2 = tv.cfg.celulares === 1 && tv.cfg.jogadores === 2;
      var pontos = tv.jog.map(function (j, i) { return { nome: j.nome, pontos: e ? (umCel2 ? (i === 0 ? e.jogadores.map(function (x) { return x.pontos; }).join(' · ') : 0) : (e.jogadores[i] ? e.jogadores[i].pontos : 0)) : 0 }; });
      var cheio = { t: 'estado', fase: tv.fase, cfg: tv.cfg, tocando: tv.tocando, titulo: tv.titulo, pontos: pontos, lista: tv.lista, indice: tv.indice, video: tv.videoAtual, versao: APP_VERSION };
      // completo, só pelo canal direto de cada celular (com "eu" = a posição dele); sem id de ninguém
      tv.jog.forEach(function (j, i) { tv.sala.mandarPara(j.id, Object.assign({ eu: i }, cheio)); });
      // pelo servidor, só o mínimo e só a cada 3 s (para quem ainda não tem o canal direto)
      if (Date.now() - estadoBroadcastEm > 3000) { estadoBroadcastEm = Date.now(); tv.sala.estado({ fase: tv.fase, cfg: tv.cfg, versao: APP_VERSION }); }
    }

    /* ---- comandos vindos do celular (ou do teclado da TV) ---- */
    function comando(m) {
      if (m.acao === 'config') {
        ['modo', 'jogadores', 'celulares', 'duracao', 'dificuldade', 'ambiente', 'cena'].forEach(function (k) { if (k in m) tv.cfg[k] = m[k]; });
        if (m.turmas) tv.cfg.turmas = m.turmas;
        if (tv.local) tv.cfg.celulares = 1;
        resumo(); return;
      }
      if (m.acao === 'comecar') { comecar(); return; }
      if (m.acao === 'pausar' || m.acao === 'continuar') { if (!tv.partida) return; if (tv.partida.estado().fase === 'jogando') { tv.partida.pausar(); tv.fase = 'pausa'; } else if (tv.partida.estado().fase === 'pausa') { tv.partida.continuar(); tv.fase = 'jogando'; } return; }
      if (m.acao === 'parar') { if (tv.partida && tv.fase !== 'fim') tv.partida.terminar(); return; }
      if (m.acao === 'calibrar') { if (tv.fase === 'lobby' || tv.fase === 'fim') comecar(true); return; }
      if (m.acao === 'pularCalibracao') { if (tv.calib) tv.calib.pular(); return; }
      if (m.acao === 'bpm') { if (tv.partida) tv.partida.batida(m.bpm); tv.bpm = m.bpm; return; }
      if (m.acao === 'boneco') { var chave = m.id || 'local'; (tv.bonecos[chave] = tv.bonecos[chave] || {})[m.j] = m.boneco; aplicarBonecos(); return; }
      if (m.acao === 'musica') { tv.titulo = m.texto || ''; $('tvTitulo').style.display = tv.titulo ? 'block' : 'none'; $('tvTitulo').textContent = '🎵 ' + tv.titulo; return; }
      youtubeComando(m);
    }

    /* ---- começar: calibração → contagem → rodada ---- */
    function comecar(soCalibrar) {
      if (tv.fase === 'jogando' || tv.fase === 'calibrando' || tv.fase === 'contagem') return;
      if (!tv.local && !tv.jog.length) return;
      Som.musica(false); cheia(''); tv.podio = null;
      tv.nomes = tv.local ? (tv.cfg.jogadores === 2 ? [tv.nomes[0] || T('Esquerda', 'Left'), T('Direita', 'Right')] : [tv.nomes[0] || T('Você', 'You')]) : (tv.cfg.celulares === 1 && tv.cfg.jogadores === 2 ? [tv.jog[0].nome + ' 1', tv.jog[0].nome + ' 2'] : tv.jog.slice(0, tv.cfg.jogadores).map(function (j) { return j.nome; }));
      if (tv.cfg.celulares === 1 && tv.cfg.jogadores === 2 && !tv.local) tv.nomes = [T('Esquerda', 'Left'), T('Direita', 'Right')];
      Desenho.nomes(tv.nomes); aplicarBonecos();
      calibrar().then(function () { if (soCalibrar) { lobby(); return; } return contagem().then(rodada); });
    }
    function calibrar() {
      tv.fase = 'calibrando'; tv.caixas = {};
      var fila = [];   // [{ celular, j, faixa }]
      if (tv.local) fila.push({ local: true, j: 0 });
      else if (tv.cfg.celulares === 1 && tv.cfg.jogadores === 2) { fila.push({ celular: tv.jog[0], j: 0, faixa: [0, 0.5] }); fila.push({ celular: tv.jog[0], j: 1, faixa: [0.5, 1] }); }
      else tv.jog.slice(0, tv.cfg.jogadores).forEach(function (c, i) { fila.push({ celular: c, j: i }); });
      return fila.reduce(function (cadeia, item) { return cadeia.then(function () { return calibrarUm(item); }); }, Promise.resolve()).then(function () { Desenho.legenda(null); tv.calib = null; });
    }
    function calibrarUm(item) {
      return new Promise(function (ok) {
        var nome = tv.nomes[item.j] || '';
        if (tv.cfg.jogadores > 1) dizer(nome + ', ' + 'sua vez!', nome + ', your turn!');
        var acabou = false;
        function fim(caixa) { if (acabou) return; acabou = true; tv.caixas[item.j] = caixa; tv.calib = null; Som.tocar('ok'); dizer(Calibrar.TEXTOS.fim.pt, Calibrar.TEXTOS.fim.en); setTimeout(ok, 1200); }
        function passo(p, estado, d) {
          if (estado === 'espera') { var t = Calibrar.TEXTOS[p], n = d && d.n ? d.n : (Calibrar.PASSOS.indexOf(p) + 1); dizer(t.pt, t.en); Desenho.legenda(n + '/' + Calibrar.PASSOS.length + ' · ' + T(t.pt, t.en), '#ff5252', true); }
          else if (estado === 'ok') { Som.tocar('pegou'); Desenho.legenda(T(p === 'parado' ? Calibrar.TEXTOS.vi.pt : Calibrar.TEXTOS.ok.pt, p === 'parado' ? Calibrar.TEXTOS.vi.en : Calibrar.TEXTOS.ok.en), '#c6ff3d', false); if (p === 'parado') dizer(Calibrar.TEXTOS.vi.pt, Calibrar.TEXTOS.vi.en); }
          else if (estado === 'pulado') { Desenho.legenda(T(Calibrar.TEXTOS.pulado.pt, Calibrar.TEXTOS.pulado.en), '#ffd166', false); }
        }
        if (item.local || TESTE) {
          if (item.local && tv.toque) { fim({ x: 0.4, y: 0.1, w: 0.2, h: 0.8 }); return; }
          if (item.local && tv.esqueletoLigado) { Desenho.legenda(T('🦴 Esqueleto ligado: sem calibração. Fique de frente para a câmera.', '🦴 Skeleton on: no calibration. Face the camera.'), '#c6ff3d'); setTimeout(function () { fim(null); }, 1800); return; }
          if (TESTE) { tv.calib = { pular: function () { fim(null); } }; setTimeout(function () { fim({ x: 0.2, y: 0.05, w: 0.6, h: 0.9 }); }, 300); return; }
          tv.calib = Calibrar.iniciar({ visao: tv.visaoLocal, aoPasso: passo, aoFim: fim });
          tv.calib._pular = tv.calib.pular;
        } else {
          // o celular calibra; a TV só mostra e fala
          var cel = item.celular;
          tv.calib = { pular: function () { tv.sala.mandarPara(cel.id, { t: 'cmd', acao: 'pularCalibracao' }); }, aoCal: function (c) { if (c.passo === 'fim') fim(c.caixa); else passo(c.passo, c.ok ? 'ok' : (c.passo === 'pulado' ? 'pulado' : 'espera'), c); } };
          tv.calib.cel = cel.id;
          var mandou = tv.sala.mandarPara(cel.id, { t: 'cmd', acao: 'calibrar', faixa: item.faixa ? item.faixa.join(',') : '' });
          if (!mandou) { Desenho.legenda(T('Sem canal direto com o celular. Vamos sem calibrar.', 'No direct link to the phone. Going without calibration.'), '#ffd166'); setTimeout(function () { fim(null); }, 1500); }
          setTimeout(function () { fim(null); }, 75000);   // rede de segurança
        }
      });
    }
    function calRecebida(id, c) { if (tv.calib && tv.calib.cel === id && tv.calib.aoCal) tv.calib.aoCal(c); }
    function contagem() {
      tv.fase = 'contagem';
      return new Promise(function (ok) {
        var n = 3;
        function tic() { if (n > 0) { Desenho.contagem(n); Som.tocar('tic'); n--; setTimeout(tic, 800); } else { Desenho.contagem(null); Desenho.texto(T('VAI!', 'GO!'), 640, 360, '#c6ff3d', 120, true); Som.tocar('vai'); ok(); } }
        tic();
      });
    }
    function rodada() {
      var figs = Figuras.lista(tv.cfg.turmas);
      if (!figs.some(function (f) { return f.papel === 'fruta'; })) figs = Figuras.lista();   // sem fruta nenhuma não dá para cortar
      tv.partida = Bagunca.criarPartida({ modo: tv.cfg.modo, jogadores: tv.cfg.jogadores, duracao: tv.cfg.duracao, dificuldade: tv.cfg.dificuldade, figuras: figs });
      Object.keys(tv.caixas).forEach(function (j) { var c = tv.caixas[j]; if (c) { tv.partida.zonaChute(+j, Math.min(0.95, c.y + c.h * 0.6)); tv.partida.calibrar(+j, c); } });
      if (tv.toque) { tv.dedoCorpo = {}; for (var jt = 0; jt < tv.cfg.jogadores; jt++) { tv.partida.calibrar(jt, { x: 0.4, y: 0.1, w: 0.2, h: 0.8 }); tv.partida.corpo(jt, { x: 0.4, y: 0.1, w: 0.2, h: 0.8 }, performance.now()); } }
      Desenho.limpar(); Desenho.ambiente(tv.cfg.ambiente, tv.cfg.cena);
      $('tv').classList.toggle('paisagem', tv.cfg.ambiente === 'paisagem');
      tv.partida.comecar(); tv.fase = 'jogando'; tv.fimMusica = false; $('tv').classList.add('jogando');
      if (tv.cfg.duracao === 0 && tv.player && !tv.tocando) { try { tv.player.playVideo(); } catch (e) {} }
      window.BaguncaDebug = tv;   // só para testes automáticos (nada de segredo aqui)
    }
    function quadro(ts) {
      tv.raf = requestAnimationFrame(quadro);
      if (Desenho.estaLeve() && ts - (tv.ultimoQuadro || 0) < 28) return;   // TV: no máximo ~30 quadros/s, a física soma o tempo que pulou
      var dt = tv.ultimoQuadro ? Math.min(100, ts - tv.ultimoQuadro) : 16; tv.ultimoQuadro = ts;
      if (tv.local && tv.esqueletoLigado && Esqueleto.pronto() && tv.fase === 'jogando' && ts - (tv.ultimaMedida || 0) > 66) { tv.ultimaMedida = ts; var ks = Esqueleto.detectar(tv.videoLocal, ts); if (ks && ks[0]) tv.partida.esqueleto(0, ks[0], ts); }
      else if (tv.local && tv.visaoLocal && (tv.fase === 'jogando') && ts - (tv.ultimaMedida || 0) > 100) { tv.ultimaMedida = ts; var m = tv.visaoLocal.medir(tv.espelhar !== false); if (m) { tv.partida.movimento(0, m.p, ts); if (tv.visaoLocal.temFundo()) { var cx = tv.visaoLocal.silhueta(m.bruto); if (cx) tv.partida.corpo(0, cx, ts); } } }
      if (tv.toque && tv.partida && tv.fase === 'jogando' && ts - (tv.ultimaMedida || 0) > 100) { tv.ultimaMedida = ts; Object.keys(tv.dedoCorpo).forEach(function (j) { var c = tv.dedoCorpo[j], e = tv.partida.estado().jogadores[+j]; if (!e) return; var pul = ts < c.pulando, ab = !pul && ts < c.abaixado; tv.partida.corpo(+j, { x: Math.max(0, Math.min(0.8, e.corpo.x - 0.1)), y: pul ? -0.1 : (ab ? 0.45 : 0.1), w: ab ? 0.25 : 0.2, h: ab ? 0.45 : 0.8 }, ts); }); }
      if (TESTE && window.BaguncaTeste && window.BaguncaTeste.corpo && tv.partida && tv.fase === 'jogando') { var cb = window.BaguncaTeste.corpo(ts); if (cb) tv.partida.corpo(0, cb, ts); }
      if (TESTE && window.BaguncaTeste && window.BaguncaTeste.esqueleto && tv.partida && tv.fase === 'jogando' && ts - (tv.ultimaMedida || 0) > 66) { tv.ultimaMedida = ts; var ke = window.BaguncaTeste.esqueleto(ts); if (ke) tv.partida.esqueleto(0, ke, ts); }
      if (TESTE && window.BaguncaTeste && tv.partida && tv.fase === 'jogando') { var pts = window.BaguncaTeste.pontos && window.BaguncaTeste.pontos(ts); if (pts) tv.partida.movimento(0, pts, ts); }
      var estado = null, eventos = [];
      if (tv.partida) { tv.partida.avancar(dt); estado = tv.partida.estado(); eventos = tv.partida.eventos(); eventos.forEach(som); }
      Desenho.quadro(estado, eventos, ts);
      $('tv').classList.toggle('leve', Desenho.estaLeve());
      if (tv.debug) depurar(ts);
      if (estado && estado.fase === 'fim' && tv.fase !== 'fim') { tv.fase = 'fim'; $('tv').classList.remove('jogando'); tv.podio = estado; Som.tocar('fim'); dizer('Acabou! Muito bem!', 'Time’s up! Well done!'); setTimeout(function () { Desenho.legenda(tv.toque ? T('Quer jogar com o corpo todo? Chame a TV! ▶ joga de novo', 'Want to play with your whole body? Get the TV! ▶ plays again') : T('Toque em ▶ para jogar de novo', 'Tap ▶ to play again'), '#ffd166'); }, 2500); }
      if (tv.fase === 'fim' && tv.podio) { var ordem = tv.podio.jogadores.map(function (j, i) { return { j: i, pontos: j.pontos }; }).sort(function (a, b) { return b.pontos - a.pontos; }); Desenho.podio(null, ordem, tv.nomes, ts); }
    }
    /* ?debug na TV: caixa no canto com navegador, modo leve, quadros/s e os últimos erros (para o dono fotografar) */
    function depurar(ts) {
      tv.dbgN = (tv.dbgN || 0) + 1; if (ts - (tv.dbgT || 0) < 1000) return; tv.dbgFps = tv.dbgN; tv.dbgN = 0; tv.dbgT = ts;
      var b = $('tvDebug'); if (!b) { b = document.createElement('div'); b.id = 'tvDebug'; $('tv').appendChild(b); }
      var erros = Desenho.erros().concat(tv.errosJs || []);
      b.textContent = 'v' + APP_VERSION + ' · ' + (Desenho.estaLeve() ? 'leve' : 'normal') + ' · ' + tv.dbgFps + ' fps · ' + tv.fase + '\n' + navigator.userAgent.slice(0, 90) + (erros.length ? '\nERROS:\n' + erros.join('\n') : '\nsem erros');
    }
    function som(ev) {
      if (ev.t === 'corte') Som.tocar('corte');
      else if (ev.t === 'pegou') Som.tocar(ev.mascote ? 'mascote' : 'pegou');
      else if (ev.t === 'chutou') Som.tocar('chute');
      else if (ev.t === 'gol') Som.tocar('gol');
      else if (ev.t === 'vilao') Som.tocar(ev.fig === 'bombeta' ? 'bomba' : 'vilao');
      else if (ev.t === 'combo') Som.tocar('combo');
      else if (ev.t === 'poder' && ev.poder) Som.tocar('poder');
      else if (ev.t === 'perdeu') Som.tocar('perdeu');
      else if (ev.t === 'aviso') { Som.tocar('tic'); dizer(ev.tipo === 'baixo' ? 'Pula!' : 'Abaixa!', ev.tipo === 'baixo' ? 'Jump!' : 'Duck!'); }
      else if (ev.t === 'bateu') Som.tocar('vilao');
      else if (ev.t === 'desviou') Som.tocar('ok');
      else if (ev.t === 'tocou') Som.tocar('chute');
      else if (ev.t === 'troca') dizer({ corta: 'Agora corta!', pega: 'Agora pega!', chuta: 'Agora chuta!', pula: 'Agora pula e abaixa!', bolas: 'Bagunça de bolas!' }[ev.modo], { corta: 'Now slice!', pega: 'Now catch!', chuta: 'Now kick!', pula: 'Now jump and duck!', bolas: 'Ball mayhem!' }[ev.modo]);
    }

    /* ---- YouTube na TV (igual ao Dança) ---- */
    var ytFila = [], ytPedido = false;
    function apiYouTube(cb) {
      if (window.YT && YT.Player) return cb();
      ytFila.push(cb); if (ytPedido) return; ytPedido = true;
      window.onYouTubeIframeAPIReady = function () { var f = ytFila; ytFila = []; f.forEach(function (x) { x(); }); };
      var s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
    }
    function carregarYouTube() {
      apiYouTube(function () {
        tv.player = new YT.Player('yt', { width: '100%', height: '100%', playerVars: { autoplay: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
          events: { onReady: function () { if (tv.pendente) { var m = tv.pendente; tv.pendente = null; youtubeComando(m); } }, onStateChange: ytEstado, onError: ytErro } });
      });
    }
    function ytEstado(ev) {
      var p = tv.player; tv.tocando = (ev.data === YT.PlayerState.PLAYING);
      try { tv.lista = p.getPlaylist() || []; tv.indice = p.getPlaylistIndex(); } catch (e) { tv.lista = []; tv.indice = -1; }
      if (ev.data === YT.PlayerState.PLAYING) { var d = p.getVideoData ? p.getVideoData() : null, id = d && d.video_id; if (id && id !== tv.videoAtual) { tv.videoAtual = id; tv.titulo = d.title || id; $('tvTitulo').style.display = 'block'; $('tvTitulo').textContent = '🎵 ' + tv.titulo; } }
      if (ev.data === YT.PlayerState.ENDED && tv.partida && tv.fase === 'jogando' && tv.cfg.duracao === 0) tv.partida.terminar();
    }
    function ytErro(ev) {
      var c = ev.data, msg = (c === 101 || c === 150) ? T('Esse clipe não deixa tocar fora do YouTube. Pulando…', 'That clip cannot play outside YouTube. Skipping…') : (c === 100) ? T('Vídeo indisponível ou privado.', 'Video unavailable or private.') : (c === 2) ? T('Playlist privada ou link inválido.', 'Private playlist or bad link.') : T('Erro do YouTube ', 'YouTube error ') + c;
      tv.titulo = msg; $('tvTitulo').style.display = 'block'; $('tvTitulo').textContent = '⚠️ ' + msg;
      try { if (tv.player.getPlaylist && (tv.player.getPlaylist() || []).length > 1) setTimeout(function () { tv.player.nextVideo(); }, 1500); } catch (e) {}
    }
    function youtubeComando(m) {
      var p = tv.player;
      if (['carregar', 'playlist', 'indice', 'proxima', 'anterior', 'pausa', 'reiniciar'].indexOf(m.acao) < 0) return;
      if (!p || !p.loadVideoById) { if (m.acao === 'carregar' || m.acao === 'playlist') { tv.pendente = m; carregarYouTube(); } return; }
      $('tvYt').classList.add('on');
      if (m.acao === 'carregar' && m.video) { tv.titulo = m.titulo || m.video; tv.videoAtual = m.video; tv.lista = []; tv.indice = -1; $('tvTitulo').style.display = 'block'; $('tvTitulo').textContent = '🎵 ' + tv.titulo; p.loadVideoById(m.video); p.playVideo(); }
      else if (m.acao === 'playlist' && m.lista) { tv.videoAtual = ''; p.loadPlaylist({ list: m.lista, listType: 'playlist', index: m.i || 0 }); p.playVideo(); }
      else if (m.acao === 'indice' && tv.lista.length) p.playVideoAt(+m.i || 0);
      else if (m.acao === 'proxima' && tv.lista.length) p.nextVideo();
      else if (m.acao === 'anterior' && tv.lista.length) p.previousVideo();
      else if (m.acao === 'pausa') { if (p.getPlayerState && p.getPlayerState() === YT.PlayerState.PLAYING) p.pauseVideo(); else p.playVideo(); }
      else if (m.acao === 'reiniciar') { p.seekTo(0, true); p.playVideo(); }
    }

    /* ---- entrada ---- */
    function iniciar(opts) {
      opts = opts || {};
      tv.local = !!opts.local;
      tela(''); $('tv').classList.add('ativa'); $('tv').classList.toggle('local', tv.local);
      Desenho.iniciar($('tvCanvas'), { nomes: [] });
      Som.iniciar(); Voz.liberar(); tv.vozLiberada = !!opts.gesto;
      tv.toque = !!opts.toque; $('tv').classList.toggle('toque', tv.toque);
      if (tv.local) { tv.visaoLocal = opts.visao || null; tv.videoLocal = opts.video || null; tv.esqueletoLigado = !!opts.esqueleto; tv.nomes = opts.nomes || [opts.nome || T('Você', 'You')]; if (opts.video) $('tvFundo').appendChild(opts.video); }
      if (tv.toque) { ligarToque(); try { tv.mostrarBoneco = localStorage.getItem('bagunca:bonecoDedo') === '1'; } catch (e) { tv.mostrarBoneco = false; } } else tv.mostrarBoneco = true;   // no dedo o boneco começa escondido
      $('localBoneco').classList.toggle('ativo', !!tv.mostrarBoneco); Desenho.mostrarBoneco(tv.mostrarBoneco);
      try { if (!tv.local && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {}); } catch (e) {}
      if (!tv.debug && /[?&]debug\b/.test(location.search)) { tv.debug = true; tv.errosJs = []; window.addEventListener('error', function (e) { tv.errosJs.push('js: ' + (e.message || e)); if (tv.errosJs.length > 5) tv.errosJs.shift(); }); }
      if (!tv.raf) tv.raf = requestAnimationFrame(quadro);
      carregar().then(function () { if (tv.local) lobby(); else capa(); if (!tv.local) carregarYouTube(); });
      if (tv.teclado) return;
      tv.teclado = true;
      $('localComecar').onclick = function () { if (tv.fase === 'lobby' || tv.fase === 'fim') comecar(); };
      $('localPausa').onclick = function () { comando({ acao: 'pausar' }); };
      $('localCamera').onclick = function () { CelApp.trocarCameraLocal(); };
      $('localBoneco').onclick = function () { tv.mostrarBoneco = !tv.mostrarBoneco; $('localBoneco').classList.toggle('ativo', tv.mostrarBoneco); Desenho.mostrarBoneco(tv.mostrarBoneco); try { localStorage.setItem('bagunca:bonecoDedo', tv.mostrarBoneco ? '1' : '0'); } catch (e) {} };
      $('localPessoas').onclick = function () { var n = tv.cfg.jogadores === 2 ? 1 : 2; $('localPessoas').textContent = n === 2 ? '👥 2' : '👤 1'; comando({ acao: 'config', jogadores: n, celulares: 1 }); };
      $('localModos').querySelectorAll('button').forEach(function (b) { b.onclick = function () { $('localModos').querySelectorAll('button').forEach(function (x) { x.classList.remove('ativo'); }); b.classList.add('ativo'); comando({ acao: 'config', modo: b.getAttribute('data-v') }); }; });
      // teclado / controle da TV: OK (Enter) começa; Esc/Voltar nada
      document.addEventListener('keydown', function (e) {
        if (!$('tv').classList.contains('ativa')) return;
        if (!tv.vozLiberada) { tv.vozLiberada = true; Voz.liberar(); Som.iniciar(); }
        if (e.key === 'Enter' || e.key === ' ') { if (tv.fase === 'lobby' || tv.fase === 'fim') comecar(); else if (tv.fase === 'jogando' || tv.fase === 'pausa') comando({ acao: 'pausar' }); else if (tv.fase === 'calibrando' && tv.calib) tv.calib.pular(); }
      });
    }
    /* ---- 🖐️ no dedo: cada dedo (ou o mouse) vira um ponto de movimento com força 100; a raia é a metade
       onde o dedo está (2 pessoas); deslizar para cima = pulo, para baixo = abaixar; o boneco anda com o dedo ---- */
    var dedos = {}, toqueLigado = false;
    function ligarToque() {
      if (toqueLigado) return; toqueLigado = true;
      var cv = $('tvCanvas');
      function pos(e) { var r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) }; }
      function raiaDe(p) { var dois = tv.cfg.jogadores === 2; return dois ? { j: p.x < 0.5 ? 0 : 1, x: p.x < 0.5 ? p.x * 2 : (p.x - 0.5) * 2 } : { j: 0, x: p.x }; }
      function corpoDedo(j, x, ts) {
        var c = tv.dedoCorpo[j] || (tv.dedoCorpo[j] = { pulando: 0, abaixado: 0 }), agora = performance.now();
        var pul = agora < c.pulando, ab = !pul && agora < c.abaixado;
        tv.partida.corpo(j, { x: Math.max(0, Math.min(0.8, x - 0.1)), y: pul ? -0.1 : (ab ? 0.45 : 0.1), w: ab ? 0.25 : 0.2, h: ab ? 0.45 : 0.8 }, ts);
      }
      cv.addEventListener('pointerdown', function (e) { if (!tv.toque) return; e.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); var p = pos(e); dedos[e.pointerId] = { x0: p.x, y0: p.y, t0: performance.now(), p: p }; if (tv.fase === 'lobby' || tv.fase === 'fim') return; if (tv.partida && tv.fase === 'jogando') { var r = raiaDe(p); tv.partida.movimento(r.j, [[r.x, p.y, 100]], performance.now()); corpoDedo(r.j, r.x, performance.now()); } });
      cv.addEventListener('pointermove', function (e) { if (!tv.toque || !dedos[e.pointerId]) return; e.preventDefault(); var p = pos(e), d = dedos[e.pointerId]; d.p = p; if (tv.partida && tv.fase === 'jogando') { var r = raiaDe(p); tv.partida.movimento(r.j, [[r.x, p.y, 100]], performance.now()); corpoDedo(r.j, r.x, performance.now()); } });
      function solta(e) {
        var d = dedos[e.pointerId]; if (!d) return; delete dedos[e.pointerId];
        if (!tv.partida || tv.fase !== 'jogando') return;
        var dy = d.p.y - d.y0, dt = performance.now() - d.t0, r = raiaDe(d.p), c = tv.dedoCorpo[r.j] || (tv.dedoCorpo[r.j] = { pulando: 0, abaixado: 0 });
        if (dt < 600 && dy < -0.12) { c.pulando = performance.now() + 650; Som.tocar('tic'); }        // deslizou para cima: pula
        else if (dt < 600 && dy > 0.12) { c.abaixado = performance.now() + 800; }                     // para baixo: abaixa
        corpoDedo(r.j, r.x, performance.now());
      }
      cv.addEventListener('pointerup', solta); cv.addEventListener('pointercancel', solta);
    }
    function sairLocal() {
      dedos = {}; tv.dedoCorpo = {}; tv.toque = false; $('tv').classList.remove('toque');
      cancelAnimationFrame(tv.raf); tv.raf = 0; tv.partida = null; tv.fase = 'carregando'; Som.musica(false); Desenho.legenda(null);
      $('tv').classList.remove('ativa', 'local', 'semEspelho', 'leve'); while ($('tvFundo').firstChild) $('tvFundo').removeChild($('tvFundo').firstChild);
    }
    function espelhar(v) { tv.espelhar = v !== false; $('tv').classList.toggle('semEspelho', !tv.espelhar); }
    return { iniciar: iniciar, comando: comando, sairLocal: sairLocal, espelhar: espelhar, tv: tv };
  })();

  /* =====================================================================
     CELULAR
     ===================================================================== */
  var CelApp = (function () {
    var cel = { sala: null, visao: null, timer: 0, calib: null, estado: null, cfg: Object.assign({}, CFG_PADRAO, { turmas: Object.assign({}, CFG_PADRAO.turmas) }), local: false };
    var titulos = {}; try { titulos = JSON.parse(localStorage.getItem('bagunca:titulos') || '{}'); } catch (e) {}
    function status(txt, tipo) { var s = $('jogoStatus'); s.textContent = txt; s.className = 'status' + (tipo ? ' ' + tipo : ''); }

    function entrar() {
      var nome = $('nome').value.trim(), cod = cel.local ? 'SOLO' : $('codigo').value.trim().toUpperCase(), erro = $('entrarErro'); erro.style.display = 'none';
      if (!nome || (!cel.local && !/^[A-Z]{4}$/.test(cod))) { erro.textContent = T('Digite o nome e as 4 letras do código.', 'Type the name and the 4-letter code.'); erro.style.display = 'block'; return; }
      if (!cel.toque && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.RTCPeerConnection)) { erro.textContent = T('Este navegador não deixa usar a câmera. Abra no Chrome ou no Safari.', 'This browser cannot use the camera. Open it in Chrome or Safari.'); erro.style.display = 'block'; return; }
      try { localStorage.setItem('bagunca:nome', nome); if (!cel.local) localStorage.setItem('bagunca:codigo', cod); } catch (e) {}
      $('btEntrar').disabled = true; Som.iniciar(); Voz.liberar();
      if (cel.toque) { TVApp.iniciar({ local: true, toque: true, nome: nome, gesto: true }); TVApp.comando(Object.assign({ acao: 'config' }, cel.cfg, { celulares: 1 })); mandarBonecos(); $('btEntrar').disabled = false; return; }
      if (cel.local) { entrarLocal(nome, erro); return; }
      cel.sala = Sala.celular({ nome: nome, codigo: cod, video: $('cam'), T: T, aoStatus: status, aoTV: daTV, aoConectado: function () { Som.tocar('ok'); mandarConfig(); }, aoCamera: function (c) { $('cam').style.transform = 'scaleX(-1)'; }, aoCameras: cameras });
      cel.sala.pronto.then(function () {
        tela('jogo'); $('jogoNome').textContent = nome; $('jogoCodigo').textContent = cod; status(T('Procurando a TV…', 'Looking for the TV…'));
        cel.visao = Sala.criarVisao($('cam')); cel.timer = setInterval(medir, 100);
        mandarConfig();
      }).catch(function (e) { $('btEntrar').disabled = false; erro.textContent = (e && e.name === 'NotAllowedError') ? T('Você precisa permitir a câmera.', 'You need to allow the camera.') : T('Não deu para conectar: ', 'Could not connect: ') + (e && e.message || e); erro.style.display = 'block'; });
    }
    /* só o celular: a TV roda aqui mesmo, com a câmera deste aparelho */
    function trocarCameraLocal() {
      if (!cel.streamLocal) return;
      var lado = cel.ladoLocal === 'user' ? 'environment' : 'user';
      navigator.mediaDevices.getUserMedia({ video: { facingMode: lado, width: { ideal: 640 }, height: { ideal: 360 } }, audio: false }).then(function (s) {
        cel.streamLocal.getTracks().forEach(function (t) { t.stop(); });
        cel.streamLocal = s; cel.ladoLocal = lado; cel.videoLocal.srcObject = s; cel.videoLocal.play().catch(function () {});
        cel.visao.zerar(); TVApp.espelhar(lado === 'user');
      }).catch(function () { Desenho.legenda(T('Este aparelho só tem uma câmera.', 'This device has only one camera.'), '#ffd166'); });
    }
    function entrarLocal(nome, erro) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 360 } }, audio: false }).catch(function () { return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }).then(function (s) {
        var v = document.createElement('video'); v.autoplay = true; v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.srcObject = s; v.play().catch(function () {});
        cel.streamLocal = s; cel.videoLocal = v; cel.ladoLocal = 'user'; cel.visao = Sala.criarVisao(v);
        TVApp.iniciar({ local: true, visao: cel.visao, video: v, nome: nome, gesto: true, esqueleto: cel.esqueleto && Esqueleto.pronto() });
        TVApp.comando(Object.assign({ acao: 'config' }, cel.cfg, { celulares: 1 })); mandarBonecos();
        $('btEntrar').disabled = false;
      }).catch(function (e) { $('btEntrar').disabled = false; erro.textContent = (e && e.name === 'NotAllowedError') ? T('Você precisa permitir a câmera.', 'You need to allow the camera.') : T('Não deu: ', 'Failed: ') + (e && e.message || e); erro.style.display = 'block'; });
    }
    /* ---- esqueleto por IA no celular ---- */
    function alternarEsqueleto() {
      if (cel.esqueleto) { cel.esqueleto = false; $('btEsqueleto').classList.remove('ativo'); $('esqBox').style.display = 'none'; try { localStorage.setItem('bagunca:esqueleto', '0'); } catch (e) {} return; }
      if (!Esqueleto.pronto() && !confirm(T('Baixar o esqueleto por IA agora? São uns 20 MB, uma vez só (melhor no Wi-Fi).', 'Download the AI skeleton now? About 20 MB, once (best on Wi-Fi).'))) return;
      $('btEsqueleto').disabled = true; $('esqBox').style.display = ''; $('esqTxt').textContent = T('baixando…', 'downloading…'); $('esqBarra').style.width = '5%';
      Esqueleto.carregar({ aoProgresso: function (p) { $('esqBarra').style.width = Math.round(p * 100) + '%'; } }).then(function () {
        cel.esqueleto = true; $('btEsqueleto').classList.add('ativo'); $('esqTxt').textContent = T('ligado ✓', 'on ✓'); try { localStorage.setItem('bagunca:esqueleto', '1'); } catch (e) {}
        if (cel.local) TVApp.tv.esqueletoLigado = true;
      }).catch(function (e) { $('esqTxt').textContent = ''; $('esqBox').style.display = 'none'; status(T('O esqueleto não carregou: ', 'The skeleton did not load: ') + (e && e.message || e), 'erro'); })
        .then(function () { $('btEsqueleto').disabled = false; });
    }
    $('btEsqueleto').onclick = alternarEsqueleto;
    function medir() {
      if (!cel.visao || cel.calib) return;
      if (cel.esqueleto && Esqueleto.pronto()) {
        var ks = Esqueleto.detectar($('cam'), performance.now());
        if (ks) { var vis = cel.visao.medir(); if (vis) $('energiaBarra').style.width = vis.e + '%'; if (ks.length) cel.sala.enviarDados({ e: vis ? vis.e : 0, p: [], k: ks }); return; }
      }
      var m = cel.visao.medir(); if (!m) return;
      $('energiaBarra').style.width = m.e + '%';
      if (cel.visao.temFundo()) {
        var cfg = cel.estado && cel.estado.cfg, dados = { e: m.e, p: m.p };
        if (cfg && cfg.jogadores === 2 && cfg.celulares === 1) dados.cs = [cel.visao.silhueta(m.bruto, [0, 0.5]), cel.visao.silhueta(m.bruto, [0.5, 1])];
        else dados.c = cel.visao.silhueta(m.bruto);
        if (!cel.sala.enviarDados(dados)) cel.sala.energia(m.e, m.p);
      } else cel.sala.energia(m.e, m.p);
    }
    function daTV(m) {
      if (m.t === 'estado') { cel.estado = m; mostrarEstado(m); if ((m.fase === 'lobby' || m.fase === 'fim' || m.fase === 'capa') && cel.sala && !cel.sala.conectado()) cel.sala.reentrar(); return; }
      if (m.t !== 'cmd') return;
      if (m.acao === 'fale') { Voz.falar(m.texto, m.texto); return; }
      if (m.acao === 'calibrar') { calibrar(m.faixa); return; }
      if (m.acao === 'pularCalibracao') { if (cel.calib) cel.calib.pular(); return; }
    }
    function calibrar(faixaTxt) {
      if (cel.calib) cel.calib.parar();
      if (cel.esqueleto && Esqueleto.pronto()) { $('calTxt').textContent = '🦴 ' + T('Esqueleto ligado: sem calibração', 'Skeleton on: no calibration'); $('calTxt').className = 'cal ok'; cel.sala.enviarDados({ e: 0, p: [], cal: { passo: 'fim', ok: true, caixa: null } }); return; }
      var faixa = faixaTxt ? faixaTxt.split(',').map(Number) : null;
      $('btPularCal').style.display = '';
      cel.calib = Calibrar.iniciar({ visao: cel.visao, faixa: faixa,
        aoPasso: function (p, estado, d) {
          if (estado === 'medindo') return;
          var t = Calibrar.TEXTOS[p], txt = estado === 'ok' ? '✅ ' + T(t.pt, t.en) : estado === 'pulado' ? '⏭ ' + T(t.pt, t.en) : '🔴 ' + T(t.pt, t.en);
          $('calTxt').textContent = txt; $('calTxt').className = 'cal ' + (estado === 'ok' ? 'ok' : 'espera');
          cel.sala.enviarDados({ e: 0, p: [], cal: { passo: p, ok: estado === 'ok', caixa: d.caixa || null, n: d.n || 0 } });
        },
        aoFim: function (caixa) { cel.calib = null; $('btPularCal').style.display = 'none'; $('calTxt').textContent = '✅ ' + T('Pronto!', 'Ready!'); $('calTxt').className = 'cal ok'; cel.sala.enviarDados({ e: 0, p: [], cal: { passo: 'fim', ok: true, caixa: caixa } }); setTimeout(function () { $('calTxt').textContent = ''; }, 3000); }
      });
    }
    function cameras(lista, atual) { var c = lista[atual]; $('camNome').textContent = lista.length > 1 ? (atual + 1) + '/' + lista.length + ' ' + nomeCamera(c && c.label || '') : nomeCamera(c && c.label || ''); }
    function nomeCamera(label) { var l = label.toLowerCase(); if (/ultra|wide|0\.5|grande/.test(l)) return T('grande-angular', 'wide-angle'); if (/tele|zoom/.test(l)) return 'tele'; if (/front|user/.test(l)) return T('frontal', 'front'); if (/back|rear|environment/.test(l)) return T('traseira', 'back'); return label.slice(0, 22); }

    function mostrarEstado(m) {
      var p = $('placar'); while (p.firstChild) p.removeChild(p.firstChild);
      (m.pontos || []).forEach(function (pt, i) { var d = document.createElement('div'), s = document.createElement('span'), b = document.createElement('b'); s.textContent = (m.eu === i ? '⭐ ' : '') + (pt.nome || ''); b.textContent = String(pt.pontos); d.appendChild(s); d.appendChild(b); p.appendChild(d); });
      desenharLista(m);
      var f = m.fase;
      if (f === 'fim' && cel.faseAnterior === 'jogando' && Spotify.ativo() && Spotify.entrou()) Spotify.pausar().catch(function () {});
      cel.faseAnterior = f;
      $('btComecar').disabled = !(f === 'lobby' || f === 'fim' || f === 'capa');
      $('btPausa').disabled = !(f === 'jogando' || f === 'pausa'); $('btParar').disabled = !(f === 'jogando' || f === 'pausa');
      if (m.tocando) status('🎵 ' + (m.titulo || ''), 'ok');
      else if (f === 'jogando') status(T('Jogando! 🎮', 'Playing! 🎮'), 'ok');
      else if (f === 'calibrando') status(T('Calibrando… siga a voz', 'Calibrating… follow the voice'), 'ok');
      else if (f === 'fim') status(T('Acabou! Toque em ▶ para jogar de novo', 'Done! Tap ▶ to play again'), 'ok');
      else if (cel.sala && cel.sala.conectado()) status(T('Ao vivo na TV ✅ — toque em ▶ Começar', 'Live on the TV ✅ — tap ▶ Start'), 'ok');
    }
    function comando(m) { if (cel.local) TVApp.comando(m); else if (cel.sala) cel.sala.comando(m); }
    function mandarConfig() { comando(Object.assign({ acao: 'config' }, cel.cfg)); mandarBonecos(); }

    /* ---- música (YouTube) ---- */
    function tocarLink(link) {
      link = link || $('link').value; var pl = idPlaylist(link);
      if (pl) { comando({ acao: 'playlist', lista: pl }); $('link').value = ''; status(T('Mandei a playlist para a TV…', 'Sent the playlist to the TV…'), 'ok'); oembed('https://www.youtube.com/playlist?list=' + pl).then(function (j) { guardarHist('list:' + pl, (j && j.title) || (T('Playlist ', 'Playlist ') + pl.slice(0, 6) + '…')); }); return; }
      var id = idYouTube(link); if (!id) { status(T('Não achei um link do YouTube aí.', 'That is not a YouTube link.'), 'erro'); return; }
      $('btTocarLink').disabled = true;
      oembed('https://www.youtube.com/watch?v=' + id).then(function (j) { var titulo = (j && j.title) || id; comando({ acao: 'carregar', video: id, titulo: titulo }); guardarHist(id, titulo); $('link').value = ''; $('btTocarLink').disabled = false; status(T('Mandei tocar: ', 'Sent to play: ') + titulo, 'ok'); });
    }
    function oembed(url) { return fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); }
    function lerHist() { try { return JSON.parse(localStorage.getItem('bagunca:hist') || '[]'); } catch (e) { return []; } }
    function guardarHist(id, titulo) { var h = lerHist().filter(function (x) { return x.id !== id; }); h.unshift({ id: id, titulo: String(titulo).slice(0, 120) }); try { localStorage.setItem('bagunca:hist', JSON.stringify(h.slice(0, 30))); } catch (e) {} desenharHist(); }
    function desenharHist() {
      var h = lerHist(), d = $('hist'); while (d.firstChild) d.removeChild(d.firstChild); if (!h.length) return;
      var t = document.createElement('div'); t.className = 'muted'; t.textContent = T('Suas músicas (segure para tirar)', 'Your songs (hold to remove)'); d.appendChild(t);
      h.forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sec'; var pl = x.id.indexOf('list:') === 0; b.textContent = (pl ? '📜 ' : '🎵 ') + x.titulo;
        b.onclick = function () { tocarLink(pl ? 'https://www.youtube.com/playlist?list=' + x.id.slice(5) : x.id); };
        var seg; b.addEventListener('touchstart', function () { seg = setTimeout(function () { if (confirm(T('Tirar da lista?', 'Remove from the list?') + ' ' + x.titulo)) { try { localStorage.setItem('bagunca:hist', JSON.stringify(lerHist().filter(function (y) { return y.id !== x.id; }))); } catch (e) {} desenharHist(); } }, 700); }, { passive: true });
        b.addEventListener('touchend', function () { clearTimeout(seg); }); b.addEventListener('touchmove', function () { clearTimeout(seg); });
        d.appendChild(b);
      });
    }
    var listaDesenhada = '', buscando = false;
    function buscarTitulos(ids) { if (buscando) return; var falta = ids.filter(function (id) { return !titulos[id]; }); if (!falta.length) return; buscando = true; oembed('https://www.youtube.com/watch?v=' + falta[0]).then(function (j) { titulos[falta[0]] = (j && j.title) || falta[0]; try { localStorage.setItem('bagunca:titulos', JSON.stringify(titulos)); } catch (e) {} buscando = false; listaDesenhada = ''; desenharLista(cel.estado); if (falta.length > 1) setTimeout(function () { buscarTitulos(ids); }, 150); }); }
    function desenharLista(m) {
      var ids = (m && m.lista) || [], d = $('plLista'); $('btAnterior').disabled = $('btProxima').disabled = !ids.length;
      if (!ids.length) { d.style.display = 'none'; listaDesenhada = ''; return; }
      d.style.display = ''; var chave = ids.join(',') + '|' + m.indice + '|' + Object.keys(titulos).length; if (chave === listaDesenhada) return; listaDesenhada = chave;
      while (d.firstChild) d.removeChild(d.firstChild);
      var t = document.createElement('div'); t.className = 'muted'; t.textContent = T('Playlist (toque para tocar)', 'Playlist (tap to play)'); d.appendChild(t);
      ids.forEach(function (id, i) { var b = document.createElement('button'); b.type = 'button'; b.className = 'sec' + (i === m.indice ? ' atual' : ''); b.textContent = (i === m.indice ? '▶️ ' : (i + 1) + '. ') + (titulos[id] || '…'); b.onclick = function () { comando({ acao: 'indice', i: i }); }; d.appendChild(b); });
      buscarTitulos(ids);
    }
    /* ---- 👗 Meu boneco: monte o avatar (cabeça, roupa, cores, acessório); guardado neste celular ---- */
    var PADRAO_BONECO = [{ cabeca: 'menino', cabelo: 'curto', corCabelo: '#4a2c17', cor: '#c6ff3d', roupa: 'camiseta', acessorio: 'nenhum', sapato: '#2b2250', pele: '#ffd9b3' }, { cabeca: 'menina', cabelo: 'longo', corCabelo: '#2b1a0e', cor: '#ff4fa3', roupa: 'vestido', acessorio: 'laco', sapato: '#ffffff', pele: '#ffd9b3' }];
    var CORES_ROUPA = ['#c6ff3d', '#ff4fa3', '#3ee8ff', '#ffd166', '#8e5bff', '#ff7a00', '#ff5252', '#ffffff', '#2b2250', '#43a047'];
    var CORES_PELE = ['#ffd9b3', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a21'];
    var CORES_CABELO = ['#2b1a0e', '#4a2c17', '#8d5524', '#f9a825', '#fff176', '#ff7a00', '#d32f2f', '#8e5bff', '#3ee8ff', '#eeeeee'];
    var CORES_SAPATO = ['#2b2250', '#ffffff', '#ff4fa3', '#ffd166', '#8d5524', '#3ee8ff'];
    cel.bonecos = PADRAO_BONECO.map(function (b) { return Object.assign({}, b); });
    try { var gb = JSON.parse(localStorage.getItem('bagunca:bonecos') || 'null'); if (Array.isArray(gb)) gb.forEach(function (b, i) { if (b && i < 2) Object.assign(cel.bonecos[i], b); }); } catch (e) {}
    cel.quem = 0;
    function guardarBonecos() { try { localStorage.setItem('bagunca:bonecos', JSON.stringify(cel.bonecos)); } catch (e) {} }
    function mandarBonecos() { comando({ acao: 'boneco', j: 0, boneco: cel.bonecos[0] }); comando({ acao: 'boneco', j: 1, boneco: cel.bonecos[1] }); }
    var NOMES_CABECA = { menino: ['Menino', 'Boy'], menina: ['Menina', 'Girl'], pano: ['Boneco de pano', 'Rag doll'], elfo: ['Elfo', 'Elf'], hobbit: ['Pequenino', 'Halfling'], mago: ['Mago', 'Wizard'], cavaleiro: ['Cavaleiro', 'Knight'], robo: ['Robô', 'Robot'] };
    var NOMES_CABELO = { curto: ['Curto', 'Short'], espetado: ['Espetado', 'Spiky'], franja: ['Franja', 'Fringe'], longo: ['Longo', 'Long'], cacheado: ['Cacheado', 'Curly'], trancas: ['Tranças', 'Braids'], coque: ['Coque', 'Bun'], maria: ['Maria-chiquinha', 'Pigtails'], careca: ['Sem cabelo', 'No hair'] };
    function montarPicker(container) {
      while (container.firstChild) container.removeChild(container.firstChild);
      function linha(rotulo) { var d = document.createElement('div'); d.className = 'linha'; var sp = document.createElement('span'); sp.textContent = rotulo; d.appendChild(sp); container.appendChild(d); return d; }
      function grupo(el, itens, valorAtual, aoEscolher, classe) {
        var g = document.createElement('div'); g.className = classe || 'grupo'; el.appendChild(g);
        itens.forEach(function (it) { var b = document.createElement('button'); b.type = 'button'; b.className = 'sec opt' + (it.v === valorAtual() ? ' ativo' : ''); if (it.cor) { b.style.background = it.cor; b.title = it.v; } else b.textContent = it.t; b.onclick = function () { g.querySelectorAll('button').forEach(function (x) { x.classList.remove('ativo'); }); b.classList.add('ativo'); aoEscolher(it.v); }; g.appendChild(b); });
        return g;
      }
      var prev = document.createElement('div'); prev.className = 'previa'; var cv = document.createElement('canvas'); cv.width = 300; cv.height = 400; prev.appendChild(cv); container.appendChild(prev);
      var quem = linha(T('Quem', 'Who')); grupo(quem, [{ v: 0, t: T('Boneco 1', 'Avatar 1') }, { v: 1, t: T('Boneco 2', 'Avatar 2') }], function () { return cel.quem; }, function (v) { cel.quem = v; montarPicker(container); }, 'grupo quem');
      var atual = function () { return cel.bonecos[cel.quem]; };
      function muda(k, v) { atual()[k] = v; guardarBonecos(); mandarBonecos(); if (k === 'cabeca') atualizarCabecas(); }
      var cab = linha(T('Cabeça', 'Head')); var cabs = document.createElement('div'); cabs.className = 'cabecas'; cab.appendChild(cabs);
      var cabecasHumanas = Boneco.CABECAS.map(function (id) { return { id: id, humana: true, nome: NOMES_CABECA[id] }; });
      var cabecasTurma = Figuras.lista().filter(function (f) { return f.papel === 'heroi'; }).map(function (f) { return { id: f.id, fig: f, nome: [f.nome.pt, f.nome.en] }; });
      var botoesCabeca = [];
      cabecasHumanas.concat(cabecasTurma).forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'sec opt' + (c.id === atual().cabeca ? ' ativo' : ''); b.title = T(c.nome[0], c.nome[1]) + (c.fig && c.fig.menina ? ' 👧' : '');
        if (c.humana) { var mini = document.createElement('canvas'); mini.width = mini.height = 96; b.appendChild(mini); b._mini = mini; b._id = c.id; }
        else { var im2 = document.createElement('img'); im2.src = c.fig.img || ('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(c.fig.svg)); im2.alt = b.title; b.appendChild(im2); }
        b.onclick = function () { cabs.querySelectorAll('button').forEach(function (x) { x.classList.remove('ativo'); }); b.classList.add('ativo'); muda('cabeca', c.id); };
        cabs.appendChild(b); botoesCabeca.push(b);
      });
      function atualizarCabecas() { botoesCabeca.forEach(function (b) { if (b._mini) Desenho.previaCabeca(b._mini, Object.assign({}, atual(), { cabeca: b._id, acessorio: 'nenhum', cabelo: b._id === 'menino' ? 'curto' : b._id === 'menina' ? 'longo' : b._id === 'hobbit' ? 'cacheado' : b._id === 'elfo' ? 'longo' : atual().cabelo })); }); }
      atualizarCabecas();
      grupo(linha(T('Cabelo', 'Hair')), Boneco.CABELOS.map(function (id) { return { v: id, t: T(NOMES_CABELO[id][0], NOMES_CABELO[id][1]) }; }), function () { return atual().cabelo; }, function (v) { muda('cabelo', v); atualizarCabecas(); });
      grupo(linha(T('Cor do cabelo', 'Hair colour')), CORES_CABELO.map(function (c) { return { v: c, cor: c }; }), function () { return atual().corCabelo; }, function (v) { muda('corCabelo', v); atualizarCabecas(); }, 'cores');
      grupo(linha(T('Pele', 'Skin')), CORES_PELE.map(function (c) { return { v: c, cor: c }; }), function () { return atual().pele; }, function (v) { muda('pele', v); atualizarCabecas(); }, 'cores');
      grupo(linha(T('Roupa', 'Outfit')), [{ v: 'camiseta', t: T('👕 Camiseta', '👕 T-shirt') }, { v: 'vestido', t: T('👗 Vestido', '👗 Dress') }, { v: 'macacao', t: T('🧥 Macacão', '🧥 Overalls') }, { v: 'capa', t: T('🦸 Capa', '🦸 Cape') }, { v: 'tunica', t: T('🧝 Túnica', '🧝 Tunic') }, { v: 'armadura', t: T('🛡️ Armadura', '🛡️ Armour') }], function () { return atual().roupa; }, function (v) { muda('roupa', v); });
      grupo(linha(T('Cor da roupa', 'Outfit colour')), CORES_ROUPA.map(function (c) { return { v: c, cor: c }; }), function () { return atual().cor; }, function (v) { muda('cor', v); atualizarCabecas(); }, 'cores');
      grupo(linha(T('Acessório', 'Accessory')), [{ v: 'nenhum', t: T('Nada', 'None') }, { v: 'laco', t: '🎀' }, { v: 'coroa', t: '👑' }, { v: 'tiara', t: '💎' }, { v: 'oculos', t: '🕶️' }, { v: 'bone', t: '🧢' }, { v: 'chapeu', t: '🎉' }, { v: 'asas', t: '🪽' }, { v: 'flor', t: '🌸' }], function () { return atual().acessorio; }, function (v) { muda('acessorio', v); });
      grupo(linha(T('Sapato', 'Shoes')), CORES_SAPATO.map(function (c) { return { v: c, cor: c }; }), function () { return atual().sapato; }, function (v) { muda('sapato', v); }, 'cores');
      var vivo = function (ts) { if (!document.body.contains(cv)) return; if (container.closest('details').open) Desenho.previa(cv, atual(), ts); requestAnimationFrame(vivo); }; requestAnimationFrame(vivo);
    }
    document.querySelectorAll('details.boneco .picker').forEach(montarPicker);
    document.querySelectorAll('details.boneco').forEach(function (d) { d.addEventListener('toggle', function () { if (d.open) montarPicker(d.querySelector('.picker')); }); });
    /* ---- batida pelo microfone ---- */
    function alternarBatida() {
      if (cel.batida) { cel.batida.parar(); cel.batida = null; $('btBatida').classList.remove('ativo'); $('nivelBox').style.display = 'none'; comando({ acao: 'bpm', bpm: 0 }); return; }
      $('btBatida').disabled = true;
      Batida.iniciar({
        aoBatida: function () { if (cel.sala) cel.sala.enviarDados({ e: 0, p: [], b: 1 }); else if (cel.local) Desenho.pulso(); },
        aoBpm: function (bpm) { $('bpmTxt').textContent = bpm + ' bpm'; if (cel.sala && cel.sala.enviarDados({ e: 0, p: [], bpm: bpm })) return; comando({ acao: 'bpm', bpm: bpm }); },
        aoNivel: function (n) { $('nivel').style.width = Math.round(n * 100) + '%'; }
      }).then(function (b) { cel.batida = b; $('btBatida').classList.add('ativo'); $('nivelBox').style.display = ''; $('bpmTxt').textContent = T('ouvindo…', 'listening…'); })
        .catch(function (e) { status((e && e.name === 'NotAllowedError') ? T('Você precisa permitir o microfone.', 'You need to allow the microphone.') : T('Microfone não deu: ', 'Microphone failed: ') + (e && e.message || e), 'erro'); })
        .then(function () { $('btBatida').disabled = false; });
    }
    /* ---- Spotify (controle remoto) ---- */
    function spotifyUI() {
      if (!Spotify.ativo()) return;
      $('spotifyBox').style.display = '';
      var dentro = Spotify.entrou(); $('spotifyDentro').style.display = dentro ? '' : 'none'; $('btSpotify').style.display = dentro ? 'none' : '';
      if (dentro) spotifyCarregar();
    }
    function spotifyCarregar() {
      Spotify.aparelhos().then(function (ds) { var sel = $('spAparelho'); while (sel.firstChild) sel.removeChild(sel.firstChild); ds.forEach(function (d) { var o = document.createElement('option'); o.value = d.id; o.textContent = (d.is_active ? '▶ ' : '') + d.name + ' (' + d.type + ')'; if (d.is_active) o.selected = true; sel.appendChild(o); }); if (!ds.length) { var o2 = document.createElement('option'); o2.value = ''; o2.textContent = T('Abra o Spotify em algum aparelho', 'Open Spotify on some device'); sel.appendChild(o2); } }).catch(spotifyErro);
      Spotify.playlists().then(function (ps) { var d = $('spPlaylists'); while (d.firstChild) d.removeChild(d.firstChild); ps.forEach(function (p) { var b = document.createElement('button'); b.type = 'button'; b.className = 'sec'; b.textContent = '📜 ' + p.nome; b.onclick = function () { Spotify.tocar(p.uri, $('spAparelho').value).then(function () { setTimeout(spotifyTocando, 1200); }).catch(spotifyErro); }; d.appendChild(b); }); }).catch(spotifyErro);
      spotifyTocando();
    }
    function spotifyTocando() {
      Spotify.tocando().then(function (t) { var txt = t ? (t.tocando ? '🎵 ' : '⏸ ') + t.nome + ' — ' + t.artista : T('Nada tocando', 'Nothing playing'); $('spTocando').textContent = txt; comando({ acao: 'musica', texto: t ? t.nome + ' — ' + t.artista : '' }); }).catch(spotifyErro);
    }
    function spotifyErro(e) { var m = (e && e.message) || ''; status(m === 'premium' ? T('O Spotify só deixa controlar com conta Premium.', 'Spotify only allows remote control with a Premium account.') : m === 'não entrou' ? T('Entre no Spotify de novo.', 'Sign in to Spotify again.') : T('Spotify: ', 'Spotify: ') + m, 'erro'); if (m === 'não entrou') spotifyUI(); }
    $('btBatida').onclick = alternarBatida;
    $('btSpotify').onclick = function () { $('btSpotify').disabled = true; Spotify.entrar().then(spotifyUI).catch(spotifyErro).then(function () { $('btSpotify').disabled = false; }); };
    $('btSpotifySair').onclick = function () { Spotify.sair(); spotifyUI(); };
    $('spPausa').onclick = function () { Spotify.tocando().then(function (t) { return t && t.tocando ? Spotify.pausar() : Spotify.tocar(null, $('spAparelho').value); }).then(function () { setTimeout(spotifyTocando, 800); }).catch(spotifyErro); };
    $('spProxima').onclick = function () { Spotify.proxima().then(function () { setTimeout(spotifyTocando, 800); }).catch(spotifyErro); };
    $('spAnterior').onclick = function () { Spotify.anterior().then(function () { setTimeout(spotifyTocando, 800); }).catch(spotifyErro); };
    Spotify.aoCarregar().then(function () { spotifyUI(); });

    function sair() {
      clearInterval(cel.timer); if (cel.calib) cel.calib.parar(); cel.calib = null;
      if (cel.batida) alternarBatida();
      if (cel.sala) cel.sala.sair(); cel.sala = null; cel.visao = null;
      $('btEntrar').disabled = false; tela('entrar');
    }

    /* ---- botões ---- */
    $('btEntrar').onclick = entrar;
    $('codigo').addEventListener('keydown', function (e) { if (e.key === 'Enter') entrar(); });
    $('btComecar').onclick = function () { comando({ acao: 'comecar' }); };
    $('btPausa').onclick = function () { comando({ acao: 'pausar' }); };
    $('btParar').onclick = function () { comando({ acao: 'parar' }); };
    $('btCalibrar').onclick = function () { comando({ acao: 'calibrar' }); };
    $('btPularCal').onclick = function () { if (cel.calib) cel.calib.pular(); };
    $('btCamera').onclick = $('btCameraTopo').onclick = function () { if (cel.sala) cel.sala.trocarCamera().then(function () { cel.visao && cel.visao.zerar(); }).catch(function () {}); };
    $('btSair').onclick = sair;
    $('btTocarLink').onclick = function () { tocarLink(); };
    $('link').addEventListener('keydown', function (e) { if (e.key === 'Enter') tocarLink(); });
    $('btBuscar').onclick = function () { window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(T('música animada para crianças dançar', 'kids dance songs')), '_blank', 'noopener'); };
    $('btPlayPausa').onclick = function () { comando({ acao: 'pausa' }); };
    $('btReiniciar').onclick = function () { comando({ acao: 'reiniciar' }); };
    $('btProxima').onclick = function () { comando({ acao: 'proxima' }); };
    $('btAnterior').onclick = function () { comando({ acao: 'anterior' }); };
    document.querySelectorAll('.grupo').forEach(function (g) {
      var k = g.getAttribute('data-cfg'), multi = g.classList.contains('multi');
      g.querySelectorAll('button').forEach(function (b) {
        b.onclick = function () {
          if (multi) { b.classList.toggle('ativo'); var t = {}; g.querySelectorAll('button').forEach(function (x) { t[x.getAttribute('data-v')] = x.classList.contains('ativo'); }); cel.cfg.turmas = t; }
          else { g.querySelectorAll('button').forEach(function (x) { x.classList.remove('ativo'); }); b.classList.add('ativo'); var v = b.getAttribute('data-v'); cel.cfg[k] = isNaN(+v) ? v : +v; }
          $('linhaCelulares').style.display = cel.cfg.jogadores === 2 && !cel.local ? '' : 'none';
          $('linhaCena').style.display = cel.cfg.ambiente === 'paisagem' ? '' : 'none';
          mandarConfig();
        };
      });
    });
    $('linhaCelulares').style.display = 'none';
    try { if (localStorage.getItem('bagunca:esqueleto') === '1') setTimeout(function () { if (!cel.esqueleto) { Esqueleto.carregar().then(function () { cel.esqueleto = true; $('btEsqueleto').classList.add('ativo'); if (cel.local) TVApp.tv.esqueletoLigado = true; }).catch(function () {}); } }, 1500); } catch (e) {}
    desenharHist();
    return { entrar: entrar, sair: sair, trocarCameraLocal: trocarCameraLocal, cel: cel };
  })();

  /* ---------- papel ---------- */
  $('btTV').onclick = function () { TVApp.iniciar({ gesto: true }); };
  $('btCel').onclick = function () { CelApp.cel.local = false; CelApp.cel.toque = false; $('codigo').style.display = ''; $('lblCodigo').style.display = ''; $('btEntrar').textContent = T('Entrar e ligar a câmera', 'Join and start the camera'); tela('entrar'); try { $('nome').value = localStorage.getItem('bagunca:nome') || ''; $('codigo').value = localStorage.getItem('bagunca:codigo') || ''; } catch (e) {} ($('nome').value ? $('codigo') : $('nome')).focus(); };
  $('btToque').onclick = function () { CelApp.cel.local = true; CelApp.cel.toque = true; tela('entrar'); $('codigo').style.display = 'none'; $('lblCodigo').style.display = 'none'; $('btEntrar').textContent = T('Começar', 'Start'); try { $('nome').value = localStorage.getItem('bagunca:nome') || ''; } catch (e) {} $('nome').focus(); };
  $('btSolo').onclick = function () { CelApp.cel.toque = false; CelApp.cel.local = true; tela('entrar'); $('codigo').style.display = 'none'; $('lblCodigo').style.display = 'none'; $('btEntrar').textContent = T('Começar', 'Start'); try { $('nome').value = localStorage.getItem('bagunca:nome') || ''; } catch (e) {} $('nome').focus(); };
  $('tvSair').onclick = function () { TVApp.sairLocal(); if (CelApp.cel.streamLocal) CelApp.cel.streamLocal.getTracks().forEach(function (t) { t.stop(); }); tela('inicio'); };
  if (/[?&]tv=auto\b/.test(location.search)) TVApp.iniciar({ gesto: false });   // casca da LG: já entra como TV
  else if (/[?&]tv\b/.test(location.search)) $('btTV').focus();
  if (TESTE) { window.BaguncaApp = { TVApp: TVApp, CelApp: CelApp, Bagunca: Bagunca, Figuras: Figuras }; }
})();
