# Rabiscolândia — desenhar, colorir e pintar por números

Sexta brincadeira da família **Bolinho de Chuva** (Feature Tester · SolverONE), junto com a Bagunçolândia, a
Peluqueria, a Dança na Sala, o Vruuum! e a Purpurina. App de desenho para crianças que mistura o **livro de colorir**
(contorno grosso e fofo, jeito Bobbie Goods) com o **pintar por números** (jeito Happy Color), com pincéis que mexem,
adesivos animados, paisagens, música e **desenho com a mão** na frente da câmera — no celular, no iPad e na TV.
Sem login, e **sem internet** depois de aberto uma vez.

Endereço (depois do merge): https://solverone.com.br/FeatureTesting/rabiscolandia/ · também pelo cartão em
`solverone.com.br/bolinho-de-chuva`, e na TV por `solverone.com.br/tv/rabiscolandia` (ou o cartão em `solverone.com.br/kids`).

## Como brincar

- **🎨 Desenhar livre**: embaixo ficam o pincel, a cor, o tamanho, o 🪣 balde, a 🧽 borracha, os ⭐ adesivos, o ✋ mover
  adesivo e o 🏞️ fundo, e uma faixa de cores. Tocar no pincel de novo abre todos os pincéis:
  canetinha, lápis, giz de cera, pincel macio, spray e os **✨ vivos**, que mexem sozinhos — 🌈 arco-íris que corre,
  💡 neon que pisca, ✨ purpurina que brilha e 🐛 minhoca que dança (com carinha!).
- **📚 Livro de colorir**: escolha um desenho; o 🪣 balde enche a área sem passar do contorno, e todos os pincéis
  funcionam. **👀 Colinha** mostra como pode ficar; **🎨** troca para outras cores (noite, outono, doce…) — a colinha e
  as cores da faixa mudam juntas.
- **🔢 Pintar por números**: escolha a cor numerada embaixo e toque nas áreas com o mesmo número (a área da cor
  escolhida fica cinza). Um dedo arrasta, dois dedos aproximam. **🪄** leva até uma área que falta. Ao terminar uma
  cor, pula para a próxima; ao terminar tudo, **fogos de artifício** e a foto.
- **⭐ Adesivos**: animados (fogos, sorriso, estrela, coração, bolhas, borboleta, sol, chuva, neve, confete, arco-íris,
  peixe…) e emojis por tema. Escolha **como ele mexe** (parado, pula, balança, gira, pulsa, flutua) e toque na folha.
- **🏞️ Fundo**: papel, cores, **paisagens** (praia com ondas, fundo do mar com bolhas, espaço com estrelas, neve
  caindo…) ou **📷 uma foto sua** (fica só no aparelho).
- **↩** desfaz · **🗑️** limpa a folha ou começa um desenho novo · **📸** foto em PNG para salvar ou compartilhar ·
  **🎵** liga e desliga a música (também no menu, junto do 🔊 dos efeitos).
- **🖼️ Meus desenhos**: tudo fica guardado sozinho enquanto desenha (até 40, só neste aparelho); toque para continuar.

## Em pé ou deitado (folha esperta)

- O **menu não muda de lugar na mão**: no celular deitado, a barra vai para a borda que era o "embaixo" do aparelho
  (direita ou esquerda, conforme o lado que girou). Tablet e computador: barra embaixo. TV: barra à esquerda.
- A **folha não tem fim**. Ao girar: se o que foi desenhado cabe na tela nova do mesmo tamanho, fica igual; se não
  cabe (desenhou em cima e embaixo e deitou), o desenho inteiro continua à vista e a folha cresce para os lados — a tela
  toda vira papel, sem precisar navegar. Dá para desenhar nas partes novas.
- **Zoom**: dois dedos (pinça); **⤢** mostra tudo; no computador e na TV também **🔍+ 🔍−** e a rodinha do mouse.

## 🖐 Desenhar com a mão (câmera)

1. Toque em **🖐** (ou "Desenhar com a mão" no menu). A 1ª vez baixa uns 8 MB (o "cérebro" da mão) e pede a câmera.
2. Fique a 1–2 m da câmera da frente. **✋ Mão aberta** = mira (a bolinha azul anda). **✊ Mão fechada** = pegou o
   pincel e desenha. Abriu a mão = soltou.
3. **Mão aberta parada 1 s em cima de um botão** aperta o botão (o anel amarelo enche) — dá para trocar cor e pincel
   sem encostar. Fechar a mão em cima do botão também aperta.
