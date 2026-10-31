/* Peluqueria — a "sala": o canal por onde a TV e os celulares trocam mensagens pequenas (sem vídeo).
   De verdade: Supabase Realtime broadcast, canal "peluqueria-<código>", com a URL e a chave publishable da
   plataforma (as mesmas da Bagunçolândia; públicas por desenho, não dão acesso a tabela nenhuma). O
   supabase-js é o da Bagunçolândia (../baguncolandia/libs/supabase.js), carregado só quando alguém abre a TV
   ou o controle. Com ?teste (ou ?local), o canal é um BroadcastChannel do próprio navegador: o teste abre a TV
   e o celular em duas abas, sem internet.
   Toda mensagem que chega passa por Peluqueria.validarMensagem antes de ser usada.
   Sala.abrir(codigo, aoReceber) → Promise<{ mandar(msg), fechar() }> */
(function (root) {
  'use strict';
  var SUPABASE_URL = 'https://qvdvkqydhnadhewcidia.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_oRJmeUwlBbOP_HoOXf0xLw_4O8v43EA';
  var LIB = '../baguncolandia/libs/supabase.js';
  var LOCAL = /[?&](teste|local)\b/.test((root.location && root.location.search) || '');
  var V = root.Peluqueria.validarMensagem;
  var sb = null, carregando = null;

  function codigoNovo() { var L = 'ABCDEFGHJKLMNPRSTUVWXYZ', c = ''; for (var i = 0; i < 4; i++) c += L[Math.floor(Math.random() * L.length)]; return c; }
  function idNovo() { var c = ''; while (c.length < 8) c += Math.random().toString(36).slice(2); return c.slice(0, 8); }
  function receber(aoReceber) { return function (dado) { var m = V(dado); if (m) { try { aoReceber(m); } catch (e) { if (root.console) console.warn(e); } } }; }

  function carregarLib() {
    if (root.supabase) return Promise.resolve();
    if (carregando) return carregando;
    carregando = new Promise(function (ok, falha) {
      var s = document.createElement('script'); s.src = LIB; s.onload = function () { ok(); }; s.onerror = function () { carregando = null; falha(new Error('supabase-js não carregou')); };
      document.head.appendChild(s);
    });
    return carregando;
  }

  function abrirLocal(codigo, aoReceber) {
    var bc = new BroadcastChannel('peluqueria-' + codigo), r = receber(aoReceber);
    bc.onmessage = function (ev) { r(ev.data); };
    return Promise.resolve({ mandar: function (m) { try { bc.postMessage(m); } catch (e) {} }, fechar: function () { try { bc.close(); } catch (e) {} } });
  }

  function abrirSupabase(codigo, aoReceber) {
    return carregarLib().then(function () {
      if (!sb) sb = root.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 20 } }, auth: { persistSession: false, autoRefreshToken: false } });
      return new Promise(function (ok, falha) {
        var pronto = false, r = receber(aoReceber), canal = sb.channel('peluqueria-' + codigo, { config: { broadcast: { self: false } } });
        canal.on('broadcast', { event: 'm' }, function (x) { r(x.payload); });
        canal.subscribe(function (st) {
          if (st === 'SUBSCRIBED' && !pronto) {
            pronto = true;
            ok({
              mandar: function (m) { try { canal.send({ type: 'broadcast', event: 'm', payload: m }); } catch (e) {} },
              fechar: function () { try { sb.removeChannel(canal); } catch (e) {} }
            });
          } else if ((st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') && !pronto) { pronto = true; falha(new Error(st)); }
        });
      });
    });
  }

  root.PeluqueriaSala = {
    abrir: function (codigo, aoReceber) { return LOCAL ? abrirLocal(codigo, aoReceber) : abrirSupabase(codigo, aoReceber); },
    codigoNovo: codigoNovo, idNovo: idNovo, LOCAL: LOCAL
  };
})(typeof self !== 'undefined' ? self : this);
