#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const parseArgs = require('nanomist')

// Utilities
const serve = require('../lib')
const handle = require('../lib/handler')

// Check if the user defined any options
const flags = parseArgs(process.argv, {
  string: ['host', 'port'],
  boolean: ['help'],
  alias: {
    p: 'port',
    H: 'host',
    h: 'help'
  }
})

let file = flags._[2]

if (!file) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const packageJson = require(path.resolve(process.cwd(), 'package.json'))
    file = packageJson.main || 'index.js'
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.error(`Could not read \`package.json\`: ${err.message}`)
      process.exit(1)
    }
  }
}

if (!file) {
  console.error('Please supply a file!')
  process.exit(1)
}

if (file[0] !== '/') {
  file = path.resolve(process.cwd(), file)
}

const loadedModule = handle(file)
const server = serve(loadedModule)

let host = flags.host

if (host === '0.0.0.0') {
  host = null
}

server.on('error', err => {
  console.error('micro:', err.stack)

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1)
})

server.listen(flags.port, host, () => {
  const details = server.address()
  const url = `http://localhost:${details.port}`

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  if (!process.env.NOW) {
    console.log(`Micro is running: ${url}`)
  }
})
