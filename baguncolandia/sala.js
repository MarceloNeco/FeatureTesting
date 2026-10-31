/* Bagunçolândia — a "sala": como a TV e os celulares se encontram e conversam.
   Copiado do Dança na Sala 0.9.0 (FeatureTesting) e endurecido:
   - canal de pareamento: Supabase Realtime (broadcast) com a chave publishable, pública por desenho;
     só mensagens pequenas (join/offer/answer/ice/estado); nenhum vídeo passa pelo servidor;
   - vídeo e dados de jogo: WebRTC ponto a ponto (Wi-Fi de casa), canal de dados 'jogo' nos dois sentidos;
   - toda mensagem que chega passa por Bagunca.validar(); nome e textos nunca viram HTML;
   - a TV só aceita celular novo quando aceitaNovos() diz sim (lobby), no máximo 4 por sala.
   Visão (no celular): diferença entre quadros pequenos, sem IA — Visao.criar(video). */
(function (root) {
  'use strict';
  var SUPABASE_URL = 'https://qvdvkqydhnadhewcidia.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_oRJmeUwlBbOP_HoOXf0xLw_4O8v43EA';
  var ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
  var MAX_JOGADORES = 4;
  var V = root.Bagunca.validar;

  function idNovo() { return Math.random().toString(36).slice(2, 10); }
  function codigoNovo() { var L = 'ABCDEFGHJKLMNPRSTUVWXYZ', c = ''; for (var i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)]; return c; }

  /* ---------- canal de pareamento ---------- */
  var sb = null;
  function abrirCanal(codigo, aoReceber) {
    if (!root.supabase) return Promise.reject(new Error('supabase-js não carregou'));
    if (!sb) sb = root.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 20 } }, auth: { persistSession: false, autoRefreshToken: false } });
    return new Promise(function (ok, falha) {
      var pronto = false, canal = sb.channel('bagunca-' + codigo, { config: { broadcast: { self: false } } });
      canal.on('broadcast', { event: 'm' }, function (x) { var m = V(x.payload); if (m) { try { aoReceber(m); } catch (e) { console.warn(e); } } });
      canal.subscribe(function (st) {
        if (st === 'SUBSCRIBED' && !pronto) { pronto = true; ok(canal); }
        else if ((st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') && !pronto) { pronto = true; falha(new Error(st)); }
      });
    });
  }
  function mandar(canal, m) { if (canal) { try { canal.send({ type: 'broadcast', event: 'm', payload: m }); } catch (e) {} } }
  function fecharCanal(canal) { try { if (canal && sb) sb.removeChannel(canal); } catch (e) {} }

  /* =====================================================================
     TV
     ===================================================================== */
  function tv(opts) {
    var codigo = opts.codigo || codigoNovo(), canal = null, pcs = {}, dcs = {}, jog = {};
    function receber(m) {
      if (m.t === 'join') { if (!jog[m.id] && !opts.aceitaNovos()) return; mandar(canal, { t: 'tv' }); return; }
      if (m.t === 'offer') { novoJogador(m); return; }
      if (m.t === 'ice' && m.to === 'tv' && pcs[m.id]) { try { pcs[m.id].addIceCandidate(m.c).catch(function () {}); } catch (e) {} return; }
      if (m.t === 'energia' && jog[m.id]) { opts.aoDados(m.id, { e: m.e, p: m.p }); return; }
      if (m.t === 'sair' && jog[m.id]) { remover(m.id); return; }
      if (m.t === 'cmd') { if (m.id && jog[m.id]) opts.aoComando && opts.aoComando(m); return; }   // comando só de celular conhecido
    }
    function novoJogador(m) {
      var conhecido = !!jog[m.id];
      if (!conhecido && !opts.aceitaNovos()) return;                                   // rodada em andamento: ninguém novo entra
      if (!conhecido && Object.keys(jog).length >= MAX_JOGADORES) return;
      // o mesmo nome entrando de novo (recarregou a página) substitui o antigo
      Object.keys(jog).forEach(function (k) { if (k !== m.id && jog[k].nome === m.nome) remover(k); });
      if (pcs[m.id]) { try { pcs[m.id].close(); } catch (e) {} }
      var pc = new RTCPeerConnection(ICE); pcs[m.id] = pc;
      var video = jog[m.id] ? jog[m.id].video : document.createElement('video');
      video.autoplay = true; video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
      jog[m.id] = jog[m.id] || { id: m.id, nome: m.nome, video: video, ligado: false };
      jog[m.id].nome = m.nome;
      pc.ontrack = function (ev) { if (video.srcObject !== ev.streams[0]) { video.srcObject = ev.streams[0]; video.play().catch(function () {}); } };
      pc.ondatachannel = function (ev) {
        var dc = ev.channel; dcs[m.id] = dc;
        dc.onmessage = function (x) { var d; try { d = JSON.parse(x.data); } catch (e) { return; } d = V(Object.assign({ t: 'dados' }, d)); if (d && jog[m.id]) opts.aoDados(m.id, d); };
      };
      pc.onicecandidate = function (ev) { if (ev.candidate) mandar(canal, { t: 'ice', to: m.id, c: ev.candidate.toJSON() }); };
      pc.onconnectionstatechange = function () {
        var st = pc.connectionState;
        if (st === 'connected') { jog[m.id].ligado = true; clearTimeout(jog[m.id].somir); opts.aoConexao && opts.aoConexao(m.id, true); }
        if (st === 'failed' || st === 'disconnected' || st === 'closed') {
          jog[m.id].ligado = false; opts.aoConexao && opts.aoConexao(m.id, false);
          clearTimeout(jog[m.id].somir); jog[m.id].somir = setTimeout(function () { if (pcs[m.id] === pc && pc.connectionState !== 'connected') remover(m.id); }, 20000);
        }
      };
      pc.setRemoteDescription(m.sdp).then(function () { return pc.createAnswer(); })
        .then(function (a) { return pc.setLocalDescription(a).then(function () { mandar(canal, { t: 'answer', to: m.id, sdp: pc.localDescription.toJSON() }); }); })
        .catch(function (e) { console.warn('answer', e); });
      if (!conhecido) opts.aoJogador(jog[m.id]);
    }
    function remover(id) {
      try { pcs[id] && pcs[id].close(); } catch (e) {}
      delete pcs[id]; delete dcs[id];
      if (jog[id]) { clearTimeout(jog[id].somir); var j = jog[id]; delete jog[id]; opts.aoSair(j); }
    }
    function mandarPara(id, obj) { var dc = dcs[id]; if (dc && dc.readyState === 'open') { try { dc.send(JSON.stringify(obj)); return true; } catch (e) {} } return false; }
    function paraTodos(obj) { Object.keys(dcs).forEach(function (id) { mandarPara(id, obj); }); }
    var pronto = abrirCanal(codigo, receber).then(function (c) { canal = c; mandar(canal, { t: 'tv' }); });
    return {
      codigo: codigo, pronto: pronto,
      estado: function (obj) { mandar(canal, Object.assign({ t: 'estado' }, obj)); },   // para os celulares (também pelo canal, para quem ainda não tem o direto)
      mandarPara: mandarPara, paraTodos: paraTodos,
      jogadores: function () { return Object.keys(jog).map(function (k) { return jog[k]; }); },
      remover: remover,
      fechar: function () { Object.keys(jog).forEach(remover); fecharCanal(canal); canal = null; }
    };
  }

  /* =====================================================================
     CELULAR
     ===================================================================== */
  function celular(opts) {
    var id = (function () { try { var g = sessionStorage.getItem('bagunca:id'); if (g && /^[a-z0-9]{6,12}$/i.test(g)) return g; } catch (e) {} var n = idNovo(); try { sessionStorage.setItem('bagunca:id', n); } catch (e) {} return n; })(), nome = opts.nome, ultimoJoin = 0, codigo = opts.codigo, canal = null, pc = null, dc = null, tvViu = false, iceFila = [], stream = null, cams = [], camIdx = -1, frente = false, wake = null, fechado = false;
    var video = opts.video;
    function status(txt, tipo) { opts.aoStatus && opts.aoStatus(txt, tipo); }
    function receber(m) {
      if (m.t === 'tv') { tvViu = true; if (!pc || pc.connectionState === 'failed' || pc.connectionState === 'closed') oferecer(); return; }
      if (m.t === 'estado') { tvViu = true; opts.aoTV && opts.aoTV(m); return; }
      if (m.to !== id) return;
      if (m.t === 'answer' && pc) { pc.setRemoteDescription(m.sdp).then(function () { iceFila.forEach(function (c) { pc.addIceCandidate(c).catch(function () {}); }); iceFila = []; }).catch(function (e) { console.warn(e); }); return; }
      if (m.t === 'ice' && pc) { if (!pc.remoteDescription) { iceFila.push(m.c); return; } pc.addIceCandidate(m.c).catch(function () {}); return; }
    }
    function oferecer() {
      if (pc) { try { pc.close(); } catch (e) {} }
      pc = new RTCPeerConnection(ICE);
      stream.getVideoTracks().forEach(function (t) { pc.addTrack(t, stream); });
      try { dc = pc.createDataChannel('jogo', { ordered: false, maxRetransmits: 0 }); dc.onmessage = function (x) { var d; try { d = JSON.parse(x.data); } catch (e) { return; } d = V(d); if (d) opts.aoTV && opts.aoTV(d); }; } catch (e) { dc = null; }
      pc.onicecandidate = function (ev) { if (ev.candidate) mandar(canal, { t: 'ice', id: id, to: 'tv', c: ev.candidate.toJSON() }); };
      pc.onconnectionstatechange = function () {
        if (pc.connectionState === 'connected') { status(opts.T('Ao vivo na TV ✅', 'Live on the TV ✅'), 'ok'); opts.aoConectado && opts.aoConectado(); }
        else if (pc.connectionState === 'failed') { status(opts.T('Caiu. Tentando de novo…', 'Dropped. Retrying…'), 'erro'); setTimeout(function () { if (!fechado) mandar(canal, { t: 'join', id: id, nome: nome }); }, 2000); }
        else if (pc.connectionState === 'disconnected') status(opts.T('Reconectando…', 'Reconnecting…'));
      };
      pc.createOffer().then(function (o) { return pc.setLocalDescription(o); })
        .then(function () { mandar(canal, { t: 'offer', id: id, nome: nome, sdp: pc.localDescription.toJSON() }); status(opts.T('Conectando à TV…', 'Connecting to the TV…')); })
        .catch(function (e) { status(opts.T('Erro ao conectar: ', 'Connect error: ') + e.message, 'erro'); });
    }
    /* câmera: primeiro a traseira; o botão 🔄 passa por todas (grande-angular aparece como câmera própria) */
    function ligarCamera(deviceId) {
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      var v = { width: { ideal: 640 }, height: { ideal: 360 }, frameRate: { ideal: 24 } };
      if (deviceId) v.deviceId = { exact: deviceId }; else v.facingMode = 'environment';
      return navigator.mediaDevices.getUserMedia({ video: v, audio: false })
        .catch(function () { return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); })
        .then(function (s) {
          stream = s; video.srcObject = s;
          var track = s.getVideoTracks()[0], st = track.getSettings ? track.getSettings() : {};
          frente = st.facingMode === 'user' || /front|frontal|user/i.test(track.label || '');
          if (pc) { var sender = pc.getSenders().filter(function (x) { return x.track && x.track.kind === 'video'; })[0]; if (sender) sender.replaceTrack(track); }
          opts.aoCamera && opts.aoCamera({ frente: frente, track: track });
          if (!navigator.mediaDevices.enumerateDevices) return;
          return navigator.mediaDevices.enumerateDevices().then(function (ds) {
            cams = ds.filter(function (d) { return d.kind === 'videoinput'; });
            camIdx = Math.max(0, cams.map(function (d) { return d.deviceId; }).indexOf(st.deviceId));
            opts.aoCameras && opts.aoCameras(cams, camIdx);
          }).catch(function () {});
        });
    }
    function pedirWakeLock() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }).catch(function () {}); } catch (e) {} }
    function aoVoltar() {
      if (document.visibilityState !== 'visible' || fechado) return;
      pedirWakeLock();
      var tr = stream && stream.getVideoTracks()[0];
      if (!tr || tr.readyState === 'ended' || tr.muted) ligarCamera(cams[camIdx] && cams[camIdx].deviceId).then(function () { if (!pc || pc.connectionState !== 'connected') mandar(canal, { t: 'join', id: id, nome: nome }); }).catch(function () {});
    }
    document.addEventListener('visibilitychange', aoVoltar);
    var pronto = ligarCamera().then(function () { return abrirCanal(codigo, receber); }).then(function (c) {
      canal = c; mandar(canal, { t: 'join', id: id, nome: nome }); pedirWakeLock();
      setTimeout(function () { if (!tvViu && !fechado) status(opts.T('TV não encontrada. Confira o código e se a TV está nesta página.', 'TV not found. Check the code and that the TV is on this page.'), 'erro'); }, 7000);
    });
    function enviarDados(obj) {
      if (dc && dc.readyState === 'open') { try { dc.send(JSON.stringify(obj)); return true; } catch (e) {} }
      return false;
    }
    return {
      id: id, pronto: pronto,
      enviarDados: enviarDados,
      energia: function (e, p) { if (!enviarDados({ e: e, p: p })) mandar(canal, { t: 'energia', id: id, e: e, p: p.slice(0, 3) }); },
      comando: function (obj) { mandar(canal, Object.assign({ t: 'cmd', id: id }, obj)); },
      reentrar: function () { if (fechado || Date.now() - ultimoJoin < 5000) return; ultimoJoin = Date.now(); mandar(canal, { t: 'join', id: id, nome: nome }); },
      trocarCamera: function () { if (cams.length < 2) return Promise.resolve(); var i = (camIdx + 1) % cams.length; return ligarCamera(cams[i].deviceId); },
      cameras: function () { return { lista: cams, atual: camIdx }; },
      frente: function () { return frente; },
      stream: function () { return stream; },
      conectado: function () { return !!(pc && pc.connectionState === 'connected'); },
      sair: function () {
        fechado = true; mandar(canal, { t: 'sair', id: id });
        document.removeEventListener('visibilitychange', aoVoltar);
        try { pc && pc.close(); } catch (e) {}
        if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
        try { wake && wake.release(); } catch (e) {}
        fecharCanal(canal); canal = null; pc = null;
      }
    };
  }

  /* =====================================================================
     VISÃO (celular): quadros pequenos e diferença entre eles. Sem IA, leve.
     ===================================================================== */
  function criarVisao(video, w, h) {
    w = w || 48; h = h || 27;
    var cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true }), anterior = null, suave = 0, fundo = null;
    cv.width = w; cv.height = h;
    function quadro() { if (!video.videoWidth) return null; cx.drawImage(video, 0, 0, w, h); return cx.getImageData(0, 0, w, h).data; }
    /* silhueta: pixels que diferem do fundo gravado na calibração → caixa normalizada e ESPELHADA
       (x cresce para a direita da TV). faixa = [x0, x1] espelhada limita a procura (2 pessoas, 1 celular). */
    function silhueta(d, faixa) {
      if (!fundo || !d) return null;
      faixa = faixa || [0, 1];
      var minX = w, maxX = -1, minY = h, maxY = -1, n = 0, cols = new Array(w), rows = new Array(h), x, y;
      for (x = 0; x < w; x++) cols[x] = 0; for (y = 0; y < h; y++) rows[y] = 0;
      for (var i = 0, c = 0; i < d.length; i += 4, c++) {
        var df = Math.abs(d[i] - fundo[i]) + Math.abs(d[i + 1] - fundo[i + 1]) + Math.abs(d[i + 2] - fundo[i + 2]);
        if (df > 75) { x = c % w; var xe = 1 - (x + 0.5) / w; if (xe < faixa[0] || xe > faixa[1]) continue; y = (c / w) | 0; cols[x]++; rows[y]++; n++; }
      }
      if (n < w * h * (faixa[1] - faixa[0]) * 0.03) return null;
      for (x = 0; x < w; x++) if (cols[x] >= 2) { if (x < minX) minX = x; if (x > maxX) maxX = x; }
      for (y = 0; y < h; y++) if (rows[y] >= 2) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      if (maxX < 0 || maxY < 0) return null;
      var bw = (maxX - minX + 1) / w;
      return { x: +(1 - minX / w - bw).toFixed(3), y: +(minY / h).toFixed(3), w: +bw.toFixed(3), h: +((maxY - minY + 1) / h).toFixed(3) };
    }
    /* devolve energia 0..100 e até 6 pontos quentes [x, y, força], com x JÁ ESPELHADO (como a TV mostra) */
    function medir(espelhar) {
      var d = quadro(); if (!d) return null;
      var soma = 0, n = d.length / 4, quentes = [];
      if (anterior) {
        for (var i = 0, c = 0; i < d.length; i += 4, c++) {
          var df = Math.abs((d[i] + d[i + 1] + d[i + 2]) - (anterior[i] + anterior[i + 1] + anterior[i + 2]));
          soma += df;
          if (df > 60) quentes.push([c % w, (c / w) | 0, df]);
        }
      }
      anterior = new Uint8ClampedArray(d);
      quentes.sort(function (a, b) { return b[2] - a[2]; });
      var grupos = [];
      for (var q = 0; q < quentes.length && grupos.length < 6; q++) {
        var pt = quentes[q], perto = false;
        for (var g = 0; g < grupos.length; g++) { if (Math.abs(grupos[g][0] - pt[0]) < 5 && Math.abs(grupos[g][1] - pt[1]) < 5) { perto = true; break; } }
        if (!perto) grupos.push(pt);
      }
      var pontos = grupos.map(function (g) { var x = (g[0] + 0.5) / w; return [+((espelhar === false ? x : 1 - x)).toFixed(3), +((g[1] + 0.5) / h).toFixed(3), Math.min(100, Math.round(g[2] / 4))]; });
      var dif = soma / n / 3, e = Math.max(0, Math.min(100, (dif - 2) * 4));
      suave = suave * 0.6 + e * 0.4;
      return { e: Math.round(suave), p: pontos, bruto: d };
    }
    return { quadro: quadro, medir: medir, silhueta: silhueta, w: w, h: h, zerar: function () { anterior = null; suave = 0; },
      definirFundo: function (d) { fundo = d ? new Uint8ClampedArray(d) : null; }, temFundo: function () { return !!fundo; } };
  }

  root.Sala = { tv: tv, celular: celular, criarVisao: criarVisao, codigoNovo: codigoNovo, MAX_JOGADORES: MAX_JOGADORES };
})(typeof self !== 'undefined' ? self : this);
