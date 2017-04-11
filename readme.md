![](https://raw.githubusercontent.com/zeit/art/31913be3107827adf10e1f491ec61480f63e19af/micro/logo.png)

_**Micro —** Async ES6 HTTP microservices_

[![Build Status](https://travis-ci.org/zeit/micro.svg?branch=master)](https://travis-ci.org/zeit/micro)
[![Coverage Status](https://coveralls.io/repos/github/zeit/micro/badge.svg?branch=master)](https://coveralls.io/github/zeit/micro?branch=master)
[![Slack Channel](http://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

## Features

* **Easy**. Designed for usage with `async` and `await` ([more](https://zeit.co/blog/async-and-await))
* **Fast**. Ultra-high performance (even JSON parsing is opt-in).
* **Micro**. The whole project is ~100 lines of code.
* **Agile**. Super easy deployment and containerization.
* **Simple**. Oriented for single purpose modules (function).
* **Explicit**. No middleware. Modules declare all dependencies.
* **Standard**. Just HTTP!
* **Lightweight**. The package is small and the `async` transpilation is fast and transparent

## Usage

Firstly, install it:

```bash
npm install --save micro
```

Then add a `start` script to your `package.json` like this:

```json
{
  "main": "index.js",
  "scripts": {
    "start": "micro"
  }
}
```

Then create an `index.js` file and populate it with function, that accepts standard [http.IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage) and [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) objects:

```js
module.exports = (req, res) => { res.end('Welcome to micro') }
```

Micro provides [useful helpers](https://github.com/zeit/micro#body-parsing) but also handles return values – so you can write it even shorter!

```js
module.exports = () => 'Welcome to micro'
```

Once all of that is done, just start the server:

```bash
npm start
```

And go to this URL: `http://localhost:3000` - 🎉

Now make sure to check out [awesome-micro](https://github.com/amio/awesome-micro) - a collection of plugins for micro!

### `async` & `await`

<p><details>
  <summary><b>Examples</b></summary>
  <ul><li><a href="./examples/external-api-call">Fetch external api</a></li></ul>
</details></p>

Micro is built for usage with async/await. You can read more about async / await [here](https://zeit.co/blog/async-and-await)

```js
const sleep = require('then-sleep')

module.exports = async (req, res) => {
  await sleep(500)
  return 'Ready!'
}
```

#### Transpilation

We use [is-async-supported](https://github.com/timneutkens/is-async-supported) combined with [async-to-gen](https://github.com/leebyron/async-to-gen),
so that the we only convert `async` and `await` to generators when needed.

If you want to do it manually, you can! `micro(1)` is idempotent and
should not interfere.

`micro` exclusively supports Node 6+ to avoid a big transpilation
pipeline. `async-to-gen` is fast and can be distributed with
the main `micro` package due to its small size.

### Body parsing

<p id="body-parsing-examples"><details>
  <summary><b>Examples</b></summary>
  <ul>
    <li><a href="./examples/json-body-parsing">Parse JSON</a></li>
    <li><a href="./examples/urlencoded-body-parsing">Parse urlencoded form (html `form` tag)</a></li>
  </ul>
</details></p>

For parsing the incoming request body we included an async functions `buffer`, `text` and `json`

```js
const {buffer, text, json} = require('micro')

module.exports = async (req, res) => {
  const buf = await buffer(req)
  console.log(buf)
  // <Buffer 7b 22 70 72 69 63 65 22 3a 20 39 2e 39 39 7d>
  const txt = await text(req)
  // '{"price": 9.99}'
  const js = await json(req)
  // { price: 9.99 }
  console.log(js.price)
  return ''
}
```

#### API

##### `buffer(req, { limit = '1mb', encoding = 'utf8' })`
##### `text(req, { limit = '1mb', encoding = 'utf8' })`
##### `json(req, { limit = '1mb', encoding = 'utf8' })`

- Buffers and parses the incoming body and returns it.
- Exposes an `async` function that can be run with  `await`.
- Can be called multiple times, as it caches the raw request body the first time.
- `limit` is how much data is aggregated before parsing at max. Otherwise, an `Error` is thrown with `statusCode` set to `413` (see [Error Handling](#error-handling)). It can be a `Number` of bytes or [a string](https://www.npmjs.com/package/bytes) like `'1mb'`.
- If JSON parsing fails, an `Error` is thrown with `statusCode` set to `400` (see [Error Handling](#error-handling))

For other types of data check the [examples](#body-parsing-examples)

### Sending a different status code

So far we have used `return` to send data to the client. `return 'Hello World'` is the equivalent of `send(res, 200, 'Hello World')`.

```js
const {send} = require('micro')

module.exports = async (req, res) => {
  const statusCode = 400
  const data = { error: 'Custom error message' }

  send(res, statusCode, data)
}
```

#### API

##### `send(res, statusCode, data = null)`

- Use `require('micro').send`.
- `statusCode` is a `Number` with the HTTP error code, and must always be supplied.
- If `data` is supplied it is sent in the response. Different input types are processed appropriately, and `Content-Type` and `Content-Length` are automatically set.
  - `Stream`: `data` is piped as an `octet-stream`. Note: it is _your_ responsibility to handle the `error` event in this case (usually, simply logging the error and aborting the response is enough).
  - `Buffer`: `data` is written as an `octet-stream`.
  - `object`: `data` is serialized as JSON.
  - `string`: `data` is written as-is.
- If JSON serialization fails (for example, if a cyclical reference is found), a `400` error is thrown. See [Error Handling](#error-handling).

### Programmatic use

You can use micro programmatically by requiring micro directly:

```js
const micro = require('micro')
const sleep = require('then-sleep')

const server = micro(async (req, res) => {
  await sleep(500)
  return 'Hello world'
})

server.listen(3000)
```

#### API

##### micro(fn)

- This function is exposed as the `default` export.
- Use `require('micro')`.
- Returns a [`http.Server`](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_server) that uses the provided `function` as the request handler.
- The supplied function is run with `await`. So it can be `async`

### Error handling

Micro allows you to write robust microservices. This is accomplished primarily by bringing sanity back to error handling and avoiding callback soup.

If an error is thrown and not caught by you, the response will automatically be `500`. **Important:** Error stacks will be printed as `console.error` and during development mode (if the env variable `NODE_ENV` is `'development'`), they will also be included in the responses.

If the `Error` object that's thrown contains a `statusCode` property, that's used as the HTTP code to be sent. Let's say you want to write a rate limiting module:

```js
const rateLimit = require('my-rate-limit')

module.exports = async (req, res) => {
  await rateLimit(req)
  // ... your code
}
```

If the API endpoint is abused, it can throw an error with ``createError`` like so:

```js
if (tooMany) {
  throw createError(429, 'Rate limit exceeded')
}
```

Alternatively you can create the `Error` object yourself

```js
if (tooMany) {
  const err = new Error('Rate limit exceeded')
  err.statusCode = 429
  throw err
}
```

The nice thing about this model is that the `statusCode` is merely a suggestion. The user can override it:

```js
try {
  await rateLimit(req)
} catch (err) {
  if (429 == err.statusCode) {
    // perhaps send 500 instead?
    send(res, 500)
  }
}
```

If the error is based on another error that **Micro** caught, like a `JSON.parse` exception, then `originalError` will point to it.

If a generic error is caught, the status will be set to `500`.

In order to set up your own error handling mechanism, you can use composition in your handler:

```js
const {send} = require('micro')

const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res)
  } catch (err) {
    console.log(err.stack)
    send(res, 500, 'My custom error!')
  }
}

module.exports = handleErrors(async (req, res) => {
  throw new Error('What happened here?')
})
```

#### API

##### sendError(req, res, error)

- Use `require('micro').sendError`.
- Used as the default handler for errors thrown.
- Automatically sets the status code of the response based on `error.statusCode`.
- Sends the `error.message` as the body.
- Stacks are printed out with `console.error` and during development (when `NODE_ENV` is set to `'development'`) also sent in responses.
- Usually, you don't need to invoke this method yourself, as you can use the [built-in error handling](#error-handling) flow with `throw`.

##### createError(code, msg, orig)

- Use `require('micro').createError`.
- Creates an error object with a `statusCode`.
- Useful for easily throwing errors with HTTP status codes, which are interpreted by the [built-in error handling](#error-handling).
- `orig` sets `error.originalError` which identifies the original error (if any).

### Testing

Micro makes tests compact and a pleasure to read and write.
We recommend [ava](https://github.com/sindresorhus/ava), a highly parallel micro test framework with built-in support for async tests:

```js
const micro = require('micro')
const test = require('ava')
const listen = require('test-listen')
const request = require('request-promise')

test('my endpoint', async t => {
  const service = micro(async (req, res) => {
    micro.send(res, 200, {
      test: 'woot'
    })
  })

  const url = await listen(service)
  const body = await request(url)

  t.deepEqual(JSON.parse(body).test, 'woot')
})
```

Look at [test-listen](https://github.com/zeit/test-listen) for a
function that returns a URL with an ephemeral port every time it's called.

### Transpilation

We use [is-async-supported](https://github.com/timneutkens/is-async-supported) combined with [async-to-gen](https://github.com/leebyron/async-to-gen),
so that we only convert `async` and `await` to generators when needed.

If you want to do it manually, you can! `micro(1)` is idempotent and
should not interfere.

`micro` exclusively supports Node 6+ to avoid a big transpilation
pipeline. `async-to-gen` is fast and can be distributed with
the main `micro` package due to its small size.

To use native `async/await` on Node v7.x, run `micro` like the following.

```bash
node --harmony-async-await node_modules/.bin/micro .
```

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
    "start": "micro"
  }
}
```

Then simply run `npm start`!

#### Port based on environment variable

When you want to set the port using an environment variable you can use:

```
micro -p $PORT
```

Optionally you can add a default if it suits your use case:

```
micro -p ${PORT:-3000}
```

`${PORT:-3000}` will allow a fallback to port `3000` when `$PORT` is not defined

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
