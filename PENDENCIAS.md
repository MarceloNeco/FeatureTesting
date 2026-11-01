# FeatureTesting — pendências (lista oficial e viva)

Lista do que ainda falta no laboratório. Item novo entra no fim, com o próximo número (números não mudam nem são
reaproveitados). Criada em 31/Out/2026, com autorização do dono.

**Situações:** 🟡 aberta · 🔵 em andamento · ⏸ aguardando decisão do dono · ✅ feita (com a versão)

| # | Pendência | Origem | Situação |
|---|---|---|---|
| 1 | Dança na Sala: testar no navegador real da LG (WebRTC, desempenho dos efeitos, som do YouTube depois do primeiro OK) | Dono, 0.3.0 (30/Out/2026) | 🟡 aberta |
| 2 | Dança na Sala: a playlist "Lara" do dono está privada no YouTube; o app já trata o erro e explica na tela. Para tocar, a playlist precisa ficar pública ou "não listada" | Dono, 0.3.0 | ⏸ aguardando o dono |
| 3 | Dança na Sala: sincronizar os efeitos com a batida da música (ideia: microfone do celular) | Dono, 0.3.0 | 🟡 aberta (versão futura) |
| 4 | Dança na Sala instalada como app de TV (Modo Desenvolvedor da LG, receita do free-my-tv) | Dono, 0.3.0 | 🔵 em andamento · casca e instalador feitos em `tv-lg/`; falta instalar e testar na TV |
| 5 | Interruptor `danca-na-sala` aparecer no Controle dos apps do RootifyONE (o `feature-tester` é interno e ficava de fora) | Registro do experimento (31/Out/2026) | ✅ feita no RootifyONE 0.18.5 (31/Out/2026) |
| 6 | Dança na Sala: a chave da YouTube Data API da pessoa fica em texto aberto no `localStorage` (`danca:ytkey`); a diretriz manda chaves para o cofre comum (`cofre.js`) | Revisão do código (31/Out/2026) | ⏸ aguardando o dono |
| 7 | Dança na Sala: `supabase-js` vem do jsDelivr sem `integrity`; a diretriz pede hospedar no repositório ou fixar a versão com `integrity` | Revisão do código (31/Out/2026) | ⏸ aguardando o dono |
| 8 | ArchONE (mapa vivo) publicado aqui como protótipo F0 por decisão do dono (31/Out/2026); sai daqui quando o portal próprio `arch-one` nascer (F1 do mapa vivo, `rootify-one/docs/specs/mapa-vivo-plano-f1.md`). Até lá, mudanças são feitas no original (`rootify-one/docs/specs/mapa-vivo/prototipo/`) e copiadas para `arch-one/` | Dono, 31/Out/2026 | 🔵 em andamento · protótipo no ar; portal próprio aguarda o "pode criar" |
| 9 | Peluqueria: fases 2 a 5 (TV com dois jogadores, palma e braços, minha foto + Gemini, Spotify) e fotos realistas — detalhe em `peluqueria/PENDENCIAS.md` | Dono, 31/Out/2026 | 🔵 em andamento · fases 1 a 3 entregues (v0.4.0: TV, celular-controle, corpo, 2 jogadores); faltam 4 (foto + Gemini) e 5 (Spotify), que dependem da chave e do Client ID do dono |
| 10 | Vruuum! (corrida de carrinho): testar com as crianças no celular, no tablet e na TV LG; depois, ideias de TV com o celular como volante e casca LG — detalhe em `vruuum/PENDENCIAS.md` | Dono, 01/Nov/2026 | 🔵 em andamento · v0.3.0 entregue (pulo, músicas, deitado/em pé, guardar no celular, celular como volante) |
| 11 | Purpurina (vestir e maquiar): testar com as crianças no celular e no tablet, deitado e em pé; depois, ajustes e ideias (pintar com o dedo, mais penteados, TV) — detalhe em `purpurina/PENDENCIAS.md` | Dono, 01/Nov/2026 | 🔵 em andamento · v0.5.0 entregue (TV com celular de controle, YouTube e Spotify; antes: perfil, unhas, sapatos, penteados) |

## Histórico das entregas

- **31/Out/2026:** lista criada com o registro da Dança na Sala (no `main` já na 1.1.0). Fechou o #5 (RootifyONE 0.18.5).
- **31/Out/2026:** 1.4.0 — card e pasta `arch-one/` (ArchONE, mapa vivo, protótipo F0, lido dos manifestos); interruptor `arch-one` no `recursos-do-app.json`. Aberto o #8.
- **31/Out/2026:** card e pasta `peluqueria/` (Peluqueria 0.1.0, fase 1); interruptor `peluqueria` no `recursos-do-app.json`. Aberto o #9.
- **31/Out/2026:** Peluqueria 0.1.1 a 0.4.0 — músicas, abertura, lugares fora do centro, TV com celular como controle e movimento do corpo, 2 jogadores; casca `tv-lg-peluqueria/`.
- **01/Nov/2026:** card e pasta `vruuum/` (Vruuum! 0.1.0, corrida de carrinho, 1 ou 2 jogadores); interruptor `vruuum` no `recursos-do-app.json`. Aberto o #10.
- **01/Nov/2026:** Vruuum! 0.2.0 — botão de pular, 3 músicas animadas sem parar, tela cheia e bordas seguras (deitado ou em pé), 📥 baixar o jogo num arquivo só e 📲 instalar.
- **01/Nov/2026:** Vruuum! 0.3.0 — celular como volante pelo acelerômetro (inclinar vira, toquinho para cima pula) e um botão só para guardar no celular.
- **01/Nov/2026:** card e pasta `purpurina/` (Purpurina 0.1.0, vestir e maquiar, desafios, desfile, foto e looks); interruptor `purpurina` no `recursos-do-app.json`. Aberto o #11.
- **01/Nov/2026:** Purpurina 0.2.0 — aba 💎 Joias (brincos, colares, pulseiras, anéis, broches), zoom no rosto, 8 estilos de cílios, 18 penteados e mechas, roupas e sapatos novos, 2 desafios novos.
- **01/Nov/2026:** Purpurina 0.3.0 — girar a personagem (frente, lado, costas) com rastro de luz, ✕ Tirar peças, mãos com dedos, anel e pulseira só na frente, cabelo por fora do rosto.
- **01/Nov/2026:** Purpurina 0.4.0 — perfil de verdade, unhas, 28 sapatos, 30 penteados, 🚫 em todas as partes e tirar todos, reiniciar, foto em alta e vídeo girando para compartilhar.
- **01/Nov/2026:** Purpurina 0.5.0 — 📺 TV com o celular de controle (até 4 personagens), 🎵 música da Purpurina, YouTube e Spotify.
