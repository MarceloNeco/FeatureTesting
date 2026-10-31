# Peluqueria — plano de implementação (fase 1, v0.1.0)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jogo "cair e pausar com pontos" no celular (e na TV só com o controle), 12 cenários e 12 itens em vetor, música sintetizada, instalável e sem internet, dentro de `FeatureTesting/peluqueria/`.

**Architecture:** Uma página (`peluqueria/index.html`) com telas Início → Contagem → Rodada → Fim. `jogo.js` é o motor puro (UMD como o da Bagunçolândia: `module.exports` no Node, `window.Peluqueria` no navegador) com o tempo passado por quem chama; `app.js` faz o laço de quadros, toques e teclado; `desenho.js` pinta no canvas; `cenarios.js`/`itens.js` carregam e validam os catálogos JSON; `som.js`/`voz.js` dão música e fala.

**Tech Stack:** HTML/CSS/JS puros (sem build), Canvas 2D, WebAudio, speechSynthesis, service worker. Testes: `node --test` e Playwright/Chromium (já instalados; não instalar de novo).

**Spec:** `docs/superpowers/specs/2026-10-31-peluqueria-design.md`

## Global Constraints

- Tudo em `FeatureTesting/peluqueria/`; nada da Bagunçolândia é alterado (só copiado: `fontes/`, padrões de `sw.js`, `voz.js`, `teste/pagina.test.js`).
- CSP exata (index e marcar): `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`. Nenhum `<script>` inline nem `style=""` no HTML.
- Dado de fora nunca vira HTML: `textContent` sempre.
- PT e EN em todo texto (`data-t="pt|en"` no HTML; `T(pt, en)` no JS).
- Versão `0.1.0` igual em `app.js` (`APP_VERSION`), `sw.js` (`VERSAO`) e `versoes.json` (com `"data": "31/Out/2026"` e `"hora"` de Brasília).
- Cache `peluqueria-v0.1.0`; o SW só apaga caches que começam com `peluqueria-`.
- Paleta: `#0b0a1f → #1a1446`, lima `#c6ff3d`, rosa `#ff4fa3`, ciano `#3ee8ff`, dourado `#ffd166`; fonte Fredoka.
- Alvos de toque ≥ 44 px; 320 px sem rolagem lateral; `prefers-reduced-motion` respeitado.
- `localStorage` só com a chave `peluqueria-recorde` (recordes por nível) e `peluqueria-pref` (nível, língua, som, minhas imagens).
- Repositório público: nenhuma foto real, nenhum dado pessoal.
- Commits terminam com as linhas de coautoria da sessão.

## Review Focus

1. **Toque duplo / toque durante o resultado** → o segundo toque nos primeiros 0,4 s é ignorado e não pula a próxima queda; toque com o jogo pausado não para o item. Teste na Task 4 (`pagina.test.js`: "toque duplo não pula queda").
2. **`meus/cenarios.json` quebrado** (JSON inválido, arquivo ausente, entrada maliciosa com `../`) → o jogo abre normalmente, só com o catálogo do jogo, e o interruptor "Minhas imagens" não aparece. Testes na Task 3 (`carregar` com JSON inválido) e Task 4 (página com `meus/` inválido via rota falsa).
3. **App em segundo plano no meio da queda** (trocar de app, apagar a tela) → o jogo pausa sozinho (`visibilitychange`) e não conta LONGE pelo tempo parado; `dt` de cada quadro é limitado a 0,1 s. Teste na Task 4 ("visibilidade escondida pausa").
4. **Girar o celular durante a rodada** → o canvas se redimensiona e o item continua no mesmo ponto da imagem (coordenadas da imagem, não da tela). Teste na Task 4 (viewport 390×844 → 844×390 no meio da queda, parar e ainda dar PERFEITO).
5. **Navegador sem `speechSynthesis` ou sem WebAudio** → o jogo segue com a legenda grande e sem som, sem erro no console. Teste na Task 5 (página com `speechSynthesis` e `AudioContext` apagados antes de carregar).

---

### Task 1: Pasta base, página, estilo, PWA e versão

