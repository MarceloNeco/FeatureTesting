/* Bagunçolândia — batida da música da sala pelo microfone do celular (Spotify, rádio, caixinha…).
   Sem IA: energia do som por faixa de graves (Web Audio), detecção de "ataques" (subidas rápidas de
   energia) e BPM pela mediana dos intervalos entre ataques. O áudio nunca sai do celular.
   Microfone só por toque; Batida.iniciar({ aoBatida(), aoBpm(bpm) }) → { parar() }.
   A parte de cálculo (estimarBpm) é pura e testável no Node. */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Batida = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  /* ataques (ms) → bpm (60..200) ou 0 quando não dá para saber */
  function estimarBpm(ataques) {
    if (!ataques || ataques.length < 6) return 0;
    var iv = [];
    for (var i = 1; i < ataques.length; i++) { var d = ataques[i] - ataques[i - 1]; if (d >= 250 && d <= 1200) iv.push(d); }
    if (iv.length < 4) return 0;
    iv.sort(function (a, b) { return a - b; });
    var med = iv[Math.floor(iv.length / 2)];
    // intervalos de 2 ou 1/2 batida (muito comum): traz para a faixa 80..180
    var bpm = 60000 / med;
    while (bpm < 80) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    // confiança: pelo menos metade dos intervalos perto da mediana (ou do dobro/metade)
    var ok = iv.filter(function (d) { return [med, med * 2, med / 2].some(function (m) { return Math.abs(d - m) < m * 0.15; }); }).length;
    return ok / iv.length >= 0.5 ? Math.round(bpm) : 0;
  }

  function iniciar(opts) {
    opts = opts || {};
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC || !root.navigator || !navigator.mediaDevices) return Promise.reject(new Error('sem áudio'));
    var ctx, stream, timer = 0, ataques = [], media = 0, ultimoAtaque = 0, parado = false;
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false }).then(function (s) {
      stream = s; ctx = new AC();
      var fonte = ctx.createMediaStreamSource(s), filtro = ctx.createBiquadFilter(), an = ctx.createAnalyser();
      filtro.type = 'lowpass'; filtro.frequency.value = 180;   // só os graves (bumbo e baixo)
      an.fftSize = 1024; an.smoothingTimeConstant = 0;
      fonte.connect(filtro); filtro.connect(an);
      var buf = new Float32Array(an.fftSize), ultimoBpm = 0, ultimoEnvio = 0;
      timer = setInterval(function () {
        if (parado) return;
        an.getFloatTimeDomainData(buf);
        var e = 0; for (var i = 0; i < buf.length; i++) e += buf[i] * buf[i];
        e = Math.sqrt(e / buf.length);
        var agora = Date.now();
        media = media * 0.92 + e * 0.08;
        // ataque: energia bem acima da média recente e pelo menos 250 ms desde o último
        if (e > media * 1.6 && e > 0.01 && agora - ultimoAtaque > 250) {
          ultimoAtaque = agora; ataques.push(agora); if (ataques.length > 24) ataques.shift();
          opts.aoBatida && opts.aoBatida(e);
          var bpm = estimarBpm(ataques);
          if (bpm && (bpm !== ultimoBpm || agora - ultimoEnvio > 2000)) { ultimoBpm = bpm; ultimoEnvio = agora; opts.aoBpm && opts.aoBpm(bpm); }
        }
        opts.aoNivel && opts.aoNivel(Math.min(1, e * 8));
      }, 25);
      return { parar: function () { parado = true; clearInterval(timer); try { s.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} try { ctx.close(); } catch (e) {} } };
    });
  }
  return { iniciar: iniciar, estimarBpm: estimarBpm };
});
