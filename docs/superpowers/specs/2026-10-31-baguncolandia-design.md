# Bagunçolândia — especificação (31/Out/2026)

Primeira brincadeira da família **Bolinho de Chuva** (brincadeiras de casa com movimento) dentro do
Feature Tester (SolverONE). Cartão de visita: aberto, sem login, sem cadastro, sem banco.

## 1. O que é

Jogo de sala para 1 ou 2 pessoas. A TV mostra o jogo; o celular filma quem joga, manda o vídeo
para a TV pelo Wi‑Fi e mede onde a pessoa se mexe. Coisas voam pela TV e a pessoa **corta**
(frutas e doces), **pega** (personagens) ou **chuta** (bolas) com o corpo. Nome: **Bagunçolândia**
(EN: *Mayhemland*). Irmão do Dança na Sala 0.9.0, que não é tocado.

## 2. Onde mora

Tudo dentro de `FeatureTesting/baguncolandia/` (uma pasta, para o service worker próprio cobrir só
ela e o jogo carregar do aparelho depois da primeira vez):

| Arquivo | O que faz |
|---|---|
| `index.html` | a única página: serve TV e celular (como no Dança). Sem script inline (CSP). |
| `estilo.css` | visual (TV e celular) |
| `sala.js` | pareamento por código, canal Supabase, WebRTC, câmera e medição de movimento — copiado do Dança 0.9.0 e endurecido (seção 9) |
| `jogo.js` | motor do jogo na TV: modos, física, acertos, placar, rodada, dificuldade; **puro** (sem DOM) para testar no Node |
| `desenho.js` | desenha o jogo no canvas da TV: palco, figuras, cortes, partículas, placar, legendas |
| `figuras.js` | catálogo de frutas, doces, bolas e personagens em SVG (turma própria + domínio público) e leitura de `meus/personagens.json` |
| `voz.js` | fala (speechSynthesis) + legenda grande na TV; fala na TV quando ela tem voz, senão o celular fala |
| `calibrar.js` | calibração guiada (seção 6) — roda no celular, mostra na TV |
| `som.js` | sons sintetizados no WebAudio (corte, pegou, erro, pontos, música de carregamento em laço): nenhum arquivo de áudio, nada com direito autoral |
| `batida.js` | microfone do celular → batida/BPM da música que toca na sala (fase 3) |
| `spotify.js` | controle remoto do Spotify (fase 3; desligado sem Client ID) |
| `config.js` | Client ID do Spotify (vazio = botão não aparece). Nada secreto. |
| `sw.js` | cache da pasta (versão), rede primeiro para o código, cache primeiro para fontes e imagens |
| `manifest.webmanifest`, `icone-512.png`, `icone-192.png` | instalar na tela inicial |
| `libs/supabase.min.js` | cópia hospedada do supabase-js (MIT) — só o canal de pareamento |
| `fontes/` | fonte Fredoka (OFL), hospedada |
| `meus/personagens.json` + imagens | as figuras do dono (seção 5) |
| `versoes.json`, `LEIA-ME.md`, `CREDITOS.md`, `PENDENCIAS.md` | versão, instruções para leigo, licenças, pendências |
| `teste/jogo.test.js`, `teste/pagina.test.js` | testes no Node e no Chromium |

Fora da pasta: cartão no `index.html` do Feature Tester, `recursos-do-app.json` (interruptor
`baguncolandia`), `tv-lg-baguncolandia/` (casca para a TV LG que abre a página com `?tv=auto`),
cartão no Portal (`marceloneco.github.io`) e atalho curto `solverone.com.br/tv/bagunca`.

## 3. Fluxo

1. **TV** abre `…/FeatureTesting/baguncolandia/` → "Esta é a TV" → **carregamento 0–100 %** (uma
   melancia que vai enchendo, música sintetizada de fundo, lista do que está carregando) →
   **capa** com código de 4 letras e o endereço.
2. **Celular** abre a mesma página → "Este é o celular" → nome + código → câmera liga → aparece
   na TV.
3. **Lobby** na TV: jogadores conectados, modo, jogadores (1 ou 2), celulares (1 ou 2), duração.
   Escolhas feitas no celular (botões grandes) ou no controle da TV (Enter = começar com o padrão).
4. **Calibração** (seção 6) de cada jogador, com voz e legenda.
5. **Rodada**: contagem 3‑2‑1, jogo, placar, combos; fim com pódio e confete; "Jogar de novo".
6. "Só o celular (sem TV)": o jogo roda no próprio celular, com a câmera de fundo (modo treino).

## 4. Os modos

- **🍉 Corta‑corta** — frutas e doces sobem em arco e caem. Movimento forte passando por cima
  corta: duas metades voam, suco em partículas, "+10". Pimentão Bravo e Bombeta tiram 1 vida de 3
  (a bomba apaga a tela por 1 s). 3+ numa passada = combo (×2, ×3…). Errar 3 frutas sem cortar
  não tira vida (criança).
