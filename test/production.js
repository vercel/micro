// Packages
const test = require('ava');
const fetch = require('node-fetch');
const listen = require('test-listen');

process.env.NODE_ENV = 'production';
const micro = require('../packages/micro');

const {getUrl} = require('./_test-utils')({micro, listen});

test.serial('errors are printed in console in production', async t => {
	let logged = false;
	const _error = console.error;
	console.error = () => {
		logged = true;
	};

	const fn = () => {
		throw new Error('Bang');
	};

	const url = await getUrl(fn);
	const res = await fetch(url);
	t.true(logged);
	t.deepEqual(res.status, 500);
	console.error = _error;
});
