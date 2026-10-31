# Peluqueria — pendências

Situação: 🟡 aberta · 🔵 em andamento · ⏸ aguardando o dono · ✅ feita (versão)

| # | O quê | Origem | Situação |
|---|---|---|---|
| 1 | Fase 1: jogo no celular (cair e pausar, pontos, UHUL, 12 cenários e 12 itens em vetor, música própria, `meus/`, `marcar.html`, sem internet, TV com o controle). | espec. §12 | ✅ v0.1.0 (testar no celular e na TV LG) |
| 2 | Fotos realistas: o dono anexa fotos no chat **ou** pede a lista de pedidos prontos para gerar no Google AI Studio com a chave dele; entram por `meus/` (ou viram cenários do jogo, com licença no `CREDITOS.md`). A rede da sessão do Claude bloqueia Wikimedia, Pexels, Pixabay e Openclipart. | dono | ⏸ dono |
| 3 | Fase 2: TV com código, celular como controle, dois jogadores em tela dividida, casca `tv-lg-peluqueria/`. | espec. §12 e §14 | ✅ v0.4.0 (testar na TV LG e com 2 celulares) |
| 4 | Fase 3: movimento brusco (braço ou chute) pela câmera do celular para o item. Palma pelo microfone ficou de fora (o movimento brusco já cobre o pedido). | espec. §12 e §14 | ✅ v0.4.0 (calibrar no celular real: sensibilidade do gesto) |
| 5 | Fase 4: minha foto + Gemini (chave só no cofre do navegador; aceite claro antes de a foto ir para o Google; foto de criança = dado sensível). | espec. §12 | ⏸ chave do Gemini (só no cofre) |
| 6 | Fase 5: Spotify como extra (Premium, Client ID do dono no `config.js`; nunca o secret). | espec. §12 | ⏸ Client ID do dono |
| 7 | Teste real na TV LG pelo `/tv/peluqueria` (modo leve, OK do controle, voz). Se travar, abrir com `?tv=auto&debug` e mandar foto da caixa no canto. | entrega v0.1 | ⏸ dono |
| 8 | Músicas, abertura, lugares fora do centro e menu (0.1.1 a 0.3.2), pedidos do dono depois de jogar. | dono | ✅ |
| 9 | Pareamento usa o Supabase: sem internet, TV e celular não se acham (o controle da TV continua jogando). | espec. §14 | 🟡 (ideia: QR + WebRTC local, como a pendência #7 da Bagunçolândia) |
| 10 | Sensibilidade do gesto (0,45 ombro em 0,25 s) definida em teste com esqueleto falso; ajustar depois do teste com crianças de verdade. | espec. §14 | ⏸ dono testar |
