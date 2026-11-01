# FeatureTesting — arquitetura

Laboratório da plataforma SolverONE: cada card do `index.html` é um experimento que roda direto no navegador.
Publicado em https://solverone.com.br/FeatureTesting/ (GitHub Pages). No catálogo do RootifyONE é o app
`feature-tester` (interno: fica fora das listas públicas, mas entra no Controle dos apps desde o RootifyONE 0.18.5).

Antes de mexer, leia o `CLAUDE.md` e a diretriz geral em `.claude/skills/diretrizes-gerais-apps/SKILL.md`.
Pendências: `PENDENCIAS.md`.

## Arquivos

| Arquivo | O que faz | Pode mexer aqui? |
|---|---|---|
| `index.html` | Página do laboratório. A lista `FEATURES` (no fim do arquivo) gera os cards: `ic`, `nome`, `desc`, `url`, `status` (`ativo` ou `breve`). | sim — card novo = um objeto na lista |
| `danca-na-sala.html` | Experimento **Dança na Sala / Living Room Dance**, tudo numa página (ver abaixo). Versão em `APP_VERSION`. | sim |
| `danca-na-sala.webmanifest`, `danca-na-sala-icone.png` | Instalar a Dança na Sala na tela inicial (inclui `share_target` para receber link do Compartilhar do YouTube). | sim |
| `sw.js` | Service worker **mínimo**: só existe para o "Adicionar à tela inicial" funcionar; não guarda nada em cache (laboratório muda toda hora). | sim, mas continua sem cache |
| `tv-lg/` | Casca do app para TV LG (webOS): abre a página publicada com `?tv=auto`. `instalar-lg.py` empacota e instala pelo Modo Desenvolvedor da LG (baseado no free-my-tv, MIT); passo a passo em `tv-lg/LEIA-ME.md`. | sim |
| `arch-one/` | **ArchONE, o mapa vivo da plataforma (protótipo F0)**, morando aqui por enquanto (decisão do dono, 31/Out/2026) até o portal próprio `arch-one` nascer na F1. Desenha a plataforma a partir dos manifestos `arch-one/manifestos/*.json` (contrato em `rootify-one/docs/specs/arquitetura-json-v1.md`), com Cytoscape.js copiado em `arch-one/lib/` (MIT, licenças ao lado). O original é `rootify-one/docs/specs/mapa-vivo/prototipo/`: mudança de verdade é feita lá e copiada para cá. Interruptor `data-recurso="arch-one"` (`recursos.js` com `data-app="feature-tester"`). Nenhum segredo: os manifestos dizem onde cada chave mora, nunca a chave. | só copiar do rootify-one |
| `peluqueria/` | **Peluqueria** (família Bolinho de Chuva, irmã da Bagunçolândia): um item desce sobre um cenário e a pessoa toca para parar no lugar certo; pontos por precisão. Pasta própria com `sw.js` (cache `peluqueria-v…`, funciona sem internet), motor puro `jogo.js` testado no Node, 12 cenários e 12 itens em SVG, música sintetizada, `meus/` + `marcar.html` para imagens do dono. Desde a 0.4.0 joga na TV com o celular como controle (código, movimento brusco do corpo, 2 jogadores) e reaproveita o `supabase.js` e o MediaPipe de `baguncolandia/libs/` — **não apague** essa pasta. Interruptor `data-recurso="peluqueria"`. Mapa e testes em `peluqueria/LEIA-ME.md`; pendências em `peluqueria/PENDENCIAS.md`. | sim |
| `tv-lg-peluqueria/` | Casca da Peluqueria para TV LG (abre `peluqueria/?tv=auto`); igual à `tv-lg-baguncolandia/`. | sim |
| `vruuum/` | **Vruuum!** (família Bolinho de Chuva, quarta brincadeira): corrida de carrinho em pseudo-3D (curvas, morros, 4 mundos sorteados entre 5), estrelas, turbo, rampa, cones, lama e trânsito; 1 jogador ou 2 na mesma tela dividida. Pasta própria com `sw.js` (cache `vruuum-v…`, funciona sem internet). Motor puro (`pista.js` + `motor.js`) testado no Node; desenhos todos em código (`sprites.js`), estrada e placar em `desenho.js`, sons sintetizados em `som.js`, telas e controles (toque, inclinar, teclado, videogame, controle da TV) em `app.js`. Usa `../recursos.js` e, para achar o rosto da selfie, o MediaPipe de `../baguncolandia/libs/mediapipe/` — **não apague** essa pasta. Interruptor `data-recurso="vruuum"`. Mapa e testes em `vruuum/LEIA-ME.md`; pendências em `vruuum/PENDENCIAS.md`. | sim |
| `purpurina/` | **Purpurina** (família Bolinho de Chuva, quinta brincadeira): vestir e maquiar — personagem (pele, cabelo, olhos), maquiagem, roupas, acessórios e 8 cenários, desfazer, surpresa, 8 desafios com estrelas, desfile com confete, foto do visual (PNG) e looks favoritos no aparelho. Pasta própria com `sw.js` (cache `purpurina-v…`, funciona sem internet). Catálogo em `pecas.js` (só dados) e regras em `visual.js` (puro), testados no Node; desenho todo em SVG feito em código (`boneca.js`), sons sintetizados em `som.js` (que também toca as 8 músicas gravadas de licença livre de `purpurina/musicas/`, com cache próprio `purpurina-musicas-v1`), telas em `app.js`. `baixar.js` é cópia idêntica do `vruuum/baixar.js` (o teste confere). Desde a 0.5.0 tem TV com celular de controle (`sala.js`, `tv.js`) e música do YouTube/Spotify (`musica.js`); a TV usa o `supabase.js` de `baguncolandia/libs/` — **não apague** essa pasta. Fora isso, só depende de `../recursos.js` (e do `vruuum/baixar.js` no teste). Interruptor `data-recurso="purpurina"`. Mapa e testes em `purpurina/LEIA-ME.md`; pendências em `purpurina/PENDENCIAS.md`. | sim |
| `rabiscolandia/` | **Rabiscolândia** (família Bolinho de Chuva, sexta brincadeira): desenhar livre, livro de colorir (contorno, balde que respeita o contorno, colinha 👀 e outras cores) e pintar por números, com pincéis vivos, adesivos animados, paisagens, música, Meus desenhos (IndexedDB) e foto. Folha esperta (`folha.js`, pura, testada no Node): o menu fica na borda que é o "embaixo" do aparelho e o desenho se ajusta ao girar. Motor em `pintura.js`; desenhos em `paginas.js` (só dados), `fundos.js`, `adesivos.js`, `som.js`. 🖐 Mão na câmera (`mao.js`, MediaPipe Hand Landmarker com o modelo `hand_landmarker.task` guardado em `baguncolandia/libs/mediapipe/` junto do resto da biblioteca — **não apague** essa pasta) e TV com o celular de controle (`sala.js`, `tv.js`, mesma sala Supabase das irmãs). Pasta própria com `sw.js` (cache `rabiscolandia-v…`). Interruptor `data-recurso="rabiscolandia"`. Mapa e testes em `rabiscolandia/LEIA-ME.md`; pendências em `rabiscolandia/PENDENCIAS.md`. | sim |
| `recursos.js` | Interruptores do RootifyONE para páginas sem o módulo comum (`SolverRecursos`, `data-recurso`). | **não** — cópia; o master fica no repositório `rootify-one` |
| `recursos-do-app.json` | Lista pública do que este app obedece no Controle dos apps (hoje: `danca-na-sala`, `baguncolandia`, `peluqueria`, `vruuum`, `purpurina`, `rabiscolandia`, `arch-one`). Nada de segredo aqui. | sim — interruptor novo entra aqui e no `data-recurso` da página |
| `testes-modulo-comum.html` | Roteiros de teste do módulo comum 1.9.0 (Fundo, Interruptores/Modo DEUS, Compatibilidade, Feedback); os cards "Teste: …" abrem cada seção. | sim |
| `leitor-ocr.html` | Só redireciona para o Leitor de Comprovantes, que ganhou repositório próprio (https://marceloneco.github.io/leitor-ocr/). | não precisa |
| `CLAUDE.md`, `.claude/skills/diretrizes-gerais-apps/SKILL.md` | Regras do projeto e diretriz geral, copiadas do `rootify-one` ("atualize a diretriz"). | **não** à mão — copiar de novo do `rootify-one` |

## Dança na Sala (`danca-na-sala.html`)

A mesma página serve a **TV** e o **celular**:

- **TV** (navegador da LG webOS 6.5, ou o app da pasta `tv-lg/`): "Esta é a TV" mostra um código de 4 letras.
  Toca a música do YouTube em tela cheia e mostra as câmeras por cima, com neon, fogos e clarões
  (suave / forte / desligado, com aviso de fotossensibilidade).
- **Celular**: entra com nome e código; manda a câmera para a TV por **WebRTC ponto a ponto** (STUN do Google,
  sem servidor de mídia) e mede a "energia" por diferença entre quadros (sem IA). Pelo canal de dados do WebRTC
  manda os pontos onde houve movimento. Comandos: link de vídeo ou playlist, tocar, pausar, do início,
  Próxima/Anterior, lista das músicas com nome (oEmbed do YouTube, sem chave). Também há o modo **só o celular**
  (sem TV).
- **Pareamento**: Supabase Realtime do projeto da plataforma, com a URL e a chave **publishable** (públicas por
  desenho). Nenhum segredo no código.
- **Interruptor**: `data-recurso="danca-na-sala"` na tela inicial + `recursos.js` com `data-app="feature-tester"`.
  Desligado no RootifyONE → a tela some.
- **Guardado no aparelho** (`localStorage`, chaves `danca:*`): nome, código, títulos, últimas músicas e a chave
  opcional da YouTube Data API da própria pessoa (`danca:ytkey`, para a busca dentro do app).
- **Bibliotecas de fora**: `supabase-js` (jsDelivr) e a API de iframe do YouTube.

Deixados de fora de propósito, por ser laboratório: módulo `Fundo`, cache offline no `sw.js` e zip de entrega.
