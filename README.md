![](https://cldup.com/JDmmHX3uhF.svg)

_**Micro —** Async HTTP microservices_

[![Build Status](https://travis-ci.org/zeit/micro.svg?branch=master)](https://travis-ci.org/zeit/micro) ![NPM version](https://badge.fury.io/js/micro.svg)

## Features

* **Easy**. Designed for usage with `async` and `await` ([more](https://zeit.co/blog/async-and-await))
* **Fast**. Ultra-high performance (even JSON parsing is opt-in).
* **Micro**. The whole project is ~100 lines of code.
* **Agile**. Super easy deployment and containerization.
* **Simple**. Oriented for single purpose modules (function).
* **Explicit**. No middleware. Modules declare all dependencies.
* **Standard**. Just HTTP!

## Example

The following example `sleep.js` will wait before responding (without blocking!)

```js
import { send } from 'micro-core';
import sleep from 'then-sleep';

export default async function (req, res) {
  await sleep(500);
  send(res, 200, 'Ready!');
}
```

To run the microservice on port `3000`, use the `micro` command:

```bash
$ micro -p 3000 sleep.js
```

To run the microservice on port `3000` and localhost instead of listening on every interface, use the `micro` command:

```bash
$ micro -p 3000 -h localhost sleep.js
```

## Documentation

### Installation

**Note**: `micro` requires Node `0.12` or later

Install from NPM:

```js
$ npm init
$ npm install micro --save
```

Then in your `package.json`:

```js
"scripts": {
  "start": "micro -p 3000 index.js"
}
```

Then write your `index.js` (see above for an example). To run your
app and make it listen on `http://localhost:3000` run:

```bash
$ npm start
```

### CLI

```

  Usage: micro [options] <file>

  Options:

    -h, --help      output usage information
    -V, --version   output the version number
    -p, --port      Port to listen on (3000)
    -h, --host      Host to listen on (0.0.0.0)
    -n, --no-babel  Skip Babel transformation

```

By default, `micro` will transpile the target file and its relative dependencies so that `async`/`await` and [ES6](http://rauchg.com/2015/ecmascript-6/) work for you.

For production, we recommend you first transpile and use `--no-babel` to make bootup time much faster. That said, if you don't care about how long it takes to boot, the default flags are perfectly suitable for production.

Read more about [Transpilation](#transpilation) to understand what transformations are recommended.

### API

#### micro
**`micro(fn, { onError = null })`**

- This function is exposed as the `default` export.
- Use `import micro from 'micro'` or `require('micro')`.
- Returns a [`http.Server`](https://nodejs.org/dist/latest-v4.x/docs/api/http.html#http_class_http_server) that uses the provided `fn` as the request handler.
- The supplied function is run with `await`. It can be `async`!
- The `onError` function is invoked with `req, res, err` if supplied (see [Error Handling](#error-handling))
- Example:

  ```js
  import micro from 'micro';
  import sleep from 'then-sleep';
  const srv = micro(async function (req, res) {
    await sleep(500);
    res.writeHead(200);
    res.end('woot');
  });
  srv.listen(3000);
  ```

#### json

**`json(req, { limit = '1mb' })`**

- Use `import { json } from 'micro'` or `require('micro').json`.
- Buffers and parses the incoming body and returns it.
- Exposes an `async` function that can be run with  `await`.
- `limit` is how much data is aggregated before parsing at max. Otherwise, an `Error` is thrown with `statusCode` set to `413` (see [Error Handling](#error-handling)). It can be a `Number` of bytes or [a string](https://www.npmjs.com/package/bytes) like `'1mb'`.
- If JSON parsing fails, an `Error` is thrown with `statusCode` set to `400` (see [Error Handling](#error-handling))
- Example:

  ```js
  import { json, send } from 'micro';
  export default async function (req, res) {
    const data = await json(req);
    console.log(data.price);
    send(res, 200);
  }
  ```

#### send

**`send(res, statusCode, data = null)`**

- Use `import { send } from 'micro'` or `require('micro').send`.
- `statusCode` is a `Number` with the HTTP error code, and must always be supplied.
- If `data` is supplied it is sent in the response. Different input types are processed appropriately, and `Content-Type` and `Content-Length` are automatically set.
  - `Stream`: `data` is piped as an `octet-stream`. Note: it is _your_ responsibility to handle the `error` event in this case (usually, simply logging the error and aborting the response is enough).
  - `Buffer`: `data` is written as an `octet-stream`.
  - `object`: `data` is serialized as JSON.
  - `string`: `data` is written as-is.
- If JSON serialization fails (for example, if a cyclical reference is found), a `400` error is thrown. See [Error Handling](#error-handling).
- Example

  ```js
  import { send } from 'micro';
  export default async function (req, res) {
    send(res, 400, { error: 'Please use a valid email' });
  }
  ```

#### return

**`return val;`**

- Returning `val` from your function is shorthand for: `send(res, 200, val)`.
- Example

  ```js
  export default function (req, res) {
    return {message: 'Hello!'};
  }
  ```

- Returning a promise works as well!
- Example

  ```js
  import sleep from 'then-sleep';
  export default async function(req, res) => {
    return new Promise(async (resolve) => {
      await sleep(100);
      resolve('I Promised');
    });
  }
  ```

#### sendError

**`send(req, res, error)`**

- Use `import { sendError } from 'micro'` or `require('micro').sendError`.
- Used as the default handler for `onError`.
- Automatically sets the status code of the response based on `error.statusCode`.
- Sends the `error.message` as the body.
- During development (when `NODE_ENV` is set to `'development'`), stacks are printed out with `console.error` and also sent in responses.
- Usually, you don't need to invoke this method yourself, as you can use the [built-in error handling](error-handling) flow with `throw`.

<a name="error-handling"></a>

### Error handling

Micro allows you to write robust microservices. This is accomplished primarily by bringing sanity back to error handling and avoiding callback soup.

If an error is thrown and not caught by you, the response will automatically be `500`. **Important:** during development mode (if the env variable `NODE_ENV` is `'development'`), error stacks will be printed as `console.error` and included in the responses.

If the `Error` object that's thrown contains a `statusCode` property, that's used as the HTTP code to be sent. Let's say you want to write a rate limiting module:

```js
import rateLimit from 'my-rate-limit';
export default async function (req, res) {
  await rateLimit(req);
  // … your code
}
```

If the API endpoint is abused, it can throw an error like so:

```js
if (tooMany) {
  const err = new Error('Rate limit exceeded');
  err.statusCode = 429;
  throw err;
}
```

The nice thing about this model is that the `statusCode` is merely a suggestion. The user can override it:

```js
try {
  await rateLimit(req);
} catch (err) {
  if (429 == err.statusCode) {
    // perhaps send 500 instead?
    send(res, 500);
  }
}
```

If the error is based on another error that **Micro** caught, like a `JSON.parse` exception, then `originalError` will point to it.

If a generic error is caught, the status will be set to `500`.

In order to set up your own error handling mechanism, you can pass a custom `onError` function to micro:

```js
const myErrorHandler = async (req, res, err) => {
  // your own logging here
  res.writeHead(500);
  res.end('error!');
};
micro(handler, { onError: myErrorHandler });
```

**However**, generally you want to instead use simple composition:

```js
export default handleErrors(async (req, res) => {
  throw new Error('What happened here?');
});

function handleErrors (fn) {
  return async function (req, res) {
    try {
      return await fn(req, res);
    } catch (err) {
      console.log(err.stack);
      send(res, 500, 'My custom error!');
    }
  }
}
```

### Testing

Micro makes tests compact and a pleasure to read and write.
We recommend [ava](https://github.com/sindresorhus/ava), a highly parallel micro test framework with built-in support for async tests:

```js
import test from 'ava';
import listen from './listen';
import { send } from 'micro';
import request from 'request-promise';

test('my endpoint', async t => {
  const fn = async function (req, res) {
    send(res, 200, { test: 'woot' });
  };
  const url = await listen(fn);
  const body = await request(url);
  t.same(body.test, 'woot');
});
```

Look at the [test-listen](https://github.com/zeit/test-listen) for a
function that returns a URL with an ephemeral port every time it's called.

### Transpilation

The [Babel](https://babeljs.io/) configuration `micro` uses is:

```json
{
  "presets": ["es2015"],
  "plugins": [
    "transform-runtime",
    "transform-async-to-generator"
  ]
}
```

These require the following NPM modules (versions might vary)

```json
{
    "babel-plugin-transform-async-to-generator": "6.4.6",
    "babel-plugin-transform-runtime": "6.4.3",
    "babel-preset-es2015": "6.3.13"
}
```

### Deployment

You can use the `micro` CLI for `npm start`:

```json
{
  "name": "my-microservice",
  "dependencies": {
    "micro": "x.y.z"
  },
  "scripts": {
    "start": "micro -p 3000 microservice.js"
  }
}
```

Then your `Dockerfile` can look like this:

```
FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
EXPOSE 3000
CMD [ "npm", "start" ]
```

### Contributing

- Run `gulp help`  to see available tasks.
- Before submitting a PR, please run `gulp lint` and `gulp test`.
- We use [`standard`](https://github.com/feross/standard) + semicolons.
- Please [be welcoming](http://contributor-covenant.org/).

## Credits

- Thanks Tom Yandell and Richard Hodgson for donating the  `micro` npm name.
- Copyright © 2016 Zeit, Inc and project authors.
- Licensed under MIT.
- ▲
