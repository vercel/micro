const https = require('https');
const { listener, res } = require('micro');

const { key, cert, passphrase } = require('openssl-self-signed-certificate');

const PORT = process.env.PORT || 3443;

const options = { key, cert, passphrase };

const microHttps = fn => https.createServer(options, listener(fn));

const handler = req => res({ encrypted: req.client.encrypted }, 200);

const server = microHttps(handler);

server.listen(PORT);
console.log(`Listening on https://localhost:${PORT}`);
