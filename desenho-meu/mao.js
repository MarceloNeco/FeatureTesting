/* Desenho Meu — desenhar com a MÃO na frente da câmera.
   Mão aberta ✋ = mira (o pincel anda sem pintar); mão fechada ✊ = "pegou" e desenha.
   Duas partes:
   1. Regra pura (testada no Node): classificar(pontos) diz se a mão está aberta ou fechada, e o Rastreador
      suaviza a posição, só troca de estado depois de 2 quadros iguais (nada de piscar) e leva a área
      confortável da câmera (o meio) para a tela inteira.
   2. Câmera + MediaPipe Hand Landmarker (navegador): REAPROVEITA a biblioteca da Bagunçolândia
      (../baguncolandia/libs/mediapipe/) e o modelo hand_landmarker.task (7,8 MB) — só baixa quando a pessoa
      liga a mão; o service worker guarda. Tudo roda NO APARELHO: a imagem da câmera nunca sai dele.
   DesenhoMao.ligar(video, aoMudar) → Promise; aoMudar({ x, y, estado: 'aberta'|'fechada'|'nenhuma', pontos })
   DesenhoMao.desligar() */
(function (raiz, fabrica) {
  var api = fabrica(raiz);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.DesenhoMao = api;
})(typeof self !== 'undefined' ? self : this, function (raiz) {
  'use strict';
  var BASE = '../baguncolandia/libs/mediapipe/';
  var PONTAS = [8, 12, 16, 20], JUNTAS = [6, 10, 14, 18];   // pontas e juntas do meio de indicador, médio, anelar e mindinho
  var PALMA = [0, 5, 9, 13, 17];                             // pulso e base dos dedos: o centro não muda ao fechar a mão

  function d(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  /* quantos dos 4 dedos estão esticados: a ponta fica mais longe do pulso que a junta do meio */
  function dedosEsticados(p) {
    var n = 0;
    for (var i = 0; i < 4; i++) if (d(p[PONTAS[i]], p[0]) > d(p[JUNTAS[i]], p[0]) * 1.12) n++;
    return n;
  }
  /* aberta (3 ou 4 dedos esticados), fechada (0 ou 1) ou, no meio do caminho, continua como estava */
  function classificar(p, anterior) {
    if (!p || p.length < 21) return 'nenhuma';
    var n = dedosEsticados(p);
    if (n >= 3) return 'aberta';
    if (n <= 1) return 'fechada';
    return anterior === 'fechada' ? 'fechada' : 'aberta';
  }
  function centroPalma(p) {
    var x = 0, y = 0;
    PALMA.forEach(function (i) { x += p[i].x; y += p[i].y; });
    return { x: x / PALMA.length, y: y / PALMA.length };
  }

  /* Rastreador: recebe os 21 pontos da câmera (x, y de 0 a 1, NÃO espelhados) e devolve a mira na tela
     (0 a 1, espelhada como num espelho). A área confortável do braço (o meio da imagem) vira a tela toda. */
  function Rastreador(opcoes) {
    var o = opcoes || {};
    var zona = o.zona || { x0: 0.18, x1: 0.82, y0: 0.12, y1: 0.72 };
    var estado = 'nenhuma', candidato = null, repete = 0, sx = null, sy = null, semMao = 0;
    function prox(p) {
      if (!p) {
        if (++semMao >= 4) { estado = 'nenhuma'; candidato = null; repete = 0; sx = sy = null; }
        return { x: sx == null ? 0.5 : sx, y: sy == null ? 0.5 : sy, estado: estado };
      }
      semMao = 0;
      var c = centroPalma(p);
      var x = (1 - c.x - zona.x0) / (zona.x1 - zona.x0), y = (c.y - zona.y0) / (zona.y1 - zona.y0);
      x = Math.max(0, Math.min(1, x)); y = Math.max(0, Math.min(1, y));
      if (sx == null) { sx = x; sy = y; }
      else {
        // suave quando a mão está quase parada (tira a tremida), rápido quando ela anda (sem atraso)
        var v = Math.hypot(x - sx, y - sy), a = Math.max(0.25, Math.min(0.85, v * 12));
        sx += (x - sx) * a; sy += (y - sy) * a;
      }
      var e = classificar(p, estado);
      if (e === estado) { candidato = null; repete = 0; }
      else if (e === candidato) { if (++repete >= 2) { estado = e; candidato = null; repete = 0; } }
      else { candidato = e; repete = 1; if (estado === 'nenhuma') { estado = e; candidato = null; repete = 0; } }
      return { x: sx, y: sy, estado: estado };
    }
    return { prox: prox, estado: function () { return estado; } };
  }

  // ---------- câmera e MediaPipe (só no navegador) ----------
  var marcador = null, carregando = null, fluxo = null, rodando = false, ultimoTs = -1, rast = null;
  function carregar(aoProgresso) {
    if (marcador) return Promise.resolve(marcador);
    if (carregando) return carregando;
    carregando = import(BASE + 'vision_bundle.mjs').then(function (mod) {
      aoProgresso && aoProgresso(0.3);
      return mod.FilesetResolver.forVisionTasks(BASE).then(function (fs) {
        aoProgresso && aoProgresso(0.6);
        var op = { baseOptions: { modelAssetPath: BASE + 'hand_landmarker.task', delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 };
        return mod.HandLandmarker.createFromOptions(fs, op).catch(function () { op.baseOptions.delegate = 'CPU'; return mod.HandLandmarker.createFromOptions(fs, op); });
      });
    }).then(function (m) { marcador = m; aoProgresso && aoProgresso(1); return m; }).catch(function (e) { carregando = null; throw e; });
    return carregando;
  }
  function ligar(video, aoMudar, aoProgresso) {
    if (!raiz.navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('sem-camera'));
    rast = Rastreador();
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }).then(function (s) {
      fluxo = s; video.srcObject = s; video.muted = true; video.setAttribute('playsinline', '');
      var p = video.play(); if (p && p.catch) p.catch(function () {});
      return carregar(aoProgresso);
    }).then(function () {
      rodando = true;
      var ultimo = 0;
      function quadro(agora) {
        if (!rodando) return;
        raiz.requestAnimationFrame(quadro);
        if (agora - ultimo < 33 || !video.videoWidth) return;            // ~30 vezes por segundo basta
        ultimo = agora;
        var ts = Math.max(ultimoTs + 1, Math.round(agora)); ultimoTs = ts;
        var r = null; try { r = marcador.detectForVideo(video, ts); } catch (e) { return; }
        var pts = r && r.landmarks && r.landmarks[0] ? r.landmarks[0] : null;
        var m = rast.prox(pts); m.pontos = pts;
        try { aoMudar(m); } catch (e2) { if (raiz.console) console.warn(e2); }
      }
      raiz.requestAnimationFrame(quadro);
    }).catch(function (e) { desligar(); throw e; });
  }
  function desligar() {
    rodando = false;
    if (fluxo) { fluxo.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { /* ok */ } }); fluxo = null; }
  }
  /* desenha a "mãozinha de pontos" por cima da imagem da câmera (espelhada), para a criança ver que funcionou */
  var OSSOS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
  function desenharPontos(ctx, pts, w, h, estado) {
    ctx.clearRect(0, 0, w, h);
    if (!pts) return;
    ctx.lineWidth = 3; ctx.strokeStyle = estado === 'fechada' ? '#ff4fa3' : '#3ee8ff'; ctx.fillStyle = '#fff';
    ctx.beginPath();
    OSSOS.forEach(function (o) { var a = pts[o[0]], b = pts[o[1]]; ctx.moveTo((1 - a.x) * w, a.y * h); ctx.lineTo((1 - b.x) * w, b.y * h); });
    ctx.stroke();
    pts.forEach(function (p) { ctx.beginPath(); ctx.arc((1 - p.x) * w, p.y * h, 2.5, 0, 6.3); ctx.fill(); });
  }

  return { classificar: classificar, dedosEsticados: dedosEsticados, centroPalma: centroPalma, Rastreador: Rastreador, ligar: ligar, desligar: desligar, carregar: carregar, desenharPontos: desenharPontos, MB: 8 };
});
