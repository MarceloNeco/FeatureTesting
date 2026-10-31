# Suas imagens na Peluqueria

Aqui entram as **suas** fotos de fundo (cenários) e os **seus** itens (chapéus, perucas, óculos…). O jogo
continua com os 12 cenários e os 12 itens dele; os seus entram junto quando você liga **Minhas imagens** na
tela de início (o botão só aparece quando esta pasta tem alguma imagem válida).

## Antes de tudo: o que pode

- O repositório é **público**: qualquer pessoa vê o que está aqui.
- Só coloque imagens que você tem o direito de usar (tiradas ou feitas por você, ou com licença livre — anote
  a origem no `CREDITOS.md`).
- **Nunca** coloque foto de pessoa sem a permissão dela, e nunca foto de criança. Fotos pessoais e da família
  entram só na fase 4, guardadas dentro do celular, nunca aqui.

## Cenário (a foto de fundo)

1. Abra no celular ou no computador: `https://solverone.com.br/FeatureTesting/peluqueria/marcar.html`.
2. Toque em **Escolher foto** e escolha a imagem. Ela fica só no seu aparelho; nada é enviado.
3. Deixe marcado **Cenário (foto)**. Toque em **Cabeça** e arraste um quadrado sobre o alto da cabeça
   (o centro do quadrado é onde o chapéu para; a largura é o tamanho dele). Faça o mesmo com **Olhos**,
   **Nariz**, **Boca**, **Mão** (onde a pessoa segura o sorvete, o balão…), **Orelha** (flor, brinco), **Ombro**
   (papagaio) e **Pescoço** (gravata, medalha) — basta um, mas quanto mais lugares, mais itens servem. Se a cabeça estiver torta, use o
   controle **Giro**.
4. Toque em **Copiar**. Embaixo do quadro aparece a linha; veja o nome do arquivo que ela pede
   (ex.: `"arquivo":"vovo-ze.png"`).
5. No GitHub, abra a pasta `peluqueria/meus/`, clique em **Add file → Upload files**, envie a foto **com
   exatamente esse nome** (renomeie antes, se precisar) e clique em **Commit changes**.
6. Ainda em `peluqueria/meus/`, abra `cenarios.json`, clique no lápis ✏️ e cole a linha entre os colchetes.
   Com mais de uma linha, separe com vírgula:

```json
[
  {"id":"vovo-ze","nome":"Vovô Zé","arquivo":"vovo-ze.png","largura":1200,"altura":1600,"lugares":{"cabeca":{"x":0.5,"y":0.21,"tam":0.38,"rot":0}}},
  {"id":"rex","nome":"Rex","arquivo":"rex.jpg","largura":1000,"altura":1000,"lugares":{"olhos":{"x":0.48,"y":0.4,"tam":0.3,"rot":-8}}}
]
```

7. Clique em **Commit changes**. Depois que o site atualizar (uns minutos), abra o jogo e ligue
   **Minhas imagens**.

## Item (chapéu, peruca, óculos…)

Use PNG com **fundo transparente** (ou SVG). Na mesma página, escolha a imagem, toque em **Item**, escolha onde
ele vai (Cabeça, Olhos, Nariz, Boca, Mão, Orelha, Ombro ou Pescoço) e toque no ponto do desenho que deve cair no lugar (a base do chapéu,
a ponte dos óculos, o meio do bigode). Copie a linha, envie a imagem para esta pasta e cole a linha em
`itens.json`, como acima.

Se o item ficar pequeno ou grande demais, acrescente na linha `"escala": 1.5` (maior) ou `"escala": 0.7`
(menor) — vale de 0.3 a 3.

## Se algo der errado

Uma linha com erro é ignorada e o jogo abre normalmente com as imagens dele. Para ver o motivo, abra o jogo
com `?debug` no fim do endereço: `…/peluqueria/?debug`.
