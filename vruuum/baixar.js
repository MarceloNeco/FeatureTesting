/* Baixar o jogo num arquivo só (Bolinho de Chuva): monta, aqui no aparelho, um .html com tudo dentro
   (estilo, scripts, fonte e ícone), que abre direto do celular, sem internet e sem instalar nada.
   Genérico: lê os <link rel="stylesheet"> e <script src> da própria página. Scripts com
   data-fora-do-arquivo (ex.: interruptores do RootifyONE, que dependem do site) ficam de fora.
   Uso: BaixarJogo.baixar('vruuum.html') → Promise. Dentro do arquivo baixado, window.JOGO_EM_ARQUIVO = true. */
(function (raiz) {
  'use strict';
  function texto(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function dataUrl(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.blob(); }).then(function (b) {
      return new Promise(function (ok, erro) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = erro; f.readAsDataURL(b); });
    });
  }
  // dentro do CSS, url(...) de fonte/imagem vira data: (relativo ao endereço do próprio CSS)
  function embutirCss(css, base) {
    var urls = [], re = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g, m;
    while ((m = re.exec(css))) if (!/^data:/.test(m[1]) && urls.indexOf(m[1]) < 0) urls.push(m[1]);
    return Promise.all(urls.map(function (u) { return dataUrl(new URL(u, base).href).then(function (d) { return [u, d]; }); })).then(function (pares) {
      pares.forEach(function (p) { css = css.split(p[0]).join(p[1]); });
      return css;
    });
  }
  function seguro(js) { return js.replace(/<\/script/gi, '<\\/script'); }

  function montar() {
    var base = location.href;
    var links = Array.prototype.filter.call(document.querySelectorAll('link[rel="stylesheet"]'), function (l) { return l.href; });
    var scripts = Array.prototype.filter.call(document.querySelectorAll('script[src]'), function (s) { return !s.hasAttribute('data-fora-do-arquivo'); });
    var icone = document.querySelector('link[rel="icon"]');
    return Promise.all([
      texto(base.split('#')[0].split('?')[0]),
      Promise.all(links.map(function (l) { return texto(l.href).then(function (css) { return embutirCss(css, l.href); }); })),
      Promise.all(scripts.map(function (s) { return texto(s.src); })),
      icone ? dataUrl(icone.href).catch(function () { return ''; }) : Promise.resolve('')
    ]).then(function (r) {
      var html = r[0], css = r[1], js = r[2], ico = r[3];
      // tira o que só faz sentido no site: CSP (o arquivo usa script embutido), manifesto, ícone externo, scripts
      html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i, '')
        .replace(/<link rel="manifest"[^>]*>\s*/gi, '')
        .replace(/<link rel="apple-touch-icon"[^>]*>\s*/gi, '')
        .replace(/<link rel="icon"[^>]*>/i, ico ? '<link rel="icon" href="' + ico + '">' : '')
        .replace(/<link rel="stylesheet"[^>]*>/gi, '')
        .replace(/<script src="[^"]*"[^>]*><\/script>\s*/gi, '');
      var estilo = '<style>\n' + css.join('\n') + '\n</style>\n';
      var codigo = '<script>window.JOGO_EM_ARQUIVO = true;</script>\n' + js.map(function (j) { return '<script>\n' + seguro(j) + '\n</script>'; }).join('\n') + '\n';
      html = html.replace('</head>', estilo + '</head>').replace('</body>', codigo + '</body>');
      return html;
    });
  }

  function baixar(nome) {
    return montar().then(function (html) {
      var blob = new Blob([html], { type: 'text/html' }), url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = nome; a.rel = 'noopener';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 4000);
      return html.length;
    });
  }

  raiz.BaixarJogo = { montar: montar, baixar: baixar };
})(this);
