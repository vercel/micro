const path = require('path');
const http2 = require('http2');
const {run, send} = require('micri');

const micriHttp2 = fn => http2.createServer((req, res) => run(req, res, fn));
const server = micriHttp2(async (req, res) => {
	send(res, 200, 'Hello world!');
});

server.listen(3000);
