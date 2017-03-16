// Packages
const test = require('ava')
const request = require('request-promise')
const listen = require('test-listen')

process.env.NODE_ENV = 'development'
const micro = require('../lib/server')

const getUrl = fn => {
  const srv = micro(fn)

  return listen(srv)
}

test('send(200, <Object>) is pretty-printed', async t => {
  const fn = () => {
    return {woot: 'yes'}
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, `{\n  "woot": "yes"\n}`)
})
