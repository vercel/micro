// Native
const {resolve} = require('path')

// Packages
const isAsyncSupported = require('is-async-supported')
const asyncToGen = require('async-to-gen/register')

// Support for keywords "async" and "await"
if (!isAsyncSupported()) {
  const path = resolve(__dirname, './server')

  asyncToGen({
    includes: new RegExp(`.*${path}.*`),
    excludes: null,
    sourceMaps: false
  })
}

module.exports = require('./server')
