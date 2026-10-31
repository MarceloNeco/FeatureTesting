# Suas músicas na Peluqueria

Sem nada aqui, o jogo toca a trilha animada que ele mesmo cria (sem arquivo e sem direito autoral).
Se você quiser tocar músicas suas:

1. No GitHub, abra a pasta `peluqueria/musicas/`, clique em **Add file → Upload files** e envie os arquivos
   **MP3** (nomes simples, sem espaço nem acento: `festa.mp3`, `pulo-pulo.mp3`). Clique em **Commit changes**.
2. Abra o arquivo `musicas.json` nesta pasta, clique no lápis ✏️ e liste as músicas assim:

```json
[
  { "nome": "Festa", "arquivo": "festa.mp3" },
  { "nome": "Pulo pulo", "arquivo": "pulo-pulo.mp3" }
]
```

3. Clique em **Commit changes**. Na próxima rodada o jogo sorteia uma delas e toca em laço; os efeitos e a
   voz continuam. Para voltar à trilha do jogo, deixe a lista vazia: `[]`.

**Atenção:** o repositório é público. Só coloque aqui música que você tem o direito de publicar (feita por
você, comprada com licença para isso ou de domínio público). Cada MP3 fica guardado no aparelho na primeira
vez que toca.
