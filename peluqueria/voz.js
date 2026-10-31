/* Peluqueria — voz (speechSynthesis), a partir da voz da Bagunçolândia, nas regras de voz da SolverONE:
   lang pt-BR/en-US conforme a língua do jogo; nunca nome de voz fixo (prefere pt-BR, depois qualquer pt);
   cancel() antes de falar com 60 ms de espera; uma frase por vez; vigia de tempo para não travar.
   Sem speechSynthesis o jogo segue só com a legenda grande (nunca dá erro). */
(function (root) {
  'use strict';
  var S = root.speechSynthesis, vozes = [], vigia = 0, falando = null;
  function en() { return !!(root.PeluqueriaApp && root.PeluqueriaApp.lingua === 'en'); }
  function carregarVozes() { if (!S) return; try { vozes = S.getVoices() || []; } catch (e) { vozes = []; } }
  function escolher() {
    var alvo = en() ? /^en/i : /^(pt|por)/i;
    var lista = vozes.filter(function (v) { return alvo.test((v.lang || '').replace('_', '-')); });
    var br = lista.filter(function (v) { return /^pt[-_]?br/i.test(v.lang || '') || /brazil|brasil/i.test(v.name || ''); });
    return br[0] || lista[0] || null;
  }
  if (S) { carregarVozes(); try { S.addEventListener('voiceschanged', carregarVozes); } catch (e) {} }
  var api = { ultimo: '' };
  api.falar = function (pt, eng) {
    var texto = en() ? (eng || pt) : pt;
    api.ultimo = texto;
    if (!S || typeof root.SpeechSynthesisUtterance !== 'function' || !texto) return false;
    try { S.cancel(); } catch (e) {}
    clearTimeout(vigia);
    setTimeout(function () {
      try {
        var u = new SpeechSynthesisUtterance(texto), v = escolher();
        u.lang = en() ? 'en-US' : 'pt-BR'; if (v) u.voice = v;
        u.rate = 1.05; u.pitch = 1.15; u.volume = 1;
        u.onend = u.onerror = function () { falando = null; clearTimeout(vigia); };
        falando = u; S.speak(u);
        vigia = setTimeout(function () { try { S.cancel(); } catch (e) {} falando = null; }, 1500 + texto.length * 90);
      } catch (e) { falando = null; }
    }, 60);
    return true;
  };
  // o Chrome do Android para a fala em ~15 s: resume() de tempos em tempos enquanto fala
  setInterval(function () { try { if (S && falando && S.paused) S.resume(); } catch (e) {} }, 9000);
  root.PeluqueriaVoz = api;
})(typeof self !== 'undefined' ? self : this);
