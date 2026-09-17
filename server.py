import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class FastCachedHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Cache image frames heavily for instant scrub performance
        if self.path.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            self.send_header('Cache-Control', 'public, max-age=86400')
        else:
            # Keep HTML/CSS/JS fresh so updates reflect immediately
            self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    server_address = ('127.0.0.1', port)
    httpd = ThreadingHTTPServer(server_address, FastCachedHandler)
    print(f"Serving HTTP on http://127.0.0.1:{port}/ (Multi-threaded)")
    httpd.serve_forever()
