/* =====================================================================
   MAPA VIVO — MODELO DO GRAFO  (mapa-modelo.js, F0, 23/Out/2026)
   ---------------------------------------------------------------------
   Lê os manifestos (plataforma.json de nível 0 e arquitetura.json de nível 1) e devolve um grafo neutro
   { nos, arestas } que o protótipo e o benchmark convertem para a biblioteca escolhida (Cytoscape.js ou
   vis-network). Nada aqui é desenhado à mão: tudo vem do manifesto. Sem dependências; global MapaModelo.
   ===================================================================== */
(function (raiz) {
  'use strict';

  /* integração de um app → serviço de nível 0 (para a aresta "app fala com o serviço") */
  function servicoDaIntegracao(it) {
    var h = String(it.host || '');
    if (it.tipo === 'supabase') return /functions|edge/i.test(it.nome) ? 'supabase-funcoes' : 'supabase';
    if (it.tipo === 'auth') return /google|supabase/i.test(it.nome) ? 'supabase-auth' : 'cloudflare-access';
    if (it.tipo === 'github') return 'github';
    if (it.tipo === 'cloudflare') return /access/i.test(it.nome) ? 'cloudflare-access' : 'cloudflare-pages';
    if (it.tipo === 'dns') return 'cloudflare-dns';
    if (it.tipo === 'email') return /improvmx/i.test(it.nome) ? 'improvmx' : 'resend';
    if (it.tipo === 'ia') return 'ia-externa';
    if (it.tipo === 'voz') return 'voz-externa';
    if (it.tipo === 'plataforma') return 'solverone-dados';
    if ((it.tipo === 'api-externa' || it.tipo === 'mapa') && it.chave === 'nenhuma') return 'dados-abertos';
    return null;
  }

  function texto(t, lingua) { return t && typeof t === 'object' ? (t[lingua] || t.pt || t.en || '') : String(t || ''); }
  /* rótulo curto para o nó (o nome inteiro fica na ficha): corta em " (" ou ":" e limita a 26 caracteres */
  function curto(nome) { var c = String(nome || '').split(/ \(|:/)[0].trim(); return c.length > 26 ? c.slice(0, 25) + '…' : c; }

  /* ---- grafo neutro ---- */
  function grafo(plataforma, manifestos, opcoes) {
    opcoes = opcoes || {};
    var L = opcoes.lingua || 'pt';
    var nos = [], arestas = [], ids = {};
    function no(n) { if (ids[n.id]) return ids[n.id]; ids[n.id] = n; nos.push(n); return n; }
    function aresta(de, para, tipo, nivel, extra) {
      if (!ids[de] || !ids[para]) return;
      var a = { id: de + '->' + para + ':' + tipo, de: de, para: para, tipo: tipo, nivel: nivel };
      if (extra) Object.keys(extra).forEach(function (k) { a[k] = extra[k]; });
      arestas.push(a);
    }

    /* nível 0: serviços e apps */
    (plataforma.servicos || []).forEach(function (s) {
      no({ id: s.id, nivel: 0, tipo: 'servico', subtipo: s.tipo, rotulo: texto(s.nome, L), rotuloCurto: curto(texto(s.nome, L)), fornecedor: s.fornecedor, plano: s.plano,
        chave: s.chave, onde_chave: s.onde_chave, fonte: s.estado_vivo && s.estado_vivo.fonte, limites: texto(s.limites, L) });
    });
    (plataforma.apps || []).forEach(function (a) {
      var m = manifestos[a.app];
      var nomeApp = m ? texto(m.nome, L) : (a.nome ? texto(a.nome, L) : a.app);
      no({ id: a.app, nivel: 0, tipo: 'app', rotulo: nomeApp, rotuloCurto: curto(nomeApp), repositorio: a.repositorio, visibilidade: a.visibilidade,
        hospedagem: a.hospedagem, url: a.url, estado: a.estado, versao: m ? m.versao : null, temManifesto: !!m, descricao: m ? texto(m.descricao, L) : '' });
    });
    (plataforma.ligacoes || []).forEach(function (l) { aresta(l.de, l.para, l.tipo, 0); });

    /* nível 1: o que cada manifesto declara, com o app como pai */
    Object.keys(manifestos).forEach(function (slug) {
      var m = manifestos[slug];
      if (!ids[slug]) no({ id: slug, nivel: 0, tipo: 'app', rotulo: texto(m.nome, L), versao: m.versao, temManifesto: true });
      var p = function (tipo, id) { return slug + '/' + tipo + '/' + id; };
      (m.modulos || []).forEach(function (x) { no({ id: p('modulo', x.id), pai: slug, nivel: 1, tipo: 'modulo', rotulo: texto(x.nome, L), descricao: texto(x.descricao, L), arquivos: x.arquivos || [], recurso: x.recurso || null }); });
      (m.dados || []).forEach(function (x) { no({ id: p('dado', x.id), pai: slug, nivel: 1, tipo: 'dado', rotulo: texto(x.nome, L), onde: x.onde, tabelas: x.tabelas || [], pessoal: !!x.pessoal, sensivel: !!x.sensivel, cifrado: !!x.cifrado_no_aparelho, retencao: texto(x.retencao, L) }); });
      (m.integracoes || []).forEach(function (x) {
        no({ id: p('integracao', x.id), pai: slug, nivel: 1, tipo: 'integracao', subtipo: x.tipo, rotulo: x.nome, host: x.host || '', chave: x.chave, onde_chave: x.onde_chave, plano: x.plano || '', contrato: x.contrato || '' });
        var s = servicoDaIntegracao(x);
        if (s && ids[s]) aresta(p('integracao', x.id), s, 'usa', 1, { cruza: true });
      });
      (m.robos || []).forEach(function (x) { no({ id: p('robo', x.id), pai: slug, nivel: 1, tipo: 'robo', rotulo: x.id, cadencia: x.cadencia, faz: texto(x.faz, L), workflow: x.workflow }); if (ids['github-actions']) aresta(p('robo', x.id), 'github-actions', 'roda-em', 1, { cruza: true }); });
      (m.fluxos || []).forEach(function (f) {
        var fid = p('fluxo', f.id);
        no({ id: fid, pai: slug, nivel: 1, tipo: 'fluxo', rotulo: texto(f.nome, L), gatilho: texto(f.gatilho, L), passos: (f.passos || []).map(function (s) { return texto(s, L); }) });
        (f.modulos || []).forEach(function (r) { aresta(fid, p('modulo', r), 'fluxo-modulo', 1); });
        (f.dados || []).forEach(function (r) { aresta(fid, p('dado', r), 'fluxo-dado', 1); });
        (f.integracoes || []).forEach(function (r) { aresta(fid, p('integracao', r), 'fluxo-integracao', 1); });
        (f.robos || []).forEach(function (r) { aresta(fid, p('robo', r), 'fluxo-robo', 1); });
      });
    });
    return { nos: nos, arestas: arestas };
  }

  /* ---- carregar os manifestos por fetch (caminhos relativos à página) ---- */
  function carregar(caminhoPlataforma, caminhosApps) {
    var pedidos = [fetch(caminhoPlataforma).then(function (r) { return r.json(); })].concat(caminhosApps.map(function (c) { return fetch(c).then(function (r) { return r.json(); }); }));
    return Promise.all(pedidos).then(function (lista) {
      var plataforma = lista[0], manifestos = {};
      lista.slice(1).forEach(function (m) { manifestos[m.app] = m; });
      return { plataforma: plataforma, manifestos: manifestos };
    });
  }

  /* ---- teste de carga: copia o nível 1 de um app para os apps sem manifesto ---- */
  function inflar(dados, copias) {
    var modelo = dados.manifestos['omnilife-one'] || Object.keys(dados.manifestos).map(function (k) { return dados.manifestos[k]; })[0];
    var n = 0;
    (dados.plataforma.apps || []).forEach(function (a) {
      if (dados.manifestos[a.app] || n >= copias) return;
      var c = JSON.parse(JSON.stringify(modelo)); c.app = a.app; c.nome = { pt: a.app + ' (cópia de teste)', en: a.app + ' (test copy)' };
      dados.manifestos[a.app] = c; n++;
    });
    return dados;
  }

  /* ---- Cytoscape: elementos com nós compostos (app = pai do seu nível 1) ---- */
  function paraCytoscape(g) {
    var els = [];
    g.nos.forEach(function (n) {
      var d = {}; Object.keys(n).forEach(function (k) { d[k] = n[k]; });
      d.label = n.rotuloCurto || n.rotulo; if (n.pai) d.parent = n.pai;
      els.push({ group: 'nodes', data: d, classes: [n.tipo, n.subtipo || '', n.nivel === 0 ? 'n0' : 'n1'].join(' ').trim() });
    });
    g.arestas.forEach(function (a) { els.push({ group: 'edges', data: { id: a.id, source: a.de, target: a.para, tipo: a.tipo, label: a.nivel === 0 ? a.tipo : '' }, classes: a.tipo + (a.cruza ? ' cruza' : '') + (a.nivel === 0 ? ' n0' : ' n1') }); });
    return els;
  }

  /* ---- vis-network: nós com group = tipo; nível 1 leva "app" para o agrupamento (cluster) ---- */
  function paraVis(g) {
    var nodes = g.nos.map(function (n) { return { id: n.id, label: n.rotulo.length > 28 ? n.rotulo.slice(0, 27) + '…' : n.rotulo, group: n.tipo, app: n.pai || null, nivel: n.nivel, dados: n, level: n.nivel === 0 ? (n.tipo === 'servico' ? 0 : 1) : 2 }; });
    var edges = g.arestas.map(function (a) { return { id: a.id, from: a.de, to: a.para, tipo: a.tipo, label: a.nivel === 0 ? a.tipo : undefined, dashes: !!a.cruza }; });
    return { nodes: nodes, edges: edges };
  }

  raiz.MapaModelo = { grafo: grafo, carregar: carregar, inflar: inflar, paraCytoscape: paraCytoscape, paraVis: paraVis, servicoDaIntegracao: servicoDaIntegracao, texto: texto, curto: curto };
})(typeof window !== 'undefined' ? window : globalThis);
