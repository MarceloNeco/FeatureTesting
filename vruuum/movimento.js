/* Vruuum! — o celular como volante, pelo acelerômetro: inclinar para um lado vira o carro e um
   toquinho do celular para cima faz pular. Funciona com o celular deitado ou em pé, segurando
   na mão como um volante ou mais deitado no colo.
   Como: a gravidade (accelerationIncludingGravity) passada para o "jeito da tela" (pelo ângulo da
   tela); o lado da tela para onde a gravidade escorrega é a direção. No 3-2-1 o jogo grava como a
   pessoa está segurando (o "meio"), então qualquer jeito confortável vale. O pulo é um tranco
   forte no eixo de cima/baixo da tela (aceleração sem a gravidade).
   Puro: as contas rodam no Node (testes); o app só repassa os eventos devicemotion. */
(function (raiz) {
  'use strict';
  var ZONA_MORTA = 0.06;   // inclinação pequena (mão tremendo) não vira
  var CHEIO = 0.32;        // ~19° de inclinação = volante todo virado
  var TRANCO = 11;         // m/s² no eixo da tela para contar como "toquinho para cima"
  var ESPERA_PULO = 600;   // ms entre dois pulos pelo tranco

  // vetor do aparelho → vetor da tela (x = direita da tela, y = cima da tela, z = para fora da tela)
  function paraTela(ax, ay, az, angulo) {
    var a = ((angulo || 0) % 360 + 360) % 360;
    if (a === 90) return { x: -ay, y: ax, z: az };
    if (a === 180) return { x: -ax, y: -ay, z: az };
    if (a === 270) return { x: ay, y: -ax, z: az };
    return { x: ax, y: ay, z: az };
  }

  function criar() {
    var meio = 0, sinal = 1, soma = 0, somaSinal = 0, amostras = 0, calibrando = false, pronto = false;
    var lado = 0, alisado = 0, ultimoPulo = -1e9, puloPendente = false, temSensor = false, baixa = null;
    return {
      // durante o 3-2-1: grava o jeito de segurar
      calibrar: function () { calibrando = true; soma = 0; somaSinal = 0; amostras = 0; },
      fimCalibrar: function () {
        calibrando = false;
        if (amostras) { meio = soma / amostras; sinal = somaSinal >= 0 ? 1 : -1; pronto = true; }
      },
      // um evento devicemotion (ou números de teste): g = com gravidade, l = sem gravidade (pode faltar)
      ler: function (g, l, angulo, agora) {
        if (!g || g.x == null) return;
        temSensor = true;
        var t = paraTela(g.x, g.y, g.z, angulo), mag = Math.sqrt(t.x * t.x + t.y * t.y + t.z * t.z) || 9.8;
        var s = t.x / mag;
        if (calibrando) { soma += s; somaSinal += t.y + t.z; amostras++; }
        // alguns aparelhos (iPhone antigo) dão o vetor ao contrário: o sinal vem da calibração
        var d = -(s - meio) * sinal;
        alisado += (d - alisado) * 0.35;
        var m = Math.abs(alisado) < ZONA_MORTA ? 0 : (alisado - (alisado > 0 ? ZONA_MORTA : -ZONA_MORTA)) / (CHEIO - ZONA_MORTA);
        lado = pronto ? Math.max(-1, Math.min(1, m)) : 0;
        // tranco: aceleração sem gravidade; se o aparelho não dá, tira a gravidade com um filtro
        var lt;
        if (l && l.x != null) lt = paraTela(l.x, l.y, l.z, angulo);
        else {
          if (!baixa) baixa = { x: t.x, y: t.y, z: t.z };
          baixa.x += (t.x - baixa.x) * 0.1; baixa.y += (t.y - baixa.y) * 0.1; baixa.z += (t.z - baixa.z) * 0.1;
          lt = { x: t.x - baixa.x, y: t.y - baixa.y, z: t.z - baixa.z };
        }
        var forca = Math.max(Math.abs(lt.y), Math.abs(lt.z) * 0.8);
        if (pronto && forca > TRANCO && agora - ultimoPulo > ESPERA_PULO) { ultimoPulo = agora; puloPendente = true; }
      },
      direcao: function () { return lado; },
      pulou: function () { var p = puloPendente; puloPendente = false; return p; },
      temSensor: function () { return temSensor; },
      zerar: function () { lado = 0; alisado = 0; puloPendente = false; }
    };
  }

  var VruuumMovimento = { criar: criar, paraTela: paraTela, ZONA_MORTA: ZONA_MORTA, CHEIO: CHEIO, TRANCO: TRANCO };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumMovimento;
  else raiz.VruuumMovimento = VruuumMovimento;
})(this);
