module.exports = file => {
  let mod

  try {
    // eslint-disable-next-line import/no-dynamic-require
    mod = require(file)

    if (mod && typeof mod === 'object') {
      mod = mod.default
    }
  } catch (err) {
    console.error(`micro: Error when importing ${file}: ${err.stack}`)
    process.exit(1)
  }

  if (typeof mod !== 'function') {
    console.error(`micro: "${file}" does not export a function.`)
    process.exit(1)
  }

  return mod
}
