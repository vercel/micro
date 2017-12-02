const fetch = require('node-fetch')

module.exports = async function (req, res) {
  const response = await fetch('https://api.example.com')
  const json = await response.json()

  return json
}
