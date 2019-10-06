const parseEndpoint = require('../lib/parse-endpoint');

test('parses TCP URI', async () => {
	expect(parseEndpoint('tcp://my-host-name.foo.bar:12345')).toEqual([12345, 'my-host-name.foo.bar']);
	expect(parseEndpoint('tcp://0.0.0.0:8080')).toEqual([8080, '0.0.0.0']);

	// with the default
	expect(parseEndpoint('tcp://1.2.3.4')).toEqual([3000, '1.2.3.4']);
});

test('parses UNIX domain socket URI', async () => {
	expect(parseEndpoint('unix:/foo/bar.sock')).toEqual(['/foo/bar.sock']);
	expect(parseEndpoint('unix:///foo/bar.sock')).toEqual(['/foo/bar.sock']);
});

test('parses Windows named pipe URI', async () => {
	expect(parseEndpoint('pipe:\\\\.\\pipe\\some-name')).toEqual(['\\\\.\\pipe\\some-name']);
});

test('throws on invalid URI', async () => {
	expect(() => parseEndpoint('qwertyuiop')).toThrow('Invalid URL: qwertyuiop');
	expect(() => parseEndpoint('tcp://:8080')).toThrow('Invalid URL: tcp://:8080');
});

test('throws on invalid scheme (protocol)', async () => {
	expect(() => parseEndpoint('foobar://blah')).toThrow('Unknown --listen endpoint scheme (protocol): foobar:');
});

test('throws on invalid Windows named pipe', async () => {
	expect(() => parseEndpoint('pipe:lolsickbro')).toThrow('Invalid Windows named pipe endpoint: pipe:lolsickbro');
	expect(() => parseEndpoint('pipe://./pipe/lol')).toThrow('Invalid Windows named pipe endpoint: pipe://./pipe/lol');
});

test('throws on invalid UNIX domain socket', async () => {
	expect(() => parseEndpoint('unix:')).toThrow('Invalid UNIX domain socket endpoint: unix:');
});
