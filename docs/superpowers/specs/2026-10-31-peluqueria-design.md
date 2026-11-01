# Peluqueria — especificação (31/Out/2026)

Segunda brincadeira da família **Bolinho de Chuva** dentro do Feature Tester (SolverONE), irmã da
Bagunçolândia. Aberta, sem login, sem cadastro, sem banco, sem cookie, sem anúncio, para todos os planos.
Como é laboratório, o módulo comum `diretrizes.js`, o `Fundo` e o feedback ficam de fora (como na
Bagunçolândia).

## 1. O que é

Jogo no estilo dos "filtros de pausar" do Instagram, mas **com pontos**. Na tela aparece uma imagem de
fundo (um cachorro, um tubarão, um bebê, um vovô…) e um item desce por cima (peruca com óculos, coroa,
bigode…). A pessoa **toca em qualquer ponto da tela** na hora certa para o item parar; quanto mais perto do
lugar certo, mais pontos. Acertou em cheio: confete, voz e "UHUL!". Música animada o tempo todo.

Nome: **Peluqueria** (igual em PT e EN). Subtítulo: "o provador maluco da família" / "the family's crazy
fitting room".

Esta especificação detalha a **fase 1** (jogo no celular). As fases 2 a 5 estão resumidas na seção 12; cada
uma terá a sua especificação curta e a aprovação do dono antes de começar.

## 2. Onde mora

Tudo em `FeatureTesting/peluqueria/` (uma pasta, com service worker próprio):

| Arquivo | O que faz |
|---|---|
| `index.html` | a única página (celular agora; TV na fase 2). Sem script inline (CSP). |
| `estilo.css` | visual |
| `app.js` | telas, toques, teclado, ligação entre motor, desenho, som e voz; `APP_VERSION` |
| `jogo.js` | motor **puro** (sem DOM): rodada, queda, balanço, giro, parada, pontos, multiplicador, estrelas, validação dos catálogos. Testado no Node. |
| `desenho.js` | desenha no canvas: cenário, item com sombra, vinheta, alvo revelado, confete, placar |
| `cenarios.js` | lê e valida `cenarios/cenarios.json` e `meus/cenarios.json` |
| `itens.js` | lê e valida `itens/itens.json` e `meus/itens.json` |
| `cenarios/` | 12 cenários em SVG + `cenarios.json` |
| `itens/` | 12 itens em SVG + `itens.json` |
| `som.js` | música e efeitos sintetizados no WebAudio (sem arquivo, sem direito autoral); toca `musicas/` se houver |
| `voz.js` | fala (`speechSynthesis`) + legenda grande, nas regras de voz SolverONE (copiado da Bagunçolândia e enxugado) |
| `marcar.html` + `marcar.js` | página de apoio para o dono marcar o lugar certo numa foto dele |
| `meus/LEIA-ME.md`, `meus/cenarios.json`, `meus/itens.json` | imagens do dono (começam vazias: `[]`) |
| `musicas/LEIA-ME.md`, `musicas/musicas.json` | MP3s do dono (começa vazio: `[]`) |
| `fontes/` | Fredoka (OFL), copiada da Bagunçolândia |
| `sw.js` | cache `peluqueria-vX` |
| `manifest.webmanifest`, `icone-192.png`, `icone-512.png` | instalar na tela inicial |
| `versoes.json`, `LEIA-ME.md`, `CREDITOS.md`, `PENDENCIAS.md` | versão, instruções para leigo, licenças, pendências |
| `teste/jogo.test.js`, `teste/pagina.test.js` | testes no Node e no Chromium |

Na fase 2 entram, copiados da Bagunçolândia: `sala.js`, `libs/supabase.min.js`, `config.js`; na fase 3
`batida.js`, `esqueleto.js`, `libs/mediapipe/`; na fase 5 `spotify.js`.

Fora da pasta (fase 1):

