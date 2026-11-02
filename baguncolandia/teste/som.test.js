// Som e tela "Quem vai jogar" dos modos sem TV (Chromium, Playwright): node baguncolandia/teste/som.test.js
// ⏸ só na rodada; 6 modos numa fileira; 2 pessoas = dois bonecos e explicação; música em toda rodada, outra a
// cada rodada; 🎵 e 🔊 funcionam e ficam guardados; todas as 13 músicas tocam.
const { chromium } = require('playwright');
const path=require('path'),http=require('http'),fs=require('fs');
const raiz=path.resolve(__dirname,'..','..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(raiz,p);if(!f.startsWith(raiz)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
let falhas=0; const conf=(c,m)=>{console.log((c?'✓ ':'✗ ')+m); if(!c) falhas++;};
(async()=>{ await new Promise(r=>server.listen(0,r)); const base='http://127.0.0.1:'+server.address().port+'/baguncolandia/'; const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const pg=await b.newPage({viewport:{width:412,height:860},deviceScaleFactor:2,locale:'pt-BR'}); const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
 await pg.goto(base+'?teste'); await pg.waitForTimeout(400);
 await pg.evaluate(()=>{ window.musicas=[]; const m=Som.musica; Som.musica=function(l,f){ window.musicas.push(l?f:'off'); return m.apply(this,arguments); }; });
 await pg.click('#btToque'); await pg.fill('#nome','Lara'); await pg.click('#btEntrar'); await pg.waitForTimeout(1500);
 const vis=id=>pg.evaluate(id=>{const e=document.getElementById(id); const r=e.getBoundingClientRect(); return r.width>0 && getComputedStyle(e).display!=='none';},id);
 conf(!(await vis('localPausa')), 'lobby: ⏸ escondido');
 conf(await vis('localMudo') && await vis('localMusica'), 'lobby: 🔊 e 🎵 à vista');
 const linhas=await pg.evaluate(()=>{const t=[...document.querySelectorAll('#localModos button')].map(b=>Math.round(b.getBoundingClientRect().top)); return new Set(t).size;});
 conf(linhas===1, 'os 6 modos numa fileira só ('+linhas+')');
 
 await pg.click('#localPessoas'); await pg.waitForTimeout(500);
 const l2=await pg.evaluate(()=>({bonecos:document.querySelectorAll('#lobbyJogadores canvas').length, dica:document.getElementById('lobbyDica').textContent}));
 conf(l2.bonecos===2 && /metade/.test(l2.dica), '2 pessoas: dois bonecos e a explicação ('+JSON.stringify(l2)+')');
 const barra=await pg.evaluate(()=>{const ids=['localPessoas','localBoneco','localComecar']; const t=ids.map(i=>{const r=document.getElementById(i).getBoundingClientRect(); return r.top+r.height/2;}); return Math.max(...t)-Math.min(...t)<12?1:2;});
 conf(barra===1, '👥, 🧍 e Começar na mesma linha');
 
 await pg.click('#localComecar'); await pg.waitForFunction(()=>window.BaguncaApp.TVApp.tv.fase==='jogando',null,{timeout:15000}); await pg.waitForTimeout(800);
 conf(await vis('localPausa') && await vis('localMudo'), 'jogando: ⏸, 🔊 e 🎵 à vista');
 
 const f1=await pg.evaluate(()=>window.BaguncaApp.TVApp.tv.faixa);
 await pg.evaluate(()=>window.BaguncaApp.TVApp.comando({acao:'parar'})); await pg.waitForTimeout(500);
 await pg.evaluate(()=>window.BaguncaApp.TVApp.comando({acao:'comecar'})); await pg.waitForFunction(()=>window.BaguncaApp.TVApp.tv.fase==='jogando',null,{timeout:15000});
 const f2=await pg.evaluate(()=>window.BaguncaApp.TVApp.tv.faixa);
 const ms=await pg.evaluate(()=>window.musicas);
 conf(f1>0 && f2>0 && f1!==f2 && ms.includes(f1) && ms.includes(f2), 'música toca no jogo e muda na rodada seguinte ('+JSON.stringify(ms)+')');
 await pg.click('#localMusica'); await pg.waitForTimeout(200);
 let st=await pg.evaluate(()=>({sem:Som.semMusica(), mudo:Som.mudo(), ls:localStorage.getItem('bagunca:semMusica')}));
 conf(st.sem && !st.mudo && st.ls==='1', '🎵 desliga só a música e fica guardado');
 await pg.click('#localMudo'); await pg.waitForTimeout(200);
 st=await pg.evaluate(()=>({mudo:Som.mudo(), txt:document.getElementById('localMudo').textContent}));
 conf(st.mudo && st.txt==='🔇', '🔊 vira 🔇 e deixa tudo mudo');
 
 await pg.reload(); await pg.waitForTimeout(400);
 st=await pg.evaluate(()=>({mudo:Som.mudo(), sem:Som.semMusica()}));
 conf(st.mudo && st.sem, 'depois de recarregar, a escolha continua');
 const v=await pg.evaluate(()=>[window.BaguncaApp.Bagunca.validar({t:'cmd',id:'abc12345',acao:'som',semSom:true,semMusica:'x'})]);
 conf(v[0] && v[0].semSom===true && v[0].semMusica===false, 'mensagem de som conferida na TV');
 const tocou=await pg.evaluate(async()=>{ Som.mudo(false); Som.semMusica(false); Som.iniciar(); const out=[]; for(let f=0; f<Som.FAIXAS; f++){ Som.musica(true,f); await new Promise(r=>setTimeout(r,900)); out.push(Som.tocandoArquivo()?1:0); } Som.musica(false); return out; });
 conf(tocou.length===13 && tocou.every(x=>x===1), 'todas as '+tocou.length+' músicas tocam ('+tocou.join('')+')');
 conf(!erros.length,'sem erro de JavaScript '+erros.join(' | '));
 await b.close(); server.close(); process.exitCode=falhas?1:0; })();