**Files:**
- Create: `peluqueria/index.html`, `peluqueria/estilo.css`, `peluqueria/app.js` (só `APP_VERSION`, `APP_UPDATED`, `T()`, `tela(id)`, troca PT|EN), `peluqueria/sw.js`, `peluqueria/manifest.webmanifest`, `peluqueria/versoes.json`, `peluqueria/icone-192.png`, `peluqueria/icone-512.png`, `peluqueria/fontes/` (cópia de `baguncolandia/fontes/`)
- Test: `peluqueria/teste/arquivos.test.js`

**Interfaces:**
- Produces: telas `#inicio`, `#contagem`, `#rodada`, `#fim` (classe `tela`, a visível com `ativa`); `#inicio` tem `data-recurso="peluqueria"`; botões `#btCrianca #btNormal #btMaluco #btJogar #btLingua #btSom #btAjuda #btMinhas` (este com `hidden`), `#btPausa`, `#btSeguir` (▶ grande da pausa), `#btDeNovo`, `#btInicio`; `<canvas id="palco">`; `#aviso` com `aria-live="polite"`; `#ver` (versão).
- Produces (global): `PeluqueriaApp.tela(id)`, `PeluqueriaApp.T(pt, en)`, `PeluqueriaApp.lingua` (`'pt'|'en'`).
- `index.html` carrega, nesta ordem: `jogo.js, cenarios.js, itens.js, desenho.js, som.js, voz.js, ../recursos.js (data-app="feature-tester"), app.js`, e registra o `sw.js` a partir de `app.js`.

- [ ] **Step 1: Write the failing test** `teste/arquivos.test.js`:
  - `versão igual nos três lugares`: lê `app.js` (`/APP_VERSION = '([\d.]+)'/`), `sw.js` (`/VERSAO = '([\d.]+)'/`) e `versoes.json` (`versoes[0].versao`); os três `=== '0.1.0'`; `versoes[0]` tem `data`, `hora`, `pt` e `en`.
  - `sw.js guarda todos os arquivos que existem`: cada item de `ARQUIVOS` (exceto `'./'` e `'../recursos.js'`) existe em disco; e todo `.js`, `.css`, `.html`, `.json`, `.svg`, `.png`, `.woff2` da pasta (fora `teste/`, `meus/` imagens, `musicas/*.mp3`) está em `ARQUIVOS`.
  - `CSP sem inline`: `index.html` contém a CSP exata das Global Constraints; não tem `<script>` sem `src`, nem `style="`, nem `onclick=`.
- [ ] **Step 2: Run** `node --test peluqueria/teste/` — Expected: FAIL (arquivos não existem).
- [ ] **Step 3: Create the files.** `sw.js` segue o da Bagunçolândia trocando o prefixo para `peluqueria-v` e a regra de pesado para `/\.(woff2|png|webp|jpg|jpeg|svg|mp3)$/i`; os MP3 não entram em `ARQUIVOS`. Ícones: desenhar um SVG (peruca rosa caindo sobre um círculo lima no fundo noite) e gerar os PNGs com o Chromium (`page.screenshot`) — o SVG de origem não precisa ficar na pasta. `manifest.webmanifest`: `name` "Peluqueria", `start_url` `./`, `display` `standalone`, `background_color`/`theme_color` `#0b0a1f`.
- [ ] **Step 4: Run** `node --test peluqueria/teste/` — Expected: PASS. Abrir a página no Chromium e conferir que não há erro no console.
- [ ] **Step 5: Commit** `Peluqueria: pasta base, página, PWA e versão 0.1.0`.

### Task 2: Motor puro `jogo.js`

**Files:**
- Create: `peluqueria/jogo.js`
- Test: `peluqueria/teste/jogo.test.js`