- `FeatureTesting/index.html`: cartão 💇 "Peluqueria (Bolinho de Chuva)" com `url: "peluqueria/"`.
- `FeatureTesting/recursos-do-app.json`: `{ "id": "peluqueria", "nome": {"pt": "Peluqueria (Bolinho de
  Chuva)", "en": "Peluqueria (Rain Dumpling)"}, "pagina": "peluqueria/" }`. A tela de
  início tem `data-recurso="peluqueria"`, como a Bagunçolândia.
- `FeatureTesting/ARQUITETURA.md` e `FeatureTesting/PENDENCIAS.md`: a nova pasta e as pendências.
- Portal (`marceloneco.github.io`): cartão em `bolinho-de-chuva/index.html` (celular), cartão em
  `kids/index.html` (TV, com `?tv=auto`) e atalho `tv/peluqueria/index.html` (redireciona como o
  `tv/bagunca`).

## 3. Telas e fluxo

1. **Início**: logo "Peluqueria" + subtítulo, três botões grandes de nível (**Criança**, **Normal**,
   **Maluco**; o último escolhido fica marcado), botão **Jogar**, e na faixa de cima: PT|EN, 🔊/🔇 (som),
   ❓ (como jogar, um parágrafo). Se `meus/` tiver imagens válidas, aparece o interruptor **Minhas imagens**
   (liga/desliga; ligado, as imagens do dono entram no sorteio junto com as do jogo).
2. **Contagem** 3‑2‑1 com voz.
3. **Rodada**: 10 quedas (seção 4). No canto, placar (pontos e "3/10"), multiplicador quando houver, e um
   botão ⏸ pequeno (44 px). Com ⏸ o jogo congela e aparece um ▶ grande no meio; tocar no ▶ continua.
4. **Resultado de cada queda**: o item fica congelado onde parou, o lugar certo aparece em contorno
   tracejado, a palavra da categoria aparece grande (PERFEITO! / BOM! / QUASE! / LONGE!) com os pontos, e um
   ▶ médio no canto de baixo, à direita (no meio ele cobria a boca do cenário com o item). Segue sozinho depois de 2 s ou com um toque (os toques nos primeiros
   0,4 s são ignorados, para não pular sem querer).
5. **Fim**: estrelas (0 a 3), pontos, recorde do nível ("Novo recorde!" quando bate), contagem de
   Perfeitos, botões **Jogar de novo** e **Início**.

**Abertura com luz e movimento (v0.3.0):** três holofotes coloridos (lima, rosa, ciano) varrendo a tela,
brilhos piscando, os itens do jogo flutuando e girando ao fundo, o nome com brilho correndo e pulsando na
batida da música, e o botão Jogar pulsando. Tudo só com CSS (leve para a TV; na TV sem brilhos e sem mistura de
cores); com "reduzir movimento" no aparelho, fica parado.

**Menu (v0.2.1):** a rodada tem 🏠 no canto (ao lado do ⏸). O 🏠, o "Início" do fim e o botão **Voltar do
celular** levam ao menu: ao começar a jogar, a página ganha uma entrada no histórico, então o Voltar fecha a
rodada em vez de sair do jogo; no menu, o Voltar sai normalmente.

Teclado (computador e, na fase 1, controle da TV): **Espaço** ou **Enter** = parar o item / seguir;
**Esc** ou **P** = ⏸; setas e Enter navegam nos botões. Com `?tv=auto` a página abre direto no Início, com
o foco no Jogar, letras maiores e o **modo leve** (seção 8), para dar para jogar na TV só com o controle
enquanto a fase 2 não chega.

## 4. Mecânica (o motor, `jogo.js`)

**Coordenadas.** Tudo é medido em frações da imagem do cenário (0 a 1 na largura e na altura), por isso não
depende do tamanho da tela. A **distância** é medida em frações do **lado menor** da imagem.

**Cenário** (entrada de `cenarios.json`):

