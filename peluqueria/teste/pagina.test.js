// Teste da página inteira no Chromium (Playwright): node peluqueria/teste/pagina.test.js (de FeatureTesting/)
// Com ?teste o relógio é do teste (PeluqueriaDebug.passo(ms)) e a semente é fixa.
const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');
const raiz = path.resolve(__dirname, '..', '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(raiz, p);
  if (!f.startsWith(raiz) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let falhas = 0;
function PeluqueriaSomOk(p) { return p && typeof p.faixa === 'number' && p.arquivo !== 'raving-energy-faster.mp3'; }
function falhou(msg) { console.error('✗ ' + msg); falhas++; process.exitCode = 1; }
function ok(msg) { console.log('✓ ' + msg); }
function confere(cond, msg, extra) { if (cond) ok(msg); else falhou(msg + (extra !== undefined ? ' → ' + JSON.stringify(extra) : '')); }
const IGNORAR = /favicon|solverone-dados|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|net::ERR/i;

async function abrir(browser, url, opcoes = {}) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', hasTouch: false }, opcoes.ctx || {}));
  const pg = await ctx.newPage(); const erros = [];
  await pg.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI)); });
  if (opcoes.antes) await pg.addInitScript(opcoes.antes);
  if (opcoes.rotas) for (const [padrao, corpo] of opcoes.rotas) await pg.route(padrao, r => r.fulfill({ status: 200, contentType: 'application/json', body: corpo }));
  pg.on('console', m => { if (m.type() === 'error') erros.push(m.text() + ' @' + (m.location() && m.location().url)); });
  pg.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await pg.goto(url);
  if (opcoes.semDebug) await pg.waitForFunction(() => !document.getElementById('btJogar').disabled, null, { timeout: 15000 });
  else await pg.waitForFunction(() => window.PeluqueriaDebug && window.PeluqueriaDebug.pronto, null, { timeout: 15000 });
  if (!opcoes.semEntrar && await pg.isVisible('#btEntrar')) await pg.click('#btEntrar');   // tela de entrada (toque para começar)
  pg.erros = () => erros.filter(e => !IGNORAR.test(e));
  return pg;
}
const D = (pg, f, a) => pg.evaluate(f, a);
const est = pg => D(pg, () => { const e = PeluqueriaDebug.estado(); return { i: e.i, fase: e.fase, pontos: e.pontos, res: e.resultados.map(r => r.categoria), pausado: PeluqueriaDebug.pausado }; });
const passo = (pg, ms) => D(pg, m => PeluqueriaDebug.passo(m), ms);
const ateAlvo = pg => D(pg, () => PeluqueriaDebug.passo(PeluqueriaDebug.tempoAteAlvo()));
const tocar = (pg) => pg.mouse.click(195, 600);
async function comecar(pg, nivel) {
  await pg.click('#bt' + nivel);
  await pg.click('#btJogar');
  await passo(pg, 2200);   // contagem 3-2-1
}

