const green = text => `\x1b[32m${text}\x1b[0m`

module.exports = unknown => {
  let usage = ''

  if (unknown) {
    usage += `The option "${unknown}" is unknown. Use one of these:`
    usage += '\n'
  }

  usage += `\n  Usage: ${green('micro')} [options] [command]

  Options:

    ${green('-p, --port <n>')}  Port to listen on (defaults to 3000)
    ${green('-v, --version')}   Output the version number
    ${green('-h, --help')}      Show the usage information
  `

  return usage
}
