# Desenho Meu — desenho (sexta brincadeira do Bolinho de Chuva)

Pedido do dono (01/Nov/2026, por voz): app de desenho para crianças, "mistura de Bobbie Goods e Happy Color",
otimizado para celular e iPad, desenhar na TV com a mão (mão aberta = cursor; mão fechada = "pegou" e desenha),
controlar também pelos movimentos do celular, animações (fogos, sorrisos, coisas que mexem), adesivos, paisagens e
fundos para pintar em cima, zoom com os dedos (e botão de zoom na TV), em pé e deitado com a folha que se ajusta.
"Comece agora, faça os PRs e o merge; vou melhorando a cada versão."

## Onde mora

`FeatureTesting/desenho-meu/` (como Purpurina, Vruuum!, Peluqueria), cartão em `solverone.com.br/bolinho-de-chuva`,
cartão de TV em `solverone.com.br/kids` e atalho `solverone.com.br/tv/desenho`. Interruptor `data-recurso="desenho-meu"`.
Sem login, sem banco, sem coleta: tudo no aparelho. Funciona sem internet depois de aberto uma vez (`sw.js`).

## O que entra na 0.1.0

1. **Folha livre** com pincéis: lápis, giz de cera, canetinha, pincel macio, spray, borracha, balde de tinta
   e pincéis **vivos** (animados): arco-íris que corre, neon que pulsa, purpurina que pisca, minhoca que dança.
2. **Livro de colorir** (jeito Bobbie Goods): desenhos de contorno grosso e fofo; pinta com qualquer pincel e com o
   balde, que respeita o contorno.
3. **Pintar por números** (jeito Happy Color): o mesmo desenho com números; escolhe a cor nº X, toca na área, ela
   enche; ao terminar, festa com fogos.
4. **Adesivos**: emojis (bichos, comida, natureza, veículos…) e adesivos **animados** desenhados em código (fogos,
   sorriso que pisca, estrela, coração, bolhas, borboleta, sol, chuva, neve, confete, arco-íris, peixe…), com
   movimento escolhido (parado, pula, balança, gira, pulsa, flutua). Dá para arrastar depois (✋).
5. **Fundos**: papel, cores e paisagens desenhadas em código, algumas com movimento (praia com ondas, fundo do mar
   com bolhas, espaço com estrelas, neve caindo…), e **📷 foto** da galeria para pintar em cima (não sai do aparelho).
6. **Folha esperta (em pé ↔ deitado)**: o menu fica sempre no mesmo lugar físico do aparelho (no celular deitado, a
   barra vai para a borda que era "embaixo"), e o desenho se ajusta: se o que foi desenhado cabe na tela nova, fica do
   mesmo tamanho; se não cabe (desenhou em cima e embaixo e deitou), a folha cresce para os lados e o desenho inteiro
   continua à vista, sem precisar navegar. Pinça com dois dedos para zoom; botões 🔍+ 🔍− ⤢ na TV e no computador.
7. **Mão na câmera** (🖐): MediaPipe Hand Landmarker no próprio aparelho (modelo de 7,8 MB, só baixa quando liga).
   Mão aberta = mira; mão fechada = desenha; mão aberta parada 1 s em cima de um botão = aperta (dá para trocar cor e
   pincel sem encostar). Imagem espelhada.
8. **TV com o celular de controle**: a TV abre `?tv=auto` e mostra um código; o celular conecta (mesma "sala"
   Supabase Realtime das irmãs) e escolhe como mirar: 👆 tela do celular (touchpad), 📱 mexer o celular (giroscópio,
   como um controle de videogame de apontar) ou 🖐 mão na câmera do celular. Cor, pincel, desfazer e zoom vão pelo
   celular também. Só pontos e comandos passam pela sala — nunca imagem da câmera.
9. **Meus desenhos**: guarda no aparelho (IndexedDB), abre de novo, salva PNG e compartilha.
10. PT e EN, Voltar do celular volta uma tela, instalar na tela inicial.

## Decisões e suposições (para o dono confirmar)

- Nome: "Desenho Meu" (o dono disse "alguma coisa assim"). Troca de nome é só texto.
- "Dobra de tamanho" foi entendido como a **folha** que cresce ao deitar (o desenho inteiro continua à vista e a tela
  toda vira papel), não como o desenho ficar maior e sair da tela.
- Na TV, o jeito mais simples continua sendo **espelhar** a tela do celular/iPad (o modo 🖐 funciona no próprio
  aparelho). O modo TV + celular de controle é para quando a TV abre o site sozinha.
- Mão: "fechar a mão" = desenhar. Apontar com um dedo ficou para depois (pendência).
- Os desenhos de colorir são originais, feitos em código (nenhum desenho da Bobbie Goods/Happy Color é copiado).

## Arquivos

| Arquivo | Papel |
|---|---|
| `folha.js` | puro: mundo 2048×2048, vista (escala e deslocamento), "folha esperta" ao girar, pinça, zoom. Testado no Node. |
| `paginas.js` | só dados: desenhos de colorir (formas com número de cor + linhas de detalhe) em caixa 1000×1000. |
| `fundos.js` | paisagens desenhadas em código: parte parada (desenhada uma vez) e parte viva (por quadro). |
| `adesivos.js` | catálogo de emojis, adesivos animados e movimentos; desenha um adesivo num instante t. |
| `pintura.js` | motor: camadas, pincéis, balde, desfazer, números, adesivos, desenho na tela, PNG. |
| `mao.js` | MediaPipe Hand Landmarker + regra "aberta/fechada" (parte pura testada no Node). |
| `sala.js` | canal TV ↔ celular (cópia do jeito da Purpurina; valida toda mensagem). |
| `tv.js` | modo TV e celular-controle (touchpad, giroscópio, mão). |
| `app.js` | telas, barra de ferramentas, galeria, Voltar do celular, instalar. `APP_VERSION`. |
