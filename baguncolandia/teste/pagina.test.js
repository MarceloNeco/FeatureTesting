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
  const barra = await solo.evaluate(() => { const b = document.getElementById('localComecar'); const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(document.getElementById('tvLocalBar')).display !== 'none'; });
  if (barra) ok('só o celular: botão ▶ visível no lobby'); else falhou('só o celular: sem botão de começar');
  await solo.click('#localComecar');
  await solo.waitForFunction(() => window.BaguncaApp.TVApp.tv.fase === 'jogando', null, { timeout: 30000 });
  ok('só o celular: rodada começou pelo ▶ da barra');
  await solo.screenshot({ path: '/tmp/pagina-solo.png' });
  // celular em 320 px
  const cel = await ctx.newPage(); await cel.setViewportSize({ width: 320, height: 640 });
  cel.on('console', m => { if (m.type() === 'error') erros.push('cel: ' + m.text() + ' @' + (m.location() && m.location().url)); }); cel.on('pageerror', e => erros.push('cel pageerror: ' + e.message));
  await cel.goto(base + '?teste'); await cel.click('#btCel'); await cel.waitForTimeout(200);
  const largura = await cel.evaluate(() => document.documentElement.scrollWidth);
  if (largura <= 320) ok('celular sem rolagem lateral em 320 px'); else falhou('rolagem lateral: ' + largura);
  await cel.click('#bonecoEntrar summary'); await cel.waitForTimeout(600);
  const picker = await cel.evaluate(() => ({ cabecas: document.querySelectorAll('#bonecoEntrar .cabecas button').length, meninas: window.BaguncaApp.Figuras.lista().filter(f => f.menina).length, largura: document.documentElement.scrollWidth }));
  if (picker.cabecas >= 15 && picker.meninas >= 5 && picker.largura <= 320) ok('👗 Meu boneco: ' + picker.cabecas + ' cabeças (' + picker.meninas + ' meninas), sem rolagem lateral'); else falhou('picker: ' + JSON.stringify(picker));
  await cel.click('#bonecoEntrar .grupo button:nth-child(2)'); await cel.waitForTimeout(300);   // vestido
  await cel.screenshot({ path: '/tmp/pagina-cel-entrar.png', fullPage: true });
  await cel.evaluate(() => { document.getElementById('entrar').classList.remove('ativa'); document.getElementById('jogo').classList.add('ativa'); });
  const largura2 = await cel.evaluate(() => document.documentElement.scrollWidth);
  if (largura2 <= 320) ok('tela da sala sem rolagem lateral em 320 px'); else falhou('rolagem lateral na sala: ' + largura2);
  await cel.screenshot({ path: '/tmp/pagina-cel-jogo.png', fullPage: true });
  const errosReais = erros.filter(e => !/favicon|solverone-dados|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|Failed to load resource.*(youtube|supabase)|supabase-js|net::ERR/i.test(e));
  if (errosReais.length) falhou('erros no console: ' + errosReais.join(' | ')); else ok('sem erros de JavaScript nem de CSP');
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
