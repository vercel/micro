// Packages
const detect = require('detect-port')

// Ours
const serve = require('./server')
const listening = require('./listening')
const getModule = require('./module')

module.exports = (file, flags, module = getModule(file)) => {
  const server = serve(module)

  let port = flags.port
  let host = flags.host

  detect(port).then(open => {
    let inUse = open !== port

    if (inUse) {
      port = open

      inUse = {
        old: flags.port,
        open
      }
    }

    if (host === '0.0.0.0') {
      host = null
    }

    server.listen(port, host, async err => {
      if (err) {
        console.error('micro:', err.stack)
        process.exit(1)
      }

      return await listening(server, inUse)
    })
  })
}
