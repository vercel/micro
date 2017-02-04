// Packages
const {copy} = require('copy-paste')
const ip = require('ip')
const chalk = require('chalk')

const copyToClipboard = async text => {
  try {
    await copy(text)
    return true
  } catch (err) {
    return false
  }
}

module.exports = async (server, current, inUse) => {
  const details = server.address()
  const ipAddress = ip.address()
  const url = `http://${ipAddress}:${details.port}`

  process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })

  if (!process.env.NOW) {
    let message = chalk.green('Micro is running!')

    if (inUse) {
      message += ' ' + chalk.red(`(on port ${inUse.old},` +
      ` because ${inUse.open} is already in use)`)
    }

    message += '\n\n'

    const localURL = `http://localhost:${details.port}`

    message += `• ${chalk.bold('Locally:        ')} ${localURL}\n`
    message += `• ${chalk.bold('On the Network: ')} ${url}\n\n`

    const copied = await copyToClipboard(localURL)

    if (copied) {
      message += `${chalk.grey('Copied local address to clipboard!')}\n\n`
    }

    process.stdout.write('\x1Bc')
    process.stdout.write(message)
  }
}
