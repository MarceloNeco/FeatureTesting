#!/usr/bin/env python3
"""Instala o Dança na Sala como app numa TV LG (webOS) em Modo Desenvolvedor, pelo Wi-Fi.

    python instalar-lg.py 192.168.0.50                 # empacota, instala (ou atualiza) e abre na TV
    python instalar-lg.py 192.168.0.50 --desinstalar   # remove da TV

Antes, na TV: instale "Developer Mode" pela LG Content Store, entre com a conta grátis de
desenvolvedor LG (webostv.developer.lge.com), ligue "Dev Mode Status" (a TV reinicia) e
ligue "Key Server". O app mostra o IP da TV e uma senha (passphrase).

Na primeira vez, este script baixa a chave da TV e pede essa senha (não fica guardada). A chave
destravada fica em ~/.ssh/solverone_webos_<IP>; nas próximas vezes não pede nada.
Precisa só de Python 3 e do OpenSSH (ssh e ssh-keygen), que o Windows 10/11 já traz.

Empacotamento e instalação baseados no free-my-tv (github.com/simbasjungles/free-my-tv, MIT),
que por sua vez se baseou no FreeMyTvWebOS de danielthejoker18 (MIT).
"""
import getpass
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(AQUI, 'appinfo.json'), encoding='utf-8') as f:
    INFO = json.load(f)
APP_ID, VERSAO = INFO['id'], INFO['version']
IPK = os.path.join(AQUI, 'DancaNaSala-webos.ipk')
TEMP = '/media/developer/temp/dancanasala.ipk'
SSH_OPTS = ['-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=' + os.devnull, '-o', 'LogLevel=ERROR',
            '-o', 'HostKeyAlgorithms=+ssh-rsa', '-o', 'PubkeyAcceptedKeyTypes=+ssh-rsa', '-p', '9922']


# ---------- empacotar (.ipk = arquivo "ar" com control.tar.gz e data.tar.gz, como o ares-package da LG faz) ----------
def tar_gz(entradas):
    buf = io.BytesIO()
    agora = int(time.time())
    with tarfile.open(fileobj=buf, mode='w:gz', format=tarfile.PAX_FORMAT) as tar:
        for nome, dados in entradas:
            info = tarfile.TarInfo(nome)
            info.mtime = agora
            info.uid = info.gid = 0
            if dados is None:
                info.type = tarfile.DIRTYPE
                info.mode = 0o755
                tar.addfile(info)
            else:
                info.size = len(dados)
                info.mode = 0o644
                tar.addfile(info, io.BytesIO(dados))
    return buf.getvalue()


def ar(membros):
    out = io.BytesIO()
    out.write(b'!<arch>\n')
    agora = int(time.time())
    for nome, dados in membros:
        out.write(('%-16s%-12d%-6d%-6d%-8s%-10d`\n' % (nome, agora, 0, 0, '100644', len(dados))).encode('ascii'))
        out.write(dados)
        if len(dados) % 2:
            out.write(b'\n')
    return out.getvalue()


