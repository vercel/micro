const https = require('https');
const { run, res } = require('micro');

const { key, cert, passphrase } = require('openssl-self-signed-certificate');

const PORT = process.env.PORT || 3443;

const options = { key, cert, passphrase };

const microHttps = fn =>
	https.createServer(options, (req, res) => run(req, res, fn));

const server = microHttps(async req =>
	res({ encrypted: req.client.encrypted }, 200)
);

server.listen(PORT);
console.log(`Listening on https://localhost:${PORT}`);
