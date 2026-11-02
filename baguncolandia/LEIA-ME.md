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
   🎳 Bagunça de bolas, 🎪 Bagunça total, 🧸 Bagunça na casa), o **ambiente** (🏞️ Paisagem + boneco, com cenário à escolha, ou
   📷 Câmera, em que você aparece na TV), quantas **pessoas** (1 ou 2), quantos **celulares** (1 filmando
   os dois, ou 2), o **tempo** e o **nível**.
5. Toque em **▶ Começar** (ou OK no controle da TV). Siga a **voz e a legenda**: saia da frente da
   câmera, entre e fique parado de braços abertos, levante o braço direito, o esquerdo, chute, pule.
   A legenda fica **vermelha piscando** enquanto falta e **verde** quando a TV entendeu.
6. Contagem 3‑2‑1 e vai! No fim, pódio com confete. ▶ de novo para outra rodada.

**Música**: em 🎵 Música no celular, cole um link do YouTube (vídeo ou playlist); a TV toca num
cantinho. Com tempo "🎵 a música", a rodada dura a música inteira.

**🧸 Bagunça na casa**: cada rodada num lugar (sala, quarto, jardim, cozinha, banheiro ou parquinho), cheio de coisas arrumadas. Bata nelas e
tudo vai bagunçando, sem quebrar: livro cai e abre, torre de blocos desaba, bola quica e sai pela janela aberta, o
lustre balança e muda a cor da luz, o interruptor acende e apaga, a janela abre e fecha devagar, o quadro fica
torto, o cachorrinho anda, late e corre atrás da bola; no jardim, a árvore solta folhas, os passarinhos voam e o
balanço balança. Na cozinha, geladeira e torneira; no banheiro, bolhas de sabão e o papel higiênico que desenrola; no
parquinho, escorregador, gangorra e castelo de areia. Bichos: o **Picolé** (o cavachon da família, desenhado em código),
o gato, o papagaio que fala, a tartaruga e os passarinhos. Nos últimos segundos a mamãe vem chegando. As setinhas ◀ ▶
(nos cantos de baixo; setas no controle da TV) levam ao cômodo vizinho, e cada cômodo guarda a bagunça. Em cada lugar há
aparelhos que funcionam ao toque (TV, pianinho, aquário, móbile, cuco, torradeira, micro-ondas, chuveiro, descarga,
sapo, irrigador, varal, correio, pipa…): a tabela `APAR` do `casa.js`. O Bagunçômetro
(no alto) vai de 0 a 100 %; chegar a 100 % dá bônus. O motor mora em `casa.js`.

**🧹 Arrumar a bagunça** (por enquanto só no jogo com o dedo): no fim do 🧸 aparece o botão "🧹 Arrumar a bagunça", que
arruma a mesma bagunça (todos os cômodos visitados); o modo 🧹 Arrumar começa com uma bagunça sorteada. Arraste cada
coisa: aparece a sombra do lugar certo e, perto dele, ela encaixa. Um toque fecha livro, endireita o quadro, fecha a
geladeira, desliga a torneira e acende a luz; passar o dedo varre as folhas; o que caiu de aparelhos (torrada, carta,
roupa, meia) vai para o cesto 🧺. O que morava no chão vai para **caixas transparentes**, uma por tipo (⚽ bolas, 🧱 blocos,
🧸 brinquedos, 🍳 cozinha, 🧴 banho, 🪣 parquinho); o que mora na prateleira volta para a prateleira. **💡 Dicas: sim / não**
(fica guardado): ligadas, cada lugar vazio tem um tracejado e, depois de 5 s parado, uma seta mostra o próximo. Sem relógio: acaba com festa.

**Música do jogo e botões de som**: o jogo toca música o tempo todo, uma diferente a cada rodada: 13 músicas de
verdade em `musicas/` (domínio público, ver `CREDITOS.md`). Sem internet, toca as que o próprio jogo cria. **🔊** deixa tudo mudo (efeitos, música e voz); **🎵** liga ou desliga só a música. Ficam na coluna
da direita nos modos sem TV e ao lado de ⏸ ⏹ no celular ligado à TV; a escolha fica guardada no aparelho.

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