**Interfaces:**
- Produces (todas puras; coordenadas em fração da imagem):
  - `Peluqueria.NIVEIS = { crianca: { vel: 0.22, amp: 0, per: 0, desloc: 0, giro: false, tol: 1.5 }, normal: { vel: 0.32, amp: 0.08, per: 2.2, desloc: 0, giro: false, tol: 1.0 }, maluco: { vel: 0.42, amp: 0.15, per: 1.6, desloc: 0.08, giro: true, tol: 0.8 } }`; `GIRO = { amp: 40, per: 4/3 }` (≈120 °/s); `LIMITES = { PERFEITO: 0.03, BOM: 0.08, QUASE: 0.15 }`; `BASE = { PERFEITO: 100, BOM: 60, QUASE: 30, LONGE: 0 }`; `MULTS = [1, 1.5, 2, 2.5, 3]`; `QUEDAS = 10`; `TOPO = -0.25`, `FUNDO = 1.25` (y do encaixe ao nascer e ao sumir).
  - `Peluqueria.aleatorio(semente: number) → () => number` (mulberry32).
  - `Peluqueria.sortear(cenarios, itens, n, rnd) → [{ cenario, item, lugar }]` — sem repetir cenário nem item seguidos; só pares em que `cenario.lugares[item.lugar]` existe.
  - `Peluqueria.posicao(queda, nivel, i, t) → { x, y, rot }` — `y = TOPO + vel·(1 + 0.05·i)·t`; `x = lugar.x + desloc·queda.d + amp·sin(2π t/per + queda.fase)` (Criança: `x = lugar.x`); `rot = giro ? 40·sin(2π t/(4/3) + queda.fase) : lugar.rot`. `queda.fase` (0..2π) e `queda.d` (−1..1) são sorteados em `criarRodada`.
  - `Peluqueria.distancia(pos, lugar, cenario) → number` — `hypot((pos.x−lugar.x)·largura, (pos.y−lugar.y)·altura) / min(largura, altura)`.
  - `Peluqueria.pontuar(d, rotErro, nivel) → 'PERFEITO'|'BOM'|'QUASE'|'LONGE'` — compara `d / tol` com `LIMITES`; no Maluco, `|rotErro| > 25` cai um degrau.
  - `Peluqueria.criarRodada({ nivel, cenarios, itens, semente }) → estado` com `{ nivel, quedas, i: 0, t: 0, fase: 'caindo', pontos: 0, combo: 0, mult: 1, resultados: [] }`.
  - `Peluqueria.avancar(estado, dt)` — soma `t` só em `'caindo'`; se `y > FUNDO`, registra LONGE e passa `fase` a `'parado'`.
  - `Peluqueria.parar(estado) → { categoria, pontos, distancia, mult } | null` — `null` se `fase !== 'caindo'`; PERFEITO/BOM sobem `combo` e `mult = MULTS[min(combo−1, 4)]`; QUASE/LONGE zeram (`mult = 1`); `pontos = round(BASE × mult)`; empurra em `resultados`; `fase = 'parado'`.
  - `Peluqueria.proxima(estado)` — `i++`, `t = 0`, `fase = 'caindo'`, ou `fase = 'fim'` depois da 10ª.
  - `Peluqueria.estrelas(estado) → 0..3` — PERFEITO+BOM: ≥7 → 3, 4–6 → 2, 1–3 → 1, 0 → 0.
  - `Peluqueria.validarCenario(obj) → objeto limpo | null`, `Peluqueria.validarItem(obj) → objeto limpo | null` — regras da spec §9: `id` `/^[a-z0-9-]{1,30}$/`; `arquivo` `/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,60}\.(svg|png|jpe?g|webp)$/` e sem `..`; `nome` texto ou `{pt,en}` até 30; `x`,`y` 0–1; `tam` 0,03–1; `rot` −45–45; `largura`/`altura` 1–8000; `lugares` só `cabeca|olhos|nariz|boca` e ao menos um; item `lugar` um dos quatro e `encaixe.x/y` 0–1.

