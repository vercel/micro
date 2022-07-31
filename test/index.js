// Packages
const test = require('ava');
const fetch = require('node-fetch');
const sleep = require('then-sleep');
const resumer = require('resumer');
const listen = require('test-listen');
const micro = require('../packages/micro/lib');
const {getUrl} = require('./_test-utils')({micro, listen});

const {send, sendError, buffer, json} = micro;

test('send(200, <String>)', async t => {
	const fn = async (req, res) => {
		send(res, 200, 'woot');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	t.deepEqual(body, 'woot');
});

test('send(200, <Object>)', async t => {
	const fn = async (req, res) => {
		send(res, 200, {
			a: 'b'
		});
	};

	const url = await getUrl(fn);

	const res = await fetch(url).then(r => r.json());

	t.deepEqual(res, {
		a: 'b'
	});
});

test('send(200, <Number>)', async t => {
	const fn = async (req, res) => {
		// Chosen by fair dice roll. guaranteed to be random.
		send(res, 200, 4);
	};

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.json());

	t.deepEqual(res, 4);
});

test('send(200, <Buffer>)', async t => {
	const fn = async (req, res) => {
		send(res, 200, Buffer.from('muscle'));
	};

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'muscle');
});

test('send(200, <Stream>)', async t => {
	const fn = async (req, res) => {
		send(res, 200, 'waterfall');
	};

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'waterfall');
});

test('send(<Number>)', async t => {
	const fn = async (req, res) => {
		send(res, 404);
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 404);
});

test('return <String>', async t => {
	const fn = async () => 'woot';

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'woot');
});

test('return <Promise>', async t => {
	const fn = async () => new Promise(async resolve => {
		await sleep(100);
		resolve('I Promise');
	});

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'I Promise');
});

test('sync return <String>', async t => {
	const fn = () => 'argon';

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'argon');
});

test('return empty string', async t => {
	const fn = async () => '';

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, '');
});

test('return <Object>', async t => {
	const fn = async () => ({
		a: 'b'
	});

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.json());

	t.deepEqual(res, {
		a: 'b'
	});
});

test('return <Number>', async t => {
	const fn = async () =>
	// Chosen by fair dice roll. guaranteed to be random.
		4;


	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.json());

	t.deepEqual(res, 4);
});

test('return <Buffer>', async t => {
	const fn = async () => Buffer.from('Hammer');

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'Hammer');
});

test('return <Stream>', async t => {
	const fn = async () =>
		resumer()
			.queue('River')
			.end();

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'River');
});

test('return <null>', async t => {
	const fn = async () => null;

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	t.is(res.status, 204);
	t.is(body, '');
});

test('return <null> calls res.end once', async t => {
	const fn = async () => null;

	let i = 0;
	await micro.run({}, {end: () => i++}, fn);

	t.is(i, 1);
});

test('throw with code', async t => {
	const fn = async () => {
		await sleep(100);
		const err = new Error('Error from test (expected)');
		err.statusCode = 402;
		throw err;
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);

	t.deepEqual(status, 402);
});

test('throw (500)', async t => {
	const fn = async () => {
		throw new Error('500 from test (expected)');
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 500);
});

test('throw (500) sync', async t => {
	const fn = () => {
		throw new Error('500 from test (expected)');
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 500);
});

test('send(200, <Stream>) with error on same tick', async t => {
	const fn = async (req, res) => {
		const stream = resumer().queue('error-stream');
		send(res, 200, stream);

		stream.emit('error', new Error('500 from test (expected)'));
		stream.end();
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 500);
});

test('send(200, <Stream>) custom stream', async t => {
	const fn = async (req, res) => {
		const handlers = {};
		const stream = {
			readable: true,
			_read: () => '',
			_readableState: {},
			on: (key, fns) => {
				handlers[key] = fns;
			},
			emit: key => {
				handlers[key]();
			},
			pipe: () => {},
			end: () => {}
		};

		send(res, 200, stream);

		stream.emit('close');
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 500);
});

test('custom error', async t => {
	const fn = () => {
		sleep(50);
		throw new Error('500 from test (expected)');
	};

	const handleErrors = ofn => (req, res) => {
		try {
			return ofn(req, res);
		} catch (err) {
			send(res, 200, 'My custom error!');
		}
	};

	const url = await getUrl(handleErrors(fn));
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'My custom error!');
});

test('custom async error', async t => {
	const fn = async () => {
		sleep(50);
		throw new Error('500 from test (expected)');
	};

	const handleErrors = ofn => async (req, res) => {
		try {
			return await ofn(req, res);
		} catch (err) {
			send(res, 200, 'My custom error!');
		}
	};

	const url = await getUrl(handleErrors(fn));
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'My custom error!');
});

