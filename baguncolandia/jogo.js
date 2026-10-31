/* Bagunçolândia — motor do jogo (puro: sem DOM, sem canvas; roda na TV e nos testes do Node).
   Palco lógico de 1280×720. Cada jogador tem uma "raia" (rect do palco); os pontos de movimento
   que chegam do celular vêm normalizados (0..1) dentro da raia e viram coordenadas do palco aqui.

   Papéis das figuras: fruta | doce (cortar), heroi | vilao | poder (pegar), bola (chutar / bagunça),
   obstaculo (pula e abaixa: tipo baixo = pular, alto = abaixar; não vem do catálogo).
   Corpo do jogador (v0.2): corpo(j, caixa) recebe a caixa da silhueta (normalizada, espelhada) e, comparando
   com a caixa calibrada (calibrar(j, caixa)), diz posição, pulo e abaixado — é o que move o boneco.
   Eventos (drenados por eventos()): corte, pegou, chutou, gol, vilao, combo, poder, vida, lancou,
   perdeu (fruta caiu sem corte), fim, troca (modo da Bagunça total mudou), aviso (obstáculo vindo:
   tipo baixo/alto), desviou, bateu, tocou (bola na bagunça). */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Bagunca = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 1280, H = 720, G = 1100;   // gravidade em px/s²

  var PONTOS = { fruta: 10, doce: 10, heroi: 15, mascote: 30, vilaoPega: -5, chute: 10, gol: 30, comboCada: 5, desviou: 10, tocou: 5 };
  var DIFIC = { crianca: { intervalo: 1500, vel: 0.85 }, normal: { intervalo: 1000, vel: 1 }, maluco: { intervalo: 650, vel: 1.2 } };
  var LIMIAR = 35;   // força mínima do ponto de movimento (0..100) para contar
  var MODOS = ['corta', 'pega', 'chuta', 'pula', 'bolas', 'mistura'];
  var MODOS_MISTURA = ['corta', 'pega', 'chuta', 'pula', 'bolas'];
  var AMBIENTES = ['camera', 'paisagem'], CENAS = ['aleatoria', 'praia', 'floresta', 'espaco', 'cidade'];
  var TROCA_MISTURA = 20000;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- validação das mensagens do canal (segurança: nada de fora entra sem passar aqui) ---------- */
  var ID = /^[a-z0-9]{6,12}$/i;
  var ACOES = ['comecar', 'pausar', 'continuar', 'parar', 'config', 'carregar', 'playlist', 'indice', 'proxima', 'anterior', 'pausa', 'reiniciar', 'calibrar', 'pularCalibracao', 'fale', 'batida', 'bpm', 'musica', 'boneco'];
  function validar(m) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
    var t = m.t, o = { t: t };
    if (typeof t !== 'string') return null;
    if ('id' in m) { if (typeof m.id !== 'string' || !ID.test(m.id)) return null; o.id = m.id; }
    if ('to' in m) { if (typeof m.to !== 'string' || (m.to !== 'tv' && !ID.test(m.to))) return null; o.to = m.to; }
    if ('nome' in m) { if (typeof m.nome !== 'string') return null; var n = m.nome.replace(/\s+/g, ' ').trim(); if (!n || n.length > 14) return null; o.nome = n; }
    switch (t) {
      case 'tv': return o;
      case 'join': return o.id ? o : null;
      case 'sair': return o.id ? o : null;
      case 'offer': case 'answer':
        if (!o.id && t === 'offer') return null;
        if (!m.sdp || typeof m.sdp !== 'object' || m.sdp.type !== t || typeof m.sdp.sdp !== 'string' || m.sdp.sdp.length > 30000) return null;
        o.sdp = { type: m.sdp.type, sdp: m.sdp.sdp }; return o;
      case 'ice':
        if (!m.c || typeof m.c !== 'object' || (m.c.candidate != null && typeof m.c.candidate !== 'string')) return null;
        o.c = m.c; return o;
      case 'energia':
        o.e = clamp(+m.e || 0, 0, 100); o.p = pontosOk(m.p); return o;
      case 'dados':   // mensagens pelo canal direto (celular → TV)
        o.e = clamp(+m.e || 0, 0, 100); o.p = pontosOk(m.p); if (m.cal) o.cal = calOk(m.cal); if (m.b) o.b = 1; if (m.bpm) o.bpm = clamp(+m.bpm || 0, 40, 220);
        if (m.c) o.c = caixaOk(m.c); if (Array.isArray(m.cs)) o.cs = m.cs.slice(0, 2).map(caixaOk);
        if (Array.isArray(m.k)) { var ks = m.k.slice(0, 2).map(esqueletoOk).filter(Boolean); if (ks.length) o.k = ks; }
        return o;
      case 'cmd':
        if (typeof m.acao !== 'string' || ACOES.indexOf(m.acao) < 0) return null;
        o.acao = m.acao;
        if ('modo' in m) { if (MODOS.indexOf(m.modo) < 0) return null; o.modo = m.modo; }
        if ('jogadores' in m) o.jogadores = m.jogadores === 2 ? 2 : 1;
        if ('celulares' in m) o.celulares = m.celulares === 2 ? 2 : 1;
        if ('duracao' in m) o.duracao = [60, 90, 120, 0].indexOf(+m.duracao) >= 0 ? +m.duracao : 60;
        if ('dificuldade' in m) o.dificuldade = DIFIC[m.dificuldade] ? m.dificuldade : 'normal';
        if ('ambiente' in m) o.ambiente = AMBIENTES.indexOf(m.ambiente) >= 0 ? m.ambiente : 'paisagem';
        if ('cena' in m) o.cena = CENAS.indexOf(m.cena) >= 0 ? m.cena : 'aleatoria';
        if ('faixa' in m) o.faixa = typeof m.faixa === 'string' ? m.faixa.slice(0, 12) : '';
        if (m.acao === 'boneco') { o.j = m.j === 1 ? 1 : 0; o.boneco = bonecoOk(m.boneco); if (!o.boneco) return null; }
        if ('turmas' in m && m.turmas && typeof m.turmas === 'object') o.turmas = { propria: !!m.turmas.propria, publica: !!m.turmas.publica, minhas: !!m.turmas.minhas };
        if ('video' in m) { if (typeof m.video !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(m.video)) return null; o.video = m.video; }
        if ('lista' in m) { if (typeof m.lista !== 'string' || !/^[A-Za-z0-9_-]{10,64}$/.test(m.lista)) return null; o.lista = m.lista; }
        if ('titulo' in m) o.titulo = String(m.titulo).slice(0, 120);
        if ('i' in m) o.i = clamp(+m.i || 0, 0, 500);
        if ('texto' in m) o.texto = String(m.texto).slice(0, 200);
        if ('passo' in m) o.passo = String(m.passo).slice(0, 20);
        if ('ok' in m) o.ok = !!m.ok;
        if ('bpm' in m) o.bpm = clamp(+m.bpm || 0, 0, 220);
        return o;
      case 'estado': {   // da TV para os celulares: também conferido, porque qualquer um no canal pode mandar
        var FASES = ['carregando', 'capa', 'lobby', 'calibrando', 'contagem', 'jogando', 'pausa', 'fim'];
        o.fase = FASES.indexOf(m.fase) >= 0 ? m.fase : 'lobby';
        if (m.cfg && typeof m.cfg === 'object') { var c = validar({ t: 'cmd', acao: 'config', modo: m.cfg.modo, jogadores: m.cfg.jogadores, celulares: m.cfg.celulares, duracao: m.cfg.duracao, dificuldade: m.cfg.dificuldade, ambiente: m.cfg.ambiente, cena: m.cfg.cena }); if (c) { delete c.t; delete c.acao; o.cfg = c; } }
        o.tocando = !!m.tocando; o.titulo = String(m.titulo || '').slice(0, 120); o.versao = String(m.versao || '').slice(0, 12);
        if ('eu' in m) o.eu = clamp(+m.eu || 0, 0, 3);
        if ('indice' in m) o.indice = clamp(+m.indice || 0, -1, 500);
        if (typeof m.video === 'string' && /^[A-Za-z0-9_-]{11}$/.test(m.video)) o.video = m.video;
        o.lista = Array.isArray(m.lista) ? m.lista.slice(0, 200).filter(function (v) { return typeof v === 'string' && /^[A-Za-z0-9_-]{11}$/.test(v); }) : [];
        o.pontos = Array.isArray(m.pontos) ? m.pontos.slice(0, 4).map(function (p) { return { nome: String(p && p.nome || '').replace(/\s+/g, ' ').slice(0, 14), pontos: typeof (p && p.pontos) === 'string' ? p.pontos.slice(0, 20) : clamp(+(p && p.pontos) || 0, 0, 999999) }; }) : [];
        return o;
      }
      default: return null;
    }
  }
  function pontosOk(p) {
    if (!Array.isArray(p)) return [];
    var r = [];
    for (var i = 0; i < p.length && i < 8; i++) {
      var q = p[i]; if (!Array.isArray(q) || q.length < 3) continue;
      r.push([clamp(+q[0] || 0, 0, 1), clamp(+q[1] || 0, 0, 1), clamp(+q[2] || 0, 0, 100)]);
    }
    return r;
  }
  /* esqueleto compacto: 13 pontos [x, y] (0..1, espelhados) */
  function esqueletoOk(k) {
    if (!Array.isArray(k) || k.length !== 13) return null;
    var o = [];
    for (var i = 0; i < 13; i++) { var q = k[i]; if (!Array.isArray(q) || q.length < 2) return null; o.push([clamp(+q[0] || 0, -0.5, 1.5), clamp(+q[1] || 0, -0.5, 1.5)]); }
    return o;
  }
  var COR = /^#[0-9a-f]{6}$/i, ROUPAS = ['camiseta', 'vestido', 'macacao', 'capa', 'armadura', 'tunica'], ACESSORIOS = ['nenhum', 'laco', 'coroa', 'oculos', 'chapeu', 'asas', 'flor', 'bone', 'tiara'], CABELOS = ['curto', 'espetado', 'franja', 'longo', 'cacheado', 'trancas', 'coque', 'maria', 'careca'];
  function bonecoOk(b) {
    if (!b || typeof b !== 'object') return null;
    var o = {};
    if (typeof b.cabeca === 'string' && /^[A-Za-z0-9]{1,24}$/.test(b.cabeca)) o.cabeca = b.cabeca;
    ['cor', 'sapato', 'pele', 'corCabelo'].forEach(function (k) { if (typeof b[k] === 'string' && COR.test(b[k])) o[k] = b[k]; });
    if (CABELOS.indexOf(b.cabelo) >= 0) o.cabelo = b.cabelo;
    if (ROUPAS.indexOf(b.roupa) >= 0) o.roupa = b.roupa;
    if (ACESSORIOS.indexOf(b.acessorio) >= 0) o.acessorio = b.acessorio;
    return o;
  }
  function caixaOk(c) {
    if (!c) return null;
    if (Array.isArray(c)) c = { x: c[0], y: c[1], w: c[2], h: c[3] };
    if (typeof c !== 'object') return null;
    return { x: clamp(+c.x || 0, -0.5, 1), y: clamp(+c.y || 0, -0.5, 1), w: clamp(+c.w || 0, 0, 1), h: clamp(+c.h || 0, 0, 1.5) };
  }
  function calOk(c) {
    if (!c || typeof c !== 'object') return null;
    var o = { passo: String(c.passo || '').slice(0, 20), ok: !!c.ok };
    if (c.caixa) o.caixa = caixaOk(c.caixa);
    if ('n' in c) o.n = clamp(+c.n || 0, 0, 9);
    return o;
  }

  /* Uma câmera, duas pessoas: metade esquerda da imagem (já espelhada = lado esquerdo da TV) é o
     jogador 1, direita é o jogador 2; o x volta a ser 0..1 dentro da metade. */
  function separarJogadores(pontos) {
    var a = [], b = [];
    (pontos || []).forEach(function (p) {
      if (p[0] < 0.5) a.push([+(p[0] * 2).toFixed(3), p[1], p[2]]);
      else b.push([+((p[0] - 0.5) * 2).toFixed(3), p[1], p[2]]);
    });
    return [a, b];
  }

  /* ---------- a partida ---------- */
  function criarPartida(cfg) {
    cfg = cfg || {};
    var rnd = cfg.aleatorio || Math.random;
    var figs = (cfg.figuras || []).slice();
    var modoBase = MODOS.indexOf(cfg.modo) >= 0 ? cfg.modo : 'corta';
    var nJog = cfg.jogadores === 2 ? 2 : 1;
    var dif = DIFIC[cfg.dificuldade] || DIFIC.normal;
    var duracao = typeof cfg.duracao === 'number' ? cfg.duracao : 60;   // 0 = até mandar parar
    var seq = 0, eventos = [], coisas = [], fase = 'pronto', tempo = 0, proximoLancamento = 0, modoAtual = modoBase === 'mistura' ? 'corta' : modoBase, proximaTroca = TROCA_MISTURA;
    var bpm = 0, ultimaBatida = 0;
    var jogadores = [];
    for (var j = 0; j < nJog; j++) jogadores.push({ pontos: 0, vidas: 3, combo: 0, comboAte: 0, poder: null, poderAte: 0, rastro: [], zonaChute: 0.6, lento: 0, ref: null, corpo: { x: 0.5, topo: 0.1, altura: 0.8, pulando: false, abaixado: false, ts: 0 }, invencivelAte: 0, esq: null, esqRef: [], esqAnt: null });
    var proximoAviso = 0;
    var trave = { x: W / 2 - 120, y: 150, w: 240, h: 130 };   // abaixo do relógio e do nome do modo
    function raia(j) { return nJog === 1 ? { x: 0, y: 0, w: W, h: H } : { x: j * W / 2, y: 0, w: W / 2, h: H }; }
    function porPapel(papel) { return figs.filter(function (f) { return f.papel === papel; }); }
    function sortear(lista) { return lista.length ? lista[Math.floor(rnd() * lista.length) % lista.length] : null; }

    function emitir(e) { eventos.push(e); }

    function lancar(o, j) {
      var fig = typeof o.fig === 'string' ? figs.filter(function (f) { return f.id === o.fig; })[0] : o.fig;
      if (!fig) return null;
      var c = { id: ++seq, fig: fig.id, papel: fig.papel, raio: fig.raio || 44, x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, rot: o.rot || 0, vrot: o.vrot || 0, j: o.j || 0, morta: false, chutada: !!o.chutada, nasceu: tempo, estilo: o.estilo || 'arco', fase: rnd() * 6.28, tocadoAte: 0 };
      coisas.push(c);
      emitir({ t: 'lancou', id: c.id, fig: c.fig, papel: c.papel, j: c.j });
      return c;
    }

    /* obstáculo do Pula e abaixa: tipo baixo (tronco no chão: pular) ou alto (galho: abaixar) */
    function obstaculo(o, j) {
      var r = raia(j), alto = o.tipo === 'alto';
      var c = { id: ++seq, fig: alto ? 'galho' : 'tronco', papel: 'obstaculo', tipo: alto ? 'alto' : 'baixo', raio: 40, w: alto ? 150 : 90, h: alto ? 150 : 70, x: o.x != null ? o.x : r.x + r.w + 100, y: 0, vx: o.vx || -380, vy: 0, rot: 0, vrot: alto ? 0 : -4, j: j, morta: false, estilo: 'obstaculo', nasceu: tempo, passou: false, avisado: !!o.avisado };
      coisas.push(c);
      emitir({ t: 'lancou', id: c.id, fig: c.fig, papel: 'obstaculo', tipo: c.tipo, j: j });
      return c;
    }
    /* escolhe o que lançar conforme o modo e a dificuldade; posições relativas à raia do jogador */
    function lancarAuto(j) {
      var r = raia(j), m = modoAtual, fig, estilo = 'arco';
      var chanceVilao = dif === DIFIC.crianca ? 0.1 : 0.18;
      if (m === 'pula') {
        var tipo = rnd() < 0.5 ? 'baixo' : 'alto', vel = (340 + rnd() * 120) * dif.vel * (1 + 0.5 * Math.min(1, tempo / 90000));
        obstaculo({ tipo: tipo, vx: -vel }, j); return;
      }
      if (m === 'bolas') {
        var quantas = coisas.filter(function (c) { return c.j === j && !c.morta && c.estilo === 'quica'; }).length;
        if (quantas >= 6 + Math.min(8, Math.floor(tempo / 10000))) return;
        fig = rnd() < chanceVilao * 0.6 ? sortear(porPapel('vilao')) : sortear(porPapel('bola'));
        if (!fig) return;
        var deEsq = rnd() < 0.5;
        lancar({ fig: fig, x: deEsq ? r.x - fig.raio : r.x + r.w + fig.raio, y: r.y + r.h * (0.2 + rnd() * 0.4), vx: (deEsq ? 1 : -1) * (200 + rnd() * 250) * dif.vel, vy: -100 - rnd() * 200, vrot: (rnd() - 0.5) * 8, j: j, estilo: 'quica' });
        return;
      }
      if (m === 'corta') {
        fig = rnd() < chanceVilao ? sortear(porPapel('vilao')) : sortear(porPapel('fruta').concat(porPapel('doce')));
        if (!fig) return;
        var x = r.x + r.w * (0.15 + rnd() * 0.7), alvoX = r.x + r.w * (0.2 + rnd() * 0.6);
        var vy = -(820 + rnd() * 160) * dif.vel, voo = -2 * vy / G;
        lancar({ fig: fig, x: x, y: r.y + r.h + fig.raio, vx: (alvoX - x) / voo, vy: vy, vrot: (rnd() - 0.5) * 6, j: j, estilo: estilo });
      } else if (m === 'pega') {
        var p = rnd();
        fig = p < 0.12 ? sortear(porPapel('poder')) : p < 0.12 + chanceVilao ? sortear(porPapel('vilao')) : sortear(porPapel('heroi'));
        if (!fig) return;
        if (rnd() < 0.5) {   // desce de balão/paraquedas
          lancar({ fig: fig, x: r.x + r.w * (0.12 + rnd() * 0.76), y: r.y - fig.raio - 40, vx: 0, vy: (95 + rnd() * 60) * dif.vel, j: j, estilo: 'balao' });
        } else {              // passa voando de um lado ao outro
          var daEsq = rnd() < 0.5, vx = (260 + rnd() * 160) * dif.vel;
          lancar({ fig: fig, x: daEsq ? r.x - fig.raio : r.x + r.w + fig.raio, y: r.y + r.h * (0.15 + rnd() * 0.45), vx: daEsq ? vx : -vx, vy: 0, j: j, estilo: 'voa' });
        }
      } else if (m === 'chuta') {
        fig = rnd() < 0.25 ? sortear(porPapel('heroi')) : sortear(porPapel('bola'));
        if (!fig) return;
        var esq = rnd() < 0.5, v = (300 + rnd() * 200) * dif.vel;
        lancar({ fig: fig, x: esq ? r.x - fig.raio : r.x + r.w + fig.raio, y: r.y + r.h - fig.raio - 10, vx: esq ? v : -v, vy: rnd() < 0.4 ? -350 : 0, vrot: esq ? 5 : -5, j: j, estilo: 'rola' });
      }
    }

    function comecar() { fase = 'jogando'; tempo = 0; proximoLancamento = 400; }
    function pausar() { if (fase === 'jogando') fase = 'pausa'; }
    function continuar() { if (fase === 'pausa') fase = 'jogando'; }
    function terminar() {
      if (fase === 'fim') return;
      fase = 'fim';
      var ordem = jogadores.map(function (jg, i) { return { j: i, pontos: Math.round(jg.pontos) }; }).sort(function (a, b) { return b.pontos - a.pontos; });
      emitir({ t: 'fim', ordem: ordem });
    }

    function avancar(dtMs) {
      if (fase !== 'jogando') return;
      var dt = Math.min(dtMs, 100) / 1000;
      tempo += dtMs;
      if (modoBase === 'mistura' && tempo >= proximaTroca) {
        proximaTroca += TROCA_MISTURA;
        modoAtual = MODOS_MISTURA[(MODOS_MISTURA.indexOf(modoAtual) + 1) % MODOS_MISTURA.length];
        coisas = coisas.filter(function (c) { return c.estilo !== 'obstaculo'; });
        emitir({ t: 'troca', modo: modoAtual });
      }
      // lançamentos: intervalo cai até 60 % ao longo de 90 s; com batida, lança no pulso
      var fator = 1 - 0.4 * Math.min(1, tempo / 90000);
      var lentoGeral = jogadores.some(function (jg) { return jg.lento > tempo; }) ? 0.5 : 1;
      if (tempo >= proximoLancamento) {
        for (var j = 0; j < nJog; j++) lancarAuto(j);
        var base = modoAtual === 'pula' ? dif.intervalo * 2.2 : modoAtual === 'bolas' ? dif.intervalo * 1.2 : dif.intervalo;
        proximoLancamento = tempo + base * fator * (bpm ? clamp(60000 / bpm / dif.intervalo, 0.5, 1.5) : 1);
      }
      // aviso de voz ~1,1 s antes de o obstáculo chegar no boneco (um por vez)
      for (var a = 0; a < coisas.length; a++) {
        var ob = coisas[a]; if (ob.estilo !== 'obstaculo' || ob.avisado || ob.morta) continue;
        var alvoX = raia(ob.j).x + jogadores[ob.j].corpo.x * raia(ob.j).w, chega = (ob.x - alvoX) / Math.max(1, -ob.vx);
        if (chega <= 1.1 && tempo >= proximoAviso) { ob.avisado = true; proximoAviso = tempo + 600; emitir({ t: 'aviso', id: ob.id, j: ob.j, tipo: ob.tipo }); }
      }
      // física
      for (var i = coisas.length - 1; i >= 0; i--) {
        var c = coisas[i], r = raia(c.j);
        if (c.morta) { c.vida = (c.vida || 0) + dtMs; if (c.vida > 900) coisas.splice(i, 1); continue; }
        var d = dt * lentoGeral;
        if (c.estilo === 'obstaculo') {
          c.x += c.vx * d; c.rot += c.vrot * d;
          var jg0 = jogadores[c.j], r0 = raia(c.j), bx = r0.x + jg0.corpo.x * r0.w, meio = c.x;
          if (!c.passou && Math.abs(meio - bx) < (c.w / 2 + 40)) {
            var erro = c.tipo === 'baixo' ? !jg0.corpo.pulando : !jg0.corpo.abaixado;
            if (erro && tempo >= jg0.invencivelAte) { c.passou = true; c.bateu = true; jg0.vidas = Math.max(0, jg0.vidas - 1); jg0.invencivelAte = tempo + 1200; emitir({ t: 'bateu', id: c.id, j: c.j, tipo: c.tipo, x: c.x, y: c.tipo === 'alto' ? r0.y + r0.h * 0.35 : r0.y + r0.h * 0.8 }); emitir({ t: 'vida', j: c.j, vidas: jg0.vidas }); }
          } else if (!c.passou && ((c.vx < 0 && meio < bx - c.w / 2 - 40) || (c.vx > 0 && meio > bx + c.w / 2 + 40))) {
            c.passou = true; jg0.pontos += mult(c.j, PONTOS.desviou); emitir({ t: 'desviou', id: c.id, j: c.j, tipo: c.tipo, pontos: PONTOS.desviou, x: bx, y: r0.y + r0.h * 0.5 });
          }
          if (c.x < r0.x - 200 || c.x > r0.x + r0.w + 200) coisas.splice(i, 1);
          continue;
        }
        if (c.estilo === 'quica') {
          c.vy += G * 0.6 * d; c.x += c.vx * d; c.y += c.vy * d; c.rot += c.vrot * d;
          var chaoQ = r.y + r.h - c.raio - 10;
          if (c.y > chaoQ) { c.y = chaoQ; c.vy = -Math.abs(c.vy) * 0.82; if (Math.abs(c.vy) < 120) c.vy = -(260 + rnd() * 200); }
          if (c.x < r.x + c.raio) { c.x = r.x + c.raio; c.vx = Math.abs(c.vx); }
          if (c.x > r.x + r.w - c.raio) { c.x = r.x + r.w - c.raio; c.vx = -Math.abs(c.vx); }
          if (c.y < r.y + c.raio) { c.y = r.y + c.raio; c.vy = Math.abs(c.vy); }
          c.vx *= (1 - 0.05 * d);
          continue;
        }
        if (c.estilo === 'balao') { c.x += Math.sin(tempo / 700 + c.fase) * 40 * d; c.y += c.vy * d; }
        else if (c.estilo === 'voa') { c.x += c.vx * d; c.y += Math.sin(tempo / 400 + c.fase) * 30 * d; }
        else if (c.estilo === 'rola' && !c.chutada) { c.x += c.vx * d; c.vy += G * d; c.y += c.vy * d; var chao = r.y + r.h - c.raio - 10; if (c.y > chao) { c.y = chao; c.vy = -Math.abs(c.vy) * 0.35; if (Math.abs(c.vy) < 60) c.vy = 0; } c.rot += c.vrot * d; }
        else { c.vy += G * d; c.x += c.vx * d; c.y += c.vy * d; c.rot += c.vrot * d; }
        // gol
        if (c.papel === 'bola' && c.chutada && c.x > trave.x && c.x < trave.x + trave.w && c.y < trave.y + trave.h && c.y > trave.y - 20) {
          c.morta = true; c.como = 'gol'; jogadores[c.j].pontos += mult(c.j, PONTOS.gol); emitir({ t: 'gol', id: c.id, j: c.j, x: c.x, y: c.y, pontos: PONTOS.gol });
          trave.x = clamp(W / 2 - 120 + (rnd() - 0.5) * 700, 20, W - trave.w - 20); continue;
        }
        var fora = c.y > H + c.raio + 60 || c.x < -c.raio - 80 || c.x > W + c.raio + 80 || (c.estilo === 'balao' && c.y > H + c.raio);
        if (fora) { if ((c.papel === 'fruta' || c.papel === 'doce') && c.estilo === 'arco') emitir({ t: 'perdeu', id: c.id, j: c.j, fig: c.fig }); coisas.splice(i, 1); }
      }
      // poderes vencendo
      jogadores.forEach(function (jg, j) { if (jg.poder && tempo > jg.poderAte) { jg.poder = null; emitir({ t: 'poder', j: j, poder: null }); } if (jg.combo && tempo > jg.comboAte) jg.combo = 0; });
      if (duracao && tempo >= duracao * 1000) terminar();
      else if (jogadores.every(function (jg) { return jg.vidas <= 0; })) terminar();
    }

    function mult(j, p) { return jogadores[j].poder === 'x2' ? p * 2 : p; }

    /* pontos de movimento do jogador j (normalizados na raia), com o tempo do relógio (ms) */
    function movimento(j, pontos, ts) {
      if (fase !== 'jogando' || !jogadores[j]) return;
      var jg = jogadores[j], r = raia(j);
      var fortes = (pontos || []).filter(function (p) { return p[2] >= LIMIAR; }).map(function (p) { return { x: r.x + p[0] * r.w, y: r.y + p[1] * r.h, f: p[2], ts: ts, pe: p[3] === 1, lid: p[4] }; });
      // rastro: liga cada ponto novo ao ponto recente mais próximo (até 560 px e 350 ms) = a "lâmina"; passada rápida atravessa meia tela em 100 ms
      var recentes = jg.rastro.filter(function (p) { return ts - p.ts < 350; });
      var lamina = [];
      fortes.forEach(function (p) {
        var melhor = null, dm = 560;
        if (p.lid != null) { recentes.forEach(function (q) { if (q.lid === p.lid && (!melhor || q.ts > melhor.ts)) melhor = q; }); }   // esqueleto: cada membro liga com o próprio ponto anterior
        else recentes.forEach(function (q) { if (!!q.pe !== !!p.pe) return; var d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dm) { dm = d; melhor = q; } });
        lamina.push({ a: melhor, b: p });
      });
      jg.rastro = recentes.concat(fortes).slice(-24);
      var modo = modoAtual;
      coisas.forEach(function (c) {
        if (c.morta || c.j !== j) return;
        var atingiu = false;
        for (var k = 0; k < lamina.length && !atingiu; k++) {
          var L = lamina[k];
          if (Math.hypot(L.b.x - c.x, L.b.y - c.y) <= c.raio + 24) atingiu = true;          // folga generosa: jogo de criança
          else if (L.a && distSeg(L.a, L.b, c) <= c.raio + 18) atingiu = true;
          if (atingiu && c.papel === 'bola' && c.estilo !== 'quica') {
            if (jg.esq) { if (!L.b.pe) atingiu = false; }                                                 // com esqueleto: só o pé chuta
            else if (L.b.y < r.y + r.h * jg.zonaChute) atingiu = false;                                   // sem: só a zona de chute
          }
          if (atingiu && c.papel === 'obstaculo') atingiu = false;
        }
        if (!atingiu) return;
        acertou(j, c, modo, ts, L.b);
      });
    }
    function distSeg(a, b, p) {
      var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
      var t = l2 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1) : 0;
      return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
    }
    function acertou(j, c, modo, ts, L0) {
      var jg = jogadores[j]; L0 = L0 || { x: c.x, y: c.y + 1 };
      if (c.papel === 'fruta' || c.papel === 'doce') {
        c.morta = true; c.como = 'corte'; jg.pontos += mult(j, PONTOS.fruta);
        if (jg.combo && tempo > jg.comboAte) jg.combo = 0;
        jg.combo++; jg.comboAte = tempo + 450;
        emitir({ t: 'corte', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, pontos: PONTOS.fruta, combo: jg.combo });
        // combo: do 3º corte em diante na mesma passada, bônus na hora (o 3º paga também os dois primeiros)
        if (jg.combo >= 3) { var bonus = PONTOS.comboCada * (jg.combo === 3 ? 3 : 1); jg.pontos += mult(j, bonus); emitir({ t: 'combo', j: j, n: jg.combo, pontos: bonus, x: c.x, y: c.y }); }
      } else if (c.papel === 'vilao') {
        c.morta = true; c.como = 'vilao';
        if (modo === 'pega') { jg.pontos = Math.max(0, jg.pontos + PONTOS.vilaoPega); emitir({ t: 'vilao', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, pontos: PONTOS.vilaoPega }); }
        else { jg.vidas = Math.max(0, jg.vidas - 1); emitir({ t: 'vilao', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, vida: true }); emitir({ t: 'vida', j: j, vidas: jg.vidas }); }
      } else if (c.papel === 'heroi') {
        c.morta = true; c.como = 'pegou';
        var fig = figs.filter(function (f) { return f.id === c.fig; })[0], p = fig && fig.mascote ? PONTOS.mascote : PONTOS.heroi;
        jg.pontos += mult(j, p); emitir({ t: 'pegou', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, pontos: p, mascote: !!(fig && fig.mascote) });
      } else if (c.papel === 'poder') {
        c.morta = true; c.como = 'poder';
        var pf = figs.filter(function (f) { return f.id === c.fig; })[0], poder = (pf && pf.poder) || 'x2';
        if (poder === 'lento') { jogadores.forEach(function (x) { x.lento = tempo + 5000; }); }
        else if (poder === 'chuva') { for (var n = 0; n < 8; n++) { var r = raia(j); lancar({ fig: sortear(porPapel('fruta').concat(porPapel('doce'))), x: r.x + r.w * (0.1 + rnd() * 0.8), y: r.y + r.h + 40, vx: (rnd() - 0.5) * 200, vy: -(700 + rnd() * 300), vrot: (rnd() - 0.5) * 6, j: j }); } }
        else { jg.poder = 'x2'; jg.poderAte = tempo + 10000; }
        emitir({ t: 'poder', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, poder: poder });
      } else if (c.papel === 'bola' && c.estilo === 'quica') {
        if (tempo < c.tocadoAte) return;
        c.tocadoAte = tempo + 400;
        var ux = c.x - L0.x, uy = c.y - L0.y, nn2 = Math.hypot(ux, uy) || 1;
        c.vx = ux / nn2 * 520 + (rnd() - 0.5) * 100; c.vy = uy / nn2 * 520 - 300;
        jg.pontos += mult(j, PONTOS.tocou); emitir({ t: 'tocou', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, pontos: PONTOS.tocou });
      } else if (c.papel === 'bola' && !c.chutada) {
        c.chutada = true; c.vy = -(900 + Math.random() * 0); c.vx = (trave.x + trave.w / 2 - c.x) / 0.9; c.estilo = 'arco'; c.vrot = 12;
        jg.pontos += mult(j, PONTOS.chute); emitir({ t: 'chutou', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, pontos: PONTOS.chute });
      }
    }

    /* esqueleto por IA: 13 pontos [x,y] espelhados (0 nariz, 1-2 ombros, 3-4 cotovelos, 5-6 pulsos, 7-8 quadris,
       9-10 joelhos, 11-12 tornozelos). Vira: pontos de movimento (pulsos = mão, tornozelos = pé, força pela
       velocidade), caixa do corpo (nariz → tornozelos) e, sem calibração, a referência pelos primeiros 1,2 s parado. */
    function esqueleto(j, k, ts) {
      var jg = jogadores[j]; if (!jg || !k || k.length !== 13) return;
      var ant = jg.esqAnt, pts = [];
      if (ant && ts - ant.ts > 0 && ts - ant.ts < 400) {
        var dtS = (ts - ant.ts) / 1000;
        var r = raia(j);
        [[5, 0], [6, 0], [11, 1], [12, 1]].forEach(function (par) {
          var i = par[0], a = ant.k[i], b = k[i], vel = Math.hypot(b[0] - a[0], (b[1] - a[1]) * 0.5625) / dtS;   // em "larguras por segundo"
          var f = clamp(Math.round(vel * 70), 0, 100);
          // a posição anterior entra no rastro como ponto de partida da "lâmina" (sem testar acerto nela)
          if (f >= LIMIAR && !jg.rastro.some(function (q) { return q.lid === i && q.ts === ant.ts; })) jg.rastro.push({ x: r.x + clamp(a[0], 0, 1) * r.w, y: r.y + clamp(a[1], 0, 1) * r.h, f: f, ts: ant.ts, pe: par[1] === 1, lid: i });
          pts.push([clamp(b[0], 0, 1), clamp(b[1], 0, 1), f, par[1], i]);
        });
      }
      jg.esqAnt = { k: k, ts: ts }; jg.esq = { k: k, ts: ts };
      if (pts.length) movimento(j, pts, ts);
      var xs = k.map(function (q) { return q[0]; }), topo = k[0][1] - 0.08, base = Math.max(k[11][1], k[12][1]) + 0.04;
      var caixa = { x: Math.min.apply(null, xs), y: topo, w: Math.max.apply(null, xs) - Math.min.apply(null, xs), h: base - topo };
      if (!jg.ref) {   // referência = média dos primeiros quadros parados (até 1,2 s)
        jg.esqRef.push(caixa);
        if (jg.esqRef.length >= 12) { var m = { x: 0, y: 0, w: 0, h: 0 }; jg.esqRef.forEach(function (c) { m.x += c.x; m.y += c.y; m.w += c.w; m.h += c.h; }); var n = jg.esqRef.length; jg.ref = { x: m.x / n, y: m.y / n, w: m.w / n, h: m.h / n }; }
      }
      corpo(j, caixa, ts);
      jg.corpo.x = clamp((k[7][0] + k[8][0]) / 2, 0, 1);   // o quadril é um centro mais estável que a caixa
    }
    /* caixa calibrada (referência) e caixa atual da silhueta → posição, pulo e abaixado */
    function calibrar(j, caixa) { if (jogadores[j] && caixa) { jogadores[j].ref = caixa; jogadores[j].corpo.x = caixa.x + caixa.w / 2; } }
    function corpo(j, caixa, ts) {
      var jg = jogadores[j]; if (!jg || !caixa || !caixa.w) return;
      var ref = jg.ref || caixa, c = jg.corpo, alvo = clamp(caixa.x + caixa.w / 2, 0, 1);
      // suaviza entre amostras seguidas (10×/s); amostra velha ou primeira: vai direto
      c.x = (ts && c.ts && ts - c.ts < 250) ? c.x + (alvo - c.x) * 0.6 : alvo;
      c.topo = caixa.y; c.altura = caixa.h; c.ts = ts || 0;
      c.pulando = caixa.y < ref.y - ref.h * 0.12 && caixa.h > ref.h * 0.6;
      if (jg.esq) c.pulando = caixa.y < ref.y - ref.h * 0.1;
      c.abaixado = !c.pulando && caixa.h < ref.h * 0.7;
    }
    function estado() {
      return {
        fase: fase, modo: modoAtual, modoBase: modoBase, tempo: tempo, restante: duracao ? Math.max(0, Math.ceil((duracao * 1000 - tempo) / 1000)) : null,
        jogadores: jogadores.map(function (jg, j) { var r = raia(j); return { pontos: Math.round(jg.pontos), vidas: jg.vidas, combo: jg.combo, poder: jg.poder, poderAte: jg.poderAte, lento: jg.lento > tempo, raia: r, zonaChute: jg.zonaChute, rastro: jg.rastro.slice(-8), corpo: jg.corpo, invencivel: jg.invencivelAte > tempo, esqueleto: jg.esq && tempo - 0 >= 0 ? jg.esq.k : null }; }),
        coisas: coisas, trave: trave, bpm: bpm
      };
    }
    function batida(novoBpm) { bpm = novoBpm ? clamp(novoBpm, 40, 220) : 0; ultimaBatida = tempo; }
    return {
      comecar: comecar, pausar: pausar, continuar: continuar, terminar: terminar, avancar: avancar, movimento: movimento, esqueleto: esqueleto, lancar: lancar, obstaculo: obstaculo, corpo: corpo, calibrar: calibrar, estado: estado, batida: batida,
      zonaChute: function (j, frac) { if (jogadores[j]) jogadores[j].zonaChute = clamp(frac, 0.2, 0.95); },
      eventos: function () { var e = eventos; eventos = []; return e; },
      W: W, H: H
    };
  }

  return { criarPartida: criarPartida, validar: validar, separarJogadores: separarJogadores, MODOS: MODOS, AMBIENTES: AMBIENTES, CENAS: CENAS, PONTOS: PONTOS, W: W, H: H };
});