- [ ] **Step 1: Write the failing tests** (cenário de teste 1000×1000 com os quatro lugares; item `coroa` em `cabeca`):
  - `limites das categorias`: `pontuar(0.03,0,'normal')==='PERFEITO'`, `pontuar(0.0301,0,'normal')==='BOM'`, `0.08→BOM`, `0.0801→QUASE`, `0.15→QUASE`, `0.1501→LONGE`; `pontuar(0.045,0,'crianca')==='PERFEITO'`; `pontuar(0.025,0,'maluco')==='BOM'`.
  - `giro derruba um degrau no Maluco`: `pontuar(0,26,'maluco')==='BOM'`, `pontuar(0,25,'maluco')==='PERFEITO'`, `pontuar(0.1,30,'maluco')==='LONGE'`, `pontuar(0,90,'normal')==='PERFEITO'`.
  - `Criança parada na hora certa dá PERFEITO`: rodada Criança; `avancar(e, (lugar.y − TOPO)/0.22)`; `parar(e).categoria==='PERFEITO'` e `pontos===100`.
  - `multiplicador sobe até ×3 e zera`: 6 PERFEITOS seguidos → pontos 100,150,200,250,300,300; depois um LONGE (avançar até sumir) → `mult===1`, próximo PERFEITO vale 100.
  - `velocidade +5 % por queda`: `posicao(q,'crianca',9,1).y − TOPO` ≈ `0.22·1.45` (tolerância 1e-9).
  - `item que sai sem toque é LONGE`: `avancar` com `dt` grande → `resultados[0].categoria==='LONGE'`, `fase==='parado'`, `parar(e)===null`.
  - `rodada tem 10 quedas e termina`: 10 × (`parar`, `proxima`) → `fase==='fim'`.
  - `sorteio sem repetir seguidos e repetível`: com 12 cenários e 12 itens falsos, `sortear(...,10, aleatorio(7))` não tem cenário nem item igual ao anterior; duas chamadas com semente 7 dão a mesma lista.
  - `item só vai para cenário com o lugar dele`: item `nariz` + cenário só com `cabeca` e outro com `nariz` → todas as quedas usam o segundo.
  - `estrelas nos limites`: 7 bons → 3; 6 → 2; 4 → 2; 3 → 1; 0 → 0.
  - `validação rejeita entradas ruins`: `arquivo: '../x.png'`, `'a/b.png'`, `'x.exe'`, `x: 1.2`, `tam: 0`, `rot: 60`, lugar `'pe'`, `nome` com 31 letras, `id: 'A B'` → `null`; um cenário bom → objeto com os mesmos valores.
- [ ] **Step 2: Run** `node --test peluqueria/teste/jogo.test.js` — Expected: FAIL (`Cannot find module '../jogo.js'`).
- [ ] **Step 3: Implement** `jogo.js` com as interfaces acima (UMD igual ao topo de `baguncolandia/jogo.js`).
- [ ] **Step 4: Run** `node --test peluqueria/teste/` — Expected: PASS.
- [ ] **Step 5: Commit** `Peluqueria: motor puro com pontos, níveis e validação`.

### Task 3: Os 12 cenários e 12 itens em vetor + carregadores

**Files:**
- Create: `peluqueria/cenarios/{cachorro,gato,tubarao,bebe,vovo,coruja,leao,robo,sapo,cavalo,pinguim,boneco-de-neve}.svg`, `peluqueria/cenarios/cenarios.json`
- Create: `peluqueria/itens/{peruca-oculos,boca-tubarao,coroa,cartola,bigode,nariz-palhaco,oculos-escuros,fone,laco,bone,chapeu-pirata,capacete-viking}.svg`, `peluqueria/itens/itens.json`
- Create: `peluqueria/cenarios.js`, `peluqueria/itens.js`, `peluqueria/meus/cenarios.json` (`[]`), `peluqueria/meus/itens.json` (`[]`)
- Create (só para olhar, não publicado): `peluqueria/teste/galeria.js` — gera `/tmp/peluqueria-galeria.png` com cada cenário e o item de cada tipo posto exatamente no lugar certo.
- Test: `peluqueria/teste/catalogo.test.js`

**Interfaces:**
- Consumes: `Peluqueria.validarCenario`, `Peluqueria.validarItem`.
- Produces: `PeluqueriaCenarios.carregar() → Promise<{ jogo: Cenario[], meus: Cenario[] }>` e `PeluqueriaItens.carregar() → Promise<{ jogo: Item[], meus: Item[] }>`. Cada entrada sai validada e com `src` (`'cenarios/<arquivo>'`, `'itens/<arquivo>'` ou `'meus/<arquivo>'`) e `img` (um `Image` já carregado). JSON inválido, `fetch` que falha ou imagem que não carrega → a lista daquela origem vem `[]` (ou sem a entrada), e o motivo vai para `PeluqueriaCenarios.avisos` / `PeluqueriaItens.avisos` (array de strings, mostrado no `?debug`).
- `itens.json` usa os lugares: peruca-oculos `olhos`, boca-tubarao `boca`, bigode `boca`, nariz-palhaco `nariz`, oculos-escuros `olhos`, os outros 7 `cabeca`.