**👗 Meu boneco**: na tela de entrar (ou em "Meu boneco" dentro da sala), monte o seu avatar, como um boneco
de pano: cabeça (Menino, Menina, Boneco de pano, Elfo, Pequenino, Mago, Cavaleiro, Robô ou qualquer
personagem da turma), cabelo e cor do cabelo, pele, roupa (camiseta, vestido, macacão, capa, túnica,
armadura), cor da roupa, acessório (laço, coroa, tiara, óculos, boné, chapéu, asas, flor) e sapato. A prévia
fica fixa no topo enquanto você escolhe. Boneco 1 e Boneco 2 (para duas pessoas no mesmo celular). Fica
guardado no celular. O desenho do boneco mora em `boneco.js`.

**🤸 Jogar com o corpo (sem TV)**: na tela inicial, caixa "Sem a TV". O jogo roda no próprio celular, com a câmera frontal.

**👆 Jogar com o dedo (sem TV e sem câmera)**: na tela inicial, caixa "Sem a TV". Deite o aparelho. O dedo corta, pega
e chuta; deslize para cima para pular e para baixo para abaixar; o boneco anda com o dedo. 👥 2 = duas
pessoas no mesmo tablet, uma em cada metade. Sem calibração. É a "versão de bolso": no fim, o jogo
convida a chamar a TV e jogar com o corpo todo.

**Suas imagens**: veja `meus/LEIA-ME.md` para colocar as figuras que você quiser no jogo.

## Se a TV travar ou desenhar errado

Abra na TV o endereço com `?tv=auto&debug` no fim (ex.: `solverone.com.br/FeatureTesting/baguncolandia/?tv=auto&debug`).
Aparece uma caixa no canto com a versão, o modo (leve/normal), os quadros por segundo e qualquer erro.
Tire uma foto dessa caixa e mande: é o que falta para achar o problema. O desenho é blindado: se uma parte
(boneco, frutas, placar, legenda) falhar no navegador da TV, as outras continuam.

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
| `casa.js` | modo 🧸 Bagunça: os três lugares, as coisas, a física (cair, quicar, derrubar em cadeia) e os especiais (lustre, janela, interruptor, quadro, cachorro, árvore, passarinhos); `Casa.criar` tem a mesma cara de partida do `jogo.js` |
| `cenas.js` | cenários vetoriais do ambiente Paisagem (praia, floresta, espaço, cidade) |
| `boneco.js` | o boneco personalizável (corpo em pé, cabeças, cabelos, roupas, acessórios, marionete) |
| `sala.js` | pareamento (Supabase broadcast), WebRTC, câmera, visão (diferença entre quadros) |
| `calibrar.js` | calibração guiada: fundo → silhueta → braços → chute → pulo |
| `voz.js` / `som.js` | fala (speechSynthesis, regras SolverONE), sons sintetizados (WebAudio) e as músicas |
| `musicas/` | 13 MP3 de domínio público (FreePD, CC0); lista em `TRILHA` no `som.js` |
| `batida.js` | microfone → batida e BPM (sem IA; `estimarBpm` é pura e testada no Node) |
| `esqueleto.js` | esqueleto por IA (MediaPipe Pose em `libs/mediapipe/`, carregado só quando a pessoa liga); devolve 13 pontos espelhados |
| `spotify.js` / `config.js` | Spotify como controle remoto (PKCE, sem segredo); `config.js` guarda só o Client ID público |
| `sw.js` | cache da pasta; `VERSAO` tem de ser igual a `APP_VERSION` |
| `teste/` | `jogo.test.js`, `figuras.test.js`, `batida.test.js` e `casa.test.js` (Node), `pagina.test.js`, `voltar.test.js`, `som.test.js`, `musica.test.js` e `reacao.test.js` (Chromium) |

Rodar os testes: `node --test baguncolandia/teste/*.test.js` e `node baguncolandia/teste/pagina.test.js`.

A cada versão: subir `APP_VERSION` (app.js), `VERSAO` (sw.js), `versoes.json`, e o `appinfo.json`
da casca LG (`tv-lg-baguncolandia/`) quando mudar algo nela.

## Pendências e ideias

Ver `PENDENCIAS.md`.
