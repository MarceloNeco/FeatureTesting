/* Bagunçolândia — Spotify como CONTROLE REMOTO (não toca som dentro do jogo).
   Entra com a conta da pessoa (OAuth PKCE, sem segredo: só o Client ID público do app registrado pelo
   dono em config.js), lista os aparelhos Spotify ligados (celular, caixinha, app da TV) e as playlists,
   manda tocar/pausar e lê o que está tocando. Precisa de Spotify Premium para controlar a reprodução.
   Token só em sessionStorage (some ao fechar a aba); nunca em link nem em localStorage.
   A autorização abre numa janela (popup) e volta por postMessage, para a sala no celular não cair;
   sem popup, cai no redirecionamento e a página guarda o token ao voltar. */
(function (root) {
  'use strict';
  var CLIENT_ID = (root.BAGUNCA_CONFIG && root.BAGUNCA_CONFIG.spotifyClientId) || '';
  var SCOPES = 'user-modify-playback-state user-read-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative';
  var K = 'bagunca:spotify';
  function ativo() { return !!CLIENT_ID; }
  function redirectUri() { return location.origin + location.pathname; }
  function ler() { try { return JSON.parse(sessionStorage.getItem(K) || 'null'); } catch (e) { return null; } }
  function gravar(t) { try { if (t) sessionStorage.setItem(K, JSON.stringify(t)); else sessionStorage.removeItem(K); } catch (e) {} }
  function b64url(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function aleatorio(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a); }
  function sha256(txt) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(b64url); }

  /* abre a autorização; devolve Promise que resolve quando o token chegou */
  function entrar() {
    if (!ativo()) return Promise.reject(new Error('sem Client ID'));
    var verifier = aleatorio(64), state = aleatorio(16);
    try { sessionStorage.setItem(K + ':pkce', JSON.stringify({ verifier: verifier, state: state })); } catch (e) {}
    return sha256(verifier).then(function (challenge) {
      var url = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({ response_type: 'code', client_id: CLIENT_ID, scope: SCOPES, redirect_uri: redirectUri(), state: state, code_challenge_method: 'S256', code_challenge: challenge }).toString();
      return new Promise(function (ok, falha) {
        var W = screen.width, H = screen.height, pop = null;
        try { pop = window.open(url, 'bagunca-spotify', 'popup,width=' + Math.min(520, W) + ',height=' + Math.min(720, H)); } catch (e) {}
        if (!pop) { location.assign(url); return; }   // popup bloqueado: vai na mesma aba (a página guarda o token ao voltar)
        function aoMsg(ev) {
          if (ev.origin !== location.origin || !ev.data || ev.data.t !== 'bagunca-spotify-code') return;
          window.removeEventListener('message', aoMsg);
          trocarCodigo(ev.data.code, ev.data.state).then(ok, falha);
        }
        window.addEventListener('message', aoMsg);
        var vigia = setInterval(function () { if (pop.closed) { clearInterval(vigia); setTimeout(function () { if (!ler()) falha(new Error('cancelado')); }, 500); } }, 500);
      });
    });
  }
  /* chamada ao carregar a página: se voltou do Spotify com ?code=, troca pelo token (ou manda ao opener) */
  function aoCarregar() {
    var q = new URLSearchParams(location.search), code = q.get('code'), state = q.get('state');
    if (!code) return Promise.resolve(false);
    history.replaceState(null, '', location.pathname);
    if (window.opener && window.opener !== window) { try { window.opener.postMessage({ t: 'bagunca-spotify-code', code: code, state: state }, location.origin); } catch (e) {} setTimeout(function () { window.close(); }, 300); return Promise.resolve(true); }
    return trocarCodigo(code, state).then(function () { return true; }, function () { return false; });
  }
  function trocarCodigo(code, state) {
    var p = null; try { p = JSON.parse(sessionStorage.getItem(K + ':pkce') || 'null'); } catch (e) {}
    if (!p || p.state !== state) return Promise.reject(new Error('estado não confere'));
    return fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: code, redirect_uri: redirectUri(), client_id: CLIENT_ID, code_verifier: p.verifier }).toString() })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.access_token) throw new Error(j.error_description || 'token'); gravar({ access: j.access_token, refresh: j.refresh_token, expira: Date.now() + (j.expires_in || 3600) * 1000 }); try { sessionStorage.removeItem(K + ':pkce'); } catch (e) {} return true; });
  }
  function token() {
    var t = ler(); if (!t) return Promise.reject(new Error('não entrou'));
    if (Date.now() < t.expira - 60000) return Promise.resolve(t.access);
    return fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh, client_id: CLIENT_ID }).toString() })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.access_token) { gravar(null); throw new Error('sessão venceu'); } gravar({ access: j.access_token, refresh: j.refresh_token || t.refresh, expira: Date.now() + (j.expires_in || 3600) * 1000 }); return j.access_token; });
  }
  function api(metodo, caminho, corpo) {
    return token().then(function (tk) { return fetch('https://api.spotify.com/v1' + caminho, { method: metodo, headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined }); })
      .then(function (r) { if (r.status === 204 || r.status === 202) return null; if (r.status === 401) { gravar(null); throw new Error('não entrou'); } if (r.status === 403) throw new Error('premium'); if (!r.ok) throw new Error('spotify ' + r.status); return r.json(); });
  }
  return root.Spotify = {
    ativo: ativo, entrou: function () { return !!ler(); }, entrar: entrar, sair: function () { gravar(null); }, aoCarregar: aoCarregar,
    aparelhos: function () { return api('GET', '/me/player/devices').then(function (j) { return (j && j.devices) || []; }); },
    playlists: function () { return api('GET', '/me/playlists?limit=30').then(function (j) { return ((j && j.items) || []).map(function (p) { return { id: p.id, uri: p.uri, nome: p.name, capa: p.images && p.images[0] && p.images[0].url }; }); }); },
    tocar: function (uri, device) { return api('PUT', '/me/player/play' + (device ? '?device_id=' + encodeURIComponent(device) : ''), uri ? { context_uri: uri } : undefined); },
    pausar: function () { return api('PUT', '/me/player/pause'); },
    proxima: function () { return api('POST', '/me/player/next'); },
    anterior: function () { return api('POST', '/me/player/previous'); },
    tocando: function () { return api('GET', '/me/player/currently-playing').then(function (j) { if (!j || !j.item) return null; return { nome: j.item.name, artista: (j.item.artists || []).map(function (a) { return a.name; }).join(', '), capa: j.item.album && j.item.album.images && j.item.album.images[1] && j.item.album.images[1].url, tocando: !!j.is_playing }; }); }
  };
})(typeof self !== 'undefined' ? self : this);
