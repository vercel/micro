#!/usr/bin/env node

// Native
const path = require('path')

// Packages
const updateNotifier = require('update-notifier')
const nodeVersion = require('node-version')
const args = require('args')

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

require('../lib')(file, flags)
