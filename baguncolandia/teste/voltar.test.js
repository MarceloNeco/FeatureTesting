// Botão Voltar do celular (Chromium, Playwright): node baguncolandia/teste/voltar.test.js
// O Voltar fecha uma tela por vez (jogo → nome e boneco → menu) e só do menu é que sai do jogo; o ✕ não deixa
// entrada "sobrando" no histórico.
const { chromium } = require('playwright');
const path=require('path'),http=require('http'),fs=require('fs');
const raiz=path.resolve(__dirname,'..','..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(raiz,p);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
let falhas=0; const conf=(c,m)=>{console.log((c?'✓ ':'✗ ')+m); if(!c) falhas++;};
(async()=>{
  await new Promise(r=>server.listen(0,r)); const base='http://127.0.0.1:'+server.address().port+'/baguncolandia/';
  const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const pg=await (await b.newContext({viewport:{width:900,height:420},locale:'pt-BR'})).newPage();
  const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
  const onde=()=>pg.evaluate(()=>({url:location.href, tela:(document.querySelector('.tela.ativa')||{}).id||'', tv:!!document.querySelector('#tv.ativa')}));
  const voltar=async()=>{ await pg.goBack({waitUntil:'commit'}).catch(()=>{}); await pg.waitForTimeout(500); return onde(); };
  for (const [modo,bt] of [['Só o celular','#btSolo'],['No dedo','#btToque']]) {
    await pg.goto('about:blank'); await pg.goto(base); await pg.waitForTimeout(400);
    await pg.click(bt); await pg.fill('#nome','Teo'); await pg.click('#btEntrar'); await pg.waitForTimeout(1500);
    let o=await onde(); conf(o.tv, modo+': entrou no jogo');
    o=await voltar(); conf(!o.tv && o.tela==='entrar', modo+': Voltar no jogo → tela de nome e boneco ('+JSON.stringify(o)+')');
    o=await voltar(); conf(!o.tv && o.tela==='inicio' && o.url.startsWith(base), modo+': Voltar de novo → menu inicial');
    o=await voltar(); conf(o.url==='about:blank', modo+': Voltar no menu inicial → sai do jogo');
    // ✕ do jogo continua levando ao menu inicial e não deixa Voltar "sobrando"
    await pg.goto(base); await pg.waitForTimeout(400);
    await pg.click(bt); await pg.fill('#nome','Teo'); await pg.click('#btEntrar'); await pg.waitForTimeout(1500);
    await pg.click('#tvSair'); await pg.waitForTimeout(500); o=await onde(); conf(!o.tv && o.tela==='inicio', modo+': ✕ → menu inicial');
    o=await voltar(); conf(o.url==='about:blank', modo+': depois do ✕, Voltar sai (sem tela fantasma)');
    // entrar de novo depois de voltar funciona
    await pg.goto(base); await pg.waitForTimeout(400);
    await pg.click(bt); await pg.fill('#nome','Teo'); await pg.click('#btEntrar'); await pg.waitForTimeout(1200); await voltar();
    await pg.click('#btEntrar'); await pg.waitForTimeout(1200); o=await onde(); conf(o.tv, modo+': dá para começar de novo depois do Voltar');
  }
  // celular com TV: Voltar na tela do código → menu
  await pg.goto('about:blank'); await pg.goto(base); await pg.waitForTimeout(400); await pg.click('#btCel');
  let o=await voltar(); conf(o.tela==='inicio', 'Este é o celular: Voltar → menu inicial');
  conf(!erros.length, 'sem erro de JavaScript '+erros.join(' | '));
  await b.close(); server.close(); process.exitCode=falhas?1:0;
})();
