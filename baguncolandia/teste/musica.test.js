// Músicas de verdade (Chromium, Playwright): node baguncolandia/teste/musica.test.js
// Com internet tocam os arquivos de musicas/ (lobby e uma por rodada, sem repetir a anterior); sem internet toca a
// sintetizada; 🎵 desliga e liga.
const { chromium } = require('playwright');
const path=require('path'),http=require('http'),fs=require('fs');
const raiz=path.resolve(__dirname,'..','..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(raiz,p);if(!f.startsWith(raiz)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
let falhas=0; const conf=(c,m)=>{console.log((c?'✓ ':'✗ ')+m); if(!c) falhas++;};
(async()=>{ await new Promise(r=>server.listen(0,r)); const base='http://127.0.0.1:'+server.address().port+'/baguncolandia/'; const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const ctx=await b.newContext({viewport:{width:412,height:860},locale:'pt-BR'}); const pg=await ctx.newPage(); const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
 const pedidos=[]; pg.on('request',r=>{ if(/musicas\//.test(r.url())) pedidos.push(r.url().split('/').pop()); });
 await pg.goto(base+'?teste'); await pg.waitForTimeout(400);
 await pg.click('#btToque'); await pg.fill('#nome','Lara'); await pg.click('#btEntrar'); await pg.waitForTimeout(2500);
 let st=await pg.evaluate(()=>({arq:Som.tocandoArquivo(), tem:Som.tocando()}));
 conf(st.arq, 'tela "Quem vai jogar": toca a música de verdade ('+pedidos.join(',')+')');
 await pg.click('#localComecar'); await pg.waitForFunction(()=>window.BaguncaApp.TVApp.tv.fase==='jogando',null,{timeout:15000}); await pg.waitForTimeout(2000);
 st=await pg.evaluate(()=>({arq:Som.tocandoArquivo(), f:window.BaguncaApp.TVApp.tv.faixa}));
 conf(st.arq, 'rodada 1: toca a música de verdade (faixa '+st.f+')');
 await pg.evaluate(()=>window.BaguncaApp.TVApp.comando({acao:'parar'})); await pg.waitForTimeout(400);
 await pg.evaluate(()=>window.BaguncaApp.TVApp.comando({acao:'comecar'})); await pg.waitForFunction(()=>window.BaguncaApp.TVApp.tv.fase==='jogando',null,{timeout:15000}); await pg.waitForTimeout(2000);
 const st2=await pg.evaluate(()=>({arq:Som.tocandoArquivo(), f:window.BaguncaApp.TVApp.tv.faixa}));
 conf(st2.arq && st2.f!==st.f, 'rodada 2: outra música de verdade (faixa '+st2.f+'); arquivos pedidos: '+[...new Set(pedidos)].join(', '));
 // sem internet: a próxima rodada toca a sintetizada
 await ctx.setOffline(true);
 await pg.evaluate(()=>window.BaguncaApp.TVApp.comando({acao:'parar'})); await pg.waitForTimeout(400);
 await pg.evaluate(()=>window.BaguncaApp.TVApp.comando({acao:'comecar'})); await pg.waitForFunction(()=>window.BaguncaApp.TVApp.tv.fase==='jogando',null,{timeout:15000}); await pg.waitForTimeout(2500);
 st=await pg.evaluate(()=>({arq:Som.tocandoArquivo(), tem:Som.tocando()}));
 conf(!st.arq && st.tem, 'sem internet: toca a música sintetizada (não fica em silêncio)');
 await ctx.setOffline(false);
 await pg.click('#localMusica'); await pg.waitForTimeout(300);
 conf(!(await pg.evaluate(()=>Som.tocando())), '🎵 desliga a música');
 await pg.click('#localMusica'); await pg.waitForTimeout(1500);
 conf(await pg.evaluate(()=>Som.tocando()), '🎵 liga de novo');
 conf(!erros.length,'sem erro de JavaScript '+erros.join(' | '));
 await b.close(); server.close(); process.exitCode=falhas?1:0; })();
