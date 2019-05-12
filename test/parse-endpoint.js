const test = require('ava');

const parseEndpoint = require('../packages/micro/lib/parse-endpoint');

test('parses TCP URI', async t => {
	t.deepEqual(parseEndpoint('tcp://my-host-name.foo.bar:12345'), [12345, 'my-host-name.foo.bar']);
	t.deepEqual(parseEndpoint('tcp://0.0.0.0:8080'), [8080, '0.0.0.0']);

	// with the default
	t.deepEqual(parseEndpoint('tcp://1.2.3.4'), [3000, '1.2.3.4']);
});

test('parses UNIX domain socket URI', async t => {
	t.deepEqual(parseEndpoint('unix:/foo/bar.sock'), ['/foo/bar.sock']);
	t.deepEqual(parseEndpoint('unix:///foo/bar.sock'), ['/foo/bar.sock']);
});

test('parses Windows named pipe URI', async t => {
	t.deepEqual(parseEndpoint('pipe:\\\\.\\pipe\\some-name'), ['\\\\.\\pipe\\some-name']);
});

test('throws on invalid URI', async t => {
	t.throws(() => parseEndpoint('qwertyuiop'), 'Invalid URL: qwertyuiop');
	t.throws(() => parseEndpoint('tcp://:8080'), 'Invalid URL: tcp://:8080');
});

test('throws on invalid scheme (protocol)', async t => {
	t.throws(() => parseEndpoint('foobar://blah'), 'Unknown --listen endpoint scheme (protocol): foobar:');
});

test('throws on invalid Windows named pipe', async t => {
	t.throws(() => parseEndpoint('pipe:lolsickbro'), 'Invalid Windows named pipe endpoint: pipe:lolsickbro');
	t.throws(() => parseEndpoint('pipe://./pipe/lol'), 'Invalid Windows named pipe endpoint: pipe://./pipe/lol');
});

test('throws on invalid UNIX domain socket', async t => {
	t.throws(() => parseEndpoint('unix:'), 'Invalid UNIX domain socket endpoint: unix:');
});
