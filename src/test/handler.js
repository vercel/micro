// Native
import path from 'path';

// Packages
import ava from 'ava';
import sinon from 'sinon';
import rewire from 'rewire';

const handle = rewire('../handler').default;
const { serial: test } = ava;

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
	const file = path.resolve('src/test/fixtures/native-promise-export');

	const result = await handle(file);
	t.is(typeof result, 'function');
});

test('handle an object that holds a PromiseInstance', async t => {
	const file = path.resolve('src/test/fixtures/babel-promise-export');
	const result = await handle(file);
	t.is(typeof result, 'function');
});

test('process.exit when handling an invalid object', async t => {
	const file = path.resolve('src/test/fixtures/regular-object');
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

// TODO: Should be fixed!
// test.only('log and process.exit when node version is below 8', async t => {
// 	// Stub process.versions.node.split()
// 	sinon.stub(String.prototype, 'split').callsFake(() => '7');
// 	const logErrorSpy = sinon.spy();
// 	handle.__set__('logError', logErrorSpy);
// 	console.log('++++++++++++++')
// 	const file = path.resolve('src/test/fixtures/syntax-error');
// 	const promise = handle(file);
// 	await t.throws(promise);
// 	t.is(logErrorSpy.callCount, 2);
// 	t.is(process.exit.getCall(0).args[0], 1);
// });
