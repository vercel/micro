// Native
const path = require('path')

// Packages
const test = require('ava')
const handle = require('../lib/handler')

test('handle a PromiseInstance', async t => {
  const file = path.resolve('test/fixtures/native-promise-export')
  const result = await handle(file)
  t.is(typeof result, 'function')
})

test('handle an object that holds a PromiseInstance', async t => {
  const file = path.resolve('test/fixtures/babel-promise-export')
  const result = await handle(file)
  t.is(typeof result, 'function')
})
