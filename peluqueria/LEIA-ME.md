# Peluqueria — o provador maluco da família

Segunda brincadeira da família **Bolinho de Chuva** (Feature Tester · SolverONE). Um item (coroa, bigode,
peruca com óculos…) desce sobre uma imagem (cachorro, tubarão, bebê, vovô…). **Toque em qualquer ponto da
tela** para ele parar. Quanto mais perto do lugar certo, mais pontos.

Endereço (depois do merge): https://solverone.com.br/FeatureTesting/peluqueria/ · na TV:
`solverone.com.br/tv/peluqueria`.

## Como jogar

- Escolha o nível e toque em **Jogar**. Depois do 3‑2‑1 vêm **10 quedas**.
- **Perfeito** = 100 pontos, confete e "UHUL!" · **Bom** = 60 · **Quase** = 30 · **Longe** = 0.
- Acertos seguidos (Perfeito ou Bom) multiplicam: ×1,5, ×2, ×2,5, até ×3. Quase ou Longe voltam para ×1.
- Depois de cada toque o item fica parado 2 s, mostrando o lugar certo (tracejado). Toque de novo para pular.
- ⏸ no canto pausa; ▶ grande continua. Se você sair do app, o jogo pausa sozinho.
- No fim: estrelas (3 com 7 ou mais acertos bons), pontos e recorde do nível (fica só neste aparelho).

| Nível | Como o item cai |
|---|---|
| Criança | devagar, bem na linha do lugar certo, com folga maior |
| Normal | mais rápido, balançando de um lado para o outro |
| Maluco | rápido, balançando mais e girando (giro torto também perde ponto) |

Teclado: **Espaço** ou **Enter** param o item; **Esc** ou **P** pausam. Na TV (`?tv=auto`), o **OK** do
controle para o item e as setas andam entre os botões.

## Instalar e jogar sem internet

No celular, abra o endereço no Chrome, toque nos três pontinhos ⋮ e em **Adicionar à tela inicial**. Depois da
primeira abertura o jogo funciona sem internet.

## Suas imagens e suas músicas

- Fotos e itens seus: `meus/LEIA-ME.md` (com a página `marcar.html`, sem programar).
- Músicas suas (MP3): `musicas/LEIA-ME.md`. Sem elas, tocam as 10 músicas de pop dançante que o próprio jogo cria, em sequência, desde a tela de início.

## Mapa dos arquivos

| Arquivo | O que faz |
|---|---|
| `index.html`, `estilo.css` | a página e o visual (sem script inline) |
| `app.js` | telas, toques, teclado, TV, `?debug`; `APP_VERSION` |
| `jogo.js` | motor puro: queda, balanço, giro, pontos, multiplicador, estrelas, validação |
| `desenho.js` | desenha no canvas (cenário, item, lugar certo, confete, modo leve) |
| `cenarios.js`, `itens.js` | leem e validam `cenarios/`, `itens/` e `meus/` |
| `cenarios/`, `itens/` | os 12 cenários e 12 itens em SVG + listas `.json` |
| `trilhas.js` | as 10 músicas (pop dançante): partitura de cada compasso, testada no Node |
| `som.js`, `voz.js` | toca as músicas e os efeitos (torcida do "u-huuu!") no WebAudio; fala |
| `marcar.html`, `marcar.js` | página para marcar o lugar certo nas suas fotos |
| `sw.js` | guarda tudo no aparelho (cache `peluqueria-v…`); `VERSAO` igual à `APP_VERSION` |
| `teste/` | testes (não vão para o site) e o gerador dos desenhos |

## Testes (para quem programa)

De `FeatureTesting/`:

```bash
node --test 'peluqueria/teste/*.test.js'
```

```bash
node peluqueria/teste/pagina.test.js
```

Para refazer os desenhos: `node peluqueria/teste/desenhar-svgs.js`; para ver todos com os itens no lugar:
`node peluqueria/teste/galeria.js` (gera `/tmp/peluqueria-galeria.png`).
