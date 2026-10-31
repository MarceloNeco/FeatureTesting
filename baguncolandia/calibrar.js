/* Bagunçolândia — calibração guiada, no celular (visão) com voz e legenda na TV.
   Sem IA: 1) grava o fundo com a pessoa fora; 2) a pessoa entra e fica parada → a diferença contra o
   fundo é a silhueta (caixa); 3) pede braço direito, braço esquerdo, chute e pulo e confere movimento
   na zona certa. Cada passo tem 10 s; sem resposta, segue ("vamos assim mesmo").
   Coordenadas normalizadas e JÁ ESPELHADAS (como a TV mostra): o braço direito da pessoa fica à direita.
   Com dois jogadores num celular só, faixa = [x0, x1] (espelhado, ex.: [0, 0.5] = lado esquerdo da TV):
   a silhueta e os movimentos só contam dentro dessa faixa.
   Uso: Calibrar.iniciar({ visao, faixa, aoPasso(passo, estado, dados), aoFim(caixa) }) → { parar(), pular() } */
(function (root) {
  'use strict';
  var PASSOS = ['fundo', 'parado', 'bracoDir', 'bracoEsq', 'chute', 'pulo'];
  var TEMPO_PASSO = 10000, CICLO = 100;
  var TEXTOS = {
    fundo: { pt: 'Saia da frente da câmera por um instante', en: 'Step out of the camera view for a moment' },
    parado: { pt: 'Agora entre e fique parado, de braços abertos', en: 'Now step in and stand still with your arms open' },
    bracoDir: { pt: 'Levante o braço direito!', en: 'Raise your right arm!' },
    bracoEsq: { pt: 'Agora o braço esquerdo!', en: 'Now the left arm!' },
    chute: { pt: 'Chuta com um pé!', en: 'Kick with one foot!' },
    pulo: { pt: 'Pula!', en: 'Jump!' },
    ok: { pt: 'Isso!', en: 'Yes!' },
    vi: { pt: 'Te vi! Agora os movimentos.', en: 'I see you! Now the moves.' },
    pulado: { pt: 'Tudo bem, vamos assim mesmo', en: 'All right, let’s go anyway' },
    fim: { pt: 'Pronto! Vamos jogar?', en: 'Ready! Let’s play?' }
  };

  function iniciar(opts) {
    var visao = opts.visao, idx = -1, timer = 0, inicioPasso = 0, fundo = null, caixa = null, quietoDesde = 0, caixaAnterior = null, estavelDesde = 0, acertos = 0, parado = false;
    var w = visao.w, h = visao.h, faixa = opts.faixa || [0, 1];
    function naFaixa(xEsp) { return xEsp >= faixa[0] && xEsp <= faixa[1]; }
    function passo() { return PASSOS[idx]; }
    function avisar(estado, dados) { opts.aoPasso && opts.aoPasso(passo(), estado, dados || {}); }
    function proximo(estado) {
      if (estado && idx >= 0) avisar(estado, { caixa: caixa });
      idx++; inicioPasso = Date.now(); quietoDesde = 0; estavelDesde = 0; acertos = 0; caixaAnterior = null;
      if (idx >= PASSOS.length) { parar(); opts.aoFim && opts.aoFim(caixa || { x: faixa[0] + (faixa[1] - faixa[0]) * 0.2, y: 0.05, w: (faixa[1] - faixa[0]) * 0.6, h: 0.9 }); return; }
      avisar('espera', { texto: TEXTOS[passo()], caixa: caixa });
    }
    /* silhueta: pixels que diferem do fundo; devolve caixa normalizada (espelhada) ou null */
    function silhueta(d) {
      if (!fundo || !d) return null;
      var minX = w, maxX = -1, minY = h, maxY = -1, n = 0, cols = new Array(w).fill(0), rows = new Array(h).fill(0);
      for (var i = 0, c = 0; i < d.length; i += 4, c++) {
        var df = Math.abs(d[i] - fundo[i]) + Math.abs(d[i + 1] - fundo[i + 1]) + Math.abs(d[i + 2] - fundo[i + 2]);
        if (df > 75) { var x = c % w, y = (c / w) | 0; if (!naFaixa(1 - (x + 0.5) / w)) continue; cols[x]++; rows[y]++; n++; }
      }
      if (n < w * h * (faixa[1] - faixa[0]) * 0.03) return null;   // menos de 3 % da faixa: ninguém
      // caixa pelas colunas/linhas com pelo menos 2 pixels (ignora ruído solto)
      for (var x2 = 0; x2 < w; x2++) if (cols[x2] >= 2) { if (x2 < minX) minX = x2; if (x2 > maxX) maxX = x2; }
      for (var y2 = 0; y2 < h; y2++) if (rows[y2] >= 2) { if (y2 < minY) minY = y2; if (y2 > maxY) maxY = y2; }
      if (maxX < 0 || maxY < 0) return null;
      var bx = minX / w, bw = (maxX - minX + 1) / w;
      return { x: +(1 - bx - bw).toFixed(3), y: +(minY / h).toFixed(3), w: +bw.toFixed(3), h: +((maxY - minY + 1) / h).toFixed(3) };   // espelhada
    }
    function zona(nome) {   // zonas dentro da caixa (espelhadas): direito = lado direito da tela
      var c = caixa || { x: 0.2, y: 0.05, w: 0.6, h: 0.9 };
      if (nome === 'bracoDir') return { x: c.x + c.w * 0.5, y: c.y - 0.1, w: c.w * 0.7, h: c.h * 0.6 };
      if (nome === 'bracoEsq') return { x: c.x - c.w * 0.2, y: c.y - 0.1, w: c.w * 0.7, h: c.h * 0.6 };
      if (nome === 'chute') return { x: c.x - c.w * 0.3, y: c.y + c.h * 0.55, w: c.w * 1.6, h: c.h * 0.6 };
      return { x: 0, y: 0, w: 1, h: 1 };
    }
    function dentro(p, z) { return p[0] >= z.x && p[0] <= z.x + z.w && p[1] >= z.y && p[1] <= z.y + z.h; }
    function ciclo() {
      if (parado) return;
      var agora = Date.now(), m = visao.medir(), p = passo();
      if (!m) return;
      if (agora - inicioPasso > TEMPO_PASSO) { if (p === 'fundo' && !fundo) fundo = m.bruto; proximo('pulado'); return; }
      if (p === 'fundo') {
        if (m.e < 8) { if (!quietoDesde) quietoDesde = agora; if (agora - quietoDesde > 1500) { fundo = m.bruto; proximo('ok'); } } else quietoDesde = 0;
      } else if (p === 'parado') {
        var s = silhueta(m.bruto);
        if (s && m.e < 14) {
          if (caixaAnterior && Math.abs(s.x - caixaAnterior.x) < 0.06 && Math.abs(s.w - caixaAnterior.w) < 0.08 && Math.abs(s.h - caixaAnterior.h) < 0.08) { if (!estavelDesde) estavelDesde = agora; }
          else estavelDesde = 0;
          caixaAnterior = s;
          if (estavelDesde && agora - estavelDesde > 1500) { caixa = s; proximo('ok'); }
        } else { estavelDesde = 0; }
        avisar('medindo', { caixa: s, energia: m.e });
      } else if (p === 'pulo') {
        var forte = m.p.filter(function (pt) { return naFaixa(pt[0]) && pt[2] >= 50; }).length;
        if (m.e > 55 && (faixa[1] - faixa[0] >= 1 || forte >= 2)) acertos++; else acertos = Math.max(0, acertos - 1);
        if (acertos >= 2) proximo('ok');
      } else {
        var z = zona(p), bateu = m.p.some(function (pt) { return pt[2] >= 40 && naFaixa(pt[0]) && dentro(pt, z); });
        if (bateu) acertos++; else acertos = Math.max(0, acertos - 1);
        if (acertos >= 2) proximo('ok');
      }
    }
    function parar() { parado = true; clearInterval(timer); }
    visao.zerar();
    timer = setInterval(ciclo, CICLO);
    proximo();
    return { parar: parar, pular: function () { if (!parado) proximo('pulado'); }, passo: passo, caixa: function () { return caixa; }, zona: zona };
  }
  root.Calibrar = { iniciar: iniciar, PASSOS: PASSOS, TEXTOS: TEXTOS };
})(typeof self !== 'undefined' ? self : this);
