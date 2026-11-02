// ✨ Foto de cinema com IA (ia-foto.js): partes sem tela
const test = require('node:test');
const assert = require('node:assert/strict');
const IA = require('../ia-foto.js');

test('o pedido descreve o mesmo personagem, renderizado, e nunca uma pessoa real', () => {
  const p = IA.prompt('girl, wavy hair, purple rectangle glasses');
  assert.match(p, /3D animated feature film/); assert.match(p, /Keep EXACTLY the same character design/); assert.match(p, /glasses frame shape/);
  assert.match(p, /child/); assert.match(p, /No text/); assert.match(p, /purple rectangle glasses/);
  assert.ok(!/photo of|real person|likeness/i.test(IA.prompt('')), 'não pede semelhança com pessoa real');
});

test('chave: confere o formato de cada provedor', () => {
  assert.ok(IA.chaveValida('gemini', 'AIzaSyABCDEFGHIJKLMNOPQRSTUVWX'));
  assert.ok(IA.chaveValida('gemini', 'AQ.ABCDEFGHIJKLMNOPQRSTUVWX12'));
  assert.ok(!IA.chaveValida('gemini', 'sk-ABCDEFGHIJKLMNOPQRSTUVWX'));
  assert.ok(IA.chaveValida('openai', 'sk-proj-ABCDEFGHIJKLMNOPQRSTUVWX'));
  assert.ok(!IA.chaveValida('openai', 'sk-curta'));
  assert.ok(!IA.chaveValida('openai', 'sk-com espaco no meio da chave 123'));
});

test('Gemini: pedido com a imagem do desenho e leitura da resposta', () => {
  const p = IA.pedidoGemini('AIzaXYZ', 'QUJD', 'faça');
  assert.match(p.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-[\w.-]+-image:generateContent$/);
  assert.equal(p.opcoes.headers['x-goog-api-key'], 'AIzaXYZ'); assert.ok(!/key=/.test(p.url), 'a chave não vai no endereço');
  const b = JSON.parse(p.opcoes.body);
  assert.equal(b.contents[0].parts[1].inline_data.data, 'QUJD'); assert.deepEqual(b.generationConfig.responseModalities, ['IMAGE', 'TEXT']);
  assert.deepEqual(IA.lerGemini({ candidates: [{ content: { parts: [{ text: 'ok' }, { inlineData: { mimeType: 'image/png', data: 'AAA' } }] } }] }), { base64: 'AAA', tipo: 'image/png' });
  assert.throws(() => IA.lerGemini({ promptFeedback: { blockReason: 'SAFETY' } }), (e) => e.message === 'sem-imagem' && e.motivo === 'SAFETY');
});

test('OpenAI: leitura da resposta da edição de imagem', () => {
  assert.deepEqual(IA.lerOpenAI({ data: [{ b64_json: 'BBB' }] }), { base64: 'BBB', tipo: 'image/png' });
  assert.throws(() => IA.lerOpenAI({ error: { code: 'moderation_blocked' } }), (e) => e.motivo === 'moderation_blocked');
});
