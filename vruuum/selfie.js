/* Vruuum! — selfie no carrinho. A pessoa tira uma selfie (ou escolhe uma foto), o jogo acha o rosto
   SEM INTERNET (MediaPipe Face Detector, rodando no próprio aparelho: o motor fica em
   ../baguncolandia/libs/mediapipe e o modelo de rosto em rosto.tflite), mostra um círculo em volta
   do rosto que dá para arrastar e aumentar, recorta e guarda.
   PRIVACIDADE: a foto nunca sai do aparelho. Fica só no localStorage deste navegador (uma imagem
   pequena de 256×256), por jogador, e tem botão para apagar. Nada é enviado para lugar nenhum.
   Sem o detector (aparelho antigo, arquivo baixado), o círculo começa no meio e a pessoa ajusta. */
(function (raiz) {
  'use strict';
  var CHAVE = 'vruuum.foto.', TAM = 256, MEDIAPIPE = '../baguncolandia/libs/mediapipe';
  var memoria = {}, detector = null, carregando = null;

  function ler(k) { try { var v = localStorage.getItem(CHAVE + k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  // a foto do jogador k pronta para desenhar ({ img, cabelo, cabeloEscuro, pele }), ou null
  function carregar(k) {
    if (memoria[k] !== undefined) return memoria[k];
    var d = ler(k);
    if (!d || !d.dados) { memoria[k] = null; return null; }
    var img = new raiz.Image(); img.src = d.dados;
    memoria[k] = { img: img, cabelo: d.cabelo, cabeloEscuro: d.cabeloEscuro, pele: d.pele };
    return memoria[k];
  }
  function tem(k) { return !!carregar(k); }
  function apagar(k) { try { localStorage.removeItem(CHAVE + k); } catch (e) { /* ok */ } memoria[k] = null; }

  // cor média de um pedaço do recorte (cabelo em cima, pele no meio do rosto)
  function media(ctx, x, y, w, h, escurecer) {
    var d = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data, r = 0, g = 0, b = 0, n = 0;
    for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    if (!n) return '#8a5a2e';
    var f = escurecer ? 0.6 : 1;
    function h2(v) { var s = Math.max(0, Math.min(255, Math.round(v / n * f))).toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + h2(r) + h2(g) + h2(b);
  }
  function salvar(k, recorte) {   // recorte: canvas TAM×TAM com o rosto no meio
    var c = recorte.getContext('2d');
    var dados = { dados: recorte.toDataURL('image/jpeg', 0.86), cabelo: media(c, TAM * 0.3, TAM * 0.02, TAM * 0.4, TAM * 0.1), cabeloEscuro: media(c, TAM * 0.3, TAM * 0.02, TAM * 0.4, TAM * 0.1, true), pele: media(c, TAM * 0.38, TAM * 0.5, TAM * 0.24, TAM * 0.14) };
    try { localStorage.setItem(CHAVE + k, JSON.stringify(dados)); } catch (e) { return false; }
    memoria[k] = undefined;
    return true;
  }

  // ---------- detector de rosto (carrega só quando a pessoa tira a primeira selfie) ----------
  function prepararDetector() {
    if (detector) return Promise.resolve(detector);
    if (carregando) return carregando;
    if (raiz.JOGO_EM_ARQUIVO || !raiz.WebAssembly) return Promise.resolve(null);
    var base = new URL(MEDIAPIPE, raiz.location.href).href;
    carregando = import(base + '/vision_bundle.mjs').then(function (mp) {
      return mp.FilesetResolver.forVisionTasks(base).then(function (fs) {
        return mp.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: new URL('rosto.tflite', raiz.location.href).href, delegate: 'CPU' }, runningMode: 'IMAGE', minDetectionConfidence: 0.4 });
      });
    }).then(function (d) { detector = d; return d; }).catch(function () { carregando = null; return null; });
    return carregando;
  }
  // acha o rosto maior na imagem: { x, y, r } (centro e raio, em pixels da imagem) ou null
  function acharRosto(img) {
    return prepararDetector().then(function (d) {
      if (!d) return null;
      var r = d.detect(img), melhor = null;
      (r.detections || []).forEach(function (x) { var b = x.boundingBox; if (!melhor || b.width * b.height > melhor.width * melhor.height) melhor = b; });
      if (!melhor) return null;
      // o círculo pega o rosto todo, com cabelo e queixo
      return { x: melhor.originX + melhor.width / 2, y: melhor.originY + melhor.height * 0.42, r: Math.max(melhor.width, melhor.height) * 0.78 };
    }).catch(function () { return null; });
  }

  // recorta o círculo (em pixels da imagem) num quadrado TAM×TAM
  function recortar(img, roda) {
    var cv = raiz.document.createElement('canvas'); cv.width = cv.height = TAM;
    var c = cv.getContext('2d'); c.fillStyle = '#ffffff'; c.fillRect(0, 0, TAM, TAM);
    c.drawImage(img, roda.x - roda.r, roda.y - roda.r, roda.r * 2, roda.r * 2, 0, 0, TAM, TAM);
    return cv;
  }

  var VruuumSelfie = { carregar: carregar, tem: tem, apagar: apagar, salvar: salvar, acharRosto: acharRosto, prepararDetector: prepararDetector, recortar: recortar, TAM: TAM };
  raiz.VruuumSelfie = VruuumSelfie;
})(this);
