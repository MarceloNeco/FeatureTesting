# Bagunçolândia — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jogo de sala (cortar, pegar, chutar com o corpo) para 1–2 pessoas, TV + celular, dentro do Feature Tester.

**Architecture:** Uma página (`baguncolandia/index.html`) serve TV e celular. `sala.js` (pareamento Supabase + WebRTC + movimento, copiado do Dança 0.9.0) manda pontos de movimento para a TV; `jogo.js` (puro, testável no Node) roda a partida; `desenho.js` pinta no canvas; `calibrar.js` roda no celular e fala/legenda via `voz.js`.

**Tech Stack:** HTML/CSS/JS puros, WebRTC, Supabase Realtime (broadcast), YouTube IFrame API, WebAudio, speechSynthesis, service worker. Testes: Node (`node --test`) e Playwright/Chromium.

**Spec:** `docs/superpowers/specs/2026-10-31-baguncolandia-design.md`

## Global Constraints

- Nenhum segredo no código; só a URL e a publishable key do Supabase (públicas) e, opcional, Client ID do Spotify.
- Sem script inline (CSP `script-src 'self' https://www.youtube.com`). Nada de `innerHTML` com dado de fora.
- PT/EN em todo texto (`T('pt','en')` / `data-t="pt|en"`).
- Versão em `index.html` (`APP_VERSION`), `sw.js` (`VERSAO`), `versoes.json`.
- Dança na Sala não é alterado.
- Pastas: tudo em `FeatureTesting/baguncolandia/`.

## Review Focus

1. Mensagem do canal com tipo desconhecido, nome > 14 letras ou SDP que não é objeto → ignorada sem quebrar (teste em `jogo.test.js`: `validar()`).
2. Celular que entra durante a rodada com id desconhecido → ignorado; id conhecido que reconecta → aceito (teste `validar` + `lobby.aceita`).
3. Câmera frontal espelhada vs traseira → pontos de movimento sempre chegam na TV já na orientação do palco (`sala.js` manda `x` já espelhado quando `frente`).
4. speechSynthesis inexistente na TV → legenda aparece e o celular fala (`voz.js` devolve `temVoz=false`, TV manda `fale` para o celular).
5. `prefers-reduced-motion` → legenda não pisca, partículas reduzidas.

---

### Task 1: Pasta, página base, CSS, fonte, libs, SW, manifesto, ícone
Create `baguncolandia/{index.html,estilo.css,sw.js,manifest.webmanifest,fontes/fredoka.woff2,fontes/OFL.txt,libs/supabase.js,libs/LICENSE-supabase.txt,CREDITOS.md,versoes.json}`; ícone 512/192 gerado por Chromium a partir de SVG.
Produces: telas `#inicio #tv #entrar #jogo` e `tela(id)`.

### Task 2: `jogo.js` puro + `teste/jogo.test.js`
Produces: `Bagunca.criarPartida({modo, jogadores, duracao, dificuldade, figuras})` → `{ avancar(dt), entradas(jogador, pontos), estado(), eventos() }`; `Bagunca.validar(msg)`; `Bagunca.FIG` (catálogo mínimo usado pelo motor: id, papel, raio).
Tests: lançar frutas em arco; corte por segmento; vilão tira vida; combo; fim por tempo; chute só na zona; pega por toque; validar mensagens.

### Task 3: `figuras.js` (SVG turma própria + domínio público + meus/)
Produces: `Figuras.lista(turmas)` → `[ {id, papel, nome:{pt,en}, svg, turma} ]`; `Figuras.rasterizar(fig, px)` → canvas; `Figuras.carregarMeus(url)`.

### Task 4: `desenho.js` — palco, figuras, cortes, partículas, HUD, legendas
Produces: `Desenho.iniciar(canvas)`, `Desenho.quadro(estadoPartida, ts)`, `Desenho.legenda(texto, cor, pisca)`, `Desenho.confete()`.

### Task 5: `sala.js` — pareamento + WebRTC + movimento (do Dança), endurecido
Produces: `Sala.tv({codigo, aoJogador, aoDados, aoSair, aceitaNovos()})`, `Sala.celular({nome, codigo, aoEstado})` com `enviarDados(obj)`; `Sala.medir(video)` → `{e, p:[[x,y,f]...]}`; limite 4; validação via `Bagunca.validar`.

### Task 6: `voz.js` + `calibrar.js`
Produces: `Voz.falar(pt,en)`, `Voz.temVoz`; `Calibrar.iniciar({video, aoPasso(passo, ok, caixa), aoFim(caixa)})` com passos `fundo, parado, bracoDir, bracoEsq, chute, pulo`.

### Task 7: `app.js` — fluxo TV (carregamento, capa, lobby, calibração, rodada, pódio) e celular (entrar, lobby, controles, YouTube)
Modify `index.html`. Playwright test `teste/pagina.test.js` com `?teste` (pontos falsos).

### Task 8: Integração — cartão no Feature Tester, `recursos-do-app.json`, `tv-lg-baguncolandia/`, Portal (cartão + `tv/bagunca`), LEIA-ME, PENDENCIAS.

### Task 9 (v0.2): Pega-pega, Chuta-chuta, Bagunça total, 2 jogadores (1 e 2 celulares), domínio público, `meus/`, só o celular.

### Task 10 (v0.3): `batida.js` (mic → BPM) e `spotify.js` (PKCE, controle remoto).

### Task 11 (v0.4): esqueleto (pendente de hospedar o modelo; aviso de download).
