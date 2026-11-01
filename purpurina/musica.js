/* Purpurina — música: as músicas da própria Purpurina (som.js), YouTube e Spotify, com um jeito só de mandar:
     PurpurinaMusica.ler(link)            → { fonte, ref } a partir de um link colado (ou null se não entendeu)
     PurpurinaMusica.tocador(caixa, aoMudar) → { tocar(fonte, ref), pausar(), continuar(), proxima(), anterior(),
                                               parar(), estado() }
   YouTube: IFrame Player API (o tocador aparece de verdade, no mínimo 200×200, como o YouTube pede).
   Spotify: tocador do Spotify (iFrame API do próprio Spotify). Sem login no Spotify naquele navegador, o Spotify
   toca só 30 s de cada música; com login, a música inteira. Nenhuma chave nem senha fica no app.
   Os scripts do YouTube e do Spotify só são carregados quando alguém escolhe tocar algo deles. */
(function (raiz) {
  'use strict';

  // ---------- links ----------
  var SPOT_TIPOS = ['track', 'album', 'playlist', 'artist', 'episode', 'show'];
  function ler(link) {
    var s = String(link || '').trim(), m;
    if (!s) return null;
    // Spotify: open.spotify.com/(intl-pt/)playlist/ID ou spotify:playlist:ID
    m = s.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]{22})/) || s.match(/^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]{22})$/);
    if (m) return { fonte: 'spotify', ref: m[1] + ':' + m[2] };
    // YouTube: playlist (list=) tem prioridade; senão o vídeo
    var lista = s.match(/[?&]list=([A-Za-z0-9_-]{10,40})/);
    if (/youtu\.?be|youtube\.com/.test(s) && lista) return { fonte: 'youtube', ref: 'l:' + lista[1] };
    m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([A-Za-z0-9_-]{11})/);
    if (m) return { fonte: 'youtube', ref: 'v:' + m[1] };
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { fonte: 'youtube', ref: 'v:' + s };
    return null;
  }
  function refValida(fonte, ref) {
    if (fonte === 'purpurina') return true;
    if (fonte === 'youtube') return /^(v:[A-Za-z0-9_-]{11}|l:[A-Za-z0-9_-]{10,40})$/.test(ref || '');
    if (fonte === 'spotify') { var p = String(ref || '').split(':'); return p.length === 2 && SPOT_TIPOS.indexOf(p[0]) >= 0 && /^[A-Za-z0-9]{22}$/.test(p[1]); }
    return false;
  }

  // ---------- carregar as bibliotecas de fora (uma vez só) ----------
  var ytPronto = null, spPronto = null;
  function script(src) { var s = document.createElement('script'); s.src = src; s.async = true; document.head.appendChild(s); return s; }
  function apiYouTube() {
    if (raiz.YT && raiz.YT.Player) return Promise.resolve();
    if (ytPronto) return ytPronto;
    ytPronto = new Promise(function (ok, falha) {
      var antes = raiz.onYouTubeIframeAPIReady;
      raiz.onYouTubeIframeAPIReady = function () { if (antes) try { antes(); } catch (e) { /* ok */ } ok(); };
      script('https://www.youtube.com/iframe_api').onerror = function () { ytPronto = null; falha(new Error('youtube')); };
    });
    return ytPronto;
  }
  function apiSpotify() {
    if (spPronto) return spPronto;
    spPronto = new Promise(function (ok, falha) {
      raiz.onSpotifyIframeApiReady = function (api) { ok(api); };
      script('https://open.spotify.com/embed/iframe-api/v1').onerror = function () { spPronto = null; falha(new Error('spotify')); };
    });
    return spPronto;
  }

  // ---------- tocador ----------
  function tocador(caixa, aoMudar) {
    var Som = raiz.PurpurinaSom, est = { fonte: 'purpurina', ref: '', titulo: Som && Som.faixaAtual ? Som.faixaAtual() : '', tocando: !!(Som && Som.tocandoMusica && Som.tocandoMusica()), erro: '' };
    var yt = null, ytDiv = null, sp = null, spDiv = null;
    function avisar() { if (aoMudar) try { aoMudar(estado()); } catch (e) { /* ok */ } }
    function estado() {
      if (est.fonte === 'purpurina' && Som && Som.tocandoMusica) { est.tocando = Som.tocandoMusica(); est.titulo = tituloPurpurina(); }
      return { fonte: est.fonte, ref: est.ref, titulo: est.titulo, tocando: est.tocando, erro: est.erro };
    }
    function tituloPurpurina() { return Som && Som.faixaAtual ? Som.faixaAtual() : 'Purpurina'; }
    // a rádio da Purpurina trocou de música sozinha: atualiza o nome na tela
    if (Som && Som.aoTrocarMusica) Som.aoTrocarMusica(function (nome) { if (est.fonte === 'purpurina') { est.titulo = nome; avisar(); } });
    function pararFora() {
      if (yt) try { yt.stopVideo(); } catch (e) { /* ok */ }
      if (sp) try { sp.pause(); } catch (e) { /* ok */ }
      caixa.hidden = true; caixa.removeAttribute('data-fonte');
    }
    function mostrar(fonte) { caixa.hidden = false; caixa.setAttribute('data-fonte', fonte); if (ytDiv) ytDiv.hidden = fonte !== 'youtube'; if (spDiv) spDiv.hidden = fonte !== 'spotify'; }

    function tocarYouTube(ref) {
      return apiYouTube().then(function () {
        mostrar('youtube');
        var tipo = ref.charAt(0), id = ref.slice(2);
        function carregar() { if (tipo === 'l') yt.loadPlaylist({ list: id, listType: 'playlist', index: 0 }); else yt.loadVideoById(id); }
        if (yt) { carregar(); return; }
        ytDiv = document.createElement('div'); var alvo = document.createElement('div'); ytDiv.className = 'yt'; ytDiv.appendChild(alvo); caixa.appendChild(ytDiv);
        return new Promise(function (ok) {
          yt = new raiz.YT.Player(alvo, {
            width: '100%', height: '100%', playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
            events: {
              onReady: function () { carregar(); ok(); },
              onStateChange: function (ev) {
                est.tocando = ev.data === 1;
                try { var d = yt.getVideoData(); if (d && d.title) est.titulo = d.title; } catch (e) { /* ok */ }
                avisar();
              },
              onError: function (ev) { est.erro = ev.data === 101 || ev.data === 150 ? 'bloqueado' : 'invalido'; est.tocando = false; avisar(); }
            }
          });
        });
      });
    }
    function tocarSpotify(ref) {
      return apiSpotify().then(function (api) {
        mostrar('spotify');
        var uri = 'spotify:' + ref;
        if (sp) { sp.loadUri(uri); try { sp.play(); } catch (e) { /* o Spotify pode pedir um toque no tocador */ } return; }
        spDiv = document.createElement('div'); var alvo = document.createElement('div'); spDiv.className = 'sp'; spDiv.appendChild(alvo); caixa.appendChild(spDiv);
        return new Promise(function (ok) {
          api.createController(alvo, { uri: uri, width: '100%', height: 152 }, function (ctrl) {
            sp = ctrl;
            ctrl.addListener('ready', function () { try { ctrl.play(); } catch (e) { /* ok */ } ok(); });
            ctrl.addListener('playback_update', function (ev) { var d = ev && ev.data; if (!d) return; est.tocando = !d.isPaused; avisar(); });
          });
        });
      });
    }

    function tocar(fonte, ref) {
      if (!refValida(fonte, ref)) return Promise.resolve(false);
      est.erro = ''; est.fonte = fonte; est.ref = ref || '';
      if (fonte === 'purpurina') {
        pararFora(); if (Som) { Som.iniciar(); Som.musica(true); }
        est.titulo = tituloPurpurina(); est.tocando = true; avisar(); return Promise.resolve(true);
      }
      if (Som) Som.musica(false);
      est.titulo = fonte === 'youtube' ? 'YouTube' : 'Spotify'; est.tocando = false; avisar();
      return (fonte === 'youtube' ? tocarYouTube(ref) : tocarSpotify(ref)).then(function () { return true; }).catch(function () {
        est.erro = 'sem-internet'; avisar(); return false;
      });
    }
    function pausar() {
      if (est.fonte === 'purpurina') { if (Som) Som.musica(false); est.tocando = false; }
      else if (est.fonte === 'youtube' && yt) try { yt.pauseVideo(); } catch (e) { /* ok */ }
      else if (est.fonte === 'spotify' && sp) try { sp.pause(); } catch (e) { /* ok */ }
      avisar();
    }
    function continuar() {
      if (est.fonte === 'purpurina') { if (Som) { Som.iniciar(); Som.musica(true); } est.tocando = true; }
      else if (est.fonte === 'youtube' && yt) try { yt.playVideo(); } catch (e) { /* ok */ }
      else if (est.fonte === 'spotify' && sp) try { sp.resume(); } catch (e) { /* ok */ }
      avisar();
    }
    function proxima() {
      if (est.fonte === 'purpurina' && Som) { Som.proxima(); est.titulo = tituloPurpurina(); }
      else if (est.fonte === 'youtube' && yt) try { yt.nextVideo(); } catch (e) { /* ok */ }
      avisar();
    }
    function anterior() {
      if (est.fonte === 'purpurina' && Som) { Som.anterior ? Som.anterior() : Som.proxima(); est.titulo = tituloPurpurina(); }
      else if (est.fonte === 'youtube' && yt) try { yt.previousVideo(); } catch (e) { /* ok */ }
      avisar();
    }
    function parar() { pararFora(); if (Som) Som.musica(false); est.tocando = false; avisar(); }
    return { tocar: tocar, pausar: pausar, continuar: continuar, proxima: proxima, anterior: anterior, parar: parar, estado: estado };
  }

  var API = { ler: ler, refValida: refValida, tocador: tocador };
  raiz.PurpurinaMusica = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
