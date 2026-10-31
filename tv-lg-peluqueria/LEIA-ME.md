# Peluqueria como app na TV LG (webOS)

Isto coloca o ícone **💇 Peluqueria** na barra de apps da sua LG, igual ao Netflix e ao YouTube.
O app é só uma casca: ele abre a página publicada em solverone.com.br, já no papel de TV. Por isso
toda atualização do site chega na TV sem reinstalar nada.

Funciona em LG com webOS 3 ou mais nova (a sua 65UP7750 tem webOS 6.5). Nada é "destravado" na TV:
é o Modo Desenvolvedor oficial da LG.

## O que você precisa

- A TV e um computador Windows na **mesma rede Wi-Fi**.
- Uma conta grátis de desenvolvedor LG.
- Python 3 no computador (grátis, 2 minutos para instalar).

## Passo 1 — Conta de desenvolvedor LG (uma vez só)

1. No computador, abra https://webostv.developer.lge.com e clique em **Sign in**.
2. Entre com a sua conta LG (a mesma da TV) ou crie uma. Aceite os termos de desenvolvedor.

## Passo 2 — Modo Desenvolvedor na TV (uma vez só)

1. Na TV, aperte **Home**, abra a **LG Content Store** e procure **"Developer Mode"**. Instale.
2. Abra o app Developer Mode e entre com a conta do Passo 1.
3. Ligue **Dev Mode Status**. A TV vai reiniciar.
4. Abra o Developer Mode de novo e ligue **Key Server**.
5. Anote o que aparece na tela: o **IP da TV** (ex.: 192.168.0.50) e a **Passphrase** (6 letras).

## Passo 3 — Python no Windows (uma vez só)

1. Abra a **Microsoft Store**, procure **"Python 3.12"** (o editor é Python Software Foundation) e clique em **Instalar**.
2. Pronto. O Windows 10 e 11 já vêm com o OpenSSH, que o script também usa.

## Passo 4 — Baixar esta pasta

1. Abra https://github.com/MarceloNeco/FeatureTesting no navegador.
2. Clique no botão verde **Code** e em **Download ZIP**.
3. Extraia o ZIP (botão direito, "Extrair tudo"). Dentro tem a pasta **tv-lg-peluqueria**.

## Passo 5 — Instalar na TV

1. Abra a pasta **tv-lg-peluqueria** no Explorador de Arquivos.
2. Clique na barra de endereço da pasta, apague o que está lá, digite `cmd` e aperte Enter. Abre uma janela preta na pasta certa.
3. Digite (trocando pelo IP da sua TV) e aperte Enter:

   ```
   python instalar-lg.py 192.168.0.50
   ```

4. Na primeira vez ele pede a **Passphrase** da TV. Digite (não aparece na tela enquanto digita) e aperte Enter.
5. Em alguns segundos aparece "Instalado e aberto na TV". O ícone fica na barra de apps da LG.

Para atualizar, rode o mesmo comando. Para remover: `python instalar-lg.py 192.168.0.50 --desinstalar`.

## Depois

- **Atalho no controle:** com o app aberto, **segure um número** (por exemplo o 1) por uns segundos. A partir daí, esse número abre o Peluqueria de qualquer lugar.
- **A cada 40 dias** o Modo Desenvolvedor expira. Abra o app Developer Mode e aperte **EXTEND**. Se esquecer e o ícone sumir, é só rodar o Passo 5 de novo.
- Se der "Não consegui falar com o Key Server", confira se o Key Server está ligado no Developer Mode e se o IP está certo.
- Se o som do YouTube não sair na primeira vez, aperte OK em cima do vídeo uma vez.

Empacotamento e instalação baseados no free-my-tv (https://github.com/simbasjungles/free-my-tv, licença MIT).
