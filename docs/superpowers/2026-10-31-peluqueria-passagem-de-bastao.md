# Peluqueria — passagem de bastão para a próxima conversa (31/Out/2026)

Cole este texto inteiro como primeira mensagem de uma conversa nova. Ele resume uma conversa que
parou por falta de créditos, no fim do brainstorming e antes da especificação.

---

## Quem eu sou e como falar comigo

Eu sou o Marcelo, dono da plataforma SolverONE (solverone.com.br). **Não sou desenvolvedor.**
Fale sempre em português do Brasil, simples, passo a passo, sem jargão. Faça **uma pergunta por
vez**, de preferência com opções. Quando eu tiver de fazer algo no GitHub ou no celular, diga onde
clicar. Quando entregar, diga em duas frases o que mudou e como eu vejo o resultado.

## Leia antes de qualquer coisa (nesta ordem)

Repositórios desta sessão: `FeatureTesting` (onde o jogo vai morar), `marceloneco.github.io`
(portal: `/kids`, `/bolinho-de-chuva`, `/tv`), `rootify-one`, `arch-one`, `leitor-ocr`,
`contador-de-historias`. Trabalhe na branch que a sessão indicar e **nunca** faça merge, não crie
repositório nem publique no GitHub Pages sem eu pedir. Nenhum segredo (chave, token, senha) entra em
código, arquivo ou chat.

1. `FeatureTesting/CLAUDE.md` e a diretriz geral em
   `FeatureTesting/.claude/skills/diretrizes-gerais-apps/SKILL.md` (também é a skill
   `diretrizes-gerais-apps`). Regra zero: antes de implementar algo da diretriz que ainda não existe
   no app, liste e confirme comigo.
2. `FeatureTesting/ARQUITETURA.md` e `FeatureTesting/PENDENCIAS.md`.
3. A Bagunçolândia, que é o modelo deste jogo: `FeatureTesting/baguncolandia/LEIA-ME.md`,
   `PENDENCIAS.md`, `CREDITOS.md`, e a especificação e o plano dela em
   `FeatureTesting/docs/superpowers/specs/2026-10-31-baguncolandia-design.md` e
   `FeatureTesting/docs/superpowers/plans/2026-10-31-baguncolandia.md`. Quero o mesmo nível de
   cuidado e o mesmo formato para a Peluqueria.
4. Skills do superpowers: `brainstorming` (estamos no fim dele), depois `writing-plans`,
   `test-driven-development` e `verification-before-completion`.

## O que é o jogo

Um jogo no estilo dos "filtros de pausar" do Instagram: uma imagem de fundo (um cachorro, um tubarão,
um bebê, um vovô…) e um item descendo por cima (peruca com óculos, boca de tubarão, coroa, chapéu,
bigode…). A pessoa **pausa na hora certa** para o item cair no lugar. Como é jogo, **não quero só
"estampar" a imagem engraçada** como no Instagram: quero **pontos por precisão**, com margem de
erro, comemoração "UHUL!" quando acerta, e placar. Música **muito animada** o tempo todo.

Eu pedi, em resumo:

- Celular: pausar com o dedão em qualquer ponto da tela; ao pausar, aparece o ▶ na tela.
- Mais de 10 cenários, visual **sofisticado e bonito**, com fotos **realistas**.
- TV: espelhar ou transmitir, e também o jeito do Bolinho de Chuva (TV abre a página com código, o
  celular entra e filma), em que **bater palma ou levantar os braços** pausa.
- Dois jogadores na TV: **tela dividida ao meio**, competição, com música.
- Spotify quando der; **músicas próprias** quando não der.
- Só no celular: **subir a própria foto** e a IA do **Gemini** ajeitar a foto (centralizar, sorrir
  etc.). Eu disse: "quero uma versão inicial para brincar; depois eu subo outras fotos; depois eu
  coloco o negócio de subir a foto pessoal".

## Decisões já tomadas (não reabrir)

- **Nome: Peluqueria** (com L, como escrevi). Em inglês a marca fica igual, com subtítulo em cada
  língua: "o provador maluco da família" / "the family's crazy fitting room". Eu fui avisado de que a
  palavra é espanhola e que há vários jogos infantis de salão com "Peluquería" no título; decidi
  mesmo assim.
