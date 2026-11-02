/*
  Tela inteira — o mesmo arquivo para todos os jogos do Bolinho de Chuva (Purpurina, Vruuum!, Peluqueria,
  Bagunçolândia, Rabiscolândia, Dança na Sala). Cada jogo inclui, no index.html:
      <script src="../telacheia.js" data-fora-do-arquivo></script>
  e põe '../telacheia.js' na lista ARQUIVOS do sw.js (para abrir sem internet).

  Pedido do dono (02/Nov/2026, tablet Fire da filha): depois de travar e destravar o tablet, o navegador volta com a
  barra de endereço e ninguém sabe onde fica a tela cheia. Então:
  1. Botãozinho (ícone de quatro cantinhos): aparece só em tela de toque, fora do modo aplicativo e quando a tela NÃO está inteira — uma
     abinha no meio da borda esquerda (onde nenhum jogo tem botão). Na primeira vez vem escrito "Tela inteira" e
     depois encolhe para só o ícone. Um toque nele = tela inteira. Em tela inteira (jogando) ele some.
  2. Voltou sozinho: se a tela inteira acabou porque o aparelho travou ou o app ficou escondido (não foi a pessoa
     que saiu), o primeiro toque ao voltar já pede a tela inteira de novo. Se foi a pessoa que saiu (Voltar,
     deslizar), não insiste: só o botão fica ali.
  Regras da diretriz: pedir quando o dedo sai da tela (pointerup/touchend/click); sem toque o navegador não deixa;
  iPhone não tem tela cheia de página (lá o botão nem aparece). Cada jogo continua pedindo a tela cheia no seu botão
  de começar, como antes.
*/
(function () {
  'use strict';
  var d = document, el = d.documentElement, mm = window.matchMedia;
  var temApi = !!(el.requestFullscreen || el.webkitRequestFullscreen);
  function toque() { return !!(mm && mm('(pointer: coarse)').matches); }
  function app() { return !!(mm && (mm('(display-mode: standalone)').matches || mm('(display-mode: fullscreen)').matches)); }
  function cheia() { return !!(d.fullscreenElement || d.webkitFullscreenElement); }
  if (!temApi || !mm) return;

  function pedir() {
    if (cheia()) return;
    try {
      var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* o navegador recusou: o botão continua ali */ }
  }

  // ---------- 2. voltou de travar / esconder: o próximo toque pede de novo ----------
  var rearmar = false, saiuEm = 0;
  function aoMudar() {
    if (cheia()) { rearmar = false; atualizar(); return; }
    saiuEm = Date.now();
    if (d.hidden) rearmar = true;   // saiu porque o app ficou escondido (travou, trocou de app)
    atualizar();
  }
  d.addEventListener('fullscreenchange', aoMudar);
  d.addEventListener('webkitfullscreenchange', aoMudar);
  d.addEventListener('visibilitychange', function () {
    // alguns navegadores tiram a tela cheia um pouquinho antes de avisar que escondeu
    if (d.hidden && (cheia() || Date.now() - saiuEm < 1500)) rearmar = true;
    if (!d.hidden) atualizar();
  });
  function aoTocar() { if (rearmar && !d.hidden && !cheia() && toque() && !app()) { rearmar = false; pedir(); } }
  ['pointerup', 'touchend', 'click'].forEach(function (ev) { d.addEventListener(ev, aoTocar, true); });

  // ---------- 1. o botãozinho ----------
  var bt = null, encolher = 0, jaMostrou = false;
  function ingles() { return /^en/i.test(el.lang || ''); }
  function texto() { return ingles() ? 'Full screen' : 'Tela inteira'; }
  function criar() {
    if (bt || !d.body) return;
    var st = d.createElement('style');
    st.textContent = '.tela-inteira-bt{position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:2147483000;' +
      'display:flex;align-items:center;gap:6px;min-width:44px;min-height:44px;padding:0 12px 0 10px;border:2px solid rgba(255,255,255,.75);' +
      'border-left:0;border-radius:0 22px 22px 0;background:rgba(42,17,70,.82);color:#fff;font:700 15px/1 system-ui,sans-serif;' +
      'box-shadow:0 3px 12px rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '.tela-inteira-bt .i{flex:none}.tela-inteira-bt.pequeno .t{display:none}' +
      '.tela-inteira-bt[hidden]{display:none}' +
      '@media (prefers-reduced-motion:no-preference){.tela-inteira-bt{transition:padding .25s}}';
    d.head.appendChild(st);
    bt = d.createElement('button');
    bt.type = 'button'; bt.className = 'tela-inteira-bt'; bt.hidden = true;
    // ícone desenhado (quatro cantinhos): o símbolo ⛶ não existe nas fontes dos tablets Fire mais antigos
    bt.innerHTML = '<svg class="i" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6"/></svg><span class="t"></span>';
    // toque no botão: o pedido vai no click (quando o dedo sai), sem repassar o toque para o jogo
    bt.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    bt.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); rearmar = false; pedir(); });
    d.body.appendChild(bt);
  }
  function atualizar() {
    if (!d.body) return;
    var mostrar = toque() && !app() && !cheia();
    if (mostrar) criar();
    if (!bt) return;
    bt.querySelector('.t').textContent = texto();
    bt.setAttribute('aria-label', texto());
    bt.title = texto();
    if (mostrar && bt.hidden) {
      bt.hidden = false;
      // na primeira vez, com o nome escrito; depois de uns segundos, só o ícone
      clearTimeout(encolher);
      if (!jaMostrou) { jaMostrou = true; bt.classList.remove('pequeno'); encolher = setTimeout(function () { bt.classList.add('pequeno'); }, 5000); }
      else bt.classList.add('pequeno');
    } else if (!mostrar) bt.hidden = true;
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', atualizar); else atualizar();
  window.addEventListener('resize', atualizar);
  // o idioma pode mudar no jogo (EN/PT): o texto acompanha
  try { new MutationObserver(function () { if (bt) { bt.querySelector('.t').textContent = texto(); bt.setAttribute('aria-label', texto()); bt.title = texto(); } }).observe(el, { attributes: true, attributeFilter: ['lang'] }); } catch (e) { /* ok */ }

  window.SolverTelaInteira = { pedir: pedir, cheia: cheia, atualizar: atualizar };
})();
