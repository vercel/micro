const {readFileSync} = require('fs');
const path = require('path');
const { createSecureServer } = require('http2');
const {run, send} = require('micri');

const PORT = process.env.PORT || 4443;
const cert = readFileSync(path.join(__dirname, './cert.pem'));
const key = readFileSync(path.join(__dirname, './key.pem'));

async function onRequest(req, res) {
	// Detects if it is a HTTPS request or HTTP/2
	const { socket: { alpnProtocol } } = req.httpVersion === '2.0' ? req.stream.session : req;

	send(res, 200, {
		alpnProtocol,
		httpVersion: req.httpVersion
	});
}

createSecureServer(
	{ cert, key, allowHTTP1: true },
	(req, res) => run(req, res, onRequest)
).listen(PORT);
