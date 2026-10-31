/* Bagunçolândia — o boneco desenha com qualquer configuração (todas as cabeças, inclusive as da turma,
   roupas, acessórios, cabelos e valores estranhos vindos de versões antigas salvas no celular).
   Roda em Node com um canvas de mentira: só confere que nenhuma combinação dá erro. */
const test = require('node:test'); const assert = require('node:assert');
const vm = require('vm'); const fs = require('fs'); const path = require('path');
const raiz = path.join(__dirname, '..');
function montar() {
  const g = {}; g.self = g; g.window = g; vm.createContext(g);
  vm.runInContext(fs.readFileSync(path.join(raiz, 'figuras.js'), 'utf8'), g);
  vm.runInContext(fs.readFileSync(path.join(raiz, 'boneco.js'), 'utf8'), g);
  return g;
}
function ctxFalso() {
  const objeto = () => new Proxy({}, { get: (t, k) => (k in t ? t[k] : (typeof k === 'string' ? () => objeto() : undefined)), set: (t, k, v) => { t[k] = v; return true; } });
  const c = objeto(); c.measureText = () => ({ width: 10 }); return c;
}
test('boneco: todas as cabeças (turma incluída), roupas, acessórios e cabelos desenham sem erro', () => {
  const g = montar(); const B = g.Boneco, F = g.Figuras;
  const cabecas = B.CABECAS.concat(F.lista().filter(f => f.papel === 'heroi').map(f => f.id));
  assert.ok(cabecas.length > 20, 'cabeças: ' + cabecas.length);
  let n = 0;
  for (const cabeca of cabecas) for (const roupa of B.ROUPAS) for (const acessorio of B.ACESSORIOS) for (const cabelo of B.CABELOS) {
    const cfg = { cabeca, roupa, acessorio, cabelo, pele: '#8d5524', corCabelo: '#4fc3f7', cor: '#ffd166' };
    B.corpoEmPe(ctxFalso(), cfg, 320, { ts: 1234.5, bD: 0.7, bE: 0.2, balanco: 0.3, andando: true });
    B.cabeca(ctxFalso(), cfg, 100, 0); n++;
  }
  assert.ok(n > 1000, 'combinações: ' + n);
});
test('boneco: configuração estranha (de versão antiga) não dá erro', () => {
  const g = montar(); const B = g.Boneco;
  for (const cfg of [{}, null, 'menina', { cabeca: 'naoExiste' }, { cabeca: 5 }, { cabelo: 'maria' }, { corCabelo: 'blue' }, { pele: undefined }, { cor: null }, { sapato: 123 }, { cabeca: 'liliLimao', roupa: 'xyz' }]) {
    B.corpoEmPe(ctxFalso(), cfg, 320, { ts: 99 }); B.cabeca(ctxFalso(), cfg, 100, 50);
  }
});
