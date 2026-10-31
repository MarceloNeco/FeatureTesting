# Bagunçolândia — Bolinho de Chuva · SolverONE

Jogo de sala para a família: a TV mostra frutas, doces, bolas e personagens; quem joga corta, pega e
chuta **com o corpo**, filmado pelo celular. Uma ou duas pessoas. Aberto, sem cadastro, sem banco,
sem cookie, sem anúncio. É a primeira brincadeira da família **Bolinho de Chuva**.

Endereço: `https://solverone.com.br/FeatureTesting/baguncolandia/` (atalho para digitar na TV:
`solverone.com.br/tv/bagunca`).

## Como jogar (passo a passo)

1. **Na TV**: abra o navegador, digite `solverone.com.br/tv/bagunca` e aperte **📺 Esta é a TV**.
   A TV carrega tudo (0 a 100 %) e mostra um **código de 4 letras**.
2. **No celular**: abra o mesmo endereço, aperte **📱 Este é o celular**, digite o seu nome e o código.
   Deixe a câmera ligar (o celular pergunta uma vez).
3. **Apoie o celular** deitado, virado para quem vai jogar, a uns 2 metros, com luz boa.
4. No celular, escolha o **modo** (🍉 Corta-corta, 🎈 Pega-pega, ⚽ Chuta-chuta, 🪵 Pula e abaixa,
   🎳 Bagunça de bolas, 🎪 Bagunça total), o **ambiente** (🏞️ Paisagem + boneco, com cenário à escolha, ou
   📷 Câmera, em que você aparece na TV), quantas **pessoas** (1 ou 2), quantos **celulares** (1 filmando
   os dois, ou 2), o **tempo** e o **nível**.
5. Toque em **▶ Começar** (ou OK no controle da TV). Siga a **voz e a legenda**: saia da frente da
   câmera, entre e fique parado de braços abertos, levante o braço direito, o esquerdo, chute, pule.
   A legenda fica **vermelha piscando** enquanto falta e **verde** quando a TV entendeu.
6. Contagem 3‑2‑1 e vai! No fim, pódio com confete. ▶ de novo para outra rodada.

**Música**: em 🎵 Música no celular, cole um link do YouTube (vídeo ou playlist); a TV toca num
cantinho. Com tempo "🎵 a música", a rodada dura a música inteira.

**Música da sala pelo microfone**: em 🎵 Música, toque em **🎤 Seguir a música da sala** e deixe o celular
ouvir (ele pede o microfone uma vez). Toque qualquer música em qualquer aparelho: o jogo acelera no ritmo
e as bordas da TV pulsam na batida. O som não sai do celular.

**Spotify como controle remoto** (precisa de Spotify Premium e de um cadastro seu, uma vez só):

1. Entre em https://developer.spotify.com/dashboard com a sua conta do Spotify e clique em **Create app**.
2. Preencha: *App name* = `Bagunçolândia`; *App description* = `Controle remoto do jogo de sala`;
   *Redirect URIs* = `https://solverone.com.br/FeatureTesting/baguncolandia/` (exatamente assim, com a
   barra no fim) e clique em **Add**; em *Which API/SDKs are you planning to use?* marque **Web API**;
   aceite os termos e clique em **Save**.
3. Na tela do app, clique em **Settings** e copie o **Client ID** (uma sequência de letras e números).
   **Não** use o *Client secret*: o jogo não precisa dele e ele nunca deve ir para o código.
4. No GitHub, abra o arquivo `baguncolandia/config.js`, clique no lápis ✏️ e cole o Client ID entre as
   aspas de `spotifyClientId: ''`. Salve (Commit changes).
5. Pronto: no celular, em 🎵 Música, aparece **🟢 Entrar no Spotify**. Entre, escolha em que aparelho
   tocar (o app do Spotify precisa estar aberto nele) e uma playlist. A TV mostra o nome da música e o
   jogo pausa a música no fim da rodada. Ligue também o 🎤 para seguir a batida.

**Esqueleto por IA** (⚙️ Mais → 🦴): mais preciso. O chute só vale com o pé, cada mão corta por conta
própria, o boneco vira marionete e a calibração não é necessária. Baixa uns 20 MB uma vez (o celular
pergunta antes; melhor no Wi-Fi) e fica guardado. Pede mais do celular: em aparelho fraco, deixe desligado.

**Só o celular (sem TV)**: na tela inicial, 🎧. O jogo roda no próprio celular, com a câmera frontal.

**Suas imagens**: veja `meus/LEIA-ME.md` para colocar as figuras que você quiser no jogo.

## Segurança (como foi pensado)

- Só arquivos estáticos. Nada roda em servidor da SolverONE; nada é gravado.
- O vídeo vai do celular para a TV **pelo Wi-Fi de casa** (WebRTC) e nunca por servidor.
- O pareamento usa o canal público do Supabase (chave *publishable*, que não dá acesso a nada) só
  para mensagens pequenas de "me acha". A TV só aceita celular novo antes da rodada começar, até 4.
- Toda mensagem recebida é conferida (`Bagunca.validar`) antes de ser usada; textos nunca viram HTML.
- CSP na página: só scripts do próprio site e do YouTube; sem script inline.
- Depois da primeira vez, TV e celular abrem a cópia guardada no aparelho (`sw.js`).

## Arquitetura (onde mexer)

| Arquivo | Para quê |
|---|---|
| `index.html` | a única página (TV e celular); sem script inline |
| `estilo.css` | visual (paleta noite + lima/rosa/ciano/dourado, fonte Fredoka) |
| `app.js` | fluxo: TVApp (carregar, capa, lobby, calibrar, contagem, rodada, pódio, YouTube) e CelApp (entrar, controles, calibração no celular). `APP_VERSION` aqui. |
| `jogo.js` | motor puro (sem DOM): física, acertos, pontos, combos, vidas, poderes, validação de mensagens. Testável no Node. |
| `desenho.js` | pinta o estado no canvas da TV: figuras, cortes, suco, rastros, placar, legendas, pódio |
| `figuras.js` | catálogo de figuras (SVG): frutas, doces, bolas, turma própria, clássicos de domínio público, `meus/` |
| `cenas.js` | cenários vetoriais do ambiente Paisagem (praia, floresta, espaço, cidade) |
| `sala.js` | pareamento (Supabase broadcast), WebRTC, câmera, visão (diferença entre quadros) |
| `calibrar.js` | calibração guiada: fundo → silhueta → braços → chute → pulo |
| `voz.js` / `som.js` | fala (speechSynthesis, regras SolverONE) e sons sintetizados (WebAudio) |
| `batida.js` | microfone → batida e BPM (sem IA; `estimarBpm` é pura e testada no Node) |
| `esqueleto.js` | esqueleto por IA (MediaPipe Pose em `libs/mediapipe/`, carregado só quando a pessoa liga); devolve 13 pontos espelhados |
| `spotify.js` / `config.js` | Spotify como controle remoto (PKCE, sem segredo); `config.js` guarda só o Client ID público |
| `sw.js` | cache da pasta; `VERSAO` tem de ser igual a `APP_VERSION` |
| `teste/` | `jogo.test.js`, `figuras.test.js` e `batida.test.js` (Node), `pagina.test.js` (Chromium) |

Rodar os testes: `node --test baguncolandia/teste/*.test.js` e `node baguncolandia/teste/pagina.test.js`.

A cada versão: subir `APP_VERSION` (app.js), `VERSAO` (sw.js), `versoes.json`, e o `appinfo.json`
da casca LG (`tv-lg-baguncolandia/`) quando mudar algo nela.

## Pendências e ideias

Ver `PENDENCIAS.md`.
