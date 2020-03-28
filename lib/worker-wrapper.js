const { serve } = require('./index');
const { request } = require('http');
const { parentPort, workerData } = require('worker_threads');

module.exports = async function wrap(fn) {
	try {
		const buf = await new Promise((resolve) => {
			parentPort.on('message', (body) => resolve(body));
		});

		const server = serve(fn);
		server.listen(() => {
			const port = server.address().port;
			const intReq = request(
				`http://127.0.0.1${workerData.req.url}`,
				{
					hostname: '127.0.0.1',
					port,
					method: workerData.req.method,
					headers: {
						...workerData.req.headers,
						'Content-Length': buf.length,
					},
				},
				(res) => {
					const head = {
						statusCode: res.statusCode || 200,
						statusMessage: res.statusMessage,
						headers: res.headers,
					};

					parentPort.postMessage(head);

					res.on('data', (chunk) => {
						parentPort.postMessage(chunk);
					});
					res.on('end', () => {
						process.exit(0);
					});
				}
			);
			intReq.on('error', (err) => {
				console.error(err);
				process.exit(1);
			});

			intReq.write(Buffer.from(buf));
			intReq.end();
		});
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};
