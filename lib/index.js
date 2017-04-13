// Packages
const getPort = require('get-port')

// Ours
const serve = require('./server')
const listening = require('./listening')
const getModule = require('./module')

module.exports = async (file, flags, module = getModule(file)) => {
  const server = serve(module)

  let port = flags.port
  let host = flags.host

  const open = await getPort(port)
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

  server.on('error', err => {
    console.error('micro:', err.stack)

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  })

  server.listen(port, host, () => {
    return listening(server, inUse, flags.silent)
  })
}
