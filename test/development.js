// Packages
const test = require('ava');
const request = require('request-promise');
const listen = require('test-listen');
const http = require('http');

process.env.NODE_ENV = 'development';
const micro = require('../packages/micro/lib');

const getUrl = fn => {
	const srv = new http.Server(micro(fn));

	return listen(srv);
};

test('send(200, <Object>) is pretty-printed', async t => {
	const fn = () => ({woot: 'yes'});

	const url = await getUrl(fn);
	const res = await request(url);

	t.deepEqual(res, `{\n  "woot": "yes"\n}`);
});

test('sendError shows stack in development without statusCode', async t => {
	const fn = () => {
		throw new Error('Custom');
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		t.true(err.message.indexOf('at fn (') !== -1);
	}
});

test('sendError shows stack in development with statusCode', async t => {
	const fn = () => {
		const err = new Error('Custom');
		err.statusCode = 503;
		throw err;
	};

	const url = await getUrl(fn);
	try {
		await request(url);
	} catch (err) {
		t.true(err.message.indexOf('at fn (') !== -1);
	}
});
