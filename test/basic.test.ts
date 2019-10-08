// Packages
const fetch = require('@zeit/fetch-retry')(require('node-fetch'));
const resumer = require('resumer');
import listen from 'test-listen';
import micri from '../src/micri';
import {
	IncomingMessage,
	ServerResponse,
	Server,
	MicriError,
	MicriHandler,
	run,
	send,
	sendError,
	buffer,
	text,
	json
} from '../src/micri';
import { setTimeout } from 'timers';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let srv: Server;

const getUrl = (fn: (req: IncomingMessage, res: ServerResponse) => any) => {
	srv = micri(fn);

	return listen(srv);
};

afterEach(() => {
	if (srv && srv.close) {
		srv.close();
	}
});

test('send(200, <String>)', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		send(res, 200, 'woot');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('woot');
});

test('send(200, <Object>)', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		send(res, 200, {
			a: 'b'
		});
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body).toEqual({
		a: 'b'
	});
});

test('send(200, <Number>)', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		// Chosen by fair dice roll. guaranteed to be random.
		send(res, 200, 4);
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body).toBe(4);
});

test('send(200, <Buffer>)', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		send(res, 200, Buffer.from('muscle'));
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('muscle');
});

test('send(200, <Stream>)', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		send(res, 200, 'waterfall');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('waterfall');
});

test('send(<Number>)', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		send(res, 404);
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(404);
});

test('return <String>', async () => {
	const fn = async () => 'woot';

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('woot');
});

test('return <Promise>', async () => {
	const fn = async () =>
		new Promise(async resolve => {
			await sleep(100);
			resolve('I Promise');
		});

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('I Promise');
});

test('sync return <String>', async () => {
	const fn = () => 'argon';

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('argon');
});

test('return empty string', async () => {
	const fn = async () => '';

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('');
});

test('return <Object>', async () => {
	const fn = async () => ({
		a: 'b'
	});

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body).toEqual({
		a: 'b'
	});
});

test('return <Number>', async () => {
	const fn = async () => {
		// Chosen by fair dice roll. guaranteed to be random.
		return 4;
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body).toBe(4);
});

test('return <Buffer>', async () => {
	const fn = async () => Buffer.from('Hammer');

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('Hammer');
});

test('return <Stream>', async () => {
	const fn = async () =>
		resumer()
			.queue('River')
			.end();

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('River');
});

test('return <null>', async () => {
	const fn = async () => null;

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(204);
	expect(body).toBe('');
});

test('return <null> calls res.end once', async () => {
	const fn = async () => null;

	let i = 0;
	// @ts-ignore
	await run({}, { end: () => i++ }, fn);

	expect(i).toBe(1);
});

test('throw sends 500 and json body', async () => {
	const fn = () => {
		throw new Error('Error from test (expected)');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toBe(500);
	expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
	expect(body).toEqual({
		error: {
			code: 'internal_server_error',
			message: 'Internal Server Error'
		}
	});
});

test('throw sends 500 and text body when requested', async () => {
	const fn = () => {
		throw new Error('Error from test (expected)');
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		headers: {
			accept: 'text/plain'
		}
	});
	const body = await res.text();

	expect(res.status).toBe(500);
	expect(body).toBe('Internal Server Error');
});

test('throw with statusCode sends 500', async () => {
	class MyError extends Error {
		statusCode: number | undefined;
	}

	const fn = async () => {
		await sleep(100);
		const err = new MyError('Error from test (expected)');
		err.statusCode = 402;
		throw err;
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(500);
});

test('throw with MicriError', async () => {
	const fn = async () => {
		await sleep(100);
		throw new MicriError(402, 'error', 'Error from test (expected)');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(402);
});

test('throw (500)', async () => {
	const fn = async () => {
		throw new Error('500 from test (expected)');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(500);
});

test('throw (500) sync', async () => {
	const fn = () => {
		throw new Error('500 from test (expected)');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(500);
});

test('send(200, <Stream>) with error on same tick', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		const stream = resumer().queue('error-stream');
		send(res, 200, stream);

		stream.emit('error', new Error('500 from test (expected)'));
		stream.end();
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(500);
});

test('custom error', async () => {
	const fn = () => {
		sleep(50);
		throw new Error('500 from test (expected)');
	};

	const handleErrors = (ofn: MicriHandler) => (req: IncomingMessage, res: ServerResponse) => {
		try {
			return ofn(req, res);
		} catch (err) {
			send(res, 400, 'My custom error!');
		}
	};

	const url = await getUrl(handleErrors(fn));
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(400);
	expect(body).toBe('My custom error!');
});

test('custom async error', async () => {
	const fn = async () => {
		sleep(50);
		throw new Error('500 from test (expected)');
	};

	const handleErrors = (ofn: MicriHandler) => async (req: IncomingMessage, res: ServerResponse) => {
		try {
			return await ofn(req, res);
		} catch (err) {
			send(res, 400, 'My custom error!');
		}
	};

	const url = await getUrl(handleErrors(fn));
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(400);
	expect(body).toBe('My custom error!');
});

test('json parse error', async () => {
	const fn = async (req: IncomingMessage, res: ServerResponse) => {
		const body = await json(req);
		send(res, 200, body.woot);
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: '{ "bad json" }'
	});

	expect(res.status).toBe(400);
});

test('json', async () => {
	const fn = async (req: IncomingMessage, res: ServerResponse) => {
		const body = await json(req);

		send(res, 200, {
			response: body.some.cool
		});
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			some: {
				cool: 'json'
			}
		})
	});
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body.response).toBe('json');
});

