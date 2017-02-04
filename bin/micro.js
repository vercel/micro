#!/usr/bin/env node

// Native
const {resolve} = require('path')

// Packages
const asyncToGen = require('async-to-gen/register')
const updateNotifier = require('update-notifier')
const nodeVersion = require('node-version')
const args = require('args')
const isAsyncSupported = require('is-async-supported')

// Ours
const pkg = require('../package')

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(`Error! Micro requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW && pkg.dist) {
  updateNotifier({pkg}).notify()
}

args
  .option('port', 'Port to listen on', process.env.PORT || 3000)
  .option(['H', 'host'], 'Host to listen on', '0.0.0.0')

const flags = args.parse(process.argv)
let file = args.sub[0]

if (!file) {
  try {
    const packageJson = require(resolve(process.cwd(), 'package.json'))
    file = packageJson.main || 'index.js'
  } catch (err) {
    if ('MODULE_NOT_FOUND' !== err.code) {
      console.error(`micro: Could not read \`package.json\`: ${err.message}`)
      process.exit(1)
    }
  }
}

if (!file) {
  console.error('micro: Please supply a file.')
  args.showHelp()
}

if ('/' !== file[0]) {
  file = resolve(process.cwd(), file)
}

if (!isAsyncSupported()) {
  // Support for keywords "async" and "await"
  const pathSep = process.platform === 'win32' ? '\\\\' : '/'

  asyncToGen({
    includes: new RegExp(`.*micro?${pathSep}(lib|bin)|${file}.*`),
    excludes: null,
    sourceMaps: false
  })
}

// Load package core with async/await support
// If needed... Otherwise use the native implementation
require('../lib/index')(file, flags)
