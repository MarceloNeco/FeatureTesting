// Testes da música (links) e da sala da TV (mensagens): node --test purpurina/teste/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../musica.js');
const S = require('../sala.js');

test('links do YouTube e do Spotify viram fonte + referência', () => {
  assert.deepEqual(M.ler('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), { fonte: 'youtube', ref: 'v:dQw4w9WgXcQ' });
  assert.deepEqual(M.ler('https://youtu.be/dQw4w9WgXcQ?si=abc'), { fonte: 'youtube', ref: 'v:dQw4w9WgXcQ' });
  assert.deepEqual(M.ler('https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890abcdef'), { fonte: 'youtube', ref: 'l:PL1234567890abcdef' });
  assert.deepEqual(M.ler('https://www.youtube.com/shorts/dQw4w9WgXcQ'), { fonte: 'youtube', ref: 'v:dQw4w9WgXcQ' });
  assert.deepEqual(M.ler('https://open.spotify.com/intl-pt/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x'), { fonte: 'spotify', ref: 'playlist:37i9dQZF1DXcBWIGoYBM5M' });
  assert.deepEqual(M.ler('spotify:track:4uLU6hMCjMI75M1A2tKUQC'), { fonte: 'spotify', ref: 'track:4uLU6hMCjMI75M1A2tKUQC' });
  assert.equal(M.ler('https://exemplo.com/musica'), null);
  assert.equal(M.ler(''), null);
});

test('referência inválida não toca', () => {
  assert.equal(M.refValida('youtube', 'v:dQw4w9WgXcQ'), true);
  assert.equal(M.refValida('youtube', 'v:<script>'), false);
  assert.equal(M.refValida('spotify', 'user:4uLU6hMCjMI75M1A2tKUQC'), false);
  assert.equal(M.refValida('outra', 'x'), false);
});

test('sala: só passa mensagem conhecida, sem lixo', () => {
  assert.equal(S.validar(null), null);
  assert.equal(S.validar({ t: 'hackear' }), null);
  const m = S.validar({ t: 'visual', id: 'ab12<cd>', nome: '<b>Lara</b>', e: { batom: 'gloss', 'x y': 'z', obj: { a: 1 } }, ang: 450, extra: 'fora' });
  assert.equal(m.id, 'ab12cd'); assert.equal(m.nome, 'bLara/b'); assert.deepEqual(m.e, { batom: 'gloss' }); assert.equal(m.ang, 90); assert.ok(!('extra' in m));
  assert.equal(S.validar({ t: 'som', acao: 'apagar-tudo' }).acao, '');
  assert.equal(S.validar({ t: 'musica', fonte: 'youtube', ref: 'v:abc<>' }).ref, 'v:abc');
  assert.match(S.codigoNovo(), /^[A-Z]{4}$/);
});