(async () => {
  await new Promise(r => server.listen(0, r));
  const base = 'http://127.0.0.1:' + server.address().port + '/peluqueria/';
  const browser = await chromium.launch();

  /* ---------- página normal ---------- */
  const pg = await abrir(browser, base + '?teste');
  ok('abriu e carregou os catálogos');
  await pg.screenshot({ path: '/tmp/peluqueria-inicio.png' });
  await comecar(pg, 'Normal');
  let e = await est(pg);
  confere(e.fase === 'caindo' && await pg.isVisible('#rodada'), 'Normal → Jogar → contagem → caindo', e);
  await passo(pg, 600); await pg.screenshot({ path: '/tmp/peluqueria-queda.png' });
  await tocar(pg);
  e = await est(pg);
  confere(e.res.length === 1, 'toque para o item na Normal', e);
  await passo(pg, 2100);

  // nova rodada na Criança para os acertos exatos
  await D(pg, () => PeluqueriaDebug.novaRodada('crianca'));
  await ateAlvo(pg); await tocar(pg);
  e = await est(pg);
  const aviso = await pg.textContent('#aviso');
  confere(e.res[0] === 'PERFEITO' && /PERFEITO/.test(aviso), 'Criança na hora certa → PERFEITO', { e, aviso });
  await passo(pg, 300); await pg.screenshot({ path: '/tmp/peluqueria-perfeito.png' });
  confere(+(await pg.textContent('#pontos')) === 100, 'placar mostra 100');

  // toque duplo não pula queda
  const i0 = (await est(pg)).i;
  await tocar(pg); await pg.waitForTimeout(100); await tocar(pg);
  confere((await est(pg)).i === i0, 'toque duplo não pula queda');
  await passo(pg, 2100);
  confere((await est(pg)).i === i0 + 1, 'segue sozinho depois de 2 s');

  // Espaço para, Enter segue
  await passo(pg, 300);
  await pg.keyboard.press('Space');
  e = await est(pg);
  confere(e.fase === 'parado' && e.res.length === 2, 'Espaço para o item', e);
  await passo(pg, 500); await pg.keyboard.press('Enter');
  confere((await est(pg)).i === i0 + 2, 'Enter segue');

  // pausa
  await pg.click('#btPausa');
  confere(await pg.isVisible('#btSeguir') && (await est(pg)).pausado, '⏸ pausa e mostra ▶');
  await tocar(pg);
  confere((await est(pg)).fase === 'caindo', 'toque com o jogo pausado não para o item');
  await pg.click('#btSeguir');
  confere(!(await est(pg)).pausado && !(await pg.isVisible('#btSeguir')), '▶ continua');

  // visibilidade escondida pausa
  await D(pg, () => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await passo(pg, 60000);
  e = await est(pg);
  confere(e.pausado && e.fase === 'caindo' && e.i === i0 + 2, 'app escondido pausa e não conta LONGE', e);
  await D(pg, () => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); });
  await pg.click('#btSeguir');

  // girar o celular no meio da queda
  await ateAlvo(pg);
  await pg.setViewportSize({ width: 844, height: 390 }); await pg.waitForTimeout(100);
  await pg.mouse.click(420, 300);
  e = await est(pg);
  confere(e.res[e.res.length - 1] === 'PERFEITO', 'girou no meio da queda e ainda deu PERFEITO', e);
  await passo(pg, 300); await pg.screenshot({ path: '/tmp/peluqueria-deitado.png' });
  await pg.setViewportSize({ width: 390, height: 844 });
  await passo(pg, 2100);

  // termina a rodada
  for (let k = 0; k < 12 && (await est(pg)).fase !== 'fim'; k++) { await ateAlvo(pg); await tocar(pg); await passo(pg, 2100); }
  confere(await pg.isVisible('#fim') && /★/.test(await pg.textContent('#estrelas')) && await pg.isVisible('#btDeNovo'), 'fim com estrelas e Jogar de novo');
  confere(await pg.isVisible('#novoRecorde'), 'primeira rodada é recorde');
  await pg.screenshot({ path: '/tmp/peluqueria-fim.png' });
  await pg.click('#btInicio');

  // língua
  await pg.click('#btLingua');
  confere((await pg.textContent('#btJogar')) === 'Play', 'PT → EN troca os textos');
  await pg.click('#btLingua');

  confere(pg.erros().length === 0, 'sem erros no console', pg.erros());
  confere((await D(pg, () => window.__csp)).length === 0, 'sem violação de CSP', await D(pg, () => window.__csp));

  /* ---------- som e voz ---------- */
  const ps = await abrir(browser, base + '?teste');
  await D(ps, () => PeluqueriaDebug.novaRodada('crianca'));
  await ateAlvo(ps); await tocar(ps);
  const reg = await D(ps, () => window.PeluqueriaSom && PeluqueriaSom.registro);
  confere(Array.isArray(reg) && reg.includes('PERFEITO') && reg.includes('conta'), 'som registra contagem e PERFEITO', reg);
  confere(reg.includes('uhul') && await D(ps, () => PeluqueriaVoz.ultimo !== 'UHUL!'), 'PERFEITO toca a torcida "u-huuu!" (e não a voz robótica)', reg);
  await ps.click('#btPausa'); await ps.click('#btSeguir');
  confere(ps.erros().length === 0, 'som: sem erros', ps.erros());

  const mudo = await abrir(browser, base + '?teste', { antes: () => { delete window.speechSynthesis; delete window.AudioContext; delete window.webkitAudioContext; window.speechSynthesis = undefined; window.AudioContext = undefined; window.webkitAudioContext = undefined; } });
  await D(mudo, () => PeluqueriaDebug.novaRodada('crianca'));
  await ateAlvo(mudo); await tocar(mudo); await passo(mudo, 2100);
  await ateAlvo(mudo); await tocar(mudo);
  confere(/PERFEITO/.test(await mudo.textContent('#aviso')) && mudo.erros().length === 0, 'sem voz e sem WebAudio: joga com legenda e sem erro', mudo.erros());

  /* ---------- marcar.html ---------- */
  {
    const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
    const pmk = await ctxM.newPage(); const errosM = [];
    await pmk.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective)); });
    pmk.on('console', m => { if (m.type() === 'error') errosM.push(m.text()); }); pmk.on('pageerror', e => errosM.push(e.message));
    await pmk.goto(base + 'marcar.html');
    const png = Buffer.from(await pmk.evaluate(() => { const c = document.createElement('canvas'); c.width = 800; c.height = 600; const g = c.getContext('2d'); g.fillStyle = '#c6ff3d'; g.fillRect(0, 0, 800, 600); return c.toDataURL('image/png').split(',')[1]; }), 'base64');
    await pmk.setInputFiles('#foto', { name: 'Minha Foto Ção.png', mimeType: 'image/png', buffer: png });
    await pmk.waitForFunction(() => document.getElementById('imagem').naturalWidth === 800);
    await pmk.click('[data-lugar="olhos"]');
    const bx = await pmk.locator('#imagem').boundingBox();
    await pmk.mouse.move(bx.x + bx.width * 0.3, bx.y + bx.height * 0.3); await pmk.mouse.down();
    await pmk.mouse.move(bx.x + bx.width * 0.5, bx.y + bx.height * 0.4, { steps: 4 });
    await pmk.mouse.move(bx.x + bx.width * 0.7, bx.y + bx.height * 0.5, { steps: 4 }); await pmk.mouse.up();
    const linha = JSON.parse(await pmk.textContent('#linha'));
    const L = linha.lugares && linha.lugares.olhos;
    confere(linha.largura === 800 && linha.altura === 600 && L && Math.abs(L.x - 0.5) < 0.02 && Math.abs(L.y - 0.4) < 0.02 && Math.abs(L.tam - 0.4) < 0.02, 'marcar: quadrado vira o lugar dos olhos', linha);
    confere(linha.id === 'minha-foto-cao' && linha.arquivo === 'minha-foto-cao.png', 'marcar: nome do arquivo vira id e arquivo simples', [linha.id, linha.arquivo]);
    confere(await pmk.evaluate(l => !!Peluqueria.validarCenario(l), linha), 'marcar: linha passa na validação do jogo', linha);
    await pmk.click('#modoItem');
    const bx2 = await pmk.locator('#imagem').boundingBox();   // o controle de giro some e a foto sobe
    await pmk.mouse.click(bx2.x + bx2.width * 0.25, bx2.y + bx2.height * 0.75);
    const item = JSON.parse(await pmk.textContent('#linha'));
    confere(Math.abs(item.encaixe.x - 0.25) < 0.02 && Math.abs(item.encaixe.y - 0.75) < 0.02 && await pmk.evaluate(l => !!Peluqueria.validarItem(l), item), 'marcar: modo item marca o encaixe', item);
    confere(errosM.length === 0 && (await pmk.evaluate(() => window.__csp)).length === 0, 'marcar: sem erros nem CSP', errosM);
    await pmk.screenshot({ path: '/tmp/peluqueria-marcar.png' });
  }

  /* ---------- TV (0.4.0): código, celular como controle, corpo, dois jogadores ---------- */
  {
    const ctxTV = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'pt-BR' });
    const tv = await ctxTV.newPage(); const errosTV = [];
    tv.on('console', m => { const t = m.text() + ' @' + (m.location() && m.location().url); if (m.type() === 'error' && !IGNORAR.test(t)) errosTV.push(t); }); tv.on('pageerror', e => errosTV.push(e.message));
    await tv.goto(base + '?tv=auto&teste'); await tv.waitForFunction(() => window.PeluqueriaTVDebug && PeluqueriaTVDebug.pronto);
    const codigo = (await tv.textContent('#codigo')).trim();
    confere(/^[A-Z]{4}$/.test(codigo) && await tv.isVisible('#tvLobby') && await D(tv, () => document.documentElement.classList.contains('tv')), 'TV mostra o código de 4 letras', codigo);
    // TV sozinha com o controle remoto: OK começa e OK para
    await tv.keyboard.press('Enter'); await D(tv, () => PeluqueriaTVDebug.passo(2200));
    confere(await tv.isVisible('#tvJogo') && await D(tv, () => PeluqueriaTVDebug.jogadores()) === 1, 'TV sem celular: OK começa a rodada de 1 jogador');
    await D(tv, () => PeluqueriaTVDebug.passo(PeluqueriaTVDebug.tempoAteAlvo(0))); await tv.keyboard.press('Enter');
    confere(await D(tv, () => PeluqueriaTVDebug.ultimo(0)) === 'PERFEITO', 'TV: OK do controle para o item na hora certa');
    confere(await D(tv, () => PeluqueriaTVDebug.leve === true), 'TV: modo leve ligado');
    await tv.keyboard.press('Escape');
    confere(await tv.isVisible('#tvLobby'), 'TV: Voltar/Esc leva ao lobby');

    // celular entra com o código
    const cel = await ctxTV.newPage(); const errosCel = [];
    cel.on('console', m => { const t = m.text() + ' @' + (m.location() && m.location().url); if (m.type() === 'error' && !IGNORAR.test(t)) errosCel.push(t); }); cel.on('pageerror', e => errosCel.push(e.message));
    await cel.setViewportSize({ width: 390, height: 844 });
    await cel.goto(base + '?teste'); await cel.waitForFunction(() => window.PeluqueriaDebug && PeluqueriaDebug.pronto); await cel.click('#btEntrar');
    await cel.click('#btControle');
    await cel.fill('#ctCodigo', codigo.toLowerCase()); await cel.fill('#ctNome', 'Ana'); await cel.click('#ctEntrar');
    await tv.waitForFunction(() => /Ana/.test(document.getElementById('tvJogadores').textContent), null, { timeout: 5000 });
    ok('celular entrou e a TV mostra o nome');
    await cel.waitForFunction(() => document.getElementById('ctPainel') && !document.getElementById('ctPainel').hidden, null, { timeout: 5000 });
    await cel.screenshot({ path: '/tmp/peluqueria-controle.png' });
    await cel.click('#ctCrianca'); await cel.waitForTimeout(150);
    confere(await D(tv, () => PeluqueriaTVDebug.nivel()) === 'crianca', 'celular escolhe o nível na TV');
    await cel.click('#ctComecar'); await tv.waitForTimeout(150); await D(tv, () => PeluqueriaTVDebug.passo(2200));
    confere(await tv.isVisible('#tvJogo'), 'celular começa a rodada');
    await D(tv, () => PeluqueriaTVDebug.passo(PeluqueriaTVDebug.tempoAteAlvo(0)));
    await cel.click('#ctParar'); await tv.waitForTimeout(250);
    confere(await D(tv, () => PeluqueriaTVDebug.ultimo(0)) === 'PERFEITO', 'tocar PARAR no celular para o item na TV');
    await D(tv, () => PeluqueriaTVDebug.passo(2100));
    // corpo: gesto brusco simulado (esqueleto falso) para o item
    await D(tv, () => PeluqueriaTVDebug.passo(500));
    await D(cel, () => PeluqueriaControleDebug.tremer(1500));
    await tv.waitForTimeout(200);
    confere(await D(tv, () => PeluqueriaTVDebug.resultados(0)) === 1, 'tremidinha no celular não para o item');
    // o relógio do jogo no teste fica parado: o gesto vem logo depois de chegar na hora certa
    await D(tv, () => PeluqueriaTVDebug.passo(PeluqueriaTVDebug.tempoAteAlvo(0)));
    await D(cel, () => PeluqueriaControleDebug.levantarBraco());
    await tv.waitForTimeout(250);
    confere(await D(tv, () => PeluqueriaTVDebug.resultados(0)) === 2 && await D(tv, () => PeluqueriaTVDebug.ultimo(0)) === 'PERFEITO', 'levantar o braço de repente para o item', await D(tv, () => [PeluqueriaTVDebug.resultados(0), PeluqueriaTVDebug.ultimo(0), PeluqueriaTVDebug.atraso()]));
    // mensagem estranha no canal é ignorada
    await D(tv, (c) => new BroadcastChannel('peluqueria-' + c).postMessage({ t: 'cmd', acao: 'apagar', id: 'x' }), codigo);
    // segundo celular durante a rodada não entra; no lobby entra e a tela divide
    const cel2 = await ctxTV.newPage(); await cel2.setViewportSize({ width: 390, height: 844 });
    await cel2.goto(base + '?teste'); await cel2.waitForFunction(() => window.PeluqueriaDebug && PeluqueriaDebug.pronto); await cel2.click('#btEntrar');
    await cel2.click('#btControle'); await cel2.fill('#ctCodigo', codigo); await cel2.fill('#ctNome', 'Bia'); await cel2.click('#ctEntrar');
    await tv.waitForTimeout(400);
    confere(!/Bia/.test(await tv.textContent('#tvJogadores')), 'durante a rodada ninguém novo entra');
    await tv.keyboard.press('Escape'); await tv.waitForTimeout(100);
    await D(cel2, () => PeluqueriaControleDebug.reentrar());
    await tv.waitForFunction(() => /Bia/.test(document.getElementById('tvJogadores').textContent), null, { timeout: 5000 });
    ok('no lobby, o segundo celular entra');
    await cel.click('#ctComecar'); await tv.waitForTimeout(150); await D(tv, () => PeluqueriaTVDebug.passo(2200));
    confere(await D(tv, () => PeluqueriaTVDebug.jogadores()) === 2 && await tv.isVisible('#tvPalco1'), 'dois jogadores: tela dividida');
    await D(tv, () => PeluqueriaTVDebug.passo(PeluqueriaTVDebug.tempoAteAlvo(0)));
    await cel.click('#ctParar'); await tv.waitForTimeout(200);
    await D(tv, () => PeluqueriaTVDebug.passo(400));
    await cel2.click('#ctParar'); await tv.waitForTimeout(200);
    confere(await D(tv, () => [PeluqueriaTVDebug.ultimo(0), PeluqueriaTVDebug.resultados(1)]).then(r => r[0] === 'PERFEITO' && r[1] === 1), 'cada celular para o seu item');
    await D(tv, () => PeluqueriaTVDebug.passo(300)); await tv.screenshot({ path: '/tmp/peluqueria-tv-dois.png' });
    await D(tv, () => { for (let k = 0; k < 12 && PeluqueriaTVDebug.fase() !== 'fim'; k++) PeluqueriaTVDebug.passo(9000); });
    confere(await tv.isVisible('#tvFim') && /Ana/.test(await tv.textContent('#tvPodio')), 'fim com pódio');
    await tv.screenshot({ path: '/tmp/peluqueria-tv-fim.png' });
    await cel.waitForTimeout(300);
    confere(/Ana|venceu|empate/i.test(await cel.textContent('#ctStatus')), 'celular mostra o resultado', await cel.textContent('#ctStatus'));
    // revisão 0.4.0: senha do celular, vaga fantasma, TV cheia, TV sumiu, sair da TV
    await cel.click('#ctComecar'); await tv.waitForTimeout(150); await D(tv, () => PeluqueriaTVDebug.passo(2200));
    const idAna = await D(cel, () => sessionStorage.getItem('peluqueria-id'));
    const r0 = await D(tv, () => PeluqueriaTVDebug.resultados(0));
    await D(tv, ([c, id]) => new BroadcastChannel('peluqueria-' + c).postMessage({ t: 'cmd', id, k: 'senhaerrada1234', acao: 'parar' }), [codigo, idAna]);
    await tv.waitForTimeout(200);
    confere(await D(tv, () => PeluqueriaTVDebug.resultados(0)) === r0 && await tv.isVisible('#tvJogo'), 'sem a senha do celular, ninguém se passa pelo jogador');
    await tv.keyboard.press('Escape'); await tv.waitForTimeout(100);
    const cel3 = await ctxTV.newPage(); await cel3.setViewportSize({ width: 390, height: 844 });
    await cel3.goto(base + '?teste'); await cel3.waitForFunction(() => window.PeluqueriaDebug && PeluqueriaDebug.pronto); await cel3.click('#btEntrar');
    await cel3.click('#btControle'); await cel3.fill('#ctCodigo', codigo); await cel3.fill('#ctNome', 'Caio'); await cel3.click('#ctEntrar');
    await cel3.waitForTimeout(3500);
    confere(/2 jogadores/.test(await cel3.textContent('#ctStatus')), 'terceiro celular vê "TV com 2 jogadores" (não "Conectado")', await cel3.textContent('#ctStatus'));
    await cel2.close();   // Bia fechou a aba: o aviso de saída (ou, se ele se perder, a falta de sinal) libera a vaga, e o Caio, que esperava, entra
    await tv.waitForFunction(() => !/Bia/.test(document.getElementById('tvJogadores').textContent) && /Caio/.test(document.getElementById('tvJogadores').textContent), null, { timeout: 8000 }).catch(() => {});
    confere(!/Bia/.test(await tv.textContent('#tvJogadores')), 'quem fecha a aba libera a vaga');
    confere(/Caio/.test(await tv.textContent('#tvJogadores')), 'o celular que esperava entra na vaga livre');
    await cel3.close(); await tv.waitForFunction(() => !/Caio/.test(document.getElementById('tvJogadores').textContent), null, { timeout: 5000 });   // espera a TV liberar a vaga
    await D(tv, (c) => new BroadcastChannel('peluqueria-' + c).postMessage({ t: 'join', id: 'fantasma1', k: 'fantasmasenha12', nome: 'Fantasma' }), codigo);
    await tv.waitForTimeout(300);
    confere(/Fantasma/.test(await tv.textContent('#tvJogadores')), 'celular novo entra');
    await tv.waitForFunction(() => !/Fantasma/.test(document.getElementById('tvJogadores').textContent), null, { timeout: 6000 }).catch(() => {});
    confere(!/Fantasma/.test(await tv.textContent('#tvJogadores')), 'celular que some (sem sinal) sai do lobby');
    confere(/Ana/.test(await tv.textContent('#tvJogadores')), 'quem está ativo (mandando sinal) fica');
    await tv.click('#tvSair');
    confere(await tv.isVisible('#inicio'), '🏠 no lobby da TV volta ao início');
    await tv.close();
    await cel.waitForFunction(() => /não encontrada|not found/i.test(document.getElementById('ctStatus').textContent), null, { timeout: 6000 }).catch(() => {});
    confere(/não encontrada|not found/i.test(await cel.textContent('#ctStatus')), 'celular percebe quando a TV some', await cel.textContent('#ctStatus'));
    confere(errosTV.length === 0 && errosCel.length === 0, 'TV e celular sem erros', errosTV.concat(errosCel));
    await ctxTV.close();
  }

  const pdb = await abrir(browser, base + '?debug&teste');
  await passo(pdb, 500);
  confere(/v0\.5\.0/.test(await pdb.textContent('#debug')) && await pdb.isVisible('#debug'), '?debug mostra a versão');
  confere(await D(pdb, () => PeluqueriaDebug.leve === false), 'celular: modo leve desligado');

  /* ---------- revisão final ---------- */
  // 1) segurar Enter/OK: as repetições do teclado não seguem nem param a próxima queda
  {
    const pr = await abrir(browser, base + '?teste');
    await D(pr, () => PeluqueriaDebug.novaRodada('crianca'));
    await ateAlvo(pr); await pr.keyboard.press('Enter'); await passo(pr, 500);
    await D(pr, () => { for (let k = 0; k < 3; k++) document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true })); });
    const er = await est(pr);
    confere(er.res.length === 1 && er.res[0] === 'PERFEITO' && er.i === 0, 'segurar OK não vira LONGE na próxima queda', er);
  }
  // 2) um erro no desenho não congela o laço de verdade (sem ?teste)
  {
    const pq = await abrir(browser, base, { antes: () => {
      let real;
      Object.defineProperty(window, 'PeluqueriaDesenho', { configurable: true, get: () => real, set: v => {
        real = { criar: (c, o) => { const d = v.criar(c, o), p = d.pintar; let vez = 0; d.pintar = function () { if (++vez === 3) throw new Error('erro de teste'); return p.apply(this, arguments); }; return d; } };
      } });
    }, semDebug: true });
    await pq.click('#btJogar');
    await pq.waitForTimeout(3500);
    const t = await D(pq, () => PeluqueriaApp.estado() && PeluqueriaApp.estado().t);
    confere(t > 0.5, 'erro no desenho não congela a rodada', t);
  }
  // 3) o cenário e o item não são redesenhados a partir do SVG a cada quadro
  {
    const pc = await abrir(browser, base + '?teste');
    await D(pc, () => PeluqueriaDebug.novaRodada('normal'));
    const n = await D(pc, () => {
      const e = PeluqueriaDebug.estado(), q = e.quedas[e.i], proto = CanvasRenderingContext2D.prototype, orig = proto.drawImage; let svg = 0;
      proto.drawImage = function (im) { if (im === q.cenario.img || im === q.item.img) svg++; return orig.apply(this, arguments); };
      PeluqueriaDebug.passo(1000); proto.drawImage = orig; return svg;
    });
    confere(n <= 4, 'SVG do cenário e do item desenhados poucas vezes (cache por queda)', n);
  }
  // sair da página pausa a música na hora; voltar continua; ▶ religa o áudio suspenso (iPhone)
  {
    const pa = await abrir(browser, base + '?teste');
    await pa.waitForTimeout(800);
    confere(await D(pa, () => PeluqueriaSom.tocando()), 'abertura tocando (arquivo MP3 de verdade)');
    const t0 = await D(pa, () => PeluqueriaSom._elemento().currentTime);
    await pa.waitForTimeout(1200);
    confere((await D(pa, () => PeluqueriaSom._elemento().currentTime)) > t0 + 0.5, 'a música anda (está mesmo tocando)');
    await D(pa, () => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await pa.waitForTimeout(300);
    const t1 = await D(pa, () => PeluqueriaSom._elemento().currentTime);
    await pa.waitForTimeout(800);
    confere(!(await D(pa, () => PeluqueriaSom.tocando())) && (await D(pa, () => PeluqueriaSom._elemento().currentTime)) === t1, 'saiu da página: a música para na hora (nada continua tocando)');
    await D(pa, () => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await pa.waitForTimeout(400);
    confere(await D(pa, () => PeluqueriaSom.tocando()) && (await D(pa, () => PeluqueriaSom._elemento().currentTime)) >= t1, 'voltou: continua de onde parou');
    await pa.click('#btJogar'); await passo(pa, 2200);
    await pa.click('#btPausa'); await D(pa, () => PeluqueriaSom._ctx().suspend());
    await pa.click('#btSeguir'); await pa.waitForTimeout(300);
    confere(await D(pa, () => PeluqueriaSom._ctx().state) === 'running', '▶ religa o áudio suspenso');
    confere(pa.erros().length === 0, 'música: sem erros', pa.erros());
  }
  // música que não carrega: pula para a próxima, sem erro
  {
    const ctxA = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
    const pmp = await ctxA.newPage(); const errosM = [];
    pmp.on('pageerror', e => errosM.push(e.message));
    await pmp.route('**/musicas/raving-energy-faster.mp3', r => r.fulfill({ status: 404, body: '' }));
    await pmp.goto(base + '?teste'); await pmp.waitForFunction(() => window.PeluqueriaDebug && PeluqueriaDebug.pronto); await pmp.click('#btEntrar');
    await D(pmp, () => PeluqueriaSom._forcarProxima('raving-energy-faster.mp3'));
    await pmp.click('#btJogar'); await pmp.waitForTimeout(1500);
    const pos = await D(pmp, () => PeluqueriaSom.posicao());
    confere(PeluqueriaSomOk(pos) && errosM.length === 0, 'música que não carrega é pulada sem erro', pos);
  }
  // abertura especial na tela de início; uma música diferente a cada rodada; música segue no fim
  {
    const pi = await abrir(browser, base + '?teste', { semEntrar: true });
    confere(await pi.isVisible('#entrada') && !(await pi.isVisible('#inicio')), 'abre na tela de entrada (toque para começar)');
    confere(await D(pi, () => PeluqueriaSom.fonte()) === '', 'sem som antes do primeiro toque');
    await pi.click('#btEntrar');
    confere(await D(pi, () => PeluqueriaSom.fonte()) === 'jogo' && (await D(pi, () => PeluqueriaSom.posicao().faixa)) === 'abertura', 'o toque na entrada já toca a música de abertura');
    confere(await pi.isVisible('#inicio') && await D(pi, () => document.activeElement.id) === 'btJogar', 'e mostra o menu com as luzes');
    await pi.click('#btMaluco');
    confere((await D(pi, () => PeluqueriaSom.lista().length)) >= 16, '16 músicas de rodada carregadas (além da abertura)');
    confere(/Kevin MacLeod/.test(await pi.textContent('#tocando')) && /Show Your Moves/.test(await pi.textContent('#tocando')), 'menu mostra a música e o autor (crédito da licença)');
    const rodada = async () => {
      await pi.click('#btJogar'); await pi.waitForTimeout(100);
      const f = await D(pi, () => PeluqueriaSom.posicao().faixa);
      await D(pi, () => { PeluqueriaDebug.passo(2200); for (let k = 0; k < 10; k++) { PeluqueriaDebug.passo(PeluqueriaDebug.tempoAteAlvo()); document.getElementById('palco').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); PeluqueriaDebug.passo(2100); } });
      return f;
    };
    const f1 = await rodada();
    confere(typeof f1 === 'number', 'a rodada troca a abertura por uma música do jogo', f1);
    confere(await pi.isVisible('#fim') && await D(pi, () => PeluqueriaSom.fonte()) === 'jogo', 'música segue tocando na tela de fim');
    await pi.click('#btDeNovo'); await pi.waitForTimeout(100);
    const f2 = await D(pi, () => PeluqueriaSom.posicao().faixa);
    confere(typeof f2 === 'number' && f2 !== f1, '"Jogar de novo" toca outra música', [f1, f2]);
    await passo(pi, 2200); await pi.click('#btCasa');
    confere((await D(pi, () => PeluqueriaSom.posicao().faixa)) === 'abertura', 'de volta ao menu, toca a abertura');
    confere(pi.erros().length === 0, 'música: sem erros', pi.erros());
  }
  // abertura com movimento e luz: holofotes, brilhos, itens flutuando e o nome pulsando na batida
  {
    const pv = await abrir(browser, base + '?teste');
    const feixes = await D(pv, () => [...document.querySelectorAll('#inicio .feixe')].map(e => getComputedStyle(e).animationName));
    confere(feixes.length >= 2 && feixes.every(n => n && n !== 'none'), 'holofotes girando na abertura', feixes);
    confere(await D(pv, () => document.querySelectorAll('#inicio .flutuantes img').length) >= 6, 'itens flutuando na abertura');
    await D(pv, () => { window.__batidas = 0; new MutationObserver(() => { if (document.querySelector('#inicio .logo').classList.contains('bate')) window.__batidas++; }).observe(document.querySelector('#inicio .logo'), { attributes: true }); });
    await pv.click('#btNormal'); await pv.waitForTimeout(2500);
    confere(await D(pv, () => window.__batidas) >= 3, 'nome do jogo pulsa na batida da música', await D(pv, () => window.__batidas));
    await pv.screenshot({ path: '/tmp/peluqueria-abertura.png' });
    const ctxR = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR', reducedMotion: 'reduce' });
    const pr2 = await ctxR.newPage(); await pr2.goto(base + '?teste'); await pr2.waitForFunction(() => window.PeluqueriaDebug && PeluqueriaDebug.pronto);
    const parado = await pr2.evaluate(() => [...document.querySelectorAll('#inicio .feixe, #inicio .flutuantes img')].every(e => getComputedStyle(e).animationName === 'none'));
    confere(parado, 'com "reduzir movimento" no aparelho, a abertura fica parada');
  }
  {
    const ptk = await abrir(browser, base + '?tv=auto&teste', { ctx: { viewport: { width: 1280, height: 720 } } });
    await ptk.keyboard.press('ArrowRight');
    confere(await D(ptk, () => PeluqueriaSom.fonte()) === 'jogo', 'TV: primeira tecla do controle liga a música');
  }

  // 🏠 na rodada e botão Voltar do celular levam ao menu (pedido do dono, 0.2.0)
  {
    const ph = await abrir(browser, base + '?teste');
    await ph.click('#btNormal'); await ph.click('#btJogar'); await passo(ph, 2200);
    confere(await ph.isVisible('#btCasa'), '🏠 visível durante a rodada');
    await ph.click('#btCasa');
    confere(await ph.isVisible('#inicio') && !(await ph.isVisible('#rodada')), '🏠 volta ao menu');
    confere(await D(ph, () => PeluqueriaSom.fonte()) === 'jogo', 'música segue no menu depois do 🏠');
    await ph.click('#btJogar'); await passo(ph, 2200);
    await ph.goBack(); await ph.waitForTimeout(300);
    confere(/peluqueria/.test(ph.url()) && await ph.isVisible('#inicio'), 'Voltar do celular na rodada vai ao menu (não sai do jogo)', ph.url());
    await ph.click('#btJogar'); await passo(ph, 2200);
    await D(ph, () => { for (let k = 0; k < 10; k++) { PeluqueriaDebug.passo(PeluqueriaDebug.tempoAteAlvo()); document.getElementById('palco').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); PeluqueriaDebug.passo(2100); } });
    confere(await ph.isVisible('#fim'), 'chegou ao fim');
    await ph.goBack(); await ph.waitForTimeout(300);
    confere(/peluqueria/.test(ph.url()) && await ph.isVisible('#inicio'), 'Voltar na tela de fim vai ao menu', ph.url());
    await ph.click('#btJogar'); await passo(ph, 2200); await ph.click('#btCasa');
    await ph.click('#btJogar'); await passo(ph, 2200);
    await ph.goBack(); await ph.waitForTimeout(300);
    confere(/peluqueria/.test(ph.url()) && await ph.isVisible('#inicio'), 'depois de 🏠 e jogar de novo, Voltar ainda vai ao menu', ph.url());
    confere(ph.erros().length === 0, '🏠/Voltar: sem erros', ph.erros());
  }

  /* ---------- 320 px ---------- */
  const p320 = await abrir(browser, base + '?teste', { ctx: { viewport: { width: 320, height: 640 } } });
  confere(await D(p320, () => document.documentElement.scrollWidth <= 320), '320 px sem rolagem lateral (início)');
  await p320.screenshot({ path: '/tmp/peluqueria-320.png' });

  /* ---------- meus/ inválido ---------- */
  const pm = await abrir(browser, base + '?teste', { rotas: [['**/meus/cenarios.json', '{{{']] });
  confere(!(await pm.isVisible('#btMinhas')) && pm.erros().length === 0, 'meus/ inválido: abre sem erro e sem "Minhas imagens"', pm.erros());

  /* ---------- meus/ com uma imagem ---------- */
  const pm2 = await abrir(browser, base + '?teste', { rotas: [['**/meus/cenarios.json', JSON.stringify([{ id: 'teste', nome: 'Teste', arquivo: '../cenarios/gato.svg', largura: 1000, altura: 1000, lugares: { cabeca: { x: 0.5, y: 0.2, tam: 0.4 } } }, { id: 'teste2', nome: 'Teste', arquivo: 'nao-existe.png', largura: 1000, altura: 1000, lugares: { cabeca: { x: 0.5, y: 0.2, tam: 0.4 } } }])]] });
  confere(!(await pm2.isVisible('#btMinhas')), 'meus/ só com entradas ruins não liga "Minhas imagens"');

  /* ---------- meus/ com uma imagem boa ---------- */
  const gato = fs.readFileSync(path.join(raiz, 'peluqueria/cenarios/gato.svg'), 'utf8');
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'pt-BR' });
  const p3 = await ctx3.newPage();
  await p3.route('**/meus/cenarios.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'foto', nome: 'Foto', arquivo: 'foto.svg', largura: 1000, altura: 1000, lugares: { cabeca: { x: 0.5, y: 0.27, tam: 0.4 } } }]) }));
  await p3.route('**/meus/foto.svg', r => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: gato }));
  await p3.goto(base + '?teste'); await p3.waitForFunction(() => window.PeluqueriaDebug && window.PeluqueriaDebug.pronto); await p3.click('#btEntrar');
  confere(await p3.isVisible('#btMinhas'), 'meus/ com imagem boa mostra "Minhas imagens"');
  await p3.click('#btMinhas');
  confere((await p3.getAttribute('#btMinhas', 'aria-pressed')) === 'true', '"Minhas imagens" liga');

  await browser.close(); server.close();
  console.log(falhas ? falhas + ' falha(s)' : 'tudo certo');
})().catch(e => { console.error(e); process.exit(1); });
