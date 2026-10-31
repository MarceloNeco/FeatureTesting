# FeatureTesting — arquitetura

Laboratório da plataforma SolverONE: cada card do `index.html` é um experimento que roda direto no navegador.
Publicado em https://solverone.com.br/FeatureTesting/ (GitHub Pages). No catálogo do RootifyONE é o app
`feature-tester` (interno: fica fora das listas públicas, mas entra no Controle dos apps desde o RootifyONE 0.18.5).

Antes de mexer, leia o `CLAUDE.md` e a diretriz geral em `.claude/skills/diretrizes-gerais-apps/SKILL.md`.
Pendências: `PENDENCIAS.md`.

## Arquivos

| Arquivo | O que faz | Pode mexer aqui? |
|---|---|---|
| `index.html` | Página do laboratório. A lista `FEATURES` (no fim do arquivo) gera os cards: `ic`, `nome`, `desc`, `url`, `status` (`ativo` ou `breve`). | sim — card novo = um objeto na lista |
| `danca-na-sala.html` | Experimento **Dança na Sala / Living Room Dance**, tudo numa página (ver abaixo). Versão em `APP_VERSION`. | sim |
| `danca-na-sala.webmanifest`, `danca-na-sala-icone.png` | Instalar a Dança na Sala na tela inicial (inclui `share_target` para receber link do Compartilhar do YouTube). | sim |
| `sw.js` | Service worker **mínimo**: só existe para o "Adicionar à tela inicial" funcionar; não guarda nada em cache (laboratório muda toda hora). | sim, mas continua sem cache |
| `tv-lg/` | Casca do app para TV LG (webOS): abre a página publicada com `?tv=auto`. `instalar-lg.py` empacota e instala pelo Modo Desenvolvedor da LG (baseado no free-my-tv, MIT); passo a passo em `tv-lg/LEIA-ME.md`. | sim |
| `arch-one/` | **ArchONE, o mapa vivo da plataforma (protótipo F0)**, morando aqui por enquanto (decisão do dono, 31/Out/2026) até o portal próprio `arch-one` nascer na F1. Desenha a plataforma a partir dos manifestos `arch-one/manifestos/*.json` (contrato em `rootify-one/docs/specs/arquitetura-json-v1.md`), com Cytoscape.js copiado em `arch-one/lib/` (MIT, licenças ao lado). O original é `rootify-one/docs/specs/mapa-vivo/prototipo/`: mudança de verdade é feita lá e copiada para cá. Interruptor `data-recurso="arch-one"` (`recursos.js` com `data-app="feature-tester"`). Nenhum segredo: os manifestos dizem onde cada chave mora, nunca a chave. | só copiar do rootify-one |
| `recursos.js` | Interruptores do RootifyONE para páginas sem o módulo comum (`SolverRecursos`, `data-recurso`). | **não** — cópia; o master fica no repositório `rootify-one` |
| `recursos-do-app.json` | Lista pública do que este app obedece no Controle dos apps (hoje: `danca-na-sala`). Nada de segredo aqui. | sim — interruptor novo entra aqui e no `data-recurso` da página |
| `testes-modulo-comum.html` | Roteiros de teste do módulo comum 1.9.0 (Fundo, Interruptores/Modo DEUS, Compatibilidade, Feedback); os cards "Teste: …" abrem cada seção. | sim |
| `leitor-ocr.html` | Só redireciona para o Leitor de Comprovantes, que ganhou repositório próprio (https://marceloneco.github.io/leitor-ocr/). | não precisa |
| `CLAUDE.md`, `.claude/skills/diretrizes-gerais-apps/SKILL.md` | Regras do projeto e diretriz geral, copiadas do `rootify-one` ("atualize a diretriz"). | **não** à mão — copiar de novo do `rootify-one` |

## Dança na Sala (`danca-na-sala.html`)

A mesma página serve a **TV** e o **celular**:

- **TV** (navegador da LG webOS 6.5, ou o app da pasta `tv-lg/`): "Esta é a TV" mostra um código de 4 letras.
  Toca a música do YouTube em tela cheia e mostra as câmeras por cima, com neon, fogos e clarões
  (suave / forte / desligado, com aviso de fotossensibilidade).
- **Celular**: entra com nome e código; manda a câmera para a TV por **WebRTC ponto a ponto** (STUN do Google,
  sem servidor de mídia) e mede a "energia" por diferença entre quadros (sem IA). Pelo canal de dados do WebRTC
  manda os pontos onde houve movimento. Comandos: link de vídeo ou playlist, tocar, pausar, do início,
  Próxima/Anterior, lista das músicas com nome (oEmbed do YouTube, sem chave). Também há o modo **só o celular**
  (sem TV).
- **Pareamento**: Supabase Realtime do projeto da plataforma, com a URL e a chave **publishable** (públicas por
  desenho). Nenhum segredo no código.
- **Interruptor**: `data-recurso="danca-na-sala"` na tela inicial + `recursos.js` com `data-app="feature-tester"`.
  Desligado no RootifyONE → a tela some.
- **Guardado no aparelho** (`localStorage`, chaves `danca:*`): nome, código, títulos, últimas músicas e a chave
  opcional da YouTube Data API da própria pessoa (`danca:ytkey`, para a busca dentro do app).
- **Bibliotecas de fora**: `supabase-js` (jsDelivr) e a API de iframe do YouTube.

Deixados de fora de propósito, por ser laboratório: módulo `Fundo`, cache offline no `sw.js` e zip de entrega.
