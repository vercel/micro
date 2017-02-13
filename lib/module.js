/* eslint import/no-dynamic-require: 0 */
const transform = require('./transform')

module.exports = file => {
  let mod

  try {
    mod = require(file)
  } catch (_) {
    try {
      mod = transform({file})
    } catch (err) {
      console.error(`micro: Error when importing ${file}: ${err.stack}`)
      process.exit(1)
    }
  } finally {
    if (mod && typeof mod === 'object') {
      mod = mod.default
    }
  }

  if (typeof mod !== 'function') {
    console.error(`micro: "${file}" does not export a function.`)
    process.exit(1)
  }

  return mod
}
