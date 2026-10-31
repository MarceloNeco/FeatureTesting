# Prompt para a nova conversa: Free My TV na LG (SolverONE)

Cole o texto abaixo numa conversa nova com o Claude (Fable), com os repositórios FeatureTesting e rootify-one disponíveis.

---

Quero retomar a exploração do **Free My TV** (github.com/simbasjungles/free-my-tv), uma tela inicial limpa e sem propaganda para TVs, instalada pelo Wi-Fi sem mexer no aparelho. Esse foi o ponto de partida de uma conversa anterior que acabou virando outro app (Dança na Sala, já pronto e publicado no FeatureTesting). Aqui quero só o Free My TV e o que ele ensina sobre apps de TV.

**Quem eu sou:** Marcelo, dono da plataforma SolverONE (solverone.com.br). Não sou desenvolvedor. Responda em português do Brasil, passo a passo como para iniciante, dizendo onde clicar. Siga as regras do CLAUDE.md e da skill `diretrizes-gerais-apps`: regra zero (listar o que falta e confirmar antes de implementar coisa nova), nenhuma senha ou chave em código ou chat, não publicar sem o meu "pode".

**Meus aparelhos:**
- TV LG 65UP7750PSB, webOS 6.5 (6.5.3). Ela tem o Navegador Web da LG.
- Uma caixinha Android "BTV B13" na HDMI 3 (lançador próprio, loja própria; não sei se tem Chrome ou Google Play).
- Computador Windows (também tenho um MacBook, mas prefiro o Windows). Celulares Samsung.

**O que já existe e foi lido:**
- O Free My TV, na LG e na Samsung, é só HTML/CSS/JavaScript empacotado como app da TV. Instala pelo Modo Desenvolvedor oficial da LG (app "Developer Mode" da LG Content Store + conta grátis em webostv.developer.lge.com + Key Server), e um computador na mesma rede manda o pacote com `python3 webos/install.py <IP da TV>`. O Modo Desenvolvedor expira em ~40 dias (botão EXTEND). Não tem IA rodando na TV: o autor usou o Claude Code para escrever o app.
- No repositório **MarceloNeco/FeatureTesting**, pasta `tv-lg/`, já há uma adaptação desse instalador em Python para Windows (`instalar-lg.py`, baseado no free-my-tv, MIT) com um `LEIA-ME.md` passo a passo. Ele empacota um app webOS (.ipk) e instala pelo Wi-Fi. Foi testado só o empacotamento, nunca a instalação numa TV real.

**O que eu quero nesta conversa (me ajude a decidir a ordem):**
1. Instalar o Free My TV original na minha LG, seguindo o README dele, com você me guiando no Windows (Python, conta LG, Developer Mode, IP, passphrase). Quero ver com meus olhos a tela limpa funcionando.
2. Entender o que dá para aproveitar dele para a SolverONE: um "mural da casa" na TV (pergunta do dia, inbox, recados, lembretes, clima) como app da LG, seguindo a diretriz da plataforma (PT/EN, interruptores do RootifyONE, etc.).
3. Se fizer sentido, criar uma skill `tv-webos-tizen` com o passo a passo de Modo Desenvolvedor e empacotamento, para virar conhecimento permanente da plataforma.

Comece lendo o README do free-my-tv e a pasta `tv-lg/` do FeatureTesting, me diga o que precisa de mim antes de qualquer instalação, e me faça uma pergunta de cada vez.
