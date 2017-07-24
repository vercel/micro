![](https://raw.githubusercontent.com/zeit/art/31913be3107827adf10e1f491ec61480f63e19af/micro/logo.png)

_**Micro —** Async ES6 HTTP microservices_

[![Build Status](https://travis-ci.org/zeit/micro.svg?branch=master)](https://travis-ci.org/zeit/micro)
[![Coverage Status](https://coveralls.io/repos/github/zeit/micro/badge.svg?branch=master)](https://coveralls.io/github/zeit/micro?branch=master)
[![Slack Channel](http://zeit-slackin.now.sh/badge.svg)](https://zeit.chat/)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

## Features

* **Easy**: Designed for usage with `async` and `await` ([more](https://zeit.co/blog/async-and-await))
* **Fast**: Ultra-high performance (even JSON parsing is opt-in)
* **Micro**: The whole project is ~260 lines of code
* **Agile**: Super easy deployment and containerization
* **Simple**: Oriented for single purpose modules (function)
* **Standard**: Just HTTP!
* **Explicit**: No middleware - modules declare all dependencies
* **Lightweight**: With all dependencies, the package weighs less than a megabyte

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
module.exports = (req, res) => {
  res.end('Welcome to Micro')
}
```

Micro provides [useful helpers](https://github.com/zeit/micro#body-parsing) but also handles return values – so you can write it even shorter!

```js
module.exports = () => 'Welcome to Micro'
```

Once all of that is done, just start the server:

```bash
npm start
```

And go to this URL: `http://localhost:3000` - 🎉

## Documentation

Check out our [Wiki](https://github.com/zeit/micro/wiki) for details on how to use `micro`. In addition, you can find a list of helpful plugins for this package on [this list](https://github.com/amio/awesome-micro).

## Contribute

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Link the package to the global module directory: `npm link`
3. Transpile the source code and watch for changes: `npm start`
4. Within the module you want to test your local development instance of Micro, just link it to the dependencies: `npm link micro`. Instead of the default one from npm, node will now use your clone of Micro!

As always, you can run the [AVA](https://github.com/sindresorhus/ava) and [ESLint](http://eslint.org) tests using: `npm test`

## Credits

Thanks Tom Yandell and Richard Hodgson for donating the  `micro` npm name.

## Authors

- Guillermo Rauch ([@rauchg](https://twitter.com/rauchg)) - [▲ZEIT](https://zeit.co)
- Leo Lamprecht ([@notquiteleo](https://twitter.com/notquiteleo)) - [▲ZEIT](https://zeit.co)
