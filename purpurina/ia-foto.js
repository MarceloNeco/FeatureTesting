/* Purpurina — ✨ Foto de cinema (IA). Escondida por enquanto: aparece só com o interruptor "purpurina-ia" ligado no
   RootifyONE (Controle dos apps) ou abrindo o jogo uma vez com ?ia=1 (?ia=0 esconde de novo, neste aparelho).

   O que faz: pega a FOTO DO DESENHO (a personagem que a criança montou, com o cenário) e pede para uma IA de imagens
   redesenhar no jeito de filme de animação 3D (luz macia, pele, cabelo em fios, tecido), mantendo o mesmo rosto,
   cabelo, óculos, roupa e cenário. Para a IA vai SÓ o desenho e uma descrição dele; nenhuma foto de pessoa, nenhum nome.

   A chave de IA fica no cofre comum da SolverONE (cofre.js, global SolverCofre): é a mesma chave que o adulto já guardou
   em outro app da plataforma (Gemini ou OpenAI), trancada pelo PIN dele. Sem o cofre na página, não guarda nada.
   Provedores:
     - Google Gemini (gemini-2.5-flash-image): chave do Google AI Studio (começa com AIza ou AQ.).
     - OpenAI (gpt-image-1, edição de imagem): chave começa com sk- (pago por uso).

   Partes sem tela (testadas no Node): PurpurinaIA.prompt(), .pedidoGemini(), .lerGemini(), .pedidoOpenAI(), .lerOpenAI(),
   .chaveValida(). A tela usa SolverJanela (janela.js) e é montada por PurpurinaIA.abrir(app). */
