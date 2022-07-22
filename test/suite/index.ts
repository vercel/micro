import http from 'http';
import Stream from 'stream';
import { Socket } from 'net';
import { stub } from 'sinon';
import { test } from 'tap';
import {
  serve,
  run,
  send,
  sendError,
  buffer,
  json,
  HttpError,
} from 'micro/src/lib/index';
import fetch from 'node-fetch';
import type { AddressInfo } from 'net';
import type { RequestHandler, BufferInfo } from 'micro/src/lib/index';

function startServer(handler: RequestHandler): Promise<[string, () => void]> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(serve(handler));

    server.on('error', reject);

    server.listen(() => {
      const { port } = server.address() as AddressInfo;
      resolve([
        `http://localhost:${port}`,
        () => {
          server.close();
        },
      ]);
    });
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

void test('send(200, <String>)', async (t) => {
  const fn: RequestHandler = (req, res) => {
    send(res, 200, 'woot');
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);
  const body = await res.text();

  t.same(body, 'woot');
  shutdown();
});

void test('send(200, <Object>)', async (t) => {
  const fn: RequestHandler = (req, res) => {
    send(res, 200, {
      a: 'b',
    });
  };

  const [url, shutdown] = await startServer(fn);

  const res: unknown = await fetch(url).then((r) => r.json());

  t.same(res, {
    a: 'b',
  });
  shutdown();
});

void test('send(200, <Number>)', async (t) => {
  const fn: RequestHandler = (req, res) => {
    // Chosen by fair dice roll. guaranteed to be random.
    send(res, 200, 4);
  };

  const [url, shutdown] = await startServer(fn);
  const res: unknown = await fetch(url).then((r) => r.json());

  t.same(res, 4);
  shutdown();
});

void test('send(200, <Buffer>)', async (t) => {
  const fn: RequestHandler = (req, res) => {
    send(res, 200, Buffer.from('muscle'));
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'muscle');
  shutdown();
});

void test('send(200, <Stream>)', async (t) => {
  const fn: RequestHandler = (req, res) => {
    send(res, 200, 'waterfall');
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'waterfall');
  shutdown();
});

void test('send(<Number>)', async (t) => {
  const fn: RequestHandler = (req, res) => {
    send(res, 404);
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url);
  t.same(status, 404);
  shutdown();
});

void test('return <String>', async (t) => {
  const fn: RequestHandler = () => 'woot';

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'woot');
  shutdown();
});

void test('return <Promise>', async (t) => {
  const fn: RequestHandler = async () => {
    await sleep(100);
    return 'I Promise';
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'I Promise');
  shutdown();
});

void test('sync return <String>', async (t) => {
  const fn: RequestHandler = () => 'argon';

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'argon');
  shutdown();
});

void test('return empty string', async (t) => {
  const fn: RequestHandler = () => '';

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, '');
  shutdown();
});

void test('return <Object>', async (t) => {
  const fn: RequestHandler = () => ({
    a: 'b',
  });

  const [url, shutdown] = await startServer(fn);
  const res: unknown = await fetch(url).then((r) => r.json());

  t.same(res, {
    a: 'b',
  });
  shutdown();
});

void test('return <Number>', async (t) => {
  const fn: RequestHandler = () =>
    // Chosen by fair dice roll. guaranteed to be random.
    4;

  const [url, shutdown] = await startServer(fn);
  const res: unknown = await fetch(url).then((r) => r.json());

  t.same(res, 4);
  shutdown();
});

void test('return <Buffer>', async (t) => {
  const fn: RequestHandler = () => Buffer.from('Hammer');

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'Hammer');
  shutdown();
});

void test('return <Stream>', async (t) => {
  const fn: RequestHandler = () => {
    const stream = new Stream.Transform();
    stream.push('River');
    stream.end();
    return stream;
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'River');
  shutdown();
});

void test('return <null>', async (t) => {
  const fn: RequestHandler = () => null;

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);
  const body = await res.text();

  t.equal(res.status, 204);
  t.equal(body, '');
  shutdown();
});

void test('return <null> calls res.end once', async (t) => {
  const fn: RequestHandler = () => null;

  const req = new http.IncomingMessage(new Socket());
  const res = new http.ServerResponse(req);
  const fake = stub(res, 'end');

  await run(req, res, fn);

  t.equal(fake.calledOnce, true);
});

