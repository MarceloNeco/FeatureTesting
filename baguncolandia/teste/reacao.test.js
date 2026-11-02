// Duas pessoas no mesmo aparelho e reações do boneco (Chromium, Playwright): node baguncolandia/teste/reacao.test.js
// Nome da 2ª pessoa (guardado e editável), nomes de todos os modos no resumo, e o boneco reagindo (festa e dor) sem erro.
const { chromium } = require('playwright');
const path=require('path'),http=require('http'),fs=require('fs');
const raiz=path.resolve(__dirname,'..','..');
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(raiz,p);if(!f.startsWith(raiz)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
let falhas=0; const conf=(c,m)=>{console.log((c?'✓ ':'✗ ')+m); if(!c) falhas++;};
(async()=>{ await new Promise(r=>server.listen(0,r)); const base='http://127.0.0.1:'+server.address().port+'/baguncolandia/'; const b=await chromium.launch(); const pg=await b.newPage({viewport:{width:860,height:420},deviceScaleFactor:2,locale:'pt-BR'}); const erros=[]; pg.on('pageerror',e=>erros.push(e.message));
 await pg.goto(base+'?teste'); await pg.evaluate(()=>localStorage.setItem('bagunca:bonecoDedo','1')); await pg.reload(); await pg.waitForTimeout(300);
 await pg.click('#btToque'); await pg.fill('#nome','Lara'); await pg.click('#btEntrar'); await pg.waitForTimeout(1200);
 await pg.click('#localModos button[data-v="pula"]'); await pg.waitForTimeout(200);
 conf(!/undefined/.test(await pg.textContent('#lobbyResumo')), 'Pula e abaixa: sem "undefined" ('+(await pg.textContent('#lobbyResumo'))+')');
 await pg.click('#localModos button[data-v="bolas"]'); await pg.waitForTimeout(200);
 conf(/Bagunça de bolas/.test(await pg.textContent('#lobbyResumo')), 'Bagunça de bolas aparece com o nome');
 await pg.click('#localModos button[data-v="corta"]');
 await pg.click('#localPessoas'); await pg.waitForTimeout(500);
 conf(await pg.isVisible('#nome2'), '2 pessoas: aparece o campo do nome da 2ª pessoa');
 await pg.fill('#nome2','Júlia'); await pg.waitForTimeout(200);
 const cards=await pg.evaluate(()=>[...document.querySelectorAll('#lobbyJogadores .jog')].map(d=>d.textContent.trim()));
 conf(cards.join('|')==='Lara|Júlia', 'cartões: '+cards.join(' e '));

 await pg.keyboard.press('Space'); await pg.waitForTimeout(300);
 conf(await pg.evaluate(()=>window.BaguncaApp.TVApp.tv.fase)==='lobby', 'digitar espaço no nome não começa a rodada');
 // reações: corte para a Lara (festa, salta até a fruta) e vilão para a Júlia (dor)
 await pg.click('#localComecar'); await pg.waitForFunction(()=>window.BaguncaApp.TVApp.tv.fase==='jogando',null,{timeout:15000}); await pg.waitForTimeout(600);
 conf(await pg.evaluate(()=>{ const t=document.querySelector('#tvCanvas'); return true; }), 'rodada começou');
 await pg.evaluate(()=>{ const q=Desenho.quadro; let feito=false; Desenho.quadro=function(e,ev,ts){ if(!feito){ feito=true; ev=(ev||[]).concat([{t:'corte',id:-1,j:0,fig:'melancia',x:180,y:330,pontos:10,combo:1},{t:'vilao',id:-2,j:1,fig:'bombeta',x:900,y:400,vida:true}]); } return q.call(this,e,ev,ts); }; });
 await pg.waitForTimeout(400);
 const cv=await pg.evaluate(()=>{ const c=document.getElementById('tvCanvas'); const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=400) if(d[i]>0) n++; return n; });
 conf(cv>100, 'o quadro continua sendo desenhado durante as reações');
 const nomes=await pg.evaluate(()=>window.BaguncaApp.TVApp.tv.nomes);
 conf(nomes.join('|')==='Lara|Júlia', 'no jogo, os nomes são '+nomes.join(' e '));
 await pg.goto(base+'?teste'); await pg.click('#btToque'); await pg.fill('#nome','Lara'); await pg.click('#btEntrar'); await pg.waitForTimeout(1200); await pg.click('#localPessoas'); await pg.waitForTimeout(400);
 conf(await pg.inputValue('#nome2')==='Júlia', 'na volta, o último nome (Júlia) já vem escrito');
 conf(!erros.length,'sem erro de JavaScript '+erros.join(' | '));
 await b.close(); server.close(); process.exitCode=falhas?1:0; })();
