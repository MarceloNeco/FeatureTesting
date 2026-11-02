# FeatureTesting — arquitetura

Laboratório da plataforma SolverONE: cada card do `index.html` é um experimento que roda direto no navegador.
Publicado em https://solverone.com.br/FeatureTesting/ (GitHub Pages). No catálogo do RootifyONE é o app
`feature-tester` (interno: fica fora das listas públicas, mas entra no Controle dos apps desde o RootifyONE 0.18.5).

Antes de mexer, leia o `CLAUDE.md` e a diretriz geral em `.claude/skills/diretrizes-gerais-apps/SKILL.md`.
Pendências: `PENDENCIAS.md`.

## Arquivos

| Arquivo | O que faz | Pode mexer aqui? |
|---|---|---|
| `index.html` | Página do laboratório. A lista `FEATURES` (no fim do arquivo) gera os cards: `ic`, `nome`, `desc`, `url`, `status` (`ativo` ou `breve`). No topo, **📲 Instalar como app** (pedido do próprio navegador no Chrome/Edge/Samsung; passo a passo no iPhone/iPad, Safari do Mac e Firefox) e **⛶ Tela cheia**; instalado no computador, o primeiro toque liga a tela cheia. Textos PT/EN pelo idioma do aparelho. | sim — card novo = um objeto na lista |
| `baguncolandia/`, `peluqueria/`, `vruuum/`, `purpurina/`, `rabiscolandia/`, `danca-na-sala.html` | **Só redirecionam.** Os jogos do Bolinho de Chuva mudaram para o repositório **kids** (solverone.com.br/kids/) em 02/Nov/2026, com o histórico. Cada pasta tem um `index.html` que leva ao endereço novo e um `sw.js` que desliga o service worker antigo (apaga só as cópias do endereço antigo). | **Não** — mexa nos jogos no repositório kids |
| `404.html` | Link antigo de dentro de um jogo (ex.: `peluqueria/marcar.html`) vai para o mesmo lugar em `/kids/`. | Sim |
| `manifest.webmanifest`, `icone-192.png`, `icone-512.png`, `icone-180.png` | Instalar o laboratório como app (ícone 🧪 na tela inicial do celular/tablet ou no computador). Abre em **tela cheia** (`display: fullscreen`; onde o sistema não deixa, cai em janela própria). `icone-180.png` é o ícone do iPhone/iPad (`apple-touch-icon`). | sim |
| `sw.js` | Service worker **mínimo**, registrado pelo `index.html`: só existe para o "Instalar como app" funcionar; não guarda nada em cache (laboratório muda toda hora). | sim, mas continua sem cache |
| `arch-one/` | **ArchONE, o mapa vivo da plataforma (protótipo F0)**, morando aqui por enquanto (decisão do dono, 31/Out/2026) até o portal próprio `arch-one` nascer na F1. Desenha a plataforma a partir dos manifestos `arch-one/manifestos/*.json` (contrato em `rootify-one/docs/specs/arquitetura-json-v1.md`), com Cytoscape.js copiado em `arch-one/lib/` (MIT, licenças ao lado). O original é `rootify-one/docs/specs/mapa-vivo/prototipo/`: mudança de verdade é feita lá e copiada para cá. Interruptor `data-recurso="arch-one"` (`recursos.js` com `data-app="feature-tester"`). Nenhum segredo: os manifestos dizem onde cada chave mora, nunca a chave. | só copiar do rootify-one |
| `recursos.js` | Interruptores do RootifyONE para páginas sem o módulo comum (`SolverRecursos`, `data-recurso`). | **não** — cópia; o master fica no repositório `rootify-one` |
| `recursos-do-app.json` | Lista pública do que este app obedece no Controle dos apps (hoje: `danca-na-sala`, `baguncolandia`, `peluqueria`, `vruuum`, `purpurina`, `rabiscolandia`, `arch-one`). Nada de segredo aqui. | sim — interruptor novo entra aqui e no `data-recurso` da página |
| `testes-modulo-comum.html` | Roteiros de teste do módulo comum 1.9.0 (Fundo, Interruptores/Modo DEUS, Compatibilidade, Feedback); os cards "Teste: …" abrem cada seção. | sim |
| `leitor-ocr.html` | Só redireciona para o Leitor de Comprovantes, que ganhou repositório próprio (https://marceloneco.github.io/leitor-ocr/). | não precisa |
| `CLAUDE.md`, `.claude/skills/diretrizes-gerais-apps/SKILL.md` | Regras do projeto e diretriz geral, copiadas do `rootify-one` ("atualize a diretriz"). | **não** à mão — copiar de novo do `rootify-one` |

## Dança na Sala

Mudou para o repositório **kids** em 02/Nov/2026 (ver `ARQUITETURA.md` de lá).

