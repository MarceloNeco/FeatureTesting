/* Rabiscolândia — o PASSO A PASSO (tour) com o Rabisquinho 🖍️.
   Pedido do dono (02/Nov/2026): "um wizard para ensinar todas as funções com balões que vão nas opções, animados,
   que dá para ler, e com voz que lê o balãozinho".
   Como funciona: a tela escurece, o botão explicado fica iluminado (com um anel pulsando) e um balão de fala sai
   dele, pulando, com o Rabisquinho. O balão é lido em voz alta pela voz do próprio aparelho (Web Speech, sem
   internet e sem chave). Tocar em qualquer lugar ou em ▶ avança; ◀ volta; ✕ sai; 🔊 liga/desliga a voz.
   Teclado e controle da TV: → ou Enter avança, ← volta, Esc sai.
   Três passeios: 'livre' (desenhar), 'colorir' (livro de colorir) e 'numeros' (pintar por números).
   DesenhoTour.comecar(qual, { t, voz, aoMudarVoz, aoTerminar, antes })  ·  DesenhoTour.PASSOS (para o teste) */
(function (raiz) {
  'use strict';
  var EU = '🖍️';
  // alvo: seletor CSS (ou lista de seletores: o balão aponta para o conjunto). Sem alvo: balão no meio da tela.
  var COMUM_INICIO = [
    { pt: 'Oi! Eu sou o Rabisquinho! Vou te mostrar como brincar aqui. Toque na tela para continuar.', en: 'Hi! I am Scribbly! I will show you how to play here. Tap the screen to continue.' }
  ];
  var PASSOS = {
    livre: COMUM_INICIO.concat([
      { alvo: '#tela', pt: 'Esta é a sua folha. Desenhe com o dedo! Com dois dedos você chega perto ou se afasta.', en: 'This is your sheet. Draw with your finger! Use two fingers to zoom in or out.' },
      { alvo: '.ferramenta[data-f="pinceis"]', pt: 'Aqui fica o pincel. Toque de novo nele para ver todos, até os pincéis mágicos que se mexem sozinhos!', en: 'This is your brush. Tap it again to see them all, even magic brushes that move by themselves!' },
      { alvo: '.grossura', pt: 'Estes traços escolhem a grossura: do fininho ao bem grosso. É só tocar no que você quiser.', en: 'These lines choose the thickness: from very thin to very thick. Just tap the one you want.' },
      { alvo: '#cores .cor', pt: 'Toque numa bolinha para trocar a cor. O arco-íris no fim tem todas as cores do mundo!', en: 'Tap a dot to change the color. The rainbow at the end has every color in the world!' },
      { alvo: '.ferramenta[data-f="balde"]', pt: 'O balde de tinta pinta um pedaço inteiro de uma vez.', en: 'The paint bucket fills a whole area at once.' },
      { alvo: '.ferramenta[data-f="borracha"]', pt: 'A borracha apaga os traços, os adesivos e os desenhos que se mexem.', en: 'The eraser erases lines, stickers and moving drawings.' },
      { alvo: '.ferramenta[data-f="adesivo"]', pt: 'Adesivos! Muitos deles se mexem. Escolha um e toque na folha para colar.', en: 'Stickers! Many of them move. Pick one and tap the sheet to stick it.' },
      { alvo: '.ferramenta[data-f="mover"]', pt: 'Com a mãozinha você arrasta um adesivo para outro lugar.', en: 'With the little hand you drag a sticker somewhere else.' },
      { alvo: '.ferramenta[data-f="fundo"]', pt: 'Aqui você troca o fundo: praia, espaço, fundo do mar, ou até uma foto sua.', en: 'Here you change the background: beach, space, under the sea, or even your own photo.' },
      { alvo: '#btDesfazer', pt: 'Errou? Este botão desfaz o último traço.', en: 'Made a mistake? This button undoes the last stroke.' },
      { alvo: '#btMao', pt: 'Aqui você desenha com a mão na frente da câmera: mão aberta mira, mão fechada desenha!', en: 'Here you draw with your hand in front of the camera: open hand aims, closed hand draws!' },
      { alvo: '#btMusica2', pt: 'Aqui você escolhe as músicas, ou desliga a música.', en: 'Here you choose the songs, or turn the music off.' },
      { alvo: '#btFoto', pt: 'Tire uma foto do seu desenho para guardar ou mandar para alguém.', en: 'Take a photo of your drawing to keep it or send it to someone.' },
      { alvo: '#btLimpar', pt: 'Este começa tudo de novo. Não se preocupa: dá para desfazer.', en: 'This one starts over. Do not worry: you can undo it.' },
      { alvo: '#btSair', pt: 'A casinha volta para o começo. Seu desenho fica guardado em Meus desenhos.', en: 'The little house goes back to the start. Your drawing is saved in My drawings.' },
      { alvo: '#btTour', pt: 'Pronto! Se quiser me ver de novo, toque no ponto de interrogação. Agora é com você!', en: 'All done! To see me again, tap the question mark. Now it is your turn!' }
    ]),
    colorir: COMUM_INICIO.concat([
      { alvo: '#tela', pt: 'Este é um desenho para colorir. Pinte com o dedo, do jeito que quiser!', en: 'This is a picture to color. Paint it with your finger, any way you like!' },
      { alvo: '.ferramenta[data-f="balde"]', pt: 'O balde pinta um pedaço inteiro sem passar da linha. Escolha a cor e toque dentro do desenho.', en: 'The bucket paints a whole part without going over the line. Pick a color and tap inside the picture.' },
      { alvo: '#cores .cor', pt: 'As primeiras cores são as do desenho. Mas você pode usar qualquer uma!', en: 'The first colors are the picture colors. But you can use any color!' },
      { alvo: '#btColinha', pt: 'O olhinho mostra a colinha: como o desenho pode ficar.', en: 'The little eyes show the cheat sheet: how the picture can look.' },
      { alvo: '#btVariacao', pt: 'A paleta troca as cores da colinha: noite, doce, outono e mais.', en: 'The palette changes the cheat sheet colors: night, candy, autumn and more.' },
      { alvo: '.ferramenta[data-f="pinceis"]', pt: 'Você também pode usar os pincéis, até os mágicos que se mexem!', en: 'You can also use the brushes, even the magic ones that move!' },
      { alvo: '#btTour', pt: 'Pronto! Para me ver de novo, toque no ponto de interrogação. Boa pintura!', en: 'All done! To see me again, tap the question mark. Happy painting!' }
    ]),
    numeros: COMUM_INICIO.concat([
      { alvo: '#paleta', pt: 'Cada cor tem um número. Escolha uma cor nesta faixa de bolinhas.', en: 'Each color has a number. Pick a color in this row of dots.' },
      { alvo: '#tela', pt: 'Depois toque nas partes que têm o mesmo número. As partes cinzas são da cor escolhida.', en: 'Then tap the parts with the same number. The gray parts are for the chosen color.' },
      { alvo: '#tela', pt: 'Os números são pequenos? Use dois dedos para chegar pertinho. Um dedo arrasta o desenho.', en: 'Numbers too small? Use two fingers to zoom in. One finger moves the picture.' },
      { alvo: '#btDica', pt: 'A varinha mágica mostra uma parte que ainda falta pintar.', en: 'The magic wand shows a part still left to paint.' },
      { alvo: '#btColinha', pt: 'O olhinho mostra como vai ficar no final.', en: 'The little eyes show how it will look at the end.' },
      { alvo: '#btTour', pt: 'Quando terminar tudo, tem festa de fogos! Para me ver de novo, toque no ponto de interrogação.', en: 'When you finish everything, there are fireworks! To see me again, tap the question mark.' }
    ])
  };

  // ---------- voz: a do próprio aparelho, em português do Brasil ----------
  var vozes = [];
  function carregarVozes() { try { vozes = raiz.speechSynthesis ? raiz.speechSynthesis.getVoices() : []; } catch (e) { vozes = []; } }
  if (raiz.speechSynthesis) { carregarVozes(); try { raiz.speechSynthesis.addEventListener('voiceschanged', carregarVozes); } catch (e) { /* navegador velho */ } setTimeout(carregarVozes, 900); }
  function escolherVoz(lingua) {
    var norm = function (l) { return (l || '').replace('_', '-').toLowerCase(); };
    var quer = lingua === 'en' ? 'en' : 'pt', exata = lingua === 'en' ? 'en-us' : 'pt-br';
    var lista = vozes.filter(function (v) { return norm(v.lang).indexOf(quer) === 0 || (quer === 'pt' && norm(v.lang).indexOf('por') === 0); });
    var natural = /natural|online|neural|enhanced|premium|wavenet|google/i;
    lista.sort(function (a, b) { return (norm(b.lang) === exata) - (norm(a.lang) === exata) || natural.test(b.name) - natural.test(a.name); });
    return lista[0] || null;
  }
  function semEmoji(txt) { return txt.replace(/[←-⯿☀-➿️‍]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, ''); }
  function falar(txt, lingua) {
    var s = raiz.speechSynthesis; if (!s || !raiz.SpeechSynthesisUtterance) return;
    try { s.cancel(); } catch (e) { /* ok */ }
    setTimeout(function () {   // o Chrome perde a fala colada no cancel(): espera um pouquinho
      try {
        var u = new SpeechSynthesisUtterance(semEmoji(txt));
        u.lang = lingua === 'en' ? 'en-US' : 'pt-BR';
        var v = escolherVoz(lingua); if (v) u.voice = v;
        u.rate = 1; u.pitch = 1.15;   // um pouquinho mais agudo: voz de personagem simpático
        s.speak(u);
      } catch (e) { /* sem voz: o balão continua escrito */ }
    }, 70);
  }
  function calar() { try { if (raiz.speechSynthesis) raiz.speechSynthesis.cancel(); } catch (e) { /* ok */ } }

  // ---------- o passeio ----------
  var atual = null;   // { lista, i, op, camada, luz, balao }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function visivel(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && !e.closest('[hidden]'); }
  function alvosDe(p) {
    if (!p.alvo) return [];
    var todos = Array.prototype.slice.call(document.querySelectorAll(p.alvo)).filter(visivel);
    return p.alvo === '#cores .cor' ? todos.slice(0, 1) : todos;
  }
  function caixaDe(lista) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    lista.forEach(function (e) { var r = e.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function comecar(qual, op) {
    var lista = (PASSOS[qual] || []).slice();
    if (!lista.length) return;
    terminar(true);
    var camada = el('div', 'tour'), luz = el('div', 'tour-luz'), balao = el('div', 'tour-balao');
    camada.setAttribute('role', 'dialog'); camada.setAttribute('aria-modal', 'true'); camada.setAttribute('aria-live', 'polite');
    camada.appendChild(luz); camada.appendChild(balao); document.body.appendChild(camada);
    atual = { lista: lista, i: 0, op: op || {}, camada: camada, luz: luz, balao: balao };
    camada.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.tour-botoes')) return; ir(1); });
    document.addEventListener('keydown', teclas, true);
    window.addEventListener('resize', reposicionar);
    mostrar();
  }
  function teclas(e) {
    if (!atual) return;
    if (e.key === 'Escape' || e.keyCode === 461) { e.preventDefault(); e.stopPropagation(); terminar(); }
    else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); ir(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); ir(-1); }
  }
  function ir(d) {
    if (!atual) return;
    var n = atual.i + d;
    if (n < 0) return;
    if (n >= atual.lista.length) { terminar(); return; }
    atual.i = n; mostrar();
  }
  function texto(p) { var t = atual.op.t; return t ? t(p.pt, p.en) : p.pt; }
  function mostrar() {
    var p = atual.lista[atual.i], t = atual.op.t || function (a) { return a; };
    if (atual.op.antes) { try { atual.op.antes(p); } catch (e) { /* ok */ } }
    var alvos = alvosDe(p);
    // o botão pode estar escondido numa faixa que rola: traz para a vista antes de apontar
    if (alvos[0] && alvos[0].scrollIntoView && p.alvo !== '#tela') { try { alvos[0].scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { alvos[0].scrollIntoView(); } }
    var b = atual.balao; b.innerHTML = '';
    var cab = el('div', 'tour-cab'); cab.appendChild(el('span', 'tour-eu', EU)); cab.appendChild(el('b', '', 'Rabisquinho')); b.appendChild(cab);
    var fala = el('p', 'tour-fala', texto(p)); b.appendChild(fala);
    var botoes = el('div', 'tour-botoes');
    var voz = el('button', 'tour-bt', atual.op.voz === false ? '🔇' : '🔊'); voz.type = 'button'; voz.setAttribute('aria-label', t('Ligar ou desligar a voz', 'Voice on or off'));
    voz.addEventListener('click', function () { atual.op.voz = atual.op.voz === false; voz.textContent = atual.op.voz === false ? '🔇' : '🔊'; if (atual.op.aoMudarVoz) atual.op.aoMudarVoz(atual.op.voz !== false); if (atual.op.voz === false) calar(); else falar(texto(p), atual.op.lingua); });
    var ant = el('button', 'tour-bt', '◀'); ant.type = 'button'; ant.disabled = atual.i === 0; ant.setAttribute('aria-label', t('Voltar', 'Back')); ant.addEventListener('click', function () { ir(-1); });
    var pos = el('span', 'tour-pos', (atual.i + 1) + ' / ' + atual.lista.length);
    var ult = atual.i === atual.lista.length - 1;
    var prx = el('button', 'tour-bt forte', ult ? t('Vamos lá! ✨', 'Let\'s go! ✨') : '▶'); prx.type = 'button'; prx.setAttribute('aria-label', ult ? t('Terminar', 'Finish') : t('Próximo', 'Next')); prx.addEventListener('click', function () { ir(1); });
    var sair = el('button', 'tour-bt', '✕'); sair.type = 'button'; sair.setAttribute('aria-label', t('Sair do passo a passo', 'Leave the tour')); sair.addEventListener('click', function () { terminar(); });
    botoes.appendChild(voz); botoes.appendChild(ant); botoes.appendChild(pos); botoes.appendChild(prx); botoes.appendChild(sair);
    b.appendChild(botoes);
    b.classList.remove('pula'); void b.offsetWidth; b.classList.add('pula');   // reinicia a animação de "pulo"
    setTimeout(function () { reposicionar(); try { prx.focus({ preventScroll: true }); } catch (e) { /* ok */ } }, 30);
    if (atual.op.voz !== false) falar(texto(p), atual.op.lingua);
  }
  function reposicionar() {
    if (!atual) return;
    var p = atual.lista[atual.i], alvos = alvosDe(p), luz = atual.luz, b = atual.balao, W = innerWidth, H = innerHeight, M = 10;
    var bw = Math.min(330, W - 2 * M), bh;
    b.style.width = bw + 'px';
    bh = b.offsetHeight;
    if (!alvos.length) {
      luz.hidden = true; atual.camada.classList.add('sem-alvo'); b.className = b.className.replace(/ seta-\w+/g, '');
      b.style.left = Math.round((W - bw) / 2) + 'px'; b.style.top = Math.round((H - bh) / 2) + 'px';
      return;
    }
    var r = caixaDe(alvos), pad = p.alvo === '#tela' ? -12 : 6;
    luz.hidden = false; atual.camada.classList.remove('sem-alvo');
    luz.style.left = (r.x - pad) + 'px'; luz.style.top = (r.y - pad) + 'px'; luz.style.width = (r.w + 2 * pad) + 'px'; luz.style.height = (r.h + 2 * pad) + 'px';
    // o balão vai para o lado com mais espaço (de preferência em cima ou embaixo do botão)
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, x, y, lado;
    var cima = r.y - M - 14, baixo = H - (r.y + r.h) - M - 14, esq = r.x - M - 14, dir = W - (r.x + r.w) - M - 14;
    if (p.alvo === '#tela') { lado = 'meio'; x = (W - bw) / 2; y = r.y + Math.max(20, (r.h - bh) / 2); }
    else if (baixo >= bh || cima >= bh) {
      lado = cima >= bh && (cima >= baixo || baixo < bh) ? 'cima' : 'baixo';
      x = Math.max(M, Math.min(W - bw - M, cx - bw / 2));
      y = lado === 'cima' ? r.y - bh - 18 : r.y + r.h + 18;
    } else {
      lado = esq >= dir ? 'esq' : 'dir';
      x = lado === 'esq' ? Math.max(M, r.x - bw - 18) : Math.min(W - bw - M, r.x + r.w + 18);
      y = Math.max(M, Math.min(H - bh - M, cy - bh / 2));
    }
    b.style.left = Math.round(x) + 'px'; b.style.top = Math.round(Math.max(M, Math.min(H - bh - M, y))) + 'px';
    b.className = b.className.replace(/ seta-\w+/g, '') + ' seta-' + lado;
    // a setinha do balão aponta para o centro do botão
    b.style.setProperty('--seta-x', Math.round(Math.max(18, Math.min(bw - 18, cx - x))) + 'px');
    b.style.setProperty('--seta-y', Math.round(Math.max(18, Math.min(bh - 18, cy - parseFloat(b.style.top)))) + 'px');
  }
  function terminar(silencioso) {
    if (!atual) return;
    calar();
    document.removeEventListener('keydown', teclas, true);
    window.removeEventListener('resize', reposicionar);
    var a = atual; atual = null;
    if (a.camada.parentNode) a.camada.parentNode.removeChild(a.camada);
    if (!silencioso && a.op.aoTerminar) { try { a.op.aoTerminar(); } catch (e) { /* ok */ } }
  }

  var API = { comecar: comecar, terminar: terminar, aberto: function () { return !!atual; }, PASSOS: PASSOS, falar: falar };
  raiz.DesenhoTour = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