def empacotar():
    app = {}
    for nome in ('appinfo.json', 'index.html', 'icon.png', 'largeIcon.png'):
        with open(os.path.join(AQUI, nome), 'rb') as f:
            app[nome] = f.read()
    base = 'usr/palm/applications/' + APP_ID
    entradas = [('usr', None), ('usr/palm', None), ('usr/palm/applications', None), (base, None)]
    entradas += [(base + '/' + nome, app[nome]) for nome in sorted(app)]
    pacote = json.dumps({'id': APP_ID, 'version': VERSAO, 'app': APP_ID}, indent=2).encode('utf-8')
    entradas += [('usr/palm/packages', None), ('usr/palm/packages/' + APP_ID, None),
                 ('usr/palm/packages/' + APP_ID + '/packageinfo.json', pacote)]
    tamanho = sum(len(d) for d in app.values()) + len(pacote)
    control = ('Package: %s\nVersion: %s\nSection: misc\nPriority: optional\nArchitecture: all\nInstalled-Size: %d\n'
               'Maintainer: SolverONE <https://solverone.com.br>\nDescription: Danca na Sala\n'
               'webOS-Package-Format-Version: 2\nwebOS-Packager-Version: 1.0.0\n' % (APP_ID, VERSAO, tamanho))
    dados = ar([('debian-binary', b'2.0\n'), ('control.tar.gz', tar_gz([('control', control.encode('utf-8'))])),
                ('data.tar.gz', tar_gz(entradas))])
    with open(IPK, 'wb') as f:
        f.write(dados)
    print('Pacote pronto: %s (%s %s, %d KB)' % (os.path.basename(IPK), APP_ID, VERSAO, len(dados) // 1024))


# ---------- chave da TV ----------
def caminho_chave(ip):
    return os.path.join(os.path.expanduser('~'), '.ssh', 'solverone_webos_' + ip.replace('.', '_'))


def trancar(caminho):
    """Só este usuário lê a chave: chmod basta no Mac/Linux; no Windows o OpenSSH confere a ACL do arquivo."""
    os.chmod(caminho, 0o600)
    if os.name != 'nt':
        return
    out = subprocess.run(['whoami', '/user', '/fo', 'csv', '/nh'], capture_output=True).stdout
    sid = re.search(rb'S-1-[0-9-]+', out)
    if sid:
        subprocess.run(['icacls', caminho, '/inheritance:r', '/grant:r', '*%s:F' % sid.group().decode()], capture_output=True)


def buscar_chave(ip):
    caminho = caminho_chave(ip)
    if os.path.exists(caminho):
        return caminho
    url = 'http://%s:9991/webos_rsa' % ip
    print('Buscando a chave da TV em %s ...' % url)
    try:
        with urllib.request.urlopen(url, timeout=6) as r:
            dados = r.read()
    except Exception as e:
        sys.exit('Não consegui falar com o Key Server (%s). Na TV, no app Developer Mode, ligue "Key Server" e confira o IP.' % e)
    senha = getpass.getpass('Senha (passphrase) que o Developer Mode mostra na TV: ').strip()
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.write(dados)
    tmp.close()
    trancar(tmp.name)
    destravar = subprocess.run(['ssh-keygen', '-p', '-P', senha, '-N', '', '-f', tmp.name], capture_output=True, text=True)
    if destravar.returncode != 0:
        os.unlink(tmp.name)
        motivo = (destravar.stderr.strip().splitlines() or [''])[-1]
        sys.exit('Essa senha não destravou a chave (%s). Confira na TV (Developer Mode) e tente de novo.' % motivo)
    shutil.move(tmp.name, caminho)
    trancar(caminho)
    return caminho


# ---------- falar com a TV ----------
def ssh(ip, chave, comando, stdin=None, tty=False):
    args = ['ssh'] + (['-tt'] if tty else []) + SSH_OPTS + ['-i', chave, 'prisoner@' + ip, comando]
    return subprocess.run(args, stdin=stdin, capture_output=True, text=stdin is None)


def luna(ip, chave, uri, payload, respostas=1, espera=20):
    timeout = "if timeout -t 1 true 2>/dev/null; then T='timeout -t %d'; else T='timeout %d'; fi; " % (espera, espera)
    msg = "%s '%s'" % (uri, json.dumps(payload, separators=(',', ':')))
    out = ssh(ip, chave, timeout + '$T luna-send-pub -n %d %s' % (respostas, msg), tty=True).stdout or ''
    if not out.strip():
        out = ssh(ip, chave, timeout + '$T luna-send-pub -i %s </dev/null' % msg).stdout or ''
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if not args or not re.match(r'^\d{1,3}(\.\d{1,3}){3}$', args[0]):
        sys.exit(__doc__)
    ip = args[0]
    if not shutil.which('ssh') or not shutil.which('ssh-keygen'):
        sys.exit('Faltou o OpenSSH (ssh e ssh-keygen). No Windows: Configurações > Aplicativos > Recursos opcionais > Cliente OpenSSH.')
    chave = buscar_chave(ip)

    if '--desinstalar' in sys.argv or '--uninstall' in sys.argv:
        out = luna(ip, chave, 'luna://com.webos.appInstallService/dev/remove', {'id': APP_ID}, respostas=3, espera=30)
        print('Removido.' if '"returnValue":true' in out else 'A TV respondeu: ' + out.strip())
        return

    empacotar()
    print('Copiando o app para a TV ...')
    with open(IPK, 'rb') as f:
        copia = ssh(ip, chave, 'mkdir -p /media/developer/temp && cat > ' + TEMP, stdin=f)
    if copia.returncode != 0:
        erro = copia.stderr.decode('utf-8', 'replace') if isinstance(copia.stderr, bytes) else copia.stderr
        sys.exit('Não consegui copiar: %s\nO Modo Desenvolvedor ainda está ligado? Se a chave mudou, apague %s e tente de novo.' % (erro.strip(), chave))
    print('Instalando ...')
    out = luna(ip, chave, 'luna://com.webos.appInstallService/dev/install', {'id': APP_ID, 'ipkUrl': TEMP, 'subscribe': True},
               respostas=30, espera=60)
    if '"state":"installed"' not in out:
        sys.exit('A TV não terminou de instalar. Ela disse:\n' + out.strip())
    ssh(ip, chave, 'rm -f ' + TEMP)
    luna(ip, chave, 'luna://com.webos.applicationManager/launch', {'id': APP_ID})
    print('Instalado e aberto na TV. O ícone "Dança na Sala" fica na barra de apps da LG.')
    print('Dica: com o app aberto, segure um número no controle para abri-lo por esse número.')
    print('O Modo Desenvolvedor dura uns 40 dias: de vez em quando abra o app Developer Mode e aperte EXTEND.')


if __name__ == '__main__':
    main()
