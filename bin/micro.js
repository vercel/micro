#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const parseArgs = require('minimist')

// Check if the user defined any options
const flags = parseArgs(process.argv, {
  string: ['host', 'port'],
  boolean: ['silent'],
  alias: {
    p: 'port',
    H: 'host',
    s: 'silent'
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

require('../lib')(file, flags)
