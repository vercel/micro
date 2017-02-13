const {join} = require('path')
const test = require('ava')
const {coroutine} = require('bluebird')
const getModule = require('../lib/module')

const dir = join(__dirname, 'fixtures')

test('module (sync)', t => {
  const file = join(dir, 'foo.js')
  const fn = getModule(file)
  t.is(typeof fn, 'function')
  t.is(fn(), 'foo')
})

test('module (exports.default)', t => {
  const file = join(dir, 'bar.js')
  const fn = getModule(file)
  t.is(typeof fn, 'function')
  t.is(fn(), 'bar')
})

test('module (*func)', async t => {
  const file = join(dir, 'baz.js')
  const fn = getModule(file)
  t.is(typeof fn, 'function')
  t.is(fn.constructor.name, 'GeneratorFunction')
  t.is(await coroutine(fn)(), 'baz')
})

test('module (async)', async t => {
  const file = join(dir, 'bat.js')
  const fn = getModule(file)
  t.is(typeof fn, 'function')
  t.false(/async/.test(fn))
  t.false(/await/.test(fn))
  t.is(fn.constructor.name, 'GeneratorFunction')
  t.is(await coroutine(fn)(), 'bat')
})
