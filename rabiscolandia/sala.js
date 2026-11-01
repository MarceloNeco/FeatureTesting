/* Rabiscolândia — a "sala": canal por onde a TV e os celulares trocam mensagens pequenas. Mesmo jeito da
   Purpurina e da Peluqueria (Supabase Realtime broadcast, canal "rabisco-<código>", com a URL e a chave
   publishable da plataforma — públicas por desenho: não dão acesso a tabela nenhuma). O supabase-js é o da
   Bagunçolândia (../baguncolandia/libs/supabase.js), carregado só quando alguém abre a TV ou conecta o celular.
   Com ?teste (ou ?local), o canal é um BroadcastChannel do próprio navegador (testes sem internet).
   Só passam pontos (onde mirar) e comandos — NUNCA imagem da câmera. Toda mensagem que chega passa por
   validar() antes de ser usada (a sala é pública: qualquer um com o código manda).
   DesenhoSala.abrir(codigo, aoReceber) → Promise<{ mandar(msg), fechar() }> */
(function (raiz) {
  'use strict';
  var SUPABASE_URL = 'https://qvdvkqydhnadhewcidia.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_oRJmeUwlBbOP_HoOXf0xLw_4O8v43EA';
  var LIB = '../baguncolandia/libs/supabase.js';
  var LOCAL = /[?&](teste|local)\b/.test((raiz.location && raiz.location.search) || '');
  var sb = null, carregando = null;

  var TIPOS = { oi: 1, tchau: 1, tv: 1, mira: 1, ferramenta: 1, cmd: 1 };
  var ACOES = ['desfazer', 'limpar', 'zoommais', 'zoommenos', 'ajustar', 'carimbo', 'fundo', 'pagina', 'livre', 'musica', 'foto'];
  function texto(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
  function num01(v) { return typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(1, v)) : null; }
  function id(v, max) { return texto(v, max).replace(/[^a-z0-9-]/gi, ''); }
  function validar(m) {
    if (!m || typeof m !== 'object' || !TIPOS[m.t]) return null;
    var r = { t: m.t, id: id(m.id, 12) };
    if (m.nome != null) r.nome = texto(m.nome, 16).replace(/[<>]/g, '');
    if (m.t === 'mira') {
      var x = num01(m.x), y = num01(m.y);
      if (x == null || y == null) return null;
      r.x = x; r.y = y; r.d = m.d === 1 || m.d === true ? 1 : 0;
      r.m = ['toque', 'giro', 'mao'].indexOf(m.m) >= 0 ? m.m : 'toque';
    }
    if (m.t === 'ferramenta') {
      if (m.pincel != null) r.pincel = id(m.pincel, 20);
      if (m.cor != null && /^#[0-9a-f]{6}$/i.test(m.cor)) r.cor = m.cor;
      if (typeof m.tam === 'number' && isFinite(m.tam)) r.tam = Math.max(1, Math.min(200, m.tam));
    }
    if (m.t === 'cmd') {
      if (ACOES.indexOf(m.acao) < 0) return null;
      r.acao = m.acao;
      if (m.v != null) r.v = texto(m.v, 24).replace(/[<>"'`\\]/g, '');
      if (m.tipo != null) r.tipo = ['emoji', 'vivo'].indexOf(m.tipo) >= 0 ? m.tipo : '';
      if (m.mov != null) r.mov = id(m.mov, 12);
      if (m.modo != null) r.modo = ['livre', 'colorir', 'numeros'].indexOf(m.modo) >= 0 ? m.modo : 'colorir';
    }
    if (m.t === 'tv' && m.cor != null && /^#[0-9a-f]{6}$/i.test(m.cor)) r.cor = m.cor;
    return r;
  }

  function codigoNovo() { var L = 'ABCDEFGHJKLMNPRSTUVWXYZ', c = ''; for (var i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)]; return c; }
  function idNovo() { var c = ''; while (c.length < 8) c += Math.random().toString(36).slice(2); return c.slice(0, 8); }
  function receber(aoReceber) { return function (dado) { var m = validar(dado); if (m) { try { aoReceber(m); } catch (e) { if (raiz.console) console.warn(e); } } }; }

  function carregarLib() {
    if (raiz.supabase) return Promise.resolve();
    if (carregando) return carregando;
    carregando = new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = LIB; s.onload = function () { ok(); }; s.onerror = function () { carregando = null; falha(new Error('supabase-js não carregou')); };
      document.head.appendChild(s);
    });
    return carregando;
  }
  function abrirLocal(codigo, aoReceber) {
    var bc = new BroadcastChannel('rabisco-' + codigo), r = receber(aoReceber);
    bc.onmessage = function (ev) { r(ev.data); };
    return Promise.resolve({ mandar: function (m) { try { bc.postMessage(m); } catch (e) { /* canal fechado */ } }, fechar: function () { try { bc.close(); } catch (e) { /* ok */ } } });
  }
  function abrirSupabase(codigo, aoReceber) {
    return carregarLib().then(function () {
      if (!sb) sb = raiz.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 30 } }, auth: { persistSession: false, autoRefreshToken: false } });
      return new Promise(function (ok, falha) {
        var pronto = false, r = receber(aoReceber), canal = sb.channel('rabisco-' + codigo, { config: { broadcast: { self: false } } });
        canal.on('broadcast', { event: 'm' }, function (x) { r(x.payload); });
        canal.subscribe(function (st) {
          if (st === 'SUBSCRIBED' && !pronto) {
            pronto = true;
            ok({ mandar: function (m) { try { canal.send({ type: 'broadcast', event: 'm', payload: m }); } catch (e) { /* sem rede */ } }, fechar: function () { try { sb.removeChannel(canal); } catch (e) { /* ok */ } } });
          } else if ((st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') && !pronto) { pronto = true; falha(new Error(st)); }
        });
      });
    });
  }

  var API = { abrir: function (codigo, aoReceber) { return LOCAL ? abrirLocal(codigo, aoReceber) : abrirSupabase(codigo, aoReceber); }, validar: validar, codigoNovo: codigoNovo, idNovo: idNovo, LOCAL: LOCAL, ACOES: ACOES };
  raiz.DesenhoSala = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