test('json parse error', async t => {
	const fn = async (req, res) => {
		const body = await json(req);
		send(res, 200, body.woot);
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url, {
		method: 'POST',
		body: '{ "bad json" }',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	t.deepEqual(status, 400);
});

test('json', async t => {
	const fn = async (req, res) => {
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

	t.deepEqual(body.response, 'json');
});

test('json limit (below)', async t => {
	const fn = async (req, res) => {
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

	t.deepEqual(body.response, 'json');
});

test('json limit (over)', async t => {
	const fn = async (req, res) => {
		try {
			await json(req, {
				limit: 3
			});
		} catch (err) {
			t.deepEqual(err.statusCode, 413);
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
	t.deepEqual(res.status, 200);
});

test('json circular', async t => {
	const fn = async (req, res) => {
		const obj = {
			circular: true
		};

		obj.obj = obj;
		send(res, 200, obj);
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 500);
});

test('no async', async t => {
	const fn = (req, res) => {
		send(res, 200, {
			a: 'b'
		});
	};

	const url = await getUrl(fn);
	const obj = await fetch(url).then(r => r.json());

	t.deepEqual(obj.a, 'b');
});

test('limit included in error', async t => {
	const fn = async (req, res) => {
		let body;

		try {
			body = await json(req, {
				limit: 3
			});
		} catch (err) {
			t.truthy(/exceeded 3 limit/.test(err.message));
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

	t.deepEqual(res.status, 500);
});

test('support for status fallback in errors', async t => {
	const fn = (req, res) => {
		const err = new Error('Custom');
		err.status = 403;
		sendError(req, res, err);
	};

	const url = await getUrl(fn);
	const {status} = await fetch(url);
	t.deepEqual(status, 403);
});

test('support for non-Error errors', async t => {
	const fn = (req, res) => {
		const err = 'String error';
		sendError(req, res, err);
	};

	const url = await getUrl(fn);
	const {status} = await fetch(url);
	t.deepEqual(status, 500);
});

test('json from rawBodyMap works', async t => {
	const fn = async (req, res) => {
		const bodyOne = await json(req);
		const bodyTwo = await json(req);

		t.deepEqual(bodyOne, bodyTwo);

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

	t.deepEqual(body.response, 'json');
});

test('statusCode defaults to 200', async t => {
	const fn = (req, res) => {
		res.statusCode = undefined;
		return 'woot';
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();
	t.is(body, 'woot');
	t.is(res.status, 200);
});

test('statusCode on response works', async t => {
	const fn = async (req, res) => {
		res.statusCode = 400;
		return 'woot';
	};

	const url = await getUrl(fn);

	const {status} = await fetch(url);
	t.deepEqual(status, 400);
});

test('Content-Type header is preserved on string', async t => {
	const fn = async (req, res) => {
		res.setHeader('Content-Type', 'text/html');
		return '<blink>woot</blink>';
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	t.is(res.headers.get('content-type'), 'text/html');
});

test('Content-Type header is preserved on stream', async t => {
	const fn = async (req, res) => {
		res.setHeader('Content-Type', 'text/html');
		return resumer()
			.queue('River')
			.end();
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	t.is(res.headers.get('content-type'), 'text/html');
});

test('Content-Type header is preserved on buffer', async t => {
	const fn = async (req, res) => {
		res.setHeader('Content-Type', 'text/html');
		return Buffer.from('hello');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	t.is(res.headers.get('content-type'), 'text/html');
});

test('Content-Type header is preserved on object', async t => {
	const fn = async (req, res) => {
		res.setHeader('Content-Type', 'text/html');
		return {};
	};

	const url = await getUrl(fn);
	const res = await fetch(url);

	t.is(res.headers.get('content-type'), 'text/html');
});

test('res.end is working', async t => {
	const fn = (req, res) => {
		setTimeout(() => res.end('woot'), 100);
	};

	const url = await getUrl(fn);
	const res = await fetch(url).then(r => r.text());

	t.deepEqual(res, 'woot');
});

test('json should throw 400 on empty body with no headers', async t => {
	const fn = async req => json(req);

	const url = await getUrl(fn);

	const res = await fetch(url);
	const body = await res.text();
	t.is(body, 'Invalid JSON');
	t.is(res.status, 400);
});

test('buffer should throw 400 on invalid encoding', async t => {
	const fn = async req => buffer(req, {encoding: 'lol'});

	const url = await getUrl(fn);

	const res = await fetch(url, {
		method: 'POST',
		body: '❤️'
	});
	const body = await res.text();
	t.is(body, 'Invalid body');
	t.is(res.status, 400);
});

test('buffer works', async t => {
	const fn = async req => buffer(req);
	const url = await getUrl(fn);
	const res = await fetch(url, {method: 'POST', body: '❤️'});
	const body = await res.text();
	t.is(body, '❤️');
});

test('Content-Type header for JSON is set', async t => {
	const url = await getUrl(() => ({}));
	const res = await fetch(url);

	t.is(res.headers.get('content-type'), 'application/json; charset=utf-8');
});
