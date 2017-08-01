// Native
const vm = require('vm')

// Utilities
const logError = require('./error')

const checkAsyncAwait = () => {
  try {
    // eslint-disable-next-line no-new
    new vm.Script('(async () => ({}))()')
    return true
  } catch (err) {
    return false
  }
}

module.exports = file => {
  let mod

  try {
    // eslint-disable-next-line import/no-dynamic-require
    mod = require(file)

    if (mod && typeof mod === 'object') {
      mod = mod.default
    }
  } catch (err) {
    if (!checkAsyncAwait()) {
      logError(
        'In order for `async` & `await` to work, you need to use at least Node.js 8!',
        'old-node-version'
      )
      process.exit(1)
    }

    logError(`Error when importing ${file}: ${err.stack}`, 'invalid-entry')
    process.exit(1)
  }

  if (typeof mod !== 'function') {
    logError(`The file "${file}" does not export a function.`, 'no-export')
    process.exit(1)
  }

  return mod
}
