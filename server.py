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
    print(f'Memulai Server Teiko di http://localhost:{PORT} (Dual Stack IPv4/IPv6)...', flush=True)
    print('Mendukung Clean URLs (tanpa .html) sesuai konfigurasi .htaccess', flush=True)
    try:
        # Menggunakan http.server.test agar otomatis menggunakan DualStackServer (mendukung IPv6 ::1 dan IPv4)
        http.server.test(HandlerClass=CleanURLHandler, port=PORT)
    except KeyboardInterrupt:
        print('\nServer dihentikan.', flush=True)
        sys.exit(0)