- **🎈 Pega‑pega** — personagens descem de balão, paraquedas ou passam voando. Movimento em cima
  = pegou (+15). Vilões tiram 5. Alguns dão poder: 🐌 tempo lento 5 s, 🌧 chuva de frutas, ✖2.
- **⚽ Chuta‑chuta** — bolas e personagens rolam ou quicam pelo chão do palco. Só movimento na
  **zona de chute** conta (fase 1: terço de baixo da silhueta calibrada; fase 4: o pé). Trave que
  muda de lugar: chutar a bola para a trave = gol (+30).
- **🎪 Bagunça total** — os três misturados, trocando a cada 20 s.

Rodada: 60 s, 90 s, 2 min ou "a música inteira". Velocidade e quantidade sobem com o tempo e com
a batida (seção 7). Dificuldade: Criança / Normal / Maluco.

## 5. Figuras

Três fontes, todas no mesmo catálogo (`figuras.js`), cada uma com nome PT/EN, papel (fruta,
doce, bola, herói, vilão, poder) e desenho:

1. **Turma própria da SolverONE** (SVG, desenhados aqui): Melancino, Donatella, Morangão, Bananito,
   Kiwi Ninja, Pipoquinha, Sorvetão, **Bolinho de Chuva** (mascote; pegar vale dobro), Estrelinha
   (poder), Capitão Chute (bola com cara); vilões Pimentão Bravo, Bombeta, Chuvisco (nuvem que
   molha a tela).
2. **Domínio público** (desenhados em vetor a partir das versões livres, com fonte no
   `CREDITOS.md`): Steamboat Willie (1928), Popeye (tira de 1929), Alice, Pinóquio, Dom Quixote.
3. **Suas imagens**: `meus/personagens.json` com `[{ "nome": {"pt":"…","en":"…"}, "arquivo":
   "fulano.png", "papel": "heroi" | "vilao" | "fruta" }]`. O jogo lê ao carregar; PNG/SVG com fundo
   transparente. Instruções no `LEIA-ME.md`. Nunca imagem de pessoa real sem permissão.

Na tela de lobby: "Quem joga hoje?" com as três turmas ligadas/desligadas.

## 6. Calibração guiada (voz + legenda)

Roda no celular (visão) e aparece na TV (legenda grande, piscando em vermelho enquanto falta,
verde quando reconheceu) com voz. Sem IA: fundo + silhueta por diferença.

1. "Saia da frente da câmera por um instante" → o celular grava o fundo (1,5 s quieto).
2. "Agora entre e fique parado, de braços abertos" (🔴 piscando) → diferença contra o fundo dá a
   silhueta; quando a silhueta está estável por 1,5 s → 🟢 "Te vi, <nome>!" + caixa da pessoa
   (cabeça, braços, pernas estimados pela proporção da caixa).
3. "Levante o braço direito" → movimento na zona do braço direito → ✅ (idem esquerdo).
4. "Chuta com um pé" → movimento na zona das pernas → ✅.
5. "Pula!" → movimento grande → ✅ "Pronto! Vamos jogar?"
   Cada passo tem 10 s; se não vier, "Tudo bem, vamos assim mesmo" e segue. Dá para pular.

A caixa calibrada define a **zona do jogador** (2 pessoas, 1 celular: cada um na sua metade) e a
**zona de chute**. Voz: `speechSynthesis` na TV se existir (o navegador da LG nem sempre tem);
senão o celular fala. Legenda sempre, em PT/EN. Respeita `prefers-reduced-motion` (sem piscar;
só muda a cor).

## 7. Música

- **YouTube na TV** (copiado do Dança: link, playlist, histórico, ⏯ ⏪ ⏩). Rodada "a música
  inteira" acompanha o vídeo.
- **Qualquer música da sala** (fase 3): o celular ouve pelo microfone, estima BPM e manda pulsos
  de batida pelo canal direto; a TV acelera e lança coisas na batida. Funciona com Spotify, rádio,
  caixinha. Microfone só com toque; o áudio não sai do celular.
- **Spotify controle remoto** (fase 3): entra com a conta (PKCE, sem secret; precisa Premium),
  escolhe playlist e aparelho (celular, caixinha, app da TV); o jogo manda tocar/pausar e mostra
  nome e capa. O som não toca dentro do jogo (limite do Spotify no navegador da TV). Sem Client ID
  no `config.js`, o botão não existe. Token só em `sessionStorage`, nunca em link.

## 8. Visual

Palco noite: gradiente `#0b0a1f → #1a1446`, bordas em neon, partículas suaves. Cores dos
jogadores: lima `#c6ff3d` e rosa `#ff4fa3`; dourado `#ffd166` para pontos; ciano `#3ee8ff` para
poderes. Fonte Fredoka (arredondada, OFL). Frutas com volume (gradientes, brilho, contorno
escuro), corte com rastro branco, suco em partículas, metades girando. Câmera da pessoa como fundo
semitransparente com vinheta e rastro de luz na cor do jogador onde ela se mexe. Placar com
números que pulam; combo em letreiro; pódio com confete. Celular: compacto, sem rolagem lateral em
320 px, botões 44 px, PT/EN. Tudo respeita `prefers-reduced-motion`.

