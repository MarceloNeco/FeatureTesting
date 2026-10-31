// Foto de prova: cada cenário com um item de cada tipo posto exatamente no lugar certo.
// Rodar de FeatureTesting/: node peluqueria/teste/galeria.js  →  /tmp/peluqueria-galeria.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const pasta = path.resolve(__dirname, '..');
const C = JSON.parse(fs.readFileSync(path.join(pasta, 'cenarios/cenarios.json'), 'utf8'));
const I = JSON.parse(fs.readFileSync(path.join(pasta, 'itens/itens.json'), 'utf8'));
const dataUrl = f => 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(pasta, f)).toString('base64');
const POR_TIPO = { cabeca: ['coroa', 'cartola', 'fone', 'laco', 'bone', 'chapeu-pirata', 'capacete-viking'], olhos: ['oculos-escuros', 'peruca-oculos'], nariz: ['nariz-palhaco'], boca: ['bigode', 'boca-tubarao'], mao: ['sorvete', 'balao', 'pirulito', 'microfone'], orelha: ['flor', 'brinco'], ombro: ['papagaio', 'passarinho'], pescoco: ['gravata-borboleta', 'medalha'] };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
  const quadros = [];
  C.forEach((c, k) => {
    // dois quadros por cenário: (cabeça + nariz) e (olhos + boca), girando os itens pelo índice
    const a = [POR_TIPO.cabeca[k % 7], POR_TIPO.nariz[0]], d = [POR_TIPO.olhos[k % 2], POR_TIPO.boca[k % 2]];
    const lado = [POR_TIPO.mao[k % 4], POR_TIPO.ombro[k % 2], POR_TIPO.pescoco[k % 2]].concat(c.lugares.orelha ? [POR_TIPO.orelha[k % 2]] : []);
    quadros.push({ c, itens: a }, { c, itens: d }, { c, itens: lado });
  });
  const html = `<body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(6,1fr);gap:4px">` + quadros.map(q => {
    const its = q.itens.map(id => { const it = I.find(i => i.id === id), L = q.c.lugares[it.lugar]; const w = L.tam * (it.escala || 1) * 100;
      return `<img src="${dataUrl('itens/' + it.arquivo)}" style="position:absolute;width:${w}%;left:${L.x * 100}%;top:${L.y * 100}%;transform:translate(-${it.encaixe.x * 100}%,-${it.encaixe.y * 100}%)">`; }).join('');
    return `<div style="position:relative;aspect-ratio:1"><img src="${dataUrl('cenarios/' + q.c.arquivo)}" style="width:100%;display:block">${its}</div>`;
  }).join('') + '</body>';
  await p.setContent(html); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/peluqueria-galeria.png', fullPage: true });
  await b.close(); console.log('/tmp/peluqueria-galeria.png');
})();
