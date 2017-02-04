#!/usr/bin/env node

// Native
const {resolve} = require('path')

// Packages
const args = require('args')
const asyncToGen = require('async-to-gen/register')
const updateNotifier = require('update-notifier')
const nodeVersion = require('node-version')

// Ours
const pkg = require('../package')

args
  .option('port', 'Port to listen on', 3000)
  .option(['H', 'host'], 'Host to listen on', '0.0.0.0')

const flags = args.parse(process.argv)
let file = args.sub[0]

// Throw an error if node version is too low
if (nodeVersion.major < 6) {
  console.error(`Error! Micro requires at least version 6 of Node. Please upgrade!`)
  process.exit(1)
}

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

// Support for keywords "async" and "await"
const pathSep = process.platform === 'win32' ? '\\\\' : '/'

asyncToGen({
  includes: new RegExp(`.*micro?${pathSep}(lib|bin)|${file}.*`),
  excludes: null,
  sourceMaps: false
})

// Let user know if there's an update
// This isn't important when deployed to Now
if (!process.env.NOW && pkg.dist) {
  updateNotifier({pkg}).notify()
}

// Load package core with async/await support
const serve = require('../')

let mod

try {
  mod = require(file)

  if (mod && 'object' === typeof mod) {
    mod = mod.default
  }
} catch (err) {
  console.error(`micro: Error when importing ${file}: ${err.stack}`)
  process.exit(1)
}

if ('function' !== typeof mod) {
  console.error(`micro: "${file}" does not export a function.`)
  process.exit(1)
}

serve(mod).listen(flags.port, flags.host, err => {
  if (err) {
    console.error('micro:', err.stack)
    process.exit(1)
  }

  console.log(`> Ready! Listening on http://${flags.host}:${flags.port}`)
})
