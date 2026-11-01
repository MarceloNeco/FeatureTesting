/* Vruuum! — volante no ar: a câmera vê as mãos e elas viram o volante.
   - duas mãos: como segurar um volante. Mão direita mais baixa que a esquerda = vira para a direita
     (e o contrário, para a esquerda). Quanto mais inclinado, mais vira.
   - as duas mãos subindo rápido = pulo.  As duas mãos lá embaixo = freia.
   - uma mão só: vale a posição dela (mais para a direita, vira para a direita).
   - 2 jogadores: cada um usa as mãos na sua metade da imagem (esquerda = jogador 1).
   A parte de contas é pura (roda no Node, testes). A parte da câmera usa o MediaPipe Hand Landmarker,
   que roda no próprio aparelho (motor e modelo em ../baguncolandia/libs/mediapipe, os mesmos da
   Rabiscolândia). O vídeo NUNCA sai do aparelho: nada é gravado nem enviado. */
(function (raiz) {
  'use strict';
  var ZONA = 6 * Math.PI / 180, CHEIO = 34 * Math.PI / 180;   // até 6° não vira; 34° = volante todo
  var SUBIDA = 0.13, JANELA = 320, ESPERA = 750, EMBAIXO = 0.8;

  // um controle (um jogador). ler(maos, agora): maos = [{ x, y }] de 0 a 1 (x já espelhado, como num espelho)
  function criar() {
    var dir = 0, alisado = 0, freio = false, puloPendente = false, ultimoPulo = -1e9, hist = [], qtd = 0, angulo = 0;
    return {
      ler: function (maos, agora) {
        qtd = maos.length;
        var alvo = 0, ym = null;
        if (maos.length >= 2) {
          var m = maos.slice(0, 2).sort(function (a, b) { return a.x - b.x; }), e = m[0], d = m[1];
          angulo = Math.atan2(d.y - e.y, Math.max(0.05, d.x - e.x));
          var a = Math.abs(angulo) < ZONA ? 0 : (angulo - (angulo > 0 ? ZONA : -ZONA)) / (CHEIO - ZONA);
          alvo = Math.max(-1, Math.min(1, a));
          ym = (e.y + d.y) / 2;
          freio = e.y > EMBAIXO && d.y > EMBAIXO;
        } else if (maos.length === 1) {
          var dx = maos[0].x - 0.5; angulo = 0;
          alvo = Math.abs(dx) < 0.06 ? 0 : Math.max(-1, Math.min(1, (dx - (dx > 0 ? 0.06 : -0.06)) / 0.22));
          ym = maos[0].y; freio = false;
        } else { freio = false; angulo = 0; }
        alisado += (alvo - alisado) * 0.45;
        dir = Math.abs(alisado) < 0.02 ? 0 : alisado;
        // pulo: a altura média das mãos subiu rápido (y diminui para cima)
        if (ym !== null) {
          hist.push({ t: agora, y: ym });
          while (hist.length && agora - hist[0].t > JANELA) hist.shift();
          var maisBaixo = hist.reduce(function (mx, h) { return Math.max(mx, h.y); }, 0);
          if (maisBaixo - ym > SUBIDA && agora - ultimoPulo > ESPERA) { puloPendente = true; ultimoPulo = agora; hist = []; }
        } else hist = [];
      },
      direcao: function () { return dir; },
      freio: function () { return freio; },
      pulou: function () { var p = puloPendente; puloPendente = false; return p; },
      maos: function () { return qtd; },
      angulo: function () { return angulo; }
    };
  }
  // separa as mãos entre os jogadores: com 2, a metade esquerda da imagem é do jogador 1
  function separar(maos, n) {
    if (n < 2) return [maos];
    var a = [], b = [];
    maos.forEach(function (m) { if (m.x < 0.5) a.push({ x: m.x * 2, y: m.y }); else b.push({ x: (m.x - 0.5) * 2, y: m.y }); });
    return [a, b];
  }
  // centro da palma a partir dos 21 pontos do MediaPipe (pulso e base dos dedos), espelhado
  function palma(pts) {
    var ids = [0, 5, 9, 13, 17], x = 0, y = 0;
    ids.forEach(function (i) { x += pts[i].x; y += pts[i].y; });
    return { x: 1 - x / ids.length, y: y / ids.length };
  }

  // ---------- câmera (só no navegador) ----------
  var BASE = '../baguncolandia/libs/mediapipe/', detector = null, fluxo = null, video = null, rodando = false, ultimo = 0, aoLer = null, ultimasMaos = [];
  function prepararDetector() {
    if (detector) return Promise.resolve(detector);
    var base = new URL(BASE, raiz.location.href).href;
    return import(base + 'vision_bundle.mjs').then(function (mod) {
      return mod.FilesetResolver.forVisionTasks(base.replace(/\/$/, '')).then(function (fs) {
        var op = { baseOptions: { modelAssetPath: base + 'hand_landmarker.task', delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 4, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 };
        return mod.HandLandmarker.createFromOptions(fs, op).catch(function () { op.baseOptions.delegate = 'CPU'; return mod.HandLandmarker.createFromOptions(fs, op); });
      });
    }).then(function (d) { detector = d; return d; });
  }
  function laco() {
    if (!rodando) return;
    var agora = raiz.performance.now();
    if (agora - ultimo > 45 && video.readyState >= 2) {   // ~20 vezes por segundo
      ultimo = agora;
      try {
        var r = detector.detectForVideo(video, agora);
        ultimasMaos = (r.landmarks || []).map(palma);
        if (aoLer) aoLer(ultimasMaos, agora);
      } catch (e) { /* um quadro ruim: segue */ }
    }
    raiz.requestAnimationFrame(laco);
  }
  // liga a câmera da frente e o detector; aoLer(maos, agora) é chamado a cada leitura
  function iniciar(el, fn) {
    if (!raiz.navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('sem-camera'));
    video = el; aoLer = fn;
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }).then(function (s) {
      fluxo = s; video.srcObject = s; video.muted = true; video.setAttribute('playsinline', '');
      return video.play().catch(function () {});
    }).then(prepararDetector).then(function () { rodando = true; ultimo = 0; raiz.requestAnimationFrame(laco); });
  }
  function parar() {
    rodando = false; aoLer = null; ultimasMaos = [];
    if (fluxo) { fluxo.getTracks().forEach(function (t) { t.stop(); }); fluxo = null; }
    if (video) video.srcObject = null;
  }

  var VruuumMaos = { criar: criar, separar: separar, palma: palma, iniciar: iniciar, parar: parar, ultimas: function () { return ultimasMaos; }, ligado: function () { return rodando; } };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumMaos;
  else raiz.VruuumMaos = VruuumMaos;
})(this);
