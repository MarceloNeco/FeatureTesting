# Prompt para continuar no Sonnet: instalar o Free My TV na LG

Cole o texto abaixo numa conversa nova (Claude Sonnet). Não precisa de repositório nenhum anexado.

---

Você vai me guiar, passo a passo, para instalar o **Free My TV** (github.com/simbasjungles/free-my-tv, licença MIT) na minha TV LG, usando meu computador Windows. Todo o estudo já foi feito; sua tarefa é só me conduzir, **uma pergunta por vez**, e resolver erros que aparecerem.

**Quem eu sou:** Marcelo, dono da plataforma SolverONE (solverone.com.br). **Não sou desenvolvedor.** Responda em português do Brasil, como para iniciante completo: diga onde clicar, o nome exato do botão, e o que deve aparecer na tela. Nunca peça nem aceite senha, passphrase ou chave no chat: a passphrase da TV eu digito só no meu computador. Não crie nem altere repositórios.

**Meus aparelhos:** TV LG 65UP7750PSB, webOS 6.5. Computador Windows 10/11. Celular Samsung.

**O que o Free My TV é:** uma tela inicial limpa, sem propaganda, feita só com HTML/CSS/JavaScript e empacotada como app da TV. Na LG ele **não substitui** a tela inicial da LG: vira um app a mais, que abre segurando um número do controle. Instala pelo **Modo Desenvolvedor oficial da LG**, sem destravar nada. Precisa só de Python 3 e do OpenSSH do Windows; não usa nenhuma ferramenta da LG, nem pip, nem conta paga. Os "destaques" de filmes dependem de uma chave grátis do TMDB, opcional, digitada na própria TV depois; sem ela tudo funciona, só sem os destaques. O Modo Desenvolvedor expira em cerca de 40 dias: abrir o app Developer Mode e apertar **EXTEND**.

**O que já está feito (não repetir):**
- Conta de desenvolvedor LG criada e logada em webostv.developer.lge.com.
- Na TV: app **Developer Mode** instalado (LG Content Store), **Dev Mode Status** ligado (a TV reiniciou), **Key Server** ligado. Anotei o **IP da TV** e a **passphrase** de 6 letras.
- Estou instalando o Python no Windows pelo instalador "standalone" python-3.15.2-amd64.exe de python.org (marcando "Add python.exe to PATH").

**Os passos que faltam, nesta ordem (me conduza por eles):**

1. **Conferir Python e SSH.** Tecla Windows → digitar `cmd` → Enter. Digitar `python --version` (tem que mostrar Python 3.x; se abrir a Microsoft Store ou der "não reconhecido", o Python não foi instalado com o PATH: reinstalar marcando "Add python.exe to PATH", fechar e abrir o cmd de novo). Depois `ssh -V` (tem que mostrar OpenSSH_for_Windows; se não, Configurações → Aplicativos → Recursos opcionais → Adicionar um recurso → Cliente OpenSSH).
2. **Baixar o código.** Navegador → https://github.com/simbasjungles/free-my-tv → botão verde **Code** → **Download ZIP**. Em Downloads, botão direito em `free-my-tv-main.zip` → **Extrair tudo**. Fica a pasta `free-my-tv-main` (dentro: `web`, `webos`, `tizen`, `tools`...).
3. **Abrir o cmd dentro da pasta.** No Explorador, abrir `free-my-tv-main`, clicar na barra de endereço, apagar o texto, digitar `cmd` e Enter.
4. **Montar o pacote.** `python webos\build.py --generic` → tem que terminar com `Built FreeMyTV-webos.ipk (...)`. O aviso "No TMDB key built in" é normal. (`--generic` pega a cidade pelo fuso da TV e não precisa de `config.properties`.)
5. **Instalar na TV.** `python webos\install.py <IP da TV>` (ex.: `python webos\install.py 192.168.0.50`). Na primeira vez pede `Passphrase shown in Developer Mode on the TV:`; eu digito as 6 letras (**nada aparece enquanto digito**, é normal) e Enter. Se o Firewall do Windows perguntar, **Permitir acesso**. Em uns 20 s: `Installed and open on the TV.` A chave destravada fica em `C:\Users\<eu>\.ssh\freemytv_webos_<IP com _>`; nas próximas vezes não pede nada.
6. **Na TV.** Pode aparecer um pedido de permissão para o app ver os apps instalados: **Permitir/Allow** (só assim a estante mostra meus apps, a partir da próxima abertura). Com o Free My TV aberto, **segurar o número 1** no controle uns 3 s: daí o 1 abre o app de qualquer lugar.
7. Atualizar depois = rodar o passo 5 de novo. Remover = `python webos\install.py <IP> --uninstall`.

**Erros conhecidos e o que fazer:**
- `Couldn't reach the Key Server`: na TV, abrir Developer Mode e conferir se **Key Server** está ligado e o IP é o mesmo; computador e TV na **mesma rede Wi-Fi** (não em Wi-Fi de visitante).
- `That passphrase didn't unlock the key`: passphrase errada; conferir na TV (ela muda se o Key Server for religado). Se a chave já tiver sido salva errada, apagar o arquivo `freemytv_webos_<IP>` em `C:\Users\<eu>\.ssh\` e rodar de novo.
- `Couldn't copy it` / `Is Developer Mode still on?`: Dev Mode Status desligou ou expirou; religar/EXTEND na TV.
- `The TV didn't finish installing`: mandar a mensagem inteira para você analisar.
- `python` não reconhecido depois de instalar: fechar e abrir o cmd de novo; se persistir, reinstalar marcando PATH.
- No webOS 6.5 o app não vê os apps instalados sem a permissão do passo 6; isso é limitação da LG, não erro.

**O que fazer depois que funcionar:** me parabenizar brevemente e registrar, numa lista curta, tudo o que de fato aconteceu diferente deste roteiro (mensagens, telas, tempos), porque isso vai virar uma skill `tv-webos-tizen` na SolverONE e vai validar o instalador `instalar-lg.py` da pasta `tv-lg/` do repositório MarceloNeco/FeatureTesting (que é uma tradução deste `install.py` e nunca foi testado numa TV real).

Comece me perguntando: **"O `python --version` já mostrou a versão? Me diga o que apareceu."**
