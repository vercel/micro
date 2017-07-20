// Ours
const serve = require('./server')
const listening = require('./listening')
const getModule = require('./module')

module.exports = async (file, flags, module = getModule(file)) => {
  const server = serve(module)
  let host = flags.host

  if (host === '0.0.0.0') {
    host = null
  }

  server.on('error', err => {
    console.error('micro:', err.stack)

    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  })

  server.listen(flags.port, host, listening.bind(this, server))
}
