#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const updateNotifier = require('update-notifier')
const nodeVersion = require('node-version')
const args = require('args')
const isAsyncSupported = require('is-async-supported')

// Ours
const pkg = require('../package')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(
    `Error! Micro requires at least version 6 of Node. Please upgrade!`
  )
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW && pkg.dist) {
  updateNotifier({ pkg }).notify()
}

args
  .option('port', 'Port to listen on', process.env.PORT || 3000, Number)
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
  args.showHelp()
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
