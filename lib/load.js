// Native
const {resolve} = require('path')

// Packages
const isAsyncSupported = require('is-async-supported')

// Support for keywords "async" and "await"
if (!isAsyncSupported()) {
  const path = resolve(__dirname, './server')

  require('async-to-gen/register')({
    includes: new RegExp(`.*${path}.*`),
    excludes: null,
    sourceMaps: false
  })

  delete require.cache[require.resolve('async-to-gen/register')]
}

module.exports = require('./server')
