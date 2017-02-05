module.exports = file => {
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

  return mod
}
