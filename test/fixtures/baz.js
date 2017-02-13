const sleep = require('then-sleep')

module.exports = function * () {
	yield sleep(50)
	return Promise.resolve('baz')
}
