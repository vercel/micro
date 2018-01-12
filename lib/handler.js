// Utilities
const logError = require('./error')

module.exports = async file => {
  let mod

  try {
    // eslint-disable-next-line import/no-dynamic-require
    mod = await require(file) // Await to support exporting Promises

    if (mod && typeof mod === 'object') {
      mod = await mod.default // Await to support es6 module's default export
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
