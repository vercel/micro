#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const args = require('args')

args
  .option(
    'port',
    'Port to listen on',
    parseInt(process.env.PORT, 10) || 3000,
    Number
  )
  .option(['H', 'host'], 'Host to listen on', '0.0.0.0')
  .option(['s', 'silent'], 'Silent mode')

const flags = args.parse(process.argv, {
  minimist: {
    alias: {
      p: 'port',
      H: 'host',
      s: 'silent'
    },
    boolean: ['silent'],
    string: ['host']
  }
})

let file = args.sub[0]

if (!file) {
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const packageJson = require(path.resolve(process.cwd(), 'package.json'))
    file = packageJson.main || 'index.js'
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.error(`micro: Could not read \`package.json\`: ${err.message}`)
      process.exit(1)
    }
  }
}

if (!file) {
  console.error('micro: Please supply a file.')
}

if (file[0] !== '/') {
  file = path.resolve(process.cwd(), file)
}

require('../lib')(file, flags)
