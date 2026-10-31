/* Peluqueria — desenha a rodada no canvas: cenário inteiro (contain) com fundo desfocado e vinheta, item
   com sombra e giro, lugar certo revelado depois do toque, palavra da categoria e confete.
   Modo leve (TV): sem desfoque, sem sombra desfocada, pouco confete, densidade 1×. */
(function (root) {
  'use strict';
  var CORES = ['#c6ff3d', '#ff4fa3', '#3ee8ff', '#ffd166'];
  var COR_CAT = { PERFEITO: '#ffd166', BOM: '#c6ff3d', QUASE: '#3ee8ff', LONGE: '#ff8a8a' };
  var SEM_MOV = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function criar(canvas, op) {
    var leve = !!(op && op.leve), ctx = canvas.getContext('2d');
    var W = 0, H = 0, confete = [], ultimoResultado = null, quadros = 0;

    function redimensionar() {
      var dpr = leve ? 1 : Math.min(2, root.devicePixelRatio || 1);
      W = canvas.clientWidth || root.innerWidth; H = canvas.clientHeight || root.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function caixaImagem(c) {
      var e = Math.min(W / c.largura, H / c.altura), w = c.largura * e, h = c.altura * e;
      return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h };
    }

    function fundo(c, cx) {
      ctx.fillStyle = '#0b0a1f'; ctx.fillRect(0, 0, W, H);
      if (!leve && c.img) {
        var e = Math.max(W / c.largura, H / c.altura) * 1.1, w = c.largura * e, h = c.altura * e;
        ctx.save(); ctx.filter = 'blur(24px) brightness(0.5)';
        ctx.drawImage(c.img, (W - w) / 2, (H - h) / 2, w, h);
        ctx.restore();
      }
      ctx.drawImage(c.img, cx.x, cx.y, cx.w, cx.h);
      var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(11,10,31,0)'); g.addColorStop(1, 'rgba(11,10,31,0.7)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    function item(it, L, cx, x, y, rot, fantasma) {
      var iw = L.tam * (it.escala || 1) * cx.w;
      var ih = iw * ((it.img.naturalHeight || it.img.height || 1) / (it.img.naturalWidth || it.img.width || 1));
      ctx.save();
      ctx.translate(cx.x + x * cx.w, cx.y + y * cx.h);
      ctx.rotate(rot * Math.PI / 180);
      if (fantasma) ctx.globalAlpha = 0.35;
      else if (!leve) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10; }
      ctx.drawImage(it.img, -it.encaixe.x * iw, -it.encaixe.y * ih, iw, ih);
      ctx.restore();
    }

    function soltarConfete(x, y) {
      var n = leve ? 30 : 120;
      for (var k = 0; k < n; k++) {
        var a = Math.random() * Math.PI * 2, v = 200 + Math.random() * 500;
        confete.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 300, cor: CORES[k % 4], r: Math.random() * 6, vida: 1.6 });
      }
    }
    function moverConfete(dt) {
      confete = confete.filter(function (p) { return (p.vida -= dt) > 0; });
      confete.forEach(function (p) {
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 8;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.min(1, p.vida);
        ctx.fillStyle = p.cor; ctx.fillRect(-6, -3, 12, 6); ctx.restore();
      });
    }

    function texto(t, x, y, tam, cor) {
      ctx.font = '700 ' + tam + 'px Fredoka, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(4, tam / 7); ctx.strokeStyle = '#1b1030'; ctx.strokeText(t, x, y);
      ctx.fillStyle = cor; ctx.fillText(t, x, y);
    }

    /* estado = rodada do motor; extra = { pos, resultado, rotulo, uhul, pontos, pausado, dt } */
    function pintar(estado, extra) {
      quadros++;
      if (!W) redimensionar();
      var q = estado.quedas[estado.i]; if (!q) return;
      var c = q.cenario, L = c.lugares[q.lugar], cx = caixaImagem(c);
      fundo(c, cx);
      var r = extra.resultado;
      if (r) {
        // lugar certo: fantasma do item e círculo tracejado da zona do Perfeito
        item(q.item, L, cx, L.x, L.y, L.rot || 0, true);
        var nv = root.Peluqueria.NIVEIS[estado.nivel];
        ctx.save(); ctx.setLineDash([10, 8]); ctx.lineWidth = 4; ctx.strokeStyle = '#3ee8ff';
        ctx.beginPath(); ctx.arc(cx.x + L.x * cx.w, cx.y + L.y * cx.h, Math.max(8, root.Peluqueria.LIMITES.PERFEITO * nv.tol * Math.min(cx.w, cx.h)), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (extra.pos) item(q.item, L, cx, extra.pos.x, extra.pos.y, extra.pos.rot, false);
      if (r && r !== ultimoResultado) {
        ultimoResultado = r;
        if (r.categoria === 'PERFEITO' && !SEM_MOV) soltarConfete(cx.x + L.x * cx.w, cx.y + L.y * cx.h);
      }
      if (!r) ultimoResultado = null;
      moverConfete(extra.dt || 0);
      if (r) {
        var tam = Math.min(W, H) * 0.12;
        texto(extra.rotulo, W / 2, H * 0.2, tam, COR_CAT[r.categoria]);
        texto('+' + r.pontos + (r.mult > 1 ? '  ×' + r.mult : ''), W / 2, H * 0.2 + tam * 0.95, tam * 0.5, '#fff');
        if (extra.uhul) texto(extra.uhul, W / 2, H * 0.82, tam * 0.9, '#ff4fa3');
        if (!extra.pausado) {   // ▶ médio, como no Instagram
          var R = Math.min(W, H) * 0.07, px = W / 2, py = H * 0.82 - (extra.uhul ? tam * 1.2 : 0);
          ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(px - R * 0.35, py - R * 0.5); ctx.lineTo(px + R * 0.55, py); ctx.lineTo(px - R * 0.35, py + R * 0.5); ctx.closePath(); ctx.fill(); ctx.restore();
        }
      }
    }

    return { redimensionar: redimensionar, pintar: pintar, caixaImagem: caixaImagem, quadros: function () { return quadros; }, get leve() { return leve; } };
  }

  root.PeluqueriaDesenho = { criar: criar };
})(typeof self !== 'undefined' ? self : this);