void test('throw with code', async (t) => {
  const fn: RequestHandler = async () => {
    await sleep(100);

    const err = new HttpError('Error from test (expected)');
    err.statusCode = 402;
    throw err;
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url);

  t.same(status, 402);
  shutdown();
});

void test('throw (500)', async (t) => {
  const fn: RequestHandler = () => {
    throw new Error('500 from test (expected)');
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url);
  t.same(status, 500);
  shutdown();
});

void test('throw (500) sync', async (t) => {
  const fn: RequestHandler = () => {
    throw new Error('500 from test (expected)');
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url);
  t.same(status, 500);
  shutdown();
});

void test('send(200, <Stream>) with error on same tick', async (t) => {
  const fn: RequestHandler = (req, res) => {
    const stream = new Stream.Transform();
    stream.push('error-stream');

    stream.emit('error', new Error('500 from test (expected)'));
    stream.end();
    send(res, 200, stream);
  };

  const [url, shutdown] = await startServer(fn);
  const { status } = await fetch(url);

  t.same(status, 500);
  shutdown();
});

void test('custom error', async (t) => {
  const fn: RequestHandler = async () => {
    await sleep(50);
    throw new Error('500 from test (expected)');
  };

  const handleErrors =
    (ofn: RequestHandler) =>
    async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        return await ofn(req, res);
      } catch (err) {
        send(res, 200, 'My custom error!');
      }
    };

  const [url, shutdown] = await startServer(handleErrors(fn));
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'My custom error!');
  shutdown();
});

void test('custom async error', async (t) => {
  const fn: RequestHandler = async () => {
    await sleep(50);
    throw new Error('500 from test (expected)');
  };

  const handleErrors =
    (ofn: RequestHandler) =>
    async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        return await ofn(req, res);
      } catch (err) {
        send(res, 200, 'My custom error!');
      }
    };

  const [url, shutdown] = await startServer(handleErrors(fn));
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'My custom error!');
  shutdown();
});

void test('json parse error', async (t) => {
  const fn: RequestHandler = async (req, res) => {
    const body = await json(req);
    send(res, 200, (body as { woot: string }).woot);
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url, {
    method: 'POST',
    body: '{ "bad json" }',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  t.same(status, 400);
  shutdown();
});

void test('json', async (t) => {
  interface Payload {
    some: { cool: string };
  }
  const fn: RequestHandler = async (req, res) => {
    const body = await json(req);

    send(res, 200, {
      response: (body as Payload).some.cool,
    });
  };

  const [url, shutdown] = await startServer(fn);

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      some: {
        cool: 'json',
      },
    }),
  });
  const body: unknown = await res.json();

  t.same((body as { response: unknown }).response, 'json');
  shutdown();
});

void test('json limit (below)', async (t) => {
  interface Payload {
    some: { cool: string };
  }
  const fn: RequestHandler = async (req, res) => {
    const body = await json(req, {
      limit: 100,
    });

    send(res, 200, {
      response: (body as Payload).some.cool,
    });
  };

  const [url, shutdown] = await startServer(fn);

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      some: {
        cool: 'json',
      },
    }),
  });
  const body: unknown = await res.json();

  t.same((body as { response: unknown }).response, 'json');
  shutdown();
});

void test('json limit (over)', async (t) => {
  const fn: RequestHandler = async (req, res) => {
    try {
      await json(req, {
        limit: 3,
      });
    } catch (err) {
      t.same((err as HttpError).statusCode, 413);
    }

    send(res, 200, 'ok');
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      some: {
        cool: 'json',
      },
    }),
  });
  t.same(res.status, 200);
  shutdown();
});

void test('json circular', async (t) => {
  interface Payload {
    circular: boolean;
    obj?: Payload;
  }
  const fn: RequestHandler = (req, res) => {
    const obj: Payload = {
      circular: true,
    };

    obj.obj = obj;
    send(res, 200, obj);
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url);
  t.same(status, 500);
  shutdown();
});

void test('no async', async (t) => {
  const fn: RequestHandler = (req, res) => {
    send(res, 200, {
      a: 'b',
    });
  };

  const [url, shutdown] = await startServer(fn);
  const obj: unknown = await fetch(url).then((r) => r.json());

  t.same((obj as { a: string }).a, 'b');
  shutdown();
});

