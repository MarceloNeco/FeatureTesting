/* Vruuum! — as regras da corrida: velocidade, volante, curvas, estrelas, batidas, turbo, rampa,
   trânsito e chegada. Puro (sem tela): o app manda as entradas, o motor devolve o estado e uma
   lista de eventos (para som e efeitos). Roda no navegador e no Node (testes).
   Ninguém perde a corrida: bater só deixa o carro mais lento e derruba umas estrelas. */
(function (raiz) {
  'use strict';
  var P = raiz.VruuumPista || (typeof require === 'function' ? require('./pista.js') : null);
  var SEG = P.SEG;
  var CONTAGEM = 3;        // 3-2-1
  var TURBO = 2.5;         // segundos de turbo
  var PULO = 1.1;          // segundos no ar depois da rampa
  var PULINHO = 0.75;      // segundos no ar com o botão PULAR
  var RECARGA = 1.3;       // segundos até poder pular de novo (contando o tempo no ar)
  var RODANDO = 0.9;       // segundos rodopiando depois de bater num carro
  var DEPOIS_DO_FIM = 3;   // segundos de festa depois que todos chegam
  // pontos (ninguém perde a corrida, mas o placar sobe e desce)
  var PONTOS = { estrela: 100, estrelaAr: 200, turbo: 50, rampa: 50, checkpoint: 500, chegada: 1000, cone: -50, batida: -150 };
  var PONTOS_LUGAR = [800, 400, 200];   // 1º, 2º e 3º lugar na chegada
  var TOQUE = { estrela: 0.28, cone: 0.24, lama: 0.3, turbo: 0.3, rampa: 0.3 };

  // rivais (personagens): configs = [{ id, veic, mod: { vel, curva } }]
  function novaCorrida(nivel, semente, nJogadores, configs) {
    var pista = P.montar(nivel, semente);
    var n = nJogadores === 2 ? 2 : 1, jogadores = [];
    for (var k = 0; k < n; k++) {
      jogadores.push({ n: k, x: n === 2 ? (k ? 0.4 : -0.4) : 0, z: 1000, vel: 0, estrelas: 0, pontos: 0, tCheck: 0, turbo: 0, pulo: 0, puloMax: 0, recarga: 0, rodando: 0, tremor: 0, chegou: false, tempo: 0, batidas: 0, mundo: 0, fora: false, empurrao: 0 });
    }
    return {
      pista: pista, jogadores: jogadores,
      carros: pista.carros.map(function (c) { return { z: c.z, x: c.x, vel: c.vel, tipo: c.tipo }; }),
      fase: 'contagem', contagem: CONTAGEM, t: 0, depoisDoFim: 0, eventos: [],
      rivais: (configs || []).map(function (cf, k) {
        var faixa = P.FAIXAS[(k + 1) % 3];
        return { r: k, id: cf.id, veic: cf.veic, cor: cf.cor, mod: cf.mod || {}, x: faixa, faixa: faixa, z: 1000 + (k % 2 ? -1 : 1) * SEG * (1 + k), vel: 0, garra: 0.94 + ((semente >> k) % 7) * 0.01, chegou: false, tempo: 0, lento: 0, pensa: 0 };
      })
    };
  }

  function somar(e, j, p, motivo) {
    var antes = j.pontos; j.pontos = Math.max(0, j.pontos + p);
    if (j.pontos !== antes) e.eventos.push({ tipo: 'pontos', j: j.n, p: j.pontos - antes, motivo: motivo });
  }
  // bônus de tempo: quanto mais rápido no trecho, mais pontos (alvo = trecho em velocidade quase cheia)
  function bonusTempo(e, j, segs) {
    var alvo = segs * SEG / (e.pista.cfg.velMax * ((j.mod && j.mod.vel) || 1)) * 1.2, tempo = e.t - j.tCheck;
    j.tCheck = e.t;
    return { tempo: tempo, bonus: Math.max(0, Math.round((alvo - tempo) * 30)) };
  }
  function perder(e, j, q) {
    q = Math.min(q, j.estrelas);
    if (q > 0) { j.estrelas -= q; e.eventos.push({ tipo: 'perdeu', j: j.n, q: q }); }
  }

  function moverJogador(e, j, ent, dt) {
    var pista = e.pista, cfg = pista.cfg, mod = j.mod || {}, max = cfg.velMax * (mod.vel || 1);   // mod: jeito do veículo (veiculos.js)
    var seg = P.achar(pista, j.z), pct = j.vel / max;
    var dir = Math.max(-1, Math.min(1, (ent && ent.dir) || 0));
    if (j.rodando > 0) { j.rodando = Math.max(0, j.rodando - dt); dir = 0; }
    if (j.chegou) dir *= 0.5;
    // botão PULAR: um pulinho que passa por cima de cone, lama e carrinho
    if (j.recarga > 0) j.recarga = Math.max(0, j.recarga - dt);
    if (ent && ent.pular && j.pulo <= 0 && j.recarga <= 0 && j.rodando <= 0 && !j.chegou) {
      j.pulo = j.puloMax = PULINHO; j.recarga = RECARGA; e.eventos.push({ tipo: 'pulo', j: j.n, manual: true });
    }

    // volante e força da curva (empurra para fora; no nível Criança quase nada)
    var dx = dt * 2 * Math.max(pct, 0.35) * (mod.curva || 1);
    j.x += dx * dir;
    j.x -= dx * pct * seg.curva * cfg.centrifuga;
    // nível Criança: sem mexer no volante, o carro volta sozinho para a estrada
    if (cfg.ajuda && !dir && Math.abs(j.x) > 0.8) j.x -= (j.x > 0 ? 1 : -1) * dt * 0.8;
    j.x = Math.max(-cfg.limiteX, Math.min(cfg.limiteX, j.x));
    if (seg.tunel) j.x = Math.max(-1.1, Math.min(1.1, j.x));   // dentro do túnel as paredes seguram o carro na pista

    // acelera sozinho (criança não precisa segurar nada); freio é opcional
    var alvo = max;
    if (j.turbo > 0) { alvo = max * 1.45; j.turbo = Math.max(0, j.turbo - dt); }
    if (j.chegou) alvo = max * 0.3;
    if (ent && ent.freio) j.vel -= max * 1.4 * dt;
    else if (j.vel < alvo) j.vel = Math.min(alvo, j.vel + max * (j.turbo > 0 ? 1.2 : 0.45) * dt);
    else j.vel = Math.max(alvo, j.vel - max * 0.6 * dt);

    // fora da estrada: grama, areia ou neve seguram o carro
    j.fora = Math.abs(j.x) > 1.05 && j.pulo <= 0;
    if (j.fora && j.vel > max * 0.4) { j.vel -= max * 1.3 * dt; j.tremor = 0.15; }
    j.vel = Math.max(0, Math.min(max * 1.5, j.vel));
    if (j.tremor > 0) j.tremor = Math.max(0, j.tremor - dt);
    if (j.pulo > 0) j.pulo = Math.max(0, j.pulo - dt);
    if (j.empurrao > 0) j.empurrao = Math.max(0, j.empurrao - dt);

    var zAntes = j.z;
    j.z = Math.min(pista.comprimento - SEG, j.z + j.vel * dt);

    // coisas da pista que ficaram para trás neste quadro
    var i0 = Math.floor(zAntes / SEG), i1 = Math.floor(j.z / SEG);
    for (var i = i0; i <= i1; i++) {
      var s = pista.segs[i];
      if (!s) continue;
      var zc = i * SEG + SEG / 2;
      if (zc <= zAntes || zc > j.z) continue;
      for (var k = 0; k < s.coisas.length; k++) {
        var c = s.coisas[k];
        if (c.pego[j.n] || Math.abs(j.x - c.x) > TOQUE[c.tipo]) continue;
        var noAr = j.pulo > 0;
        if (c.tipo === 'estrela') {
          if ((c.alt > P.ALT_CHAO) !== noAr) continue;   // estrela do ar só para quem pulou
          c.pego[j.n] = true; j.estrelas++; e.eventos.push({ tipo: 'estrela', j: j.n, ar: noAr });
          somar(e, j, noAr ? PONTOS.estrelaAr : PONTOS.estrela, 'estrela');
          continue;
        }
        if (noAr) continue;                               // no ar passa por cima de tudo
        c.pego[j.n] = true;
        if (c.tipo === 'cone') {
          if (j.rodando > 0) continue;
          j.vel *= 0.5; j.batidas++; j.tremor = 0.4;
          e.eventos.push({ tipo: 'cone', j: j.n }); perder(e, j, cfg.perdeCone); somar(e, j, PONTOS.cone, 'cone');
        } else if (c.tipo === 'lama') {
          if (j.vel > max * 0.3) j.vel *= 0.6;
          j.tremor = 0.7; e.eventos.push({ tipo: 'lama', j: j.n });
        } else if (c.tipo === 'turbo') {
          j.turbo = TURBO; e.eventos.push({ tipo: 'turbo', j: j.n }); somar(e, j, PONTOS.turbo, 'turbo');
        } else if (c.tipo === 'rampa') {
          j.pulo = j.puloMax = PULO; e.eventos.push({ tipo: 'pulo', j: j.n }); somar(e, j, PONTOS.rampa, 'rampa');
        }
      }
    }

    // trânsito: bater por trás deixa lento, rodopia e derruba estrelas
    if (j.pulo <= 0 && j.rodando <= 0) {
      for (k = 0; k < e.carros.length; k++) {
        var car = e.carros[k];
        if (Math.abs(car.x - j.x) < 0.42 && j.z > car.z - SEG * 0.8 && j.z < car.z + SEG * 0.4 && j.vel > car.vel) {
          j.vel = car.vel * 0.6; j.z = car.z - SEG * 0.9; j.rodando = RODANDO; j.batidas++;
          e.eventos.push({ tipo: 'batida', j: j.n }); perder(e, j, cfg.perdeCarro); somar(e, j, PONTOS.batida, 'batida');
          break;
        }
      }
    }

    // mudou de mundo?
    var m = P.achar(pista, j.z).mundo;
    if (m !== j.mundo) {
      j.mundo = m; e.eventos.push({ tipo: 'mundo', j: j.n, mundo: m, nome: pista.mundos[m] });
      // cada portal de mundo é um CHECKPOINT: 500 pontos + bônus de tempo
      var bt = bonusTempo(e, j, pista.chegada / 4);
      e.eventos.push({ tipo: 'checkpoint', j: j.n, numero: m, tempo: bt.tempo, bonus: bt.bonus });
      somar(e, j, PONTOS.checkpoint + bt.bonus, 'checkpoint');
    }

    // chegada
    if (!j.chegou && j.z >= pista.zChegada) {
      j.chegou = true; j.tempo = e.t;
      var antes = e.jogadores.filter(function (o) { return o !== j && o.chegou; }).length;
      antes += e.rivais.filter(function (r) { return r.chegou; }).length;
      e.eventos.push({ tipo: 'chegou', j: j.n, lugar: antes + 1 });
      var bc = bonusTempo(e, j, pista.chegada / 4), concorrentes = e.jogadores.length + e.rivais.length;
      somar(e, j, PONTOS.chegada + bc.bonus + (concorrentes > 1 && antes < 3 ? PONTOS_LUGAR[antes] : 0), 'chegada');
    }
  }

  // ---------- rivais ----------
  function bloqueado(e, i0, i1, x) {   // tem cone, lama ou carrinho nessa faixa entre os pedaços i0 e i1?
    var pista = e.pista;
    for (var i = i0; i <= i1; i++) {
      var s = pista.segs[i]; if (!s) continue;
      for (var k = 0; k < s.coisas.length; k++) { var c = s.coisas[k]; if ((c.tipo === 'cone' || c.tipo === 'lama') && Math.abs(c.x - x) < 0.3) return true; }
    }
    for (k = 0; k < e.carros.length; k++) { var ci = Math.floor(e.carros[k].z / SEG); if (ci >= i0 && ci <= i1 && Math.abs(e.carros[k].x - x) < 0.4) return true; }
    return false;
  }
  function moverRival(e, rv, dt) {
    var pista = e.pista, cfg = pista.cfg, max = cfg.velMax * (rv.mod.vel || 1);
    var lider = e.jogadores.reduce(function (a, j) { return j.z > a.z ? j : a; }, e.jogadores[0]);
    // fica por perto dos jogadores: quem dispara segura, quem fica para trás acelera (corrida sempre disputada)
    var d = (rv.z - lider.z) / SEG, f = d > 30 ? 0.84 : d < -30 ? 1.12 : 1 - d * 0.004;
    var alvo = rv.chegou ? max * 0.3 : max * rv.garra * f;
    if (rv.lento > 0) { rv.lento -= dt; alvo *= 0.55; }
    rv.vel += Math.max(-max * 0.8 * dt, Math.min(max * 0.45 * dt, alvo - rv.vel));
    var i = Math.floor(rv.z / SEG);
    // decide a faixa um pouco antes: foge de cone, lama e carrinho (às vezes se distrai)
    rv.pensa -= dt;
    if (rv.pensa <= 0) {
      rv.pensa = 0.25;
      if (bloqueado(e, i + 3, i + 14, rv.faixa) && Math.random() < 0.8) {
        var livres = P.FAIXAS.filter(function (fx) { return !bloqueado(e, i + 3, i + 14, fx); });
        if (livres.length) rv.faixa = livres.sort(function (a, b) { return Math.abs(a - rv.x) - Math.abs(b - rv.x); })[0];
      } else if (Math.random() < 0.02) rv.faixa = P.FAIXAS[Math.floor(Math.random() * 3)];
    }
    var dx = rv.faixa - rv.x; rv.x += Math.max(-dt * 1.3, Math.min(dt * 1.3, dx));
    var zAntes = rv.z; rv.z = Math.min(pista.comprimento - SEG, rv.z + rv.vel * dt);
    // se não desviou a tempo, o cone/lama segura (só o rival, a pista dele é a mesma de todos)
    for (var k = Math.floor(zAntes / SEG); k <= Math.floor(rv.z / SEG); k++) {
      var s = pista.segs[k]; if (!s) continue;
      for (var q = 0; q < s.coisas.length; q++) { var c = s.coisas[q]; if ((c.tipo === 'cone' || c.tipo === 'lama') && Math.abs(c.x - rv.x) < 0.25 && (k * SEG + SEG / 2) > zAntes && (k * SEG + SEG / 2) <= rv.z) rv.lento = 0.8; }
    }
    // encostou num jogador: um empurrãozinho dos dois lados e o rival muda para a faixa do outro lado
    // (antes ele voltava para a mesma faixa, encostava de novo e ficava tremendo do lado do jogador)
    if (rv.encostou > 0) rv.encostou -= dt;
    e.jogadores.forEach(function (j) {
      if (j.pulo > 0 || Math.abs(j.z - rv.z) > SEG * 0.6 || Math.abs(j.x - rv.x) > 0.38) return;
      var lado = j.x <= rv.x ? -1 : 1, longe = P.FAIXAS.filter(function (fx) { return lado < 0 ? fx > j.x + 0.4 : fx < j.x - 0.4; });
      if (longe.length) rv.faixa = longe.sort(function (a, b) { return Math.abs(a - rv.x) - Math.abs(b - rv.x); })[0];
      if (rv.encostou > 0) return;
      rv.encostou = 0.6; j.x += lado * 0.07; rv.x -= lado * 0.05;
      if (j.empurrao <= 0) { j.empurrao = 0.5; e.eventos.push({ tipo: 'tum', j: j.n }); }
    });
    if (!rv.chegou && rv.z >= pista.zChegada) { rv.chegou = true; rv.tempo = e.t; }
  }
  // posição de cada jogador na corrida (contando os rivais): quem chegou antes, depois quem está mais na frente
  function posicoes(e) {
    var todos = e.jogadores.map(function (j) { return { j: j, z: j.z, fim: j.chegou ? j.tempo : Infinity }; })
      .concat(e.rivais.map(function (r) { return { z: r.z, fim: r.chegou ? r.tempo : Infinity }; }));
    todos.sort(function (a, b) { return a.fim !== b.fim ? a.fim - b.fim : b.z - a.z; });
    todos.forEach(function (o, k) {
      if (!o.j) return;
      if (o.j.lugar && o.j.lugar !== k + 1 && !o.j.chegou && e.t - (o.j.tLugar || 0) > 0.8) { e.eventos.push({ tipo: 'lugar', j: o.j.n, lugar: k + 1, subiu: k + 1 < o.j.lugar }); o.j.tLugar = e.t; }
      o.j.lugar = k + 1;
    });
    e.total = todos.length;
  }

  function atualizar(e, entradas, dt) {
    e.eventos = [];
    if (e.fase === 'fim') return e;
    if (e.fase === 'contagem') {
      var antes = Math.ceil(e.contagem);
      e.contagem -= dt;
      if (e.contagem <= 0) { e.fase = 'corrida'; e.contagem = 0; e.eventos.push({ tipo: 'vai' }); }
      else if (Math.ceil(e.contagem) !== antes) e.eventos.push({ tipo: 'bip', n: Math.ceil(e.contagem) });
      return e;
    }
    e.t += dt;
    var pista = e.pista;
    e.carros.forEach(function (c) {
      c.z += c.vel * dt;
      if (c.z > pista.zChegada - 30 * SEG) c.z = 260 * SEG;
    });
    e.jogadores.forEach(function (j) { moverJogador(e, j, entradas && entradas[j.n], dt); });

    // dois carros lado a lado: um empurrãozinho, sem perder nada
    if (e.jogadores.length === 2) {
      var a = e.jogadores[0], b = e.jogadores[1];
      if (Math.abs(a.z - b.z) < SEG * 0.6 && Math.abs(a.x - b.x) < 0.38 && a.pulo <= 0 && b.pulo <= 0) {
        var lado = a.x <= b.x ? -1 : 1;
        a.x += lado * 0.06; b.x -= lado * 0.06;
        if (a.empurrao <= 0) { a.empurrao = b.empurrao = 0.5; e.eventos.push({ tipo: 'tum' }); }
      }
    }

    e.rivais.forEach(function (rv) { moverRival(e, rv, dt); });
    posicoes(e);

    if (e.jogadores.every(function (j) { return j.chegou; })) {
      e.depoisDoFim += dt;
      if (e.depoisDoFim >= DEPOIS_DO_FIM) { e.fase = 'fim'; e.eventos.push({ tipo: 'fim' }); }
    }
    return e;
  }

  var VruuumMotor = { PONTOS: PONTOS, PONTOS_LUGAR: PONTOS_LUGAR, novaCorrida: novaCorrida, atualizar: atualizar, CONTAGEM: CONTAGEM, TURBO: TURBO, PULO: PULO, PULINHO: PULINHO, RECARGA: RECARGA, RODANDO: RODANDO, DEPOIS_DO_FIM: DEPOIS_DO_FIM };
  if (typeof module !== 'undefined' && module.exports) module.exports = VruuumMotor;
  else raiz.VruuumMotor = VruuumMotor;
})(this);
