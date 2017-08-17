// Utilities
const logError = require('./error')

module.exports = file => {
  let mod

  try {
    // eslint-disable-next-line import/no-dynamic-require
    mod = require(file)

    if (mod && typeof mod === 'object') {
      mod = mod.default
    }
  } catch (err) {
    logError(`Error when importing ${file}: ${err.stack}`, 'invalid-entry')

    if (
      err instanceof SyntaxError &&
      /\s+async\s+/.test(err.stack) &&
      Number(process.versions.node.split('.')[0]) < 8
    ) {
      logError(
        'In order for `async` & `await` to work, you need to use at least Node.js 8!',
        'old-node-version'
      )
    }

    process.exit(1)
  }

  if (typeof mod !== 'function') {
    logError(`The file "${file}" does not export a function.`, 'no-export')
    process.exit(1)
  }

  return mod
}