void test('limit included in error', async (t) => {
  interface Payload {
    some: { cool: string };
  }
  const fn: RequestHandler = async (req, res) => {
    let body;

    try {
      body = await json(req, {
        limit: 3,
      });
    } catch (err) {
      t.ok((err as Error).message.includes('exceeded 3 limit'));
    }

    send(res, 200, {
      response: (body as Payload).some.cool,
    });
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      some: {
        cool: 'json',
      },
    }),
  });

  t.same(res.status, 500);
  shutdown();
});

void test('support for status fallback in errors', async (t) => {
  const fn: RequestHandler = (req, res) => {
    const err = new HttpError('Custom');
    err.statusCode = 403;
    sendError(req, res, err);
  };

  const [url, shutdown] = await startServer(fn);
  const { status } = await fetch(url);
  t.same(status, 403);
  shutdown();
});

void test('json from rawBodyMap works', async (t) => {
  interface Payload {
    some: { cool: string };
  }
  const fn: RequestHandler = async (req, res) => {
    const bodyOne = await json(req);
    const bodyTwo = await json(req);

    t.same(bodyOne, bodyTwo);

    send(res, 200, {
      response: (bodyOne as Payload).some.cool,
    });
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      some: {
        cool: 'json',
      },
    }),
  });
  const body: unknown = await res.json();

  t.same((body as { response: unknown }).response, 'json');
  shutdown();
});

void test('statusCode defaults to 200', async (t) => {
  const fn: RequestHandler = () => {
    return 'woot';
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);
  const body = await res.text();
  t.equal(body, 'woot');
  t.equal(res.status, 200);
  shutdown();
});

void test('statusCode on response works', async (t) => {
  const fn: RequestHandler = (req, res) => {
    res.statusCode = 400;
    return 'woot';
  };

  const [url, shutdown] = await startServer(fn);

  const { status } = await fetch(url);
  t.same(status, 400);
  shutdown();
});

void test('Content-Type header is preserved on string', async (t) => {
  const fn: RequestHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    return '<blink>woot</blink>';
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);

  t.equal(res.headers.get('content-type'), 'text/html');
  shutdown();
});

void test('Content-Type header is preserved on stream', async (t) => {
  const fn: RequestHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const stream = new Stream.Transform();
    stream.push('River');
    stream.end();
    return stream;
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);

  t.equal(res.headers.get('content-type'), 'text/html');
  shutdown();
});

void test('Content-Type header is preserved on buffer', async (t) => {
  const fn: RequestHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    return Buffer.from('hello');
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);

  t.equal(res.headers.get('content-type'), 'text/html');
  shutdown();
});

void test('Content-Type header is preserved on object', async (t) => {
  const fn: RequestHandler = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    return {};
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url);

  t.equal(res.headers.get('content-type'), 'text/html');
  shutdown();
});

void test('res.end is working', async (t) => {
  const fn: RequestHandler = (req, res) => {
    setTimeout(() => res.end('woot'), 100);
  };

  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url).then((r) => r.text());

  t.same(res, 'woot');
  shutdown();
});

void test('json should throw 400 on empty body with no headers', async (t) => {
  const fn: RequestHandler = (req) => json(req);

  const [url, shutdown] = await startServer(fn);

  const res = await fetch(url);
  const body = await res.text();
  t.equal(body, 'Invalid JSON');
  t.equal(res.status, 400);
  shutdown();
});

void test('buffer should throw 400 on invalid encoding', async (t) => {
  const bufferInfo = { encoding: 'lol' };

  const fn: RequestHandler = async (req) =>
    buffer(req, bufferInfo as BufferInfo);

  const [url, shutdown] = await startServer(fn);

  const res = await fetch(url, {
    method: 'POST',
    body: '❤️',
  });
  const body = await res.text();

  t.equal(body, 'Invalid body');
  t.equal(res.status, 400);
  shutdown();
});

void test('buffer works', async (t) => {
  const fn: RequestHandler = (req) => buffer(req);
  const [url, shutdown] = await startServer(fn);
  const res = await fetch(url, { method: 'POST', body: '❤️' });
  const body = await res.text();
  t.equal(body, '❤️');
  shutdown();
});

void test('Content-Type header for JSON is set', async (t) => {
  const [url, shutdown] = await startServer(() => ({}));
  const res = await fetch(url);

  t.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
  shutdown();
});
