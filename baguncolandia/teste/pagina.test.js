// Teste da página inteira no Chromium (Playwright): node baguncolandia/teste/pagina.test.js
// Abre como TV com ?teste (sem pareamento), começa uma rodada com pontos de movimento falsos,
// confere placar, calibração, CSP e erros no console. Também abre a tela do celular em 320 px.
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
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
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const pg = await ctx.newPage(); const erros = [];
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text()); }); pg.on('pageerror', e => erros.push('pageerror: ' + e.message));
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
  await pg.evaluate(() => { window.BaguncaTeste = { pontos: ts => [[(Math.sin(ts / 180) + 1) / 2, (Math.cos(ts / 230) + 1) / 2, 90]] }; });
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
  // celular em 320 px
  const cel = await ctx.newPage(); await cel.setViewportSize({ width: 320, height: 640 });
  cel.on('console', m => { if (m.type() === 'error') erros.push('cel: ' + m.text()); }); cel.on('pageerror', e => erros.push('cel pageerror: ' + e.message));
  await cel.goto(base + '?teste'); await cel.click('#btCel'); await cel.waitForTimeout(200);
  const largura = await cel.evaluate(() => document.documentElement.scrollWidth);
  if (largura <= 320) ok('celular sem rolagem lateral em 320 px'); else falhou('rolagem lateral: ' + largura);
  await cel.screenshot({ path: '/tmp/pagina-cel-entrar.png' });
  await cel.evaluate(() => { document.getElementById('entrar').classList.remove('ativa'); document.getElementById('jogo').classList.add('ativa'); });
  const largura2 = await cel.evaluate(() => document.documentElement.scrollWidth);
  if (largura2 <= 320) ok('tela da sala sem rolagem lateral em 320 px'); else falhou('rolagem lateral na sala: ' + largura2);
  await cel.screenshot({ path: '/tmp/pagina-cel-jogo.png', fullPage: true });
  const errosReais = erros.filter(e => !/favicon|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|Failed to load resource.*(youtube|supabase)|supabase-js|net::ERR/i.test(e));
  if (errosReais.length) falhou('erros no console: ' + errosReais.join(' | ')); else ok('sem erros de JavaScript nem de CSP');
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
