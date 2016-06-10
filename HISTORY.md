
4.1.1 / 2016-06-10
==================

  * fixing issues preventing `micro` cli to work properly [@julianduque]
  * package: add `resumer` [@rauchg]

4.1.0 / 2016-06-09
==================

  * add prepublish command to npm scripts [@julianduque]
  * replace `commander` with `args` (more lightweight) [@leo]
  * improvements to build process [@leo]

4.0.0 / 2016-06-07
==================

  * add support for returning or `send`ing `Buffer`, `Stream` [@kevin-roark]
  * add support host argument in micro(1) [@millette]
  * clean up babel config [@hzoo]

3.0.0 / 2016-06-02
==================

  * remove unneeded plugin in gulpfile [@rauchg]
  * fix lint warnings [@nkzawa]
  * explicit promise return test and doc [@kevin-roark]
  * add support for `return` any data which is json-encoded [@kevin-roark]
  * update micro-core to 0.3.0 [@kevin-roark]

2.1.0 / 2016-02-29
==================

  * faster production install with `micro-core` dep [@rauchg]

2.0.0 / 2016-02-29
==================

  * *always* log error stacks by default (even in prod) [@rauchg]
  * optimize `JSON.stringify` performance in V8 [@demoneaux]

1.0.4 / 2016-02-15
==================

  * package: bump babel

1.0.3 / 2016-02-04
==================

  * fix `bin/micro` in windows [@rauchg]
  * .travis: stop supporting node `0.10` [@rauchg]
  * README: installation instructions [@rauchg]

1.0.2 / 2016-02-03
==================

  * add `.travis.yml` [@rauchg]
  * README: add status badge [@rauchg]
  * package: bump `babel-eslint` for #10 [@rauchg]
  * index: improve `sendError` syntax style [@ccutch]
  * README: doc improvements [@shidhincr]
  * test: added test for body limit in error message [@rauchg]

1.0.1 / 2016-01-31
==================

  * micro: allow `[opts] <file>` [@rauchg]
  * json: add actual limit to 413 message [@dschenkelman]
  * README: fix typo [@werme]
  * sendError: pretty print json on dev environments [@coreh]

1.0.0 / 2016-01-29
==================

  * initial release [@rauchg]


