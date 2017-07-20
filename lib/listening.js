module.exports = async server => {
  const details = server.address()
  const url = `http://localhost:${details.port}`

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  if (!process.env.NOW) {
    console.log(`Micro is running: ${url}`)
  }
}
