# FeatureTesting — pendências (lista oficial e viva)

Lista do que ainda falta no laboratório. Item novo entra no fim, com o próximo número (números não mudam nem são
reaproveitados). Criada em 31/Out/2026, com autorização do dono.

**Situações:** 🟡 aberta · 🔵 em andamento · ⏸ aguardando decisão do dono · ✅ feita (com a versão)

> **02/Nov/2026:** os jogos do Bolinho de Chuva (Bagunçolândia, Peluqueria, Vruuum!, Purpurina, Rabiscolândia, Dança na Sala)
> e os atalhos de TV LG mudaram para o repositório **kids** (solverone.com.br/kids/), com o histórico. As pendências deles
> estão lá. Aqui ficam só redirecionamentos para o endereço novo.

| # | Pendência | Origem | Situação |
|---|---|---|---|
| 1 | Dança na Sala: testar no navegador real da LG (WebRTC, desempenho dos efeitos, som do YouTube depois do primeiro OK) | Dono, 0.3.0 (30/Out/2026) | ➡ mudou para o repositório **kids** (#4 lá), em 02/Nov/2026 |
| 2 | Dança na Sala: a playlist "Lara" do dono está privada no YouTube; o app já trata o erro e explica na tela. Para tocar, a playlist precisa ficar pública ou "não listada" | Dono, 0.3.0 | ➡ mudou para o repositório **kids** (#5 lá), em 02/Nov/2026 |
| 3 | Dança na Sala: sincronizar os efeitos com a batida da música (ideia: microfone do celular) | Dono, 0.3.0 | ➡ mudou para o repositório **kids** (#6 lá), em 02/Nov/2026 |
| 4 | Dança na Sala instalada como app de TV (Modo Desenvolvedor da LG, receita do free-my-tv) | Dono, 0.3.0 | ➡ mudou para o repositório **kids** (#7 lá), em 02/Nov/2026 |
| 5 | Interruptor `danca-na-sala` aparecer no Controle dos apps do RootifyONE (o `feature-tester` é interno e ficava de fora) | Registro do experimento (31/Out/2026) | ✅ feita no RootifyONE 0.18.5 (31/Out/2026) |
| 6 | Dança na Sala: a chave da YouTube Data API da pessoa fica em texto aberto no `localStorage` (`danca:ytkey`); a diretriz manda chaves para o cofre comum (`cofre.js`) | Revisão do código (31/Out/2026) | ➡ mudou para o repositório **kids** (#8 lá), em 02/Nov/2026 |
| 7 | Dança na Sala: `supabase-js` vem do jsDelivr sem `integrity`; a diretriz pede hospedar no repositório ou fixar a versão com `integrity` | Revisão do código (31/Out/2026) | ➡ mudou para o repositório **kids** (#9 lá), em 02/Nov/2026 |
| 8 | ArchONE (mapa vivo) publicado aqui como protótipo F0 por decisão do dono (31/Out/2026); sai daqui quando o portal próprio `arch-one` nascer (F1 do mapa vivo, `rootify-one/docs/specs/mapa-vivo-plano-f1.md`). Até lá, mudanças são feitas no original (`rootify-one/docs/specs/mapa-vivo/prototipo/`) e copiadas para `arch-one/` | Dono, 31/Out/2026 | 🔵 em andamento · protótipo no ar; portal próprio aguarda o "pode criar" |
| 9 | Peluqueria: fases 2 a 5 (TV com dois jogadores, palma e braços, minha foto + Gemini, Spotify) e fotos realistas — detalhe em `peluqueria/PENDENCIAS.md` | Dono, 31/Out/2026 | ➡ mudou para o repositório **kids** (#10 lá), em 02/Nov/2026 |
| 10 | Vruuum! (corrida de carrinho): testar com as crianças no celular, no tablet e na TV LG; depois, ideias de TV com o celular como volante e casca LG — detalhe em `vruuum/PENDENCIAS.md` | Dono, 01/Nov/2026 | ➡ mudou para o repositório **kids** (#11 lá), em 02/Nov/2026 |
| 11 | Purpurina (vestir e maquiar): testar com as crianças no celular e no tablet, deitado e em pé; depois, ajustes e ideias (pintar com o dedo, mais penteados, TV) — detalhe em `purpurina/PENDENCIAS.md` | Dono, 01/Nov/2026 | ➡ mudou para o repositório **kids** (#12 lá), em 02/Nov/2026 |
| 12 | Rabiscolândia (desenhar, colorir, pintar por números, mão na câmera, TV): testar com as crianças no celular, no iPad e na TV; depois, IA para deixar o desenho "de verdade" e o resto da lista — detalhe em `rabiscolandia/PENDENCIAS.md` | Dono, 01/Nov/2026 | ➡ mudou para o repositório **kids** (#13 lá), em 02/Nov/2026 |

## Histórico das entregas

- **02/Nov/2026:** página do laboratório instalável como app (📲 Instalar como app, ícone 🧪, abre em tela cheia) e botão ⛶ Tela cheia; `manifest.webmanifest` e ícones novos; o `index.html` passa a registrar o `sw.js`.
- **31/Out/2026:** lista criada com o registro da Dança na Sala (no `main` já na 1.1.0). Fechou o #5 (RootifyONE 0.18.5).
- **31/Out/2026:** 1.4.0 — card e pasta `arch-one/` (ArchONE, mapa vivo, protótipo F0, lido dos manifestos); interruptor `arch-one` no `recursos-do-app.json`. Aberto o #8.
- **31/Out/2026:** card e pasta `peluqueria/` (Peluqueria 0.1.0, fase 1); interruptor `peluqueria` no `recursos-do-app.json`. Aberto o #9.
- **31/Out/2026:** Peluqueria 0.1.1 a 0.4.0 — músicas, abertura, lugares fora do centro, TV com celular como controle e movimento do corpo, 2 jogadores; casca `tv-lg-peluqueria/`.
- **01/Nov/2026:** card e pasta `vruuum/` (Vruuum! 0.1.0, corrida de carrinho, 1 ou 2 jogadores); interruptor `vruuum` no `recursos-do-app.json`. Aberto o #10.
- **01/Nov/2026:** Vruuum! 0.2.0 — botão de pular, 3 músicas animadas sem parar, tela cheia e bordas seguras (deitado ou em pé), 📥 baixar o jogo num arquivo só e 📲 instalar.
- **01/Nov/2026:** Vruuum! 0.3.0 — celular como volante pelo acelerômetro (inclinar vira, toquinho para cima pula) e um botão só para guardar no celular.
- **01/Nov/2026:** card e pasta `purpurina/` (Purpurina 0.1.0, vestir e maquiar, desafios, desfile, foto e looks); interruptor `purpurina` no `recursos-do-app.json`. Aberto o #11.
- **01/Nov/2026:** Purpurina 0.2.0 — aba 💎 Joias (brincos, colares, pulseiras, anéis, broches), zoom no rosto, 8 estilos de cílios, 18 penteados e mechas, roupas e sapatos novos, 2 desafios novos.
- **01/Nov/2026:** Purpurina 0.3.0 — girar a personagem (frente, lado, costas) com rastro de luz, ✕ Tirar peças, mãos com dedos, anel e pulseira só na frente, cabelo por fora do rosto.
- **01/Nov/2026:** Purpurina 0.4.0 — perfil de verdade, unhas, 28 sapatos, 30 penteados, 🚫 em todas as partes e tirar todos, reiniciar, foto em alta e vídeo girando para compartilhar.
- **01/Nov/2026:** Purpurina 0.5.0 — 📺 TV com o celular de controle (até 4 personagens), 🎵 música da Purpurina, YouTube e Spotify.
- **01/Nov/2026:** Purpurina 0.6.0 — volume, sombra macia, fundo desfocado e foto de estúdio renderizada.
- **01/Nov/2026:** Purpurina 0.7.0 — bolsas seguradas na mão com mais detalhe e aviso de versão nova.
- **01/Nov/2026:** Vruuum! 0.7.0 e 0.8.0 — garagem com 9 veículos e voo pelo céu; piloto de costas que vira e sorri; selfie com rosto achado sem internet (MediaPipe), guardada só no aparelho.
- **01/Nov/2026:** card e pasta `rabiscolandia/` (Rabiscolândia 0.1.0: desenhar, livro de colorir, pintar por números, adesivos animados, paisagens, música, mão na câmera e TV com celular de controle); interruptor `rabiscolandia` no `recursos-do-app.json`; modelo da mão `hand_landmarker.task` em `baguncolandia/libs/mediapipe/`. Aberto o #12.
- **01/Nov/2026:** Rabiscolândia 0.1.1 — 23 desenhos de colorir originais e contorno na ordem certa (partes escondidas sem linha atravessando).
- **01/Nov/2026:** Vruuum! 0.9.0 — visual Neon (padrão) com túneis, faróis, luz neon por baixo e postes piscando; Colorido continua como opção.
- **01/Nov/2026:** Purpurina 0.8.0 — giro contínuo (rosto numa esfera, perfil novo arredondado, cabelo girando junto) e nomes curtos nas abas.
- **02/Nov/2026:** Purpurina 0.14.1 — rosto de menina delicado em todos os formatos (sem queixo grande).
- **02/Nov/2026:** Purpurina 0.14.0 — testa em 4 alturas, cabelo cacheado solto com risca no meio, loiro escuro, olhos azul- e verde-acinzentados.
- **02/Nov/2026:** Purpurina 0.13.1 — olhos fininhos (sem dobrinha), fininhos puxadinhos e fechadinhos sorrindo.
- **02/Nov/2026:** Purpurina 0.13.0 — olhos, bocas, narizes, rostos, cabelo armado e 8 armações novas; foto de cinema com IA pronta e escondida (cofre comum, interruptor `purpurina-ia`).
- **02/Nov/2026:** Purpurina 0.12.0 — volta completa de 360° sem pular para as costas (pele do rosto presa na cabeça, cabelo de trás por cima das costas).
- **02/Nov/2026:** Purpurina 0.11.2 — menino com cara de menino (cabelo curto, olhos e sobrancelhas, queixo).
- **01/Nov/2026:** Purpurina 0.11.0 — corpo de perfil de verdade no giro (roupa de lado nas cores escolhidas) e cabelo de trás colado nas costas.
- **01/Nov/2026:** Purpurina 0.10.3 — na TV, "Brincar aqui, sem celular" grande e já selecionado.
- **01/Nov/2026:** Purpurina 0.10.2 — tablet de toque (Amazon Fire) não fica mais preso na tela da TV; página Kids tira o ?tv=auto em tablet.
- **01/Nov/2026:** Purpurina 0.10.1 — giro suave e natural: cabeça feita de volumes 3D, contorno sempre redondinho.
- **01/Nov/2026:** Purpurina 0.10.0 — desfile de verdade: passarela de show com luzes, holofotes, plateia com flashes e fogos; ela anda, sorri, dá tchau, olha para os lados e gira.
- **01/Nov/2026:** Purpurina 0.9.1 — giro sem distorção (cópias do rastro com recortes próprios) e escolher em dois passos (partes → opções).
- **01/Nov/2026:** Purpurina 0.9.0 — 8 músicas pop gravadas (CC BY 4.0 e CC0), olhos piscando, rosto sem sombra escura, menina/menino, 5 rostos, 5 narizes, 39 penteados, cílios, brincos, presilhas e tiaras novas.
- **01/Nov/2026:** Vruuum! 1.0.0 — mãos na câmera (volante no ar), visual Misto, pontos e checkpoints, skate.
- **01/Nov/2026:** Vruuum! 1.1.0 — rivais na corrida (posição e classificação) e 12 personagens de domínio público como pilotos.
- **01/Nov/2026:** Vruuum! 1.2.0 — skate de costas empurrando a rua (12 quadros) e olhadinha para trás com a cabeça girando em 3D.
- **01/Nov/2026:** Vruuum! 1.2.1 — olhar por cima do ombro (rosto de três quartos), cabeça do skatista maior e rivais sem tremer.
- **01/Nov/2026:** Vruuum! 1.3.0 — mais 20 rocks gravados (Kevin MacLeod e HoliznaCC0): 29 músicas no total.
- **02/Nov/2026:** Vruuum! 1.4.0 — mais 10 rocks animados (39 músicas), cabeça 3D cheia e bonita no giro, skatista com proporção de criança.
- **02/Nov/2026:** Vruuum! 1.5.0 — curvas fortes que jogavam para fora consertadas; skatista de lado no skate, com os braços seguindo as curvas.
- **02/Nov/2026:** Vruuum! 1.5.1 — braços do skatista com cotovelo de verdade (abertos e dobrados, contrapeso nas curvas).
- **02/Nov/2026:** Vruuum! 1.6.0 — transições de cor suaves, neon sem nada flutuando (sombras e chão com faixas) e mais 11 personagens (23 no total).
- **02/Nov/2026:** Vruuum! 1.6.1 — piso mudando de cor aos poucos (150–170 pedaços), grade neon acendendo devagar e névoa da distância.
- **02/Nov/2026:** Vruuum! 1.7.0 — túnel em 3D (paredes e teto contínuos, boca em arco) e tudo (postes, pórticos, enfeites, itens, luzes) trocando aos poucos entre dia e noite.
- **02/Nov/2026:** Vruuum! 1.8.0 — sempre abre com 1 jogador, "✕ Só 1 jogador", guia dos controles e corpo de menina ou menino.
- **02/Nov/2026:** 1.4.1 — ArchONE (`arch-one/`) ganha ícone próprio na aba (mini diagrama, igual ao do portal), no lugar do globo genérico.
- **02/Nov/2026:** `telacheia.js` (módulo comum novo, na raiz): botão de tela inteira e volta automática à tela inteira depois de travar o tablet, nos 6 jogos (Purpurina 0.17.0, Vruuum! 1.7.1, Peluqueria 0.6.7, Bagunçolândia 0.8.17, Rabiscolândia 0.1.10, Dança na Sala 1.3.5). Pedido do dono pelo tablet Fire da filha.
