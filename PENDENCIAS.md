# FeatureTesting — pendências (lista oficial e viva)

Lista do que ainda falta no laboratório. Item novo entra no fim, com o próximo número (números não mudam nem são
reaproveitados). Criada em 31/Out/2026, com autorização do dono.

**Situações:** 🟡 aberta · 🔵 em andamento · ⏸ aguardando decisão do dono · ✅ feita (com a versão)

| # | Pendência | Origem | Situação |
|---|---|---|---|
| 1 | Dança na Sala: testar no navegador real da LG (WebRTC, desempenho dos efeitos, som do YouTube depois do primeiro OK) | Dono, 0.3.0 (30/Out/2026) | 🟡 aberta |
| 2 | Dança na Sala: a playlist "Lara" do dono está privada no YouTube; o app já trata o erro e explica na tela. Para tocar, a playlist precisa ficar pública ou "não listada" | Dono, 0.3.0 | ⏸ aguardando o dono |
| 3 | Dança na Sala: sincronizar os efeitos com a batida da música (ideia: microfone do celular) | Dono, 0.3.0 | 🟡 aberta (versão futura) |
| 4 | Dança na Sala instalada como app de TV (Modo Desenvolvedor da LG, receita do free-my-tv) | Dono, 0.3.0 | 🔵 em andamento · casca e instalador feitos em `tv-lg/`; o free-my-tv original foi instalado com sucesso na LG do dono em 17/Nov/2026 (conta LG, Developer Mode, Key Server e `install.py` no Windows funcionam); falta rodar o `instalar-lg.py` da Dança na Sala |
| 5 | Interruptor `danca-na-sala` aparecer no Controle dos apps do RootifyONE (o `feature-tester` é interno e ficava de fora) | Registro do experimento (31/Out/2026) | ✅ feita no RootifyONE 0.18.5 (31/Out/2026) |
| 6 | Dança na Sala: a chave da YouTube Data API da pessoa fica em texto aberto no `localStorage` (`danca:ytkey`); a diretriz manda chaves para o cofre comum (`cofre.js`) | Revisão do código (31/Out/2026) | ⏸ aguardando o dono |
| 7 | Dança na Sala: `supabase-js` vem do jsDelivr sem `integrity`; a diretriz pede hospedar no repositório ou fixar a versão com `integrity` | Revisão do código (31/Out/2026) | ⏸ aguardando o dono |
| 8 | **Motor de movimento pela câmera (pesquisa antes de código).** Um "motorzinho" comum que leia o corpo pela câmera do celular, para dois usos: (a) **celular → TV**: controlar um jogo ou app na TV com o corpo, no estilo Wii/Just Dance (o celular enxerga, a TV mostra); (b) **só no celular**: conferir se o movimento do exercício está certo (caso do RiseONE, que hoje desenha os pontos mas não avalia nada de útil). O que já foi tentado por "vibe code" ficou ruim demais para usar; por isso o item é **pesquisa primeiro**: comparar motores de pose que rodam no navegador (MediaPipe Pose/Tasks Vision, MoveNet/TensorFlow.js, outros), medir latência e acerto no Samsung do dono, decidir como o celular fala com a TV (mesma rede: WebRTC/WebSocket; a TV LG abre a página pelo Navegador Web ou como app webOS, receita do free-my-tv testada em 17/Nov/2026), definir como se mede "movimento certo" (comparação com um gabarito gravado, por ângulos das juntas) e só então prototipar. Entrega da pesquisa: relatório curto com tabela comparativa, custo (tudo grátis e no aparelho, sem chave) e recomendação. | Dono, 17/Nov/2026 (depois de instalar o free-my-tv na LG) | 🟡 aberta · retomar depois de quinta, 27/Nov/2026, quando os créditos voltarem |

## Histórico das entregas

- **31/Out/2026:** lista criada com o registro da Dança na Sala (no `main` já na 1.1.0). Fechou o #5 (RootifyONE 0.18.5).