- [ ] **Step 1: Write the failing tests** `catalogo.test.js`:
  - `12 cenários, todos válidos e com os 4 lugares`: cada entrada passa em `validarCenario`, tem `cabeca`, `olhos`, `nariz`, `boca`, e o arquivo existe.
  - `12 itens, todos válidos`: passam em `validarItem`; arquivos existem; os `id` são exatamente os 12 da lista acima.
  - `lugares fazem sentido`: em cada cenário, `cabeca.y < olhos.y < nariz.y < boca.y`.
  - `SVGs sem script`: nenhum `.svg` de `cenarios/` ou `itens/` contém `<script`, `on[a-z]+=` ou `href="http`.
  - `carregar ignora meus/ quebrado`: com `fetch` falso devolvendo texto inválido para `meus/cenarios.json` e uma entrada `{arquivo:'../x.png'}` em `meus/itens.json`, `carregar()` devolve `meus: []` nos dois e `avisos.length >= 2` (rodar no Node com `global.fetch` e `global.Image` falsos que carregam na hora).
- [ ] **Step 2: Run** `node --test peluqueria/teste/catalogo.test.js` — Expected: FAIL.
- [ ] **Step 3: Draw the SVGs.** `viewBox="0 0 1000 1000"` nos cenários (fundo cheio com cor e cenário próprios, bicho/pessoa grande e de frente, rosto entre y 0,15 e 0,65, sem chapéu nem óculos); itens com `viewBox` justo ao desenho e fundo transparente. Estilo da Bagunçolândia (`baguncolandia/figuras.js`): formas cheias, gradientes, contorno `#1b1030` de 6–8 px, brilho branco, olhos com reflexo. Medir os lugares no próprio desenho e escrever `cenarios.json`; marcar `encaixe` de cada item (ex.: base da coroa, ponte dos óculos, centro do bigode).
- [ ] **Step 4: Implement** `cenarios.js` e `itens.js` (UMD; `carregar()` usa `fetch` com `cache: 'no-cache'`) e acrescentar os novos arquivos (SVGs, JSONs, `cenarios.js`, `itens.js`) em `ARQUIVOS` do `sw.js` — o teste da Task 1 cobra. Toda task que cria arquivo publicado faz o mesmo.
- [ ] **Step 5: Run** `node --test peluqueria/teste/` — Expected: PASS. Rodar `node peluqueria/teste/galeria.js`, abrir `/tmp/peluqueria-galeria.png` e corrigir cada lugar que não ficou certinho no rosto.
- [ ] **Step 6: Commit** `Peluqueria: 12 cenários e 12 itens em vetor`.

### Task 4: Desenho, telas e jogo de verdade na página

**Files:**
- Create: `peluqueria/desenho.js`
- Modify: `peluqueria/app.js`, `peluqueria/estilo.css`, `peluqueria/index.html`
- Test: `peluqueria/teste/pagina.test.js` (servidor estático e verificações como em `baguncolandia/teste/pagina.test.js`)

**Interfaces:**
- Consumes: `Peluqueria.*` (Task 2), `PeluqueriaCenarios.carregar`, `PeluqueriaItens.carregar` (Task 3).
- Produces: `PeluqueriaDesenho.criar(canvas, { leve: boolean }) → { redimensionar(), pintar(estado, extra), caixaImagem(cenario) → { x, y, w, h } }`. `extra = { resultado | null, confete: boolean, pausado: boolean }`. A imagem é desenhada por inteiro (contain); a sobra é a mesma imagem ampliada com `filter = 'blur(24px) brightness(0.5)'` (sem desfoque no modo leve: cor `#0b0a1f`) + vinheta radial. O item tem largura `lugar.tam × w` e é desenhado com o `encaixe` sobre `pos`, sombra (`shadowBlur` 18; 0 no modo leve) e giro `rot`. Com `resultado`, o lugar certo aparece tracejado (ciano) e a categoria grande no meio.
- Produces: `window.PeluqueriaDebug` (só com `?teste`): `{ estado(), passo(ms), tempoAteAlvo() → ms até o encaixe chegar ao `y` do lugar da queda atual }`. Com `?teste`, o laço de quadros não roda sozinho: o teste chama `passo(ms)`; a semente é 7.
- Comportamento em `app.js` (spec §3): `pointerdown` em qualquer ponto de `#rodada` (fora de `#btPausa`) e as teclas Espaço/Enter chamam `parar`; durante o resultado, toque ou tecla depois de 0,4 s, ou 2 s parado, chamam `proxima`; Esc/P e `#btPausa` pausam (mostra `#btSeguir`); `visibilitychange` para `hidden` pausa; `dt` limitado a 0,1 s; `resize`/`orientationchange` chamam `redimensionar()`; o resultado vai para `#aviso` (`textContent`); o fim mostra estrelas, pontos, recorde e "Novo recorde!" (grava em `peluqueria-recorde`); preferências em `peluqueria-pref`; Wake Lock (`navigator.wakeLock.request('screen')`, se existir) pedido ao começar a rodada e solto no fim/pausa; `#btAjuda` abre um parágrafo de como jogar (PT/EN) que fecha com toque; "Minhas imagens" (`#btMinhas`) só aparece se `meus` tiver ao menos um cenário ou item.

