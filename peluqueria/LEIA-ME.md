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

## Jogar na TV (com o celular como controle)

1. Na TV, abra `solverone.com.br/tv/peluqueria` (ou o cartão Peluqueria em `/kids`, ou o app da LG em
   `tv-lg-peluqueria/`). Aparece um **código de 4 letras**.
2. No celular, abra `solverone.com.br/FeatureTesting/peluqueria`, toque em **📱 Sou o controle**, digite o código e o
   seu nome. Até **2 celulares**.
3. No celular: escolha o nível e toque em **Começar**. Para parar o item, toque em **PARAR**.
4. **📷 Usar o corpo**: deixe o celular de pé filmando quem joga. Um **movimento brusco** — levantar um braço ou
   chutar de repente — para o item. Tremidinha e balanço não contam. Na primeira vez baixa ~20 MB (a
   inteligência do corpo, reaproveitada da Bagunçolândia). O vídeo **não sai do celular**.
5. **👯 2 pessoas neste celular** (com o corpo ligado): a pessoa da esquerda é o jogador 1, a da direita o 2.
6. Com 2 jogadores, a TV divide a tela ao meio; no fim, pódio com o vencedor.

Sem celular, o controle da TV joga sozinho: **OK** começa e **OK** para; setas trocam o nível; **Voltar** volta
ao código. O atraso da internet é compensado: vale o instante em que você tocou ou se mexeu.

## Instalar e jogar sem internet

No celular, abra o endereço no Chrome, toque nos três pontinhos ⋮ e em **Adicionar à tela inicial**. Depois da
primeira abertura o jogo funciona sem internet.

## Suas imagens e suas músicas

- Fotos e itens seus: `meus/LEIA-ME.md` (com a página `marcar.html`, sem programar).
- Músicas: 17 gravadas, com licença aberta (Kevin MacLeod, CC BY 4.0). Para trocar ou acrescentar as suas: `musicas/LEIA-ME.md`.

## Mapa dos arquivos

| Arquivo | O que faz |
|---|---|
| `index.html`, `estilo.css` | a página e o visual (sem script inline) |
| `app.js` | telas, toques, teclado, TV, `?debug`; `APP_VERSION` |
| `jogo.js` | motor puro: queda, balanço, giro, pontos, multiplicador, estrelas, validação |
| `desenho.js` | desenha no canvas (cenário, item, lugar certo, confete, modo leve) |
| `cenarios.js`, `itens.js` | leem e validam `cenarios/`, `itens/` e `meus/` |
| `cenarios/`, `itens/` | os 12 cenários e 12 itens em SVG + listas `.json` |
| `som.js`, `voz.js` | toca as músicas gravadas de `musicas/` e os efeitos (torcida do "u-huuu!"); fala |
| `musicas/` | 17 músicas de Kevin MacLeod (CC BY 4.0) e a lista `musicas.json` |
| `marcar.html`, `marcar.js` | página para marcar o lugar certo nas suas fotos |
| `tv.js`, `controle.js` | modo TV (código, 1 ou 2 jogadores, pódio) e celular como controle (PARAR, corpo) |
| `sala.js` | canal TV ↔ celular (Supabase broadcast; `BroadcastChannel` nos testes) |
| `partida.js`, `gesto.js` | puros: partida de 1 ou 2 jogadores; detector de movimento brusco |
| `esqueleto.js` | esqueleto por IA (MediaPipe da pasta da Bagunçolândia) |
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
