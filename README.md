![](https://cldup.com/JDmmHX3uhF.svg)

_**Micro CLI —** The command line utility for managing [micro]services_

[![Build Status](https://travis-ci.org/zeit/micro-cli.svg?branch=master)](https://travis-ci.org/zeit/micro-cli)
[![npm version](https://badge.fury.io/js/micro-cli.svg)](https://npmjs.com/micro-cli)
[![Slack](https://zeit-slackin.now.sh/badge.svg)](http://zeit-community.slack.com)

## Usage

```

  Usage: micro [options] [command]

  Commands:

    help  Display help

  Options:

    -h, --help          Output usage information
    -H, --host [value]  Host to listen on
    -n, --no-babel      Skip Babel transformation
    -p, --port <n>      Port to listen on
    -v, --version       Output the version number
```

By default, `micro` will transpile the target file and its relative dependencies so that `async`/`await` and [ES6](http://rauchg.com/2015/ecmascript-6/) work for you.

For production, we recommend you first transpile and use `--no-babel` to make bootup time much faster. That said, if you don't care about how long it takes to boot, the default flags are perfectly suitable for production.

Read more about [Transpilation](#transpilation) to understand what transformations are recommended.

## Contribute

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Uninstall now-serve if it's already installed: `npm uninstall -g micro`
3. Link it to the global module directory: `npm link`
4. Transpile the source code and watch for changes: `npm start`

## Credits

- Copyright © 2016 Zeit, Inc and project authors.
- Licensed under MIT.
- ▲
