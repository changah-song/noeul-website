#!/usr/bin/env python3
import http.server
import socketserver
import os

port = int(os.environ.get('PORT', 8000))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    pass

with socketserver.TCPServer(("", port), MyHTTPRequestHandler) as httpd:
    print(f"Serving at port {port}")
    httpd.serve_forever()
