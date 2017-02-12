// Packages
const test = require('ava')
const request = require('request-promise')
const sleep = require('then-sleep')
const resumer = require('resumer')
const listen = require('test-listen')
const micro = require('../lib/server')

const {send, json} = micro

const getUrl = fn => {
  const srv = micro(fn)

  return listen(srv)
}

test('send(200, <String>)', async t => {
  const fn = function * (req, res) {
    send(res, 200, 'woot')
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, 'woot')
})

test('send(200, <Object>)', async t => {
  const fn = function * (req, res) {
    send(res, 200, {
      a: 'b'
    })
  }

  const url = await getUrl(fn)

  const res = await request(url, {
    json: true
  })

  t.deepEqual(res, {
    a: 'b'
  })
})

test('send(200, <Buffer>)', async t => {
  const fn = function * (req, res) {
    send(res, 200, new Buffer('muscle'))
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, 'muscle')
})

test('send(200, <Stream>)', async t => {
  const fn = function * (req, res) {
    send(res, 200, 'waterfall')
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, 'waterfall')
})

test('send(<Number>)', async t => {
  const fn = function * (req, res) {
    send(res, 404)
  }

  const url = await getUrl(fn)

  try {
    await request(url)
  } catch (err) {
    t.deepEqual(err.statusCode, 404)
  }
})

test('return <String>', async t => {
  const fn = function * () {
    return 'woot'
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, 'woot')
})

// test('return <Promise>', async t => {
//   const fn = () => new Promise(resolve => {
//     // yield sleep(100)
//     resolve('I Promise')
//   })

//   const url = await getUrl(fn)
//   const res = await request(url)

//   t.deepEqual(res, 'I Promise')
// })

// test('sync return <String>', async t => {
//   const fn = () => 'argon'

//   const url = await getUrl(fn)
//   const res = await request(url)

//   t.deepEqual(res, 'argon')
// })

test('return empty string', async t => {
  const fn = function * () {
    return ''
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, '')
})

test('return <Object>', async t => {
  const fn = function * () {
    return {
      a: 'b'
    }
  }

  const url = await getUrl(fn)
  const res = await request(url, {
    json: true
  })

  t.deepEqual(res, {
    a: 'b'
  })
})

test('return <Buffer>', async t => {
  const fn = function * () {
    return new Buffer('Hammer')
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, 'Hammer')
})

test('return <Stream>', async t => {
  const fn = function * () {
    return resumer().queue('River').end()
  }

  const url = await getUrl(fn)
  const res = await request(url)

  t.deepEqual(res, 'River')
})

test('throw with code', async t => {
  const fn = function * () {
    yield sleep(100)
    const err = new Error('Error from test (expected)')
    err.statusCode = 402
    throw err
  }

  const url = await getUrl(fn)

  try {
    await request(url)
  } catch (err) {
    t.deepEqual(err.statusCode, 402)
  }
})

test('throw (500)', async t => {
  const fn = function * () {
    throw new Error('500 from test (expected)')
  }

  const url = await getUrl(fn)

  try {
    await request(url)
  } catch (err) {
    t.deepEqual(err.statusCode, 500)
  }
})

test('send(200, <Stream>) with error on same tick', async t => {
  const fn = function * (req, res) {
    const stream = resumer().queue('error-stream')
    send(res, 200, stream)

    stream.emit('error', new Error('500 from test (expected)'))
    stream.end()
  }

  const url = await getUrl(fn)

  try {
    await request(url)
    t.fail()
  } catch (err) {
    t.deepEqual(err.statusCode, 500)
  }
})

// test('custom error', async t => {
//   const fn = function * () {
//     sleep(50)
//     throw new Error('500 from test (expected)')
//   }

//   const handleErrors = fn => function * (req, res) {
//     try {
//       return fn(req, res)
//     } catch (err) {
//       send(res, 200, 'My custom error!')
//     }
//   }

//   const url = await getUrl(handleErrors(fn))
//   const res = await request(url)

//   t.deepEqual(res, 'My custom error!')
// })

test('custom async error', async t => {
  const fn = function * () {
    sleep(50)
    throw new Error('500 from test (expected)')
  }

  const handleErrors = fn => function * (req, res) {
    try {
      return yield fn(req, res)
    } catch (err) {
      send(res, 200, 'My custom error!')
    }
  }

  const url = await getUrl(handleErrors(fn))
  const res = await request(url)

  t.deepEqual(res, 'My custom error!')
})

test('json parse error', async t => {
  const fn = function * (req, res) {
    const body = yield json(req)
    send(res, 200, body.woot)
  }

  const url = await getUrl(fn)

  try {
    await request(url, {
      method: 'POST',
      body: '{ "bad json" }',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    t.deepEqual(err.statusCode, 400)
  }
})

test('json', async t => {
  const fn = function * (req, res) {
    const body = yield json(req)

    send(res, 200, {
      response: body.some.cool
    })
  }

  const url = await getUrl(fn)

  const body = await request(url, {
    method: 'POST',
    body: {
      some: {
        cool: 'json'
      }
    },
    json: true
  })

  t.deepEqual(body.response, 'json')
})

test('json limit (below)', async t => {
  const fn = function * (req, res) {
    const body = yield json(req, {
      limit: 100
    })

    send(res, 200, {
      response: body.some.cool
    })
  }

  const url = await getUrl(fn)

  const body = await request(url, {
    method: 'POST',
    body: {
      some: {
        cool: 'json'
      }
    },
    json: true
  })

  t.deepEqual(body.response, 'json')
})

test('json limit (over)', async t => {
  const fn = function * (req, res) {
    let body

    try {
      body = yield json(req, {
        limit: 3
      })
    } catch (err) {
      t.deepEqual(err.statusCode, 413)
    }

    send(res, 200, {
      response: body.some.cool
    })
  }

  await getUrl(fn)
})

test('json circular', async t => {
  const fn = function * (req, res) {
    const obj = {
      circular: true
    }

    obj.obj = obj
    send(res, 200, obj)
  }

  const url = await getUrl(fn)

  try {
    await request(url, {
      json: true
    })
  } catch (err) {
    t.deepEqual(err.statusCode, 500)
  }
})

// test('no async', async t => {
//   const fn = (req, res) => {
//     send(res, 200, {
//       a: 'b'
//     })
//   }

//   const url = await getUrl(fn)
//   const obj = await request(url, {
//     json: true
//   })

//   t.deepEqual(obj.a, 'b')
// })

test('limit included in error', async t => {
  const fn = function * (req, res) {
    let body

    try {
      body = yield json(req, {
        limit: 3
      })
    } catch (err) {
      t.truthy(/exceeded 3 limit/.test(err.message))
    }

    send(res, 200, {
      response: body.some.cool
    })
  }

  await getUrl(fn)
})