## 9. Segurança (primeiro lugar)

- **Nada roda no servidor da SolverONE**: só arquivos estáticos. Sem login, sem conta, sem banco,
  sem cookie, sem telemetria. O jogo não grava nada sobre a pessoa; o nome fica só no aparelho.
- **Pareamento**: canal Supabase Realtime de *broadcast* com a chave publishable (pública por
  desenho; não dá acesso a tabela nenhuma). Mensagens pequenas; depois que os celulares
  conectam, tudo vai pelo canal direto celular↔TV (WebRTC) e o canal do servidor fica quieto.
- **Endurecimento**: a TV só aceita celular novo no lobby (durante a rodada ignora `join`/`offer`
  de id desconhecido); toda mensagem passa por um validador (tipo da lista, nome ≤ 14 letras,
  números limitados, SDP/ICE só do tipo esperado); nome e textos sempre por `textContent` (nunca
  `innerHTML` com dado de fora); limite de 4 celulares por sala; `eventsPerSecond` 20.
- **CSP** por `<meta>`: `default-src 'self'`; `script-src 'self' https://www.youtube.com`;
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.youtube.com
  https://accounts.spotify.com https://api.spotify.com`; `frame-src https://www.youtube.com`;
  `img-src 'self' data: blob: https://i.ytimg.com https://i.scdn.co`; `media-src 'self' blob:`;
  sem `unsafe-inline` para scripts.
- **Carrega local**: service worker com a lista da pasta; segunda abertura não baixa nada (TV e
  celular). YouTube e Spotify só quando a pessoa escolhe.
- Permissões: câmera e microfone só por toque, com explicação antes. Wake Lock só durante a
  rodada.
- Limite honesto: sem internet nenhuma, celular e TV não se acham (o aperto de mão inicial precisa
  de ~2 s de internet). Pendência: pareamento 100 % local.

## 10. Fases

1. **v0.1** Corta‑corta, 1 jogador, 1 celular, carregamento, calibração, YouTube, turma própria,
   SW, cartão no Feature Tester e no Portal, casca LG, testes.
2. **v0.2** Pega‑pega, Chuta‑chuta, Bagunça total, 2 jogadores (1 e 2 celulares), domínio
   público, `meus/`, "só o celular".
3. **v0.3** Batida pelo microfone, Spotify controle remoto.
4. **v0.4** Esqueleto com IA (MediaPipe Pose hospedado, baixa só quando a pessoa liga, com
   aviso de tamanho), chute só com o pé, mão esquerda/direita.

## 11. Testes

- `teste/jogo.test.js` (Node): física, acerto de corte/pega/chute com pontos simulados, combo,
  vidas, fim de rodada, validador de mensagens (rejeita tipo desconhecido, nome longo, SDP
  estranho).
- `teste/pagina.test.js` (Chromium): abre a página como TV com `?teste`, injeta pontos de
  movimento falsos, confere placar, calibração passo a passo, CSP sem violação no console.
- Na sua TV (a cada fase): parear, calibrar, uma rodada de cada modo, 2 jogadores, fechar o celular
  no meio (TV avisa), reabrir (volta).

## 12. Acréscimo de 31/Out/2026 — Ambientes, boneco e missões (pedido do dono)

- **Ambiente** é uma escolha no celular: **Câmera** (a pessoa aparece espelhada na TV, como na v0.1) ou
  **Paisagem** (cena desenhada em SVG, leve: praia, floresta, espaço, cidade) com um **boneco** da turma que
  acompanha a criança. Avaliação: o vídeo serve bem para cortar e pegar (a pessoa se vê), mas não faz
  sentido para obstáculos (ela não "bate" em nada); a paisagem com boneco fica mais bonita, mais leve e
  deixa as missões de pular e abaixar serem de verdade. Recomendação: Paisagem como padrão a partir da v0.2.
- **Como o boneco segue sem IA**: a calibração já guarda o fundo; o celular passa a mandar, 10× por segundo,
  a **caixa da silhueta** (x, y, largura, altura) junto com os pontos de movimento. Boneco: posição = centro da
  caixa; **pulo** = o topo da caixa sobe mais de 12 % da altura; **abaixar** = a altura cai abaixo de 70 % da
  calibrada; **braço levantado** = movimento na zona do braço. Com o esqueleto por IA (v0.4) vira marionete.
- **Missões novas**: 🪵 **Pula e abaixa** (troncos baixos e galhos altos chegando pelo lado, cada vez mais
  rápido; a voz avisa "pula!"/"abaixa!"; errar tira vida) e 🎳 **Bagunça de bolas** (dezenas de bolas quicando;
  encostar vale ponto, bomba tira). Entram na Bagunça total.
