// Passo a passo do Rabisquinho: node --test rabiscolandia/teste/tour.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const T = require('../tour.js');
const pasta = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(pasta, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(pasta, 'app.js'), 'utf8');

test('três passeios, cada balão em português e inglês', () => {
  for (const q of ['livre', 'colorir', 'numeros']) {
    const l = T.PASSOS[q];
    assert.ok(l && l.length >= 6, 'passeio curto: ' + q);
    for (const p of l) { assert.ok(p.pt && p.pt.length > 10, 'sem PT'); assert.ok(p.en && p.en.length > 10, 'sem EN'); assert.ok(p.pt.length < 220, 'balão longo demais para criança: ' + p.pt); }
  }
});

test('todo balão aponta para algo que existe na tela', () => {
  for (const q of Object.keys(T.PASSOS)) for (const p of T.PASSOS[q]) {
    if (!p.alvo) continue;
    for (const m of p.alvo.matchAll(/#([A-Za-z0-9]+)/g)) assert.ok(html.includes('id="' + m[1] + '"'), q + ': falta #' + m[1]);
    for (const m of p.alvo.matchAll(/data-f="([a-z]+)"/g)) assert.ok(app.includes("botaoFerr('" + m[1] + "'"), q + ': falta a ferramenta ' + m[1]);
    for (const m of p.alvo.matchAll(/\.([a-z-]+)/g)) assert.ok(app.includes("'" + m[1] + "'") || html.includes('class="' + m[1]), q + ': falta a classe ' + m[1]);
  }
});
