# micro-core

The core micro API. Designed for production use, or for packages to
extract dependencies with a minimal footprint.

It avoids dependencies as much as possible for fast downloads.

For the complete package, API and transpilation runtime look at
[micro](https://github.com/zeit/micro).

## micro-serve

This package ships with `micro-serve` installed in `bin`.
Point it to a module that exports a `micro` request handler:

```bash
$ micro-serve -h
usage: micro-serve [-h host] [-p port] <file>

$ micro-serve -p 3000 index.js
Listening on *:3000
```
