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

## Garagem e veículos

- O veículo escolhido fica **sempre à vista**: em pé, preso no topo da tela enquanto as opções rolam; deitado, de um
  lado, com as opções do outro. O botão 🏁 Correr fica preso embaixo. Com 2 jogadores, abas Jogador 1 e Jogador 2.
- **9 veículos**, todos à mostra (desenhados em código no `veiculos.js`, vistos de trás, sem marca nem logotipo):

| Grupo | Veículos |
|---|---|
| 🚗 Carros | Clássico, GT Redondo (traseira redonda), Superesportivo (largo, aerofólio), Kart, Monstrão |
| 🏍️ Moto | Moto (deita nas curvas) |
| ✈️ No céu | Aviãozinho (hélice), Jato (fogo azul no turbo), Helicóptero (rotor girando) |

- Cada um tem um jeito (barrinhas de velocidade e curvas), com diferenças pequenas, de no máximo uns 10%.
- **Quem voa** segue um caminho de luzes no céu, com a estrada lá embaixo. Os obstáculos mudam: pássaros (no lugar dos
  cones), nuvem de tempestade (lama), anel dourado (turbo), corrente de ar (rampa), balões e aviões (trânsito). As
  regras são as mesmas; só o desenho muda. Com 2 jogadores dá para misturar um carro e um avião.

## Controles

| Onde | Como |
|---|---|
| Celular / tablet | segurar o **lado esquerdo ou direito** da tela para virar; **⬆ PULAR** é o botão redondo acima da seta da direita (ou deslizar o dedo para cima). Com 2 jogadores, cada um usa o **seu pedaço** da tela (lado a lado com o aparelho deitado, um em cima do outro em pé). A corrida abre em **tela cheia**, e placar e botões ficam longe do recorte da câmera e dos cantos. |
| Celular como volante (acelerômetro) | sempre ligado com 1 jogador no celular/tablet: **inclinar** para um lado vira o carro; um **toquinho do celular para cima** faz pular. Vale deitado ou em pé, segurando como volante ou mais deitado no colo. O meio é o **reto de verdade** (celular retinho = carro reto), com folga de uns 5° para a mão tremendo; até a 0.3.0 o meio era o jeito de segurar no 3‑2‑1, e isso fazia o carro puxar para um lado. Funciona junto com o toque. No iPhone, ele pede permissão ao tocar em Correr. Com 2 jogadores no mesmo aparelho fica desligado (o celular é de todo mundo). |
| Teclado | 1 jogador: setas ou A/D para virar, ⬆ / W / espaço para pular. 2 jogadores: jogador 1 = **A, D e W**, jogador 2 = **setas e ⬆**. H = buzina, para baixo / S = freio, Esc ou P = pausa. |
| Controle da TV | setas viram, **OK** pula, **Voltar** pausa. No menu, as setas andam entre os botões. |
| Controle de videogame | alavanca ou setas viram; A pula; X buzina; B freia; Start pausa. Dois controles = dois jogadores. |

## Música

A "rádio" do jogo (`som.js`) intercala dois tipos de rock, sem parar:

- **Gravadas** (`musicas/*.mp3`, ~10 MB): 3 de rock de guitarra do **Kevin MacLeod** (incompetech.com): Volatile
  Reaction (a primeira, já no menu), Heroic Age e Unholy Knight, licença **CC BY 4.0**; e 3 do jogo de kart
  **SuperTuxKart**: Kart Grand Prix (Weirwood), Lava (Kalsan) e Las Dunas Champions (ALBatross), licença **CC BY-SA**
  (quem copiar mantém a mesma licença). O menu mostra a música tocando com autor e licença. Detalhes em
  `musicas/LICENCAS.md`.
- **Feitas pelo jogo** (`rock.js`, WebAudio): banda de rock pesado com guitarra base distorcida dobrada, guitarra
  solo com eco, baixo com drive, bateria completa e coro de "Ei!", em 3 músicas próprias: Trovão na Pista
  (138 bpm), Pedal no Fundo (152 bpm) e Motor de Fogo (168 bpm).

A rádio toca duas gravadas e uma feita pelo jogo, sem parar (menu, corrida, pausa e fim); cada corrida começa a próxima. Só silenciam com o app escondido
ou no 🔊. Sem internet: as gravadas ficam guardadas no aparelho depois da primeira abertura (cache próprio
`vruuum-musicas-v1`, que não baixa de novo a cada versão); se uma não estiver guardada, a rádio pula para a próxima.
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
| `musicas/` | as 3 músicas gravadas (MP3, CC BY-SA) e `LICENCAS.md`. |
| `rock.js` | a banda de rock e as 3 músicas (partitura em `MUSICAS`), testadas no Node. |
| `som.js` | motor, buzina e efeitos sintetizados (WebAudio); liga e desliga a música do `rock.js`. |
| `app.js` | menu, controles, tela cheia, bordas seguras, laço da corrida, pausa, resultado, recorde, instalar e baixar. `APP_VERSION` aqui. |
| `movimento.js` | **puro**: acelerômetro → direção do volante e pulo pelo toquinho (com calibração no 3‑2‑1), testado no Node. |
| `baixar.js` | monta o `vruuum.html` de arquivo único (genérico: serve para outro jogo do Bolinho de Chuva; scripts com `data-fora-do-arquivo` ficam de fora). |
| `sw.js` | cache `vruuum-v…` para funcionar sem internet. `VERSAO` aqui. |
| `versoes.json` | novidades de cada versão (PT e EN). |
| `teste/` | testes no Node: `node --test vruuum/teste/*.test.js` (rodar da raiz do repositório). |

A cada versão: subir `APP_VERSION` (`app.js`), `VERSAO` (`sw.js`) e a entrada nova do `versoes.json` (os testes
avisam se diferirem). Arquivo novo entra na lista do `sw.js`. Interruptor do RootifyONE: `data-recurso="vruuum"`.

## Testar no computador

Na raiz do repositório: `python3 -m http.server 8000` e abra http://localhost:8000/vruuum/ no navegador.
