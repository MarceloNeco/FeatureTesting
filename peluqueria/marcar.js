/* Peluqueria — página marcar.html: a pessoa abre uma foto DO PRÓPRIO APARELHO (URL.createObjectURL, nada é
   enviado nem salvo), arrasta um quadrado onde o item deve parar e copia a linha pronta para meus/*.json.
   Modo Item: um toque marca o ponto de encaixe do desenho. A linha sempre passa na validação do jogo. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var P = window.Peluqueria;
  var lingua = /^en/i.test(navigator.language || '') ? 'en' : 'pt';
  function T(pt, en) { return lingua === 'en' ? en : pt; }
  function traduzir() {
    document.documentElement.lang = lingua === 'en' ? 'en' : 'pt-BR';
    document.querySelectorAll('[data-t]').forEach(function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = T(p[0], p[1] || p[0]); });
    $('btLingua').textContent = lingua === 'en' ? 'PT' : 'EN';
  }
  $('btLingua').addEventListener('click', function () { lingua = lingua === 'en' ? 'pt' : 'en'; traduzir(); mostrar(); });

  var est = { modo: 'cenario', lugar: 'cabeca', nome: '', id: '', arquivo: '', lugares: {}, encaixe: null, url: '' };
  var r3 = function (v) { return Math.round(v * 1000) / 1000; };
  var limita = function (v) { return Math.max(0, Math.min(1, v)); };

  function simples(nomeArquivo) {
    var semExt = nomeArquivo.replace(/\.[^.]*$/, '');
    var id = semExt.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30).replace(/-+$/, '');
    var ext = ((nomeArquivo.match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
    return { id: id || 'foto', ext: /^(png|jpe?g|webp|svg)$/.test(ext) ? ext : '', nome: semExt.slice(0, 30) || 'Foto' };
  }

  $('foto').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return;
    var s = simples(f.name);
    est.id = s.id; est.nome = s.nome; est.arquivo = s.id + '.' + (s.ext || 'png'); est.lugares = {}; est.encaixe = null;
    $('aviso').hidden = !!s.ext;
    $('aviso').textContent = T('Use foto PNG, JPG, WEBP ou SVG.', 'Use a PNG, JPG, WEBP or SVG picture.');
    if (est.url) URL.revokeObjectURL(est.url);
    est.url = URL.createObjectURL(f);
    $('imagem').src = est.url;
    $('quadro').hidden = true; $('ponto').hidden = true;
  });
  $('imagem').addEventListener('load', mostrar);

  function marcarModo(m) {
    est.modo = m;
    $('modoCenario').classList.toggle('marcado', m === 'cenario'); $('modoCenario').setAttribute('aria-pressed', String(m === 'cenario'));
    $('modoItem').classList.toggle('marcado', m === 'item'); $('modoItem').setAttribute('aria-pressed', String(m === 'item'));
    $('dicaModo').setAttribute('data-t', m === 'cenario'
      ? '2. Escolha o tipo de lugar e arraste um quadrado sobre a foto: o centro é onde o item para; a largura é o tamanho dele.|2. Pick the kind of spot and drag a box over the picture: the center is where the item stops; the width is its size.'
      : '2. Escolha onde o item vai (cabeça, olhos, nariz, boca) e toque no ponto do desenho que deve cair no lugar (ex.: a base da coroa).|2. Pick where the item goes (head, eyes, nose, mouth) and tap the point of the drawing that must land on the spot (e.g. the base of the crown).');
    $('giro').parentNode.hidden = m === 'item';
    $('quadro').hidden = true; $('ponto').hidden = true;
    traduzir(); mostrar();
  }
  $('modoCenario').addEventListener('click', function () { marcarModo('cenario'); });
  $('modoItem').addEventListener('click', function () { marcarModo('item'); });
  document.querySelectorAll('[data-lugar]').forEach(function (b) {
    b.addEventListener('click', function () {
      est.lugar = b.getAttribute('data-lugar');
      document.querySelectorAll('[data-lugar]').forEach(function (o) { o.classList.toggle('marcado', o === b); });
      mostrar();
    });
  });
  $('giro').addEventListener('input', function () {
    $('giroValor').textContent = this.value + '°';
    if (est.lugares[est.lugar]) { est.lugares[est.lugar].rot = +this.value; mostrar(); }
  });

  /* arrastar sobre a foto */
  function frac(ev) {
    var b = $('imagem').getBoundingClientRect();
    return { x: limita((ev.clientX - b.left) / b.width), y: limita((ev.clientY - b.top) / b.height), b: b };
  }
  var inicio = null;
  $('area').addEventListener('pointerdown', function (ev) {
    if (!$('imagem').naturalWidth) return;
    ev.preventDefault();
    if (est.modo === 'item') { var p = frac(ev); est.encaixe = { x: r3(p.x), y: r3(p.y) }; mostrar(); return; }
    inicio = frac(ev);
    try { this.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  $('area').addEventListener('pointermove', function (ev) {
    if (!inicio) return;
    var p = frac(ev), x1 = Math.min(inicio.x, p.x), x2 = Math.max(inicio.x, p.x), y1 = Math.min(inicio.y, p.y), y2 = Math.max(inicio.y, p.y);
    if (x2 - x1 < 0.03) return;
    est.lugares[est.lugar] = { x: r3((x1 + x2) / 2), y: r3((y1 + y2) / 2), tam: r3(Math.min(1, x2 - x1)), rot: +$('giro').value };
    mostrar();
  });
  function soltar() { inicio = null; }
  $('area').addEventListener('pointerup', soltar);
  $('area').addEventListener('pointercancel', soltar);

  function entrada() {
    var im = $('imagem');
    if (est.modo === 'item') {
      if (!est.encaixe) return null;
      return { id: est.id, nome: est.nome, arquivo: est.arquivo, lugar: est.lugar, encaixe: est.encaixe };
    }
    if (!Object.keys(est.lugares).length) return null;
    return { id: est.id, nome: est.nome, arquivo: est.arquivo, largura: im.naturalWidth, altura: im.naturalHeight, lugares: est.lugares };
  }

  function mostrar() {
    var im = $('imagem'), L = est.lugares[est.lugar];
    if (est.modo === 'cenario' && L && im.naturalWidth) {
      var q = $('quadro'), h = L.tam * im.clientWidth;
      q.hidden = false;
      q.style.width = h + 'px'; q.style.height = h + 'px';
      q.style.left = (L.x * im.clientWidth - h / 2) + 'px'; q.style.top = (L.y * im.clientHeight - h / 2) + 'px';
      q.style.transform = 'rotate(' + (L.rot || 0) + 'deg)';
    } else $('quadro').hidden = true;
    if (est.modo === 'item' && est.encaixe) {
      $('ponto').hidden = false;
      $('ponto').style.left = (est.encaixe.x * im.clientWidth) + 'px'; $('ponto').style.top = (est.encaixe.y * im.clientHeight) + 'px';
    } else $('ponto').hidden = true;
    var e = entrada(), ok = e && (est.modo === 'item' ? P.validarItem(e) : P.validarCenario(e));
    $('linha').textContent = e ? JSON.stringify(e) : T('(a linha aparece aqui)', '(the line shows up here)');
    $('copiar').disabled = !ok;
  }

  $('copiar').addEventListener('click', function () {
    var t = $('linha').textContent;
    var feito = function () { $('copiado').hidden = false; setTimeout(function () { $('copiado').hidden = true; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(feito).catch(function () {});
  });

  traduzir(); mostrar();
})();
