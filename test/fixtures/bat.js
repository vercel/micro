const sleep = require('then-sleep')

module.exports = async () => {
	await sleep(50)
	return 'bat'
}
