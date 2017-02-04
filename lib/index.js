// Packages
const detect = require('detect-port')

// Ours
const serve = require('./server')
const listening = require('./listening')

const getMod = file => {
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

module.exports = (file, flags) => {
  const server = serve(getMod(file))
  let port = flags.port

  detect(port).then(open => {
    let inUse = open !== port

    if (inUse) {
      port = open

      inUse = {
        old: flags.port,
        open
      }
    }

    server.listen(port, flags.host, async err => {
      if (err) {
        console.error('micro:', err.stack)
        process.exit(1)
      }

      return await listening(server, inUse)
    })
  })
}
