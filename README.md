![](https://cldup.com/JDmmHX3uhF.svg)

_**Micro —** Async ES6 HTTP microservices_

[![Build Status](https://travis-ci.org/zeit/micro.svg?branch=master)](https://travis-ci.org/zeit/micro)
[![Slack Channel](https://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

## Features

* **Easy**. Designed for usage with `async` and `await` ([more](https://zeit.co/blog/async-and-await))
* **Fast**. Ultra-high performance (even JSON parsing is opt-in).
* **Micro**. The whole project is ~100 lines of code.
* **Agile**. Super easy deployment and containerization.
* **Simple**. Oriented for single purpose modules (function).
* **Explicit**. No middleware. Modules declare all dependencies.
* **Standard**. Just HTTP!
* **Lightweight**. The package is small and the `async` transpilation fast and transparent

## Example

The following example `sleep.js` will wait before responding (without blocking!)

```js
const {send} = require('micro')
const sleep = require('then-sleep')

module.exports = async function (req, res) {
  await sleep(500)
  send(res, 200, 'Ready!')
}
```

To run the microservice on port `3000`, use the `micro` command:

```bash
micro sleep.js
```

To run the microservice on port `3000` and localhost instead of listening on every interface, use the `micro` command:

```bash
micro -H localhost sleep.js
```

## Usage

Install the package (requires at least Node v6):

```js
npm install --save micro
```

And start using it in your `package.json` file:

```js
"main": "index.js",
"scripts": {
  "start": "micro"
}
```

Then write your `index.js` (see above for an example).

After that, you can make the server run by executing the following command:

```bash
npm start
```

### API

#### micro
**`micro(fn)`**

- This function is exposed as the `default` export.
- Use `require('micro')`.
- Returns a [`http.Server`](https://nodejs.org/dist/latest-v4.x/docs/api/http.html#http_class_http_server) that uses the provided `fn` as the request handler.
- The supplied function is run with `await`. It can be `async`!
- Example:

  ```js
  const micro = require('micro');
  const sleep = require('then-sleep');
  const srv = micro(async function (req, res) {
    await sleep(500);
    res.writeHead(200);
    res.end('woot');
  });
  srv.listen(3000);
  ```

#### json

**`json(req, { limit = '1mb' })`**

- Use `require('micro').json`.
- Buffers and parses the incoming body and returns it.
- Exposes an `async` function that can be run with  `await`.
- Can be called multiple times, as it caches the raw request body the first time.
- `limit` is how much data is aggregated before parsing at max. Otherwise, an `Error` is thrown with `statusCode` set to `413` (see [Error Handling](#error-handling)). It can be a `Number` of bytes or [a string](https://www.npmjs.com/package/bytes) like `'1mb'`.
- If JSON parsing fails, an `Error` is thrown with `statusCode` set to `400` (see [Error Handling](#error-handling))
- Example:

  ```js
  const { json, send } = require('micro');
  module.exports = async function (req, res) {
    const data = await json(req);
    console.log(data.price);
    send(res, 200);
  }
  ```

#### send

**`send(res, statusCode, data = null)`**

- Use `require('micro').send`.
- `statusCode` is a `Number` with the HTTP error code, and must always be supplied.
- If `data` is supplied it is sent in the response. Different input types are processed appropriately, and `Content-Type` and `Content-Length` are automatically set.
  - `Stream`: `data` is piped as an `octet-stream`. Note: it is _your_ responsibility to handle the `error` event in this case (usually, simply logging the error and aborting the response is enough).
  - `Buffer`: `data` is written as an `octet-stream`.
  - `object`: `data` is serialized as JSON.
  - `string`: `data` is written as-is.
- If JSON serialization fails (for example, if a cyclical reference is found), a `400` error is thrown. See [Error Handling](#error-handling).
- Example

  ```js
  const { send } = require('micro')
  module.exports = async function (req, res) {
    send(res, 400, { error: 'Please use a valid email' });
  }
  ```

#### return

**`return val;`**

- Returning `val` from your function is shorthand for: `send(res, 200, val)`.
- Example

  ```js
  module.exports = function (req, res) {
    return {message: 'Hello!'};
  }
  ```

- Returning a promise works as well!
- Example

  ```js
  const sleep = require('then-sleep')
  module.exports = async function (req, res) {
    return new Promise(async (resolve) => {
      await sleep(100);
      resolve('I Promised');
    });
  }
  ```

#### sendError

**`sendError(req, res, error)`**

- Use `require('micro').sendError`.
- Used as the default handler for errors thrown.
- Automatically sets the status code of the response based on `error.statusCode`.
- Sends the `error.message` as the body.
- During development (when `NODE_ENV` is set to `'development'`), stacks are printed out with `console.error` and also sent in responses.
- Usually, you don't need to invoke this method yourself, as you can use the [built-in error handling](#error-handling) flow with `throw`.

#### createError

**`createError(code, msg, orig)`**

- Use `require('micro').createError`.
- Creates an error object with a `statusCode`.
- Useful for easily throwing errors with HTTP status codes, which are interpreted by the [built-in error handling](#error-handling).
- `orig` sets `error.originalError` which identifies the original error (if any).

<a name="error-handling"></a>

### Error handling

Micro allows you to write robust microservices. This is accomplished primarily by bringing sanity back to error handling and avoiding callback soup.

If an error is thrown and not caught by you, the response will automatically be `500`. **Important:** during development mode (if the env variable `NODE_ENV` is `'development'`), error stacks will be printed as `console.error` and included in the responses.

If the `Error` object that's thrown contains a `statusCode` property, that's used as the HTTP code to be sent. Let's say you want to write a rate limiting module:

```js
const rateLimit = require('my-rate-limit')
module.exports = async function (req, res) {
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

Alternatively you can use ``createError`` as described above.

```js
if (tooMany) {
  throw createError(429, 'Rate limit exceeded')
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

In order to set up your own error handling mechanism, you can use composition in your handler:

```js
module.exports = handleErrors(async (req, res) => {
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
const micro = require('micro');
const test = require('ava');
const listen = require('test-listen');
const request = require('request-promise');

test('my endpoint', async t => {
  const service = micro(async function (req, res) {
    micro.send(res, 200, { test: 'woot' })
  });

  const url = await listen(service);
  const body = await request(url);
  t.deepEqual(JSON.parse(body).test, 'woot');
});
```

Look at the [test-listen](https://github.com/zeit/test-listen) for a
function that returns a URL with an ephemeral port every time it's called.

### Transpilation

We use [is-async-supported](https://github.com/timneutkens/is-async-supported) combined with [async-to-gen](https://github.com/leebyron/async-to-gen),
so that the we only convert `async` and `await` to generators when needed.

If you want to do it manually, you can! `micro(1)` is idempotent and
should not interfere.

`micro` exclusively supports Node 6+ to avoid a big transpilation
pipeline. `async-to-gen` is fast and can be distributed with
the main `micro` package due to its small size.

### Deployment

You can use the `micro` CLI for `npm start`:

```json
{
  "name": "my-microservice",
  "dependencies": {
    "micro": "x.y.z"
  },
  "main": "microservice.js",
  "scripts": {
    "start": "micro -p 3000"
  }
}
```

Then simply run `npm start`!

## Contribute

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Link the package to the global module directory: `npm link`
3. Transpile the source code and watch for changes: `npm start`
4. Within the module you want to test your local development instance of micro, just link it to the dependencies: `npm link micro`. Instead of the default one from npm, node will now use your clone of micro!

As always, you can run the [AVA](https://github.com/sindresorhus/ava) and [ESLint](http://eslint.org) tests using: `npm test`

## Credits

Thanks Tom Yandell and Richard Hodgson for donating the  `micro` npm name.

## Authors

- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) - [▲ZEIT](https://zeit.co)
- Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [▲ZEIT](https://zeit.co)
