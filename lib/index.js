// Packages
const detect = require('detect-port')

// Ours
const serve = require('./server')
const listening = require('./listening')
const getModule = require('./module')

module.exports = async (file, flags, module = getModule(file)) => {
  const server = serve(module)

  let port = flags.port
  let host = flags.host

  const open = await detect(port)
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

  server.listen(port, host, err => {
    if (err) {
      console.error('micro:', err.stack)
      process.exit(1)
    }

    return listening(server, inUse, flags.silent)
  })
}
