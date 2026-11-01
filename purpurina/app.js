/* Purpurina — telas, estúdio, desafios, desfile, foto e looks favoritos.
   As peças ficam em pecas.js, as regras em visual.js, o desenho em boneca.js e o som em som.js.
   Guarda só neste aparelho (localStorage, chaves "purpurina.*"): preferências, o visual do "brincar
   livre", os looks favoritos e as estrelas de cada desafio. Nada vai para a internet. */
(function () {
  'use strict';
  var APP_VERSION = '0.10.0';
  var $ = function (id) { return document.getElementById(id); };
  var P = window.PurpurinaPecas, V = window.PurpurinaVisual, B = window.PurpurinaBoneca, Som = window.PurpurinaSom;
  var TV = /[?&]tv=auto\b/.test(location.search);
  if (TV) document.documentElement.classList.add('tv');
  var TOQUE = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  var CALMO = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MAX_LOOKS = 30;

  function ler(k, padrao) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; /* aparelho sem espaço ou modo privado: segue sem gravar */ } }
  var pref = ler('purpurina.pref', null) || {};
  if (pref.lingua !== 'en' && pref.lingua !== 'pt') pref.lingua = (navigator.language || 'pt').slice(0, 2) === 'pt' ? 'pt' : 'en';
  function salvarPref() { gravar('purpurina.pref', pref); }

  // ---------- idioma ----------
  function t(pt, en) { return pref.lingua === 'en' ? en : pt; }
  function N(x) { return pref.lingua === 'en' ? x.en : x.pt; }
  function traduzir() {
    document.documentElement.lang = pref.lingua === 'en' ? 'en' : 'pt-BR';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = pref.lingua === 'en' ? p[1] : p[0]; });
    $('btLingua').textContent = pref.lingua === 'en' ? 'PT' : 'EN';
  }

  // ---------- telas e o botão Voltar do celular ----------
  /* Cada tela nova entra no histórico do navegador; o Voltar do celular volta uma tela (ou fecha a
     janela aberta) em vez de sair do jogo. Fechar pelo botão da tela também tira a entrada (history.back). */
  var atual = 'entrada', pilha = [], ignorar = 0, janelaAberta = false, parteNoHist = false;
  function mostrar(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.tela'), function (s) { s.classList.toggle('ativa', s.id === id); });
    atual = id; window.scrollTo(0, 0);
    if (id !== 'desfile') pararConfete();
    if (id === 'menu') desenharMenu();
    if (id === 'desafios') listaDesafios();
    if (id === 'looks') listaLooks();
    if (id === 'estudio') desenharTudo();
    if (window.PurpurinaTV && PurpurinaTV.aoMostrar) PurpurinaTV.aoMostrar(id);
    setTimeout(focarPrimeiro, 30);
  }
  function ir(id) { if (id === atual) return; pilha.push(atual); try { history.pushState({ purpurina: pilha.length }, ''); } catch (e) { /* sem histórico: segue */ } mostrar(id); }
  function voltar() { if (pilha.length) history.back(); }
  function irMenu() {
    var i = pilha.lastIndexOf('menu');
    if (i < 0) { mostrar('menu'); return; }
    var passos = pilha.length - i + (parteNoHist ? 1 : 0); pilha = pilha.slice(0, i); parteNoHist = false; naParte = false;
    ignorar++; history.go(-passos); mostrar('menu');
  }
  window.addEventListener('popstate', function () {
    if (ignorar) { ignorar--; if (aposFechar) { var fn = aposFechar; aposFechar = null; fn(); } return; }
    if (janelaAberta) { fecharJanela(); return; }
    if (parteNoHist && atual === 'estudio') { parteNoHist = false; mostrarPartes(); return; }   // Voltar do celular: das opções volta para as partes
    if (pilha.length) mostrar(pilha.pop());
  });
  Array.prototype.forEach.call(document.querySelectorAll('.voltar'), function (b) { b.addEventListener('click', voltar); });

  if (window.SolverRecursos && !SolverRecursos.ligado('purpurina', true)) { mostrar('desligado'); traduzir(); return; }

  // ---------- janela (foto, confirmar) ----------
  var aposFechar = null;
  function abrirJanela(o, mesma) {
    $('janelaTitulo').textContent = o.titulo || ''; $('janelaTexto').textContent = o.texto || ''; $('janelaTexto').hidden = !o.texto;
    var img = $('janelaImg'); img.hidden = !o.img; if (o.img) { img.src = o.img; img.alt = o.alt || ''; }
    var caixa = $('janelaBotoes'); caixa.innerHTML = '';
    o.botoes.forEach(function (b) {
      var bt = document.createElement('button'); bt.type = 'button'; bt.className = b.classe || 'medio'; bt.textContent = b.t;
      bt.addEventListener('click', function () { if (b.ficar) { b.fn(); return; } fecharPeloBotao(b.fn); });
      caixa.appendChild(bt);
    });
    var vid = $('janelaVideo'); vid.hidden = !o.video; if (o.video) { vid.src = o.video; try { vid.play(); } catch (e) { /* ok */ } } else vid.removeAttribute('src');
    $('janela').hidden = false;
    if (!(mesma && janelaAberta)) { janelaAberta = true; try { history.pushState({ janela: 1 }, ''); } catch (e) { /* ok */ } }
    setTimeout(function () { var p = caixa.querySelector('button'); if (p) p.focus(); }, 30);
  }
  function fecharJanela() { $('janela').hidden = true; janelaAberta = false; var v = $('janelaVideo'); try { v.pause(); } catch (e) { /* ok */ } if (v.src && v.src.indexOf('blob:') === 0) URL.revokeObjectURL(v.src); v.removeAttribute('src'); var img = $('janelaImg'); if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src); img.removeAttribute('src'); }
  // fecha a janela e só depois (quando o navegador terminar de voltar no histórico) faz a ação escolhida
  function fecharPeloBotao(depois) { if (!janelaAberta) return; fecharJanela(); ignorar++; aposFechar = depois || null; history.back(); }
  $('janela').addEventListener('click', function (e) { if (e.target === $('janela')) fecharPeloBotao(); });

  var tRecado = 0;
  function recado(msg) { var r = $('recado'); r.textContent = msg; r.hidden = false; clearTimeout(tRecado); tRecado = setTimeout(function () { r.hidden = true; }, 2600); }

  // ---------- entrada e menu ----------
  var livre = V.limpar(ler('purpurina.atual', null));
  function entrar() {
    if (atual !== 'entrada') return;
    Som.iniciar(); Som.musica(true); Som.tocar('brilho');
    telaCheia();
    try { history.replaceState({ inicio: 1 }, ''); } catch (e) { /* ok */ }
    mostrar('menu');
  }
  $('btEntrar').addEventListener('click', entrar);
  function desenharMenu() {
    $('menuBoneca').innerHTML = B.svg(livre, { id: 'menu', fundo: false, area: [40, 40, 320, 640] });
    $('qtdLooks').textContent = ler('purpurina.looks', []).length;
  }
  $('btLingua').addEventListener('click', function () { pref.lingua = pref.lingua === 'en' ? 'pt' : 'en'; salvarPref(); traduzir(); Som.tocar('clique'); });
  $('btSom').addEventListener('click', function () { Som.iniciar(); var lig = Som.alternar(); $('btSom').textContent = lig ? '🔊' : '🔇'; });
  $('btAjuda').addEventListener('click', function () { var a = $('ajuda'); a.hidden = !a.hidden; $('btAjuda').setAttribute('aria-expanded', String(!a.hidden)); });
  $('btLivre').addEventListener('click', function () {
    Som.tocar('aba');
    if (V.iguais(livre, V.novo())) { comecar(null); return; }
    abrirJanela({ titulo: t('🎨 Brincar livre', '🎨 Free play'), texto: t('Quer continuar o visual de antes ou começar tudo do zero?', 'Do you want to keep your last look or start from scratch?'), botoes: [
      { t: t('✨ Começar do zero', '✨ Start from scratch'), classe: 'grande', fn: function () { hist.limpar(); livre = V.novo(); gravar('purpurina.atual', livre); comecar(null); } },
      { t: t('👗 Continuar o visual', '👗 Keep my look'), fn: function () { comecar(null); } }
    ] });
  });
  $('btDesafios').addEventListener('click', function () { Som.tocar('aba'); ir('desafios'); });
  $('btTV').addEventListener('click', function () { Som.tocar('aba'); ir('conectar'); });
  $('btMusica').addEventListener('click', function () { Som.tocar('aba'); ir('musica'); });
  $('btMusicaPalco').addEventListener('click', function () { Som.tocar('aba'); ir('musica'); });
  // ponte com a TV (tv.js): quando o celular está conectado, cada mudança vai para a TV
  function ponte(tipo, extra) { if (window.PurpurinaTV && PurpurinaTV.conectado()) PurpurinaTV.mandar(tipo, extra); }
  $('btLooks').addEventListener('click', function () { Som.tocar('aba'); ir('looks'); });

  // tela cheia no celular: a barra do navegador não tampa nada (deitado ou em pé). No iPhone não existe.
  function telaCheia() {
    if (!TOQUE || TV) return;
    var d = document, el = d.documentElement;
    try {
      if (!(d.fullscreenElement || d.webkitFullscreenElement)) { var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen && el.webkitRequestFullscreen()); if (p && p.catch) p.catch(function () {}); }
    } catch (e) { /* navegador sem tela cheia: segue normal */ }
  }

  // ---------- desafios ----------
  function estrelasTxt(n) { return n ? '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n) : '☆☆☆'; }
  function listaDesafios() {
    var caixa = $('listaDesafios'); caixa.innerHTML = '';
    P.DESAFIOS.forEach(function (d) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'desafio';
      var est = ler('purpurina.estrelas.' + d.id, 0);
      var ico = document.createElement('span'); ico.className = 'ico'; ico.textContent = d.ico;
      var txt = document.createElement('span'), nome = document.createElement('span'), e = document.createElement('span');
      nome.className = 'nome'; nome.textContent = N(d); e.className = 'est'; e.textContent = estrelasTxt(est);
      e.setAttribute('aria-label', est + ' ' + t('de 3 estrelas', 'of 3 stars'));
      txt.appendChild(nome); txt.appendChild(e); b.appendChild(ico); b.appendChild(txt);
      b.addEventListener('click', function () { Som.tocar('aba'); comecar(d.id); });
      caixa.appendChild(b);
    });
  }

  // ---------- estúdio ----------
  var modo = null, estado = livre, hist = new V.Historico(), grupoAtual = 'eu', catPorGrupo = {}, dicasAntes = [];
  function desafioAtual() { return modo ? V.desafio(modo) : null; }
  // desafio começa limpinho, com a personagem dela (pele, cabelo, olhos) e o cenário do tema
  function baseDesafio(d) {
    var e = V.novo();
    ['personagem', 'pele', 'rosto', 'nariz', 'cabelo', 'cabeloCor', 'olhos'].forEach(function (k) { e[k] = livre[k]; });
    if (e.personagem === 'menino') e.cilios = 'nenhum';
    e.cenario = d.cenario; return e;
  }
  function comecar(desafioId) {
    modo = desafioId; hist.limpar(); naParte = false;
    var d = desafioAtual();
    if (d) { estado = baseDesafio(d); grupoAtual = 'roupa'; Som.proxima(); }
    else { estado = livre; grupoAtual = grupoAtual || 'eu'; }
    dicasAntes = d ? V.avaliar(estado, d).dicas : [];
    vista = INTEIRA.slice(); zoomLigado = false; angulo = 0; animGiro++;
    ir('estudio'); setTimeout(mostrarDicaGiro, 600); ponte('visual');
  }
  function mudar(novo, catId) {
    if (V.iguais(novo, estado)) return;
    hist.guardar(estado); estado = novo; aposMudar(); efeito(catId);
  }
  function aposMudar() {
    if (!modo) { livre = estado; gravar('purpurina.atual', estado); }
    ponte('visual');
    if (angulo) { girarPara(0, 300); }
    desenharBoneca(); desenharOpcoes(); desenharDicas(true);
    $('btDesfazer').disabled = !hist.tem();
  }
  function desenharTudo() {
    var d = desafioAtual();
    $('titulo').textContent = d ? d.ico + ' ' + N(d) : t('🎨 Brincar livre', '🎨 Free play');
    desenharGrupos(); desenharBoneca(); desenharOpcoes(); desenharDicas(false); zoom(zoomLigado, false);
    $('btDesfazer').disabled = !hist.tem();
  }
  function desenharBoneca() {
    var el = $('boneca');
    // girando (arrastando, dando a volta ou voltando de frente): sem desfoque e sombra, para o giro ficar liso
    var mexendo = !!(arraste && arraste.mexeu) || emVolta || girando;
    el.innerHTML = B.svg(estado, { id: 'palco', anim: !CALMO && !angulo, area: vista, angulo: angulo, realce: !mexendo });
    $('btFrente').hidden = !angulo;
    if (angulo !== angMandado && !emVolta) { angMandado = angulo; ponte('giro'); }
    el.setAttribute('aria-label', V.resumo(estado, pref.lingua));
  }
  function desenharDicas(comSom) {
    var d = desafioAtual(), ul = $('dicas');
    $('dicasCaixa').hidden = !d; if (!d) return;
    var r = V.avaliar(estado, d); ul.innerHTML = '';
    $('dicasTitulo').textContent = '💡 ' + r.cumpridas + '/3';
    $('dicasCaixa').setAttribute('aria-label', t('Dicas do desafio', 'Challenge tips') + ': ' + r.cumpridas + '/3');
    d.dicas.forEach(function (x, i) {
      var li = document.createElement('li'), m = document.createElement('span'), s = document.createElement('span');
      li.className = r.dicas[i] ? 'ok' : ''; m.className = 'marca'; m.textContent = r.dicas[i] ? '✅' : '⚪'; s.textContent = N(x);
      if (r.dicas[i] && !dicasAntes[i] && comSom) { Som.tocar('dica'); li.classList.add('novo'); }
      else m.style.animation = 'none';
      li.appendChild(m); li.appendChild(s); ul.appendChild(li);
    });
    dicasAntes = r.dicas;
  }

  /* ---------- zoom ----------
     O palco mostra a personagem inteira ou chega perto (rosto, busto, mãos ou cabeça). Liga sozinho ao escolher
     uma parte que tem zoom (maquiagem, joias, olhos…) e desliga nas roupas e no cenário; o 🔍 liga e desliga na mão.
     A animação só muda o viewBox do SVG (barato, sem redesenhar). */
  var INTEIRA = [0, 0, 400, 720], vista = INTEIRA.slice(), zoomLigado = false, animZoom = 0;
  function catAtual() { return P.categoria(catPorGrupo[grupoAtual] || catsDoGrupo(grupoAtual)[0].id); }
  function alvoZoom() { var c = catAtual(); return P.ZOOM[(c && c.zoom) || 'rosto']; }
  function zoom(liga, animar) {
    zoomLigado = !!liga;
    var b = $('btZoom'); b.setAttribute('aria-pressed', String(zoomLigado)); b.textContent = zoomLigado ? '🧍' : '🔍';
    b.setAttribute('aria-label', zoomLigado ? t('Ver a personagem inteira', 'See the whole character') : t('Chegar perto (zoom)', 'Zoom in'));
    var de = vista.slice(), para = zoomLigado ? alvoZoom().slice() : INTEIRA.slice(), id = ++animZoom;
    if (de.join() === para.join()) return;
    var svg = $('boneca').querySelector('svg');
    if (!animar || CALMO || !svg) { vista = para; if (svg) svg.setAttribute('viewBox', vista.join(' ')); return; }
    var ini = performance.now(), dur = 380;
    (function passo(agora) {
      if (id !== animZoom) return;
      var k = Math.min(1, (agora - ini) / dur), e = 1 - Math.pow(1 - k, 3);
      vista = de.map(function (v, i) { return v + (para[i] - v) * e; });
      var s = $('boneca').querySelector('svg'); if (s) s.setAttribute('viewBox', vista.map(function (v) { return Math.round(v * 10) / 10; }).join(' '));
      if (k < 1) requestAnimationFrame(passo); else vista = para;
    })(ini);
  }
  // ao trocar de parte: zoom automático conforme a parte
  function zoomDaParte() { var c = catAtual(); zoom(!!(c && c.zoom), true); }
  $('btZoom').addEventListener('click', function () { Som.tocar('clique'); zoom(!zoomLigado, true); });


 // "⬇ mais": aparece quando há opções escondidas embaixo; um toque rola para baixo
  function conferirMais() {
    var o = $('opcoes'), tem = o.scrollHeight - o.scrollTop - o.clientHeight > 24;
    $('btMais').hidden = !tem;
  }
  $('opcoes').addEventListener('scroll', conferirMais, { passive: true });
  window.addEventListener('resize', function () { if (atual === 'estudio') conferirMais(); });
  $('btMais').addEventListener('click', function () { var o = $('opcoes'); Som.tocar('clique'); try { o.scrollBy({ top: o.clientHeight * 0.75, behavior: 'smooth' }); } catch (e) { o.scrollTop += o.clientHeight * 0.75; } });

  // qual opção é "sem nada" (a bolinha com a diagonal) em cada parte; null = não dá para ficar sem (ex.: pele)
  function semNada(cat) { if (!cat.opcoes) return null; if (cat.opcoes[0].id === 'nenhum') return 'nenhum'; if (cat.id === 'estampa') return 'liso'; return null; }
  var TIRAR_TUDO = { make: { pt: 'Tirar toda a maquiagem', en: 'Remove all makeup' }, joias: { pt: 'Tirar todas as joias', en: 'Remove all jewelry' }, acess: { pt: 'Tirar todos os acessórios', en: 'Remove all accessories' } };

  // abas (grupos), partes (categorias) e opções
  function catsDoGrupo(g) { return P.CATEGORIAS.filter(function (c) { return c.grupo === g; }); }
  // tela estreita: o nome comprido da aba que não cabe troca pelo nome curto (Maquiagem → Make)
  function encaixarAbas() {
    Array.prototype.forEach.call(document.querySelectorAll('.grupo-bt .t'), function (t) {
      var b = t.parentNode; t.textContent = b.getAttribute('aria-label');
      if (t.getAttribute('data-curto') && t.scrollWidth > t.clientWidth) t.textContent = t.getAttribute('data-curto');
    });
  }
  window.addEventListener('resize', encaixarAbas);
  var naParte = false;
  function entrarNaParte() {
    if (!naParte && !parteNoHist) { parteNoHist = true; try { history.pushState({ parte: 1 }, ''); } catch (e) { parteNoHist = false; } }
    naParte = true;
  }
  // volta da lista de opções para as partes (pelo botão ⬅ ou pelo Voltar do celular)
  function mostrarPartes() { naParte = false; desenharGrupos(); zoomDaParte(); }
  function sairDaParte() { if (parteNoHist) { parteNoHist = false; ignorar++; history.back(); } }
  $('btPartes').addEventListener('click', function () { Som.tocar('clique'); if (parteNoHist) history.back(); else mostrarPartes(); });
  function desenharGrupos() {
    var caixa = $('grupos'); caixa.innerHTML = '';
    P.GRUPOS.forEach(function (g) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'grupo-bt'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(g.id === grupoAtual)); b.setAttribute('aria-label', N(g));
      var i = document.createElement('span'); i.className = 'i'; i.textContent = g.ico;
      var tx = document.createElement('span'); tx.className = 't'; tx.textContent = N(g); tx.setAttribute('data-curto', g.curto ? N(g.curto) : '');
      b.appendChild(i); b.appendChild(tx);
      b.addEventListener('click', function () { grupoAtual = g.id; Som.tocar('aba'); sairDaParte(); naParte = false; desenharGrupos(); desenharOpcoes(); zoomDaParte(); });
      caixa.appendChild(b);
    });
    encaixarAbas();
    var cats = catsDoGrupo(grupoAtual), cc = $('cats'); cc.innerHTML = '';
    if (!catPorGrupo[grupoAtual]) catPorGrupo[grupoAtual] = cats[0].id;
    /* dois passos, para caber no celular: primeiro as partes da aba (Base, Blush, Batom…), grandes; tocou numa,
       as partes recolhem num botão "⬅ Partes", o palco diminui um pouco e as opções ganham o espaço todo */
    var soUma = cats.length < 2, mostrandoOpcoes = soUma || naParte, atualC = P.categoria(catPorGrupo[grupoAtual]);
    cc.hidden = mostrandoOpcoes;
    $('opcoes').hidden = !mostrandoOpcoes;
    $('parteBar').hidden = soUma || !naParte;
    $('parteNome').textContent = atualC.ico + ' ' + N(atualC);
    $('estudio').classList.toggle('escolhendo', mostrandoOpcoes && !soUma);
    if (!mostrandoOpcoes) $('btMais').hidden = true;
    cats.forEach(function (c) {
      // botão quadradinho (desenho em cima, nome embaixo): todas as partes ficam à vista, nada escondido para o lado
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cat-bt';
      var ci = document.createElement('span'); ci.className = 'i'; ci.textContent = c.ico; var ct = document.createElement('span'); ct.textContent = N(c);
      b.appendChild(ci); b.appendChild(ct);
      b.setAttribute('aria-pressed', String(c.id === catPorGrupo[grupoAtual]));
      b.addEventListener('click', function () { catPorGrupo[grupoAtual] = c.id; Som.tocar('clique'); entrarNaParte(); desenharGrupos(); desenharOpcoes(); $('opcoes').scrollTop = 0; zoomDaParte(); });
      cc.appendChild(b);
    });
  }
  function desenharOpcoes() {
    var cat = P.categoria(catPorGrupo[grupoAtual] || catsDoGrupo(grupoAtual)[0].id);
    var cores = $('cores'), estilos = $('estilos'); cores.innerHTML = ''; estilos.innerHTML = '';
    cores.hidden = !cat.cores; estilos.hidden = !cat.opcoes;
    // ✕ Tirar: aparece sempre que a peça está colocada e dá para ficar sem ela
    var sem = semNada(cat), podeTirar = !!(sem && estado[cat.id] !== sem), tb = $('btTirar');
    tb.hidden = !podeTirar;
    if (podeTirar) { var opAtual = P.opcao(cat.id, estado[cat.id]); tb.textContent = '🚫 ' + t('Tirar: ', 'Remove: ') + N(opAtual); tb.onclick = function () { mudar(V.aplicar(estado, cat.id, sem), cat.id); Som.tocar('desfazer'); }; }
    // 🚫 Tirar todos (maquiagem, joias ou acessórios inteiros de uma vez)
    var tt = $('btTirarTudo'), daAba = TIRAR_TUDO[grupoAtual], postas = daAba ? catsDoGrupo(grupoAtual).filter(function (c) { var s0 = semNada(c); return s0 && estado[c.id] !== s0; }) : [];
    tt.hidden = postas.length < 2;
    if (!tt.hidden) { tt.textContent = '🚫 ' + N(daAba); tt.onclick = function () { var e = estado; postas.forEach(function (c) { e = V.aplicar(e, c.id, semNada(c)); }); mudar(e, null); Som.tocar('desfazer'); recado(N(daAba) + ' ✓'); }; }
    cores.setAttribute('aria-label', t('Cores', 'Colors') + ' — ' + N(cat));
    estilos.setAttribute('aria-label', N(cat));
    if (cat.cores) {
      var chave = cat.opcoes ? cat.id + 'Cor' : cat.id;
      P.CORES[cat.cores].forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'cor-bt' + (cat.opcoes ? '' : ' grande-cor') + (c.brilho ? ' metal' : '');
        b.style.backgroundColor = c.hex;
        if (c.id === 'arco' && cat.id === 'glitter') b.style.background = 'conic-gradient(#ff7cc8, #ffd76a, #7ee8ff, #b892ff, #ff7cc8)';
        b.setAttribute('aria-label', N(c)); b.title = N(c);
        b.setAttribute('aria-pressed', String(estado[chave] === c.id && (!cat.opcoes || estado[cat.id] !== 'nenhum')));
        b.addEventListener('click', function () { mudar(V.aplicar(estado, cat.id, c.id, true), cat.id); });
        cores.appendChild(b);
      });
    }
    if (cat.opcoes) {
      cat.opcoes.forEach(function (op, k) {
        var ehNada = op.id === semNada(cat);
        var b = document.createElement('button'); b.type = 'button'; b.className = 'op-bt' + (ehNada ? ' nenhum' : '') + (cat.id === 'cenario' ? ' fundo' : '');
        var vis = document.createElement('span'); vis.className = 'mini-svg';
        if (ehNada) vis.textContent = '🚫';
        else {
          var e = V.aplicar(estado, cat.id, op.id);
          if (cat.id === 'sapatos' || cat.id === 'unhas') e = Object.assign({}, e, { vestido: 'nenhum', saia: 'nenhum', calca: 'shorts' });   // para o sapato aparecer inteiro
          vis.innerHTML = cat.id === 'cenario' ? B.svg(e, { id: 'm' + k, soFundo: true, cortar: true }) : B.svg(e, { id: 'm' + k, fundo: false, area: cat.area });
        }
        var nome = document.createElement('span'); nome.textContent = N(op);
        b.appendChild(vis); b.appendChild(nome);
        b.setAttribute('aria-pressed', String(estado[cat.id] === op.id && V.visivel(estado, cat.id) || (op.id === 'nenhum' && estado[cat.id] === 'nenhum')));
        // tocar de novo na peça que já está colocada tira a peça (quando dá para ficar sem ela)
        b.addEventListener('click', function () {
          var sem0 = semNada(cat), tirar = !!sem0 && op.id !== sem0 && estado[cat.id] === op.id && V.visivel(estado, cat.id);
          mudar(V.aplicar(estado, cat.id, tirar ? sem0 : op.id), cat.id);
          if (tirar) recado(t('Tirou: ', 'Removed: ') + N(op));
        });
        estilos.appendChild(b);
      });
    }
    setTimeout(conferirMais, 30);
  }

  // ---------- efeitos na personagem: pincel, faíscas, giro ----------
  var ALVO = { base: [200, 200, 1], blush: [250, 252, 1], sombra: [236, 192, 1], delineado: [236, 205, 1], cilios: [236, 195, 1], batom: [200, 272, 1], glitter: [200, 180, 1], adesivo: [266, 250, 1],
    pele: [200, 205, 1], cabelo: [200, 130, 1], olhos: [200, 214, 1], vestido: [200, 480], blusa: [200, 400], saia: [200, 490], calca: [200, 540], estampa: [200, 400], sapatos: [200, 646],
    cabeca: [200, 110, 1], laco: [250, 130, 1], brincos: [284, 236, 1], colar: [200, 350], oculos: [200, 214, 1], bolsa: [290, 515], cenario: [200, 360],
    mechas: [200, 140, 1], pulseira: [120, 487], anel: [111, 508], broche: [174, 388] };
  var PINCEL = { base: '🧽', blush: '🖌️', sombra: '🖌️', delineado: '✏️', cilios: '🖌️', batom: '💄', glitter: '✨', adesivo: '💟' };
  function naTela(x, y, cabeca) {
    if (cabeca) { x = 200 + (x - 200) * 1.12; y = 297 + (y - 297) * 1.12 + 14; }   // mesma conta do grupo da cabeça em boneca.js
    var r = $('boneca').getBoundingClientRect(), v = vista, s = Math.min(r.width / v[2], r.height / v[3]);
    return [(r.width - v[2] * s) / 2 + (x - v[0]) * s, (r.height - v[3] * s) / 2 + (y - v[1]) * s];
  }
  function faiscas(x, y, qtd, emojis) {
    if (CALMO) return;
    var caixa = $('efeitos'), lista = emojis || ['✨', '💖', '⭐', '✨'];
    for (var i = 0; i < qtd; i++) {
      var f = document.createElement('span'), a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
      f.className = 'faisca'; f.textContent = lista[i % lista.length];
      f.style.setProperty('--x0', (x - 10) + 'px'); f.style.setProperty('--y0', (y - 10) + 'px');
      f.style.setProperty('--x1', (x - 10 + Math.cos(a) * d) + 'px'); f.style.setProperty('--y1', (y - 10 + Math.sin(a) * d) + 'px');
      caixa.appendChild(f);
      setTimeout(function (n) { return function () { n.remove(); }; }(f), 850);
    }
  }
  function efeito(catId) {
    var cat = P.categoria(catId); if (!cat) return;
    var a = ALVO[catId] || [200, 360], q = naTela(a[0], a[1], a[2]);
    if (cat.grupo === 'make' && !CALMO) {
      Som.tocar('pincel');
      var p = document.createElement('span'), r = $('boneca').getBoundingClientRect();
      p.className = 'pincel'; p.textContent = PINCEL[catId] || '🖌️';
      p.style.setProperty('--x0', (r.width - 40) + 'px'); p.style.setProperty('--y0', (r.height - 40) + 'px');
      p.style.setProperty('--x1', (q[0] - 8) + 'px'); p.style.setProperty('--y1', (q[1] - 30) + 'px');
      $('efeitos').appendChild(p);
      setTimeout(function () { p.remove(); faiscas(q[0], q[1], 6); Som.tocar('brilho'); }, 650);
      return;
    }
    Som.tocar(cat.grupo === 'roupa' ? 'roupa' : cat.grupo === 'eu' ? 'clique' : 'brilho');
    faiscas(q[0], q[1], cat.grupo === 'fundo' ? 12 : 7);
  }
  /* ---------- girar a personagem ----------
     Arrastar o dedo para os lados gira (frente, lado, costas). Um toque (ou o ↻) dá uma volta inteira com
     rastro de luz: a cada poucos quadros, uma cópia do desenho fica para trás e vai sumindo (efeito
     estroboscópico, sem piscar a tela). Quem pediu menos movimento vê a volta em 4 paradas, sem rastro. */
  var angulo = 0, animGiro = 0, arraste = null, pedidoQuadro = 0, angMandado = 0, emVolta = false, girando = false;
  function redesenharGiro() { if (pedidoQuadro) return; pedidoQuadro = requestAnimationFrame(function () { pedidoQuadro = 0; desenharBoneca(); }); }
  function girarPara(alvo, dur) {
    var id = ++animGiro, de = angulo, ini = performance.now();
    var dif = ((alvo - de) % 360 + 540) % 360 - 180;   // pelo caminho mais curto
    girando = true;
    (function passo(agora) {
      if (id !== animGiro) { girando = false; return; }
      var k = Math.min(1, (agora - ini) / dur);
      angulo = de + dif * (1 - Math.pow(1 - k, 3)); if (k >= 1) { angulo = ((alvo % 360) + 360) % 360; girando = false; }
      desenharBoneca(); if (k < 1) requestAnimationFrame(passo);
    })(ini);
  }
  // volta inteira com rastro (vale para o palco e para a passarela do desfile)
  function volta(alvoEl, rastroEl, desenhar, pronto) {
    var id = ++animGiro, ini = performance.now(), dur = 1700, quadro = 0;
    function limpar() { rastroEl.innerHTML = ''; }
    if (CALMO) {
      [90, 180, 270, 0].forEach(function (a, i) { setTimeout(function () { if (id === animGiro) desenhar(a); if (i === 3 && pronto) pronto(); }, (i + 1) * 450); });
      return;
    }
    Som.tocar('surpresa'); limpar();
    (function passo(agora) {
      if (id !== animGiro) { limpar(); return; }
      var k = Math.min(1, (agora - ini) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      desenhar(k >= 1 ? 0 : e * 360);
      if (++quadro % 3 === 0 && k < 1) {
        var atualSvg = alvoEl.querySelector('svg');
        if (atualSvg) {
          // a cópia ganha nomes internos próprios (recortes, degradês): com os mesmos nomes, o navegador usava os
          // recortes da cópia (de outro ângulo) no desenho de verdade e o cabelo e a orelha saíam no lugar errado
          var pref = ((atualSvg.querySelector('[id]') || {}).id || '').split('-')[0], f = document.createElement('div'); f.className = 'fantasma';
          f.innerHTML = pref ? atualSvg.outerHTML.replace(new RegExp('(id="|url\\(#)' + pref + '-', 'g'), '$1f' + quadro + pref + '-') : atualSvg.outerHTML;
          rastroEl.appendChild(f);
          while (rastroEl.children.length > 4) rastroEl.removeChild(rastroEl.firstChild);
          Array.prototype.forEach.call(rastroEl.children, function (c, i, l) { c.style.opacity = String(0.08 + 0.12 * (i + 1) * (4 / l.length) / 2); });
        }
      }
      if (k < 1) requestAnimationFrame(passo); else { setTimeout(limpar, 120); Som.tocar('brilho'); if (pronto) pronto(); }
    })(ini);
  }
  function voltaNoPalco() {
    ponte('volta'); emVolta = true;   // a TV faz a própria volta; durante a volta não manda cada quadro
    volta($('boneca'), $('rastro'), function (a) { angulo = a; desenharBoneca(); }, function () { emVolta = false; angMandado = angulo; desenharBoneca(); var q = naTela(200, 360); faiscas(q[0], q[1], 10); });
  }
  var bonecaEl = $('boneca');
  bonecaEl.addEventListener('pointerdown', function (ev) {
    try { bonecaEl.setPointerCapture(ev.pointerId); } catch (x) { /* ok */ }
    animGiro++; $('rastro').innerHTML = '';
    arraste = { x: ev.clientX, a: angulo, mexeu: false };
  });
  bonecaEl.addEventListener('pointermove', function (ev) {
    if (!arraste) return;
    var dx = ev.clientX - arraste.x;
    if (Math.abs(dx) > 6) arraste.mexeu = true;
    if (!arraste.mexeu) return;
    angulo = ((arraste.a + dx * 0.9) % 360 + 360) % 360; redesenharGiro();   // o rosto vai para o lado do dedo
  });
  function soltar() {
    if (!arraste) return;
    var foiToque = !arraste.mexeu; arraste = null;
    if (foiToque) voltaNoPalco();
    else if (angulo < 12 || angulo > 348) girarPara(0, 200);   // quase de frente: encaixa
    else desenharBoneca();   // parou de arrastar: volta o desfoque e a sombra
  }
  bonecaEl.addEventListener('pointerup', soltar);
  bonecaEl.addEventListener('pointercancel', function () { arraste = null; });
  $('btGirar').addEventListener('click', voltaNoPalco);
  $('btFrente').addEventListener('click', function () { Som.tocar('clique'); girarPara(0, 350); });
  var dicaGiroMostrada = false;
  function mostrarDicaGiro() {
    if (dicaGiroMostrada) return; dicaGiroMostrada = true;
    var d = $('dicaGiro'); d.hidden = false; setTimeout(function () { d.hidden = true; }, 3500);
  }

  // ---------- botões do estúdio ----------
  $('btCasa').addEventListener('click', function () { Som.tocar('clique'); irMenu(); });
  $('btDesfazer').addEventListener('click', function () {
    var e = hist.voltar(); if (!e) return;
    estado = e; Som.tocar('desfazer'); aposMudar();
  });
  $('btSurpresa').addEventListener('click', function () {
    var novo = V.surpresa(estado); var d = desafioAtual(); if (d) novo.cenario = d.cenario;
    mudar(novo, null); Som.tocar('surpresa');
    var q = naTela(200, 360); faiscas(q[0], q[1], 16, ['✨', '🎲', '💖', '⭐']);
    voltaNoPalco();
  });
  // 🔄 Reiniciar: tirar maquiagem, roupa e acessórios (a personagem continua) ou tudo do zero. Dá para desfazer (↩).
  $('btRecomecar').addEventListener('click', function () {
    var d = desafioAtual();
    function limpo(tudo) {
      var e = d ? baseDesafio(d) : V.novo();
      if (!tudo) ['personagem', 'pele', 'rosto', 'nariz', 'cabelo', 'cabeloCor', 'mechas', 'mechasCor', 'olhos'].forEach(function (k) { e[k] = estado[k]; });
      else ['personagem', 'pele', 'rosto', 'nariz', 'cabelo', 'cabeloCor', 'mechas', 'mechasCor', 'olhos'].forEach(function (k) { e[k] = P.PADRAO[k]; });
      e.cenario = d ? d.cenario : (tudo ? P.PADRAO.cenario : estado.cenario);
      mudar(e, null); Som.tocar('desfazer');
      recado(t('Pronto, começou de novo! ↩ desfaz.', 'Done, starting over! ↩ undoes.'));
    }
    abrirJanela({ titulo: t('🔄 Reiniciar', '🔄 Start over'), texto: t('O que você quer tirar?', 'What do you want to reset?'), botoes: [
      { t: t('🧼 Maquiagem, roupas e acessórios', '🧼 Makeup, clothes and accessories'), classe: 'grande', fn: function () { limpo(false); } },
      { t: t('✨ Tudo do zero (personagem também)', '✨ Everything (character too)'), fn: function () { limpo(true); } },
      { t: t('Cancelar', 'Cancel') }
    ] });
  });
  $('btGuardar').addEventListener('click', guardarLook);
  $('btGuardarDesfile').addEventListener('click', guardarLook);
  $('btFoto').addEventListener('click', foto);
  $('btFotoDesfile').addEventListener('click', foto);
  $('btDesfilar').addEventListener('click', desfilar);

  // ---------- looks favoritos ----------
  function guardarLook() {
    var looks = ler('purpurina.looks', []);
    if (looks.some(function (l) { return V.iguais(V.limpar(l.e), estado); })) { recado(t('Esse look já está guardado 💖', 'This look is already saved 💖')); return; }
    if (looks.length >= MAX_LOOKS) { recado(t('Já tem ' + MAX_LOOKS + ' looks guardados. Apague um em 💖 Meus looks.', 'You already have ' + MAX_LOOKS + ' looks. Delete one in 💖 My looks.')); return; }
    looks.unshift({ id: Date.now(), quando: new Date().toISOString(), e: V.copiar(estado) });
    if (!gravar('purpurina.looks', looks)) { recado(t('Não deu para guardar: o aparelho está sem espaço.', "Couldn't save: the device is out of space.")); return; }
    Som.tocar('coracao'); recado(t('Guardado em 💖 Meus looks!', 'Saved to 💖 My looks!'));
    if (atual === 'estudio') { var q = naTela(200, 360); faiscas(q[0], q[1], 10, ['💖', '💕', '💗']); }
  }
  function listaLooks() {
    var looks = ler('purpurina.looks', []), caixa = $('listaLooks'); caixa.innerHTML = '';
    $('semLooks').hidden = looks.length > 0;
    looks.forEach(function (l, k) {
      var card = document.createElement('div'); card.className = 'look';
      var mini = document.createElement('div'); mini.className = 'mini-boneca';
      mini.innerHTML = B.svg(V.limpar(l.e), { id: 'look' + k, area: [0, 60, 400, 600], cortar: true });
      var linha = document.createElement('div'); linha.className = 'linha';
      var vestir = document.createElement('button'); vestir.type = 'button'; vestir.textContent = t('👗 Vestir', '👗 Wear');
      vestir.addEventListener('click', function () { livre = V.limpar(l.e); gravar('purpurina.atual', livre); Som.tocar('brilho'); comecar(null); });
      var apagar = document.createElement('button'); apagar.type = 'button'; apagar.textContent = '🗑'; apagar.setAttribute('aria-label', t('Apagar este look', 'Delete this look'));
      apagar.addEventListener('click', function () {
        abrirJanela({ titulo: t('Apagar este look?', 'Delete this look?'), texto: t('Ele sai dos seus looks guardados.', 'It will be removed from your saved looks.'), botoes: [
          { t: t('🗑 Apagar', '🗑 Delete'), classe: 'grande', fn: function () { var ls = ler('purpurina.looks', []).filter(function (x) { return x.id !== l.id; }); gravar('purpurina.looks', ls); listaLooks(); } },
          { t: t('Não, deixa', 'No, keep it') }
        ] });
      });
      linha.appendChild(vestir); linha.appendChild(apagar); card.appendChild(mini); card.appendChild(linha); caixa.appendChild(card);
    });
  }

  // ---------- foto do visual ----------
  function carimbo() { var d = new Date(), z = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + '-' + z(d.getHours()) + 'h' + z(d.getMinutes()); }
  /* ---------- foto de estúdio (renderizada) ----------
     Monta a foto em camadas, como uma câmera de verdade: o cenário bem desfocado atrás (profundidade), a personagem
     nítida com sombra macia, luz de estúdio, um brilho suave em volta (o glitter brilha), granulado fino de câmera e
     cantos levemente escuros. Navegador sem filtro de canvas (Safari antigo): sai sem o desfoque, mas sai. */
  function imagemDe(svg) {
    return new Promise(function (ok, erro) { var img = new Image(); img.onload = function () { ok(img); }; img.onerror = erro; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  }
  var graoCache = null;
  function grao() {
    if (graoCache) return graoCache;
    var g = document.createElement('canvas'); g.width = g.height = 160; var gc = g.getContext('2d'), d = gc.createImageData(160, 160);
    for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 22; }
    gc.putImageData(d, 0, 0); graoCache = g; return g;
  }
  // desfoque rápido: desenha pequeno (com um desfoque leve) e amplia — ampliar já espalha, e fica muito mais leve
  function borrado(img, W, H, fator, raio) {
    var p = document.createElement('canvas'); p.width = Math.max(1, Math.round(W / fator)); p.height = Math.max(1, Math.round(H / fator));
    var pc = p.getContext('2d'); if ('filter' in pc) pc.filter = 'blur(' + raio + 'px)'; pc.drawImage(img, 0, 0, p.width, p.height); return p;
  }
  function comporEstudio(c, W, H, fundo, boneca) {
    var temFiltro = 'filter' in c;
    c.save(); c.imageSmoothingQuality = 'high'; c.drawImage(borrado(fundo, W, H, 6, 1.6), -W * 0.03, -H * 0.03, W * 1.06, H * 1.06); c.restore();
    var luz = c.createRadialGradient(W * 0.38, H * 0.25, W * 0.05, W * 0.5, H * 0.45, H * 0.8); luz.addColorStop(0, 'rgba(255,246,225,0.30)'); luz.addColorStop(0.5, 'rgba(255,255,255,0)'); luz.addColorStop(1, 'rgba(30,8,50,0.38)');
    c.fillStyle = luz; c.fillRect(0, 0, W, H);
    c.save(); c.shadowColor = 'rgba(40,10,60,0.45)'; c.shadowBlur = W / 22; c.shadowOffsetX = W / 120; c.shadowOffsetY = W / 60; c.drawImage(boneca, 0, 0, W, H); c.restore();
    if (temFiltro) { c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.22; c.drawImage(borrado(boneca, W, H, 8, 2), 0, 0, W, H); c.restore(); }
    c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(grao(), 'repeat'); c.fillRect(0, 0, W, H); c.restore();
    var v = c.createRadialGradient(W / 2, H * 0.48, H * 0.32, W / 2, H * 0.5, H * 0.78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,4,36,0.35)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
  }
  function fazerFoto() {
    var Wf = 1080, Hf = 1944, faixa = 150;
    var fonte = document.fonts && document.fonts.load ? document.fonts.load('700 56px Fredoka').catch(function () {}) : Promise.resolve();
    return fonte.then(function () {
      return Promise.all([imagemDe(B.svg(estado, { id: 'fotoF', soFundo: true, largura: Wf, altura: Hf })), imagemDe(B.svg(estado, { id: 'fotoB', fundo: false, realce: false, largura: Wf, altura: Hf }))]);
    }).then(function (imgs) {
      return new Promise(function (ok, erro) {
        var cv = document.createElement('canvas'); cv.width = Wf; cv.height = Hf + faixa;
        var c = cv.getContext('2d');
        comporEstudio(c, Wf, Hf, imgs[0], imgs[1]);
        var g = c.createLinearGradient(0, Hf, Wf, Hf + faixa); g.addColorStop(0, '#ff5fb4'); g.addColorStop(1, '#8a4fe0');
        c.fillStyle = g; c.fillRect(0, Hf, Wf, faixa);
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 72px Fredoka, sans-serif';
        var d = desafioAtual();
        c.fillText('✨ Purpurina ✨', Wf / 2, Hf + 58);
        c.font = '500 38px Fredoka, sans-serif';
        c.fillText(d ? N(d) : t('Meu visual', 'My look'), Wf / 2, Hf + 118);
        cv.toBlob(function (b) { if (b) ok(b); else erro(new Error('sem imagem')); }, 'image/png');
      });
    });
  }
  function foto() {
    Som.tocar('foto');
    abrirJanela({ titulo: t('📸 Preparando a foto…', '📸 Getting the photo ready…'), botoes: [] });
    var flash = document.createElement('div'); flash.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:70;opacity:.9;transition:opacity .4s;pointer-events:none';
    document.body.appendChild(flash); setTimeout(function () { flash.style.opacity = '0'; setTimeout(function () { flash.remove(); }, 450); }, 60);
    fazerFoto().then(function (blob) {
      var url = URL.createObjectURL(blob), nome = 'purpurina-' + carimbo() + '.png';
      var arquivo = null; try { arquivo = new File([blob], nome, { type: 'image/png' }); } catch (e) { /* navegador antigo */ }
      var podeCompartilhar = !!(arquivo && navigator.canShare && navigator.canShare({ files: [arquivo] }));
      var botoes = [{ t: t('💾 Salvar no celular', '💾 Save to device'), classe: 'grande', ficar: true, fn: function () {
        var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
        recado(t('A foto foi para a pasta Downloads (ou Arquivos).', 'The photo went to your Downloads (or Files).'));
      } }];
      if (podeCompartilhar) botoes.push({ t: t('📤 Compartilhar', '📤 Share'), ficar: true, fn: function () { navigator.share({ files: [arquivo], title: 'Purpurina' }).catch(function () { /* cancelou */ }); } });
      if (VIDEO_OK) botoes.push({ t: t('🎬 Vídeo girando', '🎬 Spinning video'), ficar: true, fn: video });
      botoes.push({ t: t('Fechar', 'Close') });
      abrirJanela({ titulo: t('📸 Que foto linda!', '📸 What a lovely photo!'), img: url, alt: V.resumo(estado, pref.lingua), botoes: botoes }, true);
    }).catch(function () { abrirJanela({ titulo: t('📸 Foto', '📸 Photo'), texto: t('Não deu para tirar a foto agora. Tente de novo.', "Couldn't take the photo now. Try again."), botoes: [{ t: t('Fechar', 'Close') }] }, true); });
  }

  /* ---------- vídeo da personagem girando ----------
     Desenha 48 quadros (uma volta) num canvas e grava com o MediaRecorder do próprio navegador: duas voltas e
     uma paradinha de frente, uns 4 segundos. Tudo no aparelho; nada vai para a internet. MP4 quando o navegador
     sabe gravar (melhor para o WhatsApp), senão WebM. */
  var VIDEO_OK = !!(window.MediaRecorder && window.HTMLCanvasElement && HTMLCanvasElement.prototype.captureStream);
  function tipoVideo() {
    var l = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (var i = 0; i < l.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(l[i])) return l[i];
    return '';
  }
  function fazerVideo(andamento) {
    var Wv = 540, Hv = 972, faixa = 76, QUADROS = 48, e = V.copiar(estado), imgs = [], d = desafioAtual();
    function carregar(i) { return imagemDe(B.svg(e, { id: 'v' + i, fundo: false, realce: false, largura: Wv, altura: Hv, angulo: i * 360 / QUADROS })); }
    var fundoImg = null, cadeia = imagemDe(B.svg(e, { id: 'vF', soFundo: true, largura: Wv, altura: Hv })).then(function (img) { fundoImg = img; });
    for (var i = 0; i < QUADROS; i++) (function (k) { cadeia = cadeia.then(function () { return carregar(k); }).then(function (img) { imgs[k] = img; andamento(Math.round((k + 1) / QUADROS * 70)); }); })(i);
    return cadeia.then(function () {
      return new Promise(function (ok, erro) {
        var cv = document.createElement('canvas'); cv.width = Wv; cv.height = Hv + faixa;
        var c = cv.getContext('2d'), mime = tipoVideo(), partes = [];
        var rec = new MediaRecorder(cv.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined);
        rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) partes.push(ev.data); };
        rec.onstop = function () { var tipo = (rec.mimeType || mime || 'video/webm').split(';')[0]; ok({ blob: new Blob(partes, { type: tipo }), ext: tipo.indexOf('mp4') >= 0 ? 'mp4' : 'webm', tipo: tipo }); };
        rec.onerror = erro;
        function quadro(k) {
          comporEstudio(c, Wv, Hv, fundoImg, imgs[k % QUADROS]);
          var g = c.createLinearGradient(0, Hv, Wv, Hv + faixa); g.addColorStop(0, '#ff5fb4'); g.addColorStop(1, '#8a4fe0');
          c.fillStyle = g; c.fillRect(0, Hv, Wv, faixa);
          c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 34px Fredoka, sans-serif';
          c.fillText('✨ Purpurina ✨' + (d ? '  ' + d.ico : ''), Wv / 2, Hv + faixa / 2);
        }
        quadro(0); rec.start(200);
        var total = QUADROS * 2 + 24, k = 0;
        var tempo = setInterval(function () {
          quadro(k < QUADROS * 2 ? k : 0); k++; andamento(70 + Math.round(k / total * 30));
          if (k >= total) { clearInterval(tempo); setTimeout(function () { rec.stop(); }, 150); }
        }, 1000 / 30);
      });
    });
  }
  function video() {
    abrirJanela({ titulo: t('🎬 Preparando o vídeo…', '🎬 Making the video…'), texto: '0%', botoes: [] }, true);
    fazerVideo(function (pct) { $('janelaTexto').textContent = pct + '%'; }).then(function (r) {
      var url = URL.createObjectURL(r.blob), nome = 'purpurina-giro-' + carimbo() + '.' + r.ext, arq = null;
      try { arq = new File([r.blob], nome, { type: r.tipo }); } catch (x) { /* navegador antigo */ }
      var botoes = [{ t: t('💾 Salvar o vídeo', '💾 Save the video'), classe: 'grande', ficar: true, fn: function () {
        var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
        recado(t('O vídeo foi para a pasta Downloads (ou Arquivos).', 'The video went to your Downloads (or Files).'));
      } }];
      if (arq && navigator.canShare && navigator.canShare({ files: [arq] })) botoes.push({ t: t('📤 Compartilhar', '📤 Share'), ficar: true, fn: function () { navigator.share({ files: [arq], title: 'Purpurina' }).catch(function () { /* cancelou */ }); } });
      botoes.push({ t: t('Fechar', 'Close') });
      abrirJanela({ titulo: t('🎬 Seu vídeo girando!', '🎬 Your spinning video!'), video: url, botoes: botoes }, true);
      Som.tocar('tada');
    }).catch(function () {
      abrirJanela({ titulo: t('🎬 Vídeo', '🎬 Video'), texto: t('Este navegador não conseguiu gravar o vídeo. A foto continua funcionando.', "This browser couldn't record the video. Photos still work."), botoes: [{ t: t('Fechar', 'Close') }] }, true);
    });
  }

  // ---------- desfile ----------
  var FRASES = {
    3: [['Arrasou!', 'Amazing!'], ['Perfeito!', 'Perfect!'], ['Uau, que brilho!', 'Wow, so sparkly!']],
    2: [['Que lindo!', 'So pretty!'], ['Muito estilo!', 'Great style!'], ['Quase 3!', 'Almost 3!']],
    1: [['Que fofo!', 'So cute!'], ['Gostei!', 'I like it!'], ['Veja as dicas!', 'Check the tips!']],
    0: [['Lindo!', 'Gorgeous!'], ['Que estilo!', 'What style!'], ['Brilhou!', 'You shine!']]
  };
  var JURADOS = ['🐱', '🦄', '🐰'];
  /* ---------- o desfile ----------
     Passarela de show (boneca.js → passarela): a personagem entra lá do fundo e vem andando, rebolando, até a
     frente; para, sorri e dá tchauzinho; olha para um lado e para o outro; dá uma volta com rastro de luz; e
     fica posando, sorrindo e acenando de vez em quando. Fogos de artifício e flashes da plateia o tempo todo.
     As estrelas e os jurados aparecem quando ela chega na frente. Quem pediu menos movimento vê ela parada,
     sorrindo, sem fogos. */
  var desfileSeq = 0, desfileK = 1, desfileLugar = null;
  window.addEventListener('resize', function () { if (atual === 'desfile' && desfileLugar) desfileLugar(desfileK); });
  function desfilar() {
    var d = desafioAtual(), r = d ? V.avaliar(estado, d) : null;
    ir('desfile');
    var seq = ++desfileSeq, pas = $('passarela'), mod = $('modelo'), palco = $('palcoDesfile');
    $('cenaDesfile').innerHTML = B.passarela('pas');
    function vale() { return seq === desfileSeq && atual === 'desfile'; }
    function depois(ms, fn) { setTimeout(function () { if (vale()) fn(); }, ms); }
    function pose(op) { pas.innerHTML = B.svg(estado, Object.assign({ id: 'desfile', fundo: false, anim: !CALMO, realce: false }, op || {})); }
    // posição na passarela: k = 0 (lá no fundo) até 1 (na frente); a cena é cortada por baixo (slice), como no boneca.js
    function lugar(k) {
      desfileK = k; desfileLugar = lugar;
      var W = palco.clientWidth, H = palco.clientHeight, s = Math.max(W / 400, H / 720), h = mod.clientHeight;
      var longe = Math.min(290 * s, H * 0.55), perto = 26 * s, escala = 0.24 + 0.76 * k, pe = longe + (perto - longe) * k;
      mod.style.transform = 'translateX(-50%) translateY(' + Math.round(-(pe - 0.09 * h * escala)) + 'px) scale(' + escala.toFixed(3) + ')';
    }
    function olharPara(de, para, ms, fim) {
      var ini = performance.now();
      (function passo(agora) {
        if (!vale()) return;
        var k = Math.min(1, (agora - ini) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        pose({ sorriso: true, olhar: de + (para - de) * e });
        if (k < 1) requestAnimationFrame(passo); else if (fim) fim();
      })(ini);
    }
    var titulo = $('desfileTitulo'), jur = $('jurados');
    if (CALMO) { lugar(1); pose({ sorriso: true }); }
    else {
      titulo.classList.add('esperando'); jur.classList.add('esperando');
      lugar(0); pose({}); mod.classList.add('andando');
      fogos(seq, 9000);
      var ini = performance.now(), dur = 3600;
      (function andar(agora) {
        if (!vale()) return;
        var k = Math.min(1, (agora - ini) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        lugar(e);
        if (k < 1) requestAnimationFrame(andar);
        else {
          // chegou na frente: sorri, dá tchau, estrelas e jurados
          mod.classList.remove('andando'); pose({ sorriso: true, tchau: true });
          titulo.classList.remove('esperando'); jur.classList.remove('esperando');
          Som.tocar('tada'); setTimeout(function () { Som.tocar('aplausos'); }, 400); confete();
          depois(2200, function () { olharPara(0, -38, 450, function () { depois(700, function () { olharPara(-38, 38, 700, function () { depois(700, function () { olharPara(38, 0, 450, function () {
            depois(300, function () {
              volta(pas, $('rastroDesfile'), function (a) { pas.innerHTML = B.svg(estado, { id: 'desfile', fundo: false, anim: !CALMO && !a, angulo: a, realce: false, sorriso: true }); }, function () {
                if (!vale()) return;
                pose({ sorriso: true });
                // posando: um tchauzinho de vez em quando
                (function acenar() { depois(3800, function () { pose({ sorriso: true, tchau: true }); depois(1800, function () { pose({ sorriso: true }); acenar(); }); }); })();
              });
            });
          }); }); }); }); }); });
        }
      })(ini);
    }
    $('desfileTitulo').textContent = d ? d.ico + ' ' + N(d) : t('💖 Que visual incrível!', '💖 What an amazing look!');
    var est = $('desfileEstrelas'); est.innerHTML = '';
    var n = r ? r.estrelas : 0;
    est.setAttribute('aria-label', r ? n + ' ' + t('de 3 estrelas', 'of 3 stars') : '');
    for (var i = 0; i < 3; i++) {
      var s = document.createElement('span'); s.className = 'e' + (r && i >= n ? ' apagada' : ''); s.textContent = r ? '⭐' : '💖';
      var atraso = (CALMO ? 0.9 : 4.1) + i * 0.35;
      s.style.animationDelay = atraso + 's'; est.appendChild(s);
      if (!r || i < n) setTimeout(function () { Som.tocar('estrela'); }, atraso * 1000);
    }
    jur.innerHTML = '';
    JURADOS.forEach(function (bicho, k) {
      var f = FRASES[r ? n : 0][k], j = document.createElement('div'); j.className = 'jurado';
      var b = document.createElement('span'); b.className = 'b'; b.textContent = bicho;
      j.appendChild(b); j.appendChild(document.createTextNode(t(f[0], f[1]))); jur.appendChild(j);
    });
    var ul = $('desfileDicas'); ul.innerHTML = ''; ul.hidden = !d;
    if (d) d.dicas.forEach(function (x, i) { var li = document.createElement('li'); li.className = r.dicas[i] ? 'ok' : 'nao'; li.textContent = (r.dicas[i] ? '✅ ' : '💡 ') + N(x); ul.appendChild(li); });
    var recorde = false;
    if (d) { var antes = ler('purpurina.estrelas.' + d.id, 0); if (n > antes) { gravar('purpurina.estrelas.' + d.id, n); recorde = antes > 0; } }
    $('desfileRecorde').hidden = !recorde;
    $('btProximo').textContent = d ? t('▶ Próximo desafio', '▶ Next challenge') : t('🎨 Continuar brincando', '🎨 Keep playing');
    $('btMaisUm').hidden = !d;
    Som.proxima();
    if (CALMO) { Som.tocar('tada'); setTimeout(function () { Som.tocar('aplausos'); }, 500); }
    ponte('desfile', { d: modo || '', est: r ? r.estrelas : 0 });
  }
  // fogos de artifício por cima da passarela (canvas): foguetes sobem e estouram em bolinhas coloridas
  function fogos(seq, dur) {
    var cv = $('fogos'), c = cv.getContext('2d'), w = cv.width = cv.clientWidth, h = cv.height = cv.clientHeight, fim = performance.now() + dur, bolas = [], foguetes = [], prox = 0;
    var cores = ['#ff5fb4', '#ffd166', '#86ecc8', '#cfa8ff', '#7ee8ff', '#ffffff', '#ff8a5c'];
    function quadro(agora) {
      if (seq !== desfileSeq || atual !== 'desfile') { c.clearRect(0, 0, w, h); return; }
      if (agora < fim && agora > prox) { prox = agora + 380 + Math.random() * 520; foguetes.push({ x: w * (0.15 + Math.random() * 0.7), y: h, vy: -(h * 0.018 + Math.random() * h * 0.008), alvo: h * (0.1 + Math.random() * 0.32), cor: cores[Math.floor(Math.random() * cores.length)] }); }
      c.clearRect(0, 0, w, h);
      foguetes = foguetes.filter(function (f) {
        f.y += f.vy; c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(f.x, f.y, 2, 0, 7); c.fill();
        if (f.y > f.alvo) return true;
        Som.tocar('fogo');
        for (var i = 0; i < 64; i++) { var a = Math.PI * 2 * i / 64, v = (1.6 + Math.random() * 2.6) * Math.max(1, w / 400); bolas.push({ x: f.x, y: f.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 1, cor: i % 5 ? f.cor : '#fff' }); }
        return false;
      });
      bolas = bolas.filter(function (b) {
        var x0 = b.x, y0 = b.y;
        b.x += b.vx; b.y += b.vy; b.vy += 0.045; b.vx *= 0.985; b.vida -= 0.014;
        if (b.vida <= 0) return false;
        // cada faísca deixa um risquinho de luz atrás
        c.globalAlpha = Math.max(0, b.vida); c.strokeStyle = b.cor; c.lineWidth = 2.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x0 - b.vx * 2, y0 - b.vy * 2); c.lineTo(b.x, b.y); c.stroke();
        return true;
      });
      c.globalAlpha = 1;
      if (agora < fim || bolas.length || foguetes.length) requestAnimationFrame(quadro); else c.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(quadro);
  }
  $('btProximo').addEventListener('click', function () {
    var d = desafioAtual();
    if (d) {
      var i = P.DESAFIOS.indexOf(d), prox = P.DESAFIOS[(i + 1) % P.DESAFIOS.length];
      modo = prox.id; hist.limpar(); estado = baseDesafio(prox); grupoAtual = 'roupa'; dicasAntes = V.avaliar(estado, prox).dicas;
    }
    Som.tocar('aba'); voltar();
  });
  $('btMaisUm').addEventListener('click', function () { Som.tocar('aba'); voltar(); });
  $('btMenuDesfile').addEventListener('click', function () { Som.tocar('clique'); irMenu(); });

  // confete na tela inteira (canvas por cima, sem pegar toque)
  var confeteAtivo = 0;
  function pararConfete() { confeteAtivo++; var cv = $('festa'); if (cv.width) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); }
  function confete() {
    if (CALMO) return;
    var cv = $('festa'), c = cv.getContext('2d'), w = cv.width = window.innerWidth, h = cv.height = window.innerHeight, pecas = [], fim = performance.now() + 3800, id = ++confeteAtivo;
    var cores = ['#ff5fb4', '#ffd166', '#86ecc8', '#cfa8ff', '#7ee8ff', '#fff'];
    for (var i = 0; i < 150; i++) pecas.push({ x: Math.random() * w, y: -20 - Math.random() * h * 0.6, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3.5, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, t: 5 + Math.random() * 7, cor: cores[i % cores.length], estrela: i % 7 === 0 });
    function quadro(agora) {
      if (id !== confeteAtivo) return;
      c.clearRect(0, 0, w, h);
      pecas.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx += Math.sin(agora / 300 + p.t) * 0.02;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.cor;
        if (p.estrela) { c.font = (p.t * 2.4) + 'px sans-serif'; c.fillText('✨', 0, 0); } else c.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2);
        c.restore();
      });
      if (agora < fim) requestAnimationFrame(quadro); else c.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(quadro);
  }

  // ---------- teclado e controle da TV: setas andam entre os botões ----------
  function focaveis() {
    var raiz = janelaAberta ? $('janela') : $(atual); if (!raiz) return [];
    return Array.prototype.filter.call(raiz.querySelectorAll('button, a[href]'), function (b) { return b.offsetParent !== null && !b.disabled; });
  }
  function focarPrimeiro() {
    if (!TV) return;
    var alvo = atual === 'entrada' ? $('btEntrar') : atual === 'menu' ? $('btLivre') : focaveis()[0];
    if (alvo) try { alvo.focus(); } catch (e) { /* ok */ }
  }
  function moverFoco(dx, dy) {
    var l = focaveis(); if (!l.length) return;
    var at = document.activeElement;
    if (l.indexOf(at) < 0) { l[0].focus(); return; }
    var a = at.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, melhor = null, nota = Infinity;
    l.forEach(function (b) {
      if (b === at) return;
      var r = b.getBoundingClientRect(), x = r.left + r.width / 2 - ax, y = r.top + r.height / 2 - ay;
      var principal = dx ? x * dx : y * dy, lado = dx ? Math.abs(y) : Math.abs(x);
      if (principal <= 2) return;
      var v = principal + lado * 2.2; if (v < nota) { nota = v; melhor = b; }
    });
    if (melhor) { melhor.focus(); if (melhor.scrollIntoView) melhor.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }
  document.addEventListener('keydown', function (e) {
    var k = e.key || '', c = e.keyCode || 0;
    if (atual === 'entrada' && (k === 'Enter' || k === ' ' || c === 13)) { e.preventDefault(); entrar(); return; }
    if (k === 'ArrowLeft' || c === 37) { e.preventDefault(); moverFoco(-1, 0); }
    else if (k === 'ArrowRight' || c === 39) { e.preventDefault(); moverFoco(1, 0); }
    else if (k === 'ArrowUp' || c === 38) { e.preventDefault(); moverFoco(0, -1); }
    else if (k === 'ArrowDown' || c === 40) { e.preventDefault(); moverFoco(0, 1); }
    else if (k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || c === 27 || c === 461 || c === 10009) {
      if (janelaAberta) { e.preventDefault(); fecharPeloBotao(); } else if (pilha.length) { e.preventDefault(); voltar(); }
    }
  });

  // a música toca o tempo todo; só silencia quando o app fica escondido (outra aba, tela apagada)
  document.addEventListener('visibilitychange', function () { Som.dormir(document.hidden); });

  // ---------- guardar no celular: instalar (atalho) ou baixar o arquivo do jogo ----------
  var pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedidoInstalar = e; $('btInstalar').hidden = false; });
  $('btInstalar').addEventListener('click', function () {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    pedidoInstalar.userChoice.then(function () { pedidoInstalar = null; $('btInstalar').hidden = true; }).catch(function () {});
  });
  var EM_ARQUIVO = !!window.JOGO_EM_ARQUIVO || location.protocol === 'file:' || location.protocol === 'content:';
  if (EM_ARQUIVO || !window.BaixarJogo) $('guardar').hidden = true;
  // no arquivo baixado não há TV nem YouTube/Spotify (precisam do site e da internet)
  if (EM_ARQUIVO) Array.prototype.forEach.call(document.querySelectorAll('[data-so-site]'), function (el) { el.hidden = true; });
  $('btBaixar').addEventListener('click', function () {
    var aviso = $('baixarAviso');
    aviso.textContent = t('Preparando o arquivo…', 'Preparing the file…');
    BaixarJogo.baixar('purpurina.html').then(function () {
      aviso.textContent = t('Pronto! O arquivo purpurina.html foi para os Downloads. Toque nele para brincar, mesmo sem internet. (Os looks guardados ficam separados dos do site.)', 'Done! purpurina.html went to Downloads. Tap it to play, even offline. (Saved looks stay separate from the website ones.)');
    }).catch(function () {
      aviso.textContent = t('Não deu para baixar agora. Abra o jogo com internet e tente de novo.', "Couldn't download now. Open the game online and try again.");
    });
  });

  /* ---------- versão nova ----------
     Uma aba que ficou aberta continua com a versão antiga na memória. Ao abrir e ao voltar para o jogo (no máximo a cada
     5 min), confere o versoes.json no site; se a versão de lá for mais nova, mostra "✨ Versão nova! Toque para atualizar". */
  function maisNova(a, b) { var x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
  var ultimaConferida = 0;
  function conferirVersao() {
    if (EM_ARQUIVO || !window.fetch || Date.now() - ultimaConferida < 5 * 60000) return;
    ultimaConferida = Date.now();
    fetch('versoes.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var nova = j && j.versoes && j.versoes[0] && j.versoes[0].versao;
      if (!nova || !maisNova(nova, APP_VERSION)) return;
      var b = $('btNovaVersao'); b.textContent = t('✨ Versão nova (v', '✨ New version (v') + nova + t(')! Toque para atualizar', ')! Tap to update'); b.hidden = false;
    }).catch(function () { /* sem internet: tenta da próxima vez */ });
  }
  $('btNovaVersao').addEventListener('click', function () {
    var b = $('btNovaVersao'); b.textContent = t('Atualizando…', 'Updating…');
    // pede ao navegador para conferir os arquivos novos, mas recarrega de qualquer jeito em no máximo 1,5 s
    var feito = false, rec = function () { if (feito) return; feito = true; location.reload(); };
    setTimeout(rec, 1500);
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(function (r) { return r && r.update(); }).then(rec, rec);
    else rec();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) conferirVersao(); });
  setTimeout(conferirVersao, 3000);

  // ---------- começo ----------
  $('ver').textContent = 'v' + APP_VERSION;
  $('btSom').textContent = Som.ligado() ? '🔊' : '🔇';
  $('entradaBoneca').innerHTML = B.svg(livre, { id: 'entrada', fundo: false, area: [40, 40, 320, 640] });
  traduzir();
  if (TV) setTimeout(focarPrimeiro, 200);
  // o que o tv.js (TV, celular-controle e 🎵 Música) usa do app
  window.PurpurinaApp = {
    t: t, N: N, TV: TV && !EM_ARQUIVO, mostrar: mostrar, ir: ir, recado: recado, confete: confete,
    estado: function () { return V.copiar(estado); }, angulo: function () { return angulo; }, telaAtual: function () { return atual; },
    // depois de conectar: volta para o estúdio se veio de lá; senão abre o brincar livre
    irEstudio: function () { if (atual === 'estudio') return; if (pilha[pilha.length - 1] === 'estudio') voltar(); else comecar(null); }
  };
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () { /* sem modo offline */ });
})();
