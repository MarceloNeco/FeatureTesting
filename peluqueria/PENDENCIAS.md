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
| 11 | Revisão da 0.4.0 — corrigidos: tela da TV com `inset` (LG antiga), nível pelo protótipo, senha por celular (ninguém se passa por outro jogador), gesto com troca de pessoas / pé fora do quadro / corpo inteiro pulando / pessoa sumindo, gesto valendo pelo começo do movimento, vaga fantasma, TV cheia, câmera presa, tela apagando, celular sem perceber que a TV sumiu, 🏠 no lobby da TV. | revisão | ✅ v0.4.0 |
| 12 | A confirmar na TV LG: o `supabase.js` (o mesmo da Bagunçolândia, que já conectou na sua TV) carrega no navegador da LG. Se a TV disser "Sem conexão com os celulares", abrir `?tv=auto&debug` e mandar foto. | revisão | ⏸ dono testar |
| 13 | Menores deixados (revisão 0.4.0): atraso medido em tempo real × tempo de jogo quando a TV fica lenta; entrar de novo muito rápido com o mesmo código; "2 pessoas" recusado pela TV deixa o celular confuso; esqueleto lento em celular fraco sem barra de progresso; corpo não funciona em iPhone com iOS < 16; o MediaPipe fica guardado duas vezes no aparelho; sem limite de mensagens por segundo na TV. | revisão | 🟡 |
| 14 | Música: a sintetizada levou nota 0,6 ("distorce, pesada, artificial; continuou tocando ao sair da página"). Trocada por 17 músicas gravadas de Kevin MacLeod (CC BY 4.0), volume igualado, parando na hora ao sair da página. | dono | ✅ v0.5.0 (dono ouvir e dar nota; trocar músicas é só mexer em `musicas/musicas.json`) |
