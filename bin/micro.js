#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const nodeVersion = require('node-version')
const args = require('yargs-parser')
const isAsyncSupported = require('is-async-supported')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(
    `Error! Micro requires at least version 6 of Node. Please upgrade!`
  )
  process.exit(1)
}

const flags = args(process.argv.slice(2), {
  alias: {
    port: 'p',
    host: 'H',
    silent: 's',
    help: 'h'
  },
  boolean: ['silent'],
  string: ['host'],
  default: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  }
})

function help() {
  console.log(`Usage: micro [opts] <file>
  -H, --host    Host to listen on   [0.0.0.0]
  -p, --port    Port to listen on      [3000]
  -s, --silent  Silent mode
  -h, --help    Show this help message`)
  process.exit(0)
}

if (flags.h) {
  help()
}

let [file] = flags._

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
  help()
}

if (file[0] !== '/') {
  file = path.resolve(process.cwd(), file)
}

if (!isAsyncSupported()) {
  const asyncToGen = require('async-to-gen/register')
  // Support for keywords "async" and "await"
  const pathSep = process.platform === 'win32' ? '\\\\' : '/'
  const directoryName = path.parse(path.join(__dirname, '..')).base

  // This is required to make transpilation work on Windows
  const fileDirectoryPath = path.parse(file).dir.split(path.sep).join(pathSep)

  asyncToGen({
    includes: new RegExp(
      `.*${directoryName}?${pathSep}(lib|bin)|${fileDirectoryPath}.*`
    ),
    excludes: null,
    sourceMaps: false
  })
}

// Load package core with async/await support
// If needed... Otherwise use the native implementation
require('../lib')(file, flags)
