# Serve dist/ dentro lo stesso processo dello script di prova (Playwright), così il server non muore fra un
# comando e l'altro. Uso: from servi import avvia; url = avvia(8766)
import threading, functools, http.server, os
DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'dist')
def avvia(porta=8766):
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', porta), functools.partial(Q, directory=DIST))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return f'http://127.0.0.1:{porta}/index.html'
