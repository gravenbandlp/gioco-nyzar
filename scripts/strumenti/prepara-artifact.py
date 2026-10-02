# Prepara dist/index.html per l'Artifact del gioco: estrae il frammento (head utile + body) in un file, e
# scrive la mappa delle tavole nuove (non ancora pubblicate) da passare come `files` alla pubblicazione.
# Uso: python3 scripts/strumenti/prepara-artifact.py <cartella-di-uscita> [commit-dell-ultima-pubblicazione]
# Poi: Artifact publish con url del gioco, file_path <uscita>/gioco-nyzar.html e, se ci sono, i files della mappa.
# L'Artifact conserva i file già pubblicati (tavole, audio): basta passare quelli nuovi.
import re, json, subprocess, sys, os
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) + '/'
S = sys.argv[1].rstrip('/') + '/'
base = sys.argv[2] if len(sys.argv) > 2 else ''
os.makedirs(S, exist_ok=True)
t = open(R + 'dist/index.html').read()
head = t[t.index('<head>') + 6:t.index('</head>')]
body = t[t.index('<body>') + 6:t.index('</body>')]
title = re.search(r'<title>.*?</title>', head, re.S).group(0)
links = re.findall(r'<link[^>]*>', head[:head.index('<script')])
script = re.search(r'<script type="module" crossorigin>.*?</script>', head, re.S).group(0)
style = re.search(r'<style[^>]*>.*?</style>', head, re.S).group(0)
open(S + 'gioco-nyzar.html', 'w').write('\n'.join([title, *links, style, script, body.strip()]))
nuove = [l[3:].strip() for l in subprocess.run(['git', 'status', '--porcelain', '--untracked-files=all', 'public/tavole'], cwd=R, capture_output=True, text=True).stdout.splitlines() if l.startswith('??')]
if base:
    nuove += [f for f in subprocess.run(['git', 'diff', '--name-only', base, 'HEAD', '--', 'public/tavole'], cwd=R, capture_output=True, text=True).stdout.split() if os.path.exists(R + f)]
m = {p.replace('public/', ''): ('dist/' + p[len('public/'):]) for p in sorted(set(nuove))}
json.dump(m, open(S + 'files-nuove.json', 'w'))
print(len(m), 'tavole nuove'); print(json.dumps(m))
