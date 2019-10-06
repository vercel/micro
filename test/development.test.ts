// Packages
const fetch = require('@zeit/fetch-retry')(require('node-fetch'));
import listen from 'test-listen';

process.env.NODE_ENV = 'development';
import micri, { Server, IncomingMessage, ServerResponse } from '../src/index';
import { MicriError } from '../src/index';

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

test('send(200, <Object>) is pretty-printed', async () => {
	const fn = () => ({ woot: 'yes' });

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.text();

	expect(body).toEqual('{\n  "woot": "yes"\n}');
});

test('sendError sends Internal Server Error with Error', async () => {
	const fn = () => {
		throw new Error('Custom');
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		headers: {
			Accept: 'application/json'
		}
	});
	const body = await res.json();

	expect(res.status).toEqual(500);
	expect(body.error.message).toEqual('Internal Server Error');
});

test('sendError sends plain text Internal Server Error with Error', async () => {
	const fn = () => {
		throw new Error('Custom');
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		headers: {
			Accept: 'text/plain'
		}
	});
	const body = await res.text();

	expect(res.status).toEqual(500);
	expect(body).toEqual('Internal Server Error');
});

test('sendError shows stack in development with statusCode', async () => {
	const fn = () => {
		throw new MicriError(503, 'test', 'Custom');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	const body = await res.json();

	expect(res.status).toEqual(503);
	expect(body.error.code).toEqual('test');
	expect(body.error.message).toEqual('Custom');
	expect(body.error.stack).toEqual(expect.stringContaining('at fn'));
});

test('sendError shows plain text stack in development with statusCode', async () => {
	const fn = () => {
		throw new MicriError(503, 'test', 'Custom');
	};

	const url = await getUrl(fn);
	const res = await fetch(url, {
		headers: {
			accept: 'text/plain'
		}
	});
	const body = await res.text();

	expect(res.status).toEqual(503);
	expect(body).toEqual(expect.stringContaining('Custom'));
	expect(body).toEqual(expect.stringContaining('at fn'));
});