- [ ] **Step 1: Write the failing test** `pagina.test.js` (viewport 390×844, `?teste`), cada verificação com `ok()`/`falhou()`:
  - abre sem erro e sem violação de CSP no console (`securitypolicyviolation` registrado por `addInitScript`);
  - Normal → Jogar → contagem → fase `caindo`;
  - `passo(tempoAteAlvo())` numa queda de Criança e um toque no canvas → `resultados[0].categoria === 'PERFEITO'` e `#aviso` com "PERFEITO";
  - **toque duplo não pula queda**: dois toques em 100 ms → `estado().i` continua o mesmo; depois de `passo(2100)` → `i` +1;
  - Espaço para o item e Enter segue;
  - `#btPausa` → `#btSeguir` visível; toque no canvas não para o item; `#btSeguir` continua;
  - **visibilidade escondida pausa**: disparar `visibilitychange` com `document.visibilityState` forçado a `hidden` → jogo pausado; `passo(60000)` → ainda `caindo` na mesma queda;
  - **girar no meio da queda**: `passo(tempoAteAlvo())`, `setViewportSize(844×390)`, toque → PERFEITO;
  - rodada inteira (10 quedas) → `#fim` visível, estrelas e "Jogar de novo";
  - PT→EN troca o texto do `#btJogar` para "Play";
  - em 320×640, `document.documentElement.scrollWidth <= 320`;
  - **meus/ inválido**: com `page.route('**/meus/cenarios.json', …)` devolvendo um JSON quebrado (três chaves abrindo), a página abre sem erro e `#btMinhas` fica escondido.
  Capturas em `/tmp/peluqueria-*.png` para olhar.
- [ ] **Step 2: Run** `node peluqueria/teste/pagina.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** `desenho.js`, as telas em `app.js`, o CSS (Início com logo em Fredoka com brilho rosa, botões de nível com as três cores, placar no topo, `#btPausa` 44 px no canto, `#btSeguir` 120 px no meio; confete e pulos dentro de `@media (prefers-reduced-motion: no-preference)`).
- [ ] **Step 4: Run** `node --test peluqueria/teste/` e `node peluqueria/teste/pagina.test.js` — Expected: tudo ✓. Olhar as capturas.
- [ ] **Step 5: Commit** `Peluqueria: telas, desenho e rodada jogável`.

### Task 5: Música, efeitos e voz

**Files:**
- Create: `peluqueria/som.js`, `peluqueria/voz.js` (a partir de `baguncolandia/voz.js`, só fala + legenda), `peluqueria/musicas/LEIA-ME.md`, `peluqueria/musicas/musicas.json` (`[]`)
- Modify: `peluqueria/app.js`, `peluqueria/teste/pagina.test.js`

**Interfaces:**
- Produces: `PeluqueriaSom = { ligar() (no 1º toque; cria o AudioContext), musica(nivel), andamento(i) (BPM = base + 2·i; bases 120/132/150), parar(), efeito(nome) ('toque'|'PERFEITO'|'BOM'|'QUASE'|'LONGE'|'conta'|'fim'), mudo(bool), minhas(lista) }`. Sem `AudioContext`, tudo vira nada (sem erro). Com `musicas.json` não vazio (validado: `arquivo` `/^[A-Za-z0-9_-][A-Za-z0-9_.-]{0,60}\.mp3$/`), toca um sorteado em laço por `<audio>` no lugar da trilha.
- Produces: `PeluqueriaVoz.falar(textoPt, textoEn)` — fala na língua atual se `speechSynthesis` existir; sempre devolve sem erro. "UHUL!" no PERFEITO; "Três, dois, um, já!" / "Three, two, one, go!" na contagem.