```json
{ "id": "cachorro", "nome": {"pt": "Cachorro", "en": "Dog"}, "arquivo": "cachorro.svg",
  "largura": 1000, "altura": 1000,
  "lugares": {
    "cabeca": { "x": 0.50, "y": 0.22, "tam": 0.40, "rot": 0 },
    "olhos":  { "x": 0.50, "y": 0.36, "tam": 0.34, "rot": 0 },
    "nariz":  { "x": 0.50, "y": 0.47, "tam": 0.10, "rot": 0 },
    "boca":   { "x": 0.50, "y": 0.56, "tam": 0.26, "rot": 0 }
  } }
```

- `largura`/`altura`: proporção da imagem (para fotos, o tamanho real em pixels).
- `lugares`: um ou mais dos quatro tipos `cabeca`, `olhos`, `nariz`, `boca`. `x`,`y` = onde o ponto de
  encaixe do item deve parar; `tam` = largura que o item terá, em fração da largura da imagem; `rot` = giro
  certo em graus (−45 a 45).

**Item** (entrada de `itens.json`):

```json
{ "id": "coroa", "nome": {"pt": "Coroa", "en": "Crown"}, "arquivo": "coroa.svg",
  "lugar": "cabeca", "encaixe": { "x": 0.5, "y": 0.85 } }
```

- `lugar`: em qual tipo de lugar ele encaixa. `encaixe`: o ponto do próprio desenho (0 a 1) que deve cair
  sobre o lugar certo (ex.: a base da coroa).

**Os 12 itens e o lugar de cada um:** peruca com óculos (olhos), boca de tubarão (boca), coroa (cabeça),
cartola (cabeça), bigode (boca), nariz de palhaço (nariz), óculos escuros (olhos), fone (cabeça), laço
(cabeça), boné (cabeça), chapéu de pirata (cabeça), capacete viking (cabeça).

**Os 12 cenários:** cachorro, gato, tubarão, bebê, vovô, coruja, leão, robô, sapo, cavalo, pinguim, boneco
de neve. Todos têm os quatro lugares, para qualquer item servir em qualquer cenário.

**Lugares fora do centro (v0.3.1, pedido do dono):** além de `cabeca`, `olhos`, `nariz` e `boca`, os lugares
`mao`, `orelha`, `ombro` e `pescoco`. Cada bicho levanta um braço com a mão aberta (asa, nadadeira ou luva), que é a
pista visual de onde o item vai; o lado da mão muda de bicho para bicho e o ombro usado fica do lado oposto.
`orelha` só onde o bicho tem orelha à vista (8 dos 12). Itens novos: sorvete, balão, pirulito, microfone (mão);
flor, brinco (orelha); papagaio, passarinho (ombro); gravata-borboleta, medalha (pescoço). Item pode ter
`escala` (0,3 a 3): largura = `tam` do lugar × escala. **Dificuldade:** Criança só lugares do meio (cabeça,
olhos, nariz, boca, pescoço); Normal metade das quedas de lado (mão, orelha, ombro); Maluco 8 de 10 de lado. O
balanço continua sincronizado: na altura certa o item passa exatamente pelo lugar, mesmo fora do centro.

**Sorteio.** A rodada sorteia 10 pares (cenário, item) com semente: o mesmo cenário não aparece duas vezes
seguidas, nem o mesmo item; cada item usa o lugar do seu tipo naquele cenário. Com "Minhas imagens" ligado,
cenários e itens do dono entram no mesmo sorteio (um item do dono só vai para cenários que tenham o lugar
dele).

**Queda.** O item nasce acima da imagem, todo escondido, e desce em velocidade constante até sair por baixo.
Se sair sem toque, conta como LONGE (0 ponto, som engraçado). A velocidade é medida em "alturas da imagem
por segundo" e sobe 5 % a cada queda da rodada (a 10ª é 45 % mais rápida que a 1ª).