test('json limit (below)', async () => {
	const fn = async (req: IncomingMessage, res: ServerResponse) => {
		const body = await json(req, {
			limit: 100
		});

		send(res, 200, {
			response: body.some.cool
		});
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			some: {
				cool: 'json'
			}
		})
	});
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body.response).toBe('json');
});

test('json limit (over)', async () => {
	const fn = async (req: IncomingMessage, res: ServerResponse) => {
		try {
			await json(req, {
				limit: 3
			});
		} catch (err) {
			expect(err.statusCode).toBe(413);
			throw err;
		}

		send(res, 200, 'ok');
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			some: {
				cool: 'json'
			}
		})
	});

	expect(res.status).toBe(413);
});

test('json circular', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		const obj = {
			circular: true
		};

		// @ts-ignore
		obj.obj = obj;
		send(res, 200, obj);
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(500);
});

test('no async', async () => {
	const fn = (_: IncomingMessage, res: ServerResponse) => {
		send(res, 200, {
			a: 'b'
		});
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const obj = await res.json();

	expect(res.status).toBe(200);
	expect(obj.a).toBe('b');
});

test('limit included in error', async () => {
	const fn = async (req: IncomingMessage, res: ServerResponse) => {
		let body: any;

		try {
			body = await json(req, {
				limit: 3
			});
		} catch (err) {
			expect(err.message).toEqual(expect.stringContaining('exceeded 3B limit'));
			throw err;
		}

		send(res, 200, {
			response: body.some.cool
		});
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			some: {
				cool: 'json'
			}
		})
	});

	expect(res.status).toBe(413);
});

test('support for status fallback in errors', async () => {
	const fn = (req: IncomingMessage, res: ServerResponse) => {
		const err = new MicriError(403, 'xyz', 'Custom');
		sendError(req, res, err);
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(403);
});

test('support for non-Error errors', async () => {
	const fn = (req: IncomingMessage, res: ServerResponse) => {
		const err = 'String error';
		// @ts-ignore
		sendError(req, res, err);
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(500);
});

test('json from rawBodyMap works', async () => {
	const fn = async (req: IncomingMessage, res: ServerResponse) => {
		const bodyOne = await json(req);
		const bodyTwo = await json(req);

		expect(bodyOne).toEqual(bodyTwo);

		send(res, 200, {
			response: bodyOne.some.cool
		});
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			some: {
				cool: 'json'
			}
		})
	});
	const body = await res.json();

	expect(res.status).toBe(200);
	expect(body.response).toBe('json');
});

test('statusCode defaults to 200', async () => {
	const fn = (_: IncomingMessage, res: ServerResponse) => {
		// eslint-disable-next-line no-undefined
		// @ts-ignore
		res.statusCode = undefined;
		return 'woot';
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('woot');
});

test('statusCode on response works', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		res.statusCode = 400;
		return 'woot';
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(400);
});

test('Content-Type header is preserved on string', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		res.setHeader('Content-Type', 'text/html');
		return '<blink>woot</blink>';
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(200);
	expect(res.headers.get('content-type')).toBe('text/html');
});

test('Content-Type header is preserved on stream', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		res.setHeader('Content-Type', 'text/html');
		return resumer()
			.queue('River')
			.end();
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(200);
	expect(res.headers.get('content-type')).toBe('text/html');
});

test('Content-Type header is preserved on buffer', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		res.setHeader('Content-Type', 'text/html');
		return Buffer.from('hello');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(200);
	expect(res.headers.get('content-type')).toBe('text/html');
});

test('Content-Type header is preserved on object', async () => {
	const fn = async (_: IncomingMessage, res: ServerResponse) => {
		res.setHeader('Content-Type', 'text/html');
		return {};
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	expect(res.status).toBe(200);
	expect(res.headers.get('content-type')).toBe('text/html');
});

test('res.end is working', async () => {
	const fn = (_: IncomingMessage, res: ServerResponse) => {
		setTimeout(() => res.end('woot'), 100);
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(res.status).toBe(200);
	expect(body).toBe('woot');
});

test('json should throw 400 on empty body with no headers', async () => {
	const fn = async (req: IncomingMessage) => json(req);

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toBe(400);
	expect(body.error.message).toBe('Invalid JSON');
});

test('text should throw 400 on invalid encoding', async () => {
	const fn = async (req: IncomingMessage) => text(req, { encoding: 'lol' });

	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: '❤️'
	});
	const body = await res.json();

	expect(res.status).toBe(400);
	expect(body.error.message).toBe('Invalid body');
});

test('buffer works', async () => {
	const fn = async (req: IncomingMessage) => buffer(req);
	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: '❤️'
	});
	const body = await res.text();

	expect(body).toBe('❤️');
});

test('buffer cacheing works', async () => {
	const fn = async (req: IncomingMessage) => {
		const buf1 = await buffer(req);
		const buf2 = await buffer(req);

		expect(buf2).toBe(buf1);

		return '';
	};
	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		body: '❤️'
	});

	expect(res.status).toBe(200);
});

test("buffer doesn't care about client encoding", async () => {
	const fn = async (req: IncomingMessage) => buffer(req);
	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json; charset=base64'
		},
		body: '❤️'
	});
	const body = await res.text();

	expect(body).toBe('❤️');
});

test('buffer should throw when limit is exceeded', async () => {
	const fn = async (req: IncomingMessage) => buffer(req, { limit: 1 });
	const url = await getUrl(fn);
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			'content-type': 'application/json; charset=base64'
		},
		body: '❤️'
	});

	expect(res.status).toBe(413);
});

test('Content-Type header for JSON is set', async () => {
	const url = await getUrl(() => ({}));
	const res = await fetch(url);

	expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
});