- **Onde mora:** pasta `FeatureTesting/peluqueria/`, irmã da `baguncolandia/`, dentro da família
  **Bolinho de Chuva**. Sem repositório novo. Com cartão no `index.html` do Feature Tester, no
  `marceloneco.github.io/bolinho-de-chuva/index.html` (estante do celular) e no
  `marceloneco.github.io/kids/index.html` (TV, com `?tv=auto`), mais o atalho curto
  `marceloneco.github.io/tv/peluqueria/index.html` (redireciona como o `tv/bagunca`). Interruptor
  `data-recurso="peluqueria"` + entrada em `FeatureTesting/recursos-do-app.json`.
- **Fases** (cada uma vira versão publicável e testável na minha TV LG):
  1. Jogo no celular: cair e pausar, pontos, UHUL, 12 cenários, música própria, instalável e offline.
  2. TV e dois jogadores: código na TV, celular como controle, tela dividida, casca LG
     (`tv-lg-peluqueria/`), `/tv/peluqueria`, `/kids`.
  3. Corpo: palma pelo microfone e braços pela câmera pausam.
  4. Minha foto + Gemini (chave só no cofre do navegador; foto sai do aparelho só com aceite claro;
     foto de criança é dado sensível pela LGPD).
  5. Spotify como extra (controle remoto, exige Premium e o meu Client ID).
- **Como construir (caminho escolhido):** pasta irmã da Bagunçolândia, mesmo padrão: uma página só
  que serve TV e celular, módulos **copiados** dela (`sala.js` pareamento Supabase + WebRTC,
  `voz.js`, `som.js`, `batida.js`, `esqueleto.js`, `spotify.js`, `config.js`, `libs/`, fonte Fredoka em
  `fontes/`) e um **motor novo** só para este jogo. Na fase 1 liga-se só o modo celular; a TV entra na
  fase 2 sem refazer nada. (Descartados: modo novo dentro da Bagunçolândia; página mínima sem TV.)
- **Cenários iniciais:** a Claude propõe e desenha os 12 primeiros em **vetor (SVG)** no estilo da
  Bagunçolândia, para eu já poder brincar. **Fotos realistas entram depois**, pela pasta `meus/`, sem
  mexer no código. Minhas fotos pessoais só na fase 4, dentro do celular, nunca no repositório.
- **Música:** trilhas animadas **sintetizadas no WebAudio** pelo próprio jogo (sem arquivo, sem
  direito autoral), acelerando com o nível, mais efeitos. Pasta `musicas/` para eu colocar MP3s meus
  depois. Spotify só na fase 5. Nada de YouTube (não pedi).
- Sem cadastro, sem banco, sem cookie, sem anúncio; para todos os planos. Como é laboratório
  (Feature Tester), o módulo comum `diretrizes.js`, `Fundo` e feedback ficam de fora, como na
  Bagunçolândia.

## O que já existe e deve ser reaproveitado

- `FeatureTesting/baguncolandia/` (v0.8.3): `index.html` única página TV+celular sem script inline
  (CSP); `app.js` (TVApp e CelApp); `jogo.js` motor **puro** testado no Node; `desenho.js` canvas
  1280×720; `sala.js` pareamento (Supabase Realtime broadcast com chave publishable, pública por
  desenho; vídeo e dados por WebRTC, canal `jogo`; `Bagunca.validar` em toda mensagem; máximo 4
  celulares); `calibrar.js`; `voz.js` (regras de voz SolverONE); `som.js` (sons e música em laço
  sintetizados); `batida.js` (microfone → batida/BPM, detecta "ataques" de som — serve de base para
  detectar **palma** na fase 3); `esqueleto.js` (MediaPipe Pose em `libs/mediapipe/`, 13 pontos, só
  baixa quando a pessoa liga, ≈20 MB — serve para **braços levantados** na fase 3); `spotify.js`
  (PKCE, controle remoto, exige Premium; `config.js` com `spotifyClientId: ''` ainda **vazio**);
  `sw.js` (cache `bagunca-vX`, rede primeiro para código com 4 s, cache primeiro para pesado);
  `meus/LEIA-ME.md` + `personagens.json` (mecanismo de imagens do dono); `teste/` (Node + Chromium com
  Playwright, `?teste` injeta pontos falsos). Rodar: `node --test baguncolandia/teste/*.test.js` e
  `node baguncolandia/teste/pagina.test.js`.
- Pendências da Bagunçolândia ligadas a este jogo: #10 "mais brincadeiras da família Bolinho de
  Chuva (cada uma na sua pasta, mesmo motor)" e #8 "juntar o pareamento num `sala-tv.js` comum".
