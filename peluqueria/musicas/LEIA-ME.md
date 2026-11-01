# Músicas da Peluqueria

Desde a v0.5.0 o jogo toca **músicas gravadas de verdade**, com licença aberta: 17 músicas de Kevin MacLeod
(incompetech.com), licença **CC BY 4.0** (pode usar em tudo, dando o crédito — o jogo mostra o crédito no menu e
no `CREDITOS.md`). Uma é a **abertura** (toca em laço no menu); as outras tocam **uma por rodada**, embaralhadas.

A lista fica em `musicas.json`, uma linha por música:

```json
{ "titulo": "Show Your Moves", "arquivo": "abertura-show-your-moves.mp3", "bpm": 136, "autor": "Kevin MacLeod", "fonte": "incompetech.com", "licenca": "CC BY 4.0", "abertura": true }
```

- `abertura: true` só em uma (a do menu). `bpm` faz o nome do jogo pulsar no ritmo.
- Para **trocar ou acrescentar** uma música sua: envie o MP3 para esta pasta pelo GitHub (**Add file → Upload
  files**, nome simples, sem espaço nem acento), acrescente uma linha igual no `musicas.json` e clique em
  **Commit changes**. Para tirar uma, apague a linha.
- **Atenção:** o repositório é público. Só música que você pode publicar (feita por você, domínio público,
  Creative Commons com crédito no `CREDITOS.md`). Música famosa de rádio (Katy Perry, Dua Lipa…) **não pode**.
- Dica: arquivos de 2 a 3 MB (MP3 128 kbps) carregam rápido no celular. Cada música fica guardada no aparelho na
  primeira vez que toca; a abertura já vem guardada.