(function (raiz) {
  'use strict';

  var PROVEDORES = {
    gemini: { nome: 'Google Gemini', modelo: 'gemini-2.5-flash-image', segredo: 'ia:gemini', prefixo: ['AIza', 'AQ.'],
      site: 'https://aistudio.google.com/apikey',
      guia: { pt: 'No Google AI Studio, entre com a conta Google, toque em “Create API key” e copie a chave.', en: 'In Google AI Studio, sign in with Google, tap “Create API key” and copy the key.' },
      preco: { pt: 'A geração de imagens do Gemini pode cobrar por imagem; confira a cota na sua conta.', en: 'Gemini image generation may charge per image; check the quota in your account.' } },
    openai: { nome: 'OpenAI', modelo: 'gpt-image-1', segredo: 'ia:openai', prefixo: ['sk-'],
      site: 'https://platform.openai.com/api-keys',
      guia: { pt: 'Na OpenAI, entre, compre crédito (mínimo US$ 5) em Billing, toque em “Create new secret key” e copie.', en: 'At OpenAI, sign in, buy credit (US$ 5 minimum) in Billing, tap “Create new secret key” and copy it.' },
      preco: { pt: 'Pago por uso: cada foto custa alguns centavos de dólar.', en: 'Pay per use: each photo costs a few cents.' } }
  };

  // o pedido para a IA: o mesmo personagem, só que renderizado (inglês funciona melhor nas IAs de imagem)
  function prompt(descricao) {
    return 'Re-render this drawing of an original children\'s game character as a high-quality still from a modern 3D animated feature film. ' +
      'Soft global illumination, gentle rim light, subsurface scattering on the skin, hair rendered as individual strands with natural volume and shine, ' +
      'real fabric textures and stitching, glossy eyes with reflections, a shallow depth of field on the background. ' +
      'Keep EXACTLY the same character design: face shape, eye shape and eye spacing, nose, mouth, skin tone, hairstyle, hair color and length, ' +
      'glasses frame shape and color (if any), clothes, colors, prints, shoes, jewelry and accessories, the same pose and the same background scene. ' +
      'The character is a child: keep the proportions young, cute and wholesome, with age-appropriate clothes. ' +
      'Full body, centered, vertical 2:3 frame. No text, no letters, no logos, no watermark.' +
      (descricao ? ' Character description: ' + String(descricao).slice(0, 600) + '.' : '');
  }

  function chaveValida(prov, chave) {
    var p = PROVEDORES[prov]; chave = String(chave || '').trim();
    if (!p || chave.length < 20 || /\s/.test(chave)) return false;
    return p.prefixo.some(function (x) { return chave.indexOf(x) === 0; });
  }

  // ---------- Gemini: generateContent com a imagem junto ----------
  function pedidoGemini(chave, base64, texto) {
    return {
      url: 'https://generativelanguage.googleapis.com/v1beta/models/' + PROVEDORES.gemini.modelo + ':generateContent',
      opcoes: { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: texto }, { inline_data: { mime_type: 'image/png', data: base64 } }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }) }
    };
  }
  function lerGemini(j) {
    var partes = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts || [];
    for (var i = 0; i < partes.length; i++) {
      var d = partes[i].inlineData || partes[i].inline_data;
      if (d && d.data) return { base64: d.data, tipo: d.mimeType || d.mime_type || 'image/png' };
    }
    var motivo = j && j.promptFeedback && j.promptFeedback.blockReason || (j && j.candidates && j.candidates[0] && j.candidates[0].finishReason) || '';
    var e = new Error('sem-imagem'); e.motivo = motivo; throw e;
  }

  // ---------- OpenAI: /v1/images/edits (multipart) ----------
  function pedidoOpenAI(chave, blob, texto) {
    var f = new raiz.FormData();
    f.append('model', PROVEDORES.openai.modelo); f.append('prompt', texto); f.append('size', '1024x1536'); f.append('quality', 'medium');
    f.append('image', blob, 'purpurina.png');
    return { url: 'https://api.openai.com/v1/images/edits', opcoes: { method: 'POST', headers: { Authorization: 'Bearer ' + chave }, body: f } };
  }
  function lerOpenAI(j) {
    var d = j && j.data && j.data[0];
    if (d && d.b64_json) return { base64: d.b64_json, tipo: 'image/png' };
    var e = new Error('sem-imagem'); e.motivo = j && j.error && j.error.code || ''; throw e;
  }

  function paraBase64(blob) {
    return new Promise(function (ok, erro) {
      var r = new raiz.FileReader(); r.onload = function () { ok(String(r.result).split(',')[1] || ''); }; r.onerror = function () { erro(new Error('ler')); }; r.readAsDataURL(blob);
    });
  }
  function deBase64(b64, tipo) {
    var bin = raiz.atob(b64), n = bin.length, a = new Uint8Array(n);
    for (var i = 0; i < n; i++) a[i] = bin.charCodeAt(i);
    return new raiz.Blob([a], { type: tipo || 'image/png' });
  }
  // erro da IA → frase para gente
  function explicar(st, j, t) {
    var msg = j && j.error && (j.error.message || j.error.status) || '';
    if (st === 400 && /key|API key/i.test(msg)) return t('A chave não foi aceita. Confira se copiou inteira.', 'The key was not accepted. Check that you copied all of it.');
    if (st === 401 || st === 403) return t('A chave não foi aceita (ou não tem permissão para imagens). Confira a chave ou crie outra.', 'The key was not accepted (or has no image permission). Check it or create another one.');
    if (st === 429) return t('A cota da sua conta acabou por agora (ou precisa de crédito para imagens). Tente mais tarde.', 'Your account quota ran out for now (or image generation needs credit). Try later.');
    if (st >= 500) return t('O serviço de IA está fora do ar agora. Tente de novo daqui a pouco.', 'The AI service is down right now. Try again in a bit.');
    return t('A IA não conseguiu fazer a foto agora.', 'The AI could not make the photo right now.') + (msg ? ' (' + String(msg).slice(0, 140) + ')' : '');
  }

  function gerar(prov, chave, blob, descricao, t) {
    var texto = prompt(descricao);
    var pedido = prov === 'openai' ? Promise.resolve(pedidoOpenAI(chave, blob, texto)) : paraBase64(blob).then(function (b64) { return pedidoGemini(chave, b64, texto); });
    return pedido.then(function (p) { return raiz.fetch(p.url, p.opcoes); })
      .catch(function () { var e = new Error(t('Sem conexão com a IA. Confira a internet.', 'No connection to the AI. Check the internet.')); e.semRede = true; throw e; })
      .then(function (r) {
        return r.json().catch(function () { return null; }).then(function (j) {
          if (!r.ok) throw new Error(explicar(r.status, j, t));
          var res;
          try { res = prov === 'openai' ? lerOpenAI(j) : lerGemini(j); }
          catch (e) { throw new Error(e.motivo && /SAFETY|PROHIBITED|moderation/i.test(e.motivo) ? t('A IA preferiu não fazer esta foto. Mude alguma coisa no visual e tente de novo.', 'The AI chose not to make this photo. Change something in the look and try again.') : t('A IA respondeu sem foto. Tente de novo.', 'The AI answered without a photo. Try again.')); }
          return deBase64(res.base64, res.tipo);
        });
      });
  }

  // ---------- quando aparece ----------
  function ligada() {
    try {
      var q = (raiz.location && raiz.location.search) || '';
      if (/[?&]ia=1\b/.test(q)) raiz.localStorage.setItem('purpurina.ia', '1');
      if (/[?&]ia=0\b/.test(q)) raiz.localStorage.removeItem('purpurina.ia');
      if (raiz.localStorage.getItem('purpurina.ia') === '1') return true;
    } catch (e) { /* sem localStorage */ }
    return !!(raiz.SolverRecursos && raiz.SolverRecursos.ligado && raiz.SolverRecursos.ligado('purpurina-ia', false));
  }
  function provedorEscolhido() {
    var C = raiz.SolverCofre, salvo = '';
    try { salvo = raiz.localStorage.getItem('purpurina.ia.provedor') || ''; } catch (e) { /* ok */ }
    if (PROVEDORES[salvo]) return salvo;
    if (C && C.tem && C.tem('ia:gemini')) return 'gemini';
    if (C && C.tem && C.tem('ia:openai')) return 'openai';
    return 'gemini';
  }

  // ---------- telas (SolverJanela) ----------
  function el(tag, at, filhos) {
    var n = raiz.document.createElement(tag);
    Object.keys(at || {}).forEach(function (k) { if (k === 'texto') n.textContent = at[k]; else if (k === 'class') n.className = at[k]; else n.setAttribute(k, at[k]); });
    (filhos || []).forEach(function (f) { if (f) n.appendChild(typeof f === 'string' ? raiz.document.createTextNode(f) : f); });
    return n;
  }
  function janela(caixa) { return raiz.SolverJanela ? raiz.SolverJanela.abrir({ conteudo: caixa, classe: 'pp-ia' }) : null; }

  /* app = { t, imagem() → Promise<Blob> (o desenho), descricao() → texto, mostrarFoto(blob), recado(msg) } */
  function abrir(app) {
    var t = app.t, C = raiz.SolverCofre;
    if (!raiz.SolverJanela || !C) { app.recado(t('A foto com IA precisa do site com internet (não funciona no arquivo baixado).', 'The AI photo needs the website online (not the downloaded file).')); return; }
    var prov = provedorEscolhido();
    if (C.tem(PROVEDORES[prov].segredo)) { produzir(app, prov); return; }
    configurar(app, prov);
  }

  // pede a chave ao adulto (vai direto para o cofre, que pede o PIN dele)
  function configurar(app, prov) {
    var t = app.t, C = raiz.SolverCofre, j = null;
    var ttl = el('h2', { texto: t('✨ Foto de cinema com IA', '✨ Movie-style photo with AI') });
    var txt = el('p', { texto: t('Uma IA redesenha a sua personagem com luz e sombra de filme de animação. Para a IA vai só o desenho (nenhuma foto de pessoa). Precisa de um adulto: a chave de IA fica guardada no cofre do aparelho, protegida pelo PIN dele.',
      'An AI redraws your character with animated-movie light and shadow. Only the drawing goes to the AI (never a photo of a person). An adult is needed: the AI key is kept in the device vault, protected by their PIN.') });
    var escolha = el('div', { class: 'pp-ia-provs', role: 'group' });
    var guia = el('p', { class: 'pp-ia-guia' }), preco = el('p', { class: 'pp-ia-preco' }), site = el('a', { class: 'pp-ia-site', target: '_blank', rel: 'noopener' });
    var campo = el('input', { type: 'password', autocomplete: 'off', spellcheck: 'false', 'data-sj-texto': '1', placeholder: t('Cole a chave aqui', 'Paste the key here'), 'aria-label': t('Chave de IA', 'AI key') });
    var aviso = el('p', { class: 'pp-ia-aviso', role: 'status' });
    function marcar(p) {
      prov = p;
      Array.prototype.forEach.call(escolha.children, function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-p') === p)); });
      var P = PROVEDORES[p], L = t('pt', 'en');
      guia.textContent = P.guia[L]; preco.textContent = P.preco[L]; site.href = P.site; site.textContent = t('Abrir o site da chave ↗', 'Open the key site ↗');
      aviso.textContent = C.tem(P.segredo) ? t('✓ Já existe uma chave guardada para ' + P.nome + '.', '✓ A key is already saved for ' + P.nome + '.') : '';
    }
    Object.keys(PROVEDORES).forEach(function (p) {
      var b = el('button', { type: 'button', class: 'medio', 'data-p': p, texto: PROVEDORES[p].nome });
      b.addEventListener('click', function () { marcar(p); }); escolha.appendChild(b);
    });
    var salvar = el('button', { type: 'button', class: 'grande', texto: t('🔒 Guardar e fazer a foto', '🔒 Save and make the photo') });
    var usar = el('button', { type: 'button', class: 'medio', texto: t('Usar a chave já guardada', 'Use the saved key') });
    var fechar = el('button', { type: 'button', class: 'medio', texto: t('Fechar', 'Close') });
    salvar.addEventListener('click', function () {
      var k = campo.value.trim();
      if (!chaveValida(prov, k)) { aviso.textContent = t('Essa chave não parece de ' + PROVEDORES[prov].nome + '. Copie de novo, inteira.', 'That key does not look like a ' + PROVEDORES[prov].nome + ' key. Copy it again, all of it.'); return; }
      C.gravar(PROVEDORES[prov].segredo, k, { motivo: { pt: 'Para guardar a chave de IA da Purpurina com proteção.', en: 'To keep the Purpurina AI key protected.' } }).then(function () {
        try { raiz.localStorage.setItem('purpurina.ia.provedor', prov); } catch (e) { /* ok */ }
        campo.value = ''; j.fechar('salvo'); raiz.SolverJanela.quandoQuieto(function () { produzir(app, prov); });
      }).catch(function () { aviso.textContent = t('Não foi guardada (o cofre ficou trancado). Tente de novo.', 'It was not saved (the vault stayed locked). Try again.'); });
    });
    usar.addEventListener('click', function () {
      if (!C.tem(PROVEDORES[prov].segredo)) { aviso.textContent = t('Ainda não há chave guardada para ' + PROVEDORES[prov].nome + '.', 'There is no saved key for ' + PROVEDORES[prov].nome + ' yet.'); return; }
      try { raiz.localStorage.setItem('purpurina.ia.provedor', prov); } catch (e) { /* ok */ }
      j.fechar('usar'); raiz.SolverJanela.quandoQuieto(function () { produzir(app, prov); });
    });
    fechar.addEventListener('click', function () { j.fechar('fechar'); });
    var caixa = el('div', { class: 'pp-ia-caixa', role: 'dialog', 'aria-label': t('Foto de cinema com IA', 'Movie-style photo with AI') },
      [ttl, txt, el('p', { class: 'pp-ia-rot', texto: t('Qual IA?', 'Which AI?') }), escolha, guia, preco, site, campo, aviso, el('div', { class: 'pp-ia-botoes' }, [salvar, usar, fechar])]);
    marcar(prov);
    j = janela(caixa);
  }

  // faz a foto: lê a chave no cofre (pede o PIN se estiver trancado), manda o desenho e mostra o resultado
  function produzir(app, prov) {
    var t = app.t, C = raiz.SolverCofre, P = PROVEDORES[prov], j = null, cancelado = false, trava = null;
    var ttl = el('h2', { texto: t('✨ Fazendo a foto de cinema…', '✨ Making the movie-style photo…') });
    var txt = el('p', { texto: t('A IA está redesenhando com luz e sombra. Leva uns 20 a 60 segundos; deixe esta tela aberta.', 'The AI is redrawing with light and shadow. It takes about 20 to 60 seconds; keep this screen open.') });
    var barra = el('div', { class: 'pp-ia-carregando', 'aria-hidden': 'true' });
    var cancelar = el('button', { type: 'button', class: 'medio', texto: t('Cancelar', 'Cancel') });
    cancelar.addEventListener('click', function () { cancelado = true; j.fechar('cancelar'); });
    j = janela(el('div', { class: 'pp-ia-caixa' }, [ttl, txt, barra, el('div', { class: 'pp-ia-botoes' }, [cancelar])]));
    // tela acesa enquanto a IA trabalha (Wake Lock, quando o aparelho deixa)
    try { if (raiz.navigator.wakeLock) raiz.navigator.wakeLock.request('screen').then(function (w) { trava = w; }).catch(function () {}); } catch (e) { /* ok */ }
    function soltar() { try { if (trava) trava.release(); } catch (e) { /* ok */ } trava = null; }
    Promise.all([C.ler(P.segredo, { motivo: { pt: 'Para a Purpurina usar a chave de IA (' + P.nome + ').', en: 'For Purpurina to use the AI key (' + P.nome + ').' } }), app.imagem()])
      .then(function (r) {
        if (!r[0]) throw new Error(t('Não achei a chave de IA no cofre.', 'I could not find the AI key in the vault.'));
        return gerar(prov, r[0], r[1], app.descricao(), t);
      })
      .then(function (foto) { soltar(); if (cancelado) return; j.fechar('pronto'); raiz.SolverJanela.quandoQuieto(function () { app.mostrarFoto(foto); }); })
      .catch(function (e) {
        soltar(); if (cancelado) return;
        var msg = e && e.message === 'cofre-trancado' ? t('O cofre ficou trancado: sem o PIN do adulto não dá para usar a chave.', 'The vault stayed locked: without the adult PIN the key cannot be used.') : (e && e.message) || t('Não deu certo.', 'It did not work.');
        var trocar = el('button', { type: 'button', class: 'medio', texto: t('🔑 Trocar a chave ou a IA', '🔑 Change the key or the AI') });
        var ok = el('button', { type: 'button', class: 'medio', texto: t('Fechar', 'Close') });
        trocar.addEventListener('click', function () { j.fechar('trocar'); raiz.SolverJanela.quandoQuieto(function () { configurar(app, prov); }); });
        ok.addEventListener('click', function () { j.fechar('fechar'); });
        j.trocar(el('div', { class: 'pp-ia-caixa' }, [el('h2', { texto: t('✨ Foto de cinema', '✨ Movie-style photo') }), el('p', { texto: msg }), el('div', { class: 'pp-ia-botoes' }, [trocar, ok])]));
      });
  }

  var API = { PROVEDORES: PROVEDORES, prompt: prompt, chaveValida: chaveValida, pedidoGemini: pedidoGemini, lerGemini: lerGemini, pedidoOpenAI: pedidoOpenAI, lerOpenAI: lerOpenAI,
    gerar: gerar, ligada: ligada, abrir: abrir, configurar: configurar };
  raiz.PurpurinaIA = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
