/* Peluqueria — esqueleto por IA (MediaPipe Pose Landmarker "lite"), REAPROVEITADO da Bagunçolândia
   (../baguncolandia/libs/mediapipe/, para não guardar os ~20 MB duas vezes no repositório).
   Só carrega quando a pessoa liga (≈ 20 MB uma vez; o service worker guarda). Roda no celular (ou no
   próprio aparelho no modo "só o celular"), de 10 a 15× por segundo, e devolve o esqueleto compacto que o
   motor entende: 13 pontos [x, y] normalizados e JÁ ESPELHADOS (como a TV mostra), até 2 pessoas.
   Esqueleto.carregar({ aoProgresso }) → Promise; Esqueleto.detectar(video, ts) → [[13 pontos], ...] | null */
(function (root) {
  'use strict';
  var BASE = '../baguncolandia/libs/mediapipe/';
  var IDX = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];   // nariz, ombros, cotovelos, pulsos, quadris, joelhos, tornozelos
  var landmarker = null, carregando = null, ultimoTs = -1;
  function tamanhoMB() { return 20; }
  function carregar(opts) {
    opts = opts || {};
    if (landmarker) return Promise.resolve(landmarker);
    if (carregando) return carregando;
    carregando = import(BASE + 'vision_bundle.mjs').then(function (mod) {
      opts.aoProgresso && opts.aoProgresso(0.2);
      return mod.FilesetResolver.forVisionTasks(BASE).then(function (fs) {
        opts.aoProgresso && opts.aoProgresso(0.6);
        return mod.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: BASE + 'pose_landmarker_lite.task', delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })
          .catch(function () { return mod.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: BASE + 'pose_landmarker_lite.task', delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 2 }); });
      });
    }).then(function (lm) { landmarker = lm; opts.aoProgresso && opts.aoProgresso(1); return lm; }).catch(function (e) { carregando = null; throw e; });
    return carregando;
  }
  function detectar(video, ts) {
    if (!landmarker || !video.videoWidth) return null;
    if (ts <= ultimoTs) ts = ultimoTs + 1; ultimoTs = ts;
    var r; try { r = landmarker.detectForVideo(video, ts); } catch (e) { return null; }
    if (!r || !r.landmarks || !r.landmarks.length) return [];
    return r.landmarks.slice(0, 2).map(function (lm) {
      return IDX.map(function (i) { var p = lm[i] || { x: 0.5, y: 0.5, visibility: 0 }; return [+(1 - p.x).toFixed(3), +p.y.toFixed(3), +(p.visibility != null ? p.visibility : 1).toFixed(2)]; });   // 3º valor: visibilidade (o gesto ignora ponta inventada)
    }).sort(function (a, b) { return a[7][0] - b[7][0]; });   // da esquerda para a direita da TV (pelo quadril)
  }
  function pronto() { return !!landmarker; }
  function fechar() { try { landmarker && landmarker.close(); } catch (e) {} landmarker = null; carregando = null; }
  root.PeluqueriaEsqueleto = { carregar: carregar, detectar: detectar, pronto: pronto, fechar: fechar, tamanhoMB: tamanhoMB };
})(typeof self !== 'undefined' ? self : this);
