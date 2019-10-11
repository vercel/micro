_**Micri** — Asynchronous HTTP microservices_

> micri is an archaic non-SI decimal metric prefix for 10−14. Its symbol was mc.

[Wikipedia - Micri-](https://en.wikipedia.org/wiki/Micri-)

[![npm version](https://badge.fury.io/js/micri.svg)](https://badge.fury.io/js/micri)
[![Install Size](https://packagephobia.now.sh/badge?p=micri)](https://packagephobia.now.sh/result?p=micri)

## Features

* **Easy**: Designed for usage with `async` and `await` ([more](https://zeit.co/blog/async-and-await))
* **Fast**: Ultra-high performance (even JSON parsing is opt-in)
* **Micri**: The whole project is ~300 lines of code
* **Agile**: Super easy deployment and containerization
* **Simple**: Oriented for single purpose modules (function)
* **Standard**: Just HTTP!
* **Explicit**: No middleware - modules declare all [dependencies](https://github.com/amio/awesome-micro)
* **Lightweight**: [![Install Size](https://packagephobia.now.sh/badge?p=micri)](https://packagephobia.now.sh/result?p=micri)


## Usage

```js
const micri = require('micri')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = micri(async (req, res) => {
  await sleep(500)
  return 'Hello world'
})

server.listen(3000)
```

And go to this URL: `http://localhost:3000` - 🎉

### `async` & `await`

<p><details>
  <summary><b>Examples</b></summary>
  <ul><li><a href="./examples/external-api-call">Fetch external api</a></li></ul>
</details></p>

Micri is built for usage with async/await. You can read more about async / await [here](https://zeit.co/blog/async-and-await)

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async (req, res) => {
  await sleep(500);
  return 'Ready!';
}
```

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
const {buffer, text, json} = require('micri')

module.exports = async (req, res) => {
  const buf = await buffer(req)
  console.log(buf)
  // <Buffer 7b 22 70 72 69 63 65 22 3a 20 39 2e 39 39 7d>
  const txt = await text(req)
  console.log(txt)
  // '{"price": 9.99}'
  const js = await json(req)
  console.log(js.price)
  // 9.99
  return ''
}
```

### Routing

Micri has a simple built-in function router. The idea is fairly simple, you can
use it as a wrapper virtually anywhere where it will be called with
`(req, res, optionalArgs)` and can return a promise as a response to `micri()`.

Firstly you create a router by calling the `router(...)` function. The router
function takes routes as arguments. Routes are created by calling functions
under `on` map, and the functions are organized there by HTTP method name. These
functions in turn take two arguments, a predicate and request handler functions.

A predicate function gets the usual arguments `(req, res, opts?)`. A predicate
function may return a truthy value if the handler function should take care of
this request, or it may return a falsy value if the handler should not take
this request.

The order of the route arguments marks the priority order of the routes.
Therefore if two routes would match to a request the one that was passed earlier
in the arguments list to the `router()` function will handle the request.

`otherwise()` is a special route function that will always match and thus can be
used as the last route rule for sending an error and avoid throwing an exception
in case no other route predicate matches.

```js
const { Router: { router } } = require('micri');

micri(router(
	on.get((req) => req.url === '/', (req, _res) => ({ message: 'Hello world!'})),
	on.post((req) => req.url === '/', (req) => text(req)),
	otherwise((req, res) => send(res, 400, 'Method Not Accepted'))))
	.listen(3000);
```

## API

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
const {send} = require('micri')

module.exports = async (req, res) => {
  const statusCode = 400
  const data = { error: 'Custom error message' }

  send(res, statusCode, data)
}
```

##### `send(res, statusCode, data = null)`

- Use `require('micri').send`.
- `statusCode` is a `Number` with the HTTP status code, and must always be supplied.
- If `data` is supplied it is sent in the response. Different input types are processed appropriately, and `Content-Type` and `Content-Length` are automatically set.
  - `Stream`: `data` is piped as an `octet-stream`. Note: it is _your_ responsibility to handle the `error` event in this case (usually, simply logging the error and aborting the response is enough).
  - `Buffer`: `data` is written as an `octet-stream`.
  - `object`: `data` is serialized as JSON.
  - `string`: `data` is written as-is.
- If JSON serialization fails (for example, if a cyclical reference is found), a `400` error is thrown. See [Error Handling](#error-handling).

##### micri(fn)

- This function is exposed as the `default` export.
- Use `require('micri')`.
- Returns a [`http.Server`](https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_class_http_server) that uses the provided `function` as the request handler.
- The supplied function is run with `await`. So it can be `async`

##### sendError(req, res, error)

- Use `require('micri').sendError`.
- Used as the default handler for errors thrown.
- Automatically sets the status code of the response based on `error.statusCode`.
- Sends the `error.message` as the body.
- Stacks are printed out with `console.error` and during development (when `NODE_ENV` is set to `'development'`) also sent in responses.
- Usually, you don't need to invoke this method yourself, as you can use the [built-in error handling](#error-handling) flow with `throw`.

## Error Handling

Micri allows you to write robust microservices. This is accomplished primarily
by bringing sanity back to error handling and avoiding callback soup.

If an error is thrown and not caught by you, the response will automatically be
`500`. **Important:** Error stacks will be printed as `console.error` and during
development mode (if the env variable `NODE_ENV` is `'development'`), they will
also be included in the responses.

If the error object throw is an instance of `MicriError` the `message`,
`statusCode` and `code` properties of the object are used for the HTTP response.

Let's say you want to write a rate limiting module:

```js
const rateLimit = require('my-rate-limit')

micri((req, res) => {
  await rateLimit(req);
  // ... your code
}).listen(3000);
```

If the API endpoint is abused, it can throw a `MicriError` like so:

```js
if (tooMany) {
  throw MicriError(429, 'rate_limited' 'Rate limit exceeded');
}
```

The nice thing about this model is that the `statusCode` is merely a suggestion.
The user can override it:

```js
try {
  await rateLimit(req)
} catch (err) {
  if (429 == err.statusCode) {
    // perhaps send 500 instead?
    send(res, 500);
  }
}
```

If the error is based on another error that **Micri** caught, like a `JSON.parse`
exception, then `originalError` will point to it. If a generic error is caught,
the status will be set to `500`.

In order to set up your own error handling mechanism, you can use composition in
your handler:

```js
const {send} = require('micri');

const handleErrors = fn => async (req, res) => {
  try {
    return await fn(req, res)
  } catch (err) {
    console.log(err.stack)
    send(res, 500, 'My custom error!')
  }
}

micri(handleErrors(async (req, res) => {
  throw new Error('What happened here?')
})).listen(3000);
```

## Contributing

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Link the package to the global module directory: `npm link`
3. Within the module you want to test your local development instance of Micri, just link it to the dependencies: `npm link micri`. Instead of the default one from npm, node will now use your clone of Micri!