4. Para a TV: espelhe a tela (Android: Transmitir/Smart View; iPhone/iPad: Espelhar Tela) e deixe o aparelho em pé
   perto da TV. Tudo roda **no aparelho**: a imagem da câmera não sai dele.

## 📺 Na TV, com o celular de controle

1. Na TV, abra **solverone.com.br/tv/rabiscolandia** (ou o cartão em `solverone.com.br/kids`) e aperte **OK**. Aparece um
   **código de 4 letras**.
2. No celular: Rabiscolândia → **📺 Na TV** → **🎮 Controlar a TV** → código e nome. Até **4 celulares** desenham juntos,
   cada um com a sua mira colorida e o seu pincel.
3. Três jeitos de mirar: **👆 Dedo** (a área branca é a TV em miniatura; encostou, desenhou), **📱 Mexer o celular**
   (aponte como controle de videogame; segure **✏️** para desenhar; **🎯** centraliza) e **🖐 Mão na câmera** (o celular
   fica parado perto da TV). Cores, pincéis, ↩, zoom, ⤢, ⭐ adesivo animado na mira e 🎵 também pelo celular.
4. Na TV, o ponteiro do controle da LG (Magic Remote) também desenha direto, e as setas + OK andam pelos botões.

Como funciona: a TV e os celulares trocam mensagens pequenas pela "sala" (`sala.js`, Supabase Realtime da plataforma,
o mesmo canal das irmãs): só a posição da mira (de 0 a 1), "apertado" e comandos. Nada de vídeo, foto nem dado pessoal
(só o nome que a criança digita). Toda mensagem que chega é conferida antes de ser usada.

## O que fica guardado (só neste aparelho)

`rabiscolandia.pref` (idioma, música, efeitos, desenhos terminados, nome no controle) e o banco IndexedDB
`rabiscolandia` (Meus desenhos: miniatura, estado e a pintura em quadradinhos PNG; a foto de fundo, se houver, vai
diminuída junto). Nada vai para a internet; não há login, cookie nem coleta.

## Mapa dos arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | as telas (entrada, menu, livro, meus desenhos, TV, controle, pintar, janela). CSP sem script inline. |
| `estilo.css` | visual; barra embaixo/à direita/à esquerda (classes `barra-*` no `<html>`); respeita "reduzir movimento". |
| `folha.js` | **puro**: mundo 8192 × 8192, vista, folha esperta ao girar, zoom, pinça e lado da barra. Testado no Node. |
| `pintura.js` | o motor: camadas, pincéis (parados e vivos), balde, números, adesivos, fundos, desfazer por quadradinhos, foto, guardar/abrir. Entrada única `M.apontar(fonte, x, y, apertado)` para dedo, mão e celular. |
| `paginas.js` | **só dados**: os desenhos de colorir (formas com número de cor, linhas de detalhe, paleta e variações). Desenho novo entra aqui. |
| `fundos.js` | paisagens desenhadas em código (parte parada + parte viva). |
| `adesivos.js` | emojis, adesivos animados e movimentos. |
| `som.js` | músicas de fundo e efeitos sintetizados (WebAudio). |
| `mao.js` | mão na câmera: regra aberta/fechada e rastreador (puros, testados) + MediaPipe Hand Landmarker. |
| `sala.js` | canal TV ↔ celular; confere toda mensagem. |
| `tv.js` | modo TV (código, até 4 miras) e celular-controle (dedo, giroscópio, mão). |
| `app.js` | telas, barra, painéis, colinha, Meus desenhos, mão na tela, foto, instalar, teclado/TV. `APP_VERSION` aqui. |
| `sw.js` | cache `rabiscolandia-v…` para funcionar sem internet. `VERSAO` aqui. |
| `versoes.json` | novidades de cada versão (PT e EN). |
| `teste/` | testes no Node: `node --test rabiscolandia/teste/*.test.js` (rodar da raiz do repositório). |

Depende de: `../recursos.js` (interruptor `data-recurso="rabiscolandia"`), `../baguncolandia/libs/mediapipe/`
(biblioteca da mão + `hand_landmarker.task`) e `../baguncolandia/libs/supabase.js` (TV) — **não apague** essas pastas.

A cada versão: subir `APP_VERSION` (`app.js`), `VERSAO` (`sw.js`) e a entrada nova do `versoes.json` (os testes
avisam se diferirem). Arquivo novo entra na lista do `sw.js`.

## Testar no computador

Na raiz do repositório: `python3 -m http.server 8000` e abra http://localhost:8000/rabiscolandia/ . Com `?teste`, a TV e
o controle conversam por um canal do próprio navegador (abra duas abas: uma com `?tv=auto&teste`, outra com `?teste`).
