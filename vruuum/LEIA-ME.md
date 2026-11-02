# Vruuum! — a corrida de carrinho da família

Quarta brincadeira da família **Bolinho de Chuva** (Feature Tester · SolverONE), junto com a Bagunçolândia, a
Peluqueria e a Dança na Sala. Corrida de carrinho em 3D, com curvas e morros: o carro **acelera sozinho**, a
criança vira para a esquerda e para a direita e aperta **⬆ PULAR** para passar por cima dos obstáculos.
Funciona com o celular **deitado ou em pé**, sem login, e **sem internet** depois de aberto uma vez.

Endereço (depois do merge): https://solverone.com.br/FeatureTesting/vruuum/ · também pelos cartões em
`solverone.com.br/bolinho-de-chuva` e `solverone.com.br/kids` (TV).

## Como jogar

- Toque em **🔑 Toque para ligar o motor!** (o navegador só deixa tocar som depois de um toque).
- Escolha **1 ou 2 jogadores**, o **nível**, a **cor do carro** e o **bichinho piloto**, e toque em **🏁 Correr!**.
- Depois do 3‑2‑1‑VAI!, a corrida dura uns 2 minutos e passa por **4 mundos** (sorteados entre Praia, Floresta,
  Terra dos Doces, Montanha de Neve e Cidade Neon), com um portal na entrada de cada um.
- ⭐ **Estrela** = 1 ponto · 🌈 **Arco-íris** = TURBO por 2,5 s · rampa amarela = **pulão** (no ar dá para pegar as
  estrelas altas e passar por cima de tudo).
- **⬆ PULAR**: um pulinho de 0,75 s que passa por cima de cone, lama e carrinho; o anel verde em volta do botão
  mostra quando dá para pular de novo (1,3 s).
- **Cone**, **lama** e **carrinhos** deixam o carro mais lento; bater num carrinho faz rodopiar e derruba
  estrelas. **Ninguém perde a corrida.**
- No fim: estrelas, tempo, medalha (🥇 com 40% das estrelas da pista, 🥈 com 20%, 🥉 para todo mundo) e o
  recorde do nível (fica só neste aparelho). Com 2 jogadores, quem pegou mais estrelas ganha o 🏆.
- ⏸ no canto pausa. Se sair do app, pausa sozinho.

| Nível | Como é |
|---|---|
| 🐢 Criança | devagar, curvas suaves, pouco obstáculo; sem mexer no volante o carro volta sozinho para a estrada; bater derruba no máximo 1 estrela e cone não derruba |
| 🚗 Normal | mais rápido, curvas que puxam para fora, mais cones e carrinhos |
| 🚀 Turbo | o mais rápido, curvas fortes, muito trânsito |

## Visual: 🌃 Neon ou 🌈 Colorido

- **Neon** (padrão, escolhido no menu em "Visual"): os mesmos mundos à noite, com céu estrelado e lua, asfalto escuro,
  bordas da estrada em neon (cada mundo com suas cores), faixas acesas e postes de neon piscando. A paisagem fica no
  escuro, só com as luzes. Os veículos têm faróis iluminando a estrada, luz neon por baixo na cor do carro, lanternas
  brilhando e rastro de luz quando estão rápidos; o trânsito tem lanternas acesas. Os itens ficam mais sóbrios: estrela de
  luz sem carinha, portal de turbo em setas de neon e mancha de óleo (no lugar da lama).
- Ainda no Neon: grade de neon no chão dos dois lados, pórticos de neon por cima da estrada a cada ~50 pedaços (no céu,
  aros de luz na rota) e postes altos com braço de luz.
- **Tela**: horizonte a ~30% da altura e base do veículo a 90% (`geom` em `desenho.js`), deitado ou em pé; em pé, a
  estrada se estica para cima (escala de altura `KY` separada da de largura `K`). Durante a corrida a tela fica **travada**
  na posição em que começou (`screen.orientation.lock`, no Android em tela cheia ou instalado); destrava no menu.
- **🔀 Misto** (padrão desde a 1.0): alterna dia (colorido) e noite (neon) a cada 260 pedaços da pista (~8 s), com o céu
  escurecendo e clareando aos poucos (`noiteEm` em `desenho.js`).
- **Colorido**: o visual de dia, com as cores e personagens de antes. Os faróis só acendem dentro dos túneis.
- **Túneis** (nos dois visuais): de 2 a 4 por corrida (`pista.js`, longe dos portais, da largada e da chegada). No chão,
  paredes com faixas de luz correndo e contorno de luz na entrada; lá dentro as paredes seguram o carro na pista. No céu,
  um tubo de anéis de luz em volta da rota.

## Garagem e veículos

