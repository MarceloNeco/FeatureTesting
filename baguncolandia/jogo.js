/* Bagunçolândia — motor do jogo (puro: sem DOM, sem canvas; roda na TV e nos testes do Node).
   Palco lógico de 1280×720. Cada jogador tem uma "raia" (rect do palco); os pontos de movimento
   que chegam do celular vêm normalizados (0..1) dentro da raia e viram coordenadas do palco aqui.

   Papéis das figuras: fruta | doce (cortar), heroi | vilao | poder (pegar), bola (chutar).
   Eventos (drenados por eventos()): corte, pegou, chutou, gol, vilao, combo, poder, vida, lancou,
   perdeu (fruta caiu sem corte), fim, troca (modo da Bagunça total mudou). */
(function (root, fabrica) {
  if (typeof module !== 'undefined' && module.exports) module.exports = fabrica();
  else root.Bagunca = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 1280, H = 720, G = 1100;   // gravidade em px/s²

  var PONTOS = { fruta: 10, doce: 10, heroi: 15, mascote: 30, vilaoPega: -5, chute: 10, gol: 30, comboCada: 5 };
  var DIFIC = { crianca: { intervalo: 1500, vel: 0.85 }, normal: { intervalo: 1000, vel: 1 }, maluco: { intervalo: 650, vel: 1.2 } };
  var LIMIAR = 35;   // força mínima do ponto de movimento (0..100) para contar
  var MODOS = ['corta', 'pega', 'chuta', 'mistura'];
  var TROCA_MISTURA = 20000;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- validação das mensagens do canal (segurança: nada de fora entra sem passar aqui) ---------- */
  var ID = /^[a-z0-9]{6,12}$/i;
  var ACOES = ['comecar', 'pausar', 'continuar', 'parar', 'config', 'carregar', 'playlist', 'indice', 'proxima', 'anterior', 'pausa', 'reiniciar', 'calibrar', 'pularCalibracao', 'fale', 'batida'];
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
        o.e = clamp(+m.e || 0, 0, 100); o.p = pontosOk(m.p); if (m.cal) o.cal = calOk(m.cal); if (m.b) o.b = 1; if (m.bpm) o.bpm = clamp(+m.bpm || 0, 40, 220); return o;
      case 'cmd':
        if (typeof m.acao !== 'string' || ACOES.indexOf(m.acao) < 0) return null;
        o.acao = m.acao;
        if ('modo' in m) { if (MODOS.indexOf(m.modo) < 0) return null; o.modo = m.modo; }
        if ('jogadores' in m) o.jogadores = m.jogadores === 2 ? 2 : 1;
        if ('celulares' in m) o.celulares = m.celulares === 2 ? 2 : 1;
        if ('duracao' in m) o.duracao = [60, 90, 120, 0].indexOf(+m.duracao) >= 0 ? +m.duracao : 60;
        if ('dificuldade' in m) o.dificuldade = DIFIC[m.dificuldade] ? m.dificuldade : 'normal';
        if ('turmas' in m && m.turmas && typeof m.turmas === 'object') o.turmas = { propria: !!m.turmas.propria, publica: !!m.turmas.publica, minhas: !!m.turmas.minhas };
        if ('video' in m) { if (typeof m.video !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(m.video)) return null; o.video = m.video; }
        if ('lista' in m) { if (typeof m.lista !== 'string' || !/^[A-Za-z0-9_-]{10,}$/.test(m.lista)) return null; o.lista = m.lista; }
        if ('titulo' in m) o.titulo = String(m.titulo).slice(0, 120);
        if ('i' in m) o.i = clamp(+m.i || 0, 0, 500);
        if ('texto' in m) o.texto = String(m.texto).slice(0, 200);
        if ('passo' in m) o.passo = String(m.passo).slice(0, 20);
        if ('ok' in m) o.ok = !!m.ok;
        if ('bpm' in m) o.bpm = clamp(+m.bpm || 0, 0, 220);
        return o;
      case 'estado':
        return m;   // sai da TV para o celular; a TV é quem monta
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
  function calOk(c) {
    if (!c || typeof c !== 'object') return null;
    var o = { passo: String(c.passo || '').slice(0, 20), ok: !!c.ok };
    if (c.caixa && typeof c.caixa === 'object') o.caixa = { x: clamp(+c.caixa.x || 0, 0, 1), y: clamp(+c.caixa.y || 0, 0, 1), w: clamp(+c.caixa.w || 0, 0, 1), h: clamp(+c.caixa.h || 0, 0, 1) };
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
    for (var j = 0; j < nJog; j++) jogadores.push({ pontos: 0, vidas: 3, combo: 0, comboAte: 0, poder: null, poderAte: 0, rastro: [], zonaChute: 0.6, lento: 0 });
    var trave = { x: W / 2 - 120, y: 150, w: 240, h: 130 };   // abaixo do relógio e do nome do modo
    function raia(j) { return nJog === 1 ? { x: 0, y: 0, w: W, h: H } : { x: j * W / 2, y: 0, w: W / 2, h: H }; }
    function porPapel(papel) { return figs.filter(function (f) { return f.papel === papel; }); }
    function sortear(lista) { return lista.length ? lista[Math.floor(rnd() * lista.length) % lista.length] : null; }

    function emitir(e) { eventos.push(e); }

    function lancar(o, j) {
      var fig = typeof o.fig === 'string' ? figs.filter(function (f) { return f.id === o.fig; })[0] : o.fig;
      if (!fig) return null;
      var c = { id: ++seq, fig: fig.id, papel: fig.papel, raio: fig.raio || 44, x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0, rot: o.rot || 0, vrot: o.vrot || 0, j: o.j || 0, morta: false, chutada: !!o.chutada, nasceu: tempo, estilo: o.estilo || 'arco', fase: rnd() * 6.28 };
      coisas.push(c);
      emitir({ t: 'lancou', id: c.id, fig: c.fig, papel: c.papel, j: c.j });
      return c;
    }

    /* escolhe o que lançar conforme o modo e a dificuldade; posições relativas à raia do jogador */
    function lancarAuto(j) {
      var r = raia(j), m = modoAtual, fig, estilo = 'arco';
      var chanceVilao = dif === DIFIC.crianca ? 0.1 : 0.18;
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
        modoAtual = ['corta', 'pega', 'chuta'][(['corta', 'pega', 'chuta'].indexOf(modoAtual) + 1) % 3];
        emitir({ t: 'troca', modo: modoAtual });
      }
      // lançamentos: intervalo cai até 60 % ao longo de 90 s; com batida, lança no pulso
      var fator = 1 - 0.4 * Math.min(1, tempo / 90000);
      var lentoGeral = jogadores.some(function (jg) { return jg.lento > tempo; }) ? 0.5 : 1;
      if (tempo >= proximoLancamento) {
        for (var j = 0; j < nJog; j++) lancarAuto(j);
        proximoLancamento = tempo + dif.intervalo * fator * (bpm ? clamp(60000 / bpm / dif.intervalo, 0.5, 1.5) : 1);
      }
      // física
      for (var i = coisas.length - 1; i >= 0; i--) {
        var c = coisas[i], r = raia(c.j);
        if (c.morta) { c.vida = (c.vida || 0) + dtMs; if (c.vida > 900) coisas.splice(i, 1); continue; }
        var d = dt * lentoGeral;
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
      var fortes = (pontos || []).filter(function (p) { return p[2] >= LIMIAR; }).map(function (p) { return { x: r.x + p[0] * r.w, y: r.y + p[1] * r.h, f: p[2], ts: ts }; });
      // rastro: liga cada ponto novo ao ponto recente mais próximo (até 560 px e 350 ms) = a "lâmina"; passada rápida atravessa meia tela em 100 ms
      var recentes = jg.rastro.filter(function (p) { return ts - p.ts < 350; });
      var lamina = [];
      fortes.forEach(function (p) {
        var melhor = null, dm = 560;
        recentes.forEach(function (q) { var d = Math.hypot(q.x - p.x, q.y - p.y); if (d < dm) { dm = d; melhor = q; } });
        lamina.push({ a: melhor, b: p });
      });
      jg.rastro = recentes.concat(fortes).slice(-24);
      var modo = modoAtual;
      coisas.forEach(function (c) {
        if (c.morta || c.j !== j) return;
        var atingiu = false;
        for (var k = 0; k < lamina.length && !atingiu; k++) {
          var L = lamina[k];
          if (Math.hypot(L.b.x - c.x, L.b.y - c.y) <= c.raio + 14) atingiu = true;
          else if (L.a && distSeg(L.a, L.b, c) <= c.raio + 10) atingiu = true;
          if (atingiu && c.papel === 'bola' && L.b.y < r.y + r.h * jg.zonaChute) atingiu = false;   // bola só na zona de chute
        }
        if (!atingiu) return;
        acertou(j, c, modo, ts);
      });
    }
    function distSeg(a, b, p) {
      var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
      var t = l2 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1) : 0;
      return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
    }
    function acertou(j, c, modo, ts) {
      var jg = jogadores[j];
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
      } else if (c.papel === 'bola' && !c.chutada) {
        c.chutada = true; c.vy = -(900 + Math.random() * 0); c.vx = (trave.x + trave.w / 2 - c.x) / 0.9; c.estilo = 'arco'; c.vrot = 12;
        jg.pontos += mult(j, PONTOS.chute); emitir({ t: 'chutou', id: c.id, j: j, fig: c.fig, x: c.x, y: c.y, pontos: PONTOS.chute });
      }
    }

    function estado() {
      return {
        fase: fase, modo: modoAtual, modoBase: modoBase, tempo: tempo, restante: duracao ? Math.max(0, Math.ceil((duracao * 1000 - tempo) / 1000)) : null,
        jogadores: jogadores.map(function (jg, j) { var r = raia(j); return { pontos: Math.round(jg.pontos), vidas: jg.vidas, combo: jg.combo, poder: jg.poder, poderAte: jg.poderAte, lento: jg.lento > tempo, raia: r, zonaChute: jg.zonaChute, rastro: jg.rastro.slice(-8) }; }),
        coisas: coisas, trave: trave, bpm: bpm
      };
    }
    function batida(novoBpm) { bpm = novoBpm ? clamp(novoBpm, 40, 220) : 0; ultimaBatida = tempo; }
    return {
      comecar: comecar, pausar: pausar, continuar: continuar, terminar: terminar, avancar: avancar, movimento: movimento, lancar: lancar, estado: estado, batida: batida,
      zonaChute: function (j, frac) { if (jogadores[j]) jogadores[j].zonaChute = clamp(frac, 0.2, 0.95); },
      eventos: function () { var e = eventos; eventos = []; return e; },
      W: W, H: H
    };
  }

  return { criarPartida: criarPartida, validar: validar, separarJogadores: separarJogadores, MODOS: MODOS, PONTOS: PONTOS, W: W, H: H };
});
