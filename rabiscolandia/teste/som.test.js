// Som da Rabiscolândia: node --test rabiscolandia/teste/som.test.js (da raiz do repositório)
const test = require('node:test');
const assert = require('node:assert/strict');
const caminho = require.resolve('../som.js');

// carrega uma cópia nova do módulo (cada teste começa do zero)
function novo() { delete require.cache[caminho]; return require('../som.js'); }

const API = ['iniciar', 'musica', 'musicaLigada', 'proxima', 'nomeAtual', 'efeitos', 'efeitosLigados', 'efeito'];

test('carrega no Node e tem a API completa', () => {
  const S = novo();
  API.forEach((f) => assert.equal(typeof S[f], 'function', f));
});

test('sem AudioContext: tudo funciona calado, sem erro', () => {
  assert.equal(typeof globalThis.AudioContext, 'undefined');
  const S = novo();
  assert.doesNotThrow(() => {
    S.iniciar();
    S.musica(true); S.proxima(); S.proxima();
    S.efeitos(false); S.efeitos(true);
    S.EFEITOS.concat(['nao-existe', '', undefined, null, 42, 'toString', '__proto__']).forEach((n) => S.efeito(n));
    S.efeito('cor', 3); S.efeito('cor', -7.5); S.efeito('cor', NaN);
    S.musica(false);
  });
  assert.equal(S.musicaLigada(), false);
  assert.equal(S.nomeAtual(), '');           // nada tocando
  S.musica(true); assert.equal(S.musicaLigada(), true); assert.equal(S.nomeAtual(), ''); S.musica(false);
  S.efeitos(false); assert.equal(S.efeitosLigados(), false);
  S.efeitos(true); assert.equal(S.efeitosLigados(), true);
});

test('pelo menos 4 músicas, com nome, clima, 90–120 bpm, estrofe e refrão bem escritos', () => {
  const S = novo();
  assert.ok(S.MUSICAS.length >= 4);
  const nomes = new Set();
  S.MUSICAS.forEach((m) => {
    assert.ok(typeof m.nome === 'string' && m.nome.trim().length > 0);
    assert.ok(!nomes.has(m.nome), 'nome repetido: ' + m.nome); nomes.add(m.nome);
    assert.ok(m.clima && m.clima.length > 0);
    assert.ok(m.bpm >= 90 && m.bpm <= 120, m.nome + ' bpm ' + m.bpm);
    ['A', 'B'].forEach((p) => {
      assert.equal(m[p].acordes.length, 8, m.nome + ' ' + p);
      assert.equal(m[p].mel.length, 8, m.nome + ' ' + p);
      m[p].mel.forEach((bar, i) => {   // cada compasso soma exatamente o tamanho do compasso
        const soma = bar.split(' ').reduce((s, tk) => { const [g, d] = tk.split(':'); assert.ok(g === 'r' || Number.isInteger(+g), tk); return s + +d; }, 0);
        assert.equal(soma, m.tempos * 2, `${m.nome} ${p} compasso ${i + 1}: "${bar}"`);
      });
    });
    assert.equal(m.ponte.length, 4);
  });
});

// Um AudioContext de mentira: confere que toda nota tem frequência, volume e tempo válidos
function falsoAudio() {
  const reg = { inicios: [], nos: 0, erros: [] };
  const confere = (v, oque) => { if (!Number.isFinite(v)) reg.erros.push(oque + '=' + v); };
  const param = (nome) => ({
    value: 0,
    setValueAtTime(v, t) { confere(v, nome); confere(t, nome + '.t'); },
    exponentialRampToValueAtTime(v, t) { confere(v, nome); confere(t, nome + '.t'); if (v <= 0) reg.erros.push(nome + ' rampa exp ≤ 0'); },
    linearRampToValueAtTime(v, t) { confere(v, nome); confere(t, nome + '.t'); },
    setTargetAtTime(v, t) { confere(v, nome); confere(t, nome + '.t'); }
  });
  const no = (extra) => { reg.nos++; return Object.assign({ connect() {}, disconnect() {} }, extra); };
  class Falso {
    constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running'; this.destination = no({}); reg.ac = this; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    createGain() { return no({ gain: param('gain') }); }
    createOscillator() { return no({ type: 'sine', frequency: param('frequency'), start(t) { confere(t, 'start'); reg.inicios.push(t); }, stop() {} }); }
    createBiquadFilter() { return no({ type: 'lowpass', frequency: param('filtro'), Q: param('Q') }); }
    createBufferSource() { return no({ buffer: null, start(t) { confere(t, 'start'); reg.inicios.push(t); }, stop() {} }); }
    createBuffer(c, n) { const d = new Float32Array(n); return { getChannelData: () => d }; }
    createDynamicsCompressor() { return no({ threshold: param('th'), knee: param('kn'), ratio: param('ra'), attack: param('at'), release: param('re') }); }
  }
  return { Falso, reg };
}

test('com áudio: efeitos e as músicas inteiras tocam sem nota inválida, uma depois da outra', (t) => {
  const { Falso, reg } = falsoAudio();
  globalThis.AudioContext = Falso;
  t.mock.timers.enable({ apis: ['setInterval', 'setTimeout'] });
  try {
    const S = novo();
    S.iniciar();
    S.EFEITOS.forEach((n) => { const antes = reg.inicios.length; S.efeito(n); assert.ok(reg.inicios.length > antes, 'efeito mudo: ' + n); });
    S.efeitos(false); let antes = reg.inicios.length; S.efeito('toque'); assert.equal(reg.inicios.length, antes); S.efeitos(true);

    S.musica(true);
    const primeira = S.nomeAtual();
    assert.equal(primeira, S.MUSICAS[0].nome);
    // anda o relógio de 25 em 25 ms por ~12 minutos de música: passa por todas as faixas
    const vistas = new Set([primeira]);
    for (let i = 0; i < 12 * 60 * 40; i++) { reg.ac.currentTime += 0.025; t.mock.timers.tick(25); vistas.add(S.nomeAtual()); }
    assert.equal(vistas.size, S.MUSICAS.length, 'tocou: ' + [...vistas].join(', '));
    assert.deepEqual(reg.erros, []);
    assert.ok(reg.inicios.length > 5000, 'notas: ' + reg.inicios.length);
    // as notas são agendadas um pouco antes, nunca lá na frente
    assert.ok(reg.inicios.reduce((a, b) => Math.max(a, b), 0) <= reg.ac.currentTime + 2.5);

    // pular música começa a próxima; desligar para de agendar
    const agora = S.nomeAtual(); S.proxima(); assert.notEqual(S.nomeAtual(), agora);
    S.musica(false); assert.equal(S.nomeAtual(), '');
    antes = reg.inicios.length;
    for (let i = 0; i < 40; i++) { reg.ac.currentTime += 0.025; t.mock.timers.tick(25); }
    assert.equal(reg.inicios.length, antes);
  } finally {
    delete globalThis.AudioContext;
  }
});
