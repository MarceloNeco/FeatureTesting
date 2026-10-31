// Teste da página inteira no Chromium (Playwright): node baguncolandia/teste/pagina.test.js
// Abre como TV com ?teste (sem pareamento), começa uma rodada com pontos de movimento falsos,
// confere placar, calibração, CSP e erros no console. Também abre a tela do celular em 320 px.
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.task': 'application/octet-stream' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(raiz, p);
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
function falhou(msg) { console.error('✗ ' + msg); process.exitCode = 1; }
function ok(msg) { console.log('✓ ' + msg); }
(async () => {
  await new Promise(r => server.listen(0, r)); const porta = server.address().port, base = 'http://127.0.0.1:' + porta + '/baguncolandia/';
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pg = await ctx.newPage(); const erros = [];
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text() + ' @' + (m.location() && m.location().url)); }); pg.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await pg.goto(base + '?teste'); await pg.waitForTimeout(300);
  await pg.click('#btTV'); await pg.waitForFunction(() => document.getElementById('pct').textContent === '100', null, { timeout: 15000 });
  ok('carregamento chegou a 100 %');
  await pg.waitForTimeout(800);
  const fase = await pg.evaluate(() => window.BaguncaApp.TVApp.tv.fase);
  if (fase !== 'capa') falhou('esperava a capa, fase=' + fase); else ok('capa com código');
  // simula um celular: no modo teste não há sala; forçamos o lobby e começamos pelo teclado
  await pg.evaluate(() => { const tv = window.BaguncaApp.TVApp.tv; tv.jog.push({ id: 'teste123', nome: 'Ana', ligado: true, video: document.createElement('video') }); });
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'config', modo: 'corta', duracao: 60 }));
  await pg.keyboard.press('Enter');   // começar (lobby ainda não foi desenhado: comando direto)
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'comecar' }));
  await pg.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'jogando', null, { timeout: 15000 });
  ok('calibração (modo teste) e contagem passaram; rodada começou');
  await pg.screenshot({ path: '/tmp/pagina-jogando-0.png' });
  // pontos falsos: a "mão" varre a tela em zigue-zague
  // a "mão" falsa vai atrás da fruta viva mais próxima, passando de um lado para o outro dela (corte garantido)
  await pg.evaluate(() => { let lado = -1; window.BaguncaTeste = { pontos: () => { const e = window.BaguncaDebug.partida.estado(); const f = e.coisas.find(c => !c.morta && (c.papel === 'fruta' || c.papel === 'doce')); if (!f) return null; lado = -lado; return [[Math.max(0, Math.min(1, (f.x + lado * 60) / 1280)), Math.max(0, Math.min(1, f.y / 720)), 95]]; } }; });
  await pg.waitForTimeout(6000);
  const pontos = await pg.evaluate(() => window.BaguncaDebug.partida.estado().jogadores[0].pontos);
  if (pontos > 0) ok('pontos com movimento falso: ' + pontos); else falhou('nenhum ponto marcado');
  await pg.screenshot({ path: '/tmp/pagina-jogando.png' });
  // pausa pelo teclado
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(200);
  const f2 = await pg.evaluate(() => window.BaguncaDebug.partida.estado().fase);
  if (f2 === 'pausa') ok('Enter pausa'); else falhou('não pausou: ' + f2);
  await pg.keyboard.press('Enter');
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'parar' })); await pg.waitForTimeout(600);
  const f3 = await pg.evaluate(() => window.BaguncaApp.TVApp.tv.fase);
  if (f3 === 'fim') ok('parar → pódio'); else falhou('fase depois de parar: ' + f3);
  await pg.screenshot({ path: '/tmp/pagina-podio.png' });
  // v0.2: Pula e abaixa na paisagem, com o corpo falso pulando e abaixando no ritmo dos avisos
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'config', modo: 'pula', ambiente: 'paisagem', cena: 'floresta', duracao: 60 }));
  await pg.evaluate(() => { window.BaguncaTeste = { pontos: () => null, corpo: () => { const tv = window.BaguncaApp.TVApp.tv, ob = tv.partida && tv.partida.estado().coisas.find(c => c.papel === 'obstaculo' && !c.passou && c.x < 900); const baixo = ob && ob.tipo === 'baixo', alto = ob && ob.tipo === 'alto'; return { x: 0.4, y: baixo ? -0.1 : 0.1, w: alto ? 0.25 : 0.2, h: alto ? 0.45 : 0.8 }; } }; });
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'comecar' }));
  await pg.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'jogando', null, { timeout: 15000 });
  await pg.waitForTimeout(9000);
  const st = await pg.evaluate(() => { const e = window.BaguncaDebug.partida.estado(); return { pontos: e.jogadores[0].pontos, vidas: e.jogadores[0].vidas, paisagem: document.getElementById('tv').classList.contains('paisagem') }; });
  if (st.paisagem) ok('ambiente paisagem ligado'); else falhou('paisagem não ligou');
  if (st.pontos > 0 && st.vidas === 3) ok('pula e abaixa: desviou dos obstáculos (' + st.pontos + ' pontos, 3 vidas)'); else falhou('pula e abaixa: pontos=' + st.pontos + ' vidas=' + st.vidas);
  await pg.screenshot({ path: '/tmp/pagina-pula.png' });
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'parar' })); await pg.waitForTimeout(300);
  // v0.4: esqueleto falso (mão varrendo) no corta-corta; marionete desenhada sem erro
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'config', modo: 'corta', ambiente: 'paisagem', cena: 'espaco', duracao: 60 }));
  await pg.evaluate(() => { window.BaguncaTeste = { pontos: () => null, corpo: () => null, esqueleto: ts => { const t = ts / 1000, hx = 0.5 + 0.45 * Math.sin(t * 6), hy = 0.3 + 0.3 * Math.abs(Math.cos(t * 4)); return [[0.5, 0.2], [0.42, 0.33], [0.58, 0.33], [0.36, 0.45], [0.64, 0.45], [0.33, 0.58], [hx, hy], [0.45, 0.56], [0.55, 0.56], [0.45, 0.73], [0.55, 0.73], [0.45, 0.9], [0.55, 0.9]]; } }; });
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'comecar' }));
  await pg.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'jogando', null, { timeout: 15000 });
  await pg.waitForTimeout(6000);
  const sk = await pg.evaluate(() => { const e = window.BaguncaDebug.partida.estado(); return { pontos: e.jogadores[0].pontos, esq: !!e.jogadores[0].esqueleto }; });
  if (sk.esq && sk.pontos > 0) ok('esqueleto: mão cortou frutas (' + sk.pontos + ' pontos), marionete desenhada'); else falhou('esqueleto: ' + JSON.stringify(sk));
  await pg.screenshot({ path: '/tmp/pagina-esqueleto.png' });
  await pg.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'parar' })); await pg.waitForTimeout(300);
  // v0.4: o esqueleto por IA carrega de verdade (import relativo + CSP com wasm-unsafe-eval)
  const esqOk = await pg.evaluate(() => window.Esqueleto.carregar().then(() => true).catch(e => 'erro: ' + (e && e.message)));
  if (esqOk === true) ok('MediaPipe Pose carregou pela CSP e pelo caminho hospedado'); else falhou('esqueleto não carregou: ' + esqOk);
  // modo "só o celular": tem como começar (barra com ▶ e modos) e a rodada roda com a câmera falsa
  const solo = await ctx.newPage(); await solo.setViewportSize({ width: 390, height: 844 });
  solo.on('pageerror', e => erros.push('solo pageerror: ' + e.message));
  await solo.goto(base + '?teste'); await solo.click('#btSolo'); await solo.fill('#nome', 'Lia'); await solo.click('#btEntrar');
  await solo.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'lobby', null, { timeout: 20000 });
  // nada do lobby pode ficar embaixo da barra de botões nem sobrepor outro texto, em pé e deitado
  for (const [w, h, nome] of [[390, 844, 'em pé'], [844, 390, 'deitado'], [320, 640, '320 px']]) {
    await solo.setViewportSize({ width: w, height: h }); await solo.waitForTimeout(250);
    const sob = await solo.evaluate(() => {
      const r = el => el.getBoundingClientRect();
      const vis = el => { const b = r(el); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
      const cruza = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
      const barra = r(document.getElementById('tvLocalBar'));
      const textos = [...document.querySelectorAll('#tvLobby h2, #tvLobby .jog, #tvLobby .resumo, #tvLobby p')].filter(vis);
      const probs = [];
      textos.forEach(el => { if (cruza(r(el), barra)) probs.push('atrás da barra: ' + el.textContent.trim().slice(0, 30)); });
      for (let i = 0; i < textos.length; i++) for (let k = i + 1; k < textos.length; k++) if (!textos[i].contains(textos[k]) && !textos[k].contains(textos[i]) && cruza(r(textos[i]), r(textos[k]))) probs.push('sobrepostos: ' + textos[i].textContent.trim().slice(0, 20) + ' × ' + textos[k].textContent.trim().slice(0, 20));
      if (document.documentElement.scrollWidth > innerWidth) probs.push('rolagem lateral');
      return probs;
    });
    if (sob.length) falhou('lobby local ' + nome + ': ' + sob.join(' | ')); else ok('lobby local ' + nome + ': nada sobreposto nem atrás da barra');
  }
  await solo.setViewportSize({ width: 390, height: 844 });
  // v0.8.5: o boneco escolhido aparece no lobby, em cima do nome, e muda quando o celular manda outro
  const lb = await solo.evaluate(async () => { const cv = document.querySelector('#tvLobby .jog canvas'); if (!cv) return { cv: false }; const pix = () => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, Math.round(cv.height * 0.45)).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; }; await new Promise(r => setTimeout(r, 300)); const antes = pix(); window.BaguncaApp.TVApp.comando({ acao: 'boneco', j: 0, boneco: { cabeca: 'robo', cor: '#ff4fa3' } }); await new Promise(r => setTimeout(r, 300)); return { cv: true, antes, depois: pix(), robo: JSON.stringify(cv.getContext('2d').getImageData(0, 0, 1, 1).data) !== '' }; });
  if (lb.cv && lb.antes > 1500 && lb.depois > 1500) ok('lobby: boneco escolhido aparece em cima do nome (' + lb.antes + ' px) e segue a escolha'); else falhou('lobby sem boneco: ' + JSON.stringify(lb));
  const barra = await solo.evaluate(() => { const b = document.getElementById('localComecar'); const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(document.getElementById('tvLocalBar')).display !== 'none'; });
  if (barra) ok('só o celular: botão ▶ visível no lobby'); else falhou('só o celular: sem botão de começar');
  const cam = await solo.evaluate(() => { const b = document.getElementById('localCamera'); const r = b.getBoundingClientRect(); return r.width >= 40 && r.height >= 40; });
  if (cam) ok('só o celular: botão 🔄 trocar câmera visível'); else falhou('só o celular: sem botão de trocar câmera');
  await solo.click('#localComecar');
  await solo.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'jogando', null, { timeout: 30000 });
  ok('só o celular: rodada começou pelo ▶ da barra');
  for (const [nome, vw, vh] of [['em pé', 390, 844], ['deitado', 844, 390]]) {
    await solo.setViewportSize({ width: vw, height: vh }); await solo.waitForTimeout(300);
    const j = await solo.evaluate(() => { const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none'; }; const p = document.getElementById('localPausa').getBoundingClientRect(); return { comecar: vis(document.getElementById('localComecar')), boneco: vis(document.getElementById('localBoneco')), pausa: vis(document.getElementById('localPausa')), canto: p.top < innerHeight * 0.3 && p.right > innerWidth * 0.8 && p.width <= 56 }; });
    if (!j.comecar && !j.boneco && j.pausa && j.canto) ok('jogando ' + nome + ': barra sumiu, só ⏸ pequeno no canto'); else falhou('jogando ' + nome + ': ' + JSON.stringify(j));
  }
  // v0.8.4: pausar pelo canto vira ▶, e ▶ continua; um estado velho (classe jogando com o lobby aberto) se corrige sozinho
  await solo.click('#localPausa'); await solo.waitForTimeout(300);
  const p1 = await solo.evaluate(() => ({ fase: window.BaguncaApp.TVApp.tv.fase, txt: document.getElementById('localPausa').textContent, lobby: getComputedStyle(document.getElementById('tvLobby')).display }));
  await solo.click('#localPausa'); await solo.waitForTimeout(300);
  const p2 = await solo.evaluate(() => ({ fase: window.BaguncaApp.TVApp.tv.fase, txt: document.getElementById('localPausa').textContent }));
  if (p1.fase === 'pausa' && p1.txt === '▶' && p1.lobby === 'none' && p2.fase === 'jogando' && p2.txt === '⏸') ok('só o celular: ⏸ do canto pausa (vira ▶) e continua'); else falhou('pausa: ' + JSON.stringify([p1, p2]));
  await solo.evaluate(() => { document.getElementById('tv').classList.add('jogando'); document.getElementById('tvLobby').classList.add('ativa'); });
  await solo.evaluate(() => window.BaguncaApp.TVApp.comando({ acao: 'parar' })); await solo.waitForTimeout(600);
  const p3 = await solo.evaluate(() => ({ fase: window.BaguncaApp.TVApp.tv.fase, jogando: document.getElementById('tv').classList.contains('jogando'), comecar: getComputedStyle(document.getElementById('localComecar')).display }));
  if (p3.fase === 'fim' && !p3.jogando && p3.comecar !== 'none') ok('só o celular: depois de parar, ▶ volta mesmo com estado velho'); else falhou('estado velho: ' + JSON.stringify(p3));
  await solo.setViewportSize({ width: 390, height: 844 });
  await solo.screenshot({ path: '/tmp/pagina-solo.png' });
  // v0.6: no dedo (sem câmera): o dedo varre uma fruta e marca ponto; deslizar para cima = pulo
  const dedo = await ctx.newPage(); await dedo.setViewportSize({ width: 844, height: 390 });
  dedo.on('pageerror', e => erros.push('dedo pageerror: ' + e.message));
  await dedo.goto(base + '?teste'); await dedo.click('#btToque'); await dedo.fill('#nome', 'Téo'); await dedo.click('#btEntrar');
  await dedo.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'lobby', null, { timeout: 20000 });
  await dedo.click('#localComecar');
  await dedo.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'jogando', null, { timeout: 30000 });
  for (let i = 0; i < 40; i++) {
    const f = await dedo.evaluate(() => { const e = window.BaguncaDebug.partida.estado(); const c = e.coisas.find(x => !x.morta && (x.papel === 'fruta' || x.papel === 'doce')); if (!c) return null; const r = document.getElementById('tvCanvas').getBoundingClientRect(); return { x: r.left + c.x / 1280 * r.width, y: r.top + c.y / 720 * r.height }; });
    if (f) { await dedo.mouse.move(f.x - 60, f.y); await dedo.mouse.down(); await dedo.mouse.move(f.x + 60, f.y, { steps: 3 }); await dedo.mouse.up(); }
    await dedo.waitForTimeout(150);
  }
  const pd = await dedo.evaluate(() => window.BaguncaDebug.partida.estado().jogadores[0].pontos);
  if (pd > 0) ok('no dedo: cortou frutas com o dedo (' + pd + ' pontos)'); else falhou('no dedo: nenhum ponto');
  await dedo.mouse.move(400, 220); await dedo.mouse.down(); await dedo.mouse.move(400, 60, { steps: 4 }); await dedo.mouse.up(); await dedo.waitForTimeout(150);
  const pul = await dedo.evaluate(() => window.BaguncaDebug.partida.estado().jogadores[0].corpo.pulando);
  if (pul) ok('no dedo: deslizar para cima = pulo'); else falhou('no dedo: não pulou');
  // v0.8.5: no dedo, o 🧍 fica no canto (embaixo do ⏸), não tampa o jogo e responde ao toque
  for (const [nome, vw, vh] of [['em pé', 390, 844], ['deitado', 844, 390]]) {
    await dedo.setViewportSize({ width: vw, height: vh }); await dedo.waitForTimeout(300);
    const antes = await dedo.evaluate(() => window.BaguncaApp.TVApp.tv.mostrarBoneco);
    await dedo.click('#localBoneco'); await dedo.waitForTimeout(200);
    const r = await dedo.evaluate((antes) => { const b = document.getElementById('localBoneco').getBoundingClientRect(); return { canto: b.top < innerHeight * 0.4 && b.right > innerWidth * 0.8 && b.width <= 56, mudou: window.BaguncaApp.TVApp.tv.mostrarBoneco !== antes }; }, antes);
    if (r.canto && r.mudou) ok('no dedo ' + nome + ': 🧍 no canto e funcionando'); else falhou('no dedo ' + nome + ': 🧍 ' + JSON.stringify(r));
  }
  await dedo.screenshot({ path: '/tmp/pagina-dedo.png' });
  // celular em 320 px
  const cel = await ctx.newPage(); await cel.setViewportSize({ width: 320, height: 640 });
  cel.on('console', m => { if (m.type() === 'error') erros.push('cel: ' + m.text() + ' @' + (m.location() && m.location().url)); }); cel.on('pageerror', e => erros.push('cel pageerror: ' + e.message));
  await cel.goto(base + '?teste'); await cel.click('#btCel'); await cel.waitForTimeout(200);
  const largura = await cel.evaluate(() => document.documentElement.scrollWidth);
  if (largura <= 320) ok('celular sem rolagem lateral em 320 px'); else falhou('rolagem lateral: ' + largura);
  await cel.click('#bonecoEntrar summary'); await cel.waitForTimeout(600);
  const picker = await cel.evaluate(() => ({ cabecas: document.querySelectorAll('#bonecoEntrar .cabecas button').length, meninas: window.BaguncaApp.Figuras.lista().filter(f => f.menina).length, largura: document.documentElement.scrollWidth }));
  if (picker.cabecas >= 15 && picker.meninas >= 5 && picker.largura <= 320) ok('👗 Meu boneco: ' + picker.cabecas + ' cabeças (' + picker.meninas + ' meninas), sem rolagem lateral'); else falhou('picker: ' + JSON.stringify(picker));
  // v0.8.3: a prévia tem que seguir a escolha, inclusive cabeça da turma (antes dava erro e a prévia morria sem cabeça)
  const pixelsCabeca = async () => cel.evaluate(() => { const cv = document.querySelector('#bonecoEntrar canvas'); const d = cv.getContext('2d').getImageData(0, 0, cv.width, Math.round(cv.height * 0.45)).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; });
  await cel.click('#bonecoEntrar .cabecas button:last-child'); await cel.waitForTimeout(400);   // o picker se remonta ao trocar a cabeça: buscar de novo a cada clique
  const n1 = await pixelsCabeca();
  await cel.click('#bonecoEntrar .cabecas button:first-child'); await cel.waitForTimeout(400);
  const n2 = await pixelsCabeca();
  if (n1 > 2000 && n2 > 2000) ok('prévia do boneco com cabeça (turma e menino), e muda ao escolher'); else falhou('prévia sem cabeça: ' + n1 + ' / ' + n2);
  // v0.8.6: Menino e Menina são rostos diferentes mesmo com o mesmo cabelo; escolher Menina põe cabelo longo
  const dif = await cel.evaluate(() => { const B = window.BaguncaApp.Boneco; const desenha = (cab) => { const c = document.createElement('canvas'); c.width = c.height = 200; const x = c.getContext('2d'); x.translate(100, 110); B.cabeca(x, { cabeca: cab, cabelo: 'espetado', corCabelo: '#4fc3f7', pele: '#8d5524' }, 120, 0); return x.getImageData(0, 0, 200, 200).data; }; const a = desenha('menino'), b = desenha('menina'); let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++; return n; });
  if (dif > 300) ok('menino e menina têm rostos diferentes (' + dif + ' px)'); else falhou('menino e menina iguais: ' + dif + ' px');
  await cel.evaluate(() => { window.BaguncaApp.CelApp.cel.bonecos[0].cabelo = 'espetado'; });
  await cel.click('#bonecoEntrar .cabecas button:nth-child(2)'); await cel.waitForTimeout(300);
  const cabeloMenina = await cel.evaluate(() => window.BaguncaApp.CelApp.cel.bonecos[0].cabelo);
  if (cabeloMenina === 'longo') ok('escolher Menina troca o cabelo para longo'); else falhou('cabelo depois de Menina: ' + cabeloMenina);
  await cel.click('#bonecoEntrar .grupo button:nth-child(2)'); await cel.waitForTimeout(300);   // vestido
  await cel.screenshot({ path: '/tmp/pagina-cel-entrar.png', fullPage: true });
  await cel.evaluate(() => { document.getElementById('entrar').classList.remove('ativa'); document.getElementById('jogo').classList.add('ativa'); });
  const largura2 = await cel.evaluate(() => document.documentElement.scrollWidth);
  if (largura2 <= 320) ok('tela da sala sem rolagem lateral em 320 px'); else falhou('rolagem lateral na sala: ' + largura2);
  const cam2 = await cel.evaluate(() => { const b = document.getElementById('btCameraTopo'); const r = b.getBoundingClientRect(); return r.width >= 40 && r.height >= 40 && !b.disabled; });
  if (cam2) ok('celular pareado: botão 🔄 em cima da prévia'); else falhou('celular pareado: sem botão 🔄 visível');
  // v0.8.1: TV com ?debug mostra a caixa de depuração e o desenho blindado não acumula erros
  const dbg = await ctx.newPage(); await dbg.goto(base + '?teste&tv=auto&debug'); await dbg.waitForFunction(() => document.getElementById('pct').textContent === '100', null, { timeout: 15000 }); await dbg.waitForTimeout(1500);
  const caixa = await dbg.evaluate(() => { const b = document.getElementById('tvDebug'); return b ? b.textContent : ''; });
  if (/fps/.test(caixa) && /sem erros/.test(caixa)) ok('TV ?debug: caixa com fps e sem erros'); else falhou('TV ?debug: ' + caixa);
  await dbg.evaluate(() => window.Desenho.leve(true)); await dbg.waitForTimeout(1200);
  const leveOk = await dbg.evaluate(() => document.getElementById('tv').classList.contains('leve') && window.Desenho.erros().length === 0);
  if (leveOk) ok('modo leve: classe na TV e desenho sem erros'); else falhou('modo leve com problema');
  await dbg.close();
  await cel.screenshot({ path: '/tmp/pagina-cel-jogo.png', fullPage: true });
  const errosReais = erros.filter(e => !/favicon|solverone-dados|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|Failed to load resource.*(youtube|supabase)|supabase-js|net::ERR/i.test(e));
  if (errosReais.length) falhou('erros no console: ' + errosReais.join(' | ')); else ok('sem erros de JavaScript nem de CSP');
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
