module.exports = async (server, host, silent) => {
  if (!host) {
    host = 'localhost'
  }

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  const details = server.address()

  if (!(silent || process.env.NOW)) {
    console.log(`> Ready! Listening on http://${host}:${details.port}`)
  }
}
