// Service worker da Peluqueria: node --test peluqueria/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const codigo = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function montar(rede) {
  const guardado = new Map(), ouvintes = {};
  const cache = { put: async (req, resp) => { if (resp.status === 206) throw new TypeError('Partial response'); guardado.set(typeof req === 'string' ? req : req.url, resp); }, add: async () => {} };
  const self = { addEventListener: (t, f) => { ouvintes[t] = f; }, skipWaiting() {}, clients: { claim() {} }, location: { origin: 'https://x.test' } };
  const ctx = {
    self, location: self.location, URL, Promise, setTimeout, clearTimeout, console,
    caches: { open: async () => cache, match: async (req) => guardado.get(typeof req === 'string' ? req : req.url), keys: async () => [], delete: async () => true },
    fetch: rede, Response: { error: () => ({ status: 0 }) }, Request: function (u, o) { this.url = u; this.headers = new Map(); Object.assign(this, o || {}); }
  };
  vm.createContext(ctx); vm.runInContext(codigo, ctx);
  return { ouvintes, guardado };
}
function resposta(status) { const r = { status, ok: status >= 200 && status < 300, clone() { return resposta(status); } }; return r; }

test('MP3 pedido em pedaços (206) fica guardado inteiro para tocar sem internet', async () => {
  const pedidos = [];
  const { ouvintes, guardado } = montar(async (req) => { const rg = req.headers && req.headers.get && req.headers.get('range'); pedidos.push(rg || 'inteiro'); return resposta(rg ? 206 : 200); });
  const url = 'https://x.test/peluqueria/musicas/festa.mp3';
  let resp;
  ouvintes.fetch({ request: { method: 'GET', url, mode: 'no-cors', headers: new Map([['range', 'bytes=0-']]) }, respondWith: p => { resp = p; } });
  await resp; await new Promise(r => setTimeout(r, 20));
  assert.ok(guardado.has(url), 'MP3 não ficou no cache; pedidos: ' + pedidos.join(','));
  assert.equal(guardado.get(url).status, 200);
});
