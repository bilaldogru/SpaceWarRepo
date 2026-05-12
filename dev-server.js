const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4174);

const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.mp3': 'audio/mpeg',
    '.txt': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const requestPath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(root, safePath);

    if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(port, '127.0.0.1', () => {
    console.log(`Space War dev server: http://127.0.0.1:${port}`);
});