- O veículo escolhido fica **sempre à vista**: em pé, preso no topo da tela enquanto as opções rolam; deitado, de um
  lado, com as opções do outro. O botão 🏁 Correr fica preso embaixo. Com 2 jogadores, abas Jogador 1 e Jogador 2.
- **9 veículos**, todos à mostra (desenhados em código no `veiculos.js`, vistos de trás, sem marca nem logotipo):

| Grupo | Veículos |
|---|---|
| 🚗 Carros | Clássico, GT Redondo (traseira redonda), Superesportivo (largo, aerofólio), Kart, Monstrão |
| 🏍️ Moto e skate | Moto (deita nas curvas) e Skate (menino de costas, um pé no shape e o outro empurrando a rua; quanto mais rápido, mais rema) |
| ✈️ No céu | Aviãozinho (hélice), Jato (fogo azul no turbo), Helicóptero (rotor girando) |

- Cada um tem um jeito (barrinhas de velocidade e curvas), com diferenças pequenas, de no máximo uns 10%.
- **Quem voa** segue um caminho de luzes no céu, com a estrada lá embaixo. Os obstáculos mudam: pássaros (no lugar dos
  cones), nuvem de tempestade (lama), anel dourado (turbo), corrente de ar (rampa), balões e aviões (trânsito). As
  regras são as mesmas; só o desenho muda. Com 2 jogadores dá para misturar um carro e um avião.

## O piloto e a selfie

- O piloto fica **de costas**, olhando a estrada: nuca, orelhas e pelo de cada bichinho (no kart e na moto, o capacete
  com listra). A cada ~7 s ele **vira para trás, olha e sorri** por 2 s, e volta. Na garagem vira mais vezes.
  O giro é em **3D**: a cabeça continua redonda e gira como uma bola e olha **por cima do ombro** (uns 130°, rosto de
  três quartos, como uma pessoa de verdade), uma vez por cada lado; no kart e na moto o capacete inteiro gira e o rosto aparece pela viseira. No skate, o piloto é
  a cabeça do menino. Desenhado ao vivo por `cabeca.js`, por cima do veículo, recortado pela janela.
- **📸 Selfie**: na garagem, o botão 📸 abre a janela da selfie. Ali dá para **🤳 Tirar selfie** (câmera da frente) ou
  **🖼️ Escolher foto**. O rosto é achado **sem internet** pelo MediaPipe Face Detector, que roda no aparelho: o motor
  fica em `../baguncolandia/libs/mediapipe/` (~14 MB, baixado na primeira selfie e guardado) e o modelo de rosto em
  `rosto.tflite` (229 KB). Um círculo marca o rosto e dá para arrastar e mudar de tamanho. **✅ Usar este rosto**
  recorta 256×256 e guarda. De costas aparece um cabelo da cor tirada da foto, e de frente, o rosto.
- **Privacidade**: a foto **nunca sai do aparelho**. Fica no `localStorage` (`vruuum.foto.0` e `.1`, ~17 KB cada) e se
  apaga em 📸 → **🗑️ Apagar minha foto**. Sem o detector (aparelho antigo ou arquivo baixado), o círculo começa no
  meio e a pessoa ajusta à mão.

## Rivais e personagens

- **Rivais** (menu "Rivais", ligado por padrão): 3 personagens correm junto (2 com 2 jogadores), sorteados entre os que
  ninguém escolheu, no chão ou no céu como o jogador 1. Eles aceleram, desviam de cone, lama e carrinho (às vezes erram:
  aí ficam mais lentos) e empurram quando encostam. Ficam por perto (quem dispara segura, quem fica para trás acelera),
  para a corrida ser sempre disputada (`moverRival` em `motor.js`). O placar mostra a posição (🏁 2º / 4) e o fim mostra
  a classificação; 1º/2º/3º lugar ganham +800/+400/+200 pontos.
- **Personagens** (`personagens.js`), todos de **domínio público** e desenhados aqui: Emília, Visconde, Saci, Cuca,
  Curupira, Iara, Chapeuzinho, Pinóquio, Alice, Robin Hood, Sherlock e Papai Noel. Podem ser escolhidos como piloto na
  garagem (fileira "Personagens de histórias") e ficam de costas, virando para sorrir, como os bichinhos.
- Personagens de empresas (Mario, Sonic, Disney, DreamWorks, filmes) **não podem entrar**: têm dono.

## Pontos e checkpoints

