/* app.js — a tela do The Useless Man (Guia do Homem Inútil Offline).
   O conteúdo fica no guia.js; aqui só desenhamos. Sem framework, sem build.
   Rotas no endereço: #/ (Início), #/c/<categoria>, #/i/<item>, #/ajustes.
   Guardado no aparelho (localStorage, prefixo "uselessman:"): idioma e o que a pessoa marcou como "aprendi".
   Nada sai do aparelho. */
(function () {
  'use strict';

  var APP_VERSION = '0.2.0';          // sobe junto com versoes.json e o VERSAO do sw.js
  var APP_UPDATED = '2026-11-14';
  var K = 'uselessman:';              // prefixo próprio: os apps da SolverONE dividem o mesmo endereço

  /* ---------- guardar sem quebrar (modo anônimo, memória cheia) ---------- */
  function ler(chave, padrao) {
    try { var v = localStorage.getItem(K + chave); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; }
  }
  function gravar(chave, valor) { try { localStorage.setItem(K + chave, JSON.stringify(valor)); } catch (e) { /* segue sem guardar */ } }

  var idioma = ler('idioma', (navigator.language || 'pt').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en');
  var aprendi = ler('aprendi', {});

  /* ---------- textos da tela (PT e EN) ---------- */
  var TXT = {
    pt: {
      subtitulo: 'Guia do Homem Inútil Offline', pular: 'Pular para o conteúdo',
      inicio: 'Início', buscar: 'Buscar', ajustes: 'Configurações',
      capaT: 'Ela não está. O celular dela não atende. Calma.',
      capaP: 'Tudo o que homem precisa saber em casa e nunca sabe. Funciona sem internet, porque a emergência não espera o Wi-Fi.',
      buscaRot: 'Qual é a emergência?', buscaPh: 'Ex.: arroz, febre, botijão, mancha…',
      nada: 'Nada aqui sobre isso. Esse, só ela sabe mesmo.', voceQuis: 'Você quis dizer:',
      socorro: 'Socorro rápido', doDia: 'Inutilidade do dia', outra: 'Sortear outra', ler: 'Ler a situação',
      categorias: 'Todas as categorias', itens: function (n) { return n + (n === 1 ? ' situação' : ' situações'); },
      medidor: 'Seu medidor de inutilidade', voceAqui: '← você está aqui', aPartir: function (n) { return n ? 'a partir de ' + n : 'começa aqui'; },
      subiu: function (nome, a, tot) { return '★ ' + nome + ': ' + a + ' de ' + tot; }, ps: 'PS:',
      medidorTxt: function (a, t) { return a + ' de ' + t + ' aprendidas. Marque "✓ Aprendi" em cada situação que você já domina.'; },
      niveis: ['Inútil de carteirinha', 'Inútil em recuperação', 'Quase útil', 'Homem de casa (de verdade)', 'Lenda doméstica'],
      instalarTxt: '📲 Guarde o guia no celular: abre com o ícone e funciona sem internet.', instalar: 'Instalar',
      voltar: '‹ Voltar', aprendiBt: '✓ Aprendi', aprendiFeito: '★ Aprendi', desmarcar: 'Desmarcar',
      compartilhar: '📤 Mandar para um amigo inútil', anterior: '‹ Anterior:', proxima: 'Próxima ›',
      ainda: 'Ainda não deu? Agora sim, pode ligar para ela. Mas diga que tentou o passo a passo.',
      socorroTag: 'socorro', copiado: 'Link copiado. Cole na conversa com o amigo.',
      compartilharTxt: 'Achei isso no Guia do Homem Inútil:',
      naoAchei: 'Não achei essa página. Voltando ao Início.',
      sairAviso: 'Toque em Voltar de novo para sair do Useless Man.',
      // ajustes
      ajIdioma: 'Idioma', ajIdiomaTxt: 'Escolha a língua do guia.',
      ajOffline: 'Usar sem internet', ajOfflineOk: function (v) { return '✓ Guardado neste aparelho (versão ' + v + '). Abre mesmo sem sinal.'; },
      ajOfflineNao: 'Ainda guardando no aparelho… Deixe o guia aberto uns segundos com internet.',
      ajOfflineSem: 'Este navegador não guarda o guia para usar sem internet. Use o Chrome, o Edge ou o Safari.',
      ajInstalado: '✓ Já está na tela inicial.', ajInstalar: '📲 Instalar na tela inicial',
      ajProgresso: 'Meu progresso', ajZerar: 'Zerar o que aprendi', ajZerarPerg: 'Apagar todas as marcações de "Aprendi" deste aparelho?', ajZerado: 'Pronto: você é inútil de novo. Do zero.',
      ajVersao: function (v, d) { return 'Versão ' + v + ', de ' + d; }, ajNovidades: 'O que mudou',
      ajSobre: 'Sobre e fontes',
      ajSobreTxt: 'O The Useless Man é um guia de humor com respostas que funcionam de verdade. A piada é sempre com o homem.',
      ajFontes: ['"Cegueira de geladeira": Macnab e Bennett, "Refrigerator Blindness", Canadian Medical Association Journal (CMAJ), dezembro de 2005.',
                 '"Carga mental" e trabalho invisível: ONU Mulheres.',
                 'Febre a partir de 37,8 °C: orientação usada por pediatras no Brasil (Sociedade Brasileira de Pediatria).'],
      ajAviso: 'Este guia não substitui médico, eletricista nem bombeiro. Em emergência: SAMU 192, Bombeiros 193.',
      ajDados: 'O que você marca fica só neste aparelho. Nada é enviado para a internet.',
      // instalar
      instIos: ['Toque em Compartilhar (o quadrado com a seta para cima).', 'Escolha "Adicionar à Tela de Início".', 'Toque em "Adicionar".'],
      instSamsung: ['No navegador da Samsung a instalação pode dar um aviso falso de "app de risco".', 'Toque em "Abrir no Chrome" abaixo.', 'No Chrome, toque nos ⋮ (três pontinhos) e em "Instalar app".'],
      instChrome: ['Toque nos ⋮ (três pontinhos) do navegador.', 'Escolha "Instalar app" ou "Adicionar à tela inicial".', 'Confirme. O ícone aparece na tela inicial.'],
      abrirChrome: 'Abrir no Chrome', jaInstalei: 'Já instalei',
      // aviso de versão e sem internet
      versaoNova: function (v) { return '✨ Versão nova do Useless Man (' + v + ')'; }, atualizar: 'Atualizar', depois: 'Depois',
      semInternet: 'Sem internet — usando a cópia guardada no aparelho.'
    },
    en: {
      subtitulo: 'The offline guide', pular: 'Skip to content',
      inicio: 'Home', buscar: 'Search', ajustes: 'Settings',
      capaT: 'She is not here. Her phone is off. Stay calm.',
      capaP: 'Everything a man needs to know at home and never does. Works offline, because emergencies do not wait for Wi-Fi.',
      buscaRot: 'What is the emergency?', buscaPh: 'E.g. rice, fever, gas tank, stain…',
      nada: 'Nothing here about that. Only she knows this one.', voceQuis: 'Did you mean:',
      socorro: 'Quick rescue', doDia: 'Uselessness of the day', outra: 'Pick another', ler: 'Read it',
      categorias: 'All categories', itens: function (n) { return n + (n === 1 ? ' situation' : ' situations'); },
      medidor: 'Your uselessness meter', voceAqui: '← you are here', aPartir: function (n) { return n ? 'from ' + n : 'starts here'; },
      subiu: function (nome, a, tot) { return '★ ' + nome + ': ' + a + ' of ' + tot; }, ps: 'PS:',
      medidorTxt: function (a, t) { return a + ' of ' + t + ' learned. Tap "✓ Learned it" on every situation you have mastered.'; },
      niveis: ['Certified useless', 'Recovering useless', 'Almost useful', 'Actually useful at home', 'Household legend'],
      instalarTxt: '📲 Keep the guide on your phone: opens from its icon and works offline.', instalar: 'Install',
      voltar: '‹ Back', aprendiBt: '✓ Learned it', aprendiFeito: '★ Learned it', desmarcar: 'Unmark',
      compartilhar: '📤 Send to a useless friend', anterior: '‹ Previous:', proxima: 'Next ›',
      ainda: 'Still stuck? Now you may call her. But tell her you tried the steps.',
      socorroTag: 'rescue', copiado: 'Link copied. Paste it in the chat with your friend.',
      compartilharTxt: 'Found this in The Useless Man\'s Guide:',
      naoAchei: 'Page not found. Going back Home.',
      sairAviso: 'Press Back again to leave Useless Man.',
      ajIdioma: 'Language', ajIdiomaTxt: 'Choose the guide\'s language.',
      ajOffline: 'Use offline', ajOfflineOk: function (v) { return '✓ Saved on this device (version ' + v + '). Opens with no signal.'; },
      ajOfflineNao: 'Still saving to this device… Keep the guide open a few seconds while online.',
      ajOfflineSem: 'This browser cannot keep the guide for offline use. Use Chrome, Edge or Safari.',
      ajInstalado: '✓ Already on the home screen.', ajInstalar: '📲 Install on home screen',
      ajProgresso: 'My progress', ajZerar: 'Reset what I learned', ajZerarPerg: 'Erase all "Learned it" marks on this device?', ajZerado: 'Done: you are useless again. From scratch.',
      ajVersao: function (v, d) { return 'Version ' + v + ', from ' + d; }, ajNovidades: 'What changed',
      ajSobre: 'About and sources',
      ajSobreTxt: 'The Useless Man is a humor guide with answers that actually work. The joke is always on the man.',
      ajFontes: ['"Refrigerator blindness": Macnab and Bennett, "Refrigerator Blindness", Canadian Medical Association Journal (CMAJ), December 2005.',
                 '"Mental load" and invisible work: UN Women.',
                 'Fever from 37.8 °C (100 °F): guidance used by pediatricians in Brazil (Brazilian Society of Pediatrics).'],
      ajAviso: 'This guide does not replace a doctor, electrician or firefighter. Emergency in Brazil: SAMU 192, Fire 193.',
      ajDados: 'What you mark stays only on this device. Nothing is sent to the internet.',
      instIos: ['Tap Share (the square with the up arrow).', 'Choose "Add to Home Screen".', 'Tap "Add".'],
      instSamsung: ['Samsung Internet may show a false "risky app" warning when installing.', 'Tap "Open in Chrome" below.', 'In Chrome, tap ⋮ (three dots) and "Install app".'],
      instChrome: ['Tap the browser\'s ⋮ (three dots).', 'Choose "Install app" or "Add to Home screen".', 'Confirm. The icon appears on your home screen.'],
      abrirChrome: 'Open in Chrome', jaInstalei: 'I installed it',
      versaoNova: function (v) { return '✨ New Useless Man version (' + v + ')'; }, atualizar: 'Update', depois: 'Later',
      semInternet: 'Offline — using the copy saved on this device.'
    }
  };
  function t(chave) { return TXT[idioma][chave]; }
  function L(obj) { return obj[idioma] || obj.pt; }   // texto de um item/categoria no idioma atual

  /* ---------- utilidades ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var main = $('#conteudo');
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function semAcento(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function cat(id) { for (var i = 0; i < CATEGORIAS.length; i++) if (CATEGORIAS[i].id === id) return CATEGORIAS[i]; return null; }
  function item(id) { for (var i = 0; i < GUIA.length; i++) if (GUIA[i].id === id) return GUIA[i]; return null; }
  function doCat(id) { return GUIA.filter(function (g) { return g.cat === id; }); }
  var MESES = { pt: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
  function data(iso) {  // PT 13/Nov/2026 · EN Nov/13/2026 (padrão da plataforma)
    var p = String(iso).split('-'), m = MESES[idioma][+p[1] - 1];
    return idioma === 'pt' ? p[2] + '/' + m + '/' + p[0] : m + '/' + p[2] + '/' + p[0];
  }
  var toastTimer;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 3500);
  }

  /* ---------- busca: sem acento, todas as palavras precisam aparecer ---------- */
  var indice = GUIA.map(function (g) {
    return { g: g, titulo: semAcento(g.pt.t + ' ' + g.en.t + ' ' + (g.busca || '')),   // título e palavras-chave valem mais
             tudo: semAcento([g.pt.t, g.en.t, g.busca || '', g.pt.p.join(' '), g.en.p.join(' ')].join(' ')) };
  });
  var vocab = (function () {
    var v = {};
    GUIA.forEach(function (g) { semAcento([g.pt.t, g.en.t, g.busca || ''].join(' ')).split(/[^a-z0-9]+/).forEach(function (w) { if (w.length > 3) v[w] = 1; }); });
    return Object.keys(v);
  })();
  function buscar(q) {
    var palavras = semAcento(q).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1; });
    if (!palavras.length) return [];
    return indice.map(function (x) {
      var pontos = 0;
      for (var i = 0; i < palavras.length; i++) {
        var w = palavras[i];
        if (x.tudo.indexOf(w) < 0) return null;
        pontos += x.titulo.indexOf(w) >= 0 ? 3 : 1;
      }
      return { g: x.g, pontos: pontos };
    }).filter(Boolean).sort(function (a, b) { return b.pontos - a.pontos; }).map(function (x) { return x.g; });
  }
  function distancia(a, b) {   // distância de letras (Levenshtein), para o "você quis dizer"
    var m = [], i, j;
    for (i = 0; i <= a.length; i++) m[i] = [i];
    for (j = 0; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function sugestoes(q) {
    var w = semAcento(q).split(/[^a-z0-9]+/).filter(function (x) { return x.length > 2; }).pop();
    if (!w) return [];
    return vocab.map(function (v) { return { v: v, d: distancia(w, v) }; })
      .filter(function (x) { return x.d <= Math.max(1, Math.floor(w.length / 3)); })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 4).map(function (x) { return x.v; });
  }

  /* ---------- pedaços de tela ----------
     Visual "porta da geladeira": o app é o bilhete que ela deixaria preso na geladeira.
     Post-it amarelo = busca; folha de bloquinho pautado = listas e cada situação; ímãs = categorias;
     quadro de estrelinhas = medidor. A letra de caneta (Kalam) só nos títulos e no PS. */
  var CORES_IMA = ['#b8322a', '#1f62a8', '#2a7347', '#6b45a3', '#9a5410'];   // contraste ≥ 4,5 com texto branco
  function corDe(catId) { for (var i = 0; i < CATEGORIAS.length; i++) if (CATEGORIAS[i].id === catId) return CORES_IMA[i % CORES_IMA.length]; return CORES_IMA[0]; }
  function linhaItem(g) {
    return '<li><a href="#/i/' + g.id + '"><span class="emo" aria-hidden="true">' + cat(g.cat).ic + '</span>' + esc(L(g).t) + '</a>' +
      (aprendi[g.id] ? '<span class="visto" aria-label="✓">✓</span>' : '') + '</li>';
  }
  function ima(cor) { return '<span class="ima" aria-hidden="true" style="--cor:' + cor + '"></span>'; }
  var LIMIARES = [0, 0.1, 0.3, 0.6, 0.9];
  function nivel() {
    var a = GUIA.filter(function (g) { return aprendi[g.id]; }).length, total = GUIA.length, f = a / total;
    var n = f >= 0.9 ? 4 : f >= 0.6 ? 3 : f >= 0.3 ? 2 : f >= 0.1 ? 1 : 0;
    return { a: a, total: total, n: n, nome: t('niveis')[n] };
  }
  function doDia(desloca) {   // muda uma vez por dia; "Outra" sorteia
    if (desloca) return GUIA[Math.floor(Math.random() * GUIA.length)];
    var d = new Date(), n = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    return GUIA[(n * 7919) % GUIA.length];
  }
  function quadro() {
    var nv = nivel();
    return '<section class="quadro gruda" style="--r:-.7deg" aria-labelledby="hMedidor">' + ima('#2a7347') +
      '<h2 class="mao" id="hMedidor">' + esc(t('medidor')) + '</h2><ol class="escada">' +
      t('niveis').map(function (nome, i) {
        var atual = i === nv.n, chegou = i <= nv.n;
        return '<li' + (atual ? ' class="atual" aria-current="step"' : '') + '><span class="estrela" aria-hidden="true">' + (chegou ? '★' : '☆') + '</span>' +
          '<span class="nome">' + esc(nome) + '</span><span class="a-partir">' + esc(t('aPartir')(Math.ceil(LIMIARES[i] * nv.total))) + '</span>' +
          (atual ? '<span class="aqui mao">' + esc(t('voceAqui')) + '</span>' : '') + '</li>';
      }).join('') + '</ol><p class="miudo">' + esc(t('medidorTxt')(nv.a, nv.total)) + '</p></section>';
  }

  /* ---------- telas ---------- */
  function telaInicio() {
    var socorro = GUIA.filter(function (g) { return g.socorro; });
    main.innerHTML = '<div class="geladeira">' +
      '<div class="porta porta-1">' +
        '<section class="postit gruda" style="--r:-1.4deg">' + ima('#b8322a') +
          '<h1 class="mao">' + esc(t('capaT')) + '</h1><p class="capa-p">' + esc(t('capaP')) + '</p>' +
          '<div class="busca"><label for="q">' + esc(t('buscaRot')) + '</label>' +
          '<input id="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="' + esc(t('buscaPh')) + '">' +
          '<div class="resultados" id="resultados" aria-live="polite"></div></div></section>' +
        '<section class="folha gruda" style="--r:.6deg" aria-labelledby="hSocorro">' + ima('#1f62a8') +
          '<h2 class="mao urgente" id="hSocorro">' + esc(t('socorro')) + '</h2><ul class="pauta">' + socorro.map(linhaItem).join('') + '</ul></section>' +
      '</div>' +
      '<div class="porta porta-2">' +
        '<section class="bilhete gruda" style="--r:1.1deg" id="doDia" aria-live="polite">' + htmlDoDia(doDia()) + '</section>' +
        '<section class="imas-sec" aria-labelledby="hCats"><h2 class="mao" id="hCats">' + esc(t('categorias')) + '</h2><div class="imas">' +
          CATEGORIAS.map(function (c, i) {
            return '<a class="ima-cat" href="#/c/' + c.id + '" style="--cor:' + CORES_IMA[i % CORES_IMA.length] + ';--r:' + ([-2, 1.5, -1, 2, -1.5, 1][i % 6]) + 'deg"><span class="emo" aria-hidden="true">' + c.ic + '</span>' +
              '<span class="nome">' + esc(L(c)) + '</span><span class="qtd">' + esc(t('itens')(doCat(c.id).length)) + '</span></a>';
          }).join('') + '</div></section>' +
        quadro() +
        (podeOferecerInstalar() ? '<section class="instalar"><p>' + esc(t('instalarTxt')) + '</p><button type="button" class="bt" id="btInstalarHome">' + esc(t('instalar')) + '</button><div id="passosInstalarHome"></div></section>' : '') +
      '</div></div>';

    // um único momento de movimento: os papéis "grudam" na porta, um depois do outro
    Array.prototype.forEach.call(main.querySelectorAll('.gruda'), function (el, i) { el.style.animationDelay = (i * 70) + 'ms'; });
    var q = $('#q');
    q.addEventListener('input', function () { mostrarResultados(q.value); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var r = buscar(q.value); if (r.length) location.hash = '#/i/' + r[0].id; }
    });
    ligarDoDia();
    var bi = $('#btInstalarHome'); if (bi) bi.addEventListener('click', function () { instalar($('#passosInstalarHome')); });
  }
  function htmlDoDia(g) {
    return '<h2 class="mao">' + esc(t('doDia')) + '</h2><p class="dia-titulo">' + esc(L(g).t) + '</p><p class="dia-piada">' + esc(L(g).r) + '</p>' +
      '<div class="acoes"><a class="bt" href="#/i/' + g.id + '">' + esc(t('ler')) + '</a><button type="button" class="bt sec" id="btOutra">' + esc(t('outra')) + '</button></div>';
  }
  function ligarDoDia() {
    var b = $('#btOutra'); if (!b) return;
    b.addEventListener('click', function () { $('#doDia').innerHTML = htmlDoDia(doDia(true)); ligarDoDia(); $('#btOutra').focus(); });
  }
  function mostrarResultados(q) {
    var box = $('#resultados'); if (!box) return;
    if (!q.trim()) { box.innerHTML = ''; return; }
    var r = buscar(q);
    if (r.length) { box.innerHTML = '<ul class="achados">' + r.slice(0, 12).map(linhaItem).join('') + '</ul>'; return; }
    var s = sugestoes(q);
    box.innerHTML = '<div class="nada"><p>' + esc(t('nada')) + '</p>' +
      (s.length ? '<p class="sug">' + esc(t('voceQuis')) + ' ' + s.map(function (w) { return '<button type="button" class="palavra" data-sug="' + esc(w) + '">' + esc(w) + '</button>'; }).join(' ') + '</p>' : '') + '</div>';
    Array.prototype.forEach.call(box.querySelectorAll('[data-sug]'), function (b) {
      b.addEventListener('click', function () { var i = $('#q'); i.value = b.getAttribute('data-sug'); mostrarResultados(i.value); i.focus(); });
    });
  }

  function telaCategoria(id) {
    var c = cat(id); if (!c) return naoAchou();
    var lista = doCat(id);
    main.innerHTML = '<div class="uma-folha"><button type="button" class="voltar" id="btVoltar">' + esc(t('voltar')) + '</button>' +
      '<section class="folha" aria-labelledby="hCat">' + ima(corDe(id)) +
      '<h1 class="mao" id="hCat"><span aria-hidden="true">' + c.ic + '</span> ' + esc(L(c)) + '</h1><p class="miudo">' + esc(t('itens')(lista.length)) + '</p>' +
      '<ul class="pauta">' + lista.map(linhaItem).join('') + '</ul></section></div>';
    $('#btVoltar').addEventListener('click', voltar);
  }

  function telaItem(id) {
    var g = item(id); if (!g) return naoAchou();
    var c = cat(g.cat), txt = L(g), lista = doCat(g.cat), pos = lista.indexOf(g);
    var ant = lista[pos - 1], prox = lista[pos + 1];
    main.innerHTML = '<div class="uma-folha"><button type="button" class="voltar" id="btVoltar">' + esc(t('voltar')) + '</button>' +
      '<article class="folha folha-item">' + ima(corDe(g.cat)) +
      '<p class="de-onde"><a href="#/c/' + c.id + '">' + c.ic + ' ' + esc(L(c)) + '</a>' + (g.socorro ? ' <span class="carimbo">' + esc(t('socorroTag')) + '</span>' : '') + '</p>' +
      '<h1 class="mao">' + esc(txt.t) + '</h1>' +
      '<ol class="pauta passos">' + txt.p.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
      '<p class="ps mao"><span class="ps-rot">' + esc(t('ps')) + '</span> ' + esc(txt.r) + '</p>' +
      '<div class="acoes"><button type="button" class="bt estrela' + (aprendi[g.id] ? ' feito' : '') + '" id="btAprendi" aria-pressed="' + (aprendi[g.id] ? 'true' : 'false') + '">' + esc(aprendi[g.id] ? t('aprendiFeito') : t('aprendiBt')) + '</button>' +
        '<button type="button" class="bt sec" id="btCompartilhar">' + esc(t('compartilhar')) + '</button></div>' +
      '<p class="ainda">' + esc(t('ainda')) + '</p></article>' +
      '<nav class="navega" aria-label="' + esc(L(c)) + '">' +
        (ant ? '<a href="#/i/' + ant.id + '">' + esc(t('anterior')) + ' <span class="miudo">' + esc(L(ant).t) + '</span></a>' : '<span></span>') +
        (prox ? '<a class="dir" href="#/i/' + prox.id + '">' + esc(t('proxima')) + ' <span class="miudo">' + esc(L(prox).t) + '</span></a>' : '') + '</nav></div>';
    $('#btVoltar').addEventListener('click', voltar);
    $('#btAprendi').addEventListener('click', function () {
      if (aprendi[g.id]) delete aprendi[g.id]; else aprendi[g.id] = Date.now();
      gravar('aprendi', aprendi);
      var b = $('#btAprendi'), on = !!aprendi[g.id];
      b.classList.toggle('feito', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? t('aprendiFeito') : t('aprendiBt');
      if (on) { b.classList.remove('pula'); void b.offsetWidth; b.classList.add('pula'); toast(t('subiu')(nivel().nome, nivel().a, GUIA.length)); }
    });
    $('#btCompartilhar').addEventListener('click', function () { compartilhar(g); });
  }

  function compartilhar(g) {
    var url = location.href.split('#')[0] + '#/i/' + g.id;
    var texto = t('compartilharTxt') + ' "' + L(g).t + '"';
    if (navigator.share) { navigator.share({ title: L(g).t, text: texto, url: url }).catch(function () {}); return; }
    var feito = function () { toast(t('copiado')); };
    if (navigator.clipboard) navigator.clipboard.writeText(texto + ' ' + url).then(feito, function () { prompt('', url); });
    else prompt('', url);
  }

  function telaAjustes() {
    var nv = nivel();
    main.innerHTML = '<div class="ajustes uma-folha"><button type="button" class="voltar" id="btVoltar">' + esc(t('voltar')) + '</button>' +
      '<h1 class="mao">⚙ ' + esc(t('ajustes')) + '</h1>' +
      '<section class="cartao"><h2>' + esc(t('ajIdioma')) + '</h2><p>' + esc(t('ajIdiomaTxt')) + '</p><div class="acoes">' +
        '<button type="button" class="bt' + (idioma === 'pt' ? '' : ' sec') + '" data-idioma="pt" aria-pressed="' + (idioma === 'pt') + '">🇧🇷 Português</button>' +
        '<button type="button" class="bt' + (idioma === 'en' ? '' : ' sec') + '" data-idioma="en" aria-pressed="' + (idioma === 'en') + '">🇺🇸 English</button></div></section>' +
      '<section class="cartao"><h2>' + esc(t('ajOffline')) + '</h2><p id="situacaoOffline">…</p>' +
        (instalado() ? '<p>' + esc(t('ajInstalado')) + '</p>' : '<button type="button" class="bt" id="btInstalarAj">' + esc(t('ajInstalar')) + '</button><div id="passosInstalarAj"></div>') + '</section>' +
      '<section class="cartao"><h2>' + esc(t('ajProgresso')) + '</h2><p><b>' + esc(nv.nome) + '</b>: ' + esc(t('medidorTxt')(nv.a, nv.total).split('.')[0]) + '</p>' +
        '<button type="button" class="bt sec" id="btZerar"' + (nv.a ? '' : ' disabled') + '>' + esc(t('ajZerar')) + '</button></section>' +
      '<section class="cartao"><details><summary>' + esc(t('ajVersao')(APP_VERSION, data(APP_UPDATED))) + '</summary><div id="novidades">…</div></details></section>' +
      '<section class="cartao"><h2>' + esc(t('ajSobre')) + '</h2><p>' + esc(t('ajSobreTxt')) + '</p><ul>' +
        t('ajFontes').map(function (f) { return '<li class="miudo">' + esc(f) + '</li>'; }).join('') + '</ul>' +
        '<p><b>' + esc(t('ajAviso')) + '</b></p><p class="miudo">' + esc(t('ajDados')) + '</p></section></div>';
    $('#btVoltar').addEventListener('click', voltar);
    Array.prototype.forEach.call(main.querySelectorAll('[data-idioma]'), function (b) {
      b.addEventListener('click', function () { trocarIdioma(b.getAttribute('data-idioma')); });
    });
    var bi = $('#btInstalarAj'); if (bi) bi.addEventListener('click', function () { instalar($('#passosInstalarAj')); });
    $('#btZerar').addEventListener('click', function () {
      if (!confirm(t('ajZerarPerg'))) return;
      aprendi = {}; gravar('aprendi', aprendi); toast(t('ajZerado')); telaAjustes();
    });
    situacaoOffline();
    novidades();
  }
  function situacaoOffline() {
    var el = $('#situacaoOffline'); if (!el) return;
    if (!('serviceWorker' in navigator) || !window.caches) { el.textContent = t('ajOfflineSem'); return; }
    caches.keys().then(function (ks) {
      var meu = ks.filter(function (k) { return k.indexOf('dgo-useless-man-') === 0; }).pop();
      el.textContent = meu ? t('ajOfflineOk')(meu.replace('dgo-useless-man-v', '')) : t('ajOfflineNao');
    }).catch(function () { el.textContent = t('ajOfflineNao'); });
  }
  function novidades() {
    fetch('versoes.json').then(function (r) { return r.json(); }).then(function (lista) {
      var el = $('#novidades'); if (!el) return;
      el.innerHTML = '<p class="rotulo">' + esc(t('ajNovidades')) + '</p>' + lista.slice(0, 5).map(function (v) {
        return '<div class="novidade"><b>' + esc(v.versao) + ', ' + esc(data(v.data)) + '</b><ul>' +
          (v[idioma] || v.pt).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
      }).join('');
    }).catch(function () { var el = $('#novidades'); if (el) el.textContent = ''; });
  }

  function naoAchou() { toast(t('naoAchei')); history.replaceState(history.state, '', '#/'); telaInicio(); }

  /* ---------- instalar na tela inicial ---------- */
  var pedidoInstalar = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedidoInstalar = e; });
  window.addEventListener('appinstalled', function () { pedidoInstalar = null; gravar('instalado', true); });
  function instalado() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function podeOferecerInstalar() { return !instalado() && !ler('instalado', false); }
  function instalar(destino) {
    if (pedidoInstalar) {
      pedidoInstalar.prompt();
      pedidoInstalar.userChoice.then(function (r) { if (r.outcome === 'accepted') gravar('instalado', true); pedidoInstalar = null; });
      return;
    }
    var ua = navigator.userAgent, passos, extra = '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) passos = t('instIos');
    else if (/SamsungBrowser/.test(ua)) {
      passos = t('instSamsung');
      var url = location.href.replace(/^https?:\/\//, '');
      extra = '<a class="bt" href="intent://' + esc(url) + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(location.href) + ';end">' + esc(t('abrirChrome')) + '</a> ';
    } else passos = t('instChrome');
    destino.innerHTML = '<div class="passo-a-passo"><ol>' + passos.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>' +
      '<div class="acoes" style="margin-top:.6rem">' + extra + '<button type="button" class="bt sec" id="btJaInstalei">' + esc(t('jaInstalei')) + '</button></div></div>';
    $('#btJaInstalei', destino).addEventListener('click', function () { gravar('instalado', true); destino.innerHTML = '<p>' + esc(t('ajInstalado')) + '</p>'; });
  }

  /* ---------- idioma ---------- */
  function trocarIdioma(novo) {
    if (novo !== 'pt' && novo !== 'en') return;
    idioma = novo; gravar('idioma', idioma); textosFixos(); desenhar();
  }
  function textosFixos() {
    document.documentElement.lang = idioma === 'pt' ? 'pt-BR' : 'en';
    document.title = idioma === 'pt' ? 'The Useless Man — Guia do Homem Inútil Offline' : 'The Useless Man — The Useless Man\'s Guide, Offline';
    $('#subtitulo').textContent = t('subtitulo');
    $('#pular').textContent = t('pular');
    $('#marca').setAttribute('aria-label', t('inicio'));
    $('#btInicio').setAttribute('aria-label', t('inicio'));
    $('#btBusca').setAttribute('aria-label', t('buscar'));
    $('#btAjustes').setAttribute('aria-label', t('ajustes'));
    Array.prototype.forEach.call(document.querySelectorAll('.idioma [data-idioma]'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-idioma') === idioma ? 'true' : 'false');
    });
    seloOffline();
  }

  /* ---------- navegação e botão Voltar do celular ----------
     Cada tela é uma entrada no histórico (#/...). Na tela inicial, o primeiro Voltar só avisa;
     o segundo sai (regra da plataforma). A entrada de guarda só é criada depois de um toque. */
  function rota() { return (location.hash || '#/').replace(/^#\/?/, '').split('/'); }
  function desenhar() {
    var r = rota();
    $('#btInicio').removeAttribute('aria-current'); $('#btAjustes').removeAttribute('aria-current');
    if (r[0] === 'c') telaCategoria(r[1]);
    else if (r[0] === 'i') telaItem(r[1]);
    else if (r[0] === 'ajustes') { telaAjustes(); $('#btAjustes').setAttribute('aria-current', 'page'); }
    else { telaInicio(); $('#btInicio').setAttribute('aria-current', 'page'); }
  }
  function ehInicio() { var r = rota(); return !r[0]; }
  function irPara(h) { if (location.hash === h || (h === '#/' && ehInicio())) { desenhar(); return; } location.hash = h; }
  // Sempre existe a entrada do Início por baixo (ver "começar"), então voltar nunca sai do app.
  function voltar() { if (!ehInicio()) history.back(); }

  function criarGuarda() {
    if (ehInicio() && history.state && history.state.inicio) history.pushState({ guarda: 1 }, '', '#/');
  }
  window.addEventListener('popstate', function (e) {
    if (e.state && e.state.inicio && ehInicio()) toast(t('sairAviso'));
  });
  window.addEventListener('hashchange', function () {
    desenhar();
    if (!ehInicio()) main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });
  document.addEventListener('pointerup', criarGuarda);

  $('#marca').addEventListener('click', function () { irPara('#/'); });
  $('#btInicio').addEventListener('click', function () { irPara('#/'); });
  $('#btAjustes').addEventListener('click', function () { irPara('#/ajustes'); });
  $('#btBusca').addEventListener('click', function () {
    var foca = function () { var q = $('#q'); if (q) { q.focus(); q.scrollIntoView({ block: 'center' }); } };
    if (ehInicio()) foca(); else { irPara('#/'); setTimeout(foca, 50); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('.idioma [data-idioma]'), function (b) {
    b.addEventListener('click', function () { trocarIdioma(b.getAttribute('data-idioma')); });
  });

  /* ---------- sem internet ---------- */
  function seloOffline() {
    var s = $('#seloOffline'); s.textContent = t('semInternet'); s.hidden = navigator.onLine !== false;
  }
  window.addEventListener('online', function () { seloOffline(); conferirVersao(); });
  window.addEventListener('offline', seloOffline);

  /* ---------- aviso de versão nova (nunca recarrega sozinho) ---------- */
  var ignorada = null;
  function conferirVersao() {
    if (navigator.onLine === false) return;
    fetch('versoes.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (lista) {
      var v = lista && lista[0] && lista[0].versao;
      if (!v || v === APP_VERSION || v === ignorada) return;
      var el = $('#avisoVersao');
      el.innerHTML = '<span>' + esc(t('versaoNova')(v)) + '</span><button type="button" id="btAtualizar">' + esc(t('atualizar')) + '</button><button type="button" class="sec" id="btDepois">' + esc(t('depois')) + '</button>';
      el.hidden = false;
      $('#btDepois').addEventListener('click', function () { ignorada = v; el.hidden = true; });
      $('#btAtualizar').addEventListener('click', atualizarAgora);
    }).catch(function () {});
  }
  function atualizarAgora() {
    var recarregar = function () { location.reload(); };
    if (!('serviceWorker' in navigator)) return recarregar();
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) return recarregar();
      var limite = setTimeout(recarregar, 15000);
      navigator.serviceWorker.addEventListener('controllerchange', function () { clearTimeout(limite); recarregar(); });
      reg.update().then(function () { if (!reg.installing && !reg.waiting) { clearTimeout(limite); recarregar(); } }).catch(recarregar);
    }).catch(recarregar);
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) conferirVersao(); });
  setInterval(conferirVersao, 30 * 60 * 1000);

  /* ---------- começar ---------- */
  // Rota inicial: marca a primeira entrada (para o aviso de sair). Link compartilhado (#/i/x) ganha o Início por baixo.
  var inicial = location.hash;
  history.replaceState({ inicio: 1 }, '', '#/');
  if (inicial && inicial !== '#/' && inicial !== '#') { history.pushState({}, '', inicial); }
  textosFixos();
  desenhar();
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  setTimeout(conferirVersao, 3000);
})();