- [ ] **Step 1: Write the failing test** em `pagina.test.js`: nova página com `addInitScript` apagando `window.speechSynthesis`, `window.AudioContext` e `window.webkitAudioContext`; joga 2 quedas → nenhum erro no console e `#aviso` mostra a categoria. Na página normal: `PeluqueriaSom` registra os efeitos chamados (com `?teste`, `PeluqueriaSom.registro` é um array) e depois de um PERFEITO contém `'PERFEITO'`.
- [ ] **Step 2: Run** `node peluqueria/teste/pagina.test.js` — Expected: FAIL nas duas novas verificações.
- [ ] **Step 3: Implement** a trilha: compasso 4/4 com bumbo (seno 150→50 Hz), caixa (ruído filtrado), chimbal (ruído agudo curto), baixo (dente de serra filtrado) e melodia alegre em escala maior (quadrada suave), padrão de 4 compassos diferente por nível, agendada à frente com `currentTime` (janela de 0,1 s). Ligar `musica`/`andamento`/`efeito`/`falar` nos pontos do `app.js` e o botão 🔊/🔇.
- [ ] **Step 4: Run** os dois testes — Expected: ✓. Ouvir (descrever o resultado ao dono, que ouve no celular).
- [ ] **Step 5: Commit** `Peluqueria: música sintetizada, efeitos e voz`.

### Task 6: `marcar.html` e a pasta `meus/`

**Files:**
- Create: `peluqueria/marcar.html`, `peluqueria/marcar.js`, `peluqueria/meus/LEIA-ME.md`
- Modify: `peluqueria/sw.js` (lista), `peluqueria/teste/pagina.test.js`

**Interfaces:**
- Produces: `marcar.html` com a mesma CSP, PT|EN, `<input type="file" accept="image/*" id="foto">` (lido com `URL.createObjectURL`, nada é enviado), seletor de modo (Cenário | Item), seletor de lugar (`cabeca|olhos|nariz|boca`), arrastar para desenhar o quadrado (largura do quadrado = `tam`; centro = `x`,`y`), controle de giro (−45 a 45), `<pre id="linha">` com o JSON pronto de uma entrada (`id` e `arquivo` vêm do nome do arquivo, minúsculo e sem acento; `largura`/`altura` = `naturalWidth/Height`; números com 3 casas) e botão `#copiar` (`navigator.clipboard.writeText`). Modo Item: um toque marca o `encaixe`. A linha gerada sempre passa em `Peluqueria.validarCenario`/`validarItem` (`marcar.html` carrega `jogo.js`).

- [ ] **Step 1: Write the failing test** em `pagina.test.js`: abre `marcar.html`, `setInputFiles` com um PNG 800×600 gerado no teste (`Buffer` de um canvas do próprio Chromium), escolhe `olhos`, arrasta de (30 %, 30 %) a (70 %, 50 %) da imagem; o texto de `#linha`, lido com `JSON.parse`, tem `largura: 800`, `lugares.olhos.x ≈ 0.5`, `lugares.olhos.tam ≈ 0.4` (±0,02) e passa em `Peluqueria.validarCenario`; nenhum erro de CSP.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** `marcar.js` e escrever `meus/LEIA-ME.md` para leigo (passo a passo: pôr a foto na pasta pelo GitHub "Add file → Upload files", abrir `…/peluqueria/marcar.html`, marcar, Copiar, colar no `meus/cenarios.json` entre os colchetes com vírgula entre as linhas; só foto com direito de uso; nunca foto de pessoa sem permissão; fotos pessoais e de crianças só na fase 4, dentro do celular).
- [ ] **Step 4: Run** — Expected: ✓.
- [ ] **Step 5: Commit** `Peluqueria: página marcar e pasta meus/`.

### Task 7: TV com o controle, modo leve e `?debug`

**Files:**
- Modify: `peluqueria/app.js`, `peluqueria/estilo.css`, `peluqueria/teste/pagina.test.js`

