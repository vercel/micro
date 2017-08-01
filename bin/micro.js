#!/usr/bin/env node

// Native
const path = require('path')
const { existsSync } = require('fs')

// Packages
const parseArgs = require('mri')

// Utilities
const serve = require('../lib')
const handle = require('../lib/handler')
const generateHelp = require('../lib/help')
const { version } = require('../package')
const logError = require('../lib/error')

// Check if the user defined any options
const flags = parseArgs(process.argv.slice(2), {
  default: {
    host: '::',
    port: 3000
  },
  alias: {
    p: 'port',
    H: 'host',
    h: 'help',
    v: 'version'
  },
  unknown(flag) {
    console.log(`The option "${flag}" is unknown. Use one of these:`)
    console.log(generateHelp())
    process.exit(1)
  }
})

// When `-h` or `--help` are used, print out
// the usage information
if (flags.help) {
  console.log(generateHelp())
  process.exit()
}

// Print out the package's version when
// `--version` or `-v` are used
if (flags.version) {
  console.log(version)
  process.exit()
}

let file = flags._[0]

if (!file) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const packageJson = require(path.resolve(process.cwd(), 'package.json'))
    file = packageJson.main || 'index.js'
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      logError(
        `Could not read \`package.json\`: ${err.message}`,
        'invalid-package-json'
      )
      process.exit(1)
    }
  }
}

if (!file) {
  logError('Please supply a file!', 'path-missing')
  process.exit(1)
}

if (file[0] !== '/') {
  file = path.resolve(process.cwd(), file)
}

if (!existsSync(file)) {
  logError(
    `The file or directory "${path.basename(file)}" doesn't exist!`,
    'path-not-existent'
  )
  process.exit(1)
}

const loadedModule = handle(file)
const server = serve(loadedModule)

server.on('error', err => {
  console.error('micro:', err.stack)
  process.exit(1)
})

server.listen(flags.port, flags.host, () => {
  const details = server.address()

  process.on('SIGTERM', () => {
    console.log('\nmicro: Gracefully shutting down. Please wait...')
    server.close(process.exit)
  })

  // `micro` is designed to run only in production, so
  // this message is perfectly for prod
  console.log(`micro: Accepting connections on port ${details.port}`)
})