Ninguém perde a corrida, mas o placar sobe e desce (`PONTOS` em `motor.js`): estrela **+100**, estrela no ar **+200**,
turbo e rampa **+50**, cone **−50**, batida **−150** (nunca abaixo de zero). Cada portal de mundo é um **CHECKPOINT**:
**+500** e mais um bônus de tempo (quanto mais rápido no trecho, mais pontos). Na chegada, **+1.000** com o mesmo bônus,
e mais **+500** para quem chegar primeiro com 2 jogadores. O placar mostra estrelas e pontos; o fim mostra pontos,
estrelas, batidas e tempo, e o **recorde é de pontos** (por nível, só neste aparelho).

## 🙌 Mãos na câmera (volante no ar)

No menu, em "Como dirigir", escolha **🙌 Mãos na câmera**. Ao correr, a câmera da frente liga e uma janelinha no canto
mostra as mãos e o volante (`maos.js`, MediaPipe Hand Landmarker no próprio aparelho; o vídeo não sai dele):

- **duas mãos**, como num volante: a direita mais baixa vira para a direita, a esquerda mais baixa vira para a esquerda;
- **as duas subindo rápido**: pula; **as duas lá embaixo**: freia; **uma mão só**: vale a posição dela para os lados;
- **2 jogadores**: a metade esquerda da câmera é do jogador 1 e a direita do jogador 2;
- **na TV**: ligue o celular, tablet ou notebook na TV (espelhar a tela ou cabo), com a câmera virada para quem joga. A TV
  em si não tem câmera; num próximo passo dá para fazer como a Bagunçolândia (o celular filma e a TV mostra).

## Controles

| Onde | Como |
|---|---|
| Celular / tablet | segurar o **lado esquerdo ou direito** da tela para virar; **⬆ PULAR** é o botão redondo acima da seta da direita (ou deslizar o dedo para cima). Com 2 jogadores, cada um usa o **seu pedaço** da tela (lado a lado com o aparelho deitado, um em cima do outro em pé). A corrida abre em **tela cheia**, e placar e botões ficam longe do recorte da câmera e dos cantos. |
| Celular como volante (acelerômetro) | sempre ligado com 1 jogador no celular/tablet: **inclinar** para um lado vira o carro; um **toquinho do celular para cima** faz pular. Vale deitado ou em pé, segurando como volante ou mais deitado no colo. O meio é o **reto de verdade** (celular retinho = carro reto), com folga de uns 5° para a mão tremendo; até a 0.3.0 o meio era o jeito de segurar no 3‑2‑1, e isso fazia o carro puxar para um lado. Funciona junto com o toque. No iPhone, ele pede permissão ao tocar em Correr. Com 2 jogadores no mesmo aparelho fica desligado (o celular é de todo mundo). |
| Teclado | 1 jogador: setas ou A/D para virar, ⬆ / W / espaço para pular. 2 jogadores: jogador 1 = **A, D e W**, jogador 2 = **setas e ⬆**. H = buzina, para baixo / S = freio, Esc ou P = pausa. |
| Controle da TV | setas viram, **OK** pula, **Voltar** pausa. No menu, as setas andam entre os botões. |
| Controle de videogame | alavanca ou setas viram; A pula; X buzina; B freia; Start pausa. Dois controles = dois jogadores. |

## Música

A "rádio" do jogo (`som.js`) toca dois tipos de rock, sem parar:

- **Gravadas** (`musicas/*.mp3`, 36 músicas, ~67 MB): rock de verdade, com bateria, baixo e guitarra. Na 1.4.0
  entraram mais 10 animados: 4 da banda **Anthem of Rain** (instrumentais, CC BY 4.0), Way of the Samurai do
  HoliznaCC0 e 5 do Kevin MacLeod (RetroFuture Clean, Zap Beat, El Magicia, Gearhead, Bet You Can ver 2). 18 do
  **Kevin MacLeod** (incompetech.com), licença **CC BY 4.0**: Volatile Reaction, Heroic Age, Unholy Knight e, desde a
  1.3.0, Metalmania, Ready Aim Fire, Summon the Rawk, Noise Attack, RetroFuture Nasty, Hotrock, Neolith, Iron Bacon,
  Take the Lead, Exhilarate, Cool Hard Facts, Bet You Can, Pump, Breakdown e What You Want; 5 do **HoliznaCC0**
  (álbum "Rock Montage": Jams, Punk, Americana, Grunge, Classic), **CC0** (domínio público); e 3 do jogo de kart
  **SuperTuxKart**: Kart Grand Prix (Weirwood), Lava (Kalsan) e Las Dunas Champions (ALBatross), licença **CC BY-SA**
  (quem copiar mantém a mesma licença). O menu mostra a música tocando com autor e licença. Detalhes em
  `musicas/LICENCAS.md`.
- **Feitas pelo jogo** (`rock.js`, WebAudio): banda de rock pesado com guitarra base distorcida dobrada, guitarra
  solo com eco, baixo com drive, bateria completa e coro de "Ei!", em 3 músicas próprias: Trovão na Pista
  (138 bpm), Pedal no Fundo (152 bpm) e Motor de Fogo (168 bpm).