**Interfaces:**
- Consumes: `PeluqueriaDesenho.criar(canvas, { leve })`.
- Produces: com `?tv=auto`, `<html>` ganha a classe `tv` (letras ~1,5×, foco com contorno lima de 4 px), o foco começa em `#btJogar`, setas movem o foco entre os botões visíveis, `leve: true`, densidade 1×, confete com no máximo 30 peças. Com `?debug`, `#debug` (canto, `textContent`) mostra `v0.1.0`, fps e os últimos 5 erros (`window.onerror`, `unhandledrejection`) e os `avisos` dos catálogos.

- [ ] **Step 1: Write the failing test**: viewport 1280×720 com `?tv=auto&teste` → `<html>` tem `tv`, `document.activeElement.id === 'btJogar'`; Enter começa; `passo(tempoAteAlvo())` + Enter → PERFEITO; `PeluqueriaDebug.leve === true`. Com `?debug&teste`, `#debug` contém `v0.1.0`.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** todos os testes — Expected: ✓.
- [ ] **Step 5: Commit** `Peluqueria: TV com o controle, modo leve e debug`.

### Task 8: Documentos, cartões e atalhos

**Files:**
- Create: `peluqueria/LEIA-ME.md` (o que é, como jogar, níveis, pontos, instalar, sem internet, TV com controle, mapa dos arquivos, como testar), `peluqueria/CREDITOS.md` (desenhos próprios; Fredoka OFL; regra para fotos futuras), `peluqueria/PENDENCIAS.md` (fases 2–5; fotos realistas: anexar no chat ou pedir a lista de pedidos para o AI Studio; Client ID do Spotify; chave do Gemini só no cofre)
- Modify: `FeatureTesting/index.html` (cartão depois da Bagunçolândia: `ic: "💇"`, `nome: "Peluqueria (Bolinho de Chuva)"`, `desc` PT/EN de uma linha, `url: "peluqueria/"`, `status: "ativo"`), `FeatureTesting/recursos-do-app.json` (entrada da spec §2), `FeatureTesting/ARQUITETURA.md`, `FeatureTesting/PENDENCIAS.md` (marcar o item #10 da Bagunçolândia como iniciado pela Peluqueria)
- Modify (outro repositório, `marceloneco.github.io`, mesma branch): `bolinho-de-chuva/index.html` (cartão como o da Bagunçolândia, cor rosa `#ff4fa3`, `href` `https://solverone.com.br/FeatureTesting/peluqueria/`), `kids/index.html` (cartão com `?tv=auto`, navegável por `kids.js` sem mudança nele), Create `tv/peluqueria/index.html` (cópia de `tv/bagunca/index.html` trocando destino, título e textos: "💇 Abrindo a Peluqueria…").
- Test: `peluqueria/teste/arquivos.test.js`

- [ ] **Step 1: Write the failing test** em `arquivos.test.js`: `recursos-do-app.json` tem `id: 'peluqueria'` com `pagina: 'peluqueria/'`; `FeatureTesting/index.html` contém `url: "peluqueria/"`; `peluqueria/LEIA-ME.md`, `CREDITOS.md`, `PENDENCIAS.md` existem.
- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Write the documents and cards.** Verificar `kids/index.html` e `bolinho-de-chuva/index.html` no Chromium (abrir, sem erro, cartão novo visível, setas chegam no cartão em `/kids`).
- [ ] **Step 4: Run** `node --test peluqueria/teste/` — Expected: PASS.
- [ ] **Step 5: Commit** nos dois repositórios: `Peluqueria: documentos, cartões no Feature Tester, no Bolinho de Chuva, no Kids e atalho /tv/peluqueria`.

### Task 9: Verificação final e envio

- [ ] **Step 1:** `node --test peluqueria/teste/` e `node peluqueria/teste/pagina.test.js` (de `FeatureTesting/`) — tudo ✓; `node --test baguncolandia/teste/*.test.js` continua ✓ (nada da Bagunçolândia mudou).
- [ ] **Step 2:** Olhar as capturas (Início, queda, PERFEITO com confete, fim, 320 px, TV) e corrigir o que estiver feio.
- [ ] **Step 3:** `git push -u origin claude/peluqueria-passagem-bastao-2jbkam` nos dois repositórios. Sem pull request e sem merge.
- [ ] **Step 4:** Contar ao dono, em duas frases, o que mudou e como testar (depois do merge: `https://solverone.com.br/FeatureTesting/peluqueria/`, e na TV `solverone.com.br/tv/peluqueria`).
