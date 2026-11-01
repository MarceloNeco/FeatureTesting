# Vruuum! — a corrida de carrinho da família

Quarta brincadeira da família **Bolinho de Chuva** (Feature Tester · SolverONE), junto com a Bagunçolândia, a
Peluqueria e a Dança na Sala. Corrida de carrinho em 3D, com curvas e morros: o carro **acelera sozinho**, a
criança só vira para a esquerda e para a direita.

Endereço (depois do merge): https://solverone.com.br/FeatureTesting/vruuum/ · também pelos cartões em
`solverone.com.br/bolinho-de-chuva` e `solverone.com.br/kids` (TV).

## Como jogar

- Toque em **🔑 Toque para ligar o motor!** (o navegador só deixa tocar som depois de um toque).
- Escolha **1 ou 2 jogadores**, o **nível**, a **cor do carro** e o **bichinho piloto**, e toque em **🏁 Correr!**.
- Depois do 3‑2‑1‑VAI!, a corrida dura uns 2 minutos e passa por **4 mundos** (sorteados entre Praia, Floresta,
  Terra dos Doces, Montanha de Neve e Cidade Neon), com um portal na entrada de cada um.
- ⭐ **Estrela** = 1 ponto · 🌈 **Arco-íris** = TURBO por 2,5 s · rampa amarela = **pulo** (no ar dá para pegar as
  estrelas altas e passar por cima de tudo).
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

## Controles

| Onde | Como |
|---|---|
| Celular / tablet | segurar o **lado esquerdo ou direito** da tela. Com 2 jogadores, cada um segura o **seu pedaço** da tela (lado a lado com o aparelho deitado, um em cima do outro em pé). |
| Celular inclinado | no menu (1 jogador), **📱 Inclinar o celular**: o celular vira volante. No iPhone ele pede permissão. |
| Teclado | 1 jogador: setas ou A/D. 2 jogadores: jogador 1 = **A e D**, jogador 2 = **setas**. Para cima / W = buzina, para baixo / S = freio, Esc ou P = pausa. |
| Controle da TV | setas viram, **OK** buzina, **Voltar** pausa. No menu, as setas andam entre os botões. |
| Controle de videogame | alavanca ou setas viram; A buzina; B freia; Start pausa. Dois controles = dois jogadores. |

## Instalar e jogar sem internet

No celular, abra o endereço no Chrome, toque nos três pontinhos ⋮ e em **Adicionar à tela inicial**. Depois da
primeira abertura o jogo funciona sem internet (o `sw.js` guarda a pasta toda no aparelho).

## Mapa dos arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | as telas (entrada, menu, corrida, pausa, fim). CSP sem script inline. |
| `estilo.css` | visual, paleta Bolinho de Chuva, fonte Fredoka. |
| `pista.js` | **puro**: monta a estrada com semente (retas, curvas, morros, mundos), espalha estrelas, cones, lama, turbos, rampas, enfeites e o trânsito. Níveis em `NIVEIS`. |
| `motor.js` | **puro**: regras da corrida (volante, curva, acelerar, grama, coisas da pista, batidas, chegada) e lista de eventos para som e efeitos. |
| `sprites.js` | todos os desenhos, feitos em código uma vez num canvas escondido. |
| `desenho.js` | a estrada em 3D (pseudo-3D por pedaços), céu, fundo, enfeites, carros, efeitos, placar e tela dividida. |
| `som.js` | música, motor, buzina e efeitos sintetizados (WebAudio). |
| `app.js` | menu, controles, laço da corrida, pausa, resultado e recorde. `APP_VERSION` aqui. |
| `sw.js` | cache `vruuum-v…` para funcionar sem internet. `VERSAO` aqui. |
| `versoes.json` | novidades de cada versão (PT e EN). |
| `teste/` | testes no Node: `node --test vruuum/teste/*.test.js` (rodar da raiz do repositório). |

A cada versão: subir `APP_VERSION` (`app.js`), `VERSAO` (`sw.js`) e a entrada nova do `versoes.json` (os testes
avisam se diferirem). Arquivo novo entra na lista do `sw.js`. Interruptor do RootifyONE: `data-recurso="vruuum"`.

## Testar no computador

Na raiz do repositório: `python3 -m http.server 8000` e abra http://localhost:8000/vruuum/ no navegador.