A rádio sorteia a ordem das gravadas a cada vez que o jogo abre e põe uma feita pelo jogo a cada 8 gravadas, sem parar (menu, corrida, pausa e fim); cada corrida começa a próxima. Só silenciam com o app escondido
ou no 🔊. Sem internet: as gravadas ficam guardadas no aparelho depois da primeira abertura, uma por vez, em segundo plano
(no 4G ou com economia de dados, só 6; as outras na primeira vez que tocam; cache próprio `vruuum-musicas-v1`, que
não baixa de novo a cada versão); se uma não estiver guardada, a rádio pula para a próxima.
No arquivo baixado (📲 Guardar no celular) tocam só as feitas pelo jogo, para o arquivo continuar pequeno.

## Instalar, baixar e jogar sem internet

- Depois da primeira abertura com internet, o jogo funciona **sem internet** no mesmo endereço (o `sw.js` guarda a
  pasta toda no aparelho).
- **📲 Guardar no celular** (um botão só, no menu): se o navegador deixa instalar, instala com ícone na tela do
  celular; se não deixa (ou a pessoa recusou), baixa o `vruuum.html` com o jogo inteiro dentro (uns 200 KB), que
  vai para **Downloads** e abre direto, sem internet e sem login. O botão some quando o jogo já está instalado ou
  aberto pelo arquivo. Quem monta o arquivo é o `baixar.js`, aqui no aparelho, sempre na versão atual.

## Mapa dos arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | as telas (entrada, menu, corrida, pausa, fim). CSP sem script inline. |
| `estilo.css` | visual, paleta Bolinho de Chuva, fonte Fredoka. |
| `pista.js` | **puro**: monta a estrada com semente (retas, curvas, morros, mundos), espalha estrelas, cones, lama, turbos, rampas, enfeites e o trânsito. Níveis em `NIVEIS`. |
| `motor.js` | **puro**: regras da corrida (volante, curva, acelerar, grama, coisas da pista, batidas, chegada) e lista de eventos para som e efeitos. |
| `veiculos.js` | a garagem: os 9 veículos (desenho, nome, grupo, velocidade e curva), testada no Node. |
| `sprites.js` | todos os desenhos, feitos em código uma vez num canvas escondido. |
| `desenho.js` | a estrada em 3D (pseudo-3D por pedaços), céu, fundo, enfeites, carros, efeitos, placar e tela dividida. |
| `musicas/` | as 36 músicas gravadas (MP3: CC BY 4.0, CC BY-SA e CC0) e `LICENCAS.md`. |
| `rock.js` | a banda de rock e as 3 músicas (partitura em `MUSICAS`), testadas no Node. |
| `som.js` | motor, buzina e efeitos sintetizados (WebAudio); liga e desliga a música do `rock.js`. |
| `app.js` | menu, controles, tela cheia, bordas seguras, laço da corrida, pausa, resultado, recorde, instalar e baixar. `APP_VERSION` aqui. |
| `personagens.js` | os 12 personagens de domínio público (frente e costas) e o sorteio dos rivais, testados no Node. |
| `maos.js` | volante no ar: lê as mãos pela câmera (MediaPipe) e vira direção, pulo e freio; contas testadas no Node. |
| `movimento.js` | **puro**: acelerômetro → direção do volante e pulo pelo toquinho (com calibração no 3‑2‑1), testado no Node. |
| `cabeca.js` | o piloto animado (de costas, vira em 3D como uma bola e sorri; bichinho, selfie ou personagem), testado no Node. |
| `selfie.js` | a selfie: acha o rosto sem internet (MediaPipe + `rosto.tflite`), recorta e guarda só no aparelho. |
| `baixar.js` | monta o `vruuum.html` de arquivo único (genérico: serve para outro jogo do Bolinho de Chuva; scripts com `data-fora-do-arquivo` ficam de fora). |
| `sw.js` | cache `vruuum-v…` para funcionar sem internet. `VERSAO` aqui. |
| `versoes.json` | novidades de cada versão (PT e EN). |
| `teste/` | testes no Node: `node --test vruuum/teste/*.test.js` (rodar da raiz do repositório). |

A cada versão: subir `APP_VERSION` (`app.js`), `VERSAO` (`sw.js`) e a entrada nova do `versoes.json` (os testes
avisam se diferirem). Arquivo novo entra na lista do `sw.js`. Interruptor do RootifyONE: `data-recurso="vruuum"`.

## Testar no computador

Na raiz do repositório: `python3 -m http.server 8000` e abra http://localhost:8000/vruuum/ no navegador.
