// Packages
const {copy} = require('copy-paste')
const ip = require('ip')
const chalk = require('chalk')
const boxen = require('boxen')

const copyToClipboard = async text => {
  try {
    await copy(text)
    return true
  } catch (err) {
    return false
  }
}

module.exports = async (server, inUse) => {
  const details = server.address()
  const ipAddress = ip.address()
  const url = `http://${ipAddress}:${details.port}`

  const isTTY = process.stdout.isTTY

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  if (!process.env.NOW) {
    let message = chalk.green('Micro is running!')

    if (inUse) {
      message += ' ' + chalk.red(`(on port ${inUse.open},` +
      ` because ${inUse.old} is already in use)`)
    }

    message += '\n\n'

    const localURL = `http://localhost:${details.port}`

    message += `• ${chalk.bold('Local:           ')} ${localURL}\n`
    message += `• ${chalk.bold('On Your Network: ')} ${url}\n\n`

    if (isTTY) {
      const copied = await copyToClipboard(localURL)

      if (copied) {
        message += `${chalk.grey('Copied local address to clipboard!')}`
      }
    }

    console.log(boxen(message, {
      padding: 1,
      borderColor: 'green',
      margin: 1
    }))
  }
}
