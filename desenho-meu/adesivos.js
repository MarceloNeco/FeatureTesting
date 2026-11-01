/* Desenho Meu — adesivos (carimbos): emojis e adesivos ANIMADOS desenhados em código.
   Uma função faz tudo: DesenhoAdesivos.desenhar(ctx, a, t)
     a = { tipo: 'emoji' | 'vivo', v: '🐶' ou o id do vivo, x, y, s, mov, fase }
       (x, y) centro; s tamanho (altura aproximada, nas unidades do contexto); mov = id de MOVIMENTOS;
       fase = 0..1, para dois adesivos iguais não mexerem juntos
     t = segundos (o app passa o relógio; o mesmo t desenha sempre o mesmo quadro)
   Os vivos são desenhados numa caixa de 100 × 100 (de -50 a +50) e esticados para o tamanho s.
   Emoji desenhado com fillText a cada quadro pesa: cada emoji é desenhado UMA vez num canvas pequeno
   (64, 128 ou 256 px, conforme o tamanho na tela) e depois só copiado (drawImage). Sem "document"
   (testes no Node), desenha direto com fillText. Se o aparelho não tiver o emoji, fica o que o sistema
   desenhar — sem erro. */
(function (raiz) {
  'use strict';
  var TAU = Math.PI * 2;
  var FONTE = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  // ---------- catálogo ----------
  var GRUPOS = [
    { id: 'bichos', pt: 'Bichos', en: 'Animals', ico: '🐶', itens: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐘', '🦒', '🐢', '🐧', '🦉', '🐞', '🐝'] },
    { id: 'fazenda-mar', pt: 'Fazenda e mar', en: 'Farm and sea', ico: '🐠', itens: ['🐮', '🐷', '🐑', '🐐', '🐴', '🐔', '🐥', '🦆', '🐳', '🐬', '🐟', '🐠', '🐙', '🦀', '🦈', '🐚', '🦭', '🐡'] },
    { id: 'comida', pt: 'Comida e doces', en: 'Food and sweets', ico: '🍦', itens: ['🍎', '🍓', '🍌', '🍉', '🍇', '🍒', '🍍', '🥕', '🍕', '🍔', '🌭', '🍟', '🍩', '🍪', '🎂', '🧁', '🍭', '🍬', '🍫', '🍦'] },
    { id: 'natureza', pt: 'Natureza e tempo', en: 'Nature and weather', ico: '🌸', itens: ['🌸', '🌻', '🌷', '🌹', '🌼', '🍀', '🌳', '🌴', '🌵', '🍄', '🍁', '☀️', '🌙', '⭐', '☁️', '🌈', '⛄', '❄️', '⚡', '💧'] },
    { id: 'veiculos', pt: 'Veículos', en: 'Vehicles', ico: '🚗', itens: ['🚗', '🚕', '🚙', '🚌', '🚓', '🚑', '🚒', '🚜', '🏎️', '🚲', '🛴', '🚂', '✈️', '🚁', '🚀', '⛵', '🚤', '🛸'] },
    { id: 'festa', pt: 'Festa e brinquedos', en: 'Party and toys', ico: '🎈', itens: ['🎈', '🎉', '🎊', '🎁', '🎀', '🪁', '⚽', '🏀', '🧸', '🪀', '🎨', '🖍️', '🎵', '🥁', '🎸', '🎺', '🎮', '🏆'] },
    { id: 'rostinhos', pt: 'Rostinhos', en: 'Faces', ico: '😀', itens: ['😀', '😄', '😁', '😂', '🥰', '😍', '😘', '😎', '🤩', '🥳', '😜', '🤪', '😇', '🤗', '😴', '😮', '🥺', '😺', '💖', '👍'] },
    { id: 'fantasia', pt: 'Fantasia', en: 'Fantasy', ico: '✨', itens: ['✨', '🦄', '🧚', '👑', '🏰', '🧜‍♀️', '🧙', '🐉', '🪄', '💎', '🌟', '🔮', '🦋', '🧞', '🪐', '🌠', '👸', '🤴'] }
  ];
  var VIVOS = [
    { id: 'fogos', pt: 'Fogos', en: 'Fireworks', ico: '🎆' },
    { id: 'sorriso', pt: 'Sorriso', en: 'Smile', ico: '😊' },
    { id: 'estrela', pt: 'Estrela', en: 'Star', ico: '⭐' },
    { id: 'coracao', pt: 'Coração', en: 'Heart', ico: '💗' },
    { id: 'bolhas', pt: 'Bolhas', en: 'Bubbles', ico: '🧼' },
    { id: 'borboleta', pt: 'Borboleta', en: 'Butterfly', ico: '🦋' },
    { id: 'sol', pt: 'Sol', en: 'Sun', ico: '☀️' },
    { id: 'chuva', pt: 'Chuva', en: 'Rain', ico: '🌧️' },
    { id: 'neve', pt: 'Neve', en: 'Snow', ico: '❄️' },
    { id: 'confete', pt: 'Confete', en: 'Confetti', ico: '🎊' },
    { id: 'arco-iris', pt: 'Arco-íris', en: 'Rainbow', ico: '🌈' },
    { id: 'peixe', pt: 'Peixinho', en: 'Little fish', ico: '🐟' },
    { id: 'passaro', pt: 'Passarinho', en: 'Little bird', ico: '🐦' },
    { id: 'foguete', pt: 'Foguete', en: 'Rocket', ico: '🚀' },
    { id: 'flor', pt: 'Flor', en: 'Flower', ico: '🌸' },
    { id: 'baloes', pt: 'Balões', en: 'Balloons', ico: '🎈' },
    { id: 'fantasma', pt: 'Fantasminha', en: 'Little ghost', ico: '👻' },
    { id: 'gatinho', pt: 'Gatinho', en: 'Kitty', ico: '🐱' }
  ];
  var MOVIMENTOS = [
    { id: 'parado', ico: '⏸️', pt: 'Parado', en: 'Still' },
    { id: 'pula', ico: '🦘', pt: 'Pula', en: 'Bounce' },
    { id: 'balanca', ico: '🔔', pt: 'Balança', en: 'Swing' },
    { id: 'gira', ico: '🌀', pt: 'Gira', en: 'Spin' },
    { id: 'pulsa', ico: '💓', pt: 'Pulsa', en: 'Pulse' },
    { id: 'flutua', ico: '🎈', pt: 'Flutua', en: 'Float' }
  ];

  // ---------- ajudantes ----------
  function hash(i, j) { var x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return x - Math.floor(x); }
  function mod(a, b) { return ((a % b) + b) % b; }
  function lin(ctx, x0, y0, x1, y1, p) { var g = ctx.createLinearGradient(x0, y0, x1, y1); for (var i = 0; i < p.length; i++) g.addColorStop(p[i][0], p[i][1]); return g; }
  function rad(ctx, x0, y0, r0, x1, y1, r1, p) { var g = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1); for (var i = 0; i < p.length; i++) g.addColorStop(p[i][0], p[i][1]); return g; }
  // os gradientes ficam guardados: são feitos na caixa de 100 × 100, então servem para qualquer tamanho
  var GUARDA = {};
  function guardado(chave, fazer) { return GUARDA[chave] || (GUARDA[chave] = fazer()); }
  function circ(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU); }
  function oval(ctx, x, y, rx, ry, rot) {   // elipse com curvas (ctx.ellipse falta em navegador antigo)
    var c = Math.cos(rot || 0), s = Math.sin(rot || 0), k = 0.5523;
    function px(a, b) { return x + a * c - b * s; }
    function py(a, b) { return y + a * s + b * c; }
    ctx.moveTo(px(rx, 0), py(rx, 0));
    ctx.bezierCurveTo(px(rx, ry * k), py(rx, ry * k), px(rx * k, ry), py(rx * k, ry), px(0, ry), py(0, ry));
    ctx.bezierCurveTo(px(-rx * k, ry), py(-rx * k, ry), px(-rx, ry * k), py(-rx, ry * k), px(-rx, 0), py(-rx, 0));
    ctx.bezierCurveTo(px(-rx, -ry * k), py(-rx, -ry * k), px(-rx * k, -ry), py(-rx * k, -ry), px(0, -ry), py(0, -ry));
    ctx.bezierCurveTo(px(rx * k, -ry), py(rx * k, -ry), px(rx, -ry * k), py(rx, -ry * k), px(rx, 0), py(rx, 0));
    ctx.closePath();
  }
  function bola(ctx, x, y, r, cor) { ctx.fillStyle = cor; ctx.beginPath(); circ(ctx, x, y, r); ctx.fill(); }
  function elipse(ctx, x, y, rx, ry, cor, rot) { ctx.fillStyle = cor; ctx.beginPath(); oval(ctx, x, y, rx, ry, rot); ctx.fill(); }
  function brilho(ctx, x, y, r) {
    var q = r * 0.18;
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + q, y - q, x + r, y); ctx.quadraticCurveTo(x + q, y + q, x, y + r);
    ctx.quadraticCurveTo(x - q, y + q, x - r, y); ctx.quadraticCurveTo(x - q, y - q, x, y - r); ctx.closePath();
  }
  function coracaoP(ctx, x, y, r) {   // r = meia largura; ponta embaixo
    ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 0.35, y + r * 0.6, x - r, y + r * 0.2, x - r, y - r * 0.28);
    ctx.bezierCurveTo(x - r, y - r * 0.82, x - r * 0.2, y - r * 0.95, x, y - r * 0.45);
    ctx.bezierCurveTo(x + r * 0.2, y - r * 0.95, x + r, y - r * 0.82, x + r, y - r * 0.28);
    ctx.bezierCurveTo(x + r, y + r * 0.2, x + r * 0.35, y + r * 0.6, x, y + r * 0.9);
    ctx.closePath();
  }
  function estrelaP(ctx, x, y, R, r, n, giro) {
    for (var i = 0; i < n * 2; i++) {
      var a = (giro || 0) - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R;
      if (i) ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); else ctx.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
    }
    ctx.closePath();
  }
  // olhinhos que piscam de vez em quando (cada um no seu ritmo, pela "semente")
  function piscando(t, semente) { var p = mod(t + semente * 1.7, 3.1); return p < 0.14 ? Math.abs(p - 0.07) / 0.07 : 1; }
  function olhos(ctx, x, y, dx, r, aberto, cor) {
    if (aberto < 0.25) {
      ctx.strokeStyle = cor; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(x - dx - r, y); ctx.quadraticCurveTo(x - dx, y + r * 0.6, x - dx + r, y);
      ctx.moveTo(x + dx - r, y); ctx.quadraticCurveTo(x + dx, y + r * 0.6, x + dx + r, y); ctx.stroke();
      return;
    }
    ctx.fillStyle = cor; ctx.beginPath(); oval(ctx, x - dx, y, r * 0.85, r * 1.15 * aberto); oval(ctx, x + dx, y, r * 0.85, r * 1.15 * aberto); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); circ(ctx, x - dx - r * 0.25, y - r * 0.4 * aberto, r * 0.34); circ(ctx, x + dx - r * 0.25, y - r * 0.4 * aberto, r * 0.34); ctx.fill();
  }
  function olhosFelizes(ctx, x, y, dx, r, cor) {   // "^ ^"
    ctx.strokeStyle = cor; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x - dx - r, y + r * 0.3); ctx.quadraticCurveTo(x - dx, y - r * 0.9, x - dx + r, y + r * 0.3);
    ctx.moveTo(x + dx - r, y + r * 0.3); ctx.quadraticCurveTo(x + dx, y - r * 0.9, x + dx + r, y + r * 0.3); ctx.stroke();
  }
  function bochechas(ctx, x, y, dx, rx, cor) { ctx.fillStyle = cor || 'rgba(255,120,150,0.45)'; ctx.beginPath(); oval(ctx, x - dx, y, rx, rx * 0.62); oval(ctx, x + dx, y, rx, rx * 0.62); ctx.fill(); }
  function sorrisinho(ctx, x, y, w, cor, lw) {
    ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y + w * 0.9, x + w, y); ctx.stroke();
  }

  // ---------- os adesivos vivos (caixa de -50 a +50) ----------
  var VIVO = {};

  VIVO.fogos = function (ctx, t) {
    var centros = [[-18, -14], [20, -22], [0, 10]], cores = [['#ff5fa2', '#ffd23f'], ['#4fc8ff', '#b98cff'], ['#6fe07a', '#ff9a3c']];
    for (var b = 0; b < 3; b++) {
      var p = mod(t / 2.4 + b / 3, 1), cx = centros[b][0], cy = centros[b][1], i, a;
      if (p < 0.22) {   // subindo: um risquinho de luz
        var q = p / 0.22, y = 52 + (cy - 52) * (1 - (1 - q) * (1 - q));
        ctx.strokeStyle = 'rgba(255,230,160,0.85)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, y + 12); ctx.lineTo(cx, y); ctx.stroke();
        bola(ctx, cx, y, 2.4, '#fff6c8');
        continue;
      }
      var e = (p - 0.22) / 0.78, R = 34 * (1 - Math.pow(1 - e, 3)), cai = e * e * 10;
      ctx.globalAlpha = Math.max(0, 1 - e * e);
      if (e < 0.25) bola(ctx, cx, cy, 14 * (1 - e / 0.25) + 2, 'rgba(255,250,210,0.9)');
      for (var c = 0; c < 2; c++) {
        ctx.strokeStyle = cores[b][c]; ctx.lineWidth = 4.4 - e * 2; ctx.lineCap = 'round'; ctx.beginPath();
        for (i = c; i < 14; i += 2) {
          a = i * TAU / 14 + b;
          ctx.moveTo(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5 + cai * 0.6); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R + cai);
          // anel de dentro, mais curto (o fogo fica "cheio")
          ctx.moveTo(cx + Math.cos(a + 0.22) * R * 0.3, cy + Math.sin(a + 0.22) * R * 0.3 + cai * 0.4); ctx.lineTo(cx + Math.cos(a + 0.22) * R * 0.55, cy + Math.sin(a + 0.22) * R * 0.55 + cai * 0.5);
        }
        ctx.stroke();
      }
      ctx.fillStyle = '#fffbe6'; ctx.beginPath();
      for (i = 0; i < 14; i++) { a = i * TAU / 14 + b; circ(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R + cai, 2.4); }
      if (e > 0.4) for (i = 0; i < 7; i++) { a = i * TAU / 7 + b + 0.2; if (Math.sin(t * 25 + i * 3) > 0) brilho(ctx, cx + Math.cos(a) * R * 1.15, cy + Math.sin(a) * R * 1.15 + cai * 1.4, 2.6); }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  VIVO.sorriso = function (ctx, t) {
    var c = mod(t, 3.4), ri = c > 2.0 && c < 3.0, k = ri ? Math.sin((c - 2.0) * Math.PI) : 0;
    var y0 = ri ? -Math.abs(Math.sin(c * 18)) * 3 * k : 0;
    ctx.save(); ctx.translate(0, y0);
    ctx.fillStyle = guardado('sorriso', function () { return rad(ctx, -14, -18, 4, 0, 0, 46, [[0, '#fff7a8'], [0.6, '#ffd84a'], [1, '#ffb02e']]); });
    ctx.beginPath(); circ(ctx, 0, 0, 45); ctx.fill();
    ctx.strokeStyle = 'rgba(230,140,30,0.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); circ(ctx, 0, 0, 44); ctx.stroke();
    elipse(ctx, -18, -26, 13, 7, 'rgba(255,255,255,0.65)', -0.6);
    bochechas(ctx, 0, 10, 26, 8.5, 'rgba(255,110,140,0.5)');
    if (ri) olhosFelizes(ctx, 0, -9, 15, 6.5, '#6b3a1f'); else olhos(ctx, 0, -9, 15, 6.5, piscando(t, 1), '#6b3a1f');
    if (ri) {   // risadinha: boca aberta com linguinha
      var ab = 14 + k * 8;
      ctx.fillStyle = '#8a2f3a'; ctx.beginPath(); ctx.moveTo(-17, 9); ctx.quadraticCurveTo(0, 9 + ab * 1.6, 17, 9); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.moveTo(-17, 9); ctx.quadraticCurveTo(0, 9 + ab * 1.6, 17, 9); ctx.closePath(); ctx.clip();
      elipse(ctx, 0, 9 + ab * 0.9, 9, 6, '#ff7b8a'); ctx.restore();
      // "hihi": coraçõezinhos pulando dos lados
      ctx.fillStyle = '#ff6f9c'; ctx.beginPath(); coracaoP(ctx, -40, -34 - k * 6, 5 + k * 2); coracaoP(ctx, 40, -30 - k * 8, 4 + k * 2); ctx.fill();
    } else sorrisinho(ctx, 0, 10, 17, '#6b3a1f', 4.5);
    ctx.restore();
  };

  VIVO.estrela = function (ctx, t) {
    var pul = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.globalAlpha = 0.5 + 0.4 * pul;
    ctx.fillStyle = guardado('estrela-luz', function () { return rad(ctx, 0, 0, 10, 0, 0, 56, [[0, 'rgba(255,240,150,0.85)'], [1, 'rgba(255,240,150,0)']]); });
    ctx.beginPath(); circ(ctx, 0, 0, 56); ctx.fill(); ctx.globalAlpha = 1;
    var s = 1 + 0.05 * Math.sin(t * 4);
    ctx.save(); ctx.scale(s, s); ctx.rotate(Math.sin(t * 1.3) * 0.08);
    ctx.fillStyle = guardado('estrela', function () { return rad(ctx, -8, -10, 2, 0, 0, 48, [[0, '#fffbd0'], [0.55, '#ffd84a'], [1, '#ffa928']]); });
    ctx.strokeStyle = '#ffc23a'; ctx.lineWidth = 9; ctx.lineJoin = 'round';
    ctx.beginPath(); estrelaP(ctx, 0, 3, 42, 20, 5, 0); ctx.stroke(); ctx.fill();
    // faixa de brilho que passa por dentro da estrela
    ctx.save(); ctx.beginPath(); estrelaP(ctx, 0, 3, 46, 23, 5, 0); ctx.clip();
    var bx = -70 + mod(t * 0.5, 1) * 160; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(bx, -50); ctx.lineTo(bx + 12, -50); ctx.lineTo(bx - 18, 50); ctx.lineTo(bx - 30, 50); ctx.closePath(); ctx.fill();
    ctx.restore();
    olhos(ctx, 0, 2, 9, 4.2, piscando(t, 2), '#7a4a12');
    bochechas(ctx, 0, 10, 15, 4.5, 'rgba(255,120,120,0.45)');
    sorrisinho(ctx, 0, 10, 5.5, '#7a4a12', 2.6);
    ctx.restore();
    ctx.fillStyle = '#fffdf0'; ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = i * TAU / 6 + t * 0.4, k = Math.sin(t * 4 + i * 2.1);
      if (k > 0) brilho(ctx, Math.cos(a) * 50, Math.sin(a) * 50, 3 + 5 * k);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,60,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
  };

  VIVO.coracao = function (ctx, t) {
    var b = mod(t, 1.1), s = 1 + 0.13 * Math.exp(-Math.pow((b - 0.1) / 0.06, 2)) + 0.08 * Math.exp(-Math.pow((b - 0.33) / 0.06, 2));
    // coraçõezinhos subindo atrás
    var cs = ['#ff8fb5', '#ffb3cf', '#ff6f9c', '#ffc2dc', '#ff8fb5'];
    for (var i = 0; i < 5; i++) {
      var p = mod(t * 0.5 + i / 5, 1);
      ctx.globalAlpha = Math.min(1, (1 - p) * 2.5);
      ctx.fillStyle = cs[i]; ctx.beginPath(); coracaoP(ctx, -34 + i * 17 + Math.sin(p * 7 + i) * 5, 34 - p * 86, 5 + hash(i, 1) * 4); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(0, 4); ctx.scale(s, s);
    ctx.fillStyle = guardado('coracao', function () { return rad(ctx, -12, -14, 3, 0, 0, 44, [[0, '#ffb3cc'], [0.55, '#ff5c8a'], [1, '#e8336a']]); });
    ctx.beginPath(); coracaoP(ctx, 0, 0, 40); ctx.fill();
    elipse(ctx, -20, -17, 8, 5, 'rgba(255,255,255,0.7)', -0.7); bola(ctx, -10, -24, 2.4, 'rgba(255,255,255,0.8)');
    olhosFelizes(ctx, 0, -2, 11, 3.6, '#8a1f40');
    sorrisinho(ctx, 0, 6, 5, '#8a1f40', 2.4);
    bochechas(ctx, 0, 6, 19, 4, 'rgba(255,220,230,0.55)');
    ctx.restore();
  };

  VIVO.bolhas = function (ctx, t) {
    for (var i = 0; i < 5; i++) {
      var p = mod(t * 0.22 + i / 5, 1), r = 9 + hash(i, 2) * 11;
      var x = (hash(i, 1) - 0.5) * 58 + Math.sin(t * 1.4 + i) * 6, y = 44 - p * 92;
      ctx.save(); ctx.translate(x, y); ctx.scale(r * (1 + 0.04 * Math.sin(t * 5 + i)), r * (1 - 0.04 * Math.sin(t * 5 + i)));
      ctx.globalAlpha = Math.min(1, p * 6, (1 - p) * 5);
      ctx.fillStyle = guardado('bolha', function () { return rad(ctx, 0, 0, 0.5, 0, 0, 1, [[0, 'rgba(255,255,255,0.04)'], [0.7, 'rgba(190,225,255,0.22)'], [0.88, 'rgba(255,180,235,0.55)'], [1, 'rgba(120,200,255,0.85)']]); });
      ctx.beginPath(); circ(ctx, 0, 0, 1); ctx.fill();
      ctx.lineWidth = 0.13; ctx.lineCap = 'round';
      var arcos = [['#ff9ad5', -1.3, 0.1], ['#8fd8ff', 1.8, 3.0], ['#ffe07a', 0.4, 1.5], ['#b9a3ff', 3.3, 4.4]];
      for (var k = 0; k < arcos.length; k++) { ctx.strokeStyle = arcos[k][0]; ctx.beginPath(); ctx.arc(0, 0, 0.93, arcos[k][1] + t * 0.8, arcos[k][2] + t * 0.8); ctx.stroke(); }
      elipse(ctx, -0.38, -0.42, 0.26, 0.14, 'rgba(255,255,255,0.9)', -0.7); bola(ctx, 0.42, 0.4, 0.08, 'rgba(255,255,255,0.8)');
      ctx.restore();
    }
  };

  VIVO.borboleta = function (ctx, t) {
    var f = 0.22 + 0.78 * Math.abs(Math.cos(t * 5.5)), y0 = Math.sin(t * 5.5) * 2.5 + Math.sin(t * 1.2) * 2;
    ctx.save(); ctx.translate(0, y0);
    ctx.save(); ctx.scale(f, 1);
    ctx.fillStyle = guardado('bor-cima', function () { return lin(ctx, 0, -40, 0, 5, [[0, '#c48cff'], [1, '#ff7fc8']]); });
    ctx.beginPath(); oval(ctx, -22, -14, 23, 19, 0.55); oval(ctx, 22, -14, 23, 19, -0.55); ctx.fill();
    ctx.fillStyle = guardado('bor-baixo', function () { return lin(ctx, 0, 0, 0, 36, [[0, '#ffb36b'], [1, '#ffe07a']]); });
    ctx.beginPath(); oval(ctx, -17, 16, 15, 13, -0.5); oval(ctx, 17, 16, 15, 13, 0.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); circ(ctx, -30, -20, 5.5); circ(ctx, 30, -20, 5.5); circ(ctx, -20, 20, 3.5); circ(ctx, 20, 20, 3.5); ctx.fill();
    ctx.fillStyle = 'rgba(120,60,170,0.35)'; ctx.beginPath(); circ(ctx, -18, -8, 4); circ(ctx, 18, -8, 4); circ(ctx, -14, 13, 2.5); circ(ctx, 14, 13, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,170,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); oval(ctx, -22, -14, 23, 19, 0.55); oval(ctx, 22, -14, 23, 19, -0.55); oval(ctx, -17, 16, 15, 13, -0.5); oval(ctx, 17, 16, 15, 13, 0.5); ctx.stroke();
    ctx.restore();
    elipse(ctx, 0, 6, 4.5, 21, '#6a3f8a');
    bola(ctx, 0, -18, 7, '#6a3f8a');
    ctx.strokeStyle = '#6a3f8a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath();
    ctx.moveTo(-2, -23); ctx.quadraticCurveTo(-8, -38, -14, -40); ctx.moveTo(2, -23); ctx.quadraticCurveTo(8, -38, 14, -40); ctx.stroke();
    bola(ctx, -14, -40, 2.8, '#ff7fc8'); bola(ctx, 14, -40, 2.8, '#ff7fc8');
    bola(ctx, -2.6, -19, 1.4, '#ffffff'); bola(ctx, 2.6, -19, 1.4, '#ffffff');
    ctx.restore();
  };

  VIVO.sol = function (ctx, t) {
    ctx.save(); ctx.rotate(t * 0.6);
    for (var c = 0; c < 2; c++) {
      ctx.fillStyle = c ? '#ffb02e' : '#ffd23f'; ctx.beginPath();
      for (var i = c; i < 12; i += 2) {
        var a = i * TAU / 12, R = (c ? 41 : 48) + Math.sin(t * 4 + i) * 2.5;
        ctx.moveTo(Math.cos(a - 0.17) * 28, Math.sin(a - 0.17) * 28); ctx.quadraticCurveTo(Math.cos(a) * (R + 3), Math.sin(a) * (R + 3), Math.cos(a + 0.17) * 28, Math.sin(a + 0.17) * 28); ctx.closePath();
      }
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = guardado('sol', function () { return rad(ctx, -9, -10, 2, 0, 0, 32, [[0, '#fff8b8'], [0.6, '#ffd84a'], [1, '#ffb52e']]); });
    ctx.beginPath(); circ(ctx, 0, 0, 31); ctx.fill();
    elipse(ctx, -12, -17, 8, 4.5, 'rgba(255,255,255,0.6)', -0.6);
    olhos(ctx, 0, -5, 10, 4.2, piscando(t, 3), '#8a4a12');
    bochechas(ctx, 0, 6, 17, 5, 'rgba(255,110,90,0.45)');
    sorrisinho(ctx, 0, 6, 9, '#8a4a12', 3);
  };

  function nuvemP(ctx, x, y, s) { circ(ctx, x - s * 0.55, y + s * 0.1, s * 0.38); circ(ctx, x - s * 0.15, y - s * 0.22, s * 0.48); circ(ctx, x + s * 0.32, y - s * 0.1, s * 0.42); circ(ctx, x + s * 0.65, y + s * 0.14, s * 0.32); circ(ctx, x, y + s * 0.18, s * 0.4); }
  VIVO.chuva = function (ctx, t) {
    var i;
    ctx.fillStyle = '#5fb8ff'; ctx.beginPath();
    for (i = 0; i < 8; i++) {
      var p = mod(t * 1.3 + hash(i, 1), 1), x = -27 + i * 7.8, y = 4 + p * 42;
      if (p < 0.9) { ctx.moveTo(x, y - 6); ctx.quadraticCurveTo(x + 3.6, y + 0.5, x, y + 2.8); ctx.quadraticCurveTo(x - 3.6, y + 0.5, x, y - 6); ctx.closePath(); }
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(95,184,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (i = 0; i < 8; i++) { p = mod(t * 1.3 + hash(i, 1), 1); if (p >= 0.9) { var q = (p - 0.9) / 0.1; oval(ctx, -27 + i * 7.8, 46, 2 + q * 6, 0.8 + q * 1.5); } }
    ctx.stroke();
    var y0 = -16 + Math.sin(t * 1.4) * 1.5;
    ctx.fillStyle = '#c7d3ee'; ctx.beginPath(); nuvemP(ctx, 2, y0 + 3, 30); ctx.fill();
    ctx.fillStyle = '#f6f8ff'; ctx.beginPath(); nuvemP(ctx, 0, y0, 30); ctx.fill();
    ctx.strokeStyle = 'rgba(150,170,220,0.6)'; ctx.lineWidth = 1.6; ctx.stroke();
    olhosFelizes(ctx, 0, y0 + 2, 9, 3.2, '#5a6488');
    bochechas(ctx, 0, y0 + 9, 16, 4, 'rgba(255,140,170,0.5)');
    sorrisinho(ctx, 0, y0 + 9, 3.5, '#5a6488', 2);
  };

  function floco(ctx, x, y, r, giro) {
    for (var i = 0; i < 6; i++) {
      var a = giro + i * TAU / 6, c = Math.cos(a), s = Math.sin(a);
      ctx.moveTo(x, y); ctx.lineTo(x + c * r, y + s * r);
      var mx = x + c * r * 0.55, my = y + s * r * 0.55, b = r * 0.32;
      ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a + 0.8) * b, my + Math.sin(a + 0.8) * b);
      ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(a - 0.8) * b, my + Math.sin(a - 0.8) * b);
    }
  }
  VIVO.neve = function (ctx, t) {
    // floco grande no meio, girando devagar; flocos menores caindo em volta (azul por fora: aparece no papel branco)
    var caminhos = function () {
      floco(ctx, 0, 0, 24 * (1 + 0.05 * Math.sin(t * 2)), t * 0.3);
      var col = [-40, 34, -30, 42, -42, 30];
      for (var i = 0; i < col.length; i++) {
        var p = mod(t * 0.3 + i / col.length, 1);
        floco(ctx, col[i] + Math.sin(t * 1.2 + i) * 4, -48 + p * 96, 5 + hash(i, 2) * 4, t * (0.8 + hash(i, 3)) + i);
      }
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7cc4f5'; ctx.lineWidth = 5; ctx.beginPath(); caminhos(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.beginPath(); caminhos(); ctx.stroke();
    bola(ctx, 0, 0, 5, '#d9f0ff');
  };

  VIVO.confete = function (ctx, t) {
    var cores = ['#ff5fa2', '#ffd23f', '#4fc8ff', '#6fe07a', '#b98cff', '#ff9a3c'];
    // cone de festa embaixo
    ctx.save(); ctx.translate(0, 40); ctx.rotate(-0.25);
    ctx.fillStyle = '#7f6bff'; ctx.beginPath(); ctx.moveTo(-3, 14); ctx.lineTo(-13, -12); ctx.lineTo(13, -12); ctx.lineTo(3, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(-11, -6, 22, 4); ctx.fillRect(-8, 3, 16, 3.5);
    elipse(ctx, 0, -12, 13, 3.5, '#5a48d6');
    ctx.restore();
    for (var c = 0; c < cores.length; c++) {
      ctx.fillStyle = cores[c]; ctx.beginPath();
      for (var i = c; i < 36; i += cores.length) {
        var onda = i < 18 ? 0 : 0.5, p = mod(t / 2.6 + onda, 1), a = -Math.PI / 2 - 0.25 + (hash(i, 1) - 0.5) * 2.2, v = 70 + hash(i, 2) * 40;
        var k = 1 - Math.exp(-4.5 * p), x = Math.cos(a) * v * k * 0.7 + Math.sin(t * 3 + i) * 4 * p, y = 30 + Math.sin(a) * v * k + 75 * p * p;
        if (p > 0.85 || y > 48) continue;
        var g = t * (3 + hash(i, 3) * 3) + i, vira = Math.cos(t * (5 + hash(i, 4) * 4) + i), w = 4.5 * Math.max(0.15, Math.abs(vira)), h = 2.6;
        if (i % 3 === 0) { circ(ctx, x, y, 2.4); continue; }
        var cg = Math.cos(g), sg = Math.sin(g);
        ctx.moveTo(x + cg * w - sg * h, y + sg * w + cg * h); ctx.lineTo(x - cg * w - sg * h, y - sg * w + cg * h); ctx.lineTo(x - cg * w + sg * h, y - sg * w - cg * h); ctx.lineTo(x + cg * w + sg * h, y + sg * w - cg * h); ctx.closePath();
      }
      ctx.fill();
    }
  };

  VIVO['arco-iris'] = function (ctx, t) {
    var cores = ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'], i;
    ctx.lineCap = 'butt';
    for (i = 0; i < cores.length; i++) { ctx.strokeStyle = cores[i]; ctx.lineWidth = 6.6; ctx.beginPath(); ctx.arc(0, 22, 44 - i * 6.2, Math.PI, TAU); ctx.stroke(); }
    var a = Math.PI + mod(t * 0.45, 1.4) * Math.PI;
    if (a < TAU) { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 37; ctx.beginPath(); ctx.arc(0, 22, 28.5, Math.max(Math.PI, a - 0.12), Math.min(TAU, a + 0.12)); ctx.stroke(); }
    ctx.fillStyle = '#d9d2f5'; ctx.beginPath(); nuvemP(ctx, -35, 27, 13); nuvemP(ctx, 37, 27, 13); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); nuvemP(ctx, -36, 24, 13); nuvemP(ctx, 36, 24, 13); ctx.fill();
    ctx.strokeStyle = 'rgba(170,160,230,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#fff3a8'; ctx.beginPath();
    for (i = 0; i < 4; i++) { var k = Math.sin(t * 3.5 + i * 1.8); if (k > 0) brilho(ctx, [-40, -12, 18, 44][i], [-26, -40, -38, -18][i], 2 + k * 4.5); }
    ctx.fill(); ctx.strokeStyle = 'rgba(240,180,40,0.8)'; ctx.lineWidth = 1; ctx.stroke();
  };

  VIVO.peixe = function (ctx, t) {
    var c = Math.cos(t * 0.9), sx = c >= 0 ? Math.max(0.12, c) : Math.min(-0.12, c), x = Math.sin(t * 0.9) * 20, y = Math.sin(t * 2.2) * 3;
    // bolhinhas que saem da boca (ficam onde nasceram)
    ctx.strokeStyle = 'rgba(80,170,230,0.8)'; ctx.lineWidth = 1.6; ctx.beginPath();
    for (var i = 0; i < 3; i++) { var p = mod(t * 0.7 + i / 3, 1), bx = Math.sin((t - p / 0.7) * 0.9) * 20 + 24 * (Math.cos((t - p / 0.7) * 0.9) >= 0 ? 1 : -1); circ(ctx, bx + Math.sin(p * 9) * 2, -6 - p * 40, 2 + p * 3); }
    ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
    var rabo = Math.sin(t * 9) * 0.35;
    ctx.save(); ctx.translate(-20, 0); ctx.rotate(rabo);
    ctx.fillStyle = '#ff8a3c'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(-12, -20, -19, -17); ctx.quadraticCurveTo(-12, 0, -19, 17); ctx.quadraticCurveTo(-12, 20, 2, 0); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ff9a4d'; ctx.beginPath(); ctx.moveTo(-6, -15); ctx.quadraticCurveTo(2, -30, 12, -16); ctx.closePath(); ctx.moveTo(-2, 14); ctx.quadraticCurveTo(4, 24, 10, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = guardado('peixe', function () { return lin(ctx, 0, -18, 0, 18, [[0, '#ffc94d'], [1, '#ff7b3c']]); });
    ctx.beginPath(); oval(ctx, 2, 0, 25, 18); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.quadraticCurveTo(-1, 0, -6, 16); ctx.lineTo(-11, 14); ctx.quadraticCurveTo(-6, 0, -11, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.beginPath(); oval(ctx, 6, 7, 13, 6); ctx.fill();
    bola(ctx, 14, -4, 6.5, '#ffffff'); bola(ctx, 15.5, -4, 4, '#3a2a3f'); bola(ctx, 14.2, -5.6, 1.5, '#ffffff');
    ctx.strokeStyle = '#a3471f'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(20, 5); ctx.quadraticCurveTo(23, 8, 26, 4); ctx.stroke();
    elipse(ctx, 9, 5, 3.5, 2.2, 'rgba(255,100,120,0.5)');
    ctx.restore();
  };

  VIVO.passaro = function (ctx, t) {
    var bate = Math.sin(t * 11), y0 = Math.sin(t * 11) * 1.8 + Math.sin(t * 1.4) * 4;
    ctx.save(); ctx.translate(0, y0); ctx.rotate(Math.sin(t * 1.4) * 0.06);
    ctx.fillStyle = '#4a9ee8'; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(-38, -6); ctx.lineTo(-34, 4); ctx.lineTo(-40, 12); ctx.closePath(); ctx.fill();
    // asa de trás
    ctx.save(); ctx.translate(-2, -4); ctx.rotate(-0.3 - bate * 0.7); elipse(ctx, -8, -10, 9, 17, '#4a9ee8', 0.4); ctx.restore();
    ctx.fillStyle = guardado('passaro', function () { return rad(ctx, -6, -10, 2, 0, 0, 26, [[0, '#a8dcff'], [1, '#5fb4f5']]); });
    ctx.beginPath(); oval(ctx, 0, 0, 24, 21); ctx.fill();
    elipse(ctx, 6, 9, 14, 10, '#fff4dc');
    ctx.save(); ctx.translate(-4, -2); ctx.rotate(0.2 + bate * 0.8); elipse(ctx, -9, -8, 9, 17, '#6fc0ff', 0.5); ctx.restore();
    ctx.fillStyle = '#ffb02e'; ctx.beginPath(); ctx.moveTo(21, -4); ctx.lineTo(33, 0); ctx.lineTo(21, 5); ctx.closePath(); ctx.fill();
    bola(ctx, 13, -7, 4.2, '#2f2a40'); bola(ctx, 14, -8.4, 1.5, '#ffffff');
    elipse(ctx, 12, 2, 4, 2.6, 'rgba(255,120,150,0.55)');
    ctx.strokeStyle = '#4a9ee8'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-2, -20); ctx.quadraticCurveTo(0, -28, 6, -27); ctx.moveTo(1, -20); ctx.quadraticCurveTo(6, -26, 10, -23); ctx.stroke();
    ctx.restore();
  };

  VIVO.foguete = function (ctx, t) {
    var tr = (hash(Math.floor(t * 30), 1) - 0.5) * 1.2, i;
    // risquinhos de velocidade passando
    ctx.strokeStyle = 'rgba(150,180,255,0.6)'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath();
    for (i = 0; i < 4; i++) { var p = mod(t * 1.6 + i / 4, 1), x = [-34, -26, 28, 36][i]; ctx.moveTo(x, -40 + p * 90); ctx.lineTo(x, -28 + p * 90); }
    ctx.stroke();
    // fumacinha
    for (i = 0; i < 3; i++) { var q = mod(t * 1.2 + i / 3, 1); ctx.globalAlpha = 0.7 * (1 - q); bola(ctx, (i - 1) * 6 * q * 2, 34 + q * 18, 4 + q * 7, '#e9e4f5'); }
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(tr, 0); ctx.rotate(0.12);
    var ch = 1 + 0.25 * Math.sin(t * 31) + 0.15 * Math.sin(t * 47);
    ctx.fillStyle = '#ff7a3c'; ctx.beginPath(); ctx.moveTo(-9, 22); ctx.quadraticCurveTo(-8, 34 + 8 * ch, 0, 38 + 12 * ch); ctx.quadraticCurveTo(8, 34 + 8 * ch, 9, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(-5, 22); ctx.quadraticCurveTo(-4, 30 + 5 * ch, 0, 32 + 7 * ch); ctx.quadraticCurveTo(4, 30 + 5 * ch, 5, 22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5f6d'; ctx.beginPath(); ctx.moveTo(-12, 4); ctx.quadraticCurveTo(-24, 12, -22, 26); ctx.lineTo(-10, 20); ctx.closePath(); ctx.moveTo(12, 4); ctx.quadraticCurveTo(24, 12, 22, 26); ctx.lineTo(10, 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = guardado('foguete', function () { return lin(ctx, -14, 0, 14, 0, [[0, '#ffffff'], [0.6, '#eef0fb'], [1, '#c9cbe8']]); });
    ctx.beginPath(); ctx.moveTo(0, -42); ctx.bezierCurveTo(16, -30, 15, 0, 11, 22); ctx.lineTo(-11, 22); ctx.bezierCurveTo(-15, 0, -16, -30, 0, -42); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,140,190,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#ff5f6d'; ctx.beginPath(); ctx.moveTo(0, -42); ctx.bezierCurveTo(8, -36, 11, -30, 12.5, -24); ctx.quadraticCurveTo(0, -20, -12.5, -24); ctx.bezierCurveTo(-11, -30, -8, -36, 0, -42); ctx.fill();
    bola(ctx, 0, -6, 8.5, '#7f8ad6'); bola(ctx, 0, -6, 6.5, '#8fd8ff'); elipse(ctx, -2.5, -8.5, 2.6, 1.6, 'rgba(255,255,255,0.85)', -0.6);
    ctx.fillStyle = '#ff5f6d'; ctx.beginPath(); ctx.moveTo(-2, 10); ctx.lineTo(2, 10); ctx.lineTo(2.5, 22); ctx.lineTo(-2.5, 22); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  VIVO.flor = function (ctx, t) {
    var bal = Math.sin(t * 1.5) * 7, hx = bal, hy = -14, ab = 0.88 + 0.12 * Math.sin(t * 1.1), i;
    ctx.strokeStyle = '#4fae5a'; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 50); ctx.quadraticCurveTo(-bal * 0.3, 18, hx, hy); ctx.stroke();
    ctx.fillStyle = '#6cc46a'; ctx.beginPath(); oval(ctx, -11 - bal * 0.1, 30, 11, 5, 0.5 + Math.sin(t * 1.5) * 0.1); oval(ctx, 11 - bal * 0.15, 22, 11, 5, -0.5 + Math.sin(t * 1.5 + 1) * 0.1); ctx.fill();
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(bal * 0.02 + t * 0.25);
    ctx.fillStyle = '#ff8cc6'; ctx.beginPath(); for (i = 0; i < 8; i++) { var a = i * TAU / 8; oval(ctx, Math.cos(a) * 19 * ab, Math.sin(a) * 19 * ab, 13 * ab, 8.5, a); } ctx.fill();
    ctx.fillStyle = '#ffc2e2'; ctx.beginPath(); for (i = 0; i < 8; i++) { a = i * TAU / 8 + 0.39; oval(ctx, Math.cos(a) * 13 * ab, Math.sin(a) * 13 * ab, 9 * ab, 6, a); } ctx.fill();
    ctx.restore();
    ctx.fillStyle = guardado('flor', function () { return rad(ctx, -3, -3, 1, 0, 0, 12, [[0, '#fff3a0'], [1, '#ffc22e']]); });
    ctx.beginPath(); circ(ctx, hx, hy, 11); ctx.fill();
    olhosFelizes(ctx, hx, hy - 1, 4.2, 1.9, '#8a5212');
    sorrisinho(ctx, hx, hy + 3, 3, '#8a5212', 1.6);
    bochechas(ctx, hx, hy + 3, 7, 2.2, 'rgba(255,120,120,0.55)');
  };

  VIVO.baloes = function (ctx, t) {
    var b = [[-17, -12, '#ff5f7e', 0], [17, -16, '#4fb8ff', 1.3], [0, -26, '#ffd23f', 2.4]], i, x, y;
    ctx.strokeStyle = 'rgba(120,110,150,0.8)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath();
    for (i = 0; i < 3; i++) {
      x = b[i][0] + Math.sin(t * 1.1 + b[i][3]) * 4; y = b[i][1] + Math.sin(t * 1.5 + b[i][3]) * 3;
      ctx.moveTo(x, y + 19); ctx.quadraticCurveTo(x * 0.5 + Math.sin(t * 2 + i) * 4, y + 34, 0, 46);
    }
    ctx.stroke();
    bola(ctx, 0, 46, 2, '#ff8cc6');
    for (i = 0; i < 3; i++) {
      x = b[i][0] + Math.sin(t * 1.1 + b[i][3]) * 4; y = b[i][1] + Math.sin(t * 1.5 + b[i][3]) * 3;
      var r = Math.sin(t * 1.1 + b[i][3]) * 0.12;
      ctx.fillStyle = b[i][2]; ctx.beginPath(); oval(ctx, x, y, 14, 17, r); ctx.moveTo(x - 3, y + 19); ctx.lineTo(x + 3, y + 19); ctx.lineTo(x, y + 15.5); ctx.closePath(); ctx.fill();
      elipse(ctx, x + 4, y + 4, 9, 12, 'rgba(0,0,40,0.1)', r);
      elipse(ctx, x - 5, y - 7, 3.6, 6, 'rgba(255,255,255,0.75)', 0.5 + r);
    }
  };

  VIVO.fantasma = function (ctx, t) {
    var y0 = Math.sin(t * 1.6) * 5, i;
    ctx.save(); ctx.translate(0, y0);
    elipse(ctx, 0, 48 - y0, 18 - y0 * 0.6, 3.5, 'rgba(120,100,180,0.18)');
    function corpo() {
      ctx.moveTo(-28, 26); ctx.lineTo(-28, -8); ctx.bezierCurveTo(-28, -50, 28, -50, 28, -8); ctx.lineTo(28, 26);
      for (var k = 0; k < 4; k++) { var x1 = 28 - (k + 1) * 14, dy = 6 + Math.sin(t * 4 + k * 1.6) * 4; ctx.quadraticCurveTo(28 - k * 14 - 7, 26 + dy * 1.6, x1, 26); }
      ctx.closePath();
    }
    // bracinhos acenando
    ctx.fillStyle = '#f4f1ff'; ctx.strokeStyle = '#c3b3f2'; ctx.lineWidth = 2.4;
    ctx.save(); ctx.translate(-26, 2); ctx.rotate(-0.6 + Math.sin(t * 5) * 0.35); ctx.beginPath(); oval(ctx, -6, 0, 9, 5.5); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(26, 2); ctx.rotate(0.5 - Math.sin(t * 5 + 1) * 0.2); ctx.beginPath(); oval(ctx, 6, 0, 9, 5.5); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = guardado('fantasma', function () { return lin(ctx, -28, 0, 28, 0, [[0, '#ffffff'], [0.65, '#f4f1ff'], [1, '#ddd3fb']]); });
    ctx.beginPath(); corpo(); ctx.fill(); ctx.stroke();
    elipse(ctx, -12, -26, 7, 4, 'rgba(255,255,255,0.9)', -0.6);
    olhos(ctx, 0, -10, 10, 5, piscando(t, 4), '#3f3360');
    bochechas(ctx, 0, 0, 16, 4.5, 'rgba(255,140,180,0.5)');
    elipse(ctx, 0, 4, 3.6, 4.2 + Math.sin(t * 3) * 0.8, '#5a4683');
    ctx.restore();
    for (i = 0; i < 3; i++) { var p = mod(t * 0.5 + i / 3, 1); ctx.globalAlpha = 1 - p; bola(ctx, 34 + Math.sin(p * 6 + i) * 3, -30 - p * 16 + i * 6, 2 + i * 0.6, '#c3b3f2'); }
    ctx.globalAlpha = 1;
  };

  VIVO.gatinho = function (ctx, t) {
    var lado = Math.sin(t * 2.2), orelha = mod(t, 3.6) < 0.25 ? Math.sin(mod(t, 3.6) / 0.25 * Math.PI) * 0.35 : 0;
    var lar = '#ffad5c', esc = '#f08a32';
    // rabo balançando
    ctx.strokeStyle = lar; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(14, 38);
    ctx.bezierCurveTo(36, 40, 40 + lado * 4, 18, 34 + lado * 12, 0 - Math.abs(lado) * 4); ctx.stroke();
    ctx.strokeStyle = esc; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(35 + lado * 11.5, 4 - Math.abs(lado) * 4); ctx.lineTo(34 + lado * 12, 0 - Math.abs(lado) * 4); ctx.stroke();
    // corpo sentado
    ctx.fillStyle = lar; ctx.beginPath(); ctx.moveTo(-22, 44); ctx.bezierCurveTo(-28, 16, -18, 0, 0, 0); ctx.bezierCurveTo(18, 0, 28, 16, 22, 44); ctx.closePath(); ctx.fill();
    elipse(ctx, 0, 30, 10, 13, '#fff1e0');
    ctx.strokeStyle = esc; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-22, 22); ctx.lineTo(-15, 24); ctx.moveTo(-23, 31); ctx.lineTo(-15, 32); ctx.moveTo(22, 22); ctx.lineTo(15, 24); ctx.moveTo(23, 31); ctx.lineTo(15, 32); ctx.stroke();
    elipse(ctx, -10, 44, 7, 4.5, '#fff1e0'); elipse(ctx, 10, 44, 7, 4.5, '#fff1e0');
    // cabeça
    ctx.save(); ctx.translate(0, -16); ctx.rotate(Math.sin(t * 0.9) * 0.06);
    ctx.fillStyle = lar; ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(-20, -30); ctx.lineTo(-6, -17); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(14, -14); ctx.rotate(orelha); ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(6, -16); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb3c6'; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(5, -10); ctx.lineTo(5, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffb3c6'; ctx.beginPath(); ctx.moveTo(-18, -9); ctx.lineTo(-17, -24); ctx.lineTo(-9, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lar; ctx.beginPath(); oval(ctx, 0, 0, 24, 19); ctx.fill();
    ctx.strokeStyle = esc; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, -11); ctx.moveTo(-6, -17); ctx.lineTo(-4, -11); ctx.moveTo(6, -17); ctx.lineTo(4, -11); ctx.stroke();
    elipse(ctx, 0, 7, 11, 7, '#fff1e0');
    olhos(ctx, 0, -2, 9.5, 4.2, piscando(t, 5), '#3b2b2b');
    ctx.fillStyle = '#ff7b9c'; ctx.beginPath(); ctx.moveTo(-2.6, 3); ctx.lineTo(2.6, 3); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3b2b2b'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(-2, 9.5, -5, 8); ctx.moveTo(0, 6); ctx.quadraticCurveTo(2, 9.5, 5, 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,50,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath();
    ctx.moveTo(-10, 5); ctx.lineTo(-25, 2); ctx.moveTo(-10, 7); ctx.lineTo(-25, 9); ctx.moveTo(10, 5); ctx.lineTo(25, 2); ctx.moveTo(10, 7); ctx.lineTo(25, 9); ctx.stroke();
    bochechas(ctx, 0, 5, 14, 3.4, 'rgba(255,120,140,0.5)');
    ctx.restore();
  };

  // ---------- emojis (com a imagem guardada) ----------
  var CACHE = {}, nCache = 0;
  function imagemEmoji(e, lado) {
    if (typeof document === 'undefined' || !document.createElement) return null;
    var chave = e + '|' + lado;
    if (CACHE[chave]) return CACHE[chave];
    if (nCache > 240) { CACHE = {}; nCache = 0; }   // não deixa a memória crescer sem fim
    var cv = document.createElement('canvas');
    cv.width = cv.height = lado;
    var c = cv.getContext && cv.getContext('2d');
    if (!c) return null;
    c.font = Math.round(lado * 0.8) + 'px ' + FONTE; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(e, lado / 2, lado * 0.54);
    CACHE[chave] = cv; nCache++;
    return cv;
  }
  // quantos pixels de tela vale 1 unidade agora (para escolher a imagem de 64, 128 ou 256)
  function escalaDe(ctx) {
    var m = ctx.getTransform ? ctx.getTransform() : null;
    if (!m || typeof m.a !== 'number') return 1;
    return Math.sqrt(m.a * m.a + m.b * m.b) || 1;
  }
  function emoji(ctx, e, s) {
    if (!e) return;
    var px = s * escalaDe(ctx), lado = px <= 64 ? 64 : px <= 128 ? 128 : 256;
    var cv = imagemEmoji(String(e), lado);
    if (cv) ctx.drawImage(cv, -s * 0.5, -s * 0.5, s, s);
    else { ctx.font = Math.round(s * 0.8) + 'px ' + FONTE; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(e), 0, s * 0.04); }
  }

  // ---------- movimentos (valem para emoji e para vivo) ----------
  function mover(ctx, mov, t, f, s) {
    var k;
    if (mov === 'pula') {
      k = mod(t * 1.3 + f, 1);
      var sobe = 4 * k * (1 - k), am = Math.max(0, 1 - Math.min(k, 1 - k) * 9);   // "am" = amassadinho ao tocar o chão
      ctx.translate(0, -sobe * s * 0.38 + s * 0.5); ctx.scale(1 + am * 0.14, 1 - am * 0.14); ctx.translate(0, -s * 0.5);
    } else if (mov === 'balanca') {
      ctx.translate(0, s * 0.45); ctx.rotate(Math.sin((t * 0.9 + f) * TAU) * 0.24); ctx.translate(0, -s * 0.45);
    } else if (mov === 'gira') {
      ctx.rotate(mod(t * 0.45 + f, 1) * TAU);
    } else if (mov === 'pulsa') {
      k = 1 + 0.14 * Math.sin((t * 1.3 + f) * TAU); ctx.scale(k, k);
    } else if (mov === 'flutua') {
      var a = (t * 0.42 + f) * TAU;
      ctx.translate(Math.sin(a * 0.5) * s * 0.08, Math.sin(a) * s * 0.1); ctx.rotate(Math.sin(a + 1) * 0.07);
    }
  }

  function desenhar(ctx, a, t) {
    if (!a) return;
    var s = a.s > 0 ? a.s : 100, f = a.fase || 0;
    t = t || 0;
    ctx.save();
    try {
      ctx.translate(a.x || 0, a.y || 0);
      mover(ctx, a.mov, t, f, s);
      ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (a.tipo === 'vivo') {
        var d = VIVO[a.v];
        if (d) { ctx.scale(s / 100, s / 100); d(ctx, t + f * 7.3); }
      } else emoji(ctx, a.v, s);
    } finally { ctx.restore(); }
  }

  var API = { GRUPOS: GRUPOS, VIVOS: VIVOS, MOVIMENTOS: MOVIMENTOS, desenhar: desenhar };
  raiz.DesenhoAdesivos = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
