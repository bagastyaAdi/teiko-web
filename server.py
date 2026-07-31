import http.server
import os
import sys

PORT = 8000


class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler yang mendukung Clean URLs (tanpa ekstensi .html).
    Meniru aturan RewriteRule di .htaccess agar tautan seperti href="drinks"
    atau href="event" dapat diarahkan otomatis ke drinks.html / event.html.
    """

    def do_GET(self):
        parts = self.path.split('?', 1)
        path = parts[0]
        query = '?' + parts[1] if len(parts) > 1 else ''

        # Jika path tidak ada secara langsung di filesystem, tapi ada file <path>.html
        if path != '/' and not os.path.exists(
            self.translate_path(path)
        ) and os.path.exists(self.translate_path(path + '.html')):
            self.path = path + '.html' + query

        return super().do_GET()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print(f'Memulai Server Teiko di http://127.0.0.1:{PORT} (atau http://localhost:{PORT}) ...', flush=True)
    print('Mendukung Clean URLs (tanpa .html) sesuai konfigurasi .htaccess', flush=True)
    try:
        from http.server import ThreadingHTTPServer
        server = ThreadingHTTPServer(('127.0.0.1', PORT), CleanURLHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer dihentikan.', flush=True)
        sys.exit(0)