| Nível | Velocidade inicial | Balanço lateral (amplitude, período) | Giro | Tolerância |
|---|---|---|---|---|
| Criança | 0,22 | nenhum: desce bem na linha do lugar certo | nenhum | ×1,5 |
| Normal | 0,32 | 0,08 da largura, 2,2 s, lado sorteado | nenhum | ×1,0 |
| Maluco | 0,42 | 0,15 da largura, 1,6 s, lado sorteado | 120 °/s, oscilando entre −40° e +40° | ×0,8 |

**Sincronia (v0.1.1, pedido do dono):** o balanço e o giro são acertados com a queda. No instante em que o
item chega na altura do lugar certo, ele passa exatamente pelo meio do alvo e reto. Acertar depende só de
tocar na hora certa.

**Parada e pontos.** No toque, o motor calcula a distância *d* entre o ponto de encaixe do item e o lugar
certo, dividida pela tolerância do nível:

| Categoria | *d* (fração do lado menor) | Pontos-base |
|---|---|---|
| PERFEITO | até 0,03 | 100 + confete + "UHUL!" falado e escrito |
| BOM | até 0,08 | 60 |
| QUASE | até 0,15 | 30 |
| LONGE | acima de 0,15 | 0 + som engraçado |

No Maluco, se o giro estiver mais de 25° longe do `rot` certo, a categoria cai um degrau (PERFEITO vira
BOM, e assim por diante).

**Multiplicador.** PERFEITO ou BOM seguidos sobem o multiplicador: ×1, ×1,5, ×2, ×2,5, ×3 (máximo). QUASE ou
LONGE voltam para ×1. Pontos da queda = pontos-base × multiplicador, arredondado.

**Estrelas no fim** (pela quantidade de PERFEITO + BOM nas 10 quedas): 3 estrelas com 7 ou mais, 2 com 4 a
6, 1 com 1 a 3, 0 com nenhuma.

**Recorde**: o maior placar de cada nível fica no próprio aparelho (`localStorage`, chave
`peluqueria-recorde`). É só um número por nível, sem nome nem dado pessoal. Também ficam lá o nível, o idioma,
o som ligado/desligado e o "Minhas imagens". **Nenhuma imagem é salva nem exportada.**

**Interface do motor** (tudo puro, com o tempo passado por quem chama):

- `Peluqueria.criarRodada({ nivel, cenarios, itens, semente })` → estado.
- `Peluqueria.avancar(estado, dt)` → move o item; marca LONGE se saiu da imagem.
- `Peluqueria.parar(estado)` → `{ categoria, pontos, distancia, multiplicador }`.
- `Peluqueria.proxima(estado)` → próxima queda, ou fim.
- `Peluqueria.estrelas(estado)`, `Peluqueria.validarCenario(obj)`, `Peluqueria.validarItem(obj)`.

## 5. Desenho e visual

- Canvas do tamanho da tela (densidade de pixels limitada a 2). A imagem do cenário aparece **inteira**,
  centralizada, o maior possível; a sobra é preenchida pela mesma imagem ampliada e desfocada, mais escura,
  e uma vinheta escura nas bordas. Funciona em pé e deitado; 320 px sem rolagem lateral.
- O item tem sombra suave embaixo e leve brilho; no PERFEITO, confete (lima, rosa, ciano, dourado) e a
  palavra pula.
- Paleta do Bolinho de Chuva: noite `#0b0a1f → #1a1446`, lima `#c6ff3d`, rosa `#ff4fa3`, ciano `#3ee8ff`,
  dourado `#ffd166`. Fonte Fredoka. Placar grande e legível.
- Desenhos em vetor no estilo da Bagunçolândia: formas cheias com gradiente, contorno escuro, brilho, rostos
  fofos e engraçados; fundo de cada cenário com cor própria (praia para o tubarão, neve para o pinguim e o
  boneco de neve, etc.). O lugar certo **não** aparece durante a queda; só depois do toque.
- Textos PT e EN com `data-t`; a língua começa pela do aparelho e fica guardada.
- Botões com no mínimo 44 px; o resultado de cada queda também vai para uma região `aria-live` (leitor de
  tela). Com `prefers-reduced-motion`: sem confete, sem pulos e sem tremida; só cor e texto.

