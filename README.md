# micro-cli

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
