# Suas imagens no Bagunçolândia

1. Coloque nesta pasta as imagens (PNG com fundo transparente fica melhor; também vale SVG, WEBP ou JPG),
   quadradas, de uns 400×400 pixels. Ex.: `vovo.png`, `rex.png`.
2. Abra o arquivo `personagens.json` e liste cada uma, assim:

```json
[
  { "nome": { "pt": "Vovó Lia", "en": "Grandma Lia" }, "arquivo": "vovo.png", "papel": "heroi", "mascote": true },
  { "nome": "Rex", "arquivo": "rex.png", "papel": "vilao" }
]
```

- `papel`: `heroi` (pegar, vale ponto), `vilao` (tira ponto ou vida), `fruta` ou `doce` (cortar), `bola` (chutar),
  `poder` (com `"poder": "x2"`, `"lento"` ou `"chuva"`).
- `mascote: true` faz valer o dobro ao pegar.
- `raio` (opcional, 30 a 70) muda o tamanho na TV.

3. No jogo, deixe ligado **Minhas imagens** em "Quem aparece". Só use imagens que você tem o direito de usar
   (e nunca foto de outra pessoa sem ela concordar).