## 6. Música e sons (`trilhas.js` + `som.js`)

- **10 músicas próprias** (v0.2.0, pedido do dono: "estilo pop animado, tipo Last Friday Night ou Hallucinate,
  nada infantil"), em `trilhas.js` (partitura pura, testada no Node) e tocadas por `som.js` no WebAudio: pop
  dançante de pista, 120–130 BPM, bumbo em todas as batidas com "respiro" dos acordes, palmas no 2 e 4,
  chimbal aberto no contratempo, baixo pulsando (4 estilos), acordes cheios, melodia de refrão gerada aqui
  (nenhuma melodia copiada) com eco. Cada música: intro, verso, subida (chiado subindo + virada de caixa),
  refrão, pausa e refrão final (~1 min); depois a lista segue para a próxima.
- **v0.2.1 (dono: "parece uma repetição sem fim de 4 notas", nota 4):** verso e refrão com sequências de
  acordes diferentes, acordes com sétima, refrão de 8 compassos (frase, resposta, parte nova mais aguda e
  fechamento), melodia própria no verso, arpejo, viradas de bateria e de baixo a cada 4 compassos e subida de
  um tom no último refrão; a melodia evita repetir a mesma nota em seguida.
- **v0.4.1 (dono: "cadê a música na introdução? tem que ser a melhor delas, uma nova"):** abertura nova, 136 BPM,
  mi menor (i–VI–III–VII): 2 compassos de "explosão" (bumbo, virada de caixa e tons, chiado subindo), refrão de 8
  compassos com melodia composta nota a nota, ponte, subida e último refrão um tom acima com segunda voz; em laço
  volta ao refrão. **Tela de entrada** "🎵 Toque para começar a festa!": o navegador só deixa tocar som depois de
  um toque; esse toque solta a abertura e mostra o menu. Na TV, a música começa no primeiro botão do controle.
- **v0.3.2 (dono: "mais sofisticadas, umas 15 no mínimo"):** 16 músicas, 6 estilos de bateria (house, disco,
  electro, funk, tropical, synthwave) e 6 timbres de melodia (saw, pluck, square, sino, flauta, metais); acordes
  encadeados (inversão perto do meio da região), segunda voz em terça no último refrão, notas fantasmas na caixa,
  swing em 3 músicas, estéreo (chimbal, arpejo) e eco de ambiente (reverb gerado no próprio jogo).
- **v0.3.0 (dono):** **música de abertura** especial na tela de início (`M.ABERTURA`, 138 BPM, rock elétrico:
  guitarra distorcida em semicolcheias alternando nota pedal e notas que andam, só a guitarra no começo,
  bateria com virada de tons, acordes "power", baixo e melodia; em laço). **Cada rodada toca uma música
  diferente** (a próxima da lista, do começo); a música da rodada segue na tela de fim; o 🏠 volta à abertura.
- Tocam desde a tela de início (a partir do primeiro toque) e pelo jogo todo, sem recomeçar ao entrar na
  rodada; o andamento é o da música −6 BPM no Criança e +6 no Maluco, +1 BPM a cada queda.
- Efeitos: PERFEITO (acorde brilhante + prato) com **torcida sintetizada** "u-huuu!" (várias vozes, plateia e
  assobio; a voz do aparelho soava falsa), BOM, QUASE, LONGE ("fom-fom"), contagem e fim.
- O som só começa depois do primeiro toque (regra dos navegadores). 🔊/🔇 desliga tudo.
- **Músicas do dono**: se `musicas/musicas.json` listar arquivos (`[{ "nome": "…", "arquivo": "festa.mp3" }]`),
  o jogo toca um deles sorteado, em laço, no lugar da trilha sintetizada (os efeitos continuam). Os MP3s não
  vêm pré-carregados: ficam guardados no aparelho na primeira vez que tocam. Sem arquivo, segue a trilha do
  jogo. Instruções em `musicas/LEIA-ME.md`, com o aviso de usar só música que ele pode usar (o repositório é
  público).

## 7. Imagens do dono (`meus/`) e `marcar.html`

- `meus/cenarios.json` e `meus/itens.json` têm o mesmo formato da seção 4, com os arquivos dentro de
  `meus/`. Fotos em JPG, PNG ou WEBP; itens de preferência PNG com fundo transparente; SVG também vale.
- **`marcar.html`**: a pessoa escolhe uma foto do próprio aparelho (a foto **não sai do aparelho**, não é
  enviada nem salva), escolhe o tipo de lugar (cabeça, olhos, nariz, boca), arrasta um quadrado onde o item
  deve parar e, se quiser, gira com um controle deslizante. A página mostra a linha pronta para colar no
  `meus/cenarios.json`, com botão **Copiar**. Cada tipo marcado vai se somando na mesma linha. Para itens,
  a mesma página marca o ponto de encaixe tocando no desenho.
- `meus/LEIA-ME.md` explica, para leigo: onde pôr a foto, como usar o `marcar.html`, como colar a linha,
  e que só vale foto com direito de uso e que **nunca** se põe no repositório foto de pessoa real sem a
  permissão dela (fotos pessoais e de crianças só na fase 4, dentro do celular).

## 8. TV na fase 1 e modo leve

- Com `?tv=auto` (cartão do `/kids` e atalho `/tv/peluqueria`): mesmo jogo, jogado com o controle (OK =
  parar), letras maiores, foco visível. Sem celular e sem dois jogadores (isso é a fase 2).
- **Modo leve** (lição da pendência #12 da Bagunçolândia): liga sozinho com `?tv=auto`; sem desfoque no
  fundo (só a cor do cenário), sem sombra desfocada, confete com poucas peças, canvas na resolução 1×.
- `?debug` mostra na tela a versão, o fps e os erros.

## 9. Segurança

- Só arquivos estáticos. Sem login, conta, banco, cookie ou telemetria. Nada sai do aparelho.
- **CSP** por `<meta>` em `index.html` e `marcar.html`: `default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self';
  connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none';
  form-action 'none'`. Nenhum script inline, nenhum `style=""` no HTML. O `'unsafe-inline'` de estilo existe só porque o
  `recursos.js` comum (interruptores do RootifyONE) injeta um `<style>` para esconder o que o dono desliga.
- Nada de texto de fora vira HTML: nomes e textos sempre por `textContent`.
- **Validação dos catálogos** (`validarCenario`/`validarItem`): `id` só com letras minúsculas, números e
  hífen (até 30); `arquivo` só nome simples terminando em `.svg`, `.png`, `.jpg`, `.jpeg` ou `.webp` (sem `/`,
  sem `..`); `nome` texto ou `{pt,en}` com até 30 letras; números dentro dos limites (0 a 1; `tam` de 0,03 a
  1; `rot` de −45 a 45; `largura`/`altura` de 1 a 8000); tipo de lugar só dos quatro. Entrada inválida é
  ignorada (com aviso no `?debug`), sem quebrar o jogo. No máximo 60 cenários e 60 itens do dono.
- Imagens (inclusive SVG do dono) são carregadas como imagem, nunca inseridas no HTML; assim nenhum script
  dentro delas roda.
- **Service worker** `sw.js`: cache `peluqueria-v<VERSAO>`; ao ativar apaga só os caches que começam com
  `peluqueria-` e não são o atual; código (HTML, JS, CSS, JSON) rede primeiro com 4 s de espera, depois
  cache; imagens, fontes e MP3 cache primeiro. Na instalação guarda todos os arquivos do jogo (sem os MP3).
  Depois da primeira abertura funciona sem internet.
- `APP_VERSION` (`app.js`) = `VERSAO` (`sw.js`) = `versoes.json` (com `"data"` e `"hora"` de Brasília). O
  teste confere que os três são iguais.
- Wake Lock só durante a rodada, quando o navegador tiver.

## 10. Créditos

Todos os cenários, itens e ícones são desenhados nesta conversa, em vetor, e liberados com o código. Fonte
Fredoka (SIL OFL 1.1). Nenhuma foto, música ou desenho de terceiros na fase 1. `CREDITOS.md` lista tudo e
explica a regra para fotos futuras (licença limpa, listada ali).

## 11. Testes

- `teste/jogo.test.js` (Node, `node --test peluqueria/teste/*.test.js`): categorias nos limites (0,03 /
  0,08 / 0,15) e com a tolerância de cada nível; giro de mais de 25° derrubando um degrau no Maluco;
  multiplicador subindo até ×3 e zerando; velocidade +5 % por queda; LONGE quando o item sai sem toque;
  rodada com 10 quedas e fim; sorteio sem repetir cenário nem item seguidos e igual com a mesma semente;
  estrelas nos limites; validação rejeitando `arquivo` com `/` ou `..`, extensão estranha, número fora do
  limite, tipo de lugar desconhecido, nome longo; catálogos de `cenarios/` e `itens/` passando na validação
  e todos os 12 cenários com os 4 lugares; versões iguais nos três arquivos; lista do `sw.js` com todos os
  arquivos que existem.
- `teste/pagina.test.js` (Chromium com Playwright, `node peluqueria/teste/pagina.test.js`): abre com
  `?teste` (relógio controlado pelo teste e semente fixa), escolhe nível, joga uma rodada inteira com toques
  falsos na hora certa (placar sobe, aparece PERFEITO) e na hora errada (LONGE); ⏸ congela e ▶ continua;
  Espaço e Enter param o item; fim mostra estrelas e "Jogar de novo"; PT↔EN troca os textos; nenhum erro nem
  violação de CSP no console; em 320 px de largura sem rolagem lateral; `marcar.html` abre e gera a linha
  com uma imagem de teste; `?tv=auto` liga o modo leve.
- No celular do dono: abrir, instalar na tela inicial, jogar os três níveis, desligar a internet e jogar de
  novo. Na TV LG: abrir `/tv/peluqueria` e jogar com o controle.

## 12. Fases

1. **v0.1 — Jogo no celular** (esta especificação): cair e pausar, pontos, UHUL, 12 cenários e 12 itens em
   vetor, música própria, `meus/`, `marcar.html`, `musicas/`, instalável e sem internet, TV só com o
   controle, cartões e atalho.
2. **v0.2 — TV e dois jogadores**: a TV mostra um código; o celular entra e vira controle (toque para
   parar), pareamento copiado da Bagunçolândia (`sala.js`, Supabase broadcast com chave publishable,
   WebRTC canal `jogo`, validação de toda mensagem, máximo 4 celulares). Dois jogadores: **tela dividida ao
   meio**, mesmo par cenário/item para os dois, quem chega mais perto ganha a queda, placar lado a lado e
   pódio. Casca `tv-lg-peluqueria/`. O espelhamento de tela continua sendo do celular (Smart View etc.).
3. **v0.3 — Corpo**: **palma** pelo microfone (a partir dos "ataques" de som de `batida.js`) e **braços
   levantados** pela câmera (`esqueleto.js`, MediaPipe Pose hospedado, baixa só quando a pessoa liga, com
   aviso do tamanho ≈20 MB) também param o item. Microfone e câmera só por toque; nada sai do aparelho.
4. **v0.4 — Minha foto + Gemini**: só no celular, a pessoa escolhe uma foto dela; a chave do Gemini fica
   só no cofre do navegador (padrão `cofre.js`); aviso claro de que a foto vai para o Google e aceite antes;
   foto de criança tratada como dado sensível (LGPD), com aceite do responsável; a IA ajeita a foto
   (centralizar, sorrir); a foto e os lugares ficam só no aparelho e nunca no repositório.
5. **v0.5 — Spotify como extra**: controle remoto copiado da Bagunçolândia (PKCE, precisa Premium e o
   Client ID do dono no `config.js`; em modo de desenvolvimento, só até 25 pessoas cadastradas). Sem Client
   ID, o botão não aparece e a música própria continua sendo o padrão.

## 13. Fora do escopo da fase 1

Pareamento com a TV, dois jogadores, palma e braços, foto pessoal e IA, Spotify, YouTube (não pedido),
fotos realistas (entram depois pela pasta `meus/`, enviadas pelo dono ou geradas por ele no Google AI
Studio), salvar ou compartilhar a imagem engraçada.

## 14. Fases 2 e 3 juntas (v0.4.0): TV, celular como controle, corpo e dois jogadores

Pedido do dono (31/Out/2026): "versão para a TV em que um movimento brusco — levantar o braço esquerdo ou
direito, chutar — para o item; tremidinha não". Decisões (o dono pediu "faça na ordem e nas melhores práticas,
sem me consultar"):

- **Papéis na mesma página.** No Início, um botão **📺 Jogar na TV** abre a TV (ou `?tv=auto`, usado pelo
  `/kids`, por `/tv/peluqueria` e pela casca `tv-lg-peluqueria/`). A TV mostra um **código de 4 letras** e o
  endereço; o celular toca em **📱 Sou o controle**, digita o código e o nome. O controle da TV continua valendo:
  OK começa e OK para o item do jogador 1.
- **Só mensagens, sem vídeo.** Diferente da Bagunçolândia, a TV não precisa ver a câmera: o celular manda só
  avisos ("parar", "começar", nível). Canal: Supabase Realtime *broadcast* (`peluqueria-<código>`), com a mesma
  URL e chave **publishable** (pública por desenho) da Bagunçolândia; nada de WebRTC. Toda mensagem passa por
  `Peluqueria.validarMensagem` (tipos da lista, nome ≤ 14 letras, números limitados); nomes por `textContent`.
  No máximo 2 celulares por sala; durante a rodada ninguém novo entra.
- **Atraso compensado.** O celular acerta o relógio com a TV (ping a cada 2 s, guarda o de menor ida e volta)
  e manda o **instante** do gesto no relógio da TV. A TV para o item onde ele estava naquele instante
  (`Peluqueria.parar(estado, atraso)`, atraso limitado a 0,5 s). Quem acerta a hora ganha o PERFEITO mesmo com
  a internet lenta.
- **Corpo (no celular).** Botão **📷 Usar o corpo** liga a câmera do celular e o esqueleto por IA da
  Bagunçolândia (MediaPipe Pose, reaproveitado de `../baguncolandia/libs/mediapipe/`, ~20 MB baixados uma vez,
  com aviso). `gesto.js` (puro, testado) acompanha pulsos e tornozelos: vale um **movimento brusco** — a ponta do
  membro anda pelo menos 0,45 "largura de ombros" em até 0,25 s, a pelo menos 2,2 larguras/s; tremida e
  balanço lento não valem. Depois de um gatilho, 0,7 s de espera. O vídeo nunca sai do celular. O toque na tela
  do celular continua valendo.
- **Dois jogadores.** Com 2 celulares (ou 1 celular filmando 2 pessoas: a da esquerda é o jogador 1), a TV
  divide a tela ao meio: a mesma sequência de quedas para os dois, cada um com o seu item, pontos e
  multiplicador; a próxima queda vem quando os dois pararam (ou o item passou). No fim, pódio com o vencedor.
  `partida.js` (puro, testado) coordena 1 ou 2 jogadores.
- **Testes sem internet.** Com `?teste`, o canal é um `BroadcastChannel` do próprio navegador: o teste abre a TV
  e o celular em duas abas e joga de verdade, com esqueleto falso injetado.
- **TV LG.** Casca `tv-lg-peluqueria/` (como a da Bagunçolândia), modo leve na TV.
- Fora: vídeo do jogador na TV, mais de 2 jogadores, palma pelo microfone (o movimento brusco já cobre o pedido).
