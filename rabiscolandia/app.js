/* Rabiscolândia — telas, barra de ferramentas, painéis, colinha, Meus desenhos, mão na câmera, foto e instalar.
   O desenho em si é do motor (pintura.js); a folha esperta (girar, zoom) é da folha.js; a TV é do tv.js.
   Guarda só neste aparelho: preferências em localStorage ("rabiscolandia.pref") e os desenhos em IndexedDB
   (banco "rabiscolandia"). Nada vai para a internet. */
(function () {
  'use strict';
  var APP_VERSION = '0.1.5';
  var $ = function (id) { return document.getElementById(id); };
  var F = window.DesenhoFolha, P = window.DesenhoPaginas || { LISTA: [], CATEGORIAS: [] }, Pt = window.DesenhoPintura;
  var Som = window.DesenhoSom || { iniciar: function () {}, musica: function () {}, musicaLigada: function () { return false; }, efeito: function () {}, efeitos: function () {}, efeitosLigados: function () { return false; }, proxima: function () {}, nomeAtual: function () { return ''; } };
  var UA = navigator.userAgent || '';
  var TV = /[?&]tv=auto\b/.test(location.search) || /Web0S|webOS|Tizen|SmartTV|SMART-TV|HbbTV|BRAVIA|AFT[A-Z]|CrKey|GoogleTV/i.test(UA);
  var TOQUE = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  var CALMO = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function tipoAparelho() {
    if (TV) return 'tv';
    if (!TOQUE) return 'computador';
    var menor = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    return menor < 600 ? 'celular' : 'tablet';
  }
  if (TV) document.documentElement.classList.add('tv');
  if (TOQUE) document.documentElement.classList.add('toque');

  function ler(k, padrao) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; } }
  function gravar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var pref = ler('rabiscolandia.pref', null) || {};
  if (pref.lingua !== 'en' && pref.lingua !== 'pt') pref.lingua = (navigator.language || 'pt').slice(0, 2) === 'pt' ? 'pt' : 'en';
  if (typeof pref.musica !== 'boolean') pref.musica = true;
  if (typeof pref.efeitos !== 'boolean') pref.efeitos = true;
  pref.feitas = pref.feitas || {};
  function salvarPref() { gravar('rabiscolandia.pref', pref); }

  // ---------- idioma ----------
  function t(pt, en) { return pref.lingua === 'en' ? en : pt; }
  function N(x) { return x ? (pref.lingua === 'en' ? x.en : x.pt) : ''; }
  function traduzir() {
    document.documentElement.lang = pref.lingua === 'en' ? 'en' : 'pt-BR';
    Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { var p = el.getAttribute('data-t').split('|'); el.textContent = pref.lingua === 'en' ? p[1] : p[0]; });
    $('btLingua').textContent = pref.lingua === 'en' ? 'PT' : 'EN';
    $('versao').textContent = t('Versão ', 'Version ') + APP_VERSION + t(' · Músicas gravadas: Kevin MacLeod (incompetech.com), CC BY', ' · Recorded music: Kevin MacLeod (incompetech.com), CC BY');
  }

  // ---------- telas e o botão Voltar do celular ----------
  var atual = 'entrada', pilha = [], ignorar = 0, janelaAberta = false, aposFechar = null;
  function mostrar(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.tela'), function (s) { s.classList.toggle('ativa', s.id === id); });
    var saiu = atual; atual = id; window.scrollTo(0, 0);
    if (saiu === 'pintar' && id !== 'pintar') sairDoPintar();
    if (id === 'menu') { contarMeus(); }
    if (id === 'meus') listaMeus();
    if (id === 'pintar') entrarNoPintar();
    if (window.DesenhoTV && DesenhoTV.aoMostrar) DesenhoTV.aoMostrar(id, saiu);
    setTimeout(focarPrimeiro, 30);
  }
  function ir(id) { if (id === atual) return; pilha.push(atual); try { history.pushState({ desenho: pilha.length }, ''); } catch (e) { /* sem histórico */ } mostrar(id); }
  function voltar() { if (pilha.length) history.back(); else mostrar('menu'); }
  window.addEventListener('popstate', function () {
    if (ignorar) { ignorar--; if (aposFechar) { var fn = aposFechar; aposFechar = null; fn(); } return; }
    if (janelaAberta) { fecharJanela(); return; }
    if (!$('painel').hidden) { fecharPainel(true); return; }
    if (pilha.length) mostrar(pilha.pop());
  });
  Array.prototype.forEach.call(document.querySelectorAll('.voltar'), function (b) { b.addEventListener('click', voltar); });
  function focarPrimeiro() { if (TOQUE && !TV) return; var el = document.querySelector('.tela.ativa button:not([hidden]):not(:disabled)'); if (el) el.focus(); }

  if (window.SolverRecursos && !SolverRecursos.ligado('rabiscolandia', true)) { mostrar('desligado'); $('desligado').hidden = false; traduzir(); return; }

  // ---------- aviso rápido e janela ----------
  var tAviso = null;
  function aviso(txt, ms) { var a = $('aviso'); a.textContent = txt; a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(function () { a.hidden = true; }, ms || 2200); }
  function abrirJanela(o) {
    $('janelaTitulo').textContent = o.titulo || ''; $('janelaTexto').textContent = o.texto || ''; $('janelaTexto').hidden = !o.texto;
    var img = $('janelaImg'); img.hidden = !o.img; if (o.img) { img.src = o.img; img.alt = o.alt || ''; }
    var caixa = $('janelaBotoes'); caixa.innerHTML = '';
    o.botoes.forEach(function (b) {
      var bt = document.createElement('button'); bt.type = 'button'; bt.className = b.classe || 'medio'; bt.textContent = b.t;
      bt.addEventListener('click', function () { if (b.ficar) { b.fn(); return; } fecharPeloBotao(b.fn); });
      caixa.appendChild(bt);
    });
    $('janela').hidden = false;
    if (!janelaAberta) { janelaAberta = true; try { history.pushState({ janela: 1 }, ''); } catch (e) { /* ok */ } }
    setTimeout(function () { var p = caixa.querySelector('button'); if (p) p.focus(); }, 30);
  }
  function fecharJanela() { $('janela').hidden = true; janelaAberta = false; var img = $('janelaImg'); if (img.src && img.src.indexOf('blob:') === 0) URL.revokeObjectURL(img.src); img.removeAttribute('src'); }
  function fecharPeloBotao(fn) { if (!janelaAberta) { if (fn) fn(); return; } fecharJanela(); ignorar++; aposFechar = fn || null; history.back(); }

  // ---------- som ----------
  // música gravada começando: mostra nome e autor (a licença CC BY pede o crédito) — só quando a pessoa está desenhando
  if (Som.aoTrocar) Som.aoTrocar(function (nome, gravada) { if (gravada && (atual === 'pintar' || atual === 'menu')) aviso('🎵 ' + nome, 3500); });
  function aplicarSom() {
    Som.efeitos(pref.efeitos); Som.musica(pref.musica);
    $('btMusica').textContent = pref.musica ? '🎵' : '🔇'; $('btMusica').setAttribute('aria-pressed', pref.musica ? 'true' : 'false');
    $('btMusica2').textContent = pref.musica ? '🎵' : '🔇'; $('btMusica2').setAttribute('aria-pressed', pref.musica ? 'true' : 'false');
    $('btEfeitos').textContent = pref.efeitos ? '🔊' : '🔈';
  }
  function trocarMusica() { pref.musica = !pref.musica; salvarPref(); aplicarSom(); aviso(pref.musica ? t('🎵 Música ligada', '🎵 Music on') + (Som.nomeAtual() ? ': ' + Som.nomeAtual() : '') : t('🔇 Música desligada', '🔇 Music off')); }
  $('btMusica').addEventListener('click', trocarMusica);
  $('btMusica2').addEventListener('click', function () { abrirPainel('musica'); });
  if (Som.aoAvisar) Som.aoAvisar(function (o) {
    if (o.tipo === 'toque') aviso(t('Toque na tela para a música começar 🎵', 'Tap the screen to start the music 🎵'), 3000);
    if (o.tipo === 'soApp') aviso(t('As músicas gravadas não estão abrindo (internet?). Tocando as do app 🎵', 'Recorded songs are not loading (internet?). Playing the app songs 🎵'), 3500);
    if (painelAberto === 'musica') renderPainel('musica');
  });
  $('btEfeitos').addEventListener('click', function () { pref.efeitos = !pref.efeitos; salvarPref(); aplicarSom(); Som.efeito('toque'); });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button') && !e.target.closest('.cor, .num, .emoji')) Som.efeito('toque'); }, true);

  // ---------- entrada e menu ----------
  $('btEntrar').addEventListener('click', function () {
    Som.iniciar(); aplicarSom(); telaCheia();
    if (/[?&]tv=auto\b/.test(location.search) && window.DesenhoTV) { mostrar('menu'); DesenhoTV.virarTV(); return; }
    mostrar('menu');
  });
  function telaCheia() {
    if (tipoAparelho() !== 'celular') return;
    var d = document, el = d.documentElement;
    try { if (!(d.fullscreenElement || d.webkitFullscreenElement)) { var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : (el.webkitRequestFullscreen && el.webkitRequestFullscreen()); if (p && p.catch) p.catch(function () {}); } } catch (e) { /* sem tela cheia */ }
  }
  $('btLingua').addEventListener('click', function () { pref.lingua = pref.lingua === 'en' ? 'pt' : 'en'; salvarPref(); traduzir(); if (atual === 'livro') listaLivro(); if (atual === 'pintar') montarBarra(); });
  $('btAjuda').addEventListener('click', function () { var a = $('ajuda'); a.hidden = !a.hidden; this.setAttribute('aria-expanded', a.hidden ? 'false' : 'true'); });
  $('btLivre').addEventListener('click', function () { abrirLivre(); });
  $('btLivro').addEventListener('click', function () { livroModo = 'colorir'; ir('livro'); listaLivro(); });
  $('btNumeros').addEventListener('click', function () { livroModo = 'numeros'; ir('livro'); listaLivro(); });
  $('btComMao').addEventListener('click', function () { abrirLivre(); setTimeout(function () { ligarMao(true); }, 300); });
  $('btMeus').addEventListener('click', function () { ir('meus'); });
  $('btTV').addEventListener('click', function () { ir('tvEscolha'); });
  $('btTVMao').addEventListener('click', function () { abrirLivre(); setTimeout(function () { ligarMao(true); }, 300); });

  // ---------- livro de colorir / pintar por números ----------
  var livroModo = 'colorir', livroCat = 'todas';
  function listaLivro() {
    $('livroTitulo').textContent = livroModo === 'numeros' ? t('🔢 Pintar por números', '🔢 Paint by numbers') : t('📚 Livro de colorir', '📚 Coloring book');
    var cats = $('livroCats'); cats.innerHTML = '';
    [{ id: 'todas', ico: '🌟', pt: 'Todos', en: 'All' }].concat(P.CATEGORIAS || []).forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', c.id === livroCat ? 'true' : 'false');
      b.textContent = (c.ico ? c.ico + ' ' : '') + N(c);
      b.addEventListener('click', function () { livroCat = c.id; listaLivro(); });
      cats.appendChild(b);
    });
    var g = $('livroGrade'); g.innerHTML = '';
    P.LISTA.filter(function (p) { return livroCat === 'todas' || p.cat === livroCat; }).forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'carta';
      var feita = pref.feitas[p.id + ':' + livroModo];
      var c = Pt.miniaturaPagina(p, 220, feita ? p.cores : null); c.setAttribute('aria-hidden', 'true');
      b.appendChild(c);
      var nm = document.createElement('span'); nm.className = 'nome'; nm.textContent = N(p); b.appendChild(nm);
      if (feita) { var f = document.createElement('span'); f.className = 'feito'; f.textContent = '✓'; b.appendChild(f); }
      b.addEventListener('click', function () { abrirPagina(p, livroModo, -1); });
      g.appendChild(b);
    });
  }

  // ---------- Meus desenhos (IndexedDB) ----------
  var MAX_MEUS = 40, banco = null;
  function abrirBanco() {
    if (banco) return banco;
    banco = new Promise(function (ok, falha) {
      if (!window.indexedDB) { falha(new Error('sem-indexeddb')); return; }
      var r = indexedDB.open('rabiscolandia', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('desenhos', { keyPath: 'id' }); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { falha(r.error); };
    });
    banco.catch(function () { banco = null; });
    return banco;
  }
  function loja(modo, fn) { return abrirBanco().then(function (db) { return new Promise(function (ok, falha) { var tx = db.transaction('desenhos', modo), st = tx.objectStore('desenhos'), r = fn(st); tx.oncomplete = function () { ok(r && r.result); }; tx.onerror = function () { falha(tx.error); }; }); }); }
  function todosMeus() { return loja('readonly', function (st) { return st.getAll(); }).then(function (l) { return (l || []).sort(function (a, b) { return b.quando - a.quando; }); }).catch(function () { return []; }); }
  function contarMeus() { todosMeus().then(function (l) { $('qtdMeus').textContent = l.length; }); }
  function listaMeus() {
    todosMeus().then(function (l) {
      var g = $('meusGrade'); g.innerHTML = ''; $('meusVazio').hidden = l.length > 0;
      l.forEach(function (d) {
        var b = document.createElement('div'); b.className = 'carta';
        var abrir = document.createElement('button'); abrir.type = 'button'; abrir.style.cssText = 'background:none;width:100%;display:grid;gap:6px';
        var img = document.createElement('img'); img.src = d.mini || ''; img.alt = d.titulo || ''; abrir.appendChild(img);
        var nm = document.createElement('span'); nm.className = 'nome'; nm.textContent = d.titulo || ''; abrir.appendChild(nm);
        abrir.addEventListener('click', function () { abrirGuardado(d); });
        var x = document.createElement('button'); x.type = 'button'; x.className = 'apagar'; x.textContent = '🗑️'; x.setAttribute('aria-label', t('Apagar', 'Delete'));
        x.addEventListener('click', function () {
          abrirJanela({ titulo: t('Apagar este desenho?', 'Delete this drawing?'), img: d.mini, botoes: [
            { t: t('🗑️ Apagar', '🗑️ Delete'), fn: function () { loja('readwrite', function (st) { return st.delete(d.id); }).then(listaMeus); } },
            { t: t('Não', 'No') }] });
        });
        b.appendChild(abrir); b.appendChild(x); g.appendChild(b);
      });
    });
  }
  var atualId = null, tSalvar = null, salvando = false;
  function idNovo() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function agendarSalvar() { clearTimeout(tSalvar); tSalvar = setTimeout(salvarAgora, 2500); }
  function salvarAgora() {
    clearTimeout(tSalvar);
    if (!motor || salvando || motor.vazio()) return Promise.resolve();
    salvando = true;
    var e = motor.estado(), pag = motor.pagina(), id = atualId || (atualId = idNovo());
    var titulo = pag ? N(pag) : t('Desenho livre', 'Free drawing');
    var mini; try { mini = motor.miniatura(300); } catch (x) { mini = ''; }
    return motor.pinturaBlob().then(function (blob) {
      return loja('readwrite', function (st) { return st.put({ id: id, quando: Date.now(), titulo: titulo, mini: mini, estado: e, pintura: blob }); });
    }).then(function () { return todosMeus(); }).then(function (l) {
      if (l.length > MAX_MEUS) return loja('readwrite', function (st) { l.slice(MAX_MEUS).forEach(function (d) { st.delete(d.id); }); });
    }).catch(function () { /* sem espaço: segue sem guardar */ }).then(function () { salvando = false; });
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && atual === 'pintar') salvarAgora(); });
  window.addEventListener('pagehide', function () { if (atual === 'pintar') salvarAgora(); });
  function abrirGuardado(d) {
    var pag = d.estado.pagina ? P.LISTA.filter(function (p) { return p.id === d.estado.pagina; })[0] : null;
    preparar(function () {
      atualId = d.id;
      motor.carregar(d.estado, d.pintura, pag).then(function () { depoisDeAbrir(); });
    });
  }

  // ---------- pintar ----------
  var motor = null;
  var CORES = ['#ff4f6d', '#e63946', '#ff8a3d', '#ffd23f', '#fff3a3', '#7ed957', '#2a9d8f', '#3ee8ff', '#3a86ff', '#1d3557', '#8338ec', '#ff70d9', '#ffc8dd', '#f4a261', '#8b5a2b', '#ffe0c2', '#000000', '#7d8597', '#ffffff'];
  var TAMANHOS = [6, 14, 26, 46, 80];
  function criarMotor() {
    if (motor) return;
    motor = Pt.criar($('tela'), {
      calmo: CALMO,
      aoMudar: function () { $('btDesfazer').disabled = !motor.podeDesfazer(); if (motor.modo() === 'numeros') atualizarPaleta(); agendarSalvar(); },
      aoNumero: function (ok, n, terminouCor) {
        if (!ok) { Som.efeito('erro'); var b = document.querySelector('.num[data-n="' + n + '"]'); if (b && !CALMO && b.animate) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 400); aviso(t('Essa área é a cor ', 'That area is color ') + n + ' 🎨', 1400); return; }
        Som.efeito('acerto');
        if (terminouCor) { var prox = proximaCorQueFalta(); if (prox) { motor.numero(prox); atualizarPaleta(); } }
      },
      aoTerminar: function () {
        Som.efeito('festa'); var p = motor.pagina(); if (p) { pref.feitas[p.id + ':numeros'] = 1; salvarPref(); }
        setTimeout(function () { abrirJanela({ titulo: t('🎉 Ficou lindo!', '🎉 It looks beautiful!'), img: motor.miniatura(600), botoes: [{ t: t('📸 Salvar foto', '📸 Save photo'), fn: tirarFoto }, { t: t('Continuar', 'Continue') }] }); }, 2200);
      },
      aoBalde: function () { Som.efeito('balde'); }, aoAdesivo: function () { Som.efeito('adesivo'); },
      aoApagarObjeto: function () { Som.efeito('apagar'); },
      aoTocar: function () { if (!$('painel').hidden) fecharPainel(); }
    });
    window.DesenhoMotor = motor;
  }
  function preparar(fn) { criarMotor(); fecharPainel(true); if (atual !== 'pintar') ir('pintar'); else entrarNoPintar(); requestAnimationFrame(function () { aplicarLado(); fn(); }); }
  function abrirLivre() { preparar(function () { atualId = null; motor.livre(); depoisDeAbrir(); }); }
  function abrirPagina(p, modo, vi) {
    preparar(function () {
      atualId = null; motor.abrirPagina(p, modo, vi);
      if (modo === 'colorir') motor.ferramenta({ pincel: 'balde', cor: p.cores[0] });
      depoisDeAbrir();
      if (modo === 'numeros') setTimeout(function () { if (!motor.numerosVisiveis()) { $('avisoPerto').hidden = false; setTimeout(function () { $('avisoPerto').hidden = true; }, 4000); } }, 400);
    });
  }
  function depoisDeAbrir() {
    var pag = motor.pagina(), m = motor.modo();
    $('tituloPintar').textContent = pag ? N(pag) : t('Desenho livre', 'Free drawing');
    $('btColinha').hidden = !pag; $('btVariacao').hidden = !pag; $('btDica').hidden = m !== 'numeros';
    colinha(false); montarBarra(); $('btDesfazer').disabled = !motor.podeDesfazer();
  }
  function entrarNoPintar() { if (motor) { motor.iniciar(); aplicarLado(); } }
  function sairDoPintar() { salvarAgora(); fecharPainel(true); if (motor) motor.parar(); desligarMao(); }
  $('btSair').addEventListener('click', function () { voltar(); });
  $('btDesfazer').addEventListener('click', function () { if (motor && motor.desfazer()) Som.efeito('desfazer'); });
  $('btZoomMais').addEventListener('click', function () { motor.zoom(1.4); });
  $('btZoomMenos').addEventListener('click', function () { motor.zoom(1 / 1.4); });
  $('btAjustar').addEventListener('click', function () { motor.ajustar(); });
  $('btDica').addEventListener('click', function () { if (!motor.dica()) aviso(t('Essa cor já está pronta! Escolha outra 🎨', 'This color is done! Pick another 🎨')); });
  $('btLimpar').addEventListener('click', function () {
    abrirJanela({ titulo: t('Começar de novo?', 'Start over?'), texto: t('Tudo some, mas dá para desfazer com ↩.', 'Everything goes away, but ↩ brings it back.'), botoes: [
      { t: t('🗑️ Limpar a folha', '🗑️ Clear the page'), fn: function () { motor.limpar(); Som.efeito('apagar'); } },
      { t: t('📄 Desenho novo', '📄 New drawing'), fn: function () { salvarAgora(); var p = motor.pagina(); if (p) abrirPagina(p, motor.modo(), motor.varIdx()); else abrirLivre(); } },
      { t: t('Não', 'No') }] });
  });
  $('btFoto').addEventListener('click', tirarFoto);
  function tirarFoto() {
    Som.efeito('foto');
    motor.foto(2048).then(function (blob) {
      if (!blob) return;
      var url = URL.createObjectURL(blob), nome = 'rabiscolandia-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.png';
      var botoes = [{ t: t('💾 Salvar no aparelho', '💾 Save to device'), ficar: true, fn: function () { var a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); aviso(t('Salvo! Veja em Downloads.', 'Saved! Check Downloads.')); } }];
      var arq = null; try { arq = new File([blob], nome, { type: 'image/png' }); } catch (e) { /* navegador velho */ }
      if (arq && navigator.canShare && navigator.canShare({ files: [arq] })) botoes.push({ t: t('📤 Compartilhar', '📤 Share'), ficar: true, fn: function () { navigator.share({ files: [arq], title: 'Rabiscolândia' }).catch(function () {}); } });
      botoes.push({ t: t('Fechar', 'Close') });
      abrirJanela({ titulo: t('📸 Seu desenho', '📸 Your drawing'), img: url, alt: t('Seu desenho', 'Your drawing'), botoes: botoes });
    });
  }

  // ---------- colinha e variações ----------
  function colinha(ligar) {
    var p = motor && motor.pagina(), mostrar = !!(ligar && p);
    $('colinha').hidden = !mostrar; $('btColinha').setAttribute('aria-pressed', mostrar ? 'true' : 'false');
    if (mostrar) $('colinhaImg').src = Pt.miniaturaPagina(p, 360, motor.cores()).toDataURL();
  }
  $('btColinha').addEventListener('click', function () { colinha($('colinha').hidden); });
  $('btVariacao').addEventListener('click', function () { abrirPainel('variacoes'); });

  // ---------- lado da barra (folha esperta) ----------
  function angulo() { return screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0); }
  var ladoAtual = '';
  function aplicarLado() {
    var lado = F.ladoDaBarra(tipoAparelho(), innerWidth, innerHeight, angulo()), h = document.documentElement;
    if (lado !== ladoAtual) { h.classList.remove('barra-baixo', 'barra-direita', 'barra-esquerda'); h.classList.add('barra-' + lado); ladoAtual = lado; }
    if (motor && atual === 'pintar') { motor.redimensionar(); posicionarPainel(); }
  }
  aplicarLado();
  var tLado = null;
  function aoMudarTamanho() { clearTimeout(tLado); tLado = setTimeout(aplicarLado, 120); }
  window.addEventListener('resize', aoMudarTamanho);
  window.addEventListener('orientationchange', aoMudarTamanho);
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', aoMudarTamanho);

  // ---------- barra de ferramentas ----------
  var PINCEIS_LIVRES = ['canetinha', 'lapis', 'giz', 'pincel', 'spray', 'arcoiris', 'neon', 'purpurina', 'minhoca'];
  function infoPincel(id) { return Pt.PINCEIS.filter(function (p) { return p.id === id; })[0]; }
  var ultimoPincel = 'canetinha';
  function botaoFerr(id, ico, rotulo, fn, apertado) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ferramenta'; b.setAttribute('aria-label', rotulo); b.title = rotulo;
    if (ico instanceof Node) b.appendChild(ico); else b.textContent = ico;
    b.setAttribute('aria-pressed', apertado ? 'true' : 'false'); b.dataset.f = id;
    b.addEventListener('click', fn); return b;
  }
  function montarBarra() {
    if (!motor) return;
    var m = motor.modo(), f = motor.ferramenta(), caixa = $('ferramentas'), cores = $('cores');
    $('paleta').hidden = m !== 'numeros'; caixa.hidden = m === 'numeros'; cores.hidden = m === 'numeros';
    if (m === 'numeros') { montarPaleta(); return; }
    caixa.innerHTML = '';
    var pinc = PINCEIS_LIVRES.indexOf(f.pincel) >= 0 ? f.pincel : ultimoPincel, ip = infoPincel(pinc);
    caixa.appendChild(botaoFerr('pinceis', ip.ico, t('Pincéis', 'Brushes') + ': ' + N(ip), function () { if (motor.ferramenta().pincel !== pinc) { motor.ferramenta({ pincel: pinc }); montarBarra(); } else abrirPainel('pinceis'); }, f.pincel === pinc));
    var bol = document.createElement('span'); bol.className = 'bolinha'; bol.style.background = f.cor;
    caixa.appendChild(botaoFerr('cores', bol, t('Mais cores', 'More colors'), function () { abrirPainel('cores'); }, false));
    var pt = document.createElement('span'); pt.className = 'ponto'; var px = Math.max(6, Math.min(30, f.tam * 0.38)); pt.style.width = pt.style.height = px + 'px';
    caixa.appendChild(botaoFerr('tamanho', pt, t('Tamanho', 'Size'), function () { abrirPainel('tamanho'); }, false));
    caixa.appendChild(botaoFerr('balde', '🪣', t('Balde de tinta', 'Paint bucket'), function () { escolherPincel('balde'); }, f.pincel === 'balde'));
    caixa.appendChild(botaoFerr('borracha', iconeBorracha(), t('Borracha', 'Eraser'), function () { escolherPincel('borracha'); aviso(t('Borracha: apaga traços, adesivos e animados — é só passar por cima', 'Eraser: erases strokes, stickers and animations — just rub over them'), 2600); }, f.pincel === 'borracha'));
    caixa.appendChild(botaoFerr('adesivo', f.pincel === 'adesivo' && f.adesivo.tipo === 'emoji' ? f.adesivo.v : '⭐', t('Adesivos', 'Stickers'), function () { abrirPainel('adesivos'); }, f.pincel === 'adesivo'));
    caixa.appendChild(botaoFerr('mover', '✋', t('Mover adesivo', 'Move sticker'), function () { escolherPincel('mover'); aviso(t('Arraste um adesivo para mudar de lugar ✋', 'Drag a sticker to move it ✋')); }, f.pincel === 'mover'));
    caixa.appendChild(botaoFerr('fundo', '🏞️', t('Fundo', 'Background'), function () { abrirPainel('fundos'); }, false));
    montarCores(cores);
  }
  /* borracha de escola desenhada (rosa e azul): o 🧽 parecia um amendoim para a criança */
  function iconeBorracha() {
    var s = document.createElement('span'); s.className = 'ico-borracha'; s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="0 0 48 48" width="36" height="36"><g transform="rotate(-32 24 24)"><rect x="5" y="14" width="38" height="20" rx="5" fill="#ff8fb1" stroke="#2b2b2b" stroke-width="2.5"/>' +
      '<path d="M26 14h12a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H26z" fill="#4f8cff" stroke="#2b2b2b" stroke-width="2.5"/><rect x="9" y="17.5" width="13" height="3.5" rx="1.7" fill="#fff" opacity=".7"/></g>' +
      '<circle cx="8" cy="40" r="2" fill="#ff8fb1"/><circle cx="14" cy="43" r="1.6" fill="#ff8fb1"/><circle cx="4" cy="44" r="1.4" fill="#ff8fb1"/></svg>';
    return s;
  }
  function coresDaVez() {
    var p = motor.pagina(), lista = CORES.slice();
    if (p) { var c = motor.cores() || p.cores; lista = c.concat(lista.filter(function (x) { return c.indexOf(x) < 0; })); }
    return lista;
  }
  function montarCores(caixa) {
    caixa.innerHTML = '';
    var f = motor.ferramenta();
    coresDaVez().forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cor'; b.style.background = c; b.setAttribute('aria-label', t('Cor ', 'Color ') + c); b.setAttribute('aria-pressed', f.cor === c ? 'true' : 'false');
      b.addEventListener('click', function () { escolherCor(c); });
      caixa.appendChild(b);
    });
    var arco = document.createElement('button'); arco.type = 'button'; arco.className = 'cor arco'; arco.setAttribute('aria-label', t('Qualquer cor', 'Any color'));
    arco.addEventListener('click', function () { abrirPainel('cores'); });
    caixa.appendChild(arco);
  }
  function escolherCor(c) {
    var f = motor.ferramenta(), muda = { cor: c };
    if (f.pincel === 'borracha' || f.pincel === 'mover' || f.pincel === 'adesivo') muda.pincel = ultimoPincel;
    motor.ferramenta(muda); Som.efeito('cor'); montarBarra();
  }
  function escolherPincel(id) { if (PINCEIS_LIVRES.indexOf(id) >= 0) ultimoPincel = id; motor.ferramenta({ pincel: id }); Som.efeito('pincel'); montarBarra(); }

  // ---------- pintar por números: paleta numerada ----------
  function corTexto(hex) { var n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#222' : '#fff'; }
  function montarPaleta() {
    var caixa = $('paleta'); caixa.innerHTML = '';
    (motor.cores() || []).forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'num'; b.dataset.n = i + 1;
      b.style.setProperty('--c', c); b.style.setProperty('--tc', corTexto(c)); b.setAttribute('aria-label', t('Cor número ', 'Color number ') + (i + 1));
      var s = document.createElement('span'), it = document.createElement('i'); it.textContent = i + 1; s.appendChild(it); b.appendChild(s);
      b.addEventListener('click', function () { motor.numero(i + 1); Som.efeito('cor'); atualizarPaleta(); });
      caixa.appendChild(b);
    });
    atualizarPaleta();
  }
  function atualizarPaleta() {
    var prog = motor.progresso(), sel = motor.numero();
    Array.prototype.forEach.call(document.querySelectorAll('#paleta .num'), function (b) {
      var n = +b.dataset.n, p = prog[n - 1] || { total: 1, feitos: 0 };
      b.style.setProperty('--p', p.total ? p.feitos / p.total : 1);
      b.classList.toggle('pronto', p.feitos === p.total);
      b.setAttribute('aria-pressed', n === sel ? 'true' : 'false');
    });
  }
  function proximaCorQueFalta() { var prog = motor.progresso(); for (var i = 0; i < prog.length; i++) if (prog[i].feitos < prog[i].total) return i + 1; return 0; }

  // ---------- painéis (pincéis, cores, tamanho, adesivos, fundos, variações) ----------
  var painelAberto = '', painelNoHistorico = false;
  function abrirPainel(qual) {
    if (painelAberto === qual && !$('painel').hidden) { fecharPainel(); return; }
    renderPainel(qual);
    $('painel').hidden = false; posicionarPainel();
    if (!painelNoHistorico) { painelNoHistorico = true; try { history.pushState({ painel: 1 }, ''); } catch (e) { /* ok */ } }
    if (!TOQUE || TV) setTimeout(function () { var b = $('painelCorpo').querySelector('button'); if (b) b.focus(); }, 30);
  }
  function renderPainel(qual) {
    painelAberto = qual;
    var corpo = $('painelCorpo'); corpo.innerHTML = '';
    var titulos = { pinceis: t('🖌️ Pincéis', '🖌️ Brushes'), cores: t('🎨 Cores', '🎨 Colors'), tamanho: t('⭕ Tamanho', '⭕ Size'), adesivos: t('⭐ Adesivos', '⭐ Stickers'), fundos: t('🏞️ Fundo', '🏞️ Background'), variacoes: t('🎨 Outras cores do desenho', '🎨 Other color sets'), musica: t('🎵 Músicas', '🎵 Music') };
    $('painelTitulo').textContent = titulos[qual] || '';
    ({ pinceis: painelPinceis, cores: painelCores, tamanho: painelTamanho, adesivos: painelAdesivos, fundos: painelFundos, variacoes: painelVariacoes, musica: painelMusica })[qual](corpo);
  }
  function fecharPainel(semHistorico) {
    if ($('painel').hidden) return;
    $('painel').hidden = true; painelAberto = '';
    if (painelNoHistorico) { painelNoHistorico = false; if (!semHistorico) { ignorar++; history.back(); } }
  }
  $('painelFechar').addEventListener('click', function () { fecharPainel(); });
  function posicionarPainel() {
    var p = $('painel'); if (p.hidden) return;
    var r = $('barra').getBoundingClientRect();
    p.style.bottom = p.style.top = p.style.left = p.style.right = '';
    if (ladoAtual === 'baixo') p.style.bottom = (innerHeight - r.top + 8) + 'px';
    else if (ladoAtual === 'direita') p.style.right = (innerWidth - r.left + 8) + 'px';
    else p.style.left = (r.right + 8) + 'px';
  }
  function opcao(ico, rotulo, apertado, fn) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'opcao'; b.setAttribute('aria-pressed', apertado ? 'true' : 'false');
    var i = document.createElement('span'); i.className = 'ico'; if (ico instanceof Node) i.appendChild(ico); else i.textContent = ico; b.appendChild(i);
    var r = document.createElement('span'); r.textContent = rotulo; b.appendChild(r);
    b.addEventListener('click', fn); return b;
  }
  function titulo4(txt) { var h = document.createElement('h4'); h.textContent = txt; return h; }
  function caixaOpcoes() { var d = document.createElement('div'); d.className = 'opcoes'; return d; }
  function painelPinceis(corpo) {
    var f = motor.ferramenta(), a = caixaOpcoes(), b = caixaOpcoes();
    PINCEIS_LIVRES.forEach(function (id) {
      var p = infoPincel(id);
      (p.vivo ? b : a).appendChild(opcao(p.ico, N(p), f.pincel === id, function () { escolherPincel(id); fecharPainel(); }));
    });
    corpo.appendChild(titulo4(t('Pincéis', 'Brushes'))); corpo.appendChild(a);
    corpo.appendChild(titulo4(t('✨ Pincéis vivos (mexem sozinhos!)', '✨ Live brushes (they move!)'))); corpo.appendChild(b);
  }
  function painelCores(corpo) {
    var f = motor.ferramenta(), p = motor.pagina();
    function faixa(lista) { var d = caixaOpcoes(); lista.forEach(function (c) { var bt = document.createElement('button'); bt.type = 'button'; bt.className = 'cor'; bt.style.background = c; bt.setAttribute('aria-label', c); bt.setAttribute('aria-pressed', f.cor === c ? 'true' : 'false'); bt.addEventListener('click', function () { escolherCor(c); fecharPainel(); }); d.appendChild(bt); }); return d; }
    if (p) { corpo.appendChild(titulo4(t('Cores deste desenho', 'Colors of this picture'))); corpo.appendChild(faixa(motor.cores() || p.cores)); }
    corpo.appendChild(titulo4(t('Cores alegres', 'Happy colors'))); corpo.appendChild(faixa(CORES));
    corpo.appendChild(titulo4(t('Tons pastel', 'Pastel tones'))); corpo.appendChild(faixa(['#ffd6e0', '#ffe5b4', '#fff9c4', '#d8f3dc', '#c7f9ff', '#d0e1ff', '#e4d7ff', '#f8d7ff', '#e6ccb2', '#ddd5d0']));
    var outra = document.createElement('label'); outra.className = 'medio'; outra.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 14px;justify-self:start';
    outra.textContent = t('🌈 Qualquer cor: ', '🌈 Any color: ');
    var inp = document.createElement('input'); inp.type = 'color'; inp.value = f.cor; inp.style.cssText = 'width:56px;height:40px;border:0;background:none';
    inp.addEventListener('input', function () { motor.ferramenta({ cor: inp.value }); montarBarra(); });
    outra.appendChild(inp); corpo.appendChild(outra);
  }
  function painelTamanho(corpo) {
    var f = motor.ferramenta(), d = document.createElement('div'); d.className = 'tamanhos';
    TAMANHOS.forEach(function (tm) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tamanho'; b.setAttribute('aria-pressed', f.tam === tm ? 'true' : 'false'); b.setAttribute('aria-label', t('Tamanho ', 'Size ') + tm);
      var i = document.createElement('i'); var px = Math.max(5, Math.min(44, tm * 0.55)); i.style.width = i.style.height = px + 'px'; i.style.background = f.cor; b.appendChild(i);
      b.addEventListener('click', function () { motor.ferramenta({ tam: tm, tamAdesivo: 60 + tm * 3.2 }); montarBarra(); fecharPainel(); });
      d.appendChild(b);
    });
    corpo.appendChild(titulo4(t('Grossura do pincel e tamanho do adesivo', 'Brush thickness and sticker size'))); corpo.appendChild(d);
  }
  /* 🎵 Músicas: liga/desliga, anterior/próxima e a lista de todas (tocar uma = toque da pessoa, o navegador sempre deixa) */
  function painelMusica(corpo) {
    var ctl = document.createElement('div'); ctl.className = 'opcoes';
    var lig = document.createElement('button'); lig.type = 'button'; lig.className = 'medio'; lig.textContent = pref.musica ? t('🔇 Desligar a música', '🔇 Music off') : t('🎵 Ligar a música', '🎵 Music on');
    lig.addEventListener('click', function () { trocarMusica(); renderPainel('musica'); });
    var ant = document.createElement('button'); ant.type = 'button'; ant.className = 'mini'; ant.textContent = '⏮'; ant.setAttribute('aria-label', t('Música anterior', 'Previous song'));
    ant.addEventListener('click', function () { garantirMusica(); Som.anterior(); setTimeout(function () { renderPainel('musica'); }, 50); });
    var prx = document.createElement('button'); prx.type = 'button'; prx.className = 'mini'; prx.textContent = '⏭'; prx.setAttribute('aria-label', t('Próxima música', 'Next song'));
    prx.addEventListener('click', function () { garantirMusica(); Som.proxima(); setTimeout(function () { renderPainel('musica'); }, 50); });
    ctl.appendChild(lig); ctl.appendChild(ant); ctl.appendChild(prx); corpo.appendChild(ctl);
    // diagnóstico em linguagem de gente: as músicas gravadas (instrumentos de verdade) estão tocando neste aparelho?
    var es = Som.estado ? Som.estado() : null, diag = document.createElement('p'); diag.className = 'dica';
    if (es && es.gravadasOk > 0) diag.textContent = t('✅ As músicas gravadas (🎻 instrumentos de verdade) estão tocando neste aparelho.', '✅ Recorded songs (🎻 real instruments) are playing on this device.');
    else if (es && es.esperandoToque) diag.textContent = t('👆 Toque em qualquer lugar da tela para a música começar.', '👆 Tap anywhere on the screen to start the music.');
    else if (es && (es.soApp || es.ultimoErro)) diag.textContent = t('⚠️ As músicas gravadas não abriram aqui (', '⚠️ Recorded songs did not open here (') + es.ultimoErro + t('). Tocando as do app. Toque numa 🎻 para tentar de novo.', '). Playing the app songs. Tap a 🎻 to try again.');
    if (diag.textContent) corpo.appendChild(diag);
    var agora = document.createElement('p'); agora.className = 'dica'; agora.textContent = pref.musica && Som.nomeAtual() ? t('Tocando agora: ', 'Now playing: ') + Som.nomeAtual() : t('Toque numa música para ouvir.', 'Tap a song to listen.'); corpo.appendChild(agora);
    var l = document.createElement('div'); l.className = 'lista-musicas';
    (Som.listar ? Som.listar() : []).forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'musica-item'; b.setAttribute('aria-pressed', m.atual ? 'true' : 'false');
      var ic = document.createElement('span'); ic.className = 'ico'; ic.textContent = m.atual ? '🔊' : (m.gravada ? '🎻' : '🎹'); b.appendChild(ic);
      var tx = document.createElement('span'); tx.className = 'txt';
      var nm = document.createElement('b'); nm.textContent = m.nome; tx.appendChild(nm);
      var au = document.createElement('small'); au.textContent = m.gravada ? m.autor + ' · CC BY' : t('feita pela Rabiscolândia', 'made by Rabiscolândia'); tx.appendChild(au);
      b.appendChild(tx);
      b.addEventListener('click', function () { pref.musica = true; salvarPref(); Som.iniciar(); Som.tocar(m.i); aplicarSom(); setTimeout(function () { renderPainel('musica'); }, 50); });
      l.appendChild(b);
    });
    corpo.appendChild(l);
  }
  function garantirMusica() { if (!pref.musica) { pref.musica = true; salvarPref(); aplicarSom(); } }

  /* Painel de adesivos no jeito do teclado de emojis do celular (a filha do dono não achou os adesivos quando as
     categorias ocupavam o painel todo): no alto, uma faixa pequena de ícones das categorias e o "como mexe";
     logo embaixo, TODOS os adesivos numa lista só, com o título de cada categoria. Tocar num ícone rola até a
     categoria; rolar a lista acende o ícone da categoria que está à vista. Os animados mexem dentro do painel. */
  var abaAdesivo = 'vivos', animaPainel = 0;
  function painelAdesivos(corpo) {
    var A = window.DesenhoAdesivos; if (!A) return;
    var f = motor.ferramenta(), grupos = [{ id: 'vivos', ico: '✨', pt: 'Animados', en: 'Animated' }].concat(A.GRUPOS);
    var topo = document.createElement('div'); topo.className = 'topo-adesivos';
    var abas = document.createElement('div'); abas.className = 'abas-ad'; abas.setAttribute('role', 'tablist');
    var secoes = {}, botoesAba = {}, pulando = 0;
    grupos.forEach(function (g) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'aba-ad'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', N(g)); b.title = N(g);
      var ic = document.createElement('span'); ic.className = 'ico'; ic.textContent = g.ico; b.appendChild(ic);
      var nm = document.createElement('span'); nm.textContent = N(g).split(' ')[0]; b.appendChild(nm);
      b.addEventListener('click', function () { marcarAba(g.id); pulando = Date.now(); var sec = secoes[g.id]; if (sec) corpo.scrollTo({ top: sec.offsetTop - topo.offsetTop - topo.offsetHeight - 6, behavior: CALMO ? 'auto' : 'smooth' }); });
      botoesAba[g.id] = b; abas.appendChild(b);
    });
    topo.appendChild(abas);
    var mv = document.createElement('div'); mv.className = 'mov-ad';
    var rot = document.createElement('span'); rot.textContent = t('Como mexe:', 'Moves:'); mv.appendChild(rot);
    A.MOVIMENTOS.forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mov'; b.textContent = m.ico; b.title = N(m); b.setAttribute('aria-label', N(m)); b.setAttribute('aria-pressed', f.adesivo.mov === m.id ? 'true' : 'false');
      b.addEventListener('click', function () { var ad = motor.ferramenta().adesivo; motor.ferramenta({ adesivo: { tipo: ad.tipo, v: ad.v, mov: m.id } }); Array.prototype.forEach.call(mv.querySelectorAll('.mov'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); aviso(m.ico + ' ' + N(m), 1200); });
      mv.appendChild(b);
    });
    topo.appendChild(mv);
    corpo.appendChild(topo);
    function escolher(tipo, v) { motor.ferramenta({ pincel: 'adesivo', adesivo: { tipo: tipo, v: v, mov: motor.ferramenta().adesivo.mov } }); montarBarra(); fecharPainel(); aviso(t('Toque na folha para colar ⭐', 'Tap the page to stick it ⭐')); }
    var vivos = [];
    grupos.forEach(function (g) {
      var sec = document.createElement('section'); sec.className = 'sec-ad';
      var h = document.createElement('h4'); h.textContent = g.ico + ' ' + N(g); sec.appendChild(h);
      var grade = document.createElement('div'); grade.className = 'grade-ad';
      if (g.id === 'vivos') A.VIVOS.forEach(function (v) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'item-ad vivo'; b.setAttribute('aria-label', N(v)); b.title = N(v);
        b.setAttribute('aria-pressed', f.pincel === 'adesivo' && f.adesivo.v === v.id ? 'true' : 'false');
        var c = document.createElement('canvas'); c.width = c.height = 128; b.appendChild(c);
        var nm = document.createElement('span'); nm.textContent = N(v); b.appendChild(nm);
        b.addEventListener('click', function () { escolher('vivo', v.id); });
        vivos.push({ c: c, v: v.id, fase: Math.random() }); grade.appendChild(b);
      });
      else g.itens.forEach(function (e) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'item-ad'; b.textContent = e;
        b.setAttribute('aria-pressed', f.pincel === 'adesivo' && f.adesivo.v === e ? 'true' : 'false');
        b.addEventListener('click', function () { escolher('emoji', e); });
        grade.appendChild(b);
      });
      sec.appendChild(grade); secoes[g.id] = sec; corpo.appendChild(sec);
    });
    function marcarAba(id) { abaAdesivo = id; Object.keys(botoesAba).forEach(function (k) { botoesAba[k].setAttribute('aria-selected', k === id ? 'true' : 'false'); }); var b = botoesAba[id]; if (b) { var esq = b.offsetLeft - abas.offsetLeft; if (esq < abas.scrollLeft || esq + b.offsetWidth > abas.scrollLeft + abas.clientWidth) abas.scrollLeft = esq - 8; } }   // só a faixa de ícones anda (scrollIntoView rolaria o painel e cortaria o pulo)
    corpo.onscroll = function () {
      if (Date.now() - pulando < 900) return;                    // enquanto pula para a categoria tocada, não troca o ícone
      var y = corpo.scrollTop + topo.offsetTop + topo.offsetHeight + 20, atualId = grupos[0].id;
      grupos.forEach(function (g) { if (secoes[g.id].offsetTop <= y) atualId = g.id; });
      if (atualId !== abaAdesivo) marcarAba(atualId);
    };
    marcarAba(abaAdesivo);
    if (abaAdesivo !== 'vivos') setTimeout(function () { var sec = secoes[abaAdesivo]; if (sec) { pulando = Date.now(); corpo.scrollTop = sec.offsetTop - topo.offsetTop - topo.offsetHeight - 6; } }, 0);
    // os animados mexem de verdade aqui dentro (com "reduzir movimento", ficam parados)
    var meu = ++animaPainel, t0 = performance.now();
    function anima(agora) {
      if (meu !== animaPainel || $('painel').hidden || painelAberto !== 'adesivos') { corpo.onscroll = null; return; }
      vivos.forEach(function (it) { var x = it.c.getContext('2d'); x.clearRect(0, 0, 128, 128); try { window.DesenhoAdesivos.desenhar(x, { tipo: 'vivo', v: it.v, x: 64, y: 64, s: 100, mov: 'parado', fase: it.fase }, CALMO ? 0.6 : (agora - t0) / 1000); } catch (e) { /* ok */ } });
      if (!CALMO) requestAnimationFrame(anima);
    }
    requestAnimationFrame(anima);
  }
  function painelFundos(corpo) {
    var fu = motor.fundo();
    corpo.appendChild(titulo4(t('Paisagens', 'Landscapes')));
    var d = caixaOpcoes();
    (window.DesenhoFundos ? DesenhoFundos.LISTA : []).forEach(function (f) {
      var c = document.createElement('canvas'); c.width = c.height = 92;
      setTimeout(function () { try { var x = c.getContext('2d'); x.scale(92 / 2048, 92 / 2048); DesenhoFundos.parado(x, f.id, 2048, 2048); } catch (e) { /* ok */ } }, 0);
      d.appendChild(opcao(c, (f.vivo ? '✨ ' : '') + N(f), fu.tipo === 'paisagem' && fu.v === f.id, function () { motor.fundo({ tipo: 'paisagem', v: f.id }); fecharPainel(); }));
    });
    corpo.appendChild(d);
    corpo.appendChild(titulo4(t('Papel e cores', 'Paper and colors')));
    var c2 = caixaOpcoes();
    c2.appendChild(opcao('📄', t('Papel', 'Paper'), fu.tipo === 'papel', function () { motor.fundo({ tipo: 'papel', v: '#ffffff' }); fecharPainel(); }));
    ['#fff4d6', '#ffe0ec', '#dff6ff', '#e6ffe0', '#efe6ff', '#1b1446', '#000000'].forEach(function (c) { var s = document.createElement('span'); s.style.cssText = 'display:block;width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:' + c; c2.appendChild(opcao(s, '', fu.tipo === 'cor' && fu.v === c, function () { motor.fundo({ tipo: 'cor', v: c }); fecharPainel(); })); });
    corpo.appendChild(c2);
    corpo.appendChild(titulo4(t('Sua foto (fica só neste aparelho)', 'Your photo (stays on this device)')));
    var c3 = caixaOpcoes(); c3.appendChild(opcao('📷', t('Escolher foto', 'Pick a photo'), fu.tipo === 'foto', function () { $('arquivoFoto').click(); }));
    corpo.appendChild(c3);
  }
  $('arquivoFoto').addEventListener('change', function () {
    var arq = this.files && this.files[0]; this.value = '';
    if (!arq) return;
    var url = URL.createObjectURL(arq), img = new Image();
    img.onload = function () {
      // diminui para no máximo 1600 px: fica leve para guardar e não sai do aparelho
      var k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      motor.fundo({ tipo: 'foto', v: c.toDataURL('image/jpeg', 0.85) }); fecharPainel();
    };
    img.onerror = function () { URL.revokeObjectURL(url); aviso(t('Não consegui abrir essa foto.', 'Could not open that photo.')); };
    img.src = url;
  });
  function painelVariacoes(corpo) {
    var p = motor.pagina(); if (!p) return;
    var d = caixaOpcoes();
    [{ pt: 'Original', en: 'Original', cores: p.cores, i: -1 }].concat((p.variacoes || []).map(function (v, i) { return { pt: v.pt, en: v.en, cores: v.cores, i: i }; })).forEach(function (v) {
      var c = Pt.miniaturaPagina(p, 92, v.cores);
      d.appendChild(opcao(c, N(v), motor.varIdx() === v.i, function () { motor.variacao(v.i); fecharPainel(); montarBarra(); colinha(true); }));
    });
    corpo.appendChild(titulo4(t('A colinha 👀 e as cores mudam juntas', 'The cheat sheet 👀 and colors change together'))); corpo.appendChild(d);
  }

  // ---------- desenhar com a MÃO na câmera ----------
  var maoLigada = false, dwell = { el: null, ini: 0 }, maoAnt = 'nenhuma', sobreTela = false;
  function ligarMao(ligar) {
    if (!ligar) { desligarMao(); return; }
    if (maoLigada) return;
    if (!window.DesenhoMao) return;
    maoLigada = true; $('btMao').setAttribute('aria-pressed', 'true'); $('camBox').hidden = false;
    $('camStatus').textContent = t('Ligando a câmera… (a 1ª vez baixa uns 8 MB)', 'Starting the camera… (first time downloads about 8 MB)');
    DesenhoMao.ligar($('camVideo'), aoMao, function (p) { $('camStatus').textContent = t('Preparando a mão… ', 'Getting the hand ready… ') + Math.round(p * 100) + '%'; }).then(function () {
      $('camStatus').textContent = t('✋ Mão aberta mira · ✊ fechada desenha', '✋ Open hand aims · ✊ closed hand draws');
      aviso(t('Levante a mão aberta ✋ na frente da câmera', 'Raise your open hand ✋ in front of the camera'), 3500);
    }).catch(function (e) {
      desligarMao();
      var msg = e && (e.name === 'NotAllowedError' || e.message === 'sem-camera') ? t('Preciso da câmera: toque no cadeado 🔒 do navegador → Câmera → Permitir.', 'I need the camera: tap the lock 🔒 in the browser → Camera → Allow.') : t('Não consegui ligar a mão neste aparelho. Tente no Chrome.', 'Could not start hand mode on this device. Try Chrome.');
      abrirJanela({ titulo: t('🖐 A mão não ligou', '🖐 Hand mode did not start'), texto: msg, botoes: [{ t: 'OK' }] });
    });
  }
  function desligarMao() {
    if (!maoLigada) return;
    maoLigada = false; if (window.DesenhoMao) DesenhoMao.desligar();
    $('btMao').setAttribute('aria-pressed', 'false'); $('camBox').hidden = true; $('mira').hidden = true;
    if (motor) motor.apontar('mao', 0, 0, false); sobreTela = false;
  }
  $('btMao').addEventListener('click', function () { ligarMao(!maoLigada); });
  function aoMao(m) {
    var cv = $('camPontos'); DesenhoMao.desenharPontos(cv.getContext('2d'), m.pontos, cv.width, cv.height, m.estado);
    var mira = $('mira');
    if (m.estado === 'nenhuma') { mira.hidden = true; if (sobreTela) { motor.apontar('mao', 0, 0, false); sobreTela = false; } dwell.el = null; maoAnt = 'nenhuma'; return; }
    var x = m.x * innerWidth, y = m.y * innerHeight;
    mira.hidden = false; mira.style.left = x + 'px'; mira.style.top = y + 'px'; mira.classList.toggle('fechada', m.estado === 'fechada');
    var el = document.elementFromPoint(x, y), tela = $('tela'), r = tela.getBoundingClientRect();
    var noCanvas = el === tela && atual === 'pintar' && $('janela').hidden;
    if (noCanvas) {
      dwell.el = null; mira.style.setProperty('--p', 0);
      var fechada = m.estado === 'fechada';
      if (fechada && maoAnt !== 'fechada') Som.efeito('pegar');
      if (!fechada && maoAnt === 'fechada') Som.efeito('soltar');
      motor.apontar('mao', x - r.left, y - r.top, fechada);
      sobreTela = fechada;
    } else {
      if (sobreTela) { motor.apontar('mao', x - r.left, y - r.top, false); sobreTela = false; }
      var alvo = el && el.closest ? el.closest('button, .carta, label, input[type=color]') : null;
      if (alvo && m.estado === 'fechada' && maoAnt === 'aberta') { alvo.click(); dwell.el = null; mira.style.setProperty('--p', 0); }
      else if (alvo && m.estado === 'aberta') {
        // mão aberta parada em cima de um botão por 1 s = aperta
        if (dwell.el !== alvo) { dwell.el = alvo; dwell.ini = performance.now(); }
        var p = Math.min(1, (performance.now() - dwell.ini) / 1000); mira.style.setProperty('--p', p);
        if (p >= 1) { alvo.click(); dwell.ini = performance.now() + 600; }
      } else { dwell.el = null; mira.style.setProperty('--p', 0); }
    }
    maoAnt = m.estado;
  }

  // ---------- instalar e service worker ----------
  var pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedidoInstalar = e; $('btInstalar').hidden = false; });
  $('btInstalar').addEventListener('click', function () { if (!pedidoInstalar) return; pedidoInstalar.prompt(); pedidoInstalar.userChoice.then(function () { pedidoInstalar = null; $('btInstalar').hidden = true; }); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () { /* sem modo offline */ });

  // ---------- teclado e controle da TV: setas andam entre os botões ----------
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'GoBack' || e.keyCode === 461) { if (janelaAberta || !$('painel').hidden || pilha.length) { e.preventDefault(); voltar(); } return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && motor && atual === 'pintar') { e.preventDefault(); motor.desfazer(); return; }
    var dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
    if (!dir || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) return;
    var raizEl = !$('janela').hidden ? $('janela') : !$('painel').hidden ? $('painel') : document.querySelector('.tela.ativa');
    var bts = Array.prototype.filter.call(raizEl.querySelectorAll('button, input'), function (b) { return b.offsetParent && !b.disabled; });
    var at = document.activeElement; if (bts.indexOf(at) < 0) { if (bts[0]) bts[0].focus(); e.preventDefault(); return; }
    var a = at.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, melhor = null, md = Infinity;
    bts.forEach(function (b) { if (b === at) return; var r = b.getBoundingClientRect(), dx = r.left + r.width / 2 - ax, dy = r.top + r.height / 2 - ay; if (dx * dir[0] + dy * dir[1] <= 4) return; var d = Math.abs(dx * dir[0] + dy * dir[1]) + 2.5 * Math.abs(dx * dir[1] + dy * dir[0]); if (d < md) { md = d; melhor = b; } });
    if (melhor) { e.preventDefault(); melhor.focus(); melhor.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });

  traduzir(); aplicarSom(); contarMeus();
  if (/[?&]tv=auto\b/.test(location.search)) $('btEntrar').focus();

  // usado pelo tv.js
  window.DesenhoApp = {
    t: t, N: N, ir: ir, mostrar: mostrar, voltar: voltar, aviso: aviso, abrirJanela: abrirJanela, som: Som, pref: pref, salvarPref: salvarPref, aplicarSom: aplicarSom,
    motor: function () { criarMotor(); return motor; }, abrirLivre: abrirLivre, abrirPagina: abrirPagina, montarBarra: montarBarra, atual: function () { return atual; },
    CORES: CORES, PINCEIS_LIVRES: PINCEIS_LIVRES, iconeBorracha: iconeBorracha, TV: TV, tipoAparelho: tipoAparelho, versao: APP_VERSION
  };
})();
