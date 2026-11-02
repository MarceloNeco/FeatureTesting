/*
  Atualizar — o mesmo arquivo para todos os jogos do Bolinho de Chuva (Bagunçolândia, Peluqueria, Vruuum!,
  Purpurina, Rabiscolândia). Cada jogo inclui, no index.html:
      <script src="../atualizar.js" data-fora-do-arquivo></script>
  e põe '../atualizar.js' na lista ARQUIVOS do sw.js (para abrir sem internet).

  Como os jogos se atualizam (o que já existia): o service worker de cada jogo busca primeiro a versão do site
  e guarda a cópia no aparelho; sem internet, abre a cópia guardada. Abrir com internet = versão nova.

  O que este arquivo acrescenta: o AVISO dentro do jogo. Ao abrir, ele anota a versão que está rodando
  (versoes.json do próprio jogo). Depois confere de novo no site: ao voltar para o jogo, quando a internet
  volta e a cada 30 minutos com o jogo aberto (TV e tablet ficam horas abertos). Se a versão do site for outra,
  aparece no topo: "✨ Versão nova X do <jogo> — Atualizar / Depois". Atualizar pede ao service worker a cópia
  nova (ele baixa e troca os arquivos do aparelho para funcionar sem internet) e recarrega o jogo.
  Nunca recarrega sozinho: no meio de uma partida, quem decide é a pessoa.
  Depois: não pergunta de novo pela mesma versão nesta aba.
*/
(function () {
  if (location.protocol === 'file:' || !window.fetch) return;
  var visto = null;      // versão que está rodando agora
  var mostrado = null;   // versão já oferecida (Depois = não pergunta de novo por ela)
  var nome = String(document.title || '').split(/\s+[—–-]\s+/)[0] || 'jogo';

  function lerVersao(semCache) {
    return fetch('versoes.json', { cache: semCache ? 'no-store' : 'default' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && d.versoes && d.versoes[0] ? d.versoes[0] : null; })
      .catch(function () { return null; });
  }

  var css = '' +
    '.sa-aviso{position:fixed;left:50%;top:.6rem;transform:translate(-50%,-150%);z-index:2147482000;display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;justify-content:center;width:max-content;max-width:calc(100% - 1rem);padding:.6rem .8rem;border-radius:18px;text-align:center;background:#1a1446;border:2px solid #c6ff3d;color:#f3f0ff;font:600 1rem/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);transition:transform .25s ease-out}' +
    '.sa-aviso.sa-ver{transform:translate(-50%,0)}' +
    '@media (max-width:30rem){.sa-aviso span{flex-basis:100%}}' +
    '.sa-aviso button{min-height:44px;padding:.45rem 1rem;border:0;border-radius:999px;font:inherit;font-weight:800;cursor:pointer}' +
    '.sa-sim{background:#c6ff3d;color:#1a1446}' +
    '.sa-nao{background:transparent;color:#b3acd6;border:1px solid #3a2f73!important}' +
    '.sa-aviso button:focus-visible{outline:3px solid #ffd166;outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){.sa-aviso{transition:none}}';

  function avisar(v) {
    if (document.querySelector('.sa-aviso')) return;
    var estilo = document.createElement('style');
    estilo.textContent = css;
    document.head.appendChild(estilo);
    var caixa = document.createElement('div');
    caixa.className = 'sa-aviso';
    caixa.setAttribute('role', 'status');
    caixa.setAttribute('aria-live', 'polite');
    var txt = document.createElement('span');
    txt.textContent = '✨ Versão nova do ' + nome + ' (' + v.versao + ')';
    var sim = document.createElement('button');
    sim.type = 'button'; sim.className = 'sa-sim'; sim.textContent = 'Atualizar / Update';
    var nao = document.createElement('button');
    nao.type = 'button'; nao.className = 'sa-nao'; nao.textContent = 'Depois / Later';
    caixa.appendChild(txt); caixa.appendChild(sim); caixa.appendChild(nao);
    document.body.appendChild(caixa);
    requestAnimationFrame(function () { caixa.classList.add('sa-ver'); });
    sim.addEventListener('click', function (e) {
      e.stopPropagation();
      sim.disabled = true; sim.textContent = 'Atualizando… / Updating…';
      atualizar();
    });
    nao.addEventListener('click', function (e) {
      e.stopPropagation();
      caixa.classList.remove('sa-ver');
      setTimeout(function () { caixa.remove(); }, 300);
    });
    // os jogos ouvem teclas e toques na tela inteira: o aviso fica com os dele
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) { caixa.addEventListener(t, function (e) { e.stopPropagation(); }); });
  }

  // Pede ao service worker a cópia nova (ele baixa e guarda tudo para funcionar sem internet) e recarrega.
  function atualizar() {
    var recarregar = function () { location.reload(); };
    if (!('serviceWorker' in navigator)) return recarregar();
    navigator.serviceWorker.getRegistration().then(function (reg) {
      if (!reg) return recarregar();
      var esperar = reg.update().then(function () {
        var novo = reg.installing || reg.waiting;
        if (!novo) return;
        return new Promise(function (ok) {
          if (novo.state === 'installed' || novo.state === 'activated') return ok();
          novo.addEventListener('statechange', function () { if (novo.state === 'installed' || novo.state === 'activated' || novo.state === 'redundant') ok(); });
        });
      });
      // no máximo 15 s esperando a cópia nova: depois recarrega assim mesmo (o site já entrega a versão nova)
      Promise.race([esperar, new Promise(function (ok) { setTimeout(ok, 15000); })]).then(recarregar, recarregar);
    }).catch(recarregar);
  }

  function conferir() {
    if (!visto || navigator.onLine === false) return;
    lerVersao(true).then(function (v) {
      if (!v || !v.versao || v.versao === visto || v.versao === mostrado) return;
      mostrado = v.versao;
      avisar(v);
    });
  }

  lerVersao(false).then(function (v) {
    if (!v) return;
    visto = v.versao;
    setTimeout(conferir, 5000);
    setInterval(conferir, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) conferir(); });
    window.addEventListener('online', conferir);
  });

  window.SolverAtualizar = { conferir: conferir, atualizar: atualizar };
})();
