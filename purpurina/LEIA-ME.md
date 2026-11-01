# Purpurina — maquiagem, roupas e muito brilho

Quinta brincadeira da família **Bolinho de Chuva** (Feature Tester · SolverONE), junto com a Bagunçolândia, a
Peluqueria, a Dança na Sala e o Vruuum!. Jogo de **vestir e maquiar** para meninas de uns 10 anos: a criança monta a
personagem, faz a maquiagem, escolhe roupas, acessórios e cenário, faz desafios por tema e desfila.
Funciona com o celular **deitado ou em pé**, sem login, e **sem internet** depois de aberto uma vez.

Endereço (depois do merge): https://solverone.com.br/FeatureTesting/purpurina/ · também pelos cartões em
`solverone.com.br/bolinho-de-chuva` e `solverone.com.br/kids` (TV).

## Como brincar

- Toque em **✨ Toque para brilhar!** (o navegador só deixa tocar som depois de um toque).
- **🎨 Brincar livre**: o estúdio. Embaixo ficam 5 abas: **👧 Eu** (pele, cabelo, olhos), **💄 Maquiagem** (base,
  blush, sombra, delineado, cílios, batom, glitter, adesivos), **👗 Roupas** (vestidos, blusas, saias, calças,
  estampa, sapatos), **💍 Acessórios** (coroas e chapéus, laços, brincos, colares, óculos, bolsas) e **🏞️ Cenário**
  (8 lugares). Cada parte tem estilos (com miniatura do resultado) e bolinhas de cor.
- Na maquiagem, o **pincel vai até o rosto** e a maquiagem aparece com brilho. Tocar na personagem faz ela girar.
- **↩** desfaz a última troca · **🎲** sorteia um visual surpresa que combina (a personagem continua) ·
  **🔄** começa de novo (tira maquiagem, roupa e acessórios; a personagem continua; dá para desfazer).
- **📸 Foto**: monta uma imagem do visual com o cenário e a faixa "Purpurina" e oferece **💾 Salvar no celular**
  (vai para Downloads) e **📤 Compartilhar** (quando o celular deixa; dá para mandar para a galeria ou WhatsApp).
- **💖 Guardar**: guarda o look em **💖 Meus looks** (até 30, só neste aparelho). Lá dá para **👗 Vestir** de novo ou
  apagar.
- **✨ Desfilar!**: passarela com confete, aplausos e 3 jurados (🐱 🦄 🐰).
- **⭐ Desafios** (8): Festa na praia, Baile de princesa, Show de pop star, Piquenique no jardim, Festa do pijama,
  Dia de neve, Festa de aniversário e Sereia no fundo do mar. Cada um começa com a personagem dela e o cenário do
  tema, e mostra **3 dicas** que ganham ✅ na hora. No desfile, cada dica cumprida vale uma estrela; **ninguém
  perde** (sempre pelo menos 1 ⭐). A melhor nota de cada desafio fica guardada no aparelho. O quadro de dicas
  recolhe com um toque.
- O botão **Voltar do celular** volta uma tela (ou fecha a janela da foto) em vez de sair do jogo.

## Controles

| Onde | Como |
|---|---|
| Celular / tablet | tocar nas abas, nas partes e nas opções. Em pé: personagem em cima, painel embaixo. Deitado: lado a lado. Abre em **tela cheia** (no Android) e nada fica embaixo do recorte da câmera. |
| Teclado / controle da TV | setas andam entre os botões (para o lado que apertou), Enter/OK escolhe, Esc/Voltar fecha a janela ou volta uma tela. Com `?tv=auto` (cartão do Kids na TV), tudo um pouco maior. |

## Música

Três músicas próprias de dance-pop (Brilho de Purpurina 128 bpm, Passarela Rosa 136, Laço de Estrela 142), com
estrofe, refrão, sininhos, palmas, viradas e prato, feitas na hora pelo `som.js` (mesmo motor do Vruuum!). Tocam
**o tempo todo**, uma depois da outra; desafio novo e desfile começam a próxima. Só silenciam com o app escondido
(outra aba, tela apagada) ou no 🔊 do menu.

## Instalar, baixar e brincar sem internet

- Depois da primeira abertura com internet, o jogo funciona **sem internet** no mesmo endereço (`sw.js`).
- **📲 Instalar no celular** (no menu, quando o navegador oferece) ou, no Chrome, ⋮ → **Adicionar à tela inicial**.
- **📥 Baixar o jogo (arquivo)**: baixa o `purpurina.html` com tudo dentro (uns 250 KB), que abre direto do celular,
  sem internet e sem login. Os looks guardados no arquivo ficam separados dos do site.

## O que fica guardado (só neste aparelho)

`purpurina.pref` (idioma) · `purpurina.atual` (o visual do brincar livre) · `purpurina.looks` (favoritos) ·
`purpurina.estrelas.<desafio>` (melhor nota). Nada vai para a internet; não há login, cookie nem coleta.

## Mapa dos arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | as telas (entrada, menu, desafios, meus looks, estúdio, desfile, janela). CSP sem script inline. |
| `estilo.css` | visual, em pé × deitado, bordas seguras, animações (respeita "reduzir movimento"). |
| `pecas.js` | **só dados**: paletas, abas, categorias, opções (com `tags`), padrão e os desafios. Peça nova entra aqui. |
| `visual.js` | **puro**: regras (vestido × blusa/saia/calça, nunca sem roupa), surpresa, desfazer, limpar look antigo, dicas e estrelas. |
| `boneca.js` | o desenho em SVG da personagem, das roupas, acessórios e dos 8 cenários (tudo em código). Peça nova = um `case` aqui. |
| `som.js` | músicas e efeitos sintetizados (WebAudio). |
| `app.js` | telas, Voltar do celular, estúdio, pincel e faíscas, foto, looks, desfile, confete, teclado/TV, instalar e baixar. `APP_VERSION` aqui. |
| `baixar.js` | **cópia idêntica** do `vruuum/baixar.js` (o teste confere): monta o `.html` de arquivo único. |
| `sw.js` | cache `purpurina-v…` para funcionar sem internet. `VERSAO` aqui. |
| `versoes.json` | novidades de cada versão (PT e EN). |
| `teste/` | testes no Node: `node --test purpurina/teste/*.test.js` (rodar da raiz do repositório). |

A cada versão: subir `APP_VERSION` (`app.js`), `VERSAO` (`sw.js`) e a entrada nova do `versoes.json` (os testes
avisam se diferirem). Arquivo novo entra na lista do `sw.js`. Interruptor do RootifyONE: `data-recurso="purpurina"`.

## Testar no computador

Na raiz do repositório: `python3 -m http.server 8000` e abra http://localhost:8000/purpurina/ no navegador.
