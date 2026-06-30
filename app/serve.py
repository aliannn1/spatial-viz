#!/usr/bin/env python3
"""
Start the SpatialViz preview server.
Visit http://localhost:8123/spatial-viz/ after startup.
Supports HTTP Range requests for byte-level reads of chunked sparse expression files.
"""
import http.server
import os
import re
import socketserver
import urllib.parse
import webbrowser
from email.utils import formatdate

PORT = 8123
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
BASE_PATH = "/spatial-viz"


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    daemon_threads = True
    allow_reuse_address = True


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

    def _redirect(self, status, target):
        self.send_response(status)
        self.send_header('Location', target)
        self.end_headers()

    def _normalize_request_path(self):
        parsed = urllib.parse.urlsplit(self.path)
        path = parsed.path or '/'

        if path == '/':
            target = BASE_PATH + '/'
            if parsed.query:
                target += '?' + parsed.query
            self._redirect(302, target)
            return None

        if path == BASE_PATH:
            target = BASE_PATH + '/'
            if parsed.query:
                target += '?' + parsed.query
            self._redirect(301, target)
            return None

        if path.startswith(BASE_PATH + '/'):
            stripped = path[len(BASE_PATH):] or '/'
            return urllib.parse.urlunsplit(('', '', stripped, parsed.query, parsed.fragment))

        return self.path

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def send_head(self):
        normalized = self._normalize_request_path()
        if normalized is None:
            return None

        original_path = self.path
        self.path = normalized
        try:
            return self._send_head_internal()
        finally:
            self.path = original_path

    def _send_head_internal(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None

        fs = os.fstat(f.fileno())
        file_len = fs.st_size
        range_header = self.headers.get('Range')
        if range_header:
            m = re.match(r'bytes=(\d*)-(\d*)$', range_header.strip())
            if m:
                start_s, end_s = m.groups()
                if start_s == '' and end_s == '':
                    self.send_error(416, 'Invalid Range')
                    f.close()
                    return None
                if start_s == '':
                    suffix = int(end_s)
                    start = max(file_len - suffix, 0)
                    end = file_len - 1
                else:
                    start = int(start_s)
                    end = int(end_s) if end_s else file_len - 1
                end = min(end, file_len - 1)
                if start >= file_len or start > end:
                    self.send_response(416)
                    self.send_header('Content-Range', f'bytes */{file_len}')
                    self.end_headers()
                    f.close()
                    return None
                self.send_response(206)
                self.send_header('Content-type', ctype)
                self.send_header('Content-Range', f'bytes {start}-{end}/{file_len}')
                self.send_header('Content-Length', str(end - start + 1))
                self.send_header('Last-Modified', formatdate(fs.st_mtime, usegmt=True))
                self.end_headers()
                f.seek(start)
                self.range = (start, end)
                return f

        self.send_response(200)
        self.send_header('Content-type', ctype)
        self.send_header('Content-Length', str(file_len))
        self.send_header('Last-Modified', formatdate(fs.st_mtime, usegmt=True))
        self.end_headers()
        self.range = None
        return f

    def copyfile(self, source, outputfile):
        byte_range = getattr(self, 'range', None)
        try:
            if not byte_range:
                return super().copyfile(source, outputfile)
            start, end = byte_range
            remaining = end - start + 1
            bufsize = 64 * 1024
            while remaining > 0:
                chunk = source.read(min(bufsize, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            return


if __name__ == '__main__':
    print('SpatialViz is starting...')
    print(f'Root directory: {DIRECTORY}')
    print(f'URL: http://localhost:{PORT}{BASE_PATH}/')
    print('Press Ctrl+C to stop the server.')

    try:
        webbrowser.open(f'http://localhost:{PORT}{BASE_PATH}/')
    except Exception:
        pass

    with ThreadingTCPServer(('', PORT), RangeRequestHandler) as httpd:
        httpd.serve_forever()
