import { test } from 'tap';
import { parseEndpoint } from 'micro/src/lib/parse-endpoint';

void test('parses TCP URI', (t) => {
  t.same(parseEndpoint('tcp://my-host-name.foo.bar:12345'), [
    12345,
    'my-host-name.foo.bar',
  ]);
  t.same(parseEndpoint('tcp://0.0.0.0:8080'), [8080, '0.0.0.0']);

  // with the default
  t.same(parseEndpoint('tcp://1.2.3.4'), [3000, '1.2.3.4']);
  t.end();
});

void test('parses UNIX domain socket URI', (t) => {
  t.same(parseEndpoint('unix:/foo/bar.sock'), ['/foo/bar.sock']);
  t.same(parseEndpoint('unix:///foo/bar.sock'), ['/foo/bar.sock']);
  t.end();
});

void test('parses Windows named pipe URI', (t) => {
  t.same(parseEndpoint('pipe:\\\\.\\pipe\\some-name'), [
    '\\\\.\\pipe\\some-name',
  ]);
  t.end();
});

void test('throws on invalid scheme (protocol)', (t) => {
  t.throws(
    () => parseEndpoint('foobar://blah'),
    'Unknown --listen endpoint scheme (protocol): foobar:',
  );
  t.end();
});

void test('throws on invalid Windows named pipe', (t) => {
  t.throws(
    () => parseEndpoint('pipe:lolsickbro'),
    'Invalid Windows named pipe endpoint: pipe:lolsickbro',
  );
  t.throws(
    () => parseEndpoint('pipe://./pipe/lol'),
    'Invalid Windows named pipe endpoint: pipe://./pipe/lol',
  );
  t.end();
});

void test('throws on invalid UNIX domain socket', (t) => {
  t.throws(
    () => parseEndpoint('unix:'),
    'Invalid UNIX domain socket endpoint: unix:',
  );
  t.end();
});
