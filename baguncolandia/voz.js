/* Bagunçolândia — voz (speechSynthesis) seguindo as regras de voz da SolverONE:
   só a partir de um toque; lang pt-BR/en-US; nunca nome de voz fixo (prefere pt-BR, depois qualquer pt);
   cancel() antes de falar com 60 ms de espera; uma frase por vez; vigia de tempo para não travar.
   A TV (navegador da LG) nem sempre tem voz: Voz.disponivel() diz; aí o celular fala. */
(function (root) {
  'use strict';
  var EN = /^en/i.test((root.navigator && root.navigator.language) || '');
  var S = root.speechSynthesis, vozes = [], escolhida = null, falando = null, vigia = 0, liberada = false;
  function carregarVozes() {
    if (!S) return;
    try { vozes = S.getVoices() || []; } catch (e) { vozes = []; }
    var alvo = EN ? /^en/i : /^(pt|por)/i;
    var lista = vozes.filter(function (v) { return alvo.test((v.lang || '').replace('_', '-')); });
    var br = lista.filter(function (v) { return /^pt[-_]?br/i.test(v.lang || '') || /brazil|brasil/i.test(v.name || ''); });
    escolhida = (br[0] || lista[0] || null);
  }
  if (S) { carregarVozes(); try { S.addEventListener('voiceschanged', carregarVozes); } catch (e) {} [100, 900, 3000].forEach(function (ms) { setTimeout(carregarVozes, ms); }); }
  function disponivel() { return !!(S && typeof root.SpeechSynthesisUtterance === 'function' && (vozes.length || !S.getVoices)); }
  /* chamar uma vez num toque: libera o áudio em navegadores que exigem gesto */
  function liberar() { liberada = true; if (S) { try { var u = new SpeechSynthesisUtterance(''); u.volume = 0; S.speak(u); } catch (e) {} } }
  function falar(pt, en, opts) {
    opts = opts || {};
    var texto = EN ? (en || pt) : pt;
    if (!disponivel() || !texto) return false;
    try { S.cancel(); } catch (e) {}
    clearTimeout(vigia);
    setTimeout(function () {
      try {
        var u = new SpeechSynthesisUtterance(texto);
        u.lang = EN ? 'en-US' : 'pt-BR';
        if (escolhida) u.voice = escolhida;
        u.rate = opts.rate || 1; u.pitch = opts.pitch || 1.05; u.volume = 1;
        u.onend = u.onerror = function () { falando = null; clearTimeout(vigia); opts.aoFim && opts.aoFim(); };
        falando = u; S.speak(u);
        vigia = setTimeout(function () { try { S.cancel(); } catch (e) {} falando = null; opts.aoFim && opts.aoFim(); }, 1500 + texto.length * 90);
      } catch (e) { falando = null; opts.aoFim && opts.aoFim(); }
    }, 60);
    return true;
  }
  function parar() { try { S && S.cancel(); } catch (e) {} falando = null; clearTimeout(vigia); }
  // o Chrome do Android para a fala em ~15 s: resume() de tempos em tempos enquanto fala
  setInterval(function () { try { if (S && falando && S.paused) S.resume(); } catch (e) {} }, 9000);
  root.Voz = { falar: falar, parar: parar, disponivel: disponivel, liberar: liberar, vozes: function () { return vozes; }, EN: EN };
})(typeof self !== 'undefined' ? self : this);
