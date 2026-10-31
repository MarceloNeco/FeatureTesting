# Bagunçolândia — pendências

Situação: 🟡 aberta · 🔵 em andamento · ⏸ aguardando o dono · ✅ feita (versão)

| # | O quê | Origem | Situação |
|---|---|---|---|
| 1 | Ambiente **Paisagem + boneco**: cenas em SVG (praia, floresta, espaço, cidade) e um personagem da turma que anda, pula, abaixa e levanta os braços seguindo a silhueta da criança (sem IA: caixa do corpo contra o fundo calibrado). Opção "Ambiente: Câmera / Paisagem" no celular. | dono, 31/Out/2026 | ✅ v0.2.0 |
| 2 | Missão **Pula e abaixa**: obstáculos chegando pelo lado (tronco baixo = pular, galho alto = abaixar), com voz avisando. | dono, 31/Out/2026 | ✅ v0.2.0 |
| 3 | **Bagunça de bolas**: muitas bolas quicando; encostar vale ponto, bomba tira. | dono, 31/Out/2026 | ✅ v0.2.0 |
| 4 | Batida pela música da sala (microfone do celular → BPM → velocidade do jogo). | espec. v0.3 | ✅ v0.3.0 |
| 5 | Spotify como controle remoto (PKCE, Premium). Código pronto na v0.3.0; só liga quando o dono colar o Client ID em `config.js` (passo a passo no LEIA-ME). | espec. v0.3 | ⏸ Client ID do dono |
| 6 | Esqueleto por IA (MediaPipe Pose hospedado; baixa só quando a pessoa liga): chute só com o pé, mão esquerda/direita, boneco marionete completo. | espec. v0.4 | ✅ v0.4.0 (testar no celular real: precisão e bateria) |
| 7 | Pareamento 100 % sem internet (hoje o "me acha" inicial usa o Supabase por ~2 s). Ideia: QR na TV com a oferta WebRTC + resposta digitada/QR no celular. | espec. §9 | 🟡 |
| 8 | Juntar o motor de pareamento com o Dança na Sala num `sala-tv.js` comum (depois que os dois estiverem estáveis). | espec. §2 | 🟡 |
| 9 | Teste real na TV LG do dono (casca `tv-lg-baguncolandia/`): voz existe no navegador da LG? música de carregamento toca sem toque? | entrega v0.1 | ⏸ dono |
| 10 | Mais brincadeiras da família Bolinho de Chuva (cada uma na sua pasta, mesmo motor). | dono | 🟡 |
| 11 | Revisão final (31/Out/2026), menores deixados: nome repetido no lobby expulsa o anterior; comandos e calibração num canal que pode perder pacote (rede de segurança de 75 s); "a música inteira" sem vídeo não termina sozinho; ⏹ durante a calibração não cancela; a fala pedida ao celular vai só no idioma da TV; `title`/`aria-label` de alguns botões só em PT; `frente` em `sala.js` sem uso; o estado mínimo ainda vai pelo servidor a cada 3 s. | revisão | 🟡 |
| 12 | Teste real na LG (31/Out): quadro pela metade, piscando e calibração parecendo travada. Causa: efeitos pesados demais para o navegador da TV. | dono | 🔵 v0.8.0 modo leve; v0.8.1 desenho blindado (cada parte separada, quadro sempre fecha), vídeo 480×270@20, 30 fps na TV, `?debug` mostra erros na tela. Reconfirmar na TV com foto do `?debug` |
| 13 | Botão 🔄 trocar câmera (frente/trás) sempre à vista no celular pareado e no modo "só o celular"; funciona sem lista de câmeras (vira o `facingMode`). | dono, 31/Out/2026 | ✅ v0.8.1 |
| 14 | Boneco sem cabeça (celular e TV): `root` indefinido em `boneco.js` ao desenhar cabeça da turma; prévia morria. Barra do modo "só o celular" tampando o jogo. | dono, 31/Out/2026 | ✅ v0.8.3 |