- `FeatureTesting/danca-na-sala.html` (irmão: YouTube na TV, câmeras por WebRTC) e `tv-lg/`,
  `tv-lg-baguncolandia/`, `tv-lg-kids/` (cascas para TV LG webOS: `appinfo.json`, `index.html` que
  redireciona com `?tv=auto`, `instalar-lg.py`, `LEIA-ME.md`).
- Portal: `marceloneco.github.io/bolinho-de-chuva/index.html` (estante com cartões, só HTML/CSS),
  `kids/index.html` + `kids.js` (cartões grandes para o controle da TV, setas e OK),
  `tv/bagunca/index.html` (redirecionamento).
- Lição da TV LG (pendência #12 da Bagunçolândia): efeitos pesados travam o navegador da TV; existe
  "modo leve", desenho blindado e `?tv=auto&debug` que mostra versão, fps e erros na tela.

## Avisos e limites já descobertos

- **Spotify**: só controla a música em conta **Premium**; precisa do Client ID que eu ainda não colei
  no `config.js`; em modo de desenvolvimento o Spotify só deixa entrar as pessoas cadastradas no
  painel do app (até 25). Por isso a música própria é o padrão e o Spotify é extra.
- **Gemini / foto pessoal (fase 4)**: chave da pessoa só no cofre do navegador (padrão `cofre.js`
  do `contador-de-historias` / `rootify-one`), nunca no código; avisar claramente que a foto vai para
  o Google; foto de criança é dado sensível; a foto nunca entra no repositório.
- **Fotos realistas**: o repositório é público, então cada imagem precisa de licença limpa, listada em
  `CREDITOS.md`. A sessão anterior descobriu que a **rede da sessão do Claude Code bloqueia**
  Wikimedia Commons, Pexels, Pixabay e Openclipart (403 no proxy); GitHub funciona. Não perca tempo
  tentando baixar fotos: ou eu **anexo fotos aqui no chat** (a Claude copia para o repositório), ou a
  Claude me manda a **lista de pedidos prontos** para eu gerar no Google AI Studio com a minha chave
  do Gemini e enviar os arquivos.
- **Espelhar na TV** é função do celular (Smart View etc.), não do site; o jogo só precisa ficar bonito
  deitado. O caminho robusto é o da Bagunçolândia: a TV abre a página e o celular entra com o código.
  A diretriz diz: vídeo usa o botão de transmitir do próprio navegador antes de qualquer SDK.
- "Troca-Troca" tem duplo sentido em gíria; não usar em nada infantil.

## Desenho da fase 1 (apresentado a mim; eu ainda não disse "ok" formalmente)

- **Mecânica:** cada cenário é uma imagem de fundo com um **"lugar certo" invisível** (x, y,
  tamanho, rotação) definido em `cenarios/cenarios.json`; cada item tem ponto de encaixe. O item
  **desce** do alto; nos níveis mais altos também **balança** de um lado para o outro ou **gira**. A
  pessoa **toca em qualquer ponto da tela** para parar; vale também a barra de espaço (na fase 2,
  o OK do controle).
- **Pontos pela distância** até o lugar certo: Perfeito (≈ até 3 % da tela) = 100 + confete + voz +
  "UHUL!"; Bom (≈ até 8 %) = 60; Quase (≈ até 15 %) = 30; Longe = 0 com som engraçado. Acertos
  seguidos multiplicam. O resultado fica congelado ≈ 2 s para rir e segue. **Nada é salvo nem
  exportado como imagem.**
- **Rodada:** 10 quedas misturando cenários e itens (60 a 90 s). Fim: placar com estrelas e "Jogar de
  novo". Níveis: Criança, Normal, Maluco (velocidade, balanço, tolerância). Botão ⏸ pequeno; pausado,
  ▶ grande no meio.
- **12 cenários iniciais (vetor):** cachorro, gato, tubarão, bebê, vovô, coruja, leão, robô, sapo,
  cavalo, pinguim, boneco de neve. **12 itens:** peruca com óculos, boca do tubarão, coroa, cartola,
  bigode, nariz de palhaço, óculos escuros, fone, laço, boné, chapéu de pirata, capacete viking.
- **Minhas imagens depois:** `meus/LEIA-ME.md` + `meus/cenarios.json` (igual à Bagunçolândia) e uma
  página de apoio **`marcar.html`**: abro a foto, arrasto um quadrado onde o item deve parar, copio a
  linha pronta para a lista. Sem programar. Fotos e itens meus também podem ser PNG com fundo
  transparente.
- **Visual:** paleta do Bolinho de Chuva (noite `#0b0a1f → #1a1446`, lima `#c6ff3d`, rosa `#ff4fa3`,
  ciano `#3ee8ff`, dourado `#ffd166`), fonte Fredoka, imagem ocupando a tela com vinheta, item com
  sombra, placar grande, PT e EN (`data-t="pt|en"`), em pé e deitado, 320 px sem rolagem lateral,
  alvos de 44 px, respeita `prefers-reduced-motion`.
- **Segurança:** só arquivos estáticos; CSP por `<meta>` sem script inline; nada de texto de fora
  virando HTML (`textContent`); `sw.js` com cache `peluqueria-vX` que só apaga caches
  `peluqueria-`; `APP_VERSION` (app.js) = `VERSAO` (sw.js) = `versoes.json` (com `"hora"`);
  `manifest.webmanifest`, ícones 192/512.
- **Arquivos previstos:** `index.html`, `estilo.css`, `app.js`, `jogo.js` (puro), `desenho.js`,
  `cenarios.js` + `cenarios/`, `itens.js`, `som.js`, `voz.js`, `sw.js`, `manifest.webmanifest`,
  `icone-192.png`, `icone-512.png`, `versoes.json`, `LEIA-ME.md`, `CREDITOS.md`, `PENDENCIAS.md`,
  `meus/`, `marcar.html`, `musicas/`, `teste/jogo.test.js`, `teste/pagina.test.js`. Na fase 2 entram
  `sala.js`, `libs/supabase.js`, `batida.js`, `esqueleto.js`, `spotify.js`, `config.js`.
- **Testes:** motor puro no Node (pontos por distância, progressão de velocidade, fim de rodada,
  validação); página no Chromium com toques falsos (abre, toque para o item, placar sobe, CSP sem
  violação, tela de 320 px); e o meu teste no celular.

## Onde paramos e o que fazer agora

1. Me pergunte, em uma frase, se o desenho acima está ok para virar especificação. Se eu disser
   "ok", siga sem mais perguntas de brainstorming.
2. Escreva a especificação em `FeatureTesting/docs/superpowers/specs/2026-10-31-peluqueria-design.md`
   (mesmo formato da da Bagunçolândia, incluindo as fases 2 a 5 em resumo), faça a autorrevisão
   (placeholders, contradições, escopo, ambiguidades) e faça commit na branch.
3. Peça minha revisão. Com o ok, use a skill `writing-plans` para
   `FeatureTesting/docs/superpowers/plans/2026-10-31-peluqueria.md`.
4. Implemente a **fase 1** com TDD, em versão `0.1.0`. Rode `node --test peluqueria/teste/*.test.js`
   e `node peluqueria/teste/pagina.test.js` (Chromium e Playwright já vêm instalados na sessão;
   não instale de novo). Atualize `FeatureTesting/index.html` (cartão), `recursos-do-app.json`,
   `ARQUITETURA.md`, `PENDENCIAS.md` do Feature Tester e crie `peluqueria/PENDENCIAS.md`. No portal,
   acrescente os cartões em `bolinho-de-chuva/index.html` e `kids/index.html` e crie
   `tv/peluqueria/index.html`.
5. Commit e push na branch da sessão. Me diga como testar: depois do merge, o endereço será
   `https://solverone.com.br/FeatureTesting/peluqueria/`. Não abra pull request sem eu pedir.
6. Só depois: fases 2, 3, 4 e 5, uma de cada vez, cada uma com especificação curta e minha aprovação.

## O que eu ainda devo

- Fotos realistas: anexar aqui no chat **ou** pedir a lista de prompts para o AI Studio.
- Client ID do Spotify (fase 5), colado só no `config.js` público (nunca o secret).
- Chave do Gemini (fase 4): só no cofre do navegador, nunca no chat.

## Pesquisa de nomes (já feita; não refazer)

Na internet aberta, nenhum jogo chamado Meu Armário, Minha Peruca, Minha Roupa, Peruqueria,
Perucaria, Armário Maluco, Provador Maluco, Armarilândia, Perucolândia, Cai Peruca, Pausa na Peruca.
"Peluquería" aparece em muitos jogos infantis de salão (espanhol). Em inglês, livres: Wig Drop,
Drop the Wig, Closet Drop, Hat Drop; já existem Wig Master, Wig Maker, Closet Organizer, Filter Game.
A pesquisa não cobriu o INPI nem a busca interna das lojas. Escolha final: **Peluqueria**.
