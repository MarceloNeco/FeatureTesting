/* =====================================================================
   ARCHONE (MAPA VIVO) — PROTÓTIPO F0  (mapa.js, 23/Out/2026; cópia no Feature Testing em 31/Out/2026)
   ---------------------------------------------------------------------
   Nível 0 (plataforma) e nível 1 (um app aberto por vez), lidos dos manifestos. Cytoscape.js + fcose +
   expand-collapse (decisão do benchmark). Sem build, sem CDN. Tokens visuais vêm do mapa.css (design system
   do RootifyONE); o Cytoscape lê as variáveis CSS na hora, então o tema claro/escuro vale no grafo também.
   O que NÃO está aqui de propósito: estado vivo (vem da sonda sol_mapa na F2), nível 2 (fluxo) e roadmap.
   Esta cópia mora no Feature Testing só até o portal próprio (arch-one) nascer na F1; o original fica em
   rootify-one/docs/specs/mapa-vivo/prototipo/. Mudança de verdade: lá, depois copiar para cá.
   ===================================================================== */
(function () {
  'use strict';
  var d = document, $ = function (s) { return d.querySelector(s); };
  var MANIFESTOS = ['manifestos/omnilife-one.arquitetura.json', 'manifestos/rootify-one.arquitetura.json', 'manifestos/solverone-app.arquitetura.json'];
  var est = { lingua: 'pt', camada: 'nenhuma', dados: null, grafo: null, cy: null, api: null, appAberto: null, selecionado: null, achados: [] };
  var reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function T(pt, en) { return est.lingua === 'en' ? en : pt; }
  var NOMES = {
    servico: ['Serviço de nuvem', 'Cloud service'], app: ['App', 'App'], modulo: ['Módulo', 'Module'], dado: ['Dado', 'Data'],
    integracao: ['Integração', 'Integration'], robo: ['Robô (GitHub Actions)', 'Robot (GitHub Actions)'], fluxo: ['Fluxo', 'Flow']
  };
  var LIG = { hospeda: ['hospeda', 'hosts'], 'publica-em': ['publica em', 'publishes to'], le: ['lê', 'reads'], escreve: ['escreve', 'writes'], autentica: ['autentica', 'authenticates'], resolve: ['resolve', 'resolves'], envia: ['envia por', 'sends via'], chama: ['chama', 'calls'], depende: ['depende de', 'depends on'], usa: ['usa', 'uses'], 'roda-em': ['roda em', 'runs on'], 'fluxo-modulo': ['passa por', 'goes through'], 'fluxo-dado': ['mexe em', 'touches'], 'fluxo-integracao': ['chama', 'calls'], 'fluxo-robo': ['dispara', 'triggers'] };
  var CHAVE = { nenhuma: ['sem chave', 'no key'], publica: ['chave pública', 'public key'], 'da-pessoa': ['chave da pessoa', "person's key"], 'do-servidor': ['chave do servidor', 'server key'] };
  var ONDE_CHAVE = { 'nao-se-aplica': ['—', '—'], cofre: ['no cofre cifrado da pessoa', "in the person's encrypted vault"], 'secrets-edge-function': ['nos Secrets da Edge Function', 'in the Edge Function Secrets'], 'secrets-actions': ['nos Secrets do GitHub Actions', 'in the GitHub Actions Secrets'] };
  var ONDE = { aparelho: ['no aparelho da pessoa', "on the person's device"], supabase: ['no Supabase', 'in Supabase'], 'arquivo-publico': ['em arquivo público (solverone-dados)', 'in a public file (solverone-dados)'], 'drive-da-pessoa': ['no drive da pessoa', "in the person's drive"], 'servidor-externo': ['num servidor externo', 'on an external server'] };

  /* ---------- tokens do CSS ---------- */
  function tok(nome) { return getComputedStyle(d.documentElement).getPropertyValue(nome).trim(); }
  function estilo() {
    var t = { fundo: tok('--fundo'), sup: tok('--sup'), sup2: tok('--sup2'), sup3: tok('--sup3'), linha: tok('--linha'), linhaF: tok('--linha-forte'), txt: tok('--txt'), txt2: tok('--txt2'), txt3: tok('--txt3'), ac: tok('--acento'), acS: tok('--acento-suave'), acB: tok('--acento-borda'), ok: tok('--ok'), okF: tok('--ok-f'), at: tok('--at'), atF: tok('--at-f'), er: tok('--er'), erF: tok('--er-f'), info: tok('--info'), infoF: tok('--info-f'), cinza: tok('--cinza'), cinzaF: tok('--cinza-f') };
    var rotulo = { label: 'data(label)', color: t.txt2, 'font-family': 'Inter, Segoe UI, system-ui, sans-serif', 'font-size': 10, 'text-wrap': 'ellipsis', 'text-max-width': 100, 'text-valign': 'bottom', 'text-margin-y': 5, 'min-zoomed-font-size': 7 };
    return [
      { selector: 'node', style: Object.assign({ 'background-color': t.sup3, 'border-color': t.linhaF, 'border-width': 1.2, width: 30, height: 30, shape: 'round-rectangle', 'overlay-opacity': 0, 'transition-property': 'background-color, border-color, border-width, opacity', 'transition-duration': reduzido ? 0 : 150 }, rotulo) },
      { selector: 'node.n0', style: { 'text-wrap': 'wrap', 'text-max-width': 118, 'font-size': 10.5 } },
      { selector: 'node.servico', style: { shape: 'round-hexagon', width: 40, height: 40, 'background-color': t.sup2 } },
      { selector: 'node.app', style: { width: 40, height: 32, 'background-color': t.acS, 'border-color': t.acB, 'font-weight': 600, color: t.txt } },
      { selector: 'node.app[!temManifesto]', style: { 'background-color': t.cinzaF, 'border-color': t.linhaF, 'border-style': 'dashed', color: t.txt3, 'font-weight': 400 } },
      { selector: 'node.cy-expand-collapse-collapsed-node', style: { width: 56, height: 36, 'background-color': t.acS, 'border-color': t.acB, 'border-width': 1.5, shape: 'round-rectangle' } },
      { selector: ':parent', style: { 'background-color': t.sup, 'background-opacity': .55, 'border-color': t.ac, 'border-width': 1.5, 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -8, 'font-size': 12, 'font-weight': 650, color: t.txt, padding: 22, shape: 'round-rectangle', 'text-max-width': 400 } },
      { selector: 'node.n1', style: { 'text-max-width': 84, 'font-size': 9.5 } },
      { selector: 'node.modulo', style: { shape: 'round-rectangle', width: 34, height: 24 } },
      { selector: 'node.dado', style: { shape: 'barrel', width: 30, height: 30, 'background-color': t.sup2 } },
      { selector: 'node.integracao', style: { shape: 'diamond', width: 30, height: 30, 'background-color': t.sup2 } },
      { selector: 'node.robo', style: { shape: 'triangle', width: 30, height: 28, 'background-color': t.sup2 } },
      { selector: 'node.fluxo', style: { shape: 'ellipse', width: 30, height: 30, 'background-color': t.sup, 'border-style': 'dashed' } },
      { selector: 'edge', style: { width: 1.1, 'line-color': t.linhaF, 'target-arrow-color': t.linhaF, 'target-arrow-shape': 'triangle', 'arrow-scale': .7, 'curve-style': 'bezier', 'overlay-opacity': 0, 'transition-property': 'opacity, line-color', 'transition-duration': reduzido ? 0 : 150 } },
      { selector: 'edge.n0', style: { 'font-size': 8, color: t.txt2, 'text-rotation': 'autorotate', 'text-background-color': t.fundo, 'text-background-opacity': 1, 'text-background-padding': 2, 'text-background-shape': 'roundrectangle' } },
      { selector: 'edge.n0.vizinho', style: { label: 'data(label)' } },
      { selector: 'edge.cruza', style: { 'line-style': 'dashed', 'line-dash-pattern': [5, 4], 'line-color': t.acB, 'target-arrow-color': t.acB } },
      { selector: 'edge.n1', style: { width: .9, 'target-arrow-shape': 'none', 'line-color': t.linha } },
      { selector: 'edge.fluxo-modulo, edge.fluxo-dado, edge.fluxo-integracao, edge.fluxo-robo', style: { 'line-style': 'dotted', 'line-color': t.linhaF } },
      /* foco e vizinhança (responde ao toque; o resto apaga) */
      { selector: '.dim', style: { opacity: .18 } },
      { selector: 'node.foco', style: { 'border-color': t.ac, 'border-width': 3, color: t.txt, 'font-weight': 650 } },
      { selector: 'node.vizinho', style: { 'border-color': t.ac, 'border-width': 2 } },
      { selector: 'edge.vizinho', style: { 'line-color': t.ac, 'target-arrow-color': t.ac, width: 2 } },
      { selector: 'node.achado', style: { 'border-color': t.ac, 'border-width': 2.5 } },
      /* camadas */
      { selector: 'node.cam-ok', style: { 'background-color': t.okF, 'border-color': t.ok } },
      { selector: 'node.cam-at', style: { 'background-color': t.atF, 'border-color': t.at } },
      { selector: 'node.cam-er', style: { 'background-color': t.erF, 'border-color': t.er } },
      { selector: 'node.cam-info', style: { 'background-color': t.infoF, 'border-color': t.info } },
      { selector: 'node.cam-neutro', style: { 'background-color': t.cinzaF, 'border-color': t.linha, color: t.txt3 } },
      { selector: 'node.sem-sonda', style: { 'border-style': 'dashed', 'border-color': t.linhaF, 'background-color': t.sup } }
    ];
  }

  /* ---------- montar ---------- */
  function montar() {
    est.grafo = MapaModelo.grafo(est.dados.plataforma, est.dados.manifestos, { lingua: est.lingua });
    cytoscape.use(cytoscapeFcose); cytoscape.use(cytoscapeDagre); cytoscape.use(cytoscapeExpandCollapse);
    est.cy = cytoscape({ container: $('#grafo'), elements: MapaModelo.paraCytoscape(est.grafo), style: estilo(), wheelSensitivity: .2, minZoom: .15, maxZoom: 3, boxSelectionEnabled: false, autounselectify: true });
    est.api = est.cy.expandCollapse({ layoutBy: null, fisheye: false, animate: false, undoable: false, cueEnabled: false });
    est.api.collapseAll();
    layoutNivel0(); est.cy.fit(undefined, 30); ligarEventos(); trilha();
    return Promise.resolve();
  }
  /* Nível 0 em RAIAS (colunas por papel), determinístico: o mapa não "pula" entre visitas.
     domínio e DNS → hospedagem, repositórios e robôs → apps → banco, auth, storage e funções → e-mail, IA e APIs de fora */
  var RAIAS = [['dominio', 'dns', 'cdn'], ['hospedagem', 'repositorios', 'robos', 'monitoramento'], ['app'], ['banco', 'auth', 'storage', 'funcoes', 'dados-publicados'], ['email-recebimento', 'email-envio', 'ia', 'api-externa']];
  function layoutNivel0() {
    var cy = est.cy, X = 230, Y = 92, colunas = RAIAS.map(function () { return []; });
    cy.nodes('.n0').forEach(function (n) {
      var m = modelo(n.id()); if (!m) return;
      var chave = m.tipo === 'app' ? 'app' : m.subtipo, c = 0;
      RAIAS.forEach(function (r, i) { if (r.indexOf(chave) !== -1) c = i; });
      colunas[c].push({ n: n, ordem: (RAIAS[c].indexOf(chave)) * 100 + (m.temManifesto ? 0 : 50) + (m.rotuloCurto || '').toLowerCase().charCodeAt(0) / 1000 });
    });
    /* a coluna dos apps é alta: vira duas colunas quando passa de 7 */
    var alturaMax = Math.max.apply(null, colunas.map(function (c, i) { return i === 2 ? Math.ceil(c.length / 2) : c.length; }));
    colunas.forEach(function (col, i) {
      col.sort(function (a, b) { return a.ordem - b.ordem; });
      var duas = i === 2 && col.length > 7, meio = Math.ceil(col.length / 2);
      col.forEach(function (it, k) {
        var sub = duas ? (k < meio ? 0 : 1) : 0, linha = duas ? (sub ? k - meio : k) : k, total = duas ? (sub ? col.length - meio : meio) : col.length;
        var x = i * X + (duas ? (sub ? 60 : -60) : 0), y = (linha - (total - 1) / 2) * Y + (alturaMax * Y) / 2;
        it.n.position({ x: x, y: y });
      });
    });
  }
  /* Nível 1: só o app aberto e o que fala com ele; dentro do app, fcose; os serviços ligados ficam numa coluna à esquerda */
  function layoutNivel1(slug) {
    var cy = est.cy, app = noDe(slug), filhos = app.descendants();
    var l = filhos.union(filhos.connectedEdges().filter(function (e) { return filhos.has(e.source()) && filhos.has(e.target()); })).layout({ name: 'fcose', animate: false, randomize: true, quality: 'proof', fit: false, nodeRepulsion: function () { return 9000; }, idealEdgeLength: function () { return 90; }, nodeSeparation: 120, tile: true, tilingPaddingVertical: 46, tilingPaddingHorizontal: 64, packComponents: false });
    var p = l.promiseOn('layoutstop'); l.run();
    return p.then(function () {
      var bb = app.boundingBox(), ligados = app.descendants().connectedEdges().connectedNodes().filter('.n0').not(app);
      ligados = ligados.union(app.connectedEdges().connectedNodes().filter('.n0').not(app));
      var lista = ligados.toArray().sort(function (a, b) { return (modelo(a.id()).subtipo || 'zz').localeCompare(modelo(b.id()).subtipo || 'zz'); });
      lista.forEach(function (n, k) { n.position({ x: bb.x1 - 200, y: bb.y1 + 20 + k * 84 }); });
      cy.nodes('.n0').not(app).not(ligados).forEach(function (n) { n.hide(); });
      cy.edges('.n0').forEach(function (e) { if (!e.source().visible() || !e.target().visible()) e.hide(); });
    });
  }
  function noDe(id) { var n = est.cy.getElementById(id); return n.length ? n : null; }
  function modelo(id) { for (var i = 0; i < est.grafo.nos.length; i++) if (est.grafo.nos[i].id === id) return est.grafo.nos[i]; return null; }

  /* ---------- abrir e fechar um app (um por vez; o resto recolhido) ---------- */
  function abrirApp(slug) {
    if (est.appAberto === slug) return Promise.resolve();
    var abertoAntes = est.appAberto;
    if (abertoAntes) est.api.collapse(noDe(abertoAntes));
    var n = noDe(slug);
    if (!n || !est.api.isExpandable(n)) { est.appAberto = null; trilha(); return Promise.resolve(); }
    est.cy.elements().show();
    est.api.expand(n);
    est.appAberto = slug;
    return layoutNivel1(slug).then(function () { est.cy.animate({ fit: { eles: est.cy.elements(':visible'), padding: 36 } }, { duration: reduzido ? 0 : 320, easing: 'ease-in-out-cubic' }); trilha(); aplicarCamada(); });
  }
  function fecharApp() {
    if (!est.appAberto) return Promise.resolve();
    var n = noDe(est.appAberto); est.api.collapse(n); est.appAberto = null; limparFoco();
    est.cy.elements().show(); layoutNivel0();
    est.cy.animate({ fit: { padding: 30 } }, { duration: reduzido ? 0 : 320 }); trilha(); aplicarCamada();
    return Promise.resolve();
  }
  /* no celular, a ficha cobre a metade de baixo: o nó focado sobe para a metade de cima */
  function trazerParaCima(id) {
    var n = noDe(id); if (!n) return;
    est.cy.animate({ center: { eles: n } }, { duration: reduzido ? 0 : 250, complete: function () { if (innerWidth <= 760) est.cy.panBy({ x: 0, y: -est.cy.height() * .22 }); } });
  }

  /* ---------- foco: o nó, a vizinhança, e o resto apaga ---------- */
  function limparFoco() { est.cy.elements().removeClass('dim foco vizinho'); est.selecionado = null; }
  function focar(id) {
    var n = noDe(id); if (!n) return;
    est.cy.elements().removeClass('foco vizinho');
    est.selecionado = id;
    var viz = n.closedNeighborhood();
    if (n.isParent()) viz = viz.union(n.descendants()).union(n.descendants().connectedEdges());
    est.cy.elements().addClass('dim'); viz.removeClass('dim'); n.ancestors().removeClass('dim');
    n.addClass('foco'); viz.not(n).addClass('vizinho');
    ficha(id);
    if (innerWidth <= 760 && !n.isParent()) trazerParaCima(id);
  }

  /* ---------- a ficha: o mesmo painel muda de conteúdo ---------- */
  function selo(txt, classe) { return '<span class="selo ' + (classe || '') + '">' + txt + '</span>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fato(dt, dd) { return dd ? '<dt>' + esc(dt) + '</dt><dd>' + dd + '</dd>' : ''; }
  function mono(lista) { return (lista || []).map(function (x) { return '<code>' + esc(x) + '</code>'; }).join(', '); }
  function ficha(id) {
    var m = modelo(id); if (!m) return;
    var f = $('#ficha'); f.hidden = false;
    $('#ficha-tipo').innerHTML = '<svg class="g" aria-hidden="true"><use href="#g-' + m.tipo + '"/></svg>' + esc(T.apply(null, NOMES[m.tipo])) + (m.pai ? ' · ' + esc(modelo(m.pai).rotulo) : '');
    $('#ficha-nome').textContent = m.rotulo;
    var resumo = '', fatos = '', estado = '';
    if (m.tipo === 'servico') {
      resumo = m.limites || '';
      fatos = fato(T('Fornecedor', 'Provider'), esc(m.fornecedor)) + fato(T('Plano', 'Plan'), esc(m.plano)) + fato(T('Chave', 'Key'), selo(T.apply(null, CHAVE[m.chave]), m.chave === 'da-pessoa' ? 'ok' : m.chave === 'do-servidor' ? 'info' : '') + (m.onde_chave !== 'nao-se-aplica' ? ' ' + esc(T.apply(null, ONDE_CHAVE[m.onde_chave])) : ''));
      estado = m.fonte ? T('A sonda chega na F2 e vai ler: ', 'The probe arrives in F2 and will read: ') + m.fonte : T('Sem fonte de estado: entra como dado declarado.', 'No live source: declared data only.');
    } else if (m.tipo === 'app') {
      resumo = m.descricao || (m.temManifesto ? '' : T('Este app ainda não tem manifesto. Entra na F1, com uma filha em Sonnet e o contrato pronto.', 'This app has no manifest yet. It comes in F1, with a Sonnet session and the contract ready.'));
      fatos = fato(T('Repositório', 'Repository'), m.repositorio ? '<code>' + esc(m.repositorio) + '</code> · ' + esc(m.visibilidade === 'privado' ? T('privado', 'private') : T('público', 'public')) : '') + fato(T('Hospedagem', 'Hosting'), esc(m.hospedagem)) + fato(T('Endereço', 'Address'), m.url ? '<a href="' + esc(m.url) + '" rel="noopener" target="_blank">' + esc(m.url.replace(/^https:\/\//, '')) + '</a>' : '') + fato(T('Estado', 'Status'), esc(m.estado)) + fato(T('Versão', 'Version'), m.versao ? '<code>' + esc(m.versao) + '</code>' : '') + fato(T('Manifesto', 'Manifest'), m.temManifesto ? selo(T('lido', 'read'), 'ok') : selo(T('ainda não', 'not yet'), 'at'));
      estado = T('A sonda chega na F2 e vai mostrar: no ar ou fora, tempo de resposta, último deploy, versão servida, último PR e o resultado dos robôs.', 'The probe arrives in F2 and will show: up or down, response time, last deploy, served version, last PR and robot results.');
    } else if (m.tipo === 'modulo') {
      resumo = m.descricao || '';
      fatos = fato(T('Arquivos', 'Files'), mono(m.arquivos)) + fato(T('Interruptor', 'Switch'), m.recurso ? '<code>' + esc(m.recurso) + '</code> ' + esc(T('(Modo DEUS desliga)', '(GOD mode can turn it off)')) : esc(T('não desligável pelo Modo DEUS', 'cannot be switched off by GOD mode')));
      estado = T('Na F2: ligado ou desligado no Controle dos apps.', 'In F2: on or off in App control.');
    } else if (m.tipo === 'dado') {
      resumo = m.retencao || '';
      fatos = fato(T('Onde fica', 'Where it lives'), esc(T.apply(null, ONDE[m.onde]))) + fato(T('Tabelas', 'Tables'), mono(m.tabelas)) + fato(T('De pessoa', 'Personal'), m.pessoal ? selo(T('sim', 'yes'), 'info') : selo(T('não', 'no'))) + fato(T('Sensível (LGPD)', 'Sensitive (LGPD)'), m.sensivel ? selo(T('sim', 'yes'), m.cifrado ? 'ok' : 'at') + (m.cifrado ? ' ' + esc(T('cifrado no aparelho', 'encrypted on the device')) : ' ' + esc(T('sem cifra no aparelho declarada', 'no device encryption declared'))) : selo(T('não', 'no')));
      estado = m.onde === 'supabase' ? T('Na F2: tamanho de cada tabela, RLS ligada, GRANT por papel (catálogos do Supabase).', 'In F2: size of each table, RLS on, GRANT per role (Supabase catalogs).') : T('Dado do aparelho ou arquivo: sem sonda.', 'Device or file data: no probe.');
    } else if (m.tipo === 'integracao') {
      fatos = fato(T('Tipo', 'Type'), esc(m.subtipo)) + fato('Host', m.host ? '<code>' + esc(m.host) + '</code>' : '') + fato(T('Chave', 'Key'), selo(T.apply(null, CHAVE[m.chave]), m.chave === 'da-pessoa' ? 'ok' : m.chave === 'do-servidor' ? 'info' : '') + (m.onde_chave !== 'nao-se-aplica' ? ' ' + esc(T.apply(null, ONDE_CHAVE[m.onde_chave])) : '')) + fato(T('Plano', 'Plan'), esc(m.plano)) + fato(T('Contrato', 'Contract'), m.contrato ? '<code>' + esc(m.contrato) + '</code>' : '');
      estado = T('Na F2: última chamada com sucesso e limite do plano (quando a API do serviço expõe).', 'In F2: last successful call and plan limit (when the service API exposes it).');
    } else if (m.tipo === 'robo') {
      resumo = m.faz || '';
      fatos = fato(T('Cadência', 'Schedule'), esc(m.cadencia)) + fato('Workflow', '<code>' + esc(m.workflow) + '</code>');
      estado = T('Na F2: resultado da última execução (verde, vermelho, quando).', 'In F2: last run result (green, red, when).');
    } else if (m.tipo === 'fluxo') {
      resumo = m.gatilho ? T('Começa com: ', 'Starts with: ') + m.gatilho : '';
      fatos = fato(T('Passos', 'Steps'), '<ol style="margin:0;padding-left:1.1rem">' + (m.passos || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>');
      estado = T('O nível 2 (gatilho → passos → integrações como desenho) entra na F1.', 'Level 2 (trigger → steps → integrations drawn) comes in F1.');
    }
    $('#ficha-resumo').textContent = resumo; $('#ficha-resumo').hidden = !resumo;
    $('#ficha-fatos').innerHTML = fatos;
    $('#ficha-estado').textContent = estado;
    /* ligações: a vizinhança, clicável */
    var n = noDe(id), lis = [];
    var arestas = n.isParent() ? n.descendants().connectedEdges().filter(function (e) { return !e.source().ancestors().union(e.source()).has(n) || !e.target().ancestors().union(e.target()).has(n); }) : n.connectedEdges();
    if (n.isParent() || n.hasClass('cy-expand-collapse-collapsed-node')) {
      var cont = {}; est.grafo.nos.forEach(function (x) { if (x.pai === id) cont[x.tipo] = (cont[x.tipo] || 0) + 1; });
      var partes = Object.keys(cont).map(function (k) { return cont[k] + ' ' + T.apply(null, NOMES[k]).toLowerCase().replace(/ \(.*\)/, ''); });
      if (partes.length) lis.push('<li><button type="button" data-ir="' + esc(id) + '"><svg class="g" aria-hidden="true"><use href="#g-app"/></svg>' + esc(T('Dentro: ', 'Inside: ') + partes.join(', ')) + '</button></li>');
      if (!n.isParent()) arestas = n.connectedEdges();
    }
    var vistos = {};
    arestas.forEach(function (e) {
      var outro = e.source().id() === id || e.source().ancestors().has(n) ? e.target() : e.source();
      var oid = outro.id(); if (oid === id || vistos[oid]) return; vistos[oid] = 1;
      var om = modelo(oid) || { tipo: 'app', rotulo: oid };
      var lig = LIG[e.data('tipo')] ? T.apply(null, LIG[e.data('tipo')]) : e.data('tipo');
      lis.push('<li><button type="button" data-ir="' + esc(oid) + '"><svg class="g" aria-hidden="true"><use href="#g-' + om.tipo + '"/></svg><span>' + esc(om.rotulo) + '</span><span class="tipo">' + esc(lig) + '</span></button></li>');
    });
    $('#ficha-ligacoes-titulo').textContent = T('Ligações', 'Connections') + (lis.length ? ' (' + lis.length + ')' : '');
    $('#ficha-ligacoes').innerHTML = lis.join('') || '<li class="vazio">' + esc(T('Nenhuma ligação declarada no manifesto.', 'No connection declared in the manifest.')) + '</li>';
    var b = $('#ficha-abrir');
    if (m.tipo === 'app' && m.temManifesto) { b.hidden = false; b.textContent = est.appAberto === id ? T('Fechar o app', 'Close the app') : T('Abrir o app', 'Open the app'); b.onclick = function () { (est.appAberto === id ? fecharApp() : abrirApp(id).then(function () { focar(id); })); }; }
    else if (m.tipo === 'app') { b.hidden = true; }
    else { b.hidden = false; b.textContent = T('Centralizar', 'Center on it'); b.onclick = function () { est.cy.animate({ center: { eles: noDe(id) }, zoom: Math.max(est.cy.zoom(), 1.4) }, { duration: reduzido ? 0 : 300 }); }; }
  }
  function fecharFicha() { $('#ficha').hidden = true; limparFoco(); }
  function irPara(id) {
    var m = modelo(id); if (!m) return;
    var p = m.pai && est.appAberto !== m.pai ? abrirApp(m.pai) : Promise.resolve();
    p.then(function () { focar(id); if (innerWidth > 760) est.cy.animate({ center: { eles: noDe(id) } }, { duration: reduzido ? 0 : 250 }); });
  }

  /* ---------- trilha (nível) ---------- */
  function trilha() {
    var ol = $('#trilha'); ol.innerHTML = '';
    var li = d.createElement('li'), b = d.createElement('button'); b.type = 'button'; b.textContent = T('Plataforma', 'Platform'); b.onclick = function () { fecharApp(); fecharFicha(); }; li.appendChild(b); ol.appendChild(li);
    if (est.appAberto) { var li2 = d.createElement('li'), b2 = d.createElement('button'); b2.type = 'button'; b2.textContent = modelo(est.appAberto).rotulo; b2.onclick = function () { focar(est.appAberto); est.cy.animate({ fit: { eles: noDe(est.appAberto), padding: 40 } }, { duration: reduzido ? 0 : 300 }); }; li2.appendChild(b2); ol.appendChild(li2); }
  }

  /* ---------- camadas ---------- */
  var LEGENDA = {
    seguranca: [[['ok', 'chave no cofre / dado cifrado', 'key in vault / data encrypted'], ['info', 'chave do servidor (Secrets)', 'server key (Secrets)'], ['at', 'sensível sem cifra declarada', 'sensitive without declared encryption'], ['neutro', 'sem chave', 'no key']]],
    dados: [[['at', 'sensível (LGPD)', 'sensitive (LGPD)'], ['info', 'de pessoa', 'personal'], ['neutro', 'da plataforma', "platform's own"]]],
    estado: [[['neutro', 'sem sonda ainda: o estado chega na F2', 'no probe yet: status arrives in F2']]]
  };
  function aplicarCamada() {
    var cy = est.cy; cy.nodes().removeClass('cam-ok cam-at cam-er cam-info cam-neutro sem-sonda');
    var c = est.camada;
    if (c !== 'nenhuma') cy.nodes().forEach(function (n) {
      var m = modelo(n.id()); if (!m) return;
      var cl = null;
      if (c === 'seguranca') {
        if (m.tipo === 'integracao' || m.tipo === 'servico') cl = m.chave === 'da-pessoa' ? 'ok' : m.chave === 'do-servidor' ? 'info' : 'neutro';
        else if (m.tipo === 'dado') cl = m.sensivel ? (m.cifrado ? 'ok' : 'at') : m.pessoal ? 'info' : 'neutro';
        else if (m.tipo === 'app' && m.visibilidade) cl = m.visibilidade === 'privado' ? 'info' : 'neutro';
        else cl = 'neutro';
      } else if (c === 'dados') {
        if (m.tipo === 'dado') cl = m.sensivel ? 'at' : m.pessoal ? 'info' : 'neutro'; else cl = 'neutro';
      } else if (c === 'estado') { n.addClass('sem-sonda'); return; }
      if (cl) n.addClass('cam-' + cl);
    });
    var lg = $('#legenda-camada');
    if (c === 'nenhuma') { lg.hidden = true; lg.innerHTML = ''; return; }
    lg.hidden = false; lg.innerHTML = LEGENDA[c][0].map(function (x) { return '<span><i style="background:var(--' + (x[0] === 'neutro' ? 'cinza' : x[0]) + ')"></i>' + esc(est.lingua === 'en' ? x[2] : x[1]) + '</span>'; }).join('');
  }

  /* ---------- busca ---------- */
  function normal(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function buscar(q) {
    var cy = est.cy; cy.nodes().removeClass('achado'); est.achados = [];
    q = normal(q.trim()); var out = $('#busca-n');
    if (!q) { if (!est.selecionado) cy.elements().removeClass('dim'); out.value = ''; return; }
    est.grafo.nos.forEach(function (m) {
      var alvo = [m.rotulo, m.id, m.host, (m.tabelas || []).join(' '), m.repositorio, m.fornecedor].map(normal).join(' ');
      if (alvo.indexOf(q) !== -1) est.achados.push(m.id);
    });
    cy.elements().addClass('dim');
    est.achados.forEach(function (id) { var n = noDe(id); if (!n) return; n.removeClass('dim').addClass('achado'); n.ancestors().removeClass('dim'); if (n.isChild() && !n.visible()) n.ancestors().removeClass('dim').addClass('achado'); });
    out.value = est.achados.length ? est.achados.length + ' ' + T('encontrados', 'found') : T('nada', 'nothing');
  }

  /* ---------- idioma e tema ---------- */
  function traduzir() {
    d.documentElement.lang = est.lingua === 'en' ? 'en' : 'pt-BR';
    d.querySelectorAll('[data-pt]').forEach(function (e) { e.textContent = e.getAttribute(est.lingua === 'en' ? 'data-en' : 'data-pt'); });
    d.querySelectorAll('[data-ph-pt]').forEach(function (e) { e.placeholder = e.getAttribute(est.lingua === 'en' ? 'data-ph-en' : 'data-ph-pt'); });
    $('#idioma').textContent = est.lingua === 'en' ? 'PT' : 'EN';
    var g = MapaModelo.grafo(est.dados.plataforma, est.dados.manifestos, { lingua: est.lingua }); est.grafo = g;
    g.nos.forEach(function (m) { var n = noDe(m.id); if (n) n.data('label', m.rotulo); });
    trilha(); aplicarCamada(); if (est.selecionado) ficha(est.selecionado);
  }
  function tema(novo) {
    d.documentElement.setAttribute('data-theme', novo);
    try { localStorage.setItem('mapa-vivo:tema', novo); } catch (e) {}
    est.cy.style(estilo());
  }

  /* ---------- eventos ---------- */
  function ligarEventos() {
    var cy = est.cy, dica = $('#dica');
    cy.on('tap', 'node', function (ev) {
      var n = ev.target, id = n.id(); dica.classList.add('some');
      if (n.hasClass('cy-expand-collapse-collapsed-node')) { abrirApp(id).then(function () { focar(id); }); return; }
      if (n.isParent()) { if (est.selecionado === id) { fecharApp(); fecharFicha(); } else focar(id); return; }
      focar(id);
    });
    cy.on('tap', function (ev) { if (ev.target === cy) { if (est.selecionado) { fecharFicha(); } } });
    $('#ficha-fechar').onclick = fecharFicha;
    $('#ficha-ligacoes').addEventListener('click', function (ev) { var b = ev.target.closest('button[data-ir]'); if (b) irPara(b.getAttribute('data-ir')); });
    $('#busca').addEventListener('input', function (e) { buscar(e.target.value); });
    $('#busca-form').addEventListener('submit', function (e) { e.preventDefault(); if (est.achados.length) irPara(est.achados[0]); });
    $('#busca').addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.target.value = ''; buscar(''); e.target.blur(); } });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.activeElement !== $('#busca')) fecharFicha(); if (e.key === '/' && d.activeElement.tagName !== 'INPUT') { e.preventDefault(); $('#busca').focus(); } });
    d.querySelectorAll('.chip').forEach(function (b) { b.addEventListener('click', function () { d.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); est.camada = b.getAttribute('data-camada'); aplicarCamada(); }); });
    $('#idioma').onclick = function () { est.lingua = est.lingua === 'en' ? 'pt' : 'en'; traduzir(); };
    $('#tema').onclick = function () { tema(d.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); };
    addEventListener('resize', function () { cy.resize(); });
  }

  /* ---------- início ---------- */
  try { var t = localStorage.getItem('mapa-vivo:tema'); if (t === 'light' || t === 'dark') d.documentElement.setAttribute('data-theme', t); } catch (e) {}
  MapaModelo.carregar('manifestos/plataforma.json', MANIFESTOS).then(function (dados) { est.dados = dados; return montar(); }).then(function () { window.__mapa = est; })
    .catch(function (e) { $('#dica').textContent = T('Não consegui ler os manifestos: ', 'Could not read the manifests: ') + (e && e.message || e) + '. ' + T('Abra pelo servidor de teste (node servidor-teste.js), não como arquivo.', 'Open it through the test server (node servidor-teste.js), not as a file.'); console.error(e); });
})();
