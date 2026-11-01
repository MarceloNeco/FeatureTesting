/* Purpurina — a "sala": canal por onde a TV e os celulares trocam mensagens pequenas (o visual de cada
   personagem, giro, desfile e os comandos de música). Mesmo jeito da Peluqueria (peluqueria/sala.js):
   Supabase Realtime broadcast, canal "purpurina-<código>", com a URL e a chave publishable da plataforma
   (públicas por desenho: não dão acesso a tabela nenhuma). O supabase-js é o da Bagunçolândia
   (../baguncolandia/libs/supabase.js), carregado só quando alguém abre a TV ou conecta o celular.
   Com ?teste (ou ?local), o canal é um BroadcastChannel do próprio navegador (testes sem internet).
   Toda mensagem que chega passa por validar() antes de ser usada.
   PurpurinaSala.abrir(codigo, aoReceber) → Promise<{ mandar(msg), fechar() }> */
(function (raiz) {
  'use strict';
  var SUPABASE_URL = 'https://qvdvkqydhnadhewcidia.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_oRJmeUwlBbOP_HoOXf0xLw_4O8v43EA';
  var LIB = '../baguncolandia/libs/supabase.js';
  var LOCAL = /[?&](teste|local)\b/.test((raiz.location && raiz.location.search) || '');
  var sb = null, carregando = null;

  var TIPOS = { oi: 1, visual: 1, giro: 1, volta: 1, desfile: 1, musica: 1, som: 1, tchau: 1, tv: 1 };
  function texto(v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; }
  /* Só passa o que o app sabe usar; o resto é jogado fora (a sala é pública: qualquer um com o código manda). */
  function validar(m) {
    if (!m || typeof m !== 'object' || !TIPOS[m.t]) return null;
    var r = { t: m.t, id: texto(m.id, 12).replace(/[^a-z0-9]/gi, '') };
    if (m.nome != null) r.nome = texto(m.nome, 16).replace(/[<>]/g, '');
    if (m.e && typeof m.e === 'object' && !Array.isArray(m.e)) {
      var e = {}; Object.keys(m.e).slice(0, 80).forEach(function (k) { if (/^[a-zA-Z]{2,20}$/.test(k) && typeof m.e[k] === 'string') e[k] = m.e[k].slice(0, 24); });
      r.e = e;
    }
    if (typeof m.ang === 'number' && isFinite(m.ang)) r.ang = ((m.ang % 360) + 360) % 360;
    if (m.d != null) r.d = texto(m.d, 20).replace(/[^a-z]/gi, '');
    if (typeof m.est === 'number') r.est = Math.max(0, Math.min(3, Math.round(m.est)));
    if (m.fonte != null) r.fonte = ['purpurina', 'youtube', 'spotify'].indexOf(m.fonte) >= 0 ? m.fonte : '';
    if (m.ref != null) r.ref = texto(m.ref, 60).replace(/[^A-Za-z0-9_:-]/g, '');
    if (m.acao != null) r.acao = ['tocar', 'pausar', 'prox', 'ant', 'parar'].indexOf(m.acao) >= 0 ? m.acao : '';
    if (m.titulo != null) r.titulo = texto(m.titulo, 80);
    if (typeof m.tocando === 'boolean') r.tocando = m.tocando;
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
    var bc = new BroadcastChannel('purpurina-' + codigo), r = receber(aoReceber);
    bc.onmessage = function (ev) { r(ev.data); };
    return Promise.resolve({ mandar: function (m) { try { bc.postMessage(m); } catch (e) { /* canal fechado */ } }, fechar: function () { try { bc.close(); } catch (e) { /* ok */ } } });
  }
  function abrirSupabase(codigo, aoReceber) {
    return carregarLib().then(function () {
      if (!sb) sb = raiz.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 20 } }, auth: { persistSession: false, autoRefreshToken: false } });
      return new Promise(function (ok, falha) {
        var pronto = false, r = receber(aoReceber), canal = sb.channel('purpurina-' + codigo, { config: { broadcast: { self: false } } });
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

  var API = { abrir: function (codigo, aoReceber) { return LOCAL ? abrirLocal(codigo, aoReceber) : abrirSupabase(codigo, aoReceber); }, validar: validar, codigoNovo: codigoNovo, idNovo: idNovo, LOCAL: LOCAL };
  raiz.PurpurinaSala = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
