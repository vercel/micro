// Native
const path = require('path');

// Packages
const {serial: test} = require('ava');
const sinon = require('sinon');
const rewire = require('rewire');

const handle = rewire('../packages/micro/lib/handler');

test.beforeEach(() => {
	sinon.stub(process, 'exit');
	process.exit.callsFake(() => {
		// Throw error to finish the execution of the code
		throw new Error();
	});
});

test.afterEach(() => {
	process.exit.restore();
	try {
		String.prototype.split.restore();
	} catch (err) {
		// swallow
	}
});

test('handle a PromiseInstance', async t => {
	const file = path.resolve('test/fixtures/native-promise-export');
	const result = await handle(file);
	t.is(typeof result, 'function');
});

test('handle an object that holds a PromiseInstance', async t => {
	const file = path.resolve('test/fixtures/babel-promise-export');
	const result = await handle(file);
	t.is(typeof result, 'function');
});

test('process.exit when handling an invalid object', async t => {
	const file = path.resolve('test/fixtures/regular-object');
	const promise = handle(file);
	await t.throws(promise);
	t.is(process.exit.getCall(0).args[0], 1);
});

test('process.exit when handling and inexisting file', async t => {
	const file = path.resolve('foo/bar');
	const promise = handle(file);
	await t.throws(promise);
	t.is(process.exit.getCall(0).args[0], 1);
});
